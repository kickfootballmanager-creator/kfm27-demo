import * as THREE from 'three';
import { KEEPER, PITCH, GOAL, BALL, ATTR, PLAYER, RULES, FK } from './config.js';
import { rootAt, clipDuration } from './avatar.js';
import { freeness } from './player.js';
import { palm } from './rig.js';

// IA del portiere: POSIZIONE, USCITA, PARATA, RINVIO. Muove il portiere a 60 Hz;
// le parate sono gesti pianificati sulle tabelle delle pose, con l'IK sulle
// braccia; la palla la ferma solo il contatto con mani e corpo veri.

const HL = PITCH.length / 2;
const GOAL_HW = GOAL.width / 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) * 2;

const _c = new THREE.Vector3(), _e = new THREE.Vector3(), _off = new THREE.Vector3();

// Opzioni di parata dalla libreria: una per clip, con la finestra attorno al
// contatto misurato dal build (Ball_Bone e palmi del Biped originale). Le
// clip del portiere stanno tutte nel pacchetto essenziale: stesse opzioni a
// ogni livello. `claim`: uscite sui palloni alti (prese e pugni).
function libOptions(tpl, claim) {
  const key = claim ? 'claim' : 'save';
  if (tpl.keeperOptions && tpl.keeperOptions.v === tpl.libVersion && tpl.keeperOptions[key]) return tpl.keeperOptions[key];
  if (!tpl.keeperOptions || tpl.keeperOptions.v !== tpl.libVersion) tpl.keeperOptions = { v: tpl.libVersion };
  const W = KEEPER.saveWindow, SC = KEEPER.saveScale, B = KEEPER.saveBias, out = [];
  const roles = claim ? ['gkCatch', 'gkPunch'] : ['gkCatch', 'gkSave'];
  for (const role of roles) {
    for (const e of tpl.lib.role(role)) {
      const m = e.meta, c = m.ev && m.ev.contact;
      if (!c || !tpl.poses[e.name]) continue;
      const dive = !!m.ev.dive, catchIt = role === 'gkCatch';
      const sc = claim ? SC.claim : dive ? SC.dive : SC.stand;
      // prese con la palla in mano dal primo fotogramma (Keeper_Ball_*): il
      // contatto del build e' dove le braccia arrivano piu' lontano, spesso
      // l'atterraggio o il rialzo (343, tuffo alto: palla a 25 cm da terra,
      // scelta per i rasoterra e poi l'IK tirava le braccia di un metro).
      // La palla puo' arrivare fra le mani in tutto il gesto, in tuffo prima
      // che il corpo tocchi terra: il piano sceglie il fotogramma dai palmi
      const held = catchIt && /Keeper_Ball_/.test(e.name);
      const window = held ? [W.held, dive ? landing(tpl, e.name) : c.t + W.after] : [Math.max(0.05, c.t - W.before), c.t + W.after];
      out.push({
        name: e.name, clip: e.name, from: held ? 0 : Math.max(0, c.t - W.lead), dive,
        window, end: m.dur,
        scaleA: sc.a, scaleS: sc.s, catch: catchIt, held,
        bias: (catchIt ? B.catch : role === 'gkPunch' ? B.punch : B.parry) + (dive ? B.dive : 0)
      });
    }
  }
  tpl.keeperOptions[key] = out;
  return out;
}

// Istante in cui il portiere in tuffo tocca terra col bacino (sotto
// KEEPER.saveWindow.landY), dalla clip messa in posa sul modello.
const _hp = new THREE.Vector3();
function landing(tpl, name) {
  const clip = tpl.clips[name], mx = new THREE.AnimationMixer(tpl.holder), a = mx.clipAction(clip);
  let hips = null;
  tpl.holder.traverse((o) => { if (!hips && o.isBone && /Hips$/.test(o.name)) hips = o; });
  a.play();
  let t = clip.duration;
  for (let k = 0; k <= Math.ceil(clip.duration * 30); k++) {
    a.time = Math.min(clip.duration, k / 30);
    mx.update(0);
    tpl.holder.updateMatrixWorld(true);
    if (k / 30 > KEEPER.saveWindow.held && hips.getWorldPosition(_hp).y < KEEPER.saveWindow.landY) { t = k / 30; break; }
  }
  mx.stopAllAction();
  mx.uncacheRoot(tpl.holder);
  return t;
}

// Tempi di un rinvio dai metadati: rilascio dalle mani, mano sola, contatto del piede.
function releaseSpec(tpl, C) {
  const m = tpl.meta[C.clip], ev = (m && m.ev) || {};
  const kick = !!ev.contact;
  return {
    clip: C.clip, from: C.from, rate: C.rate,
    contact: kick ? ev.contact.t : ev.release,
    drop: kick ? ev.release : undefined,
    oneHand: ev.oneHand,
    end: Math.min(m ? m.dur : 0, (kick ? ev.contact.t : ev.release) + C.after)
  };
}
const _q = new THREE.Vector3(), _s = new THREE.Vector3(), _n = new THREE.Vector3(), _t = new THREE.Vector3();

