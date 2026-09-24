import * as THREE from 'three';
import { PLAYER, PITCH, GOAL, PASS, SHOT, ATTR, THROUGH, CROSS, FORMATIONS, FORMATION_ROLES, KICK, BALL } from './config.js';
import { playerParams } from './attributes.js';
import { Avatar } from './avatar.js';
import { rollSpeedFor, rollTime, loftFor } from './ball.js';

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
    this.vel = new THREE.Vector3();
    this.heading = headingOf(attackDir, 0);   // busto
    this.moveHeading = this.heading;          // direzione della corsa
    this.prevHeading = this.heading;
    this.speed = 0;
    this.sprinting = false;
    this.touchPhase = 0;
    this.knockTimer = 0;

    this.team = null;          // 'home' | 'away'
    this.role = String(data.role || '').toUpperCase();
    this.keeper = false;
    this.action = null;        // gesto in corso (main.js): calcio, finta, contrasto...
    this.sideSpeed = 0;        // portiere: velocita' laterale per il passo laterale

    this.avatar = new Avatar(tpl, material, data.number, kit.primary);
    this.mesh = this.avatar.object;
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
    this.knockTimer = 0;
  }

  get dirX() { return Math.sin(this.heading); }
  get dirZ() { return Math.cos(this.heading); }

  // Un passo di movimento: (dx, dz) direzione voluta, mag 0..1.
  // o.face: il busto guarda questo vettore invece della direzione di corsa.
  // o.turnMul: sterzata piu' rapida (rincorsa del tiro). o.decel: frenata.
  drive(dt, dx, dz, mag, o = {}) {
    const P = this.params;
    this.prev.copy(this.pos);
    this.prevHeading = this.heading;
    const slow = 1 - Math.min(1, this.speed / P.maxSpeed);
    const turn = (o.withBall ? P.turnRateBall : P.turnRate) * (1 + PLAYER.turnSlowBoost * slow) * (o.turnMul || 1) * dt;
    let want = 0;
    if (mag > 0) {
      const target = headingOf(dx, dz);
      this.moveHeading = wrap(this.moveHeading + clamp(wrap(target - this.moveHeading), -turn, turn));
      const left = Math.abs(wrap(target - this.moveHeading));
      want = mag * P.maxSpeed * (o.sprint ? 1 : PLAYER.jogFactor) * (o.withBall ? P.dribbleSpeed : 1);
      want *= Math.max(PLAYER.turnBrake, Math.cos(Math.min(left, Math.PI / 2)));
    }
    // Il busto segue la corsa o guarda o.face; di lato si corre piu' piano.
    const faceTo = o.face ? headingOf(o.face.x, o.face.z) : this.moveHeading;
    const ft = turn * PLAYER.faceTurn;
    this.heading = wrap(this.heading + clamp(wrap(faceTo - this.heading), -ft, ft));
    if (o.face && Math.abs(wrap(this.moveHeading - this.heading)) > Math.PI / 4) want *= PLAYER.strafeSpeed;
    if (mag === 0 && !o.face && this.speed < 0.05) this.moveHeading = this.heading;

    this.sprinting = !!o.sprint && mag > 0;
    const rate = want > this.speed ? P.accel : (o.decel || PLAYER.decel);
    this.speed += clamp(want - this.speed, -rate * dt, rate * dt);
    this.vel.set(Math.sin(this.moveHeading) * this.speed, 0, Math.cos(this.moveHeading) * this.speed);
    this.pos.addScaledVector(this.vel, dt);
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
    m.position.lerpVectors(this.prev, this.pos, alpha);
    m.rotation.y = this.prevHeading + wrap(this.heading - this.prevHeading) * alpha;
    this.shadow.position.set(m.position.x, 0.011, m.position.z);
    this.avatar.update(dt, this.speed, wrap(this.moveHeading - this.heading), this.sideSpeed);
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
export function separate(players, anchored) {
  const min = PLAYER.radius * 2;
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const a = players[i], b = players[j];
      const dx = b.pos.x - a.pos.x, dz = b.pos.z - a.pos.z;
      const d = Math.hypot(dx, dz);
      if (d >= min) continue;
      const nx = d > 1e-4 ? dx / d : 1, nz = d > 1e-4 ? dz / d : 0;
      const push = min - d;
      const fa = anchored(a) ? 0 : anchored(b) ? 1 : 0.5;
      const fb = anchored(b) ? 0 : 1 - fa;
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
export function throughSpeed(d, power) {
  return clamp(rollSpeedFor(d, lerp2(THROUGH.arrive, power)), THROUGH.speedMin, THROUGH.speedMax);
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
export function throughPoint(from, m, power) {
  const run = runDirection(m);
  const lead = lerp2(THROUGH.lead, power);
  const sp = Math.hypot(m.vel.x, m.vel.z);
  let L = lead;
  for (let i = 0; i < 2; i++) {
    const tx = m.pos.x + run.x * L, tz = m.pos.z + run.z * L;
    const d = Math.hypot(tx - from.pos.x, tz - from.pos.z);
    const t = rollTime(throughSpeed(d, power), d);
    L = Math.max(lead, sp * (Number.isFinite(t) ? t : 2) + lead * 0.5);
  }
  return { tx: throughX(m.pos.x + run.x * L, from.attackDir), tz: clampZ(m.pos.z + run.z * L) };
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
