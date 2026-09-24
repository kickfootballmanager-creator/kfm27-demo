import * as THREE from 'three';
import { PLAYER, PITCH, GOAL, PASS, SHOT, ATTR, THROUGH, CROSS, FORMATIONS, FORMATION_ROLES } from './config.js';
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

    this.team = null;          // 'home' | 'away'
    this.role = String(data.role || '').toUpperCase();
    this.keeper = false;
    this.action = null;        // gesto in corso (main.js): calcio, finta, contrasto...
    this.sideSpeed = 0;        // portiere: velocita' laterale per il passo laterale

    this.avatar = new Avatar(tpl, material, data.number, kit.primary);
    this.mesh = this.avatar.object;
    this.shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })
    );
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.renderOrder = 2;
    const s = PLAYER.radius * 3.2;
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
    this.avatar.update(dt, this.speed, wrap(this.moveHeading - this.heading), this.sideSpeed);
  }

  // Sposta il giocatore senza passare dalla corsa (radice di una clip,
  // riposizionamento): la velocita' resta coerente per le animazioni.
  moveTo(x, z, dt) {
    this.prev.copy(this.pos);
    this.prevHeading = this.heading;
    const dx = x - this.pos.x, dz = z - this.pos.z;
    this.pos.x = x; this.pos.z = z;
    if (dt > 0) {
      this.vel.set(dx / dt, 0, dz / dt);
      this.speed = Math.hypot(dx, dz) / dt;
      if (this.speed > 0.05) this.moveHeading = headingOf(dx, dz);
    }
  }

  // Direzione a destra del busto, nel piano del campo.
  get rightX() { return -Math.cos(this.heading); }
  get rightZ() { return Math.sin(this.heading); }
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

// Le posizioni del modulo: `team.slots` dal manager (allineati ai giocatori),
// altrimenti la tabella FORMATIONS; senza modulo noto, 4-3-3.
export function formationSlots(team) {
  if (team && Array.isArray(team.slots) && team.slots.length === 11) {
    return team.slots.map((s) => ({ role: String(s.role || '').toUpperCase(), x: +s.x, y: +s.y }));
  }
  const name = team && FORMATIONS[team.formation] ? team.formation : '4-3-3';
  return FORMATIONS[name].map(([x, y], i) => ({ role: FORMATION_ROLES[name][i], x, y }));
}

// Undici giocatori nell'ordine del modulo. Con `slots` il manager ha gia'
// messo ogni titolare al suo posto; senza, si abbina per ruolo. Chi manca
// diventa una sagoma con il numero del posto.
export function buildTeam(team, side, attackDir, tpl, material, keeperMaterial, shadowTex, kit, keeperKit) {
  const slots = formationSlots(team);
  const aligned = team && Array.isArray(team.slots) && team.slots.length === 11;
  // allineati: un posto vuoto resta vuoto, non fa scalare gli altri
  const given = aligned ? (team.players || []) : ((team && team.players) || []).filter(Boolean);
  const used = new Set();
  const take = (i, role) => {
    if (aligned) { const p = given[i]; if (p) used.add(p); return p; }
    let p = given.find((q) => !used.has(q) && hasRole(q, [role]));
    if (!p && role !== 'POR') p = given.find((q) => !used.has(q) && !hasRole(q, ['POR']));
    if (!p) p = given.find((q) => !used.has(q));
    if (p) used.add(p);
    return p;
  };
  const players = slots.map((slot, i) => {
    const src = take(i, slot.role);
    const keeper = i === 0;
    const data = src
      ? { ...src, number: src.number || i + 1, role: src.role || slot.role }
      : { id: null, name: '', number: i + 1, role: slot.role, overall: ATTR.fallback };
    const pl = new Player(data, keeper ? keeperKit : kit, tpl, keeper ? keeperMaterial : material, shadowTex, attackDir);
    pl.team = side;
    pl.slot = slot;
    pl.keeper = keeper;
    pl.index = i;
    return pl;
  });
  return players;
}

