import * as THREE from 'three';
import { ANIM, PLAYER, PITCH, GOAL, PASS, SHOT, ATTR, THROUGH, CROSS, FORMATIONS, FORMATION_ROLES, KICK, BALL, DUEL } from './config.js';
import { playerParams } from './attributes.js';
import { Avatar } from './avatar.js';
import { Locomotion } from './anim.js';
import { pickTransition, stopTime, rootPath, distAt, timeAtDist, timeAtSpeed } from './anim-pick.js';
import { rollSpeedFor, rollSpeedIn, rollTime, loftFor } from './ball.js';

const HL = PITCH.length / 2;
const HW = PITCH.width / 2;
const GOAL_HW = GOAL.width / 2;
const TAU = Math.PI * 2;

function wrap(a) {
  a %= TAU;
  if (a > Math.PI) a -= TAU;
  if (a < -Math.PI) a += TAU;
  return a;
}

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// Circa normale, media 0 e deviazione 1: basta per gli errori di mira.
function gauss() {
  return (Math.random() + Math.random() + Math.random() - 1.5) * 2;
}

// Numero intero stabile da una stringa: stesso giocatore, stesse varianti delle clip.
function seedOf(str) {
  let h = 7;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// Nel verso di +z la maglia mostra il petto: rotation.y = heading porta
// il petto nella direzione (sin h, cos h).
export function headingOf(dx, dz) { return Math.atan2(dx, dz); }

export class Player {
  constructor(data, kit, tpl, material, shadowTex, attackDir) {
    this.data = data;
    this.id = data.id ?? null;
    this.name = data.name || '';
    this.number = data.number;
    this.attackDir = attackDir;
    this.params = playerParams(data);
    this.pos = new THREE.Vector3();
    this.prev = new THREE.Vector3();
    this.anchor = new THREE.Vector3();        // posizione di gioco disegnata (anello, ombra): pos interpolata
    this.vel = new THREE.Vector3();
    this.heading = headingOf(attackDir, 0);   // busto
    this.moveHeading = this.heading;          // direzione della corsa
    this.prevHeading = this.heading;
    this.speed = 0;
    this.sprinting = false;
    this.touchPhase = 0;
    this.knockTimer = 0;
    this.stagger = 0;          // secondi sbilanciato dopo un contrasto a vuoto
    this.burst = 0;            // secondi di allungo dopo aver saltato l'uomo
    this.shield = 0;           // protezione della palla: 1 tenuta a destra, -1 a sinistra

    this.team = null;          // 'home' | 'away'
    this.role = String(data.role || '').toUpperCase();
    this.keeper = false;
    this.action = null;        // gesto in corso (main.js): calcio, finta, contrasto...
    this.sideSpeed = 0;        // portiere: velocita' laterale per il passo laterale
    this.wantSpeed = 0;        // ultima corsa voluta (drive): velocita' e direzione, per partenze e arresti
    this.wantDir = this.heading;
    this.transCool = 0;        // secondi prima della prossima partenza, arresto o svolta
    this.trans = null;         // transizione in corso: { one, role, drive } (transition)

    this.avatar = new Avatar(tpl, material, data.number, kit.primary);
    this.mesh = this.avatar.object;
    // imbardata, poi inclinazione in avanti (x) e di lato (z) attorno ai piedi
    this.mesh.rotation.order = 'YXZ';
    // blend space della corsa; il seme sceglie fra clip simili, diverso per giocatore
    this.gait = new Locomotion(tpl, seedOf(String(data.id ?? '') + '#' + (data.number ?? '') + (data.name || '')));
    this.faceVel = 0;          // velocita' angolare del busto (rad/s)
    this.shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })
    );
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.renderOrder = 2;
    const s = PLAYER.radius * 3.2;
    this.shadow.scale.set(s, s, 1);
  }

  place(x, z, heading) {
    this.pos.set(x, 0, z);
    this.prev.copy(this.pos);
    this.vel.set(0, 0, 0);
    this.speed = 0;
    this.heading = this.prevHeading = this.moveHeading = heading;
    this.faceVel = 0;
    this.knockTimer = 0;
    this.stagger = this.burst = 0;
    this.press = null;
    // una partenza o un arresto in corso seguivano la distanza: senza la loro
    // transizione la clip restava ferma a peso pieno mentre il giocatore camminava
    if (this.trans) this.avatar.endGesture();
    this.trans = null;
    this.concedeWait = null;
    this.gait.reset();
    this.avatar.resetJumps();
  }

  // Gira di colpo il busto verso `h` (calcio piazzato, primo tocco orientato,
  // scivolata, caduta, stacco di testa). Busto prima e dopo il passo e corpo
  // visibile rispetto al busto (gait.yaw) si spostano insieme: il corpo
  // mostrato resta dov'era e raggiunge il busto alla sua velocita' (anim.js).
  // Cambiando solo heading, per un fotogramma il corpo mostrato saltava
  // dell'intera rotazione (0,87 rad nella punizione) e il bacino con lui.
  face(h) {
    const d = wrap(h - this.heading);
    this.heading = wrap(this.heading + d);
    this.prevHeading = wrap(this.prevHeading + d);
    this.gait.yaw = wrap(this.gait.yaw - d);
    this.gait.prevYaw = wrap(this.gait.prevYaw - d);
  }

  get dirX() { return Math.sin(this.heading); }
  get dirZ() { return Math.cos(this.heading); }

  // Un passo di movimento: (dx, dz) direzione voluta, mag 0..1.
  // o.face: il busto guarda questo vettore invece della direzione di corsa.
  // o.turnMul: sterzata piu' rapida (rincorsa del tiro). o.decel: frenata.
  // o.close: controllo stretto (R2), passi corti e lenti.
  drive(dt, dx, dz, mag, o = {}) {
    const P = this.params;
    this.prev.copy(this.pos);
    this.prevHeading = this.heading;
    // sbilanciato dopo un contrasto a vuoto: piu' lento e piu' rigido;
    // chi ha appena saltato l'uomo allunga il passo
    const off = this.stagger > 0 ? DUEL.staggerSpeed : 1;
    const top = P.maxSpeed * off * (this.burst > 0 ? DUEL.burstSpeed : 1);
    const slow = 1 - Math.min(1, this.speed / P.maxSpeed);
    const turn = (o.withBall ? P.turnRateBall : P.turnRate) * off * (1 + PLAYER.turnSlowBoost * slow) * (o.turnMul || 1) * dt;
    let want = 0;
    if (mag > 0) {
      const target = headingOf(dx, dz);
      // da fermi il primo passo va subito dove si vuole andare, anche all'indietro;
      // in corsa la curva ha un raggio credibile (accelerazione laterale massima)
      const bend = Math.min(turn, PLAYER.lateralAccel / Math.max(this.speed, 0.5) * dt);
      if (this.speed < PLAYER.pivotSpeed) this.moveHeading = target;
      else this.moveHeading = wrap(this.moveHeading + clamp(wrap(target - this.moveHeading), -bend, bend));
      const left = Math.abs(wrap(target - this.moveHeading));
      want = mag * top * (o.sprint && !o.close ? 1 : PLAYER.jogFactor) * (o.withBall ? P.dribbleSpeed : 1) * (o.close ? PLAYER.closeSpeed : 1);
      want *= Math.max(PLAYER.turnBrake, Math.cos(Math.min(left, Math.PI / 2)));
      // da fermi, verso un punto alle proprie spalle: prima ci si gira quasi
      // sul posto, poi si accelera (girarsi accelerando fa strisciare il piede)
      if (!o.face && this.speed < PLAYER.pivotRun && Math.abs(wrap(target - this.heading)) > PLAYER.pivotAngle) want = Math.min(want, PLAYER.pivotCap);
    }
    // Il busto segue la corsa o guarda o.face, come una molla con
    // accelerazione angolare limitata: parte e si ferma senza scatti.
    const faceTo = o.face ? headingOf(o.face.x, o.face.z) : this.moveHeading;
    const FR = PLAYER.faceRun, runMax = o.turnMul ? PLAYER.faceMax : PLAYER.faceMax + (FR[2] - PLAYER.faceMax) * clamp((this.speed - FR[0]) / (FR[1] - FR[0]), 0, 1);
    const ft = Math.min(runMax, turn * PLAYER.faceTurn / Math.max(dt, 1e-6));
    const wantVel = clamp(wrap(faceTo - this.heading) * PLAYER.faceGain, -ft, ft);
    this.faceVel += clamp(wantVel - this.faceVel, -PLAYER.faceAccel * dt, PLAYER.faceAccel * dt);
    const turnStep = this.faceVel * dt, gap = wrap(faceTo - this.heading);
    // mai oltre la direzione voluta
    this.heading = wrap(this.heading + (Math.abs(turnStep) > Math.abs(gap) && Math.sign(turnStep) === Math.sign(gap) ? gap : turnStep));
    if (o.face && Math.abs(wrap(this.moveHeading - this.heading)) > Math.PI / 4) want *= PLAYER.strafeSpeed;
    if (mag === 0 && !o.face && this.speed < 0.05) this.moveHeading = this.heading;

    this.sprinting = !!o.sprint && mag > 0;
    this.wantSpeed = want;
    this.wantDir = mag > 0 ? headingOf(dx, dz) : this.moveHeading;
    this.faceTo = faceTo;
    // Spinta forte alla partenza e dolce vicino al massimo; frenata piena in
    // corsa e piu' morbida all'ultimo passo.
    const run = Math.min(1, this.speed / Math.max(1, top));
    this.decel = o.decel || PLAYER.decel;     // frenata di questo passo (stopDistance)
    const rate = want > this.speed ? P.accel * (PLAYER.accelLow + (PLAYER.accelHigh - PLAYER.accelLow) * run)
      : this.decel * (PLAYER.decelLow + (1 - PLAYER.decelLow) * run);
    this.speed += clamp(want - this.speed, -rate * dt, rate * dt);
    this.vel.set(Math.sin(this.moveHeading) * this.speed, 0, Math.cos(this.moveHeading) * this.speed);
    this.pos.addScaledVector(this.vel, dt);
  }

  // Verso un punto: a passo da vicino, di corsa da lontano, in scatto da
  // molto lontano; frena per fermarsi li' e poi si gira verso `h`. true se arrivato.
  goTo(dt, x, z, h) {
    const dx = x - this.pos.x, dz = z - this.pos.z, d = Math.hypot(dx, dz);
    const face = h === undefined || h === null ? undefined : { x: Math.sin(h), z: Math.cos(h) };
    if (d < 0.2) { this.drive(dt, 0, 0, 0, face ? { face } : {}); return true; }
    const R = PLAYER.runBack;
    const pace = d > R[1] ? 1 : d > R[0] ? 0.8 : R[2];
    const brake = Math.sqrt(2 * PLAYER.decel * PLAYER.decelLow * d) / (this.params.maxSpeed * PLAYER.jogFactor);
    this.drive(dt, dx, dz, Math.min(pace, Math.max(0.12, brake)), { sprint: d > R[1], face: d < 1.5 ? face : undefined });
    return false;
  }

  // Dentro il recinto dei cartelloni e fuori dalla scatola delle porte.
  confine() {
    const p = this.pos, r = PLAYER.radius;
    const lx = HL + PITCH.runoff - PLAYER.fieldMargin, lz = HW + PITCH.runoff - PLAYER.fieldMargin;
    p.x = clamp(p.x, -lx, lx);
    p.z = clamp(p.z, -lz, lz);
    const ax = Math.abs(p.x), side = GOAL_HW + GOAL.postRadius + r;
    if (ax > HL - r && ax < HL + GOAL.depth + r && Math.abs(p.z) < side) {
      const s = Math.sign(p.x) || 1;
      const front = ax - (HL - r), back = HL + GOAL.depth + r - ax, lat = side - Math.abs(p.z);
      if (front <= back && front <= lat) p.x = s * (HL - r);
      else if (back <= lat) p.x = s * (HL + GOAL.depth + r);
      else p.z = (Math.sign(p.z) || 1) * side;
    }
  }

  sync(alpha, dt) {
    const m = this.mesh;
    this.anchor.lerpVectors(this.prev, this.pos, alpha);
    m.position.copy(this.anchor);
    // inclinazione in corsa: l'avatar la riduce quanto pesa il gesto (update)
    const lean = this.gait.leanAt(alpha);
    // il corpo puo' girarsi verso la corsa (anim.js, orientation warping)
    m.rotation.set(lean.pitch, this.prevHeading + wrap(this.heading - this.prevHeading) * alpha + this.gait.yawAt(alpha), lean.roll);
    this.shadow.position.set(this.anchor.x, 0.011, this.anchor.z);
    this.avatar.update(dt, this.gait, alpha);
  }

  // Dopo il movimento del passo di fisica: pesi e fase delle animazioni.
  animStep(dt) {
    this.gait.step(dt, this);
    this.transition(dt);
  }

  // Partenze, arresti e cambi di direzione con le clip della libreria, sopra
  // il blend tree (skill "Fluidita'"). Il movimento resta quello della
  // fisica: la clip si sceglie per rotazione e velocita'. Partenze e arresti
  // seguono la distanza percorsa (stepTransition); svolte e giri sul posto
  // si riproducono alla velocita' che fa coincidere i tempi con quelli del codice.
  transition(dt) {
    const T = ANIM.trans, av = this.avatar;
    // la transizione in corso: finita o sostituita da un altro gesto. Anche
    // mentre sfuma resta sua: un arresto che sfuma e un comando di corsa
    // diventano una partenza (l'attesa fra due transizioni la impediva e il
    // giocatore ripartiva in piedi, con la corsa del blend tree)
    if (this.trans && av.one !== this.trans.one) { this.trans = null; this.transCool = T.cooldown; }
    const redo = !!this.trans && this.stepTransition(dt, this.trans);
    if ((this.transCool -= dt) > 0 && !redo) return;
    const style = this.locoStyle === 'dribble' || this.locoStyle === 'normal' || this.locoStyle === 'defense' ? this.locoStyle : null;
    if (!style || (av.one && !redo) || this.action || this.down || this.keeper || this.sentOff || !av.tpl.lib) { if (redo) this.cutTransition(); return; }
    const tpl = av.tpl, g = this.gait, v = this.speed, want = this.wantSpeed;
    let e = null, from = 0, rate = 1, hold = 0, drive = null, role = null;
    const turn = wrap(this.wantDir - this.heading);
    // fermi: i pesi della corsa; ripartendo da un arresto la velocita' vera
    const still = redo ? v < T.restartBelow : g.blendSpeed < T.startBelow;
    if (style === 'defense') {
      // in guardia solo i giri sul posto verso il portatore; il resto e' il blend tree
    } else if (still && want > T.startWant && Math.abs(wrap(this.wantDir - this.moveHeading)) < 0.3) {
      // partenza verso `turn`, dal passo che ha la velocita' del giocatore
      e = pickTransition(tpl, this, 'start', style, { yaw: turn, vOut: Math.min(want, T.startTop) });
      const path = e && rootPath(tpl, e.name);
      if (path) {
        role = 'start';
        // i piedi si cercano solo dopo: prima la radice va piu' piano del giocatore
        const at = timeAtSpeed(path, Math.max(v, T.drive.onset));
        from = av.matchStart(e.name, at, at + T.drive.match, at);
        drive = { path, from, end: e.meta.dur, until: Infinity };
      } else e = null;
    } else if (!redo && v > T.stopAbove && want < T.stopWant) {
      // arresto: la radice della clip si ferma dove si ferma il codice
      // si ferma girandosi verso dove guardera' (la palla, il suo posto)
      const face = this.faceTo !== undefined ? wrap(this.faceTo - this.heading) : 0;
      e = pickTransition(tpl, this, 'stop', style, { yaw: Math.abs(face) > 0.6 ? face : 0, vIn: v, dir: wrap(this.moveHeading - this.heading) });
      const path = e && rootPath(tpl, e.name);
      if (path) {
        role = 'stop';
        const halt = stopTime(tpl, e.name), at = timeAtDist(path, Math.max(0, distAt(path, halt) - this.stopDistance()));
        // dal fotogramma con i piedi dove li ha il passo in corso: dal primo
        // fotogramma, con la gamba sbagliata avanti, a meta' della dissolvenza
        // il ginocchio girava di 0,42 rad in un passo e un piede entrava nell'erba
        from = av.matchStart(e.name, Math.max(0, at - T.drive.match), Math.min(halt, at + T.drive.match), at);
        drive = { path, from, end: Math.min(e.meta.dur, halt + T.stopTail), until: halt };
      } else e = null;
    }
    if (!e && !redo && style !== 'defense' && v > T.turnAbove && Math.abs(turn) > T.turnAngle && want > T.startWant) {
      // inversione in corsa: anche lei segue la distanza percorsa. La clip
      // gira piantando i piedi, la fisica fa una curva a 2-2,6 m/s: a tempo,
      // la posa della girata traslava. La rotazione che si vede e' quella del
      // gioco (la clip sta sul posto nel riferimento della sua radice)
      e = pickTransition(tpl, this, 'turn', style, { yaw: turn, vIn: v, dir: wrap(this.moveHeading - this.heading) });
      const path = e && e.meta.ev && e.meta.ev.turn && rootPath(tpl, e.name);
      if (path) {
        const tr = e.meta.ev.turn, at = Math.max(0, tr.from - T.lead);
        role = 'turn';
        from = av.matchStart(e.name, Math.max(0, at - T.drive.match), Math.min(tr.to, at + T.drive.match), at);
        drive = { path, from, end: Math.min(e.meta.dur, tr.to + T.turnTail), until: Infinity };
      } else e = null;
    } else if (!e && !redo && v < T.inPlaceBelow && want < T.inPlaceWant && this.faceTo !== undefined && Math.abs(wrap(this.faceTo - this.heading)) > (this.inPlaceMin ?? T.inPlaceAngle)) {
      // giro sul posto verso lo sguardo
      const yaw = wrap(this.faceTo - this.heading);
      e = pickTransition(tpl, this, 'turnInPlace', style === 'dribble' ? 'normal' : style, { yaw });
      if (e && e.meta.ev && e.meta.ev.turn) {
        const tr = e.meta.ev.turn, codeTurn = Math.abs(yaw) / PLAYER.faceMax + T.turnLag;
        role = 'turnInPlace';
        rate = clamp((tr.to - tr.from) / codeTurn, T.rate[0], T.inPlaceRate);
        from = Math.max(0, tr.from - T.lead * rate);
        hold = Math.min((e.meta.dur - from) / rate, (tr.to - from) / rate + T.stopTail);
      } else e = null;
    }
    if (drive) {
      drive.d0 = distAt(drive.path, from);
      drive.d = 0;
      drive.t = drive.prev = from;
      // limite di sicurezza: di norma la clip sfuma prima (stepTransition);
      // una svolta al massimo T.turnHold secondi
      hold = role === 'turn' ? T.turnHold : (drive.end - from) / T.drive.rate[0] + ANIM.fadeOut;
      rate = 0;
    }
    if (!e) { if (redo) this.cutTransition(); return; }
    // un arresto interrotto sfuma sotto la partenza (Avatar.playOnce) in
    // T.redoFade s: in 0,12 s la sua coda ferma traslava ancora per 4
    // fotogrammi; in 0,07 s, con pose molto diverse, le ossa giravano di 0,35
    // rad in un passo
    // un arresto entra in T.stopFade s: da 5 m/s in curva, in 0,12 s, il
    // ginocchio girava di 0,36 rad in un passo (l'arresto si sposta: niente posa ferma)
    // Un arresto gia' nella sua coda ferma (radice ferma) se ne va in T.cut s:
    // nel vuoto entra la corsa del blend tree, che ha i passi
    const old = redo && this.trans && this.trans.drive, tail = !!old && old.t >= old.until;
    av.playOnce(e.name, from, hold, rate, redo ? T.redoFade : role === 'stop' ? T.stopFade : T.fade, true, tail ? T.cut : redo ? T.redoFade : ANIM.chainFade);
    this.trans = { one: av.one, role, drive };
    av.one.drive = drive;
    this.transCool = T.cooldown;
  }

  // Un passo della transizione in corso. Partenze e arresti: il tempo della
  // clip e' quello in cui la sua radice ha fatto i metri fatti dal giocatore
  // (niente piede che scivola, niente corpo che resta indietro rispetto
  // all'anello), con il playback nei limiti di drive.rate; dopo il punto in
  // cui la radice si ferma, la coda dell'arresto va a velocita' normale.
  // true: la transizione va sostituita (un arresto o un giro sul posto
  // interrotti da una nuova corsa).
  stepTransition(dt, tr) {
    const T = ANIM.trans, want = this.wantSpeed, d = tr.drive;
    if (!tr.cut && (tr.role === 'stop' || tr.role === 'turnInPlace') && want > T.startWant) return true;
    // partenza lasciata subito: torna la corsa, dalla posa in cui e'. La clip
    // segue ancora la distanza: ferma per un passo, traslava sotto la corsa
    if (!tr.cut && tr.role === 'start' && want < T.stopWant) this.cutTransition();
    if (!d || !(dt > 0)) return false;
    d.prev = d.t;
    d.d += Math.hypot(this.pos.x - this.prev.x, this.pos.z - this.prev.z);
    // arresti e svolte, mentre la clip entra, al massimo drive.fadeRate: da
    // 7,5 m/s la clip correva a 2,2 volte e, fusa a meta' con lo scatto, il
    // ginocchio girava di 0,4 rad in un passo; il ritardo si recupera dopo.
    // Non le partenze: la fisica accelera subito e la clip deve seguirla.
    // Le svolte al massimo T.rate[1], come quando andavano a tempo
    const R = T.drive.rate, entering = tr.role !== 'start' && tr.one.t < tr.one.fade;
    const top = Math.min(R[1], entering ? T.drive.fadeRate : tr.role === 'turn' ? T.rate[1] : R[1]);
    let t = d.t < d.until ? timeAtDist(d.path, d.d0 + d.d) : d.t + dt;
    t = Math.min(d.end, clamp(t, d.t + R[0] * dt, d.t + top * dt));
    d.t = t;
    // la clip sfuma nella corsa prima del suo ultimo fotogramma: ferma li',
    // traslerebbe durante la dissolvenza
    const rate = (d.t - d.prev) / dt;
    // radice della clip gia' ferma e giocatore ancora in movimento (frenata
    // piu' lunga del previsto): la corsa riprende, la posa ferma traslerebbe.
    // Anche un arresto che non sta dietro alla fisica: frenando piano (fischio,
    // PLAYER.coastDecel) la sua radice arrivava al trascinamento finale a meno
    // di ANIM.stillRoot m/s anche a playback massimo, col giocatore a 0,6-0,7
    const slow = tr.role === 'stop' && (distAt(d.path, d.t) - distAt(d.path, d.prev)) / dt < ANIM.stillRoot;
    const cut = this.speed > ANIM.endMove && (d.t >= d.until || slow);
    if (cut || d.t + rate * ANIM.fadeOut >= d.end) this.avatar.fadeGesture(cut ? T.cut : undefined);
    return false;
  }

  // Transizione interrotta senza una partenza: la corsa riprende in fretta.
  // Mentre sfuma la clip segue ancora la distanza (ferma, traslerebbe).
  cutTransition() {
    this.avatar.fadeGesture(ANIM.trans.cut);
    if (this.trans) this.trans.cut = true;
    this.transCool = ANIM.trans.cooldown;
  }

  // Metri che servono per fermarsi da qui con la frenata dell'ultimo drive()
  // (joystick lasciato, o quella lenta dei fischi: PLAYER.coastDecel).
  stopDistance() {
    const dt = 1 / 60, top = Math.max(1, this.params.maxSpeed), decel = this.decel || PLAYER.decel;
    let v = this.speed, d = 0;
    for (let i = 0; i < 600 && v > 0; i++) {
      const run = Math.min(1, v / top);
      v = Math.max(0, v - decel * (PLAYER.decelLow + (1 - PLAYER.decelLow) * run) * dt);
      d += v * dt;
    }
    return d;
  }

  // Sposta il giocatore senza passare dalla corsa (radice di una clip,
  // riposizionamento): la velocita' resta coerente per le animazioni.
  moveTo(x, z, dt) {
    this.prev.copy(this.pos);
    this.prevHeading = this.heading;
    const dx = x - this.pos.x, dz = z - this.pos.z;
    this.pos.x = x; this.pos.z = z;
    if (dt > 0) {
      this.vel.set(dx / dt, 0, dz / dt);
      this.speed = Math.hypot(dx, dz) / dt;
      if (this.speed > 0.05) this.moveHeading = headingOf(dx, dz);
    }
  }

  // Direzione a destra del busto, nel piano del campo.
  get rightX() { return -Math.cos(this.heading); }
  get rightZ() { return Math.sin(this.heading); }
}

