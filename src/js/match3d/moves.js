import * as THREE from 'three';
import { BALL } from './config.js';
import { solveTwoBone, rotateWorld, palm } from './rig.js';

// Animazioni create in codice, per le azioni senza una clip adatta. Girano
// dopo il mixer (Avatar.update): curve sulle ossa di gambe e busto sopra la
// corsa, poi IK. Le curve stanno in config.MOVES.

// Curva [[t, v], ...] con raccordi morbidi fra i punti.
export function curve(keys, t) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const [t0, v0] = keys[i - 1], [t1, v1] = keys[i];
      const u = (t - t0) / (t1 - t0);
      return v0 + (v1 - v0) * u * u * (3 - 2 * u);
    }
  }
  return keys[keys.length - 1][1];
}

const UP = new THREE.Vector3(0, 1, 0);
const _F = new THREE.Vector3(), _R = new THREE.Vector3();
const _v = new THREE.Vector3(), _w = new THREE.Vector3(), _hip = new THREE.Vector3();
const _pole = new THREE.Vector3(), _tgt = new THREE.Vector3();
const _q = new THREE.Quaternion();

// Contrasto in piedi. `side`: 'Right' o 'Left', la gamba che entra.
// `target`: centro della palla nel mondo, aggiornato dal gioco a ogni passo.
export class StandTackle {
  constructor(def, side, target) {
    this.def = def;
    this.side = side;
    this.other = side === 'Right' ? 'Left' : 'Right';
    this.sgn = side === 'Right' ? 1 : -1;
    this.target = target.clone();
    this.t = 0;
    this.planted = null;
  }

  // false quando e' finito.
  update(av, dt) {
    this.t += dt;
    const D = this.def, t = this.t;
    if (t >= D.duration) return false;
    const r = av.rig, o = av.object, S = this.side, O = this.other, sgn = this.sgn;
    o.updateMatrixWorld(true);
    const h = o.rotation.y;
    _F.set(Math.sin(h), 0, Math.cos(h));
    _R.set(-Math.cos(h), 0, Math.sin(h));

    // il piede d'appoggio si pianta dov'e' al primo istante
    const plant = curve(D.plant, t);
    if (!this.planted && plant > 0) this.planted = r[O + 'Foot'].getWorldPosition(new THREE.Vector3());

    // bacino piu' basso: le gambe si piegano, il busto resta sopra
    const drop = curve(D.drop, t);
    if (drop > 0) {
      r.Hips.getWorldPosition(_v);
      _v.y -= drop;
      r.Hips.parent.worldToLocal(_v);
      r.Hips.position.copy(_v);
      r.Hips.updateMatrixWorld(true);
    }
    // busto all'indietro e lontano dalla gamba che entra
    rotateWorld(r.Spine, _q.setFromAxisAngle(_R, curve(D.lean, t)));
    rotateWorld(r.Spine1, _q.setFromAxisAngle(_F, -sgn * curve(D.side, t)));

    // piede d'appoggio fermo: il ginocchio si piega in avanti
    if (this.planted) {
      r[O + 'Leg'].getWorldPosition(_pole).addScaledVector(_F, 0.6);
      solveTwoBone(r[O + 'UpLeg'], r[O + 'Leg'], (out) => r[O + 'Foot'].getWorldPosition(out), this.planted, plant, _pole);
    }

    // gamba che entra: la caviglia sul lato della palla rivolto verso di noi
    const reach = curve(D.reach, t);
    if (reach > 0) {
      r[S + 'UpLeg'].getWorldPosition(_hip);
      _w.subVectors(_hip, this.target).setY(0);
      if (_w.lengthSq() < 1e-6) _w.copy(_F).negate();
      _w.normalize();
      _tgt.copy(this.target).addScaledVector(_w, BALL.radius + D.footGap).setY(D.ankle);
      r[S + 'Leg'].getWorldPosition(_pole).addScaledVector(_F, 0.5).addScaledVector(_R, sgn * 0.3);
      solveTwoBone(r[S + 'UpLeg'], r[S + 'Leg'], (out) => r[S + 'Foot'].getWorldPosition(out), _tgt, reach, _pole);
    }
    // interno del piede verso la palla: punta ruotata verso l'esterno
    rotateWorld(r[S + 'Foot'], _q.setFromAxisAngle(UP, -sgn * curve(D.foot, t)));
    // braccia aperte per l'equilibrio
    const arms = curve(D.arms, t);
    rotateWorld(r.LeftArm, _q.setFromAxisAngle(_F, arms));
    rotateWorld(r.RightArm, _q.setFromAxisAngle(_F, -arms));
    return true;
  }
}

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
