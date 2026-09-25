import { SHAPE, AI, PITCH, GOAL, CROSS, RULES, PRESS, TACKLE } from './config.js';
import { freeness } from './player.js';
import { autoTackle, aiPressState, tackleWorth, slideWorth, rashRate, approach } from './defense.js';

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
    return { line: clamp(Math.min(b.a * D.lineScale + D.lineOffset, b.a - D.behindBall), D.lineMin, D.lineMax), len: D.len, width: D.width, ballZ: D.ballZ };
  }

  // Giocatori che l'IA muove: non il portiere, non chi comanda l'utente,
  // non chi e' a terra o dentro un gesto.
  // Il giocatore dell'utente lo muove l'IA alle riprese avversarie e quando
  // difende senza toccare i comandi (main.ctrlAuto).
  free(p) { return !p.keeper && (p !== this.m.ctrl || this.m.opponentsSetPiece() || this.m.ctrlAuto) && !p.down && !p.action; }

  think(dt) {
    const m = this.m, phase = this.phase();
    const block = this.block(phase);
    const field = this.players.filter((p) => !p.keeper);
    for (const p of field) { p.aiTarget = this.shapeTarget(p, block); p.aiState = 'SUPPORTO'; p.aiSprint = false; p.aiFace = null; }

    // Alle riprese degli avversari si sta a RULES.wall metri dalla palla.
    const set = m.phase === 'restart' ? m.rules.set : null;
    if (set && set.side !== this.side) {
      const s = set.spot;
      for (const p of field) {
        const dx = p.aiTarget.x - s.x, dz = p.aiTarget.z - s.z, d = Math.hypot(dx, dz);
        if (d < RULES.wall) { const k = RULES.wall / Math.max(d, 0.1); p.aiTarget = { x: s.x + dx * k, z: clamp(s.z + dz * k, -HW + 1, HW - 1) }; }
      }
      if (set.type === 'freekick' && set.fk && set.fk.mode === 'direct') this.wall(field, s);
    }
    // rigore: tutti fuori dall'area e dalla lunetta, tranne chi tira
    if (set && set.type === 'penalty') {
      const d = m.dirOf(set.side), edge = HL - RULES.penalty.edge;
      for (const p of field) {
        if (p === set.taker) continue;
        if (p.aiTarget.x * d > edge) p.aiTarget = { x: d * edge, z: p.aiTarget.z };
        p.aiTarget.z = clamp(p.aiTarget.z, -18, 18);
      }
    }
    if (m.phase === 'play') {
      if (phase === 'attack') this.attack(field, dt);
      else if (phase === 'defend') this.defend(field, dt);
      else this.loose(field);
    }
    this.smooth(field);
  }

  // Il posto di zona, marcatura, copertura e sostegno cambia a scatti fra
  // una decisione e l'altra (un altro avversario da seguire, la palla che
  // passa di mano): lo si insegue con un filtro, cosi' nessuno inverte la
  // corsa di colpo. Chi pressa, va in barriera o si inserisce resta preciso.
  smooth(field) {
    const k = AI.targetSmooth;
    for (const p of field) {
      const t = p.aiTarget, prev = p.aiPrev;
      if (!/^(ZONA|MARCATURA|COPERTURA|SUPPORTO|RIENTRO)$/.test(p.aiState) || !prev || Math.hypot(prev.x - p.pos.x, prev.z - p.pos.z) > AI.targetReset) {
        p.aiPrev = { x: t.x, z: t.z };
        continue;
      }
      prev.x += (t.x - prev.x) * k;
      prev.z += (t.z - prev.z) * k;
      p.aiTarget = { x: prev.x, z: prev.z };
    }
  }

  // Barriera sulle punizioni dirette vicine alla propria porta: i piu' vicini
  // in fila a 9,15 m dalla palla, sulla linea verso il palo vicino.
  wall(field, s) {
    const m = this.m, W = AI.wall, goal = this.world(-HL, 0);
    const post = { x: goal.x, z: (Math.sign(s.z) || 1) * W.postAim };
    if (Math.hypot(goal.x - s.x, goal.z - s.z) > W.maxDist) return;
    const ux = post.x - s.x, uz = post.z - s.z, ul = Math.hypot(ux, uz) || 1;
    const cx = s.x + ux / ul * RULES.wall, cz = s.z + uz / ul * RULES.wall;
    const n = Math.min(field.length, m.setpieces.wallSize(s, this.dir));
    // gli uomini si scelgono una volta sola (i piu' vicini) e prendono il posto
    // nell'ordine in cui stanno da sinistra a destra: nessuno si scambia
    const set = m.rules.set;
    if (!set.wallMen || set.wallMen.some((p) => !this.free(p))) {
      set.wallMen = field.filter((p) => this.free(p)).sort((a, b) => dist2(a, { pos: { x: cx, z: cz } }) - dist2(b, { pos: { x: cx, z: cz } })).slice(0, n);
    }
    const lx = -uz / ul, lz = ux / ul;
    const men = [...set.wallMen].sort((a, b) => (a.pos.x * lx + a.pos.z * lz) - (b.pos.x * lx + b.pos.z * lz));
    men.forEach((p, i) => {
      const off = (i - (n - 1) / 2) * W.gap;
      p.aiTarget = { x: cx - uz / ul * off, z: cz + ux / ul * off };
      p.aiState = 'BARRIERA';
      p.aiFace = { x: s.x - p.aiTarget.x, z: s.z - p.aiTarget.z };
    });
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
    // Fuorigioco: senza palla si resta in linea col penultimo difensore (o
    // con la palla se e' piu' avanti); lo spazio oltre lo attacca il filtrante.
    const defs = opp.map((o) => this.rel(o.pos.x, o.pos.z).a).sort((a, b) => b - a);
    const onside = RULES.offside ? Math.max(defs.length > 1 ? defs[1] : HL, ball.a) - AI.run.onside : HL;
    for (const p of field) {
      if (p === carrier || !this.free(p)) continue;
      if (this.runners.has(p)) this.runner(p, carrier, onside, Math.max(last, ball.a), dt);
      else {
        p.run = null;
        if (carrier) p.aiTarget = this.openSpace(p, p.aiTarget, carrier);
      }
      const r = this.rel(p.aiTarget.x, p.aiTarget.z);
      if (r.a > onside && !(p.run && p.run.go)) p.aiTarget = this.world(onside, r.s);
    }
    if (carrier && carrier !== m.ctrl && !carrier.keeper) this.carrierThink(carrier, dt);
  }

  // Inserimento a tempo: in attesa sulla linea del fuorigioco (un po' dietro,
  // per restare in gioco quando parte), poi di scatto nello spazio oltre la
  // difesa. `line`: la linea da attaccare (ultimo difensore o palla).
  runner(p, carrier, onside, line, dt) {
    const m = this.m, R = AI.run;
    const run = p.run || (p.run = { go: false, t: 0, wait: rand(...R.wait) });
    run.t += dt;
    const s = clamp(this.rel(p.aiTarget.x, p.aiTarget.z).s * 0.7, -HW + 4, HW - 4);
    p.aiState = 'INSERIMENTO';
    if (!run.go) {
      p.aiTarget = this.world(clamp(onside - (R.hold - R.onside), -HL + 10, HL - 7), s);
      p.aiSprint = Math.hypot(p.aiTarget.x - p.pos.x, p.aiTarget.z - p.pos.z) > AI.sprintDist;
      // con la palla all'utente parte da solo, quando lui guarda avanti
      if (carrier && carrier === m.ctrl && run.t > run.wait && carrier.dirX * this.dir > 0.5) this.goRun(p);
      return;
    }
    p.aiTarget = this.world(clamp(line + R.depth, -HL + 10, HL - 7), s);
    p.aiSprint = true;
    // il pallone non e' arrivato: si torna in linea, pronti a ripartire
    if (run.t > R.goMax && m.receiver !== p) { run.go = false; run.t = 0; run.wait = rand(...R.wait); }
  }

  // Parte l'inserimento: adesso, cosi' al passaggio e' ancora in gioco.
  goRun(p) {
    if (!p.run) p.run = { go: false, t: 0, wait: 0 };
    p.run.go = true;
    p.run.t = 0;
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
    let last = -HL;
    for (const o of opp) if (!o.keeper) last = Math.max(last, this.rel(o.pos.x, o.pos.z).a);
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
      // filtrante a chi aspetta sulla linea: parte adesso e la palla va nello spazio dietro la difesa
      if (q.aiState === 'INSERIMENTO' && q.run && !q.run.go && gain > 0) {
        const space = HL - Math.max(last, this.rel(q.pos.x, q.pos.z).a);
        options.push({ kind: 'through', to: q, score: base + AI.run.bonus * (space > AI.run.space ? 1.5 : 1) + noise() });
      }
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
    if (pick.kind === 'through' && pick.to) this.goRun(pick.to);
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

  // --- senza palla. Come una squadra vera: blocco compatto, uno solo in
  // pressione sul portatore (temporeggia e chiude la strada), uno in
  // copertura dietro di lui, gli altri in zona sulle linee di passaggio;
  // vicino alla propria porta marcatura a uomo, lato porta.
  defend(field, dt) {
    const m = this.m, D = AI.defense;
    const own = this.rel(m.ball.pos.x, m.ball.pos.z);
    const carrier = m.owner && m.owner.team !== this.side ? m.owner : null;
    const avail = field.filter((p) => this.free(p));
    const busy = new Set();

    // Pallone avversario in volo: chi puo' arrivarci prima lo intercetta.
    if (m.poss.flying && m.poss.team !== this.side) {
      const best = this.bestInterceptor(avail);
      if (best) {
        best.p.aiTarget = { x: best.s.x, z: best.s.z };
        best.p.aiState = 'PRESSING';
        best.p.aiSprint = true;
        busy.add(best.p);
      }
    }

    const goal = this.world(-HL, 0);
    let presser = null, cover = null, chaser = null;
    if (carrier && !carrier.keeper) {
      // l'utente che pressa da vicino fa lui la pressione: l'IA copre soltanto
      const u = m.ctrl;
      const userPresses = u && u.team === this.side && !m.ctrlAuto && Math.hypot(u.pos.x - carrier.pos.x, u.pos.z - carrier.pos.z) < 8;
      const spot = this.containSpot(carrier);
      const cand = avail.filter((p) => !busy.has(p));
      if (!userPresses) {
        presser = this.keepOrPick(this.presser, cand, (p) => this.pressCost(p, carrier, spot), D.keep);
        if (presser) { this.press(presser, carrier, spot, dt); busy.add(presser); }
      }
      // chi e' stato saltato (era in pressione, ora e' dietro) lo rincorre
      const prev = this.chaser && this.chaser !== presser ? this.chaser : this.presser;
      if (prev && prev !== presser && cand.includes(prev) && !busy.has(prev) && approach(prev, carrier) !== 'front' &&
        Math.hypot(prev.pos.x - carrier.pos.x, prev.pos.z - carrier.pos.z) < D.chase) {
        chaser = prev;
        this.chase(chaser, carrier, dt);
        busy.add(chaser);
      }
      const lead = userPresses ? u : presser;
      // copertura: dietro chi pressa, sulla linea verso la porta, un po' verso il centro
      if (lead) {
        const gx = goal.x - lead.pos.x, gz = goal.z - lead.pos.z, gl = Math.hypot(gx, gz) || 1;
        const c = { x: lead.pos.x + gx / gl * D.cover, z: lead.pos.z + gz / gl * D.cover };
        c.z -= c.z * D.coverInside;
        cover = this.keepOrPick(this.cover, avail.filter((p) => !busy.has(p)), (p) => Math.hypot(p.pos.x - c.x, p.pos.z - c.z), D.keep);
        if (cover) {
          busy.add(cover);
          // raddoppio chiesto dall'utente (Quadrato tenuto): la copertura va anche lei sul portatore
          if (m.callPress && this.side === m.userSide) this.press(cover, carrier, spot, dt);
          else {
            cover.aiTarget = c;
            cover.aiState = 'COPERTURA';
            cover.aiSprint = Math.hypot(c.x - cover.pos.x, c.z - cover.pos.z) > AI.sprintDist;
            cover.aiFace = { x: m.ball.pos.x - cover.pos.x, z: m.ball.pos.z - cover.pos.z };
            // se il portatore ha saltato chi pressava, anche la copertura puo' scivolare
            if (!cover.action && slideWorth(m, cover, carrier) && Math.random() < lerp(AI.slide.chance[0], AI.slide.chance[1], this.skill) * dt) this.slide(cover, carrier);
          }
        }
      }
    }
    this.presser = presser;
    this.cover = cover;
    this.chaser = chaser;
    // chi non pressa piu' ricomincia da zero la marcatura stretta
    for (const p of field) if (p.press && p !== presser && p !== chaser && !(cover && p === cover && m.callPress)) p.press.engaged = 0;

    // Gli altri in zona: sulla linea di passaggio fra il portatore e
    // l'avversario libero piu' vicino al proprio posto; vicino alla porta
    // marcatura a uomo, lato porta. Chi e' avanti alla palla rientra.
    const taken = new Set();
    const zone = avail.filter((p) => !busy.has(p)).sort((a, b) => b.slot.y - a.slot.y);
    const L = D.lane;
    const carA = carrier ? this.rel(carrier.pos.x, carrier.pos.z).a : 0;
    for (const p of zone) {
      const home = p.aiTarget, homeA = this.rel(home.x, home.z).a;
      // linea difensiva: tiene la linea e marca lato porta chi le arriva addosso
      const backLine = (SHAPE.defY - p.slot.y) / (SHAPE.defY - SHAPE.attY) < D.backLine;
      let best = null, bd = L.radius;
      for (const o of this.opponents) {
        if (o.keeper || o === carrier || taken.has(o)) continue;
        // a centrocampo si chiudono solo i passaggi in avanti
        if (!backLine && carrier && this.rel(o.pos.x, o.pos.z).a > carA + 2) continue;
        const dd = Math.hypot(o.pos.x - home.x, o.pos.z - home.z);
        if (dd < bd) { bd = dd; best = o; }
      }
      if (best) {
        taken.add(best);
        const gx = goal.x - best.pos.x, gz = goal.z - best.pos.z, gl = Math.hypot(gx, gz) || 1;
        const oa = this.rel(best.pos.x, best.pos.z).a;
        if (gl < D.markZone || !carrier || (backLine && oa < homeA + D.lineMark)) {
          p.aiTarget = { x: best.pos.x + gx / gl * AI.mark.goalSide, z: best.pos.z + gz / gl * AI.mark.goalSide };
          p.aiState = 'MARCATURA';
        } else if (backLine) {
          // piu' avanti della linea: si resta sulla linea, spostati verso di lui
          p.aiTarget = { x: home.x, z: lerp(home.z, best.pos.z, D.lineShift) };
          p.aiState = 'ZONA';
        } else {
          // punto della linea portatore-avversario piu' vicino al proprio posto
          const lx = best.pos.x - carrier.pos.x, lz = best.pos.z - carrier.pos.z, l2 = lx * lx + lz * lz || 1;
          const t = clamp(((home.x - carrier.pos.x) * lx + (home.z - carrier.pos.z) * lz) / l2, L.t[0], L.t[1]);
          const qx = carrier.pos.x + lx * t, qz = carrier.pos.z + lz * t;
          p.aiTarget = { x: lerp(home.x, qx, L.pull), z: lerp(home.z, qz, L.pull) };
          p.aiState = 'ZONA';
        }
      }
      // chi e' piu' avanti della palla (o lontano dal suo posto) rientra di scatto
      const me = this.rel(p.pos.x, p.pos.z);
      const far = Math.hypot(p.aiTarget.x - p.pos.x, p.aiTarget.z - p.pos.z);
      if ((me.a > own.a - 2 && far > D.recover) || far > AI.back.dist) {
        p.aiState = 'RIENTRO';
        p.aiSprint = true;
      }
    }
  }

  // Chi era gia' in quel ruolo lo tiene finche' un altro non costa `keep` meno.
  keepOrPick(cur, cand, cost, keep) {
    let best = null, bc = Infinity;
    for (const p of cand) { const c = cost(p); if (c < bc) { bc = c; best = p; } }
    if (cur && cand.includes(cur) && cost(cur) <= bc + keep) return cur;
    return best;
  }

  // Dove si temporeggia: fra il portatore e la porta, spostati verso la sua
  // corsa (chiude la strada), a una distanza che scende con la difficolta'.
  containSpot(car) {
    const D = AI.defense, goal = this.world(-HL, 0);
    let gx = goal.x - car.pos.x, gz = goal.z - car.pos.z;
    const gl = Math.hypot(gx, gz) || 1;
    gx /= gl; gz /= gl;
    const cv = Math.hypot(car.vel.x, car.vel.z);
    if (cv > 1) { gx = gx * (1 - D.shade) + car.vel.x / cv * D.shade; gz = gz * (1 - D.shade) + car.vel.z / cv * D.shade; }
    const l = Math.hypot(gx, gz) || 1, r = lerp(D.contain[0], D.contain[1], this.skill);
    return { x: car.pos.x + gx / l * r, z: car.pos.z + gz / l * r, ux: gx / l, uz: gz / l };
  }

  // Costo per andare in pressione: distanza dal posto, di piu' per chi sta
  // dietro al portatore (dovrebbe rincorrerlo invece di chiudergli la strada).
  pressCost(p, car, spot) {
    const behind = (p.pos.x - car.pos.x) * spot.ux + (p.pos.z - car.pos.z) * spot.uz < -1 ? AI.defense.behindCost : 0;
    // un ammonito lascia volentieri la pressione a un compagno
    return Math.hypot(p.pos.x - spot.x, p.pos.z - spot.z) + behind + (p.yellows ? AI.defense.bookedCost : 0);
  }

  // In pressione: si corre al posto per temporeggiare, rivolti alla palla;
  // si stringe per il contrasto solo quando conviene (defense.tackleWorth),
  // e il contrasto parte da solo come per l'utente (defense.autoTackle).
  // La scivolata e' l'ultima risorsa (defense.slideWorth).
  press(p, carrier, spot, dt) {
    const m = this.m, b = m.ball;
    p.aiTarget = { x: spot.x, z: spot.z };
    p.aiState = 'PRESSING';
    p.aiSprint = Math.hypot(spot.x - p.pos.x, spot.z - p.pos.z) > AI.sprintDist * 0.5;
    p.aiFace = { x: b.pos.x - p.pos.x, z: b.pos.z - p.pos.z };

    // la reazione comincia prima se il portatore arriva di corsa
    const bx = b.pos.x - p.pos.x, bz = b.pos.z - p.pos.z, bd = Math.hypot(bx, bz) || 1;
    const closing = Math.max(0, -((b.vel.x - p.vel.x) * bx + (b.vel.z - p.vel.z) * bz) / bd);
    const react = lerp(AI.press.delay[0], AI.press.delay[1], this.skill);
    const s = aiPressState(p, carrier);
    s.engaged = bd < PRESS.engage + closing * (react + TACKLE.hit) ? s.engaged + dt : 0;
    // il contrasto automatico si controlla a 60 Hz in steer: da vicino le
    // distanze cambiano troppo in fretta per le decisioni a 10 Hz
    s.react = react;
    s.pace = lerp(AI.tackleRate[0], AI.tackleRate[1], this.skill);
    s.patience = lerp(AI.tackle.patience[0], AI.tackle.patience[1], this.skill);
    // si stringe quando il contrasto conviene, o quando il portatore protegge
    // la palla di spalle da troppo tempo (si entra lo stesso, rischiando il fallo)
    const impatient = s.engaged > s.patience && !p.yellows && approach(p, carrier) !== 'front';
    if (s.engaged >= react && (impatient || tackleWorth(m, p, carrier, s.engaged, s.patience))) {
      const ux = p.pos.x - b.pos.x, uz = p.pos.z - b.pos.z, ul = Math.hypot(ux, uz) || 1;
      p.aiTarget = { x: b.pos.x + ux / ul * AI.press.tight, z: b.pos.z + uz / ul * AI.press.tight };
    }
    if (p.action || carrier.keeper || carrier.holding) return;
    if (slideWorth(m, p, carrier) && Math.random() < lerp(AI.slide.chance[0], AI.slide.chance[1], this.skill) * dt) this.slide(p, carrier);
  }

  // Inseguimento di chi e' stato saltato: corre ad affiancare il portatore,
  // dove sara' fra un attimo; da vicino puo' entrare di lato o da dietro
  // (rischio di fallo, defense.rashRate) o, come ultima risorsa, scivolare.
  chase(p, car, dt) {
    const m = this.m, D = AI.defense;
    const cv = Math.hypot(car.vel.x, car.vel.z) || 1;
    const nx = -car.vel.z / cv, nz = car.vel.x / cv;
    const side = (p.pos.x - car.pos.x) * nx + (p.pos.z - car.pos.z) * nz < 0 ? -1 : 1;
    p.aiTarget = { x: car.pos.x + car.vel.x * D.chaseLead + nx * side * D.chaseSide, z: car.pos.z + car.vel.z * D.chaseLead + nz * side * D.chaseSide };
    p.aiState = 'PRESSING';
    p.aiSprint = true;
    p.aiFace = null;
    const s = aiPressState(p, car);
    s.engaged += dt;   // era gia' in pressione: niente nuova reazione
    s.react = lerp(AI.press.delay[0], AI.press.delay[1], this.skill);
    s.pace = lerp(AI.tackleRate[0], AI.tackleRate[1], this.skill);
    s.patience = lerp(AI.tackle.patience[0], AI.tackle.patience[1], this.skill);
    if (p.action || car.keeper || car.holding) return;
    if (slideWorth(m, p, car) && Math.random() < lerp(AI.slide.chance[0], AI.slide.chance[1], this.skill) * dt) this.slide(p, car);
  }

  // Scivolata verso dove sara' la palla fra un attimo.
  slide(p, car) {
    const b = this.m.ball, L = 0.25;
    this.m.startSlide(p, b.pos.x + car.vel.x * L - p.pos.x, b.pos.z + car.vel.z * L - p.pos.z);
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
    // contrasto: pulito quando conviene, a volte rischioso (defense.rashRate)
    const car = m.owner, s = p.press;
    if (p.aiState === 'PRESSING' && car && car.team !== p.team && s && s.car === car && s.react !== undefined && !car.keeper && !car.holding &&
      (tackleWorth(m, p, car, s.engaged, s.patience) || Math.random() < rashRate(m, p, car, s.engaged, s.patience) * dt) &&
      autoTackle(m, p, s, s.react, s.pace)) return;
    const t = p.aiTarget;
    const dx = t.x - p.pos.x, dz = t.z - p.pos.z, d = Math.hypot(dx, dz);
    const bx = m.ball.pos.x - p.pos.x, bz = m.ball.pos.z - p.pos.z;
    // si guarda la palla (o aiFace) solo vicino al proprio posto, e correndo di
    // lato o all'indietro solo per aggiustarsi: altrimenti ci si gira e si corre
    // (le corse laterali veloci fanno scivolare i piedi)
    let face = null, sidestep = false;
    if (d < AI.faceNear) {
      const f = p.aiFace || { x: bx, z: bz };
      const off = Math.abs(Math.atan2(Math.sin(Math.atan2(f.x, f.z) - Math.atan2(dx, dz)), Math.cos(Math.atan2(f.x, f.z) - Math.atan2(dx, dz))));
      if (off < AI.faceAngle) face = f;
      else if (d < AI.faceStep) { face = f; sidestep = true; }
    }
    if (d < 0.3) { p.drive(dt, 0, 0, 0, { face: { x: bx, z: bz } }); return; }
    // l'aggiustamento di lato o all'indietro e' un passo laterale, non una corsa
    const mag = Math.min(1, d / AI.arrive, sidestep ? AI.sidestepMag : 1);
    p.drive(dt, dx, dz, mag, { sprint: !sidestep && (p.aiSprint || d > AI.sprintDist), face });
  }

  summary() {
    const n = {};
    for (const p of this.players) n[p.aiState] = (n[p.aiState] || 0) + 1;
    return this.side + ' ' + Object.entries(n).map(([k, v]) => k + ' ' + v).join(', ');
  }
}

function dist2(a, b) { const dx = a.pos.x - b.pos.x, dz = a.pos.z - b.pos.z; return dx * dx + dz * dz; }
