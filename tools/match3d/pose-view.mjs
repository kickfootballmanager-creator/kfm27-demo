// Verifica delle pose: il Calciatore di player.glb con una clip dei pacchetti
// Studio33 al fotogramma chiesto, la radice della clip applicata e la palla
// dove la mette Ball_Bone. La usa pose-shots.mjs; a mano:
//   tools/match3d/pose-view.html  poi  __show({ clip, t, ball: 'contact', view: 'side' })
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { AnimLibrary } from '../../src/js/match3d/anim-lib.js';

const W = 640, H = 800;
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setSize(W, H);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a111c);
scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x2c3a24, 1.2));
const sun = new THREE.DirectionalLight(0xffffff, 2.2);
sun.position.set(-3, 8, 5);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 0.5, far: 30 });
scene.add(sun, sun.target);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshStandardMaterial({ color: 0x2f5a2c, roughness: 0.95 }));
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);
const ball = new THREE.Mesh(new THREE.SphereGeometry(0.11, 32, 16), new THREE.MeshStandardMaterial({ color: 0xf2f2ee, roughness: 0.5 }));
ball.castShadow = true;
scene.add(ball);
const camera = new THREE.PerspectiveCamera(32, W / H, 0.1, 100);

const lib = new AnimLibrary();
let holder, rig, mixer, action, scale = 1;

async function init() {
  const packs = new URLSearchParams(location.search).get('packs') || 'core';
  const [gltf] = await Promise.all([
    new GLTFLoader().loadAsync('../../src/assets/match3d/player.glb'),
    ...packs.split(',').map((p) => lib.load(p))
  ]);
  const root = gltf.scene;
  root.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } });
  holder = new THREE.Group();
  holder.add(root);
  holder.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(holder, true);
  scale = 1.8 / (box.max.y - box.min.y);
  root.scale.setScalar(scale);
  root.position.y = -box.min.y * scale;
  scene.add(holder);
  rig = {};
  root.traverse((o) => { if (o.isBone) rig[o.name.replace(/^mixamorig\d*:?/, '')] = o; });
  mixer = new THREE.AnimationMixer(root);
  window.__lib = lib;
  window.__ready = true;
}

// Radice della clip al tempo t: [avanti, sinistra, imbardata], interpolata.
function rootAt(m, t) {
  const r = m.root, n = r.length / 3, x = Math.min(n - 1, Math.max(0, t * 30));
  const i = Math.floor(x), j = Math.min(n - 1, i + 1), a = x - i;
  return [0, 1, 2].map((k) => r[i * 3 + k] + (r[j * 3 + k] - r[i * 3 + k]) * a);
}

// Mostra una posa. o.t: secondi (o 'contact'); o.ball: 'contact' | 'start' | null.
window.__show = (o) => {
  const e = lib.get(o.clip);
  if (!e) throw new Error('clip mancante: ' + o.clip);
  const m = e.meta, c = m.ev && m.ev.contact;
  const t = o.t === 'contact' ? (c ? c.t : 0) : o.t;
  if (action) action.stop();
  action = mixer.clipAction(e.clip);
  action.play();
  action.time = t;
  mixer.update(0);
  const [f, l, y] = rootAt(m, t);
  holder.position.set(l * scale, 0, f * scale);
  // clip che tengono la rotazione della radice (portiere, finte, cadute): gia' dentro la clip
  holder.rotation.y = m.keepYaw ? 0 : y;
  holder.updateMatrixWorld(true);
  // palla: nel riferimento del primo fotogramma (x sinistra, y su, z avanti)
  const b = o.ball === 'contact' && c ? c.ballW : o.ball === 'start' ? m.ball0 : null;
  ball.visible = !!b;
  if (b) ball.position.set(b[0] * scale, Math.max(0.11, b[1] * scale), b[2] * scale);
  const hips = rig.Hips.getWorldPosition(new THREE.Vector3());
  const look = new THREE.Vector3(hips.x, Math.max(0.6, hips.y * 0.85), hips.z);
  // con la palla lontana dal corpo (tuffo) si inquadrano tutti e due
  let d = o.dist || 3.6;
  if (b) {
    const gap = ball.position.distanceTo(look);
    if (gap > 0.9) { look.lerp(ball.position, 0.45); d += gap * 0.9; }
  }
  const yaw = holder.rotation.y + (o.view === 'front' ? 0.45 : o.view === 'back' ? Math.PI - 0.5 : Math.PI / 2 + 0.35);
  camera.position.set(look.x + Math.sin(yaw) * d, look.y + 0.5, look.z + Math.cos(yaw) * d);
  camera.lookAt(look);
  sun.target.position.copy(look);
  sun.position.copy(look).add(new THREE.Vector3(-3, 8, 5));
  renderer.render(scene, camera);
  const foot = (k) => rig[k].getWorldPosition(new THREE.Vector3());
  return {
    t, hips: hips.y, contact: c || null,
    feet: ['LeftToeBase', 'RightToeBase', 'LeftFoot', 'RightFoot'].map((k) => +foot(k).y.toFixed(3)),
    ballGap: b ? Math.min(...['LeftToeBase', 'RightToeBase', 'LeftFoot', 'RightFoot', 'LeftHand', 'RightHand', 'Head']
      .map((k) => +foot(k).distanceTo(ball.position).toFixed(3))) : null
  };
};

init().catch((e) => { window.__error = String(e && e.stack || e); console.error(e); });
