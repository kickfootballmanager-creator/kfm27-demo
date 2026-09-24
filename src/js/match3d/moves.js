import * as THREE from 'three';
import { BALL } from './config.js';
import { solveTwoBone, palm } from './rig.js';

// Ritocchi in codice sopra le clip, dopo il mixer (Avatar.update): solo IK
// delle braccia (arbitro, mani del portiere sulla palla). Nessun movimento
// a tutto corpo creato qui: quelli vengono dalle clip.

const _R = new THREE.Vector3();
const _v = new THREE.Vector3(), _w = new THREE.Vector3(), _hip = new THREE.Vector3();
const _pole = new THREE.Vector3(), _tgt = new THREE.Vector3();

// Gesti dell'arbitro, creati in codice (non ci sono clip): IK sulle braccia
// verso una direzione nel mondo. kind: 'point' (punizione, rimessa, braccio
// verso la direzione), 'up' (punizione indiretta, fuorigioco, cartellino),
// 'advantage' (vantaggio: tutte e due le braccia in avanti), 'spot' (rigore:
// verso il dischetto). `dir`: vettore orizzontale nel mondo.
export class RefSignal {
  constructor(def, kind, dir) {
    this.def = def;
    this.kind = kind;
    this.dir = new THREE.Vector3(dir.x, 0, dir.z).normalize();
    this.t = 0;
  }

  update(av, dt) {
    const S = this.def.signal;
    this.t += dt;
    const t = this.t, total = S.rise + S.hold + S.fall;
    if (t >= total) return false;
    const w = t < S.rise ? t / S.rise : t < S.rise + S.hold ? 1 : 1 - (t - S.rise - S.hold) / S.fall;
    const r = av.rig, o = av.object;
    o.updateMatrixWorld(true);
    const d = this.dir, L = this.def.armLen;
    const arm = (side, x, y, z) => {
      r[side + 'Arm'].getWorldPosition(_hip);
      _tgt.set(x, y, z).normalize().multiplyScalar(L).add(_hip);
      r[side + 'ForeArm'].getWorldPosition(_pole).y -= 0.3;
      solveTwoBone(r[side + 'Arm'], r[side + 'ForeArm'], (out) => palm(r, side, out), _tgt, smooth01(w), _pole);
    };
    if (this.kind === 'up') arm('Right', d.x * 0.1, 1, d.z * 0.1);
    else if (this.kind === 'spot') arm('Right', d.x, -0.55, d.z);
    else if (this.kind === 'advantage') { arm('Right', d.x, -0.15, d.z); arm('Left', d.x, -0.15, d.z); }
    else arm('Right', d.x, 0.25, d.z);
    return true;
  }
}

const smooth01 = (u) => { const c = Math.max(0, Math.min(1, u)); return c * c * (3 - 2 * c); };

// Portiere in parata: IK sulle braccia che porta i due palmi ai lati della
// palla. Il gioco aggiorna target (centro palla) e weight a ogni passo.
export class KeeperReach {
  constructor(gap) {
    this.gap = gap;
    this.target = new THREE.Vector3();
    this.weight = 0;
    this.done = false;
    this.ttl = 0.25;       // il gesto lo rinnova a ogni passo: se il gesto sparisce, l'IK si spegne
  }

  update(av, dt) {
    if (this.done || (this.ttl -= dt) <= 0) return false;
    if (this.weight <= 1e-3) return true;
    const r = av.rig, o = av.object;
    o.updateMatrixWorld(true);
    const h = o.rotation.y, g = BALL.radius + this.gap;
    _R.set(-Math.cos(h), 0, Math.sin(h));
    _v.copy(this.target).addScaledVector(_R, -g);
    _w.copy(this.target).addScaledVector(_R, g);
    solveTwoBone(r.LeftArm, r.LeftForeArm, (out) => palm(r, 'Left', out), _v, this.weight);
    solveTwoBone(r.RightArm, r.RightForeArm, (out) => palm(r, 'Right', out), _w, this.weight);
    return true;
  }
}
