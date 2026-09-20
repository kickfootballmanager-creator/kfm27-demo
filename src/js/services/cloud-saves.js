/* =====================================================================
   Salvataggi nel cloud, su Cloud Firestore.

   Un documento Firestore non puo' superare 1 MiB. Una carriera vera
   misura circa 537 kB, quindi ci starebbe, ma cresce di stagione in
   stagione. Percio' viene divisa nei punti dove la struttura si separa
   da sola, misurati sul formato reale:

     saves/{saveId}                  metadati, ~1 kB
     saves/{saveId}/chunks/competitions  ~390 kB  S.world
     saves/{saveId}/chunks/players        ~86 kB  differenza rose
     saves/{saveId}/chunks/transfers      ~31 kB  svincolati
     saves/{saveId}/chunks/calendar       ~10 kB
     saves/{saveId}/chunks/core           ~20 kB  tutto il resto

   L'uid non arriva mai dall'interfaccia: si legge da auth.currentUser.
   ===================================================================== */
import { FIREBASE_SDK, SAVE_VERSION } from './firebase-config.js';
import { app, auth } from './firebase-app.js';

const fs$ = await import(`${FIREBASE_SDK}/firebase-firestore.js`);
const db = fs$.getFirestore(app);
export { db };

const PEZZI = ['core', 'players', 'competitions', 'transfers', 'calendar'];

function uid(){
  const u = auth.currentUser;
  if (!u) throw new Error('nessun utente collegato');
  return u.uid;                    /* mai un uid passato da fuori */
}
function rifSalvataggio(saveId){ return fs$.doc(db, 'users', uid(), 'saves', saveId); }
function rifPezzo(saveId, nome){ return fs$.doc(db, 'users', uid(), 'saves', saveId, 'chunks', nome); }

/* --- divisione e ricomposizione ---------------------------------------
   Il salvataggio locale e' la stringa che sta in mgr26save: {v,S,EADBmod,
   EADBvia,baseId}. Qui si separa nei cinque pezzi e si rimette insieme
   nello stesso identico ordine, senza perdere nulla. */
export function dividi(raw){
  const b = JSON.parse(raw);
  const S = b.S || {};
  const core = {};
  for (const k in S) if (k !== 'world' && k !== 'freeAgents' && k !== 'calendar') core[k] = S[k];
  return {
    core:         { v: b.v, baseId: b.baseId || null, S: core },
    players:      { EADBmod: b.EADBmod || null, EADBvia: b.EADBvia || [] },
    competitions: { world: S.world || null },
    transfers:    { freeAgents: S.freeAgents || null },
    calendar:     { calendar: S.calendar || null }
  };
}
export function ricomponi(p){
  const core = (p.core && p.core.S) || {};
  const S = Object.assign({}, core);
  if (p.competitions && 'world' in p.competitions) S.world = p.competitions.world;
  if (p.transfers && 'freeAgents' in p.transfers) S.freeAgents = p.transfers.freeAgents;
  if (p.calendar && 'calendar' in p.calendar) S.calendar = p.calendar.calendar;
  return JSON.stringify({
    v: (p.core && p.core.v) || SAVE_VERSION,
    S: S,
    EADBmod: (p.players && p.players.EADBmod) || null,
    EADBvia: (p.players && p.players.EADBvia) || [],
    baseId: (p.core && p.core.baseId) || null
  });
}

/* --- profilo utente -------------------------------------------------- */
export async function scriviProfilo(u){
  if (!u) return;
  await fs$.setDoc(fs$.doc(db, 'users', u.uid), {
    uid: u.uid,
    email: u.email || null,
    displayName: u.displayName || null,
    emailVerified: !!u.emailVerified,
    provider: (u.providerData && u.providerData[0] && u.providerData[0].providerId) || 'password',
    lastSeenAt: fs$.serverTimestamp(),
    createdAt: fs$.serverTimestamp()
  }, { merge: true });
}

