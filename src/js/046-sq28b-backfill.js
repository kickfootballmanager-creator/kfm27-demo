
/* SQ28B - recupero retroattivo del registro: allinea le presenze reali alle partite
   che il gioco ha REALMENTE giocato prima che il registro esistesse.
   Usa solo dati veri del salvataggio: S.history (tabellini utente), le classifiche
   (partite giocate) e S.compStats (marcatori/assistman realmente registrati). */
(function(){
if(window.__SQ28B__) return; window.__SQ28B__=1;
function st(){ try{ return (typeof S!=='undefined'&&S)?S:null; }catch(e){ return null; } }
function SN(){ var s=st(); return (s&&+s.season)||1; }
function hs(x){ x=''+x; var h=2166136261; for(var i=0;i<x.length;i++){ h^=x.charCodeAt(i); h=(h*16777619)>>>0; } return h>>>0; }
function rngOf(sd){ var x=(sd>>>0)||1; return function(){ x=(x*1664525+1013904223)>>>0; return x/4294967296; }; }
function ros(club){
  var s=st(); if(!s||!club) return [];
  if(club===s.teamName){
    var all=[];
    try{ if(typeof squadAll==='function') all=squadAll()||[]; }catch(e){}
    if(!all.length){ all=((s.draft&&s.draft.xi)||[]).concat(s.bench||[]); }
    return all.filter(function(p){ return p&&p.name; });
  }
  try{ var d=(typeof euroClubData==='function')?euroClubData(club):null; if(d&&d.r&&d.r.length) return d.r.filter(function(p){ return p&&p.name; }); }catch(e){}
  return [];
}
function isGK(p){ var r=(p.roles&&p.roles[0])||p.role||''; return r==='POR'||r==='GK'; }
function led(name){ try{ return window.sq28Get?window.sq28Get(name, SN()):null; }catch(e){ return null; } }
function ledB(name,b){ var L=led(name); if(!L) return null; return b==='cup'?L.cup:(b==='eu'?L.eu:L.lg); }
/* quante partite di una competizione risultano gia registrate per un club:
   il portiere titolare gioca tutte le gare, quindi le sue presenze = gare registrate */
function doneFor(club,b){
  var r=ros(club); if(!r.length) return 0;
  var mx=0;
  r.forEach(function(p){ var d=ledB(p.name,b); if(d&&d.p>mx) mx=d.p; });
  return mx;
}
function xiOf(club,seed){
  var r=ros(club).slice(); if(!r.length) return [];
  var rnd=rngOf(seed);
  var gks=r.filter(isGK), fl=r.filter(function(p){ return !isGK(p); });
  var sc=function(p){ return (+p.rate||60)+rnd()*4; };
  gks.sort(function(a,b){ return sc(b)-sc(a); }); fl.sort(function(a,b){ return sc(b)-sc(a); });
  var xi=[]; if(gks[0]) xi.push(gks[0]);
  for(var i=0;i<fl.length&&xi.length<11;i++) xi.push(fl[i]);
  return xi;
}
/* gol e assist REALMENTE registrati dal gioco per una competizione */
function realTally(key,club){
  var s=st(), out={};
  var CS=(s&&s.compStats&&s.compStats[key])||null; if(!CS) return out;
  Object.keys(CS).forEach(function(nm){
    var e=CS[nm]; if(!e) return;
    if(club && e.team!==club) return;
    out[nm]={g:+e.g||0,a:+e.a||0};
  });
  return out;
}
function rate(p,g,a,gf,ga,rnd){
  var v=6.05+0.62*g+0.34*a;
  if(gf>ga) v+=0.3; else if(gf<ga) v-=0.26;
  if(isGK(p)){ if(ga===0) v+=0.55; else v-=0.15*ga; }
  v+=(((+p.rate||70)-72)*0.016)+(rnd()-0.5)*0.7;
  return Math.max(4,Math.min(10,v));
}
/* registra le partite mancanti di un club per una competizione */
function fill(club,b,comp,missing,key,seedBase){
  if(missing<=0) return 0;
  var s=st(); if(!s) return 0;
  var tally=realTally(key,club);
  var names=Object.keys(tally);
  /* gol/assist reali ancora non presenti nel registro */
  var todo={};
  names.forEach(function(nm){
    var d=ledB(nm,b)||{g:0,a:0};
    var g=Math.max(0,(tally[nm].g||0)-(d.g||0)), a=Math.max(0,(tally[nm].a||0)-(d.a||0));
    if(g||a) todo[nm]={g:g,a:a};
  });
  var done=0;
  for(var m=0;m<missing;m++){
    var seed=hs(club+'|'+comp+'|'+SN()+'|'+seedBase+'|'+m);
    var rnd=rngOf(seed);
    var xi=xiOf(club,seed); if(!xi.length) break;
    var left=missing-m;
    var ev={};
    Object.keys(todo).forEach(function(nm){
      var t=todo[nm]; if(!t) return;
      var takeG=Math.min(t.g, Math.ceil(t.g/left));
      var takeA=Math.min(t.a, Math.ceil(t.a/left));
      if(takeG||takeA){ ev[nm]={g:takeG,a:takeA}; t.g-=takeG; t.a-=takeA; }
    });
    var gf=0; Object.keys(ev).forEach(function(nm){ gf+=ev[nm].g; });
    var ga=Math.round(rnd()*1.6);
    var inXI={}; xi.forEach(function(p){ inXI[p.name]=1; });
    xi.forEach(function(p){
      var e=ev[p.name]||{g:0,a:0};
      try{ window.sq28Rec(p.name,club,comp,90,e.g,e.a,rate(p,e.g,e.a,gf,ga,rnd)); }catch(x){}
      done++;
    });
    /* marcatori reali fuori dagli 11: entrano come subentrati veri */
    Object.keys(ev).forEach(function(nm){
      if(inXI[nm]) return;
      var e=ev[nm]; var pl={name:nm,rate:75,roles:['ATT']};
      var mn=20+Math.round(rnd()*20);
      try{ window.sq28Rec(nm,club,comp,mn,e.g,e.a,rate(pl,e.g,e.a,gf,ga,rnd)); }catch(x){}
    });
  }
  return done;
}
/* tabellini VERI delle partite dell'utente salvati in S.history */
function userHistory(){
  var s=st(); if(!s||!s.history||!s.history.length) return;
  if(!s.sq28h||typeof s.sq28h!=='object') s.sq28h={};
  var sn=SN(), me=s.teamName;
  s.history.forEach(function(h){
    if(!h) return;
    var type=h.type||'SA';
    var k=sn+'|'+type+'|'+(h.gw||0)+'|'+(h.opp||'');
    if(s.sq28h[k]) return;
    var comp=(type==='NC'||type==='SUP')?'cup':((''+type).indexOf('CL')===0?'eu':'lg');
    var mine=(h.mySc||[]).map(function(x){ return {name:(x&&(x.name||x.n))||x, team:me, type:'goals'}; });
    var opp=(h.oppSc||[]).map(function(x){ return {name:(x&&(x.name||x.n))||x, team:h.opp, type:'goals'}; });
    try{ window.sq28Match(me, +h.myGf||0, +h.oppGf||0, comp, mine, hs(k+'|me')); }catch(e){}
    if(h.opp){ try{ window.sq28Match(h.opp, +h.oppGf||0, +h.myGf||0, comp, opp, hs(k+'|op')); }catch(e){} }
    s.sq28h[k]=1;
  });
}
function leagueOf(club){
  try{
    if(typeof LEAGUES!=='undefined'){
      var ks=Object.keys(LEAGUES);
      for(var i=0;i<ks.length;i++) if((LEAGUES[ks[i]]||[]).indexOf(club)>=0) return ks[i];
    }
  }catch(e){}
  return null;
}
function run(){
  var s=st(); if(!s||!s.season) return;
  if(!window.sq28Rec||!window.sq28Match) return;
  try{ userHistory(); }catch(e){}
  var sn=SN();
  if(!s.sq28bf||typeof s.sq28bf!=='object') s.sq28bf={};
  var stamp=(s.currentWeek||0)+'|'+((s.history&&s.history.length)||0);
  if(s.sq28bf[sn]===stamp) return;
  /* campionati: le classifiche dicono quante partite ogni club ha giocato davvero */
  var tables=[];
  if(s.saStandings) tables.push({lg:s.leagueName,st:s.saStandings});
  try{ if(s.world&&s.world.leagues) Object.keys(s.world.leagues).forEach(function(lg){
    var L=s.world.leagues[lg]; if(L&&L.standings) tables.push({lg:lg,st:L.standings});
  }); }catch(e){}
  tables.forEach(function(T){
    Object.keys(T.st).forEach(function(club){
      var row=T.st[club]; var pl=(row&&+row.p)||0; if(!pl) return;
      var have=doneFor(club,'l');
      fill(club,'l','lg',pl-have,'lg:'+T.lg,'L');
    });
  });
  /* coppe europee: giornate realmente giocate */
  try{ if(s.world&&s.world.euro) Object.keys(s.world.euro).forEach(function(cp){
    var E=s.world.euro[cp]; if(!E||!E.standings) return;
    Object.keys(E.standings).forEach(function(club){
      var row=E.standings[club]; var pl=(row&&+row.p)||(+E.mdPlayed||0); if(!pl) return;
      if(club===s.teamName) return;
      var have=doneFor(club,'eu');
      fill(club,'eu','eu',pl-have,'eu:'+cp,'E');
    });
  }); }catch(e){}
  /* coppe nazionali: registriamo i turni dei marcatori realmente segnati */
  try{ if(s.compStats) Object.keys(s.compStats).forEach(function(key){
    if(key.indexOf('cup:')!==0) return;
    var CS=s.compStats[key]||{};
    var clubs={}; Object.keys(CS).forEach(function(nm){ if(CS[nm]&&CS[nm].team) clubs[CS[nm].team]=1; });
    Object.keys(clubs).forEach(function(club){
      if(club===s.teamName) return;
      var t=realTally(key,club), need=0;
      Object.keys(t).forEach(function(nm){
        var d=ledB(nm,'cup')||{g:0,a:0};
        need=Math.max(need, Math.max(0,(t[nm].g||0)-(d.g||0)), Math.max(0,(t[nm].a||0)-(d.a||0)));
      });
      if(need>0) fill(club,'cup','cup',need,key,'C');
    });
  }); }catch(e){}
  s.sq28bf[sn]=stamp;
  try{ if(typeof saveGame==='function') saveGame(); else if(typeof save==='function') save(); }catch(e){}
}
window.sq28Backfill=run;
function tick(){ try{ run(); }catch(e){} }
try{ setTimeout(tick,1500); setInterval(tick,15000); }catch(e){}
})();

