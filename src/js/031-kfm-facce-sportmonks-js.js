
/* =====================================================================
   Facce dei giocatori: Sportmonks come sorgente principale.

   L'id nella riga dice da dove viene il giocatore:
     sm123456  -> Sportmonks
     as123456  -> api-sports (le rose di Serie D che Sportmonks non aveva)
     gen…      -> giocatore inventato, nessuna foto
     123456    -> vecchio id sofifa, resta sulla sorgente di prima

   Gli indirizzi Sportmonks seguono uno schema fisso, quindi si ricavano
   dal solo numero: la cartella è l'id diviso 32, il resto.
     .../players/7/37530791.png     37530791 mod 32 = 7
   ===================================================================== */
(function(){
'use strict';

var SM = 'https://cdn.sportmonks.com/images/soccer/players/';
var AS = 'https://media.api-sports.io/football/players/';
var OLD = 'https://cmtracker.fra1.cdn.digitaloceanspaces.com/DB/26/heads/p';

function iniziali(nome){
  return encodeURIComponent(String(nome || 'P').replace(/ /g, '+'));
}
function segnaposto(nome){
  return 'https://ui-avatars.com/api/?name=' + iniziali(nome) +
         '&background=E2EBF4&color=0D1B2A';
}
/* la sagoma neutra gia' usata dal gioco quando una foto manca */
function sagoma(){
  try { if (typeof AVP !== 'undefined' && AVP) return AVP; } catch(e){}
  return 'https://ui-avatars.com/api/?name=%20&background=1C2A3A&color=8FA3B8';
}

window.getFace = function(id, name){
  var s = String(id == null ? '' : id);

  /* rigenerati e giocatori inventati: la sagoma standard del gioco.
     Prima uscivano ritratti a caso da pravatar — vecchi, donne, gente
     che col calcio non c'entrava niente. */
  if (s.charAt(0) === 'R') return sagoma();
  if (s.slice(0,3) === 'gen') return sagoma();
  if (!s || s === '0')     return sagoma();

  if (s.slice(0,2) === 'sm') {
    var n = parseInt(s.slice(2), 10);
    if (n > 0) return SM + (n % 32) + '/' + n + '.png';
    return segnaposto(name);
  }
  if (s.slice(0,2) === 'as') {
    var a = parseInt(s.slice(2), 10);
    if (a > 0) return AS + a + '.png';
    return segnaposto(name);
  }
  if (s.slice(0,3) === 'gen') return sagoma();

  var v = s.replace(/\.0$/,'').replace(/^0+/,'');
  if (/^\d+$/.test(v)) return OLD + v + '.png';
  return segnaposto(name);
};

/* stemma della squadra, stesso schema */
window.smClubLogo = function(smId){
  var n = parseInt(smId, 10);
  if (!(n > 0)) return '';
  return 'https://cdn.sportmonks.com/images/soccer/teams/' + (n % 32) + '/' + n + '.png';
};

/* --- altezza e piede veri al posto di quelli inventati ----------------
   PHF è la tabella che il gioco consulta: quando non trova l'id calcola
   un'altezza finta dal ruolo. Ora ce li abbiamo per davvero.          */
try {
  if (typeof PHF !== 'undefined' && typeof EADB !== 'undefined') {
    var n = 0;
    for (var club in EADB) {
      var v = EADB[club];
      if (!v || !v.meta || !v.r) continue;
      for (var i = 0; i < v.r.length; i++) {
        var f = v.r[i].split('|');
        var m = v.meta[f[0]];
        if (!m) continue;
        var h = parseInt(m.h, 10);
        if (!(h > 120 && h < 230)) continue;
        PHF[f[3]] = String(h) + (m.foot === 'left' ? 'L' : 'R');
        n++;
      }
    }
    if (window.console && console.info) console.info('[KFM] altezza e piede reali per ' + n + ' giocatori');
  }
} catch(e){}

})();