// Due giocatori non si compenetrano; chi e' fermo non viene spostato.
// Priorita' (`firm`: 2 ancorato, 3 piu' che ancorato, 0 altrimenti): poi chi
// sta fermo (sotto PLAYER.pushStill: spinto, la sua posa in piedi scivolava
// sull'erba), poi chi si muove, che si scosta di tutto; a pari priorita'
// meta' per uno, nessuno dei due se ancorati.
export function separate(players, firm) {
  const min = PLAYER.radius * 2;
  const rank = (p) => firm(p) || (p.speed < PLAYER.pushStill ? 1 : 0);
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const a = players[i], b = players[j];
      const dx = b.pos.x - a.pos.x, dz = b.pos.z - a.pos.z;
      const d = Math.hypot(dx, dz);
      if (d >= min) continue;
      const nx = d > 1e-4 ? dx / d : 1, nz = d > 1e-4 ? dz / d : 0;
      const push = min - d;
      const ra = rank(a), rb = rank(b), lock = ra === rb && ra >= 2;
      const fa = lock || ra > rb ? 0 : rb > ra ? 1 : 0.5;
      const fb = lock || rb > ra ? 0 : 1 - fa;
      a.pos.x -= nx * push * fa; a.pos.z -= nz * push * fa;
      b.pos.x += nx * push * fb; b.pos.z += nz * push * fb;
    }
  }
}

