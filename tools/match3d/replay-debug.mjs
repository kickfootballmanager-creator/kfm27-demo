// Rigioca in Chrome headless un replay di debug (JSON salvato con F9, dal menu
// di pausa o dal test di durata con --tapes) e produce fotogrammi, grafici e
// misure fotogramma per fotogramma. Punto di partenza di ogni correzione.
//
//   node tools/match3d/replay-debug.mjs --file debug/replays/m3d-....json [--list]
//        [--follow home:7|away:1|ref|N] [--view tv|follow|side|front|back|top]
//        [--from F] [--to F] [--every N] [--out cartella] [--size 960x540]
//        [--dist 6] [--height 1.6] [--sheet 6x4] [--no-frames]
//        [--cam x,y,z --look x,y,z]   telecamera fissa (stessa inquadratura prima e dopo)
//
// --list: solo eventi e picchi delle misure (scatti delle ossa, bacino lontano
// dall'anello, piedi che scivolano), per trovare chi e quando guardare.
// Senza --file prende il nastro piu' recente in debug/replays.
// Uscite in --out (di norma debug/replays/<nome>/): f_XXXX.jpg, chart.png,
// metrics.json, e sheet.jpg se c'e' ffmpeg.

import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { launch, evaluate, collectErrors, openMatch, serve } from './cdp.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : d; };
const flag = (n) => args.includes('--' + n);

function newest(dir) {
  if (!existsSync(dir)) return null;
  const list = readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => join(dir, f)).sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
  return list[0] || null;
}

const FILE = resolve(opt('file', '') || newest(join(ROOT, 'debug', 'replays')) || '');
if (!FILE || !existsSync(FILE)) { console.error('nastro non trovato: --file percorso.json'); process.exit(2); }
const NAME = basename(FILE).replace(/\.json$/, '');
const OUT = resolve(opt('out', join(dirname(FILE), NAME)));
const [W, H] = opt('size', '960x540').split('x').map(Number);
const FOLLOW = opt('follow', '');
const VIEW = opt('view', FOLLOW ? 'follow' : 'tv');
const EVERY = Math.max(1, +opt('every', 1));
const DIST = +opt('dist', 6), HEIGHT = +opt('height', 1.6);
const SHEET = opt('sheet', '');
const CAM = opt('cam', ''), LOOK = opt('look', '');
const FFMPEG = ['C:/ffmpeg-master-latest-win64-gpl/bin/ffmpeg.exe', '/usr/bin/ffmpeg'].find((p) => existsSync(p));

