import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { PITCH, STADIUM } from './config.js';

// Contorno dello stadio: cielo a gradiente, torri dei riflettori, pubblico.
// Il pubblico e' una InstancedMesh di sagome (una draw call) animata nello
// shader: ondeggia piano e salta a braccia alzate quando segna la sua squadra.

const HL = PITCH.length / 2, HW = PITCH.width / 2;

function sky() {
  const S = STADIUM.sky;
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: { top: { value: new THREE.Color(S.top) }, horizon: { value: new THREE.Color(S.horizon) }, glow: { value: new THREE.Color(S.glow) } },
    vertexShader: 'varying vec3 vDir;\nvoid main() {\n  vDir = normalize(position);\n  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n}',
    fragmentShader: 'uniform vec3 top;\nuniform vec3 horizon;\nuniform vec3 glow;\nvarying vec3 vDir;\nvoid main() {\n' +
      '  float h = clamp(vDir.y, 0.0, 1.0);\n' +
      '  vec3 c = mix(horizon, top, pow(h, 0.55));\n' +
      '  c += glow * exp(-h * 9.0);\n' +
      '  gl_FragColor = vec4(c, 1.0);\n  #include <tonemapping_fragment>\n  #include <colorspace_fragment>\n}'
  });
  const m = new THREE.Mesh(new THREE.SphereGeometry(STADIUM.skyRadius, 24, 12), mat);
  m.renderOrder = -10;
  m.frustumCulled = false;
  return m;
}