// Prima sfera del corpo (KEEPER.body) toccata dalla palla nel suo ultimo
// passo, fra la posizione precedente e l'attuale. La posa e' quella
// dell'ultimo disegno, spostata dove la fisica ha messo il portiere.
// La sfera si muove anche lei: dalla posa disegnata prosegue nel passo con la
// velocita' che aveva fra gli ultimi due disegni (memo, per sfera). Palla e
// sfera vanno insieme da t = 0 a 1: con le mani spinte dall'IK la palla
// passava fra due pose senza toccarle (mani a 19 cm dal centro, nessun contatto).
const _dc = new THREE.Vector3(), _r0 = new THREE.Vector3(), _rv = new THREE.Vector3();
export function bodyHit(k, b, hands, clock) {
  const r = k.avatar.rig, B = KEEPER.body;
  k.avatar.object.updateMatrixWorld(true);
  _off.set(k.pos.x - k.anchor.x, 0, k.pos.z - k.anchor.z);
  const p0 = b.prev, seg = _s.subVectors(b.pos, p0);
  const memo = k.hitMemo || (k.hitMemo = { t: -1, pos: new Float32Array(B.length * 3) });
  const fresh = clock - memo.t < 1.5 / 60 && clock > memo.t;
  let best = null;
  for (let i = 0; i < B.length; i++) {
    const [name, to, f, rad, isHand] = B[i];
    const bone = r[name];
    if (!bone) continue;
    bone.getWorldPosition(_c);
    if (to && r[to]) _c.lerp(r[to].getWorldPosition(_e), f);
    _c.add(_off);
    const o = i * 3;
    _dc.set(0, 0, 0);
    if (fresh) {
      _dc.set(_c.x - memo.pos[o], _c.y - memo.pos[o + 1], _c.z - memo.pos[o + 2]);
      if (_dc.length() > KEEPER.hitLead) _dc.setLength(KEEPER.hitLead);
    }
    memo.pos[o] = _c.x; memo.pos[o + 1] = _c.y; memo.pos[o + 2] = _c.z;
    if (isHand && !hands) continue;
    // distanza minima fra palla e sfera che si muovono insieme nel passo
    _r0.subVectors(p0, _c);
    _rv.subVectors(seg, _dc);
    const v2 = _rv.lengthSq(), t = v2 > 1e-9 ? clamp(-_r0.dot(_rv) / v2, 0, 1) : 0;
    const d = _r0.addScaledVector(_rv, t).length();
    if (d < rad + BALL.radius && (!best || t < best.t)) {
      _q.copy(p0).addScaledVector(seg, t);
      best = { t, hand: isHand, rad, c: _c.clone().addScaledVector(_dc, t), q: _q.clone() };
    }
  }
  memo.t = clock;
  return best;
}

// Palla fra i palmi: tutti e due entro `reach` metri, abbastanza per trattenerla.
// Palla bassa che passa sotto le mani di una presa: il punto del suo passo
// piu' vicino ai palmi e' entro G.side in orizzontale dal loro centro e sotto
// di loro, e i due palmi entro G.reach da lei. Un rasoterra lento passava fra
// i piedi (3 cm per parte) con le mani 20 cm sopra: la presa lo raccoglie.
const _pm = new THREE.Vector3();
function gathered(k, b) {
  const G = KEEPER.gather, r = k.avatar.rig;
  if (b.pos.y > G.maxY) return false;
  _off.set(k.pos.x - k.anchor.x, 0, k.pos.z - k.anchor.z);
  const L = palm(r, 'Left', _c).add(_off), R = palm(r, 'Right', _e).add(_off);
  _pm.addVectors(L, R).multiplyScalar(0.5);
  const p0 = b.prev, seg = _s.subVectors(b.pos, p0), L2 = seg.x * seg.x + seg.z * seg.z;
  const t = L2 > 1e-9 ? clamp(((_pm.x - p0.x) * seg.x + (_pm.z - p0.z) * seg.z) / L2, 0, 1) : 0;
  _q.copy(p0).addScaledVector(seg, t);
  return Math.hypot(_q.x - _pm.x, _q.z - _pm.z) < G.side && _pm.y > _q.y && L.distanceTo(_q) < G.reach && R.distanceTo(_q) < G.reach;
}

function palmsOn(k, b, reach) {
  const r = k.avatar.rig;
  _off.set(k.pos.x - k.anchor.x, 0, k.pos.z - k.anchor.z);
  return palm(r, 'Left', _c).add(_off).distanceTo(b.pos) < reach &&
    palm(r, 'Right', _e).add(_off).distanceTo(b.pos) < reach;
}

export class KeeperAI {
  constructor(match, side, keeper, difficulty) {
    this.m = match;
    this.side = side;
    this.p = keeper;
    this.skill = difficulty;
    this.hold = 0;
    this.watch = null;       // tiro gia' valutato: non si ripete la decisione
    this.replan = 0;         // uscita sui cross: secondi al prossimo piano
    const o = Number(keeper.data.overall) || ATTR.fallback;
    this.attr = clamp((o - ATTR.low) / (ATTR.high - ATTR.low), 0, 1);
    this.path = [];
    keeper.aiState = 'POSIZIONE';
  }

  get dir() { return this.m.dirOf(this.side); }
  // Centro della propria porta.
  get goalX() { return -this.dir * HL; }

