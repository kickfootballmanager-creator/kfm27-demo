import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { MODEL, ANIM } from './config.js';

const GLB_URL = new URL('../../assets/match3d/player.glb', import.meta.url).href;
// Spostamento della radice e fotogrammi chiave misurati sugli FBX originali
// (tools/match3d/measure_clips.py): nel GLB le clip sono ferme sul posto.
const MOTION_URL = new URL('../../assets/match3d/player.motion.json', import.meta.url).href;

// Materiali di player.glb nell'ordine dei colori passati allo shader;
// l'ultimo colore (6) e' il secondo colore della maglia.
const PARTS = ['skin', 'kit_shirt', 'kit_shorts', 'kit_socks', 'boots', 'hair'];
const PATTERNS = { solid: 0, stripes: 1, halves: 2, sleeves: 3, center: 4, sash: 5 };

let cache = null;

// Un solo caricamento per sessione: le partite successive riusano il modello.
export function loadPlayerModel() {
  if (!cache) {
    cache = Promise.all([
      new GLTFLoader().loadAsync(GLB_URL),
      fetch(MOTION_URL).then((r) => (r.ok ? r.json() : { clips: {} })).catch(() => ({ clips: {} }))
    ]).then(([gltf, motion]) => {
      const tpl = buildTemplate(gltf);
      tpl.motion = motion.clips || {};
      return tpl;
    }).catch((e) => { cache = null; throw e; });
  }
  return cache;
}

// Spostamento della radice della clip al tempo t: { a: avanti, s: a destra },
// nel riferimento del giocatore all'inizio del gesto. Zero se la clip non si muove.
export function rootAt(tpl, clip, t) {
  const m = tpl.motion[clip];
  if (!m || !m.root.length) return { a: 0, s: 0 };
  const r = m.root;
  if (t <= r[0][0]) return { a: r[0][1], s: r[0][2] };
  for (let i = 1; i < r.length; i++) {
    if (t <= r[i][0]) {
      const k = (t - r[i - 1][0]) / (r[i][0] - r[i - 1][0]);
      return { a: r[i - 1][1] + (r[i][1] - r[i - 1][1]) * k, s: r[i - 1][2] + (r[i][2] - r[i - 1][2]) * k };
    }
  }
  const e = r[r.length - 1];
  return { a: e[1], s: e[2] };
}

export function clipDuration(tpl, clip) {
  const c = tpl.clips[clip];
  return c ? c.duration : 0;
}

// Le sei mesh diventano una sola SkinnedMesh (una draw call per giocatore):
// ogni vertice ricorda in `kitPart` da quale materiale veniva.
function buildTemplate(gltf) {
  const root = gltf.scene;
  root.updateMatrixWorld(true);
  const meshes = [];
  root.traverse((o) => { if (o.isSkinnedMesh) meshes.push(o); });
  const first = meshes[0];
  const fixed = {};
  let shirt = null;
  const geos = meshes.map((m) => {
    const g = m.geometry.clone();
    const part = Math.max(0, PARTS.indexOf(m.material.name));
    g.setAttribute('kitPart', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count).fill(part), 1));
    fixed[m.material.name] = m.material;
    if (m.material.name === 'kit_shirt') shirt = g;
    return g;
  });
  const merged = mergeGeometries(geos, false);
  for (const g of geos) g.dispose();

  const body = new THREE.SkinnedMesh(merged, new THREE.MeshBasicMaterial());
  body.name = 'm3d-body';
  first.parent.add(body);
  body.bind(first.skeleton, first.bindMatrix);
  for (const m of meshes) { m.parent.remove(m); m.geometry.dispose(); }

  // Altezza misurata sulla posa reale, poi piedi a terra.
  const holder = new THREE.Group();
  holder.add(root);
  holder.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(holder, true);
  const s = MODEL.height / (box.max.y - box.min.y);
  holder.scale.setScalar(s);
  holder.position.y = -box.min.y * s;
  holder.updateMatrixWorld(true);

  shirt.computeBoundingBox();
  const sb = shirt.boundingBox;
  const center = new THREE.Vector2((sb.min.x + sb.max.x) / 2, (sb.min.y + sb.max.y) / 2);

  const clips = {};
  for (const c of gltf.animations) clips[c.name] = c;

  return {
    holder,
    clips,
    geometry: merged,
    skinMap: fixed.skin && fixed.skin.map,
    boots: fixed.boots ? fixed.boots.color.clone() : new THREE.Color(0x333333),
    hair: fixed.hair ? fixed.hair.color.clone() : new THREE.Color(0x3a302a),
    center,
    plate: platePlacement(holder, body, clips.idle)
  };
}

