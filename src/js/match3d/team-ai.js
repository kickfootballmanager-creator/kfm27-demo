import { SHAPE, AI, PITCH, GOAL, CROSS, RULES, PRESS, TACKLE } from './config.js';
import { freeness } from './player.js';
import { autoTackle, aiPressState } from './defense.js';

// IA di squadra. Decide a AI.hz volte al secondo; il movimento (steer) va a 60 Hz.
// Stati individuali: SUPPORTO, INSERIMENTO, PORTATORE, PRESSING, MARCATURA, RIENTRO.
// Il portiere ha la sua IA (keeper.js), il giocatore dell'utente la ignora.

const HL = PITCH.length / 2;
const HW = PITCH.width / 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);

// Distanza di un punto da un segmento, nel piano del campo.
function segDist(px, pz, ax, az, bx, bz) {
  const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1;
  const t = clamp(((px - ax) * dx + (pz - az) * dz) / l2, 0, 1);
  return Math.hypot(px - (ax + dx * t), pz - (az + dz * t));
}

export class TeamAI {
  constructor(match, side, players, difficulty) {
    this.m = match;
    this.side = side;
    this.players = players;
    this.skill = difficulty;
    this.acc = Math.random() / AI.hz;
    this.runTimer = rand(...AI.run.every);
    this.runners = new Set();
    // Precisione della squadra secondo la difficolta'.
    const err = lerp(AI.carrier.error[0], AI.carrier.error[1], difficulty);
    for (const p of players) { p.params.passError *= err; p.params.shotError *= err; p.aiState = 'SUPPORTO'; p.aiTarget = { x: p.pos.x, z: p.pos.z }; }
  }

  get dir() { return this.m.dirOf(this.side); }
  get opponents() { return this.m.teams[this.side === 'home' ? 'away' : 'home'].players; }

  // Da coordinate d'attacco (a avanti, s a destra) al campo.
  world(a, s) { const d = this.dir; return { x: d * a, z: d * s }; }
  rel(x, z) { const d = this.dir; return { a: d * x, s: d * z }; }

  update(dt) {
    this.acc += dt;
    this.runTimer -= dt;
    if (this.acc >= 1 / AI.hz) { this.think(this.acc); this.acc = 0; }
  }

  // Controllo del gioco: chi ha la palla, chi la aspetta.
  phase() {
    const poss = this.m.poss;
    if (poss.owned) return poss.owner.team === this.side ? 'attack' : 'defend';
    if (poss.flying && poss.team) return poss.team === this.side ? 'attack' : 'defend';
    return 'loose';
  }

  // Posizione del modulo per il giocatore, dato il blocco della squadra.
  shapeTarget(p, block) {
    const ball = this.rel(this.m.ball.pos.x, this.m.ball.pos.z);
    const depth = (SHAPE.defY - p.slot.y) / (SHAPE.defY - SHAPE.attY);
    const a = clamp(block.line + depth * block.len, -HL + 3, HL - 3);
    const s = clamp((p.slot.x - 50) / 50 * block.width + ball.s * (block.ballZ || 0), -SHAPE.maxZ, SHAPE.maxZ);
    return this.world(a, s);
  }

  block(phase) {
    const b = this.rel(this.m.ball.pos.x, this.m.ball.pos.z);
    if (this.m.phase === 'kickoff') { const k = SHAPE.kickoff; return { line: k.line, len: k.len, width: k.width, ballZ: 0 }; }
    if (phase === 'attack') {
      const A = SHAPE.attack;
      return { line: clamp(b.a + A.lineOffset, A.lineMin, A.lineMax), len: A.len, width: A.width, ballZ: A.ballZ };
    }
    const D = SHAPE.defend;
    return { line: clamp(b.a * D.lineScale + D.lineOffset, D.lineMin, D.lineMax), len: D.len, width: D.width, ballZ: D.ballZ };
  }