  update(dt) {
    const m = this.m, k = this.p;
    // in guardia (animazione) quando la palla e' vicina alla sua porta
    k.alert = m.owner !== k && Math.hypot(m.ball.pos.x - this.goalX, m.ball.pos.z) < KEEPER.alertDist;
    if (k.action || k.down) { this.readBusy(); return; }
    if (m.owner === k) { this.distribute(dt); return; }
    this.hold = 0;
    k.holding = false;
    if (m.phase !== 'play') { this.pending = null; this.position(dt); return; }
    if (this.pending && this.waitSave(dt)) return;
    if (this.save()) return;
    if (this.side === m.userSide && m.keeperCharge && this.charge(dt)) return;
    if (this.claim(dt)) return;
    if (this.rush(dt)) return;
    this.position(dt);
  }

  // Tiro mentre il portiere e' ancora nel gesto di prima (a terra dopo un
  // tuffo, in piedi dopo una respinta): la lettura conta il tempo che gli resta.
  readBusy() {
    const m = this.m, k = this.p, poss = m.poss, a = k.action;
    if (!poss.flying || poss.team === this.side || this.watch === poss.seq || !a || !a.keeper) return;
    if (!this.crossing()) return;
    this.watch = poss.seq;
    const busy = Math.max(0, (a.end - a.t) / (a.rate || 1));
    const r = this.assess(undefined, busy);
    this.shot = { seq: poss.seq, ...r };
    m.note('lettura', { k, parabile: r.saveable, motivo: r.reason, margine: r.margin, t: r.t, occupato: busy });
  }

  // Sulla linea fra palla e centro della porta, piu' fuori quando la palla si avvicina.
  position(dt) {
    const m = this.m, k = this.p, b = m.ball.pos;
    k.alert = m.owner !== k && Math.hypot(b.x - this.goalX, b.z) < KEEPER.alertDist;
    k.aiState = 'POSIZIONE';
    // rigore contro: fermo sulla linea, al centro, rivolto al tiratore
    const set = m.rules.set;
    if (m.phase === 'restart' && set && set.type === 'penalty' && set.side !== this.side) {
      // il portiere dell'utente sceglie il tuffo durante la rincorsa
      if (m.human(this.side) && set.taker.action) { this.penaltyWatch(dt); return; }
      this.dive = null;
      this.moveTo(dt, this.goalX + this.dir * 0.3, 0, false);
      return;
    }
    // punizione diretta contro: la barriera copre il palo vicino alla palla,
    // il portiere si mette verso l'altro
    if (m.phase === 'restart' && set && set.fk && set.fk.mode === 'direct' && set.side !== this.side) {
      this.moveTo(dt, this.goalX + this.dir * 0.6, -(Math.sign(set.spot.z) || 1) * FK.keeperFar, false);
      return;
    }
    const s = this.spot(b);
    this.moveTo(dt, s.x, s.z, false);
  }

  // Posto in gioco aperto: sulla linea fra la palla `b` e il centro della
  // porta, piu' fuori quando la palla si avvicina.
  spot(b) {
    const gx = this.goalX;
    const vx = b.x - gx, vz = b.z, vl = Math.hypot(vx, vz) || 1;
    const t = clamp((KEEPER.depthRange[0] - vl) / (KEEPER.depthRange[0] - KEEPER.depthRange[1]), 0, 1);
    const depth = lerp(KEEPER.depth[0], KEEPER.depth[1], t);
    return { x: gx + vx / vl * depth, z: clamp(vz / vl * depth, -KEEPER.maxZ, KEEPER.maxZ) };
  }

  // Tiro parabile per gli attributi? Lungo la traiettoria, fino alla linea di
  // porta, il punto in cui le mani arrivano con piu' margine: dopo la
  // reazione il braccio si allunga in KEEPER.reach.armTime e il tuffo porta il
  // corpo fino a `dive` metri in diveTime (accelerazione costante). Se non
  // arriva, il motivo: tiro troppo veloce (con piu' tempo ci arrivava), troppo
  // angolato (nemmeno con tutto il tempo), portiere fuori posizione (lontano
  // dal suo posto quando e' partito il tiro).
  // busy: secondi che il portiere passa ancora nel gesto in corso (a terra dopo un tuffo).
  assess(path = this.m.ball.predict(this.assessPath || (this.assessPath = []), 1 / 60, 2), busy = 0) {
    const k = this.p, R = KEEPER.reach, P = KEEPER.plan, toward = -this.dir;
    const react = lerp(KEEPER.react[0], KEEPER.react[1], this.skill) + busy;
    const dive = lerp(R.dive[0], R.dive[1], this.attr), full = R.body + R.arm + dive;
    let best = null, roomy = -Infinity, over = false, high = false;
    for (const s of path) {
      if (s.x * toward > HL + 0.3) break;
      const a = (s.x - k.pos.x) * k.dirX + (s.z - k.pos.z) * k.dirZ;
      // dietro di lui solo quanto arrivano le braccia: le clip non lo fanno arretrare
      if (a > P.ahead || a < -R.behind) { if (a < -R.behind) over = true; continue; }
      if (s.y > R.up) { high = true; continue; }
      const h = Math.hypot(s.x - k.pos.x, s.z - k.pos.z), tau = s.t - react;
      const arm = s.y < R.lowY ? R.armLow : R.arm;
      const reach = tau <= 0 ? R.body : R.body + arm * Math.min(1, tau / R.armTime) + dive * Math.min(1, tau / R.diveTime) ** 2;
      const margin = reach - h;
      if (!best || margin > best.margin) best = { margin, t: s.t, x: s.x, y: s.y, z: s.z };
      roomy = Math.max(roomy, full - (s.y < R.lowY ? R.arm - R.armLow : 0) - h);
    }
    if (!best) return { saveable: false, margin: -9, t: 0, reason: high ? 'tiro sotto la traversa, sopra le mani' : over ? 'pallonetto sopra il portiere' : 'lontano dal portiere' };
    const out = { saveable: best.margin >= 0, margin: best.margin, t: best.t, x: best.x, y: best.y, z: best.z, reason: '' };
    if (out.saveable) return out;
    if (busy > 0) { out.reason = 'portiere ancora a terra dopo la parata'; return out; }
    const home = this.spot(this.m.ball.pos);
    if (Math.hypot(home.x - k.pos.x, home.z - k.pos.z) > R.offPlace) out.reason = 'portiere fuori posizione';
    else out.reason = roomy >= 0 ? 'tiro troppo veloce' : 'tiro troppo angolato';
    return out;
  }

