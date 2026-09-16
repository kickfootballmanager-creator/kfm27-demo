
/* KFM27 - pipeline minifaces: 4 sorgenti, memoria della sorgente valida, riprova con attesa, freno alle richieste */
(function(){
  var CK='KFM_FACE_SRC_V2';
  var MEM={};
  try{ var raw=localStorage.getItem(CK); if(raw) MEM=JSON.parse(raw)||{}; }catch(e){ MEM={}; }
  var dirty=false;
  function flush(){ if(!dirty) return; dirty=false; try{ localStorage.setItem(CK, JSON.stringify(MEM)); }catch(e){} }
  setInterval(flush, 4000);

  function pad6(p){ return p.length<6 ? ('000000'+p).slice(-6) : p; }
  var SRC=[
    function(p){ return 'https://cmtracker.fra1.cdn.digitaloceanspaces.com/DB/26/heads/p'+p+'.png'; },
    function(p){ return 'https://assets.easysbc.io/fc26/players/'+p+'.png?v5'; },
    function(p){ return 'https://cdn.fifacm.com/content/media/imgs/fc26/players/p'+p+'.png?v=26'; },
    function(p){ return 'https://cdn.futbin.com/content/fifa26/img/players/'+p+'.png'; }
  ];
  function pidOf(src){
    var s=String(src||''), m;
    m=/\/heads\/p(\d+)\.png/.exec(s);                       if(m) return m[1];
    m=/easysbc\.io\/fc26\/players\/(\d+)\.png/.exec(s);     if(m) return m[1];
    m=/fifacm\.com\/content\/media\/imgs\/fc26\/players\/p(\d+)\.png/.exec(s); if(m) return m[1];
    m=/futbin\.com\/content\/fifa26\/img\/players\/(\d+)/.exec(s); if(m) return m[1];
    return '';
  }
  function stageOf(src){
    var s=String(src||'');
    if(s.indexOf('/heads/p')>=0) return 0;
    if(s.indexOf('easysbc.io')>=0) return 1;
    if(s.indexOf('fifacm.com')>=0 && s.indexOf('notfound')<0) return 2;
    if(s.indexOf('futbin.com')>=0) return 3;
    return -1;
  }
  function known(p){ var v=MEM[p]; return (typeof v==='number' && v>=0 && v<SRC.length) ? v : -1; }
  function urlFor(p){ var k=known(p); return SRC[k<0?0:k](p); }

  /* ---- freno: non piu' di N minifaces in volo insieme (evita il blocco dei CDN) ---- */
  var MAX=24, live=0, waiting=[];
  function pump(){
    while(live<MAX && waiting.length){
      var j=waiting.shift();
      if(!j.img || !j.img.isConnected) continue;
      start(j.img, j.url);
    }
  }
  function start(img,url){
    live++;
    img.setAttribute('data-fl','1');
    if(img._kfmT) clearTimeout(img._kfmT);
    img._kfmT=setTimeout(function(){
      /* passata l'attesa cambio sorgente, ma segno che e' stata solo lentezza:
         la sorgente resta valida e non va dimenticata */
      done(img);
      try{
        if(img.isConnected && !(img.naturalWidth>0)){
          img.setAttribute('data-slow','1');
          window.kfmFaceErr(img);
        }
      }catch(e){}
    }, 3400);
    img.src=url;
  }
  function load(img,url){
    if(!img) return;
    img.setAttribute('data-fw','1');
    if(live<MAX) start(img,url);
    else waiting.push({img:img,url:url});
  }
  function done(img){
    if(img && img.getAttribute('data-fl')==='1'){
      img.removeAttribute('data-fl');
      if(img._kfmT){ clearTimeout(img._kfmT); img._kfmT=0; }
      live=Math.max(0,live-1);
      pump();
    }
  }
  /* guardiano: ricalcolo quante immagini sono davvero in volo, cosi' la coda non si blocca mai */
  setInterval(function(){
    var im=document.images, n=0, i;
    for(i=0;i<im.length;i++) if(im[i].getAttribute('data-fl')==='1') n++;
    if(live!==n) live=n;
    if(waiting.length) pump();
  }, 1100);

  /* ---- esito dei caricamenti ---- */
  document.addEventListener('load', function(ev){
    var t=ev&&ev.target;
    if(!t||t.tagName!=='IMG') return;
    if(t.closest && t.closest('#kfm-dbe')) return;
    done(t);
    var p=pidOf(t.getAttribute('src')||''), st=stageOf(t.getAttribute('src')||'');
    if(!p||st<0) return;
    t.style.visibility='';
    t.removeAttribute('data-rt');
    if(MEM[p]!==st){ MEM[p]=st; dirty=true; }
  }, true);

  window.kfmFaceErr=function(img){
    if(!img) return;
    try{
      img.alt='';
      done(img);
      var src=img.getAttribute('src')||'';
      var p=pidOf(src);
      if(!p) return;
      var st=stageOf(src);
      var next=st+1;
      if(img.getAttribute('data-slow')==='1'){ img.removeAttribute('data-slow'); }
      else if(MEM[p]===st){ delete MEM[p]; dirty=true; }
      if(next<SRC.length){ load(img, SRC[next](p)); return; }
      /* tutte le sorgenti hanno risposto male: molto spesso e' un blocco temporaneo, riprovo con attesa */
      var r=parseInt(img.getAttribute('data-rt')||'0',10);
      if(r<1){
        img.setAttribute('data-rt', String(r+1));
        setTimeout(function(){
          if(img.isConnected) load(img, SRC[0](p)+'?r='+(r+1));
        }, 600);
        return;
      }
      /* questo giocatore non ha una foto su nessun sito */
      img.style.visibility='';
      img.style.display='';
      img.src='https://www.fifacm.com/content/media/imgs/fc26/players/notfound_0.png';
    }catch(e){}
  };
  document.addEventListener('error', function(ev){
    var t=ev&&ev.target;
    if(!t||t.tagName!=='IMG') return;
    if(t.closest && t.closest('#kfm-dbe')) return;
    if(!pidOf(t.getAttribute('src')||'')) return;
    window.kfmFaceErr(t);
  }, true);

  /* ---- le nuove immagini partono subito dalla sorgente giusta ---- */
  if(typeof window.getFace==='function'){
    var gf=window.getFace;
    window.getFace=function(id,n){
      var u=gf.apply(this,arguments);
      var p=pidOf(u);
      if(p && known(p)>0) return urlFor(p);
      return u;
    };
  }

  /* ---- passata periodica: sorgente memorizzata, caricamento pigro, ripristino ---- */
  function sweep(){
    var im=document.images, i, el, src, p, k;
    for(i=0;i<im.length;i++){
      el=im[i];
      try{
        if(el.closest && el.closest('#kfm-dbe')) continue;
        src=el.getAttribute('src')||'';
        if(!src){
          if(el.getAttribute('data-fw')==='1') continue;
          continue;
        }
        p=pidOf(src);
        if(!p) continue;
        if(!el.getAttribute('decoding')) el.setAttribute('decoding','async');
        k=known(p);
        if(k>0 && stageOf(src)!==k && !el.complete){ el.src=SRC[k](p); continue; }
        if(el.complete && el.naturalWidth>0 && el.style.visibility==='hidden') el.style.visibility='';
        if(el.complete && el.naturalWidth===0 && !el.getAttribute('data-rt') && !el.getAttribute('data-fl')){
          window.kfmFaceErr(el);
        }
      }catch(e){}
    }
    flush();
  }
  setInterval(sweep, 900);

  /* sorveglianza: una foto che risponde AccessDenied resta vuota senza avvisare,
     quindi la riconosco dal fatto che non ha dimensioni e cambio sorgente */
  setInterval(function(){
    var im=document.images, i, el, src;
    for(i=0;i<im.length;i++){
      el=im[i];
      try{
        if(el.closest && el.closest('#kfm-dbe')) continue;
        src=el.getAttribute('src')||'';
        if(!src || !pidOf(src)) continue;
        if(!el.complete || el.naturalWidth>0) continue;
        if(el.getAttribute('data-fbs')===src) continue;
        el.setAttribute('data-fbs', src);
        window.kfmFaceErr(el);
      }catch(e){}
    }
  }, 1500);

  /* usata dalle schermate carriera: prima provo le altre sorgenti,
     solo se falliscono tutte metto l'immagine segnaposto */
  window.kfmFaceAvp=function(img){
    try{
      if(img.getAttribute('data-avx')!=='1'){
        var before=img.getAttribute('src')||'';
        try{ window.kfmFaceErr(img); }catch(e){}
        var after=img.getAttribute('src')||'';
        if(after && after!==before) return;
        img.setAttribute('data-avx','1');
      }
    }catch(e){}
    try{
      img.style.visibility='';
      img.src='https://www.fifacm.com/content/media/imgs/fc26/players/notfound_0.png';
    }catch(e){}
  };

  window.KFMFACE={mem:MEM, url:urlFor, sources:SRC.length,
    reset:function(){ MEM={}; dirty=true; flush(); }};
})();