  // Giocatori che l'IA muove: non il portiere, non chi comanda l'utente,
  // non chi e' a terra o dentro un gesto.
  free(p) { return !p.keeper && p !== this.m.ctrl && !p.down && !p.action; }

  think(dt) {
    const m = this.m, phase = this.phase();
    const block = this.block(phase);
    const field = this.players.filter((p) => !p.keeper);
    for (const p of field) { p.aiTarget = this.shapeTarget(p, block); p.aiState = 'SUPPORTO'; p.aiSprint = false; p.aiFace = null; }

    // Alle riprese degli avversari si sta a RULES.wall metri dalla palla.
    if (m.phase === 'restart' && m.rules.set && m.rules.set.side !== this.side) {
      const s = m.rules.set.spot;
      for (const p of field) {
        const dx = p.aiTarget.x - s.x, dz = p.aiTarget.z - s.z, d = Math.hypot(dx, dz);
        if (d < RULES.wall) { const k = RULES.wall / Math.max(d, 0.1); p.aiTarget = { x: s.x + dx * k, z: clamp(s.z + dz * k, -HW + 1, HW - 1) }; }
      }
    }
    if (m.phase !== 'play') return;
    if (phase === 'attack') this.attack(field, dt);
    else if (phase === 'defend') this.defend(field, dt);
    else this.loose(field);
  }

  // --- in possesso
  attack(field, dt) {
    const m = this.m, carrier = m.owner && m.owner.team === this.side ? m.owner : null;
    const ball = this.rel(m.ball.pos.x, m.ball.pos.z);
    const opp = this.opponents;
    // Linea dell'ultimo difensore avversario: gli inserimenti vanno oltre.
    let last = -HL;
    for (const o of opp) if (!o.keeper) last = Math.max(last, this.rel(o.pos.x, o.pos.z).a);

    if (this.runTimer <= 0) {
      this.runTimer = rand(...AI.run.every);
      this.runners.clear();
      if (carrier && ball.a > -15) {
        const cand = field.filter((p) => p !== carrier && this.free(p) && p.slot.y < 50)
          .sort(() => Math.random() - 0.5).slice(0, 1 + (Math.random() < 0.35 ? 1 : 0));
        for (const p of cand) this.runners.add(p);
      }
    }
    for (const p of field) {
      if (p === carrier || !this.free(p)) continue;
      if (this.runners.has(p)) {
        const s = clamp(this.rel(p.aiTarget.x, p.aiTarget.z).s * 0.7, -HW + 4, HW - 4);
        p.aiTarget = this.world(clamp(Math.max(last + 5, ball.a + AI.run.depth), -HL + 10, HL - 7), s);
        p.aiState = 'INSERIMENTO';
        p.aiSprint = true;
      } else if (carrier) {
        p.aiTarget = this.openSpace(p, p.aiTarget, carrier);
      }
    }
    if (carrier && carrier !== m.ctrl && !carrier.keeper) this.carrierThink(carrier, dt);
  }

  // Il punto vicino alla posizione del modulo piu' lontano dagli avversari e
  // con la linea di passaggio dal portatore libera.
  openSpace(p, home, carrier) {
    const S = AI.space, opp = this.opponents;
    let best = home, bestScore = Infinity;
    for (let i = -1; i < S.samples; i++) {
      const ang = (i / S.samples) * Math.PI * 2;
      const x = i < 0 ? home.x : home.x + Math.cos(ang) * S.radius;
      const z = i < 0 ? home.z : clamp(home.z + Math.sin(ang) * S.radius, -HW + 1, HW - 1);
      let near = Infinity, lane = Infinity;
      for (const o of opp) {
        near = Math.min(near, Math.hypot(o.pos.x - x, o.pos.z - z));
        lane = Math.min(lane, segDist(o.pos.x, o.pos.z, carrier.pos.x, carrier.pos.z, x, z));
      }
      const score = S.wOpp * Math.max(0, 6 - near) + S.wLane * Math.max(0, 3 - lane) + S.wHome * Math.hypot(x - home.x, z - home.z);
      if (score < bestScore - 0.3) { bestScore = score; best = { x, z }; }
    }
    return best;
  }

