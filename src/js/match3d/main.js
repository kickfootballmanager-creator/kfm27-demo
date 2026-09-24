import * as THREE from 'three';
import { PHYSICS, RENDER, RULES, PLAYER, CONTROL, DRIBBLE, SHOT, PASS, KIT, RECEIVE, FIRST_TOUCH, ANIM, POWER, THROUGH, FEINT } from './config.js';
import { buildPitch } from './pitch.js';
import { Ball, shadowTexture } from './ball.js';
import { BroadcastCamera } from './camera.js';
import { Hud } from './hud.js';
import { Controls } from './controls.js';
import { buildSquad, kickoffPlacement, separate, choosePass, passAim, shotVelocity, pressure, chooseThrough, chooseCross, loftError } from './player.js';
import { loadPlayerModel, kitMaterial, rootAt, clipDuration } from './avatar.js';
import { Possession } from './possession.js';
import { Debug } from './debug.js';

const KICKS = ['pass', 'through', 'cross', 'shot'];

function wrapAngle(a) {
  a %= Math.PI * 2;
  if (a > Math.PI) a -= Math.PI * 2;
  if (a < -Math.PI) a += Math.PI * 2;
  return a;
}

const CSS_URL = new URL('../../styles/match3d.css', import.meta.url).href;

function loadCss() {
  if (document.querySelector('link[data-m3d-css]')) return Promise.resolve();
  return new Promise((resolve) => {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = CSS_URL;
    l.dataset.m3dCss = '1';
    l.onload = l.onerror = () => resolve();
    document.head.appendChild(l);
  });
}

function disposeScene(scene) {
  const seen = new Set();
  scene.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    const mats = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
    for (const m of mats) {
      if (seen.has(m)) continue;
      seen.add(m);
      for (const k in m) if (m[k] && m[k].isTexture) m[k].dispose();
      m.dispose();
    }
  });
}

function teamOf(t, fallback) {
  return { ...t, name: (t && t.name) || fallback, crest: (t && t.crest) || null };
}

// Colori dal manager se ci sono, altrimenti la divisa neutra del lato.
function kitOf(team, side) {
  const c = team && team.colors;
  return c && c.primary ? { ...KIT[side], ...c } : KIT[side];
}

function ring(inner, outer, opacity) {
  const m = new THREE.Mesh(
    new THREE.RingGeometry(inner, outer, 40),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity, depthWrite: false })
  );
  m.rotation.x = -Math.PI / 2;
  m.renderOrder = 4;
  m.visible = false;
  return m;
}

// Anton serve per i numeri disegnati sulle maglie: si aspetta poco, poi
// si ripiega su Impact.
function fontsReady() {
  if (!document.fonts || !document.fonts.load) return Promise.resolve();
  return Promise.race([
    document.fonts.load('78px Anton').catch(() => {}),
    new Promise((r) => setTimeout(r, 1500))
  ]);
}

class Match {
  constructor(opts, resolve) {
    this.opts = opts;
    this.resolve = resolve;
    this.home = teamOf(opts.home, 'Casa');
    this.away = teamOf(opts.away, 'Ospiti');
    this.goals = { home: 0, away: 0 };
    this.scorers = [];
    this.paused = false;
    this.pauseTimer = 0;       // attesa dopo gol o palla fuori
    this.acc = 0;
    this.last = 0;
    this.raf = 0;
    this.pixelRatio = Math.min(window.devicePixelRatio || 1, RENDER.maxPixelRatio);
    this.fps = { t: 0, n: 0 };
    this.handlers = [];
    this.userSide = opts.userSide === 'away' ? 'away' : 'home';
    // Primo tempo: la squadra di casa attacca la porta a destra (x > 0).
    this.attackDir = this.userSide === 'home' ? 1 : -1;
    this.opponents = [];
    this.poss = new Possession();
    this.ctrl = null;          // giocatore comandato dall'utente
    this.kickLock = null;
    this.path = [];            // traiettoria prevista della palla
    this.buffer = null;        // comando dato un attimo prima di avere la palla
    this.charging = null;      // pulsante tenuto premuto per la potenza
    this.charge = 0;
    this.barTimer = 0;
    this.passTarget = null;
  }

