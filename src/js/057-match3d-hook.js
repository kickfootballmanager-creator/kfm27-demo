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

/* Posti del modulo {role, x, y}: gli stessi che usa la partita in tempo reale. */
function posti(lista){
  return (lista || []).slice(0, 11).map(function(s){ return { role: s.role, x: s.x, y: s.y }; });
}
function postiBase(){ return (typeof FORMATION_SLOTS !== 'undefined') ? FORMATION_SLOTS : null; }

/* I titolari restano al loro posto nel modulo (xi[i] gioca nello slot i),
   con gli squalificati sostituiti come in playMatchRealtime. */
function squadraUtente(st, match){
  var layout = (window.FM_FORMATIONS2 && st.formationName && window.FM_FORMATIONS2[st.formationName]) || postiBase();
  var xi = (st.draft && st.draft.xi) ? st.draft.xi : [];
  var susp = {};
  try {
    var bucket = (typeof _compBucket === 'function') ? _compBucket(match.type) : 'SA';
    susp = (st.susp && st.susp[bucket]) || {};
  } catch (e) { susp = {}; }
  var out = [];
  for (var i = 0; i < 11; i++) {
    var slot = layout ? layout[i] : null, p = xi[i] || null;
    if (p && p.name && susp[p.name] && typeof _pickReserve === 'function' && slot) { var rep = _pickReserve(slot.role, xi); if (rep) p = rep; }
    out.push(p && p.name ? giocatore(p, i, slot && slot.role) : null);
  }
  return { id: st.teamName, name: st.teamName, colors: null, crest: st.userLogo || null,
    formation: st.formationName || '4-3-3', slots: layout ? posti(layout) : null, players: out };
}

/* L'avversario schiera il miglior undici sul modulo base del manager. */
function squadraAvversaria(match){
  var nome = match.name, od = null;
  try {
    od = (typeof euroClubData === 'function' ? euroClubData(nome) : null) ||
      ((typeof EADB !== 'undefined' && EADB[nome] && typeof buildClub === 'function') ? buildClub(nome) : null);
  } catch (e) { od = null; }
  var layout = postiBase(), out = [];
  if (od && od.r && od.r.length) {
    var xi = (typeof pickBestXI === 'function') ? pickBestXI(od.r).xi : od.r.slice(0, 11);
    for (var j = 0; j < 11; j++) out.push(xi[j] && xi[j].name ? giocatore(xi[j], j, layout && layout[j] && layout[j].role) : null);
  }
  return { id: nome, name: nome, colors: null, crest: match.logo || null, formation: '4-3-3',
    slots: layout ? posti(layout) : null, players: out };
}

/* Le stesse maglie della partita in tempo reale: la squadra in trasferta
   cambia divisa se i colori si confondono con quelli di casa. */
function colori(k){
  if (!k || !k.s) return null;
  return { primary: k.s, secondary: k.s2 || null, shorts: k.sh || null, pattern: k.p || 'solid' };
}
function vesti(home, away){
  if (typeof window.kfmKitFor !== 'function') return;
  try {
    var kh = window.kfmKitFor(home.name, null);
    var ka = window.kfmKitFor(away.name, kh);
    home.colors = colori(kh);
    away.colors = colori(ka);
  } catch (e) {}
}

function ridisegna(){ try { if (typeof window.render === 'function') window.render(); } catch (e) {} }

window.playMatch3D = function(){
  if (!window.MATCH3D_ENABLED) return window.playMatchRealtime();
  if (avvio) return;
  var st = stato(); if (!st) return;
  var match = st.calendar[st.currentWeek]; if (!match) return;
  if (!giocabile(st, match)) { window.runSim(); return; }

  var utente = squadraUtente(st, match), avv = squadraAvversaria(match);
  if (match.home) vesti(utente, avv); else vesti(avv, utente);
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