  moveTo(dt, tx, tz, sprint) {
    const k = this.p, b = this.m.ball.pos;
    const dx = tx - k.pos.x, dz = tz - k.pos.z, d = Math.hypot(dx, dz);
    const face = { x: b.x - k.pos.x, z: b.z - k.pos.z };
    // frenata calcolata per fermarsi sul punto, non oltre
    const brake = Math.sqrt(2 * PLAYER.decel * d) / k.params.maxSpeed;
    // in guardia (passi laterali e all'indietro) al massimo KEEPER.stepSpeed:
    // le sue clip oltre i 2,5 m/s fanno scivolare il piede appoggiato
    const guard = sprint ? 1 : KEEPER.stepSpeed / (k.params.maxSpeed * PLAYER.jogFactor);
    if (d < 0.15) k.drive(dt, 0, 0, 0, { face });
    else k.drive(dt, dx, dz, Math.min(1, guard, d / 1.5, brake), { face, sprint });
    // passo laterale: velocita' lungo la destra del busto
    k.sideSpeed = sprint ? 0 : k.vel.x * k.rightX + k.vel.z * k.rightZ;
  }

  // Tiro verso la porta: dove e quando attraversa la linea.
  crossing() {
    const m = this.m, b = m.ball;
    const toward = -this.dir;
    if (b.vel.x * toward < 3) return null;
    const path = b.predict(this.path, 1 / 60, 2);
    for (const s of path) {
      if (s.x * toward >= HL - 0.3) {
        if (Math.abs(s.z) < GOAL_HW + 1.2 && s.y < GOAL.height + 0.6) return s;
        return null;
      }
    }
    return null;
  }

  // PARATA: per ogni tiro nello specchio il portiere pianifica il gesto
  // (plan) e parte al momento giusto; la parata vera la decide la collisione
  // della palla con le sue mani e il suo corpo (touch).
  save() {
    const m = this.m, k = this.p, poss = m.poss;
    // tiro deviato da un giocatore (palla libera che va forte verso la porta): si para lo stesso
    const deflected = poss.free && m.lastDeflect && m.lastDeflect.seq === poss.seq;
    if (!deflected && (!poss.flying || poss.team === this.side)) { this.watch = null; return false; }
    if (this.watch === poss.seq) return false;
    // rigore contro l'utente che non ha ancora scelto: aspetta la sua levetta
    // per poco; un tuffo deciso in ritardo parte da dove e' la palla adesso
    const pen = this.penalty;
    if (pen && pen.guess === null) {
      const side = this.userSide();
      if (side !== null) pen.guess = side;
      else if (poss.age > RULES.penalty.lateWindow) pen.guess = 0;
      else { k.drive(1 / 60, 0, 0, 0, { face: { x: m.ball.pos.x - k.pos.x, z: m.ball.pos.z - k.pos.z } }); return true; }
    }
    const s = this.crossing();
    if (!s) return false;
    this.watch = poss.seq;
    // lettura del tiro: parabile o no per gli attributi, e perche'
    const a = this.assess();
    this.shot = { seq: poss.seq, deflected, ...a };
    m.note('lettura', { k, parabile: a.saveable, motivo: a.reason, margine: a.margin, t: a.t });
    // tiro fuori dallo specchio: lo si lascia andare
    if (Math.abs(s.z) > GOAL_HW + KEEPER.plan.wide || s.y > GOAL.height + KEEPER.plan.wide) return false;
    const plan = this.plan();
    if (!plan) return false;
    this.pending = { wait: plan.wait, seq: poss.seq, plan };
    this.lastPlan = plan;
    k.aiState = 'PARATA';
    return true;
  }

