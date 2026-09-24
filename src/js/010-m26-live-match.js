
/* =====================================================================
   M26 LIVE MATCH — motore partita giocabile (canvas 2.5D, camera TV)
   Si integra con MANAGER26: window.playMatchRealtime()
   ===================================================================== */
(function(){
'use strict';

/* ---------- costanti campo (metri) ---------- */
var PW=105, PH=68, HX=PW/2, HY=PH/2;      // dimensioni campo
var GOAL_Y=3.66, GOAL_H=2.44, BOX_D=16.5, BOX_W=40.32, SPOT=11;
var TILT=0.62, ZLIFT=0.85;                // proiezione camera TV

/* ---------- utils ---------- */
function clamp(v,a,b){ return v<a?a:(v>b?b:v); }
function lerp(a,b,t){ return a+(b-a)*t; }
function len(x,y){ return Math.sqrt(x*x+y*y); }
function angNorm(a){ while(a>Math.PI)a-=Math.PI*2; while(a<-Math.PI)a+=Math.PI*2; return a; }
function rndR(a,b){ return a+Math.random()*(b-a); }
function dist(a,b){ return len(a.x-b.x,a.y-b.y); }
function shade(hex,amt){ // schiarisce/scurisce un colore #rrggbb
  var n=parseInt(hex.slice(1),16), r=clamp((n>>16)+amt,0,255), g=clamp(((n>>8)&255)+amt,0,255), b=clamp((n&255)+amt,0,255);
  return '#'+((r<<16)|(g<<8)|b).toString(16).padStart(6,'0');
}
function lum(hex){ var n=parseInt(hex.slice(1),16); return (0.299*(n>>16)+0.587*((n>>8)&255)+0.114*(n&255))/255; }
function shortName(nm){ // sigla 3 lettere per lo scorebug
  if(!nm) return 'SQU';
  var known={'Inter':'INT','AC Milan':'MIL','Juventus':'JUV','Napoli':'NAP','Roma':'ROM','Lazio':'LAZ','Atalanta':'ATA','Fiorentina':'FIO','Torino':'TOR','Bologna':'BOL','Como':'COM','Parma':'PAR','Genoa':'GEN','Cagliari':'CAG','Lecce':'LEC','Udinese':'UDI','Hellas Verona':'VER','Empoli':'EMP','Venezia':'VEN','Monza':'MON','Cremonese':'CRE','Pisa':'PIS','Sassuolo':'SAS','Real Madrid':'RMA','FC Barcelona':'BAR','Manchester City':'MCI','Manchester United':'MUN','Liverpool':'LIV','Arsenal':'ARS','Chelsea':'CHE','Tottenham Hotspur':'TOT','Newcastle United':'NEW','Aston Villa':'AVL','Brighton & Hove Albion':'BHA','FC Bayern München':'BAY','Borussia Dortmund':'BVB','Bayer 04 Leverkusen':'B04','Paris Saint-Germain':'PSG','Olympique Lyonnais':'OL','Atlético Madrid':'ATM','Real Betis Balompié':'BET','Athletic Club':'ATH','RCD Mallorca':'MLL','Sporting CP':'SPO','SL Benfica':'BEN','PSV':'PSV','Feyenoord':'FEY','Celtic':'CEL','Rangers FC':'RAN','Galatasaray SK':'GAL','Fenerbahçe SK':'FEN','Beşiktaş JK':'BES','Al Nassr':'NSR','Al Hilal':'HIL','Al Ahli SFC':'AHL','Al Qadsiah FC':'QAD','Inter Miami':'MIA','River Plate':'RIV','Dinamo Zagreb':'DZG'};
  if(known[nm]) return known[nm];
  var w=String(nm).replace(/^(FC|AC|AS|SS|US|AFC|SC|SK)\s+/i,'').trim();
  return w.substring(0,3).toUpperCase();
}

/* ---------- kit database (maglie reali semplificate) ---------- */
var KITS={
  'Inter':{s:'#00509E',s2:'#0D1B2A',p:'stripes',sh:'#0D1B2A'},
  'AC Milan':{s:'#E63946',s2:'#111111',p:'stripes',sh:'#111111'},
  'Juventus':{s:'#FFFFFF',s2:'#111111',p:'stripes',sh:'#111111'},
  'Napoli':{s:'#1E8FD5',s2:null,p:'solid',sh:'#FFFFFF'},
  'Roma':{s:'#8E1F2F',s2:null,p:'solid',sh:'#8E1F2F'},
  'Lazio':{s:'#7DB9E8',s2:null,p:'solid',sh:'#FFFFFF'},
  'Atalanta':{s:'#1E5FA8',s2:'#111111',p:'stripes',sh:'#111111'},
  'Fiorentina':{s:'#5B2D8E',s2:null,p:'solid',sh:'#5B2D8E'},
  'Torino':{s:'#7A2020',s2:null,p:'solid',sh:'#7A2020'},
  'Bologna':{s:'#A31F34',s2:'#1B2A4A',p:'stripes',sh:'#1B2A4A'},
  'Como':{s:'#1E5FA8',s2:null,p:'solid',sh:'#FFFFFF'},
  'Parma':{s:'#FFFFFF',s2:'#111111',p:'cross',sh:'#111111'},
  'Genoa':{s:'#A31F34',s2:'#1B2A4A',p:'halves',sh:'#1B2A4A'},
  'Cagliari':{s:'#A31F34',s2:'#1B2A4A',p:'halves',sh:'#1B2A4A'},
  'Lecce':{s:'#FFD24A',s2:'#A31F34',p:'stripes',sh:'#A31F34'},
  'Udinese':{s:'#FFFFFF',s2:'#111111',p:'stripes',sh:'#111111'},
  'Hellas Verona':{s:'#F4C20D',s2:'#1B2A4A',p:'solid',sh:'#1B2A4A'},
  'Empoli':{s:'#1E5FA8',s2:null,p:'solid',sh:'#1E5FA8'},
  'Venezia':{s:'#111111',s2:'#2E8B57',p:'solid',sh:'#111111'},
  'Monza':{s:'#E63946',s2:null,p:'solid',sh:'#E63946'},
  'Sassuolo':{s:'#0FA36B',s2:'#111111',p:'stripes',sh:'#111111'},
  'Real Madrid':{s:'#FFFFFF',s2:null,p:'solid',sh:'#FFFFFF'},
  'FC Barcelona':{s:'#A31F34',s2:'#1B2A6E',p:'stripes',sh:'#1B2A6E'},
  'Atlético Madrid':{s:'#E63946',s2:'#FFFFFF',p:'stripes',sh:'#1B2A4A'},
  'Real Betis Balompié':{s:'#0FA36B',s2:'#FFFFFF',p:'stripes',sh:'#FFFFFF'},
  'Athletic Club':{s:'#E63946',s2:'#FFFFFF',p:'stripes',sh:'#111111'},
  'Manchester City':{s:'#7DB9E8',s2:null,p:'solid',sh:'#FFFFFF'},
  'Manchester United':{s:'#D92338',s2:null,p:'solid',sh:'#FFFFFF'},
  'Liverpool':{s:'#D92338',s2:null,p:'solid',sh:'#D92338'},
  'Arsenal':{s:'#D92338',s2:'#FFFFFF',p:'sleeves',sh:'#FFFFFF'},
  'Chelsea':{s:'#1B4FA8',s2:null,p:'solid',sh:'#1B4FA8'},
  'Tottenham Hotspur':{s:'#FFFFFF',s2:null,p:'solid',sh:'#1B2A4A'},
  'Newcastle United':{s:'#FFFFFF',s2:'#111111',p:'stripes',sh:'#111111'},
  'Aston Villa':{s:'#7A2038',s2:'#7DB9E8',p:'sleeves',sh:'#FFFFFF'},
  'Brighton & Hove Albion':{s:'#1B4FA8',s2:'#FFFFFF',p:'stripes',sh:'#FFFFFF'},
  'FC Bayern München':{s:'#D92338',s2:null,p:'solid',sh:'#D92338'},
  'Borussia Dortmund':{s:'#F4C20D',s2:null,p:'solid',sh:'#111111'},
  'Bayer 04 Leverkusen':{s:'#D92338',s2:null,p:'solid',sh:'#111111'},
  'Paris Saint-Germain':{s:'#1B2A6E',s2:'#D92338',p:'center',sh:'#1B2A6E'},
  'Olympique Lyonnais':{s:'#FFFFFF',s2:'#1B2A6E',p:'solid',sh:'#FFFFFF'},
  'Sporting CP':{s:'#0FA36B',s2:'#FFFFFF',p:'stripes',sh:'#FFFFFF'},
  'SL Benfica':{s:'#E63946',s2:null,p:'solid',sh:'#FFFFFF'},
  'PSV':{s:'#E63946',s2:'#FFFFFF',p:'stripes',sh:'#FFFFFF'},
  'Feyenoord':{s:'#E63946',s2:'#FFFFFF',p:'halves',sh:'#111111'},
  'Celtic':{s:'#0FA36B',s2:'#FFFFFF',p:'stripes',sh:'#FFFFFF'},
  'Galatasaray SK':{s:'#E8740C',s2:'#A31F34',p:'halves',sh:'#A31F34'},
  'Fenerbahçe SK':{s:'#F4C20D',s2:'#1B2A6E',p:'stripes',sh:'#1B2A6E'},
  'Al Nassr':{s:'#F4C20D',s2:'#1B4FA8',p:'solid',sh:'#1B4FA8'},
  'Al Hilal':{s:'#1B4FA8',s2:null,p:'solid',sh:'#1B4FA8'},
  'Inter Miami':{s:'#F2B8C6',s2:null,p:'solid',sh:'#FFFFFF'},
  'River Plate':{s:'#FFFFFF',s2:'#D92338',p:'sash',sh:'#111111'}
};
var KIT_FALLBACK=['#D92338','#1B4FA8','#0FA36B','#F4C20D','#7A2038','#E8740C','#5B2D8E','#0D1B2A'];
function kitFor(name, avoid){
  var k=KITS[name];
  if(!k){ var h=0; for(var i=0;i<name.length;i++) h=(h*31+name.charCodeAt(i))>>>0;
    var c=KIT_FALLBACK[h%KIT_FALLBACK.length]; k={s:c,s2:null,p:'solid',sh:shade(c,-40)}; }
  k=JSON.parse(JSON.stringify(k));
  if(avoid && Math.abs(lum(k.s)-lum(avoid.s))<0.18){
    // conflitto cromatico: maglia da trasferta
    var awayIsLight = lum(avoid.s)<0.5;
    k = awayIsLight ? {s:'#F5F5F5',s2:avoid.s,p:'sash',sh:'#D9D9D9'} : {s:'#1A1A1A',s2:avoid.s,p:'sash',sh:'#1A1A1A'};
  }
  return k;
}
/* Anche la partita 3D veste le squadre con queste maglie (057-match3d-hook.js). */
window.kfmKitFor = kitFor;

/* ---------- audio (sintetizzato, sicuro) ---------- */
var AC=null;
function beep(type){
  try{
    if(!AC) AC=new (window.AudioContext||window.webkitAudioContext)();
    if(AC.state==='suspended') AC.resume();
    var t=AC.currentTime;
    if(type==='kick'){ var o=AC.createOscillator(),g=AC.createGain(); o.type='sine'; o.frequency.setValueAtTime(140,t); o.frequency.exponentialRampToValueAtTime(50,t+0.09); g.gain.setValueAtTime(0.25,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.1); o.connect(g).connect(AC.destination); o.start(t); o.stop(t+0.11); }
    else if(type==='whistle'){ var o2=AC.createOscillator(),g2=AC.createGain(); o2.type='square'; o2.frequency.setValueAtTime(2350,t); g2.gain.setValueAtTime(0.06,t); g2.gain.setValueAtTime(0.06,t+0.35); g2.gain.exponentialRampToValueAtTime(0.001,t+0.42); o2.connect(g2).connect(AC.destination); o2.start(t); o2.stop(t+0.45); }
    else if(type==='goal'){ for(var i=0;i<3;i++){ var o3=AC.createOscillator(),g3=AC.createGain(); o3.type='triangle'; o3.frequency.setValueAtTime([523,659,784][i],t+i*0.09); g3.gain.setValueAtTime(0.0001,t+i*0.09); g3.gain.exponentialRampToValueAtTime(0.18,t+i*0.09+0.03); g3.gain.exponentialRampToValueAtTime(0.001,t+i*0.09+0.5); o3.connect(g3).connect(AC.destination); o3.start(t+i*0.09); o3.stop(t+i*0.09+0.55); } }
  }catch(e){}
}

/* ---------- input ---------- */
var IN={ keys:{}, stick:{x:0,y:0,on:false}, touch:{pass:false,shot:false,sprint:false},
  passEdge:false, shotEdge:false, switchEdge:false, pauseEdge:false,
  passHeld:0, shotHeld:0, shotCharging:false, passDown:false, shotDown:false };
var KEYMAP={ ArrowUp:'up',KeyW:'up', ArrowDown:'down',KeyS:'down', ArrowLeft:'left',KeyA:'left', ArrowRight:'right',KeyD:'right',
  Space:'pass',KeyZ:'pass',KeyK:'pass', KeyX:'shot',KeyL:'shot', ShiftLeft:'sprint',ShiftRight:'sprint',KeyJ:'sprint',
  KeyC:'switch',KeyQ:'switch',Tab:'switch', KeyP:'pause',Escape:'pause' };
var inputBound=false;
function bindInput(){
  if(inputBound) return; inputBound=true;
  document.addEventListener('keydown',function(e){
    if(!G.active) return;
    var k=KEYMAP[e.code]; if(!k) return;
    e.preventDefault(); e.stopPropagation();
    if(k==='pass'&&!IN.keys.pass){ IN.passEdge=true; IN.passDown=true; IN.passHeld=0; }
    if(k==='shot'&&!IN.keys.shot){ IN.shotEdge=true; IN.shotDown=true; IN.shotHeld=0; }
    if(k==='switch') IN.switchEdge=true;
    if(k==='pause') IN.pauseEdge=true;
    IN.keys[k]=true;
  },true);
  document.addEventListener('keyup',function(e){
    if(!G.active) return;
    var k=KEYMAP[e.code]; if(!k) return;
    e.preventDefault(); e.stopPropagation();
    IN.keys[k]=false;
    if(k==='pass'){ IN.passDown=false; }
    if(k==='shot'){ IN.shotDown=false; }
  },true);
  window.addEventListener('blur',function(){ IN.keys={}; IN.passDown=IN.shotDown=false; });
}
function moveVec(){ // vettore movimento normalizzato
  var x=0,y=0;
  if(IN.keys.left)x-=1; if(IN.keys.right)x+=1; if(IN.keys.up)y-=1; if(IN.keys.down)y+=1;
  if(IN.stick.on){ x=IN.stick.x; y=IN.stick.y; }
  var l=len(x,y); if(l>1){x/=l;y/=l;}
  return {x:x,y:y};
}
function sprinting(){ return !!(IN.keys.sprint||IN.touch.sprint); }

/* ---------- stato globale partita ---------- */
var G={ active:false };
var cv=null, ctx=null, W=0, H=0, DPR=1;
var radarCv=null, radarCtx=null;

/* camera */
var CAM={ x:0, y:0, z:20, tx:0, ty:0, tz:20 };
function project(wx,wy,wz){
  var z=CAM.z;
  return { x:(wx-CAM.x)*z + W/2, y:(wy-CAM.y)*z*TILT + H*0.52 - (wz||0)*z*ZLIFT };
}
function visibleMeters(){ return W/CAM.z; }

/* pitch prerender (erba + righe) */
var pitchCv=null;
function buildPitch(){
  var sc=20; // px per metro
  pitchCv=document.createElement('canvas'); pitchCv.width=PW*sc; pitchCv.height=PH*sc;
  var c=pitchCv.getContext('2d');
  // strisce di taglio
  // ---- BASE: gradiente di luce (il campo non e' a tinta piatta) ----
  var gBase=c.createLinearGradient(0,0,0,PH*sc);
  gBase.addColorStop(0,'#2b8a3f'); gBase.addColorStop(0.42,'#3aa451');
  gBase.addColorStop(0.72,'#379c4b'); gBase.addColorStop(1,'#267d37');
  c.fillStyle=gBase; c.fillRect(0,0,PW*sc,PH*sc);

  // ---- STRISCE DI TAGLIO: 16 bande, ognuna con gradiente interno ----
  var bands=16, bw=PW/bands;
  for(var i=0;i<bands;i++){
    var bg=c.createLinearGradient(0,0,0,PH*sc);
    if((i%2)===0){
      bg.addColorStop(0,'rgba(255,255,255,0.130)');
      bg.addColorStop(0.5,'rgba(255,255,255,0.080)');
      bg.addColorStop(1,'rgba(255,255,255,0.140)');
    } else {
      bg.addColorStop(0,'rgba(0,42,12,0.130)');
      bg.addColorStop(0.5,'rgba(0,42,12,0.080)');
      bg.addColorStop(1,'rgba(0,42,12,0.140)');
    }
    c.fillStyle=bg; c.fillRect(i*bw*sc,0,bw*sc,PH*sc);
  }

  // ---- TAGLIO INCROCIATO leggero ----
  var hb=PH/9;
  for(var j=0;j<9;j++){
    c.fillStyle=(j%2)?'rgba(255,255,255,0.030)':'rgba(0,32,9,0.030)';
    c.fillRect(0,j*hb*sc,PW*sc,hb*sc);
  }

  // ---- TEXTURE ERBA: fili sottili, non macchie da mezzo metro ----
  for(var n=0;n<64000;n++){
    c.fillStyle = Math.random()<0.5 ? 'rgba(255,255,255,0.030)' : 'rgba(0,38,13,0.040)';
    c.fillRect(Math.random()*PW*sc, Math.random()*PH*sc, 1.2, 2.6);
  }

  // ---- USURA: centrocampo e davanti alle porte ----
  [[PW/2,PH/2,13],[9,PH/2,10],[PW-9,PH/2,10]].forEach(function(w){
    var wg=c.createRadialGradient(w[0]*sc,w[1]*sc,0,w[0]*sc,w[1]*sc,w[2]*sc);
    wg.addColorStop(0,'rgba(158,138,86,0.070)'); wg.addColorStop(1,'rgba(158,138,86,0)');
    c.fillStyle=wg; c.fillRect((w[0]-w[2])*sc,(w[1]-w[2])*sc,w[2]*2*sc,w[2]*2*sc);
  });

  // ---- VIGNETTATURA: luce al centro, bordi in ombra (da' volume) ----
  var vg=c.createRadialGradient(PW/2*sc,PH/2*sc, PH*0.18*sc, PW/2*sc,PH/2*sc, PW*0.60*sc);
  vg.addColorStop(0,'rgba(255,255,235,0.060)');
  vg.addColorStop(0.52,'rgba(0,0,0,0)');
  vg.addColorStop(1,'rgba(0,20,7,0.32)');
  c.fillStyle=vg; c.fillRect(0,0,PW*sc,PH*sc);
  // righe
  c.strokeStyle='rgba(255,255,255,.92)'; c.lineWidth=0.14*sc; c.fillStyle='rgba(255,255,255,.92)';
  function L(x1,y1,x2,y2){ c.beginPath(); c.moveTo(x1*sc,y1*sc); c.lineTo(x2*sc,y2*sc); c.stroke(); }
  function R(x,y,w,h){ c.strokeRect(x*sc,y*sc,w*sc,h*sc); }
  var ox=0, oy=0; // origine angolo campo in metri (0..105, 0..68)
  R(ox,oy,PW,PH);
  L(PW/2,oy,PW/2,PH);
  c.beginPath(); c.arc(PW/2*sc,PH/2*sc,9.15*sc,0,Math.PI*2); c.stroke();
  c.beginPath(); c.arc(PW/2*sc,PH/2*sc,0.25*sc,0,Math.PI*2); c.fill();
  [0,PW].forEach(function(gx){
    var bx=gx===0?0:PW-BOX_D;
    R(bx,(PH-BOX_W)/2,BOX_D,BOX_W);           // area rigore
    R(gx===0?0:PW-5.5,(PH-18.32)/2,5.5,18.32); // aretta
    c.beginPath(); c.arc((gx===0?SPOT:PW-SPOT)*sc,PH/2*sc,0.22*sc,0,Math.PI*2); c.fill();
    c.beginPath(); c.arc((gx===0?SPOT:PW-SPOT)*sc,PH/2*sc,9.15*sc, gx===0?-0.93:Math.PI-0.93, gx===0?0.93:Math.PI+0.93); c.stroke();
    // archetti d'angolo
    c.beginPath(); c.arc(gx*sc,oy*sc,1*sc,0,Math.PI/2); if(gx===0)c.stroke();
    c.beginPath(); c.arc(gx*sc,PH*sc,1*sc,gx===0?-Math.PI/2:Math.PI, gx===0?0:Math.PI*1.5); c.stroke();
    c.beginPath(); c.arc((gx===0?PW:0)*sc,oy*sc,1*sc,Math.PI/2,Math.PI); if(gx!==0)c.stroke();
    c.beginPath(); c.arc((gx===0?PW:0)*sc,PH*sc,1*sc,gx===0?Math.PI:Math.PI/2, gx===0?Math.PI*1.5:Math.PI); if(gx!==0)c.stroke();
  });
  return pitchCv;
}
/* stadio (sfondo) prerender: tribune + pubblico */
var stadCv=null;
function buildStadium(){
  var sc=20, pad=26; // metri di cornice attorno al campo
  stadCv=document.createElement('canvas'); stadCv.width=(PW+pad*2)*sc; stadCv.height=(PH+pad*2)*sc;
  var c=stadCv.getContext('2d');
  var g=c.createRadialGradient(stadCv.width/2,stadCv.height/2,stadCv.width*0.28,stadCv.width/2,stadCv.height/2,stadCv.width*0.62);
  g.addColorStop(0,'#1a2433'); g.addColorStop(1,'#0a0e16');
  c.fillStyle=g; c.fillRect(0,0,stadCv.width,stadCv.height);
  // pista/atletica attorno al campo
  c.fillStyle='#22303f'; c.fillRect((pad-5)*sc,(pad-5)*sc,(PW+10)*sc,(PH+10)*sc);
  c.fillStyle='#1c2836'; c.fillRect((pad-3)*sc,(pad-3)*sc,(PW+6)*sc,(PH+6)*sc);
  c.fillStyle='#20415c'; c.fillRect((pad-1.6)*sc,(pad-1.6)*sc,(PW+3.2)*sc,(PH+3.2)*sc);
  // pubblico: puntini colorati sulle tribune
  var crowdCols=['#3b4b61','#4a5d78','#5d7285','#7a8ca3','#94a7bd','#2c3a4d','#c8d4e0'];
  function crowdRect(x,y,w,h){ for(var i=0;i<w*h*sc*sc*0.16;i++){ c.fillStyle=crowdCols[(Math.random()*crowdCols.length)|0]; c.fillRect(x*sc+Math.random()*w*sc, y*sc+Math.random()*h*sc, 1.6,1.6);} }
  crowdRect(0,0,stadCv.width/sc,(pad-6)); crowdRect(0,stadCv.height/sc-(pad-6),stadCv.width/sc,(pad-6));
  crowdRect(0,0,(pad-6),stadCv.height/sc); crowdRect(stadCv.width/sc-(pad-6),0,(pad-6),stadCv.height/sc);
  // tabelloni LED
  c.fillStyle='#0c1420'; c.fillRect((pad-2.4)*sc,(pad-2.4)*sc,(PW+4.8)*sc,1.1*sc); c.fillRect((pad-2.4)*sc,(PH+pad+1.3)*sc,(PW+4.8)*sc,1.1*sc);
  c.fillStyle='#12233a'; c.fillRect((pad-2.4)*sc,(pad-2.4)*sc,(PW+4.8)*sc,1.1*sc);
  return stadCv;
}

/* ---------- fabbrica giocatori ---------- */
var SKIN=['#f2c89b','#e0a878','#b97a4e','#8a5632','#6b3f22'];
var HAIR=['#1b1b1b','#3a2a18','#6b4a22','#b8862e','#888888','#2a2a3a'];
function mkPlayer(spec, slot, team, idx){
  var role=(slot&&slot.role)||'';
  var gk = (idx===0) || role==='POR' || role==='GK' || role==='P' || role==='PT';
  var num=function(v,d){ v=parseFloat(v); return isNaN(v)?d:v; };
  var pac=num(spec.pac,70), sho=num(spec.sho,70), pas=num(spec.pas,70), dri=num(spec.dri,70), def=num(spec.def,70), phy=num(spec.phy,70);
  var h=0; for(var i=0;i<spec.name.length;i++) h=(h*33+spec.name.charCodeAt(i))>>>0;
  return {
    team:team, idx:idx, name:spec.name, img:spec.img||null, role:role, gk:gk,
    shirt: gk?1:(idx+1), x:0, y:0, vx:0, vy:0, face:team===0?0:Math.PI, run:0, lean:0,
    hx:0, hy:0,
    pac:pac, sho:sho, pas:pas, dri:dri, def:def, phy:phy,
    maxSpd: gk?6.0:(5.15+pac/99*2.75), acc: gk?16:(14+dri/99*7.5),
    stamina:100, skin:SKIN[h%SKIN.length], hair:HAIR[(h>>3)%HAIR.length], hgt:0.94+((h>>5)%14)/100,
    controlled:false, tackleCd:0, slideCd:0, reactT:Math.random()*0.2, aiThink:0,
    diveT:0, diveDir:0, celebrate:0, flash:0, kickT:0, kickLeg:0, slideT:0
  };
}

/* converte slot tattico (percentuali lavagna verticale) in coordinate campo orizzontali.
   lavagna: x 0..100 (sinistra→destra), y 0..100 (attacco→porta propria; POR ~87)
   campo: side=+1 → difende la porta a sinistra (-x) e attacca a destra (+x) */
/* Converte la lavagna tattica (x,y in 0..100) in coordinate campo.
   side = +1 attacca verso +x (quindi DIFENDE la porta a -x). */
function slotToWorld(slot, side){
  var role=(slot&&slot.role)||'';
  var isGk = role==='POR'||role==='GK'||role==='P'||role==='PT';
  var lat = clamp(((slot&&slot.x!=null?slot.x:50)-50)/50, -1, 1);
  var wy = lat*(PH/2-3.6);
  if(isGk) return { x: side*(-HX+1.6), y: 0 };
  var a = clamp((86-(slot&&slot.y!=null?slot.y:50))/72, 0, 1); // 0 = difensore, 1 = punta
  var fromGoal = 11 + a*35;   // 11..46 m dalla PROPRIA porta => tutti nella propria metà
  return { x: side*(-HX+fromGoal), y: wy };
}


/* ---------- setup partita ---------- */
function setupMatch(cfg){
  G.cfg=cfg;
  G.state='prematch'; G.half=1; G.elapsed=0; G.halfLen=cfg.halfLen||180;
  G.score=[0,0]; G.events=[]; G.pens=null; G.etMode=false; G.goldenDone=false;
  G.stats={poss:[0,0],shots:[0,0],onT:[0,0],saves:[0,0],corners:[0,0]};
  G.teams=[
    { name:cfg.homeName, short:shortName(cfg.homeName), logo:cfg.homeLogo, kit:cfg.kits[0], ai:cfg.userSide!==0, score:0, side:1 },
    { name:cfg.awayName, short:shortName(cfg.awayName), logo:cfg.awayLogo, kit:cfg.kits[1], ai:cfg.userSide!==1, score:0, side:-1 }
  ];
  G.userTeam=cfg.userSide;
  G.players=[];
  for(var t=0;t<2;t++){
    var spec=(t===cfg.userSide)?cfg.userTeam:cfg.oppTeam;
    for(var i=0;i<11;i++){
      var sp=spec.players[i], slot=spec.formation[i];
      var p=mkPlayer(sp,slot,t,i);
      var w=slotToWorld(slot, t===0?1:-1);
      p.hx=w.x; p.hy=w.y;
      G.players.push(p);
    }
  }
  G.ball={x:0,y:0,z:0,vx:0,vy:0,vz:0,owner:null,lastTouch:null,lastPasser:null,lastPassT:-99,spin:0,shot:false,shotTeam:-1,shotPower:0};
  G.cam={shake:0};
  G.particles=[];
  G.msg=null; G.msgT=0;
  G.restart=null;
  G.slowmo=0;
  G.paused=false;
  resetPositions(0);
  CAM.x=0; CAM.y=0; CAM.z=computeZoom(); CAM.tx=0; CAM.ty=0;
}
function computeZoom(){
  var base=W/34;
  var air = G.ball && G.ball.z>1.2 ? Math.min(0.14, (G.ball.z-1.2)*0.022) : 0;
  var fast = G.ball && !G.ball.owner ? Math.min(0.07, len(G.ball.vx,G.ball.vy)*0.0022) : 0;
  return base*(1-air-fast);
}

function resetPositions(kickTeam){
  G.players.forEach(function(p){
    var side=G.teams[p.team].side;
    var f=G._slots[p.team][p.idx];
    var w=slotToWorld(f, side);
    if(p.gk){ w={ x: side*(-HX+1.6), y: 0 }; }
    p.hx=w.x; p.hy=w.y;
    p.x=p.hx; p.y=p.hy; p.vx=0; p.vy=0;
    p.face = side>0?0:Math.PI;
    p.diveT=0; p.celebrate=0; p.kickT=0; p.slideT=0;
  });
  var kt=G.teams[kickTeam];
  var kicker=nearestPlayer(kickTeam,0,0,function(p){return !p.gk;});
  var mate=nearestPlayer(kickTeam,0,4,function(p){return p!==kicker&&!p.gk;});
  if(kicker){ kicker.x=-0.9*kt.side; kicker.y=0.3; kicker.face=kt.side>0?0:Math.PI; }
  if(mate){ mate.x=-2.4*kt.side; mate.y=-2.6; }
  var b=G.ball;
  b.x=0;b.y=0;b.z=0;b.vx=0;b.vy=0;b.vz=0;b.curl=0;b.shot=false;b.offside=null;
  b.owner=kicker; b.lastTouch=kicker; b.lastPasser=null;
  G.controlled=null;
  if(!G.teams[G.userTeam].ai){
    var c=nearestPlayer(G.userTeam,0,0,function(p){return !p.gk;});
    if(c) switchControl(c);
  }
}

function nearestPlayer(team,x,y,filter){
  var best=null,bd=1e9;
  G.players.forEach(function(p){ if(p.team!==team) return; if(filter&&!filter(p)) return;
    var d=len(p.x-x,p.y-y); if(d<bd){bd=d;best=p;} });
  return best;
}
function teamPlayers(t){ return G.players.filter(function(p){return p.team===t;}); }
function gkOf(t){ return G.players[t*11]; }

/* ---------- macchina a stati ---------- */
function setState(s){ G.state=s; G.stateT=0; }
function showMsg(big,who,sub,dur){
  G.msg={big:big,who:who||'',sub:sub||'',img:null}; G.msgT=dur||2.2; updateBanner();
}

/* ---------- fisica ---------- */
function physStep(dt){
  var b=G.ball;
  if(!b.owner){
    var sp=len(b.vx,b.vy);
    if(b.curl && sp>0.6){                       // effetto Magnus: la palla curva
      var nx=-b.vy/sp, ny=b.vx/sp;
      b.vx+=nx*b.curl*dt; b.vy+=ny*b.curl*dt;
      b.curl*=Math.pow(0.45,dt);
    }
    b.x+=b.vx*dt; b.y+=b.vy*dt;
    if(b.z>0.0015||b.vz>0){
      b.z+=b.vz*dt; b.vz-=21.5*dt;
      var drag=Math.pow(0.986,dt*60);            // resistenza dell'aria
      b.vx*=drag; b.vy*=drag;
      if(b.z<=0){
        b.z=0; b.vz=-b.vz*0.56;
        if(Math.abs(b.vz)<1.25){ b.vz=0; }
        else spawnPuffs(b.x,b.y,2);
        b.vx*=0.82; b.vy*=0.82; b.curl*=0.5;
      }
    } else {
      var fr=Math.pow(0.33,dt);                  // attrito di rotolamento
      b.vx*=fr; b.vy*=fr;
      if(len(b.vx,b.vy)<0.12){ b.vx=0; b.vy=0; b.curl=0; }
    }
    b.spin+=len(b.vx,b.vy)*dt*1.8;
  } else {
    var o=b.owner;
    var os=len(o.vx,o.vy);
    var lead=0.46+os*0.052*((o.controlled&&sprinting())?1.7:1);
    b.x=o.x+Math.cos(o.face)*lead; b.y=o.y+Math.sin(o.face)*lead; b.z=0;
    b.vx=o.vx; b.vy=o.vy; b.vz=0; b.curl=0;
    b.spin+=os*dt*3;
  }
  handleBoundaries(b);

  G.players.forEach(function(p){
    p.tackleCd=Math.max(0,p.tackleCd-dt);
    p.slideCd=Math.max(0,p.slideCd-dt);
    p.kickT=Math.max(0,p.kickT-dt);
    p.slideT=Math.max(0,p.slideT-dt);
    if(p.flash>0)p.flash-=dt;
    p.x+=p.vx*dt; p.y+=p.vy*dt;
    p.x=clamp(p.x,-HX-5,HX+5); p.y=clamp(p.y,-HY-3.5,HY+3.5);
    var sp2=len(p.vx,p.vy);
    if(sp2>0.25){
      p.run+=sp2*dt*2.2;
      var want=Math.atan2(p.vy,p.vx);
      p.face=angNorm(p.face+angNorm(want-p.face)*Math.min(1,dt*14));
      p.lean=lerp(p.lean,clamp(sp2/8.5,0,1),dt*6);
    } else p.lean=lerp(p.lean,0,dt*6);
    var sThr=(p.maxSpd||8)*0.90;                       // soglia relativa al giocatore
    if(sp2>sThr) p.stamina=Math.max(0,p.stamina-(2.3+(1-(p.phy||70)/99)*1.7)*dt);
    else p.stamina=Math.min(100,p.stamina+(sp2<2.5?7.5:3.6)*dt);
  });

  for(var i=0;i<G.players.length;i++)for(var j=i+1;j<G.players.length;j++){
    var a=G.players[i],c=G.players[j],dx=c.x-a.x,dy=c.y-a.y,d=len(dx,dy);
    if(d<0.74&&d>0.0001){ var push=(0.74-d)*0.5; dx/=d; dy/=d; a.x-=dx*push; a.y-=dy*push; c.x+=dx*push; c.y+=dy*push; }
  }
  if(!b.owner) tryPickup(b);
  if(b.owner) G.stats.poss[b.owner.team]+=dt;
}

/* ===== REGOLA DEL FUORIGIOCO ===== */
function offsideLineX(attTeam){
  var side=G.teams[attTeam].side, defT=1-attTeam, xs=[];
  for(var i=0;i<11;i++) xs.push(G.players[defT*11+i].x*side);
  xs.sort(function(a,b){return b-a;});
  var secondP = xs.length>1 ? xs[1] : xs[0];
  return Math.max(secondP,0)*side;      // mai oltre la metà campo
}
function markOffside(passer){
  var b=G.ball;
  if(!passer||passer.gk){ b.offside=null; return; }
  var t=passer.team, side=G.teams[t].side;
  var lineP=Math.max(offsideLineX(t)*side, b.x*side);
  var list=[];
  for(var i=0;i<11;i++){
    var q=G.players[t*11+i];
    if(q===passer||q.gk) continue;
    if(q.x*side>lineP+0.5 && q.x*side>0.5) list.push(q);
  }
  b.offside=list.length?list:null;
  b.offsideTeam=t;
}
function whistleOffside(p){
  var b=G.ball, t=p.team;
  b.offside=null;
  beep('whistle');
  evToast('\uD83D\uDEA9 FUORIGIOCO \u00b7 '+(p.name||'').split(' ').pop());
  G.cam.shake=1.5;
  startRestart('freekick', 1-t, clamp(p.x,-HX+6,HX-6), clamp(p.y,-HY+4,HY-4));
}

function tryPickup(b){
  if(b.z>1.75) return;
  var speed=len(b.vx,b.vy);
  for(var i=0;i<G.players.length;i++){
    var p=G.players[i];
    if(p.diveT>0||p.slideT>0) continue;
    var d=len(p.x-b.x,p.y-b.y);
    if(d<0.66){
      if(b.offside){
        if(p.team===b.offsideTeam){
          if(b.offside.indexOf(p)>=0){ whistleOffside(p); return; }
          b.offside=null;
        } else b.offside=null;
      }
      var ctrl = p.gk ? (speed<13) : (speed < 15 + p.dri*0.13);
      if(ctrl || d<0.28){
        b.owner=p; b.shot=false; b.lastTouch=p; b.curl=0;
        if(p.team===G.userTeam && !G.teams[G.userTeam].ai) switchControl(p);
        return;
      } else {                                   // stop sporco: la palla schizza via
        var nx=(b.x-p.x)/(d||1), ny=(b.y-p.y)/(d||1);
        b.vx=nx*speed*0.38; b.vy=ny*speed*0.38; b.lastTouch=p; b.shot=false;
      }
    }
  }
}

function handleBoundaries(b){
  if(G.state!=='play'&&G.state!=='celebrate') return;
  var gkx = b.x>0 ? HX : -HX;
  if(Math.abs(b.x)>HX){
    var inGoalMouth = Math.abs(b.y)<GOAL_Y-0.05 && b.z<GOAL_H;
    if(inGoalMouth && Math.abs(b.x)>HX+0.25){
      var scoringTeam = b.x>0 ? (G.teams[0].side>0?0:1) : (G.teams[0].side>0?1:0);
      onGoal(scoringTeam); return;
    }
    if(Math.abs(Math.abs(b.y)-GOAL_Y)<0.14 && b.z<GOAL_H && b.x*b.vx>0){ b.vy=-b.vy*0.7; b.x=gkx-0.05*Math.sign(b.x); beep('kick'); }
    else if(Math.abs(b.y)<GOAL_Y+0.2 && Math.abs(b.z-GOAL_H)<0.14 && b.vz>0){ b.vz=-b.vz*0.55; b.vx*=-0.35; beep('kick'); }
    else if(Math.abs(b.x)>HX+2.6 || (Math.abs(b.x)>HX+0.4 && (Math.abs(b.y)>GOAL_Y || b.z>GOAL_H))){
      if(G.state==='play') endLineOut(b);
      return;
    }
  }
  if(Math.abs(b.y)>HY){ if(G.state==='play'){ sideOut(b); return; } b.y=clamp(b.y,-HY,HY); }
}

/* ---------- azioni ---------- */
function doPass(p, lob){
  var b=G.ball; if(b.owner!==p) return;
  var mv=p.controlled?moveVec():null;
  var mate=bestPassTarget(p, mv);
  if(!mate) return;
  var lead=0.5+len(mate.vx,mate.vy)*0.055;
  var tx=mate.x+mate.vx*lead, ty=mate.y+mate.vy*lead;
  var d=len(tx-p.x,ty-p.y);
  var dir=Math.atan2(ty-p.y,tx-p.x);
  dir += (1-p.pas/130)*rndR(-0.09,0.09)*(p.controlled?0.5:1);
  var spd = lob? clamp(d*0.92+7,9,18) : clamp(d*1.3+7.5,9.5,27);
  markOffside(p);
  b.owner=null; b.lastTouch=p; b.lastPasser=p; b.lastPassT=G.clock;
  b.vx=Math.cos(dir)*spd; b.vy=Math.sin(dir)*spd;
  b.vz = lob? clamp(d*0.33+2.4,3.2,9) : (d>15?1.5:0.35);
  b.curl = (1-p.pas/140)*rndR(-1.2,1.2);
  b.shot=false;
  p.face=dir; p.kickT=0.24; p.kickT0=0.24; p.kickType='pass'; p.kickLeg=(p.kickLeg+1)%2;
  beep('kick');
}

function bestPassTarget(p, mv){
  var best=null,bs=-1e9;
  var hasDir = mv && (Math.abs(mv.x)>0.25||Math.abs(mv.y)>0.25);
  var inAng = hasDir?Math.atan2(mv.y,mv.x):p.face;
  G.players.forEach(function(q){
    if(q.team!==p.team||q===p) return;
    var dx=q.x-p.x, dy=q.y-p.y, d=len(dx,dy);
    if(d<1||d>42) return;
    var ang=Math.abs(angNorm(Math.atan2(dy,dx)-inAng));
    if(ang>1.35) return;
    var side=G.teams[p.team].side;
    var forward = dx*side;
    var s = -ang*30 - d*0.35 + forward*(hasDir?0.5:1.4) + (q.gk?-40:0) + q.pas*0.05;
    if(s>bs){bs=s;best=q;}
  });
  return best;
}
function doShoot(p, power){
  var b=G.ball; if(b.owner!==p) return;
  var side=G.teams[p.team].side;
  var gx=HX*side, gy=0;                       // porta ATTACCATA
  var dGoal=len(gx-p.x, gy-p.y);
  var mv=p.controlled?moveVec():null;
  var toGoal=Math.atan2(gy-p.y,gx-p.x);
  var aim=toGoal;
  if(mv&&(Math.abs(mv.x)>0.3||Math.abs(mv.y)>0.3)){
    var want=Math.atan2(mv.y,mv.x);
    var blend=clamp(1-dGoal/48,0.22,0.72);    // più sei lontano, più conta la mira sulla porta
    aim=angNorm(toGoal+angNorm(want-toGoal)*(1-blend));
  }
  var shoN=clamp((p.sho-45)/50,0,1);
  var acc=(0.115-shoN*0.082)*(0.42+power*0.78)*(1+clamp((dGoal-16)/34,0,0.85));
  aim+=acc*rndR(-1,1)*(p.controlled?0.8:1);
  var spd=lerp(19,31,power)+shoN*7.6;
  markOffside(p);
  b.owner=null; b.lastTouch=p; b.shot=true; b.shotTeam=p.team; b.shotPower=power; b.saveTried=false;
  b.vx=Math.cos(aim)*spd; b.vy=Math.sin(aim)*spd;
  b.vz = dGoal>22 ? lerp(1.4,5.0,power) : lerp(0.35,3.2,power*power);
  b.curl = (mv? -mv.y*3.2:0) + rndR(-0.8,0.8)*(1-p.sho/130)*3;
  b.offside=null;
  p.face=aim; p.kickT=0.3; p.kickT0=0.34; p.kickType='shot'; p.kickLeg=(p.kickLeg+1)%2;
  G.stats.shots[p.team]++;
  G.cam.shake=Math.min(6,2+power*4.5);
  beep('kick'); spawnPuffs(b.x,b.y,6);
}

function doTackle(p, slide){
  if(p.tackleCd>0) return;
  p.tackleCd=slide?0.9:0.45;
  var b=G.ball, carrier=b.owner;
  var lunge = slide?3.4:2.0;
  var dir = carrier? Math.atan2(carrier.y-p.y,carrier.x-p.x) : p.face;
  p.vx+=Math.cos(dir)*lunge*2.6; p.vy+=Math.sin(dir)*lunge*2.6;
  if(!carrier||carrier.team===p.team) return;
  var d=len(carrier.x-p.x,carrier.y-p.y);
  if(d<(slide?1.7:1.15)){
    var win = clamp(0.42+(p.def-carrier.dri)*0.008+(slide?0.12:0)-(carrier.controlled?0.06:0),0.08,0.95);
    if(Math.random()<win){
      b.owner=null; b.lastTouch=p; b.shot=false;
      var pop=Math.atan2(b.y-p.y,b.x-p.x)+rndR(-0.6,0.6);
      b.vx=Math.cos(pop)*rndR(2,5); b.vy=Math.sin(pop)*rndR(2,5); b.vz=0.8;
      carrier.flash=0.35;
      spawnPuffs(carrier.x,carrier.y,4);
    } else {
      p.flash=0.3;
    }
  }
}
function switchControl(to){
  if(G.controlled) G.controlled.controlled=false;
  G.controlled=to;
  if(to) to.controlled=true;
}
function autoSwitch(){
  var b=G.ball;
  var t=G.userTeam;
  var target;
  if(b.owner&&b.owner.team===t) target=b.owner.gk?G.controlled:b.owner;
  else target=nearestPlayer(t,b.x+b.vx*0.25,b.y+b.vy*0.25,function(p){return !p.gk;});
  if(target&&target!==G.controlled) switchControl(target);
}

/* ---------- eventi: gol, rimesse, angoli ---------- */
function onGoal(team){
  var b=G.ball;
  G.score[team]++; G.stats.onT[team]++;
  var scorer=b.lastTouch, assist=null;
  var ownGoal = scorer && scorer.team!==team;
  if(ownGoal){ scorer = b.lastPasser && b.lastPasser.team===team ? b.lastPasser : scorer; }
  if(b.lastPasser && b.lastPasser.team===team && scorer && b.lastPasser!==scorer && (G.clock-b.lastPassT)<7) assist=b.lastPasser;
  var min=gameMinute();
  G.events.push({type:'goal', team:team, name:scorer?scorer.name:'—', img:scorer?scorer.img:null, min:min, own:ownGoal,
    assist:assist?assist.name:null, assistImg:assist?assist.img:null});
  beep('goal'); G.cam.shake=7;
  spawnConfetti(G.teams[team].kit.s, G.teams[team].kit.s2||'#ffffff');
  var label = G.etMode ? 'GOL — GOLDEN GOAL!' : 'GOOOL!';
  showMsg(label, (scorer?scorer.name:'')+(ownGoal?' (aut.)':'')+'  '+min+'\'', assist?('Assist: '+assist.name):G.teams[team].name, 2.6);
  G.msg.img=scorer?scorer.img:null; updateBanner();
  if(scorer) scorer.celebrate=2.4;
  updateScorebug();
  setState('celebrate');
  G.pendingKickoff = 1-team;
  if(G.etMode){ G.goldenDone=true; }
}
function endLineOut(b){
  var goalSide = b.x>0 ? 1 : -1;
  var defTeam = (G.teams[0].side===goalSide)?0:1;
  if(b.lastTouch && b.lastTouch.team===defTeam){ G.stats.corners[1-defTeam]++; startRestart('corner',1-defTeam, goalSide*HX, Math.sign(b.y)*HY); }
  else startRestart('goalkick', defTeam, goalSide*(HX-5.5), 0);
}
function sideOut(b){
  var t = b.lastTouch? 1-b.lastTouch.team : 0;
  startRestart('throw', t, clamp(b.x,-HX+1,HX-1), Math.sign(b.y)*(HY-0.3));
}
function startRestart(type, team, x, y){
  G.restart={type:type,team:team,x:x,y:y,t:0};
  setState('restart');
  var b=G.ball; b.vx=0;b.vy=0;b.vz=0;b.z=0;b.curl=0;b.shot=false;b.offside=null;
  var side=G.teams[team].side;
  if(type==='goalkick'){
    var gk=gkOf(team);
    gk.x=-side*(HX-5.5); gk.y=0; gk.vx=0; gk.vy=0;
    b.owner=gk; b.lastTouch=gk; b.x=gk.x; b.y=0;
    evToast('Rinvio dal fondo');
  } else if(type==='throw'){
    var th=nearestPlayer(team,x,y,function(p){return !p.gk;});
    if(th){ th.x=x; th.y=y; th.vx=0;th.vy=0; b.owner=th; b.lastTouch=th; b.x=x; b.y=y; }
    evToast('Rimessa laterale');
  } else if(type==='corner'){
    var ck=nearestPlayer(team,x*0.72,y*0.4,function(p){return !p.gk;});
    if(ck){ ck.x=x-Math.sign(x)*0.6; ck.y=y-Math.sign(y)*0.6; ck.vx=0;ck.vy=0; b.owner=ck; b.lastTouch=ck; b.x=ck.x; b.y=ck.y; }
    teamPlayers(team).forEach(function(p){
      if(p.gk||p===ck) return;
      if(p.hx*side > -8){ p.x=side*(HX-rndR(4.5,12)); p.y=rndR(-8,8); p.vx=0;p.vy=0; }
    });
    evToast('Calcio d\'angolo');
  } else if(type==='freekick'){
    var fk=nearestPlayer(team,x,y,function(p){return !p.gk;});
    if(fk){ fk.x=x-side*0.8; fk.y=y; fk.vx=0;fk.vy=0; b.owner=fk; b.lastTouch=fk; b.x=x; b.y=y; }
    G.players.forEach(function(q){                 // barriera a distanza regolamentare
      if(q.team===team||q.gk) return;
      var d=len(q.x-x,q.y-y);
      if(d<9.15&&d>0.01){ q.x=x+(q.x-x)/d*9.15; q.y=y+(q.y-y)/d*9.15; q.vx=0;q.vy=0; }
    });
  }
}

function playRestart(dt){
  var r=G.restart; r.t+=dt;
  var wait = (r.type==='freekick'||r.type==='corner') ? 1.25 : 0.85;
  if(r.t<wait) return;
  var b=G.ball, p=b.owner;
  if(!p){ G.restart=null; setState('play'); return; }
  var side=G.teams[p.team].side;
  if(p.team===G.userTeam && !G.teams[G.userTeam].ai && r.type!=='goalkick'){
    switchControl(p);                    // le rimesse le batte il giocatore umano
    G.restart=null; setState('play'); return;
  }
  if(r.type==='goalkick'){
    var target=nearestPlayer(p.team, side*10, rndR(-16,16), function(q){return !q.gk;});
    if(target){ markOffside(p); kickBallTo(p, target.x, target.y, 25, 7.5); }
  } else if(r.type==='throw'||r.type==='freekick'){
    var mate=bestPassTarget(p,null)||nearestPlayer(p.team,p.x,p.y,function(q){return q!==p&&!q.gk;});
    if(mate){ markOffside(p); kickBallTo(p, mate.x+mate.vx*0.4, mate.y+mate.vy*0.4, clamp(len(mate.x-p.x,mate.y-p.y)*1.25+6,8,22), r.type==='freekick'?3.5:1.2); }
  } else if(r.type==='corner'){
    markOffside(p);
    kickBallTo(p, side*(HX-7.5), rndR(-3,3), 17, 6.4);
  }
  p.kickT=0.26; p.kickT0=0.26; p.kickType='pass';
  G.restart=null; setState('play');
}

function kickBallTo(p, tx, ty, spd, vz){
  var b=G.ball; var d=len(tx-p.x,ty-p.y); if(d<0.1)d=0.1;
  b.owner=null; b.lastTouch=p; b.lastPasser=p; b.lastPassT=G.clock;
  b.vx=(tx-p.x)/d*spd; b.vy=(ty-p.y)/d*spd; b.vz=vz; b.shot=false;
  p.face=Math.atan2(ty-p.y,tx-p.x);
  beep('kick');
}

/* ---------- orologio ---------- */
function gameMinute(){
  if(G.etMode) return 90;
  var total=G.halfLen*2;
  var t=((G.half-1)*G.halfLen + G.elapsed)/total;
  return clamp(Math.floor(t*90)+1,1,90);
}

/* ---------- IA ---------- */
function steer(p, tx, ty, dt, spdMul){
  var dx=tx-p.x, dy=ty-p.y, d=len(dx,dy);
  if(d<0.05){ p.vx*=Math.pow(0.1,dt); p.vy*=Math.pow(0.1,dt); return; }
  var want = Math.min(p.maxSpd*(spdMul||1), d*3.2);
  var wx=dx/d*want, wy=dy/d*want;
  var k=clamp(p.acc*dt/Math.max(0.001,want)*3,0,1);
  p.vx=lerp(p.vx,wx,k);
  p.vy=lerp(p.vy,wy,k);
}
function aiTick(dt){
  var b=G.ball;
  var ballTeam = b.owner? b.owner.team : -1;
  /* MEMORIA POSSESSO: con la palla in volo dopo un passaggio, la squadra che
     l'ha giocata resta "in attacco" per un paio di secondi. */
  if(ballTeam<0 && b.lastPasser && typeof b.lastPassT==='number'){
    var _dtp=(G.clock||0)-b.lastPassT;
    if(_dtp>=0 && _dtp<2.2) ballTeam=b.lastPasser.team;
  }

  for(var t=0;t<2;t++){
    var side=G.teams[t].side;
    var bP=b.x*side, bY=b.y;                        // palla in "avanzamento" per la squadra t
    var attacking = ballTeam===t, defending = ballTeam===(1-t);
    var offP = offsideLineX(t)*side;                 // linea del fuorigioco (proiettata)
    var presser = nearestPlayer(t,b.x,b.y,function(q){return !q.gk;});
    var second  = nearestPlayer(t,b.x,b.y,function(q){return q!==presser&&!q.gk;});
    var cpu = (t===G.userTeam) ? 0 : clamp((G.cfg.oppStr-75)*0.01,-0.1,0.2);
    for(var i=0;i<11;i++){
      var p=G.players[t*11+i];
      if(p.gk){ if(!p.controlled) gkAI(p,dt); continue; }
      if(p.controlled) continue;
      if(p.diveT>0){ p.diveT-=dt; continue; }
      if(p.slideT>0){ p.slideT-=dt; p.vx*=0.9; p.vy*=0.9; continue; }
      if(p.celebrate>0){ p.celebrate-=dt; p.vx*=0.88; p.vy*=0.88; continue; }
      if(b.owner===p){ carrierAI(p,dt,cpu); continue; }

      var hP=p.hx*side, hY=p.hy;
      var line=clamp((hP+HX)/PW,0,1);                // 0 = terzino/centrale, 1 = punta
      var isAtt=line>0.62, isDef=line<0.34;
      var tP,tY,spd=0.84;

      if(attacking){
        var push=clamp((bP+HX)/PW,0,1)*26;
        tP=hP+push*(isDef?0.46:1.20);
        tY=lerp(hY,bY,isAtt?0.3:0.2);
        if(isAtt){
          // la punta ATTACCA LA PROFONDITA': sale sulla linea del fuorigioco
          var depth=Math.max(bP+22, hP+push+16);
          tP=Math.min(offP-1.1, Math.max(depth, 8));   // resta alta, mai sotto meta' campo
          tY=lerp(hY*0.70, clamp(bY,-19,19), 0.32);
        }
        spd=isAtt?1.0:0.92;
        /* vicino all'area la punta si accentra invece di restare larga */
        if(isAtt && bP>10) tY=lerp(tY, clamp(bY*0.35,-13,13), 0.55);
      } else if(defending){
        if(p===presser){
          tP=(b.x+b.vx*0.16)*side; tY=b.y+b.vy*0.16; spd=1.0;
          var dd=len(p.x-b.x,p.y-b.y);
          if(dd<1.7 && p.tackleCd<=0) doTackle(p,false);
        } else if(p===second){
          tP=lerp(bP,-HX,0.2); tY=lerp(bY,0,0.3); spd=0.95;
          /* anche il secondo uomo prova il contrasto se e' addosso alla palla */
          if(len(p.x-b.x,p.y-b.y)<1.15 && p.tackleCd<=0) doTackle(p,false);
        } else {
          tP=lerp(hP,bP-13,0.5);
          tY=lerp(hY,bY,0.32);
          if(isDef) tP=clamp(bP-9, -HX+5.5, hP+8);     // linea difensiva compatta
          spd=0.87;
        }
      } else {
        if(p===presser||p===second){ tP=(b.x+b.vx*0.28)*side; tY=b.y+b.vy*0.28; spd=1.0; }
        else { tP=lerp(hP,bP,0.26); tY=lerp(hY,bY,0.26); spd=0.8; }
      }

      if(attacking && isAtt) tP=Math.min(tP, offP-0.7);   // MAI in fuorigioco
      tP=clamp(tP,-HX+2.5,HX-2);
      tY=clamp(tY,-HY+1.8,HY-1.8);
      steer(p, tP*side, tY, dt, spd);
    }
  }
}

function carrierAI(p, dt, diff){
  var b=G.ball, side=G.teams[p.team].side;
  var gx=HX*side, gy=0;
  var dGoal=len(gx-p.x,gy-p.y);
  var press=nearestPlayer(1-p.team,p.x,p.y,function(q){return !q.gk;});
  var dPress=press?len(press.x-p.x,press.y-p.y):99;

  if(dGoal<23 && Math.abs(p.y)<17){
    var sp=clamp(0.5+(p.sho-75)*0.02-dGoal*0.011+(diff||0),0.05,0.9);
    if(Math.random()<sp*dt*3.4){ doShoot(p, clamp(rndR(0.45,0.95)-dGoal*0.008,0.3,1)); return; }
  }
  if(dPress<2.3 || Math.random()<dt*0.55){
    var mate=bestPassTarget(p,null);
    if(mate && (dPress<1.8 || Math.random()<dt*0.9)){
      doPass(p, len(mate.x-p.x,mate.y-p.y)>22);
      return;
    }
  }
  var dir=Math.atan2(gy-p.y,gx-p.x);
  if(dPress<3.2 && press){
    var away=Math.atan2(p.y-press.y,p.x-press.x);
    var sgn=angNorm(away-dir)>0?1:-1;
    dir=angNorm(lerp(dir,away,0.4)+sgn*clamp(1-dPress/3.2,0,1)*0.7);
  }
  if(Math.abs(p.y)>HY-6) dir=angNorm(lerp(dir,Math.atan2(-p.y,Math.cos(dir)*8),0.35));
  steer(p, p.x+Math.cos(dir)*7, p.y+Math.sin(dir)*7, dt, dPress<2.6?1.0:0.9);
}

function gkAI(p, dt){
  var b=G.ball, side=G.teams[p.team].side;
  var gx=-side*HX;                                   // ← LA PORTA CHE DIFENDE
  if(p.diveT>0){
    p.diveT-=dt; p.vx*=0.9; p.vy*=0.9;
    if(p.diveT<=0){ p.vx=0; p.vy=0; }
    return;
  }
  // rinvio / rilancio
  if(b.owner===p){
    p.vx*=0.8; p.vy*=0.8;
    p.aiThink-=dt;
    if(p.aiThink<=0){
      var mate=bestPassTarget(p,null)||nearestPlayer(p.team, gx+side*28, rndR(-18,18), function(q){return !q.gk;});
      if(mate){
        var dd=len(mate.x-p.x,mate.y-p.y);
        markOffside(p);
        kickBallTo(p, mate.x+mate.vx*0.4, mate.y+mate.vy*0.4, clamp(dd*1.15+8,11,27), dd>20?6.5:1.4);
        p.kickT=0.28; p.kickT0=0.30; p.kickType='clear';
      }
      p.aiThink=1.1;
    }
    return;
  }
  var dBall=len(b.x-gx,b.y);
  // PARATA: prevede dove arriva il tiro sulla linea di porta
  if(!b.owner && Math.abs(b.vx)>2.5 && (b.x-gx)*b.vx<0){
    var tHit=(gx-b.x)/b.vx;
    if(tHit>0 && tHit<1.15){
      var yAt=b.y+b.vy*tHit;
      var zAt=Math.max(0, b.z + b.vz*tHit - 0.5*21.5*tHit*tHit);
      if(Math.abs(yAt)<GOAL_Y+1.1 && zAt<GOAL_H+0.6){
        var skill=clamp(p.def||70,40,99);
        var reach=(1.45+skill*0.017)*clamp(tHit/0.42,0.5,1.15);
        var dY=Math.abs(yAt-p.y);
        if(tHit<0.6 && dY<reach){
          p.diveT=0.62; p.diveDir=(yAt>=p.y)?1:-1;
          p.vy=p.diveDir*Math.min(10, Math.max(2, dY/Math.max(0.13,tHit)));
          p.vx=side*0.8;
          if(b.saveTried){ return; }          // un tiro = un solo tentativo di parata
          b.saveTried=true;
          var shooter=b.lastTouch, sho=clamp((shooter&&shooter.sho)||70,40,99);
          var corner=clamp(Math.abs(yAt)/(GOAL_Y+0.15),0,1), high=clamp(zAt/GOAL_H,0,1);
          var saveP=clamp(0.78-(b.shotPower||0.5)*0.18-dY*0.11-(corner*0.24+high*0.12)+(skill-sho)*0.006, 0.05, 0.93);
          if(Math.random()<saveP){
            G.stats.saves[p.team]++;
            if(b.shotTeam>=0) G.stats.onT[b.shotTeam]++;
            if((b.shotPower||0.5)<0.34 && dY<0.9){          // presa sicura
              b.owner=p; b.vx=0;b.vy=0;b.vz=0;b.z=0;b.curl=0; b.shot=false; b.lastTouch=p; p.aiThink=1.0;
              evToast('\uD83E\uDDE4 Bloccata da '+p.name.split(' ').pop());
            } else {                                        // respinta
              b.vx=side*rndR(6,12); b.vy=p.diveDir*rndR(3,9); b.vz=Math.max(1.6,Math.abs(b.vz)*0.5);
              b.curl=0; b.shot=false; b.lastTouch=p;
              evToast('\uD83E\uDDE4 Parata di '+p.name.split(' ').pop()+'!');
            }
            spawnPuffs(p.x,p.y,7); G.cam.shake=2.4;
          }
          return;
        }
      }
    }
  }
  // uscita sul pallone vagante in area
  var inBox = Math.abs(b.x-gx)<BOX_D && Math.abs(b.y)<BOX_W/2;
  if(inBox){
    var rival=nearestPlayer(1-p.team,b.x,b.y,function(q){return !q.gk;});
    var dGkBall=len(p.x-b.x,p.y-b.y);
    var dRival=rival?len(rival.x-b.x,rival.y-b.y):99;
    if(!b.owner && (dGkBall<dRival+0.6 || dGkBall<3.2)){
      steer(p,b.x,b.y,dt,1.06);
      if(dGkBall<1.05 && b.z<1.9){ b.owner=p; b.lastTouch=p; b.shot=false; b.vx=0;b.vy=0;b.vz=0;b.curl=0; p.aiThink=0.9; }
      return;
    }
    if(b.owner && b.owner.team!==p.team && len(b.owner.x-gx,b.owner.y)<4.6){
      steer(p,b.owner.x,b.owner.y,dt,1.02);        // esce a chiudere lo specchio
      if(len(p.x-b.owner.x,p.y-b.owner.y)<0.78 && Math.random()<clamp(0.14+(p.def-70)*0.005,0.04,0.38)*dt*2.2){
        b.owner=null; b.lastTouch=p; b.shot=false;
        b.vx=side*rndR(4,9); b.vy=rndR(-5,5); b.vz=1.2;
        G.stats.saves[p.team]++;
      }
      return;
    }
  }
  // posizione base: sulla linea, accorcia l'angolo in base alla minaccia
  var adv=clamp(1.5+(1-clamp(dBall/42,0,1))*4.2, 1.2, 6.0);
  var homeX=gx+side*adv;
  var homeY=clamp(b.y*(0.42-0.2*clamp(dBall/50,0,1)), -GOAL_Y-1.4, GOAL_Y+1.4);
  steer(p, homeX, homeY, dt, 0.95);
  p.face = side>0?0:Math.PI;
}


/* ---------- input del giocatore umano ---------- */
function userTick(dt){
  var c=G.controlled, b=G.ball;
  if(!c||c.team!==G.userTeam) { autoSwitch(); c=G.controlled; if(!c) return; }
  var mv=moveVec();
  var spr=sprinting() && c.stamina>2;
  var spdMul=(spr?1.23:1)*(c.stamina<25?0.90:1);
  var want=c.maxSpd*spdMul;
  var txv=mv.x*want, tyv=mv.y*want;
  var k=clamp(c.acc*dt/Math.max(0.001,len(txv,tyv))*2.4,0,1);
  if(len(mv.x,mv.y)<0.08){ k=clamp(14*dt,0,1); txv=0; tyv=0; }
  c.vx=lerp(c.vx,txv,k); c.vy=lerp(c.vy,tyv,k);
  if(IN.shotDown) IN.shotHeld+=dt;
  if(IN.passDown) IN.passHeld+=dt;
  var hasBall=b.owner===c;
  if(IN.shotEdge) IN.shotCharging=hasBall;
  if(!IN.shotDown && IN.shotCharging){
    if(hasBall) doShoot(c, clamp(IN.shotHeld/0.85,0.18,1));
    IN.shotCharging=false; IN.shotHeld=0;
  }
  if(IN.shotEdge && !hasBall){ doTackle(c,true); }
  if(!IN.passDown && IN.passHeld>0){
    if(hasBall) doPass(c, IN.passHeld>0.26);
    IN.passHeld=0;
  }
  if(IN.passEdge && !hasBall){ doTackle(c,false); }
  if(IN.switchEdge){ switchControl(nearestPlayer(G.userTeam,b.x+b.vx*0.3,b.y+b.vy*0.3,function(p){return !p.gk&&p!==G.controlled;})); }
  if(b.owner && b.owner.team===G.userTeam && b.owner!==c && !b.owner.gk) switchControl(b.owner);
  if(!b.owner && c.gk) autoSwitch();
  IN.passEdge=false; IN.shotEdge=false; IN.switchEdge=false;
}

/* ---------- camera ---------- */
function camTick(dt){
  var b=G.ball;
  if(G.state==='pens') return; // camera gestita dai rigori
  var look=0.42;
  // il limite dipende da quanto si vede: cosi' la porta (e la rete) entra SEMPRE in quadro
  var halfV=(W/Math.max(1,CAM.z))*0.5;
  var limX=Math.max(8, HX + 6.5 - halfV);
  var limY=Math.max(6, HY + 3.5 - halfV*TILT*0.92);
  CAM.tx=clamp(b.x+b.vx*look*0.5, -limX, limX);
  CAM.ty=clamp(b.y+b.vy*look*0.5, -limY, limY);
  var k=1-Math.pow(0.0015,dt);
  CAM.x=lerp(CAM.x,CAM.tx,k);
  CAM.y=lerp(CAM.y,CAM.ty,k);
  var tz=computeZoom();
  CAM.z=lerp(CAM.z,tz,1-Math.pow(0.02,dt));
  if(G.cam.shake>0) G.cam.shake=Math.max(0,G.cam.shake-dt*14);
}

/* ---------- particelle ---------- */
function spawnPuffs(x,y,n){ for(var i=0;i<n;i++) G.particles.push({x:x,y:y,z:0.05,vx:rndR(-2,2),vy:rndR(-2,2),vz:rndR(1,3),t:0.5,c:'#cfe8c9',r:rndR(0.1,0.22)}); }
function spawnConfetti(c1,c2){ for(var i=0;i<90;i++) G.particles.push({x:rndR(-8,8),y:rndR(-6,2),z:rndR(2,9),vx:rndR(-3,3),vy:rndR(-3,3),vz:rndR(1,4),t:rndR(1,2),c:Math.random()<0.5?c1:c2,r:rndR(0.12,0.3)}); }
function partTick(dt){ for(var i=G.particles.length-1;i>=0;i--){ var p=G.particles[i]; p.t-=dt; if(p.t<=0){G.particles.splice(i,1);continue;} p.x+=p.vx*dt;p.y+=p.vy*dt;p.z=Math.max(0,p.z+p.vz*dt);p.vz-=9*dt; } }

/* ================= RENDERING ================= */
function drawFrame(){
  if(!ctx) return;
  // ---- RENDERER 3D (WebGL). Se non parte, si continua col 2D. ----
  if(M26GL && !M26GL.failed && M26GL.frame && M26GL.frame()){
    try{
      ctx.setTransform(DPR,0,0,DPR,0,0);
      ctx.clearRect(0,0,W,H);
      if(typeof drawRadar==='function') drawRadar();
      if(M26GL.hud) M26GL.hud();
    }catch(e){}
    return;
  }
  var stage='init';
  try{
    ctx.setTransform(DPR,0,0,DPR,0,0);
    // fondo VERDE (mai nero): se qualcosa fallisce, si vede comunque un campo
    ctx.fillStyle='#0e3a1c'; ctx.fillRect(0,0,W,H);

    // costruzione difensiva delle canvas pre-renderizzate
    stage='build';
    if(!pitchCv){ try{ buildPitch(); }catch(e){ pitchCv=null; noteDrawErr('pitch',e); } }
    if(!stadCv){ try{ buildStadium(); }catch(e){ stadCv=null; noteDrawErr('stadio',e); } }

    var shx=G.cam&&G.cam.shake>0?rndR(-G.cam.shake,G.cam.shake)*0.4:0;
    var shy=G.cam&&G.cam.shake>0?rndR(-G.cam.shake,G.cam.shake)*0.4:0;
    var z=CAM.z;
    ctx.setTransform(DPR*z,0,0,DPR*z*TILT, DPR*(W/2 - CAM.x*z + shx), DPR*(H*0.52 - CAM.y*z*TILT + shy));

    stage='campo';
    if(stadCv && stadCv.width>0){ try{ ctx.drawImage(stadCv, -HX-26, -HY-26, PW+52, PH+52); }catch(e){ noteDrawErr('stadio',e); } }
    if(pitchCv && pitchCv.width>0){
      try{ ctx.drawImage(pitchCv, -HX, -HY, PW, PH); }
      catch(e){ noteDrawErr('campo',e); drawPitchVector(); }
    } else {
      drawPitchVector();               // campo disegnato a vettori: non puo' fallire
    }

    stage='bordocampo';
    try{ drawBoards(); }catch(e){ noteDrawErr('bordocampo',e); }

    ctx.setTransform(DPR,0,0,DPR,0,0);
    stage='porte';
    try{ drawGoals(false); }catch(e){ noteDrawErr('porte',e); }

    stage='entita';
    var ents=[];
    G.players.forEach(function(p){ ents.push({y:p.y,k:'p',o:p}); });
    ents.push({y:G.ball.y+0.01,k:'b',o:G.ball});
    G.particles.forEach(function(pt){ ents.push({y:pt.y,k:'pt',o:pt}); });
    ents.sort(function(a,b){return a.y-b.y;});
    ents.forEach(function(e){
      try{
        if(e.k==='p') drawPlayer(e.o);
        else if(e.k==='b') drawBall(e.o);
        else drawParticle(e.o);
      }catch(err){ noteDrawErr(e.k==='p'?'giocatore':'oggetto',err); }
    });

    stage='porte2';
    try{ drawGoals(true); }catch(e){ noteDrawErr('porte',e); }
    try{ drawAimReticle(); }catch(e){ noteDrawErr('mirino',e); }

    stage='vignetta';
    try{
      var vg=ctx.createRadialGradient(W/2,H*0.5,H*0.42,W/2,H*0.5,H*0.95);
      vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(4,8,14,0.30)');
      ctx.fillStyle=vg; ctx.fillRect(0,0,W,H);
    }catch(e){}

    try{ drawRadar(); }catch(e){ noteDrawErr('radar',e); }

    // messaggio diagnostico a schermo (una riga) se qualcosa e' andato storto
    if(G._drawErr){
      ctx.setTransform(DPR,0,0,DPR,0,0);
      ctx.font='600 12px system-ui, sans-serif'; ctx.textAlign='left'; ctx.textBaseline='top';
      ctx.fillStyle='rgba(0,0,0,.62)'; ctx.fillRect(8,H-26,Math.min(W-16,ctx.measureText(G._drawErr).width+16),18);
      ctx.fillStyle='#ffd54f'; ctx.fillText(G._drawErr,16,H-24);
    }
  }catch(err){
    // rete di sicurezza finale: campo verde + messaggio, MAI schermo nero
    try{
      ctx.setTransform(DPR,0,0,DPR,0,0);
      ctx.fillStyle='#15803d'; ctx.fillRect(0,0,W,H);
      noteDrawErr(stage,err);
      ctx.font='600 13px system-ui, sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillStyle='#fff'; ctx.fillText('Errore grafico ('+stage+'): '+(err&&err.message||err),W/2,H/2);
    }catch(e2){}
  }
}

/* registra il primo errore di disegno, senza inondare la console */
function noteDrawErr(dove,e){
  if(G._drawErr) return;
  G._drawErr='\u26A0 '+dove+': '+((e&&e.message)||e);
  try{ console.error('[M26 disegno]',dove,e); }catch(x){}
}

/* campo disegnato a vettori (fallback che non usa canvas pre-renderizzate) */
function drawPitchVector(){
  var bands=14, bw=PW/bands;
  for(var i=0;i<bands;i++){
    ctx.fillStyle=(i%2)?'#3f9e4d':'#45a854';
    ctx.fillRect(-HX+i*bw, -HY, bw+0.02, PH);
  }
  ctx.strokeStyle='rgba(255,255,255,.92)'; ctx.lineWidth=0.13;
  ctx.strokeRect(-HX,-HY,PW,PH);
  ctx.beginPath(); ctx.moveTo(0,-HY); ctx.lineTo(0,HY); ctx.stroke();
  ctx.beginPath(); ctx.arc(0,0,9.15,0,Math.PI*2); ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,.92)';
  ctx.beginPath(); ctx.arc(0,0,0.25,0,Math.PI*2); ctx.fill();
  [-1,1].forEach(function(s){
    ctx.strokeRect(s>0?HX-BOX_D:-HX, -BOX_W/2, BOX_D, BOX_W);
    ctx.strokeRect(s>0?HX-5.5:-HX, -9.16, 5.5, 18.32);
    ctx.beginPath(); ctx.arc(s*(HX-SPOT),0,0.22,0,Math.PI*2); ctx.fill();
  });
}

function drawBoards(){
  var t=G.clock*2.2;
  ctx.save();
  ctx.fillStyle='#0c1420';
  ctx.fillRect(-HX-0.4,-HY-3.1,PW+0.8,1.5);
  ctx.fillRect(-HX-0.4,HY+1.6,PW+0.8,1.5);
  ctx.font='700 1.05px Oswald, sans-serif';
  ctx.textBaseline='middle';
  var txt='  KFM27  ⚽  '+(G.cfg.comp||'PARTITA').toUpperCase()+'  ⚽  ';
  var tw=ctx.measureText(txt).width;
  var off=-(t%(tw*2));
  ctx.fillStyle='#dfe9f5';
  for(var x=-HX+off; x<HX; x+=tw*2){ ctx.fillText(txt,x,-HY-2.32); }
  var off2=-((t*0.8+30)%(tw*2));
  for(var x2=-HX+off2; x2<HX; x2+=tw*2){ ctx.fillText(txt,x2,HY+2.38); }
  ctx.restore();
}
function drawGoals(front){
  [-1,1].forEach(function(s){
    var gx=s*HX, depth=2.2;
    if(!front){
      ctx.save();
      // sacca della rete (pannelli)
      var bl=project(gx,-GOAL_Y,0), br=project(gx,GOAL_Y,0);
      var tl=project(gx,-GOAL_Y,GOAL_H), tr=project(gx,GOAL_Y,GOAL_H);
      var Bl=project(gx+s*depth,-GOAL_Y*0.92,0), Br=project(gx+s*depth,GOAL_Y*0.92,0);
      var Tl=project(gx+s*depth,-GOAL_Y*0.92,GOAL_H*0.72), Tr=project(gx+s*depth,GOAL_Y*0.92,GOAL_H*0.72);
      ctx.beginPath(); ctx.moveTo(tl.x,tl.y); ctx.lineTo(tr.x,tr.y); ctx.lineTo(Tr.x,Tr.y); ctx.lineTo(Tl.x,Tl.y); ctx.closePath();
      ctx.fillStyle='rgba(228,238,248,0.13)'; ctx.fill();
      ctx.beginPath(); ctx.moveTo(Bl.x,Bl.y); ctx.lineTo(Br.x,Br.y); ctx.lineTo(Tr.x,Tr.y); ctx.lineTo(Tl.x,Tl.y); ctx.closePath();
      ctx.fillStyle='rgba(210,224,238,0.10)'; ctx.fill();
      // maglie della rete
      ctx.strokeStyle='rgba(236,244,252,0.30)'; ctx.lineWidth=Math.max(0.7,CAM.z*0.022);
      var i;
      for(i=0;i<=10;i++){
        var yy=lerp(-GOAL_Y,GOAL_Y,i/10);
        var a=project(gx,yy,GOAL_H), c2=project(gx+s*depth,yy*0.92,GOAL_H*0.72);
        var a2=project(gx,yy,0), c3=project(gx+s*depth,yy*0.92,0);
        ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(c2.x,c2.y); ctx.lineTo(c3.x,c3.y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(a2.x,a2.y); ctx.lineTo(a.x,a.y); ctx.stroke();
      }
      for(i=1;i<6;i++){
        var zz=GOAL_H*i/6;
        var e1=project(gx,-GOAL_Y,zz), e2=project(gx,GOAL_Y,zz);
        var f1=project(gx+s*depth,-GOAL_Y*0.92,zz*0.72), f2=project(gx+s*depth,GOAL_Y*0.92,zz*0.72);
        ctx.beginPath(); ctx.moveTo(e1.x,e1.y); ctx.lineTo(e2.x,e2.y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(f1.x,f1.y); ctx.lineTo(f2.x,f2.y); ctx.stroke();
      }
      ctx.restore();
    } else {
      ctx.save();
      var lw=Math.max(2.4,CAM.z*0.13);
      var b1=project(gx,-GOAL_Y,0), t1=project(gx,-GOAL_Y,GOAL_H);
      var b2=project(gx,GOAL_Y,0), t2=project(gx,GOAL_Y,GOAL_H);
      ctx.lineCap='round';
      ctx.strokeStyle='rgba(0,0,0,.28)'; ctx.lineWidth=lw*1.5;
      ctx.beginPath(); ctx.moveTo(b1.x+lw*0.4,b1.y); ctx.lineTo(t1.x+lw*0.4,t1.y); ctx.lineTo(t2.x+lw*0.4,t2.y); ctx.lineTo(b2.x+lw*0.4,b2.y); ctx.stroke();
      var grd=ctx.createLinearGradient(0,t1.y,0,b1.y);
      grd.addColorStop(0,'#ffffff'); grd.addColorStop(1,'#c9d6e2');
      ctx.strokeStyle=grd; ctx.lineWidth=lw;
      ctx.beginPath(); ctx.moveTo(b1.x,b1.y); ctx.lineTo(t1.x,t1.y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(b2.x,b2.y); ctx.lineTo(t2.x,t2.y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(t1.x,t1.y); ctx.lineTo(t2.x,t2.y); ctx.stroke();
      ctx.restore();
    }
  });
}

function kitBodyPath(x,y,r){ ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); }
function drawPlayer(p){
  var g=project(p.x,p.y,0);
  var z=CAM.z, m=z*ZLIFT;
  var hgt=p.hgt||1;
  var spd=len(p.vx,p.vy);
  var spdN=clamp(spd/(p.maxSpd||8),0,1);
  var fx=Math.cos(p.face), fy=Math.sin(p.face);
  var dir=fx>=0?1:-1;                       // verso sullo schermo
  var back=fy<-0.15;                        // di spalle
  var skin=p.skin, hair=p.hair;

  // ---- MAGLIA: il portiere ha una divisa diversa (cosi' si riconosce sempre) ----
  var kit=G.teams[p.team].kit;
  if(p.gk){
    kit = (p.team===0) ? {s:'#16D6A4',s2:'#0B7F62',p:'solid',sh:'#0B7F62'}
                       : {s:'#FFC93C',s2:'#C98F1E',p:'solid',sh:'#C98F1E'};
  }
  var shortsCol=kit.sh||shade(kit.s,-40);
  shortsCol=shade(shortsCol,-14);
  var sockCol=shade(kit.s2||kit.s,30);
  var bootCol=(p.idx%3===0)?'#f5f5f5':((p.idx%3===1)?'#12161d':'#ff4d3d');

  // ---- OMBRA ----
  ctx.save();
  var shR=z*0.40*hgt;
  ctx.translate(g.x+z*0.11, g.y+z*0.05); ctx.scale(1,0.40);
  var sg=ctx.createRadialGradient(0,0,0,0,0,shR);
  sg.addColorStop(0,'rgba(3,11,6,0.46)');
  sg.addColorStop(0.55,'rgba(3,11,6,0.27)');
  sg.addColorStop(1,'rgba(3,11,6,0)');
  ctx.fillStyle=sg; ctx.beginPath(); ctx.arc(0,0,shR,0,Math.PI*2); ctx.fill();
  ctx.restore();

  // ---- INDICATORE GIOCATORE CONTROLLATO ----
  if(p.controlled){
    var pl=1+Math.sin(G.clock*5)*0.07;
    ctx.save();
    ctx.strokeStyle='rgba(255,255,255,.92)'; ctx.lineWidth=Math.max(1.8,z*0.055);
    ctx.beginPath(); ctx.ellipse(g.x,g.y+z*0.03, z*0.42*pl, z*0.19*pl, 0,0,Math.PI*2); ctx.stroke();
    ctx.strokeStyle='rgba(0,230,122,.65)'; ctx.lineWidth=Math.max(1.2,z*0.035);
    ctx.beginPath(); ctx.ellipse(g.x,g.y+z*0.03, z*0.52*pl, z*0.235*pl, 0,0,Math.PI*2); ctx.stroke();
    ctx.restore();
  }

  ctx.save();
  ctx.translate(g.x, g.y);
  var diving=p.diveT>0;
  if(diving) ctx.rotate(p.diveDir*clamp((0.62-p.diveT)*4.2,0,1)*1.15);
  else if(p.slideT>0) ctx.rotate(dir*0.9);

  function PX(a){ return a*z; }
  function PY(h){ return -h*m; }
  /* arto con volume: quadrilatero rastremato + giunti tondi */
  function limb(x1,h1,x2,h2,w1,w2,col){
    var ax=PX(x1), ay=PY(h1), bx=PX(x2), by=PY(h2);
    var dx=bx-ax, dy=by-ay, L=Math.sqrt(dx*dx+dy*dy)||1;
    var nx=-dy/L, ny=dx/L;
    function seg(A,B,c){
      ctx.fillStyle=c;
      ctx.beginPath();
      ctx.moveTo(ax+nx*A, ay+ny*A);
      ctx.lineTo(bx+nx*B, by+ny*B);
      ctx.lineTo(bx-nx*B, by-ny*B);
      ctx.lineTo(ax-nx*A, ay-ny*A);
      ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.arc(ax,ay,A,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(bx,by,B,0,Math.PI*2); ctx.fill();
    }
    var W1=PX(w1), W2=PX(w2);
    var ow=Math.max(0.9, z*0.013);
    seg(W1+ow, W2+ow, 'rgba(6,12,9,0.58)');   // contorno: stacca l'arto dall'erba
    seg(W1, W2, col);
  }

  // ============ ANIMAZIONE: stato dell'andatura ============
  // fermo / camminata / corsa / scatto  → cicli e ampiezze diverse
  var seed=p.idx*1.7+p.team*3.1;
  var moving = spd>0.55;
  var gait = spdN<0.06 ? 0 : (spdN<0.34 ? 1 : (spdN<0.74 ? 2 : 3));
  var stride, lift, armAmp, cyc, crouch, leanF;
  if(gait===0){                                   // FERMO: respiro + oscillazione del peso
    cyc = G.clock*1.7 + seed;
    stride = 0; lift = 0;
    armAmp = 0.030;
    crouch = 0.975 + Math.sin(cyc)*0.010;          // respiro
    leanF  = 0;
  } else if(gait===1){                            // CAMMINATA
    cyc = p.run*2.3;
    stride = 0.22; lift = 0.055; armAmp = 0.10;
    crouch = 0.99; leanF = 0.03;
  } else if(gait===2){                            // CORSA
    cyc = p.run*3.1;
    stride = 0.26 + spdN*0.08; lift = 0.112; armAmp = 0.21;
    crouch = 0.975; leanF = 0.075;
  } else {                                        // SCATTO
    cyc = p.run*3.7;
    stride = 0.33 + spdN*0.09; lift = 0.148; armAmp = 0.30;
    crouch = 0.955; leanF = 0.125;
  }
  // inclinazione in avanti proporzionale alla velocita'
  if(!diving && p.slideT<=0) ctx.rotate(clamp(-dir*leanF + p.lean*0.10*fx, -0.22, 0.22));

  var hipH=0.620*hgt*crouch, shH=1.160*hgt*crouch, headH=1.385*hgt*crouch;
  var bob = moving ? Math.abs(Math.sin(cyc))*0.028*(0.4+spdN) : 0;
  hipH+=bob; shH+=bob; headH+=bob;

  var kickPh = p.kickT>0 ? clamp(1-p.kickT/0.30,0,1) : -1;   // 0=inizio 1=fine
  var kick = kickPh<0 ? 0
           : (kickPh<0.30 ? -Math.sin(kickPh/0.30*Math.PI)*0.45      // caricamento indietro
                          : Math.sin((kickPh-0.30)/0.70*Math.PI*0.94)); // impatto + accompagnamento
  var legW=0.098*hgt, kneeW=0.058*hgt, ankW=0.045*hgt;
  var armW=0.048*hgt, wristW=0.035*hgt;
  // ossa di lunghezza FISSA: senza queste gli arti si allungavano come elastici
  var THIGH=0.340*hgt, SHIN=0.320*hgt;
  var UPARM=0.235*hgt, FOREARM=0.215*hgt;

  // ---- BRACCIO POSTERIORE ----
  function drawArm(side, front){
    var ph=cyc+Math.PI*(side?0:1)+Math.PI;      // controfase rispetto alle gambe
    var sx=(side?0.14:-0.14)*hgt*dir*0.6;
    var swing = moving ? Math.sin(ph)*armAmp*dir : Math.sin(cyc+(side?0:Math.PI))*armAmp*dir;
    var outw = (side?1:-1)*0.028*hgt;
    var bend = moving ? (0.11+spdN*0.20) : 0.02;      // in corsa la mano sale
    var shTopH = shH-0.02*hgt;
    // bersaglio della MANO (poi il gomito lo ricava l'IK)
    var handX = sx + swing*1.00 + outw + dir*bend*0.30;
    var handH = shTopH - (0.40 - bend*0.52)*hgt;
    if(p.gk && (diving||p.diveT>0)){ handX = sx+dir*0.34*hgt; handH = shH+0.10*hgt; }
    var dxA=handX-sx, dyA=handH-shTopH;
    var dA=Math.sqrt(dxA*dxA+dyA*dyA)||0.0001;
    var maxA=(UPARM+FOREARM)*0.99;
    if(dA>maxA){ var sa=maxA/dA; dxA*=sa; dyA*=sa; dA=maxA; handX=sx+dxA; handH=shTopH+dyA; }
    var aA=(UPARM*UPARM-FOREARM*FOREARM+dA*dA)/(2*dA);
    var hA=Math.sqrt(Math.max(0,UPARM*UPARM-aA*aA));
    var uxA=dxA/dA, uyA=dyA/dA;
    var elbowX = sx + uxA*aA - (-uyA*dir)*hA;       // il - fa piegare il gomito INDIETRO
    var elbowH = shTopH + uyA*aA - ( uxA*dir)*hA;
    var sleeve = kit.s;
    limb(sx, shH-0.02*hgt, elbowX, elbowH, armW, armW*0.9, sleeve);   // manica
    limb(elbowX, elbowH, handX, handH, armW*0.85, wristW, skin);      // avambraccio
    // mano / guantone
    var angH=Math.atan2(PY(handH)-PY(elbowH), PX(handX)-PX(elbowX));
    ctx.fillStyle = p.gk ? '#f2f5f8' : skin;
    ctx.beginPath();
    ctx.ellipse(PX(handX),PY(handH), PX(p.gk?wristW*1.80:wristW*1.34), PX(p.gk?wristW*1.40:wristW*1.00), angH, 0, Math.PI*2);
    ctx.fill();
  }

  // ---- GAMBA ----
  function drawLeg(side){
    var ph=cyc+Math.PI*(side?0:1);
    var hipX=(side?0.075:-0.075)*hgt;
    var footX, footH, swing;
    if(gait===0){
      // fermo: piedi piantati, leggero spostamento del peso
      var shift=Math.sin(cyc)*0.018;
      footX=hipX+(side?0.085:-0.085)*hgt+shift*(side?1:-1);
      footH=0; swing=0;
    } else {
      var sph=Math.sin(ph);
      swing=Math.max(0,-Math.cos(ph));
      footX=hipX+dir*stride*(sph>0? sph : sph*0.58);              // dietro si allunga meno
      footH=lift*Math.max(0,sph) + lift*0.42*Math.max(0,-sph);    // spinta: tallone che si alza
    }
    // gamba che calcia
    var isKick = (side===p.kickLeg);
    if(kickPh>=0 && isKick){
      footX=hipX+dir*(0.06+kick*0.72)*hgt;
      footH=Math.max(0,kick)*0.30*hgt;
      swing=Math.abs(kick)*1.05;
    } else if(kickPh>=0){
      footX=hipX-dir*0.15*hgt; footH=0; swing=0.05;   // piede d'appoggio piantato
    }
    if(p.slideT>0){ footX=hipX+dir*0.62*hgt; footH=0.06; swing=0.2; }

    // ---- IK a due segmenti: coscia e stinco hanno lunghezza fissa ----
    var ankleH=footH+0.05*hgt;
    var dxL=footX-hipX, dyL=ankleH-hipH;
    var dL=Math.sqrt(dxL*dxL+dyL*dyL)||0.0001;
    var maxL=(THIGH+SHIN)*0.995;
    if(dL>maxL){                                  // niente gambe elastiche: si accorcia il passo
      var sc=maxL/dL; dxL*=sc; dyL*=sc; dL=maxL;
      footX=hipX+dxL; ankleH=hipH+dyL; footH=ankleH-0.05*hgt;
    }
    var aL=(THIGH*THIGH-SHIN*SHIN+dL*dL)/(2*dL);
    var hL=Math.sqrt(Math.max(0,THIGH*THIGH-aL*aL));
    var uxL=dxL/dL, uyL=dyL/dL;
    var kneeX=hipX+uxL*aL+(-uyL*dir)*hL;          // il + fa piegare il ginocchio in AVANTI
    var kneeH=hipH+uyL*aL+( uxL*dir)*hL;
    limb(hipX, hipH, kneeX, kneeH, legW, kneeW, shortsCol);   // coscia (pantaloncino)
    limb(kneeX, kneeH, footX, ankleH, kneeW, ankW, sockCol);  // stinco (calzettone)
    // scarpino orientato
    ctx.save();
    ctx.translate(PX(footX), PY(footH+0.035*hgt));
    ctx.fillStyle=bootCol;
    ctx.beginPath();
    ctx.ellipse(PX(dir*0.035*hgt), 0, PX(0.085*hgt), PX(0.042*hgt), 0, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
  }

  // ordine di disegno: arto lontano, corpo, arto vicino → senso di profondita'
  drawArm(dir>0?0:1,false);
  drawLeg(dir>0?0:1);

  // ---- BUSTO con volume, pattern maglia e ombreggiatura ----
  var hipHW=0.150*hgt, shHW=0.230*hgt;
  var torsoLean=dir*0.030*hgt*(gait>=2?1:0.4);
  function torsoPath(){
    var hx=PX(0), hy=PY(hipH+0.02);
    var sx=PX(torsoLean), sy=PY(shH+0.03);
    ctx.beginPath();
    ctx.moveTo(hx-PX(hipHW), hy);
    ctx.lineTo(sx-PX(shHW), sy);
    ctx.lineTo(sx+PX(shHW), sy);
    ctx.lineTo(hx+PX(hipHW), hy);
    ctx.closePath();
  }
  torsoPath(); ctx.fillStyle=kit.s; ctx.fill();

  ctx.save();
  torsoPath(); ctx.clip();
  var tTop=PY(shH+0.05), tBot=PY(hipH), tH=tBot-tTop;
  var tLeft=PX(-shHW-0.02), tW=PX((shHW+0.02)*2);
  var pat=kit.p||'solid', c2=kit.s2||shade(kit.s,-45);
  if(pat==='stripes'){
    ctx.fillStyle=c2;
    for(var s=-3;s<=3;s++){ if(s%2===0) continue; ctx.fillRect(PX(s*0.055*hgt)-PX(0.027*hgt), tTop, PX(0.055*hgt), tH); }
  } else if(pat==='hoops'){
    ctx.fillStyle=c2;
    for(var hh=0;hh<4;hh++) ctx.fillRect(tLeft, tTop+tH*(hh*0.26+0.06), tW, tH*0.12);
  } else if(pat==='sash'){
    ctx.strokeStyle=c2; ctx.lineWidth=PX(0.085*hgt);
    ctx.beginPath(); ctx.moveTo(tLeft, tTop); ctx.lineTo(tLeft+tW, tBot); ctx.stroke();
  } else if(pat==='halves'){
    ctx.fillStyle=c2; ctx.fillRect(tLeft, tTop, tW*0.5, tH);
  }
  // luce da sinistra-alto
  try{
    var grd=ctx.createLinearGradient(tLeft,0,tLeft+tW,0);
    grd.addColorStop(0,'rgba(255,255,255,0.16)');
    grd.addColorStop(0.42,'rgba(0,0,0,0)');
    grd.addColorStop(1,'rgba(0,0,0,0.28)');
    ctx.fillStyle=grd; ctx.fillRect(tLeft,tTop,tW,tH);
  }catch(e){}
  // numero di maglia visibile di spalle
  if(back && z>13){
    ctx.fillStyle='rgba(255,255,255,.93)';
    ctx.font='700 '+Math.max(6,PX(0.20*hgt)).toFixed(0)+'px Oswald, system-ui, sans-serif';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(String(p.shirt), PX(torsoLean*0.6), tTop+tH*0.42);
  }
  ctx.restore();

  // colletto
  ctx.fillStyle=shade(kit.s,-30);
  ctx.beginPath(); ctx.ellipse(PX(torsoLean),PY(shH+0.035), PX(0.070*hgt), PX(0.030*hgt),0,0,Math.PI*2); ctx.fill();

  // ---- COLLO + TESTA ----
  limb(torsoLean, shH+0.02, torsoLean+dir*0.012, headH-0.085*hgt, 0.035*hgt, 0.033*hgt, shade(skin,-18));
  var hx2=PX(torsoLean+dir*0.02), hy2=PY(headH);
  var hr=PX(0.158*hgt);
  ctx.fillStyle='rgba(6,12,9,0.55)';
  ctx.beginPath(); ctx.arc(hx2,hy2,hr+Math.max(0.9,z*0.013),0,Math.PI*2); ctx.fill();
  ctx.fillStyle=skin;
  ctx.beginPath(); ctx.arc(hx2,hy2,hr,0,Math.PI*2); ctx.fill();
  // capelli: calotta ruotata verso la nuca
  ctx.fillStyle=hair;
  ctx.beginPath();
  ctx.arc(hx2 - dir*hr*0.14, hy2 - hr*0.16, hr*0.97, Math.PI*0.98, Math.PI*2.16);
  ctx.fill();
  if(back){ // di spalle: nuca piena
    ctx.beginPath(); ctx.arc(hx2,hy2,hr*0.94,0,Math.PI*2); ctx.fill();
  } else if(z>13){ // di faccia: accenno di viso
    ctx.fillStyle='rgba(30,20,14,.55)';
    ctx.beginPath(); ctx.arc(hx2+dir*hr*0.30, hy2+hr*0.02, hr*0.13,0,Math.PI*2); ctx.fill();
  }

  // arto vicino sopra al corpo
  drawArm(dir>0?1:0,true);
  drawLeg(dir>0?1:0);

  ctx.restore();

  // ---- INDICATORE A TRIANGOLO (nessun nome sopra la testa) ----
  var mark = p.controlled ? 1 : (G.passTarget===p ? 2 : 0);
  if(mark){
    var mw=Math.max(5,z*0.185), mh=Math.max(6,z*0.225);
    var mBot=g.y-1.94*hgt*m - Math.abs(Math.sin(G.clock*3.2))*mh*0.28;
    ctx.save();
    var gradM=ctx.createLinearGradient(0,mBot-mh,0,mBot);
    if(mark===1){ gradM.addColorStop(0,'#ffe680'); gradM.addColorStop(1,'#f5b500'); }
    else        { gradM.addColorStop(0,'#7ef7b4'); gradM.addColorStop(1,'#12b866'); }
    ctx.beginPath();
    ctx.moveTo(g.x, mBot);                 // punta rivolta in basso, verso la testa
    ctx.lineTo(g.x-mw, mBot-mh);
    ctx.lineTo(g.x+mw, mBot-mh);
    ctx.closePath();
    ctx.fillStyle='rgba(0,0,0,.35)';
    ctx.save(); ctx.translate(0,Math.max(1,z*0.02)); ctx.fill(); ctx.restore();
    ctx.fillStyle=gradM; ctx.fill();
    ctx.lineWidth=Math.max(1,z*0.020); ctx.strokeStyle='rgba(255,255,255,.85)'; ctx.stroke();
    ctx.restore();
  }
  // freccia sul bersaglio del passaggio
  if(G.passTarget===p && G.controlled && G.ball.owner===G.controlled){
    ctx.save();
    ctx.fillStyle='rgba(0,230,122,.95)';
    var ay2=g.y-2.30*hgt*m + Math.sin(G.clock*7)*z*0.05;
    ctx.beginPath();
    ctx.moveTo(g.x, ay2+z*0.22); ctx.lineTo(g.x-z*0.15, ay2); ctx.lineTo(g.x+z*0.15, ay2);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
}


function drawBall(b){
  var g=project(b.x,b.y,0), s=project(b.x,b.y,b.z);
  var z=CAM.z, r=Math.max(2.6,z*0.145);
  var sh=clamp(1-b.z*0.055,0.35,1);
  ctx.fillStyle='rgba(4,12,8,'+(0.34*sh)+')';
  ctx.beginPath(); ctx.ellipse(g.x,g.y,r*1.15*sh,r*0.52*sh,0,0,Math.PI*2); ctx.fill();
  var v=len(b.vx,b.vy);
  if(v>16){                                   // scia di velocità
    ctx.strokeStyle='rgba(255,255,255,'+clamp((v-16)/40,0,0.4)+')';
    ctx.lineWidth=r*1.3; ctx.lineCap='round';
    var tl=project(b.x-b.vx*0.045,b.y-b.vy*0.045,Math.max(0,b.z-b.vz*0.045));
    ctx.beginPath(); ctx.moveTo(tl.x,tl.y); ctx.lineTo(s.x,s.y); ctx.stroke();
  }
  var grd=ctx.createRadialGradient(s.x-r*0.35,s.y-r*0.4,r*0.15,s.x,s.y,r);
  grd.addColorStop(0,'#ffffff'); grd.addColorStop(0.72,'#eef2f6'); grd.addColorStop(1,'#b9c4cf');
  ctx.fillStyle=grd; ctx.beginPath(); ctx.arc(s.x,s.y,r,0,Math.PI*2); ctx.fill();
  ctx.save();
  ctx.beginPath(); ctx.arc(s.x,s.y,r,0,Math.PI*2); ctx.clip();
  ctx.fillStyle='#232c38';
  var a=b.spin;
  ctx.beginPath(); ctx.arc(s.x+Math.cos(a)*r*0.12, s.y+Math.sin(a*0.8)*r*0.1, r*0.34,0,Math.PI*2); ctx.fill();
  for(var i=0;i<5;i++){
    var ang=a*0.6+i*1.257;
    ctx.beginPath(); ctx.arc(s.x+Math.cos(ang)*r*0.78, s.y+Math.sin(ang)*r*0.78, r*0.26,0,Math.PI*2); ctx.fill();
  }
  ctx.restore();
  ctx.strokeStyle='rgba(20,30,45,.30)'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.arc(s.x,s.y,r,0,Math.PI*2); ctx.stroke();
}

function drawParticle(pt){
  var s=project(pt.x,pt.y,pt.z);
  ctx.globalAlpha=clamp(pt.t*1.6,0,1);
  ctx.fillStyle=pt.c;
  ctx.fillRect(s.x-pt.r*CAM.z*0.5, s.y-pt.r*CAM.z*0.5, pt.r*CAM.z, pt.r*CAM.z*0.6);
  ctx.globalAlpha=1;
}
function drawRadar(){
  if(!radarCtx) return;
  var c=radarCtx, w=radarCv.width, h=radarCv.height;
  c.clearRect(0,0,w,h);
  c.fillStyle='rgba(38,72,44,.9)'; c.fillRect(6,6,w-12,h-12);
  c.strokeStyle='rgba(255,255,255,.5)'; c.lineWidth=1;
  c.strokeRect(6,6,w-12,h-12);
  c.beginPath(); c.moveTo(w/2,6); c.lineTo(w/2,h-6); c.stroke();
  c.beginPath(); c.arc(w/2,h/2,h*0.14,0,Math.PI*2); c.stroke();
  function px(x,y){ return {x:6+(x+HX)/PW*(w-12), y:6+(y+HY)/PH*(h-12)}; }
  G.players.forEach(function(p){
    var q=px(p.x,p.y);
    c.fillStyle=G.teams[p.team].kit.s;
    c.beginPath(); c.arc(q.x,q.y,p.controlled?3.4:2.5,0,Math.PI*2); c.fill();
    if(p.controlled){ c.strokeStyle='#fff'; c.lineWidth=1.2; c.beginPath(); c.arc(q.x,q.y,4.6,0,Math.PI*2); c.stroke(); }
  });
  var bq=px(G.ball.x,G.ball.y);
  c.fillStyle='#fff'; c.beginPath(); c.arc(bq.x,bq.y,2.2,0,Math.PI*2); c.fill();
}
function drawAimReticle(){
  if(G.state!=='pens'||!G.pens||G.pens.phase!=='aim'||!G.pens.userShooting) return;
  var gx=G.pens.goalSide*HX;
  var p=project(gx, G.pens.aim.y, G.pens.aim.z);
  ctx.strokeStyle='rgba(255,255,255,.95)'; ctx.lineWidth=2;
  ctx.beginPath(); ctx.arc(p.x,p.y,10,0,Math.PI*2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(p.x-15,p.y); ctx.lineTo(p.x-5,p.y); ctx.moveTo(p.x+5,p.y); ctx.lineTo(p.x+15,p.y);
  ctx.moveTo(p.x,p.y-15); ctx.lineTo(p.x,p.y-5); ctx.moveTo(p.x,p.y+5); ctx.lineTo(p.x,p.y+15); ctx.stroke();
}

/* ================= HUD (DOM) ================= */
var EL={};
function buildDom(){
  teardownDom();
  var ov=document.createElement('div'); ov.id='m26-ov';
  ov.innerHTML=
    '<canvas id="m26-cv"></canvas>'+
    '<div id="m26-bug" class="m26-hud"></div>'+
    '<div id="m26-pens" class="m26-hud" style="display:none"></div>'+
    '<div id="m26-ev" class="m26-hud"></div>'+
    '<div id="m26-banner" class="m26-hud"></div>'+
    '<div id="m26-pow" class="m26-hud"><i></i></div>'+
    '<div id="m26-pbar" class="m26-hud"></div>'+
    '<canvas id="m26-radar" class="m26-hud" width="172" height="112"></canvas>'+
    '<div id="m26-hint" class="m26-hud"><b>COMANDI</b> · <span class="kk">W</span><span class="kk">A</span><span class="kk">S</span><span class="kk">D</span> muovi · <span class="kk">Z</span>/<span class="kk">Spazio</span> passa (tieni = lob) · <span class="kk">X</span> tira (tieni = potenza) · <span class="kk">Shift</span> scatto · <span class="kk">C</span> cambia · <span class="kk">P</span> pausa</div>'+
    '<div id="m26-touch"><div id="m26-tstick"><div id="m26-tknob"></div></div>'+
    '<div class="m26-tbtn" id="m26-tb-pass">PASSA</div><div class="m26-tbtn" id="m26-tb-shot">TIRO</div>'+
    '<div class="m26-tbtn" id="m26-tb-sprint">CORRI</div><div class="m26-tbtn" id="m26-tb-switch">⇄</div>'+
    '<div class="m26-tbtn" id="m26-tb-pause">⏸</div></div>'+
    '<div id="m26-panel"></div>';
  document.body.appendChild(ov);
  EL.ov=ov; EL.bug=ov.querySelector('#m26-bug'); EL.pens=ov.querySelector('#m26-pens');
  EL.ev=ov.querySelector('#m26-ev'); EL.banner=ov.querySelector('#m26-banner');
  EL.pow=ov.querySelector('#m26-pow'); EL.powFill=EL.pow.querySelector('i');
  EL.pbar=ov.querySelector('#m26-pbar'); EL.panel=ov.querySelector('#m26-panel');
  EL.hint=ov.querySelector('#m26-hint');
  cv=ov.querySelector('#m26-cv'); ctx=cv.getContext('2d');
  radarCv=ov.querySelector('#m26-radar'); radarCtx=radarCv.getContext('2d');
  resizeCv();
  window.addEventListener('resize', resizeCv);
  bindTouch(ov);
  setTimeout(function(){ if(EL.hint) EL.hint.style.opacity='0'; }, 9000);
}
function teardownDom(){
  if(EL.ov){ try{ EL.ov.remove(); }catch(e){} }
  EL={}; cv=null; ctx=null; radarCv=null; radarCtx=null;
}
function resizeCv(){
  if(!cv) return;
  DPR=Math.max(1.5, Math.min(2, window.devicePixelRatio||1));
  W=window.innerWidth; H=window.innerHeight;
  cv.width=W*DPR; cv.height=H*DPR;
}
function updateScorebug(){
  if(!EL.bug) return;
  var T=G.teams;
  EL.bug.innerHTML='<div class="comp">'+(G.cfg.compShort||'M26')+'</div><div class="mid">'
    +'<span class="tm"><span class="chip" style="background:'+T[0].kit.s+'"></span>'+(T[0].logo?'<img src="'+T[0].logo+'" onerror="this.style.display=\'none\'">':'')+T[0].short+'</span>'
    +'<span class="sc">'+G.score[0]+' : '+G.score[1]+'</span>'
    +'<span class="tm">'+(T[1].logo?'<img src="'+T[1].logo+'" onerror="this.style.display=\'none\'">':'')+T[1].short+'<span class="chip" style="background:'+T[1].kit.s+'"></span></span>'
    +'</div><div class="clk" id="m26-clk">1\'</div>';
}
function clockText(){
  if(G.etMode) return 'TS';
  if(G.state==='halftime') return 'INT';
  var m;
  if(G.half===1) m=Math.floor(G.elapsed/G.halfLen*45)+1;
  else m=45+Math.floor(G.elapsed/G.halfLen*45)+1;
  return clamp(m,1,90)+'\'';
}
function updateHud(){
  if(!EL.ov) return;
  var ck=EL.bug&&EL.bug.querySelector('#m26-clk');
  if(ck) ck.textContent=clockText();
  if(IN.shotCharging && G.controlled && G.ball.owner===G.controlled){
    EL.pow.style.opacity='1';
    EL.powFill.style.width=Math.round(clamp(IN.shotHeld/0.85,0,1)*100)+'%';
  } else EL.pow.style.opacity='0';
  var c=G.controlled;
  if(c && G.state!=='pens'){
    EL.pbar.style.display='flex';
    if(EL._pbarFor!==c){
      EL._pbarFor=c;
      EL.pbar.innerHTML=(c.img?'<img src="'+c.img+'" onerror="this.style.visibility=\'hidden\'">':'')+'<div><div class="nm">'+c.name+'</div><div class="rl">'+c.role+' · '+G.teams[c.team].short+'</div><div class="stam"><i></i></div></div>';
    }
    var st=EL.pbar.querySelector('.stam i'); if(st) st.style.width=Math.round(c.stamina)+'%';
  } else { EL.pbar.style.display='none'; EL._pbarFor=null; }
  if(G.controlled && G.ball.owner===G.controlled && G.state==='play') G.passTarget=bestPassTarget(G.controlled, moveVec());
  else G.passTarget=null;
}
function updateBanner(){
  if(!EL.banner||!G.msg) return;
  EL.banner.innerHTML='<div class="big">'+G.msg.big+'</div>'+(G.msg.who?'<div class="who">'+(G.msg.img?'<img src="'+G.msg.img+'" onerror="this.style.display=\'none\'">':'')+G.msg.who+'</div>':'')+(G.msg.sub?'<div class="sub">'+G.msg.sub+'</div>':'');
  EL.banner.classList.add('on');
}
function hideBanner(){ if(EL.banner) EL.banner.classList.remove('on'); }
function evToast(txt){ if(!EL.ev) return; EL.ev.innerHTML=txt; EL.ev.style.opacity='1'; setTimeout(function(){ if(EL.ev) EL.ev.style.opacity='0'; }, 2200); }

/* ---------- pannelli ---------- */
function showPanel(html){ EL.panel.innerHTML='<div class="m26-panel"><div class="m26-card">'+html+'</div></div>'; EL.panel.style.display='block'; }
function hidePanel(){ if(EL.panel){ EL.panel.style.display='none'; EL.panel.innerHTML=''; } }
function kitDot(k){ return '<span style="display:inline-block;width:22px;height:28px;border-radius:5px;background:'+k.s+';border:2px solid rgba(255,255,255,.3);vertical-align:middle;'+(k.p==='stripes'&&k.s2?'background:repeating-linear-gradient(90deg,'+k.s+' 0 5px,'+k.s2+' 5px 10px);':'')+'"></span>'; }
function showPrematch(){
  var T=G.teams;
  var diff=G.cfg.oppStr-G.cfg.userStr;
  var stars=clamp(Math.round(3+diff/6),1,5);
  var starHtml=''; for(var i=0;i<5;i++) starHtml+='<span style="color:'+(i<stars?'#ffd24a':'#3a4a5c')+'">★</span>';
  showPanel(
    '<div class="m26-kick">'+(G.cfg.comp||'Partita')+'</div>'+
    '<div class="m26-title">PARTITA LIVE</div>'+
    '<div class="m26-sub">Gioca tu la partita: il risultato conterà per la tua carriera</div>'+
    '<div class="m26-vs"><div class="t">'+(T[0].logo?'<img src="'+T[0].logo+'" onerror="this.style.display=\'none\'">':'')+'<div class="n">'+T[0].name+'</div><div class="s">CASA · '+kitDot(T[0].kit)+'</div></div>'+
    '<div class="mid">VS</div>'+
    '<div class="t">'+(T[1].logo?'<img src="'+T[1].logo+'" onerror="this.style.display=\'none\'">':'')+'<div class="n">'+T[1].name+'</div><div class="s">TRASFERTA · '+kitDot(T[1].kit)+'</div></div></div>'+
    '<div class="m26-rows">'+
    '<div class="m26-row"><span class="l">Durata tempo</span><span class="m26-seg" id="m26-dur">'+
      '<button data-v="120">2 min</button><button data-v="180" class="on">3 min</button><button data-v="300">5 min</button></span></div>'+
    '<div class="m26-row"><span class="l">Difficoltà avversario</span><span>'+starHtml+' <small style="color:#8fa9bf">('+(G.cfg.oppStr)+' OVR)</small></span></div>'+
    '<div class="m26-row"><span class="l">Maglie</span><button class="m26-btn ghost" style="padding:8px 16px" id="m26-swap">⇄ Inverti</button></div>'+
    '</div>'+
    '<div class="m26-btns"><button class="m26-btn" id="m26-play">Scendi in campo ▸</button><button class="m26-btn ghost" id="m26-cancel">Annulla</button></div>'+
    '<div class="m26-keys"><b>Comandi:</b> <span class="kk">W A S D</span>/<span class="kk">←→↑↓</span> muoviti · <span class="kk">Z</span>/<span class="kk">Spazio</span> passaggio (tieni premuto = lob/cross) · <span class="kk">X</span> tiro caricato · <span class="kk">Shift</span> scatto · <span class="kk">C</span>/<span class="kk">Tab</span> cambia giocatore · in difesa <span class="kk">Z</span> contrasto, <span class="kk">X</span> scivolata · <span class="kk">P</span> pausa</div>'
  );
  G.paused=true;
  EL.panel.querySelector('#m26-dur').addEventListener('click',function(e){
    var b=e.target.closest('button'); if(!b) return;
    EL.panel.querySelectorAll('#m26-dur button').forEach(function(x){x.classList.remove('on');});
    b.classList.add('on'); G.halfLen=parseInt(b.getAttribute('data-v'),10);
  });
  EL.panel.querySelector('#m26-swap').addEventListener('click',function(){
    var k=G.teams[0].kit; G.teams[0].kit=G.teams[1].kit; G.teams[1].kit=k; showPrematch();
  });
  EL.panel.querySelector('#m26-play').addEventListener('click',function(){
    hidePanel(); G.paused=false; kickoffFlow(0, true);
  });
  EL.panel.querySelector('#m26-cancel').addEventListener('click',function(){ stopMatch(); if(G.cfg.onAbandon) G.cfg.onAbandon('exit'); });
}
function showPause(){
  G.paused=true;
  showPanel('<div class="m26-kick">Pausa</div><div class="m26-title">'+G.teams[0].short+' '+G.score[0]+' - '+G.score[1]+' '+G.teams[1].short+'</div>'+
    '<div class="m26-sub">'+clockText()+' · '+(G.cfg.comp||'')+'</div>'+
    '<div class="m26-btns" style="flex-direction:column;align-items:stretch">'+
    '<button class="m26-btn" id="m26-resume">Riprendi ▸</button>'+
    '<button class="m26-btn ghost" id="m26-restart">↻ Rigioca dall\'inizio</button>'+
    '<button class="m26-btn ghost" id="m26-simrest">⏩ Simula il resto (risultato casuale)</button>'+
    '<button class="m26-btn danger" id="m26-quit">Esci senza giocare</button></div>');
  EL.panel.querySelector('#m26-resume').addEventListener('click',function(){ hidePanel(); G.paused=false; });
  EL.panel.querySelector('#m26-restart').addEventListener('click',function(){ hidePanel(); G.paused=false; setupMatch(G.cfg); kickoffFlow(0,true); });
  EL.panel.querySelector('#m26-simrest').addEventListener('click',function(){ stopMatch(); if(G.cfg.onAbandon) G.cfg.onAbandon('sim'); });
  EL.panel.querySelector('#m26-quit').addEventListener('click',function(){ stopMatch(); if(G.cfg.onAbandon) G.cfg.onAbandon('exit'); });
}
function showHalftime(){
  setState('halftime'); beep('whistle');
  var st=G.stats;
  var possT=st.poss[0]+st.poss[1]||1;
  showPanel('<div class="m26-kick">Fine primo tempo</div><div class="m26-title">'+G.teams[0].short+' '+G.score[0]+' - '+G.score[1]+' '+G.teams[1].short+'</div>'+
    '<div class="m26-sub">'+(G.cfg.comp||'')+'</div>'+
    '<div class="m26-rows">'+
    '<div class="m26-row"><span class="l">Possesso</span><span>'+Math.round(st.poss[0]/possT*100)+'% - '+Math.round(st.poss[1]/possT*100)+'%</span></div>'+
    '<div class="m26-row"><span class="l">Tiri</span><span>'+st.shots[0]+' - '+st.shots[1]+'</span></div>'+
    '<div class="m26-row"><span class="l">Parate</span><span>'+st.saves[0]+' - '+st.saves[1]+'</span></div></div>'+
    '<div class="m26-btns"><button class="m26-btn" id="m26-h2">2° tempo ▸</button></div>');
  G.paused=true;
  EL.panel.querySelector('#m26-h2').addEventListener('click',function(){
    hidePanel(); G.paused=false;
    G.half=2; G.elapsed=0;
    G.teams[0].side=-1; G.teams[1].side=1;
    kickoffFlow(1,false);
    showMsg('2° TEMPO','','',1.6);
  });
}
function showFulltime(res){
  var T=G.teams;
  var rows=G.events.filter(function(e){return e.type==='goal';}).map(function(e){
    return '<div class="m26-row"><span class="l">'+e.min+'\' · '+T[e.team].short+'</span><span>'+e.name+(e.own?' (aut.)':'')+(e.assist?' <small style="color:#8fa9bf">(assist '+e.assist+')</small>':'')+'</span></div>';
  }).join('') || '<div class="m26-row"><span class="l">Nessun gol</span><span>—</span></div>';
  var penRow = res.penWin? '<div class="m26-row"><span class="l">Rigori</span><span>'+G.pens.score[0]+' - '+G.pens.score[1]+'</span></div>' : '';
  showPanel('<div class="m26-kick">'+(res.penWin?'Fine ai rigori':'Fischietto finale')+'</div>'+
    '<div class="m26-title">'+T[0].short+' '+G.score[0]+' - '+G.score[1]+' '+T[1].short+'</div>'+
    '<div class="m26-sub">'+(G.cfg.comp||'')+'</div>'+
    '<div class="m26-rows" style="max-height:34vh;overflow-y:auto">'+rows+penRow+'</div>'+
    '<div class="m26-btns"><button class="m26-btn" id="m26-done">Continua ▸</button></div>');
  G.paused=true;
  EL.panel.querySelector('#m26-done').addEventListener('click',function(){ stopMatch(); if(G.cfg.onFinish) G.cfg.onFinish(res); });
}

/* ---------- flusso tempi ---------- */
function kickoffFlow(team, first){
  resetPositions(team);
  setState('countdown');
  if(first) showMsg(G.cfg.comp||'PARTITA', G.teams[0].name+' vs '+G.teams[1].name, 'Calcio d\'inizio', 1.6);
  updateScorebug();
}
function tickClock(dt){
  var lim=G.etMode?G.etLen:G.halfLen;
  G.elapsed+=dt;
  if(G.elapsed>=lim){ G.elapsed=lim; halfOrEnd(); }
}
function halfOrEnd(){
  if(G.etMode){ startPens(); return; }
  if(G.half===1){ showHalftime(); return; }
  var need=false;
  try{ need=G.cfg.needsWinnerNow ? G.cfg.needsWinnerNow(G.score[G.userTeam], G.score[1-G.userTeam]) : false; }catch(e){}
  if(need && G.score[0]===G.score[1]) startET();
  else finishMatch();
}
function startET(){
  G.etMode=true; G.etLen=60; G.elapsed=0;
  evToast('⏱ Tempi supplementari: GOLDEN GOAL — chi segna vince');
  showMsg('SUPPLEMENTARI','Golden goal · 60\'','Chi segna vince',2.2);
  kickoffFlow(0,false);
}
function buildResult(){
  var u=G.userTeam, o=1-u;
  var possT=G.stats.poss[u]+G.stats.poss[o]||1;
  var possA=Math.round(G.stats.poss[u]/possT*100);
  return {
    gfUser:G.score[u], gfOpp:G.score[o],
    scUser:G.events.filter(function(e){return e.type==='goal'&&e.team===u;}),
    scOpp:G.events.filter(function(e){return e.type==='goal'&&e.team===o;}),
    stats:{ possA:possA, possB:100-possA, shotsA:G.stats.shots[u], shotsB:G.stats.shots[o], chA:G.stats.onT[u]+G.score[u], chB:G.stats.onT[o]+G.score[o] },
    penWin: G.pens? (G.pens.score[u]>G.pens.score[o]?'A':'B') : null
  };
}
function finishMatch(){
  setState('done'); beep('whistle');
  showFulltime(buildResult());
}

/* ================= RIGORI ================= */
function startPens(){
  setState('pens'); beep('whistle');
  var goalSide=1;
  G.pens={ goalSide:goalSide, score:[0,0], taken:[0,0], res:[[],[]], turn:0, phase:'intro', phaseT:0,
    aim:{y:0,z:0.9}, power:0, userShooting:true, shooter:null, keeper:null, flight:null, diveChoice:{y:0,z:0.3} };
  G.pens.order=[0,1].map(function(t){
    return teamPlayers(t).filter(function(p){return !p.gk;}).sort(function(a,b){return b.sho-a.sho;});
  });
  G.players.forEach(function(p,i){ p.x=rndR(-6,2); p.y=-20+(i%11)*4; p.vx=0;p.vy=0; });
  var b=G.ball; b.owner=null; b.x=goalSide*(HX-SPOT); b.y=0; b.z=0; b.vx=0;b.vy=0;b.vz=0;
  if(EL.pens) EL.pens.style.display='flex';
  updatePensHud();
  showPanel('<div class="m26-kick">Serie di rigori</div><div class="m26-title">RIGORI</div>'+
    '<div class="m26-sub">5 tiri a testa. Quando tiri: muovi il mirino e tieni premuto <b>X</b> per la potenza. Quando pari: scegli la direzione col movimento al momento del tiro.</div>'+
    '<div class="m26-btns"><button class="m26-btn" id="m26-pens-go">Vai ai rigori ▸</button></div>');
  G.paused=true;
  EL.panel.querySelector('#m26-pens-go').addEventListener('click',function(){ hidePanel(); G.paused=false; nextPenalty(); });
}
function updatePensHud(){
  if(!EL.pens||!G.pens) return;
  var P=G.pens, T=G.teams;
  function dots(t){ var h=''; for(var i=0;i<Math.max(5,P.taken[t]);i++){ var r=P.res[t][i]; h+='<span class="d'+(r==null?'':(r?' g':' m'))+'"></span>'; } return h; }
  EL.pens.innerHTML='<span class="tm">'+T[0].short+'</span><span class="dots">'+dots(0)+'</span><span class="sc">'+P.score[0]+' : '+P.score[1]+'</span><span class="dots">'+dots(1)+'</span><span class="tm">'+T[1].short+'</span>';
}
function pensDecided(){
  var P=G.pens;
  var rem0=Math.max(5,P.taken[0])-P.taken[0], rem1=Math.max(5,P.taken[1])-P.taken[1];
  if(P.taken[0]>=5&&P.taken[1]>=5&&P.taken[0]===P.taken[1]&&P.score[0]!==P.score[1]) return true;
  if(P.score[0]>P.score[1]+rem1) return true;
  if(P.score[1]>P.score[0]+rem0) return true;
  return false;
}
function nextPenalty(){
  var P=G.pens;
  var t=P.turn%2;
  P.userShooting = (t===G.userTeam);
  P.shooter=P.order[t][P.taken[t]%P.order[t].length];
  P.keeper=gkOf(1-t);
  P.currentTeam=t;
  var gx=P.goalSide*HX;
  P.shooter.x=gx-P.goalSide*(SPOT+2.2); P.shooter.y=0; P.shooter.vx=0;P.shooter.vy=0; P.shooter.face=P.goalSide>0?0:Math.PI;
  P.keeper.x=gx-P.goalSide*0.9; P.keeper.y=0; P.keeper.vx=0;P.keeper.vy=0; P.keeper.diveT=0;
  var b=G.ball; b.x=gx-P.goalSide*SPOT; b.y=0; b.z=0; b.vx=0;b.vy=0;b.vz=0; b.owner=null;
  P.aim={y:rndR(-1,1), z:0.9}; P.power=0; P.phase='aim'; P.phaseT=0;
  showMsg(P.userShooting?'TIRI TU':'PARA TU', P.shooter.name, P.userShooting?'Mira e carica il tiro':'Scegli il tuffo al momento del calcio', 1.6);
}
function pensTick(dt){
  var P=G.pens; if(!P) return;
  P.phaseT+=dt;
  var b=G.ball, gx=P.goalSide*HX;
  CAM.tx=gx-P.goalSide*13; CAM.ty=0; CAM.x=lerp(CAM.x,CAM.tx,1-Math.pow(0.005,dt)); CAM.y=lerp(CAM.y,0,1-Math.pow(0.005,dt));
  var tz=W/30; CAM.z=lerp(CAM.z,tz,1-Math.pow(0.02,dt));
  if(P.phase==='aim'){
    if(P.userShooting){
      var mv=moveVec();
      P.aim.y=clamp(P.aim.y+mv.y*4.4*dt,-3.5,3.5);
      P.aim.z=clamp(P.aim.z-mv.x*P.goalSide*2.6*dt,0.15,2.34);
      if(IN.shotDown){ P.power=clamp(P.power+dt/0.9,0,1); }
      if(!IN.shotDown && P.power>0.05){ execPenalty(); }
      else if(P.phaseT>8){ P.power=0.5; execPenalty(); }
    } else {
      if(P.phaseT>1.5){ execPenalty(); }
    }
    IN.shotEdge=false; IN.passEdge=false; IN.switchEdge=false;
  } else if(P.phase==='flight'){
    var f=P.flight; f.t+=dt;
    var k=clamp(f.t/f.dur,0,1);
    b.x=lerp(f.from.x,f.to.x,k); b.y=lerp(f.from.y,f.to.y,k); b.z=lerp(f.from.z,f.to.z,k*0.5*(2-k));
    b.spin+=dt*14;
    P.keeper.y=lerp(0,f.diveY,clamp(f.t/0.28,0,1));
    P.keeper.diveT=0.4;
    if(f.t>=f.dur){
      var good=f.outcome==='goal';
      P.res[P.currentTeam].push(good); P.taken[P.currentTeam]++; if(good)P.score[P.currentTeam]++;
      updatePensHud();
      if(good){ beep('goal'); evToast('⚽ GOOOL!'); spawnConfetti(G.teams[P.currentTeam].kit.s,'#ffffff'); }
      else { evToast(f.outcome==='save'?'🧤 PARATA!':'❌ '+(f.outcome==='post'?'PALO!':'FUORI!')); }
      P.phase='result'; P.phaseT=0;
      if(f.outcome!=='goal'){ b.vx=-P.goalSide*rndR(3,7); b.vy=rndR(-4,4); b.vz=rndR(1,3); }
    }
  } else if(P.phase==='result'){
    b.x+=b.vx*dt; b.y+=b.vy*dt; if(b.z>0||b.vz>0){ b.z+=b.vz*dt; b.vz-=24*dt; if(b.z<=0){b.z=0;b.vz=0;} }
    b.vx*=Math.pow(0.4,dt); b.vy*=Math.pow(0.4,dt);
    if(P.phaseT>1.25){
      if(pensDecided()){ P.phase='done'; P.phaseT=0; var won=P.score[G.userTeam]>P.score[1-G.userTeam]; showMsg(won?'VITTORIA AI RIGORI!':'SCONFITTA AI RIGORI', G.teams[0].short+' '+P.score[0]+' - '+P.score[1]+' '+G.teams[1].short,'',2.0); beep('whistle'); }
      else { P.turn++; nextPenalty(); }
    }
  } else if(P.phase==='done'){
    if(P.phaseT>1.8){ finishMatch(); }
  }
}
function execPenalty(){
  var P=G.pens, b=G.ball;
  var gx=P.goalSide*HX;
  var aim;
  if(P.userShooting){
    aim={y:P.aim.y, z:P.aim.z};
  } else {
    var corner=Math.random()<0.5?-1:1;
    aim={y:corner*rndR(1.6,3.1), z:rndR(0.2,2.0)};
    var mv=moveVec();
    P.diveChoice={y:(Math.abs(mv.y)>0.4? mv.y*2.6 : 0), z:(mv.x*P.goalSide<-0.4?1.5:0.35)};
  }
  var out=pensOutcome(P.shooter,P.keeper,aim,P.userShooting?P.power:rndR(0.5,0.85),P.userShooting);
  P.flight={ from:{x:b.x,y:b.y,z:0}, to:{x:gx+P.goalSide*0.6, y:out.y, z:out.z}, t:0, dur:0.42, outcome:out.type, diveY:out.diveY, diveZ:out.diveZ };
  P.phase='flight'; P.phaseT=0;
  beep('kick');
}
function pensOutcome(shooter, keeper, aim, power, userShooting){
  var err=(1-clamp(shooter.sho,40,99)/130)*0.55 + Math.max(0,power-0.78)*1.7;
  var fy=aim.y+rndR(-err,err), fz=clamp(aim.z+rndR(-err,err)*0.5,0.1,3.2);
  var frameY=3.55, frameZ=2.36;
  var type='goal';
  if(Math.abs(fy)>frameY||fz>frameZ){
    type=(Math.abs(fy)<frameY+0.3&&fz<frameZ+0.25)?'post':'miss';
  }
  var diveY, diveZ;
  if(userShooting){
    var read=clamp(0.30+(keeper.def-70)*0.009,0.16,0.55);
    var side=Math.sign(fy)||(Math.random()<0.5?1:-1);
    if(Math.random()>=read) side=-side;
    diveY=side*rndR(1.5,2.9); diveZ=Math.random()<0.45?1.4:0.35;
  } else {
    diveY=G.pens.diveChoice.y; diveZ=G.pens.diveChoice.z;
  }
  if(type==='goal'){
    var d=len(fy-diveY,(fz-diveZ)*1.2);
    var saveR=userShooting?1.05:1.45;
    if(d<saveR) type='save';
  }
  return {type:type,y:fy,z:fz,diveY:diveY,diveZ:diveZ};
}

/* ================= LOOP PRINCIPALE ================= */
function frame(ts){
  if(!G.active) return;
  requestAnimationFrame(frame);
  var dt=(ts-G.lastTs)/1000; G.lastTs=ts;
  if(!(dt>0)) dt=0.016;
  if(dt>0.30) dt=0.30;
  if(G.paused){ drawFrame(); return; }
  G.clock=(G.clock||0)+dt; G.stateT=(G.stateT||0)+dt;
  switch(G.state){
    case 'prematch': break;
    case 'countdown': if(G.stateT>1.1){ setState('play'); beep('whistle'); } break;
    case 'play':
      var _acc=dt;
      while(_acc>0.0008){
        var _st = _acc>0.02 ? 0.02 : _acc;
        tickClock(_st); userTick(_st); aiTick(_st); physStep(_st);
        _acc-=_st;
      }
      break;
    case 'celebrate':
      if(G.stateT>2.5){
        hideBanner();
        var lim=G.etMode?G.etLen:G.halfLen;
        if(G.etMode&&G.goldenDone){ finishMatch(); break; }
        if(G.elapsed>=lim){ halfOrEnd(); break; }
        kickoffFlow(G.pendingKickoff,false);
      }
      break;
    case 'restart': playRestart(dt); break;
    case 'pens': pensTick(dt); break;
    case 'halftime': case 'done': break;
  }
  if(IN.pauseEdge){
    IN.pauseEdge=false;
    if(G.state==='play'||G.state==='restart'||G.state==='countdown') showPause();
  }
  if(G.state!=='play'){ IN.passEdge=false; IN.shotEdge=false; IN.switchEdge=false; IN.shotCharging=false; IN.shotHeld=0; IN.passHeld=0; }
  camTick(dt); partTick(dt);
  updateHud();
  drawFrame();
  if(G.msgT>0){ G.msgT-=dt; if(G.msgT<=0) hideBanner(); }
}

/* ================= TOUCH ================= */
function bindTouch(ov){
  var layer=ov.querySelector('#m26-touch');
  if(!('ontouchstart' in window)) return;
  layer.style.display='block';
  var stick=ov.querySelector('#m26-tstick'), knob=ov.querySelector('#m26-tknob');
  var sid=null;
  function stickPos(t){
    var r=stick.getBoundingClientRect();
    var dx=(t.clientX-(r.left+r.width/2))/(r.width/2), dy=(t.clientY-(r.top+r.height/2))/(r.height/2);
    var l=len(dx,dy); if(l>1){dx/=l;dy/=l;}
    IN.stick.x=dx; IN.stick.y=dy; IN.stick.on=true;
    knob.style.transform='translate(calc(-50% + '+dx*32+'px), calc(-50% + '+dy*32+'px))';
  }
  stick.addEventListener('touchstart',function(e){ e.preventDefault(); sid=e.changedTouches[0].identifier; stickPos(e.changedTouches[0]); },{passive:false});
  window.addEventListener('touchmove',function(e){ if(sid==null)return; for(var i=0;i<e.changedTouches.length;i++) if(e.changedTouches[i].identifier===sid){ e.preventDefault(); stickPos(e.changedTouches[i]); } },{passive:false});
  window.addEventListener('touchend',function(e){ if(sid==null)return; for(var i=0;i<e.changedTouches.length;i++) if(e.changedTouches[i].identifier===sid){ sid=null; IN.stick.x=0;IN.stick.y=0;IN.stick.on=false; knob.style.transform='translate(-50%,-50%)'; } });
  function btn(id,down,up){ var el=ov.querySelector(id); el.addEventListener('touchstart',function(e){ e.preventDefault(); down(); },{passive:false}); el.addEventListener('touchend',function(e){ e.preventDefault(); if(up)up(); },{passive:false}); }
  btn('#m26-tb-pass',function(){ IN.passEdge=true; IN.passDown=true; IN.passHeld=0; },function(){ IN.passDown=false; });
  btn('#m26-tb-shot',function(){ IN.shotEdge=true; IN.shotDown=true; IN.shotHeld=0; },function(){ IN.shotDown=false; });
  btn('#m26-tb-sprint',function(){ IN.touch.sprint=true; },function(){ IN.touch.sprint=false; });
  btn('#m26-tb-switch',function(){ IN.switchEdge=true; });
  btn('#m26-tb-pause',function(){ IN.pauseEdge=true; });
}

/* ================= API PUBBLICA ================= */
function stopMatch(){
  G.active=false; teardownDom();
  try{ if(AC&&AC.close) AC.close(); AC=null; }catch(e){}
}
window.M26Match={
  start:function(cfg){
    try{
      bindInput();
      buildDom();
      if(!pitchCv) buildPitch();
      if(!stadCv) buildStadium();
      G.active=true; G.clock=0;
      G._slots=[ (cfg.userSide===0?cfg.userTeam.formation:cfg.oppTeam.formation), (cfg.userSide===1?cfg.userTeam.formation:cfg.oppTeam.formation) ];
      setupMatch(cfg);
      updateScorebug();
      showPrematch();
      G.lastTs=performance.now();
      requestAnimationFrame(frame);
    }catch(e){ console.error('M26Match start',e); stopMatch(); if(cfg&&cfg.onAbandon) cfg.onAbandon('sim'); }
  },
  stop:stopMatch,
  _g:function(){ return G; }
};

/* ================= INTEGRAZIONE MANAGER26 ================= */
window.playMatchRealtime=function(){
  try{
    if(typeof S==='undefined'||!S||!S.calendar){ return; }
    var match=S.calendar[S.currentWeek];
    if(!match) return;
    if(match.type==='BDO'){ window.runSim(); return; }
    if(match.type==='NC'){ var NC=S.nationalCup; if(!NC||NC.userOut||NC.champion){ window.runSim(); return; } }
    if(match.type.indexOf('CL_')===0&&match.type!=='CL_L'){
      var ut0=S.cl_active_ties?S.cl_active_ties.find(function(t){return t.t1===S.teamName||t.t2===S.teamName;}):null;
      if(!ut0){ window.runSim(); return; }
    }
    if(typeof ensureOpponent==='function') ensureOpponent(match);
    if(!match.name||match.name==='Da definire'||match.name==='—'){ window.runSim(); return; }

    var compLbl = match.type==='SA'?((S.leagueName||'Serie A').toUpperCase())
      : match.type==='NC'?((typeof CUP_NAMES!=='undefined'?(CUP_NAMES[S.leagueName]||'Coppa'):'Coppa').toUpperCase())
      : match.type==='SUP'?((typeof SUPERCUP_NAMES!=='undefined'?(SUPERCUP_NAMES[S.leagueName]||'Supercoppa'):'Supercoppa').toUpperCase())
      : match.type==='PO'?'PLAYOFF'
      : (typeof euroCompShort==='function'?euroCompShort(S.euroComp):'CHAMPIONS LEAGUE');

    /* --- XI utente (con squalificati sostituiti, senza toccare S.draft) --- */
    var suspB=(typeof _compBucket==='function')?_compBucket(match.type):'SA';
    var susp=(S.susp&&S.susp[suspB])||{};
    var layout=(window.FM_FORMATIONS2&&S.formationName&&FM_FORMATIONS2[S.formationName])?FM_FORMATIONS2[S.formationName]
      : (typeof FORMATION_SLOTS!=='undefined'?FORMATION_SLOTS:null);
    var xiSrc=(S.draft&&S.draft.xi)?S.draft.xi:[];
    var AVPimg=(typeof AVP!=='undefined')?AVP:null;
    var userPlayers=[];
    for(var i=0;i<11;i++){
      var slot=layout?layout[i]:{role:'CC',x:50,y:50};
      var p=xiSrc[i]||null;
      if(p&&p.name&&susp[p.name]&&typeof _pickReserve==='function'){ var rep=_pickReserve(slot.role,xiSrc); if(rep) p=rep; }
      if(!p||!p.name) p={name:'Riserva '+(i+1),roles:[slot.role],rate:60,pac:62,sho:58,pas:60,dri:60,def:60,phy:64,img:AVPimg};
      userPlayers.push({name:p.name,img:p.img||AVPimg,pac:p.pac,sho:p.sho,pas:p.pas,dri:p.dri,def:p.def,phy:p.phy,rate:p.rate});
    }

    /* --- XI avversario --- */
    var oppName=match.name;
    var od=(typeof euroClubData==='function'?euroClubData(oppName):null)||((typeof EADB!=='undefined'&&EADB[oppName])?buildClub(oppName):null);
    var oppPlayers=[];
    var DEF_SLOTS=(typeof FORMATION_SLOTS!=='undefined')?FORMATION_SLOTS:layout;
    if(od&&od.r&&od.r.length){
      var xi=(typeof pickBestXI==='function')?pickBestXI(od.r).xi:od.r.slice(0,11);
      for(var j=0;j<11;j++){
        var q=xi[j]||od.r[j%od.r.length];
        if(!q) q={name:'Giocatore '+(j+1),rate:70,pac:70,sho:70,pas:70,dri:70,def:70,phy:70,img:AVPimg};
        oppPlayers.push({name:q.name,img:q.img||AVPimg,pac:q.pac,sho:q.sho,pas:q.pas,dri:q.dri,def:q.def,phy:q.phy,rate:q.rate});
      }
    } else {
      var base=clamp(match.str||75,55,88);
      var cognomi=['Rossi','Bianchi','Ferrari','Esposito','Ricci','Marino','Greco','Bruno','Gallo','Conti','De Luca'];
      for(var k=0;k<11;k++){ var rr=clamp(base-4+Math.floor(Math.random()*9),52,93);
        oppPlayers.push({name:cognomi[k],img:AVPimg,pac:rr,sho:rr,pas:rr,dri:rr,def:rr,phy:rr,rate:rr}); }
    }

    var homeName=match.home?S.teamName:oppName;
    var awayName=match.home?oppName:S.teamName;
    var homeLogo=match.home?S.userLogo:match.logo;
    var awayLogo=match.home?match.logo:S.userLogo;
    var homeKit=kitFor(homeName,null);
    var awayKit=kitFor(awayName,homeKit);

    var cfg={
      homeName:homeName, awayName:awayName, homeLogo:homeLogo, awayLogo:awayLogo,
      comp:compLbl, compShort:compLbl.substring(0,10),
      userSide: match.home?0:1,
      userTeam:{players:userPlayers, formation:userFormation()},
      oppTeam:{players:oppPlayers, formation:DEF_SLOTS},
      oppStr:(od&&od.str)||match.str||78, userStr:S.strength||75,
      kits:[homeKit,awayKit],
      halfLen:180,
      needsWinnerNow:function(gfU,gfO){
        if(gfU!==gfO) return false;
        var t=match.type;
        if(t==='NC'||t==='SUP') return true;
        if(t==='PO'){
          var lastLeg=(match.leg||1)>=(match.legs||1); if(!lastLeg) return false;
          var aF=(S.po?(S.po.aggFor||0):0)+gfU, aA=(S.po?(S.po.aggAgainst||0):0)+gfO;
          return aF===aA;
        }
        if(t.indexOf('CL_')===0&&t!=='CL_L'){
          var ut=match.userTie; if(!ut) return false;
          var a1=ut.agg1||0, a2=ut.agg2||0;
          if(ut.t1===S.teamName){ a1+=gfU; a2+=gfO; } else { a2+=gfU; a1+=gfO; }
          return a1===a2;
        }
        return false;
      },
      onFinish:function(res){
        try{
          S._forcedResult={
            gfA:res.gfUser, gfB:res.gfOpp,
            minsA:res.scUser.map(function(g){return g.min;}), minsB:res.scOpp.map(function(g){return g.min;}),
            scA:res.scUser.map(function(g){return {name:g.name,min:g.min,img:g.img,home:match.home,assist:g.assist,assistImg:g.assistImg};}),
            scB:res.scOpp.map(function(g){return {name:g.name,min:g.min,img:g.img,home:!match.home,assist:g.assist,assistImg:g.assistImg};}),
            stats:res.stats, penWin:res.penWin
          };
          if(res.penWin&&match.type.indexOf('CL_')===0&&match.type!=='CL_L'){ S._forceTieWinner=(res.penWin==='A')?S.teamName:match.name; }
          window.runSim();
          S._forceTieWinner=null;
        }catch(e){ console.error('applyPlayedResult',e); }
      },
      onAbandon:function(mode){
        if(mode==='sim'){ try{ window.runSim(); }catch(e){} }
      }
    };
    window.M26Match.start(cfg);
  }catch(e){
    console.error('playMatchRealtime',e);
    try{ window.runSim(); }catch(_e){}
  }
};
function userFormation(){ return (window.FM_FORMATIONS2&&S.formationName&&FM_FORMATIONS2[S.formationName])?FM_FORMATIONS2[S.formationName]:FORMATION_SLOTS; }

/* ---------- iniezione universale del pulsante "Gioca" ---------- */
/* dopo ogni render, affianca "⚽ GIOCA LA PARTITA" a ogni pulsante "Giorno Partita" (qualsiasi schermata) */
function injectPlayButtons(){
  try{
    if(G.active) return; // mai durante la partita
    if(typeof document==='undefined'||!document.querySelectorAll) return;
    var btns=document.querySelectorAll('button[onclick="goMatchDay()"]');
    for(var i=0;i<btns.length;i++){
      var b=btns[i];
      if((b.textContent||'').indexOf('Giorno Partita')<0) continue;
      var prev=b.previousElementSibling;
      if(prev && prev.getAttribute && prev.getAttribute('data-m26')==='1') continue;
      var c=b.cloneNode(false);
      c.setAttribute('onclick','playMatchRealtime()');
      c.setAttribute('data-m26','1');
      c.innerHTML='\u26bd GIOCA LA PARTITA \u25b8';
      c.style.background='linear-gradient(180deg,#00e67a,#00a653)';
      c.style.color='#04180d';
      c.style.boxShadow='0 8px 22px rgba(0,210,106,.4)';
      b.parentNode.insertBefore(c,b);
    }
  }catch(e){}
}
try{
  if(typeof window.render==='function' && !window.__m26RenderWrapped){
    window.__m26RenderWrapped=true;
    var _m26r=window.render;
    window.render=function(){ var r=_m26r.apply(this,arguments); try{injectPlayButtons();}catch(e){} return r; };
  }
  if(!window.__m26InjectTimer) window.__m26InjectTimer=setInterval(function(){ try{injectPlayButtons();}catch(e){} }, 1500);
}catch(e){}


/* ===================== RENDERER 3D (WebGL) ===================== */
/* =========================================================================
   M26 3D - renderer WebGL puro (nessuna libreria, funziona offline)
   Sostituisce SOLO il disegno: fisica, AI e regole restano identiche.
   Mondo: x=lunghezza(-52.5..52.5)  y=larghezza(-34..34)  z=altezza
   GL:    X=x   Y=altezza   Z=y
   ========================================================================= */
/* ===================== RENDERER 3D (WebGL) ===================== */
/* =========================================================================
   M26 3D "AAA" - renderer WebGL puro (nessuna libreria, funziona offline)
   Pipeline:
     1) shadow map (PCF morbido, 13 tap)  -> ombre reali di giocatori/porte/palla
     2) forward HDR con MSAA (WebGL2) o supersampling (WebGL1)
     3) bloom a due livelli
     4) tonemap ACES + color grading + vignettatura + grana + sharpen
   Sostituisce SOLO il disegno: fisica, AI e regole restano identiche.
   Mondo: x=lunghezza(-52.5..52.5)  y=larghezza(-34..34)  z=altezza
   GL:    X=x   Y=altezza   Z=y
   ========================================================================= */
var M26GL = (function(){

var R = { ok:false, failed:false, cvs:null, nets:[], dt:0, clock:0, pass:'main', q:1 };
var gl=null, GL2=false, EXT={}, T={}, G_={}, P={}, FB={}, CUR=null;
var LVP=null, VP=null;

/* ---------------------------- matematica mat4 --------------------------- */
function m4id(){ var o=new Float32Array(16); o[0]=o[5]=o[10]=o[15]=1; return o; }
function m4mul(a,b){
  var o=new Float32Array(16);
  var a00=a[0],a01=a[1],a02=a[2],a03=a[3], a10=a[4],a11=a[5],a12=a[6],a13=a[7],
      a20=a[8],a21=a[9],a22=a[10],a23=a[11], a30=a[12],a31=a[13],a32=a[14],a33=a[15];
  for(var k=0;k<4;k++){
    var b0=b[k*4], b1=b[k*4+1], b2=b[k*4+2], b3=b[k*4+3];
    o[k*4]  =b0*a00+b1*a10+b2*a20+b3*a30;
    o[k*4+1]=b0*a01+b1*a11+b2*a21+b3*a31;
    o[k*4+2]=b0*a02+b1*a12+b2*a22+b3*a32;
    o[k*4+3]=b0*a03+b1*a13+b2*a23+b3*a33;
  }
  return o;
}
function m4persp(fovy,asp,near,far){
  var f=1/Math.tan(fovy/2), nf=1/(near-far), o=new Float32Array(16);
  o[0]=f/asp; o[5]=f; o[10]=(far+near)*nf; o[11]=-1; o[14]=2*far*near*nf; return o;
}
function m4ortho(l,r,b,t,n,f){
  var o=new Float32Array(16);
  o[0]=2/(r-l); o[5]=2/(t-b); o[10]=-2/(f-n);
  o[12]=-(r+l)/(r-l); o[13]=-(t+b)/(t-b); o[14]=-(f+n)/(f-n); o[15]=1;
  return o;
}
function m4look(ex,ey,ez, cx,cy,cz){
  var z0=ex-cx, z1=ey-cy, z2=ez-cz;
  var l=1/(Math.sqrt(z0*z0+z1*z1+z2*z2)||1); z0*=l; z1*=l; z2*=l;
  var x0=z2, x1=0, x2=-z0;
  l=Math.sqrt(x0*x0+x2*x2); if(l>1e-6){ x0/=l; x2/=l; } else { x0=1; x2=0; }
  var y0=z1*x2-z2*x1, y1=z2*x0-z0*x2, y2=z0*x1-z1*x0;
  var o=new Float32Array(16);
  o[0]=x0; o[1]=y0; o[2]=z0; o[3]=0;
  o[4]=x1; o[5]=y1; o[6]=z1; o[7]=0;
  o[8]=x2; o[9]=y2; o[10]=z2; o[11]=0;
  o[12]=-(x0*ex+x1*ey+x2*ez);
  o[13]=-(y0*ex+y1*ey+y2*ez);
  o[14]=-(z0*ex+z1*ey+z2*ez);
  o[15]=1; return o;
}
/* box orientato: Y in alto, Z lungo la direzione (fx,fz) */
function m4up(x,y,z, fx,fz, w,h,d){
  var o=new Float32Array(16);
  o[0]=fz*w;  o[1]=0; o[2]=-fx*w; o[3]=0;
  o[4]=0;     o[5]=h; o[6]=0;     o[7]=0;
  o[8]=fx*d;  o[9]=0; o[10]=fz*d; o[11]=0;
  o[12]=x; o[13]=y; o[14]=z; o[15]=1;
  return o;
}
/* cilindro fra due punti 3D: asse Y del geom = A->B */
function m4seg(ax,ay,az, bx,by,bz, r){
  var dx=bx-ax, dy=by-ay, dz=bz-az;
  var L=Math.sqrt(dx*dx+dy*dy+dz*dz)||1e-4;
  var ux=dx/L, uy=dy/L, uz=dz/L;
  var hx=0,hy=0,hz=1; if(Math.abs(uz)>0.9){ hx=1; hz=0; }
  var xx=hy*uz-hz*uy, xy=hz*ux-hx*uz, xz=hx*uy-hy*ux;
  var xl=Math.sqrt(xx*xx+xy*xy+xz*xz)||1; xx/=xl; xy/=xl; xz/=xl;
  var zx=uy*xz-uz*xy, zy=uz*xx-ux*xz, zz=ux*xy-uy*xx;
  var o=new Float32Array(16);
  o[0]=xx*r; o[1]=xy*r; o[2]=xz*r; o[3]=0;
  o[4]=ux*L; o[5]=uy*L; o[6]=uz*L; o[7]=0;
  o[8]=zx*r; o[9]=zy*r; o[10]=zz*r; o[11]=0;
  o[12]=ax;  o[13]=ay;  o[14]=az;  o[15]=1;
  return o;
}
/* rotazione attorno a un asse arbitrario (Rodrigues) con traslazione e scala */
function m4rot(x,y,z, ang, ax,ay,az, s){
  var l=Math.sqrt(ax*ax+ay*ay+az*az)||1; ax/=l; ay/=l; az/=l;
  var c=Math.cos(ang), si=Math.sin(ang), t=1-c;
  var o=new Float32Array(16);
  o[0]=(t*ax*ax+c)*s;     o[1]=(t*ax*ay+si*az)*s; o[2]=(t*ax*az-si*ay)*s; o[3]=0;
  o[4]=(t*ax*ay-si*az)*s; o[5]=(t*ay*ay+c)*s;     o[6]=(t*ay*az+si*ax)*s; o[7]=0;
  o[8]=(t*ax*az+si*ay)*s; o[9]=(t*ay*az-si*ax)*s; o[10]=(t*az*az+c)*s;    o[11]=0;
  o[12]=x; o[13]=y; o[14]=z; o[15]=1;
  return o;
}
function hex(s){
  s=((s==null?'#888888':s)+'').trim(); if(s.charAt(0)==='#') s=s.slice(1);
  if(s.length===3) s=s.charAt(0)+s.charAt(0)+s.charAt(1)+s.charAt(1)+s.charAt(2)+s.charAt(2);
  var n=parseInt(s,16); if(isNaN(n)) n=0x888888;
  return [((n>>16)&255)/255, ((n>>8)&255)/255, (n&255)/255];
}
/* sRGB -> lineare: serve per non avere colori slavati con il tonemap */
function lin(c){
  return [Math.pow(c[0],2.2), Math.pow(c[1],2.2), Math.pow(c[2],2.2)];
}
function hexL(s){ return lin(hex(s)); }

/* ------------------------------ programmi -------------------------------- */
function compile(type,src){
  var s=gl.createShader(type); gl.shaderSource(s,src); gl.compileShader(s);
  if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)) throw new Error('shader: '+gl.getShaderInfoLog(s)+'\n'+src.slice(0,400));
  return s;
}
function program(vs,fs){
  var p=gl.createProgram();
  gl.attachShader(p,compile(gl.VERTEX_SHADER,vs));
  gl.attachShader(p,compile(gl.FRAGMENT_SHADER,fs));
  gl.linkProgram(p);
  if(!gl.getProgramParameter(p,gl.LINK_STATUS)) throw new Error('link: '+gl.getProgramInfoLog(p));
  var o={ p:p, u:{}, a:{} }, i, n;
  n=gl.getProgramParameter(p,gl.ACTIVE_UNIFORMS);
  for(i=0;i<n;i++){ var ui=gl.getActiveUniform(p,i); var nm=ui.name.replace(/\[0\]$/,''); o.u[nm]=gl.getUniformLocation(p,nm); }
  n=gl.getProgramParameter(p,gl.ACTIVE_ATTRIBUTES);
  for(i=0;i<n;i++){ var ai=gl.getActiveAttrib(p,i); o.a[ai.name]=gl.getAttribLocation(p,ai.name); }
  return o;
}
function use(pr){
  if(CUR!==pr){
    /* spegne gli attributi del programma precedente: evita puntatori orfani */
    for(var i=0;i<4;i++) gl.disableVertexAttribArray(i);
    CUR=pr; gl.useProgram(pr.p);
  }
}
function u1f(k,v){ var l=CUR.u[k]; if(l) gl.uniform1f(l,v); }
function u1i(k,v){ var l=CUR.u[k]; if(l) gl.uniform1i(l,v); }
function u2f(k,a,b){ var l=CUR.u[k]; if(l) gl.uniform2f(l,a,b); }
function u3f(k,a,b,c){ var l=CUR.u[k]; if(l) gl.uniform3f(l,a,b,c); }
function u3v(k,v){ var l=CUR.u[k]; if(l) gl.uniform3f(l,v[0],v[1],v[2]); }
function u4f(k,a,b,c,d){ var l=CUR.u[k]; if(l) gl.uniform4f(l,a,b,c,d); }
function um4(k,m){ var l=CUR.u[k]; if(l) gl.uniformMatrix4fv(l,false,m); }

/* ------------------------------- geometrie ------------------------------ */
function buf(arr){ var b=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,b); gl.bufferData(gl.ARRAY_BUFFER,arr,gl.STATIC_DRAW); return b; }
function mkGeom(p,n,t,i){
  var g={ p:buf(new Float32Array(p)), n:buf(new Float32Array(n)), t:buf(new Float32Array(t)) };
  g.i=gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,g.i);
  var big = p.length/3 > 65535;
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, big?new Uint32Array(i):new Uint16Array(i), gl.STATIC_DRAW);
  g.c=i.length; g.t32=big; return g;
}
function geoBox(){
  var F=[ [[0,0,1],[[-.5,-.5,.5],[.5,-.5,.5],[.5,.5,.5],[-.5,.5,.5]]],
          [[0,0,-1],[[.5,-.5,-.5],[-.5,-.5,-.5],[-.5,.5,-.5],[.5,.5,-.5]]],
          [[1,0,0],[[.5,-.5,.5],[.5,-.5,-.5],[.5,.5,-.5],[.5,.5,.5]]],
          [[-1,0,0],[[-.5,-.5,-.5],[-.5,-.5,.5],[-.5,.5,.5],[-.5,.5,-.5]]],
          [[0,1,0],[[-.5,.5,.5],[.5,.5,.5],[.5,.5,-.5],[-.5,.5,-.5]]],
          [[0,-1,0],[[-.5,-.5,-.5],[.5,-.5,-.5],[.5,-.5,.5],[-.5,-.5,.5]]] ];
  var p=[],n=[],t=[],i=[];
  for(var f=0;f<F.length;f++){ var b=p.length/3, N=F[f][0], V=F[f][1];
    for(var k=0;k<4;k++){ p.push(V[k][0],V[k][1],V[k][2]); n.push(N[0],N[1],N[2]);
      t.push((k===1||k===2)?1:0, (k>=2)?1:0); }
    i.push(b,b+1,b+2,b,b+2,b+3);
  }
  return mkGeom(p,n,t,i);
}
/* capsula/cilindro con calotte: gli arti non hanno piu' i tagli netti */
function geoCyl(seg){
  var p=[],n=[],t=[],i=[];
  for(var s=0;s<=seg;s++){ var a=s/seg*Math.PI*2, cx=Math.cos(a), cz=Math.sin(a);
    p.push(cx,0,cz); n.push(cx,0,cz); t.push(s/seg,0);
    p.push(cx,1,cz); n.push(cx,0,cz); t.push(s/seg,1); }
  for(var q=0;q<seg;q++){ var b=q*2; i.push(b,b+1,b+3, b,b+3,b+2); }
  /* tappi: due dischi, cosi' non si vede dentro l'arto */
  var base=p.length/3;
  p.push(0,0,0); n.push(0,-1,0); t.push(.5,.5);
  for(var s2=0;s2<=seg;s2++){ var a2=s2/seg*Math.PI*2; p.push(Math.cos(a2),0,Math.sin(a2)); n.push(0,-1,0); t.push(.5,.5); }
  for(var q2=0;q2<seg;q2++) i.push(base, base+1+q2+1, base+1+q2);
  var base2=p.length/3;
  p.push(0,1,0); n.push(0,1,0); t.push(.5,.5);
  for(var s3=0;s3<=seg;s3++){ var a3=s3/seg*Math.PI*2; p.push(Math.cos(a3),1,Math.sin(a3)); n.push(0,1,0); t.push(.5,.5); }
  for(var q3=0;q3<seg;q3++) i.push(base2, base2+1+q3, base2+1+q3+1);
  return mkGeom(p,n,t,i);
}
function geoSph(la,lo){
  var p=[],n=[],t=[],i=[];
  for(var y=0;y<=la;y++){ var v=y/la, th=v*Math.PI, sy=Math.cos(th), r=Math.sin(th);
    for(var x=0;x<=lo;x++){ var u=x/lo, pp=u*Math.PI*2;
      var sx=Math.cos(pp)*r, sz=Math.sin(pp)*r;
      p.push(sx,sy,sz); n.push(sx,sy,sz); t.push(u,1-v); } }
  for(var y2=0;y2<la;y2++) for(var x2=0;x2<lo;x2++){
    var a=y2*(lo+1)+x2, b2=a+lo+1;
    i.push(a,b2,a+1, b2,b2+1,a+1); }
  return mkGeom(p,n,t,i);
}
/* sfera con normali invertite: cupola del cielo */
function geoDome(la,lo){
  var p=[],n=[],t=[],i=[];
  for(var y=0;y<=la;y++){ var v=y/la, th=v*Math.PI*0.62, sy=Math.cos(th), r=Math.sin(th);
    for(var x=0;x<=lo;x++){ var u=x/lo, pp=u*Math.PI*2;
      var sx=Math.cos(pp)*r, sz=Math.sin(pp)*r;
      p.push(sx,sy,sz); n.push(-sx,-sy,-sz); t.push(u, v); } }
  for(var y2=0;y2<la;y2++) for(var x2=0;x2<lo;x2++){
    var a=y2*(lo+1)+x2, b2=a+lo+1;
    i.push(a,a+1,b2, b2,a+1,b2+1); }
  return mkGeom(p,n,t,i);
}
function geoPlane(){
  return mkGeom([-.5,0,-.5, .5,0,-.5, .5,0,.5, -.5,0,.5],
                [0,1,0, 0,1,0, 0,1,0, 0,1,0],
                [0,1, 1,1, 1,0, 0,0], [0,1,2, 0,2,3]);
}
/* prato suddiviso: piu' vertici = illuminazione e nebbia piu' morbide */
function geoGrid(nx,nz){
  var p=[],n=[],t=[],i=[],x,z;
  for(z=0;z<=nz;z++) for(x=0;x<=nx;x++){
    p.push(x/nx-0.5, 0, z/nz-0.5); n.push(0,1,0); t.push(x/nx, 1-z/nz);
  }
  for(z=0;z<nz;z++) for(x=0;x<nx;x++){
    var a=z*(nx+1)+x, b=a+nx+1;
    i.push(a,b,a+1, b,b+1,a+1);
  }
  return mkGeom(p,n,t,i);
}
/* quad verticale: larghezza su X locale, altezza su Y, normale +Z */
function geoQuadV(){
  return mkGeom([-.5,0,0, .5,0,0, .5,1,0, -.5,1,0],
                [0,0,1, 0,0,1, 0,0,1, 0,0,1],
                [0,0, 1,0, 1,1, 0,1], [0,1,2, 0,2,3]);
}
/* rampa (gradinata): sale da (y=0,z=0) a (y=1,z=1) */
function geoRamp(steps){
  var p=[],n=[],t=[],i=[],s;
  var ny=1/Math.sqrt(2), nz=-1/Math.sqrt(2);
  for(s=0;s<=steps;s++){
    var f=s/steps;
    p.push(-.5, f, f); n.push(0,ny,nz); t.push(0, f);
    p.push( .5, f, f); n.push(0,ny,nz); t.push(1, f);
  }
  for(s=0;s<steps;s++){ var b=s*2; i.push(b,b+1,b+3, b,b+3,b+2); }
  return mkGeom(p,n,t,i);
}
/* quad a schermo pieno per il post-processing */
function geoFull(){
  return mkGeom([-1,-1,0, 1,-1,0, 1,1,0, -1,1,0],
                [0,0,1, 0,0,1, 0,0,1, 0,0,1],
                [0,0, 1,0, 1,1, 0,1], [0,1,2, 0,2,3]);
}

/* -------------------------------- texture ------------------------------- */
function cvs2(w,h){ var c=document.createElement('canvas'); c.width=w; c.height=h; return c; }
function isPOT(v){ return (v&(v-1))===0; }
function tex(src,rep,mips){
  var t=gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D,t);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,src);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  var pot = GL2 || (isPOT(src.width)&&isPOT(src.height));
  var m=(rep&&pot)?gl.REPEAT:gl.CLAMP_TO_EDGE;
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,m);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,m);
  if(mips!==false && pot){
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);
    if(EXT.aniso) gl.texParameterf(gl.TEXTURE_2D, EXT.aniso.TEXTURE_MAX_ANISOTROPY_EXT, EXT.anisoMax);
  } else {
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
  }
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  return t;
}
/* rumore tileabile: usato come pattern per erba, tessuto, cemento */
function noiseCv(S, lo, hi, alpha){
  var c=cvs2(S,S), x=c.getContext('2d'), im=x.createImageData(S,S), d=im.data, i;
  for(i=0;i<S*S;i++){
    var v=lo+Math.random()*(hi-lo);
    d[i*4]=d[i*4+1]=d[i*4+2]=v|0; d[i*4+3]=alpha===undefined?255:alpha;
  }
  x.putImageData(im,0,0);
  return c;
}
/* -------- ERBA: mappa dettaglio (variazione + micro normale) ------------- */
function texTurfDetail(){
  var S=512, c=cvs2(S,S), x=c.getContext('2d');
  x.fillStyle='#808080'; x.fillRect(0,0,S,S);
  /* fili d'erba: tratti sottili con direzioni alternate, tileabile */
  var i, n=26000;
  for(i=0;i<n;i++){
    var px=Math.random()*S, py=Math.random()*S;
    var v=Math.random();
    var g=(v<0.5)? (150+Math.random()*70) : (60+Math.random()*55);
    var ln=1.6+Math.random()*3.4, an=(Math.random()-0.5)*0.5 + (py<S/2?1.5708:1.5708);
    x.strokeStyle='rgba('+(g|0)+','+((110+Math.random()*90)|0)+','+((110+Math.random()*90)|0)+',0.55)';
    x.lineWidth=0.8+Math.random()*0.9;
    x.beginPath(); x.moveTo(px,py); x.lineTo(px+Math.cos(an)*ln, py+Math.sin(an)*ln); x.stroke();
  }
  /* chiazze morbide di densita' diversa */
  for(i=0;i<220;i++){
    var r=8+Math.random()*40, cx=Math.random()*S, cy=Math.random()*S;
    var g2=x.createRadialGradient(cx,cy,0,cx,cy,r);
    var a=0.05+Math.random()*0.10;
    if(Math.random()<0.5){ g2.addColorStop(0,'rgba(255,255,255,'+a+')'); }
    else { g2.addColorStop(0,'rgba(0,0,0,'+a+')'); }
    g2.addColorStop(1,'rgba(128,128,128,0)');
    x.fillStyle=g2; x.beginPath(); x.arc(cx,cy,r,0,6.2832); x.fill();
  }
  return tex(c,true,true);
}
/* ---------------- PRATO: strisce di taglio, usura, righe ---------------- */
function texPitch(){
  var MAX=gl.getParameter(gl.MAX_TEXTURE_SIZE)||2048;
  /* 4096x2048: nitidissima insieme al dettaglio ripetuto e non satura la
     memoria dei renderer software (che poi rifiutano i framebuffer) */
  var TW=Math.min(4096, MAX), TH=TW/2;
  if(TW<2048){ TW=2048; TH=1024; }
  var c=cvs2(TW,TH), x=c.getContext('2d');
  var sx=TW/PW, sy=TH/PH;              /* px per metro sui due assi */
  var sc=(sx+sy)/2;

  /* base con luce che cala verso i bordi lunghi */
  var g=x.createLinearGradient(0,0,0,TH);
  g.addColorStop(0,'#264d12'); g.addColorStop(0.34,'#325e17');
  g.addColorStop(0.62,'#315c16'); g.addColorStop(1,'#224710');
  x.fillStyle=g; x.fillRect(0,0,TW,TH);

  /* 20 strisce di taglio: chiaro/scuro con gradiente interno */
  var bands=20, bw=TW/bands, i;
  for(i=0;i<bands;i++){
    var bg=x.createLinearGradient(0,0,0,TH);
    if((i%2)===0){
      bg.addColorStop(0,'rgba(198,238,116,0.135)');
      bg.addColorStop(0.5,'rgba(190,232,110,0.085)');
      bg.addColorStop(1,'rgba(198,238,116,0.145)');
    } else {
      bg.addColorStop(0,'rgba(6,28,4,0.155)');
      bg.addColorStop(0.5,'rgba(6,28,4,0.095)');
      bg.addColorStop(1,'rgba(6,28,4,0.165)');
    }
    x.fillStyle=bg; x.fillRect(i*bw,0,bw+1,TH);
    /* bordo morbido fra due strisce */
    var eg=x.createLinearGradient(i*bw-sc*0.35,0,i*bw+sc*0.35,0);
    eg.addColorStop(0,'rgba(255,255,255,0.00)');
    eg.addColorStop(0.5,'rgba(255,255,255,0.05)');
    eg.addColorStop(1,'rgba(255,255,255,0.00)');
    x.fillStyle=eg; x.fillRect(i*bw-sc*0.35,0,sc*0.7,TH);
  }
  /* taglio incrociato leggerissimo */
  var hb=TH/10;
  for(i=0;i<10;i++){
    x.fillStyle=(i%2)?'rgba(255,255,255,0.028)':'rgba(0,30,9,0.028)';
    x.fillRect(0,i*hb,TW,hb);
  }
  /* trama d'erba: pattern di rumore ripetuto (veloce anche a 8K) */
  var np=x.createPattern(noiseCv(256,88,168), 'repeat');
  x.save(); x.globalAlpha=0.11; x.globalCompositeOperation='overlay';
  x.fillStyle=np; x.fillRect(0,0,TW,TH); x.restore();
  var np2=x.createPattern(noiseCv(128,70,190), 'repeat');
  x.save(); x.globalAlpha=0.07; x.globalCompositeOperation='soft-light';
  x.fillStyle=np2; x.fillRect(0,0,TW,TH); x.restore();

  /* fili d'erba veri, ma solo dove servono (spessi 1 px, tanti) */
  for(i=0;i<90000;i++){
    var gx=Math.random()*TW, gy=Math.random()*TH;
    x.fillStyle = Math.random()<0.5 ? 'rgba(212,246,138,0.050)' : 'rgba(0,26,6,0.075)';
    x.fillRect(gx, gy, 1.1, 2.2+Math.random()*2.2);
  }

  /* usura: centrocampo, aree di porta, dischetti */
  var wear=[[PW/2,PH/2,12,0.055],[8,PH/2,9.5,0.075],[PW-8,PH/2,9.5,0.075],
            [16.5,PH/2,7,0.035],[PW-16.5,PH/2,7,0.035],
            [PW/2,3,10,0.03],[PW/2,PH-3,10,0.03]];
  for(i=0;i<wear.length;i++){
    var w=wear[i];
    var wg=x.createRadialGradient(w[0]*sx,w[1]*sy,0,w[0]*sx,w[1]*sy,w[2]*sc);
    wg.addColorStop(0,'rgba(170,150,96,'+w[3]+')');
    wg.addColorStop(0.6,'rgba(150,140,90,'+(w[3]*0.4)+')');
    wg.addColorStop(1,'rgba(150,140,90,0)');
    x.fillStyle=wg; x.beginPath(); x.ellipse(w[0]*sx,w[1]*sy,w[2]*sc,w[2]*sc*0.8,0,0,6.2832); x.fill();
  }
  /* strisciate di scarpini */
  for(i=0;i<420;i++){
    var ax=Math.random()*TW, ay=Math.random()*TH, aa=Math.random()*6.2832, al=(2+Math.random()*7)*sc;
    x.strokeStyle='rgba(120,116,70,'+(0.02+Math.random()*0.05)+')';
    x.lineWidth=(0.25+Math.random()*0.5)*sc;
    x.beginPath(); x.moveTo(ax,ay); x.lineTo(ax+Math.cos(aa)*al, ay+Math.sin(aa)*al*0.5); x.stroke();
  }

  /* --------------------------- righe del campo --------------------------- */
  var LW=0.12*sc;
  function line(x1,y1,x2,y2,alpha,wid){
    x.strokeStyle='rgba(255,255,255,'+(alpha||0.95)+')'; x.lineWidth=wid||LW;
    x.beginPath(); x.moveTo(x1*sx,y1*sy); x.lineTo(x2*sx,y2*sy); x.stroke();
  }
  function rect(rx,ry,rw,rh,alpha,wid){
    x.strokeStyle='rgba(255,255,255,'+(alpha||0.95)+')'; x.lineWidth=wid||LW;
    x.strokeRect(rx*sx,ry*sy,rw*sx,rh*sy);
  }
  function arc(cx,cy,r,a0,a1,alpha,wid){
    x.strokeStyle='rgba(255,255,255,'+(alpha||0.95)+')'; x.lineWidth=wid||LW;
    x.save(); x.translate(cx*sx,cy*sy); x.scale(1,sy/sx);
    x.beginPath(); x.arc(0,0,r*sx,a0,a1); x.stroke(); x.restore();
  }
  function dot(cx,cy,r){
    x.fillStyle='rgba(255,255,255,0.95)';
    x.save(); x.translate(cx*sx,cy*sy); x.scale(1,sy/sx);
    x.beginPath(); x.arc(0,0,r*sx,0,6.2832); x.fill(); x.restore();
  }
  /* ombra sotto la riga: la vernice e' spessa, si vede il rilievo */
  x.save(); x.translate(LW*0.30, LW*0.34);
  rect(0,0,PW,PH,0.20); line(PW/2,0,PW/2,PH,0.20);
  arc(PW/2,PH/2,9.15,0,6.2832,0.20);
  rect(0,(PH-BOX_W)/2,BOX_D,BOX_W,0.20); rect(PW-BOX_D,(PH-BOX_W)/2,BOX_D,BOX_W,0.20);
  rect(0,(PH-18.32)/2,5.5,18.32,0.20);   rect(PW-5.5,(PH-18.32)/2,5.5,18.32,0.20);
  x.restore();

  rect(0,0,PW,PH);
  line(PW/2,0,PW/2,PH);
  arc(PW/2,PH/2,9.15,0,6.2832);
  dot(PW/2,PH/2,0.22);
  rect(0,(PH-BOX_W)/2,BOX_D,BOX_W);
  rect(PW-BOX_D,(PH-BOX_W)/2,BOX_D,BOX_W);
  rect(0,(PH-18.32)/2,5.5,18.32);
  rect(PW-5.5,(PH-18.32)/2,5.5,18.32);
  dot(SPOT,PH/2,0.22); dot(PW-SPOT,PH/2,0.22);
  arc(SPOT,PH/2,9.15,-0.93,0.93);
  arc(PW-SPOT,PH/2,9.15,Math.PI-0.93,Math.PI+0.93);
  arc(0,0,1,0,Math.PI/2); arc(0,PH,1,-Math.PI/2,0);
  arc(PW,0,1,Math.PI/2,Math.PI); arc(PW,PH,1,Math.PI,Math.PI*1.5);
  /* trattini a 9,15 m dagli angoli, dettaglio da simulazione vera */
  line(-0.35,PH/2-9.15,0,PH/2-9.15,0.85); line(-0.35,PH/2+9.15,0,PH/2+9.15,0.85);
  line(PW,PH/2-9.15,PW+0.35,PH/2-9.15,0.85); line(PW,PH/2+9.15,PW+0.35,PH/2+9.15,0.85);

  /* la vernice e' un filo consumata: rumore sopra le righe */
  x.save(); x.globalAlpha=0.05; x.globalCompositeOperation='multiply';
  x.fillStyle=x.createPattern(noiseCv(256,150,255),'repeat'); x.fillRect(0,0,TW,TH); x.restore();

  /* luce del centro campo: da' volume anche senza ombre */
  var vg=x.createRadialGradient(TW/2,TH/2,TH*0.10,TW/2,TH/2,TW*0.62);
  vg.addColorStop(0,'rgba(255,255,226,0.05)');
  vg.addColorStop(0.5,'rgba(0,0,0,0)');
  vg.addColorStop(1,'rgba(0,22,8,0.20)');
  x.fillStyle=vg; x.fillRect(0,0,TW,TH);
  return tex(c,false,true);
}
/* --------------------------- PUBBLICO (tribune) ------------------------- */
function texCrowd(){
  var W2=1024, H2=512, c=cvs2(W2,H2), x=c.getContext('2d');
  var g=x.createLinearGradient(0,0,0,H2);
  g.addColorStop(0,'#171d26'); g.addColorStop(0.30,'#2a3342');
  g.addColorStop(0.75,'#39445a'); g.addColorStop(1,'#1d2532');
  x.fillStyle=g; x.fillRect(0,0,W2,H2);
  var rows=34, rh=H2/rows, r, i;
  /* seggiolini: file con stacco d'ombra */
  for(r=0;r<rows;r++){
    var y=r*rh;
    x.fillStyle='rgba(0,0,0,0.26)'; x.fillRect(0, y+rh*0.72, W2, rh*0.28);
    x.fillStyle='rgba(255,255,255,0.05)'; x.fillRect(0, y, W2, 1);
  }
  var C=['#e9ecf2','#f3f5f9','#243146','#b8362a','#e2c458','#356945','#87543a',
         '#653b80','#18233a','#d3d7de','#95202f','#2b689f','#d9853a','#343941',
         '#0f1a2c','#c9ccd4'];
  var SK=['#f0c9a0','#dba372','#b87a4e','#8a5a36','#5f3a22'];
  for(r=0;r<rows;r++){
    var yy=r*rh+rh*0.06, per=132;
    for(i=0;i<per;i++){
      var px=(i/per)*W2 + (Math.random()-0.5)*5.0;
      if(Math.random()<0.05) continue;                 /* qualche posto vuoto */
      x.globalAlpha=0.86+Math.random()*0.14;
      x.fillStyle=C[(Math.random()*C.length)|0];
      x.fillRect(px, yy+rh*0.36, 5.0, rh*0.50);        /* busto */
      x.fillStyle=SK[(Math.random()*SK.length)|0];
      x.fillRect(px+0.8, yy+rh*0.06, 3.2, rh*0.32);    /* testa */
      if(Math.random()<0.06){                          /* braccia alzate */
        x.fillStyle=SK[(Math.random()*SK.length)|0];
        x.fillRect(px-0.6, yy-rh*0.18, 1.4, rh*0.34);
        x.fillRect(px+4.2, yy-rh*0.18, 1.4, rh*0.34);
      }
    }
  }
  x.globalAlpha=1;
  /* scalette e ringhiere */
  for(i=0;i<11;i++){
    var sx2=18+i*92;
    x.fillStyle='rgba(24,30,40,0.55)'; x.fillRect(sx2, 0, 13, H2);
    x.fillStyle='rgba(210,220,235,0.20)'; x.fillRect(sx2, 0, 2.5, H2);
  }
  /* macchie di colore: settori tifoseria */
  for(i=0;i<9;i++){
    var bx2=Math.random()*W2, by2=Math.random()*H2*0.85, bw2=70+Math.random()*160, bh2=40+Math.random()*80;
    x.fillStyle='rgba('+((Math.random()*80)|0)+','+((Math.random()*80)|0)+','+((Math.random()*90)|0)+','+(0.06+Math.random()*0.10)+')';
    x.fillRect(bx2,by2,bw2,bh2);
  }
  /* ombra della copertura sulle file alte (parte alta della texture) */
  var sh2=x.createLinearGradient(0,0,0,H2*0.34);
  sh2.addColorStop(0,'rgba(0,0,0,0.62)'); sh2.addColorStop(1,'rgba(0,0,0,0)');
  x.fillStyle=sh2; x.fillRect(0,0,W2,H2*0.34);

  /* sfocatura leggera: profondita' di campo "gratis" e zero aliasing */
  var c2=cvs2(W2,H2), x2=c2.getContext('2d');
  x2.imageSmoothingEnabled=true;
  var sm=cvs2(W2/4,H2/4);
  sm.getContext('2d').drawImage(c,0,0,W2/4,H2/4);
  x2.drawImage(c,0,0);
  x2.globalAlpha=0.55; x2.drawImage(sm,0,0,W2,H2); x2.globalAlpha=1;
  return tex(c2,true,true);
}
function texNet(){
  var S=256, c=cvs2(S,S), x=c.getContext('2d');
  x.clearRect(0,0,S,S);
  x.strokeStyle='rgba(255,255,255,0.92)'; x.lineWidth=2.1;
  var n=16, st=S/n, i;
  for(i=0;i<=n;i++){
    x.beginPath(); x.moveTo(i*st,0); x.lineTo(i*st,S); x.stroke();
    x.beginPath(); x.moveTo(0,i*st); x.lineTo(S,i*st); x.stroke();
  }
  /* nodi: la rete non e' una griglia perfetta */
  x.fillStyle='rgba(255,255,255,0.85)';
  for(i=0;i<=n;i++) for(var j=0;j<=n;j++) x.fillRect(i*st-1.6, j*st-1.6, 3.2, 3.2);
  return tex(c,true,true);
}
function texBall(){
  var W2=1024, H2=512, c=cvs2(W2,H2), x=c.getContext('2d');
  x.fillStyle='#f7f9fc'; x.fillRect(0,0,W2,H2);
  /* pannelli scuri a tre fasce, stile pallone da partita */
  var P2=[], i, k;
  for(i=0;i<6;i++) P2.push([84+i*170, 96]);
  for(i=0;i<6;i++) P2.push([170+i*170, 256]);
  for(i=0;i<6;i++) P2.push([84+i*170, 416]);
  for(i=0;i<P2.length;i++){
    var gd=x.createRadialGradient(P2[i][0]-10,P2[i][1]-10,4,P2[i][0],P2[i][1],54);
    gd.addColorStop(0, (i%3===0)?'#2a3244':'#1b2231');
    gd.addColorStop(1, (i%3===0)?'#0e131d':'#0a0e17');
    x.fillStyle=gd;
    x.beginPath();
    for(k=0;k<5;k++){
      var a=k/5*6.2832 - 1.2 + (i%2?0.42:0);
      var vx=P2[i][0]+Math.cos(a)*50, vy=P2[i][1]+Math.sin(a)*44;
      if(k===0) x.moveTo(vx,vy); else x.lineTo(vx,vy);
    }
    x.closePath(); x.fill();
  }
  /* cuciture */
  x.strokeStyle='rgba(150,160,178,0.55)'; x.lineWidth=3.4;
  for(i=0;i<P2.length;i++){ x.beginPath(); x.arc(P2[i][0],P2[i][1],55,0,6.2832); x.stroke(); }
  /* logo/scritta discreta */
  x.save();
  x.fillStyle='rgba(30,40,60,0.55)'; x.font='700 34px Arial, sans-serif';
  x.textAlign='center'; x.fillText('M26', 512, 40); x.restore();
  return tex(c,true,true);
}
function texShadow(){
  var S=128, c=cvs2(S,S), x=c.getContext('2d');
  var g=x.createRadialGradient(S/2,S/2,0,S/2,S/2,S/2);
  g.addColorStop(0,'rgba(0,0,0,0.55)');
  g.addColorStop(0.45,'rgba(0,0,0,0.28)');
  g.addColorStop(1,'rgba(0,0,0,0)');
  x.fillStyle=g; x.fillRect(0,0,S,S);
  return tex(c,false,true);
}
function texRing(col){
  var S=256, c=cvs2(S,S), x=c.getContext('2d');
  x.clearRect(0,0,S,S);
  x.strokeStyle=col; x.lineWidth=15;
  x.beginPath(); x.arc(S/2,S/2,100,0,Math.PI*2); x.stroke();
  x.strokeStyle='rgba(255,255,255,0.7)'; x.lineWidth=4;
  x.beginPath(); x.arc(S/2,S/2,100,0,Math.PI*2); x.stroke();
  return tex(c,false,true);
}
function texGlow(){
  var S=256, c=cvs2(S,S), x=c.getContext('2d');
  var g=x.createRadialGradient(S/2,S/2,0,S/2,S/2,S/2);
  g.addColorStop(0,'rgba(255,255,245,1)');
  g.addColorStop(0.18,'rgba(255,252,225,0.55)');
  g.addColorStop(0.55,'rgba(210,230,255,0.12)');
  g.addColorStop(1,'rgba(180,210,255,0)');
  x.fillStyle=g; x.fillRect(0,0,S,S);
  return tex(c,false,true);
}
/* cartelloni LED: due varianti, testo diritto e specchiato */
function texBoard(mirror){
  var W2=2048, H2=128, c=cvs2(W2,H2), x=c.getContext('2d');
  var segs=[['#08122b','#12336e','KFM27'],['#2b0810','#7a1230','LIVE MATCH'],
            ['#071f16','#0e6b45','M26 LEAGUE'],['#1a1204','#7a5a10','FOOTBALL 26']];
  var segW=W2/segs.length, i;
  for(i=0;i<segs.length;i++){
    var s=segs[i];
    var g=x.createLinearGradient(i*segW,0,(i+1)*segW,H2);
    g.addColorStop(0,s[0]); g.addColorStop(0.5,s[1]); g.addColorStop(1,s[0]);
    x.fillStyle=g; x.fillRect(i*segW,0,segW,H2);
    x.save();
    if(mirror){ x.translate(W2,0); x.scale(-1,1); x.translate(W2-(i*segW+segW/2)-W2, 0); }
    else { x.translate(i*segW+segW/2, 0); }
    x.fillStyle='rgba(255,255,255,0.96)';
    x.font='800 62px Arial, Helvetica, sans-serif';
    x.textAlign='center'; x.textBaseline='middle';
    x.fillText(s[2], mirror? (i*segW+segW/2) : 0, H2*0.52);
    x.restore();
  }
  /* griglia dei LED + riflesso */
  x.globalAlpha=0.22; x.fillStyle='#000';
  for(i=0;i<W2;i+=3) x.fillRect(i,0,1.2,H2);
  for(i=0;i<H2;i+=3) x.fillRect(0,i,W2,1.2);
  x.globalAlpha=1;
  var rg=x.createLinearGradient(0,0,0,H2);
  rg.addColorStop(0,'rgba(255,255,255,0.16)'); rg.addColorStop(0.5,'rgba(255,255,255,0)');
  rg.addColorStop(1,'rgba(0,0,0,0.35)');
  x.fillStyle=rg; x.fillRect(0,0,W2,H2);
  return tex(c,true,true);
}
/* cielo: gradiente + foschia sopra le tribune */
function texSky(){
  var W2=1024, H2=512, c=cvs2(W2,H2), x=c.getContext('2d');
  var g=x.createLinearGradient(0,0,0,H2);
  g.addColorStop(0,'#6fa8dd');   /* zenit */
  g.addColorStop(0.42,'#9dc6e8');
  g.addColorStop(0.72,'#cfe0ec');
  g.addColorStop(1,'#e8eef2');   /* orizzonte lattiginoso */
  x.fillStyle=g; x.fillRect(0,0,W2,H2);
  /* nuvole morbide */
  var i;
  for(i=0;i<90;i++){
    var cx=Math.random()*W2, cy=H2*(0.12+Math.random()*0.55), r=30+Math.random()*130;
    var cg=x.createRadialGradient(cx,cy,0,cx,cy,r);
    cg.addColorStop(0,'rgba(255,255,255,'+(0.10+Math.random()*0.22)+')');
    cg.addColorStop(1,'rgba(255,255,255,0)');
    x.fillStyle=cg; x.beginPath(); x.ellipse(cx,cy,r,r*0.45,0,0,6.2832); x.fill();
  }
  return tex(c,true,true);
}
/* cemento/struttura: facciate e tetto */
function texConcrete(){
  var S=512, c=cvs2(S,S), x=c.getContext('2d');
  x.fillStyle='#20242c'; x.fillRect(0,0,S,S);
  x.save(); x.globalAlpha=0.30;
  x.fillStyle=x.createPattern(noiseCv(128,80,150),'repeat'); x.fillRect(0,0,S,S);
  x.restore();
  var i;
  for(i=0;i<=8;i++){
    x.fillStyle='rgba(0,0,0,0.35)'; x.fillRect(0, i*S/8, S, 2);
    x.fillStyle='rgba(255,255,255,0.05)'; x.fillRect(0, i*S/8+2, S, 1);
  }
  for(i=0;i<=8;i++){ x.fillStyle='rgba(0,0,0,0.22)'; x.fillRect(i*S/8, 0, 2, S); }
  return tex(c,true,true);
}
/* bandierina d'angolo */
function texFlag(){
  var c=cvs2(128,128), x=c.getContext('2d');
  x.fillStyle='#ffd200'; x.fillRect(0,0,128,128);
  x.fillStyle='#e02020';
  x.beginPath(); x.moveTo(0,0); x.lineTo(128,64); x.lineTo(0,128); x.closePath(); x.fill();
  return tex(c,false,true);
}

