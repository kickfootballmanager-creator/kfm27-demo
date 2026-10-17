import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { PITCH, STADIUM, LIGHT, BALL_LOOK } from './config.js';

// Contorno dello stadio: cielo a gradiente, torri dei riflettori, pubblico.
// Il pubblico e' una InstancedMesh di sagome (una draw call) animata nello
// shader: ondeggia piano e salta a braccia alzate quando segna la sua squadra.
// Con il modello convertito dal progetto 3ds Max (tools/match3d/stadium_build.py,
// fuori da git per la licenza) tribune, tetto e maxischermi sono quelli del
// modello e il pubblico sta sulle file di MultiScatter; senza file resta lo
// stadio semplice.

const HL = PITCH.length / 2, HW = PITCH.width / 2;
const MODEL_DIR = new URL('../../assets/match3d/stadium/', import.meta.url).href;
const SPONSOR_DIR = new URL('../../assets/match3d/ball/sponsor/', import.meta.url).href;
const _fwd = new THREE.Vector3();

// stadium-high.glb al livello alto, stadium-low.glb agli altri; se manca uno
// si prova l'altro, se mancano entrambi null.
export async function loadStadiumModel(level) {
  const order = level === 'high' ? ['high', 'low'] : ['low', 'high'];
  for (const f of order) {
    try { return await new GLTFLoader().loadAsync(MODEL_DIR + 'stadium-' + f + '.glb'); } catch (e) { /* il prossimo */ }
  }
  return null;
}

function sky() {
  const S = LIGHT[LIGHT.preset].sky;
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
    color: 0x000000, emissive: 0xffffff, emissiveMap: lampTexture(), emissiveIntensity: LIGHT[LIGHT.preset].lamps
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
#include <clipping_planes_pars_vertex>
uniform float uTime;
uniform vec2 uCheer;
uniform float uCells;
attribute vec3 aInfo;
varying vec2 vUv;
varying vec3 vColor;
varying float vTeam;
void main() {
  float ph = aInfo.x;
  vTeam = aInfo.y > 0.5 ? 1.0 : 0.0;
  float cheer = aInfo.y > 1.5 ? uCheer.y : (aInfo.y > 0.5 ? uCheer.x : max(uCheer.x, uCheer.y) * 0.25);
  vec3 p = position;
  p.y += sin(uTime * 1.3 + ph * 6.2832) * 0.02 + cheer * max(0.0, sin(uTime * 8.5 + ph * 6.2832)) * 0.3;
  p.x += sin(uTime * 0.7 + ph * 12.0) * 0.03;
  float up = cheer > 0.3 && fract(ph * 7.31) < cheer ? 2.0 : 0.0;
  vUv = vec2((uv.x + aInfo.z + up * uCells * 0.5) / (2.0 * uCells), uv.y);
  vColor = vec3(1.0);
  #ifdef USE_INSTANCING_COLOR
  vColor = instanceColor;
  #endif
  vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <clipping_planes_vertex>
}`;

const CROWD_FRAG = `
#include <clipping_planes_pars_fragment>
uniform sampler2D map;
uniform vec3 uSkin;
uniform float uLight;
varying vec2 vUv;
varying vec3 vColor;
varying float vTeam;
void main() {
  #include <clipping_planes_fragment>
  #ifdef REAL_ATLAS
  // tifosi del modello: colori a sinistra, maschera della maglia a destra
  // (glTF: immagine non capovolta); i neutrali restano vestiti come sono
  vec2 uc = vec2(vUv.x * 0.5, 1.0 - vUv.y);
  vec4 c = texture2D(map, uc);
  if (c.a < 0.4) discard;
  float m = texture2D(map, uc + vec2(0.5, 0.0)).r * vTeam;
  float l = dot(c.rgb, vec3(0.3, 0.59, 0.11));
  gl_FragColor = vec4(mix(c.rgb, vColor * (0.3 + 1.2 * l), m) * uLight, 1.0);
  #else
  vec4 t = texture2D(map, vUv);
  if (t.a < 0.5) discard;
  gl_FragColor = vec4(mix(uSkin, vColor, t.r) * t.g * uLight, 1.0);
  #endif
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
  return crowdMesh(kits, seats, crowdAtlas(), 2);
}

// Tifosi del modello: punti sulle spline di MultiScatter (coordinate di Blender,
// Z in alto, gia' in ordine casuale), ognuno rivolto al punto piu' vicino del
// campo. Casa dietro la porta a x negative, ospiti dietro l'altra, misti sui lati.
function modelSeats(points) {
  const v = points.split(','), seats = [], M = STADIUM.model;
  for (let i = 0; i + 2 < v.length; i += 3) {
    const x = +v[i], z = -v[i + 1], y = +v[i + 2];
    const cx = Math.max(-HL, Math.min(HL, x)), cz = Math.max(-HW, Math.min(HW, z));
    const end = Math.abs(x) > HL + M.endFrom && Math.abs(z) < HW + M.endFrom;
    const home = end ? (x < 0 ? 0.9 : 0.15) : 0.55;
    seats.push({ x, y, z, rotY: Math.atan2(cx - x, cz - z), team: Math.random() < home ? 1 : (Math.random() < 0.75 ? 2 : 0) });
  }
  return seats;
}

// `cells`: persone nell'atlante (ogni persona ha la cella a braccia giu' e quella a braccia su);
// `real`: atlante reso dai tifosi del modello (stadium_sprites.py).
function crowdMesh(kits, seats, atlas, cells, clip, real) {
  const C = STADIUM.crowd, size = real ? STADIUM.model.crowdSize : C.size;
  const geo = new THREE.PlaneGeometry(size[0], size[1]);
  geo.translate(0, size[1] / 2, 0);
  const info = new Float32Array(seats.length * 3);
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      map: { value: atlas }, uTime: { value: 0 }, uCheer: { value: new THREE.Vector2() }, uCells: { value: cells },
      uSkin: { value: new THREE.Color(C.skin) }, uLight: { value: real ? STADIUM.model.crowdLight : LIGHT[LIGHT.preset].crowd }
    },
    defines: real ? { REAL_ATLAS: '' } : {},
    vertexShader: CROWD_VERT,
    fragmentShader: CROWD_FRAG,
    clipping: !!clip,
    clippingPlanes: clip ? [clip] : null
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
    info[i * 3 + 2] = Math.floor(Math.random() * cells);
  });
  geo.setAttribute('aInfo', new THREE.InstancedBufferAttribute(info, 3));
  mesh.frustumCulled = false;
  mesh.userData.total = seats.length;
  return mesh;
}

