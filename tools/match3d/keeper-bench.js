// Banco del portiere (tools/match3d/probe.mjs --hook): tiri comandati verso
// la porta di casa, gli altri giocatori fermi e lontani. Ci sono i due gol
// dei replay dell'utente del 03/10/2026 (B: tiro a 28 m/s che passa a 70 cm
// dal portiere ad altezza del petto; A: passaggio rasoterra a 17 m/s dritto
// sul portiere, respinto sul corpo) e una griglia di tiri da tre punti.
// Per ogni tiro: parabile o no per gli attributi (KeeperAI.assess) e perche',
// il piano scelto, la distanza minima fra palla e mani, l'esito. Con
// --tapes salva il nastro di ogni tiro.
(() => {
  // numeri casuali ripetibili: stessi tiri e stesse letture del portiere
  let seed = 12345;
  Math.random = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const S = window.__soak, m = S.m, run = S.run;
  const KA = m.teams.home.keeperAI, k = KA.p, d = m.dirOf('home'), gx = -d * 52.5;
  const shooter = m.teams.away.players[9];
  // casi dei replay (porta di casa, x verso il campo = d): portiere e palla al momento del tiro
  const SHOTS = [
    { name: 'B 3148', kp: [-47.625, 2.63, 1.085], kv: [0.885, 0.3], ball: [-40.317, 0.118, 6.481], vel: [-23.964, 5.005, -14.074] },
    { name: 'A 1119', kp: [-49.765, 0.369, 1.4676], ball: [-33.817, 0.11, 2.036], vel: [-16.985, 0, -1.441] }
  ];
  // ogni caso dei replay piu' volte: cambia la lettura del portiere (errore casuale)
  const REP = +(window.__benchRep || 6);
  for (let j = 1; j < REP; j++) SHOTS.push({ ...SHOTS[0], name: SHOTS[0].name + ' #' + j }, { ...SHOTS[1], name: SHOTS[1].name + ' #' + j });
  // tiri a caso: da 8-26 m, angolo fino a 50 gradi, verso tutto lo specchio
  const N = +(window.__benchShots || 60);
  for (let j = 0; j < N; j++) {
    const dist = 8 + Math.random() * 18, ang = (Math.random() * 2 - 1) * 0.87;
    const from = [+(dist * Math.cos(ang)).toFixed(1), +(dist * Math.sin(ang)).toFixed(1)];
    const to = [+((Math.random() * 2 - 1) * 3.5).toFixed(2), +(0.12 + Math.random() * 2.15).toFixed(2)], v = Math.round(16 + Math.random() * 15);
    SHOTS.push({ name: 'da ' + from + ' a ' + to + ' ' + v, from, to, v });
  }
  // window.__benchOnly: solo i tiri il cui nome contiene uno di questi testi
  if (window.__benchOnly) { const keep = SHOTS.filter((x) => window.__benchOnly.some((w) => x.name.includes(w))); SHOTS.length = 0; SHOTS.push(...keep); }
  const P = window.__probe = { shots: [] };
  for (const side of ['home', 'away']) { m.teams[side].ai.update = () => {}; m.teams[side].ai.steer = (dt, p) => p.drive(dt, 0, 0, 0, {}); }
  m.referee.update = () => m.referee.p.drive(1 / 60, 0, 0, 0, {});
  m.onGoal = () => { if (cur) cur.result = cur.result === 'nessuno' ? 'gol' : cur.result + ', poi gol'; };
  m.rules.out = () => {};
  m.rules.foul = () => false;
  m.rules.endHalf = () => {};
  const hands = () => {
    const r = k.avatar.rig, out = [];
    for (const s of ['Left', 'Right']) {
      const a = r[s + 'Hand'].getWorldPosition(k.avatar.object.position.clone()), b = r[s + 'HandMiddle1'].getWorldPosition(a.clone());
      out.push(a.lerp(b, 0.6));
    }
    return out;
  };
  let i = -1, cur = null;
  const setup = () => {
    i++;
    if (i >= SHOTS.length) return false;
    const s = SHOTS[i];
    for (const p of m.everyone) {
      if (p === k) continue;
      p.action = null; p.avatar.endGesture();
      p.place(gx + d * (p.team === 'home' ? 34 : 38), (m.everyone.indexOf(p) % 11 - 5) * 4, 0);
    }
    k.action = null; k.avatar.endGesture(); k.holding = false; k.keeperBusy = false; k.down = false;
    KA.pending = null; KA.watch = null; KA.shot = null; KA.lastPlan = null;
    if (!m.poss.free) m.poss.loose('fischio');
    if (s.kp) {
      k.place(s.kp[0], s.kp[1], s.kp[2]);
      m.ball.reset(s.ball[0], s.ball[2]);
      cur = { shot: i, name: s.name, result: 'nessuno', kick: S.frames + 2, minHand: 9, minBody: 9 };
    } else {
      k.place(gx + d * 3, 0, Math.atan2(d, 0));
      m.ball.reset(gx + d * s.from[0], s.from[1]);
      cur = { shot: i, name: s.name, result: 'nessuno', kick: S.frames + 70, minHand: 9 };
    }
    shooter.place(m.ball.pos.x + d * 1.5, m.ball.pos.z, Math.atan2(-d, 0));
    m.phase = 'play';
    return true;
  };
  const kick = () => {
    const s = SHOTS[cur.shot], b = m.ball;
    if (s.kp) {
      k.place(s.kp[0], s.kp[1], s.kp[2]);
      // nel replay B il portiere camminava verso il suo posto
      if (s.kv) { k.vel.x = s.kv[0]; k.vel.z = s.kv[1]; k.speed = Math.hypot(s.kv[0], s.kv[1]); k.moveHeading = Math.atan2(s.kv[0], s.kv[1]); }
      b.pos.set(s.ball[0], s.ball[1], s.ball[2]); b.prev.copy(b.pos);
      b.kick(s.vel[0], s.vel[1], s.vel[2]);
    } else {
      const dx = gx - b.pos.x, dz = s.to[0] - b.pos.z, dist = Math.hypot(dx, dz), T = dist / s.v;
      b.kick(dx / T, (s.to[1] - b.pos.y + 0.5 * 9.81 * T * T) / T, dz / T);
    }
    if (!m.poss.free) m.poss.loose('fischio');
    m.poss.fly('tiro', shooter, null);
    m.kickLock = { p: shooter, t: 2 };
    cur.kicked = S.frames;
    cur.keeper = [+k.pos.x.toFixed(2), +k.pos.z.toFixed(2)];
    cur.touch = KA.lastTouch;
    cur.state = [m.phase, m.poss.describe(), !!k.action, !!k.down, m.owner === k, k.aiState, m.ball.live].join(' ');
    if (KA.assess) {
      const a = KA.assess();
      cur.assess = a && { saveable: a.saveable, reason: a.reason, margin: +a.margin.toFixed(2), t: +a.t.toFixed(2) };
    }
  };
  const watch = () => {
    k.avatar.object.updateMatrixWorld(true);
    const b = m.ball.pos;
    if (m.poss.flying || m.poss.free) {
      const H = hands(), dmin = Math.min(H[0].distanceTo(b), H[1].distanceTo(b));
      if (dmin < cur.minHand) {
        cur.minHand = +dmin.toFixed(2);
        // istante piu' vicino: dove sono mani, bersaglio dell'IK e palla
        const pr = k.avatar.proc, f3 = (v) => v ? [+v.x.toFixed(2), +v.y.toFixed(2), +v.z.toFixed(2)] : null;
        cur.near = { f: S.frames - cur.kicked, ball: f3(b), L: f3(H[0]), R: f3(H[1]), tgt: pr && pr.target ? f3(pr.target) : null,
          ik: pr && pr.cur !== undefined ? +pr.cur.toFixed(2) : null, clipT: k.avatar.one ? +k.avatar.one.a.time.toFixed(2) : null,
          gesture: k.avatar.gestureName(), kp: [+k.pos.x.toFixed(2), +k.pos.z.toFixed(2)] };
      }
    }
    const pl = KA.lastPlan;
    if (pl && pl !== cur.planRef) {
      cur.planRef = pl;
      cur.plan = { clip: pl.clip, tau: +pl.tau.toFixed(2), from: +pl.from.toFixed(2), rate: +pl.rate.toFixed(2), wait: +pl.wait.toFixed(2), e: +pl.e.toFixed(2), kA: +pl.kA.toFixed(2), kS: +pl.kS.toFixed(2), t: +pl.t.toFixed(2) };
      cur.planAt = S.frames - cur.kicked;
    }
    if (S.frames - cur.kicked < 30 && (S.frames - cur.kicked) % 5 === 0) (cur.ai || (cur.ai = [])).push(k.aiState + (k.action ? '+a' : '') + (KA.pending ? '+p' : ''));
    if (!cur.gestureAt && k.avatar.gestureName()) { cur.gestureAt = S.frames - cur.kicked; cur.clip = k.avatar.gestureName(); }
    const last = KA.lastTouch;
    if (last && last !== cur.touch) { cur.touch = last; cur.result = last.part + ' ' + last.result; cur.touchAt = S.frames; }
    // dopo una respinta: che cosa fa il portiere (deve tornare a giocare, non restare nel gesto)
    if (cur.touchAt && (S.frames - cur.touchAt === 30 || S.frames - cur.touchAt === 60)) (cur.after || (cur.after = [])).push(k.aiState + (k.action ? ' gesto ' + (k.avatar.gestureName() || '') : '') + ' ' + m.poss.describe());
  };
  setup();
  S.run = (n, maxClock) => {
    let r;
    for (let j = 0; j < n; j++) {
      if (!cur) break;
      if (!cur.kicked && S.frames >= cur.kick) kick();
      r = run(1, maxClock);
      if (cur.kicked) watch();
      if (cur.kicked && S.frames - cur.kicked >= 100) {
        S.saveTape('banco portiere ' + cur.name + ' ' + cur.result);
        delete cur.planRef; delete cur.touch;
        P.shots.push(cur);
        if (!setup()) { cur = null; m.phase = 'end'; break; }
      }
    }
    return r || { done: true, frames: S.frames, clock: '', phase: m.phase, goals: m.goals, violations: 0 };
  };
})();
