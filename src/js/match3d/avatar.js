import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { MODEL, ANIM } from './config.js';
import { boneMap, solveTwoBone, palm, rotateWorld } from './rig.js';
import { buildLoco, gaitOf, gesturePoses, groundOf, slotTime, phaseOf, FootLock, feetPose, matchPose } from './anim.js';
import { AnimLibrary } from './anim-lib.js';

const GLB_URL = new URL('../../assets/match3d/player.glb', import.meta.url).href;
// Clip Mixamo di riserva (player.glb): spostamento della radice e fotogrammi
// chiave misurati sugli FBX originali (tools/match3d/measure_clips.py).
const MOTION_URL = new URL('../../assets/match3d/player.motion.json', import.meta.url).href;

// Materiali di player.glb nell'ordine dei colori passati allo shader;
// l'ultimo colore (6) e' il secondo colore della maglia.
const PARTS = ['skin', 'kit_shirt', 'kit_shorts', 'kit_socks', 'boots', 'hair'];
const PATTERNS = { solid: 0, stripes: 1, halves: 2, sleeves: 3, center: 4, sash: 5 };

let cache = null;
let library = null;

// Un solo caricamento del modello per sessione; la libreria Studio33 carica i
// pacchetti del livello (anim-lib.js) e li tiene per le partite successive.
export function loadPlayerModel(level = 'low') {
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
  if (!library) library = new AnimLibrary();
  return Promise.all([cache, library.loadLevel(level)]).then(([tpl]) => {
    attachLibrary(tpl, library);
    return tpl;
  });
}

// Le clip della libreria entrano nel modello: clip, metadati, cicli della
// corsa, pose dei palmi. Si richiama quando arriva un pacchetto in secondo
// piano: i giocatori ricostruiscono il blend tree (locoVersion).
export function attachLibrary(tpl, lib) {
  if (tpl.libVersion === lib.version) return tpl;
  const s = tpl.scale;
  lib.scale = s;
  tpl.lib = lib;
  for (const name in lib.entries) {
    if (tpl.meta[name]) continue;
    const e = lib.entries[name];
    tpl.clips[name] = e.clip;
    tpl.meta[name] = e.meta;
    const g = e.meta.loop ? gaitOf(e.meta, s) : null;
    if (g) tpl.gait[name] = g;
    if (e.meta.palms) tpl.poses[name] = keeperPoses(e.meta, s);
  }
  if (!tpl.gait.ground) {
    const idle = lib.role('idle').find((e) => e.meta.style === 'normal');
    if (idle) tpl.gait.ground = groundOf(tpl.holder, idle.clip);
  }
  // tocco di palla in conduzione: la fase del passo in cui il destro tocca la
  // palla nelle clip di conduzione essenziali (Ball_Bone), uguale a ogni livello
  if (tpl.dribbleTouch === undefined) {
    let sx = 0, sy = 0;
    for (const e of lib.role('loco')) {
      const g = tpl.gait[e.name];
      if (e.meta.style !== 'dribble' || e.meta.pack !== 'core' || !g) continue;
      for (const t of g.touches) {
        if (t.foot !== 'R') continue;
        const a = phaseOf(g, t.t / g.dur) * Math.PI * 2;
        sx += Math.cos(a); sy += Math.sin(a);
      }
    }
    if (sx || sy) tpl.dribbleTouch = (Math.atan2(sy, sx) / (Math.PI * 2) + 1) % 1;
  }
  tpl.loco = buildLoco(tpl);
  tpl.loco.names = new Set(tpl.loco.slots.map((x) => x.name));
  tpl.locoVersion = (tpl.locoVersion || 0) + 1;
  tpl.libVersion = lib.version;
  return tpl;
}

// Palmi dai metadati del build: nel riferimento del giocatore (a avanti,
// s destra, y su), fotogramma per fotogramma a 30 Hz.
function keeperPoses(meta, s) {
  const P = meta.palms, n = meta.n;
  const lh = new Float32Array(n * 3), rh = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const o = i * 6;
    lh[i * 3] = P[o + 2] * s; lh[i * 3 + 1] = -P[o] * s; lh[i * 3 + 2] = P[o + 1] * s;
    rh[i * 3] = P[o + 5] * s; rh[i * 3 + 1] = -P[o + 3] * s; rh[i * 3 + 2] = P[o + 4] * s;
  }
  return { fps: 30, n, lh, rh };
}