/* ================================ SHADER ================================= */
var VS_MAIN = [
'attribute vec3 aP; attribute vec3 aN; attribute vec2 aT;',
'uniform mat4 uMVP; uniform mat4 uM; uniform mat4 uLVP; uniform vec4 uUV;',
'varying vec3 vN; varying vec2 vT; varying vec3 vW; varying vec4 vL;',
'void main(){',
'  vec4 w = uM*vec4(aP,1.0);',
'  vW = w.xyz;',
'  vec3 s = vec3(length(uM[0].xyz), length(uM[1].xyz), length(uM[2].xyz));',
'  s = max(s, vec3(1e-4));',
'  vN = mat3(uM)*(aN/(s*s));',
'  vT = aT*uUV.xy + uUV.zw;',
'  vL = uLVP*w;',
'  gl_Position = uMVP*vec4(aP,1.0);',
'}'].join('\n');

var FS_MAIN = [
'precision highp float;',
'uniform vec3 uC; uniform sampler2D uS; uniform sampler2D uSh; uniform sampler2D uDet;',
'uniform float uUseT, uA, uAmb, uSpec, uGloss, uEmit, uDetK, uFogK, uShOn, uShTx, uEnc, uAO, uTone;',
'uniform vec3 uL, uCam, uSun, uSky, uGnd, uFog;',
'varying vec3 vN; varying vec2 vT; varying vec3 vW; varying vec4 vL;',
'float unpk(vec4 v){ return dot(v, vec4(1.0, 1.0/255.0, 1.0/65025.0, 1.0/16581375.0)); }',
'float tap(vec2 uv, float z, float b){ return (z - b) > unpk(texture2D(uSh, uv)) ? 0.0 : 1.0; }',
'float shadow(vec3 n){',
'  if(uShOn < 0.5) return 1.0;',
'  vec3 p = vL.xyz/vL.w*0.5+0.5;',
'  if(p.x<0.01||p.x>0.99||p.y<0.01||p.y>0.99||p.z>0.999) return 1.0;',
'  float sl = clamp(1.0 - dot(n, uL), 0.0, 1.0);',
'  float b = 0.0011 + sl*0.0032;',
'  float o = 1.0/uShTx;',
'  float s = 0.0;',
'  s += tap(p.xy + vec2( 0.0, 0.0)*o, p.z, b);',
'  s += tap(p.xy + vec2( 1.3, 0.0)*o, p.z, b);',
'  s += tap(p.xy + vec2(-1.3, 0.0)*o, p.z, b);',
'  s += tap(p.xy + vec2( 0.0, 1.3)*o, p.z, b);',
'  s += tap(p.xy + vec2( 0.0,-1.3)*o, p.z, b);',
'  s += tap(p.xy + vec2( 1.0, 1.0)*o, p.z, b);',
'  s += tap(p.xy + vec2(-1.0, 1.0)*o, p.z, b);',
'  s += tap(p.xy + vec2( 1.0,-1.0)*o, p.z, b);',
'  s += tap(p.xy + vec2(-1.0,-1.0)*o, p.z, b);',
'  s += tap(p.xy + vec2( 2.6, 0.6)*o, p.z, b);',
'  s += tap(p.xy + vec2(-2.6,-0.6)*o, p.z, b);',
'  s += tap(p.xy + vec2( 0.6,-2.6)*o, p.z, b);',
'  s += tap(p.xy + vec2(-0.6, 2.6)*o, p.z, b);',
'  s /= 13.0;',
'  vec2 e = abs(p.xy-0.5)*2.0;',
'  float fade = clamp((1.0 - max(e.x,e.y))*7.0, 0.0, 1.0);',
'  return mix(1.0, s, fade);',
'}',
'void main(){',
'  vec3 n = normalize(vN);',
'  vec3 v = normalize(uCam - vW);',
'  vec4 t = texture2D(uS, vT);',
'  vec3 base = mix(uC, t.rgb*t.rgb*uC, uUseT);',
'  float a = uA*mix(1.0, t.a, uUseT);',
'  if(a < 0.02) discard;',
'  if(uDetK > 0.0){',
'    vec3 d = texture2D(uDet, vT*uDetK).rgb;',
'    base *= 0.80 + 0.42*d.r;',
'    n = normalize(n + vec3((d.g-0.5)*0.55, 0.0, (d.b-0.5)*0.55));',
'  }',
'  float ndl = max(dot(n, uL), 0.0);',
'  float sd = shadow(n);',
'  vec3 amb = mix(uGnd, uSky, clamp(n.y*0.5+0.5, 0.0, 1.0));',
'  float ao = mix(1.0, clamp(0.42 + vW.y*0.42, 0.0, 1.0), uAO);',
'  vec3 col = base*(amb*uAmb*ao + uSun*ndl*sd);',
'  vec3 h = normalize(uL + v);',
'  float sp = pow(max(dot(n,h), 0.0), uGloss)*uSpec*sd*step(0.002, ndl);',
'  col += uSun*sp;',
'  float rim = pow(1.0 - max(dot(n,v), 0.0), 3.5);',
'  col += uSky*rim*base*0.35;',
'  col += base*uEmit;',
'  float dist = length(vW - uCam);',
'  float fog = clamp((dist - 55.0)/220.0, 0.0, 1.0);',
'  fog = fog*fog*0.72*uFogK;',
'  col = mix(col, uFog, fog);',
'  vec3 outc = col*uEnc;',
'  if(uTone > 0.5){',
'    vec3 tx = col*1.05;',
'    tx = clamp((tx*(2.51*tx + 0.03))/(tx*(2.43*tx + 0.59) + 0.14), 0.0, 1.0);',
'    outc = pow(tx, vec3(1.0/2.2));',
'  }',
'  gl_FragColor = vec4(outc, a);',
'}'].join('\n');

