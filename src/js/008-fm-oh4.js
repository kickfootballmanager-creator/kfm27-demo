
/* ================= FM OVERHAUL v5 : LOAN SYSTEM (loads last) ================= */
(function(){
  'use strict';
  var I=window.FMI||function(){return '';};
  function seed(s){ var h=0; s=String(s||''); for(var i=0;i<s.length;i++){ h=(h*31+s.charCodeAt(i))>>>0; } return h>>>0; }
  function price(p){ try{ return (typeof playerPrice==='function')?playerPrice(p):Math.max(1,Math.round((p.rate-55)*(p.rate-55)/9)); }catch(e){ return 5; } }
  function clubLogo(name){ try{ if(typeof EADB!=='undefined'&&EADB[name]&&typeof getLogo==='function') return getLogo(EADB[name].tid, name); }catch(e){} return ''; }

  /* ---------- assign realistic loans once at career start ---------- */
  function fmInitLoans(){ return; /* prestiti sintetici disattivati: solo dati reali dal feed */
    if(S._loansInit) return; if(typeof EADB==='undefined') return;
    var sq=(S.draft&&S.draft.xi?S.draft.xi:[]).filter(Boolean).concat(S.bench||[]);
    if(!sq.length) return;
    S._loansInit=true;
    var strong=[], small=[]; var mys=S.strength||75;
    for(var c in EADB){ if(c===S.teamName||!EADB[c]) continue; var st=EADB[c].str||0; if(st>=83) strong.push(c); if(st<=mys-2 && st>=55) small.push(c); }
    // loaned-IN: up to 2 young talents already in squad, owned by a bigger club
    if(strong.length){
      var cand=sq.filter(function(p){ return p && (p.age||30)<=21 && (p.pot||p.rate)>(p.rate+1) && !p.loanFrom; });
      cand.sort(function(a,b){ return ((b.pot||b.rate)-b.rate)-((a.pot||a.rate)-a.rate); });
      var nIn=Math.min(2,cand.length);
      for(var i=0;i<nIn;i++){ var p=cand[i]; var sd=seed(p.name+(p.pid||'')); p.loanFrom=strong[sd%strong.length]; p.loanYears=1+(sd%2); p.loanBuy=Math.max(1,Math.round(price(p)*1.15)); p.loanSendFee=Math.max(0.3,Math.round(p.loanBuy*0.04*10)/10); }
    }
    // loaned-OUT: pull up to 2 young low-rated free agents = your youth out on loan
    if(small.length && S.freeAgents && S.freeAgents.length){
      var picks=[]; for(var j=0;j<S.freeAgents.length && picks.length<2; j++){ var ln=S.freeAgents[j]; var age=parseInt(String(ln).split('|')[5]||'25')||25; var rr=parseInt(String(ln).split('|')[2])||60; if(age<=21 && rr>=58 && rr<=73) picks.push(j); }
      picks.sort(function(a,b){ return b-a; }).forEach(function(j){ var ln=S.freeAgents[j]; S.freeAgents.splice(j,1); var pp=(typeof parseEA==='function')?parseEA(ln):null; if(!pp) return; var sd=seed(pp.name); pp.loanTo=small[sd%small.length]; pp.loanYears=1+(sd%2); pp.loanRecallFee=Math.max(0.2,Math.round(price(pp)*0.05*10)/10); pp.contractYears=pp.contractYears||2; if(!S.loanedOut) S.loanedOut=[]; S.loanedOut.push(pp); if(S.usedPlayers) S.usedPlayers.add(pp.name); });
    }
    if(!S._loansDrew){ S._loansDrew=true; setTimeout(function(){ try{ if(typeof render==='function') render(); }catch(e){} },20); }
  }

  /* ---------- inject loan UI after each squad render ---------- */
  function fmInjectLoans(){
    if(typeof S==='undefined' || S.mode!=='rosa') return;
    // 1) loaned-in action buttons in the detail panel
    try{
      var all=squadAll(); var f=all[S.rosaDetIdx];
      var det=document.querySelector('.fm-detail');
      if(det && f && f.p && f.p.loanFrom && !det.querySelector('.fm-loan-actions')){
        var p=f.p; var box=document.createElement('div'); box.className='fm-loan-actions';
        box.innerHTML='<button class="buy" onclick="fmBuyLoan(\''+f.loc+'\','+f.idx+')">'+I('coins',14)+' Riscatta \u20ac'+(p.loanBuy||'?')+'M</button>'+
          '<button class="send" onclick="fmSendBackLoan(\''+f.loc+'\','+f.idx+')">'+I('swap',14)+' Rimanda indietro</button>';
        det.appendChild(box);
      }
    }catch(e){}
    // 2) loaned-out strip under the bench
    try{
      var bench=document.querySelector('.fm-bench');
      if(bench && !document.getElementById('fm-loanout') && S.loanedOut && S.loanedOut.length){
        var wrap=document.createElement('div'); wrap.className='fm-loanout'; wrap.id='fm-loanout';
        var cards=S.loanedOut.map(function(pp,i){ var lg=clubLogo(pp.loanTo); return '<div class="fm-loanout-card"><img class="face" src="'+(pp.img||'')+'" onerror="this.src=(typeof AVP!==\'undefined\'?AVP:\'\')"><div style="min-width:0"><div class="fm-lo-n">'+pp.name.split(' ').pop()+' \u00b7 '+pp.rate+'</div><div class="fm-lo-to">'+I('swap',12)+(lg?'<img src="'+lg+'">':'')+' '+(pp.loanTo||'')+(pp.loanYears?(' \u00b7 '+pp.loanYears+'a'):'')+'</div></div><button class="fm-lo-recall" onclick="fmRecallLoan('+i+')">Richiama</button></div>'; }).join('');
        wrap.innerHTML='<div class="fm-loanout-h">'+I('swap',14)+' Giocatori in prestito (uscita) \u00b7 '+S.loanedOut.length+'</div><div class="fm-loanout-grid">'+cards+'</div>';
        bench.parentNode.appendChild(wrap);
      }
    }catch(e){}
  }

  /* ---------- loan actions ---------- */
  window.fmBuyLoan=function(loc,idx){ var p=loc==='xi'?S.draft.xi[idx]:S.bench[idx]; if(!p||!p.loanFrom) return; var fee=p.loanBuy||Math.round(price(p)*1.15); if((S.budget||0)<fee){ if(typeof gameMsg==='function') gameMsg({title:'Budget insufficiente',msg:'Riscattare <b>'+p.name+'</b> costa <b>\u20ac'+fee+'M</b>, ma hai <b>\u20ac'+(S.budget||0)+'M</b>.',icon:'value'}); return; } S.budget=Math.round(((S.budget||0)-fee)*10)/10; if(typeof logTx==='function') logTx('out','transfer','Riscatto prestito '+p.name,fee); delete p.loanFrom; delete p.loanYears; delete p.loanBuy; delete p.loanSendFee; p.contractYears=Math.max(p.contractYears||0,3); if(typeof toast==='function') toast(I('verified',14)+' '+p.name+' riscattato a titolo definitivo'); if(typeof render==='function') render(); };
  window.fmSendBackLoan=function(loc,idx){ var p=loc==='xi'?S.draft.xi[idx]:S.bench[idx]; if(!p||!p.loanFrom) return; if(!confirm('Rimandare '+p.name+' al '+p.loanFrom+'? Paghi una piccola penale di fine prestito.')) return; var fee=p.loanSendFee||0.5; S.budget=Math.round(((S.budget||0)-fee)*10)/10; if(typeof logTx==='function') logTx('out','transfer','Fine prestito '+p.name,fee); if(loc==='xi'){ S.draft.xi[idx]=null; try{ if(typeof _autoPromoteXI==='function') _autoPromoteXI(idx,(p.roles&&p.roles[0])||'CC'); }catch(e){} } else S.bench.splice(idx,1); if(S.usedPlayers) S.usedPlayers.delete(p.name); S.rosaArmed=null; if(typeof recalcStrength==='function') recalcStrength(); if(typeof toast==='function') toast(I('swap',14)+' '+p.name+' \u00e8 rientrato al '+p.loanFrom); if(typeof render==='function') render(); };
  window.fmRecallLoan=function(i){ if(!S.loanedOut||!S.loanedOut[i]) return; var p=S.loanedOut[i]; var fee=p.loanRecallFee||0.5; if((S.budget||0)<fee){ if(typeof gameMsg==='function') gameMsg({title:'Budget insufficiente',msg:'Richiamare <b>'+p.name+'</b> costa <b>\u20ac'+fee+'M</b>.',icon:'value'}); return; } if(typeof rosterFull==='function' && rosterFull()){ if(typeof gameMsg==='function') gameMsg({title:'Rosa al completo',msg:'Libera un posto prima di richiamare il giocatore.',icon:'club'}); return; } S.budget=Math.round(((S.budget||0)-fee)*10)/10; if(typeof logTx==='function') logTx('out','transfer','Richiamo prestito '+p.name,fee); S.loanedOut.splice(i,1); delete p.loanTo; delete p.loanYears; delete p.loanRecallFee; if(!S.bench) S.bench=[]; S.bench.push(p); if(S.usedPlayers) S.usedPlayers.add(p.name); if(typeof recalcStrength==='function') recalcStrength(); if(typeof toast==='function') toast(I('advance',14)+' '+p.name+' richiamato dal prestito'); if(typeof render==='function') render(); };

  /* ---------- season processing: decrement loan years, return at 0 ---------- */
  if(typeof window.advanceSeason==='function' && !window.__fmLoanAdv){
    window.__fmLoanAdv=true; var _adv=window.advanceSeason;
    window.advanceSeason=function(){
      try{ var sq=(S.draft&&S.draft.xi?S.draft.xi:[]).concat(S.bench||[]); sq.forEach(function(p){ if(p&&p.loanFrom){ p.loanYears=(p.loanYears||1)-1; if(p.loanYears<=0){ var xi=S.draft.xi.indexOf(p); if(xi>=0) S.draft.xi[xi]=null; else { var bi=S.bench.indexOf(p); if(bi>=0) S.bench.splice(bi,1); } if(S.usedPlayers) S.usedPlayers.delete(p.name); if(typeof toast==='function') toast(I('swap',14)+' '+p.name+' \u00e8 tornato al '+p.loanFrom+' (fine prestito)'); } } }); }catch(e){}
      var hold=[]; try{ (S.loanedOut||[]).forEach(function(p){ if(p){ p.loanYears=(p.loanYears||1)-1; if(p.loanYears>0) hold.push(p); } }); S.loanedOut=(S.loanedOut||[]).filter(function(p){ return !(p&&p.loanYears>0); }); }catch(e){}
      var r=_adv.apply(this,arguments);
      try{ if(hold.length){ if(!S.loanedOut) S.loanedOut=[]; hold.forEach(function(p){ delete p.loanTo; }); /* keep tracked below */ S.loanedOut=S.loanedOut.concat(hold.map(function(p){ p.loanTo=p.loanTo||p._lt; return p; })); } }catch(e){}
      return r;
    };
  }

  /* ---------- hook render ---------- */
  if(typeof render==='function' && !window.__fmLoanRender){
    window.__fmLoanRender=true; var _r5=window.render;
    window.render=function(){ var r=_r5.apply(this,arguments); try{ if(S.screen==='hub' && !S._loansInit && S.draft && S.draft.xi && S.draft.xi.some(Boolean)) fmInitLoans(); }catch(e){} try{ fmInjectLoans(); }catch(e){} return r; };
  }
})();

