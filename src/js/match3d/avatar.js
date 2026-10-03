import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { MODEL, ANIM, BALL, RULES } from './config.js';
import { boneMap, solveArm, releaseArm, blendPath, palm, rotateWorld } from './rig.js';
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
  // due facce: sotto l'orlo della maglia, nei polsini e nei pantaloncini si vede
  // l'interno della stoffa (sotto i vestiti il corpo non c'e': si vedeva l'erba)
  const m = new THREE.MeshStandardMaterial({ map: tpl.skinMap || null, roughness: MODEL.roughness, metalness: 0, side: THREE.DoubleSide });
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
const smooth01 = (u) => { const c = Math.max(0, Math.min(1, u)); return c * c * (3 - 2 * c); };
const _hq = new THREE.Quaternion();
const _id = new THREE.Quaternion();
const _leanFull = new THREE.Quaternion(), _leanBody = new THREE.Quaternion(), _eul = new THREE.Euler();
const _yv = new THREE.Vector3(), _fq = new THREE.Quaternion();
const _iv = new THREE.Quaternion(), _iw = new THREE.Quaternion(), _iq = new THREE.Quaternion(), _ip = new THREE.Quaternion();
const _he = new THREE.Vector3(), _hd = new THREE.Vector3(), _hx = new THREE.Quaternion();

