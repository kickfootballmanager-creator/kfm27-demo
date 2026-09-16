
/* =====================================================================
   Sostituisce le foto segnaposto con la sagoma interna al gioco.

   Sportmonks e api-sports, quando non hanno la foto di un giocatore,
   non restituiscono un errore: servono un'immagine finta all'indirizzo
   di quel giocatore. Quindi non basta l'onerror.
   Quelle immagini pero' pesano sempre lo stesso numero di byte:
     6364  -> sagoma grigia Sportmonks (quella con il 12 sulla maglia)
     10492 -> "NO PHOTO YET" di api-sports
   Le foto vere pesano qualunque altra cosa, comprese quelle da 9 kB.
   ===================================================================== */
(function(){
'use strict';
var FINTE = { 6364:1, 10492:1 };
var LS = 'KFM_SAGOME_V1';
var noto = {};
try { noto = JSON.parse(localStorage.getItem(LS) || '{}') || {}; } catch(e){}
var salvaFraPoco = null;
function salva(){
  clearTimeout(salvaFraPoco);
  salvaFraPoco = setTimeout(function(){
    try { localStorage.setItem(LS, JSON.stringify(noto)); } catch(e){}
  }, 1500);
}

var attivo = true;          /* si spegne da solo se il browser blocca le richieste */
var inCorso = {};

function sagoma(){
  try { if (typeof AVP !== 'undefined' && AVP) return AVP; } catch(e){}
  return '';
}
function chiave(u){
  var m = /\/(\d+)\.png/.exec(String(u||''));
  return m ? m[1] : String(u||'').slice(-40);
}

function controlla(img){
  if (!attivo || !img) return;
  var u = img.getAttribute('src') || '';
  if (!u || u.indexOf('data:') === 0) return;
  /* i vecchi ripieghi esterni: li sostituisco subito, senza chiedere niente */
  if (/ui-avatars\.com|i\.pravatar\.cc/.test(u)) { img.src = sagoma(); return; }
  if (!/cdn\.sportmonks\.com|media\.api-sports\.io/.test(u)) return;

  var k = chiave(u);
  if (noto[k] === 1) { img.src = sagoma(); return; }
  if (noto[k] === 0 || inCorso[k]) return;
  inCorso[k] = 1;

  fetch(u, { cache: 'force-cache' })
    .then(function(r){ return r.blob(); })
    .then(function(b){
      var finta = !!FINTE[b.size];
      noto[k] = finta ? 1 : 0;
      salva();
      if (finta) {
        var s = sagoma();
        document.querySelectorAll('img[src="' + u + '"]').forEach(function(el){ el.src = s; });
      }
    })
    .catch(function(){ attivo = false; })   /* niente permessi: lascio tutto com'e' */
    .then(function(){ delete inCorso[k]; });
}

/* guardo le immagini che compaiono, senza rallentare il disegno */
function passa(root){
  try {
    var imgs = (root || document).querySelectorAll('img');
    for (var i = 0; i < imgs.length; i++) controlla(imgs[i]);
  } catch(e){}
}
var quando = null;
function programma(){
  clearTimeout(quando);
  quando = setTimeout(function(){ passa(document); }, 260);
}

if (window.MutationObserver) {
  new MutationObserver(programma).observe(document.documentElement, { childList:true, subtree:true });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', programma);
else programma();

window.kfmSagome = { mappa: noto, riattiva: function(){ attivo = true; programma(); },
  svuota: function(){ noto = {}; try{ localStorage.removeItem(LS); }catch(e){} } };
})();
