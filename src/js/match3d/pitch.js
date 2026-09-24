import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { PITCH, GOAL } from './config.js';

const TEX = new URL('../../assets/match3d/textures/', import.meta.url).href;

function loadTex(loader, name, srgb, repX, repY, aniso) {
  const t = loader.load(TEX + name);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repX, repY);
  t.anisotropy = aniso;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function grass(renderer) {
  const sx = PITCH.length + PITCH.runoff * 2;
  const sz = PITCH.width + PITCH.runoff * 2;
  const rx = sx / PITCH.grassTileMeters, rz = sz / PITCH.grassTileMeters;
  const aniso = Math.min(4, renderer.capabilities.getMaxAnisotropy());
  const loader = new THREE.TextureLoader();
  const mat = new THREE.MeshStandardMaterial({
    map: loadTex(loader, 'Grass003_1K-JPG_Color.jpg', true, rx, rz, aniso),
    normalMap: loadTex(loader, 'Grass003_1K-JPG_NormalGL.jpg', false, rx, rz, aniso),
    roughnessMap: loadTex(loader, 'Grass003_1K-JPG_Roughness.jpg', false, rx, rz, aniso),
    normalScale: new THREE.Vector2(0.6, 0.6),
    roughness: 1,
    metalness: 0
  });
  const geo = new THREE.PlaneGeometry(sx, sz);
  geo.rotateX(-Math.PI / 2);
  return new THREE.Mesh(geo, mat);
}

// Il campo e' simmetrico: si disegna un quarto (x>=0, z>=0) e lo si
// specchia quattro volte con gli stessi UV.
function linesCanvas(qx, qz) {
  const c = document.createElement('canvas');
  c.width = c.height = 1024;
  const g = c.getContext('2d');
  g.scale(c.width / qx, c.height / qz);

  const hl = PITCH.length / 2, hw = PITCH.width / 2;
  const stripeW = PITCH.length / (PITCH.stripes | 1);
  for (let k = 0; (k - 0.5) * stripeW < hl; k++) {
    if (k % 2) continue;
    const a = Math.max(0, (k - 0.5) * stripeW), b = Math.min(hl, (k + 0.5) * stripeW);
    g.fillStyle = `rgba(255,255,255,${PITCH.stripeAlpha})`;
    g.fillRect(a, 0, b - a, hw);
  }

  g.strokeStyle = '#f4f6f2';
  g.fillStyle = '#f4f6f2';
  g.lineWidth = PITCH.lineWidth;
  const line = (pts) => { g.beginPath(); g.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]); g.stroke(); };
  const arc = (x, z, r, a0, a1) => { g.beginPath(); g.arc(x, z, r, a0, a1); g.stroke(); };
  const dot = (x, z, r) => { g.beginPath(); g.arc(x, z, r, 0, Math.PI * 2); g.fill(); };

  const pa = hl - PITCH.penaltyDepth, ga = hl - PITCH.goalAreaDepth, ps = hl - PITCH.penaltySpot;
  line([0, 0, 0, hw]);
  line([0, hw, hl, hw, hl, 0]);
  line([hl, PITCH.penaltyWidth / 2, pa, PITCH.penaltyWidth / 2, pa, 0]);
  line([hl, PITCH.goalAreaWidth / 2, ga, PITCH.goalAreaWidth / 2, ga, 0]);
  arc(0, 0, PITCH.centerCircle, 0, Math.PI / 2);
  arc(hl, hw, PITCH.cornerArc, Math.PI, Math.PI * 1.5);
  const arcStart = Math.acos((pa - ps) / PITCH.centerCircle);
  arc(ps, 0, PITCH.centerCircle, arcStart, Math.PI);
  dot(0, 0, 0.15);
  dot(ps, 0, 0.11);
  return c;
}

