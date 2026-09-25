// Test di durata della partita 3D: partite IA contro IA in Chrome headless,
// accelerate (nessun disegno), con gli invarianti controllati a ogni
// fotogramma da soak-page.js. Avvia da solo un server locale del progetto.
//
//   node tools/match3d/soak.mjs                 10 partite intere
//   node tools/match3d/soak.mjs --matches 2 --seconds 120
//   node tools/match3d/soak.mjs --parallel 3    tre Chrome insieme
//   node tools/match3d/soak.mjs --json report.json
//
// Esce con codice 1 se c'e' anche una sola violazione o un errore in console.

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch, evaluate, collectErrors, openMatch, serve } from './cdp.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf('--' + name); return i >= 0 ? args[i + 1] : def; };
const MATCHES = +opt('matches', 10);
const SECONDS = +opt('seconds', 0);            // 0: partita intera
const PARALLEL = Math.max(1, Math.min(MATCHES, +opt('parallel', 1)));
const URL_OPT = opt('url', '');   // vuoto: server interno su 127.0.0.1
const JSON_OUT = opt('json', '');
const CHUNK = 900;

// Obiettivi per partita, entrambe le squadre (skill match3d, "Difesa IA e disciplina").
const TARGETS = { slides: [4, 10], fouls: [18, 28], yellows: [2, 6], reds: [0, 0.2] };

const fmt = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(2));

async function main() {
  const BASE = URL_OPT || (await serve()).url;
  const page = readFileSync(join(HERE, 'soak-page.js'), 'utf8');
  const results = [];
  let next = 1, calibrated = false;

  // Un Chrome per lavoratore; ognuno prende la prossima partita da giocare.
  async function worker() {
    const cdp = await launch();
    const errors = [];
    collectErrors(cdp, errors);
    try {
      for (let k = next++; k <= MATCHES; k = next++) {
        errors.length = 0;
        const t0 = Date.now();
        await openMatch(cdp, BASE, errors);
        await evaluate(cdp, page);
        const init = await evaluate(cdp, 'window.__soak.init()');
        if (!calibrated) {
          calibrated = true;
          console.log('calibrazione: piede piu\' alto in appoggio ' + init.feetMax.toFixed(3) + ' m, anca ' + init.hipsRange.map((v) => v.toFixed(2)).join('-') + ' m' +
            (init.trackIssues.length ? ', clip senza tutte le ossa: ' + init.trackIssues.map((t) => t.clip).join(', ') : ''));
        }
        let st;
        do {
          st = await evaluate(cdp, `window.__soak.run(${CHUNK}, ${SECONDS || 0})`);
          if (PARALLEL === 1) process.stdout.write(`\rpartita ${k}/${MATCHES}  ${st.clock.padEnd(10)} ${st.goals.home}-${st.goals.away}  violazioni ${st.violations}   `);
        } while (!st.done);
        const rep = await evaluate(cdp, 'window.__soak.report()');
        rep.errors = [...new Set(errors)];
        rep.wall = (Date.now() - t0) / 1000;
        rep.match = k;
        results.push(rep);
        const nv = Object.values(rep.violations).reduce((s, v) => s + v.count, 0);
        const s = rep.stats;
        process.stdout.write(`\rpartita ${k}/${MATCHES}  ${rep.goals.home}-${rep.goals.away}  ${rep.seconds} s di gioco in ${rep.wall.toFixed(0)} s  violazioni ${nv}  errori ${rep.errors.length}` +
          `  | scivolate ${s.slides} falli ${s.fouls} gialli ${s.yellows} rossi ${s.reds}\n`);
      }
    } finally {
      cdp.closeBrowser();
    }
  }
  await Promise.all(Array.from({ length: PARALLEL }, () => worker()));
  results.sort((a, b) => a.match - b.match);

  // Riepilogo: violazioni per tipo con i primi esempi, statistiche medie.
  const all = {};
  for (const r of results) {
    for (const [kind, v] of Object.entries(r.violations)) {
      const a = all[kind] || (all[kind] = { count: 0, matches: 0, examples: [] });
      a.count += v.count; a.matches++;
      for (const e of v.examples) if (a.examples.length < 3) a.examples.push(e);
    }
    if (r.errors.length) {
      const a = all['errori in console'] || (all['errori in console'] = { count: 0, matches: 0, examples: [] });
      a.count += r.errors.length; a.matches++;
      for (const e of r.errors) if (a.examples.length < 5) a.examples.push(e);
    }
  }
  console.log('\n=== Invarianti ===');
  const kinds = Object.keys(all);
  if (!kinds.length) console.log('nessuna violazione in ' + results.length + ' partite');
  for (const kind of kinds.sort((a, b) => all[b].count - all[a].count)) {
    const a = all[kind];
    console.log(`\n[FALLITO] ${kind}: ${a.count} volte in ${a.matches}/${results.length} partite`);
    for (const e of a.examples) console.log('   ' + (typeof e === 'string' ? e : JSON.stringify(e)));
  }
  const n = results.length;
  const avg = (k) => results.reduce((s, r) => s + (r.stats[k] || 0), 0) / n;
  console.log('\n=== Statistiche medie per partita (' + n + ' partite) ===');
  const keys = [...new Set(results.flatMap((r) => Object.keys(r.stats)))];
  for (const k of keys) {
    const v = avg(k), t = TARGETS[k];
    const mark = t ? (v >= t[0] && v <= t[1] ? '  ok (obiettivo ' + t.join('-') + ')' : '  FUORI obiettivo ' + t.join('-')) : '';
    console.log('  ' + k.padEnd(18) + fmt(v).padStart(7) + mark);
  }
  // totali di tutte le partite per le tabelle per tipo (falli, scivolate)
  const tally = (field) => {
    const t = {};
    for (const r of results) for (const [k, v] of Object.entries(r[field] || {})) t[k] = (t[k] || 0) + v;
    return Object.entries(t).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + ' ' + v).join(', ');
  };
  if (tally('foulKinds')) console.log('\nfalli (tipo, provenienza, cartellino), totale: ' + tally('foulKinds'));
  if (tally('slideFrom')) console.log('scivolate rispetto al portatore, totale: ' + tally('slideFrom'));
  const gs = results.flatMap((r) => r.goalShots || []);
  if (gs.length) {
    const by = {};
    for (const g of gs) { const k = g.before + (g.dist < 12 ? ' <12m' : g.dist < 20 ? ' 12-20m' : ' >20m') + (g.between ? '' : ' solo davanti al portiere'); by[k] = (by[k] || 0) + 1; }
    console.log('gol per azione e distanza, totale: ' + Object.entries(by).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + ' ' + v).join(', '));
  }
  const run = {};
  for (const r of results) for (const [c, v] of Object.entries(r.runGestures)) run[c] = (run[c] || 0) + v;
  if (Object.keys(run).length) console.log('\ngesti partiti a oltre 3 m/s: ' + Object.entries(run).sort((a, b) => b[1] - a[1]).map(([c, v]) => c + ' ' + v).join(', '));
  if (JSON_OUT) writeFileSync(JSON_OUT, JSON.stringify({ results, violations: all }, null, 2));
  return kinds.length ? 1 : 0;
}

main().then((code) => process.exit(code), (e) => { console.error('\n' + (e.stack || e)); process.exit(2); });