  // Lungo la traiettoria prevista (letta con l'errore del portiere), il
  // punto, la clip e il fotogramma in cui i palmi arrivano sulla palla:
  // tabelle tpl.poses per le mani, radice scalata entro scaleA/scaleS, clip
  // accelerata o fatta partire piu' avanti se il tempo e' poco.
  plan(options = libOptions(this.m.tpl, false), P = KEEPER.plan) {
    const m = this.m, k = this.p, tpl = m.tpl;
    const path = m.ball.predict(this.path, 1 / 60, P.horizon);
    let react = lerp(KEEPER.react[0], KEEPER.react[1], this.skill);
    const err = lerp(KEEPER.aim[0], KEEPER.aim[1], this.attr);
    const ex = gauss() * err, ey = gauss() * err * 0.6;
    let ez = gauss() * err;
    // rigore: il lato e' deciso prima del tiro; se sbaglia, si tuffa dall'altra parte
    const pen = this.penalty;
    this.penalty = null;
    if (pen) react = KEEPER.penaltyReact;
    const fx = k.dirX, fz = k.dirZ, rx = k.rightX, rz = k.rightZ;
    const toward = -this.dir;
    // se sta correndo il gesto parte da dove si sara' fermato
    const stop = k.speed * k.speed / (2 * PLAYER.decel), sl = k.speed || 1;
    const ox = k.pos.x + k.vel.x / sl * stop, oz = k.pos.z + k.vel.z / sl * stop;
    let best = null;
    for (let i = P.step - 1; i < path.length; i += P.step) {
      const s = path[i];
      if (s.x * toward > HL + 0.3) break;
      const avail = s.t - react;
      if (avail <= 0.05) continue;
      const px = s.x + ex, py = Math.max(BALL.radius, s.y + ey);
      const pz = pen && pen.guess !== pen.real ? pen.guess * (GOAL_HW - RULES.penalty.postMargin) : s.z + ez;
      const dx = px - ox, dz = pz - oz;
      const a = dx * fx + dz * fz, lat = dx * rx + dz * rz;
      // i cross arrivano di lato: si scorre tutta la traiettoria
      if (a > P.ahead || a < -P.behind || py > P.maxY) continue;
      for (const opt of options) {
        // palla sul corpo (entro P.standLat di lato): presa in piedi, mai un
        // tuffo che porta via testa e mani (tiro dritto in faccia, gol)
        if (opt.dive && Math.abs(lat) < (P.standLat || 0)) continue;
        const clip = opt.clip.endsWith('_') ? opt.clip + (lat >= 0 ? 'right' : 'left') : opt.clip;
        const tab = tpl.poses[clip];
        if (!tab) continue;
        const j0 = Math.ceil(opt.window[0] * tab.fps), j1 = Math.min(tab.n - 1, Math.floor(opt.window[1] * tab.fps));
        for (let j = j0; j <= j1; j++) {
          const tau = j / tab.fps;
          // la clip parte dopo la reazione e arriva al fotogramma tau proprio
          // quando la palla e' li' (s.t secondi da adesso)
          let from = opt.from, rate = 1;
          if (tau - from > avail) {
            rate = (tau - from) / avail;
            if (rate > P.rateMax) { rate = P.rateMax; from = tau - avail * rate; }
          }
          const wait = s.t - (tau - from) / rate;
          const r0 = rootAt(tpl, clip, from), r1 = rootAt(tpl, clip, tau);
          const da = r1.a - r0.a, ds = r1.s - r0.s;
          const ha = (tab.lh[j * 3] + tab.rh[j * 3]) / 2, hs = (tab.lh[j * 3 + 1] + tab.rh[j * 3 + 1]) / 2, hy = (tab.lh[j * 3 + 2] + tab.rh[j * 3 + 2]) / 2;
          const kA = Math.abs(da) > 0.05 ? clamp((a - ha) / da, opt.scaleA[0], opt.scaleA[1]) : 1;
          const kS = Math.abs(ds) > 0.05 ? clamp((lat - hs) / ds, opt.scaleS[0], opt.scaleS[1]) : 1;
          const e = Math.hypot(a - ha - kA * da, lat - hs - kS * ds, py - hy);
          // una clip fatta partire a meta' (poco tempo) mostra la posa di
          // meta' tuffo di colpo e porta via il corpo: su un rasoterra a 30 cm
          // dai piedi il portiere scivolava di lato e la palla passava dove era
          const cost = e + P.rateCost * Math.abs(rate - 1) + opt.bias + (P.skipCost || 0) * Math.max(0, from - opt.from);
          if (!best || cost < best.cost) best = { cost, e, opt, clip, tau, from, rate, wait, kA, kS, t: s.t, x: px, y: py, z: pz };
        }
      }
    }
    // Troppo lontano anche con l'IK: si prova lo stesso, ma senza toccarla niente parata.
    return best && best.e < KEEPER.plan.maxResidual * 2.5 ? best : null;
  }

