import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { BALL, BALL_LOOK } from './config.js';

// Aspetto della palla (skill: "Fisica della palla", modello visivo). La forma
// e' quella del modello dell'utente (soccerball.fbx), ridotta da
// tools/match3d/ball_build.py a una sfera bassa con le UV equirettangolari
// (ball.glb, 22 cm) piu' la mappa ball-maps.png: G rilievo (spicchi gonfi e
// cuciture), B maschera delle cuciture. Colori e motivo della competizione si
// generano qui, texel per texel; i loghi (competizione e sponsor) sono
// decalcomanie proiettate dal centro della palla sul piano tangente: un logo
// di 6 cm resta dritto e proporzionato, senza le deformazioni della mappa
// equirettangolare vicino ai poli. Per il texel (u, v) la direzione e'
//   phi = 2 pi u - pi, theta = pi (1 - v)
//   d = (sin theta sin phi, cos theta, sin theta cos phi)
// come in ball_build.py.

const DIR = 'src/assets/match3d/ball/';

const loadImage = (src, cors) => new Promise((ok) => {
  const im = new Image();
  if (cors) im.crossOrigin = 'anonymous';
  im.onload = () => ok(im);
  im.onerror = () => ok(null);
  im.src = src;
});

const hex = (c) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// Direzioni di riferimento per i motivi: vertici dell'icosaedro (12) e centri
// delle sue facce (20), su cui stanno spicchi e decorazioni dei palloni.
const PHI = (1 + Math.sqrt(5)) / 2;
const ICO = [];
for (const a of [-1, 1]) for (const b of [-1, 1]) ICO.push([0, a, b * PHI], [a, b * PHI, 0], [b * PHI, 0, a]);
for (const v of ICO) { const l = Math.hypot(...v); v[0] /= l; v[1] /= l; v[2] /= l; }
const FACES = [];
for (let i = 0; i < 12; i++) for (let j = i + 1; j < 12; j++) for (let k = j + 1; k < 12; k++) {
  const d = (a, b) => ICO[a][0] * ICO[b][0] + ICO[a][1] * ICO[b][1] + ICO[a][2] * ICO[b][2];
  if (d(i, j) > 0.4 && d(j, k) > 0.4 && d(i, k) > 0.4) {
    const c = [0, 1, 2].map((n) => ICO[i][n] + ICO[j][n] + ICO[k][n]), l = Math.hypot(...c);
    FACES.push({ c: c.map((x) => x / l), v: [ICO[i], ICO[j], ICO[k]] });
  }
}

function norm(v) { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }
function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
function fromLonLat(lon, lat) {
  const p = lon * Math.PI / 180, t = (90 - lat) * Math.PI / 180;
  return [Math.sin(t) * Math.sin(p), Math.cos(t), Math.sin(t) * Math.cos(p)];
}

// Un livello del motivo valutato nella direzione d: restituisce [colore, copertura 0..1].
function layerAt(L, x, y, z) {
  if (L.type === 'band') {
    // fascia attorno al cerchio massimo di normale L.n, ondulata (k onde, ampiezza amp)
    const n = L.n, s = n[0] * x + n[1] * y + n[2] * z;
    const a = L.a, b = L.b;
    const az = Math.atan2(a[0] * x + a[1] * y + a[2] * z, b[0] * x + b[1] * y + b[2] * z);
    const off = s - L.amp * Math.sin(L.k * az + L.ph);
    return smooth(L.w + L.soft, L.w - L.soft, Math.abs(off - L.shift));
  }
  if (L.type === 'tri') {
    // triangolo sulle facce dell'icosaedro (L.pick: quali), staccato dai bordi di `gap`
    let best = 0;
    for (const f of L.faces) {
      const c = f.c;
      if (c[0] * x + c[1] * y + c[2] * z < 0.75) continue;
      // distanza dai tre lati: piani per il centro della palla e due vertici
      let m = Infinity;
      for (const n of f.en) m = Math.min(m, n[0] * x + n[1] * y + n[2] * z);
      best = Math.max(best, smooth(L.gap, L.gap + L.soft, m));
    }
    return best;
  }
  if (L.type === 'crescent') {
    // falce attorno ai vertici dell'icosaedro: disco meno disco spostato
    let best = 0;
    for (let i = 0; i < ICO.length; i++) {
      const c = ICO[i], dc = c[0] * x + c[1] * y + c[2] * z;
      if (dc < L.cos0) continue;
      const o = L.off[i], dd = o[0] * x + o[1] * y + o[2] * z;
      best = Math.max(best, smooth(L.cos0, L.cos0 + L.soft, dc) * (1 - smooth(L.cos1, L.cos1 + L.soft, dd)));
    }
    return best;
  }
  return 0;
}

