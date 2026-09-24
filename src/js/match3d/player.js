import * as THREE from 'three';
import { PLAYER, PITCH, GOAL, PRACTICE, PASS, SHOT, ATTR, KIT } from './config.js';
import { playerParams } from './attributes.js';
import { Avatar } from './avatar.js';

const HL = PITCH.length / 2;
const HW = PITCH.width / 2;
const GOAL_HW = GOAL.width / 2;
const TAU = Math.PI * 2;

function wrap(a) {
  a %= TAU;
  if (a > Math.PI) a -= TAU;
  if (a < -Math.PI) a += TAU;
  return a;
}

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// Circa normale, media 0 e deviazione 1: basta per gli errori di mira.
function gauss() {
  return (Math.random() + Math.random() + Math.random() - 1.5) * 2;
}

// Nel verso di +z la maglia mostra il petto: rotation.y = heading porta
// il petto nella direzione (sin h, cos h).
export function headingOf(dx, dz) { return Math.atan2(dx, dz); }

export class Player {
  constructor(data, kit, tpl, material, shadowTex, attackDir) {
    this.data = data;
    this.id = data.id ?? null;
    this.name = data.name || '';
    this.number = data.number;
    this.attackDir = attackDir;
    this.params = playerParams(data);
    this.pos = new THREE.Vector3();
    this.prev = new THREE.Vector3();
    this.vel = new THREE.Vector3();
    this.heading = headingOf(attackDir, 0);   // busto
    this.moveHeading = this.heading;          // direzione della corsa
    this.prevHeading = this.heading;
    this.speed = 0;
    this.sprinting = false;
    this.touchPhase = 0;
    this.knockTimer = 0;

    this.avatar = new Avatar(tpl, material, data.number, kit.primary);
    this.mesh = this.avatar.object;
    this.mesh.scale.multiplyScalar(PLAYER.visualScale);
    this.shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })
    );
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.renderOrder = 2;
    const s = PLAYER.radius * PLAYER.visualScale * 3.2;
    this.shadow.scale.set(s, s, 1);
  }

  place(x, z, heading) {
    this.pos.set(x, 0, z);
    this.prev.copy(this.pos);
    this.vel.set(0, 0, 0);
    this.speed = 0;
    this.heading = this.prevHeading = this.moveHeading = heading;
    this.knockTimer = 0;
  }

  get dirX() { return Math.sin(this.heading); }
  get dirZ() { return Math.cos(this.heading); }

  // Un passo di movimento: (dx, dz) direzione voluta, mag 0..1.
  // o.face: il busto guarda questo vettore invece della direzione di corsa.
  // o.turnMul: sterzata piu' rapida (rincorsa del tiro). o.decel: frenata.
  drive(dt, dx, dz, mag, o = {}) {
    const P = this.params;
    this.prev.copy(this.pos);
    this.prevHeading = this.heading;
    const slow = 1 - Math.min(1, this.speed / P.maxSpeed);
    const turn = (o.withBall ? P.turnRateBall : P.turnRate) * (1 + PLAYER.turnSlowBoost * slow) * (o.turnMul || 1) * dt;
    let want = 0;
    if (mag > 0) {
      const target = headingOf(dx, dz);
      this.moveHeading = wrap(this.moveHeading + clamp(wrap(target - this.moveHeading), -turn, turn));
      const left = Math.abs(wrap(target - this.moveHeading));
      want = mag * P.maxSpeed * (o.sprint ? 1 : PLAYER.jogFactor) * (o.withBall ? P.dribbleSpeed : 1);
      want *= Math.max(PLAYER.turnBrake, Math.cos(Math.min(left, Math.PI / 2)));
    }
    // Il busto segue la corsa o guarda o.face; di lato si corre piu' piano.
    const faceTo = o.face ? headingOf(o.face.x, o.face.z) : this.moveHeading;
    const ft = turn * PLAYER.faceTurn;
    this.heading = wrap(this.heading + clamp(wrap(faceTo - this.heading), -ft, ft));
    if (o.face && Math.abs(wrap(this.moveHeading - this.heading)) > Math.PI / 4) want *= PLAYER.strafeSpeed;
    if (mag === 0 && !o.face && this.speed < 0.05) this.moveHeading = this.heading;

    this.sprinting = !!o.sprint && mag > 0;
    const rate = want > this.speed ? P.accel : (o.decel || PLAYER.decel);
    this.speed += clamp(want - this.speed, -rate * dt, rate * dt);
    this.vel.set(Math.sin(this.moveHeading) * this.speed, 0, Math.cos(this.moveHeading) * this.speed);
    this.pos.addScaledVector(this.vel, dt);
  }

  // Dentro il recinto dei cartelloni e fuori dalla scatola delle porte.
  confine() {
    const p = this.pos, r = PLAYER.radius;
    const lx = HL + PITCH.runoff - PLAYER.fieldMargin, lz = HW + PITCH.runoff - PLAYER.fieldMargin;
    p.x = clamp(p.x, -lx, lx);
    p.z = clamp(p.z, -lz, lz);
    const ax = Math.abs(p.x), side = GOAL_HW + GOAL.postRadius + r;
    if (ax > HL - r && ax < HL + GOAL.depth + r && Math.abs(p.z) < side) {
      const s = Math.sign(p.x) || 1;
      const front = ax - (HL - r), back = HL + GOAL.depth + r - ax, lat = side - Math.abs(p.z);
      if (front <= back && front <= lat) p.x = s * (HL - r);
      else if (back <= lat) p.x = s * (HL + GOAL.depth + r);
      else p.z = (Math.sign(p.z) || 1) * side;
    }
  }

  sync(alpha, dt) {
    const m = this.mesh;
    m.position.lerpVectors(this.prev, this.pos, alpha);
    m.rotation.y = this.prevHeading + wrap(this.heading - this.prevHeading) * alpha;
    this.shadow.position.set(m.position.x, 0.011, m.position.z);
    this.avatar.update(dt, this.speed, wrap(this.moveHeading - this.heading));
  }
}

