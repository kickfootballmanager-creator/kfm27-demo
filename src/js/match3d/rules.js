import { RULES, PITCH, BALL, CONTROL, PASS, FOUL, ADVANTAGE, GOAL, SHOT } from './config.js';
import { headingOf, choosePass, freeness } from './player.js';
import { rootAction, standFall } from './gestures.js';
import { loftFor } from './ball.js';
import { whistle } from './audio.js';

// Fasi della partita: kickoff (calcio d'inizio), play, restart (rimessa,
// angolo, rinvio, punizione, rigore), out, foul (fischio di un fallo o di un
// fuorigioco), goal (esultanza), halftime, end. Cronometro e due tempi.
// Arbitro: falli con la regola del vantaggio, cartellini, espulsioni.

const HL = PITCH.length / 2;
const HW = PITCH.width / 2;
const GOAL_HW = GOAL.width / 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) * 2;

export class Rules {
  constructor(match, durationMinutes) {
    this.m = match;
    this.halfLen = Math.max(0.5, Number(durationMinutes) || RULES.durationMinutes) * 60 / 2;
    this.half = 1;
    this.clock = 0;          // secondi reali giocati nel tempo in corso
    this.t = 0;              // secondi nella fase attuale
    this.set = null;         // ripresa in corso: { type, side, taker, spot }
    this.firstKick = null;
    this.over = 0;           // secondi oltre la fine del tempo, in attesa della fine di un tiro
    this.pendingFoul = null; // fallo visto dall'arbitro, in attesa del vantaggio
    this.cardQueue = [];     // cartellini da mostrare alla prossima interruzione
  }

  // Minuto di gioco, 0-90.
  minute() { return Math.min(45, Math.floor(this.clock / this.halfLen * 45)) + (this.half - 1) * 45; }
  clockText() {
    const s = Math.min(45 * 60, Math.floor(this.clock / this.halfLen * 45 * 60)) + (this.half - 1) * 45 * 60;
    return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  }

  update(dt, inp) {
    const m = this.m;
    this.t += dt;
    if (m.phase === 'play' || m.phase === 'restart') this.clock += dt;
    if (this.pendingFoul && m.phase === 'play') this.advantageTick(dt);
    this.phases(dt, inp);
    m.hud.setClock(this.clockText(), this.half);
  }

  phases(dt, inp) {
    const m = this.m;
    if (m.phase === 'play' && this.clock >= this.halfLen) {
      const shot = m.poss.flying && m.poss.kind === 'tiro';
      if (!shot || (this.over += dt) > RULES.shotGrace) { this.endHalf(); return; }
    }
    if (m.phase === 'kickoff' || m.phase === 'restart') this.setPiece(dt, inp);
    else if (m.phase === 'goal') {
      if (this.t > RULES.goalPause || (this.t > RULES.goalSkip && inp.any)) { m.hud.hideGoal(); this.kickoff(this.next); }
    } else if (m.phase === 'out') {
      if (this.t > RULES.outPause) this.restart(this.pending);
    } else if (m.phase === 'foul') {
      if (this.t > RULES.foulPause) this.restart(this.pending);
    } else if (m.phase === 'halftime') {
      if (this.t > RULES.halfPause) this.secondHalf();
    }
  }

  go(phase) { this.m.phase = phase; this.t = 0; }

  // --- calcio d'inizio: tutti nella propria meta', chi batte tocca all'indietro
  kickoff(side) {
    const m = this.m;
    if (!this.firstKick) this.firstKick = side;
    m.cameraFocus = null;
    const p = m.placeKickoff(side);
    if (!m.poss.free) m.poss.loose('fischio');
    m.gain(p, "calcio d'inizio");
    m.offside = m.indirect = null;
    this.pendingFoul = null;
    whistle('long');
    this.set = { type: 'kickoff', side, taker: p, spot: { x: 0, z: 0 } };
    m.setControlled(side === m.userSide ? p : m.nearestTo(m.squad.players, 0, 0));
    this.go('kickoff');
  }