var VS_SH = [
'attribute vec3 aP;',
'uniform mat4 uMVP;',
'void main(){ gl_Position = uMVP*vec4(aP,1.0); }'].join('\n');

var FS_SH = [
'precision highp float;',
'void main(){',
'  float z = gl_FragCoord.z;',
'  vec4 e = vec4(1.0, 255.0, 65025.0, 16581375.0)*z;',
'  e = fract(e);',
'  e -= e.yzww*vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);',
'  gl_FragColor = e;',
'}'].join('\n');

var VS_QUAD = [
'attribute vec3 aP; attribute vec2 aT;',
'varying vec2 vT;',
'void main(){ vT = aT; gl_Position = vec4(aP.xy, 0.0, 1.0); }'].join('\n');

var FS_BRIGHT = [
'precision highp float;',
'uniform sampler2D uS; uniform vec2 uTx; uniform float uThr, uDec;',
'varying vec2 vT;',
'void main(){',
'  vec3 c = vec3(0.0);',
'  c += texture2D(uS, vT + vec2( 0.5, 0.5)*uTx).rgb;',
'  c += texture2D(uS, vT + vec2(-0.5, 0.5)*uTx).rgb;',
'  c += texture2D(uS, vT + vec2( 0.5,-0.5)*uTx).rgb;',
'  c += texture2D(uS, vT + vec2(-0.5,-0.5)*uTx).rgb;',
'  c = c*0.25*uDec;',
'  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));',
'  float k = max(0.0, l - uThr)/max(l, 0.0001);',
'  gl_FragColor = vec4(c*k, 1.0);',
'}'].join('\n');

