import * as THREE from 'three';
import { TAPE } from './config.js';

// Replay di debug (skill match3d, "Stabilita' e test automatici"). Il nastro
// tiene in un buffer circolare gli ultimi TAPE.seconds di partita a TAPE.hz,
// fotogramma per fotogramma: posa di tutte le ossa, posizione e rotazione di
// corpi, palla e telecamera, clip attive con tempo e peso, stato dell'IA,
// gesto in corso, comando dell'utente ed eventi (fallo, tiro, parata,
// rimessa...). toJSON() lo esporta (main.saveTape, test di durata);
// fromJSON() lo ricarica per rigiocarlo (tools/match3d/replay-debug.mjs).

const Q = 32767;             // quaternioni delle ossa in interi a 16 bit
const BODY_N = 20;           // numeri per corpo e fotogramma (write)
const MAX_CLIPS = 6;         // clip del mixer registrate per corpo, le piu' pesanti
const BALL_N = 11;           // palla: posizione, quaternione, velocita', visibile
const CAM_N = 8;             // telecamera: posizione, quaternione, fov
const FRAME_N = 10;          // tempo, passo, fase, possesso, comandato, levetta, tasti

const r3 = (v) => Math.round(v * 1000) / 1000;

// Spazio per `size` fotogrammi di `n` corpi con `nb` ossa ciascuno.
class Track {
  constructor(n, nb, size) {
    this.n = n; this.nb = nb; this.size = size;
    this.quats = new Int16Array(size * n * nb * 4);
    this.body = new Float32Array(size * n * BODY_N);
    this.text = new Int32Array(size * n * 3);            // stato IA, azione, gesto (indici di strings)
    this.clips = new Float32Array(size * n * MAX_CLIPS * 3);
    this.ball = new Float32Array(size * BALL_N);
    this.cam = new Float32Array(size * CAM_N);
    this.frame = new Float32Array(size * FRAME_N);
  }
}

const _q = new THREE.Quaternion();

export class Tape {
  // `bodies`: tutti i Player in scena, anche l'arbitro e chi verra' espulso.
  constructor(m, bodies) {
    this.m = m;
    this.bodies = bodies;
    this.bones = bodies.map((p) => p.avatar.boneList);
    this.hips = bodies.map((p) => p.avatar.rig.Hips);
    this.boneNames = Object.keys(bodies[0].avatar.rig);
    this.nb = this.bones[0].length;
    this.hz = TAPE.hz;
    this.size = Math.round(TAPE.seconds * TAPE.hz);
    this.track = new Track(bodies.length, this.nb, this.size);
    this.strings = [''];
    this.ids = new Map([['', 0]]);
    this.events = [];
    this.clear();
  }

  clear() { this.count = 0; this.head = 0; this.acc = 0; this.since = 0; }

  get length() { return Math.min(this.count, this.size); }

  // Indice di un testo nella tabella delle stringhe.
  id(s) {
    s = s == null ? '' : String(s);
    let i = this.ids.get(s);
    if (i === undefined) { i = this.strings.length; this.strings.push(s); this.ids.set(s, i); }
    return i;
  }

  // Indice del corpo `p` nel nastro, -1 se non c'e'.
  who(p) { return p ? this.bodies.indexOf(p) : -1; }

  // Un fatto di gioco al fotogramma corrente: fallo, tiro, parata, rimessa...
  event(kind, data) {
    const e = { n: this.count, t: r3(this.m.poss.clock), kind };
    for (const k in data) {
      const v = data[k];
      e[k] = v && v.avatar ? this.who(v) : typeof v === 'number' ? r3(v) : v;
    }
    this.events.push(e);
    if (this.events.length > TAPE.events) this.events.shift();
  }