// Pannello dei fari: lampade chiare su fondo scuro.
function lampTexture() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = '#10141c';
  g.fillRect(0, 0, 128, 64);
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 8; x++) {
      const cx = 8 + x * 16, cy = 8 + y * 16;
      const r = g.createRadialGradient(cx, cy, 0, cx, cy, 7);
      r.addColorStop(0, '#ffffff');
      r.addColorStop(0.6, '#e6eeff');
      r.addColorStop(1, 'rgba(230,238,255,0)');
      g.fillStyle = r;
      g.fillRect(cx - 7, cy - 7, 14, 14);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Quattro torri agli angoli, rivolte al centro del campo.
function floodlights() {
  const F = STADIUM.floodlights;
  const steel = [], lamps = [];
  for (const sx of [1, -1]) for (const sz of [1, -1]) {
    const x = sx * (HL + F.out), z = sz * (HW + F.out);
    const yaw = Math.atan2(-x, -z);
    const pole = new THREE.CylinderGeometry(F.poleRadius * 0.7, F.poleRadius, F.height, 8);
    pole.translate(x, F.height / 2, z);
    steel.push(pole);
    const frame = new THREE.BoxGeometry(F.panel[0] + 0.6, F.panel[1] + 0.6, 0.5);
    const face = new THREE.PlaneGeometry(F.panel[0], F.panel[1]);
    face.translate(0, 0, 0.26);
    for (const g of [frame, face]) {
      g.rotateX(F.tilt);
      g.rotateY(yaw);
      g.translate(x, F.height + F.panel[1] / 2, z);
    }
    steel.push(frame);
    lamps.push(face);
  }
  const s = new THREE.Mesh(mergeGeometries(steel), new THREE.MeshStandardMaterial({ color: 0x2a303a, roughness: 0.7, metalness: 0.4 }));
  const l = new THREE.Mesh(mergeGeometries(lamps), new THREE.MeshStandardMaterial({
    color: 0x000000, emissive: 0xffffff, emissiveMap: lampTexture(), emissiveIntensity: F.intensity
  }));
  return [s, l];
}

// Atlante delle sagome: 4 celle (due persone, braccia giu' e su). Canale R:
// maglia (1) o pelle (0); canale G: luminosita'; alfa: forma.
function crowdAtlas() {
  const W = 64, H = 128;
  const c = document.createElement('canvas');
  c.width = W * 4; c.height = H;
  const g = c.getContext('2d');
  const paint = (cell, up, hair) => {
    const ox = cell * W;
    const px = (r, gg) => `rgb(${r},${gg},0)`;
    // gambe (nascoste dalla fila davanti), busto e braccia
    g.fillStyle = px(0, 50);
    g.fillRect(ox + 20, 84, 10, 44); g.fillRect(ox + 34, 84, 10, 44);
    g.fillStyle = px(255, 225);
    g.beginPath(); g.roundRect(ox + 16, 44, 32, 46, 8); g.fill();
    if (up) {
      g.save(); g.translate(ox + 18, 50); g.rotate(-2.6); g.fillRect(-4, 0, 8, 34); g.restore();
      g.save(); g.translate(ox + 46, 50); g.rotate(2.6); g.fillRect(-4, 0, 8, 34); g.restore();
      g.fillStyle = px(0, 225);
      g.beginPath(); g.arc(ox + 6, 22, 5, 0, Math.PI * 2); g.arc(ox + 58, 22, 5, 0, Math.PI * 2); g.fill();
    } else {
      g.fillRect(ox + 10, 48, 8, 34); g.fillRect(ox + 46, 48, 8, 34);
    }
    // testa e capelli
    g.fillStyle = px(0, 225);
    g.beginPath(); g.arc(ox + 32, 30, 11, 0, Math.PI * 2); g.fill();
    g.fillStyle = px(0, 70);
    g.beginPath();
    if (hair) g.arc(ox + 32, 27, 12, Math.PI * 1.05, Math.PI * 1.95);
    else g.arc(ox + 32, 25, 11, Math.PI, Math.PI * 2);
    g.fill();
  };
  paint(0, false, false); paint(1, false, true); paint(2, true, false); paint(3, true, true);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.NoColorSpace;
  return t;
}

const CROWD_VERT = `
uniform float uTime;
uniform vec2 uCheer;
attribute vec3 aInfo;
varying vec2 vUv;
varying vec3 vColor;
void main() {
  float ph = aInfo.x;
  float cheer = aInfo.y > 1.5 ? uCheer.y : (aInfo.y > 0.5 ? uCheer.x : max(uCheer.x, uCheer.y) * 0.25);
  vec3 p = position;
  p.y += sin(uTime * 1.3 + ph * 6.2832) * 0.02 + cheer * max(0.0, sin(uTime * 8.5 + ph * 6.2832)) * 0.3;
  p.x += sin(uTime * 0.7 + ph * 12.0) * 0.03;
  float up = cheer > 0.3 && fract(ph * 7.31) < cheer ? 2.0 : 0.0;
  vUv = vec2((uv.x + aInfo.z + up) * 0.25, uv.y);
  vColor = vec3(1.0);
  #ifdef USE_INSTANCING_COLOR
  vColor = instanceColor;
  #endif
  gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(p, 1.0);
}`;

const CROWD_FRAG = `
uniform sampler2D map;
uniform vec3 uSkin;
uniform float uLight;
varying vec2 vUv;
varying vec3 vColor;
void main() {
  vec4 t = texture2D(map, vUv);
  if (t.a < 0.5) discard;
  gl_FragColor = vec4(mix(uSkin, vColor, t.r) * t.g * uLight, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

// Una sagoma per posto occupato, sulle quattro tribune (stessa geometria di
// pitch.stands). Il tifo di casa sta dietro la porta di sinistra, quello
// ospite dietro l'altra; le tribune lunghe sono miste.
function crowd(kits) {
  const C = STADIUM.crowd, T = STADIUM.stands;
  const hl = HL + PITCH.runoff + 2, hw = HW + PITCH.runoff + 2;
  const slope = T.rise / T.depth, len = Math.hypot(T.depth, T.rise);
  const seats = [];
  const stand = (w, rotY, dist, home) => {
    const rows = Math.floor(len / C.row);
    for (let r = 0; r < rows; r++) {
      const d = (r + 0.5) * C.row * T.depth / len;
      for (let u = -w / 2 + C.seat / 2; u < w / 2; u += C.seat) {
        if (Math.random() > C.fill) continue;
        const x = u + (Math.random() - 0.5) * C.seat * 0.3, y = d * slope, z = -dist - d;
        const c = Math.cos(rotY), s = Math.sin(rotY);
        seats.push({ x: x * c + z * s, y, z: -x * s + z * c, rotY, team: Math.random() < home ? 1 : (Math.random() < 0.75 ? 2 : 0) });
      }
    }
  };
  stand(hl * 2 + T.depth * 2, 0, hw, 0.55);
  stand(hl * 2 + T.depth * 2, Math.PI, hw, 0.55);
  stand(hw * 2, Math.PI / 2, hl, 0.9);
  stand(hw * 2, -Math.PI / 2, hl, 0.15);
  // ordine casuale: ridurre la densita' (count) sfoltisce in modo uniforme
  for (let i = seats.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [seats[i], seats[j]] = [seats[j], seats[i]]; }

  const geo = new THREE.PlaneGeometry(C.size[0], C.size[1]);
  geo.translate(0, C.size[1] / 2, 0);
  const info = new Float32Array(seats.length * 3);
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      map: { value: crowdAtlas() }, uTime: { value: 0 }, uCheer: { value: new THREE.Vector2() },
      uSkin: { value: new THREE.Color(C.skin) }, uLight: { value: C.light }
    },
    vertexShader: CROWD_VERT,
    fragmentShader: CROWD_FRAG
  });
  const mesh = new THREE.InstancedMesh(geo, mat, seats.length);
  const colors = [kits.home.primary, kits.home.secondary || kits.home.primary, kits.away.primary, kits.away.secondary || kits.away.primary];
  const neutral = C.neutral.map((h) => new THREE.Color(h));
  const tint = [null, [new THREE.Color(colors[0]), new THREE.Color(colors[1])], [new THREE.Color(colors[2]), new THREE.Color(colors[3])]];
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), one = new THREE.Vector3(1, 1, 1), pos = new THREE.Vector3();
  const col = new THREE.Color();
  seats.forEach((s, i) => {
    q.setFromAxisAngle(up, s.rotY);
    const k = 0.9 + Math.random() * 0.2;
    m4.compose(pos.set(s.x, s.y, s.z), q, one.set(k, k, k));
    mesh.setMatrixAt(i, m4);
    const pal = s.team ? tint[s.team] : null;
    col.copy(pal ? pal[Math.random() < 0.7 ? 0 : 1] : neutral[(Math.random() * neutral.length) | 0]);
    col.multiplyScalar(0.75 + Math.random() * 0.35);
    mesh.setColorAt(i, col);
    info[i * 3] = Math.random();
    info[i * 3 + 1] = s.team;
    info[i * 3 + 2] = Math.random() < 0.5 ? 0 : 1;
  });
  geo.setAttribute('aInfo', new THREE.InstancedBufferAttribute(info, 3));
  mesh.frustumCulled = false;
  mesh.userData.total = seats.length;
  return mesh;
}

export class Stadium {
  // kits: { home: { primary, secondary }, away: { ... } } per i colori dei tifosi.
  constructor(kits) {
    this.group = new THREE.Group();
    this.crowd = crowd(kits);
    this.group.add(sky(), ...floodlights(), this.crowd);
    this.cheering = new THREE.Vector2();
    this.t = 0;
  }

  // Densita' del pubblico e intensita' dei fari per livello di qualita'.
  setLevel(level) {
    const d = STADIUM.crowd.density[level] ?? 1;
    this.crowd.count = Math.floor(this.crowd.userData.total * d);
  }

  // Gol: esulta chi tifa per `team` ('home' | 'away').
  cheer(team) {
    if (team === 'home') this.cheering.x = 1; else this.cheering.y = 1;
  }

  update(dt) {
    this.t += dt;
    const k = dt / STADIUM.crowd.cheerTime;
    this.cheering.x = Math.max(0, this.cheering.x - k);
    this.cheering.y = Math.max(0, this.cheering.y - k);
    const u = this.crowd.material.uniforms;
    u.uTime.value = this.t;
    u.uCheer.value.set(Math.min(1, this.cheering.x * 1.5), Math.min(1, this.cheering.y * 1.5));
  }
}