function hasRole(p, roles) {
  const own = String(p.role || '').toUpperCase().split(/[,\s/]+/);
  return own.some((r) => roles.includes(r));
}

// Le posizioni del modulo: `team.slots` dal manager (allineati ai giocatori),
// altrimenti la tabella FORMATIONS; senza modulo noto, 4-3-3.
export function formationSlots(team) {
  if (team && Array.isArray(team.slots) && team.slots.length === 11) {
    return team.slots.map((s) => ({ role: String(s.role || '').toUpperCase(), x: +s.x, y: +s.y }));
  }
  const name = team && FORMATIONS[team.formation] ? team.formation : '4-3-3';
  return FORMATIONS[name].map(([x, y], i) => ({ role: FORMATION_ROLES[name][i], x, y }));
}

// Undici giocatori nell'ordine del modulo. Con `slots` il manager ha gia'
// messo ogni titolare al suo posto; senza, si abbina per ruolo. Chi manca
// diventa una sagoma con il numero del posto.
export function buildTeam(team, side, attackDir, tpl, material, keeperMaterial, shadowTex, kit, keeperKit) {
  const slots = formationSlots(team);
  const aligned = team && Array.isArray(team.slots) && team.slots.length === 11;
  // allineati: un posto vuoto resta vuoto, non fa scalare gli altri
  const given = aligned ? (team.players || []) : ((team && team.players) || []).filter(Boolean);
  const used = new Set();
  const take = (i, role) => {
    if (aligned) { const p = given[i]; if (p) used.add(p); return p; }
    let p = given.find((q) => !used.has(q) && hasRole(q, [role]));
    if (!p && role !== 'POR') p = given.find((q) => !used.has(q) && !hasRole(q, ['POR']));
    if (!p) p = given.find((q) => !used.has(q));
    if (p) used.add(p);
    return p;
  };
  const players = slots.map((slot, i) => {
    const src = take(i, slot.role);
    const keeper = i === 0;
    const data = src
      ? { ...src, number: src.number || i + 1, role: src.role || slot.role }
      : { id: null, name: '', number: i + 1, role: slot.role, overall: ATTR.fallback };
    const pl = new Player(data, keeper ? keeperKit : kit, tpl, keeper ? keeperMaterial : material, shadowTex, attackDir);
    pl.team = side;
    pl.slot = slot;
    pl.keeper = keeper;
    pl.index = i;
    return pl;
  });
  return players;
}

