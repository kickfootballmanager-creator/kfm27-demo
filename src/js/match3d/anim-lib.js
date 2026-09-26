import * as THREE from 'three';
import { ANIMLIB } from './config.js';

// Libreria delle animazioni Studio33 (skill match3d, "Libreria Studio33 Soccer 8").
// I pacchetti anims-*.glb (tools/match3d/studio33_build.py) hanno le clip gia'
// sullo scheletro del Calciatore, sul posto, con i metadati negli extras.
// Si leggono senza GLTFLoader: le tracce sono viste sul buffer binario, niente
// copie, e il JSON si libera subito. Il livello decide quali pacchetti:
// alto tutti all'avvio, medio l'essenziale all'avvio e il resto durante la
// partita, basso solo l'essenziale. Cambia solo la varieta' dei movimenti.

const url = (pack) => new URL('../../assets/match3d/anims-' + pack + '.glb', import.meta.url).href;

function parseGlb(buf) {
  const dv = new DataView(buf);
  if (dv.getUint32(0, true) !== 0x46546C67) throw new Error('anims: non e\' un GLB');
  const jl = dv.getUint32(12, true);
  const json = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 20, jl)));
  const bl = dv.getUint32(20 + jl, true);
  // solo i dati: il resto del file (JSON) non resta in memoria
  const bin = buf.slice(28 + jl, 28 + jl + bl);
  return { json, bin };
}

const COMPONENTS = { SCALAR: 1, VEC3: 3, VEC4: 4 };
const Q = 1 / 32767;
const unit = (q) => { const l = Math.hypot(q[0], q[1], q[2], q[3]) || 1; q[0] /= l; q[1] /= l; q[2] /= l; q[3] /= l; return q; };

// Rotazioni in interi a 16 bit (meta' memoria): l'interpolatore le legge
// cosi' come sono e le converte solo nei due fotogrammi che servono.
class Q16Interpolant extends THREE.Interpolant {
  constructor(times, values, size, result) {
    super(times, values, size, result);
    this.a = new Float32Array(4);
    this.b = new Float32Array(4);
  }

  // Gli interi a 16 bit non danno un quaternione di lunghezza 1 esatta: si
  // normalizza (altrimenti l'osso si scala appena e gli angoli misurati fra
  // due pose uguali non sono zero).
  copySampleValue_(index) {
    const r = this.resultBuffer, v = this.sampleValues, o = index * 4;
    for (let k = 0; k < 4; k++) r[k] = v[o + k] * Q;
    return unit(r);
  }

  interpolate_(i1, t0, t, t1) {
    const v = this.sampleValues, a = this.a, b = this.b, o = (i1 - 1) * 4;
    for (let k = 0; k < 4; k++) { a[k] = v[o + k] * Q; b[k] = v[o + 4 + k] * Q; }
    THREE.Quaternion.slerpFlat(this.resultBuffer, 0, unit(a), 0, unit(b), 0, (t - t0) / (t1 - t0));
    return this.resultBuffer;
  }
}

class Q16Track extends THREE.KeyframeTrack {
  InterpolantFactoryMethodLinear(result) {
    return new Q16Interpolant(this.times, this.values, this.getValueSize(), result);
  }
}
Q16Track.prototype.ValueTypeName = 'quaternion';
Q16Track.prototype.ValueBufferType = Int16Array;
Q16Track.prototype.DefaultInterpolation = THREE.InterpolateLinear;
Q16Track.prototype.InterpolantFactoryMethodSmooth = undefined;

// Array dei metadati salvati nel buffer ({'@': byte, n}) -> Float32Array.
function inflate(bin, v) {
  return v && typeof v === 'object' && '@' in v ? new Float32Array(bin, v['@'], v.n) : v;
}

function readPack(buf, pack) {
  const { json, bin } = parseGlb(buf);
  const acc = (i) => {
    const a = json.accessors[i], v = json.bufferViews[a.bufferView];
    const Type = a.componentType === 5122 ? Int16Array : Float32Array;
    return new Type(bin, (v.byteOffset || 0) + (a.byteOffset || 0), a.count * COMPONENTS[a.type]);
  };
  // stessi nomi che il GLTFLoader da' alle ossa di player.glb
  const names = json.nodes.map((n) => THREE.PropertyBinding.sanitizeNodeName(n.name || ''));
  const metas = (json.extras && json.extras.clips) || {};
  const out = [];
  for (const a of json.animations || []) {
    const tracks = [];
    for (const ch of a.channels) {
      const s = a.samplers[ch.sampler], node = names[ch.target.node];
      if (ch.target.path === 'rotation') {
        const v = acc(s.output);
        tracks.push(v instanceof Int16Array ? new Q16Track(node + '.quaternion', acc(s.input), v) : new THREE.QuaternionKeyframeTrack(node + '.quaternion', acc(s.input), v));
      }
      else if (ch.target.path === 'translation') tracks.push(new THREE.VectorKeyframeTrack(node + '.position', acc(s.input), acc(s.output)));
    }
    const m = metas[a.name] || {};
    for (const k of ['root', 'feet', 'palms']) m[k] = inflate(bin, m[k]);
    if (m.gait) m.gait.poses = inflate(bin, m.gait.poses);
    m.pack = pack;
    const clip = new THREE.AnimationClip(a.name, m.dur ?? -1, tracks);
    out.push({ name: a.name, clip, meta: m });
  }
  return { entries: out, bytes: bin.byteLength };
}

export class AnimLibrary {
  constructor() {
    this.entries = {};          // nome -> { name, clip, meta }
    this.byRole = {};           // ruolo -> [entry]
    this.stats = { packs: {}, bytes: 0, clips: 0 };
    this.pending = [];
    this.version = 0;           // cresce a ogni pacchetto arrivato
    this.scale = 1;             // metri della libreria -> metri del modello in scena
  }

  // Scarica e registra un pacchetto; i tempi finiscono in stats.
  async load(pack) {
    if (this.stats.packs[pack]) return this.stats.packs[pack];
    const t0 = performance.now();
    const res = await fetch(url(pack));
    if (!res.ok) throw new Error('anims: ' + pack + ' non trovato (' + res.status + ')');
    const buf = await res.arrayBuffer();
    const t1 = performance.now();
    const { entries, bytes } = readPack(buf, pack);
    for (const e of entries) this.add(e);
    const t2 = performance.now();
    const st = { clips: entries.length, bytes, download: +(t1 - t0).toFixed(1), parse: +(t2 - t1).toFixed(1) };
    this.stats.packs[pack] = st;
    this.stats.bytes += bytes;
    this.stats.clips += entries.length;
    this.version++;
    return st;
  }

  add(e) {
    this.entries[e.name] = e;
    const r = e.meta.role;
    (this.byRole[r] || (this.byRole[r] = [])).push(e);
  }

  // Pacchetti del livello: `start` prima della partita, `later` durante.
  async loadLevel(level) {
    const L = ANIMLIB.levels[level] || ANIMLIB.levels.low;
    for (const p of L.start) await this.load(p);
    this.later = L.later.slice();
    return this;
  }

  // Il resto in secondo piano (livello medio): un pacchetto alla volta.
  loadLater(onDone) {
    const next = () => {
      const p = this.later && this.later.shift();
      if (!p) return;
      this.load(p).then(() => { if (onDone) onDone(p); next(); }).catch((e) => console.warn('anims: ' + p + ' non caricato', e));
    };
    next();
  }

  get(name) { return this.entries[name] || null; }
  has(name) { return !!this.entries[name]; }
  role(r) { return this.byRole[r] || []; }
}
