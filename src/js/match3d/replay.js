import * as THREE from 'three';
import { REPLAY, PITCH, GOAL } from './config.js';

// Replay dopo il gol (skill match3d, "Dopo il gol"). Il registratore tiene in
// un buffer circolare gli ultimi REPLAY.seconds di partita a REPLAY.hz: per
// ogni corpo posizione, rotazione, visibilita', posizione del bacino e pose di
// tutte le ossa (cosi' si rivedono clip, IK e fusioni esattamente come erano),
// e la palla. Il regista (Replay) li rigioca con le inquadrature di
// REPLAY.shots; CloseCam riprende da vicino chi esulta prima del replay.

const HL = PITCH.length / 2, HW = PITCH.width / 2;
const Q = 32767;             // quaternioni salvati in interi a 16 bit
const PER = 10;              // numeri per corpo: posizione, rotazione, visibile, bacino
const BALL_N = 8;            // palla: posizione, quaternione, visibile

const _qa = new THREE.Quaternion(), _qb = new THREE.Quaternion();
const _goal = new THREE.Vector3(), _hp = new THREE.Vector3(), _ll = new THREE.Vector3(), _rl = new THREE.Vector3();
const _want = new THREE.Vector3(), _aim = new THREE.Vector3();
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

export class Recorder {
  // `bodies`: tutti i Player in scena (anche l'arbitro e chi verra' espulso).
  constructor(bodies, ball) {
    this.bodies = bodies;
    this.ball = ball;
    this.bones = bodies.map((p) => {
      const list = [];
      p.avatar.object.traverse((o) => { if (o.isBone) list.push(o); });
      return list;
    });
    this.hips = bodies.map((p) => p.avatar.rig.Hips);
    this.nb = this.bones[0].length;
    this.size = Math.round(REPLAY.seconds * REPLAY.hz);
    this.quats = new Int16Array(this.size * bodies.length * this.nb * 4);
    this.nums = new Float32Array(this.size * (bodies.length * PER + BALL_N));
    this.clear();
  }

  // Dopo un riposizionamento (calcio d'inizio) il passato non si rigioca.
  clear() { this.count = 0; this.head = 0; this.acc = 0; }

  // Da chiamare dopo che corpi e palla sono stati disegnati (pose finali).
  tick(dt) {
    this.acc += dt;
    if (this.acc < 1 / REPLAY.hz) return;
    this.acc %= 1 / REPLAY.hz;
    this.write(this.head);
    this.head = (this.head + 1) % this.size;
    this.count++;
  }

  write(slot) {
    const n = this.bodies.length, nb = this.nb;
    let qi = slot * n * nb * 4, ni = slot * (n * PER + BALL_N);
    const q = this.quats, f = this.nums;
    for (let i = 0; i < n; i++) {
      const o = this.bodies[i].avatar.object, h = this.hips[i].position;
      f[ni++] = o.position.x; f[ni++] = o.position.y; f[ni++] = o.position.z;
      f[ni++] = o.rotation.x; f[ni++] = o.rotation.y; f[ni++] = o.rotation.z;
      f[ni++] = o.visible ? 1 : 0;
      f[ni++] = h.x; f[ni++] = h.y; f[ni++] = h.z;
      for (const b of this.bones[i]) {
        const r = b.quaternion;
        q[qi++] = r.x * Q; q[qi++] = r.y * Q; q[qi++] = r.z * Q; q[qi++] = r.w * Q;
      }
    }
    const m = this.ball.mesh;
    f[ni++] = m.position.x; f[ni++] = m.position.y; f[ni++] = m.position.z;
    f[ni++] = m.quaternion.x; f[ni++] = m.quaternion.y; f[ni++] = m.quaternion.z; f[ni++] = m.quaternion.w;
    f[ni++] = m.visible ? 1 : 0;
  }

  // Fotogrammi disponibili, dal piu' vecchio (0) al piu' recente.
  get length() { return Math.min(this.count, this.size); }

  slot(k) { return (this.head - this.length + k + this.size) % this.size; }