  // --- palla fuori: rimessa, angolo o rinvio, dopo una breve pausa
  out() {
    const m = this.m, b = m.ball;
    const last = m.poss.team || m.lastTouch && m.lastTouch.team;
    const against = last === 'home' ? 'away' : 'home';   // batte chi non l'ha toccata per ultimo
    const x = b.pos.x, z = b.pos.z;
    let type, side, spot;
    if (Math.abs(x) > HL) {
      const sx = Math.sign(x);
      // la porta da cui e' uscita: chi la difende?
      const defender = m.dirOf('home') === sx ? 'away' : 'home';
      if (last === defender) {
        type = 'corner'; side = against;
        spot = { x: sx * (HL - RULES.cornerInset), z: (Math.sign(z) || 1) * (HW - RULES.cornerInset) };
      } else {
        type = 'goalkick'; side = defender;
        spot = { x: sx * (HL - RULES.goalKick.x), z: (Math.sign(z) || 1) * RULES.goalKick.z };
      }
    } else {
      type = 'throw'; side = against;
      spot = { x: Math.max(-HL + 1, Math.min(HL - 1, x)), z: Math.sign(z) * HW };
    }
    if (!m.poss.free) m.poss.loose('fuori');
    this.pendingFoul = null;
    this.pending = { type, side, spot };
    m.hud.toast({ throw: 'Rimessa laterale', corner: "Calcio d'angolo", goalkick: 'Rinvio dal fondo' }[type]);
    // l'arbitro fischia e indica chi riprende
    const d = m.dirOf(side), r = m.referee.p.pos;
    m.referee.signal('point', { x: r.x + d * 10, z: r.z });
    this.flushCards();
    this.go('out');
  }

  restart(pending) {
    const { type, side, spot } = pending;
    if (type === 'freekick' || type === 'penalty') { this.freeKick(pending); return; }
    const m = this.m, b = m.ball, team = m.teams[side];
    for (const p of m.everyone) { p.action = null; p.holding = false; p.dropping = false; p.holdHand = null; }
    m.offside = m.indirect = null;
    let taker;
    if (type === 'goalkick') taker = team.keeper;
    else taker = m.nearestTo(team.players, spot.x, spot.z);
    // verso il campo: dal punto della ripresa verso il centro
    const fx = -spot.x, fz = -spot.z * (type === 'throw' ? 3 : 1), fl = Math.hypot(fx, fz) || 1;
    const h = type === 'throw' ? headingOf(0, -Math.sign(spot.z)) : headingOf(fx / fl, fz / fl);
    b.reset(spot.x, spot.z);
    if (type === 'throw') {
      // fuori dal campo di quanto la rincorsa della clip lo riporta sulla linea
      taker.place(spot.x, spot.z + Math.sign(spot.z) * RULES.throwIn.outside, h);
    } else {
      taker.place(spot.x - Math.sin(h) * 0.55, spot.z - Math.cos(h) * 0.55, h);
    }
    m.gain(taker, { throw: 'rimessa', corner: "calcio d'angolo", goalkick: 'rinvio' }[type]);
    taker.holding = type === 'throw';
    // in attesa: fermo nel primo fotogramma della rimessa, palla in mano
    if (type === 'throw') taker.avatar.playOnce(RULES.throwIn.clip, RULES.throwIn.from, Infinity, 0);
    this.set = { type, side, taker, spot };
    if (side === m.userSide && !taker.keeper) m.setControlled(taker);
    else if (m.ctrl === taker || m.ctrl.team !== m.userSide || m.ctrl.keeper) m.setControlled(m.nearestTo(m.squad.players, spot.x, spot.z));
    this.go('restart');
  }

  // La ripresa in corso la batte l'utente (i suoi comandi passano da main.actions).
  userTaking() {
    const m = this.m, s = this.set;
    return (m.phase === 'restart' || m.phase === 'kickoff') && !!s && s.side === m.userSide && s.taker === m.ctrl && !s.taker.action;
  }

  // Comando dell'utente alla ripresa, con la potenza della barra: Passa e
  // Filtrante giocano corto, Cross e Tiro lungo. false se non e' ancora il momento.
  userKick(btn, power, inp) {
    if (!this.userTaking() || this.t < RULES.restartReady || btn === 'feint') return false;
    this.take(btn, power, inp);
    return true;
  }

  // Palla ferma sul punto; chi batte aspetta il comando (utente) o il suo momento (IA).
  setPiece(dt, inp) {
    const m = this.m, s = this.set, p = s.taker;
    if (p.action) return;
    if (!p.holding) m.ball.hold(m.ball.pos.x, BALL.radius, m.ball.pos.z);
    const user = s.side === m.userSide && p === m.ctrl;
    if (user && m.charging) return;
    if (this.t > (user ? RULES.userWait : RULES.aiTake)) this.take('auto', 0.2 + Math.random() * 0.75, null);
  }

