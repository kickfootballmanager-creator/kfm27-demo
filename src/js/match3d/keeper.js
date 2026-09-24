import { KEEPER, PITCH, GOAL, BALL, ATTR } from './config.js';
import { rootAt, clipDuration } from './avatar.js';
import { freeness } from './player.js';

// IA del portiere: POSIZIONE, USCITA, PARATA, RINVIO. Muove il portiere a 60 Hz;
// le parate sono gesti con lo spostamento della radice scalato per arrivare sulla palla.

const HL = PITCH.length / 2;
const GOAL_HW = GOAL.width / 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;

export class KeeperAI {
  constructor(match, side, keeper, difficulty) {
    this.m = match;
    this.side = side;
    this.p = keeper;
    this.skill = difficulty;
    this.hold = 0;
    this.watch = null;       // tiro gia' valutato: non si ripete la decisione
    const o = Number(keeper.data.overall) || ATTR.fallback;
    this.attr = clamp((o - ATTR.low) / (ATTR.high - ATTR.low), 0, 1);
    this.path = [];
    keeper.aiState = 'POSIZIONE';
  }

  get dir() { return this.m.dirOf(this.side); }
  // Centro della propria porta.
  get goalX() { return -this.dir * HL; }

  update(dt) {
    const m = this.m, k = this.p;
    if (k.action || k.down) return;
    if (m.owner === k) { this.distribute(dt); return; }
    this.hold = 0;
    k.holding = false;
    if (m.phase !== 'play') { this.pending = null; this.position(dt); return; }
    if (this.pending && this.waitSave(dt)) return;
    if (this.save()) return;
    if (this.claim(dt)) return;
    if (this.rush(dt)) return;
    this.position(dt);
  }

  // Sulla linea fra palla e centro della porta, piu' fuori quando la palla si avvicina.
  position(dt) {
    const m = this.m, k = this.p, b = m.ball.pos;
    k.aiState = 'POSIZIONE';
    const gx = this.goalX;
    const vx = b.x - gx, vz = b.z, vl = Math.hypot(vx, vz) || 1;
    const t = clamp((KEEPER.depthRange[0] - vl) / (KEEPER.depthRange[0] - KEEPER.depthRange[1]), 0, 1);
    const depth = lerp(KEEPER.depth[0], KEEPER.depth[1], t);
    const tx = gx + vx / vl * depth, tz = clamp(vz / vl * depth, -KEEPER.maxZ, KEEPER.maxZ);
    this.moveTo(dt, tx, tz, false);
  }

  moveTo(dt, tx, tz, sprint) {
    const k = this.p, b = this.m.ball.pos;
    const dx = tx - k.pos.x, dz = tz - k.pos.z, d = Math.hypot(dx, dz);
    const face = { x: b.x - k.pos.x, z: b.z - k.pos.z };
    if (d < 0.15) k.drive(dt, 0, 0, 0, { face });
    else k.drive(dt, dx, dz, Math.min(1, d / 1.5), { face, sprint });
    // passo laterale: velocita' lungo la destra del busto
    k.sideSpeed = sprint ? 0 : k.vel.x * k.rightX + k.vel.z * k.rightZ;
  }

  // Tiro verso la porta: dove e quando attraversa la linea.
  crossing() {
    const m = this.m, b = m.ball;
    const toward = -this.dir;
    if (b.vel.x * toward < 3) return null;
    const path = b.predict(this.path, 1 / 60, 2);
    for (const s of path) {
      if (s.x * toward >= HL - 0.3) {
        if (Math.abs(s.z) < GOAL_HW + 1.2 && s.y < GOAL.height + 0.6) return s;
        return null;
      }
    }
    return null;
  }

