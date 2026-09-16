
/* =========================================================================
   MANAGER26 — MOTORE PARTITA "FM STYLE" v2 (nessuna animazione 3D)
   • vista CAMPO 2D con pedine/minifaces + vista DIRETTA testuale
   • sala tattica completa (modulo, stile, linea, marcatura, focus, ecc.)
   • pagelle con minifaces, panchina, cambi, intervallo, supplementari, rigori
   • altre partite del giorno in diretta
   Integrazione: window.M26Match.start(cfg)  (stessa firma del motore 3D)
   ========================================================================= */
(function(){
if(typeof window==='undefined') return;

/* ---------------------------------------------------------------- utils */
function num(v,d){ v=parseFloat(v); return isNaN(v)?d:v; }
function cl(v,a,b){ return v<a?a:(v>b?b:v); }
function rr(a,b){ return a+Math.random()*(b-a); }
function ri(a,b){ return Math.floor(a+Math.random()*(b-a+1)); }
function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function pick(a){ return a[(Math.random()*a.length)|0]; }
function wpick(list,wfn){ var tot=0,w=[],i; for(i=0;i<list.length;i++){ var x=Math.max(0.0001,wfn(list[i],i)); w.push(x); tot+=x; } var r=Math.random()*tot; for(i=0;i<list.length;i++){ r-=w[i]; if(r<=0) return list[i]; } return list[list.length-1]; }
function sur(name){ var n=String(name||'').trim().split(/\s+/); if(n.length<2) return n[0]||'';
  var i=n.length-1, part=/^(de|di|da|del|della|dos|das|van|von|der|den|le|la|el|al|bin|ben|mac|mc|st)$/i;
  while(i>1&&part.test(n[i-1])) i--;
  return n.slice(i-((i>0&&part.test(n[i-1]))?1:0)).join(' '); }
function one(v){ return (Math.round(v*10)/10).toFixed(1); }
function two(v){ return (Math.round(v*100)/100).toFixed(2); }
function poi(l){ var L=Math.exp(-l),k=0,p=1; do{ k++; p*=Math.random(); }while(p>L); return k-1; }

var POS_DEF=['POR','DC','DC','TD','TS','CDC','CC','CC','AD','AS','ATT'];
function grp(role){ role=String(role||'').toUpperCase();
  if(role.indexOf('POR')===0||role==='GK'||role==='P'||role==='PT') return 'POR';
  if(/^(DC|TD|TS|DD|DS|LIB|CB|LB|RB)/.test(role)) return 'DIF';
  if(/^(CDC|CC|COC|MED|CM|DM|AM|MC)/.test(role)) return 'CEN';
  return 'ATT';
}
function ratCol(r){ if(r>=8.0) return '#7BE3A8'; if(r>=7.0) return '#46A171'; if(r>=6.4) return '#D8DEE6'; if(r>=5.7) return '#DE9255'; return '#E97366'; }
function shortNm(n){ n=String(n||'').replace(/^(FC|AC|AS|SS|US|AFC|SC|SK|RC|CF)\s+/i,'').trim();
  var w=n.split(/\s+/); if(w.length>1) return (w[0][0]+w[1][0]+(w[1][1]||'')).toUpperCase();
  return n.substring(0,3).toUpperCase(); }

function GG(n){ try{ if(typeof window!=='undefined'&&window[n]!=null) return window[n]; }catch(e){}
  try{ var v=eval(n); if(v!=null) return v; }catch(e2){}
  return undefined; }
function GS(){ var s=GG('S'); return s&&typeof s==='object'?s:{}; }
function GDB(){ var d=GG('DB_SERIE_A'); return (d&&typeof d==='object')?d:null; }
function GFORMS(){ var f=GG('FM_FORMATIONS2'); return (f&&typeof f==='object')?f:null; }
function GLOGO(id){ try{ var f=GG('getLogo'); return f?f(id):null; }catch(e){ return null; } }
function face(p,sz){ sz=sz||26;
  var init=esc((sur(p&&p.name)||'?').substring(0,2).toUpperCase());
  return '<span class="fmx-face" style="width:'+sz+'px;height:'+sz+'px;font-size:'+Math.round(sz*0.36)+'px">'+
    '<em>'+init+'</em>'+((p&&p.img)?'<img src="'+esc(p.img)+'" onerror="this.remove()">':'')+'</span>';
}

/* ---------------------------------------------------------------- style */
var CSS=[
'#fm26{position:fixed;inset:0;z-index:100000;background:radial-gradient(1100px 560px at 50% -12%,#16263c 0%,#0b111a 58%,#080b11 100%);color:#E9EFF6;font-family:Inter,-apple-system,"Segoe UI",Roboto,sans-serif;display:flex;flex-direction:column;overflow:hidden;-webkit-user-select:none;user-select:none}',
'#fm26 *{box-sizing:border-box}',
'#fm26 button{font-family:inherit;cursor:pointer}',
'#fm26 .fmx-face{position:relative;display:inline-block;box-sizing:border-box;border-radius:50%;overflow:hidden;flex:0 0 auto;aspect-ratio:1/1;background:linear-gradient(180deg,#2b3b4f,#1a2330);box-shadow:inset 0 0 0 1px rgba(255,255,255,.14)}',
'#fm26 .fmx-face img{border-radius:50%}',
'#fm26 .fmx-face em{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-style:normal;font-weight:800;color:#7e90a4;letter-spacing:.5px}',
'#fm26 .fmx-face img{position:relative;width:100%;height:100%;object-fit:cover;display:block}',
'#fm26 .fmx-top{flex:0 0 auto;display:flex;align-items:stretch;gap:1px;background:rgba(6,10,16,.72);border-bottom:1px solid rgba(255,255,255,.09)}',
'#fm26 .fmx-comp{display:flex;flex-direction:column;justify-content:center;padding:10px 16px;min-width:150px;border-right:1px solid rgba(255,255,255,.08)}',
'#fm26 .fmx-comp b{font-family:Oswald,Inter,sans-serif;font-size:12px;letter-spacing:2.2px;color:#00D26A}',
'#fm26 .fmx-comp span{font-size:11px;color:#8A9AAC;letter-spacing:.6px;margin-top:2px}',
'#fm26 .fmx-score{flex:1;display:flex;align-items:center;justify-content:center;gap:clamp(8px,2vw,26px);padding:8px 10px;min-width:0}',
'#fm26 .fmx-tm{display:flex;align-items:center;gap:10px;min-width:0;flex:1}',
'#fm26 .fmx-tm.r{flex-direction:row-reverse;text-align:right}',
'#fm26 .fmx-tm img{width:30px;height:30px;object-fit:contain;flex:0 0 auto}',
'#fm26 .fmx-tm .nms{display:none;font-family:Oswald,Inter,sans-serif;font-size:15px;letter-spacing:1.2px}',
'#fm26 .fmx-tm .nm{font-family:Oswald,Inter,sans-serif;font-size:clamp(13px,1.5vw,17px);letter-spacing:.8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
'#fm26 .fmx-tm i.kit{width:6px;height:22px;border-radius:2px;flex:0 0 auto;box-shadow:inset 0 0 0 1px rgba(255,255,255,.28)}',
'#fm26 .fmx-gg{font-family:Anton,Oswald,sans-serif;font-size:clamp(24px,3.4vw,38px);letter-spacing:2px;line-height:1;padding:0 4px;min-width:96px;text-align:center}',
'#fm26 .fmx-clock{display:flex;flex-direction:column;align-items:center;justify-content:center;min-width:108px;padding:8px 14px;border-left:1px solid rgba(255,255,255,.08)}',
'#fm26 .fmx-clock b{font-family:Oswald,Inter,sans-serif;font-size:22px;letter-spacing:1px;color:#7BE3A8}',
'#fm26 .fmx-clock span{font-size:10px;letter-spacing:1.6px;color:#8A9AAC;text-transform:uppercase;margin-top:1px}',
'#fm26 .fmx-x{background:none;border:none;color:#8A9AAC;font-size:24px;line-height:1;padding:0 16px;border-left:1px solid rgba(255,255,255,.08)}',
'#fm26 .fmx-x:hover{color:#fff}',
'#fm26 .fmx-tabs{display:none;gap:6px;padding:8px 10px;background:rgba(6,10,16,.5);border-bottom:1px solid rgba(255,255,255,.07)}',
'#fm26 .fmx-tabs button{flex:1;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);color:#B9C6D4;border-radius:9px;padding:9px 6px;font-size:12px;font-weight:700;letter-spacing:.8px}',
'#fm26 .fmx-tabs button.on{background:linear-gradient(180deg,#00D26A,#00a352);border-color:transparent;color:#04180d}',
'#fm26 .fmx-main{flex:1;min-height:0;display:grid;grid-template-columns:290px minmax(0,1fr) 330px;gap:14px;padding:14px}',
'#fm26 .fmx-col{min-height:0;display:flex;flex-direction:column;gap:12px;overflow-y:auto;scrollbar-width:thin}',
'#fm26 .fmx-col::-webkit-scrollbar{width:7px}',
'#fm26 .fmx-col::-webkit-scrollbar-thumb{background:rgba(255,255,255,.14);border-radius:6px}',
'#fm26 .fmx-card{background:linear-gradient(180deg,rgba(19,27,39,.96),rgba(13,19,28,.96));border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:14px}',
'#fm26 .fmx-h{font-family:Oswald,Inter,sans-serif;font-size:11px;letter-spacing:2.2px;color:#8A9AAC;text-transform:uppercase;margin:0 0 12px;display:flex;justify-content:space-between;align-items:center;gap:8px}',
'#fm26 .fmx-h em{font-style:normal;color:#00D26A;letter-spacing:1.4px}',
'#fm26 .fmx-stat{margin-bottom:12px}',
'#fm26 .fmx-stat:last-child{margin-bottom:0}',
'#fm26 .fmx-stat .lb{display:flex;justify-content:space-between;font-size:12px;letter-spacing:.4px;margin-bottom:5px;color:#C6D2DF}',
'#fm26 .fmx-stat .lb i{font-style:normal;color:#8A9AAC;font-size:10px;letter-spacing:1.5px;text-transform:uppercase}',
'#fm26 .fmx-stat .lb b{font-variant-numeric:tabular-nums}',
'#fm26 .fmx-bar{height:6px;border-radius:4px;background:rgba(255,255,255,.09);display:flex;overflow:hidden}',
'#fm26 .fmx-bar u{display:block;height:100%;transition:width .45s ease}',
'#fm26 .fmx-seg2{display:flex;gap:6px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09);border-radius:11px;padding:5px}',
'#fm26 .fmx-seg2 button{flex:1;background:none;border:none;color:#9CAAB9;border-radius:8px;padding:9px 6px;font-family:Oswald,Inter,sans-serif;font-size:12px;letter-spacing:1.6px;text-transform:uppercase}',
'#fm26 .fmx-seg2 button.on{background:linear-gradient(180deg,#00D26A,#00a352);color:#04180d;box-shadow:0 4px 14px rgba(0,210,106,.28)}',
'#fm26 .fmx-center{flex:1;min-height:0;display:flex;flex-direction:column;gap:12px}',
'#fm26 .fmx-view{flex:1;min-height:0;display:flex;flex-direction:column}',
'#fm26 .fmx-feed{flex:1;min-height:0;overflow-y:auto;padding-right:4px;scrollbar-width:thin}',
'#fm26 .fmx-feed::-webkit-scrollbar{width:7px}',
'#fm26 .fmx-feed::-webkit-scrollbar-thumb{background:rgba(255,255,255,.14);border-radius:6px}',
'#fm26 .fmx-ev{display:flex;gap:12px;padding:11px 12px;border-radius:11px;margin-bottom:7px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.055)}',
'#fm26 .fmx-feed .fmx-ev:first-child{animation:fmxIn .3s ease}',
'@keyframes fmxIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}',
'#fm26 .fmx-ev .mn{font-family:Oswald,Inter,sans-serif;font-size:13px;color:#8A9AAC;min-width:40px;letter-spacing:.6px;padding-top:1px}',
'#fm26 .fmx-ev .tx{font-size:13.5px;line-height:1.5;color:#DCE6F0}',
'#fm26 .fmx-ev .tx b{color:#fff}',
'#fm26 .fmx-ev.goal{background:linear-gradient(90deg,rgba(0,210,106,.2),rgba(0,210,106,.05));border-color:rgba(0,210,106,.42)}',
'#fm26 .fmx-ev.goal .mn{color:#7BE3A8}',
'#fm26 .fmx-ev.chance{border-color:rgba(94,159,232,.3)}',
'#fm26 .fmx-ev.card{border-color:rgba(234,194,107,.35)}',
'#fm26 .fmx-ev.red{border-color:rgba(233,115,102,.5);background:rgba(233,115,102,.1)}',
'#fm26 .fmx-ev.phase{background:rgba(255,255,255,.07);border-color:rgba(255,255,255,.12)}',
'#fm26 .fmx-ev.phase .tx{font-family:Oswald,Inter,sans-serif;letter-spacing:1.6px;text-transform:uppercase;font-size:12px;color:#B9C6D4}',
/* pitch */
'#fm26 .fmx-pitchwrap{flex:1;min-height:0;display:flex;flex-direction:column;gap:10px}',
'#fm26 .fmx-pitch{position:relative;flex:1;min-height:220px;border-radius:14px;overflow:hidden;background:repeating-linear-gradient(90deg,#12482a 0 6.25%,#0f4025 6.25% 12.5%);box-shadow:inset 0 0 90px rgba(0,0,0,.55),0 12px 34px rgba(0,0,0,.4);border:1px solid rgba(255,255,255,.1)}',
'#fm26 .fmx-pitch .glow{position:absolute;inset:0;background:radial-gradient(120% 90% at 50% -10%,rgba(255,255,255,.16),rgba(255,255,255,0) 55%);pointer-events:none}',
'#fm26 .fmx-pitch .lines{position:absolute;inset:12px;border:2px solid rgba(255,255,255,.34);border-radius:3px}',
'#fm26 .fmx-pitch .half{position:absolute;left:50%;top:12px;bottom:12px;width:2px;background:rgba(255,255,255,.3)}',
'#fm26 .fmx-pitch .circ{position:absolute;left:50%;top:50%;width:19%;aspect-ratio:1;transform:translate(-50%,-50%);border:2px solid rgba(255,255,255,.3);border-radius:50%}',
'#fm26 .fmx-pitch .spot{position:absolute;left:50%;top:50%;width:6px;height:6px;background:rgba(255,255,255,.5);border-radius:50%;transform:translate(-50%,-50%)}',
'#fm26 .fmx-pitch .box{position:absolute;top:50%;transform:translateY(-50%);height:52%;width:15%;border:2px solid rgba(255,255,255,.3)}',
'#fm26 .fmx-pitch .box.l{left:12px;border-left:none}',
'#fm26 .fmx-pitch .box.r{right:12px;border-right:none}',
'#fm26 .fmx-pitch .box6{position:absolute;top:50%;transform:translateY(-50%);height:26%;width:6.5%;border:2px solid rgba(255,255,255,.26)}',
'#fm26 .fmx-pitch .box6.l{left:12px;border-left:none}',
'#fm26 .fmx-pitch .box6.r{right:12px;border-right:none}',
'#fm26 .fmx-pitch .pk{position:absolute;top:50%;width:5px;height:5px;border-radius:50%;background:rgba(255,255,255,.5);transform:translate(-50%,-50%)}',
'#fm26 .fmx-pitch .pk.l{left:11.5%}','#fm26 .fmx-pitch .pk.r{left:88.5%}',
'#fm26 .fmx-pitch .arc{position:absolute;top:50%;width:7%;aspect-ratio:1;transform:translateY(-50%);border:2px solid rgba(255,255,255,.26);border-radius:50%}',
'#fm26 .fmx-pitch .arc.l{left:12.5%;clip-path:inset(0 0 0 50%)}',
'#fm26 .fmx-pitch .arc.r{right:12.5%;clip-path:inset(0 50% 0 0)}',
'#fm26 .fmx-pitch .gpost{position:absolute;top:50%;transform:translateY(-50%);height:17%;width:7px;border:2px solid rgba(255,255,255,.55);background:rgba(255,255,255,.06)}',
'#fm26 .fmx-pitch .gpost.l{left:4px;border-right:none}','#fm26 .fmx-pitch .gpost.r{right:4px;border-left:none}',
'#fm26 .fmx-tok{position:absolute;transform:translate(-50%,-50%);transition:left .28s linear,top .28s linear;text-align:center;z-index:3}',
'#fm26 .fmx-tok .fmx-face{box-shadow:0 0 0 2px var(--c,#fff),0 4px 10px rgba(0,0,0,.55)}',
'#fm26 .fmx-tok b{display:block;margin-top:2px;font-size:8px;font-weight:700;letter-spacing:.1px;color:#fff;text-shadow:0 1px 4px rgba(0,0,0,.95);max-width:56px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;opacity:.85}',
'#fm26 .fmx-tok.us b{opacity:1}',
'#fm26 .fmx-tok.gk .fmx-face{box-shadow:0 0 0 2px #EAC26B,0 4px 10px rgba(0,0,0,.55)}',
'@media(max-width:760px){#fm26 .fmx-tok b{display:none}}',
'#fm26 .fmx-ball{position:absolute;width:13px;height:13px;border-radius:50%;background:radial-gradient(circle at 32% 28%,#fff,#c9d3dc 60%,#8d99a5);box-shadow:0 3px 10px rgba(0,0,0,.6);transform:translate(-50%,-50%);transition:left .8s ease,top .8s ease;z-index:5}',
'#fm26 .fmx-dot{--dc:#fff}',
'#fm26 .fmx-dot .fmx-face{box-shadow:0 0 0 2px var(--dc,#fff),0 4px 10px rgba(0,0,0,.55)}',
/* caption live sul campo */
'#fm26 .fmx-cap{position:absolute;left:10px;right:10px;bottom:10px;z-index:8;padding:9px 13px;border-radius:11px;background:linear-gradient(90deg,rgba(5,9,14,.94),rgba(5,9,14,.55));border:1px solid rgba(255,255,255,.13);color:#E9EFF6;font-size:12.5px;line-height:1.35;opacity:0;transform:translateY(10px);transition:opacity .25s ease,transform .25s ease}',
'#fm26 .fmx-cap.on{opacity:1;transform:none}',
'#fm26 .fmx-cap i{font-style:normal;font-family:Oswald,Inter,sans-serif;color:#00D26A;margin-right:9px;font-size:11px;letter-spacing:1.2px}',
'#fm26 .fmx-cap.goal{border-color:rgba(0,210,106,.6);background:linear-gradient(90deg,rgba(0,58,31,.96),rgba(5,9,14,.6))}',
'#fm26 .fmx-cap.card,#fm26 .fmx-cap.red{border-color:rgba(234,194,107,.55)}',
'#fm26 .fmx-cap.save,#fm26 .fmx-cap.chance{border-color:rgba(94,159,232,.45)}',
/* evidenza giocatore + palla */
'#fm26 .fmx-tok.run>span,#fm26 .fmx-tok.run>img{animation:fmxrun .34s linear infinite}',
'@keyframes fmxrun{0%{transform:translateY(0)}50%{transform:translateY(-1.2px)}100%{transform:translateY(0)}}',
'#fm26 .fmx-tok.act{z-index:6}',
'#fm26 .fmx-tok.act .fmx-face{box-shadow:0 0 0 3px #fff,0 0 20px 5px rgba(255,255,255,.5)}',
'#fm26 .fmx-tok.sc{z-index:7}',
'#fm26 .fmx-tok.sc .fmx-face{box-shadow:0 0 0 3px #00D26A,0 0 28px 9px rgba(0,210,106,.8);animation:fmxpop .7s ease}',
'@keyframes fmxpop{0%{transform:scale(1)}45%{transform:scale(1.4)}100%{transform:scale(1)}}',
'#fm26 .fmx-ball{transition:left .55s cubic-bezier(.25,.9,.3,1),top .55s cubic-bezier(.25,.9,.3,1)}',
'#fm26 .fmx-ball.hit{animation:fmxball .55s ease}',
'@keyframes fmxball{0%{transform:translate(-50%,-50%) scale(1)}35%{transform:translate(-50%,-50%) scale(2)}100%{transform:translate(-50%,-50%) scale(1)}}',
'#fm26 .fmx-pitch.shake{animation:fmxshake .6s ease}',
'@keyframes fmxshake{0%,100%{transform:none}20%{transform:translate(-4px,2px)}40%{transform:translate(4px,-2px)}60%{transform:translate(-2px,-2px)}80%{transform:translate(2px,2px)}}',
'#fm26 .fmx-pitch .net{position:absolute;top:50%;transform:translateY(-50%);height:26%;width:9px;opacity:0;transition:opacity .2s;background:repeating-linear-gradient(0deg,rgba(255,255,255,.75) 0 1px,transparent 1px 4px),repeating-linear-gradient(90deg,rgba(255,255,255,.75) 0 1px,transparent 1px 4px)}',
'#fm26 .fmx-pitch .net.l{left:3px}','#fm26 .fmx-pitch .net.r{right:3px}',
'#fm26 .fmx-pitch .net.on{opacity:1;box-shadow:0 0 22px 6px rgba(0,210,106,.8)}',
/* animazione gol */
'#fm26 .fmx-goal{position:absolute;inset:0;z-index:60;pointer-events:none;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .3s ease}',
'#fm26 .fmx-goal.on{opacity:1}',
'#fm26 .fmx-goal .bg{position:absolute;inset:0;background:radial-gradient(65% 85% at 50% 50%,rgba(4,10,16,.18),rgba(4,8,14,.62))}',
'#fm26 .fmx-goal .rays{position:absolute;left:50%;top:50%;width:170vmax;height:170vmax;transform:translate(-50%,-50%);background:repeating-conic-gradient(from 0deg,var(--gc,#00D26A) 0deg 5deg,transparent 5deg 16deg);opacity:.09;animation:fmxspin 14s linear infinite}',
'@keyframes fmxspin{to{transform:translate(-50%,-50%) rotate(360deg)}}',
'#fm26 .fmx-goal .gbox{position:relative;text-align:center;padding:26px 46px;border-radius:22px;background:linear-gradient(180deg,rgba(12,20,30,.9),rgba(6,10,16,.96));border:1px solid var(--gc,#00D26A);box-shadow:0 24px 70px rgba(0,0,0,.8),0 0 120px -20px var(--gc,#00D26A);animation:fmxgin .55s cubic-bezier(.2,1.5,.3,1)}',
'@keyframes fmxgin{0%{transform:scale(.6) rotate(-3deg);opacity:0}70%{transform:scale(1.06) rotate(1deg)}100%{transform:scale(1) rotate(0);opacity:1}}',
'#fm26 .fmx-goal .gtxt{font-family:Anton,Oswald,Inter,sans-serif;font-size:72px;line-height:.92;letter-spacing:8px;color:#fff;text-shadow:0 0 30px var(--gc,#00D26A),0 10px 26px rgba(0,0,0,.75)}',
'#fm26 .fmx-goal .gtxt s{text-decoration:none;display:inline-block;animation:fmxbnc .75s ease infinite alternate}',
'#fm26 .fmx-goal .gtxt s:nth-child(2){animation-delay:.07s;color:var(--gc,#00D26A)}',
'#fm26 .fmx-goal .gtxt s:nth-child(3){animation-delay:.14s}',
'#fm26 .fmx-goal .gtxt s:nth-child(4){animation-delay:.21s;color:var(--gc,#00D26A)}',
'@keyframes fmxbnc{from{transform:translateY(0)}to{transform:translateY(-12px)}}',
'#fm26 .fmx-goal .gwho{display:flex;align-items:center;justify-content:center;gap:13px;margin-top:16px}',
'#fm26 .fmx-goal .gwho .fmx-face{box-shadow:0 0 0 3px var(--gc,#00D26A),0 8px 20px rgba(0,0,0,.6)}',
'#fm26 .fmx-goal .gwho b{display:block;font-family:Oswald,Inter,sans-serif;font-size:23px;letter-spacing:1.6px;color:#fff;text-transform:uppercase;text-align:left}',
'#fm26 .fmx-goal .gwho em{display:block;font-style:normal;font-size:11.5px;letter-spacing:1.5px;color:#9FB0C0;text-transform:uppercase;text-align:left;margin-top:3px}',
'#fm26 .fmx-goal .gsc{margin-top:15px;padding-top:13px;border-top:1px solid rgba(255,255,255,.12);font-family:Oswald,Inter,sans-serif;letter-spacing:2px;font-size:13px;color:#C6D2DF}',
'#fm26 .fmx-goal .gsc b{color:#fff;font-size:21px;margin:0 8px}',
'#fm26 .fmx-goal .cf{position:absolute;inset:0;overflow:hidden}',
'#fm26 .fmx-goal .cf i{position:absolute;top:-14%;width:7px;height:14px;border-radius:2px;animation:fmxconf 2.8s linear forwards}',
'@keyframes fmxconf{0%{transform:translateY(0) rotate(0);opacity:1}100%{transform:translateY(130vh) rotate(820deg);opacity:.9}}',
'@media(max-width:760px){#fm26 .fmx-goal .gtxt{font-size:46px;letter-spacing:5px}#fm26 .fmx-goal .gbox{padding:20px 24px}}',
/* ticker altre partite */
'#fm26 .fmx-tick{position:relative;overflow:hidden;height:30px;border-radius:9px;background:linear-gradient(90deg,rgba(0,210,106,.16),rgba(255,255,255,.04));border:1px solid rgba(255,255,255,.08);margin-bottom:9px}',
'#fm26 .fmx-tick .tk{position:absolute;top:0;white-space:nowrap;line-height:30px;font-size:12px;color:#DCE6F0;padding-left:100%;animation:fmxtick 42s linear infinite}',
'#fm26 .fmx-tick .tk s{text-decoration:none;color:#00D26A;font-weight:800;margin:0 5px}',
'#fm26 .fmx-tick .tk u{text-decoration:none;opacity:.35;margin:0 12px}',
'@keyframes fmxtick{0%{transform:translateX(0)}100%{transform:translateX(-100%)}}',
/* griglia tattica */
'#fm26 .fmx-tgrid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:4px}',
'#fm26 .fmx-tgrid .fmx-row{margin:0;display:flex;flex-direction:column;align-items:flex-start;gap:7px}',
'#fm26 .fmx-tgrid .fmx-row .l{font-size:10.5px}',
'#fm26 .fmx-tgrid .fmx-seg{display:flex;flex-wrap:wrap;width:100%;gap:5px}',
'#fm26 .fmx-tgrid .fmx-seg button{flex:1 1 auto;font-size:11px;padding:6px 7px}',
'#fm26 .fmx-tgrid.wide{grid-template-columns:1fr}',
'#fm26 .fmx-spdn{align-self:center;font-size:9.5px;letter-spacing:1.4px;color:#6F8496;text-transform:uppercase;margin-left:8px;white-space:nowrap}',
'#fm26 .fmx-box.pre{width:min(1240px,97vw);padding:14px 18px 16px}',
'#fm26 .fmx-box.pre .fmx-t1{font-size:clamp(19px,2.2vw,25px);margin:3px 0 2px}',
'#fm26 .fmx-box.pre .fmx-t2{font-size:11.5px;margin-bottom:8px}',
'#fm26 .fmx-box.pre .fmx-vs{margin:2px 0 10px;gap:clamp(8px,2vw,26px)}',
'#fm26 .fmx-box.pre .fmx-vs .t img{width:40px;height:40px}',
'#fm26 .fmx-box.pre .fmx-vs .t .n{margin-top:4px;font-size:13px}',
'#fm26 .fmx-box.pre .fmx-vs .mid{font-size:24px}',
'#fm26 .fmx-box.pre .fmx-tgrid{grid-template-columns:repeat(3,1fr);gap:7px}',
'#fm26 .fmx-box.pre .fmx-tgrid .fmx-row{padding:8px 10px}',
'#fm26 .fmx-box.pre .fmx-note{font-size:11px;margin:6px 0 8px;line-height:1.45}',
'#fm26 .fmx-box.pre .fmx-acts{margin-top:8px}',
'#fm26 .fmx-box.pre .fmx-acts .fmx-btn{padding:12px 14px}',
'@media(max-width:1080px){#fm26 .fmx-box.pre .fmx-tgrid{grid-template-columns:repeat(2,1fr)}}',
'@media(max-width:700px){#fm26 .fmx-box.pre .fmx-tgrid{grid-template-columns:1fr}}',
'@media(max-height:820px){#fm26 .fmx-box.pre .fmx-vs .t img{width:32px;height:32px}#fm26 .fmx-box.pre .fmx-t1{font-size:20px}#fm26 .fmx-box.pre .fmx-note{display:none}}',
'@media(max-width:760px){#fm26 .fmx-tgrid{grid-template-columns:1fr}}',
'#fm26 .fmx-seg button.lock{opacity:.35;pointer-events:none}',

'#fm26 .fmx-oth{max-height:150px}',
'#fm26 #fmx-othwrap{flex:0 0 auto}',
'#fm26 .fmx-pitchwrap{flex:1 1 auto}',
'#fm26 .fmx-oth{display:flex;flex-direction:column;gap:5px;max-height:190px;overflow-y:auto;scrollbar-width:thin}',
'#fm26 .fmx-oth::-webkit-scrollbar{width:6px}',
'#fm26 .fmx-oth::-webkit-scrollbar-thumb{background:rgba(255,255,255,.14);border-radius:6px}',
'#fm26 .fmx-om{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:10px;padding:7px 10px;border-radius:9px;background:rgba(255,255,255,.035);font-size:12px}',
'#fm26 .fmx-om .t{display:flex;align-items:center;gap:7px;min-width:0}',
'#fm26 .fmx-om .t.r{flex-direction:row-reverse}',
'#fm26 .fmx-om .t img{width:18px;height:18px;object-fit:contain}',
'#fm26 .fmx-om .t span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#C6D2DF}',
'#fm26 .fmx-om .sc{font-family:Oswald,Inter,sans-serif;font-size:13px;letter-spacing:1px;color:#fff;background:rgba(0,0,0,.35);border-radius:6px;padding:3px 9px;font-variant-numeric:tabular-nums}',
'#fm26 .fmx-lineup{display:flex;flex-direction:column;gap:2px}',
'#fm26 .fmx-pl{display:grid;grid-template-columns:34px 26px 1fr auto auto;align-items:center;gap:8px;padding:5px 6px;border-radius:8px;font-size:12.5px}',
'#fm26 .fmx-pl:hover{background:rgba(255,255,255,.05)}',
'#fm26 .fmx-pl .ps{font-size:9.5px;letter-spacing:.8px;color:#8A9AAC;background:rgba(255,255,255,.07);border-radius:5px;padding:3px 0;text-align:center;font-weight:700}',
'#fm26 .fmx-pl .pn{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#DCE6F0}',
'#fm26 .fmx-pl .pn small{color:#8A9AAC;font-size:10.5px;margin-left:5px}',
'#fm26 .fmx-pl .st{width:32px;height:4px;border-radius:3px;background:rgba(255,255,255,.1);overflow:hidden}',
'#fm26 .fmx-pl .st u{display:block;height:100%}',
'#fm26 .fmx-pl .rt{font-family:Oswald,Inter,sans-serif;font-size:13px;min-width:30px;text-align:right;font-variant-numeric:tabular-nums}',
'#fm26 .fmx-pl.gone{opacity:.42}',
'#fm26 .fmx-sw{display:flex;gap:6px;margin-bottom:10px}',
'#fm26 .fmx-sw button{flex:1;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);color:#B9C6D4;border-radius:8px;padding:7px 4px;font-size:11px;font-weight:700;letter-spacing:.6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
'#fm26 .fmx-sw button.on{background:rgba(0,210,106,.16);border-color:rgba(0,210,106,.45);color:#7BE3A8}',
'#fm26 .fmx-bot{flex:0 0 auto;display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:11px 14px;background:rgba(6,10,16,.8);border-top:1px solid rgba(255,255,255,.09)}',
'#fm26 .fmx-btn{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);color:#DCE6F0;border-radius:10px;padding:11px 16px;font-size:12.5px;font-weight:700;letter-spacing:.8px;min-height:44px}',
'#fm26 .fmx-btn:hover{background:rgba(255,255,255,.11)}',
'#fm26 .fmx-btn.go{background:linear-gradient(180deg,#00D26A,#00a352);border-color:transparent;color:#04180d;box-shadow:0 6px 18px rgba(0,210,106,.3)}',
'#fm26 .fmx-btn.on{background:rgba(0,210,106,.18);border-color:rgba(0,210,106,.5);color:#7BE3A8}',
'#fm26 .fmx-spd{display:flex;gap:4px;margin-left:auto}',
'#fm26 .fmx-spd .fmx-btn{padding:11px 13px;min-width:52px}',
'#fm26 .fmx-ov{position:absolute;inset:0;z-index:40;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(5,9,14,.8);backdrop-filter:blur(9px)}',
'#fm26 .fmx-box{width:min(880px,96vw);max-height:92vh;overflow-y:auto;background:linear-gradient(180deg,#16202e,#0b1119);border:1px solid rgba(255,255,255,.11);border-radius:20px;padding:clamp(18px,3vw,30px);box-shadow:0 30px 80px rgba(0,0,0,.6);scrollbar-width:thin}',
'#fm26 .fmx-box::-webkit-scrollbar{width:7px}',
'#fm26 .fmx-box::-webkit-scrollbar-thumb{background:rgba(255,255,255,.14);border-radius:6px}',
'#fm26 .fmx-kick{text-align:center;font-size:10.5px;letter-spacing:3.4px;color:#00D26A;font-weight:800;text-transform:uppercase}',
'#fm26 .fmx-t1{font-family:Anton,Oswald,sans-serif;font-size:clamp(22px,3.6vw,32px);letter-spacing:1.6px;text-align:center;margin:6px 0 3px}',
'#fm26 .fmx-t2{text-align:center;color:#8A9AAC;font-size:13px;margin-bottom:18px}',
'#fm26 .fmx-vs{display:flex;align-items:center;justify-content:center;gap:clamp(10px,3vw,34px);margin:6px 0 16px}',
'#fm26 .fmx-vs .t{flex:1;text-align:center;min-width:0}',
'#fm26 .fmx-vs .t img{width:clamp(44px,7vw,62px);height:clamp(44px,7vw,62px);object-fit:contain}',
'#fm26 .fmx-vs .t .n{font-family:Oswald,Inter,sans-serif;font-size:14px;letter-spacing:.8px;margin-top:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
'#fm26 .fmx-vs .t .s{font-size:10.5px;color:#8A9AAC;letter-spacing:1.4px;margin-top:3px}',
'#fm26 .fmx-vs .mid{font-family:Anton,Oswald,sans-serif;font-size:clamp(24px,3.6vw,38px);color:#5B7186}',
'#fm26 .fmx-row{display:flex;align-items:center;justify-content:space-between;gap:12px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:10px 13px;margin-bottom:8px;flex-wrap:wrap}',
'#fm26 .fmx-row .l{font-size:11px;letter-spacing:1.5px;color:#8A9AAC;text-transform:uppercase;font-weight:700}',
'#fm26 .fmx-seg{display:flex;gap:5px;flex-wrap:wrap;justify-content:flex-end}',
'#fm26 .fmx-seg button{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.11);color:#C6D2DF;border-radius:8px;padding:8px 11px;font-size:11.5px;font-weight:700;min-height:38px}',
'#fm26 .fmx-seg button.on{background:linear-gradient(180deg,#00D26A,#00a352);border-color:transparent;color:#04180d}',
'#fm26 .fmx-note{font-size:12px;color:#8A9AAC;line-height:1.6;margin:4px 0 14px}',
'#fm26 .fmx-acts{display:flex;gap:9px;flex-wrap:wrap;margin-top:14px}',
'#fm26 .fmx-acts .fmx-btn{flex:1;min-width:150px;text-align:center}',
'#fm26 .fmx-big{font-family:Anton,Oswald,sans-serif;font-size:clamp(44px,9vw,84px);letter-spacing:5px;text-align:center;line-height:1;background:linear-gradient(180deg,#fff,#8FE7B6);-webkit-background-clip:text;background-clip:text;color:transparent}',
'#fm26 .fmx-sc{display:flex;flex-direction:column;gap:5px;margin:14px 0}',
'#fm26 .fmx-sc div{display:flex;justify-content:space-between;gap:10px;font-size:12.5px;color:#C6D2DF;background:rgba(255,255,255,.04);border-radius:8px;padding:8px 12px}',
'#fm26 .fmx-pens{display:flex;flex-direction:column;gap:6px;margin:14px 0}',
'#fm26 .fmx-pen{display:flex;align-items:center;gap:10px;font-size:13px;background:rgba(255,255,255,.04);border-radius:9px;padding:9px 12px}',
'#fm26 .fmx-pen .d{width:9px;height:9px;border-radius:50%;flex:0 0 auto}',
'#fm26 .fmx-flash{position:absolute;left:50%;top:36%;transform:translate(-50%,-50%);z-index:30;text-align:center;pointer-events:none;opacity:0;transition:opacity .25s,transform .25s}',
'#fm26 .fmx-flash.on{opacity:1;transform:translate(-50%,-50%) scale(1.04)}',
'#fm26 .fmx-flash .b{font-family:Anton,Oswald,sans-serif;font-size:min(13vw,120px);letter-spacing:6px;background:linear-gradient(180deg,#fff,#7BE3A8);-webkit-background-clip:text;background-clip:text;color:transparent;text-shadow:0 20px 60px rgba(0,0,0,.6)}',
'#fm26 .fmx-flash .s{font-family:Oswald,Inter,sans-serif;font-size:15px;letter-spacing:3px;color:#DCE6F0;text-transform:uppercase}',
'#fm26 .fmx-board{position:relative;border-radius:12px;background:repeating-linear-gradient(0deg,#12482a 0 8%,#0f4025 8% 16%);border:1px solid rgba(255,255,255,.09);height:270px;overflow:hidden;box-shadow:inset 0 0 60px rgba(0,0,0,.5)}',
'#fm26 .fmx-board .ln{position:absolute;background:rgba(255,255,255,.2)}',
'#fm26 .fmx-dot{position:absolute;transform:translate(-50%,-50%);text-align:center;z-index:2}',
'#fm26 .fmx-dot b{display:block;margin-top:2px;font-size:8.5px;font-weight:700;color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.95);max-width:56px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
'@media(max-width:1180px){#fm26 .fmx-main{grid-template-columns:1fr}#fm26 .fmx-tabs{display:flex}#fm26 .fmx-col{display:none}#fm26 .fmx-col.show{display:flex}}',
'@media(max-width:640px){#fm26 .fmx-comp{min-width:0;padding:8px 10px}#fm26 .fmx-comp span{display:none}#fm26 .fmx-tm .nm{display:none}#fm26 .fmx-tm .nms{display:block}#fm26 .fmx-tm img{width:24px;height:24px}#fm26 .fmx-score{gap:6px;padding:6px 4px}#fm26 .fmx-tm{flex:1 1 0;min-width:0;gap:6px}#fm26 .fmx-tm .nms{font-size:13px;letter-spacing:.6px;white-space:nowrap;overflow:hidden}#fm26 .fmx-tm i.kit{height:16px;width:5px}#fm26 .fmx-gg{flex:0 0 auto;font-size:22px;min-width:60px;padding:0}#fm26 .fmx-clock{min-width:72px;padding:8px}#fm26 .fmx-main{padding:10px;gap:10px}#fm26 .fmx-bot{gap:6px;padding:8px 9px}#fm26 .fmx-btn{padding:9px 11px;font-size:11px;min-height:40px;flex:1}#fm26 .fmx-spd{width:100%;margin-left:0;justify-content:space-between}#fm26 .fmx-spd .fmx-btn{min-width:0;padding:9px 0}#fm26 .fmx-x{padding:0 10px}#fm26 .fmx-tok b{font-size:8px;max-width:44px}}'
].join('\n');
function ensureCss(){ if(document.getElementById('fm26-css')) return; var s=document.createElement('style'); s.id='fm26-css'; s.textContent=CSS; document.head.appendChild(s); }

/* ---------------------------------------------------------------- model */
var M=null;

function mkPlayer(s,role,fb){
  var rate=num(s&&s.rate,fb);
  return {name:(s&&s.name)||'Giocatore', img:(s&&s.img)||null, role:role, g:grp(role),
    pac:num(s&&s.pac,rate), sho:num(s&&s.sho,rate), pas:num(s&&s.pas,rate),
    dri:num(s&&s.dri,rate), def:num(s&&s.def,rate), phy:num(s&&s.phy,rate), rate:rate,
    rating:6.0, stam:100, goals:0, ass:0, shots:0, onT:0, key:0, yc:0, rc:false,
    out:false, outMin:0, inMin:0};
}
function mkTeam(name,logo,kit,spec,formation,fb,isUser){
  var t={name:name||'Squadra', logo:logo||null, kit:kit||{s:'#2783DE',sh:'#123'},
    players:[], bench:[], subs:0, isUser:!!isUser,
    goals:0, shots:0, onT:0, offT:0, blocked:0, corners:0, fouls:0, offside:0,
    yc:0, rc:0, xg:0, posT:0, passes:0, passOk:0, scorers:[], form:formation||null};
  for(var i=0;i<11;i++){
    var role=(formation&&formation[i]&&formation[i].role)||POS_DEF[i];
    t.players.push(mkPlayer(spec&&spec.players&&spec.players[i], role, fb));
  }
  return t;
}
function alive(t){ return t.players.filter(function(p){ return !p.out&&!p.rc; }); }
function gkOf(t){ var a=alive(t); for(var i=0;i<a.length;i++) if(a[i].g==='POR') return a[i]; return a[0]; }

function tmods(t){
  var T=t.tac||{};
  var ment=[0.84,0.92,1,1.08,1.17][T.ment||0]||1, mentD=[1.17,1.08,1,0.93,0.85][T.ment||0]||1;
  var tempo=[0.95,1,1.06][T.tempo||0]||1, press=[0.94,1,1.07][T.press||0]||1;
  var sAtt=[1.03,1,0.99,1.06,0.96][T.style||0]||1, sMid=[0.93,1,1.09,0.98,0.88][T.style||0]||1, sDef=[1.06,1,1.01,0.96,1.0][T.style||0]||1;
  var lAtt=[0.95,1,1.06][T.line||0]||1, lDef=[1.06,1,0.93][T.line||0]||1;
  var mDef=[1,1.03][T.mark||0]||1, mCard=[1,1.22][T.mark||0]||1;
  var aCard=[0.68,1,1.5][T.aggr||0]||1, aDef=[0.97,1,1.05][T.aggr||0]||1;
  return {
    att:ment*tempo*sAtt*lAtt,
    mid:tempo*press*sMid,
    def:mentD*press*sDef*lDef*mDef*aDef,
    burn:0.80+(T.tempo||0)*0.10+(T.press||0)*0.12+(T.aggr||0)*0.03,
    card:aCard*mCard*press,
    trap:(T.line===2?1.55:(T.line===0?0.6:1))
  };
}
function lines(t){
  var att=0,aw=0,mid=0,mw=0,def=0,dw=0,gk=68;
  alive(t).forEach(function(p){
    var f=0.80+0.20*(p.stam/100);
    if(p.g==='POR'){ gk=p.rate*f; return; }
    var q=p.rate*f;
    var qa=(p.sho*0.45+p.dri*0.30+p.pac*0.25)*f*0.5+q*0.5;
    var qm=(p.pas*0.50+p.dri*0.25+p.phy*0.25)*f*0.5+q*0.5;
    var qd=(p.def*0.55+p.phy*0.25+p.pac*0.20)*f*0.5+q*0.5;
    if(p.g==='DIF'){ def+=qd; dw+=1; mid+=qm*0.35; mw+=0.35; att+=qa*0.08; aw+=0.08; }
    else if(p.g==='CEN'){ mid+=qm; mw+=1; def+=qd*0.45; dw+=0.45; att+=qa*0.42; aw+=0.42; }
    else { att+=qa; aw+=1; mid+=qm*0.30; mw+=0.30; def+=qd*0.10; dw+=0.10; }
  });
  var mo=tmods(t), mor=t.mor||1;
  var n=alive(t).length, redPen=n>=11?1:(1-(11-n)*0.075);
  return {
    att:(aw?att/aw:70)*mo.att*mor*redPen,
    mid:(mw?mid/mw:70)*mo.mid*mor*redPen,
    def:(dw?def/dw:70)*mo.def*mor*redPen,
    gk:gk*mor, mo:mo
  };
}

/* --------------------------------------------------------- commentaries */
var C={
  build:['{A} muove il pallone con pazienza, {p} cerca il varco tra le linee.',
    '{A} alza il baricentro: possesso lungo e squadra corta.',
    'Fraseggio insistito di {A}, {p} chiama palla sul centro-destra.',
    'Ritmo alto di {A}: {p} verticalizza ma la difesa chiude.',
    '{A} guadagna campo, {p} scarica indietro e si riparte.'],
  press:['Pressing alto di {A}: {p} recupera palla nella metà campo avversaria.',
    'Duello a centrocampo, {p} esce vincitore e riparte.',
    '{p} intercetta la linea di passaggio e lancia il contropiede.'],
  chance:['Occasione per {A}! {p} entra in area e cerca l\'angolo.',
    '{p} si accentra e calcia dal limite: bella conclusione di {A}.',
    'Cross tagliato, {p} arriva di testa a centro area!',
    'Ripartenza fulminante di {A}, {p} a tu per tu con la difesa.',
    'Uno-due in area, {p} calcia di prima intenzione!',
    '{p} salta l\'uomo e libera il destro dai venti metri.'],
  goal:['GOOOL! {p} non sbaglia: {A} in rete!',
    'RETE DI {P}! Conclusione perfetta, portiere immobile.',
    'GOL! {p} incrocia il pallone all\'angolino basso.',
    'SEGNA {P}! Rete di pura qualità per {A}.',
    'GOL! {p} in area piccola mette dentro il pallone.'],
  save:['Grande parata di {gk}! {p} era andato vicinissimo al gol.',
    '{gk} si distende e respinge la conclusione di {p}.',
    'Riflesso felino di {gk} sul tentativo di {p}.'],
  off:['{p} spreca: pallone alto sopra la traversa.',
    'Conclusione larga di {p}, palla sul fondo.',
    '{p} calcia male da buona posizione: occasione persa.'],
  post:['Palo pieno! {p} sfiora il gol per {A}.','Traversa clamorosa colpita da {p}!'],
  block:['Conclusione di {p} murata da un difensore.','Chiusura provvidenziale: il tiro di {p} viene deviato.'],
  corner:['Calcio d\'angolo per {A}, sale anche la difesa.','Corner conquistato da {A}: cross respinto di testa.'],
  foul:['Fallo di {p}, punizione per gli avversari.','Intervento in ritardo di {p}: gioco fermo.'],
  yellow:['Ammonito {p}: cartellino giallo pienamente meritato.','Giallo per {p}, l\'arbitro non transige.'],
  red:['ROSSO! {p} lascia i suoi in dieci uomini.','Espulsione per {p}: fallo da ultimo uomo.'],
  offside:['Bandierina alzata: {p} era in posizione di offside.','Fuorigioco di {p}, si torna indietro.'],
  dribble:['{p} salta l\'uomo con una finta e guadagna il fondo.','Slalom di {p} tra due maglie: {A} avanza.','{p} brucia il diretto avversario in velocita.'],
  tackle:['Contrasto duro ma regolare: {p} spazza via il pericolo.','Chiusura in scivolata di {p}, applausi dallo stadio.','{p} anticipa tutti e recupera il possesso.'],
  longball:['Lancio lungo del portiere di {A} a cercare la profondita.','{A} verticalizza subito: palla nello spazio per {p}.','Rilancio profondo, {p} prova ad allungare la difesa.'],
  head:['Colpo di testa di {p} sul cross: palla che sfila sul fondo.','{p} stacca sul primo palo ma non trova lo specchio.'],
  var:['Controllo del VAR in corso: si attende il segnale dell\'arbitro.','L\'arbitro va al monitor: check in corso su un episodio in area.'],
  crowd:['Lo stadio spinge: cori a sostegno di {A}.','Boato del pubblico, la squadra alza il ritmo.','Fischi dalle tribune, la partita si innervosisce.'],
  gkplay:['{gk} controlla, gestisce e rallenta il gioco.','{gk} esce di pugno sul cross avversario.'],
  counter:['Transizione fulminante di {A}: tre uomini lanciati in campo aperto!','Palla recuperata e ripartenza immediata: {p} guida il contropiede.'],
  tired:['{p} accusa la fatica: ritmo in calo per {A}.','Gambe pesanti in campo, {A} chiede il cambio dalla panchina.'],
  wood:['Legno! Il pallone di {p} bacia il palo e resta fuori.'],
  keep:['{A} gestisce il ritmo e abbassa i giri.','Partita in fase di studio, poche emozioni.','Le due squadre si annullano a centrocampo.']
};
function say(tpl,team,p,gk){
  return tpl.replace('{A}','<b>'+esc(team.name)+'</b>')
            .replace('{p}','<b>'+esc(sur(p&&p.name))+'</b>')
            .replace('{P}','<b>'+esc(sur(p&&p.name)).toUpperCase()+'</b>')
            .replace('{gk}','<b>'+esc(sur(gk&&gk.name))+'</b>');
}

/* --------------------------------------------------------------- engine */
function feed(min,type,html){
  M.events.unshift({min:min,type:type,html:html});
  if(M.events.length>200) M.events.pop();
  M.dirtyFeed=true;
  if(M.view==='pitch') caption(html,type);
}
function phaseFeed(txt){ feed(M.minLabel(),'phase',esc(txt)); }
function attackers(t){ var a=alive(t).filter(function(p){return p.g!=='POR';}); return a.length?a:alive(t); }
function sideBonus(t,p){
  var f=t.form, i=t.players.indexOf(p), foc=(t.tac&&t.tac.focus)||1;
  var x=(f&&f[i]&&f[i].x!=null)?f[i].x:50;
  if(foc===1) return (x>35&&x<65)?1.25:0.95;
  if(foc===0) return x<38?1.35:0.92;
  if(foc===2) return x>62?1.35:0.92;
  return (x<38||x>62)?1.3:0.95;
}
function shooter(t){ return wpick(attackers(t),function(p){
  var b=p.g==='ATT'?3.4:(p.g==='CEN'?1.5:0.5);
  return b*Math.pow(Math.max(30,p.sho)/60,2.1)*sideBonus(t,p);
}); }
function passer(t,not){ var l=attackers(t).filter(function(p){return p!==not;}); if(!l.length) return null;
  return wpick(l,function(p){ var b=p.g==='CEN'?2.4:(p.g==='ATT'?1.7:1); return b*Math.pow(Math.max(30,p.pas)/60,1.8)*sideBonus(t,p); }); }
function fouler(t){ return wpick(alive(t),function(p){ return p.g==='DIF'?2.4:(p.g==='CEN'?2:(p.g==='POR'?0.15:0.9)); }); }
function addRating(p,v){ if(!p) return; p.rating=cl(p.rating+v,3.0,10.0); }

function goal(t,o,scorer,ass,min){
  t.goals++; scorer.goals++; addRating(scorer,1.0);
  if(ass){ ass.ass++; addRating(ass,0.45); }
  addRating(gkOf(o),-0.28);
  t.scorers.push({min:min,name:scorer.name,img:scorer.img,assist:ass?ass.name:null,assistImg:ass?ass.img:null});
  setAct('goal',t,scorer);
  try{ if(M.rt){ M.rt.plan=null; M.rt.set=null; M.rt.onArrive=null; M.rt.rcv=null; M.rt.mode='wait'; M.rt.wait=99999; rtClearOv(); } }catch(e){}
  updateTokens(); focusTok(scorer,'goal');
  netFlash(t);
  feed(M.minLabel(),'goal',say(pick(C.goal),t,scorer)+' <span style="color:#8A9AAC">'+esc(M.homeT.name)+' '+M.homeT.goals+'-'+M.awayT.goals+' '+esc(M.awayT.name)+(ass?' &middot; assist '+esc(sur(ass.name)):'')+'</span>');
  setTimeout(function(){ try{ if(M&&M.root) celebrate(t,scorer,ass); }catch(e){} },260);
  flash('GOL', sur(scorer.name)+' \u00b7 '+t.name);
  renderTop();
  clearTimeout(M.kickT);
  M.kickT=setTimeout(function(){ try{ if(M&&M.root){
    if(M.view==='pitch'&&M.tokens&&M.tokens.length){ rtKickoff(o); }
    else { var kc=alive(o).filter(function(x){ return x.g==='CEN'; }); play('kick',o,kc.length?pick(kc):null,50,50,420); focusTok(null); }
  } }catch(e){} },3200);
}
function chance(t,o,min){
  var L=lines(t), LO=lines(o);
  var sh=shooter(t), as=passer(t,sh);
  t.shots++; sh.shots++; if(as) as.key++;
  var edge=cl((L.att-LO.def)/70,-0.35,0.45);
  var q=cl(rr(0.10,0.62)+edge*0.35,0.04,0.9);
  var xg=cl(q*0.55*(0.75+Math.max(30,sh.sho)/200),0.02,0.72);
  t.xg+=xg;
  var gkq=cl((LO.gk-70)/60,-0.25,0.35);
  var out;
  if(Math.random()<cl(xg*(1-gkq*0.5),0.01,0.72)) out='goal';
  else { var r2=Math.random(); out=(r2<0.40)?'save':((r2<0.52)?'post':((r2<0.76)?'off':'block')); }
  var gk=gkOf(o);
  if(M.view!=='pitch'||!M.tokens||!M.tokens.length){ resolveShot(t,o,sh,as,min,out,gk); return; }
  rtAttack(t,o,sh,as,out,gk,min);
}
function resolveShot(t,o,sh,as,min,out,gk){
  if(out==='goal'){ goal(t,o,sh,as,min); return; }
  var live=(M.view==='pitch'&&M.tokens&&M.tokens.length);
  if(!live) feed(M.minLabel(),'chance',say(pick(C.chance),t,sh));
  if(out==='save'){
    t.onT++; sh.onT++; addRating(sh,0.14); addRating(gk,0.30);
    feed(M.minLabel(),'save',say(pick(C.save),t,sh,gk));
    if(live&&Math.random()<0.5){
      t.corners++;
      caption('<b>'+esc(sur(gk.name))+'</b> ci arriva e devia in angolo!','save');
      rtCornerSet(t,as||sh);
    } else {
      caption('Ci arriva <b>'+esc(sur(gk.name))+'</b>: palla bloccata a terra!','save');
      if(live) rtRestart(o,'save'); else { setAct('save',t,gk); updateTokens(); ballToPlayer(gk,180); focusTok(gk,'act'); }
    }
  } else if(out==='post'){
    t.onT++; sh.onT++; addRating(sh,0.10);
    netFlash(t);
    feed(M.minLabel(),'chance',say(pick((Math.random()<0.5)?C.post:C.wood),t,sh));
    caption('Legno! <b>'+esc(sur(sh.name))+'</b> a un soffio dal gol.','wood');
    if(live){ if(Math.random()<0.4){ t.corners++; rtCornerSet(t,as||sh); } else rtRestart(o,'post'); }
  } else if(out==='off'){
    t.offT++; addRating(sh,-0.14);
    feed(M.minLabel(),'chance',say(pick(C.off),t,sh));
    caption('Conclusione alta di <b>'+esc(sur(sh.name))+'</b>: rinvio dal fondo.','chance');
    if(live) rtRestart(o,'off');
  } else {
    t.blocked++;
    feed(M.minLabel(),'chance',say(pick(C.block),t,sh));
    caption('Muro difensivo: tiro di <b>'+esc(sur(sh.name))+'</b> respinto.','chance');
    if(Math.random()<0.45){
      t.corners++;
      var bt=as||sh;
      if(live){ rtCornerSet(t,bt); caption('Corner per <b>'+esc(t.name)+'</b>: batte '+esc(sur(bt.name))+', tutti in area.','corner'); }
    } else if(live) rtRestart(o,'block');
  }
}

function simMinute(min){
  var H=M.homeT, A=M.awayT;
  var LH=lines(H), LA=lines(A);
  var pH=cl(LH.mid/((LH.mid+LA.mid)||1)+(H===M.homeT?0.02:0),0.25,0.75);
  H.posT+=pH; A.posT+=(1-pH);
  var pa=Math.round(rr(6,13)*pH*2), pb=Math.round(rr(6,13)*(1-pH)*2);
  H.passes+=pa; A.passes+=pb;
  H.passOk+=Math.round(rr(0.72,0.93)*pa); A.passOk+=Math.round(rr(0.72,0.93)*pb);

  [H,A].forEach(function(t){
    var b=lines(t).mo.burn;
    alive(t).forEach(function(p){ if(p.g==='POR') return; p.stam=cl(p.stam-b*rr(0.55,1.15)*(1+(70-Math.min(90,p.phy))/160),10,100); });
  });

  /* posizione media dell'azione */
  var uAtt=(M.userT===H)?pH:(1-pH);
  M.zone=cl(M.zone*0.55+((uAtt-0.5)*2)*rr(0.2,0.7)+rr(-0.22,0.22),-1,1);
  M.terr[M.zone>0.3?2:(M.zone<-0.3?0:1)]++;
  var _tp=(M.zone>0)?M.userT:M.oppT, _c=alive(_tp).filter(function(x){ return x.g!=='POR'; });
  if(M.view==='pitch'&&M.tokens&&M.tokens.length){
    setAct('build',_tp,(M.rt&&M.rt.carrier)||(_c.length?pick(_c):null));
  } else {
    setAct('build',_tp,_c.length?pick(_c):null);
    setFocus(50+M.zone*46*rr(0.75,1),50+Math.sin((min+M.zone*7)*0.9)*rr(8,26));
  }

  var cH=0.118*cl(LH.att/(LH.att+LA.def)*2.0,0.55,1.55)*pH*1.7;
  var cA=0.118*cl(LA.att/(LA.att+LH.def)*2.0,0.55,1.55)*(1-pH)*1.7;
  if(Math.random()<cH) chance(H,A,min);
  else if(Math.random()<cA) chance(A,H,min);
  else if(M.view!=='pitch'&&Math.random()<0.055){ var tc=Math.random()<pH?H:A; tc.corners++; feed(M.minLabel(),'info',say(pick(C.corner),tc,shooter(tc))); }
  else if(M.view!=='pitch'&&Math.random()<0.075){
    var tf=Math.random()<0.5?H:A, f=fouler(tf); tf.fouls++;
    var cardR=0.055*lines(tf).mo.card;
    if(Math.random()<cardR){
      if(f.yc>=1&&Math.random()<0.28){ f.rc=true; tf.rc++; addRating(f,-1.6); feed(M.minLabel(),'red',say(pick(C.red),tf,f)); flash('ROSSO',sur(f.name)); buildTokens(); }
      else { f.yc++; tf.yc++; addRating(f,-0.35); feed(M.minLabel(),'card',say(pick(C.yellow),tf,f)); }
    } else if(Math.random()<0.35) feed(M.minLabel(),'info',say(pick(C.foul),tf,f));
  }
  else if(M.view!=='pitch'&&Math.random()<0.05*((lines(H).mo.trap+lines(A).mo.trap)/2)){ var to=Math.random()<pH?A:H; to.offside++; feed(M.minLabel(),'info',say(pick(C.offside),to,shooter(to))); }
  else if(M.view!=='pitch'&&Math.random()<0.09){
    var td=Math.random()<pH?H:A, dp=shooter(td);
    stage('dribble',td,dp,atkX(td,rr(0.45,0.72)),rr(18,82),true);
    feed(M.minLabel(),'info',say(pick(Math.random()<0.5?C.dribble:C.counter),td,dp));
  }
  else if(M.view!=='pitch'&&Math.random()<0.09){
    var tt=Math.random()<pH?A:H, dfp=fouler(tt); addRating(dfp,0.10);
    setBall(atkX(tt,rr(0.2,0.45)),rr(20,80),false); focusTok(dfp);
    feed(M.minLabel(),'info',say(pick(C.tackle),tt,dfp));
  }
  else if(M.view!=='pitch'&&Math.random()<0.07){
    var tg=Math.random()<0.5?H:A;
    setBall(atkX(tg,rr(0.05,0.2)),rr(35,65),false);
    feed(M.minLabel(),'info',say(pick(Math.random()<0.5?C.longball:C.gkplay),tg,shooter(tg),gkOf(tg)));
  }
  else if(M.view!=='pitch'&&Math.random()<0.05){
    var th=Math.random()<pH?H:A, hp=shooter(th);
    setBall(atkX(th,rr(0.8,0.95)),rr(30,70),true); focusTok(hp);
    feed(M.minLabel(),'chance',say(pick(C.head),th,hp));
  }
  else if(M.view!=='pitch'&&Math.random()<0.035){ feed(M.minLabel(),'info',say(pick(C.crowd),M.userT,shooter(M.userT))); }
  else if(M.view!=='pitch'&&Math.random()<0.03){ feed(M.minLabel(),'info',esc('')+pick(C.var)); }
  else if(Math.random()<0.035){
    var tz=Math.random()<0.5?H:A, low=alive(tz).slice().sort(function(a,b){ return a.stam-b.stam; })[0];
    if(low&&low.stam<58) feed(M.minLabel(),'info',say(pick(C.tired),tz,low));
  }
  else if(M.view!=='pitch'&&Math.random()<0.10){ var tp=Math.random()<pH?H:A; feed(M.minLabel(),'info',say(pick(Math.random()<0.5?C.build:(Math.random()<0.5?C.press:C.keep)),tp,passer(tp))); }

  if(min%15===0){
    [H,A].forEach(function(t,i){
      var oth=i?H:A, d=(t.goals-oth.goals)*0.05+(t.xg-oth.xg)*0.06;
      alive(t).forEach(function(p){ addRating(p,d*rr(0.4,1.2)+rr(-0.05,0.07)); });
    });
  }
  othersTick(min);
}

/* ---------------------------------------------------- altre partite live */
function clubLogo(nm,db){
  try{ if(db&&db[nm]&&db[nm].logo!=null){ var l=GLOGO(db[nm].logo); if(l) return l; } }catch(e){}
  try{ var ec=GG('euroClubData'); if(ec){ var d=ec(nm); if(d) return GLOGO(d.logo); } }catch(e){}
  return null;
}
function buildOthers(){
  var out=[];
  try{
    var db=GDB();
    if(!db) return out;
    var names=Object.keys(db).filter(function(n){ return n!==M.userT.name&&n!==M.oppT.name; });
    for(var s=names.length-1;s>0;s--){ var j=(Math.random()*(s+1))|0, t=names[s]; names[s]=names[j]; names[j]=t; }
    for(var i=0;i+1<names.length&&out.length<9;i+=2){
      var a=names[i], b=names[i+1];
      var sa=num(db[a]&&db[a].str,75), sb=num(db[b]&&db[b].str,75);
      var ga=poi(Math.max(0.18,1.25+(sa-sb)*0.07)), gb=poi(Math.max(0.18,1.00-(sa-sb)*0.07));
      var ev=[],k;
      for(k=0;k<ga;k++) ev.push({t:0,m:ri(3,92)});
      for(k=0;k<gb;k++) ev.push({t:1,m:ri(3,92)});
      ev.sort(function(x,y){ return x.m-y.m; });
      out.push({a:a,b:b,la:clubLogo(a,db),lb:clubLogo(b,db),ga:0,gb:0,ev:ev,i:0,last:0});
    }
  }catch(e){}
  return out;
}
function othersTick(min){
  if(!M.others||!M.others.length) return;
  var ch=false;
  M.others.forEach(function(o){
    while(o.i<o.ev.length&&o.ev[o.i].m<=min){
      if(o.ev[o.i].t===0) o.ga++; else o.gb++;
      o.last=min; o.i++; ch=true;
    }
  });
  if(ch) renderOthers();
}
function renderOthers(){
  var el=document.getElementById('fmx-others');
  var wrap=document.getElementById('fmx-othwrap');
  if(!el) return;
  if(!M.others||!M.others.length) M.others=buildOthers();
  if(!M.others.length){ if(wrap) wrap.style.display='none'; return; }
  if(wrap){ wrap.style.display=''; wrap.style.flex='0 0 auto'; }
  var mn=(M.phase===0)?0:Math.min(90,M.min);
  el.innerHTML=M.others.map(function(o){
    var hot=(mn-o.last)<=3&&o.last>0;
    return '<div class="fmx-om"><div class="t">'+(o.la?'<img src="'+esc(o.la)+'" onerror="this.remove()">':'')+'<span>'+esc(o.a)+'</span></div>'+
      '<div class="sc"'+(hot?' style="color:#7BE3A8"':'')+'>'+o.ga+' - '+o.gb+'</div>'+
      '<div class="t r">'+(o.lb?'<img src="'+esc(o.lb)+'" onerror="this.remove()">':'')+'<span>'+esc(o.b)+'</span></div></div>';
  }).join('');
  var tk=document.getElementById('fmx-tkin');
  if(tk){
    tk.innerHTML=M.others.map(function(o){
      return esc(shortNm(o.a))+' <s>'+o.ga+'-'+o.gb+'</s> '+esc(shortNm(o.b));
    }).join('<u>&bull;</u>')+'<u>&bull;</u>'+esc(shortNm(M.homeT.name))+' <s>'+M.homeT.goals+'-'+M.awayT.goals+'</s> '+esc(shortNm(M.awayT.name));
  }
  var lv=document.getElementById('fmx-othlive');
  if(lv) lv.textContent=(M.phase===0?'Pre':(mn+"'"));
}


/* --------------------------------------------- palla, caption, esultanza */
function setAct(kind,t,who){
  var A={kind:kind||'build',t:t||M.userT,carrier:who||null,box:[]};
  try{
    if(A.t){
      var atts=alive(A.t).filter(function(x){ return x.g==='ATT'; });
      var cens=alive(A.t).filter(function(x){ return x.g==='CEN'; });
      var difs=alive(A.t).filter(function(x){ return x.g==='DIF'&&x.g!=='POR'; });
      var pool=atts.concat(cens);
      if(kind==='corner') pool=pool.concat(difs.slice(0,2));
      A.box=pool.filter(function(x){ return x!==who&&x.g!=='POR'; }).slice(0,4);
    }
  }catch(e){}
  M.act=A; return A;
}
function stage(kind,t,who,x,y,hard){ setAct(kind,t,who); setBall(x,y,hard); if(who) focusTok(who,kind==='goal'?'goal':'act'); }
function animLater(fn,ms){
  clearTimeout(M.animT);
  var d=Math.max(110,(ms||400)/Math.max(1,(M.speed||1)*0.6));
  M.animT=setTimeout(function(){ try{ if(M&&M.root&&!M.paused) fn(); }catch(e){} },d);
}
function focusPt(){ if(!M.fx) M.fx={x:50,y:50}; return M.fx; }
function setFocus(x,y){ var f=focusPt(); f.x=cl(x,3,97); f.y=cl(y,7,93); M.zone=cl((f.x-50)/46,-1,1); }
function tokOf(pl){ if(!M.tokens||!pl) return null; for(var i=0;i<M.tokens.length;i++){ if(M.tokens[i].p===pl) return M.tokens[i]; } return null; }
function ballEl(){ return document.getElementById('fmx-ball'); }
function ballAt(x,y,ms,hard){
  var b=ballObj(); b.x=cl(x,1,99); b.y=cl(y,3,97);
  var el=ballEl(); if(!el) return;
  var d=Math.max(90,ms||380);
  el.style.transition='left '+d+'ms cubic-bezier(.3,.7,.3,1), top '+d+'ms cubic-bezier(.3,.7,.3,1)';
  el.style.left=b.x+'%'; el.style.top=b.y+'%';
  if(hard){ el.classList.remove('hit'); void el.offsetWidth; el.classList.add('hit'); }
}
function ballToPlayer(pl,ms){
  var tk=tokOf(pl); if(!tk){ var f=focusPt(); ballAt(f.x,f.y,ms); return; }
  var own=(tk.t===M.userT)?1:-1;
  var lx=parseFloat(tk.el.style.left)||50, ly=parseFloat(tk.el.style.top)||50;
  ballAt(lx+own*0.95, ly+0.55, ms);
}
function play(kind,t,who,x,y,ms){
  if(M.rtT){ setAct(kind,t,who); return; }
  setAct(kind,t,who); setFocus(x,y); updateTokens();
  if(who) ballToPlayer(who,ms); else ballAt(x,y,ms);
  if(who) focusTok(who,kind==='goal'?'goal':'act');
}
function setBall(x,y,hard){ if(M.rtT) return; setFocus(x,y); updateTokens(); ballAt(x,y,hard?200:420,hard); }
function stage(kind,t,who,x,y,hard){ play(kind,t,who,x,y,hard?260:420); }
function clearSeq(){ if(M.seqT){ for(var i=0;i<M.seqT.length;i++) clearTimeout(M.seqT[i]); } M.seqT=[]; }
function seqRun(steps){
  clearSeq(); var T=tickDelay(), acc=0;
  steps.forEach(function(st){
    acc+=Math.max(60,(st.at||0.1)*T);
    M.seqT.push(setTimeout(function(){ try{ if(M&&M.root&&!M.paused&&!M.done) st.fn(); }catch(e){} },acc));
  });
}
function ballObj(){ if(!M.ball) M.ball={x:50,y:50}; return M.ball; }
/* ===========================================================================
   MOTORE REALTIME 2D — VISTA DALL'ALTO (stile Championship Manager mobile)
   • le due squadre si muovono a blocco: linea difensiva, reparti compatti,
     scalate laterali, pressing sul portatore, smarcamenti in profondita'
   • la palla appartiene sempre a qualcuno: portatore, passaggi, cross, tiri,
     rimesse, corner, punizioni, rigori
   • OGNI azione che accade sul campo genera la riga di telecronaca relativa
   =========================================================================== */
function opp(t){ return (t===M.homeT)?M.awayT:M.homeT; }
function SN(p){ return '<b>'+esc(sur(p&&p.name))+'</b>'; }
function TN(t){ return '<b>'+esc(shortNm(t&&t.name))+'</b>'; }
function TL(t){ return '<b>'+esc(t&&t.name)+'</b>'; }
function pdist(x1,y1,x2,y2){ var dx=(x1-x2), dy=(y1-y2)*0.66; return Math.sqrt(dx*dx+dy*dy); }

function rtFrame(){ return Math.max(46,132/effSpeed()); }
function rtState(){
  if(!M.rt) M.rt={ t:null, carrier:null, rcv:null, mode:'carry', hold:0, holdMax:3,
    cx:50, cy:50, dy:0, bx:50, by:50, plan:null, onArrive:null, lose:false,
    set:null, wait:0, started:false, lastShot:-9, lastFoul:-9, lastSet:-9, air:false };
  return M.rt;
}
function rtStop(){ if(M.rtT){ clearTimeout(M.rtT); M.rtT=null; } }
function rtStart(){ rtStop(); if(!M||!M.root||M.done) return; if(M.view!=='pitch') return; M.rtT=setTimeout(rtLoop,rtFrame()); }
function rtLoop(){
  if(!M||!M.root||M.done){ M.rtT=null; return; }
  if(M.view!=='pitch'){ M.rtT=null; return; }
  try{ if(!M.paused) rtStep(); }catch(e){}
  M.rtT=setTimeout(rtLoop,rtFrame());
}
function rtEnsure(){
  var R=rtState();
  if(!R.t) R.t=M.homeT;
  if(!R.started){ R.started=true; rtKickoff(R.t); return R; }
  var busy=(R.mode==='pass'||R.mode==='shot'||R.mode==='cross'||R.mode==='loose'||R.mode==='set'||R.mode==='wait');
  var bad=(!R.carrier||R.carrier.out||R.carrier.rc||!tokOf(R.carrier));
  if(bad&&!busy){
    var pool=alive(R.t).filter(function(p){ return (p.g==='CEN'||p.g==='DIF')&&tokOf(p); });
    if(!pool.length) pool=alive(R.t).filter(function(p){ return tokOf(p); });
    if(!pool.length) return R;
    R.carrier=pick(pool); R.rcv=null; R.mode='carry'; R.hold=0; R.holdMax=ri(2,5); R.plan=null;
    var tk=tokOf(R.carrier); R.cx=tk?tk.x:50; R.cy=tk?tk.y:50;
  }
  return R;
}
function ballSet(x,y,ms,ease){
  var b=ballObj(); b.x=cl(x,1,99); b.y=cl(y,2,98);
  var el=ballEl(); if(!el) return;
  var d=Math.max(40,ms||140), e=ease||'linear';
  el.style.transition='left '+d+'ms '+e+', top '+d+'ms '+e;
  el.style.left=b.x+'%'; el.style.top=b.y+'%';
}
function rtFoot(ms){
  var R=rtState(), tk=tokOf(R.carrier); if(!tk) return;
  var own=(tk.t===M.userT)?1:-1;
  /* leggermente sovrapposta alla pedina: si capisce subito chi ha il pallone */
  ballSet(tk.x+own*0.95,tk.y+0.55,ms,'linear');
}
function rtFeed(html,type){
  try{
    var k=(type||'')+'|'+html;
    if(M.rtLastFeed===k) return;
    M.rtLastFeed=k;
    feed(M.minLabel(),type||'info',html);
    if(M.view!=='pitch'&&M.dirtyFeed!==false) M.dirtyFeed=true;
  }catch(e){}
}
/* caption sempre + riga di diretta con probabilita' p */
function say2(capHtml,kind,p,feedHtml,ftype){
  caption(capHtml,kind||'info');
  if(feedHtml&&(p==null||Math.random()<p)) rtFeed(feedHtml,ftype||'info');
}
function rtZoneName(t,x){
  var pr=rtProg(x,t);
  if(pr>0.72) return 'in area';
  if(pr>0.35) return 'nel terzo offensivo';
  if(pr>-0.15) return 'a centrocampo';
  return 'in fase di costruzione';
}
function rtProg(x,t){ var own=(t===M.userT)?1:-1; return cl((x-50)/46*own,-1,1); }
function atkX(t,frac){ return (t===M.userT)?(50+frac*46):(50-frac*46); }

/* ------------------------------------------------------------- geometria */
function nearestTok(team,x,y,excl,inclGk){
  var best=null,bd=1e9;
  (M.tokens||[]).forEach(function(tk){
    if(tk.t!==team) return;
    if(excl&&tk.p===excl) return;
    if(!inclGk&&tk.p.g==='POR') return;
    var d=pdist(tk.x,tk.y,x,y);
    if(d<bd){ bd=d; best=tk; }
  });
  return best?{tk:best,p:best.p,d:bd}:null;
}
/* proiezione dell'ultimo difensore di una squadra (x reale, non target) */
function lastManX(T){
  var d=(T===M.userT)?1:-1, best=null;
  (M.tokens||[]).forEach(function(k){
    if(k.t!==T||k.p.g==='POR') return;
    var pj=k.x*d; if(best==null||pj<best) best=pj;
  });
  if(best==null) best=(d===1)?10:-90;
  return best*d;
}
/* i due difensori piu' vicini alla palla vanno in pressing */
function rtPressers(){
  var R=M.rt; var out=[];
  if(!R||!R.t||!M.tokens||!M.tokens.length) return out;
  var d=opp(R.t), b=ballObj();
  var arr=M.tokens.filter(function(tk){ return tk.t===d&&tk.p.g!=='POR'&&!tk.ov; });
  if(!arr.length) return out;
  arr.sort(function(a,c){ return pdist(a.x,a.y,b.x,b.y)-pdist(c.x,c.y,b.x,b.y); });
  var press=((d.tac&&d.tac.press)||0);
  var n=(R.mode==='carry')?(press>=2?3:2):1;
  for(var i=0;i<Math.min(n,arr.length);i++){
    if(pdist(arr[i].x,arr[i].y,b.x,b.y)<38) out.push(arr[i].p);
  }
  return out;
}
function rtClearOv(){ if(M.tokens) M.tokens.forEach(function(tk){ tk.ov=null; }); }

/* ------------------------------------------------------------ possesso */
function rtGive(team,player,x,y){
  var R=rtState();
  R.t=team; R.carrier=player; R.rcv=null; R.mode='carry'; R.hold=0;
  R.holdMax=ri(2,5); R.lose=false; R.dy=rr(-1,1); R.onArrive=null;
  var tk=tokOf(player);
  R.cx=(x!=null)?x:(tk?tk.x:50);
  R.cy=(y!=null)?y:(tk?tk.y:50);
  rtClearOv();
  /* il pallone si attacca subito ai piedi di chi lo conquista */
  if(tk){ var ow=(tk.t===M.userT)?1:-1; ballSet(tk.x+ow*0.95,tk.y+0.55,120,'linear'); }
  focusTok(player,'act');
}
function rtDuel(att,def,defTeam){
  var a=(att.dri*0.52+att.pac*0.30+att.phy*0.18)*(0.80+att.stam/500);
  var d=(def.def*0.56+def.pac*0.24+def.phy*0.20)*(0.80+def.stam/500);
  var pBeat=cl(0.36+(a-d)/150,0.12,0.74);
  if(Math.random()<pBeat) return 'beat';
  var aggr=1; try{ aggr=lines(defTeam).mo.card; }catch(e){}
  return (Math.random()<cl(0.22*aggr,0.10,0.45))?'foul':'lost';
}
function rtSteal(o,winner,loser){
  var R=rtState();
  addRating(winner,0.07); addRating(loser,-0.05);
  rtGive(o,winner);
  R.plan=null;
  say2(SN(winner)+' porta via il pallone a '+SN(loser)+'!','tackle',0.5,
       'Contrasto vinto da '+SN(winner)+': il possesso passa a '+TN(o)+'.','info');
}

/* --------------------------------------------------------- portiere */
function rtGkDistribute(){
  var R=rtState(), t=R.t, gk=R.carrier;
  var lng=alive(t).filter(function(p){ return (p.g==='ATT'||p.g==='CEN')&&tokOf(p); });
  var srt=alive(t).filter(function(p){ return p.g==='DIF'&&tokOf(p); });
  var longBall=(Math.random()<0.45)||!srt.length;
  var rcv=longBall?(lng.length?pick(lng):(srt.length?pick(srt):null)):pick(srt);
  if(!rcv){ return; }
  var rtk=tokOf(rcv);
  R.mode='pass'; R.rcv=rcv; R.lose=false; R.air=longBall;
  R.bx=rtk.x; R.by=rtk.y;
  if(longBall) say2('Rilancio lungo di '+SN(gk)+' verso '+SN(rcv)+'.','pass',0.45,
        say(pick(C.longball),t,rcv,gk),'info');
  else say2(SN(gk)+' apre in orizzontale per '+SN(rcv)+'.','pass',0.2,
        say(pick(C.gkplay),t,rcv,gk),'info');
}

/* ------------------------------------------------------------- azione */
function rtCarry(){
  var R=rtState(), t=R.t, o=opp(t), own=(t===M.userT)?1:-1, c=R.carrier;
  if(!c){ return; }
  if(R.plan&&R.plan.t!==t){
    var pw=alive(R.plan.t).filter(function(p){ return p.g==='CEN'&&tokOf(p); });
    if(!pw.length) pw=alive(R.plan.t).filter(function(p){ return p.g!=='POR'&&tokOf(p); });
    if(pw.length){ rtGive(R.plan.t,pick(pw)); return; }
  }
  R.hold=(R.hold||0)+1;

  if(c.g==='POR'){
    R.cx=cl(R.cx+own*0.8,3,97);
    if(R.hold>=2) rtGkDistribute();
    return;
  }

  var ctk0=tokOf(c);
  if(ctk0){ R.cx=cl(R.cx,ctk0.x-9,ctk0.x+9); R.cy=cl(R.cy,ctk0.y-9,ctk0.y+9); }
  var px=ctk0?ctk0.x:R.cx, py=ctk0?ctk0.y:R.cy;
  var prog=rtProg(px,t);
  var pr=nearestTok(o,px,py,null);
  var dP=pr?pr.d:99;

  /* fallo tattico anche senza contrasto diretto */
  if(!R.plan&&pr&&dP<11&&Math.random()<0.09){
    rtFoul(t,o,pr.p,c,px,py); return;
  }

  /* 1 contro 1 (solo in gioco libero: le occasioni programmate non si perdono) */
  if(!R.plan&&pr&&dP<7.5&&R.hold>=1&&Math.random()<0.62){
    var res=rtDuel(c,pr.p,o);
    if(res==='foul'){ rtFoul(t,o,pr.p,c,R.cx,R.cy); return; }
    if(res==='lost'){
      if((R.cy<12||R.cy>88)&&Math.random()<0.35){ rtThrow(t,R.cx,(R.cy<50)?3:97,c,pr.p); return; }
      rtSteal(o,pr.p,c); return;
    }
    R.cx=cl(R.cx+own*rr(3.5,6.5),4,96); R.cy=cl(R.cy+rr(-5,5),8,92); R.hold=0;
    addRating(c,0.05);
    say2(SN(c)+' salta '+SN(pr.p)+' e va via!','dribble',0.42,say(pick(C.dribble),t,c),'info');
    return;
  }

  /* avanzamento */
  if(Math.random()<0.34) R.dy=rr(-2.4,2.4);
  var adv = R.plan ? ((prog<0.5)?rr(2.8,4.0):((prog<0.8)?rr(2.0,3.0):rr(0.9,1.7)))
                   : ((dP<8)?rr(0.4,1.3):rr(1.2,2.3));
  R.cx=cl(R.cx+own*adv,4,96);
  R.cy=cl(R.cy+(R.dy||0),8,92);
  prog=rtProg(R.cx,t);

  /* occasione programmata dal motore statistico */
  if(R.plan){
    var P=R.plan;
    if(c===P.sh){
      if(prog>(P.minPr||0.78)||(R.hold>=9&&prog>0.68)||(R.hold>=16&&prog>0.62)) rtShoot();
      return;
    }
    if(R.hold>=(P.hold||2)) rtPlanPass();
    return;
  }

  /* in area si calcia: nessuno fraseggia dentro l'area piccola */
  var inBox=(prog>0.76&&py>24&&py<76);
  if(inBox&&Math.random()<(0.62+(dP<4?0.2:0))){ rtFreeShot(); return; }
  /* conclusione dalla distanza (rara, solo con spazio davanti) */
  if(prog>0.62&&prog<0.78&&dP>6.5&&(M.min-(R.lastShot||-9))>=2&&Math.random()<(0.022+Math.max(0,c.sho-72)/1400)){
    rtFreeShot(); return;
  }
  /* cross dalla corsia esterna */
  if(prog>0.60&&(R.cy<27||R.cy>73)&&Math.random()<0.34){ rtCross(false); return; }
  /* passaggio */
  if(R.hold>=R.holdMax||dP<3.6||prog>0.90){ rtPass(); return; }
}

function rtPass(){
  var R=rtState(), t=R.t, o=opp(t), c=R.carrier, ctk=tokOf(c);
  if(!ctk){ return; }
  var own=(t===M.userT)?1:-1;
  var cand=alive(t).filter(function(p){ return p!==c&&p.g!=='POR'&&tokOf(p); });
  if(!cand.length) cand=alive(t).filter(function(p){ return p!==c&&tokOf(p); });
  if(!cand.length) return;
  var lmX=lastManX(o);                       /* linea del fuorigioco avversaria */
  var rcv=wpick(cand,function(p){
    var tk=tokOf(p);
    var fwd=(tk.x-ctk.x)*own;
    var dst=pdist(tk.x,tk.y,ctk.x,ctk.y);
    var mk=nearestTok(o,tk.x,tk.y,null);
    var free=mk?cl(mk.d/9,0.22,1.7):1.5;
    var off=((tk.x-lmX)*own>0.5)?0.04:1;     /* servire un compagno oltre l'ultimo difensore: quasi mai */
    return Math.max(0.04,(1+fwd*0.055-Math.max(0,dst-32)*0.055)*free*off);
  });
  var rtk=tokOf(rcv);
  var mk2=nearestTok(o,rtk.x,rtk.y,null);
  var dMark=mk2?mk2.d:24;
  var deep=rtProg(rtk.x,t);

  /* fuorigioco su lancio in profondita' */
  var trap=1; try{ trap=lines(o).mo.trap; }catch(e){}
  if(rcv.g==='ATT'&&deep>0.30&&(rtk.x-ctk.x)*own>3&&Math.random()<0.15*trap){
    t.offside++; addRating(rcv,-0.06);
    R.mode='wait'; R.wait=Math.max(4,Math.round(7/Math.max(1,effSpeed()*0.7)));
    ballSet(rtk.x,rtk.y,320,'ease');
    say2('Bandierina alzata: '+SN(rcv)+' era in fuorigioco.','offside',1,say(pick(C.offside),t,rcv),'info');
    var self=rcv;
    R.onArrive=null;
    setTimeout(function(){ try{ if(M&&M.root&&!M.done) rtRestart(o,'offside'); }catch(e){} },Math.max(500,900/Math.max(1,effSpeed())));
    return;
  }

  /* pallone che esce sulla linea laterale */
  if((rtk.y<24||rtk.y>76)&&Math.random()<0.13){
    rtThrow(t,rtk.x,(rtk.y<50)?3:97,c,null);
    return;
  }

  /* intercetto */
  var risk=cl(0.26-(c.pas-68)/320-(dMark-6)/45+Math.max(0,deep)*0.10,0.03,0.36);
  var lost=Math.random()<risk;
  if(lost&&mk2){
    R.mode='pass'; R.rcv=mk2.p; R.lose=true; R.air=false;
    R.bx=mk2.tk.x; R.by=mk2.tk.y;
    addRating(mk2.p,0.06); addRating(c,-0.05);
    say2(SN(mk2.p)+' legge la linea di passaggio e intercetta!','tackle',0.5,
         'Palla persa da '+SN(c)+': '+SN(mk2.p)+' intercetta per '+TN(o)+'.','info');
    return;
  }
  R.mode='pass'; R.rcv=rcv; R.lose=false; R.pfrom=c; R.air=(pdist(rtk.x,rtk.y,ctk.x,ctk.y)>26);
  R.bx=rtk.x; R.by=rtk.y;
  var thr=(deep>0.45&&(rtk.x-ctk.x)*own>9);
  if(thr) say2(SN(c)+' verticalizza per '+SN(rcv)+'!','pass',0.42,
      TN(t)+' alza il ritmo: '+SN(c)+' lancia '+SN(rcv)+' in profondita\'.','info');
  else if(Math.random()<0.55) say2(SN(c)+' appoggia per '+SN(rcv)+'.','pass',0.16,
      TN(t)+' muove il pallone '+rtZoneName(t,ctk.x)+': '+SN(c)+' per '+SN(rcv)+'.','info');
  else caption(SN(c)+' scarica su '+SN(rcv)+'.','pass');
}

function rtPlanPass(){
  var R=rtState(), P=R.plan; if(!P){ rtPass(); return; }
  var rcv=null;
  if(P.as&&!P.asDone&&R.carrier!==P.as&&tokOf(P.as)){ rcv=P.as; P.asDone=true; }
  else if(R.carrier!==P.sh&&tokOf(P.sh)) rcv=P.sh;
  if(!rcv){ rtShoot(); return; }
  var rtk=tokOf(rcv);
  R.mode='pass'; R.rcv=rcv; R.lose=false; R.hold=0;
  R.bx=rtk.x; R.by=rtk.y; R.air=false;
  var pr=rtProg(R.cx,P.t);
  if(pr>0.72&&rcv===P.sh){
    R.air=true;
    say2('Cross di '+SN(R.carrier)+' per '+SN(rcv)+' in area!','cross',1,
         'Cross di '+SN(R.carrier)+' dal fondo: '+SN(rcv)+' attacca il primo palo.','chance');
  } else {
    say2(SN(R.carrier)+' verticalizza per '+SN(rcv)+'.','pass',0.6,
         TN(P.t)+' costruisce: '+SN(R.carrier)+' serve '+SN(rcv)+' tra le linee.','info');
  }
}

/* --------------------------------------------------------------- tiri */
function rtDoShot(P,quick){
  var R=rtState();
  var t=P.t, out=P.out, sh=P.sh, gx, gy, gtk;
  R.lastShot=M.min; R.plan=null; R.hold=0; rtClearOv();
  var shtk=tokOf(sh);
  if(shtk&&rtProg(shtk.x,t)<0.60){
    shtk.x=atkX(t,rr(0.66,0.76)); shtk.y=cl(shtk.y*0.5+rr(38,62)*0.5,12,88);
    shtk.el.style.transition='left 420ms cubic-bezier(.3,.7,.3,1), top 420ms cubic-bezier(.3,.7,.3,1)';
    shtk.el.style.left=shtk.x+'%'; shtk.el.style.top=shtk.y+'%';
  }
  if(shtk){ R.cx=shtk.x; R.cy=shtk.y; ballSet(shtk.x+((t===M.userT)?0.95:-0.95),shtk.y+0.55,140,'linear'); }
  if(out==='goal'){ gx=atkX(t,1.04); gy=rr(43,57); }
  else if(out==='save'){ gtk=tokOf(P.gk); gx=gtk?gtk.x:atkX(t,0.98); gy=gtk?gtk.y+0.6:50; }
  else if(out==='post'){ gx=atkX(t,1.01); gy=(Math.random()<0.5)?39:61; }
  else if(out==='off'){ gx=atkX(t,1.08); gy=(Math.random()<0.5)?26:74; }
  else { gx=atkX(t,0.90); gy=rr(40,60); }
  focusTok(sh,'act');
  var el=ballEl(); if(el){ el.classList.remove('hit'); void el.offsetWidth; el.classList.add('hit'); }
  R.mode='shot'; R.bx=gx; R.by=gy; R.air=true;
  R.onArrive=function(){ try{ resolveShot(P.t,P.o,P.sh,P.as,P.min,P.out,P.gk); }catch(e){} };
}
function rtShoot(){
  var R=rtState(), P=R.plan; if(!P) return;
  var t=P.t;
  var _z=rtProg((tokOf(P.sh)?tokOf(P.sh).x:R.cx),t);
  var _zn=(_z>0.78)?'da dentro l\'area':((_z>0.55)?'dal limite dell\'area':'da fuori area');
  say2(SN(P.sh)+' si gira e calcia!','chance',1,
       'Conclusione di '+SN(P.sh)+' '+_zn+' per '+TN(t)+'!','chance');
  rtDoShot(P,false);
}
function rtFreeShot(){
  var R=rtState(), t=R.t, o=opp(t), sh=R.carrier, gk=gkOf(o);
  var prog=rtProg(R.cx,t);
  t.shots++; sh.shots++;
  var xg=cl(0.042+Math.max(0,sh.sho-70)/700+(prog-0.6)*0.12,0.010,0.20);
  t.xg+=xg;
  var out, r=Math.random();
  if(r<xg) out='goal';
  else { var r2=Math.random(); out=(r2<0.32)?'save':((r2<0.42)?'post':((r2<0.78)?'off':'block')); }
  say2(SN(sh)+' prova la conclusione dalla distanza!','chance',0.9,
       'Tiro di '+SN(sh)+' da fuori area per '+TN(t)+'.','chance');
  rtDoShot({t:t,o:o,sh:sh,as:null,out:out,gk:gk,min:M.min},true);
}
function rtCross(fromCorner){
  var R=rtState(), t=R.t, o=opp(t), c=R.carrier;
  var box=alive(t).filter(function(p){ return p!==c&&p.g!=='POR'&&tokOf(p)&&(p.g==='ATT'||p.g==='CEN'||fromCorner); });
  if(!box.length){ rtPass(); return; }
  var tgt=wpick(box,function(p){ return (p.g==='ATT')?3.4:((p.g==='CEN')?1.3:0.8)*(0.6+p.phy/140); });
  R.mode='cross'; R.rcv=tgt; R.lose=false; R.air=true;
  R.bx=atkX(t,rr(0.85,0.95)); R.by=cl(rr(37,63),18,82);
  say2('Cross di '+SN(c)+' in mezzo!','cross',0.75,
       TN(t)+': cross di '+SN(c)+', '+SN(tgt)+' attacca l\'area.','info');
  R.onArrive=function(){ rtHeader(t,o,c,tgt); };
}
function rtHeader(t,o,crosser,sh){
  var R=rtState();
  var df=nearestTok(o,R.bx,R.by,null,false);
  var aP=(sh.phy*0.45+sh.sho*0.35+sh.rate*0.20);
  var dP=df?(df.p.phy*0.5+df.p.def*0.5):62;
  if(Math.random()<cl(0.40+(aP-dP)/165,0.14,0.72)){
    t.shots++; sh.shots++;
    var xg=cl(0.082+Math.max(0,sh.sho-66)/520,0.025,0.24); t.xg+=xg;
    var out, r=Math.random();
    if(r<xg) out='goal';
    else { var r2=Math.random(); out=(r2<0.34)?'save':((r2<0.44)?'post':((r2<0.80)?'off':'block')); }
    say2('Stacca '+SN(sh)+' di testa!','chance',1,
         'Colpo di testa di '+SN(sh)+' sul cross di '+SN(crosser)+'!','chance');
    rtDoShot({t:t,o:o,sh:sh,as:crosser,out:out,gk:gkOf(o),min:M.min},true);
  } else {
    var d=df?df.p:gkOf(o);
    addRating(d,0.07);
    say2('Respinge di testa '+SN(d)+'.','tackle',0.35,
         'Cross di '+SN(crosser)+' allontanato dalla difesa di '+TN(o)+'.','info');
    if(Math.random()<0.45){ t.corners++; rtSet('corner',t,atkX(t,0.985),(Math.random()<0.5)?4:96,null,10); }
    else rtLoose(cl(R.bx-((t===M.userT)?1:-1)*rr(8,16),6,94), cl(R.by+rr(-14,14),8,92));
  }
}
/* palla vagante: la raccoglie il piu' vicino */
function rtLoose(x,y){
  var R=rtState();
  R.mode='loose'; R.rcv=null; R.plan=null; R.air=false;
  R.bx=cl(x,4,96); R.by=cl(y,5,95);
  R.onArrive=function(){
    var a=nearestTok(M.homeT,R.bx,R.by,null,true), b=nearestTok(M.awayT,R.bx,R.by,null,true);
    var w=(!a)?b:((!b)?a:((a.d<=b.d)?a:b));
    if(!w){ rtRestart(M.homeT,'loose'); return; }
    rtGive(w.tk.t,w.p,w.tk.x,w.tk.y);
    if(Math.random()<0.30) say2('Palla vagante raccolta da '+SN(w.p)+'.','pass',0.25,
      SN(w.p)+' si avventa sulla palla vagante e riparte per '+TN(w.tk.t)+'.','info');
  };
}

/* ------------------------------------------------------ falli e cartellini */
function rtFoul(tAtt,tDef,f,victim,x,y){
  var R=rtState();
  tDef.fouls++; addRating(f,-0.10);
  R.lastFoul=M.min;
  var inBox=(rtProg(x,tAtt)>0.82&&y>26&&y<74);
  var cardR=0.19; try{ cardR=0.18*lines(tDef).mo.card; }catch(e){}
  if(inBox) cardR=Math.min(0.85,cardR*2.4);
  if(Math.random()<cardR){
    if(f.yc>=1&&Math.random()<0.26){
      f.rc=true; tDef.rc++; addRating(f,-1.6);
      say2('ROSSO per '+SN(f)+'!','red',1,say(pick(C.red),tDef,f),'red');
      try{ flash('ROSSO',sur(f.name)); }catch(e){}
      setTimeout(function(){ try{ if(M&&M.root&&!M.done) buildTokens(); }catch(e){} },260);
    } else {
      f.yc++; tDef.yc++; addRating(f,-0.35);
      say2('Ammonito '+SN(f)+'.','card',1,say(pick(C.yellow),tDef,f),'card');
    }
  } else {
    say2('Fallo di '+SN(f)+' su '+SN(victim)+'.','foul',0.45,say(pick(C.foul),tDef,f),'info');
  }
  if(inBox){ rtSet('penalty',tAtt,atkX(tAtt,0.885),50,null,14); return; }
  rtSet('freekick',tAtt,cl(x,6,94),cl(y,7,93),null,6);
}

/* ------------------------------------------------------- palle inattive */
function rtSet(kind,team,x,y,taker,wait){
  var R=rtState();
  R.mode='set'; R.plan=(kind==='penalty')?null:R.plan; R.rcv=null; R.lose=false; R.onArrive=null; R.air=false;
  R.t=team; R.hold=0; R.lastSet=M.min;
  R.set={kind:kind,team:team,x:cl(x,2,98),y:cl(y,2,98),taker:taker||null};
  R.wait=Math.max(4,Math.round((wait||8)/Math.max(0.8,effSpeed()*0.7)));
  rtAssignSet(R.set);
  ballSet(R.set.x,R.set.y,300,'ease');
  var sp=R.set;
  if(kind==='corner') say2('Corner per '+TL(team)+': batte '+SN(sp.taker)+', tutti in area.','corner',0.8,
      'Calcio d\'angolo per '+TN(team)+': '+SN(sp.taker)+' sulla bandierina.','info');
  else if(kind==='throw') say2('Rimessa laterale per '+TL(team)+'.','pass',0.3,
      'Rimessa laterale per '+TN(team)+', batte '+SN(sp.taker)+'.','info');
  else if(kind==='goalkick') say2('Rinvio dal fondo di '+SN(sp.taker)+'.','pass',0.15,
      'Rinvio dal fondo per '+TN(team)+'.','info');
  else if(kind==='freekick') say2('Punizione per '+TL(team)+': sulla palla '+SN(sp.taker)+'.','pass',0.4,
      'Punizione per '+TN(team)+' '+rtZoneName(team,sp.x)+': batte '+SN(sp.taker)+'.','info');
  else if(kind==='penalty') say2('RIGORE per '+TL(team)+'! Sul dischetto '+SN(sp.taker)+'.','chance',1,
      'CALCIO DI RIGORE per '+TN(team)+': se ne incarica '+SN(sp.taker)+'.','chance');
}
function rtPickTaker(kind,team,x,y){
  var pool=alive(team).filter(function(p){ return tokOf(p); });
  if(!pool.length) return null;
  if(kind==='goalkick'){ var g=gkOf(team); return g||pool[0]; }
  if(kind==='penalty'){
    var out=pool.filter(function(p){ return p.g!=='POR'; });
    if(!out.length) out=pool;
    return wpick(out,function(p){ return Math.pow(Math.max(30,p.sho)/60,2.6)*((p.g==='ATT')?2.2:1); });
  }
  if(kind==='corner'||kind==='freekick'){
    var o2=pool.filter(function(p){ return p.g!=='POR'; });
    if(!o2.length) o2=pool;
    return wpick(o2,function(p){ return Math.pow(Math.max(30,p.pas)/60,2.2)*((p.g==='CEN')?1.6:1); });
  }
  /* rimessa: il piu' vicino */
  var best=null,bd=1e9;
  pool.forEach(function(p){ if(p.g==='POR') return; var tk=tokOf(p); var d=pdist(tk.x,tk.y,x,y); if(d<bd){bd=d;best=p;} });
  return best||pool[0];
}
function rtAssignSet(sp){
  rtClearOv();
  var t=sp.team, o=opp(t), own=(t===M.userT)?1:-1;
  if(!sp.taker) sp.taker=rtPickTaker(sp.kind,t,sp.x,sp.y);
  var atk=alive(t).filter(function(p){ return tokOf(p)&&p!==sp.taker; });
  var def=alive(o).filter(function(p){ return tokOf(p); });
  var tk=tokOf(sp.taker);
  if(tk) tk.ov={x:cl(sp.x-own*(sp.kind==='penalty'?7:2.2),3,97),y:cl(sp.y+(sp.kind==='penalty'?0:1.5),4,96)};

  /* portiere della squadra che difende: sulla linea */
  var gkD=gkOf(o), gtk=gkD?tokOf(gkD):null;
  if(gtk&&(sp.kind==='corner'||sp.kind==='penalty'||sp.kind==='freekick')){
    gtk.ov={x:atkX(t,0.985),y:50+((sp.kind==='corner')?rr(-4,4):0)};
  }

  if(sp.kind==='corner'){
    var boxA=atk.filter(function(p){ return p.g!=='POR'; }).slice(0,7);
    boxA.forEach(function(p,i){
      var tkk=tokOf(p); if(!tkk) return;
      if(i<5) tkk.ov={x:atkX(t,rr(0.84,0.95)),y:cl(36+i*7+rr(-3,3),24,76)};
      else tkk.ov={x:atkX(t,rr(0.60,0.70)),y:cl(50+rr(-16,16),20,80)};
    });
    def.forEach(function(p,i){
      var tkk=tokOf(p); if(!tkk||p===gkD) return;
      if(i<7) tkk.ov={x:atkX(t,rr(0.86,0.955)),y:cl(34+i*6+rr(-3,3),22,78)};
      else tkk.ov={x:atkX(t,rr(0.62,0.72)),y:cl(50+rr(-18,18),18,82)};
    });
    return;
  }
  if(sp.kind==='penalty'){
    atk.forEach(function(p,i){
      var tkk=tokOf(p); if(!tkk) return;
      if(p.g==='POR'){ tkk.ov={x:atkX(t,-0.90),y:50}; return; }
      tkk.ov={x:atkX(t,rr(0.60,0.68)),y:cl(18+i*8,10,90)};
    });
    def.forEach(function(p,i){
      var tkk=tokOf(p); if(!tkk||p===gkD) return;
      tkk.ov={x:atkX(t,rr(0.58,0.66)),y:cl(14+i*8,8,92)};
    });
    return;
  }
  if(sp.kind==='freekick'){
    var prg=rtProg(sp.x,t), dang=(prg>0.45);
    /* barriera */
    var wall=def.filter(function(p){ return p!==gkD; }).slice(0,dang?4:2);
    wall.forEach(function(p,i){
      var tkk=tokOf(p); if(!tkk) return;
      tkk.ov={x:cl(sp.x+own*8.5,3,97),y:cl(sp.y-4.5+i*3,5,95)};
    });
    def.filter(function(p){ return p!==gkD&&wall.indexOf(p)<0; }).forEach(function(p,i){
      var tkk=tokOf(p); if(!tkk) return;
      tkk.ov=dang?{x:atkX(t,rr(0.84,0.93)),y:cl(34+i*7,20,80)}:null;
    });
    atk.forEach(function(p,i){
      var tkk=tokOf(p); if(!tkk||p.g==='POR') return;
      if(dang&&i<5) tkk.ov={x:atkX(t,rr(0.80,0.90)),y:cl(36+i*7,22,78)};
    });
    return;
  }
  if(sp.kind==='goalkick'){
    atk.forEach(function(p){
      var tkk=tokOf(p); if(!tkk) return;
      var d=tkk.dep||0.5;
      tkk.ov={x:cl(atkX(t,-0.72+d*1.05),4,96),y:cl(50+(tkk.fx-50)*1.05,6,94)};
    });
    return;
  }
  if(sp.kind==='throw'){
    var near=atk.filter(function(p){ return p.g!=='POR'; }).slice(0,4);
    near.forEach(function(p,i){
      var tkk=tokOf(p); if(!tkk) return;
      tkk.ov={x:cl(sp.x+own*(4+i*5)+rr(-3,3),4,96),y:cl(sp.y+((sp.y<50)?(9+i*6):-(9+i*6)),6,94)};
    });
    return;
  }
}
function rtSetBall(ms){ var R=M.rt; if(R&&R.set) ballSet(R.set.x,R.set.y,ms,'linear'); }
function rtSetTick(){
  var R=rtState();
  R.wait=(R.wait||0)-1;
  var sp=R.set;
  if(!sp){ R.mode='carry'; return; }
  if(R.wait>0) return;
  var t=sp.team, o=opp(t), kind=sp.kind, taker=sp.taker;
  if(!taker||!tokOf(taker)){ R.set=null; rtClearOv(); rtRestart(t,'set'); return; }
  if(kind==='penalty'){ rtPenExec(); return; }
  R.set=null; rtClearOv();
  rtGive(t,taker,sp.x,sp.y);
  if(kind==='corner'){ R.hold=1; rtCross(true); return; }
  if(kind==='goalkick'){ rtGkDistribute(); return; }
  if(kind==='freekick'){
    var prg=rtProg(sp.x,t);
    if(prg>0.55&&Math.random()<0.55){ rtFreeKickShot(t,o,taker,sp); return; }
    if(prg>0.35){ R.hold=1; rtCross(true); return; }
    rtPass(); return;
  }
  rtPass();
}
function rtFreeKickShot(t,o,sh,sp){
  var R=rtState();
  t.shots++; sh.shots++;
  var xg=cl(0.05+Math.max(0,sh.sho-70)/700,0.015,0.16); t.xg+=xg;
  var out, r=Math.random();
  if(r<xg) out='goal';
  else { var r2=Math.random(); out=(r2<0.30)?'save':((r2<0.40)?'post':((r2<0.80)?'off':'block')); }
  say2('Punizione battuta da '+SN(sh)+': tiro diretto in porta!','chance',1,
       'Calcia direttamente '+SN(sh)+' su punizione per '+TN(t)+'.','chance');
  rtDoShot({t:t,o:o,sh:sh,as:null,out:out,gk:gkOf(o),min:M.min},true);
}
function rtPenExec(){
  var R=rtState(), sp=R.set; if(!sp){ R.mode='carry'; return; }
  var t=sp.team, o=opp(t), sh=sp.taker, gk=gkOf(o);
  R.set=null; rtClearOv();
  t.shots++; sh.shots++; t.xg+=0.76;
  var pG=cl(0.79+(sh.sho-72)/300-((gk?gk.rate:74)-74)/330,0.55,0.94);
  var scored=Math.random()<pG;
  var out=scored?'goal':((Math.random()<0.62)?'save':'off');
  say2(SN(sh)+' prende la rincorsa...','chance',1,
       'Sul dischetto va '+SN(sh)+': tutto lo stadio trattiene il fiato.','chance');
  rtDoShot({t:t,o:o,sh:sh,as:null,out:out,gk:gk,min:M.min},true);
}
function rtThrow(tLost,x,y,loser,winner){
  var team=opp(tLost);
  say2('Palla sul fondo: rimessa per '+TL(team)+'.','pass',0.3,
       SN(loser)+' perde il pallone sulla linea laterale: rimessa per '+TN(team)+'.','info');
  rtSet('throw',team,cl(x,4,96),(y<50)?3:97,null,7);
}

/* --------------------------------------------------------- ripartenze */
function rtRestart(team,from){
  var R=rtState(); if(!team) return;
  R.plan=null; R.set=null; R.onArrive=null; R.lose=false; rtClearOv();
  if(from==='save'){
    var g=gkOf(team);
    rtGive(team,g);
    R.holdMax=2;
    return;
  }
  if(from==='off'||from==='post'){
    rtSet('goalkick',team,atkX(team,-0.86),50,gkOf(team),8);
    return;
  }
  if(from==='block'){
    var o2=opp(team);
    if(Math.random()<0.45){ o2.corners++; rtSet('corner',o2,atkX(o2,0.985),(Math.random()<0.5)?4:96,null,10); }
    else rtLoose(atkX(team,-0.60),rr(25,75));
    return;
  }
  if(from==='offside'){
    var d=alive(team).filter(function(x2){ return x2.g==='DIF'&&tokOf(x2); });
    rtSet('freekick',team,atkX(team,-0.55),rr(25,75),d.length?pick(d):null,6);
    return;
  }
  var pool=alive(team).filter(function(x2){ return x2.g==='DIF'&&tokOf(x2); });
  if(!pool.length) pool=alive(team).filter(function(x2){ return x2.g!=='POR'&&tokOf(x2); });
  if(!pool.length) pool=alive(team);
  rtGive(team,pool.length?pick(pool):null);
}
function rtCornerSet(t,taker){
  t.corners=t.corners||0;
  rtSet('corner',t,atkX(t,0.985),(Math.random()<0.5)?4:96,taker||null,10);
}
function rtKickoff(team){
  var R=rtState();
  R.plan=null; R.set=null; R.onArrive=null; R.lose=false; rtClearOv();
  var c=alive(team).filter(function(x){ return x.g==='CEN'&&tokOf(x); });
  if(!c.length) c=alive(team).filter(function(x){ return x.g==='ATT'&&tokOf(x); });
  var p=c.length?pick(c):(alive(team)[0]||null);
  var own=(team===M.userT)?1:-1;
  R.t=team; R.carrier=p; R.rcv=null; R.mode='ko'; R.hold=0; R.holdMax=ri(2,4);
  R.koWait=Math.max(3,Math.round(5/Math.max(1,effSpeed()*0.6)));
  R.cx=50-own*1.8; R.cy=50;
  var tk=tokOf(p);
  if(tk){ tk.x=R.cx; tk.y=R.cy; tk.el.style.transition='left 320ms ease, top 320ms ease'; tk.el.style.left=tk.x+'%'; tk.el.style.top=tk.y+'%'; }
  ballSet(50,50,240,'linear');
  focusTok(p,'act');
  if(p) say2('Calcio d\'inizio: batte '+SN(p)+' per '+TL(team)+'.','pass',1,
      'Si riparte dal centrocampo: batte '+TN(team)+' con '+SN(p)+'.','phase');
}
function rtKickWait(){
  var R=rtState();
  R.koWait=(R.koWait||0)-1;
  ballSet(50,50,rtFrame(),'linear');
  if(R.koWait<=0){ R.mode='carry'; R.hold=99; rtPass(); }
}
function rtAttack(t,o,sh,as,out,gk,min){
  var R=rtEnsure();
  if(R.mode==='set'||R.mode==='shot'){ /* aspetta: l'azione parte dopo */ }
  R.plan={t:t,o:o,sh:sh,as:as,out:out,gk:gk,min:min,hold:ri(1,3),asDone:false,
    minPr:(out==='goal'?rr(0.80,0.90):rr(0.74,0.88))};
  var ctk=tokOf(R.carrier);
  if(!ctk||ctk.t!==t||R.mode==='loose'){
    var pool=alive(t).filter(function(p){ return (p.g==='CEN'||p.g==='DIF')&&tokOf(p); });
    if(!pool.length) pool=alive(t).filter(function(p){ return tokOf(p); });
    R.t=t; R.carrier=pool.length?pick(pool):sh; R.rcv=null;
    if(R.mode!=='set') R.mode='carry';
    R.hold=0;
    var tk=tokOf(R.carrier); R.cx=tk?tk.x:50; R.cy=tk?tk.y:50;
  } else { R.t=t; if(R.mode!=='pass'&&R.mode!=='set'&&R.mode!=='shot') R.mode='carry'; }
  R.lose=false;
}
function rtFlush(instant){
  var R=M.rt; if(!R) return;
  if(R.plan){
    var P=R.plan;
    if(instant||M.view!=='pitch'||!M.tokens||!M.tokens.length){ R.plan=null; try{ resolveShot(P.t,P.o,P.sh,P.as,P.min,P.out,P.gk); }catch(e){} return; }
    R.set=null; rtClearOv();
    R.carrier=P.sh; R.rcv=null; R.mode='carry'; R.hold=0;
    var tk=tokOf(P.sh);
    if(tk){ R.cx=tk.x; R.cy=tk.y; }
    rtShoot();
    return;
  }
  if(R.onArrive){ var f=R.onArrive; R.onArrive=null; try{ f(); }catch(e){} }
}

/* ------------------------------------------------------------ un frame */
function rtFlight(ms){
  var R=rtState();
  var tx=R.bx, ty=R.by;
  if((R.mode==='pass')&&R.rcv){
    var rk=tokOf(R.rcv);
    if(rk){ var ow=(rk.t===M.userT)?1:-1; tx=rk.x+ow*0.95; ty=rk.y+0.55; }
  }
  var b=ballObj(), dx=tx-b.x, dy=ty-b.y, d=Math.sqrt(dx*dx+dy*dy)||0.0001;
  var sp=(R.mode==='shot')?rr(10,13.5):((R.mode==='cross')?rr(5.2,6.8):((R.mode==='loose')?rr(3,4.5):rr(5,7)));
  if(d<=sp){
    ballSet(tx,ty,ms,'linear');
    if(R.mode==='pass'){
      var was=R.lose;
      var ntk=tokOf(R.rcv);
      var nt=ntk?ntk.t:R.t;
      var np=R.rcv;
      R.rcv=null;
      rtGive(nt,np,ntk?ntk.x:tx,ntk?ntk.y:ty);
      if(was){ R.plan=null; }
    } else if(R.mode==='cross'||R.mode==='loose'){
      R.mode='wait'; R.wait=1;
      var fn2=R.onArrive; R.onArrive=null; if(fn2) fn2();
    } else {
      R.mode='wait'; R.wait=2;
      var fn=R.onArrive; R.onArrive=null; if(fn) fn();
    }
  } else {
    ballSet(b.x+dx/d*sp,b.y+dy/d*sp,ms,'linear');
  }
}
function rtStep(){
  var ms=rtFrame(), R=rtEnsure();
  if(M.done) return;
  var m=R.mode;
  if(m==='set') rtSetTick();
  else if(m==='pass'||m==='shot'||m==='cross'||m==='loose') rtFlight(ms);
  else if(m==='ko') rtKickWait();
  else if(m==='wait'){ R.wait=(R.wait||0)-1; if(R.wait<=0){ R.mode='carry'; R.hold=0; } }
  else rtCarry();
  tokTargets(); tokMove(ms);
  var m2=rtState().mode;
  if(m2==='carry') rtFoot(ms);
  else if(m2==='ko') ballSet(50,50,ms,'linear');
  else if(m2==='set') rtSetBall(ms);
}
function caption(html,kind){
  var c=document.getElementById('fmx-cap'); if(!c) return;
  c.className='fmx-cap'+(kind?' '+kind:'');
  c.innerHTML='<i>'+esc(M.minLabel())+'</i>'+html;
  void c.offsetWidth; c.classList.add('on');
}
function focusTok(p,kind){
  if(!M.tokens) return;
  M.tokens.forEach(function(tk){
    tk.el.classList.remove('act','sc');
    if(p&&tk.p===p) tk.el.classList.add(kind==='goal'?'sc':'act');
  });
}
function netFlash(t){
  var pt=document.getElementById('fmx-pitch'); if(!pt) return;
  var side=(t===M.userT)?'r':'l';
  var n=pt.querySelector('.net.'+side); if(!n) return;
  n.classList.add('on'); setTimeout(function(){ n.classList.remove('on'); },1800);
  pt.classList.remove('shake'); void pt.offsetWidth; pt.classList.add('shake');
  setTimeout(function(){ pt.classList.remove('shake'); },700);
}
function celebrate(t,scorer,ass){
  var ov=document.getElementById('fmx-goal'); if(!ov||!scorer) return;
  try{
  var col=(t.kit&&t.kit.s)||'#00D26A';
  var conf='';
  for(var i=0;i<34;i++){
    conf+='<i style="left:'+ri(1,99)+'%;background:'+((i%3)?col:'#ffffff')+';animation-delay:'+(Math.random()*0.6).toFixed(2)+'s;height:'+ri(10,18)+'px"></i>';
  }
  ov.style.setProperty('--gc',col);
  ov.innerHTML='<div class="bg"></div><div class="rays"></div><div class="cf">'+conf+'</div>'+
    '<div class="gbox" style="--gc:'+col+'">'+
      '<div class="gtxt"><s>G</s><s>O</s><s>O</s><s>L</s></div>'+
      '<div class="gwho">'+face(scorer,56)+'<div><b>'+esc(scorer.name)+'</b><em>'+esc(t.name)+' &middot; '+esc(M.minLabel())+(ass?' &middot; assist '+esc(sur(ass.name)):'')+'</em></div></div>'+
      '<div class="gsc">'+esc(shortNm(M.homeT.name))+'<b>'+M.homeT.goals+' - '+M.awayT.goals+'</b>'+esc(shortNm(M.awayT.name))+'</div>'+
    '</div>';
  ov.classList.add('on');
  clearTimeout(M.goalT);
  M.goalT=setTimeout(function(){ ov.classList.remove('on'); ov.innerHTML=''; },3000);
  }catch(e){ ov.classList.remove('on'); ov.innerHTML=''; }
}

/* ------------------------------------------------------------------ UI */
function flash(big,sub){
  var f=document.getElementById('fmx-flash'); if(!f) return;
  f.innerHTML='<div class="b">'+esc(big)+'</div><div class="s">'+esc(sub||'')+'</div>';
  f.classList.add('on'); clearTimeout(M.flashT);
  M.flashT=setTimeout(function(){ f.classList.remove('on'); },1500);
}
function statRow(label,a,b,fmtFn){
  var A=num(a,0),B=num(b,0), tot=A+B||1, pa=Math.round(A/tot*100);
  var f=fmtFn||function(v){ return Math.round(v); };
  return '<div class="fmx-stat"><div class="lb"><b>'+f(A)+'</b><i>'+esc(label)+'</i><b>'+f(B)+'</b></div>'+
    '<div class="fmx-bar"><u style="width:'+pa+'%;background:'+M.homeT.kit.s+'"></u><u style="width:'+(100-pa)+'%;background:'+M.awayT.kit.s+'"></u></div></div>';
}
function renderStats(){
  var el=document.getElementById('fmx-stats'); if(!el) return;
  var H=M.homeT,A=M.awayT, tot=H.posT+A.posT||1, ph=Math.round(H.posT/tot*100);
  el.innerHTML='<div class="fmx-h">Statistiche <em>Live</em></div>'+
    statRow('Possesso %',ph,100-ph)+statRow('Tiri',H.shots,A.shots)+statRow('In porta',H.onT,A.onT)+
    statRow('xG',H.xg,A.xg,function(v){return two(v);})+statRow('Corner',H.corners,A.corners)+
    statRow('Falli',H.fouls,A.fouls)+statRow('Fuorigioco',H.offside,A.offside)+
    statRow('Ammonizioni',H.yc,A.yc)+
    statRow('Precisione pass. %',H.passes?Math.round(H.passOk/H.passes*100):0,A.passes?Math.round(A.passOk/A.passes*100):0);
}
function plRow(p){
  var tag=(p.goals?' <small style="color:#7BE3A8">'+(p.goals>1?p.goals+'x ':'')+'GOL</small>':'')+
          (p.ass?' <small style="color:#5E9FE8">'+p.ass+'A</small>':'')+
          (p.yc?' <small style="color:#EAC26B">AMM</small>':'')+
          (p.rc?' <small style="color:#E97366">ROSSO</small>':'')+
          (p.out?' <small>'+p.outMin+'\'</small>':'');
  var stc=p.stam>66?'#46A171':(p.stam>38?'#EAC26B':'#E97366');
  return '<div class="fmx-pl'+((p.out||p.rc)?' gone':'')+'"><span class="ps">'+esc(p.role)+'</span>'+face(p,26)+
    '<span class="pn">'+esc(p.name)+tag+'</span>'+
    '<span class="st"><u style="width:'+Math.round(p.stam)+'%;background:'+stc+'"></u></span>'+
    '<span class="rt" style="color:'+ratCol(p.rating)+'">'+one(p.rating)+'</span></div>';
}
function board(t){
  var f=t.form, out=['<div class="fmx-board"><div class="ln" style="left:6px;right:6px;top:50%;height:1px"></div>'];
  for(var i=0;i<11;i++){
    var p=t.players[i]; if(!p) continue;
    var sx=(f&&f[i]&&f[i].x!=null)?f[i].x:[50,20,38,62,80,50,34,66,20,80,50][i];
    var sy=(f&&f[i]&&f[i].y!=null)?f[i].y:[95,80,84,84,80,62,58,58,36,36,18][i];
    out.push('<div class="fmx-dot" style="left:'+cl(sx,9,91)+'%;top:'+cl(sy,10,90)+'%;--dc:'+(p.g==='POR'?'#EAC26B':t.kit.s)+'">'+
      face(p,26)+'<b>'+esc(sur(p.name))+'</b></div>');
  }
  out.push('</div>');
  return out.join('');
}
function renderSquads(){
  var el=document.getElementById('fmx-squads'); if(!el) return;
  var t=M.sqTab==='opp'?M.oppT:M.userT;
  var bench='';
  if(t.isUser&&t.bench.length){
    bench='<div class="fmx-h" style="margin:14px 0 8px">Panchina <em>'+(5-t.subs)+' cambi</em></div>'+
      t.bench.map(function(p){ return '<div class="fmx-pl"><span class="ps">'+esc(p.role)+'</span>'+face(p,26)+'<span class="pn">'+esc(p.name)+'</span><span class="st"></span><span class="rt" style="color:#8A9AAC">'+Math.round(p.rate)+'</span></div>'; }).join('');
  }
  el.innerHTML='<div class="fmx-sw"><button data-a="sq" data-v="own" class="'+(M.sqTab!=='opp'?'on':'')+'">'+esc(M.userT.name)+'</button>'+
    '<button data-a="sq" data-v="opp" class="'+(M.sqTab==='opp'?'on':'')+'">'+esc(M.oppT.name)+'</button></div>'+
    '<div class="fmx-h">Disposizione <em>'+esc((t.isUser&&M.userT.tac.form)||'')+'</em></div>'+board(t)+
    '<div class="fmx-h" style="margin:14px 0 8px">Pagelle</div><div class="fmx-lineup">'+t.players.map(plRow).join('')+'</div>'+bench;
}
function renderKeys(){
  var el=document.getElementById('fmx-keys'); if(!el) return;
  var best=[].concat(M.homeT.players,M.awayT.players).sort(function(a,b){ return b.rating-a.rating; }).slice(0,5);
  el.innerHTML='<div class="fmx-h">Migliori in campo</div>'+best.map(function(p){
    return '<div class="fmx-pl"><span class="ps">'+esc(p.role)+'</span>'+face(p,26)+'<span class="pn">'+esc(p.name)+'</span><span class="st"></span><span class="rt" style="color:'+ratCol(p.rating)+'">'+one(p.rating)+'</span></div>';
  }).join('');
}
function renderFeed(){
  var el=document.getElementById('fmx-feed'); if(!el) return;
  el.innerHTML=M.events.map(function(e){
    return '<div class="fmx-ev '+e.type+'"><span class="mn">'+esc(e.min)+'</span><span class="tx">'+e.html+'</span></div>';
  }).join('');
}
function renderTop(){
  var s=document.getElementById('fmx-gg'); if(s) s.textContent=M.homeT.goals+' - '+M.awayT.goals;
  var c=document.getElementById('fmx-clk'); if(c) c.textContent=M.minLabel();
  var ph=document.getElementById('fmx-phase'); if(ph) ph.textContent=M.phaseLabel();
}

/* -------------------------------------------------------------- pitch 2D */
/* slot tattico -> (fx = corsia 0..100, dep = profondita' 0 portiere .. 1 punta) */
function slotOf(t,i){
  var f=t.form;
  var fx=(f&&f[i]&&f[i].x!=null)?f[i].x:[50,18,38,62,82,30,50,70,22,50,78][i];
  var fy=(f&&f[i]&&f[i].y!=null)?f[i].y:[88,67,73,73,67,48,58,48,24,15,24][i];
  return { fx:cl(fx,6,94), dep:cl((90-fy)/76,0,1) };
}
function tokenBase(t,p,i){
  var s=slotOf(t,i), own=(t===M.userT)?1:-1;
  var u=6+s.dep*44;
  return { x:cl((own===1)?u:100-u,4,96), y:cl(s.fx,6,94), fx:s.fx, dep:s.dep };
}
/* forma di squadra: linea difensiva + lunghezza del blocco, in base alla palla */
function teamShape(t){
  var b=ballObj(), R=M.rt||{}, T=t.tac||{};
  var own=(t===M.userT)?1:-1;
  var bu=(own===1)?b.x:(100-b.x);             /* 0 = propria porta, 100 = porta avversaria */
  var hasBall=(R.t===t);
  var lineAdj=[-6,0,6][(T.line==null)?1:T.line]||0;
  var wid=[0.84,1,1.16][(T.width==null)?1:T.width]||1;
  var ment=[0.90,0.95,1,1.05,1.10][(T.ment==null)?2:T.ment]||1;
  var dl=cl(bu*0.55+(hasBall?9:2)+lineAdj,5,hasBall?62:50)*ment;
  var blk=hasBall?cl(40+(bu-50)/7,36,47):33;
  dl=cl(dl,4,64);
  var backU=dl+0.22*blk;                       /* ultimo difensore, non il portiere */
  return { own:own, bu:bu, hasBall:hasBall, dl:dl, blk:blk, wid:wid, bx:b.x, by:b.y,
           backU:backU, backX:(own===1)?backU:(100-backU) };
}
function buildTokens(){
  var wrap=document.getElementById('fmx-pitch'); if(!wrap) return;
  wrap.innerHTML='<div class="glow"></div><div class="lines"></div><div class="half"></div><div class="circ"></div><div class="spot"></div>'+
    '<div class="box l"></div><div class="box r"></div><div class="box6 l"></div><div class="box6 r"></div>'+
    '<div class="pk l"></div><div class="pk r"></div><div class="arc l"></div><div class="arc r"></div>'+
    '<div class="gpost l"></div><div class="gpost r"></div>'+
    '<div class="net l"></div><div class="net r"></div>'+
    '<div class="fmx-ball" id="fmx-ball" style="left:'+ballObj().x+'%;top:'+ballObj().y+'%"></div>'+
    '<div class="fmx-cap" id="fmx-cap"></div>';
  M.tokens=[];
  [M.homeT,M.awayT].forEach(function(t){
    alive(t).forEach(function(p,i0){
      var i=t.players.indexOf(p); if(i<0) i=i0;
      var b=tokenBase(t,p,i);
      var d=document.createElement('div');
      d.className='fmx-tok'+(p.g==='POR'?' gk':'')+((t===M.userT)?' us':'');
      d.style.setProperty('--c',t.kit.s);
      d.style.left=b.x+'%'; d.style.top=b.y+'%';
      d.innerHTML=face(p,(t===M.userT)?22:20)+'<b>'+esc(sur(p.name))+'</b>';
      wrap.appendChild(d);
      M.tokens.push({el:d,p:p,t:t,fx:b.fx,dep:b.dep,bx:b.x,by:b.y,x:b.x,y:b.y,tx:b.x,ty:b.y,ov:null});
    });
  });
  tokTargets(); tokSnap();
  rtEnsure();
  if(M.rt&&M.rt.mode!=='ko'&&M.rt.mode!=='set') rtFoot(200);
  rtStart();
  var last=M.events&&M.events.length?M.events[0]:null;
  if(last) caption(last.html,last.type);
}
function tokTargets(){
  if(!M.tokens||!M.tokens.length) return;
  var b=ballObj(), R=M.rt||{};
  var SU=teamShape(M.userT), SO=teamShape(M.oppT);
  var press=rtPressers();

  M.tokens.forEach(function(tk){
    var t=tk.t, g=tk.p.g, isU=(t===M.userT), S=isU?SU:SO, own=S.own;
    var x,y,u;

    if(tk.ov){                                     /* palle inattive: posizione assegnata */
      tk.tx=cl(tk.ov.x,2,98); tk.ty=cl(tk.ov.y,4,96);
      if(tk.x==null){ tk.x=tk.tx; tk.y=tk.ty; }
      return;
    }

    if(g==='POR'){
      u=cl(3.0+S.bu*0.085,2.4,15);
      x=(own===1)?u:(100-u);
      y=cl(50+(b.y-50)*0.34,32,68);
      if(R.carrier===tk.p){ x=R.cx; y=R.cy; }
      tk.tx=cl(x,2,98); tk.ty=cl(y,4,96);
      if(tk.x==null){ tk.x=tk.tx; tk.y=tk.ty; }
      return;
    }

    /* posizione di reparto: la squadra si muove a blocco */
    u=S.dl+tk.dep*S.blk;
    var lat=50+(tk.fx-50)*S.wid;
    var pull=S.hasBall?0.16:0.33;
    y=lat+(b.y-lat)*pull;

    if(S.hasBall){
      var prg=cl((S.bu-50)/40,0,1);
      if(prg>0){
        if(g==='ATT'){ u+=10*prg; y=y+(50-y)*0.42*prg+((tk.fx>50)?5:-5)*prg; }
        else if(g==='CEN'){ u+=6*prg; y=y+(50-y)*0.18*prg; }
        else if(g==='DIF'&&(tk.fx<28||tk.fx>72)){ u+=8*prg; }   /* terzini che spingono */
      }
    } else {
      var dfd=cl((50-S.bu)/40,0,1);
      if(dfd>0&&(g==='DIF'||g==='CEN')){
        y=lat+(b.y-lat)*(0.33+0.22*dfd);
        u-=2.5*dfd;
      }
      if(g==='ATT'&&dfd>0.4) u-=4*dfd;                            /* rientra a dare una mano */
    }
    x=(own===1)?u:(100-u);
    /* linea del fuorigioco: si gioca sul filo, mai oltre */
    var lim=isU?SO.backX:SU.backX;
    if(own===1) x=Math.min(x,lim+1.0); else x=Math.max(x,lim-1.0);

    if(R.carrier===tk.p){ x=R.cx; y=R.cy; }
    else if(R.rcv===tk.p&&(R.mode==='pass'||R.mode==='cross')){
      x=cl(x*0.30+R.bx*0.70,3,97);
      y=cl(y*0.30+R.by*0.70,4,96);
    }
    else if(press.indexOf(tk.p)>=0){
      var gx=(own===1)?0:100;                                     /* si mette lato porta */
      x=cl(b.x*0.84+gx*0.16,3,97);
      y=cl(b.y+(tk.fx-50)*0.05,4,96);
    }
    else if(!S.hasBall&&(g==='DIF'||g==='CEN')){
      /* marcatura: scivola sull'attaccante piu' vicino */
      var mk=nearestTok(opp(t),x,y,null,false);
      if(mk&&mk.d<20){
        y=cl(y+(mk.tk.y-y)*0.60,4,96);
        /* si scala all'indietro per coprire, non si sale sull'uomo */
        if((mk.tk.x-x)*own<0) x=cl(x+(mk.tk.x-x)*0.45,3,97);
      }
    }

    tk.tx=cl(x,2,98); tk.ty=cl(y,4,96);
    if(tk.x==null){ tk.x=tk.tx; tk.y=tk.ty; }
  });
  tokCoverLine();
  tokSpread();
}
/* --------------------------------------------------------------------------
   REGOLA CHIAVE DEL CALCIO: i difensori restano SEMPRE tra l'attaccante e la
   propria porta; nessun attaccante puo' stazionare oltre l'ultimo difensore
   (sarebbe fuorigioco). Si lavora in "proiezione": proj = x * direzione, dove
   proj piccolo = vicino alla propria porta.
   -------------------------------------------------------------------------- */
function tokCoverLine(){
  var T=M.tokens; if(!T||T.length<6) return;
  [M.userT,M.oppT].forEach(function(D){
    var dD=(D===M.userT)?1:-1, A=opp(D);
    var minProj=(dD===1)?2:-98;
    var def=[], att=[];
    T.forEach(function(k){
      if(k.ov||k.p.g==='POR') return;
      if(k.t===D) def.push(k); else if(k.t===A) att.push(k);
    });
    if(def.length<2||!att.length) return;
    var last=def[0], deep=att[0], i;
    for(i=1;i<def.length;i++) if(def[i].tx*dD<last.tx*dD) last=def[i];
    for(i=0;i<att.length;i++) if(att[i].tx*dD<deep.tx*dD) deep=att[i];
    /* 1. copertura: se l'attaccante piu' avanzato e' alle spalle della linea,
          tutto il reparto arretra per rimetterselo davanti */
    var gap=(last.tx*dD)-(deep.tx*dD-2.0);
    if(gap>0){
      var sh=Math.min(gap,8);
      def.forEach(function(k){
        var w=(k.p.g==='DIF')?1:((k.p.g==='CEN')?0.55:0.2);
        var pj=Math.max(minProj,k.tx*dD-sh*w);
        k.tx=cl(pj*dD,2,98);
      });
      last=def[0]; for(i=1;i<def.length;i++) if(def[i].tx*dD<last.tx*dD) last=def[i];
    }
    /* 2. fuorigioco: nessuno oltre l'ultimo difensore (tolleranza 1 = "sul filo") */
    var line=last.tx*dD-1.0;
    att.forEach(function(k){
      if(k.p===((M.rt||{}).carrier)) return;       /* chi ha la palla non e' in fuorigioco */
      if(k.tx*dD<line) k.tx=cl(line*dD,2,98);
    });
  });
}
/* evita che le pedine si sovrappongano */
function tokSpread(){
  var T=M.tokens; if(!T||T.length<2) return;
  var R=M.rt||{}, AR=2.0, MIN=7.4, it,i,j;
  for(it=0;it<3;it++){
    for(i=0;i<T.length;i++){
      for(j=i+1;j<T.length;j++){
        var a=T[i], c=T[j];
        var dx=(c.tx-a.tx)*AR, dy=(c.ty-a.ty);
        var d=Math.sqrt(dx*dx+dy*dy);
        if(d<0.001){ dx=(Math.random()<0.5?-1:1)*1.2; dy=(Math.random()<0.5?-1:1)*1.2; d=1.7; }
        if(d<MIN){
          var ux=dx/d, uy=dy/d, push=(MIN-d)/2;
          var aF=(R.carrier===a.p)||a.p.g==='POR'||a.ov, cF=(R.carrier===c.p)||c.p.g==='POR'||c.ov;
          var wa=aF?0:(cF?1:0.5), wc=cF?0:(aF?1:0.5);
          a.tx=cl(a.tx-ux*push*wa*2/AR,2,98); a.ty=cl(a.ty-uy*push*wa*2,4,96);
          c.tx=cl(c.tx+ux*push*wc*2/AR,2,98); c.ty=cl(c.ty+uy*push*wc*2,4,96);
        }
      }
    }
  }
}
function tokSnap(){
  if(!M.tokens) return;
  M.tokens.forEach(function(tk){
    tk.x=tk.tx; tk.y=tk.ty;
    tk.el.style.transition='left 340ms cubic-bezier(.3,.7,.3,1), top 340ms cubic-bezier(.3,.7,.3,1)';
    tk.el.style.left=tk.x+'%'; tk.el.style.top=tk.y+'%';
  });
}
function tokMove(ms){
  if(!M.tokens) return;
  var R=M.rt||{}, press=rtPressers();
  M.tokens.forEach(function(tk){
    var dx=tk.tx-tk.x, dy=tk.ty-tk.y, d=Math.sqrt(dx*dx+dy*dy);
    var p=tk.p, sp;
    if(R.carrier===p) sp=99;
    else if(R.rcv===p) sp=2.15;
    else if(press.indexOf(p)>=0) sp=2.20;
    else if(p.g==='ATT') sp=1.75;
    else if(p.g==='CEN') sp=1.60;
    else if(p.g==='POR') sp=1.00;
    else sp=1.50;
    sp*=(0.76+Math.min(96,p.pac||70)/300)*(0.86+(p.stam||100)/720);
    if(tk.ov) sp*=1.5;                                  /* si va in posizione in fretta */
    if(d>sp){
      tk.x+=dx/d*sp; tk.y+=dy/d*sp;
      tk.el.classList.add('run');
    } else {
      tk.x=tk.tx; tk.y=tk.ty;
      tk.el.classList.remove('run');
    }
    tk.el.style.transition='left '+ms+'ms linear, top '+ms+'ms linear';
    tk.el.style.left=tk.x+'%'; tk.el.style.top=tk.y+'%';
  });
}
function updateTokens(){
  tokTargets();
  if(!M.rtT) tokSnap();
}
function renderCenter(){
  var el=document.getElementById('fmx-viewbox'); if(!el) return;
  if(M.view==='pitch'){
    el.innerHTML='<div class="fmx-card fmx-pitchwrap"><div class="fmx-h">Campo <em>'+esc(M.userT.name)+' &rarr;</em></div>'+
      '<div class="fmx-pitch" id="fmx-pitch"></div></div>';
    buildTokens();
  } else {
    try{ rtFlush(true); }catch(e){}
    rtStop();
    el.innerHTML='<div class="fmx-card fmx-view"><div class="fmx-h">Diretta <em>minuto per minuto</em></div><div class="fmx-feed" id="fmx-feed"></div></div>';
    renderFeed();
  }
  var bs=M.root.querySelectorAll('[data-a="view"]');
  for(var i=0;i<bs.length;i++) bs[i].classList.toggle('on',bs[i].getAttribute('data-v')===M.view);
}
function renderBottom(){
  var el=document.getElementById('fmx-bot'); if(!el) return;
  var sp=(M.view==='pitch')?[1,2]:[1,2,4,8];
  if(M.view==='pitch'&&M.speed>2) M.speed=2;
  el.innerHTML='<button class="fmx-btn '+(M.paused?'go':'')+'" data-a="toggle">'+(M.paused?'▶ RIPRENDI':'❚❚ PAUSA')+'</button>'+
    '<button class="fmx-btn" data-a="tactics">⚙ TATTICA</button>'+
    (M.userT.bench.length?'<button class="fmx-btn" data-a="subs">⇄ CAMBI ('+(5-M.userT.subs)+')</button>':'')+
    '<button class="fmx-btn" data-a="skip">⏭ FINE PARTITA</button>'+
    '<div class="fmx-spd">'+sp.map(function(v){ return '<button class="fmx-btn '+(M.speed===v?'on':'')+'" data-a="spd" data-v="'+v+'">'+v+'x</button>'; }).join('')+(M.view==='pitch'?'<span class="fmx-spdn">campo &middot; max 2x</span>':'')+'</div>';
}
function renderAll(){ renderTop(); renderStats(); renderKeys(); renderSquads(); renderCenter(); renderOthers(); renderBottom(); }

function shell(cfg){
  var H=M.homeT,A=M.awayT;
  var ov=document.createElement('div'); ov.id='fm26';
  ov.innerHTML=
  '<div class="fmx-top">'+
    '<div class="fmx-comp"><b>'+esc(cfg.comp||'PARTITA')+'</b><span id="fmx-phase">Pre-partita</span></div>'+
    '<div class="fmx-score">'+
      '<div class="fmx-tm"><i class="kit" style="background:'+H.kit.s+'"></i>'+(H.logo?'<img src="'+esc(H.logo)+'" onerror="this.remove()">':'')+'<span class="nm">'+esc(H.name)+'</span><span class="nms">'+esc(shortNm(H.name))+'</span></div>'+
      '<div class="fmx-gg" id="fmx-gg">0 - 0</div>'+
      '<div class="fmx-tm r"><i class="kit" style="background:'+A.kit.s+'"></i>'+(A.logo?'<img src="'+esc(A.logo)+'" onerror="this.remove()">':'')+'<span class="nm">'+esc(A.name)+'</span><span class="nms">'+esc(shortNm(A.name))+'</span></div>'+
    '</div>'+
    '<div class="fmx-clock"><b id="fmx-clk">0\'</b><span>tempo</span></div>'+
    '<button class="fmx-x" data-a="quit" title="Abbandona">&times;</button>'+
  '</div>'+
  '<div class="fmx-tabs">'+
    '<button class="on" data-a="tab" data-v="center">Partita</button>'+
    '<button data-a="tab" data-v="stats">Statistiche</button>'+
    '<button data-a="tab" data-v="squads">Squadre</button>'+
  '</div>'+
  '<div class="fmx-main">'+
    '<div class="fmx-col" data-c="stats"><div class="fmx-card" id="fmx-stats"></div><div class="fmx-card" id="fmx-keys"></div></div>'+
    '<div class="fmx-col show" data-c="center">'+
      '<div class="fmx-seg2"><button data-a="view" data-v="pitch" class="on">Campo</button><button data-a="view" data-v="feed">Diretta</button></div>'+
      '<div class="fmx-center" id="fmx-viewbox"></div>'+
      '<div class="fmx-card" id="fmx-othwrap"><div class="fmx-h">Altre partite di oggi <em id="fmx-othlive">Live</em></div>'+'<div class="fmx-tick"><div class="tk" id="fmx-tkin"></div></div>'+'<div class="fmx-oth" id="fmx-others"></div></div>'+
    '</div>'+
    '<div class="fmx-col" data-c="squads"><div class="fmx-card" id="fmx-squads"></div></div>'+
  '</div>'+
  '<div class="fmx-bot" id="fmx-bot"></div>'+
  '<div class="fmx-flash" id="fmx-flash"></div>'+
  '<div class="fmx-goal" id="fmx-goal"></div>';
  document.body.appendChild(ov);
  M.root=ov;
  ov.addEventListener('click',function(e){
    var b=e.target&&e.target.closest?e.target.closest('[data-a]'):null;
    if(!b||!M) return;
    e.preventDefault(); e.stopPropagation();
    var a=b.getAttribute('data-a'), v=b.getAttribute('data-v');
    try{ handle(a,v); }catch(err){ console.error('FM26 action',a,err); }
  },true);
}

/* ------------------------------------------------------------- overlays */
function openOv(html,cls){
  closeOv();
  var d=document.createElement('div'); d.className='fmx-ov'+(cls?' '+cls:''); d.id='fmx-ovl';
  d.innerHTML='<div class="fmx-box'+(cls?' '+cls:'')+'">'+html+'</div>';
  M.root.appendChild(d);
}
function closeOv(){ var d=document.getElementById('fmx-ovl'); if(d) d.remove(); }
function segRow(label,opts,cur,key){
  return '<div class="fmx-row"><span class="l">'+esc(label)+'</span><div class="fmx-seg">'+
    opts.map(function(o,i){ return '<button data-a="set" data-v="'+key+':'+i+'" class="'+(cur===i?'on':'')+'">'+esc(o)+'</button>'; }).join('')+'</div></div>';
}

var TALKS=[
  {n:'Calmo',       base:0.02, win:0.04, draw:0.03, lose:0.00, stam:2, msg:'Toni bassi e lucidita: la squadra resta ordinata.'},
  {n:'Motivante',   base:0.05, win:0.03, draw:0.06, lose:0.07, stam:4, msg:'Carica emotiva: piu intensita e voglia di attaccare.'},
  {n:'Duro',        base:0.02, win:-0.06, draw:0.03, lose:0.08, stam:0, msg:'Rimprovero pesante: rischioso, ma scuote chi sta sotto.'},
  {n:'Concentrati', base:0.02, win:0.05, draw:0.04, lose:0.01, stam:1, msg:'Focus sulle palle inattive e sulla fase difensiva.'},
  {n:'Fiducia',     base:0.04, win:0.04, draw:0.04, lose:0.05, stam:3, msg:'Fiducia piena ai titolari: qualita in campo aperto.'},
  {n:'Provocatorio',base:0.03, win:-0.03, draw:0.05, lose:0.09, stam:1, msg:'Provocazione calcolata: grande spinta ma nervi tesi.'},
  {n:'Nessuno',     base:0.00, win:0.00, draw:0.00, lose:0.00, stam:0, msg:'Nessun discorso: la squadra resta sulle proprie certezze.'}
];
var MENT=['Ultra dif.','Difensivo','Equilibrato','Offensivo','Ultra off.'];
var TEMPO=['Lento','Normale','Alto'];
var PRESS=['Basso','Medio','Aggressivo'];
var WIDTH=['Stretto','Normale','Largo'];
var STYLE=['Contropiede','Equilibrio','Possesso','Verticale','Palle lunghe'];
var LINE=['Bassa','Normale','Alta'];
var MARK=['A zona','A uomo'];
var FOCUS=['Fascia sx','Centro','Fascia dx','Entrambe le fasce'];
var AGGR=['Prudente','Normale','Aggressiva'];

function formationList(){
  try{ if(window.FM_FORMATIONS2) return Object.keys(window.FM_FORMATIONS2); }catch(e){}
  return [];
}
function tacticsHtml(pre){
  var T=M.userT.tac;
  var L=lines(M.userT);
  var H=M.homeT,A=M.awayT;
  return (pre?'<div class="fmx-kick">'+esc(M.compLbl||'')+' &middot; giorno partita</div>'+
       '<div class="fmx-t1">'+esc(H.name)+' vs '+esc(A.name)+'</div>'+
       '<div class="fmx-t2">'+esc(M.stadium)+' &middot; arbitro '+esc(M.ref)+' &middot; '+M.att.toLocaleString('it-IT')+' spettatori</div>'+
       '<div class="fmx-vs">'+
         '<div class="t">'+(H.logo?'<img src="'+esc(H.logo)+'" onerror="this.remove()">':'')+'<div class="n">'+esc(H.name)+'</div><div class="s">CASA &middot; OVR '+Math.round(M.strH)+'</div></div>'+
         '<div class="mid">VS</div>'+
         '<div class="t">'+(A.logo?'<img src="'+esc(A.logo)+'" onerror="this.remove()">':'')+'<div class="n">'+esc(A.name)+'</div><div class="s">TRASFERTA &middot; OVR '+Math.round(M.strA)+'</div></div>'+
       '</div>'
      :'<div class="fmx-kick">Panchina &middot; aggiustamenti</div><div class="fmx-t1">'+esc(M.userT.name)+'</div>'+
       '<div class="fmx-t2">Ogni scelta cambia occasioni, solidita, cartellini ed energie.</div>')+
    '<div class="fmx-tgrid">'+
      segRow('Mentalita',MENT,T.ment,'ment')+
      segRow('Stile di gioco',STYLE,T.style,'style')+
      segRow('Ritmo',TEMPO,T.tempo,'tempo')+
      segRow('Pressing',PRESS,T.press,'press')+
      segRow('Linea difensiva',LINE,T.line,'line')+
      segRow('Marcatura',MARK,T.mark,'mark')+
      segRow('Ampiezza',WIDTH,T.width,'width')+
      segRow('Focus offensivo',FOCUS,T.focus,'focus')+
      segRow('Aggressivita',AGGR,T.aggr,'aggr')+
      '<div class="fmx-row"><span class="l">Indici squadra</span><b id="fmx-idx" style="font-family:Oswald,Inter,sans-serif;letter-spacing:1px;font-size:14px">ATT '+Math.round(L.att)+' &middot; CEN '+Math.round(L.mid)+' &middot; DIF '+Math.round(L.def)+'</b></div>'+
    '</div>'+
    '<div class="fmx-note">Linea alta alza il fuorigioco ma concede profondita. Marcatura a uomo aumenta duelli e cartellini. Contropiede rende meno in possesso ma e letale in transizione.</div>'+
    '<div class="fmx-acts">'+(pre?
      '<button class="fmx-btn go" data-a="kick">FISCHIO D\'INIZIO \u25b8</button><button class="fmx-btn" data-a="simall">SIMULAZIONE VELOCE</button>':
      '<button class="fmx-btn go" data-a="resume">CONFERMA \u25b8</button>')+'</div>';
}
function preMatch(cfg){
  openOv(tacticsHtml(true),'pre');
}
function halfTime(){
  var H=M.homeT,A=M.awayT, tot=H.posT+A.posT||1;
  var U=M.userT, O=M.oppT;
  var diff=U.goals-O.goals;
  var hint=diff>1?'Squadra avanti: calma e concentrazione tengono alto il livello.'
    :(diff<0?'Sotto nel punteggio: caricare o rimproverare puo cambiare la partita.'
    :'Partita in equilibrio: il discorso giusto sposta gli equilibri.');
  var opts=TALKS.map(function(o,i){
    var lock=M.talkUsed?' lock':'';
    var on=(M.talkPick===i)?' on':'';
    return '<button data-a="talk" data-v="'+i+'" class="'+on+lock+'">'+esc(o.n)+'</button>';
  }).join('');
  openOv('<div class="fmx-kick">Fine primo tempo</div>'+
    '<div class="fmx-t1">'+esc(H.name)+' '+H.goals+' - '+A.goals+' '+esc(A.name)+'</div>'+
    '<div class="fmx-t2">Possesso '+Math.round(H.posT/tot*100)+'% - '+Math.round(A.posT/tot*100)+'% &middot; Tiri '+H.shots+'-'+A.shots+' &middot; xG '+two(H.xg)+'-'+two(A.xg)+' &middot; Morale '+Math.round((U.mor||1)*100)+'%</div>'+
    '<div class="fmx-row"><span class="l">Discorso alla squadra'+(M.talkUsed?' (usato)':'')+'</span><div class="fmx-seg" id="fmx-talks">'+opts+'</div></div>'+
    '<div class="fmx-note" id="fmx-talk">'+esc(M.talkMsg||hint)+'</div>'+
    '<div class="fmx-acts">'+(M.userT.bench.length?'<button class="fmx-btn" data-a="subs">\u21c4 SOSTITUZIONI</button>':'')+
      '<button class="fmx-btn" data-a="tactics">\u2699 TATTICA</button>'+
      '<button class="fmx-btn go" data-a="second">INIZIA RIPRESA \u25b8</button></div>');
}
function subsPanel(){
  var U=M.userT;
  if(!U.bench.length) return;
  var xi=U.players.map(function(p,i){ return {p:p,i:i}; }).filter(function(x){ return !x.p.out&&!x.p.rc; });
  openOv('<div class="fmx-kick">Sostituzioni · '+(5-U.subs)+' disponibili</div>'+
    '<div class="fmx-t1">Panchina</div>'+
    '<div class="fmx-t2">Seleziona chi esce e chi entra. Un giocatore stanco perde efficacia in tutte le fasi.</div>'+
    '<div class="fmx-row" style="align-items:flex-start;flex-direction:column;gap:8px"><span class="l">Esce</span><div class="fmx-seg" style="justify-content:flex-start">'+
      xi.map(function(x){ return '<button data-a="selout" data-v="'+x.i+'" class="'+(M.selOut===x.i?'on':'')+'">'+esc(sur(x.p.name))+' <small style="opacity:.65">'+Math.round(x.p.stam)+'%</small></button>'; }).join('')+'</div></div>'+
    '<div class="fmx-row" style="align-items:flex-start;flex-direction:column;gap:8px"><span class="l">Entra</span><div class="fmx-seg" style="justify-content:flex-start">'+
      U.bench.map(function(p,i){ return '<button data-a="selin" data-v="'+i+'" class="'+(M.selIn===i?'on':'')+'">'+esc(sur(p.name))+' <small style="opacity:.65">'+p.role+' '+Math.round(p.rate)+'</small></button>'; }).join('')+'</div></div>'+
    '<div class="fmx-acts"><button class="fmx-btn go" data-a="dosub">CONFERMA CAMBIO ▸</button>'+
    '<button class="fmx-btn" data-a="resume">CHIUDI</button></div>');
}
function fullTime(){
  M.paused=true; M.done=true; clearTimeout(M.timer);
  var H=M.homeT,A=M.awayT,U=M.userT,O=M.oppT, tot=H.posT+A.posT||1;
  var motm=[].concat(H.players,A.players).sort(function(a,b){ return b.rating-a.rating; })[0];
  var res=(U.goals>O.goals)?'VITTORIA':(U.goals<O.goals?'SCONFITTA':'PAREGGIO');
  var scorers=H.scorers.map(function(g){ return {t:H.name,g:g}; }).concat(A.scorers.map(function(g){ return {t:A.name,g:g}; })).sort(function(a,b){ return a.g.min-b.g.min; });
  var scHtml=scorers.length?scorers.map(function(x){
      return '<div><span>'+esc(sur(x.g.name))+(x.g.assist?' <span style="color:#8A9AAC">(assist '+esc(sur(x.g.assist))+')</span>':'')+'</span><span style="color:#8A9AAC">'+esc(x.t)+' · '+x.g.min+'\'</span></div>';
    }).join(''):'<div><span style="color:#8A9AAC">Nessuna rete</span><span></span></div>';
  var pens=(M.penLog&&M.penLog.length)?'<div class="fmx-t2">Rigori '+M.penScore[0]+'-'+M.penScore[1]+' · passa '+esc(M.penWin==='A'?U.name:O.name)+'</div>':'';
  openOv('<div class="fmx-kick">Fine partita · '+esc(M.compLbl)+'</div>'+
    '<div class="fmx-big">'+H.goals+' - '+A.goals+'</div>'+
    '<div class="fmx-t2" style="margin-top:10px">'+esc(H.name)+' vs '+esc(A.name)+' · <b style="color:'+(res==='VITTORIA'?'#7BE3A8':(res==='SCONFITTA'?'#E97366':'#EAC26B'))+'">'+res+'</b></div>'+pens+
    '<div class="fmx-sc">'+scHtml+'</div>'+
    '<div class="fmx-row"><span class="l">Migliore in campo</span><b>'+esc(motm.name)+' · '+one(motm.rating)+'</b></div>'+
    '<div class="fmx-row"><span class="l">Possesso</span><b>'+Math.round(H.posT/tot*100)+'% - '+Math.round(A.posT/tot*100)+'%</b></div>'+
    '<div class="fmx-row"><span class="l">Tiri (in porta)</span><b>'+H.shots+' ('+H.onT+') - '+A.shots+' ('+A.onT+')</b></div>'+
    '<div class="fmx-row"><span class="l">xG</span><b>'+two(H.xg)+' - '+two(A.xg)+'</b></div>'+
    '<div class="fmx-row"><span class="l">Falli · Ammonizioni</span><b>'+H.fouls+'/'+A.fouls+' · '+H.yc+'/'+A.yc+'</b></div>'+
    '<div class="fmx-acts"><button class="fmx-btn go" data-a="finish">CONTINUA ▸</button></div>');
}
/* ------------------------------------------------------------- rigori */
function penalties(){
  M.phase=6; M.paused=true; clearTimeout(M.timer);
  M.penLog=[]; M.penScore=[0,0]; M.penWin=null;
  var U=M.userT,O=M.oppT;
  var tU=alive(U).filter(function(p){return p.g!=='POR';}).sort(function(a,b){return b.sho-a.sho;});
  var tO=alive(O).filter(function(p){return p.g!=='POR';}).sort(function(a,b){return b.sho-a.sho;});
  var i=0;
  function draw(){
    openOv('<div class="fmx-kick">Calci di rigore</div><div class="fmx-t1">'+M.penScore[0]+' - '+M.penScore[1]+'</div>'+
      '<div class="fmx-t2">'+esc(U.name)+' vs '+esc(O.name)+'</div>'+
      '<div class="fmx-pens">'+M.penLog.map(function(l){
        return '<div class="fmx-pen"><i class="d" style="background:'+(l.ok?'#46A171':'#E97366')+'"></i><b>'+esc(sur(l.name))+'</b>'+
          '<span style="color:#8A9AAC">'+esc(l.team)+'</span>'+
          '<span style="margin-left:auto;color:'+(l.ok?'#7BE3A8':'#E97366')+'">'+(l.ok?'GOL':'ERRORE')+'</span></div>';
      }).join('')+'</div>'+
      (M.penWin?'<div class="fmx-t2" style="margin:8px 0 0">Passa <b>'+esc(M.penWin==='A'?U.name:O.name)+'</b></div><div class="fmx-acts"><button class="fmx-btn go" data-a="afterpens">CONTINUA \u25b8</button></div>':''));
  }
  function decided(){
    var a=M.penScore[0], b=M.penScore[1];
    var shU=Math.ceil(i/2), shO=Math.floor(i/2);
    var remU=Math.max(0,5-shU), remO=Math.max(0,5-shO);
    if(i>=10 && shU===shO && a!==b) return true;
    if(i<10 && (a-b>remO || b-a>remU)) return true;
    return false;
  }
  function shot(){
    if(!M||M.phase!==6) return;
    var uTurn=(i%2===0), round=Math.floor(i/2);
    var t=uTurn?U:O, o=uTurn?O:U, takers=uTurn?tU:tO;
    var p=(takers.length?takers[round%takers.length]:{name:'Rigorista',sho:70});
    var gk=gkOf(o);
    var ok=Math.random()<cl(0.80+(num(p.sho,70)-72)/260-((gk?gk.rate:74)-74)/300,0.5,0.95);
    if(ok) M.penScore[uTurn?0:1]++;
    M.penLog.push({name:p.name,team:t.name,ok:ok});
    i++;
    if(decided()) M.penWin=(M.penScore[0]>M.penScore[1])?'A':'B';
    draw();
    if(!M.penWin) setTimeout(shot,820);
  }
  draw();
  setTimeout(shot,650);
}

/* ------------------------------------------------------------- ciclo */
function effSpeed(){ var s=M.speed||1; if(M.view==='pitch'&&s>2) s=2; return s; }
function tickDelay(){ return Math.max(70,1150/effSpeed()); }
function periodEnd(){
  if(M.phase===1) return 45+M.addH1;
  if(M.phase===3) return 90+M.addH2;
  if(M.phase===4) return 105;
  if(M.phase===5) return 120;
  return 9999;
}
function needWinner(){
  if(M.userT.goals!==M.oppT.goals) return false;
  try{ return !!(M.cfg&&M.cfg.needsWinnerNow&&M.cfg.needsWinnerNow(M.userT.goals,M.oppT.goals)); }catch(e){ return false; }
}
function aiSubs(){
  if(M.min!==60&&M.min!==70&&M.min!==79) return;
  var t=M.oppT; if(t.subs>=5) return;
  var l=alive(t).filter(function(p){ return p.g!=='POR'; }).sort(function(a,b){ return a.stam-b.stam; })[0];
  if(l&&l.stam<72){ l.stam=cl(l.stam+26,10,100); t.subs++;
    feed(M.minLabel(),'info','Cambio per <b>'+esc(t.name)+'</b>: forze fresche in campo.'); }
}
function step(){
  if(!M||M.paused||M.done) return;
  try{ clearSeq(); }catch(e){}
  M.min++;
  try{ if(M.rt&&M.rt.plan&&M.min>M.rt.plan.min+2) rtFlush(false); }catch(e){}
  simMinute(M.min);
  aiSubs();
  renderTop(); renderStats(); renderKeys(); renderSquads();
  if(M.view==='pitch'){ tokTargets(); if(!M.rtT) tokSnap(); if(!M.rtT) rtStart(); }
  else if(M.dirtyFeed){ renderFeed(); M.dirtyFeed=false; }
  if(M.min>=periodEnd()){ endOfPeriod(); return; }
  M.timer=setTimeout(step,tickDelay());
}
function endOfPeriod(){
  M.paused=true; clearTimeout(M.timer);
  if(M.phase===1){ M.phase=2; phaseFeed('Fine primo tempo'); renderAll(); halfTime(); return; }
  if(M.phase===3){
    if(needWinner()){
      phaseFeed('Si va ai tempi supplementari'); renderAll();
      openOv('<div class="fmx-kick">90\'</div><div class="fmx-t1">Tempi supplementari</div>'+
        '<div class="fmx-t2">'+esc(M.homeT.name)+' '+M.homeT.goals+' - '+M.awayT.goals+' '+esc(M.awayT.name)+' \u00b7 servono 30 minuti in pi\u00f9</div>'+
        '<div class="fmx-acts"><button class="fmx-btn go" data-a="et">INIZIA SUPPLEMENTARI \u25b8</button>'+
        (M.userT.bench.length?'<button class="fmx-btn" data-a="subs">\u21c4 CAMBI</button>':'')+'</div>');
      return;
    }
    phaseFeed('Fine partita'); renderAll(); fullTime(); return;
  }
  if(M.phase===4){ M.phase=5; M.min=105; M.paused=false; phaseFeed('Secondo tempo supplementare'); renderAll(); M.timer=setTimeout(step,tickDelay()); return; }
  if(M.phase===5){
    if(M.userT.goals===M.oppT.goals){ phaseFeed('Si va ai calci di rigore'); renderAll(); penalties(); return; }
    phaseFeed('Fine dei supplementari'); renderAll(); fullTime(); return;
  }
}
function simAll(){
  closeOv(); clearTimeout(M.timer); M.paused=true;
  if(M.phase===0){ M.phase=1; M.min=0; }
  var guard=0;
  while(!M.done && guard++<20){
    var end=periodEnd();
    while(M.min<end){ M.min++; simMinute(M.min); aiSubs(); }
    if(M.phase===1){ M.phase=3; M.min=45; alive(M.userT).forEach(function(p){ p.stam=cl(p.stam+7,10,100); }); alive(M.oppT).forEach(function(p){ p.stam=cl(p.stam+7,10,100); }); continue; }
    if(M.phase===2){ M.phase=3; M.min=45; continue; }
    if(M.phase===3){
      if(needWinner()){ M.phase=4; M.min=90; continue; }
      renderAll(); fullTime(); return;
    }
    if(M.phase===4){ M.phase=5; M.min=105; continue; }
    if(M.phase===5){
      if(M.userT.goals===M.oppT.goals){ renderAll(); penalties(); return; }
      renderAll(); fullTime(); return;
    }
    break;
  }
  renderAll(); if(!M.done) fullTime();
}
function resume(){
  closeOv();
  if(M.done) return;
  if(M.phase===0){ preMatch(M.cfg); return; }
  if(M.phase===2){ halfTime(); return; }
  if(M.phase===6) return;
  M.paused=false; renderBottom();
  clearTimeout(M.timer); M.timer=setTimeout(step,tickDelay());
}
function doSub(){
  var U=M.userT;
  if(M.selOut==null||M.selIn==null) return;
  if(U.subs>=5) return;
  var out=U.players[M.selOut], inp=U.bench[M.selIn];
  if(!out||!inp||out.out||out.rc) return;
  out.out=true; out.outMin=M.min;
  inp.role=out.role; inp.g=grp(inp.role); inp.inMin=M.min; inp.rating=6.0; inp.stam=100;
  U.players[M.selOut]=inp; U.players.push(out);
  U.bench.splice(M.selIn,1); U.subs++;
  M.selOut=null; M.selIn=null;
  feed(M.minLabel(),'info','Sostituzione <b>'+esc(U.name)+'</b>: entra <b>'+esc(sur(inp.name))+'</b>, esce '+esc(sur(out.name))+'.');
  closeOv(); renderAll();
  if(M.phase===2) halfTime(); else resume();
}
function talk(v){
  if(M.talkUsed) return;
  var i=num(v,6), o=TALKS[i]||TALKS[6];
  var U=M.userT, diff=U.goals-M.oppT.goals;
  var d=o.base+(diff>0?o.win:(diff<0?o.lose:o.draw));
  U.mor=cl((U.mor||1)+d,0.80,1.22);
  if(o.stam) alive(U).forEach(function(p){ p.stam=cl(p.stam+o.stam,10,100); });
  if(d>0) alive(U).forEach(function(p){ addRating(p,d*1.2); });
  else if(d<0) alive(U).forEach(function(p){ addRating(p,d*1.0); });
  M.talkUsed=true; M.talkPick=i;
  var eff=(d>0.03?'La squadra si accende':(d>0?'Reazione positiva':(d<0?'Effetto negativo: morale giu':'Nessun effetto')));
  M.talkMsg=o.msg+' \u2192 '+eff+' (morale '+Math.round(U.mor*100)+'%).';
  phaseFeed('Discorso negli spogliatoi: '+o.n+' \u00b7 morale '+Math.round(U.mor*100)+'%');
  var box=document.getElementById('fmx-talks');
  if(box){
    var bs=box.querySelectorAll('button');
    for(var k=0;k<bs.length;k++){
      bs[k].classList.add('lock');
      bs[k].classList.toggle('on',String(k)===String(i));
    }
  }
  var note=document.getElementById('fmx-talk');
  if(note) note.textContent=M.talkMsg;
}
function setTab(v){
  M.tab=v;
  var cols=M.root.querySelectorAll('.fmx-col');
  for(var i=0;i<cols.length;i++) cols[i].classList.toggle('show',cols[i].getAttribute('data-c')===v);
  var bs=M.root.querySelectorAll('[data-a="tab"]');
  for(var j=0;j<bs.length;j++) bs[j].classList.toggle('on',bs[j].getAttribute('data-v')===v);
  if(v==='center'&&M.view==='pitch') buildTokens();
}
function setForm(name){
  try{
    var F=(GFORMS()&&GFORMS()[name]);
    if(!F) return;
    M.userT.tac.form=name;
    M.userT.form=F;
    M.userT.players.forEach(function(p,i){ if(i<11&&F[i]&&F[i].role){ p.role=F[i].role; p.g=grp(F[i].role); } });
    feed(M.minLabel(),'info','<b>'+esc(M.userT.name)+'</b> passa al modulo <b>'+esc(name)+'</b>.');
  }catch(e){}
  openOv(tacticsHtml(M.phase===0));
  renderSquads(); if(M.view==='pitch') buildTokens();
}
function setTac(v){
  var parts=String(v||'').split(':'), k=parts[0], i=parseInt(parts[1],10);
  if(!k||isNaN(i)) return;
  M.userT.tac[k]=i;
  var ovl=document.getElementById('fmx-ovl');
  if(!ovl){ openOv(tacticsHtml(M.phase===0),'pre'); return; }
  var bs=ovl.querySelectorAll('[data-a="set"]');
  for(var j=0;j<bs.length;j++){
    var pp=String(bs[j].getAttribute('data-v')||'').split(':');
    if(pp[0]===k) bs[j].classList.toggle('on',parseInt(pp[1],10)===i);
  }
  try{
    var L=lines(M.userT), idx=document.getElementById('fmx-idx');
    if(idx) idx.innerHTML='ATT '+Math.round(L.att)+' \u00b7 CEN '+Math.round(L.mid)+' \u00b7 DIF '+Math.round(L.def);
  }catch(e){}
}
function quitAsk(){
  M.paused=true; clearTimeout(M.timer); renderBottom();
  openOv('<div class="fmx-kick">Abbandona partita</div><div class="fmx-t1">Uscire dalla partita?</div>'+
    '<div class="fmx-t2">Puoi far calcolare il risultato al motore rapido, oppure tornare in campo.</div>'+
    '<div class="fmx-acts"><button class="fmx-btn" data-a="quitsim">SIMULA E ESCI</button>'+
    '<button class="fmx-btn go" data-a="resume">TORNA IN CAMPO \u25b8</button></div>');
}
function destroy(){
  try{ rtStop(); }catch(e){}
  try{ clearTimeout(M.timer); }catch(e){}
  try{ clearSeq(); clearTimeout(M.kickT); clearTimeout(M.animT); clearTimeout(M.goalT); }catch(e){}
  try{ clearTimeout(M.flashT); }catch(e){}
  var el=document.getElementById('fm26'); if(el) el.remove();
  M=null;
}
function finish(){
  if(!M) return;
  var U=M.userT,O=M.oppT, tot=U.posT+O.posT||1;
  var pu=Math.round(U.posT/tot*100);
  var stats={
    possA:pu, possB:100-pu,
    shotsA:U.shots, shotsB:O.shots,
    chA:U.onT, chB:O.onT,
    onA:U.onT, onB:O.onT,
    xgA:two(U.xg), xgB:two(O.xg),
    cornersA:U.corners, cornersB:O.corners,
    foulsA:U.fouls, foulsB:O.fouls,
    ycA:U.yc, ycB:O.yc, rcA:U.rc, rcB:O.rc,
    passA:U.passes?Math.round(U.passOk/U.passes*100):0, passB:O.passes?Math.round(O.passOk/O.passes*100):0,
    posUser:pu, posOpp:100-pu, shotsUser:U.shots, shotsOpp:O.shots
  };
  var res={
    gfUser:U.goals, gfOpp:O.goals,
    scUser:U.scorers.map(function(g){ return {min:g.min,name:g.name,img:g.img,assist:g.assist,assistImg:g.assistImg}; }),
    scOpp:O.scorers.map(function(g){ return {min:g.min,name:g.name,img:g.img,assist:g.assist,assistImg:g.assistImg}; }),
    stats:stats, penWin:M.penWin||null
  };
  var cb=M.cfg&&M.cfg.onFinish;
  destroy();
  if(cb){ try{ cb(res); }catch(e){ console.error('FM26 onFinish',e); } }
}
function abandon(mode){
  var cb=M.cfg&&M.cfg.onAbandon;
  destroy();
  if(cb){ try{ cb(mode); }catch(e){ console.error('FM26 onAbandon',e); } }
}

/* ------------------------------------------------------- dispatcher */
function handle(a,v){
  if(!M) return;
  switch(a){
    case 'toggle': if(M.paused) resume(); else { M.paused=true; clearTimeout(M.timer); renderBottom(); } break;
    case 'spd': M.speed=num(v,1)||1; if(M.view==='pitch'&&M.speed>2) M.speed=2; renderBottom(); break;
    case 'tab': setTab(v); break;
    case 'view': M.view=(v==='pitch'?'pitch':'feed'); if(M.view==='pitch'&&M.speed>2) M.speed=2; renderCenter(); renderBottom(); break;
    case 'sq': M.sqTab=(v==='opp'?'opp':'own'); renderSquads(); break;
    case 'set': setTac(v); break;
    case 'tactics': M.paused=true; clearTimeout(M.timer); renderBottom(); openOv(tacticsHtml(M.phase===0),'pre'); break;
    case 'subs': M.paused=true; clearTimeout(M.timer); renderBottom(); subsPanel(); break;
    case 'selout': M.selOut=parseInt(v,10); subsPanel(); break;
    case 'selin': M.selIn=parseInt(v,10); subsPanel(); break;
    case 'dosub': doSub(); break;
    case 'resume': resume(); break;
    case 'kick':
      closeOv(); M.phase=1; M.min=0; M.paused=false;
      phaseFeed('Calcio d\'inizio: si parte!'); renderAll();
      clearTimeout(M.timer); M.timer=setTimeout(step,tickDelay());
      break;
    case 'second':
      try{ if(M.rt){ M.rt.started=false; M.rt.t=M.awayT; } }catch(e){}
      closeOv(); M.phase=3; M.min=45; M.paused=false;
      alive(M.userT).forEach(function(p){ p.stam=cl(p.stam+7,10,100); });
      alive(M.oppT).forEach(function(p){ p.stam=cl(p.stam+7,10,100); });
      phaseFeed('Inizio secondo tempo'); renderAll();
      clearTimeout(M.timer); M.timer=setTimeout(step,tickDelay());
      break;
    case 'et':
      try{ if(M.rt){ M.rt.started=false; M.rt.t=M.homeT; } }catch(e){}
      closeOv(); M.phase=4; M.min=90; M.paused=false;
      phaseFeed('Inizio tempi supplementari'); renderAll();
      clearTimeout(M.timer); M.timer=setTimeout(step,tickDelay());
      break;
    case 'skip': case 'simall': simAll(); break;
    case 'talk': talk(v); break;
    case 'afterpens': closeOv(); fullTime(); break;
    case 'finish': finish(); break;
    case 'quit': quitAsk(); break;
    case 'quitsim': abandon('sim'); break;
  }
}

/* ------------------------------------------------------------- start */
function start(cfg){
  cfg=cfg||{};
  ensureCss();
  try{ var old=document.getElementById('fm26'); if(old) old.remove(); }catch(e){}
  var us=(cfg.userSide===1)?1:0;
  var kits=cfg.kits||[];
  var uKit=kits[us]||{s:'#00D26A',sh:'#04180d'};
  var oKit=kits[1-us]||{s:'#5E9FE8',sh:'#04121f'};
  var uForm=(cfg.userTeam&&cfg.userTeam.formation)||null;
  var oForm=(cfg.oppTeam&&cfg.oppTeam.formation)||null;
  var userT=mkTeam(us===0?cfg.homeName:cfg.awayName, us===0?cfg.homeLogo:cfg.awayLogo, uKit, cfg.userTeam, uForm, num(cfg.userStr,75), true);
  var oppT =mkTeam(us===0?cfg.awayName:cfg.homeName, us===0?cfg.awayLogo:cfg.homeLogo, oKit, cfg.oppTeam,  oForm, num(cfg.oppStr,78), false);
  userT.tac={ment:2,style:1,tempo:1,press:1,line:1,mark:0,width:1,focus:1,aggr:1,form:((GS().formationName)||'')};
  oppT.tac ={ment:2,style:1,tempo:1,press:1,line:1,mark:0,width:1,focus:1,aggr:1};
  userT.mor=1; oppT.mor=1;
  try{
    var bs=(GS().bench)||[];
    userT.bench=bs.slice(0,9).map(function(b){ return mkPlayer(b,(b&&(b.pos||b.role))||'CC',num(cfg.userStr,75)); });
  }catch(e){ userT.bench=[]; }

  M={
    cfg:cfg, userT:userT, oppT:oppT,
    homeT:(us===0?userT:oppT), awayT:(us===0?oppT:userT),
    phase:0, min:0, addH1:ri(1,3), addH2:ri(2,5),
    paused:true, done:false, speed:2, timer:null, flashT:null,
    events:[], dirtyFeed:false, view:'pitch', tab:'center', sqTab:'own',
    zone:0, terr:[0,0,0], tokens:[], others:[],
    selOut:null, selIn:null, penLog:[], penScore:[0,0], penWin:null,
    strH:(us===0?num(cfg.userStr,75):num(cfg.oppStr,78)),
    strA:(us===0?num(cfg.oppStr,78):num(cfg.userStr,75)),
    compLbl:cfg.comp||'Partita',
    stadium:((GS().stadiumName||GS().stadium)||'Grande Stadio'),
    ref:pick(['Colombo','Orsato','Rocchi','Massa','Guida','Di Bello','Irrati','Maresca']),
    att:ri(26000,74000),
    minLabel:function(){ if(M.phase===0) return "0'"; return Math.min(M.min,130)+"'"; },
    phaseLabel:function(){ return ['Pre-partita','1\u00b0 tempo','Intervallo','2\u00b0 tempo','1\u00b0 t. supplementare','2\u00b0 t. supplementare','Calci di rigore','Finale'][M.phase]||''; }
  };
  M.ball={x:50,y:50}; M.talkUsed=false; M.talkPick=-1; M.talkMsg="";
  M.others=buildOthers();
  shell(cfg);
  renderAll();
  preMatch(cfg);
}

/* --------------------------------------------------------------- API */
var prev3d=window.M26Match;
window.M26Match={ start:start, stop:function(){ try{ destroy(); }catch(e){} }, _g:function(){ return M; }, _3d:prev3d };
window.FM26Match={ start:start };
window.FM26={ start:start, action:handle, state:function(){ return M; },
  set:function(k,i){ handle('set',k+':'+i); }, tab:function(v){ handle('tab',v); },
  view:function(v){ handle('view',v); }, subs:function(){ handle('subs'); },
  tactics:function(){ handle('tactics'); }, skip:function(){ handle('skip'); } };

/* "Giorno Partita": avanza il calendario fino al giorno partita, senza simulare */
window.goMatchDay=function(){
  try{
    var S=GS(); if(!S||!S.calendar) return;
    var m=S.calendar[S.currentWeek];
    if(!m) return;
    if(!S.currentDay || m.date>S.currentDay){
      if(typeof window.advanceToDate==='function') window.advanceToDate(m.date,{stopAtMatch:true});
    } else {
      if(typeof window.showToast==='function') window.showToast('\u26bd \u00c8 gi\u00e0 il giorno della partita!');
      if(typeof window.render==='function') window.render();
    }
  }catch(e){ console.error('goMatchDay',e); }
};

})();

