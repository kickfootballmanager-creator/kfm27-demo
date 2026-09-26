// Tempo di caricamento e memoria della partita 3D per livello di animazioni.
//   node tools/match3d/load-bench.mjs [--levels high,medium,low] [--phone] [--runs 3] [--play 20]
// --phone: telefono di fascia media emulato (CPU 4 volte piu' lenta, schermo
// e user agent da telefono, come il profilo "mid-tier mobile" di Chrome).
// Misura: dal caricamento della pagina alla partita pronta, tempi dei
// pacchetti (download + lettura), memoria JS prima e dopo, e dopo --play
// secondi di gioco (IA contro IA) memoria e azioni attive nei mixer.

import { launch, evaluate, serve, sleep } from './cdp.mjs';

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : d; };
const LEVELS = opt('levels', 'high,medium,low').split(',');
const PHONE = args.includes('--phone');
const RUNS = +opt('runs', 3);
const PLAY = +opt('play', 20);

const mb = (b) => (b === null || b === undefined ? '-' : (b / 1048576).toFixed(1));

async function once(cdp, base, level) {
  await cdp.send('HeapProfiler.enable').catch(() => {});
  await cdp.send('HeapProfiler.collectGarbage').catch(() => {});
  const t0 = Date.now();
  await cdp.send('Page.navigate', { url: base + '?match3d=auto&anim=' + level });
  let ready = null;
  for (let i = 0; i < 600 && !ready; i++) {
    await sleep(50);
    ready = await evaluate(cdp, 'window.__m3d && window.__m3d.loadStats && window.__m3d.everyone ? true : null').catch(() => null);
  }
  const wall = Date.now() - t0;
  const st = await evaluate(cdp, `(() => { const m = window.__m3d; return { load: m.loadStats, packs: m.tpl.lib.stats.packs }; })()`);
  // gioco accelerato senza disegno, come il test di durata
  await evaluate(cdp, `(() => { const m = window.__m3d; cancelAnimationFrame(m.raf); m.frame = () => {}; m.controls.pollMenu = () => {}; m.controls.pad = null; m.controls._pollPad = () => null; m.onPad = m.onPadLost = () => {}; })()`);
  const frames = Math.round(PLAY * 60);
  const t1 = Date.now();
  await evaluate(cdp, `(() => { const m = window.__m3d; for (let i = 0; i < ${frames}; i++) m.advance(1 / 60); })()`);
  const stepMs = (Date.now() - t1) / frames;
  await cdp.send('HeapProfiler.collectGarbage').catch(() => {});
  const after = await evaluate(cdp, `(() => {
    const m = window.__m3d;
    let actions = 0, active = 0;
    for (const p of [...m.everyone, m.referee.p]) { actions += p.avatar.mixer._actions.length; active += p.avatar.mixer._nActiveActions; }
    return { heap: performance.memory ? performance.memory.usedJSHeapSize : null, actions, active, later: m.loadStats.laterMs || null,
      packs: Object.keys(m.tpl.lib.stats.packs), clips: m.tpl.lib.stats.clips, animBytes: m.tpl.lib.stats.bytes };
  })()`);
  const metrics = await cdp.send('Performance.getMetrics').catch(() => ({ metrics: [] }));
  const heapTotal = (metrics.metrics.find((x) => x.name === 'JSHeapTotalSize') || {}).value;
  return { wall, st, after, stepMs, heapTotal };
}

// Un Chrome nuovo per ogni prova: la memoria non si porta dietro la pagina di prima.
async function fresh(base, level) {
  const cdp = await launch({ width: PHONE ? 915 : 1280, height: PHONE ? 412 : 720 });
  try {
    await cdp.send('Performance.enable').catch(() => {});
    if (PHONE) {
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      await cdp.send('Emulation.setDeviceMetricsOverride', { width: 915, height: 412, deviceScaleFactor: 2.6, mobile: true });
      await cdp.send('Emulation.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36' });
      await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    }
    return await once(cdp, base, level);
  } finally {
    cdp.closeBrowser();
  }
}

async function main() {
  const srv = await serve();
  console.log((PHONE ? 'telefono emulato (CPU x4)' : 'PC') + ', ' + RUNS + ' prove per livello');
  const out = {};
  try {
    for (const level of LEVELS) {
      const rows = [];
      for (let r = 0; r < RUNS; r++) rows.push(await fresh(srv.url, level));
      const med = (f) => { const v = rows.map(f).filter((x) => x !== null && x !== undefined).sort((a, b) => a - b); return v.length ? v[Math.floor(v.length / 2)] : null; };
      const R = {
        level,
        pronta_ms: med((x) => x.wall),
        avvio_ms: med((x) => x.st.load.loadMs),
        pacchetti: Object.fromEntries(Object.keys(rows[0].st.packs).map((p) => [p, { clip: rows[0].st.packs[p].clips, MB: +(rows[0].st.packs[p].bytes / 1048576).toFixed(2), download_ms: med((x) => x.st.packs[p] && x.st.packs[p].download), lettura_ms: med((x) => x.st.packs[p] && x.st.packs[p].parse) }])),
        resto_ms: med((x) => x.after.later),
        clip_caricate: rows[0].after.clips,
        dati_animazioni_MB: +(rows[0].after.animBytes / 1048576).toFixed(2),
        heap_prima_MB: +mb(med((x) => x.st.load.heapBefore)),
        heap_dopo_MB: +mb(med((x) => x.st.load.heapAfter)),
        heap_in_gioco_MB: +mb(med((x) => x.after.heap)),
        azioni_nei_mixer: med((x) => x.after.actions),
        azioni_attive: med((x) => x.after.active),
        passo_fisica_ms: +med((x) => x.stepMs).toFixed(2)
      };
      out[level] = R;
      console.log(JSON.stringify(R));
    }
  } finally {
    srv.close();
  }
}

main().catch((e) => { console.error(e.stack || e); process.exit(1); });