  // Sotto contrasto: il passaggio migliore subito, con il piede quasi sulla palla.
  passNow(p) {
    if (!p.action && this.m.owner === p) this.carrierThink(p, 0, true);
  }

  // --- portatore IA: tiro, passaggio, filtrante, cross o dribbling.
  // `passOnly`: sta arrivando un contrasto, conta solo liberarsi della palla.
  carrierThink(p, dt, passOnly = false) {
    const m = this.m, C = AI.carrier;
    p.aiState = 'PORTATORE';
    p.thinkT = (p.thinkT || 0) - dt;
    if ((p.thinkT > 0 && !passOnly) || p.action) return;

    const d = this.dir, opp = this.opponents;
    const me = this.rel(p.pos.x, p.pos.z);
    let press = Infinity;
    for (const o of opp) press = Math.min(press, Math.hypot(o.pos.x - p.pos.x, o.pos.z - p.pos.z));
    const pressed = press < C.pressedAt;
    // sotto pressione si decide piu' in fretta e, a volte, si protegge la palla
    p.thinkT = lerp(C.think[0], C.think[1], this.skill) * rand(0.7, 1.3) * (pressed ? C.pressedThink : 1);
    p.protecting = pressed && Math.random() < lerp(C.protect.chance[0], C.protect.chance[1], this.skill);
    const goalDist = Math.hypot(HL - me.a, me.s);
    const noise = () => (Math.random() - 0.5) * 0.35 * (1.2 - this.skill);
    const options = [];

    // Tiro: vicino, con la porta visibile.
    if (goalDist < C.shootDist && me.a > 10 && !passOnly) {
      const open = this.shotOpen(p);
      if (open > C.shootMinOpen) options.push({ kind: 'shot', score: 1.3 * (1 - goalDist / C.shootDist) + 0.6 * open + (goalDist < 16 ? 0.35 : 0) + noise() });
    }
    // Passaggi e filtranti.
    for (const q of this.players) {
      if (q === p || q.down || (q.keeper && !pressed)) continue;
      const dist = Math.hypot(q.pos.x - p.pos.x, q.pos.z - p.pos.z);
      if (dist < 5 || dist > 42) continue;
      let lane = Infinity;
      for (const o of opp) lane = Math.min(lane, segDist(o.pos.x, o.pos.z, p.pos.x, p.pos.z, q.pos.x, q.pos.z));
      const risk = lane < C.laneSafe ? (C.laneSafe - lane) / C.laneSafe : 0;
      const gain = this.rel(q.pos.x, q.pos.z).a - me.a;
      const free = freeness(q.pos.x, q.pos.z, opp);
      const base = gain * C.passProgress + 0.6 * free - 0.9 * risk - dist * 0.006 + (pressed ? 0.25 : 0);
      options.push({ kind: 'pass', to: q, score: base + noise() });
      if (q.aiState === 'INSERIMENTO' && gain > 4) options.push({ kind: 'through', to: q, score: base + 0.35 + noise() });
    }
    // Cross dalla fascia se in area c'e' qualcuno.
    if (Math.abs(p.pos.z) > CROSS.wingZ && me.a > CROSS.finalThird && !passOnly) {
      let inBox = 0;
      for (const q of this.players) { const r = this.rel(q.pos.x, q.pos.z); if (q !== p && r.a > HL - 18 && Math.abs(r.s) < 16) inBox++; }
      if (inBox) options.push({ kind: 'cross', score: C.crossChance * (0.5 + 0.25 * inBox) + noise() });
    }
    // Dribbling verso la porta, se c'e' spazio.
    const ahead = freeness(p.pos.x + d * 7, p.pos.z, opp);
    if (!passOnly) options.push({ kind: 'dribble', score: 0.45 * ahead + (pressed ? -0.3 : 0.25) + noise() });
    if (!options.length) return;

    options.sort((a, b) => b.score - a.score);
    const pick = options[0];
    if (pick.kind === 'dribble') {
      p.dribbleDir = this.dribbleDir(p);
      if (pressed && press < 2.6 && Math.random() < C.feintChance) m.startFeint(p, null);
      return;
    }
    let dx, dz;
    if (pick.to) { dx = pick.to.pos.x - p.pos.x; dz = pick.to.pos.z - p.pos.z; }
    else if (pick.kind === 'shot') { dx = d * HL - p.pos.x; dz = (Math.random() < 0.5 ? -1 : 1) * GOAL.width * 0.3 - p.pos.z; }
    else { dx = d; dz = 0; }
    const l = Math.hypot(dx, dz) || 1;
    // Potenza come la darebbe un giocatore: il tiro fra meta' e la tacca,
    // il cross verso un palo a caso, il passaggio in base alla distanza.
    const power = pick.kind === 'shot' ? rand(0.5, 0.84) : pick.kind === 'cross' ? rand(0.1, 0.95) : Math.min(1, Math.hypot(dx, dz) / 45);
    m.startKick(p, pick.kind, power, { mag: 1, x: dx / l, z: dz / l, to: pick.to, quick: passOnly });
  }