const lerp = (a, b, t) => a + (b - a) * t;
const lerp2 = ([a, b], t) => a + (b - a) * t;

// Compagni nel cono (ux, uz) fra minD e maxD: { m, d, ang }.
function inCone(from, ux, uz, mates, cone, minD, maxD, noKeeper) {
  const out = [];
  for (const m of mates) {
    if (m === from || !available(m) || (noKeeper && m.keeper)) continue;
    const dx = m.pos.x - from.pos.x, dz = m.pos.z - from.pos.z;
    const d = Math.hypot(dx, dz);
    if (d < minD || d > maxD) continue;
    const ang = Math.acos(clamp((dx * ux + dz * uz) / d, -1, 1));
    if (ang <= cone) out.push({ m, d, ang });
  }
  return out;
}

// La potenza diventa una distanza fra il compagno piu' vicino e il piu'
// lontano del cono: 0 il vicino, 1 il lontano.
function reachFor(cand, power) {
  let near = Infinity, far = 0;
  for (const c of cand) { near = Math.min(near, c.d); far = Math.max(far, c.d); }
  return { d: near + (far - near) * power, span: Math.max(PASS.reachSpan, far - near) };
}

// Passaggio assistito: nel cono della levetta, il compagno la cui distanza
// e' piu' vicina a quella chiesta dalla potenza, poi angolo e marcatura.
export function choosePass(from, dirX, dirZ, mates, opponents, cone = PASS.cone, power = 0) {
  const dl = Math.hypot(dirX, dirZ) || 1;
  const cand = inCone(from, dirX / dl, dirZ / dl, mates, cone, PASS.minDist, PASS.maxDist, false);
  if (!cand.length) return null;
  const want = reachFor(cand, power);
  let best = null, bestScore = Infinity;
  for (const c of cand) {
    const score = PASS.wAngle * (c.ang / cone) + PASS.wReach * Math.abs(c.d - want.d) / want.span -
      PASS.wFree * freeness(c.m.pos.x, c.m.pos.z, opponents);
    if (score < bestScore) { bestScore = score; best = c.m; }
  }
  return best;
}

