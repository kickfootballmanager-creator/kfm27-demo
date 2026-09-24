import * as THREE from 'three';

// Scheletro di player.glb: ossa per nome, IK a due ossa, rotazioni nel
// riferimento del mondo. Lavora sulle rotazioni locali gia' scritte dal
// mixer: il mixer le riscrive a ogni aggiornamento, quindi nulla si accumula.

// 'mixamorig5LeftHand' (il GLTFLoader toglie i due punti) -> 'LeftHand'.
export function boneMap(object) {
  const out = {};
  object.traverse((o) => { if (o.isBone) out[o.name.replace(/^mixamorig\d*:?/, '')] = o; });
  return out;
}

const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3();
const _t = new THREE.Vector3(), _d = new THREE.Vector3(), _p = new THREE.Vector3();
const _k = new THREE.Vector3(), _f = new THREE.Vector3(), _g = new THREE.Vector3();
const _q = new THREE.Quaternion(), _pw = new THREE.Quaternion(), _pi = new THREE.Quaternion();
const _id = new THREE.Quaternion();

// Ruota l'osso nel riferimento del mondo: la sua rotazione nel mondo diventa
// q * (quella di prima). Poi aggiorna le matrici dell'osso e dei figli.
export function rotateWorld(bone, q) {
  bone.parent.getWorldQuaternion(_pw);
  _pi.copy(_pw).invert();
  bone.quaternion.premultiply(_pw).premultiply(q).premultiply(_pi);
  bone.updateMatrixWorld(true);
}

// Ruota l'osso perche' la direzione `from` (nel mondo) diventi `to`, a `weight`.
export function aimWorld(bone, from, to, weight = 1) {
  _q.setFromUnitVectors(from, to);
  if (weight < 1) _q.slerp(_id, 1 - weight);
  rotateWorld(bone, _q);
}

// IK a due ossa: porta il punto `end` (funzione che scrive la sua posizione
// nel mondo, rigido rispetto a B: polso, palmo, collo del piede) su `target`.
// A: spalla o anca, B: gomito o ginocchio. Il gomito resta dalla parte di
// `pole` (se manca, dalla parte in cui lo mette l'animazione).
export function solveTwoBone(A, B, end, target, weight = 1, pole = null) {
  if (weight <= 0) return;
  const a = A.getWorldPosition(_a), b = B.getWorldPosition(_b), c = end(_c);
  const l1 = a.distanceTo(b), l2 = b.distanceTo(c);
  _t.copy(c).lerp(target, weight);
  const dir = _d.subVectors(_t, a);
  const d = Math.min(l1 + l2 - 1e-3, Math.max(Math.abs(l1 - l2) + 1e-3, dir.length()));
  dir.normalize();
  // piano del gomito: dalla parte del polo, o da quella attuale
  const pv = _p.subVectors(pole || b, a);
  pv.addScaledVector(dir, -pv.dot(dir));
  if (pv.lengthSq() < 1e-8) pv.set(0, -1, 0).addScaledVector(dir, dir.y);
  pv.normalize();
  const cosA = Math.min(1, Math.max(-1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d)));
  const knee = _k.copy(a).addScaledVector(dir, l1 * cosA).addScaledVector(pv, l1 * Math.sqrt(1 - cosA * cosA));
  aimWorld(A, _f.subVectors(b, a).normalize(), _g.subVectors(knee, a).normalize());
  const b2 = B.getWorldPosition(_b), c2 = end(_c);
  aimWorld(B, _f.subVectors(c2, b2).normalize(), _g.subVectors(_t, b2).normalize());
}

// Centro del palmo: fra il polso e le nocche del dito medio.
export function palm(bones, side, out) {
  const h = bones[side + 'Hand'], k = bones[side + 'HandMiddle1'];
  h.getWorldPosition(out);
  if (!k) return out;
  return out.lerp(k.getWorldPosition(_f), 0.6);
}
