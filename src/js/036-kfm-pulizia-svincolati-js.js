
/* =====================================================================
   Uno svincolato non puo' essere contemporaneamente sotto contratto.
   Nei salvataggi vecchi la lista degli svincolati resta quella creata
   col database di allora, e riporta a spasso giocatori che nel database
   nuovo hanno una squadra. Qui, a ogni caricamento, tolgo dalla lista
   chiunque risulti in rosa da qualche parte.
   ===================================================================== */
(function(){
'use strict';
function pulisci(){
  try{
    if(typeof S==='undefined' || !S || !Array.isArray(S.freeAgents)) return 0;
    if(typeof EADB==='undefined') return 0;
    var inSquadra={};
    for(var club in EADB){
      var v=EADB[club]; if(!v||!v.r) continue;
      for(var i=0;i<v.r.length;i++) inSquadra[String(v.r[i]).split('|')[0]]=club;
    }
    var prima=S.freeAgents.length;
    S.freeAgents=S.freeAgents.filter(function(l){
      var n=String(l).split('|')[0];
      /* se l'hai ingaggiato tu resta fuori dalla lista comunque */
      if(S.usedPlayers && S.usedPlayers.has && S.usedPlayers.has(n)) return false;
      return !inSquadra[n];
    });
    var tolti=prima-S.freeAgents.length;
    if(tolti){
      try{ if(typeof _market!=='undefined') _market=null; }catch(e){}
      try{ window._market=null; }catch(e){}
      if(window.console&&console.info) console.info('[KFM] svincolati incoerenti rimossi: '+tolti);
    }
    return tolti;
  }catch(e){ return 0; }
}
window.kfmPulisciSvincolati=pulisci;

/* al caricamento di una partita e a ogni cambio stagione */
['loadGame','caricaPartita','startCareer','newSeason','seasonEnd'].forEach(function(n){
  var f=window[n];
  if(typeof f!=='function') return;
  window[n]=function(){ var r=f.apply(this,arguments); pulisci(); return r; };
});
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',function(){ setTimeout(pulisci,1200); });
else setTimeout(pulisci,1200);
})();