// Velocita' del rasoterra: cresce con la potenza e con la distanza, piu' secca
// sotto pressione, mai cosi' lenta da non arrivare.
export function passSpeed(d, power, press = 0) {
  const s = clamp(PASS.speedPower * power + PASS.speedDist * Math.min(1, d / PASS.speedDistRef), 0, 1);
  const v = PASS.speedMin + (PASS.speedMax - PASS.speedMin) * s + PASS.pressBoost * press;
  return Math.min(KICK.maxSpeed, Math.max(v, rollSpeedFor(d, PASS.arriveMin)));
}

// Filtrante: arriva nello spazio alla velocita' voluta, piu' veloce se piu' lontano.
export function throughSpeed(d, power, t) {
  // con il tempo del compagno (throughPoint): arriva sul punto insieme a lui
  if (t > 0 && Number.isFinite(t)) return clamp(rollSpeedIn(d, t), THROUGH.speedMin, THROUGH.speedMax);
  return clamp(rollSpeedFor(d, lerp2(THROUGH.arrive, power)), THROUGH.speedMin, THROUGH.speedMax);
}

// Secondi che `m` impiega a correre `dist` metri al massimo verso (dx, dz),
// partendo da come si muove (accelerazione dagli attributi): conta solo la
// velocita' in quella direzione, e se va dall'altra parte prima si ferma.
// Senza direzione, quella della sua corsa.
export function runTime(m, dist, dx, dz) {
  const vmax = m.params.maxSpeed, a = m.params.accel || vmax;
  const l = Math.hypot(dx || 0, dz || 0);
  let v0 = l > 1e-6 ? (m.vel.x * dx + m.vel.z * dz) / l : Math.min(vmax, m.speed || 0);
  let t0 = 0;
  if (v0 < 0) { t0 = -v0 / a; dist += v0 * v0 / (2 * a); v0 = 0; }
  v0 = Math.min(vmax, v0);
  const ta = (vmax - v0) / a, da = v0 * ta + 0.5 * a * ta * ta;
  if (dist <= da) return t0 + (-v0 + Math.sqrt(v0 * v0 + 2 * a * dist)) / a;
  return t0 + ta + (dist - da) / vmax;
}

