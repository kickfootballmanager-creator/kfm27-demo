
(function(){
/* =========================================================== 1) CREST per tid */
try{
var TID={}, FB={};
function keys(t){ t=String(t==null?'':t); var a=[t, t.replace(/\.0$/,'')]; a.push(a[1].replace(/^0+/,'')); return a; }
function buildTid(){
  try{
    var dbs=[];
    try{ if(typeof EADB!=='undefined'&&EADB) dbs.push(EADB); }catch(e){}
    ['DB_SERIE_A','CLUBS','WCLUBS'].forEach(function(n){ try{ var d=window[n]; if(d&&typeof d==='object') dbs.push(d); }catch(e){} });
    dbs.forEach(function(db){
      for(var name in db){ if(!Object.prototype.hasOwnProperty.call(db,name)) continue;
        var v=db[name]; if(!v||typeof v!=='object') continue;
        var tid=(v.tid!=null?v.tid:v.logo); if(tid==null||tid==='') continue;
        var url='';
        try{ url=(typeof window.kfmTeamLogo==='function')?window.kfmTeamLogo(name):''; }catch(e){}
        if(!url) continue;
        keys(tid).forEach(function(k){ if(k) TID[k]=url; });
      }
    });
  }catch(e){}
}
function tidUrl(id){ try{ var k=keys(id); for(var i=0;i<k.length;i++){ if(TID[k[i]]) return TID[k[i]]; } }catch(e){} return ''; }
function hookGetLogo(){
  try{
    if(typeof window.getLogo!=='function'||window.getLogo.__kfm8) return;
    var old=window.getLogo;
    var f=function(id,name){
      var fb;
      try{ fb=old.apply(this,arguments); }catch(e){ fb=''; }
      try{
        if(fb&&String(fb).indexOf('media.api-sports.io')>=0) return fb;
        var u=tidUrl(id);
        if(u){ FB[u]=fb; return u; }
      }catch(e){}
      return fb;
    };
    f.__kfm8=true; window.getLogo=f;
  }catch(e){}
}
var RX1=/images\.fifaindex\.com\/[a-z0-9]+\/teams\/([0-9]+)\.webp/i;
var RX2=/tmssl\.akamaized\.net\/images\/wappen\/head\/([0-9]+)\.png/i;
function sweep(){
  try{
    var im=document.images, n=im.length;
    for(var i=0;i<n;i++){
      var el=im[i], s=el.currentSrc||el.src||'';
      if(!s||el.__kfm8) continue;
      var m=s.match(RX1), u='';
      if(m) u=tidUrl(m[1]);
      if(!u){ m=s.match(RX2); if(m) u=tidUrl('tm'+m[1])||tidUrl(m[1]); }
      if(u&&u!==s){ el.__kfm8=1; FB[u]=s; el.src=u; }
    }
  }catch(e){}
}
document.addEventListener('error',function(e){
  var t=e.target; if(!t||t.tagName!=='IMG') return;
  var f=FB[t.src]; if(f&&f!==t.src){ t.src=f; }
},true);
function boot(){ buildTid(); hookGetLogo(); sweep(); }
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
setInterval(function(){ hookGetLogo(); sweep(); },800);
setTimeout(buildTid,2500); setTimeout(buildTid,6000);
window.kfmCrestTid=tidUrl;
}catch(e){}

/* =========================================================== 2) FULLSCREEN */
try{
function fsEl(){ return document.fullscreenElement||document.webkitFullscreenElement||null; }
function fsReq(){ try{ var e=document.documentElement; var p=(e.requestFullscreen||e.webkitRequestFullscreen).call(e); if(p&&p.catch) p.catch(function(){}); }catch(x){} }
function fsExit(){ try{ (document.exitFullscreen||document.webkitExitFullscreen).call(document); }catch(x){} }
function lockEsc(){ try{ if(navigator.keyboard&&navigator.keyboard.lock) navigator.keyboard.lock(['Escape']); }catch(e){} }
function unlockEsc(){ try{ if(navigator.keyboard&&navigator.keyboard.unlock) navigator.keyboard.unlock(); }catch(e){} }

var bar=null,ring=null,txt=null,hideT=null;
function ui(){
  if(bar&&document.body.contains(bar)) return bar;
  bar=document.createElement('div'); bar.id='kfm-fs2';
  bar.innerHTML='<span class="r"><i></i></span><span class="t"></span>';
  bar.addEventListener('click',function(){ if(!fsEl()) fsReq(); hide(); });
  document.body.appendChild(bar);
  ring=bar.querySelector('i'); txt=bar.querySelector('.t');
  return bar;
}
function show(t,ms){ ui(); txt.textContent=t; bar.classList.add('on');
  clearTimeout(hideT); if(ms) hideT=setTimeout(function(){ bar.classList.remove('on'); },ms); }
function hide(){ ui(); clearTimeout(hideT); bar.classList.remove('on'); }
function prog(p){ ui(); ring.style.clipPath='inset(0 0 '+Math.round((1-p)*100)+'% 0)'; }

var TIP='Schermo intero disattivato \u2014 (SHIFT + barra spaziatrice per tornare a schermo intero)';
var HOLD=600;
var shiftT=0, escT=0, raf=0, armed=false;
function loop(){
  var now=Date.now(), p=0, t='';
  if(shiftT){ p=Math.min(1,(now-shiftT)/HOLD); t='SHIFT + barra spaziatrice per tornare a schermo intero'; if(p>=1) armed=true; }
  else if(escT){ p=Math.min(1,(now-escT)/HOLD); t='Continua a tenere premuto ESC per uscire'; }
  if(shiftT||escT){
    show(t); prog(p);
    if(escT&&p>=1){ escT=0; prog(0); hide(); unlockEsc(); fsExit(); }
    raf=requestAnimationFrame(loop);
  } else { prog(0); raf=0; }
}
function start(w){
  if(w==='shift'){ if(shiftT) return; shiftT=Date.now(); armed=false; }
  else { if(escT) return; escT=Date.now(); }
  if(!raf) raf=requestAnimationFrame(loop);
}
document.addEventListener('keydown',function(e){
  try{
    if(e.key==='Shift'||e.code==='ShiftLeft'||e.code==='ShiftRight'){ if(!fsEl()) start('shift'); return; }
    if(e.shiftKey&&!fsEl()&&e.key!=='Escape'){ shiftT=0; armed=false; hide(); fsReq(); return; } /* SHIFT + qualsiasi tasto: gesto valido */
    if(e.key==='Escape'&&fsEl()){ e.preventDefault(); start('esc'); }
  }catch(x){}
},true);
document.addEventListener('keyup',function(e){
  try{
    if(e.key==='Shift'||e.code==='ShiftLeft'||e.code==='ShiftRight'){
      var held=shiftT?Date.now()-shiftT:0; shiftT=0;
      if(!fsEl()&&(armed||held>=HOLD-120)){ hide(); fsReq(); setTimeout(function(){ if(!fsEl()) show(TIP,8000); },400); }
      else if(!fsEl()) show(TIP,5000); else hide();
      armed=false; return;
    }
    if(e.key==='Escape'&&escT){ escT=0; hide(); }
  }catch(x){}
},true);
document.addEventListener('mousedown',function(e){
  try{ if(!fsEl()&&(e.shiftKey||armed)){ armed=false; shiftT=0; hide(); fsReq(); } }catch(x){}
},true);
window.addEventListener('blur',function(){ shiftT=0; escT=0; armed=false; hide(); });
function onFs(){ if(fsEl()){ hide(); lockEsc(); } else { unlockEsc(); show(TIP,9000); } }
document.addEventListener('fullscreenchange',onFs);
document.addEventListener('webkitfullscreenchange',onFs);
window.kfmFullscreen=function(){ fsReq(); };
}catch(e){}

/* =========================================================== 3) HOME */
try{
var prevHome=window.kfmHome;
window.kfmHome=function(){
  try{
    ['ut-app','ut-frames','ut-hud','ut-body'].forEach(function(id){ var el=document.getElementById(id); if(el) el.style.display='none'; });
  }catch(e){}
  try{ var i=document.getElementById('kfm-intro'); if(i) i.style.zIndex='2147483000'; }catch(e){}
  try{ if(typeof prevHome==='function'){ prevHome(); return; } }catch(e){}
  try{ var k=document.getElementById('kfm-intro'); if(k){ k.style.display=''; k.classList.remove('kfm-gone'); } }catch(e){}
};
document.addEventListener('click',function(e){
  try{
    var b=e.target&&e.target.closest?e.target.closest('.kfm-home-btn,.kfm-home-item'):null;
    if(b){ e.preventDefault(); e.stopPropagation(); window.kfmHome(); }
  }catch(x){}
},true);
}catch(e){}

/* =========================================================== 4) CALENDARIO: rifiniture */
try{
function cleanCal(){
  try{
    var c=document.querySelector('.kcal'); if(!c) return;
    var p=c.parentElement, i=0;
    while(p&&p!==document.body&&i<4){ p.style.background='#05070d'; p=p.parentElement; i++; }
    var side=c.querySelector('.kcal-side'); if(!side) return;
    var els=side.querySelectorAll('button,a,span,b,div');
    for(var j=0;j<els.length;j++){
      var el=els[j]; if(el.children.length) continue;
      var t=el.textContent||'';
      var n=t.replace(/[\u2190-\u21FF\u2300-\u27BF\u2B00-\u2BFF\uFE0F]/g,'')
             .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g,'').replace(/\s{2,}/g,' ').trim();
      if(n!==t) el.textContent=n;
    }
    var bs=side.querySelectorAll('button');
    if(bs.length) bs[0].classList.add('kc-primary');
  }catch(e){}
}
setInterval(cleanCal,600);
}catch(e){}
})();