// Loghi degli sponsor (quelli della palla) in bianco, ritagliati: `fromDark`
// = logo chiaro su fondo nero, la luminanza diventa opacita'.
function sponsorInk(im, fromDark) {
  const c = document.createElement('canvas');
  const s = Math.min(1, 512 / Math.max(im.width, im.height));
  c.width = Math.round(im.width * s); c.height = Math.round(im.height * s);
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(im, 0, 0, c.width, c.height);
  let d;
  try { d = g.getImageData(0, 0, c.width, c.height); } catch (e) { return null; }
  const p = d.data;
  let x0 = c.width, y0 = c.height, x1 = 0, y1 = 0;
  for (let i = 0; i < p.length; i += 4) {
    const a = fromDark ? Math.max(0, (Math.max(p[i], p[i + 1], p[i + 2]) - 150) / 105) * 255 : p[i + 3];
    p[i] = p[i + 1] = p[i + 2] = 255; p[i + 3] = Math.min(255, a);
    if (a > 24) { const k = i / 4, x = k % c.width, y = (k - x) / c.width; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  }
  if (x1 <= x0) return null;
  g.putImageData(d, 0, 0);
  const out = document.createElement('canvas');
  out.width = x1 - x0 + 1; out.height = y1 - y0 + 1;
  out.getContext('2d').drawImage(c, -x0, -y0);
  return out;
}

let sponsorsP = null;
function sponsors() {
  if (!sponsorsP) {
    sponsorsP = Promise.all(BALL_LOOK.sponsors.map((s) => new Promise((ok) => {
      const im = new Image();
      im.onload = () => ok(sponsorInk(im, s.fromDark));
      im.onerror = () => ok(null);
      im.src = SPONSOR_DIR + encodeURIComponent(s.file);
    }))).then((l) => l.filter(Boolean));
  }
  return sponsorsP;
}

// Banner al posto di quelli del modello (TurboSquid/DTP.3D): fondo dei
// cartelloni a bordocampo, loghi degli sponsor alternati al marchio KFM27.
function bannerTexture(aspect, first) {
  const H = 128, W = Math.round(H * aspect);
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  t.flipY = false;   // UV del glTF
  const draw = (logos) => {
    g.fillStyle = '#0d1522';
    g.fillRect(0, 0, W, H);
    const slots = Math.max(1, Math.round(W / (H * 2.6))), sw = W / slots;
    for (let i = 0; i < slots; i++) {
      const k = (first + i) % (logos.length + 1), cx = sw * (i + 0.5);
      if (k === logos.length) {
        g.fillStyle = 'rgba(255,255,255,.88)';
        g.font = Math.round(H * 0.56) + 'px Anton, Impact, sans-serif';
        g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText('KFM27', cx, H * 0.54);
        continue;
      }
      const im = logos[k], s = Math.min(sw * 0.7 / im.width, H * 0.72 / im.height);
      g.drawImage(im, cx - im.width * s / 2, (H - im.height * s) / 2, im.width * s, im.height * s);
    }
    t.needsUpdate = true;
  };
  draw([]);
  sponsors().then(draw);
  return t;
}

// Maxischermo: squadre, risultato e minuto, ridisegnato solo quando cambiano.
function screenCanvas() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 288;
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.flipY = false;
  return { c, t, key: '' };
}