function lines(renderer) {
  const m = 0.5;
  const qx = PITCH.length / 2 + m, qz = PITCH.width / 2 + m;
  const tex = new THREE.CanvasTexture(linesCanvas(qx, qz));
  tex.flipY = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());

  const pos = [], uv = [], idx = [];
  for (const sx of [1, -1]) for (const sz of [1, -1]) {
    const o = pos.length / 3;
    pos.push(0, 0, 0, sx * qx, 0, 0, sx * qx, 0, sz * qz, 0, 0, sz * qz);
    uv.push(0, 0, 1, 0, 1, 1, 0, 1);
    idx.push(o, o + 1, o + 2, o, o + 2, o + 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const mat = new THREE.MeshLambertMaterial({
    map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = 0.004;
  mesh.renderOrder = 1;
  return mesh;
}

function netTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  g.strokeStyle = '#ffffff';
  g.lineWidth = 4;
  g.strokeRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

// UV in metri / lato della maglia: un solo materiale per tutte le reti.
function netPlane(w, h, cell) {
  const g = new THREE.PlaneGeometry(w, h);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w / cell, uv.getY(i) * h / cell);
  return g;
}

function goals() {
  const hl = PITCH.length / 2, hw = GOAL.width / 2, r = GOAL.postRadius;
  const H = GOAL.height, D = GOAL.depth, pz = hw + r;
  const frame = [], net = [];
  for (const s of [1, -1]) {
    for (const z of [pz, -pz]) {
      const p = new THREE.CylinderGeometry(r, r, H + r, 14);
      p.translate(s * hl, (H + r) / 2, z);
      frame.push(p);
      const back = new THREE.CylinderGeometry(0.025, 0.025, H, 6);
      back.translate(s * (hl + D), H / 2, z);
      frame.push(back);
      const top = new THREE.CylinderGeometry(0.025, 0.025, D, 6);
      top.rotateZ(Math.PI / 2);
      top.translate(s * (hl + D / 2), H, z);
      frame.push(top);
    }
    const bar = new THREE.CylinderGeometry(r, r, pz * 2 + r * 2, 14);
    bar.rotateX(Math.PI / 2);
    bar.translate(s * hl, H + r, 0);
    frame.push(bar);

    const b = netPlane(pz * 2, H, GOAL.netCell);
    b.rotateY(Math.PI / 2);
    b.translate(s * (hl + D), H / 2, 0);
    net.push(b);
    for (const z of [pz, -pz]) {
      const sd = netPlane(D, H, GOAL.netCell);
      sd.translate(s * (hl + D / 2), H / 2, z);
      net.push(sd);
    }
    const roof = netPlane(D, pz * 2, GOAL.netCell);
    roof.rotateX(-Math.PI / 2);
    roof.translate(s * (hl + D / 2), H, 0);
    net.push(roof);
  }
  const frameMesh = new THREE.Mesh(mergeGeometries(frame), new THREE.MeshLambertMaterial({ color: 0xf2f4f5 }));
  const netMesh = new THREE.Mesh(mergeGeometries(net), new THREE.MeshLambertMaterial({
    map: netTexture(), alphaTest: 0.35, transparent: true, opacity: 0.85,
    side: THREE.DoubleSide, depthWrite: false
  }));
  netMesh.renderOrder = 2;
  return [frameMesh, netMesh];
}

function boardTexture() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = '#0d1522';
  g.fillRect(0, 0, 512, 64);
  g.fillStyle = 'rgba(255,255,255,.82)';
  g.font = '40px Anton, Impact, sans-serif';
  g.textBaseline = 'middle';
  g.fillText('KFM27', 24, 34);
  g.fillText('KFM27', 280, 34);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function boards() {
  const hl = PITCH.length / 2 + PITCH.runoff, hw = PITCH.width / 2 + PITCH.runoff;
  const h = PITCH.boardHeight, d = PITCH.boardDepth;
  const parts = [];
  const add = (w, x, z, rotY) => {
    const g = new THREE.PlaneGeometry(w, h);
    const uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * w / 8);
    g.rotateY(rotY);
    g.translate(x, h / 2, z);
    parts.push(g);
  };
  add(hl * 2, 0, -hw, 0);
  add(hl * 2, 0, hw, Math.PI);
  add(hw * 2, -hl, 0, Math.PI / 2);
  add(hw * 2, hl, 0, -Math.PI / 2);
  const mesh = new THREE.Mesh(mergeGeometries(parts), new THREE.MeshLambertMaterial({ map: boardTexture(), side: THREE.DoubleSide }));
  mesh.userData.depth = d;
  return mesh;
}

function crowdTexture() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#121a26';
  g.fillRect(0, 0, 256, 128);
  const tones = ['#2a3444', '#3a4252', '#4b4f58', '#1d2633', '#5a5048', '#384a5e'];
  for (let y = 2; y < 128; y += 6) {
    for (let x = 2; x < 256; x += 5) {
      if (Math.random() < 0.18) continue;
      g.fillStyle = tones[(Math.random() * tones.length) | 0];
      g.fillRect(x + (Math.random() * 2 - 1), y, 3, 4);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Tribune: quattro piani inclinati dietro i cartelloni.
function stands() {
  const hl = PITCH.length / 2 + PITCH.runoff + 2, hw = PITCH.width / 2 + PITCH.runoff + 2;
  const depth = 26, rise = 14, tilt = Math.atan2(rise, depth), len = Math.hypot(depth, rise);
  const parts = [];
  const add = (w, rotY, dist) => {
    const g = new THREE.PlaneGeometry(w, len);
    const uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w / 24, uv.getY(i) * len / 12);
    g.rotateX(-Math.PI / 2 + tilt);
    g.translate(0, rise / 2, -dist - depth / 2);
    g.rotateY(rotY);
    parts.push(g);
  };
  add(hl * 2 + depth * 2, 0, hw);
  add(hl * 2 + depth * 2, Math.PI, hw);
  add(hw * 2, Math.PI / 2, hl);
  add(hw * 2, -Math.PI / 2, hl);
  return new THREE.Mesh(mergeGeometries(parts), new THREE.MeshLambertMaterial({ map: crowdTexture() }));
}

export function buildPitch(renderer) {
  const group = new THREE.Group();
  group.add(grass(renderer), lines(renderer), boards(), stands(), ...goals());
  return group;
}
