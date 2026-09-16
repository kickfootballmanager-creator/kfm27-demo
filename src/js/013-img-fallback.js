
/* ============================================================================
   IMMAGINI: PERCHE' "UNA VOLTA SI E DUE NO"
   Nel gioco ci sono 114 immagini con un gestore d'errore scritto nel tag, del
   tipo onerror="this.remove()" oppure onerror="kfmFaceAvp(this)". Basta che il CDN
   scarti UNA richiesta - e lo fa spesso, perche' una schermata ne chiede anche
   trenta insieme - e quel volto o quello stemma sparisce per sempre, finche'
   non si ridisegna la schermata. Da qui l'alternanza.
   Qui si fanno due cose:
     1) l'errore viene intercettato PRIMA che il gestore inline possa agire,
        cosi' l'immagine non viene ne' rimossa ne' sostituita al primo colpo;
     2) le richieste passano da una coda che ne tiene al massimo sei in volo,
        con tre tentativi ciascuna: e' la concorrenza a far cadere le richieste.
   Il gestore inline resta come ultima spiaggia: viene lasciato passare solo
   quando anche i tentativi sono finiti.
   ========================================================================== */
(function(){
  var TARGET=/cmtracker\.fra1\.cdn\.digitaloceanspaces\.com\/|images\.fifaindex\.com\/|tmssl\.akamaized\.net\/|cdn\.sofifa\.net\/(players|teams)\//i;
  /* i loghi dei campionati (cdn.sofifa.net/meta/league) funzionano gia': restano fuori */
  var MAXCONC=6, MAXTRY=3;
  var host=(location&&location.hostname)||'';
  var onNetlify=/netlify\.(app|com)$/i.test(host);
  var onVercel=/vercel\.(app|com)$/i.test(host);
  var bare=function(u){ return u.replace(/^https?:\/\//,''); };
  function kindOf(u){ return /\/teams\/|tmssl\./i.test(u)?'team':'face'; }

  /* fcratings usa lo stesso id di fifaindex e un indirizzo costruibile
     (niente hash nel nome file): e' la prima alternativa da provare */
  function fcr(u){
    var m=u.match(/\/heads\/p(\d+)\.png/i) || u.match(/\/players\/(\d+)\.webp/i) || u.match(/\/players\/(\d+)\./i);
    if(m) return 'https://www.fcratings.com/assets/images/post/'+m[1]+'.png';
    return '';
  }
  /* vie alternative, provate solo dopo i tentativi diretti */
  function bridges(u){
    var b=[];
    var alt=fcr(u);
    if(alt) b.push(alt);                       /* fonte diretta alternativa */
    if(onNetlify) b.push('/.netlify/images?url='+encodeURIComponent(u)+'&w=160');
    if(onVercel)  b.push('/_vercel/image?url='+encodeURIComponent(u)+'&w=128&q=80');
    b.push('https://images.weserv.nl/?url='+encodeURIComponent(bare(u)));
    b.push('https://wsrv.nl/?url='+encodeURIComponent(bare(u)));
    b.push('https://api.allorigins.win/raw?url='+encodeURIComponent(u));
    b.push('https://api.codetabs.com/v1/proxy/?quest='+encodeURIComponent(u));
    return b;
  }
  var WIN={face:-1,team:-1};                 /* via alternativa che ha funzionato */

  /* ------------------------------------------------------------- la coda */
  var q=[], live=0;
  function enqueue(img){
    if(img.__q) return;
    img.__q=1;
    q.push(img);
    pump();
  }
  function pump(){
    while(live<MAXCONC && q.length){
      var img=q.shift();
      if(!img.isConnected){ continue; }
      live++;
      start(img);
    }
  }
  function done(img){
    if(img.__live){ img.__live=0; live=Math.max(0,live-1); pump(); }
  }
  function start(img){
    img.__live=1;
    var src=img.getAttribute('data-osrc')||img.__src||img.getAttribute('src')||'';
    img.__src=src;
    img.setAttribute('data-osrc',src);
    img.__try=(img.__try||0)+1;
    img.src=src+(img.__try>1?((src.indexOf('?')<0?'?':'&')+'rt='+img.__try):'');
  }

  /* un solo ascoltatore per immagine, per sapere quando ha finito */
  function watch(img){
    if(img.__w) return;
    img.__w=1;
    img.addEventListener('load',function(){ img.__ok=1; done(img); });
  }

  /* --------------------------------------------------- gestione dell'errore */
  document.addEventListener('error',function(e){
    var img=e.target;
    if(!img||img.tagName!=='IMG') return;
    var src=(img.getAttribute('data-osrc')||img.getAttribute('src')||'').replace(/[?&]rt=\d+$/,'');
    if(!TARGET.test(src)) return;              /* bandiere, avatar, loghi lega: non tocchiamo */
    if(img.__giveup) return;                   /* finiti i tentativi: passi pure il gestore inline */

    /* qui sta il punto: si blocca il gestore scritto nel tag, che altrimenti
       cancellerebbe l'immagine al primo errore */
    e.stopImmediatePropagation();
    e.preventDefault();

    img.__try=img.__try||1;
    if(img.__try<MAXTRY){
      done(img);
      setTimeout(function(){ enqueueRetry(img); }, 220*img.__try+Math.random()*260);
      return;
    }
    /* tentativi diretti esauriti: si prova la via alternativa imparata */
    var k=kindOf(src), list=bridges(src), n=(img.__b==null?(WIN[k]>=0?WIN[k]:0):img.__b+1);
    if(n<list.length){
      img.__b=n;
      watch(img);
      img.addEventListener('load',function ok(){
        img.removeEventListener('load',ok);
        if(img.naturalWidth>0&&WIN[k]!==n) WIN[k]=n;
      });
      img.src=list[n];
      return;
    }
    img.__giveup=1;
    done(img);
    /* ultimo tentativo fallito: ora il gestore originale puo' fare il suo lavoro */
    try{ img.src=src; }catch(e2){}
  },true);

  function enqueueRetry(img){
    img.__q=0;
    enqueue(img);
  }

  /* ------------------------------------------- presa in carico delle immagini */
  function adopt(img){
    if(!img||img.tagName!=='IMG'||img.__q!=null) return;
    var src=img.getAttribute('src')||'';
    if(!TARGET.test(src)) return;
    watch(img);
    if(img.complete&&img.naturalWidth>0){ img.__ok=1; return; }   /* gia' caricata */
    /* si toglie il carico immediato e si passa dalla coda */
    img.__src=src;
    img.setAttribute('data-osrc',src);
    img.removeAttribute('src');
    enqueue(img);
  }
  function sweep(){
    var im=document.getElementsByTagName('img');
    for(var i=0;i<im.length;i++) adopt(im[i]);
  }
  try{
    var mo=new MutationObserver(function(m){
      for(var i=0;i<m.length;i++){
        var ad=m[i].addedNodes;
        for(var j=0;j<ad.length;j++){
          var n=ad[j]; if(n.nodeType!==1) continue;
          if(n.tagName==='IMG') adopt(n);
          else if(n.getElementsByTagName){
            var im=n.getElementsByTagName('img');
            for(var k=0;k<im.length;k++) adopt(im[k]);
          }
        }
      }
    });
    function go(){ if(document.body){ mo.observe(document.body,{childList:true,subtree:true}); sweep(); } }
    if(document.body) go(); else document.addEventListener('DOMContentLoaded',go);
  }catch(e){}

  window.imgDiag=function(){
    console.log('host:',host,'| in coda:',q.length,'| in volo:',live,
                '| via alternativa volti:',WIN.face,'stemmi:',WIN.team);
    var im=document.getElementsByTagName('img'), tot=0, ko=0;
    for(var i=0;i<im.length;i++){
      var s=im[i].getAttribute('data-osrc')||im[i].getAttribute('src')||'';
      if(!TARGET.test(s)) continue;
      tot++;
      if(!(im[i].complete&&im[i].naturalWidth>0)) ko++;
    }
    console.log('immagini gestite in pagina:',tot,'| non ancora caricate:',ko);
    return {totali:tot,mancanti:ko,coda:q.length,inVolo:live};
  };
})();