// Il numero e' un rettangolo figlio dell'osso della schiena, sul punto piu'
// arretrato della maglia all'altezza delle scapole.
function platePlacement(holder, body, idle) {
  // La posa di riposo del GLB e' girata rispetto alle clip: si misura sull'idle.
  if (idle) {
    const mx = new THREE.AnimationMixer(holder);
    mx.clipAction(idle).play();
    mx.update(0);
    holder.updateMatrixWorld(true);
    mx.stopAllAction();
    mx.uncacheRoot(holder);
  }
  let bone = null;
  holder.traverse((o) => { if (o.isBone && o.name.endsWith(MODEL.numberBone)) bone = o; });
  const part = body.geometry.attributes.kitPart;
  const pts = [];
  const box = new THREE.Box3();
  for (let i = 0; i < part.count; i++) {
    if (part.getX(i) !== 1) continue;
    const v = body.getVertexPosition(i, new THREE.Vector3()).applyMatrix4(body.matrixWorld);
    pts.push(v);
    box.expandByPoint(v);
  }
  // centro sulla colonna: le braccia rendono asimmetrica la maglia
  const cx = new THREE.Vector3().setFromMatrixPosition(bone.matrixWorld).x;
  const y = box.min.y + (box.max.y - box.min.y) * MODEL.numberHeight;
  const band = (box.max.y - box.min.y) * 0.06;
  let back = Infinity;
  for (const v of pts) {
    if (Math.abs(v.x - cx) < MODEL.numberSize * 0.3 && Math.abs(v.y - y) < band) back = Math.min(back, v.z);
  }
  if (!Number.isFinite(back)) back = box.min.z;
  const p = new THREE.Vector3(cx, y, back - MODEL.numberGap);
  const world = new THREE.Matrix4().compose(
    p,
    new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI),
    new THREE.Vector3(MODEL.numberSize, MODEL.numberSize, 1)
  );
  const local = new THREE.Matrix4().copy(bone.matrixWorld).invert().multiply(world);
  const out = { bone: bone.name, position: new THREE.Vector3(), quaternion: new THREE.Quaternion(), scale: new THREE.Vector3() };
  local.decompose(out.position, out.quaternion, out.scale);
  return out;
}

function color(css, fallback) {
  const c = new THREE.Color();
  c.setStyle(css || fallback);
  return c;
}