  // Quanto e' libera la porta: 1 nessuno fra il portatore e i pali.
  shotOpen(p) {
    const d = this.dir, gx = d * HL;
    let blocked = 0;
    for (const o of this.opponents) {
      if (o.keeper) continue;
      if (segDist(o.pos.x, o.pos.z, p.pos.x, p.pos.z, gx, 0) < 1.2) blocked++;
    }
    return 1 / (1 + blocked);
  }

  // Verso la porta, piegando lontano dall'avversario piu' vicino davanti.
  dribbleDir(p) {
    const d = this.dir;
    // gli esterni restano larghi per crossare, gli altri stringono verso la porta
    const wide = Math.abs(p.slot.x - 50) > 25;
    let x = d, z = wide ? 0 : -p.pos.z * 0.02;
    for (const o of this.opponents) {
      const dx = o.pos.x - p.pos.x, dz = o.pos.z - p.pos.z, dist = Math.hypot(dx, dz);
      if (dist > 7 || dist < 0.01) continue;
      const w = (7 - dist) / 7;
      x -= dx / dist * w * 0.8;
      z -= dz / dist * w * 1.2;
    }
    const l = Math.hypot(x, z) || 1;
    return { x: x / l, z: z / l };
  }

  // --- senza palla
  defend(field, dt) {
    const m = this.m, ball = m.ball;
    const own = this.rel(ball.pos.x, ball.pos.z);
    const carrier = m.owner && m.owner.team !== this.side ? m.owner : null;
    const target = carrier || null;
    const avail = field.filter((p) => this.free(p));

    // Pallone avversario in volo: chi puo' arrivarci prima lo intercetta.
    if (m.poss.flying && m.poss.team !== this.side) {
      const best = this.bestInterceptor(avail);
      if (best) {
        best.p.aiTarget = { x: best.s.x, z: best.s.z };
        best.p.aiState = 'PRESSING';
        best.p.aiSprint = true;
      }
    }

    // Pressing: uno (due nel proprio terzo) sul portatore.
    const max = own.a < -HL / 3 ? AI.press.maxOwnThird : AI.press.max;
    const userNear = m.ctrl && m.ctrl.team === this.side && target && Math.hypot(m.ctrl.pos.x - target.pos.x, m.ctrl.pos.z - target.pos.z) < 8;
    const pressers = [];
    if (target) {
      const n = userNear ? max - 1 : max;
      const sorted = avail.filter((p) => p.aiState !== 'PRESSING').sort((a, b) => dist2(a, target) - dist2(b, target));
      for (const p of sorted.slice(0, n)) pressers.push(p);
      for (const p of pressers) this.press(p, target, dt);
    }
    // chi non pressa piu' ricomincia da zero la marcatura stretta
    for (const p of field) if (p.press && !pressers.includes(p)) p.press.engaged = 0;

    // Marcatura a uomo nella zona, uno contro uno; chi e' avanti alla palla rientra.
    const goal = this.world(-HL, 0);
    const taken = new Set();
    const markers = avail.filter((p) => !pressers.includes(p) && p.aiState !== 'PRESSING')
      .sort((a, b) => a.slot.y > b.slot.y ? -1 : 1);
    for (const p of markers) {
      const home = p.aiTarget;
      let best = null, bd = AI.mark.radius;
      for (const o of this.opponents) {
        if (o.keeper || o === carrier || taken.has(o)) continue;
        const dd = Math.hypot(o.pos.x - home.x, o.pos.z - home.z);
        if (dd < bd) { bd = dd; best = o; }
      }
      if (best) {
        taken.add(best);
        const gx = goal.x - best.pos.x, gz = goal.z - best.pos.z, gl = Math.hypot(gx, gz) || 1;
        p.aiTarget = { x: best.pos.x + gx / gl * AI.mark.goalSide, z: best.pos.z + gz / gl * AI.mark.goalSide };
        p.aiState = 'MARCATURA';
      }
      const me = this.rel(p.pos.x, p.pos.z);
      if (me.a > own.a + 4 && Math.hypot(p.aiTarget.x - p.pos.x, p.aiTarget.z - p.pos.z) > AI.back.dist) {
        p.aiState = 'RIENTRO';
        p.aiSprint = true;
      }
    }
  }

