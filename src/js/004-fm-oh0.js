
/* ==========================================================
   FM OVERHAUL SCRIPT (loaded after main game script)
   ========================================================== */
(function(){
  'use strict';

  /* ---------- 1) body data-mode so CSS can theme per screen ---------- */
  if (typeof render === 'function' && !window.__fmRenderWrapped){
    var _origRender = render;
    window.render = function(){
      var r = _origRender.apply(this, arguments);
      try { fmAfterRender(); } catch(e){ console.warn('fmAfterRender', e); }
      return r;
    };
    window.__fmRenderWrapped = true;
  }

  function fmAfterRender(){
    var mode = (typeof S!=='undefined' && S.mode) ? S.mode : '';
    document.body.setAttribute('data-mode', mode);
    if (mode === 'pano'){
      // stadium background behind the VS / advance-to-matchday hero
      var vs = document.querySelector('.fc-vs');
      if (vs){ vs.classList.add('stadium-bg-x'); }
      // THE FEED live badge
      var fh = document.querySelector('.fc-feed-h');
      if (fh && !fh.querySelector('.fc-feed-live')){
        var s = document.createElement('span'); s.className='fc-feed-live'; s.textContent='LIVE';
        fh.appendChild(s);
      }
      refreshMusicUI();
    }
  }

  /* ---------- 2) MUSIC (working, self-contained audio) ---------- */
  var MY_TRACKS = [];
  window.__MY_TRACKS = MY_TRACKS;
  try { if (typeof MUSIC!=='undefined'){ MUSIC.tracks = MY_TRACKS; MUSIC.ready = true; if (MUSIC.i==null||MUSIC.i>=MY_TRACKS.length) MUSIC.i=0; } } catch(e){}

  window.curTrack = function(){ if(!MY_TRACKS.length) return {title:'Nessun brano', artist:'Aggiungi la tua musica con +', src:'', cover:''}; if(MUSIC.i>=MY_TRACKS.length) MUSIC.i=0; return MY_TRACKS[MUSIC.i]; };

  function musicEnsure2(){
    if(!MUSIC.audio){
      MUSIC.audio = new Audio();
      MUSIC.audio.loop = false;
      MUSIC.audio.addEventListener('ended', function(){ window.musicNext(); });
      MUSIC.audio.addEventListener('timeupdate', function(){
        var b=document.getElementById('music-bar');
        if(b && MUSIC.audio.duration) b.style.width=(MUSIC.audio.currentTime/MUSIC.audio.duration*100)+'%';
      });
    }
  }
  function loadCur(){ musicEnsure2(); var t=window.curTrack(); if(MUSIC.audio.src!==t.src){ MUSIC.audio.src=t.src; } }

  window.musicPlay = function(){
    musicEnsure2(); var t=window.curTrack(); if(!t.src) return;
    if(MUSIC.audio.paused){ loadCur(); MUSIC.audio.play().catch(function(){}); }
    else { MUSIC.audio.pause(); }
    refreshMusicUI();
  };
  window.musicNext = function(){ if(!MY_TRACKS.length)return; musicEnsure2(); MUSIC.i=(MUSIC.i+1)%MY_TRACKS.length; loadCur(); MUSIC.audio.play().catch(function(){}); refreshMusicUI(); };
  window.musicPrev = function(){ if(!MY_TRACKS.length)return; musicEnsure2(); MUSIC.i=(MUSIC.i-1+MY_TRACKS.length)%MY_TRACKS.length; loadCur(); MUSIC.audio.play().catch(function(){}); refreshMusicUI(); };

  window.refreshMusicUI = function(){
    var t=window.curTrack();
    var nm=document.getElementById('music-title'), ar=document.getElementById('music-artist'), st=document.getElementById('music-state');
    if(nm)nm.textContent=t.title; if(ar)ar.textContent=t.artist;
    if(st)st.textContent=(MUSIC.audio && !MUSIC.audio.paused)?'❚❚':'▶';
  };

  window.musicPlayerHTML = function(){
    var t=window.curTrack();
    var art='https://ui-avatars.com/api/?name='+encodeURIComponent(t.title)+'&background=0bbbe6&color=04222b&bold=true';
    return '<div class="fc-music">'+
      '<img class="fc-music-art" src="'+art+'" onerror="this.style.visibility=\'hidden\'">'+
      '<div class="fc-music-meta"><div id="music-title" class="fc-music-title">'+t.title+'</div>'+
      '<div id="music-artist" class="fc-music-artist">'+t.artist+'</div>'+
      '<div class="fc-music-track"><div id="music-bar" class="fc-music-bar"></div></div></div>'+
      '<div class="fc-music-ctrl"><button onclick="musicPrev()">⏮</button>'+
      '<button id="music-state" onclick="musicPlay()">▶</button>'+
      '<button onclick="musicNext()">⏭</button></div></div>';
  };

  /* ---------- 3) FORMATIONS ---------- */
  var FORMATIONS = {
    '4-3-3':   [{role:'POR',x:50,y:87},{role:'TS',x:18,y:66},{role:'DC',x:38,y:72},{role:'DC',x:62,y:72},{role:'TD',x:82,y:66},{role:'CC',x:30,y:47},{role:'CDC',x:50,y:57},{role:'CC',x:70,y:47},{role:'AS',x:22,y:24},{role:'ATT',x:50,y:15},{role:'AD',x:78,y:24}],
    '4-2-3-1': [{role:'POR',x:50,y:87},{role:'TS',x:16,y:66},{role:'DC',x:38,y:72},{role:'DC',x:62,y:72},{role:'TD',x:84,y:66},{role:'CDC',x:37,y:55},{role:'CDC',x:63,y:55},{role:'COC',x:50,y:37},{role:'AS',x:19,y:31},{role:'ATT',x:50,y:14},{role:'AD',x:81,y:31}],
    '4-4-2':   [{role:'POR',x:50,y:87},{role:'TS',x:16,y:66},{role:'DC',x:38,y:72},{role:'DC',x:62,y:72},{role:'TD',x:84,y:66},{role:'ES',x:16,y:45},{role:'CC',x:40,y:49},{role:'CC',x:60,y:49},{role:'ED',x:84,y:45},{role:'ATT',x:40,y:17},{role:'ATT',x:60,y:17}],
    '3-5-2':   [{role:'POR',x:50,y:87},{role:'DC',x:30,y:74},{role:'DC',x:50,y:77},{role:'DC',x:70,y:74},{role:'ES',x:11,y:49},{role:'CC',x:35,y:53},{role:'CDC',x:50,y:59},{role:'CC',x:65,y:53},{role:'ED',x:89,y:49},{role:'ATT',x:40,y:16},{role:'ATT',x:60,y:16}],
    '4-1-4-1': [{role:'POR',x:50,y:87},{role:'TS',x:16,y:66},{role:'DC',x:38,y:72},{role:'DC',x:62,y:72},{role:'TD',x:84,y:66},{role:'CDC',x:50,y:58},{role:'AS',x:16,y:40},{role:'CC',x:38,y:45},{role:'CC',x:62,y:45},{role:'AD',x:84,y:40},{role:'ATT',x:50,y:15}]
  };
  var FORM_DESC = { '4-3-3':'Equilibrato', '4-2-3-1':'Trequartista', '4-4-2':'Due punte', '3-5-2':'Esterni alti', '4-1-4-1':'Copertura' };
  window.FM_FORMATIONS = FORMATIONS;

  function curLayout(){
    if(!S.formationName || !FORMATIONS[S.formationName]) S.formationName='4-3-3';
    return FORMATIONS[S.formationName];
  }
  window.setFormationLayout = function(name){
    if(!FORMATIONS[name]) return;
    S.formationName = name;
    if(typeof recalcStrength==='function') recalcStrength();
    if(typeof toast==='function') toast('⚽ Modulo impostato: '+name);
    render();
  };
  window.rosaSetTab = function(t){ S.rosaTab=t; render(); };

  /* ---------- 4) player-detail helpers ---------- */
  function attrColor(v){ v=parseInt(v)||0; return v>=82?'linear-gradient(90deg,#00e676,#00b85a)': v>=70?'linear-gradient(90deg,#ffd24a,#f0a92e)': v>=55?'linear-gradient(90deg,#ff9f43,#f0742e)':'linear-gradient(90deg,#ff5b6e,#e0384a)'; }
  function attrRow(lab,val){ val=parseInt(val)||0; return '<div class="fm-attr"><div class="fm-attr-top"><span>'+lab+'</span><b>'+val+'</b></div><div class="fm-attr-bar"><div class="fm-attr-fill" style="width:'+Math.min(100,val)+'%;background:'+attrColor(val)+'"></div></div></div>'; }
  var _ROLE_IT = (typeof ROLE_IT!=='undefined')?ROLE_IT:{};
  function posName(r){ return _ROLE_IT[r]||r; }

  function fmPositions(p){
    var main=p.roles&&p.roles[0]?p.roles[0]:'';
    var alts=[];
    (p.roles||[]).slice(1).forEach(function(r){ if(alts.indexOf(r)<0) alts.push(r); });
    if(typeof ROLEMAP!=='undefined' && ROLEMAP[main]){ ROLEMAP[main].forEach(function(r){ if(r!==main && alts.indexOf(r)<0) alts.push(r); }); }
    var html='<span class="fm-pos main" title="'+posName(main)+'">'+main+'</span>';
    alts.slice(0,5).forEach(function(r){ html+='<span class="fm-pos" title="'+posName(r)+'">'+r+'</span>'; });
    return html;
  }

  window.fmDetail = function(x, navInfo){
    var p=x.p;
    var pot=p.pot||p.rate, growing=pot>p.rate&&p.age<=23;
    var piede=(p.name.charCodeAt(0)%4===0)?'Sinistro':'Destro';
    var val=(typeof playerPrice==='function')?playerPrice(p):'-';
    var wage=p.wage||((typeof playerWage==='function')?playerWage(p):Math.max(5,p.rate));
    var img=p.img||(typeof AVP!=='undefined'?AVP:'');
    var nav='';
    if(navInfo){
      nav='<div class="fm-dnav"><button onclick="rosaDetNav(-1)" title="Precedente (←)">‹</button>'+
        '<div class="fm-dnav-mid">GIOCATORE <b>'+(navInfo.i+1)+'</b> / '+navInfo.n+'<small>R o ← → per scorrere</small></div>'+
        '<button onclick="rosaDetNav(1)" title="Successivo (→)">›</button></div>';
    }
    var first=(p.name.split(' ')[0]||''), last=(p.name.split(' ').slice(1).join(' ')||p.name);
    return nav+
      '<div class="fm-dhead">'+
        '<img src="'+img+'" onerror="this.src=(typeof AVP!==\'undefined\'?AVP:\'\')">'+
        '<div><div class="fm-dovr">'+p.rate+'<small>OVERALL</small></div></div>'+
        '<div style="margin-left:auto;text-align:right"><div class="fm-dname1">'+first+'</div><div class="fm-dname2">'+last+'</div><div class="fm-dnat">'+(p.nation||'')+'</div></div>'+
      '</div>'+
      '<div class="fm-dsec-h">Dove può giocare</div>'+
      '<div class="fm-poslist">'+fmPositions(p)+'</div>'+
      '<div class="fm-dsec-h">Informazioni</div>'+
      '<div class="fm-dgrid">'+
        '<div><span>Età</span><b>'+p.age+' anni</b></div>'+
        '<div><span>Potenziale</span><b>'+pot+(growing?' ▲':'')+'</b></div>'+
        '<div><span>Piede</span><b>'+piede+'</b></div>'+
        '<div><span>Valore</span><b>€'+val+'M</b></div>'+
        '<div><span>Ingaggio</span><b>€'+wage+'k/sett.</b></div>'+
        '<div><span>Contratto</span><b>'+(p.contractYears?p.contractYears+' anni':'—')+'</b></div>'+
        '<div><span>Forma</span><b>'+(p._form||'Buona')+'</b></div>'+
        '<div><span>Morale</span><b>'+((p.listT||p.listL)?'Incerto':'Felice')+'</b></div>'+
      '</div>'+
      '<div class="fm-dsec-h">Attributi</div>'+
        attrRow('Velocità',p.pac)+attrRow('Tiro',p.sho)+attrRow('Passaggi',p.pas)+
        attrRow('Dribbling',p.dri)+attrRow('Difesa',p.def)+attrRow('Fisico',p.phy)+
      '<div class="fm-dact">'+
        '<button class="'+(p.listT?'on':'')+'" onclick="toggleList(\''+x.loc+'\','+x.idx+',\'T\')">'+(p.listT?'✓ In lista trasf.':'Lista trasferimenti')+'</button>'+
        '<button class="'+(p.listL?'on':'')+'" onclick="toggleList(\''+x.loc+'\','+x.idx+',\'L\')">'+(p.listL?'✓ In lista prestiti':'Lista prestiti')+'</button>'+
        '<button class="renew" onclick="renewContract(\''+x.loc+'\','+x.idx+')">🔁 Negozia rinnovo</button>'+
        '<button class="rel" onclick="releasePlayer(\''+x.loc+'\','+x.idx+')">✖ Svincola</button>'+
      '</div>'+
      '<p class="fm-dhint">Scorri i giocatori con R o le frecce. Metti un giocatore in lista per ricevere offerte dopo le partite. Rinnova per blindarlo o svincolalo per liberare un posto.</p>';
  };

  /* detail navigation */
  window.rosaDetNav = function(d){
    var all=squadAll(); if(!all.length) return;
    if(S.rosaDetIdx==null) S.rosaDetIdx=0;
    S.rosaDetIdx=((S.rosaDetIdx+d)%all.length+all.length)%all.length;
    render();
  };
  window.rosaPick = function(loc,idx){
    var all=squadAll();
    var k=-1; for(var i=0;i<all.length;i++){ if(all[i].loc===loc&&all[i].idx===idx){k=i;break;} }
    if(k>=0) S.rosaDetIdx=k;
    window.rosaTap(loc,idx);
  };

  // keyboard scroll (R + arrows) while on squad screen
  if(!window.__fmKeys){
    window.__fmKeys=true;
    document.addEventListener('keydown', function(e){
      if(typeof S==='undefined' || S.mode!=='rosa') return;
      var k=e.key;
      if(k==='ArrowRight'||k==='ArrowDown'||k==='r'||k==='R'){ rosaDetNav(1); e.preventDefault(); }
      else if(k==='ArrowLeft'||k==='ArrowUp'){ rosaDetNav(-1); e.preventDefault(); }
    });
  }

  /* ---------- 5) new SQUAD screen (renderRosa) ---------- */
  window.renderRosa = function(){
    var layout=curLayout();
    var all=squadAll();
    if(S.rosaDetIdx==null || S.rosaDetIdx>=all.length) S.rosaDetIdx=0;
    var tab=S.rosaTab||'squadra';
    var sel=S.rosaSel;
    var detX=all[S.rosaDetIdx]||null;

    var nodes=layout.map(function(s,id){
      var p=S.draft.xi[id];
      var isSel = sel && sel.type==='xi' && sel.idx===id;
      var isDet = detX && detX.loc==='xi' && detX.idx===id;
      var inner;
      if(p){
        var susp=(window._isInjured&&window._isInjured(p.name))?(window.FMI?FMI('injury',13).replace('class="fi"','style="color:#ff8a3c;vertical-align:middle" class="fi"'):''):((typeof _isSusp==='function'&&_isSusp(p.name))?(window.FMI?FMI('red',12).replace('class="fi"','style="color:#e0384a;vertical-align:middle" class="fi"'):''):'');
        inner='<img src="'+p.img+'" onerror="this.src=(typeof AVP!==\'undefined\'?AVP:\'\')">'+
          '<span class="fn-r">'+p.rate+'</span>'+
          '<span class="fn-n">'+susp+p.name.split(' ').pop()+'</span>'+
          '<span class="fn-pos">'+(p.roles&&p.roles[0]||s.role)+'</span>';
      } else {
        inner='<span class="fn-role">'+s.role+'</span>';
      }
      return '<div class="fm-node'+(isSel?' sel':'')+(isDet?' det':'')+'" style="left:'+s.x+'%;top:'+s.y+'%" onclick="rosaPick(\'xi\','+id+')">'+inner+'</div>';
    }).join('');

    var bench=S.bench.map(function(p,i){
      var isSel = sel && sel.type==='bench' && sel.idx===i;
      return '<div class="fm-bcard'+(isSel?' sel':'')+'" onclick="rosaPick(\'bench\','+i+')">'+
        '<img src="'+p.img+'" onerror="this.src=(typeof AVP!==\'undefined\'?AVP:\'\')">'+
        '<div><div class="fb-n">'+p.name.split(' ').pop()+'</div><div class="fb-p">'+(p.roles[0])+' · '+p.age+'a</div></div>'+
        '<div class="fb-r">'+p.rate+'</div></div>';
    }).join('');

    var pitch='<div class="fm-pitchwrap">'+
      '<div class="fm-pitch"><div class="fm-pitch-mid"></div><div class="fm-pitch-circ"></div>'+nodes+'</div>'+
      '<div class="fm-bench"><div class="fm-bench-h">Panchina e riserve ('+S.bench.length+')</div>'+
        '<div class="fm-bench-grid">'+(bench||'<div style="color:#8ea0b5;font-size:12px;padding:10px;">Nessuna riserva. Acquista dalla sezione Mercato.</div>')+'</div></div>'+
      '</div>';

    var right;
    if(tab==='formazione'){
      var fbtns=Object.keys(FORMATIONS).map(function(name){
        var on=(S.formationName===name)?' on':'';
        return '<div class="fm-formbtn'+on+'" onclick="setFormationLayout(\''+name+'\')">'+name+'<small>'+(FORM_DESC[name]||'')+'</small></div>';
      }).join('');
      right='<div class="fm-detail"><div class="fm-dsec-h" style="margin-top:0">Modulo di gioco</div>'+
        '<p class="fm-form-hint">Scegli il modulo: i giocatori si riposizioneranno in campo. Usa “Schiera miglior XI” per riempire gli slot con i migliori disponibili.</p>'+
        '<div class="fm-formgrid">'+fbtns+'</div>'+
        '<div class="fm-dsec-h">Modulo attuale</div>'+
        '<div class="fm-dgrid"><div><span>Modulo</span><b>'+S.formationName+'</b></div><div><span>OVR squadra</span><b>'+S.strength+'</b></div></div>'+
        '</div>';
    } else {
      right='<div class="fm-detail">'+ (detX?fmDetail(detX,{i:S.rosaDetIdx,n:all.length}):'<div style="padding:24px;color:#8ea0b5">Nessun giocatore.</div>') +'</div>';
    }

    return '<div class="fm-squad rosa-fm-bg-x">'+
      '<div class="fm-sq-top">'+
        '<div><div class="fm-sq-title">Gestione squadra</div>'+
          '<div class="fm-sq-sub">Tocca un titolare e poi un altro (o una riserva) per scambiarli · OVR squadra: <b style="color:#fff">'+S.strength+'</b></div></div>'+
        '<div class="fm-tabs">'+
          '<div class="fm-tab'+(tab==='squadra'?' on':'')+'" onclick="rosaSetTab(\'squadra\')">Squadra</div>'+
          '<div class="fm-tab'+(tab==='formazione'?' on':'')+'" onclick="rosaSetTab(\'formazione\')">Formazione</div>'+
        '</div>'+
      '</div>'+
      '<div class="fm-sq-actions" style="margin-bottom:14px">'+
        '<button class="fm-abtn prim" onclick="autoBestXI()">⚡ Schiera miglior XI</button>'+
        '<button class="fm-abtn" onclick="setMode(\'squadhub\')">📋 Hub Rosa'+(S.offers&&S.offers.length?' ('+S.offers.length+')':'')+'</button>'+
        '<button class="fm-abtn" onclick="setMode(\'contratti\')">📝 Contratti</button>'+
      '</div>'+
      '<div class="fm-sq-grid"><div>'+pitch+'</div>'+right+'</div>'+
    '</div>';
  };

  // ensure defaults
  try { if(typeof S!=='undefined'){ if(!S.formationName) S.formationName='4-3-3'; if(S.rosaTab==null) S.rosaTab='squadra'; } } catch(e){}
  // initial paint of theme class
  try { if(typeof S!=='undefined') document.body.setAttribute('data-mode', S.mode||''); } catch(e){}
})();

