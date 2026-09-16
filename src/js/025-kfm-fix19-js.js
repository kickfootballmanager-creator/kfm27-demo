
/* ============ stemmi club + miniface rotte (sostituisce fix17) ============ */
(function(){
  var API='https://media.api-sports.io/football/teams/';

  /* squadre reali dei 21 giocatori ETERNAL (e di ogni loro versione) */
  var FIX={
    'k mbappe':['Real Madrid',541], 'e haaland':['Manchester City',50],
    'vinicius jr':['Real Madrid',541], 'j bellingham':['Real Madrid',541],
    'h kane':['Bayern Munchen',157], 'm salah':['Liverpool',40],
    'l martinez':['Inter',505], 'l yamal':['Barcelona',529],
    'raphinha':['Barcelona',529], 'pedri':['Barcelona',529],
    'r lewandowski':['Barcelona',529], 'k de bruyne':['Napoli',492],
    'c palmer':['Chelsea',49], 'f wirtz':['Liverpool',40],
    'j musiala':['Bayern Munchen',157], 'b saka':['Arsenal',42],
    'v osimhen':['Galatasaray',645], 'cristiano ronaldo':['Al Nassr',2506],
    'neymar jr':['Santos',128], 'd doue':['Paris Saint Germain',85],
    'k yildiz':['Juventus',496]
  };
  var SUR={};
  (function(){ for(var k in FIX){ var p=k.split(' '); SUR[p[p.length-1]]=FIX[k]; } })();

  function norm(s){
    return String(s||'').normalize? String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
      .toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim()
      : String(s||'').toLowerCase();
  }

  var MAP=null;
  function build(){
    if(MAP) return MAP;
    MAP={};
    try{
      if(typeof EADB==='undefined'||!EADB) return MAP;
      for(var cn in EADB){
        var c=EADB[cn]; if(!c||!c.r) continue;
        for(var i=0;i<c.r.length;i++){
          var pr=String(c.r[i]).split('|');
          var pid=String(pr[3]||'').replace(/\.0$/,'').replace(/^0+/,'');
          if(pid&&pid!=='0'&&!MAP['p'+pid]) MAP['p'+pid]=cn;
        }
      }
    }catch(e){}
    return MAP;
  }

  function dbLogo(club){
    if(!club) return '';
    try{ if(typeof kfmTeamLogo==='function'){ var a=kfmTeamLogo(club); if(a) return a; } }catch(e){}
    try{ if(typeof clubCrest==='function'){ var b=clubCrest(club); if(b) return b; } }catch(e){}
    try{ if(typeof getLogo==='function'&&typeof EADB!=='undefined'&&EADB[club])
      return getLogo(EADB[club].tid, club)||''; }catch(e){}
    return '';
  }

  /* nome pieno della carta: il markup ha solo il cognome, quindi uso il titolo
     della foto (alt/aria) oppure il pid */
  function fullName(el){
    var img=el.querySelector('.uc-ph img');
    var n=img?(img.getAttribute('data-nm')||img.getAttribute('alt')||''):'';
    if(!n){ var t=el.getAttribute('data-nm'); if(t) n=t; }
    if(!n){ var s=el.querySelector('.uc-nm'); n=s?s.textContent:''; }
    return n;
  }

  /* il numero del giocatore, qualunque delle quattro sorgenti di foto sia in uso */
  function pidAny(src){
    src=String(src||'');
    var m=/heads\/p(\d+)\.png/.exec(src); if(m) return m[1].replace(/^0+/,'');
    m=/players\/(\d+)\.png/.exec(src); if(m) return m[1].replace(/^0+/,'');
    m=/players\/(\d+)\/(\d+)\/26_/.exec(src); if(m) return (m[1]+m[2]).replace(/^0+/,'');
    return '';
  }

  function pick(el){
    var n=norm(fullName(el));
    if(n&&FIX[n]) return FIX[n];
    var toks=n.split(' ');
    var last=toks[toks.length-1];
    if(last==='jr'||last==='sr') last=toks[toks.length-2]||last;
    if(last&&SUR[last]) return SUR[last];
    var m=build(), img=el.querySelector('.uc-ph img');
    if(img){
      var pid=pidAny(img.getAttribute('src')||'') || pidAny(img.getAttribute('data-fu')||'');
      if(pid&&m['p'+pid]) return [m['p'+pid],0];
    }
    return null;
  }

  function crestList(club,id){
    var out=[];
    function add(u){ if(u && out.indexOf(u)<0) out.push(u); }
    if(id) add(API+id+'.png');
    add(dbLogo(club));
    try{ if(typeof LOGO_TM!=='undefined' && LOGO_TM[club])
      add('https://tmssl.akamaized.net/images/wappen/head/'+LOGO_TM[club]+'.png'); }catch(e){}
    try{
      if(typeof EADB!=='undefined' && EADB[club] && EADB[club].tid){
        var t=String(EADB[club].tid).replace(/\.0$/,'').replace(/^0+/,'');
        /* niente fifaindex: restituiva lo stemma di un altro club */
        if(t) add('https://cdn.sofifa.net/meta/team/'+t+'/60.png');
      }
    }catch(e){}
    return out;
  }

  /* memoria: per ogni club ricordo lo stemma che ha funzionato, cosi' non
     cambia piu' da un momento all'altro */
  var LG={};
  try{ LG=JSON.parse(localStorage.getItem('KFM_LOGO_OK_V1')||'{}')||{}; }catch(e){}
  var lgD=false;
  setInterval(function(){
    if(!lgD) return; lgD=false;
    try{ localStorage.setItem('KFM_LOGO_OK_V1', JSON.stringify(LG)); }catch(e){}
  }, 4000);

  function addLogo(el,got){
    if(!got) got=pick(el);
    if(!got) return;
    var club=got[0], id=got[1]|0;
    var L=crestList(club,id);
    if(!L.length) return;
    if(LG[club]){
      var ok=LG[club];
      L=[ok].concat(L.filter(function(u){ return u!==ok; }));
    }
    var primary=L[0], backup=L.slice(1).join('||');
    var d=document.createElement('div');
    d.className='uc-club'; d.title=club;
    var im=document.createElement('img');
    im.alt=''; im.referrerPolicy='no-referrer';
    im.setAttribute('data-bk', backup||'');
    im.onload=function(){
      try{
        var u=this.getAttribute('src')||'';
        if(u && this.naturalWidth>0 && LG[club]!==u){ LG[club]=u; lgD=true; }
      }catch(e){}
    };
    im.onerror=function(){
      var bk=(this.getAttribute('data-bk')||'').split('||').filter(Boolean);
      if(bk.length){
        var nx=bk.shift();
        this.setAttribute('data-bk', bk.join('||'));
        this.src=nx; return;
      }
      this.onerror=null;
      var p=this.parentNode; if(p&&p.parentNode) p.parentNode.removeChild(p);
      /* riprovo piu' tardi con la carta */
      try{ var c=el; if(c) c.classList.remove('kfx-club2'); }catch(e){}
    };
    im.src=primary||backup;
    d.appendChild(im);
    var nat=el.querySelector('.uc-nat');
    if(nat&&nat.nextSibling) el.insertBefore(d, nat.nextSibling); else el.appendChild(d);
  }

  /* miniface rotta: mai mostrare il testo alternativo con il nome */
  function fixFace(el){
    var img=el.querySelector('.uc-ph img');
    if(!img||img.getAttribute('data-kfx')) return;
    img.setAttribute('data-kfx','1');
    if(!img.getAttribute('data-nm')) img.setAttribute('data-nm', img.getAttribute('alt')||'');
    img.alt='';
    var src=String(img.getAttribute('src')||'');
    if(src.indexOf('ui-avatars.com')>=0) return;
    img.style.display='';
    img.addEventListener('error', function(){
      try{ window.kfmFaceErr(this); }catch(e){} });
  }

  function decorate(){
    var list=document.querySelectorAll('.utc[data-card]:not(.kfx-club2)');
    for(var i=0;i<list.length;i++){
      var el=list[i];
      try{ fixFace(el); }catch(e){}
      if(el.classList.contains('v-legends')){ el.classList.add('kfx-club2'); continue; }
      var got=null; try{ got=pick(el); }catch(e){}
      /* niente club riconosciuto: lascio lo stemma esistente e riprovo al giro dopo,
         perche' la foto del giocatore puo' non essere ancora arrivata */
      if(!got) continue;
      el.classList.add('kfx-club2');
      var old=el.querySelectorAll('.uc-club');
      for(var j=0;j<old.length;j++) old[j].parentNode.removeChild(old[j]);
      try{ addLogo(el, got); }catch(e){}
    }
  }

  /* sorveglianza stemmi: un indirizzo che risponde con un errore invece
     dell'immagine non sempre avvisa, quindi controllo io le immagini rotte:
     provo la sorgente per nome e, se non c'e' nulla, nascondo il riquadro
     cosi' non si vede l'icona di immagine mancante */
  function crestWatch(){
    var im=document.images, i, el, src, nm, alt;
    for(i=0;i<im.length;i++){
      el=im[i];
      try{
        if(el.closest && el.closest('#kfm-dbe')) continue;
        src=el.getAttribute('src')||'';
        if(!src) continue;
        if(src.indexOf('tmssl')<0 && src.indexOf('fifaindex')<0 &&
           src.indexOf('sofifa.net/meta/team')<0 && src.indexOf('api-sports')<0) continue;
        if(!el.complete || el.naturalWidth>0) continue;
        if(el.getAttribute('data-cw')===src) continue;
        el.setAttribute('data-cw', src);
        nm='';
        alt=el.getAttribute('data-nm')||el.getAttribute('alt')||el.getAttribute('title')||'';
        if(alt && typeof window.kfmTeamLogo==='function'){
          try{ nm=window.kfmTeamLogo(alt)||''; }catch(e2){ nm=''; }
        }
        if(nm && nm!==src){ el.style.visibility=''; el.src=nm; }
        else{ el.style.visibility='hidden'; }
      }catch(e){}
    }
  }
  setInterval(crestWatch, 1500);

  window.kfmCardClubs=decorate;
  setInterval(function(){ try{ decorate(); }catch(e){} }, 400);
  document.addEventListener('click', function(){ setTimeout(function(){ try{ decorate(); }catch(e){} }, 60); }, true);
  if(document.readyState!=='loading') setTimeout(decorate, 250);
  else document.addEventListener('DOMContentLoaded', function(){ setTimeout(decorate,250); });
})();