  // Sul portatore: si chiude la strada verso la porta, poi il contrasto parte
  // da solo come per l'utente (defense.autoTackle), con riflessi e cadenza
  // decisi dalla difficolta'.
  press(p, carrier, dt) {
    const m = this.m;
    const goal = this.world(-HL, 0);
    const gx = goal.x - carrier.pos.x, gz = goal.z - carrier.pos.z, gl = Math.hypot(gx, gz) || 1;
    p.aiTarget = { x: carrier.pos.x + gx / gl * AI.press.contain, z: carrier.pos.z + gz / gl * AI.press.contain };
    p.aiState = 'PRESSING';
    p.aiSprint = true;
    p.aiFace = { x: m.ball.pos.x - p.pos.x, z: m.ball.pos.z - p.pos.z };

    // la reazione comincia prima se il portatore arriva di corsa
    const bx = m.ball.pos.x - p.pos.x, bz = m.ball.pos.z - p.pos.z, bd = Math.hypot(bx, bz) || 1;
    const closing = Math.max(0, -((m.ball.vel.x - p.vel.x) * bx + (m.ball.vel.z - p.vel.z) * bz) / bd);
    const react = lerp(AI.press.delay[0], AI.press.delay[1], this.skill);
    const s = aiPressState(p, carrier);
    s.engaged = bd < PRESS.engage + closing * (react + TACKLE.contact) ? s.engaged + dt : 0;
    // il contrasto automatico si controlla a 60 Hz in steer: da vicino le
    // distanze cambiano troppo in fretta per le decisioni a 10 Hz
    s.react = react;
    s.pace = lerp(AI.tackleRate[0], AI.tackleRate[1], this.skill);
    if (p.action || carrier.keeper || carrier.holding) return;
    // Scivolata: da dietro o di lato, quando il portatore scappa.
    const cv = Math.hypot(carrier.vel.x, carrier.vel.z);
    if (bd > 1.8 && bd < 3.6 && cv > 4 && Math.random() < lerp(AI.slideChance[0], AI.slideChance[1], this.skill) * dt) {
      m.startSlide(p, m.ball.pos.x + carrier.vel.x * 0.25 - p.pos.x, m.ball.pos.z + carrier.vel.z * 0.25 - p.pos.z);
    }
  }

