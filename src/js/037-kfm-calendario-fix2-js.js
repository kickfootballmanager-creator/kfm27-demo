
/* Il calendario stava dentro un contenitore a scorrimento bloccato:
   allungare le celle non bastava, l'ultima settimana finiva fuori.
   Qui apro lo scorrimento e tolgo i riquadri neri intorno ai giorni. */
(function(){
'use strict';
var st=document.createElement('style');
st.id='kfm-calendario-fix2';
st.textContent=
  '.fc-col{overflow-y:auto!important;overflow-x:hidden!important}'+
  '.fc-page{overflow:visible!important;height:auto!important;min-height:0!important}'+
  '.cal-layout{height:auto!important;align-items:start!important}'+
  '.cal-main{height:auto!important;overflow:visible!important}'+
  '.cal-grid{flex:none!important;grid-auto-rows:minmax(76px,auto)!important;align-content:start!important;gap:6px!important}'+
  /* niente cornici nere: solo un fondo appena accennato */
  '.cal-cell{min-height:76px!important;overflow:visible!important;display:flex!important;'+
    'flex-direction:column!important;border:0!important;outline:0!important;box-shadow:none!important;'+
    'background:rgba(255,255,255,.045)!important;border-radius:10px!important}'+
  '.cal-cell.empty{background:transparent!important}'+
  '.cal-cell.today{outline:2px solid rgba(255,255,255,.85)!important;outline-offset:-2px!important}'+
  '.cal-ev{position:static!important;margin-top:auto!important}'+
  '.cal-ev span{font-size:11px!important;line-height:1.15!important}'+
  '.cal-ev small{font-size:9px!important}'+
  '.cal-ev img{width:18px!important;height:18px!important}'+
  '@media(max-width:760px){.cal-grid{grid-auto-rows:minmax(58px,auto)!important;gap:4px!important}'+
    '.cal-cell{min-height:58px!important;padding:4px!important}'+
    '.cal-ev small{display:none!important}.cal-ev span{font-size:9px!important}}';
document.head.appendChild(st);
})();