var FS_BLUR = [
'precision highp float;',
'uniform sampler2D uS; uniform vec2 uDir;',
'varying vec2 vT;',
'void main(){',
'  vec3 c = texture2D(uS, vT).rgb*0.2270270270;',
'  c += texture2D(uS, vT + uDir*1.3846153846).rgb*0.3162162162;',
'  c += texture2D(uS, vT - uDir*1.3846153846).rgb*0.3162162162;',
'  c += texture2D(uS, vT + uDir*3.2307692308).rgb*0.0702702703;',
'  c += texture2D(uS, vT - uDir*3.2307692308).rgb*0.0702702703;',
'  gl_FragColor = vec4(c, 1.0);',
'}'].join('\n');

var FS_COMP = [
'precision highp float;',
'uniform sampler2D uS, uB1, uB2;',
'uniform vec2 uTx;',
'uniform float uDec, uExp, uBloom, uSat, uCon, uVig, uGrain, uSharp, uChro, uTime, uFlash;',
'varying vec2 vT;',
'vec3 aces(vec3 x){ return clamp((x*(2.51*x + 0.03))/(x*(2.43*x + 0.59) + 0.14), 0.0, 1.0); }',
'float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233)))*43758.5453); }',
'void main(){',
'  vec2 q = vT - 0.5;',
'  float r2 = dot(q, q);',
'  float ca = uChro*r2;',
'  vec3 c;',
'  c.r = texture2D(uS, vT + q*ca).r;',
'  c.g = texture2D(uS, vT).g;',
'  c.b = texture2D(uS, vT - q*ca).b;',
'  c *= uDec;',
'  vec3 blur = (texture2D(uS, vT + vec2(uTx.x, 0.0)).rgb + texture2D(uS, vT - vec2(uTx.x, 0.0)).rgb',
'             + texture2D(uS, vT + vec2(0.0, uTx.y)).rgb + texture2D(uS, vT - vec2(0.0, uTx.y)).rgb)*0.25*uDec;',
'  c += (c - blur)*uSharp;',
'  vec3 bl = texture2D(uB1, vT).rgb*0.62 + texture2D(uB2, vT).rgb*0.38;',
'  c += bl*uBloom;',
'  c += uFlash;',
'  c = aces(c*uExp);',
'  c = pow(max(c, 0.0), vec3(1.0/2.2));',
'  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));',
'  c = mix(vec3(l), c, uSat);',
'  c = clamp((c - 0.5)*uCon + 0.5, 0.0, 1.0);',
'  c *= 1.0 - uVig*r2*1.9;',
'  c += (hash(vT*vec2(1024.0, 768.0) + uTime) - 0.5)*uGrain;',
'  gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);',
'}'].join('\n');