// Prepara i livelli di un disegno (basi ortonormali, falci spostate).
function prepare(design) {
  return design.layers.map((L0) => {
    const L = { ...L0, col: hex(L0.color) };
    if (L.type === 'band') {
      L.n = norm(L.axis);
      const t = Math.abs(L.n[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
      L.a = norm(cross(L.n, t)); L.b = cross(L.n, L.a);
      L.ph = L.phase || 0; L.shift = L.shift || 0; L.soft = L.soft ?? 0.006;
    } else if (L.type === 'crescent') {
      L.cos0 = Math.cos(L.r0); L.cos1 = Math.cos(L.r1); L.soft = L.soft ?? 0.004;
      // il disco tolto e' spostato lungo un verso che gira attorno alla palla
      L.off = ICO.map((c) => {
        const t = norm(cross(c, Math.abs(c[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]));
        const s = L.shiftAngle;
        return norm([c[0] * Math.cos(s) + t[0] * Math.sin(s), c[1] * Math.cos(s) + t[1] * Math.sin(s), c[2] * Math.cos(s) + t[2] * Math.sin(s)]);
      });
    } else if (L.type === 'tri') {
      L.soft = L.soft ?? 0.006;
      L.faces = FACES.filter((f, i) => !L.pick || L.pick.keep.includes(i % L.pick.mod)).map((f) => ({
        c: f.c,
        en: [0, 1, 2].map((e) => {
          const nn = norm(cross(f.v[e], f.v[(e + 1) % 3]));
          return nn[0] * f.c[0] + nn[1] * f.c[1] + nn[2] * f.c[2] > 0 ? nn : nn.map((v) => -v);
        })
      }));
    }
    return L;
  });
}

// Decalcomania: immagine del logo (ImageData) proiettata sul piano tangente in `dir`.
function decal(img, lonLat, widthCm, rotDeg, tint, badge) {
  const c = fromLonLat(lonLat[0], lonLat[1]);
  // "su" del logo: verso il polo nord, ruotato di rotDeg attorno al centro
  const north = [0, 1, 0];
  let r = norm(cross(north, c));
  if (!Number.isFinite(r[0]) || Math.hypot(...cross(north, c)) < 1e-6) r = [1, 0, 0];
  let u = cross(c, r);
  const a = rotDeg * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
  const r2 = [r[0] * ca + u[0] * sa, r[1] * ca + u[1] * sa, r[2] * ca + u[2] * sa];
  const u2 = [u[0] * ca - r[0] * sa, u[1] * ca - r[1] * sa, u[2] * ca - r[2] * sa];
  // guardando la palla da fuori, r2 va verso destra e u2 verso l'alto del logo
  // solo cosi' (con la base north x c il logo usciva capovolto)
  const hw = widthCm / 2 / (BALL.radius * 100), hh = hw * img.height / img.width;
  const lim = Math.cos(Math.atan(Math.hypot(hw, hh) * (badge ? 1.6 : 1.05)));
  return { img, c, r: r2, u: u2.map((v) => -v), hw, hh, lim, tint: tint ? hex(tint) : null, badge };
}

// Logo in un canvas quadrato con il margine trasparente tolto; `fromDark`:
// logo chiaro su fondo scuro senza trasparenza (la luminanza diventa opacita').
function logoData(im, fromDark) {
  if (!im) return null;
  const c = document.createElement('canvas');
  const s = Math.min(1, 512 / Math.max(im.width, im.height));
  c.width = Math.round(im.width * s); c.height = Math.round(im.height * s);
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(im, 0, 0, c.width, c.height);
  let d;
  try { d = g.getImageData(0, 0, c.width, c.height); } catch (e) { return null; }   // immagine senza CORS
  const p = d.data;
  if (fromDark) {
    for (let i = 0; i < p.length; i += 4) {
      const l = Math.max(0, (Math.max(p[i], p[i + 1], p[i + 2]) - 150) / 105);
      p[i] = p[i + 1] = p[i + 2] = 255; p[i + 3] = Math.round(255 * Math.min(1, l));
    }
  }
  // ritaglio sul contenuto opaco
  let x0 = c.width, y0 = c.height, x1 = 0, y1 = 0;
  for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (p[(y * c.width + x) * 4 + 3] > 24) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  if (x1 <= x0 || y1 <= y0) return null;
  // margine di HALO texel attorno al logo, per il bordo del colore di fondo
  const M = HALO, w = x1 - x0 + 1 + 2 * M, h = y1 - y0 + 1 + 2 * M, out = new ImageData(w, h);
  for (let y = 0; y < y1 - y0 + 1; y++) out.data.set(p.subarray(((y + y0) * c.width + x0) * 4, ((y + y0) * c.width + x1 + 1) * 4), ((y + M) * w + M) * 4);
  // bordo: l'opacita' del logo allargata (due medie mobili), stampata col colore di fondo
  let a = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) a[i] = out.data[i * 4 + 3] / 255;
  for (const horiz of [true, false, true, false]) {
    const b = new Float32Array(w * h), r = Math.ceil(M / 2);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let sum = 0, n = 0;
      for (let k = -r; k <= r; k++) {
        const xx = horiz ? x + k : x, yy = horiz ? y : y + k;
        if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
        sum += a[yy * w + xx]; n++;
      }
      b[y * w + x] = sum / n;
    }
    a = b;
  }
  out.halo = a.map((v) => Math.min(1, v * 4));
  return out;
}
const HALO = 14;

// Colore del logo nel punto (x, y) del piano tangente (unita' del raggio), bilineare.
function sample(D, tx, ty, out) {
  const img = D.img, u = (tx / D.hw * 0.5 + 0.5) * (img.width - 1), v = (0.5 - ty / D.hh * 0.5) * (img.height - 1);
  if (u < 0 || v < 0 || u > img.width - 1 || v > img.height - 1) return 0;
  const x0 = Math.floor(u), y0 = Math.floor(v), x1 = Math.min(img.width - 1, x0 + 1), y1 = Math.min(img.height - 1, y0 + 1);
  const fx = u - x0, fy = v - y0, p = img.data, w = img.width;
  let a = 0;
  out[0] = out[1] = out[2] = 0;
  if (img.halo) { const H0 = img.halo; out.halo = H0[y0 * w + x0] * (1 - fx) * (1 - fy) + H0[y0 * w + x1] * fx * (1 - fy) + H0[y1 * w + x0] * (1 - fx) * fy + H0[y1 * w + x1] * fx * fy; }
  for (const [xx, yy, k] of [[x0, y0, (1 - fx) * (1 - fy)], [x1, y0, fx * (1 - fy)], [x0, y1, (1 - fx) * fy], [x1, y1, fx * fy]]) {
    const i = (yy * w + xx) * 4, al = p[i + 3] / 255 * k;
    out[0] += p[i] * al; out[1] += p[i + 1] * al; out[2] += p[i + 2] * al; a += al;
  }
  if (a > 1e-4) { out[0] /= a; out[1] /= a; out[2] /= a; }
  return a;
}

// Mappa dei colori della palla `kind` (BALL_LOOK.designs) con i loghi.
// maps: ImageData di ball-maps.png (rilievo e cuciture) o null.
function paint(W, H, design, decals, maps) {
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  const out = g.createImageData(W, H), px = out.data;
  const layers = prepare(design), base = hex(design.base);
  const sinT = new Float32Array(H), cosT = new Float32Array(H), sinP = new Float32Array(W), cosP = new Float32Array(W);
  for (let j = 0; j < H; j++) { const t = Math.PI * (j + 0.5) / H; sinT[j] = Math.sin(t); cosT[j] = Math.cos(t); }
  for (let i = 0; i < W; i++) { const p = 2 * Math.PI * (i + 0.5) / W - Math.PI; sinP[i] = Math.sin(p); cosP[i] = Math.cos(p); }
  const tmp = [0, 0, 0];
  const mw = maps ? maps.width : 0, mh = maps ? maps.height : 0, md = maps ? maps.data : null;
  for (let j = 0; j < H; j++) {
    const y = cosT[j];
    for (let i = 0; i < W; i++) {
      const x = sinT[j] * sinP[i], z = sinT[j] * cosP[i];
      let r = base[0], gg = base[1], b = base[2];
      for (const L of layers) {
        const k = layerAt(L, x, y, z) * (L.alpha ?? 1);
        if (k > 0) { r += (L.col[0] - r) * k; gg += (L.col[1] - gg) * k; b += (L.col[2] - b) * k; }
      }
      for (const D of decals) {
        const dc = D.c[0] * x + D.c[1] * y + D.c[2] * z;
        if (dc < D.lim) continue;
        const tx = (D.r[0] * x + D.r[1] * y + D.r[2] * z) / dc, ty = (D.u[0] * x + D.u[1] * y + D.u[2] * z) / dc;
        if (D.badge) {
          // fondo stampato sotto il logo: disco con un filo del colore del disegno
          const rr = Math.hypot(tx, ty) / Math.max(D.hw, D.hh), e = 0.004 / (BALL.radius);
          const disc = smooth(1.42 + e, 1.42 - e, rr);
          if (disc > 0) { r += (D.badge.fill[0] - r) * disc; gg += (D.badge.fill[1] - gg) * disc; b += (D.badge.fill[2] - b) * disc; }
          const ring = smooth(1.42 + e, 1.42, rr) * smooth(1.30 - e, 1.30, rr);
          if (ring > 0) { r += (D.badge.ring[0] - r) * ring; gg += (D.badge.ring[1] - gg) * ring; b += (D.badge.ring[2] - b) * ring; }
        }
        tmp.halo = 0;
        const a = sample(D, tx, ty, tmp);
        // sotto i loghi degli sponsor il colore di fondo, come stampato sopra il disegno
        if (!D.badge && tmp.halo > 0) { const hk = tmp.halo; r += (base[0] - r) * hk; gg += (base[1] - gg) * hk; b += (base[2] - b) * hk; }
        if (a <= 0) continue;
        const col = D.tint || tmp;
        r += (col[0] - r) * a; gg += (col[1] - gg) * a; b += (col[2] - b) * a;
      }
      // cuciture piu' scure, spicchi gonfi un poco piu' chiari al centro
      if (md) {
        const mi = (Math.min(mh - 1, Math.floor(j * mh / H)) * mw + Math.min(mw - 1, Math.floor(i * mw / W))) * 4;
        const seam = md[mi + 2] / 255, h = md[mi + 1] / 255;
        const f = (BALL_LOOK.seamDark + (1 - BALL_LOOK.seamDark) * seam) * (0.94 + 0.06 * h);
        r *= f; gg *= f; b *= f;
      }
      const o = (j * W + i) * 4;
      px[o] = r; px[o + 1] = gg; px[o + 2] = b; px[o + 3] = 255;
    }
  }
  g.putImageData(out, 0, 0);
  return c;
}

// Rilievo per il bumpMap: canale G di ball-maps nel rosso (three legge .r).
function bumpCanvas(maps) {
  const c = document.createElement('canvas');
  c.width = maps.width; c.height = maps.height;
  const g = c.getContext('2d'), out = g.createImageData(maps.width, maps.height), p = out.data, s = maps.data;
  for (let i = 0; i < p.length; i += 4) { p[i] = p[i + 1] = p[i + 2] = s[i + 1]; p[i + 3] = 255; }
  g.putImageData(out, 0, 0);
  return c;
}

// Geometria di riserva con la stessa mappatura di ball.glb (se manca il file).
function sphereGeometry(segs = 64, rings = 40) {
  const pos = [], uv = [], idx = [];
  for (let j = 0; j <= rings; j++) {
    const v = 1 - j / rings, t = Math.PI * (1 - v);
    for (let i = 0; i <= segs; i++) {
      const u = i / segs, p = 2 * Math.PI * u - Math.PI;
      pos.push(Math.sin(t) * Math.sin(p) * BALL.radius, Math.cos(t) * BALL.radius, Math.sin(t) * Math.cos(p) * BALL.radius);
      uv.push(u, v);
    }
  }
  for (let j = 0; j < rings; j++) for (let i = 0; i < segs; i++) {
    const a = j * (segs + 1) + i, b = a + 1, c = a + segs + 1, d = c + 1;
    if (j > 0) idx.push(a, c, b);
    if (j < rings - 1) idx.push(b, c, d);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

// Disegno della palla per la competizione: quello della competizione, la
// palla invernale (opts.winter) o la generica di riserva.
export function designFor(comp, winter) {
  const D = BALL_LOOK.designs;
  if (winter) return { key: 'inverno', ...D.inverno };
  const key = comp && D[comp.id] ? comp.id : 'generica';
  return { key, ...D[key] };
}

let shared = null;   // mesh, mappe e loghi degli sponsor: si caricano una volta

// Carica forma, mappe e loghi e prepara materiale e geometria della palla.
// comp: { id, name, logo } dalla partita (logo: URL dell'immagine che il gioco usa gia').
export async function loadBallLook({ comp = null, winter = false, size = 1024 } = {}) {
  if (!shared) {
    shared = (async () => {
      const [gltf, mapsImg, ...sp] = await Promise.all([
        new GLTFLoader().loadAsync(DIR + 'ball.glb').catch(() => null),
        loadImage(DIR + 'ball-maps.png'),
        ...BALL_LOOK.sponsors.map((s) => loadImage(DIR + 'sponsor/' + s.file))
      ]);
      let geometry = null;
      if (gltf) gltf.scene.traverse((o) => { if (!geometry && o.isMesh) geometry = o.geometry; });
      let maps = null;
      if (mapsImg) {
        const c = document.createElement('canvas');
        c.width = mapsImg.width; c.height = mapsImg.height;
        const g = c.getContext('2d', { willReadFrequently: true });
        g.drawImage(mapsImg, 0, 0);
        maps = g.getImageData(0, 0, c.width, c.height);
      }
      return { geometry: geometry || sphereGeometry(), fromModel: !!geometry, maps, sponsors: BALL_LOOK.sponsors.map((s, i) => logoData(sp[i], s.fromDark)) };
    })();
  }
  const S = await shared;
  const design = designFor(comp, winter);
  const decals = [];
  if (BALL_LOOK.logos) {
    const L = BALL_LOOK.layout;
    if (comp && comp.logo && design.key !== 'generica') {
      const img = logoData(await loadImage(comp.logo, true), false);
      if (img) for (const at of L.competition) decals.push(decal(img, at.at, at.cm, at.rot || 0, null, { fill: hex(design.badge || '#ffffff'), ring: hex(design.ink) }));
    }
    for (const at of L.sponsors) {
      const img = S.sponsors[at.sponsor];
      if (img) decals.push(decal(img, at.at, at.cm, at.rot || 0, BALL_LOOK.sponsors[at.sponsor].tint === 'ink' ? design.ink : BALL_LOOK.sponsors[at.sponsor].tint === 'light' ? design.light : null, null));
    }
  }
  const t0 = performance.now();
  const albedo = paint(size, size / 2, design, decals, S.maps);
  const map = new THREE.CanvasTexture(albedo);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 4;
  const mat = new THREE.MeshStandardMaterial({ map, roughness: BALL_LOOK.roughness, metalness: 0 });
  if (S.maps) {
    const bump = new THREE.CanvasTexture(bumpCanvas(S.maps));
    bump.colorSpace = THREE.NoColorSpace;
    mat.bumpMap = bump;
    mat.bumpScale = BALL_LOOK.bump;
  }
  return { geometry: S.geometry, material: mat, design: design.key, fromModel: S.fromModel, ms: Math.round(performance.now() - t0), canvas: albedo };
}
