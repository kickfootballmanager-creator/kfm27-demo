// Fotografie della palla nella partita vera (Chrome headless): per ogni
// disegno (ball-look.js) quattro primi piani, la palla girata di 90 gradi
// alla volta, e un'inquadratura dalla telecamera di gioco con la palla a
// centrocampo fra i giocatori. Serve a controllare spicchi, colori e loghi.
//
//   node tools/match3d/ball-shots.mjs [--out dir] [--designs serie-a,champions,premier,generica,inverno]
//        [--nologos] [--size 1100x620]

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { launch, evaluate, collectErrors, openMatch, serve } from './cdp.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : d; };
const OUT = resolve(opt('out', join(ROOT, 'debug', 'palle')));
const DESIGNS = opt('designs', 'serie-a,champions,premier,generica,inverno').split(',');
const [W, H] = opt('size', '1100x620').split('x').map(Number);
const FFMPEG = ['C:/ffmpeg-master-latest-win64-gpl/bin/ffmpeg.exe', '/usr/bin/ffmpeg'].find((p) => existsSync(p));
const COMP = {
  'serie-a': { id: 'serie-a', name: 'Serie A', logo: 'https://media.api-sports.io/football/leagues/135.png' },
  champions: { id: 'champions', name: 'Champions League', logo: 'https://media.api-sports.io/football/leagues/2.png' },
  premier: { id: 'premier', name: 'Premier League', logo: 'https://media.api-sports.io/football/leagues/39.png' },
  generica: null, inverno: null
};

const page = (nologos) => `(async () => {
  const m = window.__m3d;
  cancelAnimationFrame(m.raf);
  m.frame = () => {};
  for (const el of m.root.children) if (el !== m.renderer.domElement) el.style.display = 'none';
  m.gfx.setLevel('high', false);
  m.gfx.adapt = () => {};
  m.gfx.resize(${W}, ${H});
  m.camera.cam.aspect = ${W} / ${H};
  m.camera.cam.updateProjectionMatrix();
  const L = await import(new URL('src/js/match3d/ball-look.js', location.href).href);
  const C = await import(new URL('src/js/match3d/config.js', location.href).href);
  if (${nologos}) C.BALL_LOOK.logos = false;
  window.__bs = { L, C, fov0: m.camera.cam.fov };
  return true;
})()`;

async function main() {
  mkdirSync(OUT, { recursive: true });
  const srv = await serve();
  const cdp = await launch({ width: W, height: H });
  const errors = [];
  collectErrors(cdp, errors);
  await openMatch(cdp, srv.url, errors, '&anim=low');
  await evaluate(cdp, page(args.includes('--nologos')));
  const files = [];
  for (const d of DESIGNS) {
    const info = await evaluate(cdp, `(async () => {
      const m = window.__m3d, { L } = window.__bs;
      const look = await L.loadBallLook({ comp: ${JSON.stringify(COMP[d] || null)}, winter: ${d === 'inverno'}, size: 2048 });
      m.ball.setLook(look);
      return { design: look.design, fromModel: look.fromModel, ms: look.ms };
    })()`);
    console.log(d, JSON.stringify(info));
    // primi piani: la palla ferma a centrocampo, girata di 90 gradi alla volta
    for (let k = 0; k < 4; k++) {
      await evaluate(cdp, `(() => {
        const m = window.__m3d, b = m.ball, cam = m.camera.cam;
        for (const p of [...m.everyone, m.referee.p]) p.avatar.object.visible = false;
        b.mesh.position.set(0, 0.11, 0);
        b.mesh.quaternion.setFromAxisAngle({ x: 0, y: 1, z: 0, isVector3: true }, ${k} * Math.PI / 2);
        b.mesh.updateMatrixWorld(true);
        b.shadow.position.set(0, 0.012, 0);
        cam.fov = 16; cam.updateProjectionMatrix();
        cam.position.set(0, 0.32, 0.98);
        cam.lookAt(0, 0.11, 0);
        m.gfx.update(0, b.mesh.position);
        m.gfx.render();
        return true;
      })()`);
      const s = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 90 });
      const f = join(OUT, d + '-vicino-' + k + '.jpg');
      writeFileSync(f, Buffer.from(s.data, 'base64'));
      files.push(f);
    }
    // visuale di gioco: la telecamera della partita sulla palla fra i giocatori
    await evaluate(cdp, `(() => {
      const m = window.__m3d, b = m.ball, cam = m.camera.cam;
      for (const p of [...m.everyone, m.referee.p]) p.avatar.object.visible = true;
      b.pos.set(0, 0.11, 0);
      b.mesh.position.set(0, 0.11, 0);
      b.mesh.updateMatrixWorld(true);
      cam.fov = window.__bs.fov0; cam.updateProjectionMatrix();
      m.camera.snap(b);
      m.gfx.update(0, b.mesh.position);
      m.gfx.render();
      return true;
    })()`);
    const s = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 90 });
    const f = join(OUT, d + '-gioco.jpg');
    writeFileSync(f, Buffer.from(s.data, 'base64'));
    files.push(f);
  }
  if (FFMPEG) {
    for (const d of DESIGNS) {
      execFileSync(FFMPEG, ['-y', '-loglevel', 'error', ...[0, 1, 2, 3].flatMap((k) => ['-i', join(OUT, d + '-vicino-' + k + '.jpg')]),
        '-filter_complex', '[0][1][2][3]hstack=4,scale=2000:-1', join(OUT, d + '-vicino.jpg')]);
    }
  }
  console.log(files.length + ' immagini in ' + OUT);
  if (errors.length) console.log('errori: ' + [...new Set(errors)].join(' | '));
  cdp.closeBrowser();
  srv.close();
}

main().then(() => process.exit(0), (e) => { console.error(e.stack || e); process.exit(2); });
