/* =====================================================================
   Flusso "Scegli allenatore": riepilogo e griglia, sulla stessa scena.

   Non riscrive il ramo setupTeam di 002-db-utility.js: avvolge render()
   e sostituisce il contenuto di #app dopo la catena, come fa gia'
   034-kfm-campionati-js.js per la schermata campionati.

   Tutta la logica resta quella esistente:
     pickCoach(i)        sceglie l'allenatore e aggiorna lo stato
     pickCoachCustom()   nome scritto a mano
     uploadCoachFace(ev) foto caricata
     continueSetup()     vincolo dell'allenatore e instradamento
     handleLogoUpload()  logo del club nei modi senza squadra
   Lo stato S non cambia forma, quindi saveGame() continua a salvare
   l'allenatore da solo.
   ===================================================================== */
import { animate } from '../vendor/motion-es.js';

var DUR_TESTI = 0.28, ALZA_TESTI = 8;
var DUR_SCHEDE = 0.26, ALZA_SCHEDE = 12, PASSO_SCHEDE = 0.05;
var DUR_TESSERE = 0.24, ALZA_TESSERE = 6, FINE_TESSERE = 0.55;
var DUR_CAMBIO = 0.23, SPOSTA = 16;
var EASE = [0, 0, 0.58, 1];

var SAGOMA = 'src/assets/coach-sagoma.svg';
var ridotto = window.matchMedia('(prefers-reduced-motion: reduce)');
var chiave = null;

function attiva(){ return !ridotto.matches && typeof animate === 'function'; }

