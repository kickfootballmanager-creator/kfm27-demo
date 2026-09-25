// Sonda di debug: gioca una partita IA contro IA e valuta un'espressione
// (file --hook) dopo soak-page.js; stampa window.__probe alla fine.
import { readFileSync } from 'node:fs';
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
await openMatch(cdp, BASE + (opt('query', '') ? '' : ''), errors);
await evaluate(cdp, readFileSync(join(HERE, 'soak-page.js'), 'utf8'));
await evaluate(cdp, 'window.__soak.init()');
await evaluate(cdp, readFileSync(opt('hook'), 'utf8'));
const secs = +opt('seconds', 200);
let st;
do { st = await evaluate(cdp, `window.__soak.run(900, ${secs})`); } while (!st.done);
console.log(JSON.stringify(await evaluate(cdp, 'window.__probe'), null, 1));
if (errors.length) console.log('errori', errors);
cdp.closeBrowser();
process.exit(0);
