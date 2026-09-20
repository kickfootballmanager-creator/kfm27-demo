/* =====================================================================
   Avvio di Firebase e autenticazione.

   L'SDK arriva dai moduli ESM ufficiali di Google: sono URL assoluti,
   quindi il gioco funziona uguale dalla radice o da /kfm27-demo/.
   Nessun bundler, nessun pacchetto npm caricato dal browser.

   onAuthStateChanged e' l'unica sorgente dello stato di accesso: il
   resto del gioco non deve mai dedurre da solo chi e' collegato.
   ===================================================================== */
import { FIREBASE_SDK, firebaseConfig } from './firebase-config.js';

const { initializeApp } = await import(`${FIREBASE_SDK}/firebase-app.js`);
const auth$ = await import(`${FIREBASE_SDK}/firebase-auth.js`);

const app = initializeApp(firebaseConfig);
const auth = auth$.getAuth(app);

/* La sessione sopravvive al refresh e alla chiusura del browser. */
try { await auth$.setPersistence(auth, auth$.browserLocalPersistence); } catch (e) {}

export { app, auth };

/* --- lettura dello stato --- */
export function utenteOra(){ return auth.currentUser || null; }
export function osserva(cb){ return auth$.onAuthStateChanged(auth, cb); }

/* --- accesso --- */
export async function entraGoogle(){
  const p = new auth$.GoogleAuthProvider();
  p.setCustomParameters({ prompt: 'select_account' });
  const r = await auth$.signInWithPopup(auth, p);
  return r.user;
}
export async function registraEmail(mail, password, nome){
  const r = await auth$.createUserWithEmailAndPassword(auth, mail, password);
  if (nome) { try { await auth$.updateProfile(r.user, { displayName: nome }); } catch (e) {} }
  try { await auth$.sendEmailVerification(r.user); } catch (e) {}
  return r.user;
}
export async function entraEmail(mail, password){
  const r = await auth$.signInWithEmailAndPassword(auth, mail, password);
  return r.user;
}
export async function reinviaVerifica(){
  const u = auth.currentUser;
  if (!u) throw new Error('nessun utente collegato');
  return auth$.sendEmailVerification(u);
}
export async function recuperaPassword(mail){
  return auth$.sendPasswordResetEmail(auth, mail);
}
export async function esci(){ return auth$.signOut(auth); }

/* --- messaggi leggibili al posto dei codici di Firebase --- */
const MESSAGGI = {
  'auth/invalid-email': 'Indirizzo email non valido.',
  'auth/missing-password': 'Inserisci la password.',
  'auth/weak-password': 'La password deve avere almeno 6 caratteri.',
  'auth/email-already-in-use': 'Esiste gia’ un account con questa email.',
  'auth/invalid-credential': 'Email o password non corretti.',
  'auth/wrong-password': 'Password errata, riprova.',
  'auth/user-not-found': 'Nessun account trovato con questa email.',
  'auth/too-many-requests': 'Troppi tentativi. Riprova fra qualche minuto.',
  'auth/popup-closed-by-user': 'Finestra di Google chiusa prima di completare l’accesso.',
  'auth/popup-blocked': 'Il browser ha bloccato la finestra di Google: consenti i popup e riprova.',
  'auth/cancelled-popup-request': 'Accesso annullato.',
  'auth/unauthorized-domain': 'Questo indirizzo non e’ fra i domini autorizzati del progetto Firebase.',
  'auth/network-request-failed': 'Nessuna connessione: controlla la rete e riprova.',
  'auth/operation-not-allowed': 'Questo metodo di accesso non e’ abilitato nella console Firebase.'
};
export function messaggio(e){
  const c = (e && (e.code || e.message)) || '';
  return MESSAGGI[c] || 'Non e’ stato possibile completare l’operazione. Riprova.';
}
