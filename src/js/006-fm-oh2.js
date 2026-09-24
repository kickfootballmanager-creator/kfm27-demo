
/* ================= FM OVERHAUL v3 (loads after v2) ================= */
(function(){
  'use strict';
  var I=window.FMI||function(){return '';};
  var _origPano3=window.dashboardPano;

  var REFS=['Daniele Orsato','Daniele Doveri','Marco Guida','Maurizio Mariani','Davide Massa','Federico La Penna','Gianluca Rocchi','Antonio Giua','Simone Sozza','Matteo Marcenaro','Fabio Maresca','Daniele Chiffi','Michael Oliver','Anthony Taylor','Cl\u00e9ment Turpin','Felix Zwayer','Szymon Marciniak','Slavko Vin\u010di\u0107','Istv\u00e1n Kov\u00e1cs','Juan Mart\u00ednez Munuera'];
  var WX=['Sereno','Nuvoloso','Pioggia leggera','Freddo','Ventoso','Soleggiato','Cielo coperto'];
  var DAY=86400000;
  function rndi(n){ return Math.floor(Math.random()*n); }
  function seedOf(s){ var h=0; s=String(s||''); for(var i=0;i<s.length;i++){ h=(h*31+s.charCodeAt(i))>>>0; } return h>>>0; }
  function fmtNum(n){ return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,'.'); }
  function oppRoster(name){ try{ if(typeof EADB!=='undefined'&&EADB[name]&&typeof buildClub==='function') return buildClub(name).r; var cd=(typeof euroClubData==='function')?euroClubData(name):null; if(cd&&cd.r) return cd.r; }catch(e){} return []; }
  function userForm(){ var h=(S.history||[]).filter(function(e){ return typeof e.myGf==='number'&&typeof e.oppGf==='number'; }).slice(-5); return h.map(function(e){ return e.myGf>e.oppGf?'W':(e.myGf===e.oppGf?'D':'L'); }); }
  function teamForm(name,isCL){ if(name===S.teamName){ var f=userForm(); if(f.length) return f; } var st=(isCL?S.clStandings:S.saStandings)||{}; var e=st[name]; if(e && e.w!=null){ var seq=[],i; for(i=0;i<(e.w||0);i++)seq.push('W'); for(i=0;i<(e.d||0);i++)seq.push('D'); for(i=0;i<(e.l||0);i++)seq.push('L'); var sd=seedOf(name); for(i=seq.length-1;i>0;i--){ sd=(sd*1103515245+12345)>>>0; var j=sd%(i+1); var t=seq[i];seq[i]=seq[j];seq[j]=t; } return seq.slice(-5); } return []; }
  function formHTML(arr){ if(!arr||!arr.length) return '<div class="fmd2-form"><span class="D" style="opacity:.4">-</span></div>'; return '<div class="fmd2-form">'+arr.map(function(x){ return '<span class="'+x+'">'+x+'</span>'; }).join('')+'</div>'; }
  function clubLogo(name){ try{ if(name===S.teamName) return S.userLogo; if(typeof EADB!=='undefined'&&EADB[name]&&typeof getLogo==='function') return getLogo(EADB[name].tid, name); }catch(e){} return 'https://ui-avatars.com/api/?name='+encodeURIComponent((name||'FC').slice(0,2))+'&background=0d1620&color=8ea0b5&bold=true'; }
  function leagueLogo(){ try{ if(typeof getLeagueLogo==='function'){ var l=getLeagueLogo(S.leagueName); if(l) return l; } if(typeof leagueFallbackLogo==='function') return leagueFallbackLogo(S.leagueName); }catch(e){} return badge('LG','#0b2e1a','#00d26a'); }
  function euroLogo(){ try{ if(typeof EURO_LOGO!=='undefined'&&S.euroComp&&EURO_LOGO[S.euroComp]) return EURO_LOGO[S.euroComp]; if(typeof EURO_LOGO!=='undefined') return EURO_LOGO.CL; }catch(e){} return badge('UCL','#06183b','#7FB2FF'); }
  function badge(txt,bg,fg,fs){ try{ var svg="<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><rect width='64' height='64' rx='14' fill='"+bg+"'/><text x='32' y='39' font-family='Arial,Helvetica,sans-serif' font-size='"+(fs||20)+"' font-weight='bold' fill='"+fg+"' text-anchor='middle'>"+txt+"</text></svg>"; return 'data:image/svg+xml;base64,'+btoa(svg); }catch(e){ return ''; } }
  var AVB={ sky:badge('SKY','#00114f','#ffffff',18), dazn:badge('DAZN','#0b0b0b','#f5ff00',13), espn:badge('ESPN','#d50a0a','#ffffff',15), fr:badge('FR','#0e1622','#00d26a',22), opta:badge('Opta','#0a2540','#ffffff',15), uefa:badge('UEFA','#06183b','#7FB2FF',14) };
  var FP='https://commons.wikimedia.org/wiki/Special:FilePath/';
  var AV={ sky:FP+'Sky_Sports_2025.svg?width=200', dazn:FP+'DAZN_LOGO_SVG.svg?width=200', espn:FP+'ESPN_wordmark.svg?width=220', opta:FP+'Opta_Sports_logo.svg?width=200', fr:FP+'Fabrizio_Romano%2C_2020_%28cropped%29.jpg?width=200', uefa:badge('UEFA','#06183b','#7FB2FF',14) };
  function mediaOutlet(){ var lg=S.leagueName||''; if(/La Liga|LaLiga/.test(lg)) return {acct:'ESPN FC',handle:'@ESPNFC',logo:AV.espn}; if(/Premier/.test(lg)) return {acct:'Sky Sports',handle:'@SkySportsPL',logo:AV.sky}; if(/Serie A|Serie B|Serie C/.test(lg)) return {acct:'DAZN Italia',handle:'@DAZN_IT',logo:AV.dazn}; if(/Ligue/.test(lg)) return {acct:'DAZN France',handle:'@DAZN_FR',logo:AV.dazn}; if(/Bundesliga/.test(lg)) return {acct:'DAZN',handle:'@DAZN',logo:AV.dazn}; return {acct:'DAZN',handle:'@DAZN',logo:AV.dazn}; }
  function topScorer(){ try{ var best=null,ps=S.playerStats||{}; for(var n in ps){ var g=ps[n].goals||0; if(g>0&&(!best||g>best.g)) best={name:n,g:g}; } return best; }catch(e){ return null; } }

  /* ---------- IN-SEASON AI TRANSFER ENGINE (real, logged) ---------- */
  function rOfLine(l){ return parseInt(String(l).split('|')[2])||60; }
  function fmMaybeInSeasonTransfer(){
    try{
      if(typeof EADB==='undefined') return;
      if(Math.random()>0.55) return;
      var clubs=Object.keys(EADB).filter(function(c){ return c!==S.teamName && EADB[c]&&EADB[c].r&&EADB[c].r.length>16; });
      if(clubs.length<3) return;
      var byStr=clubs.slice().sort(function(a,b){ return (EADB[b].str||70)-(EADB[a].str||70); });
      var nDeals=1+rndi(3);
      for(var d=0; d<nDeals; d++){
        var buyer=byStr[rndi(Math.min(10,byStr.length))];
        var bstr=EADB[buyer].str||70;
        var want=Math.min(90, bstr-2+rndi(6));
        var sellers=clubs.filter(function(c){ return c!==buyer && (EADB[c].str||70)<=bstr+1 && EADB[c].r.length>17; });
        if(!sellers.length) continue;
        var seller=sellers[rndi(sellers.length)];
        var cand=[]; EADB[seller].r.forEach(function(l,i){ var rr=rOfLine(l); if(rr>=want-3&&rr<=want+2&&rr<90) cand.push([i,rr,l]); });
        if(!cand.length) continue;
        cand.sort(function(a,b){ return b[1]-a[1]; });
        var pick=cand[rndi(Math.min(3,cand.length))];
        var line=pick[2], name=String(line).split('|')[0], rate=pick[1];
        EADB[seller].r.splice(pick[0],1); EADB[buyer].r.push(line);
        try{ var sc=(typeof euroClubData==='function')?euroClubData(seller):null; if(sc&&sc.r){ var si=sc.r.findIndex(function(x){return x&&x.name===name;}); if(si>=0) sc.r.splice(si,1);} var bc=(typeof euroClubData==='function')?euroClubData(buyer):null; if(bc&&bc.r&&typeof parseEA==='function') bc.r.push(parseEA(line)); }catch(e){}
        try{ if(typeof _wClubCache!=='undefined'&&_wClubCache){ delete _wClubCache[seller]; delete _wClubCache[buyer]; } }catch(e){}
        [buyer,seller].forEach(function(c){ var rr=EADB[c].r.map(rOfLine).sort(function(a,b){return b-a;}).slice(0,11); if(rr.length) EADB[c].str=Math.round(rr.reduce(function(a,b){return a+b;},0)/rr.length); });
        var fee=Math.max(1, Math.round((rate-58)*(rate-58)/11));
        if(!S.transferNews) S.transferNews=[]; S.transferNews.unshift({p:name,from:seller,to:buyer,rate:rate,fee:fee,at:S.currentWeek,season:S.season});
      }
      if(S.transferNews&&S.transferNews.length>50) S.transferNews=S.transferNews.slice(0,50);
    }catch(e){}
  }
  if(typeof window.runSim==='function' && !window.__fmTxWrap){
    var _rs=window.runSim;
    window.runSim=function(){ var wk=S.currentWeek; var r=_rs.apply(this,arguments); try{ if(S.currentWeek>wk) fmMaybeInSeasonTransfer(); }catch(e){} return r; };
    window.__fmTxWrap=true;
  }

  /* ---------- REVOLUTIONISED FEED ---------- */
  window.buildSocial=function(m){
    var club=S.teamName, oppN=(m&&m.name)?m.name:'i prossimi avversari';
    var out=mediaOutlet(); var posts=[];
    function P(o){ o.likes=(o.likes!=null)?o.likes:(0.4+Math.random()*22); o.comments=(o.comments!=null)?o.comments:(0.1+Math.random()*4); o.time=o.time||(['ora','3m','9m','21m','40m','1h','2h','4h'][rndi(8)]); posts.push(o); }
    // last result
    var last=(S.history||[]).filter(function(e){ return typeof e.myGf==='number'; }).slice(-1)[0];
    if(last){ var win=last.myGf>last.oppGf, draw=last.myGf===last.oppGf;
      P({cat:'media',acct:out.acct,handle:out.handle,logo:out.logo,verified:true,text:(win?'\u26bd Vittoria: ':'')+club+' '+last.myGf+'-'+last.oppGf+' '+(last.opp||'')+'. '+(win?'Tre punti che pesano.':draw?'Un pari che smuove la classifica.':'Ko da archiviare subito.')});
      P({cat:'fans',acct:'Curva '+club.split(' ')[0],handle:'@ultras_'+club.replace(/\s/g,'').toLowerCase().slice(0,10),logo:clubLogo(club),text:(win?'CHE SQUADRA! Non ci fermiamo!':draw?'Dovevamo vincerla... ma sempre con voi.':'Testa alta, ci rifaremo!')});
    }
    // upcoming preview
    if(m){ var myStr=S.strength||70, oppStr=(typeof EADB!=='undefined'&&EADB[oppN]&&EADB[oppN].str)||m.str||70; var fav=myStr>oppStr+2?club:(oppStr>myStr+2?oppN:null);
      P({cat:'media',acct:out.acct,handle:out.handle,logo:out.logo,verified:true,text:'Vigilia di '+club+'-'+oppN+'. '+(fav?('Favori d\'obbligo per '+fav+' (OVR '+(fav===club?myStr:oppStr)+').'):'Sfida equilibrata: OVR '+myStr+' contro '+oppStr+'.')});
      if(oppStr>=83) P({cat:'media',acct:'UEFA',handle:'@UEFA',logo:euroLogo(),verified:true,text:'Big match in vista: '+club+' contro '+oppN+', una delle grandi d\'Europa.'});
    }
    // standings + leader
    var pos=(typeof rankOf==='function')?rankOf(S.teamName,S.saStandings):'-';
    if(pos&&pos!=='-'){ var st=S.saStandings||{}; var lead=Object.keys(st).sort(function(a,b){return (st[b].pts||0)-(st[a].pts||0);})[0];
      P({cat:'media',acct:'Opta',handle:'@OptaPaolo',logo:AV.opta,verified:true,text:club+' \u00e8 '+pos+'\u00ba in '+(S.leagueName||'campionato')+(lead&&lead!==club?(' \u00b7 in vetta '+lead+'.'):(lead===club?' \u00b7 primato in classifica!':'.'))});
    }
    // top scorer
    var ts=topScorer(); if(ts&&ts.g>=3) P({cat:'media',acct:out.acct,handle:out.handle,logo:out.logo,verified:true,text:'Classifica marcatori: '+ts.name+' a quota '+ts.g+' gol in stagione. Che momento.'});
    // injuries (real)
    var injNames=S.injuries?Object.keys(S.injuries).filter(function(n){return S.injuries[n]>0;}):[];
    if(injNames.length) P({cat:'media',acct:out.acct,handle:out.handle,logo:out.logo,verified:true,text:'Infermeria '+club+': out '+injNames.slice(0,3).join(', ')+'. Recupero monitorato dallo staff.'});
    // AI transfers this season (Fabrizio Romano, real & logged)
    var tn=(S.transferNews||[]).filter(function(e){ return e.season===S.season; }).slice(0,4);
    tn.forEach(function(e){ var hg=(e.rate>=84)?'!':'.'; var feeTxt=e.fee?('da \u20ac'+e.fee+'M '):''; P({cat:'media',acct:'Fabrizio Romano',handle:'@FabrizioRomano',logo:AV.fr,verified:true,likes:40+Math.random()*140,comments:5+Math.random()*22,text:e.p+' to '+e.to+', here we go'+hg+' \u2705 Affare '+feeTxt+'chiuso con '+e.from+'.'}); });
    // user's own real deals this season
    var mine=(S.newsLog||[]).filter(function(e){ return (e.t==='out'||e.t==='loanout') && (e.season===S.season || e.season==null && e.at>=S.currentWeek-6); }).slice(0,2);
    mine.forEach(function(e){ P({cat:'media',acct:'Fabrizio Romano',handle:'@FabrizioRomano',logo:AV.fr,verified:true,likes:50+Math.random()*90,comments:6+Math.random()*16,text:e.p+' to '+e.club+', '+(e.t==='loanout'?'loan done.':'here we go! \u2705')+' '+club+' '+(e.t==='loanout'?'lo cede in prestito.':'incassa '+(e.fee?('\u20ac'+e.fee+'M'):'la cifra pattuita')+'.')}); });
    if(!tn.length && !mine.length){ if(S.offers&&S.offers.length){ var of=S.offers[0]; P({cat:'media',acct:'Fabrizio Romano',handle:'@FabrizioRomano',logo:AV.fr,verified:true,text:of.club+' interested in '+of.name+' ('+club+'). Talks ongoing, '+club+' valuta l\'offerta.'}); } else { P({cat:'media',acct:'Fabrizio Romano',handle:'@FabrizioRomano',logo:AV.fr,verified:true,text:'Mercato tranquillo per '+club+' in questa fase. Continuo a monitorare, stay tuned.'}); } }
    // club + fan voices
    P({cat:'players',acct:club,handle:'@'+club.replace(/\s/g,'').toLowerCase().slice(0,14),logo:clubLogo(club),verified:true,text:'Testa alla prossima. Insieme, sempre. #Forza'+club.replace(/\s/g,'')});
    P({cat:'fans',acct:'Tifoso '+club.split(' ')[0],handle:'@'+club.replace(/\s/g,'').toLowerCase().slice(0,8)+'_fan',logo:badge('FAN','#1b2735','#cdd8e6',15),text:'Biglietti presi, sciarpa al collo. Forza ragazzi!'});
    return posts;
  };

  window.setFeedTab=function(t){ S.feedTab=t; if(typeof render==='function') render(); };
  window.afterHubRender=function(){
    var track=document.getElementById('social-track');
    if(track){
      var posts=window.buildSocial(S.calendar[S.currentWeek])||[]; var tab=S.feedTab||'all';
      if(tab!=='all'){ posts=posts.filter(function(p){ if(tab==='players') return p.cat==='players'||p.cat==='club'; return p.cat===tab; }); }
      if(!posts.length) posts=[{cat:'media',acct:'The Feed',handle:'@feed',logo:badge('TF','#0d1620','#8ea0b5'),text:'Nessun contenuto qui al momento.',time:'ora',likes:0,comments:0}];
      track.innerHTML=posts.map(function(p){ var lk=p.likes>=1?(p.likes>=10?Math.round(p.likes)+'K':p.likes.toFixed(1)+'K'):Math.round(p.likes*100); var cm=p.comments>=1?p.comments.toFixed(1)+'K':Math.round(p.comments*90);
        var fb=badge(((p.acct||'?').replace(/[^A-Za-z]/g,'').slice(0,3).toUpperCase()||'FC'),'#12202c','#8ea0b5',13);
        return '<div class="fmd2-post"><div class="fmd2-post-h"><img src="'+p.logo+'" onerror="this.onerror=null;this.src=\''+fb+'\'"><div class="fmd2-acct"><div class="fmd2-name">'+p.acct+(p.verified?I('verified',14):'')+'</div><div class="fmd2-handle">'+p.handle+'</div></div><div class="fmd2-time">'+(p.time||'')+'</div></div><div class="fmd2-msg">'+p.text+'</div><div class="fmd2-eng"><span>'+I('heart',14)+' '+lk+'</span><span>'+I('comment',14)+' '+cm+'</span></div></div>';
      }).join('');
    }
    if(typeof refreshMusicUI==='function') refreshMusicUI();
  };

  /* ---------- RIGHT PANEL SWITCHER ---------- */
  function rightViews(){ var v=['class','feed']; if(S.euroComp) v.push('cl'); return v; }
  window.setDashRight=function(dir){ var v=rightViews(); var i=v.indexOf(S.dashRight); if(i<0)i=0; i=(i+dir+v.length)%v.length; S.dashRight=v[i]; if(typeof render==='function') render(); };
  if(!window.__fmTeamDeleg){ window.__fmTeamDeleg=true; document.addEventListener('click',function(ev){ var el=ev.target&&ev.target.closest?ev.target.closest('.fmd2-tbl tr[data-team]'):null; if(el){ var nm=el.getAttribute('data-team'); if(nm&&typeof viewTeamModal==='function') viewTeamModal(nm); } }); }
  function compactTable(st){ if(!st||!Object.keys(st).length) return '<div style="padding:24px;color:#8ea0b5;text-align:center;font-size:13px">Classifica non ancora disponibile.</div>'; var rows=Object.entries(st).sort(function(x,y){return y[1].pts-x[1].pts||y[1].gd-x[1].gd||y[1].gf-x[1].gf;}); var n=rows.length; var body=rows.map(function(e,i){ var name=e[0],t=e[1],pos=i+1; var you=(name===S.teamName||t.you); var zc=pos<=4?'#00d26a':(pos<=6?'#0bbbe6':(pos>n-3?'#e0384a':'#5b6b7c')); return '<tr class="'+(you?'you':'')+'" data-team="'+name+'"><td><span class="fmd2-rk" style="background:'+zc+'22;color:'+zc+'">'+pos+'</span></td><td class="l"><div class="tm"><img src="'+(t.logo||'')+'" onerror="this.src=(typeof AVT!==\'undefined\'?AVT:\'\')">'+name+'</div></td><td>'+(t.p||0)+'</td><td class="pt">'+(t.pts||0)+'</td></tr>'; }).join(''); return '<table class="fmd2-tbl"><thead><tr><th>#</th><th class="l">Squadra</th><th>G</th><th>Pt</th></tr></thead><tbody>'+body+'</tbody></table>'; }

  /* ---------- OBJECTIVES POPUP ---------- */
  var OBJS=['Qualificarsi alla prossima Champions League','Non perdere pi\u00f9 di 4 partite in campionato','Far esordire un giovane della Primavera','Raggiungere i quarti in coppa nazionale'];
  window.showObjectivesPopup=function(){ var ov=document.createElement('div'); ov.className='fmd2-pop-ov'; ov.onclick=function(e){ if(e.target===ov) ov.remove(); }; ov.innerHTML='<div class="fmd2-pop"><div class="fmd2-pop-h">'+I('shield',22)+'Obiettivi societ\u00e0</div><div class="fmd2-pop-sub">Richieste della dirigenza per la stagione in corso.</div>'+OBJS.map(function(o){return '<div class="fmd2-pop-i">'+I('advance',15)+o+'</div>';}).join('')+'<button class="fmd2-pop-x" onclick="this.closest(\'.fmd2-pop-ov\').remove()">Ho capito</button></div>'; document.body.appendChild(ov); };

  /* ---------- DASHBOARD (compact, no-scroll) ---------- */
  function fact(icon,label,val){ return '<div class="fmd2-fact">'+I(icon,15)+'<span class="lbl">'+label+'</span><b>'+val+'</b></div>'; }
  window.dashboardPano=function(m){
    if(m && m.type==='BDO' && typeof _origPano3==='function') return _origPano3(m);
    if(!m) return '<div style="padding:50px;text-align:center;color:#9fb0c3">Nessuna partita in programma.</div>';
    if(typeof ensureOpponent==='function') ensureOpponent(m);
    var isCL=m.type&&m.type.indexOf('CL')===0;
    var oppN=m.name||'Da definire';
    var oppLogo=m.logo||((typeof getLogo==='function')?getLogo(null):'');
    var myPos=(typeof rankOf==='function')?rankOf(S.teamName,isCL?S.clStandings:S.saStandings):'-';
    var oppPos=(typeof rankOf==='function')?rankOf(oppN,isCL?S.clStandings:S.saStandings):'-';
    var myStr=S.strength||70, oppStr=(typeof EADB!=='undefined'&&EADB[oppN]&&EADB[oppN].str)||m.str||70;
    var bp=myStr-oppStr+(m.home?4:-2);
    var pH=Math.round(1/(1+Math.pow(10,-bp/16))*74)+6; if(pH>88)pH=88; if(pH<6)pH=6;
    var pD=Math.round((100-pH)*0.30), pA=100-pH-pD;
    var homeName=m.home?S.teamName:oppN, awayName=m.home?oppN:S.teamName;
    var homeP=m.home?pH:pA, awayP=m.home?pA:pH;
    var sd=seedOf((S.teamName||'')+oppN+(m.week||0));
    var ref=REFS[sd%REFS.length];
    var wx=(WX[(sd>>>3)%WX.length]||'Sereno')+' \u00b7 '+(6+((sd>>>5)%18))+'\u00b0';
    var venue=(m.home?S.teamName:oppN)+' Stadium';
    var att=((m.home?myStr:oppStr)>=82)?'Tutto esaurito':fmtNum(24000+((sd>>>2)%17000));
    var comp=(typeof compLabel==='function')?compLabel(m.type):(S.leagueName||'Serie A');
    var compLogo=(typeof compLogoUrl==='function')?compLogoUrl(m.type):'';
    // real kickoff countdown
    var now=(S.currentDay&&S.currentDay>1e11)?S.currentDay:(m.date-2*DAY);
    var days=Math.max(0,Math.round((m.date-now)/DAY));
    var kick=days<=0?'oggi':(days===1?'domani':('tra '+days+' giorni'));

    var myXI=(S.draft&&S.draft.xi?S.draft.xi:[]).filter(Boolean).slice().sort(function(a,b){return (b.rate||0)-(a.rate||0);});
    var myBest=myXI[0];
    var oppR=oppRoster(oppN).slice().sort(function(a,b){return (b.rate||0)-(a.rate||0);}); var oppBest=oppR[0];
    var _kbL2=(m.home?myBest:oppBest), _kbR2=(m.home?oppBest:myBest);
    var kb= (myBest&&oppBest)? ('<div class="fmd2-kb"><div class="fmd2-kb-p"><img src="'+(_kbL2.img||'')+'" onerror="this.src=(typeof AVP!==\'undefined\'?AVP:\'\')"><div><div class="fmd2-kb-nm">'+_kbL2.name.split(' ').pop()+'</div><div class="fmd2-kb-ro">'+(_kbL2.roles?_kbL2.roles[0]:'')+'</div></div><div class="fmd2-kb-r">'+_kbL2.rate+'</div></div><div class="fmd2-kb-vs">VS</div><div class="fmd2-kb-p r"><img src="'+(_kbR2.img||'')+'" onerror="this.src=(typeof AVP!==\'undefined\'?AVP:\'\')"><div><div class="fmd2-kb-nm">'+_kbR2.name.split(' ').pop()+'</div><div class="fmd2-kb-ro">'+(_kbR2.roles?_kbR2.roles[0]:'')+'</div></div><div class="fmd2-kb-r">'+_kbR2.rate+'</div></div></div>') : ('<div class="fmd2-news-ok">'+I('scout',15)+' Dati avversario non disponibili.</div>');
    var squad=(S.draft&&S.draft.xi?S.draft.xi:[]).filter(Boolean).concat(S.bench||[]); var seen={},news=[];
    squad.forEach(function(p){ if(seen[p.name])return; seen[p.name]=1; if(window._isInjured&&window._isInjured(p.name)) news.push('<div class="fmd2-news-i">'+I('injury',15).replace('class="fi"','class="fi inj"')+' '+p.name+'<span class="st inj">Infortunato \u00b7 '+S.injuries[p.name]+' gg</span></div>'); else if(typeof _isSusp==='function'&&_isSusp(p.name)) news.push('<div class="fmd2-news-i">'+I('red',14).replace('class="fi"','class="fi red"')+' '+p.name+'<span class="st red">Squalificato</span></div>'); });
    var newsHTML=news.length?news.slice(0,3).join(''):'<div class="fmd2-news-ok">'+I('verified',15)+' Rosa al completo \u00b7 tutti disponibili</div>';
    var hh=new Date().getHours(); var greet=hh<12?'Buongiorno':hh<18?'Buon pomeriggio':'Buonasera';
    var homeForm=teamForm(homeName,isCL), awayForm=teamForm(awayName,isCL);
    var homeLogo=m.home?S.userLogo:oppLogo, awayLogo=m.home?oppLogo:S.userLogo;
    var homePos=m.home?myPos:oppPos, awayPos=m.home?oppPos:myPos;
    var dstr=(typeof dayLong==='function')?dayLong(m.date):'';
    var coachFace=S.coachFace||('https://ui-avatars.com/api/?name='+encodeURIComponent(S.coachName||'M')+'&background=0d1620&color=fff&bold=true');

    var top='<div class="fmd2-top"><div class="fmd2-hello-wrap"><img class="fmd2-coach" src="'+coachFace+'" onerror="this.src=\'https://ui-avatars.com/api/?name='+encodeURIComponent(S.coachName||'M')+'&background=0d1620&color=fff&bold=true\'"><div class="fmd2-hello">'+greet+', '+(S.coachName||'Mister')+'<small>Giornata '+(m.week||'-')+' \u00b7 '+(S.teamName||'')+'</small></div><div class="fmd2-datechip">'+I('calendar',15)+dstr+'</div></div>'+
      '<div class="fmd2-stats"><div class="fmd2-stat">'+I('shield',18)+'<div><div class="k">Societ\u00e0</div><div class="v">Salda</div></div></div><div class="fmd2-stat">'+I('people',18)+'<div><div class="k">Morale</div><div class="v">'+(function(){var f=userForm();return f.filter(function(x){return x==='W';}).length>=3?'Alto':f.filter(function(x){return x==='L';}).length>=3?'Basso':'Stabile';})()+'</div></div></div><div class="fmd2-stat">'+I('coins',18)+'<div><div class="k">Budget</div><div class="v">\u20ac'+((S.budget!=null?S.budget:0))+'M</div></div></div><div class="fmd2-stat">'+I('save',18)+'<div><div class="k">Salvataggio</div><div class="v">Sincronizzato</div></div></div></div></div>';

    var card='<div class="fmd2-card stadium-bg-x"><div class="fmd2-comp">'+(compLogo?'<img src="'+compLogo+'" onerror="this.style.display=\'none\'">':'')+comp+'<span class="kick">Calcio d\'inizio '+kick+' \u00b7 20:45</span></div>'+
      '<div class="fmd2-vs"><div class="fmd2-vs-team"><img src="'+homeLogo+'" onerror="this.src=(typeof AVT!==\'undefined\'?AVT:\'\')"><div class="fmd2-vs-nm">'+homeName.toUpperCase()+'</div><div class="fmd2-vs-pos">'+homePos+'\u00ba \u00b7 Casa</div>'+formHTML(homeForm)+'</div><div class="fmd2-vs-mid"><div class="vs">VS</div><div class="dt">'+dstr+'</div></div><div class="fmd2-vs-team"><img src="'+awayLogo+'" onerror="this.src=(typeof AVT!==\'undefined\'?AVT:\'\')"><div class="fmd2-vs-nm">'+awayName.toUpperCase()+'</div><div class="fmd2-vs-pos">'+awayPos+'\u00ba \u00b7 Trasferta</div>'+formHTML(awayForm)+'</div></div>'+
      '<div class="fmd2-sec-h">'+I('scout',14)+'Pronostico</div><div class="fmd2-pred-bar"><span class="fmd2-ph" style="width:'+homeP+'%">'+homeP+'%</span><span class="fmd2-pd" style="width:'+pD+'%">'+pD+'%</span><span class="fmd2-pw" style="width:'+awayP+'%">'+awayP+'%</span></div><div class="fmd2-pred-l"><span>1 <b>'+homeName+'</b></span><span>X</span><span><b>'+awayName+'</b> 2</span></div>'+
      '<div class="fmd2-sec-h">'+I('news',14)+'Match facts</div><div class="fmd2-facts">'+fact('pin','Stadio',venue)+fact('whistle','Arbitro',ref)+fact('weather','Meteo',wx)+fact('crowd','Spettatori',att)+fact('grid','Modulo',(S.formationName||'4-3-3'))+fact('shirt','Competizione',(isCL?'UEFA':(S.leagueName||'Serie A')))+'</div>'+
      '<div class="fmd2-sec-h">'+I('news',14)+'Notizie squadra</div>'+newsHTML+
      '<div class="fmd2-sec-h">'+I('duel',14)+'Duello chiave</div>'+kb+
      '<div class="fmd2-actions"><button class="fmd2-btn primary" data-m3d="1" style="background:linear-gradient(180deg,#00e67a,#00a653);color:#04180d;" onclick="playMatch3D()">GIOCA LA PARTITA</button><button class="fmd2-btn primary" onclick="playMatchRealtime()">'+I('advance',18)+'Simula la partita</button><button class="fmd2-btn ghost" onclick="runSimLive()">'+I('play',16)+'Simulazione veloce</button><button class="fmd2-btn ghost" onclick="advanceToDate('+m.date+',{stopAtMatch:true})">'+I('calendar',16)+'Avanza i giorni</button><button class="fmd2-btn ghost" onclick="viewTeamModal(\''+String(oppN).replace(/'/g,"\\'")+'\')">'+I('scout',16)+'Analisi avversario</button></div></div>';

    var chips='<div class="fmd2-chips"><div class="fmd2-chip" onclick="showObjectivesPopup()">'+I('shield',17)+'Obiettivi societ\u00e0</div><div class="fmd2-chip" onclick="setMode(\'stats\')">'+I('chart',17)+'Statistiche</div><div class="fmd2-chip" onclick="setMode(\'rosa\')">'+I('shirt',17)+'Squadra</div></div>';

    // RIGHT PANEL
    if(!S.dashRight || rightViews().indexOf(S.dashRight)<0) S.dashRight='class';
    var rv=S.dashRight; var rightHead, rightBody;
    if(rv==='feed'){ var tab=S.feedTab||'all'; function tbn(id,label,icon){ return '<div class="fmd2-tab'+(tab===id?' on':'')+'" onclick="setFeedTab(\''+id+'\')">'+I(icon,13)+label+'</div>'; }
      rightHead='<span class="tt">THE FEED</span><span class="fmd2-live-mini"><i></i>LIVE</span>';
      rightBody='<div class="fmd2-tabs">'+tbn('all','Tutto','grid')+tbn('media','Media','camera')+tbn('fans','Tifosi','people')+tbn('players','Club','shirt')+'</div><div class="fmd2-feed-track" id="social-track"></div>';
    } else if(rv==='cl'){ rightHead='<span class="tt"><img src="'+euroLogo()+'" onerror="this.style.display=\'none\'"><span class="nm">'+((typeof euroCompName==='function'&&S.euroComp)?euroCompName(S.euroComp):'Coppa Europea')+'</span></span>'; rightBody='<div class="fmd2-rt-body">'+compactTable(S.clStandings)+'</div>';
    } else { rightHead='<span class="tt"><img src="'+leagueLogo()+'" onerror="this.style.display=\'none\'"><span class="nm">'+(S.leagueName||'Classifica')+'</span></span>'; rightBody='<div class="fmd2-rt-body">'+compactTable(S.saStandings)+'</div>'; }
    var side='<div class="fmd2-rt"><div class="fmd2-rt-h">'+rightHead+'<div class="fmd2-arw" onclick="setDashRight(-1)" title="Vista precedente">'+I('advance',15).replace('M5 5l7 7-7 7M12 5l7 7-7 7','M15 5l-7 7 7 7M8 5l-7 7 7 7')+'</div><div class="fmd2-arw" onclick="setDashRight(1)" title="Vista successiva">'+I('advance',15)+'</div></div>'+ (rv==='feed'?rightBody:rightBody) +'</div>'+(typeof musicPlayerHTML==='function'?musicPlayerHTML():'');

    return '<div class="fmd2">'+top+'<div class="fmd2-grid"><div class="fmd2-main">'+card+chips+'</div><div class="fmd2-side">'+side+'</div></div></div>';
  };

  /* ---------- DARK RENEWALS BOX (season end) + preserve scroll ---------- */
  window.renderRenewalsBox=function(){
    if(typeof squadAll!=='function') return '';
    var left=(typeof contractLeft==='function')?contractLeft:function(p){return p.contractYears!=null?p.contractYears:2;};
    var exp=squadAll().filter(function(x){ return x.p && !x.p.loaned && left(x.p)<=1; });
    if(!exp.length) return '<div class="se-renew-ok">'+I('verified',15)+' Nessun contratto in scadenza</div>';
    var rows=exp.map(function(x){ var p=x.p; var done=p._renewed; return '<div class="rnw-row"><img src="'+(p.img||'')+'" onerror="this.src=(typeof AVP!==\'undefined\'?AVP:\'\')"><div class="rnw-info"><div class="rnw-nm">'+p.name+'</div><div class="rnw-meta">'+p.roles.join(' \u00b7 ')+' \u00b7 OVR '+p.rate+' \u00b7 '+p.age+' anni \u00b7 '+(done?'rinnovato':'in scadenza')+'</div></div><button class="rnw-btn'+(done?' done':'')+'" '+(done?'disabled':'onclick="fmRenew(\''+x.loc+'\','+x.idx+')"')+'>'+(done?'\u2713':'Rinnova')+'</button></div>'; }).join('');
    return '<div class="rnw-hint">'+I('injury',14)+' Rinnova questi giocatori, altrimenti a fine stagione partiranno a parametro zero.</div><div class="se-renew-list" id="se-renew-list">'+rows+'</div>';
  };
  window.fmRenew=function(loc,idx){ var sc=0; var el=document.getElementById('se-renew-list'); if(el) sc=el.scrollTop; try{ if(typeof renewContract==='function') renewContract(loc,idx); }catch(e){} var el2=document.getElementById('se-renew-list'); if(el2) el2.scrollTop=sc; };

  /* ---------- WEAK free-agent fillers + skip recently released ---------- */
  window._fillUserRosterTo18=function(){
    try{ if(!S.draft||!S.draft.xi) return; if(!S.bench) S.bench=[];
      var added=0,guard=0; function cnt(){ return S.draft.xi.filter(Boolean).length + S.bench.length; }
      while(cnt()<18 && guard++<80){
        if(!S.freeAgents||!S.freeAgents.length){ if(typeof topUpFreeAgents==='function') topUpFreeAgents(); }
        if(!S.freeAgents||!S.freeAgents.length) break;
        var cands=[]; S.freeAgents.forEach(function(line,i){ var nm=String(line).split('|')[0]; if(S.faProtected&&S.faProtected[nm]>0) return; var rr=parseInt(String(line).split('|')[2])||60; if(rr<=72) cands.push([i,rr]); });
        if(!cands.length){ S.freeAgents.forEach(function(line,i){ var nm=String(line).split('|')[0]; if(S.faProtected&&S.faProtected[nm]>0) return; cands.push([i,parseInt(String(line).split('|')[2])||60]); }); cands.sort(function(a,b){return a[1]-b[1];}); cands=cands.slice(0,6); }
        if(!cands.length) break;
        var pi=cands[rndi(cands.length)][0]; var line=S.freeAgents[pi]; S.freeAgents.splice(pi,1);
        var p=(typeof parseEA==='function')?parseEA(line):null; if(!p) continue;
        var np={ name:p.name, roles:(p.roles||['CC']).slice(), rate:p.rate, img:p.img, pid:(p.pid||'0'), pac:p.pac,sho:p.sho,pas:p.pas,dri:p.dri,def:p.def,phy:p.phy, age:p.age, nation:p.nation, height:p.height, foot:p.foot, pot:(p.pot||p.rate), baseRate:(p.baseRate||p.rate), mv:p.mv||0, trainXp:0, club:'', wage:Math.max(1,Math.round((p.rate||60)/10)), contractYears:2 };
        S.bench.push(np); if(S.usedPlayers) S.usedPlayers.add(p.name); added++;
      }
      if(added>0){ if(typeof recalcStrength==='function') recalcStrength(); if(typeof toast==='function') toast('Rosa completata: '+added+' svincolato/i di livello base per il minimo di 18.'); }
    }catch(e){}
  };

  /* ---------- block selecting injured into XI ---------- */
  if(typeof window.rosaTap==='function' && !window.__fmRosaWrap){
    var _origRosaTap=window.rosaTap;
    window.rosaTap=function(type,idx){ var sel=S.rosaSel; if(sel){ var moving=null; if(sel.type==='bench'&&type==='xi') moving=S.bench[sel.idx]; else if(sel.type==='xi'&&type==='bench') moving=S.bench[idx]; if(moving && window._isInjured && window._isInjured(moving.name)){ if(typeof toast==='function') toast(I('injury',14)+' '+moving.name+' \u00e8 infortunato: non pu\u00f2 essere schierato'); S.rosaSel=null; if(typeof render==='function') render(); return; } } return _origRosaTap.apply(this,arguments); };
    window.__fmRosaWrap=true;
  }

  try{ if(typeof S!=='undefined'){ if(S.dashRight==null) S.dashRight='class'; if(!S.transferNews) S.transferNews=[]; } }catch(e){}
})();

