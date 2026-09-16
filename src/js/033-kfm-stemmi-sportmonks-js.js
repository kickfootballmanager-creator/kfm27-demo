
/* =====================================================================
   Stemmi dei club: Sportmonks come sorgente principale.

   Ogni club aggiornato ha sm_id nel database, e l'indirizzo si ricava
   da lì con lo stesso schema delle facce:
     .../teams/14/78.png      78 mod 32 = 14

   Ordine di precedenza:
     1. lo stemma che hai scelto tu in Personalizza
     2. Sportmonks
     3. la catena di prima (api-sports) per i club senza sm_id
     4. monogramma neutro
   ===================================================================== */
(function(){
'use strict';

var SM = 'https://cdn.sportmonks.com/images/soccer/teams/';

/* --- indice nome club -> id Sportmonks, e numero interno -> nome ------ */
var BY_NAME = {}, BY_TID = {};
function norm(s){
  return String(s == null ? '' : s).toLowerCase()
    .normalize ? String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
      .replace(/[^a-z0-9]+/g,' ').trim()
    : String(s || '').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
}
try {
  if (typeof EADB !== 'undefined') {
    for (var club in EADB) {
      var v = EADB[club];
      if (!v) continue;
      if (v.sm_id) BY_NAME[norm(club)] = v.sm_id;
      if (v.tid) {
        var t = String(v.tid).replace(/\.0$/,'').replace(/^0+/,'');
        if (t && !BY_TID[t]) BY_TID[t] = club;
      }
      if (v.sm_id && !BY_TID['sm'+v.sm_id]) BY_TID['sm'+v.sm_id] = club;
    }
  }
} catch(e){}

function smUrl(n){
  n = parseInt(n, 10);
  if (!(n > 0)) return '';
  return SM + (n % 32) + '/' + n + '.png';
}
var AS_TEAM = 'https://media.api-sports.io/football/teams/';
/* club dei campionati non selezionati: lo stemma sta su api-sports,
   con gli id gia' mappati in passato */
var AS_ID = {"SK Slavia Praha":2216,"FCSB":539,"Atlético Nacional":1137,"Colo-Colo":2287,"Vitória":214,"Adelaide United":936,"Sparta Praha":2214,"Al Ain":2938,"Club Olimpia":2596,"Peñarol":2662,"Melbourne City FC":940,"Godoy Cruz":446,"Sporting Cristal":1141,"Libertad":2597,"Universidad de Chile":2286,"Kayserispor":601,"Fatih Karagümrük":3583,"Changchun Yatai":868,"LDU Quito":1149,"Alianza Lima":1140,"Club Nacional de Football":2664,"Viktoria Plzeň":2215,"Deportivo Táchira":2707,"APOEL FC":602,"Universidad Católica":2285,"Atlético Bucaramanga":1129,"Sydney FC":944,"Antalyaspor":607,"Cerro Porteño":2595,"Bolívar":2604,"NAC Breda":196,"Auckland FC":22143,"Al-Najma SC":10503,"Brisbane Roar":937,"Western Sydney Wanderers":946,"Independiente del Valle":1148,"Barcelona de Guayaquil":1151,"Bengaluru FC":4783,"CFR Cluj":2265,"AVS Futebol SAD":11524,"Heracles Almelo":204,"Wellington Phoenix":945,"Mumbai City FC":4784,"Perth Glory":941,"Carabobo FC":2705,"Caracas FC":2704,"Cienciano":1143,"FC Volendam":421,"Melbourne Victory":938,"CD Tondela":230,"Central Coast Mariners":939,"Kerala Blasters FC":4785,"Chennaiyin FC":4787};
function smLogo(nome){
  if (!nome) return '';
  var id = BY_NAME[norm(nome)];
  if (id) return smUrl(id);
  /* squadre ricostruite a mano: lo stemma sta su api-sports */
  try {
    var v = EADB[nome];
    if (v && /^as\d+$/.test(String(v.tid||''))) return AS_TEAM + String(v.tid).slice(2) + '.png';
  } catch(e){}
  if (AS_ID[nome]) return AS_TEAM + AS_ID[nome] + '.png';
  return '';
}
window.smClubLogo = smUrl;
window.kfmSmLogo  = smLogo;

/* Uno stemma "generato" è quello che il gioco ha costruito da solo.
   Se invece esce qualcos'altro, l'hai messo tu in Personalizza e vince. */
function generato(u){
  var s = String(u || '');
  if (!s) return true;
  return /media\.api-sports\.io\/football\/teams/.test(s)
      || /cdn\.sportmonks\.com\/images\/soccer\/teams/.test(s)
      || /ui-avatars\.com/.test(s);
}

function avvolgi(nome){
  var vecchia = window[nome];
  if (typeof vecchia !== 'function') return;
  window[nome] = function(a, b){
    var club = (nome === 'getLogo') ? (b || BY_TID[String(a).replace(/\.0$/,'').replace(/^0+/,'')] || '') : a;
    var mia  = smLogo(club);
    var suo  = '';
    try { suo = vecchia.apply(this, arguments) || ''; } catch(e){}
    if (suo && !generato(suo)) return suo;    /* personalizzazione tua */
    return mia || suo;
  };
}
['clubLogo','clubCrest','kfmTeamLogo','tmLogo','getLogo'].forEach(avvolgi);

try {
  var n = 0; for (var k in BY_NAME) n++;
  if (window.console && console.info) console.info('[KFM] stemmi Sportmonks per ' + n + ' club');
} catch(e){}
})();
