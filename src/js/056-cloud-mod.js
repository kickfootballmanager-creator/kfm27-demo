/* =====================================================================
   Account e salvataggi cloud: il pezzo che parla con il gioco.

   Non ridisegna la schermata di accesso: 051-au31-js.js ha gia' la sua,
   con le schede Accedi/Registrati e il bottone Google. Qui viene
   sostituito solo il motore dietro, lasciando intatto l'aspetto.

   Il salvataggio locale non viene ne' rimosso ne' sostituito. L'ordine
   e' sempre: prima il disco, poi il cloud. Se il cloud non risponde il
   gioco continua, e la scrittura viene ritentata al ritorno in linea.
   ===================================================================== */
import { SAVE_VERSION } from './services/firebase-config.js';
import * as A from './services/firebase-app.js';
import * as C from './services/cloud-saves.js';

var STATI = {
  local:   'Salvato localmente',
  sync:    'Sincronizzazione…',
  cloud:   'Salvato nel cloud',
  offline: 'Offline',
  fail:    'Sincronizzazione non riuscita'
};
var statoOra = null;

function esc(s){
  return String(s == null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* --- indicatore discreto, in basso a destra --- */
function segna(k, e){
  statoOra = k;
  var el = document.getElementById('cl-stato');
  if(!el){
    el = document.createElement('div');
    el.id = 'cl-stato'; el.className = 'cl-stato';
    document.body.appendChild(el);
  }
  el.className = 'cl-stato on s-' + k;
  el.innerHTML = '<i class="cl-punto"></i>' + esc(STATI[k] || k);
  if(k === 'fail' && e && window.console) console.warn('[KFM] cloud:', e);
  clearTimeout(segna._t);
  if(k === 'cloud' || k === 'local'){
    segna._t = setTimeout(function(){ el.classList.remove('on'); }, 2600);
  }
}
window.kfmCloudStato = function(){ return statoOra; };

/* --- ponte con l'interfaccia di 051 --------------------------------- */
function nomeDa(u){
  return (u && (u.displayName || (u.email || '').split('@')[0])) || 'manager';
}

window.kfmAuth = {
  attivo: true,
  /* 051 chiama questa al posto del suo controllo su kfm_accounts */
  submit: function(registra, dati, ok, ko){
    var p = registra
      ? A.registraEmail(dati.mail, dati.pass, dati.nome)
      : A.entraEmail(dati.mail, dati.pass);
    p.then(function(u){ ok(u, registra); }).catch(function(e){ ko(A.messaggio(e)); });
  },
  google: function(ok, ko){
    A.entraGoogle().then(function(u){ ok(u, false); }).catch(function(e){ ko(A.messaggio(e)); });
  },
  recupera: function(mail, ok, ko){
    A.recuperaPassword(mail).then(function(){ ok(); }).catch(function(e){ ko(A.messaggio(e)); });
  },
  reinvia: function(ok, ko){
    A.reinviaVerifica().then(function(){ ok(); }).catch(function(e){ ko(A.messaggio(e)); });
  },
  logout: function(){ A.esci().catch(function(){}); }
};

/* --- salvataggi ----------------------------------------------------- */
/* S in 002-db-utility.js e' dichiarato con let, quindi vive nell'ambito
   lessicale globale e NON sull'oggetto window: da un modulo va letto
   per nome, non come window.S. Lo stesso vale per EADB, che invece e'
   su window perche' lo assegna il loader. */
function stato(){
  try { return (typeof S !== 'undefined' && S) ? S : {}; } catch(e){ return {}; }
}
function metaDa(slot){
  var S = stato();
  return {
    saveName: (S.teamName || 'Carriera') + ' · slot ' + slot,
    managerId: (A.utenteOra() && A.utenteOra().uid) || null,
    managerName: S.coachName || null,
    teamId: (window.EADB && S.teamName && window.EADB[S.teamName] && window.EADB[S.teamName].tid) || null,
    teamName: S.teamName || null,
    currentSeason: S.season || null,
    currentDate: S.currentWeek || null,
    saveVersion: SAVE_VERSION
  };
}

/* chiamata da 051 subito dopo che il salvataggio locale e' riuscito */
window.kfmCloudPush = function(slot){
  var raw = null;
  try { raw = localStorage.getItem('mgr26save'); } catch(e){}
  if(!raw) return;
  if(!A.utenteOra()){ segna('local'); return; }
  /* Difesa: senza una carriera in corso non si tocca il cloud.
     Dopo un ricaricamento lo stato riparte vuoto, e il salvataggio
     automatico sovrascriveva la carriera buona con quella vuota. */
  var s = stato();
  if(!s.teamName || s.screen === 'title' || s.screen === 'choice'){ segna('local'); return; }
  /* anche senza rete si accoda: la coda e' quello che permette di
     riprovare da soli quando la connessione torna */
  C.accoda('slot-' + slot, raw, metaDa(slot), segna);
};

window.kfmCloudList = function(){ return C.elenco(); };
window.kfmCloudPull = function(slot){ return C.leggi('slot-' + slot); };

/* --- importazione delle carriere locali al primo accesso ------------ */
function slotLocali(mail){
  var out = [];
  for(var n=1;n<=5;n++){
    try{
      var raw = localStorage.getItem('kfm_slot_' + (mail || 'guest') + '_' + n);
      if(raw) out.push({ n: n, dati: JSON.parse(raw) });
    }catch(e){}
  }
  return out;
}

function chiedi(titolo, testo, bottoni){
  return new Promise(function(res){
    var ov = document.createElement('div');
    ov.className = 'cl-ov';
    ov.innerHTML = '<div class="cl-box"><div class="cl-tit">' + esc(titolo) + '</div>' +
      '<div class="cl-tx">' + testo + '</div><div class="cl-row"></div></div>';
    var riga = ov.querySelector('.cl-row');
    bottoni.forEach(function(b){
      var el = document.createElement('button');
      el.type = 'button';
      el.className = 'cl-btn' + (b.forte ? ' forte' : '');
      el.textContent = b.testo;
      el.onclick = function(){ ov.remove(); res(b.val); };
      riga.appendChild(el);
    });
    document.body.appendChild(ov);
  });
}

async function proponiImport(u){
  var locali = slotLocali(u.email || '').concat(slotLocali('guest'));
  if(!locali.length) return;
  var giaSu;
  try { giaSu = await C.elenco(); } catch(e){ return; }
  var presenti = {};
  giaSu.forEach(function(s){ presenti[s.saveId] = 1; });
  var daFare = locali.filter(function(l){ return !presenti['slot-' + l.n]; });
  if(!daFare.length) return;

  var elenco = daFare.map(function(l){
    var m = (l.dati && l.dati.meta) || {};
    return '<li>Slot ' + l.n + ' — <b>' + esc(m.team || 'Carriera') + '</b>' +
           (m.season ? ' · stagione ' + esc(m.season) : '') + '</li>';
  }).join('');
  /* se ha gia' detto di no per queste stesse carriere, non lo richiedo
     a ogni apertura */
  var firma = 'kfm_import_no_' + u.uid + '_' + daFare.map(function(l){ return l.n; }).join('');
  try{ if(localStorage.getItem(firma)) return; }catch(e){}

  var si = await chiedi('Importare i salvataggi locali nell’account?',
    'Su questo dispositivo ci sono ' + daFare.length + ' carriere non ancora nel tuo account:' +
    '<ul class="cl-el">' + elenco + '</ul>' +
    'Le copie locali restano dove sono: non viene cancellato nulla.',
    [{testo:'Non adesso', val:false}, {testo:'Importa', val:true, forte:true}]);
  if(!si){ try{ localStorage.setItem(firma,'1'); }catch(e){} return; }

  segna('sync');
  var fatte = 0, saltate = [];
  for(const l of daFare){
    try{
      if(!l.dati || !l.dati.raw) throw new Error('copia vuota');
      JSON.parse(l.dati.raw);          /* se e' rovinata si ferma qui */
      var m = (l.dati.meta) || {};
      await C.scrivi('slot-' + l.n, l.dati.raw, {
        saveName: (m.team || 'Carriera') + ' · slot ' + l.n,
        managerName: null, teamName: m.team || null,
        currentSeason: m.season || null, currentDate: m.week || null,
        saveVersion: SAVE_VERSION
      });
      fatte++;
    }catch(e){
      /* una copia rovinata non deve fermare le altre */
      saltate.push(l.n);
      if(window.console) console.warn('[KFM] slot ' + l.n + ' non importato:', e && e.message);
    }
  }
  segna(fatte ? 'cloud' : 'fail');
  if(saltate.length && typeof window.toast === 'function'){
    window.toast('Slot ' + saltate.join(', ') + ': copia locale illeggibile, non importata.');
  }
}

/* --- conflitto fra copia locale e copia cloud ----------------------- */
function quando(v){
  try{
    var d = v && v.toDate ? v.toDate() : (typeof v === 'number' ? new Date(v) : null);
    return d ? d.toLocaleString('it-IT') : 'data sconosciuta';
  }catch(e){ return 'data sconosciuta'; }
}
window.kfmCloudRisolvi = async function(slot){
  var id = 'slot-' + slot, loc = null, cloud = null;
  try{ loc = JSON.parse(localStorage.getItem('kfm_slot_' + (window.kfmMail || 'guest') + '_' + slot) || 'null'); }catch(e){}
  try{ cloud = await C.leggiMeta(id); }catch(e){ return 'local'; }
  if(!cloud || !loc) return cloud ? 'cloud' : 'local';
  /* La sola dimensione non basta: due copie diverse possono pesare
     uguale. Si confronta anche il momento dell'ultimo salvataggio, come
     dice updatedAt, con due secondi di tolleranza. */
  var tLoc = (loc.meta && loc.meta.at) || 0;
  var tCloud = 0;
  try{ tCloud = cloud.updatedAt && cloud.updatedAt.toMillis ? cloud.updatedAt.toMillis() : 0; }catch(e){}
  var pariPeso = loc.raw && cloud.bytes === loc.raw.length;
  var pariOra = tLoc && tCloud && Math.abs(tLoc - tCloud) < 2000;
  if(pariPeso && pariOra) return 'uguali';

  var scelta = await chiedi('Due versioni diverse della stessa carriera',
    '<div class="cl-cfr"><div><b>Copia locale</b><span>' + quando(loc.meta && loc.meta.at) + '</span></div>' +
    '<div><b>Copia nel cloud</b><span>' + quando(cloud.updatedAt) + '</span>' +
    '<span>versione ' + esc(cloud.saveVersion || '?') + '</span></div></div>' +
    'Quella che non scegli non viene cancellata: ne viene messa da parte una copia di sicurezza.',
    [{testo:'Usa copia locale', val:'local'}, {testo:'Usa copia cloud', val:'cloud', forte:true}]);

  /* copia di sicurezza di quella scartata, prima di toccare qualsiasi cosa */
  try{
    if(scelta === 'cloud' && loc){
      localStorage.setItem('kfm_backup_' + id + '_' + Date.now(), JSON.stringify(loc));
    } else if(scelta === 'local'){
      var c = await C.leggi(id);
      if(c) localStorage.setItem('kfm_backup_' + id + '_cloud_' + Date.now(), c.raw);
    }
  }catch(e){}
  return scelta;
};

/* --- stato di accesso: unica sorgente, onAuthStateChanged ----------- */
A.osserva(function(u){
  window.kfmUser = u || null;
  window.kfmMail = (u && u.email) || '';
  try{
    if(typeof window.auFirebaseStato === 'function') window.auFirebaseStato(u);
  }catch(e){}
  if(u){
    C.scriviProfilo(u).catch(function(){});
    proponiImport(u).catch(function(){});
    if(C.inAttesa()) C.svuotaTutto(segna);
  }
});

/* prima di chiudere la pagina, quello che e' in coda parte subito */
window.addEventListener('pagehide', function(){ try{ C.svuotaTutto(segna); }catch(e){} });
window.addEventListener('offline', function(){ if(C.inAttesa()) segna('offline'); });

try{ if(window.console) console.info('[KFM] account e salvataggi cloud pronti'); }catch(e){}