// Passaggio assistito: il compagno nel cono della direzione con il
// punteggio piu' basso (angolo, distanza, marcatura).
// `power` (0..1, pressione prolungata) preferisce i compagni piu' lontani.
export function choosePass(from, dirX, dirZ, mates, opponents, cone = PASS.cone, power = 0) {
  const dl = Math.hypot(dirX, dirZ) || 1;
  const ux = dirX / dl, uz = dirZ / dl;
  let best = null, bestScore = Infinity;
  for (const m of mates) {
    if (m === from || !available(m)) continue;
    const dx = m.pos.x - from.pos.x, dz = m.pos.z - from.pos.z;
    const d = Math.hypot(dx, dz);
    if (d < PASS.minDist || d > PASS.maxDist) continue;
    const ang = Math.acos(clamp((dx * ux + dz * uz) / d, -1, 1));
    if (ang > cone) continue;
    const free = freeness(m.pos.x, m.pos.z, opponents);
    const want = PASS.minDist + (PASS.maxDist * 0.6 - PASS.minDist) * power;
    const score = PASS.wAngle * (ang / cone) + PASS.wDist * (d / PASS.maxDist) - PASS.wFree * free +
      PASS.wPower * power * Math.abs(d - want) / PASS.maxDist;
    if (score < bestScore) { bestScore = score; best = m; }
  }
  return best;
}

// Chi e' a terra o impegnato in un tuffo non riceve passaggi.
function available(m) { return !m.down && !m.keeperBusy; }

// 0 marcato stretto, 1 nessun avversario entro PASS.freeRadius.
export function freeness(x, z, opponents) {
  let near = Infinity;
  for (const o of opponents) near = Math.min(near, Math.hypot(o.pos.x - x, o.pos.z - z));
  return Math.min(1, near / PASS.freeRadius);
}

// Filtrante: il compagno nel cono con piu' spazio davanti. La palla va dove
// arrivera' correndo, non ai suoi piedi.
export function chooseThrough(from, dirX, dirZ, mates, opponents, power) {
  const dl = Math.hypot(dirX, dirZ) || 1;
  const ux = dirX / dl, uz = dirZ / dl;
  const lead = THROUGH.minLead + (THROUGH.maxLead - THROUGH.minLead) * power;
  let best = null, bestScore = Infinity;
  for (const m of mates) {
    if (m === from || !available(m) || m.keeper) continue;
    const dx = m.pos.x - from.pos.x, dz = m.pos.z - from.pos.z;
    const d = Math.hypot(dx, dz);
    if (d < PASS.minDist || d > PASS.maxDist) continue;
    const ang = Math.acos(clamp((dx * ux + dz * uz) / d, -1, 1));
    if (ang > THROUGH.cone) continue;
    const run = runDirection(m);
    const tx = m.pos.x + run.x * lead, tz = clampZ(m.pos.z + run.z * lead);
    const space = freeness(tx, tz, opponents);
    const score = PASS.wAngle * (ang / THROUGH.cone) + PASS.wDist * (d / PASS.maxDist) - THROUGH.wSpace * space;
    if (score < bestScore) { bestScore = score; best = { mate: m, tx, tz }; }
  }
  if (best) return best;
  return { mate: null, tx: from.pos.x + ux * (PASS.blindDist + lead), tz: clampZ(from.pos.z + uz * (PASS.blindDist + lead)) };
}

// Dove corre il compagno: la sua corsa se si muove, altrimenti verso la
// porta avversaria.
function runDirection(m) {
  const s = Math.hypot(m.vel.x, m.vel.z);
  if (s > 2) return { x: m.vel.x / s, z: m.vel.z / s };
  return { x: m.attackDir, z: 0 };
}

const clampZ = (z) => clamp(z, -HW + 1, HW - 1);

