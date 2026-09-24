
/* ================= FM OVERHAUL v2 (loads after v1) ================= */
(function(){
  'use strict';
  var _origPano = window.dashboardPano;

  var IC={
    shirt:'<path d="M8 3l4 2 4-2 3.6 2.6-2.6 3v11.4H7V8.6L4.4 5.6z"/>',
    swap:'<path d="M4 8h13m0 0-3-3m3 3-3 3M20 16H7m3-3-3 3 3 3"/>',
    whistle:'<circle cx="9" cy="14" r="4"/><path d="M13 10a4.5 4.5 0 0 0-4-2M13 10h7M17.5 10v3"/>',
    pin:'<path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11z"/><circle cx="12" cy="10" r="2.4"/>',
    weather:'<path d="M7 18h9a4 4 0 0 0 .3-8A5.5 5.5 0 0 0 6 9.6 3.5 3.5 0 0 0 7 18z"/>',
    crowd:'<circle cx="8" cy="9" r="2.3"/><circle cx="16" cy="9" r="2.3"/><path d="M3.5 19c0-3 2-4.6 4.5-4.6S12.5 16 12.5 19M11.5 19c0-3 2-4.6 4.5-4.6S20.5 16 20.5 19"/>',
    grid:'<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="M3.5 10h17M9.5 4.5v15"/>',
    news:'<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9z"/><path d="M8 12h8M8 16h5"/>',
    duel:'<path d="M4 4l8 8m8-8-8 8m3 3 5 5m-13-5-5 5"/>',
    advance:'<path d="M5 5l7 7-7 7M12 5l7 7-7 7"/>',
    calendar:'<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 9h17M8 3v4M16 3v4"/>',
    scout:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3"/>',
    injury:'<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
    red:'<rect x="6" y="3" width="12" height="18" rx="2" fill="currentColor" stroke="none"/>',
    coins:'<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/>',
    shield:'<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
    save:'<path d="M7 18h9a4 4 0 0 0 .3-8A5.5 5.5 0 0 0 6 9.6 3.5 3.5 0 0 0 7 18z"/><path d="M9.3 13.6l2 2 3.4-3.6"/>',
    music:'<path d="M9 17V4l10-2v12"/><circle cx="6.2" cy="17.5" r="2.6"/><circle cx="16.2" cy="13.5" r="2.6"/>',
    play:'<path d="M7 5l12 7-12 7z" fill="currentColor" stroke="none"/>',
    pause:'<rect x="7" y="5" width="3.4" height="14" fill="currentColor" stroke="none"/><rect x="13.6" y="5" width="3.4" height="14" fill="currentColor" stroke="none"/>',
    prev:'<path d="M18 5v14l-10-7z" fill="currentColor" stroke="none"/><rect x="5" y="5" width="2.4" height="14" fill="currentColor" stroke="none"/>',
    nxt:'<path d="M6 5v14l10-7z" fill="currentColor" stroke="none"/><rect x="16.6" y="5" width="2.4" height="14" fill="currentColor" stroke="none"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    folder:'<path d="M4 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/>',
    verified:'<circle cx="12" cy="12" r="9"/><path d="M8.3 12l2.6 2.6 5-5.2"/>',
    heart:'<path d="M12 20S4.5 15 4.5 9.7A3.9 3.9 0 0 1 12 7a3.9 3.9 0 0 1 7.5 2.7C19.5 15 12 20 12 20z"/>',
    comment:'<path d="M4.5 5h15v10H9l-4.5 3.5z"/>',
    camera:'<rect x="3" y="7.5" width="13" height="11" rx="2"/><path d="M16 11l4.5-2.5v9L16 15z"/>',
    people:'<circle cx="9" cy="8" r="3"/><path d="M3.5 19c0-3.3 2.5-5 5.5-5s5.5 1.7 5.5 5"/><path d="M16 6.2A3 3 0 0 1 16 13M20.5 19c0-2.6-1.4-4.2-3.5-4.8"/>',
    trophy:'<path d="M7 4h10v3a5 5 0 0 1-10 0zM7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3M9 14h6M8 20h8M12 14v6"/>',
    medal:'<circle cx="12" cy="14" r="5"/><path d="M9 9 7 3M15 9l2-6M10.5 14l1.5-1.5 1.5 1.5-.6 2.2h-1.8z"/>',
    doc:'<rect x="6" y="3" width="12" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/>',
    chart:'<path d="M4 20V4M4 20h16M8 16l3-4 3 2 4-6"/>'
  };
  function I(n,sz){ return '<svg class="fi" width="'+(sz||16)+'" height="'+(sz||16)+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+(IC[n]||'')+'</svg>'; }
  window.FMI=I; window.FMIC=IC;

  var REFS=['Daniele Orsato','Daniele Doveri','Marco Guida','Maurizio Mariani','Davide Massa','Federico La Penna','Gianluca Rocchi','Antonio Giua','Simone Sozza','Matteo Marcenaro','Fabio Maresca','Daniele Chiffi','Michael Oliver','Anthony Taylor','Cl\u00e9ment Turpin','Felix Zwayer','Szymon Marciniak','Slavko Vin\u010di\u0107','Istv\u00e1n Kov\u00e1cs','Juan Mart\u00ednez Munuera'];
  var WX=['Sereno','Nuvoloso','Pioggia leggera','Freddo','Ventoso','Soleggiato','Cielo coperto'];

  function rndi(n){ return Math.floor(Math.random()*n); }
  function seedOf(s){ var h=0; s=String(s||''); for(var i=0;i<s.length;i++){ h=(h*31+s.charCodeAt(i))>>>0; } return h>>>0; }
  function fmtNum(n){ return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,'.'); }
  function oppRoster(name){ try{ if(typeof EADB!=='undefined'&&EADB[name]&&typeof buildClub==='function') return buildClub(name).r; var cd=(typeof euroClubData==='function')?euroClubData(name):null; if(cd&&cd.r) return cd.r; }catch(e){} return []; }
  function userForm(){ var h=(S.history||[]).filter(function(e){ return typeof e.myGf==='number'&&typeof e.oppGf==='number'; }).slice(-5); return h.map(function(e){ return e.myGf>e.oppGf?'W':(e.myGf===e.oppGf?'D':'L'); }); }
  function teamForm(name,isCL){
    if(name===S.teamName){ var f=userForm(); if(f.length) return f; }
    var st=(isCL?S.clStandings:S.saStandings)||{}; var e=st[name];
    if(e && e.w!=null){ var seq=[]; var i; for(i=0;i<(e.w||0);i++)seq.push('W'); for(i=0;i<(e.d||0);i++)seq.push('D'); for(i=0;i<(e.l||0);i++)seq.push('L');
      var sd=seedOf(name); for(i=seq.length-1;i>0;i--){ sd=(sd*1103515245+12345)>>>0; var j=sd%(i+1); var t=seq[i];seq[i]=seq[j];seq[j]=t; } return seq.slice(-5); }
    return [];
  }
  function formHTML(arr){ if(!arr||!arr.length) return '<div class="fmd2-form"><span class="D" style="opacity:.4">-</span></div>'; return '<div class="fmd2-form">'+arr.map(function(x){ return '<span class="'+x+'">'+x+'</span>'; }).join('')+'</div>'; }

  /* ---------- INJURIES (no forced render -> avoids double Continua) ---------- */
  window._isInjured=function(name){ return !!(S.injuries && S.injuries[name] && S.injuries[name]>0); };
  function _postMatchInjuries(){
    if(!S.injuries) S.injuries={}; if(!S.injReplace) S.injReplace={};
    Object.keys(S.injuries).forEach(function(n){ S.injuries[n]--; if(S.injuries[n]<=0){ delete S.injuries[n];
      var rep=S.injReplace[n];
      if(rep){ var xi=S.draft.xi.findIndex(function(pp){return pp&&pp.name===rep;}); var bi=S.bench.findIndex(function(pp){return pp&&pp.name===n;}); if(xi>=0&&bi>=0){ var back=S.bench[bi]; S.bench[bi]=S.draft.xi[xi]; S.draft.xi[xi]=back; if(typeof recalcStrength==='function') recalcStrength(); if(typeof toast==='function') toast((window.FMI?window.FMI('verified',14):'')+' '+n+' rientra dall infortunio ed e di nuovo titolare'); } }
      delete S.injReplace[n];
    } });
    var concurrent=Object.keys(S.injuries).length;
    var starters=(S.draft&&S.draft.xi?S.draft.xi:[]).filter(Boolean).filter(function(p){ return !S.injuries[p.name]; });
    if(concurrent<2 && starters.length && Math.random()<0.035){
      var v=starters[rndi(starters.length)]; var out=2+rndi(5); S.injuries[v.name]=out;
      var idx=S.draft.xi.findIndex(function(p){ return p&&p.name===v.name; });
      if(idx>=0){ var role=(v.roles&&v.roles[0])||'CC'; var rp=(typeof _pickReserve==='function')?_pickReserve(role,S.draft.xi):null; if(rp){ var bx=S.bench.findIndex(function(b){ return b&&b.name===rp.name; }); S.draft.xi[idx]=rp; if(bx>=0) S.bench[bx]=v; else S.bench.push(v); S.injReplace[v.name]=rp.name; if(typeof recalcStrength==='function') recalcStrength(); } }
      if(typeof toast==='function') toast(I('injury',14)+' <b>'+v.name+'</b> si e infortunato, out '+out+' partite');
      if(!S.newsLog) S.newsLog=[]; S.newsLog.unshift({t:'inj', p:v.name, out:out, at:S.currentWeek, season:S.season});
    }
  }
  if(typeof window.runSim==='function' && !window.__fmInjWrap){
    var _origRunSim=window.runSim;
    window.runSim=function(){ var wk=S.currentWeek; var r=_origRunSim.apply(this,arguments); try{ if(S.currentWeek>wk){ _postMatchInjuries(); } }catch(e){} return r; };
    window.__fmInjWrap=true;
  }

  /* ---------- TRANSFER LOG (truthful feed) : log real sales ---------- */
  if(typeof window.acceptOffer==='function' && !window.__fmAcceptWrap){
    var _origAccept=window.acceptOffer;
    window.acceptOffer=function(i){
      var o=(S.offers&&S.offers[i])?S.offers[i]:null; var pObj=null;
      if(o){ pObj=(S.draft.xi||[]).find(function(p){return p&&p.name===o.name;}) || (S.bench||[]).find(function(p){return p&&p.name===o.name;}); }
      var r=_origAccept.apply(this,arguments);
      try{
        if(o && pObj){
          if(!S.newsLog) S.newsLog=[]; S.newsLog.unshift({t:(o.type==='loan'?'loanout':'out'), p:o.name, club:o.club, fee:o.fee, at:S.currentWeek}); if(o.type==='loan'){ pObj.loanTo=o.club; pObj.loanYears=1+(Math.floor(Math.random()*2)); pObj.loanRecallFee=Math.max(0.2,Math.round(((typeof playerPrice==='function'?playerPrice(pObj):5)*0.05)*10)/10); }
          if(o.type!=='loan'){ var cd=(typeof euroClubData==='function')?euroClubData(o.club):null; if(cd&&cd.r && !cd.r.some(function(x){return x&&x.name===pObj.name;})) cd.r.push(pObj); if(typeof _wClubCache!=='undefined'&&_wClubCache) delete _wClubCache[o.club]; }
        }
      }catch(e){}
      return r;
    };
    window.__fmAcceptWrap=true;
  }

  /* ---------- SMART FEED : only verifiable, in-game truth ---------- */
  function leagueLogo(){ try{ if(typeof getLeagueLogo==='function'){ var l=getLeagueLogo(S.leagueName); if(l) return l; } if(typeof leagueFallbackLogo==='function') return leagueFallbackLogo(S.leagueName); }catch(e){} return 'https://ui-avatars.com/api/?name=L&background=0b2e1a&color=00D26A&bold=true'; }
  function euroLogo(){ try{ if(typeof EURO_LOGO!=='undefined'&&S.euroComp&&EURO_LOGO[S.euroComp]) return EURO_LOGO[S.euroComp]; }catch(e){} return 'https://ui-avatars.com/api/?name=UCL&background=06183b&color=7FB2FF&bold=true'; }
  function clubLogo(name){ try{ if(name===S.teamName) return S.userLogo; if(typeof EADB!=='undefined'&&EADB[name]&&typeof getLogo==='function') return getLogo(EADB[name].tid, name); }catch(e){} return 'https://ui-avatars.com/api/?name='+encodeURIComponent((name||'FC').slice(0,2))+'&background=0d1620&color=8ea0b5&bold=true'; }
  function leaderOf(){ try{ var st=S.saStandings||{}; var r=Object.keys(st).sort(function(a,b){ return (st[b].pts||0)-(st[a].pts||0)||(st[b].gd||0)-(st[a].gd||0); }); return r[0]||null; }catch(e){ return null; } }

  window.buildSocial=function(m){
    var club=S.teamName, oppN=(m&&m.name)?m.name:'i prossimi avversari';
    var posts=[];
    var frAv='https://ui-avatars.com/api/?name=FR&background=0e1622&color=00d26a&bold=true';
    var skyAv='https://ui-avatars.com/api/?name=SS&background=1a1a2e&color=ffffff&bold=true';
    var optaAv='https://ui-avatars.com/api/?name=Op&background=0a2540&color=ffffff&bold=true';
    function P(o){ o.likes=(o.likes!=null)?o.likes:(0.4+Math.random()*24); o.comments=(o.comments!=null)?o.comments:(0.1+Math.random()*4); o.time=o.time||(['ora','2m','7m','18m','35m','1h','2h'][rndi(7)]); posts.push(o); }

    // 1) last real result
    var last=(S.history||[]).filter(function(e){ return typeof e.myGf==='number'; }).slice(-1)[0];
    if(last){ var win=last.myGf>last.oppGf, draw=last.myGf===last.oppGf;
      P({ cat:'media', acct:(S.leagueName||'Campionato'), handle:'@'+(S.leagueName||'Lega').replace(/\s/g,''), logo:leagueLogo(), verified:true, text:(win?'Tre punti pesanti: ':'')+club+' '+last.myGf+'-'+last.oppGf+' '+(last.opp||'')+'. '+(win?'Prestazione convincente.':draw?'Un pari che smuove la classifica.':'Ko da archiviare in fretta.') });
      P({ cat:'fans', acct:'Curva '+club.split(' ')[0], handle:'@ultras_'+club.replace(/\s/g,'').toLowerCase().slice(0,10), logo:clubLogo(club), text:(win?'CHE SQUADRA! Continuiamo cos\u00ec!':draw?'Dovevamo vincerla, ma sotto a testa bassa.':'Serve pi\u00f9 fame. Noi ci siamo comunque.') });
    }
    // 2) upcoming match preview (real prediction sense)
    if(m){ var myStr=S.strength||70, oppStr=(typeof EADB!=='undefined'&&EADB[oppN]&&EADB[oppN].str)||m.str||70;
      var fav=myStr>oppStr+2?club:(oppStr>myStr+2?oppN:null);
      P({ cat:'media', acct:'Sky Sport', handle:'@SkySport', logo:skyAv, verified:true, text:'Vigilia di '+club+'-'+oppN+'. '+(fav?('Favori d\'obbligo per '+fav+' (media OVR '+(fav===club?myStr:oppStr)+').'):'Equilibrio totale tra due squadre di pari livello (OVR '+myStr+' vs '+oppStr+').') });
      if(oppStr>=83){ P({ cat:'media', acct:'UEFA', handle:'@UEFA', logo:euroLogo(), verified:true, text:'Big match in arrivo: '+club+' sfida '+oppN+', una delle corazzate d\'Europa.' }); }
    }
    // 3) real standings
    var pos=(typeof rankOf==='function')?rankOf(S.teamName, S.saStandings):'-';
    if(pos&&pos!=='-'){ var lead=leaderOf(); P({ cat:'media', acct:'Opta Italia', handle:'@OptaPaolo', logo:optaAv, verified:true, text:club+' \u00e8 '+pos+'\u00ba in '+(S.leagueName||'campionato')+(lead&&lead!==club?(' \u00b7 in vetta comanda '+lead+'.'):(lead===club?' \u00b7 primato in classifica!':'.')) }); }
    // 4) real injuries
    var injNames=S.injuries?Object.keys(S.injuries).filter(function(n){return S.injuries[n]>0;}):[];
    if(injNames.length){ P({ cat:'media', acct:'Sky Sport', handle:'@SkySport', logo:skyAv, verified:true, text:'Infermeria '+club+': out '+injNames.slice(0,3).join(', ')+'. Lo staff medico monitora il recupero.' }); }
    // 5) Fabrizio Romano - ONLY real user market activity
    var logIn=(S.newsLog||[]).filter(function(e){ return e.t==='out'||e.t==='loanout'; }).slice(0,2);
    if(logIn.length){ logIn.forEach(function(e){ P({ cat:'media', acct:'Fabrizio Romano', handle:'@FabrizioRomano', logo:frAv, verified:true, likes:60+Math.random()*90, comments:6+Math.random()*16, text:e.p+' to '+e.club+', '+(e.t==='loanout'?'loan deal done.':'here we go and confirmed!')+' '+club+' '+(e.t==='loanout'?'lo lascia in prestito.':'incassa '+(e.fee?('\u20ac'+e.fee+'M'):'la cifra pattuita')+'.') }); }); }
    else if(S.offers&&S.offers.length){ var of=S.offers[0]; P({ cat:'media', acct:'Fabrizio Romano', handle:'@FabrizioRomano', logo:frAv, verified:true, likes:40+Math.random()*60, comments:5+Math.random()*10, text:of.club+' interested in '+of.name+' ('+club+'). Offerta sul tavolo, '+club+' valuta. Understand talks are ongoing.' }); }
    else { P({ cat:'media', acct:'Fabrizio Romano', handle:'@FabrizioRomano', logo:frAv, verified:true, likes:30+Math.random()*40, comments:3+Math.random()*8, text:'Fase di mercato tranquilla per '+club+': nessuna trattativa avanzata al momento. Continuo a monitorare. Stay tuned.' }); }
    // 6) club / fans voice
    P({ cat:'players', acct:club, handle:'@'+club.replace(/\s/g,'').toLowerCase().slice(0,14), logo:clubLogo(club), verified:true, text:'Testa alla prossima. Insieme, sempre. #Forza'+club.replace(/\s/g,'') });
    P({ cat:'fans', acct:'Tifoso '+club.split(' ')[0], handle:'@'+club.replace(/\s/g,'').toLowerCase().slice(0,8)+'_fan', logo:'https://ui-avatars.com/api/?name=Fan&background=1b2735&color=cdd8e6&bold=true', text:'Biglietti presi, sciarpa al collo. Non vedo l\'ora!' });
    return posts;
  };

  window.setFeedTab=function(t){ S.feedTab=t; if(typeof render==='function') render(); };
  window.afterHubRender=function(){
    var track=document.getElementById('social-track');
    if(track){
      var posts=window.buildSocial(S.calendar[S.currentWeek])||[]; var tab=S.feedTab||'all';
      if(tab!=='all'){ posts=posts.filter(function(p){ if(tab==='players') return p.cat==='players'||p.cat==='club'; return p.cat===tab; }); }
      if(!posts.length) posts=[{cat:'media',acct:'The Feed',handle:'@feed',logo:'https://ui-avatars.com/api/?name=TF&background=0d1620&color=8ea0b5',text:'Nessun contenuto in questa categoria.',time:'ora',likes:0,comments:0}];
      track.innerHTML=posts.map(function(p){
        var lk=p.likes>=1?(p.likes>=10?Math.round(p.likes)+'K':p.likes.toFixed(1)+'K'):Math.round(p.likes*100);
        var cm=p.comments>=1?p.comments.toFixed(1)+'K':Math.round(p.comments*90);
        return '<div class="fmd2-post"><div class="fmd2-post-h">'+
          '<img src="'+p.logo+'" onerror="this.src=(typeof AVT!==\'undefined\'?AVT:\'\')">'+
          '<div class="fmd2-acct"><div class="fmd2-name">'+p.acct+(p.verified?I('verified',14):'')+'</div><div class="fmd2-handle">'+p.handle+'</div></div>'+
          '<div class="fmd2-time">'+(p.time||'')+'</div></div>'+
          '<div class="fmd2-msg">'+p.text+'</div>'+
          '<div class="fmd2-eng"><span>'+I('heart',14)+' '+lk+'</span><span>'+I('comment',14)+' '+cm+'</span></div></div>';
      }).join('');
    }
    if(typeof refreshMusicUI==='function') refreshMusicUI();
  };

  /* ---------- MUSIC : ID3 parse + preset folder loader + user add ---------- */
  function b64(bytes){ var bin='',chunk=0x8000; for(var i=0;i<bytes.length;i+=chunk){ bin+=String.fromCharCode.apply(null,bytes.subarray(i,i+chunk)); } return btoa(bin); }
  function dec(bytes,start,len,enc){ try{ var sub=bytes.subarray(start,start+len); var label=(enc===1)?'utf-16':(enc===2)?'utf-16be':(enc===3)?'utf-8':'iso-8859-1'; if(typeof TextDecoder!=='undefined') return new TextDecoder(label).decode(sub).replace(/\u0000+$/,'').trim(); var s=''; for(var i=0;i<sub.length;i++) s+=String.fromCharCode(sub[i]); return s.replace(/\u0000+$/,'').trim(); }catch(e){ return ''; } }
  function parseID3(buf, cb){
    try{ var u8=new Uint8Array(buf); if(!(u8[0]===0x49&&u8[1]===0x44&&u8[2]===0x33)){ cb({}); return; }
      var ver=u8[3]; var size=(u8[6]<<21)|(u8[7]<<14)|(u8[8]<<7)|u8[9]; var pos=10,end=Math.min(u8.length,10+size),out={};
      while(pos<end-10){ var id=String.fromCharCode(u8[pos],u8[pos+1],u8[pos+2],u8[pos+3]); if(id.charCodeAt(0)===0) break;
        var fsize; if(ver===4){ fsize=(u8[pos+4]<<21)|(u8[pos+5]<<14)|(u8[pos+6]<<7)|u8[pos+7]; } else { fsize=(u8[pos+4]<<24)|(u8[pos+5]<<16)|(u8[pos+6]<<8)|u8[pos+7]; }
        var fstart=pos+10; if(fsize<=0||fstart+fsize>end) break;
        if(id==='TIT2'||id==='TPE1'){ out[id]=dec(u8,fstart+1,fsize-1,u8[fstart]); }
        else if(id==='APIC'){ var p=fstart,enc=u8[p]; p++; var ms=p; while(u8[p]!==0&&p<fstart+fsize)p++; var mime=dec(u8,ms,p-ms,0); p++; p++; if(enc===1||enc===2){ while(p<fstart+fsize-1&&!(u8[p]===0&&u8[p+1]===0))p+=2; p+=2; } else { while(u8[p]!==0&&p<fstart+fsize)p++; p+=1; } var img=u8.subarray(p,fstart+fsize); if(img.length>50) out.cover='data:'+(mime||'image/jpeg')+';base64,'+b64(img); }
        pos=fstart+fsize;
      } cb(out);
    }catch(e){ cb({}); }
  }
  window.__fmParseID3=parseID3;
  function addTrackFromMeta(item){
    var file, meta={}; if(typeof item==='string'){ file=item; } else { file=item.file||item.src||item.name; meta=item||{}; }
    if(!file) return; var src=(/^https?:|^data:|^blob:/.test(file))?file:('music/'+file);
    var track={ title:meta.title||String(file).replace(/^.*\//,'').replace(/\.[^.]+$/,''), artist:meta.artist||'', src:src, cover:meta.cover||'' };
    window.__MY_TRACKS.push(track);
    if(!(meta.title&&meta.artist&&meta.cover)){
      fetch(src).then(function(r){ if(!r.ok) throw 0; return r.arrayBuffer(); }).then(function(buf){ parseID3(buf,function(tags){ if(tags.TIT2)track.title=tags.TIT2; if(tags.TPE1)track.artist=tags.TPE1; if(tags.cover)track.cover=tags.cover; if(typeof refreshMusicUI==='function') refreshMusicUI(); }); }).catch(function(){});
    }
    if(typeof refreshMusicUI==='function') refreshMusicUI();
  }
  window.fmLoadPresetMusic=function(){
    fetch('music/manifest.json').then(function(r){ if(!r.ok) throw 0; return r.json(); }).then(function(list){ var arr=Array.isArray(list)?list:(list.tracks||[]); arr.forEach(addTrackFromMeta); }).catch(function(){
      fetch('music/').then(function(r){ if(!r.ok) throw 0; return r.text(); }).then(function(html){ var re=/href="([^"]+\.(?:mp3|m4a|ogg|wav|flac|aac))"/gi,mm,seen={}; while((mm=re.exec(html))){ var f=decodeURIComponent(mm[1].replace(/^.*\//,'')); if(!seen[f]){ seen[f]=1; addTrackFromMeta(f); } } }).catch(function(){});
    });
  };
  window.musicAddOpen=function(){ var inp=document.getElementById('fm-music-input'); if(inp) inp.click(); };
  window.musicHandleFiles=function(input){
    var files=input&&input.files?Array.prototype.slice.call(input.files):[]; if(!files.length) return;
    var list=window.__MY_TRACKS||[]; var firstNew=list.length; var remaining=files.length;
    files.forEach(function(f){ var track={ title:f.name.replace(/\.[^.]+$/,''), artist:'Brano locale', src:URL.createObjectURL(f), cover:'' }; list.push(track);
      var rd=new FileReader(); rd.onload=function(e){ parseID3(e.target.result,function(tags){ if(tags.TIT2)track.title=tags.TIT2; if(tags.TPE1)track.artist=tags.TPE1; if(tags.cover)track.cover=tags.cover; if(--remaining<=0){ if(typeof MUSIC!=='undefined') MUSIC.i=firstNew; if(typeof refreshMusicUI==='function') refreshMusicUI(); } }); };
      rd.onerror=function(){ if(--remaining<=0){ if(typeof MUSIC!=='undefined') MUSIC.i=firstNew; if(typeof refreshMusicUI==='function') refreshMusicUI(); } };
      try{ rd.readAsArrayBuffer(f.slice(0,400000)); }catch(err){ remaining--; }
    });
    if(typeof MUSIC!=='undefined') MUSIC.i=firstNew; if(typeof refreshMusicUI==='function') refreshMusicUI();
    if(typeof toast==='function') toast(I('music',14)+' '+files.length+' brano/i aggiunto/i');
  };
  window.musicPlayerHTML=function(){
    var t=(typeof curTrack==='function')?curTrack():{title:'\u2014',artist:'',cover:''};
    var playing=(typeof MUSIC!=='undefined'&&MUSIC.audio&&!MUSIC.audio.paused);
    var art=t.cover?'<img class="fmd2-music-art" id="music-art" src="'+t.cover+'">':'<div class="fmd2-music-art" id="music-art">'+I('music',22)+'</div>';
    return '<div class="fmd2-music">'+art+
      '<div class="fmd2-music-meta"><div class="fmd2-music-t" id="music-title">'+t.title+'</div><div class="fmd2-music-a" id="music-artist">'+(t.artist||'')+'</div><div class="fmd2-music-pbar"><i id="music-bar"></i></div></div>'+
      '<div class="fmd2-music-ctrl">'+
      '<button class="add" title="Aggiungi la tua musica" onclick="musicAddOpen()">'+I('plus',18)+'</button>'+
      '<button title="Precedente" onclick="musicPrev()">'+I('prev',16)+'</button>'+
      '<button class="pp" id="music-state" title="Play/Pausa" onclick="musicPlay()">'+(playing?I('pause',16):I('play',16))+'</button>'+
      '<button title="Successivo" onclick="musicNext()">'+I('nxt',16)+'</button></div>'+
      '<input type="file" id="fm-music-input" accept="audio/*" multiple style="display:none" onchange="musicHandleFiles(this)"></div>';
  };
  window.refreshMusicUI=function(){
    var t=(typeof curTrack==='function')?curTrack():{title:'\u2014',artist:''};
    var nm=document.getElementById('music-title'),ar=document.getElementById('music-artist'),st=document.getElementById('music-state'),ar2=document.getElementById('music-art');
    if(nm)nm.textContent=t.title; if(ar)ar.textContent=t.artist||'';
    var playing=(typeof MUSIC!=='undefined'&&MUSIC.audio&&!MUSIC.audio.paused); if(st) st.innerHTML=playing?I('pause',16):I('play',16);
    if(ar2){ if(t.cover){ if(ar2.tagName==='IMG'){ ar2.src=t.cover; } else { ar2.outerHTML='<img class="fmd2-music-art" id="music-art" src="'+t.cover+'">'; } } else if(ar2.tagName==='IMG'){ ar2.outerHTML='<div class="fmd2-music-art" id="music-art">'+I('music',22)+'</div>'; } }
  };

  /* ---------- SEASON END (redesigned, dark AAA, icons) ---------- */
  window.renderSeasonEnd=function(){
    var st=S.saStandings[S.teamName]||{w:0,d:0,l:0};
    var rnk=Object.entries(S.saStandings).sort(function(x,y){ return y[1].pts-x[1].pts||y[1].gd-x[1].gd||y[1].gf-x[1].gf; });
    var myPos=rnk.map(function(e){return e[0];}).indexOf(S.teamName)+1;
    var pr=(typeof seasonPrize==='function')?seasonPrize():{lines:[],prize:0};
    var prizeLines=pr.lines.map(function(l){ return '<div class="se-prize-l"><span>'+l.k+'</span><b>\u20ac'+l.v+'M</b></div>'; }).join('');
    var renew=(typeof renderRenewalsBox==='function')?renderRenewalsBox():'';
    var end=(typeof MAX_SEASONS!=='undefined'&&S.season>=MAX_SEASONS);
    var yr=(typeof getYear==='function')?getYear():'';
    var btn=end? '<div class="se-done">'+I('trophy',22)+' Carriera completata: 30 stagioni!</div>'
      : '<button class="se-btn" onclick="advanceSeason()">'+I('advance',18)+' Inizia Stagione '+(S.season+1)+' / '+MAX_SEASONS+'</button><p class="se-note">I giovani cresceranno verso il loro potenziale; i veterani inizieranno a calare.</p>';
    return '<div class="se-wrap"><div class="se-card">'+
      '<div class="se-badge">'+I('trophy',34)+'</div>'+
      '<div class="se-title">Stagione conclusa</div>'+
      '<div class="se-sub">Hai completato l\'annata '+yr+' con '+(S.teamName||'')+'</div>'+
      '<div class="se-stats">'+
        '<div class="se-stat"><div class="se-k">'+I('chart',14)+' Posizione '+(S.leagueName||'Camp.')+'</div><div class="se-v">'+myPos+'\u00ba</div></div>'+
        '<div class="se-stat"><div class="se-k">'+I('shield',14)+' Record V-N-P</div><div class="se-v">'+(st.w||0)+'-'+(st.d||0)+'-'+(st.l||0)+'</div></div>'+
      '</div>'+
      '<div class="se-sec">'+I('coins',15)+' Premi stagione</div>'+
      '<div class="se-prize">'+prizeLines+'<div class="se-prize-t"><span>Totale incassato</span><b>\u20ac'+pr.prize+'M</b></div></div>'+
      (renew?('<div class="se-sec">'+I('doc',15)+' Contratti</div><div class="se-renew">'+renew+'</div>'):'')+
      btn+
    '</div></div>';
  };

  /* ---------- DASHBOARD ---------- */
  function fact(icon,label,val){ return '<div class="fmd2-fact">'+I(icon,16)+'<span class="lbl">'+label+'</span><b>'+val+'</b></div>'; }
  window.dashboardPano=function(m){
    if(m && m.type==='BDO' && typeof _origPano==='function') return _origPano(m);
    if(!m) return '<div style="padding:50px;text-align:center;color:#9fb0c3">Nessuna partita in programma.</div>';
    if(typeof ensureOpponent==='function') ensureOpponent(m);
    var isCL=m.type&&m.type.indexOf('CL')===0;
    var oppN=m.name||'Da definire';
    var oppLogo=m.logo||((typeof getLogo==='function')?getLogo(null):'');
    var myPos=(typeof rankOf==='function')?rankOf(S.teamName, isCL?S.clStandings:S.saStandings):'-';
    var oppPos=(typeof rankOf==='function')?rankOf(oppN, isCL?S.clStandings:S.saStandings):'-';
    var myStr=S.strength||70;
    var oppStr=(typeof EADB!=='undefined'&&EADB[oppN]&&EADB[oppN].str)||m.str||70;
    var bp=myStr-oppStr+(m.home?4:-2);
    var pH=Math.round(1/(1+Math.pow(10,-bp/16))*74)+6; if(pH>88)pH=88; if(pH<6)pH=6;
    var pD=Math.round((100-pH)*0.30); var pA=100-pH-pD;
    var homeName=m.home?S.teamName:oppN, awayName=m.home?oppN:S.teamName;
    var homeP=m.home?pH:pA, awayP=m.home?pA:pH;

    var sd=seedOf((S.teamName||'')+oppN+(m.week||0));
    var ref=REFS[sd%REFS.length];
    var temp=6+((sd>>>5)%18);
    var wx=(WX[(sd>>>3)%WX.length]||'Sereno')+' \u00b7 '+temp+'\u00b0';
    var venue=(m.home?S.teamName:oppN)+' Stadium';
    var big=(m.home?myStr:oppStr)>=82;
    var att=big?'Tutto esaurito':fmtNum(24000+((sd>>>2)%17000));
    var comp=(typeof compLabel==='function')?compLabel(m.type):(S.leagueName||'Serie A');
    var compLogo=(typeof compLogoUrl==='function')?compLogoUrl(m.type):'';
    var kickIn=['tra 3 giorni','tra 2 giorni','domani','oggi'][sd%4];

    var myXI=(S.draft&&S.draft.xi?S.draft.xi:[]).filter(Boolean).slice().sort(function(a,b){return (b.rate||0)-(a.rate||0);});
    var myBest=myXI[0];
    var oppR=oppRoster(oppN).slice().sort(function(a,b){return (b.rate||0)-(a.rate||0);});
    var oppBest=oppR[0];
    var kb;
    /* in casa a sinistra, in trasferta a destra: come nell'intestazione */
    var _kbL=(m.home?myBest:oppBest), _kbR=(m.home?oppBest:myBest);
    if(myBest&&oppBest){ kb='<div class="fmd2-kb"><div class="fmd2-kb-p"><img src="'+(_kbL.img||'')+'" onerror="this.src=(typeof AVP!==\'undefined\'?AVP:\'\')"><div><div class="fmd2-kb-nm">'+_kbL.name.split(' ').pop()+'</div><div class="fmd2-kb-ro">'+(_kbL.roles?_kbL.roles[0]:'')+'</div></div><div class="fmd2-kb-r">'+_kbL.rate+'</div></div><div class="fmd2-kb-vs">VS</div><div class="fmd2-kb-p r"><img src="'+(_kbR.img||'')+'" onerror="this.src=(typeof AVP!==\'undefined\'?AVP:\'\')"><div><div class="fmd2-kb-nm">'+_kbR.name.split(' ').pop()+'</div><div class="fmd2-kb-ro">'+(_kbR.roles?_kbR.roles[0]:'')+'</div></div><div class="fmd2-kb-r">'+_kbR.rate+'</div></div></div>'; }
    else { kb='<div class="fmd2-news-ok">'+I('scout',15)+' Dati avversario non disponibili.</div>'; }

    var squad=(S.draft&&S.draft.xi?S.draft.xi:[]).filter(Boolean).concat(S.bench||[]);
    var seen={},news=[];
    squad.forEach(function(p){ if(seen[p.name])return; seen[p.name]=1;
      if(window._isInjured(p.name)){ news.push('<div class="fmd2-news-i">'+I('injury',15).replace('class="fi"','class="fi inj"')+' '+p.name+'<span class="st inj">Infortunato \u00b7 '+S.injuries[p.name]+' gg</span></div>'); }
      else if(typeof _isSusp==='function'&&_isSusp(p.name)){ news.push('<div class="fmd2-news-i">'+I('red',14).replace('class="fi"','class="fi red"')+' '+p.name+'<span class="st red">Squalificato</span></div>'); }
    });
    var newsHTML=news.length?news.slice(0,5).join(''):'<div class="fmd2-news-ok">'+I('verified',15)+' Rosa al completo \u00b7 tutti disponibili</div>';
    var objs=['Qualificarsi alla prossima Champions','Non perdere pi\u00f9 di 4 partite in campionato','Far esordire un giovane della Primavera'];
    var hh=new Date().getHours(); var greet=hh<12?'Buongiorno':hh<18?'Buon pomeriggio':'Buonasera';
    var homeForm=teamForm(homeName,isCL), awayForm=teamForm(awayName,isCL);
    var homeLogo=m.home?S.userLogo:oppLogo, awayLogo=m.home?oppLogo:S.userLogo;
    var homePos=m.home?myPos:oppPos, awayPos=m.home?oppPos:myPos;
    var dstr=(typeof dayLong==='function')?dayLong(m.date):'';
    var coachFace=S.coachFace||('https://ui-avatars.com/api/?name='+encodeURIComponent(S.coachName||'M')+'&background=0d1620&color=fff&bold=true');

    var top='<div class="fmd2-top"><div class="fmd2-hello-wrap">'+
      '<img class="fmd2-coach" src="'+coachFace+'" onerror="this.src=\'https://ui-avatars.com/api/?name='+encodeURIComponent(S.coachName||'M')+'&background=0d1620&color=fff&bold=true\'">'+
      '<div class="fmd2-hello">'+greet+', '+(S.coachName||'Mister')+'<small>Giornata '+(m.week||'-')+' \u00b7 '+(S.teamName||'')+'</small></div>'+
      '<div class="fmd2-datechip">'+I('calendar',15)+dstr+'</div>'+
      '</div>'+
      '<div class="fmd2-stats">'+
      '<div class="fmd2-stat">'+I('shield',18)+'<div><div class="k">Societ\u00e0</div><div class="v">Salda</div></div></div>'+
      '<div class="fmd2-stat">'+I('people',18)+'<div><div class="k">Morale</div><div class="v">'+(function(){var f=userForm();return f.filter(function(x){return x==='W';}).length>=3?'Alto':f.filter(function(x){return x==='L';}).length>=3?'Basso':'Stabile';})()+'</div></div></div>'+
      '<div class="fmd2-stat">'+I('coins',18)+'<div><div class="k">Budget</div><div class="v">\u20ac'+((S.budget!=null?S.budget:0))+'M</div></div></div>'+
      '<div class="fmd2-stat">'+I('save',18)+'<div><div class="k">Salvataggio</div><div class="v">Sincronizzato</div></div></div>'+
      '</div></div>';

    var card='<div class="fmd2-card stadium-bg-x">'+
      '<div class="fmd2-comp">'+(compLogo?'<img src="'+compLogo+'" onerror="this.style.display=\'none\'">':'')+comp+'<span class="kick">Calcio d\'inizio '+kickIn+' \u00b7 20:45</span></div>'+
      '<div class="fmd2-vs">'+
        '<div class="fmd2-vs-team"><img src="'+homeLogo+'" onerror="this.src=(typeof AVT!==\'undefined\'?AVT:\'\')"><div class="fmd2-vs-nm">'+homeName.toUpperCase()+'</div><div class="fmd2-vs-pos">'+homePos+'\u00ba \u00b7 Casa</div>'+formHTML(homeForm)+'</div>'+
        '<div class="fmd2-vs-mid"><div class="vs">VS</div><div class="dt">'+dstr+'</div></div>'+
        '<div class="fmd2-vs-team"><img src="'+awayLogo+'" onerror="this.src=(typeof AVT!==\'undefined\'?AVT:\'\')"><div class="fmd2-vs-nm">'+awayName.toUpperCase()+'</div><div class="fmd2-vs-pos">'+awayPos+'\u00ba \u00b7 Trasferta</div>'+formHTML(awayForm)+'</div>'+
      '</div>'+
      '<div class="fmd2-sec-h">'+I('scout',14)+'Pronostico</div>'+
      '<div class="fmd2-pred-bar"><span class="fmd2-ph" style="width:'+homeP+'%">'+homeP+'%</span><span class="fmd2-pd" style="width:'+pD+'%">'+pD+'%</span><span class="fmd2-pw" style="width:'+awayP+'%">'+awayP+'%</span></div>'+
      '<div class="fmd2-pred-l"><span>1 <b>'+homeName+'</b></span><span>X Pareggio</span><span><b>'+awayName+'</b> 2</span></div>'+
      '<div class="fmd2-sec-h">'+I('news',14)+'Match facts</div>'+
      '<div class="fmd2-facts">'+fact('pin','Stadio',venue)+fact('whistle','Arbitro',ref)+fact('weather','Meteo',wx)+fact('crowd','Spettatori',att)+fact('grid','Modulo',(S.formationName||'4-3-3'))+fact('shirt','Competizione',(isCL?'UEFA':(S.leagueName||'Serie A')))+'</div>'+
      '<div class="fmd2-sec-h">'+I('news',14)+'Notizie squadra</div>'+newsHTML+
      '<div class="fmd2-sec-h">'+I('duel',14)+'Duello chiave</div>'+kb+
      '<div class="fmd2-actions">'+
                '<button class="fmd2-btn primary" data-m3d="1" style="background:linear-gradient(180deg,#00e67a,#00a653);color:#04180d;" onclick="playMatch3D()">'+I('play',18)+'Gioca la partita</button>'+
'<button class="fmd2-btn primary" onclick="playMatchRealtime()">'+I('advance',18)+'Simula la partita</button>'+
        '<button class="fmd2-btn ghost" onclick="runSimLive()">'+I('play',16)+'Simulazione veloce</button>'+
        '<button class="fmd2-btn ghost" onclick="advanceToDate('+m.date+',{stopAtMatch:true})">'+I('calendar',16)+'Avanza i giorni</button>'+
        '<button class="fmd2-btn ghost" onclick="viewTeamModal(\''+String(oppN).replace(/'/g,"\\'")+'\')">'+I('scout',16)+'Analisi avversario</button>'+
      '</div>'+
    '</div>';

    var obj='<div class="fmd2-obj"><div class="fmd2-sec-h" style="margin:0 0 6px">'+I('shield',14)+'Obiettivi societ\u00e0</div>'+objs.map(function(o){ return '<div class="fmd2-obj-i">'+I('advance',13)+o+'</div>'; }).join('')+'</div>';

    var tab=S.feedTab||'all';
    function tbn(id,label,icon){ return '<div class="fmd2-tab'+(tab===id?' on':'')+'" onclick="setFeedTab(\''+id+'\')">'+I(icon,13)+label+'</div>'; }
    var side='<div class="fmd2-feed"><div class="fmd2-feed-h"><span class="tt">THE FEED</span><span class="fmd2-live"><i></i>LIVE</span></div>'+
      '<div class="fmd2-tabs">'+tbn('all','Tutto','grid')+tbn('media','Media','camera')+tbn('fans','Tifosi','people')+tbn('players','Club','shirt')+'</div>'+
      '<div class="fmd2-feed-track" id="social-track"></div></div>'+(typeof musicPlayerHTML==='function'?musicPlayerHTML():'');

    return '<div class="fmd2">'+top+'<div class="fmd2-grid"><div class="fmd2-main">'+card+obj+'</div><div class="fmd2-side">'+side+'</div></div></div>';
  };

  try{ if(typeof S!=='undefined'){ if(!S.injuries) S.injuries={}; if(S.feedTab==null) S.feedTab='all'; if(!S.newsLog) S.newsLog=[]; } }catch(e){}
  try{ window.fmLoadPresetMusic(); }catch(e){}
})();

