
(function(){
'use strict';

function backdrop(){
  if(!document.body || document.getElementById('kfm-backdrop')) return;
  var d=document.createElement('div'); d.id='kfm-backdrop';
  document.body.insertBefore(d, document.body.firstChild);
}
backdrop();
document.addEventListener('DOMContentLoaded', backdrop);

/* Le sezioni da non toccare si riconoscono dal contenuto, non da S:
   lo stato del gioco non e' esposto sulla finestra. */
var RX_ESCL = /MERCATO|CONTRATT|TRATTATIV|RINNOV|NEGOZI/i;
var MARCATORI_ESCL = '.hub-tag, .fc-squad-list, .neg-wrap, .ut-wrap';
var RX_MODI_ESCL = /^(squadhub|mercato|contratti|cneg)$/i;

var INTESTAZIONI = '.kx-eye, .kx-h1, .kx-sub, .kx-bar, .kx-leg,'
                 + '.kcal-top, .kcal-mnav, .kcal-dows, .kc-legend, .class-head,'
                 + '.fc-welcome,'
                 + '.fmd2-coach, .fmd2-hello, .fmd2-datechip, .fmd2-sec-h,'
                 + '.fm-sq-title, .fm-sq-sub, .fm-dsec-h';
var MAI = '.fc-topbar, .fc-shortcuts, .fc-save-btn, .fm-node, .fm-pitch';

var PANNELLI = [
  { sel:'.fc-sidebar',  cls:'kfm-a-panl' },
  { sel:'.fc-overview', cls:'kfm-a-panl' },
  { sel:'.fc-tiles',    cls:'kfm-a-panl' },
  { sel:'.fc-main',     cls:'kfm-a-panl' },
  { sel:'.fc-right',    cls:'kfm-a-panr' },
  { sel:'.fc-social',   cls:'kfm-a-panr' },
  { sel:'.kx-proj',     cls:'kfm-a-panl' },
  { sel:'.kx-cols',     cls:'kfm-a-panl' },
  { sel:'.fmd2-main',   cls:'kfm-a-panl' },
  { sel:'.fmd2-side',   cls:'kfm-a-panr' },
  { sel:'.fm-pitchwrap',cls:'kfm-a-panl' }
];

var TIPI = [
  { sel:'.kc-cell',                     cls:'kfm-a-cell',  max:42 },
  { sel:'.fc-day',                      cls:'kfm-a-cell',  max:10 },
  { sel:'.fc-menu-item',                cls:'kfm-a-slide', max:11 },
  { sel:'.fc-notif',                    cls:'kfm-a-slide', max:8  },
  { sel:'.fc-obj-i',                    cls:'kfm-a-slide', max:8  },
  { sel:'.fc-comp-row',                 cls:'kfm-a-slide', max:8  },
  { sel:'.fc-bar-item',                 cls:'kfm-a-slide', max:8  },
  { sel:'.fc-vs-row',                   cls:'kfm-a-card',  max:3  },
  { sel:'.fc-tile',                     cls:'kfm-a-card',  max:10 },
  { sel:'.fc-gauge',                    cls:'kfm-a-card',  max:6  },
  { sel:'.fc-donut-wrap',               cls:'kfm-a-card',  max:3  },
  { sel:'.fc-pred',                     cls:'kfm-a-card',  max:3  },
  { sel:'.kx-tr',                       cls:'kfm-a-row',   max:12 },
  { sel:'.kx-tb tbody tr',              cls:'kfm-a-slide', max:12 },
  { sel:'.data-table tbody tr',         cls:'kfm-a-slide', max:12 },
  { sel:'.kx-lb',                       cls:'kfm-a-slide', max:11 },
  { sel:'.kx-pc',                       cls:'kfm-a-card',  max:8  },
  { sel:'.kc-card',                     cls:'kfm-a-card',  max:10 },
  { sel:'.kfm-home-item,.kfm-home-btn', cls:'kfm-a-card',  max:12 },
  { sel:'.kx-cols>.kx-card',            cls:'kfm-a-card',  max:6  },
  { sel:'.fmd2-rk',                     cls:'kfm-a-slide', max:12 },
  { sel:'.fmd2-fact',                   cls:'kfm-a-slide', max:8  },
  { sel:'.fmd2-kb-p',                   cls:'kfm-a-slide', max:4  },
  { sel:'.fmd2-stat',                   cls:'kfm-a-card',  max:6  },
  { sel:'.fmd2-chip',                   cls:'kfm-a-card',  max:6  },
  { sel:'.fmd2-btn',                    cls:'kfm-a-card',  max:6  },
  { sel:'.fmd2-vs-team',                cls:'kfm-a-card',  max:3  },
  { sel:'.fmd2-card',                   cls:'kfm-a-card',  max:6  },
  { sel:'.fm-attr',                     cls:'kfm-a-slide', max:8  },
  { sel:'.fm-pos',                      cls:'kfm-a-slide', max:6  },
  { sel:'.fm-dgrid>div',                cls:'kfm-a-slide', max:8  },
  { sel:'.fm-bcard',                    cls:'kfm-a-card',  max:10 },
  { sel:'.fm-abtn',                     cls:'kfm-a-card',  max:4  },
  { sel:'.fm-tab',                      cls:'kfm-a-card',  max:3  },
  { sel:'.fm-dhead',                    cls:'kfm-a-card',  max:2  }
];

var CLASSI = ['kfm-a-head','kfm-a-cell','kfm-a-slide','kfm-a-card','kfm-a-fade',
              'kfm-a-badge','kfm-a-row','kfm-a-panl','kfm-a-panr','kfm-pre'];

var BARRE = '.kx-tr .bar>i, .fc-bar-f, .pp-h, .pp-d, .pp-a, .fc-gauge-in, .fc-pred-bar>*,'
          + '.fmd2-ph, .fmd2-pd, .fmd2-pw, .fm-attr-fill';

function radice(){
  return document.querySelector('.kx')
      || document.querySelector('.kcal')
      || document.querySelector('#app .fm-squad')
      || document.querySelector('#app .fmd2')
      || document.querySelector('#app .fc-grid')
      || document.querySelector('#app .fc-main')
      || document.querySelector('#app .fc-page')
      || document.querySelector('#app .fc-col');
}

/* Firma della sezione ricavata dal DOM. Lo stato interno del gioco
   non e' raggiungibile, quindi identifico la schermata da cio' che
   e' effettivamente a schermo: classe della radice + occhiello. */
function firma(r){
  if(!r) return '';
  var cl0=(typeof r.className==='string')?r.className.split(' ')[0]:'';
  try{
    var md=document.body.getAttribute('data-mode');
    if(md) return 'M:'+md+'|'+cl0;
  }catch(e){}
  var cl=(typeof r.className==='string')?r.className.split(' ')[0]:'';
  var t='';
  var eye=r.querySelector('.kx-eye');
  if(eye) t=eye.textContent||'';
  if(!t){
    var h=r.querySelector('.kx-h1');
    if(h) t=h.textContent||'';
  }
  if(!t){
    var w=r.querySelector('.fc-welcome, .fc-mgr-name');
    if(w) t=w.textContent||'';
  }
  if(!t && document.querySelector('.kcal')) t='CALENDARIO';
  return cl+'|'+String(t).replace(/\s+/g,' ').trim().slice(0,48);
}

function escluso(r, f){
  try{
    var md=document.body.getAttribute('data-mode');
    if(md && RX_MODI_ESCL.test(md)) return true;
  }catch(e){}
  if(RX_ESCL.test(f)) return true;
  try{ if(r.querySelector && r.querySelector(MARCATORI_ESCL)) return true; }catch(e){}
  return false;
}

function impronta(s){
  if(!s) return '0';
  var n=s.length, passo=n>6000?Math.floor(n/3000):1, h=5381;
  for(var i=0;i<n;i+=passo) h=((h*33)^s.charCodeAt(i))>>>0;
  return h+':'+n;
}

function ripulisci(arr){
  setTimeout(function(){
    for(var i=0;i<arr.length;i++){
      var e=arr[i];
      for(var c=0;c<CLASSI.length;c++) e.classList.remove(CLASSI[c]);
      e.style.removeProperty('--i');
    }
  }, 2400);
}

function avvia(lista, cls, max, base){
  var i, e, off = base || 0;
  var pannello = (cls==='kfm-a-panl' || cls==='kfm-a-panr');
  for(i=0;i<lista.length;i++){
    e=lista[i];
    for(var c=0;c<CLASSI.length;c++) e.classList.remove(CLASSI[c]);
    var idx=i+off;
    e.style.setProperty('--i', idx<max ? idx : max);
    if(!pannello) e.classList.add('kfm-pre');
  }
  if(lista.length) void lista[0].offsetWidth;
  for(i=0;i<lista.length;i++){
    lista[i].classList.remove('kfm-pre');
    lista[i].classList.add(cls);
  }
  ripulisci(Array.prototype.slice.call(lista));
}

function animaPannelli(ambito){
  var n=0, usati=[];
  for(var g=0; g<PANNELLI.length; g++){
    var p=PANNELLI[g], lista=ambito.querySelectorAll(p.sel), gruppo=[];
    for(var i=0;i<lista.length;i++){
      var e=lista[i];
      if(usati.indexOf(e)!==-1) continue;
      if(e.closest && e.closest(MAI)) continue;
      usati.push(e); gruppo.push(e);
    }
    if(!gruppo.length) continue;
    avvia(gruppo, p.cls, 6, n);
    n+=gruppo.length;
  }
  return n;
}

function riempiBarre(ambito){
  var b;
  try{ b=ambito.querySelectorAll(BARRE); }catch(e){ return; }
  for(var i=0;i<b.length;i++){
    var e=b[i], meta=e.style.width;
    if(!meta || meta==='0%' || e.getAttribute('data-kfmbar')) continue;
    e.setAttribute('data-kfmbar','1');
    e.classList.remove('kfm-bar-anim');
    e.style.width='0%';
    (function(el,w,idx){
      setTimeout(function(){
        el.classList.add('kfm-bar-anim');
        el.style.width=w;
        setTimeout(function(){
          el.classList.remove('kfm-bar-anim');
          el.removeAttribute('data-kfmbar');
        },1150);
      }, 190 + Math.min(idx,14)*38);
    })(e, meta, i);
  }
}

function animaBadge(ambito){
  var b;
  try{ b=ambito.querySelectorAll('.kx-pc i'); }catch(e){ return; }
  for(var i=0;i<b.length;i++){
    b[i].classList.remove('kfm-a-badge');
    b[i].style.setProperty('--i', i);
    void b[i].offsetWidth;
    b[i].classList.add('kfm-a-badge');
  }
  ripulisci(Array.prototype.slice.call(b));
}

function dentroAnimato(el, visti, ambito){
  var p=el.parentElement;
  while(p && p!==ambito){
    if(visti.indexOf(p)!==-1) return true;
    p=p.parentElement;
  }
  return false;
}

/* anima gli elementi finali DISCENDENTI di ambito */
function animaFinali(ambito){
  var tot=0, visti=[];
  for(var g=0; g<TIPI.length; g++){
    var tipo=TIPI[g], lista;
    try{ lista=ambito.querySelectorAll(tipo.sel); }catch(e){ continue; }
    if(!lista.length) continue;
    var puliti=[];
    for(var i=0;i<lista.length;i++){
      var e=lista[i];
      if(visti.indexOf(e)!==-1) continue;
      if(e.closest && e.closest(MAI)) continue;
      if(dentroAnimato(e, visti, ambito)) continue;
      visti.push(e); puliti.push(e);
    }
    if(!puliti.length) continue;
    avvia(puliti, tipo.cls, tipo.max, 0);
    tot+=puliti.length;
  }
  riempiBarre(ambito);
  animaBadge(ambito);
  return tot;
}

/* Anima un insieme di blocchi cambiati. Un blocco puo' ESSERE esso
   stesso un elemento finale (le righe giocatore dell'allenamento sono
   figlie dirette della radice): in quel caso va animato lui, non i
   suoi discendenti. Era il secondo bug: querySelectorAll non trova
   mai l'elemento su cui viene chiamato. */
function animaGruppo(elementi){
  var tot=0, usati=[], i, g;
  for(g=0; g<TIPI.length; g++){
    var tipo=TIPI[g], gruppo=[];
    for(i=0;i<elementi.length;i++){
      var e=elementi[i];
      if(usati.indexOf(e)!==-1) continue;
      var ok=false;
      try{ ok = e.matches && e.matches(tipo.sel); }catch(x){ ok=false; }
      if(ok){ usati.push(e); gruppo.push(e); }
    }
    if(gruppo.length){ avvia(gruppo, tipo.cls, tipo.max, 0); tot+=gruppo.length; }
  }
  for(i=0;i<elementi.length;i++){
    if(usati.indexOf(elementi[i])!==-1){ riempiBarre(elementi[i]); continue; }
    tot += animaFinali(elementi[i]);
  }
  return tot;
}

function animaIntestazioni(r){
  var lista=[], d=r.children;
  for(var i=0;i<d.length;i++)
    if(d[i].matches && d[i].matches(INTESTAZIONI)) lista.push(d[i]);
  if(!lista.length){
    var q=r.querySelectorAll(INTESTAZIONI);
    for(var j=0;j<q.length && j<6;j++) lista.push(q[j]);
  }
  if(lista.length) avvia(lista, 'kfm-a-head', 4, 0);
  return lista.length;
}

/* ---------------- motore ---------------- */
var firmaPrec=null, radicePrec=null, impronte={}, bloccoFino=0;
var diag={sezione:'',intest:0,pannelli:0,finali:0,motivo:''};

function contenuti(r){
  var out=[], f=r.children;
  for(var i=0;i<f.length;i++){
    var c=f[i], cl=(typeof c.className==='string')?c.className:'';
    if(c.matches && (c.matches(INTESTAZIONI) || c.matches(MAI))) continue;
    if(/^(H1|H2)$/.test(c.tagName)) continue;
    out.push({el:c, key:(cl||c.tagName)+'#'+i});
  }
  return out;
}

/* Per i giocatori in campo il gioco ha gia' un'animazione sua, curata
   (.fm-squad.anim .fm-pitch .fm-node, fmPop a cascata). Non la
   sostituisco: la riattivo, perche' rispetta il posizionamento
   translate(-50%,-50%) che i miei transform romperebbero. */
function animaCampo(r){
  if(!r || !r.classList || !r.classList.contains('fm-squad')) return 0;
  r.classList.remove('anim');
  void r.offsetWidth;
  r.classList.add('anim');
  var el=r;
  setTimeout(function(){ try{ el.classList.remove('anim'); }catch(e){} }, 1300);
  return 1;
}

function applica(){
  var r=radice();
  if(!r){ diag.motivo='nessuna radice'; return; }
  var f=firma(r);
  diag.sezione=f;

  if(escluso(r,f)){ firmaPrec=f; impronte={}; diag.motivo='sezione esclusa'; return; }

  var bl=contenuti(r), ora={}, i;
  for(i=0;i<bl.length;i++) ora[bl[i].key]=impronta(bl[i].el.innerHTML);

  var adesso=(window.performance&&performance.now)?performance.now():Date.now();

  if(f!==firmaPrec){
    firmaPrec=f;
    radicePrec=r;
    impronte=ora;
    diag.intest=animaIntestazioni(r);
    diag.pannelli=animaPannelli(r);
    diag.finali=animaFinali(r);
    diag.campo=animaCampo(r);
    diag.motivo='cambio sezione';
    bloccoFino=adesso+1000;
    return;
  }

  if(adesso<bloccoFino){
    impronte=ora;
    if(r!==radicePrec){
      /* stessa sezione ma nodo radice diverso: il gioco ha
         renderizzato una seconda volta e ha buttato via gli
         elementi che stavo animando. Le animazioni vanno
         riavviate sul DOM nuovo, altrimenti non si vede nulla.
         Non estendo la finestra di blocco. */
      radicePrec=r;
      diag.intest=animaIntestazioni(r);
      diag.pannelli=animaPannelli(r);
      diag.finali=animaFinali(r);
      diag.campo=animaCampo(r);
      diag.motivo='ricostruzione dopo cambio sezione';
      return;
    }
    diag.motivo='bloccato';
    return;
  }
  radicePrec=r;

  var cambiati=[];
  for(i=0;i<bl.length;i++)
    if(impronte[bl[i].key]!==ora[bl[i].key]) cambiati.push(bl[i].el);
  impronte=ora;
  if(!cambiati.length){ diag.motivo='nulla cambiato'; return; }

  var animati=animaGruppo(cambiati);
  diag.finali=animati;
  diag.motivo='aggiornamento interno';

  if(!animati){
    for(i=0;i<cambiati.length;i++){
      var h=cambiati[i].getBoundingClientRect().height;
      if(h>0 && h<window.innerHeight*0.5) avvia([cambiati[i]], 'kfm-a-fade', 0, 0);
    }
  }
  bloccoFino=adesso+420;
}

function scroller(){
  var c=[document.querySelector('#app .fc-page'),
         document.querySelector('#app .fc-col'),
         document.getElementById('app')];
  for(var i=0;i<c.length;i++)
    if(c[i] && c[i].scrollHeight > c[i].clientHeight+4) return c[i];
  return null;
}

window.__kfmDiag=function(){ return diag; };

var prec=window.render;
if(typeof prec==='function'){
  window.render=function(){
    var top=0, rPrima=null;
    try{ var sc=scroller(); if(sc) top=sc.scrollTop; }catch(e){}
    try{ rPrima=radice(); }catch(e){}
    var stessa=false;
    try{ stessa = (rPrima && firma(rPrima)===firmaPrec); }catch(e){}
    var out=prec.apply(this,arguments);
    try{ if(stessa && top>0){ var s2=scroller(); if(s2) s2.scrollTop=top; } }catch(e){}
    try{ applica(); }catch(e){}
    return out;
  };
  window.__kfmWrapped=true;
}

if(document.readyState==='loading')
  document.addEventListener('DOMContentLoaded', function(){ try{ applica(); }catch(e){} });
else { try{ applica(); }catch(e){} }
})();
