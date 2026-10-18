import * as THREE from 'three';
import { PHYSICS, RENDER, REPLAY, RULES, PLAYER, CONTROL, DRIBBLE, SHOT, PASS, KIT, RECEIVE, FIRST_TOUCH, ANIM, ANIMLIB, POWER, FEINT, AI, AERIAL, SHAPE, PITCH, SLIDE, BALL, DUEL, OFFSIDE, DEBUG, PRESS, THROUGH, TAPE, BALL_LOOK, LIGHT, KICK, FOULACT, MARKS } from './config.js';
import { buildPitch } from './pitch.js';
import { Ball, shadowTexture, aimWithSpin, rollSpeedIn } from './ball.js';
import { BroadcastCamera } from './camera.js';
import { Hud } from './hud.js';
import { Controls, glyph } from './controls.js';
import { buildTeam, separate, choosePass, passAim, shotVelocity, pressure, chooseThrough, chooseCross, loftError, headingOf, passSpeed, throughSpeed, throughPoint, runTime } from './player.js';
import { loadPlayerModel, kitMaterial, rootAt, clipDuration, attachLibrary } from './avatar.js';
import { pickKick, pickTrap, pickIntercept, kickStill } from './anim-pick.js';
import { Possession } from './possession.js';
import { Debug } from './debug.js';
import { TeamAI } from './team-ai.js';
import { KeeperAI, HELD_Y, bodyHit } from './keeper.js';
import { startTackle, startSlide, tryAerial, startKeeperGesture, startFoulGesture } from './gestures.js';
import { Rules } from './rules.js';
import { userPress, stagger, beat, bodyContact } from './defense.js';
import { Referee } from './referee.js';
import { unlockAudio, closeAudio } from './audio.js';
import { SetPieces } from './setpieces.js';
import { Graphics, savedQuality, detectQuality } from './render.js';
import { Stadium, loadStadiumModel } from './stadium.js';
import { Recorder, Replay, CloseCam } from './replay.js';
import { Tape, replayFolder, saveReplayFiles } from './tape.js';
import { loadBallLook } from './ball-look.js';

const KICKS = ['pass', 'through', 'cross', 'shot'];
// Legenda: una riga per l'attacco e una per la difesa, un elemento per comando.
const hintRow = (title, items) => '<span class="m3d-hint-row"><span class="m3d-hint-h">' + title + '</span>' +
  items.map((t) => '<span class="m3d-hint-i">' + t + '</span>').join('') + '</span>';
const KEY_HINT = hintRow('Attacco', ['WASD muovi', 'J passaggio', 'U tiro', 'K cross', 'I filtrante', 'L scatto', 'E controllo stretto', 'O finta']) +
  hintRow('Difesa', ['J pressing, due volte contrasto', 'U raddoppio', 'K scivolata', 'I portiere', 'Q cambio']);

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
// scarto casuale centrato in zero (somma di tre uniformi, come in gestures.js)
const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) * 2;
// distanza di (px, pz) dal segmento a-b
const segDist = (px, pz, ax, az, bx, bz) => {
  const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1, t = clamp(((px - ax) * dx + (pz - az) * dz) / l2, 0, 1);
  return Math.hypot(px - (ax + dx * t), pz - (az + dz * t));
};
// nome sopra il giocatore: lungo diventa iniziale e cognome (Lautaro Martinez -> L. Martinez)
const shortName = (n) => { const w = String(n || '').trim().split(/\s+/); return w.length > 1 && w.join(' ').length > MARKS.nameMax ? w[0][0] + '. ' + w.slice(1).join(' ') : w.join(' '); };

// Ogni posto di `from` a un punto diverso di `to` ({x, z}), con la somma dei
// quadrati delle distanze piccola: prima le coppie piu' vicine, poi scambi
// finche' migliorano. Restituisce l'indice del punto per ogni posto.
function assignPoints(from, to) {
  const d2 = (a, b) => (a.x - b.x) ** 2 + (a.z - b.z) ** 2;
  const at = [], used = new Set(), pairs = [];
  from.forEach((a, i) => to.forEach((b, j) => pairs.push([d2(a, b), i, j])));
  pairs.sort((x, y) => x[0] - y[0]);
  for (const [, i, j] of pairs) if (at[i] === undefined && !used.has(j)) { at[i] = j; used.add(j); }
  for (let pass = 0, better = true; better && pass < 20; pass++) {
    better = false;
    for (let i = 0; i < from.length; i++) {
      if (at[i] === undefined) continue;
      for (let k = i + 1; k < from.length; k++) {
        if (at[k] === undefined) continue;
        const now = d2(from[i], to[at[i]]) + d2(from[k], to[at[k]]);
        if (d2(from[i], to[at[k]]) + d2(from[k], to[at[i]]) < now - 1e-6) { [at[i], at[k]] = [at[k], at[i]]; better = true; }
      }
      for (let j = 0; j < to.length; j++) {
        if (!used.has(j) && d2(from[i], to[j]) < d2(from[i], to[at[i]]) - 1e-6) { used.delete(at[i]); used.add(j); at[i] = j; better = true; }
      }
    }
  }
  return at;
}

const wrap01 = (x) => x - Math.floor(x);
const _kb = { x: 0, z: 0 }, _kw = new THREE.Vector3(), _dn = new THREE.Vector3(), _dw = new THREE.Vector3();
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

