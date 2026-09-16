
/* ================= FM OVERHAUL v4 (loads after v3, after gkstats) ================= */
(function(){
  'use strict';
  var I=window.FMI||function(){return '';};
  function clubLogo4(n){ try{ if(typeof EADB!=='undefined'&&EADB[n]&&typeof getLogo==='function') return getLogo(EADB[n].tid, n); }catch(e){} return ''; }
  function seed(s){ var h=0; s=String(s||''); for(var i=0;i<s.length;i++){ h=(h*31+s.charCodeAt(i))>>>0; } return h>>>0; }
  var XSVG='<svg class="fi" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  var RENEWSVG='<svg class="fi" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8 8 0 1 0-.5 3M20 5v6h-6"/></svg>';

  /* ---------- more formations ---------- */
  var FT={
    '4-3-3':   [{role:'POR',x:50,y:88},{role:'TS',x:18,y:67},{role:'DC',x:38,y:73},{role:'DC',x:62,y:73},{role:'TD',x:82,y:67},{role:'CC',x:30,y:48},{role:'CDC',x:50,y:58},{role:'CC',x:70,y:48},{role:'AS',x:22,y:24},{role:'ATT',x:50,y:15},{role:'AD',x:78,y:24}],
    '4-2-3-1': [{role:'POR',x:50,y:88},{role:'TS',x:16,y:67},{role:'DC',x:38,y:73},{role:'DC',x:62,y:73},{role:'TD',x:84,y:67},{role:'CDC',x:37,y:56},{role:'CDC',x:63,y:56},{role:'COC',x:50,y:37},{role:'AS',x:19,y:30},{role:'ATT',x:50,y:14},{role:'AD',x:81,y:30}],
    '4-4-2':   [{role:'POR',x:50,y:88},{role:'TS',x:16,y:67},{role:'DC',x:38,y:73},{role:'DC',x:62,y:73},{role:'TD',x:84,y:67},{role:'ES',x:16,y:46},{role:'CC',x:40,y:50},{role:'CC',x:60,y:50},{role:'ED',x:84,y:46},{role:'ATT',x:40,y:17},{role:'ATT',x:60,y:17}],
    '4-4-2 Diamante':[{role:'POR',x:50,y:88},{role:'TS',x:16,y:67},{role:'DC',x:38,y:73},{role:'DC',x:62,y:73},{role:'TD',x:84,y:67},{role:'CDC',x:50,y:60},{role:'CC',x:26,y:47},{role:'CC',x:74,y:47},{role:'COC',x:50,y:34},{role:'ATT',x:40,y:16},{role:'ATT',x:60,y:16}],
    '3-5-2':   [{role:'POR',x:50,y:88},{role:'DC',x:30,y:74},{role:'DC',x:50,y:77},{role:'DC',x:70,y:74},{role:'ES',x:11,y:50},{role:'CC',x:35,y:54},{role:'CDC',x:50,y:60},{role:'CC',x:65,y:54},{role:'ED',x:89,y:50},{role:'ATT',x:40,y:16},{role:'ATT',x:60,y:16}],
    '3-4-3':   [{role:'POR',x:50,y:88},{role:'DC',x:30,y:74},{role:'DC',x:50,y:77},{role:'DC',x:70,y:74},{role:'ES',x:13,y:50},{role:'CC',x:38,y:54},{role:'CC',x:62,y:54},{role:'ED',x:87,y:50},{role:'AS',x:24,y:22},{role:'ATT',x:50,y:15},{role:'AD',x:76,y:22}],
    '4-1-4-1': [{role:'POR',x:50,y:88},{role:'TS',x:16,y:67},{role:'DC',x:38,y:73},{role:'DC',x:62,y:73},{role:'TD',x:84,y:67},{role:'CDC',x:50,y:59},{role:'AS',x:16,y:41},{role:'CC',x:38,y:46},{role:'CC',x:62,y:46},{role:'AD',x:84,y:41},{role:'ATT',x:50,y:15}]  ,
    '4-3-1-2': [{role:'POR',x:50,y:88},{role:'TS',x:16,y:67},{role:'DC',x:38,y:73},{role:'DC',x:62,y:73},{role:'TD',x:84,y:67},{role:'CC',x:28,y:52},{role:'CDC',x:50,y:58},{role:'CC',x:72,y:52},{role:'COC',x:50,y:35},{role:'ATT',x:40,y:16},{role:'ATT',x:60,y:16}],
    '5-3-2':   [{role:'POR',x:50,y:89},{role:'ES',x:10,y:60},{role:'DC',x:30,y:74},{role:'DC',x:50,y:77},{role:'DC',x:70,y:74},{role:'ED',x:90,y:60},{role:'CC',x:32,y:50},{role:'CDC',x:50,y:55},{role:'CC',x:68,y:50},{role:'ATT',x:40,y:18},{role:'ATT',x:60,y:18}],
    '4-2-4':   [{role:'POR',x:50,y:88},{role:'TS',x:16,y:67},{role:'DC',x:38,y:73},{role:'DC',x:62,y:73},{role:'TD',x:84,y:67},{role:'CC',x:36,y:52},{role:'CC',x:64,y:52},{role:'AS',x:16,y:26},{role:'ATT',x:40,y:16},{role:'ATT',x:60,y:16},{role:'AD',x:84,y:26}],
    '3-4-2-1': [{role:'POR',x:50,y:88},{role:'DC',x:30,y:74},{role:'DC',x:50,y:77},{role:'DC',x:70,y:74},{role:'ES',x:13,y:50},{role:'CC',x:38,y:55},{role:'CC',x:62,y:55},{role:'ED',x:87,y:50},{role:'COC',x:34,y:32},{role:'COC',x:66,y:32},{role:'ATT',x:50,y:15}]
  };
  var FDESC={ '4-3-3':'Equilibrato','4-2-3-1':'Trequartista','4-4-2':'Due punte','4-4-2 Diamante':'Rombo','3-5-2':'Esterni alti','3-4-3':'Offensivo','4-1-4-1':'Copertura','4-3-1-2':'Stretto','5-3-2':'Difensivo','4-2-4':'Ultra-off.','3-4-2-1':'Trequartisti' };
  window.FM_FORMATIONS2=FT;
  window.FM_FORMDESC=FDESC;
  function curLayout(){ if(!S.formationName||!FT[S.formationName]) S.formationName='4-3-3'; return FT[S.formationName]; }
  window.setFormationLayout=function(name){ if(!FT[name]) return; S.formationName=name; S._animOnce=true; if(typeof recalcStrength==='function') recalcStrength(); if(typeof toast==='function') toast(I('grid',14)+' Modulo impostato: <b>'+name+'</b>'); render(); };
  window.rosaSetTab=function(t){ S.rosaTab=t; if(t==='formazione') S._animOnce=true; render(); };

  /* ---------- GK-aware, compact, premium-icon detail ---------- */
  function attrColor(v){ v=parseInt(v)||0; return v>=82?'linear-gradient(90deg,#00e676,#00b85a)': v>=70?'linear-gradient(90deg,#ffd24a,#f0a92e)': v>=55?'linear-gradient(90deg,#ff9f43,#f0742e)':'linear-gradient(90deg,#ff5b6e,#e0384a)'; }
  function attrRow(lab,val){ val=parseInt(val)||0; return '<div class="fm-attr"><div class="fm-attr-top"><span>'+lab+'</span><b>'+val+'</b></div><div class="fm-attr-bar"><div class="fm-attr-fill" style="width:'+Math.min(100,val)+'%;background:'+attrColor(val)+'"></div></div></div>'; }
  var _ROLE_IT=(typeof ROLE_IT!=='undefined')?ROLE_IT:{};
  function posName(r){ return _ROLE_IT[r]||r; }
  function fmPositions(p){ var main=p.roles&&p.roles[0]?p.roles[0]:''; var alts=[]; (p.roles||[]).slice(1).forEach(function(r){ if(alts.indexOf(r)<0) alts.push(r); }); if(typeof ROLEMAP!=='undefined'&&ROLEMAP[main]){ ROLEMAP[main].forEach(function(r){ if(r!==main&&alts.indexOf(r)<0) alts.push(r); }); } var html='<span class="fm-pos main" title="'+posName(main)+'">'+main+'</span>'; alts.slice(0,5).forEach(function(r){ html+='<span class="fm-pos" title="'+posName(r)+'">'+r+'</span>'; }); return html; }
  function gkStats(p){ var g=(window.__GK&&p.pid)?window.__GK[String(p.pid)]:null; if(g) return {d:g[0],h:g[1],k:g[2],po:g[3],re:g[4],sp:g[5]}; var b=p.rate||60,sd=seed(p.name); function v(o){ return Math.max(42,Math.min(99,b+o)); } return {d:v((sd%7)-3),h:v(((sd>>2)%7)-3),k:v(((sd>>4)%11)-6),po:v(((sd>>6)%7)-3),re:v(((sd>>8)%6)-2),sp:p.pac||v(-9)}; }

  window.fmDetail=function(x,navInfo){
    var p=x.p; var pot=p.pot||p.rate, growing=pot>p.rate&&p.age<=23;
    var piede=(p.foot==='Left'||p.foot==='left')?'Sinistro':(p.foot==='Right'||p.foot==='right')?'Destro':(p.foot||((p.name.charCodeAt(0)%4===0)?'Sinistro':'Destro'));
    var val=(typeof playerPrice==='function')?playerPrice(p):'-';
    var wage=p.wage||((typeof playerWage==='function')?playerWage(p):Math.max(5,p.rate));
    var img=p.img||(typeof AVP!=='undefined'?AVP:'');
    var isGK=(p.roles&&p.roles[0]==='POR');
    var attrs;
    if(isGK){ var g=gkStats(p); attrs=attrRow('Tuffo',g.d)+attrRow('Presa',g.h)+attrRow('Riflessi',g.re)+attrRow('Piazzamento',g.po)+attrRow('Rinvio',g.k)+attrRow('Velocit\u00e0',g.sp); }
    else attrs=attrRow('Velocit\u00e0',p.pac)+attrRow('Tiro',p.sho)+attrRow('Passaggi',p.pas)+attrRow('Dribbling',p.dri)+attrRow('Difesa',p.def)+attrRow('Fisico',p.phy);
    var nav='';
    if(navInfo){ nav='<div class="fm-dnav"><button onclick="rosaDetNav(-1)" title="Precedente">'+I('advance',15).replace('M5 5l7 7-7 7M12 5l7 7-7 7','M15 5l-7 7 7 7M8 5l-7 7 7 7')+'</button><div class="fm-dnav-mid">GIOCATORE <b>'+(navInfo.i+1)+'</b> / '+navInfo.n+'<small>R o \u2190 \u2192 per scorrere</small></div><button onclick="rosaDetNav(1)" title="Successivo">'+I('advance',15)+'</button></div>'; }
    var loan='';
    if(p.loanFrom){ var _lgi=clubLogo4(p.loanFrom); loan='<div class="fm-loan in">'+I('swap',15)+(_lgi?'<img src="'+_lgi+'">':'')+' In prestito da <b>'+p.loanFrom+'</b>'+(p.loanYears?(' \u00b7 rientro tra '+p.loanYears+' anno/i'):'')+'</div>'; }
    else if(p.loanTo) loan='<div class="fm-loan">'+I('swap',15)+' Ceduto in prestito a <b>'+p.loanTo+'</b>'+(p.loanYears?(' \u00b7 rientro tra '+p.loanYears+' anno/i'):'')+'</div>';
    var first=(p.name.split(' ')[0]||''), last=(p.name.split(' ').slice(1).join(' ')||p.name);
    return nav+
      '<div class="fm-dhead"><img src="'+img+'" onerror="this.src=(typeof AVP!==\'undefined\'?AVP:\'\')"><div><div class="fm-dovr">'+p.rate+'<small>OVERALL</small></div></div><div style="margin-left:auto;text-align:right"><div class="fm-dname1">'+first+'</div><div class="fm-dname2">'+last+'</div><div class="fm-dnat">'+(p.nation||'')+'</div></div></div>'+
      loan+
      '<div class="fm-dsec-h">'+I('scout',13)+' Dove pu\u00f2 giocare</div><div class="fm-poslist">'+fmPositions(p)+'</div>'+
      '<div class="fm-dsec-h">'+I('news',13)+' Informazioni</div><div class="fm-dgrid"><div><span>Et\u00e0</span><b>'+p.age+' anni</b></div><div><span>Potenziale</span><b>'+pot+(growing?' \u25b2':'')+'</b></div><div><span>Piede</span><b>'+piede+'</b></div><div><span>Valore</span><b>\u20ac'+val+'M</b></div><div><span>Ingaggio</span><b>\u20ac'+wage+'k</b></div><div><span>Contratto</span><b>'+(p.contractYears?p.contractYears+' anni':'\u2014')+'</b></div></div>'+
      '<div class="fm-dsec-h">'+I('chart',13)+' '+(isGK?'Attributi portiere':'Attributi')+'</div>'+attrs+
      '<div class="fm-dact"><button class="'+(p.listT?'on':'')+'" onclick="toggleList(\''+x.loc+'\','+x.idx+',\'T\')">'+I('swap',14)+(p.listT?' In lista':' Trasferimenti')+'</button><button class="'+(p.listL?'on':'')+'" onclick="toggleList(\''+x.loc+'\','+x.idx+',\'L\')">'+I('swap',14)+(p.listL?' In lista':' Prestiti')+'</button><button class="renew" onclick="renewContract(\''+x.loc+'\','+x.idx+')">'+RENEWSVG+' Rinnova</button><button class="rel" onclick="releasePlayer(\''+x.loc+'\','+x.idx+')">'+XSVG+' Svincola</button></div>';
  };

  /* ---------- selection model ---------- */
  function _getP(loc,idx){ return loc==='xi'?S.draft.xi[idx]:S.bench[idx]; }
  function _focus(loc,idx){ var all=squadAll(); for(var i=0;i<all.length;i++){ if(all[i].loc===loc&&all[i].idx===idx){ S.rosaDetIdx=i; return; } } }
  function _doSwap(a,b){
    var pa=_getP(a.loc,a.idx), pb=_getP(b.loc,b.idx);
    var intoXi=(a.loc==='bench'&&b.loc==='xi')?pa:((a.loc==='xi'&&b.loc==='bench')?pb:null);
    if(intoXi && window._isInjured && window._isInjured(intoXi.name)){ if(typeof toast==='function') toast(I('injury',14)+' '+intoXi.name+' \u00e8 infortunato: non pu\u00f2 essere schierato'); return; }
    if(a.loc==='xi'&&b.loc==='xi'){ var t=S.draft.xi[a.idx]; S.draft.xi[a.idx]=S.draft.xi[b.idx]; S.draft.xi[b.idx]=t; }
    else if(a.loc==='xi'&&b.loc==='bench'){ var t2=S.draft.xi[a.idx]; S.draft.xi[a.idx]=S.bench[b.idx]; if(t2) S.bench[b.idx]=t2; else S.bench.splice(b.idx,1); }
    else if(a.loc==='bench'&&b.loc==='xi'){ var t3=S.draft.xi[b.idx]; S.draft.xi[b.idx]=S.bench[a.idx]; if(t3) S.bench[a.idx]=t3; else S.bench.splice(a.idx,1); }
    else { var t4=S.bench[a.idx]; S.bench[a.idx]=S.bench[b.idx]; S.bench[b.idx]=t4; }
    if(typeof recalcStrength==='function') recalcStrength();
    _focus(b.loc,b.idx);
  }
  var _rct=null;
  function _single(loc,idx){
    var armed=S.rosaArmed;
    if(armed && !(armed.loc===loc&&armed.idx===idx) && _getP(armed.loc,armed.idx)){ _doSwap(armed,{loc:loc,idx:idx}); S.rosaArmed=null; render(); return; }
    _focus(loc,idx); render();
  }
  function _double(loc,idx){
    if(loc==='xi' && !_getP('xi',idx)){ _focus(loc,idx); render(); return; }
    if(S.rosaArmed && S.rosaArmed.loc===loc && S.rosaArmed.idx===idx) S.rosaArmed=null; else S.rosaArmed={loc:loc,idx:idx};
    _focus(loc,idx); render();
  }
  window.rosaClick=function(loc,idx){ if(_rct){ clearTimeout(_rct); } _rct=setTimeout(function(){ _rct=null; _single(loc,idx); },210); };
  window.rosaArm=function(loc,idx){ if(_rct){ clearTimeout(_rct); _rct=null; } _double(loc,idx); };
  window.rosaDetNav=function(d){ var all=squadAll(); if(!all.length) return; if(S.rosaDetIdx==null) S.rosaDetIdx=0; S.rosaDetIdx=((S.rosaDetIdx+d)%all.length+all.length)%all.length; render(); _afterFocus(); };
  window.benchOpen=function(v){
    try{
      S._benchOpen=!!v;
      var b=document.querySelector('.fm-bench');
      if(b) b.classList.toggle('open',!!v);
      var g=document.getElementById('fm-bench-grid');
      if(g&&!v) g.classList.remove('raised');
    }catch(e){}
  };
  function _afterFocus(){ try{ var all=squadAll(); var f=all[S.rosaDetIdx]; if(f&&f.loc==='bench'){ S._benchOpen=true; var bb=document.querySelector('.fm-bench'); if(bb) bb.classList.add('open'); var g=document.getElementById('fm-bench-grid'); if(g){ g.classList.add('raised'); var c=g.querySelector('[data-bench="'+f.idx+'"]'); if(c&&c.scrollIntoView) c.scrollIntoView({block:'nearest',inline:'nearest'}); } } }catch(e){} }
  if(!window.__fmKeys4){ window.__fmKeys4=true; document.addEventListener('keydown',function(e){ if(typeof S==='undefined'||S.mode!=='rosa') return; if(e.key==='Enter'){ var all=squadAll(); var f=all[S.rosaDetIdx]; if(S.rosaArmed&&f&&!(S.rosaArmed.loc===f.loc&&S.rosaArmed.idx===f.idx)){ _doSwap(S.rosaArmed,{loc:f.loc,idx:f.idx}); S.rosaArmed=null; render(); e.preventDefault(); } } else if(e.key==='Escape'){ if(S.rosaArmed){ S.rosaArmed=null; render(); } } }); }

  /* ---------- SQUAD SCREEN ---------- */
  window.renderRosa=function(){
    var layout=curLayout(); var all=squadAll();
    if(S.rosaDetIdx==null||S.rosaDetIdx>=all.length) S.rosaDetIdx=0;
    var tab=S.rosaTab||'squadra'; var armed=S.rosaArmed; var detX=all[S.rosaDetIdx]||null;
    function isArmed(loc,idx){ return armed&&armed.loc===loc&&armed.idx===idx; }
    function isFocus(loc,idx){ return detX&&detX.loc===loc&&detX.idx===idx; }
    function statusIcon(p){ if(window._isInjured&&window._isInjured(p.name)) return I('injury',13).replace('class="fi"','style="color:#ff8a3c;vertical-align:middle" class="fi"'); if(typeof _isSusp==='function'&&_isSusp(p.name)) return I('red',12).replace('class="fi"','style="color:#e0384a;vertical-align:middle" class="fi"'); return ''; }
    var nodes=layout.map(function(s,id){ var p=S.draft.xi[id]; var cls='fm-node'+(isFocus('xi',id)?' det':'')+(isArmed('xi',id)?' armed':''); var inner; if(p){ var _ln=p.loanFrom?('<span class="fn-loan">'+((clubLogo4(p.loanFrom))?'<img src="'+clubLogo4(p.loanFrom)+'">':'')+'\u2190</span>'):''; inner=_ln+'<img src="'+p.img+'" onerror="this.src=(typeof AVP!==\'undefined\'?AVP:\'\')"><span class="fn-r">'+p.rate+'</span><span class="fn-n">'+statusIcon(p)+p.name.split(' ').pop()+'</span><span class="fn-pos">'+(p.roles&&p.roles[0]||s.role)+'</span>'; } else inner='<span class="fn-role">'+s.role+'</span>'; return '<div class="'+cls+'" style="left:'+s.x+'%;top:'+s.y+'%" onclick="rosaClick(\'xi\','+id+')" ondblclick="rosaArm(\'xi\','+id+')">'+inner+'</div>'; }).join('');
    var bench=S.bench.map(function(p,i){ var cls='fm-bcard'+(isFocus('bench',i)?' det':'')+(isArmed('bench',i)?' armed':''); var _lb=p.loanFrom?('<span class="fb-loan">'+((clubLogo4(p.loanFrom))?'<img src="'+clubLogo4(p.loanFrom)+'">':'')+'\u2190</span>'):''; return '<div class="'+cls+'" data-bench="'+i+'" onclick="rosaClick(\'bench\','+i+')" ondblclick="rosaArm(\'bench\','+i+')">'+_lb+'<img src="'+p.img+'" onerror="this.src=(typeof AVP!==\'undefined\'?AVP:\'\')"><div><div class="fb-n">'+statusIcon(p)+p.name.split(' ').pop()+'</div><div class="fb-p">'+(p.roles[0])+' \u00b7 '+p.age+'a</div></div><div class="fb-r">'+p.rate+'</div></div>'; }).join('');
    var pitch='<div class="fm-pitchwrap"><div class="fm-pitch" onmouseenter="benchOpen(false)"><div class="fm-pitch-mid"></div><div class="fm-pitch-circ"></div>'+nodes+'</div>'+
      '<div class="fm-bench'+(S._benchOpen?' open':'')+'" onmouseenter="benchOpen(true)"><div class="fm-bench-h">Panchina e riserve ('+S.bench.length+') <span class="fm-bench-hint">\u00b7 passa il mouse per espandere \u00b7 vai sul campo per chiudere</span></div><div class="fm-bench-grid" id="fm-bench-grid">'+(bench||'<div style="color:#8ea0b5;font-size:12px;padding:10px;">Nessuna riserva.</div>')+'</div></div></div>';
    var right;
    if(tab==='formazione'){ var fbtns=Object.keys(FT).map(function(name){ return '<div class="fm-formbtn'+(S.formationName===name?' on':'')+'" onclick="setFormationLayout(\''+name+'\')">'+name+'<small>'+(FDESC[name]||'')+'</small></div>'; }).join('');
      right='<div class="fm-detail fm-form-panel"><div class="fm-dsec-h" style="margin-top:0">'+I('grid',13)+' Modulo di gioco</div><p class="fm-form-hint">Scegli il modulo: i giocatori si riposizioneranno con un\'animazione. Usa \u201cSchiera miglior XI\u201d per riempire gli slot.</p><div class="fm-formgrid">'+fbtns+'</div><div class="fm-dsec-h">Modulo attuale</div><div class="fm-dgrid"><div><span>Modulo</span><b>'+S.formationName+'</b></div><div><span>OVR squadra</span><b>'+S.strength+'</b></div></div></div>'; }
    else right='<div class="fm-detail">'+(detX?fmDetail(detX,{i:S.rosaDetIdx,n:all.length}):'<div style="padding:24px;color:#8ea0b5">Nessun giocatore.</div>')+'</div>';
    var _anim=(S._animOnce?' anim':''); S._animOnce=false; return '<div class="fm-squad rosa-fm-bg-x'+_anim+'" data-tab="'+tab+'"><div class="fm-sq-top"><div><div class="fm-sq-title">Gestione squadra</div><div class="fm-sq-sub">Clic = vedi \u00b7 doppio clic = seleziona (verde) \u00b7 poi clic su un altro per scambiare \u00b7 OVR: <b style="color:#fff">'+S.strength+'</b></div></div><div class="fm-tabs"><div class="fm-tab'+(tab==='squadra'?' on':'')+'" onclick="rosaSetTab(\'squadra\')">Squadra</div><div class="fm-tab'+(tab==='formazione'?' on':'')+'" onclick="rosaSetTab(\'formazione\')">Formazione</div></div></div>'+
      '<div class="fm-sq-actions" style="margin-bottom:12px"><button class="fm-abtn prim" onclick="autoBestXI()">'+I('shield',15)+' Schiera miglior XI</button><button class="fm-abtn" onclick="setMode(\'squadhub\')">'+I('people',15)+' Hub Rosa'+(S.offers&&S.offers.length?' ('+S.offers.length+')':'')+'</button><button class="fm-abtn" onclick="setMode(\'contratti\')">'+I('news',15)+' Contratti</button></div>'+
      '<div class="fm-sq-grid"><div>'+pitch+'</div>'+right+'</div></div>';
  };

  /* ---------- varied realistic contracts at career start ---------- */
  function fmVaryContracts(){
    try{ if(S._contractsVaried) return; var sq=(S.draft&&S.draft.xi?S.draft.xi:[]).filter(Boolean).concat(S.bench||[]); if(!sq.length) return;
      sq.forEach(function(p){ if(!p) return; var sd=seed(p.name+(p.pid||'')); var age=p.age||25; var yrs; if(age>=33) yrs=1+(sd%2); else if(age>=30) yrs=1+(sd%3); else if(age<=21) yrs=3+(sd%3); else yrs=2+(sd%4); p.contractYears=yrs; });
      S._contractsVaried=true;
    }catch(e){}
  }
  if(typeof render==='function' && !window.__fmContractHook){
    window.__fmContractHook=true; var _r4=window.render;
    window.render=function(){ var r=_r4.apply(this,arguments); try{ if(S.screen==='hub' && !S._contractsVaried && S.draft && S.draft.xi && S.draft.xi.some(Boolean)) fmVaryContracts(); }catch(e){} return r; };
  }
  try{ if(typeof S!=='undefined'){ if(S.rosaArmed===undefined) S.rosaArmed=null; } }catch(e){}
})();