  // Parata decisa: si parte al momento giusto. Con tempo (palla lenta, tiro
  // da lontano) prima ci si sposta a passi laterali verso il punto e si
  // ripianifica: fermo ad aspettare, su un rasoterra lento verso il palo il
  // tuffo partiva da 2 m e arrivava 70 cm corto.
  waitSave(dt) {
    const m = this.m, k = this.p, s = this.pending, Sh = KEEPER.shuffle;
    if (s.seq !== m.poss.seq) { this.pending = null; return false; }
    if ((s.wait -= dt) > 0) {
      const face = { x: m.ball.pos.x - k.pos.x, z: m.ball.pos.z - k.pos.z };
      if (s.wait > Sh.minWait && !s.claim) {
        const p = s.plan, gx = this.goalX, back = this.dir;
        // verso il punto dell'intercetto, mai dietro la linea di porta
        const tx = back > 0 ? Math.max(p.x, gx + Sh.line) : Math.min(p.x, gx - Sh.line);
        this.moveTo(dt, tx, clamp(p.z, -GOAL_HW, GOAL_HW), false);
        if ((s.replan = (s.replan ?? Sh.every) - dt) <= 0) {
          s.replan = Sh.every;
          const pl = this.plan();
          if (pl) { s.plan = pl; s.wait = pl.wait; this.lastPlan = pl; }
        }
      } else k.drive(dt, 0, 0, 0, { face });
      return true;
    }
    this.pending = null;
    const pl = s.plan;
    m.startKeeperGesture(k, pl.clip, pl.from, pl.tau, Math.min(pl.opt.end, clipDuration(m.tpl, pl.clip)), pl.rate,
      { scaleA: pl.kA, scaleS: pl.kS, catch: pl.opt.catch, dive: !pl.opt.catch, point: new THREE.Vector3(pl.x, pl.y, pl.z) });
    return true;
  }

  // Palla sulla sua area: le mani valgono solo li' dentro.
  inBox(x, z) {
    return Math.abs(x - this.goalX) < PITCH.penaltyDepth && Math.abs(z) < PITCH.penaltyWidth / 2;
  }

  // Nella sua area una palla degli avversari la prende solo con le mani
  // (touch): niente stop di piede al posto della parata.
  handsOnly() {
    const m = this.m, b = m.ball.pos;
    return this.inBox(b.x, b.z) && m.poss.team !== this.side;
  }

  // Collisione palla-portiere sulle sfere agganciate alle ossa vere: presa,
  // respinta di mano o palla sul corpo. Nessuna sfera toccata, nessuna parata.
  touch() {
    const m = this.m, k = this.p, b = m.ball, poss = m.poss;
    if (poss.owned || !b.live || (poss.flying && poss.team === this.side)) return false;
    if (m.kickLock && m.kickLock.p === k) return false;
    if (Math.hypot(b.pos.x - k.pos.x, b.pos.z - k.pos.z) > KEEPER.bodyCheck) return false;
    const hands = this.inBox(b.pos.x, b.pos.z);
    const hit = bodyHit(k, b, hands, poss.clock);
    if (!hit) {
      const a = k.action;
      if (hands && a && a.keeper && a.catchable && b.vel.length() < KEEPER.catchSpeed && gathered(k, b)) return this.held(b.vel.length(), 'mani');
      return false;
    }
    const n = _n.subVectors(hit.q, hit.c);
    if (n.lengthSq() < 1e-8) n.copy(b.vel).multiplyScalar(-1);
    n.normalize();
    b.pos.copy(hit.c).addScaledVector(n, hit.rad + BALL.radius + 0.005);
    const v = b.vel, speed = v.length(), a = k.action;
    // presa: palla fra i palmi in una parata che la puo' trattenere
    // (in una presa la seconda mano arriva un istante dopo: basta che sia vicina)
    if (hit.hand && a && a.keeper && palmsOn(k, b, a.catchable ? KEEPER.palmsCatch[1] : KEEPER.palmsCatch[0])) {
      const holdIt = a.catchable ? speed < KEEPER.catchSpeed * lerp(0.85, 1.1, this.attr)
        : a.dive && speed < KEEPER.diveCatchSpeed && Math.random() < lerp(KEEPER.diveCatch[0], KEEPER.diveCatch[1], this.attr);
      if (holdIt) return this.held(speed, 'mani');
    }
    // in una presa la palla che arriva sul corpo (gambe, pancia) con le mani
    // gia' vicine si raccoglie contro il corpo: un rasoterra a 17 m/s dritto
    // sui piedi rimbalzava via mentre le mani scendevano
    if (!hit.hand && a && a.catchable && speed < KEEPER.catchSpeed * lerp(0.85, 1.1, this.attr) && palmsOn(k, b, KEEPER.smother)) return this.held(speed, 'corpo');
    // respinta: rimbalzo sulla parte toccata, mai verso la propria porta
    const vn = v.dot(n);
    if (vn < 0) {
      const tang = _t.copy(v).addScaledVector(n, -vn).multiplyScalar(hit.hand ? 0.6 : 0.5);
      v.copy(tang).addScaledVector(n, -vn * (hit.hand ? KEEPER.parryRest : KEEPER.bodyRest));
    }
    if (hit.hand) v.y += lerp(KEEPER.parryLift[0], KEEPER.parryLift[1], Math.random());
    const toward = -this.dir;
    if (v.x * toward > 0) v.x = -v.x * 0.5;
    // mai nella propria porta: se la traiettoria della respinta entra fra i
    // pali, la palla esce in avanti (prima a volte rotolava dentro)
    for (const s of b.predict(this.path, 1 / 60, 1.2)) {
      if (s.x * toward < HL) continue;
      if (Math.abs(s.z) < GOAL_HW + BALL.radius && s.y < GOAL.height + BALL.radius) v.x = -toward * Math.max(KEEPER.parryOut, Math.abs(v.x));
      break;
    }
    poss.loose('parata', k);
    m.kickLock = { p: k, t: KEEPER.lock };
    this.lastTouch = { part: hit.hand ? 'mani' : 'corpo', result: 'respinta', speed, seq: poss.seq };
    m.note('parata', { k, parte: this.lastTouch.part, esito: 'respinta', velocita: speed, clip: k.avatar.gestureName() || '' });
    return true;
  }

