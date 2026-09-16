
(function(){
  'use strict';

  function U(){ return window.UTX||null; }
  function ST(){ var u=U(); return u?u.st():null; }
  function nf(n){ var u=U(); return u?u.fmt(n):String(n); }
  function ee(v){ return String(v==null?'':v)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function fr(a){ try{ return (window.UT_FRAMES||{})[a]||''; }catch(e){ return ''; } }
  function pack(k){ var u=U(); return (u&&u.pack)?u.pack(k):null; }

  /* --- l'icona token vera vive in #ut-root: la porto a livello di documento --- */
  function icTok(){
    try{
      var r=document.getElementById('ut-root'); if(!r) return;
      var v=getComputedStyle(r).getPropertyValue('--ic-tok');
      if(v&&v.trim()) document.documentElement.style.setProperty('--kfm-ic-tok',v.trim());
    }catch(e){}
  }
  setTimeout(icTok,400); setTimeout(icTok,1800); setTimeout(icTok,5000);

  /* --- artwork della ricompensa: telaio reale del pacchetto o valuta vera --- */
  function art(rw){
    if(!rw) return '';
    if(rw.t==='pack'){
      var p=pack(rw.v), a=(p&&p.art)||'gold';
      return '<span class="kfx-pk" style="background-image:url('+fr(a)+')"></span>';
    }
    if(rw.t==='exp') return '<span class="kfx-ic exp"></span>';
    if(rw.t==='tok') return '<span class="kfx-ic tok"></span>';
    return '<span class="kfx-ic coin"></span>';
  }
  function rwName(rw){
    if(!rw) return '';
    if(rw.t==='pack'){ var p=pack(rw.v); return (p&&p.nm)?p.nm:(rw.nm||'Pacchetto'); }
    if(rw.t==='exp') return nf(rw.v)+' EXP';
    if(rw.t==='tok') return rw.v+' token';
    return nf(rw.v)+' monete';
  }

  /* ===================================================== ACCESSO GIORNALIERO */
  window.kfmDailyHTML=function(){
    var u=U(); if(!u) return '';
    var L=u.dailyList()||[], D=u.dailyState()||{day:0,streak:0};
    var ready=!!u.dailyReady(), cur=(D.day|0)%7, i, cells='';
    for(i=0;i<7;i++){
      var rw=L[i], done=(i<cur), now=(ready&&i===cur), big=(i===6);
      cells+='<div class="kfd-c'+(done?' done':'')+(now?' now':'')+(big?' big':'')+'">'+
        '<div class="h">Giorno '+(i+1)+'</div>'+
        '<div class="a">'+art(rw)+'</div>'+
        '<div class="n">'+ee(rwName(rw))+'</div></div>';
    }
    var ph=window.KFM_PLAYER?'<img class="ph" src="'+window.KFM_PLAYER+'" alt="">':'';
    var msg=ready
      ? 'La ricompensa del <b>giorno '+(cur+1)+'</b> ti aspetta: '+ee(rwName(L[cur]))+
        '. Le ricompense si rinnovano ogni giorno a mezzanotte.'
      : 'Ricompensa di oggi gia\u0027 ritirata. Torna domani per il <b>giorno '+
        (((cur)%7)+1)+'</b> e non interrompere la serie.';
    return '<div class="kfm-body"><div class="kfd">'+
      '<div class="kfd-head"><h3>Accesso giornaliero</h3>'+
        '<span>sette giorni \u00b7 ricompense crescenti</span></div>'+
      '<div class="kfd-main">'+
        '<div class="kfd-grid">'+cells+'</div>'+
        '<div class="kfd-side">'+ph+'<span class="gl"></span>'+
          '<div class="st"><b>'+(D.streak|0)+'</b><span>giorni di fila</span></div>'+
          '<div class="bx">'+msg+'</div>'+
          (ready?'<button class="kfd-cta" data-ac="claim" type="button">Ritira</button>'
                :'<div class="kfd-cta off">Torna domani</div>')+
        '</div>'+
      '</div></div></div>';
  };

  /* ================================================================= EVENTI */
  var EVT=[
    {t:'coin',v:400 }, {t:'exp', v:150}, {t:'pack',v:'bronzoplus'},
    {t:'coin',v:700 }, {t:'exp', v:250}, {t:'coin',v:900},
    {t:'pack',v:'argento72'}, {t:'exp', v:300}, {t:'coin',v:1100},
    {t:'tok', v:3   }, {t:'exp', v:400}, {t:'pack',v:'oro'},
    {t:'coin',v:1500}, {t:'exp', v:500}, {t:'coin',v:1800},
    {t:'tok', v:5   }, {t:'pack',v:'oro81'}, {t:'coin',v:2200},
    {t:'exp', v:800 }, {t:'coin',v:2600}, {t:'pack',v:'special2'}
  ];
  var MILES=[3,7,12,17,21];
  window.EVT=EVT;

  function dk(){ var u=U(); return u?u.dayKey():new Date().toDateString(); }
  function est(){
    var s=ST(); if(!s) return null;
    if(!s.evt||typeof s.evt!=='object') s.evt={day:0,last:''};
    return s.evt;
  }
  function eready(){ var E=est(); return !!E && E.last!==dk() && (E.day|0)<EVT.length; }
  window.evtReady=eready;

  window.evtHTML=function(){
    var E=est()||{day:0,last:''}, cur=E.day|0, ready=eready(), i, cells='', miles='';
    for(i=0;i<EVT.length;i++){
      var rw=EVT[i], done=(i<cur), now=(ready&&i===cur), mile=(MILES.indexOf(i+1)>=0);
      cells+='<div class="kfe-c'+(done?' done':'')+(now?' now':'')+(mile?' mile':'')+
        '" title="'+ee(rwName(rw))+'">'+
        '<div class="a">'+art(rw)+'</div>'+
        '<div class="d">'+(i+1)+'</div></div>';
    }
    for(i=0;i<MILES.length;i++){
      var m=MILES[i], on=(cur>=m), mr=EVT[m-1];
      miles+='<div class="kfe-m'+(on?' on':'')+'" title="'+ee(rwName(mr))+'">'+
        '<div class="c">'+art(mr)+'</div><div class="d">G '+m+'</div></div>';
    }
    var pct=Math.max(0,Math.min(100,Math.round(cur/EVT.length*100)));
    var last=EVT[EVT.length-1];
    return '<div class="kfm-body"><div class="kfe">'+
      '<div class="kfe-hero"><div class="tx"><h4>Peak Season Check-in</h4>'+
        '<p>Accedi ogni giorno per 21 giorni. Ogni traguardo alza la posta: '+
        'al giorno 21 ti aspetta '+ee(rwName(last))+'.</p>'+
        '<div class="kfe-bar"><i style="width:'+pct+'%"></i></div>'+
        '<div class="kfe-pct">'+cur+' / '+EVT.length+' giorni \u00b7 '+pct+'%</div></div>'+
        '<div class="kfe-miles">'+miles+'</div></div>'+
      '<div class="kfe-grid">'+cells+'</div>'+
      '<div class="kfe-foot"><div class="tx"><b>Accessi totali '+cur+' / '+EVT.length+'</b>'+
        '<span>'+(ready?('Ricompensa del giorno '+(cur+1)+' disponibile: '+ee(rwName(EVT[cur])))
          :(cur>=EVT.length?'Evento completato: hai ritirato tutte le ricompense.'
            :'Check-in di oggi registrato. Torna domani a mezzanotte.'))+'</span></div>'+
        (ready?'<button class="kfd-cta" data-ac="claimevt" type="button">Riscuoti</button>'
              :'<div class="kfd-cta off">'+(cur>=EVT.length?'Completato':'Torna domani')+'</div>')+
      '</div></div></div>';
  };

  window.evtClaim=function(){
    var u=U(), s=ST(), E=est();
    if(!u||!s||!E){ if(u) u.toast('Apri Ultimate Team per riscuotere il check-in.'); return; }
    if(!eready()){ u.toast('Hai gia\u0027 riscosso il check-in di oggi.'); return; }
    var rw=EVT[E.day|0], msg='';
    if(rw.t==='coin'){ s.coins=(s.coins|0)+rw.v; msg='+'+nf(rw.v)+' monete'; }
    else if(rw.t==='exp'){ s.exp=(s.exp|0)+rw.v; msg='+'+nf(rw.v)+' EXP'; }
    else if(rw.t==='tok'){ s.tokens=(s.tokens|0)+rw.v; msg='+'+rw.v+' token'; }
    else {
      var p=pack(rw.v);
      if(p){ var got=u.openPack(p)||[]; msg=(p.nm||'Pacchetto')+': '+got.length+' carte'; }
      else msg='pacchetto non disponibile';
    }
    E.day=(E.day|0)+1; E.last=dk();
    u.save();
    u.toast('<b>Check-in giorno '+E.day+'</b> \u00b7 '+msg);
    u.actOpen(); u.render();
  };

  /* riscossione anche fuori dal pannello azioni */
  document.addEventListener('click',function(e){
    var b=e.target&&e.target.closest?e.target.closest('[data-ac]'):null;
    if(!b) return;
    if(b.closest('#ut-act')) return;            /* gia' gestito dal pannello */
    var k=b.getAttribute('data-ac');
    if(k==='claimevt'){ e.preventDefault(); try{ window.evtClaim(); }catch(x){} }
    else if(k==='claim'){ var u=U(); if(u){ e.preventDefault(); u.dailyClaim(); u.actOpen(); } }
  },false);

  /* ============ chiusura pulita di Ultimate Team (fine schermo nero) ======= */
  var SHOW=['ut-hud','ut-body','ut-root','app'];
  var OFF=['ut-act','ut-open','ut-modal','ut-mask','ut-menu','ut-fsq'];
  function utClose(){
    try{
      var r=document.getElementById('ut-root');
      if(r){ r.classList.remove('on'); r.style.display=''; }
    }catch(e){}
    for(var i=0;i<SHOW.length;i++){
      try{
        var el=document.getElementById(SHOW[i]);
        if(el&&el.style&&el.style.display==='none') el.style.display='';
      }catch(e){}
    }
    for(var j=0;j<OFF.length;j++){
      try{ var o=document.getElementById(OFF[j]); if(o&&o.classList) o.classList.remove('on'); }catch(e){}
    }
    try{
      var a=document.getElementById('app');
      if(a){ a.style.opacity='1'; a.style.visibility='visible'; }
    }catch(e){}
  }
  window.kfmCloseUT=utClose;

  var prevHome=window.kfmHome;
  window.kfmHome=function(){
    var out;
    try{ if(typeof prevHome==='function') out=prevHome.apply(this,arguments); }catch(e){}
    utClose(); setTimeout(utClose,60); setTimeout(utClose,420);
    return out;
  };

  /* prima di lanciare qualsiasi modalita', l'interfaccia di UT viene smontata */
  document.addEventListener('click',function(e){
    var t=e.target; if(!t||!t.closest) return;
    if(t.closest('#kfm-enter')||t.closest('.kfm-item')||t.closest('#kfm-playbtn')) utClose();
  },true);

  /* rete di sicurezza: nessun pannello di UT puo' restare sopra il gioco vuoto */
  setInterval(function(){
    try{
      var r=document.getElementById('ut-root');
      if(!r||!r.classList.contains('on')) return;
      var b=document.getElementById('ut-body');
      if(b&&b.style&&b.style.display==='none') b.style.display='';
      var h=document.getElementById('ut-hud');
      if(h&&h.style&&h.style.display==='none') h.style.display='';
      var intro=document.getElementById('kfm-intro');
      var introOn=intro&&intro.style.display!=='none'&&!intro.classList.contains('kfm-gone');
      if(introOn) r.classList.remove('on');
    }catch(e){}
  },900);
})();