  // Da chiamare dopo il disegno dei corpi (pose finali), `dt` secondi di gioco.
  tick(dt) {
    const step = 1 / this.hz;
    this.acc += dt;
    this.since += dt;
    if (this.acc + 1e-6 < step) return;
    this.acc = this.acc - step > step ? 0 : Math.max(0, this.acc - step);
    // cambi di possesso (POSSEDUTA, IN_VOLO, LIBERA) con la loro causa
    const ps = this.m.poss;
    if (ps.seq !== this.seq) {
      this.seq = ps.seq;
      const l = ps.log[ps.log.length - 1];
      if (l) this.event('possesso', { stato: l.to, causa: l.cause });
    }
    this.write(this.track, this.head, this.since);
    this.since = 0;
    this.head = (this.head + 1) % this.size;
    this.count++;
  }

  // Fotogramma `k` del nastro in ordine (0 = il piu' vecchio) -> posto nel buffer.
  slot(k) { return (this.head - this.length + k + this.size) % this.size; }

  write(T, s, dt) {
    const m = this.m, n = this.bodies.length, nb = this.nb;
    let qi = s * n * nb * 4;
    const owner = m.owner, ctrl = m.ctrl;
    for (let i = 0; i < n; i++) {
      const p = this.bodies[i], av = p.avatar, o = av.object, h = this.hips[i].position;
      const b = (s * n + i) * BODY_N, B = T.body;
      B[b] = o.position.x; B[b + 1] = o.position.y; B[b + 2] = o.position.z;
      B[b + 3] = o.rotation.x; B[b + 4] = o.rotation.y; B[b + 5] = o.rotation.z;
      B[b + 6] = o.visible ? 1 : 0;
      B[b + 7] = h.x; B[b + 8] = h.y; B[b + 9] = h.z;
      B[b + 10] = p.anchor.x; B[b + 11] = p.anchor.z;
      B[b + 12] = p.pos.x; B[b + 13] = p.pos.z;
      B[b + 14] = p.heading; B[b + 15] = p.moveHeading;
      B[b + 16] = p.speed;
      B[b + 17] = (p.down ? 1 : 0) | (p.holding ? 2 : 0) | (p.keeperBusy ? 4 : 0) | (p.sentOff ? 8 : 0) | (p === ctrl ? 16 : 0) | (p === owner ? 32 : 0);
      B[b + 18] = av.lift;
      B[b + 19] = p.gait ? p.gait.speed : 0;
      for (const bone of this.bones[i]) {
        const r = bone.quaternion;
        T.quats[qi++] = r.x * Q; T.quats[qi++] = r.y * Q; T.quats[qi++] = r.z * Q; T.quats[qi++] = r.w * Q;
      }
      if (T === this.track) this.writeState(s, i, p);
    }
    const bm = m.ball.mesh, bv = m.ball.vel, c = s * BALL_N;
    T.ball.set([bm.position.x, bm.position.y, bm.position.z, bm.quaternion.x, bm.quaternion.y, bm.quaternion.z, bm.quaternion.w, bv.x, bv.y, bv.z, bm.visible ? 1 : 0], c);
    const cam = m.camera.cam;
    T.cam.set([cam.position.x, cam.position.y, cam.position.z, cam.quaternion.x, cam.quaternion.y, cam.quaternion.z, cam.quaternion.w, cam.fov], s * CAM_N);
    if (T !== this.track) return;
    const inp = m.lastInp, F = s * FRAME_N;
    const held = inp && inp.held ? Object.keys(inp.held).filter((k) => inp.held[k]).join('+') : '';
    const down = inp && inp.down ? Object.keys(inp.down).filter((k) => inp.down[k]).join('+') : '';
    T.frame.set([m.poss.clock, dt, this.id(m.phase), this.id(m.poss.describe()), this.who(ctrl),
      inp ? inp.x || 0 : 0, inp ? inp.z || 0 : 0, inp ? inp.mag || 0 : 0, this.id(held), this.id(down)], F);
  }

