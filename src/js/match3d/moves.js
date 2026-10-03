import * as THREE from 'three';
import { BALL, KEEPER, FOULACT } from './config.js';
import { solveTwoBoneKeep, solveTwoBone, solveArm, releaseArm, blendPath, palm } from './rig.js';

// Ritocchi in codice sopra le clip, dopo il mixer (Avatar.update): solo IK
// delle braccia (arbitro, mani del portiere sulla palla). Nessun movimento
// a tutto corpo creato qui: quelli vengono dalle clip.

const _R = new THREE.Vector3();
const _v = new THREE.Vector3(), _w = new THREE.Vector3(), _hip = new THREE.Vector3();
const _pole = new THREE.Vector3(), _tgt = new THREE.Vector3(), _pl = new THREE.Vector3(), _pr = new THREE.Vector3();

// Gesti dell'arbitro, creati in codice (non ci sono clip): IK sulle braccia
// verso una direzione nel mondo. kind: 'point' (punizione, rimessa, braccio
// verso la direzione), 'up' (punizione indiretta, fuorigioco, cartellino),
// 'advantage' (vantaggio: tutte e due le braccia in avanti), 'spot' (rigore:
// verso il dischetto). `dir`: vettore orizzontale nel mondo.
// Un gesto che ne sostituisce uno ancora in corso (cartellino subito dopo
// l'indicazione del fallo) parte dalla sua posa: durante la salita braccio e
// peso passano da quelli di prima ai nuovi (bug trovato col test di
// continuita': il braccio tornava giu' in un fotogramma e poi risaliva).
export class RefSignal {
  constructor(def, kind, dir) {
    this.def = def;
    this.kind = kind;
    this.dir = new THREE.Vector3(dir.x, 0, dir.z).normalize();
    this.t = 0;
    this.from = null;                           // posa del gesto sostituito, per braccio
    this.state = { Right: null, Left: null };   // direzione e peso dell'ultimo aggiornamento
    this.memo = { Right: {}, Left: {} };        // ultima soluzione dell'IK (rig.solveTwoBoneKeep)
  }

  takeOver(prev) {
    if (prev instanceof RefSignal) {
      this.from = { Right: prev.state.Right, Left: prev.state.Left };
      // anche il peso applicato: da zero il braccio saltava giu' e risaliva
      this.state = { Right: prev.state.Right, Left: prev.state.Left };
      this.memo = prev.memo;
    }
  }

  // Direzione del braccio `side` per questo gesto; null se il braccio resta libero.
  aim(side) {
    const d = this.dir;
    if (side === 'Left') return this.kind === 'advantage' ? new THREE.Vector3(d.x, -0.15, d.z) : null;
    if (this.kind === 'up') return new THREE.Vector3(d.x * 0.1, 1, d.z * 0.1);
    if (this.kind === 'spot') return new THREE.Vector3(d.x, -0.55, d.z);
    if (this.kind === 'advantage') return new THREE.Vector3(d.x, -0.15, d.z);
    return new THREE.Vector3(d.x, 0.25, d.z);
  }

  update(av, dt) {
    const S = this.def.signal;
    this.t += dt;
    const t = this.t, total = S.rise + S.hold + S.fall, over = t >= total;
    const u = smooth01(t / S.rise);
    const w = over ? 0 : t < S.rise + S.hold ? u : smooth01(1 - (t - S.rise - S.hold) / S.fall);
    const r = av.rig, o = av.object;
    o.updateMatrixWorld(true);
    let busy = false;
    for (const side of ['Right', 'Left']) {
      const want = over ? null : this.aim(side), prev = this.from && this.from[side], last = this.state[side];
      let v = want ? want.normalize() : null, k = want ? w : 0;
      if (prev && t < S.rise) {
        v = want ? prev.v.clone().lerp(want, u).normalize() : prev.v;
        k = prev.w + ((want ? 1 : 0) - prev.w) * u;
      }
      if (!v && last) v = last.v;     // braccio che scende: resta la direzione di prima
      // il peso applicato insegue k al massimo di S.turn rad/s di braccio: con
      // la clip lontana (braccio che oscilla in corsa) la fusione arrivava a
      // 0,4 rad a passo, la correzione dei salti lo teneva fermo e poi scattava
      const cur = last ? last.w : 0, step = S.turn / Math.max(blendPath(this.memo[side]), 1e-3) * dt;
      k = cur + Math.max(-step, Math.min(step, k - cur));
      if (!v || k <= 1e-3) { this.state[side] = null; this.memo[side] = {}; continue; }
      busy = true;
      this.state[side] = { v: v.clone(), w: k };
      r[side + 'Arm'].getWorldPosition(_hip);
      _tgt.copy(v).multiplyScalar(this.def.armLen).add(_hip);
      // gomito verso l'esterno e in basso: col braccio alzato un polo solo sotto
      // il gomito sta sulla linea del braccio e il gomito si ribaltava
      const h = o.rotation.y, out = side === 'Right' ? 0.4 : -0.4;
      _pole.copy(_hip).add(_v.set(-Math.cos(h) * out, -0.4, Math.sin(h) * out));
      // IK piena verso il braccio teso, poi fusione delle rotazioni con la
      // clip: sfumando il bersaglio in linea retta la mano passava dove il
      // polo non definisce il gomito, e il gomito si ribaltava
      solveTwoBoneKeep(r[side + 'Arm'], r[side + 'ForeArm'], (p) => palm(r, side, p), _tgt, k, _pole, this.memo[side]);
    }
    // finito il tempo, resta finche' le braccia non sono tornate alla clip
    return !over || busy;
  }
}

