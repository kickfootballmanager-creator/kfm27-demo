import { RULES, PITCH, BALL, CONTROL, PASS } from './config.js';
import { headingOf, choosePass, freeness } from './player.js';
import { rootAction } from './gestures.js';

// Fasi della partita: kickoff (calcio d'inizio), play, restart (rimessa,
// angolo, rinvio), goal (esultanza), halftime, end. Cronometro e due tempi.

const HL = PITCH.length / 2;
const HW = PITCH.width / 2;

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
    this.pending = { type, side, spot };
    m.hud.toast({ throw: 'Rimessa laterale', corner: "Calcio d'angolo", goalkick: 'Rinvio dal fondo' }[type]);
    this.go('out');
  }

  restart({ type, side, spot }) {
    const m = this.m, b = m.ball, team = m.teams[side];
    for (const p of m.everyone) { p.action = null; p.holding = false; }
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
    this.take(btn === 'pass' || btn === 'through' ? 'short' : 'long', power, inp);
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

  take(kind, power, inp) {
    const m = this.m, s = this.set, p = s.taker;
    if (s.type === 'kickoff') this.kickoffTap(p);
    else if (s.type === 'throw') this.throwIn(p, kind, inp, power);
    else if (s.type === 'goalkick') m.startKick(p, 'cross', 0.8, { mag: 1, x: m.dirOf(p.team), z: 0 });
    else {
      const k = kind === 'short' ? 'pass' : 'cross';
      const dx = -Math.sign(s.spot.x) * 0.9, dz = -Math.sign(s.spot.z) * 0.45, l = Math.hypot(dx, dz);
      m.startKick(p, kind === 'auto' && Math.random() < 0.25 ? 'pass' : k, power, inp && inp.mag > 0 ? inp : { mag: 1, x: dx / l, z: dz / l });
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
        m.kickLock = { p, t: CONTROL.kickLock };
        if (to && to.team === m.userSide) m.switchTo(to);
        this.go('play');
      } }]
    });
  }

  // --- gol: esultanza di chi ha segnato, il portiere battuto si dispera
  goal(team, scorer) {
    const m = this.m, C = RULES.celebration;
    for (const p of m.everyone) if (p.action && !p.keeper) { p.action = null; p.avatar.endGesture(); }
    if (scorer && !scorer.down) { scorer.avatar.playOnce(C.clip, C.from, C.hold); m.cameraFocus = scorer; }
    this.next = m.otherSide(team);
    this.go('goal');
  }

  endHalf() {
    const m = this.m;
    this.over = 0;
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