const page = `(() => {
  const m = window.__m3d;
  cancelAnimationFrame(m.raf);
  m.frame = () => {};
  m.controls.pollMenu = () => {};
  m.controls.pad = null;
  m.controls._pollPad = () => null;
  m.onPad = m.onPadLost = () => {};
  for (const el of m.root.children) if (el !== m.renderer.domElement) el.style.display = 'none';
  m.gfx.setLevel('medium', false);
  m.gfx.adapt = () => {};
  m.gfx.resize(${W}, ${H});
  m.camera.cam.aspect = ${W} / ${H};
  m.camera.cam.updateProjectionMatrix();
  const label = document.createElement('div');
  label.style.cssText = 'position:fixed;left:8px;top:8px;font:13px/1.35 Inter,Arial,sans-serif;color:#fff;background:rgba(10,17,28,.72);padding:8px 12px;border-radius:12px;white-space:pre;z-index:2147483647';
  document.body.appendChild(label);
  const R = window.__rd = {};
  const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  R.load = async (url) => {
    const T = await import(new URL('src/js/match3d/tape.js', location.href).href);
    R.rig = await import(new URL('src/js/match3d/rig.js', location.href).href);
    R.C = await import(new URL('src/js/match3d/config.js', location.href).href);
    const json = await (await fetch(url)).json();
    R.json = json;
    R.bodies = [...m.everyone, m.referee.p];
    R.tape = T.Tape.fromJSON(m, json, R.bodies);
    R.S = json.strings;
    return { frames: json.frames, hz: json.hz, match: json.match, info: json.info, events: json.events.length, bodies: json.bodies.map((b, i) => i + ':' + (b.referee ? 'arbitro' : b.team + ' ' + b.number + (b.keeper ? ' (portiere)' : ''))).join(', ') };
  };
  R.find = (spec) => {
    if (spec === '' || spec == null) return -1;
    if (/^\\d+$/.test(spec)) return +spec;
    if (spec === 'ref') return R.json.bodies.findIndex((b) => b.referee);
    const [team, num] = spec.split(':');
    return R.json.bodies.findIndex((b) => b.team === team && String(b.number) === num);
  };
  // Misure di ogni corpo a ogni fotogramma, sulle pose registrate (stesse regole del test di durata).
  R.metrics = () => {
    const J = R.json, n = J.frames, nb = R.bodies.length, out = [];
    const toeY = (m.tpl.gait.ground && m.tpl.gait.ground.toe) || 0.045, ankleY = (m.tpl.gait.ground && m.tpl.gait.ground.ankle) || 0.13;
    const prev = R.bodies.map(() => null);
    for (let i = 0; i < nb; i++) out.push({ hipsOff: [], hipsStep: [], boneStep: [], bone: [], toeL: [], toeR: [], skate: [], skateAvg: [], yawRate: [], hinge: [], twist: [], hand: [], wrist: [], armBad: [] });
    const hq = R.bodies[0].avatar.rig.Hips.quaternion.clone(), pq = hq.clone();
    for (let k = 0; k < n; k++) {
      R.tape.apply(k, null);
      for (let i = 0; i < nb; i++) {
        const p = R.bodies[i], r = p.avatar.rig, b = J.bodies[i], o = out[i];
        const he = r.Hips.matrixWorld.elements, ax = b.anchor[k * 2], az = b.anchor[k * 2 + 1];
        const ox = he[12] - ax, oz = he[14] - az;
        const P = prev[i];
        o.hipsOff.push(+(Math.hypot(ox, oz) * 100).toFixed(1));
        o.hipsStep.push(P ? +(Math.hypot(ox - P.ox, oz - P.oz) * 100).toFixed(2) : 0);
        let best = 0, which = '';
        const entries = Object.entries(r);
        const qs = P ? P.q : null, cur = [];
        r.Hips.getWorldQuaternion(hq);
        for (let j = 0; j < entries.length; j++) {
          const q = entries[j][1] === r.Hips ? hq : entries[j][1].quaternion;
          cur.push(q.x, q.y, q.z, q.w);
          if (qs) {
            const d = 2 * Math.acos(Math.min(1, Math.abs(q.x * qs[j * 4] + q.y * qs[j * 4 + 1] + q.z * qs[j * 4 + 2] + q.w * qs[j * 4 + 3])));
            if (d > best) { best = d; which = entries[j][0]; }
          }
        }
        o.boneStep.push(+best.toFixed(3)); o.bone.push(which);
        const t = (bn) => r[bn].matrixWorld.elements;
        const tl = t('LeftToeBase'), tr = t('RightToeBase'), fl = t('LeftFoot'), fr = t('RightFoot');
        o.toeL.push(+tl[13].toFixed(3)); o.toeR.push(+tr[13].toFixed(3));
        const left = tl[13] < tr[13], f = left ? tl : tr, heel = left ? fl : fr;
        let sk = 0;
        if (P && P.toe && f[13] < toeY + 0.015 && heel[13] < ankleY + 0.03 && P.side === left && Math.abs(f[13] - P.toe[1]) * 60 < 0.6) sk = Math.hypot(f[12] - P.toe[0], f[14] - P.toe[2]) * 60;
        o.skate.push(+sk.toFixed(2));
        // media come nel test di durata (soak-page: 0,2 a fotogramma)
        const ema = (P ? P.ema : 0) + (sk - (P ? P.ema : 0)) * 0.2;
        o.skateAvg.push(+ema.toFixed(2));
        o.yawRate.push(k ? +(wrap(b.heading[k] - b.heading[k - 1]) * J.hz).toFixed(2) : 0);
        // braccia: articolazioni oltre i limiti naturali (rig.armAngles, ANIM.armLimits)
        let hg = 0, tw = 0, hd = 0, wb = 0;
        for (const side of ['Left', 'Right']) {
          const g = R.rig.armAngles(r, side);
          if (g.flex > 25) hg = Math.max(hg, g.hinge);
          if (Math.abs(g.twist) > Math.abs(tw)) tw = g.twist;
          if (Math.abs(g.hand) > Math.abs(hd)) hd = g.hand;
          wb = Math.max(wb, g.wrist);
        }
        const AL = R.C.ANIM.armLimits;
        o.hinge.push(+hg.toFixed(1)); o.twist.push(+tw.toFixed(1)); o.hand.push(+hd.toFixed(1)); o.wrist.push(+wb.toFixed(1));
        o.armBad.push(+Math.max(0, hg - AL.hinge, Math.abs(tw) - AL.twist, Math.abs(hd) - AL.hand, wb - AL.wrist).toFixed(1));
        prev[i] = { ox, oz, q: cur, toe: [f[12], f[13], f[14]], side: left, ema };
      }
    }
    R.m = out;
    return out;
  };
  const text = (k, i) => {
    const J = R.json, S = R.S, b = i >= 0 ? J.bodies[i] : null;
    const ev = J.events.filter((e) => Math.abs(e.f - k) <= 6).map((e) => e.kind + (e.tipo ? ' ' + e.tipo : '') + (e.esito ? ' ' + e.esito : '')).join(', ');
    let s = 'fotogramma ' + k + '  ' + (J.frame.clock[k] - J.frame.clock[0]).toFixed(2) + ' s  ' + S[J.frame.phase[k]] + '  ' + S[J.frame.poss[k]];
    if (b) {
      const c = b.clips[k], list = [];
      for (let j = 0; j < c.length; j += 3) list.push(S[c[j]] + ' ' + c[j + 2].toFixed(2) + ' @' + c[j + 1].toFixed(2));
      s += '\\n' + (b.referee ? 'arbitro' : b.team + ' ' + b.number) + '  ' + b.speed[k].toFixed(2) + ' m/s  IA ' + (S[b.ai[k]] || '-') + '  azione ' + (S[b.action[k]] || '-');
      if (R.m) s += '\\nbacino ' + R.m[i].hipsOff[k] + ' cm  osso max ' + R.m[i].boneStep[k] + ' rad ' + R.m[i].bone[k] + '  scivola ' + R.m[i].skateAvg[k] + ' m/s' +
        '\\ngomito fuori cerniera ' + R.m[i].hinge[k] + '  avambraccio ' + R.m[i].twist[k] + '  mano ' + R.m[i].hand[k] + '  polso ' + R.m[i].wrist[k];
      s += '\\n' + list.join('\\n');
    }
    if (ev) s += '\\neventi: ' + ev;
    return s;
  };
  R.shot = (k, view, i, dist, height, fixed) => {
    const cam = m.camera.cam;
    const ball = R.tape.apply(k, view === 'tv' ? cam : null);
    if (fixed) {
      cam.fov = 40; cam.updateProjectionMatrix();
      cam.position.set(fixed[0], fixed[1], fixed[2]);
      cam.lookAt(fixed[3], fixed[4], fixed[5]);
    } else if (view !== 'tv') {
      const p = i >= 0 ? R.bodies[i] : null;
      const hp = p ? p.avatar.rig.Hips.getWorldPosition(p.avatar.object.position.clone()) : ball.clone();
      const h = i >= 0 ? R.json.bodies[i].heading[k] : 0;
      const fx = Math.sin(h), fz = Math.cos(h);
      cam.fov = 40; cam.updateProjectionMatrix();
      if (view === 'follow') cam.position.set(hp.x, height, hp.z + dist);
      else if (view === 'side') cam.position.set(hp.x + fz * dist, height, hp.z - fx * dist);
      else if (view === 'front') cam.position.set(hp.x + fx * dist, height, hp.z + fz * dist);
      else if (view === 'back') cam.position.set(hp.x - fx * dist, height, hp.z - fz * dist);
      else if (view === 'top') cam.position.set(hp.x, dist * 1.6, hp.z + 0.01);
      cam.lookAt(hp.x, p ? 0.85 : 0.4, hp.z);
    }
    m.gfx.update(0, ball);
    m.gfx.render();
    label.textContent = text(k, i);
    return label.textContent;
  };
  // Posizioni nel mondo di alcune ossa di un corpo e distanza dalla palla, fotogramma per fotogramma.
  R.bones = (from, to, i, names) => {
    const out = [], r = R.bodies[i].avatar.rig, v = R.bodies[i].avatar.object.position.clone();
    for (let k = from; k <= to; k++) {
      const ball = R.tape.apply(k, null).clone(), row = { k, ball: ball.toArray().map((x) => +x.toFixed(3)) };
      for (const n of names) { if (!r[n]) continue; r[n].getWorldPosition(v); row[n] = [...v.toArray().map((x) => +x.toFixed(3)), +v.distanceTo(ball).toFixed(3)]; }
      out.push(row);
    }
    return out;
  };
  // Grafico delle misure di un corpo (o del primo con un picco): pannelli impilati.
  R.chart = (i, from, to) => {
    const J = R.json, M = R.m[i], b = J.bodies[i], S = R.S;
    const cw = 1400, panels = [
      { key: 'velocita m/s', series: [[b.speed, '#dcb264'], [b.gaitSpeed, '#3fe08f']], lines: [] },
      { key: 'bacino-anello cm', series: [[M.hipsOff, '#dcb264'], [M.hipsStep.map((v) => v * 10), '#ff6b6b']], lines: [[10, 'soglia 10 cm'], [30, 'salto 3 cm (x10)']] },
      { key: 'osso piu\\' veloce rad/fotogramma', series: [[M.boneStep, '#3fe08f']], lines: [[0.35, 'picco 0,35'], [0.8, 'limite 0,8']], names: M.bone },
      { key: 'punte dei piedi m', series: [[M.toeL, '#7fb2ff'], [M.toeR, '#ff9f7f']], lines: [] },
      { key: 'piede appoggiato che scivola m/s (media)', series: [[M.skateAvg, '#ff6b6b']], lines: [[1.2, 'soglia 1,2']] },
      { key: 'rotazione del busto rad/s', series: [[M.yawRate, '#c9a0ff']], lines: [] },
      { key: 'braccia: gomito fuori cerniera, torsioni, polso (gradi)', series: [[M.hinge, '#3fe08f'], [M.twist, '#7fb2ff'], [M.hand, '#ff9f7f'], [M.wrist, '#dcb264']], lines: [[R.C.ANIM.armLimits.hinge, 'gomito'], [R.C.ANIM.armLimits.twist, 'avambraccio'], [R.C.ANIM.armLimits.hand, 'mano']] }
    ];
    const ph = 150, top = 40, ch = top + panels.length * (ph + 24) + 70;
    const c = document.createElement('canvas'); c.width = cw; c.height = ch;
    const g = c.getContext('2d');
    g.fillStyle = '#0a111c'; g.fillRect(0, 0, cw, ch);
    g.font = '16px Inter, Arial'; g.fillStyle = '#fff';
    g.fillText((b.referee ? 'arbitro' : b.team + ' ' + b.number + (b.keeper ? ' portiere' : '')) + '  fotogrammi ' + from + '-' + to + '  ' + (J.info && J.info.note ? J.info.note : ''), 16, 26);
    const L = 70, Rr = cw - 20, X = (k) => L + (k - from) / Math.max(1, to - from) * (Rr - L);
    panels.forEach((P, pi) => {
      const y0 = top + pi * (ph + 24) + 16;
      let lo = Infinity, hi = -Infinity;
      for (const [s] of P.series) for (let k = from; k <= to; k++) { lo = Math.min(lo, s[k]); hi = Math.max(hi, s[k]); }
      for (const [v] of P.lines) { if (v <= hi * 1.6) hi = Math.max(hi, v); }
      if (lo > 0) lo = 0;
      if (hi - lo < 1e-6) hi = lo + 1;
      const Y = (v) => y0 + ph - (v - lo) / (hi - lo) * ph;
      g.strokeStyle = 'rgba(255,255,255,.08)'; g.strokeRect(L, y0, Rr - L, ph);
      g.fillStyle = 'rgba(255,255,255,.72)'; g.font = '13px Inter, Arial';
      g.fillText(P.key, L, y0 - 4);
      g.fillText(hi.toFixed(2), 8, y0 + 10); g.fillText(lo.toFixed(2), 8, y0 + ph);
      for (const [v, name] of P.lines) {
        if (v > hi) continue;
        g.strokeStyle = 'rgba(255,255,255,.3)'; g.setLineDash([4, 4]); g.beginPath(); g.moveTo(L, Y(v)); g.lineTo(Rr, Y(v)); g.stroke(); g.setLineDash([]);
        g.fillText(name, Rr - 140, Y(v) - 3);
      }
      for (const e of J.events) if (e.f >= from && e.f <= to && e.kind !== 'possesso') { g.strokeStyle = 'rgba(220,178,100,.35)'; g.beginPath(); g.moveTo(X(e.f), y0); g.lineTo(X(e.f), y0 + ph); g.stroke(); }
      for (const [s, col] of P.series) {
        g.strokeStyle = col; g.lineWidth = 1.5; g.beginPath();
        for (let k = from; k <= to; k++) { const x = X(k), y = Y(s[k]); if (k === from) g.moveTo(x, y); else g.lineTo(x, y); }
        g.stroke();
      }
      if (P.names) {
        const s = P.series[0][0], marks = [];
        for (let k = from; k <= to; k++) if (s[k] > 0.3) marks.push(k);
        g.fillStyle = '#3fe08f';
        let last = -99;
        for (const k of marks) { if (k - last < 8) continue; last = k; g.fillText(P.names[k] + ' ' + s[k].toFixed(2), X(k) + 3, Y(s[k]) + 12); }
      }
    });
    // gesto in corso lungo l'asse dei tempi
    const yb = top + panels.length * (ph + 24) + 16;
    g.font = '12px Inter, Arial';
    let start = from, cur = b.gesture[from];
    for (let k = from + 1; k <= to + 1; k++) {
      if (k <= to && b.gesture[k] === cur) continue;
      if (cur) { g.fillStyle = 'rgba(63,224,143,.25)'; g.fillRect(X(start), yb, Math.max(1, X(k - 1) - X(start)), 18); g.fillStyle = '#fff'; g.fillText(S[cur], X(start) + 2, yb + 13); }
      start = k; cur = b.gesture[k];
    }
    g.fillStyle = 'rgba(255,255,255,.72)';
    for (const e of J.events) if (e.f >= from && e.f <= to && e.kind !== 'possesso') g.fillText(e.kind + (e.tipo ? ' ' + e.tipo : ''), X(e.f) + 2, yb + 36);
    for (let k = from; k <= to; k += Math.max(1, Math.round((to - from) / 10))) g.fillText(String(k), X(k) - 8, ch - 8);
    return c.toDataURL('image/png').split(',')[1];
  };
})()`;

