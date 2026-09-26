// Fotogrammi ravvicinati della partita IA contro IA, per guardare le
// animazioni a occhio (fluidita', piedi, transizioni). Avvia da solo un server locale del progetto.
//
//   node tools/match3d/capture.mjs --out cartella [--warm 20] [--seconds 6]
//        [--every 2] [--follow ball|home:7|away:1] [--dist 7] [--height 2]
//
// --warm: secondi di partita simulati prima (senza disegno); --every: un
// fotogramma ogni tanti passi di fisica (2 = 30 al secondo).

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { launch, evaluate, collectErrors, openMatch, serve } from './cdp.mjs';

const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf('--' + name); return i >= 0 ? args[i + 1] : def; };
const OUT = opt('out', 'capture');
const WARM = +opt('warm', 20);
const SECONDS = +opt('seconds', 6);
const EVERY = +opt('every', 2);
const FOLLOW = opt('follow', 'ball');
const DIST = +opt('dist', 7);
const HEIGHT = +opt('height', 2);
const URL_OPT = opt('url', '');   // vuoto: server interno su 127.0.0.1
const [W, H] = opt('size', '960x540').split('x').map(Number);
const QUALITY = opt('quality', 'medium');     // low | medium | high
const VIEW = opt('view', 'close');            // close: vicino a chi si segue; tv: telecamera della partita
const SET = opt('set', '');                   // es. KEEPER.alertDist=200: cambia una costante di config per la cattura
const UNTIL = opt('until', '');
const ANIM_LEVEL = opt('anim', 'high');         // livello delle animazioni: high | medium | low               // replay: si simula (fino a --warm secondi) finche' non parte il replay di un gol

const page = `(() => {
  const m = window.__m3d;
  cancelAnimationFrame(m.raf);
  m.frame = () => {};
  m.controls.pollMenu = () => {};
  // niente controller veri: un pad della macchina metterebbe in pausa la partita
  m.controls.pad = null;
  m.controls._pollPad = () => null;
  m.onPad = m.onPadLost = () => {};
  const DT = 1 / 60;
  const pick = (spec) => {
    if (spec === 'ball') return null;
    const [team, num] = spec.split(':');
    return m.teams[team].players.find((p) => String(p.number) === num) || null;
  };
  window.__cap = {
    warm(sec, until) { for (let i = 0; i < sec * 60 && m.phase !== 'end' && !(until === 'replay' && m.replay); i++) m.advance(DT); return m.rules.clockText() + (m.replay ? ' (replay)' : ''); },
    step(n, spec, dist, height) {
      for (let i = 0; i < n; i++) m.advance(DT);
      const p = pick(spec);
      const t = p ? p.mesh.position : m.ball.mesh.position;
      const cam = m.camera.cam;
      if (${JSON.stringify(VIEW)} === 'close') {
        cam.fov = 40; cam.updateProjectionMatrix();
        cam.position.set(t.x, height, t.z + dist);
        cam.lookAt(t.x, p ? 0.9 : 0.5, t.z);
      } else if (!m.replay) m.camera.update(m.ball, n / 60);   // durante il replay la telecamera e' la sua
      m.gfx.update(n / 60, m.ball.pos);
      m.gfx.render();
      const g = p ? p.gait : null;
      return { clock: m.rules.clockText(), phase: m.phase, replay: !!m.replay, speed: p ? +p.speed.toFixed(2) : 0,
        gesture: p && p.avatar.one ? p.avatar.one.a.getClip().name : null,
        weights: g ? Array.from(g.w).map((w) => +w.toFixed(2)) : null };
    }
  };
  // solo il campo: niente HUD sopra i giocatori
  for (const el of m.root.children) if (el !== m.renderer.domElement) el.style.display = 'none';
  m.gfx.setLevel(${JSON.stringify(QUALITY)}, false);
  m.gfx.adapt = () => {};                    // headless e' lento: niente discese automatiche
  m.gfx.resize(${W}, ${H});
  m.camera.cam.aspect = ${W} / ${H};
  m.camera.cam.updateProjectionMatrix();
})()`;

async function main() {
  mkdirSync(OUT, { recursive: true });
  const BASE = URL_OPT || (await serve()).url;
  const cdp = await launch({ width: W, height: H });
  const errors = [];
  collectErrors(cdp, errors);
  await openMatch(cdp, BASE, errors, '&anim=' + ANIM_LEVEL);
  if (SET) {
    const [path, value] = SET.split('=');
    const [group, key] = path.split('.');
    await evaluate(cdp, `import(new URL('src/js/match3d/config.js', location.href).href).then((c) => { c[${JSON.stringify(group)}][${JSON.stringify(key)}] = ${Number(value)}; })`);
  }
  await evaluate(cdp, page);
  await new Promise((r) => setTimeout(r, 1500));   // effetti di post-produzione caricati
  const at = await evaluate(cdp, `__cap.warm(${WARM}, ${JSON.stringify(UNTIL)})`);
  console.log('inizio cattura a ' + at);
  const log = [];
  const n = Math.round(SECONDS * 60 / EVERY);
  for (let i = 0; i < n; i++) {
    const info = await evaluate(cdp, `__cap.step(${EVERY}, ${JSON.stringify(FOLLOW)}, ${DIST}, ${HEIGHT})`);
    const shot = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 80 });
    writeFileSync(join(OUT, 'f_' + String(i + 1).padStart(4, '0') + '.jpg'), Buffer.from(shot.data, 'base64'));
    log.push(info);
  }
  writeFileSync(join(OUT, 'log.json'), JSON.stringify(log));
  if (errors.length) console.log('errori: ' + [...new Set(errors)].join(' | '));
  cdp.closeBrowser();
  console.log(n + ' fotogrammi in ' + OUT);
}

main().then(() => process.exit(0), (e) => { console.error(e.stack || e); process.exit(2); });
