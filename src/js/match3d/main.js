import * as THREE from 'three';
import { PHYSICS, RENDER, RULES, PLAYER, CONTROL, DRIBBLE, SHOT, PASS, KIT, RECEIVE, FIRST_TOUCH, ANIM } from './config.js';
import { buildPitch } from './pitch.js';
import { Ball, shadowTexture } from './ball.js';
import { BroadcastCamera } from './camera.js';
import { Hud } from './hud.js';
import { Controls } from './controls.js';
import { buildSquad, kickoffPlacement, separate, choosePass, passAim, shotVelocity, pressure } from './player.js';
import { loadPlayerModel, kitMaterial } from './avatar.js';

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
    this.owner = null;         // giocatore con la palla al piede
    this.ctrl = null;          // giocatore comandato dall'utente
    this.pass = null;          // passaggio in viaggio verso un compagno
    this.kickLock = null;
    this.windup = null;        // passaggio o tiro fra il comando e il contatto del piede
    this.path = [];            // traiettoria prevista della palla
    this.buffer = null;        // comando dato un attimo prima di avere la palla
    this.charging = false;
    this.charge = 0;
    this.barTimer = 0;
    this.lastTouch = null;
    this.passTarget = null;
  }

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
    this.squad = buildSquad(userTeam, kit, this.attackDir, tpl, kitMaterial(tpl, kit), shadowTexture());
    for (const p of this.squad.players) scene.add(p.shadow, p.mesh);
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
    this.charging = false;
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
    this.ball.reset(p.pos.x + p.dirX * DRIBBLE.offset, p.pos.z + p.dirZ * DRIBBLE.offset);
    this.pass = this.kickLock = this.windup = this.buffer = null;
    this.setControlled(p);
    this.gain(p);
  }

  setControlled(p) {
    this.ctrl = p;
    this.hud.setPlayer(p.number, p.name);
  }

  switchTo(p) {
    if (p !== this.ctrl) this.setControlled(p);
  }

  gain(p) {
    this.owner = p;
    this.lastTouch = p;
    this.pass = null;
    p.knockTimer = DRIBBLE.knockEvery;
  }

  release(p, lockTime) {
    this.owner = null;
    this.lastTouch = p;
    this.kickLock = { p, t: lockTime };
  }

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
    if (inp.mag > 0 || inp.pass || inp.shootDown) this.hud.hideHint();

    if (this.kickLock && (this.kickLock.t -= dt) <= 0) this.kickLock = null;
    if (this.pass && (this.pass.age += dt) > RECEIVE.timeout) this.pass = null;
    if (inp.swap && this.owner !== me && !this.windup) this.swapToNearest();

    // Movimento. Il ricevente di un passaggio va sulla palla qualunque cosa
    // dica il joystick, fino al primo tocco; chi calcia si gira verso il
    // bersaglio; gli altri finiscono la corsa rallentando.
    const withBall = this.owner === me;
    for (const p of this.squad.players) {
      const w = this.windup;
      if (w && w.p === p) {
        p.drive(dt, w.dx, w.dz, w.moveMag, { withBall: this.owner === p, turnMul: w.turn });
      } else if (this.pass && this.pass.to === p && !this.owner) {
        this.runToBall(dt, p);
      } else if (p !== me) {
        p.drive(dt, 0, 0, 0, { decel: PLAYER.coastDecel });
      } else if (inp.mag > 0) {
        const mag = p.avatar.busy && !withBall ? inp.mag * ANIM.recoverMove : inp.mag;
        p.drive(dt, inp.x, inp.z, mag, { sprint: inp.sprint, withBall });
      } else if (inp.sprint && !this.owner && b.live) {
        this.runToBall(dt, p);
      } else {
        p.drive(dt, 0, 0, 0, { withBall });
      }
    }
    separate(this.squad.players, (p) => p !== this.ctrl);
    for (const p of this.squad.players) p.confine();

    this.actions(dt, inp);

    const wasLive = b.live;
    if (this.owner) this.dribble(dt);
    else b.step(dt);
    if (!this.owner && b.live) this.trap(inp);
    if (this.pass && !b.live) this.pass = null;

    this.passTarget = null;
    if (this.windup) this.passTarget = this.windup.target || null;
    else if (this.owner === this.ctrl && b.live) {
      const ax = inp.mag > 0 ? inp.x : this.ctrl.dirX, az = inp.mag > 0 ? inp.z : this.ctrl.dirZ;
      this.passTarget = choosePass(this.ctrl, ax, az, this.squad.players, this.opponents, inp.mag > 0 ? PASS.cone : PASS.coneNoStick);
    }

    if (wasLive && b.scored) this.onGoal(b.scored);
    else if (wasLive && b.out) this.pauseTimer = RULES.outPause;
    if (!b.live) { this.owner = null; this.windup = null; }

    if (!b.live && this.pauseTimer > 0) {
      this.pauseTimer -= dt;
      if (this.pauseTimer <= 0) {
        this.hud.hideGoal();
        this.kickoff();
      }
    }
  }

  // Passa e tira: il comando vale se la palla e' al piede o abbastanza
  // vicina, altrimenti resta in attesa per CONTROL.buffer secondi. Parte
  // l'animazione; la palla parte al contatto del piede (kickNow).
  actions(dt, inp) {
    if (inp.pass) this.buffer = { kind: 'pass', t: CONTROL.buffer };
    if (inp.shootDown && !this.charging) { this.charging = true; this.charge = 0; }
    if (this.charging) this.charge = Math.min(1, this.charge + dt / SHOT.chargeTime);
    if (this.charging && (inp.shootUp || !inp.shootHeld)) {
      this.charging = false;
      this.barTimer = SHOT.barHide;
      this.buffer = { kind: 'shot', power: this.charge, t: CONTROL.buffer };
    }

    const w = this.windup;
    if (w) {
      if ((w.t -= dt) <= 0) this.kickNow(w);
      return;
    }
    if (!this.buffer) return;
    const me = this.ctrl;
    if (!this.canKick(me)) {
      if ((this.buffer.t -= dt) <= 0) this.buffer = null;
      return;
    }
    const b = this.ball;
    const ax = inp.mag > 0 ? inp.x : me.dirX, az = inp.mag > 0 ? inp.z : me.dirZ;
    const K = this.buffer.kind === 'pass' ? ANIM.pass : ANIM.shot;
    const next = { p: me, kind: this.buffer.kind, moveMag: K.moveMag, turn: K.turn };
    if (next.kind === 'pass') {
      next.target = choosePass(me, ax, az, this.squad.players, this.opponents, inp.mag > 0 ? PASS.cone : PASS.coneNoStick);
      next.aim = passAim(me, b, next.target, ax, az);
      next.dx = next.aim.tx - b.pos.x; next.dz = next.aim.tz - b.pos.z;
    } else {
      next.power = this.buffer.power; next.ax = ax; next.az = az; next.fromStick = inp.mag > 0;
      const v = shotVelocity(me, b, next.power, ax, az, next.fromStick);
      next.dx = v.vx; next.dz = v.vz;
    }
    // Palla al piede: la clip parte da K.start. Di prima: quasi al contatto.
    const from = this.owner === me ? K.start : Math.max(0, K.contact - ANIM.firstTime);
    next.t = K.contact - from;
    me.avatar.playOnce(K.clip, from, next.t + K.recover);
    this.windup = next;
    this.buffer = null;
  }

  kickNow(w) {
    this.windup = null;
    const p = w.p, b = this.ball;
    if (!this.canKick(p)) return;
    if (w.kind === 'pass') {
      const t = w.target;
      const press = t ? Math.max(pressure(p, this.opponents), pressure(t, this.opponents)) : 0;
      const lofted = b.passTo(w.aim.tx, w.aim.tz, PASS.arriveSpeed + PASS.pressArrive * press, w.aim.speedMul);
      this.release(p, CONTROL.kickLock);
      if (t) {
        this.pass = { to: t, lofted, age: 0 };
        this.switchTo(t);
      }
    } else {
      const v = shotVelocity(p, b, w.power, w.ax, w.az, w.fromStick);
      b.kick(v.vx, v.vy, v.vz);
      this.release(p, CONTROL.kickLock);
    }
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

  dribble(dt) {
    const p = this.owner, b = this.ball, D = DRIBBLE, P = p.params;
    p.touchPhase += p.speed * D.touchRate * dt;
    const off = D.offset + D.swing * Math.min(1, p.speed / 3) * (0.5 + 0.5 * Math.sin(p.touchPhase));
    const tx = p.pos.x + p.dirX * off, tz = p.pos.z + p.dirZ * off;
    const k = 1 - Math.exp(-D.follow * dt);
    const nx = b.pos.x + (tx - b.pos.x) * k, nz = b.pos.z + (tz - b.pos.z) * k;
    b.carry(nx, nz, (nx - b.pos.x) / dt, (nz - b.pos.z) / dt);

    // In scatto la palla si allunga: si riprende quando la si raggiunge.
    if (!this.windup && p.sprinting && p.speed > P.maxSpeed * P.dribbleSpeed * D.knockAt) {
      if ((p.knockTimer -= dt) <= 0) {
        const s = p.speed * P.knock;
        b.kick(p.dirX * s, 0, p.dirZ * s);
        this.release(p, D.regainDelay);
        p.knockTimer = D.knockEvery;
      }
    }
  }

  trap(inp) {
    const b = this.ball;
    if (b.pos.y > CONTROL.trapHeight) return;
    let best = null, bestD = CONTROL.trapRadius;
    for (const p of this.squad.players) {
      if (this.kickLock && this.kickLock.p === p) continue;
      const d = Math.hypot(b.pos.x - p.pos.x, b.pos.z - p.pos.z);
      if (d > bestD) continue;
      if (Math.hypot(b.vel.x - p.vel.x, b.vel.z - p.vel.z) > CONTROL.trapSpeed) continue;
      best = p; bestD = d;
    }
    if (!best) return;
    this.gain(best);
    this.switchTo(best);
    this.firstTouch(best, inp);
  }

  // Primo tocco: col joystick lontano dal busto la palla va subito da quella
  // parte; da fermi, senza joystick, si vede lo stop.
  firstTouch(p, inp) {
    const b = this.ball;
    if (p === this.ctrl && inp.mag > 0 && !this.buffer) {
      const ang = Math.acos(Math.max(-1, Math.min(1, inp.x * p.dirX + inp.z * p.dirZ)));
      if (ang > FIRST_TOUCH.minAngle) {
        const s = Math.min(FIRST_TOUCH.max, Math.max(FIRST_TOUCH.min, p.speed + FIRST_TOUCH.push));
        b.kick(inp.x * s, 0, inp.z * s);
        this.release(p, FIRST_TOUCH.regain);
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

  onGoal(side) {
    const home = side > 0;
    if (home) this.goals.home++; else this.goals.away++;
    const team = home ? 'home' : 'away';
    const scorer = team === this.userSide && this.lastTouch ? this.lastTouch.id : null;
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
