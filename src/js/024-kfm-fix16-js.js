
(function(){
'use strict';
function U(){ return window.UTX||null; }
function nf(n){ var u=U(); return u?u.fmt(n):String(n); }
function fr(a){ try{ return (window.UT_FRAMES||{})[a]||''; }catch(e){ return ''; } }
function pk(k){ var u=U(); return (u&&u.pack)?u.pack(k):null; }

/* la variabile con l'icona reale del token vive su #ut-root: la porto sul documento */
function icTok(){
  try{
    var r=document.getElementById('ut-root'); if(!r) return;
    var v=getComputedStyle(r).getPropertyValue('--ic-tok');
    if(v&&v.trim()) document.documentElement.style.setProperty('--kfm-ic-tok',v.trim());
  }catch(e){}
}
setTimeout(icTok,300); setTimeout(icTok,1500); setTimeout(icTok,4000);
document.addEventListener('click',function(){ setTimeout(icTok,150); },true);

function art(rw){
  if(!rw) return '';
  if(rw.t==='pack'){
    var p=pk(rw.v), a=(p&&p.art)||'gold';
    return '<span class="kfx-pk" style="background-image:url('+fr(a)+')"></span>';
  }
  if(rw.t==='exp') return '<span class="kfx-ic exp"></span>';
  if(rw.t==='tok') return '<span class="kfx-ic tok"></span>';
  return '<span class="kfx-ic coin"></span>';
}
function nm(rw){
  if(!rw) return '';
  if(rw.t==='pack'){ var p=pk(rw.v); return (p&&p.nm)?p.nm:(rw.nm||'Pacchetto'); }
  if(rw.t==='exp') return nf(rw.v)+' EXP';
  if(rw.t==='tok') return rw.v+' token';
  return nf(rw.v)+' monete';
}

/* ============================ ACCESSO GIORNALIERO ======================== */
window.kfmDailyHTML=function(){
  var u=U();
  var list=(u&&u.dailyList)?(u.dailyList()||[]):[];
  if(!list.length) return '<div class="dl7-side"><div class="bx">Ricompense non disponibili.</div></div>';
  var st=(u&&u.dailyState)?(u.dailyState()||{}):{};
  var streak=st.day||0, ready=(u&&u.dailyReady)?!!u.dailyReady():false;
  var idx=streak%list.length;                      // giorno che sta per essere ritirato
  var h='<div class="dl7-wrap"><div class="dl7-grid">';
  for(var i=0;i<list.length;i++){
    var big=(i===list.length-1);
    var cl='dl7-c'+(big?' big':'');
    if(i<idx) cl+=' done';
    else if(i===idx&&ready) cl+=' now';
    h+='<div class="'+cl+'">'
      +'<div class="h">GIORNO '+(i+1)+'</div>'
      +'<div class="a">'+art(list[i])+'</div>'
      +'<div class="n">'+nm(list[i])+'</div></div>';
  }
  h+='</div><div class="dl7-side">'
    +'<div class="gl"></div>'
    +(window.KFM_PLAYER?'<img class="ph" src="'+window.KFM_PLAYER+'" alt="">':'')
    +'<div class="st"><b>'+streak+'</b><span>giorni<br>di fila</span></div>'
    +'<div class="bx">'+(ready
      ? 'Ritira la ricompensa del <b>giorno '+(idx+1)+'</b>. Le ricompense si rinnovano ogni giorno a mezzanotte.'
      : 'Ricompensa di oggi ritirata. Torna domani per il <b>giorno '+(idx+1)+'</b> e non interrompere la serie.')
    +'</div>'
    +(ready
      ? '<button class="dl7-cta" data-ac="claim">Ritira</button>'
      : '<div class="dl7-cta off">Torna domani</div>')
    +'</div></div>';
  return h;
};

/* ==================================== EVENTI ============================ */
window.evtHTML=function(){
  var u=U();
  var L=window.EVT||[], M=[3,7,12,17,21];
  if(!L.length) return '<div class="ev7-foot"><div class="tx"><b>Evento non disponibile</b></div></div>';
  var S=(u&&u.st)?(u.st()||{}):{};
  var E=S.evt||{day:0,last:''};
  var day=E.day||0, tot=L.length;
  var ready=(typeof window.evtReady==='function')?!!window.evtReady():false;
  var pct=Math.max(0,Math.min(100,Math.round(day/tot*100)));
  var h='<div class="ev7-top"><div class="tx">'
    +'<b>Peak Season Check-in</b>'
    +'<p>Accedi ogni giorno per '+tot+' giorni: ogni traguardo alza la posta e al giorno '+tot
    +' ti aspetta un pacchetto Eternal.</p>'
    +'<div class="ev7-bar"><i style="width:'+pct+'%"></i></div>'
    +'<div class="ev7-pct">'+day+' / '+tot+' giorni &middot; '+pct+'%</div>'
    +'</div><div class="ev7-mil">';
  for(var m=0;m<M.length;m++){
    var d=M[m], rw=L[d-1];
    h+='<div class="ev7-m'+(day>=d?' on':'')+'"><div class="c">'+art(rw)+'</div>'
      +'<div class="d">G '+d+'</div></div>';
  }
  h+='</div></div><div class="ev7-grid">';
  for(var i=0;i<tot;i++){
    var cl='ev7-c'+(M.indexOf(i+1)>=0?' mile':'');
    if(i<day) cl+=' done';
    else if(i===day&&ready) cl+=' now';
    h+='<div class="'+cl+'"><div class="a">'+art(L[i])+'</div>'
      +'<div class="d">'+(i+1)+'</div></div>';
  }
  h+='</div><div class="ev7-foot"><div class="tx">'
    +'<b>Accessi totali '+day+' / '+tot+'</b>'
    +'<span>'+(ready
      ? 'Ricompensa del giorno '+(day+1)+': '+nm(L[day])+'.'
      : 'Check-in di oggi registrato. Torna domani a mezzanotte.')+'</span>'
    +'</div>'
    +(ready
      ? '<button class="dl7-cta" data-ac="claimevt">Riscuoti</button>'
      : '<div class="dl7-cta off">Torna domani</div>')
    +'</div>';
  return h;
};
})();
