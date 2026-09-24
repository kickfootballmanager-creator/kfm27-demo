import * as THREE from 'three';
import { BALL, GOAL, PITCH, KICK } from './config.js';

const HL = PITCH.length / 2;
const HW = PITCH.width / 2;
const GOAL_HW = GOAL.width / 2;
const POST_Z = GOAL_HW + GOAL.postRadius;
// La linea di porta ha il suo spessore: il gol conta oltre il bordo esterno.
const GOAL_LINE_OUT = HL + PITCH.lineWidth / 2;

function ballTexture() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#f5f6f4';
  g.fillRect(0, 0, 256, 128);
  g.fillStyle = '#1b2230';
  const spots = [[32, 30], [96, 64], [160, 30], [224, 64], [32, 98], [160, 98], [96, 8], [224, 8], [96, 120], [224, 120]];
  for (const [x, y] of spots) {
    g.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + i * Math.PI * 2 / 5;
      g.lineTo(x + Math.cos(a) * 11, y + Math.sin(a) * 13);
    }
    g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function shadowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(32, 32, 2, 32, 32, 32);
  grd.addColorStop(0, 'rgba(0,0,0,.55)');
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

// Spinge la palla fuori da un segmento (palo o traversa) e la fa rimbalzare.
const _q = new THREE.Vector3(), _n = new THREE.Vector3();
function hitSegment(pos, vel, a, b, radius) {
  const abx = b.x - a.x, aby = b.y - a.y, abz = b.z - a.z;
  const t = Math.max(0, Math.min(1, ((pos.x - a.x) * abx + (pos.y - a.y) * aby + (pos.z - a.z) * abz) / (abx * abx + aby * aby + abz * abz)));
  _q.set(a.x + abx * t, a.y + aby * t, a.z + abz * t);
  _n.subVectors(pos, _q);
  const d = _n.length(), min = radius + BALL.radius;
  if (d >= min || d === 0) return false;
  _n.divideScalar(d);
  pos.addScaledVector(_n, min - d);
  const vn = vel.dot(_n);
  if (vn < 0) vel.addScaledVector(_n, -(1 + GOAL.postRestitution) * vn);
  return true;
}

// Attrito a terra o gravita' e aria in volo: usato dalla fisica e dalla previsione.
function forces(p, v, dt) {
  const onGround = p.y <= BALL.radius + 1e-3 && Math.abs(v.y) < 1e-3;
  if (onGround) {
    const hs = Math.hypot(v.x, v.z);
    if (hs > 0) {
      const ns = Math.max(0, hs - (BALL.rollFriction + BALL.rollDrag * hs) * dt);
      const f = ns < BALL.stopSpeed ? 0 : ns / hs;
      v.x *= f; v.z *= f;
    }
  } else {
    v.y -= BALL.gravity * dt;
    const sp = v.length();
    v.multiplyScalar(Math.max(0, 1 - BALL.airDrag * sp * dt));
  }
}

// Effetto: spinta laterale perpendicolare alla corsa orizzontale, che si
// spegne nel tempo. Restituisce lo spin rimasto.
function curl(v, spin, dt) {
  if (spin === 0) return 0;
  const hs = Math.hypot(v.x, v.z);
  if (hs > 0.5) {
    const a = BALL.spinForce * spin * dt;
    const px = -v.z / hs, pz = v.x / hs;
    v.x += px * a;
    v.z += pz * a;
  }
  const s = spin * Math.exp(-BALL.spinDecay * dt);
  return Math.abs(s) < 0.01 ? 0 : s;
}

function move(p, v, dt) {
  p.addScaledVector(v, dt);
  if (p.y < BALL.radius) {
    p.y = BALL.radius;
    if (v.y < -BALL.minBounce) {
      v.y = -v.y * BALL.restitution;
      v.x *= BALL.bounceKeep;
      v.z *= BALL.bounceKeep;
    } else {
      v.y = 0;
    }
  }
}

const _pp = new THREE.Vector3(), _pv = new THREE.Vector3();

