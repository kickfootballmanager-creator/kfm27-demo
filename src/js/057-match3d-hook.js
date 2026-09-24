/* "Gioca la partita": avvia la partita 3D con le due squadre reali.
   Il pulsante esiste solo a interruttore acceso (000-match3d-switch.js).
   Esci > "Simula risultato" passa per runSim(), la stessa strada di oggi,
   cosi' calendario, classifica e salvataggi restano coerenti. */
(function(){
var avvio = false;

function stato(){ return (typeof S !== 'undefined' && S && S.calendar) ? S : null; }

/* Stesse condizioni di playMatchRealtime: senza un avversario vero la
   giornata si chiude con la simulazione. */
function giocabile(st, match){
  if (match.type === 'BDO') return false;
  if (match.type === 'NC') { var NC = st.nationalCup; if (!NC || NC.userOut || NC.champion) return false; }
  if (match.type.indexOf('CL_') === 0 && match.type !== 'CL_L') {
    var tie = st.cl_active_ties ? st.cl_active_ties.find(function(t){ return t.t1 === st.teamName || t.t2 === st.teamName; }) : null;
    if (!tie) return false;
  }
  if (typeof ensureOpponent === 'function') ensureOpponent(match);
  return !!(match.name && match.name !== 'Da definire' && match.name !== '—');
}

function giocatore(p, i, ruolo){
  return {
    id: p.pid || p.id || p.name, name: p.name, number: p.shirt || p.num || (i + 1),
    role: (p.roles && p.roles[0]) || ruolo || '', overall: p.rate || 0,
    attrs: { pac: p.pac, sho: p.sho, pas: p.pas, dri: p.dri, def: p.def, phy: p.phy }
  };
}

function squadraUtente(st){
  var xi = (st.draft && st.draft.xi) ? st.draft.xi : [];
  var out = [];
  for (var i = 0; i < xi.length && out.length < 11; i++) if (xi[i] && xi[i].name) out.push(giocatore(xi[i], i));
  return { id: st.teamName, name: st.teamName, colors: null, crest: st.userLogo || null,
    formation: st.formationName || '4-3-3', players: out };
}

function squadraAvversaria(match){
  var nome = match.name, od = null;
  try {
    od = (typeof euroClubData === 'function' ? euroClubData(nome) : null) ||
      ((typeof EADB !== 'undefined' && EADB[nome] && typeof buildClub === 'function') ? buildClub(nome) : null);
  } catch (e) { od = null; }
  var out = [];
  if (od && od.r && od.r.length) {
    var xi = (typeof pickBestXI === 'function') ? pickBestXI(od.r).xi : od.r.slice(0, 11);
    for (var j = 0; j < xi.length && out.length < 11; j++) if (xi[j] && xi[j].name) out.push(giocatore(xi[j], j));
  }
  return { id: nome, name: nome, colors: null, crest: match.logo || null, formation: '4-3-3', players: out };
}

function ridisegna(){ try { if (typeof window.render === 'function') window.render(); } catch (e) {} }

window.playMatch3D = function(){
  if (!window.MATCH3D_ENABLED) return window.playMatchRealtime();
  if (avvio) return;
  var st = stato(); if (!st) return;
  var match = st.calendar[st.currentWeek]; if (!match) return;
  if (!giocabile(st, match)) { window.runSim(); return; }

  var utente = squadraUtente(st), avv = squadraAvversaria(match);
  avvio = true;
  window.kfmLoadMatch3d()
    .then(function(m){
      return m.startMatch({
        home: match.home ? utente : avv,
        away: match.home ? avv : utente,
        userSide: match.home ? 'home' : 'away',
        durationMinutes: 6,
        difficulty: 0.5,
        exitMode: 'career'
      });
    })
    .then(function(res){
      avvio = false;
      /* Finche' la partita 3D non e' completa il suo punteggio non conta:
         o si simula come oggi, o la giornata resta da giocare. */
      if (res && res.exit === 'simulate') window.runSim();
      else ridisegna();
    })
    .catch(function(e){
      avvio = false;
      console.error('KFM27: partita 3D non avviata', e);
      if (typeof window.showToast === 'function') window.showToast('Partita 3D non disponibile');
      ridisegna();
    });
};
})();
