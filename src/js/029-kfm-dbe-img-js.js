
/* KFM27 - caricamento immagini dell'editor: poche alla volta e solo quelle in vista */
(function(){
  var MAX=5, live=0, Q=[];
  var KEY='KFM_DBE_IMG_V1', MEM={}, dirty=false;
  try{ MEM=JSON.parse(localStorage.getItem(KEY)||'{}')||{}; }catch(e){}
  setInterval(function(){
    if(!dirty) return; dirty=false;
    try{ localStorage.setItem(KEY, JSON.stringify(MEM)); }catch(e){}
  }, 4000);

  function urls(img){ return (img.getAttribute('data-u')||'').split('||').filter(Boolean); }

  function initials(img){
    if(img.getAttribute('data-ko')) return;
    img.setAttribute('data-ko','1');
    img.style.display='none';
    var w=img.parentNode;
    if(w && !w.getAttribute('data-ini')){
      w.setAttribute('data-ini','1');
      var sp=document.createElement('span');
      sp.className='dbe-ini';
      sp.textContent=(img.getAttribute('data-ln')||'?');
      w.appendChild(sp);
    }
  }

  function release(img){
    if(img._kd){ clearTimeout(img._kd); img._kd=0; }
    img.onload=null; img.onerror=null;
    if(img.getAttribute('data-kb')==='1'){
      img.removeAttribute('data-kb');
      live=Math.max(0,live-1);
    }
    pump();
  }

  function attempt(img,i){
    var l=urls(img), ky=img.getAttribute('data-ky')||'';
    while(i<l.length && !l[i]) i++;
    if(i>=l.length){
      if(ky){ delete MEM[ky]; dirty=true; }
      img.onload=null; img.onerror=null;
      if(ky.charAt(0)==='p'){
        /* foto inesistente: uso l'immagine ufficiale "non trovato" */
        img.style.visibility=''; img.style.display='';
        img.src='https://www.fifacm.com/content/media/imgs/fc26/players/notfound_0.png';
        release(img); return;
      }
      try{ img.removeAttribute('src'); }catch(e){}
      initials(img); release(img); return;
    }
    img.setAttribute('data-i', String(i));
    img.onload=function(){
      if(ky && MEM[ky]!==i){ MEM[ky]=i; dirty=true; }
      img.style.display=''; img.style.visibility='';
      /* passo al gioco la sorgente valida per quel giocatore */
      try{
        if(ky.charAt(0)==='p'){
          var pd=ky.slice(2);
          var ovr=window.KFMDB && window.KFMDB.data && window.KFMDB.data.f[pd];
          if(!ovr && window.KFMFACE && window.KFMFACE.mem) window.KFMFACE.mem[pd]=i;
        }
      }catch(e){}
      release(img);
    };
    img.onerror=function(){
      if(img._kd){ clearTimeout(img._kd); img._kd=0; }
      attempt(img, i+1);
    };
    if(img._kd) clearTimeout(img._kd);
    img._kd=setTimeout(function(){ img._kd=0; attempt(img, i+1); }, 1300);
    /* tengo l'immagine invisibile finche' non arriva: cosi' non si vede l'icona rotta */
    img.style.visibility='hidden';
    img.src=l[i];
  }

  function begin(img){
    if(!img.isConnected) return;
    img.setAttribute('data-kb','1'); live++;
    var ky=img.getAttribute('data-ky')||'', st=0, l=urls(img);
    if(ky && MEM[ky]!=null) st=MEM[ky]|0;
    if(st<0 || st>=l.length) st=0;
    attempt(img, st);
  }

  function pump(){
    while(live<MAX && Q.length){
      var img=Q.shift();
      if(!img || !img.isConnected) continue;
      if(img.getAttribute('data-kq')!=='1') continue;
      img.setAttribute('data-kq','2');
      begin(img);
    }
  }

  function inView(el){
    var r=el.getBoundingClientRect();
    /* un'immagine ancora senza indirizzo misura 0x0: guardo la sua casella */
    if(!r.width && !r.height){
      var p=el.parentNode;
      for(var k=0; k<3 && p && p.getBoundingClientRect; k++){
        r=p.getBoundingClientRect();
        if(r.width || r.height) break;
        p=p.parentNode;
      }
      if(!r.width && !r.height) return false;
    }
    var h=window.innerHeight||800;
    return r.bottom>-280 && r.top<h+280;
  }

  function scan(){
    var root=document.getElementById('kfm-dbe');
    if(!root || !root.classList.contains('on')) return;
    var im=root.querySelectorAll('img[data-lz]'), i, el;
    for(i=0;i<im.length;i++){
      el=im[i];
      if(el.getAttribute('data-kq')) continue;
      if(!inView(el)) continue;
      el.setAttribute('data-kq','1');
      Q.push(el);
    }
    /* il numero di immagini in corso viene ricontato dalla pagina:
       cosi' la coda non puo' restare bloccata come prima */
    var n=root.querySelectorAll('img[data-kb="1"]').length;
    if(live!==n) live=n;
    pump();
  }

  function scanAll(){
    var root=document.getElementById('kfm-dbe');
    if(!root || !root.classList.contains('on')) return;
    var im=root.querySelectorAll('img[data-lz]:not([data-kq])'), i;
    for(i=0;i<im.length && i<40;i++){ im[i].setAttribute('data-kq','1'); Q.push(im[i]); }
    pump();
  }
  setInterval(scan, 260);
  /* se per qualsiasi motivo il calcolo della vista non funziona, carico comunque */
  setInterval(scanAll, 1000);
  /* certi indirizzi rispondono con un messaggio di errore invece dell'immagine:
     il browser non sempre lo segnala, quindi controllo io le immagini rotte */
  setInterval(function(){
    var root=document.getElementById('kfm-dbe');
    if(!root || !root.classList.contains('on')) return;
    var im=root.querySelectorAll('img[data-lz]'), i, el, ky;
    for(i=0;i<im.length;i++){
      el=im[i];
      if(el.getAttribute('data-ko')) continue;
      if(!el.getAttribute('src')) continue;
      if(!el.complete || el.naturalWidth>0) continue;
      ky=el.getAttribute('data-ky')||'';
      if(ky && MEM[ky]!=null){ delete MEM[ky]; dirty=true; }
      attempt(el, (parseInt(el.getAttribute('data-i')||'-1',10)|0)+1);
    }
  }, 1400);
  document.addEventListener('scroll', scan, true);
  window.kfmDbeImgErr=function(el){
    try{ attempt(el, (parseInt(el.getAttribute('data-i')||'-1',10)|0)+1); }catch(e){}
  };
  window.KFMDBEIMG={mem:MEM, reset:function(){ MEM={}; dirty=true; }};
})();