// Un materiale per squadra: colori della divisa e disegno della maglia nello
// shader, la pelle dalla texture del modello.
export function kitMaterial(tpl, kit) {
  const m = new THREE.MeshStandardMaterial({ map: tpl.skinMap || null, roughness: MODEL.roughness, metalness: 0 });
  const colors = [
    new THREE.Color(1, 1, 1),
    color(kit.primary, '#e8ecf0'),
    color(kit.shorts || kit.primary, '#1b2230'),
    color(kit.socks || kit.primary, '#e8ecf0'),
    tpl.boots,
    tpl.hair,
    color(kit.secondary || kit.primary, '#e8ecf0')
  ];
  const pattern = kit.secondary ? (PATTERNS[kit.pattern] || 0) : 0;
  m.onBeforeCompile = (sh) => {
    sh.uniforms.kitColors = { value: colors };
    sh.uniforms.kitPattern = { value: pattern };
    sh.uniforms.kitCenter = { value: tpl.center };
    sh.uniforms.kitSizes = { value: new THREE.Vector4(MODEL.stripeWidth, MODEL.centerWidth, MODEL.sashWidth, MODEL.sleeveX) };
    sh.vertexShader = 'attribute float kitPart;\nvarying float vKitPart;\nvarying vec2 vKitPos;\n' +
      sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvKitPart = kitPart;\nvKitPos = position.xy;');
    sh.fragmentShader = 'uniform vec3 kitColors[7];\nuniform int kitPattern;\nuniform vec2 kitCenter;\nuniform vec4 kitSizes;\nvarying float vKitPart;\nvarying vec2 vKitPos;\n' +
      sh.fragmentShader.replace('#include <map_fragment>', `
        int kp = int(vKitPart + 0.5);
        if (kp == 0) {
          #ifdef USE_MAP
          diffuseColor *= texture2D(map, vMapUv);
          #endif
        } else {
          vec3 kc = kitColors[kp];
          if (kp == 1 && kitPattern > 0) {
            float u = vKitPos.x - kitCenter.x, v = vKitPos.y - kitCenter.y;
            bool alt = false;
            if (kitPattern == 1) alt = fract(u / kitSizes.x * 0.5 + 0.25) < 0.5;
            else if (kitPattern == 2) alt = u > 0.0;
            else if (kitPattern == 3) alt = abs(u) > kitSizes.w;
            else if (kitPattern == 4) alt = abs(u) < kitSizes.y;
            else if (kitPattern == 5) alt = abs(u + v) < kitSizes.z;
            if (alt) kc = kitColors[6];
          }
          diffuseColor.rgb *= kc;
        }`);
  };
  m.customProgramCacheKey = () => 'm3d-kit';
  return m;
}

function inkFor(css) {
  const c = new THREE.Color();
  c.setStyle(css || '#e8ecf0');
  const s = { r: 0, g: 0, b: 0 };
  c.getRGB(s, THREE.SRGBColorSpace);
  return 0.299 * s.r + 0.587 * s.g + 0.114 * s.b > 0.6 ? '#0a111c' : '#f5f6f4';
}

