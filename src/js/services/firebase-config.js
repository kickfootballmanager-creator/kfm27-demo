/* =====================================================================
   Configurazione Web di Firebase, in un posto solo.

   Questa non e' una credenziale amministrativa: e' la configurazione
   pubblica del client, pensata per stare nel frontend. Qui dentro non
   vanno MAI service account, chiavi amministrative, token GitHub,
   chiavi Sportmonks o API-Sports, password.

   La versione dell'SDK e' fissata di proposito: niente "latest", cosi'
   un aggiornamento di Google non puo' rompere il gioco pubblicato.
   ===================================================================== */

export const FIREBASE_SDK = 'https://www.gstatic.com/firebasejs/12.6.0';

export const firebaseConfig = {
  apiKey: 'AIzaSyB69A5xH8G4Cj1mzfRjWbn1EAkqO5cviKA',
  authDomain: 'kfm27-44a73.firebaseapp.com',
  projectId: 'kfm27-44a73',
  storageBucket: 'kfm27-44a73.firebasestorage.app',
  messagingSenderId: '330243428573',
  appId: '1:330243428573:web:0a95fb308869388a738b34',
  measurementId: 'G-S12QXYVJ05'
};

/* Versione del formato di salvataggio. La 4 e' quella introdotta con la
   differenza a indici sul database: se un giorno cambia il formato,
   questo numero permette di riconoscere i salvataggi vecchi. */
export const SAVE_VERSION = 4;
