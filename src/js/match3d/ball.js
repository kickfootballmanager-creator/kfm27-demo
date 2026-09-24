import * as THREE from 'three';
import { BALL, GOAL, PITCH, TEST_KICK } from './config.js';

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

function shadowTexture() {
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

// Con dv/dt = -(f + c v) la palla si ferma dopo v/c - f/c^2 ln(1 + c v / f):
// si cerca per bisezione la velocita' che la ferma a distanza d.
function rollSpeedFor(d) {
  const f = BALL.rollFriction, c = BALL.rollDrag;
  const stop = (v) => v / c - (f / (c * c)) * Math.log(1 + c * v / f);
  let lo = 0, hi = TEST_KICK.maxSpeed;
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2;
    if (stop(mid) < d) lo = mid; else hi = mid;
  }
  return hi;
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
      new THREE.IcosahedronGeometry(BALL.radius * BALL.visualScale, 3),
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

  // Calcio di prova verso un punto a terra: rasoterra da vicino, a
  // parabola da lontano, con una stima che compensa la resistenza.
  kickTowards(tx, tz) {
    const dx = tx - this.pos.x, dz = tz - this.pos.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 0.3) return;
    const ux = dx / dist, uz = dz / dist;
    let speed, vy = 0;
    if (dist <= TEST_KICK.groundPassMax) {
      speed = rollSpeedFor(dist);
    } else {
      const k = Math.min(1, (dist - TEST_KICK.groundPassMax) / (TEST_KICK.loftDistance - TEST_KICK.groundPassMax));
      const ang = TEST_KICK.minLoft + (TEST_KICK.maxLoft - TEST_KICK.minLoft) * k;
      const v = Math.sqrt(dist * BALL.gravity / Math.sin(2 * ang)) * (1 + TEST_KICK.dragComp * dist);
      speed = v * Math.cos(ang);
      vy = v * Math.sin(ang);
    }
    const total = Math.hypot(speed, vy);
    if (total > TEST_KICK.maxSpeed) { const f = TEST_KICK.maxSpeed / total; speed *= f; vy *= f; }
    this.vel.set(ux * speed, vy, uz * speed);
    this.spin = TEST_KICK.spin;
  }

  step(dt) {
    const p = this.pos, v = this.vel, r = BALL.radius;
    this.prev.copy(p);
    const onGround = p.y <= r + 1e-3 && Math.abs(v.y) < 1e-3;

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
      const drag = Math.max(0, 1 - BALL.airDrag * sp * dt);
      v.multiplyScalar(drag);
    }

    if (this.spin !== 0) {
      // Forza laterale perpendicolare alla corsa orizzontale.
      const hs = Math.hypot(v.x, v.z);
      if (hs > 0.5) {
        const a = BALL.spinForce * this.spin * dt;
        const px = -v.z / hs, pz = v.x / hs;
        v.x += px * a;
        v.z += pz * a;
      }
      this.spin *= Math.exp(-BALL.spinDecay * dt);
      if (Math.abs(this.spin) < 0.01) this.spin = 0;
    }

    p.addScaledVector(v, dt);

    if (p.y < r) {
      p.y = r;
      if (v.y < -BALL.minBounce) {
        v.y = -v.y * BALL.restitution;
        v.x *= BALL.bounceKeep;
        v.z *= BALL.bounceKeep;
      } else {
        v.y = 0;
      }
    }

    for (const [a, b] of this.frame) hitSegment(p, v, a, b, GOAL.postRadius);
    this._nets(dt);
    this._boards();
    this._rules();
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
      m.rotateOnWorldAxis(this._axis, hs * dt / (BALL.radius * BALL.visualScale));
    }
    // La sfera disegnata e' piu' grande di quella fisica: la si alza per
    // non farla affondare nel prato.
    m.position.y += BALL.radius * (BALL.visualScale - 1);
    const h = Math.max(0, this.pos.y - BALL.radius);
    const s = 0.34 * BALL.visualScale + h * 0.06;
    this.shadow.position.set(m.position.x, 0.012, m.position.z);
    this.shadow.scale.set(s, s, 1);
    this.shadow.material.opacity = Math.max(0.15, 1 - h * 0.12);
  }
}