  // `btn`: pulsante dell'utente (pass, through, cross, shot) o 'auto' per l'IA.
  take(btn, power, inp) {
    const m = this.m, s = this.set, p = s.taker;
    const short = btn === 'pass' || btn === 'through';
    if (s.type === 'kickoff') this.kickoffTap(p);
    else if (s.type === 'throw') this.throwIn(p, btn === 'auto' ? 'auto' : short ? 'short' : 'long', inp, power);
    else if (s.type === 'goalkick') m.startKick(p, 'cross', 0.8, { mag: 1, x: m.dirOf(p.team), z: 0 });
    else if (s.type === 'penalty') this.penaltyKick(p, btn === 'auto' ? 0.6 + Math.random() * 0.32 : power, inp);
    else if (s.type === 'freekick') this.freeKickTake(p, btn, power, inp);
    else {
      const k = short ? 'pass' : 'cross';
      const dx = -Math.sign(s.spot.x) * 0.9, dz = -Math.sign(s.spot.z) * 0.45, l = Math.hypot(dx, dz);
      m.startKick(p, btn === 'auto' && Math.random() < 0.25 ? 'pass' : k, power, inp && inp.mag > 0 ? inp : { mag: 1, x: dx / l, z: dz / l });
    }
  }

  kickoffTap(p) {
    const m = this.m, K = RULES.kickoff, d = m.dirOf(p.team);
    // al compagno piu' vicino dietro la palla
    let to = null, bd = Infinity;
    for (const q of m.teams[p.team].players) {
      if (q === p || q.keeper || q.pos.x * d > -2) continue;
      const dd = Math.hypot(q.pos.x, q.pos.z);
      if (dd < bd) { bd = dd; to = q; }
    }
    p.heading = to ? headingOf(to.pos.x - p.pos.x, to.pos.z - p.pos.z) : p.heading;
    p.avatar.playOnce(K.clip, K.from, K.end - K.from + 0.1);
    p.action = {
      clip: K.clip, t: 0, rate: 1, end: K.end - K.from,
      events: [{ at: K.contact - K.from, fn: () => {
        if (to) m.ball.rollTo(to.pos.x, to.pos.z, K.arrive);
        else m.ball.kick(-d * 6, 0, 0);
        m.poss.fly('passaggio', p, to, "calcio d'inizio");
        m.kickLock = { p, t: CONTROL.kickLock };
        if (to && to.team === m.userSide) m.switchTo(to);
        this.go('play');
      } }]
    };
  }

  // Rimessa laterale: rincorsa della clip fino alla linea, palla lasciata al fotogramma misurato.
  throwIn(p, kind, inp, power = 0.3) {
    const m = this.m, T = RULES.throwIn;
    const mates = m.teams[p.team].players, opp = m.teams[m.otherSide(p.team)].players;
    const ax = inp && inp.mag > 0 ? inp.x : p.dirX, az = inp && inp.mag > 0 ? inp.z : p.dirZ;
    let to = choosePass(p, ax, az, mates.filter((q) => !q.keeper && Math.hypot(q.pos.x - p.pos.x, q.pos.z - p.pos.z) < (kind === 'long' ? T.longMax : T.shortMax)), opp, PASS.coneNoStick, power);
    if (!to) {
      let best = -1;
      for (const q of mates) { if (q === p || q.keeper) continue; const f = freeness(q.pos.x, q.pos.z, opp) - Math.hypot(q.pos.x - p.pos.x, q.pos.z - p.pos.z) / 40; if (f > best) { best = f; to = q; } }
    }
    // la clip riparte dal fotogramma in cui aspettava: nessun salto di posa
    const hold = (T.end - T.from) / T.rate;
    if (!p.avatar.resume(T.clip, T.rate, hold)) p.avatar.playOnce(T.clip, T.from, hold, T.rate);
    p.action = rootAction(m, p, T.clip, T.from, T.end, T.rate, {
      events: [{ at: T.release - T.from, fn: () => {
        // la palla lascia le mani dove l'ha tenuta l'ultimo disegno
        const b = m.ball, h = p.avatar.heldAt;
        p.holding = false;
        b.hold(h.x, Math.max(1.2, h.y), h.z);
        if (to) b.lobTo(to.pos.x + to.vel.x * 0.6, to.pos.z + to.vel.z * 0.6, Math.max(b.pos.y, 1.8) + (kind === 'long' ? T.longApex : T.shortApex));
        else b.kick(p.dirX * 10, 3, p.dirZ * 10);
        m.poss.fly('rimessa', p, to || null);
        m.noOffsideSeq = m.poss.seq;
        m.kickLock = { p, t: CONTROL.kickLock };
        if (to && to.team === m.userSide) m.switchTo(to);
        this.go('play');
      } }]
    });
  }

