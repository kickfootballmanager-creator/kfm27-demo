// Fotografa le pose chiave del retargeting (pose-view.html + pose-view.mjs) in Chrome headless.
//   node tools/match3d/pose-shots.mjs --out cartella [--packs core,more]
// Scrive un PNG per posa e stampa altezze dei piedi e distanza palla-corpo.

import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { launch, evaluate, serve, sleep } from './cdp.mjs';

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : d; };
const OUT = opt('out', 'pose-shots');
const PACKS = opt('packs', 'core');

export const POSES = [
  { name: 'corsa', clip: '646_Sprint_01', t: 0.1, ball: null, view: 'side' },
  { name: 'tiro', clip: '512_Shoot_Stand_0', t: 'contact', ball: 'contact', view: 'front' },
  { name: 'tuffo', clip: '404_Keeper_Save_Left02_Medium_01', t: 'contact', ball: 'contact', view: 'front', dist: 4.2 },
  { name: 'scivolata', clip: '636_Slide_Tackles01', t: 'contact', ball: 'contact', view: 'side' },
  { name: 'testa', clip: '329_Jump_Head_0', t: 'contact', ball: 'contact', view: 'side' }
];

async function main() {
  mkdirSync(OUT, { recursive: true });
  const srv = await serve();
  const cdp = await launch({ width: 640, height: 800 });
  try {
    await cdp.send('Page.navigate', { url: srv.url + 'tools/match3d/pose-view.html?packs=' + PACKS });
    for (let i = 0; i < 120; i++) {
      await sleep(250);
      const st = await evaluate(cdp, '({ ok: !!window.__ready, err: window.__error || null })').catch(() => ({}));
      if (st.err) throw new Error(st.err);
      if (st.ok) break;
    }
    const pose = (p) => JSON.stringify(p);
    const list = opt('poses', '') ? JSON.parse(opt('poses', '')) : POSES;
    for (const p of list) {
      const info = await evaluate(cdp, 'window.__show(' + pose(p) + ')');
      await sleep(100);
      const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
      writeFileSync(join(OUT, p.name + '.png'), Buffer.from(shot.data, 'base64'));
      console.log(p.name.padEnd(10), p.clip, 't=' + (+info.t).toFixed(3), 'anca ' + info.hips.toFixed(3), 'piedi ' + info.feet.join('/'),
        info.ballGap !== null ? 'palla-corpo ' + info.ballGap : '', info.contact ? 'contatto ' + JSON.stringify(info.contact) : '');
    }
  } finally {
    cdp.closeBrowser();
    srv.close();
  }
}

main().catch((e) => { console.error(e.stack || e); process.exit(1); });