/* ============================== FRAMEBUFFER ============================== */
function mkTexFB(w,h,depth){
  var t=gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D,t);
  /* formato dimensionato: alcuni driver rifiutano RGBA non dimensionato
     come bersaglio di rendering (FRAMEBUFFER_UNSUPPORTED) */
  if(GL2) gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
  else    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA ,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  var fb=gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER,fb);
  gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,t,0);
  var rb=null, st=gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if(depth){
    /* prova in sequenza i formati di profondita' finche' uno e' completo */
    var cand = GL2 ? [[gl.DEPTH_COMPONENT24, gl.DEPTH_ATTACHMENT],
                      [gl.DEPTH24_STENCIL8, gl.DEPTH_STENCIL_ATTACHMENT],
                      [gl.DEPTH_COMPONENT16, gl.DEPTH_ATTACHMENT]]
                   : [[gl.DEPTH_COMPONENT16, gl.DEPTH_ATTACHMENT],
                      [gl.DEPTH_STENCIL, gl.DEPTH_STENCIL_ATTACHMENT]];
    for(var i=0;i<cand.length;i++){
      if(rb){ gl.deleteRenderbuffer(rb); rb=null; }
      rb=gl.createRenderbuffer(); gl.bindRenderbuffer(gl.RENDERBUFFER,rb);
      gl.renderbufferStorage(gl.RENDERBUFFER, cand[i][0], w, h);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, cand[i][1], gl.RENDERBUFFER, rb);
      st=gl.checkFramebufferStatus(gl.FRAMEBUFFER);
      if(st===gl.FRAMEBUFFER_COMPLETE) break;
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, cand[i][1], gl.RENDERBUFFER, null);
    }
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);
  return { fb:fb, tex:t, rb:rb, w:w, h:h, st:st };
}
function mkMsaaFB(w,h,samples){
  var fb=gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER,fb);
  var cb=gl.createRenderbuffer(); gl.bindRenderbuffer(gl.RENDERBUFFER,cb);
  gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, gl.RGBA8, w, h);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, cb);
  var db=gl.createRenderbuffer(); gl.bindRenderbuffer(gl.RENDERBUFFER,db);
  gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, gl.DEPTH_COMPONENT24, w, h);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, db);
  var ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER)===gl.FRAMEBUFFER_COMPLETE;
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);
  if(!ok) return null;
  return { fb:fb, cb:cb, db:db, w:w, h:h, samples:samples };
}
function delFB(o){
  if(!o) return;
  try{ if(o.fb) gl.deleteFramebuffer(o.fb); }catch(e){}
  try{ if(o.tex) gl.deleteTexture(o.tex); }catch(e){}
  try{ if(o.rb) gl.deleteRenderbuffer(o.rb); }catch(e){}
  try{ if(o.cb) gl.deleteRenderbuffer(o.cb); }catch(e){}
  try{ if(o.db) gl.deleteRenderbuffer(o.db); }catch(e){}
}
function targets(w,h){
  if(FB.w===w && FB.h===h) return;
  delFB(FB.msaa); delFB(FB.scene); delFB(FB.b1a); delFB(FB.b1b); delFB(FB.b2a); delFB(FB.b2b);
  FB.msaa=null;
  if(GL2){
    var smp=Math.min(8, gl.getParameter(gl.MAX_SAMPLES)||4);
    FB.msaa=mkMsaaFB(w,h,smp);
  }
  FB.scene=mkTexFB(w,h,!FB.msaa);
  var w1=Math.max(4,w>>1), h1=Math.max(4,h>>1);
  var w2=Math.max(4,w>>2), h2=Math.max(4,h>>2);
  FB.b1a=mkTexFB(w1,h1,false); FB.b1b=mkTexFB(w1,h1,false);
  FB.b2a=mkTexFB(w2,h2,false); FB.b2b=mkTexFB(w2,h2,false);
  FB.w=w; FB.h=h;
  FB.ok = (FB.scene.st===gl.FRAMEBUFFER_COMPLETE &&
           FB.b1a.st===gl.FRAMEBUFFER_COMPLETE &&
           FB.b2a.st===gl.FRAMEBUFFER_COMPLETE);
  if(!FB.ok) FB.msaa=null;
  R.fbInfo='scene:'+FB.scene.st+' b1:'+FB.b1a.st+' b2:'+FB.b2a.st+
           ' msaa:'+(FB.msaa?FB.msaa.samples:'-')+' err:'+gl.getError()+
           ' sh:'+(FB.shadow?FB.shadow.st:'-');
}

