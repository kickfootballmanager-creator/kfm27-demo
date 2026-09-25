// Chrome headless pilotato con il protocollo DevTools, senza dipendenze
// (WebSocket di Node). Usato dal test di durata e dalle catture dei fotogrammi.

import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, existsSync, createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join, dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.glb': 'model/gltf-binary', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.woff2': 'font/woff2',
  '.woff': 'font/woff', '.ico': 'image/x-icon', '.mp3': 'audio/mpeg', '.wav': 'audio/wav'
};

// Server statico del progetto su una porta libera di 127.0.0.1 (conta come
// locale per MATCH3D_ENABLED), senza cache. Regge le decine di richieste
// parallele dei moduli meglio di python -m http.server.
export function serve() {
  const server = createServer((req, res) => {
    const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let file = resolve(ROOT, '.' + path);
    if (!file.startsWith(ROOT + sep) && file !== ROOT) { res.writeHead(403); res.end(); return; }
    try { if (statSync(file).isDirectory()) file = join(file, 'index.html'); } catch (e) { res.writeHead(404); res.end(); return; }
    if (!existsSync(file)) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': TYPES[extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    createReadStream(file).pipe(res);
  });
  return new Promise((ok) => server.listen(0, '127.0.0.1', () => {
    server.unref();
    ok({ url: 'http://127.0.0.1:' + server.address().port + '/', close: () => server.close() });
  }));
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
].find((p) => existsSync(p));

// Avvia Chrome con un profilo temporaneo; close() lo chiude e cancella il profilo.
export async function launch({ width = 1280, height = 720 } = {}) {
  if (!CHROME) throw new Error('Chrome non trovato');
  const port = 9300 + Math.floor(Math.random() * 500);
  const profile = mkdtempSync(join(tmpdir(), 'm3dsoak-'));
  const chrome = spawn(CHROME, [
    '--headless=new', '--remote-debugging-port=' + port, '--user-data-dir=' + profile,
    '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--mute-audio', '--no-first-run',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disk-cache-size=1',
    `--window-size=${width},${height}`, 'about:blank'
  ], { stdio: 'ignore' });
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    try { chrome.kill(); } catch (e) { /* gia' chiuso */ }
    // Chrome tiene aperti i file del profilo ancora per un attimo
    for (let i = 0; i < 20; i++) {
      try { rmSync(profile, { recursive: true, force: true }); break; } catch (e) { const t = Date.now(); while (Date.now() - t < 250); }
    }
  };
  process.on('exit', close);
  process.on('SIGINT', () => { close(); process.exit(130); });

  let ws = null;
  for (let i = 0; i < 80 && !ws; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' });
      if (r.ok) ws = (await r.json()).webSocketDebuggerUrl;
    } catch (e) { /* non ancora pronto */ }
    if (!ws) await sleep(250);
  }
  if (!ws) { close(); throw new Error('DevTools non risponde'); }
  const cdp = await connect(ws);
  await cdp.send('Runtime.enable');
  await cdp.send('Log.enable');
  await cdp.send('Network.enable');
  // python http.server non manda Cache-Control: senza questo Chrome terrebbe i moduli vecchi
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  await cdp.send('Page.enable');
  cdp.closeBrowser = () => { cdp.close(); close(); };
  return cdp;
}

function connect(url) {
  const ws = new WebSocket(url);
  let id = 0;
  const pending = new Map();
  const listeners = [];
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message)); else resolve(msg.result);
    } else if (msg.method) for (const f of listeners) f(msg);
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const i = ++id;
    pending.set(i, { resolve, reject });
    ws.send(JSON.stringify({ id: i, method, params }));
  });
  return new Promise((resolve, reject) => {
    ws.onopen = () => resolve({ send, on: (f) => listeners.push(f), close: () => ws.close() });
    ws.onerror = (e) => reject(e);
  });
}

// Espressione valutata nella pagina (anche asincrona), risultato per valore.
export async function evaluate(cdp, expression) {
  const r = await cdp.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) {
    const d = r.exceptionDetails;
    throw new Error((d.exception && d.exception.description) || d.text);
  }
  return r.result.value;
}

// Errori ed avvisi della pagina, raccolti in `list`.
export function collectErrors(cdp, list) {
  cdp.on((msg) => {
    if (msg.method === 'Runtime.exceptionThrown') {
      const d = msg.params.exceptionDetails;
      list.push('eccezione: ' + ((d.exception && d.exception.description) || d.text).split('\n')[0]);
    } else if (msg.method === 'Runtime.consoleAPICalled' && ['error', 'warning', 'assert'].includes(msg.params.type)) {
      list.push('console.' + msg.params.type + ': ' + msg.params.args.map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 300));
    } else if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') {
      list.push('log: ' + msg.params.entry.text.slice(0, 300) + (msg.params.entry.url ? ' ' + msg.params.entry.url : ''));
    }
  });
}

// Apre la partita di prova IA contro IA e aspetta che sia pronta.
export async function openMatch(cdp, base, errors) {
  await cdp.send('Page.navigate', { url: base + '?match3d=auto' });
  for (let i = 0; i < 240; i++) {
    await sleep(250);
    try { if (await evaluate(cdp, '!!(window.__m3d && window.__m3d.everyone && window.__m3d.rules)')) return; } catch (e) { /* pagina in caricamento */ }
  }
  throw new Error('la partita non parte: ' + errors.join(' | '));
}
