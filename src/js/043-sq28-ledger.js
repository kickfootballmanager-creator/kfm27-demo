
/* SQ28 - registro REALE di presenze, minuti, gol, assist e voti per OGNI giocatore
   Aggancia il motore di simulazione del gioco (partita utente, IA campionato, mondo)
   e registra una riga di tabellino vera per ogni partita realmente simulata. */
(function(){
if(window.__SQ28__) return; window.__SQ28__=1;

function st(){ try{ return (typeof S!=='undefined'&&S)?S:null; }catch(e){ return null; } }
function SN(){ var s=st(); return (s&&+s.season)||1; }
function hs(x){ x=''+x; var h=2166136261; for(var i=0;i<x.length;i++){ h^=x.charCodeAt(i); h=(h*16777619)>>>0; } return h>>>0; }
function rngOf(sd){ var x=(sd>>>0)||1; return function(){ x=(x*1664525+1013904223)>>>0; return x/4294967296; }; }
function cl(v,a,b){ return v<a?a:(v>b?b:v); }

/* ---------------- archivio ----------------
   S.sq28[nome][stagione] = { c:club, l:[pres,min,gol,ass,voto*10], k:[...], e:[...] }
   l = campionato/playoff, k = coppe nazionali/supercoppe, e = coppe europee   */
function bk(c){ return c==='cup'?'k':(c==='eu'?'e':'l'); }
function store(){ var s=st(); if(!s) return null; if(!s.sq28||typeof s.sq28!=='object') s.sq28={}; return s.sq28; }
function rec(name,club,comp,mins,g,a,rt){
  var L=store(); if(!L||!name) return;
  var P=L[name]||(L[name]={});
  var sn=SN(); var se=P[sn]||(P[sn]={});
  if(club) se.c=club;
  var b=bk(comp); var v=se[b]||(se[b]=[0,0,0,0,0]);
  v[0]+=1;
  v[1]+=Math.max(0,Math.round(mins||0));
  v[2]+=(+g||0);
  v[3]+=(+a||0);
  v[4]+=Math.round(cl(+rt||6,3,10)*10);
}

/* lettura: totale stagione di un giocatore */
function get(name,sn){
  var s=st(); if(!s||!name) return null;
  var P=(s.sq28||{})[name]; if(!P) return null;
  var se=P[sn!=null?sn:SN()]; if(!se) return null;
  var o={p:0,m:0,g:0,a:0,rs:0,c:se.c||'',lg:null,cup:null,eu:null};
  ['l','k','e'].forEach(function(b){
    var v=se[b]; if(!v||!v[0]) return;
    o.p+=v[0]; o.m+=v[1]; o.g+=v[2]; o.a+=v[3]; o.rs+=v[4];
    var d={p:v[0],m:v[1],g:v[2],a:v[3],mv:v[0]?Math.round(v[4]/v[0])/10:0};
    if(b==='l') o.lg=d; else if(b==='k') o.cup=d; else o.eu=d;
  });
  if(!o.p) return {p:0,m:0,g:0,a:0,mv:0,c:o.c,lg:o.lg,cup:o.cup,eu:o.eu};
  o.mv=Math.round(o.rs/o.p)/10;
  return o;
}
function seasons(name){
  var s=st(); if(!s||!name) return [];
  var P=(s.sq28||{})[name]; if(!P) return [];
  return Object.keys(P).map(Number).filter(function(k){ return !isNaN(k); }).sort(function(a,b){ return a-b; });
}

/* ---------------- rose ---------------- */
function roster(club){
  if(!club) return [];
  try{
    var s=st();
    if(s && club===s.teamName){
      var all=[];
      try{ if(typeof squadAll==='function') all=squadAll()||[]; }catch(e){}
      if(!all.length){ all=(((s.draft&&s.draft.xi)||[]).concat(s.bench||[])).filter(function(p){ return p&&p.name; }); }
      return all;
    }
    var cd=null;
    try{ cd=(typeof euroClubData==='function')?euroClubData(club):null; }catch(e){}
    if((!cd||!cd.r||!cd.r.length) && typeof EADB!=='undefined' && EADB[club] && typeof buildClub==='function'){
      try{ cd=buildClub(club); }catch(e){}
    }
    return (cd&&cd.r)?cd.r.filter(function(p){ return p&&p.name; }):[];
  }catch(e){ return []; }
}
function isGK(p){ return !!(p&&p.roles&&p.roles[0]==='POR'); }
function outFor(name){ var s=st(); if(!s) return false;
  try{ if(s.injuries&&s.injuries[name]) return true; }catch(e){}
  return false;
}

/* undici + cambi REALI: rotazione deterministica per partita */
function lineup(club,seed){
  var r=roster(club); if(!r.length) return null;
  var rnd=rngOf(seed);
  var gks=r.filter(isGK), fld=r.filter(function(p){ return !isGK(p); });
  function score(p){ return (+p.rate||65)+rnd()*7-3.5-(outFor(p.name)?60:0); }
  var sg=gks.map(function(p){ return {p:p,v:score(p)}; }).sort(function(a,b){ return b.v-a.v; });
  var sf=fld.map(function(p){ return {p:p,v:score(p)}; }).sort(function(a,b){ return b.v-a.v; });
  var xi=[];
  if(sg.length) xi.push(sg[0].p);
  for(var i=0;i<sf.length && xi.length<11;i++) xi.push(sf[i].p);
  if(xi.length<7) return null;
  var used={}; xi.forEach(function(p){ used[p.name]=1; });
  var subs=[];
  for(var j=0;j<sf.length && subs.length<3;j++){ var q=sf[j].p; if(!used[q.name] && !outFor(q.name)){ subs.push(q); used[q.name]=1; } }
  /* i cambi entrano fra il 55' e l'80'; escono i titolari di campo meno decisivi */
  var mins={}, i2;
  for(i2=0;i2<xi.length;i2++) mins[xi[i2].name]=90;
  var offCand=xi.filter(function(p){ return !isGK(p); }).slice(-Math.max(1,subs.length));
  for(i2=0;i2<subs.length;i2++){
    var on=55+Math.floor(rnd()*26);
    mins[subs[i2].name]=90-on;
    var off=offCand[i2]; if(off) mins[off.name]=on;
  }
  return {xi:xi,subs:subs,mins:mins,all:xi.concat(subs)};
}

/* voto realmente calcolato dal rendimento in partita */
function rate(p,g,a,mn,gf,ga,seed){
  var rnd=rngOf(seed);
  var v=6.0;
  v+=g*0.62+a*0.34;
  v+=(gf>ga?0.32:(gf===ga?0.02:-0.28));
  if(isGK(p)){ v+=(ga===0?0.55:-0.16*ga); }
  else { v+=(ga===0?0.1:0)-0.04*Math.max(0,ga-1); }
  v+=((+p.rate||65)-72)*0.018;
  v+=(rnd()*2-1)*0.42;
  if(mn<45) v=6.0+(v-6.0)*(0.45+mn/120);
  return cl(Math.round(v*10)/10,4.0,10.0);
}

/* registra una partita vera per un club */
function match(club,gf,ga,comp,evs,seed){
  if(!club) return;
  var L=lineup(club,seed); if(!L) return;
  var G={},A={};
  (evs||[]).forEach(function(e){
    if(!e||!e.name) return;
    if(e.type==='assists') A[e.name]=(A[e.name]||0)+1; else G[e.name]=(G[e.name]||0)+1;
  });
  var byName={}; L.all.forEach(function(p){ byName[p.name]=p; });
  /* chi ha segnato o assistito ha certamente giocato: se la rotazione non lo aveva
     schierato, entra come subentrato reale */
  var extra=[];
  function ensure(nm){
    if(byName[nm]) return;
    var r=roster(club), pp=null;
    for(var i=0;i<r.length;i++){ if(r[i].name===nm){ pp=r[i]; break; } }
    if(!pp) pp={name:nm,rate:72,roles:['CC']};
    byName[nm]=pp; extra.push(pp);
    L.mins[nm]=25+(hs(nm+seed)%40);
  }
  Object.keys(G).forEach(ensure); Object.keys(A).forEach(ensure);
  L.all.concat(extra).forEach(function(p,i){
    var mn=L.mins[p.name]; if(mn==null||mn<=0) return;
    var g=G[p.name]||0, a=A[p.name]||0;
    rec(p.name,club,comp,mn,g,a,rate(p,g,a,mn,gf,ga,seed+i*97+hs(p.name)));
  });
}

/* ---------------- cattura marcatori/assist dal motore ---------------- */
var STACK=[], INPS=false, MC=0;
function push(){ var b=[]; STACK.push(b); return b; }
function pop(){ return STACK.pop()||[]; }
function note(name,team,type){
  if(!name) return;
  var b=STACK.length?STACK[STACK.length-1]:null;
  if(b) b.push({name:name,team:team||'',type:(type==='assists'?'assists':'goals')});
}
function compOf(type){
  if(!type) return 'lg';
  if(type.indexOf('CL')===0||type.indexOf('EL')===0||type.indexOf('CO')===0) return 'eu';
  if(type==='NC'||type==='SUP') return 'cup';
  return 'lg';
}
function hook(){
  var W=window;
  if(typeof W.processStats==='function' && !W.processStats.__sq28){
    var op=W.processStats;
    var np=function(name,team,type,isCL,img){ INPS=true; try{ note(name,team,type); }catch(e){} try{ return op.apply(this,arguments); } finally { INPS=false; } };
    np.__sq28=1; W.processStats=np;
  }
  if(typeof W.addCompStat==='function' && !W.addCompStat.__sq28){
    var oa=W.addCompStat;
    var na=function(key,name,team,type,img){ if(!INPS){ try{ note(name,team,type); }catch(e){} } return oa.apply(this,arguments); };
    na.__sq28=1; W.addCompStat=na;
  }
  /* partite IA del campionato dell'utente */
  if(typeof W.simulateMatchIA==='function' && !W.simulateMatchIA.__sq28){
    var os=W.simulateMatchIA;
    var ns=function(strA,strB,nameA,nameB,isCL){
      push(); var res;
      try{ res=os.apply(this,arguments); } finally {
        var evs=pop();
        try{
          var gA=(res&&res.gfA)||0, gB=(res&&res.gfB)||0, cp=isCL?'eu':'lg';
          MC++;
          match(nameA,gA,gB,cp,evs.filter(function(e){ return !e.team||e.team===nameA; }),hs(nameA+'|'+SN()+'|'+MC));
          match(nameB,gB,gA,cp,evs.filter(function(e){ return e.team===nameB; }),hs(nameB+'|'+SN()+'|'+MC));
        }catch(e){}
      }
      return res;
    };
    ns.__sq28=1; W.simulateMatchIA=ns;
  }
  /* mondo: altri campionati, coppe e coppe europee (wScore arriva in coppia) */
  if(typeof W.wScore==='function' && !W.wScore.__sq28){
    var ow=W.wScore, PEND=null;
    var nw=function(key,club,gf){
      push(); try{ ow.apply(this,arguments); } finally {
        var evs=pop();
        try{
          var cp=(''+key).indexOf('cup:')===0?'cup':((''+key).indexOf('eu:')===0?'eu':'lg');
          if(PEND && PEND.key===key && PEND.club!==club){
            MC++;
            match(PEND.club,PEND.gf,gf||0,PEND.cp,PEND.evs,hs(PEND.club+'|'+SN()+'|'+MC));
            match(club,gf||0,PEND.gf,cp,evs,hs(club+'|'+SN()+'|'+MC));
            PEND=null;
          } else {
            if(PEND){ MC++; match(PEND.club,PEND.gf,1,PEND.cp,PEND.evs,hs(PEND.club+'|'+SN()+'|'+MC)); }
            PEND={key:key,club:club,gf:gf||0,cp:cp,evs:evs};
          }
        }catch(e){}
      }
    };
    nw.__sq28=1; W.wScore=nw;
  }
  /* partita dell'utente: _genMatchCards viene chiamata prima dei gol */
  if(typeof W._genMatchCards==='function' && !W._genMatchCards.__sq28){
    var og=W._genMatchCards;
    var ng=function(mt){
      var res=og.apply(this,arguments);
      try{
        var s=st(); if(s){
          var hl=(s.history||[]).length;
          var buf=push();
          setTimeout(function(){
            try{
              var i=STACK.indexOf(buf); if(i>=0) STACK.splice(i,1);
              var s2=st(); if(!s2) return;
              var H=(s2.history||[]);
              if(H.length<=hl) return;
              var h=H[H.length-1]; if(!h) return;
              var key=(s2.season||1)+'|'+h.type+'|'+h.gw+'|'+h.opp;
              if(!s2.sq28h||typeof s2.sq28h!=='object') s2.sq28h={};
              if(s2.sq28h[key]) return; s2.sq28h[key]=1;
              var cp=compOf(h.type);
              var mine=buf.filter(function(e){ return e.team===s2.teamName; });
              var thr=buf.filter(function(e){ return e.team && e.team!==s2.teamName; });
              MC++;
              match(s2.teamName,+h.myGf||0,+h.oppGf||0,cp,mine,hs(s2.teamName+'|'+key));
              if(h.opp) match(h.opp,+h.oppGf||0,+h.myGf||0,cp,thr,hs(h.opp+'|'+key));
              try{ if(typeof saveGame==='function' && s2.mode) saveGame(); else if(typeof save==='function') save(); }catch(e){}
            }catch(e){}
          },0);
        }
      }catch(e){}
      return res;
    };
    ng.__sq28=1; W._genMatchCards=ng;
  }
}
hook();
try{ setInterval(hook,4000); }catch(e){}

window.sq28Get=get;
window.sq28Seasons=seasons;
window.sq28Match=match;
window.sq28Rec=rec;
})();