/* ================================= INIT ================================== */
var SUN = [1.32, 1.24, 1.08];          /* colore del sole (lineare) */
var SKYC = [0.30, 0.40, 0.55];         /* ambiente dall'alto */
var GNDC = [0.13, 0.17, 0.11];         /* rimbalzo dal prato */
var FOGC = [0.62, 0.70, 0.78];
var LDIR = [0.30, 0.86, 0.41];         /* direzione della luce (normalizzata sotto) */
(function(){ var l=Math.sqrt(LDIR[0]*LDIR[0]+LDIR[1]*LDIR[1]+LDIR[2]*LDIR[2]); LDIR[0]/=l; LDIR[1]/=l; LDIR[2]/=l; })();
var ENC = 0.45;                        /* codifica HDR in RGBA8 (1/ENC = range) */

/* La partita distrugge l'overlay a fine gara e lo ricrea alla successiva:
   queste funzioni rimettono la tela WebGL nel nuovo contenitore e, se il
   contesto e' andato perso, ricostruiscono tutto da zero. */
function ensureHost(){
  if(typeof ctx==='undefined' || !ctx || !ctx.canvas || !ctx.canvas.parentNode) return false;
  var host=ctx.canvas.parentNode;
  if(!R.cvs){ hardReset(); return false; }
  if(R.cvs.parentNode !== host){
    try{ host.insertBefore(R.cvs, ctx.canvas); }catch(e){ hardReset(); return false; }
  }
  if(R.cvs.style.display==='none') R.cvs.style.display='block';
  try{ ctx.canvas.style.background='transparent'; ctx.canvas.style.zIndex='1'; }catch(e){}
  return true;
}
function hardReset(){
  try{ if(R.cvs && R.cvs.parentNode) R.cvs.parentNode.removeChild(R.cvs); }catch(e){}
  R.cvs=null; gl=null; GL2=false; EXT={}; T={}; G_={}; P={}; FB={}; CUR=null;
  LVP=null; VP=null;
  R.ok=false; R.failed=false; R.err=null; R.shOK=false; R._last=0; R.nets=[];
}

function init(){
  try{
    if(typeof ctx==='undefined' || !ctx || !ctx.canvas || !ctx.canvas.parentNode) return false;
    var host=ctx.canvas.parentNode;
    var c=document.createElement('canvas');
    c.id='m26-gl';
    c.style.cssText='position:absolute;left:0;top:0;width:100%;height:100%;display:block;z-index:0;';
    host.insertBefore(c, ctx.canvas);
    try{ ctx.canvas.style.background='transparent'; ctx.canvas.style.zIndex='1'; }catch(e){}
    var opt={ antialias:false, alpha:false, depth:true, stencil:false,
              premultipliedAlpha:false, preserveDrawingBuffer:true,
              powerPreference:'high-performance' };
    gl=c.getContext('webgl2',opt); GL2=!!gl;
    if(!gl) gl=c.getContext('webgl',opt)||c.getContext('experimental-webgl',opt);
    if(!gl){ host.removeChild(c); return false; }
    R.cvs=c; R.gl2=GL2;
    try{
      c.addEventListener('webglcontextlost', function(ev){
        try{ ev.preventDefault(); }catch(_){}
        R.lost=true; R.needReset=true;
      }, false);
      c.addEventListener('webglcontextrestored', function(){ R.lost=false; R.needReset=true; }, false);
    }catch(e){}

    EXT.aniso = gl.getExtension('EXT_texture_filter_anisotropic')
             || gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic')
             || gl.getExtension('MOZ_EXT_texture_filter_anisotropic');
    EXT.anisoMax = EXT.aniso ? Math.min(16, gl.getParameter(EXT.aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT)) : 1;
    if(!GL2){ EXT.eltIdx = gl.getExtension('OES_element_index_uint'); }

    P.main = program(VS_MAIN, FS_MAIN);
    P.sh   = program(VS_SH,   FS_SH);
    P.br   = program(VS_QUAD, FS_BRIGHT);
    P.bl   = program(VS_QUAD, FS_BLUR);
    P.cp   = program(VS_QUAD, FS_COMP);

    G_.box=geoBox(); G_.cyl=geoCyl(26); G_.sph=geoSph(22,30); G_.sphL=geoSph(12,18);
    G_.pl=geoPlane(); G_.grid=geoGrid(64,44); G_.quad=geoQuadV(); G_.ramp=geoRamp(14);
    G_.dome=geoDome(14,28); G_.full=geoFull();

    T.pitch  = texPitch();
    T.det    = texTurfDetail();
    T.crowd  = texCrowd();
    T.net    = texNet();
    T.ball   = texBall();
    T.shadow = texShadow();
    T.glow   = texGlow();
    T.ringY  = texRing('rgba(255,214,74,0.95)');
    T.ringG  = texRing('rgba(90,240,170,0.95)');
    T.board  = texBoard(false);
    T.boardM = texBoard(true);
    T.sky    = texSky();
    T.conc   = texConcrete();
    T.flag   = texFlag();

    /* shadow map: si parte da 4096 e si scende finche' il driver la accetta */
    var maxT=gl.getParameter(gl.MAX_TEXTURE_SIZE)||2048;
    var cand=[4096,2048,1024], k, ss;
    for(k=0;k<cand.length;k++){
      ss=Math.min(cand[k], maxT);
      FB.shadow=mkTexFB(ss,ss,true);
      R.shSize=ss;
      if(FB.shadow.st===gl.FRAMEBUFFER_COMPLETE) break;
      delFB(FB.shadow); FB.shadow=null;
    }
    R.shOK = !!(FB.shadow && FB.shadow.st===gl.FRAMEBUFFER_COMPLETE);

    gl.enable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0.06,0.09,0.13,1);
    R.ok=true;
    return true;
  }catch(e){
    R.failed=true; R.err=(e&&e.message)||String(e);
    try{ if(typeof noteDrawErr==='function') noteDrawErr('gl-init',e); }catch(_){}
    try{ if(R.cvs && R.cvs.parentNode) R.cvs.parentNode.removeChild(R.cvs); }catch(_){}
    R.cvs=null;
    return false;
  }
}

/* ================================ DISEGNO =============================== */
var MT_DEF = { spec:0.06, gloss:24, cast:true, uv:null, emit:0, fog:1, det:0, ao:0 };
function bindGeo(geo){
  var a=CUR.a;
  gl.bindBuffer(gl.ARRAY_BUFFER,geo.p);
  gl.enableVertexAttribArray(a.aP); gl.vertexAttribPointer(a.aP,3,gl.FLOAT,false,0,0);
  if(a.aN!==undefined){ gl.bindBuffer(gl.ARRAY_BUFFER,geo.n); gl.enableVertexAttribArray(a.aN); gl.vertexAttribPointer(a.aN,3,gl.FLOAT,false,0,0); }
  if(a.aT!==undefined){ gl.bindBuffer(gl.ARRAY_BUFFER,geo.t); gl.enableVertexAttribArray(a.aT); gl.vertexAttribPointer(a.aT,2,gl.FLOAT,false,0,0); }
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,geo.i);
}
function drawGeo(geo){
  gl.drawElements(gl.TRIANGLES, geo.c, geo.t32?gl.UNSIGNED_INT:gl.UNSIGNED_SHORT, 0);
}
/* dr(geometria, matrice, colore, texture, alpha, ambiente, materiale) */
function dr(geo, mat, col, texture, alpha, amb, mt){
  if(!geo) return;
  var a = (alpha===undefined) ? 1 : alpha;
  if(R.pass==='shadow'){
    if(a < 0.9) return;
    if(mt && mt.cast===false) return;
    bindGeo(geo);
    um4('uMVP', m4mul(LVP, mat));
    drawGeo(geo);
    return;
  }
  mt = mt||MT_DEF;
  bindGeo(geo);
  um4('uM', mat);
  um4('uMVP', m4mul(VP, mat));
  var c=col||WHITE;
  u3f('uC', c[0], c[1], c[2]);
  u1f('uUseT', texture?1:0);
  u1f('uA', a);
  u1f('uAmb', amb===undefined?0.60:amb);
  u1f('uSpec', mt.spec===undefined?MT_DEF.spec:mt.spec);
  u1f('uGloss', mt.gloss===undefined?MT_DEF.gloss:mt.gloss);
  u1f('uEmit', mt.emit||0);
  u1f('uFogK', mt.fog===undefined?1:mt.fog);
  u1f('uDetK', mt.det||0);
  u1f('uAO', mt.ao||0);
  if(mt.uv) u4f('uUV', mt.uv[0], mt.uv[1], mt.uv[2], mt.uv[3]);
  else      u4f('uUV', 1,1,0,0);
  if(texture){ gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texture); }
  R.nd=(R.nd||0)+1;
  drawGeo(geo);
}
var WHITE=[1,1,1], GREY=[0.66,0.70,0.74], DARK=[0.030,0.038,0.052];
var STEEL=[0.10,0.12,0.15], RAIL=[0.62,0.68,0.76];
var MT_SKIN  = { spec:0.16, gloss:18, ao:1 };
var MT_CLOTH = { spec:0.05, gloss:10, ao:1 };
var MT_BOOT  = { spec:0.55, gloss:60, ao:1 };
var MT_GRASS = { spec:0.10, gloss:14, cast:false, det:52 };
var MT_LED    = { spec:0.14, gloss:30, emit:0.55, cast:false };
var MT_CROWD  = { spec:0.02, gloss:8, cast:false, fog:1 };
var MT_NOCAST = { spec:0.05, gloss:16, cast:false };
var MT_METAL  = { spec:0.42, gloss:70 };
var MT_BALL   = { spec:0.42, gloss:46 };

function blob(x,z,rad,alpha){
  if(R.pass==='shadow') return;
  gl.depthMask(false);
  dr(G_.pl, m4up(x,0.02,z, 0,1, rad*2, 1, rad*2), [0,0,0], T.shadow,
     alpha===undefined?0.30:alpha, 1.0, { spec:0, gloss:8, cast:false, fog:1 });
  gl.depthMask(true);
}
function bx(x,y,z, w,h,d, col, texture, amb, mt){
  dr(G_.box, m4up(x,y,z, 0,1, w,h,d), col||WHITE, texture||null, 1,
     amb===undefined?0.55:amb, mt);
}
function goal3D(side){
  var gy=GOAL_Y, gh=GOAL_H, px=side*HX, dep=2.0, th=0.12;
  var M={ spec:0.30, gloss:60 };
  /* pali e traversa: cilindri, non travi quadrate */
  dr(G_.cyl, m4seg(px,0,-gy, px,gh,-gy, th*0.5), WHITE, null, 1, 0.70, M);
  dr(G_.cyl, m4seg(px,0, gy, px,gh, gy, th*0.5), WHITE, null, 1, 0.70, M);
  dr(G_.cyl, m4seg(px,gh,-gy, px,gh, gy, th*0.5), WHITE, null, 1, 0.76, M);
  var bxp=px+side*dep;
  dr(G_.cyl, m4seg(bxp,0,-gy, bxp,gh*0.84,-gy, 0.045), GREY, null, 1, 0.68, M);
  dr(G_.cyl, m4seg(bxp,0, gy, bxp,gh*0.84, gy, 0.045), GREY, null, 1, 0.68, M);
  dr(G_.cyl, m4seg(px,gh,-gy, bxp,gh*0.84,-gy, 0.038), GREY, null, 1, 0.66, M);
  dr(G_.cyl, m4seg(px,gh, gy, bxp,gh*0.84, gy, 0.038), GREY, null, 1, 0.66, M);
  /* rete: quattro piani trasparenti disegnati per ultimi */
  R.nets.push([m4up(bxp, gh*0.42, 0, 0,1, 0.02, gh*0.84, gy*2+0.1), 0.50, [3.6,1.6,0,0]]);
  R.nets.push([m4up(px+side*dep*0.5, gh*0.99, 0, 0,1, dep, 0.02, gy*2), 0.36, [2.0,3.0,0,0]]);
  R.nets.push([m4up(px+side*dep*0.5, gh*0.45, -gy, 0,1, dep*0.999, gh*0.9, 0.02), 0.42, [2.0,1.7,0,0]]);
  R.nets.push([m4up(px+side*dep*0.5, gh*0.45,  gy, 0,1, dep*0.999, gh*0.9, 0.02), 0.42, [2.0,1.7,0,0]]);
}

/* ======================= GIOCATORE (versione AAA) =========================
   Corpo alto e snello con materiali separati (pelle, tessuto, scarpini),
   ombra reale proiettata dalla shadow map + contatto morbido a terra.
   Convenzioni: m4up(x,y,z, fx,fz, w,h,d) -> con (0,1) w=X e d=Z; con (1,0) w=Z e d=X.
   ======================================================================== */
