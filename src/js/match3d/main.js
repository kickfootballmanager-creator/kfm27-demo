import * as THREE from 'three';
import { PHYSICS, RENDER, RULES, PLAYER, CONTROL, DRIBBLE, SHOT, PASS, KIT, RECEIVE, FIRST_TOUCH, ANIM, POWER, FEINT, AI, AERIAL, SHAPE, PITCH, SLIDE, BALL, DUEL, OFFSIDE, DEBUG, PRESS } from './config.js';
import { buildPitch } from './pitch.js';
import { Ball, shadowTexture } from './ball.js';
import { BroadcastCamera } from './camera.js';
import { Hud } from './hud.js';
import { Controls, glyph } from './controls.js';
import { buildTeam, separate, choosePass, passAim, shotVelocity, pressure, chooseThrough, chooseCross, loftError, headingOf, passSpeed, throughSpeed, throughPoint } from './player.js';
import { loadPlayerModel, kitMaterial, rootAt, clipDuration } from './avatar.js';
import { Possession } from './possession.js';
import { Debug } from './debug.js';
import { TeamAI } from './team-ai.js';
import { KeeperAI, HELD_Y } from './keeper.js';
import { startTackle, startSlide, tryAerial, startKeeperGesture } from './gestures.js';
import { Rules } from './rules.js';
import { userPress, stagger, beat } from './defense.js';
import { Referee } from './referee.js';
import { unlockAudio, closeAudio } from './audio.js';
import { SetPieces } from './setpieces.js';
import { Graphics } from './render.js';
import { Stadium } from './stadium.js';

const KICKS = ['pass', 'through', 'cross', 'shot'];
// Legenda: una riga per l'attacco e una per la difesa, un elemento per comando.
const hintRow = (title, items) => '<span class="m3d-hint-row"><span class="m3d-hint-h">' + title + '</span>' +
  items.map((t) => '<span class="m3d-hint-i">' + t + '</span>').join('') + '</span>';