  // Chi ha la palla al piede (POSSEDUTA), altrimenti null.
  get owner() { return this.poss.owned ? this.poss.owner : null; }
  // Destinatario del pallone in volo, se c'e'.
  get receiver() { return this.poss.flying ? this.poss.to : null; }
  // Il calcio in preparazione (fra il comando e il contatto del piede).
  get windup() { const a = this.ctrl && this.ctrl.action; return a && a.kick ? a : null; }

  async start() {
    const [tpl] = await Promise.all([loadPlayerModel(), loadCss(), fontsReady()]);
    const root = document.createElement('div');
    root.className = 'm3d';
    document.body.appendChild(root);
    this.root = root;

    const r = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    r.setPixelRatio(this.pixelRatio);
    r.setSize(window.innerWidth, window.innerHeight);
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.domElement.tabIndex = 0;
    root.appendChild(r.domElement);
    this.renderer = r;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(RENDER.background);
    scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x2c3a24, 1.1));
    const sun = new THREE.DirectionalLight(0xffffff, 1.6);
    sun.position.set(-30, 60, 25);
    scene.add(sun);
    scene.add(buildPitch(r));
    this.scene = scene;

    this.ball = new Ball();
    scene.add(this.ball.mesh, this.ball.shadow);

    const userTeam = this.userSide === 'home' ? this.home : this.away;
    const kit = kitOf(userTeam, this.userSide);
    this.tpl = tpl;
    this.squad = buildSquad(userTeam, kit, this.attackDir, tpl, kitMaterial(tpl, kit), shadowTexture());
    for (const p of this.squad.players) { p.team = this.userSide; scene.add(p.shadow, p.mesh); }
    this.ctrlRing = ring(PLAYER.ringInner, PLAYER.ringOuter, 0.9);
    this.targetRing = ring(PLAYER.targetRingInner, PLAYER.targetRingOuter, 0.45);
    scene.add(this.ctrlRing, this.targetRing);

    this.hud = new Hud(root, { home: this.home, away: this.away, exitMode: this.opts.exitMode || 'career', overPower: SHOT.overPower }, {
      openExit: () => this.openExit(),
      resume: () => this.closeExit(),
      simulate: () => this.finish('simulate'),
      back: () => this.finish('back')
    });
    this.controls = new Controls(root, this.hud.layer);
    this.debug = new Debug(root, this);

    this.kickoff();
    this.camera = new BroadcastCamera(window.innerWidth / window.innerHeight);
    this.camera.snap(this.ball);
    this.ball.sync(1, 0);
    for (const p of this.squad.players) p.sync(1, 0);

    this._listen(window, 'resize', () => this.onResize());
    this._listen(window, 'keydown', (e) => this.onKey(e, true), true);
    this._listen(window, 'keyup', (e) => this.onKey(e, false), true);
    this._listen(document, 'visibilitychange', () => this.onVisibility());
    this._listen(root, 'contextmenu', (e) => e.preventDefault());

    try { if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {}); } catch (e) { /* non supportato */ }

    // Solo nella partita di prova: accesso dalla console per i test.
    if (this.opts.exitMode === 'test') window.__m3d = this;

    this.last = performance.now();
    this.raf = requestAnimationFrame((t) => this.frame(t));
  }

  _listen(target, type, fn, capture) {
    target.addEventListener(type, fn, capture);
    this.handlers.push([target, type, fn, capture]);
  }

  // I tasti non arrivano al manager che sta sotto la partita.
  onKey(e, down) {
    e.stopImmediatePropagation();
    if (e.key === 'Escape') {
      e.preventDefault();
      if (down) { if (this.hud.exitOpen) this.closeExit(); else this.openExit(); }
      return;
    }
    if (e.code === 'F3') {
      e.preventDefault();
      if (down && !e.repeat) this.debug.toggle();
      return;
    }
    if (this.hud.exitOpen) return;
    this.controls.key(e, down);
  }

  onVisibility() {
    if (document.hidden) { this.paused = true; this.stopInput(); }
    else if (!this.hud.exitOpen) this.paused = false;
    this.last = performance.now();
  }

  stopInput() {
    this.controls.reset();
    this.charging = null;
    this.buffer = null;
    this.hud.setPower(null);
  }

  onResize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(w, h);
    this.camera.resize(w / h);
  }

  openExit() { this.paused = true; this.stopInput(); this.hud.openExit(); }

  closeExit() {
    this.hud.closeExit();
    this.paused = false;
    this.last = performance.now();
    this.renderer.domElement.focus();
  }

  frame(now) {
    this.raf = requestAnimationFrame((t) => this.frame(t));
    const dt = Math.min(0.25, (now - this.last) / 1000);
    this.last = now;
    const step = 1 / PHYSICS.hz;

    if (!this.paused) {
      this.acc += dt;
      let n = 0;
      while (this.acc >= step && n < PHYSICS.maxSteps) {
        this.tick(step);
        this.acc -= step;
        n++;
      }
      if (n === PHYSICS.maxSteps) this.acc = 0;
      this.camera.update(this.ball, dt);
    }
    const alpha = this.paused ? 1 : this.acc / step;
    this.ball.sync(alpha, this.paused ? 0 : dt);
    for (const p of this.squad.players) p.sync(alpha, this.paused ? 0 : dt);
    this.syncMarkers(dt);
    this.renderer.render(this.scene, this.camera.cam);
    this.adaptResolution(dt);
    this.debug.update(dt);
  }

  syncMarkers(dt) {
    const c = this.ctrl, t = this.passTarget;
    this.ctrlRing.visible = !!c;
    if (c) this.ctrlRing.position.set(c.mesh.position.x, 0.02, c.mesh.position.z);
    this.targetRing.visible = !!t;
    if (t) this.targetRing.position.set(t.mesh.position.x, 0.02, t.mesh.position.z);

    if (this.charging) this.hud.setPower(this.charge);
    else if (this.barTimer > 0) {
      this.barTimer -= dt;
      if (this.barTimer <= 0) this.hud.setPower(null);
    }
  }

  // Calcio d'inizio: posizioni di partenza e palla al giocatore centrale.
  kickoff() {
    const sq = this.squad;
    kickoffPlacement(sq);
    const p = sq.players[sq.kickoff];
    this.ball.reset(p.pos.x + p.dirX * DRIBBLE.rest, p.pos.z + p.dirZ * DRIBBLE.rest);
    this.kickLock = this.buffer = null;
    for (const q of sq.players) q.action = null;
    this.setControlled(p);
    this.gain(p, "calcio d'inizio");
  }

  setControlled(p) {
    this.ctrl = p;
    this.hud.setPlayer(p.number, p.name);
  }

  switchTo(p) {
    if (p !== this.ctrl) this.setControlled(p);
  }

  // POSSEDUTA(p): la palla parte da dove si trova, attorno al giocatore.
  gain(p, cause) {
    this.poss.own(p, cause);
    const b = this.ball;
    p.ballAngle = Math.atan2(b.pos.x - p.pos.x, b.pos.z - p.pos.z);
    p.ballDist = Math.min(CONTROL.receiveRadius, Math.max(DRIBBLE.rest, Math.hypot(b.pos.x - p.pos.x, b.pos.z - p.pos.z)));
  }

  // Dopo un calcio chi calcia non la riprende subito.
  release(p, lockTime) {
    this.kickLock = { p, t: lockTime };
  }

  get lastTouch() { return this.poss.owned ? this.poss.owner : this.poss.from; }

  canKick(p) {
    const b = this.ball;
    if (!b.live) return false;
    if (this.owner === p) return true;
    if (this.owner || (this.kickLock && this.kickLock.p === p)) return false;
    return Math.hypot(b.pos.x - p.pos.x, b.pos.z - p.pos.z) < CONTROL.reach && b.pos.y < CONTROL.trapHeight;
  }

  tick(dt) {
    const b = this.ball;
    const inp = this.controls.read();
    const me = this.ctrl;
    if (inp.mag > 0 || inp.any) this.hud.hideHint();
    this.poss.tick(dt);

    if (this.kickLock && (this.kickLock.t -= dt) <= 0) this.kickLock = null;
    // Rete di sicurezza: un pallone che nessuno raggiunge torna libero.
    if (this.poss.flying && this.poss.age > RECEIVE.timeout) this.poss.loose('nessuno la raggiunge');

    // Movimento. Chi sta facendo un gesto lo finisce; il ricevente di un
    // passaggio va sulla palla qualunque cosa dica il joystick, fino al
    // primo tocco; gli altri finiscono la corsa rallentando.
    const withBall = this.owner === me;
    for (const p of this.squad.players) {
      if (p.action) this.stepAction(dt, p, p === me ? inp : null);
      else if (this.receiver === p) this.runToBall(dt, p);
      else if (p !== me) p.drive(dt, 0, 0, 0, { decel: PLAYER.coastDecel });
      else if (inp.mag > 0) {
        const mag = p.avatar.busy && !withBall ? inp.mag * ANIM.recoverMove : inp.mag;
        p.drive(dt, inp.x, inp.z, mag, { sprint: inp.sprint, withBall });
      } else if (inp.sprint && this.poss.free && b.live) this.runToBall(dt, p);
      else p.drive(dt, 0, 0, 0, { withBall });
    }
    separate(this.squad.players, (p) => p !== this.ctrl);
    for (const p of this.squad.players) p.confine();

    this.actions(dt, inp);

    const wasLive = b.live;
    if (this.owner) this.dribble(dt);
    else b.step(dt);
    if (!this.owner && b.live) this.contacts(inp);

    this.passTarget = null;
    const w = this.windup;
    if (w) this.passTarget = w.target || null;
    else if (this.owner === this.ctrl && b.live) {
      const ax = inp.mag > 0 ? inp.x : this.ctrl.dirX, az = inp.mag > 0 ? inp.z : this.ctrl.dirZ;
      this.passTarget = choosePass(this.ctrl, ax, az, this.squad.players, this.opponents, inp.mag > 0 ? PASS.cone : PASS.coneNoStick);
    }

    if (wasLive && b.scored) this.onGoal(b.scored);
    else if (wasLive && b.out) { this.poss.loose('fuori'); this.pauseTimer = RULES.outPause; }
    if (!b.live) {
      if (!this.poss.free) this.poss.loose(b.scored ? 'gol' : 'fuori');
      for (const p of this.squad.players) if (p.action && p.action.kick) p.action = null;
    }

    if (!b.live && this.pauseTimer > 0) {
      this.pauseTimer -= dt;
      if (this.pauseTimer <= 0) {
        this.hud.hideGoal();
        this.kickoff();
      }
    }
  }

  // Si tiene premuto per la potenza; il comando rilasciato senza palla vicina
  // aspetta CONTROL.buffer secondi. Ogni pulsante fa una cosa sola.
  actions(dt, inp) {
    const me = this.ctrl;
    if (!this.charging) {
      const k = KICKS.find((c) => inp.down[c]);
      if (k) { this.charging = k; this.charge = 0; }
    }
    if (this.charging) {
      this.charge = Math.min(1, this.charge + dt / POWER.chargeTime);
      if (inp.up[this.charging] || !inp.held[this.charging]) {
        this.buffer = { kind: this.charging, power: this.charge, t: CONTROL.buffer };
        this.charging = null;
        this.barTimer = POWER.barHide;
      }
    }
    if (inp.down.feint && this.owner === me) this.buffer = { kind: 'feint', t: CONTROL.buffer };

    if (!this.buffer || !me) return;
    if (me.action && !(me.action.feint && me.action.t >= me.action.cancelAt)) {
      if ((this.buffer.t -= dt) <= 0) this.buffer = null;
      return;
    }
    if (!this.canKick(me) || (this.buffer.kind === 'feint' && this.owner !== me)) {
      if ((this.buffer.t -= dt) <= 0) this.buffer = null;
      return;
    }
    const buf = this.buffer;
    this.buffer = null;
    if (buf.kind === 'feint') this.startFeint(me, inp);
    else this.startKick(me, buf.kind, buf.power, inp);
  }

  // Prepara il calcio: bersaglio scelto ora, palla che parte al contatto.
  startKick(p, kind, power, inp) {
    const b = this.ball;
    const ax = inp && inp.mag > 0 ? inp.x : p.dirX, az = inp && inp.mag > 0 ? inp.z : p.dirZ;
    const stick = !!(inp && inp.mag > 0);
    const mates = this.squad.players;
    const K = ANIM[kind];
    const a = { kick: true, kind, power, clip: K.clip, moveMag: K.moveMag, turn: K.turn, t: 0 };
    if (kind === 'pass') {
      a.target = choosePass(p, ax, az, mates, this.opponents, stick ? PASS.cone : PASS.coneNoStick, power);
      a.aim = passAim(p, b, a.target, ax, az);
    } else if (kind === 'through') {
      const c = chooseThrough(p, ax, az, mates, this.opponents, power);
      const e = loftError(p);
      a.target = c.mate;
      a.aim = { tx: c.tx + e.x * 0.5, tz: c.tz + e.z * 0.5, speedMul: 1 };
    } else if (kind === 'cross') {
      const c = chooseCross(p, ax, az, mates, this.opponents, power);
      const e = loftError(p);
      a.target = c.mate;
      a.cross = c.kind;
      a.apex = c.apex;
      a.aim = { tx: c.tx + e.x, tz: c.tz + e.z };
    } else {
      a.ax = ax; a.az = az; a.fromStick = stick;
      const v = shotVelocity(p, b, power, ax, az, stick);
      a.aim = { tx: b.pos.x + v.vx, tz: b.pos.z + v.vz };
    }
    a.dx = a.aim.tx - b.pos.x; a.dz = a.aim.tz - b.pos.z;
    // Palla al piede: la clip parte da K.start. Di prima: quasi al contatto.
    const from = this.owner === p ? K.start : Math.max(0, K.contact - ANIM.firstTime);
    a.contact = K.contact - from;
    a.end = a.contact + K.recover;
    p.avatar.playOnce(K.clip, from, a.end);
    p.action = a;
  }

  // Un passo del gesto in corso. I calci si girano verso il bersaglio e
  // calciano al contatto; i gesti con spostamento seguono la radice della clip.
  stepAction(dt, p, inp) {
    const a = p.action;
    a.t += dt * (a.rate || 1);
    if (a.kick) {
      p.drive(dt, a.dx, a.dz, a.moveMag, { withBall: this.owner === p, turnMul: a.turn });
      if (!a.done && a.t >= a.contact) { a.done = true; this.kickNow(p, a); }
    } else if (a.root) {
      const r = rootAt(this.tpl, a.clip, a.from + a.t);
      const da = r.a - a.r0.a, ds = r.s - a.r0.s;
      const fx = Math.sin(a.h0), fz = Math.cos(a.h0);
      p.moveTo(a.x0 + fx * da - fz * ds, a.z0 + fz * da + fx * ds, dt);
    }
    if (a.t >= a.end) {
      p.action = null;
      if (a.root) { p.speed = Math.min(p.speed, p.params.maxSpeed * PLAYER.jogFactor); p.moveHeading = p.heading; }
    }
  }

  // Finta: skill_spin verso il lato del joystick, la palla resta al piede.
  startFeint(p, inp) {
    let side = 'right';
    if (inp && inp.mag > 0) side = inp.x * p.rightX + inp.z * p.rightZ < 0 ? 'left' : 'right';
    else side = (p.feintSide = p.feintSide === 'right' ? 'left' : 'right');
    const clip = 'skill_spin_' + side;
    const dur = clipDuration(this.tpl, clip);
    if (!dur) return;
    p.avatar.playOnce(clip, 0, dur / FEINT.rate, FEINT.rate);
    p.action = {
      feint: true, root: true, clip, from: 0, t: 0, rate: FEINT.rate, end: dur, cancelAt: dur * FEINT.endCancel,
      x0: p.pos.x, z0: p.pos.z, h0: p.heading, r0: rootAt(this.tpl, clip, 0)
    };
  }

  kickNow(p, a) {
    const b = this.ball;
    if (!this.canKick(p)) return;
    if (a.kind === 'pass' || a.kind === 'through') {
      const t = a.target;
      const press = t ? Math.max(pressure(p, this.opponents), pressure(t, this.opponents)) : 0;
      const arrive = a.kind === 'pass' ? PASS.arriveSpeed + PASS.pressArrive * press + PASS.powerArrive * a.power : THROUGH.arriveSpeed;
      b.rollTo(a.aim.tx, a.aim.tz, arrive, a.aim.speedMul);
      this.poss.fly(a.kind === 'pass' ? 'passaggio' : 'filtrante', p, t);
    } else if (a.kind === 'cross') {
      b.lobTo(a.aim.tx, a.aim.tz, a.apex);
      this.poss.fly(a.cross, p, a.target);
    } else {
      const v = shotVelocity(p, b, a.power, a.ax, a.az, a.fromStick);
      b.kick(v.vx, v.vy, v.vz);
      this.poss.fly('tiro', p, null);
    }
    this.release(p, CONTROL.kickLock);
    if (a.target && p === this.ctrl) this.switchTo(a.target);
  }

  // Punto d'intercetto: il primo punto della traiettoria prevista, a
  // un'altezza controllabile, che il giocatore raggiunge prima della palla.
  intercept(p) {
    const path = this.ball.predict(this.path, RECEIVE.step, RECEIVE.horizon);
    const P = p.params;
    const catchUp = Math.max(0, P.maxSpeed - p.speed) / P.accel * 0.5;
    for (const s of path) {
      if (s.y > CONTROL.trapHeight) continue;
      const d = Math.max(0, Math.hypot(s.x - p.pos.x, s.z - p.pos.z) - CONTROL.trapRadius * 0.5);
      if (RECEIVE.reaction + catchUp + d / P.maxSpeed <= s.t) return s;
    }
    return path[path.length - 1];
  }

  // Si corre al massimo sul punto d'intercetto, frenando solo per non
  // superarlo; da vicino il busto guarda la palla.
  runToBall(dt, p) {
    const b = this.ball, s = this.intercept(p);
    const dx = s.x - p.pos.x, dz = s.z - p.pos.z, d = Math.hypot(dx, dz);
    const bx = b.pos.x - p.pos.x, bz = b.pos.z - p.pos.z;
    const face = Math.hypot(bx, bz) < RECEIVE.faceDist ? { x: bx, z: bz } : null;
    const brake = Math.sqrt(2 * PLAYER.decel * d) / p.params.maxSpeed;
    if (d > 0.15) p.drive(dt, dx, dz, Math.min(1, brake), { sprint: true, face });
    else p.drive(dt, 0, 0, 0, { face: face || { x: bx, z: bz } });
  }

  // Palla in coordinate polari attorno al giocatore (angolo nel campo): lo
  // segue a ogni passo e per cambiare lato gira attorno ai piedi, a velocita' limitata.
  dribble(dt) {
    const p = this.owner, b = this.ball, D = DRIBBLE;
    p.touchPhase += p.speed * D.touchRate * dt;
    const run = Math.min(1, p.speed / p.params.maxSpeed);
    const base = p.speed < 0.3 ? D.rest : D.walk + (D.sprint - D.walk) * run;
    const dist = base + D.swing * Math.min(1, p.speed / 3) * (0.5 + 0.5 * Math.sin(p.touchPhase));
    const want = p.heading - Math.atan2(D.side, dist);   // un po' a destra, sul piede che tocca
    const turn = wrapAngle(want - p.ballAngle);
    const step = D.turnRate * dt;
    p.ballAngle = wrapAngle(p.ballAngle + Math.max(-step, Math.min(step, turn)));
    p.ballDist += (dist - p.ballDist) * (1 - Math.exp(-D.follow * dt));
    // Mentre gira attorno ai piedi la palla si allarga: mai dentro le gambe.
    const r = Math.max(p.ballDist, D.rest * (1 + 0.4 * Math.min(1, Math.abs(turn))));
    const ang = p.ballAngle;
    let nx = p.pos.x + Math.sin(ang) * r, nz = p.pos.z + Math.cos(ang) * r;
    // Rispetto al giocatore la palla non va piu' veloce di D.maxRel: niente scatti.
    const rx = nx - b.pos.x - (p.pos.x - p.prev.x), rz = nz - b.pos.z - (p.pos.z - p.prev.z);
    const rl = Math.hypot(rx, rz), lim = D.maxRel * dt;
    if (rl > lim) { nx -= rx * (1 - lim / rl); nz -= rz * (1 - lim / rl); }
    b.carry(nx, nz, (nx - b.pos.x) / dt, (nz - b.pos.z) / dt);
  }

  // Il destinatario la controlla sempre entro receiveRadius, a ogni velocita';
  // i suoi compagni non gliela rubano; libera, la prende il piu' vicino.
  contacts(inp) {
    const b = this.ball, poss = this.poss;
    if (b.pos.y > CONTROL.trapHeight) return;
    const locked = (p) => this.kickLock && this.kickLock.p === p;
    const to = this.receiver;
    if (to && !locked(to) && !to.down && Math.hypot(b.pos.x - to.pos.x, b.pos.z - to.pos.z) < CONTROL.receiveRadius) {
      this.receive(to, inp, 'ricezione');
      return;
    }
    let best = null, bestD = CONTROL.trapRadius;
    for (const p of this.allPlayers()) {
      if (locked(p) || p.down || (p.action && p.action.root)) continue;
      if (to && p.team === poss.team) continue;
      const d = Math.hypot(b.pos.x - p.pos.x, b.pos.z - p.pos.z);
      if (d > bestD) continue;
      if (Math.hypot(b.vel.x - p.vel.x, b.vel.z - p.vel.z) > CONTROL.trapSpeed) continue;
      best = p; bestD = d;
    }
    if (!best) return;
    const cause = poss.flying && poss.team && poss.team !== best.team ? 'intercetto' : 'controllo';
    this.receive(best, inp, cause);
  }

  // Tutti i giocatori in campo (nel Blocco A solo la squadra dell'utente).
  allPlayers() { return this.squad.players; }

  receive(p, inp, cause) {
    this.gain(p, cause);
    if (p.team === this.userSide) this.switchTo(p);
    this.firstTouch(p, p === this.ctrl ? inp : null);
  }

  // Primo tocco: col joystick lontano dal busto la palla va subito da quella
  // parte e il giocatore si gira con lei, restando in possesso; da fermi,
  // senza joystick, si vede lo stop.
  firstTouch(p, inp) {
    if (inp && inp.mag > 0 && !this.buffer) {
      const ang = Math.acos(Math.max(-1, Math.min(1, inp.x * p.dirX + inp.z * p.dirZ)));
      if (ang > FIRST_TOUCH.minAngle) {
        const want = Math.atan2(inp.x, inp.z);
        p.heading = wrapAngle(p.heading + wrapAngle(want - p.heading) * FIRST_TOUCH.turn);
        p.moveHeading = want;
        p.ballDist = DRIBBLE.sprint + DRIBBLE.swing;
        return;
      }
    }
    if (p.speed < FIRST_TOUCH.receiveBelow && !p.avatar.busy) {
      const R = ANIM.receive;
      p.avatar.playOnce(R.clip, R.start, R.length);
    }
  }

  swapToNearest() {
    const b = this.ball;
    let best = null, bestD = Infinity;
    for (const p of this.squad.players) {
      if (p === this.ctrl) continue;
      const d = Math.hypot(b.pos.x - p.pos.x, b.pos.z - p.pos.z);
      if (d < bestD) { best = p; bestD = d; }
    }
    if (best) this.setControlled(best);
  }

  // side: verso della porta in cui e' entrata la palla. Segna chi attacca da quella parte.
  onGoal(side) {
    const team = side === this.attackDir ? this.userSide : (this.userSide === 'home' ? 'away' : 'home');
    const home = team === 'home';
    if (home) this.goals.home++; else this.goals.away++;
    const last = this.lastTouch;
    const scorer = last && last.team === team ? last.id : null;
    this.scorers.push({ team, playerId: scorer, minute: null });
    this.hud.setScore(this.goals.home, this.goals.away);
    this.hud.showGoal((home ? this.home : this.away).name);
    this.pauseTimer = RULES.goalPause;
  }

  // Risoluzione dinamica: sotto i 48 fps si scende, sopra i 58 si risale.
  adaptResolution(dt) {
    const f = this.fps;
    f.t += dt; f.n++;
    if (f.t < RENDER.sampleSeconds) return;
    const fps = f.n / f.t;
    f.t = 0; f.n = 0;
    const max = Math.min(window.devicePixelRatio || 1, RENDER.maxPixelRatio);
    let pr = this.pixelRatio;
    if (fps < RENDER.lowFps) pr = Math.max(RENDER.minPixelRatio, pr - RENDER.resStep);
    else if (fps > RENDER.highFps) pr = Math.min(max, pr + RENDER.resStep / 2);
    if (Math.abs(pr - this.pixelRatio) > 1e-3) {
      this.pixelRatio = pr;
      this.renderer.setPixelRatio(pr);
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
  }

  finish(exit) {
    cancelAnimationFrame(this.raf);
    for (const [t, type, fn, cap] of this.handlers) t.removeEventListener(type, fn, cap);
    this.handlers = [];
    try { if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); } catch (e) { /* non supportato */ }
    this.controls.destroy();
    this.debug.destroy();
    this.hud.destroy();
    for (const p of this.squad.players) p.avatar.dispose();
    disposeScene(this.scene);
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.root.remove();
    this.resolve({
      exit,
      homeGoals: this.goals.home,
      awayGoals: this.goals.away,
      scorers: this.scorers,
      stats: {}
    });
  }
}

// Unico punto d'ingresso: la futura schermata pre-partita chiamera' questa.
export function startMatch(opts) {
  return new Promise((resolve, reject) => {
    const m = new Match(opts || {}, resolve);
    m.start().catch((e) => {
      try { if (m.root) m.root.remove(); } catch (_) { /* gia' rimosso */ }
      reject(e);
    });
  });
}