// Con dv/dt = -(f + c v) la palla si ferma dopo v/c - f/c^2 ln(1 + c v / f):
// si cerca per bisezione la velocita' che arriva a distanza d con velocita' `arrive`.
export function rollSpeedFor(d, arrive = 0) {
  const f = BALL.rollFriction, c = BALL.rollDrag;
  const stop = (v) => v / c - (f / (c * c)) * Math.log(1 + c * v / f);
  const need = d + stop(arrive);
  let lo = 0, hi = KICK.maxSpeed;
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2;
    if (stop(mid) < need) lo = mid; else hi = mid;
  }
  return hi;
}

// Secondi che un rasoterra partito a v0 impiega a percorrere d metri
// (x(t) della stessa equazione); Infinity se si ferma prima.
export function rollTime(v0, d) {
  const f = BALL.rollFriction, c = BALL.rollDrag, a = v0 + f / c;
  const x = (t) => a * (1 - Math.exp(-c * t)) / c - f * t / c;
  const stop = Math.log(a * c / f) / c;
  if (x(stop) < d) return Infinity;
  let lo = 0, hi = stop;
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2;
    if (x(mid) < d) lo = mid; else hi = mid;
  }
  return hi;
}

// Altezza a `dist` metri in orizzontale di un calcio a `speed` m/s con alzo
// `loft`: stessa gravita' e stessa aria della fisica, senza rimbalzi.
function heightAt(y0, speed, loft, dist) {
  let x = 0, y = y0, vx = Math.cos(loft) * speed, vy = Math.sin(loft) * speed;
  const dt = 1 / 120;
  for (let i = 0; i < 600; i++) {
    const px = x, py = y;
    vy -= BALL.gravity * dt;
    const k = Math.max(0, 1 - BALL.airDrag * Math.hypot(vx, vy) * dt);
    vx *= k; vy *= k;
    x += vx * dt; y += vy * dt;
    if (x >= dist) return py + (y - py) * (dist - px) / (x - px);
    if (vx < 0.5) break;
  }
  return -Infinity;
}