const KEY_HINT = hintRow('Attacco', ['WASD muovi', 'J passaggio', 'U tiro', 'K cross', 'I filtrante', 'L scatto', 'E controllo stretto', 'O finta']) +
  hintRow('Difesa', ['J pressing, due volte contrasto', 'U raddoppio', 'K scivolata', 'I portiere', 'Q cambio']);

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const wrap01 = (x) => x - Math.floor(x);
const smoothstep = (a, b, x) => { const u = clamp((x - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };

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
    this.acc = 0;
    this.last = 0;
    this.raf = 0;
    this.handlers = [];
    this.userSide = opts.userSide === 'away' ? 'away' : 'home';
    // Primo tempo: la squadra di casa attacca la porta a destra (x > 0).
    this.attackDir = this.userSide === 'home' ? 1 : -1;
    this.opponents = [];
    this.difficulty = Math.max(0, Math.min(1, Number.isFinite(opts.difficulty) ? opts.difficulty : 0.5));
    this.phase = 'play';       // play | kickoff | restart | goal | halftime | end
    this.poss = new Possession();
    this.ctrl = null;          // giocatore comandato dall'utente
    this.kickLock = null;
    this.path = [];            // traiettoria prevista della palla
    this.buffer = null;        // comando dato un attimo prima di avere la palla
    this.charging = null;      // pulsante tenuto premuto per la potenza
    this.charge = 0;
    this.barTimer = 0;
    this.passTarget = null;
    this.cards = [];           // cartellini: { team, playerId, number, name, type, minute }
    this.stats = { fouls: { home: 0, away: 0 }, offsides: { home: 0, away: 0 } };
    this.offside = null;       // compagni in fuorigioco all'ultimo passaggio: { team, players }
    this.indirect = null;      // punizione indiretta appena battuta: { taker, seq }
    this.pendingIndirect = null;
    this.noOffsideSeq = -1;    // pallone da rimessa, angolo o rinvio: niente fuorigioco
    this.offSeq = -1;
    this.leaving = [];         // espulsi che escono dal campo
    this.lastInp = null;
    this.timeScale = 1;        // rallentatore di debug (F4)
    // IA contro IA (?match3d=auto, test di durata): nessun giocatore comandato
    this.auto = !!opts.auto;
  }

  get pixelRatio() { return this.gfx ? this.gfx.pixelRatio : 1; }

  // La squadra `side` e' comandata da una persona (non nel test IA contro IA).
  human(side) { return !this.auto && side === this.userSide; }

  // Chi ha la palla al piede (POSSEDUTA), altrimenti null.
  get owner() { return this.poss.owned ? this.poss.owner : null; }
  // Destinatario del pallone in volo, se c'e'.
  get receiver() { return this.poss.flying ? this.poss.to : null; }
  // Il calcio in preparazione (fra il comando e il contatto del piede).
  get windup() { const a = this.ctrl && this.ctrl.action; return a && a.kick ? a : null; }
  // Verso d'attacco di una squadra: +1 verso x positive.
  dirOf(side) { return side === this.userSide ? this.attackDir : -this.attackDir; }
  otherSide(side) { return side === 'home' ? 'away' : 'home'; }

  async start() {
    const [tpl] = await Promise.all([loadPlayerModel(), loadCss(), fontsReady()]);
    const root = document.createElement('div');
    root.className = 'm3d';
    document.body.appendChild(root);
    this.root = root;

    const r = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    r.setSize(window.innerWidth, window.innerHeight);
    r.domElement.tabIndex = 0;
    root.appendChild(r.domElement);
    this.renderer = r;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(RENDER.background);
    scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x2c3a24, 1.1));
    const sun = new THREE.DirectionalLight(0xffffff, 1.6);
    sun.position.set(-30, 60, 25);
    scene.add(sun);
    this.sun = sun;
    scene.add(buildPitch(r));
    this.stadium = new Stadium({ home: kitOf(this.home, 'home'), away: kitOf(this.away, 'away') });
    scene.add(this.stadium.group);
    this.scene = scene;

    this.ball = new Ball();
    scene.add(this.ball.mesh, this.ball.shadow);

    this.tpl = tpl;
    const shadow = shadowTexture();
    this.teams = {};
    for (const side of ['home', 'away']) {
      const data = side === 'home' ? this.home : this.away;
      const kit = kitOf(data, side);
      const gk = side === 'home' ? KIT.keeperHome : KIT.keeperAway;
      const players = buildTeam(data, side, this.dirOf(side), tpl, kitMaterial(tpl, kit), kitMaterial(tpl, gk), shadow, kit, gk);
      for (const p of players) scene.add(p.shadow, p.mesh);
      const skill = side === this.userSide ? AI.mateDifficulty : this.difficulty;
      const t = { side, players, keeper: players[0] };
      t.ai = new TeamAI(this, side, players, skill);
      t.keeperAI = new KeeperAI(this, side, players[0], skill);
      this.teams[side] = t;
    }
    this.squad = this.teams[this.userSide];
    this.opponents = this.teams[this.userSide === 'home' ? 'away' : 'home'].players;
    this.everyone = [...this.teams.home.players, ...this.teams.away.players];
    // arbitro: segue l'azione, non tocca la palla, gli altri non lo attraversano
    this.referee = new Referee(this, tpl, shadow);
    this.referee.place(0, -12);
    scene.add(this.referee.shadow, this.referee.mesh, this.referee.card);
    this.bodies = [...this.everyone, this.referee.p];
    // calci piazzati: mira, traiettoria, barriera, telecamera
    this.setpieces = new SetPieces(this);
    scene.add(this.setpieces.mesh);
    this.ctrlRing = ring(PLAYER.ringInner, PLAYER.ringOuter, 0.9);
    this.targetRing = ring(PLAYER.targetRingInner, PLAYER.targetRingOuter, 0.45);
    scene.add(this.ctrlRing, this.targetRing);

    this.hud = new Hud(root, { home: this.home, away: this.away, exitMode: this.opts.exitMode || 'career', overPower: SHOT.overPower }, {
      openExit: () => this.openExit(),
      resume: () => this.closeExit(),
      simulate: () => this.finish('simulate'),
      back: () => this.finish('back'),
      quality: (level) => this.gfx.setLevel(level)
    });
    this.controls = new Controls(root, this.hud.layer, {
      onPad: (type) => this.onPad(type),
      onPadLost: () => this.onPadLost(),
      onPause: () => { if (this.phase === 'end') return; if (this.hud.exitOpen) this.closeExit(); else this.openExit(); },
      onMenu: (a) => { if (this.hud.exitOpen) this.hud.menu(a); }
    });
    this.hud.setHint(this.controls.padKind ? this.padHint(this.controls.padKind) : KEY_HINT);
    this.debug = new Debug(root, this);

    this.rules = new Rules(this, this.opts.durationMinutes);
    this.rules.kickoff(this.userSide);
    this.camera = new BroadcastCamera(window.innerWidth / window.innerHeight);
    this.camera.snap(this.ball);
    this.gfx = new Graphics(r, scene, this.camera.cam, this.sun, (level, shadows, chosen) => this.applyLevel(level, shadows, chosen));
    this.ball.sync(1, 0);
    for (const p of this.everyone) p.sync(1, 0);
    this.referee.sync(1, 0, this.camera.cam);

    this._listen(window, 'resize', () => this.onResize());
    // audio (fischietto) sbloccato al primo tocco o tasto, come vogliono i browser mobili
    this._listen(window, 'pointerdown', () => unlockAudio(), true);
    this._listen(window, 'keydown', () => unlockAudio(), true);
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
    if (e.code === 'F4') {
      e.preventDefault();
      if (down && !e.repeat) this.timeScale = this.timeScale === 1 ? DEBUG.slowMotion : 1;
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

  // Livello di qualita' appena scelto: ombre vere o blob, densita' del pubblico.
  applyLevel(level, shadows, chosen) {
    this.shadows = shadows;
    for (const p of [...this.everyone, ...this.leaving, this.referee.p]) p.avatar.body.castShadow = shadows;
    this.ball.mesh.castShadow = shadows;
    this.stadium.setLevel(level);
    this.hud.setQuality(level, chosen);
  }

  // Con l'ombra dinamica le ombre blob restano solo fuori dal suo riquadro.
  blobShadows() {
    const B = RENDER.shadowBox, [a, b] = RENDER.blobFade, f = this.ball.pos;
    for (const p of [...this.everyone, this.referee.p]) {
      let o = 1;
      if (this.shadows) {
        const d = Math.max(Math.abs(p.mesh.position.x - f.x), Math.abs(p.mesh.position.z - f.z)) / B;
        o = Math.min(1, Math.max(0, (d - a) / (b - a)));
      }
      p.shadow.material.opacity = o;
      p.shadow.visible = o > 0.01;
    }
    this.ball.shadow.visible = !this.shadows;
  }

  onResize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.gfx.resize(w, h);
    this.camera.resize(w / h);
  }

  openExit() { this.paused = true; this.stopInput(); this.hud.openExit(); }

  closeExit() {
    if (this.phase === 'end') return;
    this.hud.closeExit();
    this.paused = false;
    this.last = performance.now();
    this.renderer.domElement.focus();
  }

  frame(now) {
    this.raf = requestAnimationFrame((t) => this.frame(t));
    const dt = Math.min(0.25, (now - this.last) / 1000) * this.timeScale;
    this.last = now;
    this.advance(dt);
    this.gfx.update(dt, this.ball.pos);
    this.gfx.render();
    this.debug.update(dt);
  }

  // Fisica a passo fisso per `dt` secondi reali, poi pose e animazioni
  // interpolate: tutto tranne il disegno. Il test di durata la chiama da solo.
  advance(dt) {
    const step = 1 / PHYSICS.hz;

    if (this.paused) this.controls.pollMenu();
    if (!this.paused) {
      this.acc += dt;
      let n = 0;
      while (this.acc >= step && n < PHYSICS.maxSteps) {
        this.tick(step);
        this.acc -= step;
        n++;
      }
      if (n === PHYSICS.maxSteps) this.acc = 0;
      const f = this.phase === 'goal' && this.cameraFocus;
      this.camera.setPiece(this.setpieces.pose());
      this.camera.update(f ? { pos: f.pos, vel: f.vel } : this.ball, dt);
    }
    const alpha = this.paused ? 1 : this.acc / step;
    this.ball.sync(alpha, this.paused ? 0 : dt);
    for (const p of this.everyone) p.sync(alpha, this.paused ? 0 : dt);
    for (const p of this.leaving) p.sync(alpha, this.paused ? 0 : dt);
    this.referee.sync(alpha, this.paused ? 0 : dt, this.camera.cam);
    this.placeHeldBall();
    this.setpieces.render(this.ctrl);
    this.hud.setPrompt(this.setpieces.prompt(glyph, this.controls.device, this.controls.padKind));
    this.syncMarkers(dt);
    this.blobShadows();
    this.stadium.update(this.paused ? 0 : dt);
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

  // Palla in mano: fra i due palmi veri (IK sulle braccia), dopo che
  // l'animazione e' stata applicata. La fisica la ritrova in avatar.heldAt.
  placeHeldBall() {
    const o = this.owner;
    if (!o || !o.holding) return;
    const v = this._hand || (this._hand = new THREE.Vector3());
    o.avatar.holdBall(v, BALL.radius, o.holdHand);
    this.ball.mesh.position.copy(v);
    this.ball.shadow.position.set(v.x, 0.012, v.z);
  }

  // Posizioni del calcio d'inizio, nella propria meta' campo; `side` batte.
  // `instant` (inizio di un tempo): tutti al loro posto subito; altrimenti
  // ognuno ci torna camminando o correndo (homeTarget, vedi settle).
  placeKickoff(side, instant = true) {
    const put = (p, x, z, h) => {
      if (instant) { p.place(x, z, h); p.homeTarget = null; } else p.homeTarget = { x, z, h };
    };
    for (const t of Object.values(this.teams)) {
      const d = this.dirOf(t.side);
      const block = { line: SHAPE.kickoff.line, len: SHAPE.kickoff.len, width: SHAPE.kickoff.width, ballZ: 0 };
      for (const p of t.players) {
        if (instant) { p.action = null; p.avatar.endGesture(); p.down = false; p.holding = false; p.keeperBusy = false; p.dropping = false; p.holdHand = null; }
        if (p.keeper) { put(p, -d * (PITCH.length / 2 - 1.5), 0, headingOf(d, 0)); continue; }
        const s = t.ai.shapeTarget(p, block);
        // nessuno dentro il cerchio di centrocampo, tranne chi batte
        const r = Math.hypot(s.x, s.z);
        if (r < PITCH.centerCircle + 0.5) { const k = (PITCH.centerCircle + 0.5) / Math.max(r, 0.1); s.x *= k; s.z *= k; }
        if (s.x * d > -0.5) s.x = -d * 0.5;
        put(p, s.x, s.z, headingOf(d, 0));
      }
    }
    const t = this.teams[side], d = this.dirOf(side);
    // batte l'attaccante piu' avanzato, il secondo gli sta accanto
    const fw = t.players.filter((p) => !p.keeper && !p.sentOff).sort((a, b) => a.slot.y - b.slot.y);
    put(fw[0], -d * 0.35, 0.25, headingOf(-d * 0.2, 1));
    put(fw[1], -d * 1.2, -8, headingOf(d, 0.4));
    this.kickLock = this.buffer = null;
    this.kickTaker = fw[0];
    return fw[0];
  }

  // A gioco fermo: chi ha un posto da raggiungere ci va camminando o
  // correndo (niente teletrasporti); chi esulta finisce l'esultanza.
  settle(dt, p) {
    const R = RULES;
    const celebrating = p.avatar.gestureName() === R.celebration.clip;
    const waiting = this.phase === 'goal' && this.rules.t < R.returnDelay;
    const t = p.homeTarget;
    if (!t || celebrating || waiting) { p.drive(dt, 0, 0, 0, {}); return; }
    p.goTo(dt, t.x, t.z, t.h);
  }

  kickoff(side = this.userSide) { this.rules.kickoff(side); }

  // Il giocatore di movimento di `list` piu' vicino a (x, z).
  nearestTo(list, x, z, skip) {
    let best = null, bd = Infinity;
    for (const p of list) {
      if (p.keeper || p === skip || p.down) continue;
      const d = Math.hypot(p.pos.x - x, p.pos.z - z);
      if (d < bd) { bd = d; best = p; }
    }
    return best;
  }

  nearestMate(p, x, z) { return this.nearestTo(this.teams[p.team].players, x, z, p); }

  // Ripresa degli avversari: anche il giocatore dell'utente lo sistema l'IA
  // (barriera, distanza), come in PES.
  opponentsSetPiece() {
    const s = this.rules.set;
    return this.phase === 'restart' && !!s && s.side !== this.userSide;
  }

  // A palla libera i pulsanti restano quelli d'attacco: un tiro al volo e' sempre possibile.
  userAttacking() {
    const p = this.poss;
    if (p.owned) return p.owner.team === this.userSide;
    if (p.flying) return p.team === this.userSide;
    return true;
  }

  userMove(dt, p, inp, withBall) {
    const b = this.ball, o = this.owner;
    // controllo stretto (R2): passi corti, palla piu' vicina
    p.close = withBall && !!inp.held.close;
    if (!this.userAttacking() && this.phase === 'play') {
      // Pressing (X tenuto): sul portatore, poi marcatura stretta e contrasto
      // automatico (defense.js); senza portatore, sulla palla.
      if (inp.held.press) {
        if (o && o.team !== p.team && !o.holding) { userPress(this, p, o, inp, dt); return; }
        if (!o && b.live) { this.runToBall(dt, p); return; }
      }
      // Jockey (R2 + levetta): rivolti al portatore, passi laterali
      if (inp.held.jockey && o && o.team !== p.team && !o.holding) {
        p.drive(dt, inp.x, inp.z, inp.mag * PRESS.jockeyMag, { face: { x: o.pos.x - p.pos.x, z: o.pos.z - p.pos.z } });
        return;
      }
    }
    if (inp.mag > 0) {
      const mag = p.avatar.busy && !withBall ? inp.mag * ANIM.recoverMove : inp.mag;
      p.drive(dt, inp.x, inp.z, mag, { sprint: inp.sprint, withBall, close: p.close });
    } else if (inp.sprint && !o && b.live) this.runToBall(dt, p);
    else p.drive(dt, 0, 0, 0, { withBall });
  }

  // Levette dallo schermo al campo, secondo dove guarda la telecamera: in su
  // e' sempre "verso il fondo dello schermo", anche nei calci piazzati.
  mapInput(inp) {
    const f = this._fwd || (this._fwd = new THREE.Vector3());
    this.camera.cam.getWorldDirection(f);
    f.y = 0;
    if (f.lengthSq() < 1e-6) f.set(0, 0, -1);
    f.normalize();
    const rx = -f.z, rz = f.x;
    const to = (sx, sy) => ({ x: rx * sx - f.x * sy, z: rz * sx - f.z * sy });
    const m = to(inp.x, inp.z);
    inp.sx = inp.x; inp.sy = inp.z;
    inp.x = m.x; inp.z = m.z;
    if (inp.switchDir) inp.switchDir = to(inp.switchDir.x, inp.switchDir.y);
    if (inp.rs) { const r = to(inp.rs.x, inp.rs.y); inp.rs.fx = r.x; inp.rs.fz = r.z; }
    return inp;
  }

  // Controller collegato: avviso e legenda con i simboli del suo tipo.
  onPad(type) {
    this.hud.toast('Controller ' + (type === 'ps' ? 'PlayStation' : 'Xbox') + ' collegato');
    this.hud.setHint(this.padHint(type));
  }

  // Controller scollegato: la partita va in pausa.
  onPadLost() {
    this.hud.setHint(KEY_HINT);
    if (this.phase === 'end') return;
    this.openExit();
    this.hud.toast('Controller scollegato: partita in pausa');
  }

  padHint(t) {
    const g = (b, text) => glyph(b, t) + text;
    return hintRow('Attacco', [g('cross', 'passaggio'), g('square', 'tiro'), g('circle', 'cross'), g('triangle', 'filtrante'), g('r1', 'scatto'), g('r2', 'controllo stretto'), g('rs', 'finta')]) +
      hintRow('Difesa', [g('cross', 'pressing, due volte contrasto'), g('square', 'raddoppio'), g('circle', 'scivolata'), g('triangle', 'portiere'), g('l1', 'cambio')]);
  }

  // Palloni alti vicini: colpo di testa, rovesciata, respinta di testa.
  aerial(p, inp) {
    const b = this.ball, poss = this.poss;
    if (poss.owned || !b.live || p.action || p.down || p.keeper) return;
    if (b.pos.y < 0.9 && b.vel.y <= 0) return;
    if (Math.hypot(b.pos.x - p.pos.x, b.pos.z - p.pos.z) > 12) return;
    let intent = null;
    const mine = poss.team === p.team;
    if (p === this.ctrl) {
      if (inp && (inp.held.shot || (this.buffer && this.buffer.kind === 'shot'))) intent = mine || !poss.team ? 'shot' : 'clear';
      else if (inp && (inp.held.pass || inp.held.cross || (this.buffer && this.buffer.kind === 'pass'))) intent = mine ? 'pass' : 'clear';
      // in difesa il pallone alto si respinge con Quadrato o Cerchio, come in PES
      else if (inp && !mine && inp.btn && (inp.btn.held.square || inp.btn.held.circle)) intent = 'clear';
    } else if (this.receiver === p) {
      const d = this.dirOf(p.team);
      if (Math.hypot(d * PITCH.length / 2 - p.pos.x, p.pos.z) < 20) intent = 'shot';
    } else if (!mine && p.aiState === 'PRESSING') intent = 'clear';
    if (!intent) return;
    if (tryAerial(this, p, intent) && p === this.ctrl) { this.buffer = null; this.charging = null; }
  }

  // Primo punto della traiettoria che `p` raggiunge prima della palla, a
  // un'altezza giocabile. `beforeReceiver`: solo prima che arrivi al destinatario.
  interceptPoint(p, beforeReceiver) {
    const b = this.ball, poss = this.poss;
    const high = poss.flying && /cross|lancio|rinvio/.test(poss.kind || '');
    const maxY = high ? AERIAL.headMax : CONTROL.trapHeight;
    const path = b.predict(p.icPath || (p.icPath = []), RECEIVE.step, 3);
    const to = beforeReceiver ? poss.to : null;
    const P = p.params;
    for (const s of path) {
      if (to && Math.hypot(s.x - to.pos.x, s.z - to.pos.z) < 1.5) return null;
      if (s.y > maxY) continue;
      const d = Math.max(0, Math.hypot(s.x - p.pos.x, s.z - p.pos.z) - CONTROL.trapRadius * 0.6);
      if (RECEIVE.reaction + d / P.maxSpeed <= s.t) return s;
    }
    if (beforeReceiver) return null;
    const e = path[path.length - 1];
    return e ? { x: e.x, z: e.z, t: e.t + Math.hypot(e.x - p.pos.x, e.z - p.pos.z) / P.maxSpeed } : null;
  }

  // Zona della palla: fasce lungo il campo per fasce in larghezza.
  ballZone() {
    const b = this.ball.pos, Z = CONTROL.zones;
    return Math.floor(clamp((b.x + PITCH.length / 2) / (PITCH.length / Z[0]), 0, Z[0] - 1)) * Z[1] +
      Math.floor(clamp((b.z + PITCH.width / 2) / (PITCH.width / Z[1]), 0, Z[1] - 1));
  }

  // Cambio automatico in difesa: quando la palla passa agli avversari o torna
  // libera, e quando cambia zona, il comando va al giocatore piu' vicino.
  // Mai mentre l'utente sta pressando o marcando con il suo.
  autoSwitch(inp) {
    const poss = this.poss;
    const changed = poss.seq !== this.seenSeq;
    this.seenSeq = poss.seq;
    const zone = this.ballZone(), moved = zone !== this.seenZone;
    this.seenZone = zone;
    if (!changed && !moved) return;
    if (this.userAttacking() && !poss.free) return;
    if (inp && (inp.held.press || inp.held.jockey)) return;
    const b = this.ball;
    const x = poss.flying && poss.to ? poss.to.pos.x : b.pos.x, z = poss.flying && poss.to ? poss.to.pos.z : b.pos.z;
    const best = this.nearestTo(this.squad.players, x, z);
    if (!best || best === this.ctrl) return;
    const cur = this.ctrl ? Math.hypot(this.ctrl.pos.x - x, this.ctrl.pos.z - z) : Infinity;
    if (cur > Math.hypot(best.pos.x - x, best.pos.z - z) + CONTROL.switchMargin && !(this.ctrl && this.ctrl.action)) this.setControlled(best);
  }

  startTackle(p, manual) { return startTackle(this, p, manual); }

  // Fallo di `off` su `victim`: lo giudica l'arbitro (rules.foul). Con i
  // falli spenti, o a gioco fermo, il contrasto finisce come un dribbling riuscito.
  foul(off, victim, info = {}) {
    if (this.rules.foul(off, victim, { kind: info.kind || 'contrasto', ballFirst: !!info.ballFirst })) return;
    stagger(off, DUEL.stagger.beaten, true);
    if (this.owner === victim) beat(this, victim, off);
  }

  // Espulso: esce dal campo verso la linea laterale piu' vicina e la squadra
  // resta in inferiorita'.
  sendOff(p) {
    const t = this.teams[p.team];
    p.sentOff = true;
    p.action = null;
    p.avatar.proc = null;
    p.down = false;
    if (this.owner === p) this.poss.loose('fischio');
    for (const list of [t.players, this.everyone, this.bodies]) { const i = list.indexOf(p); if (i >= 0) list.splice(i, 1); }
    this.leaving.push(p);
    if (this.ctrl === p) this.setControlled(this.nearestTo(this.squad.players, p.pos.x, p.pos.z));
  }

  walkOff(dt) {
    for (const p of this.leaving) {
      if (!p.mesh.visible) continue;
      const side = Math.sign(p.pos.z) || 1;
      p.drive(dt, 0, side, 0.6, {});
      if (Math.abs(p.pos.z) > PITCH.width / 2 + PITCH.runoff - 1.5) { p.mesh.visible = false; p.shadow.visible = false; }
    }
  }

  // Fuorigioco: al momento di ogni passaggio si segnano i compagni di chi
  // calcia che stanno nella meta' avversaria, oltre la palla e oltre il
  // penultimo difensore. Non vale su rimessa, angolo e rinvio dal fondo.
  noteOffside() {
    const poss = this.poss;
    if (!poss.flying || poss.seq === this.offSeq) return;
    this.offSeq = poss.seq;
    this.offside = null;
    const k = poss.from;
    if (!RULES.offside || !k || !k.team || poss.seq === this.noOffsideSeq) return;
    const A = k.team, d = this.dirOf(A);
    const defs = this.teams[this.otherSide(A)].players.map((q) => q.pos.x * d).sort((a, c) => c - a);
    const line = defs.length > 1 ? defs[1] : PITCH.length / 2;
    const ballA = this.ball.pos.x * d;
    const set = new Set();
    for (const q of this.teams[A].players) {
      if (q === k || q.keeper) continue;
      const a = q.pos.x * d;
      if (a > 0 && a > ballA + OFFSIDE.margin && a > line + OFFSIDE.margin) set.add(q);
    }
    if (set.size) this.offside = { team: A, players: set };
  }

  // `p` sta per giocare la palla: se era in fuorigioco al passaggio, fischio.
  checkOffside(p) {
    const o = this.offside;
    if (!o) return false;
    this.offside = null;
    if (o.team !== p.team || !o.players.has(p) || this.phase !== 'play') return false;
    this.rules.offside(p);
    return true;
  }
  startSlide(p, dx, dz) { startSlide(this, p, dx, dz); }
  startKeeperGesture(k, clip, from, contact, end, rate, o) { startKeeperGesture(this, k, clip, from, contact, end, rate, o); }

  aiSummary() { return this.teams.home.ai.summary() + '\n' + this.teams.away.ai.summary(); }

  setControlled(p) {
    if (this.auto || !p) { this.ctrl = null; return; }
    this.ctrl = p;
    this.hud.setPlayer(p.number, p.name);
  }

  switchTo(p) {
    if (p !== this.ctrl) this.setControlled(p);
  }

  // POSSEDUTA(p): la palla parte da dove si trova, attorno al giocatore.
  gain(p, cause) {
    this.poss.own(p, cause);
    if (this.offside && this.offside.team !== p.team) this.offside = null;
    p.holding = false;
    p.shield = 0;
    p.holdHand = null;
    p.dropping = false;
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
    const inp = this.mapInput(this.controls.read(dt));
    this.lastInp = inp;
    const me = this.ctrl;
    if (inp.mag > 0 || inp.any) this.hud.hideHint();
    this.poss.tick(dt);

    if (this.kickLock && (this.kickLock.t -= dt) <= 0) this.kickLock = null;
    for (const p of this.everyone) {
      if (p.stagger > 0) p.stagger = Math.max(0, p.stagger - dt);
      if (p.burst > 0) p.burst = Math.max(0, p.burst - dt);
    }
    // Rete di sicurezza: un pallone che nessuno raggiunge torna libero.
    if (this.poss.flying && this.poss.age > RECEIVE.timeout) this.poss.loose('nessuno la raggiunge');

    this.rules.update(dt, inp);

    // Movimento. Chi sta facendo un gesto lo finisce; il ricevente di un
    // passaggio va sulla palla qualunque cosa dica il joystick, fino al
    // primo tocco. Alle riprese tutti si sistemano, chi batte resta fermo.
    const live = this.phase === 'play';
    const setting = this.phase === 'restart';
    const taker = setting ? this.rules.set.taker : null;
    if (live || setting) { this.teams.home.ai.update(dt); this.teams.away.ai.update(dt); }
    const withBall = this.owner === me;
    for (const p of this.everyone) {
      p.sideSpeed = 0;
      if (p.action) this.stepAction(dt, p, p === me ? inp : null);
      else if (setting && p !== taker && !p.down) {
        if (p.keeper) this.teams[p.team].keeperAI.position(dt);
        else if (p === me && !this.opponentsSetPiece()) this.userMove(dt, p, inp, false);
        else this.teams[p.team].ai.steer(dt, p);
      } else if (p.down) p.drive(dt, 0, 0, 0, {});
      else if (!live) this.settle(dt, p);
      else if (p.keeper && p !== me) this.teams[p.team].keeperAI.update(dt);
      else if (this.receiver === p) { this.aerial(p, inp); if (!p.action) this.runToBall(dt, p); }
      else if (p !== me) { this.aerial(p, null); if (!p.action) this.teams[p.team].ai.steer(dt, p); }
      else this.userMove(dt, p, inp, withBall);
    }
    if (live || setting) this.referee.update(dt);
    else this.referee.p.drive(dt, 0, 0, 0, { face: { x: b.pos.x - this.referee.p.pos.x, z: b.pos.z - this.referee.p.pos.z } });
    this.walkOff(dt);
    separate(this.bodies, (p) => p === this.ctrl || p.down || (p.action && p.action.root) || p === this.owner);
    for (const p of this.everyone) p.confine();
    // pesi e fase delle animazioni dopo il movimento: servono subito ai tocchi di palla
    for (const p of this.bodies) p.animStep(dt);
    for (const p of this.leaving) p.animStep(dt);

    if (live || this.rules.userTaking()) this.actions(dt, inp);

    const wasLive = b.live;
    if (this.owner && this.owner.holding) {
      // dove l'ha messa l'ultimo disegno; prima del primo disegno, davanti al petto
      const k = this.owner, h = k.avatar.heldAt;
      if (h.y > 0.2 && Math.hypot(h.x - k.pos.x, h.z - k.pos.z) < 2.5) b.hold(h.x, h.y, h.z);
      else b.hold(k.pos.x + k.dirX * 0.3, HELD_Y, k.pos.z + k.dirZ * 0.3);
    } else if (this.owner && this.owner.dropping) b.step(dt);   // rinvio al volo: cade dalla mano
    else if (this.owner && !this.rules.waitingTaker(this.owner)) this.dribble(dt);
    else b.step(dt);
    this.setpieces.tick(dt);
    if (!this.owner && b.live && live) {
      // parate: solo se la palla tocca mani o corpo veri del portiere
      if (!this.teams.home.keeperAI.touch()) this.teams.away.keeperAI.touch();
      if (!this.owner) this.contacts(inp);
    }
    this.noteOffside();
    this.autoSwitch(inp);
    this.controls.setMode(this.userAttacking() ? 'attack' : 'defense');

    // Anello sul compagno che riceverebbe: mentre si carica segue la potenza,
    // dal vicino al lontano.
    this.passTarget = null;
    const w = this.windup;
    if (w) this.passTarget = w.target || null;
    else if (this.ctrl && this.owner === this.ctrl && b.live && !this.ctrl.holding) {
      const c = this.ctrl, k = this.charging, pw = k ? this.charge : 0;
      const ax = inp.mag > 0 ? inp.x : c.dirX, az = inp.mag > 0 ? inp.z : c.dirZ;
      if (k === 'through') this.passTarget = chooseThrough(c, ax, az, this.squad.players, this.opponents, pw).mate;
      else if (k === 'cross') this.passTarget = chooseCross(c, ax, az, this.squad.players, this.opponents, pw).mate;
      else if (k !== 'shot') this.passTarget = choosePass(c, ax, az, this.squad.players, this.opponents, inp.mag > 0 ? PASS.cone : PASS.coneNoStick, pw);
    }

    if (wasLive && b.scored) this.onGoal(b.scored);
    else if (wasLive && b.out) this.rules.out();
    if (!b.live) {
      if (!this.poss.free) this.poss.loose(b.scored ? 'gol' : 'fuori');
      for (const p of this.everyone) if (p.action && p.action.kick) p.action = null;
    }
  }

  clockText() { return this.rules.clockText() + ' ' + this.rules.half + 'T'; }

  // Fine partita: stessa scelta del pulsante Esci, con il risultato in vista.
  onFullTime() {
    this.stopInput();
    this.hud.openEnd(this.goals.home, this.goals.away);
  }

  // Si tiene premuto per la potenza; il comando rilasciato senza palla vicina
  // aspetta CONTROL.buffer secondi. Ogni pulsante fa una cosa sola.
  actions(dt, inp) {
    const me = this.ctrl;
    // In difesa (PES): Pressing tenuto e jockey in userMove; X due volte
    // contrasto, Cerchio scivolata, Quadrato raddoppio, Triangolo uscita del
    // portiere, L1 cambio, levetta destra cambio verso la direzione.
    if (!this.userAttacking()) {
      this.charging = null;
      this.buffer = null;
      this.callPress = this.phase === 'play' && !!inp.held.double;
      this.keeperCharge = this.phase === 'play' && !!inp.held.keeper;
      if (inp.down.swap) this.swapToNearest();
      else if (inp.switchDir) this.switchToward(inp.switchDir.x, inp.switchDir.z);
      const p = this.ctrl;
      if (!p || p.action || p.down) return;
      if (inp.down.slide) {
        const b = this.ball, L = SLIDE.lead;
        const dx = inp.mag > 0 ? inp.x : b.pos.x + b.vel.x * L - p.pos.x, dz = inp.mag > 0 ? inp.z : b.pos.z + b.vel.z * L - p.pos.z;
        startSlide(this, p, dx, dz);
      } else if (inp.down.tackle) startTackle(this, p, true);
      return;
    }
    this.callPress = this.keeperCharge = false;
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
    // Ripresa battuta dall'utente: la barra vale anche qui (angolo, rimessa).
    if (this.phase !== 'play') {
      if (this.rules.userKick(this.buffer.kind, this.buffer.power, inp)) this.buffer = null;
      else if ((this.buffer.t -= dt) <= 0) this.buffer = null;
      return;
    }
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

  // Prepara il calcio: bersaglio scelto ora (potenza = distanza), mira e
  // velocita' calcolate al contatto del piede. `inp.to`: compagno gia' scelto (IA).
  startKick(p, kind, power, inp) {
    const b = this.ball;
    const ax = inp && inp.mag > 0 ? inp.x : p.dirX, az = inp && inp.mag > 0 ? inp.z : p.dirZ;
    const stick = !!(inp && inp.mag > 0);
    const mates = this.teams[p.team].players, opp = this.teams[this.otherSide(p.team)].players;
    const given = inp && inp.to !== undefined;
    const K = ANIM[kind];
    const a = { kick: true, kind, power, clip: K.clip, moveMag: K.moveMag, turn: K.turn, t: 0, ax, az, fromStick: stick };
    if (kind === 'pass') {
      a.target = given ? inp.to : choosePass(p, ax, az, mates, opp, stick ? PASS.cone : PASS.coneNoStick, power);
    } else if (kind === 'through') {
      const c = chooseThrough(p, ax, az, mates, opp, power);
      a.target = given ? inp.to : c.mate;
      a.spot = { tx: c.tx, tz: c.tz };
    } else if (kind === 'cross') {
      const c = chooseCross(p, ax, az, mates, opp, power);
      a.target = c.mate;
      a.cross = c.kind;
      a.apex = c.apex;
      a.spot = { tx: c.tx, tz: c.tz };
    }
    a.aim = this.kickAim(p, a);
    a.dx = a.aim.tx - b.pos.x; a.dz = a.aim.tz - b.pos.z;
    // Palla al piede: la clip parte da K.start. Di prima, o per liberarsi di un
    // contrasto (inp.quick): quasi al contatto.
    const from = this.owner === p && !(inp && inp.quick) ? this.kickFrom(p, K) : Math.max(0, K.contact - (inp && inp.quick ? DUEL.quickPass : ANIM.firstTime));
    a.contact = K.contact - from;
    a.end = a.contact + K.recover;
    p.avatar.playOnce(K.clip, from, a.end);
    p.action = a;
  }

  // Il calcio parte dal fotogramma della clip con i piedi dove li ha il passo
  // in corso (fra K.early e il contatto): niente scatti di gamba.
  kickFrom(p, K) {
    if (p.speed < ANIM.syncMinSpeed) return K.start;
    return p.avatar.matchStart(K.clip, K.early ?? 0, K.contact - ANIM.minLead, K.start);
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
      const r = rootAt(this.tpl, a.clip, a.from + Math.min(a.t, a.end));
      const da = (r.a - a.r0.a) * (a.scaleA ?? 1), ds = (r.s - a.r0.s) * (a.scaleS ?? 1);
      const fx = Math.sin(a.h0), fz = Math.cos(a.h0);
      p.moveTo(a.x0 + fx * da - fz * ds, a.z0 + fz * da + fx * ds, dt);
    } else if (!a.moves) {
      p.drive(dt, 0, 0, 0, {});
    }
    // a.moves: il gesto sposta da se' il giocatore (tick), prima degli eventi
    if (a.tick) a.tick(a, dt);
    if (a.events) for (const e of a.events) if (!e.done && a.t >= e.at) { e.done = true; e.fn(); }
    if (p.action === a && a.t >= a.end) {
      p.action = null;
      if (a.root) { p.speed = Math.min(p.speed, p.params.maxSpeed * PLAYER.jogFactor); p.moveHeading = p.heading; }
      if (a.onEnd) a.onEnd();
    }
  }

  // Finta: skill_spin verso il lato del joystick, la palla resta al piede.
  startFeint(p, inp) {
    let side = 'right';
    if (inp && inp.rs && inp.rs.fx !== undefined) side = inp.rs.fx * p.rightX + inp.rs.fz * p.rightZ < 0 ? 'left' : 'right';
    else if (inp && inp.mag > 0) side = inp.x * p.rightX + inp.z * p.rightZ < 0 ? 'left' : 'right';
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

  // Punto d'arrivo del calcio `a` con l'errore di chi calcia; per il tiro
  // anche la velocita' (aim.v).
  kickAim(p, a) {
    const b = this.ball;
    if (a.kind === 'pass') return passAim(p, b, a.target, a.ax, a.az, a.power);
    if (a.kind === 'through') {
      const pt = a.target ? throughPoint(p, a.target, a.power) : a.spot, e = loftError(p);
      return { tx: pt.tx + e.x * 0.5, tz: pt.tz + e.z * 0.5 };
    }
    if (a.kind === 'cross') {
      const e = loftError(p);
      return { tx: a.spot.tx + e.x, tz: a.spot.tz + e.z };
    }
    const v = shotVelocity(p, b, a.power, a.ax, a.az, a.fromStick);
    return { tx: b.pos.x + v.vx, tz: b.pos.z + v.vz, v };
  }

  kickNow(p, a) {
    const b = this.ball;
    if (!this.canKick(p)) return;
    const aim = this.kickAim(p, a);
    const d = Math.hypot(aim.tx - b.pos.x, aim.tz - b.pos.z);
    if (a.kind === 'pass') {
      const t = a.target, opp = this.teams[this.otherSide(p.team)].players;
      const press = Math.max(pressure(p, opp), t ? pressure(t, opp) : 0);
      b.rollAt(aim.tx, aim.tz, passSpeed(d, a.power, press) * aim.speedMul);
      this.poss.fly('passaggio', p, t);
    } else if (a.kind === 'through') {
      b.rollAt(aim.tx, aim.tz, throughSpeed(d, a.power));
      this.poss.fly('filtrante', p, a.target);
    } else if (a.kind === 'cross') {
      b.lobTo(aim.tx, aim.tz, a.apex);
      this.poss.fly(a.cross, p, a.target);
    } else {
      b.kick(aim.v.vx, aim.v.vy, aim.v.vz);
      this.poss.fly('tiro', p, null);
    }
    this.lastKick = { kind: a.kind, power: a.power, speed: b.vel.length(), dist: d };
    // angolo e rinvio dal fondo: niente fuorigioco; punizione indiretta: il gol diretto non vale
    const set = this.phase !== 'play' && this.rules.set;
    if (set && (set.type === 'corner' || set.type === 'goalkick')) this.noOffsideSeq = this.poss.seq;
    if (this.pendingIndirect === p) { this.indirect = { taker: p, seq: this.poss.seq }; this.pendingIndirect = null; }
    this.release(p, CONTROL.kickLock);
    if (a.target && (p === this.ctrl || (p.team === this.userSide && a.target.team === this.userSide))) this.switchTo(a.target);
    if (this.phase !== 'play') this.rules.go('play');
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
  // segue a ogni passo e per cambiare lato gira attorno ai piedi, a velocita'
  // limitata. In corsa il destro la tocca appena prima di appoggiare: la palla
  // si allunga subito e rallenta, il giocatore la riprende al tocco dopo.
  dribble(dt) {
    const p = this.owner, b = this.ball, D = DRIBBLE;
    const run = Math.min(1, p.speed / p.params.maxSpeed);
    const moving = smoothstep(D.moveFrom, D.moveFull, p.speed);
    const u = wrap01(p.gait.phase - D.touchPhase);
    const touch = D.touch[0] + (D.touch[1] - D.touch[0]) * run;
    const swing = (D.swing[0] + (D.swing[1] - D.swing[0]) * run) * (p.close ? D.closeSwing : 1);
    // durante un calcio la palla aspetta il piede, niente allungo
    const kicking = p.action && p.action.kick;
    const dist = kicking ? D.kick : D.rest + (touch - D.rest) * moving + swing * moving * Math.sin(Math.PI * Math.pow(u, D.push));
    // sul piede che tocca (destro), o sul lato lontano dal difensore se la protegge
    const side = p.shield ? p.shield * AI.carrier.protect.shieldSide : 1;
    const want = p.heading - Math.atan2(D.side * side, dist);
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
    for (const p of this.everyone) {
      if (locked(p) || p.down || (p.action && p.action.root)) continue;
      if (to && p.team === poss.team) continue;
      // il portiere nella sua area la prende solo con le mani (KeeperAI.touch)
      if (p.keeper && this.teams[p.team].keeperAI.handsOnly()) continue;
      const d = Math.hypot(b.pos.x - p.pos.x, b.pos.z - p.pos.z);
      if (d > bestD) continue;
      if (Math.hypot(b.vel.x - p.vel.x, b.vel.z - p.vel.z) > CONTROL.trapSpeed) continue;
      // Intercetto di un pallone avversario: riesce con una probabilita', una volta sola per pallone.
      if (poss.flying && poss.team && poss.team !== p.team && !p.keeper) {
        if (p.triedFlight === poss.seq) continue;
        p.triedFlight = poss.seq;
        const I = AI.intercept, def = Math.max(0, Math.min(1, (p.params.tackle - 0.25) / 0.55));
        if (Math.random() > I.base + I.def * def - I.speed * Math.hypot(b.vel.x, b.vel.z)) continue;
      }
      best = p; bestD = d;
    }
    if (!best) return;
    const cause = poss.flying && poss.team && poss.team !== best.team ? 'intercetto' : 'controllo';
    this.receive(best, inp, cause);
  }

  allPlayers() { return this.everyone; }

  receive(p, inp, cause) {
    if (this.checkOffside(p)) return;
    // Il portiere nella sua area la prende con le mani, ma non su un retropassaggio.
    const hands = p.keeper && this.poss.team !== p.team && Math.abs(p.pos.x + this.dirOf(p.team) * PITCH.length / 2) < PITCH.penaltyDepth && Math.abs(p.pos.z) < PITCH.penaltyWidth / 2;
    this.gain(p, cause);
    p.holding = hands;
    if (p.team === this.userSide && !p.keeper) this.switchTo(p);
    if (!hands) this.firstTouch(p, p === this.ctrl ? inp : null);
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
        p.ballDist = DRIBBLE.touch[1] + DRIBBLE.swing[1] * 0.5;
        return;
      }
    }
    if (p.speed < FIRST_TOUCH.receiveBelow && !p.avatar.busy) {
      const R = ANIM.receive;
      p.avatar.playOnce(R.clip, p.avatar.matchStart(R.clip, 0, R.start + R.early, R.start), R.length);
    }
  }

  // Cambio: il compagno piu' vicino alla palla, mai il portiere.
  swapToNearest() {
    const b = this.ball;
    const best = this.nearestTo(this.squad.players, b.pos.x, b.pos.z, this.ctrl);
    if (best) this.setControlled(best);
  }

  // Cambio manuale (levetta destra): il compagno nella direzione indicata a
  // partire dal giocatore comandato, il piu' vicino fra quelli nel cono.
  switchToward(dx, dz) {
    const c = this.ctrl, l = Math.hypot(dx, dz);
    if (!c || l < 1e-3) return;
    let best = null, bs = Infinity;
    for (const q of this.squad.players) {
      if (q === c || q.keeper || q.down) continue;
      const vx = q.pos.x - c.pos.x, vz = q.pos.z - c.pos.z, d = Math.hypot(vx, vz) || 1;
      const ang = Math.acos(clamp((vx * dx + vz * dz) / (d * l), -1, 1));
      if (ang > CONTROL.switchCone) continue;
      const score = d * (1 + 2 * ang);
      if (score < bs) { bs = score; best = q; }
    }
    if (best) this.setControlled(best);
  }

  // side: verso della porta in cui e' entrata la palla. Segna chi attacca da quella parte.
  onGoal(side) {
    // punizione indiretta finita in porta senza altri tocchi: rinvio dal fondo
    if (this.indirect && this.indirect.seq === this.poss.seq) {
      this.indirect = null;
      this.ball.scored = 0;
      this.ball.out = true;
      this.hud.toast('Punizione indiretta: gol non valido');
      this.rules.out();
      return;
    }
    const team = side === this.attackDir ? this.userSide : (this.userSide === 'home' ? 'away' : 'home');
    const home = team === 'home';
    if (home) this.goals.home++; else this.goals.away++;
    const last = this.lastTouch;
    const scorer = last && last.team === team ? last : null;
    this.scorers.push({ team, playerId: scorer ? scorer.id : null, minute: this.rules.minute() });
    this.hud.setScore(this.goals.home, this.goals.away);
    this.hud.showGoal((home ? this.home : this.away).name, scorer ? scorer.name : '');
    this.rules.goal(team, scorer);
    this.teams[this.otherSide(team)].keeperAI.concede();
    this.stadium.cheer(team);
  }

  finish(exit) {
    cancelAnimationFrame(this.raf);
    for (const [t, type, fn, cap] of this.handlers) t.removeEventListener(type, fn, cap);
    this.handlers = [];
    try { if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); } catch (e) { /* non supportato */ }
    this.controls.destroy();
    this.debug.destroy();
    this.hud.destroy();
    for (const p of [...this.everyone, ...this.leaving, this.referee.p]) p.avatar.dispose();
    closeAudio();
    this.setpieces.dispose();
    this.gfx.dispose();
    disposeScene(this.scene);
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.root.remove();
    this.resolve({
      exit,
      homeGoals: this.goals.home,
      awayGoals: this.goals.away,
      scorers: this.scorers,
      cards: this.cards,
      stats: { cards: this.cards, fouls: this.stats.fouls, offsides: this.stats.offsides }
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