  // Testi e clip del mixer di un corpo: stato dell'IA, azione, gesto.
  writeState(s, i, p) {
    const T = this.track, n = this.bodies.length, a = p.action;
    const t = (s * n + i) * 3;
    T.text[t] = this.id(p.aiState);
    T.text[t + 1] = this.id(a ? Object.keys(a).filter((k) => a[k] === true).join('+') + (a.kind ? ' ' + a.kind : '') + (a.clip ? ' ' + a.clip : '') : '');
    T.text[t + 2] = this.id(p.avatar.gestureName());
    const mx = p.avatar.mixer, list = [];
    for (let k = 0; k < mx._nActiveActions; k++) {
      const x = mx._actions[k], w = x.getEffectiveWeight();
      if (w > 0.005) list.push([x.getClip().name, x.time, w]);
    }
    list.sort((u, v) => v[2] - u[2]);
    const c = (s * n + i) * MAX_CLIPS * 3;
    for (let k = 0; k < MAX_CLIPS; k++) {
      const e = list[k];
      T.clips[c + k * 3] = e ? this.id(e[0]) : -1;
      T.clips[c + k * 3 + 1] = e ? e[1] : 0;
      T.clips[c + k * 3 + 2] = e ? e[2] : 0;
    }
  }

  // Posa del fotogramma `k` (0 = il piu' vecchio) su corpi, palla e, se c'e', telecamera.
  apply(k, cam) { return this.put(this.track, this.slot(Math.max(0, Math.min(this.length - 1, k))), cam); }

  put(T, s, cam) {
    const m = this.m, n = this.bodies.length, nb = this.nb;
    let qi = s * n * nb * 4;
    for (let i = 0; i < n; i++) {
      const p = this.bodies[i], o = p.avatar.object, b = (s * n + i) * BODY_N, B = T.body;
      o.position.set(B[b], B[b + 1], B[b + 2]);
      o.rotation.set(B[b + 3], B[b + 4], B[b + 5]);
      o.visible = B[b + 6] > 0.5;
      this.hips[i].position.set(B[b + 7], B[b + 8], B[b + 9]);
      for (const bone of this.bones[i]) {
        bone.quaternion.set(T.quats[qi] / Q, T.quats[qi + 1] / Q, T.quats[qi + 2] / Q, T.quats[qi + 3] / Q).normalize();
        qi += 4;
      }
      if (p.shadow) { p.shadow.position.set(B[b + 10], 0.011, B[b + 11]); p.shadow.visible = o.visible; }
      o.updateMatrixWorld(true);
    }
    const bm = m.ball.mesh, c = s * BALL_N, A = T.ball;
    bm.position.set(A[c], A[c + 1], A[c + 2]);
    bm.quaternion.set(A[c + 3], A[c + 4], A[c + 5], A[c + 6]);
    bm.visible = A[c + 10] > 0.5;
    m.ball.shadow.position.set(A[c], 0.012, A[c + 2]);
    if (cam) {
      const C = T.cam, e = s * CAM_N;
      cam.position.set(C[e], C[e + 1], C[e + 2]);
      cam.quaternion.copy(_q.set(C[e + 3], C[e + 4], C[e + 5], C[e + 6]).normalize());
      if (Math.abs(cam.fov - C[e + 7]) > 1e-4) { cam.fov = C[e + 7]; cam.updateProjectionMatrix(); }
      cam.updateMatrixWorld(true);
    }
    return bm.position;
  }

  // Posa attuale di tutta la scena, da rimettere dopo aver rigiocato il nastro.
  snapshot() {
    const T = new Track(this.bodies.length, this.nb, 1);
    this.write(T, 0, 0);
    return T;
  }

  restore(T) { this.put(T, 0, this.m.camera.cam); }