// Due giocatori non si compenetrano; chi e' fermo non viene spostato.
export function separate(players, anchored) {
  const min = PLAYER.radius * 2;
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const a = players[i], b = players[j];
      const dx = b.pos.x - a.pos.x, dz = b.pos.z - a.pos.z;
      const d = Math.hypot(dx, dz);
      if (d >= min) continue;
      const nx = d > 1e-4 ? dx / d : 1, nz = d > 1e-4 ? dz / d : 0;
      const push = min - d;
      const fa = anchored(a) ? 0 : anchored(b) ? 1 : 0.5;
      const fb = anchored(b) ? 0 : 1 - fa;
      a.pos.x -= nx * push * fa; a.pos.z -= nz * push * fa;
      b.pos.x += nx * push * fb; b.pos.z += nz * push * fb;
    }
  }
}

function hasRole(p, roles) {
  const own = String(p.role || '').toUpperCase().split(/[,\s/]+/);
  return own.some((r) => roles.includes(r));
}

// Sceglie dalla rosa i giocatori per le posizioni di PRACTICE, portieri esclusi.
// Senza rosa (avversario sconosciuto) si usano sagome con il numero del ruolo.
export function buildSquad(team, kit, attackDir, tpl, material, shadowTex) {
  const pool = ((team && team.players) || []).filter((p) => p && !hasRole(p, ['POR']));
  const used = new Set();
  const take = (roles) => {
    let p = pool.find((q) => !used.has(q) && hasRole(q, roles));
    if (!p) p = pool.find((q) => !used.has(q));
    if (p) used.add(p);
    return p;
  };
  const players = [];
  let kickoff = 0;
  for (const slot of PRACTICE.slots) {
    const src = take(slot.roles);
    const data = src
      ? { ...src, number: src.number || slot.number }
      : { id: null, name: '', number: slot.number, role: slot.roles[0], overall: ATTR.fallback };
    const pl = new Player(data, kit || KIT.home, tpl, material, shadowTex, attackDir);
    pl.slot = slot;
    if (slot.kickoff) kickoff = players.length;
    players.push(pl);
  }
  return { players, kickoff };
}

