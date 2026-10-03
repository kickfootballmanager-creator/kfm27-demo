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
// Sotto peso 1 l'IK si calcola pieno e poi le rotazioni di A e B si fondono
// con quelle della clip: sfumando il bersaglio in linea retta la mano (o il
// piede) passava dove il gomito non e' definito e il gomito si ribaltava.
export function solveTwoBone(A, B, end, target, weight = 1, pole = null) {
  if (weight <= 0) return;
  if (weight < 1) {
    _qa.copy(A.quaternion);
    _qb.copy(B.quaternion);
    solveFull(A, B, end, target, pole);
    A.quaternion.copy(_qa.slerp(A.quaternion, weight));
    B.quaternion.copy(_qb.slerp(B.quaternion, weight));
    A.updateMatrixWorld(true);
    return;
  }
  solveFull(A, B, end, target, pole);
}

const _qa = new THREE.Quaternion(), _qb = new THREE.Quaternion();

// Come solveTwoBone, ma l'IK riparte dalla soluzione del fotogramma prima
// (memo: {} la prima volta, poi { a, b } rotazioni locali di A e B), non dalla
// posa della clip. La rotazione minima dalla direzione della clip lascia al
// braccio la torsione della clip: in corsa il braccio oscilla di +-60 gradi e
// il braccio dell'arbitro girava su se stesso di 0,6-1 rad in un fotogramma.
// Il bersaglio si muove con continuita', quindi anche la soluzione; la clip
// entra solo nella fusione a `weight`. Anche la fusione e' continua: i segni
// dei quaternioni (clip e IK) seguono quelli del fotogramma prima e la fusione
// non sceglie la via piu' breve. Con la clip quasi opposta all'IK (braccio
// indietro nello scatto, braccio alzato dal gesto) la via piu' breve cambiava
// lato da un fotogramma all'altro: 1-1,3 rad di scatto.
// maxStep (rad, per questa chiamata): quanto puo' ruotare la soluzione rispetto
// a quella di prima. Un bersaglio fermo nel mondo visto da un corpo che gli
// passa accanto (portiere in tuffo) girava il braccio fino a 1,7 rad in un
// fotogramma: la soluzione lo insegue a velocita' da braccio vero.
export function solveTwoBoneKeep(A, B, end, target, weight, pole, memo, maxStep = Infinity) {
  if (weight <= 0) return;
  _qa.copy(A.quaternion);
  _qb.copy(B.quaternion);
  if (memo.ca) { align(_qa, memo.ca); align(_qb, memo.cb); }
  if (memo.a) {
    A.quaternion.copy(memo.a);
    B.quaternion.copy(memo.b);
    A.updateMatrixWorld(true);
  }
  solveFull(A, B, end, target, pole);
  // l'IK segue il suo segno di prima; al primo fotogramma quello della clip
  align(A.quaternion, memo.a || _qa);
  align(B.quaternion, memo.b || _qb);
  if (memo.a && (limitStep(A.quaternion, memo.a, maxStep) | limitStep(B.quaternion, memo.b, maxStep))) A.updateMatrixWorld(true);
  (memo.a || (memo.a = new THREE.Quaternion())).copy(A.quaternion);
  (memo.b || (memo.b = new THREE.Quaternion())).copy(B.quaternion);
  (memo.ca || (memo.ca = new THREE.Quaternion())).copy(_qa);
  (memo.cb || (memo.cb = new THREE.Quaternion())).copy(_qb);
  if (weight < 1) {
    A.quaternion.copy(slerpKeep(_qa, A.quaternion, weight));
    B.quaternion.copy(slerpKeep(_qb, B.quaternion, weight));
    A.updateMatrixWorld(true);
  }
}

