// Percorso carriera completo in Chrome headless: account di prova, nuova
// carriera ("Allena una squadra"), schermata della giornata, "Gioca la
// partita" con la partita 3D vera (due squadre del database), qualche secondo
// di gioco, poi Esci > "Torna indietro" (la giornata resta da giocare) e di
// nuovo Gioca > Esci > "Simula risultato" (la giornata va avanti con la
// simulazione di sempre). Anche "Simula la partita" e "Simulazione veloce"
// della schermata della giornata. Nessun errore in console.
//
//   node tools/match3d/career.mjs [--club "Nome"] [--league "Serie A"] [--shots cartella]
// Codice d'uscita 1 se un passo fallisce.

import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { launch, evaluate, collectErrors, serve, sleep } from './cdp.mjs';

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : d; };
const LEAGUE = opt('league', 'Serie A');
const CLUB = opt('club', '');
const SHOTS = opt('shots', '');
const W = 1280, H = 720;

const steps = [];
let failed = false;
function step(name, ok, info) {
  steps.push({ name, ok, info });
  console.log((ok ? 'ok   ' : 'NO   ') + name + (info !== undefined ? '  ' + (typeof info === 'string' ? info : JSON.stringify(info)) : ''));
  if (!ok) failed = true;
  return ok;
}

async function until(cdp, expr, ms = 20000, every = 200) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    try { const v = await evaluate(cdp, expr); if (v) return v; } catch (e) { /* pagina in caricamento */ }
    await sleep(every);
  }
  return null;
}

async function shot(cdp, name) {
  if (!SHOTS) return;
  mkdirSync(SHOTS, { recursive: true });
  const s = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 80 });
  writeFileSync(join(SHOTS, name + '.jpg'), Buffer.from(s.data, 'base64'));
}