function numberTexture(number, shirt) {
  const S = 128;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');
  const ink = inkFor(shirt);
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.lineJoin = 'round';
  g.font = `${S * 0.86}px Anton, Impact, sans-serif`;
  g.lineWidth = S / 14;
  g.strokeStyle = ink === '#0a111c' ? 'rgba(245,246,244,.6)' : 'rgba(10,17,28,.5)';
  g.fillStyle = ink;
  g.strokeText(String(number), S / 2, S * 0.54);
  g.fillText(String(number), S / 2, S * 0.54);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

const wrapPhase = (x) => x - Math.floor(x);

// Un calciatore in scena: copia dello scheletro, clip condivise, fusione
// delle corse in base alla velocita' reale e gesti (passaggio, tiro) sopra.
export class Avatar {
  constructor(tpl, material, number, shirtColor) {
    this.object = cloneSkinned(tpl.holder);
    let body = null, bone = null;
    this.bones = {};
    const want = { LeftHand: 'lh', RightHand: 'rh', Head: 'head', RightToeBase: 'rf', LeftToeBase: 'lf' };
    this.object.traverse((o) => {
      if (o.isSkinnedMesh) body = o;
      if (o.isBone && o.name === tpl.plate.bone) bone = o;
      if (o.isBone) { const k = want[o.name.split(':').pop()]; if (k) this.bones[k] = o; }
    });
    body.material = material;
    // Il volume di legatura non segue le animazioni: niente sparizioni ai bordi.
    body.frustumCulled = false;

    if (number && bone) {
      const plate = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.MeshStandardMaterial({ map: numberTexture(number, shirtColor), transparent: true, alphaTest: 0.4, roughness: MODEL.roughness, depthWrite: false })
      );
      plate.position.copy(tpl.plate.position);
      plate.quaternion.copy(tpl.plate.quaternion);
      plate.scale.copy(tpl.plate.scale);
      plate.frustumCulled = false;
      bone.add(plate);
    }

    this.mixer = new THREE.AnimationMixer(this.object);
    const act = (name) => {
      const clip = tpl.clips[name];
      if (!clip) return null;
      const a = this.mixer.clipAction(clip);
      a.setEffectiveWeight(0);
      a.play();
      return a;
    };
    // Corse sincronizzate su una fase comune; l'idle va per conto suo.
    this.loco = ANIM.loco.map((d) => ({ d, a: act(d.clip), w: 0, dur: tpl.clips[d.clip] ? tpl.clips[d.clip].duration : 1 }));
    this.dirs = [];
    for (const d of ANIM.dir) {
      for (const side of ['left', 'right']) {
        const a = act(d[side]);
        this.dirs.push({ d: { ...d, phase: 0 }, a, w: 0, dur: a ? a.getClip().duration : 1, side, from: d.from });
      }
    }
    for (const e of [...this.loco, ...this.dirs]) if (e.a && e.d.natural) e.a.timeScale = 0;
    this.all = [...this.loco, ...this.dirs].filter((e) => e.a);
    this.tpl = tpl;
    this.phase = 0;
    this.one = null;
    this.prevOne = null;       // gesto precedente che sfuma sotto quello nuovo
    this.target = new Array(this.loco.length).fill(0);
    // corsa laterale del portiere al posto delle corse normali
    this.keeperStep = act('gk_sidestep');
    if (this.keeperStep) this.keeperStep.timeScale = 0;
    this.sideW = 0;
    this.side = 0;
  }

  // Gesto sopra la corsa da `from`; dopo `hold` secondi sfuma verso la corsa.
  // Un gesto gia' in corso sfuma sotto il nuovo: niente pose in piedi fra due gesti a terra.
  playOnce(name, from, hold, rate = 1) {
    const clip = this.tpl.clips[name];
    if (!clip) return;
    if (this.prevOne) { this.prevOne.a.stop(); this.prevOne = null; }
    let chained = false;
    if (this.one) {
      const w = this.one.a.getEffectiveWeight();
      if (w > 0.05 && this.one.a.getClip() !== clip) { this.prevOne = { a: this.one.a, w, t: 0 }; chained = true; }
      else this.one.a.stop();
    }
    const a = this.mixer.clipAction(clip);
    a.reset();
    a.setLoop(THREE.LoopOnce, 1);
    a.clampWhenFinished = true;
    a.time = from;
    a.timeScale = rate;
    a.setEffectiveWeight(0);
    a.play();
    this.one = { a, t: 0, hold, fade: chained ? ANIM.chainFade : ANIM.fadeIn };
  }

  // Gesto in ciclo (a terra, in attesa) finche' non se ne chiede un altro.
  playLoop(name) {
    this.playOnce(name, 0, Infinity);
    if (this.one && this.one.a.getClip() === this.tpl.clips[name]) this.one.a.setLoop(THREE.LoopRepeat, Infinity);
  }

  // Ferma il gesto in corso: sfuma subito verso la corsa.
  endGesture() {
    if (this.one) this.one.hold = Math.min(this.one.hold, this.one.t);
  }

  get busy() { return !!this.one; }

  gestureName() { return this.one ? this.one.a.getClip().name : null; }

  // Posizione nel mondo di un osso (lh, rh, head, rf, lf) all'ultimo disegno.
  bonePosition(key, out) {
    const b = this.bones[key];
    if (!b) return out.copy(this.object.position);
    return b.getWorldPosition(out);
  }

  // speed in m/s del mondo, turn = angolo fra direzione di corsa e busto.
  // side: velocita' laterale del portiere (m/s, + a destra), 0 per gli altri.
  update(dt, speed, turn, side = 0) {
    let oneW = 0;
    if (this.one) {
      const o = this.one;
      o.t += dt;
      oneW = o.t < o.hold ? Math.min(1, o.t / o.fade) : Math.max(0, 1 - (o.t - o.hold) / ANIM.fadeOut);
      if (o.t >= o.hold && oneW <= 0) { o.a.stop(); this.one = null; }
      else o.a.setEffectiveWeight(oneW);
    }
    if (this.prevOne) {
      const p = this.prevOne;
      p.t += dt;
      const w = p.w * Math.max(0, 1 - p.t / ANIM.chainFade);
      if (w <= 0 || !this.one) { p.a.stop(); this.prevOne = null; }
      else { p.a.setEffectiveWeight(w); oneW = Math.min(1, oneW + w); }
    }

    // Pesi obiettivo delle corse in avanti, a tratti lineari fra le velocita' di riferimento.
    const L = this.loco, n = L.length;
    const target = this.target;
    target.fill(0);
    if (speed <= L[0].d.speed) target[0] = 1;
    else if (speed >= L[n - 1].d.speed) target[n - 1] = 1;
    else {
      for (let i = 0; i < n - 1; i++) {
        const a = L[i].d.speed, b = L[i + 1].d.speed;
        if (speed >= a && speed < b) { const t = (speed - a) / (b - a); target[i] = 1 - t; target[i + 1] = t; break; }
      }
    }
    // Corsa laterale o all'indietro: la parte "in movimento" passa alla clip direzionale.
    const at = Math.abs(turn);
    let dir = null;
    if (speed > ANIM.dirMinSpeed) {
      for (const e of this.dirs) if (at >= e.from && e.side === (turn > 0 ? 'left' : 'right') && e.a) dir = e;
    }
    const dirTarget = dir ? 1 - target[0] : 0;
    if (dir) for (let i = 1; i < n; i++) target[i] = 0;

    // Portiere che si sposta di lato: passo laterale al posto della corsa.
    const k = 1 - Math.exp(-ANIM.blend * dt);
    const sideTarget = this.keeperStep && Math.abs(side) > ANIM.keeperSideMin ? Math.min(1, Math.abs(side) / ANIM.keeperSideFull) : 0;
    this.sideW += (sideTarget - this.sideW) * k;
    if (sideTarget > 0) for (let i = 0; i < n; i++) target[i] *= 1 - sideTarget;

    for (let i = 0; i < n; i++) L[i].w += (target[i] - L[i].w) * k;
    for (const e of this.dirs) e.w += ((e === dir ? dirTarget : 0) - e.w) * k;

    // Una sola fase per tutte le corse: avanza con la media pesata dei ritmi.
    let wsum = 0, rate = 0;
    for (const e of this.all) {
      if (!e.d.natural || e.w <= 1e-3) continue;
      const r = Math.min(ANIM.maxRate, Math.max(ANIM.minRate, speed / e.d.natural));
      rate += e.w * r / e.dur;
      wsum += e.w;
    }
    if (wsum > 0) this.phase = wrapPhase(this.phase + dt * rate / wsum);
    for (const e of this.all) {
      if (e.d.natural) e.a.time = wrapPhase(this.phase + e.d.phase) * e.dur;
      e.a.setEffectiveWeight(e.w * (1 - oneW));
    }
    if (this.keeperStep) {
      // la clip va verso destra: all'indietro per andare a sinistra
      const d = this.keeperStep.getClip().duration;
      if (Math.abs(side) > 1e-3) this.side = wrapPhase(this.side + dt * Math.sign(side) * Math.min(ANIM.maxRate, Math.abs(side) / ANIM.keeperStepNatural) / d);
      this.keeperStep.time = this.side * d;
      this.keeperStep.setEffectiveWeight(this.sideW * (1 - oneW));
    }
    this.mixer.update(dt);
  }

  dispose() {
    this.mixer.stopAllAction();
    this.mixer.uncacheRoot(this.object);
  }
}
