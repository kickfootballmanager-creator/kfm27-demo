
(function(){
  if(typeof window.renderCalendario!=='function') return;
  function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  var KCAL_ORIG=window.renderCalendario;
  window.renderCalendario=function(){
    try{ var out=kcalRender.apply(this,arguments); if(out&&out.length>200) return out; }catch(e){ try{console.error('kcal',e);}catch(_){} }
    try{ return KCAL_ORIG.apply(this,arguments); }catch(e){ return ''; }
  };
  function kcalRender(){
    try{ if(typeof ensurePoStyle==='function') ensurePoStyle(); }catch(e){}
    var all=(S.calendar||[]).filter(function(e){ return e.date; });
    if(!all.length) return '<div class="kcal" style="padding:48px;text-align:center;letter-spacing:.2em;text-transform:uppercase;font-size:12px">Calendario non disponibile</div>';
    var idxNow=Math.min(S.currentWeek,S.calendar.length-1);
    var todayTs=S.currentDay||S.calendar[idxNow].date;
    var base=new Date(todayTs);
    var view=new Date(base.getFullYear(),base.getMonth()+(S.calMonthOffset||0),1);
    var y=view.getFullYear(), mo=view.getMonth();
    var monthName=view.toLocaleDateString('it-IT',{month:'long',year:'numeric'});
    monthName=monthName.charAt(0).toUpperCase()+monthName.slice(1);
    var first=new Date(y,mo,1), startDow=(first.getDay()+6)%7, days=new Date(y,mo+1,0).getDate();

    var byDay={};
    all.forEach(function(e){ var d=new Date(e.date);
      if(d.getFullYear()===y&&d.getMonth()===mo){ var ex=byDay[d.getDate()]; byDay[d.getDate()]=(ex&&ex.type==='BDO')?ex:e; } });
    var hist={};
    (S.history||[]).forEach(function(h){ if(!h.date) return; var d=new Date(h.date);
      if(d.getFullYear()===y&&d.getMonth()===mo) hist[d.getDate()]=h; });

    function meta(t){ try{ return calMeta(t)||{}; }catch(e){ return {}; } }
    var cells='';
    for(var i=0;i<startDow;i++) cells+='<div class="kc-cell empty"></div>';
    for(var dn=1; dn<=days; dn++){
      var ev=byDay[dn], h=hist[dn], cls='free', inner='';
      var td=new Date(todayTs);
      var isToday=(td.getDate()===dn&&td.getMonth()===mo&&td.getFullYear()===y);
      if(h){
        if(h.type==='BDO'){ cls='done special'; inner='<div class="kc-special">Pallone d\'Oro</div>'; }
        else{
          var cm=meta(h.type); cls='done'+(cm.cl?' '+cm.cl:'');
          var r=(h.res==='-')?'&middot;':(esc(h.res)+' '+h.myGf+'-'+h.oppGf);
          var _lh=(h.logo&&h.logo.indexOf('ui-avatars')<0)?'<img src="'+h.logo+'" onerror="this.style.display=\'none\'">':'';
          inner='<div class="kc-ev">'+_lh+'<span class="kc-res '+esc(h.res)+'">'+r+'</span></div>'+
                (cm.s?'<small style="font-size:8px;letter-spacing:.16em;text-transform:uppercase;color:rgba(255,255,255,.45);font-weight:700">'+esc(cm.s)+'</small>':'');
        }
      } else if(ev){
        if(ev.type==='BDO'){ cls='next special'; inner='<div class="kc-special">Pallone d\'Oro</div>'; }
        else{
          var cn=meta(ev.type); cls='next'+(cn.cl?' '+cn.cl:'');
          var _le=(ev.logo&&ev.logo.indexOf('ui-avatars')<0)?'<img src="'+ev.logo+'" onerror="this.style.display=\'none\'">':'';
          var _ne=esc(String(ev.name||'Avversario').replace(/\s*\(.*\)\s*$/,''));
          inner='<div class="kc-ev">'+_le+'<span class="kc-meta"><b>'+_ne+'</b><small>'+(ev.home?'Casa':'Trasferta')+(cn.s?' \u00b7 '+esc(cn.s):'')+'</small></span></div>';
        }
      }
      if(isToday) cls+=' today';
      if(S.selCalDay){ var sd=new Date(S.selCalDay); if(sd.getDate()===dn&&sd.getMonth()===mo) cls+=' selday'; }
      var cellTs=new Date(y,mo,dn,23,59,0).getTime();
      var endTs=Infinity; try{ if(typeof seasonEndTs==='function') endTs=seasonEndTs(); }catch(e){}
      var selectable=cellTs>todayTs&&cellTs<=endTs;
      cells+='<div class="kc-cell '+cls+'"'+(selectable?' data-click="1" style="cursor:pointer" onclick="selectCalDay('+cellTs+')"':'')+'>'+
             ((cls.indexOf('free')<0)?'<span class="kc-bar"></span>':'')+
             '<div class="kc-n">'+dn+'</div>'+inner+'</div>';
    }

    var dows=['L','M','M','G','V','S','D'].map(function(d){ return '<div>'+d+'</div>'; }).join('');
    var nm=S.calendar[idxNow];
    var dayTx=''; try{ dayTx=dayLong(todayTs).toUpperCase(); }catch(e){ dayTx=new Date(todayTs).toLocaleDateString('it-IT'); }
    var compTx=''; try{ compTx=nm?compLabel(nm.type):''; }catch(e){}
    var adv=''; try{ adv=(typeof calAdvancePanel==='function')?calAdvancePanel(todayTs):''; }catch(e){}
    try{ adv=String(adv).replace(/[\u2190-\u21FF\u2300-\u27BF\u2B00-\u2BFF\uFE0F]/g,'').replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g,''); }catch(e){}

    var nextCard=nm?('<div class="kc-card"><h4>Prossimo impegno</h4><div class="kc-next">'+
      '<img src="'+(nm.logo||S.userLogo||'')+'" onerror="this.style.display=\'none\'">'+
      '<div><b>'+esc(nm.opp||nm.oppName||compTx||'Prossima gara')+'</b>'+
      '<small>'+(nm.home?'In casa':'In trasferta')+(compTx?' &middot; '+esc(compTx):'')+'</small></div></div></div>'):'';

    return '<div class="kcal">'+
      '<div class="kcal-top">'+
        '<div class="kcal-now"><div class="kc-k">Oggi</div><div class="kc-d">'+esc(dayTx)+'</div>'+
          (compTx?'<div class="kc-c">'+esc(compTx)+'</div>':'')+'</div>'+
        '<div class="kcal-mnav"><button onclick="calNav(-1)">&lsaquo;</button><span>'+esc(monthName)+'</span><button onclick="calNav(1)">&rsaquo;</button></div>'+
        '<div class="kcal-team"><img src="'+(S.userLogo||'')+'" onerror="this.style.display=\'none\'"><span>'+esc(S.teamName||'')+'</span></div>'+
      '</div>'+
      '<div class="kcal-body">'+
        '<div class="kcal-cal"><div class="kcal-dows">'+dows+'</div><div class="kcal-grid">'+cells+'</div></div>'+
        '<aside class="kcal-side">'+nextCard+
          (adv?'<div class="kc-card"><h4>Avanza</h4>'+adv+'</div>':'')+
          '<div class="kc-card"><h4>Legenda</h4><div class="kc-legend">'+
            '<span class="kc-lg"><i style="background:#4ade80"></i>Campionato</span>'+
            '<span class="kc-lg"><i style="background:#5ad1ff"></i>Champions</span>'+
            '<span class="kc-lg"><i style="background:#ff9d3d"></i>Europa</span>'+
            '<span class="kc-lg"><i style="background:#c9a227"></i>Coppa</span>'+
          '</div></div>'+
        '</aside>'+
      '</div>'+
    '</div>';
  };
})();