  // --- falli. `info.kind`: 'pressing' | 'contrasto' | 'scivolata'; info.ballFirst:
  // prima la palla, poi l'uomo. Gravita' dall'intervento, cartellino oltre le
  // soglie, rigore se in area; fuori area l'arbitro valuta il vantaggio.
  foul(off, victim, info) {
    const m = this.m, F = FOUL;
    if (!RULES.fouls || m.phase !== 'play' || this.pendingFoul || off.team === victim.team) return false;
    const from = approach(off, victim);
    const sev = F.base[info.kind] + (from === 'back' ? F.back : from === 'side' ? F.side : 0) +
      F.speed * Math.hypot(off.vel.x, off.vel.z) + (info.ballFirst ? F.ballFirst : F.noBall) + gauss() * F.noise * 0.5;
    const spot = { x: victim.pos.x, z: victim.pos.z };
    const inBox = inArea(m.dirOf(off.team), spot);
    let card = sev >= F.red ? 'red' : sev >= F.yellow ? 'yellow' : null;
    // chiara occasione da gol negata: rosso, in area giallo se l'intervento cercava la palla
    if (this.dogso(victim, off)) card = inBox && info.kind !== 'scivolata' ? (card || 'yellow') : 'red';
    m.stats.fouls[off.team]++;
    // chi subisce cade: la scivolata lo ha gia' fatto cadere (tripped)
    if (info.kind !== 'scivolata') standFall(m, victim);
    if (m.owner === victim) {
      m.ball.kick(victim.vel.x * 0.6, 0, victim.vel.z * 0.6);
      m.poss.loose('contrasto', off);
    }
    const f = { off, victim, spot, card, team: victim.team, penalty: inBox && RULES.penalties, t: 0, adv: false };
    m.lastFoul = { kind: info.kind, from, sev, card, penalty: f.penalty };
    if (f.penalty) this.callFoul(f);
    else this.pendingFoul = f;
    return true;
  }

  // Chiara occasione: la vittima puntava la porta vicina e fra lei e la porta
  // non c'era nessun difensore oltre al portiere (e a chi l'ha fermata).
  dogso(victim, off) {
    const m = this.m, d = m.dirOf(victim.team), va = victim.pos.x * d;
    if (Math.hypot(d * HL - victim.pos.x, victim.pos.z) > FOUL.dogsoDist) return false;
    const b = m.ball.pos;
    if (Math.hypot(b.x - victim.pos.x, b.z - victim.pos.z) > 3) return false;
    for (const q of m.teams[off.team].players) if (!q.keeper && q !== off && q.pos.x * d > va) return false;
    return true;
  }

  // Vantaggio: se la squadra che ha subito il fallo tiene palla in una zona
  // utile si gioca; se la perde entro la finestra si torna al fallo.
  advantageTick(dt) {
    const m = this.m, f = this.pendingFoul, poss = m.poss, A = ADVANTAGE;
    f.t += dt;
    // la palla e' "nostra" se la tiene un compagno o, libera, se il piu' vicino e' dei nostri
    let ours;
    if (poss.owned) ours = poss.owner.team === f.team;
    else {
      const b = m.ball.pos;
      const near = m.nearestTo(m.everyone.filter((q) => q !== f.victim), b.x, b.z);
      ours = !!near && near.team === f.team;
    }
    if (!f.adv) {
      if (f.t < A.decide) return;
      if (ours && m.ball.pos.x * m.dirOf(f.team) > A.attackMin) {
        f.adv = true;
        m.hud.toast('Vantaggio');
        const r = m.referee.p.pos;
        m.referee.signal('advantage', { x: r.x + m.dirOf(f.team) * 10, z: r.z }, null);
        return;
      }
      this.callFoul(f);
      return;
    }
    if (poss.owned && poss.owner.team !== f.team && f.t < A.window) { this.callFoul(f); return; }
    if (f.t >= A.window) {
      if (f.card) this.cardQueue.push({ p: f.off, type: f.card });
      this.pendingFoul = null;
    }
  }

