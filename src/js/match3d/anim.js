import * as THREE from 'three';
import { ANIM } from './config.js';
import { boneMap, solveTwoBone } from './rig.js';

// Macchina delle animazioni della locomozione (blend tree) e piedi a terra.
// measureGait misura una volta sola, sulle clip vere, dove appoggiano i
// piedi; Gait (una per giocatore) avanza a 60 Hz con la fisica e decide pesi
// e fase; FootLock tiene fermo il piede d'appoggio dopo il mixer.

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const wrap01 = (x) => x - Math.floor(x);
const wrapA = (a) => Math.atan2(Math.sin(a), Math.cos(a));

// Fessure del blend tree, nell'ordine dei pesi di Gait.
export const SLOTS = (() => {
  const s = [...ANIM.forward];
  for (const [l, r] of ANIM.sides) s.push(l, r);
  s.push(ANIM.keeperStep);
  return s;
})();
const IDLE = 0, FWD = [1, 2, 3], SIDE0 = 4, KEEP = SLOTS.length - 1;

// Per ogni clip in ciclo: fasi d'appoggio dei piedi (strikeR, strikeL, 0..1),
// frazione del ciclo a terra, velocita' naturale e verso della corsa (radianti,
// 0 avanti, positivo a sinistra). Per le clip dei calci: istanti (s) in cui
// appoggia il piede sinistro. Il modello guarda +z, la sua sinistra e' +x.
export function measureGait(holder, clips) {
  const rig = boneMap(holder);
  const mx = new THREE.AnimationMixer(holder);
  const v = new THREE.Vector3(), h = new THREE.Vector3();
  const N = ANIM.gaitSamples;
  const out = {};
  const sample = (clip) => {
    const a = mx.clipAction(clip);
    a.play();
    const rows = [];
    for (let i = 0; i < N; i++) {
      a.time = i / N * clip.duration;
      mx.update(0);
      holder.updateMatrixWorld(true);
      rig.Hips.getWorldPosition(h);
      const row = { hx: h.x, hz: h.z };
      rig.RightFoot.getWorldPosition(v); row.ry = v.y; row.rx = v.x - h.x; row.rz = v.z - h.z;
      rig.LeftFoot.getWorldPosition(v); row.ly = v.y; row.lx = v.x - h.x; row.lz = v.z - h.z;
      rows.push(row);
    }
    a.stop();
    return rows;
  };
  const contact = (rows, k, band = ANIM.contactBand) => {
    let lo = Infinity;
    for (const r of rows) lo = Math.min(lo, r[k + 'y']);
    return rows.map((r) => r[k + 'y'] < lo + band);
  };
  const strikes = (c) => c.map((on, i) => on && !c[(i + N - 1) % N] ? i : -1).filter((i) => i >= 0);

  for (const name of new Set(SLOTS)) {
    const clip = clips[name];
    if (!clip || name === 'idle') continue;
    const rows = sample(clip), D = clip.duration;
    const g = { dur: D };
    let vx = 0, vz = 0, n = 0;
    for (const k of ['r', 'l']) {
      const c = contact(rows, k), s = strikes(c);
      const first = s.length ? s[0] : 0;
      g['strike' + k.toUpperCase()] = first / N;
      g['stance' + k.toUpperCase()] = c.filter(Boolean).length / N;
      // velocita' del piede a terra rispetto al bacino, media su tutto l'appoggio
      // stretto: a questa velocita' di corsa il piede resta fermo nel mondo
      const tight = contact(rows, k, ANIM.speedBand);
      for (let i = 0; i < N; i++) {
        const j = (i + 1) % N;
        if (!tight[i] || !tight[j]) continue;
        vx -= (rows[j][k + 'x'] - rows[i][k + 'x']) / (D / N);
        vz -= (rows[j][k + 'z'] - rows[i][k + 'z']) / (D / N);
        n++;
      }
    }
    if (n) { vx /= n; vz /= n; }
    g.speed = Math.max(0.5, Math.hypot(vx, vz));
    g.dir = Math.atan2(vx, vz);      // 0 avanti, +pi/2 a sinistra
    out[name] = g;
  }
  for (const name of ANIM.kicks) {
    const clip = clips[name];
    if (!clip) continue;
    const rows = sample(clip);
    out[name] = { dur: clip.duration, plantsL: strikes(contact(rows, 'l')).map((i) => i / N * clip.duration) };
  }
  mx.stopAllAction();
  mx.uncacheRoot(holder);
  return out;
}

// Stato della locomozione di un giocatore, aggiornato dalla fisica a 60 Hz.
// Il disegno legge i pesi e la fase interpolati (Avatar.update).
export class Gait {
  constructor(gait) {
    this.g = gait;
    this.keeper = false;
    this.keeperLeft = true;
    const n = SLOTS.length;
    this.w = new Float32Array(n); this.w[IDLE] = 1;
    this.pw = new Float32Array(n); this.pw[IDLE] = 1;
    this.t = new Float32Array(n);
    this.phase = 0; this.prevPhase = 0;
    this.ang = 0;
    this.speed = 0;
    this.lastMove = null; this.lastSpeed = 0;
    this.roll = 0; this.pitch = 0; this.prevRoll = 0; this.prevPitch = 0;
    this.freq = 0;
    // angoli di viaggio delle clip direzionali (misurati), dal lato sinistro
    this.anchors = ANIM.sides.map(([l]) => (gait[l] ? Math.abs(gait[l].dir) : 0));
  }

