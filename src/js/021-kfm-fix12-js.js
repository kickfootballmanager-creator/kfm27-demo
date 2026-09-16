
(function(){
  window.kfmOpenUT=function(){
    var t0=Date.now();
    (function go(){
      try{
        if(typeof window.openUltimateTeam==='function'){
          window.openUltimateTeam();
          var r=document.getElementById('ut-root');
          if(r&&!r.classList.contains('on')) r.classList.add('on');
          try{ var a=document.getElementById('app'); if(a) a.innerHTML=''; }catch(e){}
          return;
        }
      }catch(e){}
      if(Date.now()-t0<5000) setTimeout(go,60);
    })();
  };
  /* se il gioco base torna alla vecchia home, si apre la schermata modalita' KFM27 */
  document.addEventListener('click',function(ev){
    var b=ev.target&&ev.target.closest&&ev.target.closest('.home-play,.home-hero .home-play');
    if(b){
      ev.preventDefault(); ev.stopPropagation();
      if(typeof window.kfmHome==='function') window.kfmHome();
      else if(typeof goChoice==='function') goChoice();
    }
  },true);
})();