  // Fischio del fallo: gesto verso chi batte (o verso il dischetto), cartellini, punizione.
  callFoul(f) {
    const m = this.m;
    this.pendingFoul = null;
    const d = m.dirOf(f.team);
    const kick = f.penalty ? { x: d * (HL - PITCH.penaltySpot), z: 0 } : { x: f.spot.x + d * 10, z: f.spot.z };
    m.referee.signal(f.penalty ? 'spot' : 'point', kick);
    if (f.card) this.cardQueue.push({ p: f.off, type: f.card });
    this.stopPlay();
    m.hud.toast(f.penalty ? 'Calcio di rigore' : 'Fallo: punizione');
    this.pending = { type: f.penalty ? 'penalty' : 'freekick', side: f.team, spot: f.spot, direct: true };
    this.flushCards();
    this.go('foul');
  }

  // Fuorigioco: punizione indiretta per i difensori dove stava chi era oltre.
  offside(p) {
    const m = this.m;
    this.pendingFoul = null;
    m.referee.signal('up', p.pos);
    m.hud.toast('Fuorigioco');
    m.stats.offsides[p.team]++;
    this.stopPlay();
    this.pending = { type: 'freekick', side: m.otherSide(p.team), spot: { x: p.pos.x, z: p.pos.z }, direct: false };
    this.flushCards();
    this.go('foul');
  }

  // Gioco fermo: niente calci in preparazione, palla ferma e di nessuno.
  stopPlay() {
    const m = this.m;
    for (const p of m.everyone) if (p.action && p.action.kick) p.action = null;
    m.ball.vel.set(0, 0, 0);
    if (!m.poss.free) m.poss.loose('fischio');
    m.offside = m.indirect = null;
  }

  // Cartellini in attesa: si mostrano alla prima interruzione.
  flushCards() {
    const q = this.cardQueue;
    this.cardQueue = [];
    for (const c of q) this.book(c.p, c.type);
  }

  // Ammonizione o espulsione; doppio giallo = rosso. L'espulso esce dal campo.
  book(p, type) {
    const m = this.m;
    if (p.sentOff) return;
    const minute = this.minute();
    const note = (t, second) => m.cards.push({ team: p.team, playerId: p.id, number: p.number, name: p.name, type: t, minute, second: !!second });
    let red = type === 'red';
    if (type === 'yellow') {
      p.yellows = (p.yellows || 0) + 1;
      note('yellow');
      if (p.yellows >= 2) { red = true; note('red', true); }
    } else note('red');
    m.referee.showCard(red ? 'red' : 'yellow', p.pos);
    m.hud.setCards(m.cards);
    m.hud.toast((red ? (type === 'yellow' ? 'Secondo giallo, espulso' : 'Espulso') : 'Ammonito') + ': ' + (p.number ? p.number + ' ' : '') + (p.name || ''));
    if (red) m.sendOff(p);
  }