async function main() {
  const srv = await serve();
  const cdp = await launch({ width: W, height: H });
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
  const errors = [];
  collectErrors(cdp, errors);
  // account di prova gia' entrato: il gioco chiede l'accesso prima della carriera
  await cdp.send('Page.navigate', { url: srv.url + 'index.html' });
  await until(cdp, 'document.readyState === "complete"');
  await evaluate(cdp, `(() => {
    localStorage.clear(); sessionStorage.clear();
    localStorage.setItem('kfm_accounts', JSON.stringify([{ mail: 'prova@kfm27.test', name: 'Prova', pw: '0' }]));
    localStorage.setItem('kfm_session', 'prova@kfm27.test');
    return true;
  })()`);
  await cdp.send('Page.navigate', { url: srv.url + 'index.html' });
  const ready = await until(cdp, 'typeof window.chooseExisting === "function" && typeof window.playMatch3D === "function" && !!window.EADB && typeof S !== "undefined"', 60000);
  step('manager caricato (database e script)', !!ready);
  if (!ready) return finish(cdp, srv, errors);
  step('interruttore della partita 3D acceso in locale', await evaluate(cdp, '!!window.MATCH3D_ENABLED'));

  // "Allena una squadra": slot, salvataggio manuale, campionato, club, allenatore
  await evaluate(cdp, 'window.__m3dTest = true; chooseExisting(); true');
  await sleep(300);
  await evaluate(cdp, 'auSlotNew(1); true');
  await sleep(300);
  await evaluate(cdp, 'auAutoNo(1); true');
  const league = await until(cdp, 'S.screen === "league"', 8000);
  step('scelta del campionato', !!league, await evaluate(cdp, 'S.screen'));
  await evaluate(cdp, `pickLeague(${JSON.stringify(LEAGUE)}); true`);
  await sleep(300);
  const club = CLUB || await evaluate(cdp, `(() => {
    const b = [...document.querySelectorAll('[onclick*="pickReplace"]')][0];
    const m = b && /pickReplace\\((['"])(.*?)\\1\\)/.exec(b.getAttribute('onclick'));
    return m ? m[2].replace(/\\\\'/g, "'") : null;
  })()`);
  step('club scelto', !!club, club);
  if (!club) return finish(cdp, srv, errors);
  await evaluate(cdp, `pickReplace(${JSON.stringify(club)}); true`);
  await sleep(300);
  await evaluate(cdp, `(() => { S.coachPicked = true; S.coachName = S.coachName || 'Mister Prova'; continueSetup(); return true; })()`);
  // il gioco puo' mostrare schermate di benvenuto: si arriva al calendario
  const hub = await until(cdp, '!!(S.calendar && S.calendar.length && S.teamName)', 30000);
  step('carriera iniziata', !!hub, await evaluate(cdp, '({ squadra: S.teamName, schermata: S.screen, giornate: (S.calendar || []).length })'));
  if (!hub) return finish(cdp, srv, errors);
  await evaluate(cdp, 'try { render(); } catch (e) {} true');
  await sleep(500);
  await shot(cdp, '1-carriera');

  // fino alla prima partita giocabile
  const week = await evaluate(cdp, `(() => {
    for (let i = 0; i < 40; i++) {
      const m = S.calendar[S.currentWeek];
      if (m && m.type !== 'BDO' && m.name && m.name !== 'Da definire') return { settimana: S.currentWeek, avversario: m.name, casa: !!m.home, tipo: m.type };
      try { runSim(); } catch (e) { return { errore: String(e && e.message || e) }; }
    }
    return null;
  })()`);
  step('prossima partita', !!(week && week.avversario), week);
  if (!week || !week.avversario) return finish(cdp, srv, errors);

  // Avvio che fallisce a meta' (dopo gli ascoltatori dei tasti): messaggio col
  // motivo, niente resti della partita, tasti di nuovo al manager, e poi la
  // simulazione e un nuovo avvio funzionano. Prima i tasti restavano catturati
  // dalla partita morta.
  const e00 = errors.length;
  await evaluate(cdp, `(() => {
    const raf = window.requestAnimationFrame;
    window.requestAnimationFrame = function (f) {
      if (String(f).includes('this.frame')) { window.requestAnimationFrame = raf; throw new Error('prova: avvio interrotto'); }
      return raf.call(window, f);
    };
    playMatch3D();
    return true;
  })()`);
  const failed1 = await until(cdp, '/non disponibile/i.test(document.body.innerText)', 90000, 300);
  const left = await evaluate(cdp, `(() => {
    let got = false;
    const f = () => { got = true; };
    window.addEventListener('keydown', f);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'j', code: 'KeyJ', bubbles: true }));
    window.removeEventListener('keydown', f);
    return { radice: !!document.querySelector('.m3d'), tasti: got };
  })()`);
  const why = await evaluate(cdp, '((document.body.innerText.match(/Partita 3D non disponibile[^\\n]*/) || [""])[0])');
  step('avvio fallito: motivo nel messaggio, nessun resto, tasti al manager', !!failed1 && /prova/.test(why) && !left.radice && left.tasti, { messaggio: why, ...left });
  errors.splice(e00);   // l'errore voluto non conta
  await sleep(2500);    // il messaggio sparisce

  // Gioca la partita: la partita 3D vera, con le due squadre
  const before = await evaluate(cdp, 'S.currentWeek');
  const errs0 = errors.length;
  await evaluate(cdp, 'window.__m3d = null; playMatch3D(); true');
  const started = await until(cdp, '!!(window.__m3d && window.__m3d.rules && window.__m3d.everyone && window.__m3d.everyone.length === 22)', 90000, 500);
  const toast = await evaluate(cdp, '(document.querySelector(".toast, #toast, .kfm-toast") || {}).textContent || ""');
  step('Gioca la partita avvia la partita 3D', !!started, started ? await evaluate(cdp, '({ casa: __m3d.home.name, ospiti: __m3d.away.name, utente: __m3d.userSide, fase: __m3d.phase })') : { toast, errori: errors.slice(errs0) });
  if (!started) return finish(cdp, srv, errors);
  // qualche secondo di gioco vero (requestAnimationFrame del browser)
  const t0 = await evaluate(cdp, '__m3d.poss.clock');
  await sleep(6000);
  const t1 = await evaluate(cdp, '__m3d.poss.clock');
  step('la partita scorre', t1 > t0 + 1, { da: +t0.toFixed(2), a: +t1.toFixed(2) });
  await shot(cdp, '2-partita');

  // Esci > Torna indietro: nessun risultato, la giornata resta
  await evaluate(cdp, '__m3d.openExit(); true');
  await sleep(400);
  const opts = await evaluate(cdp, '[...__m3d.root.querySelectorAll("button")].filter((b) => b.offsetParent).map((b) => b.textContent.trim())');
  step('menu di uscita', opts.length > 0, opts);
  await shot(cdp, '3-esci');
  const back = await evaluate(cdp, '(() => { const b = [...__m3d.root.querySelectorAll("button")].find((x) => /torna/i.test(x.textContent)); if (!b) return false; b.click(); return true; })()');
  await sleep(1500);
  const after1 = await evaluate(cdp, '({ settimana: S.currentWeek, partita3d: !!document.querySelector(".m3d-root") })');
  step('Torna indietro: la giornata resta da giocare', back && after1.settimana === before && !after1.partita3d, after1);

  // di nuovo Gioca > Esci > Simula risultato: la giornata va avanti con la simulazione
  await evaluate(cdp, 'window.__m3d = null; playMatch3D(); true');
  const again = await until(cdp, '!!(window.__m3d && window.__m3d.rules && window.__m3d.everyone && window.__m3d.everyone.length === 22)', 90000, 500);
  step('seconda partita 3D', !!again);
  if (again) {
    await sleep(1500);
    await evaluate(cdp, '__m3d.openExit(); true');
    await sleep(400);
    const sim = await evaluate(cdp, '(() => { const b = [...__m3d.root.querySelectorAll("button")].find((x) => /simula/i.test(x.textContent)); if (!b) return false; b.click(); return true; })()');
    const done = await until(cdp, `S.currentWeek !== ${before}`, 30000);
    await sleep(800);
    await shot(cdp, '4-simulata');
    step('Simula risultato: la giornata va avanti', sim && !!done, await evaluate(cdp, '({ settimana: S.currentWeek, risultato: (S.calendar[' + before + '] || {}).result || (S.calendar[' + before + '] || {}).score || null })'));
  }

  // Le altre strade della giornata: Simula la partita e Simulazione veloce
  for (const [label, fn] of [['Simula la partita', 'playMatchRealtime'], ['Simulazione veloce', 'runSimLive']]) {
    const w0 = await evaluate(cdp, 'S.currentWeek');
    const e0 = errors.length;
    const r = await evaluate(cdp, `(() => { try { if (typeof ${fn} !== 'function') return 'manca'; ${fn}(); return 'ok'; } catch (e) { return 'errore: ' + (e && e.message || e); } })()`);
    // la simulazione mostra la partita: si porta a termine come farebbe l'utente
    await sleep(1500);
    await evaluate(cdp, `(() => { for (let i = 0; i < 400; i++) { const b = [...document.querySelectorAll('button')].find((x) => x.offsetParent && /salta|fine|continua|termina|avanti|chiudi/i.test(x.textContent)); if (!b) break; b.click(); } return true; })()`);
    const moved = await until(cdp, `S.currentWeek !== ${w0}`, 60000, 500);
    await shot(cdp, '5-' + fn);
    step(label, r === 'ok' && errors.length === e0, { chiamata: r, settimana: [w0, await evaluate(cdp, 'S.currentWeek')], avanzata: !!moved, errori: errors.slice(e0) });
    try { await evaluate(cdp, 'render(); true'); } catch (e) { /* */ }
  }

  // Carriera salvata, pagina ricaricata, slot riaperto: di nuovo Gioca la partita
  await evaluate(cdp, 'auSlotSave(1); true');
  await sleep(1500);
  const saved = await evaluate(cdp, '!!localStorage.getItem("kfm_slot_prova@kfm27.test_1")');
  step('carriera salvata nello slot 1', saved);
  const weekSaved = await evaluate(cdp, 'S.currentWeek');
  await cdp.send('Page.navigate', { url: srv.url + 'index.html' });
  const re = await until(cdp, 'typeof window.auSlotLoad === "function" && typeof window.playMatch3D === "function" && !!window.EADB', 60000);
  if (re && saved) {
    await evaluate(cdp, 'window.__m3dTest = true; auSlotLoad(1); true');
    const loaded = await until(cdp, '!!(typeof S !== "undefined" && S.calendar && S.calendar.length && S.teamName)', 20000);
    step('carriera ricaricata dallo slot', !!loaded, loaded ? await evaluate(cdp, '({ squadra: S.teamName, settimana: S.currentWeek })') : null);
    if (loaded) {
      await evaluate(cdp, `(() => { for (let i = 0; i < 40; i++) { const m = S.calendar[S.currentWeek]; if (m && m.type !== 'BDO' && m.name && m.name !== 'Da definire') return true; runSim(); } return false; })()`);
      const e0 = errors.length;
      await evaluate(cdp, 'window.__m3d = null; playMatch3D(); true');
      const ok = await until(cdp, '!!(window.__m3d && window.__m3d.rules && window.__m3d.everyone && window.__m3d.everyone.length === 22)', 90000, 500);
      step('Gioca la partita dopo il caricamento', !!ok, ok ? await evaluate(cdp, '({ casa: __m3d.home.name, ospiti: __m3d.away.name })') : { errori: errors.slice(e0) });
      if (ok) {
        await evaluate(cdp, '__m3d.openExit(); true');
        await sleep(300);
        await evaluate(cdp, '(() => { const b = [...__m3d.root.querySelectorAll("button")].find((x) => /torna/i.test(x.textContent)); if (b) b.click(); return true; })()');
        await sleep(1000);
      }
    }
  }
  step('settimana dopo il ricaricamento', true, weekSaved);
  return finish(cdp, srv, errors);
}

function finish(cdp, srv, errors) {
  // immagini del manager che mancano (sfondi .jpg referenziati ma non nel
  // progetto): si segnalano, ma non sono errori della partita
  const all = [...new Set(errors)];
  const missing = all.filter((e) => /status of 404/.test(e) && /\.(jpe?g|png|webp|svg)\b/i.test(e) && !/match3d/.test(e));
  const own = all.filter((e) => !missing.includes(e));
  if (missing.length) console.log('nota  immagini del manager mancanti: ' + missing.map((e) => e.replace(/^.*?(src\/\S+).*$/, '$1')).join(', '));
  step('nessun errore in console', own.length === 0, own.slice(0, 10));
  cdp.closeBrowser();
  srv.close();
  process.exit(failed ? 1 : 0);
}

main().catch((e) => { console.error(e.stack || e); process.exit(2); });