function texShirt(kit, isGk, num){
  var S=512, c=cvs2(S,S), x=c.getContext('2d');
  var base = kit.s;
  x.fillStyle=base; x.fillRect(0,0,S,S);
  if(!isGk && kit.p==='stripes'){
    x.fillStyle=kit.s2||'#111111';
    for(var i=0;i<5;i++) x.fillRect(36+i*96, 0, 48, S);
  } else if(!isGk && kit.p==='sash'){
    x.save(); x.fillStyle=kit.s2||'#111111';
    x.translate(S*0.5,S*0.5); x.rotate(-0.7); x.fillRect(-S,-52,S*2,104); x.restore();
  } else if(!isGk){
    var g=x.createLinearGradient(0,0,0,S);
    g.addColorStop(0,'rgba(255,255,255,0.10)');
    g.addColorStop(1,'rgba(0,0,0,0.16)');
    x.fillStyle=g; x.fillRect(0,0,S,S);
  } else {
    var gg=x.createLinearGradient(0,0,S,S);
    gg.addColorStop(0,'rgba(255,255,255,0.16)');
    gg.addColorStop(0.5,'rgba(0,0,0,0.05)');
    gg.addColorStop(1,'rgba(0,0,0,0.22)');
    x.fillStyle=gg; x.fillRect(0,0,S,S);
  }
  /* trama del tessuto: micro rumore, si vede da vicino */
  x.save(); x.globalAlpha=0.10; x.globalCompositeOperation='overlay';
  x.fillStyle=x.createPattern(noiseCv(128,60,200),'repeat'); x.fillRect(0,0,S,S);
  x.restore();
  /* colletto, bordo manica, fascia in fondo */
  x.fillStyle=kit.s2||'#111111'; x.fillRect(0,0,S,26);
  x.fillStyle='rgba(255,255,255,0.22)'; x.fillRect(0,26,S,4);
  x.fillStyle='rgba(0,0,0,0.20)';  x.fillRect(0,S-20,S,20);
  /* fascia sponsor sul petto */
  x.fillStyle='rgba(255,255,255,0.10)'; x.fillRect(0,S*0.40,S,S*0.13);
  /* NUMERO: chiaro sulle maglie scure, scuro su quelle chiare */
  if(num){
    var h=(kit.s||'#888888').replace('#','');
    if(h.length===3) h=h.charAt(0)+h.charAt(0)+h.charAt(1)+h.charAt(1)+h.charAt(2)+h.charAt(2);
    var rr=parseInt(h.substr(0,2),16)||136, gr=parseInt(h.substr(2,2),16)||136, bb=parseInt(h.substr(4,2),16)||136;
    var lm=0.299*rr+0.587*gr+0.114*bb;
    x.font='bold 232px Arial, Helvetica, sans-serif';
    x.textAlign='center'; x.textBaseline='middle';
    x.lineWidth=18; x.lineJoin='round';
    x.strokeStyle=(lm>150)?'rgba(255,255,255,0.90)':'rgba(0,0,0,0.60)';
    x.fillStyle  =(lm>150)?'#161b25':'#f4f7fc';
    x.strokeText(String(num), S*0.5, S*0.56);
    x.fillText(String(num), S*0.5, S*0.56);
  }
  /* ombreggiatura ai lati: il volume del torso si legge meglio */
  var sg2=x.createLinearGradient(0,0,S,0);
  sg2.addColorStop(0,'rgba(0,0,0,0.30)'); sg2.addColorStop(0.22,'rgba(0,0,0,0)');
  sg2.addColorStop(0.78,'rgba(0,0,0,0)'); sg2.addColorStop(1,'rgba(0,0,0,0.30)');
  x.fillStyle=sg2; x.fillRect(0,0,S,S);
  return tex(c,false,true);
}
function shirtTex(p){
  if(!T.shirts) T.shirts={};
  var num = p.shirt||0;
  var k = (p.gk?'g':'t')+p.team+'#'+num;
  if(!T.shirts[k]){
    var kit = p.gk ? ((p.team===0)?{s:'#16D6A4',s2:'#0B7F62'}:{s:'#FFC93C',s2:'#C98F1E'})
                   : G.teams[p.team].kit;
    T.shirts[k]=texShirt(kit, !!p.gk, num);
  }
  return T.shirts[k];
}
/* ======================= GIOCATORI: MODELLO + ANIMAZIONE ==================
   Scheletro anatomico con IK a due ossa e pianificatore di passi: il piede
   d'appoggio resta inchiodato al terreno (niente pattinaggio), il bacino e le
   spalle contro-ruotano, il piede rulla tacco->punta, gli arti sono affusolati
   e il busto si inclina in avanti in base a velocita' e accelerazione.
   ======================================================================== */

/* ======================= GIOCATORI: MODELLO + ANIMAZIONE ==================
   Scheletro anatomico con IK a due ossa sulle gambe e cinematica diretta
   sulle braccia. Il piede d'appoggio resta inchiodato al terreno (niente
   pattinaggio), bacino e spalle contro-ruotano, il piede rulla tacco->punta,
   gli arti sono affusolati e il busto si inclina con velocita' e spinta.
   ======================================================================== */

/* ======================= GIOCATORI: MODELLO + ANIMAZIONE ==================
   Scheletro anatomico con IK a due ossa sulle gambe e cinematica diretta
   sulle braccia. Il piede d'appoggio resta inchiodato al terreno (niente
   pattinaggio), bacino e spalle contro-ruotano, il piede rulla tacco->punta,
   gli arti sono affusolati e il busto si inclina con velocita' e spinta.
   ======================================================================== */

/* ======================= GIOCATORI: MODELLO + ANIMAZIONE ==================
   Scheletro anatomico con IK a due ossa sulle gambe e cinematica diretta
   sulle braccia. Il piede d'appoggio resta inchiodato al terreno (niente
   pattinaggio), bacino e spalle contro-ruotano, il piede rulla tacco->punta,
   gli arti sono affusolati e il busto si inclina con velocita' e spinta.
   ======================================================================== */

/* ======================= GIOCATORI: MODELLO + ANIMAZIONE ==================
   Scheletro anatomico con IK a due ossa sulle gambe e cinematica diretta
   sulle braccia. Il piede d'appoggio resta inchiodato al terreno (niente
   pattinaggio), bacino e spalle contro-ruotano, il piede rulla tacco->punta,
   gli arti sono affusolati e il busto si inclina con velocita' e spinta.
   ======================================================================== */

/* ======================= GIOCATORI: MODELLO + ANIMAZIONE ==================
   Scheletro anatomico con IK a due ossa sulle gambe e cinematica diretta
   sulle braccia. Il piede d'appoggio resta inchiodato al terreno (niente
   pattinaggio), bacino e spalle contro-ruotano, il piede rulla tacco->punta,
   gli arti sono affusolati e il busto si inclina con velocita' e spinta.
   ======================================================================== */

function sg(ax,ay,az,bx2,by2,bz2,r,col,amb,mt){
  dr(G_.cyl, m4seg(ax,ay,az,bx2,by2,bz2,r), col, null, 1, amb===undefined?0.62:amb, mt||MT_CLOTH);
}
/* arto affusolato: cilindri concatenati con raggio interpolato + giunti tondi */
function limb(ax,ay,az, bx,by,bz, r1,r2, col, amb, mt, seg){
  seg = seg||3;
  var px=ax, py=ay, pz=az, i,t,qx,qy,qz,rr,rj;
  for(i=1;i<=seg;i++){
    t=i/seg;
    qx=ax+(bx-ax)*t; qy=ay+(by-ay)*t; qz=az+(bz-az)*t;
    rr=r1+(r2-r1)*((i-0.5)/seg);
    dr(G_.cyl, m4seg(px,py,pz,qx,qy,qz, rr), col, null, 1, amb, mt);
    if(i<seg){ rj=r1+(r2-r1)*t; dr(G_.sphL, m4up(qx,qy,qz,1,0, rj,rj,rj), col,null,1,amb,mt); }
    px=qx; py=qy; pz=qz;
  }
}
function knob(x,y,z, r, col, amb, mt){
  dr(G_.sphL, m4up(x,y,z, 1,0, r,r,r), col, null, 1, amb, mt);
}
/* IK a due ossa: out.x/y/z = ginocchio, out.tx/ty/tz = target raggiungibile */
var _ikA={};
function ikJoint(ax,ay,az, bx,by,bz, l1,l2, px,py,pz, out){
  var dx=bx-ax, dy=by-ay, dz=bz-az;
  var d=Math.sqrt(dx*dx+dy*dy+dz*dz)||1e-4;
  var maxL=(l1+l2)*0.995, k;
  if(d>maxL){ k=maxL/d; dx*=k; dy*=k; dz*=k; d=maxL; }
  out.tx=ax+dx; out.ty=ay+dy; out.tz=az+dz;
  var a=(l1*l1-l2*l2+d*d)/(2*d);
  var h=Math.sqrt(Math.max(0, l1*l1-a*a));
  var ux=dx/d, uy=dy/d, uz=dz/d;
  var dot=px*ux+py*uy+pz*uz;
  var qx=px-ux*dot, qy=py-uy*dot, qz=pz-uz*dot;
  var ql=Math.sqrt(qx*qx+qy*qy+qz*qz);
  if(ql<1e-5){ qx=-ux*uy; qy=1-uy*uy; qz=-uz*uy; ql=Math.sqrt(qx*qx+qy*qy+qz*qz)||1; }
  qx/=ql; qy/=ql; qz/=ql;
  out.x=ax+ux*a+qx*h; out.y=ay+uy*a+qy*h; out.z=az+uz*a+qz*h;
  return out;
}
function angWrap(a){ return Math.atan2(Math.sin(a), Math.cos(a)); }

function player3D(p, lod){
  var hf  = p.hgt||1;
  var dt  = Math.min(0.05, Math.max(0.001, R.dt||0.016));
  var vx  = p.vx||0, vy = p.vy||0;
  var spd = len(vx,vy), mx = p.maxSpd||8;
  var spdN= clamp(spd/mx, 0, 1);
  var X=p.x, Z=p.y;

  /* ------------------------- stato di animazione ------------------------ */
  var A=p._an;
  if(!A || A.legs===undefined){
    A = p._an = { phi:((p.idx||0)*0.37)%1, face:(p.face||0), turn:0, lean:0, bank:0,
                  spd:spd, look:0, brt:((p.idx||0)*1.7)%6.283,
                  legs:[{set:false,prevT:0,px:X,pz:Z,lx:X,lz:Z},
                        {set:false,prevT:0.5,px:X,pz:Z,lx:X,lz:Z}] };
  }
  /* ombra e scena chiamano player3D nello stesso fotogramma:
     lo stato va integrato una volta sola, altrimenti la corsa va al doppio */
  var upd = (A._fn !== R.fno); A._fn = R.fno;
  var moving = spd>0.45;

  /* il busto ruota verso la direzione richiesta con velocita' finita */
  var dF = angWrap((p.face||0) - A.face);
  var rate = (5.0 + 6.0*spdN)*dt;
  var step = Math.max(-rate, Math.min(rate, dF));
  if(upd){ A.face += step; A.turn = A.turn*0.86 + (step/dt)*0.14; }

  var fx=Math.cos(A.face), fz=Math.sin(A.face);   /* avanti (busto) */
  var lx=fz,               lz=-fx;                /* laterale sinistro */
  var gA = moving ? Math.atan2(vy,vx) : A.face;   /* direzione di corsa */
  var gx=Math.cos(gA), gz=Math.sin(gA);
  var glx=gz, glz=-gx;

  /* accelerazione -> inclinazione avanti/indietro */
  if(upd){ A.acc = (spd - A.spd)/dt; A.spd = spd; }
  var acc = A.acc || 0;
  var leanT = 0.045 + 0.28*spdN + clamp(acc*0.028, -0.18, 0.22);
  var bankT = clamp(-A.turn*0.075, -0.26, 0.26);

  /* --------------------------- azioni speciali -------------------------- */
  var kT0  = p.kickT0 || 0.26;
  var u    = (p.kickT>0) ? clamp(1 - p.kickT/kT0, 0, 1) : -1;
  var kind = p.kickType || 'pass';
  var kLeg = (p.kickLeg||0);
  var dive = (p.diveT>0) ? Math.min(1, p.diveT*3.2) : 0;
  var slide= (p.slideT>0) ? clamp(p.slideT/0.42, 0, 1) : 0;
  var cel  = (p.celebrate>0) ? clamp(p.celebrate/0.9, 0, 1) : 0;

  if(u>=0){ leanT += (kind==='shot'||kind==='clear') ? (0.10 - 0.30*u) : (0.04 - 0.12*u); }
  if(cel)  leanT -= 0.18*cel;
  if(slide)leanT  = 0.30 + 0.62*slide;
  if(upd){ A.lean += (leanT - A.lean)*Math.min(1, dt*11);
           A.bank += (bankT - A.bank)*Math.min(1, dt*9); }

  var sl=Math.sin(A.lean), cl=Math.cos(A.lean), sb=Math.sin(A.bank);
  var upx = gx*sl + glx*sb, upy = cl, upz = gz*sl + glz*sb;
  var ul = Math.sqrt(upx*upx+upy*upy+upz*upz)||1; upx/=ul; upy/=ul; upz/=ul;

  /* ------------------------------ misure -------------------------------- */
  var HIP0 = 0.930*hf, ANK = 0.078*hf;
  var THIGH= 0.437*hf, SHIN= 0.418*hf;
  var UPA  = 0.300*hf, FOR = 0.255*hf;
  var HIPW = 0.098*hf, SHOW= 0.198*hf;
  var WST  = 0.185*hf, SHO = 0.520*hf, NCK = 0.575*hf, HDY = 0.705*hf;
  var HR   = 0.103*hf, FOOT= 0.130*hf, HEEL= 0.068*hf;
  var REACH= (THIGH+SHIN)*0.985;

  /* passo: falcata, appoggio e cadenza dipendono dalla velocita' */
  var L    = (0.58 + 1.42*spdN)*hf;
  var duty = 0.60 - 0.48*spdN;
  var cyc  = moving ? Math.max(0.30, 2*L/Math.max(spd,0.4)) : 1.6;
  if(upd){ if(moving) A.phi += dt/cyc; else A.phi += dt*0.16;
           A.phi -= Math.floor(A.phi); }

  /* il bacino si abbassa correndo e oscilla due volte per ciclo */
  var crouch = (0.012 + 0.070*spdN)*hf + (u>=0?0.028*hf:0);
  var pelvY  = HIP0 - crouch + Math.cos(4*Math.PI*A.phi)*(0.008+0.024*spdN)*hf;
  if(!moving) pelvY += Math.sin(R.clock*1.4 + A.brt)*0.006*hf;
  if(dive)  pelvY -= dive*0.46*hf;
  if(slide) pelvY -= slide*0.54*hf;
  if(cel)   pelvY += Math.abs(Math.sin(R.clock*6.5))*0.045*hf*cel;

  var bX = X, bZ = Z;
  if(dive){ var dv=dive*1.15*(p.diveDir||0); bX += lx*dv; bZ += lz*dv; }

  /* punto del corpo: h sopra il bacino, f avanti, l a sinistra */
  function BP(h, f, l, o){
    o.x = bX + upx*h + fx*f + lx*l;
    o.y = pelvY + upy*h;
    o.z = bZ + upz*h + fz*f + lz*l;
    return o;
  }

  /* contro-rotazione bacino/spalle */
  var tw   = moving ? Math.sin(2*Math.PI*A.phi) : 0;
  var pyaw = tw*(0.05 + 0.18*spdN);
  var syaw = -pyaw*1.15 + (u>=0 ? (kLeg? 0.5 : -0.5)*(0.30-0.62*u) : 0);

  /* --------------------------------- colori ----------------------------- */
  var kit = G.teams[p.team].kit;
  var cShirt, cShorts, cSock, cSockB;
  if(p.gk){
    var gkk = (p.team===0)? {s:'#16D6A4', s2:'#0B7F62'} : {s:'#FFC93C', s2:'#C98F1E'};
    cShirt=hexL(gkk.s); cShorts=hexL(gkk.s2); cSock=hexL(gkk.s2); cSockB=hexL(gkk.s);
  } else {
    cShirt =hexL(kit.s);
    cShorts=hexL(kit.sh||shade(kit.s,-42));
    cSock  =hexL(shade(kit.s2||kit.s,20));
    cSockB =hexL(kit.s);
  }
  var cSkin=hexL(p.skin||'#c98b5e');
  var cSkinD=[cSkin[0]*0.84, cSkin[1]*0.84, cSkin[2]*0.84];
  var cHair=hexL(p.hair||'#2a1c14');
  var cBoot=[[0.94,0.94,0.96],[0.010,0.012,0.018],[1,0.10,0.02],[0.01,0.70,0.34]][(p.idx||0)%4];
  var TS = shirtTex(p);
  var MT_SHIRT = { spec:0.06, gloss:12, ao:1, uv:[1,1,-0.25,0] };

  blob(X, Z, 0.31*hf, moving? 0.15 : 0.19);

  /* ================================ GAMBE ================================ */
  var li, hip={};
  for(li=0; li<2; li++){
    var st = A.legs[li];
    var t  = A.phi + li*0.5; t -= Math.floor(t);
    var side = li? 1 : -1;

    BP(0, -Math.sin(pyaw)*HIPW*side, Math.cos(pyaw)*HIPW*side, hip);

    /* --- pianificazione del passo in coordinate mondo --- */
    var toeX, toeZ, toeH=0, roll=0;
    if(moving && !dive && !slide && u<0){
      var tRem  = (1-t)*cyc;
      var ahead = (0.12 + 0.16*spdN)*hf;
      var sideO = side*0.080*hf;
      var landX = X + vx*tRem + gx*ahead + glx*sideO;
      var landZ = Z + vy*tRem + gz*ahead + glz*sideO;
      var far   = (st.px-X)*(st.px-X)+(st.pz-Z)*(st.pz-Z) > 6.25*hf*hf;
      if(upd){
        if(!st.set || (st.prevT >= duty && t < duty) || far){
          st.px = X + gx*ahead + glx*sideO;
          st.pz = Z + gz*ahead + glz*sideO; st.set=true;
        }
        if(st.prevT < duty && t >= duty){ st.lx=st.px; st.lz=st.pz; }
        st.prevT=t;
      }
      if(t < duty){
        var ks=t/Math.max(duty,1e-3);
        toeX=st.px; toeZ=st.pz;
        roll = (ks<0.20) ? -0.32*(1-ks/0.20)
             : (ks>0.55 ? ((ks-0.55)/0.45)*(0.50+0.55*spdN) : 0.02);
        toeH = Math.max(0, -roll)*FOOT*0.80;
      } else {
        var k=(t-duty)/(1-duty);
        var sm=k*k*(3-2*k);
        toeX=st.lx+(landX-st.lx)*sm;
        toeZ=st.lz+(landZ-st.lz)*sm;
        toeH=Math.sin(Math.PI*k)*(0.05+0.22*spdN)*hf;
        roll = 0.58*(1-k) - 0.32*k;
        if(k<0.45){ var kb=1-k/0.45; toeX-=gx*kb*kb*0.12*hf*spdN; toeZ-=gz*kb*kb*0.12*hf*spdN; }
      }
    } else {
      var oF=0, oL=side*0.085*hf, oH=0;
      if(u>=0){
        if(li===kLeg){
          var sw = (kind==='shot'||kind==='clear')
                 ? (u<0.36 ? -0.42*Math.sin(u/0.36*1.5708)
                           : -0.42 + 1.02*Math.sin((u-0.36)/0.64*1.5708))
                 : (u<0.34 ? -0.24*Math.sin(u/0.34*1.5708)
                           : -0.24 + 0.74*Math.sin((u-0.34)/0.66*1.5708));
          oF = sw*hf;
          oH = Math.max(0, sw)*((kind==='shot'||kind==='clear')?0.40:0.20)*hf;
          roll = -0.12 + 0.45*Math.max(0,sw);
        } else { oF = 0.05*hf; oL = side*0.150*hf; }
      } else if(slide){
        oF = (li===0? 0.60 : 0.16)*hf; oH = 0.05*hf; roll=-0.22;
      } else if(dive){
        oF = (li===0? 0.28 : 0.10)*hf; oH = dive*0.28*hf; roll=0.30;
      } else if(cel){
        oF = side*0.10*hf;
      } else {
        oF += Math.sin(R.clock*1.3 + A.brt + li*2.1)*0.012*hf;
      }
      toeX = bX + fx*(oF+FOOT*0.55) + lx*oL;
      toeZ = bZ + fz*(oF+FOOT*0.55) + lz*oL;
      toeH = oH;
      st.px=toeX; st.pz=toeZ; st.set=true; st.prevT=t;
    }

    /* --- dal punto di contatto alla caviglia (rullata del piede) --- */
    var fdx = gx*0.62 + fx*0.38, fdz = gz*0.62 + fz*0.38;
    var fl2 = Math.sqrt(fdx*fdx+fdz*fdz)||1; fdx/=fl2; fdz/=fl2;
    var cr=Math.cos(roll), sr=Math.sin(roll);
    var aX = toeX - fdx*FOOT*cr, aZ = toeZ - fdz*FOOT*cr;
    var aH = toeH + FOOT*sr + ANK*cr;
    if(aH < ANK*0.60) aH = ANK*0.60;

    /* la gamba non si stacca mai: il bersaglio resta dentro la portata */
    var dxr=aX-hip.x, dyr=aH-hip.y, dzr=aZ-hip.z;
    var drl=Math.sqrt(dxr*dxr+dyr*dyr+dzr*dzr)||1e-4;
    if(drl > REACH){
      var kr=REACH/drl;
      aX=hip.x+dxr*kr; aH=hip.y+dyr*kr; aZ=hip.z+dzr*kr;
      if(upd && t < duty && moving){ st.px = aX + fdx*FOOT*cr; st.pz = aZ + fdz*FOOT*cr; A._cl=(A._cl||0)+1; }
    }

    /* --- IK della gamba: il ginocchio punta in avanti --- */
    ikJoint(hip.x,hip.y,hip.z, aX,aH,aZ, THIGH,SHIN,
            gx*0.86 + fx*0.14 + side*glx*0.08, 0.16, gz*0.86 + fz*0.14 + side*glz*0.08, _ikA);
    var kx=_ikA.x, ky=_ikA.y, kz=_ikA.z;
    var faX=_ikA.tx, faY=_ikA.ty, faZ=_ikA.tz;

    /* coscia, ginocchio, polpaccio con calzettone */
    limb(hip.x,hip.y,hip.z, kx,ky,kz, 0.093*hf, 0.062*hf, cSkin, 0.60, MT_SKIN, 3);
    knob(kx,ky,kz, 0.061*hf, cSkin, 0.60, MT_SKIN);
    var sxp=kx+(faX-kx)*0.34, syp=ky+(faY-ky)*0.34, szp=kz+(faZ-kz)*0.34;
    limb(kx,ky,kz, sxp,syp,szp, 0.061*hf, 0.056*hf, cSkin, 0.60, MT_SKIN, 2);
    limb(sxp,syp,szp, faX,faY,faZ, 0.059*hf, 0.043*hf, cSock, 0.60, MT_CLOTH, 3);
    if(lod>0) limb(sxp,syp,szp, sxp+(faX-sxp)*0.13, syp+(faY-syp)*0.13, szp+(faZ-szp)*0.13,
                   0.0615*hf, 0.0605*hf, cSockB, 0.60, MT_CLOTH, 1);

    /* scarpino: sempre agganciato alla caviglia risolta dall'IK */
    var axf = fdx*cr, ayf = -sr, azf = fdz*cr;
    var tX=faX+axf*FOOT, tY=faY+ayf*FOOT-ANK*0.42, tZ=faZ+azf*FOOT;
    var hX2=faX-axf*HEEL, hY2=faY-ayf*HEEL-ANK*0.42, hZ2=faZ-azf*HEEL;
    if(tY<0.026*hf) tY=0.026*hf;
    if(hY2<0.028*hf) hY2=0.028*hf;
    dr(G_.cyl, m4seg(hX2,hY2,hZ2, tX,tY,tZ, 0.049*hf), cBoot, null, 1, 0.66, MT_BOOT);
    knob(hX2,hY2,hZ2, 0.048*hf, cBoot, 0.64, MT_BOOT);
    knob(tX,tY,tZ, 0.041*hf, cBoot, 0.66, MT_BOOT);
    if(lod>0)
      dr(G_.cyl, m4seg(hX2,hY2-0.019*hf,hZ2, tX,tY-0.017*hf,tZ, 0.050*hf),
         [0.012,0.012,0.016], null, 1, 0.50, MT_BOOT);
  }

  /* ================================ BUSTO ================================ */
  var pelC={}, shoC={}, nckC={}, hedC={}, trC={};
  BP(0.030*hf, -Math.sin(pyaw)*0.02, 0, pelC);
  BP(SHO, 0, 0, shoC);
  BP(NCK, 0, 0, nckC);
  BP(HDY, 0, 0, hedC);
  BP((WST+SHO)*0.54, 0, 0, trC);

  var pfx=Math.cos(A.face+pyaw), pfz=Math.sin(A.face+pyaw);
  dr(G_.sph, m4up(pelC.x, pelC.y, pelC.z, pfx,pfz, 0.160*hf, 0.150*hf, 0.130*hf),
     cShorts, null, 1, 0.62, MT_CLOTH);
  for(li=0; li<2; li++){
    var sd2 = li? 1 : -1;
    var thX = pelC.x + (pfz*sd2)*0.082*hf, thZ = pelC.z + (-pfx*sd2)*0.082*hf;
    dr(G_.cyl, m4seg(thX, pelC.y+0.02*hf, thZ,
                     thX - upx*0.15*hf, pelC.y - 0.15*hf, thZ - upz*0.15*hf, 0.099*hf),
       cShorts, null, 1, 0.60, MT_CLOTH);
    knob(thX - upx*0.15*hf, pelC.y-0.15*hf, thZ - upz*0.15*hf, 0.097*hf, cShorts, 0.58, MT_CLOTH);
  }

  /* maglia: ellissoide dal bacino alle spalle, numero sulla schiena */
  var sfx=Math.cos(A.face+syaw), sfz=Math.sin(A.face+syaw);
  var sLx=sfz, sLz=-sfx;
  dr(G_.sph, m4up(trC.x, trC.y, trC.z, sfx,sfz, 0.180*hf, 0.250*hf, 0.130*hf),
     WHITE, TS, 1, 0.66, MT_SHIRT);
  for(li=0; li<2; li++){
    var sd3 = li? 1 : -1;
    dr(G_.sph, m4up(shoC.x + sLx*SHOW*sd3*0.84, shoC.y-0.014*hf, shoC.z + sLz*SHOW*sd3*0.84,
                    sfx,sfz, 0.076*hf, 0.070*hf, 0.073*hf),
       cShirt, null, 1, 0.66, MT_CLOTH);
  }

  /* collo e testa: lo sguardo insegue la palla */
  limb(nckC.x-upx*0.035*hf, nckC.y-0.035*hf, nckC.z-upz*0.035*hf,
       hedC.x-upx*0.058*hf, hedC.y-0.058*hf, hedC.z-upz*0.058*hf,
       0.051*hf, 0.045*hf, cSkinD, 0.56, MT_SKIN, 1);
  var lookT=0;
  try{
    var bl=G.ball;
    if(bl) lookT = clamp(angWrap(Math.atan2(bl.y-Z, bl.x-X) - A.face), -0.85, 0.85);
  }catch(e){}
  if(upd) A.look += (lookT - A.look)*Math.min(1, dt*6);
  var hfx=Math.cos(A.face+A.look), hfz=Math.sin(A.face+A.look);
  var hX=hedC.x, hZ=hedC.z, hY=hedC.y;
  dr(G_.sph, m4up(hX, hY, hZ, hfx,hfz, HR*0.93, HR*1.12, HR*1.00),
     cSkin, null, 1, 0.70, MT_SKIN);
  if(lod>0){
    var style=(p.idx||0)%4;
    dr(G_.sph, m4up(hX - hfx*HR*0.24, hY + HR*0.10, hZ - hfz*HR*0.24, hfx,hfz,
                    HR*(style===2?1.12:1.02), HR*(style===2?1.16:1.03), HR*(style===2?1.14:1.05)),
       cHair, null, 1, 0.56, MT_CLOTH);
    if(style!==1)
      dr(G_.sph, m4up(hX - hfx*HR*0.50, hY - HR*0.02, hZ - hfz*HR*0.50, hfx,hfz,
                      HR*0.74, HR*0.66, HR*0.84), cHair, null, 1, 0.52, MT_CLOTH);
    if(style===3)
      dr(G_.sph, m4up(hX - hfx*HR*0.86, hY + HR*0.16, hZ - hfz*HR*0.86, hfx,hfz,
                      HR*0.40, HR*0.40, HR*0.40), cHair, null, 1, 0.52, MT_CLOTH);
    var elx=hfz, elz=-hfx;
    for(li=0; li<2; li++){
      var sd4=li?1:-1;
      dr(G_.sphL, m4up(hX+elx*HR*0.90*sd4, hY+HR*0.02, hZ+elz*HR*0.90*sd4, hfx,hfz,
                       HR*0.14, HR*0.25, HR*0.19), cSkinD, null, 1, 0.62, MT_SKIN);
    }
    if(lod>1){
      for(li=0; li<2; li++){
        var sd5=li?1:-1;
        dr(G_.sphL, m4up(hX+hfx*HR*0.74+elx*HR*0.33*sd5, hY+HR*0.16,
                         hZ+hfz*HR*0.74+elz*HR*0.33*sd5, hfx,hfz,
                         HR*0.12, HR*0.09, HR*0.08), [0.90,0.90,0.88], null, 1, 0.70, MT_SKIN);
        dr(G_.sphL, m4up(hX+hfx*HR*0.82+elx*HR*0.33*sd5, hY+HR*0.16,
                         hZ+hfz*HR*0.82+elz*HR*0.33*sd5, hfx,hfz,
                         HR*0.05, HR*0.05, HR*0.045), [0.05,0.04,0.03], null, 1, 0.70, MT_SKIN);
      }
      dr(G_.sphL, m4up(hX+hfx*HR*0.88, hY-HR*0.04, hZ+hfz*HR*0.88, hfx,hfz,
                       HR*0.10, HR*0.12, HR*0.11), cSkin, null, 1, 0.68, MT_SKIN);
    }
  }

  /* =============================== BRACCIA ===============================
     Cinematica diretta: spalla -> gomito -> mano. Il gomito resta sempre
     piegato, come nella corsa vera, e l'oscillazione e' opposta alle gambe. */
  var ai, dnx=-upx, dny=-upy, dnz=-upz;
  for(ai=0; ai<2; ai++){
    var sd = ai? 1 : -1;
    var shp={};
    BP(SHO-0.030*hf, -Math.sin(syaw)*SHOW*sd*0.92, Math.cos(syaw)*SHOW*sd*0.92, shp);

    var swA = Math.sin(2*Math.PI*(A.phi + (ai? 0 : 0.5)));
    var sAng, flex, out;
    if(dive){       sAng = 1.45 + 0.45*dive;  flex = 0.20; out = 0.50 + 0.30*dive; }
    else if(cel){   sAng = -2.15;             flex = 0.30 + 0.25*Math.abs(Math.sin(R.clock*7)); out = 0.50; }
    else if(slide){ sAng = -0.70;             flex = 0.60; out = 0.55; }
    else if(u>=0){
      var opp=(ai!==kLeg)?1:-1;
      sAng = opp*(0.38 + 0.32*u)*((kind==='shot'||kind==='clear')?1.15:0.85);
      flex = 0.80 + 0.30*u;
      out  = 0.32 + 0.26*u;
    }
    else if(moving){ sAng = swA*(0.30 + 0.34*spdN); flex = 0.62 + 0.88*spdN; out = 0.12 + 0.07*spdN; }
    else {           sAng = Math.sin(R.clock*1.3 + A.brt)*0.05; flex = 0.20; out = 0.12; }

    var ca=Math.cos(sAng), sa=Math.sin(sAng);
    var ux1 = dnx*ca + fx*sa + lx*sd*out;
    var uy1 = dny*ca;
    var uz1 = dnz*ca + fz*sa + lz*sd*out;
    var ul1 = Math.sqrt(ux1*ux1+uy1*uy1+uz1*uz1)||1; ux1/=ul1; uy1/=ul1; uz1/=ul1;
    var ex=shp.x+ux1*UPA, ey=shp.y+uy1*UPA, ez=shp.z+uz1*UPA;
    /* flessione del gomito verso la parte anteriore del corpo */
    var pfx2=fx, pfy2=0.12, pfz2=fz;
    var dt2=pfx2*ux1+pfy2*uy1+pfz2*uz1;
    pfx2-=ux1*dt2; pfy2-=uy1*dt2; pfz2-=uz1*dt2;
    var pl2=Math.sqrt(pfx2*pfx2+pfy2*pfy2+pfz2*pfz2)||1; pfx2/=pl2; pfy2/=pl2; pfz2/=pl2;
    var cf=Math.cos(flex), sf=Math.sin(flex);
    var fxd=ux1*cf+pfx2*sf, fyd=uy1*cf+pfy2*sf, fzd=uz1*cf+pfz2*sf;
    var wx=ex+fxd*FOR, wy=ey+fyd*FOR, wz=ez+fzd*FOR;

    var mx1=shp.x+(ex-shp.x)*0.46, my1=shp.y+(ey-shp.y)*0.46, mz1=shp.z+(ez-shp.z)*0.46;
    limb(shp.x,shp.y,shp.z, mx1,my1,mz1, 0.063*hf, 0.053*hf, cShirt, 0.64, MT_CLOTH, 2);
    limb(mx1,my1,mz1, ex,ey,ez, 0.051*hf, 0.044*hf, cSkin, 0.62, MT_SKIN, 2);
    knob(ex,ey,ez, 0.043*hf, cSkin, 0.60, MT_SKIN);
    limb(ex,ey,ez, wx,wy,wz, 0.043*hf, 0.033*hf, cSkin, 0.62, MT_SKIN, 3);
    var hr3=(p.gk?0.058:0.046)*hf;
    dr(G_.sph, m4seg(wx,wy,wz, wx+fxd*hr3*2.1, wy+fyd*hr3*2.1, wz+fzd*hr3*2.1, hr3*0.80),
       p.gk?[0.90,0.90,0.94]:cSkin, null, 1, 0.63, MT_SKIN);
  }

  /* ============================== MARCATORE ============================== */
  var mk = p.controlled?1:((G.passTarget===p)?2:0);
  if(mk && R.pass!=='shadow'){
    var fl = 0.06 + Math.abs(Math.sin(R.clock*3.0))*0.07;
    var col = mk===1?[0.05,0.90,0.80]:[0.06,0.85,0.28];
    var mY = pelvY + HDY + HR + 0.34 + fl;
    var MTM = { emit:0.85, spec:0, cast:false, fog:0 };
    dr(G_.box, m4up(X, mY+0.10, Z, 0,1, 0.30,0.045,0.30), col, null, 1, 0.0, MTM);
    dr(G_.box, m4up(X, mY,      Z, 0,1, 0.19,0.045,0.19), col, null, 1, 0.0, MTM);
    dr(G_.box, m4up(X, mY-0.09, Z, 0,1, 0.08,0.045,0.08), col, null, 1, 0.0, MTM);
  }
}

/* ============================ STADIO E SCENA =============================
   Geometria dello stadio: pista, muretti, cartelloni LED, tre anelli di
   gradinate inclinate con pubblico, facciate, tettoia con travi, torri faro
   con alone luminoso, panchine e bandierine. Tutto in metri reali.
   ======================================================================== */
