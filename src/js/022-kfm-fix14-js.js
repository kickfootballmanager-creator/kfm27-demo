
(function(){
  'use strict';
  var LOG=[];
  function rec(msg){ try{ if(!msg) return; msg=String(msg); if(LOG.indexOf(msg)<0){ LOG.push(msg); if(LOG.length>6) LOG.shift(); } }catch(e){} }
  window.addEventListener('error', function(ev){
    try{
      var t=ev&&ev.target;
      if(t&&t.tagName){ return; }
      var m=(ev&&(ev.message||(ev.error&&ev.error.message)))||'';
      if(m) rec(m);
    }catch(e){}
  }, true);
  window.addEventListener('unhandledrejection', function(ev){ rec(ev&&ev.reason&&ev.reason.message); }, true);
  window.kfmRecErr=rec;

  function appEl(){ return document.getElementById('app'); }
  function utOn(){ var r=document.getElementById('ut-root'); return !!(r&&r.classList&&r.classList.contains('on')); }
  function introOn(){
    var r=document.getElementById('kfm-intro');
    if(!r) return false;
    if(r.style&&r.style.display==='none') return false;
    if(r.classList&&r.classList.contains('kfm-gone')) return false;
    return true;
  }
  function isEmpty(){
    var a=appEl(); if(!a) return true;
    var h=(a.innerHTML||'').replace(/\s+/g,'');
    if(h.length<40) return true;
    if(!a.getBoundingClientRect) return false;
    var r=a.getBoundingClientRect();
    if(r.height>=40) return false;
    /* Mercato e Finanze sono schermate position:fixed: #app resta alto 0
       anche quando la pagina è disegnata perfettamente. Prima di dichiarare
       il vuoto guardo se un figlio occupa spazio davvero. */
    try{
      var ch=a.children;
      for(var i=0;i<ch.length;i++){
        var cr=ch[i].getBoundingClientRect();
        if(cr.height>40 && cr.width>40) return false;
      }
    }catch(e){}
    return true;
  }
  function unveil(){
    try{
      var a=appEl();
      if(a){ a.style.opacity='1'; a.style.visibility='visible'; a.style.display=''; }
      var v=document.querySelectorAll('#app .view-anim');
      for(var i=0;i<v.length;i++){ v[i].style.opacity='1'; v[i].style.transform='none'; }
    }catch(e){}
  }
  var lastHeal=0;
  function heal(){
    if(utOn()||introOn()) return false;
    unveil();
    if(!isEmpty()) return false;
    var nowH=Date.now();
    if(nowH-lastHeal<1200) return true;
    lastHeal=nowH;
    try{ if(typeof window.render==='function') window.render(); }catch(e){ rec(e&&e.message); }
    unveil();
    return isEmpty();
  }
  window.kfmHeal=heal;

  var panel=null;
  function showPanel(){
    if(panel) return;
    try{
      panel=document.createElement('div');
      panel.id='kfm-err';
      panel.innerHTML='<div class="kfm-err-c">'+
        '<div class="kfm-err-t">Impossibile aprire questa modalit\u00e0</div>'+
        '<div class="kfm-err-m">'+(LOG.length?LOG.map(function(x){return x.replace(/[<>&]/g,'');}).join('<br>'):'Nessun dettaglio disponibile')+'</div>'+
        '<button class="kfm-err-b" type="button">Torna alla schermata iniziale</button>'+
        '</div>';
      var st=document.createElement('style');
      st.textContent='#kfm-err{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;background:radial-gradient(120% 120% at 50% 0%,#0b1424 0%,#05070d 70%);font-family:Inter,system-ui,sans-serif}'+
        '#kfm-err .kfm-err-c{max-width:560px;padding:34px 32px;border-radius:18px;background:rgba(14,20,32,.92);border:1px solid rgba(255,255,255,.10);box-shadow:0 30px 80px rgba(0,0,0,.6);text-align:center}'+
        '#kfm-err .kfm-err-t{font-family:Oswald,Inter,sans-serif;font-size:22px;letter-spacing:.06em;text-transform:uppercase;color:#fff;margin-bottom:14px}'+
        '#kfm-err .kfm-err-m{font-size:13px;line-height:1.6;color:#9fb0c9;margin-bottom:22px;word-break:break-word}'+
        '#kfm-err .kfm-err-b{appearance:none;border:1px solid rgba(255,255,255,.85);background:#fff;color:#0a0f18;font-family:Oswald,Inter,sans-serif;letter-spacing:.08em;text-transform:uppercase;font-size:13px;padding:12px 26px;border-radius:999px;cursor:pointer;transition:.2s}'+
        '#kfm-err .kfm-err-b:hover{background:transparent;color:#fff}';
      panel.appendChild(st);
      panel.querySelector('.kfm-err-b').addEventListener('click', function(){
        try{ panel.remove(); }catch(e){}
        panel=null;
        try{ if(typeof window.kfmHome==='function') window.kfmHome(); }catch(e){}
      });
      document.body.appendChild(panel);
    }catch(e){}
  }

  var timer=null;
  function watch(){
    if(timer) clearInterval(timer);
    var n=0;
    timer=setInterval(function(){
      n++;
      var still=true;
      try{ still=heal(); }catch(e){ rec(e&&e.message); }
      if(!still){ clearInterval(timer); timer=null; return; }
      if(n>=14){ clearInterval(timer); timer=null; showPanel(); }
    },220);
  }
  /* causa reale dell'errore + nuovo tentativo di disegno */
  try{
    window.addEventListener('error', function(ev){
      try{ var m=(ev&&(ev.message||(ev.error&&ev.error.message)))||''; if(m) rec(m); }catch(e){}
    });
    window.addEventListener('unhandledrejection', function(ev){
      try{ var r=ev&&ev.reason; rec((r&&(r.message||String(r)))||''); }catch(e){}
    });
  }catch(e){}
  if(typeof window.render==='function'){
    var oRender=window.render, again=0;
    window.render=function(){
      try{ return oRender.apply(this,arguments); }
      catch(err){
        rec(err&&err.message);
        if(again<1){
          again++;
          try{ if(window.S){ if(window.S.rosaSel!==undefined) window.S.rosaSel=null; } }catch(e2){}
          try{ var r2=oRender.apply(this,arguments); again=0; return r2; }catch(e3){ rec(e3&&e3.message); }
          again=0;
        }
        try{ watch(); }catch(e4){}
      }
    };
  }
  window.kfmRec=rec;
  window.kfmWatch=watch;
  document.addEventListener('click', function(){ setTimeout(watch,450); }, true);
})();
