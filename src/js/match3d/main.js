import * as THREE from 'three';
import { PHYSICS, RENDER, RULES, PITCH } from './config.js';
import { buildPitch } from './pitch.js';
import { Ball } from './ball.js';
import { BroadcastCamera } from './camera.js';
import { Hud } from './hud.js';

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
  }

  async start() {
    await loadCss();
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

    this.camera = new BroadcastCamera(window.innerWidth / window.innerHeight);
    this.camera.snap(this.ball);
    this.ball.sync(1, 0);

    this.hud = new Hud(root, { home: this.home, away: this.away, exitMode: this.opts.exitMode || 'career' }, {
      openExit: () => this.openExit(),
      resume: () => this.closeExit(),
      simulate: () => this.finish('simulate'),
      back: () => this.finish('back')
    });

    this.raycaster = new THREE.Raycaster();
    this.ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this._listen(r.domElement, 'pointerdown', (e) => this.onPointer(e));
    this._listen(window, 'resize', () => this.onResize());
    this._listen(window, 'keydown', (e) => this.onKey(e), true);
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

  onPointer(e) {
    if (this.paused || this.hud.exitOpen || !this.ball.live) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.camera.cam);
    const hit = new THREE.Vector3();
    if (!this.raycaster.ray.intersectPlane(this.ground, hit)) return;
    const lim = PITCH.length / 2 + PITCH.runoff, limZ = PITCH.width / 2 + PITCH.runoff;
    if (Math.abs(hit.x) > lim || Math.abs(hit.z) > limZ) return;
    this.ball.kickTowards(hit.x, hit.z);
    this.hud.hideHint();
  }

  // I tasti non arrivano al manager che sta sotto la partita.
  onKey(e) {
    e.stopImmediatePropagation();
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopImmediatePropagation();
      if (this.hud.exitOpen) this.closeExit(); else this.openExit();
    }
  }

  onVisibility() {
    if (document.hidden) this.paused = true;
    else if (!this.hud.exitOpen) this.paused = false;
    this.last = performance.now();
  }

  onResize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(w, h);
    this.camera.resize(w / h);
  }

  openExit() { this.paused = true; this.hud.openExit(); }

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
    this.ball.sync(this.paused ? 1 : this.acc / step, this.paused ? 0 : dt);
    this.renderer.render(this.scene, this.camera.cam);
    this.adaptResolution(dt);
  }

  tick(dt) {
    const b = this.ball;
    const wasLive = b.live;
    b.step(dt);
    if (wasLive && b.scored) this.onGoal(b.scored);
    else if (wasLive && b.out) this.pauseTimer = RULES.outPause;

    if (!b.live && this.pauseTimer > 0) {
      this.pauseTimer -= dt;
      if (this.pauseTimer <= 0) {
        this.hud.hideGoal();
        b.reset(0, 0);
      }
    }
  }

  // Primo tempo: la squadra di casa attacca la porta a destra (x > 0).
  onGoal(side) {
    const home = side > 0;
    if (home) this.goals.home++; else this.goals.away++;
    this.scorers.push({ team: home ? 'home' : 'away', playerId: null, minute: null });
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
    this.hud.destroy();
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