  // --- punizione o rigore: palla sul punto, chi batte dietro, verso la porta.
  freeKick({ type, side, spot, direct }) {
    const m = this.m, b = m.ball, team = m.teams[side], d = m.dirOf(side);
    for (const p of m.everyone) { if (!p.down) p.action = null; p.holding = false; p.dropping = false; p.holdHand = null; }
    m.offside = m.indirect = null;
    let sp = { x: clamp(spot.x, -HL + 0.5, HL - 0.5), z: clamp(spot.z, -HW + 0.5, HW - 0.5) }, taker;
    if (type === 'penalty') {
      sp = { x: d * (HL - PITCH.penaltySpot), z: 0 };
      // tira il migliore al tiro fra chi e' in piedi
      taker = team.players.filter((q) => !q.keeper && !q.down).sort((a, c) => c.params.shotSpeed - a.params.shotSpeed)[0];
    } else taker = m.nearestTo(team.players, sp.x, sp.z);
    if (!taker) taker = team.players.find((q) => !q.keeper) || team.keeper;
    const h = headingOf(d * HL - sp.x, -sp.z);
    b.reset(sp.x, sp.z);
    const back = type === 'penalty' ? RULES.penalty.back : 0.55;
    taker.action = null;
    taker.down = false;
    taker.place(sp.x - Math.sin(h) * back, sp.z - Math.cos(h) * back, h);
    m.gain(taker, type === 'penalty' ? 'rigore' : 'punizione');
    if (type === 'penalty') this.penaltyPlaces(side, sp, taker);
    else this.freeKickPlaces(side, sp, direct !== false);
    this.set = { type, side, taker, spot: sp, direct: direct !== false };
    if (side === m.userSide && !taker.keeper) m.setControlled(taker);
    else if (!m.ctrl || m.ctrl === taker || m.ctrl.team !== m.userSide || m.ctrl.keeper || m.ctrl.sentOff) m.setControlled(m.nearestTo(m.squad.players, sp.x, sp.z));
    if (type === 'freekick') m.hud.toast(direct === false ? 'Punizione indiretta' : 'Punizione');
    this.go('restart');
  }

  // Punizione: gli avversari subito a 9,15 m dalla palla e, se e' diretta e
  // vicina alla loro porta, la barriera gia' in fila (come in PES).
  freeKickPlaces(side, sp, direct) {
    const m = this.m, other = m.teams[m.otherSide(side)];
    for (const p of other.players) {
      if (p.keeper || p.down) continue;
      const dx = p.pos.x - sp.x, dz = p.pos.z - sp.z, d = Math.hypot(dx, dz);
      if (d < RULES.wall) { const k = RULES.wall / Math.max(d, 0.1); p.place(sp.x + dx * k, clamp(sp.z + dz * k, -HW + 1, HW - 1), p.heading); }
    }
    if (!direct) return;
    other.ai.wall(other.players.filter((q) => !q.keeper && !q.down), sp);
    for (const p of other.players) if (p.aiState === 'BARRIERA') p.place(p.aiTarget.x, p.aiTarget.z, headingOf(sp.x - p.aiTarget.x, sp.z - p.aiTarget.z));
  }

  // Rigore: il portiere sulla linea, tutti gli altri fuori dall'area.
  penaltyPlaces(side, sp, taker) {
    const m = this.m, d = m.dirOf(side), other = m.teams[m.otherSide(side)], E = RULES.penalty.edge;
    other.keeper.action = null;
    other.keeper.place(d * (HL - 0.3), 0, headingOf(-d, 0));
    for (const p of m.everyone) {
      if (p === taker || p === other.keeper || p.keeper) continue;
      if (p.pos.x * d > HL - E || Math.hypot(p.pos.x - sp.x, p.pos.z - sp.z) < RULES.wall) {
        p.action = null;
        p.down = false;
        p.place(d * (HL - E - 1 - Math.random() * 4), clamp(p.pos.z, -16, 16), headingOf(d, 0));
      }
    }
  }

  // Punizione: Tiro in porta, Passa o Filtrante corto, Cross alto. L'IA tira
  // se e' diretta e vicina, crossa dalle fasce, altrimenti passa.
  freeKickTake(p, btn, power, inp) {
    const m = this.m, s = this.set, d = m.dirOf(p.team);
    const gx = d * HL - s.spot.x, gz = -s.spot.z, gd = Math.hypot(gx, gz) || 1;
    let kind = btn, pw = power, dir = inp && inp.mag > 0 ? inp : null;
    if (btn === 'auto') {
      if (s.direct && gd < RULES.freeKickShoot) {
        kind = 'shot';
        pw = 0.55 + Math.random() * 0.27;
        dir = { mag: 1, x: d * 0.5, z: (Math.random() < 0.5 ? -1 : 1) * 0.85 };
      } else if (s.spot.x * d > 18 && Math.abs(s.spot.z) > 12) { kind = 'cross'; pw = 0.2 + Math.random() * 0.7; }
      else { kind = 'pass'; pw = 0.35; }
    }
    if (!dir) dir = { mag: 1, x: gx / gd, z: gz / gd };
    if (!s.direct) m.pendingIndirect = p;
    m.startKick(p, kind === 'auto' ? 'pass' : kind, pw, dir);
  }