  // Palla trattenuta (con le mani o raccolta contro il corpo).
  held(speed, part) {
    const m = this.m, k = this.p;
    m.gain(k, 'parata');
    k.holding = true;
    this.lastTouch = { part, result: 'presa', speed, seq: m.poss.seq };
    m.note('parata', { k, parte: part, esito: 'presa', velocita: speed, clip: k.avatar.gestureName() || '' });
    return true;
  }

  // Cross o lancio che scende vicino alla porta: esce. Stesso piano delle
  // parate (tabelle delle pose, IK, presa sul contatto) con le clip d'uscita;
  // finche' non ci arriva corre verso il punto di caduta e ripianifica.
  claim(dt) {
    const m = this.m, k = this.p, poss = m.poss;
    if (!poss.flying || poss.team === this.side || !/cross|lancio/.test(poss.kind || '')) return false;
    const path = m.ball.predict(this.path, 1 / 30, 3);
    let land = null, prevY = m.ball.pos.y;
    for (const s of path) {
      const falling = s.y < prevY;
      prevY = s.y;
      if (falling && s.y < KEEPER.claimPlan.maxY) { land = s; break; }
    }
    if (!land || Math.abs(land.x - this.goalX) > KEEPER.claimDist || Math.abs(land.z) > 9) return false;
    k.aiState = 'USCITA';
    if ((this.replan -= dt) <= 0) {
      this.replan = KEEPER.claimPlan.every;
      const plan = this.plan(libOptions(m.tpl, true), KEEPER.claimPlan);
      if (plan && plan.e < KEEPER.claimPlan.accept) {
        this.pending = { wait: plan.wait, seq: poss.seq, plan, claim: true };
        this.lastPlan = plan;
        return true;
      }
    }
    this.moveTo(dt, land.x, land.z, true);
    return true;
  }

  // Uscita chiesta dall'utente (Triangolo tenuto): il portiere va incontro al
  // portatore o alla palla, se e' nella sua meta' campo; la presa la fa rush.
  charge(dt) {
    const m = this.m, k = this.p, b = m.ball;
    if (Math.abs(b.pos.x - this.goalX) > KEEPER.chargeDist) return false;
    if (this.rush(dt)) return true;
    const o = m.owner, t = o && o.team !== this.side ? o.pos : b.pos;
    const lead = o ? 0.35 : 0.2;
    k.aiState = 'USCITA';
    this.moveTo(dt, t.x + (o ? o.vel.x : b.vel.x) * lead, t.z + (o ? o.vel.z : b.vel.z) * lead, true);
    return true;
  }

  // Palla libera o lunga in area: esce se ci arriva prima degli attaccanti.
  rush(dt) {
    const m = this.m, k = this.p, poss = m.poss, b = m.ball;
    if (!(poss.free || (poss.flying && poss.team !== this.side && poss.kind !== 'tiro'))) return false;
    if (Math.abs(b.pos.x - this.goalX) > KEEPER.rushDist || Math.abs(b.pos.z) > 20 || b.pos.y > 1.2) return false;
    const mine = m.interceptPoint(k, false);
    if (!mine) return false;
    for (const o of m.teams[this.side === 'home' ? 'away' : 'home'].players) {
      const s = m.interceptPoint(o, false);
      if (s && s.t < mine.t - 0.2) return false;
    }
    k.aiState = 'USCITA';
    const d = Math.hypot(b.pos.x - k.pos.x, b.pos.z - k.pos.z);
    if (d < 1.4 && Math.hypot(b.vel.x, b.vel.z) < 12) {
      // presa bassa: fra le prese con la palla vicina a terra, quella con la
      // palla dalla stessa parte e alla stessa distanza. Non quelle con la
      // palla in mano dal primo fotogramma: il loro contatto non e' la presa
      const lat = (b.pos.x - k.pos.x) * k.rightX + (b.pos.z - k.pos.z) * k.rightZ;
      const ahead = (b.pos.x - k.pos.x) * k.dirX + (b.pos.z - k.pos.z) * k.dirZ;
      let best = null, bc = Infinity;
      for (const o of libOptions(m.tpl, false)) {
        const c = m.tpl.meta[o.clip].ev.contact, w = c.ballW;
        if (!o.catch || o.held || !w || w[1] > 0.6) continue;
        const cost = Math.abs(-w[0] * m.tpl.scale - lat) + Math.abs(w[2] * m.tpl.scale - ahead) * 0.5;
        if (cost < bc) { bc = cost; best = { o, c }; }
      }
      if (best) {
        const t = best.c.t;
        m.startKeeperGesture(k, best.o.clip, Math.max(0, t - 0.15), t, best.o.end, 1, { catch: true, scaleS: 0.3, scaleA: 0.3, point: b.pos.clone() });
        return true;
      }
    }
    this.moveTo(dt, mine.x, mine.z, true);
    return true;
  }