function ramp(x,y,z, fx,fz, w,h,d, amb, uvRep){
  dr(G_.ramp, m4up(x,y,z, fx,fz, w,h,d), [1.14,1.11,1.18], T.crowd, 1, amb===undefined?0.80:amb,
     { spec:0.03, gloss:8, cast:false, uv:[uvRep||(w/20), 1, 0, 0] });
}
function facade(x,y,z, fx,fz, w,h,d, amb){
  dr(G_.box, m4up(x,y,z, fx,fz, w,h,d), [0.055,0.065,0.085], T.conc, 1,
     amb===undefined?0.45:amb, { spec:0.04, gloss:12, cast:false, uv:[w/12, h/6, 0, 0] });
}
function ledBoard(x,y,z, fx,fz, w,h, scroll, amb){
  var off = ((R.clock*0.045)+(scroll||0))%1;
  dr(G_.quad, m4up(x,y,z, fx,fz, w,h,1), WHITE, T.board, 1, amb===undefined?0.30:amb,
     { spec:0.10, gloss:40, emit:0.75, cast:false, uv:[w/26, 1, off, 0] });
}
function glowSprite(x,y,z, s, col, a){
  /* billboard rivolto alla camera, in additivo */
  var cam=R.cam, dx=cam.eX-x, dz=cam.eZ-z;
  var l=Math.sqrt(dx*dx+dz*dz)||1;
  dr(G_.quad, m4up(x, y-s*0.5, z, dx/l, dz/l, s, s, 1), col, T.glow, a===undefined?1:a, 0.0,
     { emit:1.0, spec:0, cast:false, fog:0 });
}

function standSide(sz){
  /* tribuna sul lato lungo: sz = -1 lato lontano, +1 lato vicino */
  var f = sz;                                   /* i gradoni salgono verso l'esterno */
  var z0 = sz*45.0;
  var amb1 = sz<0 ? 0.86 : 0.66;                /* il lato vicino e' controluce */
  /* muretto e ringhiera */
  dr(G_.box, m4up(0, 0.80, sz*43.4, 0,1, 150, 1.60, 0.7), [0.045,0.055,0.075], T.conc, 1, 0.55,
     { cast:false, spec:0.05, gloss:14, uv:[12,1,0,0] });
  dr(G_.box, m4up(0, 1.66, sz*43.1, 0,1, 150, 0.10, 0.14), RAIL, null, 1, 0.85, MT_METAL);
  /* anello basso */
  ramp(0, 1.62, z0, 0,f, 150, 10.4, 19.0, amb1, 7.5);
  /* parapetto in cima all'anello basso + fascia pubblicitaria */
  facade(0, 12.6, sz*64.4, 0,1, 150, 2.6, 2.2, 0.42);
  ledBoard(0, 12.35, sz*63.2, 0,-sz, 132, 1.5, 0.35, 0.30);
  /* passerella scura fra i due anelli */
  facade(0, 15.2, sz*66.6, 0,1, 150, 3.4, 3.0, 0.34);
  /* anello alto */
  ramp(0, 16.8, sz*67.8, 0,f, 152, 12.6, 20.0, amb1*0.92, 7.6);
  /* retro e tettoia */
  facade(0, 16.0, sz*88.5, 0,1, 156, 32.0, 3.0, 0.28);
  dr(G_.box, m4up(0, 31.2, sz*74.0, 0,1, 158, 1.3, 34.0), [0.045,0.052,0.068], T.conc, 1, 0.30,
     { cast:false, spec:0.06, gloss:20, uv:[16,4,0,0] });
  /* travi longitudinali e trasversali sotto la tettoia */
  dr(G_.box, m4up(0, 30.3, sz*57.6, 0,1, 158, 0.55, 0.55), STEEL, null, 1, 0.34, MT_METAL);
  dr(G_.box, m4up(0, 30.3, sz*70.0, 0,1, 158, 0.42, 0.42), STEEL, null, 1, 0.32, MT_METAL);
  for(var i=-7;i<=7;i++){
    dr(G_.box, m4up(i*10.6, 30.4, sz*66.0, 0,1, 0.35, 0.35, 20.0), STEEL, null, 1, 0.30, MT_METAL);
    dr(G_.cyl, m4seg(i*10.6, 30.1, sz*57.8, i*10.6, 27.4, sz*67.5, 0.12), STEEL, null, 1, 0.30, MT_METAL);
  }
  /* fari a filo di tettoia: strisce luminose */
  for(var j=-5;j<=5;j++){
    dr(G_.box, m4up(j*13.0, 30.15, sz*58.6, 0,1, 5.4, 0.30, 0.8), [1.0,0.98,0.90], null, 1, 0.0,
       { emit:1.15, spec:0, cast:false });
  }
}
function standEnd(sx){
  var f = sx;
  var x0 = sx*63.0;
  dr(G_.box, m4up(sx*61.6, 0.80, 0, 0,1, 0.7, 1.60, 88), [0.045,0.055,0.075], T.conc, 1, 0.52,
     { cast:false, spec:0.05, gloss:14, uv:[8,1,0,0] });
  dr(G_.box, m4up(sx*61.3, 1.66, 0, 0,1, 0.14, 0.10, 88), RAIL, null, 1, 0.82, MT_METAL);
  ramp(x0, 1.62, 0, f,0, 92, 10.4, 19.0, 0.78, 4.6);
  facade(sx*82.8, 12.6, 0, 1,0, 92, 2.6, 2.2, 0.40);
  ledBoard(sx*81.6, 12.35, 0, -sx,0, 84, 1.5, 0.6, 0.30);
  facade(sx*85.0, 15.2, 0, 1,0, 92, 3.4, 3.0, 0.32);
  ramp(sx*86.2, 16.8, 0, f,0, 94, 12.6, 20.0, 0.72, 4.7);
  facade(sx*107.0, 16.0, 0, 1,0, 98, 32.0, 3.0, 0.26);
  dr(G_.box, m4up(sx*92.5, 31.2, 0, 0,1, 34.0, 1.3, 100), [0.045,0.052,0.068], T.conc, 1, 0.28,
     { cast:false, spec:0.06, gloss:20, uv:[4,12,0,0] });
  for(var i=-4;i<=4;i++){
    dr(G_.box, m4up(sx*84.5, 30.4, i*11.0, 0,1, 20.0, 0.35, 0.35), STEEL, null, 1, 0.28, MT_METAL);
  }
}
function standCorner(sx,sz){
  /* raccordo diagonale: chiude la ciambella senza buchi */
  var d=0.70710678, fx=sx*d, fz=sz*d;
  var cx=sx*48.5, cz=sz*40.0;
  ramp(cx, 1.62, cz, fx,fz, 54, 10.4, 19.0, 0.72, 2.7);
  facade(cx+sx*13.4, 12.6, cz+sz*13.4, fx,fz, 54, 2.6, 2.4, 0.36);
  facade(cx+sx*15.6, 15.2, cz+sz*15.6, fx,fz, 54, 3.4, 3.2, 0.30);
  ramp(cx+sx*16.4, 16.8, cz+sz*16.4, fx,fz, 56, 12.6, 20.0, 0.66, 2.8);
  facade(cx+sx*30.0, 16.0, cz+sz*30.0, fx,fz, 58, 32.0, 3.2, 0.24);
  dr(G_.box, m4up(cx+sx*20.0, 31.2, cz+sz*20.0, fx,fz, 58, 1.3, 34.0),
     [0.045,0.052,0.068], T.conc, 1, 0.26, { cast:false, spec:0.06, gloss:20, uv:[6,4,0,0] });
  /* torre faro d'angolo */
  var tx=sx*66.0, tz=sz*49.0;
  dr(G_.cyl, m4seg(tx, 0, tz, tx, 34.0, tz, 0.55), STEEL, null, 1, 0.34, MT_METAL);
  dr(G_.cyl, m4seg(tx, 12, tz, tx-sx*2.2, 32.0, tz-sz*2.2, 0.28), STEEL, null, 1, 0.32, MT_METAL);
  dr(G_.box, m4up(tx-sx*2.6, 35.6, tz-sz*2.6, -sx*d, -sz*d, 11.0, 3.4, 1.0),
     [0.07,0.08,0.10], null, 1, 0.30, MT_METAL);
  var r, cc;
  for(r=-2;r<=2;r++){
    cc=[1.0,0.985,0.94];
    dr(G_.box, m4up(tx-sx*2.9+ (-sz*d)*r*2.1, 35.6 + (r%2?0.75:-0.75), tz-sz*2.9 + (sx*d)*r*2.1,
                    -sx*d, -sz*d, 1.9, 1.35, 0.35), cc, null, 1, 0.0,
       { emit:1.35, spec:0, cast:false });
  }
}

function stadium(){
  /* ------------------------------- cielo -------------------------------- */
  dr(G_.dome, m4up(0, -6, 0, 0,1, 620, 340, 620), [1.0,1.0,1.0], T.sky, 1, 0.0,
     { emit:1.0, spec:0, cast:false, fog:0, uv:[2,1,0,0] });
  /* terreno esterno */
  dr(G_.pl, m4up(0,-0.35,0, 0,1, 620,1,620), [0.030,0.045,0.030], null, 1, 0.55, MT_NOCAST);
  /* prato di rispetto attorno al campo */
  dr(G_.pl, m4up(0,-0.06,0, 0,1, 128,1,88), [0.055,0.135,0.060], null, 1, 0.85,
     { spec:0.07, gloss:12, cast:false, det:60 });
  /* pista/anello in tartan rosso dietro le linee, come nei riferimenti */
  dr(G_.pl, m4up(0,-0.03,-41.0, 0,1, 132,1,5.6), [0.185,0.052,0.040], null, 1, 0.80,
     { spec:0.09, gloss:16, cast:false, det:30 });
  dr(G_.pl, m4up(0,-0.03, 41.0, 0,1, 132,1,5.6), [0.185,0.052,0.040], null, 1, 0.80,
     { spec:0.09, gloss:16, cast:false, det:30 });
  dr(G_.pl, m4up(-59.0,-0.03,0, 0,1, 5.6,1,88), [0.185,0.052,0.040], null, 1, 0.80,
     { spec:0.09, gloss:16, cast:false, det:30 });
  dr(G_.pl, m4up( 59.0,-0.03,0, 0,1, 5.6,1,88), [0.185,0.052,0.040], null, 1, 0.80,
     { spec:0.09, gloss:16, cast:false, det:30 });

  /* -------------------------------- campo ------------------------------- */
  dr(G_.pl, m4up(0,0,0, 0,1, PW,1,PH), [1.15,0.88,1.12], T.pitch, 1, 0.92, MT_GRASS);

  /* ------------------------------ tribune ------------------------------- */
  standSide(-1); standSide(1);
  standEnd(-1);  standEnd(1);
  standCorner(-1,-1); standCorner(1,-1); standCorner(-1,1); standCorner(1,1);

  /* --------------------------- cartelloni LED --------------------------- */
  var i;
  for(i=-4;i<=4;i++){
    ledBoard(i*13.2, 0.02, -38.8, 0,1, 13.0, 1.05, i*0.11, 0.28);
    ledBoard(i*13.2, 0.02,  38.8, 0,-1, 13.0, 1.05, i*0.17, 0.24);
  }
  for(i=-3;i<=3;i++){
    ledBoard(-56.6, 0.02, i*12.4, 1,0, 12.2, 1.05, i*0.13, 0.26);
    ledBoard( 56.6, 0.02, i*12.4, -1,0, 12.2, 1.05, i*0.19, 0.26);
  }
  /* struttura scura dietro i cartelloni */
  dr(G_.box, m4up(0, 0.5, -39.1, 0,1, 120, 1.0, 0.35), [0.02,0.024,0.03], null, 1, 0.3, MT_NOCAST);
  dr(G_.box, m4up(0, 0.5,  39.1, 0,1, 120, 1.0, 0.35), [0.02,0.024,0.03], null, 1, 0.3, MT_NOCAST);
  dr(G_.box, m4up(-56.9, 0.5, 0, 0,1, 0.35, 1.0, 78), [0.02,0.024,0.03], null, 1, 0.3, MT_NOCAST);
  dr(G_.box, m4up( 56.9, 0.5, 0, 0,1, 0.35, 1.0, 78), [0.02,0.024,0.03], null, 1, 0.3, MT_NOCAST);

  /* ------------------- fotografi e operatori dietro le porte ------------ */
  var sdd, f, cols=[[0.30,0.31,0.35],[0.02,0.025,0.035],[0.16,0.03,0.03]];
  for(sdd=-1; sdd<=1; sdd+=2){
    for(f=0; f<11; f++){
      var fz2=-30+f*6;
      dr(G_.sphL, m4up(sdd*55.0, 0.72, fz2, 1,0, 0.30,0.34,0.30), cols[f%3], null, 1, 0.55, MT_CLOTH);
      dr(G_.box, m4up(sdd*54.4, 0.86, fz2, sdd,0, 0.34, 0.26, 0.52), [0.012,0.014,0.02], null, 1, 0.6, MT_METAL);
      dr(G_.sphL, m4up(sdd*55.0, 1.02, fz2, 1,0, 0.115,0.125,0.115), [0.32,0.22,0.16], null, 1, 0.6, MT_SKIN);
    }
  }
  /* panchine sul lato vicino */
  for(sdd=-1; sdd<=1; sdd+=2){
    var dx0=sdd*13.0;
    dr(G_.box, m4up(dx0, 1.05, 41.2, 0,1, 9.0, 0.14, 2.6), [0.03,0.035,0.045], null, 1, 0.35, MT_NOCAST);
    dr(G_.box, m4up(dx0, 0.52, 42.3, 0,1, 9.0, 1.05, 0.20), [0.05,0.06,0.08], null, 1, 0.40, MT_NOCAST);
    for(f=-3;f<=3;f++)
      dr(G_.box, m4up(dx0+f*1.25, 0.28, 41.0, 0,1, 0.55, 0.55, 0.55), [0.10,0.11,0.14], null, 1, 0.5, MT_NOCAST);
  }
  /* bandierine d'angolo */
  var cxs=[-HX, HX], czs=[-34, 34], a, b2;
  for(a=0;a<2;a++) for(b2=0;b2<2;b2++){
    var px=cxs[a], pz=czs[b2];
    dr(G_.cyl, m4seg(px, 0, pz, px, 1.5, pz, 0.028), [0.85,0.86,0.90], null, 1, 0.80, MT_METAL);
    var wv=Math.sin(R.clock*3.0+a*2+b2)*0.10;
    dr(G_.quad, m4up(px+0.02, 1.06, pz, 0.92, 0.38+wv, 0.42, 0.30, 1), WHITE, T.flag, 1, 0.75,
       { spec:0.05, gloss:10, cast:false });
  }
}

/* -------------------------------- particelle ---------------------------- */
function particles3D(){
  var PS=G.particles; if(!PS || !PS.length) return;
  gl.depthMask(false);
  for(var i=0;i<PS.length;i++){
    var p=PS[i], r=(p.r||0.15);
    var c=hexL(p.c||'#ffffff');
    var a=Math.max(0, Math.min(1, (p.t||0)*1.6));
    dr(G_.sphL, m4up(p.x, (p.z||0)+r, p.y, 1,0, r,r,r), c, null, a, 0.55,
       { spec:0.10, gloss:18, cast:false, emit:0.25 });
  }
  gl.depthMask(true);
}

/* ============================== PASSAGGI ================================= */
function drawWorld(){
  stadium();
  R.nets.length=0;
  goal3D(1); goal3D(-1);

  /* giocatori */
  var PL=G.players||[], i, q2, dxv, d2, lod, vis=0;
  var cam=R.cam;
  for(i=0;i<PL.length;i++){
    q2=PL[i]; if(!q2) continue;
    dxv=q2.x-cam.tgX;
    if(dxv<-62 || dxv>62) continue;
    d2=(q2.x-cam.eX)*(q2.x-cam.eX) + (q2.y-cam.eZ)*(q2.y-cam.eZ);
    lod = d2<3200 ? 2 : 1;
    vis++;
    try{ player3D(q2, lod); }catch(e){}
  }
  R.vis=vis;

  /* pallone */
  var b=G.ball||{x:0,y:0,z:0,vx:0,vy:0};
  var br=0.112, bs=len(b.vx,b.vy);
  if(R.pass!=='shadow'){
    R.roll=(R.roll||0) + bs*R.dt/br*0.55;
    blob(b.x, b.y, 0.24+Math.min(0.42,(b.z||0)*0.08), 0.34-Math.min(0.24,(b.z||0)*0.05));
  }
  var vl=bs||1;
  dr(G_.sph, m4rot(b.x, (b.z||0)+br, b.y, R.roll||0,
                   -(b.vy||0)/vl, 0.20, (b.vx||1)/vl, br), [1.0,1.0,1.0], T.ball, 1, 0.72, MT_BALL);

  if(R.pass!=='shadow'){
    particles3D();
    /* reti: trasparenti, per ultime */
    gl.depthMask(false);
    for(var n=0;n<R.nets.length;n++){
      var nt=R.nets[n];
      dr(G_.box, nt[0], [1,1,1], T.net, nt[1], 0.90,
         { spec:0.20, gloss:30, cast:false, uv:nt[2] });
    }
    gl.depthMask(true);
  }
}

function shadowPass(){
  var cam=R.cam;
  var half=34.0;
  var cxs=cam.tgX, czs=cam.tgZ;
  /* la mappa segue l'azione a passi di mezzo metro: cosi' non "sfarfalla" */
  cxs=Math.round(cxs*2)/2; czs=Math.round(czs*2)/2;
  var D=110;
  var ex=cxs + LDIR[0]*D, ey=LDIR[1]*D, ez=czs + LDIR[2]*D;
  LVP = m4mul(m4ortho(-half, half, -half, half, 1, 260),
              m4look(ex, ey, ez, cxs, 0, czs));
  gl.bindFramebuffer(gl.FRAMEBUFFER, FB.shadow.fb);
  gl.viewport(0,0,FB.shadow.w,FB.shadow.h);
  gl.clearColor(1,1,1,1);
  gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST); gl.depthMask(true); gl.disable(gl.BLEND);
  use(P.sh);
  R.pass='shadow';
  drawWorld();
  R.pass='main';
}

function mainPass(w,h){
  var cam=R.cam;
  if(FB.ok){
    var target = FB.msaa ? FB.msaa : FB.scene;
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.fb);
    gl.viewport(0,0,w,h);
  } else {
    /* ripiego: si disegna dritti a schermo, con tone mapping nello shader */
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0,0,R.cvs.width,R.cvs.height);
  }
  gl.clearColor(0.42,0.55,0.68,1);
  gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST); gl.depthMask(true);
  gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  use(P.main);
  u3v('uL', LDIR);
  u3f('uCam', cam.eX, cam.eY, cam.eZ);
  u3v('uSun', SUN); u3v('uSky', SKYC); u3v('uGnd', GNDC); u3v('uFog', FOGC);
  u1f('uEnc', ENC);
  u1f('uShTx', R.shOK?FB.shadow.w:1024);
  u1f('uShOn', R.shOK?1:0);
  u1f('uTone', FB.ok?0:1);
  um4('uLVP', LVP);
  u1i('uS', 0); u1i('uSh', 1); u1i('uDet', 2);
  gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, R.shOK?FB.shadow.tex:T.shadow);
  gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, T.det);
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, T.pitch);
  drawWorld();
  /* aloni dei fari, in additivo sopra tutto */
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE); gl.depthMask(false);
  var s, t2;
  for(s=-1;s<=1;s+=2) for(t2=-1;t2<=1;t2+=2)
    glowSprite(s*63.4, 35.6, t2*46.4, 16.0, [0.85,0.86,0.80], 0.85);
  for(s=-1;s<=1;s+=2) for(var j=-5;j<=5;j++)
    glowSprite(j*13.0, 30.1, s*58.6, 7.0, [0.55,0.58,0.55], 0.55);
  gl.depthMask(true); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  if(FB.ok && FB.msaa){
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, FB.msaa.fb);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, FB.scene.fb);
    gl.blitFramebuffer(0,0,w,h, 0,0,w,h, gl.COLOR_BUFFER_BIT, gl.NEAREST);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }
}

function fullQuad(){ bindGeo(G_.full); drawGeo(G_.full); }
function blurTo(srcTex, dst, dx, dy){
  gl.bindFramebuffer(gl.FRAMEBUFFER, dst.fb);
  gl.viewport(0,0,dst.w,dst.h);
  u2f('uDir', dx, dy);
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, srcTex);
  fullQuad();
}
function post(outW, outH){
  gl.disable(gl.DEPTH_TEST); gl.disable(gl.BLEND); gl.depthMask(false);
  var sw=FB.w, sh=FB.h;
  /* estrazione delle alte luci */
  use(P.br);
  gl.bindFramebuffer(gl.FRAMEBUFFER, FB.b1a.fb);
  gl.viewport(0,0,FB.b1a.w,FB.b1a.h);
  u1i('uS',0); u2f('uTx', 1/sw, 1/sh); u1f('uThr', 0.92); u1f('uDec', 1/ENC);
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, FB.scene.tex);
  fullQuad();
  /* due livelli di sfocatura */
  use(P.bl); u1i('uS',0);
  blurTo(FB.b1a.tex, FB.b1b, 1.35/FB.b1a.w, 0);
  blurTo(FB.b1b.tex, FB.b1a, 0, 1.35/FB.b1a.h);
  blurTo(FB.b1a.tex, FB.b2b, 1.9/FB.b2a.w, 0);
  blurTo(FB.b2b.tex, FB.b2a, 0, 1.9/FB.b2a.h);
  blurTo(FB.b2a.tex, FB.b2b, 2.4/FB.b2a.w, 0);
  blurTo(FB.b2b.tex, FB.b2a, 0, 2.4/FB.b2a.h);
  /* composizione finale a schermo */
  use(P.cp);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport(0,0,outW,outH);
  u1i('uS',0); u1i('uB1',1); u1i('uB2',2);
  u2f('uTx', 1/sw, 1/sh);
  u1f('uDec', 1/ENC);
  u1f('uExp', 1.00);
  u1f('uBloom', 0.55);
  u1f('uSat', 1.06);
  u1f('uCon', 1.075);
  u1f('uVig', 0.20);
  u1f('uGrain', 0.026);
  u1f('uSharp', 0.42);
  u1f('uChro', 0.0022);
  u1f('uTime', (R.clock*0.37)%10);
  u1f('uFlash', R.flash||0);
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, FB.scene.tex);
  gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, FB.b1a.tex);
  gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, FB.b2a.tex);
  fullQuad();
  gl.activeTexture(gl.TEXTURE0);
  gl.enable(gl.DEPTH_TEST); gl.depthMask(true);
}

/* ============================== TELECAMERA ============================== */
function camera(asp){
  var b=G.ball||{x:0,y:0,z:0,vx:0,vy:0};
  var tx = R.tx===undefined? b.x : R.tx+(b.x-R.tx)*Math.min(1,R.dt*4.2);
  var tz = R.tz===undefined? b.y : R.tz+(b.y-R.tz)*Math.min(1,R.dt*4.2);
  R.tx=tx; R.tz=tz;
  var cx=clamp(tx,-46,46), cz=clamp(tz,-19,19);
  var tgX=cx, tgZ=cz*0.34;
  var ox0=cx*0.80 - tgX, oz0=cz*0.55 + 42.5 - tgZ;
  var att=clamp((Math.abs(cx)-24)/22, 0, 1);
  var ang=att*0.40*(cx>0?1:-1);
  var ca=Math.cos(ang), sa=Math.sin(ang);
  var eX=tgX + ox0*ca - oz0*sa;
  var eZ=tgZ + ox0*sa + oz0*ca;
  var eY=12.6 + att*2.2;
  /* micro movimento "a mano": la ripresa sembra vera, non un binario */
  var t=R.clock;
  eX += Math.sin(t*0.63)*0.10 + Math.sin(t*1.71)*0.045;
  eY += Math.cos(t*0.81)*0.075;
  eZ += Math.sin(t*0.47)*0.075;
  /* scossone su tiri, gol e contrasti */
  var sk=(G.cam && G.cam.shake>0) ? G.cam.shake : 0;
  if(sk>0){
    var s2=Math.min(1.6, sk*0.20);
    eX += (Math.random()-0.5)*s2*0.55;
    eY += (Math.random()-0.5)*s2*0.42;
    eZ += (Math.random()-0.5)*s2*0.30;
  }
  /* zoom dinamico: si stringe quando la palla corre o si e' in area */
  var bs=len(b.vx,b.vy);
  var fov=26.0 - att*1.1 - Math.min(1.3, bs*0.045);
  var lx=clamp((b.vx||0)*0.16, -3.2, 3.2), lz=clamp((b.vy||0)*0.10, -2.2, 2.2);
  VP = m4mul(m4persp(fov*Math.PI/180, asp, 0.5, 900),
             m4look(eX, eY, eZ, tgX+lx*0.35, 1.55+(b.z||0)*0.10, tgZ+lz*0.35));
  R.cam={ eX:eX, eY:eY, eZ:eZ, tgX:tgX, tgZ:tgZ, ang:ang, att:att, aspect:asp, fov:fov };
}

/* ============================ HUD stile PES =============================
   Due barre in basso con stemma, nome squadra e punteggio, targhetta del
   giocatore controllato con numero e stamina. Il radar resta quello del
   motore, spostato in basso al centro come nei riferimenti.
   ====================================================================== */
function rrect(x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y);            ctx.lineTo(x+w-r,y);
  ctx.quadraticCurveTo(x+w,y,x+w,y+r);        ctx.lineTo(x+w,y+h-r);
  ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);    ctx.lineTo(x+r,y+h);
  ctx.quadraticCurveTo(x,y+h,x,y+h-r);        ctx.lineTo(x,y+r);
  ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
}
function hudBar(x, y, bw, bh, team, right){
  var t=G.teams[team], kit=(t&&t.kit)||{s:'#ffffff',s2:'#111111'};
  var r=Math.round(bh*0.20);
  ctx.save();
  ctx.shadowColor='rgba(0,0,0,0.55)'; ctx.shadowBlur=bh*0.35; ctx.shadowOffsetY=bh*0.08;
  var g=ctx.createLinearGradient(x,y,x,y+bh);
  g.addColorStop(0,'rgba(16,21,32,0.90)'); g.addColorStop(1,'rgba(5,8,13,0.95)');
  ctx.fillStyle=g; rrect(x,y,bw,bh,r); ctx.fill();
  ctx.restore();
  ctx.strokeStyle='rgba(255,255,255,0.16)'; ctx.lineWidth=1; rrect(x+0.5,y+0.5,bw-1,bh-1,r); ctx.stroke();
  /* riga di colore squadra sul bordo */
  ctx.save(); rrect(x,y,bw,bh,r); ctx.clip();
  ctx.fillStyle=kit.s||'#fff';
  if(right) ctx.fillRect(x+bw-Math.round(bh*0.12), y, Math.round(bh*0.12), bh);
  else      ctx.fillRect(x, y, Math.round(bh*0.12), bh);
  ctx.restore();
  /* stemma */
  var sq=Math.round(bh*0.58), sx=right? (x+bw-Math.round(bh*0.26)-sq) : (x+Math.round(bh*0.26));
  var sy=y+(bh-sq)/2;
  ctx.fillStyle=kit.s||'#ffffff'; ctx.fillRect(sx,sy,sq,sq);
  ctx.fillStyle=kit.s2||'#111111'; ctx.fillRect(sx,sy,Math.round(sq*0.36),sq);
  ctx.strokeStyle='rgba(255,255,255,0.42)'; ctx.strokeRect(sx+0.5,sy+0.5,sq-1,sq-1);

  var fs=Math.max(10, Math.round(bh*0.38));
  ctx.font='700 '+fs+'px system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif';
  ctx.textBaseline='middle';
  var nm=String((t&&t.name)||'').toUpperCase();
  if(nm.length>14) nm=nm.slice(0,14);
  var sc=String((G.score&&G.score[team])||0);
  ctx.fillStyle='#eaf0fa';
  if(right){
    ctx.textAlign='right'; ctx.fillText(nm, sx-Math.round(bh*0.26), y+bh*0.52);
    ctx.textAlign='left';  ctx.font='800 '+Math.round(fs*1.30)+'px system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif';
    ctx.fillStyle='#ffd75a'; ctx.fillText(sc, x+Math.round(bh*0.30), y+bh*0.52);
  } else {
    ctx.textAlign='left';  ctx.fillText(nm, sx+sq+Math.round(bh*0.26), y+bh*0.52);
    ctx.textAlign='right'; ctx.font='800 '+Math.round(fs*1.30)+'px system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif';
    ctx.fillStyle='#ffd75a'; ctx.fillText(sc, x+bw-Math.round(bh*0.30), y+bh*0.52);
  }
}
function drawHud(){
  if(!ctx || typeof G==='undefined' || !G || !G.teams || !G.players) return;
  var st=G.state;
  if(st!=='play' && st!=='celebrate' && st!=='restart' && st!=='pens') return;
  ctx.save();
  var pad=Math.round(Math.min(W,H)*0.020);
  var bh =Math.max(22, Math.round(H*0.050));
  var bw =Math.round(Math.min(W*0.29, Math.max(150, H*0.42)));
  hudBar(pad,      H-pad-bh, bw, bh, 0, false);
  hudBar(W-pad-bw, H-pad-bh, bw, bh, 1, true);

  var cp=null;
  for(var i=0;i<G.players.length;i++){ if(G.players[i].controlled){ cp=G.players[i]; break; } }
  if(cp){
    var chh=Math.round(bh*0.82), cy=H-pad-bh-Math.round(bh*0.32)-chh, cx=pad;
    var cw=Math.round(bw*0.94);
    ctx.save();
    ctx.shadowColor='rgba(0,0,0,0.5)'; ctx.shadowBlur=bh*0.3;
    ctx.fillStyle='rgba(9,12,19,0.86)'; rrect(cx,cy,cw,chh,Math.round(chh*0.18)); ctx.fill();
    ctx.restore();
    ctx.strokeStyle='rgba(120,240,220,0.55)'; ctx.lineWidth=1;
    rrect(cx+0.5,cy+0.5,cw-1,chh-1,Math.round(chh*0.18)); ctx.stroke();
    var nb=Math.round(chh*0.74), nx=cx+Math.round(chh*0.16), ny=cy+(chh-nb)/2;
    var ng=ctx.createLinearGradient(nx,ny,nx,ny+nb);
    ng.addColorStop(0,'rgba(90,255,225,0.98)'); ng.addColorStop(1,'rgba(30,205,180,0.95)');
    ctx.fillStyle=ng; rrect(nx,ny,nb,nb,Math.round(nb*0.22)); ctx.fill();
    var nfs=Math.max(9, Math.round(nb*0.62));
    ctx.font='800 '+nfs+'px system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif';
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillStyle='#04231e';
    ctx.fillText(String(cp.shirt||''), nx+nb/2, ny+nb*0.56);
    var lfs=Math.max(9, Math.round(chh*0.38));
    ctx.font='700 '+lfs+'px system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif';
    ctx.textAlign='left'; ctx.fillStyle='#eaf0fa';
    var pn='';
    try{ pn = (typeof shortName==='function') ? shortName(cp) : (cp.name||''); }
    catch(e){ pn = cp.name||''; }
    pn=String(pn).toUpperCase(); if(pn.length>15) pn=pn.slice(0,15);
    ctx.fillText(pn, nx+nb+Math.round(chh*0.22), cy+chh*0.42);
    var sv=(typeof cp.stam==='number') ? cp.stam : ((typeof cp.stamina==='number') ? cp.stamina : null);
    if(sv!==null){
      if(sv>1.001) sv=sv/100;
      sv=Math.max(0,Math.min(1,sv));
      var sbx=nx+nb+Math.round(chh*0.22), sby=cy+chh*0.70,
          sbw=cw-(sbx-cx)-Math.round(chh*0.24), sbh=Math.max(2,Math.round(chh*0.12));
      ctx.fillStyle='rgba(255,255,255,0.16)'; ctx.fillRect(sbx,sby,sbw,sbh);
      ctx.fillStyle = sv>0.55 ? '#4de08a' : (sv>0.28 ? '#ffd75a' : '#ff6a5a');
      ctx.fillRect(sbx,sby,Math.round(sbw*sv),sbh);
    }
  }
  ctx.restore();
}
R.hud = drawHud;

/* ------------------------------ ingresso -------------------------------- */
R.frame = function(){
  if(typeof G==='undefined' || !G || !G.players || !G.players.length) return false;
  if(typeof ctx==='undefined' || !ctx || !ctx.canvas || !ctx.canvas.parentNode) return false;
  /* nuova partita: overlay ricreato -> azzero lo stato di errore e riaggancio */
  var host=ctx.canvas.parentNode;
  if(host !== R._host){ R._host=host; R.failed=false; R.err=null; }
  if(R.needReset){ R.needReset=false; hardReset(); }
  if(gl && gl.isContextLost && gl.isContextLost()) hardReset();
  if(R.failed) return false;
  if(!gl){ if(!init()) return false; }
  else if(!ensureHost()) return false;
  try{
    var now = (typeof performance!=='undefined' && performance.now)
              ? performance.now()/1000 : Date.now()/1000;
    var raw = R._last ? (now - R._last) : 0.016;
    R.fno = (R.fno||0) + 1;
    R.dt = Math.min(0.05, raw);
    R._last = now;
    R.avg = R.avg ? (R.avg*0.90 + raw*0.10) : raw;
    R.clock = G.clock || (now%100000);
    /* lampo sul gol */
    if(G.state==='celebrate' && R._st!=='celebrate') R.flash=0.22;
    R._st=G.state;
    R.flash=Math.max(0,(R.flash||0)-R.dt*0.55);

    /* risoluzione: qualita' massima, si abbassa sola solo se il dispositivo
       non tiene (l'utente ha chiesto di non badare agli fps) */
    if(R.q===undefined) R.q=1;
    if(R.avg>0.075 && R.q>0.55)      R.q=Math.max(0.55, R.q-0.02);
    else if(R.avg<0.030 && R.q<1)    R.q=Math.min(1, R.q+0.01);
    var cw0=Math.max(2, ctx.canvas.width), ch0=Math.max(2, ctx.canvas.height);
    var MAXPX=8.4e6*R.q*R.q, scl=1;
    if(cw0*ch0 > MAXPX) scl=Math.sqrt(MAXPX/(cw0*ch0));
    var cw=Math.max(320, Math.round(cw0*scl)), ch=Math.max(200, Math.round(ch0*scl));
    if(R.cvs.width!==cw || R.cvs.height!==ch){ R.cvs.width=cw; R.cvs.height=ch; }
    /* supersampling quando non c'e' l'MSAA (WebGL1) */
    var ss = GL2 ? 1.0 : 1.5;
    var rw = Math.max(320, Math.round(cw*ss)), rh = Math.max(200, Math.round(ch*ss));
    if(rw*rh > 1.6e7){ var k=Math.sqrt(1.6e7/(rw*rh)); rw=Math.round(rw*k); rh=Math.round(rh*k); }
    targets(rw, rh);

    camera(cw/ch);
    R.nd=0;
    if(R.shOK) shadowPass();
    mainPass(rw, rh);
    if(R.debug){
      R.e1=gl.getError();
      var dpx=new Uint8Array(4);
      gl.bindFramebuffer(gl.FRAMEBUFFER, FB.scene.fb);
      R.fbst=gl.checkFramebufferStatus(gl.FRAMEBUFFER);
      gl.readPixels(rw>>1, (rh*0.62)|0, 1,1, gl.RGBA, gl.UNSIGNED_BYTE, dpx);
      R.scenePx=dpx[0]+','+dpx[1]+','+dpx[2];
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    if(FB.ok) post(cw, ch);
    if(R.debug){
      R.e2=gl.getError();
      R.msaaOn=!!FB.msaa;
    }
    return true;
  }catch(e){
    R.failed=true; R.err=(e&&e.message)||String(e);
    if(R.cvs) R.cvs.style.display='none';
    try{ ctx.canvas.style.background=''; ctx.canvas.style.zIndex=''; }catch(e2){}
    try{ noteDrawErr('gl3d',e); }catch(e3){}
    return false;
  }
};

return R;
})();

try{ window.M26GL=M26GL; }catch(e){}

})();

