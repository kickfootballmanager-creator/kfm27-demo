import * as THREE from 'three';
import { CAMERA } from './config.js';

// Visuale da tribuna, alta sul lato +Z: segue la palla con smorzamento
// esponenziale e anticipa un po' nella direzione del gioco.
export class BroadcastCamera {
  constructor(aspect) {
    this.cam = new THREE.PerspectiveCamera(CAMERA.fov, aspect, 0.5, 600);
    this.target = new THREE.Vector3();
    this.fov = CAMERA.fov;
    this.cam.position.set(0, CAMERA.height, CAMERA.sideDistance);
    this.cam.lookAt(this.target);
  }

  snap(ball) {
    this.target.set(ball.pos.x * CAMERA.followX, 0, CAMERA.aimZ + ball.pos.z * CAMERA.followZ);
    this._place();
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
    this._place();
  }

  _place() {
    const c = this.cam;
    // palla verso la tribuna: la telecamera arretra, cosi' la linea laterale vicina resta in quadro
    const back = Math.max(0, this.target.z - CAMERA.aimZ) * CAMERA.nearBack;
    c.position.set(this.target.x, CAMERA.height, CAMERA.sideDistance + back);
    c.lookAt(this.target);
    // Schermi stretti (telefono in verticale): si allarga il campo visivo.
    const f = c.aspect < 1.2 ? Math.min(CAMERA.maxFov, this.fov * 1.2 / Math.max(0.5, c.aspect)) : this.fov;
    if (Math.abs(c.fov - f) > 1e-3) { c.fov = f; c.updateProjectionMatrix(); }
  }

  resize(aspect) {
    this.cam.aspect = aspect;
    this.cam.updateProjectionMatrix();
    this._place();
  }
}
