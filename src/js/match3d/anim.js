import * as THREE from 'three';
import { ANIM } from './config.js';
import { boneMap, solveTwoBone } from './rig.js';

// Animazioni dei calciatori (skill match3d, "Fluidita'"), sulla libreria Studio33.
// - buildLoco costruisce il blend tree della corsa dalle clip in ciclo della
//   libreria: per ogni stile (normale, difesa, conduzione, portiere, portiere
//   con la palla) ancore per direzione e, in ogni ancora, bande per velocita'.
//   Direzioni, velocita', appoggi e pose dei piedi sono misurati offline
//   (tools/match3d/studio33_build.py), non al caricamento.
// - Locomotion (una per giocatore) sceglie i pesi per velocita', direzione
//   rispetto al busto e stile, a 60 Hz con la fisica. Tutte le clip in ciclo
//   condividono una fase (0 = appoggio del piede destro). Fra clip simili di
//   una banda il giocatore ne tiene una sola finche' la banda e' in uso.
// - Le pose dei piedi agganciano gesti e corsa: un gesto parte dal
//   fotogramma piu' simile al passo in corso, la corsa riparte dalla fase
//   piu' simile alla fine del gesto (niente gambe che si incrociano).
// - FootLock tiene fermo il piede d'appoggio dopo il mixer.

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const wrap01 = (x) => x - Math.floor(x);
const wrapA = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const smooth = (a, b, x) => { const u = clamp((x - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };

export const POSE_N = 48;     // campioni per ciclo nelle tabelle delle pose
const CYCLES = 2520;          // contatore dei cicli: multiplo di ogni numero di coppie di passi fino a 10
const FEAT = 6;               // piede sinistro e destro: x, altezza, z rispetto al bacino
export const STYLES = ['normal', 'defense', 'dribble', 'keeper', 'keeperBall'];

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

export function poseDist(a, ao, b, bo) {
  let d = 0;
  for (let i = 0; i < FEAT; i++) { const w = i % 3 === 1 ? 2 : 1, x = a[ao + i] - b[bo + i]; d += w * x * x; }
  return d;
}

// Fase comune -> frazione della clip. Due marcatori di sincronia: la fase 0
// e' l'appoggio del destro, 0,5 quello del sinistro, in tutte le clip; fra i
// due il tempo scorre lineare. Cosi' nelle fusioni i due piedi appoggiano
// insieme (con un solo marcatore il sinistro di una clip cade in un altro
// momento e il piede scivola). Un ciclo con piu' coppie di passi (passi
// laterali) ne copre una per fase comune: `cyc` conta i cicli della fase.
export function clipFrac(g, phase, cyc = 0) {
  const u = wrap01(phase), c = g.k > 1 ? ((cyc % g.k) + g.k) % g.k : 0, G = g.gaps[c];
  return u < 0.5 ? wrap01(g.sR[c] + u * 2 * G[0]) : wrap01(g.sL[c] + (u - 0.5) * 2 * G[1]);
}

// Fase comune di una frazione della clip (inversa di clipFrac).
export function phaseOf(g, frac) {
  for (let c = 0; c < g.k; c++) {
    const G = g.gaps[c], a = wrap01(frac - g.sR[c]);
    if (a < G[0] + G[1] || c === g.k - 1) return a < G[0] ? 0.5 * a / G[0] : 0.5 + 0.5 * Math.min(1, (a - G[0]) / G[1]);
  }
  return 0;
}

// Cicli della libreria: velocita' naturale, verso, appoggi e pose per fase,
// misurati offline sullo scheletro del Calciatore. `s`: scala del modello.
export function gaitOf(meta, s) {
  const G = meta.gait;
  if (!G) return null;
  const g = { dur: G.dur, speed: G.speed * s, dir: G.dir, strikeR: G.strikeR, strikeL: G.strikeL, stanceR: G.stanceR, stanceL: G.stanceL };
  // coppie di passi del ciclo: appoggio del destro e del sinistro di ognuna,
  // e per ognuna la durata (frazione della clip) da destro a sinistro e ritorno
  g.sR = G.strikesR || [G.strikeR];
  g.sL = G.strikesL || [G.strikeL];
  const k = g.k = g.sR.length;
  g.gaps = g.sR.map((r, c) => {
    const a = wrap01(g.sL[c] - r) || 0.5 / k;
    return [a, k === 1 ? 1 - a : wrap01(g.sR[(c + 1) % k] - g.sL[c]) || 0.5 / k];
  });
  g.cycle = g.dur / k;                 // secondi di una coppia di passi
  g.stride = g.speed * g.cycle;        // metri di una coppia di passi a velocita' naturale
  const inPhase = (st, first, second) => st <= first ? 0.5 * st / first : 0.5 + 0.5 * Math.min(1, (st - first) / second);
  g.stancePhaseR = inPhase(g.stanceR, g.gaps[0][0], g.gaps[0][1]);
  g.stancePhaseL = inPhase(g.stanceL, g.gaps[0][1], g.gaps[0][0]);
  if (G.poses) { g.poses = new Float32Array(G.poses); for (let i = 0; i < g.poses.length; i++) g.poses[i] *= s; }
  g.touches = G.touches || [];
  return g;
}

// Tabella delle pose dei piedi di un gesto, fotogramma per fotogramma (30 Hz).
export function gesturePoses(meta, s) {
  if (!meta || !meta.feet) return null;
  const poses = new Float32Array(meta.feet);
  for (let i = 0; i < poses.length; i++) poses[i] *= s;
  return { fps: 30, n: meta.n, dur: meta.dur, poses };
}

// Altezza di punte e caviglie da fermi: sotto questa i piedi entrano nell'erba.
export function groundOf(holder, clip) {
  const rig = boneMap(holder);
  const mx = new THREE.AnimationMixer(holder);
  const a = mx.clipAction(clip);
  a.play();
  mx.update(0);
  holder.updateMatrixWorld(true);
  const v = new THREE.Vector3(), y = (b) => b.getWorldPosition(v).y;
  const out = { toe: Math.min(y(rig.LeftToeBase), y(rig.RightToeBase)), ankle: Math.min(y(rig.LeftFoot), y(rig.RightFoot)) };
  mx.stopAllAction();
  mx.uncacheRoot(holder);
  return out;
}

// Blend tree della corsa dalla libreria. Una fessura per clip e stile:
// { name, style, kind: 'idle' | 'ready' | 'cycle' }. Per stile: fermi (idle,
// guardia del portiere), ancore per direzione (radianti, + sinistra) con le
// bande per velocita'; ogni banda ha le clip simili fra cui scegliere.
export function buildLoco(tpl) {
  const lib = tpl.lib, gait = tpl.gait, slots = [], index = {};
  const slotOf = (name, style, kind) => {
    const key = style + '|' + name;
    if (index[key] === undefined) { index[key] = slots.length; slots.push({ name, style, kind }); }
    return index[key];
  };
  const loops = (style) => lib.role('loco').filter((e) => e.meta.style === style && gait[e.name]);
  const styles = {};
  for (const st of STYLES) {
    const S = styles[st] = { idle: [], ready: [], anchors: [] };
    for (const e of lib.role('idle')) if (e.meta.style === st) S.idle.push(slotOf(e.name, st, 'idle'));
    for (const e of lib.role('ready')) if (e.meta.style === st) S.ready.push(slotOf(e.name, st, 'ready'));
    // conduzione: in avanti le sue clip, di lato e all'indietro quelle normali
    let cyc = loops(st);
    const B = ANIM.borrow[st];
    if (B) cyc = cyc.concat(loops(B.from).filter((e) => Math.abs(gait[e.name].dir) >= B.minAngle));
    // ancore: stessa direzione misurata (a meno di 11 gradi)
    const groups = new Map();
    for (const e of cyc) {
      const k = Math.round(gait[e.name].dir / (Math.PI / 8));
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(e);
    }
    for (const list of groups.values()) {
      list.sort((a, b) => gait[a.name].speed - gait[b.name].speed);
      const bands = [];
      for (const e of list) {
        const g = gait[e.name], last = bands[bands.length - 1];
        const slot = slotOf(e.name, st, 'cycle');
        // clip di velocita' vicine: varianti della stessa banda
        if (last && g.speed < last.speed * (1 + ANIM.bandGap)) last.slots.push(slot);
        else bands.push({ speed: g.speed, slots: [slot] });
      }
      const dir = list.reduce((s, e) => s + gait[e.name].dir, 0) / list.length;
      S.anchors.push({ dir: Math.abs(dir) > Math.PI - 0.2 ? Math.PI : dir, bands });
    }
    S.anchors.sort((a, b) => a.dir - b.dir);
    const fwd = S.anchors.find((a) => Math.abs(a.dir) < 0.2) || S.anchors[0];
    S.walk = fwd ? fwd.bands[0].speed : 1;
  }
  // una banda vuota o uno stile senza clip ripiega sullo stile normale
  for (const st of STYLES) {
    const S = styles[st];
    if (!S.idle.length) S.idle = styles.normal.idle.slice();
    if (!S.anchors.length) { S.anchors = styles.normal.anchors; S.walk = styles.normal.walk; }
  }
  return { slots, styles, index };
}

// Istante della clip-gesto `info` fra lo e hi (secondi) con la posa dei piedi
// piu' vicina a `feat`; `pref` e' l'istante preferito, `bias` quanto conta.
// Restituisce { t, cost }.
export function matchPoseCost(info, feat, lo, hi, pref, bias = ANIM.matchBias) {
  if (!info || !info.poses) return { t: pref, cost: 0 };
  const i0 = Math.max(0, Math.ceil(lo * info.fps)), i1 = Math.min(info.n - 1, Math.floor(hi * info.fps));
  let best = pref, cost = Infinity;
  for (let i = i0; i <= i1; i++) {
    const t = i / info.fps;
    const c = poseDist(info.poses, i * FEAT, feat, 0) + bias * Math.abs(t - pref);
    if (c < cost) { cost = c; best = t; }
  }
  return { t: best, cost: Number.isFinite(cost) ? cost : 0 };
}

export function matchPose(info, feat, lo, hi, pref, bias) {
  return matchPoseCost(info, feat, lo, hi, pref, bias).t;
}

// Stato della corsa di un giocatore, aggiornato dalla fisica a 60 Hz.
// Il disegno legge pesi e fase interpolati (Avatar.update).
export class Locomotion {
  constructor(tpl, seed = 0) {
    this.tpl = tpl;
    this.seed = seed;
    this.keeper = false;
    this.style = 'normal';
    this.sw = {};                 // peso di ogni stile, sfuma verso quello chiesto
    for (const st of STYLES) this.sw[st] = st === 'normal' ? 1 : 0;
    this.picks = {};              // banda -> fessura scelta per questo giocatore
    this.setup();
    this.phase = 0; this.prevPhase = 0;
    this.cycle = 0; this.prevCycle = 0;   // cicli della fase: quale coppia di passi nelle clip che ne hanno piu' d'una
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
  }

  // Fessure dal blend tree del modello; ricostruito quando arrivano nuovi
  // pacchetti (livello medio): i pesi passano alle stesse clip per nome.
  setup() {
    const L = this.tpl.loco, old = this.L, w = this.w, pw = this.pw;
    this.L = L;
    this.version = this.tpl.locoVersion;
    const n = L.slots.length;
    this.w = new Float32Array(n);
    this.pw = new Float32Array(n);
    this.t = new Float32Array(n);
    if (old) {
      for (let i = 0; i < old.slots.length; i++) {
        const k = L.index[old.slots[i].style + '|' + old.slots[i].name];
        if (k !== undefined) { this.w[k] = w[i]; this.pw[k] = pw[i]; }
      }
      const picks = this.picks;
      this.picks = {};
      for (const key in picks) {
        const s = old.slots[picks[key]], k = L.index[s.style + '|' + s.name];
        if (k !== undefined) this.picks[key] = k;
      }
    } else {
      const i = this.pickIdle('normal');
      this.w[i] = this.pw[i] = 1;
    }
  }

  get slots() { return this.L.slots; }
  info(i) { const s = this.L.slots[i]; return s && s.kind === 'cycle' ? this.tpl.gait[s.name] : null; }
  isCycle(i) { return this.L.slots[i].kind === 'cycle'; }

  // Una clip fra le varianti di una banda, fissa finche' la banda resta in uso
  // (niente cambi continui fra clip simili); diversa da giocatore a giocatore.
  pick(key, list) {
    let k = this.picks[key];
    if (k !== undefined && list.includes(k)) return k;
    let h = this.seed | 0;
    for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
    k = list[Math.abs(h) % list.length];
    this.picks[key] = k;
    return k;
  }

  pickIdle(st) {
    const S = this.L.styles[st];
    return this.pick(st + ':idle', S.idle);
  }

  // Le bande non piu' usate lasciano libera la scelta per la prossima volta.
  releasePicks() {
    for (const key in this.picks) if (this.w[this.picks[key]] < 1e-4 && this.t[this.picks[key]] === 0) delete this.picks[key];
  }

  // Pesi obiettivo per velocita' `s` e direzione `a` (+ sinistra), per ogni
  // stile secondo il suo peso. Continui ovunque: anche passando da -pi a pi.
  targets(s, a) {
    const t = this.t, L = this.L;
    t.fill(0);
    for (const st of STYLES) {
      const sw = this.sw[st];
      if (sw < 1e-4) continue;
      const S = L.styles[st];
      const move = clamp(s / S.walk, 0, 1);
      const ready = S.ready.length ? this.ready : 0;
      const still = sw * (1 - move);
      if (still > 0) {
        t[this.pickIdle(st)] += still * (1 - ready);
        if (ready > 0) t[this.pick(st + ':ready', S.ready)] += still * ready;
      }
      if (move <= 0) continue;
      // due ancore attorno alla direzione, anche a cavallo di -pi/pi
      const A = S.anchors, n = A.length;
      let i0 = n - 1, i1 = 0, u = 0;
      for (let k = 0; k < n; k++) {
        const lo = A[k].dir, hi = k + 1 < n ? A[k + 1].dir : A[0].dir + Math.PI * 2;
        let x = a;
        if (x < A[0].dir) x += Math.PI * 2;
        if (x >= lo && x <= hi) { i0 = k; i1 = (k + 1) % n; u = (x - lo) / Math.max(1e-3, hi - lo); break; }
      }
      if (n === 1) { i0 = i1 = 0; u = 0; }
      for (const [k, wd] of [[i0, 1 - u], [i1, u]]) {
        if (wd <= 1e-4) continue;
        const bands = A[k].bands, m = sw * move * wd;
        let b0 = 0, b1 = 0, f = 0;
        if (s >= bands[bands.length - 1].speed) b0 = b1 = bands.length - 1;
        else {
          for (let j = 0; j < bands.length - 1; j++) {
            if (s <= bands[j + 1].speed) { b0 = j; b1 = j + 1; f = clamp((s - bands[j].speed) / (bands[j + 1].speed - bands[j].speed), 0, 1); break; }
          }
        }
        t[this.pick(st + k + ':' + b0, bands[b0].slots)] += m * (1 - f);
        if (f > 0) t[this.pick(st + k + ':' + b1, bands[b1].slots)] += m * f;
      }
    }
    return t;
  }

  // Un passo di fisica: `p` e' il giocatore appena mosso.
  step(dt, p) {
    const A = ANIM;
    if (this.version !== this.tpl.locoVersion) this.setup();
    this.keeper = !!p.keeper;
    this.prevPhase = this.phase;
    this.prevCycle = this.cycle;
    this.pw.set(this.w);
    this.prevRoll = this.roll; this.prevPitch = this.pitch;
    this.prevYaw = this.yaw;
    // stile: sfuma verso quello del momento (con la palla, in guardia, portiere)
    const want = p.locoStyle || 'normal', ks = 1 - Math.exp(-A.styleRate * dt);
    let ssum = 0;
    for (const st of STYLES) { this.sw[st] += ((st === want ? 1 : 0) - this.sw[st]) * ks; if (this.sw[st] < 1e-3) this.sw[st] = 0; ssum += this.sw[st]; }
    for (const st of STYLES) this.sw[st] /= ssum || 1;
    // velocita' vera: lo spostamento dell'ultimo passo, anche quello dato
    // dagli altri (separazione fra giocatori, radice delle clip), non solo la corsa voluta
    const mx = p.pos.x - p.prev.x, mz = p.pos.z - p.prev.z;
    const spd = dt > 0 ? Math.min(A.maxSpeed, Math.hypot(mx, mz) / dt) : 0;
    const moveDir = spd > 0.05 ? Math.atan2(mx, mz) : p.moveHeading;
    const turnRate = dt > 0 ? wrapA(p.heading - p.prevHeading) / dt : 0;
    // da fermi, girandosi, piccoli passi sul posto (verso dove si va, se ci si sposta)
    let eff = spd, rel = wrapA(moveDir - p.heading);
    const turnStep = Math.min(A.turnStepMax, Math.abs(turnRate) * A.turnStep);
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
    const kr = 1 - Math.exp(-A.readyRate * dt);
    this.ready += ((this.keeper && p.alert ? 1 : 0) - this.ready) * kr;
    // Corpo visibile: veloci non si corre di lato o all'indietro, il corpo si
    // gira verso la corsa (il busto resta verso lo sguardo, Avatar.twist).
    // Ruota al massimo di turnSlow..turnFast rad/s, o il piede a terra
    // striscerebbe; durante un gesto torna sul busto del gioco (direzione del calcio).
    const W = A.warp, busy = !!(p.avatar && p.avatar.one && !p.avatar.one.loco);
    const allowed = Math.PI + (W.minAngle - Math.PI) * smooth(W.from, W.to, this.blendSpeed);
    const target = p.heading + (busy ? 0 : this.ang - clamp(this.ang, -allowed, allowed));
    if (this.vis === null) this.vis = target;
    const turn = busy ? W.gestureTurn : W.turnSlow + (W.turnFast - W.turnSlow) * smooth(1, 5, this.blendSpeed);
    this.vis = wrapA(this.vis + clamp(wrapA(target - this.vis), -turn * dt, turn * dt));
    this.yaw = wrapA(this.vis - p.heading);
    const tg = this.targets(this.blendSpeed, wrapA(this.ang - this.yaw));
    // Pesi verso l'obiettivo, ma mai piu' di A.blendMax al secondo: quando
    // l'obiettivo cambia a scatti (direzione presa da fermi, un'altra clip)
    // una clip nuova saliva da 0 a 0,3 in un fotogramma e la posa saltava
    // (dita, bacino). Trovato col test di continuita'.
    const k = 1 - Math.exp(-A.blend * dt), cap = A.blendMax * dt;
    let sum = 0;
    for (let i = 0; i < tg.length; i++) { this.w[i] += clamp((tg[i] - this.w[i]) * k, -cap, cap); if (this.w[i] < 1e-4 && tg[i] === 0) this.w[i] = 0; sum += this.w[i]; }
    if (sum > 1e-6) for (let i = 0; i < tg.length; i++) this.w[i] /= sum;
    this.releasePicks();

    // una sola fase per tutte le clip in ciclo. Il piede d'appoggio della
    // fusione arretra di (passo fuso) x (cicli al secondo): resta fermo nel
    // mondo se i cicli al secondo sono velocita' vera / passo fuso. Il passo
    // fuso e' un vettore: due diagonali all'indietro in parti uguali fanno
    // un passo all'indietro piu' corto di ciascuna.
    let wf = 0, sx = 0, sz = 0, dur = 0, max = 0;
    for (let i = 0; i < this.w.length; i++) {
      const w = this.w[i];
      if (w < 1e-3) continue;
      const g = this.info(i);
      if (!g) continue;
      sx += w * g.stride * Math.sin(g.dir); sz += w * g.stride * Math.cos(g.dir);
      dur += w * g.cycle;
      max += w * (Math.abs(g.dir) > 0.3 ? A.dirMaxRate : A.maxRate);
      wf += w;
    }
    const stride = Math.max(0.3, Math.hypot(sx, sz) / Math.max(wf, 1e-6));
    this.freq = wf > 0 ? clamp(eff / stride, A.minRate * wf / dur, max / dur) : 0;
    // Ogni meta' della fase (da destro a sinistro, da sinistro a destro) dura
    // quanto nelle clip che pesano: nei passi laterali un piede segue l'altro
    // subito e poi c'e' una pausa lunga; a meta' e meta' la clip andrebbe al
    // rallentatore e poi di corsa, e il piede a terra scivolerebbe. Nelle corse
    // le due meta' sono quasi uguali e non cambia niente.
    let left = dt;
    while (left > 1e-9 && this.freq > 0) {
      const second = this.phase >= 0.5, end = second ? 1 : 0.5;
      const rate = this.freq * 0.5 / this.halfShare(second ? 1 : 0);
      const need = (end - this.phase) / rate;
      if (need > left) { this.phase += rate * left; left = 0; }
      else {
        left -= need;
        this.phase = end;
        if (end === 1) { this.phase = 0; this.cycle = (this.cycle + 1) % CYCLES; }
      }
    }

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
    let best = -1, cost = Infinity;
    for (let k = 0; k < POSE_N * g.k; k++) {
      const c = poseDist(g.poses, k * FEAT, feat, 0);
      if (c < cost) { cost = c; best = k; }
    }
    if (best < 0) return;
    this.phase = this.prevPhase = (best % POSE_N) / POSE_N;
    // la coppia di passi della posa trovata
    this.cycle = this.prevCycle = (this.cycle - (this.cycle % g.k) + Math.floor(best / POSE_N)) % CYCLES;
  }

  // Istante fra l'ultimo passo di fisica e quello prima.
  phaseAt(alpha) {
    let d = this.phase - this.prevPhase;
    if (d < -0.5) d += 1;
    return wrap01(this.prevPhase + d * alpha);
  }
  // Ciclo della fase allo stesso istante di phaseAt.
  cycleAt(alpha) {
    let d = this.phase - this.prevPhase;
    if (d < -0.5) d += 1;
    return this.prevPhase + d * alpha >= 1 ? this.cycle : this.prevCycle;
  }
  weightAt(i, alpha) { return this.pw[i] + (this.w[i] - this.pw[i]) * alpha; }
  yawAt(alpha) { return this.prevYaw + wrapA(this.yaw - this.prevYaw) * alpha; }
  leanAt(alpha) {
    return { roll: this.prevRoll + (this.roll - this.prevRoll) * alpha, pitch: this.prevPitch + (this.pitch - this.prevPitch) * alpha };
  }

  // Parte del ciclo occupata dalla meta' `h` (0: da destro a sinistro, 1: da
  // sinistro a destro) nelle clip in ciclo, media per peso; 0,5 senza clip.
  halfShare(h) {
    let s = 0, w = 0;
    for (let i = 0; i < this.w.length; i++) {
      const wi = this.w[i];
      if (wi < 1e-3) continue;
      const g = this.info(i);
      if (!g) continue;
      const G = g.gaps[g.k > 1 ? this.cycle % g.k : 0];
      s += wi * G[h] / (G[0] + G[1]); w += wi;
    }
    return w > 0 ? clamp(s / w, 0.15, 0.85) : 0.5;
  }

  // Clip in ciclo con piu' peso (per i tempi d'appoggio).
  dominant() {
    let best = -1, bw = 0;
    for (let i = 0; i < this.w.length; i++) if (this.w[i] > bw && this.info(i)) { bw = this.w[i]; best = i; }
    return best;
  }

  // Quota di movimento (0 fermi, 1 in corsa).
  get moving() {
    let still = 0;
    for (let i = 0; i < this.w.length; i++) if (!this.isCycle(i)) still += this.w[i];
    return 1 - still;
  }

  // Il piede ('R' | 'L') e' in appoggio a questa fase? Frazione dell'appoggio trascorsa.
  stance(side, phase) {
    const i = this.dominant();
    if (i < 0) return -1;
    const g = this.info(i);
    const u = wrap01(phase - (side === 'R' ? 0 : 0.5)), st = side === 'R' ? g.stancePhaseR : g.stancePhaseL;
    return u < st ? u / st : -1;
  }
}

// Tempo della clip della fessura `i` alla fase `phase` (0 = appoggio del
// piede destro) del ciclo `cyc`; null per le clip da fermi, che vanno per conto loro.
export function slotTime(loco, i, phase, cyc = 0) {
  const g = loco.info(i);
  if (!g) return null;
  return clipFrac(g, phase, cyc) * g.dur;
}

const _f = new THREE.Vector3(), _k = new THREE.Vector3(), _t = new THREE.Vector3();
const _h = new THREE.Vector3(), _n = new THREE.Vector3();

// Piede fermo nell'appoggio: si segna dove tocca terra e l'IK sulla gamba lo
// tiene li' finche' dura l'appoggio, al massimo a F.drift dal piede della clip.
// Solo a passo lento (F.maxSpeed). La gamba non si tende mai del tutto: se
// tenere il piede chiedesse piu' di F.reach della sua lunghezza, il punto resta
// al limite e il piede si libera fino al prossimo appoggio (bug trovato: in
// corsa il piede restava indietro, il ginocchio si bloccava teso per qualche
// fotogramma e poi scattava, una volta per passo).
export class FootLock {
  constructor(rig) {
    this.rig = rig;
    this.feet = ['Right', 'Left'].map((s) => ({ s, on: false, spent: false, w: 0, p: new THREE.Vector3() }));
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
      if (u < 0) f.spent = false;
      if (u >= 0 && u < 1 - F.liftEarly && !f.spent) {
        // se il blocco stava ancora sfumando riparte dal suo punto: un punto
        // nuovo col peso gia' alto farebbe saltare la gamba in un fotogramma
        if (!f.on) { f.on = true; if (f.w <= 0) f.p.copy(_f); }
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
      const hip = r[f.s + 'UpLeg'].getWorldPosition(_h);
      const len = hip.distanceTo(r[f.s + 'Leg'].getWorldPosition(_n)) + _n.distanceTo(_f);
      const far = _t.distanceTo(hip), reach = F.reach * len;
      // gamba mai tesa: il bersaglio si accorcia solo per questo fotogramma.
      // Riscritto in f.p, all'aggiornamento dopo tornava all'altezza della
      // clip, di nuovo fuori portata, e ogni chiamata (anche a passo zero)
      // tirava il piede un po' piu' verso l'anca
      if (far > reach) {
        _t.sub(hip).multiplyScalar(reach / far).add(hip);
        f.on = false;
        f.spent = true;
      }
      r[f.s + 'Leg'].getWorldPosition(_k);
      // il ginocchio resta sul piano della clip (guardia del portiere, passi
      // laterali): un polo lontano in avanti lo girava di colpo quando il blocco entrava
      _k.x += Math.sin(object.rotation.y) * F.pole; _k.z += Math.cos(object.rotation.y) * F.pole;
      solveTwoBone(r[f.s + 'UpLeg'], r[f.s + 'Leg'], (out) => foot.getWorldPosition(out), _t, f.w * move, _k);
    }
  }

  reset() { for (const f of this.feet) { f.on = false; f.spent = false; f.w = 0; } }
}