  // Pose al fotogramma `f` (anche frazionario, 0 = il piu' vecchio) su corpi e palla.
  apply(f) {
    const len = this.length;
    f = Math.max(0, Math.min(len - 1, f));
    const k = Math.floor(f), a = f - k, k2 = Math.min(len - 1, k + 1);
    const s0 = this.slot(k), s1 = this.slot(k2);
    const n = this.bodies.length, nb = this.nb, q = this.quats, v = this.nums;
    const lerp = (x, y) => x + (y - x) * a;
    const ang = (x, y) => x + Math.atan2(Math.sin(y - x), Math.cos(y - x)) * a;
    for (let i = 0; i < n; i++) {
      const p = this.bodies[i], o = p.avatar.object;
      const b0 = s0 * (n * PER + BALL_N) + i * PER, b1 = s1 * (n * PER + BALL_N) + i * PER;
      o.position.set(lerp(v[b0], v[b1]), lerp(v[b0 + 1], v[b1 + 1]), lerp(v[b0 + 2], v[b1 + 2]));
      o.rotation.set(ang(v[b0 + 3], v[b1 + 3]), ang(v[b0 + 4], v[b1 + 4]), ang(v[b0 + 5], v[b1 + 5]));
      o.visible = v[b0 + 6] > 0.5;
      this.hips[i].position.set(lerp(v[b0 + 7], v[b1 + 7]), lerp(v[b0 + 8], v[b1 + 8]), lerp(v[b0 + 9], v[b1 + 9]));
      p.shadow.position.set(o.position.x, 0.011, o.position.z);
      p.shadow.visible = o.visible;
      let q0 = (s0 * n + i) * nb * 4, q1 = (s1 * n + i) * nb * 4;
      for (const bone of this.bones[i]) {
        _qa.set(q[q0] / Q, q[q0 + 1] / Q, q[q0 + 2] / Q, q[q0 + 3] / Q);
        _qb.set(q[q1] / Q, q[q1 + 1] / Q, q[q1 + 2] / Q, q[q1 + 3] / Q);
        bone.quaternion.copy(_qa.slerp(_qb, a).normalize());
        q0 += 4; q1 += 4;
      }
    }
    const c0 = s0 * (n * PER + BALL_N) + n * PER, c1 = s1 * (n * PER + BALL_N) + n * PER, m = this.ball.mesh;
    m.position.set(lerp(v[c0], v[c1]), lerp(v[c0 + 1], v[c1 + 1]), lerp(v[c0 + 2], v[c1 + 2]));
    _qa.set(v[c0 + 3], v[c0 + 4], v[c0 + 5], v[c0 + 6]);
    _qb.set(v[c1 + 3], v[c1 + 4], v[c1 + 5], v[c1 + 6]);
    m.quaternion.copy(_qa.slerp(_qb, a));
    m.visible = v[c0 + 7] > 0.5;
    this.ball.shadow.position.set(m.position.x, 0.012, m.position.z);
    return m.position;
  }
}

// Regia del replay: le inquadrature di REPLAY.shots una dopo l'altra, ognuna
// sul suo tratto di registrazione (secondi rispetto al gol) alla sua
// velocita'. Prima di un'inquadratura con dissolvenza `snap` chiede a main di
// fotografare l'ultimo fotogramma della precedente.
export class Replay {
  // `goalFrame`: fotogramma (indice del registratore) in cui la palla e'
  // entrata; `side`: +1 porta a x positive, -1 a x negative.
  constructor(rec, goalFrame, side) {
    const R = REPLAY, hz = R.hz, last = rec.length - 1;
    this.rec = rec;
    this.side = side;
    this.shots = [];
    for (const s of R.shots) {
      const f0 = Math.max(0, goalFrame + s.from * hz), f1 = Math.min(last, goalFrame + s.to * hz);
      if ((f1 - f0) / hz >= R.minShot) this.shots.push({ ...s, f0, f1 });
    }
    this.k = 0;
    this.f = this.shots.length ? this.shots[0].f0 : 0;
    this.done = !this.shots.length;
    this.next = false;
    this.snap = 0;
    this.look = null;
  }

  get shot() { return this.shots[this.k]; }

  // Avanza di `dt` secondi reali; false quando e' finito. A fine
  // inquadratura resta un fotogramma sull'ultima posa, quello della foto.
  step(dt) {
    if (this.done) return false;
    if (this.next) { this.next = false; this.k++; this.f = this.shot.f0; this.look = null; return true; }
    const s = this.shot;
    this.f += dt * REPLAY.hz * s.speed;
    if (this.f < s.f1) return true;
    this.f = s.f1;
    if (this.k + 1 >= this.shots.length) { this.done = true; return false; }
    this.next = true;
    this.snap = this.shots[this.k + 1].dissolve || 0;
    return true;
  }

  get slowMotion() { return !this.done && this.shot.speed < 1; }