  // Il nastro in un oggetto JSON: dati per corpo in ordine di tempo, pose in base64.
  toJSON(info = {}) {
    const len = this.length, n = this.bodies.length, nb = this.nb, T = this.track, m = this.m;
    const first = this.count - len;
    const bodies = this.bodies.map((p) => ({
      team: p.team || 'referee', number: p.number ?? null, name: p.name || '', keeper: !!p.keeper, referee: !p.team,
      obj: [], hips: [], anchor: [], pos: [], heading: [], moveHeading: [], speed: [], gaitSpeed: [], lift: [], flags: [],
      ai: [], action: [], gesture: [], clips: []
    }));
    const frames = { clock: [], dt: [], phase: [], poss: [], ctrl: [], input: [], held: [], down: [] };
    const ball = [], cam = [];
    const poses = new Int16Array(len * n * nb * 4);
    for (let k = 0; k < len; k++) {
      const s = this.slot(k);
      poses.set(T.quats.subarray(s * n * nb * 4, (s + 1) * n * nb * 4), k * n * nb * 4);
      for (let i = 0; i < n; i++) {
        const B = T.body, b = (s * n + i) * BODY_N, o = bodies[i], t = (s * n + i) * 3, c = (s * n + i) * MAX_CLIPS * 3;
        o.obj.push(r3(B[b]), r3(B[b + 1]), r3(B[b + 2]), r3(B[b + 3]), r3(B[b + 4]), r3(B[b + 5]), B[b + 6]);
        o.hips.push(r3(B[b + 7]), r3(B[b + 8]), r3(B[b + 9]));
        o.anchor.push(r3(B[b + 10]), r3(B[b + 11]));
        o.pos.push(r3(B[b + 12]), r3(B[b + 13]));
        o.heading.push(r3(B[b + 14])); o.moveHeading.push(r3(B[b + 15]));
        o.speed.push(r3(B[b + 16])); o.flags.push(B[b + 17]); o.lift.push(r3(B[b + 18])); o.gaitSpeed.push(r3(B[b + 19]));
        o.ai.push(T.text[t]); o.action.push(T.text[t + 1]); o.gesture.push(T.text[t + 2]);
        const cl = [];
        for (let j = 0; j < MAX_CLIPS; j++) {
          const id = T.clips[c + j * 3];
          if (id < 0) break;
          cl.push(id, r3(T.clips[c + j * 3 + 1]), r3(T.clips[c + j * 3 + 2]));
        }
        o.clips.push(cl);
      }
      const F = s * FRAME_N, fr = T.frame;
      frames.clock.push(r3(fr[F])); frames.dt.push(r3(fr[F + 1] * 1000) / 1000); frames.phase.push(fr[F + 2]); frames.poss.push(fr[F + 3]);
      frames.ctrl.push(fr[F + 4]); frames.input.push(r3(fr[F + 5]), r3(fr[F + 6]), r3(fr[F + 7])); frames.held.push(fr[F + 8]); frames.down.push(fr[F + 9]);
      const bc = s * BALL_N, bb = T.ball;
      for (let j = 0; j < BALL_N; j++) ball.push(r3(bb[bc + j]));
      const cc = s * CAM_N, ca = T.cam;
      for (let j = 0; j < CAM_N; j++) cam.push(r3(ca[cc + j]));
    }
    return {
      format: 'kfm27-match3d-tape', version: 1, saved: new Date().toISOString(),
      info, hz: this.hz, frames: len,
      match: { clock: m.rules ? m.rules.clockText() + ' ' + m.rules.half + 'T' : '', goals: { ...m.goals }, level: m.animLevel, auto: !!m.auto },
      bones: this.boneNames, strings: this.strings.slice(),
      bodies, frame: frames, ball, cam,
      events: this.events.filter((e) => e.n >= first).map((e) => ({ ...e, f: e.n - first, n: undefined })),
      poses: base64(poses)
    };
  }