// Cross dalla fascia nell'ultimo terzo, lancio lungo altrove. Restituisce
// punto d'arrivo, altezza della parabola, tipo e destinatario.
export function chooseCross(from, dirX, dirZ, mates, opponents, power) {
  const d = from.attackDir;
  const ax = from.pos.x * d;
  if (Math.abs(from.pos.z) > CROSS.wingZ && ax > CROSS.finalThird) {
    const side = Math.sign(from.pos.z) || 1;
    let best = null, bestN = -1;
    for (const t of CROSS.targets) {
      const tx = d * (HL - t.back), tz = -side * t.z;
      let n = 0;
      for (const m of mates) if (m !== from && !m.keeper && Math.hypot(m.pos.x - tx, m.pos.z - tz) < CROSS.mateRadius) n += 1 - Math.hypot(m.pos.x - tx, m.pos.z - tz) / CROSS.mateRadius;
      if (n > bestN) { bestN = n; best = { tx, tz }; }
    }
    return { kind: 'cross', tx: best.tx, tz: best.tz, apex: CROSS.apexMin + (CROSS.apexMax - CROSS.apexMin) * power, mate: nearestMate(best.tx, best.tz, from, mates) };
  }
  const dl = Math.hypot(dirX, dirZ) || 1;
  const ux = dirX / dl, uz = dirZ / dl;
  let best = null, bestScore = Infinity;
  for (const m of mates) {
    if (m === from || !available(m) || m.keeper) continue;
    const dx = m.pos.x - from.pos.x, dz = m.pos.z - from.pos.z;
    const dist = Math.hypot(dx, dz);
    if (dist < CROSS.longMin || dist > PASS.maxDist + 15) continue;
    const ang = Math.acos(clamp((dx * ux + dz * uz) / dist, -1, 1));
    if (ang > CROSS.cone) continue;
    const score = ang / CROSS.cone - PASS.wFree * freeness(m.pos.x, m.pos.z, opponents) - 0.3 * power * dist / PASS.maxDist;
    if (score < bestScore) { bestScore = score; best = m; }
  }
  const apex = CROSS.apexLong * (0.8 + 0.4 * power);
  if (best) {
    const run = runDirection(best);
    return { kind: 'lancio', tx: best.pos.x + run.x * 3, tz: clampZ(best.pos.z + run.z * 3), apex, mate: best };
  }
  const reach = CROSS.longSpace * (0.7 + 0.5 * power);
  return { kind: 'lancio', tx: clamp(from.pos.x + ux * reach, -HL + 2, HL - 2), tz: clampZ(from.pos.z + uz * reach), apex, mate: null };
}

function nearestMate(x, z, from, mates) {
  let best = null, bd = Infinity;
  for (const m of mates) {
    if (m === from || m.keeper || !available(m)) continue;
    const d = Math.hypot(m.pos.x - x, m.pos.z - z);
    if (d < bd) { bd = d; best = m; }
  }
  return best;
}

// Errore sul punto d'arrivo di un pallone alto, scalato dal passaggio.
export function loftError(from) {
  const s = from.params.passError / ATTR.passError[0];
  return { x: gauss() * CROSS.error * s, z: gauss() * CROSS.error * s };
}

// Pressione su un giocatore, 0..1: quanto e' vicino l'avversario piu' vicino.
export function pressure(p, opponents) {
  let near = Infinity;
  for (const o of opponents) near = Math.min(near, Math.hypot(o.pos.x - p.pos.x, o.pos.z - p.pos.z));
  return 1 - Math.min(1, near / PASS.freeRadius);
}

// Punto d'arrivo del passaggio con l'errore di chi calcia.
// Ai piedi del compagno, anticipando un po' la sua corsa.
export function passAim(from, ball, target, dirX, dirZ) {
  let tx, tz;
  if (target) {
    const t = Math.hypot(target.pos.x - ball.pos.x, target.pos.z - ball.pos.z) / 16;
    tx = target.pos.x + target.vel.x * t * PASS.lead;
    tz = target.pos.z + target.vel.z * t * PASS.lead;
  } else {
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