// Spostamento della radice della clip al tempo t: { a: avanti, s: a destra,
// yaw: rotazione verso sinistra }, nel riferimento del giocatore all'inizio
// del gesto. Zero se la clip non si muove.
export function rootAt(tpl, clip, t) {
  const m = tpl.meta[clip];
  if (m && m.root) {
    const r = m.root, n = r.length / 3, x = Math.min(n - 1, Math.max(0, t * 30));
    const i = Math.floor(x), j = Math.min(n - 1, i + 1), k = x - i, sc = tpl.scale;
    const at = (c) => r[i * 3 + c] + (r[j * 3 + c] - r[i * 3 + c]) * k;
    return { a: at(0) * sc, s: -at(1) * sc, yaw: at(2) };
  }
  const mm = tpl.motion[clip];
  if (!mm || !mm.root.length) return { a: 0, s: 0, yaw: 0 };
  const r = mm.root;
  if (t <= r[0][0]) return { a: r[0][1], s: r[0][2], yaw: 0 };
  for (let i = 1; i < r.length; i++) {
    if (t <= r[i][0]) {
      const k = (t - r[i - 1][0]) / (r[i][0] - r[i - 1][0]);
      return { a: r[i - 1][1] + (r[i][1] - r[i - 1][1]) * k, s: r[i - 1][2] + (r[i][2] - r[i - 1][2]) * k, yaw: 0 };
    }
  }
  const e = r[r.length - 1];
  return { a: e[1], s: e[2], yaw: 0 };
}

export function clipDuration(tpl, clip) {
  const c = tpl.clips[clip];
  return c ? c.duration : 0;
}

