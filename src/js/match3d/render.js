import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RENDER } from './config.js';

// Resa grafica a livelli (skill match3d, "Grafica e prestazioni"). Tutti i
// livelli: sRGB, tone mapping ACES, environment map leggera. Basso: ombre
// blob, pixel ratio 1. Medio: ombra dinamica di giocatori e palla in una
// shadow map piccola che segue l'azione, FXAA. Alto: shadow map piu'
// definita, SMAA, bloom leggero sui riflettori. Il livello si sceglie in base
// al dispositivo, si cambia dal menu di pausa e scende da solo sotto i 50 fps.
// Gli effetti di post-produzione si scaricano solo se servono.

export const LEVELS = ['low', 'medium', 'high'];
const KEY = 'kfm27-m3d-grafica';

export function savedQuality() {
  try { const v = localStorage.getItem(KEY); return LEVELS.includes(v) ? v : null; } catch (e) { return null; }
}

function saveQuality(v) {
  try { localStorage.setItem(KEY, v); } catch (e) { /* archivio non disponibile: vale per questa partita */ }
}

// Livello proposto per il dispositivo: GPU, processori, memoria, schermo.
export function detectQuality(renderer) {
  let gpu = '';
  try {
    const gl = renderer.getContext();
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    gpu = String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
  } catch (e) { /* informazione non disponibile */ }
  const nav = typeof navigator !== 'undefined' ? navigator : {};
  const cores = nav.hardwareConcurrency || 4, mem = nav.deviceMemory || 4;
  const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(nav.userAgent || '') || (nav.maxTouchPoints > 1 && Math.min(screen.width, screen.height) < 900);
  if (/SwiftShader|llvmpipe|Software|Basic Render/i.test(gpu)) return 'low';
  if (mobile) {
    const weak = /Mali-(T|G[0-6]\d\b)|Adreno \(TM\) [2-6]\d\d|PowerVR|Apple A(9|1[0-2])\b/i.test(gpu);
    return !weak && cores >= 8 && mem >= 6 ? 'medium' : 'low';
  }
  if (/Intel/i.test(gpu) && !/Arc|Iris\(R\) Xe|Iris Xe/i.test(gpu)) return 'medium';
  return cores >= 4 ? 'high' : 'medium';
}

