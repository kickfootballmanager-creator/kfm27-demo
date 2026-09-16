
/* MK27 - scheda giocatore mercato (design premium, colori del club) */
(function(){
'use strict';
if(window.__MK27__) return; window.__MK27__=true;

var CLUBCOL={'Milan':'#c8102e','AC Milan':'#c8102e','Inter':'#1b3fae','Juventus':'#141414','Napoli':'#12a0dc','Roma':'#8e1f2f','Lazio':'#4fa8dc','Atalanta':'#1b2b4b','Fiorentina':'#7b3fbf','Torino':'#7a1620','Bologna':'#9b1b30','Genoa':'#9b1b30','Udinese':'#3a3a3a','Cagliari':'#9b1b30','Lecce':'#c8102e','Parma':'#e0b400','Como':'#1b3fae','Empoli':'#1b6fc4','Sassuolo':'#00a651','Verona':'#e0a92e','Hellas Verona':'#e0a92e','Monza':'#c8102e','Real Madrid':'#1b45a8','Barcelona':'#a50044','FC Barcelona':'#a50044','Atletico Madrid':'#c8102e','Sevilla':'#c8102e','Valencia':'#f18e00','Villarreal':'#e3b100','Real Betis':'#00954c','Athletic Club':'#c8102e','Real Sociedad':'#1b45a8','Manchester City':'#4a9ed6','Manchester United':'#da291c','Liverpool':'#c8102e','Chelsea':'#034694','Arsenal':'#ef0107','Tottenham Hotspur':'#1b2c5a','Tottenham':'#1b2c5a','Newcastle United':'#3a3a3a','Aston Villa':'#7b003c','West Ham United':'#7a263a','Bayern Munich':'#dc052d','Borussia Dortmund':'#e0b400','Bayer Leverkusen':'#e32219','RB Leipzig':'#dd0741','VfB Stuttgart':'#e32219','Paris Saint-Germain':'#0b3b70','PSG':'#0b3b70','Marseille':'#2faee0','Olympique Lyonnais':'#1b45a8','AS Monaco':'#c8102e','Ajax':'#c8102e','PSV':'#c8102e','Feyenoord':'#c8102e','Benfica':'#c8102e','FC Porto':'#1b45a8','Porto':'#1b45a8','Sporting CP':'#00814c','Celtic':'#00814c','Rangers':'#1b45a8','Galatasaray':'#e5a00d','Fenerbahce':'#003b73'};

function sd(str){ var h=0,i=0; str=String(str||''); for(;i<str.length;i++){ h=(h*31+str.charCodeAt(i))>>>0; } return h; }
function hashCol(n){ var hues=[352,214,138,32,268,190,12,44]; return 'hsl('+hues[sd(n)%hues.length]+',58%,42%)'; }
var NGKW=[['bayern','#dc052d','#0c1c3f'],['munchen','#dc052d','#0c1c3f'],['munich','#dc052d','#0c1c3f'],['dortmund','#f5d000','#131313'],['leverkusen','#e32221','#12100f'],['leipzig','#d5052c','#0d2140'],['gladbach','#0b7a3f','#101010'],['frankfurt','#d3122a','#0b0b0b'],['stuttgart','#e1122c','#111'],['wolfsburg','#5aa02c','#0f1a0c'],['hoffenheim','#1c63b8','#0c1626'],['bremen','#0b7a3f','#0d1a12'],['schalke','#0b4ea2','#08172c'],['hamburg','#0b3fa0','#0a1526'],['union berlin','#d4122a','#0f0d0b'],
['milan','#e21a2b','#4c060f'],['inter','#0a4bd6','#05123f'],['juventus','#e8e8ee','#0b0b0d'],['napoli','#12a5e8','#04263d'],['roma','#9d1b2c','#2f0810'],['lazio','#87cfea','#0b2f42'],['atalanta','#1c2b5c','#0a1024'],['fiorentina','#7d3fc9','#20103a'],['torino','#7a1620','#1e0709'],['bologna','#9b1b30','#210810'],['genoa','#a2172a','#0d1b36'],['udinese','#e6e6ea','#131313'],['cagliari','#8c1a2e','#0d1a3a'],['lecce','#e0c000','#0d1a12'],['parma','#e0b400','#0d1526'],['sassuolo','#00a651','#07231a'],['verona','#e0a92e','#131313'],['monza','#d1122a','#0e0e0e'],['como','#1b3fae','#0b132c'],['empoli','#1b6fc4','#0a1a2e'],['venezia','#0f7a4a','#0c1a14'],['pisa','#0b4ea2','#0a1524'],
['real madrid','#eaeaf1','#1a1a20'],['barcelona','#a50044','#0e1c46'],['barca','#a50044','#0e1c46'],['atletico','#cb3524','#12183a'],['sevilla','#d81d2c','#1a0a0d'],['betis','#0b9445','#0c2116'],['valencia','#f18e00','#141414'],['villarreal','#ffd400','#12100a'],['athletic','#ee2523','#1a0b0b'],['sociedad','#0b4ea2','#0a1524'],['celta','#8ac6ea','#0b2436'],['getafe','#0b4ea2','#0a1524'],['girona','#d1122a','#0f0d0d'],
['manchester city','#6cabdd','#0a2436'],['man city','#6cabdd','#0a2436'],['manchester united','#da291c','#2c0705'],['man united','#da291c','#2c0705'],['liverpool','#c8102e','#28060c'],['chelsea','#0b4ea2','#03142b'],['arsenal','#ef0107','#2f050a'],['tottenham','#dfe3ee','#0d1230'],['newcastle','#e9e9ee','#101010'],['aston villa','#95bfe5','#4b1030'],['west ham','#7c2c3b','#0f2b3c'],['everton','#0b3fa0','#08172f'],['brighton','#0057b8','#08172c'],['leeds','#e9e9ee','#0b2452'],['fulham','#e9e9ee','#111'],['wolves','#fdb913','#131313'],['crystal palace','#1b458f','#c4122e'],['nottingham','#dd0000','#170606'],['brentford','#d20a11','#171010'],
['paris','#0b3d91','#08101f'],['psg','#0b3d91','#08101f'],['marseille','#2faee3','#0a2233'],['lyon','#d6122a','#0b1226'],['monaco','#e1122c','#131313'],['lille','#d6122a','#0b1226'],['nice','#d6122a','#131313'],
['ajax','#d2122e','#22060c'],['psv','#d51f26','#131313'],['feyenoord','#d81920','#131313'],['benfica','#e01b24','#280709'],['porto','#0d5fb0','#08172c'],['sporting','#0b8c4a','#0b2116'],['celtic','#0b8c4a','#0b2116'],['rangers','#0b4ea2','#0a1524'],['galatasaray','#e1a300','#8c1a2e'],['fenerbahce','#f5d000','#0b2452'],['besiktas','#e9e9ee','#111'],['trabzonspor','#7a1224','#20070f'],['shakhtar','#f07f00','#131313'],['zenit','#0b8ec9','#0a2233'],['dinamo','#0b4ea2','#0a1524'],['salzburg','#d1122a','#131313'],['club brugge','#0b4ea2','#1b8ac9'],['anderlecht','#5a2d8c','#f5d000'],['copenhagen','#d1122a','#131313'],['olympiacos','#d1122a','#131313'],['panathinaikos','#0b8c4a','#0b2116'],['aek','#f5d000','#131313'],['sparta','#d1122a','#131313'],['slavia','#d1122a','#131313'],['legia','#0b8c4a','#131313'],['basel','#d1122a','#131313'],['young boys','#f5d000','#131313'],['ferencvaros','#0b8c4a','#131313'],['red star','#d1122a','#0b1a3a'],['partizan','#131313','#e9e9ee'],['rosenborg','#131313','#e9e9ee'],['malmo','#0b8ec9','#0a2233'],['flamengo','#d1122a','#131313'],['boca','#0b3fa0','#f5d000'],['river','#e9e9ee','#d1122a'],['palmeiras','#0b8c4a','#0b2116'],['santos','#e9e9ee','#111'],['al nassr','#f5d000','#0b4ea2'],['al hilal','#0b4ea2','#e9e9ee'],['al ittihad','#f5d000','#131313'],['inter miami','#f4b8cd','#131313'],['galaxy','#f5d000','#0b1a3a']];
function ngNorm(s){ s=String(s||'').toLowerCase();
  try{ s=s.normalize('NFD').replace(/[\u0300-\u036f]/g,''); }catch(e){}
  s=s.replace(/\u00fc/g,'u').replace(/\u00f6/g,'o').replace(/\u00e4/g,'a').replace(/\u00e9/g,'e').replace(/\u00e8/g,'e');
  s=s.replace(/\b(fc|ac|as|ssc|sc|cf|rc|rcd|cd|afc| afc|bsc|vfb|vfl|tsg|sv|ss|us|acf|ogc|rb|fk|sk|nk|hsc|1899|1900|1904|1909|calcio|club|de|do|del|of)\b/g,' ');
  return s.replace(/[^a-z ]+/g,' ').replace(/\s+/g,' ').trim();
}
function ngPair(club){ var n=ngNorm(club); if(!n) return null;
  for(var i=0;i<NGKW.length;i++){ var k=NGKW[i][0]; if(n===k) return [NGKW[i][1],NGKW[i][2]]; }
  for(var j=0;j<NGKW.length;j++){ var k2=NGKW[j][0]; if(n.indexOf(k2)>=0||k2.indexOf(n)>=0) return [NGKW[j][1],NGKW[j][2]]; }
  return null;
}
function colOf(n){
  if(!n) return '#c8102e';
  if(CLUBCOL[n]) return CLUBCOL[n];
  var p=ngPair(n); if(p) return p[0];
  var k=Object.keys(CLUBCOL);
  for(var i=0;i<k.length;i++){ if(n.indexOf(k[i])>=0||k[i].indexOf(n)>=0) return CLUBCOL[k[i]]; }
  return hashCol(n);
}
function E(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function jq(s){ return String(s==null?'':s).replace(/\\/g,'\\\\').replace(/'/g,"\\'"); }
function crestOf(n){
  if(!n) return '';
  try{ if(typeof clubCrest==='function'){ var u=clubCrest(n); if(u) return u; } }catch(e){}
  try{ if(typeof tmLogo==='function'){ var u2=tmLogo(n); if(u2) return u2; } }catch(e){}
  try{ if(typeof EADB!=='undefined'&&EADB[n]&&EADB[n].tid&&typeof getLogo==='function') return getLogo(EADB[n].tid,n); }catch(e){}
  return '';
}
function roleIt(r){ try{ return (typeof ROLE_IT!=='undefined'&&ROLE_IT[r])||r; }catch(e){ return r; } }
function shirtNo(p){
  try{ var k=p.name+'|'+(p.pid||''); if(S.sq26&&S.sq26[k]&&S.sq26[k].number) return S.sq26[k].number; }catch(e){}
  if(p.roles&&p.roles[0]==='POR') return [1,12,22][sd(p.name)%3];
  var pool=[2,3,4,5,6,7,8,9,10,11,14,17,18,19,20,21,23,24,27,30,33,77];
  return pool[sd(p.name)%pool.length];
}
function curYear(){ try{ return S.baseYear||(new Date()).getFullYear(); }catch(e){ return 2026; } }
function bornYear(age){ return curYear()-(parseInt(age)||24); }
function bornDate(p){
  var r=sd(p.name+'b'), d=1+(r%28), m=1+((r>>5)%12);
  return (d<10?'0':'')+d+'/'+(m<10?'0':'')+m+'/'+bornYear(p.age);
}
function footOf(p){ return (p.foot)?(/sin|left|sx/i.test(p.foot)?'Sinistro':'Destro'):((p.name.charCodeAt(0)%4===0)?'Sinistro':'Destro'); }
function weightOf(p){ var h=parseInt(p.height)||182; return Math.round(h-110+((sd(p.name)%9)-4)); }
function heightOf(p){ var h=parseInt(p.height)||182; return (h/100).toFixed(2).replace('.',',')+' m'; }
function priceOf(p){ try{ return (typeof playerPrice==='function')?playerPrice(p):(p.price||0); }catch(e){ return p.price||0; } }
function wageOf(p){ try{ return (typeof playerWage==='function')?playerWage(p):0; }catch(e){ return 0; } }
function expiryOf(p){
  var yrs=parseInt(p.contractYears);
  if(isNaN(yrs)) yrs=1+(sd(p.name+'c')%4);
  return '30/06/'+(curYear()+Math.max(1,yrs));
}
function statsOf(p){
  var L=null; try{ L=(typeof window.sq28Get==='function')?window.sq28Get(p.name,S.season||1):null; }catch(e){}
  if(L && L.p>0) return {g:L.g,a:L.a,mv:L.mv,p:L.p};
  var st=null; try{ st=(S.playerStats||{})[p.name]||null; }catch(e){}
  var g=st?((+st.goals||0)+(+st.clGoals||0)+(+st.cupGoals||0)):0;
  var a=st?((+st.assists||0)+(+st.clAssists||0)+(+st.cupAssists||0)):0;
  return {g:g,a:a,mv:0,p:0};
}
function appOf(p){
  try{
    var sn=S.season||1, tp=0, tm=0, cur={p:0,m:0};
    if(typeof window.sq28Get==='function' && typeof window.sq28Seasons==='function'){
      var ks=window.sq28Seasons(p.name)||[];
      for(var i=0;i<ks.length;i++){
        var L=window.sq28Get(p.name,ks[i]); if(!L) continue;
        tp+=(+L.p||0); tm+=(+L.m||0);
        if(ks[i]===sn) cur={p:(+L.p||0),m:(+L.m||0)};
      }
      if(tp||tm) return {p:cur.p,m:cur.m,tp:tp,tm:tm};
    }
    return {p:0,m:0,tp:0,tm:0};
  }catch(e){ return {p:0,m:0,tp:0,tm:0}; }
}
function minutesOf(p){ var a=appOf(p); return a.m; }

/* ---------------- biografia ---------------- */
function genBio(p){
  var out=[];
  var role=roleIt((p.roles&&p.roles[0])||'CC');
  var arch=null; try{ arch=(S.sq26arch||{})[p.name]||null; }catch(e){}
  var tg=0, ta=0, seas=0;
  if(arch){ for(var k in arch){ var e=arch[k]; tg+=(+e.g||0); ta+=(+e.a||0); seas++; } }
  out.push(E(p.name)+', '+(p.age||'')+' anni, e\u0300 un '+String(role).toLowerCase()+(p.nation?' di nazionalita\u0300 '+E(p.nation):'')+(p.club?' in forza al '+E(p.club):', attualmente svincolato')+'.');
  if(seas>0) out.push('Nel corso della tua carriera manageriale ha gia\u0300 disputato '+seas+(seas===1?' stagione':' stagioni')+', con un bottino complessivo di <b>'+tg+' gol</b> e <b>'+ta+' assist</b>.');
  var pot=p.pot||p.rate;
  if(pot>p.rate&&p.age<=23) out.push('Profilo in forte crescita: overall attuale <b>'+p.rate+'</b> con un potenziale stimato di <b>'+pot+'</b>.');
  else if(p.rate>=84) out.push('E\u0300 uno dei profili piu\u0300 forti sul mercato, con un overall di <b>'+p.rate+'</b>.');
  else out.push('Overall attuale <b>'+p.rate+'</b>, potenziale stimato <b>'+pot+'</b>.');
  return out.join(' ');
}
function wikiBio(p,cb){
  try{ if(!S.mk27bio||typeof S.mk27bio!=='object') S.mk27bio={}; }catch(e){}
  var key=p.name+'|'+(p.club||'');
  try{ if(S.mk27bio[key]) { cb(S.mk27bio[key]); return; } }catch(e){}
  if(typeof fetch!=='function'){ cb(null); return; }
  var langs=['it','en'], li=0, done=false;
  function fin(t){ if(done) return; done=true; cb(t); }
  function fail(){ li++; if(li<langs.length) go(); else fin(null); }
  function summary(lang,title){
    fetch('https://'+lang+'.wikipedia.org/api/rest_v1/page/summary/'+encodeURIComponent(title))
      .then(function(r){ return r.ok?r.json():null; })
      .then(function(j){
        if(j&&j.extract&&j.extract.length>50){
          var parts=j.extract.split('. ');
          var t=parts.slice(0,3).join('. ');
          if(t.slice(-1)!=='.') t+='.';
          try{ S.mk27bio[key]=t; }catch(e){}
          fin(t);
        } else fail();
      })['catch'](fail);
  }
  function go(){
    var lang=langs[li];
    var q=encodeURIComponent(p.name+' '+(lang==='it'?'calciatore':'footballer'));
    fetch('https://'+lang+'.wikipedia.org/w/api.php?action=query&list=search&srsearch='+q+'&srlimit=1&format=json&origin=*')
      .then(function(r){ return r.ok?r.json():null; })
      .then(function(j){
        var hit=j&&j.query&&j.query.search&&j.query.search[0];
        if(hit&&hit.title) summary(lang,hit.title); else fail();
      })['catch'](fail);
  }
  setTimeout(function(){ fin(null); },6000);
  go();
}

var IC={
  lock:'<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="10" width="15" height="10.5" rx="2.4"/><path d="M8 10V7a4 4 0 018 0v3"/></svg>',
  deal:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 6.5l3-2 6.5 4v7l-3 2.5-4-3"/><path d="M13 6.5l-4-2-6.5 4v7l4 2.5 3-2.5"/><path d="M10 15.5l2 2 2-2"/></svg>',
  loan:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8.5h14l-3.5-3.5"/><path d="M20 15.5H6l3.5 3.5"/></svg>',
  plus:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="12" cy="12" r="8.6"/><path d="M12 8.2v7.6M8.2 12h7.6"/></svg>',
  close:'<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>'
};

var F="'Sora','Poppins',Inter,-apple-system,'Segoe UI',system-ui,sans-serif";
var CSS=[
'.mk27-ov{position:fixed;inset:0;z-index:200000;background:radial-gradient(120% 130% at 50% 0%,rgba(10,13,19,.9),rgba(2,4,7,.97));display:flex;align-items:center;justify-content:center;padding:2vh 2vw;font-family:'+F+';animation:mk27Fade .24s ease both;}',
'@keyframes mk27Fade{from{opacity:0}to{opacity:1}}',
'@keyframes mk27Up{from{opacity:0;transform:translateY(26px) scale(.985)}to{opacity:1;transform:none}}',
'@keyframes mk27L{from{opacity:0;transform:translateX(-18px)}to{opacity:1;transform:none}}',
'@keyframes mk27R{from{opacity:0;transform:translateX(14px)}to{opacity:1;transform:none}}',
'@keyframes mk27Bar{from{width:0}}',
'@keyframes mk27Spin{to{transform:rotate(360deg)}}',
'.mk27{position:relative;width:min(1180px,94vw);height:min(92vh,calc(min(1180px,94vw)/1.55));min-height:0;display:grid;grid-template-rows:minmax(0,1fr) auto;background:linear-gradient(150deg,#12161d,#0a0c11 55%,#07090d);border-radius:22px;overflow:hidden;box-shadow:0 44px 130px rgba(0,0,0,.8),0 0 0 1px rgba(255,255,255,.05);animation:mk27Up .5s cubic-bezier(.16,.8,.3,1) both;}',
'.mk27:after{content:"";position:absolute;inset:0;border-radius:22px;padding:1.4px;background:linear-gradient(140deg,rgba(255,255,255,.5) 0%,rgba(255,255,255,.14) 16%,rgba(255,255,255,.03) 34%,rgba(255,255,255,0) 52%,rgba(255,255,255,.05) 70%,rgba(255,255,255,.22) 88%,rgba(255,255,255,.4) 100%);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);mask-composite:exclude;pointer-events:none;z-index:9;}',
'.mk27-in{display:grid;grid-template-columns:minmax(0,352px) minmax(0,1fr);min-height:0;overflow:hidden;}',
'.mk27-x{position:absolute;top:15px;right:16px;z-index:12;width:34px;height:34px;display:flex;align-items:center;justify-content:center;border-radius:10px;background:rgba(18,22,29,.72);border:1px solid rgba(255,255,255,.14);color:#dfe6ef;cursor:pointer;transition:.18s;}',
'.mk27-x:hover{background:rgba(255,255,255,.16);color:#fff;transform:scale(1.06);}',
/* colonna sinistra */
'.mk27-l{position:relative;display:flex;flex-direction:column;min-height:0;background:#0a0d12;animation:mk27L .52s .04s cubic-bezier(.16,.8,.3,1) both;}',
'.mk27-port{position:relative;flex:1 1 auto;min-height:0;overflow:hidden;background:linear-gradient(168deg,color-mix(in srgb,var(--mkc) 78%,#000) 0%,var(--mkc) 46%,color-mix(in srgb,var(--mkc) 62%,#05070b) 100%);}',
'.mk27-port:before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(90deg,rgba(255,255,255,.075) 0 3px,transparent 3px 14px);opacity:.75;}',
'.mk27-port:after{content:"";position:absolute;left:0;right:0;bottom:0;height:52%;background:linear-gradient(180deg,transparent,rgba(0,0,0,.62));pointer-events:none;}',
'.mk27-club{position:absolute;z-index:5;top:17px;left:19px;display:flex;align-items:center;gap:8px;font-size:12px;font-weight:800;letter-spacing:1.7px;text-transform:uppercase;color:rgba(255,255,255,.95);text-shadow:0 2px 10px rgba(0,0,0,.35);}',
'.mk27-club img{width:21px;height:21px;object-fit:contain;}',
'.mk27-num{position:absolute;z-index:2;top:38px;left:9px;font-size:clamp(96px,15vh,164px);line-height:.82;font-weight:800;letter-spacing:-3px;color:transparent;-webkit-text-stroke:2.4px rgba(255,255,255,.55);opacity:.9;pointer-events:none;}',
'.mk27-face{position:absolute;z-index:4;left:50%;bottom:0;transform:translateX(-48%);height:80%;max-width:104%;object-fit:contain;object-position:bottom center;filter:drop-shadow(0 26px 40px rgba(0,0,0,.55)) contrast(1.04);}',
'.mk27-nm{position:absolute;z-index:6;left:20px;right:20px;bottom:16px;overflow:hidden;}',
'.mk27-nm .f{font-size:15px;font-weight:300;letter-spacing:4.2px;text-transform:uppercase;color:rgba(255,255,255,.88);}',
'.mk27-nm .s{display:block;font-size:clamp(24px,3.5vh,40px);line-height:1.04;font-weight:800;letter-spacing:-.6px;text-transform:uppercase;color:#fff;text-shadow:0 6px 26px rgba(0,0,0,.45);white-space:nowrap;transform-origin:left bottom;}',
'.mk27-linfo{flex:0 0 auto;display:grid;grid-template-columns:repeat(4,auto);justify-content:space-between;gap:8px 12px;padding:16px 20px 14px;}',
'.mk27-linfo .k{font-size:9.5px;font-weight:700;letter-spacing:1.15px;text-transform:uppercase;color:var(--mkc2);}',
'.mk27-linfo .v{font-size:14px;font-weight:300;color:#f2f6fa;margin-top:5px;white-space:nowrap;}',
'.mk27-role{flex:0 0 auto;margin:0 16px 16px;display:grid;grid-template-columns:1fr auto;gap:14px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.09);border-radius:14px;padding:14px 16px;}',
'.mk27-role .k{font-size:9.5px;font-weight:700;letter-spacing:1.15px;text-transform:uppercase;color:var(--mkc2);}',
'.mk27-role .v{font-size:17.5px;font-weight:300;color:#fff;margin-top:6px;}',
/* colonna destra */
'.mk27-r{display:flex;flex-direction:column;min-height:0;padding:26px 30px 0;overflow:auto;scrollbar-width:thin;animation:mk27R .52s .09s cubic-bezier(.16,.8,.3,1) both;}',
'.mk27-r::-webkit-scrollbar{width:7px}.mk27-r::-webkit-scrollbar-thumb{background:rgba(255,255,255,.13);border-radius:8px}',
'.mk27-k{font-size:10.5px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:var(--mkc2);}',
'.mk27-top{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:44px;align-items:start;padding:0 96px 20px 0;}',
'.mk27-big{font-size:clamp(28px,4vh,42px);font-weight:300;color:#fff;line-height:1.1;margin-top:6px;}',
'.mk27-sub{font-size:13px;color:rgba(255,255,255,.5);margin-top:5px;}',
'.mk27-v{font-size:22px;font-weight:300;color:#fff;margin-top:7px;white-space:nowrap;}',
'.mk27-row4{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:20px;padding:18px 0 20px;border-top:1px solid rgba(255,255,255,.08);}',
'.mk27-row4 .v{font-size:19px;font-weight:300;color:#fff;margin-top:7px;display:flex;align-items:center;gap:9px;}',
'.mk27-row4 .v img{width:22px;height:22px;object-fit:contain;}',
'.mk27-grid3{display:grid;grid-template-columns:minmax(0,1.62fr) minmax(0,.78fr) minmax(0,.9fr);gap:14px;}',
'.mk27-box{background:rgba(255,255,255,.032);border:1px solid rgba(255,255,255,.075);border-radius:16px;padding:18px 20px;}',
'.mk27-st{display:flex;align-items:center;gap:16px;padding:6px 0;}',
'.mk27-st .l{flex:0 0 104px;font-size:12.5px;font-weight:400;letter-spacing:1.2px;text-transform:uppercase;color:rgba(255,255,255,.8);}',
'.mk27-st .t{flex:1 1 auto;height:4px;border-radius:3px;background:rgba(255,255,255,.11);overflow:hidden;}',
'.mk27-st .t i{display:block;height:100%;border-radius:3px;background:var(--mkc);animation:mk27Bar 1s .16s cubic-bezier(.16,.8,.3,1) both;}',
'.mk27-st .n{flex:0 0 30px;text-align:right;font-size:15px;font-weight:400;color:#fff;}',
'.mk27-kv{margin-bottom:15px;}.mk27-kv:last-child{margin-bottom:0}',
'.mk27-kv .v{font-size:20px;font-weight:300;color:#fff;margin-top:5px;}',
'.mk27-cl .v{font-size:31px;font-weight:400;color:#fff;margin-top:8px;letter-spacing:-.5px;}',
'.mk27-cl .n{font-size:12px;line-height:1.55;color:rgba(255,255,255,.5);margin-top:10px;}',
'.mk27-bio{margin:14px 0 22px;background:rgba(255,255,255,.032);border:1px solid rgba(255,255,255,.075);border-radius:16px;padding:18px 20px;}',
'.mk27-bio p{font-size:13.2px;line-height:1.75;color:rgba(255,255,255,.7);margin:9px 0 0;}',
'.mk27-bio p b{color:#fff;font-weight:600;}',
'.mk27-load{display:inline-block;width:13px;height:13px;border:2px solid rgba(255,255,255,.22);border-top-color:var(--mkc);border-radius:50%;animation:mk27Spin .7s linear infinite;vertical-align:-2px;margin-right:8px;}',
/* azioni */
'.mk27-acts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;padding:16px 24px 22px;}',
'.mk27-b{display:flex;align-items:center;justify-content:center;gap:12px;padding:17px 10px;border-radius:13px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.038);color:#f2f6fa;font-family:inherit;font-size:13.5px;font-weight:500;letter-spacing:1.6px;text-transform:uppercase;cursor:pointer;transition:transform .18s cubic-bezier(.16,.8,.3,1),background .18s,border-color .18s;}',
'.mk27-b svg{color:var(--mkc);flex:0 0 auto;}',
'.mk27-b:hover{background:rgba(255,255,255,.085);border-color:rgba(255,255,255,.2);transform:translateY(-2px);}',
'.mk27-b.p{background:var(--mkc);border-color:transparent;color:#fff;box-shadow:0 14px 34px color-mix(in srgb,var(--mkc) 42%,transparent);}',
'.mk27-b.p svg{color:#fff;}',
'.mk27-b.p:hover{filter:brightness(1.08);}',
'.mk27-b.on{background:#00a651;border-color:transparent;color:#fff;}.mk27-b.on svg{color:#fff;}',
'@media (max-width:1120px){.mk27{height:auto;max-height:94vh;}.mk27-in{grid-template-columns:1fr}.mk27-grid3{grid-template-columns:1fr}.mk27-acts{grid-template-columns:repeat(2,1fr)}}'
];
function ensureCSS(){
  try{
    if(!document.getElementById('mk27-font')){
      var lk=document.createElement('link');
      lk.id='mk27-font'; lk.rel='stylesheet';
      lk.href='https://fonts.googleapis.com/css2?family=Sora:wght@200;300;400;500;600;800&display=swap';
      document.head.appendChild(lk);
    }
  }catch(e){}
  if(document.getElementById('mk27-css')) return;
  var st=document.createElement('style'); st.id='mk27-css'; st.textContent=CSS.join('\n');
  document.head.appendChild(st);
}

function nameParts(n){
  n=String(n||'').trim();
  var i=n.lastIndexOf(' ');
  if(i<0) return {f:'',s:n};
  return {f:n.slice(0,i),s:n.slice(i+1)};
}
function flagOf(p){
  try{ if(typeof natFlag==='function'){ var u=natFlag(p.nation); if(u) return u; } }catch(e){}
  return '';
}
function kv(k,v,cls){ return '<div class="mk27-kv '+(cls||'')+'"><div class="mk27-k">'+k+'</div><div class="v">'+v+'</div></div>'; }
function bar(l,v){
  v=parseInt(v)||0;
  return '<div class="mk27-st"><span class="l">'+l+'</span><span class="t"><i style="width:'+v+'%"></i></span><span class="n">'+v+'</span></div>';
}
function formLbl(p){ var r=sd(p.name+'f')%100; return r>78?'Eccellente':r>52?'Buona':r>26?'Nella media':'Altalenante'; }
function moraleLbl(p){ var r=sd(p.name+'m')%100; return r>76?'Molto alto':r>46?'Positivo':r>20?'Nella media':'Basso'; }
function condLbl(p){ return (88+(sd(p.name+'k')%13))+'%'; }
function minLbl(p){
  var a=appOf(p);
  if(!a.m && !a.tm) return "0'";
  var t=a.m.toLocaleString('it-IT')+"'";
  if(a.tm>a.m) t+=' <span style="font-size:12px;color:rgba(255,255,255,.45)">('+a.tm.toLocaleString('it-IT')+"' in carriera)</span>";
  return t;
}

function cardHTML(p){
  var club=p.club||'', col=colOf(club||p.name), cr=crestOf(club);
  var np=nameParts(p.name), no=shirtNo(p);
  var roles=(p.roles||[]).map(roleIt);
  var val=priceOf(p), wage=wageOf(p);
  var free=(p.status==='free'||p.free);
  var fl=flagOf(p);
  var hub=false; try{ hub=(typeof inHub==='function')?!!inHub(p.name,p.club):false; }catch(e){}
  var nm=jq(p.name), cb2=jq(p.club||'');
  var clause=Math.round(val*1.35*10)/10;
  var h='';
  h+='<div class="mk27" style="--mkc:'+col+';--mkc2:color-mix(in srgb,'+col+' 52%,#ffffff)">';
  h+='<button class="mk27-x" onclick="mk27Close()" title="Chiudi">'+IC.close+'</button>';
  h+='<div class="mk27-in">';
  /* colonna sinistra: ritratto nei colori del club */
  h+='<div class="mk27-l">';
  h+='<div class="mk27-port">';
  h+='<div class="mk27-club">'+(cr?'<img src="'+E(cr)+'" onerror="this.style.display=\'none\'">':'')+'<span>'+E((club||'svincolato').toUpperCase())+'</span></div>';
  h+='<div class="mk27-num">'+no+'</div>';
  h+='<img class="mk27-face" src="'+E(p.img||'')+'" onerror="if(window.kfmFaceAvp)kfmFaceAvp(this);else this.style.visibility=\'hidden\'">';
  h+='<div class="mk27-nm">'+(np.f?'<div class="f">'+E(np.f)+'</div>':'')+'<div class="s">'+E(np.s)+'</div></div>';
  h+='</div>';
  h+='<div class="mk27-linfo">'
    +'<div><div class="k">Nazionalit\u00e0</div><div class="v">'+(fl?'<img src="'+E(fl)+'" style="width:18px;height:13px;object-fit:cover;border-radius:2px;vertical-align:-2px;margin-right:7px" onerror="this.style.display=\'none\'">':'')+E(p.nation||'-')+'</div></div>'
    +'<div><div class="k">Data di nascita</div><div class="v">'+bornDate(p)+'</div></div>'
    +'<div><div class="k">Et\u00e0</div><div class="v">'+E(p.age||'-')+'</div></div>'
    +'<div><div class="k">Piede</div><div class="v">'+footOf(p)+'</div></div>'
  +'</div>';
  h+='<div class="mk27-role"><div><div class="k">Ruolo principale</div><div class="v">'+E(roles[0]||'-')+'</div></div>'
    +'<div><div class="k">Numero di maglia</div><div class="v">'+no+'</div></div></div>';
  h+='</div>';
  /* colonna destra */
  h+='<div class="mk27-r">';
  h+='<div class="mk27-top">'
    +'<div><div class="mk27-k">Ruolo/i</div><div class="mk27-big">'+E(roles[0]||'-')+'</div>'+(roles.length>1?'<div class="mk27-sub">'+E(roles.slice(1).join(', '))+'</div>':'')+'</div>'
    +'<div><div class="mk27-k">Altezza</div><div class="mk27-v">'+heightOf(p)+'</div></div>'
    +'<div><div class="mk27-k">Peso</div><div class="mk27-v">'+weightOf(p)+' kg</div></div>'
  +'</div>';
  h+='<div class="mk27-row4">'
    +'<div><div class="mk27-k">Club</div><div class="v">'+(cr?'<img src="'+E(cr)+'" onerror="this.style.display=\'none\'">':'')+E(club||'Svincolato')+'</div></div>'
    +'<div><div class="mk27-k">Contratto</div><div class="v">'+(free?'\u2014':expiryOf(p))+'</div></div>'
    +'<div><div class="mk27-k">Valore</div><div class="v">\u20ac '+val+' M</div></div>'
    +'<div><div class="mk27-k">Stipendio</div><div class="v">\u20ac '+wage+' k/sett</div></div>'
  +'</div>';
  h+='<div class="mk27-grid3">';
  h+='<div class="mk27-box">'+bar('Velocit\u00e0',p.pac)+bar('Tiro',p.sho)+bar('Passaggio',p.pas)+bar('Dribbling',p.dri)+bar('Difesa',p.def)+bar('Fisico',p.phy)+'</div>';
  h+='<div class="mk27-box">'+kv('Forma',formLbl(p))+kv('Morale',moraleLbl(p))+kv('Condizione',condLbl(p))+kv('Minuti giocati',minLbl(p))+'</div>';
  h+='<div class="mk27-box mk27-cl"><div class="mk27-k">Clausola<br>rescissoria</div><div class="v">\u20ac '+clause+' M</div>'
    +'<div class="n">'+(free?'Giocatore svincolato: nessuna clausola, puoi ingaggiarlo a parametro zero.':'Valida fino al '+expiryOf(p)+'.<br>Pu\u00f2 essere esercitata da qualsiasi club.')+'</div></div>';
  h+='</div>';
  h+='<div class="mk27-bio"><div class="mk27-k">Biografia</div><p id="mk27-bio"><span class="mk27-load"></span>Recupero informazioni sul giocatore\u2026</p></div>';
  h+='</div></div>';
  /* azioni */
  h+='<div class="mk27-acts">'
    +'<button class="mk27-b p" onclick="mk27Act(\'buy\',\''+nm+'\',\''+cb2+'\')">'+IC.lock+'<span>'+(free?'Ingaggia a zero':'Paga clausola')+'</span></button>'
    +'<button class="mk27-b" onclick="mk27Act(\'neg\',\''+nm+'\',\''+cb2+'\')">'+IC.deal+'<span>Negozia giocatore</span></button>'
    +'<button class="mk27-b" onclick="mk27Act(\'loan\',\''+nm+'\',\''+cb2+'\')">'+IC.loan+'<span>Chiedi in prestito</span></button>'
    +'<button class="mk27-b'+(hub?' on':'')+'" id="mk27-hub" onclick="mk27Act(\'hub\',\''+nm+'\',\''+cb2+'\')">'+IC.plus+'<span>'+(hub?'Nell\u2019hub':'Aggiungi all\u2019hub')+'</span></button>'
  +'</div>';
  h+='</div>';
  return h;
}

window.mk27Close=function(){
  var ov=document.getElementById('mk27-ov');
  if(!ov) return;
  ov.style.transition='opacity .2s ease'; ov.style.opacity='0';
  setTimeout(function(){ try{ ov.remove(); }catch(e){} },200);
};
window.mk27Act=function(a,name,club){
  if(a==='hub'){
    try{ if(typeof toggleHub==='function') toggleHub(name,club); }catch(e){}
    var b=document.getElementById('mk27-hub');
    if(b){
      var on=false; try{ on=!!inHub(name,club); }catch(e){}
      b.className='mk27-b'+(on?' on':'');
      b.innerHTML=IC.plus+'<span>'+(on?'Nell\u2019hub':'Aggiungi all\u2019hub')+'</span>';
    }
    return;
  }
  window.mk27Close();
  setTimeout(function(){
    try{
      if(a==='buy'){ if(typeof buyPlayer==='function') buyPlayer(name,club); }
      else if(a==='neg'){ if(typeof openNegotiate==='function') openNegotiate(name,false,club); }
      else if(a==='loan'){ if(typeof openNegotiate==='function') openNegotiate(name,false,club,true); }
    }catch(e){}
  },170);
};
window.mk27Open=function(p){
  if(!p) return;
  ensureCSS();
  var old=document.getElementById('mk27-ov'); if(old) old.remove();
  var ov=document.createElement('div'); ov.className='mk27-ov'; ov.id='mk27-ov';
  ov.innerHTML=cardHTML(p);
  ov.addEventListener('click',function(e){ if(e.target===ov) window.mk27Close(); });
  document.body.appendChild(ov);
  if(!window.__mk27keys){
    window.__mk27keys=true;
    document.addEventListener('keydown',function(e){ if(e.key==='Escape'&&document.getElementById('mk27-ov')) window.mk27Close(); });
  }
  var fb=genBio(p);
  wikiBio(p,function(t){
    var e2=document.getElementById('mk27-bio'); if(!e2) return;
    e2.style.transition='opacity .3s ease'; e2.style.opacity='0';
    setTimeout(function(){ e2.innerHTML=(t?E(t):fb); e2.style.opacity='1'; },170);
  });
  setTimeout(function(){
    var e3=document.getElementById('mk27-bio');
    if(e3&&e3.querySelector('.mk27-load')) e3.innerHTML=fb;
  },2800);
};
window.viewMarketPlayer=function(name,club){
  var p=null; try{ p=(typeof findMarket==='function')?findMarket(name,club):null; }catch(e){}
  if(p) window.mk27Open(p);
};

function mk27Fit(){
  var el=document.querySelector('#mk27-ov .mk27-nm .s'); if(!el) return;
  var box=el.parentNode; if(!box) return;
  el.style.transform='none';
  var w=el.scrollWidth, av=box.clientWidth-2;
  if(w>av&&w>0) el.style.transform='scale('+(av/w).toFixed(3)+')';
}
window.mk27Fit=mk27Fit;
if(!window.__mk27fit){
  window.__mk27fit=true;
  setInterval(function(){ if(document.getElementById('mk27-ov')) mk27Fit(); },700);
  window.addEventListener('resize',function(){ if(document.getElementById('mk27-ov')) mk27Fit(); });
}
})();

