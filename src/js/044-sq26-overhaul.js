
/* ===================== FC26 SQUAD OVERHAUL (AAA) =========================
   Ridisegna completamente la sezione SQUADRA (modalita' allena una squadra /
   crea una squadra da zero) seguendo il layout EA-FC: top-nav, campo in
   prospettiva, pannello giocatore con 5 schede navigabili e finestra
   "Vedi dettagli" in stile scheda completa con i colori del club.
   ========================================================================= */
(function(){
'use strict';
if(window.__SQ26__) return; window.__SQ26__=true;

var I=window.FMI||function(){return '';};

/* ------------------------------------------------------------------ utils */
function seed(s){ var h=2166136261>>>0; s=String(s||''); for(var i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619)>>>0; } return h>>>0; }
function rng(sd){ var x=sd>>>0||1; return function(){ x^=x<<13; x>>>=0; x^=x>>17; x^=x<<5; x>>>=0; return x/4294967296; }; }
function clamp(v,a,b){ return Math.max(a,Math.min(b,Math.round(v))); }
function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
function jq(s){ return String(s==null?'':s).replace(/\\/g,'\\\\').replace(/'/g,"\\'"); }
function P(){ try{ return squadAll(); }catch(e){ return []; } }
function curX(){ var all=P(); if(!all.length) return null; if(S.rosaDetIdx==null||S.rosaDetIdx>=all.length) S.rosaDetIdx=0; return all[S.rosaDetIdx]||null; }
function isGK(p){ return !!(p&&p.roles&&p.roles[0]==='POR'); }
function teamLogo(){ try{ if(S.userLogo) return S.userLogo; if(typeof EADB!=='undefined'&&EADB[S.teamName]&&typeof getLogo==='function') return getLogo(EADB[S.teamName].tid,S.teamName); }catch(e){} return ''; }
function year(){ try{ return getYear(); }catch(e){ return 2025; } }
function money(m){ m=Number(m)||0; return '\u20ac '+(Math.round(m*1000000)).toLocaleString('it-IT'); }
function pName(r){ try{ return (typeof ROLE_IT!=='undefined'&&ROLE_IT[r])?ROLE_IT[r]:r; }catch(e){ return r; } }

/* --------------------------------------------------- colori del club (AAA) */
var CLUBCOL={ 'Milan':'#c8102e','AC Milan':'#c8102e','Inter':'#0b1f8f','Juventus':'#1b1b1b','Napoli':'#12a0dc','Roma':'#8e1f2f','Lazio':'#7fc4e8','Atalanta':'#1b2b4b','Fiorentina':'#59248f','Como':'#0b2d6b','Torino':'#7a1417','Bologna':'#8f1f2e','Genoa':'#8f1622','Real Madrid':'#1b3c78','Barcellona':'#9d2235','Barcelona':'#9d2235','Atletico Madrid':'#c8102e','Bayern':'#c8102e','Bayern Monaco':'#c8102e','Borussia Dortmund':'#c8a415','Liverpool':'#c8102e','Manchester United':'#c8102e','Manchester City':'#4aa5d8','Chelsea':'#1a4fa0','Arsenal':'#c8102e','Tottenham':'#132257','PSG':'#12315e','Ajax':'#c8102e','Porto':'#1b4fa0','Benfica':'#c8102e','Sporting':'#1f9257' };
function hashColor(name){ var h=seed(name); var hues=[352,214,138,32,268,190,12,44]; var hue=hues[h%hues.length]; return 'hsl('+hue+',62%,38%)'; }
function clubColor(){
  var n=(typeof S!=='undefined'&&S.teamName)||'';
  try{ if(S.sq26col) return S.sq26col; }catch(e){}
  var c=CLUBCOL[n];
  if(!c){ var k=Object.keys(CLUBCOL); for(var i=0;i<k.length;i++){ if(n&&(n.indexOf(k[i])>=0||k[i].indexOf(n)>=0)){ c=CLUBCOL[k[i]]; break; } } }
  if(!c) c=hashColor(n);
  try{ S.sq26col=c; }catch(e){}
  return c;
}
/* estrae il colore dominante dal logo (se il CORS lo consente) e lo salva */
function sniffLogoColor(){
  try{
    if(S.sq26colDone) return; S.sq26colDone=true;
    var src=teamLogo(); if(!src) return;
    var im=new Image(); im.crossOrigin='anonymous';
    im.onload=function(){
      try{
        var cv=document.createElement('canvas'); cv.width=32; cv.height=32;
        var cx=cv.getContext('2d'); cx.drawImage(im,0,0,32,32);
        var d=cx.getImageData(0,0,32,32).data, best=null, bs=-1, buk={};
        for(var i=0;i<d.length;i+=4){
          var r=d[i],g=d[i+1],b=d[i+2],a=d[i+3]; if(a<160) continue;
          var mx=Math.max(r,g,b), mn=Math.min(r,g,b); var sat=mx===0?0:(mx-mn)/mx; var lum=(mx+mn)/510;
          if(sat<0.30||lum<0.14||lum>0.90) continue;
          var key=(r>>5)+'_'+(g>>5)+'_'+(b>>5);
          buk[key]=buk[key]||{n:0,r:0,g:0,b:0}; var o=buk[key]; o.n++; o.r+=r; o.g+=g; o.b+=b;
        }
        for(var k in buk){ if(buk[k].n>bs){ bs=buk[k].n; best=buk[k]; } }
        if(best&&bs>6){
          var col='rgb('+Math.round(best.r/best.n)+','+Math.round(best.g/best.n)+','+Math.round(best.b/best.n)+')';
          S.sq26col=col; if(S.mode==='rosa'&&typeof render==='function') render();
        }
      }catch(e){}
    };
    im.src=src;
  }catch(e){}
}

/* ------------------------------------------------- dati persistenti (save) */
var DEVPLANS=['Sviluppo bilanciato','Focus offensivo','Focus difensivo','Focus atletico','Focus tecnico'];
var MINPLANS=['Titolare fisso','Titolare importante','Rotazione','Comprimario','Prospetto per il futuro'];
var DUTIES=['Equilibrato','Offensivo','Difensivo','Di supporto','Libero di svariare'];
var STATUSES=['Stella','Titolare','Rotazione','Promessa','Primavera'];
var TRAITS=['Tira dalla distanza','Ama inserirsi','Gioca uno-due','Cerca la giocata','Colpo di tacco','Punta l\u2019uomo','Rifinitore','Marcatore aggressivo','Rigorista','Specialista punizioni','Cross a rientrare','Pressing costante','Leader in campo','Regia arretrata','Attacca la profondit\u00e0'];
var PERSON=['Professionale','Determinato','Leader nato','Ambizioso','Modello di condotta','Temperamentale','Riservato'];

var CLUBPOOL=null;
function clubPool(){
  if(CLUBPOOL) return CLUBPOOL;
  var out=[];
  try{ if(typeof EADB!=='undefined'){ for(var k in EADB){ if(k&&k!==S.teamName) out.push(k); } } }catch(e){}
  if(!out.length) out=['Atalanta','Torino','Bologna','Sassuolo','Empoli','Genoa','Udinese','Cagliari','Parma','Lecce','Ajax','Feyenoord','Porto','Benfica','Celta Vigo','Getafe','Nantes','Rennes','Stoccarda','Friburgo'].filter(function(c){ return c!==S.teamName; });
  CLUBPOOL=out; return out;
}
function archPut(sn,name,club,g,a){
  if(!S.sq26arch||typeof S.sq26arch!=='object') S.sq26arch={};
  if(!S.sq26arch[name]) S.sq26arch[name]={};
  var e=S.sq26arch[name][sn];
  if(!e){ S.sq26arch[name][sn]={c:club||'',g:g||0,a:a||0}; return; }
  if((g||0)>=(e.g||0)) e.g=g||0;
  if((a||0)>=(e.a||0)) e.a=a||0;
  if(club) e.c=club;
}
function appTick(){
  try{
    var sn=S.season||1, wk=+S.currentWeek||0;
    if(!S.sq26app||typeof S.sq26app!=='object') S.sq26app={};
    if(!S.sq26wk||typeof S.sq26wk!=='object') S.sq26wk={};
    var key=sn+'';
    var last=S.sq26wk[key];
    if(last==null){ S.sq26wk[key]=wk; return; }
    if(wk<=last){ S.sq26wk[key]=wk; return; }
    var games=Math.min(6,wk-last);
    S.sq26wk[key]=wk;
    var xi=(S.draft&&S.draft.xi)||[], bn=S.bench||[];
    function add(nm,pres,mins){
      if(!nm) return;
      if(!S.sq26app[nm]) S.sq26app[nm]={};
      var e=S.sq26app[nm][sn]||{p:0,m:0};
      e.p=(+e.p||0)+pres; e.m=(+e.m||0)+mins;
      S.sq26app[nm][sn]=e;
    }
    for(var i=0;i<xi.length;i++){
      var p=xi[i]; if(!p||!p.name) continue;
      var inj=false; try{ inj=!!(S.injuries&&S.injuries[p.name]); }catch(e){}
      if(inj) continue;
      add(p.name,games,games*90);
    }
    for(var j=0;j<bn.length;j++){
      var b=bn[j]; if(!b||!b.name) continue;
      var inj2=false; try{ inj2=!!(S.injuries&&S.injuries[b.name]); }catch(e){}
      if(inj2) continue;
      if(j<7 && ((seed(b.name+sn+wk)%100)<38)) add(b.name,1,(18+seed(b.name+wk)%22));
    }
  }catch(e){}
}
function archTick(){
  appTick();
  try{
    var sn=S.season||1, ps=S.playerStats||{};
    for(var n in ps){
      var st=ps[n]; if(!st) continue;
      var g=(+st.goals||0)+(+st.clGoals||0)+(+st.cupGoals||0);
      var a=(+st.assists||0)+(+st.clAssists||0)+(+st.cupAssists||0);
      if(!st.team && !g && !a) continue;
      archPut(sn,n,st.team||'',g,a);
    }
  }catch(e){}
  try{
    var snU=S.season||1, mine=((S.draft&&S.draft.xi)||[]).concat(S.bench||[]);
    for(var mi=0;mi<mine.length;mi++){
      var mp=mine[mi]; if(!mp||!mp.name) continue;
      var stx=(S.playerStats||{})[mp.name]||{};
      var gx=(+stx.goals||0)+(+stx.clGoals||0)+(+stx.cupGoals||0);
      var ax=(+stx.assists||0)+(+stx.clAssists||0)+(+stx.cupAssists||0);
      archPut(snU,mp.name,S.teamName||'',gx,ax);
    }
  }catch(e){}
  try{
    /* il gioco conserva le statistiche per competizione della stagione precedente */
    var sn2=S.season||1;
    if(sn2>1 && S.lastSeasonStats){
      var agg={}, ls=S.lastSeasonStats;
      for(var k in ls){
        var m=ls[k]||{};
        for(var nm in m){
          var v=m[nm]||{};
          if(!agg[nm]) agg[nm]={c:'',g:0,a:0};
          agg[nm].g+=(+v.g||0); agg[nm].a+=(+v.a||0);
          if(v.team) agg[nm].c=v.team;
        }
      }
      for(var nm2 in agg) archPut(sn2-1,nm2,agg[nm2].c,agg[nm2].g,agg[nm2].a);
    }
  }catch(e){}
  try{
    /* e le statistiche per competizione della stagione in corso */
    var sn3=S.season||1, cs=S.compStats;
    if(cs){
      var ag2={};
      for(var k2 in cs){
        var m2=cs[k2]||{};
        for(var n2 in m2){
          var v2=m2[n2]||{};
          if(!ag2[n2]) ag2[n2]={c:'',g:0,a:0};
          ag2[n2].g+=(+v2.g||0); ag2[n2].a+=(+v2.a||0);
          if(v2.team) ag2[n2].c=v2.team;
        }
      }
      for(var n3 in ag2) archPut(sn3,n3,ag2[n3].c,ag2[n3].g,ag2[n3].a);
    }
  }catch(e){}
}
try{
  if(!window.__sq26arcHook){
    window.__sq26arcHook=true;
    if(typeof window.advanceSeason==='function'){
      var _adv=window.advanceSeason;
      window.advanceSeason=function(){ try{ archTick(); }catch(e){} return _adv.apply(this,arguments); };
    }
    setInterval(function(){ try{ if(typeof S!=='undefined'&&S&&S.playerStats) archTick(); }catch(e){} },8000);
  }
}catch(e){}
/* partite realmente disputabili in una stagione (campionato + coppe) */
function gamesInSeason(k){
  var cs=S.season||1;
  var full=46;
  if(k===cs){
    var w=+S.currentWeek||0; if(w<0) w=0; if(w>38) w=38;
    return Math.round(w*1.15);
  }
  if(k>cs) return 0;
  return full;
}
function careerRows(d,p){
  var cs=S.season||1, out=[], keys={};
  var nm=(p&&p.name)||'';
  var A={}, AP={};
  try{ A=(S.sq26arch||{})[nm]||{}; }catch(e){}
  try{ AP=(S.sq26app||{})[nm]||{}; }catch(e){}
  var cmap={};
  (d.career||[]).forEach(function(c){ if(c&&c.sn!=null&&!c.past) cmap[+c.sn]=c; });
  if(d.cur&&d.cur.sn!=null&&!cmap[+d.cur.sn]) cmap[+d.cur.sn]=d.cur;
  Object.keys(A).forEach(function(k){ keys[+k]=1; });
  Object.keys(AP).forEach(function(k){ keys[+k]=1; });
  Object.keys(cmap).forEach(function(k){ keys[+k]=1; });
  keys[cs]=1;
  if(AP[cs]==null && A[cs]==null && cmap[cs]==null) AP[cs]={p:0,m:0};
  Object.keys(keys).map(Number).filter(function(k){ return !isNaN(k)&&k>=1&&k<=cs; })
    .sort(function(a,b){ return b-a; }).forEach(function(k){
      var a=A[k]||{}, ap=AP[k]||{}, c=cmap[k]||{};
      var club=a.c||c.club||'';
      var pres=(ap.p!=null)?(+ap.p||0):((typeof c.pres==='number')?c.pres:null);
      var gol=(a.g!=null)?(+a.g||0):(+c.gol||0);
      var ass=(a.a!=null)?(+a.a||0):(+c.ass||0);
      var LG=null; try{ LG=(typeof window.sq28Get==='function')?window.sq28Get(nm,k):null; }catch(e){}
      var mv='-', mn=0;
      if(LG && LG.p>0){
        pres=LG.p; gol=LG.g; ass=LG.a; mn=LG.m||0;
        if(LG.c) club=LG.c;
        if(LG.mv) mv=(+LG.mv).toFixed(2);
      } else {
        pres=(pres!=null)?pres:0;
        mn=+ap.m||0;
      }
      if(k!==cs && !pres && !gol && !ass) return;
      out.push({sn:k,s:seasonLabel(k),club:club,pres:pres,gol:gol,ass:ass,mv:mv,role:c.role||'',mins:mn,lg:(LG&&LG.lg)||null,cup:(LG&&LG.cup)||null,eu:(LG&&LG.eu)||null});
    });
  return out;
}
function devLabel(p){
  try{ var KT=window.__KT;
    if(KT&&typeof KT.planGet==='function'){
      var pl=KT.planGet(p);
      if(pl&&pl.d&&pl.d.length) return pl.d.length+(pl.d.length===1?' esercizio impostato':' esercizi impostati');
      return 'Nessun esercizio impostato';
    }
  }catch(e){}
  return 'Allenamento personalizzato';
}
function pdata(p){
  if(!p) return null;
  if(!S.sq26) S.sq26={};
  var key=p.name+'|'+(p.pid||'');
  var d=S.sq26[key];
  var base=p.rate||60;
  if(!d){
    var r=rng(seed(key));
    function v(b,sp){ return clamp(b+(r()*2-1)*sp,32,99); }
    var gk=isGK(p);
    d={};
    d.number = (function(){ if(gk) return [1,12,22][Math.floor(r()*3)]; var pool=[2,3,4,5,6,7,8,9,10,11,14,17,18,19,20,21,23,24,27,30,33,77,99]; return pool[Math.floor(r()*pool.length)]; })();
    d.weight = clamp((p.height||182)-110+(r()*10-5),58,96);
    d.status = p.rate>=80?STATUSES[0]:p.rate>=76?STATUSES[1]:p.age<=20?STATUSES[3]:STATUSES[2];
    d.dev = DEVPLANS[Math.floor(r()*DEVPLANS.length)];
    d.minutes = d.status==='Stella'?MINPLANS[0]:d.status==='Titolare'?MINPLANS[1]:d.status==='Rotazione'?MINPLANS[2]:MINPLANS[4];
    d.duty = DUTIES[Math.floor(r()*DUTIES.length)];
    d.person = PERSON[Math.floor(r()*PERSON.length)];
    d.morale = ['Molto buono','Buono','Felice','Nella norma'][Math.floor(r()*4)];
    d.rel = ['Ottimo','Buono','Nella norma'][Math.floor(r()*3)];
    d.cond = clamp(84+r()*16,70,100);
    d.form = clamp(74+r()*26,60,100);
    d.loyalty = 1+Math.floor(r()*5);
    d.autoRenew = r()<0.25;
    d.raise = [0,5,10,15][Math.floor(r()*4)];
    d.optionYear = r()<0.3 ? (year()+1+Math.floor(r()*2)) : null;
    d.clause = r()<0.45 ? Math.round(((typeof playerPrice==='function'?playerPrice(p):20)*(1.4+r()*1.2))*10)/10 : null;
    d.contractType = p.age<=19?'Primavera':(r()<0.12?'Non professionista':'Professionista');
    d.lastRenew = null;
    d.expiry = '30/06/'+(year()+(p.contractYears||(1+Math.floor(r()*4))));
    /* attributi dettagliati persistenti */
    var A={};
    if(gk){
      A['Tuffo']=v(base,5); A['Presa']=v(base,5); A['Rinvio']=v(base,9); A['Riflessi']=v(base,5);
      A['Piazzamento']=v(base,6); A['Vel. uscite']=v(base-6,8); A['Gioco coi piedi']=v(base-8,10);
      A['Concentrazione']=v(base,7); A['Coraggio']=v(base,8); A['Comando area']=v(base,8);
    }
    var pac=+p.pac||base, sho=+p.sho||base, pas=+p.pas||base, dri=+p.dri||base, def=+p.def||base, phy=+p.phy||base;
    A['Accelerazione']=v(pac,4); A['Vel. scatto']=v(pac,4);
    A['Pos. attacco']=v(sho,7); A['Finalizzazione']=v(sho,7); A['Pot. tiro']=v(sho,8); A['Tiri dist.']=v(sho,9); A['Tiri al volo']=v(sho,10); A['Rigori']=v(sho,10);
    A['Visione']=v(pas,7); A['Cross']=v(pas,9); A['Prec. puniz.']=v(pas,11); A['Pass. corto']=v(pas,5); A['Pass. lungo']=v(pas,7); A['Effetto']=v(pas,9);
    A['Agilit\u00e0']=v(dri,6); A['Equilibrio']=v(dri,6); A['Reattivit\u00e0']=v(dri,6); A['Contr. palla']=v(dri,5); A['Dribbling']=v(dri,4); A['Freddezza']=v(dri,9);
    A['Intercettaz.']=v(def,6); A['Prec. testa']=v(def,10); A['Lettura dif.']=v(def,6); A['Contrasto']=v(def,5); A['Scivolata']=v(def,7);
    A['Elevazione']=v(phy,10); A['Resistenza']=v(phy,7); A['Forza']=v(phy,7); A['Aggressivit\u00e0']=v(phy,10);
    A['Carisma']=v(base,10); A['Concentrazione']=v(base,8); A['Coraggio']=v(base,9); A['Decisioni']=v(base,7);
    A['Determinazione']=v(base,8); A['Fantasia']=v(dri,9); A['Lettura gioco']=v(pas,7); A['Posizionamento']=v(base,7);
    A['Senza palla']=v(base,7); A['Visione di gioco']=v(pas,6); A['Tecnica']=v(dri,6); A['Gioco di testa']=v((def+phy)/2,10);
    A['Integrit\u00e0 fisica']=v(base,9); A['Massima elevazione']=v(phy,12); A['Calci d\u2019angolo']=v(pas,12);
    d.attr=A;
    /* caratteristiche */
    var pool=TRAITS.slice(); var tr=[]; var nt=3+Math.floor(r()*2);
    for(var t=0;t<nt;t++){ tr.push(pool.splice(Math.floor(r()*pool.length),1)[0]); }
    d.traits=tr;
    /* nessuno storico inventato: la carriera parte dalla stagione attuale */
    d.career=[];
    d.injHist=[];
    d.contractLog=[];
    d.joined=year();
    d.awards={ pot:0, yot:0, tot:0, assist:(r()<0.2?1:0), goal:0 };
    d.notes='';
    d.cards={ lega:{y:Math.floor(r()*6),r:(r()<0.1?1:0)}, coppa:{y:Math.floor(r()*2),r:0}, euro:{y:Math.floor(r()*2),r:0} };
    d.pres0=Math.floor(r()*3);
    S.sq26[key]=d;
  }
  return d;
}

/* archivia la stagione conclusa: lo storico cresce solo giocando */
function syncCareer(p){
  var d=pdata(p); if(!d) return d;
  if(!d.career) d.career=[];
  var sn=S.season||1;
  if(d.cur && d.cur.sn!=null && d.cur.sn<sn){
    var already=d.career.some(function(c){ return c.sn===d.cur.sn; });
    if(!already) d.career.push(d.cur);
  }
  return d;
}
function seasonLabel(sn){
  var base=(S.baseYear||year()); var v=(sn==null||isNaN(+sn))?1:+sn; var y=base+(v-1);
  return String(y).slice(2)+'/'+String(y+1).slice(2);
}

/* statistiche stagionali live */
function seasonStats(p){
  var d=pdata(p); var st=(S.playerStats&&S.playerStats[p.name])||{};
  var gl=(st.goals||0)+(st.clGoals||0)+(st.cupGoals||0);
  var as=(st.assists||0)+(st.clAssists||0)+(st.cupAssists||0);
  var LG=null; try{ LG=(typeof window.sq28Get==='function')?window.sq28Get(p.name,S.season||1):null; }catch(e){}
  var pres=0, mins=0, mv=0;
  if(LG && LG.p>0){
    pres=LG.p; mins=LG.m||0; mv=+LG.mv||0;
    gl=LG.g; as=LG.a;
  }
  var pass=clamp(66+(+p.pas||70)*0.28,60,95);
  var yc=d.cards.lega.y, rc=d.cards.lega.r;
  d.cur={ sn:(S.season||1), s:seasonLabel(S.season||1), club:S.teamName, pres:pres, gol:gl, ass:as, mv:mv, role:d.status, wage:((typeof playerWage==='function')?playerWage(p):40) };
  return { pres:pres, gol:gl, ass:as, mins:mins, mv:mv, pass:pass, yc:yc, rc:rc };
}

/* ruoli calcolati */
function roleRatings(p){
  var d=pdata(p), A=d.attr, out=[];
  function mk(lab,keys,bias){ var s=0,n=0; keys.forEach(function(k){ if(A[k]!=null){ s+=A[k]; n++; } }); var v=n?s/n:p.rate; return {lab:lab,v:clamp(v*0.55+p.rate*0.45+(bias||0),40,99)}; }
  if(isGK(p)){
    out.push(mk('Portiere',['Tuffo','Presa','Riflessi','Piazzamento'],2));
    out.push(mk('Portiere sweeper',['Vel. uscite','Gioco coi piedi','Riflessi'],0));
    out.push(mk('Portiere di linea',['Presa','Piazzamento','Comando area'],1));
    out.push(mk('Costruttore',['Gioco coi piedi','Concentrazione'],-2));
    out.push(mk('Para-rigori',['Riflessi','Concentrazione'],-1));
  } else {
    var r0=(p.roles&&p.roles[0])||'CC';
    var M={ POR:[], DC:[['Difensore centrale',['Contrasto','Intercettaz.','Prec. testa','Forza']],['Stopper',['Contrasto','Aggressivit\u00e0','Forza']],['Libero',['Lettura dif.','Pass. corto','Visione']],['Braccetto',['Vel. scatto','Contrasto','Pass. corto']],['Difensore d\u2019anticipo',['Lettura dif.','Reattivit\u00e0']]],
      TS:[['Terzino sinistro',['Contrasto','Vel. scatto','Cross']],['Terzino spinto',['Vel. scatto','Cross','Resistenza']],['Terzino difensivo',['Contrasto','Intercettaz.']],['Braccetto sinistro',['Lettura dif.','Pass. corto']],['Terzino accentrato',['Pass. corto','Visione']]],
      TD:[['Terzino destro',['Contrasto','Vel. scatto','Cross']],['Terzino spinto',['Vel. scatto','Cross','Resistenza']],['Terzino difensivo',['Contrasto','Intercettaz.']],['Braccetto destro',['Lettura dif.','Pass. corto']],['Terzino accentrato',['Pass. corto','Visione']]],
      CDC:[['Mediano',['Intercettaz.','Contrasto','Pass. corto']],['Regista arretrato',['Visione','Pass. lungo','Pass. corto']],['Frangiflutti',['Contrasto','Aggressivit\u00e0','Forza']],['Box to box',['Resistenza','Contrasto','Pos. attacco']],['Centrocampista centrale',['Pass. corto','Visione']]],
      CC:[['Mezzala',['Pos. attacco','Resistenza','Pass. corto']],['Centrocampista centrale',['Pass. corto','Visione','Contr. palla']],['Regista avanzato',['Visione','Pass. lungo','Fantasia']],['Box to box',['Resistenza','Contrasto','Tiri dist.']],['Interno di centrocampo',['Pass. corto','Senza palla']]],
      COC:[['Trequartista',['Fantasia','Visione','Contr. palla']],['Rifinitore',['Visione','Pass. corto']],['Seconda punta',['Pos. attacco','Finalizzazione']],['Mezzala offensiva',['Senza palla','Tiri dist.']],['Regista avanzato',['Visione','Pass. lungo']]],
      AD:[['Ala destra',['Dribbling','Vel. scatto','Cross']],['Ala accentrata',['Finalizzazione','Contr. palla']],['Esterno di spinta',['Vel. scatto','Resistenza','Cross']],['Rifinitore esterno',['Visione','Pass. corto']],['Attaccante esterno',['Pos. attacco','Finalizzazione']]],
      AS:[['Ala sinistra',['Dribbling','Vel. scatto','Cross']],['Ala accentrata',['Finalizzazione','Contr. palla']],['Esterno di spinta',['Vel. scatto','Resistenza','Cross']],['Rifinitore esterno',['Visione','Pass. corto']],['Attaccante esterno',['Pos. attacco','Finalizzazione']]],
      ATT:[['Attaccante centrale',['Finalizzazione','Pos. attacco','Freddezza']],['Finalizzatore',['Finalizzazione','Pot. tiro']],['Prima punta',['Forza','Prec. testa','Pos. attacco']],['Falso nueve',['Visione','Contr. palla','Pass. corto']],['Attaccante di movimento',['Vel. scatto','Senza palla']]] };
    var list=M[r0]||M.CC;
    list.forEach(function(it,i){ out.push(mk(it[0],it[1],3-i)); });
  }
  out.sort(function(a,b){ return b.v-a.v; });
  return out;
}

/* ------------------------------------------------------------------- CSS  */
var CSS=[
'.sq26{position:relative;border-radius:0;overflow:hidden;padding:0;height:100vh;max-height:100vh;display:flex;flex-direction:column;font-family:Inter,system-ui,sans-serif;}',
'body[data-mode="rosa"]{overflow:hidden!important;}',
'.sq26.fm-squad{height:100vh!important;max-height:100vh!important;min-height:0!important;padding:0!important;margin:0!important;border-radius:0!important;box-sizing:border-box!important;}',
'.sq26.fm-squad>*{box-sizing:border-box;}',
'.sq26::before{content:"";position:absolute;inset:0;background:rgba(6,11,18,.88);z-index:0;}',
'.sq26::after{content:"";position:absolute;inset:0;background:rgba(4,9,15,.10);z-index:0;pointer-events:none;}',
'.sq26>*{position:relative;z-index:1;}',
'@keyframes sqFade{from{opacity:0}to{opacity:1}}',
'@keyframes sqUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}',
'@keyframes sqRight{from{opacity:0;transform:translateX(26px)}to{opacity:1;transform:none}}',
'@keyframes sqCard{from{opacity:0;transform:translateY(18px) scale(.86)}to{opacity:1;transform:none}}',
'@keyframes sqBar{from{width:0!important}}',
'@keyframes sqBenchUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}',
'@keyframes sqPop2{from{opacity:0;transform:scale(.985)}to{opacity:1;transform:none}}',
'@keyframes sqPop{from{opacity:0;transform:scale(.9) translateY(18px)}to{opacity:1;transform:none}}',
'.sq26 [class^="sq26-"]{animation:none!important;}',
'.sq26.anim .sq26-nav,.sq26.anim .sq26-head{animation:sqUp .26s ease both!important;}',
'.sq26.anim .sq26-node{animation:none!important;}',
/* top nav */
'.sq26-nav{display:flex;align-items:center;gap:24px;padding:14px 30px 0;flex:0 0 auto;}',
'.sq26-nav .it{position:relative;font-size:12.5px;font-weight:800;letter-spacing:1.3px;text-transform:uppercase;color:rgba(255,255,255,.5);cursor:pointer;padding:4px 0 9px;transition:color .16s ease;white-space:nowrap;}',
'.sq26-nav .it:hover{color:rgba(255,255,255,.86);}',
'.sq26-nav .it.on{color:#fff;}',
'.sq26-nav .it.on::after{content:"";position:absolute;left:0;right:0;bottom:4px;height:2px;background:#00c853;}',
'.sq26-nav .it.mute{opacity:.42;cursor:not-allowed;}',
'.sq26-nav .it.mute:hover{color:rgba(255,255,255,.5);transform:none;}',
'.sq26-navline{height:1px;background:rgba(255,255,255,.10);margin:0 26px;}',
'.sq26-chip{margin-left:auto;margin-bottom:8px;display:flex;align-items:stretch;gap:0;background:linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.09);border-radius:3px;padding:0;overflow:hidden;}',
'.sq26-chip b{display:flex;align-items:center;justify-content:center;min-width:44px;padding:0 10px;font-family:Anton,Oswald,sans-serif;font-size:21px;line-height:1;color:#07100b;background:#00e676;font-variant-numeric:tabular-nums;}',
'.sq26-chip>div{display:flex;flex-direction:column;justify-content:center;gap:2px;padding:7px 14px 7px 12px;}',
'.sq26-chip .nm{font-family:Oswald,sans-serif;font-size:13.5px;font-weight:500;letter-spacing:.05em;color:#fff;line-height:1.05;}',
'.sq26-chip .ag{font-size:8.6px;letter-spacing:.22em;color:rgba(255,255,255,.42);text-transform:uppercase;line-height:1;}',
/* header */
'.sq26-head{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:2px 24px 6px;flex:0 0 auto;}',
'.sq26-title{font-size:28px;font-weight:800;letter-spacing:.4px;color:#fff;line-height:1;text-transform:uppercase;}',
'.sq26-sub{font-size:12.5px;color:rgba(255,255,255,.55);margin-top:8px;animation:sqUp .4s .08s ease both;}',
'.sq26-kpis{display:flex;gap:0;border:1px solid rgba(255,255,255,.10);border-radius:6px;overflow:hidden;background:rgba(255,255,255,.035);}',
'.sq26-kpi{padding:7px 22px;text-align:center;border-right:1px solid rgba(255,255,255,.1);}',
'.sq26-kpi:last-child{border-right:none;}',
'.sq26-kpi span{display:block;font-size:9.5px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,.5);margin-bottom:6px;}',
'.sq26-kpi b{font-size:21px;font-weight:800;color:#fff;line-height:1;font-variant-numeric:tabular-nums;}',
'.sq26-kpi .mini{width:74px;height:4px;border-radius:3px;background:rgba(255,255,255,.14);margin:7px auto 0;overflow:hidden;}',
'.sq26-kpi .mini i{display:block;height:100%;border-radius:3px;background:#00c853;}',
'.sq26-acts{display:flex;gap:8px;padding:0 26px 12px;flex-wrap:wrap;animation:sqUp .4s .12s ease both;}',
'.sq26-abtn{display:inline-flex;align-items:center;gap:7px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);color:#dbe6f2;border-radius:11px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;transition:.16s;letter-spacing:.3px;}',
'.sq26-abtn:hover{background:rgba(0,230,118,.16);border-color:rgba(0,230,118,.5);color:#fff;transform:translateY(-2px);}',
'.sq26-abtn.prim{background:linear-gradient(180deg,#00e676,#00a94f);border-color:transparent;color:#04240f;}',
/* grid */
'.sq26-grid{flex:1 1 auto;min-height:0;display:grid;grid-template-columns:minmax(0,1fr) 400px;gap:16px;padding:0 24px 6px;align-items:stretch;overflow:hidden;}',
'@media(max-width:1180px){.sq26-grid{grid-template-columns:1fr;}}',
/* pitch */
'.sq26-pitchwrap{position:relative;perspective:1600px;display:flex;flex-direction:column;min-height:0;}',
'.sq26-pitch{position:relative;flex:1 1 auto;min-height:0;}',
'.sq26-turf{position:absolute;inset:0;border-radius:8px;transform:none;background:linear-gradient(180deg,#12452a,#0c3320 60%,#092617);box-shadow:0 24px 60px rgba(0,0,0,.5);overflow:hidden;}',
'.sq26-pitch::before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(180deg,rgba(255,255,255,.045) 0 44px,rgba(0,0,0,.05) 44px 88px);}',
'.sq26-pitch::after{content:"";position:absolute;inset:0;background:radial-gradient(75% 60% at 50% 42%,rgba(255,255,255,.05),transparent 72%);pointer-events:none;}',
'.sq26-line{position:absolute;border:2px solid rgba(255,255,255,.20);border-radius:2px;}',
'.sq26-node{position:absolute;transform:translate(-50%,-50%);width:var(--sqn,96px);cursor:pointer;text-align:center;transition:transform .16s cubic-bezier(.2,.8,.2,1);}',
'.sq26-node:hover{transform:translate(-50%,-50%) scale(1.06);z-index:20;}',
'.sq26-lbadge{position:absolute;top:3px;left:3px;z-index:4;display:flex;flex-direction:column;align-items:center;gap:1px;padding:1px 2px;border-radius:4px;background:rgba(6,11,18,.62);border:1px solid rgba(0,200,83,.30);backdrop-filter:blur(2px);}',
'.sq26-lbadge img{width:calc(var(--sqn,96px)*0.135)!important;height:calc(var(--sqn,96px)*0.135)!important;min-width:11px;min-height:11px;object-fit:contain;background:none!important;border:none!important;border-radius:0!important;display:block!important;filter:drop-shadow(0 1px 2px rgba(0,0,0,.65));}',
'.sq26-lbadge s{text-decoration:none;font-size:calc(var(--sqn,96px)*0.105);line-height:1;font-weight:900;color:#00e676;}',
'.sq26-bc{position:relative;}',
'.sq26-bc .sq26-lbadge{top:-4px;left:-4px;}',
'.sq26-node:hover .sq26-card{border-color:rgba(255,255,255,.42);}',
'.sq26-card{position:relative;background:#0d1520;border:1px solid rgba(255,255,255,.16);border-radius:7px;padding:0 0 7px;overflow:hidden;box-shadow:0 8px 18px rgba(0,0,0,.42);}',
'.sq26-card::before{content:"";position:absolute;left:0;right:0;top:calc(var(--sqn,96px)*0.31);height:calc(var(--sqn,96px)*0.28);background:linear-gradient(180deg,rgba(15,24,37,0),rgba(13,21,32,.92));pointer-events:none;}',


'.sq26-node.det .sq26-card{border-color:#0091ea;box-shadow:0 0 0 1px #0091ea;}',
'.sq26-node.armed .sq26-card{border-color:#00c853;box-shadow:0 0 0 1px #00c853;}',
'.sq26-card img{width:100%;height:calc(var(--sqn,96px)*0.585);display:block;object-fit:contain;object-position:center bottom;background:linear-gradient(180deg,#16202e,#0f1825);border:none;border-radius:0;}',
'.sq26-r{position:absolute;top:3px;right:5px;z-index:3;padding:0 4px;border-radius:3px;background:rgba(6,11,18,.72);font-size:calc(var(--sqn,96px)*0.142);line-height:1.28;font-weight:800;color:#3ddc84;font-variant-numeric:tabular-nums;}',
'.sq26-n{display:block;font-size:calc(var(--sqn,96px)*0.122);font-weight:800;color:#fff;margin-top:2px;padding:0 4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
'.sq26-p{display:block;font-size:calc(var(--sqn,96px)*0.101);font-weight:700;letter-spacing:.8px;color:rgba(255,255,255,.55);margin-top:1px;}',
'.sq26-empty{width:52px;height:52px;margin:9px auto 2px;border-radius:50%;border:2px dashed rgba(255,255,255,.26);display:grid;place-items:center;font-size:10px;font-weight:800;color:rgba(255,255,255,.5);}',
'.sq26-form{position:absolute;left:18px;bottom:14px;z-index:4;}',
'.sq26-form b{display:block;font-size:24px;font-weight:800;color:#fff;letter-spacing:1px;line-height:1;}',
'.sq26-form span{font-size:11px;color:rgba(255,255,255,.62);letter-spacing:1px;}',
/* bench */
'.sq26-bench{position:relative;flex:0 0 102px;height:102px;margin-top:10px;}',
'.sq26-bx{position:absolute;left:0;right:0;bottom:0;background:rgba(8,13,20,.96);border:1px solid rgba(255,255,255,.10);border-radius:6px;padding:11px 13px 13px;max-height:102px;overflow:hidden;transition:max-height .52s cubic-bezier(.16,.84,.24,1),box-shadow .52s ease,background .45s ease;will-change:max-height;}',
'.sq26-bench:hover .sq26-bx,.sq26-bench.open .sq26-bx{max-height:62vh;z-index:40;background:rgba(8,13,20,.99);box-shadow:0 -22px 50px rgba(0,0,0,.62);}',
'.sq26-bench-g{transition:opacity .26s ease;}',
'.sq26-bench:hover .sq26-bench-g,.sq26-bench.open .sq26-bench-g{flex-wrap:wrap;overflow:visible;max-height:none;}',
'.sq26-bench:hover .sq26-bc,.sq26-bench.open .sq26-bc{flex:0 0 calc(25% - 7px);animation:sqBenchUp .3s cubic-bezier(.16,.84,.24,1) both!important;}',
'@media(max-width:1400px){.sq26-bench:hover .sq26-bc,.sq26-bench.open .sq26-bc{flex:0 0 calc(33.33% - 7px);}}',
'.sq26-bench-h{cursor:pointer;display:flex;align-items:center;gap:8px;}',
'.sq26-bench-h .cv{margin-left:auto;transition:transform .18s ease;color:rgba(255,255,255,.5);}',
'.sq26-bench:hover .sq26-bench-h .cv,.sq26-bench.open .sq26-bench-h .cv{transform:rotate(180deg);}',
'.sq26-bench-h{font-size:11px;letter-spacing:1.4px;text-transform:uppercase;color:rgba(255,255,255,.58);margin-bottom:9px;font-weight:800;}',
'.sq26-bench-g{display:flex;gap:9px;overflow-x:auto;padding:2px 2px 6px;scrollbar-width:none;}',
'.sq26-bench-g::-webkit-scrollbar{display:none;}',
'.sq26-bc{flex:0 0 auto;display:flex;align-items:center;gap:9px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);border-radius:5px;padding:8px 12px 8px 9px;cursor:pointer;min-width:158px;}',
'.sq26-bc:hover{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.2);}',
'.sq26-bc.det{border-color:rgba(0,176,255,.75);box-shadow:0 0 0 1px rgba(0,176,255,.3);}',
'.sq26-bc.armed{border-color:#00c853;box-shadow:0 0 0 1px #00c853;}',
'.sq26-bc img{width:34px;height:34px;border-radius:50%;object-fit:cover;background:#0b1522;}',
'.sq26-bc .bn{font-size:12px;font-weight:800;color:#fff;}',
'.sq26-bc .bp{font-size:10px;color:rgba(255,255,255,.5);}',
'.sq26-bc .br{margin-left:auto;font-size:15px;font-weight:800;color:#fff;font-variant-numeric:tabular-nums;}',
/* right panel */
'.sq26-panel{background:rgba(9,14,21,.96);border:1px solid rgba(255,255,255,.10);border-radius:6px;overflow:hidden;display:flex;flex-direction:column;min-height:0;height:100%;}',
'.sq26-ph{position:relative;display:flex;align-items:center;gap:15px;padding:14px 17px 15px;border-bottom:1px solid rgba(255,255,255,.09);overflow:hidden;flex:0 0 auto;}',
'.sq26-phi{min-width:0;flex:1 1 auto;}',
'.sq26-flag{width:24px;height:16px;border-radius:2px;object-fit:cover;box-shadow:0 0 0 1px rgba(255,255,255,.22);vertical-align:-3px;margin-right:7px;}',
'.sq26-loan{display:flex;align-items:center;gap:10px;margin:9px 16px 0;padding:7px 10px;border-radius:6px;background:linear-gradient(90deg,rgba(0,200,83,.13),rgba(0,200,83,.04));border:1px solid rgba(0,200,83,.26);border-left:3px solid #00c853;}',
'.sq26-loan .lb{display:block;font-size:9.5px;font-weight:800;letter-spacing:1.1px;color:rgba(126,240,173,.85);text-transform:uppercase;line-height:1;}',
'.sq26-loan .lc{display:block;font-size:13.5px;font-weight:800;color:#fff;line-height:1.15;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}','.sq26-loan .tx{min-width:0;flex:1 1 auto;}','.sq26-loan .rt{flex:0 0 auto;font-size:10.5px;font-weight:700;color:rgba(255,255,255,.62);text-align:right;line-height:1.25;}','.sq26-loan .rt b{display:block;font-size:12px;font-weight:800;color:#dff8e8;}',
'.sq26-loan img{width:26px;height:26px;flex:0 0 auto;object-fit:contain;background:none!important;border:none!important;border-radius:0!important;filter:drop-shadow(0 1px 3px rgba(0,0,0,.5));}',
'.sq26-loan svg{width:14px;height:14px;color:#00e676;flex:0 0 auto;}','.sq26-clw{display:inline-flex;align-items:center;gap:6px;min-width:0;}','.sq26-clw b{color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}','img.sq26-cl{width:16px;height:16px;object-fit:contain;background:none!important;border:none!important;border-radius:0!important;flex:0 0 auto;}',
'.sq26-ph::before{content:"";position:absolute;inset:0;background:var(--sqc,#c8102e);opacity:.16;}',
'.sq26-ph>*{position:relative;}',
'.sq26-ph img.face{width:86px;height:86px;border-radius:6px;object-fit:cover;object-position:center top;background:linear-gradient(180deg,#16202e,#0f1825);border:1px solid rgba(255,255,255,.16);flex:0 0 auto;}',
'.sq26-ovr{font-size:40px;font-weight:800;color:#fff;line-height:.92;font-variant-numeric:tabular-nums;}',
'.sq26-ovr small{display:inline-block;font-size:11px;font-weight:800;color:rgba(255,255,255,.6);margin-left:6px;vertical-align:super;letter-spacing:1px;}',
'.sq26-pnm{font-size:22px;font-weight:800;color:#fff;letter-spacing:.2px;line-height:1.1;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
'.sq26-pmeta{display:flex;align-items:center;font-size:13px;font-weight:600;color:rgba(255,255,255,.72);margin-top:6px;}',
'.sq26-info{margin-left:auto;display:inline-flex;align-items:center;gap:7px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.18);color:#fff;border-radius:4px;padding:8px 14px;font-size:11.5px;font-weight:700;cursor:pointer;white-space:nowrap;}',
'.sq26-info:hover{background:rgba(255,255,255,.14);}',
'.sq26-body{padding:10px 16px 10px;flex:1 1 auto;min-height:0;overflow:hidden;display:flex;flex-direction:column;}',
'.sq26-body>.sq26-rows{flex:1 1 0;min-height:0;overflow:hidden;display:flex;flex-direction:column;justify-content:space-between;}',
'.sq26-body>.sq26-rows>div{flex:1 1 auto;min-height:0;}',
'.sq26-body>.sq26-attrs{flex:1 1 0;min-height:0;overflow:hidden;display:flex;flex-direction:column;justify-content:space-between;}',
'.sq26-body>.sq26-attrs>.sq26-attr{flex:0 1 auto;min-height:0;}',
'.sq26-attrs .sq26-attr{margin-bottom:0;}',
'.sq26-body>.sq26-sec,.sq26-body>.sq26-duty{flex:0 0 auto;}',
'.sq26-body::-webkit-scrollbar{display:none;}',
'@keyframes sqSlide{0%{opacity:0;transform:translateX(26px)}60%{opacity:1}100%{opacity:1;transform:none}}',
'.sq26 .sq26-body.sw{animation:sqSlide .92s cubic-bezier(.22,.7,.2,1) both!important;}',
'.sq26 .sq26-ph.sw{animation:sqSlide .78s cubic-bezier(.22,.7,.2,1) both!important;}',
'.sq26 .sq26-loan.sw{animation:sqSlide .84s .1s cubic-bezier(.22,.7,.2,1) both!important;}',
'.sq26 .sq26-body.sw .sq26-attr .bar i{animation:sqBar 1.35s .18s cubic-bezier(.22,.7,.2,1) both!important;}',
'.sq26 .sq26-body.sw>.sq26-rows>div,.sq26 .sq26-body.sw>.sq26-attrs>.sq26-attr{animation:sqSlide .8s cubic-bezier(.22,.7,.2,1) both!important;}',
'.sq26 .sq26-body.sw>.sq26-rows>div:nth-child(1),.sq26 .sq26-body.sw>.sq26-attrs>.sq26-attr:nth-child(1)   {animation-delay:.24s!important;}',
'.sq26 .sq26-body.sw>.sq26-rows>div:nth-child(2),.sq26 .sq26-body.sw>.sq26-attrs>.sq26-attr:nth-child(2){animation-delay:.06s!important;}',
'.sq26 .sq26-body.sw>.sq26-rows>div:nth-child(3),.sq26 .sq26-body.sw>.sq26-attrs>.sq26-attr:nth-child(3)  {animation-delay:.36s!important;}',
'.sq26 .sq26-body.sw>.sq26-rows>div:nth-child(4),.sq26 .sq26-body.sw>.sq26-attrs>.sq26-attr:nth-child(4){animation-delay:.12s!important;}',
'.sq26 .sq26-body.sw>.sq26-rows>div:nth-child(5),.sq26 .sq26-body.sw>.sq26-attrs>.sq26-attr:nth-child(5) {animation-delay:.30s!important;}',
'.sq26 .sq26-body.sw>.sq26-rows>div:nth-child(6),.sq26 .sq26-body.sw>.sq26-attrs>.sq26-attr:nth-child(6){animation-delay:.18s!important;}',
'.sq26 .sq26-body.sw>.sq26-rows>div:nth-child(7) {animation-delay:.42s!important;}',
'.sq26-sec{font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,.5);font-weight:800;margin:11px 0 7px;display:flex;align-items:center;gap:8px;}',
'.sq26-sec:first-child{margin-top:2px;}',
'.sq26-sec::after{content:"";flex:1;height:1px;background:rgba(255,255,255,.10);}',
'.sq26-rows>div{display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid rgba(255,255,255,.06);font-size:13px;}',
'.sq26-rows>div span{color:rgba(255,255,255,.55);}',
'.sq26-rows>div b{color:#fff;font-weight:700;}',
'.sq26-attr{margin-bottom:7px;}',
'.sq26-attr .t{display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:4px;}',
'.sq26-attr .t span{color:rgba(255,255,255,.72);}',
'.sq26-attr .t b{color:#fff;font-size:12.5px;font-weight:800;font-variant-numeric:tabular-nums;}',
'.sq26-attr .bar{height:6px;border-radius:4px;background:rgba(255,255,255,.1);overflow:hidden;}',
'.sq26-attr .bar i{display:block;height:100%;border-radius:4px;}',
'.sq26-duty{display:flex;gap:12px;align-items:center;}',
'.sq26-mini{position:relative;margin-left:auto;border-radius:4px;border:1px solid rgba(255,255,255,.16);background:linear-gradient(180deg,#14311f,#0c2115);overflow:hidden;flex:0 0 auto;}',
'.sq26-mini .dot{position:absolute;width:9px;height:9px;border-radius:50%;transform:translate(-50%,-50%);background:rgba(0,200,83,.45);}',
'.sq26-mini .dot.main{width:11px;height:11px;background:#00e676;box-shadow:0 0 10px rgba(0,230,118,.85);}',
'.sq26-duty .txt b{display:block;font-size:14px;color:#fff;}',
'.sq26-duty .txt span{font-size:12px;color:rgba(255,255,255,.55);}',
/* footer nav */
'.sq26-foot{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:7px 24px 16px;border-top:1px solid rgba(255,255,255,.08);background:rgba(0,0,0,.25);flex:0 0 auto;}',
'.sq26-hint{display:flex;gap:14px;flex-wrap:wrap;font-size:10.5px;color:rgba(255,255,255,.45);}',
'.sq26-hint i{display:inline-grid;place-items:center;width:16px;height:16px;border-radius:50%;background:rgba(255,255,255,.14);color:#fff;font-style:normal;font-size:9px;font-weight:800;margin-right:5px;}',
'.sq26-pager{display:flex;align-items:center;gap:9px;}',
'.sq26-pager button{width:28px;height:28px;border-radius:4px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.16);color:#fff;display:grid;place-items:center;cursor:pointer;}',
'.sq26-pager button:hover{background:rgba(255,255,255,.16);}',
'.sq26-dots{display:flex;gap:6px;align-items:center;}',
'.sq26-dots i{width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,.28);transition:.2s;cursor:pointer;}',
'.sq26-dots i.on{background:#00c853;}',
'.sq26-rkey{width:22px;height:22px;border-radius:50%;border:1px solid rgba(255,255,255,.4);display:grid;place-items:center;font-size:10px;font-weight:800;color:#fff;}',
/* scheda 3 list */
'.sq26-mrow{display:flex;align-items:center;gap:12px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.08);border-radius:5px;padding:8px 12px;margin-bottom:6px;cursor:pointer;}',
'.sq26-mrow:hover{background:rgba(255,255,255,.07);border-color:rgba(255,255,255,.2);}',
'.sq26-mrow .ic{width:32px;height:32px;border-radius:4px;background:rgba(255,255,255,.06);display:grid;place-items:center;color:rgba(255,255,255,.72);flex:0 0 auto;}',
'.sq26-mrow .tx b{display:block;font-size:13px;color:#fff;font-weight:700;}',
'.sq26-mrow .tx span{font-size:11.5px;color:rgba(255,255,255,.5);}',
'.sq26-mrow .ch{margin-left:auto;color:rgba(255,255,255,.4);}',
/* mini tabs */
'.sq26-mt{display:flex;gap:20px;border-bottom:1px solid rgba(255,255,255,.1);margin-bottom:14px;}',
'.sq26-mt div{font-size:12px;font-weight:700;color:rgba(255,255,255,.5);padding:0 0 9px;cursor:pointer;position:relative;transition:.15s;}',
'.sq26-mt div:hover{color:#fff;}',
'.sq26-mt div.on{color:#fff;}',
'.sq26-mt div.on::after{content:"";position:absolute;left:0;right:0;bottom:-1px;height:2px;background:#00c853;}',
'.sq26-2col{display:grid;grid-template-columns:1fr 1fr;gap:8px 22px;}',
'.sq26-grp{font-size:9.5px;letter-spacing:1.2px;color:rgba(255,255,255,.42);font-weight:800;margin:9px 0 4px;text-transform:uppercase;}',
'.sq26-line2{display:flex;justify-content:space-between;font-size:11.5px;padding:3px 0;border-bottom:1px solid rgba(255,255,255,.05);}',
'.sq26-line2 span{color:rgba(255,255,255,.65);}',
'.sq26-line2 b{color:#fff;font-weight:700;font-variant-numeric:tabular-nums;}',
'.sq26-tbl{width:100%;border-collapse:collapse;font-size:12px;}',
'.sq26-tbl th{font-size:10px;letter-spacing:.8px;text-transform:uppercase;color:rgba(255,255,255,.42);text-align:left;padding:6px 4px;font-weight:800;}',
'.sq26-tbl td{padding:5px 4px;border-top:1px solid rgba(255,255,255,.06);color:#dbe6f2;}',
'.sq26-tbl td b{color:#fff;}',
'.sq26-tbl tr.tot td{border-top:1px solid rgba(255,255,255,.2);font-weight:800;color:#fff;}',
'.sq26-cards{display:flex;gap:6px;align-items:center;}',
'.sq26-cy{width:11px;height:15px;border-radius:2px;background:linear-gradient(180deg,#ffd93d,#e8b400);display:inline-block;}',
'.sq26-cr{width:11px;height:15px;border-radius:2px;background:linear-gradient(180deg,#ff5b5b,#c62828);display:inline-block;}',
'.sq26-btns{display:flex;gap:8px;margin:10px 0 2px;}',
'.sq26-btns button{flex:1;border:none;border-radius:4px;padding:10px 0;font-size:11.5px;font-weight:700;cursor:pointer;font-family:inherit;letter-spacing:.2px;}',
'.sq26-btns .gh{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.16);color:#dbe6f2;}',
'.sq26-btns .gh:hover{background:rgba(255,255,255,.14);}',
'.sq26-btns .ok{background:#00c853;color:#04240f;}',
'.sq26-btns .ok:hover{background:#00e06a;}',
'.sq26-stars{color:#fff;letter-spacing:2px;font-size:12px;}',
/* dettaglio modale */
'.sq26-ov{position:fixed;inset:0;z-index:180000;background:rgba(3,6,10,.86);display:flex;align-items:center;justify-content:center;padding:2vh 14px;animation:sqFade .16s ease both!important;}',
'.sq26-mod{width:min(1380px,97vw);height:96vh;max-height:96vh;display:flex;flex-direction:column;overflow:hidden;scrollbar-width:none;border-radius:8px;background:#0b1119;border:1px solid rgba(255,255,255,.11);box-shadow:0 30px 80px rgba(0,0,0,.7);animation:sqPop2 .18s ease both!important;font-family:Inter,system-ui,sans-serif;}',
'.sq26-mod::-webkit-scrollbar{display:none;}',
'.sq26-mtop{flex:0 0 auto;display:flex;align-items:center;gap:12px;padding:9px 20px;border-bottom:1px solid rgba(255,255,255,.09);background:#0e151e;}',
'.sq26-mtop::before{content:"";position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--sqc,#c8102e);}',
'.sq26-mtop{position:relative;}',
'.sq26-mtop img{width:30px;height:30px;object-fit:contain;}',
'.sq26-mtop b{font-size:15px;color:#fff;font-weight:800;letter-spacing:.4px;}',
'.sq26-x{margin-left:auto;width:30px;height:30px;border-radius:4px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.16);color:#fff;cursor:pointer;font-size:15px;line-height:1;}',
'.sq26-x:hover{background:#ff5b5b;border-color:transparent;transform:rotate(90deg);}',
'.sq26-mgrid{flex:1 1 auto;min-height:0;display:grid;grid-template-columns:274px minmax(0,1fr) 296px;gap:12px;padding:12px 18px 4px;}',
'.sq26-mgrid>*{min-height:0;overflow:hidden;}',
'@media(max-width:1200px){.sq26-mgrid{grid-template-columns:1fr;}}',
'.sq26-mcard{position:relative;border-radius:6px;overflow:hidden;background:linear-gradient(180deg,var(--sqc,#c8102e) 0%,var(--sqc,#c8102e) 46%,#0c131c 46.1%);border:1px solid rgba(255,255,255,.10);}',
'.sq26-mcard .num{position:absolute;top:8px;left:13px;font-size:36px;font-weight:800;color:rgba(255,255,255,.95);line-height:1;}',
'.sq26-mcard .club{position:absolute;top:14px;right:14px;font-size:10px;letter-spacing:1.4px;font-weight:800;color:rgba(255,255,255,.85);text-transform:uppercase;}',
'.sq26-mcard .ph{width:100%;height:31vh;min-height:150px;object-fit:cover;object-position:top center;display:block;filter:saturate(1.05);}',
'.sq26-mcard .id{padding:9px 14px 10px;background:#0c131c;}',
'.sq26-mcard .id .fn{font-size:12px;color:rgba(255,255,255,.7);letter-spacing:1px;text-transform:uppercase;}',
'.sq26-mcard .id .ln{font-size:24px;font-weight:800;color:#fff;line-height:1.05;letter-spacing:.2px;text-transform:uppercase;}',
'.sq26-mcard .id .rl{font-size:12px;color:rgba(255,255,255,.7);margin-top:5px;}',
'.sq26-mcard .id .nat{font-size:11.5px;color:rgba(255,255,255,.85);margin-top:9px;font-weight:700;}',
'.sq26-mbio{padding:2px 16px 16px;background:#0c131c;}',
'.sq26-mbio div{display:flex;justify-content:space-between;padding:6px 0;border-top:1px solid rgba(255,255,255,.07);font-size:11.5px;}',
'.sq26-mbio span{color:rgba(255,255,255,.5);letter-spacing:.8px;text-transform:uppercase;font-size:10px;align-self:center;}',
'.sq26-mbio b{color:#fff;}',
'.sq26-box{background:#0d141d;border:1px solid rgba(255,255,255,.08);border-radius:6px;padding:10px 13px;}',
'.sq26-qh{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px;}',
'.sq26-qh span{font-size:10.5px;letter-spacing:1.4px;text-transform:uppercase;color:rgba(255,255,255,.55);font-weight:800;}',
'.sq26-qh b{font-size:17px;font-weight:800;color:#fff;font-variant-numeric:tabular-nums;}',
'.sq26-q3{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;}',
'@media(max-width:900px){.sq26-q3{grid-template-columns:1fr 1fr;}}',
'.sq26-heat{position:relative;height:190px;border-radius:6px;background:#0e2c1c;border:1px solid rgba(255,255,255,.1);overflow:hidden;}',
'.sq26-heat .l{position:absolute;border:1px solid rgba(255,255,255,.16);}',
'.sq26-heat .dot{position:absolute;width:22px;height:22px;border-radius:50%;transform:translate(-50%,-50%);background:radial-gradient(circle,rgba(120,255,150,.95),rgba(60,220,120,0) 70%);}',
'.sq26-heat .dot.main{width:34px;height:34px;background:radial-gradient(circle,rgba(190,255,170,1),rgba(120,255,150,0) 72%);}',
'.sq26-rolerow{display:flex;align-items:center;gap:10px;padding:6px 0;border-top:1px solid rgba(255,255,255,.06);font-size:12px;color:#dbe6f2;}',
'.sq26-rolerow .bl{flex:1;height:4px;border-radius:3px;background:rgba(255,255,255,.12);overflow:hidden;max-width:70px;margin-left:auto;}',
'.sq26-rolerow .bl i{display:block;height:100%;background:#00c853;}',
'.sq26-rolerow b{color:#fff;font-weight:800;width:26px;text-align:right;font-variant-numeric:tabular-nums;}',
'.sq26-mstats{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:0;border:1px solid rgba(255,255,255,.08);border-radius:6px;overflow:hidden;background:#0d141d;}',
'@media(max-width:900px){.sq26-mstats{grid-template-columns:repeat(4,1fr);}}',
'.sq26-mstats div{padding:8px 6px;text-align:center;border-right:1px solid rgba(255,255,255,.07);}',
'.sq26-mstats div:last-child{border-right:none;}',
'.sq26-mstats span{display:block;font-size:9px;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,.45);margin-bottom:5px;}',
'.sq26-mstats b{font-size:17px;font-weight:800;color:#fff;font-variant-numeric:tabular-nums;}',
'.sq26-mstats b.g{color:#fff;}',
'.sq26-mbot{flex:0 0 auto;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;padding:10px 18px 14px;}',
'@media(max-width:900px){.sq26-mbot{grid-template-columns:1fr;}}',
'.sq26-gauge{width:78px;height:78px;border-radius:50%;display:grid;place-items:center;position:relative;flex:0 0 auto;}',
'.sq26-gauge i{position:absolute;inset:7px;border-radius:50%;background:#0d141d;}',
'.sq26-gauge b{position:relative;font-size:19px;font-weight:800;color:#fff;font-variant-numeric:tabular-nums;}',
'.sq26-gauge b small{display:block;font-size:7px;letter-spacing:1px;color:rgba(255,255,255,.5);text-align:center;}',
'.sq26-trait{display:block;font-size:11.5px;color:#dbe6f2;padding:4px 0;}',
'.sq26-tag{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:700;padding:3px 9px;border-radius:3px;background:rgba(0,200,83,.14);color:#5ddc93;border:1px solid rgba(0,200,83,.3);}',
'.sq26-tag.warn{background:rgba(255,159,67,.14);color:#ffb974;border-color:rgba(255,159,67,.3);border-radius:3px;}',
'.sq26-tag.bad{background:rgba(255,91,91,.14);color:#ff9b9b;border-color:rgba(255,91,91,.3);border-radius:3px;}',
'@keyframes rxUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}',
'@keyframes rxRow{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}',
'@keyframes rxCard{from{opacity:0;transform:translateY(16px) scale(.99)}to{opacity:1;transform:none}}',
'@keyframes rxSec{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}',
'@keyframes rxBar{from{transform:scaleX(0)}to{transform:scaleX(1)}}',
'.rx-grid{grid-template-columns:minmax(0,1fr) clamp(320px,25.5vw,410px)!important;gap:clamp(10px,1.1vw,16px)!important;padding:0 clamp(12px,1.5vw,24px) clamp(8px,1vh,14px)!important;}',
'@media(max-width:1180px){.rx-grid{grid-template-columns:minmax(0,1fr) 310px!important;}}',
'.rx-left{display:flex;flex-direction:column;min-height:0;min-width:0;overflow:hidden;background:linear-gradient(180deg,rgba(255,255,255,.035),rgba(255,255,255,.014));border:1px solid rgba(255,255,255,.075);border-radius:12px;padding:clamp(10px,1.5vh,18px) clamp(11px,1.1vw,18px) clamp(7px,.9vh,12px);}',
'.sq26.anim .rx-left{animation:rxUp .46s cubic-bezier(.2,.8,.25,1) both;}',
'.rx-hd{flex:none;}',
'.rx-h1{font-family:Oswald,Inter,sans-serif;font-size:clamp(19px,2.9vh,30px);font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#fff;line-height:1;}',
'.rx-sub{font-size:clamp(10px,1.25vh,12.4px);color:rgba(255,255,255,.46);margin-top:clamp(3px,.7vh,8px);letter-spacing:.01em;}',
'.rx-kpis{flex:none;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:clamp(6px,.7vw,11px);margin:clamp(8px,1.4vh,16px) 0 clamp(6px,1vh,12px);}',
'.rx-kpi{position:relative;background:rgba(255,255,255,.032);border:1px solid rgba(255,255,255,.07);border-radius:9px;padding:clamp(6px,1vh,11px) clamp(8px,.8vw,13px);overflow:hidden;}',
'.rx-kl{font-size:clamp(8px,.95vh,9.6px);letter-spacing:.11em;text-transform:uppercase;color:rgba(255,255,255,.42);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
'.rx-kv{font-family:Oswald,Inter,sans-serif;font-size:clamp(16px,2.5vh,26px);font-weight:600;color:#fff;line-height:1.1;margin-top:2px;letter-spacing:.01em;}',
'.rx-ki{position:absolute;right:9px;bottom:8px;width:clamp(11px,1.5vh,15px);height:clamp(11px,1.5vh,15px);color:rgba(255,255,255,.2);}',
'.rx-ki svg{width:100%;height:100%;display:block;}',
'.sq26.anim .rx-kpi{animation:rxUp .42s cubic-bezier(.2,.8,.25,1) both;}',
'.sq26.anim .rx-kpi:nth-child(1){animation-delay:.04s}.sq26.anim .rx-kpi:nth-child(2){animation-delay:.09s}.sq26.anim .rx-kpi:nth-child(3){animation-delay:.14s}.sq26.anim .rx-kpi:nth-child(4){animation-delay:.19s}.sq26.anim .rx-kpi:nth-child(5){animation-delay:.24s}',
'.rx-mid{flex:1 1 auto;display:flex;flex-direction:column;min-height:0;}',
'.rx-tools{flex:none;display:flex;justify-content:flex-end;gap:8px;margin-bottom:clamp(6px,.9vh,11px);}',
'.rx-dd{position:relative;}',
'.rx-ddb{display:flex;align-items:center;gap:10px;min-width:clamp(140px,13vw,196px);justify-content:space-between;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.1);border-radius:7px;color:#e8eef6;font-family:inherit;font-size:clamp(10px,1.2vh,12.2px);font-weight:500;padding:clamp(5px,.85vh,9px) clamp(9px,.8vw,13px);cursor:pointer;transition:background .16s ease,border-color .16s ease,transform .16s ease;}',
'.rx-ddb:hover{background:rgba(255,255,255,.075);border-color:rgba(255,255,255,.2);}',
'.rx-ddb:active{transform:translateY(1px);}',
'.rx-ddb svg{width:13px;height:13px;flex:none;color:rgba(255,255,255,.5);transition:transform .2s ease;}',
'.rx-dd.open .rx-ddb{background:rgba(0,230,118,.1);border-color:rgba(0,230,118,.38);}',
'.rx-dd.open .rx-ddb svg{transform:rotate(180deg);color:#2fe08a;}',
'.rx-ddp{position:absolute;top:calc(100% + 5px);right:0;left:0;z-index:40;background:#0d151f;border:1px solid rgba(255,255,255,.12);border-radius:8px;box-shadow:0 18px 40px rgba(0,0,0,.6);padding:4px;opacity:0;transform:translateY(-6px) scale(.985);pointer-events:none;transition:opacity .16s ease,transform .16s ease;max-height:min(46vh,320px);overflow:auto;}',
'.rx-dd.open .rx-ddp{opacity:1;transform:none;pointer-events:auto;}',
'.rx-ddi{font-size:clamp(10px,1.2vh,12.2px);color:#cfdae6;padding:7px 10px;border-radius:6px;cursor:pointer;transition:background .13s ease,color .13s ease;}',
'.rx-ddi:hover{background:rgba(255,255,255,.07);color:#fff;}',
'.rx-ddi.on{color:#2fe08a;background:rgba(0,230,118,.09);}',
'.rx-tbl{flex:1 1 auto;display:flex;flex-direction:column;min-height:0;border:1px solid rgba(255,255,255,.06);border-radius:10px;background:rgba(6,12,20,.34);overflow:hidden;--rxg:40px minmax(110px,1.5fr) 58px 46px 44px 96px 96px 104px clamp(96px,9vw,132px) 96px 92px 104px;}',
'.rx-th,.rx-tr{display:grid;grid-template-columns:var(--rxg);align-items:center;gap:clamp(4px,.5vw,9px);padding:0 clamp(8px,.85vw,14px);}',
'.rx-th{flex:none;height:clamp(30px,3.9vh,42px);border-bottom:1px solid rgba(255,255,255,.075);background:rgba(255,255,255,.024);}',
'.rx-th span{font-size:clamp(8.8px,1.08vh,11px);letter-spacing:.13em;text-transform:uppercase;color:rgba(255,255,255,.4);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
'.rx-tw{flex:1 1 auto;min-height:0;overflow-y:auto;overflow-x:hidden;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.16) transparent;overscroll-behavior:contain;}',
'.rx-tw::-webkit-scrollbar{width:7px;}',
'.rx-tw::-webkit-scrollbar-track{background:transparent;}',
'.rx-tw::-webkit-scrollbar-thumb{background:rgba(255,255,255,.14);border-radius:4px;}',
'.rx-tw::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,.24);}',
'.rx-tr{position:relative;height:clamp(33px,4.6vh,50px);cursor:pointer;font-size:clamp(11.4px,1.5vh,14.4px);color:#c3d0de;border-bottom:1px solid rgba(255,255,255,.032);transition:background .14s ease;}',
'.rx-tr:hover{background:rgba(255,255,255,.04);}',
'.rx-tr.on{background:linear-gradient(90deg,rgba(0,230,118,.13),rgba(0,230,118,.02));}',
'.rx-tr.on:before{content:"";position:absolute;left:0;top:0;bottom:0;width:2px;background:#00e676;}',
'.rx-tr>span{min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;}',
'.rx-c1{color:rgba(255,255,255,.42);font-variant-numeric:tabular-nums;}',
'.rx-c2{display:flex;align-items:center;gap:clamp(6px,.6vw,10px);}',
'.rx-mf{width:clamp(23px,3.1vh,32px);height:clamp(23px,3.1vh,32px);border-radius:50%;object-fit:cover;background:#101a26;flex:none;}',
'.rx-c2 b{font-weight:600;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
'.rx-c3{font-weight:700;letter-spacing:.04em;font-size:clamp(10.6px,1.4vh,13.6px);}',
'.rx-c4,.rx-c7{font-variant-numeric:tabular-nums;color:rgba(255,255,255,.72);}',
'.rx-c5 img{width:clamp(13px,1.7vh,18px);height:auto;border-radius:2px;display:block;}',
'.rx-c6{font-family:Oswald,Inter,sans-serif;font-size:clamp(13.6px,2vh,18.4px);font-weight:600;color:#2fe08a;}',
'.rx-c8{font-weight:600;}',
'.rx-c9{display:flex;align-items:center;gap:7px;}',
'.rx-bar{flex:1 1 auto;min-width:26px;height:4px;border-radius:2px;background:rgba(255,255,255,.1);overflow:hidden;display:block;}',
'.rx-bar b{display:block;height:100%;border-radius:2px;transform-origin:left center;}',
'.rx-c9 em{font-style:normal;font-variant-numeric:tabular-nums;color:rgba(255,255,255,.68);font-size:clamp(9.8px,1.28vh,12.4px);}',
'.rx-c10{font-weight:500;}',
'.rx-c11{font-variant-numeric:tabular-nums;color:#e6edf5;}',
'.rx-c12{font-variant-numeric:tabular-nums;color:rgba(255,255,255,.44);}',
'.sq26.anim .rx-tr{animation:rxRow .34s cubic-bezier(.2,.8,.25,1) both;animation-delay:calc(var(--k,0)*16ms);}',
'.sq26.anim .rx-tr .rx-bar b{animation:rxBar .5s cubic-bezier(.2,.8,.25,1) both;animation-delay:calc(.12s + var(--k,0)*16ms);}',
'.rx-none{padding:22px;text-align:center;color:rgba(255,255,255,.4);font-size:12px;}',
'.rx-leg{flex:none;display:flex;align-items:center;gap:clamp(9px,1vw,16px);padding-top:clamp(6px,.9vh,11px);font-size:clamp(9.2px,1.14vh,11.8px);letter-spacing:.11em;text-transform:uppercase;}',
'.rx-leg b{color:rgba(255,255,255,.34);font-weight:600;}',
'.rx-leg span{color:rgba(255,255,255,.5);}',
'.rx-cardwrap{min-width:0;min-height:0;display:flex;}',
'.rx-card{flex:1 1 auto;display:flex;flex-direction:column;justify-content:space-between;gap:clamp(6px,.85vh,11px);min-height:0;min-width:0;overflow-y:auto;overflow-x:hidden;padding-right:3px;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.16) transparent;overscroll-behavior:contain;}',
'.rx-card::-webkit-scrollbar{width:7px;}',
'.rx-card::-webkit-scrollbar-track{background:transparent;}',
'.rx-card::-webkit-scrollbar-thumb{background:rgba(255,255,255,.13);border-radius:4px;}',
'.sq26.anim .rx-card,.rx-card.rx-in{animation:rxCard .4s cubic-bezier(.2,.8,.25,1) both;}',
'.rx-card.rx-in .rx-hero,.rx-card.rx-in .rx-sec,.rx-card.rx-in .rx-two,.rx-card.rx-in .rx-cta,.sq26.anim .rx-card .rx-hero,.sq26.anim .rx-card .rx-sec,.sq26.anim .rx-card .rx-two,.sq26.anim .rx-card .rx-cta{animation:rxSec .36s cubic-bezier(.2,.8,.25,1) both;animation-delay:calc(var(--s,0)*38ms);}',
'.rx-hero{position:relative;flex:none;display:flex;align-items:center;gap:clamp(8px,1vw,15px);background:linear-gradient(120deg,rgba(255,255,255,.05),rgba(255,255,255,.012));border:1px solid rgba(255,255,255,.075);border-radius:12px;padding:clamp(9px,1.3vh,16px) clamp(11px,1.1vw,17px);overflow:hidden;}',
'.rx-face{position:relative;flex:none;width:clamp(74px,9vh,104px);height:clamp(62px,7.6vh,88px);}',
'.rx-fc{position:absolute;left:0;bottom:0;width:clamp(52px,6.4vh,74px);height:clamp(52px,6.4vh,74px);border-radius:50%;object-fit:cover;background:#0e1720;z-index:2;}',
'.rx-cr{position:absolute;right:0;top:2px;width:clamp(44px,5.6vh,64px);height:clamp(44px,5.6vh,64px);object-fit:contain;opacity:.5;filter:saturate(1.05);z-index:1;}',
'.rx-hi{min-width:0;flex:1 1 auto;}',
'.rx-ovr{font-family:Oswald,Inter,sans-serif;font-size:clamp(24px,4.1vh,40px);font-weight:600;color:#2fe08a;line-height:1;display:flex;align-items:flex-start;gap:6px;}',
'.rx-ovr small{font-size:clamp(9px,1.3vh,13px);font-weight:600;color:rgba(255,255,255,.55);letter-spacing:.06em;margin-top:.25em;}',
'.rx-nm{font-family:Oswald,Inter,sans-serif;font-size:clamp(15px,2.3vh,24px);font-weight:600;color:#fff;line-height:1.15;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
'.rx-age{font-size:clamp(9.6px,1.15vh,12px);color:rgba(255,255,255,.5);margin-top:2px;}',
'.rx-club{display:flex;align-items:center;gap:7px;margin-top:clamp(4px,.7vh,9px);font-size:clamp(9.6px,1.2vh,12.4px);color:#dbe6f2;}',
'.rx-club img{width:clamp(13px,1.8vh,18px);height:clamp(13px,1.8vh,18px);object-fit:contain;}',
'.rx-sec,.rx-sec2{flex:none;background:rgba(255,255,255,.026);border:1px solid rgba(255,255,255,.065);border-radius:11px;padding:clamp(8px,1.15vh,14px) clamp(10px,1vw,15px);min-width:0;}',
'.rx-sh{font-size:clamp(9px,1.12vh,11.4px);letter-spacing:.13em;text-transform:uppercase;color:rgba(255,255,255,.42);font-weight:600;margin-bottom:clamp(6px,.9vh,11px);}',
'.rx-quad{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:clamp(5px,.6vw,10px);}',
'.rx-quad>div{min-width:0;}',
'.rx-quad span{display:block;font-size:clamp(8.8px,1.08vh,11.2px);color:rgba(255,255,255,.42);letter-spacing:.02em;line-height:1.25;}',
'.rx-quad b{display:block;font-size:clamp(11.4px,1.5vh,14.8px);color:#fff;font-weight:600;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
'.rx-pano{display:grid;grid-template-columns:clamp(112px,13.5vw,180px) minmax(0,1fr);gap:clamp(8px,1vw,15px);align-items:center;}',
'.rx-pwrap{min-width:0;}',
'.rx-pitch{width:100%;height:auto;display:block;}',
'.rx-pitch .rx-pl{fill:none;stroke:rgba(255,255,255,.22);stroke-width:1;}',
'.rx-pitch .rx-pd{fill:#00e676;filter:drop-shadow(0 0 5px rgba(0,230,118,.65));}',
'.rx-pitch .rx-pd.alt{fill:rgba(0,230,118,.42);filter:none;}',
'.rx-roles{display:flex;flex-direction:column;gap:clamp(5px,.75vh,10px);min-width:0;}',
'.rx-rr{display:flex;align-items:flex-start;gap:9px;min-width:0;}',
'.rx-rr+.rx-rr{border-top:1px solid rgba(255,255,255,.055);padding-top:clamp(5px,.75vh,10px);}',
'.rx-rr i{flex:none;width:7px;height:7px;border-radius:50%;background:#00e676;margin-top:5px;box-shadow:0 0 6px rgba(0,230,118,.5);}',
'.rx-rr b{display:block;font-size:clamp(11.6px,1.52vh,15px);color:#fff;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
'.rx-rr span{display:block;font-size:clamp(9.6px,1.2vh,12.4px);color:rgba(255,255,255,.42);margin-top:1px;}',
'.rx-skills{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:clamp(4px,.5vw,8px);}',
'.rx-sk{background:rgba(255,255,255,.024);border:1px solid rgba(255,255,255,.08);border-radius:9px;padding:clamp(7px,1.05vh,13px) 3px;text-align:center;min-width:0;transition:border-color .16s ease;}',
'.rx-sk:hover{border-color:rgba(255,255,255,.2);}',
'.rx-sk span{display:block;font-size:clamp(8.4px,1.04vh,10.8px);color:rgba(255,255,255,.44);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
'.rx-sk b{display:block;font-family:Oswald,Inter,sans-serif;font-size:clamp(15px,2.2vh,22px);font-weight:600;color:#2fe08a;margin-top:2px;}',
'.rx-two{flex:none;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:clamp(6px,.7vw,11px);}',
'.rx-fv{font-size:clamp(11.6px,1.52vh,15px);color:#fff;font-weight:600;}',
'.rx-feet{display:flex;align-items:flex-end;gap:clamp(3px,.35vw,6px);margin-top:clamp(5px,.8vh,10px);}',
'.rx-ft{width:clamp(9px,1.2vh,13px);color:rgba(255,255,255,.17);display:block;}',
'.rx-ft svg{width:100%;height:auto;display:block;}',
'.rx-ft.on{color:#00e676;filter:drop-shadow(0 0 5px rgba(0,230,118,.45));}',
'.rx-stars{display:flex;gap:clamp(3px,.4vw,7px);margin-top:clamp(7px,1vh,13px);}',
'.rx-st{width:clamp(12px,1.7vh,19px);color:rgba(255,255,255,.16);display:block;}',
'.rx-st svg{width:100%;height:auto;display:block;}',
'.rx-st.on{color:#00e676;}',
'.rx-opts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:clamp(5px,.55vw,9px);}',
'.rx-op{display:flex;align-items:center;gap:clamp(7px,.7vw,11px);text-align:left;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.09);border-radius:10px;color:#e6edf5;font-family:inherit;font-size:clamp(9.8px,1.24vh,12.6px);font-weight:400;line-height:1.28;padding:clamp(8px,1.25vh,15px) clamp(8px,.8vw,13px);cursor:pointer;min-width:0;min-height:clamp(38px,5.4vh,58px);transition:background .16s ease,border-color .16s ease;}',
'.rx-op:hover{background:rgba(255,255,255,.055);border-color:rgba(255,255,255,.22);}',
'.rx-op:active{background:rgba(255,255,255,.09);}',
'.rx-oi{flex:none;width:clamp(14px,1.85vh,19px);height:clamp(14px,1.85vh,19px);color:rgba(255,255,255,.7);}',
'.rx-oi svg{width:100%;height:100%;display:block;}',
'.rx-op:hover .rx-oi{color:#fff;}',
'.rx-ol{min-width:0;}',
'.rx-rel{display:block;width:100%;text-align:left;margin-top:clamp(6px,.75vh,11px);background:rgba(239,83,80,.05);border:1px solid rgba(239,83,80,.3);border-radius:10px;color:#ff8f8b;font-family:inherit;font-size:clamp(10px,1.28vh,13px);font-weight:400;padding:clamp(9px,1.3vh,16px) clamp(10px,1vw,15px);cursor:pointer;transition:background .16s ease,border-color .16s ease;}',
'.rx-rel:hover{background:rgba(239,83,80,.16);border-color:rgba(239,83,80,.5);color:#ffb3b0;}',
'.rx-cta{flex:none;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:clamp(6px,.7vw,11px);}',
'.rx-btn{display:flex;align-items:center;justify-content:center;gap:clamp(8px,.8vw,12px);background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.1);border-radius:10px;color:#eef3f9;font-family:inherit;font-size:clamp(10.4px,1.32vh,13.4px);font-weight:500;padding:clamp(10px,1.5vh,18px) clamp(8px,.8vw,14px);cursor:pointer;min-width:0;transition:background .16s ease,border-color .16s ease;}',
'.rx-btn:hover{background:rgba(255,255,255,.07);border-color:rgba(255,255,255,.22);}',
'.rx-btn.prim{background:linear-gradient(180deg,#00e676,#00b95f);border-color:rgba(0,230,118,.5);color:#05210f;}',
'.rx-btn.prim:hover{background:linear-gradient(180deg,#1bef88,#00c667);}',
'.rx-btn .rx-oi{color:inherit;opacity:.85;}',
].join('\n');

function ensureCSS(){ if(document.getElementById('sq26-css')) return; var s=document.createElement('style'); s.id='sq26-css'; s.textContent=CSS; document.head.appendChild(s); }

/* ---------------------------------------------------------------- icone   */
var SVG={
  list:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M7 9h10M7 13h6"/></svg>',
  loan:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h13l-3-3M20 16H7l3 3"/></svg>',
  renew:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8 8 0 1 0-.5 3M20 5v6h-6"/></svg>',
  release:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/></svg>',
  dev:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 20V9M10 20V4M16 20v-7M22 20V6"/></svg>',
  clock:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  duty:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M5 20c1.5-5 4-8 7-8s5.5 3 7 8"/><circle cx="12" cy="6" r="3"/></svg>',
  clause:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 4v6c0 4.5-3.2 7.6-8 8.9C7.2 20.6 4 17.5 4 13V7z"/><path d="M9.5 12l2 2 3.5-3.8"/></svg>',
  chev:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 5l7 7-7 7"/></svg>',
  left:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M15 5l-7 7 7 7"/></svg>',
  right:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M9 5l7 7-7 7"/></svg>',
  info:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.6v.1"/></svg>',
  up:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>',
  chart:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M4 19h16M7 16V9M12 16V5M17 16v-4"/></svg>'
};

/* --------------------------------------------------------------- colori bar */
function barCol(v){ v=+v||0; return v>=85?'linear-gradient(90deg,#00e676,#00b85a)':v>=75?'linear-gradient(90deg,#8fe36b,#4fc44a)':v>=62?'linear-gradient(90deg,#ffd24a,#f0a92e)':v>=50?'linear-gradient(90deg,#ff9f43,#f0742e)':'linear-gradient(90deg,#ff5b6e,#e0384a)'; }
function attrRow(lab,v){ v=clamp(v,1,99); return '<div class="sq26-attr"><div class="t"><span>'+lab+'</span><b>'+v+'</b></div><div class="bar"><i style="width:'+v+'%;background:'+barCol(v)+'"></i></div></div>'; }
function line2(lab,v){ return '<div class="sq26-line2"><span>'+lab+'</span><b>'+clamp(v,1,99)+'</b></div>'; }

/* ------------------------------------------------------------ schede (5)  */
function tabIdx(){ if(S.sq26Tab==null) S.sq26Tab=0; return S.sq26Tab; }
window.sq26Tab=function(d,abs){
  var n=5;
  S.sq26Tab = (abs!=null)? abs : (((tabIdx()+d)%n)+n)%n;
  var b=document.getElementById('sq26-body');
  if(b){ b.innerHTML=tabBody(curX()); b.classList.remove('sw'); void b.offsetWidth; b.classList.add('sw');
    var dots=document.querySelectorAll('#sq26-dots i'); for(var i=0;i<dots.length;i++) dots[i].className=(i===S.sq26Tab?'on':'');
  } else if(typeof render==='function') render();
};

function tabBody(x){
  if(!x) return '<div style="padding:26px;color:#8ea0b5">Nessun giocatore selezionato.</div>';
  switch(tabIdx()){
    case 1: return tabContract(x);
    case 2: return tabManage(x);
    case 3: return tabAttrs(x);
    case 4: return tabCareer(x);
    default: return tabOverview(x);
  }
}

/* --- scheda 1 : panoramica (immagine 2) --- */
function tabOverview(x){
  var p=x.p, d=pdata(p);
  var val=(typeof playerPrice==='function')?playerPrice(p):0;
  var wage=(typeof playerWage==='function')?playerWage(p):40;
  var piede=(p.foot==='Left'||p.foot==='Sinistro')?'Sinistro':(p.foot==='Right'||p.foot==='Destro')?'Destro':(p.foot||'Destro');
  var g=isGK(p), A=d.attr;
  var rows=g?[['Tuffo',A['Tuffo']],['Presa',A['Presa']],['Rinvio',A['Rinvio']],['Riflessi',A['Riflessi']],['Piazzamento',A['Piazzamento']],['Velocit\u00e0',A['Accelerazione']]]
             :[['Velocit\u00e0',p.pac],['Tiro',p.sho],['Passaggio',p.pas],['Dribbling',p.dri],['Difesa',p.def],['Fisico',p.phy]];
  var main=(p.roles&&p.roles[0])||'CC';
  return ''+
    '<div class="sq26-sec">'+SVG.info+' Panoramica giocatore</div>'+
    '<div class="sq26-rows">'+
      '<div><span>Altezza</span><b>'+(p.height||182)+' cm</b></div>'+
      '<div><span>Piede</span><b>'+piede+'</b></div>'+
      '<div><span>Peso</span><b>'+d.weight+' kg</b></div>'+
      '<div><span>Numero</span><b>'+d.number+'</b></div>'+
      '<div><span>Stipendio</span><b>\u20ac'+wage.toLocaleString('it-IT')+'k/sett</b></div>'+
      '<div><span>Contratto</span><b>'+d.expiry+'</b></div>'+
      '<div><span>Valore</span><b>\u20ac'+val+'M</b></div>'+
    '</div>'+
    '<div class="sq26-sec">'+SVG.chart+' Attributi chiave</div>'+
    '<div class="sq26-attrs">'+rows.map(function(r){ return attrRow(r[0],r[1]); }).join('')+'</div>'+
    '<div class="sq26-sec">'+SVG.duty+' Ruolo e compiti</div>'+
    '<div class="sq26-duty"><div class="txt"><b>'+pName(main)+'</b><span>'+d.duty+'</span></div>'+miniPitch(p,100,62)+'</div>';
}

function rolePos(r){
  var M={POR:[8,50],DC:[24,50],TD:[26,80],TS:[26,20],ED:[52,84],ES:[52,16],CDC:[38,50],CC:[52,50],COC:[66,50],AD:[72,82],AS:[72,18],AT:[80,50],ATT:[86,50]};
  return M[r]||[52,50];
}
function miniPitch(p,w,h){
  var main=(p.roles&&p.roles[0])||'CC';
  var L='rgba(255,255,255,.26)';
  var dots=(p.roles||[main]).map(function(r,i){ var q=rolePos(r); return '<div class="dot'+(i===0?' main':'')+'" style="left:'+q[0]+'%;top:'+q[1]+'%"></div>'; }).join('');
  return '<div class="sq26-mini" style="width:'+w+'px;height:'+h+'px">'+
    '<div style="position:absolute;left:50%;top:0;bottom:0;width:1px;background:'+L+'"></div>'+
    '<div style="position:absolute;left:50%;top:50%;width:'+Math.round(h*0.34)+'px;height:'+Math.round(h*0.34)+'px;border:1px solid '+L+';border-radius:50%;transform:translate(-50%,-50%)"></div>'+
    '<div style="position:absolute;left:50%;top:50%;width:2px;height:2px;border-radius:50%;background:'+L+';transform:translate(-50%,-50%)"></div>'+
    '<div style="position:absolute;left:0;top:22%;bottom:22%;width:16%;border:1px solid '+L+';border-left:none"></div>'+
    '<div style="position:absolute;right:0;top:22%;bottom:22%;width:16%;border:1px solid '+L+';border-right:none"></div>'+
    '<div style="position:absolute;left:0;top:36%;bottom:36%;width:7%;border:1px solid '+L+';border-left:none"></div>'+
    '<div style="position:absolute;right:0;top:36%;bottom:36%;width:7%;border:1px solid '+L+';border-right:none"></div>'+
    dots+'</div>';
}

/* --- scheda 2 : contratto e stato (immagine 4) --- */
function tabContract(x){
  var p=x.p, d=pdata(p);
  var wage=(typeof playerWage==='function')?playerWage(p):40;
  var wtxt='\u20ac'+wage.toLocaleString('it-IT')+'k/sett';
  var stars=''; for(var i=0;i<5;i++) stars+= i<d.loyalty?'\u2605':'\u2606';
  syncCareer(p); seasonStats(p);
  var log=(d.contractLog||[]).slice().reverse().map(function(c){
    return '<tr><td>'+c.s+'</td><td>'+clubCell(c.club)+'</td><td>'+c.role+'</td><td style="text-align:right">\u20ac'+c.wage+'k</td></tr>';
  }).join('');
  var hist='<tr><td>'+seasonLabel(S.season||1)+'</td><td>'+clubCell(S.teamName||'')+'</td><td>'+d.status+'</td><td style="text-align:right">\u20ac'+wage+'k</td></tr>'+log;
  return ''+
    '<div class="sq26-sec">'+SVG.list+' Contratto e stato</div>'+
    '<div class="sq26-rows">'+
      '<div><span>Stato nella rosa</span><b>'+d.status+'</b></div>'+
      '<div><span>Tipo di contratto</span><b>'+d.contractType+'</b></div>'+
      '<div><span>Scadenza contratto</span><b>'+d.expiry+'</b></div>'+
      '<div><span>Stipendio</span><b>'+wtxt+'</b></div>'+
      '<div><span>Clausola rescissoria</span><b>'+(d.clause?('\u20ac'+d.clause+'M'):'\u2014')+'</b></div>'+
      '<div><span>Rinnovo automatico</span><b>'+(d.autoRenew?'S\u00ec':'No')+'</b></div>'+
      '<div><span>Anno opzione</span><b>'+(d.optionYear||'-')+'</b></div>'+
      '<div><span>Aumento annuale</span><b>'+d.raise+'%</b></div>'+
      '<div><span>Fedelt\u00e0 societaria</span><b class="sq26-stars">'+stars+'</b></div>'+
      '<div><span>Ultimo rinnovo</span><b>'+(d.lastRenew||'\u2014')+'</b></div>'+
    '</div>'+
    '<div class="sq26-sec">'+SVG.clock+' Storico contratti</div>'+
    '<table class="sq26-tbl"><thead><tr><th>Stagione</th><th>Squadra</th><th>Ruolo</th><th style="text-align:right">Ingaggio</th></tr></thead><tbody>'+hist+'</tbody></table>'+
    '<div class="sq26-btns"><button class="gh" onclick="sq26Modal()">Vedi dettagli</button><button class="ok" onclick="sq26Act(\'renew\')">Modifica contratto</button></div>';
}

/* --- scheda 3 : gestione giocatore (immagine 5) --- */
function tabManage(x){
  var p=x.p, d=pdata(p);
  function row(ic,t,s,act){ return '<div class="sq26-mrow" onclick="sq26Act(\''+act+'\')"><div class="ic">'+ic+'</div><div class="tx"><b>'+t+'</b><span>'+s+'</span></div><div class="ch">'+SVG.chev+'</div></div>'; }
  return ''+
    '<div class="sq26-sec">'+SVG.duty+' Gestione giocatore</div>'+
    row(SVG.list,'Lista trasferimenti',p.listT?'In lista trasferimenti':'Non in lista','listT')+
    row(SVG.loan,'Prestito',p.listL?'In lista prestiti':'Disponibile per il prestito','listL')+
    row(SVG.renew,'Rinnova contratto','Scadenza: '+d.expiry,'renew')+
    row(SVG.release,'Svincola giocatore','Termina il contratto','release')+
    row(SVG.dev,'Piano di sviluppo',devLabel(p),'dev')+
    row(SVG.clock,'Gestione minutaggio',d.minutes,'minutes')+
    row(SVG.duty,'Ruolo e compiti',pName((p.roles&&p.roles[0])||'CC')+' \u00b7 '+d.duty,'duty')+
    row(SVG.clause,'Clausola rescissoria',d.clause?('\u20ac'+d.clause+'M'):'Nessuna clausola','clause');
}

/* --- scheda 4 : attributi dettagliati (immagine 6) --- */
function tabAttrs(x){
  var p=x.p, d=pdata(p), A=d.attr;
  var sub=S.sq26Sub||'attr';
  var head='<div class="sq26-sec">'+SVG.chart+' Attributi dettagliati</div>'+
    '<div class="sq26-mt">'+
      '<div class="'+(sub==='attr'?'on':'')+'" onclick="sq26Sub(\'attr\')">Attributi</div>'+
      '<div class="'+(sub==='car'?'on':'')+'" onclick="sq26Sub(\'car\')">Caratteristiche</div>'+
      '<div class="'+(sub==='cmp'?'on':'')+'" onclick="sq26Sub(\'cmp\')">Confronto</div>'+
    '</div>';
  if(sub==='car'){
    var tr=d.traits.map(function(t){ return '<div class="sq26-line2"><span>'+t+'</span><b>\u2713</b></div>'; }).join('');
    return head+'<div class="sq26-grp">Caratteristiche di gioco</div>'+tr+
      '<div class="sq26-grp">Mentalit\u00e0</div>'+line2('Personalit\u00e0 \u00b7 '+d.person,A['Determinazione'])+line2('Leadership',A['Carisma'])+line2('Professionalit\u00e0',A['Concentrazione'])+line2('Adattabilit\u00e0',A['Reattivit\u00e0'])+
      '<div class="sq26-grp">Preferenze</div>'+
      '<div class="sq26-line2"><span>Piede preferito</span><b>'+((p.foot==='Left'||p.foot==='Sinistro')?'Sinistro':'Destro')+'</b></div>'+
      '<div class="sq26-line2"><span>Ruolo naturale</span><b>'+pName((p.roles&&p.roles[0])||'CC')+'</b></div>'+
      '<div class="sq26-line2"><span>Compito</span><b>'+d.duty+'</b></div>';
  }
  if(sub==='cmp'){
    var all=P().map(function(q){ return q.p; }).filter(function(q){ return q&&q.name!==p.name&&(q.roles&&q.roles[0])===(p.roles&&p.roles[0]); });
    all.sort(function(a,b){ return b.rate-a.rate; });
    var o=all[0];
    var keys=isGK(p)?['Tuffo','Presa','Riflessi','Piazzamento','Rinvio']:['Accelerazione','Finalizzazione','Pass. corto','Dribbling','Contrasto','Forza'];
    if(!o) return head+'<div style="color:#8ea0b5;font-size:12.5px;padding:8px 0">Nessun altro giocatore nello stesso ruolo per il confronto.</div>';
    var od=pdata(o);
    var rowsC=keys.map(function(k){
      var a=A[k]||p.rate, b=od.attr[k]||o.rate; var diff=a-b;
      return '<div class="sq26-line2"><span>'+k+'</span><b style="color:'+(diff>=0?'#7ee787':'#ff9b9b')+'">'+a+' <small style="opacity:.6;color:#9fb0c3">vs '+b+'</small></b></div>';
    }).join('');
    return head+'<div class="sq26-grp">Confronto con '+esc(o.name)+' ('+o.rate+')</div>'+rowsC;
  }
  var G=isGK(p)
    ? [['Portiere',['Tuffo','Presa','Riflessi','Piazzamento','Rinvio','Comando area']],['Velocit\u00e0',['Accelerazione','Vel. scatto','Vel. uscite']],['Tecnica',['Gioco coi piedi','Pass. corto','Pass. lungo']],['Mentale',['Concentrazione','Coraggio','Decisioni']],['Fisico',['Elevazione','Resistenza','Forza','Agilit\u00e0']]]
    : [['Velocit\u00e0',['Accelerazione','Vel. scatto']],['Tiro',['Pos. attacco','Finalizzazione','Pot. tiro','Tiri dist.','Tiri al volo','Rigori']],['Passaggi',['Visione','Cross','Prec. puniz.','Pass. corto','Pass. lungo','Effetto']],['Dribbling',['Agilit\u00e0','Equilibrio','Reattivit\u00e0','Contr. palla','Dribbling','Freddezza']],['Difesa',['Intercettaz.','Prec. testa','Lettura dif.','Contrasto','Scivolata']],['Fisico',['Elevazione','Resistenza','Forza','Aggressivit\u00e0']]];
  var half=Math.ceil(G.length/2);
  function col(items){ return items.map(function(gr){ return '<div class="sq26-grp">'+gr[0]+'</div>'+gr[1].map(function(k){ return line2(k,A[k]||p.rate); }).join(''); }).join(''); }
  return head+'<div class="sq26-2col"><div>'+col(G.slice(0,half))+'</div><div>'+col(G.slice(half))+'</div></div>';
}
window.sq26Sub=function(v){ S.sq26Sub=v; var b=document.getElementById('sq26-body'); if(b){ b.innerHTML=tabBody(curX()); } };
window.sq26Sub2=function(v){ S.sq26Sub2=v; var b=document.getElementById('sq26-body'); if(b){ b.innerHTML=tabBody(curX()); } };

/* --- scheda 5 : carriera (immagine 7) --- */
function tabCareer(x){
  var p=x.p, d=pdata(p), sub=S.sq26Sub2||'stat';
  var head='<div class="sq26-sec">'+SVG.clock+' Carriera</div>'+
    '<div class="sq26-mt">'+
      '<div class="'+(sub==='stat'?'on':'')+'" onclick="sq26Sub2(\'stat\')">Statistiche</div>'+
      '<div class="'+(sub==='inj'?'on':'')+'" onclick="sq26Sub2(\'inj\')">Infortuni</div>'+
      '<div class="'+(sub==='sto'?'on':'')+'" onclick="sq26Sub2(\'sto\')">Storia</div>'+
      '<div class="'+(sub==='note'?'on':'')+'" onclick="sq26Sub2(\'note\')">Note</div>'+
    '</div>';
  if(sub==='inj'){
    var cur=(S.injuries&&S.injuries[p.name])?('<div class="sq26-line2"><span>Infortunio in corso</span><b style="color:#ffb974">'+S.injuries[p.name]+' gg</b></div>'):'<div class="sq26-line2"><span>Stato attuale</span><b style="color:#7ee787">Disponibile</b></div>';
    var hs=d.injHist.map(function(h){ return '<tr><td>'+h.s+'</td><td><b>'+h.type+'</b></td><td style="text-align:right">'+h.days+' gg</td></tr>'; }).join('');
    return head+cur+'<div class="sq26-grp">Storico infortuni</div><table class="sq26-tbl"><thead><tr><th>Stagione</th><th>Tipo</th><th style="text-align:right">Assenza</th></tr></thead><tbody>'+(hs||'<tr><td colspan="3" style="color:#8ea0b5">Nessun infortunio registrato.</td></tr>')+'</tbody></table>'+
      '<div class="sq26-grp">Rischio infortunio</div><div class="sq26-line2"><span>Valutazione staff medico</span><b>'+(d.attr['Integrit\u00e0 fisica']>=78?'BASSO':d.attr['Integrit\u00e0 fisica']>=62?'MEDIO':'ALTO')+'</b></div>';
  }
  if(sub==='sto'){
    var st='<div class="sq26-line2"><span>'+seasonLabel(S.season||1)+' \u00b7 '+esc(S.teamName||'')+'</span><b>'+d.status+'</b></div>'+careerRows(d,p).map(function(s){ return '<div class="sq26-line2"><span>'+s.s+' \u00b7 '+esc(s.club)+'</span><b>'+(s.role||(s.gol+' gol \u00b7 '+s.ass+' assist'))+'</b></div>'; }).join('');
    return head+'<div class="sq26-grp">Percorso</div>'+st+
      '<div class="sq26-grp">Nazionalit\u00e0</div><div class="sq26-line2"><span>Paese</span><b>'+esc(p.nation||'-')+'</b></div>'+
      '<div class="sq26-line2"><span>Et\u00e0</span><b>'+p.age+' anni</b></div>'+
      '<div class="sq26-line2"><span>Potenziale stimato</span><b>'+(p.pot||p.rate)+'</b></div>';
  }
  if(sub==='note'){
    return head+'<div class="sq26-grp">Note dello staff</div>'+
      '<textarea id="sq26-note" oninput="sq26Note(this.value)" placeholder="Scrivi qui le tue note su '+esc(p.name)+'..." style="width:100%;min-height:150px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:12px;color:#fff;font-family:Inter,sans-serif;font-size:12.5px;padding:12px;resize:vertical;outline:none">'+esc(d.notes)+'</textarea>'+
      '<div class="sq26-line2" style="margin-top:10px"><span>Giudizio automatico</span><b>'+(p.rate>=82?'Campione affermato':p.rate>=76?'Elemento chiave':(p.pot||p.rate)-p.rate>=6?'Talento in crescita':'Buon comprimario')+'</b></div>';
  }
  syncCareer(p);
  var cur2=seasonStats(p);
  archTick();
  var CR=careerRows(d,p);
  var rows=CR.map(function(s){ return '<tr><td>'+s.s+'</td><td>'+clubCell(s.club)+'</td><td>'+s.pres+'</td><td>'+s.gol+'</td><td>'+s.ass+'</td><td>'+s.mv+'</td></tr>'; });
  if(!rows.length) rows.push('<tr><td>'+seasonLabel(S.season||1)+'</td><td>'+clubCell(S.teamName||'')+'</td><td>0</td><td>0</td><td>0</td><td>-</td></tr>');
  var tp=0, tg=0, ta=0, tmn=0, tms=0;
  CR.forEach(function(s){ if(typeof s.pres==='number') tp+=s.pres; tg+=s.gol; ta+=s.ass; if(s.mv!=='-'){ tms+=parseFloat(s.mv); tmn++; } });
  var tm=tmn?(tms/tmn):0;
  return head+'<table class="sq26-tbl"><thead><tr><th>Stagione</th><th>Squadra</th><th>Pres.</th><th>Gol</th><th>Assist</th><th>M.V.</th></tr></thead><tbody>'+rows.join('')+
    '<tr class="tot"><td>TOTALE</td><td></td><td>'+tp+'</td><td>'+tg+'</td><td>'+ta+'</td><td>'+(tmn?tm.toFixed(2):'-')+'</td></tr></tbody></table>'+
    '<div class="sq26-2col" style="margin-top:14px"><div>'+
      '<div class="sq26-grp">Riconoscimenti</div>'+
      '<div class="sq26-line2"><span>Giocatore della stagione</span><b>'+d.awards.pot+'</b></div>'+
      '<div class="sq26-line2"><span>Giovane dell\u2019anno</span><b>'+d.awards.yot+'</b></div>'+
      '<div class="sq26-line2"><span>Squadra dell\u2019anno</span><b>'+d.awards.tot+'</b></div>'+
      '<div class="sq26-line2"><span>Miglior assist stagionale</span><b>'+d.awards.assist+'</b></div>'+
      '<div class="sq26-line2"><span>Gol pi\u00f9 bello stagionale</span><b>'+d.awards.goal+'</b></div>'+
    '</div><div>'+
      '<div class="sq26-grp">Squalifiche</div>'+
      '<div class="sq26-line2"><span><i class="sq26-cy"></i> <i class="sq26-cr"></i></span><b></b></div>'+
      '<div class="sq26-line2"><span>Campionato</span><b>'+d.cards.lega.y+' / '+d.cards.lega.r+'</b></div>'+
      '<div class="sq26-line2"><span>Coppa Nazionale</span><b>'+d.cards.coppa.y+' / '+d.cards.coppa.r+'</b></div>'+
      '<div class="sq26-line2"><span>Competizione europea</span><b>'+d.cards.euro.y+' / '+d.cards.euro.r+'</b></div>'+
    '</div></div>'+
    '<div class="sq26-btns"><button class="gh" onclick="sq26Sub2(\'sto\')">Confronta giocatore</button><button class="ok" onclick="sq26Modal()">Visualizza report</button></div>';
}
window.sq26Note=function(v){ var x=curX(); if(!x) return; pdata(x.p).notes=v; };

/* ------------------------------------------------------------- azioni     */
window.sq26Act=function(a){
  var x=curX(); if(!x) return; var p=x.p, d=pdata(p);
  function t(m){ try{ toast(m); }catch(e){} }
  if(a==='listT'){ if(typeof toggleList==='function'){ toggleList(x.loc,x.idx,'T'); return; } }
  else if(a==='listL'){ if(typeof toggleList==='function'){ toggleList(x.loc,x.idx,'L'); return; } }
  else if(a==='renew'){ if(typeof renewContract==='function'){ renewContract(x.loc,x.idx); return; } }
  else if(a==='release'){ if(typeof releasePlayer==='function'){ releasePlayer(x.loc,x.idx); return; } }
  else if(a==='dev'){
    if(typeof window.kfmOpenTrain==='function'){ try{ window.kfmOpenTrain(p); }catch(e){} return; }
    t('Allenamento personalizzato non disponibile');
  }
  else if(a==='minutes'){ d.minutes=MINPLANS[(MINPLANS.indexOf(d.minutes)+1)%MINPLANS.length]; t('Minutaggio: <b>'+d.minutes+'</b>'); }
  else if(a==='duty'){ d.duty=DUTIES[(DUTIES.indexOf(d.duty)+1)%DUTIES.length]; t('Compito: <b>'+d.duty+'</b>'); }
  else if(a==='clause'){
    if(d.clause){ d.clause=null; t('Clausola rescissoria rimossa'); }
    else { var base=(typeof playerPrice==='function')?playerPrice(p):20; d.clause=Math.round(base*1.8*10)/10; t('Clausola fissata a <b>\u20ac'+d.clause+'M</b>'); }
  }
  var b=document.getElementById('sq26-body'); if(b) b.innerHTML=tabBody(curX());
};

/* ------------------------------------------------- finestra dettagli (3)  */
window.sq26Close=function(){ var o=document.getElementById('sq26-ov'); if(o){ o.style.animation='sqFade .18s ease reverse both'; setTimeout(function(){ if(o.parentNode) o.parentNode.removeChild(o); },160); } };

window.sq26Modal=function(){
  var x=curX(); if(!x) return;
  var p=x.p, d=pdata(p), A=d.attr, col=clubColor();
  var st=seasonStats(p);
  var val=(typeof playerPrice==='function')?playerPrice(p):0;
  var wage=(typeof playerWage==='function')?playerWage(p):40;
  var first=(p.name.split(' ')[0]||''), last=(p.name.split(' ').slice(1).join(' ')||p.name);
  var gk=isGK(p);
  var tec = gk
    ? [['Gioco coi piedi',A['Gioco coi piedi']],['Pass. corto',A['Pass. corto']],['Pass. lungo',A['Pass. lungo']],['Rinvio',A['Rinvio']],['Presa',A['Presa']],['Tuffo',A['Tuffo']],['Riflessi',A['Riflessi']],['Piazzamento',A['Piazzamento']],['Comando area',A['Comando area']]]
    : [['Calci d\u2019angolo',A['Calci d\u2019angolo']],['Cross',A['Cross']],['Dribbling',A['Dribbling']],['Finalizzazione',A['Finalizzazione']],['Gioco di testa',A['Gioco di testa']],['Passaggi',A['Pass. corto']],['Rigori',A['Rigori']],['Tecnica',A['Tecnica']],['Tiri da lontano',A['Tiri dist.']]];
  var men=[['Aggressivit\u00e0',A['Aggressivit\u00e0']],['Carisma',A['Carisma']],['Concentrazione',A['Concentrazione']],['Coraggio',A['Coraggio']],['Decisioni',A['Decisioni']],['Determinazione',A['Determinazione']],['Fantasia',A['Fantasia']],['Freddezza',A['Freddezza']],['Lettura gioco',A['Lettura gioco']],['Posizionamento',A['Posizionamento']],['Senza palla',A['Senza palla']],['Visione di gioco',A['Visione di gioco']]];
  var fis=[['Accelerazione',A['Accelerazione']],['Agilit\u00e0',A['Agilit\u00e0']],['Equilibrio',A['Equilibrio']],['Forza',A['Forza']],['Integrit\u00e0 fisica',A['Integrit\u00e0 fisica']],['Massima elevazione',A['Massima elevazione']],['Resistenza',A['Resistenza']],['Velocit\u00e0',A['Vel. scatto']]];
  function avg(a){ var s=0; a.forEach(function(r){ s+=(+r[1]||0); }); return Math.round(s/a.length); }
  function grp(t,a){ return '<div><div class="sq26-qh"><span>'+t+'</span><b>'+avg(a)+'</b></div>'+a.map(function(r){ return '<div class="sq26-line2"><span>'+r[0]+'</span><b>'+clamp(r[1],1,99)+'</b></div>'; }).join('')+'</div>'; }
  var roles=roleRatings(p).slice(0,5).map(function(r){ return '<div class="sq26-rolerow"><span>'+r.lab+'</span><i class="bl"><i style="width:'+r.v+'%"></i></i><b>'+r.v+'</b></div>'; }).join('');
  var dots=(p.roles||[]).map(function(r,i){ var q=rolePos(r); return '<div class="dot'+(i===0?' main':'')+'" style="left:'+q[1]+'%;top:'+(100-q[0])+'%"></div>'; }).join('');
  var risk=A['Integrit\u00e0 fisica']>=78?'BASSO':A['Integrit\u00e0 fisica']>=62?'MEDIO':'ALTO';
  var riskCls=risk==='BASSO'?'':(risk==='MEDIO'?'warn':'bad');
  var comps=[['Campionato',d.cards.lega],['Coppa Nazionale',d.cards.coppa],['Competizione europea',d.cards.euro]];
  var logo=teamLogo();
  var inj=(S.injuries&&S.injuries[p.name])?S.injuries[p.name]:0;
  var cond=inj?clamp(d.cond-30,20,100):d.cond;

  var html='<div class="sq26-ov" id="sq26-ov" style="--sqc:'+col+'" onclick="if(event.target===this) sq26Close()">'+
  '<div class="sq26-mod">'+
    '<div class="sq26-mtop">'+(logo?'<img src="'+logo+'" onerror="this.style.display=\'none\'">':'')+'<b>'+esc(S.teamName||'')+'</b>'+
      '<button class="sq26-x" onclick="sq26Close()">\u00d7</button></div>'+
    '<div class="sq26-mgrid">'+
      '<div class="sq26-mcard">'+
        '<div class="num">'+d.number+'</div><div class="club">'+esc(S.teamName||'')+'</div>'+
        '<img class="ph" src="'+(p.img||'')+'" onerror="this.style.opacity=.22">'+
        '<div class="id"><div class="fn">'+esc(first)+'</div><div class="ln">'+esc(last)+'</div>'+
          '<div class="rl">'+pName((p.roles&&p.roles[0])||'CC')+'</div>'+
          '<div class="nat">'+esc(p.nation||'')+' \u00b7 Nazionale</div></div>'+
        '<div class="sq26-mbio">'+
          '<div><span>Et\u00e0</span><b>'+p.age+'</b></div>'+
          '<div><span>Altezza</span><b>'+(p.height||182)+' cm</b></div>'+
          '<div><span>Peso</span><b>'+d.weight+' kg</b></div>'+
          '<div><span>Piede</span><b>'+((p.foot==='Left'||p.foot==='Sinistro')?'Sx':'Dx')+'</b></div>'+
          '<div><span>Numero</span><b>'+d.number+'</b></div>'+
          '<div><span>Contratto</span><b>'+d.expiry+'</b></div>'+
          '<div><span>Valore</span><b>'+money(val)+'</b></div>'+
          '<div><span>Stipendio</span><b>\u20ac'+wage.toLocaleString('it-IT')+'k/sett</b></div>'+
        '</div>'+
      '</div>'+
      '<div class="sq26-box">'+
        '<div class="sq26-qh"><span>Qualit\u00e0</span><b>'+p.rate+'</b></div>'+
        '<div class="sq26-q3">'+grp('Tecnica',tec)+grp('Mentale',men)+grp('Fisica',fis)+
          '<div><div class="sq26-qh"><span>Caratteristiche</span><b></b></div>'+
            d.traits.map(function(t){ return '<div class="sq26-trait">'+t+'</div>'; }).join('')+
            '<div class="sq26-qh" style="margin-top:16px"><span>Potenziale</span><b>'+(p.pot||p.rate)+'</b></div>'+
            '<div class="sq26-line2"><span>Stato rosa</span><b>'+d.status+'</b></div>'+
            '<div class="sq26-line2"><span>Piano sviluppo</span><b>'+d.dev+'</b></div>'+
            '<div class="sq26-line2"><span>Minutaggio</span><b>'+d.minutes+'</b></div>'+
          '</div>'+
        '</div>'+
      '</div>'+
      '<div class="sq26-box">'+
        '<div class="sq26-qh"><span>Posizione</span><b></b></div>'+
        '<div class="sq26-heat">'+
          '<div class="l" style="left:6%;top:6%;right:6%;bottom:6%"></div>'+
          '<div class="l" style="left:6%;right:6%;top:50%;height:0"></div>'+
          '<div class="l" style="left:50%;top:50%;width:52px;height:52px;border-radius:50%;transform:translate(-50%,-50%)"></div>'+
          '<div class="l" style="left:28%;right:28%;top:6%;height:30px"></div>'+
          '<div class="l" style="left:28%;right:28%;bottom:6%;height:30px"></div>'+
          dots+
        '</div>'+
        '<div class="sq26-qh" style="margin-top:16px"><span>Ruoli</span><b></b></div>'+roles+
      '</div>'+
    '</div>'+
    '<div style="padding:4px 22px 0">'+
      '<div class="sq26-qh"><span>Statistiche stagionali</span><b></b></div>'+
      '<div class="sq26-mstats">'+
        '<div><span>Presenze</span><b>'+st.pres+'</b></div>'+
        '<div><span>Gol</span><b class="g">'+st.gol+'</b></div>'+
        '<div><span>Assist</span><b class="g">'+st.ass+'</b></div>'+
        '<div><span>Minuti</span><b>'+st.mins.toLocaleString('it-IT')+'\u2019</b></div>'+
        '<div><span>% passaggi</span><b>'+st.pass+'%</b></div>'+
        '<div><span>Ammonizioni</span><b>'+st.yc+'</b></div>'+
        '<div><span>Espulsioni</span><b>'+st.rc+'</b></div>'+
        '<div><span>Media voto</span><b class="g">'+st.mv.toFixed(2)+'</b></div>'+
      '</div>'+
    '</div>'+
    '<div class="sq26-mbot">'+
      '<div class="sq26-box" style="display:flex;gap:16px;align-items:center">'+
        '<div class="sq26-gauge" style="background:conic-gradient(#00e676 '+(cond*3.6)+'deg,rgba(255,255,255,.12) 0)"><i></i><b>'+cond+'%<small>Condizione</small></b></div>'+
        '<div style="flex:1">'+
          '<div class="sq26-qh"><span>Forma fisica</span><b></b></div>'+
          '<div class="sq26-line2"><span>Forma partita</span><b>'+d.form+'%</b></div>'+
          '<div class="sq26-line2"><span>Rischio infortunio</span><b><span class="sq26-tag '+riskCls+'">'+risk+'</span></b></div>'+
          (inj?'<div class="sq26-line2"><span>Indisponibile</span><b><span class="sq26-tag bad">'+inj+' gg</span></b></div>':'')+
        '</div>'+
      '</div>'+
      '<div class="sq26-box">'+
        '<div class="sq26-qh"><span>Dinamiche</span><b></b></div>'+
        '<div class="sq26-line2"><span>Morale</span><b><span class="sq26-tag">'+d.morale+'</span></b></div>'+
        '<div class="sq26-line2"><span>Stato</span><b>'+(inj?'Infortunato':'Felice')+'</b></div>'+
        '<div class="sq26-line2"><span>Rapporto con squadra</span><b>'+d.rel+'</b></div>'+
        '<div class="sq26-line2"><span>Personalit\u00e0</span><b>'+d.person+'</b></div>'+
      '</div>'+
      '<div class="sq26-box">'+
        '<div class="sq26-qh"><span>Squalifiche</span><b></b></div>'+
        '<div class="sq26-line2"><span></span><b><span class="sq26-cards"><i class="sq26-cy"></i><i class="sq26-cr"></i></span></b></div>'+
        comps.map(function(c){ return '<div class="sq26-line2"><span>'+c[0]+'</span><b>'+c[1].y+' &nbsp; '+c[1].r+'</b></div>'; }).join('')+
      '</div>'+
    '</div>'+
  '</div></div>';

  var w=document.createElement('div'); w.innerHTML=html; document.body.appendChild(w.firstChild);
};

/* ------------------------------------------------------ SCHERMATA SQUADRA */
var NAV=[['squadra','Squadra',1],['rosa','Rosa',1],['tattiche','Tattiche',1],['piano','Piano di gioco',0],['statistiche','Statistiche',0],['formazione','Formazione',2],['ruoli','Ruoli',0],['istruzioni','Istruzioni',0]];

window.sq26Nav=function(k){
  if(k==='formazione'){ S.sq26View='formazione'; S._animOnce=true; render(); return; }
  if(k==='squadra'){ S.sq26View='squadra'; S._animOnce=true; render(); return; }
  if(k==='rosa'){ S.sq26View='rosa'; S._animOnce=true; S._sq26anim=false; render(); return; }
  /* le altre sezioni sono predisposte ma ancora non collegate */
};

function clubLogoX(n){ if(!n) return '';
  try{ if(typeof clubCrest==='function'){ var a=clubCrest(n); if(a) return a; } }catch(e){}
  try{ if(typeof tmLogo==='function'){ var t=tmLogo(n); if(t) return t; } }catch(e){}
  try{ if(typeof EADB!=='undefined'&&EADB[n]&&typeof getLogo==='function') return getLogo(EADB[n].tid,n); }catch(e){}
  try{ if(typeof clubLogo4==='function') return clubLogo4(n)||''; }catch(e){}
  return '';
}
function clubImg(n,cls){ var u=clubLogoX(n); return u?('<img class="'+(cls||'sq26-cl')+'" src="'+u+'" alt="" onerror="this.style.visibility=&quot;hidden&quot;">'):''; }
function clubCell(n){ return '<span class="sq26-clw">'+clubImg(n)+'<b>'+esc(n||'')+'</b></span>'; }

function loanBadge(p){
  if(!p||!p.loanFrom) return '';
  return '<span class="sq26-lbadge" title="In prestito da '+esc(p.loanFrom)+'"><s>\u2190</s>'+clubImg(p.loanFrom,'lg')+'</span>';
}

function statusIcon(p){
  try{
    if(window._isInjured&&window._isInjured(p.name)) return I('injury',12).replace('class="fi"','style="color:#ff8a3c;vertical-align:-2px" class="fi"');
    if(typeof _isSusp==='function'&&_isSusp(p.name)) return I('red',11).replace('class="fi"','style="color:#e0384a;vertical-align:-2px" class="fi"');
  }catch(e){}
  return '';
}

function pitchHTML(){
  var FT=window.FM_FORMATIONS2||{};
  if(!S.formationName||!FT[S.formationName]) S.formationName='4-3-3';
  var layout=FT[S.formationName]||[];
  var det=curX(), armed=S.rosaArmed;
  function isDet(loc,idx){ return det&&det.loc===loc&&det.idx===idx; }
  function isArm(loc,idx){ return armed&&armed.loc===loc&&armed.idx===idx; }
  var nodes=layout.map(function(s,id){
    var p=S.draft.xi[id];
    var t=(+s.y||50)/100; var yy=6+t*87; var xx=50+((+s.x||50)-50)*(0.70+0.30*t);
    var cls='sq26-node'+(isDet('xi',id)?' det':'')+(isArm('xi',id)?' armed':'');
    var inner;
    if(p){
      inner='<div class="sq26-card">'+loanBadge(p)+'<span class="sq26-r">'+p.rate+'</span>'+
        '<img src="'+(p.img||'')+'" onerror="this.src=(typeof AVP!==\'undefined\'?AVP:\'\')">'+
        '<span class="sq26-n">'+statusIcon(p)+esc(p.name.split(' ').pop())+'</span>'+
        '<span class="sq26-p">'+((p.roles&&p.roles[0])||s.role)+'</span></div>';
    } else {
      inner='<div class="sq26-card"><div class="sq26-empty">'+s.role+'</div></div>';
    }
    return '<div class="'+cls+'" style="left:'+xx.toFixed(2)+'%;top:'+yy.toFixed(2)+'%" '+
      'onclick="rosaClick(\'xi\','+id+')" ondblclick="rosaArm(\'xi\','+id+')">'+inner+'</div>';
  }).join('');
  var desc='';
  try{ desc=(window.FM_FORMDESC&&window.FM_FORMDESC[S.formationName])||'Equilibrata'; }catch(e){ desc='Equilibrata'; }
  return '<div class="sq26-pitchwrap"><div class="sq26-pitch">'+
    '<div class="sq26-turf">'+
      '<div class="sq26-line" style="left:3%;top:2.5%;right:3%;bottom:2.5%"></div>'+
      '<div class="sq26-line" style="left:3%;right:3%;top:50%;height:0;border-width:0 0 2px 0"></div>'+
      '<div class="sq26-line" style="left:50%;top:50%;width:24%;height:28%;border-radius:50%;transform:translate(-50%,-50%)"></div>'+'<div class="sq26-line" style="left:50%;top:50%;width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.22);border:0;transform:translate(-50%,-50%)"></div>'+
      '<div class="sq26-line" style="left:24%;right:24%;top:2.5%;height:17%"></div>'+
      '<div class="sq26-line" style="left:24%;right:24%;bottom:2.5%;height:17%"></div>'+
      '<div class="sq26-line" style="left:37%;right:37%;top:2.5%;height:7%"></div>'+
      '<div class="sq26-line" style="left:37%;right:37%;bottom:2.5%;height:7%"></div>'+
    '</div>'+
    nodes+
    '<div class="sq26-form"><b>'+S.formationName+'</b><span>'+desc+'</span></div>'+
  '</div>'+benchHTML()+'</div>';
}

function benchHTML(){
  var det=curX(), armed=S.rosaArmed;
  var cards=(S.bench||[]).map(function(p,i){
    var cls='sq26-bc'+((det&&det.loc==='bench'&&det.idx===i)?' det':'')+((armed&&armed.loc==='bench'&&armed.idx===i)?' armed':'');
    return '<div class="'+cls+'" data-bench="'+i+'" onclick="rosaClick(\'bench\','+i+')" ondblclick="rosaArm(\'bench\','+i+')">'+loanBadge(p)+
      '<img src="'+(p.img||'')+'" onerror="this.src=(typeof AVP!==\'undefined\'?AVP:\'\')">'+
      '<div><div class="bn">'+statusIcon(p)+esc(p.name.split(' ').pop())+'</div>'+
      '<div class="bp">'+((p.roles&&p.roles[0])||'')+' \u00b7 '+p.age+'a</div></div>'+
      '<div class="br">'+p.rate+'</div></div>';
  }).join('');
  var op=!!S._benchOpen;
  return '<div class="sq26-bench'+(op?' open':'')+'"><div class="sq26-bx">'+
    '<div class="sq26-bench-h" onclick="sq26Bench()">Panchina e riserve ('+((S.bench||[]).length)+')<span class="cv">'+SVG.up+'</span></div>'+
    '<div class="sq26-bench-g">'+(cards||'<div style="color:#8ea0b5;font-size:12px;padding:6px">Nessuna riserva.</div>')+'</div></div></div>';
}

window.sq26Bench=function(){ S._benchOpen=!S._benchOpen; S._sq26anim=false; render(); };

function formationPanel(){
  var FT=window.FM_FORMATIONS2||{};
  var btns=Object.keys(FT).map(function(n){
    return '<div class="sq26-mrow" onclick="setFormationLayout(\''+jq(n)+'\')" style="'+(S.formationName===n?'border-color:rgba(0,230,118,.6);background:rgba(0,230,118,.12)':'')+'">'+
      '<div class="ic">'+SVG.dev+'</div><div class="tx"><b>'+n+'</b><span>'+(S.formationName===n?'Modulo attuale':'Applica modulo')+'</span></div><div class="ch">'+SVG.chev+'</div></div>';
  }).join('');
  return '<div class="sq26-sec">'+SVG.duty+' Modulo di gioco</div>'+btns;
}

function footHTML(){
  var dots=''; for(var i=0;i<5;i++) dots+='<i class="'+(tabIdx()===i?'on':'')+'" onclick="sq26Tab(0,'+i+')"></i>';
  return '<div class="sq26-foot">'+
    '<div class="sq26-hint"><span><i>A</i>Seleziona</span><span><i>B</i>Indietro</span><span><i>X</i>Sostituzioni</span><span><i>Y</i>Scelte rapide</span></div>'+
    '<div class="sq26-pager">'+
      '<button onclick="sq26Tab(-1)" title="Scheda precedente">'+SVG.left+'</button>'+
      '<span class="sq26-rkey">R</span>'+
      '<div class="sq26-dots" id="sq26-dots">'+dots+'</div>'+
      '<button onclick="sq26Tab(1)" title="Scheda successiva">'+SVG.right+'</button>'+
    '</div></div>';
}

var NATIT={'Italia':'Italy','Spagna':'Spain','Francia':'France','Germania':'Germany','Inghilterra':'England','Galles':'Wales','Scozia':'Scotland','Brasile':'Brazil','Portogallo':'Portugal','Olanda':'Netherlands','Paesi Bassi':'Netherlands','Belgio':'Belgium','Croazia':'Croatia','Norvegia':'Norway','Danimarca':'Denmark','Svezia':'Sweden','Giappone':'Japan','Svizzera':'Switzerland','Polonia':'Poland','Turchia':'Turkey','Grecia':'Greece','Marocco':'Morocco','Algeria':'Algeria','Egitto':'Egypt','Costa d\'Avorio':'Ivory Coast','Camerun':'Cameroon','Stati Uniti':'United States','Messico':'Mexico','Cile':'Chile','Perù':'Peru','Irlanda':'Ireland','Rep. Ceca':'Czech Republic','Slovacchia':'Slovakia','Ungheria':'Hungary','Romania':'Romania','Ucraina':'Ukraine','Russia':'Russia','Nigeria':'Nigeria','Senegal':'Senegal','Ghana':'Ghana','Austria':'Austria','Colombia':'Colombia','Uruguay':'Uruguay','Argentina':'Argentina','Serbia':'Serbia','Albania':'Albania','Slovenia':'Slovenia','Finlandia':'Finland','Islanda':'Iceland','Corea del Sud':'South Korea','Australia':'Australia'};
var NATCODE={'Italy':'it','Spain':'es','France':'fr','Germany':'de','England':'gb-eng','Wales':'gb-wls','Scotland':'gb-sct','Brazil':'br','Argentina':'ar','Portugal':'pt','Netherlands':'nl','Holland':'nl','Belgium':'be','Croatia':'hr','Serbia':'rs','Norway':'no','Denmark':'dk','Sweden':'se','Japan':'jp','Senegal':'sn','Nigeria':'ng','Switzerland':'ch','Austria':'at','Poland':'pl','Turkey':'tr','Greece':'gr','Morocco':'ma','Algeria':'dz','Egypt':'eg','Ghana':'gh','Ivory Coast':'ci','Cameroon':'cm','United States':'us','USA':'us','Mexico':'mx','Colombia':'co','Uruguay':'uy','Chile':'cl','Ecuador':'ec','Peru':'pe','Paraguay':'py','Venezuela':'ve','Ireland':'ie','Czech Republic':'cz','Slovakia':'sk','Slovenia':'si','Hungary':'hu','Romania':'ro','Bulgaria':'bg','Ukraine':'ua','Russia':'ru','Albania':'al','Finland':'fi','Iceland':'is','South Korea':'kr','Australia':'au','Canada':'ca','Israel':'il','Georgia':'ge','Armenia':'am','Tunisia':'tn','Mali':'ml','Guinea':'gn','Gabon':'ga','Congo':'cg','Angola':'ao','Zambia':'zm','Kenya':'ke','South Africa':'za','Jamaica':'jm','Costa Rica':'cr','Panama':'pa','Honduras':'hn','Bosnia':'ba','Montenegro':'me','North Macedonia':'mk','Kosovo':'xk','Estonia':'ee','Latvia':'lv','Lithuania':'lt','Belarus':'by'};
function flagFor(n){
  if(!n) return '';
  var en=NATIT[n]||n;
  try{ if(typeof natFlag==='function'){ var u=natFlag(n)||natFlag(en); if(u) return u; } }catch(e){}
  var c=NATCODE[en]||NATCODE[n];
  return c?('https://flagcdn.com/w80/'+c+'.png'):'';
}

function loanBar(p){
  if(!p) return '';
  function bar(club,label,extra){
    return '<div class="sq26-loan sw">'+clubImg(club,'')+
      '<span class="tx"><span class="lb">'+label+'</span><span class="lc">'+esc(club)+'</span></span>'+
      (extra?('<span class="rt">'+extra+'</span>'):'')+'</div>';
  }
  if(p.loanFrom){
    var ex='';
    if(p.loanYears) ex='Rientro<b>'+(year()+(+p.loanYears||0))+'</b>';
    else ex='Rientro<b>'+(year()+1)+'</b>';
    return bar(p.loanFrom,'In prestito da',ex);
  }
  if(p.loanTo) return bar(p.loanTo,'Ceduto in prestito a','');
  return '';
}

function panelHTML(){
  var x=curX();
  var view=S.sq26View||'squadra';
  var head, body;
  if(!x){
    head='<div class="sq26-ph"><div class="sq26-pnm">Nessun giocatore</div></div>';
    body='<div style="padding:24px;color:#8ea0b5">Aggiungi giocatori alla rosa.</div>';
  } else {
    var p=x.p, d=pdata(p);
    var fl=''; try{ var _fu=flagFor(p.nation); if(_fu) fl='<img class="sq26-flag" src="'+_fu+'" onerror="this.style.display=\'none\'">'; }catch(e){}
    head='<div class="sq26-ph sw">'+
      '<img class="face" src="'+(p.img||'')+'" onerror="this.src=(typeof AVP!==\'undefined\'?AVP:\'\')">'+
      '<div class="sq26-phi"><div class="sq26-ovr">'+p.rate+'<small>'+((p.roles&&p.roles[0])||'')+'</small></div>'+
        '<div class="sq26-pnm">'+esc(p.name.split(' ').pop())+'</div>'+
        '<div class="sq26-pmeta">'+fl+p.age+' anni \u00b7 '+esc(p.nation||'')+'</div></div>'+
      '<button class="sq26-info" onclick="sq26Modal()">'+SVG.info+' Vedi Dettagli</button></div>'+loanBar(p);
    body='<div class="sq26-body sw" id="sq26-body">'+(view==='formazione'?formationPanel():tabBody(x))+'</div>';
  }
  return '<div class="sq26-panel">'+head+body+'</div>';
}

function sq26Limit(el){
  var vh=window.innerHeight, lim=vh;
  if(true) return vh-20;
  try{
    var q=[], i=0;
    for(i=0;i<document.body.children.length;i++) q.push({n:document.body.children[i],d:0});
    var guard=0;
    while(q.length&&guard++<900){
      var it=q.shift(), nd=it.n;
      if(!nd||nd.nodeType!==1) continue;
      if(nd===el) continue;
      var cs=null; try{ cs=getComputedStyle(nd); }catch(e){ continue; }
      if(!cs||cs.display==='none'||cs.visibility==='hidden') continue;
      var rr=nd.getBoundingClientRect();
      if(nd.contains(el)){
        if(it.d<6){ for(i=0;i<nd.children.length;i++) q.push({n:nd.children[i],d:it.d+1}); }
        continue;
      }
      if(rr.height>4&&rr.height<170&&rr.width>window.innerWidth*0.35&&rr.top>vh*0.5&&rr.bottom>=vh-14){
        if(rr.top<lim) lim=rr.top;
        continue;
      }
      if(it.d<6&&rr.height>0){ for(i=0;i<nd.children.length;i++) q.push({n:nd.children[i],d:it.d+1}); }
    }
  }catch(e){}
  if(lim>vh) lim=vh;
  if(lim<vh*0.5) lim=vh;
  return lim;
}
var SQFIT=null;
function sq26Fit(force){
  var el=document.querySelector('.sq26'); if(!el) return;
  var vk=window.innerWidth+'x'+window.innerHeight;
  if(!force && SQFIT && SQFIT.k===vk && SQFIT.h>0){
    el.style.setProperty('height',SQFIT.h+'px','important');
    el.style.setProperty('max-height',SQFIT.h+'px','important');
    el.style.setProperty('min-height','0px','important');
    if(SQFIT.n) el.style.setProperty('--sqn',SQFIT.n);
    sq26Lock(true);
    /* verifica: se con la cache qualcosa sfora, rifaccio la misura completa */
    try{
      var rc=el.getBoundingClientRect(), lc=sq26Limit(el);
      if(rc.bottom-lc<=1) return;
    }catch(e2){ return; }
  }
  el.style.setProperty('height','auto','important');
  el.style.setProperty('max-height','none','important');
  var r=el.getBoundingClientRect();
  var lim=sq26Limit(el);
  var avail=lim-r.top-12;
  try{
    var par=el.parentElement;
    if(par){ var cs2=getComputedStyle(par); avail-=parseFloat(cs2.paddingBottom||0)||0; }
  }catch(e){}
  if(avail<380) avail=380;
  el.style.setProperty('height',avail+'px','important');
  el.style.setProperty('max-height',avail+'px','important');
  el.style.setProperty('min-height','0px','important');
  /* correzione: se qualcosa sfora ancora, riduco dell'esatto sforamento */
  try{
    for(var pass=0;pass<6;pass++){
      var rb=el.getBoundingClientRect();
      var over=rb.bottom-lim;
      if(over<=0.6) break;
      avail=Math.max(380,avail-Math.ceil(over)-2);
      el.style.setProperty('height',avail+'px','important');
      el.style.setProperty('max-height',avail+'px','important');
    }
  }catch(e){}
  sq26Lock(true);
  try{
    var pt=el.querySelector('.sq26-pitch');
    if(pt){
      var pr=pt.getBoundingClientRect();
      var n=Math.min(72+pr.height*0.052,pr.width*0.118);
      if(n<96) n=96; if(n>132) n=132;
      el.style.setProperty('--sqn',Math.round(n)+'px');
    }
  }catch(e){}
  SQFIT={k:vk,h:avail,n:el.style.getPropertyValue('--sqn')};
  try{ delete S._sq26fit; }catch(e){}
}
var SQLOCKED=[];
function sq26Lock(on){
  try{
    var h=document.documentElement, b=document.body;
    if(on){
      h.style.overflow='hidden'; h.style.height='100%'; h.style.maxHeight='100%';
      b.style.overflow='hidden'; b.style.height='100%'; b.style.maxHeight='100%';
      var el=document.querySelector('.sq26'), n=el?el.parentElement:null, g=0;
      while(n&&n!==b&&g++<10){
        if(SQLOCKED.indexOf(n)<0){ SQLOCKED.push(n); n.setAttribute('data-sq26lk','1'); }
        n.style.overflow='hidden'; n.style.maxHeight='100vh';
        n=n.parentElement;
      }
      if(h.scrollTop) h.scrollTop=0;
      if(b.scrollTop) b.scrollTop=0;
    } else {
      h.style.overflow=''; h.style.height=''; h.style.maxHeight='';
      b.style.overflow=''; b.style.height=''; b.style.maxHeight='';
      SQLOCKED.forEach(function(n){ try{ n.style.overflow=''; n.style.maxHeight=''; n.removeAttribute('data-sq26lk'); }catch(e){} });
      SQLOCKED=[];
    }
  }catch(e){}
}
function sq26Scrollable(t){
  try{ return !!(t&&t.closest&&t.closest('#sq26-ov,#kfm-tr,.kt-wrap,textarea,.sq26-scroll,.rx-tw,.rx-card,.rx-ddp,.rx-mid')); }catch(e){ return false; }
}
try{
  if(!window.__sq26wheel){
    window.__sq26wheel=true;
    document.addEventListener('wheel',function(e){
      try{
        if(typeof S==='undefined'||S.mode!=='rosa') return;
        if(sq26Scrollable(e.target)) return;
        if(e.cancelable) e.preventDefault();
      }catch(err){}
    },{passive:false});
    document.addEventListener('touchmove',function(e){
      try{
        if(typeof S==='undefined'||S.mode!=='rosa') return;
        if(sq26Scrollable(e.target)) return;
        if(e.cancelable) e.preventDefault();
      }catch(err){}
    },{passive:false});
    document.addEventListener('keydown',function(e){
      try{
        if(typeof S==='undefined'||S.mode!=='rosa') return;
        if(sq26Scrollable(e.target)) return;
        var k=e.key;
        if(k===' '||k==='PageDown'||k==='PageUp'||k==='Home'||k==='End') e.preventDefault();
      }catch(err){}
    },true);
  }
}catch(e){}
window.sq26Lock=sq26Lock;
try{
  if(!window.__sq26lockbound){
    window.__sq26lockbound=true;
    setInterval(function(){
      try{
        var on=!!document.querySelector('.sq26');
        if(!on){ if(SQLOCKED.length||document.body.style.overflow==='hidden') sq26Lock(false); return; }
        if(document.getElementById('kfm-tr')) return;
        if(document.body.style.overflow!=='hidden') sq26Lock(true);
      }catch(e){}
    },500);
  }
}catch(e){}
window.sq26Fit=sq26Fit;
function sq26FitSoon(){
  if(typeof requestAnimationFrame!=='function'){ setTimeout(sq26Fit,30); return; }
  var cached=!!(SQFIT && SQFIT.k===(window.innerWidth+'x'+window.innerHeight) && SQFIT.h>0);
  if(cached){ sq26Fit(); return; }
  requestAnimationFrame(function(){ requestAnimationFrame(function(){ sq26Fit(true); }); });
}
try{ if(!window.__sq26fitbound){ window.__sq26fitbound=true; window.addEventListener('resize',function(){ sq26Fit(true); }); } }catch(e){}

/* ============================ SEZIONE ROSA (RX) ============================ */
function rxWageM(p){ var w=(typeof playerWage==='function')?playerWage(p):40; return (w*52/1000); }
function rxWage(p){ return '\u20ac'+(rxWageM(p)).toFixed(1)+'M'; }
function rxPot(p){
  if(p.pot) return +p.pot;
  var d=null; try{ d=pdata(p); }catch(e){}
  if(d&&d._pot) return d._pot;
  var r=rng(seed((p.name||'')+'|pot'));
  var a=+p.age||25, head=(a<=19?10:a<=21?8:a<=23?6:a<=26?3:a<=29?1:0);
  var v=clamp((p.rate||60)+(head?1+Math.floor(r()*head):0),40,94);
  if(v<(p.rate||60)) v=p.rate||60;
  if(d) d._pot=v;
  return v;
}
function rxWeak(p){
  var d=null; try{ d=pdata(p); }catch(e){}
  if(d&&d._wf) return d._wf;
  var r=rng(seed((p.name||'')+'|wf')), v=2+Math.floor(r()*3);
  if(d) d._wf=v;
  return v;
}
var RXCOL={cru:'#2fe08a',imp:'#3d9dff',rot:'#6fd0e8',pro:'#9ee06a',out:'#ffa726',inj:'#ef5350'};
function rxStatus(p,d){
  try{ if(typeof window._isInjured==='function'&&window._isInjured(p)) return ['Infortunato','inj']; }catch(e){}
  if(p.listT) return ['Fuori rosa','out'];
  var s=(d&&d.status)||'';
  if(s==='Stella') return ['Cruciale','cru'];
  if(s==='Titolare') return ['Importante','imp'];
  if(s==='Rotazione') return ['Rotazione','rot'];
  return ['Promessa','pro'];
}
function rxMorale(d){
  var m=(d&&d.morale)||'Sereno', c='#c9d6e4';
  if(/felice|ottim|entus|alto/i.test(m)) c='#2fe08a';
  else if(/seren|neutr|norm|stabil/i.test(m)) c='#ffc046';
  else if(/nervos|scont|infel|frustr|basso/i.test(m)) c='#ef5350';
  return [m,c];
}
function rxCondCol(v){ return v>=88?'#2fe08a':v>=75?'#9ee06a':v>=60?'#ffc046':'#ef5350'; }
function rxRoleCol(r){
  if(r==='POR') return '#ffb74d';
  if(r==='TD'||r==='DC'||r==='TS') return '#4fa8ff';
  if(r==='CDC'||r==='CC'||r==='COC') return '#2fe08a';
  return '#ff7a6b';
}
function rxZone(r){
  if(r==='POR') return 'Porta';
  if(r==='TD'||r==='DC'||r==='TS') return 'Difesa';
  if(r==='CDC') return 'Mediana';
  if(r==='CC'||r==='COC') return 'Centrocampo';
  if(r==='ED'||r==='ES'||r==='AD'||r==='AS') return 'Fascia offensiva';
  return 'Attacco';
}
function rxRows(){
  var out=P().map(function(x,i){ return {i:i,x:x,p:x.p,d:pdata(x.p)}; });
  var role=S.rxRole||'';
  if(role) out=out.filter(function(o){ return ((o.p.roles&&o.p.roles[0])||'')===role; });
  var ord=['POR','TD','DC','TS','CDC','CC','COC','ED','ES','AD','AS','AT','ATT'];
  var s=S.rxSort||'ruolo';
  out.sort(function(a,b){
    if(s==='val') return (b.p.rate||0)-(a.p.rate||0);
    if(s==='pot') return rxPot(b.p)-rxPot(a.p);
    if(s==='eta') return (a.p.age||0)-(b.p.age||0);
    if(s==='nome') return String(a.p.name).localeCompare(String(b.p.name));
    if(s==='stip') return rxWageM(b.p)-rxWageM(a.p);
    if(s==='num') return ((a.d&&a.d.number)||99)-((b.d&&b.d.number)||99);
    var ra=ord.indexOf((a.p.roles&&a.p.roles[0])||''), rb=ord.indexOf((b.p.roles&&b.p.roles[0])||'');
    if(ra<0) ra=99; if(rb<0) rb=99;
    if(ra!==rb) return ra-rb;
    return (b.p.rate||0)-(a.p.rate||0);
  });
  return out;
}

/* ----------------------------------------------------------- icone (line art) */
function rxSv(d,sw){ return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="'+(sw||1.6)+'" stroke-linecap="round" stroke-linejoin="round">'+d+'</svg>'; }
var RXIC={
  players:rxSv('<circle cx="9" cy="8" r="3.1"/><path d="M3 19c0-3.2 2.7-5.2 6-5.2s6 2 6 5.2"/><path d="M16 6.2a3 3 0 0 1 0 5.6"/><path d="M17.6 19c0-2.5-.9-4.1-2.3-5"/>'),
  clock:rxSv('<circle cx="12" cy="12" r="8"/><path d="M12 7.6V12l3.2 2"/>'),
  flag:rxSv('<path d="M6 3v18"/><path d="M6 4.5h11l-1.6 3.6L17 12H6z"/>'),
  chart:rxSv('<path d="M4 19h16"/><path d="M7.5 19v-6M12 19V7M16.5 19v-9"/>'),
  wallet:rxSv('<rect x="3.5" y="6" width="17" height="12.5" rx="2.4"/><path d="M3.5 10h17"/><circle cx="16.5" cy="14.2" r="1.2"/>'),
  chev:rxSv('<path d="m7 10 5 5 5-5"/>',1.8),
  price:rxSv('<ellipse cx="12" cy="7" rx="6.4" ry="2.6"/><path d="M5.6 7v4.4c0 1.4 2.9 2.6 6.4 2.6s6.4-1.2 6.4-2.6V7"/><path d="M5.6 11.6V16c0 1.4 2.9 2.6 6.4 2.6s6.4-1.2 6.4-2.6v-4.4"/>'),
  renew:rxSv('<path d="M6 3.5h8.5L18.5 8v12.5H6z"/><path d="M14 3.5V8h4.5"/><path d="M9 15.4h5.2"/><path d="M12.6 13.4l1.9 2-1.9 2"/>'),
  dev:rxSv('<path d="M4 18.5l4.8-5.6 3.5 2.6L20 7"/><path d="M20 11.4V7h-4.4"/>'),
  listT:rxSv('<path d="M3.5 11.6 12 4.4l8.5 7.2"/><path d="M6 10.6v9h12v-9"/><path d="M10.2 19.6v-5h3.6v5"/>'),
  listL:rxSv('<path d="M4 8.6h12.4l-2.7-2.7"/><path d="M20 15.4H7.6l2.7 2.7"/>'),
  shirt:rxSv('<path d="M9.2 3.6 12 5.4l2.8-1.8 4.6 2.6-1.8 3.7-1.4-.8v11.3H7.8V9.1l-1.4.8L4.6 6.2z"/>'),
  release:rxSv('<circle cx="10" cy="8.4" r="3.2"/><path d="M4 19.6c0-3.2 2.7-5.4 6-5.4 1.2 0 2.3.3 3.2.8"/><path d="m16.4 14.8 4.2 4.2M20.6 14.8l-4.2 4.2"/>'),
  cmp:rxSv('<path d="M12 4.4v15.2"/><path d="M5 8h14"/><path d="M8.2 8 5 14.4h6.4z"/><path d="M15.8 8 12.6 14.4H19z"/>'),
  rep:rxSv('<path d="M4.6 19.4h14.8"/><path d="M8 19.4v-6.6M12 19.4V6.4M16 19.4v-4.4"/>',1.9),
  foot:'<svg viewBox="0 0 26 46" fill="currentColor"><path d="M13 43.6c-4.1 0-6.9-3-6.9-7.2 0-2.7 1.6-4.2 1.6-6.6 0-2.6-1.4-4.5-1.4-7.5 0-4.3 2.7-7.5 6.7-7.5s6.7 3.2 6.7 7.5c0 3-1.4 4.9-1.4 7.5 0 2.4 1.6 3.9 1.6 6.6 0 4.2-2.8 7.2-6.9 7.2z"/><circle cx="7.4" cy="9.6" r="3"/><circle cx="12.4" cy="6.6" r="2.9"/><circle cx="17.4" cy="7.6" r="2.6"/><circle cx="21.4" cy="11.2" r="2.2"/></svg>',
  star:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="m12 3.6 2.66 5.62 6.04.82-4.4 4.32 1.08 6.04L12 17.5l-5.38 2.9 1.08-6.04-4.4-4.32 6.04-.82z"/></svg>'
};

/* -------------------------------------------------------- mini campo (AAA) */
var RXPOS={POR:[10,42],TD:[30,68],DC:[30,42],TS:[30,16],CDC:[48,42],CC:[60,42],COC:[74,42],ED:[76,68],ES:[76,16],AD:[98,66],AS:[98,18],AT:[104,42],ATT:[104,42]};
function rxFootIt(p){ var f=String(p.foot||''); return /sinistr|left|^l$/i.test(f)?'Sinistro':'Destro'; }
function rxPitch(p){
  var roles=(p.roles||[]).slice(0,3), dots='';
  roles.forEach(function(r,k){
    var q=RXPOS[r]||[60,42];
    dots+='<circle class="rx-pd'+(k?' alt':'')+'" cx="'+q[0]+'" cy="'+q[1]+'" r="'+(k?3.4:4.4)+'"/>';
  });
  return '<svg class="rx-pitch" viewBox="0 0 116 84" preserveAspectRatio="xMidYMid meet">'+
    '<rect class="rx-pl" x="1" y="1" width="114" height="82"/>'+
    '<path class="rx-pl" d="M58 1V83"/>'+
    '<circle class="rx-pl" cx="58" cy="42" r="12"/>'+
    '<rect class="rx-pl" x="1" y="24" width="17" height="36"/>'+
    '<rect class="rx-pl" x="98" y="24" width="17" height="36"/>'+
    dots+'</svg>';
}

/* ------------------------------------------------------------------ handlers */
function rxEl(id){ return document.getElementById(id); }
function rxRefreshCard(anim){
  var w=rxEl('rx-cardwrap'); if(!w) return false;
  w.innerHTML=rxCardInner();
  if(anim){ var c=w.firstChild; if(c&&c.classList){ c.classList.remove('rx-in'); void c.offsetWidth; c.classList.add('rx-in'); } }
  return true;
}
function rxRefreshMid(){ var m=rxEl('rx-mid'); if(!m) return false; m.innerHTML=rxMidInner(); return true; }
function rxMarkRow(i){
  try{
    var trs=document.querySelectorAll('#rx-tw .rx-tr');
    for(var j=0;j<trs.length;j++){
      if(+trs[j].getAttribute('data-i')===i) trs[j].classList.add('on'); else trs[j].classList.remove('on');
    }
  }catch(e){}
}
window.rosaXSel=function(i){
  i=+i;
  if(S.rosaDetIdx===i){ return; }
  S.rosaDetIdx=i;
  S._sq26anim=true;
  rxMarkRow(i);
  if(!rxRefreshCard(true)&&typeof render==='function') render();
};
window.rxDD=function(k,ev){
  try{ ev.stopPropagation(); }catch(e){}
  var el=rxEl('rx-dd-'+k); if(!el) return;
  var open=el.classList.contains('open');
  var all=document.querySelectorAll('.rx-dd.open');
  for(var j=0;j<all.length;j++) all[j].classList.remove('open');
  if(!open) el.classList.add('open');
};
try{
  if(!window.__rxddbound){
    window.__rxddbound=true;
    document.addEventListener('click',function(e){
      try{
        if(e.target&&e.target.closest&&e.target.closest('.rx-dd')) return;
        var all=document.querySelectorAll('.rx-dd.open');
        for(var j=0;j<all.length;j++) all[j].classList.remove('open');
      }catch(err){}
    });
  }
}catch(e){}
window.rosaXRole=function(v){
  S.rxRole=v||''; S._sq26anim=true;
  if(!rxRefreshMid()&&typeof render==='function') render();
};
window.rosaXSort=function(v){
  S.rxSort=v||'ruolo'; S._sq26anim=true;
  if(!rxRefreshMid()&&typeof render==='function') render();
};
window.rosaXCmp=function(){ S.sq26Tab=3; if(typeof sq26Modal==='function') sq26Modal(); };
window.rosaXAct=function(a){
  var x=curX(); if(!x) return; var p=x.p, d=pdata(p);
  function t(m){ try{ toast(m); }catch(e){} }
  S._sq26anim=true;
  if(a==='price'){
    var base=(typeof playerPrice==='function')?playerPrice(p):20;
    var steps=[1,1.2,1.5,2,0.85];
    d._askIx=((d._askIx==null?0:d._askIx)+1)%steps.length;
    d.askPrice=Math.round(base*steps[d._askIx]*10)/10;
    t('Prezzo richiesto: <b>\u20ac'+d.askPrice+'M</b>');
    rxRefreshCard(false);
    return;
  }
  if(a==='number'){
    var used={}; P().forEach(function(q){ var dd=pdata(q.p); if(dd) used[dd.number]=1; });
    var pool=isGK(p)?[1,12,22,31]:[2,3,4,5,6,7,8,9,10,11,14,17,18,19,20,21,23,24,27,30,33,77,99];
    var free=pool.filter(function(n){ return !used[n]; });
    if(!free.length){ t('Nessun numero di maglia disponibile'); return; }
    d.number=free[Math.floor(Math.random()*free.length)];
    t('Nuovo numero di maglia: <b>'+d.number+'</b>');
    rxRefreshCard(false); rxRefreshMid();
    return;
  }
  if(typeof window.sq26Act==='function') window.sq26Act(a);
  if(document.getElementById('rx-cardwrap')){ rxRefreshCard(false); rxRefreshMid(); }
  else if(typeof render==='function') render();
};

/* -------------------------------------------------------------- lista (left) */
function rxKpiHTML(){
  var all=P(), n=all.length;
  var age=n?(all.reduce(function(s,x){ return s+(+x.p.age||0); },0)/n):0;
  var nat=0, mx=0, tot=0;
  all.forEach(function(x){
    var w=rxWageM(x.p); tot+=w; if(w>mx) mx=w;
    if(/ital/i.test(String(x.p.nation||''))) nat++;
  });
  function kpi(lab,val,ic){
    return '<div class="rx-kpi"><div class="rx-kl">'+lab+'</div><div class="rx-kv">'+val+'</div><span class="rx-ki">'+ic+'</span></div>';
  }
  return '<div class="rx-kpis">'+
    kpi('Giocatori',n,RXIC.players)+
    kpi('Et\u00e0 media',(Math.round(age*10)/10).toFixed(1),RXIC.clock)+
    kpi('Giocatori nazionali',nat,RXIC.flag)+
    kpi('Massimo stipendio','\u20ac'+mx.toFixed(1)+'M',RXIC.chart)+
    kpi('Fondo stipendi','\u20ac'+tot.toFixed(1)+'M',RXIC.wallet)+
  '</div>';
}
function rxDDHTML(k,label,cur,opts,fn){
  var lab='';
  opts.forEach(function(o){ if(o[0]===cur) lab=o[1]; });
  if(!lab) lab=opts[0][1];
  var items=opts.map(function(o){
    return '<div class="rx-ddi'+(o[0]===cur?' on':'')+'" onclick="'+fn+'(\''+o[0]+'\')">'+o[1]+'</div>';
  }).join('');
  return '<div class="rx-dd" id="rx-dd-'+k+'">'+
    '<button class="rx-ddb" onclick="rxDD(\''+k+'\',event)"><span>'+(label?label+' ':'')+lab+'</span>'+RXIC.chev+'</button>'+
    '<div class="rx-ddp">'+items+'</div></div>';
}
function rxToolsHTML(){
  var roles=[['','Tutti i ruoli']];
  var seen={}, ord=['POR','TD','DC','TS','CDC','CC','COC','ED','ES','AD','AS','AT','ATT'];
  P().forEach(function(x){ var r=(x.p.roles&&x.p.roles[0])||''; if(r) seen[r]=1; });
  ord.forEach(function(r){ if(seen[r]) roles.push([r,pName(r)]); });
  var sorts=[['ruolo','Ruolo'],['val','Valutazione'],['pot','Potenziale'],['eta','Et\u00e0'],['nome','Nome'],['stip','Stipendio'],['num','Numero']];
  return '<div class="rx-tools">'+
    rxDDHTML('role','',S.rxRole||'',roles,'rosaXRole')+
    rxDDHTML('sort','Ordina per:',S.rxSort||'ruolo',sorts,'rosaXSort')+
  '</div>';
}
function rxTableInner(){
  var rows=rxRows(), cur=S.rosaDetIdx;
  var heads=['N.','Giocatore','Ruolo','Et\u00e0','Naz','Valutazione','Potenziale','Stato','Forma fisica','Morale','Stipendio','Contratto'];
  var head='<div class="rx-th">'+heads.map(function(h){ return '<span>'+h+'</span>'; }).join('')+'</div>';
  var body=rows.map(function(o,k){
    var p=o.p, d=o.d||{}, st=rxStatus(p,d), mo=rxMorale(d);
    var r=(p.roles&&p.roles[0])||'';
    var cond=Math.round(d.cond!=null?d.cond:90);
    var fl=''; try{ var fu=flagFor(p.nation); if(fu) fl='<img src="'+fu+'" onerror="this.style.display=\'none\'">'; }catch(e){}
    var nm=String(p.name||''), sn=nm.indexOf(' ')>0?nm.split(' ').slice(1).join(' '):nm;
    return '<div class="rx-tr'+(o.i===cur?' on':'')+'" data-i="'+o.i+'" style="--k:'+k+'" onclick="rosaXSel('+o.i+')">'+
      '<span class="rx-c1">'+(d.number||'\u2013')+'</span>'+
      '<span class="rx-c2"><img class="rx-mf" src="'+(p.img||'')+'" onerror="this.src=(typeof AVP!==\'undefined\'?AVP:\'\')" referrerpolicy="no-referrer"><b>'+esc(sn)+'</b></span>'+
      '<span class="rx-c3" style="color:'+rxRoleCol(r)+'">'+esc(r)+'</span>'+
      '<span class="rx-c4">'+(p.age||'')+'</span>'+
      '<span class="rx-c5">'+fl+'</span>'+
      '<span class="rx-c6">'+(p.rate||'')+'</span>'+
      '<span class="rx-c7">'+rxPot(p)+'</span>'+
      '<span class="rx-c8" style="color:'+RXCOL[st[1]]+'">'+st[0]+'</span>'+
      '<span class="rx-c9"><i class="rx-bar"><b style="width:'+cond+'%;background:'+rxCondCol(cond)+'"></b></i><em>'+cond+'%</em></span>'+
      '<span class="rx-c10" style="color:'+mo[1]+'">'+esc(mo[0])+'</span>'+
      '<span class="rx-c11">'+rxWage(p)+'</span>'+
      '<span class="rx-c12">'+esc(d.expiry||'')+'</span>'+
    '</div>';
  }).join('');
  return head+'<div class="rx-tw" id="rx-tw">'+(body||'<div class="rx-none">Nessun giocatore con questo filtro</div>')+'</div>';
}
function rxMidInner(){ return rxToolsHTML()+'<div class="rx-tbl">'+rxTableInner()+'</div>'; }
function rxLegendHTML(){
  var L=[['cru','Cruciale'],['imp','Importante'],['rot','Rotazione'],['pro','Promessa'],['out','Fuori rosa'],['inj','Infortunato']];
  return '<div class="rx-leg"><b>Stato giocatore</b>'+L.map(function(l){
    return '<span style="color:'+RXCOL[l[0]]+'">'+l[1]+'</span>';
  }).join('')+'</div>';
}
function rosaListHTML(){
  return '<div class="rx-left">'+
    '<div class="rx-hd"><div class="rx-h1">Rosa</div>'+
    '<div class="rx-sub">Gestisci la rosa della prima squadra. Analizza i giocatori, la profondit\u00e0 e lo stato fisico.</div></div>'+
    rxKpiHTML()+
    '<div class="rx-mid" id="rx-mid">'+rxMidInner()+'</div>'+
    rxLegendHTML()+
  '</div>';
}

/* --------------------------------------------------------- scheda giocatore */
function rxCardInner(){
  var x=curX();
  if(!x) return '<div class="rx-card"><div class="rx-none">Nessun giocatore</div></div>';
  var p=x.p, d=pdata(p)||{};
  var r=(p.roles&&p.roles[0])||'';
  var crest=''; try{ crest=teamLogo()||''; }catch(e){}
  var nm=String(p.name||''), sn=nm.indexOf(' ')>0?nm.split(' ').slice(1).join(' '):nm;
  var s=0;
  function sec(title,inner,cls){ s++; return '<div class="rx-sec '+(cls||'')+'" style="--s:'+s+'"><div class="rx-sh">'+title+'</div>'+inner+'</div>'; }

  var hero='<div class="rx-hero" style="--s:0">'+
    '<div class="rx-face">'+
      '<img class="rx-cr" src="'+crest+'" onerror="this.style.display=\'none\'" referrerpolicy="no-referrer">'+
      '<img class="rx-fc" src="'+(p.img||'')+'" onerror="this.src=(typeof AVP!==\'undefined\'?AVP:\'\')" referrerpolicy="no-referrer">'+
    '</div>'+
    '<div class="rx-hi">'+
      '<div class="rx-ovr">'+(p.rate||'')+'<small>'+esc(r)+'</small></div>'+
      '<div class="rx-nm">'+esc(sn)+'</div>'+
      '<div class="rx-age">'+(p.age||'')+' anni</div>'+
      '<div class="rx-club"><img src="'+crest+'" onerror="this.style.display=\'none\'" referrerpolicy="no-referrer"><span>'+esc(S.teamName||'')+'</span></div>'+
    '</div>'+
  '</div>';

  s++;
  var quad='<div class="rx-sec rx-quad" style="--s:'+s+'">'+
    '<div><span>Altezza</span><b>'+((p.height||180)+' cm')+'</b></div>'+
    '<div><span>Piede preferito</span><b>'+esc(rxFootIt(p))+'</b></div>'+
    '<div><span>Peso</span><b>'+((d.weight||74)+' kg')+'</b></div>'+
    '<div><span>Numero di maglia</span><b>'+(d.number||'\u2013')+'</b></div>'+
  '</div>';

  var rls=(p.roles||[]).slice(0,2).map(function(rr,k){
    return '<div class="rx-rr"><i></i><div><b>'+esc(pName(rr))+'</b><span>'+(k?'Ruolo alternativo':rxZone(rr))+'</span></div></div>';
  }).join('');
  var pano=sec('Panoramica giocatore','<div class="rx-pano"><div class="rx-pwrap">'+rxPitch(p)+'</div><div class="rx-roles">'+rls+'</div></div>');

  var attr=d.attr||{}, ks=Object.keys(attr).sort(function(a,b){ return (+attr[b]||0)-(+attr[a]||0); }).slice(0,5);
  var skills=sec('Abilit\u00e0 migliori','<div class="rx-skills">'+ks.map(function(k2){
    return '<div class="rx-sk"><span>'+esc(k2)+'</span><b>'+(+attr[k2]||0)+'</b></div>';
  }).join('')+'</div>');

  var left=/sinistr|left|^l$/i.test(String(p.foot||''));
  var feet=''; for(var f=0;f<5;f++){ var onf=(left?f===1:f===3); feet+='<i class="rx-ft'+(onf?' on':'')+'">'+RXIC.foot+'</i>'; }
  var wf=rxWeak(p), stars='';
  for(var q2=0;q2<5;q2++) stars+='<i class="rx-st'+(q2<wf?' on':'')+'">'+RXIC.star+'</i>';
  s++;
  var foot2='<div class="rx-two" style="--s:'+s+'">'+
    '<div class="rx-sec2"><div class="rx-sh">Piede preferito</div><div class="rx-fv">'+esc(rxFootIt(p))+'</div><div class="rx-feet">'+feet+'</div></div>'+
    '<div class="rx-sec2"><div class="rx-sh">Piede debole</div><div class="rx-stars">'+stars+'</div></div>'+
  '</div>';

  function op(ic,lab,act,cls){
    return '<button class="rx-op'+(cls?' '+cls:'')+'" onclick="rosaXAct(\''+act+'\')">'+(ic?'<span class="rx-oi">'+ic+'</span>':'')+'<span class="rx-ol">'+lab+'</span></button>';
  }
  var opts=sec('Opzioni giocatore','<div class="rx-opts">'+
    op(RXIC.price,'Modifica prezzo','price')+
    op(RXIC.renew,'Rinnovo contratto','renew')+
    op(RXIC.dev,'Piano di sviluppo','dev')+
    op(RXIC.listT,'Metti in lista trasferimenti','listT')+
    op(RXIC.listL,'Metti in lista prestiti','listL')+
    op(RXIC.shirt,'Cambia numero di maglia','number')+
  '</div><button class="rx-rel" onclick="rosaXAct(\'release\')">Rescissione contratto</button>');

  s++;
  var cta='<div class="rx-cta" style="--s:'+s+'">'+
    '<button class="rx-btn" onclick="rosaXCmp()"><span class="rx-oi">'+RXIC.cmp+'</span>Confronta giocatore</button>'+
    '<button class="rx-btn prim" onclick="sq26Modal()"><span class="rx-oi">'+RXIC.rep+'</span>Visualizza report</button>'+
  '</div>';

  return '<div class="rx-card">'+hero+quad+pano+skills+foot2+opts+cta+'</div>';
}
function rosaCardHTML(){ return '<div class="rx-cardwrap" id="rx-cardwrap">'+rxCardInner()+'</div>'; }

window.renderRosa=function(){
  ensureCSS(); sniffLogoColor();
  var all=P();
  if(S.rosaDetIdx==null||S.rosaDetIdx>=all.length) S.rosaDetIdx=0;
  var x=curX();
  var view=S.sq26View||'squadra';
  var intesa=clamp(62+(S.strength||70)*0.28,50,99);
  var mor=(S.morale||'POSITIVO');
  var chip=x?('<div class="sq26-chip"><b>'+x.p.rate+'</b><div><div class="nm">'+esc(x.p.name.split(' ').pop())+'</div><div class="ag">'+x.p.age+' anni</div></div></div>')
            :'<div class="sq26-chip"><b>'+(S.strength||0)+'</b><div><div class="nm">'+esc(S.teamName||'')+'</div><div class="ag">Rosa</div></div></div>';
  var nav=NAV.map(function(n){
    var on=(n[0]==='squadra'&&view!=='formazione'&&view!=='rosa')||(n[0]==='formazione'&&view==='formazione')||(n[0]==='rosa'&&view==='rosa');
    var live=n[2]>0;
    return '<div class="it'+(on?' on':'')+(live?'':' mute')+'" onclick="sq26Nav(\''+n[0]+'\')">'+n[1]+'</div>';
  }).join('')+chip;

  var anim=!S._sq26anim; S._sq26anim=true;
  archTick();
  sq26FitSoon();
  if(view==='rosa'){
    return '<div class="sq26 fm-squad rosa-fm-bg-x'+(anim?' anim':'')+'" style="--sqc:'+clubColor()+'">'+
      '<div class="sq26-nav">'+nav+'</div><div class="sq26-navline"></div>'+
      '<div class="sq26-grid rx-grid">'+rosaListHTML()+rosaCardHTML()+'</div>'+
    '</div>';
  }
  return '<div class="sq26 fm-squad rosa-fm-bg-x'+(anim?' anim':'')+'" style="--sqc:'+clubColor()+'">'+
    '<div class="sq26-nav">'+nav+'</div><div class="sq26-navline"></div>'+
    '<div class="sq26-head">'+
      '<div><div class="sq26-title">Gestione squadra</div></div>'+
      '<div class="sq26-kpis">'+
        '<div class="sq26-kpi"><span>Valutazione rosa</span><b>'+(S.strength||0)+'</b><div class="mini"><i style="width:'+(S.strength||0)+'%"></i></div></div>'+
        '<div class="sq26-kpi"><span>Intesa squadra</span><b>'+intesa+'%</b><div class="mini"><i style="width:'+intesa+'%"></i></div></div>'+
        '<div class="sq26-kpi"><span>Morale</span><b style="font-size:19px">'+mor+'</b><div class="mini"><i style="width:82%"></i></div></div>'+
      '</div>'+
    '</div>'+
    '<div class="sq26-grid">'+pitchHTML()+panelHTML()+'</div>'+footHTML()+
  '</div>';
};

/* --------------------------------------------------------- tastiera / R   */
if(!window.__sq26keys){
  window.__sq26keys=true;
  document.addEventListener('keydown',function(e){
    if(typeof S==='undefined'||S.mode!=='rosa') return;
    var k=e.key;
    if(k==='ArrowRight'){ sq26Tab(1); e.preventDefault(); e.stopPropagation(); }
    else if(k==='ArrowLeft'){ sq26Tab(-1); e.preventDefault(); e.stopPropagation(); }
    else if(k==='r'||k==='R'){ sq26Tab(1); e.preventDefault(); }
    else if(k==='ArrowDown'){ if(typeof rosaDetNav==='function'){ rosaDetNav(1); e.preventDefault(); } }
    else if(k==='ArrowUp'){ if(typeof rosaDetNav==='function'){ rosaDetNav(-1); e.preventDefault(); } }
    else if(k==='Escape'){ if(document.getElementById('sq26-ov')){ sq26Close(); e.preventDefault(); } }
  },true);
}

ensureCSS();
try{ if(typeof S!=='undefined'&&S.mode==='rosa'&&typeof render==='function') render(); }catch(e){}
})();