/* --- scrittura ------------------------------------------------------- */
export async function scrivi(saveId, raw, meta){
  const p = dividi(raw);
  const lotto = fs$.writeBatch(db);
  lotto.set(rifSalvataggio(saveId), Object.assign({
    saveId: saveId,
    uid: uid(),
    saveVersion: SAVE_VERSION,
    bytes: raw.length,
    updatedAt: fs$.serverTimestamp(),
    createdAt: fs$.serverTimestamp()
  }, meta || {}), { merge: true });
  for (const nome of PEZZI) lotto.set(rifPezzo(saveId, nome), { d: JSON.stringify(p[nome]) });
  await lotto.commit();
  return { saveId, bytes: raw.length };
}

/* --- lettura --------------------------------------------------------- */
export async function elenco(){
  const q = await fs$.getDocs(fs$.collection(db, 'users', uid(), 'saves'));
  const out = [];
  q.forEach(d => out.push(d.data()));
  out.sort((a, b) => String(a.saveId).localeCompare(String(b.saveId)));
  return out;
}
export async function leggiMeta(saveId){
  const d = await fs$.getDoc(rifSalvataggio(saveId));
  return d.exists() ? d.data() : null;
}
export async function leggi(saveId){
  const d = await fs$.getDoc(rifSalvataggio(saveId));
  if (!d.exists()) return null;
  const pezzi = {};
  for (const nome of PEZZI) {
    const c = await fs$.getDoc(rifPezzo(saveId, nome));
    pezzi[nome] = c.exists() ? JSON.parse(c.data().d || 'null') : null;
  }
  return { meta: d.data(), raw: ricomponi(pezzi) };
}
export async function cancella(saveId){
  const lotto = fs$.writeBatch(db);
  for (const nome of PEZZI) lotto.delete(rifPezzo(saveId, nome));
  lotto.delete(rifSalvataggio(saveId));
  await lotto.commit();
}

/* --- coda con attesa -------------------------------------------------
   Non si scrive a ogni minima variazione: le richieste ravvicinate sullo
   stesso slot si accorpano, e se la rete manca si riprova al ritorno. */
const ATTESA = 4000;
const timer = {}, inSospeso = {};
let riferiStato = null;

/* L'ascolto della rete si registra una volta sola, all'avvio del modulo:
   se lo si registrasse dentro accoda, restando offline non verrebbe mai
   registrato e al ritorno in linea non ripartirebbe nulla. */
window.addEventListener('online', function(){
  for (const k in inSospeso) svuota(k, riferiStato);
});

export function accoda(saveId, raw, meta, stato){
  riferiStato = stato || riferiStato;
  /* si accoda sempre, anche senza rete: e' proprio quello che permette
     di riprovare quando la connessione torna.
     L'uid viene fotografato adesso: se nel frattempo si cambia account,
     questa scrittura non deve finire sotto l'utente sbagliato. */
  inSospeso[saveId] = { raw, meta, uid: (auth.currentUser && auth.currentUser.uid) || null };
  if (stato) stato(navigator.onLine ? 'sync' : 'offline');
  clearTimeout(timer[saveId]);
  timer[saveId] = setTimeout(() => svuota(saveId, stato), ATTESA);
}
export function inAttesa(){ return Object.keys(inSospeso).length; }

async function svuota(saveId, stato){
  const v = inSospeso[saveId];
  if (!v) return;
  if (!navigator.onLine) { if (stato) stato('offline'); return; }
  if (!auth.currentUser) { delete inSospeso[saveId]; if (stato) stato('local'); return; }
  /* cambiato account fra l'accodamento e adesso: la scrittura si butta,
     non si appoggia all'utente sbagliato */
  if (v.uid && v.uid !== auth.currentUser.uid) { delete inSospeso[saveId]; return; }
  try {
    await scrivi(saveId, v.raw, v.meta);
    delete inSospeso[saveId];
    if (stato) stato('cloud');
  } catch (e) {
    if (stato) stato('fail', e);
  }
}
/* Scrive subito quello che e' in coda, senza aspettare. */
export async function svuotaTutto(stato){
  for (const k in inSospeso) { clearTimeout(timer[k]); await svuota(k, stato); }
}
