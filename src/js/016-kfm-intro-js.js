
(function(){
  var root=document.getElementById('kfm-intro');
  if(!root) return;
  var live=false;

  /* ---------------- AUDIO: whoosh / click ---------------- */
  var AC=null;
  function ctx(){ try{ if(!AC){ var C=window.AudioContext||window.webkitAudioContext; if(!C) return null; AC=new C(); } if(AC.state==='suspended') AC.resume(); return AC; }catch(e){ return null; } }
  function whoosh(dur,vol){
    var a=ctx(); if(!a) return;
    dur=dur||0.55; vol=vol==null?0.32:vol;
    var n=Math.floor(a.sampleRate*dur), buf=a.createBuffer(1,n,a.sampleRate), d=buf.getChannelData(0);
    for(var i=0;i<n;i++){ var t=i/n; d[i]=(Math.random()*2-1)*Math.pow(1-t,1.7); }
    var src=a.createBufferSource(); src.buffer=buf;
    var f=a.createBiquadFilter(); f.type='bandpass'; f.Q.value=0.85;
    f.frequency.setValueAtTime(280,a.currentTime);
    f.frequency.exponentialRampToValueAtTime(2600,a.currentTime+dur*0.55);
    f.frequency.exponentialRampToValueAtTime(420,a.currentTime+dur);
    var g=a.createGain();
    g.gain.setValueAtTime(0.0001,a.currentTime);
    g.gain.exponentialRampToValueAtTime(vol,a.currentTime+0.06);
    g.gain.exponentialRampToValueAtTime(0.0001,a.currentTime+dur);
    src.connect(f); f.connect(g); g.connect(a.destination); src.start();
  }
  function tick(freq,vol,dur){
    var a=ctx(); if(!a) return;
    var o=a.createOscillator(), g=a.createGain();
    o.type='triangle'; o.frequency.value=freq||520;
    g.gain.setValueAtTime(0.0001,a.currentTime);
    g.gain.exponentialRampToValueAtTime(vol||0.09,a.currentTime+0.01);
    g.gain.exponentialRampToValueAtTime(0.0001,a.currentTime+(dur||0.14));
    o.connect(g); g.connect(a.destination); o.start(); o.stop(a.currentTime+(dur||0.14)+0.02);
  }

  /* ---------------- SCHERMO INTERO ---------------- */
  function fsEl(){ return document.fullscreenElement||document.webkitFullscreenElement||null; }
  function fsReq(){
    var e=document.documentElement;
    var fn=e.requestFullscreen||e.webkitRequestFullscreen;
    if(!fn) return Promise.reject();
    try{ var p=fn.call(e); return (p&&p.then)?p:Promise.resolve(); }catch(err){ return Promise.reject(err); }
  }
  function fsExit(){ try{ (document.exitFullscreen||document.webkitExitFullscreen).call(document); }catch(e){} }
  function lockEsc(){}
  function unlockEsc(){}

  var fsBox=document.getElementById('kfm-fs');
  function closeFs(){ fsBox.classList.add('off'); setTimeout(function(){ fsBox.style.display='none'; },420); }
  document.getElementById('kfm-fsyes').onclick=function(){ tick(680,.1,.12); fsReq().then(function(){},function(){}); closeFs(); };
  document.getElementById('kfm-fsno').onclick=function(){ tick(320,.08,.12); closeFs(); };

  /* tieni premuto SHIFT per tornare a schermo intero */
  var escBox=document.getElementById('kfm-esc'), escRing=document.getElementById('kfm-escring'),
      escTx=document.getElementById('kfm-esctx');
  var HOLD=800, holdT0=0, holdRaf=0, holding=false, tipT=0;
  var TIP='Schermo intero disattivato \u2014 (tieni premuto SHIFT per tornare a schermo intero)';
  function hideBar(){ escBox.classList.remove('on'); escRing.style.setProperty('--p',0); }
  function showTip(txt,ms){
    escTx.innerHTML=txt; escBox.classList.add('on');
    clearTimeout(tipT);
    if(ms) tipT=setTimeout(function(){ if(!holding) hideBar(); },ms);
  }
  function holdStop(){
    holding=false; if(holdRaf) cancelAnimationFrame(holdRaf); holdRaf=0;
    escRing.style.setProperty('--p',0);
    if(fsEl()) hideBar(); else showTip(TIP,5000);
  }
  function holdStep(){
    if(!holding) return;
    var p=Math.min(100,(Date.now()-holdT0)/HOLD*100);
    escRing.style.setProperty('--p',p);
    if(p>=100){
      holding=false; holdRaf=0; escRing.style.setProperty('--p',100);
      whoosh(.5,.26); fsReq().then(function(){},function(){});
      setTimeout(hideBar,260);
      return;
    }
    holdRaf=requestAnimationFrame(holdStep);
  }
  function holdStart(){
    if(holding||fsEl()) return;
    holding=true; holdT0=Date.now();
    showTip('Rilascia per annullare \u2014 (SHIFT: torno a schermo intero)',0);
    holdStep();
  }
  document.addEventListener('fullscreenchange',function(){
    if(fsEl()){ clearTimeout(tipT); hideBar(); }
    else { showTip(TIP,6000); }
  });
  document.addEventListener('webkitfullscreenchange',function(){
    if(fsEl()){ clearTimeout(tipT); hideBar(); } else { showTip(TIP,6000); }
  });

  /* ---------------- MODALITA' ---------------- */
  var M=[
    {k:'ut',n:'Ultimate Team',lbl:'Entra in Ultimate Team',pv:'Pacchetti live',
     d:"Costruisci il club dei tuoi sogni: apri pacchetti con le monete, colleziona carte speciali, fai salire l'EXP fino al livello 100 e fondi i doppioni per creare le 6 stelle.",
     t:['Pacchetti','Carte speciali','Livello 100','Fusioni 6&#9733;'],
     go:function(){ kfmOpenUT(); }},
    {k:'exist',n:'Allena una squadra',lbl:'Allena una squadra',pv:'Tattica in campo',
     d:'Prendi il comando di un club reale: mercato, formazione, tattiche e obiettivi stagionali. Porta la tua squadra in cima al campionato e in Europa.',
     t:['Club reali','Mercato','Tattiche','Obiettivi'],
     go:function(){ if(typeof chooseExisting==='function') chooseExisting(); }},
    {k:'draft',n:'Draft storico',lbl:'Avvia il draft storico',pv:'Selezione a turni',
     d:'Tutti i giocatori tornano liberi: scegli a turno i campioni e costruisci una rosa irripetibile prima dei tuoi avversari.',
     t:['Rosa da zero','Turni','Leggende'],
     go:function(){ if(typeof chooseDraft==='function') chooseDraft(); }},
    {k:'zero',n:'Squadra da zero',lbl:'Crea la tua squadra',pv:'Club in costruzione',
     d:'Crea il tuo club dal nulla: nome, colori, stadio e settore giovanile. Parti dal basso e scrivi la tua storia fino ai trofei internazionali.',
     t:['Club custom','Settore giovanile','Scalata'],
     go:function(){ if(typeof chooseScratch==='function') chooseScratch(); }},
    {k:'dbedit',n:'Modifica database',lbl:'Apri l\'editor',pv:'Editor del database',
     d:'Personalizza il gioco: cambia i nomi e i loghi delle squadre e le minifaces dei giocatori. Ogni modifica vale in tutte le modalita\', dalla carriera a Ultimate Team.',
     t:['Nomi squadre','Loghi','Minifaces','Tutte le modalita\''],
     go:function(){ if(typeof kfmOpenDBE==='function') kfmOpenDBE(); }}
  ];
  var hasSv=false; try{ hasSv=(typeof window.hasSave==='function')&&!!window.hasSave(); }catch(e){}
  if(hasSv) M.push({k:'load',n:'Continua carriera',lbl:'Carica il salvataggio',pv:'Salvataggio trovato',
    d:'Riprendi esattamente da dove avevi lasciato: rosa, calendario, budget e obiettivi restano intatti.',
    t:['Salvataggio','Ripresa rapida'],
    go:function(){ if(typeof loadGame==='function') loadGame(); }});

  var PV={
    ut:'<div class="pv-card pv-c1"></div><div class="pv-card pv-c2"></div><div class="pv-card pv-c3"></div>',
    exist:'<div class="pv-pitch"></div>',
    draft:'',
    zero:'',
    load:'<div class="pv-arc"></div>'
  };
  (function(){
    var dots='<div class="pv-pitch"></div>', pos=[[22,30],[30,62],[44,44],[58,26],[58,68],[72,48]];
    for(var i=0;i<pos.length;i++) dots+='<div class="pv-dot" style="left:'+pos[i][0]+'%;top:'+pos[i][1]+'%;animation-delay:'+(i*0.18)+'s"></div>';
    PV.exist=dots;
    var r=''; for(var j=0;j<5;j++) r+='<div class="pv-reel" style="left:'+(14+j*17)+'%"><div style="animation-delay:'+(j*0.22)+'s"></div><div style="animation-delay:'+(j*0.22+0.8)+'s"></div></div>';
    PV.draft=r;
    var b=''; for(var z=0;z<7;z++) b+='<div class="pv-bar" style="left:'+(12+z*11)+'%;animation-delay:'+(z*0.14)+'s"></div>';
    PV.zero=b;
  })();

  var menuEl=document.getElementById('kfm-menu'), idx=0;
  menuEl.innerHTML=M.map(function(m,i){
    return '<div class="kfm-item'+(i===0?' on':'')+'" data-i="'+i+'" style="animation-delay:'+(0.06*i+0.15)+'s"><i>0'+(i+1)+'</i><span>'+m.n+'</span></div>';
  }).join('');
  var items=menuEl.querySelectorAll('.kfm-item');
  var bg=document.getElementById('kfm-mbg');
  var elMode=document.getElementById('kfm-cmode'), elDesc=document.getElementById('kfm-cdesc'),
      elTags=document.getElementById('kfm-ctags'), elBtn=document.getElementById('kfm-enterlbl'),
      elPrev=document.getElementById('kfm-prev'), elPvl=document.getElementById('kfm-pvlab');

  function paint(i,sound){
    idx=(i+M.length)%M.length;
    var m=M[idx];
    for(var j=0;j<items.length;j++) items[j].classList.toggle('on',j===idx);
    elMode.textContent=m.n; elDesc.innerHTML=m.d;
    elTags.innerHTML=m.t.map(function(t){ return '<span class="kfm-tag">'+t+'</span>'; }).join('');
    elBtn.textContent=m.lbl;
    elPrev.innerHTML=PV[m.k]+'<div class="kfm-pvlab">'+m.pv+'</div>';
    [elMode,elDesc,elTags,elPrev].forEach(function(el){ el.classList.remove('kfm-fade'); void el.offsetWidth; el.classList.add('kfm-fade'); });
    bg.style.transform='scale(1.02) translateX('+(idx*-0.55)+'%)';
    if(sound!==false){ whoosh(0.38,0.2); tick(560+idx*40,0.055,0.1); }
  }
  for(var i=0;i<items.length;i++) items[i].addEventListener('click',function(){ paint(+this.getAttribute('data-i')); });
  paint(0,false);

  /* ---------------- NAVIGAZIONE ---------------- */
  function toModes(){
    if(root.classList.contains('kfm-step2')) return;
    whoosh(0.7,0.34);
    root.classList.add('kfm-step2');
  }
  function toHero(){
    if(!root.classList.contains('kfm-step2')) return;
    whoosh(0.6,0.28);
    root.classList.remove('kfm-step2');
  }
  function showIntro(modes){
    live=false;
    document.documentElement.classList.remove('kfm-live');
    root.style.display='';
    void root.offsetWidth;
    root.classList.remove('kfm-gone');
    if(modes) root.classList.add('kfm-step2');
  }
  function launch(){
    var m=M[idx];
    whoosh(0.8,0.38);
    live=true;
    try{ m.go(); }catch(e){ try{ if(window.kfmRecErr) window.kfmRecErr(e&&e.message); }catch(_){} try{ console.error(e); }catch(_){} }
    document.documentElement.classList.add('kfm-live');
    requestAnimationFrame(function(){
      root.classList.add('kfm-gone');
      setTimeout(function(){ root.style.display='none'; try{ if(window.kfmWatch) window.kfmWatch(); }catch(e){} },560);
    });
  }
  document.getElementById('kfm-playbtn').onclick=function(){ ctx(); toModes(); };
  document.getElementById('kfm-enter').onclick=launch;

  document.addEventListener('keydown',function(e){
    if(e.key==='Shift'){ holdStart(); return; }
    if(root.style.display==='none'||root.classList.contains('kfm-gone')) return;
    if(!fsBox.classList.contains('off')&&fsBox.style.display!=='none'){
      if(e.key==='Enter'){ document.getElementById('kfm-fsyes').click(); }
      return;
    }
    var st2=root.classList.contains('kfm-step2');
    if(e.key==='Enter'){ st2?launch():toModes(); }
    else if(st2&&(e.key==='ArrowDown'||e.key==='ArrowRight')){ paint(idx+1); e.preventDefault(); }
    else if(st2&&(e.key==='ArrowUp'||e.key==='ArrowLeft')){ paint(idx-1); e.preventDefault(); }
  });
  document.addEventListener('keyup',function(e){
    if(e.key==='Shift'){ if(holding) holdStop(); return; }
    if(e.key!=='Escape') return;
    if(root.style.display!=='none'&&!root.classList.contains('kfm-gone')&&root.classList.contains('kfm-step2')){ toHero(); }
  });
  window.addEventListener('blur',holdStop);

  /* ---------------- STOP alle vecchie schermate ---------------- */
  window.fsAsk=function(go){ try{ go(); }catch(e){} };
  var _render=window.render;
  if(typeof _render==='function'){
    window.render=function(){
      try{
        var sc=(typeof S!=='undefined'&&S)?S.screen:null;
        if(sc==='title'||sc==='choice'){ showIntro(true); return; }
      }catch(e){}
      return _render.apply(this,arguments);
    };
  }
  window.kfmHome=function(){ whoosh(.7,.32); showIntro(true); };
  window.kfmFullscreen=function(){ fsReq().then(function(){},function(){}); };
  setTimeout(function(){ if(!live) document.documentElement.classList.remove('kfm-live'); },50);
})();
