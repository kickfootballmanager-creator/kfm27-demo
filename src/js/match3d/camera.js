import * as THREE from 'three';
import { CAMERA } from './config.js';

// Visuale da tribuna sul lato +Z, come nel riferimento: segue la palla da
// vicino senza anticipo, vicino alle aree si avvicina e si abbassa, al calcio
// d'inizio resta larga sul cerchio. Nei calci piazzati (setpieces.js) passa,
// con una transizione morbida, alla visuale dietro a chi calcia, e poi torna.
const smooth = (u) => u * u * (3 - 2 * u);
const RAD = Math.PI / 180;
// campo visivo verticale che da' `h` gradi in orizzontale su uno schermo `aspect`
const vfov = (h, aspect) => 2 * Math.atan(Math.tan(h * RAD / 2) / aspect) / RAD;

export class BroadcastCamera {
  // kickoff(): true mentre si aspetta il calcio d'inizio
  constructor(aspect, kickoff) {
    this.cam = new THREE.PerspectiveCamera(vfov(CAMERA.hfov, aspect), aspect, 0.5, 600);
    this.target = new THREE.Vector3();
    this.kickoff = kickoff || (() => false);
    this.ko = 0;          // peso della visuale del calcio d'inizio
    // calcio piazzato: posa voluta e quanto pesa (0 tribuna, 1 calcio piazzato)
    this.sp = { on: false, w: 0, pos: new THREE.Vector3(), look: new THREE.Vector3(), fov: this.cam.fov };
    this._pos = new THREE.Vector3();
    this._look = new THREE.Vector3();
    this._place();
  }

  snap(ball) {
    this.target.set(ball.pos.x * CAMERA.followX, 0, CAMERA.aimZ + ball.pos.z * CAMERA.followZ);
    this.ko = this.kickoff() ? 1 : 0;
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
    const tx = Math.max(-lim, Math.min(lim, ball.pos.x * CAMERA.followX));
    const tz = CAMERA.aimZ + ball.pos.z * CAMERA.followZ;
    this.target.x += (tx - this.target.x) * k;
    this.target.z += (tz - this.target.z) * k;
    this.ko = this.kickoff() ? 1 : Math.max(0, this.ko - dt / CAMERA.kickoff.blend);
    const s = this.sp;
    s.w = Math.max(0, Math.min(1, s.w + (s.on ? 1 : -1) * dt / CAMERA.setPieceBlend));
    this._place();
  }

  _place() {
    const c = this.cam, C = CAMERA, A = C.area, K = C.kickoff;
    // palla in larghezza (dalla mira gia' filtrata) e vicinanza a un'area, 0..1
    const bz = (this.target.z - C.aimZ) / C.followZ;
    const near = smooth(Math.max(0, Math.min(1, (Math.abs(this.target.x) - A.from) / (A.to - A.from))));
    let dist = C.distance - C.distanceZ * bz - A.closer * near;
    let tilt = C.tilt - A.tilt * near;
    let hfov = C.hfov;
    const ko = smooth(this.ko);
    if (ko > 0) {
      dist += (K.distance - dist) * ko;
      tilt += (K.tilt - tilt) * ko;
      hfov += (K.hfov - hfov) * ko;
    }
    this._look.copy(this.target);
    this._pos.set(this.target.x, dist * Math.sin(tilt * RAD), this.target.z + dist * Math.cos(tilt * RAD));
    let fov = vfov(hfov, c.aspect);
    const w = smooth(this.sp.w);
    if (w > 0) {
      this._pos.lerp(this.sp.pos, w);
      this._look.lerp(this.sp.look, w);
      // la posa del calcio piazzato da' il campo verticale: sugli schermi stretti si allarga
      const spf = c.aspect < 1.2 ? this.sp.fov * 1.2 / Math.max(0.5, c.aspect) : this.sp.fov;
      fov += (spf - fov) * w;
    }
    c.position.copy(this._pos);
    c.lookAt(this._look);
    const f = Math.min(C.maxFov, fov);
    if (Math.abs(c.fov - f) > 1e-3) { c.fov = f; c.updateProjectionMatrix(); }
  }

  resize(aspect) {
    this.cam.aspect = aspect;
    this.cam.updateProjectionMatrix();
    this._place();
  }
}
