
(function(){
'use strict';
if(window.__AU31__) return; window.__AU31__=true;

var AK='kfm_accounts', SK='kfm_session', MAX=5;
function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function rd(k,d){ try{ var v=localStorage.getItem(k); return v?JSON.parse(v):d; }catch(e){ return d; } }
function wr(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} }
function accounts(){ var a=rd(AK,[]); return (a&&a.length!==undefined)?a:[]; }
function session(){ try{ return localStorage.getItem(SK)||sessionStorage.getItem(SK)||''; }catch(e){ return ''; } }
function setSession(m,rem){
  try{
    if(!m){ localStorage.removeItem(SK); sessionStorage.removeItem(SK); return; }
    if(rem===false){ sessionStorage.setItem(SK,m); localStorage.removeItem(SK); }
    else { localStorage.setItem(SK,m); sessionStorage.removeItem(SK); localStorage.setItem('kfm_last_mail',m); }
  }catch(e){}
}
function remGet(){ try{ return localStorage.getItem('kfm_remember')!=='0'; }catch(e){ return true; } }
function remSet(v){ try{ localStorage.setItem('kfm_remember',v?'1':'0'); if(!v) localStorage.removeItem('kfm_last_mail'); }catch(e){} }
function remBox(){ var e=document.getElementById('au-rem'); return e?!!e.checked:remGet(); }
function me(){ var m=session(); if(!m) return null; var f=null; accounts().forEach(function(a){ if(a.mail===m) f=a; }); return f; }
function hash(s){ var h=5381; s=String(s); for(var i=0;i<s.length;i++) h=((h<<5)+h+s.charCodeAt(i))|0; return String(h); }
function mailOk(m){ return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(m||''); }

/* ------------------------------------------------------------- slot store */
function slotKey(n){ return 'kfm_slot_'+(session()||'guest')+'_'+n; }
function slotGet(n){ return rd(slotKey(n),null); }
function slotDel(n){ try{ localStorage.removeItem(slotKey(n)); }catch(e){} }
var CUR={slot:0};
function autoKey(){ return 'kfm_auto_'+(session()||'guest'); }
function curKey(){ return 'kfm_cur_'+(session()||'guest'); }
function autoRaw(){ var a=null; try{ a=rd(autoKey(),null); }catch(e){} return a||null; }
function autoGet(){ var a=autoRaw(); return (a&&a.on)?a:null; }
function autoSet(on,slot){ try{ wr(autoKey(),{on:!!on,slot:slot||CUR.slot||0}); }catch(e){} }
var AUTOPICK=false;
window.kfmAutoState=function(){ var a=autoGet(); return a?{on:true,slot:a.slot||0}:{on:false,slot:0}; };
try{ CUR.slot=(+rd(curKey(),0))||0; }catch(e){}
function meta(){
  var S2=(typeof S!=='undefined'&&S)?S:{};
  return { team:S2.teamName||S2.club||'Squadra', league:S2.leagueName||'', season:S2.season||'', week:S2.currentWeek||0,
    strength:S2.strength||0, mode:S2.setupMode||'', at:Date.now() };
}
/* Scrive lo slot dicendo se ce l'ha fatta. Prima inghiottiva ogni
   errore: a memoria piena l'utente vedeva "Partita salvata" e lo slot
   restava vuoto. Se la scrittura fallisce, lo slot che c'era prima
   viene rimesso al suo posto. */
function slotWrite(n){
  var raw=null;
  try{ raw=localStorage.getItem('mgr26save'); }catch(e){ return false; }
  if(!raw) return false;
  var k=slotKey(n), prima=null;
  try{ prima=localStorage.getItem(k); }catch(e){}
  try{ localStorage.setItem(k, JSON.stringify({meta:meta(), raw:raw})); return true; }
  catch(e){
    if(prima!==null){ try{ localStorage.setItem(k, prima); }catch(e2){} }
    return false;
  }
}
var _save=window.saveGame;
var _load=window.loadGame;
function doSave(n){
  CUR.slot=n;
  try{ wr(curKey(),n); }catch(e){}
  var r=(typeof _save==='function')?_save.call(window):undefined;
  /* _save torna false quando non e' riuscito a scrivere mgr26save:
     in quel caso non ha senso copiare nulla nello slot */
  if(r===false) return false;
  if(!slotWrite(n)){
    if(typeof gameMsg==='function') gameMsg({title:'Slot non scritto',msg:'La partita &egrave; stata salvata, ma non &egrave; entrata nello slot '+n+': memoria del browser piena. Elimina uno slot e riprova.',icon:'warn'});
    else if(typeof toast==='function') toast('Slot '+n+' non scritto: memoria piena');
    return false;
  }
  /* prima il disco, poi il cloud: se il cloud non c'e' non cambia nulla */
  try{ if(typeof window.kfmCloudPush==='function') window.kfmCloudPush(n); }catch(e){}
  return true;
}
window.saveGameSilent=function(){ if(!CUR.slot) CUR.slot=firstFree()||1; return doSave(CUR.slot); };
function silentSave(){
  /* salva da solo SOLO se il salvataggio automatico e' attivo */
  var a=autoGet(); if(!a) return;
  var n=a.slot||CUR.slot||0; if(!n) return;
  return doSave(n);
}
function pickSave(){
  if(!me()){ pendingAfter=pickSave; mode='in'; authUI(); return; }
  pending=null; slotMode='save'; slotUI();
}
function pickLoad(){
  if(!me()){ pendingAfter=pickLoad; mode='in'; authUI(); return; }
  pending=null; slotMode='load'; slotUI();
}
window.kfmPickSave=pickSave;
window.kfmPickLoad=pickLoad;
window.saveGame=silentSave;
window.saveGameSilent=silentSave;
window.loadGame=function(){ pickLoad(); };
function hookTools(){
  if(document.__au31tools) return; document.__au31tools=true;
  document.addEventListener('click',function(ev){
    var t=ev.target; if(!t||!t.closest) return;
    var el=t.closest('[onclick]'); if(!el) return;
    var a=el.getAttribute('onclick')||'';
    if(a.indexOf('saveGame(')>=0){ ev.preventDefault(); ev.stopImmediatePropagation(); pickSave(); return; }
    if(a.indexOf('loadGame(')>=0){ ev.preventDefault(); ev.stopImmediatePropagation(); pickLoad(); }
  },true);
}
function firstFree(){ for(var i=1;i<=MAX;i++) if(!slotGet(i)) return i; return 0; }
function dt(ts){ try{ var d=new Date(ts); return ('0'+d.getDate()).slice(-2)+'/'+('0'+(d.getMonth()+1)).slice(-2)+'/'+d.getFullYear()+' '+('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2); }catch(e){ return ''; } }

/* ------------------------------------------------------------------- root */
var root=document.createElement('div'); root.id='au31'; root.className='off';
root.innerHTML='<div class="au-bg" id="au-bg"></div><div class="au-grain"></div><div id="au-slot-holder" style="position:relative;z-index:2"></div>';
function mount(){ if(!document.body) return setTimeout(mount,30); document.body.appendChild(root); document.body.appendChild(badge); }
var holder;
var badge=document.createElement('div'); badge.className='au-badge off';

function open(html){
  holder=document.getElementById('au-slot-holder');
  holder.innerHTML=html;
  root.classList.remove('off');
}
function close(){ root.classList.add('off'); setTimeout(function(){ if(holder) holder.innerHTML=''; },460); }
function bgFromHome(){
  try{
    var bg=document.getElementById('au-bg');
    var home=introVisible();
    if(root.classList.toggle) root.classList[home?'remove':'add']('plain');
    if(!home){ if(bg) bg.style.backgroundImage='none'; return; }
    var h=document.querySelector('.kfm-heroimg');
    if(h&&bg){ var b=getComputedStyle(h).backgroundImage; if(b&&b!=='none') bg.style.backgroundImage=b; }
  }catch(e){}
}
var KCORN='<div class="au-corner au-k1"></div><div class="au-corner au-k2"></div><div class="au-corner au-k3"></div><div class="au-corner au-k4"></div>';
var GLOGO='<svg viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.5 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.2-3.2-.5-4.7H24v9.1h12.6c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.5-4.1 7.1-10.2 7.1-17.5z"/><path fill="#FBBC05" d="M10.4 28.7A14.6 14.6 0 0 1 9.6 24c0-1.6.3-3.2.8-4.7l-7.8-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.8-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.8-5.8l-7.6-5.9c-2.1 1.4-4.8 2.3-8.2 2.3-6.3 0-11.7-4-13.6-9.9l-7.8 6.1C6.5 42.6 14.6 48 24 48z"/></svg>';
var TRASH='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16M9.5 7V4.6h5V7M6.4 7l1 12.4h9.2L17.6 7"/></svg>';

/* ---------------------------------------------------------------- LOGIN UI */
var mode='in';
var pendingAfter=null;
window.auTab=function(m){ mode=m; authUI(); };
function authUI(){
  var reg=(mode==='up');
  open('<div class="au-box">'+KCORN+
    '<div class="au-kick">Kick Football Manager 27</div>'+
    '<div class="au-tit">'+(reg?'Crea il tuo account':'Accedi al gioco')+'</div>'+
    '<div class="au-tx">'+(reg?'Registrati per salvare la tua carriera nel cloud del tuo browser e ritrovare i tuoi 5 slot di salvataggio su questo dispositivo.':'Accedi per recuperare i tuoi salvataggi e continuare la tua carriera da dove l\u2019avevi lasciata.')+'</div>'+
    '<div class="au-tabs"><div class="au-tab'+(reg?'':' on')+'" onclick="auTab(\'in\')">Accedi</div><div class="au-tab'+(reg?' on':'')+'" onclick="auTab(\'up\')">Registrati</div></div>'+
    (reg?'<div class="au-f"><label>Nome manager</label><input id="au-name" maxlength="22" autocomplete="off" placeholder="Es. Francesco"></div>':'')+
    '<div class="au-f"><label>Email</label><input id="au-mail" type="email" autocomplete="off" placeholder="nome@email.com"></div>'+
    '<div class="au-f"><label>Password</label><input id="au-pass" type="password" autocomplete="off" placeholder="Almeno 6 caratteri"></div>'+
    (reg?'<div class="au-f"><label>Conferma password</label><input id="au-pass2" type="password" autocomplete="off" placeholder="Ripeti la password"></div>':'')+
    '<label class="au-rem"><input type="checkbox" id="au-rem"'+(remGet()?' checked':'')+'><i></i><span>Ricordami su questo dispositivo</span></label>'+
    '<div class="au-err" id="au-err"></div>'+
    '<button class="au-btn" onclick="auSubmit()"><span>'+(reg?'Crea account e gioca':'Accedi')+'</span></button>'+
    '<div class="au-or">oppure</div>'+
    '<button class="au-g" onclick="auGoogle()">'+GLOGO+'Continua con Google</button>'+
    '<div class="au-foot">'+(reg?'Hai gi\u00e0 un account? <b onclick="auTab(\'in\')">Accedi</b>':'Non hai un account? <b onclick="auTab(\'up\')">Registrati</b>')
      +(reg?'':' \u00b7 <b onclick="auRecupera()">Password dimenticata?</b>')
      +' \u00b7 '+(cloudAuth()?'La carriera viene salvata anche nel tuo account.':'I dati restano solo su questo dispositivo.')+'</div>'+
  '</div>');
  bgFromHome();
  try{ var mi=document.getElementById('au-mail'), lm=localStorage.getItem('kfm_last_mail')||''; if(mi&&!reg&&lm&&remGet()) mi.value=lm; }catch(e){}
  var f=document.getElementById(reg?'au-name':'au-mail'); if(f) f.focus();
  ['au-name','au-mail','au-pass','au-pass2'].forEach(function(id){
    var e=document.getElementById(id);
    if(e) e.addEventListener('keydown',function(ev){ if(ev.key==='Enter'){ ev.preventDefault(); window.auSubmit(); } });
  });
}
function err(m){ var e=document.getElementById('au-err'); if(e) e.textContent=m||''; }
/* Quando il modulo cloud e' caricato, l'autenticazione la fa Firebase:
   stessa schermata, motore diverso. Senza Firebase (o senza rete) resta
   il percorso locale di prima, cosi' il gioco funziona comunque. */
function cloudAuth(){ return (window.kfmAuth && window.kfmAuth.attivo) ? window.kfmAuth : null; }
function entrato(u, registrato){
  var mail=String((u&&u.email)||'').toLowerCase();
  var nm=(u&&(u.displayName||''))||mail.split('@')[0];
  var list=accounts(), found=null;
  list.forEach(function(a){ if(a.mail===mail) found=a; });
  if(!found){ list.push({mail:mail,name:nm,pw:'',prov:'firebase',at:Date.now()}); wr(AK,list); }
  else if(nm && found.name!==nm){ found.name=nm; wr(AK,list); }
  var r=remBox(); remSet(r); REM_G=r;
  setSession(mail,r); done();
  if(registrato && typeof toast==='function'){
    toast('Ti abbiamo mandato una email per confermare l’indirizzo.');
  }
}
window.auSubmit=function(){
  var reg=(mode==='up');
  var mail=(document.getElementById('au-mail')||{}).value||'';
  var pass=(document.getElementById('au-pass')||{}).value||'';
  mail=mail.trim().toLowerCase();
  if(!mailOk(mail)) return err('Inserisci un indirizzo email valido.');
  if(pass.length<6) return err('La password deve avere almeno 6 caratteri.');
  var ca=cloudAuth();
  if(ca){
    var nome2=((document.getElementById('au-name')||{}).value||'').trim();
    if(reg){
      var pb=(document.getElementById('au-pass2')||{}).value||'';
      if(nome2.length<2) return err('Inserisci il tuo nome manager.');
      if(pass!==pb) return err('Le due password non coincidono.');
    }
    err('');
    gWait(reg?'Creazione dell’account…':'Accesso in corso…');
    return ca.submit(reg,{mail:mail,pass:pass,nome:nome2},entrato,err);
  }
  var list=accounts(), found=null;
  list.forEach(function(a){ if(a.mail===mail) found=a; });
  if(reg){
    var nm=((document.getElementById('au-name')||{}).value||'').trim();
    var p2=(document.getElementById('au-pass2')||{}).value||'';
    if(nm.length<2) return err('Inserisci il tuo nome manager.');
    if(pass!==p2) return err('Le due password non coincidono.');
    if(found) return err('Esiste gi\u00e0 un account con questa email.');
    list.push({mail:mail,name:nm,pw:hash(pass),prov:'local',at:Date.now()});
    var r1=remBox(); remSet(r1); REM_G=r1;
    wr(AK,list); setSession(mail,r1); done();
  } else {
    if(!found) return err('Nessun account trovato con questa email.');
    if(found.prov==='google') return err('Questo account usa l\u2019accesso con Google.');
    if(found.pw!==hash(pass)) return err('Password errata, riprova.');
    var r2=remBox(); remSet(r2); REM_G=r2;
    setSession(mail,r2); done();
  }
};
/* ---------------------------------------------------------------- GOOGLE  */
/* Accesso Google reale tramite Google Identity Services: apre la classica
   finestrella di Google con il selettore degli account del browser.        */
var GCID_K='kfm_gcid';
var REM_G=true;
var GCID_DEF='563326710018-3k3qbo6glfhfg0strfsib45fo4rj1o51'+'.apps.googleusercontent.com';
function gcid(){ try{ return String(window.KFM_GOOGLE_CLIENT_ID||localStorage.getItem(GCID_K)||GCID_DEF).trim(); }catch(e){ return String(window.KFM_GOOGLE_CLIENT_ID||GCID_DEF).trim(); } }
function gsiReady(){ return !!(window.google&&window.google.accounts&&window.google.accounts.oauth2); }
function loadGsi(cb){
  if(gsiReady()) return cb(true);
  if(!document.getElementById('au-gsi')){
    var sc=document.createElement('script'); sc.id='au-gsi'; sc.async=true; sc.defer=true;
    sc.src='https://accounts.google'+'.com/gsi/client';
    sc.onerror=function(){ sc.setAttribute('data-fail','1'); };
    document.head.appendChild(sc);
  }
  var t=0, iv=setInterval(function(){
    t++;
    if(gsiReady()){ clearInterval(iv); cb(true); }
    else if(t>60){ clearInterval(iv); cb(false); }
  },100);
}
function gWait(msg){ var e=document.getElementById('au-err'); if(e) e.innerHTML='<span class="au-wait"><i></i>'+esc(msg)+'</span>'; }
function gFail(msg){
  var e=document.getElementById('au-err');
  if(e) e.innerHTML=esc(msg)+' <b style="color:#fff;cursor:pointer;text-decoration:underline" onclick="auGoogleSetup()">configura</b> \u00b7 <b style="color:#fff;cursor:pointer;text-decoration:underline" onclick="auGoogleLocal()">accesso offline</b>';
}
window.auGoogle=function(){
  REM_G=remBox(); remSet(REM_G);
  var ca=cloudAuth();
  if(ca){
    err('');
    gWait('Apertura della finestra Google…');
    return ca.google(entrato,err);
  }
  var id=gcid();
  if(!id) return window.auGoogleSetup();
  gWait('Apertura della finestra Google\u2026');
  loadGsi(function(ok){
    if(!ok) return gFail('Impossibile raggiungere Google: apri il gioco da http:// o https:// con internet attivo.');
    try{
      var tc=window.google.accounts.oauth2.initTokenClient({
        client_id:id,
        scope:'openid email profile',
        ux_mode:'popup',
        callback:function(resp){
          if(!resp||!resp.access_token) return gFail('Accesso con Google annullato.');
          gWait('Recupero del profilo Google\u2026');
          fetch('https://www.googleapis'+'.com/oauth2/v3/userinfo',{headers:{Authorization:'Bearer '+resp.access_token}})
            .then(function(r){ return r.json(); })
            .then(function(u){
              if(!u||!u.email) return gFail('Google non ha restituito l\u2019email.');
              window.auGooglePick(String(u.email).toLowerCase(), u.name||u.given_name||String(u.email).split('@')[0]);
            })
            .catch(function(){ gFail('Errore nel recupero del profilo Google.'); });
        },
        error_callback:function(){ gFail('Finestra Google chiusa o bloccata dal browser.'); }
      });
      tc.requestAccessToken({prompt:'select_account'});
    }catch(e){ gFail('Google Sign-In non disponibile su questa pagina.'); }
  });
};
window.auGoogleSetup=function(){
  open('<div class="au-box">'+KCORN+
    '<div class="au-kick">Accesso con Google</div>'+
    '<div class="au-tit">Collega Google una volta sola</div>'+
    '<div class="au-note">Per aprire la vera finestra di Google serve un <b>Client ID OAuth</b> gratuito: console.cloud.google.com \u2192 <b>API e servizi</b> \u2192 <b>Credenziali</b> \u2192 <b>ID client OAuth</b> \u2192 <b>Applicazione web</b>, aggiungendo l\u2019indirizzo da cui apri il gioco nelle <b>origini JavaScript autorizzate</b>. Il gioco va aperto via <b>http:// o https://</b>: Google blocca le pagine aperte come file locale.</div>'+
    '<input class="au-code" id="au-gcid" placeholder="123456789-abc.apps.googleusercontent.com" value="'+esc(gcid())+'">'+
    '<div class="au-err" id="au-err"></div>'+
    '<button class="au-btn" onclick="auGoogleSave()"><span>Salva e accedi con Google</span></button>'+
    '<div class="au-or">oppure</div>'+
    '<button class="au-g" onclick="auGoogleLocal()">'+GLOGO+'Accesso Google offline</button>'+
    '<div class="au-foot"><b onclick="auBack()">Torna all\u2019accesso</b></div>'+
  '</div>');
  bgFromHome();
  var i=document.getElementById('au-gcid'); if(i){ i.focus(); i.addEventListener('keydown',function(e){ if(e.key==='Enter') window.auGoogleSave(); }); }
};
window.auGoogleSave=function(){
  var v=((document.getElementById('au-gcid')||{}).value||'').trim();
  if(v.indexOf('.apps.googleusercontent.com')<0) return err('Client ID non valido: deve finire con .apps.googleusercontent.com');
  try{ localStorage.setItem(GCID_K,v); }catch(e){}
  window.auGoogle();
};
window.auGoogleLocal=function(){
  var last=rd('kfm_google_last',null);
  var accHtml=last?('<div class="au-gacc" onclick="auGooglePick(\''+esc(last.mail)+'\',\''+esc(last.name)+'\')"><div class="au-gav">'+esc((last.name||'G').charAt(0).toUpperCase())+'</div><div><b>'+esc(last.name)+'</b><span>'+esc(last.mail)+'</span></div></div><div style="height:10px"></div>'):'';
  open('<div class="au-gbox">'+
    '<div class="au-glogo">'+GLOGO+'</div>'+
    '<div class="au-gt">Accedi</div>'+
    '<div class="au-gs">Continua su Kick Football Manager 27</div>'+
    accHtml+
    '<input class="au-gin" id="au-gmail" placeholder="Email o numero di telefono" autocomplete="off">'+
    '<div class="au-gerr" id="au-gerr"></div>'+
    '<div class="au-grow"><div class="au-glink" onclick="auBack()">Annulla</div><button class="au-gbtn" onclick="auGoogleNext()">Avanti</button></div>'+
  '</div>');
  var i=document.getElementById('au-gmail'); if(i){ i.focus(); i.addEventListener('keydown',function(e){ if(e.key==='Enter') window.auGoogleNext(); }); }
};
window.auBack=function(){ authUI(); };
window.auGoogleNext=function(){
  var m=((document.getElementById('au-gmail')||{}).value||'').trim().toLowerCase();
  if(!mailOk(m)){ var e=document.getElementById('au-gerr'); if(e) e.textContent='Inserisci un indirizzo email valido.'; return; }
  var nm=m.split('@')[0].replace(/[._-]+/g,' ').replace(/\b\w/g,function(c){ return c.toUpperCase(); });
  window.auGooglePick(m,nm);
};
window.auGooglePick=function(mail,name){
  var list=accounts(), found=null;
  list.forEach(function(a){ if(a.mail===mail) found=a; });
  if(!found){ list.push({mail:mail,name:name,pw:'',prov:'google',at:Date.now()}); wr(AK,list); }
  wr('kfm_google_last',{mail:mail,name:name});
  setSession(mail,REM_G!==false); done();
};
function done(){
  var a=me();
  syncBadge();
  close();
  try{ if(typeof toast==='function') toast('Bentornato, <b>'+esc(a?a.name:'manager')+'</b>'); }catch(e){}
  var f=pendingAfter; pendingAfter=null;
  if(typeof f==='function') setTimeout(function(){ try{ f(); }catch(e){} },430);
}
function syncBadge(){
  var a=me();
  if(!a||!introVisible()){ badge.className='au-badge off'; return; }
  badge.className='au-badge';
  badge.innerHTML='<div class="av">'+esc((a.name||'M').charAt(0).toUpperCase())+'</div>'+
    '<div class="nm"><span>'+(a.prov==='google'?'Google':'Account')+'</span>'+esc(a.name)+'</div>'+
    '<button onclick="auLogout()">Esci</button>';
}
window.auLogout=function(){
  var ca=cloudAuth(); if(ca) ca.logout();
  setSession(''); CUR.slot=0; syncBadge(); mode='in'; authUI();
};
/* Ripristino della sessione: onAuthStateChanged e' la sorgente, questa
   funzione allinea la sessione locale a quello che dice Firebase.
   Chi gioca senza account non viene toccato. */
window.auFirebaseStato=function(u){
  if(u){
    var mail=String(u.email||'').toLowerCase();
    if(!mail || session()===mail) return;
    var list=accounts(), found=null;
    list.forEach(function(a){ if(a.mail===mail) found=a; });
    if(!found){
      list.push({mail:mail,name:(u.displayName||mail.split('@')[0]),pw:'',prov:'firebase',at:Date.now()});
      wr(AK,list);
    }
    setSession(mail,true);
    try{ CUR.slot=(+rd(curKey(),0))||0; }catch(e){}
    syncBadge();
  } else {
    var a=me();
    if(a && a.prov==='firebase'){ setSession(''); CUR.slot=0; syncBadge(); }
  }
};
/* Recupero password: usa Firebase quando c'e', altrimenti lo dice. */
window.auRecupera=function(){
  var mail=String(((document.getElementById('au-mail')||{}).value||'')).trim().toLowerCase();
  if(!mailOk(mail)) return err('Scrivi la tua email qui sopra, poi premi di nuovo.');
  var ca=cloudAuth();
  if(!ca) return err('Il recupero password richiede la connessione a internet.');
  gWait('Invio del messaggio…');
  ca.recupera(mail,function(){
    err('');
    if(typeof toast==='function') toast('Ti abbiamo mandato una email per reimpostare la password.');
  },err);
};

/* ------------------------------------------------------------ SLOT PICKER */
var pending=null;
var slotMode='new';
function slotUI(){
  var cards='';
  for(var i=1;i<=MAX;i++){
    var s=slotGet(i);
    if(s&&s.meta){
      var m=s.meta;
      cards+='<div class="au-slot" style="--s:'+i+'" onclick="'+(slotMode==='save'?'auSlotSave(':'auSlotLoad(')+i+')">'+
        '<div class="n">Slot 0'+i+'</div>'+
        '<div class="del" onclick="auSlotDel('+i+',event)" title="Elimina salvataggio">'+TRASH+'</div>'+
        '<div class="tm">'+esc(m.team)+'</div>'+
        '<div class="meta">'+(m.league?esc(m.league)+'<br>':'')+
          'Stagione <b>'+esc(m.season||'-')+'</b> \u00b7 Sett. <b>'+esc(m.week||1)+'</b><br>'+
          'Valutazione <b>'+esc(m.strength||'-')+'</b><br>'+dt(m.at)+'</div>'+
        '<div class="cta"><i></i>'+(slotMode==='save'?'Sovrascrivi':'Continua')+'</div></div>';
    } else {
      cards+='<div class="au-slot empty" style="--s:'+i+'" onclick="'+(slotMode==='save'?'auSlotSave(':'auSlotNew(')+i+')">'+
        '<div class="n">Slot 0'+i+'</div>'+
        '<div class="tm">Slot vuoto</div>'+
        '<div class="meta">Nessun salvataggio.<br>'+(slotMode==='save'?'Salva qui la tua carriera.':'Inizia qui una nuova carriera.')+'</div>'+
        '<div class="cta"><i></i>'+(slotMode==='save'?'Salva qui':'Nuova partita')+'</div></div>';
    }
  }
  open('<div class="au-box wide">'+KCORN+
    '<div class="au-sl-top"><div>'+
      '<div class="au-kick">'+(slotMode==='save'?'Salvataggio':(slotMode==='load'?'Continua carriera':(pending&&pending.k==='zero'?'Crea una squadra da zero':'Allena una squadra')))+'</div>'+
      '<div class="au-tit">'+(slotMode==='save'?'Dove vuoi salvare?':'Scegli il salvataggio')+'</div>'+
      '<div class="au-tx">'+(slotMode==='save'?'Scegli in quale dei '+MAX+' slot salvare la partita attuale: gli slot occupati vengono sovrascritti.':'Hai '+MAX+' slot a disposizione: riprendi una carriera esistente oppure occupa uno slot libero per iniziarne una nuova.')+'</div>'+
    '</div></div>'+
    '<div class="au-grid">'+cards+'</div>'+
    '<div class="au-sl-row">'+
      (slotMode==='save'?'':'<button class="au-btn sm" onclick="auSlotNew(0)"><span>Nuova partita</span></button>')+
      '<button class="au-btn sm ghost" onclick="auSlotCancel()"><span>'+(slotMode==='save'?'Annulla':'Indietro')+'</span></button>'+
    '</div>'+
  '</div>');
  bgFromHome();
}
function hideIntro(now){
  try{
    var el=document.getElementById('kfm-intro');
    document.documentElement.classList.add('kfm-live');
    if(el){
      el.classList.add('kfm-gone');
      if(now){ el.style.display='none'; }
      else setTimeout(function(){ el.style.display='none'; },520);
    }
  }catch(e){}
}
window.auSlotCancel=function(){
  var wasNew=(slotMode==='new');
  pending=null; close();
  if(wasNew&&heroVisible()){ try{ if(typeof window.kfmHome==='function') window.kfmHome(); }catch(e){} }
};
var CF=null;
function askConfirm(kick,tit,tx,yes,cb){
  CF=cb;
  open('<div class="au-box">'+KCORN+
    '<div class="au-kick">'+esc(kick)+'</div>'+
    '<div class="au-tit">'+esc(tit)+'</div>'+
    '<div class="au-tx">'+tx+'</div>'+
    '<div class="au-sl-row" style="margin-top:22px">'+
      '<button class="au-btn sm" onclick="auCfYes()"><span>'+esc(yes)+'</span></button>'+
      '<button class="au-btn sm ghost" onclick="auCfNo()"><span>Annulla</span></button>'+
    '</div></div>');
  bgFromHome();
}
window.auCfYes=function(){ var f=CF; CF=null; if(typeof f==='function') f(); };
window.auCfNo=function(){ CF=null; slotUI(); };
window.auSlotSave=function(n){
  if(!n) return;
  if(AUTOPICK){
    AUTOPICK=false; autoSet(true,n); doSaveShow(n);
    try{ if(typeof toast==='function') toast('Salvataggio automatico attivo \u00b7 <b>slot 0'+n+'</b>'); }catch(e){}
    try{ if(typeof render==='function') render(); }catch(e){}
    return;
  }
  var ex=slotGet(n);
  if(ex&&ex.meta){
    var m=ex.meta;
    askConfirm('Slot 0'+n+' occupato','Sovrascrivere questa carriera?',
      'Nello slot 0'+n+' c\'\u00e8 <b>'+esc(m.team||'una carriera')+'</b>'+(m.season?' \u00b7 stagione '+esc(m.season):'')+(m.week?' \u00b7 settimana '+esc(m.week):'')+'.<br>Salvando ora questi dati verranno sostituiti con la partita attuale.',
      'Sovrascrivi', function(){ doSaveShow(n); });
    return;
  }
  doSaveShow(n);
};
function doSaveShow(n){
  doSave(n);
  var s=slotGet(n), m=(s&&s.meta)||{};
  open('<div class="au-box">'+KCORN+
    '<div class="au-kick">Salvataggio completato</div>'+
    '<div class="au-tit">Slot 0'+n+' aggiornato</div>'+
    '<div class="au-tx">'+esc(m.team||'Carriera')+(m.season?' \u00b7 stagione '+esc(m.season):'')+(m.week?' \u00b7 settimana '+esc(m.week):'')+'<br>'+dt(m.at||Date.now())+'</div>'+
    '<div class="au-sl-row" style="margin-top:22px">'+
      '<button class="au-btn sm" onclick="auSlotDone()"><span>Continua a giocare</span></button>'+
      '<button class="au-btn sm ghost" onclick="saveGame()"><span>Cambia slot</span></button>'+
    '</div>'+
  '</div>');
  bgFromHome();
};
window.auSlotDone=function(){ close(); };
window.auSlotDel=function(n,ev){
  if(ev){ ev.stopPropagation(); }
  slotDel(n); if(CUR.slot===n) CUR.slot=0; slotUI();
  try{ if(typeof toast==='function') toast('Slot 0'+n+' eliminato'); }catch(e){}
};
window.auSlotNew=function(n){
  if(!n){ n=firstFree(); if(!n) { slotFull(); return; } }
  var ex=slotGet(n);
  if(ex&&ex.meta){
    var m=ex.meta;
    askConfirm('Slot 0'+n+' occupato','Iniziare una nuova carriera qui?',
      'Lo slot 0'+n+' contiene <b>'+esc(m.team||'una carriera')+'</b>'+(m.season?' \u00b7 stagione '+esc(m.season):'')+'. Iniziando una nuova partita quel salvataggio verr\u00e0 eliminato.',
      'Inizia nuova', function(){ auSlotStart(n); });
    return;
  }
  auSlotStart(n);
};
function auSlotStart(n){ askAuto(n); }
function askAuto(n){
  open('<div class="au-box">'+KCORN+
    '<div class="au-kick">Slot 0'+n+'</div>'+
    '<div class="au-tit">Salvataggio automatico?</div>'+
    '<div class="au-tx">Con il salvataggio automatico la carriera viene salvata da sola nello slot 0'+n+' mentre giochi.<br>Senza, nulla viene salvato: dovrai premere <b>Salva</b> tu ogni volta.</div>'+
    '<div class="au-sl-row" style="margin-top:22px">'+
      '<button class="au-btn sm" onclick="auAutoYes('+n+')"><span>Attiva automatico</span></button>'+
      '<button class="au-btn sm ghost" onclick="auAutoNo('+n+')"><span>Salvo manualmente</span></button>'+
    '</div></div>');
  bgFromHome();
}
window.auAutoYes=function(n){ autoSet(true,n); startCareer2(n); try{ if(typeof toast==='function') toast('Salvataggio automatico attivo \u00b7 <b>slot 0'+n+'</b>'); }catch(e){} };
window.auAutoNo=function(n){ autoSet(false,n); startCareer2(n); try{ if(typeof toast==='function') toast('Salvataggio manuale: usa <b>Salva</b> per non perdere i progressi'); }catch(e){} };
function startCareer2(n){
  slotDel(n); CUR.slot=n; try{ wr(curKey(),n); }catch(e){}
  var p=pending; pending=null; close(); hideIntro();
  try{ if(p&&typeof p.go==='function') p.go(); }catch(e){}
}
function slotFull(){
  try{ if(typeof toast==='function') toast('Tutti i '+MAX+' slot sono occupati: eliminane uno per iniziare una nuova partita.'); }catch(e){}
}
window.auSlotLoad=function(n){
  var s=slotGet(n); if(!s||!s.raw) return;
  /* se questa copia fallisce si finirebbe per ricaricare in silenzio la
     carriera precedente, che e' peggio di non caricare nulla */
  try{ localStorage.setItem('mgr26save',s.raw); }
  catch(e){
    if(typeof gameMsg==='function') gameMsg({title:'Slot non caricato',msg:'Non c\'&egrave; spazio nella memoria del browser per aprire lo slot '+n+'. Elimina uno slot e riprova.',icon:'warn'});
    else if(typeof toast==='function') toast('Slot '+n+' non caricato: memoria piena');
    return;
  }
  CUR.slot=n; pending=null; close(); hideIntro(true);
  setTimeout(function(){
    try{ if(typeof _load==='function') _load.call(window); }catch(e){}
    try{ if(typeof render==='function') render(); }catch(e){}
    syncBadge();
    try{ if(typeof toast==='function') toast('Carriera caricata \u00b7 <b>slot 0'+n+'</b>'); }catch(e){}
  },120);
};
function askSlots(k,go){
  if(!me()){ pendingAfter=function(){ askSlots(k,go); }; mode='in'; authUI(); return; }
  pending={k:k,go:go}; slotUI();
}

/* --------------------------------------------------------------- HOOKS */
var _exist=window.chooseExisting, _scratch=window.chooseScratch;
window.chooseExisting=function(){ askSlots('exist',function(){ _exist(); }); };
window.chooseScratch=function(){ askSlots('zero',function(){ _scratch(); }); };

/* menu "Continua carriera" apre direttamente la lista degli slot */
window.auSlotsMenu=function(){ askSlots('load',function(){ slotFull(); }); };

window.kfmAutoToggle=function(){
  if(!me()){ pendingAfter=function(){ window.kfmAutoToggle(); }; mode='in'; authUI(); return; }
  var a=autoGet();
  if(a){
    askConfirm('Salvataggio automatico','Disattivare il salvataggio automatico?',
      'Da adesso la partita non verr\u00e0 pi\u00f9 salvata da sola: dovrai usare <b>Salva</b> ogni volta per non perdere i progressi.',
      'Disattiva', function(){
        autoSet(false,a.slot); close();
        try{ if(typeof toast==='function') toast('Salvataggio automatico disattivato'); }catch(e){}
        try{ if(typeof render==='function') render(); }catch(e){}
      });
    return;
  }
  AUTOPICK=true; pending=null; slotMode='save'; slotUI();
};

/* blocca l\'ingresso al gioco senza account */
var _kick=window.kfmOpenUT, _draft=window.chooseDraft;
if(typeof _kick==='function') window.kfmOpenUT=function(){ var self=this, ar=arguments; if(!me()){ pendingAfter=function(){ _kick.apply(self,ar); }; mode='in'; authUI(); return; } return _kick.apply(self,ar); };
if(typeof _draft==='function') window.chooseDraft=function(){ var self=this, ar=arguments; if(!me()){ pendingAfter=function(){ _draft.apply(self,ar); }; mode='in'; authUI(); return; } return _draft.apply(self,ar); };

/* ------------------------------------------------- gate sul tasto GIOCA ORA */
function introVisible(){
  var el=document.getElementById('kfm-intro');
  if(!el) return false;
  if(el.classList.contains('kfm-gone')) return false;
  return getComputedStyle(el).display!=='none';
}
function heroVisible(){
  var el=document.getElementById('kfm-intro');
  if(!el) return false;
  if(el.classList.contains('kfm-gone')||el.classList.contains('kfm-step2')) return false;
  return getComputedStyle(el).display!=='none';
}
/* true solo quando si sta davvero giocando (intro chiusa) */
function gameLive(){
  if(introVisible()) return false;
  try{ return document.documentElement.classList.contains('kfm-live'); }catch(e){ return false; }
}
/* la vecchia schermata carriera (S.screen==='title') non deve mai comparire */
function killLegacyTitle(){
  var _r=window.render;
  if(typeof _r!=='function'||_r.__au31) return;
  var w=function(){
    try{
      if(typeof S!=='undefined'&&S&&S.screen==='title'){
        var app=document.getElementById('app'); if(app) app.innerHTML='';
        if(typeof window.kfmHome==='function'){ window.kfmHome(); return; }
      }
    }catch(e){}
    return _r.apply(this,arguments);
  };
  w.__au31=true;
  window.render=w;
  try{ render=w; }catch(e){}
}
function gate(retry){
  pendingAfter=retry;
  mode='in';
  authUI();
}
function hookPlay(){
  var b=document.getElementById('kfm-playbtn');
  if(!b) return setTimeout(hookPlay,200);
  if(b.__au31) return;
  b.__au31=true;
  b.addEventListener('click',function(ev){
    if(me()) return;
    ev.preventDefault(); ev.stopImmediatePropagation();
    gate(function(){ try{ b.click(); }catch(e){} });
  },true);
  document.addEventListener('keydown',function(ev){
    if(ev.key!=='Enter'||me()) return;
    if(!heroVisible()||!root.classList.contains('off')) return;
    ev.preventDefault(); ev.stopImmediatePropagation();
    gate(function(){ try{ b.click(); }catch(e){} });
  },true);
}

function killDbBtn(){
  try{
    var b=document.querySelector('button[title="Aggiornamento database"],button[aria-label="Aggiornamento database"]');
    if(b&&b.parentNode) b.parentNode.removeChild(b);
  }catch(e){}
}

/* ------------------------------------------------------------------ start */
mount();
syncBadge();
hookPlay();
killDbBtn();
killLegacyTitle();
hookTools();
setInterval(function(){ syncBadge(); killDbBtn(); killLegacyTitle(); },700);
})();