// Chi e' a terra o impegnato in un tuffo non riceve passaggi.
function available(m) { return !m.down && !m.keeperBusy; }

// 0 marcato stretto, 1 nessun avversario entro PASS.freeRadius.
export function freeness(x, z, opponents) {
  let near = Infinity;
  for (const o of opponents) near = Math.min(near, Math.hypot(o.pos.x - x, o.pos.z - z));
  return Math.min(1, near / PASS.freeRadius);
}

// Filtrante: il compagno nel cono con piu' spazio davanti. La palla va dove
// arrivera' correndo, non ai suoi piedi; la potenza decide quanto avanti.
export function chooseThrough(from, dirX, dirZ, mates, opponents, power) {
  const dl = Math.hypot(dirX, dirZ) || 1;
  const ux = dirX / dl, uz = dirZ / dl;
  let best = null, bestScore = Infinity;
  const cand = inCone(from, ux, uz, mates, THROUGH.cone, PASS.minDist, PASS.maxDist, true);
  const want = cand.length ? reachFor(cand, power) : null;
  for (const c of cand) {
    const pt = throughPoint(from, c.m, power);
    const space = freeness(pt.tx, pt.tz, opponents);
    const score = PASS.wAngle * (c.ang / THROUGH.cone) + THROUGH.wReach * Math.abs(c.d - want.d) / want.span - THROUGH.wSpace * space;
    if (score < bestScore) { bestScore = score; best = { mate: c.m, tx: pt.tx, tz: pt.tz }; }
  }
  if (best) return best;
  const reach = lerp2(PASS.blindDist, power) + lerp2(THROUGH.lead, power);
  return { mate: null, tx: throughX(from.pos.x + ux * reach, from.attackDir), tz: clampZ(from.pos.z + uz * reach) };
}

