
/* NG29 v2 - Negoziazione di mercato: copia fedele delle schermate di riferimento */
(function(){
if(window.__NG29V2__) return; window.__NG29V2__=true;

function S_(){ try{ if(typeof S!=='undefined'&&S&&typeof S==='object') return S; }catch(e){} try{ if(window.S&&typeof window.S==='object') return window.S; }catch(e){} return null; }
function G(nm){ try{ var f=window[nm]; if(typeof f==='function') return f; }catch(e){} try{ var v=eval(nm); if(typeof v==='function') return v; }catch(e2){} return null; }
function E(t){ return (''+(t==null?'':t)).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function hs(s){ var h=2166136261; s=''+s; for(var i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=(h*16777619)>>>0; } return h>>>0; }
function rng(seed){ var x=seed||1; return function(){ x^=x<<13; x>>>=0; x^=x>>17; x^=x<<5; x>>>=0; return (x>>>0)/4294967296; }; }
function cl(v,a,b){ return Math.max(a,Math.min(b,v)); }
function r1(v){ return Math.round(v*10)/10; }
function M(v){ v=+v||0; return '\u20ac ' + (v>=100? Math.round(v) : (Math.round(v*10)/10)) + ' M'; }
function K(v){ v=+v||0; return '\u20ac ' + Math.round(v) + ' K'; }
function MY(v){ v=+v||0; return '\u20ac ' + (Math.round(v*10)/10).toFixed(1) + ' M'; }

/* ---------- agenti (3000 nomi) ---------- */
var AN=['David','Marco','Luca','Andrea','Jorge','Carlos','Miguel','Rafael','Antonio','Paolo','Stefano','Alessandro','Fabio','Nicolas','Julien','Pierre','Thomas','Michael','James','Robert','Daniel','Peter','Martin','Sergio','Diego','Pablo','Javier','Ivan','Milan','Goran','Zoran','Marek','Tomas','Jan','Piotr','Andrzej','Erik','Lars','Nils','Johan','Kevin','Bruno','Ricardo','Tiago','Nuno','Hugo','Samuel','Ismael','Karim','Youssef','Ahmed','Omar','Hassan','Victor','Gabriel','Matteo','Simone','Emanuele','Filippo','Riccardo'];
var AS=['Serrano','Moretti','Bianchi','Ferrari','Romano','Costa','Silva','Pereira','Santos','Alves','Gomez','Torres','Vidal','Navarro','Iglesias','Ramos','Delgado','Ortiz','Mendez','Duran','Laurent','Moreau','Girard','Bertrand','Fontaine','Muller','Schmidt','Weber','Becker','Hoffmann','Novak','Horvat','Kovac','Petrovic','Jovanovic','Nowak','Kowalski','Zielinski','Lindberg','Nilsson','Andersen','Hansen','Larsen','OBrien','Sullivan','Wallace','Harrison','Bennett','Fletcher','Coleman'];
function agentOf(name,club){
  var s=S_(), st=s&&s.ng29agents?s.ng29agents:{};
  var key=name+'|'+club;
  if(st[key]) return st[key];
  var seed=hs('AG|'+key), r=rng(seed);
  var a={ name:AN[Math.floor(r()*AN.length)]+' '+AS[Math.floor(r()*AS.length)],
    exp:1+Math.floor(r()*5), rep:Math.round(55+r()*45), av:['Bassa','Media','Alta'][Math.floor(r()*3)],
    tough:0.45+r()*0.5, hue:Math.floor(r()*360) };
  if(s){ s.ng29agents=st; st[key]=a; }
  return a;
}
function agentAvatar(a,size){
  var sz=size||86, i=(a.name||'A').split(' ').map(function(w){ return w[0]; }).join('').slice(0,2);
  var f=null;
  try{ var L=window.NG29FACES; if(L&&L.length) f=L[hs('FACE|'+(a.name||'x'))%L.length]; }catch(e){}
  if(f) return '<div class="ng-ava img" style="width:'+sz+'px;height:'+sz+'px"><img src="'+f+'" alt="" onerror="this.parentNode.className=\'ng-ava\';this.parentNode.textContent=\''+E(i)+'\'"></div>';
  return '<div class="ng-ava" style="--h:'+a.hue+';width:'+sz+'px;height:'+sz+'px">'+E(i)+'</div>';
}

/* ---------- colori / stemmi ---------- */
var COL={'AC Milan':['#e21a2b','#5c0812'],'Milan':['#e21a2b','#5c0812'],'Inter':['#0a4bd6','#061a52'],'Juventus':['#e9e9ee','#0b0b0d'],'Napoli':['#12a5e8','#062a44'],'Roma':['#b1122c','#3a0a14'],'Lazio':['#8fd4ef','#0d3348'],'Atalanta':['#1f6fe0','#0a1730'],'Fiorentina':['#7d3fc9','#241041'],'Real Madrid':['#e8e8ef','#1a1a20'],'Barcelona':['#a50044','#12224e'],'FC Barcelona':['#a50044','#12224e'],'Atletico Madrid':['#cb3524','#151b3b'],'Manchester City':['#6cabdd','#0d2233'],'Manchester United':['#da291c','#3b0a08'],'Liverpool':['#c8102e','#360810'],'Chelsea':['#034694','#04182f'],'Arsenal':['#ef0107','#3c060a'],'Tottenham':['#dfe3ee','#101534'],'Bayern Munich':['#dc052d','#0b1a3a'],'Borussia Dortmund':['#f5d000','#181818'],'Paris Saint-Germain':['#0b3d91','#0a1226'],'PSG':['#0b3d91','#0a1226'],'Trabzonspor':['#7a1224','#2a0a12'],'Ajax':['#d2122e','#2b0810'],'Benfica':['#e01b24','#340a0e'],'Porto':['#0d5fb0','#081b32']};
function lum(h){ h=h.replace('#',''); if(h.length===3) h=h[0]+h[0]+h[1]+h[1]+h[2]+h[2]; var r=parseInt(h.slice(0,2),16),g=parseInt(h.slice(2,4),16),b=parseInt(h.slice(4,6),16); return (0.2126*r+0.7152*g+0.0722*b)/255; }
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
function colOf(club){
  if(club&&COL[club]) return COL[club];
  var p=ngPair(club); if(p) return p;
  var h=hs('C|'+(club||'x'))%360;
  return ['hsl('+h+',62%,44%)','hsl('+h+',52%,11%)'];
}
function crestAll(club){
  var o=[]; if(!club) return o;
  function add(u){ if(u&&typeof u==='string'&&u.indexOf('ui-avatars')<0&&o.indexOf(u)<0) o.push(u); }
  try{ var f=G('tmLogo'); if(f) add(f(club)); }catch(e){}
  try{ var c=G('clubCrest'); if(c) add(c(club)); }catch(e){}
  try{ var eadb=window.EADB, gl=G('getLogo'); if(eadb&&eadb[club]&&gl) add(gl(eadb[club].tid,club)); }catch(e){}
  try{ if(typeof clubLogo4==='function') add(clubLogo4(club)); }catch(e){}
  try{ var st=S_(); if(st){
      if(club===st.teamName&&st.userLogo) add(st.userLogo);
      var cs=st.world&&st.world.clubs?st.world.clubs[club]:null;
      if(cs){ add(cs.logo); add(cs.crest); add(cs.img); }
    } }catch(e){}
  return o;
}
window.ng29Logo=function(el){
  try{
    var alt=(el.getAttribute('data-alt')||'').split('|').filter(function(x){ return !!x; });
    if(alt.length){ el.setAttribute('data-alt',alt.slice(1).join('|')); el.src=alt[0]; return; }
    el.style.display='none';
    var p=el.parentNode, q=p?p.querySelector('.ini'):null; if(q) q.style.display='';
  }catch(e){}
};
window.ng29LogoOk=function(el){ try{ if(!el.naturalWidth||el.naturalWidth<6) window.ng29Logo(el); }catch(e){} };
function crest(club){ var a=crestAll(club); return a.length?a[0]:''; }

function myClub(){ var s=S_(); return (s&&s.teamName)||'La tua squadra'; }
function myCrest(){ var s=S_(); if(s&&s.userLogo) return s.userLogo; return crest(myClub()); }
function roleIt(p){
  try{ if(typeof ROLE_IT!=='undefined'&&p.roles&&p.roles[0]&&ROLE_IT[p.roles[0]]) return ROLE_IT[p.roles[0]]; }catch(e){}
  return (p.roles&&p.roles[0])||'Giocatore';
}
function shirtOf(p){ var n=(hs('SH|'+p.name)%30)+1; return n; }
/* ---------- CSS ---------- */
var CSS=[
"@keyframes ngFade{from{opacity:0}to{opacity:1}}",
"@keyframes ngPop2{from{opacity:0;transform:scale(calc(var(--k,1)*.965))}to{opacity:1;transform:scale(var(--k,1))}}",
"@keyframes ngUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}",
"@keyframes ngL{from{opacity:0;transform:translateX(-22px)}to{opacity:1;transform:none}}",
"@keyframes ngR{from{opacity:0;transform:translateX(22px)}to{opacity:1;transform:none}}",
"@keyframes ngPop{0%{opacity:0;transform:scale(.94)}100%{opacity:1;transform:scale(1)}}",
"@keyframes ngBar{from{width:0}}",
"@keyframes ngGlow{0%,100%{opacity:.55}50%{opacity:1}}",
".ng-ov{position:fixed;inset:0;z-index:120000;background:rgba(3,4,7,.92);backdrop-filter:blur(9px);-webkit-backdrop-filter:blur(9px);display:flex;align-items:center;justify-content:center;animation:ngFade .22s ease both}",
".ng29{position:relative;width:1600px;height:1012px;flex:0 0 auto;box-sizing:border-box;padding:22px;border-radius:18px;overflow:hidden;color:#fff;background:radial-gradient(120% 90% at 50% 0%,rgba(255,255,255,.05),rgba(255,255,255,0) 60%),#07080b;border:1px solid rgba(255,255,255,.09);box-shadow:0 40px 120px rgba(0,0,0,.75);font-family:'Archivo','Arial Narrow',Inter,-apple-system,'Segoe UI',system-ui,sans-serif;transform:scale(var(--k,1));--disp:'Archivo Narrow','Barlow Condensed',Archivo,system-ui,sans-serif;transform-origin:center center;animation:ngPop2 .3s cubic-bezier(.2,.8,.25,1) both}",
".ng29 *{box-sizing:border-box}",
".ng29:before{content:'';position:absolute;inset:0;background:radial-gradient(90% 70% at 50% 110%,rgba(255,255,255,.05),rgba(255,255,255,0) 70%);pointer-events:none}",
".ng-x{position:absolute;top:8px;right:12px;z-index:5;background:none;border:0;color:rgba(255,255,255,.5);font-size:24px;line-height:1;cursor:pointer;transition:.18s}",
".ng-x:hover{color:#fff;transform:scale(1.12)}",
".ng-t1{font-size:30.9px;font-weight:800;letter-spacing:.4px;text-transform:uppercase;color:var(--acc);line-height:1;text-align:center}",
".ng-t2{font-size:14.7px;font-weight:400;color:rgba(255,255,255,.78);text-align:center;margin-top:4px}",
".ng-cd{position:relative;background:rgba(255,255,255,.032);border:1px solid rgba(255,255,255,.065);border-radius:10px;padding:11.6px 16px;min-height:0;display:flex;flex-direction:column;animation:ngUp .4s cubic-bezier(.2,.8,.25,1) both}",
".ng-cd>h3{margin:0 0 8.1px;font-size:15px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:var(--acc)}",
".ng-cd>h3 .sm{float:right;font-size:11.6px;font-weight:600;color:rgba(255,255,255,.62);letter-spacing:.6px}",
".ng-r{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:4.3px 0;font-size:13.4px}",
".ng-r .l{display:flex;align-items:center;gap:8px;color:rgba(255,255,255,.9);letter-spacing:.2px;text-transform:uppercase;font-weight:500;min-width:0}",
".ng-r .l .ic{width:16px;height:16px;flex:0 0 auto;color:var(--acc)}",
".ng-r .v{font-weight:700;white-space:nowrap;font-size:15px}",
".ng-r.sub{padding-left:16px;opacity:.9}",
".ng-r.sub .l{text-transform:none;font-weight:400;color:rgba(255,255,255,.75)}",
".ng-sep{height:1px;background:rgba(255,255,255,.09);margin:8.1px 0}",
".ng-pill{display:inline-block;min-width:86px;text-align:center;padding:4px 8px;border-radius:6px;background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.1);font-weight:700;font-size:14px}",
".ng-inp{width:92px;text-align:center;background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.12);border-radius:6px;color:#fff;font:inherit;font-weight:700;font-size:14px;padding:4px 4px}",
".ng-inp:focus{outline:none;border-color:var(--acc);box-shadow:0 0 0 2px color-mix(in srgb,var(--acc) 30%,transparent)}",
".ng-pm{display:inline-flex;gap:2px;margin-left:6px;vertical-align:middle}",
".ng-pm button{width:20px;height:20px;border-radius:4px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.06);color:#fff;font-size:11px;line-height:1;cursor:pointer;transition:.15s}",
".ng-pm button:hover{background:var(--acc);border-color:var(--acc);transform:translateY(-1px)}",
".ng-2c{display:grid;grid-template-columns:1fr 1fr;gap:10.1px}",
".ng-2c .k{font-size:10.6px;font-weight:700;letter-spacing:.7px;text-transform:uppercase;color:var(--acc);opacity:.92}",
".ng-2c .n{font-size:20.7px;font-weight:700;margin-top:1px}",
".ng-track{height:5px;border-radius:3px;background:rgba(255,255,255,.13);overflow:hidden}",
".ng-track>i{display:block;height:100%;border-radius:3px;background:linear-gradient(90deg,var(--acc),color-mix(in srgb,var(--acc) 45%,#ffffff));animation:ngBar .8s cubic-bezier(.2,.8,.25,1) both}",
".ng-ok{color:#3fd07a}",".ng-no{color:#ff5c6e}",".ng-wr{color:#ffc857}",
".ng-ava{border-radius:8px;background:linear-gradient(150deg,hsl(var(--h),42%,42%),hsl(var(--h),38%,18%));display:flex;align-items:center;justify-content:center;font-weight:800;font-size:22px;letter-spacing:1px;color:rgba(255,255,255,.92);border:1px solid rgba(255,255,255,.14);flex:0 0 auto}",
".ng-stars i{font-style:normal;color:rgba(255,255,255,.22);font-size:14px;letter-spacing:1px}",
".ng-stars i.on{color:#ffc857}",
/* bottoni */
".ng-acts{display:flex;gap:12px;align-items:stretch}",
".ng-b{flex:1;display:flex;align-items:center;justify-content:center;gap:9px;padding:13.2px 10px;border-radius:9px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);color:#fff;font:inherit;font-weight:700;font-size:14.7px;letter-spacing:.7px;text-transform:uppercase;cursor:pointer;transition:transform .16s cubic-bezier(.2,.8,.25,1),background .16s,border-color .16s,box-shadow .16s}",
".ng-b .ic{width:19px;height:19px}",
".ng-b:hover{background:rgba(255,255,255,.1);transform:translateY(-2px);border-color:rgba(255,255,255,.26)}",
".ng-b.p{background:var(--acc);border-color:var(--acc);color:var(--accTx);box-shadow:0 10px 26px color-mix(in srgb,var(--acc) 32%,transparent)}",
".ng-b.p:hover{filter:brightness(1.08);background:var(--acc)}",
".ng-lnk{display:block;width:100%;text-align:center;background:none;border:0;color:rgba(255,255,255,.72);font:inherit;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;font-size:13px;padding:9.1px;cursor:pointer;transition:.16s}",
".ng-lnk:hover{color:#fff}",
/* card giocatore */
".ng-pc{position:relative;border-radius:12px;overflow:hidden;display:flex;flex-direction:column;min-height:0;background:linear-gradient(155deg,var(--c1) -18%,color-mix(in srgb,var(--c1) 28%,#0a0a0d) 40%,#08080b 100%);border:1px solid rgba(255,255,255,.08);animation:ngL .45s cubic-bezier(.2,.8,.25,1) both}",
".ng-pc .stripes{position:absolute;inset:0;background:repeating-linear-gradient(90deg,rgba(0,0,0,.22) 0 3px,rgba(0,0,0,0) 3px 9px);opacity:.5;pointer-events:none}",
".ng-pc .body{position:relative;flex:1;min-height:0;display:flex;padding:12.1px}",
".ng-pc .cn{position:absolute;top:10.1px;left:16px;font-size:10.6px;font-weight:700;letter-spacing:1.7px;text-transform:uppercase;color:var(--acc)}",
".ng-pc .no{position:absolute;top:26.3px;left:14px;font-size:74.9px;font-weight:800;line-height:.82;color:transparent;-webkit-text-stroke:2px rgba(255,255,255,.92);pointer-events:none}",
".ng-pc .cb{position:absolute;top:11.1px;right:16px;height:32.4px;opacity:.95}",
".ng-pc .fc{position:absolute;left:50%;bottom:0;transform:translateX(-50%);height:88%;max-width:118%;object-fit:contain;object-position:bottom;filter:drop-shadow(0 18px 34px rgba(0,0,0,.6))}",
".ng-pc .nm{position:absolute;left:16px;bottom:12.1px;max-width:62%;z-index:2}",
".ng-pc .nm .f{font-size:12.6px;font-weight:300;letter-spacing:3.4px;text-transform:uppercase;color:rgba(255,255,255,.9)}",
".ng-pc .nm .s{display:block;font-size:44.5px;font-weight:800;letter-spacing:-.5px;text-transform:uppercase;line-height:.96;white-space:nowrap;transform-origin:left bottom}",
".ng-pc .nm .rl{font-size:13.2px;font-weight:400;color:rgba(255,255,255,.85)}",
".ng-pc .side{position:absolute;right:16px;bottom:12.1px;text-align:right;z-index:2;line-height:1.32}",
".ng-pc .side div{font-size:13.7px;color:rgba(255,255,255,.92)}",
".ng-pc .side .big{font-size:16.2px;font-weight:700}",
".ng-pc .foot{position:relative;display:grid;grid-template-columns:repeat(4,1fr);gap:6px;padding:10.1px 16px;background:rgba(0,0,0,.42);border-top:1px solid rgba(255,255,255,.08)}",
".ng-pc .foot .k{font-size:9.9px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:var(--acc)}",
".ng-pc .foot .v{font-size:15px;font-weight:700;margin-top:1px}",
/* checkbox */
".ng-chk{display:grid;grid-template-columns:1fr 1fr;gap:7.1px 12px}",
".ng-chk label{display:flex;align-items:center;gap:8px;font-size:13.4px;color:rgba(255,255,255,.92);cursor:pointer;user-select:none}",
".ng-chk i{width:17px;height:17px;border-radius:4px;border:1.5px solid rgba(255,255,255,.28);display:flex;align-items:center;justify-content:center;font-style:normal;font-size:11px;line-height:1;transition:.16s}",
".ng-chk label.on i{background:var(--acc);border-color:var(--acc);color:var(--accTx)}",
".ng-chk label:hover i{border-color:var(--acc)}",
/* confronto */
".ng-cmp{display:grid;grid-template-columns:1fr auto 1fr;gap:7.1px 10px;align-items:center;font-size:13px}",
".ng-cmp .hd{font-size:12px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;color:rgba(255,255,255,.72)}",
".ng-cmp .lft b,.ng-cmp .rgt b{display:block;font-size:16px;font-weight:700}",
".ng-cmp .rgt{text-align:right}",
".ng-cmp .mid{text-align:center;min-width:150px}",
".ng-cmp .mid .t{font-size:11.1px;font-weight:700;letter-spacing:.7px;text-transform:uppercase;color:rgba(255,255,255,.85)}",
".ng-cmp .mid .d{font-size:12.5px;font-weight:700}",
".ng-cmp .ar{display:inline-block;color:var(--acc);font-size:11px;opacity:.9}",
/* stato */
".ng-ind{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:8.1px}",
".ng-ind .k{font-size:9.6px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:rgba(255,255,255,.6);line-height:1.15}",
".ng-ind .v{font-size:13.7px;font-weight:700;margin-top:2px;display:flex;align-items:center;gap:5px}",
".ng-ind .v:before{content:'';width:8px;height:2px;border-radius:2px;background:currentColor;flex:0 0 auto}",
".ng-msg{font-size:13.4px;color:rgba(255,255,255,.82);line-height:1.4}"
];

function ensureCSS(){
  if(!document.getElementById('ng29-font')){
    var l=document.createElement('link'); l.id='ng29-font'; l.rel='stylesheet';
    l.href='https://fonts.googleapis.com/css2?family=Archivo:wght@300;400;500;600;700;800&family=Archivo+Narrow:wght@500;600;700&family=Barlow+Condensed:wght@600;700;800&display=swap';
    document.head.appendChild(l);
  }
  var st=document.getElementById('ng29-css');
  if(!st){ st=document.createElement('style'); st.id='ng29-css'; document.head.appendChild(st); }
  st.textContent=CSS.join('\n');
}

/* ---------- icone ---------- */
function ic(d){ return '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+d+'</svg>'; }
var IC={
 tag:ic('<path d="M20.6 13.4 12 22l-9-9V4h9l8.6 8.6a1.4 1.4 0 0 1 0 2z"/><circle cx="7.5" cy="7.5" r="1.2"/>'),
 cash:ic('<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/>'),
 gift:ic('<path d="M4 11h16v9H4z"/><path d="M2.5 7.5h19V11h-19z"/><path d="M12 7.5V20"/>'),
 pct:ic('<path d="M19 5 5 19"/><circle cx="7.2" cy="7.2" r="2.2"/><circle cx="16.8" cy="16.8" r="2.2"/>'),
 clock:ic('<circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3.2 2"/>'),
 eur:ic('<path d="M17 7.5A6.2 6.2 0 0 0 8 10m0 4a6.2 6.2 0 0 0 9 2.5"/><path d="M5 10.5h7M5 13.5h7"/>'),
 cal:ic('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
 target:ic('<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.2"/><circle cx="12" cy="12" r="1"/>'),
 card:ic('<rect x="2.5" y="6" width="19" height="12" rx="2"/><path d="M2.5 10h19"/>'),
 swap:ic('<path d="M4 8.5h13l-3.2-3.2M20 15.5H7l3.2 3.2"/>'),
 check:ic('<circle cx="12" cy="12" r="9"/><path d="M8 12.3l2.7 2.7L16.4 9"/>'),
 pen:ic('<path d="M4 20h4l10-10-4-4L4 16z"/><path d="M13.5 6.5 17.5 10.5"/>'),
 hand:ic('<path d="M8 13V5.6a1.6 1.6 0 0 1 3.2 0V12m0-1.2a1.6 1.6 0 0 1 3.2 0V13m0-1a1.6 1.6 0 0 1 3.2 0v4.6A4.4 4.4 0 0 1 13 21h-1.4A4.2 4.2 0 0 1 8 17.4l-2.4-3a1.5 1.5 0 0 1 2.3-1.9z"/>'),
 x:ic('<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>'),
 plus:ic('<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>'),
 chat:ic('<path d="M20 15.5a2.5 2.5 0 0 1-2.5 2.5H8l-4 3V6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5z"/>'),
 user:ic('<circle cx="12" cy="8" r="3.4"/><path d="M5 20c1.4-3.4 4-5 7-5s5.6 1.6 7 5"/>'),
 users:ic('<circle cx="9" cy="8.5" r="3"/><path d="M2.8 20c1.2-3 3.4-4.4 6.2-4.4S14 17 15.2 20"/><path d="M16 6.2a3 3 0 0 1 0 5.6M17.6 15.8c2 .6 3.3 2 4 4.2"/>'),
 doc:ic('<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>'),
 shield:ic('<path d="M12 3l7 3v6c0 4.2-2.8 7.4-7 9-4.2-1.6-7-4.8-7-9V6z"/>'),
 arrow:ic('<path d="M5 12h13l-4-4M18 12l-4 4"/>'),
 lock:ic('<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8.5 10.5V7.8a3.5 3.5 0 0 1 7 0v2.7"/>'),
 money:ic('<path d="M6.5 8.5c0-2 2.5-3.5 5.5-3.5s5.5 1.5 5.5 3.5v7c0 2-2.5 3.5-5.5 3.5S6.5 17.5 6.5 15.5z"/><path d="M10 12h4"/>'),
 boot:ic('<path d="M4 6h5l1.5 5.5L19 14a2 2 0 0 1 1.6 2V19H4z"/><path d="M4 15h9"/>'),
 ball:ic('<circle cx="12" cy="12" r="9"/><path d="M12 8.2 8.6 10.7l1.3 4h4.2l1.3-4z"/>'),
 list:ic('<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 9h8M8 13h8M8 17h5"/>'),
 starI:ic('<path d="M12 4l2.5 5.2 5.5.8-4 3.9 1 5.6L12 16.9 7 19.5l1-5.6-4-3.9 5.5-.8z"/>'),
 warn:ic('<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17h.01"/>'),
 seal:ic('<path d="M12 2.4l2.2 1.6 2.6-.5 1 2.5 2.4 1.2-.4 2.6 1.7 2-1.7 2 .4 2.6-2.4 1.2-1 2.5-2.6-.5L12 21.6l-2.2-1.6-2.6.5-1-2.5-2.4-1.2.4-2.6-1.7-2 1.7-2-.4-2.6 2.4-1.2 1-2.5 2.6.5z"/><path d="M8.2 12.1l2.7 2.7 5-5.2"/>'),
 checkF:'<svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M7.6 12.4l3 3 5.8-6" fill="none" stroke="#0b1a10" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
};
function stars(n,tot){ var h=''; for(var i=1;i<=(tot||5);i++) h+='<i class="'+(i<=n?'on':'')+'">\u2605</i>'; return '<span class="ng-stars">'+h+'</span>'; }
function barRow(lbl,pct,val,col){
  return '<div style="margin:4.6px 0"><div style="display:flex;justify-content:space-between;font-size:12px;font-weight:600;letter-spacing:.5px;text-transform:uppercase;color:rgba(255,255,255,.85);margin-bottom:3px"><span>'+E(lbl)+'</span><span style="color:'+(col||'#fff')+'">'+E(val!=null?val:Math.round(pct)+'%')+'</span></div><div class="ng-track"><i style="width:'+cl(pct,0,100)+'%"></i></div></div>';
}

/* ---------- stato ---------- */
function N(){ var s=S_(); return s?s.ng29:null; }
function budget(){ var s=S_(); return s?(+s.budget||0):0; }
function nameParts(nm){ var t=(''+nm).trim().split(/\s+/); if(t.length<2) return {f:'',s:t[0]||''}; return {f:t.slice(0,t.length-1).join(' '),s:t[t.length-1]}; }
function accTx(c){ return lum(c)>0.62?'#0a0a0c':'#ffffff'; }

function shell(inner,useMine){
  ensureCSS();
  var n=N(); if(!n) return;
  var club=useMine?myClub():(n.p.club||myClub());
  var c=colOf(club), a=c[0];
  if(lum(a)<0.16) a='#d8dde6';
  var ov=document.getElementById('ng29-ov');
  if(!ov){ ov=document.createElement('div'); ov.className='ng-ov'; ov.id='ng29-ov'; document.body.appendChild(ov);
    ov.addEventListener('click',function(e){ if(e.target===ov) close(); }); }
  ov.innerHTML='<div class="ng29" style="--c1:'+c[0]+';--c2:'+c[1]+';--acc:'+a+';--accTx:'+accTx(a)+'"><button class="ng-x" onclick="ng29Close()">\u00d7</button>'+inner+'</div>';
  setScale();
  setTimeout(function(){ setScale(); fitNames(); },25);
}
function setScale(){
  var el=document.querySelector('#ng29-ov .ng29'); if(!el) return;
  var k=Math.min((window.innerWidth-14)/1600,(window.innerHeight-14)/1012);
  if(!(k>0)) k=1; if(k>1.3) k=1.3;
  el.style.setProperty('--k',k.toFixed(4));
}
function fitNames(){
  var els=document.querySelectorAll('#ng29-ov .ng-pc .nm .s');
  for(var i=0;i<els.length;i++){
    var el=els[i], box=el.parentNode; if(!box) continue;
    el.style.transform='none';
    var w=el.scrollWidth, av=box.clientWidth-2;
    if(w>av&&w>0) el.style.transform='scale('+(av/w).toFixed(3)+')';
  }
}
function close(){
  var ov=document.getElementById('ng29-ov');
  if(ov){ ov.style.transition='opacity .18s ease'; ov.style.opacity='0'; setTimeout(function(){ if(ov.parentNode) ov.parentNode.removeChild(ov); },180); }
  var s=S_(); if(s) s.ng29=null;
}
function toast(t){ try{ var f=G('toast'); if(f) f(t); }catch(e){} }

/* ---------- card giocatore (immagine 1) ---------- */
function pcard(opts){
  var n=N(); if(!n) return ''; var d=n.p, np=nameParts(d.name), cb=crest(opts&&opts.crest? opts.crest : d.club);
  var o=opts||{};
  var h='<div class="ng-pc"'+(o.style?' style="'+o.style+'"':'')+'>'+
   '<div class="stripes"></div>'+
   '<div class="body">'+
     '<div class="cn">'+E(o.top!=null?o.top:(d.club||'Svincolato'))+'</div>'+
     '<div class="no">'+E(o.num!=null?o.num:d.shirt)+'</div>'+
     (cb?'<img class="cb" src="'+E(cb)+'" onerror="this.style.display=\'none\'">':'')+
     (d.img?'<img class="fc" src="'+E(d.img)+'" onerror="this.style.visibility=\'hidden\'">':'')+
     '<div class="nm">'+(np.f?'<div class="f">'+E(np.f)+'</div>':'')+'<span class="s">'+E(np.s)+'</span>'+
       (o.roleUnder?'<div class="rl">'+E(d.role)+'</div>':'')+'</div>'+
     (o.side!==false?'<div class="side">'+(o.side||('<div class="big">N\u00b0 '+d.shirt+'</div><div>'+E(d.role)+'</div><div>'+d.age+' anni</div><div>Piede '+E(d.foot)+'</div>'))+'</div>':'')+
   '</div>'+
   (o.foot===false?'':'<div class="foot">'+(o.foot||(
      ft('Valore di mercato',M(d.value))+ft('Forma',n.form)+ft('Condizione',n.cond2+'%')+ft('Contratto',n.expiry)
   ))+'</div>')+
  '</div>';
  return h;
}
function ft(k,v){ return '<div><div class="k">'+E(k)+'</div><div class="v">'+E(v)+'</div></div>'; }

/* ===================== SCHERMATA 1: NEGOZIAZIONE DI MERCATO ===================== */
function instRows(fee,k){
  if(k<=1) return [r1(fee)];
  if(k===2) return [r1(fee*0.6),r1(fee-r1(fee*0.6))];
  var a=r1(fee*0.46), b=r1(fee*0.28); return [a,b,r1(fee-a-b)];
}
var OBJS=[{k:'top4',t:'Qualificazione tra le prime 4',f:0.78},
  {k:'title',t:'Vittoria del campionato',f:0.42},
  {k:'euro',t:'Qualificazione europea',f:0.88},
  {k:'safe',t:'Salvezza (fuori dalle ultime 3)',f:0.95}];
function objOf(k){ for(var i=0;i<OBJS.length;i++) if(OBJS[i].k===k) return OBJS[i]; return OBJS[0]; }
function appFactor(thr){ return cl(1.2-(+thr||25)/55,0.3,1); }
function offerValue(n){
  return r1(n.off.fee+(n.cond.app?n.off.bApp:0)+(n.cond.obj?n.off.bObj:0));
}
function offerWorth(n){
  return r1(n.off.fee
    +(n.cond.app?n.off.bApp*appFactor(n.off.bAppN):0)
    +(n.cond.obj?n.off.bObj*objOf(n.off.bObjK).f:0));
}
function askValue(n){ return r1(n.ask.fee+n.ask.bonus); }
function evalOffer(n){
  var sc=offerWorth(n)/Math.max(0.1,askValue(n));
  if(n.off.inst===2) sc-=0.03; if(n.off.inst===3) sc-=0.06;
  sc+=(n.off.sell-n.ask.sell)*0.004;
  if(n.cond.fut) sc-=0.02; if(n.cond.buy) sc-=0.03;
  sc+=(n.ind.urg-50)*0.0016+(n.ind.rel-50)*0.0012+(n.ind.flex-50)*0.0014;
  return sc;
}
function dl(v,unit){
  if(Math.abs(v)<0.05) return '<span class="ng-ok">in linea</span>';
  var neg=v<0, t=(neg?'\u2212':'+')+(unit==='%'?Math.abs(Math.round(v))+'%':'\u20ac'+Math.abs(r1(v))+' M');
  return '<span class="'+(neg?'ng-no':'ng-ok')+'">('+t+')</span>';
}
function screenFee(){
  var n=N(); if(!n) return;
  var sc=crest(n.p.club), mc=myCrest();
  var h='<div class="s1">';
  h+='<div class="s1-l">'+pcard({})+
     '<div class="ng-cd s1-cond"><h3>Condizioni del trasferimento</h3><div class="ng-chk" id="ng29-chk">'+feeChk()+'</div></div></div>';
  h+='<div class="s1-hd"><div class="ng-t1">Negoziazione di mercato</div>'+
     '<div class="ng-t2">Trattativa per l\'acquisto del cartellino</div>'+
     '<div class="s1-vs">'+
       '<div class="tm">'+tmLogo(sc,n.p.club)+'<span>'+E(n.p.club)+'</span></div>'+
       '<div class="mid"><span class="sw">'+IC.swap+'</span><div class="lb" id="ng29-defl">'+(n.cond.def?'Acquisto a titolo definitivo':'Acquisto con formula alternativa')+'</div></div>'+
       '<div class="tm r"><span>'+E(myClub())+'</span>'+tmLogo(mc,myClub())+'</div>'+
     '</div></div>';
  h+='<div class="s1-c">'+
     '<div class="ng-cd" id="ng29-ask">'+feeAsk()+'</div>'+
     '<div class="ng-cd" id="ng29-cmp">'+feeCmp()+'</div>'+
     '<div class="ng-cd" id="ng29-resp">'+feeResp()+'</div></div>';
  h+='<div class="s1-rt">'+
     '<div class="ng-cd s1-off">'+feeOffer()+'</div>'+
     '<div class="ng-cd" id="ng29-bud">'+feeBud()+'</div></div>';
  h+='<div class="ng-acts s1-ac">'+
     '<button class="ng-b p" onclick="ng29Send()">'+IC.swap+'Invia offerta</button>'+
     '<button class="ng-b" onclick="ng29Edit()">'+IC.pen+'Modifica offerta</button>'+
     '<button class="ng-b p" onclick="ng29AcceptAsk()">'+IC.hand+'Accetta richiesta</button>'+
     '<button class="ng-b" onclick="ng29Withdraw()">'+IC.x+'Ritira trattativa</button>'+
     '<button class="ng-b" onclick="ng29Ask()">'+IC.plus+'Chiedi al club</button>'+
   '</div>';
  h+='</div>';
  shell(h);
}
function clubIni(club){
  var t=(''+(club||'?')).replace(/^(FC|AC|AS|SS|SSC|SC|CF|RC|RCD|CD|AFC|BSC|VFB|VFL|TSG|SV|US|OGC|RB|FK|SK|NK)\s+/i,'').trim();
  return (t.slice(0,1)||'?').toUpperCase();
}
function tmLogo(u,club){
  var c=(u?[u]:[]).concat(crestAll(club)), out=[], i;
  for(i=0;i<c.length;i++){ if(c[i]&&out.indexOf(c[i])<0) out.push(c[i]); }
  var h='<span class="tml">';
  if(out.length) h+='<img src="'+E(out[0])+'" data-alt="'+E(out.slice(1).join('|'))+'" onerror="window.ng29Logo(this)" onload="window.ng29LogoOk(this)">';
  h+='<span class="ini"'+(out.length?' style="display:none"':'')+'>'+E(clubIni(club))+'</span>';
  return h+'</span>';
}
function feeChk(){
  return ck('def','Trasferimento definitivo')+ck('app','Bonus presenze')+
         ck('rate','Pagamento rateizzato')+ck('obj','Bonus obiettivi')+
         ck('fut','Percentuale futura')+ck('buy','Diritto recompra');
}
function feeAsk(){
  var n=N(), av=askValue(n);
  return '<h3>Richieste del club</h3>'+
    row(IC.tag,'Prezzo del cartellino',M(n.ask.fee))+
    row(IC.cash,'Pagamento immediato',M(n.ask.imm))+
    row(IC.gift,'Bonus futuri',M(n.ask.bonus))+
    row(IC.pct,'Percentuale sulla rivendita',n.ask.sell+'%')+
    row(IC.clock,'Scadenza trattativa',n.ask.days+(n.ask.days===1?' giorno':' giorni'))+
    '<div class="ng-sep"></div><div class="ng-2c" style="text-align:center">'+
      '<div><div class="k">Valutazione del club</div><div class="n">'+M(av)+'</div></div>'+
      '<div><div class="k">Valore di mercato</div><div class="n">'+M(n.p.value)+'</div></div>'+
    '</div>';
}
function feeCmp(){
  var n=N();
  return '<h3>Confronto offerta</h3><div class="ng-cmp">'+
    '<div class="hd">Club venditore</div><div class="hd mid"></div><div class="hd rgt">Nostra offerta</div>'+
    '<div class="lft">Prezzo:<b>'+M(n.ask.fee)+'</b></div>'+
      '<div class="mid"><span class="ar">\u25c0</span><div><div class="t">Prezzo</div><div class="d">'+dl(n.off.fee-n.ask.fee)+'</div></div><span class="ar on">\u25b6</span></div>'+
      '<div class="rgt">Prezzo:<b>'+M(n.off.fee)+'</b></div>'+
    '<div class="lft">Bonus:<b>'+M(n.ask.bonus)+'</b></div>'+
      '<div class="mid"><span class="ar">\u25c0</span><div><div class="t">Bonus</div><div class="d">'+dl((n.off.bApp+n.off.bObj)-n.ask.bonus)+'</div></div><span class="ar on">\u25b6</span></div>'+
      '<div class="rgt">Bonus:<b>'+M(r1(n.off.bApp+n.off.bObj))+'</b></div>'+
    '<div class="lft sm">Rivendita: <b>'+n.ask.sell+'%</b></div>'+
      '<div class="mid"><span class="ar on">\u25c0</span><div><div class="t">Rivendita</div><div class="d">'+dl(n.off.sell-n.ask.sell,'%')+'</div></div><span class="ar">\u25b6</span></div>'+
      '<div class="rgt sm">Rivendita: <b>'+n.off.sell+'%</b></div>'+
    '<div class="lft">Pagamento:<b>Immediato</b></div>'+
      '<div class="mid"><span class="ar'+(n.off.inst>1?' on':'')+'">\u25c0</span><div><div class="t">Pagamento</div></div><span class="ar'+(n.off.inst>1?'':' on')+'">\u25b6</span></div>'+
      '<div class="rgt">Pagamento:<b>'+(n.off.inst===1?'Immediato':n.off.inst+' rate')+'</b></div>'+
  '</div>';
}
function feeResp(){
  var n=N();
  return '<h3>Risposta del club<span class="sm">Round '+n.round+'/'+n.maxRound+'</span></h3>'+
    '<div class="ng-msg">'+n.msg+'</div>'+
    (n.newAsk?'<div class="s1-new"><div class="t">Nuova richiesta</div>'+
      '<div class="v"><span>Prezzo: <b>'+M(n.newAsk.fee)+'</b></span><span>Bonus: <b>'+M(n.newAsk.bonus)+'</b></span><span>Rivendita: <b>'+n.newAsk.sell+'%</b></span></div>'+
      '<div class="ng-msg c">'+E(n.msg2||'Il club \u00e8 disposto a chiudere la trattativa.')+'</div></div>':'');
}
function cur(k,v,id,dis){
  return '<span class="ng-cur'+(dis?' dis':'')+'"><i>\u20ac</i><input class="ng-in"'+(id?' id="'+id+'"':'')+' type="number" step="0.5" min="0" value="'+v+'"'+(dis?' disabled':'')+' oninput="ng29Set(\''+k+'\',this.value)"><b>M</b></span>';
}
function thrCtl(){ var n=N(), d=!n.cond.app;
  return '<span class="ng-thr'+(d?' dis':'')+'">dopo <input class="ng-in" id="ng29-bappn" type="number" min="1" max="60" step="1" value="'+n.off.bAppN+'"'+(d?' disabled':'')+' oninput="ng29Set(\'bAppN\',this.value)"> presenze</span>';
}
function objCtl(){ var n=N(), d=!n.cond.obj;
  var h='<select class="ng-sel2'+(d?' dis':'')+'"'+(d?' disabled':'')+' onchange="ng29Obj(this.value)">';
  for(var i=0;i<OBJS.length;i++) h+='<option value="'+OBJS[i].k+'"'+(OBJS[i].k===n.off.bObjK?' selected':'')+'>'+E(OBJS[i].t)+'</option>';
  return h+'</select>';
}
function sellCtl(){ var n=N(), d=!n.cond.fut;
  return '<span class="ng-cur pc'+(d?' dis':'')+'"><input class="ng-in" id="ng29-sellin" type="number" step="1" min="0" max="50" value="'+n.off.sell+'"'+(d?' disabled':'')+' oninput="ng29SetSell(this.value)"><b>%</b></span>'+
    '<span class="ng-pm'+(d?' dis':'')+'"><button onclick="ng29Adj(\'sell\',-5)">\u2212</button><button onclick="ng29Adj(\'sell\',5)">+</button></span>';
}
function modeCtl(){ var n=N(), d=!n.cond.rate;
  return '<b id="ng29-mode">'+(n.off.inst===1?'Unica soluzione':n.off.inst+' rate annuali')+'</b>'+
    '<span class="ng-pm'+(d?' dis':'')+'"><button onclick="ng29Adj(\'inst\',-1)">\u2212</button><button onclick="ng29Adj(\'inst\',1)">+</button></span>';
}
function feeOffer(){
  var n=N();
  return '<h3>La nostra offerta</h3>'+
    row(IC.eur,'Prezzo fisso',cur('fee',n.off.fee,'ng29-fee'))+
    row(IC.cal,'Bonus legati alle presenze',thrCtl()+cur('bApp',n.off.bApp,'ng29-bapp',!n.cond.app))+
    row(IC.target,'Bonus legati agli obiettivi',objCtl()+cur('bObj',n.off.bObj,'ng29-bobj',!n.cond.obj))+
    row(IC.pct,'Percentuale sulla rivendita',sellCtl())+
    row(IC.card,'Modalit\u00e0 di pagamento',modeCtl())+
    '<div id="ng29-inst">'+feeInst()+'</div>'+
    '<div class="ng-sep"></div><div id="ng29-tot">'+feeTot()+'</div>'+
    '<div class="ng-sep"></div><div id="ng29-state">'+feeState()+'</div>';
}
function feeInst(){
  var n=N(), inst=instRows(n.off.fee,n.off.inst), L=['Prima rata','Seconda rata','Terza rata'];
  if(n.off.inst<2) return '';
  return inst.map(function(v,i){ return '<div class="ng-r sub"><span class="l">'+L[i]+'</span><span class="v"><span class="ng-pill">'+M(v)+'</span></span></div>'; }).join('');
}
function feeTot(){
  var n=N(), inst=instRows(n.off.fee,n.off.inst), ov=offerValue(n), bg=budget();
  return '<div class="ng-2c" style="text-align:center">'+
    '<div><div class="k">Valore potenziale dell\'offerta</div><div class="n">'+M(ov)+'</div></div>'+
    '<div><div class="k">Esborso immediato</div><div class="n'+(inst[0]>bg?' ng-no':'')+'">'+M(inst[0])+'</div></div></div>';
}
function feeState(){
  var n=N(), st=cl(Math.round(evalOffer(n)*88),3,99); n.state=st;
  var lbl=st>=92?'Il club \u00e8 pronto a chiudere':st>=62?'Il club \u00e8 disposto a trattare':st>=35?'Il club considera l\'offerta insufficiente':'Il club rifiuta questa offerta';
  return '<h3 class="st">Stato della trattativa - '+st+'%</h3>'+
    '<div class="ng-msg r">'+E(lbl)+'</div>'+
    '<div class="ng-track"><i style="width:'+st+'%"></i></div>'+
    '<div class="ng-ind">'+
      indi('Flessibilit\u00e0 del club',n.ind.flex,['Bassa','Media','Alta'])+
      indi('Urgenza di vendita',n.ind.urg,['Bassa','Media','Alta'])+
      indi('Interesse per la tua offerta',n.ind.intr,['Basso','Discreto','Buono'])+
      indi('Rapporto tra i club',n.ind.rel,['Teso','Neutro','Positivo'])+
    '</div>';
}
function feeBud(){
  var n=N(), inst=instRows(n.off.fee,n.off.inst), ov=offerValue(n), bg=budget();
  return '<h3>Impatto sul budget</h3><div class="ng-2c" style="text-align:center">'+
    '<div><div class="k">Budget trasferimenti</div><div class="n">'+M(bg)+'</div></div>'+
    '<div><div class="k">Offerta attuale</div><div class="n">'+M(n.off.fee)+'</div></div>'+
    '<div><div class="k">Budget residuo</div><div class="n">'+M(r1(bg-inst[0]))+'</div></div>'+
    '<div><div class="k">Costo potenziale massimo</div><div class="n">'+M(ov)+'</div></div></div>';
}
function patchFee(){
  var n=N(); if(!n) return;
  var parts=[['ng29-ask',feeAsk],['ng29-cmp',feeCmp],['ng29-resp',feeResp],['ng29-inst',feeInst],['ng29-tot',feeTot],['ng29-state',feeState],['ng29-bud',feeBud]];
  var found=false;
  for(var i=0;i<parts.length;i++){ var el=document.getElementById(parts[i][0]); if(el){ el.innerHTML=parts[i][1](); found=true; } }
  if(!found){ screenFee(); return; }
  var sp=document.getElementById('ng29-sellin');
  if(sp&&document.activeElement!==sp) sp.value=n.off.sell;
  var bn=document.getElementById('ng29-bappn');
  if(bn&&document.activeElement!==bn) bn.value=n.off.bAppN;
  var mo=document.getElementById('ng29-mode'); if(mo) mo.textContent=(n.off.inst===1?'Unica soluzione':n.off.inst+' rate annuali');
  var df=document.getElementById('ng29-defl'); if(df) df.textContent=(n.cond.def?'Acquisto a titolo definitivo':'Acquisto con formula alternativa');
  var ch=document.getElementById('ng29-chk'); if(ch) ch.innerHTML=feeChk();
}
function row(icn,lab,val){ return '<div class="ng-r"><span class="l">'+icn+E(lab)+'</span><span class="v">'+val+'</span></div>'; }
function ck(k,lab){ var n=N(); return '<label class="'+(n.cond[k]?'on':'')+'" onclick="ng29Cond(\''+k+'\')"><i>'+(n.cond[k]?'\u2713':'')+'</i>'+E(lab)+'</label>'; }
function indi(k,v,words){
  var t=v>=66?words[2]:v>=40?words[1]:words[0];
  var c=v>=66?'#3fd07a':v>=40?'#ffc857':'#9aa3af';
  return '<div><div class="k">'+E(k)+'</div><div class="v" style="color:'+c+'"><em style="background:'+c+'"></em>'+E(t)+'</div></div>';
}
/* --- layout schermata 1: griglia fissa come nell'immagine di riferimento --- */
CSS.push(".s1{display:grid;grid-template-columns:452px 528px 528px;grid-template-rows:120px 1fr 72px;gap:16px 24px;height:100%;min-height:0}");
CSS.push(".s1-l{grid-column:1;grid-row:1/3;display:grid;grid-template-rows:1fr auto;gap:14px;min-height:0}");
CSS.push(".s1-hd{grid-column:2/4;grid-row:1;display:block;text-align:center;animation:ngUp .4s cubic-bezier(.2,.8,.25,1) both}");
CSS.push(".s1-c{grid-column:2;grid-row:2;display:grid;grid-template-rows:auto auto 1fr;gap:14px;min-height:0}");
CSS.push(".s1-rt{grid-column:3;grid-row:2;display:grid;grid-template-rows:1fr auto;gap:14px;min-height:0}");
CSS.push(".s1-ac{grid-column:1/4;grid-row:3;display:grid;grid-template-columns:repeat(5,1fr);gap:14px}");
CSS.push(".s1-ac .ng-b{height:100%;font-size:15px;letter-spacing:.6px}");
CSS.push(".s1-hd .ng-t1{font-size:34px;font-weight:800;letter-spacing:.4px;line-height:1.02}");
CSS.push(".s1-hd .ng-t2{font-size:15px;font-weight:400;color:rgba(255,255,255,.72);margin-top:2px}");
CSS.push(".s1-vs{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:24px;margin-top:8px}");
CSS.push(".s1-vs .tm{display:flex;align-items:center;gap:14px;justify-content:flex-end;font-size:30px;font-weight:800;letter-spacing:.4px;text-transform:uppercase;white-space:nowrap}");
CSS.push(".s1-vs .tm.r{justify-content:flex-start}");
CSS.push(".s1-vs .tm img{height:46px;width:46px;object-fit:contain;flex:0 0 auto}");
CSS.push(".s1-vs .tm .ini{width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);flex:0 0 auto}");
CSS.push(".s1-vs .mid{text-align:center}");
CSS.push(".s1-vs .sw{display:inline-block;width:34px;height:34px;color:var(--acc)}");
CSS.push(".s1-vs .sw .ic{width:100%;height:100%}");
CSS.push(".s1-vs .lb{font-size:12px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,.8);margin-top:3px;white-space:nowrap}");
CSS.push(".s1 .ng-cd{padding:14px 16px}");
CSS.push(".s1 .ng-cd>h3{font-size:18px;letter-spacing:.5px;margin-bottom:8px}");
CSS.push(".s1 .ng-cd>h3 .sm{font-size:12px;letter-spacing:1.1px}");
CSS.push(".s1 .ng-r{padding:5px 0}");
CSS.push(".s1 .ng-r .l{font-size:14px;letter-spacing:.2px}");
CSS.push(".s1 .ng-r .v{font-size:16px}");
CSS.push(".s1 .ng-r.sub .l{font-size:13px;color:rgba(255,255,255,.7)}");
CSS.push(".s1 .ng-2c .k{font-size:11px;letter-spacing:1.1px}");
CSS.push(".s1 .ng-2c .n{font-size:24px;font-weight:800}");
CSS.push(".s1-off{display:flex;flex-direction:column}");
CSS.push(".s1-off .st{margin-top:2px}");
CSS.push(".ng-cur{display:inline-flex;align-items:center;gap:4px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);border-radius:8px;padding:3px 10px}");
CSS.push(".ng-cur i{font-style:normal;font-size:14px;font-weight:600;color:rgba(255,255,255,.8)}");
CSS.push(".ng-cur b{font-size:14px;font-weight:600;color:rgba(255,255,255,.8)}");
CSS.push(".ng-cur input{width:62px;background:transparent;border:0;outline:none;color:#fff;font-family:inherit;font-size:17px;font-weight:800;text-align:center;-moz-appearance:textfield}");
CSS.push(".ng-cur input::-webkit-outer-spin-button,.ng-cur input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}");
CSS.push(".s1-cond .ng-chk{display:grid;grid-template-columns:1fr 1fr;gap:8px 16px}");
CSS.push(".s1-cond .ng-chk label{font-size:14px}");
CSS.push(".s1-new{margin-top:7px}");
CSS.push(".s1-new .t{font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--acc);margin-bottom:3px}");
CSS.push(".s1-new .v{display:flex;justify-content:space-between;gap:10px;font-size:14px}");
CSS.push(".s1 .ng-msg{font-size:14px;line-height:1.35}");
CSS.push(".s1 .ng-msg.r{text-align:right}");
CSS.push(".s1 .ng-msg.c{text-align:center;margin-top:5px;opacity:.85}");
CSS.push(".s1 .ng-cmp{row-gap:6px}");
CSS.push(".s1 .ng-cmp .hd{font-size:13px}");
CSS.push(".s1 .ng-cmp .lft,.s1 .ng-cmp .rgt{font-size:14px}");
CSS.push(".s1 .ng-cmp .lft b,.s1 .ng-cmp .rgt b{font-size:18px}");
CSS.push(".s1 .ng-cmp .lft.sm b,.s1 .ng-cmp .rgt.sm b{font-size:15px;display:inline}");
CSS.push(".s1 .ng-cmp .mid{display:flex;align-items:center;justify-content:center;gap:7px}");
CSS.push(".s1 .ng-cmp .mid .t{font-size:12px;font-weight:700;letter-spacing:1.1px;text-transform:uppercase;color:var(--acc)}");
CSS.push(".s1 .ng-cmp .mid .d{font-size:13px}");
CSS.push(".s1 .ng-cmp .ar{font-size:13px;color:rgba(255,255,255,.22)}");
CSS.push(".s1 .ng-cmp .ar.on{color:var(--acc)}");
CSS.push(".s1 .ng-ind{gap:6px}");
CSS.push(".s1 .ng-ind .k{font-size:10.5px;letter-spacing:.8px;line-height:1.15}");
CSS.push(".s1 .ng-ind .v{font-size:14px;font-weight:700;display:flex;align-items:center;gap:5px}");
CSS.push(".s1 .ng-ind .v em{width:3px;height:13px;border-radius:2px;display:inline-block}");
/* card giocatore piu grande e informazioni leggibili come nel riferimento */
CSS.push(".s1 .ng-pc .cn{font-size:13px;letter-spacing:2px;top:14px;left:18px}");
CSS.push(".s1 .ng-pc .no{font-size:112px;top:26px;left:14px;-webkit-text-stroke:2.5px rgba(255,255,255,.92)}");
CSS.push(".s1 .ng-pc .cb{height:38px;top:14px;right:18px}");
CSS.push(".s1 .ng-pc .fc{height:90%;max-width:116%}");
CSS.push(".s1 .ng-pc .nm{left:22px;bottom:16px;max-width:58%}");
CSS.push(".s1 .ng-pc .nm .f{font-size:15px;letter-spacing:5px}");
CSS.push(".s1 .ng-pc .nm .s{font-size:62px;line-height:.94}");
CSS.push(".s1 .ng-pc .side{right:22px;bottom:18px;line-height:1.34}");
CSS.push(".s1 .ng-pc .side div{font-size:17px}");
CSS.push(".s1 .ng-pc .side .big{font-size:20px;font-weight:700}");
CSS.push(".s1 .ng-pc .foot{padding:11px 18px;gap:8px}");
CSS.push(".s1 .ng-pc .foot .k{font-size:11px;letter-spacing:.9px}");
CSS.push(".s1 .ng-pc .foot .v{font-size:20px;margin-top:2px}");

/* ===================== SCHERMATA 2: ACCORDO RAGGIUNTO ===================== */
function screenDeal(){
  var n=N(); if(!n) return;
  var a=n.agreed, bg=budget(), save=r1(Math.max(0,n.ask.fee0-a.fee)), tot=r1(a.fee+a.bonus);
  var h='<div class="s2">';
  h+='<div class="s2-l">'+pcard({foot:ft('Nazionalit\u00e0',n.p.nation||'-')+ft('Age',n.p.age+'')+ft('Overall',n.p.rate+''),side:'<div class="big">'+M(n.p.value)+'</div>',roleUnder:true})+
    '<div class="ng-cd s2-msg"><div class="hd"><span class="i">'+IC.chat+'</span>'+
      '<div><div class="k">Messaggio del club</div><div class="w">Club Owner</div></div></div>'+
      '<div class="ng-msg">Accordo raggiunto per il trasferimento. Manca solo l\'intesa sulle condizioni personali del giocatore.</div>'+
    '</div></div>';
  h+='<div class="s2-m">'+
    '<div class="s2-hd"><div class="tt">Accordo raggiunto</div>'+
    '<div class="sb">Il club ha accettato la nostra offerta per il cartellino.</div></div>'+
    '<div class="s2-done"><span class="ck">'+IC.seal+'</span><div><div class="k">Trattativa con il club</div><div class="v">Completata</div></div></div>'+
    '<div class="ng-cd s2-agr"><h3>Accordo con il club</h3>'+
      row2('Prezzo del cartellino',M(a.fee))+
      row2('Modalit\u00e0 di pagamento',a.instN===1?'Unica soluzione':a.instN+' rate')+
      a.inst.map(function(v,i){ return (a.instN>1?'<div class="ng-r sub"><span class="l">'+['Prima rata','Seconda rata','Terza rata'][i]+'</span><span class="v">'+M(v)+'</span></div>':''); }).join('')+
      row2('Bonus',M(a.bonus))+row2('Percentuale sulla rivendita',a.sell+'%')+
      '<div class="ng-sep"></div>'+
      '<div class="ng-r"><span class="l">Stato</span><span class="v"><em class="dot"></em>Accordo raggiunto</span></div>'+
    '</div>'+
    '<div class="ng-cd s2-role"><h3>Contrattiva</h3>'+
      '<div class="rl">'+E(n.p.role)+'</div>'+
      '<div class="k">Prezzo del cartellino</div>'+
      '<div class="v">'+M(n.p.value)+'</div>'+
    '</div>'+
  '</div>';
  h+='<div class="ng-cd s2-r1"><h3>Risultato della negoziazione</h3>'+
      row2('Richiesta iniziale del club',M(n.ask.fee0))+row2('Nostra offerta iniziale',M(n.off0))+row2('Accordo finale',M(a.fee))+
      '<div class="s2-save"><span class="ck">'+IC.checkF+'</span><div><div class="k">Risparmio ottenuto</div><div class="n">'+M(save)+'</div></div></div>'+
      '<div class="s2-score"><div class="k">Valutazione della trattativa</div><div class="n">'+n.score+' <small>/ 100</small></div>'+
      '<div class="t">'+(n.score>=85?'Ottimo accordo':n.score>=70?'Buon accordo':'Accordo accettabile')+'</div></div>'+
    '</div>';
  h+='<div class="ng-cd s2-r2"><h3>Impatto sul budget</h3>'+
      row2('Budget iniziale',M(bg))+row2('Valore dell\'operazione',M(tot))+
      row2('Budget residuo',M(r1(bg-a.inst[0])))+row2('Bonus potenziali',M(a.bonus))+
      '<div class="ng-msg mt">Il costo del cartellino \u00e8 stato concordato. Il contratto personale non \u00e8 ancora definitivo.</div>'+
    '</div>';
  h+='<div class="ng-cd s2-st"><h3>Stato del trasferimento</h3><div class="stp">'+
      step('01','Trattativa con il club','Completata','dn')+
      step('02','Contratto del giocatore','Da negoziare','on')+
      step('03','Trasferimento','Da completare','')+
    '</div></div>';
  h+='<div class="ng-cd s2-nx"><h3 class="ph">Prossima fase</h3>'+
      '<div class="tt">Negoziazione del contratto</div>'+
      '<div class="ng-msg">L\'accordo con il club \u00e8 stato raggiunto. Ora devi trovare un accordo con il giocatore e il suo agente sulle condizioni personali.</div>'+
      '<div class="s2-next">'+nx('Stipendio')+nx('Durata contratto')+nx('Bonus e clausole')+'</div>'+
      '<div class="s2-ag"><span class="i">'+IC.user+'</span>'+
      '<div><div class="k">Agente del giocatore</div>'+
      '<div class="v">'+E(n.agent.name)+' <span>| Il procuratore \u00e8 pronto a iniziare la trattativa.</span></div></div></div>'+
    '</div>';
  h+='<div class="s2-b"><button class="ng-b p" onclick="ng29ToWage()">Continua con la negoziazione dello stipendio</button>'+
     '<button class="ng-lnk" onclick="ng29Close()">Torna al mercato</button></div>';
  h+='</div>';
  shell(h);
}
function row2(k,v){ return '<div class="ng-r"><span class="l">'+E(k)+'</span><span class="v">'+v+'</span></div>'; }
function step(nn,t,s,cls){ return '<div class="s '+cls+'"><div class="n">'+nn+'</div><div class="t">'+E(t)+'</div><div class="sb">'+E(s)+'</div></div>'; }
function nx(t){ return '<div class="nx"><div class="k">'+E(t)+'</div><div class="v">Da negoziare</div></div>'; }
CSS.push(".s2{display:grid;grid-template-columns:330px 476px 1fr 1fr;grid-template-rows:minmax(0,1.38fr) auto minmax(0,1fr) auto;gap:13px 20px;height:100%;min-height:0;align-items:stretch}");
CSS.push(".s2-l{grid-column:1;grid-row:1/4;display:grid;grid-template-rows:auto auto;align-content:start;gap:13px;min-height:0}");
CSS.push(".s2-m{grid-column:2;grid-row:1/4;display:grid;grid-template-rows:auto auto auto auto;align-content:start;gap:13px;min-height:0}");
CSS.push(".s2-r1{grid-column:3;grid-row:1;min-height:0}");
CSS.push(".s2-r2{grid-column:4;grid-row:1;min-height:0}");
CSS.push(".s2-st{grid-column:3/5;grid-row:2}");
CSS.push(".s2-nx{grid-column:3/5;grid-row:3}");
CSS.push(".s2-b{grid-column:2/5;grid-row:4;display:flex;flex-direction:column;align-items:center;gap:8px;align-self:end}");
CSS.push(".s2-b .ng-b{width:100%;height:46px;font-size:16.5px;letter-spacing:1.3px}");
CSS.push(".s2 .ng-cd{padding:15px 18px}");
CSS.push(".s2 .ng-cd>h3{font-family:var(--disp);font-size:21px;font-weight:700;letter-spacing:.5px;margin-bottom:10px}");
CSS.push(".s2 .ng-r{padding:8px 0;border-bottom:1px solid rgba(255,255,255,.055)}");
CSS.push(".s2 .ng-r:last-child{border-bottom:0}");
CSS.push(".s2 .ng-r .l{font-size:15px;letter-spacing:.3px;color:rgba(255,255,255,.88);text-transform:uppercase;font-weight:500}");
CSS.push(".s2 .ng-r .v{font-family:var(--disp);font-size:23px;font-weight:700}");
CSS.push(".s2 .ng-r.sub .l{font-size:15px;padding-left:18px;color:rgba(255,255,255,.66);text-transform:uppercase}");
CSS.push(".s2 .ng-r.sub .v{font-size:21px}");
CSS.push(".s2 .ng-r .v .dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:#fff;margin-right:8px;vertical-align:middle}");
CSS.push(".s2-hd{animation:ngUp .42s both}");
CSS.push(".s2-hd .tt{font-family:var(--disp);font-size:52px;font-weight:800;line-height:1;letter-spacing:-.3px;text-transform:uppercase;color:var(--acc);white-space:nowrap}");
CSS.push(".s2-hd .sb{font-size:15px;color:rgba(255,255,255,.76);margin-top:7px;max-width:88%;line-height:1.3}");
CSS.push(".s2-done{display:flex;align-items:center;gap:14px;animation:ngUp .45s .08s both}");
CSS.push(".s2-done .ck{width:52px;height:52px;color:#fff;flex:0 0 auto}");
CSS.push(".s2-done .ck .ic{width:100%;height:100%;stroke-width:1.3}");
CSS.push(".s2-done .k{font-size:14px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,.72)}");
CSS.push(".s2-done .v{font-family:var(--disp);font-size:28px;font-weight:800;text-transform:uppercase;line-height:1}");
CSS.push(".s2-msg .hd{display:flex;gap:11px;align-items:flex-start}");
CSS.push(".s2-msg .hd .i{width:23px;height:23px;color:var(--acc);flex:0 0 auto}");
CSS.push(".s2-msg .hd .i .ic{width:100%;height:100%}");
CSS.push(".s2-msg .hd .k{font-size:13px;font-weight:700;letter-spacing:.7px;text-transform:uppercase}");
CSS.push(".s2-msg .hd .w{font-size:11.5px;color:rgba(255,255,255,.6)}");
CSS.push(".s2-msg .ng-msg{margin-top:7px;font-size:13px;line-height:1.35}");
CSS.push(".s2-role .rl{font-family:var(--disp);font-size:34px;font-weight:800;letter-spacing:.2px;text-transform:uppercase;line-height:1}");
CSS.push(".s2-role .k{font-size:13px;color:rgba(255,255,255,.64);text-transform:uppercase;letter-spacing:1px;margin-top:10px}");
CSS.push(".s2-role .v{font-family:var(--disp);font-size:30px;font-weight:800}");
CSS.push(".s2-save{display:flex;align-items:center;gap:12px;margin-top:7px;padding:7px 13px;border-radius:10px;background:rgba(37,190,105,.12);border:1px solid rgba(63,208,122,.42)}");
CSS.push(".s2-save .ck{width:30px;height:30px;color:#3fd07a;flex:0 0 auto}");
CSS.push(".s2-save .ck .ic{width:100%;height:100%}");
CSS.push(".s2-save .k{font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#3fd07a}");
CSS.push(".s2-save .n{font-family:var(--disp);font-size:29px;font-weight:800;color:#3fd07a;line-height:1}");
CSS.push(".s2-score{margin-top:6px;padding:7px 13px;border-radius:10px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08)}");
CSS.push(".s2-score .k{font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,.72)}");
CSS.push(".s2-score .n{font-family:var(--disp);font-size:29px;font-weight:800;color:#3fd07a;line-height:1.05}");
CSS.push(".s2-score .n small{font-size:.5em;color:rgba(255,255,255,.7);font-weight:600}");
CSS.push(".s2-score .t{font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#3fd07a}");
CSS.push(".s2-r2 .ng-msg.mt{margin-top:12px;font-size:14.5px;line-height:1.4}");
CSS.push(".s2-st .stp{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;position:relative;margin-top:26px}");
CSS.push(".s2-st .s{position:relative;padding-top:12px;border-top:2px solid rgba(255,255,255,.14)}");
CSS.push(".s2-st .s .n{position:absolute;top:-6px;left:0;transform:translateY(-100%);font-family:var(--disp);font-size:26px;font-weight:800;color:rgba(255,255,255,.32);background:none;padding:0}");
CSS.push(".s2-st .s.dn{border-top-color:var(--acc)}");
CSS.push(".s2-st .s.dn .n{color:var(--acc)}");
CSS.push(".s2-st .s.on{border-top-color:var(--acc)}");
CSS.push(".s2-st .s.on .n{color:var(--acc)}");
CSS.push(".s2-st .s.on .t{display:inline-block;border:1px solid var(--acc);border-radius:8px;padding:4px 9px;box-shadow:0 0 20px color-mix(in srgb,var(--acc) 26%,transparent)}");
CSS.push(".s2-st .s .t{font-size:15px;font-weight:700;letter-spacing:.8px;text-transform:uppercase}");
CSS.push(".s2-st .s .sb{font-size:12.5px;color:rgba(255,255,255,.62);text-transform:uppercase;letter-spacing:.9px;margin-top:5px}");
CSS.push(".s2-nx .ph{color:var(--acc);font-size:13px!important;letter-spacing:1.2px!important;text-transform:uppercase;margin-bottom:2px!important}");
CSS.push(".s2-nx .tt{font-family:var(--disp);font-size:29px;font-weight:800;letter-spacing:.2px;text-transform:uppercase;line-height:1.02}");
CSS.push(".s2-nx .ng-msg{margin-top:5px;font-size:13.5px;line-height:1.32}");
CSS.push(".s2-next{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:10px}");
CSS.push(".s2-next .nx{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:8px 13px}");
CSS.push(".s2-next .nx .k{font-size:14px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,.88)}");
CSS.push(".s2-next .nx .v{font-size:14px;color:rgba(255,255,255,.44);margin-top:2px}");
CSS.push(".s2-ag{display:flex;align-items:center;gap:11px;margin-top:10px}");
CSS.push(".s2-ag .i{width:22px;height:22px;color:var(--acc);flex:0 0 auto}");
CSS.push(".s2-ag .i .ic{width:100%;height:100%}");
CSS.push(".s2-ag .k{font-size:13px;letter-spacing:1.1px;text-transform:uppercase;color:rgba(255,255,255,.66)}");
CSS.push(".s2-ag .v{font-size:16px;font-weight:700}");
CSS.push(".s2-ag .v span{font-weight:400;color:rgba(255,255,255,.7)}");

/* ===================== SCHERMATA 3: NEGOZIAZIONE CONTRATTO ===================== */
var MOODS=['Ostile','Contrariato','Neutrale','Positivo','Entusiasta'];
var ROLES=['Riserva','Rotazione','Titolare','Stella della squadra'];
function wAnn(n){ return (+n.con.wage||0)*52/1000; }
function wSign(n){ return +n.con.sign||0; }
function wCost(n){ return r1(wAnn(n)+wSign(n)); }
function wPaid(n){ try{ return (n.agreed&&n.agreed.inst)?(+n.agreed.inst[0]||0):0; }catch(e){ return 0; } }
function wLeft(n){ return r1(Math.max(0,budget()-wPaid(n))); }
function wCapAnn(n){ return Math.max(0.1,r1(wLeft(n)-wSign(n))); }
function wCapSign(n){ return Math.max(0,r1(wLeft(n)-wAnn(n))); }
function wFree(n){ return r1(wLeft(n)-wCost(n)); }
function cScore(n){
  var sc=0;
  sc+=cl((n.con.wage/Math.max(1,n.dem.wage))*100,40,130)*(n.prio.wage/100)*0.62;
  sc+=(n.con.sign>=n.dem.sign?12:6)*(n.prio.bonus/100);
  sc+=(n.con.years>=n.dem.years?14:n.con.years>=n.dem.years-1?8:2)*(n.prio.years/100);
  sc+=(n.con.role==='Titolare'||n.con.role==='Stella della squadra'?16:n.con.role==='Rotazione'?7:2)*(n.prio.role/100);
  sc+=(n.con.noClause?1:(n.con.clause>=n.dem.clause?8:4))*(n.prio.clause/100);
  sc+=((n.con.bApp>=n.dem.bApp?4:2)+(n.con.bGoal>=n.dem.bGoal?4:2)+(n.con.bAss>=n.dem.bAss?4:2))*(n.prio.bonus/100);
  sc+=(n.mood-2)*5+n.talks*1.4;
  sc*=(1.1-0.14*n.agent.tough);
  return cl(Math.round(sc),3,99);
}
function dfBox(txt,neg){ return '<div class="df '+(txt==null?'e':(neg?'n':'y'))+'">'+(txt==null?'':txt)+'</div>'; }
function dfM(v){ return Math.abs(v)>0.049?((v<0?'\u2212 ':'+ ')+MY(Math.abs(v))):null; }
function dfK(v){ return Math.round(v)!==0?((v<0?'\u2212 ':'+ ')+K(Math.abs(v))):null; }
function dfY(v){ return v!==0?((v<0?'\u2212 ':'+ ')+Math.abs(v)+(Math.abs(v)===1?' anno':' anni')):null; }
function wNeg(t){ return !!t&&(''+t).charAt(0)==='\u2212'; }
function wCtl(k,val,o){
  o=o||{}; var dis=o.dis?' dis':'', d=o.dis?' disabled':'';
  return '<span class="ng-cur'+dis+'">'+(o.eur?'<i>\u20ac</i>':'')+
    '<input class="ng-in" id="'+o.id+'" type="number" step="'+(o.step||1)+'" min="'+(o.min==null?0:o.min)+'"'+(o.max!=null?' max="'+o.max+'"':'')+' value="'+val+'"'+d+' oninput="ng29CIn(\''+k+'\',this.value)">'+
    (o.unit?'<b>'+o.unit+'</b>':'')+'</span>'+
    '<span class="ng-pm'+dis+'"><button'+d+' onclick="ng29CAdj(\''+k+'\',1)">+</button><button'+d+' onclick="ng29CAdj(\''+k+'\',-1)">\u2212</button></span>';
}
function wDefs(){
  var n=N(), dAnn=n.dem.wage*52/1000, noc=!!n.con.noClause, L=[];
  L.push({k:'wage',ic:IC.money,dl:'Stipendio',dv:MY(dAnn)+' / anno',tag:'ALTA',ok:n.con.wage>=n.dem.wage,
    ol:'Stipendio',oc:wCtl('wage',r1(wAnn(n)),{eur:1,unit:'M / anno',step:0.1,id:'ng29w-wage'}),df:dfM(wAnn(n)-dAnn)});
  L.push({k:'sign',ic:IC.gift,dl:'Bonus alla firma',dv:MY(n.dem.sign),ok:n.con.sign>=n.dem.sign,
    ol:'Bonus alla firma',oc:wCtl('sign',r1(wSign(n)),{eur:1,unit:'M',step:0.1,id:'ng29w-sign'}),df:dfM(wSign(n)-n.dem.sign)});
  L.push({k:'years',ic:IC.clock,dl:'Durata '+n.dem.years+' anni',dv:'',tag:'IMPORTANTE',ok:n.con.years>=n.dem.years,
    ol:'Durata',oc:wCtl('years',n.con.years,{unit:'anni',step:1,min:1,max:6,id:'ng29w-years'}),df:dfY(n.con.years-n.dem.years)});
  L.push({k:'role',ic:IC.user,dl:'Ruolo '+n.dem.role,dv:'',tag:'ALTA',ok:!!n.con.role,ol:'Ruolo',
    oc:'<select class="ng-sel" onchange="ng29Role(this.value)"><option value=""'+(n.con.role?'':' selected')+'>[Scegli ruolo]</option>'+
      ROLES.map(function(r){ return '<option'+(n.con.role===r?' selected':'')+'>'+r+'</option>'; }).join('')+'</select>',df:null});
  L.push({k:'clause',ic:IC.doc,dl:'Clausola rescissoria',dv:MY(n.dem.clause),ok:!noc&&n.con.clause>=n.dem.clause,
    ol:'Clausola rescissoria',
    oc:'<label class="ng-chk2'+(noc?'':' on')+'" onclick="ng29NoClause()"><i>'+(noc?'':'\u2713')+'</i>Inserisci</label>'+
      (noc?'<span class="ng-pill mut">Nessuna clausola</span>':wCtl('clause',r1(n.con.clause),{eur:1,unit:'M',step:1,id:'ng29w-clause'})),
    df:noc?null:dfM(n.con.clause-n.dem.clause)});
  L.push({k:'bApp',ic:IC.boot,dl:'Bonus presenze',dv:(n.dem.bApp>0?K(n.dem.bApp):'Non richiesto'),ok:n.con.bApp>=n.dem.bApp,
    ol:'Bonus presenze',oc:wCtl('bApp',Math.round(n.con.bApp),{eur:1,unit:'K',step:5,id:'ng29w-bapp'}),df:dfK(n.con.bApp-n.dem.bApp)});
  L.push({k:'bGoal',ic:IC.ball,dl:'Bonus gol',dv:(n.dem.bGoal>0?K(n.dem.bGoal):'Non richiesto'),ok:n.con.bGoal>=n.dem.bGoal,
    ol:'Bonus gol',oc:wCtl('bGoal',Math.round(n.con.bGoal),{eur:1,unit:'K',step:5,id:'ng29w-bgoal'}),df:dfK(n.con.bGoal-n.dem.bGoal)});
  L.push({k:'bAss',ic:IC.target,dl:'Bonus assist',dv:(n.dem.bAss>0?K(n.dem.bAss):'Non richiesto'),ok:n.con.bAss>=n.dem.bAss,
    ol:'Bonus assist',oc:wCtl('bAss',Math.round(n.con.bAss),{eur:1,unit:'K',step:5,id:'ng29w-bass'}),df:dfK(n.con.bAss-n.dem.bAss)});
  return L;
}
function wRows(){
  var L=wDefs(), h='';
  h+='<div class="hh">Richieste dell\'agente</div><div class="hh c">Differenza</div><div class="hh">La nostra offerta</div>';
  for(var i=0;i<L.length;i++){ var it=L[i];
    h+='<div class="tc a"><span class="l">'+it.ic+E(it.dl)+'</span><span class="v">'+(it.dv||'')+
      (it.tag?'<span class="tg '+(it.tag==='ALTA'?'hi':'wr')+'">'+(it.tag==='ALTA'?'\u2605 Priorit\u00e0 alta':'\u26a0 Importante')+'</span>'
        :'<span class="okm '+(it.ok?'y':'n')+'" id="ng29w-ok-'+it.k+'">'+(it.ok?'\u2713':'\u2715')+'</span>')+'</span></div>';
    h+='<div class="tc b" id="ng29w-df-'+it.k+'">'+dfBox(it.df,wNeg(it.df))+'</div>';
    h+='<div class="tc c2"><span class="l">'+E(it.ol)+'</span><span class="v">'+it.oc+'</span></div>';
  }
  return h;
}
function wBud(){
  var n=N(), fr=wFree(n);
  return '<div class="k">Budget residuo</div><div class="n'+(fr<0?' neg':'')+'">'+MY(Math.max(0,fr))+'</div>'+
    '<div class="k2">Disponibile '+MY(wLeft(n))+' \u00b7 Costo primo anno '+MY(wCost(n))+'</div>';
}
function wState(){
  var n=N(), pc=cScore(n);
  return '<h3 style="margin-bottom:4px">Stato trattativa</h3>'+
    '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px">'+
    '<div class="ng-track" style="flex:1"><i style="width:'+pc+'%"></i></div>'+
    '<div style="font-size:15px;font-weight:800;letter-spacing:.6px;text-transform:uppercase;color:'+(pc>=70?'#3fd07a':pc>=45?'#ffc857':'#ff5c6e')+'">'+(pc>=70?'Favorevole':pc>=45?'Incerta':'Difficile')+'</div></div>'+
    '<div class="ng-msg" style="text-align:right;margin-top:3px">'+pc+'% probabilit\u00e0 di chiusura</div>';
}
function wPri(){
  var n=N();
  return '<div class="s3-pri"><div><h3>Priorit\u00e0 del giocatore</h3>'+
    barRow('Stipendio',n.prio.wage)+barRow('Ruolo',n.prio.role)+barRow('Durata',n.prio.years)+
    barRow('Progetto sportivo',n.prio.proj)+barRow('Bonus',n.prio.bonus)+barRow('Clausola',n.prio.clause)+'</div>'+
    '<div><h3>Aspettative</h3><div class="ng-msg" style="font-weight:700;color:#fff">Protagonista</div>'+
    '<div class="k2">Obiettivo economico</div><div class="v2">'+MY(n.dem.wage*52/1000*0.94)+' - '+MY(n.dem.wage*52/1000*1.06)+'</div>'+
    '<div class="k2">Durata ideale</div><div class="v2">'+(n.dem.years-1)+'-'+n.dem.years+' anni</div>'+
    '<div class="k2">Ruolo</div><div class="v2">'+E(n.dem.role)+'</div>'+
    '<div class="k2">Bonus desiderati</div><div class="v2">Firma + presenze</div></div></div>';
}
function wMood(){
  var n=N();
  return '<h3>Umore dell\'agente</h3>'+
    '<div style="font-size:21.3px;font-weight:800;letter-spacing:.6px;text-transform:uppercase;color:'+(n.mood>=3?'#3fd07a':n.mood>=2?'#ffc857':'#ff5c6e')+'">'+MOODS[cl(n.mood,0,4)]+'</div>'+
    '<div class="ng-msg" style="margin-top:4px">Il procuratore sta cercando migliori condizioni economiche possibili per il suo assistito.</div>'+
    '<div class="s3-mood">'+MOODS.map(function(m,i){ return '<span class="'+(i===n.mood?'on':'')+'">'+E(m)+'</span>'; }).join('')+'</div>';
}
function wPat(){
  var n=N(), p=Math.round(n.patience);
  return '<h3>Pazienza residua</h3>'+
    '<div style="font-size:24.3px;font-weight:800;color:var(--acc);line-height:1">'+p+'%</div>'+
    '<div class="ng-track" style="margin:5px 0"><i style="width:'+p+'%"></i></div>'+
    '<div class="ng-msg">Pazienza residua dell\'agente: la trattativa pu\u00f2 continuare.</div>'+
    '<div style="margin-top:6px;font-size:13px;font-weight:800;letter-spacing:.8px;text-transform:uppercase">'+Math.max(0,6-n.cRound)+' controproposte rimaste</div>';
}
function wReact(){
  var n=N(), pc=cScore(n);
  return '<h3>Reazione dell\'agente</h3>'+
    barRow('Fiducia nella trattativa',cl(pc+10,0,100))+barRow('Interesse del giocatore',cl(n.prio.proj+(n.mood-2)*8,0,100))+
    barRow('Disponibilit\u00e0 a trattare',cl(100-n.agent.tough*70,0,100))+barRow('Probabilit\u00e0 di accettazione',pc)+
    barRow('Tensione della trattativa',cl(100-n.patience,0,100),null,'#ffc857');
}
function wDlg(){
  var n=N();
  return '<h3>Dialogo con l\'agente</h3>'+
    '<div class="ng-msg">'+E(n.wmsg||(n.agent.name+' attende una nostra parola sulle condizioni economiche.'))+'</div>'+
    '<div class="s3-dlg">'+
      '<button onclick="ng29Talk(0)">Possiamo migliorare lo stipendio.</button>'+
      '<button onclick="ng29Talk(1)">Possiamo aumentare il bonus alla firma.</button>'+
      '<button onclick="ng29Talk(2)">Queste sono le nostre condizioni finali.</button>'+
    '</div>';
}
function wTl(){
  var n=N();
  return '<h3>Aggiornamenti</h3><div class="s3-tl">'+
    (n.tl.length?n.tl.map(function(e,i){ return '<div class="e'+(i===0?' on':'')+'"><div class="d">'+E(e.d)+'</div>'+E(e.t)+'</div>'; }).join('')
      :'<div class="e on"><div class="d">Ora</div>La trattativa \u00e8 appena iniziata.</div>')+'</div>';
}
function patchWage(full){
  var n=N(); if(!n) return;
  var tb=document.getElementById('ng29w-tbl');
  if(!tb){ screenWage(); return; }
  if(full){ tb.innerHTML=wRows(); }
  else{
    var L=wDefs();
    for(var i=0;i<L.length;i++){ var it=L[i];
      var dc=document.getElementById('ng29w-df-'+it.k);
      if(dc) dc.innerHTML=dfBox(it.df,wNeg(it.df));
      var ok=document.getElementById('ng29w-ok-'+it.k);
      if(ok){ ok.className='okm '+(it.ok?'y':'n'); ok.textContent=it.ok?'\u2713':'\u2715'; }
    }
    var vals=[['ng29w-wage',r1(wAnn(n))],['ng29w-sign',r1(wSign(n))],['ng29w-years',n.con.years],
      ['ng29w-clause',r1(n.con.clause)],['ng29w-bapp',Math.round(n.con.bApp)],['ng29w-bgoal',Math.round(n.con.bGoal)],['ng29w-bass',Math.round(n.con.bAss)]];
    for(var j=0;j<vals.length;j++){ var el=document.getElementById(vals[j][0]); if(el&&document.activeElement!==el) el.value=vals[j][1]; }
  }
  var parts=[['ng29w-bud',wBud],['ng29w-st',wState],['ng29w-pri',wPri],['ng29w-mood',wMood],['ng29w-pat',wPat],['ng29w-react',wReact],['ng29w-dlg',wDlg],['ng29w-tl',wTl]];
  for(var q=0;q<parts.length;q++){ var e2=document.getElementById(parts[q][0]); if(e2) e2.innerHTML=parts[q][1](); }
  var rd=document.getElementById('ng29w-round'); if(rd) rd.textContent='Round '+n.cRound+'/5';
}
function screenWage(){
  var n=N(); if(!n) return;
  if(n.con.noClause==null) n.con.noClause=false;
  var mc=myCrest();
  var h='<div class="s3">';
  h+='<div class="s3-hd"><div class="me">'+(mc?'<img src="'+E(mc)+'" onerror="window.ng29Logo(this)" onload="window.ng29LogoOk(this)">':'')+'<span>'+E(myClub())+'</span></div>'+
    '<div><div class="ng-t1">Negoziazione contratto</div><div class="ng-t2">Trattativa tra club, giocatore e agente</div></div>'+
    '<div class="s3-bw"><div class="s3-bud" id="ng29w-bud">'+wBud()+'</div></div></div>';
  h+='<div class="s3-bd">';
  h+='<div class="s3-l">'+
    pcard({roleUnder:true,
      side:'<div class="sk">Overall</div><div class="big" style="font-size:25.3px">'+n.p.rate+'</div>'+
           '<div>'+n.p.age+' anni</div>'+
           '<div class="sk">Nazione</div><div>'+E(n.p.nation||'-')+'</div>'+
           '<div class="sk">Valore</div><div class="big">'+M(n.p.value)+'</div>'+
           '<div class="sk">Forma</div><div>'+E(n.form)+'</div>'+
           '<div class="sk">Condizione</div><div>'+n.cond2+'%</div>',
      foot:ft('Piede','Piede '+n.p.foot)+ft('Condizione',n.cond2+'%')+ft('Contratto attuale',n.expiry),
      badge:'<span id="ng29w-round">Round '+n.cRound+'/5</span>'})+
    '<div class="ng-cd"><div class="ng-2c">'+
      '<div><div class="k">Ruolo desiderato</div><div class="n" style="font-size:17px">'+E(n.dem.role)+'</div></div>'+
      '<div><div class="k">Importanza nel progetto</div><div class="n" style="font-size:17px">'+(n.prio.proj>=70?'Molto alta':'Alta')+'</div></div>'+
    '</div></div>'+
    '<div class="ng-cd" id="ng29w-st">'+wState()+'</div>'+
    '<div class="ng-cd" id="ng29w-pri">'+wPri()+'</div>'+
  '</div>';
  h+='<div class="s3-r">';
  h+='<div class="s3-top">'+
    '<div class="ng-cd"><h3>Agente del giocatore</h3><div style="display:flex;gap:12px;min-height:0">'+agentAvatar(n.agent,0)+
      '<div style="min-width:0"><div style="font-size:24.3px;font-weight:800;letter-spacing:.3px;text-transform:uppercase;line-height:1">'+E(n.agent.name)+'</div>'+
      '<div style="font-size:12.6px;color:rgba(255,255,255,.7)">Procuratore</div>'+
      '<div class="ng-r" style="padding:1px 0"><span class="l">Esperienza</span><span class="v">'+stars(n.agent.exp)+'</span></div>'+
      '<div class="ng-r" style="padding:1px 0"><span class="l">Reputazione</span><span class="v">'+n.agent.rep+' / 100</span></div>'+
      '<div class="ng-r" style="padding:1px 0"><span class="l">Disponibilit\u00e0</span><span class="v">'+E(n.agent.av)+'</span></div>'+
      '<div class="ng-msg" style="margin-top:4px">Il procuratore sta cercando di ottenere le migliori condizioni economiche possibili per il suo assistito.</div>'+
    '</div></div></div>'+
    '<div class="ng-cd" id="ng29w-mood">'+wMood()+'</div>'+
    '<div class="ng-cd" id="ng29w-pat">'+wPat()+'</div></div>';
  h+='<div class="ng-cd s3-tbl" id="ng29w-tbl">'+wRows()+'</div>';
  h+='<div class="s3-bot">'+
    '<div class="ng-cd" id="ng29w-react">'+wReact()+'</div>'+
    '<div class="ng-cd" id="ng29w-dlg">'+wDlg()+'</div>'+
    '<div class="ng-cd" id="ng29w-tl">'+wTl()+'</div></div>';
  h+='</div></div>';
  h+='<div class="s3-act"><div class="lb">Azioni</div>'+
    '<button class="ng-b p big" onclick="ng29CSend()">Invia offerta</button>'+
    '<div class="grid">'+
      '<button class="ng-b" onclick="ng29Counter()">Fai una controproposta</button>'+
      '<button class="ng-b" onclick="ng29Renclause()">Rinegozia clausola</button>'+
      '<button class="ng-b" onclick="ng29Withdraw()">Ritira offerta</button>'+
    '</div></div>';
  h+='</div>';
  shell(h);
}
function tlPush(t){ var n=N(); if(!n) return; var d=new Date();
  n.tl.unshift({d:('0'+d.getDate()).slice(-2)+'/'+('0'+(d.getMonth()+1)).slice(-2)+'/'+d.getFullYear(),t:t}); if(n.tl.length>12) n.tl.pop(); }
CSS.push(".s3{display:grid;grid-template-rows:auto 1fr auto;gap:10.1px;height:100%;min-height:0}");
CSS.push(".s3-hd{display:grid;grid-template-columns:1fr auto 1fr;align-items:center}");
CSS.push(".s3-hd .me{display:flex;align-items:center;gap:9px;font-size:15px;font-weight:800;letter-spacing:.8px;text-transform:uppercase}");
CSS.push(".s3-hd .me img{height:30.4px;width:30.4px;object-fit:contain}");
CSS.push(".s3-bw{display:flex;justify-content:flex-end}");
CSS.push(".s3-bud{text-align:right;padding:6px 14px;border-radius:10px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.1)}");
CSS.push(".s3-bud .k{font-size:11.1px;font-weight:700;letter-spacing:1.1px;text-transform:uppercase;color:var(--acc)}");
CSS.push(".s3-bud .n{font-size:21px;font-weight:800;line-height:1.05}");
CSS.push(".s3-bud .n.neg{color:#ff5c6e}");
CSS.push(".s3-bud .k2{font-size:10.6px;color:rgba(255,255,255,.6);letter-spacing:.4px}");
CSS.push(".s3-bd{display:grid;grid-template-columns:320px minmax(0,1fr);gap:16px;min-height:0}");
CSS.push(".s3-l{display:grid;grid-template-rows:1fr auto auto auto;gap:9.1px;min-height:0}");
CSS.push(".s3-l .sk{font-size:10.1px;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,.65);margin-top:4px}");
CSS.push(".s3-r{display:grid;grid-template-rows:auto auto minmax(0,1fr);gap:9.1px;min-height:0;overflow:hidden}");
CSS.push(".s3-top{display:grid;grid-template-columns:1.5fr 1fr 1fr;gap:13px;min-height:0}");
CSS.push(".s3-bot{display:grid;grid-template-columns:1fr 1.15fr 1fr;gap:13px;min-height:0;overflow:hidden}");
CSS.push(".s3-bot>.ng-cd{display:flex;flex-direction:column;min-height:0;overflow:hidden}");
CSS.push(".s3-bot>.ng-cd>*{min-width:0}");
CSS.push(".s3-bot>.ng-cd{max-height:100%}");
CSS.push(".s3-bot>.ng-cd{overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain}");
CSS.push(".s3-bot>.ng-cd::-webkit-scrollbar{width:6px}");
CSS.push(".s3-bot>.ng-cd::-webkit-scrollbar-track{background:transparent}");
CSS.push(".s3-bot>.ng-cd::-webkit-scrollbar-thumb{background:rgba(255,255,255,.18);border-radius:6px}");
CSS.push(".s3-dlg{flex:1 1 auto;min-height:0;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;padding-right:6px}");
CSS.push(".s3-dlg::-webkit-scrollbar,.s3-mood::-webkit-scrollbar{width:6px}");
CSS.push(".s3-dlg::-webkit-scrollbar-thumb,.s3-mood::-webkit-scrollbar-thumb{background:rgba(255,255,255,.18);border-radius:6px}");
CSS.push(".s3-bot>.ng-cd .ng-t2{flex:0 0 auto}");
CSS.push(".s3-tbl{display:grid;grid-template-columns:1.22fr .58fr 1.05fr;column-gap:16px;row-gap:0;align-content:start;min-height:0;overflow:hidden}");
CSS.push(".s3-tbl .hh{margin:0 0 6px;font-size:16px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;color:var(--acc);align-self:end}");
CSS.push(".s3-tbl .hh.c{text-align:center;color:rgba(255,255,255,.85)}");
CSS.push(".s3-tbl .tc{display:flex;align-items:center;gap:9px;min-height:44px;padding:2px 0}");
CSS.push(".s3-tbl .tc .l{display:flex;align-items:center;gap:8px;flex:1 1 auto;min-width:0;font-size:16.4px;color:rgba(255,255,255,.9);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}");
CSS.push(".s3-tbl .tc .l .ic{width:19px;height:19px;flex:0 0 auto;color:var(--acc)}");
CSS.push(".s3-tbl .tc .v{display:flex;align-items:center;gap:9px;flex:0 0 auto;font-size:17.4px;font-weight:700}");
CSS.push(".s3-tbl .tc.b{display:block;padding:4px 0}");
CSS.push(".s3-tbl .df{height:36px;display:flex;align-items:center;justify-content:center;border-radius:7px;font-size:15px;font-weight:700}");
CSS.push(".s3-tbl .df.n{background:rgba(255,60,80,.14);border:1px solid rgba(255,92,110,.45);color:#ff8a97}");
CSS.push(".s3-tbl .df.y{background:rgba(37,190,105,.13);border:1px solid rgba(63,208,122,.4);color:#5fdc93}");
CSS.push(".s3-tbl .df.e{background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.055)}");
CSS.push(".s3-tbl .ng-cur{min-width:0}");
CSS.push(".s3-tbl .ng-cur .ng-in{width:86px;font-size:16px}");
CSS.push(".s3-tbl .ng-cur{font-size:15.4px}");
CSS.push(".s3-tbl .ng-pm b,.s3-tbl .ng-pm button{font-size:15px}");
CSS.push(".s3-tbl .ng-pill{font-size:14px}");
CSS.push(".s3-tbl .okm{font-size:15.5px}");
CSS.push(".s3-tbl .tg{font-size:12.6px}");
CSS.push(".ng-pill.mut{color:rgba(255,255,255,.6);font-weight:600}");
CSS.push(".ng-chk2{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:700;letter-spacing:.7px;text-transform:uppercase;color:rgba(255,255,255,.62);cursor:pointer;user-select:none}");
CSS.push(".ng-chk2 i{width:15px;height:15px;border-radius:4px;border:1px solid rgba(255,255,255,.28);display:flex;align-items:center;justify-content:center;font-size:10px;font-style:normal}");
CSS.push(".ng-chk2.on{color:#fff}");
CSS.push(".ng-chk2.on i{background:var(--acc);border-color:var(--acc);color:var(--accTx)}");
CSS.push(".tg{font-size:10.1px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;padding:2px 6px;border-radius:4px;white-space:nowrap}");
CSS.push(".tg.hi{color:#ff6d7d;background:rgba(255,60,80,.12)}");
CSS.push(".tg.wr{color:#ffc857;background:rgba(255,200,87,.12)}");
CSS.push(".okm{font-size:12px}");CSS.push(".okm.y{color:#3fd07a}");CSS.push(".okm.n{color:#ff5c6e}");
CSS.push(".ng-sel{background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.14);color:#fff;font:inherit;font-weight:700;font-size:15px;border-radius:6px;padding:5px 8px}");
CSS.push(".s3-mood{display:grid;grid-template-columns:repeat(5,1fr);gap:4px;margin-top:7px}");
CSS.push(".s3-mood span{text-align:center;font-size:9.6px;font-weight:700;letter-spacing:.3px;text-transform:uppercase;padding:4px 2px;border-radius:5px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.07);color:rgba(255,255,255,.6)}");
CSS.push(".s3-mood span.on{background:var(--acc);border-color:var(--acc);color:var(--accTx)}");
CSS.push(".s3-pri{display:grid;grid-template-columns:1.15fr .95fr;gap:16px}");
CSS.push(".s3-pri h3{margin:0 0 5px;font-size:13px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;color:var(--acc)}");
CSS.push(".s3-pri .k2{font-size:11.1px;color:rgba(255,255,255,.6);text-transform:uppercase;letter-spacing:.6px;margin-top:5px}");
CSS.push(".s3-pri .v2{font-size:13px;font-weight:700}");
CSS.push(".s3-dlg{display:flex;flex-direction:column;gap:6px;margin-top:7px}");
CSS.push(".s3-dlg button{text-align:center;padding:8.6px;border-radius:7px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);color:#fff;font:inherit;font-size:12.5px;cursor:pointer;transition:.16s}");
CSS.push(".s3-dlg button:hover{background:rgba(255,255,255,.11);transform:translateY(-1px);border-color:var(--acc)}");
CSS.push(".s3-tl{flex:1 1 auto;overflow-y:auto;overflow-x:hidden;display:flex;flex-direction:column;gap:7.1px;padding-left:12px;padding-right:8px;border-left:1px solid rgba(255,255,255,.12);min-height:0;overscroll-behavior:contain}");
CSS.push(".s3-tl::-webkit-scrollbar{width:6px}");
CSS.push(".s3-tl::-webkit-scrollbar-track{background:transparent}");
CSS.push(".s3-tl::-webkit-scrollbar-thumb{background:rgba(255,255,255,.18);border-radius:6px}");
CSS.push(".s3-tl .e{flex:0 0 auto}");
CSS.push(".s3-tl .e{position:relative;font-size:13.4px;color:rgba(255,255,255,.85)}");
CSS.push(".s3-tl .e:before{content:'';position:absolute;left:-16px;top:5px;width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,.25)}");
CSS.push(".s3-tl .e.on:before{background:var(--acc);box-shadow:0 0 10px var(--acc)}");
CSS.push(".s3-tl .e .d{font-size:11.4px;color:rgba(255,255,255,.5)}");
CSS.push(".s3-act{display:grid;grid-template-columns:auto minmax(180px,1.1fr) 3fr;align-items:center;gap:16px}");
CSS.push(".s3-act .lb{font-size:13px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:var(--acc)}");
CSS.push(".s3-act .big{height:100%;font-size:16.2px}");
CSS.push(".s3-act .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}");
CSS.push(".ng-ava.img{padding:0;overflow:hidden;border-radius:12px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);flex:0 0 auto}");
CSS.push(".ng-ava.img img{width:100%;height:100%;object-fit:cover;display:block;border-radius:11px}");
CSS.push(".ng-pc .bdg{position:absolute;top:10.1px;right:16px;font-size:11.1px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:rgba(255,255,255,.9);background:rgba(0,0,0,.4);border:1px solid rgba(255,255,255,.16);padding:3px 8px;border-radius:6px;z-index:5}");

/* ===================== SCHERMATA 4: TRASFERIMENTO UFFICIALE ===================== */
function flagUrl(nat){ if(!nat) return '';
  try{ var f=G('natFlag'); if(f){ var u=f(nat); if(u) return String(u); } }catch(e){}
  try{ var g=G('natFlag'); var nn=G('normalizeNation'); if(g&&nn){ var u2=g(nn(nat)); if(u2) return String(u2); } }catch(e2){}
  return ''; }
function flagHtml(nat,h){ var u=flagUrl(nat); if(!u) return '';
  return '<img class="flg" style="height:'+(h||13)+'px" src="'+E(u)+'" referrerpolicy="no-referrer" onerror="this.style.display=\'none\'">'; }
function screenOfficial(){
  var n=N(); if(!n) return;
  var a=n.agreed, c=n.con, np=nameParts(n.p.name), mc=myCrest(), bg=n.bgBefore||budget();
  var wageY=r1(c.wage*52/1000), tot=r1(a.fee+a.bonus), sc=n.finalScore;
  var h='<div class="s4">';
  h+='<div class="s4-top">';
  /* card giocatore */
  h+='<div class="ng-pc s4-pc"><div class="stripes"></div><div class="body">'+
    '<div class="cn">Giocatore</div><div class="no">'+n.p.shirt+'</div>'+
    (mc?'<img class="cb" src="'+E(mc)+'" onerror="window.ng29Logo(this)" onload="window.ng29LogoOk(this)">':'')+
    (n.p.img?'<img class="fc" src="'+E(n.p.img)+'" onerror="this.style.visibility=\'hidden\'">':'')+
    '<div class="nm">'+(np.f?'<div class="f">'+E(np.f)+'</div>':'')+'<span class="s">'+E(np.s)+'</span><div class="rl">'+E(n.p.role)+'</div></div>'+
  '</div><div class="lst">'+
    li('Et\u00e0',n.p.age+'')+li('Nazionalit\u00e0',flagHtml(n.p.nation,13)+'<span>'+E(n.p.nation||'-')+'</span>')+li('Piede preferito',n.p.foot)+
    li('Valore di mercato',M(n.p.value))+li('Contratto precedente',n.expiry)+
  '</div></div>';
  /* hero */
  h+='<div class="ng-cd s4-hero">'+
    '<div class="hh"><span class="ck">'+IC.check+'</span><div><div class="t1">Trasferimento ufficiale</div><div class="t2">Accordo completato</div>'+
      '<div class="t3">Il giocatore \u00e8 ufficialmente un nuovo giocatore del '+E(myClub())+'.</div></div></div>'+
    '<div class="stad hasbg">'+
      '<div class="lights"></div><div class="stands"></div><div class="pitch"></div>'+
      (window.NG29BG?'<img class="bgi" src="'+E(window.NG29BG)+'" onerror="this.style.display=\'none\'">':'')+
      '<div class="bgsh"></div>'+
      (mc?'<img class="wm" src="'+E(mc)+'" onerror="window.ng29Logo(this)" onload="window.ng29LogoOk(this)">':'')+
      (n.p.img?'<img class="pl" src="'+E(n.p.img)+'" referrerpolicy="no-referrer" onerror="this.style.display=\'none\'">':'')+
      '<div class="hn"><div class="big">'+E(n.p.name)+'</div><div class="sub">Nuovo giocatore del '+E(myClub())+'</div></div>'+
    '</div>'+
    '<div class="strip">'+
      sp(E(n.p.role),'Ruolo')+sp(n.p.rate+'','Ovr')+sp(n.p.age+'','Et\u00e0')+sp(flagHtml(n.p.nation,19)+E(n.p.nation||'-'),'Nazionalit\u00e0')+sp(n.p.shirt+'','Numero di maglia')+
    '</div></div>';
  /* colonna destra */
  h+='<div class="s4-r">'+
    '<div class="ng-cd"><h3><span class="hi">'+IC.doc+'</span>Accordo con il club</h3>'+
      row2('Prezzo cartellino',M(a.fee))+row2('Modalit\u00e0 di pagamento',(a.instN===1?'Unica soluzione':a.instN+' rate'))+
      a.inst.map(function(v,i){ return '<div class="ng-r sub"><span class="l">'+['Prima rata','Seconda rata','Terza rata'][i]+'</span><span class="v">'+M(v)+'</span></div>'; }).join('')+
      row2('Bonus',M(a.bonus))+row2('Percentuale rivendita',a.sell+'%')+
      '<div class="ng-sep"></div><div class="ng-r"><span class="l">Stato</span><span class="v ng-ok">Accordo completato</span></div></div>'+
    '<div class="ng-cd"><h3><span class="hi">'+IC.list+'</span>Contratto personale</h3>'+
      row2('Durata contratto',c.years+' anni')+row2('Scadenza contratto',n.newExpiry)+
      row2('Stipendio',MY(wageY)+' / anno')+row2('Bonus alla firma',M(c.sign))+
      row2('Bonus presenze',K(c.bApp))+row2('Bonus gol',K(c.bGoal))+row2('Ruolo',(c.role||'Titolare').toUpperCase())+
      row2('Clausola rescissoria',M(c.clause))+
      '<div class="ng-sep"></div><div class="ng-r"><span class="l">Stato</span><span class="v ng-ok">Contratto firmato</span></div></div>'+
  '</div></div>';
  /* stepper */
  h+='<div class="ng-cd s4-steps"><div class="ttl">Trattativa completata</div><div class="stp">'+
    st4('01','Accordo','con il club')+'<span class="ar">'+IC.arrow+'</span>'+
    st4('02','Contratto','del giocatore')+'<span class="ar">'+IC.arrow+'</span>'+
    st4('03','Trasferimento','ufficiale')+
  '</div></div>';
  /* riga inferiore */
  h+='<div class="s4-bot">'+
    '<div class="ng-cd"><h3>Riepilogo operazione</h3>'+
      row2('Valore cartellino',M(a.fee))+row2('Bonus',M(a.bonus))+row2('Costo potenziale massimo',M(tot))+
      row2('Stipendio annuo',MY(wageY))+row2('Durata contratto',c.years+' anni')+
      '<div class="s4-tot"><div class="k">Valore complessivo operazione</div><div class="n">'+M(tot)+' + stipendio</div></div></div>'+
    '<div class="ng-cd"><h3>Impatto sul budget</h3>'+
      row2('Budget prima dell\'operazione',M(bg))+
      '<div class="ng-r"><span class="l">Costo cartellino</span><span class="v ng-no">- '+M(a.inst[0])+'</span></div>'+
      '<div class="ng-sep"></div><div class="k2">Budget residuo</div><div class="n2 ng-ok">'+M(r1(budget()))+'</div>'+
      '<div class="ng-sep"></div>'+row2('Stipendio annuo',MY(wageY))+row2('Bonus',M(c.sign))+'</div>'+
    '<div class="ng-cd s4-val"><h3>Valutazione della dirigenza</h3>'+
      '<div class="n">'+sc+' / 100</div><div class="t">'+(sc>=85?'Ottimo affare':sc>=70?'Buon affare':'Affare accettabile')+'</div>'+
      '<div class="bigstars">'+stars(Math.round(sc/20))+'</div>'+
      '<div class="ng-r"><span class="l">Valore economico</span><span class="v">'+stars(cl(Math.round(sc/20),1,5))+'</span></div>'+
      '<div class="ng-r"><span class="l">Condizioni contratto</span><span class="v">'+stars(cl(Math.round(n.score/20),1,5))+'</span></div>'+
      '<div class="ng-r"><span class="l">Impatto sportivo</span><span class="v">'+stars(cl(Math.round(n.p.rate/18),1,5))+'</span></div></div>'+
    '<div class="ng-cd"><h3>Reazione del giocatore</h3>'+
      '<div class="ng-msg">Sono molto felice di iniziare questa nuova esperienza.</div>'+
      barRow('Entusiasmo',n.react.ent)+barRow('Fiducia nel club',n.react.tru)+barRow('Soddisfazione contratto',n.react.sat)+
      '<div class="ng-msg" style="margin-top:5px">Il giocatore \u00e8 pronto a unirsi alla squadra.</div></div>'+
    '<div class="s4-st">'+
      '<div class="ng-cd"><h3>Reazione dell\'agente</h3><div class="ng-msg">Il procuratore \u00e8 soddisfatto dell\'accordo raggiunto.</div>'+
        barRow('Soddisfazione',n.react.ag)+
        '<div class="ng-r"><span class="l">Rapporto con il club</span><span class="v ng-ok">'+(n.react.ag>=80?'Molto positivo':'Positivo')+'</span></div></div>'+
      '<div class="ng-cd"><h3>Club precedente</h3><div class="ng-msg">Il club ha accettato l\'offerta.</div>'+
        '<div class="ng-r"><span class="l">Rapporto tra i club</span><span class="v ng-ok">Positivo</span></div>'+
        barRow('Fiducia',n.react.club)+'</div>'+
    '</div></div>';
  h+='<div class="ng-acts">'+
    '<button class="ng-b p" onclick="ng29Finish()">Continua '+IC.arrow+'</button>'+
    '<button class="ng-b" onclick="ng29Go(\'player\')">'+IC.user+'Vedi giocatore</button>'+
    '<button class="ng-b" onclick="ng29Go(\'roster\')">'+IC.users+'Vedi rosa</button>'+
    '<button class="ng-b" onclick="ng29Go(\'contract\')">'+IC.doc+'Vedi contratto</button>'+
    '<button class="ng-b" onclick="ng29Go(\'market\')">'+IC.swap+'Torna al mercato</button>'+
  '</div>';
  h+='</div>';
  shell(h,true);
}
function li(k,v){ return '<div class="li"><span class="k">'+E(k)+'</span><span class="v">'+v+'</span></div>'; }
function sp(v,k){ return '<div><div class="v">'+v+'</div><div class="k">'+E(k)+'</div></div>'; }
function st4(n1,t,s){ return '<div class="s"><div class="c">'+n1+'<span class="ok">\u2713</span></div><div class="t">'+E(t)+'<br>'+E(s)+'</div><div class="d">Completato</div></div>'; }
CSS.push(".s4{display:grid;grid-template-rows:1.35fr auto 1fr auto;gap:9.6px;height:100%;min-height:0}");
CSS.push(".flg{border-radius:2.5px;object-fit:cover;vertical-align:-2px;margin-right:7px;box-shadow:0 1px 5px rgba(0,0,0,.6);border:1px solid rgba(255,255,255,.18)}");
CSS.push(".s4-hero .stad.hasbg{background:#05070a}");
CSS.push(".s4-hero .stad .bgi{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 38%;filter:saturate(.72) brightness(.62) contrast(1.06)}");
CSS.push(".s4-hero .stad .bgsh{position:absolute;inset:0;background:linear-gradient(180deg,rgba(4,6,10,.62) 0%,rgba(4,6,10,.18) 34%,rgba(4,6,10,.72) 78%,rgba(4,6,10,.94) 100%)}");
CSS.push(".s4-hero .hh{justify-content:center;gap:18px;padding:12.6px 18px 10.1px;text-align:center}");
CSS.push(".s4-hero .ck{width:46px;height:46px;border-radius:50%;border:2.6px solid var(--acc);display:flex;align-items:center;justify-content:center}");
CSS.push(".s4-hero .ck .ic{width:60%;height:60%;stroke-width:2.6}");
CSS.push(".s4-hero .t1{font-size:35px;letter-spacing:.8px}");
CSS.push(".s4-hero .t2{font-size:16px;letter-spacing:2.4px;margin-top:1px}");
CSS.push(".s4-hero .t3{font-size:13.2px;margin-top:2px}");
CSS.push(".s4-hero .stad .wm{left:9%;top:9%;height:56%;opacity:.42;z-index:1}");
CSS.push(".s4-hero .stad .pl{z-index:2;height:99%}");
CSS.push(".s4-hero .stad .hn{bottom:13px;z-index:3}");
CSS.push(".s4-hero .stad .hn .big{font-size:46px;letter-spacing:.6px}");
CSS.push(".s4-hero .stad .hn .sub{font-size:15.6px;letter-spacing:3px}");
CSS.push(".s4-hero .strip{padding:11.1px 18px 12.1px}");
CSS.push(".s4-hero .strip .v{font-size:20.4px;display:flex;align-items:center;justify-content:center;gap:0;line-height:1.05}");
CSS.push(".s4-hero .strip .v .flg{margin-right:8px;border-radius:3px}");
CSS.push(".s4-hero .strip .k{font-size:10.2px;letter-spacing:1.2px;margin-top:3px}");
CSS.push(".s4-top{grid-template-columns:268px minmax(0,1.62fr) minmax(0,1.02fr)}");
CSS.push(".s4-pc .body{padding:11.1px;overflow:hidden}");
CSS.push(".s4-pc .body:after{content:'';position:absolute;left:0;right:0;bottom:0;height:56%;background:linear-gradient(180deg,rgba(0,0,0,0) 0%,rgba(0,0,0,.5) 46%,rgba(0,0,0,.86) 100%);z-index:1;pointer-events:none}");
CSS.push(".s4-pc .cn{font-size:10.8px;letter-spacing:1.9px;top:11.1px;left:15px;z-index:4}");
CSS.push(".s4-pc .no{font-size:86px;top:25px;left:13px;-webkit-text-stroke:2.4px rgba(255,255,255,.9);z-index:1}");
CSS.push(".s4-pc .cb{height:35px;top:12.1px;right:15px;z-index:4}");
CSS.push(".s4-pc .fc{height:90%;max-width:126%;left:53%;z-index:1}");
CSS.push(".s4-pc .nm{left:15px;bottom:11.1px;max-width:90%;z-index:3}");
CSS.push(".s4-pc .nm .f{font-size:12.2px;font-weight:300;letter-spacing:3.6px}");
CSS.push(".s4-pc .nm .s{font-size:44px;line-height:.94}");
CSS.push(".s4-pc .nm .rl{font-size:13px;margin-top:1px;color:rgba(255,255,255,.9)}");
CSS.push(".s4-pc .lst{padding:9.1px 15px}");
CSS.push(".s4-pc .li{font-size:12.6px;align-items:center;padding:4.2px 0}");
CSS.push(".s4-pc .li+.li{border-top:1px solid rgba(255,255,255,.05)}");
CSS.push(".s4-pc .li .k{font-size:11.2px;letter-spacing:.7px}");
CSS.push(".s4-pc .li .v{display:flex;align-items:center;justify-content:flex-end;text-align:right;gap:0;font-size:13px}");
CSS.push(".s4-top{display:grid;grid-template-columns:240px minmax(0,1.65fr) minmax(0,1fr);gap:16px;min-height:0}");
CSS.push(".s4-pc{animation:ngL .45s both}");
CSS.push(".s4-pc .lst{position:relative;padding:8.1px 14px;background:rgba(0,0,0,.45);border-top:1px solid rgba(255,255,255,.08)}");
CSS.push(".s4-pc .li{display:flex;justify-content:space-between;gap:8px;padding:3.5px 0;font-size:12.1px}");
CSS.push(".s4-pc .li .k{color:var(--acc);font-weight:700;letter-spacing:.6px;text-transform:uppercase}");
CSS.push(".s4-pc .li .v{font-weight:700}");
CSS.push(".s4-hero{padding:0;overflow:hidden;animation:ngPop .5s both}");
CSS.push(".s4-hero .hh{display:flex;gap:16px;align-items:center;padding:11.1px 18px}");
CSS.push(".s4-hero .ck{width:40.5px;height:40.5px;color:var(--acc);flex:0 0 auto}");
CSS.push(".s4-hero .ck .ic{width:100%;height:100%;stroke-width:1.6}");
CSS.push(".s4-hero .t1{font-size:30.4px;font-weight:800;letter-spacing:.5px;text-transform:uppercase;color:var(--acc);line-height:1}");
CSS.push(".s4-hero .t2{font-size:15.2px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase}");
CSS.push(".s4-hero .t3{font-size:12.6px;color:rgba(255,255,255,.75)}");
CSS.push(".s4-hero .stad{position:relative;flex:1;min-height:0;overflow:hidden;background:linear-gradient(180deg,#05070c 0%,#0a1018 45%,#050708 100%)}");
CSS.push(".s4-hero .stad .stands{position:absolute;inset:0 0 34% 0;background:repeating-linear-gradient(92deg,rgba(255,255,255,.045) 0 2px,rgba(255,255,255,0) 2px 6px),radial-gradient(120% 90% at 50% 20%,rgba(120,150,200,.14),rgba(0,0,0,0) 65%)}");
CSS.push(".s4-hero .stad .lights{position:absolute;top:6%;left:0;right:0;height:24%;background:radial-gradient(closest-side,rgba(255,255,235,.85),rgba(255,255,235,0) 70%) 12% 20%/13% 46% no-repeat,radial-gradient(closest-side,rgba(255,255,235,.85),rgba(255,255,235,0) 70%) 34% 10%/13% 46% no-repeat,radial-gradient(closest-side,rgba(255,255,235,.85),rgba(255,255,235,0) 70%) 66% 10%/13% 46% no-repeat,radial-gradient(closest-side,rgba(255,255,235,.85),rgba(255,255,235,0) 70%) 88% 20%/13% 46% no-repeat;animation:ngGlow 4.5s ease-in-out infinite}");
CSS.push(".s4-hero .stad .pitch{position:absolute;left:-10%;right:-10%;bottom:0;height:36%;background:linear-gradient(180deg,rgba(30,60,35,.55),rgba(8,14,10,.9)),repeating-linear-gradient(90deg,rgba(255,255,255,.05) 0 6%,rgba(0,0,0,0) 6% 12%);transform:perspective(340px) rotateX(52deg);transform-origin:bottom}");
CSS.push(".s4-hero .stad .wm{position:absolute;left:8%;top:6%;height:62%;opacity:.5;filter:grayscale(1) brightness(2.4) drop-shadow(0 8px 22px rgba(0,0,0,.55))}");
CSS.push(".s4-hero .stad .pl{position:absolute;left:50%;bottom:0;transform:translateX(-50%);height:96%;object-fit:contain;object-position:bottom;filter:drop-shadow(0 20px 40px rgba(0,0,0,.7))}");
CSS.push(".s4-hero .stad .hn{position:absolute;left:0;right:0;bottom:10.1px;text-align:center;z-index:2}");
CSS.push(".s4-hero .stad .hn .big{font-size:42.5px;font-weight:800;letter-spacing:.4px;text-transform:uppercase;line-height:1;text-shadow:0 6px 24px rgba(0,0,0,.85)}");
CSS.push(".s4-hero .stad .hn .sub{font-size:15.2px;font-weight:600;letter-spacing:2.6px;text-transform:uppercase;color:rgba(255,255,255,.88);text-shadow:0 3px 12px rgba(0,0,0,.8)}");
CSS.push(".s4-hero .strip{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;padding:10.1px 18px;border-top:1px solid rgba(255,255,255,.08)}");
CSS.push(".s4-hero .strip>div{text-align:center;position:relative}");
CSS.push(".s4-hero .strip>div+div:before{content:'';position:absolute;left:0;top:12%;bottom:12%;width:1px;background:rgba(255,255,255,.1)}");
CSS.push(".s4-hero .strip .v{font-size:19.2px;font-weight:800;text-transform:uppercase;line-height:1}");
CSS.push(".s4-hero .strip .k{font-size:9.6px;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,.55);margin-top:2px}");
CSS.push(".s4-r{display:grid;grid-template-rows:1fr 1.35fr;gap:9.1px;min-height:0}");
CSS.push(".ng-cd>h3 .hi{display:inline-block;width:16px;height:16px;vertical-align:-2px;margin-right:6px;color:var(--acc)}");
CSS.push(".s4-steps{padding:10.1px 18px}");
CSS.push(".s4-steps .ttl{text-align:center;font-size:14.7px;font-weight:800;letter-spacing:1.4px;text-transform:uppercase;color:var(--acc)}");
CSS.push(".s4-steps .stp{display:flex;align-items:center;justify-content:center;gap:25.6px;margin-top:4px}");
CSS.push(".s4-steps .s{display:flex;align-items:center;gap:9px}");
CSS.push(".s4-steps .s .c{position:relative;width:35.4px;height:35.4px;border-radius:50%;border:2px solid #3fd07a;display:flex;align-items:center;justify-content:center;font-size:13.7px;font-weight:800;color:#fff;flex:0 0 auto}");
CSS.push(".s4-steps .s:last-child .c{border-color:var(--acc);box-shadow:0 0 16px color-mix(in srgb,var(--acc) 40%,transparent)}");
CSS.push(".s4-steps .s .c .ok{position:absolute;right:-4px;bottom:-4px;width:14px;height:14px;border-radius:50%;background:#3fd07a;color:#07110b;font-size:9px;display:flex;align-items:center;justify-content:center}");
CSS.push(".s4-steps .s .t{font-size:12.1px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;line-height:1.15}");
CSS.push(".s4-steps .s .d{font-size:10.6px;font-weight:700;letter-spacing:.7px;text-transform:uppercase;color:#3fd07a}");
CSS.push(".s4-steps .ar{width:20.2px;height:20.2px;color:rgba(255,255,255,.35)}");
CSS.push(".s4-steps .ar .ic{width:100%;height:100%}");
CSS.push(".s4-bot{display:grid;grid-template-columns:repeat(4,minmax(0,1fr)) minmax(0,1.05fr);gap:14px;min-height:0}");
CSS.push(".s4-st{display:grid;grid-template-rows:1fr 1fr;gap:8.1px;min-height:0}");
CSS.push(".s4-tot{margin-top:7.1px;padding:8.1px;border-radius:8px;border:1px solid var(--acc);text-align:center}");
CSS.push(".s4-tot .k{font-size:10.1px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:var(--acc)}");
CSS.push(".s4-tot .n{font-size:18.2px;font-weight:800}");
CSS.push(".s4-bot .k2{font-size:11.1px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:rgba(255,255,255,.7)}");
CSS.push(".s4-bot .n2{font-size:22.3px;font-weight:800;line-height:1.05}");
CSS.push(".s4-val .n{font-size:32.4px;font-weight:800;text-align:center;line-height:1}");
CSS.push(".s4-val .t{text-align:center;font-size:13px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#3fd07a}");
CSS.push(".s4-val .bigstars{text-align:center;margin:3px 0 5px}");
CSS.push(".s4-val .bigstars .ng-stars i{font-size:22.3px;color:rgba(255,255,255,.2)}");
CSS.push(".s4-val .bigstars .ng-stars i.on{color:var(--acc)}");
CSS.push(".s4>*{min-height:0}");
CSS.push(".s4-top,.s4-bot,.s4-r{overflow:hidden}");
CSS.push(".s4 .ng-cd{padding:9.6px 13px;overflow:hidden}");
CSS.push(".s4 .ng-cd>*{flex:0 0 auto;min-width:0}");
CSS.push(".s4 .ng-cd h3{font-size:12.8px;letter-spacing:1.1px;margin:0 0 4px}");
CSS.push(".s4 .ng-r{padding:2.6px 0;font-size:12.6px;gap:10px}");
CSS.push(".s4 .ng-r .l{font-size:12.6px;letter-spacing:.2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}");
CSS.push(".s4 .ng-r .v{font-size:13.4px}");
CSS.push(".s4 .ng-r.sub .l{font-size:11.8px;padding-left:12px;color:rgba(255,255,255,.72)}");
CSS.push(".s4 .ng-sep{margin:4.6px 0}");
CSS.push(".s4 .ng-msg{font-size:12.4px;line-height:1.34}");
CSS.push(".s4-r{grid-template-rows:minmax(0,.86fr) minmax(0,1.14fr);gap:8.6px}");
CSS.push(".s4-r .ng-cd{overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain}");
CSS.push(".s4-r .ng-cd::-webkit-scrollbar{width:5px}");
CSS.push(".s4-r .ng-cd::-webkit-scrollbar-track{background:transparent}");
CSS.push(".s4-r .ng-cd::-webkit-scrollbar-thumb{background:rgba(255,255,255,.16);border-radius:5px}");
CSS.push(".s4-r .ng-r{padding:2.1px 0}");
CSS.push(".s4-bot>.ng-cd,.s4-st>.ng-cd{overflow:hidden}");
CSS.push(".s4-bot .ng-r{padding:2.8px 0}");
CSS.push(".s4-bot .ng-track{margin:2px 0 5px}");
CSS.push(".s4-tot{margin-top:6px;padding:7px}");
CSS.push(".s4-tot .n{font-size:17px}");
CSS.push(".s4-bot .n2{font-size:20px}");
CSS.push(".s4-val .n{font-size:29px}");
CSS.push(".s4-val .bigstars .ng-stars i{font-size:20px}");
CSS.push(".s4-pc .lst{padding:8.1px 14px}");
CSS.push(".s4-pc .li{font-size:12px;padding:3.6px 0;gap:10px}");
CSS.push(".s4-pc .li .k{font-size:10.4px;letter-spacing:.6px;line-height:1.12;flex:1 1 auto;min-width:0}");
CSS.push(".s4-pc .li .v{flex:0 0 auto;white-space:nowrap;font-size:12.6px}");
CSS.push(".s4-steps{padding:8.6px 18px;overflow:hidden}");
CSS.push(".s4-steps .stp{gap:22px;flex-wrap:nowrap}");
CSS.push(".ng-cmod{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.66);backdrop-filter:blur(3px);z-index:140000;animation:ngFade .22s both}");
CSS.push(".ng-cmod .cbox{width:min(560px,86%);max-height:82%;overflow-y:auto;overflow-x:hidden;padding:16px 20px 18px;animation:ngPop .28s cubic-bezier(.2,.8,.25,1) both}");
CSS.push(".ng-cmod .ch{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:6px}");
CSS.push(".ng-cmod .ch .t{font-family:var(--disp);font-size:22px;font-weight:800;letter-spacing:.6px;text-transform:uppercase;color:var(--acc)}");
CSS.push(".ng-cmod .cx{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);color:#fff;width:30px;height:30px;border-radius:8px;cursor:pointer;font-size:14px}");
CSS.push(".ng-cmod .cs{font-size:10.8px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:rgba(255,255,255,.6);margin:6px 0 2px}");
CSS.push(".ng-cmod .cact{margin-top:12px;display:flex}");
CSS.push(".s4-hero .stad .wm{left:8%;top:8%;height:58%;opacity:.5;filter:drop-shadow(0 10px 26px rgba(0,0,0,.6));z-index:1}");
CSS.push(".s4-r{grid-template-rows:minmax(0,.74fr) minmax(0,1.26fr);gap:8px}");
CSS.push(".s4-r .ng-cd{padding:8.6px 12px;justify-content:flex-start}");
CSS.push(".s4-r .ng-cd h3{margin:0 0 2px;font-size:12.4px}");
CSS.push(".s4-r .ng-r{padding:1.5px 0;font-size:11.9px}");
CSS.push(".s4-r .ng-r .l{font-size:11.9px}");
CSS.push(".s4-r .ng-r .v{font-size:12.8px}");
CSS.push(".s4-r .ng-r.sub .l{font-size:11.1px}");
CSS.push(".s4-r .ng-sep{margin:3.4px 0}");
CSS.push(".s4{grid-template-rows:1.62fr auto .88fr auto;gap:8.6px}");
CSS.push(".s4-bot{gap:12px}");
CSS.push(".s4-bot>.ng-cd,.s4-st>.ng-cd{justify-content:flex-start}");
CSS.push(".s4-r{grid-template-rows:minmax(0,.64fr) minmax(0,1.36fr)}");
CSS.push(".s4-r .ng-cd{padding:7.6px 12px}");
CSS.push(".s4-r .ng-r{padding:1px 0;font-size:11.7px}");
CSS.push(".s4-r .ng-r .l{font-size:11.7px}");
CSS.push(".s4-r .ng-r .v{font-size:12.6px}");
CSS.push(".s4-r .ng-sep{margin:2.6px 0}");
CSS.push(".s4-r{grid-template-rows:minmax(0,.58fr) minmax(0,1.42fr);gap:7px}");
CSS.push(".s4-r .ng-cd{padding:6.6px 12px}");
CSS.push(".s4-r .ng-cd h3{font-size:12px;margin:0 0 1px}");
CSS.push(".s4-r .ng-r{padding:0.5px 0;font-size:11.4px;line-height:1.25}");
CSS.push(".s4-r .ng-r .l{font-size:11.4px}");
CSS.push(".s4-r .ng-r .v{font-size:12.2px}");
CSS.push(".s4-r .ng-r.sub .l{font-size:10.7px;padding-left:11px}");
CSS.push(".s4-r .ng-sep{margin:2px 0}");
CSS.push(".s4-r{grid-template-rows:auto minmax(0,1fr);gap:7px}");
CSS.push(".s4-r>.ng-cd:first-child{overflow:hidden}");
CSS.push(".s4-r>.ng-cd:last-child{padding:7.6px 12px}");

/* --- FIX S4: hero (minifaces + sfondo + logo) e caratteri piu grandi --- */
CSS.push(".s4-hero{padding:0;overflow:hidden;display:flex;flex-direction:column;min-height:0}");
CSS.push(".s4-hero .stad{position:relative;display:block;flex:1 1 auto;min-height:300px;overflow:hidden;background:linear-gradient(180deg,#05070c 0%,#0a1018 45%,#050708 100%)}");
CSS.push(".s4-hero .stad .lights,.s4-hero .stad .stands,.s4-hero .stad .pitch{z-index:0}");
CSS.push(".s4-hero .stad .bgi{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 38%;filter:saturate(.8) brightness(.74) contrast(1.04);z-index:1}");
CSS.push(".s4-hero .stad .bgsh{position:absolute;inset:0;z-index:2;background:linear-gradient(180deg,rgba(4,6,10,.55) 0%,rgba(4,6,10,.12) 34%,rgba(4,6,10,.68) 78%,rgba(4,6,10,.92) 100%)}");
CSS.push(".s4-hero .stad .wm{position:absolute;left:7%;top:7%;height:54%;opacity:.42;z-index:3;filter:drop-shadow(0 10px 26px rgba(0,0,0,.6))}");
CSS.push(".s4-hero .stad .pl{position:absolute;left:50%;bottom:0;transform:translateX(-50%);height:97%;max-width:80%;object-fit:contain;object-position:bottom;z-index:4;visibility:visible;filter:drop-shadow(0 20px 40px rgba(0,0,0,.7))}");
CSS.push(".s4-hero .stad .hn{position:absolute;left:0;right:0;bottom:12px;text-align:center;z-index:5}");
CSS.push(".s4-hero .stad .hn .big{font-size:44px}");
CSS.push(".s4-hero .stad .hn .sub{font-size:16px}");
CSS.push(".s4-hero .t1{font-size:33px}");
CSS.push(".s4-hero .t2{font-size:17px}");
CSS.push(".s4-hero .t3{font-size:14px}");
CSS.push(".s4-hero .strip .v{font-size:22px}");
CSS.push(".s4-hero .strip .k{font-size:11.4px}");
CSS.push(".s4 .ng-cd h3{font-size:14.4px}");
CSS.push(".s4-r .ng-cd h3{font-size:14.4px;margin:0 0 3px}");
CSS.push(".s4-r .ng-r{font-size:13.6px;padding:1.8px 0;line-height:1.3}");
CSS.push(".s4-r .ng-r .l{font-size:13.4px}");
CSS.push(".s4-r .ng-r .v{font-size:14.4px}");
CSS.push(".s4-r .ng-r.sub .l{font-size:12.6px}");
CSS.push(".s4-bot .ng-r,.s4-st .ng-r{font-size:13.4px;padding:2.2px 0}");
CSS.push(".s4-bot .ng-r .l,.s4-st .ng-r .l{font-size:13.2px}");
CSS.push(".s4-bot .ng-r .v,.s4-st .ng-r .v{font-size:14.2px}");
CSS.push(".s4 .ng-msg{font-size:14px;line-height:1.36}");
CSS.push(".s4-tot .k{font-size:11.6px}");
CSS.push(".s4-tot .n{font-size:20px}");
CSS.push(".s4-bot .k2{font-size:12.6px}");
CSS.push(".s4-bot .n2{font-size:23px}");
CSS.push(".s4-val .n{font-size:33px}");
CSS.push(".s4-val .t{font-size:14.2px}");
CSS.push(".s4-val .bigstars .ng-stars i{font-size:23px}");
CSS.push(".s4-steps .ttl{font-size:16px}");
CSS.push(".s4-steps .s .t{font-size:13.4px}");
CSS.push(".s4-steps .s .d{font-size:11.8px}");
CSS.push(".s4-pc .li{font-size:13.4px}");
CSS.push(".s4-pc .li .k{font-size:11.8px}");
CSS.push(".s4-pc .li .v{font-size:14px}");

/* ===================== APERTURA / LOGICA ===================== */
function findP(name,club){
  var p=null;
  try{ if(typeof findMarket==='function') p=findMarket(name,club); }catch(e){}
  if(!p){ try{ if(typeof findMarket==='function') p=findMarket(name); }catch(e){} }
  if(!p){ try{ var pool=(typeof marketPool==='function')?(marketPool()||[]):[];
      for(var i=0;i<pool.length;i++){ if(pool[i]&&pool[i].name===name){ p=pool[i]; break; } } }catch(e){} }
  if(!p){ try{ var st=S_(), cs=(st&&st.world&&st.world.clubs)?st.world.clubs:null;
      if(cs) for(var k in cs){ var arr=(cs[k]&&(cs[k].players||cs[k].squad||cs[k].rosa))||[];
        for(var j=0;j<arr.length;j++){ if(arr[j]&&arr[j].name===name){ p=arr[j]; break; } } if(p) break; } }catch(e){} }
  if(!p&&name){ p={name:name,club:club||'',rate:74,age:24,roles:['CM'],contractYears:2,nation:'',foot:'Destro',value:0}; }
  return p;
}
function snap(p){
  var val=0;
  try{ if(typeof playerPrice==='function') val=+playerPrice(p)||0; }catch(e){}
  if(!val) val=+p.price||Math.max(0.5,Math.round((p.rate-55)*1.5));
  var s=S_(), yr=1900;
  try{ yr=(typeof getYear==='function')?getYear():((s&&s.baseYear)||2026); }catch(e){ yr=(s&&s.baseYear)||2026; }
  var cy=Math.max(1,+p.contractYears||2);
  return { name:p.name, club:p.club||'Svincolato', value:r1(val), rate:+p.rate||70, age:+p.age||24,
    nation:p.nation||'-', foot:(p.foot||'destro'), role:roleIt(p), img:p.img||'', shirt:shirtOf(p),
    expiry:'30/06/'+(yr+cy), newExpiry:'30/06/'+(yr+4), free:!!p.free||!p.club, raw:p };
}
function open(name,club){
  var s=S_(); if(!s) return;
  var p=findP(name,club); if(!p){ toast('Giocatore non trovato'); return; }
  var d=snap(p), seed=hs('NG|'+d.name+'|'+d.club), r=rng(seed);
  var clz=r1(Math.max(d.value*1.35,d.value+0.3));
  var ask=d.free?0:r1(cl(d.value*(1.04+r()*0.26),r1(d.value*1.02),r1(clz*0.92)));
  var wage=0; try{ if(typeof playerWage==='function') wage=+playerWage(p)||0; }catch(e){}
  if(!wage) wage=Math.max(5,Math.round(d.rate*d.rate/95));
  var ag=agentOf(d.name,d.club);
  var demWage=Math.round(wage*(1.12+r()*0.3));
  var _lvl=1;
  try{ var _ln=String(s.leagueName||'').toLowerCase();
    if(/serie c|league two|third|terza/.test(_ln)) _lvl=0.35;
    else if(/serie b|championship|segunda|2\. bundes|ligue 2|league one/.test(_ln)) _lvl=0.6;
  }catch(e){}
  var _rl=''; try{ _rl=String((d.roles&&d.roles.length?d.roles.join(','):'')||'').toUpperCase(); }catch(e){}
  var _att=/ST|CF|LW|RW|SS|FW|ATT/.test(_rl), _mid=/CM|AM|DM|LM|RM|MF|CEN/.test(_rl);
  var _unit=Math.round(cl((d.value*1.5+(d.rate-62)*0.7)*_lvl,3,140)/5)*5; if(_unit<5) _unit=5;
  var _pB=cl((d.rate-71)/24,0.04,0.72)*(0.55+0.45*_lvl);
  var DB={bApp:0,bGoal:0,bAss:0};
  if(r()<_pB){ var _many=r()<0.3, _half=Math.max(5,Math.round(_unit*0.55/5)*5);
    if(_att){ DB.bGoal=_unit; if(_many) DB.bAss=_half; }
    else if(_mid){ DB.bAss=_unit; if(_many) DB.bGoal=_half; }
    else { DB.bApp=_unit; if(_many) DB.bGoal=_half; }
  }
  s.ng29={
    step:d.free?'wage':'fee', p:d, form:['Discreta','Buona','Ottima'][Math.floor(r()*3)], cond2:88+Math.floor(r()*12),
    expiry:d.expiry, newExpiry:d.newExpiry, clause:clz, sellLast:10,
    ask:{fee:ask,fee0:ask,imm:r1(ask*0.75),bonus:r1(ask*0.25),sell:5+Math.floor(r()*3)*5,days:2+Math.floor(r()*4)},
    off:{fee:r1(ask*0.83),bApp:r1(Math.max(0.5,ask*0.08)),bObj:r1(Math.max(0.5,ask*0.08)),bAppN:25,bObjK:'top4',sell:10,inst:3},
    off0:r1(ask*0.83),
    cond:{def:true,rate:true,fut:false,app:true,obj:true,buy:false},
    ind:{flex:35+Math.floor(r()*45),urg:20+Math.floor(r()*55),intr:45+Math.floor(r()*45),rel:45+Math.floor(r()*45)},
    msg:'Il '+d.club+' attende la nostra prima offerta ufficiale per il cartellino.', msg2:'', newAsk:null,
    round:1, maxRound:5, state:0, agreed:null, score:0,
    agent:ag, patience:100, mood:3, talks:0, cRound:1,
    dem:{wage:demWage,sign:r1(Math.max(0.05,d.value*0.03)),years:3+Math.floor(r()*2),role:(d.rate>=80?'Titolare':'Rotazione'),
         clause:r1(ask*1.25),bApp:DB.bApp,bGoal:DB.bGoal,bAss:DB.bAss},
    con:{wage:Math.round(demWage*0.86),sign:r1(Math.max(0.03,d.value*0.02)),years:3,role:'',
         clause:r1(ask*1.05),bApp:0,bGoal:0,bAss:0},
    prio:{wage:75+Math.floor(r()*22),role:65+Math.floor(r()*30),years:55+Math.floor(r()*30),
          proj:60+Math.floor(r()*35),bonus:45+Math.floor(r()*35),clause:25+Math.floor(r()*40)},
    tl:[], react:{ent:90,tru:88,sat:85,ag:88,club:80}, finalScore:0, bgBefore:budget()
  };
  if(d.free){ s.ng29.agreed={fee:0,bonus:0,sell:0,inst:[0],instN:1}; s.ng29.score=90; }
  render();
}
function render(){
  var n=N(); if(!n) return;
  if(n.step==='fee') screenFee();
  else if(n.step==='deal') screenDeal();
  else if(n.step==='wage') screenWage();
  else screenOfficial();
}

/* ---- handlers schermata 1 ---- */
window.ng29Close=function(){ close(); };
window.ng29Set=function(k,v){ var n=N(); if(!n) return;
  if(k==='bApp'&&!n.cond.app) return;
  if(k==='bObj'&&!n.cond.obj) return;
  if(k==='bAppN'){ if(!n.cond.app) return; n.off.bAppN=cl(Math.round(+v||1),1,60); patchFee(); return; }
  n.off[k]=Math.max(0,r1(+v||0));
  if(k==='bApp'&&n.off.bApp>0) n.bAppLast=n.off.bApp;
  if(k==='bObj'&&n.off.bObj>0) n.bObjLast=n.off.bObj;
  patchFee(); };
window.ng29Obj=function(k){ var n=N(); if(!n||!n.cond.obj) return; n.off.bObjK=k; patchFee(); };
window.ng29SetSell=function(v){ var n=N(); if(!n||!n.cond.fut) return;
  n.off.sell=cl(Math.round(+v||0),0,50); if(n.off.sell>0) n.sellLast=n.off.sell;
  patchFee(); };
window.ng29Adj=function(k,dv){ var n=N(); if(!n) return;
  if(k==='sell'){ if(!n.cond.fut) return; n.off.sell=cl(n.off.sell+dv,0,50); if(n.off.sell>0) n.sellLast=n.off.sell; }
  else if(k==='inst'){ if(!n.cond.rate) return; n.off.inst=cl(n.off.inst+dv,2,3); }
  patchFee(); };
window.ng29Cond=function(k){ var n=N(); if(!n) return; n.cond[k]=!n.cond[k];
  if(k==='fut'){ if(n.cond.fut){ if(!(n.off.sell>0)) n.off.sell=n.sellLast||10; }
    else { if(n.off.sell>0) n.sellLast=n.off.sell; n.off.sell=0; } }
  if(k==='rate') n.off.inst=n.cond.rate?3:1;
  if(k==='app'){ if(n.cond.app){ if(!(n.off.bApp>0)) n.off.bApp=n.bAppLast||1; } else { if(n.off.bApp>0) n.bAppLast=n.off.bApp; n.off.bApp=0; } }
  if(k==='obj'){ if(n.cond.obj){ if(!(n.off.bObj>0)) n.off.bObj=n.bObjLast||1; } else { if(n.off.bObj>0) n.bObjLast=n.off.bObj; n.off.bObj=0; } }
  var oc=document.querySelector('#ng29-ov .s1-off'); if(oc) oc.innerHTML=feeOffer();
  if(k==='obj'&&!n.cond.obj) n.off.bObj=0;
  patchFee(); };
window.ng29Edit=function(){ var e=document.getElementById('ng29-fee'); if(e){ e.focus(); e.select(); } toast('Modifica i valori della tua offerta'); };
window.ng29Ask=function(){ var n=N(); if(!n) return;
  n.ind.intr=cl(n.ind.intr+4,0,100); n.ind.rel=cl(n.ind.rel+3,0,100);
  n.msg='Il '+n.p.club+' ci comunica che accetterebbe '+M(r1(n.ask.fee*0.94))+' con pagamento immediato, oppure '+M(n.ask.fee)+' rateizzato.';
  n.msg2=''; patchFee(); };
window.ng29Withdraw=function(){ toast('Trattativa ritirata'); close(); };
window.ng29Clause=function(){ var n=N(); if(!n) return;
  if(budget()<n.clause){ toast('Budget insufficiente per la clausola'); return; }
  n.off.fee=n.clause; n.off.inst=1; n.cond.rate=false; acceptFee(n.clause,'clausola'); };
window.ng29AcceptAsk=function(){ var n=N(); if(!n) return;
  n.off.fee=n.ask.fee; n.off.bApp=r1(n.ask.bonus*0.5); n.off.bObj=r1(n.ask.bonus*0.5); n.off.sell=n.ask.sell;
  acceptFee(n.ask.fee,'richiesta'); };
window.ng29Send=function(){
  var n=N(); if(!n) return;
  var imm=instRows(n.off.fee,n.off.inst)[0];
  if(imm>budget()){ toast('Esborso immediato superiore al budget'); n.msg='Il nostro club non pu\u00f2 sostenere questo esborso immediato.'; screenFee(); return; }
  var sc=evalOffer(n);
  if(sc>=0.985){ acceptFee(n.off.fee,'offerta'); return; }
  if(n.round>=n.maxRound){ n.msg='Il '+n.p.club+' interrompe la trattativa: le posizioni sono troppo distanti.'; n.newAsk=null; screenFee();
    setTimeout(function(){ toast('Trattativa fallita'); close(); },1800); return; }
  n.round++;
  var mid=r1((n.ask.fee+n.off.fee)/2), newFee=r1(Math.max(n.off.fee+0.5,n.ask.fee-(n.ask.fee-mid)*(0.55+0.25*Math.random())));
  newFee=r1(Math.min(newFee,n.ask.fee,r1(n.clause*0.92)));
  n.ask.fee=newFee; n.ask.imm=r1(newFee*0.72); n.ask.bonus=r1(Math.max(0,n.ask.bonus*0.86)); n.ask.sell=Math.max(0,n.ask.sell-5);
  n.newAsk={fee:newFee,bonus:n.ask.bonus,sell:n.ask.sell};
  n.ind.flex=cl(n.ind.flex+6,0,100); n.ind.intr=cl(n.ind.intr+7,0,100);
  n.msg='Il '+n.p.club+' considera l\'offerta interessante, ma ritiene insufficiente il prezzo fisso.';
  n.msg2='Il club \u00e8 disposto a chiudere la trattativa.';
  screenFee();
};
function acceptFee(fee,how){
  var n=N(); if(!n) return;
  var inst=instRows(fee,n.off.inst), bonus=r1((n.cond.app?n.off.bApp:0)+(n.cond.obj?n.off.bObj:0));
  n.agreed={fee:r1(fee),bonus:bonus,sell:n.off.sell,inst:inst,instN:n.off.inst};
  var save=Math.max(0,n.ask.fee0-fee);
  n.score=cl(Math.round(60+(save/Math.max(1,n.ask.fee0))*120-(n.round-1)*2),35,99);
  n.step='deal'; tlPush('Accordo con il club raggiunto ('+how+') per '+M(fee)+'.');
  screenDeal();
}

/* ---- handlers schermata 3 ---- */
window.ng29ToWage=function(){ var n=N(); if(!n) return; n.step='wage'; if(n.con.noClause==null) n.con.noClause=false;
  n.wmsg=n.agent.name+' attende una nostra parola sulle condizioni economiche.';
  tlPush('Inizia la trattativa con '+n.agent.name+'.'); screenWage(); };
function wSetAnn(n,ann){ var cap=wCapAnn(n), w=false;
  if(ann>cap){ ann=cap; w=true; }
  n.con.wage=Math.max(1,Math.round(cl(ann,0.05,cap)*1000/52));
  return w;
}
function wSync(k){
  var n=N(), map={wage:['ng29w-wage',r1(wAnn(n))],sign:['ng29w-sign',r1(wSign(n))],years:['ng29w-years',n.con.years],
    clause:['ng29w-clause',r1(n.con.clause)],bApp:['ng29w-bapp',Math.round(n.con.bApp)],bGoal:['ng29w-bgoal',Math.round(n.con.bGoal)],bAss:['ng29w-bass',Math.round(n.con.bAss)]};
  var m=map[k]; if(!m) return; var el=document.getElementById(m[0]); if(el) el.value=m[1];
}
function wApply(k,v,fromKeyboard){
  var n=N(); if(!n) return; v=parseFloat(v); if(isNaN(v)) v=0; var warn='';
  if(k==='wage'){ if(wSetAnn(n,v)) warn='Budget insufficiente: lo stipendio massimo che puoi offrire è '+MY(wCapAnn(n))+' a stagione.'; }
  else if(k==='sign'){ var cs=wCapSign(n); if(v>cs){ v=cs; warn='Budget insufficiente: il bonus alla firma massimo è '+MY(cs)+'.'; } n.con.sign=Math.max(0,r1(v)); }
  else if(k==='years'){ n.con.years=cl(Math.round(v),1,6); }
  else if(k==='clause'){ if(n.con.noClause) return; n.con.clause=Math.max(0,r1(v)); }
  else if(k==='bApp'||k==='bGoal'||k==='bAss'){ n.con[k]=cl(Math.round(v),0,5000); }
  if(warn){ n.wmsg=warn; toast(warn); }
  if(warn||!fromKeyboard) wSync(k);
  patchWage();
}
window.ng29CIn=function(k,v){ wApply(k,v,true); };
window.ng29CAdj=function(k,dv){ var n=N(); if(!n) return;
  if(k==='wage') wApply('wage',r1(wAnn(n)+dv*0.2),false);
  else if(k==='sign') wApply('sign',r1(wSign(n)+dv*0.25),false);
  else if(k==='years') wApply('years',n.con.years+dv,false);
  else if(k==='clause') wApply('clause',r1(n.con.clause+dv*5),false);
  else wApply(k,n.con[k]+dv*5,false);
};
window.ng29NoClause=function(){ var n=N(); if(!n) return;
  if(n.con.noClause){ n.con.noClause=false; n.con.clause=n.con.clauseLast||r1(Math.max(n.dem.clause*0.85,n.p.value*1.2)); n.wmsg='Abbiamo reinserito una clausola rescissoria da '+MY(n.con.clause)+'.'; }
  else { n.con.clauseLast=n.con.clause; n.con.noClause=true; n.con.clause=0;
    n.mood=cl(n.mood-(n.prio.clause>=60?1:0),0,4);
    n.wmsg='Contratto senza clausola rescissoria: '+n.agent.name+(n.prio.clause>=60?' non gradisce questa scelta.':' accetta di discuterne.'); }
  patchWage(true);
};
window.ng29Role=function(v){ var n=N(); if(!n) return; n.con.role=v;
  n.wmsg=v?('Offriamo al giocatore un ruolo da '+v.toLowerCase()+'.'):'Nessun ruolo scelto: seleziona il ruolo da offrire.';
  patchWage(true); };
window.ng29Talk=function(i){ var n=N(); if(!n) return;
  n.talks++;
  if(i===0){ var t=r1(wAnn(n)*1.05), cap=wCapAnn(n);
    if(t>cap){ n.wmsg='Non possiamo migliorare lo stipendio: budget esaurito ('+MY(cap)+' massimo).'; toast('Budget insufficiente'); patchWage(); return; }
    wSetAnn(n,t); n.mood=cl(n.mood+1,0,4); n.wmsg='Abbiamo promesso un adeguamento dello stipendio: ora '+MY(wAnn(n))+' a stagione.';
    tlPush('Abbiamo promesso un adeguamento dello stipendio.'); }
  else if(i===1){ var ns=r1(wSign(n)+0.25), cs=wCapSign(n);
    if(ns>cs){ n.wmsg='Non possiamo aumentare il bonus alla firma: budget esaurito ('+MY(cs)+' massimo).'; toast('Budget insufficiente'); patchWage(); return; }
    n.con.sign=ns; n.mood=cl(n.mood+1,0,4); n.wmsg='Abbiamo aumentato il bonus alla firma a '+MY(ns)+'.';
    tlPush('Abbiamo aumentato il bonus alla firma.'); }
  else { window.ng29Ultimatum(); return; }
  patchWage(true); };
window.ng29Ultimatum=function(){ var n=N(); if(!n) return;
  if(!n.con.role){ n.wmsg='Scegli il ruolo da offrire prima di porre un ultimatum.'; toast('Scegli il ruolo da offrire'); patchWage(); return; }
  if(wCost(n)>wLeft(n)+0.05){ n.wmsg='Non possiamo porre un ultimatum: il costo del primo anno ('+MY(wCost(n))+') supera i fondi disponibili ('+MY(wLeft(n))+').'; toast('Budget insufficiente'); patchWage(); return; }
  n.patience=cl(n.patience-22,0,100); n.talks++;
  tlPush('Ultimatum: queste sono le nostre condizioni finali.');
  var pc=cl(cScore(n)-7+(n.mood-2)*4,0,100);
  if(pc>=52||Math.random()*100<pc){
    n.wmsg=n.agent.name+' accetta l\'ultimatum: il contratto viene firmato alle nostre condizioni.';
    toast(n.agent.name+' accetta l\'ultimatum'); tlPush(n.agent.name+' accetta l\'ultimatum.');
    signAll(cl(pc,50,100)); return; }
  n.state=-1; n.mood=0; n.patience=0;
  n.wmsg=n.agent.name+' rifiuta l\'ultimatum: nessun margine di trattativa, i colloqui si chiudono senza accordo.';
  toast('Ultimatum rifiutato: trattativa chiusa'); tlPush(n.agent.name+' rifiuta l\'ultimatum. Trattativa chiusa.');
  patchWage(true); setTimeout(function(){ try{ close(); }catch(e){} },2200); };
window.ng29Promise=function(){ var n=N(); if(!n) return; n.con.role='Titolare'; n.mood=cl(n.mood+1,0,4); n.prio.proj=cl(n.prio.proj+6,0,100);
  n.wmsg='Abbiamo promesso un ruolo importante nel progetto: il giocatore è più convinto.';
  tlPush('Abbiamo promesso un ruolo importante nel progetto.'); patchWage(true); };
window.ng29Bonus=function(){ var n=N(); if(!n) return;
  n.con.bApp=cl(n.con.bApp+10,0,5000); n.con.bGoal=cl(n.con.bGoal+15,0,5000); n.con.bAss=cl(n.con.bAss+10,0,5000);
  n.mood=cl(n.mood+1,0,4); n.wmsg='Abbiamo proposto un pacchetto bonus più ricco (presenze, gol e assist).';
  tlPush('Abbiamo proposto un pacchetto bonus più ricco.'); patchWage(true); };
window.ng29Renclause=function(){ var n=N(); if(!n) return;
  if(n.con.noClause){ n.con.noClause=false;
    n.con.clause=r1(Math.max(n.con.clauseLast||0,n.dem.clause,(n.p&&n.p.value?n.p.value*1.2:1)));
    n.wmsg='Abbiamo reinserito la clausola rescissoria, fissata a '+MY(n.con.clause)+'.';
    toast('Clausola reinserita a '+MY(n.con.clause)); tlPush('Clausola rescissoria reinserita a '+MY(n.con.clause)+'.');
    patchWage(true); return; }
  var nc=r1(Math.max(n.con.clause*1.18+0.2,n.dem.clause));
  var ch=cl(50+(n.mood-2)*9+(n.patience-50)*0.2-((n.agent&&n.agent.tough?n.agent.tough:0.6)-0.6)*45+(n.prio.clause<50?12:-8),8,92);
  n.patience=cl(n.patience-5,0,100);
  if(Math.random()*100<ch){ n.con.clause=nc; n.dem.clause=r1(Math.min(n.dem.clause,nc));
    n.wmsg=n.agent.name+' accetta di alzare la clausola rescissoria: ora fissata a '+MY(nc)+'.';
    toast('Clausola alzata a '+MY(nc)); tlPush(n.agent.name+' accetta la clausola a '+MY(nc)+'.'); }
  else { n.patience=cl(n.patience-7,0,100); n.mood=cl(n.mood-1,0,4);
    n.wmsg=n.agent.name+' rifiuta di alzare la clausola rescissoria: resta a '+MY(r1(n.con.clause))+'.';
    toast('L\'agente rifiuta la nuova clausola'); tlPush(n.agent.name+' rifiuta di alzare la clausola.'); }
  patchWage(true); };
window.ng29Counter=function(){ var n=N(); if(!n) return;
  if(n.cRound>=5){ n.wmsg='Nessuna controproposta rimasta: puoi solo inviare l\'offerta attuale.'; toast('Nessuna controproposta rimasta'); patchWage(); return; }
  n.cRound++; n.patience=cl(n.patience-11,0,100);
  n.dem.wage=Math.round(n.dem.wage*0.96); n.dem.sign=r1(n.dem.sign*0.92); n.dem.clause=r1(n.dem.clause*0.97);
  n.wmsg=n.agent.name+' ha ridotto le richieste: ora chiede '+MY(n.dem.wage*52/1000)+' a stagione e '+MY(n.dem.sign)+' alla firma.';
  tlPush(n.agent.name+' ha ridotto le richieste dopo la controproposta.');
  patchWage(true); };
window.ng29CSend=function(){
  var n=N(); if(!n) return;
  if(!n.con.role){ n.wmsg='Scegli il ruolo da offrire al giocatore prima di inviare l\'offerta.'; toast('Scegli il ruolo da offrire'); patchWage(); return; }
  if(wCost(n)>wLeft(n)+0.05){
    n.wmsg='Offerta non inviata: il costo del primo anno ('+MY(wCost(n))+') supera i fondi disponibili ('+MY(wLeft(n))+').';
    toast('Budget insufficiente'); patchWage(); return; }
  var pc=cScore(n);
  if(pc>=72||(pc>=52&&Math.random()*100<pc)){
    n.wmsg=n.agent.name+' accetta: contratto di '+n.con.years+' anni da '+MY(wAnn(n))+' a stagione.';
    toast(n.agent.name+' ha accettato l\'offerta');
    tlPush(n.agent.name+' accetta le nostre condizioni.');
    signAll(pc); return; }
  n.cRound++; n.patience=cl(n.patience-16,0,100); n.mood=cl(n.mood-1,0,4);
  if(n.cRound>5||n.patience<=0){
    n.wmsg=n.agent.name+' ha interrotto la trattativa: nessun accordo sul contratto.';
    toast('Trattativa sul contratto fallita');
    tlPush('L\'agente ha interrotto la trattativa.'); patchWage(true);
    setTimeout(function(){ close(); },1900); return; }
  n.dem.wage=Math.round((n.dem.wage*2+n.con.wage)/3);
  var why=[];
  if(n.con.wage<n.dem.wage) why.push('stipendio troppo basso');
  if(n.con.sign<n.dem.sign) why.push('bonus alla firma insufficiente');
  if(n.con.years<n.dem.years) why.push('durata troppo breve');
  if(n.con.noClause&&n.prio.clause>=55) why.push('assenza della clausola rescissoria');
  n.wmsg=n.agent.name+' rifiuta ('+(why.length?why.join(', '):'condizioni complessive')+'): chiede '+MY(n.dem.wage*52/1000)+' a stagione. Restano '+Math.max(0,6-n.cRound)+' controproposte.';
  toast(n.agent.name+' ha rifiutato l\'offerta');
  tlPush(n.agent.name+' rifiuta: chiede '+MY(n.dem.wage*52/1000)+' a stagione.');
  patchWage(true);
};

function signAll(pc){
  var n=N(), s=S_(); if(!n||!s) return;
  var a=n.agreed, fee=a.fee, w=n.con.wage;
  s.neg={ name:n.p.name, club:n.p.club, status:'signed', askFee:n.ask.fee0, fee:fee, agreedFee:fee,
    wageDemand:n.dem.wage, wage:w, years:n.con.years, step:'wage', sellClub:n.p.club, loan:false, p:n.p.raw };
  var ok=false;
  try{ var _nf=G('negFinalize'); if(_nf){ _nf(w); ok=true; } }catch(e){}
  if(!ok){ try{ var _sp=G('_signPlayer'); if(_sp){ _sp(n.p.raw,{fee:fee,wage:w,years:n.con.years,loan:false}); s.budget=r1((+s.budget||0)-a.inst[0]); ok=true; } }catch(e2){} }
  try{ var _sg=G('saveGame'); if(_sg) _sg(); }catch(e){}
  n.react={ ent:cl(Math.round(pc+14),40,99), tru:cl(Math.round(pc+8),40,99), sat:cl(Math.round(pc+2),40,99),
            ag:cl(Math.round(pc+6),40,99), club:cl(Math.round(70+n.ind.rel*0.2),40,99) };
  n.finalScore=cl(Math.round((n.score*0.55)+(pc*0.45)),35,99);
  try{ regBonus(); }catch(e){}
  n.step='official'; tlPush('Contratto firmato: il trasferimento \u00e8 ufficiale.');
  screenOfficial();
}
window.ng29Contract=function(){ var n=N(); if(!n) return; var ov=document.getElementById('ng29-ov'); if(!ov) return;
  window.ng29CloseContract();
  var c=n.con, a=n.agreed||{fee:0,bonus:0,sell:0,inst:[0],instN:1}, wy=r1(c.wage*52/1000);
  var rw=function(k,v){ return '<div class="ng-r"><span class="l">'+E(k)+'</span><span class="v">'+v+'</span></div>'; };
  var h='<div class="ng-cd cbox"><div class="ch"><div class="t">Contratto di '+E(n.p.name)+'</div>'+
    '<button class="cx" onclick="window.ng29CloseContract()">\u2715</button></div>'+
    '<div class="cs">Contratto personale</div>'+
    rw('Durata',c.years+' anni')+rw('Scadenza',n.newExpiry)+rw('Stipendio',MY(wy)+' / anno')+
    rw('Stipendio settimanale',K(Math.round(c.wage))+' / sett.')+rw('Bonus alla firma',M(c.sign))+
    rw('Bonus presenze',(c.bApp>0?K(c.bApp):'Nessuno'))+rw('Bonus gol',(c.bGoal>0?K(c.bGoal):'Nessuno'))+
    rw('Bonus assist',(c.bAss>0?K(c.bAss):'Nessuno'))+rw('Ruolo',(c.role||'Titolare'))+
    rw('Clausola rescissoria',(c.noClause?'Nessuna clausola':M(c.clause)))+
    '<div class="ng-sep"></div><div class="cs">Accordo con il club</div>'+
    rw('Prezzo cartellino',M(a.fee))+rw('Pagamento',(a.instN===1?'Unica soluzione':a.instN+' rate'))+
    rw('Bonus',M(a.bonus))+rw('Percentuale rivendita',a.sell+'%')+
    '<div class="ng-sep"></div>'+rw('Costo primo anno',MY(r1(a.inst[0]+wy+c.sign)))+
    '<div class="cact"><button class="ng-b p" onclick="window.ng29CloseContract()">Chiudi</button></div></div>';
  var w=document.createElement('div'); w.id='ng29-contract'; w.className='ng-cmod'; w.innerHTML=h;
  w.addEventListener('click',function(e){ if(e.target===w) window.ng29CloseContract(); });
  ov.appendChild(w); };
window.ng29CloseContract=function(){ var d=document.getElementById('ng29-contract'); if(d&&d.parentNode) d.parentNode.removeChild(d); };
window.ng29Go=function(what){
  var n=N(); if(!n) return; var nm=n.p.name, pl=n.p;
  if(what==='contract'){ window.ng29Contract(); return; }
  close();
  setTimeout(function(){
    var st=S_();
    try{
      if(what==='roster'){
        var rr=G('renderRosa'); if(rr){ rr(); return; }
        if(st) st.mode='rosa'; var rn=G('render'); if(rn){ rn(); return; } return; }
      if(what==='market'){
        var mh=G('renderMarketHub'); if(mh){ mh(); return; }
        if(st) st.mode='mercato'; var rn2=G('render'); if(rn2){ rn2(); return; } return; }
      var loc=null, idx=-1, i2;
      try{ var xi=(st&&st.draft&&st.draft.xi)||[];
        for(i2=0;i2<xi.length;i2++){ if(xi[i2]&&xi[i2].name===nm){ loc='xi'; idx=i2; break; } }
        if(idx<0){ var bn=(st&&st.bench)||[];
          for(i2=0;i2<bn.length;i2++){ if(bn[i2]&&bn[i2].name===nm){ loc='bench'; idx=i2; break; } } }
      }catch(e1){}
      var vo=G('viewOwnedPlayer'); if(vo&&loc){ vo(loc,idx); return; }
      var sm=G('showPlayerModal'); if(sm){ sm(pl,{}); return; }
      if(typeof window.mk27Open==='function'){ window.mk27Open(pl); return; }
      var rr2=G('renderRosa'); if(rr2) rr2();
    }catch(e){}
  },220);
};
window.ng29Finish=function(){ close(); try{ if(typeof window.render==='function') window.render(); }catch(e){} };
window.ng29Open=function(name,club){ open(name,club); };

/* ---- override ---- */
function install(){
  if(window.__ng29inst) return; window.__ng29inst=true;
  window.openNegotiate=function(name,skipFee,club,reqLoan){ open(name,club); };
  window.buyPlayer=function(name,club){ open(name,club); };
  if(!window.__ng29keys){ window.__ng29keys=true;
    document.addEventListener('keydown',function(e){ if(e.key==='Escape'&&document.getElementById('ng29-ov')) close(); });
    window.addEventListener('resize',function(){ if(document.getElementById('ng29-ov')){ setScale(); fitNames(); } });
  }
}

CSS.push(".ng-cur.dis,.ng-thr.dis{opacity:.4}");
CSS.push(".ng-cur.dis input,.ng-thr.dis input{color:rgba(255,255,255,.45);background:rgba(255,255,255,.05);cursor:not-allowed}");
CSS.push(".ng-pm.dis{opacity:.35;pointer-events:none}");
CSS.push(".ng-thr{display:inline-flex;align-items:center;gap:7px;margin-right:10px;font-size:11.5px;font-weight:600;letter-spacing:.9px;text-transform:uppercase;color:rgba(255,255,255,.62)}");
CSS.push(".ng-thr input{width:46px;height:28px;border-radius:8px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.07);color:#fff;font:700 15px/1 inherit;text-align:center;padding:0 3px;letter-spacing:0}");
CSS.push(".ng-sel2{margin-right:10px;height:28px;max-width:210px;border-radius:8px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.07);color:#fff;font:700 12.5px/1 inherit;letter-spacing:.5px;text-transform:uppercase;padding:0 7px}");
CSS.push(".ng-sel2.dis{opacity:.4;cursor:not-allowed}");

function bonState(){ var st=S_(); if(!st) return null; if(!st.ng29bon) st.ng29bon={list:[],snap:null}; return st.ng29bon; }
function regBonus(){
  var n=N(), st=S_(), b=bonState(); if(!n||!st||!b) return;
  if(n.cond.app&&n.off.bApp>0)
    b.list.push({p:n.p.name,type:'app',amt:r1(n.off.bApp),thr:n.off.bAppN,from:(+st.season||1),paid:false});
  if(n.cond.obj&&n.off.bObj>0)
    b.list.push({p:n.p.name,type:'obj',key:n.off.bObjK,amt:r1(n.off.bObj),from:(+st.season||1),until:(+st.season||1)+3,paid:false});
  try{ var sg=G('saveGame'); if(sg) sg(); }catch(e){}
}
function bonApps(name,from){
  var tot=0;
  try{
    if(typeof window.sq28Seasons==='function'&&typeof window.sq28Get==='function'){
      var ks=window.sq28Seasons(name)||[];
      for(var i=0;i<ks.length;i++){ if(+ks[i]<+from) continue; var L=window.sq28Get(name,ks[i]); if(L) tot+=(+L.p||0); }
    }
  }catch(e){}
  return tot;
}
function leaguePos(){
  try{
    var st=S_(); if(!st||!st.saStandings||!st.teamName) return 0;
    var ks=Object.keys(st.saStandings);
    if(!ks.length) return 0;
    ks.sort(function(x,y){ var a=st.saStandings[x],b2=st.saStandings[y];
      return ((+b2.pts||0)-(+a.pts||0))||((+b2.gd||0)-(+a.gd||0))||((+b2.gf||0)-(+a.gf||0)); });
    for(var i=0;i<ks.length;i++) if(ks[i]===st.teamName) return {pos:i+1,tot:ks.length};
  }catch(e){}
  return 0;
}
function objDone(key,snap){
  if(!snap||!snap.pos) return false;
  if(key==='title') return snap.pos===1;
  if(key==='top4') return snap.pos<=4;
  if(key==='euro') return snap.pos<=6;
  if(key==='safe') return snap.pos<=Math.max(1,(snap.tot||20)-3);
  return false;
}
function bonPay(bo,lab){
  var st=S_(); if(!st) return;
  bo.paid=true; bo.when=+st.season||1;
  st.budget=r1((+st.budget||0)-bo.amt);
  toast('Bonus pagato: '+lab+' \u2013 '+M(bo.amt));
  try{ var sg=G('saveGame'); if(sg) sg(); }catch(e){}
}
function bonTick(){
  var st=S_(), b=st?bonState():null; if(!st||!b||!b.list||!b.list.length) return;
  var sn=+st.season||1, lp=leaguePos();
  if(lp&&lp.pos) b.snap={season:sn,pos:lp.pos,tot:lp.tot};
  var prev=b.prevSnap;
  if(b.lastSeason&&b.lastSeason!==sn){ prev=b.closed||prev; }
  if(b.lastSeason!==sn){
    if(b.lastSeason){ b.closed=b.snapPrev||b.snap; }
    b.lastSeason=sn;
  }
  b.snapPrev=b.snap;
  var i, bo;
  for(i=0;i<b.list.length;i++){
    bo=b.list[i]; if(bo.paid) continue;
    if(bo.type==='app'){
      if(bonApps(bo.p,bo.from)>=bo.thr) bonPay(bo,bo.p+' \u2013 '+bo.thr+' presenze');
    }else if(bo.type==='obj'){
      var sp=b.closed;
      if(sp&&sp.season>=bo.from&&sp.season<sn){
        if(objDone(bo.key,sp)) bonPay(bo,bo.p+' \u2013 '+objOf(bo.key).t);
        else if(sn>bo.until){ bo.paid=true; bo.void=true; }
      }else if(sn>bo.until){ bo.paid=true; bo.void=true; }
    }
  }
}
setInterval(function(){ try{ bonTick(); }catch(e){} },6000);

CSS.push(".s2-l .ng-pc{height:496px;min-height:0}");
CSS.push(".s2-l .ng-pc .no{font-size:92px;top:32px;left:17px;-webkit-text-stroke:2.4px rgba(255,255,255,.92)}");
CSS.push(".s2-l .ng-pc .cn{font-size:12.5px;letter-spacing:2px;top:13px;left:19px;z-index:4}");
CSS.push(".s2-l .ng-pc .fc{height:80%;max-width:112%}");
CSS.push(".s2-l .ng-pc .nm .s{font-size:54px}");
CSS.push(".s2-l .ng-pc .nm .f{font-size:13px;letter-spacing:4px}");
CSS.push(".s2-l .ng-pc .foot .v{font-size:18px}");
CSS.push(".s2-msg{padding:11px 15px!important}");
CSS.push(".ng29 .ng-cd{position:relative;border-radius:14px;border:1px solid rgba(255,255,255,.11);background:linear-gradient(180deg,rgba(255,255,255,.062),rgba(255,255,255,.014) 46%,rgba(0,0,0,.28));box-shadow:inset 0 1px 0 rgba(255,255,255,.16),inset 0 -1px 0 rgba(0,0,0,.55),0 16px 38px rgba(0,0,0,.42)}");
CSS.push(".ng29 .ng-cd::after{content:'';position:absolute;inset:0;border-radius:14px;pointer-events:none;background:linear-gradient(118deg,rgba(255,255,255,.09),rgba(255,255,255,0) 34%,rgba(255,255,255,0) 68%,rgba(255,255,255,.055))}");
CSS.push(".ng29 .ng-cd>*{position:relative;z-index:1}");
CSS.push(".ng29 .ng-pc{box-shadow:inset 0 1px 0 rgba(255,255,255,.18),0 20px 44px rgba(0,0,0,.5)}");
CSS.push(".s2-hd{margin-bottom:2px}");
CSS.push(".s2-r1,.s2-r2,.s2-st,.s2-nx{align-self:stretch}");


CSS.push(".s2-r1 .ng-r{padding:5.5px 0}");
CSS.push(".s2-r1>h3,.s2-r2>h3{margin-bottom:8px}");
CSS.push(".s2-nx .ng-cd,.s2-r1,.s2-r2{overflow:visible}");
install(); setInterval(function(){ window.__ng29inst=false; install(); },5000);
})();

