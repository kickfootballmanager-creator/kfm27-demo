
(function(){
  var KEY='m26_orient', mem=null;

  function isPhone(){
    try{
      if(window.matchMedia('(pointer:coarse)').matches &&
         Math.min(screen.width,screen.height)<=900) return true;
    }catch(e){}
    return Math.min(window.innerWidth,window.innerHeight)<=560;
  }
  function get(){ try{ return localStorage.getItem(KEY)||mem; }catch(e){ return mem; } }
  function set(v){ mem=v; try{ window.__orient=v; }catch(e){} try{ localStorage.setItem(KEY,v); }catch(e){} }
  function cur(){ return (window.innerWidth>window.innerHeight)?'landscape':'portrait'; }

  /* blocco reale dell'orientamento: funziona su Android in schermo intero,
     su iOS non e' supportato e si ricade sull'avviso "ruota il telefono" */
  function tryLock(w){
    try{
      var el=document.documentElement;
      var rf=el.requestFullscreen||el.webkitRequestFullscreen||el.mozRequestFullScreen;
      var lk=function(){
        try{
          if(screen.orientation&&screen.orientation.lock){
            var r=screen.orientation.lock(w);
            if(r&&r.catch) r.catch(function(){});
          }
        }catch(e){}
      };
      if(rf){ var p=rf.call(el); if(p&&p.then){ p.then(lk).catch(lk); } else lk(); }
      else lk();
    }catch(e){}
  }

  function rotEl(){
    var d=document.getElementById('orient-rot');
    if(d) return d;
    d=document.createElement('div'); d.id='orient-rot';
    d.innerHTML='<div class="or-in"><div class="or-ic">\u27F3</div>'+
      '<div class="or-t">Ruota il telefono</div>'+
      '<div class="or-s">Hai scelto di giocare in <b class="or-w"></b>. '+
      'Rimetti il telefono in quella posizione per continuare.</div>'+
      '<button class="or-b" type="button">Cambia orientamento</button></div>';
    document.body.appendChild(d);
    d.querySelector('.or-b').addEventListener('click',function(){ ask(true); });
    return d;
  }

  function check(){
    var want=get();
    var d=document.getElementById('orient-rot');
    if(!isPhone()||!want){ if(d) d.classList.remove('on'); return; }
    document.documentElement.setAttribute('data-orient',want);
    d=rotEl();
    d.querySelector('.or-w').textContent=(want==='landscape')?'orizzontale':'verticale';
    if(cur()!==want) d.classList.add('on'); else d.classList.remove('on');
  }

  function ask(force){
    if(!isPhone()) return;
    if(!force&&get()){ check(); return; }
    var old=document.getElementById('orient-ask'); if(old) old.remove();
    var r=document.getElementById('orient-rot'); if(r) r.classList.remove('on');
    var ov=document.createElement('div'); ov.id='orient-ask'; ov.className='on';
    ov.innerHTML='<div class="oa-in">'+
      '<div class="oa-t">Come vuoi giocare?</div>'+
      '<div class="oa-s">Scegli l\'orientamento dello schermo: il gioco si adatta a quello che scegli e ti avvisa se ruoti il telefono.</div>'+
      '<div class="oa-g">'+
        '<button type="button" data-o="portrait"><span class="oa-ic p"></span>Verticale</button>'+
        '<button type="button" data-o="landscape"><span class="oa-ic l"></span>Orizzontale</button>'+
      '</div>'+
      '<div class="oa-note">Puoi cambiarlo quando vuoi ruotando il telefono e toccando \u201cCambia orientamento\u201d.</div>'+
      '</div>';
    document.body.appendChild(ov);
    ov.addEventListener('click',function(e){
      var t=e.target, b=null;
      while(t&&t!==ov){ if(t.tagName==='BUTTON'&&t.getAttribute('data-o')){ b=t; break; } t=t.parentNode; }
      if(!b) return;
      var w=b.getAttribute('data-o');
      b.classList.add('sel');
      set(w);
      document.documentElement.setAttribute('data-orient',w);
      tryLock(w);
      setTimeout(function(){ ov.remove(); check(); },160);
    });
  }

  function boot(){
    if(!isPhone()) return;
    document.documentElement.setAttribute('data-orient',get()||cur());
    ask(false);
    check();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot);
  else boot();
  window.addEventListener('resize',check);
  window.addEventListener('orientationchange',function(){ setTimeout(check,260); });
  window.chooseOrientation=function(){ ask(true); };
})();