function esc(s){
  return String(s == null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* Il nome corto della tessera: via il nome di battesimo, ma le
   particelle restano attaccate al cognome.
   'Pep Guardiola' -> Guardiola, 'Erik ten Hag' -> ten Hag,
   'Roberto De Zerbi' -> De Zerbi, 'Gian Piero Gasperini' -> Gasperini */
var PARTICELLE = ['de','del','della','den','der','di','da','dos','van','von','ten','ter','la','le','mc','mac',"o'"];
function nomeCorto(intero){
  var t = String(intero || '').trim().split(/\s+/);
  if (t.length < 2) return t[0] || '';
  var resto = t.slice(1);
  while (resto.length > 1 && PARTICELLE.indexOf(resto[0].toLowerCase()) < 0) resto.shift();
  return resto.join(' ');
}

var FRECCIA = '<svg width="22" height="12" viewBox="0 0 22 12" fill="none" aria-hidden="true">' +
  '<path d="M0 6h20M15 1l5 5-5 5" stroke="currentColor" stroke-width="1.4" fill="none"/></svg>';
var CHEVRON = '<svg width="8" height="13" viewBox="0 0 8 13" fill="none" aria-hidden="true">' +
  '<path d="M6.5 1.5 1.5 6.5l5 5" stroke="currentColor" stroke-width="1.4" stroke-linecap="square"/></svg>';

/* --- sottostato: fuori da S, cosi' non entra nel salvataggio --- */
window.__coachGriglia = false;
window.coachApriGriglia = function(){ window.__coachGriglia = true; render(); };
window.coachChiudiGriglia = function(){ window.__coachGriglia = false; render(); };

/* --- colonna sinistra, uguale nei due stati --- */
function sinistra(indietro){
  return '<div class="co-left">' +
    '<img class="co-logo" src="src/assets/logo.png" alt="KFM27">' +
    '<div class="co-intro">' +
      '<div class="co-eyebrow">Inizia il tuo percorso</div>' +
      '<h1 class="co-title"><span class="co-t1">Scegli il tuo</span><span class="co-t2">Allenatore</span></h1>' +
      '<p class="co-desc">Ogni grande squadra ha una visione.<br>' +
        'Scegli l\'allenatore che guider&agrave; il tuo club<br>verso la gloria.</p>' +
      '<button type="button" class="co-back" onclick="' + indietro + '">' + CHEVRON + 'Indietro</button>' +
    '</div></div>';
}

/* --- scheda allenatore del riepilogo --- */
function schedaCoach(){
  var scelto = !!S.coachPicked && S.coachName && S.coachName !== 'Mister';
  var foto = scelto ? (S.coachFace || coachAvatar(S.coachName)) : SAGOMA;
  var testo = scelto
    ? '<span class="co-card-meta">' + esc(S.coachNat || '') + '</span>'
    : '<span class="co-card-d">Inizia la tua carriera con un allenatore personalizzabile ' +
      'e fai crescere la tua squadra nel tempo.</span>';
  return '<button type="button" class="co-card' + (scelto ? ' is-on' : '') + '" onclick="coachApriGriglia()">' +
    '<span class="co-card-img"><img src="' + esc(foto) + '" alt="" ' +
      'onerror="this.onerror=null;this.src=\'' + SAGOMA + '\'"></span>' +
    '<span class="co-card-txt">' +
      '<span class="co-card-t">' + (scelto ? esc(S.coachName) : 'Nessun allenatore scelto') + '</span>' +
      testo +
    '</span>' +
    '<span class="co-arrow">' + FRECCIA + '</span></button>';
}

/* --- seconda scheda: la squadra scelta, oppure il club da creare --- */
function schedaClub(){
  if (S.setupMode === 'existing'){
    var nome = S.teamName || '';
    var lega = S.pendingLeague || '';
    var forza = (typeof EADB !== 'undefined' && EADB[nome] && EADB[nome].str) || '';
    var meta = [lega, forza ? ('Forza ' + forza) : ''].filter(Boolean).join(' · ');
    return '<button type="button" class="co-card is-on" onclick="S.screen=\'replace\';render()">' +
      '<span class="co-card-img"><img src="' + esc(S.userLogo || '') + '" alt="" ' +
        'onerror="this.onerror=null;this.src=\'' + SAGOMA + '\'"></span>' +
      '<span class="co-card-txt">' +
        '<span class="co-card-t">' + esc(nome) + '</span>' +
        (meta ? '<span class="co-card-meta">' + esc(meta) + '</span>' : '') +
      '</span>' +
      '<span class="co-arrow">' + FRECCIA + '</span></button>';
  }
  /* draft e squadra da zero: qui il club non esiste ancora, si crea.
     L'input tiene id="tn" perche' continueSetup() legge proprio quello. */
  return '<div class="co-card">' +
    '<span class="co-card-img"><img src="' + esc(S.userLogo || SAGOMA) + '" alt="" ' +
      'onerror="this.onerror=null;this.src=\'' + SAGOMA + '\'"></span>' +
    '<span class="co-card-txt co-club-form">' +
      '<span class="co-card-t">Il tuo club</span>' +
      '<input id="tn" class="co-club-in" maxlength="24" placeholder="Nome del club" value="' +
        esc(S.teamName || '') + '">' +
      '<label class="co-club-up">Carica logo' +
        '<input type="file" id="logoUpload" accept="image/*" style="display:none" ' +
        'onchange="handleLogoUpload(event)"></label>' +
    '</span></div>';
}

function statoRiepilogo(){
  return '<div class="co-right">' +
    '<div class="co-head"><span>Seleziona allenatore</span><i class="co-rule"></i></div>' +
    '<div class="co-somma">' +
      schedaCoach() +
      schedaClub() +
      '<button type="button" class="co-cta" onclick="continueSetup()"' +
        (S.coachPicked ? '' : ' disabled') + '>Continua ' + FRECCIA + '</button>' +
    '</div></div>';
}

function statoGriglia(){
  var tessere = COACHES.map(function(c, i){
    var scelto = S.coachPicked && S.coachName === c.n;
    return '<button type="button" class="co-tile" aria-pressed="' + (scelto ? 'true' : 'false') +
      '" title="' + esc(c.n) + '" onclick="pickCoach(' + i + ')">' +
      '<span class="co-tile-img"><img src="' + esc(coachAvatar(c.n)) + '" alt="' + esc(c.n) + '" ' +
        'onerror="this.onerror=null;this.src=\'' + SAGOMA + '\'"></span>' +
      '<span class="co-tile-n">' + esc(nomeCorto(c.n)) + '</span></button>';
  }).join('');

  return '<div class="co-right">' +
    '<div class="co-head"><span>Seleziona allenatore</span><i class="co-rule"></i></div>' +
    '<div class="co-pannello">' +
      '<div class="co-ph"><span class="co-ph-t">Scegli il tuo allenatore</span>' +
        '<i class="co-ph-line"></i>' +
        '<span class="co-ph-n">' + COACHES.length + ' allenatori</span></div>' +
      '<div class="co-grid">' + tessere + '</div>' +
      '<div class="co-custom">' +
        '<span class="co-custom-l">oppure</span>' +
        '<input type="text" id="ch-custom-in" maxlength="24" placeholder="scrivi un nome">' +
        '<button type="button" onclick="pickCoachCustom()">Usa</button>' +
        '<label class="co-up">Carica foto' +
          '<input type="file" accept="image/*" style="display:none" onchange="uploadCoachFace(event)"></label>' +
      '</div>' +
      '<button type="button" class="co-cta" onclick="coachChiudiGriglia()">Continua ' + FRECCIA + '</button>' +
    '</div></div>';
}

function disegna(){
  var indietro = (S.setupMode === 'existing')
    ? "S.screen='replace';render()"
    : "S.screen='choice';render()";
  /* l'attributo onclick sta fra virgolette doppie: gli apici singoli
     dentro non vanno escapati, altrimenti diventano JS non valido */
  return '<div class="co-screen">' +
    '<div class="co-bg" id="co-bg"></div><div class="co-veil"></div>' +
    '<div class="co-layout">' + sinistra(indietro) +
    (window.__coachGriglia ? statoGriglia() : statoRiepilogo()) +
    '</div></div>';
}

/* --- animazioni: solo opacity e transform, tutto ripulito comunque --- */
function pulisci(el){ el.style.opacity = ''; el.style.transform = ''; }
function muovi(el, da, a, opzioni){
  var finito = function(){ requestAnimationFrame(function(){ pulisci(el); }); };
  try {
    el.style.opacity = String(da.o);
    el.style.transform = da.t;
    var corsa = animate(el, { opacity: [da.o, a.o], transform: [da.t, a.t] }, opzioni);
    if (corsa && typeof corsa.then === 'function') corsa.then(finito, finito);
    else finito();
  } catch(e){ finito(); }
}
function sequenza(elenco, alza, durata, passo, fine){
  elenco.forEach(function(el, i){
    var ritardo = fine ? Math.min(i * passo, Math.max(0, fine - durata)) : i * passo;
    muovi(el, { o:0, t:'translateY(' + alza + 'px)' }, { o:1, t:'translateY(0px)' },
      { duration: durata, delay: ritardo, ease: EASE });
  });
}
function scivola(el, daX, aX, durata){
  muovi(el, { o:(daX ? 0 : 1), t:'translateX(' + daX + 'px)' },
            { o:(aX ? 0 : 1), t:'translateX(' + aX + 'px)' },
            { duration: durata, ease: EASE });
}

function anima(root, cambioStato){
  if (!attiva()) return;
  if (cambioStato){
    var destra = root.querySelector('.co-right');
    if (destra) scivola(destra, SPOSTA, 0, DUR_CAMBIO);
  } else {
    sequenza([].slice.call(root.querySelectorAll('.co-eyebrow, .co-title, .co-desc')),
      ALZA_TESTI, DUR_TESTI, 0.04);
  }
  if (window.__coachGriglia){
    sequenza([].slice.call(root.querySelectorAll('.co-tile')),
      ALZA_TESSERE, DUR_TESSERE, 0.012, FINE_TESSERE);
  } else {
    sequenza([].slice.call(root.querySelectorAll('.co-somma > .co-card')),
      ALZA_SCHEDE, DUR_SCHEDE, PASSO_SCHEDE);
  }
}

/* --- aggancio alla catena di disegno --- */
var precedente = window.render;
window.render = function(){
  var esito = precedente.apply(this, arguments);
  var dentro = false;
  try { dentro = (S.screen === 'setupTeam'); } catch(e){}
  if (!dentro){ chiave = null; window.__coachGriglia = false; return esito; }

  var app = document.getElementById('app');
  if (!app) return esito;
  app.innerHTML = disegna();
  if (typeof tsSfondo === 'function') tsSfondo('co-bg', 'src/assets/bg-scelta-allenatore');

  /* la chiave cambia solo passando fra riepilogo e griglia: scegliere
     un allenatore ridisegna, ma non rifa' l'animazione */
  var nuova = 'co:' + (window.__coachGriglia ? 'g' : 's');
  if (nuova !== chiave){
    var primaVolta = (chiave === null);
    chiave = nuova;
    anima(app, !primaVolta);
  }
  return esito;
};
