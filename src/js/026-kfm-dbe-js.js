
/* KFM27 - motore editor database + fallback minifaces */
(function(){
  var KEY='KFM_DBEDIT_V1';
  var D={t:{},f:{}};
  try{ var raw=localStorage.getItem(KEY); if(raw){ var o=JSON.parse(raw); if(o&&o.t) D.t=o.t; if(o&&o.f) D.f=o.f; } }catch(e){}
  function save(){ try{ localStorage.setItem(KEY, JSON.stringify(D)); }catch(e){} }

  function norm(s){
    var v=String(s==null?'':s).toLowerCase();
    try{ v=v.normalize('NFD').replace(/[\u0300-\u036f]/g,''); }catch(e){}
    return v.replace(/[^a-z0-9]/g,'');
  }
  function pidNorm(v){ return String(v==null?'':v).replace(/\.0$/,'').replace(/^0+/,''); }

  /* ---------- minifaces: due sorgenti + nuovo tentativo ---------- */
  var FACE1='https://cmtracker.fra1.cdn.digitaloceanspaces.com/DB/26/heads/p';
  var FACE2='https://assets.easysbc.io/fc26/players/';
  function pidFromSrc(src){
    var s=String(src||''), m;
    m=/\/heads\/p(\d+)\.png/.exec(s); if(m) return m[1];
    m=/easysbc\.io\/fc26\/players\/(\d+)\.png/.exec(s); if(m) return m[1];
    return '';
  }
  window.kfmFaceErr=function(img){
    if(!img) return;
    try{
      img.alt='';
      var src=String(img.getAttribute('src')||'');
      var pid=pidFromSrc(src);
      if(!pid){ return; }
      var st=img.getAttribute('data-fb')||'0';
      if(st==='0'){ img.setAttribute('data-fb','1'); img.src=FACE2+pid+'.png?v5'; return; }
      if(st==='1'){ img.setAttribute('data-fb','2');
        setTimeout(function(){ try{ img.src=FACE1+pid+'.png'; }catch(e){} }, 600); return; }
      if(st==='2'){ img.setAttribute('data-fb','3'); img.src=FACE2+pid+'.png?v5&r=2'; return; }
      /* questo giocatore non ha una foto su nessun sito */
      img.style.visibility='';
      img.style.display='';
      img.src='https://www.fifacm.com/content/media/imgs/fc26/players/notfound_0.png';
    }catch(e){}
  };
  document.addEventListener('error', function(ev){
    var t=ev&&ev.target;
    if(!t||t.tagName!=='IMG') return;
    if(!pidFromSrc(t.getAttribute('src')||'')) return;
    window.kfmFaceErr(t);
  }, true);

  /* ---------- riferimenti originali ---------- */
  var oTmLogo   = (typeof window.tmLogo==='function')      ? window.tmLogo      : null;
  var oGetLogo  = (typeof window.getLogo==='function')     ? window.getLogo     : null;
  var oCrest    = (typeof window.clubCrest==='function')   ? window.clubCrest   : null;
  var oTeamLogo = (typeof window.kfmTeamLogo==='function') ? window.kfmTeamLogo : null;
  var oClubLogo = (typeof window.clubLogo==='function')    ? window.clubLogo    : null;
  var oGetFace  = (typeof window.getFace==='function')     ? window.getFace     : null;

  function tOv(name){ var k=norm(name); return k?(D.t[k]||null):null; }
  function teamTid(nm){
    try{ if(typeof EADB!=='undefined' && EADB[nm] && EADB[nm].tid) return EADB[nm].tid; }catch(e){}
    return '';
  }
  function teamName(nm){ var o=tOv(nm); return (o&&o.n)?o.n:nm; }
  function teamLogo(nm){
    var o=tOv(nm); if(o&&o.l) return o.l;
    if(oTmLogo){ try{ var u=oTmLogo(nm); if(u) return u; }catch(e){} }
    if(oTeamLogo){ try{ var v=oTeamLogo(nm); if(v) return v; }catch(e){} }
    var t=teamTid(nm);
    if(t&&oGetLogo){ try{ return oGetLogo(t,''); }catch(e){} }
    return '';
  }
  function faceOf(pid,name){
    var p=pidNorm(pid);
    if(p&&D.f[p]) return D.f[p];
    if(oGetFace){ try{ return oGetFace(pid,name); }catch(e){} }
    return '';
  }

  if(oTmLogo)   window.tmLogo   = function(n){ var o=tOv(n); if(o&&o.l) return o.l; return oTmLogo(n); };
  if(oTeamLogo) window.kfmTeamLogo=function(n){ var o=tOv(n); if(o&&o.l) return o.l; return oTeamLogo(n); };
  if(oClubLogo) window.clubLogo = function(n){ var o=tOv(n); if(o&&o.l) return o.l; return oClubLogo(n); };
  if(oCrest)    window.clubCrest= function(n){ var o=tOv(n); if(o&&o.l) return o.l; return oCrest(n); };
  if(oGetLogo)  window.getLogo  = function(id,n){
    var o=n?tOv(n):null; if(o&&o.l) return o.l;
    if(!n && id){ var sg=sigOf(oGetLogo(id,'')); if(sg&&SIG[sg]) return SIG[sg]; }
    return oGetLogo(id,n);
  };
  if(oGetFace)  window.getFace  = function(id,n){ var p=pidNorm(id); if(p&&D.f[p]) return D.f[p]; return oGetFace(id,n); };

  /* ---------- firme dei loghi (host diversi, stesso club) ---------- */
  function sigOf(url){
    var s=String(url||''), m;
    m=/wappen\/[a-z]+\/(\d+)\.png/.exec(s);                if(m) return 'tm:'+m[1];
    m=/fifaindex\.com\/[^\/]+\/teams\/(\d+)/.exec(s);      if(m) return 'fi:'+m[1];
    m=/api-sports\.io\/football\/teams\/(\d+)/.exec(s);    if(m) return 'ap:'+m[1];
    m=/sofifa\.net\/meta\/team\/(\d+)/.exec(s);            if(m) return 'so:'+m[1];
    m=/logos?\/teams?\/(\d+)\.(?:png|webp)/.exec(s);       if(m) return 'gn:'+m[1];
    return '';
  }
  var SIG={};
  function rebuild(){
    SIG={};
    for(var k in D.t){
      var o=D.t[k]; if(!o||!o.l||!o.orig) continue;
      var nm=o.orig, urls=[], i, sg;
      if(oTmLogo){   try{ urls.push(oTmLogo(nm)); }catch(e){} }
      if(oTeamLogo){ try{ urls.push(oTeamLogo(nm)); }catch(e){} }
      if(oCrest){    try{ urls.push(oCrest(nm)); }catch(e){} }
      var tid=teamTid(nm);
      if(tid&&oGetLogo){ try{ urls.push(oGetLogo(tid,'')); }catch(e){} }
      for(i=0;i<urls.length;i++){ sg=sigOf(urls[i]); if(sg) SIG[sg]=o.l; }
    }
  }

  /* ---------- applicazione a schermo ---------- */
  function fixImg(im){
    var src=im.getAttribute('src')||'';
    if(!src) return;
    var pid=pidFromSrc(src);
    if(pid){
      var f=D.f[pid];
      if(f && src!==f){ im.setAttribute('data-kfmf',pid); im.src=f; im.style.visibility=''; }
      return;
    }
    var sg=sigOf(src);
    if(sg && SIG[sg] && src!==SIG[sg]){ im.setAttribute('data-kfml',sg); im.src=SIG[sg]; im.style.visibility=''; }
  }
  function fixBg(el){
    var st=el.getAttribute('style')||'';
    if(st.indexOf('url(')<0) return;
    var m=/url\((['"]?)([^'")]+)\1\)/.exec(st);
    if(!m) return;
    var u=m[2], nu='', pid=pidFromSrc(u);
    if(pid && D.f[pid]) nu=D.f[pid];
    else { var sg=sigOf(u); if(sg && SIG[sg]) nu=SIG[sg]; }
    if(nu && nu!==u) el.setAttribute('style', st.replace(m[0], 'url("'+nu+'")'));
  }
  function fixText(){
    var pairs=[], k;
    for(k in D.t){ var o=D.t[k]; if(o&&o.n&&o.orig&&o.n!==o.orig) pairs.push([o.orig,o.n]); }
    if(!pairs.length) return;
    var w=document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false), n, i;
    while((n=w.nextNode())){
      var p=n.parentNode; if(!p||!p.tagName) continue;
      var tg=p.tagName;
      if(tg==='SCRIPT'||tg==='STYLE'||tg==='TEXTAREA'||tg==='INPUT') continue;
      if(p.closest && p.closest('#kfm-dbe')) continue;
      var v=n.nodeValue; if(!v||v.length>500) continue;
      var nv=v;
      for(i=0;i<pairs.length;i++){ if(nv.indexOf(pairs[i][0])>=0) nv=nv.split(pairs[i][0]).join(pairs[i][1]); }
      if(nv!==v) n.nodeValue=nv;
    }
  }
  function applyDom(){
    var im=document.images, i, el;
    for(i=0;i<im.length;i++){
      el=im[i];
      try{
        fixImg(el);
        if(el.naturalWidth>0){
          if(el.style.visibility==='hidden') el.style.visibility='';
          if(el.style.display==='none' && el.getAttribute('data-kfmhid')!=='0') el.style.display='';
        }
      }catch(e){}
    }
    try{ var bs=document.querySelectorAll('[style*="url("]'); for(i=0;i<bs.length;i++) fixBg(bs[i]); }catch(e){}
    try{ fixText(); }catch(e){}
  }

  /* ---------- elenco squadre / giocatori ---------- */
  var TEAMS=null, PLAYERS=null;
  function teams(){
    if(TEAMS) return TEAMS;
    TEAMS=[];
    try{
      if(typeof EADB!=='undefined'){
        for(var nm in EADB){ if(!nm) continue; TEAMS.push({nm:nm, tid:teamTid(nm)}); }
      }
    }catch(e){}
    TEAMS.sort(function(a,b){ return a.nm.localeCompare(b.nm); });
    return TEAMS;
  }
  function players(){
    if(PLAYERS) return PLAYERS;
    PLAYERS=[];
    var seen={};
    function add(name,pid,club){
      var p=pidNorm(pid); if(!name||!p||seen[p]) return;
      seen[p]=1; PLAYERS.push({nm:String(name), pid:p, club:club||''});
    }
    try{
      if(typeof EADB!=='undefined'){
        for(var nm in EADB){
          var t=EADB[nm]; if(!t||!t.r) continue;
          for(var i=0;i<t.r.length;i++){
            var pr=String(t.r[i]).split('|');
            add(pr[0], pr[3], nm);
          }
        }
      }
    }catch(e){}
    PLAYERS.sort(function(a,b){ return a.nm.localeCompare(b.nm); });
    return PLAYERS;
  }

  window.KFMDB={
    data:D, save:function(){ save(); rebuild(); applyDom(); },
    norm:norm, pidNorm:pidNorm, sigOf:sigOf,
    teamName:teamName, teamLogo:teamLogo, face:faceOf,
    origTeamLogo:function(nm){
      if(oTmLogo){ try{ var u=oTmLogo(nm); if(u) return u; }catch(e){} }
      if(oTeamLogo){ try{ var v=oTeamLogo(nm); if(v) return v; }catch(e){} }
      var t=teamTid(nm); if(t&&oGetLogo){ try{ return oGetLogo(t,''); }catch(e){} }
      return '';
    },
    origFace:function(pid,nm){ if(oGetFace){ try{ return oGetFace(pid,nm); }catch(e){} } return FACE1+pidNorm(pid)+'.png'; },
    teams:teams, players:players, apply:applyDom, rebuild:rebuild
  };
  window.kfmDbApply=function(){ rebuild(); applyDom(); };
  rebuild();
  setInterval(applyDom, 250);
  /* applico le modifiche nello stesso fotogramma in cui le immagini compaiono,
     cosi' non si vede piu' l'originale per una frazione di secondo */
  var pendA=false, lastA=0;
  function runA(){ pendA=false; lastA=Date.now(); try{ applyDom(); }catch(e){} }
  function soonA(){
    if(pendA) return;
    pendA=true;
    var d=Date.now()-lastA;
    if(d<120){ setTimeout(runA, 120-d); return; }
    var f=window.requestAnimationFrame||function(fn){ setTimeout(fn,0); };
    f(runA);
  }
  try{
    new MutationObserver(function(muts){
      for(var i=0;i<muts.length;i++){
        var m=muts[i];
        if(m.type==='attributes' || (m.addedNodes && m.addedNodes.length)){ soonA(); return; }
      }
    }).observe(document.documentElement, {childList:true, subtree:true, attributes:true,
      attributeFilter:['src','style','class']});
  }catch(e){}
  soonA();
})();
