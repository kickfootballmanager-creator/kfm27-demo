import * as THREE from 'three';
import { BALL } from './config.js';
import { solveTwoBone, rotateWorld } from './rig.js';

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
