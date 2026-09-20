/* =====================================================================
   Animazioni delle due schermate di selezione: nazione e squadra.

   Solo opacity e transform, mai width/height/top/left: quelle fanno
   ricalcolare il layout a ogni fotogramma.

   Se questo modulo non si carica, le schermate restano ferme ma
   visibili: nessuna regola CSS parte da opacity 0, l'opacita' la mette
   il codice qui sotto solo un attimo prima di animare, e la toglie
   comunque vada l'animazione.
   ===================================================================== */
import { animate } from '../vendor/motion-es.js';

var DUR_SCHEDA = 0.28;      /* comparsa di una scheda o di una riga */
var PASSO_SCHEDE = 0.025;   /* scaglionamento fra schede nazione */
var PASSO_RIGHE = 0.02;     /* scaglionamento fra righe squadra */
var FINE_ENTRATA = 0.6;     /* l'ultima deve essere a posto entro qui */
var DUR_USCITA = 0.18;
var DUR_INGRESSO = 0.24;
var SPOSTA = 20;            /* px del passaggio fra schermate */
var ALZA = 10;              /* px della comparsa in sequenza */
var EASE = [0, 0, 0.58, 1];

var ridotto = window.matchMedia('(prefers-reduced-motion: reduce)');
var chiave = null;          /* quale schermata e' gia' entrata */
var strato = null;          /* dove tengo la schermata che se ne va */

function attiva(){
  return !ridotto.matches && typeof animate === 'function';
}

/* La chiave cambia solo passando a un'altra schermata. Un ridisegno
   interno - una modale, un aggiornamento di stato - la lascia uguale,
   e allora non rianimo nulla. */
function chiaveDi(){
  try {
    if (S.screen === 'league') return 'nz:' + (window.__kfmPaese || '');
    if (S.screen === 'replace') return 'ts:' + (S.pendingLeague || '');
  } catch(e){}
  return null;
}

function schermo(){
  return document.querySelector('#app .nz-screen, #app .ts-screen');
}

/* Il contenuto, senza lo sfondo: quello non si anima mai. */
function contenuto(root){
  if (!root) return [];
  var col = root.querySelector(':scope > .ts-col');
  if (col) return [col];
  return [].slice.call(root.querySelectorAll(':scope > .nz-head, :scope > .nz-grid, :scope > .nz-foot'));
}

function pulisci(el){
  el.style.opacity = '';
  el.style.transform = '';
}

/* Unico punto in cui parte un'animazione: qualunque cosa succeda, gli
   stili in linea vengono tolti, cosi' nessun elemento resta invisibile. */
function muovi(el, da, a, opzioni, poi){
  /* Motion scrive i valori finali nello stile in linea quando finisce,
     e lo fa dopo questo richiamo: se pulissi subito me li ritroverei.
     Aspetto il fotogramma dopo, cosi' l'elemento resta senza stili. */
  var finito = function(){
    requestAnimationFrame(function(){ pulisci(el); if (poi) poi(); });
  };
  try {
    el.style.opacity = String(da.opacity);
    el.style.transform = da.transform;
    var corsa = animate(el,
      { opacity: [da.opacity, a.opacity], transform: [da.transform, a.transform] },
      opzioni);
    if (corsa && typeof corsa.then === 'function') corsa.then(finito, finito);
    else finito();
  } catch(e){ finito(); }
}

/* --- comparsa in sequenza --- */
function sequenza(elenco, passo){
  elenco.forEach(function(el, i){
    /* il ritardo e' limitato perche' anche l'ultima sia a posto entro
       FINE_ENTRATA, che ci siano dieci elementi o trenta */
    var ritardo = Math.min(i * passo, FINE_ENTRATA - DUR_SCHEDA);
    muovi(el,
      { opacity: 0, transform: 'translateY(' + ALZA + 'px)' },
      { opacity: 1, transform: 'translateY(0px)' },
      { duration: DUR_SCHEDA, delay: ritardo, ease: EASE });
  });
}

/* --- passaggio fra le due schermate --- */
function esce(vecchio){
  if (!strato){
    strato = document.createElement('div');
    strato.id = 'anim-uscita';
    document.body.appendChild(strato);
  }
  /* via lo sfondo dalla copia che se ne va: quello non si anima, e
     dietro c'e' gia' lo sfondo della schermata nuova */
  var bg = vecchio.querySelector('.nz-bg, .ts-bg');
  var velo = vecchio.querySelector('.nz-veil, .ts-veil');
  if (bg) bg.remove();
  if (velo) velo.remove();

  strato.appendChild(vecchio);
  muovi(vecchio,
    { opacity: 1, transform: 'translateX(0px)' },
    { opacity: 0, transform: 'translateX(-' + SPOSTA + 'px)' },
    { duration: DUR_USCITA, ease: EASE },
    function(){ if (vecchio.parentNode) vecchio.parentNode.removeChild(vecchio); });
}

function entra(pezzi){
  pezzi.forEach(function(el){
    muovi(el,
      { opacity: 0, transform: 'translateX(' + SPOSTA + 'px)' },
      { opacity: 1, transform: 'translateX(0px)' },
      { duration: DUR_INGRESSO, ease: EASE });
  });
}

/* --- aggancio al ciclo di disegno --- */
var precedente = window.render;
window.render = function(){
  var vecchio = schermo();
  var chiaveVecchia = chiave;
  var animabile = attiva();

  var esito = precedente.apply(this, arguments);

  var nuova = chiaveDi();
  if (nuova === chiaveVecchia) return esito;   /* ridisegno interno: fermo */
  chiave = nuova;
  if (!nuova || !animabile) return esito;

  var nuovo = schermo();
  if (!nuovo) return esito;

  if (chiaveVecchia && vecchio){
    /* arrivo da un'altra schermata di selezione: si scambiano di posto,
       e basta, niente comparsa in sequenza sopra */
    esce(vecchio);
    entra(contenuto(nuovo));
  } else if (nuovo.classList.contains('nz-screen')){
    sequenza([].slice.call(nuovo.querySelectorAll('.nz-card')), PASSO_SCHEDE);
  } else {
    sequenza([].slice.call(nuovo.querySelectorAll('.ts-row')), PASSO_RIGHE);
  }
  return esito;
};
