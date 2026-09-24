import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { MODEL, ANIM } from './config.js';
import { boneMap, solveTwoBone, palm } from './rig.js';
import { measureGait, SLOTS, slotTime, IDLE_SLOT, FootLock } from './anim.js';

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
    poses: samplePoses(holder, clips),
    plate: platePlacement(holder, body, clips.idle),
    gait: measureGait(holder, clips)
  };
}

// Palmi fotogramma per fotogramma nelle clip del portiere, nel riferimento
// del giocatore (a avanti, s destra, y su) con la radice ferma: servono a
// scegliere la parata e il fotogramma in cui le mani arrivano sulla palla.
function samplePoses(holder, clips) {
  const rig = boneMap(holder);
  const mx = new THREE.AnimationMixer(holder);
  const v = new THREE.Vector3(), out = {};
  const fps = ANIM.poseFps;
  for (const name in clips) {
    if (!name.startsWith('gk_')) continue;
    const clip = clips[name], a = mx.clipAction(clip);
    const n = Math.floor(clip.duration * fps) + 1;
    const lh = new Float32Array(n * 3), rh = new Float32Array(n * 3);
    a.play();
    for (let i = 0; i < n; i++) {
      a.time = Math.min(i / fps, clip.duration - 1e-3);
      mx.update(0);
      holder.updateMatrixWorld(true);
      palm(rig, 'Left', v); lh[i * 3] = v.z; lh[i * 3 + 1] = -v.x; lh[i * 3 + 2] = v.y;
      palm(rig, 'Right', v); rh[i * 3] = v.z; rh[i * 3 + 1] = -v.x; rh[i * 3 + 2] = v.y;
    }
    a.stop();
    out[name] = { fps, n, lh, rh };
  }
  mx.stopAllAction();
  mx.uncacheRoot(holder);
  return out;
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
    // Una azione per fessura del blend tree (anim.js); le corse hanno il tempo
    // deciso dalla fase comune, l'idle va per conto suo.
    this.slots = SLOTS.map((name, i) => {
      const clip = tpl.clips[name];
      if (!clip) return null;
      const a = this.mixer.clipAction(clip);
      a.setEffectiveWeight(0);
      a.play();
      if (i !== IDLE_SLOT) a.timeScale = 0;
      return a;
    });
    this.feet = new FootLock(this.rig);
    this.tpl = tpl;
    this.one = null;
    this.prevOne = null;       // gesto precedente che sfuma sotto quello nuovo
  }

  // Gesto sopra la corsa da `from`; dopo `hold` secondi sfuma verso la corsa.
  // Un gesto gia' in corso sfuma sotto il nuovo: niente pose in piedi fra due gesti a terra.
  playOnce(name, from, hold, rate = 1, fade = ANIM.fadeIn) {
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
    this.one = { a, t: 0, hold, fade: chained ? ANIM.chainFade : fade };
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

  // Riprende un gesto fermato con playOnce(..., rate 0) dallo stesso
  // fotogramma: nessun salto di posa. false se il gesto in corso e' un altro.
  resume(name, rate, hold) {
    const o = this.one;
    if (!o || o.a.getClip() !== this.tpl.clips[name]) return false;
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

  // Pesi e fase della locomozione da `gait` (interpolati con `alpha` fra gli
  // ultimi due passi di fisica), il gesto sopra, poi i piedi fermi a terra.
  update(dt, gait, alpha = 1) {
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
    const phase = gait.phaseAt(alpha);
    for (let i = 0; i < this.slots.length; i++) {
      const a = this.slots[i];
      if (!a) continue;
      if (i !== IDLE_SLOT) a.time = slotTime(gait, i, phase, gait.keeperLeft);
      a.setEffectiveWeight(gait.weightAt(i, alpha) * (1 - oneW));
    }
    this.mixer.update(dt);
    this.lastDt = dt;
    if (dt > 0) this.feet.apply(dt, gait, phase, oneW, this.object);
    if (this.proc && !this.proc.update(this, dt)) this.proc = null;
  }

  dispose() {
    this.mixer.stopAllAction();
    this.mixer.uncacheRoot(this.object);
  }
}
