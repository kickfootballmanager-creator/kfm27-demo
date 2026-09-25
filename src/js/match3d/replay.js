import * as THREE from 'three';
import { REPLAY, PITCH, GOAL } from './config.js';

// Replay dopo il gol (skill match3d, "Dopo il gol"). Il registratore tiene in
// un buffer circolare gli ultimi REPLAY.seconds di partita a REPLAY.hz: per
// ogni corpo posizione, rotazione, visibilita', posizione del bacino e pose di
// tutte le ossa (cosi' si rivedono clip, IK e fusioni esattamente come erano),
// e la palla. Il regista li rigioca con due inquadrature: laterale bassa che
// segue l'azione, poi dietro la porta al rallentatore sul tiro.

const HL = PITCH.length / 2;
const Q = 32767;             // quaternioni salvati in interi a 16 bit
const PER = 10;              // numeri per corpo: posizione, rotazione, visibile, bacino
const BALL_N = 8;            // palla: posizione, quaternione, visibile

const _qa = new THREE.Quaternion(), _qb = new THREE.Quaternion();

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

// Regia del replay: dal fotogramma del gol meno REPLAY.pre secondi, prima
// laterale bassa a velocita' normale, poi dietro la porta al rallentatore
// dagli ultimi REPLAY.slow secondi prima del gol fino a REPLAY.post dopo.
export class Replay {
  // `goalFrame`: fotogramma (indice del registratore) in cui la palla e'
  // entrata; `side`: +1 porta a x positive, -1 a x negative.
  constructor(rec, goalFrame, side) {
    const R = REPLAY, hz = R.hz;
    this.rec = rec;
    this.side = side;
    this.end = Math.min(rec.length - 1, goalFrame + R.post * hz);
    this.slowFrom = Math.max(0, goalFrame - R.slow * hz);
    this.f = Math.max(0, goalFrame - R.pre * hz);
    this.look = null;
    this.done = false;
    this.t = 0;
  }

  // Avanza di `dt` secondi reali; false quando e' finito.
  step(dt) {
    const slow = this.f >= this.slowFrom;
    this.f += dt * REPLAY.hz * (slow ? REPLAY.slowSpeed : 1);
    this.t += dt;
    if (this.f >= this.end || this.t > REPLAY.maxTime) this.done = true;
    return !this.done;
  }

  get slowMotion() { return this.f >= this.slowFrom; }

  // Pose del fotogramma corrente e inquadratura; `dt` secondi reali.
  apply(cam, dt) {
    const ball = this.rec.apply(this.f);
    const R = REPLAY;
    const want = this._w || (this._w = new THREE.Vector3());
    if (this.slowMotion) {
      // dietro la porta, un po' alta, spostata dalla parte della palla
      const C = R.goalCam;
      want.set(this.side * (HL + GOAL.depth + C.back), C.height, ball.z * C.follow);
    } else {
      // laterale bassa dal lato della tribuna, un po' dietro l'azione
      const C = R.sideCam;
      want.set(ball.x - this.side * C.lead, C.height, Math.max(ball.z + C.dist, PITCH.width / 2 + C.edge));
    }
    const cut = this.camMode !== this.slowMotion;
    this.camMode = this.slowMotion;
    if (!this.look || cut) { this.look = ball.clone(); this.pos = want.clone(); }
    this.look.lerp(ball, 1 - Math.exp(-R.lookRate * dt));
    this.pos.lerp(want, 1 - Math.exp(-R.camRate * dt));
    cam.position.copy(this.pos);
    cam.lookAt(this.look.x, Math.max(0.3, this.look.y * 0.6), this.look.z);
    // di lato si zooma: l'azione (C.frame m) riempie l'inquadratura a ogni distanza
    const S = R.sideCam, far = this.pos.distanceTo(this.look);
    const fov = this.slowMotion ? R.goalCam.fov : Math.max(S.fov[0], Math.min(S.fov[1], 2 * Math.atan(S.frame / 2 / far) * 180 / Math.PI));
    if (Math.abs(cam.fov - fov) > 1e-3) { cam.fov = fov; cam.updateProjectionMatrix(); }
  }
}