  info(i) { return this.g[SLOTS[i]]; }

  // Pesi obiettivo per velocita' `s` e angolo `a` fra corsa e busto (+ sinistra).
  targets(s, a) {
    const t = this.t, S = ANIM.speeds;
    t.fill(0);
    const move = clamp(s / S.walk, 0, 1);
    t[IDLE] = 1 - move;
    if (move <= 0) return t;
    // quota in avanti e quote direzionali, lineari fra gli angoli misurati
    const abs = Math.abs(a), left = a >= 0;
    const A = [0, ...this.anchors, Math.PI];
    const dir = new Array(A.length).fill(0);
    for (let i = 0; i < A.length - 1; i++) {
      if (abs <= A[i + 1]) { const u = (abs - A[i]) / Math.max(1e-3, A[i + 1] - A[i]); dir[i] = 1 - u; dir[i + 1] = u; break; }
    }
    // in avanti: camminata, corsa, scatto per velocita'
    const f = dir[0] * move;
    if (s <= S.walk) t[FWD[0]] += f;
    else if (s <= S.run) { const u = (s - S.walk) / (S.run - S.walk); t[FWD[0]] += f * (1 - u); t[FWD[1]] += f * u; }
    else if (s <= S.sprint) { const u = (s - S.run) / (S.sprint - S.run); t[FWD[1]] += f * (1 - u); t[FWD[2]] += f * u; }
    else t[FWD[2]] += f;
    for (let k = 0; k < ANIM.sides.length; k++) {
      const q = dir[k + 1] * move, i = SIDE0 + k * 2;
      t[left ? i : i + 1] += q;
    }
    // all'indietro (pi): meta' per parte sulle due diagonali all'indietro
    const back = dir[A.length - 1] * move, db = SIDE0 + (ANIM.sides.length - 1) * 2;
    t[db] += back * 0.5; t[db + 1] += back * 0.5;
    // portiere rivolto alla palla che si sposta di lato: il suo passo laterale
    if (this.keeper && this.g[ANIM.keeperStep] && s < ANIM.keeperStepMax) {
      const st = SIDE0 + 2;
      const q = t[st] + t[st + 1];
      t[st] = t[st + 1] = 0;
      t[KEEP] = q;
      this.keeperLeft = left;
    }
    // clip mancanti: il loro peso passa alla corsa in avanti
    for (let i = 1; i < t.length; i++) if (t[i] > 0 && !this.info(i)) { t[FWD[Math.min(2, Math.max(0, Math.round(s / S.run)))]] += t[i]; t[i] = 0; }
    return t;
  }

  // Un passo di fisica: `p` e' il giocatore appena mosso.
  step(dt, p) {
    const A = ANIM;
    this.keeper = !!p.keeper;
    this.prevPhase = this.phase;
    this.pw.set(this.w);
    this.prevRoll = this.roll; this.prevPitch = this.pitch;
    const spd = p.speed;
    const turnRate = dt > 0 ? wrapA(p.heading - p.prevHeading) / dt : 0;
    // da fermi, girandosi, piccoli passi sul posto
    let eff = spd, rel = wrapA(p.moveHeading - p.heading);
    const turnStep = Math.min(A.speeds.walk * 0.8, Math.abs(turnRate) * A.turnStep);
    if (turnStep > eff) { eff = turnStep; rel = 0; }
    this.speed = eff;
    this.ang += wrapA(rel - this.ang) * (1 - Math.exp(-A.angleRate * dt));
    const tg = this.targets(eff, this.ang);
    const k = 1 - Math.exp(-A.blend * dt);
    let sum = 0;
    for (let i = 0; i < tg.length; i++) { this.w[i] += (tg[i] - this.w[i]) * k; sum += this.w[i]; }
    if (sum > 1e-6) for (let i = 0; i < tg.length; i++) this.w[i] /= sum;

    // una sola fase per tutte le clip: frequenza media pesata dei loro cicli
    let wf = 0, f = 0;
    for (let i = 1; i < this.w.length; i++) {
      const w = this.w[i], g = this.info(i);
      if (w < 1e-3 || !g) continue;
      const max = i >= SIDE0 ? A.dirMaxRate : A.maxRate;
      f += w * clamp(eff / g.speed, A.minRate, max) / g.dur;
      wf += w;
    }
    this.freq = wf > 0 ? f / wf : 0;
    this.phase = wrap01(this.phase + this.freq * dt);

    // inclinazione: accelerazione laterale (curva) e in avanti (spinta, frenata)
    let lat = 0, fwd = 0;
    if (this.lastMove !== null && dt > 0) {
      lat = spd * wrapA(p.moveHeading - this.lastMove) / dt;
      fwd = (spd - this.lastSpeed) / dt;
    }
    this.lastMove = p.moveHeading; this.lastSpeed = spd;
    const L = A.lean, kl = 1 - Math.exp(-L.rate * dt);
    // rotation.z positivo piega verso destra; curva a sinistra (lat > 0) piega a sinistra
    this.roll += (clamp(-L.roll * lat, -L.maxRoll, L.maxRoll) - this.roll) * kl;
    this.pitch += (clamp(L.pitch * fwd, -L.maxBack, L.maxPitch) - this.pitch) * kl;
  }