// IK anatomica del braccio `side` (portiere, palla fra le mani): porta il
// punto `end` (il palmo) su `target` con il gomito che piega solo sulla sua
// cerniera (Z locale del braccio, come in tutte le clip) e con la torsione
// dell'avambraccio rispetto al braccio e il polso della clip. Il piano del
// gomito e' quello della clip: la sua cerniera resa perpendicolare alla
// direzione del bersaglio. Gomito mai oltre `maxFlex` gradi ne' teso del
// tutto. Con solveTwoBoneKeep il gomito veniva dalla soluzione di prima e
// in parata arrivava a piegare al contrario (90-180 gradi fuori cerniera),
// con l'avambraccio girato fino a mezzo giro e poi riportato indietro di
// 0,8 rad in un fotogramma. Fusione con la clip a `weight` e passo massimo
// `maxStep` rispetto alla soluzione di prima (memo), come solveTwoBoneKeep.
const _n0 = new THREE.Vector3(), _n1 = new THREE.Vector3(), _u0 = new THREE.Vector3(), _u1 = new THREE.Vector3();
const _el2 = new THREE.Vector3(), _go = new THREE.Vector3(), _f0 = new THREE.Vector3(), _f1 = new THREE.Vector3();
const _nr = new THREE.Vector3(), _cx = new THREE.Vector3(), _qr = new THREE.Quaternion(), _qt = new THREE.Quaternion();
export function solveArm(A, B, end, target, weight, side, memo, maxStep = Infinity, maxFlex = 150) {
  if (weight <= 0) return;
  _qa.copy(A.quaternion);
  _qb.copy(B.quaternion);
  if (memo.ca) { align(_qa, memo.ca); align(_qb, memo.cb); }
  const a = A.getWorldPosition(_a), b = B.getWorldPosition(_b), c = end(_c);
  const l1 = a.distanceTo(b), l2 = b.distanceTo(c);
  const dir = _d.subVectors(target, a);
  let d = dir.length();
  dir.divideScalar(d || 1);
  const th = Math.PI - maxFlex * Math.PI / 180;
  d = Math.min((l1 + l2) * 0.999, Math.max(Math.sqrt(l1 * l1 + l2 * l2 - 2 * l1 * l2 * Math.cos(th)), d));
  // cerniera della clip nel mondo, perpendicolare alla direzione del bersaglio
  const n0 = _n0.set(0, 0, side === 'Left' ? 1 : -1).applyQuaternion(A.getWorldQuaternion(_pw));
  const n1 = _n1.copy(n0).addScaledVector(dir, -n0.dot(dir));
  // bersaglio quasi lungo la cerniera: il piano resta quello di prima
  if (n1.lengthSq() < 0.04 && memo.n) n1.copy(memo.n).addScaledVector(dir, -memo.n.dot(dir));
  if (n1.lengthSq() < 1e-8) n1.set(0, 1, 0).addScaledVector(dir, -dir.y);
  n1.normalize();
  (memo.n || (memo.n = new THREE.Vector3())).copy(n1);
  // gomito nel piano: u x f = n1 (piega in avanti, mai al contrario)
  const e = _k.crossVectors(dir, n1);
  const cosA = Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d)));
  const elbow = _el2.copy(a).addScaledVector(dir, l1 * cosA).addScaledVector(e, l1 * Math.sqrt(1 - cosA * cosA));
  // braccio: dal suo asse e dalla sua cerniera a quelli nuovi
  const u0 = _u0.subVectors(b, a).normalize(), u1 = _u1.subVectors(elbow, a).normalize();
  _qr.setFromUnitVectors(u0, u1);
  const nr = _nr.copy(n0).applyQuaternion(_qr);
  nr.addScaledVector(u1, -nr.dot(u1)).normalize();
  _qt.setFromAxisAngle(u1, Math.atan2(_cx.crossVectors(nr, n1).dot(u1), nr.dot(n1)));
  rotateWorld(A, _qr.premultiply(_qt));
  // avambraccio: solo attorno alla cerniera, verso il bersaglio raggiungibile
  const b2 = B.getWorldPosition(_b), c2 = end(_c), goal = _go.copy(a).addScaledVector(dir, d);
  const f0 = _f0.subVectors(c2, b2), f1 = _f1.subVectors(goal, b2);
  f0.addScaledVector(n1, -f0.dot(n1));
  f1.addScaledVector(n1, -f1.dot(n1));
  if (f0.lengthSq() > 1e-8 && f1.lengthSq() > 1e-8) rotateWorld(B, _qt.setFromAxisAngle(n1, Math.atan2(_cx.crossVectors(f0, f1).dot(n1), f0.dot(f1))));
  align(A.quaternion, memo.a || _qa);
  align(B.quaternion, memo.b || _qb);
  if (memo.a && (limitStep(A.quaternion, memo.a, maxStep) | limitStep(B.quaternion, memo.b, maxStep))) A.updateMatrixWorld(true);
  (memo.a || (memo.a = new THREE.Quaternion())).copy(A.quaternion);
  (memo.b || (memo.b = new THREE.Quaternion())).copy(B.quaternion);
  // fusione per la via piu' breve fra clip e IK. Con i segni del fotogramma
  // prima, clip e IK partite a 163 gradi e poi riavvicinate a 25 restavano
  // sui due lati del giro: la fusione passava dalla parte lunga e il braccio
  // girava di 0,9 rad in un fotogramma (banco del portiere)
  align(_qa, A.quaternion);
  align(_qb, B.quaternion);
  const stepA = memo.ca ? angleAny(_qa, memo.ca) : 0, stepB = memo.cb ? angleAny(_qb, memo.cb) : 0;
  (memo.ca || (memo.ca = new THREE.Quaternion())).copy(_qa);
  (memo.cb || (memo.cb = new THREE.Quaternion())).copy(_qb);
  if (weight < 1) {
    A.quaternion.copy(slerpKeep(_qa, A.quaternion, weight));
    B.quaternion.copy(slerpKeep(_qb, B.quaternion, weight));
  }
  // il braccio mostrato va al massimo quanto la clip piu' il passo dell'IK:
  // anche dove la via piu' breve cambia lato (clip e IK opposte) niente scatti
  if (memo.fa) {
    align(A.quaternion, memo.fa);
    align(B.quaternion, memo.fb);
    limitStep(A.quaternion, memo.fa, stepA + maxStep);
    limitStep(B.quaternion, memo.fb, stepB + maxStep);
  }
  (memo.fa || (memo.fa = new THREE.Quaternion())).copy(A.quaternion);
  (memo.fb || (memo.fb = new THREE.Quaternion())).copy(B.quaternion);
  A.updateMatrixWorld(true);
}

