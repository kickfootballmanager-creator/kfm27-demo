import * as THREE from 'three';
import { CAMERA } from './config.js';

// Visuale da tribuna, alta sul lato +Z: segue la palla con smorzamento
// esponenziale e anticipa un po' nella direzione del gioco. Nei calci
// piazzati (setpieces.js) passa, con una transizione morbida, alla visuale
// dietro a chi calcia, e poi torna.
const smooth = (u) => u * u * (3 - 2 * u);

export class BroadcastCamera {
  constructor(aspect) {
    this.cam = new THREE.PerspectiveCamera(CAMERA.fov, aspect, 0.5, 600);
    this.target = new THREE.Vector3();
    this.fov = CAMERA.fov;
    this.cam.position.set(0, CAMERA.height, CAMERA.sideDistance);
    this.cam.lookAt(this.target);
    // calcio piazzato: posa voluta e quanto pesa (0 tribuna, 1 calcio piazzato)
    this.sp = { on: false, w: 0, pos: new THREE.Vector3(), look: new THREE.Vector3(), fov: CAMERA.fov };
    this._pos = new THREE.Vector3();
    this._look = new THREE.Vector3();
  }

  snap(ball) {
    this.target.set(ball.pos.x * CAMERA.followX, 0, CAMERA.aimZ + ball.pos.z * CAMERA.followZ);
    this._place();
  }

  // Posa del calcio piazzato ({ pos, look, fov }) o null per tornare alla partita.
  setPiece(pose) {
    const s = this.sp;
    s.on = !!pose;
    if (!pose) return;
    // la prima volta si parte dalla posa voluta; poi la si insegue senza scatti
    if (s.w <= 0) { s.pos.copy(pose.pos); s.look.copy(pose.look); s.fov = pose.fov; return; }
    s.pos.lerp(pose.pos, 0.2);
    s.look.lerp(pose.look, 0.2);
    s.fov += (pose.fov - s.fov) * 0.2;
  }

  update(ball, dt) {
    const k = 1 - Math.exp(-CAMERA.rate * dt);
    const lim = CAMERA.limitX;
    const tx = Math.max(-lim, Math.min(lim, (ball.pos.x + ball.vel.x * CAMERA.lead) * CAMERA.followX));
    const tz = CAMERA.aimZ + (ball.pos.z + ball.vel.z * CAMERA.lead) * CAMERA.followZ;
    this.target.x += (tx - this.target.x) * k;
    this.target.z += (tz - this.target.z) * k;

    const near = Math.abs(ball.pos.x) > CAMERA.areaX;
    const fovGoal = near ? CAMERA.fovArea : CAMERA.fov;
    this.fov += (fovGoal - this.fov) * (1 - Math.exp(-CAMERA.fovRate * dt));
    const s = this.sp;
    s.w = Math.max(0, Math.min(1, s.w + (s.on ? 1 : -1) * dt / CAMERA.setPieceBlend));
    this._place();
  }

  _place() {
    const c = this.cam;
    // palla verso la tribuna: la telecamera arretra, cosi' la linea laterale vicina resta in quadro
    const back = Math.max(0, this.target.z - CAMERA.aimZ) * CAMERA.nearBack;
    this._pos.set(this.target.x, CAMERA.height, CAMERA.sideDistance + back);
    this._look.copy(this.target);
    let fov = this.fov;
    const w = smooth(this.sp.w);
    if (w > 0) {
      this._pos.lerp(this.sp.pos, w);
      this._look.lerp(this.sp.look, w);
      fov += (this.sp.fov - fov) * w;
    }
    c.position.copy(this._pos);
    c.lookAt(this._look);
    // Schermi stretti (telefono in verticale): si allarga il campo visivo.
    const f = c.aspect < 1.2 ? Math.min(CAMERA.maxFov, fov * 1.2 / Math.max(0.5, c.aspect)) : fov;
    if (Math.abs(c.fov - f) > 1e-3) { c.fov = f; c.updateProjectionMatrix(); }
  }

  resize(aspect) {
    this.cam.aspect = aspect;
    this.cam.updateProjectionMatrix();
    this._place();
  }
}