  // PARATA: sceglie il gesto per altezza e distanza laterale, lo accelera se
  // serve e ne scala lo spostamento per arrivare sulla palla.
  save() {
    const m = this.m, k = this.p, poss = m.poss;
    if (!poss.flying || poss.team === this.side) { this.watch = null; return false; }
    if (this.watch === poss.seq) return false;
    const s = this.crossing();
    if (!s) return false;
    this.watch = poss.seq;
    const react = lerp(KEEPER.react[0], KEEPER.react[1], this.skill);
    const avail = s.t - react;
    // distanza laterale nel riferimento del portiere (che guarda il campo)
    const rx = k.rightX, rz = k.rightZ;
    const lat = (s.x - k.pos.x) * rx + (s.z - k.pos.z) * rz;
    const al = Math.abs(lat), side = lat > 0 ? 'right' : 'left';
    let C, handReach;
    if (al < 0.7) { C = s.y > 1.75 ? KEEPER.clips.high : KEEPER.clips.catch; handReach = 0.5; }
    else if (al < 1.7 && s.y < 1.0) { C = KEEPER.clips.block; handReach = 0.9; }
    else { C = KEEPER.clips.dive; handReach = 1.2; }
    const clip = C.clip.endsWith('_') ? C.clip + side : C.clip;
    const natural = C.contact - C.from;
    // Con tempo in avanzo si aspetta fermi; senza, il gesto accelera e parte piu' avanti.
    const wait = Math.max(0, avail - natural);
    const rate = clamp(natural / Math.max(0.1, avail), 1, 1.9);
    const from = wait > 0 ? C.from : Math.max(0, C.contact - Math.max(0.1, avail) * rate);
    // spostamento della radice fra l'inizio e il contatto
    const r0 = rootAt(m.tpl, clip, from), r1 = rootAt(m.tpl, clip, C.contact);
    const L0 = Math.abs(r1.s - r0.s);
    const reach = lerp(KEEPER.reach[0], KEEPER.reach[1], this.attr);
    const need = Math.max(0, al - handReach);
    const scaleS = L0 > 0.2 ? clamp(need / L0, 0.2, 1.5) : 1;
    const speed = Math.hypot(m.ball.vel.x, m.ball.vel.y, m.ball.vel.z);
    let chance = lerp(KEEPER.save[0], KEEPER.save[1], this.skill) * (1 - 0.45 * (al / reach) ** 2) * (1 - Math.max(0, speed - 24) / 30);
    if (al > reach || avail < 0.05) chance = 0;
    const catchIt = speed < KEEPER.catchSpeed && C !== KEEPER.clips.dive && C !== KEEPER.clips.block;
    this.pending = {
      wait, seq: poss.seq,
      args: [k, clip, from, C.contact, Math.min(C.end, clipDuration(m.tpl, clip)), rate, { save: Math.random() < chance, catchIt, scaleS, scaleA: 0.35 }]
    };
    k.aiState = 'PARATA';
    return true;
  }

  // Parata decisa: fermo sulle gambe fino al momento del tuffo.
  waitSave(dt) {
    const m = this.m, k = this.p, s = this.pending;
    if (s.seq !== m.poss.seq) { this.pending = null; return false; }
    if ((s.wait -= dt) > 0) {
      k.drive(dt, 0, 0, 0, { face: { x: m.ball.pos.x - k.pos.x, z: m.ball.pos.z - k.pos.z } });
      return true;
    }
    this.pending = null;
    m.startKeeperGesture(...s.args);
    return true;
  }

  // Cross che cade vicino alla porta: esce e lo prende alto.
  claim(dt) {
    const m = this.m, k = this.p, poss = m.poss;
    if (!poss.flying || poss.team === this.side || !/cross|lancio/.test(poss.kind || '')) return false;
    const path = m.ball.predict(this.path, 1 / 30, 3);
    const gx = this.goalX;
    let prevY = m.ball.pos.y;
    for (const s of path) {
      const falling = s.y < prevY;
      prevY = s.y;
      if (s.y > 2.3 || !falling) continue;
      if (Math.abs(s.x - gx) > KEEPER.claimDist || Math.abs(s.z) > 9) return false;
      const d = Math.hypot(s.x - k.pos.x, s.z - k.pos.z);
      const C = KEEPER.clips.high;
      if (s.t <= C.contact - C.from + 0.02 && d < 1.2) {
        m.startKeeperGesture(k, C.clip, C.from, C.contact, C.end, 1, { save: true, catchIt: true, scaleS: 0, scaleA: 0 });
        k.aiState = 'USCITA';
        return true;
      }
      // Troppo lontano per arrivarci camminando: presa in corsa e in salto di lato.
      const R = KEEPER.clips.claim;
      if (s.t <= R.contact - R.from + 0.02 && d >= 1.2 && d < 4.5) {
        const lat = (s.x - k.pos.x) * k.rightX + (s.z - k.pos.z) * k.rightZ;
        const clip = R.clip + (lat > 0 ? 'right' : 'left');
        const r0 = rootAt(m.tpl, clip, R.from), r1 = rootAt(m.tpl, clip, R.contact);
        const fwd = (s.x - k.pos.x) * k.dirX + (s.z - k.pos.z) * k.dirZ;
        const la = Math.abs(r1.a - r0.a) || 1, ls = Math.abs(r1.s - r0.s) || 1;
        m.startKeeperGesture(k, clip, R.from, R.contact, R.end, 1,
          { save: true, catchIt: true, scaleA: clamp(fwd / la, 0, 1.5), scaleS: clamp(Math.abs(lat) / ls, 0, 3) });
        k.aiState = 'USCITA';
        return true;
      }
      k.aiState = 'USCITA';
      this.moveTo(dt, s.x, s.z, true);
      return true;
    }
    return false;
  }