export class Graphics {
  // `sun`: la luce direzionale dei riflettori (ombre); `onLevel(level)`:
  // il gioco mostra o nasconde le ombre blob e le ombre vere dei giocatori.
  constructor(renderer, scene, camera, sun, onLevel) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.sun = sun;
    this.onLevel = onLevel;
    this.offset = sun.position.clone();
    scene.add(sun.target);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = RENDER.exposure;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // riflessi credibili su maglie e pelle: una stanza generata, niente file
    const pmrem = new THREE.PMREMGenerator(renderer);
    this.env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    scene.environment = this.env;
    scene.environmentIntensity = RENDER.envIntensity;
    const s = sun.shadow, B = RENDER.shadowBox;
    s.camera.left = s.camera.bottom = -B;
    s.camera.right = s.camera.top = B;
    s.camera.near = 1;
    s.camera.far = this.offset.length() + B * 2;
    s.bias = RENDER.shadowBias;
    s.normalBias = RENDER.shadowNormalBias;
    this.composer = null;
    this.passes = null;
    this.pending = 0;
    this.fps = { t: 0, n: 0, low: 0 };
    this.level = null;
    this.setLevel(savedQuality() || detectQuality(renderer), false);
  }

  get pixelRatio() { return this.ratio; }

  // Cambia livello; `save`: scelta dell'utente, ricordata per le prossime partite.
  setLevel(level, save = true) {
    if (!LEVELS.includes(level)) level = 'medium';
    if (save) saveQuality(level);
    // scelta dell'utente o proposta per il dispositivo; le discese automatiche non la cambiano
    if (save || !this.chosen) this.chosen = level;
    const L = RENDER.levels[level], r = this.renderer;
    this.level = level;
    this.maxRatio = Math.min(window.devicePixelRatio || 1, L.pixelRatio);
    this.ratio = this.maxRatio;
    r.setPixelRatio(this.ratio);
    const shadows = L.shadow > 0;
    if (r.shadowMap.enabled !== shadows) {
      r.shadowMap.enabled = shadows;
      // i materiali ricompilano con o senza ombre
      this.scene.traverse((o) => { if (o.material) for (const m of [].concat(o.material)) m.needsUpdate = true; });
    }
    this.sun.castShadow = shadows;
    if (shadows && this.sun.shadow.mapSize.x !== L.shadow) {
      this.sun.shadow.mapSize.set(L.shadow, L.shadow);
      if (this.sun.shadow.map) { this.sun.shadow.map.dispose(); this.sun.shadow.map = null; }
    }
    this.onLevel(level, shadows, this.chosen);
    this.buildComposer(L);
    this.fps.low = 0;
  }

  // Post-produzione: FXAA (medio), SMAA e bloom (alto). Basso disegna diretto.
  buildComposer(L) {
    if (this.composer) { this.composer.dispose(); this.composer = null; this.passes = null; }
    if (L.aa === 'none' && !L.bloom) return;
    const ticket = ++this.pending;
    Promise.all([
      import('three/addons/postprocessing/EffectComposer.js'),
      import('three/addons/postprocessing/RenderPass.js'),
      import('three/addons/postprocessing/OutputPass.js'),
      L.bloom ? import('three/addons/postprocessing/UnrealBloomPass.js') : null,
      L.aa === 'fxaa' ? import('three/addons/postprocessing/ShaderPass.js') : null,
      L.aa === 'fxaa' ? import('three/addons/shaders/FXAAShader.js') : null,
      L.aa === 'smaa' ? import('three/addons/postprocessing/SMAAPass.js') : null
    ]).then(([ec, rp, op, bloom, sp, fx, smaa]) => {
      if (ticket !== this.pending || this.disposed) return;
      const r = this.renderer, size = r.getSize(new THREE.Vector2());
      const composer = new ec.EffectComposer(r);
      composer.addPass(new rp.RenderPass(this.scene, this.camera));
      const passes = {};
      if (bloom) {
        const B = RENDER.bloom;
        passes.bloom = new bloom.UnrealBloomPass(new THREE.Vector2(size.x / 2, size.y / 2), B.strength, B.radius, B.threshold);
        composer.addPass(passes.bloom);
      }
      composer.addPass(new op.OutputPass());
      // l'antialiasing lavora sull'immagine finale, dopo tone mapping e sRGB
      if (sp) { passes.fxaa = new sp.ShaderPass(fx.FXAAShader); composer.addPass(passes.fxaa); }
      if (smaa) { passes.smaa = new smaa.SMAAPass(size.x * this.ratio, size.y * this.ratio); composer.addPass(passes.smaa); }
      this.composer = composer;
      this.passes = passes;
      this.resize(size.x, size.y);
    }).catch((e) => console.error('match3d grafica: effetti non caricati', e));
  }

  resize(w, h) {
    this.renderer.setSize(w, h);
    if (!this.composer) return;
    this.composer.setPixelRatio(this.ratio);
    this.composer.setSize(w, h);
    if (this.passes.fxaa) this.passes.fxaa.material.uniforms.resolution.value.set(1 / (w * this.ratio), 1 / (h * this.ratio));
  }

  // L'ombra dinamica segue l'azione (`focus`: la palla); gli fps decidono
  // livello e risoluzione.
  update(dt, focus) {
    if (this.sun.castShadow && focus) {
      // passo della shadow map: niente tremolio dei bordi quando si sposta
      const q = RENDER.shadowBox * 2 / this.sun.shadow.mapSize.x;
      const x = Math.round(focus.x / q) * q, z = Math.round(focus.z / q) * q;
      this.sun.target.position.set(x, 0, z);
      this.sun.position.set(x + this.offset.x, this.offset.y, z + this.offset.z);
      this.sun.target.updateMatrixWorld();
    }
    this.adapt(dt);
  }

  render() {
    if (this.composer) this.composer.render();
    else this.renderer.render(this.scene, this.camera);
  }

  // Sotto RENDER.lowFps per qualche campione di fila si scende di livello (la
  // scelta salvata non cambia); al livello basso si riduce la risoluzione, e
  // la si rialza quando si torna fluidi.
  adapt(dt) {
    const f = this.fps;
    f.t += dt; f.n++;
    if (f.t < RENDER.sampleSeconds) return;
    const fps = f.n / f.t;
    f.t = 0; f.n = 0;
    if (fps < RENDER.lowFps) {
      if (++f.low >= RENDER.lowSamples && this.level !== 'low') { this.setLevel(LEVELS[LEVELS.indexOf(this.level) - 1], false); return; }
    } else f.low = 0;
    let pr = this.ratio;
    if (fps < RENDER.lowFps && this.level === 'low') pr = Math.max(RENDER.minPixelRatio, pr - RENDER.resStep);
    else if (fps > RENDER.highFps) pr = Math.min(this.maxRatio, pr + RENDER.resStep / 2);
    if (Math.abs(pr - this.ratio) > 1e-3) {
      this.ratio = pr;
      this.renderer.setPixelRatio(pr);
      const size = this.renderer.getSize(new THREE.Vector2());
      this.resize(size.x, size.y);
    }
  }

  dispose() {
    this.disposed = true;
    if (this.composer) this.composer.dispose();
    if (this.sun.shadow.map) this.sun.shadow.map.dispose();
    this.env.dispose();
  }
}