  // RINVIO: con la palla in mano aspetta, poi la lancia a un compagno libero
  // vicino o calcia al volo lontano. Con la palla al piede la passa.
  distribute(dt) {
    const m = this.m, k = this.p;
    k.aiState = 'RINVIO';
    k.drive(dt, 0, 0, 0, { face: { x: this.dir, z: 0 } });
    this.hold += dt;
    if (this.hold < (k.holding ? KEEPER.holdTime : 0.6)) return;
    this.hold = 0;
    const mates = m.teams[this.side].players.filter((q) => q !== k && !q.down);
    const opp = m.teams[this.side === 'home' ? 'away' : 'home'].players;
    let near = null, nd = Infinity;
    for (const q of mates) {
      const d = Math.hypot(q.pos.x - k.pos.x, q.pos.z - k.pos.z);
      if (d < KEEPER.throwMax && freeness(q.pos.x, q.pos.z, opp) > 0.6 && d < nd) { nd = d; near = q; }
    }
    if (!k.holding) {
      const dx = near ? near.pos.x - k.pos.x : this.dir, dz = near ? near.pos.z - k.pos.z : 0, l = Math.hypot(dx, dz) || 1;
      m.startKick(k, near ? 'pass' : 'cross', near ? 0.2 : 0.8, { mag: 1, x: dx / l, z: dz / l, to: near || undefined });
      return;
    }
    // con le mani: la clip riparte dalla posa in cui teneva la palla; al volo:
    // la palla passa alla sinistra, cade e il destro la calcia
    if (near) {
      const T = releaseSpec(m.tpl, KEEPER.clips.throw);
      m.startKeeperGesture(k, T.clip, T.from, T.contact, T.end, T.rate, { release: 'throw', spec: T, target: near, scaleS: 0, scaleA: 0.4 });
    } else {
      let far = null, fa = -Infinity;
      for (const q of mates) {
        const a = q.pos.x * this.dir;
        if (a > fa && a < 15) { fa = a; far = q; }
      }
      const D = releaseSpec(m.tpl, KEEPER.clips.dropkick);
      m.startKeeperGesture(k, D.clip, D.from, D.contact, D.end, D.rate, { release: 'kick', spec: D, target: far, scaleS: 0, scaleA: 0.5 });
    }
  }

  // Lato (-1, 0, 1 in z) scelto con la levetta dall'utente che comanda il
  // portiere sul rigore avversario, null se la levetta e' ferma.
  userSide() {
    const inp = this.m.lastInp;
    if (!inp || inp.mag < RULES.penalty.commit) return null;
    return Math.abs(inp.z) > 0.35 ? Math.sign(inp.z) : 0;
  }

  // Rincorsa del rigore avversario: il portiere dell'utente si butta quando
  // si spinge la levetta; prima del calcio si sposta gia' verso quel lato.
  penaltyWatch(dt) {
    const m = this.m, k = this.p;
    if (this.dive === undefined || this.dive === null) {
      const side = this.userSide();
      if (side !== null) this.dive = { side, t: m.poss.clock };
    }
    const z = this.dive ? this.dive.side * 0.6 : 0;
    this.moveTo(dt, this.goalX + this.dir * 0.3, z, false);
  }

  // Rigore appena calciato verso il lato `side` (-1, 0, 1 in z). IA: indovina
  // con una probabilita' che cresce con difficolta' e attributo. Utente: il
  // lato scelto con la levetta; se non l'ha ancora scelto, save() aspetta.
  penaltyKicked(side) {
    const m = this.m, T = RULES.penalty;
    let guess;
    if (m.human(this.side)) guess = this.dive ? this.dive.side : null;
    else if (Math.random() < lerp(T.guess[0], T.guess[1], (this.skill + this.attr) / 2)) guess = side;
    else { const other = [-1, 0, 1].filter((v) => v !== side); guess = other[Math.floor(Math.random() * other.length)]; }
    this.penalty = { guess, real: side };
    this.dive = null;
    this.watch = null;
  }

  // Perche' e' entrata (evento 'gol' del nastro): il motivo letto al tiro se
  // la palla e' ancora quella (stesso volo); 'parabile' e' un difetto, il
  // test di durata lo segnala. Toccata dal portiere: respinta in porta.
  goalReason() {
    const m = this.m, s = this.shot;
    if (s && s.seq === m.poss.seq) return s.saveable ? 'parabile' : s.deflected ? 'deviazione (' + s.reason + ')' : s.reason;
    if (m.lastDeflect && m.lastDeflect.seq === m.poss.seq) return 'deviazione';
    if (this.lastTouch && this.lastTouch.seq === m.poss.seq) return 'toccata dal portiere';
    return m.poss.flying ? 'nessun tiro in porta letto (' + (m.poss.kind || '') + ')' : 'palla libera';
  }

  // Dopo il gol: si dispera, finito l'eventuale tuffo e quando si e' fermato
  // (Match.settle): in movimento la posa dello sconforto traslava.
  concede() {
    const k = this.p;
    const play = () => { k.concedeWait = KEEPER.clips.concede; };
    if (!k.action) { play(); return; }
    const prev = k.action.onEnd;
    k.action.onEnd = () => { if (prev) prev(); play(); };
  }
}

export const HELD_Y = BALL.radius + 0.95;   // palla in mano, se le ossa non sono ancora disegnate