// Il filtrante resta un passaggio: si ferma prima dell'area piccola avversaria.
const throughX = (x, dir) => clampX(dir * Math.min(dir * x, HL - THROUGH.goalGap));

// Punto del filtrante: `lead` metri davanti alla corsa del compagno, ma mai
// dietro a dove sara' quando arriva la palla.
// Come in PES la potenza decide quanto lontano nello spazio: il punto e'
// `lead` metri (fra THROUGH.lead con la potenza) davanti al compagno, nella
// sua corsa. `t`: secondi che il compagno, in corsa piena da come si muove
// adesso (runTime), impiega ad arrivarci; la velocita' della palla
// (throughSpeed) li fa coincidere. Se la palla non puo' arrivare con lui
// (troppo vicino per speedMax, o speedMin la fa arrivare prima) il punto va
// piu' avanti, dove il compagno, piu' lento della palla, recupera la differenza.
export function throughPoint(from, m, power) {
  const run = runDirection(m);
  let L = lerp2(THROUGH.lead, power), t = 0;
  for (let i = 0; i < 8; i++) {
    const tx = m.pos.x + run.x * L, tz = m.pos.z + run.z * L;
    t = runTime(m, L, run.x, run.z);
    const d = Math.hypot(tx - from.pos.x, tz - from.pos.z);
    const v = throughSpeed(d, power, t), tb = rollTime(v, d);
    if (!Number.isFinite(tb) || Math.abs(tb - t) < 0.05) break;
    L += Math.abs(tb - t) * m.params.maxSpeed * 0.8;
  }
  const tx = throughX(m.pos.x + run.x * L, from.attackDir), tz = clampZ(m.pos.z + run.z * L);
  return { tx, tz, t: runTime(m, Math.hypot(tx - m.pos.x, tz - m.pos.z), tx - m.pos.x, tz - m.pos.z) };
}

// Dove corre il compagno: la sua corsa se va in avanti, altrimenti verso la
// porta avversaria (un filtrante non si gioca verso la propria porta).
function runDirection(m) {
  const s = Math.hypot(m.vel.x, m.vel.z);
  if (s > 2 && m.vel.x * m.attackDir > 0.3 * s) return { x: m.vel.x / s, z: m.vel.z / s };
  return { x: m.attackDir, z: 0 };
}

const clampZ = (z) => clamp(z, -HW + 1, HW - 1);
const clampX = (x) => clamp(x, -HL + 1, HL - 1);

