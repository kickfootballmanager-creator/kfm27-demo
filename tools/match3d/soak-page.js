// Test di durata della partita 3D, parte che gira nella pagina (la carica
// soak.mjs dopo ?match3d=auto). Avanza la partita IA contro IA a passi di
// 1/60 s senza disegnare e dopo ogni passo controlla gli invarianti della
// skill match3d ("Stabilita' e test automatici"). Ogni violazione e' contata
// per tipo con i primi esempi, per trovare la causa.
(() => {
  const DT = 1 / 60;
  const LOOP_REPEAT = 2201;      // THREE.LoopRepeat
  const EXAMPLES = 4;

  // Soglie. Le altezze dei piedi si misurano sulle clip (calibrate).
  const T = {
    weightTol: 0.02,             // somma dei pesi (gait e mixer)
    floatMargin: 0.06,           // m oltre l'appoggio piu' alto misurato nelle clip di corsa
    floatFrames: 4,
    sink: -0.07,                 // piede sotto l'erba
    airborneMax: 0.7,            // durante un gesto: piedi tutti oltre tanto per troppo = fluttua
    airborneFrames: 75,
    frozenSpeed: 1.5,            // m/s oltre cui la corsa deve muovere le gambe
    frozenFrames: 8,
    incoherent: 0.5,             // scarto del peso dell'idle da quello atteso
    incoherentFrames: 30,
    runGestureSpeed: 3,          // m/s: gesto da fermo mentre si corre
    // Piede che scivola: il piede appoggiato piatto si muove sull'erba a oltre
    // 1,2 m/s e oltre il 35% della velocita' del giocatore per un terzo di secondo.
    skateSpeed: 1.2,
    skateShare: 0.35,
    skateFrames: 20,
    stanceY: 0.015,              // m sopra l'altezza della punta da fermi: la punta e' a terra
    heelY: 0.03,                 // m sopra l'altezza della caviglia da fermi: il tallone e' a terra
    detached: 2.5,               // m fra possessore e palla
    kickFoot: 1.0,               // m: al contatto di un calcio il piede della clip piu' lontano di cosi' dalla palla
    detachedFrames: 15,
    unclaimedFrames: 30,         // palla accanto al destinatario che non la prende
    abandonedFrames: 360         // palla ferma e lontana da tutti
  };

  const S = window.__soak = {};

  S.init = async () => {
    const m = window.__m3d;
    const C = await import(new URL('src/js/match3d/config.js', location.href).href);
    S.C = C;
    cancelAnimationFrame(m.raf);
    // Bug trovato: il primo requestAnimationFrame arriva con un tempo precedente
    // all'avvio (macchina carica) e il passo negativo alzava tutti i giocatori
    // e mandava le animazioni all'indietro. Il vero frame() con un tempo di un
    // secondo prima non deve cambiare niente.
    const frame = Object.getPrototypeOf(m).frame;
    const lifts = m.everyone.map((p) => p.avatar.lift), clock = m.poss.clock;
    m.last = performance.now() + 1000;
    frame.call(m, performance.now());
    cancelAnimationFrame(m.raf);
    const moved = m.everyone.filter((p, i) => Math.abs(p.avatar.lift - lifts[i]) > 1e-6).length;
    S.startFlags = [];
    if (moved || m.poss.clock < clock) S.startFlags.push({ kind: 'avvio: un passo negativo cambia i giocatori o il tempo', sollevati: moved, tempo: +(m.poss.clock - clock).toFixed(3) });
    m.frame = () => {};          // niente disegno: il test avanza da solo
    m.controls.pollMenu = () => {};
    // niente controller veri: un pad collegato alla macchina (o che si
    // scollega, o Start premuto) metterebbe la partita in pausa
    m.controls.pad = null;
    m.controls._pollPad = () => null;
    m.onPad = m.onPadLost = () => {};
    S.m = m;
    S.frames = 0;
    S.v = {};
    S.st = new Map();
    S.stats = {
      shots: { home: 0, away: 0 }, slides: 0, tackles: 0, possession: { home: 0, away: 0 },
      noReach: 0, gestures: {}, runGestures: {}, kicks: {}, skateSum: 0, skateN: 0,
      duels: {}, foulKinds: {}, slideFrom: {}, through: 0, throughDone: 0, throughLost: 0, goalShots: [], replays: 0, kickoffs: 0, kickoffReceived: 0, kickoffWhistled: 0,
      kickFoot: { n: 0, sum: 0, max: 0, over: 0 }
    };
    S.byAvatar = new Map();
    for (const p of [...m.everyone, m.referee.p]) S.byAvatar.set(p.avatar, p);
    S.calibrate();
    S.hook();
    for (const f of S.startFlags) S.flag(f.kind, null, f);
    return { feetMax: S.feetMax, hipsRange: S.hipsRange, trackIssues: S.trackIssues };
  };

  // Altezza massima del piede piu' basso nelle clip di corsa (fase di volo):
  // oltre questa, piu' un margine, il giocatore fluttua. Le clip di corsa sono
  // quelle in ciclo della libreria caricata (blend tree, anim.js).
  S.calibrate = () => {
    const m = S.m, tpl = m.tpl, av = m.everyone[1].avatar;
    const Mixer = av.mixer.constructor;
    const holder = tpl.holder;
    const rig = {};
    holder.traverse((o) => { if (o.isBone) rig[o.name.replace(/^mixamorig\d*:?/, '')] = o; });
    const mx = new Mixer(holder);
    const wp = (b) => { b.updateWorldMatrix(true, false); const e = b.matrixWorld.elements; return e[13]; };
    let feetMax = 0, hipsLo = Infinity, hipsHi = -Infinity;
    const names = [...new Set(tpl.loco.slots.filter((x) => x.kind === 'cycle').map((x) => x.name))];
    S.cycleClips = names.length;
    for (const name of names) {
      const clip = tpl.clips[name];
      const a = mx.clipAction(clip);
      a.play();
      for (let i = 0; i < 48; i++) {
        a.time = i / 48 * clip.duration;
        mx.update(0);
        holder.updateMatrixWorld(true);
        const low = Math.min(wp(rig.LeftFoot), wp(rig.RightFoot), wp(rig.LeftToeBase), wp(rig.RightToeBase));
        feetMax = Math.max(feetMax, low);
        const h = wp(rig.Hips);
        hipsLo = Math.min(hipsLo, h); hipsHi = Math.max(hipsHi, h);
      }
      a.stop();
    }
    mx.stopAllAction();
    mx.uncacheRoot(holder);
    S.feetMax = feetMax;
    S.toeY = (tpl.gait.ground && tpl.gait.ground.toe) || 0.045;
    S.ankleY = (tpl.gait.ground && tpl.gait.ground.ankle) || 0.13;
    S.hipsRange = [hipsLo, hipsHi];
    // Le clip della libreria tolgono solo le tracce ferme nella posa di riposo
    // (il mixer riporta l'osso li'): le ossa del corpo le devono avere tutte,
    // o nella fusione quell'osso tornerebbe alla T-pose.
    const BODY = ['Hips', 'Spine', 'Spine1', 'Spine2', 'Neck', 'Head', 'LeftUpLeg', 'LeftLeg', 'LeftFoot', 'RightUpLeg', 'RightLeg', 'RightFoot',
      'LeftShoulder', 'LeftArm', 'LeftForeArm', 'LeftHand', 'RightShoulder', 'RightArm', 'RightForeArm', 'RightHand'];
    S.trackIssues = [];
    for (const name in tpl.meta) {
      const own = new Set(tpl.clips[name].tracks.map((t) => t.name.replace(/^mixamorig\d*/, '').replace(/\.(quaternion|position)$/, '')));
      const miss = BODY.filter((b) => !own.has(b));
      if (miss.length) S.trackIssues.push({ clip: name, missing: miss.length, sample: miss.slice(0, 4) });
    }
    if (S.trackIssues.length) S.flag('asset: clip con ossa senza traccia', null, { clips: S.trackIssues.map((t) => t.clip + ' ' + t.missing).join(', ') });
  };

  S.hook = () => {
    const m = S.m;
    const proto = Object.getPrototypeOf(m.everyone[0].avatar);
    if (!proto.__soakHooked) {
      const orig = proto.playOnce;
      proto.playOnce = function (name) {
        if (window.__soak && window.__soak.onGesture) window.__soak.onGesture(this, name);
        return orig.apply(this, arguments);
      };
      proto.__soakHooked = true;
    }
    const poss = m.poss, fly = poss.fly.bind(poss), loose = poss.loose.bind(poss), own = poss.own.bind(poss);
    poss.fly = (kind, from, to, cause) => {
      if (kind === 'tiro' && from && from.team) {
        S.stats.shots[from.team]++;
        // da dove si tira e come ci si e' arrivati (per capire da dove nascono i gol)
        const d = m.dirOf(from.team), gd = Math.hypot(d * 52.5 - from.pos.x, from.pos.z);
        let between = 0;
        for (const q of m.teams[m.otherSide(from.team)].players) if (!q.keeper && (q.pos.x - from.pos.x) * d > 0 && Math.abs(q.pos.z - from.pos.z) < gd * 0.4) between++;
        S.lastShot = { dist: Math.round(gd), between, before: S.prevKind && S.prevKind.team === from.team ? S.prevKind.kind : 'recupero' };
      } else if (from && from.team) S.prevKind = { kind, team: from.team };
      S.stats.kicks[kind] = (S.stats.kicks[kind] || 0) + 1;
      if (kind === 'filtrante') S.stats.through++;
      return fly(kind, from, to, cause);
    };
    const onGoal = m.onGoal.bind(m);
    m.onGoal = (side) => {
      const before = m.goals.home + m.goals.away;
      onGoal(side);
      if (m.goals.home + m.goals.away > before && S.lastShot) S.stats.goalShots.push(S.lastShot);
      S.lastShot = null;
    };
    // filtranti: presi dal destinatario o persi (li prende un avversario)
    poss.own = (p, cause) => {
      if (poss.flying && poss.kind === 'filtrante' && poss.from) {
        if (p === poss.to) S.stats.throughDone++;
        else if (p.team !== poss.from.team) S.stats.throughLost++;
      }
      return own(p, cause);
    };
    // falli per tipo di intervento e cartellino deciso
    const foul = m.rules.foul.bind(m.rules);
    m.rules.foul = (off, victim, info) => {
      const ok = foul(off, victim, info);
      if (ok && m.lastFoul) {
        const k = m.lastFoul.kind + ' ' + m.lastFoul.from + (m.lastFoul.promising ? ' promettente' : '') + (m.lastFoul.card ? ' ' + m.lastFoul.card : '');
        S.stats.foulKinds[k] = (S.stats.foulKinds[k] || 0) + 1;
      }
      return ok;
    };
    // scivolate: da dove arriva chi scivola rispetto al portatore. Da dietro
    // e' un intervento senza senso per l'IA (skill: solo ultima risorsa).
    const slide = m.startSlide.bind(m);
    m.startSlide = (p, dx, dz) => {
      const car = m.owner;
      let from = 'palla libera';
      if (car && car.team !== p.team) {
        const ax = p.pos.x - car.pos.x, az = p.pos.z - car.pos.z, l = Math.hypot(ax, az) || 1;
        const c = (ax * car.dirX + az * car.dirZ) / l;
        from = c > 0.45 ? 'davanti' : c < -0.3 ? 'dietro' : 'di lato';
        if (from === 'dietro' && p !== m.ctrl) S.flag('IA: scivolata da dietro', p, { portatore: S.tag(car) });
      }
      S.stats.slideFrom[from] = (S.stats.slideFrom[from] || 0) + 1;
      return slide(p, dx, dz);
    };
    // calcio: al contatto il piede della clip scelta e' sulla palla? (Ball_Bone
    // della libreria, clip adattata ai tempi del gioco). Posa dell'ultimo
    // disegno, spostata dove la fisica ha messo il giocatore.
    const kickNow = m.kickNow.bind(m);
    m.kickNow = (p, a) => {
      const b = m.ball, r = p.avatar.rig;
      if (m.canKick(p) && b.pos.y < 0.5 && p.avatar.one && p.avatar.one.a.getEffectiveWeight() > 0.5) {
        p.mesh.updateMatrixWorld(true);
        let d = Infinity;
        for (const k of ['LeftToeBase', 'RightToeBase', 'LeftFoot', 'RightFoot']) {
          const e = r[k].matrixWorld.elements;
          d = Math.min(d, Math.hypot(e[12] + p.pos.x - p.mesh.position.x - b.pos.x, e[14] + p.pos.z - p.mesh.position.z - b.pos.z));
        }
        const K = S.stats.kickFoot;
        K.n++; K.sum += d; K.max = Math.max(K.max, d);
        if (d > T.kickFoot) { K.over++; S.flag('calcio: piede lontano dalla palla al contatto', p, { clip: p.avatar.gestureName(), distanza: +d.toFixed(2), tipo: a.kind }); }
      }
      return kickNow(p, a);
    };
    poss.loose = (cause, from) => {
      if (cause === 'nessuno la raggiunge') S.stats.noReach++;
      return loose(cause, from);
    };
  };

  S.onGesture = (av, name) => {
    const p = S.byAvatar.get(av);
    const st = S.stats;
    st.gestures[name] = (st.gestures[name] || 0) + 1;
    const meta = S.m.tpl.meta[name];
    if (/^slide_tackle/.test(name) || (meta && meta.role === 'slide')) st.slides++;
    if (p && p.speed > T.runGestureSpeed) st.runGestures[name] = (st.runGestures[name] || 0) + 1;
  };

  S.clock = () => { const m = S.m; return m.rules && m.rules.clockText ? m.rules.clockText() + ' ' + m.rules.half + 'T' : ''; };

  S.tag = (p) => p ? (p === S.m.referee.p ? 'arbitro' : (p.team || '?') + ' ' + p.number + (p.keeper ? ' (portiere)' : '')) : '-';

  // Descrizione breve di un giocatore per gli esempi.
  S.describe = (p) => {
    if (!p) return {};
    const av = p.avatar, g = p.gait;
    const w = [];
    for (let i = 0; i < av.slots.length; i++) {
      const a = av.slots[i];
      if (a && g.w[i] > 0.05) w.push(a.getClip().name + ' ' + g.w[i].toFixed(2));
    }
    const act = [];
    const mx = av.mixer;
    for (let i = 0; i < mx._nActiveActions; i++) {
      const a = mx._actions[i];
      const ew = a.getEffectiveWeight();
      if (ew > 0.01) act.push(a.getClip().name + ' ' + ew.toFixed(2));
    }
    return {
      giocatore: S.tag(p), fase: S.m.phase, velocita: +p.speed.toFixed(2),
      passo: { velocita: +g.speed.toFixed(2), angolo: +g.ang.toFixed(2), busto_corsa: +Math.atan2(Math.sin(p.moveHeading - p.heading), Math.cos(p.moveHeading - p.heading)).toFixed(2),
        rotazione: +(Math.atan2(Math.sin(p.heading - p.prevHeading), Math.cos(p.heading - p.prevHeading)) / DT).toFixed(2), corpo: g.yaw !== undefined ? +g.yaw.toFixed(2) : null },
      azione: p.action ? Object.keys(p.action).filter((k) => p.action[k] === true).join('+') + (p.action.clip ? ' ' + p.action.clip : '') : null,
      gesto: av.one ? av.one.a.getClip().name : null, a_terra: !!p.down, pesi: w.join(', '), mixer: act.join(', ')
    };
  };

  S.flag = (kind, p, extra) => {
    let v = S.v[kind];
    if (!v) v = S.v[kind] = { count: 0, examples: [] };
    v.count++;
    if (v.examples.length < EXAMPLES) {
      const ex = Object.assign({ t: S.clock(), frame: S.frames }, S.describe(p), extra || {});
      const st = p && S.st.get(p);
      if (!v.examples.length && st && st.hist) ex.storia = ['frame velocita passo angolo corpo fase freq punta_sx punta_dx scivola pesi busto', ...st.hist.map((r) => r.join(' '))];
      v.examples.push(ex);
    }
  };

  // Una condizione che deve durare `need` fotogrammi prima di essere una violazione.
  S.persist = (st, key, bad, need, kind, p, extra) => {
    if (!bad) { st[key] = 0; return; }
    st[key] = (st[key] || 0) + 1;
    if (st[key] === need) S.flag(kind, p, extra);
  };

  const wy = (b) => b.matrixWorld.elements[13];

  S.checkPlayer = (p) => {
    const m = S.m, av = p.avatar, g = p.gait, mx = av.mixer;
    let st = S.st.get(p);
    if (!st) S.st.set(p, st = {});

    // 1. una sola locomozione, pesi che sommano 1
    let sum = 0, finite = true;
    for (let i = 0; i < g.w.length; i++) { const w = g.w[i]; if (!Number.isFinite(w) || w < -1e-6) finite = false; sum += w; }
    if (!finite || Math.abs(sum - 1) > T.weightTol) S.flag('locomozione: pesi del blend tree non sommano a 1', p, { somma: +sum.toFixed(3) });
    const slotSet = new Set();
    for (let i = 0; i < av.slots.length; i++) {
      const a = av.slots[i];
      if (!a) continue;
      slotSet.add(a);
      if (!a.isScheduled() || !a.enabled || a.loop !== LOOP_REPEAT) {
        S.flag('locomozione: clip della corsa spenta', p, { clip: a.getClip().name, attiva: a.isScheduled(), abilitata: a.enabled, ciclo: a.loop === LOOP_REPEAT });
      }
    }
    // le azioni della corsa si creano quando la fessura pesa: mai un peso senza azione
    for (let i = 0; i < g.w.length; i++) {
      if (g.w[i] > 0.02 && !av.slots[i]) S.flag('locomozione: fessura che pesa senza azione', p, { fessura: g.slots[i].name, peso: +g.w[i].toFixed(2) });
    }
    let total = 0, gestureW = 0;
    const one = av.one && av.one.a, prev = av.prevOne && av.prevOne.a;
    for (let i = 0; i < mx._nActiveActions; i++) {
      const a = mx._actions[i];
      const ew = a.getEffectiveWeight();
      total += ew;
      if (slotSet.has(a)) continue;
      gestureW += ew;
      if (a !== one && a !== prev && ew > 0.01) S.flag('mixer: clip estranea ancora attiva', p, { clip: a.getClip().name, peso: +ew.toFixed(2) });
    }
    if (total < 1 - T.weightTol) S.flag('mixer: pesi totali sotto 1 (entra la posa di riposo)', p, { somma: +total.toFixed(3) });
    if (total > 1 + T.weightTol) S.flag('mixer: pesi totali oltre 1', p, { somma: +total.toFixed(3) });

    // 2. piedi a terra
    p.mesh.updateMatrixWorld(true);
    const r = av.rig;
    const low = Math.min(wy(r.LeftFoot), wy(r.RightFoot), wy(r.LeftToeBase), wy(r.RightToeBase));
    const free = gestureW < 0.02 && !p.action && !p.down && !p.sentOff;
    S.persist(st, 'float', free && low > S.feetMax + T.floatMargin, T.floatFrames, 'piedi staccati da terra (fluttua)', p, { piede_piu_basso: +low.toFixed(3), soglia: +(S.feetMax + T.floatMargin).toFixed(3), anca: +wy(r.Hips).toFixed(3), sollevato: +av.lift.toFixed(3) });
    S.persist(st, 'sink', low < T.sink, 3, 'piedi sotto terra', p, { piede_piu_basso: +low.toFixed(3) });
    S.persist(st, 'air', !free && low > T.airborneMax, T.airborneFrames, 'in aria troppo a lungo durante un gesto', p, { piede_piu_basso: +low.toFixed(3) });

    // 3. mai clip ferme mentre il giocatore si muove
    const sig = r.LeftUpLeg.quaternion.x + r.RightUpLeg.quaternion.x * 3 + r.LeftLeg.quaternion.x * 7;
    const still = st.sig !== undefined && Math.abs(sig - st.sig) < 1e-6;
    st.sig = sig;
    S.persist(st, 'frozen', free && g.speed > T.frozenSpeed && still, T.frozenFrames, 'animazione ferma mentre corre', p, { velocita_passo: +g.speed.toFixed(2) });

    // 4. clip coerente con velocita' e azione
    if (free) {
      // quota ferma (idle e guardia del portiere) attesa per la velocita' del passo
      // quota ferma attesa: per ogni stile, sotto la sua camminata si e' fermi
      let want = 0;
      for (const st in g.sw) want += g.sw[st] * (1 - Math.min(1, Math.max(0, g.speed / g.L.styles[st].walk)));
      const still = 1 - g.moving;
      S.persist(st, 'incoh', Math.abs(still - want) > T.incoherent, T.incoherentFrames, 'clip incoerente con la velocita\'', p, { fermo: +still.toFixed(2), atteso: +want.toFixed(2) });
    } else st.incoh = 0;
    const a = p.action;
    if (a && a.clip && one && gestureW > 0.3 && a.t < a.end) {
      const name = one.getClip().name;
      if (name !== a.clip) S.flag('gesto diverso dall\'azione', p, { clip: name });
    }
    const holding = av.one && av.one.t < av.one.hold;
    S.persist(st, 'runGesture', holding && !av.one.loco && gestureW > 0.3 && !a && !p.down && m.phase === 'play' && p.speed > T.runGestureSpeed,
      3, 'gesto da fermo durante la corsa', p, { clip: one ? one.getClip().name : null });
    S.persist(st, 'stuckGesture', one && av.one.hold === Infinity && !a && !p.down && !p.holding && m.phase === 'play', 30, 'gesto senza fine rimasto attivo in gioco', p, { clip: one ? one.getClip().name : null });

    // angolo fra corsa e busto del blend tree: sempre in [-pi, pi] (bug: cresceva senza limiti e la corsa spariva)
    if (!(Math.abs(g.ang) <= Math.PI + 1e-6)) S.flag('locomozione: angolo corsa-busto fuori da [-pi, pi]', p, { angolo: +g.ang.toFixed(2) });

    // piedi che scivolano: il piede piu' basso, appoggiato piatto (punta e
    // tallone a terra), si muove sul terreno (stessa misura di gait-bench.js).
    // Punta sola a terra: spinta o piede in volo che sfiora l'erba, non conta.
    const cur = {};
    for (const k of ['LeftToeBase', 'RightToeBase', 'LeftFoot', 'RightFoot']) { const e = r[k].matrixWorld.elements; cur[k] = { x: e[12], y: e[13], z: e[14] }; }
    const side = cur.LeftToeBase.y < cur.RightToeBase.y ? 'Left' : 'Right', k = side + 'ToeBase', f = cur[k], pf = st.toes && st.toes[k];
    const flat = f.y < S.toeY + T.stanceY && cur[side + 'Foot'].y < S.ankleY + T.heelY;
    const stance = !!pf && flat && Math.abs(f.y - pf.y) / DT < 0.6 && m.phase !== 'goal';
    const skate = stance ? Math.hypot(f.x - pf.x, f.z - pf.z) / DT : 0;
    st.toes = cur;
    st.skate = (st.skate || 0) + (skate - (st.skate || 0)) * 0.2;
    // storia recente del giocatore, allegata al primo esempio di ogni violazione
    const h = st.hist || (st.hist = []);
    h.push([S.frames, +p.speed.toFixed(2), +g.speed.toFixed(2), +g.ang.toFixed(2), +(g.yaw || 0).toFixed(2), +g.phase.toFixed(3), +(g.freq || 0).toFixed(2),
      +cur.LeftToeBase.y.toFixed(3), +cur.RightToeBase.y.toFixed(3), +skate.toFixed(2), Array.from(g.w).map((w) => Math.round(w * 100)).join('/'), +(p.heading).toFixed(2)]);
    if (h.length > 40) h.shift();
    if (free && p.speed > T.frozenSpeed) { S.stats.skateSum += st.skate; S.stats.skateN++; }
    S.persist(st, 'skating', free && stance && p.speed > T.frozenSpeed && st.skate > T.skateSpeed && st.skate > T.skateShare * p.speed, T.skateFrames, 'piedi che scivolano sul terreno', p, { scivolata_ms: +st.skate.toFixed(2) });

    // 5. numeri validi
    if (!Number.isFinite(p.pos.x) || !Number.isFinite(p.pos.z) || !Number.isFinite(wy(r.Hips))) S.flag('posizione non valida (NaN)', p);
  };

  S.checkBall = () => {
    const m = S.m, b = m.ball, poss = m.poss, st = S.ballSt || (S.ballSt = {});
    const C = S.C.CONTROL;
    if (!Number.isFinite(b.pos.x) || !Number.isFinite(b.pos.y) || !Number.isFinite(b.pos.z)) S.flag('palla: posizione non valida (NaN)', null);
    if (poss.owned) {
      const o = poss.owner;
      if (!m.everyone.includes(o)) S.flag('palla: possessore non in campo', o);
      const d = Math.hypot(b.pos.x - o.pos.x, b.pos.z - o.pos.z);
      // a gioco fermo (riprese) chi batte tiene la palla ferma sul punto mentre ci arriva
      S.persist(st, 'detached', m.phase === 'play' && d > T.detached, T.detachedFrames, 'palla: staccata dal possessore', o, { distanza: +d.toFixed(2) });
      S.stats.possession[o.team] += DT;
    } else st.detached = 0;
    const to = poss.flying ? poss.to : null;
    const near = to && !to.down && Math.hypot(b.pos.x - to.pos.x, b.pos.z - to.pos.z) < C.receiveRadius && b.pos.y < C.trapHeight;
    S.persist(st, 'unclaimed', !!near && m.phase === 'play' && b.live, T.unclaimedFrames, 'palla: il destinatario non la controlla', to);
    let nearest = Infinity;
    if (poss.free && b.live && m.phase === 'play') for (const p of m.everyone) nearest = Math.min(nearest, Math.hypot(p.pos.x - b.pos.x, p.pos.z - b.pos.z));
    S.persist(st, 'abandoned', poss.free && b.live && m.phase === 'play' && Math.hypot(b.vel.x, b.vel.z) < 0.3 && nearest > 2, T.abandonedFrames, 'palla: orfana, ferma e lontana da tutti', null, { piu_vicino: +nearest.toFixed(1) });
  };

  S.checkActions = () => {
    const m = S.m;
    for (const p of m.everyone) {
      const st = S.st.get(p);
      if (!st) continue;
      if (p.action && p.action !== st.lastAction && p.action.tackle) S.stats.tackles++;
      st.lastAction = p.action;
    }
    // esito dei contrasti in piedi
    if (m.lastDuel && m.lastDuel !== S.lastDuel) {
      S.lastDuel = m.lastDuel;
      S.stats.duels[m.lastDuel.result] = (S.stats.duels[m.lastDuel.result] || 0) + 1;
    }
  };

  // Difesa di squadra (skill: "mai tutti sulla palla"): al massimo due
  // difensori di movimento addosso al portatore per piu' di un secondo.
  S.checkDefense = () => {
    const m = S.m, poss = m.poss, st = S.defSt || (S.defSt = {});
    let crowd = 0, car = null;
    if (poss.owned && m.phase === 'play' && !poss.owner.keeper) {
      car = poss.owner;
      for (const q of m.teams[m.otherSide(car.team)].players) {
        if (!q.keeper && !q.down && Math.hypot(q.pos.x - car.pos.x, q.pos.z - car.pos.z) < 3.5 && q.aiState === 'PRESSING') crowd++;
      }
    }
    S.persist(st, 'crowd', crowd > 2, 60, 'difesa: piu\' di due in pressione sul portatore', car, { in_pressione: crowd });
    // filtrante: chi lo riceve corre fino alla palla, non si ferma ad aspettarla
    // (quasi fermo con la palla lontana; girarsi piano verso di lei e' permesso)
    const to = poss.flying && poss.kind === 'filtrante' ? poss.to : null;
    const b = m.ball;
    const waiting = !!to && !to.down && !to.action && m.phase === 'play' && Math.hypot(b.pos.x - to.pos.x, b.pos.z - to.pos.z) > 3 && to.speed < 1;
    S.persist(st, 'throughStop', waiting, 20, 'filtrante: il ricevente si ferma prima della palla', to, { distanza_palla: to ? +Math.hypot(b.pos.x - to.pos.x, b.pos.z - to.pos.z).toFixed(1) : null });
  };

  // Dopo il gol (skill: "Dopo il gol"): il replay parte, finisce e non
  // rompe le pose; poi calcio d'inizio senza attesa, gia' pronto.
  S.checkGoal = () => {
    const m = S.m, st = S.goalSt || (S.goalSt = {});
    if (m.phase === 'goal' && !st.goal) { st.goal = true; st.t = 0; st.sawReplay = false; }
    if (st.goal) {
      st.t += DT;
      if (m.replay) {
        if (!st.sawReplay) { st.sawReplay = true; S.stats.replays++; }
        for (const p of m.everyone) if (!Number.isFinite(p.mesh.position.x) || !Number.isFinite(p.avatar.rig.Hips.quaternion.w)) { S.flag('replay: posa non valida', p); break; }
      }
      if (m.phase !== 'goal') {
        st.goal = false;
        if (!st.sawReplay) S.flag('replay: il gol non ha avuto il replay', null, { secondi: +st.t.toFixed(1) });
        if (m.phase !== 'kickoff' || !m.rules.set || !m.rules.set.ready) S.flag('dopo il gol: calcio d\'inizio non pronto', null, { fase: m.phase });
      } else if (st.t > 20) { S.flag('dopo il gol: la sequenza non finisce', null, { secondi: +st.t.toFixed(1) }); st.t = -1e9; }
    }
  };

  // Calcio d'inizio (skill: "Calcio d'inizio"): all'avvio ognuno nella sua
  // meta' (chi batte puo' stare sulla linea), avversari fuori dal cerchio, due
  // di chi batte al centro; poi il tocco corto arriva al compagno.
  S.checkKickoff = () => {
    const m = S.m, st = S.koSt || (S.koSt = {});
    const ko = m.phase === 'kickoff' && m.rules.set && m.rules.set.ready;
    if (ko && !st.ko) {
      st.ko = true;
      const s = m.rules.set, R = 9.15;
      let center = 0;
      for (const p of m.everyone) {
        if (p.down) continue;
        const own = p.pos.x * m.dirOf(p.team), r = Math.hypot(p.pos.x, p.pos.z);
        if (own > 0.3 && p !== s.taker) { S.flag('calcio d\'inizio: giocatore nella meta\' avversaria', p, { x: +p.pos.x.toFixed(2) }); break; }
        if (p.team !== s.side && r < R - 0.3) { S.flag('calcio d\'inizio: avversario nel cerchio', p, { distanza: +r.toFixed(2) }); break; }
        if (p.team === s.side && r < 3.5) center++;
      }
      if (center < 2) S.flag('calcio d\'inizio: meno di due giocatori al centro', s.taker, { al_centro: center });
      S.stats.kickoffs++;
    } else if (m.phase !== 'kickoff') st.ko = false;
    const poss = m.poss, last = poss.log[poss.log.length - 1];
    if (poss.flying && last && last.cause === 'calcio d\'inizio' && st.seq !== poss.seq) { st.seq = poss.seq; st.to = poss.to; st.t = 0; }
    if (st.to) {
      st.t += DT;
      if (poss.owned && poss.owner === st.to) { S.stats.kickoffReceived++; st.to = null; }
      // tempo scaduto col tocco ancora in viaggio: il fischio lo interrompe
      else if (m.phase === 'halftime' || m.phase === 'end') { S.stats.kickoffWhistled++; st.to = null; }
      else if (st.t > 3 || (poss.owned && poss.owner !== st.to)) { S.flag('calcio d\'inizio: il compagno non riceve il tocco', st.to); st.to = null; }
    }
  };

  // Avanza di `n` passi controllando dopo ognuno; si ferma a fine partita.
  S.run = (n, maxClock) => {
    const m = S.m;
    for (let i = 0; i < n && m.phase !== 'end'; i++) {
      m.advance(DT);
      S.frames++;
      // durante il replay le pose sono quelle registrate: la corsa non si controlla
      if (!m.replay) {
        for (const p of m.everyone) S.checkPlayer(p);
        S.checkPlayer(m.referee.p);
      }
      S.checkBall();
      S.checkActions();
      S.checkDefense();
      S.checkGoal();
      S.checkKickoff();
      if (maxClock && m.poss.clock >= maxClock) break;
    }
    return { done: m.phase === 'end' || (maxClock && m.poss.clock >= maxClock), frames: S.frames, clock: S.clock(), phase: m.phase, goals: { ...m.goals }, violations: Object.values(S.v).reduce((s, v) => s + v.count, 0) };
  };

  S.report = () => {
    const m = S.m;
    const count = (t) => m.cards.filter((c) => c.type === t).length;
    const own = S.stats.possession, tot = own.home + own.away || 1;
    return {
      frames: S.frames,
      seconds: +(S.frames * DT).toFixed(1),
      goals: { ...m.goals },
      stats: {
        goals: m.goals.home + m.goals.away,
        shots: S.stats.shots.home + S.stats.shots.away,
        slides: S.stats.slides,
        tackles: S.stats.tackles,
        fouls: m.stats.fouls.home + m.stats.fouls.away,
        yellows: count('yellow'),
        reds: count('red'),
        possessionHome: +(own.home / tot * 100).toFixed(1),
        noReach: S.stats.noReach,
        footSlide: +(S.stats.skateSum / Math.max(1, S.stats.skateN)).toFixed(3),
        tackleWon: S.stats.duels.won || 0,
        tackleFoul: S.stats.duels.foul || 0,
        tackleBeaten: S.stats.duels.beaten || 0,
        tackleMiss: S.stats.duels.vuoto || 0,
        throughBalls: S.stats.through,
        throughDone: S.stats.throughDone,
        throughLost: S.stats.throughLost,
        offsides: m.stats.offsides.home + m.stats.offsides.away,
        replays: S.stats.replays,
        kickoffs: S.stats.kickoffs,
        kickoffReceived: S.stats.kickoffReceived,
        kickoffWhistled: S.stats.kickoffWhistled,
        kickFootAvg: +(S.stats.kickFoot.sum / Math.max(1, S.stats.kickFoot.n)).toFixed(3),
        kickFootMax: +S.stats.kickFoot.max.toFixed(3)
      },
      foulKinds: S.stats.foulKinds,
      slideFrom: S.stats.slideFrom,
      goalShots: S.stats.goalShots,
      gestures: S.stats.gestures,
      // clip della libreria usate, per ruolo (skill: mappatura clip -> azione)
      roles: (() => {
        const out = {};
        for (const [name, n] of Object.entries(S.stats.gestures)) {
          const meta = m.tpl.meta[name], r = meta ? meta.role : 'mixamo';
          (out[r] || (out[r] = {}))[name] = n;
        }
        return out;
      })(),
      loco: (() => {
        const out = {};
        for (const p of [...m.everyone, m.referee.p]) for (const a of p.avatar.slots) if (a) out[a.getClip().name] = (out[a.getClip().name] || 0) + 1;
        return out;
      })(),
      anim: { level: m.animLevel, load: m.loadStats, cycles: S.cycleClips },
      runGestures: S.stats.runGestures,
      kicks: S.stats.kicks,
      violations: S.v
    };
  };
})();
