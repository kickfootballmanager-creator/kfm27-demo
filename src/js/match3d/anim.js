import * as THREE from 'three';
import { ANIM } from './config.js';
import { boneMap, solveTwoBone } from './rig.js';

// Animazioni dei calciatori (skill match3d, "Fluidita'").
// - measureClips misura una volta sola, sulle clip vere: passi, velocita'
//   naturali, direzione di corsa e pose dei piedi.
// - Locomotion (una per giocatore) e' il blend space della corsa: velocita'
//   per direzione rispetto al busto, aggiornato a 60 Hz con la fisica. Tutte
//   le clip in ciclo condividono una fase (0 = appoggio del piede destro).
// - Le pose dei piedi agganciano gesti e corsa: un gesto parte dal
//   fotogramma piu' simile al passo in corso, la corsa riparte dalla fase
//   piu' simile alla fine del gesto (niente gambe che si incrociano).
// - FootLock tiene fermo il piede d'appoggio dopo il mixer.

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const wrap01 = (x) => x - Math.floor(x);
const wrapA = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const smooth = (a, b, x) => { const u = clamp((x - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };

// Fessure del blend tree, nell'ordine dei pesi di Locomotion.
export const SLOTS = (() => {
  const s = [...ANIM.forward];
  for (const [l, r] of ANIM.sides) s.push(l, r);
  s.push(ANIM.keeperStep, ANIM.keeperReady.clip);
  return s;
})();
const IDLE = 0, FWD = [1, 2, 3], SIDE0 = 4, KEEP = SLOTS.length - 2, READY = SLOTS.length - 1;
const CYCLE = SLOTS.map((_, i) => i !== IDLE && i !== READY);
export const IDLE_SLOT = IDLE;

const POSE_N = 48;            // campioni per ciclo nelle tabelle delle pose
const FEAT = 6;               // piede sinistro e destro: x, altezza, z rispetto al bacino

// Pose dei piedi nel riferimento del giocatore (x a sinistra, z avanti,
// metri): posizione orizzontale rispetto al bacino e altezza da terra.
// `yaw`: rotazione del giocatore nel mondo (0 nel modello di partenza).
export function feetPose(rig, yaw, out, o = 0) {
  const h = rig.Hips.matrixWorld.elements, hx = h[12], hz = h[14];
  const c = Math.cos(yaw), s = Math.sin(yaw);
  for (const [k, bone] of [[0, rig.LeftFoot], [3, rig.RightFoot]]) {
    const e = bone.matrixWorld.elements, dx = e[12] - hx, dz = e[14] - hz;
    out[o + k] = dx * c - dz * s;
    out[o + k + 1] = e[13];
    out[o + k + 2] = dx * s + dz * c;
  }
  return out;
}

function poseDist(a, ao, b, bo) {
  let d = 0;
  for (let i = 0; i < FEAT; i++) { const w = i % 3 === 1 ? 2 : 1, x = a[ao + i] - b[bo + i]; d += w * x * x; }
  return d;
}

// Fase comune -> frazione della clip. Due marcatori di sincronia: la fase 0
// e' l'appoggio del destro, 0,5 quello del sinistro, in tutte le clip; fra i
// due il tempo scorre lineare. Cosi' nelle fusioni i due piedi appoggiano
// insieme (con un solo marcatore il sinistro di una clip cade in un altro
// momento e il piede scivola).
export function clipFrac(g, phase) {
  const u = wrap01(phase);
  return u < 0.5 ? wrap01(g.strikeR + u * 2 * g.gapRL) : wrap01(g.strikeL + (u - 0.5) * 2 * (1 - g.gapRL));
}

// Misure sulle clip. Per le clip in ciclo: appoggi dei piedi (strikeR, strikeL,
// frazioni della clip), durata degli appoggi in fase comune, velocita' e
// passo naturali, verso della corsa (radianti, 0 avanti, positivo a sinistra),
// tabella delle pose per fase.
// Per le clip dei gesti in ANIM.match: tabella delle pose a ANIM.poseFps.
// Il modello guarda +z, la sua sinistra e' +x.
export function measureClips(holder, clips) {
  const rig = boneMap(holder);
  const mx = new THREE.AnimationMixer(holder);
  const v = new THREE.Vector3(), h = new THREE.Vector3();
  const N = ANIM.gaitSamples;
  const out = {};
  const pose = (a, t, table, o) => {
    a.time = t;
    mx.update(0);
    holder.updateMatrixWorld(true);
    feetPose(rig, 0, table, o);
  };
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
      for (const [k, bone] of [['r', rig.RightToeBase], ['l', rig.LeftToeBase], ['rf', rig.RightFoot], ['lf', rig.LeftFoot]]) {
        bone.getWorldPosition(v);
        row[k + 'y'] = v.y; row[k + 'x'] = v.x - h.x; row[k + 'z'] = v.z - h.z;
      }
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

  for (const name of new Set(SLOTS)) {
    const clip = clips[name];
    if (!clip || name === 'idle') continue;
    const rows = sample(clip), D = clip.duration;
    const g = { dur: D };
    // Velocita' naturale: mediana, su punte e caviglie, della velocita' del
    // piede a terra rispetto al bacino (a questa velocita' il piede resta
    // fermo nel mondo). Verso: la media degli stessi vettori.
    const mags = [];
    let vx = 0, vz = 0;
    for (const k of ['r', 'l', 'rf', 'lf']) {
      const tight = contact(rows, k, ANIM.speedBand);
      for (let i = 0; i < N; i++) {
        const j = (i + 1) % N;
        if (!tight[i] || !tight[j]) continue;
        const sx = -(rows[j][k + 'x'] - rows[i][k + 'x']) / (D / N), sz = -(rows[j][k + 'z'] - rows[i][k + 'z']) / (D / N);
        vx += sx; vz += sz;
        mags.push(Math.hypot(sx, sz));
      }
    }
    mags.sort((a, b) => a - b);
    g.speed = Math.max(0.5, mags.length ? mags[mags.length >> 1] : 0.5);
    g.stride = g.speed * D;          // metri di un ciclo (due passi) a velocita' naturale
    g.dir = Math.atan2(vx, vz);
    // Piede in appoggio: vicino a terra e fermo nel mondo alla velocita'
    // naturale (punta o tallone). La prima fase di ogni appoggio e' il suo marcatore.
    const nx = Math.sin(g.dir) * g.speed, nz = Math.cos(g.dir) * g.speed;
    const planted = (side) => {
      const out = new Array(N).fill(false);
      for (const k of [side, side + 'f']) {
        const low = contact(rows, k, ANIM.plantHeight);
        for (let i = 0; i < N; i++) {
          const a = rows[(i + N - 1) % N], b = rows[(i + 1) % N];
          const wx = nx + (b[k + 'x'] - a[k + 'x']) / (2 * D / N), wz = nz + (b[k + 'z'] - a[k + 'z']) / (2 * D / N);
          if (low[i] && Math.hypot(wx, wz) < ANIM.plantSlip * g.speed) out[i] = true;
        }
      }
      // via i campioni isolati
      return out.map((on, i) => on && (out[(i + N - 1) % N] || out[(i + 1) % N]));
    };
    for (const k of ['r', 'l']) {
      const c = planted(k);
      // l'appoggio piu' lungo: il suo primo campione
      let best = 0, bestLen = 0;
      for (let i = 0; i < N; i++) {
        if (!c[i] || c[(i + N - 1) % N]) continue;
        let n = 0;
        while (n < N && c[(i + n) % N]) n++;
        if (n > bestLen) { bestLen = n; best = i; }
      }
      g['strike' + k.toUpperCase()] = best / N;
      g['stance' + k.toUpperCase()] = bestLen / N;
    }
    // appoggi in fase comune: il destro da 0, il sinistro da 0,5
    g.gapRL = wrap01(g.strikeL - g.strikeR) || 0.5;
    const inPhase = (st, gap) => st <= gap ? 0.5 * st / gap : 0.5 + 0.5 * (st - gap) / (1 - gap);
    g.stancePhaseR = inPhase(g.stanceR, g.gapRL);
    g.stancePhaseL = inPhase(g.stanceL, 1 - g.gapRL);
    // pose per fase: il campione k e' alla fase k/POSE_N
    const a = mx.clipAction(clip);
    a.play();
    g.poses = new Float32Array(POSE_N * FEAT);
    for (let k = 0; k < POSE_N; k++) pose(a, clipFrac(g, k / POSE_N) * D, g.poses, k * FEAT);
    // posa di guardia del portiere: il fotogramma con i due piedi a terra e piu' larghi
    if (name === ANIM.keeperReady.clip) {
      const cr = contact(rows, 'r'), cl = contact(rows, 'l');
      let best = 0, bw = -1;
      for (let i = 0; i < N; i++) {
        if (!cr[i] || !cl[i]) continue;
        const w = Math.abs(rows[i].rx - rows[i].lx);
        if (w > bw) { bw = w; best = i; }
      }
      g.readyTime = best / N * D;
    }
    a.stop();
    out[name] = g;
  }
  // altezza di punte e caviglie da fermi (idle): sotto questa i piedi entrano nell'erba
  if (clips.idle) {
    const a = mx.clipAction(clips.idle);
    a.play();
    a.time = 0;
    mx.update(0);
    holder.updateMatrixWorld(true);
    const y = (b) => b.getWorldPosition(v).y;
    out.ground = { toe: Math.min(y(rig.LeftToeBase), y(rig.RightToeBase)), ankle: Math.min(y(rig.LeftFoot), y(rig.RightFoot)) };
    a.stop();
  }
  for (const name of ANIM.match) {
    const clip = clips[name];
    if (!clip) continue;
    const a = mx.clipAction(clip);
    a.play();
    const fps = ANIM.poseFps, n = Math.floor(clip.duration * fps) + 1;
    const g = { dur: clip.duration, fps, n, poses: new Float32Array(n * FEAT) };
    for (let i = 0; i < n; i++) pose(a, Math.min(i / fps, clip.duration - 1e-3), g.poses, i * FEAT);
    a.stop();
    out[name] = g;
  }
  mx.stopAllAction();
  mx.uncacheRoot(holder);
  return out;
}

// Istante della clip-gesto `info` fra lo e hi (secondi) con la posa dei piedi
// piu' vicina a `feat`; `pref` e' l'istante preferito, `bias` quanto conta.
export function matchPose(info, feat, lo, hi, pref, bias = ANIM.matchBias) {
  if (!info || !info.poses) return pref;
  const i0 = Math.max(0, Math.ceil(lo * info.fps)), i1 = Math.min(info.n - 1, Math.floor(hi * info.fps));
  let best = pref, cost = Infinity;
  for (let i = i0; i <= i1; i++) {
    const t = i / info.fps;
    const c = poseDist(info.poses, i * FEAT, feat, 0) + bias * Math.abs(t - pref);
    if (c < cost) { cost = c; best = t; }
  }
  return best;
}

// Stato della corsa di un giocatore, aggiornato dalla fisica a 60 Hz.
// Il disegno legge pesi e fase interpolati (Avatar.update).
export class Locomotion {
  constructor(gait) {
    this.g = gait;
    this.keeper = false;
    this.keeperLeft = true;
    const n = SLOTS.length;
    this.w = new Float32Array(n); this.w[IDLE] = 1;
    this.pw = new Float32Array(n); this.pw[IDLE] = 1;
    this.t = new Float32Array(n);
    this.phase = 0; this.prevPhase = 0;
    this.ang = 0;              // direzione della corsa rispetto al busto, sempre in [-pi, pi]
    this.speed = 0;            // velocita' vera (con i passi sul posto quando si gira)
    this.blendSpeed = 0;       // velocita' dei pesi: segue la vera come una molla critica
    this.blendVel = 0;
    this.ready = 0;            // portiere in guardia, 0..1
    this.yaw = 0; this.prevYaw = 0;   // corpo visibile rispetto al busto del gioco (warping, rotazione limitata)
    this.vis = null;                  // direzione del corpo visibile nel mondo
    this.lastMove = null; this.lastSpeed = 0;
    this.roll = 0; this.pitch = 0; this.prevRoll = 0; this.prevPitch = 0;
    this.freq = 0;
    // angoli di corsa delle clip direzionali (misurati), media fra i due lati
    this.anchors = ANIM.sides.map(([l, r]) => {
      const a = gait[l] ? Math.abs(gait[l].dir) : 0, b = gait[r] ? Math.abs(gait[r].dir) : a;
      return (a + (b || a)) / 2;
    });
  }

  info(i) { return this.g[SLOTS[i]]; }

  // Pesi obiettivo per velocita' `s` e direzione `a` (+ sinistra). Continui
  // ovunque: anche passando da -pi a pi (all'indietro) e al cambio fra
  // passo laterale del portiere e corsa di lato.
  targets(s, a) {
    const t = this.t, S = ANIM.speeds;
    t.fill(0);
    const move = clamp(s / S.walk, 0, 1);
    const still = 1 - move;
    const ready = this.info(READY) ? this.ready : 0;
    t[IDLE] = still * (1 - ready);
    t[READY] = still * ready;
    if (move <= 0) return t;
    const abs = Math.min(Math.PI, Math.abs(a)), left = a >= 0;
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
    for (let k = 0; k < ANIM.sides.length; k++) t[SIDE0 + k * 2 + (left ? 0 : 1)] += dir[k + 1] * move;
    // all'indietro (pi): meta' per parte sulle due diagonali all'indietro
    const back = dir[A.length - 1] * move, db = SIDE0 + (ANIM.sides.length - 1) * 2;
    t[db] += back * 0.5; t[db + 1] += back * 0.5;
    // portiere rivolto alla palla che si sposta di lato: il suo passo laterale,
    // che lascia il posto alla corsa di lato man mano che accelera
    if (this.keeper && this.info(KEEP)) {
      const st = SIDE0 + 2, share = smooth(ANIM.keeperStepMax, ANIM.keeperStepMax - ANIM.keeperStepBlend, s);
      const q = (t[st] + t[st + 1]) * share;
      t[st] *= 1 - share; t[st + 1] *= 1 - share;
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
    this.prevYaw = this.yaw;
    // velocita' vera: lo spostamento dell'ultimo passo, anche quello dato
    // dagli altri (separazione fra giocatori, radice delle clip), non solo la corsa voluta
    const mx = p.pos.x - p.prev.x, mz = p.pos.z - p.prev.z;
    const spd = dt > 0 ? Math.min(A.maxSpeed, Math.hypot(mx, mz) / dt) : 0;
    const moveDir = spd > 0.05 ? Math.atan2(mx, mz) : p.moveHeading;
    const turnRate = dt > 0 ? wrapA(p.heading - p.prevHeading) / dt : 0;
    // da fermi, girandosi, piccoli passi sul posto (verso dove si va, se ci si sposta)
    let eff = spd, rel = wrapA(moveDir - p.heading);
    const turnStep = Math.min(A.speeds.walk * 0.8, Math.abs(turnRate) * A.turnStep);
    if (turnStep > eff) { eff = turnStep; if (spd < A.dirHold) rel = 0; }
    this.speed = eff;
    // direzione filtrata sul cerchio; partendo da fermi si prende subito, o
    // passerebbe per tutte le clip fra la vecchia e la nuova
    if (eff > A.dirHold) this.ang = this.moving < A.dirSnap ? rel : wrapA(this.ang + wrapA(rel - this.ang) * (1 - Math.exp(-A.angleRate * dt)));
    // velocita' dei pesi: molla critica, partenze e arresti senza scatti
    const om = A.speedSpring, x = this.blendSpeed - eff, tmp = (this.blendVel + om * x) * dt, ex = Math.exp(-om * dt);
    this.blendVel = (this.blendVel - om * tmp) * ex;
    this.blendSpeed = Math.max(0, eff + (x + tmp) * ex);
    // portiere in guardia: posa della parata quando la palla e' vicina
    const kr = 1 - Math.exp(-A.keeperReady.rate * dt);
    this.ready += ((this.keeper && p.alert ? 1 : 0) - this.ready) * kr;
    // Corpo visibile: veloci non si corre di lato o all'indietro, il corpo si
    // gira verso la corsa (il busto resta verso lo sguardo, Avatar.twist).
    // Ruota al massimo di turnSlow..turnFast rad/s, o il piede a terra
    // striscerebbe; durante un gesto torna sul busto del gioco (direzione del calcio).
    const W = A.warp, busy = !!(p.avatar && p.avatar.one);
    const allowed = Math.PI + (W.minAngle - Math.PI) * smooth(W.from, W.to, this.blendSpeed);
    const target = p.heading + (busy ? 0 : this.ang - clamp(this.ang, -allowed, allowed));
    if (this.vis === null) this.vis = target;
    const turn = busy ? W.gestureTurn : W.turnSlow + (W.turnFast - W.turnSlow) * smooth(1, 5, this.blendSpeed);
    this.vis = wrapA(this.vis + clamp(wrapA(target - this.vis), -turn * dt, turn * dt));
    this.yaw = wrapA(this.vis - p.heading);
    const tg = this.targets(this.blendSpeed, wrapA(this.ang - this.yaw));
    const k = 1 - Math.exp(-A.blend * dt);
    let sum = 0;
    for (let i = 0; i < tg.length; i++) { this.w[i] += (tg[i] - this.w[i]) * k; sum += this.w[i]; }
    if (sum > 1e-6) for (let i = 0; i < tg.length; i++) this.w[i] /= sum;

    // una sola fase per tutte le clip in ciclo. Il piede d'appoggio della
    // fusione arretra di (passo fuso) x (cicli al secondo): resta fermo nel
    // mondo se i cicli al secondo sono velocita' vera / passo fuso. Il passo
    // fuso e' un vettore: due diagonali all'indietro in parti uguali fanno
    // un passo all'indietro piu' corto di ciascuna.
    let wf = 0, sx = 0, sz = 0, dur = 0, max = 0;
    for (let i = 0; i < this.w.length; i++) {
      const w = this.w[i], g = this.info(i);
      if (!CYCLE[i] || w < 1e-3 || !g) continue;
      const d = i === KEEP && !this.keeperLeft ? -g.dir : g.dir;
      sx += w * g.stride * Math.sin(d); sz += w * g.stride * Math.cos(d);
      dur += w * g.dur;
      max += w * (i >= SIDE0 ? A.dirMaxRate : A.maxRate);
      wf += w;
    }
    const stride = Math.max(0.3, Math.hypot(sx, sz) / Math.max(wf, 1e-6));
    this.freq = wf > 0 ? clamp(eff / stride, A.minRate * wf / dur, max / dur) : 0;
    this.phase = wrap01(this.phase + this.freq * dt);

    // inclinazione: accelerazione laterale (curva) e in avanti (spinta, frenata)
    let lat = 0, fwd = 0;
    if (this.lastMove !== null && dt > 0) {
      lat = spd * wrapA(moveDir - this.lastMove) / dt;
      fwd = (spd - this.lastSpeed) / dt;
    }
    this.lastMove = moveDir; this.lastSpeed = spd;
    const L = A.lean, kl = 1 - Math.exp(-L.rate * dt);
    // rotation.z positivo piega verso destra; curva a sinistra (lat > 0) piega a sinistra
    this.roll += (clamp(-L.roll * lat, -L.maxRoll, L.maxRoll) - this.roll) * kl;
    this.pitch += (clamp(L.pitch * fwd, -L.maxBack, L.maxPitch) - this.pitch) * kl;
  }

  // Riposizionamento (Player.place): il corpo visibile riparte dal busto.
  reset() { this.vis = null; this.yaw = this.prevYaw = 0; }

  // Fine di un gesto: la corsa riparte dalla fase con i piedi piu' simili a
  // `feat` (la posa del gesto in quel momento), senza incrociare le gambe.
  resync(feat) {
    const i = this.dominant();
    const g = i >= 0 ? this.info(i) : null;
    if (!g || !g.poses || this.moving < 0.05) return;
    let best = this.phase, cost = Infinity;
    for (let k = 0; k < POSE_N; k++) {
      const c = poseDist(g.poses, k * FEAT, feat, 0);
      if (c < cost) { cost = c; best = k / POSE_N; }
    }
    this.phase = this.prevPhase = best;
  }

  // Istante fra l'ultimo passo di fisica e quello prima.
  phaseAt(alpha) {
    let d = this.phase - this.prevPhase;
    if (d < -0.5) d += 1;
    return wrap01(this.prevPhase + d * alpha);
  }
  weightAt(i, alpha) { return this.pw[i] + (this.w[i] - this.pw[i]) * alpha; }
  yawAt(alpha) { return this.prevYaw + wrapA(this.yaw - this.prevYaw) * alpha; }
  leanAt(alpha) {
    return { roll: this.prevRoll + (this.roll - this.prevRoll) * alpha, pitch: this.prevPitch + (this.pitch - this.prevPitch) * alpha };
  }

  // Clip in ciclo con piu' peso (per i tempi d'appoggio).
  dominant() {
    let best = -1, bw = 0;
    for (let i = 0; i < this.w.length; i++) if (CYCLE[i] && this.w[i] > bw && this.info(i)) { bw = this.w[i]; best = i; }
    return best;
  }

  // Quota di movimento (0 fermi, 1 in corsa).
  get moving() { return 1 - this.w[IDLE] - this.w[READY]; }

  // Il piede ('R' | 'L') e' in appoggio a questa fase? Frazione dell'appoggio trascorsa.
  stance(side, phase) {
    const i = this.dominant();
    if (i < 0) return -1;
    const g = this.info(i);
    const u = wrap01(phase - (side === 'R' ? 0 : 0.5)), st = side === 'R' ? g.stancePhaseR : g.stancePhaseL;
    return u < st ? u / st : -1;
  }
}

// Tempo della clip della fessura `i` alla fase `phase` (0 = appoggio del piede destro).
export function slotTime(loco, i, phase) {
  const g = loco.info(i);
  if (!g) return 0;
  if (i === READY) return g.readyTime || 0;
  // il passo laterale del portiere va verso sinistra: a destra si riproduce al contrario
  if (i === KEEP && !loco.keeperLeft) return wrap01(g.strikeR + g.stanceR - phase) * g.dur;
  return clipFrac(g, phase) * g.dur;
}

const _f = new THREE.Vector3(), _k = new THREE.Vector3(), _t = new THREE.Vector3();

// Piede fermo nell'appoggio: si segna dove tocca terra e l'IK sulla gamba lo
// tiene li' finche' dura l'appoggio, al massimo a F.drift dal piede della clip.
export class FootLock {
  constructor(rig) {
    this.rig = rig;
    this.feet = ['Right', 'Left'].map((s) => ({ s, on: false, w: 0, p: new THREE.Vector3() }));
  }

  apply(dt, loco, phase, oneW, object) {
    const F = ANIM.footLock;
    const move = loco.moving;
    const active = F.on && oneW < 0.05 && loco.speed < F.maxSpeed && move > F.minMove;
    if (!active && !this.feet[0].w && !this.feet[1].w) { this.feet[0].on = this.feet[1].on = false; return; }
    object.updateMatrixWorld(true);
    const r = this.rig;
    for (const f of this.feet) {
      const foot = r[f.s + 'Foot'];
      const u = active ? loco.stance(f.s[0], phase) : -1;
      foot.getWorldPosition(_f);
      if (u >= 0 && u < 1 - F.liftEarly) {
        if (!f.on) { f.on = true; f.p.copy(_f); }
        f.w = Math.min(1, f.w + dt / F.ramp);
      } else {
        f.on = false;
        f.w = Math.max(0, f.w - dt / F.release);
      }
      if (f.w <= 0) continue;
      // il punto fermo non si allontana dal piede della clip piu' di F.drift:
      // se la clip va oltre lo trascina con se', mai uno scatto
      const dx = f.p.x - _f.x, dz = f.p.z - _f.z, d = Math.hypot(dx, dz);
      if (d > F.drift) { const k = F.drift / d; f.p.x = _f.x + dx * k; f.p.z = _f.z + dz * k; }
      _t.set(f.p.x, _f.y, f.p.z);
      r[f.s + 'Leg'].getWorldPosition(_k);
      _k.x += Math.sin(object.rotation.y) * 0.5; _k.z += Math.cos(object.rotation.y) * 0.5;
      solveTwoBone(r[f.s + 'UpLeg'], r[f.s + 'Leg'], (out) => foot.getWorldPosition(out), _t, f.w * move, _k);
    }
  }

  reset() { for (const f of this.feet) { f.on = false; f.w = 0; } }
}
