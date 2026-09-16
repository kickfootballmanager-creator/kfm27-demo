
/* KFM27 - interfaccia editor database (design premium) */
(function(){
  var TAB='teams', Q='', SEL=null, R=null, BUF={n:'',l:''};
  function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function DB(){ return window.KFMDB; }
  function ov(nm){ var k=DB().norm(nm); return DB().data.t[k]||null; }

  /* ---------- immagini: catena di sorgenti indipendente dal gioco ---------- */
  function pad6(p){ return p.length<6 ? ('000000'+p).slice(-6) : p; }
  function cands(kind,key){
    var out=[], i, u;
    function push(x){ if(x && out.indexOf(x)<0) out.push(x); }
    if(kind==='teams'){
      var o=ov(key); if(o&&o.l) push(o.l);
      /* prima la sorgente che cerca la squadra per nome: quella per numero
         restituiva lo stemma di un altro club (era il caso Milan/Chelsea) */
      try{ if(typeof window.kfmTeamLogo==='function') push(window.kfmTeamLogo(key)); }catch(e){}
      try{ if(DB().origTeamLogo) push(DB().origTeamLogo(key)); }catch(e){}
      try{
        var tid='';
        if(typeof EADB!=='undefined' && EADB[key] && EADB[key].tid)
          tid=String(EADB[key].tid).replace(/\.0$/,'').replace(/^0+/,'');
        /* niente fifaindex: numera le squadre in modo diverso e restituiva
           lo stemma di un altro club (era il caso Milan/Chelsea) */
        if(tid) push('https://cdn.sofifa.net/meta/team/'+tid+'/60.png');
      }catch(e){}
      try{ if(DB().origTeamLogo) push(DB().origTeamLogo(key)); }catch(e){}
    }else{
      var f=DB().data.f[key]; if(f) push(f);
      var p=DB().pidNorm(key), q=pad6(p);
      push('https://cmtracker.fra1.cdn.digitaloceanspaces.com/DB/26/heads/p'+p+'.png');
      push('https://assets.easysbc.io/fc26/players/'+p+'.png?v5');
      push('https://cdn.fifacm.com/content/media/imgs/fc26/players/p'+p+'.png?v=26');
      push('https://cdn.futbin.com/content/fifa26/img/players/'+p+'.png');
    }
    return out;
  }
  window.kfmDbeImgOk=function(el){
    try{ el.style.visibility=''; el.style.display=''; }catch(e){}
  };
  window.kfmDbeImgErr=function(el){
    try{
      var l=(el.getAttribute('data-u')||'').split('||');
      var i=parseInt(el.getAttribute('data-i')||'0',10)+1;
      while(i<l.length && !l[i]) i++;
      if(i<l.length){ el.setAttribute('data-i',String(i)); el.src=l[i]; return; }
      el.style.display='none';
      var w=el.parentNode;
      if(w && !w.getAttribute('data-ini')){
        w.setAttribute('data-ini','1');
        var t=(el.getAttribute('data-ln')||'?').trim();
        w.insertAdjacentHTML('beforeend','<span class="dbe-ini">'+esc(t)+'</span>');
      }
    }catch(e){}
  };
  function imgTag(kind,key,label,cls){
    var l=cands(kind,key);
    if(!l.length) return '<span class="dbe-ini">'+esc(label)+'</span>';
    var ini=String(label||'?').replace(/[^A-Za-z\u00c0-\u024f ]/g,'').split(' ').filter(Boolean)
      .map(function(w){ return w.charAt(0); }).join('').slice(0,3).toUpperCase();
    var ky=kind.charAt(0)+':'+key, st=-1, pre='';
    /* se l'indirizzo valido e' gia' noto lo metto subito nel markup:
       l'immagine arriva dalla memoria del browser e non si vede piu' il vuoto */
    try{
      var mm=window.KFMDBEIMG && window.KFMDBEIMG.mem;
      if(mm && mm[ky]!=null && l[mm[ky]|0]){ st=mm[ky]|0; pre=l[st]; }
    }catch(e){}
    return '<img class="'+(cls||'')+'" data-lz="1"'+
      (pre ? ' src="'+esc(pre)+'" data-kq="9" style="visibility:hidden"'+
             ' onload="kfmDbeImgOk(this)" onerror="kfmDbeImgErr(this)"' : '')+
      ' data-i="'+st+'" data-u="'+esc(l.join('||'))+'"'+
      ' data-ky="'+esc(ky)+'" data-ln="'+esc(ini)+'" alt=""'+
      ' decoding="async" referrerpolicy="no-referrer">';
  }
  function firstUrl(kind,key){ var l=cands(kind,key); return l.length?l[0]:''; }

  var SKEL=''+
  '<div class="dbe-bg"></div><div class="dbe-veil"></div><div class="dbe-veil2"></div>'+
  '<div class="dbe-wm">KFM27</div><div class="dbe-flash"></div>'+
  '<div class="dbe-top">'+
    '<div class="dbe-mark">KFM27</div><div class="dbe-div"></div>'+
    '<div class="dbe-crumb">Editor del database</div><div class="dbe-sp"></div>'+
    '<div class="dbe-btn dan" data-act="wipe">Ripristina tutto</div>'+
    '<div class="dbe-btn" data-act="close">Torna all\u2019home</div>'+
  '</div>'+
  '<div class="dbe-wrap">'+
    '<div class="dbe-hero">'+
      '<h1 class="dbe-h1">Modifica database</h1>'+
      '<p class="dbe-sub">Personalizza il tuo universo calcistico: rinomina i club, sostituisci gli stemmi e cambia le minifacce dei giocatori. Ogni modifica viene applicata a tutte le modalit\u00e0, dalla carriera a Ultimate Team.</p>'+
    '</div>'+
    '<div class="dbe-main">'+
      '<div class="dbe-pan">'+
        '<div class="dbe-tabs">'+
          '<div class="dbe-tab" data-tab="teams">Squadre</div>'+
          '<div class="dbe-tab" data-tab="players">Giocatori</div>'+
        '</div>'+
        '<div class="dbe-pb">'+
          '<div class="dbe-lbl" id="dbe-lt">Seleziona squadra</div>'+
          '<div class="dbe-sbox">'+
            '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#cfe0f5" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>'+
            '<input id="dbe-q" type="text" placeholder="Cerca squadra\u2026" autocomplete="off">'+
          '</div>'+
          '<div class="dbe-cnt" id="dbe-ln"></div>'+
        '</div>'+
        '<div class="dbe-list" id="dbe-list"></div>'+
      '</div>'+
      '<div class="dbe-ed" id="dbe-ed"></div>'+
    '</div>'+
  '</div>'+
  '<div class="dbe-foot">'+
    '<div class="dbe-hint"><span class="dbe-key">\u2725</span>Naviga</div>'+
    '<div class="dbe-hint"><span class="dbe-key">Enter</span>Conferma</div>'+
    '<div class="dbe-hint"><span class="dbe-key">Esc</span>Indietro</div>'+
    '<div class="dbe-sp"></div><span class="dbe-stat" id="dbe-cnt"></span>'+
  '</div>'+
  '<div class="dbe-toast" id="dbe-toast"></div>'+
  '<input type="file" id="dbe-file" accept="image/*" style="display:none">';

  function build(){
    if(R) return R;
    R=document.createElement('div');
    R.id='kfm-dbe';
    R.innerHTML=SKEL;
    document.body.appendChild(R);
    R.addEventListener('click', onClick);
    R.querySelector('#dbe-q').addEventListener('input', function(){ Q=this.value; list(); });
    R.querySelector('#dbe-file').addEventListener('change', onFile);
    return R;
  }

  function toast(m){
    var t=R.querySelector('#dbe-toast');
    t.textContent=m; t.classList.add('on');
    clearTimeout(t._h); t._h=setTimeout(function(){ t.classList.remove('on'); }, 2200);
  }

  function rows(){
    var q=DB().norm(Q), out=[], i, a;
    if(TAB==='teams'){
      a=DB().teams();
      for(i=0;i<a.length;i++){
        var o=ov(a[i].nm), dn=(o&&o.n)?o.n:a[i].nm;
        if(q && DB().norm(dn).indexOf(q)<0 && DB().norm(a[i].nm).indexOf(q)<0) continue;
        out.push({key:a[i].nm, t:dn, s:(o&&o.n)?('Originale: '+a[i].nm):'Club', ed:!!o});
        if(out.length>=90) break;
      }
    }else{
      a=DB().players();
      for(i=0;i<a.length;i++){
        if(q && DB().norm(a[i].nm).indexOf(q)<0) continue;
        out.push({key:a[i].pid, t:a[i].nm, s:DB().teamName(a[i].club), ed:!!DB().data.f[a[i].pid]});
        if(out.length>=90) break;
      }
    }
    return out;
  }

  function list(){
    var a=rows(), h='', i;
    for(i=0;i<a.length;i++){
      var r=a[i], on=(SEL&&SEL.key===r.key)?' on':'';
      h+='<div class="dbe-row'+on+(r.ed?' edited':'')+'" data-k="'+esc(r.key)+'">'+
         '<div class="th">'+imgTag(TAB,r.key,r.t)+'</div>'+
         '<div class="tx"><b>'+esc(r.t)+'</b><s>'+esc(r.s)+'</s></div></div>';
    }
    if(!a.length) h='<div class="dbe-empty">Nessun risultato per \u201c'+esc(Q)+'\u201d.</div>';
    R.querySelector('#dbe-list').innerHTML=h;
    var isT=(TAB==='teams');
    R.querySelector('#dbe-lt').textContent=isT?'Seleziona squadra':'Seleziona giocatore';
    R.querySelector('#dbe-q').placeholder=isT?'Cerca squadra\u2026':'Cerca giocatore\u2026';
    R.querySelector('#dbe-ln').textContent=a.length+(a.length>=90?'+':'')+' voci';
    var t=R.querySelectorAll('.dbe-tab'), j;
    for(j=0;j<t.length;j++) t[j].classList.toggle('on', t[j].getAttribute('data-tab')===TAB);
    var nt=0, nf=0, k;
    for(k in DB().data.t) nt++;
    for(k in DB().data.f) nf++;
    R.querySelector('#dbe-cnt').textContent=
      nt+(nt===1?' squadra modificata':' squadre modificate')+' \u00b7 '+
      nf+(nf===1?' miniface modificata':' minifacce modificate');
  }

  function editor(){
    var e=R.querySelector('#dbe-ed');
    if(!SEL){
      e.innerHTML='<div class="dbe-void"><div class="big">Seleziona una voce</div>'+
        '<p>Scegli una squadra per cambiarne nome e stemma, oppure un giocatore per sostituire la sua miniface.</p></div>';
      return;
    }
    var isT=(SEL.tab==='teams'), h='';
    var ttl=isT?(BUF.n||DB().teamName(SEL.key)):SEL.name;
    var edited=isT ? !!ov(SEL.key) : !!DB().data.f[SEL.key];
    var spot = BUF.l
      ? '<img src="'+esc(BUF.l)+'" alt="" referrerpolicy="no-referrer">'
      : imgTag(isT?'teams':'players', SEL.key, ttl);
    var cur = BUF.l || firstUrl(isT?'teams':'players', SEL.key);
    var curTx = cur.length>120 ? (cur.slice(0,60)+'\u2026 (immagine caricata)') : cur;
    h+='<div class="dbe-eh"><div class="dbe-spot">'+spot+'</div>'+
       '<div class="tx"><h3>'+esc(ttl)+'</h3><div class="mt">'+
       '<span class="dbe-chip">'+(isT?'Squadra':'Giocatore')+'</span>'+
       (isT?'':'<span class="dbe-chip">'+esc(DB().teamName(SEL.club))+'</span>')+
       (edited?'<span class="dbe-chip ed">Modificato</span>':'')+
       '</div></div></div><div class="dbe-hr"></div>';
    if(isT){
      h+='<div class="dbe-f"><label>Nome della squadra</label>'+
         '<input type="text" id="dbe-n" value="'+esc(BUF.n||DB().teamName(SEL.key))+'">'+
         '<div class="hint">Il nuovo nome sostituisce quello originale in ogni schermata del gioco.</div></div>';
    }
    h+='<div class="dbe-f"><label>'+(isT?'Stemma della squadra':'Miniface del giocatore')+'</label>'+
       '<div class="row"><input type="text" id="dbe-l" placeholder="Indirizzo dell\u2019immagine" value="'+esc(BUF.l)+'" style="flex:1;min-width:220px">'+
       '<div class="dbe-drop" data-act="up">Carica dal dispositivo</div></div>'+
       '<div class="hint">Incolla un indirizzo oppure carica un file: viene salvato dentro il gioco.</div>'+
       '<div class="hint mono">In uso ora: '+esc(curTx||'nessuna immagine disponibile')+'</div></div>';
    h+='<div class="dbe-hr"></div><div class="dbe-acts">'+
       '<div class="dbe-btn gold" data-act="save">Salva modifica</div>'+
       '<div class="dbe-btn" data-act="undo">Annulla modifica</div>'+
       (edited?'<div class="dbe-btn dan" data-act="reset">Ripristina originale</div>':'')+'</div>';
    e.innerHTML=h;
    var n=e.querySelector('#dbe-n'), l=e.querySelector('#dbe-l');
    if(n) n.addEventListener('input', function(){ BUF.n=this.value; });
    if(l) l.addEventListener('input', function(){ BUF.l=this.value; });
  }

  function pick(key){
    if(TAB==='teams'){ var o=ov(key); SEL={tab:'teams',key:key}; BUF={n:(o&&o.n)?o.n:key, l:(o&&o.l)?o.l:''}; }
    else{
      var a=DB().players(), i, p=null;
      for(i=0;i<a.length;i++) if(a[i].pid===key){ p=a[i]; break; }
      if(!p) return;
      SEL={tab:'players',key:key,name:p.nm,club:p.club};
      BUF={n:'', l:DB().data.f[key]||''};
    }
    list(); editor();
  }

  function doSave(){
    if(!SEL) return;
    var d=DB().data;
    if(SEL.tab==='teams'){
      var k=DB().norm(SEL.key), nm=(BUF.n||'').trim(), lg=(BUF.l||'').trim();
      if((!nm || nm===SEL.key) && !lg) delete d.t[k];
      else d.t[k]={n:(nm&&nm!==SEL.key)?nm:'', l:lg, orig:SEL.key};
      DB().save(); toast('Squadra aggiornata');
    }else{
      var u=(BUF.l||'').trim();
      if(u) d.f[SEL.key]=u; else delete d.f[SEL.key];
      DB().save(); toast('Miniface aggiornata');
    }
    list(); editor();
  }
  function doReset(){
    if(!SEL) return;
    if(SEL.tab==='teams') delete DB().data.t[DB().norm(SEL.key)];
    else delete DB().data.f[SEL.key];
    DB().save();
    BUF={n:(SEL.tab==='teams'?SEL.key:''), l:''};
    toast('Ripristinato');
    list(); editor();
  }

  function onFile(){
    var f=this.files&&this.files[0]; if(!f) return;
    var rd=new FileReader();
    rd.onload=function(){ BUF.l=String(rd.result||''); editor(); toast('Immagine caricata \u00b7 premi Salva'); };
    rd.readAsDataURL(f);
    this.value='';
  }

  function onClick(ev){
    var t=ev.target, el;
    el=t.closest?t.closest('[data-act]'):null;
    if(el){
      var a=el.getAttribute('data-act');
      if(a==='close') return window.kfmCloseDBE();
      if(a==='save')  return doSave();
      if(a==='undo')  { if(SEL) pick(SEL.key); return; }
      if(a==='reset') return doReset();
      if(a==='up')    { R.querySelector('#dbe-file').click(); return; }
      if(a==='wipe'){
        if(!confirm('Ripristinare tutto il database originale?')) return;
        DB().data.t={}; DB().data.f={}; DB().save(); SEL=null; BUF={n:'',l:''};
        toast('Database originale ripristinato'); list(); editor(); return;
      }
      return;
    }
    el=t.closest?t.closest('.dbe-tab'):null;
    if(el){ TAB=el.getAttribute('data-tab'); SEL=null; Q=''; R.querySelector('#dbe-q').value=''; list(); editor(); return; }
    el=t.closest?t.closest('.dbe-row'):null;
    if(el){ pick(el.getAttribute('data-k')); return; }
  }

  window.kfmOpenDBE=function(){
    build();
    R._ovfB=document.body.style.overflow;
    R._ovfH=document.documentElement.style.overflow;
    R.classList.remove('closing');
    R.classList.add('on');
    /* animazione di apertura */
    R.classList.add('opening');
    clearTimeout(R._an);
    R._an=setTimeout(function(){ R.classList.remove('opening'); }, 950);
    document.body.style.overflow='hidden';
    document.documentElement.style.overflow='hidden';
    try{ var iv=document.getElementById('kfm-intro');
      if(iv && iv.style.display!=='none'){ R._intro=1; iv.style.visibility='hidden'; }
    }catch(e){}
    /* nascondo anche la schermata di avvio: si intravedeva dietro l'editor */
    try{
      var ids=['kfm-boot','kfm-splash','kfm-cover','ut-root'], q, k;
      R._hid=[];
      for(k=0;k<ids.length;k++){
        q=document.getElementById(ids[k]);
        if(q && q.style.visibility!=='hidden'){ R._hid.push(q); q.style.visibility='hidden'; }
      }
    }catch(e){}
    list(); editor();
  };
  window.kfmCloseDBE=function(){
    if(!R) return;
    /* animazione di chiusura: la schermata sparisce solo al termine */
    R.classList.remove('opening');
    R.classList.add('closing');
    clearTimeout(R._an);
    R._an=setTimeout(function(){
      try{ R.classList.remove('on'); R.classList.remove('closing'); }catch(e){}
    }, 420);
    document.body.style.overflow=R._ovfB||'';
    document.documentElement.style.overflow=R._ovfH||'';
    try{ window.kfmDbApply(); }catch(e){}
    try{ var iv=document.getElementById('kfm-intro'); if(iv) iv.style.visibility=''; }catch(e){}
    try{ var hh=R._hid||[], z; for(z=0;z<hh.length;z++) hh[z].style.visibility=''; R._hid=[]; }catch(e){}
    if(R._intro){ R._intro=0;
      try{ if(typeof window.kfmHome==='function'){ window.kfmHome(); return; } }catch(e){}
    }
    try{ if(typeof render==='function') render(); }catch(e){}
  };
  document.addEventListener('keydown', function(ev){
    if(ev.key==='Escape' && R && R.classList.contains('on')) window.kfmCloseDBE();
  });
})();