  // Rigore con la clip penalty: la levetta sceglie il lato, la potenza
  // l'altezza (come in PES); la palla parte al fotogramma del calcio.
  penaltyKick(p, power, inp) {
    const m = this.m, T = RULES.penalty, d = m.dirOf(p.team);
    let side;
    if (inp) side = inp.mag > 0.3 && Math.abs(inp.z) > 0.3 ? Math.sign(inp.z) : 0;
    else side = [-1, -1, 0, 1, 1][Math.floor(Math.random() * 5)];
    const tz = side * (GOAL_HW - T.postMargin);
    const over = Math.max(0, (power - T.overPower) / (1 - T.overPower));
    const h = lerp(T.height[0], T.height[1], Math.min(1, power / T.overPower)) + T.overHeight * over;
    const keeper = m.teams[m.otherSide(p.team)].keeperAI;
    p.avatar.playOnce(T.clip, T.from, T.end - T.from);
    p.action = rootAction(m, p, T.clip, T.from, T.end, 1, {
      scaleS: 0,
      events: [{ at: T.contact - T.from, fn: () => {
        const b = m.ball, P = p.params, err = P.shotError * T.error;
        const dx = d * HL - b.pos.x, dz = tz - b.pos.z, dist = Math.hypot(dx, dz);
        const ang = Math.atan2(dz, dx) + gauss() * err;
        const speed = lerp(T.speed, P.shotSpeed, power);
        const loft = loftFor(b.pos.y, speed, dist, Math.max(BALL.radius + 0.04, h + gauss() * err * dist * SHOT.heightError));
        b.kick(Math.cos(ang) * Math.cos(loft) * speed, Math.sin(loft) * speed, Math.sin(ang) * Math.cos(loft) * speed);
        m.poss.fly('tiro', p, null, 'rigore');
        m.kickLock = { p, t: CONTROL.kickLock };
        m.lastKick = { kind: 'rigore', power, speed, dist };
        keeper.penaltyKicked(side);
        this.go('play');
      } }]
    });
  }

  // --- gol: esultanza di chi ha segnato, il portiere battuto si dispera
  goal(team, scorer) {
    const m = this.m, C = RULES.celebration;
    whistle('long');
    this.pendingFoul = null;
    this.flushCards();
    for (const p of m.everyone) if (p.action && !p.keeper) { p.action = null; p.avatar.endGesture(); }
    if (scorer && !scorer.down) { scorer.avatar.playOnce(C.clip, C.from, C.hold); m.cameraFocus = scorer; }
    this.next = m.otherSide(team);
    this.go('goal');
  }

  endHalf() {
    const m = this.m;
    this.over = 0;
    whistle('end');
    this.pendingFoul = null;
    this.flushCards();
    for (const p of m.everyone) { p.action = null; p.down = false; }
    if (!m.poss.free) m.poss.loose('fine tempo');
    if (this.half === 1) {
      m.hud.showBanner('Intervallo', m.home.name + ' ' + m.goals.home + ' - ' + m.goals.away + ' ' + m.away.name);
      this.go('halftime');
    } else {
      m.hud.showBanner('Fine partita', m.home.name + ' ' + m.goals.home + ' - ' + m.goals.away + ' ' + m.away.name);
      this.go('end');
      m.onFullTime();
    }
  }

  // Secondo tempo: si cambia campo, batte chi non ha battuto nel primo.
  secondHalf() {
    const m = this.m;
    m.hud.hideGoal();
    this.half = 2;
    this.clock = 0;
    m.attackDir = -m.attackDir;
    for (const p of m.everyone) p.attackDir = m.dirOf(p.team);
    this.kickoff(m.otherSide(this.firstKick));
  }
}

// Da dove arriva `off` rispetto a dove guarda `victim`.
function approach(off, victim) {
  const ax = off.pos.x - victim.pos.x, az = off.pos.z - victim.pos.z, al = Math.hypot(ax, az) || 1;
  const c = (ax * victim.dirX + az * victim.dirZ) / al;
  return c < -0.3 ? 'back' : c < 0.45 ? 'side' : 'front';
}

// Punto nell'area di rigore difesa da chi attacca verso `dir`.
function inArea(dir, spot) {
  return spot.x * -dir > HL - PITCH.penaltyDepth && Math.abs(spot.z) < PITCH.penaltyWidth / 2;
}