// IK spenta (peso zero): il braccio mostrato torna alla clip dal punto in cui
// l'ha lasciato il limite di velocita' di solveArm (memo.fa), al massimo quanto
// la clip piu' maxStep a chiamata. Togliendo l'IK di colpo il ritardo
// accumulato si recuperava in un fotogramma (0,82 rad dopo una presa).
// true finche' non ha raggiunto la clip.
export function releaseArm(A, B, memo, maxStep) {
  if (!memo.fa) return false;
  _qa.copy(A.quaternion);
  _qb.copy(B.quaternion);
  const stepA = memo.ca ? angleAny(_qa, memo.ca) : 0, stepB = memo.cb ? angleAny(_qb, memo.cb) : 0;
  (memo.ca || (memo.ca = new THREE.Quaternion())).copy(_qa);
  (memo.cb || (memo.cb = new THREE.Quaternion())).copy(_qb);
  align(A.quaternion, memo.fa);
  align(B.quaternion, memo.fb);
  const lag = limitStep(A.quaternion, memo.fa, stepA + maxStep) | limitStep(B.quaternion, memo.fb, stepB + maxStep);
  memo.fa.copy(A.quaternion);
  memo.fb.copy(B.quaternion);
  A.updateMatrixWorld(true);
  return !!lag;
}

// Angolo (rad) fra due rotazioni, qualunque sia il segno dei quaternioni.
function angleAny(q, r) { return 2 * Math.acos(Math.min(1, Math.abs(q.dot(r)))); }

// Quanto ruota il braccio (rad) andando dalla clip all'IK nell'ultima chiamata
// di solveTwoBoneKeep: con i segni continui anche oltre mezzo giro.
export function blendPath(memo) {
  if (!memo.a || !memo.ca) return 0;
  const p = (x, y) => 2 * Math.acos(Math.max(-1, Math.min(1, x.dot(y))));
  return Math.max(p(memo.ca, memo.a), p(memo.cb, memo.b));
}

// q al massimo a `max` rad da prev (stesso segno): true se l'ha accorciato.
const _ql = new THREE.Quaternion();
function limitStep(q, prev, max) {
  const a = 2 * Math.acos(Math.max(-1, Math.min(1, q.dot(prev))));
  if (a <= max) return false;
  q.copy(slerpKeep(_ql.copy(prev), q, max / a));
  return true;
}

// q con il segno piu' vicino a ref (q e -q sono la stessa rotazione).
function align(q, ref) {
  if (q.dot(ref) < 0) q.set(-q.x, -q.y, -q.z, -q.w);
  return q;
}

// Da a verso b a t, sulla strada dei segni dati (anche oltre mezzo giro).
// Scrive in a.
function slerpKeep(a, b, t) {
  const c = Math.max(-1, Math.min(1, a.dot(b))), th = Math.acos(c), s = Math.sin(th);
  if (s < 1e-6) return a;          // stessa rotazione
  const wa = Math.sin((1 - t) * th) / s, wb = Math.sin(t * th) / s;
  return a.set(a.x * wa + b.x * wb, a.y * wa + b.y * wb, a.z * wa + b.z * wb, a.w * wa + b.w * wb).normalize();
}