const smooth01 = (u) => { const c = Math.max(0, Math.min(1, u)); return c * c * (3 - 2 * c); };

// Portiere in parata: IK sulle braccia che porta i due palmi ai lati della
// palla. Il gioco aggiorna target (centro palla) e weight a ogni passo.
// Il peso applicato (cur) insegue quello chiesto al massimo a KEEPER.ik.rate
// al secondo e sfuma anche quando il gesto sparisce: prima, alla presa, il
// peso passava da 1 a 0 e le braccia tornavano alla clip in un fotogramma.
// Mano di chi commette il fallo sulla maglia o sulla schiena dell'avversario
// (spinta, trattenuta): IK anatomica del braccio `side` (rig.solveArm) verso
// `target`, che il gesto rinnova a ogni passo (ttl). Il peso sale e scende al
// massimo di FOULACT.ik.rate al secondo e di ik.turn rad/s di braccio.
export class HandOn {
  constructor(side) {
    this.side = side;
    this.target = new THREE.Vector3();
    this.weight = 0;
    this.cur = 0;
    this.ttl = 0.25;
    this.memo = {};
  }

  update(av, dt) {
    const I = FOULACT.ik, r = av.rig, A = r[this.side + 'Arm'], B = r[this.side + 'ForeArm'];
    const want = (this.ttl -= dt) > 0 ? this.weight : 0;
    const step = Math.min(I.rate, I.turn / Math.max(blendPath(this.memo), 1e-3)) * dt;
    this.cur += Math.max(-step, Math.min(step, want - this.cur));
    if (this.cur <= 1e-3) {
      if (releaseArm(A, B, this.memo, I.arm * dt)) return true;
      this.memo = {};
      return this.ttl > 0;
    }
    av.object.updateMatrixWorld(true);
    solveArm(A, B, (out) => palm(r, this.side, out), this.target, this.cur, this.side, this.memo, I.arm * dt);
    return true;
  }
}

// Piede di chi entra sulla caviglia dell'avversario (contrasto in ritardo,
// sgambetto): IK della gamba `side` verso `target`, ginocchio sul piano della
// clip (polo come FootLock), gamba mai tesa del tutto. Il peso sale e scende
// al massimo di FOULACT.ik.rate al secondo.
const _hp = new THREE.Vector3(), _kp = new THREE.Vector3(), _ax = new THREE.Vector3(), _ft = new THREE.Vector3();
export class FootOn {
  constructor(side) {
    this.side = side;
    this.target = new THREE.Vector3();
    this.weight = 0;
    this.cur = 0;
    this.ttl = 0.25;
  }