  // Pose del fotogramma corrente e inquadratura; `dt` secondi reali.
  apply(cam, dt) {
    const ball = this.rec.apply(this.f);
    if (!this.shots.length) return;
    const R = REPLAY, s = this.shot, side = this.side;
    const want = this._w || (this._w = new THREE.Vector3());
    const aim = this._a || (this._a = new THREE.Vector3());
    aim.copy(ball);
    let fov = null;
    if (s.cam === 'high') {
      const C = R.highCam;
      want.set(ball.x * C.follow, C.height, HW + C.back);
      fov = C.fov;
    } else if (s.cam === 'side') {
      const C = R.sideCam;
      want.set(ball.x - side * C.lead, C.height, Math.max(ball.z + C.dist, HW + C.edge));
    } else if (s.cam === 'reverse') {
      // dall'altro lato del campo, alta, da dietro chi attacca verso la porta
      const C = R.reverseCam;
      want.set(side * (HL - C.back), C.height, C.side);
      aim.lerp(_goal.set(side * HL, 0, 0), C.goalPull);
      fov = C.fov;
    } else {
      // dietro la porta, alta, spostata dalla parte della palla
      const C = R.goalCam;
      want.set(side * (HL + GOAL.depth + C.back), C.height, ball.z * C.follow);
      fov = C.fov;
    }
    if (!this.look) { this.look = aim.clone(); this.pos = want.clone(); }
    this.look.lerp(aim, 1 - Math.exp(-R.lookRate * dt));
    this.pos.lerp(want, 1 - Math.exp(-R.camRate * dt));
    cam.position.copy(this.pos);
    cam.lookAt(this.look.x, Math.max(0.3, this.look.y * 0.6), this.look.z);
    // di lato si zooma: l'azione (C.frame m) riempie l'inquadratura a ogni distanza
    if (fov === null) {
      const S = R.sideCam, far = this.pos.distanceTo(this.look);
      fov = Math.max(S.fov[0], Math.min(S.fov[1], 2 * Math.atan(S.frame / 2 / far) * 180 / Math.PI));
    }
    if (Math.abs(cam.fov - fov) > 1e-3) { cam.fov = fov; cam.updateProjectionMatrix(); }
  }
}

// Primo piano di chi esulta: telecamera bassa davanti al suo bacino, a `dist`
// m, che lo segue e gli gira attorno piano (al massimo `turn` rad/s), dentro
// i cartelloni. Fra le direzioni attorno a dove guarda sceglie quella con
// meno corpi (`others`) fra la telecamera e lui.
const AROUND = [0, 0.5, -0.5, 1, -1, 1.5, -1.5, 2.1, -2.1, Math.PI];

export class CloseCam {
  constructor(p, others) {
    this.p = p;
    this.others = others;
    this.az = null;
    this.pos = new THREE.Vector3();
    this.look = new THREE.Vector3();
  }

  apply(cam, dt) {
    const C = REPLAY.closeCam, rig = this.p.avatar.rig;
    rig.Hips.getWorldPosition(_hp);
    // davanti: perpendicolare alla linea delle anche (da destra a sinistra)
    rig.LeftUpLeg.getWorldPosition(_ll);
    rig.RightUpLeg.getWorldPosition(_rl);
    const face = Math.atan2(-(_ll.z - _rl.z), _ll.x - _rl.x);
    const first = this.az === null;
    const goal = this.clearest(face, first ? face : this.az);
    if (first) this.az = goal;
    else this.az += Math.max(-C.turn * dt, Math.min(C.turn * dt, wrap(goal - this.az)));
    const lx = HL + C.inside, lz = HW + C.inside;
    _want.set(Math.max(-lx, Math.min(lx, _hp.x + Math.sin(this.az) * C.dist)), C.height, Math.max(-lz, Math.min(lz, _hp.z + Math.cos(this.az) * C.dist)));
    _aim.set(_hp.x, C.look, _hp.z);
    if (first) { this.pos.copy(_want); this.look.copy(_aim); }
    this.pos.lerp(_want, 1 - Math.exp(-C.rate * dt));
    this.look.lerp(_aim, 1 - Math.exp(-REPLAY.lookRate * dt));
    cam.position.copy(this.pos);
    cam.lookAt(this.look);
    if (Math.abs(cam.fov - C.fov) > 1e-3) { cam.fov = C.fov; cam.updateProjectionMatrix(); }
  }

  // Direzione della telecamera attorno a _hp: poco lontana da dove guarda chi
  // esulta e da dove sta gia', senza corpi in mezzo o accanto all'obiettivo,
  // dentro i cartelloni.
  clearest(face, now) {
    const C = REPLAY.closeCam, lx = HL + C.inside, lz = HW + C.inside;
    let best = face, bc = Infinity;
    for (const o of AROUND) {
      const a = face + o, sx = Math.sin(a), sz = Math.cos(a);
      const cx = _hp.x + sx * C.dist, cz = _hp.z + sz * C.dist;
      let cost = Math.abs(o) * 0.3 + Math.abs(wrap(a - now)) * 0.2;
      cost += 2 * (Math.max(0, Math.abs(cx) - lx) + Math.max(0, Math.abs(cz) - lz));
      for (const q of this.others) {
        if (q === this.p || !q.avatar.object.visible) continue;
        const qx = q.pos.x - _hp.x, qz = q.pos.z - _hp.z;
        const u = (qx * sx + qz * sz) / C.dist;
        if (u > 0.1 && u < 1.15 && Math.abs(qx * sz - qz * sx) < 0.7) cost += 1.5;
        // accanto all'obiettivo copre mezza inquadratura anche fuori dalla linea
        else if (Math.hypot(q.pos.x - cx, q.pos.z - cz) < 1.8) cost += 1;
      }
      if (cost < bc) { bc = cost; best = a; }
    }
    return best;
  }
}