function solveFull(A, B, end, target, pole) {
  const a = A.getWorldPosition(_a), b = B.getWorldPosition(_b);
  const l1 = a.distanceTo(b), l2 = b.distanceTo(end(_c));
  _t.copy(target);
  const dir = _d.subVectors(_t, a);
  const d = Math.min(l1 + l2 - 1e-3, Math.max(Math.abs(l1 - l2) + 1e-3, dir.length()));
  dir.normalize();
  // piano del gomito: dalla parte del polo, o da quella attuale
  const pv = pole ? _p.subVectors(pole, a) : _p.subVectors(b, a);
  pv.addScaledVector(dir, -pv.dot(dir));
  if (pv.lengthSq() < 1e-8) pv.set(0, -1, 0).addScaledVector(dir, dir.y);
  pv.normalize();
  const cosA = Math.min(1, Math.max(-1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d)));
  const knee = _k.copy(a).addScaledVector(dir, l1 * cosA).addScaledVector(pv, l1 * Math.sqrt(1 - cosA * cosA));
  aimWorld(A, _f.subVectors(b, a).normalize(), _g.subVectors(knee, a).normalize());
  const b2 = B.getWorldPosition(_b), c2 = end(_c);
  aimWorld(B, _f.subVectors(c2, b2).normalize(), _g.subVectors(_t, b2).normalize());
}

// Angoli del braccio `side` nella posa attuale, in gradi (matrici aggiornate):
// flex, flessione del gomito; hinge, scarto dell'asse su cui piega il gomito
// dalla sua cerniera (Z locale del braccio); twist, torsione dell'avambraccio
// rispetto al braccio e hand, della mano rispetto all'avambraccio, attorno
// all'avambraccio; wrist, piega del polso. Nelle 601 clip della libreria
// (0,1-99,9 percentile): hinge entro 16, twist -62..63, hand -96..89, wrist
// entro 86, flex fino a 142 (limiti in ANIM.armLimits).
const _ua = new THREE.Vector3(), _fa = new THREE.Vector3(), _ha = new THREE.Vector3(), _n = new THREE.Vector3();
const _za = new THREE.Vector3(), _zb = new THREE.Vector3(), _zh = new THREE.Vector3(), _wq = new THREE.Quaternion();
const _sh = new THREE.Vector3(), _el = new THREE.Vector3(), _wr = new THREE.Vector3(), _kn = new THREE.Vector3();
const DEG = 180 / Math.PI;
export function armAngles(bones, side, out = {}) {
  const A = bones[side + 'Arm'], B = bones[side + 'ForeArm'], H = bones[side + 'Hand'], K = bones[side + 'HandMiddle1'];
  A.getWorldPosition(_sh); B.getWorldPosition(_el); H.getWorldPosition(_wr); K.getWorldPosition(_kn);
  _ua.subVectors(_el, _sh).normalize(); _fa.subVectors(_wr, _el).normalize(); _ha.subVectors(_kn, _wr).normalize();
  out.flex = _ua.angleTo(_fa) * DEG;
  out.wrist = _fa.angleTo(_ha) * DEG;
  // asse della piega nel riferimento del braccio, contro la sua cerniera (Z locale, con il segno del lato)
  _n.crossVectors(_ua, _fa);
  if (_n.length() > 0.17) {
    _n.normalize().applyQuaternion(A.getWorldQuaternion(_wq).invert());
    out.hinge = Math.acos(Math.max(-1, Math.min(1, side === 'Left' ? _n.z : -_n.z))) * DEG;
  } else out.hinge = 0;
  const proj = (v) => v.addScaledVector(_fa, -v.dot(_fa)).normalize();
  proj(_za.set(0, 0, 1).applyQuaternion(A.getWorldQuaternion(_wq)));
  proj(_zb.set(0, 0, 1).applyQuaternion(B.getWorldQuaternion(_wq)));
  proj(_zh.set(0, 0, 1).applyQuaternion(H.getWorldQuaternion(_wq)));
  out.twist = Math.atan2(_n.crossVectors(_za, _zb).dot(_fa), _za.dot(_zb)) * DEG;
  out.hand = Math.atan2(_n.crossVectors(_zb, _zh).dot(_fa), _zb.dot(_zh)) * DEG;
  return out;
}

// Centro del palmo: fra il polso e le nocche del dito medio.
export function palm(bones, side, out) {
  const h = bones[side + 'Hand'], k = bones[side + 'HandMiddle1'];
  h.getWorldPosition(out);
  if (!k) return out;
  return out.lerp(k.getWorldPosition(_f), 0.6);
}