  update(av, dt) {
    const I = FOULACT.ik, want = (this.ttl -= dt) > 0 ? this.weight : 0, step = I.rate * dt;
    this.cur += Math.max(-step, Math.min(step, want - this.cur));
    if (this.cur <= 1e-3) return this.ttl > 0;
    const r = av.rig, A = r[this.side + 'UpLeg'], B = r[this.side + 'Leg'], foot = r[this.side + 'Foot'];
    av.object.updateMatrixWorld(true);
    const hip = A.getWorldPosition(_hp), len = hip.distanceTo(B.getWorldPosition(_kp)) + _kp.distanceTo(foot.getWorldPosition(_ft));
    _ft.copy(this.target);
    const far = _ft.distanceTo(hip);
    if (far > 0.97 * len) _ft.sub(hip).multiplyScalar(0.97 * len / far).add(hip);
    const e = B.matrixWorld.elements;
    _ax.set(e[0], e[1], e[2]).cross(_tgt.subVectors(_ft, hip)).normalize();
    B.getWorldPosition(_kp).addScaledVector(_ax, 0.3);
    solveTwoBone(A, B, (out) => foot.getWorldPosition(out), _ft, this.cur, _kp);
    return true;
  }
}

export class KeeperReach {
  constructor(gap) {
    this.gap = gap;
    this.target = new THREE.Vector3();
    this.weight = 0;
    this.cur = 0;
    this.done = false;
    this.ttl = 0.25;       // il gesto lo rinnova a ogni passo: se il gesto sparisce, l'IK sfuma
    this.memo = { Left: {}, Right: {} };   // ultima soluzione dell'IK (rig.solveArm)
    this.stick = false;    // dal gioco, dopo il contatto: le mani restano dove sono, col corpo
    this.local = null;     // bersaglio nel riferimento del portiere
    this.axis = null;      // ultima linea fra i palmi della clip
  }

  // Una parata ripianificata ne prende il posto dal peso e dalle braccia a cui era arrivata.
  takeOver(prev) {
    if (prev instanceof KeeperReach) { this.cur = prev.cur; this.memo = prev.memo; }
  }

  update(av, dt) {
    if (this.done) return false;
    // il peso cambia al massimo di KEEPER.ik.turn rad/s di rotazione del
    // braccio: con clip e IK lontane (anche oltre mezzo giro) a KEEPER.ik.rate
    // il braccio correva fino a 1,4 rad in un fotogramma
    const path = Math.max(blendPath(this.memo.Left), blendPath(this.memo.Right));
    const I = KEEPER.ik, rate = this.urgent ? I.urgentRate : I.rate, turn = this.urgent ? I.urgentTurn : I.turn;
    const want = (this.ttl -= dt) > 0 ? this.weight : 0, step = Math.min(rate, turn / Math.max(path, 1e-3)) * dt;
    this.cur += Math.max(-step, Math.min(step, want - this.cur));
    if (this.cur <= 1e-3) {
      // IK spenta: le braccia tornano alla clip senza scatti (rig.releaseArm)
      const r = av.rig, max = KEEPER.ik.arm * dt;
      if (releaseArm(r.LeftArm, r.LeftForeArm, this.memo.Left, max) | releaseArm(r.RightArm, r.RightForeArm, this.memo.Right, max)) return true;
      this.memo = { Left: {}, Right: {} };
      return this.ttl > 0;
    }
    const r = av.rig, o = av.object;
    o.updateMatrixWorld(true);
    // dopo il contatto le mani restano dove hanno incontrato la palla ma col
    // corpo: ferme nel mondo, il portiere in volo le lasciava indietro
    if (this.stick) {
      if (!this.local) this.local = o.worldToLocal(this.target.clone());
      o.localToWorld(this.target.copy(this.local));
    } else this.local = null;
    // i palmi ai lati della palla lungo la linea fra i palmi della clip: in
    // tuffo il busto e' girato e con la destra del busto una mano finiva
    // dietro l'altra, e un gomito si piegava al contrario
    const g = BALL.radius + this.gap;
    _R.subVectors(palm(r, 'Right', _pr), palm(r, 'Left', _pl));
    if (_R.lengthSq() > 0.0025) this.axis = (this.axis || new THREE.Vector3()).copy(_R).normalize();
    else if (!this.axis) { const h = o.rotation.y; this.axis = new THREE.Vector3(-Math.cos(h), 0, Math.sin(h)); }
    _v.copy(this.target).addScaledVector(this.axis, -g);
    _w.copy(this.target).addScaledVector(this.axis, g);
    const max = KEEPER.ik.arm * dt;
    solveArm(r.LeftArm, r.LeftForeArm, (out) => palm(r, 'Left', out), _v, this.cur, 'Left', this.memo.Left, max);
    solveArm(r.RightArm, r.RightForeArm, (out) => palm(r, 'Right', out), _w, this.cur, 'Right', this.memo.Right, max);
    return true;
  }
}