export class Stadium {
  // kits: { home: { primary, secondary }, away: { ... } } per i colori dei tifosi.
  // model: il glTF di loadStadiumModel (o null); renderer: per i piani di taglio.
  constructor(kits, model = null, renderer = null) {
    this.group = new THREE.Group();
    this.cheering = new THREE.Vector2();
    this.t = 0;
    this.clip = null;
    this.screens = null;
    this.model = model ? this.useModel(model, kits, renderer) : null;
    if (!this.model) {
      this.crowd = crowd(kits);
      this.group.add(sky(), ...floodlights(), this.crowd);
    }
  }

  // Materiali del modello: trasparenze, banner, maxischermi; tutti tagliati
  // vicino alla telecamera (update) perche' lei puo' stare dentro la tribuna.
  useModel(gltf, kits, renderer) {
    const root = gltf.scene, M = STADIUM.model;
    this.clip = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0);
    if (renderer) renderer.localClippingEnabled = true;
    let points = null, atlas = null;
    const banners = { 'Banner 1': [7.53, 0], 'Banner 2': [7.53, 1], 'Banner 3': [7.53, 2], 'Screen Banner': [13.76, 3] };
    const screen = screenCanvas();
    root.traverse((o) => {
      if (o.userData && o.userData.points) points = o.userData.points;
      if (!o.isMesh) return;
      const m = o.material;
      if (m.name === 'CrowdAtlas') { atlas = m.map; o.visible = false; return; }
      m.clippingPlanes = [this.clip];
      if (M.cutout.includes(m.name)) { m.alphaTest = 0.5; m.transparent = false; m.side = THREE.DoubleSide; }
      if (M.glass.includes(m.name)) { m.transparent = true; m.opacity = M.glassOpacity; m.depthWrite = false; }
      if (banners[m.name]) { m.map = bannerTexture(...banners[m.name]); m.color.set(0xffffff); }
      if (m.name === 'Screen') { m.map = screen.t; m.emissive = new THREE.Color(0xffffff); m.emissiveMap = screen.t; m.color.set(0x000000); }
      if (m.name === 'Lights') { m.emissive = new THREE.Color(0xfff6e8); m.emissiveIntensity = M.lamps; }
      // terreno fuori dal campo appena sotto l'erba del gioco
      if (m.name === 'Ground') o.position.y -= M.groundDrop;
      m.needsUpdate = true;
      o.matrixAutoUpdate = false;
      o.updateMatrix();
    });
    this.screens = screen;
    this.group.add(sky(), root);
    if (points) {
      const cells = atlas ? M.atlasCells : 2;
      this.crowd = crowdMesh(kits, modelSeats(points), atlas || crowdAtlas(), cells, this.clip, !!atlas);
      this.group.add(this.crowd);
    } else {
      this.crowd = crowd(kits);
      this.group.add(this.crowd);
    }
    return root;
  }

  // Maxischermi: "CASA 1 - 0 OSPITI" e il minuto.
  screen(home, away, hg, ag, minute) {
    const S = this.screens;
    if (!S) return;
    const key = home + hg + away + ag + minute;
    if (key === S.key) return;
    S.key = key;
    const g = S.c.getContext('2d'), W = S.c.width, H = S.c.height;
    g.fillStyle = '#0a111c';
    g.fillRect(0, 0, W, H);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = '#ffffff';
    g.font = '96px Anton, Impact, sans-serif';
    g.fillText(hg + ' - ' + ag, W / 2, H * 0.47);
    g.font = '30px Anton, Impact, sans-serif';
    const fit = (s) => (s.length > 14 ? s.slice(0, 13) + '.' : s).toUpperCase();
    g.fillText(fit(home), W * 0.25, H * 0.82);
    g.fillText(fit(away), W * 0.75, H * 0.82);
    g.fillStyle = '#dcb264';
    g.font = '34px Anton, Impact, sans-serif';
    g.fillText(minute + "'", W / 2, H * 0.14);
    S.t.needsUpdate = true;
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

  // cam: la telecamera in uso; il modello si taglia `clipAhead` m davanti a lei.
  update(dt, cam) {
    this.t += dt;
    if (this.clip && cam) {
      cam.getWorldDirection(_fwd);
      _fwd.y = 0;
      if (_fwd.lengthSq() > 1e-6) {
        _fwd.normalize();
        this.clip.normal.copy(_fwd);
        this.clip.constant = -_fwd.dot(cam.position) - STADIUM.model.clipAhead;
      }
    }
    const k = dt / STADIUM.crowd.cheerTime;
    this.cheering.x = Math.max(0, this.cheering.x - k);
    this.cheering.y = Math.max(0, this.cheering.y - k);
    const u = this.crowd.material.uniforms;
    u.uTime.value = this.t;
    u.uCheer.value.set(Math.min(1, this.cheering.x * 1.5), Math.min(1, this.cheering.y * 1.5));
  }
}