// Alzo (rad) con cui un calcio a `speed` m/s passa a `dist` metri
// all'altezza h: bisezione, l'altezza cresce con l'alzo.
export function loftFor(y0, speed, dist, h) {
  let lo = -0.25, hi = 0.75;
  for (let i = 0; i < 16; i++) {
    const mid = (lo + hi) / 2;
    if (heightAt(y0, speed, mid, dist) < h) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

// Volo di un calcio con l'effetto, senza pali ne' reti (guida della
// traiettoria nei calci piazzati): `out` riceve n punti {x, y, z} ogni dt.
const _fp = new THREE.Vector3(), _fv = new THREE.Vector3();
export function flight(p0, v0, spin, dt, n, out) {
  const p = _fp.copy(p0), v = _fv.copy(v0);
  let s = spin;
  for (let i = 0; i < n; i++) {
    forces(p, v, dt);
    s = curl(v, s, dt);
    move(p, v, dt);
    const o = out[i] || (out[i] = { x: 0, y: 0, z: 0 });
    o.x = p.x; o.y = p.y; o.z = p.z;
  }
  out.length = n;
  return out;
}

// Distanza orizzontale del primo rimbalzo, partendo da terra all'altezza y.
const _lp = new THREE.Vector3(), _lv = new THREE.Vector3();
function landDistance(y, vh, vy) {
  const p = _lp.set(0, y, 0), v = _lv.set(vh, vy, 0), dt = 1 / 60;
  for (let i = 0; i < 600; i++) {
    v.y -= BALL.gravity * dt;
    v.multiplyScalar(Math.max(0, 1 - BALL.airDrag * v.length() * dt));
    p.addScaledVector(v, dt);
    if (p.y <= BALL.radius && v.y < 0) return p.x;
  }
  return p.x;
}

export class Ball {
  constructor() {
    this.pos = new THREE.Vector3(0, BALL.radius, 0);
    this.prev = this.pos.clone();
    this.vel = new THREE.Vector3();
    this.spin = 0;
    this.scored = 0;      // +1 porta a destra (x>0), -1 porta a sinistra
    this.out = false;
    this.frame = this._frame();

    this.mesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(BALL.radius, 3),
      new THREE.MeshStandardMaterial({ map: ballTexture(), roughness: 0.45, metalness: 0 })
    );
    this.shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false })
    );
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.renderOrder = 3;
    this._axis = new THREE.Vector3();
  }

  _frame() {
    const segs = [];
    const H = GOAL.height + GOAL.postRadius;
    for (const s of [1, -1]) {
      for (const z of [POST_Z, -POST_Z]) {
        segs.push([new THREE.Vector3(s * HL, 0, z), new THREE.Vector3(s * HL, H, z)]);
      }
      segs.push([new THREE.Vector3(s * HL, H, -POST_Z), new THREE.Vector3(s * HL, H, POST_Z)]);
    }
    return segs;
  }

  reset(x = 0, z = 0) {
    this.pos.set(x, BALL.radius, z);
    this.prev.copy(this.pos);
    this.vel.set(0, 0, 0);
    this.spin = 0;
    this.scored = 0;
    this.out = false;
  }

  get live() { return !this.scored && !this.out; }

  // Rasoterra, a qualunque distanza: arriva con velocita' `arrive` entro
  // KICK.groundMin..groundMax; `speedMul` e' l'errore di forza di chi calcia.
  rollTo(tx, tz, arrive, speedMul = 1) {
    const dx = tx - this.pos.x, dz = tz - this.pos.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 0.3) return;
    const speed = Math.min(KICK.groundMax, Math.max(KICK.groundMin, rollSpeedFor(dist, arrive) * speedMul));
    this.pos.y = BALL.radius;
    this.kick(dx / dist * speed, 0, dz / dist * speed);
  }

  // Rasoterra verso (tx, tz) alla velocita' decisa da chi calcia.
  rollAt(tx, tz, speed) {
    const dx = tx - this.pos.x, dz = tz - this.pos.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 0.3) return;
    this.pos.y = BALL.radius;
    this.kick(dx / dist * speed, 0, dz / dist * speed);
  }

  // Parabola alta `apex` m che atterra su (tx, tz): la velocita' orizzontale si
  // corregge simulando il volo, perche' l'aria lo accorcia.
  lobTo(tx, tz, apex) {
    const dx = tx - this.pos.x, dz = tz - this.pos.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 0.3) return;
    const ux = dx / dist, uz = dz / dist;
    const h = Math.max(0.5, apex - (this.pos.y - BALL.radius));
    const vy = Math.sqrt(2 * BALL.gravity * h);
    let vh = dist / (2 * vy / BALL.gravity);
    for (let i = 0; i < 4; i++) {
      const land = landDistance(this.pos.y, vh, vy);
      if (land < 0.1) break;
      vh *= dist / land;
    }
    const total = Math.hypot(vh, vy);
    const f = total > KICK.maxSpeed ? KICK.maxSpeed / total : 1;
    this.kick(ux * vh * f, vy * f, uz * vh * f);
  }

  kick(vx, vy, vz, spin = 0) {
    this.vel.set(vx, vy, vz);
    this.spin = spin;
  }

  // Palla al piede: la posizione la decide il giocatore, la fisica si
  // limita a gol, fuori e cartelloni.
  carry(x, z, vx, vz) {
    this.prev.copy(this.pos);
    this.pos.set(x, BALL.radius, z);
    this.vel.set(vx, 0, vz);
    this.spin = 0;
    this._boards();
    this._rules();
  }

  // Palla in mano (portiere, rimessa laterale): niente fisica ne' regole.
  // Il disegno la mette poi fra le mani vere (main.placeHeldBall).
  hold(x, y, z) {
    this.prev.copy(this.pos);
    this.pos.set(x, y, z);
    this.vel.set(0, 0, 0);
    this.spin = 0;
  }

  step(dt) {
    const p = this.pos, v = this.vel;
    this.prev.copy(p);
    forces(p, v, dt);
    this.spin = curl(v, this.spin, dt);
    move(p, v, dt);

    for (const [a, b] of this.frame) hitSegment(p, v, a, b, GOAL.postRadius);
    this._nets(dt);
    this._boards();
    this._rules();
  }

  // Traiettoria futura senza pali, reti ne' effetto: `out` riceve un punto
  // ogni `dt` secondi ({x, y, z, t}), riusando gli oggetti gia' presenti.
  predict(out, dt, horizon) {
    const p = _pp.copy(this.pos), v = _pv.copy(this.vel);
    const n = Math.ceil(horizon / dt);
    for (let i = 0; i < n; i++) {
      forces(p, v, dt);
      move(p, v, dt);
      const s = out[i] || (out[i] = { x: 0, y: 0, z: 0, t: 0 });
      s.x = p.x; s.y = p.y; s.z = p.z; s.t = (i + 1) * dt;
    }
    out.length = n;
    return out;
  }

  // Ogni porta e' una scatola dietro la linea: dall'interno la rete
  // assorbe, dall'esterno respinge.
  _nets(dt) {
    const p = this.pos, v = this.vel, r = BALL.radius;
    for (const s of [1, -1]) {
      const lx = p.x * s, px = this.prev.x * s;
      const back = HL + GOAL.depth;
      const inBox = lx > HL && lx < back + r && Math.abs(p.z) < POST_Z + r && p.y < GOAL.height + r;
      if (!inBox) continue;
      const cameThroughMouth = px <= HL || (Math.abs(this.prev.z) < POST_Z && this.prev.y < GOAL.height && px < back);
      if (cameThroughMouth) {
        const damp = Math.exp(-GOAL.netDamping * dt);
        if (lx + r > back) { p.x = s * (back - r); v.x = -v.x * GOAL.netBounce; }
        if (Math.abs(p.z) + r > POST_Z) { p.z = Math.sign(p.z) * (POST_Z - r); v.z = -v.z * GOAL.netBounce; }
        if (p.y + r > GOAL.height) { p.y = GOAL.height - r; v.y = -Math.abs(v.y) * GOAL.netBounce; }
        if (lx > HL + r) v.multiplyScalar(damp);
      } else if (px >= back) {
        p.x = s * (back + r); v.x = -v.x * GOAL.outerNetBounce;
      } else if (Math.abs(this.prev.z) >= POST_Z) {
        p.z = Math.sign(p.z) * (POST_Z + r); v.z = -v.z * GOAL.outerNetBounce;
      } else {
        p.y = GOAL.height + r; v.y = Math.abs(v.y) * GOAL.outerNetBounce;
      }
    }
  }

  _boards() {
    const p = this.pos, v = this.vel, r = BALL.radius;
    const bx = HL + PITCH.runoff - r, bz = HW + PITCH.runoff - r;
    if (p.y > PITCH.boardHeight + r) return;
    if (Math.abs(p.x) > bx) { p.x = Math.sign(p.x) * bx; v.x = -v.x * BALL.boardRestitution; }
    if (Math.abs(p.z) > bz) { p.z = Math.sign(p.z) * bz; v.z = -v.z * BALL.boardRestitution; }
  }

  _rules() {
    if (!this.live) return;
    const p = this.pos, r = BALL.radius;
    const ax = Math.abs(p.x);
    if (ax - r > GOAL_LINE_OUT) {
      if (Math.abs(p.z) < GOAL_HW && p.y < GOAL.height) this.scored = Math.sign(p.x);
      else this.out = true;
    } else if (Math.abs(p.z) - r > HW + PITCH.lineWidth / 2) {
      this.out = true;
    }
  }

  // Posizione interpolata fra gli ultimi due passi di fisica.
  sync(alpha, dt) {
    const m = this.mesh;
    m.position.lerpVectors(this.prev, this.pos, alpha);
    const hs = Math.hypot(this.vel.x, this.vel.z);
    if (hs > 0.01) {
      this._axis.set(this.vel.z, 0, -this.vel.x).normalize();
      m.rotateOnWorldAxis(this._axis, hs * dt / BALL.radius);
    }
    const h = Math.max(0, this.pos.y - BALL.radius);
    const s = 0.5 + h * 0.06;
    this.shadow.position.set(m.position.x, 0.012, m.position.z);
    this.shadow.scale.set(s, s, 1);
    this.shadow.material.opacity = Math.max(0.15, 1 - h * 0.12);
  }
}