  // Palla libera o lunga in area: esce se ci arriva prima degli attaccanti.
  rush(dt) {
    const m = this.m, k = this.p, poss = m.poss, b = m.ball;
    if (!(poss.free || (poss.flying && poss.team !== this.side && poss.kind !== 'tiro'))) return false;
    if (Math.abs(b.pos.x - this.goalX) > KEEPER.rushDist || Math.abs(b.pos.z) > 20 || b.pos.y > 1.2) return false;
    const mine = m.interceptPoint(k, false);
    if (!mine) return false;
    for (const o of m.teams[this.side === 'home' ? 'away' : 'home'].players) {
      const s = m.interceptPoint(o, false);
      if (s && s.t < mine.t - 0.2) return false;
    }
    k.aiState = 'USCITA';
    const d = Math.hypot(b.pos.x - k.pos.x, b.pos.z - k.pos.z);
    if (d < 1.4 && Math.hypot(b.vel.x, b.vel.z) < 12) {
      const C = KEEPER.clips.scoop;
      const side = (b.pos.x - k.pos.x) * k.rightX + (b.pos.z - k.pos.z) * k.rightZ > 0 ? 'right' : 'left';
      m.startKeeperGesture(k, C.clip + side, C.contact - 0.15, C.contact, C.end, 1, { save: true, catchIt: true, scaleS: 0.3, scaleA: 0.3, pickup: true });
      return true;
    }
    this.moveTo(dt, mine.x, mine.z, true);
    return true;
  }

  // RINVIO: con la palla in mano aspetta, poi la lancia a un compagno libero
  // vicino o calcia al volo lontano. Con la palla al piede la passa.
  distribute(dt) {
    const m = this.m, k = this.p;
    k.aiState = 'RINVIO';
    k.drive(dt, 0, 0, 0, { face: { x: this.dir, z: 0 } });
    this.hold += dt;
    if (this.hold < (k.holding ? KEEPER.holdTime : 0.6)) return;
    this.hold = 0;
    const mates = m.teams[this.side].players.filter((q) => q !== k && !q.down);
    const opp = m.teams[this.side === 'home' ? 'away' : 'home'].players;
    let near = null, nd = Infinity;
    for (const q of mates) {
      const d = Math.hypot(q.pos.x - k.pos.x, q.pos.z - k.pos.z);
      if (d < KEEPER.throwMax && freeness(q.pos.x, q.pos.z, opp) > 0.6 && d < nd) { nd = d; near = q; }
    }
    if (!k.holding) {
      const dx = near ? near.pos.x - k.pos.x : this.dir, dz = near ? near.pos.z - k.pos.z : 0, l = Math.hypot(dx, dz) || 1;
      m.startKick(k, near ? 'pass' : 'cross', near ? 0.2 : 0.8, { mag: 1, x: dx / l, z: dz / l });
      return;
    }
    if (near) {
      m.startKeeperGesture(k, KEEPER.clips.throw.clip, KEEPER.clips.throw.from, KEEPER.clips.throw.contact, KEEPER.clips.throw.end, 1,
        { release: 'throw', target: near, scaleS: 0, scaleA: 0.4 });
    } else {
      let far = null, fa = -Infinity;
      for (const q of mates) {
        const a = q.pos.x * this.dir;
        if (a > fa && a < 15) { fa = a; far = q; }
      }
      m.startKeeperGesture(k, KEEPER.clips.dropkick.clip, KEEPER.clips.dropkick.from, KEEPER.clips.dropkick.contact, KEEPER.clips.dropkick.end, 1,
        { release: 'kick', target: far, scaleS: 0, scaleA: 0.5 });
    }
  }

  // Dopo il gol: si dispera, finito l'eventuale tuffo.
  concede() {
    const k = this.p, C = KEEPER.clips.concede;
    const play = () => k.avatar.playOnce(C.clip, C.from, C.end);
    if (!k.action) { play(); return; }
    const prev = k.action.onEnd;
    k.action.onEnd = () => { if (prev) prev(); play(); };
  }
}

export const HELD_Y = BALL.radius + 0.95;   // palla in mano, se le ossa non sono ancora disegnate
