// Sonda di debug: gioca una partita IA contro IA e valuta un'espressione
// (file --hook) dopo soak-page.js; stampa window.__probe alla fine.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch, evaluate, collectErrors, openMatch, serve } from './cdp.mjs';
const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : d; };
const BASE = (await serve()).url;
const cdp = await launch();
const errors = [];
collectErrors(cdp, errors);
// --query '&anim=high': parametri in piu' per la partita (livello delle animazioni)
await openMatch(cdp, BASE, errors, opt('query', ''));
await evaluate(cdp, readFileSync(join(HERE, 'soak-page.js'), 'utf8'));
await evaluate(cdp, 'window.__soak.init()');
await evaluate(cdp, readFileSync(opt('hook'), 'utf8'));
const secs = +opt('seconds', 200);
// --tapes dir: replay di debug salvati dalla sonda (window.__soak.saveTape) o dalle violazioni
const TAPES = opt('tapes', '');
if (TAPES) { mkdirSync(TAPES, { recursive: true }); await evaluate(cdp, `window.__soak.tapeOn(${+opt('tape-max', 4)})`); }
const pull = async () => {
  if (!TAPES) return;
  for (const t of await evaluate(cdp, 'window.__soak.takeTapes()')) {
    const file = join(TAPES, 'probe-f' + t.frame + '-' + t.note.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) + '.json');
    writeFileSync(file, t.json);
    console.log('replay di debug: ' + file + ' (' + t.clock + ', ' + t.note + ')');
  }
};
let st;
do { st = await evaluate(cdp, `window.__soak.run(${+opt('chunk', 900)}, ${secs})`); await pull(); } while (!st.done);
console.log(JSON.stringify(await evaluate(cdp, 'window.__probe'), null, 1));
if (errors.length) console.log('errori', errors);
cdp.closeBrowser();
process.exit(0);