  // Posizioni/istante fra l'ultimo passo di fisica e quello prima.
  phaseAt(alpha) {
    let d = this.phase - this.prevPhase;
    if (d < -0.5) d += 1;
    return wrap01(this.prevPhase + d * alpha);
  }
  weightAt(i, alpha) { return this.pw[i] + (this.w[i] - this.pw[i]) * alpha; }
  leanAt(alpha) {
    return { roll: this.prevRoll + (this.roll - this.prevRoll) * alpha, pitch: this.prevPitch + (this.pitch - this.prevPitch) * alpha };
  }

  // Clip in ciclo con piu' peso (per i tempi d'appoggio).
  dominant() {
    let best = -1, bw = 0;
    for (let i = 1; i < this.w.length; i++) if (this.w[i] > bw && this.info(i)) { bw = this.w[i]; best = i; }
    return best;
  }

  // Secondi di un ciclo completo (due passi) al ritmo attuale.
  cycle() { return this.freq > 1e-3 ? 1 / this.freq : Infinity; }

  // Quota di movimento (0 fermi, 1 in corsa).
  get moving() { return 1 - this.w[IDLE]; }

  // Fase dall'ultimo appoggio del piede sinistro e sua frazione a terra.
  leftFoot() {
    const i = this.dominant();
    if (i < 0) return null;
    const g = this.info(i);
    return { since: wrap01(this.phase - wrap01(g.strikeL - g.strikeR)), stance: g.stanceL };
  }

  // Il piede ('R' | 'L') e' in appoggio a questa fase? Frazione dell'appoggio trascorsa.
  stance(side, phase) {
    const i = this.dominant();
    if (i < 0) return -1;
    const g = this.info(i);
    const off = side === 'R' ? 0 : wrap01(g.strikeL - g.strikeR);
    const u = wrap01(phase - off), st = side === 'R' ? g.stanceR : g.stanceL;
    return u < st ? u / st : -1;
  }
}

// Tempo della clip della fessura `i` alla fase `phase` (0 = appoggio del piede destro).
export function slotTime(gait, i, phase, keeperLeft) {
  const g = gait.info(i);
  if (!g) return 0;
  // il passo laterale del portiere va verso sinistra: a destra si riproduce al contrario
  if (i === KEEP && !keeperLeft) return wrap01(g.strikeR + g.stanceR - phase) * g.dur;
  return wrap01(phase + g.strikeR) * g.dur;
}

export const IDLE_SLOT = IDLE;
export const KEEPER_SLOT = KEEP;

const _f = new THREE.Vector3(), _k = new THREE.Vector3(), _t = new THREE.Vector3();

// Piede fermo nell'appoggio: si segna dove tocca terra e l'IK sulla gamba lo
// tiene li' finche' dura l'appoggio, se non si allontana troppo dalla clip.
export class FootLock {
  constructor(rig) {
    this.rig = rig;
    this.feet = ['Right', 'Left'].map((s) => ({ s, on: false, w: 0, p: new THREE.Vector3() }));
  }

  apply(dt, gait, phase, oneW, object) {
    const F = ANIM.footLock;
    const move = gait.moving;
    const active = F.on && oneW < 0.05 && gait.speed < F.maxSpeed && move > F.minMove;
    if (!active && !this.feet[0].w && !this.feet[1].w) { this.feet[0].on = this.feet[1].on = false; return; }
    object.updateMatrixWorld(true);
    const r = this.rig;
    for (const f of this.feet) {
      const foot = r[f.s + 'Foot'];
      const u = active ? gait.stance(f.s[0], phase) : -1;
      foot.getWorldPosition(_f);
      if (u >= 0 && u < 1 - F.liftEarly) {
        if (!f.on) { f.on = true; f.p.copy(_f); }
        f.w = Math.min(1, f.w + dt / F.ramp);
      } else {
        f.on = false;
        f.w = Math.max(0, f.w - dt / F.release);
      }
      if (f.w <= 0) continue;
      const dx = f.p.x - _f.x, dz = f.p.z - _f.z;
      if (dx * dx + dz * dz > F.drift * F.drift) { f.on = false; f.w = 0; continue; }
      _t.set(f.p.x, _f.y, f.p.z);
      r[f.s + 'Leg'].getWorldPosition(_k);
      _k.x += Math.sin(object.rotation.y) * 0.5; _k.z += Math.cos(object.rotation.y) * 0.5;
      solveTwoBone(r[f.s + 'UpLeg'], r[f.s + 'Leg'], (out) => foot.getWorldPosition(out), _t, f.w * move, _k);
    }
  }

  reset() { for (const f of this.feet) { f.on = false; f.w = 0; } }
}