  // Nastro salvato da rigiocare sui corpi di `m` (stesso ordine: casa, ospiti, arbitro).
  static fromJSON(m, json, bodies) {
    const tape = new Tape(m, bodies);
    const len = json.frames, n = Math.min(bodies.length, json.bodies.length), nb = tape.nb;
    if (json.bones.length !== nb) throw new Error('scheletro diverso: ' + json.bones.length + ' ossa nel nastro, ' + nb + ' nel modello');
    tape.size = len;
    tape.track = new Track(bodies.length, nb, len);
    const T = tape.track, poses = unbase64(json.poses, Int16Array), N = json.bodies.length;
    for (let k = 0; k < len; k++) {
      for (let i = 0; i < n; i++) {
        const o = json.bodies[i], b = (k * bodies.length + i) * BODY_N;
        for (let j = 0; j < 7; j++) T.body[b + j] = o.obj[k * 7 + j];
        for (let j = 0; j < 3; j++) T.body[b + 7 + j] = o.hips[k * 3 + j];
        T.body[b + 10] = o.anchor[k * 2]; T.body[b + 11] = o.anchor[k * 2 + 1];
        T.body[b + 12] = o.pos[k * 2]; T.body[b + 13] = o.pos[k * 2 + 1];
        T.body[b + 14] = o.heading[k]; T.body[b + 16] = o.speed[k];
        T.quats.set(poses.subarray((k * N + i) * nb * 4, (k * N + i + 1) * nb * 4), (k * bodies.length + i) * nb * 4);
      }
      for (let j = 0; j < BALL_N; j++) T.ball[k * BALL_N + j] = json.ball[k * BALL_N + j];
      for (let j = 0; j < CAM_N; j++) T.cam[k * CAM_N + j] = json.cam[k * CAM_N + j];
    }
    tape.count = len;
    tape.head = 0;
    return tape;
  }
}

function base64(arr) {
  const u8 = new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
  let s = '';
  for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
  return btoa(s);
}

function unbase64(str, Type) {
  const s = atob(str), u8 = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) u8[i] = s.charCodeAt(i);
  return new Type(u8.buffer);
}

// --- salvataggio dei file -----------------------------------------------------
// Chrome sul PC: la cartella scelta la prima volta (debug/replays del progetto)
// resta ricordata; app Capacitor: Documenti; altrimenti i Download.

const DB = 'kfm27-match3d', STORE = 'handles', KEY = 'replays';

function idb(mode, fn) {
  return new Promise((ok, ko) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onerror = () => ko(r.error);
    r.onsuccess = () => {
      const tx = r.result.transaction(STORE, mode), q = fn(tx.objectStore(STORE));
      tx.oncomplete = () => { r.result.close(); ok(q && q.result); };
      tx.onerror = () => { r.result.close(); ko(tx.error); };
    };
  });
}

// Cartella in cui scrivere, null se non si puo' (si scarica). Va chiamata per
// prima, dentro il gesto dell'utente (tasto, clic): il permesso lo chiede.
export async function replayFolder() {
  if (typeof window.showDirectoryPicker !== 'function') return null;
  try {
    let dir = await idb('readonly', (s) => s.get(KEY)).catch(() => null);
    if (dir && (await dir.queryPermission({ mode: 'readwrite' })) !== 'granted' && (await dir.requestPermission({ mode: 'readwrite' })) !== 'granted') dir = null;
    if (!dir) {
      dir = await window.showDirectoryPicker({ id: 'm3d-replays', mode: 'readwrite' });
      await idb('readwrite', (s) => s.put(dir, KEY)).catch(() => {});
    }
    return dir;
  } catch (e) {
    return null;                    // scelta annullata o non permessa
  }
}

// Scrive i file ({ name, blob }); restituisce dove sono finiti.
export async function saveReplayFiles(dir, files) {
  if (dir) {
    try {
      for (const f of files) {
        const h = await dir.getFileHandle(f.name, { create: true }), w = await h.createWritable();
        await w.write(f.blob);
        await w.close();
      }
      return dir.name;
    } catch (e) { /* permesso ritirato: si scarica */ }
  }
  const fs = window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform() && window.Capacitor.Plugins && window.Capacitor.Plugins.Filesystem;
  if (fs) {
    for (const f of files) {
      const data = base64(new Uint8Array(await f.blob.arrayBuffer()));
      await fs.writeFile({ path: 'kfm27-replays/' + f.name, data, directory: 'DOCUMENTS', recursive: true });
    }
    return 'Documenti/kfm27-replays';
  }
  for (const f of files) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(f.blob);
    a.download = f.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 60000);
  }
  return 'Download';
}