// Memoria JavaScript occupata (solo Chrome la espone), per i tempi di caricamento.
function heapBytes() {
  const m = typeof performance !== 'undefined' && performance.memory;
  return m ? m.usedJSHeapSize : null;
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
    this.idleT = 0;            // secondi senza nessun comando dell'utente
  }

  // In difesa, senza comandi da AI.defense.idle secondi, il giocatore
  // dell'utente difende da solo con le regole dell'IA (team-ai.js).
  get ctrlAuto() {
    const c = this.ctrl;
    return !!c && !c.keeper && this.phase === 'play' && this.idleT >= AI.defense.idle && !this.userAttacking();
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
    const t0 = performance.now();
    const r = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    r.setSize(window.innerWidth, window.innerHeight);
    r.domElement.tabIndex = 0;
    this.renderer = r;
    // Livello delle animazioni: quello della grafica (scelto dal dispositivo o
    // nelle opzioni), o quello chiesto dalla prova. Cambia solo la varieta'.
    const level = ANIMLIB.levels[this.opts.animLevel] ? this.opts.animLevel : (savedQuality() || detectQuality(r));
    const mem0 = heapBytes();
    // palla del modello dell'utente col disegno della competizione (ball-look.js)
    const look = loadBallLook({ comp: this.opts.competition || null, winter: this.opts.ball === 'inverno', size: BALL_LOOK.size[level] || 1024 })
      .catch((e) => { console.warn('match3d palla: aspetto non caricato', e); return null; });
    const [tpl, ballLook, stadiumModel] = await Promise.all([loadPlayerModel(level), look, loadStadiumModel(level), loadCss(), fontsReady()]);
    this.animLevel = level;
    this.loadStats = { level, loadMs: Math.round(performance.now() - t0), heapBefore: mem0, heapAfter: heapBytes(), anim: tpl.lib.stats };
    // livello medio: il resto della libreria arriva durante la partita
    tpl.lib.loadLater(() => { attachLibrary(tpl, tpl.lib); this.loadStats.laterMs = Math.round(performance.now() - t0); });
    const root = document.createElement('div');
    root.className = 'm3d';
    document.body.appendChild(root);
    this.root = root;
    root.appendChild(r.domElement);

    const scene = new THREE.Scene();
    const L = LIGHT[LIGHT.preset];
    scene.background = new THREE.Color(L.background);
    scene.add(new THREE.HemisphereLight(L.hemi.sky, L.hemi.ground, L.hemi.intensity));
    const sun = new THREE.DirectionalLight(L.sun.color, L.sun.intensity);
    sun.position.fromArray(L.sun.dir).multiplyScalar(LIGHT.sunDistance);
    scene.add(sun);
    this.sun = sun;
    const pitch = buildPitch(r);
    scene.add(pitch);
    this.stadium = new Stadium({ home: kitOf(this.home, 'home'), away: kitOf(this.away, 'away') }, stadiumModel, r);
    // con il modello dello stadio le tribune piane del campo non servono
    if (this.stadium.model) pitch.getObjectByName('stands').visible = false;
    scene.add(this.stadium.group);
    this.scene = scene;

    this.ball = new Ball();
    if (ballLook) this.ball.setLook(ballLook);
    this.ballLook = ballLook ? { design: ballLook.design, fromModel: ballLook.fromModel, ms: ballLook.ms } : null;
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
    // replay dopo il gol: gli ultimi secondi di tutti i corpi e della palla
    this.recorder = new Recorder([...this.bodies], this.ball);
    // replay di debug: gli ultimi secondi fotogramma per fotogramma (F9)
    this.tape = new Tape(this, [...this.bodies]);
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
      skip: () => this.skipGoal(),
      quality: (level) => this.gfx.setLevel(level),
      saveTape: () => this.saveTape()
    });
    this.controls = new Controls(root, this.hud.layer, {
      onPad: (type) => this.onPad(type),
      onPadLost: () => this.onPadLost(),
      // Options/Start (PlayStation), Menu (Xbox): durante gol e replay salta
      onPause: () => { if (this.phase === 'end') return; if (this.phase === 'goal' && !this.hud.exitOpen) { this.skipGoal(); return; } if (this.hud.exitOpen) this.closeExit(); else this.openExit(); },
      onMenu: (a) => { if (this.hud.exitOpen) this.hud.menu(a); },
      // Share/Create (PlayStation), View (Xbox): replay di debug
      onSave: () => this.saveTape()
    });
    this.hud.setHint(this.controls.padKind ? this.padHint(this.controls.padKind) : KEY_HINT);
    this.debug = new Debug(root, this);
    // partita di prova con &debug: pannello aperto (sul telefono non c'e' F3)
    if (this.opts.debug) this.debug.toggle();

    this.rules = new Rules(this, this.opts.durationMinutes);
    this.rules.kickoff(this.userSide);
    // visuale larga solo al calcio d'inizio dei tempi: dopo un gol il
    // riferimento resta sull'inquadratura di gioco (tappa 5)
    this.camera = new BroadcastCamera(window.innerWidth / window.innerHeight, () => this.phase === 'kickoff' && !(this.rules.set && this.rules.set.afterGoal));
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

    // Solo nella partita di prova, o se lo chiede un test (tools/match3d/career.mjs):
    // accesso dalla console.
    if (this.opts.exitMode === 'test' || window.__m3dTest) window.__m3d = this;

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
    // Invio salta esultanza e replay
    if (e.key === 'Enter' && this.phase === 'goal' && !this.hud.exitOpen) {
      e.preventDefault();
      if (down && !e.repeat) this.skipGoal();
      return;
    }
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
    if (e.code === 'F9') {
      e.preventDefault();
      if (down && !e.repeat) this.saveTape();
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
    // la palla tiene sempre l'ombra a disco sotto di se': quella del sole,
    // piccola e spostata di lato, non bastava e a terra sembrava sospesa
    this.ball.shadow.visible = true;
    this.ball.shadowDim = this.shadows ? BALL.shadowWithMap : 1;
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
    // il tempo del primo requestAnimationFrame puo' precedere this.last (avvio
    // lento): mai un passo negativo, che farebbe andare tutto all'indietro
    const dt = Math.max(0, Math.min(0.25, (now - this.last) / 1000)) * this.timeScale;
    this.last = now;
    this.advance(dt);
    this.gfx.update(dt, this.replay || this.tapePlay ? this.ball.mesh.position : this.ball.pos);
    this.gfx.render();
    // dissolvenza del replay: la foto si fa subito dopo il disegno, finche' la tela e' piena
    if (this.replay && this.replay.snap) { this.hud.dissolve(this.renderer.domElement, this.replay.snap); this.replay.snap = 0; }
    this.debug.update(dt);
  }

  // Fisica a passo fisso per `dt` secondi reali, poi pose e animazioni
  // interpolate: tutto tranne il disegno. Il test di durata la chiama da solo.
  advance(dt) {
    const step = 1 / PHYSICS.hz;
    // replay di debug in registrazione video: la partita resta ferma
    if (this.tapePlay) { this.tapePlayFrame(dt); return; }
    // stacco col logo dopo il gol: a schermo coperto si cambia scena
    if (this.sting && !this.paused) this.stingStep(dt);
    if (this.replay) { this.replayFrame(dt); return; }

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
      if (this.phase === 'goal') this.goalShow(dt);
    }
    const alpha = this.paused ? 1 : this.acc / step;
    this.ball.sync(alpha, this.paused ? 0 : dt);
    // palla fra le due mani: l'avatar la mette in posa dentro il suo aggiornamento
    const holder = this.owner;
    for (const p of this.everyone) { p.avatar.holdWant = p === holder && !!p.holding && !p.holdHand; p.avatar.holdChest = !!p.throwHold; }
    for (const p of this.everyone) p.sync(alpha, this.paused ? 0 : dt);
    for (const p of this.leaving) p.sync(alpha, this.paused ? 0 : dt);
    this.referee.sync(alpha, this.paused ? 0 : dt, this.camera.cam);
    this.placeHeldBall();
    this.setpieces.render(this.ctrl);
    this.hud.setPrompt(this.setpieces.prompt(glyph, this.controls.device, this.controls.padKind));
    this.syncMarkers(dt);
    this.blobShadows();
    this.stadium.update(this.paused ? 0 : dt, this.camera.cam);
    this.stadium.screen(this.home.name, this.away.name, this.goals.home, this.goals.away, this.rules.clockText().split(':')[0]);
    // dopo il gol si registra solo quanto serve al replay (REPLAY.after)
    const rec = this.phase !== 'goal' || this.recorder.count - this.goalMark < REPLAY.after * REPLAY.hz;
    if (!this.paused && this.phase !== 'end') { if (rec) this.recorder.tick(dt); this.tape.tick(dt); }
  }

  // Fatto di gioco per il replay di debug (fallo, tiro, parata, rimessa...).
  note(kind, data) { if (this.tape) this.tape.event(kind, data); }

  // Replay di debug (F9, Share/View, menu di pausa): gli ultimi TAPE.seconds
  // in due file con lo stesso nome, il JSON del nastro e il video della scena
  // rigiocata dal nastro (tape.js). La partita resta ferma e poi riprende
  // esattamente da dov'era.
  async saveTape() {
    if (this.tapeSaving || !this.tape.length || this.replay || this.phase === 'end') return;
    this.tapeSaving = true;
    const wasOpen = this.hud.exitOpen, wasPaused = this.paused;
    this.paused = true;
    this.stopInput();
    const d = new Date(), two = (v) => String(v).padStart(2, '0');
    const name = 'm3d-' + d.getFullYear() + two(d.getMonth() + 1) + two(d.getDate()) + '-' + two(d.getHours()) + two(d.getMinutes()) + two(d.getSeconds()) +
      '-' + this.rules.clockText().replace(':', '');
    const snap = this.tape.snapshot();
    try {
      // la cartella per prima: il permesso vuole il gesto dell'utente ancora valido
      const dir = await replayFolder();
      const json = JSON.stringify(this.tape.toJSON({ name, user: this.userSide }));
      if (wasOpen) this.hud.closeExit();
      this.hud.status('Replay di debug: registrazione del video');
      const video = await this.recordTape();
      const files = [{ name: name + '.json', blob: new Blob([json], { type: 'application/json' }) }];
      if (video) files.push({ name: name + video.ext, blob: video.blob });
      const where = await saveReplayFiles(dir, files);
      this.hud.status(null);
      this.hud.toast('Replay salvato in ' + where + ': ' + name);
    } catch (e) {
      this.hud.status(null);
      this.hud.toast('Replay non salvato');
    } finally {
      this.tapePlay = null;
      this.tape.restore(snap);
      this.placeHeldBall();
      if (wasOpen && !this.hud.exitOpen) this.hud.openExit();
      this.paused = wasPaused || this.hud.exitOpen;
      this.last = performance.now();
      this.tapeSaving = false;
    }
  }

  // Video della scena rigiocata dal nastro, in tempo reale; null se il
  // browser non sa registrare il canvas.
  recordTape() {
    const canvas = this.renderer.domElement;
    const MR = window.MediaRecorder;
    const type = MR && canvas.captureStream && ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'].find((t) => MR.isTypeSupported(t));
    if (!type) return Promise.resolve(null);
    return new Promise((ok) => {
      const rec = new MR(canvas.captureStream(TAPE.hz), { mimeType: type, videoBitsPerSecond: TAPE.videoBits });
      const chunks = [];
      rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
      rec.onstop = () => ok({ blob: new Blob(chunks, { type }), ext: type.includes('mp4') ? '.mp4' : '.webm' });
      this.tapePlay = { t: 0, end: () => rec.stop() };
      rec.start(500);
    });
  }

  // Un fotogramma del nastro in registrazione video: pose, palla, telecamera.
  tapePlayFrame(dt) {
    const P = this.tapePlay, n = this.tape.length;
    const k = Math.min(n - 1, Math.floor(P.t * TAPE.hz));
    this.tape.apply(k, this.camera.cam);
    P.t += dt;
    if (k >= n - 1 && P.end) { const end = P.end; P.end = null; end(); }
  }

  // Replay dopo il gol: la partita e' ferma, si rigiocano le pose registrate.
  replayFrame(dt) {
    const r = this.replay, d = this.paused ? 0 : dt;
    if (this.paused) this.controls.pollMenu();
    else this.controls.read(dt);
    if (d > 0 && !r.step(d)) this.skipGoal();
    r.apply(this.camera.cam, d);
    this.stadium.update(d, this.camera.cam);
  }

  // Regia dopo il gol (REPLAY): diretta con la telecamera di gioco, poi primo
  // piano di chi esulta, poi stacco col logo e replay.
  goalShow(dt) {
    const s = this.show, R = REPLAY;
    if (!s || this.replay) return;
    s.t += dt;
    // stacco sul primo piano: la scritta del gol lascia la scena all'esultanza
    if (!s.close && s.p && s.t >= R.live) { s.close = new CloseCam(s.p, this.bodies); this.hud.hideGoal(); this.hud.showSkip(true); }
    if (s.close) s.close.apply(this.camera.cam, dt);
    if (!s.cut && s.t >= R.live + (s.p ? R.close : 0)) { s.cut = true; this.startSting(() => this.startReplay()); }
  }

  // Stacco col logo; `then` gira a schermo coperto.
  startSting(then) {
    this.sting = { t: 0, then, fired: false, out: false };
    this.hud.sting('in');
  }

  stingStep(dt) {
    const g = this.sting, R = REPLAY;
    g.t += dt;
    if (!g.fired && g.t >= R.stingIn) { g.fired = true; g.then(); }
    if (!g.out && g.t >= R.sting - R.stingOut) { g.out = true; this.hud.sting('out'); }
    if (g.t >= R.sting) { this.sting = null; this.hud.sting(null); }
  }

  // A schermo coperto dopo l'esultanza: replay dell'azione del gol, se c'e'
  // abbastanza registrato, altrimenti subito il calcio d'inizio.
  startReplay() {
    if (this.replay || this.phase !== 'goal') return;
    const rec = this.recorder, goalFrame = rec.length - 1 - (rec.count - this.goalMark);
    const r = new Replay(rec, goalFrame, this.goalSide);
    if (r.done) { this.endGoal(); return; }
    this.replay = r;
    this.hud.hideGoal();
    this.hud.showReplay(true);
    this.referee.card.visible = false;
  }

  // Salta esultanza o replay (e fine del replay): stacco col logo, poi calcio d'inizio.
  skipGoal() {
    if (this.phase !== 'goal' || this.sting) return;
    this.startSting(() => this.endGoal());
  }

  // A schermo coperto: niente attesa dei giocatori che rientrano, sono gia'
  // schierati; l'IA batte quando lo stacco ha finito di uscire.
  endGoal() {
    this.replay = null;
    this.show = null;
    this.hud.showReplay(false);
    this.hud.hideGoal();
    this.hud.showControls(true);
    this.recorder.clear();
    this.rules.kickoff(this.rules.next, true);
    this.rules.set.afterGoal = true;
    this.rules.set.hidden = REPLAY.sting - REPLAY.stingIn;
    this.camera.snap(this.ball);
  }

  syncMarkers(dt) {
    // dal gol al calcio d'inizio niente indicatori, come nel riferimento
    const show = this.phase !== 'goal';
    const c = show ? this.ctrl : null, t = show ? this.passTarget : null;
    this.ctrlRing.visible = !!c;
    if (c) this.ctrlRing.position.set(c.anchor.x, 0.02, c.anchor.z);
    this.targetRing.visible = !!t;
    if (t) this.targetRing.position.set(t.anchor.x, 0.02, t.anchor.z);

    // potenza: in campo aperto la barretta sopra il comandato, nelle riprese
    // (camera dietro a chi calcia) la barra in basso
    // la barra resta POWER.barHide s dopo il calcio; una carica annullata senza
    // calcio (possesso perso, passaggio in difesa, colpo di testa) non avvia il
    // timer: la barra non spariva piu' e restava ferma sull'ultimo valore
    if (this.charging) this.barValue = this.charge;
    else if (this.barTimer > 0) { if ((this.barTimer -= dt) <= 0) this.barValue = null; }
    else this.barValue = null;
    const bar = this.barValue ?? null, open = this.phase === 'play' && !!c;
    this.hud.setPower(open || !show ? null : bar);
    this.camera.cam.updateMatrixWorld();
    const head = (p) => this.screenAt(p.anchor.x, MARKS.head, p.anchor.z);
    const cur = c && !c.sentOff ? head(c) : null;
    this.hud.setCursor(cur ? cur.x : null, cur && cur.y);
    this.hud.setBar(open && cur ? bar : null);
    // nome di chi prende palla, per MARKS.nameTime secondi
    const o = this.owner;
    if (o && o !== this.markOwner) this.nameMark = { p: o, t: MARKS.nameTime };
    this.markOwner = o;
    const nm = this.nameMark;
    if (nm && (nm.t -= dt) <= -MARKS.fade) this.nameMark = null;
    const ns = show && this.nameMark && head(nm.p);
    if (ns) this.hud.setName(ns.x, ns.y, shortName(nm.p.name), nm.p !== c, nm.t > 0);
    else this.hud.setName(null);
  }

  // Punto del campo in pixel dello schermo (null dietro la telecamera).
  screenAt(x, y, z) {
    const v = this._sv || (this._sv = new THREE.Vector3());
    v.set(x, y, z).project(this.camera.cam);
    if (v.z < -1 || v.z > 1) return null;
    const el = this.renderer.domElement;
    return { x: (v.x + 1) / 2 * el.clientWidth, y: (1 - v.y) / 2 * el.clientHeight };
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
    // al centro solo chi batte, l'attaccante piu' avanzato (riferimento)
    const K = RULES.kickoff, kickers = this.teams[side];
    const taker = kickers.players.filter((p) => !p.keeper && !p.sentOff).sort((a, b) => a.slot.y - b.slot.y)[0];
    let mate = null;
    for (const t of Object.values(this.teams)) {
      const d = this.dirOf(t.side), kick = t === kickers;
      const block = { line: SHAPE.kickoff.line, len: SHAPE.kickoff.len, width: SHAPE.kickoff.width, ballZ: 0 };
      const field = [];
      for (const p of t.players) {
        if (instant) { p.action = null; p.avatar.endGesture(); p.down = false; p.holding = false; p.keeperBusy = false; p.dropping = false; p.holdHand = null; }
        if (p.keeper) { put(p, -d * (PITCH.length / 2 - 1.5), 0, headingOf(d, 0)); continue; }
        if (p !== taker) field.push(p);
      }
      // ognuno al punto dello schieramento del riferimento piu' vicino al suo
      // posto nel modulo (stessa compressione verso la meta' campo)
      const pts = (kick ? K.kick : K.defend).map(([x, z]) => ({ x: x * d, z }));
      const at = assignPoints(field.map((p) => t.ai.shapeTarget(p, block)), pts);
      field.forEach((p, i) => { const q = pts[at[i]]; if (q) put(p, q.x, q.z, headingOf(d, 0)); });
      if (kick) mate = field[at.indexOf(K.receiver)] || null;
    }
    // chi batte guarda avanti; la clip KickOff scelta per la direzione del
    // compagno che riceve dice dove sta la palla rispetto a lui
    const d = this.dirOf(side), h = headingOf(d, 0), r = K.kick[K.receiver];
    const k = this.kickoffClip(h, Math.atan2(r[0] * d, r[1]));
    this.kickClip = k.clip;
    const fx = Math.sin(h), fz = Math.cos(h), lx = Math.cos(h), lz = -Math.sin(h);
    put(taker, -(fx * k.ball.ahead + lx * k.ball.left), -(fz * k.ball.ahead + lz * k.ball.left), h);
    this.kickLock = this.buffer = null;
    this.kickTaker = taker;
    this.kickMate = mate;
    return taker;
  }

  // A gioco fermo: chi ha un posto da raggiungere ci va camminando o
  // correndo (niente teletrasporti); chi esulta finisce l'esultanza.
  settle(dt, p) {
    const R = RULES;
    const celebrating = this.isCelebrating(p);
    const waiting = this.phase === 'goal' && this.rules.t < R.returnDelay;
    const t = p.homeTarget;
    // al fischio si finisce la corsa rallentando, senza inchiodare; il
    // portiere battuto si ferma e poi si dispera (KeeperAI.concede)
    const C = p.concedeWait;
    if (C && p.speed < ANIM.endMove) { p.concedeWait = null; p.avatar.playOnce(C.clip, C.from, C.end); }
    if (this.phase === 'goal' && !celebrating && (this.cheer(dt, p) || this.clearWay(dt, p))) return;
    if (!celebrating && this.stepAside(dt, p)) return;
    if (!t || celebrating || waiting) { p.drive(dt, 0, 0, 0, { decel: p.concedeWait ? undefined : PLAYER.coastDecel }); return; }
    p.goTo(dt, t.x, t.z, t.h);
  }

  // Dopo il gol: chi esulta, finita la sua clip, continua con
  // celebration.filler; fino a gather.max compagni vicini lo raggiungono, gli
  // si fermano attorno (dalla parte da cui arrivano) ed esultano anche loro.
  cheer(dt, p) {
    const s = this.show, c = s && s.p, G = RULES.celebration.gather;
    if (!c || p.keeper || p.team !== c.team || this.rules.t < G.delay) return false;
    if (p === c) {
      if (s.filled) return false;
      s.filled = true;
      return this.rules.celebrate(p, RULES.celebration.filler);
    }
    // il cerchio dei compagni sta dove la clip porta chi esulta (la ruota corre 3,6 m)
    const E = this.celebrationEnd(c);
    const near = (q) => Math.hypot(q.pos.x - E.x, q.pos.z - E.z);
    if (!s.mates) {
      s.mates = this.teams[c.team].players.filter((q) => q !== c && !q.keeper && !q.down && near(q) < G.range).sort((a, b) => near(a) - near(b)).slice(0, G.max);
      s.joined = new Set();
    }
    const i = s.mates.indexOf(p);
    if (i < 0 || s.joined.has(p)) return false;
    const dx = p.pos.x - E.x, dz = p.pos.z - E.z, d = Math.hypot(dx, dz) || 1;
    const r = G.radius + 0.3 * i;
    let ux = dx / d, uz = dz / d;
    // un posto del cerchio sulla corsa di chi esulta va di lato, dalla parte del compagno
    const px = E.x - E.sx, pz = E.z - E.sz, pl = Math.hypot(px, pz);
    if (pl > 0.5 && segDist(E.x + ux * r, E.z + uz * r, E.sx, E.sz, E.x, E.z) < G.pathClear) {
      const nx = -pz / pl, nz = px / pl, sg = nx * dx + nz * dz >= 0 ? 1 : -1;
      ux = nx * sg; uz = nz * sg;
    }
    const tx = E.x + ux * r, tz = E.z + uz * r;
    if (Math.hypot(p.pos.x - tx, p.pos.z - tz) > 0.4) { p.goTo(dt, tx, tz, headingOf(E.x - tx, E.z - tz)); return true; }
    s.joined.add(p);
    if (!this.rules.celebrate(p, G.clips[i % G.clips.length])) p.drive(dt, 0, 0, 0, { face: { x: E.x - p.pos.x, z: E.z - p.pos.z } });
    else {
      // la clip del compagno lo porta avanti fino a reach m (la 052 avanza e poi
      // torna un po'): si ferma a `hug` m da chi esulta
      const a = p.action;
      let reach = 0;
      for (let t = 0; t <= a.end; t += 0.1) reach = Math.max(reach, rootAt(this.tpl, a.clip, a.from + t).a - a.r0.a);
      if (reach > 0.3) a.scaleA = clamp((Math.hypot(p.pos.x - E.x, p.pos.z - E.z) - G.hug) / reach, 0, 1);
    }
    return true;
  }

  // Dove finisce la corsa dell'esultanza in corso di `c` (x, z) e da dove parte (sx, sz).
  celebrationEnd(c) {
    const a = c.action;
    if (a && a.celebrateRun) return { x: a.endX, z: a.endZ, sx: a.tx, sz: a.tz };
    if (!a || !a.root || !a.celebrate) return { x: c.pos.x, z: c.pos.z, sx: c.pos.x, sz: c.pos.z };
    const r = rootAt(this.tpl, a.clip, a.from + a.end);
    const da = (r.a - a.r0.a) * (a.scaleA ?? 1), ds = (r.s - a.r0.s) * (a.scaleS ?? 1);
    const fx = Math.sin(a.h0), fz = Math.cos(a.h0);
    return { x: a.x0 + fx * da - fz * ds, z: a.z0 + fz * da + fx * ds, sx: a.x0, sz: a.z0 };
  }

  // Corpi che separate() non sposta: a terra, dentro un gesto che li muove con
  // la radice (contrasto, spinta da fermo) o in un giro sul posto.
  firm(p) {
    return p.down || (p.action && (p.action.root || p.action.tackle || (p.action.foulGesture && p.action.clip === FOULACT.clips.ferma))) || (p.trans && p.trans.role === 'turnInPlace' && p.avatar.one === p.trans.one);
  }

  // A gioco fermo, chi ha addosso un corpo che non si sposta (chi ha subito
  // il fallo e cade) se ne allontana a passo: separate() lo traslava in piedi.
  stepAside(dt, p) {
    const min = PLAYER.radius * 2 + 0.15;
    for (const q of this.bodies) {
      if (q === p || !this.firm(q)) continue;
      const dx = p.pos.x - q.pos.x, dz = p.pos.z - q.pos.z, d = Math.hypot(dx, dz);
      if (d >= min) continue;
      const k = d > 1e-3 ? 0.8 / d : 0;
      p.goTo(dt, p.pos.x + (k ? dx * k : 0.8), p.pos.z + dz * k);
      return true;
    }
    return false;
  }

  // Dopo il gol chi non esulta si scansa dalla corsa di chi esulta (la sua
  // posizione e quella fra clear.ahead s): a passo, di lato rispetto alla
  // corsa. Prima la corsa dell'esultanza (fino a 9 m) gli finiva addosso.
  clearWay(dt, p) {
    const s = this.show, c = s && s.p, W = RULES.celebration.clear;
    if (!c || p === c || p.keeper || p.down || (s.mates && s.mates.includes(p))) return false;
    const vx = dt > 0 ? (c.pos.x - c.prev.x) / dt : 0, vz = dt > 0 ? (c.pos.z - c.prev.z) / dt : 0;
    const ax = c.pos.x, az = c.pos.z, dx = vx * W.ahead, dz = vz * W.ahead, l2 = dx * dx + dz * dz;
    const u = l2 > 1e-6 ? Math.max(0, Math.min(1, ((p.pos.x - ax) * dx + (p.pos.z - az) * dz) / l2)) : 0;
    const qx = ax + dx * u, qz = az + dz * u;
    let ox = p.pos.x - qx, oz = p.pos.z - qz, d = Math.hypot(ox, oz);
    if (d >= W.dist) return false;
    if (d < 1e-3) { ox = -dz; oz = dx; d = Math.hypot(ox, oz) || 1; if (d < 1e-3) { ox = 1; oz = 0; d = 1; } }
    p.goTo(dt, qx + ox / d * (W.dist + 0.4), qz + oz / d * (W.dist + 0.4));
    return true;
  }

  kickoff(side = this.userSide) { this.rules.kickoff(side); }

  // Clip del calcio d'inizio per un compagno in direzione `to` (rad nel campo)
  // da chi guarda verso `h`: 135, 180 o 225 gradi. Palla dove la mette la clip.
  kickoffClip(h, to) {
    const rel = wrapAngle(to - h);
    let best = null, bc = Infinity;
    for (const name of RULES.kickoff.clips) {
      const meta = this.tpl.meta[name];
      if (!meta) continue;
      const dir = Number(name.split('_').pop()) * Math.PI / 180;
      const c = Math.abs(wrapAngle(dir - rel));
      if (c < bc) { bc = c; best = name; }
    }
    if (!best) return { clip: null, ball: { ahead: 0.5, left: 0.1 } };
    const b = this.tpl.meta[best].ball0, s = this.tpl.scale;
    return { clip: best, ball: { ahead: b[2] * s, left: b[0] * s } };
  }

  // Esulta? (clip di esultanza della libreria o quella Mixamo)
  isCelebrating(p) {
    const g = p.avatar.gestureName();
    if (!g) return false;
    const meta = this.tpl.meta[g];
    return g === RULES.celebration.clip || (!!meta && meta.role === 'celebrate');
  }

  // Stile della corsa (anim.js): portiere, con la palla al piede, in guardia
  // davanti al portatore avversario, oppure normale.
  locoStyleOf(p) {
    if (p.keeper) return p.holding ? 'keeperBall' : 'keeper';
    const o = this.owner;
    if (o === p) return p.holding ? 'normal' : 'dribble';
    if (o && p.team && o.team !== p.team && this.phase === 'play' && !p.down && !o.holding) {
      const G = ANIM.guard, dx = o.pos.x - p.pos.x, dz = o.pos.z - p.pos.z;
      if (Math.hypot(dx, dz) < G.dist && p.speed < G.speed && Math.abs(wrapAngle(Math.atan2(dx, dz) - p.heading)) < G.angle) return 'defense';
    }
    return 'normal';
  }

  // stop e intercetti del primo tocco (sfumano nella corsa se si riparte)
  isTrap(name) { const m = name && this.tpl.meta[name]; return !!m && (m.role === 'trap' || m.role === 'intercept'); }

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
      // joystick ridotto solo mentre si finisce un gesto vero: partenze e
      // arresti fanno parte della corsa (con l'arresto a peso pieno il
      // giocatore ripartiva a un terzo della velocita', in piedi)
      const mag = p.avatar.acting && !withBall ? inp.mag * ANIM.recoverMove : inp.mag;
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

  // Gesto di chi entra irregolare sul portatore (gestures.startFoulGesture).
  startFoulGesture(p, victim, from) { return startFoulGesture(this, p, victim, from); }

  // Fallo di `off` su `victim`: lo giudica l'arbitro (rules.foul). Con i
  // falli spenti, o a gioco fermo, il contrasto finisce come un dribbling riuscito.
  foul(off, victim, info = {}) {
    if (this.rules.foul(off, victim, { kind: info.kind || 'contrasto', ballFirst: !!info.ballFirst, from: info.from, dir: info.dir, gesture: info.gesture })) return;
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
    this.tickN = (this.tickN || 0) + 1;
    const inp = this.mapInput(this.controls.read(dt));
    this.lastInp = inp;
    const me = this.ctrl;
    if (inp.mag > 0 || inp.any) this.hud.hideHint();
    const touching = inp.mag > 0 || inp.any || Object.values(inp.btn.held).some(Boolean);
    this.idleT = touching ? 0 : this.idleT + dt;
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
      else if (setting && p === taker && p.throwHold) this.rules.aimThrow(dt, p, p === me && !this.opponentsSetPiece() ? inp : null);
      else if (setting && p !== taker && !p.down) {
        if (p.keeper) this.teams[p.team].keeperAI.position(dt);
        else if (p === me && !this.opponentsSetPiece()) this.userMove(dt, p, inp, false);
        else this.teams[p.team].ai.steer(dt, p);
      } else if (p.down) p.drive(dt, 0, 0, 0, {});
      else if (!live) this.settle(dt, p);
      else if (p.keeper && p !== me) this.teams[p.team].keeperAI.update(dt);
      else if (this.receiver === p) { this.aerial(p, inp); if (!p.action) { this.runToBall(dt, p); this.preTrap(p, p === me ? inp : null); } }
      else if (p !== me || this.ctrlAuto) { this.aerial(p, null); if (!p.action) this.teams[p.team].ai.steer(dt, p); }
      else this.userMove(dt, p, inp, withBall);
    }
    if (live || setting) this.referee.update(dt);
    else if (!(this.phase === 'goal' && this.clearWay(dt, this.referee.p))) this.referee.p.drive(dt, 0, 0, 0, { face: { x: b.pos.x - this.referee.p.pos.x, z: b.pos.z - this.referee.p.pos.z } });
    this.walkOff(dt);
    // chi contrasta tiene la posizione anche contro il portatore, che gli
    // gira attorno: spinto via nella posa del contrasto, scivolava sull'erba
    // Chi e' a terra o in un gesto guidato dalla radice (caduta, scivolata) non
    // si sposta mai: spinto via, al passo dopo la radice lo riportava indietro
    // e oscillava di 0,3-0,6 m a fotogramma. Nemmeno chi gira sul posto (clip
    // di giro della libreria): spinto a 0,8 m/s, la posa del giro traslava
    // e chi fa la spinta a due mani da fermo: spinto dal portatore che gli
    // corre addosso, la posa sul posto traslava a 5 m/s (test del 17/10)
    separate(this.bodies, (p) => this.firm(p) ? 3 : p === this.ctrl || p === this.owner ? 2 : 0);
    for (const p of this.everyone) p.confine();
    // chi va addosso al portatore di corsa, soprattutto alle spalle, fa fallo
    bodyContact(this);
    // pesi e fase delle animazioni dopo il movimento: servono subito ai tocchi di palla
    for (const p of this.bodies) { p.locoStyle = this.locoStyleOf(p); p.animStep(dt); }
    for (const p of this.leaving) p.animStep(dt);
    // lo stop di palla e' un gesto da fermi: chi riparte di corsa lo lascia
    // sfumare nella corsa. Una clip di stop da fermo (radice che non si
    // sposta) sfuma gia' oltre ANIM.endMove: fino a cancelAbove traslava
    for (const p of this.everyone) {
      const g = p.avatar.gestureName();
      // lo stop anticipato (preTrap) resta fino al tocco: chi la aspetta si muove ancora
      const pre = p.preTrap && p.preTrap.seq === this.poss.seq && p.preTrap.pk.clip === g;
      if (!p.action && !pre && this.isTrap(g) && p.speed > (this.tpl.meta[g].vIn * this.tpl.scale < ANIM.match.runClip ? ANIM.endMove : FIRST_TOUCH.cancelAbove)) p.avatar.fadeGesture();
      // un gesto fermo non trascina chi si muove: se la sua clip non si
      // sposta e il giocatore si', sfuma nella corsa (calcio dopo il contatto,
      // portiere battuto, stop di palla). Mai durante un'azione in corso.
      // Anche un giro sul posto: spinto da chi corre, girava traslando
      const o = p.avatar.one, a = p.action;
      const moved = Math.hypot(p.pos.x - p.prev.x, p.pos.z - p.prev.z) / dt;
      if (o && !o.drive && o.t < o.hold && moved > ANIM.endMove && (!a || (a.kick && a.done)) && p.avatar.gestureSpeed() < ANIM.stillRoot) p.avatar.fadeGesture(ANIM.trans.cut);
    }

    for (const p of this.everyone) if (p.kickQueue) this.stepKickQueue(dt, p);
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
      if (!this.owner) this.deflect();
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
      // chargeT, chargeOwn: secondi dal tasto e palla gia' al piede al tasto (KICK.setup)
      if (k) { this.charging = k; this.charge = 0; this.chargeT = 0; this.chargeOwn = this.owner === me; }
    }
    if (this.charging) {
      this.charge = Math.min(1, this.charge + dt / POWER.chargeTime);
      this.chargeT += dt;
      if (inp.up[this.charging] || !inp.held[this.charging]) {
        this.buffer = { kind: this.charging, power: this.charge, t: CONTROL.buffer, wait: this.chargeOwn ? Math.max(0, KICK.setup - this.chargeT) : 0 };
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
    // palla al piede: come nel riferimento si continua la conduzione fino a
    // KICK.setup secondi dal tasto, poi parte il gesto (ANIM.*.lead)
    if (this.buffer.wait > 0 && this.owner === me) { this.buffer.wait -= dt; return; }
    const buf = this.buffer;
    this.buffer = null;
    if (buf.kind === 'feint') this.startFeint(me, inp);
    else this.startKick(me, buf.kind, buf.power, inp);
  }

  // Calcio deciso dall'IA: come per il tasto dell'utente, il portatore
  // continua la conduzione per KICK.setup secondi, poi parte il gesto.
  queueKick(p, kind, power, inp) {
    p.kickQueue = { kind, power, inp, t: KICK.setup, seq: this.poss.seq };
  }

  stepKickQueue(dt, p) {
    const q = p.kickQueue;
    if (this.owner !== p || this.poss.seq !== q.seq || this.phase !== 'play' || p.action || p.down) { p.kickQueue = null; return; }
    if ((q.t -= dt) > 0) return;
    p.kickQueue = null;
    if (!this.canKick(p)) return;
    // verso dove sta adesso il compagno scelto
    const inp = q.inp, to = inp.to;
    if (to) { const dx = to.pos.x - p.pos.x, dz = to.pos.z - p.pos.z, l = Math.hypot(dx, dz) || 1; inp.x = dx / l; inp.z = dz / l; }
    this.startKick(p, q.kind, q.power, inp);
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
      // come in PES chi riceve il filtrante parte gia' al comando, verso lo spazio
      if (a.target && !a.target.keeper) this.teams[a.target.team].ai.goRun(a.target);
    } else if (kind === 'cross') {
      const c = chooseCross(p, ax, az, mates, opp, power);
      a.target = c.mate;
      a.cross = c.kind;
      a.apex = c.apex;
      a.spot = { tx: c.tx, tz: c.tz };
    }
    a.aim = this.kickAim(p, a);
    a.dx = a.aim.tx - b.pos.x; a.dz = a.aim.tz - b.pos.z;
    // Dal comando al contatto: K.lead con la palla al piede, meno di prima o
    // per liberarsi di un contrasto (inp.quick). Uguale a ogni livello: la
    // clip scelta per corrispondenza parte e si accelera per rispettarlo.
    const quick = !!(inp && inp.quick);
    const lead = this.owner === p && !quick ? K.lead : quick ? DUEL.quickPass : ANIM.firstTime;
    a.contact = lead;
    a.end = lead + K.recover;
    const bx = b.pos.x - p.pos.x, bz = b.pos.z - p.pos.z;
    const pick = pickKick(this.tpl, p, K, {
      lead, speed: p.speed, ballY: b.pos.y,
      // durante il calcio il giocatore va verso il bersaglio a K.moveMag del joystick
      move: (p.speed + K.moveMag * p.params.maxSpeed * PLAYER.jogFactor) / 2,
      turn: wrapAngle(Math.atan2(a.dx, a.dz) - p.heading),
      ballLeft: -(bx * p.rightX + bz * p.rightZ),
      power: kind === 'shot' ? power : clamp(Math.hypot(a.dx, a.dz) / 40, 0, 1),
      lob: kind === 'cross' && a.cross === 'cross'
    });
    // il gesto sfuma prima che la clip finisca (mai prima del contatto): i
    // passaggi durano 0,33-0,37 s e l'ultimo fotogramma restava fermo a peso
    // pieno per tutto il recupero mentre il giocatore si spostava
    const hold = (clip, from, rate) => Math.max(lead, Math.min(a.end, (clipDuration(this.tpl, clip) - from) / rate - ANIM.fadeOut));
    // caricamento corto: il gesto e' a peso pieno prima del contatto
    const fade = Math.min(ANIM.fadeIn, lead * ANIM.kickFade);
    if (pick) p.avatar.playOnce(pick.clip, pick.from, hold(pick.clip, pick.from, pick.rate), pick.rate, fade);
    else if (K.fallback) { const from = Math.max(0, K.fallback.contact - lead); p.avatar.playOnce(K.fallback.clip, from, hold(K.fallback.clip, from, 1), 1, fade); }
    a.clip = pick ? pick.clip : K.fallback && K.fallback.clip;
    // Il corpo si gira come la radice della clip, non verso il bersaglio:
    // cosi' al contatto la palla parte dove la calcia la clip (pick.dir
    // rispetto al corpo all'inizio). Il poco che manca alla direzione voluta
    // (corr) si aggiunge piano fino al contatto.
    if (pick) {
      a.h0 = p.heading; a.mh0 = p.moveHeading; a.clipFrom = pick.from; a.clipRate = pick.rate; a.yaw0 = pick.yaw0; a.clipDir = pick.dir;
      a.corr = clamp(wrapAngle(Math.atan2(a.dx, a.dz) - p.heading - pick.dir), -ANIM.kickCorr, ANIM.kickCorr);
    }
    // calcio da fermo: il giocatore non avanza. Quasi fermo al comando prende
    // una clip sul posto, poi andava verso il bersaglio fino a 1,7 m/s e la
    // posa del calcio traslava
    if (a.clip && kickStill(this.tpl, a.clip)) a.moveMag = 0;
    p.action = a;
  }

  // Un passo del gesto in corso. I calci si girano verso il bersaglio e
  // calciano al contatto; i gesti con spostamento seguono la radice della clip.
  stepAction(dt, p, inp) {
    const a = p.action;
    a.t += dt * (a.rate || 1);
    if (a.kick) {
      if (a.h0 !== undefined) {
        // fino al contatto il corpo segue la rotazione della clip; la corsa gira con lui
        const u = a.contact > 0 ? Math.min(1, a.t / a.contact) : 1;
        const turn = rootAt(this.tpl, a.clip, a.clipFrom + Math.min(a.t, a.contact) * a.clipRate).yaw - a.yaw0 + a.corr * u;
        const h = wrapAngle(a.h0 + turn), mv = wrapAngle(a.mh0 + turn);
        p.drive(dt, Math.sin(mv), Math.cos(mv), a.moveMag, { withBall: this.owner === p, face: { x: Math.sin(h), z: Math.cos(h) } });
        p.heading = h;
      } else p.drive(dt, a.dx, a.dz, a.moveMag, { withBall: this.owner === p, turnMul: a.turn });
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

  // Finta: la roulette verso il lato del joystick, la palla resta al piede.
  // La clip della libreria gira a destra, la copia specchiata a sinistra.
  startFeint(p, inp) {
    let side = 'right';
    if (inp && inp.rs && inp.rs.fx !== undefined) side = inp.rs.fx * p.rightX + inp.rs.fz * p.rightZ < 0 ? 'left' : 'right';
    else if (inp && inp.mag > 0) side = inp.x * p.rightX + inp.z * p.rightZ < 0 ? 'left' : 'right';
    else side = (p.feintSide = p.feintSide === 'right' ? 'left' : 'right');
    const clip = this.tpl.clips[FEINT.clip[side]] ? FEINT.clip[side] : 'skill_spin_' + side;
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
      return { tx: pt.tx + e.x * 0.5, tz: pt.tz + e.z * 0.5, t: pt.t };
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
      b.rollAt(aim.tx, aim.tz, throughSpeed(d, a.power, aim.t));
      this.poss.fly('filtrante', p, a.target);
      // chi riceve corre adesso nello spazio (se non era gia' partito al comando)
      if (a.target && a.target.run && !a.target.run.go) this.teams[a.target.team].ai.goRun(a.target);
    } else if (a.kind === 'cross') {
      b.lobTo(aim.tx, aim.tz, a.apex);
      // effetto all'indietro e a rientrare, con la mira che lo tiene sul punto
      if (this.kickSpin(p, a, b.vel, _kw)) { aimWithSpin(b.pos, b.vel, _kw, 0, true); b.w.copy(_kw); }
      this.poss.fly(a.cross, p, a.target);
    } else {
      b.kick(aim.v.vx, aim.v.vy, aim.v.vz);
      if (this.kickSpin(p, a, b.vel, _kw)) {
        // stesso punto sulla linea di porta di prima: l'effetto curva, la mira resta
        const toLine = Math.abs((this.dirOf(p.team) * PITCH.length / 2 - b.pos.x) / (b.vel.x || 1e-3)) * Math.hypot(b.vel.x, b.vel.z);
        aimWithSpin(b.pos, b.vel, _kw, Math.min(60, toLine));
        b.w.copy(_kw);
      }
      this.poss.fly('tiro', p, null);
    }
    // passaggi rasoterra: rotolano (Ball.kick), col piatto un filo di effetto
    if ((a.kind === 'pass' || a.kind === 'through') && a.clip) {
      const meta = this.tpl.meta[a.clip], c = meta && meta.ev && meta.ev.contact;
      b.w.y += (c && c.foot === 'L' ? -1 : 1) * BALL.kickSpin.pass;
    }
    this.lastKick = { kind: a.kind, power: a.power, speed: b.vel.length(), dist: d };
    this.note(a.kind === 'shot' ? 'tiro' : 'calcio', { p, tipo: a.kind, potenza: a.power, velocita: this.lastKick.speed, a: a.target || null, clip: a.clip || '' });
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
  // superarlo; da vicino il busto guarda la palla. Un passaggio che arriva
  // con l'intercetto vicino si aspetta di fronte: frenata e giro del busto
  // verso la palla in circa 0,3 s, come nel riferimento.
  runToBall(dt, p) {
    if (this.poss.flying && this.poss.kind === 'filtrante' && this.poss.to === p) { this.runOnto(dt, p); return; }
    const b = this.ball, s = this.intercept(p), R = RECEIVE;
    const dx = s.x - p.pos.x, dz = s.z - p.pos.z, d = Math.hypot(dx, dz);
    const bx = b.pos.x - p.pos.x, bz = b.pos.z - p.pos.z;
    const wait = this.poss.flying && this.poss.to === p && d < R.waitDist;
    const face = wait || Math.hypot(bx, bz) < R.faceDist ? { x: bx, z: bz } : null;
    const o = wait ? { face, decel: R.brake, faceRate: R.faceRate[0] + (R.faceRate[1] - R.faceRate[0]) * clamp(p.speed / 5, 0, 1), faceAccel: R.faceAccel } : { sprint: true, face };
    const brake = Math.sqrt(2 * (wait ? R.brake : PLAYER.decel) * d) / p.params.maxSpeed;
    if (d > 0.15) p.drive(dt, dx, dz, Math.min(1, brake), o);
    else p.drive(dt, 0, 0, 0, { ...o, face: face || { x: bx, z: bz } });
  }

  // Filtrante (skill: "Filtranti e inserimenti"): il ricevente corre nello
  // spazio, non verso la palla: in corsa piena verso il punto in cui arriva
  // insieme al pallone, mai fermo ad aspettarlo; prende la palla in corsa.
  runOnto(dt, p) {
    const b = this.ball, T = THROUGH;
    const path = b.predict(this.path, RECEIVE.step, RECEIVE.horizon);
    const d = this.dirOf(p.team);
    // il primo punto della traiettoria dove arriva insieme al pallone correndo
    // al massimo (runTime, con l'accelerazione): prima sceglieva il primo
    // punto raggiungibile al 60% della velocita' e frenava proprio al
    // passaggio, poi la palla gli scappava (filtranti inutili, 04/10)
    // Palla che arriva da dietro (lui e' gia' davanti, in corsa): continua a
    // correre e lei lo raggiunge, nel primo punto in cui non e' piu' in
    // anticipo; palla gia' davanti a lui: il primo punto che raggiunge.
    // Mai indietro lungo la strada della palla: tornava a prenderla ai piedi.
    const bl = Math.hypot(b.vel.x, b.vel.z) || 1, ux = b.vel.x / bl, uz = b.vel.z / bl;
    let pick = null, early0 = null;
    for (const s of path) {
      if (s.y > CONTROL.trapHeight) continue;
      // mai indietro verso la propria porta, ne' dietro di lui sulla strada della palla
      if ((s.x - p.pos.x) * d < -T.behind || (s.x - p.pos.x) * ux + (s.z - p.pos.z) * uz < -T.behindBall) continue;
      const dist = Math.max(0, Math.hypot(s.x - p.pos.x, s.z - p.pos.z) - RECEIVE.capture);
      const early = runTime(p, dist, s.x - p.pos.x, s.z - p.pos.z) + RECEIVE.reaction <= s.t;
      if (early0 === null) early0 = early;
      if (early !== early0) { pick = s; break; }
    }
    const s = pick || path[path.length - 1];
    const dx = s.x - p.pos.x, dz = s.z - p.pos.z, dd = Math.hypot(dx, dz);
    const bx = b.pos.x - p.pos.x, bz = b.pos.z - p.pos.z;
    if (dd < 0.15) { p.drive(dt, bx, bz, T.runMin, { sprint: true }); return; }
    p.drive(dt, dx, dz, 1, { sprint: true, face: Math.hypot(bx, bz) < 2.5 ? { x: bx, z: bz } : null });
  }


  // Palla in coordinate polari attorno al giocatore (angolo nel campo): lo
  // segue a ogni passo e per cambiare lato gira attorno ai piedi, a velocita'
  // limitata. In corsa il destro la tocca appena prima di appoggiare: la palla
  // si allunga subito e rallenta, il giocatore la riprende al tocco dopo.
  dribble(dt) {
    const p = this.owner, b = this.ball, D = DRIBBLE;
    // controllo in corso (startTrap): la palla va da sola con la fisica, il
    // corpo gira come la clip di stop; poi la conduzione riparte da li'
    const tr = p.trap;
    if (tr && (tr.seq !== this.poss.seq || p.action)) p.trap = null;
    else if (tr) {
      tr.t += dt;
      if (tr.k) p.face(wrapAngle(tr.h0 + rootAt(this.tpl, tr.clip, Math.min(tr.t, tr.T)).yaw * tr.k));
      b.step(dt);
      // smorzata verso la velocita' del giocatore, ma mai sotto di lui: se le
      // arriva sopra la palla va avanti fino a minAhead m davanti al busto
      const T = RECEIVE.trap, c = Math.exp(-T.cushion * dt);
      const fx = Math.sin(p.heading), fz = Math.cos(p.heading);
      const gap = Math.max(0, T.minAhead - ((b.pos.x - p.pos.x) * fx + (b.pos.z - p.pos.z) * fz));
      const vtx = p.vel.x + fx * gap * T.keepRate, vtz = p.vel.z + fz * gap * T.keepRate;
      b.vel.x = vtx + (b.vel.x - vtx) * c;
      b.vel.z = vtz + (b.vel.z - vtz) * c;
      p.ballAngle = Math.atan2(b.pos.x - p.pos.x, b.pos.z - p.pos.z);
      p.ballDist = Math.hypot(b.pos.x - p.pos.x, b.pos.z - p.pos.z);
      if (tr.t >= tr.T || p.ballDist > RECEIVE.trap.lost) {
        p.trap = null;
        const rel = p.carryRel || (p.carryRel = { vx: 0, vz: 0, seq: 0, tick: 0 });
        rel.vx = b.vel.x - p.vel.x; rel.vz = b.vel.z - p.vel.z; rel.seq = this.poss.seq; rel.tick = this.tickN;
      }
      return;
    }
    const run = Math.min(1, p.speed / p.params.maxSpeed);
    const moving = smoothstep(D.moveFrom, D.moveFull, p.speed);
    // fase del tocco: dalle clip di conduzione (Ball_Bone), altrimenti la config
    const u = wrap01(p.gait.phase - (this.tpl.dribbleTouch ?? D.touchPhase));
    const touch = D.touch[0] + (D.touch[1] - D.touch[0]) * run;
    const swing = (D.swing[0] + (D.swing[1] - D.swing[0]) * run) * (p.close ? D.closeSwing : 1);
    // durante un calcio la palla aspetta il piede, niente allungo
    const kicking = p.action && p.action.kick;
    // durante un calcio la palla va dove il piede della clip la incontra
    // (Ball_Bone al fotogramma del contatto) e ci arriva esattamente allora:
    // al contatto parte dal piede, non da un punto davanti al giocatore
    if (kicking && !p.action.done && this.kickBallTarget(p, p.action, _kb)) {
      const left = Math.max(dt, p.action.contact - p.action.t), k = Math.min(1, dt / left);
      const nx = b.pos.x + (_kb.x - b.pos.x) * k, nz = b.pos.z + (_kb.z - b.pos.z) * k;
      b.carry(nx, nz, (nx - b.pos.x) / dt, (nz - b.pos.z) / dt, dt);
      return;
    }
    const dist = kicking ? D.kick : D.rest + (touch - D.rest) * moving + swing * moving * Math.sin(Math.PI * Math.pow(u, D.push));
    // sul piede che tocca (destro), o sul lato lontano dal difensore se la protegge
    const side = p.shield ? p.shield * AI.carrier.protect.shieldSide : 1;
    let want = p.heading - Math.atan2(D.side * side, dist);
    // quasi fermo con la palla di lato o dietro: si gira il giocatore verso la
    // palla, non la palla attorno a lui (replay 4 del 04/10)
    const steering = p === this.ctrl && this.lastInp && this.lastInp.mag > 0.2;
    if (p.speed < D.orbitBelow && !kicking && !steering && Math.abs(wrapAngle(want - p.ballAngle)) > D.orbitAngle) {
      const g = wrapAngle(p.ballAngle + Math.atan2(D.side * side, dist) - p.heading), r = D.faceBall * dt;
      p.face(wrapAngle(p.heading + Math.max(-r, Math.min(r, g))));
      want = p.heading - Math.atan2(D.side * side, dist);
    }
    const turn = wrapAngle(want - p.ballAngle);
    const step = (p.speed < D.orbitBelow ? D.stillTurn : D.turnRate) * dt;
    p.ballAngle = wrapAngle(p.ballAngle + Math.max(-step, Math.min(step, turn)));
    p.ballDist += (dist - p.ballDist) * (1 - Math.exp(-D.follow * dt));
    // Mentre gira attorno ai piedi la palla si allarga: mai dentro le gambe.
    const r = Math.max(p.ballDist, D.rest * (1 + 0.4 * Math.min(1, Math.abs(turn))));
    const ang = p.ballAngle;
    let nx = p.pos.x + Math.sin(ang) * r, nz = p.pos.z + Math.cos(ang) * r;
    if (this.dribbleRoll(dt, p, b, u, touch, side, turn, kicking, nx, nz)) return;
    // Rispetto al giocatore la palla non va piu' veloce di D.maxRel e non cambia
    // velocita' piu' in fretta di D.relAcc: all'uscita da un tocco (palla che
    // rotola), dopo un arresto o una svolta la riprende senza schizzare via a
    // 15 m/s per tre fotogrammi, che facevano sobbalzare palla e telecamera.
    // La continuita' vale solo fra due passi della conduzione (tocco continuo o
    // palla che rotolava fra due tocchi, p.carryRel): appena ricevuta la palla
    // ha ancora la velocita' del passaggio e la si ferma come prima.
    const mx = p.pos.x - p.prev.x, mz = p.pos.z - p.prev.z;
    const rx = nx - b.pos.x - mx, rz = nz - b.pos.z - mz, rl = Math.hypot(rx, rz);
    const cr = p.carryRel && p.carryRel.seq === this.poss.seq && p.carryRel.tick === this.tickN - 1 ? p.carryRel : null;
    if (dt > 0 && rl > 1e-6) {
      const vmax = Math.min(D.maxRel, Math.sqrt(2 * D.relAcc * rl), rl / dt);
      let wx = rx / rl * vmax, wz = rz / rl * vmax;
      if (cr) {
        const ax = wx - cr.vx, az = wz - cr.vz, al = Math.hypot(ax, az), amax = D.relAcc * dt;
        if (al > amax) { wx = cr.vx + ax * amax / al; wz = cr.vz + az * amax / al; }
      }
      nx = b.pos.x + mx + wx * dt;
      nz = b.pos.z + mz + wz * dt;
    }
    const rel = p.carryRel || (p.carryRel = { vx: 0, vz: 0, seq: 0, tick: 0 });
    rel.vx = dt > 0 ? (nx - b.pos.x - mx) / dt : 0; rel.vz = dt > 0 ? (nz - b.pos.z - mz) / dt : 0;
    rel.seq = this.poss.seq; rel.tick = this.tickN;
    b.carry(nx, nz, dt > 0 ? (nx - b.pos.x) / dt : 0, dt > 0 ? (nz - b.pos.z) / dt : 0, dt);
  }

  // Conduzione a tocchi (skill: "tocchi di palla sincronizzati con i passi",
  // "mai attaccata rigidamente al piede"): quando il piede tocca (fase del
  // passo del Ball_Bone delle clip di conduzione) la palla riceve la velocita'
  // che la porta dove sara' il piede al tocco dopo, e in mezzo rotola libera
  // con la fisica. Da fermi o piano, in protezione, in controllo stretto,
  // durante un calcio e in una svolta stretta resta il tocco continuo; se la
  // palla si allontana troppo da dove dovrebbe stare (il giocatore cambia
  // direzione) torna al tocco continuo, che la riprende senza scatti.
  dribbleRoll(dt, p, b, u, touch, side, turn, kicking, cx, cz) {
    const R = DRIBBLE.roll, st = p.roll || (p.roll = { u, rate: 1.4, on: false });
    const du = wrap01(u - st.u);
    if (du < 0.5 && dt > 0) st.rate += (Math.max(0.6, du / dt) - st.rate) * Math.min(1, dt * 8);
    const touched = u < st.u && st.u - u > 0.5;
    st.u = u;
    // possesso nuovo (ricezione, contrasto vinto): si riparte dal tocco continuo
    if (st.seq !== this.poss.seq) { st.seq = this.poss.seq; st.on = false; }
    // mai durante un gesto (finta, calcio, stop): la palla la porta il gesto
    const can = !kicking && !p.action && !p.shield && !p.close && p.speed > R.minSpeed && Math.abs(turn) < R.maxTurn;
    if (!can) { st.on = false; return false; }
    // lontana da dove la vorrebbe il tocco continuo: si torna a quello
    if (st.on && Math.hypot(b.pos.x - cx, b.pos.z - cz) > R.maxErr) { st.on = false; return false; }
    if (touched || !st.on) {
      // tocco solo con la palla al piede (non mentre corre avanti libera)
      if (!st.on && Math.hypot(b.pos.x - cx, b.pos.z - cz) > R.startErr) return false;
      const T = clamp(1 / st.rate, R.minT, R.maxT);
      const h = p.heading - Math.atan2(DRIBBLE.side * side, touch);
      const tx = p.pos.x + p.vel.x * T + Math.sin(h) * touch, tz = p.pos.z + p.vel.z * T + Math.cos(h) * touch;
      const dx = tx - b.pos.x, dz = tz - b.pos.z, d = Math.hypot(dx, dz);
      if (d < 0.05) { st.on = false; return false; }
      const v0 = Math.min(R.maxSpeed, rollSpeedIn(d, T));
      b.pos.y = BALL.radius;
      b.kick(dx / d * v0, 0, dz / d * v0);
      st.on = true;
      this.note('tocco', { p, velocita: v0, tempo: T });
    }
    b.step(dt);
    p.ballAngle = Math.atan2(b.pos.x - p.pos.x, b.pos.z - p.pos.z);
    p.ballDist = Math.hypot(b.pos.x - p.pos.x, b.pos.z - p.pos.z);
    // al ritorno al tocco continuo la palla riparte da questa velocita'
    const rel = p.carryRel || (p.carryRel = { vx: 0, vz: 0, seq: 0, tick: 0 });
    rel.vx = b.vel.x - p.vel.x; rel.vz = b.vel.z - p.vel.z; rel.seq = this.poss.seq; rel.tick = this.tickN;
    return true;
  }

  // Dove sara' la palla al contatto del calcio in corso: il Ball_Bone della
  // clip in quel fotogramma, nel riferimento del giocatore (che intanto corre).
  kickBallTarget(p, a, out) {
    const meta = a.clip && this.tpl.meta[a.clip], c = meta && meta.ev && meta.ev.contact;
    if (!c || !c.ball) return null;
    const s = this.tpl.scale, left = Math.max(0, a.contact - a.t);
    const bx = c.ball[0] * s, bz = c.ball[2] * s;
    out.x = p.pos.x + p.vel.x * left + p.dirX * bz - p.rightX * bx;
    out.z = p.pos.z + p.vel.z * left + p.dirZ * bz - p.rightZ * bx;
    return out;
  }

  // Rotazione dal punto d'impatto (skill): il piede che calcia dalla clip.
  // Col piatto il tiro e il passaggio girano attorno alla verticale verso il
  // lato del piede che non calcia (a giro); col collo pieno poca rotazione,
  // un po' in avanti (scende); il cross e il lancio dal sotto della palla,
  // all'indietro e a rientrare. Restituisce w (rad/s) per la velocita' v.
  kickSpin(p, a, v, out) {
    const S = BALL.kickSpin, meta = a.clip && this.tpl.meta[a.clip], c = meta && meta.ev && meta.ev.contact;
    const foot = c && c.foot === 'L' ? -1 : 1;
    const hs = Math.hypot(v.x, v.z) || 1, fx = v.x / hs, fz = v.z / hs;
    if (a.kind === 'shot') {
      if (a.power < S.placedBelow) return out.set(fz * S.placedTop, foot * S.curl, -fx * S.placedTop);
      return out.set(fz * S.instepTop, foot * S.knuckle * (Math.random() * 2 - 1), -fx * S.instepTop);
    }
    if (a.kind === 'cross') return out.set(-fz * S.back, foot * S.cross, fx * S.back);
    return null;
  }

  // Rimbalzo sul corpo (skill: "collisioni palla-corpo"): tiri e palloni alti
  // toccano gambe, busto e testa dei giocatori di movimento (sfere sulle ossa
  // vere, come il portiere ma senza le mani) e deviano: restituzione lungo la
  // normale, parte della velocita' di lato, un po' di rotazione. Chi ha appena
  // calciato e chi la deve ricevere no: quello lo fa lo stop.
  // Anche i rasoterra (blocco B): un pallone basso che prende il piede o la
  // tibia lo controlla chi lo tocca (trapLow), altrimenti rimbalza sulla
  // gamba restando a terra. Prima i palloni bassi sotto fastLoose m/s non
  // toccavano nessuno e, fallito l'anticipo, attraversavano le gambe.
  deflect() {
    const b = this.ball, poss = this.poss, D = BALL.deflect;
    if (!b.live || poss.owned) return false;
    const shot = poss.flying && poss.kind === 'tiro';
    const low = !shot && b.pos.y < D.minY && b.vel.length() < D.fastLoose;
    for (const p of this.everyone) {
      if (p.keeper || p.sentOff || p === poss.to || (this.kickLock && this.kickLock.p === p)) continue;
      if (Math.abs(b.pos.x - p.pos.x) > D.check || Math.abs(b.pos.z - p.pos.z) > D.check) continue;
      const hit = bodyHit(p, b, false, poss.clock);
      if (!hit) continue;
      const leg = hit.c.y < D.legY;
      if (low && leg && !p.down && !p.action && this.trapLow(p)) {
        this.receive(p, null, poss.flying && poss.team && poss.team !== p.team ? 'intercetto' : 'controllo');
        return true;
      }
      const n = _dn.subVectors(hit.q, hit.c);
      if (n.lengthSq() < 1e-8) n.copy(b.vel).multiplyScalar(-1);
      // rasoterra sulla gamba: il rimbalzo resta orizzontale, la palla a terra
      if (low) n.y = 0;
      if (n.lengthSq() < 1e-8) n.set(-b.vel.x, 0, -b.vel.z);
      n.normalize();
      b.pos.copy(hit.c).addScaledVector(n, hit.rad + BALL.radius + 0.005);
      const v = b.vel, vn = v.dot(n), speed = v.length();
      if (vn < 0) v.addScaledVector(n, -vn).multiplyScalar(D.keep).addScaledVector(n, -vn * D.rest);
      b.w.multiplyScalar(0.4).add(_dw.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(D.spin));
      poss.loose('deviazione', p);
      this.lastDeflect = { seq: poss.seq, p };
      this.kickLock = { p, t: D.lock };
      this.note('deviazione', { p, velocita: speed, parte: hit.name || '' });
      return true;
    }
    return false;
  }

  // Rasoterra arrivato sul piede o sulla tibia di chi non lo aspettava: lo
  // controlla con la probabilita' dell'anticipo (AI.intercept, dalla difesa,
  // meno con la palla veloce rispetto a lui); un compagno quasi sempre.
  trapLow(p) {
    const b = this.ball, poss = this.poss, I = AI.intercept;
    if (p.keeper && this.teams[p.team].keeperAI.handsOnly()) return false;
    const rel = Math.hypot(b.vel.x - p.vel.x, b.vel.z - p.vel.z);
    if (poss.team && poss.team === p.team) return Math.random() < BALL.deflect.mateTrap;
    const def = Math.max(0, Math.min(1, (p.params.tackle - 0.25) / 0.55));
    return Math.random() < I.base + I.def * def - I.speed * rel;
  }

  // Il destinatario la controlla sempre (al corpo, o nel punto piu' vicino
  // entro receiveRadius), a ogni velocita'; i suoi compagni non gliela rubano;
  // libera, la prende il piu' vicino.
  contacts(inp) {
    const b = this.ball, poss = this.poss;
    const locked = (p) => this.kickLock && this.kickLock.p === p;
    const to = this.receiver;
    // il destinatario la controlla quando gli arriva al corpo, o nel punto piu'
    // vicino se gli passa accanto: prima la prendeva a 1,25 m e la palla
    // cambiava strada a mezz'aria per andargli ai piedi
    if (to && !locked(to) && !to.down && b.pos.y < RECEIVE.trapHeight) {
      const rx = b.pos.x - to.pos.x, rz = b.pos.z - to.pos.z, d = Math.hypot(rx, rz);
      // ...o lenta rispetto a lui (tocco d'inizio, palla che si ferma): ci arriva con un passo
      const rvx = b.vel.x - to.vel.x, rvz = b.vel.z - to.vel.z;
      const away = rx * rvx + rz * rvz > 0, slow = Math.hypot(rvx, rvz) < RECEIVE.slowRel;
      // stop gia' partito (preTrap): la palla si ferma dove la tocca il piede della clip
      const pre = to.preTrap && to.preTrap.seq === poss.seq ? to.preTrap : null, P = RECEIVE.pre;
      const capture = pre ? Math.max(P.minR, pre.pk.touch.r + P.slack) : RECEIVE.capture;
      const late = !!pre && poss.clock - pre.clock > pre.pk.touch.t - pre.from + P.late;
      if (d < capture || (d < CONTROL.receiveRadius && (away || slow || late))) { this.receive(to, inp, 'ricezione'); return; }
    }
    if (b.pos.y > CONTROL.trapHeight) return;
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
    if (!hands) this.firstTouch(p, p === this.ctrl ? inp : null, cause);
  }

  // Ricezione come nel riferimento: lo stop parte prima che arrivi la palla,
  // cosi' il piede la tocca nel fotogramma del tocco della clip. Prima la
  // clip partiva quando la palla era gia' stata fermata a 0,6 m dal corpo:
  // palla "a calamita" e tocco a vuoto 0,2-0,4 s dopo.
  preTrap(p, inp) {
    const poss = this.poss, b = this.ball, R = ANIM.receive, P = RECEIVE.pre;
    if (!poss.flying || poss.to !== p || p.down || p.keeper || p.trap) return;
    if (p.preTrap && p.preTrap.seq === poss.seq) return;
    if (b.pos.y > RECEIVE.trap.airY) return;
    const o = this.trapTurn(p, inp);
    const pk = pickTrap(this.tpl, p, { turn: o.turn, ballY: BALL.radius, speed: p.speed });
    if (!pk || !pk.touch) return;
    const r = Math.max(P.minR, pk.touch.r + P.slack);
    const path = b.predict(this._prePath || (this._prePath = []), RECEIVE.step, pk.touch.t + 0.1);
    // arrivo: dentro il raggio del tocco o, se gli passa accanto, il punto piu'
    // vicino entro CONTROL.receiveRadius (dove lo controlla comunque)
    let at = null, near = null, nd = Infinity;
    for (const s of path) {
      const d = Math.hypot(s.x - p.pos.x, s.z - p.pos.z);
      if (d <= r) { at = s.t; break; }
      if (d < nd) { nd = d; near = s.t; }
    }
    if (at === null && nd <= CONTROL.receiveRadius) at = near;
    if (at === null || at > pk.touch.t) return;
    const from = Math.max(0, pk.touch.t - at);
    p.avatar.playOnce(pk.clip, from, R.length, 1, R.fade, p.speed >= FIRST_TOUCH.receiveBelow);
    p.preTrap = { seq: poss.seq, pk, from, clock: poss.clock };
  }

  // Rotazione voluta del primo tocco: verso il joystick se e' lontano dal busto.
  trapTurn(p, inp) {
    if (!inp || inp.mag <= 0 || this.buffer) return { turn: 0, want: null };
    const ang = Math.acos(Math.max(-1, Math.min(1, inp.x * p.dirX + inp.z * p.dirZ)));
    if (ang <= FIRST_TOUCH.minAngle) return { turn: 0, want: null };
    const want = Math.atan2(inp.x, inp.z);
    return { turn: wrapAngle(want - p.heading), want };
  }

  // Primo tocco: col joystick lontano dal busto la palla va subito da quella
  // parte e il giocatore si gira con lei, restando in possesso; da fermi,
  // senza joystick, si vede lo stop.
  firstTouch(p, inp, cause) {
    const R = ANIM.receive, b = this.ball;
    // stop gia' partito (preTrap): si continua quella clip dal punto in cui e'
    const pre = p.preTrap && p.preTrap.seq === this.poss.seq ? p.preTrap : null;
    p.preTrap = null;
    if (pre && cause === 'ricezione' && !p.action) {
      const o = this.trapTurn(p, inp);
      if (o.want !== null) p.moveHeading = o.want;
      this.startTrap(p, pre.pk, o.turn, o.want, pre.from + (this.poss.clock - pre.clock));
      return;
    }
    // intercetto: la gamba che va sulla palla avversaria (clip Intercept della libreria)
    // mai durante un'azione (il recupero di un calcio): il gesto sarebbe un altro
    if (cause === 'intercetto' && !p.keeper && !p.avatar.busy && !p.action) {
      const bx = b.pos.x - p.pos.x, bz = b.pos.z - p.pos.z;
      const pk = pickIntercept(this.tpl, p, { ballLeft: -(bx * p.rightX + bz * p.rightZ), ballAhead: bx * p.dirX + bz * p.dirZ, speed: p.speed });
      if (pk) { p.avatar.playOnce(pk.clip, Math.max(0, pk.contact - R.lead), R.length, 1, R.fade, p.speed > FIRST_TOUCH.receiveBelow); return; }
    }
    // una partenza, un arresto o una svolta della corsa non impediscono lo stop
    const busy = !!p.action || (p.avatar.busy && !(p.avatar.one && p.avatar.one.loco));
    if (inp && inp.mag > 0 && !this.buffer) {
      const ang = Math.acos(Math.max(-1, Math.min(1, inp.x * p.dirX + inp.z * p.dirZ)));
      if (ang > FIRST_TOUCH.minAngle) {
        const want = Math.atan2(inp.x, inp.z), turn = wrapAngle(want - p.heading);
        p.moveHeading = want;
        // primo tocco orientato: lo stop che gira il corpo e porta la palla da quella parte
        if (!busy) {
          const pk = pickTrap(this.tpl, p, { turn, ballY: b.pos.y, speed: p.speed });
          if (pk) { p.avatar.playOnce(pk.clip, 0, R.length, 1, R.fade, true); this.startTrap(p, pk, turn, want); return; }
        }
        p.face(wrapAngle(p.heading + turn * FIRST_TOUCH.turn));
        p.ballDist = DRIBBLE.touch[1] + DRIBBLE.swing[1] * 0.5;
        return;
      }
    }
    if (busy) return;
    // stop di palla scelto per altezza della palla e velocita'; in corsa lo
    // stop in corsa, parte della corsa
    const pk = pickTrap(this.tpl, p, { turn: 0, ballY: b.pos.y, speed: p.speed });
    if (pk) { p.avatar.playOnce(pk.clip, 0, R.length, 1, R.fade, p.speed >= FIRST_TOUCH.receiveBelow); this.startTrap(p, pk, 0, null); }
  }

  // Controllo della palla (skill: "Le ricezioni usano le clip di controllo
  // col Ball_Bone"): la palla tocca il corpo dove arriva e da li' va, con la
  // fisica, dove la clip di stop la lascia alla fine (ballEnd), o nella
  // direzione della levetta nel primo tocco orientato. Il petto la smorza e
  // cade sul piede con la gravita', il piede la ferma rotolando. Prima la
  // conduzione la tirava subito a terra e le girava attorno al giocatore fermo
  // (replay 4 del 04/10). Il corpo gira come la clip (yawEnd, scalato sulla
  // rotazione voluta). `want`: direzione della levetta, o null.
  // `t0`: secondi di clip gia' passati (stop anticipato da preTrap).
  startTrap(p, pk, turn, want, t0 = 0) {
    const b = this.ball, T = RECEIVE.trap, R = ANIM.receive;
    const dur = Math.min(R.length, clipDuration(this.tpl, pk.clip) || R.length);
    const left = Math.max(0.1, dur - t0);
    const k = Math.abs(pk.yawEnd) > 0.2 ? clamp(turn / pk.yawEnd, T.yawScale[0], T.yawScale[1]) : 0;
    const hE = wrapAngle(p.heading + pk.yawEnd * k);
    const ex = p.pos.x + p.vel.x * left, ez = p.pos.z + p.vel.z * left;
    let tx, tz, ty = BALL.radius;
    if (want !== null) {
      tx = ex + Math.sin(want) * T.push; tz = ez + Math.cos(want) * T.push;
    } else if (pk.ballEnd) {
      const [bx, by, bz] = pk.ballEnd;
      tx = ex + Math.sin(hE) * bz + Math.cos(hE) * bx; tz = ez + Math.cos(hE) * bz - Math.sin(hE) * bx;
      ty = Math.max(BALL.radius, by);
    } else {
      tx = ex + Math.sin(hE) * T.push; tz = ez + Math.cos(hE) * T.push;
    }
    // mai fra le gambe: la palla resta almeno minAhead m davanti (alcune clip
    // la lasciavano a 0,2 m dal corpo e il giocatore le correva sopra)
    const ahead = (tx - ex) * Math.sin(hE) + (tz - ez) * Math.cos(hE);
    if (ahead < T.minAhead) { tx += Math.sin(hE) * (T.minAhead - ahead); tz += Math.cos(hE) * (T.minAhead - ahead); }
    // controllo scarso (dribbling): il primo tocco allunga la palla e la sposta di lato
    const bad = (1 - (p.params.control ?? 0.6)) * T.badTouch;
    if (bad > 0) {
      const f = bad * (0.5 + Math.random()), sdv = bad * 0.5 * gauss();
      tx += Math.sin(hE) * f + Math.cos(hE) * sdv; tz += Math.cos(hE) * f - Math.sin(hE) * sdv;
    }
    // il tocco smorza la palla: rispetto al giocatore la velocita' cala come
    // e^(-cushion t) (dribble), e in Tf copre proprio la strada fino al punto
    const Tf = Math.max(0.15, left * T.reach);
    const rx = tx - ex - (b.pos.x - p.pos.x), rz = tz - ez - (b.pos.z - p.pos.z), rd = Math.hypot(rx, rz);
    const v0 = Math.min(T.maxHoriz, rd * T.cushion / (1 - Math.exp(-T.cushion * Tf)));
    const vx = p.vel.x + (rd > 1e-3 ? rx / rd * v0 : 0), vz = p.vel.z + (rd > 1e-3 ? rz / rd * v0 : 0);
    if (b.pos.y > T.airY) {
      // palla alta: smorzata dal corpo, cade sul punto con la gravita'
      b.vel.set(vx, (ty - b.pos.y + 0.5 * BALL.gravity * Tf * Tf) / Tf, vz);
      b.w.multiplyScalar(T.spinKeep);
    } else {
      b.pos.y = BALL.radius;
      b.kick(vx, 0, vz);
    }
    p.trap = { t: t0, T: dur, seq: this.poss.seq, clip: pk.clip, h0: p.heading, k };
    this.note('stop', { p, clip: pk.clip, altezza: b.pos.y, verso: want !== null ? 'levetta' : 'clip' });
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
    // per il replay: fotogramma del gol e porta
    this.goalMark = this.recorder.count;
    this.goalSide = side;
    const home = team === 'home';
    if (home) this.goals.home++; else this.goals.away++;
    const last = this.lastTouch;
    const scorer = last && last.team === team ? last : null;
    this.scorers.push({ team, playerId: scorer ? scorer.id : null, minute: this.rules.minute() });
    this.hud.setScore(this.goals.home, this.goals.away);
    const kAI = this.teams[this.otherSide(team)].keeperAI;
    this.lastGoalReason = kAI.goalReason();
    this.note('gol', { squadra: team, p: scorer, motivo: this.lastGoalReason });
    this.hud.showGoal((home ? this.home : this.away).name, scorer ? scorer.name : '');
    this.hud.showControls(false);
    // regia (goalShow): rules.goal sceglie chi esulta, `p`
    this.show = { t: 0, p: null, close: null, cut: false };
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

  // Avvio fallito a meta': via tutto quello che esiste gia' (ascoltatori dei
  // tasti, ciclo di disegno, controlli, contesto WebGL). Prima restava solo la
  // radice tolta: i tasti continuavano ad andare alla partita morta e ogni
  // tentativo lasciava un contesto WebGL aperto.
  abort() {
    const safe = (f) => { try { f(); } catch (e) { /* parte non ancora creata */ } };
    safe(() => cancelAnimationFrame(this.raf));
    safe(() => { for (const [t, type, fn, cap] of this.handlers) t.removeEventListener(type, fn, cap); this.handlers = []; });
    safe(() => this.controls && this.controls.destroy());
    safe(() => this.debug && this.debug.destroy());
    safe(() => this.hud && this.hud.destroy());
    safe(() => { for (const p of [...(this.everyone || []), ...(this.leaving || [])]) p.avatar.dispose(); });
    safe(() => this.referee && this.referee.p.avatar.dispose());
    safe(() => closeAudio());
    safe(() => this.setpieces && this.setpieces.dispose());
    safe(() => this.gfx && this.gfx.dispose());
    safe(() => this.scene && disposeScene(this.scene));
    safe(() => { if (this.renderer) { this.renderer.dispose(); this.renderer.forceContextLoss(); } });
    safe(() => this.root && this.root.remove());
    if (window.__m3d === this) window.__m3d = null;
  }
}

// Unico punto d'ingresso: la futura schermata pre-partita chiamera' questa.
export function startMatch(opts) {
  return new Promise((resolve, reject) => {
    const m = new Match(opts || {}, resolve);
    m.start().catch((e) => {
      m.abort();
      reject(e);
    });
  });
}