// Tabella delle pose dei piedi di un gesto della libreria (per agganciare il passo).
export function gestureTable(tpl, clip) {
  if (!(clip in tpl.gposes)) tpl.gposes[clip] = gesturePoses(tpl.meta[clip], tpl.scale);
  return tpl.gposes[clip];
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
    scale: s,                // metri del modello in scena per metro della libreria
    meta: {},                // metadati delle clip della libreria (build)
    gait: {},                // cicli della corsa (anim.gaitOf) e altezza dei piedi da fermi
    gposes: {},              // pose dei piedi dei gesti, calcolate quando servono
    poses: {},               // palmi delle clip del portiere
    geometry: merged,
    skinMap: fixed.skin && fixed.skin.map,
    boots: fixed.boots ? fixed.boots.color.clone() : new THREE.Color(0x333333),
    hair: fixed.hair ? fixed.hair.color.clone() : new THREE.Color(0x3a302a),
    center,
    plate: platePlacement(holder, body, clips.idle),
    // copie delle clip usate da due azioni diverse (vedi Avatar.gestureClip)
    copies: {}
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

const _hl = new THREE.Vector3(), _hr = new THREE.Vector3(), _lat = new THREE.Vector3();
const _tl = new THREE.Vector3(), _tr = new THREE.Vector3();
const _twist = new THREE.Quaternion(), _up = new THREE.Vector3(0, 1, 0);
const _hq = new THREE.Quaternion();

// Un calciatore in scena: copia dello scheletro, clip condivise, fusione
// delle corse in base alla velocita' reale e gesti (passaggio, tiro) sopra.
export class Avatar {
  constructor(tpl, material, number, shirtColor) {
    this.object = cloneSkinned(tpl.holder);
    let body = null, bone = null;
    // I nomi nel GLB sono 'mixamorig5LeftHand': boneMap li pulisce.
    this.rig = boneMap(this.object);
    const r = this.rig;
    this.bones = { lh: r.LeftHand, rh: r.RightHand, head: r.Head, rf: r.RightToeBase, lf: r.LeftToeBase };
    this.heldAt = new THREE.Vector3();
    this.heldVel = new THREE.Vector3();
    this.lastDt = 0;
    this.attach = null;
    this.object.traverse((o) => {
      if (o.isSkinnedMesh) body = o;
      if (o.isBone && o.name === tpl.plate.bone) bone = o;
    });
    body.material = material;
    this.body = body;
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

    this.tpl = tpl;
    this.mixer = new THREE.AnimationMixer(this.object);
    // Una azione per fessura del blend tree (anim.js), creata quando la
    // fessura comincia a pesare e liberata dopo ANIM.slotRelease secondi a
    // peso zero: con centinaia di clip nessun giocatore le tiene tutte. Le
    // corse hanno il tempo deciso dalla fase comune, i fermi vanno per conto loro.
    // Una clip puo' stare in piu' fessure (le corse laterali prestate alla
    // conduzione): un'azione per clip, con i pesi delle sue fessure sommati.
    this.acts = new Map();      // nome della clip -> { a, idle, w, t }
    this.slots = [];            // per fessura: l'azione della sua clip (o null)
    this.feet = new FootLock(this.rig);
    this.one = null;
    this.prevOne = null;       // gesto precedente che sfuma sotto quello nuovo
    this.feat = new Float32Array(6);
    this.resyncDue = false;
    this.lift = 0;              // metri di cui il corpo e' alzato perche' i piedi non entrino nell'erba
    this.yawFix = 0;            // rad: rotazione del gesto passata al busto (gestures.bakeYaw), tolta all'anca mentre sfuma
  }

  // Azione della clip di una fessura del blend tree.
  slotAction(slot) {
    const clip = this.tpl.clips[slot.name];
    if (!clip) return null;
    const a = this.mixer.clipAction(clip);
    a.setLoop(THREE.LoopRepeat, Infinity);
    a.setEffectiveWeight(0);
    a.play();
    if (slot.kind === 'cycle') a.timeScale = 0;
    else a.time = Math.random() * clip.duration;
    return a;
  }

  // Clip di un gesto: mai la stessa azione di una fessura della corsa, che
  // fermata a fine gesto lascerebbe la corsa senza animazione.
  gestureClip(name) {
    const tpl = this.tpl, c = tpl.clips[name];
    if (!c || !tpl.loco || !tpl.loco.names.has(name)) return c;
    return tpl.copies[name] || (tpl.copies[name] = c.clone());
  }

  // Istante da cui far partire il gesto `name` (fra lo e hi, secondi della
  // clip) perche' i piedi siano dove li ha il passo in corso.
  matchStart(name, lo, hi, pref) {
    this.object.updateMatrixWorld(true);
    return matchPose(gestureTable(this.tpl, name), feetPose(this.rig, this.object.rotation.y, this.feat), lo, hi, pref);
  }

  // Posa dei piedi in corso (per scegliere un gesto fra piu' clip).
  currentFeet() {
    this.object.updateMatrixWorld(true);
    return feetPose(this.rig, this.object.rotation.y, this.feat);
  }

  // Un gesto finito libera la sua azione (e le sue associazioni alle ossa).
  dropAction(a) {
    a.stop();
    const clip = a.getClip();
    if (!this.acts.has(clip.name) || this.acts.get(clip.name).a !== a) this.mixer.uncacheAction(clip);
  }

  // Gesto sopra la corsa da `from`; dopo `hold` secondi sfuma verso la corsa.
  // Un gesto gia' in corso sfuma sotto il nuovo: niente pose in piedi fra due gesti a terra.
  playOnce(name, from, hold, rate = 1, fade = ANIM.fadeIn, loco = false) {
    const clip = this.gestureClip(name);
    if (!clip) return;
    if (this.prevOne) { this.dropAction(this.prevOne.a); this.prevOne = null; }
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
    // loco: partenza, arresto o svolta, parte della corsa (non un gesto da fermo)
    this.one = { a, t: 0, hold, fade: chained ? ANIM.chainFade : fade, loco, name };
  }

  // Gesto in ciclo (a terra, in attesa) finche' non se ne chiede un altro.
  playLoop(name) {
    this.playOnce(name, 0, Infinity);
    if (this.one && this.one.a.getClip() === this.gestureClip(name)) this.one.a.setLoop(THREE.LoopRepeat, Infinity);
  }

  // Ferma il gesto in corso: sfuma subito verso la corsa.
  endGesture() {
    if (this.one) this.one.hold = Math.min(this.one.hold, this.one.t);
  }

  // Riprende un gesto fermato con playOnce(..., rate 0) dallo stesso
  // fotogramma: nessun salto di posa. false se il gesto in corso e' un altro.
  resume(name, rate, hold) {
    const o = this.one;
    if (!o || o.a.getClip() !== this.gestureClip(name)) return false;
    o.a.timeScale = rate;
    o.hold = o.t + hold;
    return true;
  }

  // Palla fra le due mani: il centro sta a meta' fra i palmi dell'animazione,
  // poi l'IK sulle braccia porta ogni palmo sulla superficie della palla.
  // `hand` ('Left' | 'Right'): palla agganciata a quella mano sola, ferma
  // rispetto all'osso da dove stava quando e' passata di mano.
  // Da chiamare dopo update(); scrive il centro in `out`, in heldAt e la
  // sua velocita' in heldVel (per lasciarla cadere o lanciarla).
  holdBall(out, radius, hand = null) {
    const r = this.rig;
    this.object.updateMatrixWorld(true);
    if (hand) {
      // la palla resta nella direzione in cui stava rispetto al palmo e in
      // pochi fotogrammi si appoggia su di lui
      const bone = r[hand + 'Hand'], P = palm(r, hand, _hl);
      bone.getWorldQuaternion(_hq);
      if (!this.attach || this.attach.side !== hand) {
        const d = _lat.subVectors(this.heldAt, P);
        const dist = d.length() || radius;
        this.attach = { side: hand, dir: d.divideScalar(dist).applyQuaternion(_hq.clone().invert()).clone(), dist };
      }
      const A = this.attach;
      A.dist += (radius + MODEL.holdGap - A.dist) * (1 - Math.exp(-MODEL.attachRate * this.lastDt));
      out.copy(A.dir).applyQuaternion(_hq).multiplyScalar(A.dist).add(P);
      this.track(out);
      return out;
    }
    this.attach = null;
    const L = palm(r, 'Left', _hl), R = palm(r, 'Right', _hr);
    out.addVectors(L, R).multiplyScalar(0.5);
    const lat = _lat.subVectors(R, L);
    const n = lat.length();
    if (n > 1e-4) lat.divideScalar(n); else lat.set(-Math.cos(this.object.rotation.y), 0, Math.sin(this.object.rotation.y));
    const g = radius + MODEL.holdGap;
    _tl.copy(out).addScaledVector(lat, -g);
    _tr.copy(out).addScaledVector(lat, g);
    solveTwoBone(r.LeftArm, r.LeftForeArm, (o) => palm(r, 'Left', o), _tl);
    solveTwoBone(r.RightArm, r.RightForeArm, (o) => palm(r, 'Right', o), _tr);
    this.track(out);
    return out;
  }

  track(p) {
    if (this.lastDt > 0) this.heldVel.subVectors(p, this.heldAt).divideScalar(this.lastDt);
    this.heldAt.copy(p);
  }

  get busy() { return !!this.one || !!this.proc; }

  // Animazione creata in codice (moves.js) sopra la clip in corso.
  playProc(move) { this.proc = move; }

  gestureName() { return this.one ? this.one.a.getClip().name : null; }

  // Posizione nel mondo di un osso (lh, rh, head, rf, lf) all'ultimo disegno.
  bonePosition(key, out) {
    const b = this.bones[key];
    if (!b) return out.copy(this.object.position);
    return b.getWorldPosition(out);
  }

  // Pesi e fase della corsa da `loco` (interpolati con `alpha` fra gli
  // ultimi due passi di fisica), il gesto sopra, poi i piedi fermi a terra.
  // Corsa, gesto e gesto precedente pesano sempre 1 in tutto: con meno
  // entrerebbe la posa di riposo del modello, girata rispetto alle clip.
  update(dt, loco, alpha = 1) {
    let gw = 0, pw = 0;
    if (this.one) {
      const o = this.one, was = o.t;
      o.t += dt;
      gw = o.t < o.hold ? Math.min(1, o.t / o.fade) : Math.max(0, 1 - (o.t - o.hold) / ANIM.fadeOut);
      // il gesto comincia a sfumare: la corsa riparte dalla fase con i piedi dove sono
      if (was < o.hold && o.t >= o.hold && gw > 0.5) this.resyncDue = true;
      if (o.t >= o.hold && gw <= 0) { this.dropAction(o.a); this.one = null; gw = 0; }
    }
    if (this.prevOne) {
      const p = this.prevOne;
      p.t += dt;
      pw = p.w * Math.max(0, 1 - p.t / ANIM.chainFade);
      if (pw <= 0 || !this.one) { this.dropAction(p.a); this.prevOne = null; pw = 0; }
    }
    const g = gw + pw;
    if (g > 1) { gw /= g; pw /= g; }
    const base = 1 - Math.min(1, gw + pw);
    if (this.one) this.one.a.setEffectiveWeight(gw);
    if (this.prevOne) this.prevOne.a.setEffectiveWeight(pw);
    if (loco.version !== this.tpl.locoVersion) loco.setup();
    const phase = loco.phaseAt(alpha), cyc = loco.cycleAt(alpha), L = loco.slots, n = loco.w.length;
    for (const x of this.acts.values()) x.w = 0;
    this.slots.length = n;
    for (let i = 0; i < n; i++) {
      const slot = L[i];
      // anche un peso che sta per salire (ultimo passo di fisica) vuole l'azione pronta
      const live = loco.w[i] > 1e-4 || loco.pw[i] > 1e-4;
      let x = this.acts.get(slot.name);
      if (live && !x) {
        const a = this.slotAction(slot);
        if (a) this.acts.set(slot.name, x = { a, idle: 0, w: 0, t: null });
      }
      if (!x || !live) continue;
      x.w += loco.weightAt(i, alpha) * base;
      const t = slotTime(loco, i, phase, cyc);
      if (t !== null) x.t = t;
      x.idle = 0;
    }
    for (const [name, x] of this.acts) {
      if (x.w > 0 || x.idle === 0) {
        if (x.t !== null) x.a.time = x.t;
        x.a.setEffectiveWeight(x.w);
        if (x.w <= 0) x.idle += dt;
        continue;
      }
      x.a.setEffectiveWeight(0);
      // a peso zero da un po': via l'azione, torna quando serve
      if ((x.idle += dt) > ANIM.slotRelease) {
        x.a.stop();
        this.mixer.uncacheAction(x.a.getClip());
        this.acts.delete(name);
      }
    }
    for (let i = 0; i < n; i++) { const x = this.acts.get(L[i].name); this.slots[i] = x ? x.a : null; }
    this.mixer.update(dt);
    this.lastDt = dt;
    this.twist(-loco.yawAt(alpha) * base);
    // il gesto che sfuma ha ancora dentro la rotazione gia' passata al busto
    if (this.yawFix) {
      const w = Math.min(1, gw + pw);
      if (w > 1e-3) {
        this.object.updateMatrixWorld(true);
        _twist.setFromAxisAngle(_up, this.yawFix * w);
        rotateWorld(this.rig.Hips, _twist);
      } else this.yawFix = 0;
    }
    if (this.resyncDue) {
      this.resyncDue = false;
      this.object.updateMatrixWorld(true);
      loco.resync(feetPose(this.rig, this.object.rotation.y, this.feat));
    }
    if (dt > 0) this.feet.apply(dt, loco, phase, gw + pw, this.object);
    if (this.proc && !this.proc.update(this, dt)) this.proc = null;
    this.ground(dt);
  }

  // Busto verso dove guarda il giocatore quando il corpo e' girato verso la
  // corsa: rotazione attorno alla verticale, divisa sulle tre vertebre.
  twist(a) {
    const T = ANIM.warp.twist;
    a = Math.max(-T, Math.min(T, a));
    if (Math.abs(a) < 1e-3) return;
    this.object.updateMatrixWorld(true);
    const r = this.rig;
    for (const [bone, share] of [[r.Spine, 0.3], [r.Spine1, 0.3], [r.Spine2, 0.4]]) {
      if (!bone) continue;
      _twist.setFromAxisAngle(_up, a * share);
      rotateWorld(bone, _twist);
    }
  }

  // Piedi mai dentro l'erba: fondere pose diverse (due corse, corsa e gesto)
  // puo' abbassare un piede sotto il terreno. Si alza il corpo di quanto
  // serve, subito, e lo si riabbassa piano.
  ground(dt) {
    const G = this.tpl.gait.ground, r = this.rig;
    if (!G) return;
    this.object.updateMatrixWorld(true);
    const y = (b) => b.matrixWorld.elements[13];
    const sink = -Math.min(y(r.LeftToeBase) - G.toe, y(r.RightToeBase) - G.toe, y(r.LeftFoot) - G.ankle, y(r.RightFoot) - G.ankle);
    const want = Math.max(0, sink);
    this.lift = want >= this.lift ? want : Math.max(want, this.lift - ANIM.liftRelease * dt);
    if (this.lift > 1e-4) {
      this.object.position.y += this.lift;
      this.object.updateMatrixWorld(true);
    }
  }

  dispose() {
    this.mixer.stopAllAction();
    this.mixer.uncacheRoot(this.object);
    this.acts.clear();
    this.slots = [];
  }
}