async function main() {
  const srv = await serve();
  const cdp = await launch({ width: W, height: H });
  const errors = [];
  collectErrors(cdp, errors);
  await openMatch(cdp, srv.url, errors, '&anim=high');
  await evaluate(cdp, page);
  // il nastro passa dal server locale: deve stare dentro il progetto o lo si copia
  let url = FILE.startsWith(ROOT) ? FILE.slice(ROOT.length + 1).replace(/\\/g, '/') : null;
  if (!url) {
    mkdirSync(join(ROOT, 'debug', 'replays'), { recursive: true });
    const copy = join(ROOT, 'debug', 'replays', basename(FILE));
    writeFileSync(copy, readFileSync(FILE));
    url = 'debug/replays/' + basename(FILE);
  }
  const sum = await evaluate(cdp, `window.__rd.load(${JSON.stringify(encodeURI(url))})`);
  console.log(`${NAME}: ${sum.frames} fotogrammi a ${sum.hz} Hz, ${sum.match.clock}, ${sum.events} eventi${sum.info && sum.info.note ? ', ' + sum.info.note : ''}`);
  const J = JSON.parse(readFileSync(FILE, 'utf8'));
  const from = Math.max(0, +opt('from', 0)), to = Math.min(J.frames - 1, +opt('to', J.frames - 1));
  mkdirSync(OUT, { recursive: true });
  const M = await evaluate(cdp, 'window.__rd.metrics()');
  writeFileSync(join(OUT, 'metrics.json'), JSON.stringify({ file: FILE, bodies: J.bodies.map((b, i) => ({ who: b.referee ? 'arbitro' : b.team + ' ' + b.number, ...M[i] })) }));

  // eventi e picchi: chi e quando guardare
  const tag = (i) => (J.bodies[i] ? (J.bodies[i].referee ? 'arbitro' : J.bodies[i].team + ':' + J.bodies[i].number) : '-');
  console.log('\neventi:');
  for (const e of J.events) {
    if (e.kind === 'possesso' && !flag('all-events')) continue;
    const extra = Object.entries(e).filter(([k]) => !['f', 't', 'kind'].includes(k)).map(([k, v]) => k + '=' + (typeof v === 'number' && ['p', 'k', 'off', 'victim', 'a', 'su'].includes(k) ? tag(v) : v)).join(' ');
    console.log(`  f${String(e.f).padStart(4)}  ${e.kind}  ${extra}`);
  }
  const peaks = [];
  M.forEach((o, i) => {
    const top = (arr, k0) => { let b = -1, v = -Infinity; for (let k = Math.max(1, k0); k < arr.length; k++) if (arr[k] > v) { v = arr[k]; b = k; } return [v, b]; };
    const [bs, bf] = top(o.boneStep, 2), [ho, hf] = top(o.hipsOff, 0), [hs, sf] = top(o.hipsStep, 2), [sk, kf] = top(o.skateAvg, 2), [ab, af] = top(o.armBad, 0);
    peaks.push({ who: tag(i), i, bone: bs, boneAt: bf, boneName: o.bone[bf], hipsOff: ho, hipsAt: hf, hipsStep: hs, stepAt: sf, skate: sk, skateAt: kf, arm: ab, armAt: af });
  });
  console.log('\npicchi per corpo (osso rad/fotogramma, bacino cm, salto del bacino cm, scivolata media m/s, braccia oltre i limiti in gradi):');
  for (const p of peaks.sort((a, b) => b.bone - a.bone)) {
    console.log(`  ${String(p.i).padStart(2)} ${p.who.padEnd(10)} osso ${p.bone.toFixed(3)} f${p.boneAt} ${p.boneName.padEnd(14)} bacino ${p.hipsOff.toFixed(1).padStart(5)} f${p.hipsAt}  salto ${p.hipsStep.toFixed(2)} f${p.stepAt}  scivola ${p.skate.toFixed(2)} f${p.skateAt}  braccia ${p.arm.toFixed(1)} f${p.armAt}`);
  }
  if (flag('list')) { cdp.closeBrowser(); srv.close(); return; }
  // --bones home:1:LeftHand,RightHand: ossa nel mondo e distanza dalla palla (con --from/--to)
  if (opt('bones', '')) {
    const [t, n, list] = opt('bones').split(':');
    const i = await evaluate(cdp, `window.__rd.find(${JSON.stringify(t + ':' + n)})`);
    for (const row of await evaluate(cdp, `window.__rd.bones(${from}, ${to}, ${i}, ${JSON.stringify(list.split(','))})`)) console.log(JSON.stringify(row));
    cdp.closeBrowser(); srv.close(); return;
  }

  const who = FOLLOW ? await evaluate(cdp, `window.__rd.find(${JSON.stringify(FOLLOW)})`) : -1;
  if (FOLLOW && who < 0) throw new Error('corpo non trovato: ' + FOLLOW);
  const chartBody = who >= 0 ? who : peaks[0].i;
  writeFileSync(join(OUT, 'chart.png'), Buffer.from(await evaluate(cdp, `window.__rd.chart(${chartBody}, ${from}, ${to})`), 'base64'));
  console.log('\ngrafico: ' + join(OUT, 'chart.png') + ' (' + tag(chartBody) + ')');
  if (flag('no-frames')) { cdp.closeBrowser(); srv.close(); return; }
  const shots = [];
  for (let k = from; k <= to; k += EVERY) {
    const fixed = CAM && LOOK ? JSON.stringify([...CAM.split(',').map(Number), ...LOOK.split(',').map(Number)]) : 'null';
    await evaluate(cdp, `window.__rd.shot(${k}, ${JSON.stringify(VIEW)}, ${who}, ${DIST}, ${HEIGHT}, ${fixed})`);
    const s = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 82 });
    const f = join(OUT, 'f_' + String(k).padStart(4, '0') + '.jpg');
    writeFileSync(f, Buffer.from(s.data, 'base64'));
    shots.push(f);
  }
  console.log(shots.length + ' fotogrammi in ' + OUT);
  if (SHEET && FFMPEG && shots.length) {
    const [cols, rows] = SHEET.split('x').map(Number), n = cols * rows, stepN = Math.max(1, Math.ceil(shots.length / n));
    const list = join(OUT, 'sheet.txt');
    writeFileSync(list, shots.filter((_, j) => j % stepN === 0).slice(0, n).map((f) => `file '${f.replace(/\\/g, '/')}'`).join('\n'));
    execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-vf', `scale=480:-1,tile=${cols}x${rows}`, '-frames:v', '1', join(OUT, 'sheet.jpg')]);
    console.log('foglio: ' + join(OUT, 'sheet.jpg'));
  }
  if (errors.length) console.log('errori: ' + [...new Set(errors)].join(' | '));
  cdp.closeBrowser();
  srv.close();
}

main().then(() => process.exit(0), (e) => { console.error(e.stack || e); process.exit(2); });