  bestInterceptor(avail) {
    const m = this.m;
    let best = null;
    for (const p of avail) {
      const s = m.interceptPoint(p, true);
      if (!s) continue;
      if (!best || s.t < best.s.t) best = { p, s };
    }
    return best;
  }

  // --- palla libera: il piu' veloce ad arrivarci ci va, gli altri tengono la posizione
  loose(field) {
    const m = this.m;
    let best = null, bt = Infinity;
    for (const p of field) {
      if (!this.free(p)) continue;
      const s = m.interceptPoint(p, false);
      if (s && s.t < bt) { bt = s.t; best = { p, s }; }
    }
    if (best) {
      best.p.aiTarget = { x: best.s.x, z: best.s.z };
      best.p.aiState = 'PRESSING';
      best.p.aiSprint = true;
    }
  }

  // Un passo di movimento verso l'obiettivo deciso dall'IA.
  steer(dt, p) {
    const m = this.m;
    if (p.aiState === 'PORTATORE' && m.owner === p) {
      const dd = p.dribbleDir || { x: this.dir, z: 0 };
      // protezione: con un difensore addosso la palla va sul lato lontano da
      // lui e il portatore gli gira le spalle a passo corto
      const P = AI.carrier.protect;
      let near = null, nd = P.dist;
      for (const o of this.opponents) { const d = Math.hypot(o.pos.x - p.pos.x, o.pos.z - p.pos.z); if (!o.keeper && d < nd) { nd = d; near = o; } }
      if (near && p.protecting && !p.burst) {
        const ax = p.pos.x - near.pos.x, az = p.pos.z - near.pos.z, al = Math.hypot(ax, az) || 1;
        p.shield = (near.pos.x - p.pos.x) * p.rightX + (near.pos.z - p.pos.z) * p.rightZ > 0 ? -1 : 1;
        p.drive(dt, ax / al * 0.6 + dd.x * 0.4, az / al * 0.6 + dd.z * 0.4, P.mag, { withBall: true });
        return;
      }
      p.shield = 0;
      const space = freeness(p.pos.x + dd.x * 6, p.pos.z + dd.z * 6, this.opponents);
      p.drive(dt, dd.x, dd.z, 1, { withBall: true, sprint: space > 0.7 || p.burst > 0 });
      return;
    }
    const car = m.owner;
    if (p.aiState === 'PRESSING' && car && car.team !== p.team && p.press && p.press.car === car && p.press.react !== undefined &&
      !car.keeper && !car.holding && autoTackle(m, p, p.press, p.press.react, p.press.pace)) return;
    const t = p.aiTarget;
    const dx = t.x - p.pos.x, dz = t.z - p.pos.z, d = Math.hypot(dx, dz);
    const bx = m.ball.pos.x - p.pos.x, bz = m.ball.pos.z - p.pos.z;
    const face = p.aiFace || (d < 4 ? { x: bx, z: bz } : null);
    if (d < 0.3) { p.drive(dt, 0, 0, 0, { face: { x: bx, z: bz } }); return; }
    const mag = Math.min(1, d / AI.arrive);
    p.drive(dt, dx, dz, mag, { sprint: p.aiSprint || d > AI.sprintDist, face });
  }

  summary() {
    const n = {};
    for (const p of this.players) n[p.aiState] = (n[p.aiState] || 0) + 1;
    return this.side + ' ' + Object.entries(n).map(([k, v]) => k + ' ' + v).join(', ');
  }
}

function dist2(a, b) { const dx = a.pos.x - b.pos.x, dz = a.pos.z - b.pos.z; return dx * dx + dz * dz; }