// Cross dalla fascia nell'ultimo terzo, lancio lungo altrove. Restituisce
// punto d'arrivo, altezza della parabola, tipo e destinatario.
export function chooseCross(from, dirX, dirZ, mates, opponents, power) {
  const d = from.attackDir;
  const ax = from.pos.x * d;
  if (Math.abs(from.pos.z) > CROSS.wingZ && ax > CROSS.finalThird) {
    // la potenza sceglie il palo: primo, centro, secondo
    const side = Math.sign(from.pos.z) || 1;
    const u = clamp((power - CROSS.powerLow) / (CROSS.powerHigh - CROSS.powerLow), 0, 1);
    const B = CROSS.back;
    const back = u < 0.5 ? lerp(B[0], B[1], u * 2) : lerp(B[1], B[2], (u - 0.5) * 2);
    const tx = d * (HL - back), tz = side * lerp(CROSS.nearZ, CROSS.farZ, u);
    return { kind: 'cross', tx, tz, apex: lerp2(CROSS.apex, power), mate: nearestMate(tx, tz, from, mates) };
  }
  const dl = Math.hypot(dirX, dirZ) || 1;
  const ux = dirX / dl, uz = dirZ / dl;
  const cand = inCone(from, ux, uz, mates, CROSS.cone, CROSS.longMin, PASS.maxDist + 15, true);
  let best = null, bestScore = Infinity;
  if (cand.length) {
    const want = reachFor(cand, power);
    for (const c of cand) {
      const score = c.ang / CROSS.cone + PASS.wReach * Math.abs(c.d - want.d) / want.span - PASS.wFree * freeness(c.m.pos.x, c.m.pos.z, opponents);
      if (score < bestScore) { bestScore = score; best = c; }
    }
  }
  if (best) {
    const run = runDirection(best.m);
    const apex = lerp2(CROSS.apexLong, power) * clamp(best.d / 35, 0.6, 1.2);
    return { kind: 'lancio', tx: clampX(best.m.pos.x + run.x * 3), tz: clampZ(best.m.pos.z + run.z * 3), apex, mate: best.m };
  }
  const reach = lerp2(CROSS.longSpace, power);
  return { kind: 'lancio', tx: clampX(from.pos.x + ux * reach), tz: clampZ(from.pos.z + uz * reach), apex: lerp2(CROSS.apexLong, power), mate: null };
}

function nearestMate(x, z, from, mates) {
  let best = null, bd = Infinity;
  for (const m of mates) {
    if (m === from || m.keeper || !available(m)) continue;
    const d = Math.hypot(m.pos.x - x, m.pos.z - z);
    if (d < bd) { bd = d; best = m; }
  }
  return best;
}

// Errore sul punto d'arrivo di un pallone alto, scalato dal passaggio.
export function loftError(from) {
  const s = from.params.passError / ATTR.passError[0];
  return { x: gauss() * CROSS.error * s, z: gauss() * CROSS.error * s };
}

// Pressione su un giocatore, 0..1: quanto e' vicino l'avversario piu' vicino.
export function pressure(p, opponents) {
  let near = Infinity;
  for (const o of opponents) near = Math.min(near, Math.hypot(o.pos.x - p.pos.x, o.pos.z - p.pos.z));
  return 1 - Math.min(1, near / PASS.freeRadius);
}

// Punto d'arrivo del passaggio con l'errore di chi calcia.
// Ai piedi del compagno, anticipando un po' la sua corsa per il tempo che la
// palla impiega davvero ad arrivare. Senza compagno: nello spazio, piu'
// lontano con piu' potenza.
export function passAim(from, ball, target, dirX, dirZ, power = 0) {
  let tx, tz;
  if (target) {
    const d = Math.hypot(target.pos.x - ball.pos.x, target.pos.z - ball.pos.z);
    const t0 = rollTime(passSpeed(d, power), d);
    const t = Number.isFinite(t0) ? t0 : d / 8;
    tx = target.pos.x + target.vel.x * t * PASS.lead;
    tz = target.pos.z + target.vel.z * t * PASS.lead;
  } else {
    const dl = Math.hypot(dirX, dirZ) || 1, reach = lerp2(PASS.blindDist, power);
    tx = clampX(ball.pos.x + dirX / dl * reach);
    tz = clampZ(ball.pos.z + dirZ / dl * reach);
  }
  const e = gauss() * from.params.passError;
  const dx = tx - ball.pos.x, dz = tz - ball.pos.z;
  const c = Math.cos(e), s = Math.sin(e);
  const scale = from.params.passError / ATTR.passError[0];
  return {
    tx: ball.pos.x + dx * c - dz * s,
    tz: ball.pos.z + dx * s + dz * c,
    speedMul: 1 + gauss() * PASS.speedError * scale
  };
}

// Tiro: se il joystick punta verso la porta avversaria sceglie il punto
// fra i pali, se punta altrove si calcia li'. Senza joystick si tira in
// porta, verso il palo a cui guarda il giocatore.
export function shotVelocity(from, ball, power, aimX, aimZ, fromStick) {
  const P = from.params, d = from.attackDir;
  const al = Math.hypot(aimX, aimZ) || 1;
  const forward = (aimX / al) * d > -0.2;
  let dx, dz;
  if (forward || !fromStick) {
    const tz = forward ? clamp(aimZ / al, -1, 1) * (GOAL_HW - SHOT.postMargin) : 0;
    dx = d * HL - ball.pos.x;
    dz = tz - ball.pos.z;
  } else {
    dx = aimX; dz = aimZ;
  }
  const over = Math.max(0, (power - SHOT.overPower) / (1 - SHOT.overPower));
  const err = P.shotError * (1 + SHOT.overError * over) * (from.sprinting ? SHOT.sprintError : 1);
  const ang = Math.atan2(dz, dx) + gauss() * err;
  const speed = SHOT.minSpeed + (P.shotSpeed - SHOT.minSpeed) * power;
  // Altezza sulla linea di porta: sale con la potenza, oltre overPower scavalca la traversa.
  const cx = Math.cos(ang);
  const toLine = (d * HL - ball.pos.x) / cx;
  const dist = cx * d > 0.1 && (forward || !fromStick) ? toLine : SHOT.awayDist;
  const hLine = lerp2(SHOT.height, Math.min(1, power / SHOT.overPower)) + SHOT.overHeight * over;
  const h = Math.max(BALL.radius + 0.04, hLine + gauss() * err * SHOT.heightError * dist);
  const loft = loftFor(ball.pos.y, speed, dist, h);
  const hs = Math.cos(loft) * speed;
  return { vx: cx * hs, vy: Math.sin(loft) * speed, vz: Math.sin(ang) * hs };
}