export function kickoffPlacement(squad) {
  for (const pl of squad.players) {
    const d = pl.attackDir;
    pl.place(pl.slot.x * d, pl.slot.z * d, headingOf(d, 0));
  }
}

// Passaggio assistito: il compagno nel cono della direzione con il
// punteggio piu' basso (angolo, distanza, marcatura).
export function choosePass(from, dirX, dirZ, mates, opponents, cone = PASS.cone) {
  const dl = Math.hypot(dirX, dirZ) || 1;
  const ux = dirX / dl, uz = dirZ / dl;
  let best = null, bestScore = Infinity;
  for (const m of mates) {
    if (m === from) continue;
    const dx = m.pos.x - from.pos.x, dz = m.pos.z - from.pos.z;
    const d = Math.hypot(dx, dz);
    if (d < PASS.minDist || d > PASS.maxDist) continue;
    const ang = Math.acos(clamp((dx * ux + dz * uz) / d, -1, 1));
    if (ang > cone) continue;
    let near = Infinity;
    for (const o of opponents) near = Math.min(near, Math.hypot(o.pos.x - m.pos.x, o.pos.z - m.pos.z));
    const free = Math.min(1, near / PASS.freeRadius);
    const score = PASS.wAngle * (ang / cone) + PASS.wDist * (d / PASS.maxDist) - PASS.wFree * free;
    if (score < bestScore) { bestScore = score; best = m; }
  }
  return best;
}

// Pressione su un giocatore, 0..1: quanto e' vicino l'avversario piu' vicino.
export function pressure(p, opponents) {
  let near = Infinity;
  for (const o of opponents) near = Math.min(near, Math.hypot(o.pos.x - p.pos.x, o.pos.z - p.pos.z));
  return 1 - Math.min(1, near / PASS.freeRadius);
}

// Punto d'arrivo del passaggio con l'errore di chi calcia.
export function passAim(from, ball, target, dirX, dirZ) {
  let tx, tz;
  if (target) { tx = target.pos.x; tz = target.pos.z; }
  else {
    const dl = Math.hypot(dirX, dirZ) || 1;
    tx = ball.pos.x + dirX / dl * PASS.blindDist;
    tz = ball.pos.z + dirZ / dl * PASS.blindDist;
  }
  const e = gauss() * from.params.passError;
  const dx = tx - ball.pos.x, dz = tz - ball.pos.z;
  const c = Math.cos(e), s = Math.sin(e);
  const scale = from.params.passError / ATTR.passError[0];
  return {
    tx: ball.pos.x + dx * c - dz * s,
    tz: ball.pos.z + dx * s + dz * c,
    speedMul: 1 + gauss() * PASS.speedError * scale
  };
}

// Tiro: se il joystick punta verso la porta avversaria sceglie il punto
// fra i pali, se punta altrove si calcia li'. Senza joystick si tira in
// porta, verso il palo a cui guarda il giocatore.
export function shotVelocity(from, ball, power, aimX, aimZ, fromStick) {
  const P = from.params, d = from.attackDir;
  const al = Math.hypot(aimX, aimZ) || 1;
  const forward = (aimX / al) * d > -0.2;
  let dx, dz;
  if (forward || !fromStick) {
    const tz = forward ? clamp(aimZ / al, -1, 1) * (GOAL_HW - SHOT.postMargin) : 0;
    dx = d * HL - ball.pos.x;
    dz = tz - ball.pos.z;
  } else {
    dx = aimX; dz = aimZ;
  }
  const over = Math.max(0, (power - SHOT.overPower) / (1 - SHOT.overPower));
  const err = P.shotError * (1 + SHOT.overError * over) * (from.sprinting ? SHOT.sprintError : 1);
  const ang = Math.atan2(dz, dx) + gauss() * err;
  const speed = SHOT.minSpeed + (P.shotSpeed - SHOT.minSpeed) * power;
  const loft = Math.max(0, SHOT.loftMin + (SHOT.loftMax - SHOT.loftMin) * power * power + SHOT.overLoft * over + gauss() * err * 0.5);
  const h = Math.cos(loft) * speed;
  return { vx: Math.cos(ang) * h, vy: Math.sin(loft) * speed, vz: Math.sin(ang) * h };
}