// Rotazione `q` come vettore asse per angolo (rad), sul ramo corto.
function rotVec(q, out) {
  const g = q.w < 0 ? -1 : 1, x = q.x * g, y = q.y * g, z = q.z * g, s = Math.hypot(x, y, z);
  if (s < 1e-9) return out.set(2 * x, 2 * y, 2 * z);
  const k = 2 * Math.atan2(s, q.w * g) / s;
  return out.set(x * k, y * k, z * k);
}

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
    this.older = [];           // gesti ancora prima: finiscono di sfumare, mai via di colpo
    this.leanRest = new THREE.Quaternion();   // inclinazione in corsa che fa il busto (lean)
    this.bodyLean = { x: 0, z: 0 };           // ...e quella di tutto il corpo, attorno ai piedi
    this.feat = new Float32Array(6);
    this.lift = 0;              // metri di cui il corpo e' alzato perche' i piedi non entrino nell'erba
    this.yawFix = 0;            // rad: rotazione del gesto passata al busto (gestures.bakeYaw), tolta all'anca mentre sfuma
    // Posa del mixer prima dei ritocchi (IK, torsione, piedi): il mixer di
    // three.js riscrive un osso solo se il suo valore cambia, quindi un
    // ritocco su un osso fermo nella clip restava e poi scattava via.
    this.boneList = Object.values(this.rig);
    this.fingers = Object.keys(this.rig).map((k) => /Hand(Thumb|Index|Middle|Ring|Pinky)/.test(k));
    this.fingerStep = ANIM.fingerRate / 60;   // rad al passo (smoothJumps)
    this.boneStep = ANIM.boneRate / 60;
    this.animPose = this.boneList.map((b) => b.quaternion.clone());
    // salti isolati dell'uscita del mixer (smoothJumps)
    this.shown = this.boneList.map((b) => b.quaternion.clone());
    this.shownPrev = this.boneList.map((b) => b.quaternion.clone());
    this.finalPrev = this.boneList.map((b) => b.quaternion.clone());
    this.inert = this.boneList.map(() => null);
    this.inert0 = this.boneList.map(() => null);          // correzione all'inizio
    this.jumpD = new Float32Array(this.boneList.length);
    this.inertReady = false;
    // bacino nel mondo (trackHips): posa mostrata, sua velocita' angolare,
    // velocita' e posa al passo prima di quella che insegue
    this.hipS = new THREE.Quaternion();
    this.hipW = new THREE.Vector3();
    this.hipTW = new THREE.Vector3();
    this.hipTQ = new THREE.Quaternion();
    this.hipStep = 0;
    // palla fra le mani (holdBall): peso della presa e ultimi punti dei palmi
    // rispetto al corpo, per sciogliere la presa piano dopo il lancio
    this.holdW = 0;
    this.holdWant = false;
    this.holdMemo = { Left: {}, Right: {} };   // ultima soluzione dell'IK della presa
    this.holdL = new THREE.Vector3();
    this.holdR = new THREE.Vector3();
    this.heldCenter = new THREE.Vector3();
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
  // `chain`: dissolvenza fra il gesto in corso e questo (di norma ANIM.chainFade).
  playOnce(name, from, hold, rate = 1, fade = ANIM.fadeIn, loco = false, chain = ANIM.chainFade) {
    const clip = this.gestureClip(name);
    if (!clip) return;
    // il gesto precedente che sfuma ancora continua a sfumare: buttato via col
    // peso che aveva, le dita giravano di 0,35 rad in un fotogramma (arresto,
    // partenza lasciata e partenza nuova). La stessa clip non puo' restare:
    // il mixer le darebbe la stessa azione
    if (this.prevOne) { this.older.push(this.prevOne); this.prevOne = null; }
    for (let i = this.older.length - 1; i >= 0; i--) {
      if (this.older[i].a.getClip() === clip) { this.dropAction(this.older[i].a); this.older.splice(i, 1); }
    }
    let chained = false;
    if (this.one) {
      const w = this.one.a.getEffectiveWeight();
      if (w > 0.05 && this.one.a.getClip() !== clip) {
        // il gesto che tiene la rotazione e sfuma resta fermo alla sua posa:
        // una finta che gira il corpo, fusa con una caduta, passava i 180 gradi
        // e il bacino si ribaltava. Gli altri continuano a scorrere (una
        // partenza o una svolta a velocita' normale): fermi, sotto una
        // scivolata a 6 m/s traslavano in piedi
        if (this.keepsYaw(this.one.a)) this.one.a.timeScale = 0;
        else if (this.one.drive) this.one.a.timeScale = 1;
        this.prevOne = { a: this.one.a, w, t: 0, fade: chain };
        chained = true;
      }
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
    this.one = { a, t: 0, hold, fade: chained ? chain : fade, loco, name };
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

  // Il gesto in corso comincia a sfumare al prossimo aggiornamento, in `out`
  // s (di norma ANIM.fadeOut), e la corsa riparte dalla fase con i piedi
  // dove sono (update). Con endGesture la fase non si riallineava.
  // Gia' in dissolvenza: una piu' corta continua dal peso che ha (un arresto
  // che sfumava in ANIM.fadeOut con la radice gia' ferma traslava per 4 fotogrammi).
  fadeGesture(out) {
    const o = this.one;
    if (!o) return;
    if (o.t >= o.hold) {
      const cur = o.out || ANIM.fadeOut;
      if (out && out < cur) {
        o.base = o.base ?? Math.min(1, o.hold / o.fade);
        o.hold = o.t - (o.t - o.hold) * out / cur;
        o.out = out;
      }
      return;
    }
    if (out) o.out = out;
    o.hold = o.t + 1e-3;
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
    // a due mani la posa l'ha gia' fatta update (holdWant): qui solo la palla
    out.copy(this.heldCenter);
    this.track(out);
    return out;
  }

  // Palla fra le due mani (dentro update, prima dell'inerzializzazione): il
  // centro a meta' fra i palmi della clip, i palmi sulla superficie della palla.
  // holdChest (rimessa in attesa, sopra la corsa o un giro sul posto): la palla
  // al petto, davanti all'osso Spine2, quanto pesa la corsa; il gesto della
  // rimessa che entra la riporta fra i palmi della sua clip.
  holdTargets(radius) {
    const r = this.rig;
    this.object.updateMatrixWorld(true);
    const L = palm(r, 'Left', _hl), R = palm(r, 'Right', _hr);
    const out = this.heldCenter.addVectors(L, R).multiplyScalar(0.5);
    const cw = this.holdChest ? 1 - (this.one ? this.one.a.getEffectiveWeight() : 0) : 0;
    if (cw > 0) {
      const C = RULES.throwIn.chest, h = this.object.rotation.y;
      r.Spine2.getWorldPosition(_tl);
      _tl.x += Math.sin(h) * C[0]; _tl.z += Math.cos(h) * C[0]; _tl.y += C[1];
      out.lerp(_tl, cw);
    }
    const lat = _lat.subVectors(R, L);
    const n = lat.length();
    if (n > 1e-4) lat.divideScalar(n); else lat.set(-Math.cos(this.object.rotation.y), 0, Math.sin(this.object.rotation.y));
    const g = radius + MODEL.holdGap;
    this.object.worldToLocal(this.holdL.copy(out).addScaledVector(lat, -g));
    this.object.worldToLocal(this.holdR.copy(out).addScaledVector(lat, g));
  }

  // Salti isolati della posa finale (mixer, IK, torsione: un IK che cambia
  // soluzione): quell'osso prosegue dalla posa mostrata con la velocita' che
  // aveva e raggiunge la nuova in ANIM.inertia.time secondi
  // (inerzializzazione). Un movimento veloce che cresce passo dopo passo non si
  // tocca. Il bacino ha un inseguitore suo (trackHips), nel mondo: a fine
  // gesto la sua rotazione passa al corpo (gestures.bakeYaw) e quella locale
  // cambia senza che la posa si muova.
  smoothJumps(dt) {
    const B = this.boneList, FP = this.finalPrev, SH = this.shown, SP = this.shownPrev, I = this.inert, D = this.jumpD, K = ANIM.inertia;
    const I0 = this.inert0, hips = this.rig.Hips;
    const keep = dt > 0 ? Math.exp(-dt / K.time) : 1;
    if (dt > 0) { this.fingerStep = ANIM.fingerRate * dt; this.boneStep = ANIM.boneRate * dt; }
    this.object.updateMatrixWorld(true);
    let touched = false;
    for (let i = 0; i < B.length; i++) {
      const root = B[i] === hips;
      const q = root ? _iq.copy(hips.parent.getWorldQuaternion(_ip)).multiply(hips.quaternion) : B[i].quaternion;
      if (root) {
        // con passo zero la posa resta quella mostrata: stesso risultato
        if (!this.inertReady) this.resetHips(q);
        else if (dt > 0) this.trackHips(q, dt);
        if (q.angleTo(this.hipS) > 1e-6) {
          q.copy(this.hipS);
          hips.quaternion.copy(_ip.invert().multiply(q));
          touched = true;
        }
      } else {
        let fresh = false;
        if (dt > 0 && this.inertReady) {
          const d = q.angleTo(FP[i]);
          // un salto puo' durare piu' fotogrammi: con la correzione attiva ogni
          // passo oltre K.jump la fa ripartire
          const big = d > K.jump && d > K.ratio * Math.max(D[i], K.floor);
          const again = !!I[i] && d > K.jump;
          if (big || again) {
            // dove sarebbe andato l'osso mostrato con la velocita' dell'ultimo
            // passo, mai oltre K.jump: una velocita' grande prolungata a ogni
            // ripartenza faceva girare l'osso da solo
            _iv.copy(SP[i]).invert().multiply(SH[i]);
            const va = 2 * Math.acos(Math.min(1, Math.abs(_iv.w)));
            if (va > K.jump) _iv.slerp(_id, 1 - K.jump / va);
            _iw.copy(SH[i]).multiply(_iv);
            I[i] = I[i] || new THREE.Quaternion();
            I0[i] = (I0[i] || new THREE.Quaternion()).copy(q).invert().multiply(_iw);
            fresh = true;
          }
          D[i] = d;
        }
        FP[i].copy(q);
        if (I[i]) {
          // salti piccoli, spesso su movimenti veri della clip (il ginocchio
          // in scatto): una correzione che parte ferma le terrebbe immobili,
          // l'esponenziale le riaggancia subito alla clip
          if (fresh) I[i].copy(I0[i]);
          I[i].slerp(_id, 1 - keep);
          if (I[i].angleTo(_id) < 1e-3) I[i] = null;
          else {
            q.multiply(I[i]);
            touched = true;
          }
        }
      }
      // dita mai piu' veloci di ANIM.fingerRate rad/s: 102 clip su 271 della
      // corsa tengono la mano in una posa a 1,8 rad dalle altre, e fondendo le
      // due famiglie a 0,2 per fotogramma le dita giravano di 0,36 rad. Con
      // passo zero si riparte dalla posa del passo prima: stesso risultato
      // Nessun altro osso oltre ANIM.boneRate rad/s: una clip accelerata
      // (tuffo del portiere fino a 1,8 volte, passaggio girato di 180 gradi)
      // portava il piede a 0,8 rad in un fotogramma (il bacino lo tiene
      // trackHips sotto ANIM.hipsTrack.vmax)
      if (this.inertReady && !root) {
        const lim = this.fingers[i] ? this.fingerStep : this.boneStep;
        const ref = dt > 0 ? SH[i] : SP[i], d = ref.angleTo(q);
        if (d > lim) {
          _fq.copy(q);
          q.copy(ref).slerp(_fq, lim / d);
          touched = true;
        }
      }
      // dopo un riposizionamento (resetJumps) la velocita' riparte da zero:
      // la posa di prima, altrove e girata, dava al bacino 2,66 rad a passo
      if (dt > 0) SP[i].copy(this.inertReady ? SH[i] : q);
      SH[i].copy(q);
    }
    if (touched) this.object.updateMatrixWorld(true);
    this.inertReady = true;
  }

  // Riposizionamento: la posa nuova si mostra subito.
  resetJumps() {
    for (let i = 0; i < this.inert.length; i++) this.inert[i] = null;
    this.inertReady = false;
  }

  resetHips(q) {
    this.hipS.copy(q);
    this.hipTQ.copy(q);
    this.hipW.set(0, 0, 0);
    this.hipTW.set(0, 0, 0);
    this.hipStep = 0;
  }

  // Bacino nel mondo, inseguitore ad accelerazione limitata: la posa mostrata
  // ha una velocita' angolare che cambia al massimo di ANIM.hipsTrack.accel
  // rad/s^2. Se la posa del mixer e' raggiungibile con quel limite la segue
  // esatta; se salta (due clip col bacino girato di 180 gradi che cambiano
  // ramo nella fusione, fine di un'esultanza) ci arriva frenando in tempo,
  // con la velocita' che aveva. La curva di prima partiva ferma: tratteneva la
  // posa e poi la rilasciava, e lo scatto lo faceva lei.
  trackHips(q, dt) {
    const H = ANIM.hipsTrack, J = ANIM.inertia, S = this.hipS, W = this.hipW, TW = this.hipTW;
    const dvMax = H.accel * dt;
    // velocita' della posa inseguita; il passo di un salto non e' una velocita'
    const r = rotVec(_hx.copy(this.hipTQ).invert().premultiply(q), _hd), step = r.length();
    if (!(step > J.jump && step > J.ratio * Math.max(this.hipStep, J.floor))) {
      TW.copy(r).divideScalar(dt);
      if (step / dt > H.vmax) TW.multiplyScalar(H.vmax * dt / step);
    }
    this.hipStep = step;
    this.hipTQ.copy(q);
    // velocita' che porta esattamente sulla posa in questo passo
    const e = rotVec(_hx.copy(S).invert().premultiply(q), _he), err = e.length();
    _hd.copy(e).divideScalar(dt);
    if (_hd.distanceTo(W) <= dvMax && err / dt <= H.vmax) {
      W.copy(_hd);
      S.copy(q);
      return;
    }
    // velocita' voluta: quella della posa piu' l'avvicinamento che si ferma
    // in tempo (sqrt(2 a e)); la velocita' mostrata ci va al massimo di dvMax
    _hd.copy(TW);
    if (err > 1e-9) _hd.addScaledVector(e, Math.min(Math.sqrt(2 * H.accel * err), err / dt) / err);
    _hd.sub(W);
    const dv = _hd.length();
    if (dv > dvMax) _hd.multiplyScalar(dvMax / dv);
    W.add(_hd);
    const w = W.length();
    if (w > H.vmax) W.multiplyScalar(H.vmax / w);
    const a = Math.min(w, H.vmax) * dt;
    if (a > 1e-9) S.premultiply(_hx.setFromAxisAngle(_hd.copy(W).normalize(), a)).normalize();
  }

  // IK delle due braccia fusa con la clip a `w` (rig.solveArm: gomito sulla
  // sua cerniera, torsione della clip, al massimo `max` rad dalla soluzione
  // di prima). Con la palla presa in tuffo il gomito si piegava al contrario.
  armIK(tl, tr, w, max) {
    const r = this.rig;
    for (const [side, t] of [['Left', tl], ['Right', tr]]) {
      solveArm(r[side + 'Arm'], r[side + 'ForeArm'], (o) => palm(r, side, o), t, w, side, this.holdMemo[side], max);
    }
  }

  track(p) {
    if (this.lastDt > 0) this.heldVel.subVectors(p, this.heldAt).divideScalar(this.lastDt);
    this.heldAt.copy(p);
  }

  get busy() { return !!this.one || !!this.proc; }
  // Clip che tiene dentro la rotazione (caduta, finta, tuffo): sfumando sotto
  // un altro gesto resta ferma alla sua posa (playOnce)
  keepsYaw(a) { const m = this.tpl.meta[a.getClip().name]; return !!m && !!m.keepYaw; }
  // m/s della radice del gesto in corso, al suo tempo e al suo playback
  // (o di `act`, un'altra azione del mixer)
  gestureSpeed(act) {
    const x = act || (this.one && this.one.a);
    if (!x) return 0;
    const name = x.getClip().name, t = x.time, a = rootAt(this.tpl, name, Math.max(0, t - 0.05)), b = rootAt(this.tpl, name, t + 0.05);
    return Math.hypot(b.a - a.a, b.s - a.s) / 0.1 * Math.abs(x.timeScale);
  }
  // Un gesto vero (calcio, contrasto, stop da fermo), non una partenza, un
  // arresto o una svolta, che fanno parte della corsa.
  get acting() { return !!this.proc || (!!this.one && !this.one.loco); }

  // Animazione creata in codice (moves.js) sopra la clip in corso.
  playProc(move) {
    if (move.takeOver && this.proc && this.proc !== move) move.takeOver(this.proc);
    this.proc = move;
  }

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
      // una clip che sta per finire mentre il giocatore si sposta sfuma nella
      // corsa (al massimo in `left` s): ferma sull'ultimo fotogramma a peso
      // pieno traslava (stop di palla, colpi di testa, tuffi). Da fermi la posa
      // finale resta (a terra, palla in mano)
      if (dt > 0 && o.t < o.hold && !o.drive && o.a.loop === THREE.LoopOnce && o.a.timeScale > 0 && loco.speed > ANIM.endMove) {
        const left = (o.a.getClip().duration - o.a.time) / o.a.timeScale;
        if (left <= ANIM.fadeOut) { o.out = Math.max(ANIM.trans.cut, left); o.hold = Math.max(o.t - dt + 1e-4, Math.min(o.hold, o.t)); }
      }
      // dopo `hold` sfuma dal peso che aveva: un gesto fermato mentre entrava
      // non salta a peso pieno per un fotogramma (trovato dal test di continuita')
      // un gesto (non una partenza o un arresto) che sfuma mentre il giocatore
      // si sposta finisce di sfumare in ANIM.trans.cut s, dal peso che ha: a
      // 0,22 s la sua posa ferma traslava per 7-10 fotogrammi
      const out = o.out || ANIM.fadeOut, cut = ANIM.trans.cut;
      if (dt > 0 && was >= o.hold && out > cut && !o.loco && loco.speed > ANIM.endMove) {
        o.base = o.base ?? Math.min(1, o.hold / o.fade);
        o.hold = was - (was - o.hold) * cut / out;
        o.out = cut;
      }
      gw = o.t < o.hold ? Math.min(1, o.t / o.fade) : (o.base ?? Math.min(1, o.hold / o.fade)) * Math.max(0, 1 - (o.t - o.hold) / (o.out || ANIM.fadeOut));
      // il gesto comincia a sfumare: la corsa riparte dalla fase con i piedi dove
      // sono. Solo se il gesto era entrato del tutto: il salto di fase della
      // corsa si vede quanto la corsa pesa (con 0,5 il ginocchio scattava)
      // Dalla posa appena mostrata e prima dei tempi della corsa: dopo il mixer
      // la fase nuova si vedeva solo al fotogramma successivo
      if (was < o.hold && o.t >= o.hold && o.hold >= o.fade * 0.95 && o.base === undefined) {
        this.object.updateMatrixWorld(true);
        loco.resync(feetPose(this.rig, this.object.rotation.y, this.feat));
      }
      if (o.t >= o.hold && gw <= 0) { this.dropAction(o.a); this.one = null; gw = 0; }
    }
    // fermo sotto il gesto nuovo con la radice che non si sposta (coda di un
    // arresto, contrasto da fermo): se il giocatore si sposta sfuma in
    // ANIM.trans.redoFade s, dallo stesso punto della dissolvenza. In 0,07 s
    // le dita giravano di 0,38 rad in un fotogramma. Una clip che tiene la
    // rotazione (congelata), girata almeno di ANIM.chainTurn, in
    // ANIM.trans.turnedFade: la roulette ferma a meta' giro sotto una caduta,
    // sfumata in 0,07 s, girava il bacino di 1,2 rad a fotogramma; in 0,18 s,
    // sotto lo sgambetto che trascina il corpo a 2,5 m/s, traslava.
    // Quello che si sposta sfuma con calma.
    // Finito il gesto in corso, il precedente finisce la sua dissolvenza
    // (prima spariva con lui, col peso che aveva)
    const turned = (a) => { const y = rootAt(this.tpl, a.getClip().name, a.time).yaw; return Math.abs(Math.atan2(Math.sin(y), Math.cos(y))) >= ANIM.chainTurn; };
    const fadeStep = (p) => {
      if (dt > 0 && loco.speed > ANIM.endMove && this.gestureSpeed(p.a) < ANIM.stillRoot) {
        const f = this.keepsYaw(p.a) && turned(p.a) ? ANIM.trans.turnedFade : ANIM.trans.redoFade;
        if (p.fade > f) { p.t *= f / p.fade; p.fade = f; }
      }
      p.t += dt;
      return p.w * Math.max(0, 1 - p.t / p.fade);
    };
    if (this.prevOne) {
      pw = fadeStep(this.prevOne);
      if (pw <= 0) { this.dropAction(this.prevOne.a); this.prevOne = null; pw = 0; }
    }
    let ow = 0;
    for (let i = this.older.length - 1; i >= 0; i--) {
      const p = this.older[i];
      p.cw = fadeStep(p);
      if (p.cw <= 0) { this.dropAction(p.a); this.older.splice(i, 1); } else ow += p.cw;
    }
    const g = gw + pw + ow;
    if (g > 1) { gw /= g; pw /= g; for (const p of this.older) p.cw /= g; }
    const base = 1 - Math.min(1, g);
    // inclinazione della corsa (player.sync) quanto pesa la corsa: tutta o
    // niente scattava di colpo (fino a 0,19 rad) quando un gesto entrava o finiva
    this.object.rotation.x *= base;
    this.object.rotation.z *= base;
    this.lean(dt, loco.moving);
    if (this.one) {
      this.one.a.setEffectiveWeight(gw);
      // partenza o arresto: il tempo della clip lo decide la distanza percorsa
      // (Player.stepTransition), interpolato fra gli ultimi due passi di fisica
      const d = this.one.drive;
      if (d) this.one.a.time = d.prev + (d.t - d.prev) * alpha;
    }
    if (this.prevOne) this.prevOne.a.setEffectiveWeight(pw);
    for (const p of this.older) p.a.setEffectiveWeight(p.cw);
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
    const B = this.boneList, AP = this.animPose;
    for (let i = 0; i < B.length; i++) B[i].quaternion.copy(AP[i]);
    this.mixer.update(dt);
    for (let i = 0; i < B.length; i++) AP[i].copy(B[i].quaternion);   // uscita del mixer: si rimette al prossimo aggiornamento
    this.lastDt = dt;
    this.twist(-loco.yawAt(alpha) * base);
    this.spineLean();
    // il gesto che sfuma ha ancora dentro la rotazione gia' passata al busto
    if (this.yawFix) {
      const w = 1 - base;
      if (w > 1e-3) {
        this.object.updateMatrixWorld(true);
        _twist.setFromAxisAngle(_up, this.yawFix * w);
        rotateWorld(this.rig.Hips, _twist);
        // ...e la sua posizione attorno ai piedi: il corpo gira attorno a
        // loro, e un bacino fuori asse (portiere dopo il tuffo) saltava di 3 cm
        const h = this.rig.Hips, o = this.object.position;
        h.parent.localToWorld(_yv.copy(h.position)).sub(o).applyQuaternion(_twist).add(o);
        h.position.copy(h.parent.worldToLocal(_yv));
        h.updateMatrixWorld(true);
      } else this.yawFix = 0;
    }
    // anche con passo zero (pausa): la posa del mixer si rimette a ogni
    // aggiornamento e senza l'IK la gamba bloccata tornerebbe alla clip
    this.feet.apply(dt, loco, phase, 1 - base, this.object);
    if (this.proc && !this.proc.update(this, dt)) this.proc = null;
    // palla fra le due mani (holdWant, dal gioco): la presa entra e si scioglie
    // a MODEL.holdRate al secondo; sciolta (rinvio, rimessa, palla in una mano)
    // le braccia tornano alla clip dagli ultimi punti dei palmi
    // (e al massimo MODEL.holdTurn rad/s di braccio: fra clip e presa lontane
    // il peso non trascina le braccia in un colpo)
    const path = Math.max(blendPath(this.holdMemo.Left), blendPath(this.holdMemo.Right));
    const rate = Math.min(MODEL.holdRate, MODEL.holdTurn / Math.max(path, 1e-3)) * dt;
    this.holdW = this.holdWant ? Math.min(1, this.holdW + rate) : Math.max(0, this.holdW - rate);
    if (this.holdWant) this.holdTargets(BALL.radius);
    if (this.holdW > 0) {
      this.object.updateMatrixWorld(true);
      this.armIK(this.object.localToWorld(_tl.copy(this.holdL)), this.object.localToWorld(_tr.copy(this.holdR)), this.holdW, MODEL.holdArm * dt);
    } else if (this.holdMemo.Left.a || this.holdMemo.Right.a) {
      // presa sciolta: le braccia tornano alla clip senza scatti (rig.releaseArm)
      const r = this.rig, max = MODEL.holdArm * dt;
      if (!(releaseArm(r.LeftArm, r.LeftForeArm, this.holdMemo.Left, max) | releaseArm(r.RightArm, r.RightForeArm, this.holdMemo.Right, max))) this.holdMemo = { Left: {}, Right: {} };
    }
    this.smoothJumps(dt);
    this.ground(dt);
  }

  // L'inclinazione in corsa (rotation.x e .z, attorno ai piedi) spostava il
  // bacino fino a 19 cm dall'anello verso l'interno della curva; spostare il
  // corpo indietro di tanto faceva scivolare i piedi (a 2-4 m/s, nelle svolte
  // strette e quando l'inclinazione si ribalta). Tutto il corpo s'inclina al
  // massimo di ANIM.lean.body rad per asse (bacino entro 7 cm, piedi fermi),
  // col quadrato della quota dei passi (da fermi l'oscillazione dell'idle
  // arriva gia' a 9 cm, e partendo cambia di 2 cm a fotogramma) e cambiando
  // al massimo di bodyRate rad/s: quando l'inclinazione si ribalta in curva il
  // bacino saltava di 3-4 cm in un fotogramma. Il resto lo fa il busto sopra
  // il bacino (spineLean, dopo il mixer).
  lean(dt, moving) {
    const o = this.object, L = ANIM.lean, B = L.body * moving * moving, rx = o.rotation.x, rz = o.rotation.z, b = this.bodyLean;
    if (dt > 0) {
      const s = L.bodyRate * dt;
      b.x += Math.max(-s, Math.min(s, Math.max(-B, Math.min(B, rx)) - b.x));
      b.z += Math.max(-s, Math.min(s, Math.max(-B, Math.min(B, rz)) - b.z));
    }
    o.rotation.x = b.x;
    o.rotation.z = b.z;
    _leanFull.setFromEuler(_eul.set(rx, o.rotation.y, rz, 'YXZ'));
    _leanBody.setFromEuler(o.rotation);
    // rotazione nel mondo che il busto aggiunge a quella del corpo per arrivare all'inclinazione piena
    this.leanRest.copy(_leanFull).multiply(_leanBody.invert());
  }

  spineLean() {
    const q = this.leanRest;
    if (1 - Math.abs(q.w) < 1e-7) return;
    this.object.updateMatrixWorld(true);
    const r = this.rig;
    for (const [bone, share] of [[r.Spine, 0.3], [r.Spine1, 0.3], [r.Spine2, 0.4]]) {
      if (!bone) continue;
      _twist.copy(_id).slerp(q, share);
      rotateWorld(bone, _twist);
    }
  }

  // Busto verso dove guarda il giocatore quando il corpo e' girato verso la
  // corsa: rotazione attorno alla verticale, divisa sulle tre vertebre.
  twist(a) {
    const T = ANIM.warp.twist;
    // oltre T resta T; negli ultimi F.twistFade rad prima di pi torna a zero:
    // a pi l'angolo cambia segno e il busto girava di colpo dall'altra parte
    const s = Math.abs(a), F = ANIM.warp.twistFade;
    if (s > T) a = Math.sign(a) * T * smooth01((Math.PI - s) / F);
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
