
/* =====================================================================
   Tabellone dei playoff, visibile sempre: anche se alleni in Serie A
   puoi guardare come sono andati quelli di Serie C o dei gironi di D.
   Legge quello che il motore salva a fine stagione in S.poStore
   (Serie B e Serie C) e in S.poStoreD (gironi di Serie D).
   Si apre dal pulsante in Classifica o con il tasto P.
   ===================================================================== */
(function(){
'use strict';

var st=document.createElement('style');
st.id='kfm-po-css';
st.textContent=
 '#kfm-po{position:fixed;inset:0;z-index:99998;background:rgba(4,10,18,.94);backdrop-filter:blur(6px);'+
   'overflow:auto;padding:26px clamp(12px,3vw,40px) 60px;color:#dce7f4;font:13px/1.5 Inter,system-ui,sans-serif}'+
 '#kfm-po h2{font-family:Anton,Oswald,sans-serif;font-size:clamp(22px,3vw,34px);margin:0 0 4px;color:#fff}'+
 '#kfm-po .po-sub{color:#8ea3ba;margin:0 0 20px}'+
 '#kfm-po .po-tabs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px}'+
 '#kfm-po .po-tab{padding:8px 14px;border-radius:999px;border:1px solid #23384f;background:#101d2c;'+
   'cursor:pointer;font-weight:600;font-size:12px;white-space:nowrap}'+
 '#kfm-po .po-tab.on{background:#4ea1ff;border-color:#4ea1ff;color:#04101d}'+
 '#kfm-po .po-rounds{display:flex;gap:18px;align-items:flex-start;overflow-x:auto;padding-bottom:14px}'+
 '#kfm-po .po-col{min-width:230px;flex:0 0 auto}'+
 '#kfm-po .po-h{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#8ea3ba;margin-bottom:10px}'+
 '#kfm-po .po-m{background:#0e1a28;border:1px solid #1e3047;border-radius:10px;padding:8px 10px;margin-bottom:10px}'+
 '#kfm-po .po-t{display:flex;align-items:center;gap:8px;padding:3px 0}'+
 '#kfm-po .po-t img{width:20px;height:20px;object-fit:contain;flex:none}'+
 '#kfm-po .po-t.win{font-weight:800;color:#fff}'+
 '#kfm-po .po-t.lose{opacity:.5}'+
 '#kfm-po .po-t.me{color:#3ddc8b}'+
 '#kfm-po .po-win{margin-top:16px;padding:14px 16px;border-radius:12px;background:linear-gradient(135deg,#14532d,#0d3320);'+
   'display:flex;align-items:center;gap:12px;font-weight:800;font-size:16px;color:#eafff2}'+
 '#kfm-po .po-win img{width:34px;height:34px;object-fit:contain}'+
 '#kfm-po .po-close{position:absolute;top:18px;right:22px;background:#132234;border:1px solid #23384f;'+
   'color:#dce7f4;border-radius:999px;padding:9px 16px;cursor:pointer;font-weight:600}'+
 '#kfm-po .po-empty{color:#8ea3ba;padding:30px 0}';
document.head.appendChild(st);

function crest(n){
  try{ if(typeof clubLogo==='function'){ var u=clubLogo(n); if(u) return u; } }catch(e){}
  try{ if(typeof getLogo==='function' && typeof EADB!=='undefined' && EADB[n]) return getLogo(EADB[n].tid,n); }catch(e){}
  return '';
}
function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;'); }
function riga(nome,vinta){
  var mia = (typeof S!=='undefined' && S && nome===S.teamName);
  var c='po-t'+(vinta===true?' win':vinta===false?' lose':'')+(mia?' me':'');
  var u=crest(nome);
  return '<div class="'+c+'">'+(u?'<img src="'+esc(u)+'" onerror="this.style.visibility=\'hidden\'">':'<span style="width:20px"></span>')+
         '<span>'+esc(nome||'—')+'</span></div>';
}

/* raccolgo tutti i tabelloni disponibili */
function tabelloni(){
  var out=[];
  try{
    var P=(typeof S!=='undefined'&&S&&S.poStore)||{};
    for(var k in P){
      var b=P[k]; if(!b) continue;
      out.push({ id:'po-'+k, nome:(k==='SerieC'?'Serie C · Playoff promozione':k==='SerieB'?'Serie B · Playoff promozione':k),
                 rounds:b.rounds||[], winner:b.winner });
    }
  }catch(e){}
  /* promosse e retrocesse dell'ultima stagione */
  try{
    var M=(typeof S!=='undefined'&&S&&S._movimenti)||null;
    out.push({ id:'po-mov', nome:'Promosse e retrocesse',
               movimenti:M||{stagione:'', su:[], giu:[]} });
  }catch(e){}
  try{
    var D=(typeof S!=='undefined'&&S&&S.poStoreD)||{};
    for(var g in D){
      var d=D[g]; if(!d) continue;
      var m=[];
      if(d.preliminare) m.push({h:'Preliminare', m:[{a:d.preliminare[0],b:d.preliminare[1]}]});
      if(d.semifinale)  m.push({h:'Semifinale',  m:[{a:d.semifinale,b:'vincente preliminare'}]});
      if(d.finale)      m.push({h:'Finale',      m:[{a:d.finale,b:'vincente semifinale'}]});
      out.push({ id:'po-'+g, nome:g+' · Playoff', rounds:m, winner:d.vincitore,
                 nota:'In Serie D i playoff non promuovono: servono per la graduatoria dei ripescaggi.' });
    }
  }catch(e){}
  return out;
}

var attivo=0;
function disegna(){
  var box=document.getElementById('kfm-po'); if(!box) return;
  var T=tabelloni();
  var tabs=T.map(function(t,i){ return '<div class="po-tab'+(i===attivo?' on':'')+'" onclick="kfmPlayoffTab('+i+')">'+esc(t.nome)+'</div>'; }).join('');
  var corpo='';
  if(!T.length){
    corpo='<div class="po-empty">Nessun tabellone disponibile: i playoff si giocano a fine stagione. '+
          'Torna qui dopo l\u2019ultima giornata.</div>';
  } else {
    var t=T[Math.min(attivo,T.length-1)];
    if(t.movimenti){
      var M=t.movimenti;
      function elenco(titolo,arr,colore){
        if(!arr||!arr.length) return '';
        return '<div class="po-col" style="min-width:280px"><div class="po-h" style="color:'+colore+'">'+
          esc(titolo)+' \u00b7 '+arr.length+'</div>'+
          arr.map(function(r){
            return '<div class="po-m">'+riga(r.club,null)+
              '<div style="font-size:11px;color:#8ea3ba;padding-left:28px">'+
              esc(r.da||'?')+' \u2192 '+esc(r.a||'?')+'</div></div>';
          }).join('')+'</div>';
      }
      var vuoto=!((M.su&&M.su.length)||(M.giu&&M.giu.length));
      corpo=vuoto
        ? '<div class="po-empty">I movimenti si decidono a fine stagione: promozioni, retrocessioni e playoff compaiono qui dopo l\u2019ultima giornata.</div>'
        : '<p class="po-sub">Stagione '+esc(M.stagione||'')+'</p><div class="po-rounds">'+
          elenco('Promosse',M.su,'#3ddc8b')+elenco('Retrocesse',M.giu,'#ff7a8a')+'</div>';
      var box2=document.getElementById('kfm-po');
      box2.innerHTML='<button class="po-close" onclick="kfmPlayoffChiudi()">Chiudi</button>'+
        '<h2>Tabellone playoff</h2><p class="po-sub">Puoi seguirli anche se non ti riguardano.</p>'+
        '<div class="po-tabs">'+tabs+'</div>'+corpo;
      return;
    }
    corpo=(t.nota?'<p class="po-sub">'+esc(t.nota)+'</p>':'')+
      '<div class="po-rounds">'+(t.rounds||[]).map(function(r){
        return '<div class="po-col"><div class="po-h">'+esc(r.h)+'</div>'+
          (r.m||[]).map(function(m){
            var wa=(m.w!=null)?(m.w===m.a):null, wb=(m.w!=null)?(m.w===m.b):null;
            return '<div class="po-m">'+riga(m.a,wa)+riga(m.b,wb)+'</div>';
          }).join('')+'</div>';
      }).join('')+'</div>'+
      (t.winner?'<div class="po-win">'+(crest(t.winner)?'<img src="'+esc(crest(t.winner))+'">':'')+
        '<span>'+esc(t.winner)+' \u2014 vincitrice</span></div>':'');
  }
  box.innerHTML='<button class="po-close" onclick="kfmPlayoffChiudi()">Chiudi</button>'+
    '<h2>Tabellone playoff</h2>'+
    '<p class="po-sub">Puoi seguirli anche se non ti riguardano.</p>'+
    '<div class="po-tabs">'+tabs+'</div>'+corpo;
}
window.kfmPlayoffTab=function(i){ attivo=i; disegna(); };
window.kfmPlayoffChiudi=function(){ var b=document.getElementById('kfm-po'); if(b) b.remove(); };
window.kfmPlayoff=function(){
  if(document.getElementById('kfm-po')) return;
  var b=document.createElement('div'); b.id='kfm-po';
  document.body.appendChild(b); attivo=0; disegna();
};

document.addEventListener('keydown',function(e){
  var t=document.activeElement && /^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName);
  if(!t && (e.key==='p'||e.key==='P') && !e.metaKey && !e.ctrlKey){ e.preventDefault(); window.kfmPlayoff(); }
});

/* pulsante dentro la Classifica */
function bottone(){
  /* v125: pill flottante rimossa su richiesta */
  try{ var _o=document.getElementById('kfm-po-btn'); if(_o&&_o.parentNode) _o.parentNode.removeChild(_o); }catch(e){}
  return;
  try{
    if(typeof S==='undefined'||!S||S.mode!=='class') return;
    var app=document.getElementById('app'); if(!app) return;
    if(app.querySelector('#kfm-po-btn')) return;
    var h=app.querySelector('.fc-page')||app.firstElementChild; if(!h) return;
    var b=document.createElement('button');
    b.id='kfm-po-btn'; b.textContent='Tabellone playoff';
    b.style.cssText='margin:10px 0 0;padding:9px 16px;border-radius:999px;border:1px solid #23384f;'+
      'background:#132234;color:#dce7f4;font-weight:600;cursor:pointer';
    b.onclick=window.kfmPlayoff;
    h.appendChild(b);
  }catch(e){}
}
var _r=window.render;
if(typeof _r==='function'){
  window.render=function(){ var x=_r.apply(this,arguments); setTimeout(bottone,0); return x; };
}
})();
