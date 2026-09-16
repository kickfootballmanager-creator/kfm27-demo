
/* =====================================================================
   Loghi delle competizioni da Sportmonks, stesso schema di facce e
   stemmi: la cartella e' l'id diviso 32, il resto.
     .../leagues/8/384.png        384 mod 32 = 8
   ===================================================================== */
(function(){
'use strict';
var ID = {"Serie A":384,"Serie B":387,"Serie C - Girone A":1203,"Serie C - Girone B":1204,"Serie C - Girone C":1205,"Serie D - Girone A":1209,"Serie D - Girone C":1211,"Serie D - Girone D":1212,"Serie D - Girone E":1213,"Serie D - Girone F":1214,"Serie D - Girone G":1215,"Serie D - Girone H":1216,"Serie D - Girone I":1217,"Championship":9,"League One":12,"League Two":14,"Premier League":8,"La Liga":564,"La Liga 2":567,"Bundesliga":82,"Ligue 1":301,"Ligue 2":304,"Eredivisie":72,"Primeira Liga":462,"Pro League":208,"Süper Lig":600,"Saudi Pro League":944,"Liga Profesional":636,"Bundesliga austriaca":181,"Brasileirão Série A":648,"Brasileirão Série B":651,"Brasileirão Série C":657,"Super League Cina":989,"K League 1":1034,"Superliga":271,"Premier League Egitto":830,"J1 League":968,"Super League":325,"Liga MX":743,"Eliteserien":444,"Ekstraklasa":453,"Premier League Russia":486,"Premiership scozzese":501,"MLS":779,"Allsvenskan":573,"Super League Svizzera":591,"Premier League Ucraina":609,"2. Bundesliga":85,"1. HNL":244,"Coppa Italia":390,"Coppa Italia Serie C":1450,"Coppa Italia Serie D":1744,"FA Cup":24,"Carabao Cup":27,"DFB-Pokal":109,"DFB Pokal":109,"Copa del Rey":570,"Copa Del Rey":570,"Coupe de France":307,"Champions League":2,"UEFA Champions League":2,"Copa do Brasil":654,"Coppa Nazionale":390};
var BASE = 'https://cdn.sportmonks.com/images/soccer/leagues/';

function url(n){
  n = parseInt(n, 10);
  if (!(n > 0)) return '';
  return BASE + (n % 32) + '/' + n + '.png';
}
window.kfmLegaLogo = function(nome){
  var i = ID[nome];
  return i ? url(i) : '';
};

function avvolgi(nome){
  var vecchia = window[nome];
  window[nome] = function(lg){
    var mia = window.kfmLegaLogo(lg);
    if (mia) return mia;
    if (typeof vecchia === 'function') { try { return vecchia.apply(this, arguments); } catch(e){} }
    return '';
  };
}
avvolgi('getLeagueLogo');
if (typeof window.compLogoUrl === 'function') {
  var prec = window.compLogoUrl;
  window.compLogoUrl = function(t){
    try {
      var nome = (typeof S !== 'undefined' && S.leagueName) ? S.leagueName : '';
      if ((t === 'league' || t === 'lg' || !t) && nome) {
        var u = window.kfmLegaLogo(nome);
        if (u) return u;
      }
      /* coppa nazionale: prendo il nome dalla tabella del gioco */
      if (t === 'cup' || t === 'coppa' || t === 'nc') {
        var cn = '';
        try { cn = (typeof CUP_NAMES !== 'undefined' && CUP_NAMES[nome]) || ''; } catch(e){}
        var v = cn ? window.kfmLegaLogo(cn) : '';
        if (v) return v;
      }
    } catch(e){}
    return prec.apply(this, arguments);
  };
}
try { if (window.console && console.info) console.info('[KFM] loghi per ' + Object.keys(ID).length + ' competizioni'); } catch(e){}
})();
