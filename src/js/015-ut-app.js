
(function(){
'use strict';
/* ============================================================================
   ULTIMATE TEAM — carte con i telai reali, rarita' come in FC
   ========================================================================== */
var LS='ut_save_v4';
var FR=(window.UT_FRAMES||{});

/* rarita' dall'overall, come in Ultimate Team */
var VER={
  bronze:  {nm:'BRONZO',   bonus:0, dark:false, band:[0,64]},
  silver:  {nm:'ARGENTO',  bonus:0, dark:false, band:[65,74]},
  gold:    {nm:'ORO',      bonus:0, dark:false, band:[75,99]},
  special: {nm:'SPECIAL EDITION', bonus:2, dark:false},
  special2:{nm:'ETERNAL', bonus:4, dark:false},
  worldcup:{nm:'WORLD CUP',bonus:2, dark:false},
  legends: {nm:'LEGENDS',  bonus:3, dark:true}
};
function rarityOf(rate){ return rate<=64?'bronze':(rate<=74?'silver':'gold'); }

var STAR_BONUS=[0,2,5,8,12,16,20];
var MAX_OVR=145, MAX_LVL=100;
function lvlBonus(l){ return Math.floor((Math.max(1,l)-1)/(MAX_LVL-1)*25); }
function ovrOf(c){
  var v=VER[c.ver]||VER.gold;
  return Math.min(MAX_OVR,(c.base|0)+v.bonus+lvlBonus(c.lvl)+(STAR_BONUS[c.stars]||0)+(c.red?6:0));
}
function lvlCost(l){ return 20+l*4; }
function statOf(c,k){
  var g=ovrOf(c)-c.base;
  return Math.max(1,Math.min(160,Math.round((parseInt(c[k],10)||c.base)+g*0.9)));
}

/* ------------------------------------------------------------- LEGGENDE
   Fuoriclasse ritirati o a fine carriera. Gli id sono quelli del database
   FC/sofifa: se qualcuno non avesse la foto, sulla carta restano le iniziali. */
var LEGENDS=[
  /* ---------- portieri ---------- */
  {n:'L. Yashin',        id:'238380',       r:92, p:['POR'], nat:'Russia'},
  {n:'G. Buffon',        id:'1179',   r:91, p:['POR'], nat:'Italy'},
  {n:'I. Casillas',      id:'5479',       r:90, p:['POR'], nat:'Spain'},
  {n:'O. Kahn',          id:'488',       r:91, p:['POR'], nat:'Germany'},
  {n:'P. Schmeichel',    id:'238428',       r:89, p:['POR'], nat:'Denmark'},
  {n:'E. van der Sar',   id:'51539',       r:88, p:['POR'], nat:'Netherlands'},
  {n:'P. Cech',          id:'48940',       r:88, p:['POR'], nat:'Czech Republic'},
  /* ---------- terzini ---------- */
  {n:'P. Maldini',       id:'238439',       r:92, p:['TS','DC'], nat:'Italy'},
  {n:'Roberto Carlos',   id:'238430',       r:90, p:['TS'], nat:'Brazil'},
  {n:'Cafu',             id:'5003',       r:91, p:['TD'], nat:'Brazil'},
  {n:'P. Lahm',          id:'121939',       r:89, p:['TD','TS'], nat:'Germany'},
  {n:'L. Thuram',        id:'1615',       r:88, p:['TD','DC'], nat:'France'},
  {n:'Carlos Alberto',   id:'167135',       r:91, p:['TD'], nat:'Brazil'},
  {n:'A. Cole',          id:'34079',       r:86, p:['TS'], nat:'England'},
  {n:'Marcelo',          id:'176676', r:89, p:['TS'], nat:'Brazil'},
  /* ---------- difensori centrali ---------- */
  {n:'F. Beckenbauer',   id:'168473',       r:92, p:['DC','CDC'], nat:'Germany'},
  {n:'F. Baresi',        id:'166906',       r:91, p:['DC'], nat:'Italy'},
  {n:'F. Cannavaro',     id:'1183',       r:89, p:['DC'], nat:'Italy'},
  {n:'A. Nesta',         id:'1088',       r:89, p:['DC'], nat:'Italy'},
  {n:'C. Puyol',         id:'238384',       r:89, p:['DC'], nat:'Spain'},
  {n:'G. Chiellini',     id:'138956', r:88, p:['DC'], nat:'Italy'},
  {n:'R. Koeman',        id:'167680',       r:88, p:['DC','CDC'], nat:'Netherlands'},
  {n:'N. Vidic',         id:'140601',       r:87, p:['DC'], nat:'Serbia'},
  {n:'R. Ferdinand',     id:'7289',       r:88, p:['DC'], nat:'England'},
  /* ---------- centrocampisti e mediani ---------- */
  {n:'L. Matthaus',      id:'238435',       r:90, p:['CDC','CC'], nat:'Germany'},
  {n:'Xavi',             id:'10535',       r:91, p:['CC'], nat:'Spain'},
  {n:'A. Iniesta',       id:'41',       r:92, p:['CC','COC'], nat:'Spain'},
  {n:'A. Pirlo',         id:'7763',       r:90, p:['CC','CDC'], nat:'Italy'},
  {n:'F. Rijkaard',      id:'214098',       r:87, p:['CC','CDC'], nat:'Netherlands'},
  {n:'P. Vieira',        id:'238427',       r:88, p:['CDC','CC'], nat:'France'},
  {n:'S. Gerrard',       id:'13743',       r:88, p:['CC'], nat:'England'},
  {n:'T. Kroos',         id:'182521', r:90, p:['CC','CDC'], nat:'Germany'},
  {n:'P. Scholes',       id:'246',       r:88, p:['CC'], nat:'England'},
  {n:'F. Lampard',       id:'5471',       r:87, p:['CC','COC'], nat:'England'},
  {n:'J. Zanetti',       id:'1041',       r:89, p:['TD','CC'], nat:'Argentina'},
  {n:'R. Keane',         id:'240',       r:86, p:['CDC','CC'], nat:'Ireland'},
  /* ---------- trequartisti e registi avanzati ---------- */
  {n:'J. Cruyff',        id:'190045',       r:93, p:['COC','ATT'], nat:'Netherlands'},
  {n:'Z. Zidane',        id:'1397',       r:94, p:['COC','CC'], nat:'France'},
  {n:'Ronaldinho',       id:'28130',       r:93, p:['COC','AS'], nat:'Brazil'},
  {n:'Zico',             id:'166691',       r:91, p:['COC'], nat:'Brazil'},
  {n:'R. Baggio',        id:'1114',       r:91, p:['COC','ATT'], nat:'Italy'},
  {n:'R. Gullit',        id:'214100',       r:90, p:['COC','CC'], nat:'Netherlands'},
  {n:'F. Totti',         id:'1238',       r:89, p:['COC','ATT'], nat:'Italy'},
  {n:'Kaka',             id:'138449',       r:89, p:['COC'], nat:'Brazil'},
  {n:'M. Laudrup',       id:'222000',       r:88, p:['COC'], nat:'Denmark'},
  {n:'A. Del Piero',     id:'238382',       r:90, p:['COC','ATT'], nat:'Italy'},
  {n:'G. Hagi',          id:'166124',       r:88, p:['COC','AS'], nat:'Romania'},
  /* ---------- ali ed esterni offensivi ---------- */
  {n:'Garrincha',        id:'247553',       r:92, p:['AD'], nat:'Brazil'},
  {n:'G. Best',          id:'226764',       r:90, p:['AS','ATT'], nat:'Northern Ireland'},
  {n:'L. Figo',          id:'5589',       r:89, p:['AD','COC'], nat:'Portugal'},
  {n:'D. Beckham',       id:'250',       r:88, p:['AD','CC'], nat:'England'},
  /* ---------- attaccanti e centravanti ---------- */
  {n:'Ronaldo Fenomeno', id:'37576',       r:94, p:['ATT'], nat:'Brazil'},
  {n:'F. Puskas',        id:'254642',       r:92, p:['ATT'], nat:'Hungary'},
  {n:'Eusebio',          id:'242519',       r:91, p:['ATT'], nat:'Portugal'},
  {n:'G. Muller',        id:'190048',       r:92, p:['ATT'], nat:'Germany'},
  {n:'M. van Basten',    id:'192181',       r:91, p:['ATT'], nat:'Netherlands'},
  {n:'T. Henry',         id:'1625',       r:91, p:['ATT','AS'], nat:'France'},
  {n:'Rivaldo',          id:'4231',       r:90, p:['ATT','COC'], nat:'Brazil'},
  {n:'G. Batistuta',     id:'221162',       r:89, p:['ATT'], nat:'Argentina'},
  {n:'B. Charlton',      id:'230025',       r:92, p:['ATT','COC'], nat:'England'},
  {n:'Z. Ibrahimovic',   id:'41236',  r:91, p:['ATT'], nat:'Sweden'},
  {n:'S. Etoo',          id:'9676',  r:89, p:['ATT'], nat:'Cameroon'},
  /* ---------- i due piu' grandi di sempre ---------- */
  {n:'Pele',             id:'237067',       r:95, p:['ATT','COC'], nat:'Brazil'},
  {n:'D. Maradona',      id:'190042',       r:95, p:['COC','ATT'], nat:'Argentina'},
];
/* Miniface garantita per ogni icona: se il database non ha la foto reale,
   si genera un ritratto stilizzato con le iniziali e i colori dell'oro. */
var _LEGF={};
function legFace(l){
  if(!l) return '';
  var k=(l.n||'')+'|'+(l.id||'');
  if(_LEGF[k]) return _LEGF[k];
  var u='';
  if(l.id && typeof getFace==='function'){ try{ u=getFace(l.id,l.n); }catch(e){ u=''; } }
  if(!u) u=legAvatar(l.n);
  _LEGF[k]=u;
  return u;
}
function legAvatar(name){
  var n=String(name||'?').replace(/[^A-Za-z .'-]/g,'').trim()||'Legend';
  return 'https://ui-avatars.com/api/?name='+encodeURIComponent(n)+
    '&background=1b1305&color=f2c75c&bold=true&size=128&font-size=0.4';
}
function legFallback(name){ return legAvatar(name); }

/* ------------------------------------------- protagonisti dei Mondiali
   Nome (anche parziale) -> spinta di overall. Chi ha inciso davvero
   nella competizione vale di piu'. Le carte si costruiscono sui giocatori
   veri del database, cosi' foto e statistiche restano reali. */
var WC_STARS={
  /* Mondiale 2026 (Spagna campione). Il bonus segue quanto hanno inciso:
     +5 premiati e Top XI, +4 grandi protagonisti, +3 comprimari di peso,
     +2 rivelazioni. Chi non c'era (Italia compresa) qui non compare. */
  'Rodri':5,              /* Pallone d'Oro del torneo */
  'Mbappe':5,             /* Scarpa d'Oro: 10 gol, 4 assist */
  'Messi':5,              /* Pallone d'Argento: 8 gol, 4 assist */
  'Bellingham':5,         /* 7 gol */
  'Haaland':5,            /* 7 gol */
  'Unai Simon':5,         /* Guanto d'Oro: 7 clean sheet */
  'Cubarsi':5,            /* miglior giovane */
  'Olise':5,              /* re degli assist: 7 */
  'Yamal':4,
  'Vozinha':4,            /* Top XI FIFA */
  /* difensori */
  'Lisandro Martinez':4,'Upamecano':4,'Cucurella':4,'Pedro Porro':4,
  'Saliba':4,'Gvardiol':4,
  /* centrocampo e trequarti */
  'Dembele':4,'Brahim':4,'Odegaard':4,'Bruno Guimaraes':4,
  'Valverde':3,'Wirtz':3,
  /* attacco e rivelazioni */
  'Kane':4,'Oyarzabal':4,'Quinones':3,'Ismaila Sarr':3,'Vinicius':3,
  'Manzambi':2,'Kobel':3,'Jonathan David':3
};
/* Bacino del pacchetto Mondiale: SOLO questi nomi. */



/* ------------------------------------------------------------ pacchetti */
var PACKS=[
  {k:'bronzo',  nm:'Bronzo',   sub:'MAX 64',  art:'bronze',  cost:400,  n:3,
   rar:'bronze', min:45, max:64,
   d:'Tre carte bronzo. Rincalzi e giovani, per allargare la rosa spendendo poco.'},
  {k:'argento', nm:'Argento',  sub:'65-74',   art:'silver',  cost:1200, n:4,
   rar:'silver', min:65, max:74,
   d:'Quattro carte argento: la base solida di una squadra da meta\' classifica.'},
  {k:'oro',     nm:'Oro',      sub:'75+',     art:'gold',    cost:3000, n:5,
   rar:'gold', min:75, max:99,
   d:'Cinque carte oro. Da qui in su si costruisce una squadra da vertice.'},
  {k:'oro81',   nm:'Oro Raro', sub:'81+',     art:'gold',    cost:7500, n:4,
   rar:'gold', min:81, max:99,
   d:'Quattro carte oro con overall minimo 81: nessun riempitivo.'},
  {k:'special', nm:'Special Edition', sub:'84+', art:'special', cost:16000, n:3,
   rar:'special', min:84, max:99, only:'special',
   d:'Tre carte Special Edition (+2 overall) tutte da 84 in su.'},
  {k:'worldcup',nm:'World Cup 2026',sub:'TOP 28',art:'worldcup',cost:22000, n:3,
   rar:'worldcup', only:'worldcup',
   d:'Tre carte World Cup (+7 overall). Bacino chiuso: SOLO i 28 protagonisti '+
     'del Mondiale 2026, con overall maggiorato in base al peso nel torneo.'},
  {k:'legends', nm:'Legends',  sub:'ICONE',   art:'legends', cost:38000, n:2,
   rar:'legends', only:'legends',
   d:'Due carte Legends (+3 overall). Solo icone: nessun giocatore comune.'},

  {k:'bronzoplus', nm:'Bronzo Plus', sub:'60-64', art:'bronze', cost:900, n:4,
   rar:'bronze', min:60, max:64,
   d:'Quattro carte bronzo di fascia alta: il meglio possibile a costo minimo.'},
  {k:'argento72', nm:'Argento Raro', sub:'71-74', art:'silver', cost:2600, n:3,
   rar:'silver', min:71, max:74,
   d:'Tre carte argento da 71 in su: pronte per l\'undici titolare.'},
  {k:'talenti', nm:'Giovani Talenti', sub:'U21', art:'silver', cost:3400, n:3,
   rar:'silver', min:68, max:99, maxAge:21,
   d:'Tre carte di soli under 21. Investimento sul futuro: salgono di livello meglio.'},
  {k:'oro78', nm:'Oro Misto', sub:'78+', art:'gold', cost:4800, n:5,
   rar:'gold', min:78, max:99,
   d:'Cinque carte oro con overall minimo 78: nessuna carta sotto la media.'},
  {k:'muro', nm:'Il Muro', sub:'DIFESA', art:'gold', cost:6200, n:3,
   rar:'gold', min:78, max:99, line:'DEF',
   d:'Tre carte oro di soli portieri e difensori, da 78 in su.'},
  {k:'regia', nm:'Sala Regia', sub:'CENTRO', art:'gold', cost:6800, n:3,
   rar:'gold', min:78, max:99, line:'MID',
   d:'Tre carte oro di soli centrocampisti, da 78 in su: il cuore della squadra.'},
  {k:'bomber', nm:'Bomber', sub:'ATTACCO', art:'gold', cost:7800, n:3,
   rar:'gold', min:79, max:99, line:'ATK',
   d:'Tre carte oro di soli attaccanti ed esterni offensivi, da 79 in su.'},
  {k:'elite', nm:'Elite 85', sub:'85+', art:'gold', cost:19000, n:2,
   rar:'gold', min:85, max:99,
   d:'Due carte oro con overall minimo 85: soltanto top mondiali.'},
  {k:'special88', nm:'Special Prime', sub:'88+', art:'special', cost:34000, n:2,
   rar:'special', min:88, max:99, only:'special',
   d:'Due carte Special Edition (+2 overall) da 88 in su: fuoriclasse assoluti.'},
  {k:'special2', nm:'Eternal', sub:'COLLEZIONE', art:'special2', cost:30000, n:3,
   rar:'special2', only:'special2',
   d:'Tre carte Eternal (+4 overall) con il telaio dedicato. Bacino '+
     'chiuso: soltanto i 21 fuoriclasse della nuova collezione.'},
  {k:'special2one', nm:'Eternal Singola', sub:'1 CARTA', art:'special2', cost:12500, n:1,
   rar:'special2', only:'special2',
   d:'Una carta Eternal garantita (+4 overall): estrazione secca '+
     'dalla nuova collezione.'},
  {k:'special2max', nm:'Eternal Prime', sub:'87+', art:'special2', cost:58000, n:2,
   rar:'special2', min:87, only:'special2',
   d:'Due carte Eternal da 87 in su: il vertice della collezione.'},
  {k:'worldcup1', nm:'World Cup Singola', sub:'1 SU 28', art:'worldcup', cost:9500, n:1,
   rar:'worldcup', only:'worldcup',
   d:'Una sola carta World Cup (+7 overall) a prezzo ridotto: la scommessa secca.'},
  {k:'legends1', nm:'Legends Singola', sub:'1 ICONA', art:'legends', cost:21000, n:1,
   rar:'legends', only:'legends',
   d:'Una carta Legends garantita (+3 overall), meta\' prezzo, una sola estrazione.'},
  {k:'legendsmax', nm:'Legends Ultimate', sub:'TRIS', art:'legends', cost:96000, n:3,
   rar:'legends', only:'legends',
   d:'Tre carte Legends (+3 overall). Il pacchetto piu\' costoso e piu\' ricco del gioco.'}
];
var PACK_ORDER=['bronzo','bronzoplus','argento','argento72','talenti','oro','oro78','oro81',
  'muro','regia','bomber','elite','special','special88','special2one','special2','special2max','worldcup1','worldcup',
  'legends1','legends','legendsmax'];
function packsSorted(){
  var by={}; PACKS.forEach(function(p){ by[p.k]=p; });
  var out=[]; PACK_ORDER.forEach(function(k){ if(by[k]){ out.push(by[k]); delete by[k]; } });
  PACKS.forEach(function(p){ if(by[p.k]) out.push(p); });
  return out;
}

/* ------------------------------------------------------------------ moduli */
var FORMS={
  '4-3-3':[['GK',50,88],['LB',10,70],['CB',34,75],['CB',66,75],['RB',90,70],
           ['CM',26,50],['CM',50,57],['CM',74,50],['LW',15,22],['ST',50,11],['RW',85,22]],
  '4-2-4':[['GK',50,88],['LB',10,68],['CB',34,74],['CB',66,74],['RB',90,68],
           ['CM',33,47],['CM',67,47],['LW',12,20],['ST',37,10],['ST',63,10],['RW',88,20]],
  '4-4-2':[['GK',50,88],['LB',10,70],['CB',34,75],['CB',66,75],['RB',90,70],
           ['LM',12,46],['CM',37,52],['CM',63,52],['RM',88,46],['ST',37,14],['ST',63,14]],
  '4-2-3-1':[['GK',50,88],['LB',10,70],['CB',34,75],['CB',66,75],['RB',90,70],
           ['CM',35,56],['CM',65,56],['LW',14,30],['CM',50,29],['RW',86,30],['ST',50,11]],
  '3-5-2':[['GK',50,88],['CB',25,75],['CB',50,78],['CB',75,75],
           ['LM',8,48],['CM',32,54],['CM',50,42],['CM',68,54],['RM',92,48],['ST',37,13],['ST',63,13]],
  '5-3-2':[['GK',50,88],['LB',7,60],['CB',26,77],['CB',50,79],['CB',74,77],['RB',93,60],
           ['CM',30,48],['CM',50,42],['CM',70,48],['ST',37,13],['ST',63,13]],
  '4-1-4-1':[['GK',50,88],['LB',10,70],['CB',34,75],['CB',66,75],['RB',90,70],['CM',50,59],
           ['LM',12,38],['CM',36,43],['CM',64,43],['RM',88,38],['ST',50,11]]
};
var ROLE_LINE={GK:'DEF',LB:'DEF',CB:'DEF',RB:'DEF',CM:'MID',LM:'MID',RM:'MID',LW:'ATK',RW:'ATK',ST:'ATK'};
var ROLE_MAP={POR:['GK'],TS:['LB'],DC:['CB'],TD:['RB'],CDC:['CM'],CC:['CM','LM','RM'],
  COC:['CM'],AS:['LW','LM'],AD:['RW','RM'],ATT:['ST'],
  GK:['GK'],LB:['LB'],CB:['CB'],RB:['RB'],CM:['CM'],LM:['LM'],RM:['RM'],LW:['LW'],RW:['RW'],ST:['ST']};

var S=null, POOL=null;
var MKT_DEF={q:'',ver:'',line:'',min:40,max:99,sort:'ovr',afford:false,lim:40};
var ui={tab:'home', sel:null, view:null, sub:'squadra', lastTap:0, lastId:null, pending:null, mcard:null,
  drag:null, mkt:{q:'',ver:'',line:'',min:40,max:99,sort:'ovr',afford:false,lim:40}};

function blank(){
  return { coins:3500, exp:400, tokens:0, club:'', user:'', crest:'', crests:{}, crestOffer:null, cards:{}, seq:1,
    dev:false, journey:{sc:1,prog:{},best:{}}, tname:'', crestClub:'', daily:null,
    xi:new Array(11).fill(null), bench:new Array(7).fill(null),
    form:'4-3-3', league:null, leagueName:null, played:0, seen:false, log:[] };
}
function save(){ try{ localStorage.setItem(LS,JSON.stringify(S)); }catch(e){} }
function load(){
  try{ var r=localStorage.getItem(LS); if(r) S=JSON.parse(r); }catch(e){}
  if(!S||!S.cards) S=blank();
  if(!S.xi) S.xi=new Array(11).fill(null);
  if(!S.bench) S.bench=new Array(7).fill(null);
  if(!S.log) S.log=[];
  if(typeof S.tokens!=='number') S.tokens=0;
  return S;
}

/* --------------------------------------------------- giocatori dal database */
function buildPool(){
  if(POOL) return POOL;
  POOL=[]; var seen={};
  function add(line){
    try{
      var p=(typeof parseEA==='function')?parseEA(line):null;
      if(!p||!p.name||!p.rate) return;
      var key=p.name+'|'+p.pid; if(seen[key]) return; seen[key]=1;
      POOL.push({pid:p.pid,name:p.name,roles:p.roles,rate:p.rate,img:p.img,
        pac:+p.pac||p.rate,sho:+p.sho||p.rate,pas:+p.pas||p.rate,
        dri:+p.dri||p.rate,def:+p.def||p.rate,phy:+p.phy||p.rate,
        age:p.age,nation:p.nation});
    }catch(e){}
  }
  try{
    if(typeof EADB!=='undefined')
      for(var cn in EADB){ var c=EADB[cn]; if(c&&c.r) for(var i=0;i<c.r.length;i++) add(c.r[i]); }
  }catch(e){}
  POOL.sort(function(a,b){ return b.rate-a.rate; });
  return POOL;
}
var LINE_IT={POR:'DEF',GK:'DEF',DC:'DEF',CB:'DEF',TD:'DEF',RB:'DEF',TS:'DEF',LB:'DEF',
  CDC:'MID',CDM:'MID',CC:'MID',CM:'MID',COC:'MID',CAM:'MID',
  AD:'ATK',RW:'ATK',AS:'ATK',LW:'ATK',ATT:'ATK',ST:'ATK',SS:'ATK'};
function lineOfPlayer(p){
  var r=(p&&p.roles&&p.roles.length)?String(p.roles[0]).toUpperCase():'';
  return LINE_IT[r]||'';
}
function poolBand(min,max){
  var P=buildPool(), out=[];
  for(var i=0;i<P.length;i++) if(P[i].rate>=min&&P[i].rate<=max) out.push(P[i]);
  return out;
}
/* --- ETERNAL: bacino chiuso, carte disegnate a mano --- */
function se2Pool(){
  var A=window.SE2_POOL||[], out=[], i;
  for(i=0;i<A.length;i++){ var q=A[i];
    out.push({name:q.n,rate:q.r,roles:q.p,pid:'',img:q.f,
      pac:q.pac,sho:q.sho,pas:q.pas,dri:q.dri,def:q.def,phy:q.phy,
      age:q.age,nation:q.nat}); }
  return out;
}
function wcPool(){
  var P=buildPool(), out=[], seen={};
  for(var i=0;i<P.length;i++){
    var b=wcBoost(P[i].name);
    if(!b) continue;
    if(P[i].rate<76) continue;                 /* niente comprimari */
    var k=P[i].name;
    if(seen[k]) continue; seen[k]=1;
    out.push({p:P[i],boost:b});
  }
  out.sort(function(a,b){ return (b.p.rate+b.boost)-(a.p.rate+a.boost); });
  return out.slice(0,30);                      /* i 30 protagonisti del torneo */
}
function wcBoost(name){
  for(var k in WC_STARS) if(name.indexOf(k)>=0) return WC_STARS[k];
  return 0;
}
/* piu' e' forte, meno e' probabile */
function tableFor(pk){
  var arr=[], tot=0, i;
  if(pk.only==='special2'){
    var s2p=se2Pool();
    for(i=0;i<s2p.length;i++){
      if(pk.min&&s2p[i].rate<pk.min) continue;
      var ws=Math.pow(1.2,95-s2p[i].rate);
      arr.push({p:s2p[i],w:ws}); tot+=ws;
    }
  } else if(pk.only==='legends'){
    for(i=0;i<LEGENDS.length;i++){
      var w=Math.pow(1.22,95-LEGENDS[i].r);
      arr.push({p:{name:LEGENDS[i].n,rate:LEGENDS[i].r,roles:LEGENDS[i].p,
        img:legFace(LEGENDS[i]),
        pid:LEGENDS[i].id,pac:LEGENDS[i].r,sho:LEGENDS[i].r,pas:LEGENDS[i].r,
        dri:LEGENDS[i].r,def:LEGENDS[i].r-10,phy:LEGENDS[i].r-5,age:38,nation:(LEGENDS[i].nat||'')},w:w});
      tot+=w;
    }
  } else if(pk.only==='worldcup'){
    var wp=wcPool();
    for(i=0;i<wp.length;i++){
      var eff=wp[i].p.rate+wp[i].boost;   /* bonus torneo contenuto: max +5 */
      var w2=Math.pow(1.24,99-eff);
      var q={}; for(var kk in wp[i].p) q[kk]=wp[i].p[kk];
      q.rate=Math.min(94,eff);
      arr.push({p:q,w:w2}); tot+=w2;
    }
  } else {
    var band=poolBand(pk.min,pk.max);
    if(pk.line||pk.maxAge) band=band.filter(function(pp){
      if(pk.maxAge&&!(pp.age&&pp.age<=pk.maxAge)) return false;
      if(pk.line&&lineOfPlayer(pp)!==pk.line) return false;
      return true; });
    for(i=0;i<band.length;i++){
      var w3=Math.pow(1.26,pk.max-band[i].rate);
      arr.push({p:band[i],w:w3}); tot+=w3;
    }
  }
  for(i=0;i<arr.length;i++) arr[i].pc=tot?arr[i].w/tot:0;
  arr.sort(function(a,b){ return b.p.rate-a.p.rate; });
  return {arr:arr,tot:tot};
}
function drawFrom(pk){
  var t=tableFor(pk);
  if(!t.arr.length) return null;
  var r=Math.random()*t.tot;
  for(var i=0;i<t.arr.length;i++){ r-=t.arr[i].w; if(r<=0) return t.arr[i].p; }
  return t.arr[t.arr.length-1].p;
}
function newCard(pl,ver){
  var id='c'+(S.seq++);
  S.cards[id]={id:id,pid:pl.pid,name:pl.name,roles:pl.roles,base:pl.rate,img:pl.img,
    pac:pl.pac,sho:pl.sho,pas:pl.pas,dri:pl.dri,def:pl.def,phy:pl.phy,
    age:pl.age,nation:pl.nation,ver:ver||rarityOf(pl.rate),lvl:1,stars:0};
  return S.cards[id];
}
function openPack(pk){
  var out=[];
  for(var i=0;i<pk.n;i++){
    var pl=drawFrom(pk);
    if(!pl) continue;
    out.push(newCard(pl, pk.only||rarityOf(pl.rate)));
  }
  return out;
}

/* ---------------------------------------------------------------- rosa/XI */
function slots(){ return FORMS[S.form]||FORMS['4-3-3']; }
function cardAt(i){ return S.xi[i]?S.cards[S.xi[i]]:null; }
function benchAt(i){ return S.bench[i]?S.cards[S.bench[i]]:null; }
/* quanto e' adatto un giocatore a uno slot: 0 = ruolo naturale.
   Fuori ruolo l'overall cala, e portiere/movimento non si mescolano mai. */
function posPenalty(c,role){
  if(!c) return 99;
  var isGK=(c.roles.indexOf('POR')>=0), slotGK=(role==='GK');
  if(isGK!==slotGK) return 99;                       /* incompatibile: mai */
  if(slotGK) return 0;
  var best=99;
  for(var i=0;i<c.roles.length;i++){
    var m=ROLE_MAP[c.roles[i]]||[];
    if(m.indexOf(role)>=0){ best=Math.min(best,i===0?0:2); continue; }   /* ruolo suo */
    if(ROLE_LINE[m[0]]===ROLE_LINE[role]) best=Math.min(best,6);         /* stesso reparto */
    else best=Math.min(best,14);                                          /* reparto sbagliato */
  }
  return best===99?14:best;
}
/* overall effettivo nello slot in cui e' schierato */
function ovrIn(c,role){
  var pen=posPenalty(c,role);
  if(pen>=99) return Math.max(1,ovrOf(c)-30);
  return Math.max(1,ovrOf(c)-pen);
}
function fitScore(c,role){
  if(!c) return -1;
  var pen=posPenalty(c,role);
  if(pen>=99) return -1;                              /* mai in quello slot */
  return ovrOf(c)-pen*3;                              /* fuori ruolo pesa parecchio */
}
/* lo stesso giocatore non puo' comparire due volte: si guarda il pid, non la carta */
function keyOf(c){ return c?(c.pid?('p'+c.pid):('n'+c.name)):''; }
function inSquad(key,skipT,skipI){
  var i;
  for(i=0;i<S.xi.length;i++){ if(skipT==='xi'&&i===skipI) continue;
    if(S.xi[i]&&keyOf(S.cards[S.xi[i]])===key) return {t:'xi',i:i}; }
  for(i=0;i<S.bench.length;i++){ if(skipT==='bench'&&i===skipI) continue;
    if(S.bench[i]&&keyOf(S.cards[S.bench[i]])===key) return {t:'bench',i:i}; }
  return null;
}
function autoFill(){
  var all=[]; for(var k in S.cards) all.push(S.cards[k]);
  if(!all.length) return;
  var used={}, dup={}, sl=slots(), i, j, c, s2;
  S.xi=new Array(11).fill(null);
  /* ordine: prima il portiere, poi difesa, centrocampo, attacco: i reparti
     con meno alternative vanno serviti per primi, altrimenti un attaccante
     forte finisce in porta */
  var order=[];
  for(i=0;i<sl.length;i++) order.push(i);
  var pri={GK:0,CB:1,LB:2,RB:2,CM:3,LM:4,RM:4,LW:5,RW:5,ST:6};
  order.sort(function(a,b){ return (pri[sl[a][0]]||9)-(pri[sl[b][0]]||9); });
  /* prima passata: solo chi puo' davvero giocare in quello slot */
  order.forEach(function(si){
    var role=sl[si][0], best=null, bs=-1;
    for(j=0;j<all.length;j++){
      c=all[j];
      if(used[c.id]||dup[keyOf(c)]) continue;
      if(posPenalty(c,role)>=99) continue;          /* portiere fuori ruolo: escluso */
      s2=fitScore(c,role); if(s2>bs){ bs=s2; best=c; }
    }
    if(best){ S.xi[si]=best.id; used[best.id]=1; dup[keyOf(best)]=1; }
  });
  /* seconda passata: slot rimasti vuoti, si accetta chiunque tranne i portieri */
  order.forEach(function(si){
    if(S.xi[si]) return;
    var role=sl[si][0], best=null, bs=-1;
    for(j=0;j<all.length;j++){
      c=all[j];
      if(used[c.id]||dup[keyOf(c)]) continue;
      if(role!=='GK'&&c.roles.indexOf('POR')>=0) continue;
      s2=ovrOf(c); if(s2>bs){ bs=s2; best=c; }
    }
    if(best){ S.xi[si]=best.id; used[best.id]=1; dup[keyOf(best)]=1; }
  });
  var rest=all.filter(function(c){ return !used[c.id]; })
              .sort(function(a,b){ return ovrOf(b)-ovrOf(a); });
  S.bench=new Array(7).fill(null);
  var bi=0;
  for(i=0;i<rest.length&&bi<7;i++){
    var kk=keyOf(rest[i]);
    if(dup[kk]) continue;
    S.bench[bi++]=rest[i].id; dup[kk]=1;
  }
}
function ratings(){
  var sum=0,n=0,L={ATK:[0,0],MID:[0,0],DEF:[0,0]};
  for(var i=0;i<11;i++){
    var c=cardAt(i); if(!c) continue;
    var role=slots()[i][0];
    var o=ovrIn(c,role), ln=ROLE_LINE[role]||'MID';
    sum+=o; n++; L[ln][0]+=o; L[ln][1]++;
  }
  function avg(a){ return a[1]?Math.round(a[0]/a[1]):0; }
  return {ovr:n?Math.round(sum/n):0,total:sum,atk:avg(L.ATK),mid:avg(L.MID),def:avg(L.DEF),n:n};
}

/* ------------------------------------------------------------- campionato */
function leagueNames(){
  var out=[]; try{ if(typeof LEAGUES!=='undefined') for(var k in LEAGUES) out.push(k); }catch(e){}
  return out;
}
function newLeague(name){
  var clubs=[];
  try{
    if(name&&typeof LEAGUES!=='undefined'&&LEAGUES[name]){
      clubs=LEAGUES[name].map(function(n){          /* tutte, non solo 11 */
        var st=78; try{ if(typeof EADB!=='undefined'&&EADB[n]) st=EADB[n].str; }catch(e){}
        return {n:n,str:st,logo:clubLogo(n)};
      });
    }
  }catch(e){}
  if(!clubs.length){
    ['Atletico Nord','Real Ponente','Sporting Aurora','Union Delta','FC Meridiana',
     'Athletic Sirio','Olympic Vega','Real Zenith','Inter Polaris','FC Aurora','Sporting Nadir']
      .forEach(function(n){ clubs.push({n:n,str:70+Math.floor(Math.random()*14),logo:''}); });
  }
  var tab=[{n:S.club,str:0,me:1,logo:'',p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0}];
  clubs.forEach(function(t){ tab.push({n:t.n,str:t.str,logo:t.logo,p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0}); });
  var order=[],k;
  for(k=1;k<tab.length;k++) order.push({opp:tab[k].n,home:true});
  for(k=1;k<tab.length;k++) order.push({opp:tab[k].n,home:false});
  for(k=order.length-1;k>0;k--){ var j=Math.floor(Math.random()*(k+1)); var t2=order[k]; order[k]=order[j]; order[j]=t2; }
  S.leagueName=name||null;
  S.league={tab:tab,fix:order,round:0,season:(S.league?S.league.season+1:1)};
}
function nextFix(){ return (S.league&&S.league.fix[S.league.round])||null; }
function tabRow(n){ for(var i=0;i<S.league.tab.length;i++) if(S.league.tab[i].n===n) return S.league.tab[i]; return null; }
function cmpTab(a,b){ return b.pts-a.pts||(b.gf-b.ga)-(a.gf-a.ga)||b.gf-a.gf; }
function sortedTab(){ return S.league.tab.slice().sort(cmpTab); }
function myPos(){ var t=sortedTab(); for(var i=0;i<t.length;i++) if(t[i].me) return i+1; return 0; }
function applyResult(gf,ga){
  var f=nextFix(); if(!f) return;
  var me=tabRow(S.club), op=tabRow(f.opp);
  [me,op].forEach(function(r){ if(r) r.p++; });
  if(me){ me.gf+=gf; me.ga+=ga; }
  if(op){ op.gf+=ga; op.ga+=gf; }
  if(gf>ga){ if(me){me.w++;me.pts+=3;} if(op)op.l++; }
  else if(gf<ga){ if(op){op.w++;op.pts+=3;} if(me)me.l++; }
  else { if(me){me.d++;me.pts++;} if(op){op.d++;op.pts++;} }
  S.log.unshift({r:S.league.round+1,opp:f.opp,gf:gf,ga:ga,home:f.home});
  if(S.log.length>12) S.log.pop();
  var others=S.league.tab.filter(function(r){ return !r.me&&r.n!==f.opp; });
  for(var i=0;i+1<others.length;i+=2){
    var a=others[i],b=others[i+1];
    var g1=Math.max(0,Math.round((a.str-b.str)/8+Math.random()*3));
    var g2=Math.max(0,Math.round((b.str-a.str)/8+Math.random()*3));
    a.p++;b.p++;a.gf+=g1;a.ga+=g2;b.gf+=g2;b.ga+=g1;
    if(g1>g2){a.w++;a.pts+=3;b.l++;} else if(g2>g1){b.w++;b.pts+=3;a.l++;} else {a.d++;b.d++;a.pts++;b.pts++;}
  }
  S.league.round++; S.played++;
  if(S.league.round>=S.league.fix.length){
    var ch=sortedTab()[0];
    S.coins+=(ch&&ch.me)?9000:2200;
    toast(ch&&ch.me?'Campionato vinto! +9.000':'Campionato concluso. +2.200');
    newLeague(S.leagueName);
  }
}

/* ------------------------------------------------------------------ utili */
function esc2(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(m){
  return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]; }); }
function sur2(n){ var p=String(n||'').trim().split(/\s+/);
  while(p.length>1&&/^(jr|jr\.|junior|sr|sr\.|ii|iii)$/i.test(p[p.length-1])) p.pop();
  return p.length>1?p.slice(1).join(' '):p[0]||''; }
function ini2(n){ var p=String(n||'?').trim().split(/\s+/);
  return ((p[0][0]||'')+(p.length>1?(p[p.length-1][0]||''):'')).toUpperCase(); }
function fmt(n){ return String(n|0).replace(/\B(?=(\d{3})+(?!\d))/g,'.'); }
function toast(m){
  var host=document.getElementById('ut-toasts');
  if(!host){ host=document.createElement('div'); host.id='ut-toasts'; document.body.appendChild(host); }
  while(host.children.length>2) host.removeChild(host.firstChild);   /* niente pile infinite */
  var t=document.createElement('div'); t.className='ut-toast'; t.innerHTML=m;
  host.appendChild(t);
  setTimeout(function(){ t.style.transition='opacity .3s'; t.style.opacity='0';
    setTimeout(function(){ t.remove(); },320); },1900);
}
function clubLogo(n){
  try{ if(typeof clubCrest==='function'){ var c=clubCrest(n); if(c) return c; } }catch(e){}
  try{ if(typeof EADB!=='undefined'&&EADB[n]&&typeof getLogo==='function') return getLogo(EADB[n].tid, n); }catch(e){}
  return '';
}

/* -------------------------------------------------------------- la CARTA */
function cardHTML(c,opt){
  opt=opt||{};
  if(!c) return '<div class="utc empty"><span>+</span></div>';
  var v=VER[c.ver]||VER.gold, o=ovrOf(c), st='';
  for(var i=0;i<6;i++) st+='<i class="'+(i<c.stars?'f':'')+'"></i>';
  var _s=window.UT_STAR||'';
  var stats='';
  if(opt.big){
    var kk=['pac','sho','pas','dri','def','phy'], lb=['VEL','TIR','PAS','DRI','DIF','FIS'];
    stats='<div class="uc-stats">'+kk.map(function(k,i2){
      return '<b>'+statOf(c,k)+'<span>'+lb[i2]+'</span></b>'; }).join('')+'</div>';
  }
  var natRaw=String(c.nation||'').trim();
  try{ if(typeof normalizeNation==='function') natRaw=normalizeNation(natRaw)||natRaw; }catch(e){}
  var natUrl='';
  try{ if(natRaw&&typeof natFlag==='function') natUrl=natFlag(natRaw)||''; }catch(e){}
  var natHTML = natUrl
    ? '<img src="'+esc2(natUrl)+'" alt="'+esc2(natRaw)+'" loading="lazy" referrerpolicy="no-referrer"'+
      ' onerror="this.onerror=null;this.outerHTML=\'<b>'+esc2(natRaw.slice(0,3).toUpperCase())+'</b>\'">'
    : '<b>'+esc2((natRaw||'INT').slice(0,3).toUpperCase())+'</b>';
  return '<div class="utc v-'+c.ver+(c.red?' max6':'')+(opt.big?' big':'')+(opt.cls?' '+opt.cls:'')+'"'+
    ' data-card="'+c.id+'" style="background-image:url('+(FR[c.ver]||'')+');--star:url('+(window.UT_STAR||'')+')">'+
    '<div class="uc-ovr">'+o+'</div>'+
    '<div class="uc-pos">'+esc2(c.roles[0]||'')+'</div>'+
    '<div class="uc-nat" title="'+esc2(natRaw)+'">'+natHTML+'</div>'+
    '<div class="uc-ph"><span>'+esc2(ini2(c.name))+'</span>'+
      (c.img?'<img src="'+esc2(c.img)+'" alt="" data-nm="'+esc2(c.name)+'" referrerpolicy="no-referrer"'+
      ' onerror="kfmFaceErr(this)">':'')+'</div>'+
    '<div class="uc-st">'+st+'</div>'+
    '<div class="uc-nm">'+esc2(sur2(c.name))+'</div>'+
    '<div class="uc-lv">LV '+c.lvl+'</div>'+
    stats+
  '</div>';
}

/* ------------------------------------------------------------------ shell */
function root(){
  var r=document.getElementById('ut-root');
  if(r) return r;
  r=document.createElement('div'); r.id='ut-root';
  r.innerHTML='<button class="ut-fab" id="ut-exit" title="Indietro">\u2039</button>'+
    '<div class="ut-hud" id="ut-hud"></div>'+
    '<div class="ut-scroll" id="ut-body"></div>';
  document.body.appendChild(r);
  var mk=document.createElement('div'); mk.id='ut-mask'; document.body.appendChild(mk);
  var mn=document.createElement('div'); mn.id='ut-menu'; document.body.appendChild(mn);
  mk.addEventListener('click',hideMenu);
  mn.addEventListener('click',function(e){
    var b=cl(e.target,'[data-m]'); if(!b||!ui.menuFor) return;
    var k=b.getAttribute('data-m'), ref=ui.menuFor;
    hideMenu(); ui.view=ref.card;
    if(k==='move'){ if(ref.where!=='coll'){ ui.sel={t:ref.where,i:ref.idx}; render();
      toast('Selezionato: tocca un altro per scambiare.'); } return; }
    cardAction(k);
  });
  var md=document.createElement('div'); md.id='ut-modal'; document.body.appendChild(md);
  var op=document.createElement('div'); op.id='ut-open'; document.body.appendChild(op);
  document.getElementById('ut-exit').addEventListener('click',utBack);
  md.addEventListener('click',function(e){ if(e.target===md) md.classList.remove('on'); });
  return r;
}
var TABS=[['home','Home'],['squadra','Squadra'],['journey','Journey'],['negozio','Negozio'],
          ['scambio','Scambio'],['mercato','Mercato'],['campionato','Campionato'],
          ['collezione','Collezione'],['personalizza','Personalizza'],['club','Club']];
function render(){
  root();
  var _cn=document.getElementById('ut-coins'); if(_cn) _cn.textContent=fmt(S.coins);
  var _ex=document.getElementById('ut-exp'); if(_ex) _ex.textContent=fmt(S.exp);
  var _tk=document.getElementById('ut-toks'); if(_tk) _tk.textContent=fmt(S.tokens|0);
  var _nv=document.getElementById('ut-nav');
  if(_nv) _nv.innerHTML=TABS.map(function(t){
    return '<button data-t="'+t[0]+'" class="'+(ui.tab===t[0]?'on':'')+'">'+t[1]+'</button>'; }).join('');
  var _fb=document.getElementById('ut-exit');
  if(_fb) _fb.className='ut-fab'+(ui.tab==='home'?'':' on');
  hudSync();
  var b=document.getElementById('ut-body');
  b.className='ut-scroll'+(ui.tab==='squadra'?' fill':'');
  if(!S.club){ b.className='ut-scroll'; b.innerHTML=viewCrestPick(); return; }
  if(!S.leagueName&&!S.league){ b.className='ut-scroll'; b.innerHTML=viewPick(); return; }
  if(!S.user){ b.className='ut-scroll'; b.innerHTML=viewUser(); bindUser(); return; }
  if(!S.tname){ b.className='ut-scroll'; b.innerHTML=viewTeamName(); bindTeamName(); return; }
  if(ui.tab==='personalizza'){ b.innerHTML=secTop()+viewCustom(); bindCrestSearch(); utAnim(b); return; }
  var _v='';
  if(ui.tab==='journey') _v=viewJourney();
  else if(ui.tab==='home') _v=viewHome();
  else if(ui.tab==='squadra') _v=viewSquad();
  else if(ui.tab==='negozio') _v=viewShop();
  else if(ui.tab==='mercato') _v=viewMarket();
  else if(ui.tab==='campionato') _v=viewLeague();
  else if(ui.tab==='scambio') _v=viewExchange();
  else if(ui.tab==='collezione') _v=viewColl();
  else if(ui.tab==='percorso') _v=viewPath();
  else _v=viewClub();
  b.innerHTML=(ui.tab==='home')?_v:(secTop()+_v);
  if(ui.tab==='squadra'){ fitPitch(); bindDnD(); }
  if(ui.tab==='home'){ try{ bindHero(); }catch(e){} }
  if(ui.tab==='percorso'){ try{ bindPath(); }catch(e){} }
  utAnim(b);
}
function userTaken(n){
  try{
    var reg=JSON.parse(localStorage.getItem('ut_users')||'[]');
    return reg.indexOf(n.toLowerCase())>=0;
  }catch(e){ return false; }
}
function userRegister(n){
  try{
    var reg=JSON.parse(localStorage.getItem('ut_users')||'[]');
    reg.push(n.toLowerCase());
    localStorage.setItem('ut_users',JSON.stringify(reg));
  }catch(e){}
}
function viewUser(){
  return '<div class="ut-pick"><div class="ut-pickh">Scegli il tuo nome</div>'+
    '<div class="ut-note">Sara\' il nome con cui comparirai in classifica e nelle partite. '+
    '<b>Si sceglie una volta sola e non si puo\' cambiare</b>: pensaci bene.</div>'+
    '<div class="ut-userbox">'+
      '<input id="ut-uname" type="text" maxlength="16" autocomplete="off" spellcheck="false" '+
        'placeholder="Da 3 a 16 caratteri">'+
      '<div class="ut-uhint" id="ut-uhint">Lettere, numeri, punto e trattino basso.</div>'+
      '<button class="ut-play" id="ut-uok" disabled>Conferma il nome</button>'+
    '</div>'+
    '<div class="ut-note">Club scelto: <b>'+esc2(S.club)+'</b> \u00b7 campionato: <b>'+
      esc2(S.leagueName||'Lega Ultimate')+'</b></div></div>';
}
function bindUser(){
  var inp=document.getElementById('ut-uname'), ok=document.getElementById('ut-uok'),
      hint=document.getElementById('ut-uhint');
  if(!inp) return;
  function check(){
    var v=inp.value.trim();
    var valid=/^[A-Za-z0-9._-]{3,16}$/.test(v);
    var taken=valid&&userTaken(v);
    ok.disabled=!valid||taken;
    if(!v){ hint.textContent='Lettere, numeri, punto e trattino basso.'; hint.className='ut-uhint'; }
    else if(!valid){ hint.textContent='Da 3 a 16 caratteri, senza spazi o simbo li strani.'; hint.className='ut-uhint bad'; }
    else if(taken){ hint.textContent='Questo nome e\' gia\' stato usato su questo dispositivo.'; hint.className='ut-uhint bad'; }
    else { hint.textContent='Nome disponibile.'; hint.className='ut-uhint good'; }
  }
  inp.addEventListener('input',check);
  inp.addEventListener('keydown',function(e){ if(e.key==='Enter'&&!ok.disabled) ok.click(); });
  ok.addEventListener('click',function(){
    var v=inp.value.trim();
    if(!/^[A-Za-z0-9._-]{3,16}$/.test(v)||userTaken(v)) return;
    S.user=v; userRegister(v); save(); render();
    toast('Benvenuto, <b>'+esc2(v)+'</b>.');
  });
  setTimeout(function(){ try{ inp.focus(); }catch(e){} },60);
}
function bindCrestSearch(){
  var q=document.getElementById('crest-q'); if(!q) return;
  q.addEventListener('input',function(){
    ui.crestQ=q.value;
    var pos=q.selectionStart;
    var body=document.getElementById('ut-body');
    body.innerHTML=viewCustom();
    var q2=document.getElementById('crest-q');
    if(q2){ q2.focus(); try{ q2.setSelectionRange(pos,pos); }catch(e){} bindCrestSearch(); }
  });
}
function fitPitch(){
  var p=document.querySelector('.ut-pitch'); if(!p) return;
  var w=p.clientWidth||360, h=p.clientHeight||420;
  var cw=Math.max(42,Math.min(88,Math.min(w*0.103,h*0.145)));
  p.style.setProperty('--cw',Math.round(cw)+'px');
}
function viewPick(){
  var cards=leagueNames().map(function(n){
    var teams=(typeof LEAGUES!=='undefined'&&LEAGUES[n])?LEAGUES[n]:[];
    var lg=''; try{ if(typeof getLeagueLogo==='function') lg=getLeagueLogo(n); }catch(e){}
    return '<button class="ut-lgcard" data-lg="'+esc2(n)+'">'+
      (lg?'<img src="'+esc2(lg)+'" alt="'+esc2(n)+'" referrerpolicy="no-referrer">':'<div class="ut-lgph"></div>')+
      '<div><b>'+esc2(n)+'</b><span>'+Math.min(11,teams.length)+' avversarie dal database</span></div>'+
      '<em>\u203a</em></button>';
  }).join('');
  return '<div class="ut-pick"><div class="ut-pickh">Scegli il campionato</div>'+
    '<div class="ut-note">Affronterai le squadre vere di quel campionato, una giornata alla volta.</div>'+
    cards+'<button class="ut-lgcard" data-lg="__rnd"><div class="ut-lgph"></div>'+
    '<div><b>Lega Ultimate</b><span>11 club inventati</span></div><em>\u203a</em></button></div>';
}


/* ============================================================================
   STEMMA DEL CLUB: all'inizio si sceglie fra cinque squadre di divisione bassa,
   estratte a caso. Poi, nella sezione Personalizza, si possono comprare gli
   stemmi di qualsiasi club: piu' e' blasonato, piu' costa.
   ========================================================================== */
function allClubs(){
  if(window.__utClubs) return window.__utClubs;
  var out=[], seen={};
  try{
    if(typeof EADB!=='undefined'){
      for(var n in EADB){
        var c=EADB[n]; if(!c||seen[n]) continue; seen[n]=1;
        out.push({n:n, str:(c.str||70), logo:clubLogo(n)});
      }
    }
  }catch(e){}
  out.sort(function(a,b){ return b.str-a.str; });
  window.__utClubs=out;
  return out;
}
/* prezzo dello stemma: sale con la forza del club */
function crestPrice(str){
  var s=Math.max(55,Math.min(90,str||70));
  return Math.round((300+Math.pow(s-54,2.35)*11)/100)*100;
}
function lowClubs(){
  return allClubs().filter(function(c){ return c.str<=72; });
}
/* cinque proposte casuali fra le divisioni basse */
function crestOffer(){
  if(S.crestOffer&&S.crestOffer.length===5) return S.crestOffer;
  var pool=lowClubs(); if(pool.length<5) pool=allClubs().slice(-40);
  var pick=[], seen={};
  var guard=0;
  while(pick.length<5&&guard++<400){
    var c=pool[Math.floor(Math.random()*pool.length)];
    if(!c||seen[c.n]) continue; seen[c.n]=1; pick.push({n:c.n,logo:c.logo,str:c.str});
  }
  S.crestOffer=pick; save();
  return pick;
}
function setCrest(name,logo){
  /* lo stemma cambia, il nome scelto dal giocatore resta invariato */
  S.crestClub=name; S.crest=logo||clubLogo(name);
  if(!S.club) S.club=name;
  if(S.tname) S.club=S.tname;
  if(S.league&&S.league.tab&&S.league.tab[0]){ S.league.tab[0].n=S.club; S.league.tab[0].logo=S.crest; }
  save();
}
function viewCrestPick(){
  var of=crestOffer();
  return '<div class="ut-pick"><div class="ut-pickh">Scegli il tuo club</div>'+
    '<div class="ut-note">Si parte dal basso: cinque squadre estratte fra le divisioni minori. '+
    'Piu\' avanti, nella sezione <b>Personalizza</b>, potrai comprare lo stemma di qualsiasi club.</div>'+
    '<div class="ut-crestgrid">'+of.map(function(c){
      return '<button class="ut-crestcard" data-crest="'+esc2(c.n)+'">'+
        (c.logo?'<img src="'+esc2(c.logo)+'" alt="'+esc2(c.n)+'" referrerpolicy="no-referrer">':'<div class="ut-lgph"></div>')+
        '<b>'+esc2(c.n)+'</b><span>forza '+c.str+'</span></button>';
    }).join('')+'</div>'+
    '<button class="ut-ghost" data-act="reroll" style="margin-top:14px">Estrai altre cinque</button></div>';
}
function viewCustom(){
  var q=(ui.crestQ||'').toLowerCase();
  var list=allClubs().filter(function(c){
    if(!q) return true;
    return c.n.toLowerCase().indexOf(q)>=0;
  });
  var owned=S.crests||{};
  var rows=list.slice(0,120).map(function(c){
    var pr=crestPrice(c.str), has=owned[c.n]||c.n===S.crestClub;
    var cur=(S.crestClub===c.n);
    return '<div class="ut-crow'+(cur?' cur':'')+'">'+
      '<div class="ut-cimg">'+(c.logo?'<img src="'+esc2(c.logo)+'" alt="'+esc2(c.n)+'" referrerpolicy="no-referrer">':'')+'</div>'+
      '<div class="ut-cnm"><b>'+esc2(c.n)+'</b><span>forza '+c.str+'</span></div>'+
      (cur?'<div class="ut-cbadge">in uso</div>':
        (has?'<button class="ut-cbtn use" data-usecrest="'+esc2(c.n)+'">Usa</button>':
             '<button class="ut-cbtn'+(S.coins>=pr?'':' no')+'" data-buycrest="'+esc2(c.n)+'">'+
             fmt(pr)+'</button>'))+
    '</div>';
  }).join('');
  return '<div class="ut-customwrap">'+
    '<div class="ut-hcard">'+
      '<div class="ut-hlab">Il tuo stemma</div>'+
      '<div class="ut-curcrest">'+
        (S.crest?'<img src="'+esc2(S.crest)+'" alt="" referrerpolicy="no-referrer">':'<div class="ut-lgph"></div>')+
        '<div><b>'+esc2(S.club)+'</b><span>'+(Object.keys(owned).length)+' stemmi sbloccati</span></div>'+
      '</div>'+
    '</div>'+
    '<div class="ut-csearch"><input id="crest-q" type="text" placeholder="Cerca un club..." '+
      'value="'+esc2(ui.crestQ||'')+'" autocomplete="off"></div>'+
    '<div class="ut-note" style="padding:0 2px 8px">Il prezzo cresce col blasone del club: '+
    'una squadra di seconda divisione costa poche migliaia di monete, i grandi club molto di piu\'.</div>'+
    '<div class="ut-clist">'+(rows||'<div class="ut-empty">Nessun club trovato.</div>')+'</div>'+
    (list.length>120?'<div class="ut-note">Mostrati i primi 120 su '+list.length+': usa la ricerca.</div>':'')+
  '</div>';
}


/* ============================================================================
   JOURNEY — 30 scenari, dal club piu' modesto del database fino a una rosa
   con sei stelle e livelli quasi al massimo. Ogni scenario mostra la
   formazione avversaria carta per carta prima di scendere in campo.
   ========================================================================== */
/* ============================================================================
   JOURNEY — 30 scenari, 30 partite per ogni scenario (900 sfide in totale).
   Vista a capitoli in stile AAA; anteprima partita con la mia formazione
   schierata contro quella avversaria, carta per carta.
   ========================================================================== */
var JN=30, JM=30;
function jnClubs(){
  if(window.__jnClubs) return window.__jnClubs;
  var out=[], seen={};
  try{
    if(typeof EADB!=='undefined')
      for(var n in EADB){ var c=EADB[n]; if(!c||seen[n]) continue; seen[n]=1;
        out.push({n:n,str:(c.str||70)}); }
  }catch(e){}
  out.sort(function(a,b){ return a.str-b.str; });   /* dal piu' scarso al piu' forte */
  window.__jnClubs=out;
  return out;
}
function jnBuild(name){
  if(!window.__jnCB) window.__jnCB={};
  if(window.__jnCB[name]) return window.__jnCB[name];
  var od=null;
  try{ if(typeof buildClub==='function') od=buildClub(name); }catch(e){}
  window.__jnCB[name]=od||{r:[]};
  return window.__jnCB[name];
}
function jnState(){
  if(!S.journey||typeof S.journey!=='object') S.journey={};
  var J=S.journey;
  if(!J.prog||typeof J.prog!=='object'){
    J.prog={};
    /* migrazione dai vecchi salvataggi: un vecchio scenario superato
       equivale al primo capitolo completato */
    if(typeof J.done==='number' && J.done>0)
      for(var i=1;i<=Math.min(JN,J.done);i++) J.prog[i]=JM;
  }
  if(!J.sc) J.sc=1;
  if(!J.best||typeof J.best!=='object') J.best={};
  return J;
}
function jnProg(sc){ var J=jnState(); return J.prog[sc]|0; }
function jnOpenSc(sc){ return sc<=1 ? true : jnProg(sc-1)>=JM; }
function jnTotDone(){ var J=jnState(), t=0; for(var k in J.prog) t+=J.prog[k]|0; return t; }
function jnIdx(sc,m){ return (sc-1)*JM+m; }
/* difficolta' progressiva su tutte le 900 partite */
function jnSpec(sc,m){
  var g=jnIdx(sc,m), t=(g-1)/(JN*JM-1);
  var lvl=Math.max(1,Math.round(1+t*t*96));
  var stars=Math.min(6,Math.floor(t*6.6));
  var red=(t>=0.985);
  var ver=t>=0.9?'legends':(t>=0.81?'special2':(t>=0.72?'worldcup':(t>=0.5?'special':(t>=0.28?'gold':(t>=0.12?'silver':'bronze')))));
  var reward=Math.round((240+g*9+g*g*0.05)/10)*10;
  var expR=Math.round((50+g*2.4)/5)*5;
  /* i token non sono piu' garantiti: solo alcune sfide li pagano, e solo alla
     prima vittoria. Cosi' restano una valuta rara e sensata. */
  var tok=((m%5===0)||red)?Math.max(1,Math.min(9,Math.round(1+t*8))):0;
  return {lvl:lvl,stars:stars,red:red,ver:ver,reward:reward,exp:expR,tok:tok,g:g,t:t};
}
function jnClubFor(sc,m){
  var cl=jnClubs(); if(!cl.length) return null;
  var g=jnIdx(sc,m);
  var idx=Math.floor((g-1)/(JN*JM-1)*(cl.length-1));
  var off=((sc*7+m*13)%5)-2;                 /* varieta' senza alterare la curva */
  idx=Math.max(0,Math.min(cl.length-1,idx+off));
  return cl[idx];
}
function jnOpp(sc,m){
  var club=jnClubFor(sc,m), sp=jnSpec(sc,m), sl=slots(), out=[];
  if(!club) club={n:'Avversario '+m, str:60};
  var od=jnBuild(club.n);
  var raw=(od&&od.r)?od.r.slice().sort(function(a,b){ return b.rate-a.rate; }).slice(0,11):[];
  for(var k=0;k<11;k++){
    var q=raw[k];
    var base=q?q.rate:(club.str-2+((sc*3+m*5+k)%5));
    out.push({id:'jn'+sc+'_'+m+'_'+k, pid:q?q.pid:'', name:q?q.name:'Giocatore '+(k+1),
      roles:q?q.roles:[mapRoleBack(sl[k][0])], base:base, img:q?q.img:'',
      pac:q?+q.pac:base, sho:q?+q.sho:base, pas:q?+q.pas:base,
      dri:q?+q.dri:base, def:q?+q.def:base, phy:q?+q.phy:base,
      age:q?q.age:26, nation:q?q.nation:'', ver:sp.ver, lvl:sp.lvl, stars:sp.stars, red:sp.red});
  }
  return {name:club.n, club:club.n, str:club.str, players:out, spec:sp, sc:sc, m:m};
}
function mapRoleBack(r){
  return {GK:'POR',LB:'TS',CB:'DC',RB:'TD',CM:'CC',LM:'CC',RM:'CC',LW:'AS',RW:'AD',ST:'ATT'}[r]||'CC';
}
function jnPower(list){
  if(!list||!list.length) return 0;
  var t=0; for(var i=0;i<list.length;i++) if(list[i]) t+=ovrOf(list[i]);
  return t;
}
function jnRating(sc,m){
  var k=sc+'_'+m;
  if(!window.__jnR) window.__jnR={};
  if(window.__jnR[k]!=null) return window.__jnR[k];
  var v=jnPower(jnOpp(sc,m).players);
  window.__jnR[k]=v;
  return v;
}

/* -------------------------------------------------- vista a capitoli (lista) */
function viewJourney(){
  if(ui.jnList) return viewJnList();
  var J=jnState();
  var sc=Math.max(1,Math.min(JN,J.sc||1));
  J.sc=sc;
  var prog=jnProg(sc), open2=jnOpenSc(sc), cards='';
  for(var m=1;m<=JM;m++){
    var sp=jnSpec(sc,m), club=jnClubFor(sc,m);
    var nm=club?club.n:('Avversario '+m);
    var done=prog>=m, cur=(prog===m-1)&&open2, lock=(!open2)||(prog<m-1);
    var lg=clubLogo(nm);
    cards+='<div class="jn-col">'+
      '<div class="jn-mlab">Partita '+jnIdx(sc,m)+'</div>'+
      '<div class="jn-tick"></div>'+
      '<button class="jn-card'+(done?' done':'')+(cur?' cur':'')+(lock?' lock':'')+'" '+
        (lock?'':'data-jnm="'+sc+'_'+m+'"')+'>'+
        '<div class="jn-cname">'+esc2(nm)+'</div>'+
        '<div class="jn-covr">Overall Rating: '+jnRating(sc,m)+'</div>'+
        '<div class="jn-crest">'+(lg?'<img src="'+esc2(lg)+'" alt="" referrerpolicy="no-referrer">':'<i></i>')+'</div>'+
        '<div class="jn-cmode">'+(VER[sp.ver]?VER[sp.ver].nm:sp.ver)+'<br>LV '+sp.lvl+' \u00b7 '+
          (sp.red?'6\u2605 rosse':sp.stars+'\u2605')+'</div>'+
        '<div class="jn-crew">'+
          '<span class="jn-rw exp"><i></i>'+fmt(sp.exp)+'</span>'+
          '<span class="jn-rw coin"><i></i>'+fmt(sp.reward)+'</span>'+
          '<span class="jn-rw tok"><i></i>'+sp.tok+'</span>'+
        '</div>'+
        (done?'<div class="jn-badge">\u2713</div>':(lock?'<div class="jn-badge lk">\u2022</div>':''))+
      '</button>'+
    '</div>';
  }
  var next=Math.min(JM,prog+1);
  return '<div class="jn-wrap">'+
    '<div class="jn-top">'+
      '<div class="jn-title"><span class="jn-back" data-t2="home">\u2039</span>PITCH JOURNEY</div>'+
      '<div class="jn-chap">'+
        '<button class="jn-arrow" data-jnc="prev" '+(sc<=1?'disabled':'')+'>\u25c0</button>'+
        '<div class="jn-chapname">Scenario '+sc+'<small>Progresso: '+prog+'/'+JM+'</small></div>'+
        '<button class="jn-arrow" data-jnc="next" '+(sc>=JN?'disabled':'')+'>\u25b6</button>'+
      '</div>'+
      '<button class="jn-list" data-jnc="list">\u21c4 Lista scenari</button>'+
    '</div>'+
    '<div class="jn-progbar"><i style="width:'+Math.round(prog/JM*100)+'%"></i></div>'+
    '<div class="jn-strip">'+cards+'</div>'+
    '<div class="jn-foot">'+
      '<div class="jn-fnote">'+jnTotDone()+' / '+(JN*JM)+' partite vinte in tutto il Journey</div>'+
      (open2?'<button class="jn-begin" data-jnm="'+sc+'_'+next+'">INIZIA LA SFIDA</button>':
        '<div class="jn-locked">Completa lo scenario '+(sc-1)+' per sbloccare</div>')+
    '</div>'+
  '</div>';
}
function viewJnList(){
  var J=jnState(), rows='';
  for(var sc=1;sc<=JN;sc++){
    var p=jnProg(sc), op=jnOpenSc(sc);
    rows+='<button class="jl-row'+(op?'':' lock')+(p>=JM?' done':'')+'" '+(op?'data-jnsel="'+sc+'"':'')+'>'+
      '<b>Scenario '+sc+'</b>'+
      '<div class="jl-bar"><i style="width:'+Math.round(p/JM*100)+'%"></i></div>'+
      '<em>'+p+'/'+JM+'</em></button>';
  }
  return '<div class="jl-wrap"><div class="jl-head">Lista scenari<button data-jnc="close">\u00d7</button></div>'+
    '<div class="jl-list">'+rows+'</div></div>';
}

/* ------------------------------------- anteprima partita: formazione vs formazione */
function jnPitchHTML(list,sl){
  var out='';
  for(var i=0;i<11;i++){
    var c=list[i], p=sl[i];
    out+='<div class="jv-slot" style="left:'+p[1]+'%;top:'+p[2]+'%">'+
      (c?cardHTML(c):'<div class="jv-empty"></div>')+
      '<em>'+p[0]+'</em></div>';
  }
  return '<div class="jv-pitch"><div class="jv-turf"></div>'+out+'</div>';
}
function jnPreview(sc,m){
  var opp=jnOpp(sc,m), sp=opp.spec, r=ratings(), sl=slots();
  var mine=[]; for(var k=0;k<11;k++) mine.push(cardAt(k));
  var myPow=jnPower(mine), opPow=jnPower(opp.players);
  ui.jnSc=sc; ui.jnM=m; ui.jnOpp=opp;
  var wr=Math.max(4,Math.min(96,Math.round(myPow/Math.max(1,myPow+opPow)*100)));
  var repeat=(jnProg(sc)>=m);
  var myLogo=S.crest?('<img src="'+esc2(S.crest)+'" alt="" referrerpolicy="no-referrer">'):'<i></i>';
  var opLogo=clubLogo(opp.name);
  var host=document.getElementById('jn-prev');
  if(!host){ host=document.createElement('div'); host.id='jn-prev'; root().appendChild(host); }
  host.innerHTML='<div class="jv-sheet">'+
    '<div class="jv-top">'+
      '<button class="jv-back" data-jv="close">\u2039</button>'+
      '<span>Scenario '+sc+' \u00b7 Partita '+m+' di '+JM+'</span>'+
    '</div>'+
    '<div class="jv-bar">'+
      '<div class="jv-team">'+myLogo+'<div><b>'+esc2(S.club||'La mia squadra')+'</b>'+
        '<span>Overall Rating: '+myPow+'</span></div></div>'+
      '<div class="jv-rate"><small>Probabilita\' di vittoria stimata</small>'+
        '<div class="jv-rbar"><i style="width:'+wr+'%"></i></div>'+
        '<div class="jv-rnum"><b>'+wr+'%</b><b>'+(100-wr)+'%</b></div></div>'+
      '<div class="jv-team r"><div><b>'+esc2(opp.name)+'</b>'+
        '<span>Overall Rating: '+opPow+'</span></div>'+
        (opLogo?'<img src="'+esc2(opLogo)+'" alt="" referrerpolicy="no-referrer">':'<i></i>')+'</div>'+
    '</div>'+
    '<div class="jv-field">'+
      '<div class="jv-half">'+jnPitchHTML(mine,sl)+'<div class="jv-fname">'+esc2(S.form)+' \u00b7 la tua formazione</div></div>'+
      '<div class="jv-vs">VS</div>'+
      '<div class="jv-half r">'+jnPitchHTML(opp.players,sl)+'<div class="jv-fname">'+esc2(S.form)+' \u00b7 formazione avversaria</div></div>'+
    '</div>'+
    '<div class="jv-bottom">'+
      '<div class="jv-lbtns">'+
        '<button class="jv-ghost" data-jv="lineup">MODIFICA FORMAZIONE</button>'+
        '<button class="jv-sim" data-jv="sim"'+(r.n<11?' disabled':'')+'>'+
          '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 4l8 8-8 8zM13 4l8 8-8 8z"/></svg>'+
          'SIMULA VELOCE</button>'+
      '</div>'+
      '<div class="jv-rew"><small>'+(repeat?'Ricompensa ridotta (gia\' vinta)':'Ricompensa prima vittoria')+'</small>'+
        '<div class="jv-chips">'+
          '<span class="jv-chip exp"><i></i>'+fmt(repeat?Math.round(sp.exp/2):sp.exp)+' EXP</span>'+
          '<span class="jv-chip coin"><i></i>'+fmt(repeat?Math.round(sp.reward/2):sp.reward)+'</span>'+
          '<span class="jv-chip tok"><i></i>'+(repeat?0:sp.tok)+' token</span>'+
        '</div>'+
        '<small class="jv-tokhint">'+(repeat?
          'I token si ottengono solo alla prima vittoria di ogni sfida.':
          'I token si guadagnano solo qui e si spendono allo Scambio.')+'</small></div>'+
      '<button class="jv-start" data-jv="play"'+(r.n<11?' disabled':'')+'>'+
        (r.n<11?'SCHIERA 11 GIOCATORI':'INIZIA LA PARTITA')+'</button>'+
    '</div>'+
  '</div>';
  host.classList.add('on');
  if(!host.__b){
    host.__b=true;
    host.addEventListener('click',function(e){
      var a=cl(e.target,'[data-jv]');
      if(!a){ if(e.target===host) jnClose(); return; }
      var k=a.getAttribute('data-jv');
      if(k==='close') jnClose();
      else if(k==='lineup'){ jnClose(); ui.tab='squadra'; render(); }
      else if(k==='sim') jnSim();
      else if(k==='play') jnPlay();
    });
  }
}
function jnClose(){
  var h=document.getElementById('jn-prev');
  if(h){ h.classList.remove('on'); h.innerHTML=''; }
}
function jnPlayGo(){
  var sc=ui.jnSc, m=ui.jnM, opp=ui.jnOpp;
  if(!sc||!m||!opp) return;
  var r=ratings();
  if(r.n<11){ toast('Devi schierare 11 giocatori.'); return; }
  if(!window.FM26||!window.FM26.start){ toast('Motore partita non disponibile.'); return; }
  var sl=slots(), users=[];
  for(var k=0;k<11;k++){
    var c=cardAt(k), role=sl[k][0], eff=ovrIn(c,role), dp=ovrOf(c)-eff;
    users.push({name:c.name,img:c.img,rate:eff,
      pac:Math.max(1,statOf(c,'pac')-dp),sho:Math.max(1,statOf(c,'sho')-dp),
      pas:Math.max(1,statOf(c,'pas')-dp),dri:Math.max(1,statOf(c,'dri')-dp),
      def:Math.max(1,statOf(c,'def')-dp),phy:Math.max(1,statOf(c,'phy')-dp)});
  }
  var ops=opp.players.map(function(c){
    return {name:c.name,img:c.img,rate:ovrOf(c),
      pac:statOf(c,'pac'),sho:statOf(c,'sho'),pas:statOf(c,'pas'),
      dri:statOf(c,'dri'),def:statOf(c,'def'),phy:statOf(c,'phy')};
  });
  var form=sl.map(function(x){ return {role:mapRoleBack(x[0]),x:x[1],y:x[2]}; });
  var oStr=Math.round(jnPower(opp.players)/11);
  jnClose(); hide();
  try{
    window.FM26.start({
      homeName:S.club, awayName:opp.name,
      comp:'Journey \u00b7 scenario '+sc+' \u00b7 partita '+m, compShort:'JN',
      userSide:0, userTeam:{players:users,formation:form}, oppTeam:{players:ops,formation:form},
      userStr:Math.round(r.ovr), oppStr:oStr,
      kits:[{s:'#00d26a',sh:'#04180d'},{s:'#c9a227',sh:'#221a03'}], halfLen:180,
      onFinish:function(res){ jnFinish(sc,m,res.gfUser|0,res.gfOpp|0); },
      onAbandon:function(){ open(); }
    });
  }catch(e){ toast('Errore avvio partita.'); open(); }
}
/* simulazione istantanea: stesso esito probabilistico della partita giocata,
   ma senza aprire il motore 2D. Serve per macinare in fretta le 900 sfide. */
function jnSim(){
  var sc=ui.jnSc, m=ui.jnM, opp=ui.jnOpp;
  if(!sc||!m||!opp) return;
  var r=ratings();
  if(r.n<11){ toast('Devi schierare 11 giocatori.'); return; }
  var mine=[]; for(var k=0;k<11;k++) mine.push(cardAt(k));
  var myPow=jnPower(mine), opPow=jnPower(opp.players);
  var diff=(myPow-opPow)/70;
  var gf=Math.max(0,Math.round(1.35+diff*0.62+Math.random()*2-0.75));
  var ga=Math.max(0,Math.round(1.35-diff*0.62+Math.random()*2-0.75));
  jnClose();
  jnFinish(sc,m,gf,ga);
}
function jnFinish(sc,m,gf,ga){
  var J=jnState(), sp=jnSpec(sc,m), win=gf>ga;
  var repeat=(jnProg(sc)>=m);
  var coins=win?Math.round(sp.reward*(repeat?0.5:1)):Math.round(sp.reward*0.15);
  var exp=win?Math.round(sp.exp*(repeat?0.5:1)):Math.round(sp.exp*0.2);
  /* i token si guadagnano solo vincendo: e' la loro unica fonte */
  var toks=(win&&!repeat)?sp.tok:0;
  S.coins+=coins; S.exp+=exp; S.tokens=(S.tokens|0)+toks;
  if(win && (J.prog[sc]|0)===m-1) J.prog[sc]=m;
  if(win && (J.prog[sc]|0)>=JM && sc<JN) J.sc=sc+1;
  J.best[sc+'_'+m]=Math.max(J.best[sc+'_'+m]||0,gf-ga);
  save(); open(); ui.tab='journey'; render();
  setTimeout(function(){
    toast('<b>'+gf+' - '+ga+'</b> \u00b7 '+(win?'partita vinta':'sconfitta')+
      ' \u00b7 +'+fmt(coins)+' monete \u00b7 +'+fmt(exp)+' EXP'+
      (toks?' \u00b7 +'+toks+' token':''));
  },400);
}

/* ============================================================================
   RICOMPENSE GIORNALIERE — sette giorni di accesso, come nei giochi AAA.
   ========================================================================== */
var DAILY=[
  {t:'coin', v:500,          nm:'500 monete'},
  {t:'pack', v:'bronzo',     nm:'Pacchetto Bronzo'},
  {t:'exp',  v:1200,         nm:'1.200 EXP'},
  {t:'pack', v:'argento72',  nm:'Pacchetto Argento'},
  {t:'coin', v:3000,         nm:'3.000 monete'},
  {t:'pack', v:'special',    nm:'Special Edition'},
  {t:'pack', v:'legends1',   nm:'Icona Legends'}
];
function dayKey(){
  var d=new Date();
  return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();
}
function dailyState(){
  if(!S.daily||typeof S.daily!=='object') S.daily={day:0,last:'',streak:0};
  if(typeof S.daily.day!=='number') S.daily.day=0;
  return S.daily;
}
function dailyReady(){ return dailyState().last!==dayKey(); }
function packByKey(k){
  for(var i=0;i<PACKS.length;i++) if(PACKS[i].k===k) return PACKS[i];
  return null;
}
function dailyClaim(){
  var D=dailyState();
  if(!dailyReady()){ toast('Hai gia\' ritirato la ricompensa di oggi. Torna domani.'); return; }
  var idx=D.day%7, rw=DAILY[idx];
  D.last=dayKey(); D.day=(D.day+1)%7; D.streak=(D.streak|0)+1;
  var msg='';
  if(rw.t==='coin'){ S.coins+=rw.v; msg='+'+fmt(rw.v)+' monete'; }
  else if(rw.t==='exp'){ S.exp+=rw.v; msg='+'+fmt(rw.v)+' EXP'; }
  else {
    var pk=packByKey(rw.v)||PACKS[0];
    var got=openPack(pk);
    msg=rw.nm+': '+got.length+' cart'+(got.length===1?'a':'e');
    var cds=got.map(function(c){ return '<div class="ut-mini">'+cardHTML(c)+'</div>'; }).join('');
    save(); render(); actClose();
    modal('<div class="ut-mh"><h3>Giorno '+(idx+1)+' \u00b7 '+esc2(rw.nm)+'</h3>'+
      '<button data-x="1">\u00d7</button></div>'+
      '<div class="ut-top4">'+cds+'</div>');
    toast(msg);
    return;
  }
  save(); render(); toast('Ricompensa del giorno '+(idx+1)+' ritirata \u00b7 '+msg);
}
function dailyHTML(){
  try{ if(typeof window.kfmDailyHTML==='function') return window.kfmDailyHTML(); }catch(e){}
  var D=dailyState(), ready=dailyReady(), cur=D.day%7, out='';
  for(var i=0;i<7;i++){
    var rw=DAILY[i], done=(i<cur), now=(ready&&i===cur), big=(i===6);
    out+='<div class="dl3-c'+(done?' done':'')+(now?' now':'')+(big?' big':'')+'">'+
      '<div class="h">Giorno '+(i+1)+'</div>'+
      '<div class="a">'+((typeof rwArt==='function')?rwArt(rw):'')+'</div>'+
      '<div class="n">'+esc2(rw.nm)+'</div>'+
    '</div>';
  }
  var ph=(window.KFM_PLAYER?'<img class="ph" src="'+window.KFM_PLAYER+'" alt="">':'');
  return '<div class="kfm-body"><div class="dl3">'+
    '<div class="dl3-grid">'+out+'</div>'+
    '<div class="dl3-side">'+ph+'<span class="glow"></span>'+
      '<div class="st"><b>'+(D.streak|0)+'</b><span>giorni di fila</span></div>'+
      '<div class="bx">'+(ready?('Ricompensa del giorno '+(cur+1)+' disponibile. Le ricompense si rinnovano ogni giorno a mezzanotte.'):'Ricompensa di oggi gia\u0027 ritirata. Le ricompense si rinnovano ogni giorno a mezzanotte.')+'</div>'+
      (ready?'<button class="kfm-cta" data-ac="claim">Ritira</button>':'<div class="kfm-cta off">Torna domani</div>')+
    '</div>'+
  '</div></div>';
}


/* ============================================================================
   ICONE — disegnate a mano in SVG, nessuna dipendenza esterna.
   ========================================================================== */
var _SVG='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" '+
  'stroke-linecap="round" stroke-linejoin="round">';
/* ==========================================================================
   ARTWORK DELLE SPLASH DELL'HERO (una per swipe) + navigazione premium
   ========================================================================== */
var SPL=['data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgFBgcGBQgHBgcJCAgJDBMMDAsLDBgREg4THBgdHRsYGxofIywlHyEqIRobJjQnKi4vMTIxHiU2OjYwOiwwMTD/2wBDAQgJCQwKDBcMDBcwIBsgMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDD/wgARCAM0AzQDASIAAhEBAxEB/8QAGwAAAgMBAQEAAAAAAAAAAAAAAAECAwQFBgf/xAAZAQEBAQEBAQAAAAAAAAAAAAAAAQIDBAX/2gAMAwEAAhADEAAAAfENPj7wBRgoAo05QBRpgBKJgMFExRpgmlBgmEAAAKAkYnQBKAIA1AFABMATATAAAGqYQ0CgAAwTSjAAAEwAABQYIAGEoAAAAKwBpqaGgAaACpgAizKJ9fnACsQMCViajQrE5WIViagAwJQAbnReEmTbg5BCN5eWObN8GZZTeh55TdwPPpBDLdRc2Cee4ArEQxAxAxAwFYgYgYhWAAAAKAA4sYiGIViBiYxANCsQMQMCViFYANCgJHFK4ALjOM6eIAUGKmNUMlTYqbSgOVDBEhUMVThG8Z5q7uniiTouLZ0M0VwhNWFL1jUQ6GemCUqU6GSuM04O+q7lLHqYQm7FGydINk2hioZCG1iSCJIIthEkEWxUMESQhghgmxUMEMhDBEhYkgiSBDFRIWLZKhghxQizXOLYiGLnE+niYmoBK2m0A5UwUAUYKAQAABYnOrXnrr0U78lEka5uVtKxQ7ETgXVNStISSdixnBrYq4yuTazszqb3KqXL2SE51GObQmDE2NAxEMAAAAUAQaFAAAGCGIViBgAADTVA4AaoGoiLIBcgwQCAis4HTwsBoaco0K2iabQo0KxOBqQprNrhfXm1dPHZbo5PPcahduE+ngqmr80mkJqyyuLVg1IIzgFlcolZCxp5tOYBtFootm7KdOWbkRkOUp49Fd0lj0sTz2AFABoAaAAAAAAABoViBiBiBtCjRDE1AFYhWkmGgsYgYAIEQyzKw6eEBqmOVMGhgoDlTBQA0RnjeasvhvC6lOTOYVEOvCN7uM18NM1B6Xz64oWV75hZVLnnZXvm4Xi5hmsPTk053ow9Pm50r417xFxZaVubTBJ2Uzz10yps5e5jJ3THEWCoYIYIYJgCaQGCGKmAAAAACgxQZKmRQTLlDBDZFtAAIYAwytHXwsCVtCsTaYnKNCsCUBDB3JZq4zzacdmnp58PQ7Xp7nzXn/R489OL0K3NXFVdlbq2XNavnNc/P0OfrnqcjHTFCUenGMozuZRilYnYBOWE4Nboysz0pGwE5qdkHn03Oi/n6RonYaAEDBDEDEIxCsQMTATUAAAYErSSDRcsQrABoGIBoAQMQZmn18AwmhpqA5pMFYEoAANXtxScc96y74Xer8f9G35+lzXkmuRV3+RjpzYboTeHP0I3GN6I2RcZWQd2gq522i558zVc8+6uy5oJR1kakFtO3O8alG5nbTKbbjOVxlFuVtbz0vVduPXIDHoAJoAAlZZU9nrbz8cfTp9PH8qq+heKx6sJpWe1EtXqrz8dv+h2dPJ89f0N3HztfRUfO8f08mvk8Ppflcejzh0aM98pbWqAUGQJggKAEADKD6/PAGhhKMbQBNAMQxUyUI1c3XmhbL6H086q9B4nN6k6eHNWYseO42V4zfPZGjTKroGdazNom9FUM6aq7rLJ8zXhsx6K7tYxybuaQLBoJCUspqyaqlBlyhZNyjCc2WU3Tdrrnz9bJPPphOfdZ4vZ9R0eviwb5y6eFNq543i/a+L4/TzzNvP1eh9Apen4zYXmAANAAKq1L4Ln+x8j5/q5atFWfRQpxUAABUMRDBAJmafXwgCjCUabTE5QBWBKbMYk6pPXDf1vMZenk9PHhW41rjmnneZTp3zGpXPQtwXY66nljnfWrwXFNF8rE6nrNlNilhTrSYo2x3yzRtr3hDVjEEteK3O4grJDlKrr9GOua2us1xri1uyFRv8ATeFmfVtnyr6Fvh1nCdyJo4/jPZ+M4/Sq7/A9Lnr6iUX6PkyI5SrD5LLx+l7afgLZfqVnjvW9fDYha5Y/A/Q/nnL301WV8vdXCUVAAAAAAAATK0+vhGiVg2gBWJzQ01GnKJgpx6t48an1fnOnghfR6Cax07p8+3no97l75Z6ND3zpnP29nkodzzWOl1pDO73GeOlcZPWREbHKplVN1W+UadENYhGcbEgsJRcScdU09VOObunSrl1xlcziVkgiaKFMl2+Hpzv6F6H5p7+zcIueR4z2fjOP0qvS+a9Jnr6lp+j5Jh3c+b8Fl05fN9quyqxfQ+18T7bt8yQHTy0/PfoXzzl7qKra+XvqjKCsQMCARTQIAGZp9fCA5QBpgSjCaGmowaAIUoU781mjqeg34uTnln4+ky66ZdtWaq5zdOqHTnOee7O7t1GrOuebVZztenoS+Uqvp1l1313NYO5hXdBK676tZojfVrCQXIh09dGnO1Wq0VkbzLfmmk0u1N8S7X25fM2PRNc/Vs1XMPWfPvXy+0E+nLkeM9n43j9On0vm/S56enafo+SsO7DN+By6svm+1XOFjXf9r4r2vb5chnTyUfPfoXz7l76KrauXvqhOEoMUAAAAQCLnLJPr4QHNDRKwGhiVtOUBtAEt3ras98rhU+amjpWHOdOmyp6YLDRCFzZdTPOpxlbnWKrq1axmurr1MOfXRrEIX16zQWQZi4q5E0U0aobxnjbXrADTbRdDO6JqvWRIsLY6M6u6WLZz7dbMQXn346jt7/O9aF0p9zrw13wnZyPGey8bw+nX6TzfpZ09O1L0fJjh3YZvwOXTm832qrIWNd72/ifa9vlyA6eWn579C+e8vdTVZVy99UZRlEwGCoBACkAmYDr4GJzQ01AJpgK2iaGmppzaJOjzci38/VjVWsT38uWs+pw4p8PV1b8lkuhXGekW5JHdhdnUq5VdzowxgWUUw1i6NSsnFq5rRDWXGU4oW7JZTXbPWM0rIam7JozS1xDWCa1ZpfO3n3NSMdK8m+2zmc3r5N8s2j0Tx05v0v5x9F7efUmrOP4z2ni+H06vT+Y9NOnqWn6PkrBvwTfgM2nN5vtVWV2Nd/23iva9vlyA6eWn579C+ecfdnrsq5++uMoqADE4EFACIYZgOvhYOUAaGnKMGhhNACuUSXLLp6u3y+Tdq5+XYx0dDn14enszrLosM7sjCFltWWhNVNFdmyFDl0UV1XM4whvEytXFjqLLHC2aevLPHToZqs0Sqo0deNejIrN2PRSlFkNGs6tO3k8fTs0auHnXZXF1HuMvm1jpLQVy97DzcOs+x9D8t+j9vN0E105cjxnsvG8fp0+m8z6bPT1DT9HyTBvwTfgcunN5vtVzrsa9B7XxXte3y5AdPJT89+hfPePvz1W1c/fVGUVAcAACdAAgEzNPp4QY0DJUxtAyaBtqLCDVm9trnj55i14tdVM5c12yMF+O+XROGmbzUbclzz8+3PZmjbC5CIRjONzU5lzEmFZJ2GlbOfVR6efn15FZl7efrz5nTz0wZ9dW8Vgt8q4203Pd6/l+zw9V/MdMsVojrFSjaaOlR1sdebg63L1nV7/517vpw6ya3z4/jPZ+M4fTq9N5n006eoafo+SYN2Gb8Bm05/N9qqyuxrv+28T7bt8tgdPLT89+g/P+PuzV3Vc/fTGcJQYqGCGIhlRGGVo6eBtDTaJW0NNxc03FqxOWy/Pk6eOUXuvDBP0WSOV0MOeu2crbHS08y+b0xxwltwzqCDihCUbFGTuYuSIk0QY0t0Y9GOm/n03S4dtnTXz9uzFrM6Q3jPU104ytonC2ZOxnXH2Imtjphz62EJ1phXArvlbqYfe8L2GsdFBvjxvGez8Xx+nX6fzHp89PUNP0fJMG/BN+Ay6svm+1XZXYvoPbeH9v2+ZIDp5aPn30L57x91NNtPL31xcVbiKwEAAEUxCZhHXwSE5oabTESycXNMTaGiWVGz2e/J4H1nosFxyc3RWOvEy9zJefn+hrp3wujVLO2p151CDVJTSVq2JVKQkWnUCUGUIsdle6aqtjLOyyGU14oy1mOedHTkgNYJxlNPscjsY6U5rnjWKq/N146NPMsl3RhrzuiPVzSz+keP8AVdOXRSjrPK8Z7LxvD6VfpvM+mnT1DUvR8lYN+Cb8Dl05vN9qqyq1e/7bxHtu3zJgdPLT8++gfPuPuoqtp5++qMoysQMRTEDEDEJlY+vhTHNAyaAapjmgY0huXs9by/P34vUcrjR1x6xytDOudWnO7VCCqUK00VVuWZElsdTWUGkUXG5U4O5cXAUSGsp1Q3jqvlPOtsM8qtqIoILAbUkSm3vy6sdISk8zDT1NGs+ffoOBvnAZrCeqZmnnR19vm7pr1eXiTx6ul6PyVk39El82v6eX6fhxWS+Ly6qPP9jPZG5e37Xxvse3zLAOnlo+ffQfn/L3Z6rquXvojZFYtkqUhEMVDEiSKyNPp4GJtDTlGm0wJpgNAOWzJfr34+K+tT08WTTqMdaS1TVKtrSMZxsQOVgSyiRWSUbmSikkQdk4pWKEo3Kqvp1FJSRyTlUJRtGMJPXNU6HMN/D1s209Dn8+uiBXNXYKqN8Z1tdOdhWgadhZGyWU43NVFsAtrkmndy75vqbOTrx6OrZp9DcYdkzXCKkrM3gPaeL4/Qoqtq5+6qMoSsABAwBMQAVlcX18EiLmpEXK2hpuLmpCGm4uWXq/J+215pcjmrfk0Tw6MdL4QmUqdVzCmdKAlK3CFWVSrQUVrEiBZMgE1AsZGSWt68dcC20FJYalMb56zm0XRJsz3EpFaVhA7mBWce5GNJTWX9eUs+jNETRDUqlbpMtlgKyETRdz7F05q4JKWdps28ixfS+z+adTO/oz5HV1ho403zvPzz+f60a3VnsREskgYmg4hJIGIsytPr4BpzQ02mJzTBzQ02gCW6/Nl6/NZUt8LihGyeEl2xzRl0LO00RpS3QrVzbGssnFFjEEiISSlK7VdjpZaPHWiu2ux3voavOllr6efRSSSubgk7HYuSI0plbEk86zqyJZZXrVk7VzttnWiFteuFYy83VY5cRry2ViLkcWSlW4u0ZujNL0nnoTp6Pj25uP0YQisetiABDTQwEBNRNWABlY+vz02TaY5UxtJsmk2NJiQx6s3f5EXAuGIppMEyEwUAESQmwQwQwi3ZLG2VuOiuNGOhnvparJbLrTk08br53OM7znXWgtqtSN1UizPKa41vimI00gUb2noc+XuUbc61ucd+apb+e5RjZCs9WxXGUsrQEUABKM4ndXNdnT4N2euun3HlOH1cBOOe6GCUgiSEQwQwiSKyNPp4BptMRNScW0xErcZNOLJY574dPFmjqN8M5pc1meitzrUlrmlKKJopiBiYxOUY1dinjdlkdmekLIWLRXZTNPr863cyZlHp5LJUA3Kk1xotL5UogSQ50Vkq7dQWxhj1a5wnz9xXKZGrRj349mWE7zsxbuVYqbFrhBSig06suzKXTCiQ1KYrYXzfre95bs8u/msX0DyGfdzU4Y9MiLGIGIRpAxFmZp9PCNDTac0NNoaco0K2iaaGRJMi2NIblqzbo782BWV9vloCwZolqWszvIaYlNk3KTLM7d1U5q5FdQrsra1YNGLp54J165SUStMs22Wu7NYW53UX1AQtUx2xyrbow6sejTflu5+6YqpqLVnXwV6M+nHfPg14evhIivNDQgtaqNNU3W0a5SlAi3Xl047bPVeJ0Z39Ahx+9Z4vnfQPD8vpZgM+hNMBCDQAFZWPr4AHNJslTG0myaRIVDcsWNpNipslQxUxy6+V7Lj9/j+cNNuuNGmF/PtaXkud3QXPVrglDCpSjIugmUgrY59OLr5pQIspWV07KmErYwp1SJSi1lZCgcZTJkNWe9kqjn7rYwc0EKN+XXbjdyZCO/IIaEZwDTm0576IXx4fWw1dCnt87K9ULyqnBXlaVI2eq8fsz0+hYub6zPT5pHs8fl9WIxpDBDBDEytPp4mA0xOVuLmmJtMTlYhW02holYDTERITX1fF7Hmu/xs2uLilURjbZgsXZGhy6K0yokWKSCSIkKtcd4wT7XG3yIxEhCcLE0EnFw5QlUiLhuIrU7iSoJ1nZu0Z7ctRWexFQ1xSS35knFhzjcsISCvVm1Z76xPzfbUZpmEbVcUV6o74YobMvX509+LTGr3vz30Wd9Dx/0f5zj3QQsetiEYmICzM0+nhAbQDmgGoBNMG0A5pMAac0AKDAakvqPKep852+LTXVBJqDstnXZnc5QlnU3EVoLFIAiitOyzmdOdNDqvJQcAiFgDhNOmJjcSJei83uX2nkPe5z5/wDUPAfRi2HzPuzWrxX035hOhFRsTiXkNNLW61ZKJHVn1Y9NwHn+wAxJghshVeb8sabs/T5t+rFZNfQ/G9WGfT55Tjz+ggKABDEzA+nhGhpg5RptgyUac0NNQBRhKAKwSuyFh3OR0+f2+Pzce/FrnGyuxJ3VXY6tpZ1bGE6ZFE4RdktOXsN18XRm6eeEJV3CQrAc5XJmfRnJR15m4gxFNxD1XpvBesl8X9U+V/TjweiXLmvpPyn3XjTEO5aoNXErYyIOMyVc4ktFNuPVe0/P9cABDBACauZY9mPt8a2yqcu/0PlPUTfmIyjz+sAQgLAAzMOniYDTaJW0TbaFYnNNoViJptA3FtMTlLK1cdfnasvX5EMOvLc1SDWZTqnnU5RlNSlAmpxIhKNlkvRVWztw6NmWdcVWinr5K03rgrUZ6MBqNV1d5xGtcwGCkiX1D5j9Yl8J7TyXZMXkPXeSmvqXhvdeVa83mnSpMvvKNBJJtColAsuovx6dLi/P9oBINAAAARy6aOvy5uq3Xnl3uD05rPRsx8vrAibAEAKyg+ngBjQ05oabQDlAbQDlQxQZKAhilvgZC/r4NypMKqpQsgpRuZSqct6rc1dGIrIysc9fQm9PJeZFXVTcOolrnFyTQDaTTVRmkqTW+DacRnGQ/pfzbvLtozcA+svwSmvf+Bq486KxabiGZlwWQilinWTIzWGnJrz30Aeb7IMVDQAAAKq6OuGbVTd1+WtlM5rRg6PP5fTiMdUAiGGYDr4W0TTAlYDTE5RptACtpSsjXrlKuFnTyaK1QzHVlvvO2VSzZ1SjVcZxuFJBKcHNWEXNS7uP2s1j4myPPrxcXpuRrnjx9DNvlkmPeGk5sAUAGhrXCcNcZRlFmU1WDHRJ1Q764zoTjatmadSMC824XlZCQWVWrTrya89tDi/P9lic0AgAQadIaG1Pr8mSlXJ0eZ0+Zj3oCegBIAJnYdPGNNoYSsCaGTaiXzMpqrSiM4a5Rqkt+ccrkrp6cE592xXPPs1RZhHXPOubHqVXPPNxcYp6ptZL57ZevzelZz7cHp82u59NxtTx1wU7V04edj1IbxzY787WcnEQmNk1phvLyxS313OB7UmOOnMKSKETldsrZ0576kLy5y6dZkJ0jAJxmLXrpvz1ubfn+0iRNRJBFTRFyCJNChZ7Tr83xMvpb15fEcn6P855++AGfYAgATOD6eIBzQwbJRlLfoz7E+oSi/R8hoDy/ifdeJ5+vBKy1p+ro9xrgxGuLiwPL08Wb+jSFrmwIAAACyDGpREAeF9z432eeiBa5iaDLqD5Jk9N53PXIxrffV219r0Q1wAKAQfKPq/zE4lGzpxmnz8y9PDUWMQPXTTHUlyrDpcufXM9sMK7NHG0zr1nzpef7G988mugc8XonPI3mAOhfyehcYPrHyj6f08exOvp4J/L/p/hMevzxKPL6YmREZZmE+niGOaAbQwmr9eTYn1CUZej5AAeb8Z7byXP14+yve3MpNb8wAHj15XPXRbz9c19TQdPOAQyuBeZ0ap4xdRmDQZxPHe38B7+aANZQAAR57wX1j5fN8tzJu72/jPqFzsTWuYAAAfM/pnzWDhdnhFM3FSJ005t3TpOY+tCsFcpwVqa+k4HoMZyLN9k3je+Xn+vzzoudOadEOc9mOaAFOjz+lcc36f8x+mb8fQWKvr8/oec3cXHbykZR5fXQwiMTNKL6eNuLmmJtOUXNXbMWxPqUoT9HyAA4PB9Ntz3leGuAAHjZ+Qz1Mirm9HQ53QT6smunnAI8b5b0/ls9qIuCzlWyRFJovw3G76l8p+q3mAayJ8+OgBR4L3vBl+fR1V56dT6N5j0+sNNXKfL6YxA/n30H59HH5/WpOSutYZobuEFspKbud2E5dEZDsrtXo4d2QotjKdLpVy8/wBiThKdJX07kjgTUasl0Q0c+4ejdn148Svr15pW7dM6edBY+mAAAmdp9PENE02hptOau2Y9ifUZQn6PkAAAAAGTWj5Zz/deHx6MZKNXdHndBPq6a152IMGXsi8RdwOEd0OEu6HB839C8UvH+m/N/pAAXJ5j1Hj5fXPk9dFXYV80o9Hmzv12kNYcXyTk+r8X7SACj5j9O+WRiwX0KWxZCzpNK7OfQdTlKdRJWShPpkedBmiuqU6aJQl5/rSlHrTocoFAJp9SPPuIW1dVLsU7d/OzUas5d1eVvTlZ92HH0kA2AJnafTxDHNpjaUk5q/Xk2J9OnXZ6PkACAAGHcqARfOvo2Rr5LR1efjs+hg3J9XTW/OAxEYFpUi4qVXFJF3ivXeLXD9I+ZfTVGncnjPZeKlt9h83+gl4CcvP2q1taLDxvrfnMvT9t4b3SAFHyz6p80ji16dS1SwZrJRdhXbLXLRX0LjDphjNuCU1hcSlzqcGrpw18PqacmjHOjGZ6rZn33OTO1KW1Lflo6PK6W/DY3kmtG/LIt5V9GPcmyeiIwzDOnhGE2Mc0mTas1Z9LP0+yuz0fJAEPMbPFY9Gj3fzbpTf0MjLp5ABOD8++v+JnXymmFud/Vk1vzsTPF+Z9F5PPZ11QXUZhNSylmu7BoTf9U+T/AFm4TRYeI9x4WXk+s8Z0pfog1rIAJNR57xfS4q+k9z4D36Ayl8w+ofM4yYO1xVokIn0efuSeK+w58ejI5T6YYrdMWlT1uJLbRbCdJ9bHLn7c7UseltTz06HN6XOuYjJqNtcd+QuptYpz68nTxzg5XMrYWcvogzHrQFZmjp4W05tgTTcZNX6culPqNldno+QAJ53xPtfD8vbnnnVe69d8h+la8/UA1yIWI+c5voHhc9fpKa1xGg8P5L1vks9qIThQAgmknfnvTZ9a+SfW7kAR+C954NfPzoJfqHQ8b7K5AKWLb5OPH5ZVr6T6H89+gpITo8D77wUeax7M5RKUyEm1QMGmEZBXC6J0eV1+cWxptz26vP6HO5+ubjLHpn0Od05vnIJsAI68u3XnxW59CQzyp6/OsuzMNFdnP6TQZ7gBmaOnhkJtsRNScXLdfia/YbPld/TxfTX8zVnqfCWYc9Iwcbi3q8Z2faJ/JNWuP1JfMUfTuF45H1BfL4p9SPllad3yTzzcoNWAJGgSVtDN32D4l1LPrJ8rE+qfPuPgJwpF6/1b4r0E+tnyqZ9R+X0YlqnS09P9C+QdE+nnzJn0359z8BdSRLXSiwokXFKLihlxQF8sjOvxXAtcJY9HewZ5Z76JZpZ76dXOhnqJOdQQjTQThdeXPqtq7/IlqU+X0W0Y9TEDEGdp9PEwGxpyjTaBqUlbSSiIjCUd+eJa9cqBpHKAlhWksUdNlAopKKEEOxAxFvTZ44IAVNxEsdTJR24UABygFrpFtFOKo6qLCdNgwkQVkQibDHZdA9NX3vMS8I93afP4eq8zZUpIQmJpkrZegx6OCew5GfRyHZHHoi050bRNMBQaVWQi5xjYb8zGY9YAoAACZmPp40xtJjmgHNAC2VgCkFUZw35pOsvJJliAQQWO/OJKIkAEAVgAgCABAChNIAGrKCAAAAFizjESVU2QJRJxrB2LcA88p6zlenXnR53qTJ5zB6Q7Pzz1PkkjGSsipwC6ma6etxp8/Z6Ln85562EXnuMJ0BuVMFExUpCQcgQwiNiGCAM7R08LAbYE0wJWA0MJRNWQi1vzRAvNAXKAZQFACCYiAQTKQCACIBAAEykAgAAAABZGUKLdjIRBNikrS2+zJNKA00Tzxa9Rd5T1Zyu/o8XGWqUbIKcbIziE5xsx3bTx6HJOdW089WBNsTViBoBoFaAAEAABABZnae/GxNpiJptDTaJW0NOLikULfmQK8xBcgCIBACwBAAgAgAIasABDEQCAAhghgDCSFZFWJIEpLElEluKZSuISnW11UQlntFXVXEYWK84DQyLHJWToMePS2nOjaeejaJ0kImmIVghtAxCsQjQAAAIALKAfTxgOaBk0A2gZKDGlGcWa1KO/MlJXESSuUNIACGIhghqwTEQwQwQ0gmCGWIYIABgJyIgmAbHBIOvT1JuGC18+2SjrlnJjfTvkIVSinAAgmUpEpsZLHpQ3NpsmhjnQY5tDGkSUJsVAIAKDBDBA0Q0oAmdp9fGxOaGnNMTaYnKNDUotJWmt+ZArgBIA0QFgmCGkAAAQABMpAIAIhghgmAAKSlJmhkbhwYLVR3ZZ4nDn3lZGxqyMaZZ5bkYVfR04Ai5AAZNobMelgTbac2xOabi5uQhpuINxJZJA3FjEhgqkRcNAMSGIsocX08jaJptE02hW0TTaGmgKwWvMgVwAWACCYiAACwAAAAATSAAAIAAmCYAAWOypKQNcwLZd8rsWehOBnds65BUQmpRUbCiyOsVpmuYMWUh49DAnVg5oAmm0NMCaYhWAMQMQrEDQINAxCtADQACZxnTxgOaGCjCaGDQwmhMK1KO/OlJMIZSGIhglJAAiGCGCGIhghhEZYhghghiIYaKZVsxQ7hdPnbpuUImdpxmWxhUtkIxJRSsaIsqSlZGZOdEN59CbJpDbSGTQMExzSGCGgGCYKhiIYIYqYCbQACGFAHTyMCVg2holbRNMTViFjGcdcYgXAAgAAAmAJiJgCYJMsTAEwQxEDEAgmCYWKMleaGiVkLs6JtzaRWKAWCGiGESY1WTSTlGWe7AnVgTTAUAlAAaFbQAANAxCgCACjAAFBNAEABQ4vp5G4uVuLaYnKxCtxJZCFIyjcIRrmAIAA0AAAAAAAgmgAQAACgEjABNA00iSjeaGid1EpZFaWyMQkJgElQE2wJsYK3GU20CsTmmIViJZJFMThiFYgYgYhWIRiFYgbiEiIMQgAUsOnkAJWA0MJWAoAoBBELlILgAuQAGCoAaAAAABAyMAQAAgAAAAABZJBIRCgBEguRgrAmmwlTBtsJoYKMJoAaAIYDQwEAgwUAlYCiAAAAGAqYIAAAJgAB//xAAxEAABAwIEAwgCAwEBAQEAAAABAAIDBBEFEBIhEyAxFCIwMjM0QEEVUCMkYEIGQ3D/2gAIAQEAAQUC/wD02/yunMTZF+7d1fK/+Bv8oO0sEm4sSQigGlBnd4QczS0BwuiLFrrJ6Yb5mwWppT3Jh/yYFw6y0OC1laldDdVB78b7K63trBaQ1zdBQTAbSnvE3Fyg1D/JnomSEJzg9xQK6om5O2cTbnVDZ2x1lB5TjdALbO61LV/kBspALuAGV8rcrHacieUGx2Rerrdbgawtj/jbBOcnDY6bZaS1E52yCPI0XRyOQV7LUTlGbK/Lcf4IZdE7up7y5Qxa07+NFxKumtuqdoYx7tXIedqem9P+eRgNyrq6urq+W/6a/wAtuTn3c5xcaePWZ5GAPNzke626uVpKsUeQI5hHdMKcLZ2yBunC7SLZCy0hAW/wUTOIZ3aFqJAjQteYmKnaLonJjdiLuMYamiyJWkuMrXsQaE5rcgndLZhRvs6o3KC20lfTDZON87oFX/wIdaMhxAsE7dR2gifK5yLl9Nj7peNMZ0oNKEa0BSbK5eV1Tmr6TmckVlKWujvdC13G55wgVf8AwG+QbdHQDUua+S+UdObVEMcUHCcSBZ7U7ofKUxqDUQpU3q2ycj1OQNlcq/MEd1blug79+BcutHE87tYSnRgKPDZGH8ZGwVDwx4OovjsdS1FPfdXum9NRa7ikmosQAvrax3OQCPL9ZMNkQn+YBdChZWXT98P44Tqe5rApHWX/AJ6jDlIwvnr7ASREINenRrSiigBkCgtIIjZpJZ3ZtsrbHnHlObXWyanI5DIbHwbFdnnXZpk6GVg5LFNje4tw6qcvxdWvxdWvxdWvxdWjhlWpKWeNaHKx/QDYucXHytMhvGx0sgq2QRSVWmOKM6ZRHAnve5BbrTdaEWLhq26YN9FhcObOzVI1pvbZ3UN7pzGQDdB2yGX3svpWV00rqOayATIy91DQCBAKyxYXpHBWVk1hJpMMATGBgtzz0cMyqaR8DnNRaiFb5trJ7tRhhc99DhkVKq+UB1JTNmkrKxpmfJdTTcNxqSjOSuK5cRyDio5FZN2WwaZbgwu0+d+hpdIdK6q/dA3cNPJfk+smqyBR2KB5gEAqagkmVPTRwNAzxX2jsgFhdLoZ4UjGyMqYTDKQij8sbqxia5zpCxllglGIIXysc+2upil0wuZ3ZZNTiVut01rihTm3BIXCfbvBMNw87KSS4iYxrDPtNa0fVw/ksbvN/AtcZBX7oRyC0lb5gKiw/jsgooYVZW5MV9o7Kmi4s3iYtHeJyKKPyqc6DNJI9R91UrWGSfG5Xqnr3B7agmPUdDndxWV00FyZEVpcrkJrhcOjIqALN3Dtkx2kHU9aU43TLAb3eurCOYJrdjyAXVroRkpsTyiDG0vYTo2L2hzemH1GiCOZjgDy4r7R2WENvUck9bDCfy0S/LxJuKwkxyMkbnWDVSuRRR+VdXTW6jM5BMRQNlqRRKsuJZa3uQ4qMrwtQcmustSOxIurWcSSrIN36I7o+X/p3O07nqirKJlzpY0SvY5CR0aNU4rS15dONIaxP1sc0NUMbHPgbJwxyYr7R2WDefOpeY4HFOKumuWDyHj5zei5FH5ouFNC6N6Cibrf2YgvisnIBPyLHAxiQFlSpIgU1yutygbJytlfZXCkO5ddzhla/KM9AIbFs9xJbpTpSVqQ7pvfJpspnh6vZXu6krqinFJisc6vnintXZYL58672b0cgsI93nN6JRR+bhYHHrWQsLnRk2VCDSnVd0n8pfQuY10Za5wsGNLQOITh9G+OHEaNq70bi+OUC6C+rEIdCj0GTxsRtfuHoEeULu371iEe4nP1ZNVjZHoEUBdNIT2OacPqzTuglZKMsU9o7LBfPnX+zcjkFhHvM5vRKKKPzBKYw6RlqSldVu0QUzU9A94zG0krnksLnWZwG6WkuammErsou6lj1vonRpsRCMBEUl9SsirLZOJyFrG6tzBNGkOk1PZvIUxvcKhZqdM/U+ONz04Ix2axoKMekluowOJjw6p4JoqXs8mWKe0OWC+fOu9m5HILCPeZzekUUUfllaS80uEOKeGxQyK66rQtyt2kjiLswcuylNplHGGrU611qN2uUmkxybqyPX7Vs9kVsj15GNunNFgd90VKdLE26DbjDrOUUYdVSRMAidZE3ZRsGqrpWR04aXrCZ+HIDlintDlg3nzrvZuTsgsI95nN6RRRR+XDA+olayPD2ukkcb3Mo0HZabIi60IsBTNlYIboZu6WJc11k5ye3Scrcn2SjunDlCjGkSOJcN3N87j3smqmdZ9OxkZiETjMHBcLU8wlqEUgb2g1D6SB1LU09NomiGlqxX2hywbz513s3J2QWEe8zm9Iooo/LwaSKmgmqWPc6tIQqY5U17bvjfIHtc1QSsKc22Wm6Gyagbq24jKMKdHYb3d1eFpXTI8ltjZHI8kVy1wGkbMJucgEGposjIXKFr2OqaloRqZWrtj1TVr43xVwjkGJ09Q6NgCblivtDlg3mzrvZuRyCwj3ec3pORRR+VTwmeaqLGIPUhARkQlcFDUkOfU8YdCZNxlba+lAkLWhOuK1yL+/KbJycQQ4r6RzKurror8jdi55bFq7uYCDbJgQTXACWW7A9z3SHSj1Y0lPDmNw2CN72Z4r7R2WDebOu9m5HILCPeZzek5FH5cT9CbOQTsnDWi05NBuHWWtPHdh3W2Vi5WV23JFtTbGV5QJK1BEq6Lrq6uidrp25QXBNnNWgoQuKMZCHmb304ZhMIV7po3bFdaLl1DM90lA2COeWF8ccIc+EMap6UOdT0hNXCNLMsV9o7LBfNnXe0cjkFhHu85vSciij8odXMOqJjyezyJjWNcDGVIXBF28LblrSUwWRV1ewMgXERddaldanolXyur5XV0MogLucCXaQnS2RleVrKDw4962UbdTmSutTPgL5Wt1wtupLBM83cnZPqjbIN4o7K7GGT+R1E0cdmeK+0dlgvnzrfaPRyCwj3mc3pORRR+XFBJLGybQ2ocOGEwi7UAFshlurmz3HSSFdaldXRO11fnGW4V1K/JkL3oi2QdZslkVAd4nsp4ZZuI5lH/Vc5zXGRRSWTZSEXl6aWhSyp0scROJPTat96GUzU2WK+0OWDefOu9m5HILCPeZzekUUUflU0Dp5J6OCGnHdRN0YmuRYWFpTShlZadpO6HdSjmea2bQg1MYnt2+o3N4hboEcmlS+ayt3dOokoGxfaWOSBjo3ScMSbrSui1IOKZqKjhu6akEjp4omBsFGVT7RZYr7Q5YL58672bkcgsI95nN6JRRR+VSCGioqqs4ru0IVAuZQUyVrkYrHyppTVYK1lIdLX3KcNrcm3gMCYBfu8OXaJrrohRvc1MfrUzdLv8Ah2zWlOtpUEukMng0TGPR1ACIRTFAQDxmtHF4idURg09dwpaCds8eWK+0OWC+fOu9m5HILCPeZzeiUUUfkxAGSsqTLJffdbq61lQT7OsmlMctdlcWfJcOebk3RyvlbwAVENRkcGNfMZGs2Lo9QMZY9p3qetu687r6Is1vmlbZFMy+rKyYpH2DYqiVCmmjUkb9WBM0UOWK+0OWC+fOu9m5OyCwj3mc3pFFFH5LDZzleyZSyOZFhriyoonMkkjLFeyEm7XXQu1attSdfIlHrmArcwya/SKjU9QN7rotLmQ64qncgXc86nu7rczvlJZ7OEr2cXLUtSuta8x4zo1+ReRBi7WtppRMzLFfaOywXz513s3J2QWEe8zl9JyKPyh1fs6HTxzU1MrCawqSkdI6SlmcuySgcN+prbAInMo8w5DyBpco3lg1hPmdanq3RGV2tOkCaLB5ueVm9MCpG7k7ak05EFaSuE9dmkKjwyfXGM8V9ocsF82dd7NydkFhHvM5fScij8qFhkkbhkFMKaGAtqJgXGeILtIJc3Z/XZWW+XRE3y+lbdHwmHuuBuLIpzNxG4rSxie8u56feA7G2x3RGTXEISpkwTatqmqtRw/EDennilV1dYr7Q5YL5s672b0cmrCPeZzekUUUfk4TK2CeorGymWvsx8upCVjV2py4jnJuTsgUXXV9+Tpm4pvIcnHZklkJ1x06clCUhGRx8GH0nec7pwRyvlfK6jcbueRJDXTRoYtUhOxE1MTtj94Oe9JVwxKCrinKrvZuRyCwn3ec3olFFH5LJC2MylFxV0EAmtQV1qV1dXyvzX8A+M1pJh3icO63ysbdzYmqanAY9pBaC4/bAx5rI2Rvvl0QV7IvLmxSmxmTHbxyuam4lBonlZPSuRyasJae1DOb0Siij8mP1J49EoCDbprU3K6urq/h35z08NrC5BgBhcoQ38WPRYhsRI5CcqQgBrrZNNlI8vdm1dUBm1xCbfSyxDCWo6HKGg4w/DOTcIKp6VlO22dRtA5FFH5N7KqF5GUr3jh2QjC0LStK0Kytnbx/rwQLqOO7Y5XB01gy9jTv/jjb/D0JOxKe7K3MEF0QRVkBuQhsmvQddRSliixSK3LiL9NIUUUflUNKJ21c7YxUAE2QCLRewsQtKsEdPMee/IEWIxkLSrcoj3nZw3l2zyvM1MdpdG7+BDo56dbIeV3KArcmkIhoTyFdak16ZJdNkuqWcTM5MUm1yuRRR+U2TstFNM5z+LdB6bKi9agr3LiC3Urq6urolXyvyX5gEzZOOZWhBoTD3zJeWUOkA6Ns5FpZkVTyAB+xapMom3L3hbuIjRamsWnO110Wpa9i5E8gco3akGHg0VU18F8q2tEQcUfmReeeoLiTvqNroP24i4m4dch11qyurq6urq6v4AQTVfY5BRAGRrnvlkka0k2Tnb3V9wwuQcQnAFdUWoPITZApiCgzYu2axaNIdcqKPUtkcupTkfABTQHJ7W6cNrnimqcQmKMiL1qV/lk6Q9299/8Ao5X3ur2V1dXV1dX8MBAIBNaijkxhcixkcbic7ItNrINTr2cQguisCtKsrEoCyvpQutIs42afKEeoGX1ZpTudg1JlMVNp0slNheSN7CB8wdXnK/J9fBAQCsmi+X2VZQN4Ub3hzvvQFcWc8KyHQXCvqGkFOhRa9qDyi9DdXQ7xjYg258z5l5idggroyWTnuPhNWpRShQyaoZI9Jt8xydv8YBAIBAXAFgSjlTx631MiOyZuh5SbIoGx+rkgbBrkSrpwaVZqL7K5cmNsGhOTdgdyRZO3IpncNw0loWnfSiAjbnC0kqzQtbUx9hTQR1eGTwvgkPzHDOysrK3wAm5AXX0igm/xQSuuSUCrp25Y7SiAVdC6+vu6BTjs55KDSSxoaB3QMn9GCw8xMbr9o0N0te4xWa56L+ZrLrhi3cC4iLiVZdE0ajTSmFStir4qmnfTyH5RysFbPSrfAC0pjbi9lpspLXUY1OqZETkDuD3i3JpITdS6IlWVl0XVAICwiAVy5w2DU7clQP0S6XvMEZlfCzvPdZnPcq55LoKE9+ncE1jrEx1UVZSvppD8uysrchbdEW59KsrZWQVkAguqu5DuI5Q91Sm7j0+smO2LboDYWybu4uV8g1BBSPuozt5jdBOO31V+vTR65WEax30fEOQGlRvsaSoapIg9o78VZTOp5f0JF05tjmE0KysrLSrK2Q3yahsuiOTjaN24G6GbUOlwg9OfcNRyGXQOddAXV7CLYZOyntx7tCe/TFCf5L8zG6lw05tuWPY6ldMlsqGuuZDZSRR1VPNE6KT9C6AGifERkAmgJgQYiwLStKLFpVsuq3KI0tRQG7t4x1c3SjyazZWRQ2GQF15U510BdeUNFyronIrU1wjY6OSRhkT3gM5olZFOby3V1dMcqOsu2lcNWI0xlYR+ho2asOrGgDTc8OyAQTLNV8+icvtBBbBHK9jK9rAXOcu8F0Vr8nQL7zujugF0Q3c2zV0AV8iUUJDGpZi9vJ1zhzKLAg0BFvK1M2NFUWeSsSh4NT+gh/joqokgWB2LdxkHAJryVqurhX2dfk6q6civtjS5WQRRHiXQ3TWaRdatRyvkF1JPJZHODksrKyIWhEWyYmpjrOoZdcWKxf1z+gd3KQPOt+q8hdocgcrnK6bdO2yIshyMF3tjsHN4cTnDVq3LlfxGturtaXyEqOOSVR4dVlOwuqYzNx25AgLZlQ+BZFt1ZDZNOWGz2dUNEsJ/QP8ATm2kfKSHOcSVsgguqvvdDl+yoma3VZsZXulPRHxcOw5lXF+IptNbRyUjqeF081NAylhV1i1Gwxcl8gtgnZO6/cfTwSO9MgrqB+l1JLrjrWcOq+c3rUvjcJtbldwGrkBIGXRXvnZXy6pn8cUr9RJ5yLeBSVD6aWlq46pmKt1Yfg79OIBVssvasBeb1Q10vOBoCb1TUzp4IU3lGTVQTELGG/zfOb5qjVwW7tKOYQy2V783VQx6nTvu1xV+YBHp4GAyWfM0yx0z+HUWWMs0YhgbrVhsnjS7kCYnO1EL/j/kJnTwn+QZwvsMQHEoz86P1CEXODp22ktkEFsrq6HOyK1PIH3KtygZnrz4dJw6oSlVTeHURP1w4609poX6ax7nlVbdNSraRkxt092X09Hr9ReXwj5UMmKA8Si+czzOu50gBTwiBndA+AE0an1muNFPsU5vIOQjwGGzoqcEY3GGVuFWdh//AKQbxHTK2ILGGWrwE43KaLpzrBNG43P3/wBHyQ+Xwz1GTVh79phaX5p2T3hPdcatj4gWExg1FXU8SQtaU8FGyPgHkCOdI/8Aqf8AoPdYVMfx2MsJpmNTbmPGWfzvdk0XRIaEN04o7AIKRReXw39V9BUZs6r9f5hIa0EvLn94uOnonWVlZDmvkENTny/1YHbN1pzk7fO2/KeT6yAusPcDQY/uMHqmRgMuhYE2CxSr48qDbnZoO5V9IYN73P8AyxP6xdPDf0ah0Cpj3631Pk3TTc9XSHUYgtV0TfIq+V1dX5qWlkqE1jKcyucUXZE5BDwzkNyTpVFXxxU2IV8VTANzFik8EQxSrJnrZ3M65eUONyMz3WhOTeh6xdPEIsmqyi89X1+QShumGycbAdRs1np32POMwmYZInyjRI4JxTig27XZnwHclrom2YF15V1Q2R3PRMFmudfMBDcu6jL/AIUfTxHDZiddM81V6fxycwndRlGe5dFHwaCEyTUkzOHPMZHmLjhtAx4npwFE6wkFzbwncl7DMmwQ2RKCY26e+/KO6zIJ/VM6eJ1EQ3lKb1m3p/jE8gRCsiNuhVlZaVZWVlZAKypmsMrI7tqv4zBKtSp3cVlUx0TmRNLZ2aA8b6VbwHBWVlawsrcgRyaNRkdtyMFy83K+m5BR9PECb1PVvUd6k8eyEblw3LhuRjci0o52QYuE5cJy4LkYnLhOXDcmschG5cMoxFcJy4Tlw3LhOXDcoKR7m0b3BVMadTFp76pA5xrzIQ24Fi4GI34RRiKcxytyhcMkCJy4RRjcuE5cJydG4I8jRqKbRVLl+PqV2Gdfj6kp1FUsTu7n1K0utpKjBWkrSVpK0laStJWkrSVpKsVpKsmi7qbBoAhQUrV2KnKkw6nMXihNQCb5c8fF43BFAJrVhNBq5bqsreLL9+LUF7KvmqouPTPbZOyCatKw6LgUfNVt/suGUdFZpnp4U7EKkh0j35hCV0QbiFSBxqeZPpdTAsP98+uq9X5CsTK2qK7bUrttSu21K7bUrttSu21K7dUrttSu21K7ZUrttSnzSTUI2TSCMmuF6lnDn8QJqah0zxz03qyDVhlDxzy4jW8RQn+Y9fFmf/aPPisPDqnhFBNWHw8ap56v3DwgBRKSQk8vQZHYR6muGmuNALYhJ6iZ4jPYKjuaVXKCxqPRXeK1NTfLnjnpkLSsOojUva0NbyYnX8RalAf5j18WqP8Aa58ai1QyIoJiwOLu89UP7EIEEchytmBdWDQUBdHuobo7BQ/z1L/UTPEb7BUu1LdbrUVjrA6n8Vqam+XPGvTIVHSOqZI42xM5MTxDWnPWpQeqeubnsauNEuPCu0QrjwrtEK7RCu0QrjwrjRKdwNVzzR8WKZtiQgEwKji4NNzfdUf56/uyOQ2V8o6W0ZlpYx2piD6WRTw8OMAlHujqhucD71U+gqtRoKtNoKtdhql2GqXYaldhql2GqXYapSUs8TeR3coVTn+uamBq7ZSoyQvWKEtpfFam9G+XPGPTgp3TyQxNhj5MUxDWnuRKaqf1T1zxw/2HORctS1LWtS1ISIOTT4OMRaKtwQCw2HjVed+VjA/Eah+uRFWVFG0yzzOkemhPdZYfdzi4Adcm7NofUF7Jmd84Y3SvqJQRnTRcV9RKZZQC4yM3+rbuY1qkZpj8Vqb0b5c8QjdKqeFsEfJilfqTinFBBU3q/eePe4IRatK0rStKsrIJnKyS1dnjMWuncEAsDiszN8t8Qz+2yNixDh06dFSrgUqEVKnOghp0xl09yijfK82ooshuSVR7RX3d1byxsMj53tiZnGwyPqHtYxU8Yihmcgj1hDZA+HXReK1N6M8ngVcb5KeQEF6KCCpvV+86ijhqHfi6VfiaRfiKRfiKRfiKRfiaRfiKRfiKRV9OyCpa3fkrJOHiAIIykYJI5GFrrKmi4NPkSAKF5lxHkq/cPIAyvpXVBtlHTTStEdLEpK1+nPyhoL3VJETAUBqaOQXKf/UZyH+pEo2mR87gX6UWpzVCSyWmmLXTt0S+I1N6M8ng4zSbPCIyaqf1T18TFvejlxP3mGSa6fPFItNRQQ8SqzxSXh0uFn+7yVvuHZWsmsc9wpWwrtUcSmnfM6+QbdWutmqGKSofdlK1ya26Gyb1zZ/Uj5KcCCN7i9ypBobxAgnorbghVfqeI1N6M8ngndYnR9mmcMmqm9X78TFvet5cU97hkuipzxGPXT4XHZmeLS66jCfe8lZ7ktR2UdMAx9YWtvla6Eas1qvqUUE064VNCpKh0jCU0b20GXzszpmNa2SR0j86aISGeUzSZOnNg7vtk2Ju4hBreFGbGsZ3PEam9I/Jyx1cUk/JVQNqYaiF0UlkFT+t95lzWriMXFjXFjXFjXFjXFjXFjXFjWKvBrWnfkxX3rSoJOLDkRcRM4ceUrxHHI/UcH97yVdu0PcmMbTxzTPlerLSrWUVNNKuzwsQlijU00k6JWklN0hObZM7yl6Myp4nTS1Mokdm1pc6rIjGbgrd+JqKce/BbVBM1MnJi8RqHSP0+TEK66a/S6kqBUQ8mLUfaIiMqf1vvPHT/ZLk5y1LUtS1LUgUCmnfkxf3t1g0t282NTaIbrCPeZ/dZ7imjapnvmk0LYLcoUrYl2mONSTyzG61OOQcQuICtMTk2yd3F6jG5e3pOSm/hh5LLSm+V5KuSWuOqM7wDbwwmodI/TzxaV0dO4rWqGqNNM0hzeTGKPhvIUHrnrnj/uXFHO6uroFNTOvJjHvbqgm4NTzYpNxaq6wU3ruSqb/ZrjwkSc45eFIcSnK7fOu31CFfULt9Qu31C/ITrt8y/IzqKpdPC1/fP8b1SRcaaom482bQSa02fyGU3vswEqRqt/J9Nb/HCfFah0j9PPG/ReVdBywWr5XsbIyspjTTQj+Y9c//AEHuSjzBNTOXGffIFYfNx6TkrJeDTSFXWB+/5AAcTlkL3FxysVoVhnurHLZEZUI/jIsmHXGof46PkobCU78vZrwHrGnnc+ptpPCDIifFah0j9PPHPQenIFMfZYdViqg5K2mFTCwFtQeueP8AuXI8wTUzlxr3pKusAm7/ACY7MnoLBPfcn/3kG9gr2WtxVstldXV1fLotiqMWjsSh3SqnuU/Izu0HKKnTCmJ799V3u8jTceKF9R+nnjptA8p2QKoap1NPG9sjOSvpdUh65/8AoT/aKPOE08uNu/vkq6o5+BOOSuqOPOUCsEdevz+xqfUOpKldiqF2KddlqF2WpXZKhdkqF2SpXZKldkqV2SpXZKhdlql2WoVPDLHEDu4ZV8E7qjslQuy1C7LULstQqhro6TnYiLuce8LlAePdNragIV9Qu3VC/IVKnqppgTyXUVXPE0V9Su31C7fULt9QjX1K7fUrt1Su31SNfVKaaSZ3ggoVtQu2zrtk6dWVCkkc92QKbVTACrmXa5k6snKcdjvlGXMcKmZCqmRqp0aqdau8ZSuKVxnLjPXEkWt64r1xJFxZFxpFxZFxXriShcZ6MjiALoC2QkeuI9cR64j1xHIuLvAjtpJ3aLkD4V1dXR57q6urq6urq/jXV1flurq6BTkcgta1lajyEq2VLhjJIKrDY4YuS3LZNv47Oj4C0Nbb4TYnOj5WML3yxuik56enkqHuaWu52W14kylY/wABlLLJBzggJgMj5YjDJqW5WnLSrIuW5XAc2OyAJdQ0wpocQqTVz0+HwxRzUUEynoRAXC3JqysmgLD6eKSLskCq4mMkR8Pc/DEjgzla4tdJI6R/PDPJA8kk/BZUzMh59mhry10j3SvV1uV5VqV00JrE5zrLCaTSMWquG3CaXSMQq+zxUFRLFNXP10zs75DZdU02VJWiBn5NqqKgSvv/AIhiJvyWROYCjbZOKusOpeO6qqRTQ0UBq5pZWwRzyOmkwyn4TMUqdDL5XXXNo/yACJ5AmBFyOUU0kRqJ5Kh2DSdzFYpJm4bT8R9XOKeJzi5y6I5XGQ/Tn9KEV1WwRN+WNup3QOOZaRkx7mOoa0TKQhjaqczyctkB/jRkTzMF3eUOdmw6XO0vRaW57rdXKutSur/qj+lJVuSyOTQGNceYEhPtc8tlZW/VH9UTlSQbP0IxtKMR5r7fsT+kGduSlg1qSRXQQT2gp7C39sf0h2zvnBFxXvdpF75BBE5Pb+1P6Ngu6Q6n8gFywCGNzr8hKJzeP2h/RtHdd5eSkjsJX3KGZzuijyj9cf0bPK/kjbqc92lvLflP+W+ndM6YBrXm5yGRP+dPJqsEcgiVdX/cn9FfbNvW6GZ8Mf5dvVrb5konwrf5hnW6urq/+fPIP9GeQfs//8QALREAAQMCBQQCAgIDAQEAAAAAAQACEQMQBBIgITEwMkBBE1EiMxRhQlBxUoH/2gAIAQMBAT8B/wBnI6rq0GEHyvk/tPeT2rfmU2sRsU2t+UFSvlavmkwPNLurUcQNkXZuVNs28qUN1wi6QhvymZWr5mptQO40QoUeFCKO/VlPqNR6Mof2s0cJlTbdB4KlBwPiE9apWDdgs7nlGGhEppgo76zYJ0oIU3JtLL4Zd1qridgviAEuRMIlAJrVCMWhZbNTxvedos1xCY8HwZ8DhVXxwiCd0AEd0NkShY82NpuFyv6s2eQmPnY9YnwXk8KW0+dyjLig1ALKsqy3KA0NE2Bu0ws2fcIaKlUUxuv5h+lSqfI2bPqhnKOMPoL+Y9fzH/SGMd7CZiGvU+BVqRsFlyjM7lM+yvcovKzFDMUMwQIKIUIjoBTITE15neznNaJKqYr/AMounm2F7ETAT3l5k6qT8zZ65QZvmKe/MUDspRX/AFNKzBQCovGlpu0LMAvmdP4o1nHhGqXNylG+G7FW7DYCdkMKz2v4rFVp5HRbC8HwK3bAUQgJWWEWoqF/1A6SjoCJCnRygiLYbsVf9ZszuCFsV32wvvwK7tk1hKAhcorKgP6WVZbHQdAuOUBJ3QahEIbbrkWw3Yq/6zZncELYrvthffgO/J39KQoXFoQsUUdJF/VwEGqI5Qc0Iw7hcWw3Yq/6zZncELYrvthfaHWcYC+ROcfSa9wWaQgblRoNoRCgqIRsAgLGZRBK+MgbI2w3Yq/6zZncELYrvthffgPYGuhbBAyhT/tQpUqVKJRKlSggiYUkqUUOV2pwjdNIQ2W3KztbyqkHcWwvYq/6zZncELYrvthffXqvyBT7KlR9IOU6ou0KNkT7TXSnBGzHAon0oW6CdCd/VsN2Kv8ArNmdwQtiu+2F99fEchQoCmFModELMSYTWelGVFGzQgI5QK2RKaGf5KoB6thuxV/1mzO4IWxXfbC++vXEuATaYJhFlMekWs+lEdIboTwpKJJTjdoR3RQctioaiLYbsVf9ZszuCFsV32wvvr1XBr918y+QlC86DondfIVmKm4CO2yCySi3LaFKzJtbJwn1w9kKAmj8ghbE99sL76+JEoNQbGuVOg6eEX/SZzcu6AKFZ32jiKiLidzbCj8Z6+I4QKzaZRKlSpU2AWUKLSjbhciUTsuSnLKYlBuqV3KE1pcYCptyiOvVq5ipWZZlmWZZlKlToAudlOrMeFKp0/tZfZR+rDUDHKoFh2HXPCfsenCDbwnunoNCYz8d1UEM/soiBvyiCNyo2RGpj8qp1Q7br1aUr4CvgTqTm9ADQ8wOiwbSgFGZ2ZVJecoTGOqkNVWGnI3WAjzKpVs2x56+VQoVXDh245REbGwCyrKoQuFUMnoBUnQcxVM7T9p2wVYcKh+MH/6U4+7taXGAnUnt3N2qbUaucQefCrd5QCAUWjRwj0Wfkd+EHKZVZCpkpmnow/7AnMVTD7/ijRcBNpTSgS0yE1wcJ8F+5KhSp1PREdACVnA4TXxyVKJ+0dGG/YLESiwJ9AFVaeQptsK6Wx4JWaw1OOiNcbSmFOdpwvfpxDJavdsOYf4B4RRQQ0tYX8J7SObgSoEQuNXqwbOnC9+lwkJwg2aYIPgPeGtkoo62VCwrOCE9g5ChARZ496gJ2TBJT3f4jThf2asSyHTYJhlvVkBOxA9J7y90nRKm4COyzKULnVHpdm3tAacP+zVWZmahal2jqPqBqc4u5ROyC9awNtk5pRGyGl3Olpy7pqefQ04f9gQ0lPEOItQP49KUXEoqEbTYi8qZWeEXS3W7nTyicuw1Ue8IKdOJ2dKzLDOkHoG9PtUJ7vVw3oO40Dr0e8INb9LK36WRv0sjfpZG/Sc0D0sYOLYUw6Ogb0+1VHxsLtb9o9A6BZx6tPvCD2rO37Wdv2gQbOWM4FqPeNA0G4flbdrfZ0jjS7QLHq0+8IWJ9BDaw3/JYh2YwoVPZ09Ao6QZ0ypKlSgjYeDT7gmrNCAi3cnuyiVzdhkayjciLNMdEI2CPWhQqfegU37Nj9BRCxM5U2VNsO6W6yjakz/Iqo2btPrQONJ8GVKp9y5MIWb92xPATRNJG2F7egbU+xFVG+7gzccaT4dPlM+01O4i9ZshARTUrkwFRZkEdA4Y/a/jH7QbkbCNvjWRZSFkWXpx1qaaHIZkAZ30VO1cmAqNLLz03f6BmwTXzsghoeJEKlRymeo7zxug1NYAhqjplO8kiOdVNvtBBDwXcI+Q0wZRe1/ITm5dDGygEEEPBdwj4J0NCyhFg9KIsd7tbKAUIIeE7hHwTcBC5EoiLtbKA0Dwjwj4JG1wNJtCaI8g+CTtYDROhgQHkO8MasqyJo8l3gxYaQPMPhHy/wD/xAAnEQACAQQCAwADAAIDAAAAAAAAARECEDAxEiAhQFATQVFgYSIycf/aAAgBAgEBPwH/AACLQKLcTjaDj8pERePEW1ZKzII+QkLHBBHxFTJCQpqIH5F4wsVpQ38FbJP+zEhjdlaSbMofjq0NfCp/5CheLaN2eVjXwIk0SSScibofRvqzXVKT8ZUoslJ+M/Gj8aPxodMejT5Jnwir/VlSQjweGRArLExq0SKj+kWr3ZKO1Sh59n6gSjq0QTBN56u7duP9FScY89K9lO782c2UubV+gibSJiJP/BrqhY2J2r2U7s9Xo1av0KUNpD82RIzkcrLA7vQ/C8DY5kfk07V7Kd2er0atX6D0QTdMdlZdU+zY6rQ2LxevZTuz1ejVq/Q4iSHSmQPHJKsrMbsoFCOcsVq9lO7O9GrV+gm4PLIg59IIIIIs7JSQkQIZsTGh+T/Rxb0UTp2r2U7s70atXnSm0WaxNk+RIagV6qWJE3UitXsp3Z3o1avPSTByN42QkpKqv2TIr1DckWR5/RTavZTuz1ejVq89I2SyWTkhCSQr1GhDpPJNQrV7Kd2d6NWrzqWcDjkg4kd+QnPXjIqYdnejVq89LJJyLtBVdU4eKOKvXnptGSSSbR004INCJxNwNznVNoIIIIII6t3XfjZvHVPoLHI30WFsW7Jp4GhrOmcjkcsD6U4XdeDxSL+927NZ5uqou2SST1pwv+DEUlXkV24FUneq7UelSSN+i70kS56VaJFWcrQM36kEdqcUEd69XkVRS5Hav0owLI+1eutLu9ekhj66F6Veuy9JKRYk+i7sS6167U+iqRKMExaMm+1euyedIiMTYmhPzlXWrXf9WeOMkSR57rJVrvSQVKMb3ZK84F6dWiSSSSbUWr1jexK7eFem9EEEdKLPHEu7eJdlleu9Nn7C9N666+e9dqR3eKpid37j6O1J+xWq3ie7L3mPqrRZvBzOZu8kkkk+y8NTnGvgMa7t/Nb+k/nRBPR/LbJFUT1n5b6p/PfVfOeB+yvan2l/kP8A/8QARhAAAQIDBAYGBwYEBQUBAQAAAQACESExAxASICIwMkFRcTNAYXKRkgQTNFKBobEjQlBigtFgk8HhFCRDc6Jwo7Lw8VOA/9oACAEBAAY/Av8ArbO6WJTl/ClLqKioqKioqLthdJRgoiiqsZIa1RDowqprRkNTAUupfRUVFRUVFRUVFS6ioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipdTrVVCKjC+qEVwurdMTUpG4qeH9keN8/wCFuxUAycckkBOI3qou7L5ZOK4fwRTPS+R1Ms8rpX6V0pqmWioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXUVFTrVVBq0pZI6uer3/AMDVujG6EUezesNmyDveNchtPL+6r1OSpqa/gdeuUWzFdiJO9QHzoAsFkdAfM5AN90FS6EOoxBiqZKain43gbCEarCN6moBMYN4xEqJkL8agJxUKm8ACZWFynqYqV/b/AAVDFBQJUlJYzDG7Z7FVcbsbtn6qAEAFEGa7b4gqeUCMVLLoibbo6uuaqrdVVzVVbqqqqq5Kqt1fwWEIxQafioinZeCYTMAF6saVqRpHgpjDfKKkuKJVVu/heS/MVJTUBVMa6AtLT/iorCNx41UdyjFSCpfAOkarFDkjxKjA3RMdfHNL8drdGRcb5I+l21G7Efqg+zaAQNsoN9Y9z+ckYNChhOo4qaHbx3IxPPsRGSWY5Y6iqqqqqqqqqrf0b/KuitPKovY5o7Rmg0EnsC6I/GS2P+QWx/yC6P8A5BbH/ILo/mFp2bh8M9bq31Vb6qvUaLgFG5rRVxgE2w9FabUNli+6FG1iSf8A2i9Y4OJfxX2gxP8Ad3BRJhdSGcGi4n5ogxBEiuDuCpfHNpGe6Sh1Kiog1rYkrG+BtP8Axv8A1BUuopBYvSK+6FBgDR2ajZwu4haQiNxVPwCdwaBicZABNdbwtLY+AUpwlFest3GHBCybANG9Y3TJqoQWyuF0jdAm/wDuqzPYsXDtQjvNV3pTp2Iit0OOthxUdZE6DeJULMczvOT9QyC2cNJ2z2DVlrxEFFh6/iIibpr/ABNoNN+z2BBh3g0WC0iBvT8Iq+XJG04FHDIVySVVIrSA+KkSolSuwt3iBQc49pUGt5xVLnQ+W5SVNZDVesNphb2BaLYniZ5v1C9jOJ1otN7TDrxdCe4KF2O32Gzh73YoWWgjj4bk8aILpucVX+6nqIwitg4uxyjCfEKdx3uKAJJ4KvjuVVAhYdxKJouWokZ59FQFSolpK2pIKG+4MlU71tDlm/ULyfdblwklzuAXRv8Akujf8lNjwsTDEZLUflvoqKioqX0VOp1ugFAbtTJDTaIqTsS0m31UrwoQUgohUmoFcOzWyElOaMcYd7q0XHk64ucQOSwjdvUQ481hLvBTtHfBD1PpGB35kMb8Z4g5f1C+05DJaPFQFW6qqnMjJwjkf3T+ASqjjkb8IWCUuOaBBWjELDbNj271isTEKdckrhdMret0vndHVCEUCB5lCMfgsTvBcBdGE1pG9sBCAgpKK0RiZwKwkFj+ByfqF9ryGS17uUd05H90/gDrR1GIutzB5+6K/FSUk61e2D4QZ2dqiTFBjYDtUSoETUSm2kBMmqq6JlWqxWpON9YzWJuEQldpaL+IU7t+phqeSl9mFLeoV43xUXb800HNMnUKjasi0yxcFFjo3/qF9ryGS17uUd05H90/gEoLZL3e84rRbhaKuNAsNiMTt7zvU76oEkGAgj604ULM2uJonCCi12HktIl3MrogSvWSZyUYeCi10QaKaJ+gUzG6ZhmmNTp0+qlJR4XF10HbImUSKKQu7VO4kf8AxOsviOaLLSBs3yc0ousTGydOHC/9QvteQyWvdyjunI/un8Ag0RO6C/zOJnYFgZhYwUARnmmFJ0FUqZKooFdq+aiVKIJG43xOampi6pop71DioJrG0rHjcYcEUQawRFANyMQKeCLTPgqKL3O0qw3IWtk4FzTB0DVeto2MyNxXqrd5bvANDyv/AFC+15DJa93KO6cj+6clFRUVOsCzshFxWGx0rbe8qbipqGaBVMtFG6MBEXUy87t09RH57kZ143ceeTmpioTiIkIkfFRaoxgpwgg6znDhuTGlrLVz5FuGnxVpY2zTgdo/svVWln6xjdKyfvb2KF36hfa8hkte7lHdOR/dPX7S2f0hpyUcJxb1sjwWk3CeIUrQKLYP5XYXjJAqQv8A3VI3w3oQ1c55YboxR3lR7VHJBbua0if0yUSa8VBsXu+QX7qYCiwwXrBYsBTdEh9DHgqX/qF9pyGS17uUd05H909ebZt37+CLbHZZo87plSurArTmeKiCgeOQQvIIFwkq07UCQpu7YX01oEhFHLC8hAOOiFhYFCLXd2d0ghjlioibUPhQHtyfqF9ryGS17t9Lh3Tkf3Tlp1l5FcKMZg1URTJK9o3gZIKAmo7lEAdsVFrvgVJ3wUMMzklqI0yzkjHfSKMDLUQooNavtXk8qL1bW4IUghGOFNFjZwPEprLUw91w+i0dFoNY/JAcL/1C+15DJa93KO6cj+6evwAioBpXZxUzErSAUmCHYLokKeSRojCfZdX4XkzgL5aid8gpm4R8VAbXG/s3o4LFuAflitJkOKjZUuqo8CgGuwrC+a0WhRfMowwhSdiCOKzItSIR45P1C+15DJa93KO6cj+6eu0VE99nL1favVh5PE8U1rQo6icWqP1XDl1SQvjvpee1pCtIzBkILRYGgcEHg6UMXPJVaTjyUlo1WmMWFfZtFnyQONw7VZ2hbhxCl/6hfa8hkte7fRUQ7pyP7pyUVFRUVFRUVFRU6jhaYDeeCH2lqZ7PEr7JjWD5+K0prRkVOS35eSmpaQ7eo0u0xJSALeOWW66KEDCOk3+oXq7CDRAYpIsdPDotcM8eCiSQtFs0xj3OZHSjx7Ewdl/6hfa8hkte7lHdOR/dPXg+223TgmisK3TCksNp4qV1b4qACn8tfOiii7gjdIr7TxUEULogXFpAc07isIBY76KdqXu3TzyXAcUfVebeUC7SaOKJZQG/9QvteQyWvdyjunI/unrrYqJPLNhcpXxU4qSgGj4Lnrp0Ci7wWEXwO64ckBknv1cmOIWl6PH4oN9S4HegTV5jf+oX2vIZLXu5R3Tkf3Tkp1oXYoGCBMkGbzliLqlSl1EHdduURUKJrf2nJO4HUTWgVAkpoe2JZQr1gbhDp3/qF9ryGS17uUd05H905K316uW8CmY9mM1D0f0YWbOL1pelYe61B7/SXl24lTt480Q4U4KGE31+F8+odik1bIHJaKi9wHJQZJYjnbdLURwphezRJyfqF9ryGS17uUd05H909daxjYuJksVvC0tHcaL1uAQ+7H6qGKDVLS5oQbCFIKS0rSPJaIv7ep9l1FK6ZidRDtOpotGSc21JIPyX2b2uv/UL7XkMlr3co7pyP7p66bV04CCMVgZQKq4rRUzq566msPY4IqWqxNUrRxbzopWke8F6u1Ab2hQjO605Badq0KFm+d1r3co7pyP7p669oaDGf4VLerXgIIHsvjD4IlgU1AXTEE0MjsxzQO5QdAohsYHwQbuTy12F24ppLjE8ArQWboktpljuDTkf3T1yibzRH4PIIxnhmU8msE0cXElEKF8CSF2nJE6mRRw1Updl0xPsWjatjwgulZ4KdqPBQZvqeOS0P5TfRUup1Gt1VVVVVGKJ4okCS35d3XyROC0t25OLfvwRRYnZJdTjGiAtTA0jCWZ35tG6qqqqqrdVVVVVVVeote6kF6pnyQu7MlFOXW24gZ7kGGigtL4FQPjdFWgF8+oSyTWGAh2qRmKwy+rFGfXrzLOroTUpBRXauK/quKlFSU4dTll4BSDnFYWQjvPBYm7qKMFxuiKKVLi12/NLqU0TZudZuEwQYJgfatNrDSnvvLLMxf8A+PXKqqbzUzFSRvHV/wC18kMUwoBQsgCfeWiT2qRKmqLQKg8QUWyIvhdIrEaKDaKaifBcl2dQ0nFSoW/MIB+nCkSsPR9gz1VVW+qrfXXydTrn9lO/RESeCcJR95QFMm5TkViumILcVPJ2XQ3rF5QhFc9fUBTe3xUIwlBQstEDearSdj4RQP3TQ9enuop3T6xBVn+VRF+M1d8goARUckslFK6gVL4NXElTuE80lPVTU6KAKcw0mt8DMcuuxjPrW8qkF2cL50qUcsQpqWaakFK7Dv33zu53RkHRoSoXU1mkVotus7N0ngRB4I2doIEXVVVVVVVVVVVXqVOsyCi6faol0lHhvv708kRfG85JqF3ap1OSN0mk/BYMRdD3Kf3URbNn70itFwdxgKXSzzukMgahBYXyeNl3BYLRvI8bqKioqKioqfhmi1RHyWIkN7TU/Bb/ANV0Ms1LLBTyxWJ9FHKN24lFj3HE00JWEQoTNFWnKHz18bsTCvV24+PBYX0NHcfxOg5BSMOwFSgzthpKXzuLvgjnleTkndOigKZ3fD6KJdhhvRgYp7fynXQF8CotqvU+kti3isJMWnZdx63TPTWzuhAKsFRbhHit/wAbodqiiM3BbSlq43xRc7ZdNEbSaCJtEFi92eujfVQcsTUWukN35Six4g4XUVOv+thMPgpZf73V8M/HkpwHYTNRDTPipoJqmohRGSF8NRK6Ay4LSPYeCBq00cKKDV6uzpvd72c3y1OB6w8VETfZiXaOu1yuafvRTREHnGKgJ31UvpNThFTvjfJV+C/upwj2BcECsImQp3y1/ap5tE/3UAMLeA1BzSzRCGJYxzRw7D9Jv4DZOiYGsEZsaOE53SEeJN0ypAKAETugtKAj8St6/dTybyvuwW8XclGEVK+Wunv6idc2aj7hiOXWqZqJmKODDAkCMFuPNTbCKGesIZeN0guxRNS7CsIkAotiqKYPjroXfZsc7kIroH/GSLy0GG4GJ1UTq6Z8JThxH4CC00GyJwRMIKEVE/NVvlVVVBm4qde25o3VKae2K05Dhr8ZtSIGEAFAutD2xWlNpo7im2bKuQs7OgqeN7/SG6LxMw36iUyoa8ZArQdsfwCD3QcNkgqLnTopZed/7ZJXSujx6j6yzPMcVis4yqCrXs0kz80W3WrX2jjBx3q1ZGUirVvFh1ET1AZG80143jrFFRUVFS8SWi7Ex3AJzTDSoVTWUumiTJoUupWrOIBT2xq0hWbvdcDdafmg5Q95hUEW8DDNG+PHJTXFNfw6+2tdyjZti8/LkvuNJ4I4abteDEgma4qal1BvbK57e1MdxaCmOO9isz2wUlaDtyzUBS6HFQ4IDqJWA8OvjmnYjhMaIVae0SUdrXNliiaKFozB9LpqV1NcDwQO4zX6ArB35VYkdoTTwNx7QCo5IC7sWLqhCcO3rFLqKl1FRaQJHBABzjxjRTGu9a/Zsp/FE7lLR5Kc+Skeo2J/IEw8WJjRUEhBx3OubGRgFZni1QvldALCFDqp67E/BToFGnJRxaRlSGuDGDE4yATbBrhGrjxPVbE/lgrF47QjYvOEuMQTRaU+agIBRJgAtHZEhdAL/wBnfKt0eqBA9nWqqShuu5KIU/gNaS3RYKuK+yji941UzmjroBeqtQ8wjRCzZZuEDGJN3qwQ+FMQopPA5NWF9qXRvOXneepBDqNFRUVFRUVFTOFDjrBjPMBCybZlkJABVjeTfDXQGSWUuK7MkBnoqKioqKioqKioqKmQFMN1FRU62RrMX3WTJTg47NVotgE8iTqokvc2C+zJPNQKpr4ZJZYmigMsd5yQ4dTjwI/Ch63ZEz2rEyAZwCcWSa6qqoskU9tXE0Wk2CjxUQNd26rC3rtr2QOvoqLYPgtk+C2T4LZPgptKpl2T4LZPgtk+C2T4LZPgtk+C2StkrZPgtk+C2T4LZPgtk+C2T4LZPgnvhJqwmKkFiYDyVD4LE2DMKwkRxKECoQPgqHwVD4Kh8FQ55ArZPgtk+C2T4LZPgtk+C2T4ZsFmI8lKwtPKujA5vC+5/MapWceTgtKwtPKsNMuyfBUPgqFbJWyVslbJWyVslbJWyVslbJWyVRADevtcTzzgpWFn8RFdDZ+VODbMNOE7MslNaOWSx5nKLe2Gj90cczbKyOhiET72vtoUxnPaWfvCXPPZs3wic9r3z9bw70l/qWmgq4/BQsLAOPvWs/koNtSwcGaP0Wm4u5nJoPcD2FQdaesHB4xfVfa+j4D71kYfJR9FeLZoqBJw+F1h/uBO/wAxaV4r2m08VP0i08V7RaeK9otPFdPaeK9otPFe0WnivaLTxXtFp4r2i08V7RaeK6e08V7RaeKf6y0c+Fo2vIqKBG8Kim0+C3+CtGe64jJXWDJZczkx2nRD/lm9XYnQ3n3kzvDX2mL3jqHwo7SGVjDSMTqLXvlSVAfSd5NLP+6JiSTUnfqYBAtJBFCFhMG+kbnUFp/dWEZfaD6p3M660/3G/Q3WJ/IFVbTfBbvgnHc8YuoDlksuZviZWbalBrRACgymysTobz71zO8Nfad86htp7ssr7X9I1Fr3yj6QdqOGz58fhqu3J6J6T942gZad7j8U/nrrT/cb9DdY9wKioqfNWdpva6Hj1AcsllzN0BJo2igxgg0ZTZWJ0N7uN7O8Muk9o5ldKzzBdNZ+YLprPzBdNZ+YLpbPzBdNZ+YLprPzBdLZ+YLpWeZWpj986h1mfvCCnXIxm8CfPUWkPeKbY7rJuH478otPSH+qY7ZEIudyC0PRy/8A3H/svZLD/l+60/R3WfbZv/oULSzd6yzMg4f1ymzO+DxzaU7/AC9pXgvZ7TwXs7/BdC/wXQv8F0L/AAXQv8F0L/BdC/wWK0s3NHE5Wg1tXYvgLrKMG6AU7ZvnC9ps/OtD0izP6woRiHP6gOWSz5lYW/E8EGMEspsbA6P3nccjO8MrO5/XqZO5+lexu4TOpwnfa/1T3e8ScmK0EWWYL3DjBG0tDF7r5K1sjs2lm6PwmLp3v/2n/TU4W/8AxCysujbv948cmno2bZuPALFCAoBwCgBVOhRt+ID5KQlHqA5ZLJjROKwt+J45TY2Jl953HKzvDKzuf119pZneARkD97D8r32p36IyWdkPutJOVz3yaHO/qvav+0V7X/2ivaz/ACivav8AtFWwZbF73gNGhDfdEqAWFjS5x3BPbiDvSHjDAf6Y/fJ2L0i0/JgHM6gMYCXGgXqLIx//AEf73ZyyBjJuNF/h7IxaJud7xu9c7ads/usApvvc072xTsNWT6gOWpc2zdBxU8rO8ModaAxAhIrZf5lsv8y2X+ZbL/Otl/nWy/zrZf51sv8AOiyzjhgK5sY+7BRFDe5ho4QRBqLmWfATviaI2h+9E5bTvFSyzWINws992i1faPPpDuFnJvijZ2QbY2fu2co8zk7UGtESaBN9GaY4JvI3u/td25YBGzHTO2z7vZlh/r2gn+Rv73NYN6MNlogMlkQYbkOBi0pzeB17eWq/xFmO/wDvlZ3hrj3RmdyCw72S+GTFufNMjQaRyEb3yTeRy2vfOSDQSTuC/wA1aizPuDSd/Zf5axaD79ppO/ZYrV7nntObDZtLii2xdjtTJ1oKN7G/upI9mYWhH2zxoD3Rxy/4i0ET/ptO88UXOmTcbWEzotRGQaQi1OABlpKPEa9vLVTUujds/tkZ3hrj3RmdyCA3P0ckd7Jp1od8smAUZJN5HLa98/W8WvpTjZ2ZoPvP5fuiz0dvqGfl2jzObsX2TCRvdu8V9taeud7tlTzL1bQ2ysvcZ/XioNuD2rnkNvazY2g95yL3ui45C55hZsm4rFQUA4BVVVDcBAZMQKPFWTuzCUxwMqftr28hmNk0z48cps376HgnWbxpNvZ3hlm4DmVtt8y6RnmC6RnmC6RnmC6RnmC6RnmC6RnmC6RnmCOEg6IpmdyCkm2nEXkGhTWDde55o0RRJqZpvI5bTvG4W9u0Oe6dnZn/AMii+0cXOO/JVRsrNxHvbvFfb+kgn3bLS+dF9h6O3vWukf2X2to5w4brpyVbxeGNlHfwQbZiFkyTMga0RJQ9GZMM2j7zsgQujcWmhTmO3UT7KoBiNe3kMpsrIy3uQIMCEHitHDL6xg+0Z8xezvD65Wdz+uvdyFz7I7tIZ22Yq8x+FzeRy2vfP1Tra2EbKz3e8dwRe+bjkj6Xaer/ACCb/wCy/wAvYsb+Z+m79l9q8v5lbrq3aQUnQKwlwKKPG+H+pbzPYz++V3pH3tiz57zlHJHJyRPYnHXt5DIAwwxmBvxfdMnBBzTEGmX11mNB1ew3WfeH1ys7n9de7kLmP3RgeWd5FBoi5vI5bXvlN9HH+ltd7fdNVTXs2mzC/wBL+W1Swfy2raZ/Laqt/ltW0zyNVW/y2rab/Latpv8ALb+yqz+W1ekB8DCyJ2QN4U6LsuawmDauPAb060pGg4DJAVQsW7NiMPx35TcbinHsTuSPLXt5DJZ97J/h3mux+2UseItNUWGY3HiEzvD65Wdz+uvdyF7HbxonK94rCA53t5HKcVA8uPwmi41cYqt88lAq5fSv9k/UXYTUUutrTe/7IfU5fWwlZDH+3zU8otcX6bncrinJ+FznGGrqqqt7eQyWfeySKiekbJ375cP3hNpTQRAh4+uVnc/rr3che+xP3tIZWWQP5je3kfpl9MPBj/rfJSU8lM3pX+yfqMno1n+XGficlVaGPSPDfCaqqqt1UGAU33OnuVLiiOoN5DJZ97+mUWg+I4hB7DFrpjKy3YJgjF++Vnc/rr3D8rb2WnulSyPtOJlyvaOw/TL6axoiSx8Ic10Np5CugtfIV0Fr5CpejWvkK6C18hXs9r5CvZ7XyFdBa+Qr2e18hXs9r5CvZ7XyFez23kK9ntfIV7Pa+Qr0kvsnsHqTtNhvC4X6FjaFrWtaIN7F7PaeUr2e08pXQWnlK6C08pVgxzS0xc6B1DuV8Oo9PaeZdPaeK6e08V09p4qFraOfDic2GztntHAFdPaeZdPaeZdPaeZdPaeZdPaeZdPaeZdPaeZe0WnmXtNr5lG1e557Tq+ntPMuntPMuntPMuntPMVie4uPEnJAW1p5l01p5l01p5lD11p5smJji08QumtPMulf5l01p5l01p5lHFPjFbbvFbTvFbb/ABW07xW27xW2/wAVtu8y23eZdI7xW27zFbb/ADLpHeK23eK23eKg5zvHJtu8Vtu8Vtu8Vtu8Vtu8VMk6h/JH8e461rrZzg8zgDROtDbkAcW6iXUnDsVa9TLwJDMGtqTBFjxMajBZCJrVEGo1AxUjNN/wjsQ3zjqXWzRoMrPUhrKuMEWWm0FLNK4WjqOuAbMlYZYzNxQs7KbAYNHEoY2Ne/eSgMAaRvaoOYIGh1Li9gJxLogoMbCX4AWhxwndmDmmBE0XvMXHUY7J+F3FRO/qTrFryLN1RqO1BzZEb0XPOJx36iaw4pDdd6+02jsdnavUMOk7a7AvX2lTsj+qwt6R1OztTW2WliM28U+VJjPK4tLCYmNV0R8Viwwl/B01LJHffjtOiZXtWOpOyEbS1m0GLjxKL30CNo+pXrHjTd8gvVM2nV7B/DEsu5Qv+zeWoOtDGAgrSz4HEmmzm1tWr1j9hvzKxVcaBFzjEnLTU0upqKKmSn4zxzdihkndiY6BHBYLTRtPqi50gFiNNw4fwrPOFI5Iran/AAzAaiddRw/h71j6blAMb4KkFKan/EWJ+wPnlmFKY/hqF08kN29YW7s8R1amopkpkp+JnLAKG/Ux/heKjvy43fjVFRUVFT8D7MsFAdboqZqaqipdT8XxH/qTD/8AtP8A/8QAKhAAAgIBBAIBAwUBAQEAAAAAAAERIYExQVFhEHGRIKHwscHR4fEwUED/2gAIAQEAAT8h84MeMGPGDBgwYMGDBgwYMGDBgwYMGDBgwYMGDBgwYK4MGDBgwVwYMGDBgwYMGDBgwYMFcFcGDBXBgwYMGDBgwYMGGYK4K4MGDBgrgwYMFcGDBgwVwYMGCuDBgwVwVwVwVwZMmTJkyZMmTJkyZMmTJkyZMmTJkyZMmTJkyZMmTJkyZMk9k9k9mTJkyZMmTJkyZMmTJkyZMmTJkyZMmTJkyZMmTJkyZMmTJkyZMmTJkyZMk9mTJlmTJkyZMmTJk9vqk+D4Pg+D4Pgyj4J9HwZR8GUZRPaJ7R8F9Ckcy0ktaxPApfBfRlEv8RVegbL/AAmrgz6s1QyYl9Gy0T2iX0X0eoL6LL6JfR8F9HwZRlGUT2i+UZRlF8ovlGUT6J7RlGUXyjKL5RPaJ7RlGUZRlF8ontE+j4MovlHwT6J7RPo+CXyifRL5RfKMoyiXyiXyiX0fBfKPgvlF9E9o+CfRPontDblHwYMGDBgwYMGDBgwYMGPDH1gaBDoVoP0L1KVwe16S4OgTcUyGw/YsordzsKdiIUuW30kSC0XRoVAT71EURy6TQ6Jj6cmpMYkawYFHAyrkTEJ6CZbH+4Y1p4YMf8wAx/8AUAAAAj6QQI/5AA/Q2MGP+Fea7K7K7KPkrsrsrsrsrsrsrsldiGOns5pbWbgamNCCtNoG+icciZu/gLuda7JaKCSSXCLEy5qJGr3fsToCgFw31kUGlnBBroVUlLW0CbVNxrf9CB2krh0N2CRsaEWiOpKFZXJXZXZXLK5ZXLK5ZXLK5ZXLK5ZXLK7K7K5ZXLK7K5ZXLK7K5ZXLK5ZXZXZXZXZXLK5ZXLK5ZXZXLK5ZXLK5ZXLK5ZXLK5ZXLK5ZXLK7K5ZXZXZXLK5ZXLK7G0uT5K7K7K7+rP05MmTJkyZMoyZRkyOVwM2kbcakubZUu9y5HRpx8aCQ9IIdbXBsS1JiX7CSib8Szs3M0vZAjc0Olx7En0Fz/A+ZmlnK/AuspQTJXohMTPZV6FKxHoaa48ZRfKMmUZRlGTKMoyjKMmUZMoyjKMmUZMoyZMoyZRlGUZRlGUXyjJkyjKMoyjKMoyZRlGUXyZRlDfZkyZMmTBgwYMGDBHRHRHRHRHRgjojrwjojowYMGB6B9SQlVO1LYmVn7G5OIdmr4KKXX033RxEkuSaPC8IdM0Eo5HJ6BhJtCaxxsKpRQ9zD9BjBgwY8kCBHkR4IECBAgR4IECBAgQI8ECPBAgQIECBAgQIECBHg0D9ECBAwYMf8Pkrvz8nyfJXZXZXZXZXZXZXLK7FWtbYhvANS6j51XRtJbWpuJN6ISFLWjJn4Skqr1iRjDPyo1EakKNhlLlQ+hS9CS1XybiJcHEPUsSewzXuNU7bE01QlevZp4ioqKZXZXZXZXZXZXZXZXZXZXZXZXZXZXZXZXZXZXZXZlmWVyz5K7K7K7K7K7K7K7K7K7K7K7K7K7Pkrlja5ZlldldldldldldldmTJkyZMmTJkyZMmTKMoyZLMZQk0aJW5pp24ljNJLdxz7Ga75x0/ljKVHv5HrBOTuSiBj0MrtUlvvq2HJqflL5JzfmCK8beOpeiG21uPlCnY0E/CGkW64kd0v0WNpE8aidCN9HApbE9zMowMoyjKMontGUZRlF8oyjKMoyjKMoyjKMoyjKMoyjKMoyjKMoyjKMoyZMmTAfYyjKMoyZRkyZRkwYMGDBgwYMGDBgwYMGCOhLEQpfRA6Z1w5GAW0shtZuW6dgSnoZbasm3P+h+G0QJojYkQXOLtCkIj75G58vqqveNDT5aBmqtSOWsNC/jqJFckxNoc3HLKEvvyiZEkyoJf7FBoICOiOiOjBgwR14YMEdGDBfBgwR0R0YMGDBgwYMGCOiOjBHRgwYMEdGDBfBgwYMGC+DBgwY/5/J8+K7K7FHYhMtpKiO06pTlsmU6rjfo5MdCaQoyKKmpNQ29o6NR/hohU1sMcpoiYXsYuVhYv4zapSPerbE1JshJDV0enJVayQOBqxW6WrGbSdUPsOvEZsi0Sd6CqVVDv/AASNWw4aYlXaNQm5JExy63GtL18L35akiiuyuyuyuGV2V2V2V2V2V2V2V2V2V2V2V2V2V2V2V2V2V2V2V2V2V2V2V2V2V2V2V2V2V2NrsrsrsrsrsrsrsrsrsrsrsrsrsyZMmTJkyZMmTJkyZMk9jmqkr0tixSQzNsDR1MrBl0bmHIylMo7KIn2FuGUI+4NwcqFBciNS5Npq1YqJdjTaRJnCborNA6U/I3o2I0KdBuntRHJahjXhGd7KXAiNkm7lNDd7NccPbyCJNvKEIRSGTJkyZ8mfJkyZMmfJn6QyZM+TPhkyZJ7J7MmTJkyZMmTJkyZM/wDf4MIbFsZBJG0RuSbxHmrQlooctBJt1qOvUcwe/wDApPU1spwPTkUEaF0M5yS+R9DOT/QlVCW74EO3BbShvEG5mIgspSj1oNATVCOix4k8M0bj1m/CSfG3lS3wKGotPCTaNGLoWCc6F9F9F8IvhF8IvhF8IvhF8IvhF8IvhF8IvhF8IvhF8IvhGEXwi+EX0X0Xwi+EXwi+EXwht8IvhGEfBfCMIvhF8IvhF8IvhF8Iwi+EXwi+F/wrxXBgwVwVwYK4IKBG/Qsda8OHa6Lv6DhBQku0khzjiHKmG5DytVLQ/ImRt/CSrJLTL1FPgwJluRyQKH9xGhogxWIVEiMWUalWnZDEptiJvIiMSolufz0MmrEk0gbUpG0Ryk+BpBrXxIuhrrT6EN714RImeiRpE4YsNGhIoFMCEPoGr3CnVoUyuCuGVwyuGVwyuGVwzDK4ZXDK4ZhlcMrhlcMrghcMrgrgrhlcFcMrhmDDK4ZhmCuCuCuCuGVwyuGVwyuGVwyuCuCuCuCuCjJkyZMmRezJkyZMk9mTPguE7Em7HOiGiN7yxXt8iVjUMNVxsTvgRVJJOiesIf4h1O2kOZKmtNx5JJWtSLVp+iCpfoQt2JL0E/ZJwNrtOGUqFMcrJ7FSiaSn6iJ6mk4pfZEtLT2Y9lViVFIYqpZi50oevlMjdEtDUp4Wg1IckTTbXo1KXXQujwSmxWNpY7Wo9ez8JE+CRInwQ+RMcJyx/wB2F/aDaAktRD5IfJkvkTtzrT0gipeA6IdXwA6IJLd6LRv5dBq5H3EPkyZJ7JGfCezJIkT2Z8mDBgwYMGDBgwYMGDBgwRkdDbSFCSRTIL3Oo9wQvOsCW6qRaH68ikPbzxK4FSR14bKSIaGLd8nJOaFolqhE9WxyehJpDSzRDVQekcEUGtQNUxsvkcj5FofaZKpQmVCU8b7FRGgpQr66Ho2gdcmqaoQmvOjYlizKJgVsw1fhvD01E4YVFf8AQ7Kcq9RULppmwRsGC+EYRhGEXwJuA3gPxaZIil7ONPTvvwqPJ3v9xDsH0QuoSFK3SS3ECTPwvbOi0JAhBBBBBAsbacHH23IghujozpHQjpQ2WxgwYMGDBgwYMGCiiiiiiiuyiuyuyuyuyuyuz5IUTY0m9g3q2QxWzuzY8hHo/sr92Q5FALg6hUq9sX7QtNlwviC8+bZ68sqCTvf2HOD6G7hhMtPJZG56NG3XQlfGHvVjbFH7DvOG9tyf8E9LQVGjkTkSTTSjePRCYhMknH9CZwlWywj3dehMGz1rT10Q3olCdJpWxIi5NE15RqG9x6kboe8bli6G6exJcrgjFkE4INHRKK7K7K7K7Edi+yKU+P19I1kXq+AS8fleyA0p3FdiKGtXye2Jf8t0IkTDuNHyuRQi7EXY47K7K7K7K7K7K7K7K7K7K7MmTJkyZMmTJkyZMmTIjeE0KQM0qFS7HNzM2IvqKSl0f5yxgblpvZA3VAXK7pCN/Sk5lBilKXa6N8CkZaBMbq7erN166jejRcDUMSYmLc6EqSC7QUqI/Rsa9H2QJogTh8zUDVKc7oNqytHiar80KW4lmmcEiNOmkkJu30JGLCSngFpTnUm7PrVodnjWtPCY0F+ixoY8sQs66lEpaChqQ51MnYOWmxtRI6IJwveF40vDPwPZ7G+o6dqJ+txJbKFt/wBIf3T0/wCz2PY9j2MmS+TJkyZMmTJgwYMGDBgwYMGDBgwYFwJpTFMsWSQnGWdktyBVAlWjSTNWLpKQ+RMGxl3j83FESreBLBHpqjWRotRotBtSFVrA1aMeqkVlQWbGH8j8y7pE59ok5akIwpxt8g0YKo9rIKFBNu2gdRO5cxEJcGpyb10FCCfkCNdiIQ3EIvoSmkNHAe4QNsxIYi9WJj7LRa9C0Epa+4kSu+IN0EWVCNRsyWOzhDWSr0TECOq52ETSFfYhgkslohYakektRH0M1Pw1PQi9CZVqfevpe0BqnTI0G/1xAEXNMS037onzSk2fxZ6np9QDBjyYMGDJkyZMmTJkyZMmTJkyU0FtxkgT6SSU92O1o9TWMmo1Hokx0geHIxi3MthRLI1W50KE0SEL0luahMb/AIkTvVr1vUeFoS1Ets0CUvb2Q6XVakvZdWSOpBvu7UVS15PkioNzqQpKGjd6EcOBaj8Ly1SJSnXwwqy2V8ia6fqK2S4aj8YmlkR0XfLGGhUNFriS3LwS4QXVLcIUhpyD34CswI5ajiovX+BJTMoSwvlF7of8ho+j8D2exvqfnufooIba9neZ2jv4TpEXaF5/KcGjU9j2H7MmTJkyZMmTJn68GC+DBfBfBfBgwR0Q+BuwpKNREI9SGKh7obcS+Cbgjew5XYlxMlxohDqiLE4nQkchXwJdNOKj+3oYXjbR57NuickkSjX7GxrtCWkr0F2/scPhCtsiw3O5XJpKGbNOkibVWLDcf4JtFkeH4q5NxXQ0vU3NCHNHGCZEXWFAXhLRSiclUkuBITb2MpFGgpnJdk0+yVej1J9L3E0tBMybNNE+c+tRxSlPX09DKG9d70JXuT41/wANSfBc6H4Ln6Pyu0SJ9DmdCfCPxPAhePwnBp0JcHohzwi+C+DBfBfBfBfBfBgx9VFdldlFFdldldldldldldi9Cim1NsnihxpP2FQmtam9EtzSyMe57hM1qTlzuR43yX6jhDx6fA7MJOR29PQk0QFGVQ2ptszYdog6S4sgSca1r/Ir3eCbJHsU/Ymi3fg5qmifGjHyYYto0gqok0IWu7MCdYlTUk1Jcat7GoWwppaEbb2+3jqr6jUjiHweok9ylhzMl6k+FQQtcvxA57UrZcDUFF0Ilq1LsdsovdlhIZCcaqynHKKjNRvyS/woVPy4FFBWpledb8NSBXZ+C5+j8LteMSuyPZ+F4ELx+E4IwQ7IdkOyuyuyuyuyuyuyuyuyuyuzJkyZMmTJkyZMmTJkyZG+yxWl6YOrOXPsv5GFK/Dn9CHa9j/ghy1DShIVfI9IREy2HjKBS0GgjjvBq9UFRXzOojzbdoYyt23WKmleW5liYiJi10QPTQT1/iIF0IGE6eRY5+RR70PgaqRtBalJr3HRF3S6RpcKY1E6OJvd7DE6q9xRFqO4OQWTVCokbC1H5SXegpDWKvX9A6i1exOo92uhdtqy5XHghbI+DNCDaLhcDfa5egxuFtRLNzG4N79MutURjhN6CJF+tpd5FJ+5pIqDRDV6TwLTxrfhqe5vqcj/AGF4Z+V2j3Pcfs9zkf4i8/jODTqex7HsZMmTJkyZMmTJgwYMGDBgwYMGDBgwYMDRsNAy2kSWxU3IqI5zwIGlOg/t9j3svgfpIoXXUcZcpCWgyzOjNhM3F72hLf6FiAaMj7iH9hq2CUIeuWl9w1op4ENrUJqdlO5QyZ2KPui2Vut9ySjbcSWZL0/OBqZfiGpuBS0sauHKS2exzpnXBYrpdehttBdnj7eZKW/sSnTtqhciHN5e5rbkmUaersRuOZKtPXQNtj6iJsPcSmFI64zTQ3sL2p8rcIdzdeok1UR0FulnG4yqBNEN9v6IArrQ886Ew6aI2ptJHuki+7TfsTKvGt+Gp6m+hxP9vo/C7R6noYPU4n+IvP4zgStD0E6+kGDBgwYMGPFFFFFclclclclclclFdldlcsrljhjNddlNGKFr7S4RPnCUDS9EWDA07uUdo5JankSJqNxbVCrnD6hFmt0LGtmg292a+qzsI6CehtF6NuZ5gk5WlrtH3akVd7QQhzM7exrWtB260WkktuZjRLKs0vggUU9BFW+6K624GnA15SZuIKrxq+wkFnS0gnJwacwDGzbljb38UWmgQqKIK5GIMOt4XZUNLotfb5F2ku0cyPcbw7chUbn1W2GhQNC9jrA0lSnOpjorZDhEiN1P341Pw1I8sUTufkuReGfldojyQ5ZXLI8s/C8C8/jOCMakBlyyHLK5ZXLK5ZXLK5ZXLK5K5ZXZX02X0X0Xyi+i+UZRlGUX0X0X0X20r+j5/Q1xLlpohEkpbBVC9jQQgn2Azv56T8DO5HqzGJmpp2JpIkskuAMlMq3OxRL0Y+tNdGJ41CTaSa1TTmENJfZWhoay0Q9i7Q1stoRDT84H0cqFF/yT7n9BunC13HqNeq1HRz92W5saumQkKWnGw9TYQstEpK+CUKxiS8oE+2/mhslhIb5J6qSdMrRH6ZQoQXxqKl5YvsM23SJqvRyaIq6EupwSxO/gf3Zcrnf87OTFoRJ6d2NJSSJQzU/DUxN9j8dz5Z+V2ifRPoudifRL83QXn8ZwaNhu0S6JcovovovlF9F9F8ovovrzgwYMGDBgwYMGDBgwYFdQ31aJux5Wckc/L5k7hNcQlhTFRyTo0OTTpWxquehuqpYyeilDpa6Isj1FYwEEVGtorCUO4cl8C7f29C0je8S7fX5qQUHOjap44/c0aR9NC4JuQWzbJwy5lffPIiPuawez3K2h4Q4W/Ru5SdRZoTY5Nt69DZ7DTaGmoHsGxrw2poJKkUbv9BS55klRf0DkTYGT2LcMdhWt5HMXYUki124rM7CpK+tbRzoWaoNwhrpTPZCQhq+ifSeBU1z4Z+V7PQ30ON/sLwz8LtGvQXo3HqcH/EXn8ZwaND0PQfrwwYMGDBgwYMGTJkyZMmTJkyZMmTJkejNmQiFScINqJbRjGlCew01qOLA0gxpaLfi7FwnOuwokWrhJsWpA4CEW1KfQwyOL/kG2j0lEQ/zcTwqOEJ46NZZIW+ByqU4TuHsUNbjKGbV+LXZuSSjnqNC1aDdIkJLiBsmj2Grs6SzS+3jkcV9gRzrEIVBChJKvPNmkEmwlQc1obJRcJJjOJaEGR1ap/YvJNLCSEur37ZPZZNkkXAnwL19P0IfF/DWnkdZo86n4ansb6nO/28s/G7Nep7mT2Od/iLz+M4NGp7HsexkyZMmTJkyZM+Pg+D4L6L6PgvovovovovovovovoraI0ZPMN0SeE9ZQkOaXfRbhW70NcTaqifInbH8DFvQriNS+Qk1TG/0vzrMyQpJbRuDSsHtf7kl0tEpmOiDzThBwdFob1Q4kPQSthYxL7ejoPi6JG6m1PooXfPiBgvR1FUhbGSqjXU5XI8nhrTgTokqD2lrTxRvRfoX/AKLmpexZcnhaH31OnRPTe2po4ONCOrNkicwTuHySbFPR60LcXnyI+K7EoiRDlkoEKJdpPdK577ErzqfjqSLnY/Bci+jpdE+i+ifR0P6RefxnBKNiXRLol0X0X0X0X0X0X0X0X0X0X0YMGDBgwYMGDBgwYMeRoSiVuEzsuxiaRr/D0O2CG37JqYOtWTDtZGlEDQS4CURG8j0RNaj5I4SvBQnSeiasvOLbaEOr1js1RqTe8fuJ0mTdh0gYb8Px1ydJuBKRDmhMFzY4SliRk5oYjULBIJpQ2vBCXuoEzN1TYmLkguV0vJuda2zoYlIxo1taCZJNWljiEp2CGee4yHgHiRaJTEvkRbiOdfyX+FbZ6IlbJreGan5anqb6HE/2F5/C7Rr0PXyuB/iLz+M4NOh6Hp/zABgyZMmTJkyZMmTJXJkyZKVC26IMxpVg0v4j9AV/JYykB+qESUrRDtIt+glqtTrYlCvcZlJxHKRLWi9ImxObYf8AAbo7LBuJ32NFk3f6jGhISFQaakiyd+LdaNJ4J5TPXobI5bFKY55UFmHFSaDeha2IKa0SY5CaqxIolscJ1HsTFewju69kvdLQmiDyMKRNDTgoUPk2kFZtjbcR1Imt2JWdBHctGrbiHuLCJKFpbeGflez3N9T8Fz9H5XaPcjyVOp7HM/xF5/CcGnU9iHJ7FclcmTJkyZMmTP0fBfRfR8F9F9F9F9F9F9F9F9DTo1xb/wCfud8LaIUvgbRpkc2G5ueRRp8cCmje49SWqId1cjTvQqJkqo3EvtdehTIbiZiZ/gRuhviOoyLek05+xopUNKk6LRt2Qlt7bcjGr3IvUhycED4Q1tJavQclQJIsCvqhBbcYnY8sRpUTnJEw2w9btIqOhylKbVkywLvwzUYtL+hN23Uv9ArNA0SaQmFHi10Kk7JA6E1f3CRm5VstSSFJRTr+xwhSE7ENMPrgdJMZempjwzU/LUn0XOxb8K/o/K7RLon0X0T6Or/T9H4TglBLol0S6L6L6L6L6L6L6L6L6L6L6MGDBgwYMFcGCuCuCuCuDAlEqb9EmTiuiJNmiXcEKTWlMkNYVs+BmbGiuGU6fsQRS3HEn6L8sTZbb0ej/oqmTUQipfnIqTltiD/wdOYPlAnanQehtQmJtGpCjcga28K3JAWAJwYVA96ECOAWhb8jtrtBCGlvKsSPRNuX6JvBPRNCV+w2Co+hBXQtLJTEfHRCHPuehC1rCicmlkNopdETI+qM/tX6C8a35anqLXQ4n+30fldo9T0K4PU4v+IvP4zhmnQ9SHBAVwVwVwYK4K4MFcFcGDJkyZMmTJkyZMmTJkgHPP6DPVpAoKJpYHlqVlAnox6kaEmHQciFSLkuiaevsbN5pxyoJtKEPWdy6zgbWp3bJlChIlyjjckvSa1GmInSjoio/cfujYjgfvAniBQ+osLpux0TcunIz2yuVyI/RGadoaZpoN+JCG5flmthKLEZFGw2mZoUYVHiijR9k2FWa1sVRfdCDbmAQtMSiMi08a/5ansb6nM/2F4Z+V2j3PYeup7nL/xF5/OcM0anue4xkz4ZMmTJkyZ8fHj4L6Pg+C+i+i+i+i+i+i+iUdNROykI0iLoXQkaEL+M+1ZYmI/QFDgVU4QNMLejU2NC3PRuGmo73UxuUV0giNk49IcRH9lqCQ6awRLhpjSWkDRvwOtMCzqx2z7eKe0PXQkWpKQhgTU8GcaQSaOyQtpemIeKcWElFDRvdi9h/Xot/oQkUkaL9CqGTSDVbU1CxQ1T8pbFMM945YpA1E3Mx74IkktF4Zq/hqYm+x+K5F4Z+V2jEwHPRPonsf0i8/nODRsYEuhz0X0X0X0X0X0X0X0X0X0X0YMGDBgwYMGDBgwYMDfCJIhcUwt6HpfuR3ArSTGiQdN7ekc8RD2eyaTJLBoMcKp226kjKV5yySmwUb39kwiILtzgKP4G2obh0/Y70T2UnCbrkluSI0kVrXXUbbib6PuKX7enhpfwb2vDEKdBhdOQsNIINiJhq47vRIccLj6EIQyQ3B9pJQ6DRX+SNBqfleYqSITCRsoLOHoLLpbsfConfwOJcZS/DUXo30OF/sLwz8LtHoeo9dD0E2P8RefxnDNOh6HoehgwYMGDBHRgwYMmTJkyZMmTJkyZMmRX8I3Tf9DeZKmlncgHtIhMla8lo7+zZqvHFloUrkh7Goe89sgVOtzcEqJ2x6M9UZolNOA2qrU5omHP6DNkib135KaJm2PTgknZJFBDI2Rq4Y1WiG5FMjeRsf0JCQh44WPsW7mLCBG6Jb+PQfQmG2LkIRW5Mjb5EfqjecirjdDEaxJva/osxw2HVmQx3/MIm4Duf0LbITDUSSPH4tUe57m+p7nO/wARC8fhuDTqex7nsZMmTJkyZMmTP0/B8HwfB8F9F9F9F9CnopyPtQ3uNbkuTUOeigbRHiBxobc32OlbbwfnoXc14FYnsuxuz2SMUN3WnYq1vo00G/gfi/0Ly/oSEhCAkl0RpuoifOpNsIN+x7RkW56jcMr5YkbdGkmCEFiSV7Q4JCPSDXxK08iZaV4TkchIzap9C2yXpY1AgW+r/sapK18N7HTNXK1Y3WoiW4ZNkQp0Z3EmHEbuSXQrIc7CPocbm2a8F4/LcGjYwJdEui+i+i+i+i+i+i+i+i+j4MGDBgwYMGDBgwYMeEYGmk0Q/sxrfkCQiRtsNu0P2wSiJJm9/GvieTaRmiGz1fhItUkTHsfsYxfJC8PykISOIOdhFaPhS6IVEuSrT0JLa+8bfYtI0cSNfIRwK5+RR9bjE5hQ6UmDJxxHiQMHo8bGo0evI0ZLmU3Psb2D7xw5W42+t229D5NODciNND5Wk/0As9L04+zzZmoUSCBk22/SE6F68EBXHhgjowYMGDBgyZJ7J7MmTJkkT35J8CkWxZWHLkfQS6uPscShG9ETSCa9DZDruN5Sm3fjqGmqaI8Ebrkcbj1gttJasmHyStGVKm0T4vYY/DU+S+pD9BTRkqdGxATNYBq/nJcbk7Go1SKT/wAYvUUJiiH7wYHQhJjU7DbepKJivE+VoIIKfQjEiDDHRFqTcQyOhjVREp2OEjJtrwSdvaZNT9hfTFZhwT8wP2OGDCfBPZPgkT5GfGDBgwYRhGEYMIwYRhGEQ3siUZQaPc4MxS/f9xBqJXY0Q59cvBaxL0b7Q47Db0FQiaL4Y9ZaHMqYjogrmYGxieSTJJPRIhJPnLoWzRTwaHp5YoJt3MgBaGo0/wBF+z7Gmr8OpcsmnonJqp+SE4U/RbW6ayRK10G3Ctkkzpm9CbhI+hJjIFQVOxUqEhPVmptky0oXiahQRLW7YT9Dr4mJ+WRFuuG6G6Q3SG6RgwjCMIwjCMIwYMfRRRRXZXZRXZXZXZXZXYo7FoWoUpVN3Ag0RXt7slJ2pi71HrdtthKlL2F8N3ENGLTX7BLR/UcIfH4xrNU41scJpfwUczDGq0XyaCShhsYkkkTTJPhsQlJtbiRmDq+Pk3aXoZAhJ232Mlx8aQ6EXYqs/wBynHFN9CvM41lDPZXbcZbnT9BVqPsSrf8AQLuiuTlwJctGNcGqxottkK1cgE2rhcjJcaKiRlaSUmhJGQ5SCa3E3gTWSJiZExFGeDlzAJirURJGfBJtRltfixPY6G12NrsrsrsrsrsrsrsrsrsoorsyZMmTJkyZMmTJnyXmaiGo7trdl6xJNov1FGLd7kPIpFTV1yNpLVIdAm3sSKVxaNcMnvwci2rg1eZiSSSSfKCC+ssaaH8Q8kb/ABYkaFtcwLjdlNUdJiL9ENSJUWTpdDNcS35J9iEXF/uXE/KYxne40fWORR0e6HbC+Vo3rLBTXQza8h70QY7ohIhML5G8VbO9iBeghFKUWWbgi/AlbqhLlGobhEk+UxMetHA90C2kSfQw/W4aepFB/I1b1yvI/ka9xvyS5J7M/QMmSfBkz4YMGCOjBgwYMGDBgwQ+BToJhCf3IllXq+RyldjmWw1KN0OYOCx8HIottNhRHM6k/JJP1z9ATutTLOkUFu6nqh+KII5NYiBYxGHyfCLVW6N/ZYlUCfZHJRMqSC0LtHDJq3W45TW5Q6e8GmzNUU90NC0NU9TXrRobgbJSWSeOwrfZwdm8FUwSa3DRXffoSX+5ehEyYYl0Q99D3IpxM/VJKSzGQZj8qRsJVZrXXIiiltqRMqUtWpED5TPINdGDBgwYMGDBgwYMGDH/AA+T5Pk+SuyuyKs2hG5NJh7JTRs7NpQkdDej7iHrX/wnQJ1rTNQmWNvpaoJ54Hew51PxQkNkF1+pkelESKkyroTGmpUi7zWtDDhqh0vKOSHVdEyV9xVPsJJzJQJ3x0c+IUyk2r0baRLRUM9C5ZEqSaizqX6/6RI1DQstPaDRS+OBaOTljajVb/A1mlyzUU/8b5FSh26JRDRwFIge0IgMnBZGKlImV7hp2QuyuyuyuyuyuyuyuyuyuyiF34yZMmTJkyZMmTJPZkfsnsvY+BpbJxt41cI38vggj/pAl5HATjiC/ZE3RvTnqeRWm10mns5Oz0V2iHz6XSJwa1KGuUPofoS6ErUQgDbVK57JGVAt74lEdDW1ZLZrBYB817FVsyVFuSjdmJv0xwWbesI/VmSfr/CERXLbgTZvgbdnGpezM8OhlidHRO54JLu5Gm4mjj+tZdkqUssW7GPSzMrpHD6E7dn26Sa5RLkv/iAMk9mfGDBgwYMGDBgwR0YGuj3M1abfI1FeJRME/FeEEf8ANISEFlxD9ckw5s2NN21a/gcJ4rrVu36JeiexTZJr92JLsjNvZ62JZkhFop6Es/qeBKiJXA0inHA2T7EZE+heDvrJfYpSYpVIgSQrxbCKTofyX0mBXS9lYIuNkaKc8ayxmHJaEKJTLkkmWrfYbJg3mj/SgdPC6WU5vVCp6H6BtsjylIwJVlnKOGkjU2xOxIQhq3BwwtIKNaQ1b82GyE9UaJyhOiPIjwX4MGDBj6/k+T5K7K7K7K7K7E9kDYJEQJDTahuv+yEsiVAqS7XUCtx2m592oEqTKYtrp75FvQ0t9QRGq9zqJlkPN27JnHx4kyCSojbmMsOvZXbCI1DpiluUiqG5VciykbQncIWwpsOiwyE+/ir65ol6mj23NGhdXBzwE1DeJ+wqCSbT0HFqQxKNiSSmioVH3kQ1NkIY/MiVoxs1fhIlCkWt6IcbSabEFsQat2yatzJqo0rRRI5K7PkrsldldldldnyV34yZMmTJknsyZMmSezJkyR2j2R7I9kR2iO0Q+UL4DmtfUlPhPwgQRilpfghMu32LVZK1I9Ps0JN9pvuNhozPc0l/QjLaONndix6KH+hL+zd4o5EjszEUWtyGUGMis9/iGnYgW9CRqRKQl0NN03EjYbM3gnRcJ+FEQO+LJhnNQJfvZ+4SOiKpLbd8ZEdGVMU1yP2nBi/2G408P/hIuBopCuNRkeB0xCUUodqWsvTP4dkWFzgjrcyi+UZJfJPZPZkyT2YMGDBgwYMGDBgwYMGDHhgwYMGDBHhhkT+hLE736MU+Nye+9DnS8KdElpoJR7C0iUJt6yNHuSTTSQ3X8iJKTtN38D0Oq86lhE4TiEfhDfTI+XIbsFXJoNtz5aySRIbXq3+whK3fo3kp1fIkmqENR4K9SrXBK6Jg6uj08VQxJZ9K2Nypb7DLMUr6a/PgSa9URG5DyvkSJmVI3fUf2NnqT5fhKS5GvLH+vnQQ1ockIs+8JQb0llbrk5ShvueibeYZHXkwYMGDBHX0fJ8nyfJXZ8ldldldldldldldldldldldldldldijs7OVyoVExCUtxokIH8lM6riRCm4rRQHK23/GRiIu9HkuoSyjQbah6Di9HkVodeNFpCbEt3K0MlZE0g0xsVe6J4Dv+25pBabuf1FaphPcc2ohZWx+g78IevCTfjWE8BX4mDaQY5IE1C1sYlaQO9rk1Rx4G9uTX0RkRKWlS/5oaOJCZlq5/YkNi224SXLNaDuYrb9kTXl6edIyE9j1ejykJij5YGXop0E32JY8Jcg3zr2j2EeyuyuyuyuyuyuyuzJkyZMmTJkyZMmTJkyZMmTPhkyZMi4jdk24vk0KRwqGHRNoJq+tS1brgWEnKsDshGuYC8t31V/OiG9WiV77/I53bvaYkr+CEbUFR0lsS3YrdbhG9ejlBDWmofKlBvldUT+WN8fJi9oRFqc96g1FJPKJttBpb4eUpdGoiYdD8V4qqGbeGVo8Jkw02w3dZjUaid/Bq5bNonvx7C8prNmr5/NPoXY5D8dhtqNdidjL1g0DxGvM+Lv7iyJtuOrQXDTsXoKPm1XyP2ZMmTJkyZ+r4Pgvo+C+i+i+i+i+j4L6L6L6L6L6L6L6L6FPRFwi6BNb7P3eBra6oQ9FM/YWU56Hrdthv+2RJS0yS07cUbJvmCMY4SxtOW4DV+AoM3Dj2/wZ2mye2sojRbEaaZFXD37H+sslEalxq1kZppNMi5SX+Icb+Ocm3IdqX8SdxFpsyFyG5118Jxp4mxa/SqGEYiWSWZexK3QnZC8J14RaW9xvQKNB/Qqq1ZHjQL6Pga9D9TEb9EuqQ+A/V5XRFMtEoo0r98U0YDnovovovovovovowYMGDBgwYMGDBgwYMGDHhgrgwYMeGgZU2gU2v3JTUe+nH8DI0TWiIIe2odqv06Gb3ko4E71+CTfXUl3eg+y/gdnPQb1wJLR++RTF0SbpstaTT28GumktbHEw6N5sWpOFImF/hMVUahv+RRkattBs+27YhrUbBv7G5+lfTI2z0NISNaG0M1rMFNIx/Uat2fpwkmh8GiW5ojUdeUQXdjWnhodbi9GDBgwP0Qg+ghIaJTEWK6NR4pFTHcGqdGsU1aMGDBgwYK4MmTJkyZMmTJkyZMmWZZkyzLMmTLMmTI1td10i64702KjBMoVGbSNNhva5+Q138LF+Jg4T8FqSfkxPcyWwthHcCk9Exk3CY+iu0dwvk0q/Q0gkpy/Ym1pD4X6D5F2m4SKemKkbfGgmELQYYyP+Tu/tdVwQMxRsqMQRhJ1en8GJzl0eu2cw5uPyxKVKT+CYvnQqVf8AXw2PsbKeEkTMM3bI1LSNhGp7tzJXJkyZMmWZY12VmtxVAe/BiWmaylxoXDVXp2ZMmTJknsz9HwfB8F9F9F9F9F9F9F9F9F9F9F9F9F9F9F9HwX0SjpqVqxtCp4mPxka2mrdoUw0NfoKWrHAmL8kcFLjgK9030a22xPZ8hwRCM/uNcS+y1J95MnGz/o/Ei2LTSWxeNs9ItOCYbGxsnwlLGf8AAtWNzReGMUeSSGjNuSqTDIfovuEMnqVISto14HmmaJKnS4f7H5WIG5Gxs18wcjbC5Yk32JmWLaEpoX0X0X0fBfRfRfRfQ56NDmCUnK85JpiCTFMQovj/AEc9F9F9F9F9F9F9GCOiOjBgwR0R0R0R0R0R0R0R0R0R0QIECBAjojohZSUMkdkJTTXb1oZtFFnX7jxLhJViYmSEW40ppSuyi9cEoVUHv9CeCYpsdat+g25Vp9TJsQROOpNj1USVNcErGGxj8xexZ+g3x9EnQQ4cfuNPT7QO0+U+RM2+CiaJ8iJp9h+j/Yn1U6YznjwiRwvDJao1SVIdK9tBJfSFTegdewuvSL6SBHRHRHRHRHRHRHRHQlegsw48EbC7UNG/bg6PQjojojojojojr6fnx8iyfJXZXZ8ldldldldlcsrllcsrsrs+SuzUStOw5pp9mH3TeeSAw2huERw1oRGyuW69jZkDQWKOE65IRuOWo18m9o/OR5KmFoNbMWfZWUHbSPRK7OhlNBo9cjlfRvMXhY8nr9LXlor+YyxuhQzX6ojbX7YKLP62yHnC/UopJwPe63+bI4NQ9RuX4nzoJuMKhqOYNaTTwBa32frnyV2V2V2fJXZXZXZ8jjllnN/J7RN2iWsckP2z5K7K5ZlmWZZkyZMmTJlGUZRkyjJlGUZRlGUZRfKMoyhe0ZQ0X7B2yUslvwQiEHEQfL+R+qG39fsSN0QKvBpInRlnULI3V3kmNyezZZEJwFDV9CwObU9fkicmxI5A21qSuBMi39Ey7+rbwxTq0kMaUmSIrRt/PgRg6/DaFPZ0/wCzOs1/cRtiYP8AXR+wtW856aRyd+giaT0ajytohXJ7nMqh2bmUZRlGUZRlGUZRlD9oRTxRTNA1Te7ZoVTGTKMoyjKMmDBgwYMGDBHRgwYMGDBgx4R0X4MeDSU7ic5HTWsTqjS+KUR8KyTZRXryfEqRxshCbEhRHZ9haPQnwrexYatOu/gQY6DCZt8PgV0JeRJycMV8edPpUXlJY90JSJJUxD5n6YrfHPs2f3HVP7m3V/dDntL6GjTsk9nAhb2H4ZMoaLxL4RzJsasRsESW3r2yjztnLgu2NsdW5gwXwXwYMGDBgwNdCxMT48NxAxqJs6pMfowYMGDH0UUUV2V2UUV2V2V2V2V2V2V2V2V2V2V2V2MDLExdhFJKaxR/6JLde1Eve5O9SuBW0ror4J+MTFHslCiKZPgnG3z4K1DMDdllmlDKTcXYlHWo9EXRTVa+rT52FUvGhN6JZaL8KIbZl+zMUIUaCZxhukobDxJIZDSQlt7ImdFL1zk1HK1mPRWtgzkYkNINTcmkxyA69hf0kafFURuV2V2V2V2V2V2V2V2V2OOxJrsJyIUo3Kn1JZ6b/cV2V2V2V2V2Su/OTJkyZL5Ml8l8ol8ol8ovlF8ovlF8ol8ontDhqgyP5jWshNT1uwiUoUau2OuCCy1UKrIXocRuNc+LaGJFtRCdWxu/CIcLRql0uWOFCKJvwhpa/bGNHL28UyUv/hMdeePAhHAhSfMxPkjZ0YwVriuIEcCIKajSNOJNZHwD0palsW9kXCQonZ76GzMQmNBKTS7hJoadPRR+PI5Ml8ovkvkvlF8ontF8oyZQ/aJhYcEPELhpi3+x+y+S+S+TJlGDBgwYMGDBgx/xAFrREnFI4ROrdm94Gu9kpyjc+uDZDWhMj8SInwXhJaSVvgTT2O9l1PIovK6gh+WuzxQWh34jKvxwG22X/ItfCZoQld3d+GhjUNqmoSkRWRmShBWsHo+CbWjRCRJJroUweYrRFJZujRO3JudH/QADQmVl2kLBDwxsxFASd/sP19AwY85MmTJkyVyVyyuWVyVyyuWVyyeyVyba8JpKF4PPgTqCTgMpKGnRR6PaR/SixWbR5xsvY/AFKXBJEJ05EoUEe/KGEyrUJ2SrS8aiRVK2JiAoaipTu/8AkWpsIdJruxeIliIvCKSxjKIk7D7nVF9xeW9i/wBRC8Wn4NhokC18SjlmWVyyuWVyyuWVyyuWVyyuWVyyuWaqnQks43LIWxYUey+H4rllcsrllcsrn6r682WX0Q+iGWSy3wbS8IUiOBsk6IUIc60ZBZIu2Mz+rpLS0hU+gxCdhVGCciThVt2TNbi70n7j9EaOkQLs09HsLTrkJXAk0S3H4Y+qPArDOq3EvBryg0+HwbciVst/p1bRamj6Lxp7Fb4sdyzUagpL6L5RfKL5RfKL5RfKPgvovovo3+htjJubEgUSv96MvkvlF9F9FmDBgwYMGDAkE4/tI/2w/wC7CH84X0HtFEH6EK50Cir5w/7sKP8AfEAEy/cCXr8ocX7Aw5+wMF/ZR/oj/RH+yIF+4Jf5RMgkRa1ZKrp0IdPbal0VI+gvR9hu2Bcy2PjKxaaWjEXpJcDfu7jwyP8Ath/dglqpdobojyhC2a9I/tIWu/nDTn7o/wBcOL90fyCEaegkN+Hwocu028JF8w+WyX3OX0D+51fm7FoD3f7l8muZNCNdzeaEhKfS8DThJK3YqgEv+YQHPxC/oD/AP8A/xD/AP8A/zD/EP8A/yD/EG61deyBENosUy+60PhfyLfzLs/qciUITR7BqtCOjHhgwZMmTJkyZPYRcioJaj0foS+SXyXyXD80hQt+KdEqg2/7/AES+WS+SXyzJXVwPff3w/QuV7ksvkl8l8kvkl8ssvlidQNEsmSOyErk77kvkkl8kvkc8kvlkw22/qI4ECD8EFQcwp8t2S+WS+WS+WS+WS+WS5VvUvX+LEHhqHuNUPr97g9gRz+FfqdEjUgeS27H5k3CM11o9MilCYhP4I0r9CXvoplfxkXd6Gver/VFoK3+8kGsf/NwhLEIUYhVEWE4iTmA5Gll/0Dkcc3gaSX2gRgkuRKD/AJAfsyZ8M/T8F9F9EuiXRp2Ptl+n0fhuF9FOSu3Tlx6EoUKo+m/1L+KJPxLNT3/ynzJR2SVGf+CDJHxD/uSA1GvxgJPwCt/XuvYv4O5I4SRfHsh0rn9I5jpLUtvqr8rNXYlLhEd43HYdpYhpjRHa1nh8cHuMQVsltPYaH8JEPTFPRfRfRfRfRfRfRfRfRfRfRLZM2eg2ik6cDcaKjuvYdzaf2Y5CoST9H+g8F9GEXwvorxRXheiPBo0PtX6fR+K4JnoehEV5V0hWJeEbL6fSSv7PX6jP4Juanv8A5P6Faf8AoP64RVvL0/7FsSxDURsr8pf7fWtV7PyncWmoQX8/w1Y9t3qak4HC8M0Fhqxm3LG6CCwgjYZRLVibR/ELWmD7pifN/Uahm4XowYMFcFcGCuDBXDFHBwzF6IrvavBfT7htP7nMixOZK+v7IcFFFeMmTJkyZMifY3Zp1PsX6fQs/lV4ZjO1wr+SK1YS+n1XK+1dHYW3H/I3NT39DWHPQvp+iSyW19FZJFcXwhLEacDW9/8ABW/DLYexJCU/FZ4O2x7Lf1rR7I9c/wB8dqNF+q/y/sXYm4fivU4UBzwdshLbln6QFLrBSe90fjyQQNwEQ+E2Y05ZDmYrSxSi5VYcB/pJJpJd/Iagi0ynwMvoooAJAXPGIDJkyZLa0tdUL7t/BtqLmZFrxyaR/aP3HpQYG6D+GojsqC10m+WN9k9mTJkwYMGDBgwL0ehPYfbv0+hJ/GoV197CEeZPlvl/T6QUfauvDKxi35lo1Pf0Rfm1eCBmJj4O80J5tEGyZPskWL6ZTbXGv0R0qIfv9/BYTEpdiV/Q0TS50+har2IOhb6sc0/KMcJyNLEzPS0oNmXCN5wOuvQ227LtCBGoewcwSTDQlwraLeQ4gS7dn4fmSWnxOxPol8EuCXwS+BFXbttuEm7fRNTNMteZ+yMGDAljaD+c1eiGKFSh7WiEiY2hE7rVSPavgVCFKRdwwxcG20taH6MGDBjzkyZK5K5FHJDkiPt36fQtkmfFaiZ79xvp9Z6PsXXntXj+I5Hq9/Qk/m1Dx5MkSJExMK0Sle/p/cd5L6I/W69v7jx2kPrfArf7fRsc9mar7fr9C0exlLs6UxoVE9Nvz7G3b/l2L8a/UT0efy3EBnCcVBvX0airFEIoGmxMtiuDRZspmsvdtOjVy/CwoU30JP8ARZzH6Jil0VCQO4o5K5ZXLK5GSFhG4z3+hu4dPuVyyuSuxFjdhFuKkswvzhbFcmsCheEKYaOezIRY6tBa4kLymqYxC0FetfsP2VyVyVyZ+iyyy+hT0S6Jj7F+n/FixSu+sjgkhqmnt5NXj+M5Hq9/Q5tgKaJv5I2fyT/Un+qP9Uf7g/1B/vBdaI606oUk9/S7eJfsKd6JXrzrJhhYcMh+xXpHNXzN/LhSil+jWBT7X0LVez8PyznAepLFF2Wwmwq7d2DLG8pn909vCJ0lqj9wY3JoKXSIo3D6z0I1bE+pnpTa+Er5FNRoxGpQ1wKS+hT0IxIlvRIaQqKEbePfPwX0X0X0X0T2OQNvb7Ivo1SXgQloX+gpESOIvyNQwGrpHTIf0o9bF9F9F9F+MGDBgwYF6PQXgfaf0/5SP6BeRLXw/Ocmp7/6p+LsLa+mv5NF9dv8H0VtU/LcjSX/AAfRALt+O45/h19C1XsZ/k6+EWUXqLenZEtlpwJ+yqyZsFf4Wj4OyhTDd+HW0QnatCaVbN28ONly3shLGS2I3/c+A9xoG96SMy0s2L0KODAq1kn3L3x8jcuXMmDBgTFZI+ZOl+owBty292YJ/wBR+6y9Tl6fyRghMFXgsxyjcTfwPKQHDXMp6/cuvBMEdGDBkyZMmTJkXs9jsPtv6f8AJEjSJp009xlV6rcf08UX4fjOUPV7/wCrfi7DWvpf8HYlhwiXvb6JlVZ8NyJlvH0vLLMp+W434e30br2I/wAHUNEWnUugCpT6HHahQJtNN+6v9B8SRNoQzehLy4bHNokhPx3oT21ITssXvRm37I3cHBCftrkT/qCWk+iVoQqVNLLwXsXsQHJh/wAXpav+xjh2WzJkyMJrQuOF29CcIUoeitEvCRHbT1IepzqMoQS2ZNsJh9DiNJU4/ckGWn+D4Ipojc+VqMmTJkwYMGDBgwL0eh1H4rj6pACabOSX003K3I2ZFyZDHYU/Kcoer39DyHXQj/PDRr9YcIYceeR6Gq07FL6fz/A1NNoaFquZ+9/KlqUQ0I0wse/Oqmg5wlkvYn5e30LVexEl/NnAhWh9kj9HhbmowFvCZi5UJNQU8ktXyUTPVKf6AurNb32tA2US0ak9LRCprQ64JVq5Hq6pbjwce4Ecz1Tg3i9EK242ibt+iIgYnxy+3qYMGCbCoSW7ITWpVlwtEYMGCnshzRkQ1ehFKDIIDtd/tiLZcM2/a/wa34RswYMGCiiiiiiuxEPF+e4+lS8GVv0hjGYlNbEWCX0H9O0K0XxeGIPz/Aer39EX4tQhcHWvgScL4IcL4IcL4IcIhwhL2Xire/pb8/YRlFfwN/2+pnKoPT+/0HNl3fnAvK0ex1+DqIFIff8A9X0P/ky3+bDblC0abNj7CJSWscntaZD1eLf/AFKfBO2+2ksFXb9B6FpL2Od1+TiBbwXsUXMMihY0TmRJotjVcJKiG4EpH6Asr9I+ShR2UQdVL4H2F92OOWV2UUN9nMVmYzVNE4LRMtiCP2LDszJHuJ+5XZRXZXfiyyy+i+i+iXhOR+e4+jNoJEeUsa/cEJQJSy3X07vOq/KH4V/D2Gp7+h/x8vA5JP0BwxpfS8fn14Ss/wBRU/rnhPxqFE/EegvK1XsXZezkVHqEye2/RYHtF8EP/ZS2L0OYnJI0qZtST+WgpbYfxHOn8OBG6Pw2J/3f4iL9v+Il1R+XB3IFJsfhsNqUh0z6EItfQ/RKJOWtPlCUNiPhADbfA6Gg3oKS+BeyXyi+hGtZwlyxT4nkd35/QvovovosUU0uhM27IguJLF2NkiKHotoH5PlESRcyy+i+i/FFFFcFcFcCjg9BlKj89x9Eb+f6eJ38cL0VmfP0ohFhOSerVI/F9hqe/o/H7f8ALGtC+h/x9ib8czuVZV9O0zkqRHvJZn4fj6FqvZrY9fy/Ya9wf27Hd3hO0TE3Qh0v2So59KEYLaZBcb4Ia1TZbTU6SF68QDmsV/SYkflNen+GFkRXAo4K4EbazzX8iGk3Jt6lcFcFcDjhlOm7lltPIiTIeBr+A9VpWns4spCSWS1w1Ao7K4ZXDKMmTJkz5EPY1LPz3H0fe/0PYbs7BjJwNWmiZC0X8b/S40XrD49MeOQGnsxqe/o/P7f8g1L6fx/BZ4QtKTItft+n0x7Iv2l+48sWxIPLytV7Ijc/cw/cSHNbGo6FCbt5I/0lNXJHv4Ichex7mo5Tk5KKw5IcjdjsdWLab/d/EkT2J9i9+HPWDSX3j6BkYanZRoJudR6ChytGpZaJJnaK8piXYvZkyZ8YMGDBgwL0eonaj89x9GY/ILxXOrT5hEBqScr6GbKh+VKGp7+iD8eof6y8VSvfnBgi/EQWeDE+y363+xZTZO0y+GXwx/ArbvjKQznkh2FjaHwy+GYYtHsmjSESW3Ee1Mtv8DoSNX/hwNNfhOi+8H8B3oQ/ifb6DBlOzCHRAIAQZEPhLEBE5fQQ4e5s6IQ1MY1S+Fl42eQU/wBhpEPVL9jBgvgvgwQ+COjRQUhYaE+7ZEoSI6MGDBj6KKKKKJ9nsxMklpVEvJIWhUVARmlKaCUb8oKKH3KR/bx/rh/2w/1g1/MP9Mf7Yf8Acj+2RMVChOZwT/wkanqb/wCeL+0j/vI0MzM3kMbE/CuIEqST0f2yRL9yK3KTqJiUsprh8jS1EKXIJDIetmIb+ZwDIQX70nJ3lb1CdXzRc/kcnyRs0+eT/wA8X99Hw+R/vj/ZjSjOb5hT+7HxP3E5Q15jYyXDZpiJ3YzV4/sM/wBmf7M/2Yv72OJdduSuyiiiiihJHp9yBnHiULYUFFdlFFdmTJkyZMmTJkyT2S5J8j7Ddj+lP/j8N/8ARPzsN+ZEEWZHC1f2ESesiC114EmyS1ILRHYNmrZrrJC4EqukcAumCOEadQSptInxdJDl7IV+IMHSiY1E3Mq0NJ2FdMaL2WRLEJMvkU8mTJkyZMmTJkyWnS3QkMW2gUtOzJkyZMmTJgwYMGDBgwYI6FyN+zBHRgfogVtKyexeRayTn64ICYdSKhAcMh/8EdLQ6YSJdbU5Lmr/AIrvuaUVp1n6pJNRtvgWdpE8kaa1EnI00QsKiSlb+CQQuQkyX9xdRJjVaULCbkJLdirZlXHpEwEUPmKd3vFPQlZoREf6cdQZhkhx41Go0E26TI3QoajyQlUoJueCP+0i5WLoavQTojojowYMGDBgwWtENwTcCXRgwYMGDBjzRRRRRRRQpM1eRRQ4HHhuBuD4YzHrG/rkmiiiHA9MltLf/GZ/46DMfR/8I5bDMZ0pNmOj6hiGSQk0laLY2GzLVOvAlLn+hGsz0ti8RKqKPZ/I2dVl8Gf0IFVV2y/kLkaY6BPQqZfxD7EKp211uBJ8OeJPQYzaUKIqC6NEakhChsSfwyFmqUTJGRtMooooooorsoaRCKKKKKKK7K/4ZM+L6MmR4GP/AMSEy1oSZ8aGpWxs0XlC11GpJfwNljkSqo3Gj8fyOjRS5H/A3pzg+IrPXot3skP8/RS4NijSf4WX1Vf8NR8qH8iDS0eZbYheF4yZMmUZRfJfJfJfJfJfKL5RlGUZMl8oyjKMmDBgwYMGDBgwYMGB+jA/X/iLTr9R+N1iVyG29fPVWNiU6bxNiY2P9RpfifdMnTxoSk0CFCRcHsPTplcVbRrPPZTNtJk6cRzMdiblt7scMv0INUJ3I2BJbsSDBgXowYMeGPDBgwYMGDHkwYMeGDBgyZMmTJkyZMmTJkyaNR+zJn/wkljiT0E9obq8x4fFkNqJSWhN4QpTp1v4S2tMw2UGxx69jcEtLY10JXEHI0x+hkeEXhGRezJkyZMmTJkyZMmTJkyZMmTJkyZ+j4L6Pgvo+D4Pg+C+i+hz0Mf/AIdVI2l+xDH0uF4jwkMYglImt63rUlJ8LkaCXJENaVco2HI2+57EBPo9CPZHhil9C+j4Fg+D4Pg+C+i+i+i+i+i+i+i+i+j4Pgvovovovo+C+jBgwYMGDBgwYMGDB6j9f+J/Ii8GRIg2yEpdC0vYTjI+jRHXAsfTXYo9seH4jyqwl15wYMGDBgwYMGDBgwYMGDBgwYMGDBgx5yZMmTJkyZMmTJ7j/wDDZEeGJSUjg8LcHq5I1ADQMAvrENOEh+NPNovbTzI2SKSPqyZF7MmTJkyZMmTJkyzJkyZMmTJkyZ+rJ8GUXyjKMoyjKMB/+Gmr48qQ2kNz4W+kDYVJaDZu/BLtCuJuOi0A/D80UUStkW9RfX8GUZRlGUZRlF8ovlHwZRlGUZRlGUZRlHwZRlGUZRgwYMGDBgwR0YMGCOj0MGDBj6Mf/YsOniNw+PlmwTUKXAkG7aiFIeJslpwPxRkjsghC6EjBgwYI6MGDBgwYMeGDBgwYI6MeGDBjwwYMeGP+FHyV2UV2V2ZD/wDCUidCSabDcaWW9SPD1olukQbbavkkMQkJEEFhIzZDEYKKPQl/w+fFdldlFdldnyV2fJ8lcsyyuWZZXZR8k+z5K7K7K7PnzkyZMmSezJPaJ7RlEvlGjUnv/wAJktm4s7H6vMeFMxEkIYTFQ1DGxhirH4vwn15MmUZMmSXyZMk9k9k9mUZMk9mUS+SeyezJPaJ7RPZPZlGDBgwYMGDBj6Q0B+h+jBgwYMGP+GP/AI0i4ss/RH7dyKDVyaeEN0MNkjZPlg0FYvRgwYMGDBgwYMeTBgwYMeGDBgwYMGDBjyY8MeMmTJkyZK5K5MlclcmRxz9Wf/tTsm6Ro+/DEMGo/DukN+K8TY2NjfhvxEeEvOTJkyZMmSuTJXJXJXLK5ZkrkyyuSuSuSuWVyVyyuWZZkyVyVyVyZM/V8fV8HwfA/wDwnLTjceYS28JCUuCgkJjEeHwD8Ek+WaGokL/hfR8HwfB8Hx4+D4L6L6L6Pg+PPwfB8Hx4+D4Pg+CzBgwYMGDBgwR0YMEdEdCdGDBgwYMGCOjBgjowR0R0R0R0R0Y8Y8Y8R/ybeCCfBq8ER4NjJ+lp8eFR6EdEdEdEdEdEdEdGCOjBgwYI6MGDBHRHRgwR0R0R0R0R0R0R0YMEdEdEdGPporzXj5PkolD/AOVf/OnBBH0EwcTBK/5hCZ7CoRXiuyuz5MldnyUV4+T5Pkrsrs+T5Pk+T5Pk+Suyuyuyuyuz5KPk+T5+m/oyZMl8ovlF8ocxt/4KH9LVPw9xif8ApkyWXyXyj4MovlF8ovlF8ovkvkvlGUZRkyXyi+UXyi+UXyi+V4vkvlF8ovlF8ovlF8l8mTBgwYMGDBgwYMGDBgwYMGDBgwYMGDBgwYMGDBgwYMGDBj6seMeFqJBjzrHoST9GPGPGDBgwYMGDBgwYMGDBgwYMGDBgwYMGDBgwYMGDBgwYMGDBgx9UeYIIIIIIH/1j/wCPc1eIGjUP/g/rjzBBBBBBHiPEEEEEEEEEEeIIIIIIIIIIIP/aAAwDAQACAAMAAAAQj/lsKepffjcJUwzv2uI6HbMggQQVojWGaUwgoF8A9m7meRWO7D7xa2d3bt7Po9zzqtsVZaG1+g94OKPPyHNMxh40oHe+aHkENXODg32PzPFpfhlKHwItkLPG5Y/TeQlMoEf6S3j7st119gFPPzzzFxiOvhrOeJ3o7nUgDXtpe/JAd1jVBXARieiWksPDjyjiW/HOMB5p7LYTGiLNXAqFmgsbXulRRECGIEBj4cTxEFuGDSzTl1zzzs99Ngvb8Mje9QTxnY7ssKsc965hytDp/roxQKVwExjOsLu266qXj+nPf80Sny+7nP8AgpN4/O9d5xZit+2rZHL3VhyoX1Jy61O4YbVDAzPGePPdw57MZTafPCJoevE88iQupa6MUTbMEa4SRjQP9BqMfnkUgZcacAETnvTfM07HQG3R4RGcJyPHGLhENkCz8ZcaPZog20j29JhIxlArV/tySZ8QAZMMDqHc6C/R/Eeg58j3QjtgUkl/aTCRa434UDHSkse4BXH1hfCCCRTXA6b0FXKKw9y3Zk20etSXhiMoRXc1/UUqnqPsa9RlRFjQ/BODDUzXQgGzFYq4K5Y71eQFBmXuAocglhyNFyX1IqvQo0KnaVUB8QDB8i1jjYOB1JK3DqLw92EcTYwJQLrXlHGz+Ico1SH6QztmaSdJ/FBM94uwPQW6dtRqPyRoTJ5n/jxzXstNxu0BCO2H/BpgV1pgUQeE/BrMNC3CPtAwI4IvAjGn0fauxXB4E5YJDzwo2YFLZt+jeye9VH3F/cxfOwySPT/Q7NkL9Hup8/aiWDMAtaaRQ1a6WieIamqJy06nWGzLuC8Z1it4cN4J4bqS9FosBXCVXnETYJ74qTbPP95r0YYYS7Y/RPcXqNw57s4/PXW+Hy2Lw9AwpVdzFZe2P25JXnYLLvZlLAKktNy+QGeTwCxez3STDfLFiOlOnbq8KJVfjNY39zvC7LYlLVqPGHDRe6SpNkab4OPOakyh8f2K+VwOiN8uV0Wn1sf+oU3Ko1Be6uWCK2aBV9BFSPOAkXeJgz558ODG9etKmcQHKWe9FignqNQOsEei10A92PgecXWJKjf+dCZ1nu73gab6HE6MkcOAmu3oyUcVRutE/wDMetYqaqZWAw2/Ckgu/qvqMZYMpUzGCu3fzjkchheI7aIEC5suqQ5LyvvS8IEZjSMNuMzivmpo4ZLsMLGvBoDeho9jKNwe0AEvTbhD6hcqbttPI95VRbyXZegb7pE/w4qIN4EOWqCsUckswpHOpt0bYY5RDM82Z97Z53s+ejmCue0CBNSDH+qo+/zEycSLFu6SMS9bOp+ztD2oEI9RWe+KMIPhp4gbsecXFW22me+kAAHJBsrht+C/Q9fSA+ywrXFpaabEAMlspMD1HXFcCblkcewmBZZ78v0NFplZhqG7zFTM9/avUnrQnfZw9BWe73kouC7NGh38t/uWsv7OxT7OxODMqt2N8SFgQu3sl10ls62eRM9y1E0sLpZmZCCsNt/mEpGRP3zbQGaVo36egqZ++CuEaYWwZDCdG/CgETW5Hzvd4ZsiWnGDp5AAbMBtU4ztgPXMfADsIVsJoFzAWPoOjcluv2AqIvIe96EeOc84eJGLB35AZfFupCekz7cchaaSjKlKPgN71hTcfl9vHJessr83qb+mQTYHyX+Lyd+h2P5RyayAMT+hEQlzrR5J4Xp7d9lILd5tvbMQcp6MWiN8y3FtOC9MV4qwE5oDXMe8ffsrfcPfpj/yS1vb0jfNdryj1zaZaEaSRPE7NlfL/wChZWeCDd/T3Oq3eJ5D+KYV8orzu/zRHauJby2nO93calxziPYjjd+oDCKf/V/aJw8En9b8eO8V9Mj3XHibrx2op5t4C7OrZswADDlz/dyCCHyohXPvPD+sd8jbobdNTgTiufrx+SB0D2ZW6xQsIo8BLiAkKcDCguU37X7331LZUoe5DOtSTUTtk5++m8mBqUW0/wABkbBocNRiuO/In6vr+C1y3vkiPGbYqxCP2Y8L8tr2+y9AyKeCsS9SzgNozBqgmAtPquMvtn17/vOFkxfgq3+O1TyF+69vivmENP1muwqe16qHAt2Fk+0pG94UUPdt/lR33qPhkOeSIUunkBvjCkuualiBmPZHdbrzw4xK6V41yZNoh8ae2fCz5HOA0xZfjKPUFfTzsbIhPnPfLxdPgEwSg4uaGjbUdK+OnCBqxaxqwFfIQQeHQJDqcTlTT+RtWJJZMxXNOAeAAh/NNwJoSCqC/JE70LC7wkPTDDN/YckZHwYI0rCAh5e/2gUVEOc9scwQtJ5GKL2AvqRP76pSOzy8vg0YdAAjkZSESnsOkM5jzloyC299sEHRnE1Px9dRTt4hXfeh3oQDFWDx3+NVv1K/xZWmp36/J4jzgtixj4Ge0GfAfZTuiUNrjzmHLfe7zNC379kBUbj5mdV6mzlLb/yxtG0x8SNIpd5OKprAk7jTSAFfjy04vxxSrDp/sXGnN3Q1xV3MQQAEYQELMUHhZxLnBF8ATVDf+owwvfPNce28P35TfBhs2J+Hgel5t7O//rJTcHF8BxmzOaCwjrk522ZUIyj05ZFF/ifGw9Xz3BgFv7p0oRL9IeKRcLK6Gxb56qIALaPeA1v/ALAUBQ60YH3JPlZaUpHsH5ztIIrD3zywyv4B8AIED/8A+9Bg8cg8fjfDDfDhe8edAej+ih98/wDAH4fwngvoowwow//EACkRAAMAAgIBAgUFAQEAAAAAAAABESHwEDFBIFFhcaGx0TCBkcHh8UD/2gAIAQMBAT8QXC4XC4giCGY2ChjYVbBsTT1DmwxsFvRvg3wSaiEEtwb4OtR2b4Etwb4EY2G+DfBvgi2G+BTYb4N8CmwU2G+Bb0b4MbDGw2wLhNmeU3tMmdpnaZ2jcX/RBEp2NE/AwwSj6OaNhZ7DjByiQRNvWZ2mdpnaZ2le0ztK9pnaZ2mdpnaZ2mdom9pXtM7SvaK7SvaZ2i3sztFdpnaZ2mdpX3+Rjwv7JuSEEhIhCEEt1k3WTdY1NBDXuNl5ExsocEa5LR1Avkgiqv5Gn/h2QWd/0m6ybrNbTW01tJusm6xLdZN1k3WTdZN1k3WTdZN1k3WTdZN1k3WTdZN1k3Wa2kLf9Gev9Jusm6xCgoKGBJChEYMbBpsEsdnd44k75uC5p2Jl9IhBUpTFw657/BGwbRMxsMbDGwwY2GNhVsMbDGwxsMbDGwxsMbDGwxsMGNgktglYX9Hbz/RgwYFyqKlFvZnaVrWecGOA2JF5GNiLNUZvUTliF3wVO5Dsp+R/DeB2TdFdpnaZ2le0V2mdpnaZ2mdortK9pXtK9pnaZ2iu0ztOtYx4X9mdpnaZ2le0j2iEIS4glxSJVqv2IcvL8LwVwjyMpkwUQrY8jSSkHLKaqId0kKRWEJ5E+AQ2qEkbyJp6hTYREWzjfHG+DfBNwLeuN8cpDRDzxETiEEIQhC5nYViKb4EMsSILMZBGbvFhPBkxW4GxRDCUUVoXt5JquR/isT3UbuDdwbuDdwbuDdwXdRu4N3Bu4JuoS3Uezv0N3Bu4N3Bu4N3HG7gohCEJbkztM7TO0UULsadX+ka5jFljXkaDdlI+Y0ux3MFlWJZYxDKgxi6F3RtMZm2KC7ENj/pnaZ2m+Sk7ew/+lj6VP5FvYrrn59T4C+v5PhPr+Twz6/kcTpirWZ2mdpnaO7TO0ztN8iEJCQhE4b78eYX2fkVNsUlk8HWQ2+TwCijSdEmKiSqEsUmOLCiQmMmsi7gzbwxSFE09/wBLpghqL+7HvWzx9ximNjj6ZNp1EpuxEMb/ANN3JCEEIQhb0b4N8HXH9EmfYZFLB2BUhEjCyEvpGSDzR0oJQaTGr6GsjWR8KXfHnBVUbn+jyGHGcIi6EUvP3h5xUJPIovL9x+FfUpXeGwfERvg3wb4JuDfHC4QhC+YiUdr3g16MdghIg1OitsTJ0d/MZ0XA1nhsuieUNY4RkIZh7mVt5HUWMbbU63tHlXH3jR8xn1C+/Lo+X546BC5o+EIyIW9i3sW9m+RylDnPQpYhp5I69CZeByFPwSuh4U4MY/cTA1OVxRtvLEu2x12FWKmm2K+XYlhtUX/ePvH2H3GfWL7muzO06Pl+eOv7BGdot7N8m+TfPCEIXCEibrGqmsPqPqH50b6MST7H7CxpIikMQaGuJ7lBqcP2HRRzJqsaJcBtkbIG6wI+8aPnx9YvvwaOj5fnjpwbuSbrIPlCghTYKbBTYKbCi1/Rk8DbqDXsacFUVDXseAxsq4MyGot4GzZHbzxRi08C9hXhIZzsyHY9s4+8zZ8+PqF9yNg96Oj5fnjqFvRjYY2GNhvgxsJuBC4QhCGk1GNNCbcIQvcMtYaJYHwOTMjymErIFJTwiunxWomTBt34fj2EA04R8SIHYbJcKPuD6fHj6hfcYbOj5fnjr+wXNLxkRCCQkJG7k6Xt9C+IYlfZhkS7MhsY0UfCE4WonEELhCK6RcjqZnH2XyPcVmNMsd8yURRhH3jZ8+PqF9+D3adHy/PHX9gjdybuRrdZu55TLuBb0J7gT3AnuDfA7SELA9hlPkSdBmIeOMkINCVY+cjh+hcbDtEMm2xq6Losmhr0JRWENRCDjO/t+BFV7uBH3jR8+PqF9zXRvg6Pl+eOv7Bb0XcF3Bvg3wY2F3AmJiEJi4cj+Iy08d+PyIov5tiOUy/f8maoToh5IQk4fCBkDR0zIdCOlwkeQwRlLonhifmHOtkpOhI+8bPmhn1C+/Lo+X546/sEy8X0JCQkJCQkJFEmTHCR0yn2NIWDIouMsCwoNjY3VIwFBs++EuCE9xlhjboO4NkqIJnhjFgdGWWJo9M+KEH0fa46fsEIhCEIIUELehTYLehTYLhjWMGR0oqIbHAw2NjEIJDQkKdjAGuR00NzpnjHRvxwsZFljfgrJiygRw39EMaV8ZTe4t6N8G+DfBvg3wXcCYmJiYmJ7qLuodNV5ohCRlTHxURwPkMLIlrI1CLwNEsDZ4TbVFSkOwJMGXSO4GPJEnkQmNlFB0g2RNAla+BF3UUu6i7qLuoohUV2iu0V2iu0baz+R0fC4UJ/QHzqUWeJDWRJyWNv0KrKMVDrCEd9vt8/x7jtvrS3+jsg1nAlwhqehJsQ3sEsIxKazO0ztM7TO0ztM7TO0SEkJISQkhJIXKCNvonEIQhBVxJQSok7KMcN+icUdfW4IIxhmqyj3PRiRIE0P3GX0IQ1qh637RhmCEXEREIRRCYsjjRTV2ZO8FvpmRax6LylwJThGO9xsvpolWRRu30vuzrXnyOz2YQiisvZ/BYTy4I2ypeR5zzUUh1t+fsNguGK8f7hMpVxSioqKiu0V2ib2iu0avf9iXaJVrN9iVpn3DGaI1xQkoUiC5dJys+nDLGs6hjt2Hxrd7OpuSc3C+JlVfYS26y+fOkWwxwmS8saPDE2pD2gGdpnaZ2mdpnaJCRBISIJCSEhISEl2Km/4lRaIIPgxFijZ9E5eBfERIqJv1LP4/14Q0ENNe4t6q3/AGv6OuGdT5/YS1EOVDygVovgWyUV8kIQiEIQhCFuwW7BbsFuw3cG7gyXu2JF0NehUUeRovDOT9IChJML6iE8jHKiFJXwGfnt8JcfdfYW7BPbfoNLfwZNodNdMwGqoUH8f2buC7qN3HCEIQhbtFu03ci3abuTdydLfyNc8LXwSvD4XsISg355pq+pcBsj8cFffHWOEt/A3ck3WbuSbrFvflZOgnkwfubuRm7kgoKCgoJISQpsElsMbBJbDGw75/QmReWwvHY6i5GeM5ugiGqj9CELtRdjMn0husWMs7yMfr8BTYOGNhjYKen/AEMgxD/bGKMxsMbDAqIV2iu0Te0r2iu0r2ib2mdortHJs/kWsh5EJsTENiHBJYfZjH+Vv7H4oZHUKeB6EeRjiehbS/c+Yliv0NF/cr2mdpnaZ2mXrGe1YneDkP4fEztM7TO0QkJCEIUEt1m7kale/UVWN4sPORmBIjIp2MaiG6DZIdOi+eUqg8c4RcxCa+4az7N9P9ErLG6/Q+P7i6IuN3Ju5FvXFKGZTdZu5IITEJ7gTWw3wLeipahJ8f2GNYkEwLoMYhMWRYVLg2ng7iEouF6DrjroR8QRt3yxLnQvS0/c+wyn/C7gq2GNhjYIthHOKKjGw3wb4EIQhIo5FmRm3kQXEOkKOzshwmKnEKEE2L7EUG6JcrhZXoWBVoiNuy+36njh8dnzF+JS8Sv3IkWgvBvku5KIS4XB98dIxPDmCr/QZQk/Q1R5G4N130QqXXrROx7J/B8J/B8D/B8D/B8B/BKiLK8fEhXzEXfcvsLlCEJcH3w+Ij3nMc+ghGRkIePofHGCehcKLsbp16PI6TH7nvl9D4L6HwX0EFTv8G+Bel7tfkw4cHISwTkhCe44vvhCUuxtt18TCj56uYhunh6GjEPX+mhGPzEPuBPcE/cESRFmX/Rlr9hCk8HuHS26FvRvg3wIQhUc7ehOOiUqGPml5PjFe5XuM2+fYeHwni8vhDOvTRDfzDDhjtkmXnyZG7nhfXd8l0VNWNLhqXxkQhLciW54dnyzB8VHY/RCEO/PsJ54uJwh8IbnMKQVFJw6CCr6Fb9798C3sd/Gf0QkSL+zEa9xcn4HBUuD3zwhISEhDs+EtBHjvnzh89RSjY+S7HlehD4XrUdkvAmAnD934HExar8/bwQaW9ypF8RXTNPD8SEEIW9C3oaOz46xiGHM3PUMvpLvh98IY/0YJDj3vPDL4mDrUb4FSKa+A/ESfmOBb44TEJiZUU2D4Ich2MONRjbwy/cTlTK9y/cWFB+hqkEpw1eEnEIT9BC9sUUwfHQyjZYKnv8Ahd1DSe/4LmSHYxK3JiSW/wCF4QhUW9ke0TvQ6XRvPFGxso3y3+gmPmcdkITn5iGzin4We0Te0y9ZnaOaEYORKazO0zt4SEhISERDR2Gsj4Y/0p6GTiiVGJEJR8QVtEKajGFSEEiCXEvYkRCcoW9C3oW9G+Bb0dP+cGP/AMV56JRjzh1xDJ5AgproW9G+DfBvg3wPejfBvg3wb4EITExUTGgcY/VCEIQhCEIMhOOuGKXtDmyfuvwXNWkIZGtX0QE5FxRMvF4vCEJCQlusS3WJr/vBjRCEIQhCEIQhCGC9FWLoaGg3aPhnk+IVkRBBBLdYt2k3WQ3cm7k3cm7k3cm7kiEJiExNcRXBj9MIQhCEIQgvEKCRCYhCRj2nEKBaUQkJCRBRMT3A2irYXcFKVFKJsTYm9om9om9om9pTb/eD4hCEIQhCEIQhBFNkErzLhszRBeBNBISEhb2LeyvaXcle0r2l3JXtK9pdyV7SvaV7RCEIRu5N3IuRohCEIQhCEIQhCHU5pxYMNjYkVd4EhIgkLndzyiE43ckFBQUFBNCaKhFeMGDBCERENIi4hCEH0QgmBcdkIJWsjZdE0kJISRgwYMGOKiowKFRUVFRUITYmJle0T3Jdzwf6E9E5aoxDBFKJCXAhIQhMT3JdyXcl3JdyV7SvaXcl3JdyXcl3JdyV7SvaIQhC56j/AEn6WeeHjhC4QhCFyhC7/SXH/8QAIREBAAIDAAMBAQEBAQAAAAAAAQARECExIDBBUUBQYYH/2gAIAQIBAT8Q/wBOn2jdkTCjsa5UTVkdLJUv2aF/2h6ryLYIagESA2SootTsUYtcIlg4o74XLl/xm4al+1WLXcdzW5WKlR/5G3Yu9RWKT+QPc0IbiW3kAQooYKUy/F5DKjGoyt/jD3Hp5LujUboDRKNsXwlWou7Yk38gq3CxKjWNS2I7TsSVu8BEP4a/iEINxV0Q2uLa4GRyJuGiMDLLrU/7in2Uc91fwosFqaIUY/iIIOAJVxbARfCPMgdwl4ILicPi/Mp+y3WHeoD65B+DH/hDr5Cz4RJqL1RA+wk17GqK2isl1FbUWXvNRcMqmUgfMCVE+8ANGYLagCjy0HvSlQopJSj2oiMLZvhEOy/YOCjc7LmkHUHWSvM0tQFICoA7NlGC3XhHTC1uN2sNO8dn8DBtgmKG2N2W6iA3EJCoCfYOKlKi+MveGLUBdXK+EohgAKiBqfBzc8dPG7P4AXc5kdrZYTqUYz9lJt2AO/AQdwcr5A+EXgQPETVCcIhGmoXQ5ueOnjdn8CrR3BdgIF8jZP0lJay0NYXDF/mAcHZ3FEsdS70RNqW1YA9zc8dPG7P4LnYY3DoMYJTKYH5L3UIE3DF1AMo+wRNSnMKojGMFrEFymzk/d5ueOHxuz+BXEQNsVL8BBtgSoYC0MFTSMRVPolOk0ion2BUu1EqWguo4xqVGS544Y+F2eh87kT5GLtpn4yqhCGCXLl4rRfYxeo9QutQ2QmiU7woCJcI+y97zc8cPjfPvNx+k62RA6lJ2IeNy5ceQa1C49i2CFds0KgVGKkYGhFM3A3bFRpE8TNyx08bs9+gsarg/2HO42I6jCXLyYWog7gnZoIPrhi1Da5R7LOSh8hZojvubnjh8bs94CibdiCNHJc7KrwP2O9wgQCUysrADFxY7LjCkPER1KlRstj2S2LT43z76mNYlxrDipUCVAhFklzbD9TnU+Ts+0IH3LrKRTdQ/OAGjD3XvG4lxmqhimVAgSpUqOo0dQbgF+BBKZTAbSwQvWU5Fw+CTkuALZYv36rlYOeSYqlSpzAwht8mnspdkD6z8YPwh+4dTvgs3WoBt95HZ4X4XLw0w9wQUehZY6jv/AIIN85FEGXuD5WxzfvrlcQMvNZYo5Ft+i6i3UWDRUqLY7kJuW8KlY6Qfkr2c/gXLj9QR2Yol8W0XwFHodw6pBupsxdny/wDIK1kBbNAZTyBU12dx6XF+egRpguXBwYC2Hp0NdiSqwauZO8I1blXUocBKBURGvF9hoIt9gu4VDXgPsu/Qss9jbkqB+Qw464FgohKWI0wU/wAaozniPC/P7BA8X4qGHIk3/gHYOo8nZWCWdRDzK1Fbud8GOVqHph3OIxNJ/AionENYSOCMQSHYn2XFvC+eDhaLmhPo+td6lRj7aXkX7AFENaxuIsrKOob3N2BRLyeHZU+XP18i/nramOHvrqKwHEDcYm8GHD+Sh3DTgYvic8UvUYPr494+JBvAb9QQBCXBwlx1BwxKJVbieIVpAh4rXjyVe3y6R8tz1IQzXPpl9Dtv+PpFfst+y37Lfst+wX9j7gXbxckM13c/hD0DwcBv29oqW/Jb8iJg/Z9YbVPoIYcj4Hi98K8Tjj29omA/Yyo61NJcSnoIeKV41KJRKImT5GT0doyri3kFx1LYx8yHMjfMJfpYYYYreGGHzuXgSP4YP1l3K3KwLjDT5kOY+JKsj74PcVKwYYeJ6a/JU4nC44/GBbqL9RFTVeE+BDOR/MpTl74mHB4Hqucz8Rh28pOR7COFy5v0A/JT8i2uHh0cjvyvwuXm/XUY1GvngMNFs+Lwf8JfjsyjcfEipT7D+dfQ/sWIx8bl+L5EP6Rvnkoxj/Cdh/Hee4SyoLQYWl41FUYxj/Cdh/CeFEVE+wDzHMtIsuMf4jsP4R3lVFuVgUbJZlai/wAx2H8I7xcXhU0yt/0H8IbwvAIEMKL/AJZdx8bwX/KDh7KleT/E5fAh/B8hPv8AV//EACkQAQACAgICAQMFAQEBAQAAAAEAESFRMUFhcYEQkaEgscHR8OHxMED/2gAIAQEAAT8QxphWmFaZjaY2lGmY2mNpjTMbTG0KvlMXylFcoUdpjaNbTG0K2mNpiuUo2hW0xtGtpjaY2mNpRtMbSjaY2mNpjeY2mNpjaAXylbI1tENoVtMbTG0qnKFbzG0a2lG0A3im0xfKY2jW0K2lG0o3lG8A3g7JaOUQ2lG0rZKN4BtKNpjaY2hW0ae8K2lm8xvMQA2ntj5JRtENoVXOFVylbZRtMbRraeyYe0xtKNpjaHkmF5yjeUbwoc5jaY2gG0rbE2wKcpW2WbQ9oe0vyhW0xtFNpjaY2mNpZtLNpjaWbTG0vylm0K2mNpZvCq5zG8xtBN4vnL8pflDPb7S/KX5wfOOC1BBv1l+cXPOXzlLzyg+c9spvMu8vzhV85jeWbyzeWdOWby8c5fnMbxraNJzmN4VvLN5ZvMbwfOYrnCt4vnFN5ZvLN4JvLN4pvBN4JvLN4pvL85fnL84pvFN5ZvB85ZvLK5wfOWbzFc5ZvLN5ZvBN5ZvOHOKbwTeCXKzeWbyzeWbzFc5ZvBN5ZvLN4gecF2QXZLdkt2S3ZLbJbuLdxbuLdxbuLdxbC3cW3Fu4thbuLYCwtULQt6YvaEBbG8eoQFJYGJUKz5QMA5SjSKuU4vi4OZS0182mSRReD+YtMA8AUPVRqCHpUgj30/mHRavmIEJL4X58QaWJPJGXDHRZbZwg6UWze16J5It3F7RbuLYKwtuCoXBbULYXAMFsBbhULahbC4LbhcFoWhbAWFsLYXAKFtwruLbhcAu4tuLQFuLa5ggL39ADALAX6gBZ3Au4WkLdxcF7QKFtcwquYtuLwZghncV9ZU19MJqa+nU1NTVTU9RU1ARUVFRUC2rkVFa9VBm3NvR5N1BjCmXwu8ZhEARf4MfmA0CrS5A5zCMKOKoh/cctYLcfTz8RyqtmCPKfeDzMw8JMH09etwA5DPV418Qxzsost+X1HRVXiog2owaLgShhMP8AcwELLSHmBjpXNy9cUDhYQxKasgZhQwGF7csBTjAdZcxAIp56/wDZznB9zNZmpqK/xlZisx1FYioSKYCMyXFRUViKiv8AGVj+0qKioC4qA/xiYgIqKYqKzFZgioqKx9DKEggMwH1BUVFYioqKioCiExGBmUYCanG2Y2zG2Y2wrbMbZjbPZmNsxtntHtB5R7MxuPaPaPaL2i9oPKDyijIxhKDRwt0Ru0EaZKnk/iUElZC2fJAKMEUOzzHgorYOLOJZEL0OfUAM2UBQB57itWcfUYP5+Yrw4VgE7gSNpwGR6mO1fF5vc7GwoUNeJaH86SJ769VKWKJq2jOriWEizAVfj4imGKKs/IdvMd7JQXB7rxDFFLt3LUF2U0YiaMK57gqs1KGhFrtgKAtu458pe0Xt9AygQP0Av9AAHtB5RwhcFrv6Bwh7Q/QAgPKL2j2j2+gXBf0A9ouAfoAfqAAAv6Ae30D2gdvoF/QC9o76FHlj2g8ovaM7JnZPkmdkPZM6QvZM7JTsmdkzXCF6TOkzpM6TOkL0hcM6SmBekzXCJOYKUXdv9jUsszXmWlGFSzHgUzXiBpQQSeVaIj5C8XHVZPPCDxperXk/gJxplACrhrRTmuB1BTJAhBS+a7jUhdgA7y6qKySL7LwGkHxywrDZHa/uuoqrwFBeK1UBSYiqhXMoGQXiE8+M12zQocUZZjui9Ru68JkEKuHB+MxFgcEa3vcvxu2OMfeWe8O8ZlRlXAeRJn6AzpM1CmFJCnSFwzDMM1AvSVCnSFwLk3LOktg3pC4I1wmdIXDOkzDMMwzIu4UwwgXpG9JmoZlmBcMwzAvSN3DMMwMOEzDNZk7gEzpC9I3pM3wlOkqAioqKioD6U+in0WvrUPoSNTU1NSegXuK0OSviClxkF98xQUpaJTDXDjzLMAHA9TxnbBLvhPbi9xTrntl/QtxATLfIL59Tk28xmlGisFQb54i7utR587jCrtO5dsrrDRWoBhHNWmLf2qZAoNlERoYcIc8VBQwNJMfeYvRUWufeP5uc6o679pWse2ZX+sOP7yjX7wPGUaSr6R8H1Coq44cJXhLRf6AgQYVcH6AA+gcISD6AH1BwhwI9Ey+oD6gH0iocMwlf0QEZDM1OPMK2zG2FbZjbCtsE2wTcDtFm2Y2yzcWbgTcXTmL2i9ovaL2jA5i2IAh94Uu0OkjLrZiN46qJkbHFpVvLfHgqMAA2N6DTzAroq9V8aI1hX2blvY1lqXxccmA+/MJmxVvjj6PkGOPmI5CuDqCuxgHOQzTxFPv60IizzAVENF+PzKQYYwx9o35tmLcxJTD4ZljSl8xN5dNlxIXmNHX4lAI9BdBBKvw+HUZpX5F1+ZTrD1zUQI6AQWwVaVXEpmwhVUtZ5iiytnJ1FqUb/E9o9ovaPaPaPaPeDyi9ovaL2j2hdo9oHaL2j2gdovaLIWQWATcPlF7Ra7gacxw5i945cwO0XtF7Re0XtF7RZv6AYxCx5hW0HlC7R7Q+UXtC7QXpC64TOkt0mdJnSC6QvSC6S3SfCN6TOstgLDOst1gQEBuZgFQYKMHzFg7SAVVlhn4lzNX9suaPiBVwBuVqBynAe2G3ILmBWAuLfLq5xldR2EyLYZV+BlZburUGsOSjdsFcwwUe1HL3l5j9HqxocBzcyXmxbfoJ44OfETnYJ7zPcvheOYRcl3jOD7w5u0eIE1DkLU/Jwn5l82VuWftqLav+RDiWsK8Fw0GrDAPp6ZdpDyNBbuZhbrhviWxf7xnHz5i9h4NRSFLGama/ISoIwWVsBZWyzUhZWqSsrZZr6SblmWZCyFlbK2QsrYCwtlbIWVtStCQtSbqTcrZCytqWdZnWZ1lt8ZdcwR4MtlbIWWXrEWWTrLdYrJvWZ0gOkp0lOkp0lOkp0lOkB0lOkzpM6ynWU6ynWU6ywXz6jLvCnjtriGcLYC4dvdS0VLeHD1F4PsDECIbDJyrvr9uZ97iRs55fwYINQGra/wAzEq+foQGUtQpB+JatW1zArrQRJYh6lAyPcJQEx+5n+YSefH1IFpcLWfSWpYHo+odkgI0rq3nxcx25Gu8c8ETTBYTh7NPxAeWj1KdGGa4lGOdJxHcNJOcVD0eYrHTYMfB5ijiAojf2gC609QUBztRWF/Nw603fN3MT2ir4y2sp1lOsB1lq4ynSI6ynWC1lOsp1iaZTrKdZbWW1gOsR1gOsR1gOspesp1lOsp1ltYKuMprjLaynWU6wHWU6y2sp1i11ip4ynSA6SnWU6ynWBpiOsp0lOsp0hWmY8zGmY0zGmY0zGmUaZjTMaZjUY1GNM9I9I4DtBRGOBdeOtquCoD3HAFwWmP6l6Y+YHXpGw+YOSUi8RUt8HbHRIeig7MAPlgXo2RObgxja2zb7ituq9SkFKuL4Xx/cx5PRWV8yuZcyGCMdse3MdtXRicyYAK6r+eIAdLyAL9mLhihPfGZbJ9kqocS8z4A5uElOygMeZS0BozAqmdcQI2AitsZU5PEY0gjFCb8v8YlOfHCcwY1wznuBirgUrBz7GK0it75hGEvLTzL0wzhz8Q0i0q1+2YquWU9vUG03/wBgjm6+8Iin1cLdMfCK0gNIqCtIrSE0jlxHpHLiPSPSPSMOoPCHwg8I9I9I9IPCK0itI9IPCPSOHEHhHpHpB4RWkHhDTqOgRWkVpHpHpFaR6RWkekekVpAaRWkEX9A/QFs5m/0bmczg2Ss6b34O3oM1KuHPunqAsCKKM/eIhQ4UjfeFZtkqrej51LzAVeWXnL8x3IXKtwKhVrXmZ1Fx14Dx54gHIoJ5e1cvwREdjYWDtvrUq8+RMsOxdplwX7gT4hF8micy0opcYweoVQ8dIwpweFjC4sOKqDP0w/8AJQhBdAYM9PmZ4IHNsWhlVQalLTSByxBRmNWIZS8tJf8AycAXwGpVR86Sy4XZjeoxUX/iDeGHGgTgrFMMOoDis3CqAcyy6SzNXzAIj1dJDS0v7QfGXfE9zc3ibYti3/z9F5i5ubm2bm3b7fVuMxmBi/p3N4i4uS4tnM3KCVPeXOZWczmbZzLc5/R9zToheiZ0SnRKdEB0TOiA6IXomdEB0QHRKdEp0RXUZghFprEOKhYviEEy+KlnOMjz4H+YPhwIlABly8RLHDgIKAqaA7Y8KJ86WuhdW9wCrLC4taBdN8tFUckDL5xVB/vuywIONEIL3wZqpQRTA6e+paUKVbwPnb+Ibsuxlh8Ii06XXHdrBC/WK23Qd/EOUqqo2aFrHiUHJ9WUbyrn7RjRr3LNAe068yiXUVyLr5gqiXbxC5HPdv0AcOl9w9IbK+0yKDn/AFRbd5VmDkv3AviU2h46iTIgd4u/Ew2qyQ5Db/coJiJi/wAPqOqIZ3GzLusS4XLUI9mBusR2lCf7uUbB6eY26g8IqkKgqBpCoKgqCoKgqCvqAK+gDAX9AVAGkVpCQBBUFWhVPoAbQphTqCCmFfQDh9AP0Ap+gDKDAVpmNMK0wDTMaZjTANMrRmNM9ko2lG0rZPZENpWyVThlRm1AOYRYAKSJl8Fsv/2I1AzyrhA2DwVlg5UwRbXry3iiCJffKi6VxQgu2jhYDYSuQNFHAnXPLcsmiUGWFVWevN4KlOpqxXDPrvdE5MCYyjBi2GgY++4XQx4Uu/EN8NKMYD1AwHPbxEmQ8ABpxz+/VwFnAUBhWAHX72wsyrYGqylCqHV1BUKmJFFUPIH2dMRYUusZmMqKHuZyY8zEWFsJTxzLA0axiZcrpjzGB5GWuZcvg+qYGC3s2xKgIcPZ/wAhm4urmWEoaVbn94Gqi5Bf+8TLAhqzxGzB8RZjnFbjFp71AZC3zMnV7gco5ckKsXxfPM9kqCvoBUFQVA1AIEgIMQIH6AHk+gAO0S3KBBWyVBUFHSgEEgUghtPZA2R8kCCvoBX0AqBNkrZPZK2T2StGD9Am5uCVNyM3Nzf0tzclrRGaW00P9QT6O+XLVfLz3R5jXHETwLzKUUXtOzk65GHtaDwR2/A83qWiQ2aVjAdGV+JhLyp23AW10GMcMZbQFq7NXXjONrqo95YtQNWY0Gfzk4hVrgHOzPoyzEsozFxyP9+JzSri4QfIupSwDObbcxrtCsUCNdgBMrZjwnv4iKnDh09Pk8SoV1JJZaswr/sXGzh0XQjwLZrFc1LaXCGlL3Zz8YllAwdZ/wAwZd2+MfQHVwK3NsH+uUUhRf1QNxTgQhIHBaaCCxxT2dwacQvQT3xBTU0NNd5hXjOgOHT5iAmF30lFTaZYpGVJwezio8N6igqAZ9xXDcZzq4NxaLTf0FotBb9BNIRoAtXUFz/v8RP+P8TM5CnLeC0ju/aUd/tKZBd/tOAUDuXaf2CFEN7f7jB/9H5h/uP3ifT/AB5h/uP3lmHTpj+8s0t2fyMQi0gfKPiJcr7SklWRTaoubYFNssLRabm4tgvSF6QvSZ0mdIXpM6QvSU6TOszrEdZnWZ1mdYXxWKhqXOPk8KKgPAFyslLEAOKDn3L1VlbWr9HPxMC/wOwjjneGLeYK6gCwnJ5GM2+MypYiwbbUTeGuDNFs4Pop8NmGVXRXmJXzpCxousUAAccVuBNzHNWniZtwgMv37YbkHuNR0FsYRlpq2pcL14uoqxFOg3qBWuGX/uIAQ9FYDX793/UKivEKKD4DeEe+7gYIZRgwRSby1XgiPn7GC9csFikccnuIwrka6YCFA4aAWu67PPM6lUPTiYmMXCwjJf0pIBybXwtXMnLqCHPkWz5eQ9XKKpnhKuEUHFHcVPnqWgHL5Fw6lhVVdX4hSOK5xcWTHJXzEQ8mTKxU4zq5fKOzxGboLVltSgIBu/UL0mUgZZlmR4Yj6EHghR7ViFUNn8z8HW5acv3lTn7piK01hYGuSLC5dwC1PAHcG4mRqPS5fB94eG+DH8cwTogSekRqJ1E6mAhgYgNcCV+eH+Zl6d0P4fD4fzKLgxJJdBmdYXrMpxlNcZnWU6ynWF6zOszfGZ1h7Q9oe0fafKHtPlCHy/UABCiLqGl0e4Q9GiiV9/6jZCuAcBCf3CtXBH0aJY1mTsow4M0GZwCM4ZW8VQaMPfEWI24VDlHJa48SlITJiy9FoPTHcoOeZCqNBb+0BRCYZlvbyd9XjqLmFfdpPJEgyBYij49xTFRqjl/udKOSNZfxGHKrbkH2/aZbZqxg9Q7cK7sYlDQE6RJExdcBscK/18QMgSggXA6ATR0cTMiyxwhws4Rfe42yVwg4tvGA5X4rMM6rUwTarQqaRxk7hxwpZRitg7XI4onAr7iZA0FNLS3xj92cCZRVhLw3xuLdfRI45lm6xlRxeP8AkVWHPMsV4M6hsDNYWskIEvIXe4XBZvr1L7YsM9H3HBocj1cJHR2Bdn9ytDhzUuRlWR4huUur/wCQO8P0gFFriKA4EBZOcBH3H3gjJgdZPsejwYnhlUSVtd10wVfP0gzqLoVgdr/DR7+gE4/UkYXwNdnhNJ0xmbN14fj/ADu4S+Zc+giGCB9C4wsr/QAXD4TOkt0gukzpLdILrM6S3WW6y3WF6y3WW6wvWoBsHjxDDIKSg7L+CM5JKt/MHEFF5/iDBYE0txWuV8Ubl2iclnld7qoDQM+VZR81Rq2D51WmmwX3eD7szWCoXYyk30/MrANId0Wfc/DGOFrR7WWmjrDyiAtpGJRRyZV6lGdBl4L+f3mZK5CJX0cvzREW4QX9QKAWatQbOk9R8ybQ1S8N4/aOJ2zseG+f+f3LhLzkVYvKa9eYENaUwzmuVaG3Tji4OIomdKgoit1jnDgzCCYKyDzS0oq1q03cVpgornNqvbCaAuhhy3wTtENz/u4PbA5K2EUVw4rmvnuP0OeanDFtbncrbEdl04L0b88QwSh34mQvNcOpVaGVMVEBNyg6+cTNg3A2LJnITljj3CI3PP8AcMCtwHisXWZNRWPbLg58yqb/AJFvB8EO7VXzAEAlfRzU1MEeEy8cEWDp65r7DCAEBQOg4PtAh+ipX1YwDoWGueP7ful74T1z0wusL1gusvTLdZnWW6y3WW6y3WN6wIqAivphNTch9OpqampAreMseZQOPAEwj0pQVy+IiVD8qWXCVHiKHFtPL4wZQiRuUQFdZOK9faFYtpplLTQK5ei4ybbJ321eayqsYlc7QWKKPAfvxGIhKWZH1AbAKddbmc4ExB+YZGh1aEHnEBqwNME1eYQUi4ceoCwFcoN8nX5PEUENz7Y6aDygGyEop+HXT/2GWIInhfUCtmVNJebzbj4xVIxXUME4NkD23RuBbzBgAc0vfTR4gQNZm1LFXF19rqFNeqVSxw4OT2RXEWjZzRjnPECtULQ2c4rB5gUhEgtcxmXWc46h9WdFsoqtXEvIp3GBzDYU5wYyOeHmOw0l4ThqA+Y0yL03MmfUsAUBVekym4PnKMiFyqJ5eq83KRT0CuQ9UXriM3HBfkUzUckGys01xTkPOZyATyAHVnHvOYQLrkAD3238MQFo0lv658TF5esSy6H+avqOB8AV9KiK2wR/Q0Lmy6wwSAyWx0o/YsIMGKHcwmnGb6VgfE5v7v8AaCPD/jcBJWlXwNzhOrs0nI+GVYpFIfQkPNB+0Ss2qQ/QVFMVFTmaYCKmpx9IqMR8piPlCcfTJxvPnMTicGZvcSnqNyYDBKFy+g5hKsVgwfxfMIpKwSO0Xyc31AiFccX9iVO2HXUVfK+BaCX1AvUVqGEbJesTH4YQXBTwJdujFRKnVQDoaVqETYBJYfPUrGV7ieEs4UfunAMdgp92X+IyetuXz54+8AgRqvOq9zAqDVEzFLlWyUGnH2zmCNauQyGOPgz+8a5hahlA5z+7xBQqMLWQdZw1um+oMBDlW356Pio6AaMOU5v7P4jYSCoo0f8AYatU2q96hOXENOKYwPI5irh9QhgDjMqK+WbiJ5jJXFBZuGsFB1zdXUZqMQDljnKBE0sshDkEtNFxKjZQSjYjk3+8oNkoSh1/sSmFOABR4HmosH0TnPYde4JftV0rg0hvmXQXgCrd/wAVE58nBTf23BbccsrPDf4gzaBr5Gq/ivMIrIuCCcIAEd5isO4fRmazUxNoJ2yio2n72EIsdOzOuA/dlC2hyryu5l5xeyIJahLBXZxjb+ykVQyRlU3j+fCUy4JXee2VznMbxDeWbzG8K3mN5jeY3mJxGdEL0TOiZ0QHRM6JnSF6T0QvSeiHgh4IDpG9Ip6QDpDLxxy2X+uNmFXBaSxsxxEIKlVsFEh/G6NN56/PiK/UtTY+6E9SgsRSz/XK2LCI5x0E5xVcwLo57SOAkMXdNU+myLqf3WGv3lCcXwi96HWBuFRZHUOqcHpiWNVikGRgkbK3qCFgvN5VEJzDZhT1qWdBnGPH8yqyleH8JTbYqBebXg5OpYGLobq6KyLs/liu0WGUqFAE4fkA1Q9U3ruEMZMvobT30RsHKmx5Zm4FBg4IXfNS9ooOjqck4hQXedRfRdihzXMAws5qFYMwIKsBBz2Hz0yoOeWh0KctF9B5ikZUCA8dYqGOpRcQ4fL/ADLV2zSP+xA1LN5OZUEZKIg9S5VlauV7hVFXgYnCLxDZqYREYZuQ+ax8R6IWI8OyXCQrtKC7X3K+/Oy7wyftLy4BJy27nER4RZfECzeBA6EvkA0e8IR5i4doZHBM3EaCcULl4H0DhGf6+8vXDgnNhA/Qg8E9Ep0laJWiUOkPBPRM6RvSY8wrzMeZjzMeYeDCBD5Q9voEPSPSPSK0hw4iqrkQUZrvgeIeEuq0HlfDAalbALxTx94pEraBatB3BwqqFeYHSGAe2+ovBsXldrcJyFgKK+R1bGySNqfb7TkmKCkhvBxb/NRHhIi6DkcPMY3WKUElG3IYja9QI7Ze21fLMPB2SXyyXtCADQqeVXMtSJj7Zf1+YYARpwy/AfMZyEjwC8nGeNwoUA2NJZxh1zHuFCzbAcdZbZh8D374joSDilYP4/qC1sVlZ68+8RtRAMBinp9wXaxsHLoxyeZasBkZLnCjJXVzAADgDz2/NxdpRf38QlnAeO4GcxrHP0GogbS2CcKvUdTGQv3uWgRkEmueM41GGaqjkTgcblwoSVGhqKbQYbp4iUsq9wKKg7MbkDFeRuKxgB15IRJ31MBY+oXGFy78TAO5ylJD4NgbVOCdJ2eb4ZcGXRTgPZxfeJWeoTr11Dj6MyX44ejLtxFcV+T3hCM/LQrbhmbhjlxHiivE/QOH0/195i88E8EeCPBF6R6R6R6RekPhB4R6RUKgXBcZjMCxbpC9JnSZ1mdZnWF6zOsL1mZt1iBbKxVttnNgU7MsaSx4Sw4A6oDJdVKr6LqJ29r0Mv5i2gKBdmEK+wfKzDAMDd+YTtlHIY7XQPUWnEsPMWMw1kpwqc6u2Xt2sUovXPEHwVBp5HLLdMJEXDeYrk4+/wC8G2WTmPPPqJ0Fsi4xm+RyPMXWuAXhkTp8PN9xxVlnAvY69caqEYVWRbq6ovNZ8mS5TWrUjJHhfFrN2G9PQX6lqophSg0HRGkEV8l+qgKCIU5Vqw3laxdTIqy0YgPB1/2WVpVVTZ/RMkwixQR011CKoWQVpGQMqbGXuIMRWdof+wDTycNX0xLjiEIegOHxKXjiIV9DBSJyhmEbzhawW18nmHhgAoXT06PBC0ch9Adr0f4ivCObeK6gImUO8G/vRLuHLypM+WqGaHB5ePmDxlAlAcfCGxrc4h7YAprCDd1y/MCkBsjFRpAlcEMq5MZr4jA7C+7j/sW4L01wCnTDTuCzFJBlS09nZ9pnh4kXg5uShvn6DNypry3GzyP7P6DbrOCbZ5ym5vZjL9qTlDj6f7+8tXwJaptLdYXrM1xlusL1jeszrC9ZnWN6xXWBBHPSUxTFMgznWV4wJpkGQnM5lHWJlWvPca+N0Q9AGWE3YblXNjyJxXLziBkhZOXapanabYGIUKIaHnEChsUP+wUVh3B4hXamTnPqIUTbVjzF5qSQXdMVx/PN+YYTZyH7CZPtLBd8P6MZzPQn74gJbafnKn5IdseY3i/tHXCF29fGviMtXYA1dcWHERtzfwGRs6erhb3Rgv2PuXfMZkFC7WruCMwuCdH+6hN1XAwHB6cUQEqJWAzsZ8QjSgY5YwQWRwUPHUIQoWpnw9zAJ6WGXL4cdu40VQKvLDCleA1PdzM2W6FeTivUERwnqJWF0bi4gX1iceFuwY86PMrqI0CC0ax7/MbgTlDXZEUQqQr9hUeqRyV1t8Sn4CHV3fqqpii3zLtSwW7I8HKV0bgk04OCeaPStxMLqbsDgzxu2EY1BVVGFe8PEEylS5wXj7yvOHMoIiF2JNKq945pkuX55441COFjPzqN1XGpkIc1f+uDuTqKXjqX8H8QLlZGHoub0znhhrgf24fRmrecOTIb4xu5vjGeC7voHEZ/v7xq+JCykhitQDX0M6/o9SjrPjCtsPJnDlnsy9meyeycOU9kvZL2Q8mDtB5fQMoVOHBwDtPQGVjHnR0aL+LL34bLF4GqNVqUR8ALf/JmYfS7nIBVcd+oXUWUs8y+TgoynvBKCniZxFSAXjtjBWdPOooGlG8HW63/ALqd/LTfUMKKcUdRbG6ypn8RiCI8Y5+YqAN8K59E4gLUVcp5hKqb2Yf6jqHVwsctBiyjDb2RBglFeE4fBX2lWI0C0rFfvMxcqlPZWMmPG4dqThVZHPjn8TnD6WcfMA1X0jbx89/EEcjInNmfvuNBRFlunj/cywwKWCszgvhO4sBSW2t8sszF8uUKMYv5lGWBfiJCsaBfvxOILLq3nxgW8ZJa52Ng98dHj1Fzai2msH7Tmh1ULUtYWXaxbTuIAXGD6WctlBuu4PAZit8s8PM6WR1r8NDlLcYwXEZa7YH5wXyzRx1DFCgUC2LzZTvxcMAuSjL7h1BUoYfEBEgloOQex11Kjj9bQVyYecBXNkrPsEgWanAllnYkKGZDUS084UrnfcuZQMqnPt6jFyWfTBsRQoV2e/6Cja1nBBcorQW0DbMK4ldn0D6f7+8dGXBHszMgvoNcHKB9AGC9kuC9ocuWF7IXsheyZ2Q8ie0e0DBe30AWoWwFgO0VtGHcUI4lMoeD1fLwJQZI5dfQdEAynYU83eZVkjHr4OyKlwWr/l/EPbhdiP7vtLOQnInEBhkBa83ycV6uPEshHNSpjY7iiL0vREYl80ePcSSD2OY6aejBfxFwZ2djBA9lqhDvETiICVdno++pd6DHHJaHInD75jwSGForJTfYjzFcAcV4PGfMSy+Ngr3ZfRjHmpSiMZUO939/zBuWBURxaYfYjVsVRTDgFq6OTx7liEbrwz02yooPQUcOs99xQKeieKc47/icCDRTofmZQechn3UWRVqurOsRGyUsRVmqM+JaoLlfDK2oo1dw5L1iXBCq09wCRYuFgULp5f2lwgYqrX5139obKY6bAtx9ow4tXQUfaXbf0uRWKx7iNQKcJbQcgPgLr8Su2cCkvNgMvfURi0WLxV6NPuLJWD9oc+zDXPxGLWKgS2G/IYG17JUkNnfCkHVtuNoqIZdJYG1KdYzKGVKushq5WPobgTzwncC9ou314PaE6+ixTvC68xm5jzRl5jkkro+gfT/b3lwZ4ES4KjmEoXtHtBBW0e0JB7Re0W7IrslYj5Q9p8oc85XnCt4HnK85RvAN5RvKzzgecPeEKrlcAtPACwoHkwAOfls+YreOcZlsI9BMwbX2lkiY3topHYzEMlP5FgkOiIHJefxHM0wlLw14ZU1cm4VkwRxogHDK3F2e4jagI4WXzg3MS0YIXzeXvmDTgbPR1d9f1KOLSUFWF0unDCZCIjWtCxAzQxYfAzuVICCwAeaGTyxlYcx02omBtsscItUeHGZZwwhpaarvj5hm3Sq54X2QqePcvMhRhfLVKTLBS16PqZJZz7uO6c4/ePA1W1F8e+ZYXO1Uuv8AsVIDwAmf/DXmDeVKtCr9H8QgSlFXfPu5ZA8jiUFFrsTvctAc4xUI4+0KzKAV8k5GH6dK2Q5pcXdTNLGbDRwlVMgsvXj6BbRLzIZ43KQW80Ku9wKGxYLeoagwdhdbuWICvqTZ5ibR4aW/vR0TUeiPkWPZmJl61rY6i+IjYHFRJURohjAoBwKX9xPiDjYFyFWGfBSrxACINjdwAPoFrF9MCTad4f2/0AsUvPEDlnC3iBySl85uTshwjP8Af3hEeJCZznth5zjW0Dzh7z5z5z5yjeUbyvOJODtLNoJtLNpZtLNpZtBNpZvLN5ZvLK5yzeY3gm8RzRXwpf4lr00M1d2PSOZdOiD/AGGBFtMUs5X7GcaT3ARlvqKrvEqtKCVLQpcpHmqvzz3ElH2DnMwLtS2AXX+3FJ7VsGOcU34/eBcpWRvrO/8AsDAOyi8Ls+f4gKVwShDyg7IHRTRLvL5Alon8Sj5oNkMJnEKSrI2BRDHLT4Lebi4lpjlXQEu7rOJeOqCeXN0viCAEBQ9JKc4odMpmK4W03GiFtX3+84CkUoFfDeSCA1MCwXVbwSwA0W9/MwFUxkv+fvAOMEpys4PMviApaqk6Tm/EQQQ+qjz0rawOygWoqIHmmEI5ZvgeoNagxgCgT0fuzERZnFm6+I8VffH0AXwcVC0go4suP5C77ikpsKB5lw9goX6fiEdCgWV8/OAlWFulAv5iULw5b0b+VeKj2iL+B7Ec/v1FlSAAi0Xj4iAZeXlwFccZY4xtrAtaPAnh7N8LLyXNtyG5ER5DvPEWwum2/ow5rqZG0K7YhLL+3CdfQ6z1n+yVtnGXzjV84yzOIrsvF9EjN/8A98ZXLgjLc5XeIO8vzlm8s3lm8U3lm8s3mN4VfONbzPiZgWM/UGf0ACBhHD6A8ofZIfQlTIkcBtfUtdCigBteqiABVLn/AK+JfkiqaD6/uIupBV7ZQ7EofybGNak6tLIbo+Xq/G/tLvMXXEY7XLSkrFFuxyX8TOAhGhdwf+2RC5EXDPNf7+5eVnpcdUrTl6Cx8TMoR50fNCZUApWBu7w/31HaoVheT4liBVbVKTrG+eYQwEVpVsCzdpnnMVhExVnMw89ZuZXKAUvC+YmTOKR77qFxLKC4FgLOA1jfX8QYta9E5FoeL6IAvJLow01LtiihVoPMKsXuqmHI+rqYlYdXg+IaBGD1+9YV8niXNkl7KjnAvVa3GiTXS64PpWMgLHIS1+0utXD7M878x+pOAHO8OSPYiLdyNO4aJcjIvjmlzUHIFHaHnSFimTJ5ndwqz7PMIPgcSFfD8S1EOFmN1XVgUDX+5gezHLlujr931HXWDhaL6Cv2lYQQkPCpofIAeLlWE6jE4q80WagxWyV4feKdRh18/wByZHMZOYW3MZuYvl9L6JGf4e8xPAjsw/oA/SAD9AIcoWHUHvK84BvKmjeB5w94TRvCjvMbzG8rzleU65RP81sbqG7wWtDF6KvfZHYM0d2rmGuLHTbagfjJ1950wywFzKGW0cH7yhsx23EAr43BqJF49y2g1umKV2V15B7io1uAONpWZR1UJaDLC8ue+Ri0jnq9B4dX5YooXXc3eLt+7FKHtTgPTW/MAZfYJiWDVYVF/f4gQ1dVT15jpzldc1/UWyc3zefUvtu65ivGE8xXu4kyXLRqr+IDgIvQ/b3FukFlvt9QwLuy8ftBKCE8pES7E3EtDzE2LGRGi6rmLhpJYbmjKiVQVz4xZiWEBNJx68QZsK8TkWEDWU/5DLBepQOycZMR6tioLeUBCFNPIUnY5o4lwm7ga7xykAj4K7agowfZ4lyIOXL4vUv7kC53dZxqVpZYo4YOYhPFZT5c74IVJbKar7WzJ0b+v+Ou4faki1FoPzV/P1a19MDzib4eBH9v6CM1bzhW2cPnHnlK4ym7PpJGZ/785x58ENMi+8HlK8oGOUrHKV5R9p7UrynymNpRvCtoVtMbQraY2mNoVtCtpiuUxtMbSqcpjaFbTD3gcXIXOq3tbwBlZx0eDYy3TSjPOMSlhBhpYebF+DxMHZuzghRtUKx/qWgUyl5mFYReSvDxDAm+avjfiCw7uArMMHFHAkvsaKSrL/8AYjWCmKMLQtZq8KcYuNyHwFOlPfzZ31GQ5hQNeUTj51GGgLfDj7wNl2Gi3Hf2l0gMj9oIKb2MVMZUgcDiHJZrkKMLVVXeYw13EawswPHzAVbT+8oCoYuDegdWxy4y0PUx2GL+8IM/wfxLmE92QaUxDe6c+RGVIfeB6fDmCQBfDxK3ALbo4jUOIgNFOQacMyi7D4Nf7iC+ZykRmlA6SDTOMrAsOAAg8jECYpjHnC1LtsxFBQH2Fwa418ykKCyw4DwwvQ45YgRW9Tlh8zuLx4xLE5jjFvECNKLVocWPfmHFCCXa+334It8zTCi4oUAurvqGcoTgFYD4qdfRyZqJHalndENCu33hCMwz1nBFuUduUdiVszlHKfpBGf6+8rTLghNoMs5TeXthhzjVc5ZtMbzG8K3mNpjefOF+IX4mdkzB9ALj2gdoPKPaPb6DhA7Qa3lSqjBWhVfnaclVdIDA0AHnL3McULtQc+YCAOSKPtFLotziBWpxXn+5EZlSy2E6zqchKKyCcf8AsXBClPD/AM9fzOqMLMXV9x5yK6Fvxz6jYyHI3byA7nT+5EADlLztVQOaec29RTdlAdCnefzf2jKNSbdGxfLvmBUX9laz5evmCKGTkbuJYUFdRrun4SqpMkRZ4MqPGDm8QeNEKZ6HmGA8+YjWQG9e42c5a4oqcCrOXH4uFfaADm4OVLC11xfxEkqaCumDWjjqx/qK9yVlTFMolNSUw7sNVJvHMclSu4DEHAbzFactvuw4qtMuv9zA+ksXXH+8V9EYqPPOxMryTUlBg8jn3LhuQ8h5LhjTnDOVQW3/ANmLjLwwWy32g9r/ABBi1u1u7+ItGEttasrS+X8xbCpRpy/O/ue3qAWZyDoU2r1KA84wQAVUYtMBOvouVV5YWWYHthImvF7wIcRn5+Bs5jNzC25jzQnM+FB9Gf6+8xMnBHtD2jFzFbQUOYukPl9BcBkOX1AVtMbTFcpjaFbQraY3h5fvANoeSe37z2wNso3+8yFZbPTL+CGq7ouyji5vBmpzBp4izJdxYDd0qGzu47dIwnI16l3LGsvDAGk6Vauyq/H5ZS6FC5VWOTV8MVJUWFKRcN2VBIopDBfgOV3j8S50AA1cnWdK5Rli7KAqOM80DfLxdMsBtbfP5tfvA+RUxwLTx0fmChEHJef8RWCxcb4liX9a48RRyQRqxrmKUcDqYsUo8ZlBQXT/AOwtfN1iolADPY/4mQDLTfj3COr+W4HF5K46/ic/PAdLqVzC4NZhrUPCzTwExjd4lkqIBSE0ZBGx+ZgrqK6i4j/eJnYoy4wx/M48rRrUtvP5iqYOWTvxLbW0ouS/7qYHotYl7uS/iWIykVsonGIeiFtS9U4livbEXd1r3A1Sk+IMquUVipHVaUnVW5mACALAHm4NLUCtuSkKcQSFGEyBRfb8osRlMxcVS84jt+8AVI/sw+jKZS84EznKXlxy5ymM/vEYkd31Hj6PgVz4JTeebPI+89v3hhz+89sxvPb95w5/eUb/AHgbfvK2/eUbSzaX5SzaY2hW8xvLN5jeWbwSucU3hW8sO8xvCIfA42iJMSrJ8sDAz1cTVRahgjQkWHm/Uf7ctmcWHlCPhuvVMzxcuLwisUt6wvzBnoegqwnPRV84vUz0BFYG6vn/AHMCBHM+GKeQPEZVBRpbp/H7TKnAugGL5/MOoAmQtfn3monZHgZcNRRm6t4rqOFQFaVvHPxGDR9pQGWlp8XLlWD0XdyjYGro/hMKyNkicrPnuAMpuuLr/YhUHfAmDOO8/tFrv7dwTFC7c/xMHoxYai74IWA5RH3MSsQ4xc/0nEB24CPdFRwEHZeDzDcoCg+Ah0IYXz0feIi9x5hKCijYr/EcCcmRviAhV0T1cEPPruGJ4Gswg1y+ImquBWc3C8eyDCn03KspXicHEu5Y/DDCMvD/ACZnRdqc20zHPvW5B088/n6DNyoqHaCUyiOQ/wBuL6ss9ZwrbblL5ynbEXzlea9UOHEfpupTLglN5TeM2mN41vBNopvMbzG8s3lm8xvFN5nxMxnxM/QZjMH1Aygp9AQxKgQX8xXW6hHq4WuBUWplweqlUY5fJsw/Zjo4pkgPnDOINaF7Yzj4h+i2MhelLgv3M2Q8P75hFPnTTG4AChVBqz5/mV21Bac1X9QUW1woDfOVXXFFxNC7NBwbzvqIYFbcmXq/5gWAjp5f6iVowIg/EbAbdJdt9+ycQw3mJS3jVTlhY10SxQKYF/cABmHLRXvHMuJRxQV/UwU0vk8vFmiC3gNYiMKycvfx1EovyLjTlivKB2kIed8I2f8AsXBQ9jCDaFCWbYXoDZTYX2alkEtpUx+9Cw3/AJ1FJ4vD20/mKyeWeiLAguroluOoHDBbQOU5X7QHc61CZIaBhi/5l8r5iUFC4TUL2StwHiFdhjpY1LMCAGVAAr6lf81BV5AZXuASoADQcQ4+huCvPF3mAZXzV4ff6Ovoth5tC1sWuFaAowf0ScRn+nvE18CWi6D+kAMIYGUV9AcoxtMbSjaAbSjaAbSjaAbTG0o2gF85RvAN5jeLSyrK3FNfA29XooBVDxgIuEaolChRwWtB0G5ikxdwNdBGabZEcnpUB8ugHdHPkr7VHnCkuLhb/wDZbaHIavkqUqPClXN+4p9qasXERAAvCHe88suyYDlVeOq4K6iIat4Rrd8XDCBHvPjJ94iCFlLm3uUsoHhH3l4aKjg/8gFgFc3TXnUC9F31mKUaWBxQ90SjNoYWDmYHhT4mSAuKnELerDEpKWac3HgMJxWGOHhvzEIA0cxl54MsClfg5iHWBtWYgJYlnUIbDRQVj3GyB5C68Rhsgd6nBKLEx8v9TKqDACgNEYwIMwXDTABeLi3IH5joFW9EQUsS7Qs0jqZGKc4hNNFigEXxxA0nQDiJQAh6epc2UVcC8fB+NwYXEGrW9rJ9p3BPZDoigS+uCZoOSdZH9r6evozGrzgAXOA3gO2U4vKHEd0O4cR+j4lc+CE3hN5XeAbyjeUbyg7zF85RvKHeY2lF8ohfKfKfKfKHtPlPlPlCtpjaFbT5TG0wd5jeXk6t7NWeaJ8w4zQXgOXbNAeKYAb9D98e1zMwh2qOf5nMnLag+0qzd2CIcqBxcWpze7YMLw5MNzBi7Ob4mX9CnHiOqh0XVsJcAGyuvtBQISsGPGJxVKGtj5ILivDgO9yuqqzf+zGwN6CjxxFAOlvKv9eIJSLA+mGBKRG+XrxKzmVWOf8A2BOdrFsvth1KN9vqKXIPaXGlnLx37l0Kq1U5Vyu5ecjK4rEagj5IVi+yAJfisQpRp6hOUHHMZ5bY8Yh5hmBNn0CUTKm0jW0fxHbsLUxRUemwcr2+HuYTnK+DiKrxK1SYjkVAVU2niVhl8SxqbSvocLKoPJj/ANmcExmjRb7WMqqJxZJpwX8RsDXjSLpTi15esdZhEdkwvq+fiLAg6lRT+BlO6nAuPi0rgxj2Nl8zOEm6yghVtK3yinbBnnGOUsnP6GP/AC95SuXBKbSm0BnKFVzjxzhW8a3nynzhW8+U+ca3mfEL8TPiZ8QuMxmC4zFwP0AD4GTFXh9LjuWF0uM3aK8qZC8xMKHOIAsGPzEavAc/xBPV5Eyesf8Ak4FXlYMfjECxw9l3f+uOYOQEMQVpbxZFTwLx4iAytceIXqqZvjGJfJd8KwMK4/MUcDjUcrsOuc1/u5ehwcHdTCrpeaH/AH2lCMOBQtPMSy1g5PGfxLc8FlQZdJg47MxaMzBf0FO4K8wwMTgitjucwPoeCGW7x7GHw3mhcn/dSjeHkk1KLFj7Hz/2Ojo0WcfMQALzMJ7gMculIShqzyK6gi0vseWVxVc01cVoGmvl6mI0VeRL/AQROYpTmXbnNx7D5NwjQ4mAGMXrO4yg9M5TXmD+FVkE69OnGswvtgLU4xy1pqHIG5wPZb118Qiu1KLguwfPi2UrYNOHhbxdxg0VlYUsPglit0iNRiIgiAoI6wH5YosRZ/m7y9fAjYW0LLMDCqcxw5i9oMvqA+gNwVtKNpjaY2lG0o2lG8A3lG8o3hW8Q3lG8o2gTgIjmlp/eMCgGFHmHAM+YyvteIIChTBoo8XBBVf8hi1XWMMuDgeGuYhZaE47O2OAsHBEjBpxTi91LwY+b5ggRbXkqLV0HEBjJfHEQHaui0iSg4T5gmBp4r95fZdu+mWpfBzipgUY7MZWZcpvzEAF9AftArKlsxCmFvb1FQ3V/wCzM8SvjKlQQdTgmOGP0sg+ldNw5bQ9rL1LNdjPuVUOuY1JCmoGnGhf7ErNv85KB7YS3HBsM1z8Rz7Ruq83GKLHNh93DEwNjFr58x4mSqgL2Zy00S1urX3YgxQTqM3bQPQUfTo6gRRzylZC5xnmct8kVSsdWS2nLDVFiRyhM5/zDckLxupwrvHUJqS5V22uz3k8x1GWMwE2njAz5HEJYXaOP7PUtLlgaPe8/lhUJDlw4vQdBB7TGMcaCX7j+YABbiBvAdqHZK6OUVygFc4jpzG8oe8o3gG8xXOUbwai8fSkbm5uRk+g2xf0AwhitA+G4lZzpXRz/M5kKrc9UO/EbwUuXI7rUVm01i7/AHi1rO1SrsacXqKuq1jBKw9yge74lqu3HHiKEXlc3yeZeWEeBEH2cwslW+GWvx2wF2Dn8ToEs8RAc31mKklsaWVllKDbG4JQctxIReKw1mXjEOQa+LnUfvF8y0WOeMS3dDqLLWb3zM3zFYu4iNQghAxbmJdys4gQRGjac9B7eoSLLOF7g7feD3LAxwQI/E4kyYxnavbUd3G0ebz/ADFP2hzX/okZUtxau2sB/MS+jmDt6KvJv79y0Dnh7qZuXvhjtq5ZUqdziNCj6i4fOIlA4goQwykFgcbOpeFnMpdeYAAV6e5TaaZOvUCW75j9mDdWtQUHEtSvfUuoio2NCp/xEOPoxiwM8fyG38Kc/wBIyRk+gvEcJvF5gygtFxcXOdEzpM6QvSF6TPUMwLgXpC4Z0mYZkLIwJOCFaosY99f9jIuQCKK3y0ds8bgEIi0s8YL7xSu2cKCjTTf+ZztphRd/3GccNXiNmo3hbS3kvVZuPXAvvg/5KOUtzRx9+JTeElg5fNfzELVO+h6r/eoVxSlvOfNs0QAqh/mc1WtSqNk4AJ3rcyWBBO3TKPZ6qo1KD8yymwULm8+JdDj4m3LNq83OHNdShosXF3UXFXxDmLpPtHI1V5NfMCKQ8O5flGnMcsRE6SmCu0qBCxB0WAurzwSqYIeFM3e+BneJhjihRgB1HU6A0Bp2RS3EudgwnTiUkuUoaSIT4O4FqGBOej+0qQ04r46lhbHk5hCuJhefvFdX5IA0ylNBd8S/9K+jDENbOeI9McbjKDXEJmlPRDUS0PvALlXPUabHp4l6Fbiu453LuR+Z2NVK4opxeY53bAAo9MUUPNWUYfFy4v6MUGm2L3hfP2KPvFzhHkkkuReszULalmWZFwtlnSZ0jekxphWmFaZ6M9GejPSDwj0YeEBbiPSPSA0hh4i/TAAXKQ6MXVYmTRoB9jeVd/wRCUyKlK/waPDzFkaI+X+IYqjhnRw1XfH2gUQLRZwcHnvpYSrMqRtD3h+/9xKW8mzzxX719o8aUbpUYxYf+K6lKcrag+Tnl1iEKqebVb/vqZeG1lXUQsHxhcEDLtalq18QCi+OiGY+cz+gzxMazhepjHjQmN8u4LJTuZGqJYdxaq4rjcIKf+kRRGwrAYtpd+D4l4EtEzfzczax73GxmAmfvv5hXA2QXJ4AtlMhcH8Rb+SZD9w6ByitaP6bhVwwDlTBe15fKzsIFgv7/wAR1MHZxPD3Bu6c08xn3ydiXGC3hcvprXUcaqTk1F4wFLinXqFh6KxwxRIPiXwpMjmXDO5WYCsfaFwWrEFkPKwfEQByZbijZbqc9AFXp39pVCqLxCgUXmocklY8QuD5uYWktlXmKuHF8Q6hrxOf0c+Ilw1MJw7VGCzslDpyWP4alC+rmEs0uS67hLIAFLOz5d6nXLGKqlyq2sVuasXOIbPEVpD4RWsesesVpHrHoz0YmkFwLFuktm3WW6y3WF6wXWC6wXWW6xXSW6QN6Z1FHMo8Qq4p+Cvt3LXw332SoJqGr5XGO2r+BiYLOVP28RCCuXXHmDRwCj22+JYjmZXLFCwO2+oilmUCrrmvt+8shbOECyujMMUbC4P+wXDVGCHbf4HxKAo8uiNg368Rw3EVUdctxnhbO93BdTwWotMtWeyZ7uqiUnGraD8vcww3VVkWZvk1kLZdexeblPLfuVQiywott1LZLTNC06MQAeaqGnKt4DL4I64IaAv5vb9pjVacjcjer4lUCNWat210aluUg3mZwEMh02eYJUxtdMAIKociUE5DbB3/AMiFAo5Ov+afvAK3x12TKfW9S4XCOupRUl8IMoPwu/Uz40nfuZRhdyWgcnzr1z6gFwZwdcB8ZdFTmCcNnPcWC1FZvmCoaDjHUrRRrrcBAGg8czAI9Nn8zuSdXqWKVE5cai1i0JcH6ijkUEWWykkcSDR8Aeyxg+XRqCmi1dlS/wAUyFB5eU9URRj6ep6xfkxXNZbrLdIrXCW6TOst1ltILpFdZbrLdJnSB4QHSCesp0gOsB0gOsp1gOsLrjKdZTrLEAyms3QLf7KH7aZUCo8HKu3v/rLCnZjNxjvZumzzXipSiQopw/bUwXkShHj+o1u/aqvGoN0qe6qKF5YHBM9xQ+W4iWy3MpfKvMWAVo4l42c38S0tL/TctMssqJceoXSwsDGW1gUKtBZFOrx9+JXUAMAGmXXX9S2wAcoH9xV1XG5TugJSrx/7MSBb9p9vzy1fErZ2ifs+Va4gdHmIdRd1L40XuLxSPNXGO72+fEv5OtOq7+LmYaaUjDn/AJMMR4fxKWmirNfz3EoXxT+7j+PENZL74f6fiUTF0lQZYqOU6mDboC3CxsQI3H1yPdvXxnyRweFLXV09W/nUquWYDWb7fVfePjDgAzX9VBwV6pz8PKfieAOelVyyyKxVVxRqAqYoikOOmXZNq57K5jduR8IHADZH9AwgRHrXFDIAF8t4xFRby9wSLTlNejco5kJm6x0fEFYkpATQnTxBTUq2Bp0nCeIl8ZSdZTXGA1xlOsp1gOsp1lOsp1lOsB1iOsp1lOsA8wrTMeYV5lHmAeYB5gEAQBFEVSKgitBm6v8AEFVligLwzt8wYbXxjnf/AC5kNuKDRMOQVsb5e78RSrQeNeJgARHOIBgLu9vUpWfvKjFYcTrluEuX9cyvpUqV9QuXx7ot65iNHwJSTLsVKlKZ1y/Eyb4TLDyGhj3EBhCc27228sN4X0YWbmIjju8fac5v1cPb7fs9x6JqpzfaRLCRzauYSHUBh0GXSoWfTROXQ7aeSJC0VtjK8EeYXVtsS94ZFEzANC8y8otyLiWFBDDTZHbDeKv2cTOED1kfZlMljNB/v3liEA5pz+ePme2oevn+YNOE3hXKXrbKJyvVpVMK+OHooiAQ6z0vXx39pWuQWpg2zJmhwDof0Qz5PbZ19+ftC1wHfEp5c4vUQVfoQ02qMyxvC3Ke5VfouXAuACyj4iZ8xX9kUqGb8IgrThxS6jdPBklSj+pHNwm+z2SpFEVCoVCoVBIBCvoFeU8EIafoGC9JbpLdJbrBdILrLdYLrMnWW1lusSZozKKnKnpivGNnUZ1qDBooP3/eXngnQXePcxi4Ly8xQ453Aui/vEvpiiG0pKlSpUqVKlSpUr6LYdxqvX4hGbsZLwVu+oLJMiPC856959QVLpSKF0uwPHoGNHFsBotUi8X5ywjaYNYyfDGrpX+0MrQ1TR184PmbAtQPgCZBo5veyAUF/BmHa9TMp+IgODfOJbb8lRaDk1gxKBWATeU7pcV3AYubF5IGZccYv4jufDplYADoyv7wRoQMKV+YisrfA8wm4HsMHojlSrjcKtLV/C9EAYxZcrj+x5fiMWClb5eD/bhpsLVj2zNht16YYJfI2s0i0GQAHa8fxEPARDTUDocxpr3HCNxHyBrOriowa2G3/nMSgp08JbKB6bj1vOnEeV2bj+nOYBBhgPRQEcvx14hihfXQx7Hnzi/Mv/SOyCnscWd+593RuknY7gDxnolukt0lukt0lukt0lukzpLdZa+MV1gOpTFMAxSdJTIMgzTNM0yLWA6xpELQ9nMcEINvQPca1xRzX96lJB2MIIcVUKcwDgiGoiMJLly5cv6c/SpZ9I3mg8wSscWHOfBjHzMEOVZXTvy+5YLg2st1YK9U5hpZCMOjBtXHGKrniK0BFdK3TwfmMDnLdmV7h2opzr4IwWTnDJ0V+fmKhuJheYYQS3xuVDqJT2s3OFz3vMZ1a7RAT0VXXkhJrjWeyZqNVlSrlcocQ88GfmKOFhUUAUHDGwVW5bh0FJdGX1BKfCdw4hWIVubXPrxmKKqvYI4OI1X4D+fvEI61SFZ4P5ftErQKVaWf7v4mLW2c811/b7g0GdQWTgK7i57lVgz2tBvLFaaSmwxyPMtYVnmPYy74reQVvTUrKsimgUMjlDGOm4CgUMA68xnQdRLKy3f1XhEctG4medgiBgLq/wCJweousx7O+Y1xKVPPiOM+6Zi97UHRRO5ggzDiux77dZmDo8hvHZ+TuKODLaTOkBrAltJTpE0SnSU6xF6zN8YjrCvMx5mPMxtmNssvlhW4ErmLNwNOY9o9oPKHygOmEUluYJSY9QJC6ZWqLqDVZqLMlepzd1sieYkYxj9SDCcnUL+8GrhdkJgWluqz94WCgZuvAOcQCUO+b0pCh2HMKLcRH3PuM+4Dvysg+uiwv8RGuCCm+2jzZzLO9PGK/BiONRcgKrv8R6QgnhRxH7bvMBacPT5iOhlZXUqSK5p07jFHJhCX8OkEo2umBCOZdQIt2nOY4VbzQ1HuPGo0Hz3MoUpFKsiVdC2YgnCGCD+GdvRFpLWAAujr85lJdvggTdW+5Y72TD9/vx95RZZ7oluuJXKRHptR5hb9BlypQXpIkTUGAEvP++06SZ/iUKuGd2T9rPmDa1V35lXBcXN8+YvpcFBaQnKL8wFgHMCSiMMUBCK70csJeZMGZQ7unjuYKkXnF/8AYXrJRx4bo/v3KotxL8TTs69QuEe0Fbi6cx5IvaPaLhZ9A15gukF0lukF0lukt0gtJbXCW6S3SW6S2sF1gqcZ7EbwwheAiAoWghDI2HYSvg6Thil5Ixfr4UElxD5ijmW4IlzGwVzmFhk/aWUq/vFQrfmjn5/HNxJIDkVkMhm3O78QNbdFwh7WRp6jDaNrMfnw6hNvgMoTlxi/d17mPCg4h9Ix1Zefx+8M9buF6MS6N1v4l2B3j0xaj3wzF+Yt7cXLLtM7XMpJwhmCDCiqf6lCUWuQ4rtA2kqHOd7YseD8RFUdwmSvG4FK8NwAWA5VcE7XoA+P5Y1EgVeDmAzaK/Kc/wAfaNCiiplZtcs2hs7jeqX4SkKf3z95epz+Z/fXAzdI1gQ/JfzAO0ABGkvkuz4gUUwzzU/vhGEqzb3FIvmOWe56/QNfQracsADD5O5eutqjAjO4KDQJfqWpXFnkijtSxjO4Sm9QbtnBek3/ABKkjrFH8Kdn8MD0S2SxW6wo4y1cZbSW6wXSK0gOkL0mdJTpD0gOsp1gOsp1lOsprjM6wHWAnWZ1lNcYDpAdZTrKdZTrA8ZTrBXmdnUbFGP0sA18sSlgPJzP4/MwL1Qv3UfzGqgqsDvxLICr0F3oxFZON3Ai1t4hY4cOaX4los0LqudY1FASLgOP7hFEKwKpq+K+LjXauVEHvD8wjzBAAeaF15FvZLIQ6r8GuK+C7gRUoDgehfEJez74qKEhU/GDESlwWz95TvBfsShVx+DFRfzLzjuU16le26Cq75Y/vsaLt/ESNR0Mvyw3AHI5hRXUBQcSkWdQFl1D4ojKNoq1gcEYAaO2rl+GgpXbwvoP5g5fzEHCnizqNxvt6lSFXEHeiBS2itLr9v8AkMxCoM18nkbPah/4kFd0wY7yYjBNUDd9m/zW7mWIPYoIT5QfMBLZAI7fEWBcxYFtRwmDVELwP2id0r4fqUNsTdyhDj8QbruVuEI+5BgW3SRy1UydY7gO/wCRyB1/U5AAAX1A/BNfExHSLw6R7EyOmKOsp0lOkprjK8ZTrKdZTfGW1hWmFaYVplGoojEFXBaKH6A8IC0cuI9I9IPCOH0B4RUAgGn0AgBbw1VvBVcUol82xtLyBxd1Xvx/UoxEWBYpcWdRWA0NcF+LOInkQKvHPNBb5uAVFqLVw96A94eCYyNcu8Tlqt4eOZer57BXxr7X7jFBwHZ3VX/7EpouixWf9uMUrXVpQQXV3eAM/HUABwk74+0ClJGEs1XUQ4cJL2dvKq6YJQKkBYbC5XziIbsrhV/lExWVoUcM5pybdqZQrHRokKLQ3ZyQ6PLk2ipffc6nSuZTvA77+8dUF7Za8ZIwZFRYHP8AEarObjbho7i0AqtEyzLyxg38RAto7YK2vwa9x70MnF57jORSrVyR5+eS+ZgKgJjfJuXqHke+v7ijMkcXmztcpyOTlHnl5T2xo+VPiVcBBVm5RwHn+cRcqQqgOAOnkOVy9Bgg75izmWLGDi/ocytTfJxKJB5ERqKpXzrslfSjLKY6xKuTDqLvmPYKO5RsIo1xjHuIJGoGxL6/nMXTQJk/u5U2WQgstKR6fQen0FQqCQPoED9RWYMfp+fTupOP6/Sfo3qTmVqSCArWJAC4QQvXMxcaUxLV0AK4Rbc56sAAOQaPS/vKIF0FI4H3VxgrLODn/kBgXBMgvq+4GKt4TwzWcnv88RrRAAQ03lfwS3iqhCttM1dULP4jwM23YgnDi/xUvOCXhDDjlza+2vEV4arsOD1X8x5moojZss4q+dYnIa45aPmCAV5Q/jRT+9wqhAVNW8Xnw8aixTG1IveXPgvMAVThTYtd/fxL8sAqObWVAilLG1g+R1EVSmaMB8Tj3TTmL1weSoW8/ek4x9EIFrKDKuqdwpCG+47ytqKvOIkKxBzDhs1lW4oCJy8w5OuuJnWFZb4A3CIAuuw6uKzWZzyv9dTI25tmUAFb4lYpY31y9VLpx2qe/wCokoJgUPgDhPfxLCsHCby5Q6OB5VXF3Y6ixZUb4SyLg4DogLxx9PUyQOn4yzn8Yo4lQ2TqcMG+3MGrXxFGkqZlsVcTZ0bh1sDfJfxM7I4WUF+IZziGFmmEfz4Z0QYDALB6t8JMX9f9kvRC9EL0S3RM6IXqC9QeEZ1HpF6R6QeEHhBeoMOIDSDwj0jLqA0itICnEWJiAS45hKE4OBSx5dQ1XlsiHIHa0YZzmNWSN0O/4jvYpYPxeB7LoIJ4BdKK+IM01MDy9+PiDBhebbN1f4cTAweE2u77r2VE0HhUVzaryZNly5Vi0bUWbrMvER6tlc11/KCwUsWxfK6jkrhxZR8xapveMqP+QgRBfKnhDr3DZXDSFl+V+IBhXAnr0r3S1uCWNyxfSAGCvPMUAwFYxVy0heZ/C/xglhcbn/nmGWK3FcGjz4hGmiphrL/0hmooWX0nJM013Ogrbf0ZWqYLyrC48RZMMZZcvJ1G3FfMBD3jmL4FDUHC+WWsGal85StF5evcbW2V1zbHHsirF3uOnWoVUp0HRAVXDIc1qUwQOjxCoFKP8xRcVqcsKIPL1KGcD7E6bY4g08nMPCEa4hHqE1Cq4jQihSJdyD3Gf3fQWluNS3a4xiNcIDSkM3d3HCdy0UvMZT7YGmB1Hgh8I9I9I9IPCFtxBW0K2lG0+UA2lG0K3mNoVvKN4VvMVzmN4VvKOnAN5jeY2gG8rbCt4VvMXz+8EpyY6ZUbhNg0pFQHIoko/NChQOAJg8OZyPFXE6HJ+MQY8OTqfAPQztmWavBi4BTlfOMQA3xyU7+Zm5A74FvxR/ELKWMHH++8QLHsxksG+iCQzkSw8tOr9SgpFytbTnKwLIdLaiuNDmrLPtxGs7Qm/UL5zZyNt/NUOpQIcMcqeBus+iG7ADDa/ijnpj/qCrweKMc1FWgtHzf8yUfMDkObv28RoEbdOUaJUWCXe7jMp+XAftE80PJNSn6jiCDicYN9y6K+ltYI/dHXAMyuAZhTglzVBgNEc104Ze6ISb3sB+RKqZsFTuhzXdNxoUuY9bljORZEsmz6j3cpAci3thsjz9FTgtlrZad6jUvvgmJXxOQGoKvT/wAQFXeY3+8ornGt5jeA3juQ3hxgwvh0ytpUaqMilV0lQSrWVseLjIBZbDnx/X9ypQtVvAlPHw/EuKbKfZzGt5RvMbwreY3lG8fJCtpjaWbSzaY2lm8K3mN5jeY3hW8K3mN5iVkrN5ZcipWbyy+cKlZXOCbwRwO3EXGHCKIu8rRwroOEGfnnXV5w488RXAoMM9P9zGbnza+HmYISVa3pLm1vov7mCBMMNjmOxYO+T0QlVG+Xv/MQBYhi7K15d/tCCgLaA/ZrOYATjNWU/GupTyzSlY+ZkIoJRy3Fbs3TdF+JRRFxi2B6cc49MbfZSr6B37YMRJYWhl4SpI8ldqgvy3DujNci0/niecOL/sxDepLecxSzwP2ijk/R17l9S+JcuGf9xHnjLKAiq9jrpl+HQK42Cn3hg6QNo0/sfayHpoS8Dl0AZZeeZhhfPmejooi2UbhurinDKo9MA0Cp1ldnPe4NK8TDbxEZcriPMGGgzHMV4Q8rQQirX8nB6lM5fIOvEoftg0KYFHuAHaLXEKO8XbLN4pvMbxTeYf6pRIHvMJ3Yt9Ri9hV+JUKZQBobiHi8OowacZFLX4/9ghoup44H7xreWPeNHeY3gm8RtGt4XsluyZ2TO4zuC9/Qe0e0HlHtB5Re0DtHtB5R7QeUPlA25g8ozuC3cAWtaXfHMb3P4kHoN+qeY6PDU1YLqufmpcwFLHPhEXFvFxtstfLcYMY9Eq1y1lp/BC2XIUL979SwAQxQbIrdQrvN+2XcgDNjmIA8FpiCAKDz/AIN80LoUEWkA8Vm+3f5lHlMGBp/hXmIuC02lMu3EC8relC/R/ENACYJ5Qo/v5lcvWnuOndx95l08kttiryxCDlghfevocfQ4ly4Mo8DHsQNeeuYTw1NLF15PMoKL4E/4WNYUEzzZX5CUjSsXOD98VBBQaCq4jv4vYVkDzyh8ilPYk/IQ+Hc80sfUpWI4x9BMOhLmD3G05l7nOMC2NnHm5ZdpYxUjvMGnMcOYPKM7hdoy7jDuPaPJAEei4F7YsefMVdXGNURsrqVM0EvmlxTWS34ZSMt97Vn4/CHaHyi9o9o9oPKPaKg+gVNecDznt+j7fomH0pHhPHn9P2T2Q8n1A88MpNPIusvFnU1nDHZr8E5hxhRgCmwMV7WXfdyyjclqg8UYzBbRQ8EZq1ohBnOh/qJYOOaIxFNuNv2/uKzEKsi/iGQ5tRTH3jRaggX+cQWhFVioyCzbyoGdDECzukxKKnYxbh5ICy4WBfFNy0IcbV/EoDVMWNMB4vn+5U8AsdDipaZVl3P0lF9AtlW3lLQrPJ9CFXlohX2JcuXDEqM48Yd2PxFyYybVV+YiX8AC/xcEDsh6iUlgvhv8jDU0ezT+1EahSt4cfzHByx8KfxLviCVEI133GdkQ26AKPASxDQoaJyHBbE8cukxcZUqt4JjOeUv5h9Z36ukXy/RoOZeIhbPmIHiM5BggH81OZgHBbVwhqbauRwpee/ioPpT6rnlipxthW2FbZi+WFbgrbMbilcxjce0cOYs3B5Rl3GXce30AIKg9oPKLL5gQZYrwo1ixk48xlrdqzyJ2LlVolZhw4gVZhAo98y+yrYFFxcCLRzuFXMLpnyR2zeW0OIuS71hXzX9wDiq5TjxiUqXXKZ+IjZsd5tmHIxw2UMG2rHwEM7Vbk4/MuzlYrhTzEqo35+/M/renxLWekolOC3jONwCOHhzr45jkX+Tk/mGYfB5h5CosBeJR7ZQdn7Tyl+cS8rhyfR+pcuEcClPwx+Qg5FKbioKekP8CR39/Kk3+Zw8gvdL+SIxZGtB/lK1RBa0H/h7iuBmAqTCwvuMjDEoeD1vxDpUJ1wwUt+0QrZ8miA8MfmZ6kqb0URa8oUdxw5j2jhzCm4y7j2i9oxv6IQUcJf9w6yqHLBasx66lYEKINWc53AriWQ6qv6+0Y82dzG49ouDEMQUgXpC9JnSZ0gukt1hcrZCyt1lshdYLIW5WkralbIWVxWssytJWT2A9F1eTuP+AhVU5yM7yLd5uoEpmfYeIhQYC+YyhIUxVwu2y11xcEkop8+pRcV7ZWq1X5g92HAzgIX45jZy1j1+86qGeEv5hgEZqruq2QLoHfGF/mG0atnA1x/MSAAeIv8AvKVTK+I2AQYLWqaviA4OyBq6MX3qZCtjwk4DE7efvBG/gf7mDV+8x7vuMXhgNEsyMH1LlzpkJ1DMeX61WXf04M0fY3BrZANAT94PEFflpIVa2j/wdRID9wB/MUj+jDAkCuoznDtfJ+YuawMF9sZ28dQipVOU/wAHmdVrnw17nO4bb1TKw4PBC8wq2XbHW5jtixvUZczMi6lmpZqWVlaSVlbK2Vqk80ovVQCjjMRVIL942yVWYqTUcQGkGBTRuvVnqV+gpGhb/mK6QWWZCyzJu+EB0mdIXBekR0lOsB1lOstNOsp1lOsp1lOsB1lOsp1gOktIaJTpCw4wG+EZoljkxzOJQMgoyWDk9wxXPyTKvV4vqN0pte1VZvq+5XhtDnuUsnG4rXg8stwY+IQQWnKbl9ORe0oPmUq7bfFe4LlQPgj6EtZevUU29VXJj3FfGYMBQO6lQCtmfELarKvKwP3fglDDcBdiajhktv8AYxGcc8D9n+GO8o9B/MAZVbgSroOWVwOsfU9fQhs4Zzz9DiUBAacDBGUIcGG2Npyv8T+IdBo3ul/Mrza3xJk7UPgQ/epatkGjJ/EYHTc6jY+bhp5afb/DFBoBbHr4Mq8BDIOGD159zKLmCQtYCGxZwNdzJjfQXC0z51CsHBRNVoLTjM6xNM9Mp1jd8ZTrKdZTrEU4xb6/MouQy8CnyZYWWrGzolU/G+Yqwvagcb8ypgJc/FfxA6wHWU6ynWU6xvWFV3CtsE8y/KX5T5QbQQvyl+UtfQHl9AO0HlF05gdovaB2gdobOITsIw2zvHTT+CMF0BKMdZNu2Gw5AKg4pRcwqWbmYpuRu1dc2f7EVtlO2H/dxQtK8JMs9cx+TF9rEIcJ8ESzSt3GrjNxHKGref8AXGjdreUev7joywIXwLGeStdwk3+RTglQGK9dhTnigwer7htW+TtIgRSZxgYXdJ+8eLJiiy5Pme7lw+nMP2wwPr6OIzu7ggWwwxGEWrZY1rHzif4RhOE73R/MC/2PFAt6cFLiFgFKEV4RgU8amEGgiXpP0ByrqUy4lxSXtXlZrrB1AcocNpl6Is95HY79RUlq2ssQIqzhToagWFBlYzhh49RVXy7iW6svoADO+evoF/QKg/QLlcLhcLiB5l5ZljQq+5ekG6zi6/r3MhyRggCWLRfVkoCD3tuFGBBYXtF05h2QXsguyF6S3SW6S3GEt0g6ILpL0QfqAC4BguC/oAtKhYJSq9owRtm3xLUOGBogmJnXXk9TMFx2H53KKoMqlpW1lvMBHDGQML61XcBXTi+aihwFPQcSxw39rljnrBUIK5M+7iXOD1EwS9VOYV4KneW4AOfCc/MvgCnLNH4DjtIjBI7CHmqwHx947Uxwo1BZdJhOvCa0kLNhqtOotxagArmWLZxweYttrbMv0z4+hqC8PEGR5+iWhFkHAqUCCsizABfZFUNIAFh5Upu4AFoxgSKN3CXbC3x4JCxZq7qIPkD+6MohddQ0yUAcQuqVeWcNx4K8wuKqx5tP5iPu4NTbiJKctxlbADbf4JYB3DVcDCfGAxWoqQNZgtcZbXGXFdOMvTFiuK0rit0itQyw0MQMJ4hKmbTN9wHNdVO1SFtEbLDjVVXDX5idZemXpl6JbpLfqBOP0/qakPqCCKIYUjChcGfwcsxJHUxlfK3FyFhmZmKaVb7gbRwgs0w5QKs2dlcnfiLAQtmqqo0Jh7hzXcVPUEuW4v8A2CvFMXgZaqxvU99xHZoAFq6gBwDIp24npdS+Gwis6OFf3iVmtpSV7Obl1tWmfMudHCQRli8dCoLC7g5iNhy8wLDnAefMxzPiHmY19CMFJDmYW1mGWEwtZY+/u3R4gLADDBBBj4ixhDuXLw18y0QeRBgosnV796iEWMH+O5VlikomcqhywIGiBe3jHcVeyqJ1azOL230MXyzCKhPoIRRFEVFEUQkWwVHTWSrzFQNXkcUMyCy1qu516sXJX2jCRcx/L4nKahPoVKE42wTbMbQTaCbSzaY2hW0vZL+gF7JcBAMCNo7CzvWtwLyrMxLYxx0QURYPy1Lcjm4aK3fzimXVAj/rgHkCZWOMu7ieeDBeo7VAL6OCISjOYBeLrzD4meVZwx99TJW5ZN5N4xx7TWNCwItF4xa53/Mdqiyt+9ncFvRBayP3iz3OdxzbS6OKK7fiCgjNYL0mPiAApm3TqWiqXrwotjteg8blw9zr64hX0OT6Thu8Sy0FrNxv/CC3MYUCYBKmWZXzL4buC0+5XyRlLP8AC1CoHctVb+tQbl9Qa4rPcvw4hEuHl4JhOUOjLApHLh8yhzMgfQre1M9fQLIX9ALgYL/SAAFpABVIrhUFXkGSANr483cWG3NWsDroisKHz7jW2XAsFwXBeyF7IX4heyU7JnZPaAdkp2StiHkQNoH7h3EadkdhFahBuKFwnjuNrmC9QJu4ZolpEKFVjuJV6iHm5CpZbKp8RV6sPIf65YiY1XEYYliX7l1zcFqZuLi3OPtLGJKdA4t1alurgigtWm//AFyxF4jsg2ekvHBi7xFklC2nEHIHFNASC3rHPmBYKcgr0mIYajhqU0WO7Yti5B8TLxjgjSNepm5+Ywgag2Og/EWmIlBUPth4NxZmBKItGJzAG3/yWvBxO4cGLZpxMJQ4R3A7ly5c+QShcDiKhjOo/Jl8TCPg/c4IkLlYI6Vc9zyEPL6gE+gDAQZ3HtD5QG0WHIbVU1mYJyOPKQpwHD/cDCLzx4gxRUlw1TIa5hTsno+gPKK2itiBARXlAxzlecDzgecq+HFvlEdoj/J+IUf7PtKv+j7T/VH4iokvChf3hwYMNPSBXiM8GE1lLrBr/GII7P8AHUQHs/1iXRT8v6hX26/8IC0g5vB+IsBzVz54ihOeHKSUPt/UX/g/Ef8AEftP81/EHcf6vE/wZ+IMqg/x1CSWFS34A8Ar8bjI9NVcxEMDBwB3/UUAckPHqHEc/KB/EdAEBf8AIkurAS0ueP8AUw0gIG/UJUc2WIu7aFGX9QnP+jxMiv8AZ4gijO1D71Osijknc6xC1xEvJMeHap+Ij/V+JnsB1yP2jxIv+OIcj/m8T/FX4g/Mv+uIgFCciSjKRFhBF2eXUJlP1aT9oMtnH3aoRIv/AE3TKPN2of8AFU6koS/+8BI3qhgBS/MyZllXGZiui/wS45yALfBMytvb+plk/wDGoPthRc/iNMfcT/3MOH8if+3j/wBZP/fy4/nxJ/nz/wBRE/7EG/vwmyvBIwwCVYLaz4zCe2z/AHyvafUo3sAvumWnOOj/AGjmmng5VV0lhiotFd1mI3gG8o2leca3mNvoxtCt4BvKN5jeU3i6iwp61EPuh4TyPvPI+8vZ95kpagCu4bQl7llJBvtKPkdzTrb452fcnkfeP/ciPNvvBHhBarQG4YoRN5Vwf7fqNMjl35nkZez7zyPvL2feeR95/wChL2fvPD7kx03uN0sq5WK7MtyK/cvB3xMX2GFnLHmK2wB5feN3L7xLt95/6k4hAt0Mv3D7x+VnY9OvoYs5y/mG2CHi1EY1n0UfEy3+aW/2T/1J/wCpP/Ui4dTvzLSuXuBYRG4WSLnsAyDtHuFplhsnqo/MIejAr4BGCZyuv3Zd9H2l44PtAMRWUBKYafzhhlfY+e6L+YNcuV18rr6GKwJuuwplDbHqGDxufPiBct+z5TjAgMAFBH8+LjKrlsD/ALU/9FD/AKSYf5ULv5U/9xD/ALWP/Yz/ANDFsv3kD/YhPgngG2vtHajvFjszHcqyKRsH+YE0I8RxQaBPmm2HQnZX/FTBx9kFX4qUvn9pjeY3mNo1vC9EzomdEL0TOo9I9Io6h2ICPwjv/dh+jxIhVQqXXNRVKCMFKHSjp4dvxuAAAAAFAdAfoUBVAC1WqJwNDTKto/2/UcSj/Tgr2v3h9T9BAqo4RpiVGkECrxcRS2v0P0yZOTJBuUVnHKnxRLDDAuDcK+Ef5jqvmcq1V5/UH237w0v8XjmhLQBasBGnsBdyA42LjiW8WejI2iuWKrl+lfTll3Qu/uv6iqKtYxBmLtTlBKCQdBSZGUSDgGk+F6aODluEpPqlAETpGOw9fvYcyohPmJH1B6fQXpHpHpHpHpHpHNQLaFZDH6lSpkx5VlZsNtTB+0P2SUXsBfuTIhGbr9z8pe+I9IFg2g3ogmmYemHgyjTPRlaMK0yu08iVWW4n+Tp+g2tX/Wl5lDLCi9SFeF/vPb0fEBDQmgOA/QoGWg3BadG2q2n+/CXGYCn+6xfffvD/AOAiQJ6lxYUsaabMh3Cy/oY/Qebv/b+w/MpWI3SZoMIGSml+y/s/X+M/eW0cKL84wwwC+N06CV4NS8k2VVtV5V7Y2sQzJQrliqxShjt1G6FvA9xVyx+hW1isNrv+ZUeV3DK4seDft/aVtKJkrqOuDBnaD++/uJnOqfyliTNDnxKByhW0s3mNpl2lbJjaeyWbfQeRCYFBQDlxLJ9HtxYPifZMkP7SVNfKD9pUkuUN4r/Y+8aeGOXDPRl6Ma0wWLYti2LdYLNstctPP4zP/Dh+ioXX9SeeB6iUcaja6PmEXoF+Ve15WVKlRaM8TiIMp/p/PqZKgSo5Ry1/88/Lfv8AoAIRYOpullfI/wCNzPWX/XcTaT/1uYr/AM3uNaV6/smem/8Ax3H/AG37y7hv8bjTaDf/AHjQmEWDuMeX9dMlGOuz4aliQIPSNJ95kfpM5i/EB8oPl/kGvj6P0v6v7L94NF+6XwRgMvrhR8xY+EuoZgG+UZEMDAuBnFQ9mJ8oNXC3vCvNYPuxbsT0n7pydHNgfcD9kyj9K67v5ryGR5FnA1Jjil/P/P3hVe1ysxpCGDPFAFfuPzFCIEnMt5haLOHH+5zIzlH9w/2P5n+K/mHD/p8xL/b95/jf3Djf7e40Dw6JbwX8Ram2bZF6kNb250pvmjC0r6sq4joB1yohrTjS/sENLJdJ/MtfDMz+MChyI48APw/Q2est1mdYrfGEH0D6Jcl6y98ZazGKzDif6On6FCF1+0hTA5Z7T/B2zkpdX2ti/wDP0LUs43k/k35vfrnonSTMKQgKnflv3/RTqMmGJwfadQfac+Psh/ohXgPtFcFvU4Qr0RkFDVStQB6Ccc9n7x5/QECK6Gmh/ZPqzFUavi3A+x+8peJiYh/uUPvu0fMu8vLn6MQCCq8ml/Yfpf0P237wh7Rno1+Bl+trX2P8xqVX5l8nEZoIt6WJQx8z5GXapfQHQOgUB0EQKtYiFab1CAj4flljdEPA33eTpdwiwBr/AHUBLWuYg67xLR4wEFF0O/69QAErzldS0Ub+7Hbm42xP/UP/AGMP/Qz/ACWYv7Q/BYmFyroGVgTrCNUaS610HlYjrM6wF6xxFHzg6Npg2ytcjmBUfo+7bKHSFtcEAkU2i8gBzthUVAZaVEDW7+eplCLArf7QjG2hGVi65/8AYG5qc/TScbYVthW0xtMbQ8kPJPImTlMzLwz/AF9P0cgK7waWnoICNq2D2H+Dr6n0Ed1V+Tfk98cciXTLXlivlHVZiyj/AOOfmv3/AEYEZrB94mpAOoF1DRPFGQGEE6Pp+5Hl/RbTHqBs+T9v0DY2W+F+1nzKFxMDExgAf5D7o+IfR8w1GGviviF/S4/sv3lsdJrTYplykwrMKwkKwdRLyIRcyY1flcI21T0CKq1tZYAAXVwzwBwVx5fMX22V+MQiR2ONRwIwLAttsy6WvcHU74CEw+HtjwfYNnofN9EBKoanmWpFV5cVcWyEBB7IFJROUwFap0Rzbs+7PAS4PZK2g0cysphverEcWPuNsvcrZKftt/rfZyHi3UCrsov/AGHB8s2xXBxA8a8meoBDdIH7gf8AkrENSrsHD5X8QG09k9kPJMbTPiF+IX4h6T4T4Qhm5gQyMnDMl/3T6P6a+nEuYa829HC4qx6BSjCMaXmXvMvF7JmW/wBvPzX7/Q+lhPkhyXg9x53+DxOQ/wBXif47+I3Y/wAHiBf4PxP9Z/EX5/2eI32f5PEH4jFd2OWeoX7keX9HV2r2Vs+SyKpQPtFkPp9oRqyh+Gn4loZz0GmPUReAO2HQgP2efyX7fVnLJ9At/ExB0rQ4HwV9WfhP3hKbALrknCW5Y7bDqYuDLPtLyrVhF/HUC98BBvGPxc5tebAdD/wXGkhpSjyfna8RcDBqDTglkBV6Jw6drogq5k2rAB2y1lZLGsD2Cr22meqOKauIzLKX2RUhQkVOoMFC3hgBarwBL3t2uflt+/XDuNoraDyjI5grxyvsn2jz6OVnLmK6K5rq+X4LYDdEEq0KHoC31FrZk5b5lj1ir3MACsfLM89suKWkdkq+ZYVaAJ5MRa7ePzfgkad/UC7EK0yjaUbQDaAbSjaUbQm8JfKBbPhiv/Th/wDFnIScLrg/g/DuIriUPH0uXExc/wBmfkv3/wDra8RfMfvHl/Qv8bjLy97q2f5Hx9WXdIPx4/YPzCtCkeMw+Wic5eXP0ZjAKa57v7UfMFuoT64ep+8pfAfuZduWaEBdycETZ9Nu8BlmCczWfwt9ifEVVwhX7hH2V7lEZ4VTwHAeCHVdGicyypRysrOFqtlJ8oy2JnQO5GA2oR2dk8gpHKvGnG0xcQggHoDNxexRrcawK5la5TyIBvOVlFm7q369fCXYJNqtrKNpRvAN5bFAKweS7f70OmLey/amVZ8phyMDt/bMe11KOo58PL5weoGbecxDutsOI1yqTJ1MVgwF5ntO4kawJZrwv5la+2wjzWB+1RC+cod4BvEL5fQP0ySRkZ63LqpdrxZ7H9L6P1r9IlGQLA4RNREMufnyTv8AIplKyxzgpJSqd+a/f/5V+iFZ7j948/Q+lP8AmxgclMOLZf3K+Yv1zzHPtj+D8THANfkfy/iH0VEdLHr75f7HxDSP7JPqfifvHUwGcmJUlPPUNelOF5+PQ0uAE2wIf7Arwly0oimPUjG0v0lJxdLERPBMEM7JlH9APmeOLIOiZ+b3EhA5Svwpk8p8EFVWuIAc1vLHr+Y0V7DnwnkiJNEFq4MrdRYlyDDqeqs/0CiG/Df2v7HQdEuczc9543ZUeaw+XgjSkH8fyD7tvf0FIbg4Q6Mv3eYDyGMqL99yxrUvPUPBNxHOHD/EZdmb8Gxx5Y4Z31O4rDVbz90oYKCcpd6qz4izf01kHSA6QvSU6QvWA6ynWF0hcYRIsOGK/wDZj+m4y8Pmz5FfnNcfp6hAC0+H13sUmBHB06TYmRlaxEHiJKeZ35r9/wBBxeLBRPlh/nf3nBP3/dBeP83mf67+Z/jv5n+G/mf7L+Zgv/F7i7SyqLMsk+4H7x5f0Ov8GMZggROk4ZQ7iDRwPuP1shBuCUx4bHbblflv687wTdGD5aPmIcWV7TbEuWE+o+0/eM9f+2A3xEq8AO30Dz9stwZQQ1ttdHgOgwdRVZxAscchG4BaB23URmWn+6B943QDn4eqj7sF9dfPjFPhnZwt+A18BMMVGAOWIuuWDglS8nIieW4LX6Yozzy5tTo9ygNOZo5P5mRF9Jc9JeOy/CAse92NN7fM5ew6hesL1mdZQZs61GgPmKyz4+il5/DL3G9YjrEa4y5QpRx7qKTYGSOa8RTkIsXuWwqCvNx6K5M55mPgHGeV4/MpiiuaSzHl5eWI7yJ16njMzfCU6zOsb1h5M9mezPZh5MPJ+hW+WcXMqLLwz/G1/R6nfOu/Ntbe+OIMc3PI4ZwMEP8AdPJ/z9PKxdBnnfNMp8ncO7maYZYH5r9/0ANBx5IdRb0QFf2E7H2U/wDBQL+hLv6CVZPsE/pAhnFHqWet+8ef0UQdTzDzgV+WD97fP6H6rXcJP85RDW3CKuQpUr6fgP3nM7eCCLfOWus+GlOg7if8UqDoA6BQHQEGZB1eYagelbOGyK4BzrBLgUUMT2Hy78Q2uLge45Hr5Qz0At9HA+Ag7m10RjLSuChARVOi0ZwoPJEA6h2mBDdQFgIpinhIo+09vlzHJtiy3lIKPmUemZNBp2T8FFvBuCXlg8meSPdiUlVZ08H3Y8OpYwfKPZivthiysPkDbdfPUIKtAD5ZZLCFvMFQydZgm1a3LuIhxeKlrL95x/2diK08UhSPnPeE2gvxPhPhB8IMPaDyhbEtjJOwOH9pfL/o/R+meIHORtQ9X34lJwEUPUUylp/dPJyfbuHKVxSZE/R3jDLYZhrC9+PwNnZFOopggYe1+/6KqtIJeIi3By4S0tuK39ArzH90/ed/pA+fMwxH/AN38Sqa5r9DG1oyuCBc7xem/lt+ZlXEGuCcSpUP2n7y83VgO88QZpZpwU+Fh8RZ4leBHnFOkEUuV4LK+7qAHDSIxFVitRldq5sZezBQKc0M/iUGn5ZpsXUMcbV5qLY7bmFAy/TBgn0AZpW7DAARBvL3F5r4F/zEsDKOgkpy949S00LoF+AH8RiCmPg1P0AidIUQGnMC8FC5RoPvKS5acX38rT0Iv0BIL4xIywKY6ox/VQQoulh1zKBNFudf+waUp6X+YsEci8WS5qBZtCAOOSBMksn8Q9PoXJfCCaYOjPRh4M9kPJDyTzIjacwcP7T/ABtf0INaMhxco7TMcwwzZQ45Py5PNnf6QJpt6P8AvvEtRnnJw+zh8kIWoGXtfv8AQ+n4KHNnP9D9boImDZ+84F6P2+rGJdlkp4cT+EsTv5Kfn9DHbB/gBxa/Es1XaW5IHJ3+/h9VXqfvLNZecXofgTM2wubRX7xWmjV1MrOfXxOagd1lhZQE7WPv/UUraNf+hBOBJocfiIlma5yYu1HwCf0Y/iJyw7CRB4v4i5hV54iFtOtm1AjNiFW9IWczg0XdLJ9klHkh5J5EPNLDzYeEqHzDlUSpcq8sfJPZF2TFArEvgulm3LTC1eGvtCaL5n5IiHBguZ3XVRALrbCzVOIRsB1DaZyVx1jMBYKY3dxaxf0g9GC6QuBdJbrLdZbAukbfCJxjH0eH9p/ra/oviaheWEGHGGqPEKROEhsSgPb0DX4Nn6ebDK+6+w/D1DjGdSAsZ+S/f6s/Fw5M7/pYvUd1GfOfvL/j9vqspZPQoVZxZk/jHyri/qsu11gm2x+wvmL74rKf4+UX0uZep+8CChUOqH+FCoECDSP3lVQvtqVwh6JUErXUw6Dy/tl7CvvOEBPOIE4+zKOH7LiEqtnVxAghBQ4eeSZqNtzvgQm91DPqZDYkDsC25RYGu8ypxQjL8ZbpFglU9z8j7YrpLauLXpH1idItYx2FX+YxKS25UiHLFc5Idssy5/6RFkBMECgM1N33FfoYL8j/ABK8AA6D6Nust1l+Mp0TOkB0mdJnSF6TOkLpGnSKYHD+0PT/AOeVK9/Qr5dzXK0ZiV4iR4iEtHPn835OzyEFaKPs/npN/T7z4mkPAnEcNXscPinqfkv3/QAXGMTbjj+q6lavNP3gN8P28SnT9pTt9ojXL7TJVJDvRz5j2YI74j7mIKwwAwjkftK/4JX/AAQvdjtTg7ZdpU11ifsXB44eZcyLnIJeP2hRf4GB/wADKf8AhL008OvMugxIAlAZeJYK/wDGpZgR08M37SZi08pELVt+GQs8s/1xO8Uln+/8Rv7fP9MozX6b+Jbl/wALUP3QX8RCF3wfxKFvyf1RXhypHHaBHpbvyIqQUw5wwaTRl7DT4DaQpzcP8t+0/wAG/aBf6vxKf+z7Ryb+8w1HPE5esp0nonoiOsU6QQcZbKOfHslKrpcvcRxmaPB1AsmrPBK4IEFpKdJTpKdI3pMeYV5hXmfKfKfKfKCNzxYF4YfaACgDiUcv85fnL7yoh+UtE0QFVWReSyzm5iDW4w4UjRaUOF5xO40O+AnmIDmIBWHULypCJiUAoOTyqfULg/rFa6t6zL7Yr+oZc4YRRWSqW/8Ae5Tyv+dz/Jf3nEH6/uh8kBU1cZcxXtixhq4GlwBAcAXxMG2/zucYH+dxImVKlHFOYkiVXRD2AfUKuHEBBBBZDzkzKu/c/tnYb/PceYL8/wC8E0bvP+8TOUQMS5c3eZyivS/zAcK3X/MyZCHBWfmC0TT/AN49DPH9sXTd/vc6Kv8APcNx6/viLkfj/NwRVW3+6Ylpe0/eC4vusf5hl3bH98sguk/vi5Rz8EFmADLBBKLXXuFeYMAMOj++H+P/AHh/j/3h/jf3gz/J94IGihdH3g6R8o+DPRnylaMfBhHDdA6sf1FA5D3KIbTlnDIg0YeD9B8GHg/Q+ELi3SZ0luktrhBdZnWZ1lusEdYB1joxUyYj0i8xvcfcfcvzFO4I7l+2L3F7lty+4vcXuLFv/wCNwcymC3FVzGZZ9LhCEXcWuYg1vc8CCGydsGQ3o/mIWYPEQcl98Ti5txruxqYLaqK8i8QxIM5xllKafvQOlHVcv9RlBWeB/Ma5s7XmbWvneARzWfmpe1ggNw0lq+NvUHcfvxKpw3+ZZuyJT/D+pSrSvEs8PkxBJLuT/kI8mTUIFKRxAAH4RJKozSwu4w5lQFIzpLTpBdZbrBdZbrG9ZbrM6xXWWNoVDY/9gHK2VgxeGUIVcu4DrLdZbrLdZbrLdZbrAgPoUxTFMg6wHWA6xWsTfvGkTF8d8ynWW0iOs58IrUGKEVq00FvErFPQjIJkw4ZXifErxPiX4+lmJzdoBogtuOyXbDK7pGn8n6yVagK6qi2/VxOjbNXYhWIx/TcBY93g6CgtJtwOIlOf0XLS0usxUg4mEILYZcZ69xlK+oOSzJjhhT7hjyrgBaj+CZci+/4lm2wtywNrwdsvzJt4nPN+w/2oQhdicvPP2YhX2oDE2fUaAImTAGgdD8H3e4Sndsdpr54NGe2GJqw25yDijgxnmM/wC2F5EMDw/chBBMn9zh8QBKwWvvMqoZOo8q57GWLwSEfuBmN8LT+IgXl0RzTNZg1VMYFWsO4f3X+0O4lVuW85hlAyicpFrAdIDfGF6ynWU6ynWI6xWuh2MODRZLdxNZTrEdZnWA6ynWU/SK2wrbPZh5MPJnyh5M9mezPZnHsS4i/KfKeRnNSyzzCdhHyDYypitYtoo48H0xMTEa+mEzNbVFtVmR0R36jO1bX7sX9L9LdxXJWX+sUiy9URlobxfR9pb+oM45lAIAy1FcBc4HCSiPFm1oo/BKuoBy2vUqGWWs/LqIAXBMBbUqYKnA5XX+4lnJjguO4hp+wRbvp7mHPCWV5XkcaM9xloW1Zf8H8PaYdaxOfn2GDxnuVsrvsz/A8+oRJYizLKXwFvpmYw4IZc/wAlwFYmcxq6vDi4ew8u5Y6e3Mo5MeJeBHxEYaG1NK++503ERz4wpwrJH/IvxK0rJDheb+ZdbM2kPJh5s92e7D2nuz3Zl3GlsR2yrcPJj5s92ezDzZezPaPdheyF7IXsheyZ2TOyZ2QvSZ0luye0W6SnSWO4v2ksdkXzPtG/Efj6X/8AVP8A6V+mhGQ3a8alzR+ZWOAlnDMLFkBk0fvLSj+SMBWiZnLTX/YKNY+zUpGr4Iyh3sbWIM5678Mdw0M1+K8fAy+KO5vtQGz/AHdGOyJZ4AeLyng18QDy10OFwPAR8Coky/Xvk+KNwVvWyebr3+B7huAwWrKHSQbyIzKcuyJqUz+AQPiW2QvZLbIXsgOkL0hekLuGYHgj4J6Jh0noliGUKYZqCOkzp9BmGYN6QMQEVFfRPpn06mpr6dac41GRFeInifEfUfU+J8T4j6nx+j4/RX/4gVODn2ipxG1l50G8TC0W+iO2rfpULdXLgmCS/EL5f1CFHsb+6d5LY4teX7sWXyQkQwmTugxa5YPNiHwfuB95ff3QjqeGK51DzvFGA69HL5o3GPSF/wB98HL9u4shD2U7h4MOmJZWexBaWdRQdiCXgyvYWmAlYKgQECAk4knEVNfRxNktbzE4nEiRZ+p2pZE2gm0xXKWbzG0K3mN4JvMPeY3hW8xvMbynbFnlFh9pfmL5j7nzPmPv6fP0Z8//AJ6sgGDqMUGbXr4JyTHQcH1LR0ShVAZmv+xcIKgcG4iR4uyXBbVNw0BvCcvNQZk2cqk/s8M6UYzH8Tw+2o9XXGA5Wt/uwfnO7/leXz6hDgY7NO4kyyM4K9RvFXUJWvEPc9mFbSm0KrnMByglc5ZvLN5ZXOWVzmN4pvLN4JvLN5jeWbyzeY3jW8s3gm8xXOWbxTeF7JnZM+JmPaBdwQzFsFxmL2itoYCLX1LeI34jfiPxM+Pp9o//ABr/AOdfrqG3u4CMWrf9WweivgJTqWlR3kjrBEQZC+otM1u2Hvr4nZa8XGzO9QiNgTHXmIggVnv4Z3l7BAUN88eZgw1AKW/Ma9pwLxAuRfEtVI9S7k/CabIxoAfmDrEL8QHxC9kL3FoL3Be4zXMZ3HtHtHt9AQIcuY9oraM7jO4XaPaPb6DMMCOoI+UxvK84VvPnK84BvK8pg7zG86Zz2R9MTxH1H1PifErxH1Pj6V4/+lSpX0r9NSpUDUpBOCnbdQDmAdFEQcfeCUA55h/yRwAqtAcsEMuWXplpoD4gGGkvcrUq5zp5OJdLUhAXAUG15LWSvDMuPyRHWIi8QT9F4DrlgGCA8Q9Q9pXlD2gFcoHnAN5XnK858585RXOV5zG8+c+c+cxXOUXzlG8+cK3lG8Tznzj7zG2fLCtpjafKFbQDafKFbTG0xtMbTG8pjKezPlj7Y+2PufLPmfLPmfM+Z8z5+nz9a8/SpUSVK+tSpUqVKlQJUwKOXEpic9yw5yxL3HUAMcds6PugZgtxs0nd8h+8uwzgw/eO8h7dfiG2Q1wxTWHIlVEHmJ8JdxfMQTZ5vGpUzWFlu1YHOSAOrZZgIC8twA4geWB5YBtgG2HtCtpTaAbSjafKY3lG8o3nylG0xtMbTFwxtMVylm0xtMbTG0K2mNpjaNbfaF7IXsmdkzsluyZ0lu4zC4LYWwzC2F7MxbZG9k+SfJH2T7T7T7T7fX7T7fT7f/RlfSpUqV9cnpHucrXMZzHiE0/Y/mPy41OZzHHD2OvW/tMy1KhXHxOZGcOPMJyKi6y+D6RRR5eMnuZFiVGzjiLFjj6UQBzG/bcrC2B4s9wEyo0QVxUDyQ9kL2TOyF7IDshe4LgXUMwzDMM/QBAruLYWwzAuFtQzDMMwzuC4ZqGYKwqAioSAmprMnP0tTU0/SniUhIqEhPErxE8SorxPiV4nxK8SvErxPiV4leJXifE+I+vpUqVElSpX0qVKgWxLQjyvm+51AhZR15jVRonPMCHTeVpP7YFIQAdEzBVczxn1OxFD8RDsFuDRnox4hvUvNBcvRg8Z7NS6eMR3slHQZ6Jl3AOW2cgFSjqBAQEBBAJqQkJCaZr60mpSanlNfSrH6OSamvpXIm2WbYJtlm2Y2xTbLNsPJlm4PKPZl7RdOYpXMI8xquWNbZjbMbZjbMeZjbMeZjbMTG5iY+jMfTH0olEx+mvriVKPp0A5VaD2xqDB6Bx2wXWbfURLVsp7lR9y6NsMqAsjluN3FeYLh3nJq4HFUT0mj+IqtSnUVlT2PfmU5LiBrryRE5CeJ6VK5NwDw8wjtgG2UbYVtmNsK2zG2Y2wrcWbYO0XtHsy9ovaLNx7RZuFNwMCkLgshdOYvZlm4puLNxe0XtHtGNxbsguyC6S3SW6S3SW6QWkt0goWhb9Am5pir4RXZF8kzsluyfJPkmdk+SfJL8kb2T5I+yfafM+SfM+SfJPn61/8Pn6oAtFp11X7wrg2F5x0utyovRCO8QQOSr638/tGE3Q8Ez9yjNyyuIrXXX3mUWHSEY3nxPl9yiy5ZcFicPMDUy9zDUL7jcrAdkL2TOyZ2QvZLTsgukF0gsC9JbXCW6TwJbpLdILSW0ltJbC3SW6S2ktgaEtXCW0luktC0LaS2ktgfqPD6dTUBFRQwBX1I/qArxE8T4leJ8SvE+Po+J8T4nxPiJ4nxPifErxPiV4leJ8T4nxD1PiKji+c8qYjRri/4P8AscwALSLeDiKcZN+kKhAFURzrl3FKYGDbZ1G0XjxOfhdM1HiZ7qozf1xG3UojicFVxDjtMjXqFXGIKgg4gmpr6YSSEn6Jr6+pqK+nU19ezUvU1FRWJqEnG2Y2hW0s2lm0s2gm0vZL2QTaXsl7JZtFTlFNsxtjW2NbZZtmNpjbMbZjbMbZjbMbZjcxtlG2Y3MbmNsxtmNsxtmNsxufM+WfMxufMqY3PmY3MbmNw0oNYeT/ABHn8/2IBuK4J4wO9dR+RZyM/aPaXG3c45xfniDaMxXcGuXM8k8kuAEu1hRlcyheYQcyjbMbYVtMbTG0xtCtpiuUxtB2TG04cp7PoFpCzaXTlLIXsl25S7cpcF7JcAwWXCzaY2l7JeyXslm0a2mdkL2TOyF7IXsmdwXsheyZ2QvZM7JncZ3De4DnJG9kR2TOyU+JT4lPiU7JnZK9TOyU+JT4mfEz4lPiU+Ij4lPifaZ8SnxKb6lepT4nOp9p9p9pXqV6iep9oDfUxXbVD8y8qw1e3tjLO5QDtqIVUBRUvbuLsCcswG+JWUP3Rr5mRzHLmPlF8y8TKDbEMOSZCkgdkp2QHZAdkp2TOyU7JSdk9oL3FO4zuM1zGa5jOyN1zFO49o9o9ozuG9xnZM7JncF7incU7jOyU7jO4L3Gdw5ckqKioCampCQmvpamvrXLKR1CRUVFRX0FRX0FfQcv0AKhPEqK8SorxPSV4leJXiV4leJXiV4leIHiHNavl7TUMdZhZ4iOAnCpxmKeEsnGIFMExIgKCeKW1LanPUrxK8RFeIKKiVdQWWekIH0A+ikcJr6WpqamrkjVSk19a1NTl9OZfWp9FqU/RVRkTbMbZjbMVywdmHkzG2CbYOzLNss3Fm4vZnkYx7Y1tmNsxtmNsxtlm2Y2zG2Y2z2ZjbLNsxtmNss2zG2Y2xrbMbZjbMbZjbMPbMbZjbMbZjbMbZjbMeZjbMbYS+Ii1vLv6XiiUHMoklDd1AKGwgQDBFlC83Fvcwncx5mPMo8zDxcANyiuWPIuJ6/CEAWym2ezMbYO0XtFm4s2ntGNxezL2ZjbLNxZuLNxe0XtFm4s3Fm4s3Fm4s3Fm4HaL2i9ovaL2izcDsyzcWbizcF7JnZBdkt2QdiZ2TJ2TOyZ0luktrhL+oA3Ibvkmdkb2TOyN7JnZM7IXsma5JnZM7JnZM7JnZM7I3smdkzsmdkzsmdkzsmdkzsmdkzfJM7JnZM7JnZPkmdkK3k4gzzUzsmfEz4iorWBl6CF4l9ktWY2txv2S3ZPkjzyTO4jwJAekheyZ2QHZAdkzshekzpF2IeD6AXcZhcF/UAeiXThOELahbC3SW6fQXBwhgQGkLpC3ZOHD6C4LgW0LgvRL0RXSAwH0CD6rqakJST69BlIrH0KivoVAfUVFfoCoqKiofoV9D4nxPiV4nxGPj6K8Q4WdxFVWTG0xqNanPjqLThnpHwi+IVqfEIDxKoj4gQEVBFRUB9OsyfXn1/X6f1KZmpr6/r6+pr6fX6PJqampDyyvLK8sDywPLPZleWB5Z7M9mezPZnsz2Z7MGeWVjlieWV5YnlleWV5ZXlleWV5ZXlleWV5Z7MDPLK8sryxPLK8sryyvcqJ5ZXuV5leWV5ZXllSvLKle4cM9w7MDzEPUIcQz2yzrn6hAzAgeWJurh7YHlgeWV5ZXlgeWHkyvLE8sPJj5MPJh5P3nDl+89mHk/eJnlh5Mryw8mezPZnsyu2ez957M9mezPZlZ5YeT957P3nDlh5M4cv3nsz2Z7MfJnsz2Z//2Q==','data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgFBgcGBQgHBgcJCAgJDBMMDAsLDBgREg4THBgdHRsYGxofIywlHyEqIRobJjQnKi4vMTIxHiU2OjYwOiwwMTD/2wBDAQgJCQwKDBcMDBcwIBsgMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDD/wgARCAM0AzQDASIAAhEBAxEB/8QAGwAAAgMBAQEAAAAAAAAAAAAAAAECAwQFBgf/xAAaAQADAQEBAQAAAAAAAAAAAAAAAQIDBAUG/9oADAMBAAIQAxAAAAHwgOOgBqgGUhiExjQwaGAmMaUgEMTFIBDBoYCGAhgJgNDYRGCTGNDE0MFFsBDBoYCGwiSAQwaGxoYmhgIYEWwUWwaJIEMBDAQwaGCTGOJJAmMEMGhgIYhDGJggGhpgJMY0mCi2NIAWZhpxsAbAVAwYAMGJgAAMYmAADYCYAAhgAAADAAAABgJgMAAGIQMaGAhgJgAAMAAYDAAAEwAQANgDEwBMBDAQwEMEADAAAAAY0MBAwTEhgDEwAAAAECciSeYA5pGXzDBMBlJgMGJpgAMGhgwGmhgBKIBEec1ZNOolBxIzqs9DovnRKxLWDYqU6trxzVaslZl0CdhgtwYNDATBAAMGAhg02AlICJICJICLYNDEIYxDAQwEMTRICJICJICLYNKQEWwENhEkDiSAiSBRHESiyskNCABUtPTmAaYAUNNMGDBg0wTDVcjnsqrK9V1PO2uN1Z1T00kulVuJxEy1V2JxtrtCc80R7KopMrcXNijEewhPPtZCsdxQPLZB6M+jMDNkxjQxNDAQwEMGmMEMGhgIYCGAhgIYCGDExCGAAADQJgAMGhgIbCLGOIRcJNvOIwSUkJDGZ2nfGNMoaaYDKGhNgFAAX0IM6pTdTCUkm75YXztVl5ShOTWd2WozTvB0Dg0k2LVbEm85fajHCyFyMaqodgo3NTtOuAPRLNbO9onn2ABQMAEwAEwAGIGxMEwAEwAQMQA0wABgAAADQhgDAAAAAAcUnImnDEAACEDlDBZmnpxjTGNNUwCgYmADAYIYBLe5jl1Qe/BdlnYVVZp6cmaNe+NKZ7KJuut1NRzXRqM1OyNxbTHvSTx9XyuGtKS6+a6yMilflaaIRa1RqunSF9MhyHGdrZ5px0XBKOiIwtDAQwEMATAEwEwATAQwEwGAADQAMEwTTAAYNAhEWOEMaSYCGCQAkDaQwMwGnCwZQ0JsGUA1QAmADfZjbnnm5csmvItEm+mW/dfBnlupmeF6Hg3Xn0uTGDAU3NalAKYMrOz13K6fPtx+B1+ZtnmJLXHXl15BxsqBTiA3oz2KmSqK0zz2RtcU3Z9rYTuNMoAAAGAACYkxA00ADAAGAIAAAAGgYMAAG0kITTgGgYAIAQmmgEIBOWIDO09OFiasaYxpqhpjAEwGGyu7mLmheOtjo4uup27OfuhLF3eXBzaGa51LRFrPC+tqpDc4puF5927iTy0pq206RjrtruN2bbXNY46KnNatraJwtHbn2ZZs1ZrC1fnmrvlRZn22AR1ACYAAEgi57hc5ddueOdgDjnWoHgLYqogDCQESYOBNhWWpOEZjmCmCgTQojGIAQmAgBIBygBIBzmY9OIAKGNUNNUNMYAnfrzZpgGVQ42vPt9vk95Y5OkcRV6X570fKLOLVnThGXfI04+twltzrHzOpyuw57fPnvw35GTscLfHFKdemXQevNnpkhtjSw1aaXNO7HrT6/nu3xIssqs0mUZRV64Tty7KbYOeiQ1O4ywb9XP0mvnVXt68CbbURgRJIMflvaKd/mMfQcjD1PoFpPo8ZOQ0hgIaElJDipJOHzT6Z81y7qara8++sAQCBoBJMciaEgHOcHpxAMoBqgGmAygBUDATWgWeux6+dX1uVdFdTm9ziTeOudeuNno+HFV6rl8jRF78sop2zzTDl7snavPl+njHPXNxN2W5oLZ3l0q5Ri6qtWRrJn6OKphryag6nB73Ai4yi9c7VOM6T6PL6mXTQSjHojGqd1cnn9Nu8l6np8W9xk5Zw+ui0jJiABJgczxXv/A4+j9DshPXz2A0DASYCTQ0mk4/NfpXzTPuqqsry74JgkNAACQDSAJQxrM09OJgKhpjGmqGmMaaoAHog85j2PVeRb5+jytaminRgVW83oZdMY5t+yo5W55k8Wjch5rb7ovhd3j+luM9Koz1p0yvqeFvxdO8oRvpm4KxtZ8G/A5NNNodLg9jkpwYaRa4WTcNmTdOt8Y5c+qyqy28qdmKpz6Tn8qm+T3mDymwPW8nBTn39PVxtOfT9Kv5vS6PKaY4z/PPofznH0FXCrL0LzMBoM4GmzHYHvevRf0+IJjjL879j47H0aq51x2RAAAEIBIBoTRKAaztPTiYCpgygGqAE2AUMBqMuqRk6fc4c4QjeJ1xmCy5epMVfTy+jueLj9bx5fMd9UaVkrGud1radMvPWZ+4zdxez58nl+g5fQqK67ITdaKmjna8tRpz9LmNXUaszVZKLUtuO6dNFUpzoqLLnHPlOq8rlCsL3XANVMICukZx6bszm/Ye0+a+la9Wed9AFPzr6J87y9DPVbVl6EQBgApdPneprL1TDo8UADx/A1ZOf2a4ShOqABDGkNCQDSGiUA5zMNOJg1Q01Q0yhoTbTKAEzr8joGcKM9V8WjRyFUewycno5dGq/BbNdKsnN7rMGZoljmLuaOXpvO3nXcZmH0XA6IbeB2/M1n1NGXrJ8l65zfOwdbLU82PUVTTVqzJQzXU6ZxQ2rOq+fl0asc3WccsoXnK6vUnDKWNThf1Zrj2br1XF309RPnVb/AELFk63aqJ6vMegEvnf0P55l6Oeq2vL0YAANSCfvvDfTNOGQPbzVi3edWnlKbaeb2YRENpoBMaQ0AmiRA5QDnMw04mAqGBTAVMBMYFDQMH6Uy4Mtc65OZN7Ecm/uXTpyLuhdNZUZhzopoqNJjbnddzpJ68tdjShdEMwSrPqdDL1ct+RVs5LNfGv6LngLu11MM2PrNcymUdMY6c20ebr3YMtaMmrLrinHQ5vxq5OOpwmpbsOpVV6nyOturoY9KI+l891U9/pfI+nuNHO6ZU5fnf0L55j6VVVtWXoRTAJxmHa915z0e/kMC+ZeJ9n85z7KKrKsfSigAABANAACAlJpyAOc4npxNpqwGmNMoAVMAbEDt9ZyIPl208VVj2c2O5PXpz1y97yaZuGfTBrBm2Z3OeNkah2V2p6NOTXOltOjKLn7sXVqdWzkWZay5ss9TVn7PPuOhp4fajTl7MsLijLpy6YLRn6IdDiuKbzzLjXick5X1tMsquTLlObhvyk3G3N0Kjh6LesGD6X4H3dRtAueX4T0vmOf16651x2IAUpx2C93uH1eCAC5PiPSeZw9SuudcdcWgAEJoGgASAEgHKAFmY9eIaapgKhpjGCoYFCaDfzrs98S09W2b8/V2M9ZZduTcQb8Gib00EZuim2pzTC1OVbXaqs15tc28+mtrJspEFa0BZowa5rZzruY3K7LfcUc2zPpz2Vq2phu0c2LkpV0RTbIXxqJ6codHLZZsvpJrh6+XKo39/y+6Ne/57qCMfQfPZd67xG+o9xlu8douVllTz+0oMKAYS9H573F8vaYb+QBnDxXMuo5vcrrnBaAAAAkAJDTQmEpNOUA1nad8Q0ymAqYBQwVMQDTmHp9/O5xj2uHx4Vl3aOPY8upXnuTNOWSfQhnnNxhKIVxsi1G2LTutotmrYiFXVZz6mq/HTrj27ODpVdeieebsRnRRRdTtzm3FNW3DoqtXG6/PiqlY6udGuqeiv0HmNtcPdyZas9LKoXVNFxQGjdy+mq6WDtUKuD6nz+7TL0PkLseXrRqajoEDCSmKz6X4b32vmsDXgOH3PIT0cGm2jn9iCaGACEwEAITTSGiUA5QDnOJ6cbaFTaaoaZTE0wAY0BHJ2nfn8V+jqqONZbWmpRac51WJ2W1Sm5QYNDiEnU0XzzWJ6iiQ6cl9N5GLtMXH6N/QHzlpwTayXZtMiLVxY63OxtyXKtuGcZ1lKM53YOenNtru08vlTvKwp3YrU9NdNs2r6ZBtwS1Mwx7PRevEplXj6wgBiE3ZXa16r1HM6fR4rArE+ee18Fl31U2VZehEQNiBAmIQNAIQCEJpyACzg9eIaapg1QAUwFQwGAI1en8x6l82rz+nnvGqLQ0rBFcnAJRik7a64MtqhBzbGkc3yzyRrMslVks+gNWnJdGllkZjwVWqpwZ9GfXATbpsa0LK5zpG2u5auTefYhpaLbj0351EZD5OfC2rXKOnI2upVj0RpOW7VNcufQ5ruUc1sehMajoBiqWinuVn7WSfT4TQB5/yfY43P69VVlc9KAATBRbASY0gCUmNJMJQDWdp6cTAVDBU2gpg1QAmMB6NOKquTRXnrvmtnli52ywsexZBPXHMguhWnM1AakJg3GQTZfFu6F0a3XU3Tc7qbx5KLslTiq0VXDjfStxqwK7IXKo2wsnobVkdFbk9eLJb1+Zfn2135YuNe6Ac/N3+LedSdlxXbGsVtlcRpgFlmcHst55OvV9l4rsq/eSya6xIT5arxua6jm9uuucS0AAAIABDTSTCUAJDTlAOc7T042JqmJqmJjGCpgKgAFTZRt5YRVZtNARkxxbAJwadpW5qSi2pNSTJJp22Uym7JVyVaL82lVZdReqx5NuKlmUm7ln0ULWUwCF0LAjbX1XFfPqt14rM9lDz6UsPex3p5GmkLsO3nhGp7Lz5xOu4AGr63aqrUgac7RUT2IVN2WQdH1/htCr6d5zFnjr59NlOHqxiAwAAEJiBAACBygBCE5BDmgT04201Q01Q0xjTVMTKAEQp0LTkyzuk5pL3HRlWuDxzE4XypNORxsBPXfOnPe+MvI7ohCSYWTrmr0X5tM3ZdRJVHB0MFKlyguoqnJyWdXj3hC1R05Ls0YiemuwU6VWqh1MeeOjZXalmsW+AY9saWUV76aMktFzzrlpzx1Uux1kQsqcopbzcqpk2acUx9w5u2do1Sr5vcQAwEJgAgAE0IBOQEITTlAOaAenGNNUNNUMBjBUMCgGmhgwYMBpoYOMbO/XL5GOrNt5parFV2zPry3vcrZvJh6/Mc45BebnCxO3RnvV2uuaqWTXnpUYNFd52ei56L3+e1RvnpTiSoSY6JqAt1WQHolRZOpKmY7tHORF8qYFzZqecNVN+fZGLc70qwrKiq2usaqrK653KI8wgw0buRYPpGO3PttYYeohg0MBJgkNNIYJACQ05QwnM09OMaZTAVDTKbi02AUwFQ0DYCbAGwFS9R5f1lcvG4fo8V8XHsui4suyub6c+fom9OOVIUMdwTU5craLSp2QadlF/HuKr6tOmXQ5plEFcXE0pjTs1BRddBWWRnHVOiOIV8KbdOSudmUmeiEynY5x0SnXrjqq6/GzmV8ZaHeCDzPOFbjpxSg0Ic5BCd6CGyFI9F1N071OcOb2gAYCATGkASgBCBygBZ2npxMAttCpgJsApiabEymJpjQNtBTE0z1XlfUPlw4OtxHy28+zNUTdcqjTflvjR59GVkpQkKUq7BznXNVMUAr549uedtVzWaCQhME9WJhtlktL1Tx6I3M+uoea5q+aZVlCVztFCxJaXyy6c+2dlc1dF+XYRCNmdzRndenG62nmpxTLrMrC5xmgcrB1yVirp5V0MfS5gLPuABAIAByIBIBygBZ2npxDTKGCoaZQMTAZQDTTGMAVDAoGAvT+Y9Ec0uR1ee+fm4Oph0wrsqnUaL892epTOpqUoTCUq5J2yrkqlz559MnJX3m9DpHRmnIVT0Ug9vPsDbDNNXoK653tdLvmnS5hRpcAuqyoLJGpaOUFn222ZpK1arq5s6v5tYwiKsRTgJBIcS+pXForOc4STuvy2Ttr+h+M1TWbme48ln6GRMjpQDQmCSY0kwlACztPTjYBQwTbTVABTBpgBQxjAFTATACl3OH1q49FEqjCnn7cTmhqvTC+eaxOyAwJRQ5yradtJmqW1K8zq8zqzsqcEKx2wxxCysBOdch2OCHOyqQ5OATMigjHVIK76aw106NivjXei81O9qgp3lTOuucgK+YFYANipk0V0VJ8vv4aOnm283JNxvjt2Yro02a+NIXX28ySqqr1fls/VgMWiBCAHKAEgCc7T05GAUwFTaFTaYxpqhoKbQmwBsQNircHQ5urXzOjnlVlqs1kXOGGirXCM4sU5wkqEmDRS0hTqCT9OqOb2ORG3JplC8UBUA7VULm46a67aaxkRbzk4gT14vXBbuu4gWw9P81D6Xm+Zdcf0L5h9F+aToFYaWUyredtSbzlbCSuMpVPOcJyV7JRfL9AJgQp0xrHnrfm182m2q2+XpKSy39dwZdV35SNleXqgIQCEAOUALO09OJgFjBNg1QDKTBUwY0wTAQ3FQvAsjK+NTrjWPVouy49Ea7s1TGq2qsojKV7sjF1AqlVkqkul6WdDTl4KVU8NgoQcqmMpyVKTJ6AApUX1VgK3PWMlEFPo8wH2eXv7Aeh8b6zxoYO55zvC9J8/wDT+bVqJIcVKLlzWidYRLyqSJXPG2m9a62Pl95AAhglGQLLqr37eNRK6uXX7DyHSqaOd6zysenAanQTTSGEoBqgC+RtNUNMoaapgFDTTGgpkIuJJRrncoqs5WRk8qYbcbncufrirKb1NYlbXeaZMNDkp0yUys0yjoN0dW3qX+deFXLuzk0rRRUGjPrTrkC6UAmxAFN1NY6VBVlQWRFAkxeqy9LMPi8+6QVe68T9EDk+N9NwJ2qJZ3BaaFrXCU1Vma5DjUWVz0aMuxaaxPl90AYhoQAER03wa5Ybr4bbaJzfrPIew8edUAUdgASIGgAWdp6cg01TEyhppsTKHGIpRB5iI1mBN5quUSdEZRa38/YZd3NLYbeZpvwdHPbLTuray2z1hDBODI63VPTb6fh+mrn5XB38wzqFrRVi10tRuA2QAxNA0AEZVVjbbVa4pp0XK8M9EHHqev4/rh0buHiFyPpfzGQ+5y8yneNspBfmcZ2LHmedzK00kr5a+hh6UdsxPn9YTAQ00AAQmE5tuezbxzVTrk9F5D1Xl3vSmZ96TTkECAHOdhfIwCmAqYkDSbkBCYREJzcCYKEbE5ko2tGzDKdtGTXCdsu/JVfH1ctVaL87sKLKqi5zh33l3OVr5ajn4p0ilZCpqyVciwSNGIEAAAA4ONZSvpkTbnvoWlM3CsZIkJQekM9l1C1ldRXOuiuttTca3E7CtNySGoWVVjbuy6sPUbTz7QENpoQAAACUo1y6ehmdcHX5e+l6cIaz9FANIESCHFQF8zaCmIABii3MKzSBlWitzGRFMBuE7JioNQ1njrROS2bArtc75zVW4zx0Osc0tAFf0DkCOdyOliU446HUZZablpkW4NOebqgyq2oScRpiAana4ybq7RZDr51VVapczrrHndUmEW7S4SUp0E62kgeUyLVSdbGlNPPRoy68PYbTz6xMATAQwEMBDHGt57L8nbZj9FU+Rr24s/VSaATTlDCaWnfOAAAhOyuwd/uPF/Q6xuOiXz8zm+l5ifzOnZmz7arnvcP3WjZfNz30Bxzl0ucGC7yPvVVJ0Rxz10QOcdEDnvfIM1W5Bzl0kLm+R+geNV9jVdqa55vBc+PSQcj519b8Gq8vTqyq1bVeFvuPKfUHPPs3t585dEHza+qmvk/O9Jwk8mzRQPdRy0PrV8wJ6E+Yw6hyhrq4825GTolg3DmxF3NPD04er0zmuOzpHNA6T5gjpPmAdJ8wH0oT03xzwK98dHb5GwKOP7DyS7akxbpNEoBzS0XygAgGMsrtK1fQ/nv0OsOsBfKczp80r51VrMu2H0GvrXygOskHMA8LTlnfV9I+YfTXG0CsgABgDAQgAAQHjvZeJK9XqyaiQBiAA4PeqR8nxdbmrWrRTpD1HuOL23mCbQACGkfOMfQzj4+K6IQJ1gjbqFyo9KQcs05gAbNPb8361HlS2AS149mPpyFLLvQwaYAAAmMfRov52nnbtN/PXOt1VNTpjRMrkK+iPRQAIBzQ09OQATAY3ZXYr0/RPnf0Sufrgachz+hgK8P6yPcnQadYgc4I/PDnx0EarB7PqHy36lWWwCsjh9zzyfmLc+KNddPNrJ6Ry2301zQOyczUz6bsxbayEwEZdYCYHg/M/RfBTePoZfUj9qwrMDIGtoBoA+fYOxyEcSnt0j5O7ZcLDzi0IOykOty+vxQTGN9vidcTXOiPqaeBsz7uqcx5d/TObYq6ud84QgWhuz6nGYpSezGisOndjvrz9uHWg5mPrcme9JooAaoad8gAMYyiyu1Xp+ifPPodc/WGtOMjIBDATAI/OPpPnFfgcuvLO9dtVhOr6l8t+pVntArIx7Wjy+f16H45eyA8aexA8avZgfN8fp/PqvoOzHsqAAOB3vN7k+uA1D5r9N8en5j3/kPoo2NOTzHc8kj3ADCMkHzXh9rhordQGtZ+iPHbuoFZPjxZZAaEFg11pccT0ZNIy2Msu6TTy9CXVXLEAlow6bUuU0ACTAGulzety78q7dzK6z38/RnjuiNGoATSBfMwChgm7K7VWr6F8++g3z9YDTjAATKAvABDQeB8z9e+ZTtx5tqtP1H5d9RrPYxvIABDQIaYAAJgeU893vOTf0XXj2VAAHl813Dmvo5n0VJy+og8z6bLrTE015jlUSVfQQHIpIPmPG9DxE8mu/MLZzswySBE7V0w5x0IA1y4g1ZYOpWQHZoy6s+2XRy35dlNSa2AsT01aOe5AFYAJDTXX4/Ux35cYZtrzzMI9JAAgGqQd8o0yhpqi2q5PT9C+e/Qr5+sBpxgZQp8RXlz6/oXT+afRrwtQ3kuR1wfyCHs/JzuvqXzT6YRrEVk+J2uAPyuKjDOu6XKbXVfJBdV8lh1Hh1C+nbcW2oAA8l570HmVXsPSfOfowgBoAA5fU8an5rq8Xsp/QnGVSJoPm/P6FKrBzrWFDstC7RblJlz+gg5seqw5U+kD5luvaVys860S05+nn2a+bbTHXJxlOx08d4YgFYACAEJjH2eJY+WzKwoTRoJolDHOeUXfIwZY01RbVanq+hfPPoV8/YTNONc3pc0r53k0Y8u2z1PjtDz+wnD7mnIACj8/wDoWYr579A8L7qa1gXmec9H5pPwGbRROtQ05AAGmK/Xj1B9Q3YttQAB4/yvqvIp3fRfmXqw9qMaQ0FfzD2nz5Ort+f9EL6M02NDDwHD9J5NPHCxDg2xOUIisKgJimEZWxLOjyesjlsBT7HI6sduBxln1yac69PndHnDQ0qAAAAE00JgkA5QAkA5QAqGjTkkIVSE1TsqkVq+ifMuu8/p588nfN7/AJnk8I8OQhG8JwHn0/qXxvq1H1Y+dWPL6CeBQvSdDxVw/dHgKSfonmvOc8rFQkqQDQACYCt04mL69u+Y6nP0RfPKw6nj7+eO7dy5o+0v5lpa+iL5/UF/mFEH6DzeoPsD+eTF9AXgK2afK6rUctdRD5L6wHLXVgHNfQBc97wOcukDw9OEFWJRmO3dg6mfZzn0XO3Plva1ME651YmmAhsQ0AhAIQCctAIQOQQKhp6cjaFbExtxapikNyglUoJPMTVZonAlMTVjqYrIuJlZbmCrIVjJREAAIUmKB1+S0gBCAJTqBXRhYKuIMYgLJVA74V3IvrkEwiQZc6ALoRYQhbAJKMwg5IEpIQbNIckigmkgm4Mc506p1Uupujq8+9+SeiDanVuLVMQUwAAQABKAaAQhA5EBIAKhhpysBUNMoYJl9IVKI04A6ziA40ZgJQwIyQ5BArrMoAmCQDBNCABCaaABAAkNA+hzgSGAhgIYDvp2hVN0uaWRBjkEFYgg2BZmlAV0qJDuK2HU0cOsJRTEmpAotBPVmvno7fQ8rKOjq4KnPRNJzqMFQwGAxpMEhgRGnKGhJSThACAGqGO+UGKwAYwVMBUDBxTHmk04QxykwSGgAGkMEhgJMEhppDBIYJJgkMaQAIYJDQAAASC3VTWJ06bBZCQ0CYCbCLAI030hFoakkIacgipIJIQ3GcAsvpujqclKOoac6NqS0BipMBgAAAIAQmmkNEoaaE0SANUuLvmYCbEym0Km0KmCGgHCQPMENAAgAQIAAAAaE0IAEACQDENCBoSGCQDQACYANMJ6xENTrnaePRnrJuI5lCTCCkgULYBUNCGmCkgclJhXIAIyQ7rIyy7pOLnaTi1baa0kk1TEDYgGJCYhoBCaESANCAQIc0tO+Zg1YDGAKmAqaYEU04QDhDTQmCAAEwEMEgBA0AmNIaAAEhgkAxDBIASGAhglOMw1kU4thGMdDonXpzNoCcqgJxiglEQVpglOLAGwhOdQWOvWnllG5atjz7BjWg01baaoaZQAmAAgGkMEgBCY0k0SJpoAJpkneDAVDTVDTGA0wApRlF5oY4QAgBgAAAAmCQwEAIABDASkhIY0hoEMEhoSY2JMErIWCtrcHnoojEGIaYATnVYiCmghGVTEAIJIJ+i85tVdnFlA6NOOpOm2Mp62wjYY1YwLYmqYgbEAwAE0AAIQCATQAJAOUAKpxd87aFTaFUhA201QANITzATkBiEwEMATQAAAMEAIAYJoQAAmCQ0AA0gBAAAAiUbHMq7a3lWWgVOyadL1xDM74tUxsgKFckwUkDCaNO67lKupxXoC/nXQWkmOO0aapiatiaY0DYAxoGxANCExAgEJoGhAIENAAqWnfMwFQwKYCptCpgDimnmJjlDAAAEwAAAAAAEMEgAAAAAEwSAaEwSGAgBIY0pwiTPTRaptrIA5wYaSAO0jXLyxlHTOClFymmEelzrw6nO0TT5vTxxHCyM46wHOw0yhpqhpjAEwABoGACAAEDQAIQCATQAJACqad84wVMApg1QANiaaTTkAcoAAGCGAhiEMBDGIYCGAlJCQwBMEhoEMaQ0IABDBJMak01Fd9fScYk4heVyTcCKdWijQPHG2q80A5aGMJCpTVi0kDz7BoGwaaYDABgwYJgAAAAgBCaEAAAAgHKGhADVYnWDaFTEym0KmJjYhMTTkBCYAAADQDExgmAmAJgkAAAAAJDTAAQACGhAAkA0ABK6u1RePNWdbGFTjEVpXNUWwa0rpnGsYjVSNMBqSc5px2NpzqxA20JsQNiAbixtADEAxIGIE0AAITEMBAmhEsBqphWLATGBTATYBQwTSBoAEACABgAMAEwAAGAAAAgCQABAAA0AAACQACByABdMCJ5gcSmAqqAczkE6TiCqqIXkMBJgN2ArkwjqABsBUwBpgAAmwAEAAAAACBpgDQAgASAEANAAv/8QAMxAAAQMDAgQFAwUBAAIDAAAAAQACAwQREhAhBRMgMRQiMDI0FUBBIyQzUGBCBjUlQ4D/2gAIAQEAAQUC/wD1zb0PzZOcg9yzLh/kbHS6vuCCrAIEXe5Fwvkg7TZd+hkgZBmXsxt/kg0lSeQ8za5TUxl13RIReVdeVYrsgbK+l0Xp52G6yWXVdBhP+HihdKnUjgHWCL02UgeZyDUAEbMTiib+hdZFR7pw8zm20tsEDoSslkrlQyYp7xK3/CiV3LuVisR0NcGB5ubWR3VukI6xnFjfLFku67jsrou1DSUGqy3vf/EW0c6yvyqd77ruj2WBWBK5JQhcnRkKyOrg4RSjGOODJOhc1E7u7iyIVkGoORKugUU3/DgJz1GMnyy5FBAFxjiEYc7MhiDbaFEBOYE5qtZSDcXkmihzVZN5DoBtj5V/w5ZBCxDhYg79kdiHK4/wdPTOkbM5jAdzezQ1YgJkN01gja5xe9ke3L2cLIld9XJrcke9JTiOMEQwyOydpspdjku6O2gQ9tlde4YqxQuFl/gKek8lVNk6V90ASg2yDVHCmRbysvEwBskTmWkds8lX0cEFKonbwRmSqNhJxAh8jhrFu890CidAbFnd3uuo1+f8Dw+n5jpql2crrJrb6dzS0vksAv8Ah0m3mLt2pxWRQRA1l2NP7uDR5SOxZSvkyT93OTe8e0XU1Sd00p4s5rkP8AyZ+EjsGgX1pYsk6W6ijGL8VMyzfaDpbS+sh3hRreSq2qbMw7L8PFij7bK1+kKX2pvc/wAYX4B/vgC4y40zNzrayja4RMFi5UsGS4sRG8ysK5sZHMjsZI1drk4aAXU4ChJvyJcYe1tixSG5CDmh7zmXkAd1a40Y0uUkbmjSNO7sNkdk0+hZBhJbRVDl9Oql9OqV9OqV9Oql9Oqk+jqGLArHWxWJWKxKxKwKwKxKxKxKxKxKxKsrfcxQumN2U4JLjpflrhtPcPgxFPCU+INTH4M4jV86dXV0LoOKEwsRdNTu/C2g1RLecYTbHzSp274vdGPI+zVIzbJtiE7Sm71o/bO9yBTvcm+Ztk09TW3NJwsARxtjFlbqmp4plWcPdCMVZN7eodD9wJSIeiIh0lNxARnxcb14kJ9ZeTiNfdHfRjC90VC4NdEGosauVZMGIPmH54dJyZIHGR7lPGHLJM9saZZsZbk6RuLnghXIMiCi7SnKl0HZ2kRsXizrIXBOoXCKazPT4hTcmUhN7eoUfvZLIvITCmSeTM4GRONymNL3U8sFKJq7JGdpWIcjcFm68rS/3t8sMBIe9Tv8suycMYWNu07uDTIsciHEOkJLimbGn3kkbjSHvofammy90XQE1tzG0MaPT4izOkKb7fUcij92xtmwMLy+AsI2TSqKnEsUkViRo3ysZK6M+IluKgECO65mR7EOJBtnGGyxwxwyukdvJu4jOSs2khACvdSWI2sbtF8BJ3YbFu7p5B4S2+jN9Ye52OtyFE6Rr6Xi+U2QsDpUcQaHtJtcdVSL0/4aNvUcij91BEZXTv5ioG2ZHFHFFUvpno09zmWxiWydDGRJEWveOXDE98boo3SyTU1hZzDzc1dNUnvpGnlUoAmc7dRt2cDJNTodyPOG+V2yc1Sd2Wu1v6lZFy4NAmGyfs5Qm0kws4yvxJffzhCUKndao4nIyobQVr4EzizI44qip4pLOI6JF6zUVQ+N0MnNi1n/AISUZHLmuXNeua5c1y5r1zXISuXCwfCa1D+XAUfuw+0aikwge5kxjjZCr3JAs9pBvsTu6neUyGANc9sTjJkY7W5OR5AQjxU4tJS/Gkwa89ooi8zWaI3fqMbhF5rDdNsEG7P/AJJfdEFngaiTOmKOje8nvAJQhkjUlQ23MC5jU3tM25ui92N9yVHMYy6pLyZwmTMJDt+HfC1n/hcij1BQs5cWvF3405R+8KhpnStY1kQcm6OWCfCVS54tpIypeG06NJE1CMBWRsrXUtI6Q8vlQSnzQMzLYsBxB2Kibkdgj2KO6yTjdP8Ac1nl/wCnNKI1CaYwueQhuuZyxzCVZxTcmrYjyLy3NgmvGOe7tw1/ls1XwXDuLsjYx4eNJ/4HI9fD4+ZV9HFn5VJR+84bS+KmrIo4G8xhL2bNicE5ybZysmpg5T4ZmPa+xa9qftpig1MU58jt3UYwAK4gbuoweYd3ENW2JO99Bu922lnEnZHXu2KJzw4hDJxecFdF1yGEgpg2JTdG7gqO1rPaqCqY8nhmAjqp4CDcVH8BRR6QuCR+bonfzJSj95SOdHDJMXJ3YVDmptYVC6KdSNMTy+6aESmixhfdTOCc+6BCYxpaY7J2yqfa/wB8ItG4ELiB/VpQE5FpXLuOUn7G6Z7pDkYe7tlsvwmoRBrXzPeg3NX5IJJ0hZmZDp2jY3JFhjMkOLRYOwjQawIeV0NFDU0Uc9Rwp0EjJ4lUfwFHqC4XHy6PWufy6VyP3r6gMbJsiHORFtInYjmZCVRSHQdybBz7o9294HlqdUoyKpk80Qu7nkFk6qJObNSODYmR2a5nmvg0ZpzMnY07UI4XmaJ0SaSHdwdAv0IGG7yGukT3tDSdGtyLZQxE3MTDI+exkpy1prQ41EsLsKVgc+pjZGRGyRkVMyto+EPyp5IWSxiB/DnQTMnjqP4Cj1RtLnNGI14w/wApR+9eM2QU0r3eClYhGnRbOa8KMOQBKawoCyui9F6yQemuXNKklyLwCLrJPecY4eY2AOYgU93nfJctcFNKXODHOW7TT1GYc3FxKO5Kbi0bk+G5cL3ukRFiU0XPaEd1DJy2CPGXylPeTVB7Xw0Iye8EqNgDqFwiXDnxulGgpAypqPjuRR6AuEx51nRxOTOrKP3tNBFHQQl7lU5lBMcgrDRlsXolPKJKuroFXRuUxiLVgpBu1l1ELBsez7B1TtJnguTERH5HVgL3WIdV+46w00kjaMRc2peZpx7Dp7AmN87wGsb2jFkCv/sa5wi4eCF4sNL6uJ6oaumMfiKejbBIJI9KvamKPSFwSO0er3YMe7In72Jhke7HDzSDdpdiUWWLXWIerolFOCc1Ea3TVigLCxTtk6+cQUffmNLQc318v7moZcRSvjLZzIqllqeb2VHmdIEdMnPUg5UZcno7prGRMQFjEned5XdyaxPs2CJuLTBEQ9oa6B1lZs00LQ1unE3Y0bkekKhj5VLrxR+NI5FH7ygAZHPUly55u2Vy5qjmsXLsmuQ3X4cnBFHVqZdpauyl9rRuwYhxTTkeYXz1MD2PiYTFPT8tMNjUO/YsF3uflITtpSRhz5Xuc5oR3LTg5xLnBf8AGLmtiur303JCfkFypSHRvFLDTcxQNjifyHvkpWcuLTjEt3lHppY+bUdHGX3kKP3pdamJyKEbrYkFCUgMfk0Xu07XTkUUdQghZXTySgzzXV0yQxPtEEC2ZRRtY6qAwhg3qXc0zkRtuid0ASZWclgsA7yxnZrV+WHdvla4VQjpKkKWNhcxt0YwNKPlPbLECXUoaYabmCKJkaMrjJSVDahiqJhBFK8ucUegLgseVR0VsnMqSj97IbNDXOEUTsHNkK8HdGkepadwcIsImFX0KciF+NAhshsEbK25T3ABtnMa0KPFikanyyXayWQ5Bok76MY6R/lpFe5YwvLvfbd2yx8u6pXeUST8twkEtVSxhjrtdzSo37tNl4x5jA5ic7lFz3Pm5kUT6GqZ4m64jU86VyPSFwePCk1qH8qAoo/e0/Df0oImk1c8UR55cjIuY1ZhO3QTTpdHWytoEO10Tddk82UzlHPYCoC8U1eNNvFC5dJIXbNfrTz8kPcXuZuQRSvN8mq2jtjG/F9NNylI2OYc7Bjt0WrcJr1zSoZCDYyOlppTK6iGfCqNlOeJVHLjcUekJouomcuLXi78aco/exi8h4g4CfiDnB85cea5ZEoJpV9GuQdpfpuggdLpycbmTWJmRebNYEU5yPYoIi2lKMFA5gDhuE33JwuB3YXMQrS4VFQ2QB2hRTe8RCie20koeXhrX01U2OWSQvcT1BcNZzKzo4s+9QUfvRsZwclZWKA0urq+gOhOt9QVdDZHdSmwUrdkAok4XJsASnFHsvanaPkzDrCAdmjcC2hWPn2wdsQNgCm20xVkxF9mh8tzE9rKcZOKPUFwSPpqH8yUo/fWziZDcimcnwEBzbGyssVZW0Glui6uhpfaVNCYzIGmaE2EJgxEp2cnbA9Udg+R+ZCHQ33ELDzyjaIpzkHrJXQegbu8Q6JNrInqV1Hyj1hcNj5dHrXP5dKUUfvodxRRWbMA4SbEtusFgsQsVYLtpsironW+gKuidwmbIoBX2ebk7J/Q1FBf8odI90jf1JPcfOCMXOKumOCsCiwrlvWLymUE8juXyieoKJhkkAsNeMP8hR+/pf5jLjHHUqof5g+yurjQusnOWSyRcslkrq6urq6ustAUFHp/w4G79lJqe41/Cb0jvUu/Xl8xBsJe51DyE2VR1AIE7WptYWKslcakTJr2u6QuER5VfRxN+dUUfv6f+SSS6z3yKyWayWaLlkrrJZK6urq6urq6ugmoIIdvyU0bvT9GhHuOgdNrmMGepqXfqub5YhdPZmW07inQlvQDZZXFyE9HQuN8iU2XZhyDbW4PHjDq52DXm5KP38Zs5xWXl7q+uSyWSur9VlZWQCaEAr6NV1bZyJT9B2PcL/lfjVrHFbWJtS8EjAZUhplfuI/d2DZQ1eR7ZBoHbyOycEBdE6W1urmz3bUHEnQsp6iKcacSfhSuRR+/JR3QOyPc9QCtpbotoENAmnQIe117lOQ1CPbVrS5YNjD3umfN5Yyf0aCXEcu8soxlG0jz5fxninXPSzsV+NLKyDVfdqZK5rqLiGauuLv8xR/oCj0BW6bq6ur+iEEF+RbF6cnJqOgCcmglDv8AnHCOaQvMTuWpe9vLBZU13vq3fuphZ97tdZYlNaHBwxOt9gyw0AQCsE62l01yBUFdNCyslEtQ5H+gIvqGlYLBW9Cyt1jRqbsF/wAv7ORQTuyapv0g0PkJe1oYOQZpDIWhR+5u8UdgXh0TqSf9zU3Lic4ot2y+5rVsxrrvJFtAExoAd5lZFWsEXLLUFMduwgpzS0lH+isrK2paiLdLSmi6Ed1y1y1h0XQQQQVzdyPd+yuio43Pc2m5KIDpZpcg39FG7kAgmu2JWxQOSLcSx/OUkboZIm2IiL1drScpXbMBavKC1l1sFu5HyprUURbqBTXEIljmn+qkhLWagJuyYuyI2dGnjpb3boE6y/6k8zW9yqZjaZtVIXMfcuaC1YrZXuvMm5g5FOVslkQsQ5F8to5QHeIxgwsi/JEhqaDIcQFZHsjpbd5VldDoilMZYWPL2GN39Sxl6SobjIrIJqamGyuE66kAR6AU1HW287kwKks0yyZPkqOYOYFnckhXjajOAue9cxyycrvWT1zdjYprnBOeXIbLdyLrqNqGyF7jsRkrWVrn/p5WKdvqeiybUPAEzCdiP6eEXiqIQ8FuJTUE0rOyEll3EnQNB0Odi33FveR9myvQKy0xWJWBQhKwarhe1XGLg22DSsmNVwUFu8gBouh5U1dyLZWZytLYp26I36Wi5f3Y1qIjYHex42/po/bObPkbzmOhLQFkUCmoPsinHqGg0nfk4KE4lzkekB5TGEGyOyAIACc5oRkNwHOXKVmtDjkW+UbIN2I2ATceWZmNTnOKZLI5Zl0JuS82W56BZNWyazc4lEPKjuG+2nLbf0w7VXmUJxeXYsF0UEEEe3SAhrPJiBp5RHfoabITNXMaUDGVk0IWTpE57igwlBoagbp7g0FxcmM0a269qtfRnmayz1ZgaPIxu9O86XOosvIuYAsnFAPKxehG5cuyButjG5tv6VpIVRZ7CFM8hNdq1XunHY99B0BPcGgnIpoyM0eA6mtRjxTWoJ1m6FyALk+Sy7pjEV2V7Ju50iNnU/uJcBiQKc3Djv1iy7ILIWO4iCyUkD/C/wBI3sdy8AF4uu2gQQR9C6kdkdGnBSVMTw+a/QwBNbGUWgal1tdgnOJQbdMYiswEXEoeY2xCuoXAPdlDIw5snJQ/Tg9Nour5ElQt5j4w3k1tNyJP6NvZwAU+6cFINAhodR0yvvrCzOSEizmMajihG5y5LkRbQBbhA2V9tbIBdk6RFxKCa26tggV315vljay0uMae9z3aW2Og7mNEEahXuuyYomBrIKt0Di2KZlRC6GX+ij3Y9xW6e0EOaLaAq6J6gnv6IQI4Wth5bhTLmwsRqnlF7ndN9O3RkiSVZNiQYAi5rVmFfI6kpxTuopvuVk6PUFBRoyKAtkDZTEh+u17S0/0NOcorolPTir+k51ugAuM3scLnHqHRfosmsWbAnSlN5khZQVT0zhFSV9Hc2PUlduj8dkOxTPcNLKRqxOgKyRcmO80hLzE6xr6fmRn+gefJSO/RKcV3DwiNR1E26eE0/LVT5J3bHpaL6O66aB9RK3g0QUfDKRqruFMI/wDHz5nnFNqYMz3f5XnUoWsgEAu5egm+8dFk5t0RZX0j7jcJhMnD6yID77sibqQWZRHyuKPbsnFO6B0nUBUXDLsq6oSOq/Oj0tGru3VwN1o6yq8PCzi7zLzGtMjnQzFxceFtvWlzgCdSegFoRJKbtoew93UQnMTUzZzewVLO5khiypD94Su6b3k3FH7n9ro6O6Go6nQJrbqmphTu4nU4ta/zucjvpZAXVukDd7cSLdFFVmldUcQkqI7KONskfFYwyt2XBSG1NdUjw3T3WJVsA0J2hKj9ArEXjpiXDYId6aQeLrY+VUfdEq2jPb/1C7lzP30KPSwbP07atYqOLw8b5SxTuuSi67fRHYO8nTSUTpwygpwhK1g4nNzqpcNjLm10ZjpbaAJ2g2XMW7yfI0bIpyh9E9y6yeBmdGzYz8aj3P3F9Sj2HZ6fuoZM2O0d0xqRdtA26AXDaXnS10gTn7PPRGLq1utpsexdyndMUn6M9W6F8lbM5WWK4JGBR8eeBHZNG7joAg1O3LG7OObuyCPeD0Si68cZybJp/wBTnm8LP2xPSU7sO07d2r2uyy0cNjqE1VGzt3IBAXVPCZJZpI4oaufmSOcihiEUENh128zSrWXkKdZBWuuDxCSm47CGFgCNtOHMtQ8ct4jG6cbaAWDI7qRyijUrsiAETcnuoe3olMdid8k07wb8NP2l+v8AJTd2+5sjLI7gJrsgBk0hW0aNyMQ85EBNYslQxeGp6ocslOTRdOFgU0eifd3Qciy5suyDrLgb7tq4Y6hrKCmU9ND4b8fxt4h+rWveFZMZc2DU+QlRs3kfsxqkQ2d+VGLN9Ehfl/tCa1UO9C7v9ydP+WqEp7borsexjT1a6wXliEsrpS0IAMTn3XDqfxFRIebU1kvMe7QWanLH0j72+7EOQJYua0pzA5coqhmNLIeKL6tJZ/FKgrJZpz3JrU4IPR3QFy51gO98QvwV/wBD0yhu1Nty+EbiUYv+7YdA6xBuntBR20p5AFP7mlOlsd3JrVkGonJM7xMbQ0mZbTSWRKaNyVdX9J2zndh+o1lint3Wblk5blY6BpKtig1dkXaEr2juuyHmLiiimC7/AFG7PAWwpeFvtLxJmFZ953HZNcWm905FmjXuRJVl2Rcu+nCKcyS1z/1K2QZEruuyJQHpv9zELhxc16LHA2OgcQsrrumssi8NRfdcwq5KsirW0bYJxuuwG6O+kXq/l+zm5PHDSBJXnmx/dWVkNkVbQO0IVlZX0tpFGXyUobEp5SahziSdQ1WWKsrehJ3b3Fnh7TdrixeIuC6Mr9NeQLmIknWyCKuidLoIle0IqHt6n5vdB1k4cyWnaZi4Fp9cBBqxRardICAWKwWCxusFgrLFYotWCwssVguHQiKLm2prJzVgsUI1gsFy1y0WIjqCLboMQjOQxAdGE6NFtukC6tiLrzLByIPRfQq2xUPqj3fk7qInNsbJTVDGf1QmtXDKOnko/A0q8BSr6fSLiVFTx0ZCKCDVSUr6mVnDqVrfA0q8DSrwNKvAUqrGUdOymo6d1P4ClXgKVeBpV4GlXgaVeBpV4GlXgaVGCItNJTrwVMvAUq8BSriELIqulo6d1N4GlXgqZeCpl4KmXgKVScNpXMeyyIR0ag1cKoYXUf0+kXgqZeBpV4GlXgaVO4fRqsiayrItpBTvmWNLCDUxhDiE7U7iFUV46qX1CrX1CYrxFO9cmnkUsMkLlw5jXVPi2WNYy8dUxeJavFNXimrxTV4pq8U1eKavFNXimrxTV4pqq8XQ00dlPCzAQEpnkkidhPxNh8R6oTVwn4GvE/gv0AVNC6aSkp2U0XRWVbaZkkjnvpPi+rxQfvKT4vVxaHl1LkdGqnjMj2NDG9VeB4uSyiiZHHUVL5fSgqXxCWBjo+GfJ/CiPqS/FndyhEBlkYnTFrnb3DG1FM9pa71Gpi4T8HXifwXKyijMj6GkbSx9FdWNpWSSukfdUfxPV4n8yk+L1cZiyp5AigmrgcWVR18QH7uCFpNQ90kisrejTzOglhiEdaAimd/TmONLcFP2DhzGYKeVjmUhLZa5ol9UJi4T8HXiXwS1BpJ4fRimZ0V1Y2lZNM6R+SBVF8P1eKH99SfF6pYxLFO3EkaMC4RDy6PrryBV1h5cT0Ar6QUskzeVSsX7NeHgepo3wu6OGfqU/wCHJnf06rywRd4qOVQP8PUSjFTC0wZ+tBI6MSgB/phMXCPg68R+FZcPohAOivrG0kc8zpXuKCaqL4evGJHRU4qJyBUzWdWzXNdOvG1C8bOjW1C8bUIVk6zc80XxOvjMWFU4aU0RllaA0ddVHnX1z8qp2tHCJpquczOQCJUTufRnbooZXww/UKpfUapN4lVX8fUrx9QvH1C8fULx1Qoamqmkrp+dJrSxNe6aUzSwy8l7a+a8rjI6J/Mhl/gpd547mmnbYemExcJ+BrX/AA6Ckx6a2rbSx1ErpZHHRqYqL4evHRemti2R5KKtpbVqYqL4epfaq14zDzKZ4VlwOK8+sslp+hxH1d9LKSaGUr6fNfwEq5Jgpr3TAE8hWWHhaXog2ofyhs7ojY6R8z2xR6xRulfUvaG9EbfIJGmGF2MlM3zTC9N6YTFwn4GpAI6De1YZHTPR0CYqL4etXT+IY/hGSPBF9DX0JfQl9CX0JfQSq2h8I5rVR/E14i/CpaQ5uj2h7Zoy19lwqLl0escvN4v0cR+W9ZIPsgWrEIhMY6Q+DEa8THAnuLjq0Euq7RNHdvSE/wDaR9D/ANrF0xj9CQYxsmsmztbUOlDfUCYuE/B9Hi9JzGPCOgTFRfD9Tjn8oVH8TXi383DJc4NeLRY1EMXNlAAGlXLyafhp/fdHEd6t/RFSyPZ+1hUlbM5t9baMY57/AC0QJ0Dgn99Y/wBrH0QgU8ZNz0tBFLKf03sWO0lremExcJ+D6XFqPw8jhoExUfw/U43/ACBUfxdeMfzcOl5dTrxGPmU/Cory68ZlXC/ndHEfmOusbqnpXyrmwU6mmfK++gbdBi7JodI4UjYk+rDG30I0adaZjQ2SR0j9aaIOM8rppOp7XvgIOTz5Xny3J9QJi4T8HpdKxr+iaJs0VXTup5iEE1UXw/U46f1QVR/E14z/ADAqmk50Gh3VNFyY9ayXmy8KN6/o4g0eLfsoIGFtRUumPRGHOPg5Gj9pGpKyUtJ0DUbaFN7qniM0tTKHu1jYZH1T2j0IKvlipP65O5EfI9QJq4T8HorKptOySV0knD6nxEXRxKk8VC5u9kwXNGLUmvF3uZTmplT6uZeLnXi514uZeLmXi5l4udOle9Aqi+Hrxr+YFcGl6+Jy8qlkcuEfO6OI/Lgi5r6qXnOtpZRUb3M/axJ1ZLbJXK3VlcK90xqc1d03uj+3peiL9Cm9BnvkpmPU8bGN9UJq4T8HWpl5MEsrpH5KlqXQTRSNlj6ONUaso9lSfF1438aRycdLq6uroFNKYqL4evG/5rqjm5NR1cZnDpiuEH9/0cQ+ZUu5MBcgQioXCOWWvjld4iJc+Fc+Jc6FCeFc+Jc+BCohR5b6QvuimKkiEk08hml1hjMstXIJJvRErw31gmrhPwdeJfBeiUHLg1Zy39BAIr6Q002NlSfE1498V6PUE1MVD8PXjv8ANdArhk3Oo+h7gxlQ8l5N1wb/ANh0TRc3idZJzag63KyWayWSuslclBq7KC/0/E2agLJn6dD0Uvki+5CauEfA14l8B6crppXCavxMPRUwtnima6N9J8XXj/xXI9bUxUPw9eO/zEq64DNaXo4zLhTyqy4N8/od/wCye1FbKysVbosrIBPKuoSTQAFWtpW+Xpk8tF9yE1cH/wDX68T+A4p2gKpah0E0ErJ4ejilNzY6P4uv/kHxXI9YTCqH4WvHjaZxV1SzGGUEEa8WqOZVP3IsuDn/AOQ6HOvxFzlcFEBWsrkLILyrZbK6yWRQCs1QH9hcK91G3J9e7Kt6K3Z/3N1kqbiVRBEOMVS+r1S+r1SqOJ1M0eSJ1uqSvnpgOMVa+r1SHFqlfV6lHi1SmcTqeW7itU0/V6tHjNYqviFRVMv6F1koeKVUcf1erX1erR4vVqqq5al11dAqHilVHH9Wq19Wqk7jFUFd7y7Y+ZU8j4JRxWrX1WqR4tVL6vVI1UgnPEKkjx9SvqNSvqFQV46pXj6lfUapfUapfUapfUqpfUqpfUapfUapfUKhS1kssY0acT9QqV9QqV4+pXj6hePqFJI6V/3l1dE+hdZJztgVkhKQC+6ur+rdXV+m6usl3XYbaXWSyV0de4VtMldbdeyB2H9GAT1lpb0gXL27hWKc1zT6FRRiGk9Bkb3+gBirhOYWlX67ELuiNCFZU1OJhJRtbH1gKkpWTDwEYU8LY3/fxSGJ7jc9M07pW9ANjpHIY5Kid1RL9jS1klK3qHdjNm+6qlfUyW1ut1ustJJXOjTXa2VHKyITVERYUUEV+F+Wmyop44wayBVMrHvv/iG+64KfoStyrdOPRdXWXQNPxo3/ABsYWOIc9d/RPpjVn+MAuR+mXPLlDEHmZrWu6LdJ9EdDP8YO9twwFtwxZZLy4dF1dXGh6gj1N7f4sd2jy9mWBcPKnH9LWwVgi1W0PWCraBH/ABzPcdke2RCPtP8AF6B9AFeVbIpv+Nb3Kd7WdiLueei6yVwsluUegaNaXF0b26WQgfgh/jWdygSE17LOdl1WRarKyd1QsEbA9rlWgctmEUVY+zB/jmdyrFW+wabF1Q9zKMeesdd9IzKSZ/MkH+OaFdHrtoStyj1RQZjw8aAZCxxyLv0acd/8cwJwAQN0WuWBWCDEImp0dkInItLfQa3J2zG8+S73ueaVmT5n5yD/AB4diB5iNk7VqCcmpxTvK49tTpSNUzXPZyJF+ZP0YB/kCo+yJV9AgivwVImDynpZK5iFSE6duMJa0yvzeB/kW6XTG3R0au+r00WB9Ef5JvdyY25PlYe6ugjp3cn+iP8AJN9w7ntJ0X1b3KPoD/Js9w7tKebnR2v4aij/AJuPugbMvoFL3QRTU7+q/8QALBEAAQMDAwMFAAIDAQEAAAAAAQACEQMQIRIgMQRAQRMiMDJRYXEUQlBSI//aAAgBAwEBPwHdChQoUXhReFFoUKLQoUKLRaFChQotChQoUKFCjZFo/wCoT8hIHK9VqFQI1QvWTaoKDgpTn5gL3O8ptON0KFChQoUbYUKFChQoUKFChFHPxmq0I1S76oMc7lERebB0LUeUTlSVTqSEawC9cpj5tG6FHwxshQibR8RbK9JqcQxOcbwVB2aTzYGzHNbyi+UyseEDPak/M50KZMlaXHJQYSgPxRYohNGoqoYF5sDKGE0O5CbUd5Ca6exOPnc6EZcYCZSDeUTKI2k5VPAT9osx5bwqdQPUdgT2DsmAqbNKc+TpChSEXBYv5Wo8Gx2CzU0wqdXwdpIHK9Rn6vUZ+rW3wd89gZKDQFVfAhB34pJVQ+AoQYoIsz7J2UbwimcqpyhamA4JssvXrmdLUTsp1nMTX6hIR3dL5+cmMoy8ym4RlFcIPU2HKDYTl5uU3lVOb0TBQzZz9PhHNo2dKfbCO7pPPzuGox4Rxhaf1FOCiVpWkqEObt/blNT+bDhMXrUyIci+l/qV/kOEt5UqVSrU2Nheqx/CeIcRbpOCoCwoUBPOpxNulHtn53cIBoyFFtMoiE0AqLRZ3CbdyN2qQOU5xduaT4U+SoXScHZWdpYTem3S0D56hgIuXqOCDtQQN5uFUTcqEWrQvKNm4wnQpQtGVATVMcJ3M26Pg7OsdgNtSbqeB2FWIytKEIMWmxcpU385QCOFl2AvTjKORNguBKNuUMIBQhgZRg8I26Pg7OpdNS3SNyT2D3SVKkFTCmxsLFMFnGRhOaR7ggcIopqcZ4sUEEFCx+Jrcync26VullyYynGTNumbDOw5cvSfzCNMhZBQ2CxQxYFE2cc2iE5D/wBFFpbymjCGRlAgIZUWcAQqNL1HIC/Uu007AThNECPnK1loRreAtc2G8mFqIKFQrUUSimg8pqcNS0zDVVpy1MdCLxyFyuE0owi38VGnobGzrHZDbdO3U9DsHsytCiw2zY8oslBi4TjbViE1NGUxuZUYVVmhy0+U1TNuVTaJBlDZWdqebdI3l3Y1BndKJUqVKGwqMIDCaqYyg3M26rkWKBhagVAVNzaTpKb1VMoODuLVHaWk3oN0sHY1nZRctS1LUtSnYAhshObDU0YTBKphFwaMqp1gGGLJybQE5sbQSMhf5FT9XruLdDrNGowh2NQ+74hYXpiSqyaIYmEDlHqdOGp7y85s3Is5ZN2tLkbRYFdMJfKHYvoyU3p/1f47U7piOEQRg30rSouL0oGVUy5VamNLdjXaTKcyPfT4XOURIQB4bynsAxyUGSYRbHtRb/qE4Kb0qmh0oZyPgPwxs6hsiwCFjuJynVMImdrTp4MIPY77YRfBgcI1saaeAm/yqXnC5KLUR4an/g2dP1Pp+1ya4OEjtK6c1QpUo7XGEETsATA5VKq5sE2meUIa33p1YH6pry6HEJ7g0fxuo1TSKa4OEjs69nHNgjtJnaFTHkqoSDEr+lxZo/VTh2fCqiWFUo9PWQqsgsVR2o7mt1GAqFX3R47OtZ4QQR2Od43NT6mnDVN5/Exs5PCBHhH3YVIFrocfaq5l5i4ynU3N5F249oTvwKhW1iDz2VZ3u02dadjnWpjnbxu1qmVqVQnhH+Lt+wWkEKt00ZaoLUHAcLUmkgyFSqCo2dw+J9QM5WvU+bFEbCbQmYyn84sGymthVOdwEqmtae6cImVAAsz7BCz6QcIVTp3MyELUn+m75phPq+Gp6HNijtDIyUVqs1soCLVd4ErJR/hMa0/ZROfFqOag2ESqrNL4sVRdqYD8hqRwnOnlE/iIVRmh2kprpRueEAXFNphuSnGSjZolARerva2QnOxAVOkSo1O0NVQajoanZ4XTCag29Uz/AGU26U8j4i6ESSibuVRnrUw4cqIQRChQXlANpDKe8u5uU1sbKiBhNaCMlf1cInGhiZTAd7lVqH6tR/8AmNI5X1bpRXRN9xO0iRCqU/TdFul+x+CVO02o1fTweFVph+Qi1zOUSmsnLkakYYuMmxXCaPKnZUTeVUIjSovhv9oVGtHtReTkqSDJ5X1EnleITuV0jYZu6lmps2omKm+fhKa8t4XqakXAIuJQRRs1vk7nphgqMynvc/m7WygWhF9gfJWrzbpj7BuqfU2mE0yJ+CqSAtRTXGbFOfPCkrJRwpU2lTZvKJKlSmm7jadhdPKnd0oBYtIWgLSFoC0BVX6WQgiqD5bHwVuLN5s984FuUGwn727z8vSfXdWaY1WKa7S6UDInfW4s3lVH+BblNbFn2HNigN4+fpQCDK0N/Fob+JrROqLO/wDITmy3ShRgZTsYRVI+3fX+u1hi77yVKkqTs8WCPzdL5QX2sTCAi9X7FZVEY31/rua6bP3jcfki3TcKZwhYZzsqtgymy7hMbpEXGyv9btZpT2xcGU+w5+AI3CnYMqNoR/hUMNlMQRyY21malTp6RsGyv9bN5CKIlERYGE6w+E7xaNn9o2ZwAggm+T81RmoQF6DkKLgUbPbK9MrStJhaUG7oUXhR8rclAGZCBcgXJuB2BR2RJXjuqXKDgE09mdkKO6pDytAKaI7M9/S4QQQ/4vp/qMTj42CAggh2J7Rzsav346YkoIIfINx7I2JJx8dNsCw7M9keLQtK0lRvY2T2x7J3CG2N1NsDtj2Z2wiLwmNk9uezOwZRR2MEDsRuPZuuUxHYzlDsf//EACYRAAIBAwQCAwADAQAAAAAAAAABEQIQIBIhMUADMEFQUTJgYXH/2gAIAQIBAT8B/ucWg0kYIf08ogj9JSJnGCLtGk0jlfSyci3vKJWGpTGDkgdP0mreLbIdUYpldWlHjplznsNfQ1N8IopSUjqGxYo8u9UFG2bQ1H0NKncbkZJvMISN8NFPKzQxjWUMhkPrxPNkhr9NkjxJ/wAnbUSnav8AiePYWNfB4+Lt7jvTT+4umRqM6+hwVbigRyOkiz4NWoR8XRVwePi9d4vOFedfvXJ8yT+CEyYJNSt8CVndFR4+L1CpZDNKu6WyGhW8mK4tX0G27zAnJU2TZOyKroV2f8Nl6JPJhTu7voJGhMagavF2UjJEzUfArTqFtZ2nYljEK3kw8dquOgiRmom0EYfG1kccirk4syW3ArvckkYtuRW8mFHFq+lBBGdTslD3KWuGRvZFRTTFldkm/wClT+Cni1fOVfPR1Go29DtAlZK0zfkb3HsxnBNqW0ypxhQt+ppI9K3IlDpRsLcQ99h7Ip5JKWVI0Pg4OR2TKnOHjtVx0VUavUhVwOo5KbuztMk/AyLIeNPFq32IIIIHgrsZNlZDRDRLN6kOh3V6ueikJEEGkgjB5fIxjOReP9HaSlzlpRp3mz6S6FJ8jNH6JRZ82RsvTXx0lUajUasNRqJyYimn5wak52Z/gnuc8iZJOVSnrJxZjssUISzhmk0/tqsFhVRI1HVTtFlis2KnBs/4aJ5IEpyqUnHVXF1ilGTFixclXMFPyLOpdWl2YsKVmli7sp4wlO7EypR0o2srRglZ+x2WDtTX+2ZFmo6CUjW11m2K7Ys2QLB8XTFVI7Pde9IQ+LrGbRabr1Nv4vVxinZFSh+yME5GsEcDeDwXpbP9Yv21fGNN6/VGSel2d+DdkXWKtOP+sb2Ev053v5Mk5tVx0KlInByQSR+4c5Ky/cYbIwRXzlTZ8dFoi0etDslF5tGNfOStz6VZ3S9Twd17a+SSSSSRcjEP0U2dkryLN9TyZKy9NN0rzZduskl5L004u6vBHXr9FJt6KcnZduv0UnHopu2J4Kz7NQ80T6KbPJdt9FODUjVdMkkkkn+mP7Son6efj2VfUT7H9Ql639o/qZJJJzf1L9b+ueL+wWD+zfS//8QARRAAAQICBgUHCwMEAQQDAQAAAQACESEDEBIgMUEiMFFhcRMyM0BScpEENEJQgZKhorHB0SNgYkOC4fCTFCRTsmOAwvH/2gAIAQEABj8C/wDuDtWFUlpftTCoqa3KUhelci3nFaYnt/akKoqOxRMgoCW+7jc3VTUtVL9jykNpXOaeF2dX8tinjsW6+OoE4OH7GsRgMVibu07kZRecP4okmJUxfxuRRMP2w2z6eO2uEaoqQ1DYYOTWDisUOyt1cqon9m7lJAHDO5IK08zWwLYsFP4XhHLGVUIjeiyGdcVHKuIWFyNWP7EtGTNq/TbDKqAq2rSuTU7wUAhSvbFzsFSOwnJFxzNYUAZYrjdhfn+wOUppA80bVoygICCnjXBferchaW9GFU7wacyjDISBCpAMI+Fz2fs00j26DNuBK0oE5QW/ap12zmoBYBYAVYqVcrjuCfSkHQwVJSWdKKibj3bMP2byTE6BntUTWXexWKMaIWkpKLvDVHgqNtFzQ3AIBogZRUbgb7Y6hprjVL1+ABMqwIF+ZUXVwaIvKa3ZjvUlJWnJgjvWOo3ohGksGAQRPwXxrJxgAFIYqFmajckgxwnGsx1sAIqVA/wXQldCV0JXQldCVpULx7FgsK8FgsFgsFgsFgsFgsFgsOtmxliiGG1Sbdii7GsOzyVpwi4/BSkgYYoRmVEp8MKpVYVaQUWqdQLgTCcAnE4IQ9qMdkYLZhVgtpioe2StFc2F0EZOjFGF3hqICZKteUTPZChRtDRu1H6jAd+aL2G2z4iscPU/JgwnG7acLUMBtUCAtLBWoQACmRZirDMK4NESouaFNYKUOCkpVF26CpAXTO2pxgBvUdie7co7EBZ0lIQ2FQo3A7woSJ3XDtXHHjcjXuv8u7E83WRYNB2G6ocPVYaPaoCpqdpey5BYWnFaPk7xxWlEcVo1ZKQgCii7YrUSDEVQ2rim/wAkMMYL9MQCkYM2oWcFaY2W9TFc07snC4J1x2XgNqDBg0Q1jv46VQ4eqjSHBvxUvFaVbi99mWKlXEYr9PnbVN0VB4Vryd/sUHiBr2KGURHeEXtxYZAKAxqAQbsCtQjCcFLMQUm6XZRIEYLGIRJgXFTxqMJBNlncgTXDaFC5L6JtkB7orkvKm8m+MFGvkfJhytNhAZLShFY3qTumocPVMMhMlBjZNYpeki97RxKwEdy2BBgwWCjFQggTznYK1RmDkAc1JRBX6wntWMa4HNPe0ShtTuFVop0FaDt0ltyRhpRCxDYYxUjaWnKqagMFZacXRAviqyHQUbfwWMVMQKo49oImw0vb6QUMW4pxczgAiw0nJUQxDVyXkws2hFxjM1xozBNf2hG5Sd01YnxWJ8VifFYnxWJ8Vzj4rE+KxPig4+kY3Hv2DrpaMzOpsMUByjqZ53KPpbb1uncBFNtUlqGEG4o8mS3gpzXNCiVKsRRczPKvMDejHCablERUGCEJzyWMSjGEIq1KOSzjXBUYjzTK9IKNJod4qyImGawNUVFQUFKqNHoqLnRWBUC0+K5juJcqLhcpO6dUxnZELgZ2j18F2i36qDBC9EKRX6lC3i2SkHe8pC7aag3MVbkLIkMwiFDatAT2bFOccVBQGSFo+zYjVEVbrpNK0uOQjBfptbR90LBGGJXPKwqi5/sC+6gKjFsSsFGE1AqcS3ctB0t4TKGmZZhg4KIMRXSd06mjGUYm7Z7A69Pmtmh+pFYrRmCucp3LQwUoFZXZqSw8KpTit+CJGZQs4tnFaUVETA3ISJWxbypVZS2KShHfeJEmt5x2KyxrrO+UVZa1gjkoMA7xzUX+FUcqibh4VEHNRCFB5W0Oosojmq35B5Q6i3RiCrPlzIbKRvNUVSd06mkpNmjde/tGPXnOEpqZUYrFTUCbDvgVKRCnnXKS0i7ijCdciprCqC+sENHFYb8E50IyUAATmscFExR+4W8I1RhBaXpXZoPppSk3NyDWQo2jILElaPP27FOqJ5oxX0FyYUU2Gak1FpZjgVuVHbbpQ5wxQo6Ycp5PkQg9s2uqpO6dSz+WlcpDuh1+jYRo2V9FKdYNTYbLkVOqBUAccN6hA8FEeJyX4KitFRcf8KKdZE4qEIuNUlJxCi8rSd4L9N8DvWmMc1ZhE4XQaL9Sk2nAIlxJJUGc0YlWWYBRxqgrEIsqDdqkoQhFMGMcFtkmRMJwUjFPi+cNFAucG0uGE4qwcWGCLKRtppyXKeTA0lAefR5jeEH0TrTSqTunUBoxJgg0YCVyjo9ul18bQgx7bDTm6SNshg+q2rRYuaVMFTUlOo3MlislGMVhCuNsBEGH5uywWiCVsXIUx0Dn2URSDmyuA41B/lDrA7PpFSFlgyGArgE4Mx9I1mzC1SaPAKBy9qlj9EwuNqyi6Qkj4rmL9UQCpAH26N04xw4p3JCG6vlqI2I89uTlSd06hpyZpXXfx0evmkp/T8d0EAIuC5srx18JFRRgotwKEZzwRfRNtNPwUladnnU09poNy2dCjGL3YJxow4hkzSHLgNqLityiav5H4VQqiZripJyfCOCe8CQEFziFMkqxSsByiAnNbFxjimvbg4Rrpe6dRSUm0wuFx9ERRJxPXg1q/Vow4NbKK3KFWUNaCQo48FpGqNWxSy21cnAQag4YBaJWkAgd6ots01vZbC41kZYTQoWyY3nna6obBVapRFxwb96gi43rIzUHOMNgU3T3KEYqS0ybI2BADASrf/KWoo25wibhHal191KeCgZCrGqDsFK7vqwubFIwUpzWHislvqggzJWKNG3zlHZig4GRqYN6EcGBG5bfNjJkbUdKMTEqJyqBxgomvmnwVpYVSU6rdkw3yCLg8E9hsk4k2YfFQbB+woNoy5jfS0sE1tbaIejM36Nm03WM2CPXwFNSCjBYVQ1s8NizC2NUaw/eo0fFaZARsO5RpECM1AGKtUui1NDODQuTZPaVCsATJVgGLjz925FQzdNQ2qJrdSMEXRgNyFJbJtZRRFLRhRYoLGqDw2KILrKtGkgNwWcComElyg5w+Ki2RGI2VF7vZvRc4zN9z+wLtI7KMuvje1aLSVBtGBvcoGlI7ogoikdaUQ4O4rREQhax1E7sI/GqONcCtiOBirdHIKQUXfFEMmc3I1hjBacUQx1qlzd2eFQY0GJRcVA3HNI2n4JlD5NPRtYKNNEucc0eTIi3IXJKwdJacEDsTmxAgfYja8ojuaE0UdHN2jVBvMbhqLXbMbj37B6gbSUoEYZ5Ilx0Qv0qplTMVo3cFjdnVCrFSwqFWC5qgWghaFGIrTPsUrj5aTpRUTiVBEf1LMOCnlV7awditBhczCIy3IveHNJMnFCic4PO0XwiWkQdjOCaxtJpOOJwRfatuw4Lk2852O4aiSaweiIXAztnr7RvUHKAgBs6jwUlkuz7b8NTypy5vFPpHzyEa+FwlhLTuUKVoKaKOjsAaiDVpmL9mxOc7nEbcUXOMzqKMZDSu2ewOvxUY41S6lvuRubrkLrBCAaIKA9CHibw3pwrjfNhrvBWqSipIZlYSGppKT+265/aMfUDVII6MBv6nvrnILOqFnVAuEQids7wjVPUTQzahFg4Kk5OMXDRGzU0f8tK5SHdD1CWoH6owqwu7OoTqlLiseoBDU4KCgxkTxVk84Y6hrB6RgoDAXKOj26XqEKDat5+F2B6rDqHBbm1RvTUwIIlpgU94wJjBTC2G9a7Ajddsbo+oY7ApoKZM59Vz6nBNYzao706GSmoakGu1mot8FMfFRkBvUSQNm9Of2jcLjkIok5+oZ17+q41Y6+OW0onGGaJ9J2KpqU44BSkrIWxFb0bQUQICsnUwyQa1o0BAyQo3sDmDZIr9M+zOt38tH1HFQ6yMVv1k5lBlHP7prG4Wse1vQCLCYB63BQOaIXGuJ1sc6ogkbJoMppO7VTGbBH1FC5HquFWHx1UBioCZU+dmTkoCTfqtEaTpRROMM6oLTMeTyVpR2qakpqF607VYlC2BSMGzEJ7gYjL1Fl1nYv8LZqP5KUDvOSIa6O+Cj6Q25LEnjVaOS3xiiw4GrYCESt4uRN2J1kyVjabkfWMslLUTUR46gNYIlac3AR4LSMsgMSrNGIN3KJ6T/1u80jgsZqBxWxBp5yg7AohRU1FQbM1S0jtUTXvU9VM2TtHqtrxg7UYFG9j4KKzKy+tZrtO5+aLhJn1RgMVHOuVWBU2lTaY7aoPFoLRKsuJcN6FrguSo2xdm5WqQqDZBbVOQQrlXFSWN7Ig4g5r9Mw/i5WoQacdx9VNacxfnAKczuWwX/ysqyrNVtzY9k71PBQyClVNwCzctBoFWJWJWJU/iFNqksZV6SgxTrnVhXAKalXC7ZMxvWkHeKi0x9UNG7xTsnNO1Trkpmrj8VpH2KV6Y+NWVRcolSVkGQ1E1tWi2uJCwgpTWxROCgFCKkoqJUVMRCEGRhpcyIuRU9RpISjFB7JQKD2813w9TjgjnxUdEEbFajK7oyU9XAVGWomapLYtqx8FKrFRuRrLnuInAQEVoNtHa78LlIm3HFTMeLQn29IgiBOVWMbs1MRUlF5AXMQ0ZBEEY705pHBD1O10jkphPGBG7qEBnWDbETkMruC5qzWJUIlRUlC59qolTrnU9u6I4j/SrKLYEo7k7v8A2vTqkFJYrFTKxQbkoH1NL/8AqJELWJWN6a26mKjVD4pphC0NXK5BtU78djXfRexZbkRjFPbtHxGpxWKxWNU6m03oRh6lGW6OKslsSsFDX7qzFtpsNJNtURNneoBoaN1zSWNzfVjd2LbXKvSwMiiDiFpZITKc84v0W/c6zcpKAQCAaIshZs7lozo3c0+pAoFRxvTOpgKwDgnufm5catEFT1k1K7E3LNI0PblHJfpOmfRdihygtPyZs4/hReYmuJuSuTUApVTk5QdzM1Zc7QpPr+UaN+I9RgFYn8o4EbtdAXLRxd9FDlWnaukcVoUUTtcpSUzflfnVI6ieNydYrldifYKrD8TgUaN825hck50ew4+juRBECPUTeFWHUQ1oiSobFLqE1JSWiHO4BdA/2yU7DeLkXGlEQIyF2NyVUahciFhVO5EmptMznQmNvqEocVM1Q6h/1NIO4nNyyW7Xijo/adi06V7vgujLuLkX+TCB7G3gqZg2ArSlxQbyzLRkADU4YwOojVCoa0Fp06KabSs5lJ8D1+VThVLqHLeVaFH2cyg2jkBIBSxEuPUKYZxC5SxanDFMbybA0mBmsVSNYS2ZElNUf8YlEnKd+awioKNY1EroGWapGZtMPx18n2IhOG7qLbbbVMcG9lcmCYjHqTjZtWhDFGjLWBpqa/tCKfvganuOTVSw7Oo3r4qyNbjM4XAzKmo/int9vX+Knw1m+uaHlDxpnox90bJi9yxJ2m7DUWXCIvW3OsM+q0nPd7YINbgJBGGDdGqkI4IxzIGoiVvqhqwmOuUDo81MpRnLrvsrioZjUzUa5K1SdEyZVs54BRz10faog2brA3CCshmWayHAVx2uKomjaTeiVBqjsUVFRqOqgt6G+uObeunhVHaoVb6hC6LraNs3OTKChwJmdy2AVzrGps+CjCI+i2KVc8WugqJwzBCnXQj+MUxuxqjcmrIqstwrh1Gljj1/jc3o3QSoumapqS5Z/SUuG4IxOVkbuoFWTj9VLwuUw4FDlsGzxUeSjxMVSsZRsa6wcAuKDcLLRmnutRaICSssrnVNWW1QC4VjWNIrpgNnXiPaoVbDVEIOhIoivTx2VxNWlzGzcp82inDepqClr7LsclAzCmJ71ELEJxc0uDmw0Vo+Tw7zloiib7F0ng0C9KuArj1CzUTsVIzaE4bD16N2GVeiomqVc+dznccgiTzqSaieo7wrBGkpVYlYm9G5Lqoq3r6p++fqCVUqp4Vzucu7m0eHFMo3YnSK35DYp9QgpSUCLLqp3JKalq93USoDjBWjDYmUnYPJn7eoJKepDW4lGibzaFs95RpITOAUTj1KGYrm2rNYRWiAOvWlEI8nImfFOoCQC4Z7UQRAj1S7yl/9qdteVE49RFUlNupnVgVzT4KYvjXhQGFTYYjCCJkOUEZZFPBxB6g11JQtc6JmV0DF0DF5uxUj6Oha1whP23bDPadiA5EOhmV0DV0DV0DV0DF0DC84BUZdQtJLQSugaugYugYugYugYugYugYugarJoxZ2LoWroWroGroGpzaNtlsBJUbnULSS2a6Bi6Fq6Fq6Bq6BqcG0LWuIkb4fTUYcXGIjsXm7F0DF0DF0DF0DF5uxUzWiDQ8gCs2GxAxcZAe1adKaU7KIS8Sv0/JaPi+LloFjO4wBecUnivOaX3107zxK0xR0neowv1fJWjfRuLV+hT2T2aUQ+KhStLfvV+o0PFlxgeC8z8n8D+V5n5P4H8rzTycew/lea0HgfyvNqDwP5Xm1B4H8rzWg8D+V5rQeB/K81oPA/lea+T+B/K818n8D+V5r5P4H8rzWg8D+V5rQeB/KoaRtG1hdGNniuVfMZDamjlWssjmic1EG0mneqWjwskvZBW8nz6gziblL7PrcDKMRJVhvtO27tecAi5xiSqLuDXO4BUXdF90MHaQuhgxcYINbg0Qv03fNQpfKREHmUfa38FAyaMGCQGqsGD6M4sdgjT+TRNH6TTiz/G9f2P8A/U1w1nk3931TWMm4DwRBzmpIObnknPPSNbaG9cnEaQiw9n/cEWuECNeziblL/udYYwRccFDF55xu7XnAIueYuNVD3BrncAqLui+H9g/C6X5MHx1FN3ynUlKI0dHMjbsCL3mJOsD28CDmNiBo+jfROczhZOv8mPe+qiEH7MVbaoqia2VI0QQaXCBmFy7O6/jr2cTcpf8Ac6gAIkqLp0px3Xdrzg1F7zFxroe4Nc7gFRd0X3UZ9IQRBxFwHN+lqKbvlUVCNnKP4n/F20INYMXuMAtLyguP/wAbPyudT+AX6XlIjspBZ+KsUjbLrr9tBaPsLT90Nd5Ow4hto+0qCm2CfQvwBgiNs0w9pkV7FT2ptzG1GzzctcziblJ/udXKUg/UPy3drzzWoveYuNyh7guMLHFpt5cFHlqSHeUTSvh3l0z/AHl09J7y6ek95dPSe8unpPeXT0nvLpqT3lac4uO0qh7g1BOT9KtrBi4wQaMBLUPb2qSHxVK7+RuAPMGDScdgC7LGyYwYNFclSUb5mhFth3Zi75S+idZcGCf9y6X5Qul+ULpflC6T5Quk+ULpPlC6T5Quf8oVlrxxLRJCE2skDCEd9wvpOio5u/Cc92JVuESBJYyRccTNTxCoX9l1nxQ3tI+CpDiYD6qjO1uuZxNykXK0g0vRGy7Ezeea1F9IYuN2h7guUff+ynqqHuC41naZct50Z+FZpD6A+Nyho+0Y3dIwApV/T/5GrCj/AORq/p/8jV/T/wCVq8oc8sBLQ0QeDnVOt/KSpaYQDcw3abvlDj6ZawfXUBrBFxyXIURj239r/FwMZNxQoKIxYzE9o7btpstqpaNzsoj2KidvVIzbaau6Y+OuZxNyBEbssU40vPzvUPcFwNtWYGK6b5V0491ecD3V5wPcXnA91dOPdXnA91ecD3EwW7doRwqoe4LlE4YgR+KDhgZ1lrsHCCLTiJVN2v0rgPoiQu03fNUxds0bS52wBf8Ad0zaP+I0nL/tKKyf/I+bv8IlxJJ23AAIkpnkw/pTf3zihewRox0zueeyNl3kx0zxp/xGy83ei72Jto4Jz2mRdFPZCIOeuZxOq5Zg0m87eL1D3BraLun61UXcFxnd+6sZs+ly3k8RTWdowUBgK3vzwHFUf+5Xabvm7bMGUfbfIL0vKHe638qw0ijo+zRiyLwawFzjgAtEh3lO0YUf+bkbgpT0zuYOyNt3l3889GP/ANKJMTeYdsU0b1uU9ezidXbYP03/AAOy7Q9wa2i7p+tVF3Bco+7902ODtE3Cc2TTqTsi4yi/uKo/9yu0/fNUkTJrG857sAoeTs5R3/kpB9Gq1SPLztN6yxpc45BR8rpRR/wbpO/wjR+Ss5FpxMYud7dQaemEWNwHaOxF7zEm4X0vRM52/ci53sGy/RNo22tFNiodqXUGcTeaxzoOdgLrqN/NKdRvyz23KHuDW0PdP1qoe4LlH3fvU1+0TrgVZ33HvjiVR/7ldpu+auX8oi2hEoDF52BASaxvNY3Bt2y0Fx2BR8oeygH8zPwWFJ5Qd+g38qxRwoWdmjELkBdDBnnsQbRyomSb+bgYwRLpBCgopsZn2jt1Aa5sQnbpIbkM3fTXs4m7tccAi9zouKnz243dHpG838VyVCP4C40tcW6WS6V/vLpX+8umpPeK6ak95dNSe8umpPeXTUnvFdNSe8tN7ncTVQ9wXKPu/ep9Ee8L7oYu0RVRf7ldpu+VpGzRtFp7tgWFljZMb2Rc5RxFHR9t8o8Nqk19Of5aLfyrLCKJvZoxZvSqibkP6lNM7m/5uml9Ok0WbhmdS2O1Uj3EzwTe1t6gzibj6SEbIRe8xJqFI3LEbU17DFrrv/U0Y7/5q3lUXdFxvf8Atq6HuC5R9371MfsM+F/kweYPjVRe36XabvlMofSf+pSfYXGvLQ4NMYHAq1SeTMc7e9y8zo/F35XmdF4uXmdH7zl5nRe85T8jovecvM6L3nLzSi95y80o/ecqSkbRNYWWcCVOsB3MGk7gnUhzuNo24uMFocxuizhqi2Mip9QZxNyl4fe5yNIdB+G43YGYKgOY7m1UPcFxnf8Atq6HuC5R9z71sObdE3S44NEUXOxJjVRe36XXMPpUsFSUnadrJqS8q4s+qjW52dM6yOAx+12mptgsN4n/AB1xnE3Kbh97tl5/UZjvG26WO9h2FFjhAhUPcFxnf+2roe4LlH3PvW6iPpiI43QxuLz8FNYqi9v0u0zuzbd8Nf5TxZ9blDRf+OjHiZ3aFvbJefp1xnE3Kbh97raRmI+KbSUfNdd5RnPb8QqHuC4zv/bV0HcFyj7n3rZSD0TFAjAzFx0DzNEKdVF7fpd8qH8aX6LGuRqwqxWIWNeNXlPFn1qmg3aYKm7xF2jb2aNo+/XBR0bhZH8Vz2+6uc33Vzm+6jRvcLLv43iKJ8AciIrnt90Lnt91c9vurnN91c9vuqRb7qhbb7q57fdC57fcCDaZwIBjIQ1bWNpBZaIDRC6Qe6F0g90LpB7oQdTOiQIYXGsbSaLZDRXSD3QukHuhSePdCjFQBiahSUZg5uC6T5QukHuhc8e6Fz2+6EaYOhSGMSuk+ULpflCnSfKF0nyhdJ8oXSfKF0nyhdJ8gXSfKF0nyhdJ8oXSfKF0nyhdJ8oVikeSMxACsEYhdL8oXS/KF0nyhdJ8oXSfKEXvdFx9WQ63LDVb/WUhG/NpEdQABEqDgQd+po6blI24ShqTYY50MYDUTWioOaQd+pjC86JIgibRlqXWiRDYuc5QEfUFpuKJ23mNdDQEBqGvGLTFGkfCJ2dSeKMN08Y6i05Wtit0kIwhK5ILBYVtaYQbVA3HWzCKcA6cNmpdbdCO5c74KLTl+yQrKlVJTvz/AG3GqU1P9xwU/CrFQH7lmQAtDxWk0OTtEC9is1h+2+KHeqK4u6hA/tIVNHtqMV/d1OX7RadklNFADAXs9TBoiVNpFZc7RA/aMls3Lds6hDPNaLwfagc4poLgEGbf3FFEGE81aOSs7FE4NRd4ftCWrnfiZBZ+K3InarHpOx/aOK0RFbFisViViVipQWkIagAZrcAsVpFRODUTl+0Z9RLjwCg1c1QQYOcf25FE3pYLSb4I2cVadlgo/t2H7fl+5oDap/uaP7lKPrT/xAAsEAACAQMDAgUFAQEBAQAAAAAAAREhMYFBUWEQcSCRobHwMEDB0eHxUGBw/9oACAEBAAE/If8A5tH1c9c9M+Gef/TN/Y46YMdMGDHXHTBgwQYMGOuCOOmCHsNbowYMdcGDBgx1wYMGDBjpgwYMGDBgwYMEcGDBgwYMGDBgwYMGDBgwYMGDBgwYMGDBgY/udOkF6EQpng8xppQriZV3LulxqXCga3uLpwJSxLY2dkSdaJ0FKleyIN0aVGyh/wBlv7lMokNwOFKqiWiGMoTCd2iA6J2kRqT2CG22aG4TRpErchaKEzUOuxC86qok1NR2ajWFdFpG4v6Fnj2nvBMSuEKdRI27Gv8AkR9i34Y+jHWOmOmOiU2Q5hISsq9diE1vsKBpQnWYcjbTvv2E3c7mZCaSbYxrHCORXo0U1sGmiejKLv3I6JKNBO27UVbrprqSQEg04KYixPeRW8EpXEjdBTKyiIuuuCODBgwYMEEcGCOCOCOCOCOCODBHBHBgjgjgjgjgjgjgwRwRwYMEEcEcGDBHBHBHBHBHBHBHBHBgwMwRwY+yXNwS4boUi81pXVQsZqryQKE/IaouO4zdQJ0EkTS0CKv6CHQ0S3ROo7morNSmRpoKqhRbvQiqQOC5Xl6Xga2Q2ipDS2GtSZcSSSQsbl0i3iVKutRsFI8/+e39vuMVIcUN88jXdiR/SBIisJbCqJo+AZGsBt2SSehULnojU0iGM4aUBnGy2J6Iat3QZN5NqE9hO/6Q4NqRwh8jSSuBbTYJ6VlW3FpVqQo1C7ELS7biTf7Ty+5b+3wQQQIRWxVJNS7s0qmsv7OwxFXvyKKFQkrhCUTqJ1QnghVYWRrQYSpprA6rNDS7EUkVHuRoiJdyQl5Za5QxFKqRQzabOJe4p0ivhwLqUncHIUloCVSyZaU03J2IGORjFfBgwYMGDBgwYMGDBgwYMGDBgwYF2MGDBgwYMEcGCODBgwYMGC2g3wYMGDBgwYMGDH2KqIamYS7YhJVkkI1tkSbShaInpj7nuVNg2KOFXY6KKIqycXbHOrAalxyd+xoEUbD1BKU1q2J2FRSSQqjQTbRJPRoVLahKqhKCTUlT1MhZiacNpJJaETVDlQMncVEhB/qCkTMQUbsXLQ6FsqoZAW4L7Dz+1b+8yTvrV4cD9CsX1bQ8jshTbju+BrvQbEQ2H7HBNIotCtraDFaTTVKN0ZIVoht/0OUXoWkhHWXHI7pa8GkSB7DeOw96TFL0uxNhueiUqU6Sx0id6EljtVIlRDoLKNCYLOSLRu/YuvDQq41GoNGjvIGJoC4B8PpnpkyZMmTJkyZMmTJkyZ6ZMmTJkyZMmTJnpkyN8/Tz9iridNJ90+CNSqIhIjgbcnZsNRKKkjG0iuNSnUWS031KqpqhuCIDSTH704UkjZCHXvx7ERTdDa6akV6FM0VadhqQWLrwXhF1iprJWojjR8sQU0yNLSiw1NzoNCUsqGmlUSdGluka7kz16RDIUTffQpadC6dR68bDamhIgjjpgwYMGDBgwY8GDBgwYMGDBgwYMGDBgwYMGB9umOmDBjpgwY8GPsK8ip8gQ402U1oyWyb3C4sEkJQJVbKVPBslKpvCsWgqmrqNlFBXkuptQT1C7Ma3oJb1KnDTKh7IZCgu6JvsK4HD7FLG0uXcsuTXJv56jMSJXUJu7sSrLa8x5Yt5FwkqJpNjPcbabXXUYyppl+Xz3EWVsxyHo0aBWvHTrTwUKFPsKDa8VPsV9BxGtJNud53EJSWtlXA5xXSoJ2/n09xbqGiCrTSelhdOjGTTU23CS2WLMxYac2Kdxu9Oh98Cm6bwSxiwylYV3+EBeEFsPWd2St+SRTtPy5Jm115EUuVDuikRAqMRVMqJbENZ2TqnBsDUD6IdxTuVeo6JIRqw4uyE1lbCYSF/FkyZMmTJkyZMmTPTPXPjyN8mTJkyZ+hn6mOuDBgnKMhDMyD/ACFPI3NaiQrxA6GkiTsWwpMjuxy9Q1EkLJlaEbc3D6YzsUCbepeJjVKCchXIbDLaRRzYOKWiRzJLpe8biRNRTdjnbCDSeGxaRNiBDiH+airPKg0uld9i7ZYUx7DUCHECBFYKujihwjQZ2oam5IEbv0ZLe5gwYMGDBgT7E2bbJSL5icw9z/bX7P8AfX7P99H+2h/30VBZvV0DZCGtCHsc3yOSSHIOYcg5HSPcHMOQc3yOT5EtjsI4MGDBgwYMGDBgx9VUJRJZuEhogcol7CQE9XrBGN/FWHqdx0bROZwqCeVDFMowpJoisSpsTpBFUWF6k/8AR0U1C8PXyGAKSaUOoho5LkluSgOuoeVK7MUjJqkE4klDBXYX0Eurkkgqot2IXSJ2qnVU05JKVrWSeo1rQprqxsZQa1BrhQ5WkCb36NC+z1FX2k3zoUcwREy90WfcOFjcFESn4EhiktiEkriI17lRd2cNmWOpBBBBawsqGynmHgk3/L+xhxTF8p7CXBC2RHBBHgZBA0Khx9M/rT4K5o1H4EWMpjgJFeeglVKtTMSaL0jXXkjnrKUMRuq1XboQLz7Bdrm7sU2FtB50k+SFTNvYSrbunr+xZH6B0dEq66BxALg58hqKyYnSyqPchs5ZzAuzehQXNLpKFWmUFNjU43CKe2pDNt9BETpzFWTSlSnuQmmYFmxFKtcqC2pOfYftCS6fyFotwuxGMlkuSHIdDYupEdEIKi9PitxIS+ktESqm7VFBnonsL6b6z+zx4Y6rsUJU34cCFUt7jW5d7yO7Ap7ZoY/yK0Niwgtpbgqs0pPciip2RAlkylNDqErsi45L1gpsd1UkomW00YtIjtXdSl0dh/mhqkpDlHqkpyprDVi0OzKzEqkQmluesFMeGUTryRiJFEpIyOp2gVq41QVWkayORiopbObCS1YevRPQZ1JJabC4JFxtK1dODBg7CLFVoEuwgmPqEM6xQ10PSPYX02dh2dD7GDBgwYMGDBj6memTJkpL0pV2w/xydioFe40oihDTIjYioZak4IjUR6gdGiwylNMueBuunKFSnsLRo06RlpzEIaTWzFuyk1gux5SEf/GCWhv6VB0xympuLqC3Jtoo2dCMschaVVoqakpVR0lRLhbFahBDbsue72HqEXZaLUc2aDFjfTqIFkXowU5GomtU7p6eg6qT8+qJHAmwlEPcVx044arISRrqhkyZEo06U9w241a0lzYnJJWSonsxXyVwIalMklDe4KpybHFoQqp1OJ5kz4YD8oO7QZadmnAk9mQ9mQ9mQ9mQ9mQ9mQ9mPwM7zuO4yZ6ZMmTJkz9XBjpgYUUI4CFsskIpqM3LPTQl64slDi3qSrb94c0Yilag26VGp3T2i5c1NorIngM/JSEFRxgZRLhM7ItA1IJ6M0meqbKG4kl0krForHB02oKbOnI6RVbhI2kR7jn5A7E1foJKdgqKKQSS+a6FdSwdWQ9mmuVLFuaKn+jdXJTY8oXURqOjX1ShKnGt6RBAxJZOrVzsI2IR2gNmcQ9StDAYaSXwJZKyosCFOUpM9Rc5o54hL3GKe5BOadiJJKlyjf4R3I+D45KhXRVthSNkvF51/Ri06iw2J6/FbFKwnbzw/wC+P9sf74/3x/shf3x/ThVq23VPSy8HPW130O07B9jAuxgx0wYMGDH2D35qJtuthwhNJlRObOdRsV5OZwvN0F0Ie0rdh1zY02pKTeF1K6dKwIHGVKzG2DhBqrnZ1Jzhus0a0flyK7XOw98ESTSK2IDknY7jU0SehXonvUkapVZvFbWEUSgO1AqaqokSal5ez1FCdS5fJXPUsqtxJyQJd6cdxm6PHZF6jI6zaSqyOBl1E6Jq5UW6OHUW1m2XcVGTt0dhZM00qN6DBJjbcJbiCJJaUL0uQcjRGhEE/A6bJVKohDUVqVKNitAlXv7FMhLE0GyXmrj0u3CgoKu3J6UEhNCQtgPPde78HzWxZ4xFVFdi1uj4EZOvpr4us/u5Da49YqhQPavVlegrbtJMcMq5HIUoEsaWw5VY9RlC2fLF85EEQJVHS2GlO4sVW6sVYa8LfsTtFmMjmi5c0iZa9+RCVHChSrfzkidxIpKSNElUKa7mmr0Gdakl5DwSklsv/RorhzookCmq6DW0LopnQbmqsDj1sUkFrbiUvo8MVaBG5yLfBOp2m5VrJ9iExS0samXtQvJR2EZSUxtmI5pWY3ZUOe01FfRJvRydlC9hUpSJIuoS0FplyvYhq71nR5jiTc9loYSSioV9RZWZqnPX5LYs6X4Uif6phKovBGK6JWXV9R/dYJVIriRkNJaIVThyMrZbQUTDyHTC13IMK5JXUMROg6LnUiqkGjJT4kdMqhk7DrqNFI9bCaaegqk2WqEmzqaebjVFaEp1Jq/IVtQgkU4H8sjKR5LSa2ElNgJL1bimoiSlVW3G1qsG1WFBCZRmTWNUiiZkq1WwlSo1Fz9StDqJSREFahqqBtvjYTUnCvw04EVeGoikessmqrSfZsiuvKVldx00Q3saBamMrInY0oTMaU0akEnFaO4hJ2a9jeEUlVLEzOj1FQs6pgl9VG4q277EQlU9T4LYtsdp2GDBgXYTgrNWJM1fgca2JYu3qH2MGDBjpgwY6Y+xlYlQ9x3eKQUxCbW33F3dV/0ElZsaEm3URskVhsjiiVNeQuqKUc6diVGw4oamaFqkOr7CnhE/wJCWzrsUzbiaOKoSKFUyPvEQFGWrIQlTg3wD8MUE1YZy4jUotvUaTjsIVSOyblWru73LJyuQnDO5admQKI0Q/wBmmkpHfUp0SG9ncc9nSM0EsKKa7X4Qlvj009yQ3R3dkRgdyvscD2XbkpFESu//AKC3WiUQjQnzHS0dzZDbLbUkZ1WgksoiZxL7lRbT3XAjibewbEU0U0r6kmCfG7bdimTpqunxWx3nePuZMmRHeVFebZt6eCqsNw93Q7juGzPTJkz4s/YylIE40n+jSdZTqxXKHAy5dHyhevJBKWYQsHbQVVvrUZSm7sTcqpkCG7IRNnqeUegySMVI7cOGKSlMtTVCRtLc6kJOEPcHELSgJk0S9B1dK2dmLUMNWcKqfNR9JKT0FiCiv1ctiLh2Wv4GjRuGP15dsdhzsklOegqB9pW6GLCRGHUZCa3H0OVqdV1uF+RnUTVk6hrS6IWp1qckjlVM11G5dRkKmreiF0q5ubOdyaYs0KV3ZDRJRNVxp6F8ipFYD+cSFIXQIdNGES3WooVC0d0Upkkm7F7pLN2lFXaxBph50LUIw2G/kQmJiWDR89t134EWHkmRNkKTHgjU1NvZfnrv7tjIGzgfQqo4LlDYh2zbnCBabtmaakuSsG0S0auMRpTIiVA4ulKmqcz6lajG+swNShO1iXdN0JN0p6j6inZNKIKJWTsiCVF3Qx0XFmUuXQgJluIe25UGSvNUxQbVXq7jamk69haKKhDc7DFLu3HPkiIqE2QiuqK3NGi+9Jo3IlG49yvQjlW1LWi2G5DcyJJkFO107SL4UjtAyBuo0sYtEtjaTFBrca/UnqCU6aXGV0ptJaiXOGkYoFpuFpAtmPi2hIVk5jTA2UnFjU3X+iFpNtLENMbdrQm4SjSbK6wrgb8GIbd5n1GGpJs9MWaNHyfL7fQCfFQf6evhpGqimL+o/Q/ssmTJkyZMmTJk0JM0+B6lHEo29F7HD0pQ5hCNaCrSkRekiRZEIZE03kucWKVhq1goqs7+m5WvYTNWEsENbTqzVG6ddORdCThCkUpyrVsJQ2QQpoWLjukTTFSExpbEZVg6tyIwFru5ercrGuPSRFSba5/lxH4N5F2TVQMEWyH9YEEZYFUacjSR68qKJMmnbjUtmSb3Oix3kFLYxpqRW1WzaaIjZC27rEqonl6EueztQXGsThDK6Q26ITH0AgXlBQCaKxLkn+gjSRV/0s+BBdGlfKDvO4fcyZF3O4mTSXsv98C7WY2BzFUlncPuZMmTJkyZMmTJkyZ+vd6foiFsBrYv2+CVhuAb7EOsJ8DVQDbzFRQUikzYmVrUNai4iowarTovISqJlIQ9hKdS0lNBcAIlhpJr1JpYKcy47CwjlItWy8nuYtKoPoIhVBlkFUV0qRaqjVpQT3rD55ipwXQE3NMUU60ilSt9FPKSjKEkTruF0blbysTTW92teEaTbtJDSkpLbbjl+hy2Th2HT1DHa1NEK1RTOrEnuTuNtONClW7qVclppSVsyg01QXqD6VPyGBIFqTXCWUulk61e+hSPSkXXlkF8/wCF3Qzy6LoldR5o6+CGruvzf34ua2G1pZO4rBuNKkl1qSO9RdXn5oVQrpsxPRsL3mBkly82hE1LsrV0EJrc3rLouLUZqHOyWOxcXYuxNCu/8FK7qphtCakKBkGtUStCB1jRsjobS7iVDaW5XqEnEjalVWR7etgvK0NUMQkVw6t3BZ913L2GuXQpu3fgfR6QkPbFlkotnDL9VpbbYabRIjRLkHp7bdZYtGo0lHO45WFCFODjcjyawQlsRCXtAkWMhWkUy5LBTZSaRLFxkCSr+BiTYnVmN3stonOi1kawbbSq31T+4Z/zrPqiiNtPtr4YR3vd/wCdZ/cZ6ZMkNN7+oyZrEKQYLNtMmhSmVwKw6D8ohy/wUZHkeXYfBUNCNVP4LwRJXMpg/WCFqCeohaTaN3cdSdqWgT8cDa4uytISjWpb1WE3Ht1bI+WiGgpoqlIckpG9xqf7FC6+izq9ymgllOeiU3QJLUbAqJk/h3JZrFyjbfV0LbykWWCrPcvaUoJSUSnMrtiMpu5SbpuheCNraJ5gtAT20O7I0TN6MalKthZFLaUPEs9HYnjVoiSkSjZq6uBzI6yFmJNmYnI+MFvLppXWbtESKHy2NyNyZMmTuJhtR7v4/Bci16PYqHedw+5kyZMmTJkyZM9M/YRuyQeUQQgtJVrt4QninCpB33NdirSY3Gio7TaUD9bqYTmBqcOokahR+SrThjaxHGw0iN/Maok+IMCWjV+QtzpzoIryvInChNunx+B5RFNdRJQdmwxzrQRBNDXTU1DJskjQ6waS1UrQplTeCpqFdtRHEE/GjUXkmvR8tmElqStE2kVOHLkutxmg2yWg0pIhwkybqJ1NBKkFiLoUCqJ0RArkv6HW7YlQgmVYIsTobKMnluKKpNUyXNApRSxSVYipQ1n4xOwqITimJsm40SXq1XJChRSsvliFSNPk9WMN4EIVSqvwVF+fBum9rvp95KdWNcAEpaI4dNUuyF6E1JprEFhPuN7cvYbWBtUk5uM18yVSl/Ua6rxNRJq6ogeskeZVcUu+gg8wplR5Dpo0vsUK8Ocjl1Teg+QQ1uMb3XHlq0IVRBUiNUmhuobcSW1rYMmqhaQQ7PVDUXEUFRJNq1WRtfLBIEUt0SRAdNHd6PsiZq1Ks7iRfW45PuGqiqzcendRJUAtarV1l20ZVtltxsq5NWYW0kAmCG0IJW5BSSYDnvcYQOm4RXggAjUs3Ga8yqdGpfCvQcZTwJCSNt0Qu1l+Bul6K+IfoZQp4afUz4cmTJkcsrRQ0ArTcuhUwJAxss4NQx+laT2IHdEi7kz+JHVRyN6u/cptcSq4sYEl3MFVEqaheXqaRNGi1J6PsUoKbtxtJOsSq6KSJkUlLK41ubjVZpoaWjW/Sk9IippOSmr78foQ7XWql3ft6ipVVHXliVRUz3Oo+5SBGlF60asRyqpSgjIzL5J0KqF6F1CGwikJTBCWpY1aXC73+B919M44tb8k/J0s5hvkyZMmTuJwq2WBeCPV0Ssuo/I3I+5kyZMmTJkyZMmTJkz9ZmhLouS0kjnUTuxs3l06C6Kr6k/EbPuTKm5NblRM53JESpopKlWg6odJ+hSl15KKpTdxVZSwt1FSijgZxBqLpcg1AuKE3bHmGIjWywrDlQz+WiguUJEpJCohCDd7bCoKrRpiWStb1LJVDQ4JlD3FJJGqaFBZvVNIxIUroDHOip3GG8GBHYXtbJ7v8eCmttRrLV6jBjpj7pLQVVBFwJLLyRf0ryG70HVCeheJhMhNsJM2QQKdUOmnRtCq7HcPPOtDVVFSrOgrdh02G2DdWJJGlUiJaPn9/Mmipr0tcGNOSxcYqjxqXLW5TyJS7i0KBEdETiUke36MSvV7EVFivDEroKaOZEVphyiUWj0K46V7JwUnRBzX9D8KIEeiGks/yPBCrhuHu6EfurPTPTJkdy3JIKTkLtq97MeZaKdRFVhGFzZFLep5xyQrUfsQmvE7EXadDVZjaDTmfcqJbjctDYv4E5ipzSNIdTcSLqhr26RuSlJYIJiXwNk0nCsJ7FDqW5CFJGfbpoQXCdCugXS1sLpkoZyiNju9Ciegj4CkobIoGsIdOgaNQq8m8FmomIIUhcUe4bkyZMmTJ3DAKo8wpGwLqyFB3NvZfkfkbkfcyZMmTJkyZMmTJnpn7CzdnQcpsSqtUEKU3CWyqyR3yReoTGWpIurcsStSZpN9RFByoJOfcfAfQuZ8SMvoooI7aQImr7Id0hwJD1G53h0IviU7PSfmgw73KkrpDSyC4gQd+idgkdnhsNxdEMVT+hpEv2MmWM2TJrrqRE5IKiaHCkJZMfNGNRsOETlNjaqKap4YwhTsNF1SH28CEEyo7OyF1ZC1WFMf3rPt0wYMGDHix9lRyBDhtIJpidqD0hrPbf3E8l83vUdMusEpTm9Cd17kGWjDo8fCK8xJsVrbyF9RFroK/iTRDIxRzSafv9inLSbFKlQ2ypjuVC90xRsQlToS60FCTUryqzsrskhdXI85GxG4dhFHSEzbaoW6saRvcckyE+R6XNGxI7DcoaRKLd7iSk7tURdzvYMdR9ZD0WujN3Em3jXZf0T6qsBzYH300sbxKfc5F7BqB9XHqKqpgmpRVUhPE2G4/g3apKi2GFZ169YI6JF/Rou1DZFql33E1oyoXtEldB6iSi7/AJdYJKaSp118yakCVoRUSOiQagJVEEhGRHCiXoImOlFupLdkkbNct7IgoilNtdjLO7VWJNQ1LruM1B/kNVMSQkWajlZHehG61oNESOlClsSMRG0MmHYacFCES1r0UkqKwNTdaZJNq8+pQkyrBEzner0Qp0hSdXX5P2G+qZ+ngwYMGDBgwYIkpfkPCScaFRVDL0ou4ydFExpsOFwxdUhAkGkQI6QIJIVbkPmgyb5b31HUvgTpOygvo1tNhG0N7IqROrcCm3YcUgdzsE2CuJcC7DhJK5Xo3r257CeoN05foRbhp6o9B36imoFXknM03uUEazatiwNdDQaKkKXsKfceFlNF0t4O8mEWvgI2aXE3vhlE6iAwJ2QgQrOgtD7iEy+o+f8ADtOwfYwYMGDBgwYMGDBgwYMGPrK46mqCtUVENuUloOrvJLci6X0QR4C6pMRJJIn0mUTTpRkZ3lVOVm5NEvyKGpKtdHYdUhUWjRqqIIWDqQOX0VxJwJKPltExtKdyL8fsSTRo2yfNCumSa3bdjkVpg34Evm8KuLjqRZOhU867DvuNGIXbsyobcUleQlonTzKzn5kzToW7IIU8k6vArCG2DZE+Yk2ImlRYqbGoae5Io9B1I7CoJC+7al+SQMuG4Qww/vtRjxQNS3+B3nXYmV1EnYkrDZX8aTJkhIUiEuiiNZ30OC8xc1GmjipqIdUr+hVabbh6hxOibtHmxYg1XsXxItuhnkKpKCESh2zs9fL37GlFddBstLS7+DWUrvQkTAE9fQaNMlBFoNmhuPUlUfpkpTpNGKaNu5LlVQrTqxiRmCVDncn4xlVjAxoar0a1Ohew2O2TikalNy6EWeruNxwSUGjVL6kiZAd8URBcOBiva/hY/wBgf08GDHTBgfYjgctBcDsI4I4EPSB1yp4hSJkNurVoVzJReHcbxRTyNp9xqLVI3gUFRZwX3eQ8KSN9Q3KzUbklrCg8mmki8RLtCBWMQt0ReIqZ02epV47ahG/G5SJaa1fPUdUCehaf17DPbbb1IKNNMhDrBIyVuClDh6iaKknqIW3bXUdTUkTWUrO5GhoNwkWydiWRSShacE99LGt0q9W9BKJZdhM0RpFp3pYq0VBXZVuCP3csjrUiS+5JWK2LsRJAQrcxuS34dVHCGtGrMfYwYMGDBgwYMGDBgwYMGDH2merSKx0y7MdH0RNYSDp2li025sRJS4pVQJbOhGBClNvmCFnYje4mLtkouIPNjUKW59SspKp6lSn1SxSsvwxxe6LUSRYSRYo1M5Pbgjadd6vphEsiVC7aIpam/YgrobS5Oiga2Mt3lCgXoxU6pbCgUkXfaBqfkKG9Mz2dGU0GyrgqkVJUFEktzTsIg1Iw5ULyfZQn0tAqJIcBRoHhrVyNOmnJRQlleGgoUvyDkJQmkkklGaEpQ1Y7u9mIkj8JoDvcyZMmTJkyZ6Z+/SuNr1LolEtaxsJC6O1uChUbg1CaqbfySzJsqloFhFHZfkTIls7OiVRKv8OYRyuKwKpbluQlr2lF993qVVCCjJqCcBmaCWfI0OktbBTcOJHQQWHqgmpuY6CDdZwf7w31BT0FrsbCLgq2hq8cF/RpvUc0hLgR6jU80jqJx7iVWt+iLjiRESYTbKHlYkVsUlUk9TERC1VONiglTmoeyFDQ0geI83RuxAoqZqNbJ6QGBpzsjE6ZOVDX/GwPsVn0won49hjOoRR+h7l6CTugl+wxw++khJYqJ3v6D0pT1Bp2ClFqQiIJDuJC7SJshUsWRLrWAnFJsJ8dwravhsQ1j+ibbqFhbiAjJhIY1ElZjDbdmJr9BOL6gS9JFaE14K1UkuHWCloa0yRatwOgll0hOyJsxFlG+5CLt6koMqu06cjUbashCdUUBdDe18UIbkvWHQnlMilKyRbsajQqBqLcnoxkCKIGpMoxZZTZYifSVBEZGhu1Xix0x9pkyZMmTJkyZMj7kFIqNFDLVpcpVCJPCI8237FEj4VKbJIfMMb0yNN2MpuUuPRtqjHeVxuNCVLUL7FIo6iq4lkNEyq00oXWlqo2lEOaGzCFiCVQdPLt03lk1HcQmx5ZpbkwCsZUWbwVRErzclTdcCe9NUj1GObsbzV9yc1C4xq/wP4NEI9FSJRKahbSOdXmKWlPcRUYiqqpL17Ddy7So8l8sbydu623K8vkw/Nobg8FvJTOIVhuFyWAMNR9FVTUKnLdIWhIklae6EejN8K5CkyoKSpLCGKsiLtNthyy1SZkyZMmTJkyZM/dsjvtd2nn9itIPg2Kk1J0m3qSjsI/PT3Fg3FC66IbFQ8RQuQqbjq9hXO/RNpWuSXquBq2iKCfyBOGVBqgurFuRqiYqhzGxjJdj7ii0Pgdc6+5ugKid0hrvoSJpYm46rjgrjohNVHYIhF2HFXOiIlAORtOKkqltNoUqdSHViLe3849oCLTUe4ncwq2v2LBuKxsjfmG5JS0Gwd+j6ROxkSGeYnKYnYsQmevJKsEqnSTpL5c6nrnsMeHHD+4wYMGDBgwYMGDBgV0XjHZtdnIstEVhSyCvqOwM5CVO4mNPBUdTb1PZOxuCE+hd/UW0Mto+5JupI0SMawqmwEqvYtxOtAlrHPJ266dEhrIl7moJv6mgV9hqFJNRKIHFbCEhyVYhhlpolAoquzXeEXZJNCRskesoJ+lwquA3C9hsZRoa1OlRfkkZzPRt9Lrqomo2iAtijqLV3I4OYylh8VJHNiuUy9x2PKM/HPbQaMGDBgwYMdMGPq56ZMmTJkyZMmTJrcapSQEdIyqp9V/B6Tm1rJAbDloE+h3MyI4n3HpcdeljvToicFCuWd0evSyI6zlGYvaohmKQpj5xccr2eQnqy6oINKHLNQTgTrodmQxDaltKeRuXq5gd9uXsU2yGMI1uRS2Dbp5xzLYrQhKhJLZbXo2X3HWE1HoQLXpNbrgcqUp7bicaDkW0E4fgsjH0fHikQhpboE0NH4EKLavyNbUTdyGW8NdjHSM6vj2fKH3MmTJnw5+6eYnDpR2YoWk5q3CKta5jIsVE4Ijom3QVg7YJFz0dqiYu5KXcazydEK58YmmpEOpSnSno9jYTQvlpbwRKaDdGpQoxBEHGpV5JkTJKkJFFQhUIMKsRsY9ERRNzOxDNB8idDG6ioKSISy7segwylqfiOz9GPOVdZbl8uRzcbuM1KUoTZCdElEN1F0XVFeXYbETSQ3d7iS27JalaJPRCBWawipuJ7b17lqJ1S8hrdD+1wYMGCODBgwYMGDBg5gUWsU0TOjmIFa3aZW7k1lrnY1huOCFoNJXccdJYvqVJExDES1ei6JV58hV9dNyc8CrrwF/gr63g0p2j6q+iE9iaCEyxwik5FUx0cLdEk3Ye60osSkU0JHzsbbCE9hOB1OwSUToXSzbVckjEm7EOapY9tRIZ64SpYdNh07SGn0gVBZq6IRNKgl/oQaj57ADJSejdP0OkU3nNuez9BpdiGnozBgwYMGOuOq+1mJewxtX2eo4a43Fp1RPUmm1WBSFH8DdbiYnt0XfpPRMiUv1Q8g3CS1ZBvtqF2FyPco1Gl4VbsOnRMWrUkkuSdhKUukSYrErIErs2YyrKDh+Q298exU7mDXLSORVU6E0IEKiQ31TaZJG7FCS7lDOJKR6otGMS7g45CUXRW4adQ5I04gUJspcEetJOffsVr3XVT7HJkyZMmTJkyZMmTJDqVgpuzKB2lYm87k6pTMyJqQJqVrkC6NRNInrAqNtuXfoiBbKmVm+7Fo189jqhZouG3r4dQJJKglJ6yT112K6KbnoRJfsVZuczIG/V6P2cFTXX1bX5FVMu9BXAZUDbwVIolOgiWwrEnpcYTGPLIqrjJJllJ7DYshqpdOhYC25kyNcj5C+4Y1RQG5r0LEUz+h3eeMarb5sQpjQWdfkdNTJkyZMmTP1cGDHTBgwYMDcKj0SSrsQ6W5civqXaN6XmmxCabmCZWJFcTkgsJl4244J6OhU+iRIRDXoWfpFGKnGg6g4WUBq18OqyOl4VV4JJkVA3uIZQ1nCiJGsVdQ3DHVLGRuCsRKknFXeo+BweyKPSV+RGpNdSSYfgE0NSDb/AAKkewvXcpTdiy8VrGDBgfYa4OEiUoJLgtDSPUT7rogx8n6tdvdZO0x1wY+3WlQUtUq2FA3AE4V6iEKQhxdbKi4K7E70JdULS/kL3jnq8UWeiD3oNVDak9/PsVjkRJW3GpW3QfVu48iBM7IkCReBqhSTRbjotHZlCrJ6IS9bU4akGlG4TmnInmU7VEIcw+dCWVk81FCLIcfm0VdrNedOrZDYxLRcTtCEj7EOlvUNZncSVXohlmVsVvGhFqkV04pYlBteCibhUH7RxyIFqUf4U0hNwyP7HJkyZMmTJkbjUolVWSobmC15mtMRGh1CPVTkszXJwGx9EugSHoNwN/K3RI1Avft9PmxqIVdim0Nx3GqRG/RKR7ciUUXiqZIrNgPVeLYIE4l9iHIQkKEJHBOWTQka1gkmqugw71nv+BolUdTXY2hqVhQXIkEZNd2J1al3G5cahdzJkyZMmTIlYh7TJF0h1KYoTrAycJR00k2gqHcZMmTJkz9XBjqxs7IYlLGVhYcUp2JpzYSCUrGvyklNEoQqixcd+qLELFkcbD1L6Ibl1HBa3MU6ncdeBxVk8JaEDM6yoPoi40QpOfoTCgKVZyhfLdqRxLi3gTVYLBCA5lLEik56EmYhIuu/BqTeRUfkbTUnqhEcxYqyDuSp2EMtCWpE+hJJRsFIttJPzF4u+gwdh2hU7TsUwU6qmRQ12JNolU/b9geSx3uS3wbRaXAtClBYNdrCbpOBIuoUTrwLkRPuIh9hISXYViMT0Kki1X1G2qEI3kQv2+B0iptVpd5ZSaWKEOxWIhubpRIaXaBJY8LLH47kaD4ndOX52IM13qEWG+BBuEd0Jqh2d6/IVt+Bf9EFM+B2dkkJksUn1Kjas5/NsUT2CUheQ6sd3NB1TQifZXqTOtFqxdgU11l0pIXbc1FrfPifVopY+HQut3uJ9AjfZyvWbfW5MmTJkyZHDUlvXpPPkSImKiqK4rdQUnFCxNUg121VCd5HrKQ3QOQbtXQ14gdQkPcFUghao97pBjv5EtTFU84l88EUVZbzv2Gt1ElWz8DpS4bGruzUCguJiZNfHRHUSSK7qqIE4VzsbRaer3HVGo09Vx4jGkP30JmTa0iBPoc3Ct3BQyZBw6oQqimhBUiSW1HCPzQnNR1qiI83FJVESSEHwM8wePWFkbqE4m+sMmTJkfcyZMmSTUSyRHcqMWTWjSfIZXhWXu5kyZMmTP1GxtkDpoPkbkREDioxtxaumNXcoJU9tR1lGhK1QNaFGOUBo5aa0Fa4WKMTNwo8y77CXJjCSVkrIndKvcQagynTYjEvt+2SOqqslv8ANsDmNoJLURWAqG3sNpoOzksoVvoK5Uz5KEnUqWQvmG0KVoy/k4fyaMztVdIppKGU3Fx6w/Q7QO5+7FsJ6/IgvmBSctJ96jVG8Dm5GN27kCilDtLluFWFIaZQa+7FRN6vQmEWo5Ew3f1KVTK7VMoolR4EgZm7I8zWca11FX7CUT1koOokLpHRFmOj7W7EUglZUimt9xXS7HsVi+xlTObpENSQdw5JXUk4Q6BBrCfH4HlRikvdxdyLLtohpS32Hu1ETViatxQrYxfpPiVysjQqVrcSKf2FRCR3buQNRgquD/W6I9dt9zkxotiG7RFR7/ItqJJlklBOpLew22giPJcaIsLRFlqjSkRD4kUeGniaQ/dUHptPQSo3fGNjEKatCG6UPA/pZJ8T6LwNV6LMizjXg4hsUZYQ/gHKvQa3INPYWbEkG2V7BQl+B5Qr0lT/AB+hjuDHtNl5FJUNFGghWmpjchtrGhJY1ukklfHegaVIgm3cKloWdCOKvYcMoMtLHqqCG0VF9eKIzgpHqUoGRMI0JkqO4iJuWSFY1ElwHq4Q9BaSLuZMmTJkyZMmTJkao7liQjd9UbhmaiiSesi00yxr8/yGZMmemfox0gggfRIt1jobFYqdv6OC422FKqNJMkSqE110MUW6Tkt3E6S+EOvdS3HFVskHBktv0JR3HMQanUfSgfiSh7okgiOJuORiqoc8tmQhQXFehG8NsowmlCHgaS3PRKRbyjQaK9MjFVjZ0F1NBHqEw+5cXe/TBgwYMGDBgwYMCtpqarsOdOhpymNXdrUWhuUawntWJywhrZmPrR0OEfHoMRA+kGoT6EyYzU7DgyWwnVhBhjE+3QT6IktBaFYiQ3XtUvVlC1mg/RHIZZdoTCMthsOGoa8SO3EdB3R1nYVhIl3GVCWRuiG3IjrQZYhJIHsIa3lE9X54RuLuulhDCp3G0HVYEqyxiI8cdI6V9wrIGkqCMlyV3LsR8ZXaXVcND2uYD7j+qhIPOaTuHzmfGY239T9lGhBJpR00E6Ciql22Tcm6kivLPks+Cz5rIar1iKx7X83wNyyFbnz3+z4z/Z85j/3j5TPnM+Qyb+omxK2gb/oN7l+ufFf7G/8Av+xNFDEnYTK+2c1Z8Bnz2fHY/wDd/Y239f8AYwvBImj0JjTUNXIupJ6DFfthoPgP9iWqI8x3n6hNf1P2aXvfshXvP9iyaoNFIrQRI+bUYy2oUzXsD4tkWfcrf16DKi/GofgyJD+0L9mCwVc38C8yiPJyh/O2aaecE6I6rbseppyK6SdLOHaIE1TSQpxekFT+mg4YmDJESJEEKEUrYpQ4hqISFplL1forW6y5S3EzSRbKo0xojFO20aKoV2vz5iDxhPZKox/X/ld/B6b2BK2GpZxnozUuWJdV3138OkF/7vgY2eltnzm30FTxSfJp4/MlaR6tf1F6V0WFQhReUTsvE1IvP8GVaIZsqUuHzPT3aEG1Wdw0TNxvwWXgeEbs3/T5QwBDnfO4XZImVWw1UpbL9MGDBjrgwYMFakq2lLYtCrIcd7P59fcqci0SkvYymlKLVrK+WgrM5bkbSfdgkQKGtn9c+Z38Hpl7Ct9L5DsIiDozXhceHQq/93wNHuy2xV3Gn4FPGh+J/l6fQNBarA+7+kDL+hCeVdZUX5+g18/uEYQcr+X2k1Bz27LguSKL9YhV6R4IwH2J124ZNg3s91B8pysG9qhKlPcLuZMmTJkyZMmTJwLMp9WGiCajp7H8RqwmQSd0aEjSyXAlckksn/RRtODbcMz9TefE7+BZ7S9gySdsISWrKa0atmy8Ol1/7PgYDdlt9V8Pt9ahfOPoOtCOD0iGQysJdCa1Vl2svoawA2in+BLEPMrFasaobljIplEF5/CGjny15siG9z+4rGd/+pDiyrR9UK4sbQV25+j1KXlbchSGvMs1QsHkQ+CHwR2IfBD8CFgVbwVF6CNOkudCLEZ7tOO6LBqQ3ZCWghUCr9EeSjEt1ep1roUCOuWqE5N3S2+pHo+J38FXZXsK3CQoTFUWz9+GSOM85fAw27LfReo58Pt4H05CWjUOjq4MKwlbKVSeiHuP6Sf6MX9Wf0MX9GOr88cyjqS/ooilUYd9eglUsDgUSUw7eOCT/wC4KjqNS7Ki9h6jfRhRR7JSxObS9ASX5ZMuohilQagGGkkuxVMgLkCGaIGnYvyU+z50Ifj9hlV8eBOv8PY+b9J836T4P0ny/pFhdq4FNW6WEqPAko29o6UKEwKRPvsnLLwTMKy4FXEOxjjy0tB59aoRBsRZcu5+ySvVC6CUg5madVCTsIeTY/qnyu/g9KvdFPXKt9Xfw+9CHPY1dtfTmX1Ph9vBQV/3DWLShbGhIlchkiGJMkhvDyfbTLun4IFFcZUf46KrI/Upd3x+CBXVzdkn+TTrJV0MW23CoNzmpz8mXf4XJDs/LUSax8HIkzDbBys2eyGzVJNxbJVFIbKrG71S9iYUIbli6K5/rDpew6sNCQCfXJJMsJNRwT2WrZcPUz1RbJhISranzfs0XR9GRqyDpsQxpN2tWn9irMoVFzbL78EY9jBP2kMz9FdjtE4Pld/BEkl4fhrKaKTaSdWqEenA3g7j5/bwUOXSJ0GPLX47jWvl9Rv/AE/sbf0fs+R/2S/t/Y3/AKf2P+k/ZTHIkoRUifhgzS7CyCw63Xg2S4qti8njUMl+PTr2GL3LH2kn4GPHzKjcI4DJllHYfVl5DlmgjQWuX0yVLH56VFlkTJix6YDeiS20t+B6ZiEldsdkp1MVn+AoXmMCzQhTDcNMXYwYEbaSk2MrB4R5XnfyH2MGDBXbgfLL18jBgwYMEsjhM1AzenBiVZkvYh6wFN1Puawqlw0/A+xgx9O+N3+lM01QvMx0l8F8/t1S+kghfCSkaYZ1Kd3gppe6KjGo7oCEmEQu3WslCyLFNVpfuFbqzuf5BGuqTZHndPl74JVblT+96Dxy1Dyq8k9KEiTehyIHJxhCWxNpNVG6ey9eehNQs+wp3KkTUXRCK0WXeZ528xuXLbbfgQVTd/dwtOew9zDHLb18WqqRLgnhXO7oljdq7HUiRK9vrXxO/wBPXVU+THQar1vl9ui+pw3hYwVYI/mevgjRVI9tSUFSJd3/ADwTtNY8zQany/cK3VlXy6kV1KINUVHvzjPvwqjpkviewsycmlZJMoNtEq5Sw0YgTLKsjvOLZEBJRRLnZwhhKpqbjJElsxCFoG48n7NWTeHLfgobVGV9icsiCWiLJolx43uGqhELVqrcPTQS+Z5NR9lFIrj618Tv4l/PCRWMph8cioK2aE0ZU6vw+wl4IezIezIez8iHsyHsyHs/Ih7PyIezIgFbwwcrbN0/Ma9USNEp0Ynfybfzjq41cLVkL0Uo20MxfuFbwMaT/J0GGYYUPiJeg6Co1Irj93G56wxNYNkSyE+DeMsWmp1f0FV6DRJdlfd3eWbAqm/YWEFThidNEC61NZNW+wrJox8aty7+B/hqAQObNl/BcfQpqFJWxM6NhFoVmpIrtIC+muv8zv4ZO4yvl8DYTEyJr9Pnz4V0yvtuGKDTTWj6GQVNmsEex4Gqhxlo0Z/cCe488KQr/Yi/uT/c9Gkz98YpuVatHj6aqEqa+Ffx4/8AXOv6Dm4SK6EVfuFbwTMe1fIA66Ieu2RbbP7Y3VqohakXqJzXsyHYvgJ5V+yVXmifb/8AqKr8x1NxkbrD3C3EA2oWB92IVSwujXco1ov2Ne7tBkyZMmyJ/gnHmZMmTJkyZMiJqakJIRjk4u3LIAXuPpkz9Jdf5nfwOWyyJPUfqvmM1FfINUQBhKfhhboHat/ioyulaGCNPwVE/wASICQkl1p9Qu8VNOo25/YHZz4lBWK3df8AAyih5h7greB4aDltELN7Srk3UMWgSfkkitDyxjvvV5BVoN7GRKq/luJrrl/YNSr8Lk+MHqJtPgdxpVZvhqSKL+G5PT8G5dubsk7Dci9lJFLbstWJphvMbLReQjAi1oOwYoQuLjb95MGDHgwYH2LFBFdhtuLvqrr/ADO/g9O9gxX6Sb5Kn86+FySkIaeqKz3Wf8YEkuKHyG3gePluGl/Rl3h8xDqISSHPpX8jw31ww9SuadRDWJ8M+4K3gVY07tNfQTvA1wtPQrfXkE/xHYeUZa7epPZdNI5DgHbl90NStqyqj6TZ3rK9XUunLJT47vuV1/hd/B6T7C7pVXRusXHovC7qHqBKSdUfMbeD5/L6Cui8Twd6gK3RP6mAfzwuavxn9gqmUiROg9X7greCha/pmEwqiuaqT4nobFOnBaR1TsS9yFo0BKtDiiHzDiY3rE9zzULI90IQhD/NdD2f1X9RdDFXxa+B47T2Ez6Neg7OrbZqh6Uo8nqvDROnVL5UPiNvA0fPcN4y6ag/UmZ2FQYvkrD25RJx1YhOh6S/qXjEQpp59wVvBpGB02EitDieY5AW0ZueRjbbo4p5FGoQX6EVZDZsiW6eZDqmIuz+0JVbkuI4KPUIYVkpin4F0QoLB/OL9jBgwYMGDBjpgwYMGDH1EtxGWxtJo7mp8mf4Ual+OMN7ySIbvwCgI/Ny0KugJfwJcuDtHp+VE7eRIhLxRQtCWGvtGrpQiAKZDUSJ8ckJpuJiEESUF0CC05VHzSEVMDfojEpkiBo4QukAFOl7lJM1ak5BubEama55LmuUIgIXTmpL4ZCWtyiLfjYVvD/Ehd757GiX58HF+fA1/P7HB+fBwPjwcT58HA+fBwvnwcT58HFj56HG+fAxvFpomNdkLKohLzHtcMlPklcuT+Oh8H6T5f0nx/pPj/QPBXjZnq+/hz1z9imJjRvxJi6DUi3GxJUhYDGbeoyw/ppi6bDfWRBdJ1rlwOxFoLZRj6F1DDbHRyhO0HyOTFMUfcbTDqQehIhbmetBQuioikFakQv+C1hjcDUOGoMD8C5NRZKifCxCV2KVDlougTm0ZZLUiXWiQ/oQLH2aiVN/op2Qa048UkiLsMkSTTOhxYJIG3qQJW/gakjQcdmSdnAmriGormqWFYAqyELe0mIQ1DHQjo1AqrlCuKdh7tnSQ/yJItlE1IrYfgwY648OPBj6tOVEVGvbtJkfWSj6oHzjwumVyXqJwRfwlndCiEUlFlPoy/ovmEsQul7efjaEgW39YoVVDZNInvsg7yH3JSuVBJNgtyJTNJconpDg1oMXaxaSPfNoKoiVIaGIKoVGOx7iAv5jKLjdfOJ0pUWghNxvpkyZMmeuTJkyZMmTJkz/ANVZCelstiiiD5obIi4Epbo3gidPMaDoLdEF0W6ToTUZtGi4Q7lWBC/8XXeyxCNX3Eqlbch1CER1yQkSSLKH4U9PA6qRoY0069LhdF/wMmTI+/8AxohNWMmOPCVL5bg4iq+xImZbfZaeCOqOmglfCr1GqU6tA7l10S7F4V36Z6ZMmTJkz0yZ+yx0f/GsCm01SJ5IoU6iYSqe9eyFrhvZ+aGqqIpTTczNOtCRpwfKDvCrtDuT8D6PD4EjqqodOiheJdjBgx48eB/UXhfR/wDEsFDuNRVLzULyQ4NJGNN/YX96whbRPoJ0Ei6L41MGiuONC7oSli6Lov8AgZ6Pv0f/ABU8F2K9038eRJlJNWqidROCla8PLqihRorI+52qNHfwKq8FGHVCDC4Xw5MmTJkyZMmTJkyZMmTJn7J9H/xNs1MZwNEirWqN2iu3ZCH/AEz1fXsSWnkOF5RvSIKyJuOELC8DQxqpJ4zRHqHIiopOikQRQprd46JC+9X0n0f/ABPb6WreSdmSDacawrPYfw0J4VwQvcVJSXVZal4VVCPFKEtuPlNPRBlm2C5GZaSrWsitcecCSxdV48GPDj/vDEnA4alCSSRMXAp0OWNt2Q2larG5fhYtLpyhadKIKGTui2ncj1ste532mbSewWnjyZMmTJkz0z0z1yZ65+xf/FmbGiUJljN3bwRwYKlSvSBD0YxbSRtilQvBp0ep0tt2Lihy0Srb1Y1rdpHiT4q/oSfpK/8AAf8AxZJmxVHARQ1jVpDgCFIOGmx8oYub0Lz8roaV7o0qOtSBDQhlxNAnsRVjj2glUmy0R3WMkEcF2FheLBjx46Y+0yZM9MmR9/8Ai2e7Fczm2NKJoNjDx0uSjSxZ6Dp0DsaGvUifiLk4kq1kfI7Mh2K2GTBu/ku65MmTJkyZMmTJkyZMmTJkyZMmTJkyZ6ZM/Vf/ABlwTF2uLwFxOA0sQS+W6XYYqqOi5KDTRo1guWKsOikorVmwkNdarJES/wCW/qwQR1j7S98jcDEKWUCZYXDZJXCXcgQtYfgv0VeiErwLpHWP+M/+OpQqjsRRvKwxQQw2xPQkSs+JNQStEXEhC/5b/wCNaETROwqcAPRKpmpA2ISJ69Jhx+JIXov+VgwY/wCNUdrKTvY9tBIVmJBJI6d3S43jQqfRwY6Y6YMGDBgx1x/3bzgYY2CQnQaqEijrvLeh+JER/wAL/9oADAMBAAIAAwAAABBFtjepLWhDZNSj32ziGioON7JvMDAIqKObd/8A8vokKUt/dvnvqfhC2VXxUyH5RFHDaHMM9RkED6WjjMEANuPXASQyyzNBJIR5nGaKCtnMynasSvx0O/GqXCACgLpV3sw4vOf+hRxxg/tFVeyzziamJwwhu5GPI7Qu1RnFrCJePiyOl73+QEH8JJSz/wCqQPUMdQPHsjx73teaKea08K6K2r9vKrerrLd7gm2v2Uu0kiAvMSTvzCYCBTPeNIJwoz8xVDLnf7qahMjucXDWL9Umq3Aex3MnfhDau0s/cWWaUcbNBWYp0uwoXOT+MFmB8et/oplpPf8AgW1NDwdU9bYg94aiEAAmVXkDtfO7NwpbYr9yYUyMqmqnff5PCQWUwyvpxFxbduErShgEruu9+vHcgUUzbl7filK6krHJ3K6kfaMo/DVGy+fJqEWdAH1sbyho7pe+Ey1ynXAiXz55i0U9lM1NlJPl5K3qu/UCqpL8AyaePKXjHOyS67HAuiknYfzB1z6xjnYqi7CoKmqmoIVGXgUuLG0aiS3gQ56XTLzFlo+9gixlM8LLaJJMVSFvAPz1dlh9aDuhjV5xu1jrhd2nB6WnuDlni2ouT2lAMcAFEapmo7HEyAGVu/m+B8GntGI2WHOhof3VzyeW41/R4h9VQ31mkgwSLqW89cnQYnGFfVQfSyZbMKaxIm0lkNuAIa52ApqMPPPgsG7U1VBRYL/c8v2w9412LuHbUyf/AI1rZy5RU5MDixbeyTtRo6ONsoAa5XAhX5Cnju3dhjp+woGpnkc8ivL1efPOo0LW74g7qTexRWUjAndhDrYQhmVR0ML/AJG0cKqFxNjRb+slTUfgJSj3DAGDNTsFa2VX7uoJXBSnMV70doAUOhJ6MXJqqC9ectLal6XLLigBX71Hra4ODiUr5kthEOESiHsj2TAu3ZZlvmLkxFpS9A5H5kiBCk3kh6yTzhQrSRTn/SVCQqNdhdyn/DE8iCWGjKUNhEl4zDFrFHMrqkQnCoKckzrgepOaZn0L9tjh5xx02HLauO7osQCGjc89yzx/AUegYdR7qBtOt0488MYEJtlPdbLk1ptFnKFi4iejDHIIoayQ8afsu4z3N38xEgtij0zFsyzBWAJu5rQIT/sTsZQelpZvPGCagZ5a9kG7JHw0LDpn0dQHfEL+JtIqeOQp14aM639rKsc35cyhQy7V/D1VJHlYhTE3QYxMzd41Kh9unilrf0Kv+rT6sn51ZMg5sKagvs0BN1G3G5xOh35jS2AoUBVeCE++D0neFrZo51zi6AT+vg7c5sQiPj7ZzN+GoTrET5GeZ7biypp6Llgp2saLFOIeN7SjyisHjtaW7UmGjvnNw/GxoUB/vrbK205ptAuoYvzhNN4zl6j3k+3W6SAd81N0cRqaP/ldBgc5IlRUMGlIMwGBCrtU5MehAhmYvtRqAHCBlKANUicMEQpoPqwN02dgR/pE2VoJ3E0ZL08sp+xDwH/vXD/j6AvFVIDNbq+BkJ1czV66elK/LL4ErdX0irCkEeXjwPj5hDsyKgpwiVeOKWuNYA7dir80AgvnK2LNkMU8OoRiFPYXaatsMVWXQZIAMVLfXnU+/SkoGA5cheVTjdlRiMBp0y+oMEPMbpbpkkKbbusicjp8z4E/FA7LN6RFTju1no6Lj15SIKcFL+93EytkPSAMydhbj7BGYv73yyEuMl2c2Kk08s9OoRdlM6sh9TRL8MXLWFnnvjsJ2oPhv9w1WzqZXUP9sb3k72KZ7zoahgkFvhv22MfvAViu6NPXZS6x5D4PD+KezNImmgu/52e8zmvrQcAHgTp6vIRmCLvrBygzviMa6qzm7AUMXFrHOKFL4uy+36h/vAFOnJcqSztlwr38eDtqsosaD9Bf/aXb/wAlwfzfzS/BAd+YMweqsnvZedBCfH7BDQNZTcuH6KcKYBsAeOeQxyJnwuBHpBRRBxexMMtP9yDsFcJ6uAW4av1Kkjun4fshv60492xj0Jtzzj4wgLsgRR3AMMtNxPYwvgsL/SK5QbG/Gj81LwqIsOFYXFre9u/ziE3DRz/BhXj5vfPA4+x4dHe95Xommk6Q1siA3AoOhsoie4s0DK/PLTfLIiyPAPP9Ku9Ydapt2gvYmWaVtk72Zmhia6HbRhOYlSpPyl78d11B7vmQjpJ5sMd8aNdiIvyCTOgDn/8A1XsnkappjipNKTsUq09J2PyyySRcgMOPmcGzj/p5M+vj4di9u1uxxSM2e2fPhfmMpAekwzbhIz2OKa0xNNxKof3Xm2FoO+zm5D/E30fAM3YEmm4bMwDP+4ULDs0nzpNgADHWNdFd3vyx5sfOPwaCOHpgHxaBtaJUWTeqkdMazvHdkP7MgP8At/5YndDFKEsvZS0O8niyQgqMj0V3A4FaqWwH8wyDCEQDa/lvZMp6GcXuxFK6+D9VnSxI+5HnDRVMWhIgDjJthctT5O081/uqwFfW9iLfAlZKbhwS1FK6t1sKWm/8ZMVS50WzMLV9FhnX3cRXTSQc/wAs5M1GI+FoLp52NRc7Otp3uiqhKu7epyFsSD62ZRJQtgmxjX//AIQwQ8Tm8EOicW6DLjrqDuqwetTjVwIRBtX/AKrdsHQ/JvD+dsgpyCEE77g9IQti/QJgQLioG9aS1MjYxj6EAZf0t6PnwfH4HwI/Ig/vQYYHPIw3vfIfnfAIAQXv3I4nQoXwIPg3/wD70DyH8EH/xAAoEQEBAQACAQMDBAMBAQAAAAABABEQITEgQVFhcZGBobHwMMHR4fH/2gAIAQMBAT8QCCCyCz1ACzkyzgRPQMjkEzhnqRnI0x6QyyzhhYuoIjgsssss4zjLOMsssg2yyyyyyyyyyCyyyyyyyyyyyyyyyyyepXosgggsgsssgsvILt8yTdj+LfxKd9WrLGbbasszPCZjtllllkeoAmWWQekD1gOklWWREQQFhASheN7brBI70+8bzdltu3kiXxZfykdNg7dM+ZrPMr4jyL3AMTLLLCAsWLCwsLCAssLCxZYWFiBAdEmvciSyIggjkVrGniH7ldrfW8w3tZe144Orp0WyHhjdgFGtp3M+1tF3B4cZBZZznoOe7uyyy8WvRPGcZERHGc5dJUHwS854gevC6TAYfa62HA48RBxvAtK+hYfUBcsss9OWclllkiLtlkk8kREc7cnWP3sxPCwIJcu3kDV+bD3J3PiHLZ4245CTojzA8xxn+PIL2CfQzyRERws33+E57y+0+7CJA7ke9297PcZbYeEyS8rOpJLS4SI9yzq3y7J344748uz9b6H830P5hfC/rx3Ztll48zros2y75Zm2IiI41YRuF1V7bIDxtevUBGpWPCt37wEbLAxyfNmBMHV01dtyvezL5vGezjIy688si6228I9OnxEXvS7tt9H+v/ccszwRERBBkA17TZ85x+RJ2E7seZthsIqsmOLt2OrNxMkLxT6BDHzxuBB1P5rPpn/2XlxoseUV8G8vV/p/3znDPBEREcNo8PMwAg5N5DL+yDBeIXvdXb1kmdwFmWXjYO2z4R5lFiNrJ/P+pHk37t2xx7PvdXZ0xxGPvAsKn2gA8C8fwIjPhY+JjMPd4xXyf45eN7ngiIiOOqvkC0+Lx5ked8K9ssEkkdjtusOHDdo54k4Fh2LLuH0ky3jbc7hdnv5PM6+pOO794Rz9jP55+gJ6Hh4CIiIiHZnhF5iHcbqw3Z+crswzuWEIkkfFrfJBna7R5gj5TT/f2nXXtAXu7XCD0WCUgHmddi1j3bPch+Qg5w+Z/rmAOWZngiIiLxBUDOoLpIN0YxLknEjq5O+Lz70AWxsgaShhtaPabe9Fh767dsS9IatI6McFQCDGOo/mjnaPjrjRvt1BxnDM2REREWzY744eIwobl3g8C6Fo7eOpIoRutkY773nBXC150Ce/tIeiGdkOtbrYyMeY7h1N0JEgr798bEFe0rP34w357t43hlngiIg4Z7DzCmMH6F3yfhLxGHDJCCGxxar1fBZGMPWeJWeYPR8z7w8Rzo6PEwPugdi/pBY8iYxsGSndmdF9eE2HsebIw51Pr1/f04RA94yHt6GZJtiIiOHhCBuD8RZpaV583S8yWRE2CUGR1auFkcMGfaCuy4CSit8PJeI3lHdorvxkfMvdA/CMvd7+jcH34wfp3/f1h6GZm2IiOXslF3E6XcmFu+Bib82nE60nO7LtBtrQOo5ebAmHibdzwxgYgNsQQZ9y5eXB8Yf9vDltl+n446k+0cbbMzPBEREWWUHLpsLotJHLONaxwx1jzXg2TbobGZcYKPi6KEkPIj5rC2l0+594rXpZfQknjBfr+Y5zJmZu4iIiIgM8AiONi21u42RhkPDd2zy3T8bd69vLTPC6o36+1uqdsYMs63kHGtsDO6Za9LttN33mzfnHLPQzw2xERHC4SKbeMshLS04Mlb6Sk6LUX3u6QfiLQ79fa1j2TfEAZ8/a+UHRPXXCnXg8wHok+ZRF8kf0npPDw2xERESKS6DIs0MS7h7O4Y8Hcbt2zzESvPGTTajrt1LniX24cz7fv8n6wDyP2+Pp/f3n2PDKAW7LZih+XPB9PrJj7YSJ/Q9/1uzwWigdH7XYeCy/b7zAJ16GZZ5EREEHHaCCzYA67kxzgPvweCIltImC2cZnm6jH2jCsvr4fol4Kr5P+f+waG/Lw5+9kg0/L93/lgT2RNXTf2yDs9vBMvfjcmV+ft/vcj6HIwD2P4t96ehmZsiIiIiLIur2F26Qh7iEXVkEcYpd923OQZr4gH1/Gfp5hDOn++Z+BJlo8WVfkOv7/AH5u86H57nc9vfx4gMAXPPz8SrD6PvLvo8WpOx8kT8TOcsy8ERERDERDeRPTB0hNlOIiXC376BS0njq7Q/t/f78zA9vfPE4OdrT7rz5h3bk0dPB/fMGj4mx2uxc3rPf/ALPWMAevjOn9pFXneMmP3r3nOgff2/IW222y8kRHBEcEEcyTq9yU5RDbbdINu/adbGGwoPixe5ZzAuzxYHmPgtOn1MbA/Y+D63nXiBe6fb9fwfSNy06/jhgrDlwN6LXuV/v/ANY4CeP3f74vip+/1nhmeCIiIICCILqNA9jeCShE3bYbDo41Fnedfu/6tteAVwhVCY75t6vtZdFrRzx4Iu0dXzYTJHV69/pIX4Qbx+8LyEQfx/8ALR2ZEZHTAvMWAefeZn0CIiItjYWG3y+JTv3tsJdkdRxhwe5u6YU+HDPCM/WOc/azjAvxLBV6jtt4i6BmRoPb9Png6f1P5tYSb5tsLc7S8h4QX2fMzPJERERYSBrI/wAk8M92WFluvDLMJcvNglb5jAkqyL6QeHAOn0acbP2vZLG5Du+QF7D4k94YX5g65AZa0zrYaW+efH4meSIiIjqLp2kXaxMndMnsWDHzDSTILBqwBEfuf8u29pfEmWiAYcbLxHfVnmzrjOGM/WCTBh3/ABYw/u2A/R+N/wDJHTwP7/q+0o9GwD2jRl1dX15nkiIiGeU8WHi89y93buAV/XktLGe9N2RjtjKPF7uvx/2f38Jg1u/iy9+brjb2yeE8crNZ5nrzZXGFJfd927X6P3smOD+8jf7eWcweXz9D/s/a0+D1y8Gym+B7XQSwftM8kRIJbwuWaye0LNMlXvor3vmZ6dXSIS/AhOHfzb8pt3tl8W4me3DW229kNBCB7z3/ANff5lB3wG+IwyFvJh8J/wDlCw0u0qYeXzY1l2XzFvo6F5O7OrN336mZbYifhZZOF5kyZAsfJAmu0kY31O8qy+LsYSy33tIUtJbYYdbe3bstxe5Q3uS8KtfF4GXyWq6wbAjV5m0o9GXT7EPWWmJY/wAiZsiWG26C31X82H2w75lnmZdur60KYMUebXza+bW182rW+a1Pdr5tfMvhlhurIUtcB1CHiY9r4Xnld4Gr9fmP7rf11v7639dbH/6yYHtX8bAzbDHt8kzxvXAQX8vHh+8uFt9jgFYRG8D1+U+eRx222evq6ON4J4fb7/8AId9BPB8d/wAsdPfvDEnIwEJ4Iggjn6+PD97XiBWEB+st4nHinHhhYWT59C6lw30k+nJss4bHwPwWJqPwXSMfHX78JX3H9j++IcHi2Rbtrs8kO37WhPieCCCL+T0isZePA4HOLfNCpPnhOCn7cB7+jbbfSXQijt9D9/8Az+/fbP8AWyd+W22B+S0Mw1ngiOP5OQXxzkx48PX4T54PHB1LXhMM5z1i3JMvM/W7M/rdDCXDWKt/p9uGSZFBcFgx5EXtfycArhEPrbdPHAo6Qjbw48XqePC8uRrPlzpDwnt6Db5MzYu9BDXy8Dl+t/v1/wC8vCow2DL3mbOBHH8nH744EcZFjxun1x5HpeS8OTx6BtntCfF3wCwGbEJJkM5P3+q/x16WZngiIyaz7cCXJceWeeBZ5noQ2Qd4eWVajjUo5zneshTxa8bD8yue0E4Aj4B+f/L45+f/ACGA3Vpw5LLOTlsQwww5DPX0FtIsex5eN30PofH+QfaUUxgTSGG3heNlll4IiCzTGCSFmTJGLG7ZZM2ehLOUk9W+rfZs2AARBFklkkknGxERFnvJwSyyyyySSyyySyyzjJbHN9L6mNHoD0MzNkRERPiZn1PGWWSWWWWWQdw9x9azSx1/izXLEPQNttLclll4W2IgiJ8XhMnOcZZJZZZZZZZZJ1Gab4srKL0eo5LvfiEIRHLt3dzdzZwMiIvbi8ZZZZZZZZZZZZZZZDqYQT0el5L2va8xAQICMhLS642U4c5IYYY5PGWcZZZxlllklllnElv4tcCizjOPF5ur9oIIi22G2WWW2W22IiIfQzjLLOMsssssssssi+EQNljgnThydXXD93liIjnbbbbZbbeCIiOMbNnGWWWWWWWWSWWWWSRzxH14Hgz3YOc4w7i+iQRkZwPPV1OXXDM2xDERx5c56Msss4zjJLPRSy3GOuHfkN44i2222222222W2X0COD/AeX0vDx5T5i8ryvCY9I9v8Dw+n//EACQRAQACAwACAwEBAQEBAQAAAAEAERAhMSBBMEBRYXGBUKGx/9oACAECAQE/EPK5cuXLzfhcvFy5eLly5cuXLly5cuXi5cuXi5cvwuXLm/8A0w+Q3yXiJBuCyU4Si6uIOkQ+vK8XLxcvxvFy83LxcuENfEk0sGwY/iPBBcQMVUY2lDUAqUSlgmUliq1i/K5fhflcvFy4Yv4gCXgPEHFalepyJe5dlnMdwiGAoUhd+sHzU0dlUUQdBD4ivXsu4EFIvuBf7jXuGUlRKjuLwwfTHX0a+dTMAojEIrZZAyNbir/EKKnqGWeoC7ifRB9AF+P/ANwNC5RloQU9T/EGErU2WXUGHJe4MGLW2ITUHuCye08aXk/lP5T+HmfQUvxLln+T29RNDcUv/GWRJHolVEiqCyYEu2DB3NqTWscUUm2zJ1cB4FFimHl6/OtQQ0wQPaCI8xbuppLYylwOwUxU3B6hBi3O0vZcmt5LQwB54Gm4eXr846f+QtSi7ilxrmiLinYp6jsShud1GhWLncs6JY3w9laqUzUA6Eup5KlRq4o3FYOOjG5ctgoGFbXzjUSplh2dg4/RCcZZhESo6m7FbgmsdwcbSi6gPRuDcrFTsTe2F8IW1OjwFBl2r86LogxFLWpolM9VCCqhFKsdQTB9wFci3QyVsaIeCBW4kNThuK2I0DGvJZ7OCD6Z0eA2uFSfoJHUVcScj/M3gXAYVCia7Nmyoqu5s1BHYgqkmlRCVDbGi6grRgKuKkaTqK3USodkq50eArF6D6ASoo2RDGsCGHBKCp/YUCiTTSU6rFAWyrb2GoE2sX1H8m0tcRQdWhrRwryC9QKKwr+gNERy4B9xEWRwS4xYNRWyitx/U22R02zVNEG7OQn8JZxGKRFhxgU1G1uWvUH2z+IZSi5sxWtxbb+clCwXWazkd4uXHBBaBAgtygWwWwILRkHSvs0tlLL4dBKY11CHID6je5avwGlw6+iI1hdzUY5qJKlKhCmCy4GK3cI7/IFG4mXuFBcbpBVqWI2zTUWkj4GhjkfROx3Ny3G5UMDhFErATmXF3g9RtjcjOBYDPUj7CcHuDiJ3AtDLtfRsw1jmglE1GogjuVgg6g3C3FUcB0IzuEDRPUGFE4nFSsIOmfzlSjCouPzOTrNy43KZThuJKjCEXWC3AXkLbgRrDREJ+YuyG94WoaxeEir4R8NBH8y8P3BuEdRiko4YwhLM0Jst4UKj/ohrbsATH20J/wACNC4W3B9sGVmlUdafgPlaB1cUeFhjkKJshi8pfS4hzcq7SHtu/wDyP87P9ThBg+2fp8G3Iip+oT1sUTUVEgwxwbiQPBiMXMO4PI2sOpVRo0MRSvETUS1P0zAdpUTBjGBKnktUSqXU/wBncL+TX/Y9JYqlEg0eS0WzTfv6Zj1RggxUqU7fJlu2Vmv2KtHYj7hrc3LDcNC8EdQ5HO22WstWc+kLbFyVcY5KiS/bh8lSjDOx8awqD3COOGWjLNRYwrCsadRlX0F4lFZULuLUY4C8LNlTjeFqWTnyusglVNrhbRwo3D0ZxX0FVz2sEFolQ3ldsC5yPoS43RnI/AkdS5ohARda940fgNRUn8iqaD5BsCuQP2DKlkrbg7g3FmzNCK6Ich2Dfj945reVpgbtx3RBUWhqKn4v1Epubno/EWgBAyTQvI7IK2QYqw1uKuoAKMLRNOxb8aX2KHRP9wRgbgrpC7BvaG24Eeg8RqAJtZyfgqVipzBjqOxtGa5g7iDRC+4/mAlRR5XkLcXnb/kUbgDRKHROtHJ7ucR35FTL3Bfnrx7m4MB7NYCwpGXuBcr1F/PLqC5eqgcZaRFhgnolesDby6ibgEJT8BFlH5AVglHZRNENyiUSpRKJROIBKJRBkYrO4FcleTSLS0tLS0Fwt1LEO7+DrHDirbi6jb4HEPI58vXki6jz/IrJVlTnn3h5Pc45G3geS4fA/KYaJUt+z+kVqrwfrB3csuyD8g6jvfn34i/JSUlEojn3hh83pGcwFxbytYPn35CvhOXuT5LhOpVbjh/MkXqIUi23595sZcZSp1jiHmwyyvB1L8GMJu1gw1vxVRt4Ph3jhhBqDeEuHDz4GGXwZcvwf5CdnSxjH8+a5biQlQxRKyspdykQnlcvNy838ToinuIRCO36BDwvUr7XMRY4r6J9M+ReppF+mfTpfiPInUYx/wDF/mF1v41bGMfon1NlfnxqiOH6R9QAb8TLPeHb9U+kYpKysA+PcKiP1T6R2LdQI4YOrcs3h2/WPp+/FaqDZm4qPrn0/fgx2zTwVv1z6Z3JyPYdh4H6P//EACkQAQACAQQCAQQDAQEBAQAAAAEAESExQVFhcYGREKGx8CDB0fHhMED/2gAIAQEAAT8QgSofTH1xKlfWiFSo1AIEolFSiFdzEQ4lEo4ZRwzHDKO5R3AJRAIhxKJR3AOJR3KIhKJRwypRxAOGURruV1K6lHEouUdyiFdyiFXvMXoyhdGFcMw8xCUXvKL3lHDAO5RwzHco7hXco4ZRwyjhmOGIcMo4ZRwyjuUcMo7gHcAreFcMo7lHco4YBwyjiUcMA4Yh3CuGY4ZRwyi9GFVvKJjhgHcQrSIcMArRlHH0J7nuB3K7j5nuV3K7nue5Xc9yu5Xc9wO57nuVjWJ3Pc9z3K7nubayjmGms9z3Pcrue5XcDuV3Pc13mOZXcruV3PcruHmPmV3K7ldys6yu4ncDuV3K7ldyu5XcPMfMruV3K7gdyu5XcruV3Pc9x8ysax8xxvPcPMq95lvAK1h5ldwO4eZ7lY1ldw11nuPmHmbx7nv6DzEj3Pc21m2scoCE2+h9PifE+J8R9QPEz1PifEz1M9TN7TNbQvqZrafEp6mep8T4mepnqZ6mepnqbbTbafEp6leJT1M9TPUzyT4mR2mep8SnqA9R9SnqZ6nxN9pT1M9T4gPUz1D1M9Q9TPUpraUvEz1KepnqfEz1M9QHqI9TN7TPU+I31H1M9TPUze0L6mepnqUm5C+pnXEz1AdMTPUze0ze0z1H1M3tG+pnqZ6hdbQ9TNbRWto3W0V6jaFSpXU9Q8T1PU9T1K6nqepXUrqV1K6nr6K6lRUevo2hiupWNJUBbpAuKV1LKho1WkqKiorOkTqVBaCtyVekVb9a03iiiCbMqKiorqV1KiorMB9CsaSupUJFZisxVRUB1KoioqKxFRUVARWYrP0ARUJFRUVmAioqKgMRUBARWYCKisRUVmKxFYisRUVAYh0jA0it0xK6gdfQh/D2zHLPbMczHMxzMcsxyzHLMcsxyzHLMcsK5YVWrAOWY3THLBta0wLAu3EBncujeAB2xnEpAi158QWhnQ3fxK1GDmt5mQU0ZC5iVVaqgHfTM9sAWlq4hCW91CCCKx3PWZbFZZU4G9HiK5Bq7K9WTUJFCcglYI4pMNkxyzHLMcsxzMcsK5ZjlmOWY5ZjllHLCq1ZitWNcsK5ZRyzF6sxyyjlmOWY5ZjlhXLMcsxyzHLMcsK5Zi9WY5YVywrllDuzHLMcsorVgHLMcsK5ZRywrlmOWFcsxyyjlmOWNcsxyyjlmOWY5YVyzFasxWrMVqxrlhGixb1WY5Zi9WY5ZUqH0D6fEzzM9T2SuyZ5JTyT4mepTyTPJAepTepPZGBCpdBKBaesy9kVKp/qU2dvkwRG3ZtL0qK6tCgyP6OMzjltnHdvjiM6AoPBR+YlWkKE58wqUjUA58RLBgZc39sQELBSJorn/wAlkr3d+PjmPCFRTe7eKgaBNTF3/kRD4KHzKVXqqiwGoHQ0L2N+3xNHgJss4F3312l0Wx3ijUB6lPJC5nqU9RGU8kp6lN6kp5IXySmtojWpAeSU8krsmjqSnklNakprUgPJEeSV2Sk3IDyTJuTPJM8kp5IDepEa1JnkhfJKeSU8kprUlNakzySldSW5JT1AeSZ5JmtSU8kzySm9SU8kp5IDyRHkidkp2SA8kprUjg1IzgSI8kp6ieJTep9QdSupXUNNJ6nqB1PCV1K6h0ldQIrqVFdRLCtFtcTWbcZaL2yy8IGrXg8XvAklH65/qGHoaVpf6xFZULq6u8VCOWETT0G8sMo6wq7/APIHWCtaB3xFwKNdA+IJc1OL1ht9RbiEAFLc/jmIwctPPMUOgS2lHTH3lhQAV3Lw89QUFmBFZZ46lY7qUFTvUZ6gvBpKAVF67xNgcGxKI2OP4/e4WKq3qAQ64zeJVlwMXUavSZmB7mCFovSIUaSg6y9hR0plXtK6lfQBiKxFRUJHhNEVn6Ahl9QYEV9QURS/4AD6BWPoCFQEeH0NEViE0+oKRT6Bwg+kVDQZhW6SoYViE6ldSup7hprPcPM9z3McwQ3l9sxywrli9wrmWcwxyQc1oW6vRMhcykPzWYsBIZIC+t4KZSa/6YBXvorf7+Y2uW2y2XOg6zCEF+cwEdTEBQmdN+tt4JttNUSqMX/kPSvxPRMOAV3blOOB9RjgQwDaWH0Kp2TqFrQvK8eYaZBsu1O7xDGDDdmXxEW0ecsRTOLyU6V94cW1bKzd6VWvqVVEmuNE1gCNhyY1msPXDKhvIMfUtNA1ca3tC9K56h1GXi6qItXTQNGLwBbrHNWwYzpGzBm7ErBrTgpv55l95Jjlh5ZjlmK1mK1Zjlil6sxyzHLLOWY5YVWrMcsxyzHLMcsxyzHLCuWWcsK5YJerLOWY5YVyyzlm+rN9WY5ZjlmOWFVqyzlhVasxWrMVqyjGWY5ZjlljuzHLMcsa5ZjlmOWGFCxb3YhssK5Y1WrMcsQ5ZjlmOX6fH0z1M9TPU32hfUNNvp7JnkmeSPkmAs3oEWsd6RKOq29XEa2ZuYzYD3lMNiKtOK1lF34sT6Ylzxxwoo3i9dF8G9xAhijd3r/2JVgDR0L08yjtxijxEX3aao2jjBnuC/IXlgolDJuRvezN8nFQdSJVPF/aMwtC6OMaRWb1ZeKgPNLgY2q/eYJwdhjwYgrqhqq/BMIGui0ofglAFXQrXx4lqeXYanPiBVYaadaRKq+dV1i1VWXDkKOqm6l60iFhTRWkEHoCuiPq9kG6qq2ltbTN7TPUz1Kb1JTe0LvUlPJC+SA8kzWpM8kzWpC71Jm9SZDUhd6kzyQvmAeSF8kL5IXySnkhfJC+SU8kzepC71Jm9SZrUhYakLrUmeSZ5JnGSZ6ma1IDySnkma1JbepNDKR3AkbvUhfJC+SI3qRFdSU3tKeSN1qRvknqep6gZ0h4ldSupXUDqepXU9SuokPSPWeMJylBrALecNLbEC7v8S/UVtrap1BvRuDtjVTm3+Q2o4Xr83CI5FkUjKdjr+oCjQFhoviVZGZ1puQuU9KbMeuZSCvNWz++4Q1Ny5t/7BucqpTnmLRShL143gCcdIVEBMmbnHzDC1GjjjgdccVLPtWC6eVx6iKhaKwXn1k67i+tgzbS99R1uChRo9G3iVnK2R3gVqs4Ws+ouzQO+svHj1vV1EhNDJV69RbyHimftFy2gqRaHTuWJRl4y3ABrm1sF9QpaM+5WcmSY4lRUJFZgIrEBAYioTj6FQkBFRUBFRUVFQIr6FZiorMBmKghWPoKxFRUVFYhMQoIR+gkVFQ6xUJmKziKzFEHv6FTHcx3Cu5juY7mO5juY7mO5juY7jXcx3Bas8ywrDof7Dpql+NM+oWU69gMv2jmd7h0xQvKGDYiltbYWxHziNaS6tPcKGDJZeeh/MuzJwHyRVQ4DV9xFoWsWHGkZBpEujbzAcNOguviVdu5VnSUlZb4iAqhQaazIo2mIgxpLQreB/TEIA7GhrCly4Ses3zx8wqaixqplMDm275iyLDNfiWXxzL2gFo69Kgg1bq0Lc1fxMX6M8rykCBXaxhvXDfuU9IEF0TX/ZdAsVWdXuWlKDWFm40JDZv7mAFA0uUl03Wu87xhUVDpzssQromzxHFuUotCviOtZlHcxe8oveY7mO4BW8oreNdzF7wruUcsx3MdzHcEizuYveFdwruFdzHcx3MPMQveY7hXcxW8K5YV3Gu5jlmOWUcs9swGrAqi407sxW8a7mN7lHcxyxq95juY7mL3mO5juHmHme57nuGusPMPM9z3PczzDzM1rKV1zNWiBV3Q5lGWnrVx95UEfmRl3d0OtCLXDtgaBwQAtLW48Jm8DzOGBA3eMTbJUs6nl28RNjymj/n5liblQ4l4Mk4y+9piKuYT0aavxiNRtWYGLriGVbWzG8EoENahoCWMtQV5hov5leFCAyjqDIRFhuOKie1KOgp+XvBiBwIcGGyX3jH+w8izmwcn+R+hwaQL3gjwKF671cUVQC3FGnEubFEGzMVgNN8QlN5WXCyyC1WaYLl4Vbpbuxg3ibeyLzGcSaKeY7hsImuII1+yYgL7IgIH+perdeyQU4Kck9kzwma1JtGai2tEzGYzFsX0mbgjMF6xmMxXSN1qTMZuBYzBcZguozwmeEzwmbj3PSLRoiumEzzM8x8zPMzyTNaxHWyN8xu9Z7ILwl9xvn6HiepXUDOkPE9Q8QviepXU9SupTekxCm9EeKQb2bbGpQsNXGlyzCUbC4ppzzrHVJVK5gEunLLoK1zmE2XV1MYhTKx/z8wgKUr2aOP61mMg2hDdW/0wAzIEz8VG7WaVpa7o9f4wBP4Zahuqu3V8YliJdpm3e+tsa3HaZUut+2Uxu8WpkP8AY6pXDQ3TXP77gNYRknyIQLY63mKF6aRd4wS/TqBTahtQMWOUrBcETWi3OsA2WmkMu2tdVCK90MmkYz3Kg5Y7A660pDQe4lLswDrXiDm5oechLqZq1YXfMHCJZt1GA2blliVY7N03ga6lZwlf5AgNhebuAJRaVR1/cwgUUaq4CXROhMjIjfEqAYrEU1APCU8IDwlN6JTwlPBKeCA8EzwlNaJnhKXZM8JTwlNaJTUI8IDwlPCU8IDwgPCU8JmK6SmAeEVbI27SnhK6gPCVCPCU1oSmtEzUIxm9CJnSVnSFw+PqVCpiFQqYmO4VW8x3MdzHcwcwBlrC8s5DVODuEzryxFVisGudMR013G43+I6MHDmCwFBHBqKAmcIXRUUbj5iurgooFwP9zCFUyFnu7o9krZxmqhaDQ0P2dyJWLQMZoKz6h1Pnh+IUR2NviK8r5bec7+7moJ1vaagXTBreum0S17YrMBqxN4ZxvHCppashoyKlbFRit5QWXdFiRLdw/WIuojaOopzo3nWrlqYUJlsGre8rG8N8ItHGkDaZzXERoMW6J0+LiI0c0OL2foNOIZVtSlUY/uMdDStI7RqqzrL4hEBRRFaS8ulkcvasYi8hQdDGktyWiIFzmY7mO4Ve8K7mO5jue0a7mO57RruFdyjue0y5ntMdzHcK7mO4VW8xtco7mL3jV7wruUdzBzMPMK7lHc9pYxcx3MdzFbxDuY7gdpjuY7jVbxqt413Gu5juY7mO5juE9w8z3M8w8ksbkzyTPJM8k21JnklvJLRMkT71GlAL8PvC2NToTuDY7dcS8l9O8HZC11JhUFmHdLXrCHhGEHVMXjV+3mIJgWWB7sX4Jdbbhq9vj8wkRxK+28W3SahiJcSmLuLBZ7qYFRDswgGOKxvFrVQAGVuNUWAla2qviO7Q4ZyrLkyZky4/KGgFKII5U1HW/UwbilhhzHC38IHgFwGgrjcZvMtA5DuZA67JGAt1riIbjKuptzV1LWxEopR/cThe6vJXmK3JZ95YWyotwFN4g2aBtmXKzhHd+6xK1lcKA7uhCaLNAbO3nEVKMF4ZjNEYzZu7xQVS+YXoSZ5JkdSW8kL5Ja7ktrRM8I2OiZ4TPCU8JTwmeEp4TPCW8JnhM8kF4QvkjfJM8JTepMjqTPJM8kzyTPJMhoiLVJnhM8IXwmeEV4TN6kzyTPJM8kt5I3yRXDZLeEV5JnklPJPZDxDxDxDO09Q8TbSEV1PX8BUSAjdWibITTZex6Od2ZIKw5cs3KhUCy6RFcWtS8MZLfNHVWjxoeAh0bDaFf5GWohela6/v3jFXskzK4GduXL/VBBzYI2EPJcDmTPX7r0hfH7aYypDVF7PfEuvm4NYzwLH3G5G6iNFPF2+OYypnpMZxr13/AFGCpNNuKNfP+ytZSZArwHNG73LC9dc74braODi0AbsNMb+6h6UsoNB/7x6g6ANgKPiKjgubOpmcNNC+dQqj8xaXrbYs8GDwQAxDxF38xyo4C7dMaxxDV+dCM6SWzUN6178bwNmGaN+9z8RtuA6UzFKtANXllEypYZF26/WPIaLFw7LtdobBolGlTYNU2gIrH0Kx9AGUSATd0vghxBb/AOFBJYmZ/c/zFtP0+4Te8P8A3DaM1tHyXElFCanE1KGSJvgmvyIJ/gztfE/5TD/ymC/5M/4zEjX8MX/kx/8AGZn/AKmH/qJj/sSolU2PoVG0ViKhMQkVFY/gCE9zXdntl9sK5YJzLOZjllnLCgNKwe1/Gsx4xrG9eHnXxMyA24xcA5ZZpbHMZRQWOpctiBbeBdDqV+ILCrpXU08y3+1aME5v16gbjDGy1gztt9pRuWY6F9yx27VMFqB2Mq80ROAMXbuxVZbVW1KHC1p4RZcNDKRnGHRqz08yuuN0t5PnWIk38aPEOszZUqo1JXSkpgNQyoY85r/kW5lUo2ALw21ziVyS14w+Bz1BamBghCJDbQfcxoa+W1Mt3ps1tZKJSZNuXuoUMEGy6moqagSmBWtY+IUgMOZtho1igxzUtJZZBlnZvJX/ACB5gBa8YvXite5UpBTgf3MYRXBOIaXVxalJo0VyM71pLKCUF4A+WG+yAuMWrqKoJ2WHD94QogoiQWtpC1xFWVkMsvLMgfiWcsE5Ypywndg/IWZToBuxRwyVOgtXo+YSCNj8ky+4HVz5gOJXiV4leIniU6ieMRcKdqrwM/NzNkpJg6Gp09hCd2Y0ujEV+z0nIPiH/kEDw+JTg+JTg+JRwfEro+JRwfEHR8SnB8Rgbb4fxBXmEGspyxq9WYvVgnLCuWKcsUrVllasa5ZjllOWNcsIX1M9QfEPJM9Qu9pnaoX1M9TPUz1HGCC8Qz6s9zJa0719yq4mepaWqAavEYsQFkGl9flqEEF6YJXbqO2iIjAGi/CoHBuuxrAxsRRdiwpAhQMfeJlsZGTVqtL1z1C/12Jd3+vmXVq3vcSasYsmAhYwLsb9IsG9j+PUu9q5hChKqyj7YlDNVqhshpTes1xBIjdiZU8S6GzWZYQChdlVwHDL/pIUDVAQq0Caa5gBZDrnDx/ULldhfFd/64IEe0Wjdw+++YAGE2C1S/VQo6GVVWNbvWXUgZWLLS26WsYuUodTFKCm6Zpvi83BASalSsvT17jSUQUUjWM23uy3dggt2p+fiGlAKWNF+4ySgxFbpubFmdPEvQsqWAojxkfgmRdlF8wcxA1BfyOeoNN025isAHneAXRQibI8zfAqzhgDY7gpZszpB2GSpnkgXciXtDw26w63zWw6HmVfQCEqV9GJEiXx73hcL4NA+zmzp6mIxowV+7hBA/mxjN/h/EvnTeX5JfqN3dkL6hfJLeSW9TPUb5Jnkma1JbyRvknqHiHiB1K6h4h4lweJ6ldTHE8JtpNNoLaFAUk28s0bJiaVgU9UwDQhpuvvmXC8HR0s0x1FbUKsX3jB750jVyuVHnXEyi8FUtzghFqtrjQMsVlqwGcYDu34IAaTS1OnA/uIZadAYmw0vDLhQ88zAxuvDyf+TZdAptyXnHvzDQCchvFjrAsilgr1+SHvQGyDRre/zLNgEobKc7n75ltY4rVD/wB+ZUrAFlUWbvcxxXZ8H/YGaZ5AMXXXfcwf5rgm7spwaN1YxwSQY3nwM+y1YWGPQ1AWAKAxllgUsCcZtcd7Y8xkze8UVWtBi9YBRbOdiHmmNqu4RNbaVUGX/IjnbgLobO+HDvXMQdLEtgxCNgZHaNuEJY1SlDazXqVCI5qAw0BpuyIVpKIIogFQ2JgfK1/cAwAjgV/X0BAlS5UqMYkSOYu48U0/ZYcbFMV/q4fzMuMYzdjZ/EoL2ZojVpKQVFRUVDDUaRt9CuoeYeZ7nue57h5nue4efofP1Lhmg0Fh/wBVwkC1uwHG3aKK221jzcVLXcpKWVZoQ7XQItOto+KI47pbWbf/AGI6XMC8o2NCXMj+/pL6yEU0L3aapW8WKIuhZbfGMypyKTVleHeLUtlTSnKbEozD1sq+4SBkiVM1yfrDG9BbJDeojYheyKC87Y388RsWrZbC7DbhL3lmfvDR58V9oZgEAdTZIosyW1bdWHclMyXKmUL6glEErJSgX087QsPpFiTLJlz964mnELmpynRted2OcSj09bL1NNmLuZJDeQRBddc4xKd+oaabVe5/2XUjwICoNO4P2ZnfEcKa3p5uoAMHqAj6tvhmMVW0oLqENcQAlF25/rSNc0Ga40jobz48YncPzGUIihMyoDFwVZfwldjUqHre8NmDVtUqnmiXBUGjfqhyZhiSuirPkh+wJY8kSF3GDPWKtzoqIx2YqwN1X3P+DgBYicjZF+jEnYP5UUver+kwfzLhN38TP+Mz/gM/4DP+Ez/hMf8AwGBNRPJ9GMdW3s/iLL2YvoFuMxTz9RuGH6Hue/oeJ6nqep6nqep6nr6CPX0OwRFoW7Kd5K7peXtXMcgA7IwGtfTFS9hU95/EoqkF4yq4r70ZV6j1j5CrZ429xZ6dFuvb3NZQSLTxGKyqFrVk6zvBgSdaTxTWKsgPWaP9TnPEuEYACgiqvpZkmZVdUa/AR00TVSiXQjA1Ob8RGdHIMG4Ggja0RhVL/caClZhKxJM61Mv/AD/YxMXxAUbOQdsRkMo1zRq7BjH4iml6mYVXdkMDJqLqqbNnSF4vA1sPzRGt1Ip2hvW7r14lCFqIBuXvu4or5am9CKULVOdauuL2xEyoQq2vGc9axWXminNMg8MGm8yEHajbRee8zh6DzGWYZorT/sEJmAUWOtkucVNiFXXcsE1xcaJcCPESglLQAUNuoihC8HUenUVY0K7q8Q2CDA1x/wCVKYWIrRfuePiNB2VXc44loLDT8EsXtLpf6gLXIvFIrlsmIzbqM6bcyoo7uuGhIgG06o60O5Xu4/gQloLrLVOdcEvLCDauxZrVorWWiqvbL5JCOV0H0JokqHx7G56Rh9DMf0c5Sek0x/tzLOf3u4E/vfM/fv7n79/c/Zv7jf3vvP19+YBO/c4O54X3C/orBZ17xSvuSWqnKXjXojrAajP0K6jDh+htDCdQhUxMTEK5hXLMcsxyzHLCr1Zi9WY5ZjliskAaoGl1eYgUKttreHV97aDLHDGYrAwmW8mAAU4Kikl40nh286+IQIa3N4YAp0ziDjkHaGhg9EQUdJxDz1DzoBLBVKgQBoKQjrY3x2L0vPOhMdCgLR0ENPEKwM1WT8zKAqC8zunEccfbPrxG0Dg7K5vaM4aHuU4a0LIqGaKqrN88f7KLqZVjuQ5/G0VRgHJp79Q44C3KyaoLq0ftRhFgqB4xpddlcaQYN+BstOPEE9WpY4Ft1oBq7czWTSIUC0uzV1ykzIMsHaNLV2q3LqlRm3ZZLRyA1RiZJoIsVt2Y/GtTAbLrSmG4b07R2YdbdQDiPDDnuHUKsZImg3pjCrlyU5PNB7jZmVzFnTO8Gk0VKBvTN3UAFzTQbMZOYcRwC1OgG8XN2CAXovLaPdEENE4L2v3LmWzlrbmA9GRyBaPNVfMv3OsFnxUx5pWNhwvMsdpio5eHiNFErAVtLgKDbd8xMEoRaBuHN7wyVA0QBQeP/YGjcMqry8R3Qu13TUvF39oXs2CegqDWut7WQfRn7nnKUy6SvLKXqwS9WWcsK5ZjljOWFrapQcrpNBP34Z+9whGHQB7rjt+7DOWVvVleWYvVlhuyytWY5ZjljXLGr1YVyzHcxyxrlhD6l3qTPJDyQ9QvknsmepXZKeSZ5IjyQU1K7gqxNbsvHXb6uMCrqNr2xKUHVRAFxwXU0RHSbhLtW1MlwtWF4cTJXDMN6CWpc66xMBrpLd8Y+0PHf1zPio7YA4FfzcyBKzmKpxW/EWoLL4uX1ohvT79TUyVmAN7dtIWEiFLtFrbev1luVJaXeYmqAF5cX+vqEg6j2SByDUb1F4h3GogEOPDbQOdJcY0ZjLnOdsXGmtiNQrFmi4H1nFQVCYaROE870D5jbs+uaDpXVXW+sW0PSgat3XLGf6hCUzn2AvCuMx4oF2OiVWxo3vMkZ/Mw2iFU2vAOrjaEuRwYlQRs0F1izYjJcroDRqYib6TIVbtKh+CrFs3parj5giAZmhFUWrTXfeFxVGpsJT7qZYQ7LGnrmgMPmNVAtGECdo6Cb+YwYaCUN1dA+YsriGLf1UBakwLVfcXG1mxcYAVBTovN+Y9zxatPV7TDkArgJMKRotzwqZDwpJR4D+sdBXAp6U+IIWL+0U2GqLdSZaxBg+yCMZ+15y1cmktyS/JKeSVW5M8kzyRncleijun+wSzl1cv1dJUheT9DUI3OSaNSN5JnklLuSnkmeSF8kR5IjyTPJM8kb5I+oeIeJ6ldSupXUDqepQbQOpXUrqV1KxpGK9glvC7D1hXxHMxsLJjDWlShMeBbGhv1aLut9yUveFVAENOASwpK7b+o3fGBiGirOM7SlB6axE1uLa9XkXPNnN7PmOosZFcV/j/scVFYol2cf+wjUG2zzfuATVr5lyxbnECAW4rPxLtZdCv+Sg4uUVTf+7/aXrNTdYI66EcKykK5pprsjBOYPUPGgvBerkxBkQGqsVaj3ev+RYYqClKKKvR2d0xaSS6lrVd5b0v4uBLBACy+/Q01eldzQRG70wWg5xWa1jEUQ0BtphNK3zA0BDcMrqF73vBCqWUM3t9v7hCOi7NSsArdAsZXZefEAZOM4W2d4JMJYwDKvUOU7U/mUoVTpkWW2hZszvF0K7szrtKVhidEtF8q6C14loQyI867cB7VlCFwae7bwFtxAYumpTs8GvMyf9vXWhy6xGhqAUejaAm0tIb8HLKmWjZIS50AN7limlxg3XPER1EGQlnQZ++Yg3WJUuqhTdh/vmK7GjJ0beoU2mQkqrSkLdtNYhEsrO1Mma+SAKNkRxyealqAQgcI7xbf/XDh0mp+gD6FQLfohtRtbyvwB8wPqgK6GV4N44N+FLj7VF1F1MoojEMOkOmkYqKzFdRj1DzDTWYrWe5fc9z3MVrMcyzmWO8vuD3LK1jVaxn9jNhT8XL8lndxKVCXmrgtq+RjBevygM1TVFGw7rvSJNYDYwhwUBX4Oo7DgTN5uVovSqrDM/bURqC8kqOnhTXHVy2VTbq7w5cXZtd5mQBavJVMV3gwciyxlbbM1lf/AL1io4BojnO4ezmuk3tsYALQC2veU7qX2DAnyVqQEKKFJT1cQNBFMnl8lVjuWJAsuyjilwe/6qWpPdphQGDxdShMx1BsXLytFG1sSIG4OjhoVmqJW5THBqaYdTmKVg3r8+P2oqx8zUX2LM9/aYi4I1Z/eIqhkun3hUlA2MXQrEW01y3d9oAWh4u9Vw3vKYAFChdOu8QipacuepYL0GLfxDN1tMTIbo1+1ARONUpw/PlzWhvHPeSO8y5a3VYL1NloHlXQjQEZaU6gbhfmuIkapVd11ZYAa7rGCpSpi+B2/wCxymWRwICt7bxIkUx9uH7R6ZN8aviBRR0BHOmJgy6lcxydqCZzhIIIHuL6dYDnu0o/2J1A9QcuryPiHBqtwFXt4MQc0Ap6p1b2w7RNQAHvpHclYn7XnMTwiM5St6pZeqY5RTlK8sBdReBT2u1fYPmH1r/JH9WixGhCOULllkKcsxymOUXMbaxrmNXqzF6sxerFIa5h6h6hptM9QvqZ6ma2hfUteI31C+pnqZ6meo2bEoFrGvUUN3VKEDEOidR8Bp0WnqLZD6JBap8bwoKVSW3jAsXunWoIGyxYtIwC6LWmTxFOEox07v8AP23h0zUFVgtU4P8AyJg4LQ3CgpbUmohTaqy8j+ohHpGNvfc1M1YlZhG8MVHsKjW39RsQ4xoLBl4u8yxDEbTo53gLORsdW2Na2xmOKUq0uhutr3MVhYcQLyepM3mkrox9n1AGc/G2u8zuV0dadMbVnnMP1GZdPWb6thWXUyVi3c5PMYCt3So3277llTMg5EFtpYC63xvB6TuS/nBMr88j84+8F30oR6DjxFF0wsCi0b2f6l1DRq+7yeJUsgXpp1EtXsUQ21jOMwunMphOXf6T3UvekVm4pQEL2sv4NWKZUJQL3Ly9+jGq6sWJu28U1r/UxX1LwG69SvYAi1RVudMHEYQxtFKEBeg3V2AllLbAiGgH61lQitktP3iO8OqmNdFe4IRWLiy6zmYVxQwPwUZz/UEwyj9m5rnsvjxkePzCtlTSCym7UVreYmT8a97H7vxNuJRH/E5lGjLFIarv2a+dikzew6TZOI8h+7jaNNIG9CX6mb2meoX1C8EN0fKSr+4ONeCRR+P4O5LE9H9jCbdInqN6mdKI3wTPBM8Ep4JnqN9RG9pm9pm9o3e0Vvaep6h4nqGujDxCuGFcTHEo4YVwzHDCuGFcMJWjKRrbXlNn9kM3d2DrUdXTBr94hXIeFKbHlqWE04yM+oJez2/yOAcaVY+0TSbNY9PEaJpc5gtUGbqKRtvVwAuV0O5442hocgLZerY/dI6hAHbeODInTiAE2Wrtm6ONX3EF2IyHxffcMTKYPwwfmWBALEuRrn3cEuuNUeRdnrrFykxOAiXzTk8QMjVhYXQEoYxFAD67kZbHHG8vWsApgEccUOuuvEtTwZnC963f0mcha6H7IL0UpxVy16NEFH2coyxfJLsQqRKSGULEa7q6dTi4oEVLJouq7XXrSIeJqqqNfsRcuxuwAmAXYzMgPNMttHnlMRsxZNw7LCOEaOvYui+IquaEpc9vbasMGUC50vmZAwGAOJbaQByy0hKxEYoNK0xrow2NHRmXG69GkEX2+gz7LlDUyKoOSkxVbayg5msUAa/4WbwIqwDYpKbGoLCgOYqWuGP9uMYSa4usqvT3FB7NAJ+YzSy22eQ38R3J+QhRNRw7CqKmN7xTAdzI5CpYEpdy5OTnu19i+I9X9nKYwyl6MpwzHDCr0YAujAcMBlVt6WY+4fECj6rjEAqRek/sYF6MY3hlOGFXozHDMcMxwzHDGuGNcMa4Y1ejMXozF6MQ4h5h5h5h5h5+gi/oH1G0XiL2hzXwADR2PhziUdv7ZLM06PTKa22Sg0MYj2Wi0gbRSEJgHHmY6kYb2hFC540lG5l2muEIFqba/EQWlzwYKj323a6rxrUJWgXBkqWAhVuH7RW6Zq4dmCmjordADWgprbuOCtM3Aak1fFABLYoab98TFhk4Q3XiM4IXVvPqDDUMVXkfeXl1Vg35K1lNmDRBT8jGNhqa/wDkUpoW3fclssSzQNZRSxAbXNNaJpejDDClgJjW56A32EChRux5OZtOkDlPObRLWoMZmSlD26S1iyaRy0ARRmsGq6DOpkFS1BZhJrLWISalbKgYLc+V7YrfFqcIYPQ3Ru3xGpM5XWr9KXNOEcn9v2IV3bzCVyUm+sZvR4od2Ex6NZVGh5mZGbNXqEATzaUL2fjqLsrWhodP8hiocgFU5v5myYxCUbedDEHFdtgYJV6uKgvH+QBfGtourerlaeVADSr2CDxbLmq7dQS6+o02q+/T+481DzD+hePos41FLvpt+4+P4JPXiIX/AFLaavMtv5j1hwufpLD9C4vELiFhh+oz1PiHgmeCZ4JngmeCV0TPBC+CF8EzWhAa0Jl2ILRbl23F8EAeCQWoAttWlkQa1iYVOAMeplXB7Q4yjSDdjVrLGrrxK4/AP7iOOQO15hAza5viZIyPqIaRwd3tFTRVm1cY36/Ea9aOunRlTGl5XWNYvyDtFTNlzJW7qKy2Sm5aj3KZHc/9i4SgtQKNRbK0yeLjBsL21RYnGtDrW2axUUJHCV7X+6lQsyt0zbbre/8A4zTULi9XKH7pBbwQrV27ERVpg7XPvaOxiOjE4l5o21ls11hxCGjUveYhewcTjOBU+ajnKyjhoR9kOCFEByAlflmaCqhSutXtl/qJdRSEdrWK/MpTQfu8HNzdRTYTeXYthVTapsjBL2HAtahslR42f6kuAxsGrQz98XFdUGwaBxLEU8zSmFMjuezsLGtt7ra9wgDbNGdNYk6lvqv38Q8NTCu0AGVrwZreUZaK3cPcYBqlAErRa3J0TaFdHsNsGfZq7kbR9ksvs/WJRC1Hyov7y8eKoInSOjKMjcaX3Ku1LcrYLBQvFsKoBDYCg+0AIwR2WG5uz9lEugluCX4JmtIb4IXghTKGIlYAD3vyHr+FlqO+L/AfeWvQl+CWdiZ4I3wRvgjfBM8EzwSmsBM1oRvgmeCZ4JTwRvg+h4gQq9GY4ZjhgF6MxwzHDMcMA4ZjhmOGNVozWSNNWoZflr4lLqjOPb92gEHwytVX/scBcZXONj8/MoQHQp4uOFSZrU5IZKA3s+cR7KuhhONaPvMgWNRhRYB2N1vcsRLV3nTqOtQ0AB2rF33Cxwi0ES9vHfEWFAGo0uasq93GloHUFWoeK1ZvKtEwRAqZIi666fjMyllBV69GsZPhbhv0ajqg933kf8ZUKjAFUPod9I1l3IKufFadwKDVA3Gu9zzNIq6OHxzyx3BWR15qGd0Pbh0hVrDVkYbmYuTRwYhVt6L1T+uPctS1i6OzRugA/uXYWLLCt5c3XwxRuCjazlY2Ddc/ZLW4u95o51lkEAdR/mdAsN9KqwXYOM1AG1ZB0Wx/PqE8USgtr/1jqkroWLFkupLV77iqlo8n+RShQDh37IZQBqoC4EO1xag4VbLPv1LDkXi3+45uLRqK+IopDemxKNMJQhtL016zR8613g7heQuhaZwhflcXCCxWNtL07dOwzCunSabk0c4R1jQ9ab7aFwDCrFsc6QQK6FK+LZtFjHWDDxYPX5RluGM4ZV2Zi9GYvRhOGFck65a/sGYVQodDj+ArmnA5cfb7oi3DGcMZwyzhjTsyjhlHDCq0ZRWjMcMarRjXDMcMxwzHDEOJ7h5h5h5nub6w8z3DTWe/o9zaGAuQBi7qbTeVqgrG4pZGt4INMaBKFCtE0veAOourMnKHFwwW/Jv4gBRnohTZx3V+YYs9KZS9Z0UL1rmKFsM4KujgNv3SXAIDnW3mEgXhZYfaFWIyUKW7RoYpe47AYv3dcy+1WcFlU7QZORqbmraDfWAISyVt70WtNueY2QKSjHdOeK6IKlSqSh5X8MoIuJk48g/tx1sSjEsaAZFmJc1LKrZtNMxwmgMt8VsRMBAas3B1rDiMpRqm1fGsyBal1PBuzUioDNGiv97tsES8t5a+Gx87w3RvVeI6bBVs7RqsG0UiQHanQDdZkzgmlKaVsWXoXBpl0yzqG/Bx5iRNLzuFm16xDUKhdDQlhpGTuYi0S4hIpQCHcmcmrgQQnIUHF3FYkbBLeHMPqGuhfTY+0YmOsF8CEy4Lm003/wB+Zgq6UbLP35l6DWVuL/2Ca2a5eOoe2lDqlaHXUXc6gdeZWK6+ljAvX9wBbJSsK0z60iXV9zF0NExMdhA7lcnK2fTmakqga0u7+j0MXiw7ddfrgwQGYGY1TJPhn2IPqFgNXEyEpfEPxFbFI14it4qH6BVQ6QuPoJ9D3NIXuB1AgSupngldEromeCBjSA8EpvQiPBM8Eb4IitoNdxf/ACX3u3T5mkPg1CZrS9suXeNmHNL95beO1HNXuYiEYz4eZeg6VRW+tYW0L70BrSoDTo6RAgFsBwd/B1EGzaFIZ4zKBBR2bcdn/JkIgquDfxtGCGjI42x2w8lbeI5aCOhw83KpundsTWxRlDyeoISoIIfulBHVLSk55dfHmB1lFjzjPlrfUt0TMbZC9a4HcbxKBGUrCr1Q473qImL1LU0lRW0gLgmG9jX9yruANlDfxkhQpApRllrxcSr+Flk8jzC48t0svdxu62kLthkMFgrHBsfuDESYiclbv4irKtus1117lCCT2qJY9UKVUrusjhjTmLVGq05lyBeUoG31n4jpr3jEwD4DMREoLvtwS4qGxFo6CyLLnMJbdAsqos5qiNNxtIIpKYDT1K4bRmWNXbqanPIBWtxiVpadzEWKPmXTRbiOL45G7mGGgAtHFO3cJfQAAKDf9IPC0NBHgIH/AAdxPA0q8X0wY7WMPAQBCF6kWVurzQrtLsH3jZIj+850OiLbgi8EbdiZ4JTwS96EZ2JUgP2McL3/AArT7sMfckbpQvMbehE8EpdiU8EbvQmeCU8EBrQma0IjWhM8EprQlPBM5wRHglPEIVMVvBO4V3CuGY4ZjhmO5jhntLHZmO5S9GJZ1CXZkxpecrcx1iZsrUOCw+Y6AcPzduEverz3NDkDbHz6/EpWaMPhV+aicgtpgSpoBpe7Mm1nTM2ROrz5IxyzraoiWywoH0jbsJaLC+KwX5uE2gNTG+jzA4ppBMfbiom00WfUyZDbk3IoSm27TxBReAuhz4jC4yoGhc6a/txGTu7S+m/b7g+OG1waw36119RWDN1upXW99N4nDgWmMcDoQFLkWVKSbDFWXasxbrq1uJQmjdYAJSzUYnasD7Vy+Lzn+YJejoDXKmi9Lk7l/mlxJbhXZhIOwBbth6X0VuyxcCrFYEbgrgj7KBWwX3q6umxuxpHSQtXqfacoqtdx6y85bwbTVczIMDrCqWietoB5jNR6PJbPBzoZ5FnMNlqhrmo8WkULaPdz1KouVablVQC7DDa/Mexe5b3g7Nl5xMMb6uvkgUa1SbUY9zfnxgdUv5jq6lWirWUz7mp+8QkxU5FCeA5YIpM0ZTbz+F8w9MwV0YhdGeDGuGWcMA7MVEMDlcH3n5lhhn739GMEZQKhx3+WAt1jOGMveHRi8GY7jXcxwzFaMcNGNcMa4ZitGY7mOGY7mnMHuX3DzDXWDF9y+5fcvuXCwMXmChu+RTf9QYQFd8MU0sllL9yhBiYShwYirKxKxcwOUWVcEuFbRpemMzYQ2vF/MZBLFkuUzayZfhKU2u9DqmKBZQxVHyYmpaYaXLaSYGSr76jaGGtXtA0liHKRBcgUW52bTILAM217e6x95bgRtbZF77V2RsA6XmWaX2p+kVS9rBw1xH0Hg4iDuqXNG4luxqxSC8h4ed4Ypg3g+xKWqnoxEK1NXP5SIi7vJvd4fiAPLqxFWsVg6pmC2X0mYyqM6Nrflip2qBltlbYBzFoEuXWrrXRASsBTLtKkAlDmrNqCGiq9S+ZcJo1Dp3hJZw8kGGYTnQ00xL84K7VVaxDFyMDhodR6lq40+JrsEzLAwkCA1vfxUsViyhVnqJkaiiVUw2/mKvpk3TSEkQUPU6ha0V5Yzcz7aP68GkvZvi4u2Lg1gRr5A+jf5qWTOv1Y5jZT2PyTUwiZwivZLjaL6Qc6JcXiLhYXMMMLC5hY9TNaEzxM8EL4hfBPRC+CZ4meCeiZ4JngmHlLEYKgAI8JGsQ/sOxAnIVAAWNDDMPfcE5VzvULt1pUs1dNKq69SirSk+0a4rNDobIiYK3a5PyRxFWxrf8A7AY4HQNRYLc9aStr10W1gdbXfWaUNk1fn/kBUgDesQooFlXpyamf3EwsJyFROvWkcsgVcl/8lBvPmKm4GolsexTERdysxp3+/iE3IGRdfmILAJRW5LBRMFWEZcWeTBHEUgXY3lgYEB3HA4goixHWHMw5IS2Xqvtz7juSrvVLa5oHkeI7BtcoHZXMJykFvNzhRFTQgFgyG9yIcIAWY/ENDR+YANWglQy2vUyDZXF5R4iMW8vL0OnUyUOkO5SRkutaryPRzK9ii85Y2I6yBBRF1VNW9WZCv7NiOOhHXQmeCZ4JTwRHhA3oQPCYgzX/AKcQfVQW6GVwGsB7IHhcfao9cEfRG+EzWiN8Ey7JXRMuxG60JmtCN8Eb4I3wTN6ERdiZ4IjwfQqFdwruY4gHcx3McMxwzHcxejMcMo4Y1wxpcFbWcP8A7D6AC9K9twItAtWAMOl/AglugRVw6d/BHQG7rS4sxfUaxDRmZRKGH0zMKmkFrpj3AhQNukTdNlbGkQoKH4mhYGqxGrvB1D0O+NIIEa7GrfHECto1t6fES2TC9tu/mDRDKHsH3tKlsrQuk/uGtKY20lC2WBhYXaevMrtWW7KA2O2DVfDeivTn2XMuUFYlVobHpaSKgC7oyCvA/mLCGS7iKovzLMF9rvKC1u4lUOYFO4KRW5ibXxUrSVwxs9RHS1A0tq1+0YliG48jkphOGA4Y1wwrsp1LqKkDNFp2fvUWFqOkU1KpipU5INa8TLlhIX35mbYIDs16mzLi9ZWkTGd8P8YAWwqsA5tXxHXv0KCiheeTVwxjespejKOGY4ZjhmOGEvRg3DARsl+tuz7IPpc9+jdv9Lj7RHcp3KO4V3MdzHcs4YVwzHcxwxo2Y1wxrhjXDMcMxejMcM9w8z3DzDzPc9zbX6DzN49/Qxcw0h/D/UBwMstPjR72mEOQswDIvH93ANSxBsHv7Si9K9Ykjq03K5/qIA1THuYs4vpUDdI1bUDqIznIL164jeryCZAcdxKIB1E1/wAlADYaN1XreHhFBdYIhW7cg/LMSwZ5mp5m2g0rQIAubDe4JlroxVgtdVoPM0VQ4v8AamEZVTAdCm5k8RFoMNpUFvGgR6sPzLEGmis18W+pkAg5WWvij5lLBWha9rp8JcNMBjlXNf1DcOWrrEt77rDSNNqq/wBR4AaRQ0w67rDmpmDglwa4b8QWlErPU4QqlOLj3lChlmm8dIWWumr3CowC5ZMxj2w0pbgDY6bLHVKRsYGiVGUQ0sdwYWX2xrQX4iI6ubmYI4xqjTTgkHy69RbzzeZNx60+iu/qLggReOO+1QM6ALgCj7H8GOFE9H9jGaGuHFsWxmG4pg0h+gwxvF3Hv6F7m2kCHieiF8EL4J6meCeiZ4JngmeCU8ER4JVDwq+L/qE5xgKEyUn6wpTIw2bt3/7pArECrNQffvnSHJJBBz77qDm3Gd//AGFDYvfmUaKmQjcidG6yLE8O8pibdXGWuYKlhD5ly3h0rY6illl1pCVgG1ah8xOCwHdRQmVbb8ymzcpTORh6b3qsp3OGN6CAZQy/ukS2t15hZqGg0K+MEblIukdIBpWqpCw+8YWUWy/je5exptSzasDo84PmaCFVVqeM5YMRQLt0a0l6tYK0x8RWO8wFgGCVI4mK5kruGReY4wV/kWzEFaZQHWiZ4JngjfBFVYDN7ITYSRzYtrmBAwaU7i/ggOZDl0hCjTAVxIWaRwyqOaR87RIQaumN4/cCD7yp3UHR/sHFLXUCDeruVq12F/mW3ZprngTeBY1TW115NpncJTwSm9CI7Er6zXt/Yr6mBUPpomBAPQZ+5ieCPOhNWiZ4J6RHhKeEp4TPCU8ERrQiPBG70Jm9CZ4Supk2InRMQhUKmJjuFQruY7lHcx3MXvCu5juIbHILNND+4ttAoDFl6NQAAWhDQ883GupkBsuhz/iDKOV3My9HSvU33zAQllzlvqLqwWaan6SiRjQ1h8QItAuZTda4TMqOfLrCaKXGuL+8Ytyy0GI7wjBRozVytttIBW1msxg3bCH8x8Oyt2DzX9QrbSWU81zppnHiPLVvaor96jdyKAKGp8Eornai0FoMhfSx6ln0jUprOitEAeQFEs1/X4hUse2AsAepfZ0IJAtuG4UTRnSCtu/UJZcA5hWmZjuPlKgt8tjd8ECGkt9NRfQsqrCEG2YeBlX912CzQrlgGbxKiIaMm3Y7P8+Ii2GlOGFScJlJF5CXiVg1WZRsDLe/7iJJqKt6mK56Dfyy6Jqla3TeK1ih1qL7mWhYLdh2XlPuRKKTYD7i/iCDTLkrwHnEfbFhVWGjYvdhDazr99T8QmDLj314yF/1FRVzdrb+YXcRe8aveFQruNdz2jXcaveY7mO413Gu5i95juY7mO5iHmGmszzDzPc9k9wXmF1rLeZnmF3rLeSW8Iis2sTmHdEI23xtiIg1B0v31mDs2oCbYyXsGsCSuxqyTEur+7uUpMl02OLYhku2acMR1bIlAuyLu7imKojKeIJ2g2C+kaRp5uUukNyDgoL/ALAwovcz62ZfnbQVsv8AsLSg6LzkztKiKbq8WX52hQbDuah/URyI5aUTsWd4PUosFtHBfFZMG2F1Oo6TK8UTiJhP6mq6xqsepjsS6A3yZ1jWU0yxuS3hFYBrRQc2ymncoUZWoZby7C1DFb2DocDwA3XfU8Y1qx+UA8XGBrZCWu6/JBk5KC1jWu4hyBpf7B/UFjsq6bH3/uYZZT0dOE3lOhCMi/vf5j5RaVpZAELt3qMIDACtJjRgKCtAP6lKWXDYaNZ4lRiDeOYypTUKVtu5WkQ4SuoVKRXcFeQfU5wUdoBaiOswLtlZqS0QA5k3hyOu/wAzDall9k3OyyFiNTDoc8P9H3SxckbepLckzyTNakF5JampM3qRXkjd6k21IrWpFa1I+EtvUmb1meSZ5meZ6h4j4h4h4hFfQII3+gfQQyANt8lZ8ZhqYLOFu0AY2DQ1jmFFyurxHVBmaJYoUXoEoJWAxrU1F6SswO5bKGTzKeKcfEFxGy4F0ZR7ldxPMugDZe49dBXENDJRlp0c9+DMY5G3S7lvHKNEBaVEpNxw3MXZqH9+JZpRqgsU721/kBQULQBwClA6maL3cQgMC2psrYXj5ZfA0G5mUppI2HlxFJVV7hvPS4c0RidppUeieQczDlARlqF3eufUbRCG0Dk7dsrtHMUdjOwpsNh8uZbRRps3hBrlYdF7y4GVT2A/1NJxlNDZT5GvNRuCVCqGcW7H/I+Ggo6Qf2u8aYryBf1HVrwjZ88wdKLd2Q7HU+8xm80V/qCoZVboTeXS5rCCkuiyunMUCXW7IDdOvcCjFWy7kIq6YjWmgt/EqQoES2caQSShba/qXzbWvKVDINltLxwe9OZyTVoEu1R9vujzDh/UbRoRf0N/obQkMBmN4YfoY5hXME5ZjmWcsE5ZjlhXLCuWCcsKvVmOWY5YbwtrUmupREw528wUWGO9r3gmw2U2XzcvVpFFy9jt1TH2hcRay9QQ5dZeapUFIImXE1PcbRXWI3ZjowGcX94KzFwbzmnaWKaNPuAzGQoVMf8AkAbFFYf0ipTeKrt8OicxgjjFi6a/HxC+ReQ48f8AkCQUUsFDKO8L3bwby7hZhC9CrmtP+yoASJ5mMvDfMpysYLLMgcY01l4jTpEBq0S1pBa1g9xTDAqLNfKpyF8cvLHAx2IZUrsytXo5XWM2Dqb63vwaG3M1qxmUHDT7WzNiVEu1lDgrY2Ilgu2vvXxFgUl5OWp6ZXyA0SKWtXt4ljHmNk0/gao6WIwn5f8AsQFeawYAkbNmKi3AGEUea/2OjsxyzSbRwXLsTMxX/wBP8hS3d1CQDVjKvDVTEIlpDWoC6G9TLNrd42gxjK+T5gKDSXcKJCtCg8rTMXSGe+WYnHEoAobRIB96+4F6sLliF1ZjlmOWY5ZYmrMcsxyzHLLOWY5ZZWrMcsxerMcsa5YpyxTlhcL6hfUze0z1M3qTPJC+SF1qTPJLb1JbyS29SWllMTE1jh083KImjkFkydFTkFQVgAEyX+sTVmjZiDIfM0gkqpTvEiR+i9Lgro3AzJFMl+WcBXqZNLrLHT1rEXx1FauRAThEXSPaqAKVlVA4PMoXU5U52zsTXJ3VNetXvERqjubxz8xPJmFDYHCBV+K7hgARa4h4/a8zHAsxHCxjUuFCCQNaGuINSWkQwLvabhyyLNoewL28nlBGIq5VwfmNGsNGH4wHA1dXiOYABraxd1oNc29Q65ksrzRg8fLMBaWV0hPWOq7cQO5Y7honwzehLdf4O0K3jYeeE2eSVLdGcOI+SWTije/uWQ3uDqbyxKsDVZRQmXaVKl43mSU4KyuI04FzTYmFLhGYMrk6QNijQ4DuGiooEIVu7K8e/wB1gVYxpQJYsQF5HUsi4UUXa9xsQFbusuRqjAwOWYWOtY4LirUGrX7iDhhVUpyxizncYnJE3tM3tC62jdakF6ma1JnqN3qTPJM8kzWpG61I3yTN6kzyS3JG+SN8k9Q00nqVjSB1DxK6nr6DSCPUohBgQAyVXWDTdA3UBFI0xoCXUy9nKovVRjBplLTpA4XktLU9f7NJIWM0PLiYRZVRAu/g63gk1MWsB/vqaRTWaOPmHTBZGnSNqF0vBHQV9QQq7b1CNFqWu9MxI6BMdPvUUwqqTI6vT0faM5BE1Vvbt4gKnyYf36JexVGVqHj/AIVrMYMORX8wVuXrMNMS/MFNH/ZpMPG1mr56W20PbYzp8XLiAywBudAtpeVjWTBYpXQOvy9REItYFOU34mmptwOC1Urarq3y8y87EcMps0MHLGG9gZZi5ArWO42QZ91XbH5+eZeEAy08R7jS5F1VkfFgLePfnzER1rO04tHXiaiUq3tQyyb15jA/Zw2HX+zRNfCcxRhq455L/wBY0yAyKDvRvMsItDn/AAjBXpBgD+pbRjpxsQRKYQZV3LNV4S6m00CyNHo0p4/yIt6oCi6e+Ir2RSyxqLIP4IM5hSMtcwY1rQNL/wBmyI0DT0Wp9yUNSsqsORjgqAh0ioqKIohCCGvoMVG8MJDAdw8w8sNNWe2HlnthVasxywrlmOWa7s9s9so5ZRywDlgHLMcsK5TFasod2UKWxmTp6GSdHyZPcCg6mE+gVwQQOriAClpqMPNGsECUwvIy53ZgRuC1dc5zXxCfrS3VL3UydWykLgG+fT+WfEJKM3eN/MMOFu+dI2S9rOcERKQB5hLsy5TXAAsDeT91ilylQIXrRweSIE0Fi0U3S8121EVrK62HZtW1yiwwY5Q2N8b20aZlmtC1FwlilKXt7lFUDQFVQHMNpkjsFMHxv34hSUQxiX/YrdgQKgg0GPsEdeAKZ7nD3tLdovLNkK8kEAIjHX8EORt6tH5pmqUwMjZYH+xjzA1LPFP408QPQMC48DqeGUI+Lf6ZiOFZTxXSUlXMyXFGJrVFBZk4G+ur8Q1kq3Wq/wCxMk8PL5f6I1VdI6eX9/ucMoMfB3zCzhqrNnPz9iCEYd/W0OCy2LS69R0rHrf9+4BW8gxhYal3DHbcitAFAcGND1/5KAQuUDfmOQjGo2jBFUNL1lVmFFsPzAB3FAMVIEqqXCf2ZIHS8LPwvumU82YZGibU/wCx6FCSzlCuUdNU1NU31R8opyntPbFK1RrlmOWY5Z7Z7Z7Z7foQvqZ6meoX1NtoX1AeoX1M3tM9TPULraU9TPUz1C+oX1KeoD1M9RFdpl8jut6Fc7jvpA0pgAatsSxgYf6gzi7e4OD1oLbljT3wWBW+QuJbEKgXnUu/h8xJdrIVbQU2xeme4QYJVXSa/p+8FVTLc4OfECYLVmbF0xkUN/MagDfGUQSqg4rFdjAA3nQby7hzjf4meyLktt965+fUAi2Nwg+nSVRUZYmAOxxfWhrAXAt+qiOzOoJUconVliKDK1zsO0cChbQlptEoCiU1zn7EVyBWQq4tFK4KgcoPc+I9SwyvKBUIdWvthSZTeJeZuu9RUIpVpdysyKs10ieJG3JlgEdSLdOve3UOZlyP6/x9QB4wP/UxELAipkhFeoOXaDVs74iOYYUM/wCCL4uw/wCkzAMAHYI0ABSmX1sQ0SDHGN7+8vNBzmWUWMEYa1r5Ll7cmEvfmvWJQlpsxddxFCP0Ky9ou92W9Jk1i3qBnzpFoRUHbPlLgJltMnEprDUQqBrZsRQhkoPwh+YaG+p7Af2TJxM1tMnEz1M9TN7TPUz1G62mepbe0b6mepnqW9T4h4nqeoeJ6nqY4hXExxMcQrib6THEo4mOGY4YVwyjhlHDAOGUVoyitUQGqVYL1gMDGNfWVkjeVCyFLotFb5xrpUJoUatWenR9TLP3ioz0LArAGOgk1iL0BO73mWzRdPoFiFFquIPktMsAUHUbVypt0RYjNA1Q20JfBSuHiW3XrGagdbrS72l5kozcyWrzapSQmZ8EfWq+YwKMtkAvl3gppZ52+3+pilou8nPX/LmiqWjlbRGLVau8C6s0C4rxhIZ5fbmZVJfMYBcJEQzVFBDKQuLAVGq+Zt3UcKBMZYXQiyrgCGv5YvdDOstWoa8y5CAZYpDrpeL9f1ERCWgFeICgvlR7YrvV+YQK1uVr45Ym59oLweY1FjqNW1dEVIlm2yNw6WuXdHNQiy5ldR7fcqiYOtY1hQmo1vnneCJOIo4KshdqinMtqVi2tLvMxwKzt3Hfx/kr72KrnH+3GZFAao2lSYvBtLpF3WkdC/UUqur9DQG9Q2DGiFwRubjoGI9jRlT4h3nYwH/E5i0IMcHV8bdTFaMxwxq9GUcMo4ZjlMVoyitUdNI1wxOmYvSNOzN9InTDzPcPMPM9zfWe4aaz3DTWe57g/wAQbxcXmLi8RliAcYoByhwa11nh2mK67FUQ5LPNW71KcgZ0XBQHgLLa0Vvg3geF2NZhzm1wjTetRgAKL0qWBEtzRadwLJRqup529UR6I7G9fE1wLTk32/fUS1N8qzUCeSUQDU0ftBxoDhuJsKpgUMRCyhimwvnuFQ4ClH9Yy+Y7SkGrL7dfiIrI1aGduP6ifHbq8wABz1BwJeUFXK2YgtK4uPqWQg6Uax+l0YKmNbwigiUTWMMsMq7qtB3FG/RyPzFC7eS0eJmAXK4D7ZklA7ns4CXCxoKDteRQqAXvL2r7rw38swEoeiCbs3b1KpRVdX/IlKvULXv8YhBWAytbvuGKWSVf3SmJhSVkRFAYcq8TiKghebn5B0xxly3mfBk02gqWMXO+QxsSKra0j0OAtlRkpSMOBRvAWajtpfU2BRMmWsWKhmZBULDuNKnDaAZaOjhQ1/yGwKUSKcYiGF8Xiwh4a0rSdAOFPqXtTaGxlWfHdxhsa5zWT5jCwsXF5+htFn0Goxesvue4vcIXW0z1C+pnqZ6hfUz1C+oX1M9Qu9oXW0L6lPUzwTN6EzwTNaEzwTLsTNaEtehKwrVAE2IFVGngF6WJmIIubCamhaaafdR8w13t4wsOazKm2qVjnazj3qjsjuUxAWv1EqQs3m1hUKtVppcqApZVjSnnb1KKWOzJy9R2UY8t3OJXywdBCGa1Y4disbX8SoA7UXCpnZSK29tYSMaOTbul6MEEKbbd0Sms6INeYLWyDS13AD2XHTbaKi+cxoUB2zrMy9O/qCau8oVDxugs7zjcDdGxqlKAt0S/vArI9h/8lcZoYX92XcKltV9weka0bEtl0tdWNMz3EQA8BpL1oG7b9r/ULrUKODiXDF2OYQ6B10tfcRihzQVW8Skfal3Lg0aXi+0haByZtISTLh4U/PyINlNoDXv/AMlKxloXoW6uEMM72W7gQEVIvIC+xlOlQY49vfW0ydTywhoD1E6imOsFhU5GVIig3TozEIXdYV8RBRdV6nq3MwFQYwh+IOBca08TD/LuJ8u+pFAVRY0XdfOYIGtXyXUo6hLDROY3wTPBLb0JbehM8EzW0t4Jb1M1tM9TPUz1G72h4h4nqb6MK4YVxCuJjiemY4mOUK5QrlMcoPaNcpjlCuUK5T2mNlNtUppOsaAHViBQ2Vka054gg2oAIaaRyB1FQNbarTzmBFVTTjfuLVYeYtgK5WHo7TieS3CyTeWhfmoghbhRc0/FRUkVHdUHnSYNnqtZYcUZmdKbMXGeqHRvMoFqN1ldxCLJWCzT95jmlwD8TGzehwReEw9AYWC1X71vCzQr2wEp7BtDSwiLdFi8zXWP2RIihzF84NYgUVGabrqHZZa50X/P7h3mF7YZ/uWgs3pGxBXTd7hUARQb+Vjh0i+DzMADVP8AidpWDpwt+pfKSqIQFqWXiOiCmvtebrj8xq3s1tg7KL39QpS2+ZV2F7wA/wBkbnc2D7Rkumg1Zzau2uO4EvKipbM37jCz6WMi8UD3Kmd27qri9RG7G5jgT61bhEbnayPCzXEUkYN3uhgyeCUxWtW1eoO7Nqt9j92ljdlVBRUwGb1S7I25O5VszHKYvVCr1THKGmqUG6e020ZRylHKb6ROmHmHmHme57l9we2De7Nd5fbBxA51g9pfaY5S+0s5S86oJyntB7Q01QcK3QBiutf2YHcpsqUD2lsb5HOeEyyl1DRrYpwszw5wb/1CtajLzNMWl54uGFhWiMscA2tVytZU7J+kssXcqzeuYZbHAOZm/sLBSnFpii3x1HZnxrpHQpR0Lv3F3ZJzT8xnEUwu7mBXhl9FRKFgtLdg0Sh86y3f/O5jYLYM4jIr+51ilzBg/eIMIxVRQYG9q+OCZsJuvFeozXLFXxAChvAlYiYKtocHKQAEctXneCw3uoWvuZ4i0p+YuDDoBVzQiyy0oa4xNYcFl6TGdB1GvVbEtwrSuoRAp2dK7jJNheHtl1C2uV3ZQ3mX8+CyyQ8r7qCsVqzKjDbopHchA+iAtBi33DBYg22umscNZk6rcRxRV3VwxYXBFpmFbtEYxebj9TEBxEbsVKMi1q8QiRTTgQFjQ2vNt2LRjMNOX0fepYNMwNRSRvWb3eyCrKM1d3xD6d5g6peNU9pjlBK1Szli9sa5ZdbsavVMcs9sIQJ8T2T4h6leIX1KepXiF9SnqZ6meSGm0+JT1C+pnqV4meSVvZAIKi2ve7cNd+EgAAWO8CJpjdLhryuEZHjIF+deZctKci6vl3mGZOrdw5PiYuZlKHK6kNXRTSjXzGGqTzm5fbzmK0pb5qDNCH3uXY5A1ohdyyWbqorECZV2XiMkaUj8Qaxj6NAF7wzXvSBsXLJpS1MQM2juLfbzUVmk2zcONbQFXzFscbw4nCs11axXcOkRIti8xMGb3uo5KCarISpazld2ohdS9YauOuc63CaFsoUUcmrDpxerMyGK615hgq2nxoBnheJUDYZf1pHujRk/2aDjXGhHXXMzWOXArtryL2yb1HHIAwHGgfD6GBkgzeQxudmp4GGteAuFBoAYANAwRYEsjdrKeKjpS8hlJdQhPaLUDaCcMPtw5+mkHVI4asUAoNAcH7zP9BB/kZl3SlkQGjprB5dX/wAl0D2hr77U5miv6YFFjaAvgGTOI3k9TVaJuJmBMYhfUz1M9T4meo31M8k32mb1I3e0PENNIGNJ6gZ0gdQOoC7QOpvpKioCKxGRAYioqKgIpqKxCQgYAaydmT/N4MRnvAMddkOmoKKZD2wh18vpgSjdQX6Vr9opZWVGz5gbhe1rN5Jgpl7YO2fMt1pN4m1X26y28QpqPuOGQftUC8BL65o1pLlAmrrgmegWqbQamqv6g1zniaE8VrQuj+/iENzpLkNVWMYpM9Rzi29X+kyYTQT9skecaqqzR7l4YeWKuqsWHqOF/wDEshdDEsc2BqkHi8ARXSWXFSystrjYi0gUTe7bnLWmu0W90L5uI5VYVwl0g1nmlJ7C0TQZ2NGnhi0V3KDfuU81LrX5eZUUDhb3gDOt3Hg3j8yjQSG/5iV5B7e5ZSisVvld2OETeYxhaZilk+SDTUvtPgoMPSCwJQlHZgbi1tekaJET7RtcrMFhf3lmwHKwINRRr2/z3EwtZpTtMN161AgxbF640pyxurzz+JQaDJzM877zPJErOOpDUYiYiorEOkOsaxXUrqFw66Q9yncx3MdzHcx3Cu4V3Cq3mOWHuWdwruYreUHMxW8s7gncK7mO5it5ZW8SaWiuYtTjVWUMAN61ole6qUlhC8N3fJ+JQnrklY4rFcffXMqTA5DDLrCbUmksINuo09zOuzesflPEeqpFbyaYlat6RUMe7hSlfVS7yn9TBsEHW2MEtyra5WBneYEPgg61MAHMshyTYND/AHMAhmmw7xFLk2j9WbR7CzeBVO0HMyC/8lGRa0vJ8QRCxrpxLUBl6g+gr1NG8ttyRQDE1D+4ApqqOfMaAp2T8QMGW5D7iAtTwU9Bg1Y1fIatTWuIKZFWY6IlL4Y8+JemrLtKuFqbdi/vLWrU18xspTXSb5dZRXNWa9QrzeUG6XSXLeZeJKcoCt4SbxcVrqcwASzsZYyvQ2ZYWiaNkWmstcuapeYkpVRGqdbj9r7BQ6o/MbPKGNftBONyDKbRyRnkOTINRYVyxabxruY7incx3MdzHcx3DzDzPc31g9y+4XyQ8zPJPSFmyHhL6TNaJbwl9ILwnpBb0QXhLa0TNaJgaWC63loaW4NXmynZzrM40m2jLKBm+mK2Jcq+5bp4hkBdsfjuZi0ftHLlpZXqYRAc+IcKIgJS9y2UV9wb/wCwtxaBuzPK3QIiS1rAg1g1JdOsHxfQejIPl2lRDKXP9A/aVBZLOpptUVfoRh2RiVoYheyrmmMS8FGn3llhwgtVbzUC2t4qaItDXcrrg3cQw8MUxWgXEfBRGQlbdlvlp5Kdqh2TQheaRj0hDRtz/ONWPhWGg1RN5RauHDOZkeAQPemkQbcqwkC+oAy5drmjOkDFlNE/uLMCwCjByy8DYMruscRb8k0ArXXMBm8lRTd3LbUvGiXtSWbJugly2HLmVwV3tE1RsG0VnuoUQ5N3OPEI1jWcv2plNHmtx+H3it0iukGT4GwdPUCtEt4QXhFvZFa0TaLeEWHzC+IeIXxM8T1C+IXxPUL4ma0JniF8JmC60TbQhfCA8JSbI3BfCDYQJTCWv9QEV1dd1rWOnsqhobK/qKNDIClXyZ8Q3C4yDV/JSHUXkRTWG6ZfJSt3+4luDe4azNcnayxYftMm8rTT2WRlNE7msw5hnOsVOXiPItv4hlm9GVB/5BI9T5nng/L1AXcDUEwB1NLawsg1Xu7fDUVXLmK6an0BdJQa6waou9CFAox9BZVFgdSGd4QoeZorjSCXK87yuQtWstQPAn3lPai3TkytO5XuNwrQdAscGLvSWwnA57igBFd2UFHJpMme6V8sD8mzwtr7pMyGj5H+peqFsrhcxs3+dYPUlhljbHqbQp1rGBsBu4uVFQlNT9zFbp+cLa9XCLzZnxDwLVj8S8Kaio2jRoluyWCJRjppNSMw0d2ES+9TLEA6qY9xZp31XPfxDjV+IjqvqJUYxbo2I8ekcQWQibJWNI+CZ4TNxngnonohCpjuY7hXcx3MdyjuUdzHcx3MXvKO5it5RW8o7mB3lncxW81MWVa7VouA2X/0zsaPnEdgbAG2tN9ZmSwShFTXeZC2oJav79wq3Z3ajs9SwWaviLT4jY+Jqlw3LoLo3YReAMGjx/yU9QdMWuAhFS11H4iWzRWFgatYPxLoSCEHO131p5aMTk4Bd6u3q8VzHb6HxmFENsHRDVrWWNo/XscTCXg1ZgKKgTXSa4lzHcqWI23PAlpZCw3ILWp2qI2cSzaIzbWPmEKAvAIEcHnHccC9iWVlJ/qaXHEmbSUzBTfA/wBwVAHem/uMTUZ1xHiLoXkX4GAI7jrn/wBIOV+IIEscQsLgNVi2MEd1ktoIUq55jWeZkPvFoWo5HG7MwiGUcwimBqPHQMBxMe+LhOUxW8o7iFbxCt413EO4FYuWiIWSGaYY2KVh83r1El2Wy2VEeQQVf/spNLls7R6y3eA0EPMGIlR4NnpshO413McMo7mO5R3Cu413DzDzL7nuHmHme4LzM8/wBca/QWFuN1DGqWomsASKFBV+4atdfyil9QK1grwu8D+kIwzLOHxz+YOot97yiUZrLx3UebOCDWTPmYNm2kcxrxq4hNVDRWrqasB0sbV7754hasrKmdX2f7Mrf01ow9bwiCemx0sO/wD64izwY+fLfzfZHooFIN+ujTuIWHkiNXAp+jKjMtfyoRIGdWacQ8zbUi9xOtBail2iy1eT/Imcy4MGax7kLk4a5DByyuI74D4C/vCdFhoAoCF2sMArflT1LQ2bI68L/kPpO0sqixPPESorsBl+ZloUG0pwq2WN18Qb6wNY70jbbxG0urOkwf36gTC72XnMdAWmS7n3sx2i6QlqjNRbGahWozwlsakYwmGBdFOXXJvGU9D4zEtNKc3l/wDYhaoTFc9pzCchA0aVnzr/AJxLx9RDJnJn91mDDdfQzf8AAM8wzDxA6JXRC+CF8EL4IXwQ00J6J6IXeiF8IaaEp4IqLQiFEdxV2sS6scw2AAYmT6gVN7ZW2GgIcHYZTjXXM2AWezpppCmkTUGvmECI0Zw3DX4cQ7MdTAZczCzVgCWyX3RpFdgtgUDgI9tbP9kS5Xca0oNVgYDtm4jHArn/AN9eSKqlodL6w2wPi410DRgx+9SxQr7hYVEXmK1FHdcu0ZLLWs8x6s+he1S2o+JYvMQjFj+Qii5XhlsZ0lmZli+IlAu/00YUEFjjGfvcLpwLi74DaGmIVgQe22awYmYuVJLbXgofhldSuHgH5Rya25lMoC1XYgUXE2DAXdh1vK+0oEhX5hfVreUo+ist17iaCvCqhgRZQO7tAmxZ9zHbcYIW6tghdaEL4JTwTNaERdiZNiN8Ep4QPCOj308w9gCrb/8AP7iE/Bb9a/EAurNo83Km3QCruua/NS/COOrZpfnCPbNeAldEb4JvoRHWiZ4I3WhHwQh4YeJ6ldMDpmOGY4ZRwzHDKOGUcMKrRjRswTAWK28n8RTAG4JnPoQBRhxes1BNIOA4qvzKD7IYigeatmAbtL6yHCSz2BlDAdkCyobrP+TNCZbXfowH3gjRviDOYyYlGFnqERV20TiUYN/GMfEyVpzsSmyrlv4hQVOSGiHHYN02BavUJGYLCOXiq/AEWi4K7QrB8VFci98U/EVpYEYA3h3EmoMSru/NVH+xALcedfofMfEPEuNywHrH3KtDbd4P5iIKDZqtzqXFs3CzXuBgdAq3eKEBAt6i1iF4NFeEB+WAaLYOQT7KVjs5H9yh0GcS1vQNVhZkJ9rf7EMbF07d+Ag2CuedL4ioKVttoxLLLfvlbb/2Au+rZVE5HS0yTRzxEENZpTdhjbkuuNSPfpbtsbQeONO6i2mUoHMUcMxWjMcM9Mo4ZThmHZlHDATRgU1BlRan7QtzYX3Fu7NbCohZMue4okRoAVQfCemCsIxrYY1wzHDFK0ZjhmOGNXowe4eZfc9z3N4GCLgYWLg+yPXcQ0abiAbX65i0q/iG74hQr1HSrvBhMHy+34gynR6VKHCgsjc1Zs1rsmQsk1MNCK26Kd4yUBakLXmr/dYuRRzWJRl6i3WkBBq3MSwHVTS+Kl54aXg6iBt2MYjaaEbFTWOEw9KdmwrRm9ToG8Gk9ATK74flqNKG21MPqDRETLerAYr1KvWZrRAtNOI2ZK64IOysS71YpWXqpjmWVrtLg2ks1c3PmV5ap1vEaoq62W18PcBAznQPHJNgS28FDOloOkx9Cdx24qTqk/qWrUG9AbeMEEAd5N8s0mxCCFlNXqcxaqFhRRzpMGjtPoBC00qVoSNQG6Ta1hrEoa2WxRrzvGaU0r3ZlO/lL7GYo3lEmL12Zr4G7yjUFlpQ19PA2PcuWDKzmLZOdXtmjmVK6at9wYuLxFtxaLuCBi4I0w9QabDC9KT5NYm9B0eIyVFiIljqblx4tMoadPX9kphcW/MYYuFi42i+4Q8EPBPRPieiZ2CF8EHolvBKdi4raiCu0uJFAGcjcTwNoFZsdRKoMExFIoobV1klBCz2BljYXQvZ/wDfzCb3odvDAGVOtH5ItnkbXA5UmYEs8psyNTdgoUiqA0HlmrmdMXDJWXGEB751UFf4eZtsYdDHwPwIFofu9THrOJ1hpSGLjp5rFcXDViBldD6AO0oLM03eudmVrKp1NPUzqA7rmVZ4AncRVWUKHbqO0rKgGJpvz3L0s9MtDBF8QzsXHOcTN6E9TIHZGhXqlNAvVsAoHzcA7Zfu48HFOpGtasUSHpmupYJdXkB/ZMWSOWz8y10jkAEciVhPcPWgYMAPQ/MxXnDP04jQICIRTtdmNWBxW1cR7mDdaj3cuaN7ME+SPMMUjGzQmLkSA19nQ7gDt0L2OWD8Q138xHFuL2llcyoDbqa1r6XE7gbZQE03gPcFFAUTPBC+CZrQma0JmtCN8EzwTNaEy7EbrQlNQsZfUsBBGhYanCf0xptIohphXj+4SCgTGtla7ZDHOYBDfINY3WhG9gmeCZrQjfBC+CfE9TEKrRmO5jhmL0ZiWcMQ1uNtLCWGC5jllOFZYLbuK1ssYaL2i+olc2xKbmQzSa8QNwN5233ErH8bnEKOh3YGogMAi2qtHZii4VG00W6qN/yeSafZQ4zjnfzEboTGtSvALesHgY07gbysoggO0DpLztLrasGmqrVmq8CBWQk53l0Fvh5iz1VLRq/A5ddHuWBFTor4CYEUmFcxwbUZu9YhCL4YWr0vEO7BvT1LpbrriLzOGYprLvmpi9JZvcUml5lRChQKA0VKcg+f/r8w54i8jpDMnTWVjFfVUxUsd2geQDqX77hTDIzJjMXNDniVLZ7y/Q1y3hWWCbcRLjaJsMcnM3ZTiuYYtN3sICtdvzBA0GxTT/2BtXzu8Ox1fV8RlcrWq/aXB1lxaEKjRmK0ZitGNVoyzhl8GY4ZZwzHDMVozHDEGjF1FKAKrQsUKWvcDdyuSwThuZW0XRwDWeqb+eo6+oVFYT/yNcMa4Zi9GU4Y1wzHca7nuD3PcvuX3PcWoXsy13h5i9zPMui7it1gWwhnGNotbnMdCmb1pBtTcBMy1V1pY0iWIVahy/yWAbWvKBoL+SWmUTcmO3Xb/ZZoKPmEBhKtarruVqqOepmv/Ah1oViNmB+ZWRa/LxKoaDXdfmXU3ZciWNb0zXMIoZSptUwcAObVmgii3U/rrd1Ydktw1i/UYBrouAQCsdy44VtGCx8xG85uK5lXeZVm6ibrL7l9x+nhjt7VzzANqthYmKn2MpiBYvpRKU8zd8TMkrSyLBjacNcMBFHOt5Rk+EMCFmg2jxrXVo6PEZZMKXniU113iM2qx6bXBAG14lzpbgOZgr1mQ8s2xW6C5reWIvDwwKdcr3LbxdD33NI6mRfLiLEXiLxCxf0Lo+ovEMXcWLrQ08xih0K6x+YrdmgM01rutt5dYNTQKquM6wDbyJaGR9U9RZ1j9Bbi+5cL3A6gdQM6Supngi1tHO08JSbQWxLu0uZqBXSBnSO5TE0UHmN8S8aSyX95owZ4isvzA2U1w7zArLlhbQvdSEliPJFTD6f5KIsTmCKu4JkmMVjiGYrEdL5MbVu7YJkW8X+ZWgtEq22ffPgy+osKFv3FO2K+XqP8VZ0NBf3MTcm2M8GL43iNauAhqd4+og1yRSlkovEafRhiDxLiwidRywtD9pUOauEtzLfW2xLIoNgN4kXjb1IEWn2DolhgWEm3wVLiVwtE9PQtfcWLTusW46xBMpgMCkA5euZRVQqs2ReAMBwQ6jRvCK4CU5niW8EXQtp94J+BUw8MRWFXUHiGSK6SsRSbJWIRrRMxTwiMZ4QHhMXdhjSiG4dbI36uWKrhIJBQGDGitLyJEvANgt2enGdljtF3ag0nyRhG9JTwSuojxG+P4CVvFJZ3Cu5QG88GW7LLKLR+VeIoaM2aY0YvEoO8v9qGRiXuCxVRA2hElv8AEwZXvMVQYpRiLRVP2fcdC1zGht1WJuQTIXHtIlx8oMWmfETqQYWrhF84jbn2nwPMtWqNTly36x7eJmgZkEE5PPMHeCTQozvLlqootEDqbtRsjMag9mYyo5rKqLLhBpG1f+iNY1oy72Q4O2sL6KsNfesYaJuxAmx1DFQileoB5mBwS6YItTtxRqfl4l9NM7XAxc8NqUtB5/wmND7CJ2fM6D5jDLGd3PcGKatOoia2vzGauiw1SVUtTnUgO4UN5WN5XmV5leZR3KHmU7lHc9o0a3KiLuEuGSN+dogWYY1gWO/lvr5eHD7hFNwWLTz5zWyJqRf1o80LYC9413MXvMdxruY7nuHme48XK7mTchrrLOIFLrMLcaBtCpo8QPQvX+p/wP8AU1AQD26z1gdXhZWumsM3JbGS5VK0J21/RuxBCCRPutNWzDWP9czXz+f/AFLv8/8AUv5Lmv8AUd5LKUPdgfeLOqBki11+qmDgMB1/qK1f1/qA6fD/AKizaz4/1ASirx/qH+b/ANR5gayAKqsPEFyv67l6J0/VxTV4HMa5BCNClXPcPaTVkMrmf8L/AFAP8/8AUU/z/wBRcTXjLMeCdXll5qLeYQOyakAYJgwzBg3NRVaJfgpSaosrcfHJsXmtGX3iGyfH+ogqkdQKXAeoMyV3LThlqWATTKQS/tm3iEC5qDxdyj1XAu4oz5i1+0XlIUg4afdy8ScY8/4VBeLP13hHPWo/e55QBf8AsD95hHnCId/0ctbl0E3oscBBAtchyGB2LLBb6o2iXbfdKRqw3mZuUY+wU7pNM3lEEjiGgfp5Ua79FPqtILJJW6yWUY66OoMB8Yo0naDr4Ipqq72F67uDeXwiO+I6tQozbh00gV0yUU8R7PXxKM1bigFpc1ZXobxckCxsgT4HwkKOsb5meZnme43z9PUHqLnSXPUC3SazEOTEBoV/p/gBNLIBDqLyxg1fKWdHi2g3TYN2CHfSiuT0GxsQ+rKpWQLt+zuXaxNlf862mSv81UwRzH6uIb/2rBQcfi/gxltsO0HBro04PQZXcFMNsOSEpfkJahVUDOCj8SoRv6MIQAtd8VK1TuBCvG9pur8WZ0bkB2rKfXi+213WKVq4r1NZ7+j8n1GjEdn2M90NfEMWqoJFmmGs4B4QdSjDWcq01D4JkRbvIadcwcaQi8/Q2j1McfU2hgt8oA7cIfOxWIDVdFG0OcvEeVYEctrQ/KEhwjo6VKQl1bF2T+/cFTqrYawO5ndL17l0YybLgcg2Nrbkaym/UGkm+kfE9R8RM6Qe57l73PcfMPMNdZk6zbmDf/heXUwXZ0jnrD7o3p/zuYzkImr7A++sJX1Iakz/APL8tJzpQN/hwbS+AKN/54RRj/AgN/6M/dcfxfpkWuf66A+ZcXDBzLkmYZYX9CreoGPptK3jEiURFWNRC65V7QPYzwFDAKtBQDAGwKA2Alq3YOKEwZU8RgK0ZlbsvcW2CfEfp4gJCDlMYXcMffUjV5Z5qLuEvtvMF9CVLuOvo5jsIIWLxBnH8Asi4KYzktYEarQXozeQKDaq/TaCmZ6GUwW/Nxf1BGlK54lmgg40qZ6v7xo/Lq16b4Bhrp1Ca9UN0WBd7LvQ7wBvN49z3F7hMrG+pngmZmAy9kvTB/G2omZlw0RAYh9qaAcymVCPJzX5d/EqVK+lxbJc6/iH30Jy6EN/gbG0brG+f4geIDw/EBXR+IiGj8Snh+I3w/Ep4fiU8PxM8PxMmz8QHhQu0P2Pq/w3Ea8Lo+mmXxgPhGn7/SZYykxZP+wfgX3CMNIMqMWLTow8ZgLYdW45v0Wis3NfRjmAIN8VHZZVO4ZfF9XyPUp/GrR1cfEU0j2f7TWjTRNnAG3ykG/Ip7OiJhHZMMC9olYlN2G6MvxF/djDwC+0Q6+XcIkpFnCVp1NrgQ/0Qv8A6gn/AKJi/wBEsf8Aoh/0SjYlPBM8EzWhLOxEwZZwYPsfcXoK0C270JjXq9VaBNg6Xmt5dyyNrJZnq4lhSUyl6Z4hgivFZFP3D7yltHDUvIa+8MEoJ7Vp9xT3EJRT67Fl9l16jd6EzwTPUb6gkK+uIV3AO5k3iMVf8XRT5mJuCrQBasEBkDNm3lu7acw/hTcRyf8AgH30JbHQ/sBsGgbS9q2WjWBiCv4YvCIrSWVZBZR0tv3m9+hb5NxLbQUP9wmAf15jZiz9d4N/Z+YrT93uHa/Z8ykXef8AWLaUCtA0yxW/P4P4MPox6aPR6H5L9ylcfREvhvVuX0Ww2aUeAUfY+o1iMuaxwlrsqToD+4BLdQtV8CGtTGxLFgK4h3n/AK2id0UdpBGtomwDn2LbF2K4llR4gO9pEvIuec9/CmyNasITK8zA7muNMUANZRSI2IzG+pxHziuJ8kOcmzJmFlA2S5HDMtpkSgZrK08RED5VpBlYu29id2AFW6GxRzMdzVvHylSwANJv2HB1btMU9toOgOgAOiJLiAq7dH8xMtlugn34hP8AmIIoQAu5tMQLdP2C/MUiINcN2rzmFPuzQgLyXA1EygrIke9JS9GWHMx3MT3Pc21nue4eYW7zzJazJP2HP+G4anaWsQaeZ9ht5/jjyFya+XA3d9CLBRaaBsBsGxFtzF5GKsxZLjt/4CtWsaDeANryVNgAaSwjqt9J54dkxSx9ArU/Z8fwt3SvLX7l/ED6JBt67T9AbSlcfRZ+Gj9J8FvozaDiq/x3z+ENEZcawCLtYLLlcGQj2RTyG5BaGNSVqlXYpFt6Y7ehq9NRmGYIiwT+Icp00d4iHW2NiS7FMRuYJmrdKjMsGcxqaUrjB25H8YfklQhhEHuWgmbjL0zETUgruQvkmeEVMBriYKbUdr73NpyzxFV0S3kjd6kwNYWPa7AZXYIoIgcY68LQ2M6rM1qQPJA7IVNSDqNN1L1JQRC+BATpSl3vFWlQ+wTgfytEfyBKLLR2uAweZHwlvM9k9Q8T1PU9QOphAyRkIFBVf6f4Z0CULLGzHkGa5df4aGdlXSpi02uKGi8Bc2GwbRLcRK6Q10izpMxNz9QTKQprnGl9xSPigvCIA94UBGLduAW85ROJ2ZAaRCO5EHFSqVlZcNEbfg/h9/BFLH9RVbKvSWfUrr8Riv8A2GvXnkaYVjN43PTg/C/f0Ii41OCdBI/TX7bfcNP4PJpiWyzwSmnbUXMQtxQxNjXFIgF8BMNJ6iV9gc3ohVT5ak6v+G8QqiPB5yNfGXuLxIsS7q5WEuGYCBh9oaAN1YitDO6Sg7hW8kLrbwyVylQZGtizXr6BGYRMigMqypNstrb3Pft7TR9CsxSuGxA3TDqpdfU8SuUckbQ/QckCt0Ab0rcIRad7OdftKns40Uc539JHVrX7QVh5acw1gwxUbWvVI9zKNfoeoSjmUQrmAcsK5YVyxnLKWZZ+45//ABZdE4SyH5fh4gW0ylZVM1awZsZb6IJZ4i4/jUT6VP3PZM5P2nH8F7L8pmOp/IPhsifRLihjJfscPuDT8EFy+i5UcA+AUfY+pn0+xT4ZfUy+2FvWGQlRnSYa6B0wgiUx1lTOaBvCvZ9PJy+gwqArdj9GHzCpVqbyPyDGihTqKdWaImXNx6jVq5ftAZPAEHZSeMlIWNhGNtuR8HuLRFNZYcZqAwjBwax41YVWrKcszcUwu7a5bf8AEdlgqrasxyzHLCr1YbywHvI0hyY5dFGPSQtTlV5mOWY5ZjljXLLDdmAtBDnJznwwl0NxhLK1lzaAWHNAZgZWN7NP3SVSqh8DP9RqtWUcsxyz2/XPU+JmF9QvqXvaWs0jc/8A8zokUk01Hw36Y2jixiC4hzDVH0A3Y/xf4ksf3EK5+s4/hUXb8oJKB0Z1eqRveP0C1PxIPjPqBrsP99A/MqOkXiFYaUzlgvq33DXZfhhoTeMw0lcKmBYJHInDKsT/AAOd3CxcQ01BHQ8t6G7ojpVxZQcGwdFEcRcMeEawxywRurLeh4gnFxVvRmYgrOHpIfkniFZ9NiY6XCHNxnBgmIujKjDGia75iJLBvUt1LRBvjHfganGNUhM1NF6DYDAbBM1tM9RvqMAnGKR+UFdFu0Fq8AaOULYGJnqF9TPUz1G+o31DeEKoxm1XEucRfEdm2RiguR9GfwlovAOqM/5KVqb15jfUV6meoz1CuJjhmOIVxCuGFXow50gLMQ7Ffxu0RndNq+eL0L1f4M0I9Gq2HY5JaGeyMnR6fs2TXVDTME+nHJ9N5S6C+J/wGP8A4DP+gn/AZ/wGf9BP+gmDPwMUiJeudJgxX+xj+FHk/lGEsiNibMENwjocfcX7j9KeTQ5EphEUoZvmj7CH0YLAM8Bu/Ee1VI2HA+AlTq6yw0vH08RJaKbnvAEiRh7GlLnqPSO0IeOaLwDdd1a3YiywamHTELsDHJxl2fBmLxMusg6+6hLl7UJH2B7hiMQ1J0ffJqmB+YFaLMgy8jVm0Kq5saL1ribh4mlNGkstUulZfSArH9gXhbX2HL0bQqtGYrRmOGF9KDdYfFbek+PHjoByzDsyjhlFaMxwzHDEOGIcMueEbil0feab6AHGltvlYgCAlivLrMGCrNaV2p6otgDZmL0ZjiNcRriHmHmHmV3PcPM1azXrHpmZN/G4Fu5//APvoSwEBekdq4DbiUk0g+O3vv35/i5rA6Lunh24fLHSgRCkTUTmYusBFoAl3Ih2aRp9QZUS0mlZCjq/rvGVM0wf9wX6b5lmv7vcD+794/rv5jxv6cxb9v5grBpKxwXLkl39vEPoxV5P5SmNmij+x/L61K+tjVKAa7l8H5leONaZZdsHqCw+qwvJrj9x3TVO6taN00G6kVwW94Wg5XXcVY4v9ggG8YZBGtl4ulQp4MGojvv3oPMNENkYTv7koDYW5Vq+9Ydgh4g1WzzKslrxAdA6bERuBhynXPqCtbdW7xKBXXLBfgMdkMTU67231qLdOUGCDSMxlzTdvoH26X+kcv8AAE+gw3GYALwsgKLFMCX5rdDglZdkuy0mV2q6qBvcdIYfMddY66wh4lPE9Q8TPELek1mJswTx/pX6EbsioSgX1mMRO0+wGwbEqdJkEKrMLqefs1KOg77seEbHs/gk108BaaDxdO1O7H4l8yLlxAG2xfEuX9EJgZFPiNFxgEtLxg9xWKxP3fEPrh5P5SnVFQWsDlYHw/aFVgGybnP8VAVgAFAez4FJUKF5GXjA0vH1YRLQfniymHmcM/S2OesIao+8EtW0q6ljAu2cPmHr1tb9iI1RV/RsAAHBRMIXq+Kh+c5xQjvDUoQzHdsV8v8AacEon9fQ+nJOtPIbxgjGgTBJNgbQaRyTW5gdR9j8qFHaQVVOOmkPQAPEtWkItWkEgBC6Wcr0FvqY5A4GFeXK7Up+hmM8SniUrpG49IHUygHap6kWoMDsaFFt0Sq2jd6RHiI8R8T1CFdz5mOWY7hV7yl6s1byuNZt/wBH9H6+BBpY5qYI6zAxnzCYPBgPdPMqnOP4K9IdYhSPSRQFo3LW7edHZTD1d0P9RuTX+CtN1hBEmibx/kvCK3/Wv4UH2/L6Q1S4mN4PLel9wr6s+fcIC69tHuFevHcW2KcTrfzHSpFuXB4eJf0TiGhmeV/UZrKqw7tCuABEoCJxGtr9wXmBNi9wrmq8JVu6DoG0psHDEwVanWIrVNaXFGgepYwvqPYoa27xYsupYAqIxEUaaKdsRFiM6S2l73Mtwzb46vLHpg9wTuU5YJyxlyh+BcKeB8yWcsUvVlnLMVvLO5Z3LO41ywTljTuxDuY5YpMdxTljXca7jXP0LlsPUz1M3tLXtE40icaTXftf+G0gNtpE3tG3Rw1lbWRFzoeTZ7p3/iNIN3jIaf0eoohIbZ29b+/4JXPs8Dl/kfpUWEq/dx9WHP8ApaUOeU2gJfL8p+P4rELDTThX5XwgVaTyyo/duNBUYWl4+t4iuiIXmn92GorQQbPJ3lopfX+ppUvp2iiojfRK0pzLZ6+lQhdtIZPwhWNN6g0pdNIbiz9o76YQ2ikLvpusaH78x7vyY2rg/TftepbqW3qW6lncjEoITkE/d3jfULraZdyZ5JmtSZrUmeSN9TPUzW0zW0L3SW6mepnqW9RXqN9T1CuJXUPEPEPDBnRmO0ENI7G38OSHSYSJHd4mmiUSlRes4TC9JiZxoA67x2OH+DBezgzI7edR1ZxMt7fjEv6FbmG5nf8AFhzFUANtQl7/AOf1Vbwhrr+ZMumdsR5xnkHJ7LIWYcG6LH4YpLI8UZYwJrrtHd+T8RLWPdS5Y/a4OkuFiPH0xFJlQVA+FA0VxuksrC3t/uLco4QSipt4Ysl8zZ+Zdim9Y6S+an8QNj8qf+Ahrh4hJigtCF3rBzPfSGj7yyihA+OIlWFCpWIO1ZYNiUsZ+cB/coO1I0HX7RTj7wTj7xHH3lGa07mI4Yrm193Dy+gO03hIfKe0dIo4fofKMPlKh8pvpK6j4l9we5fbDywe4PbB7YI0WA6KLjYEircvcbqJ3bUUFI9zNbgNqCOpnUJuDLZvrBp1i6GA2EZKFWDo1xrRFuX/AG4j3MFV0r5ZYdTpGqzTdiHQoQg4qLOSSk+0vKX9uIDT9TqUvMdJRLs6WLasU7/yGoaRmhQ77SMBoWlsrZ/c6iGn7nU2p/XiFAuOhtdUDdjHWCd4rxAgxQQaFpbHa/tdTFf73iGqI8DxiObGUr8sAqCttiEtV6gaGLSUURw40WY37fxDXfpdTRB7E/qJ4ybXQ/aJizQCtYIlJtUuBjqJbTwXHKwByRmkUY+t0Y2kjbIN15vlefGANe+cDRXrPbLlAPQnK7CnMjZK0F0OLnlB1gDnRhiUSDbBsfkiwhG1UVkp1QjYim/FKIbUJEwLRRpjQIJygjuwQ3YjlLOWNcsU5YpWrLOUs5ZZWrHTVF7Ypyy8asXOrLOWWcs+IX1D1M9T4mepb1M9QvqCnEBxANyMrJFeIr1G5mfEzcUjm8EbwSucmak0ixz5gY0OIzVsI7xGK/rUfpX1YYlcStY95fLI/QhyLzL1rLnGql08zTRFKusVHLcLuWyqJyQoeJVi6qITWIdLvzEbzjuYl+l/DLaSfiFsBkissY3JuNOjKckp1ZxAISjL2UQow/MeBmJ0lHMQrUlbn7y1sy6JlfE1x0bsWEALpxLdQLxAeoD1M1tLepbW0F6gvJBeSZraN9S2tpnqW9TPUb6mepmto31M3tGx2mepm9pnqHiep6nqeoeJ6h4npm8fKCsREoaR1GY5TXpPUa4ldQpWW3A5L1idSuonU9QE1SiVrRDx6hxBY4iWpoFqdAIpo8rQvTDH+QEAkUI8lIv7jdVWkQifR+ty3aBry0KeWjGj/G/oFKJNs069Y+YBMkBuXYqYOld5JzmmGKVnWYg6n3ln/qDdZa+SVW8GVOY0yumAahAgfDAS1MwBpowIV0umW5Z5qOlpxGR0BQ3d8+IswYVDUWlgtmNgT3MDmeQMTi5zsjovcMC1TAWwGbFzZ1KV3+X/ABDlIbVvN8RIggHEKrSYrSHiFRrunph4foo4YnTKK0YmNGFbqbaR8Ma4l9p6mL0jXEPMPM9z3DzN9YeYeYeYeVhYbKYjJYdGLW5canMfMXuYDUGA41RSgzb0m+s9xO5XcEPhpLrtaxFYwz2UmxSy+o8/AKAFFWr94+Z7nv8AhbzFeYsVcua/yFIYnVgaAGictbnX8mRqGzzHQwZOXcriyWxY2fiAq2NMUKmL7gxwoVjYOyOuHrMAsi/E4Pug8v2M6Dww0q31Byo2hlO2CuWaGdFhI1uZOIF23YlhpV6S4RVAdqHiLyEFFr3GmxlASYh0cSiKwdokEwkIk0oyovaKIZkVgG9IrA/6cR2dZK8reYomAd5trDSCN4IxGK1mOZv/AADaGGGD6Hue4eoQHiZlTPUp6lPBAeCZ4JngmeCZvaJ0RIjwSsz19PiJE+m38N56lfR+jKlSvq/zr+AAcW61cGO4BpxKgYmsVFsHLDWme2dQ4mxLd5SODisR5wSk/J/yb4nlhRw9QqpWaXEtUYiZzWkQblr0xDcX/qN7RXFd8tJQwc25hlhfoHE5X6npLDtC+CC8EL4JTWhAa0JTWhM8EBvQlI6Ep4IjwRHglPUR4JTwRHglPBEa0IjwSnglNaEzwTPBG58w+npmL0mL0ZjhmOJjhmK0ZjhgFaMo4Y+GMYkqevr6jKlH8GV9WB9U+j/Ovrt9LkajGtXT+4OUgy7nuWaWbtD/AGCb18wIwSjtcorGJk5iXrSvmcLPLmX0qqhbOISLLXTqQly4vE1k4YFyipo2Q4/vzG1KvDEBgzeavj6DXSDzMcMNN4VW8ArRhVZGIcMKvRmOGY4ZZwzHDMcMxWjMcMadmNcMsrRmOGNcMxwzFaMarRmO4eYeZtrPc9y+4eZrvDT6BGiL7jprF7j5l9z3PcfM9z3PcfM9z3Pc9z3/APh2+lSomOJEUx6DdBpbLPS9v1mHBqUsPb+j3HasAsTYWe/QRyXUsICu/qDf/WUMrEq95kVvKSOUcyq31NY4labIOWj6JLyXQwuDFRvKY+ifYnlDzDzDzDzLVBpr9D5hcXFxeIuMxfctvRLYfM9kfMXOs31nue57h4h4meJTxM8Q00gdSq2meIDwnqWrQldT1HxE6nqeiep6j4h4nqep6nqV1PU9T1K+lfSo/wAWV/F+qpO47BuJRarV29W1QuCvkllioNCjsuvLnxEocn3X3Rfu4YaDSNMLXRzZW0csFvP2g8sytZFPicoeW/xK718QtunxB0Acq5XqiPBUPrr+mMdUV9On0SCrk1mCvpQe8wdQ8QHgh4gPBAeCX4TNaJmtEp4TPBKeCVtRPRPRKzoTeK6J6JtpLcTPEfBHxK6I+CENIPmY7mO4V3KcMKveAdwo5hTKBvMdxHca7mI13LO5juXMdyjv+GJj/wC1RP8A4BQNVJSiW1t/aKKs0eDl+CUGReQDFwi0UZ3KrERltK+mvynmFRbl9xetq5gStM1Smi6ku4yYgZ+rKlQDY2eIrTSU8oq6Mtq7scA3hDAaQ9z2hVbynDCq0YVwwq94VwzHDCuGY4YJWjLOGY4YpejMcMU4ZjhmOGY7jnmY7mK3jXcXplncPMPMPMPMfMNdYeZfcHGsvMX3FZHuLuL3F7nue57nuHme57nue57nue5nme57nue/pXc9/X39H6V9K/icutN14zKwGwTjEya/7CiLN2MLMu/qVNbMWU8e4Mnkp3n+CPnMK4uIGDqu4sFDp3CLoqVwVKiqI0DQh9a4NZozWJWkYo9TEm8nUVymn3mc5LdoeYa6w8w8wguCBi4GLzAxe0LiFxC2QOYYvEDDC9y+5fc9xc6x8w9QleIX1NeJ8QvqZ6hfU+Jnglq0JnqekfU14ldEp6jfUz1PifEz1M8fWvH0zKleJUqVPj+FfyqV9al62yCkxopdPcynyXbNqfI/ZgS0xUOkSxCm1Xlf1lslFBSrtja9jgJdwqUrl6Zq20dhdEW1+Rh/c59uBAStAm38Iqgxo0C2Xp5hr5ljIYpjLgLYZ5n7IHZ5mVVjgYgeJXiF9QHqU3tAeCF1tC+CF1oTPBM3oTPBM9RvgiPBEeCI8ER4J6JScRvqJ4lPUpraOm0fBHwQ8SnExxKOJjiY4hV6SjiAcQCtIBxBjSUcSnEo4lHExxMcSupjiIcSjiV1KOJjiY4ldSupXUxxPUfErqVK6ldSsaSupXUTr6Ufwr+CpX0v2TtiKAU4BYcI6y7KyYnVOnvTvSL5A29Cf69uZfmD1mYdGCjm6lq0pzAywJ3ZSJi4DQToI63jlm30qJMDFulSsZHRKq23r+oOYAAW+pSHSUNDqfa5YxLissuDLxAIIZjhBz7/ABNpwZg6gHEDqDqB0yjiAXpAOGV0zFaTHKY5THDGq0lY0Y1WkojHEarSFVozHEa4jXEovSIcSjiY4mOIeYeZ7g9w11m+sPLDzMcyu5jli65YuNWPme4+Z7nue57nue4eZ7nuY5ldyu5Xc9x8z3K7ldyu4krue57jK7idypUqVKlfR08XYH3higXcc1w5YAz9kaup8ynMDz9mU3r4g76RF266iphfVwKtcTaQ7iH/AICMy5lYhrE+jigCwvJpF+G5gG/UO7CrDd/hcZZqvJ/hUMhDLJi9j+/Uc5btdDp/vuU6p7h5nuHmHlhXM9pcDC9pedUvOqFcpedWDjVGg1Yu0e5fbL7SyPcXOsvMX3L7mOWe4XCW9QvqC9S3qfEt6mepnqZvaN06RKbRvr6NzPUB6mepnqZraZ6gNbRvqHqU9T4meo+pmZ6hc+JnqfH0Y319MzP/AMUqtIDfGSCBtYXwvXMdzusCI8+5TsCVvlDeDumE0H1LXQIXU3vMohKNFyMVZU4lNYvf6Vj6awE4c8F+DgiCqpxZb8kdhVWGf9NqmYli8rHpRercH/FfKeCgNbTPUz1M3tC+oL1LepnqF1tLptM9TJxC3iZ6hfUt6jbxG+pnqZ6ma2ma2ivUb6jfUzW0t6lvUz1CHiHiFcTHExxCr0Zi9GFcMK4YVwxB2ZThjXDGuI+GY4ZjiY4Z6Y1wzHExxMcTHDMcMo4Z6ZjiNcR8THDMcMxwzHExwzHEo4ZRxPUrqepXU9T1PX8DK0HJu9QikXNb/EQ72gGtupbSCmQ8ER1foi9ftQFsHmyvxFnx6G4X69tRpOk/kI2xoRxW1bWy62GhNkGalDOM0uAOu4pa0bwErBQt2KHRD2I0MeAmGr3mjs/31LxYa/D/AHWaoZYVwwDhmOGY1phXDCuUxymOGYrRhVaMxWjMcMK4YVWqWcMsTVMcMxwzHDMcMxwxrhjTszBszF6MxwzHExxPUPM9w8w8z3DzB+gMX39GKhZhStZfc9z3PcvuX3Pc9w8z3Pc9zHM9z3Pc9z3HzPc9w8z3Pc9x8z3Pc9z3Pc9z3Pf0Wki9i7Ryh5XeUoVA4JRJl3WOTqZcNniKVvepNtZew7RYBA0zzGC2jvT5/wBiK1vaBWlVuyXPx8Q23uMOLTIHmGGY9HJu7vj8zMVBsSw0PmDcenZVQm+BzpUBllEfd/RANdiGms9y4HEXiCB+hggcQJFlQMDFwsXUMXFkXFwsXCxf0L7+oeoXD1C+pnqA9QvqZ6gt7QvqZ6mepa3SZ6lPUz1E8TPUp6mep8TPUz1PifEz1N9pnqU9SvEz1M9T0T4mepnqZ4lXxPiZeJ8T4leI+p8T4nxKnxCtM9sZQ66ypR7KwUqrXSYu8VUpmvmZZ9xVq4Op9pnN+oOdxRFYNK9t4Kx9DZMz4Sq2jZXFXgvWnUjqvDkfZiHt0GnLF6INUt59ShSJa2OP7jZAtywHqZ4JXRM9TPUL6hd7RvgmeCZ6mepttM9QvqZ4Jngma2jfUz1PiK9TNbTOuJnqN9TPBLepnqZ6meoeIeJXUrOkDqV1A6ldQOoHUrqV0wZ0ldSuo+J6ldSuoHUrqV1K6ldSup4TwnhK6ldTwldROpXUrqV1K6ldSupXUrqV1K6idSupXUrqV1HxK6ho6qkzOiLdrEz9cEFkM+ol6xWriqJKyr9kd1VLbVqg7PWfcQeoNRcVGDTcStmu83gVQfQrdfMN5iDqV1DpKxpK6nhK6mm0rqHiV1PUrGkrqV1K6ZXUrpldROpWdInUrqV1K6idROmJ0yup6Z6YQ8z3DzDzB7nuHme2e5vqy86spyy+2X2x8s31Z7Z7Z7l9sK5ntlHLCuWe2Y5l9z2z3PbPcfM9s9s9z3Pc9zHM9/T3Pc9z3Pf8NKuGZSRAF4dwjitVr94rb1vJpMtNZejviG7i6wcuiNipoG1hHU6XNJ31j9RTRlj5hau+sp3fMuhybTEWzyYVyy+2a7sK5ZZywTlhXLLzqwS9WWcs31l9svtl9svtllass5ZfbF7ZfbLHdmOWWcs9sXtl9s9s9sfLL7YQ12hM9TPUL6meoX1M9TNbS3qF9QOuJnqfEz1M9TPUz1M9QvqZ6meoD1KepnqZeJT1M9TPUb6hfUz1M3tM9TPUz1KepnqZ6nxM9Sl4lPUz9MyvE+J8T8z8TOwm3xDQrBVcQ76jNbHj/Ys5LRbHurPpPOYFbFwanYuUEJs2hpxp9PtKlPH0R0JnvWoX1LdTNbTPUz1M9TPUb6mepnqW1tC+SZ6jfUyO0L6hfUz1M9TJxC+pmtpnqZraZ5I31G+o31M9TPUV6meoeIHUPE9Q8Qep6m2k9MPE9T2jpqlEPiep6nqV0yup6ldQ8T1PUrqV0yup6ldROpXUo4nqV1K6nqep6nqV1K6ldR8Sup6ldR8T1A6gxa0GGx1gSotWvERMHRNai6VnWBq/E1ebIQWmKVAAWtWoReJkjmVKhM9wXlgVLthpVT1PUPE9THDPTPUK4YeX0ep7Q8Rh8pvqhF9ptDppDwzfVK6nqYrSOmkfE9T1PUfE9QhCECEPpX0Dtldsrtnue/rv9axrD6OusruH0fMrtnuV3Knue5XbPbKidyvpUqVElRj9K+nkDD5h1b0HzHaui6Sy28usdzzLrApgIYFQYLS5oHBP7Z5fwVKlQ2wAKPcJUqe4Hc9sDtgds9srGrK7YHbK7YnbHyzfVm+s31ldsDGrKjrrK7nv6VKm2v02jKxrK7n/2Q==','data:image/jpeg;base64,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jAgEVSw15gBQBWAowlAapgqUknWw053jsz1vt5XGRZEmQhipSREkrlDBDBSVkrYpW3fNVK6ubjZXY1p05THryOmXTjbSX1CTjNKQx1tJGA7yqu0xnQisytE9+SNs7c9Z3099OBb6TzaZ8VtjVMrKM+morlvxNQVy2o3GrVzp57aY67Mdc2s249nLejPnuACGAAACIYJgIZYhhnGa8wMVMFBigyEMVMaoYsFYM5VqWuFBemaFfG86lKOuKTVyhiJsEpATTlczp53RLTVy9Gam+neK5RlqbMOrnz0SUY785ZQtctiyXzVzg2xTlJFOuyVKlc1WykypIm7o1ub025dN5eh53G2TpGBHn9FZ7s2uFcHDp4FGyq85pg7K7p1qdpLDXWp172LJ6rl7PNklnugAGESQRGCGWIYIYUiNeZtCsQraJWRasQSEKxOViFYmoAomJVn2U78VCkdPEORKDSpNWElrzburG3h68ubXkms9N9PTlUEOmJUTptlGL1yi07ztlCU6ucCaulRKakm0THcwq6O68/PT9B59qUok3bdl049N8IGe7gqEKEu3znXZTeTIu4bQs51Tm7p1W49BFSTZ6PDs4docT1XG135oRz6JEQbiEiLAQMTQEVQw15wYqGKA4QxQGoDVA5UxqmNUMVMIJRlcYjrcvfy0Ed4YhARVvY5/U4+jbVOHLvny6c2s0021750XVbddcOfqY7ckddG/LQWV689rqsbm4E1OUBqxRIv+vfGurcfT38k9refS+X/QPnrciDm5bMlvP13QK89oUEO3zXOu5K4TV51klc7K9UuP1OY9OXp4LYwml3Rw9Dj6Nu/hW8+3ft24t483n9P5qe2KZOqYCGIhoAdIApaevMAKAA05QBWJqADAlYCjBoAUBwgDsU093j5/NZfQZOvn5Eexn6cudZt2FW9WcfQqbs7VVF1es5q7qOnGuzLdt0MU8mfUVSW/LTCUd+UlEubHCU03FtNhNpkGbPrXy76hefjPL68TTsqJuyQs9pVVx1wklO87r6Xz91ULaunjByN04Wef7EKNUWcUNtXTxVWUl892zmdfHXo6eZs5en03k/R8vbgxnDPtAAAARQxIxBS09ecAUAVtEo0waFbi5WIViajQrcSWTiK00W93z3d58qaqJPPopuop78O3Nm3XNV1Sr3muq7HvnXz1H0eLd2+dXy+nnqK9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'];
var SPL_N=SPL.length;
function heroGo(dir){
  var c=ui.hero|0;
  ui.heroDir=(dir>0?'r':'l');
  ui.hero=((c+dir)%SPL_N+SPL_N)%SPL_N;
  render();
}
function heroSet(i){
  var c=ui.hero|0, n=((i%SPL_N)+SPL_N)%SPL_N;
  if(n===c) return;
  ui.heroDir=(n>c?'r':'l');
  ui.hero=n;
  render();
}
/* swipe con dito o mouse sull'hero, piu' rotellina orizzontale */
function bindHero(){
  var h=document.querySelector('.fh-hero');
  if(!h||h.__hb) return;
  h.__hb=true;
  var x0=null,y0=null,t0=0;
  h.addEventListener('pointerdown',function(e){
    if(cl(e.target,'button')) return;
    x0=e.clientX; y0=e.clientY; t0=Date.now();
    h.classList.add('grab');
  });
  h.addEventListener('pointermove',function(e){
    if(x0===null) return;
    var dx=e.clientX-x0;
    h.style.setProperty('--drag',Math.max(-70,Math.min(70,dx*.35))+'px');
  });
  function end(e){
    h.classList.remove('grab');
    h.style.removeProperty('--drag');
    if(x0===null) return;
    var dx=(e.clientX||x0)-x0, dy=(e.clientY||y0)-y0, dt=Date.now()-t0;
    x0=null;
    if(Math.abs(dx)>44 && Math.abs(dx)>Math.abs(dy) && dt<900) heroGo(dx<0?1:-1);
  }
  h.addEventListener('pointerup',end);
  h.addEventListener('pointercancel',function(){ x0=null; h.classList.remove('grab');
    h.style.removeProperty('--drag'); });
  h.addEventListener('pointerleave',function(){ if(x0!==null){ x0=null; h.classList.remove('grab');
    h.style.removeProperty('--drag'); } });
}
/* freccia in alto a sinistra: dalle sezioni torna alla home, dalla home esce */
function utBack(){
  if(ui.tab!=='home'){ ui.tab='home'; ui.sel=null; render(); return; }
  close();
}

var FHI={
  tune:_SVG+'<path d="M4 6.6h5.4M14.6 6.6H20M4 12h9.4M18.6 12H20M4 17.4h3.4M12.6 17.4H20"/>'+
      '<circle cx="12" cy="6.6" r="2.5"/><circle cx="16" cy="12" r="2.5"/>'+
      '<circle cx="10" cy="17.4" r="2.5"/></svg>',
  act:_SVG+'<rect x="4.5" y="3" width="15" height="18" rx="2.4"/>'+
      '<path d="M9.5 2.2h5a1 1 0 0 1 1 1v1.6h-7V3.2a1 1 0 0 1 1-1z" fill="currentColor" stroke="none"/>'+
      '<path d="M8.6 12.2l2 2 4.2-4.4"/><path d="M8.6 17.6h6.8"/></svg>',
  feat:_SVG+'<rect x="3" y="8.5" width="18" height="12.5" rx="1.8"/><path d="M3 12.6h18"/>'+
      '<path d="M12 8.5V21"/><path d="M12 8.5S9.6 3.4 7.2 4.2 8 8.5 12 8.5zM12 8.5s2.4-5.1 4.8-4.3S16 8.5 12 8.5z"/></svg>',
  'pass':_SVG+'<path d="M12 2.6l2.7 5.7 6.1.9-4.4 4.4 1 6.2-5.4-2.9-5.4 2.9 1-6.2L3.2 9.2l6.1-.9z"/>'+
      '<path d="M8.6 21.6l3.4-2 3.4 2"/></svg>',
  time:_SVG+'<circle cx="12" cy="13.4" r="7.6"/><path d="M12 9.6v3.8l2.6 1.7"/>'+
      '<path d="M9.4 2.4h5.2M12 2.4v3.4"/><path d="M18.9 6.1l1.7-1.7"/></svg>',
  news:_SVG+'<rect x="2.6" y="5" width="14.4" height="14" rx="1.6"/>'+
      '<path d="M17 8.6h3.2a1.2 1.2 0 0 1 1.2 1.2v7.4a1.8 1.8 0 0 1-3.6 0V8.6"/>'+
      '<path d="M5.6 8.6h8.4v4H5.6z" fill="currentColor" stroke="none" opacity=".5"/>'+
      '<path d="M5.6 15.4h8.4"/></svg>',
  friends:_SVG+'<circle cx="9.4" cy="8.4" r="3.4"/>'+
      '<path d="M3.2 20.2c0-3.4 2.8-5.6 6.2-5.6s6.2 2.2 6.2 5.6"/>'+
      '<path d="M16.4 5.4a3.2 3.2 0 0 1 0 6.2"/><path d="M17.6 14.9c2.1.6 3.6 2.3 3.6 4.6"/></svg>',
  mail:_SVG+'<rect x="2.6" y="5" width="18.8" height="14" rx="2.2"/><path d="M3.4 7.2L12 13l8.6-5.8"/></svg>',
  gear:_SVG+'<circle cx="12" cy="12" r="3.1"/>'+
      '<path d="M19.6 14.2a1.5 1.5 0 0 0 .3 1.6l.1.1a1.8 1.8 0 1 1-2.6 2.6l-.1-.1a1.5 1.5 0 0 0-2.6 1.1v.2a1.8 1.8 0 1 1-3.6 0v-.1a1.5 1.5 0 0 0-2.6-1 1.8 1.8 0 1 1-2.6-2.6l.1-.1a1.5 1.5 0 0 0-1-2.6H5a1.8 1.8 0 1 1 0-3.6h.1a1.5 1.5 0 0 0 1-2.6l-.1-.1A1.8 1.8 0 1 1 8.6 4.4l.1.1a1.5 1.5 0 0 0 2.6-1V3.4a1.8 1.8 0 1 1 3.6 0v.1a1.5 1.5 0 0 0 2.6 1l.1-.1a1.8 1.8 0 1 1 2.6 2.6l-.1.1a1.5 1.5 0 0 0 1 2.6h.2a1.8 1.8 0 1 1 0 3.6h-.1a1.5 1.5 0 0 0-1.6.9z"/></svg>',
  quest:_SVG+'<circle cx="12" cy="12" r="8.6"/><circle cx="12" cy="12" r="4.6"/>'+
      '<circle cx="12" cy="12" r="1.2" fill="currentColor"/></svg>',
  league:_SVG+'<path d="M7 4.4h10v4a5 5 0 0 1-10 0z"/>'+
      '<path d="M7 6h-2.4a2.4 2.4 0 0 0 2.4 4M17 6h2.4a2.4 2.4 0 0 1-2.4 4"/>'+
      '<path d="M12 13.4v3.4M8.6 20.2h6.8l-.8-3.4H9.4z"/></svg>',
  badge:_SVG+'<path d="M12 2.8l7.6 3v5.6c0 4.6-3.1 8.2-7.6 9.8-4.5-1.6-7.6-5.2-7.6-9.8V5.8z"/>'+
      '<path d="M9 11.8l2.2 2.2 4-4.2"/></svg>',
  swap:_SVG+'<path d="M4 8.2h13.4M14.2 5l3.2 3.2-3.2 3.2"/>'+
      '<path d="M20 15.8H6.6M9.8 12.6l-3.2 3.2 3.2 3.2"/></svg>',
  store:_SVG+'<path d="M3 4.2h2.4l2.2 11.2h9.8l1.8-8H6.4"/>'+
      '<circle cx="9.4" cy="19" r="1.5"/><circle cx="16.8" cy="19" r="1.5"/></svg>'
};

/* ============================================================================
   PANNELLO ATTIVITA' — qui vivono ora le ricompense giornaliere e le missioni.
   ========================================================================== */
function actRoot(){
  var a=document.getElementById('ut-act');
  if(a) return a;
  a=document.createElement('div'); a.id='ut-act'; document.body.appendChild(a);
  a.addEventListener('click',function(e){
    if(e.target===a){ actClose(); return; }
    var c=cl(e.target,'[data-ac]');
    if(c){
      var k=c.getAttribute('data-ac');
      if(k==='close') actClose();
      else if(k==='claim'){ dailyClaim(); actOpen(); }
      else if(k==='claimevt'){ try{evtClaim();}catch(e){} actOpen(); }
      else { ui.actTab=k; actOpen(); }
      return;
    }
    var ob=cl(e.target,'[data-obj]');
    if(ob){ objClaim(ob.getAttribute('data-obj')); return; }
    var g=cl(e.target,'[data-acgo]');
    if(g){ actClose(); ui.tab=g.getAttribute('data-acgo'); render(); }
  });
  return a;
}
function actOpen(){
  var a=actRoot(), tab=ui.actTab||'daily';
  var T={daily:['Accesso giornaliero','Ritira la ricompensa di oggi'],
         evt:['Eventi','Peak Season \u00b7 check-in di 21 giorni'],
         obj:['Obiettivi','Traguardi del club e ricompense']};
  var h=T[tab]||T.daily, body='';
  try{ body=(tab==='obj')?objHTML():((tab==='evt')?evtHTML():dailyHTML()); }
  catch(err){ body='<div class="kfm-body">Sezione non disponibile.</div>'; }
  a.innerHTML='<div class="ac-sheet ac-'+tab+'">'+
    '<div class="ac-head"><h3>'+h[0]+'</h3><span>'+h[1]+'</span>'+
      '<button data-ac="close">\u00d7</button></div>'+body+'</div>';
  a.classList.add('on');
}
function actClose(){ var a=document.getElementById('ut-act'); if(a) a.classList.remove('on'); }

/* obiettivi: si leggono dallo stato, nessun contatore nascosto */
function actObjHTML(){
  var all=0; for(var k in S.cards) all++;
  var r=ratings(), me=tabRow(S.club);
  var list=[
    {ic:FHI.badge,  n:'Colleziona 25 carte',      c:all,             g:25,  rw:{coin:2500,exp:400}},
    {ic:FHI.quest,  n:'Schiera un undici completo',c:r.n,            g:11,  rw:{coin:800,exp:150}},
    {ic:FHI.league, n:'Vinci 5 partite di lega',  c:(me?me.w:0),     g:5,   rw:{coin:4000,tok:5}},
    {ic:FHI['pass'],n:'Squadra da 80 di media',   c:r.ovr,           g:80,  rw:{coin:9000,tok:12}},
    {ic:FHI.time,   n:'Vinci 30 sfide Journey',   c:jnTotDone(),     g:30,  rw:{coin:15000,tok:25}}
  ];
  var rows=list.map(function(o){
    var pct=Math.min(100,Math.round(o.c/o.g*100)), ok=o.c>=o.g;
    var chips='';
    if(o.rw.coin) chips+='<span class="ac-chip coin"><i></i>'+fmt(o.rw.coin)+'</span>';
    if(o.rw.exp)  chips+='<span class="ac-chip exp"><i></i>'+fmt(o.rw.exp)+'</span>';
    if(o.rw.tok)  chips+='<span class="ac-chip tok"><i></i>'+o.rw.tok+'</span>';
    return '<div class="ac-row'+(ok?' ok':'')+'">'+
      '<div class="ac-ricon">'+o.ic+'</div>'+
      '<div class="ac-rtx"><b>'+esc2(o.n)+'</b>'+
        '<small>'+Math.min(o.c,o.g)+' / '+o.g+'</small>'+
        '<div class="ac-bar"><i style="width:'+pct+'%"></i></div></div>'+
      '<div class="ac-rrew">'+chips+(ok?'<span class="ac-done">\u2713</span>':'')+'</div>'+
    '</div>';
  }).join('');
  return '<div class="ac-sec"><b>Obiettivi del club</b><div class="ac-obj">'+rows+'</div></div>';
}

/* ============================================================================
   TOKEN — a cosa servono.
   I token NON si comprano con le monete: si guadagnano solo vincendo le sfide
   del Pitch Journey e completando gli obiettivi. Si spendono qui, allo Scambio,
   per contenuti che le monete non possono comprare.
   ========================================================================== */
var TOKSHOP=[
  {k:'tk_gold',  cost:5,   nm:'Oro Raro',            tag:'',
   d:'Quattro carte oro con overall minimo 81, nessun riempitivo. Al negozio costa 7.500 monete.',
   pack:'oro81'},
  {k:'tk_spec',  cost:11,  nm:'Special Edition',     tag:'',
   d:'Tre carte Special (+2 overall) tutte da 84 in su. Al negozio costa 16.000 monete.',
   pack:'special'},
  {k:'tk_spec2', cost:19,  nm:'Eternal',  tag:'NUOVA',
   d:'Tre carte della nuova collezione Eternal (+4 overall), telaio dedicato. Al negozio costa 30.000 monete.',
   pack:'special2'},
  {k:'tk_wc',    cost:15,  nm:'World Cup 2026',      tag:'RARA',
   d:'Tre carte World Cup (+7 overall) dal bacino chiuso dei 28 protagonisti.',
   pack:'worldcup'},
  {k:'tk_leg',   cost:14,  nm:'Legends Singola',     tag:'RARA',
   d:'Una icona garantita. La stessa busta al negozio vale 21.000 monete.',
   pack:'legends1'},
  {k:'tk_legmax',cost:62,  nm:'Legends Ultimate',    tag:'LEGGENDARIA',
   d:'Tre icone in un colpo solo: il pezzo piu\' pregiato del gioco, 96.000 monete al negozio.',
   pack:'legendsmax'},
  {k:'tk_coins', cost:10,  nm:'Conversione monete',  tag:'',
   d:'Trasforma 10 token in 12.000 monete. E\' il cambio di riferimento: un token vale circa 1.200 monete.',
   coins:12000},
  {k:'tk_exp',   cost:8,   nm:'Boost esperienza',    tag:'',
   d:'6.000 EXP immediati per far salire di livello il profilo manager.',
   exp:6000}
];
function tokPackFor(it){
  if(!it.pack) return null;
  var p=packByKey(it.pack);
  if(p) return p;
  /* se la chiave non esiste nel listino, si ripiega sul pacchetto piu' vicino */
  for(var i=PACKS.length-1;i>=0;i--) if(PACKS[i].k.indexOf(it.pack.slice(0,4))===0) return PACKS[i];
  return PACKS[PACKS.length-1];
}
function viewExchange(){
  var t=S.tokens|0;
  var items=TOKSHOP.map(function(it){
    var can=t>=it.cost;
    return '<div class="tk-item">'+
      (it.tag?'<span class="tk-tag">'+it.tag+'</span>':'')+
      '<h4>'+esc2(it.nm)+'</h4>'+
      '<p>'+esc2(it.d)+'</p>'+
      '<div class="tk-price"><i></i><b>'+it.cost+'</b></div>'+
      '<button class="tk-buy" data-tk="'+it.k+'"'+(can?'':' disabled')+'>'+
        (can?'SCAMBIA':'TOKEN INSUFFICIENTI')+'</button>'+
    '</div>';
  }).join('');
  return '<div class="tk-wrap">'+
    '<div class="tk-hero">'+
      '<div class="tk-bigic"></div>'+
      '<div><h2>SCAMBIO TOKEN</h2>'+
        '<p>Il token e\' la terza valuta del club e <b>non si compra</b>: lo guadagni solo '+
        'vincendo le sfide del <b>Pitch Journey</b>. Serve a convertire quello che fai in campo '+
        'direttamente in carte di alto livello, senza dover accumulare decine di migliaia di '+
        'monete al mercato. Qui sotto trovi il listino: a parita\' di contenuto costa molto '+
        'meno di quanto pagheresti in monete al negozio.</p></div>'+
      '<div class="tk-bal"><b>'+fmt(t)+'</b><small>TOKEN</small></div>'+
    '</div>'+
    '<div class="tk-how">'+
      '<div class="tk-card"><b>Come si guadagnano</b><span>Da 2 a 20 token alla <b>prima</b> vittoria '+
        'di ogni sfida del Journey. Rigiocarla non ne paga altri: nessun\'altra fonte.</span></div>'+
      '<div class="tk-card"><b>Quanto valgono</b><span>Il cambio ufficiale e\' 10 token = 12.000 '+
        'monete. Ogni busta qui sotto costa meno di quel cambio: conviene sempre scambiare.</span></div>'+
      '<div class="tk-card"><b>A cosa servono</b><span>A saltare la fila. Le buste top costano '+
        '20.000-96.000 monete: col Journey le raggiungi in una decina di vittorie.</span></div>'+
    '</div>'+
    '<div class="tk-shop">'+items+'</div>'+
  '</div>';
}
function tokBuy(k){
  var it=null,i;
  for(i=0;i<TOKSHOP.length;i++) if(TOKSHOP[i].k===k) it=TOKSHOP[i];
  if(!it) return;
  var t=S.tokens|0;
  if(t<it.cost){ toast('Ti mancano '+(it.cost-t)+' token.'); return; }
  S.tokens=t-it.cost;
  if(it.coins){ S.coins+=it.coins; save(); render();
    toast('-'+it.cost+' token \u00b7 +'+fmt(it.coins)+' monete'); return; }
  if(it.exp){ S.exp+=it.exp; save(); render();
    toast('-'+it.cost+' token \u00b7 +'+fmt(it.exp)+' EXP'); return; }
  var pk=tokPackFor(it);
  if(!pk){ S.tokens=t; toast('Pacchetto non disponibile.'); return; }
  var got=openPack(pk);
  save(); render();
  var cds=got.map(function(c){ return '<div class="ut-mini">'+cardHTML(c)+'</div>'; }).join('');
  modal('<div class="ut-mh"><h3>'+esc2(it.nm)+'</h3><button data-x="1">\u00d7</button></div>'+
    '<div class="ut-top4">'+cds+'</div>');
  toast('-'+it.cost+' token \u00b7 '+got.length+' cart'+(got.length===1?'a':'e'));
}

/* ------------------------------------------------------------------- home */
function utLevel(){
  var e=S.exp|0, lvl=1, need=800;
  while(e>=need && lvl<99){ e-=need; lvl++; need=Math.round(need*1.12); }
  return {lvl:lvl, cur:e, need:need, pct:Math.round(e/need*100)};
}
function viewHome(){
  if(!S.league) newLeague(S.leagueName);
  var f=nextFix(), r=ratings(), pos=myPos(), me=tabRow(S.club);
  var lv=utLevel(), J=jnState();
  var all=[]; for(var k in S.cards) all.push(S.cards[k]);
  all.sort(function(a,b){ return ovrOf(b)-ovrOf(a); });
  var star=all[0]||null, second=all[1]||null;
  if(!star){ var _ids=(S.xi||[]).concat(S.bench||[]); for(var _i=0;_i<_ids.length;_i++){ if(_ids[_i]&&S.cards[_ids[_i]]){ star=S.cards[_ids[_i]]; break; } } }
  var crest=S.crest?('<img src="'+esc2(S.crest)+'" alt="" referrerpolicy="no-referrer">')
                   :('<b>'+esc2(ini2(S.club||'UT'))+'</b>');
  var slide=heroSlide(ui.hero|0,f,J);

  return '<div class="fh" data-dir="'+(ui.heroDir||'n')+'" data-h="'+(ui.hero|0)+'">'+

    /* ------------------------------------------------------------ top bar */
    fhTopHTML()+

    /* ------------------------------------------------------------- corpo */
    '<div class="fh-main">'+

      '<div class="fh-rail">'+
        '<button class="fh-rb" data-fh="acts">'+FHI.act+'<span>Attivita\'</span>'+
          (dailyReady()?'<i class="fh-dot"></i>':'')+'</button>'+
        '<button class="fh-rb" data-t2="negozio">'+FHI.feat+'<span>In evidenza</span></button>'+
        '<button class="fh-rb" data-fh="evts">'+FHI['pass']+'<span>Eventi</span>'+(((typeof evtReady==='function')&&evtReady())?'<i class="fh-dot"></i>':'')+'</button>'+'<button class="fh-rb" data-fh="objs">'+FHI.quest+'<span>Obiettivi</span></button>'+'<button class="fh-rb" data-t2="scambio">'+FHI.swap+'<span>Scambio</span></button>'+
        '<button class="fh-rb" data-t2="personalizza">'+FHI.tune+'<span>Personalizza</span></button>'+
        '<button class="fh-rb kfm-home-btn" onclick="kfmHome()"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.6 12 3.2l9 7.4"/><path d="M5.6 9.6V20.8h12.8V9.6"/><path d="M9.9 20.8v-6.1h4.2v6.1"/></svg><span>Home</span></button>'+
      '</div>'+

      '<div class="fh-hero">'+
        '<div class="fh-heroart">'+
          '<img class="fh-splash" src="'+SPL[(ui.hero|0)%SPL_N]+'" alt="" draggable="false">'+
          '<span class="fh-grain"></span><span class="fh-sweep"></span>'+
        '</div>'+
        '<button class="fh-harrow l" data-hero="prev">\u2039</button>'+
        '<button class="fh-harrow r" data-hero="next">\u203a</button>'+
        '<div class="fh-heroghost">'+slide.ghost+'</div>'+
        '<div class="fh-herotx">'+
          '<div class="fh-hbig">'+esc2(slide.big)+'</div>'+
          '<div class="fh-hkick">'+esc2(slide.kick)+'</div>'+
          '<div class="fh-hsub">'+esc2(slide.sub)+'</div>'+
          '<button class="fh-go" data-fh="'+slide.act+'">'+esc2(slide.btn)+'</button>'+
          '<div class="fh-dots">'+
            '<i class="'+((ui.hero|0)===0?'on':'')+'" data-hero="0"></i>'+
            '<i class="'+((ui.hero|0)===1?'on':'')+'" data-hero="1"></i>'+
            '<i class="'+((ui.hero|0)===2?'on':'')+'" data-hero="2"></i>'+
          '</div>'+
        '</div>'+
      '</div>'+

      '<div class="fh-right">'+
        '<button class="fh-banner" data-t2="journey">'+
          '<img class="fh-bnart" src="'+BNART+'" alt="" draggable="false">'+
          '<span class="fh-bnsheen"></span>'+
          (star?'<span class="fh-bncard">'+cardHTML(star)+'</span>':'')+
          '<span class="fh-bntx"><small>SCENARIO '+(J.sc||1)+' \u00b7 '+jnProg(J.sc||1)+'/'+JM+'</small>'+
            'PITCH JOURNEY</span>'+
        '</button>'+
        '<div class="fh-duo">'+
          '<button class="fh-tile club '+((r.ovr|0)>=100?'g100':((r.ovr|0)>=90?'g90':'g0'))+'" data-t2="squadra">'+
            '<span class="fh-tbg"></span>'+
            '<span class="fh-trow">'+
              '<span class="fh-tcrest">'+crest+'</span>'+
              '<span class="fh-tovr"><small>OVR</small><b>'+r.ovr+'</b></span>'+
            '</span>'+
            '<span class="fh-tinfo"><b>CLUB</b><small>'+
              esc2(S.tname||S.club||'La mia squadra')+'</small></span>'+
          '</button>'+
          '<button class="fh-tile play" data-fh="play">'+
            '<span class="fh-tbg"></span>'+
            '<span class="fh-trow"></span>'+
            '<span class="fh-tinfo"><b>GIOCA</b><small>'+
              (f?esc2(f.opp)+(f.home?' \u00b7 in casa':' \u00b7 in trasferta'):'campionato completato')+
              '</small></span>'+
          '</button>'+
        '</div>'+
      '</div>'+
    '</div>'+

    /* ------------------------------------------------------ barra in basso */
    '<div class="fh-bottom">'+
      '<button class="fh-bb" data-fh="acts">'+FHI.quest+'Missioni</button>'+
      '<button class="fh-bb" data-t2="campionato">'+FHI.league+'Campionato</button>'+
      '<button class="fh-bb" data-t2="collezione">'+FHI.badge+'Collezione</button>'+
      '<button class="fh-bb" data-t2="mercato">'+FHI.swap+'Mercato</button>'+
      '<button class="fh-bb gold" data-t2="negozio">'+FHI.store+'STORE</button>'+
    '</div>'+
  '</div>';
}

/* i tre pannelli dell'hero centrale */
function heroSlide(i,f,J){
  var r=ratings();
  if(i===1) return {ghost:String(J.sc||1),big:'PITCH JOURNEY',
    kick:'Scenario '+(J.sc||1)+' \u00b7 '+jnProg(J.sc||1)+' di '+JM,
    sub:jnTotDone()+' partite vinte su '+(JN*JM)+' \u00b7 ogni vittoria paga token',
    btn:'CONTINUA',act:'journey'};
  if(i===2) return {ghost:'\u2726',big:'PACCHETTI',
    kick:'Negozio \u00b7 '+PACKS.length+' buste disponibili',
    sub:'Hai '+fmt(S.coins)+' monete da spendere',
    btn:'VAI AL NEGOZIO',act:'shop'};
  return {ghost:String(((S.league&&S.league.round)|0)+1),
    big:(S.club||'LA MIA SQUADRA').toUpperCase().slice(0,14),
    kick:'Giornata '+(((S.league&&S.league.round)|0)+1)+' \u00b7 '+(S.leagueName||'Lega Ultimate'),
    sub:f?('Prossima sfida: '+f.opp+' \u00b7 '+(f.home?'in casa':'in trasferta')+' \u00b7 OVR '+r.ovr)
        :'Campionato completato',
    btn:'GIOCA ORA',act:'play'};
}

/* ---------------------------------------------------------------- squadra */
function viewSquad(){
  var r=ratings(), sl=slots(), i;
  if(ui.sub==='formazione'){
    var g=Object.keys(FORMS).map(function(k){
      var d=FORMS[k].filter(function(x){ return ROLE_LINE[x[0]]==='DEF'&&x[0]!=='GK'; }).length;
      var m=FORMS[k].filter(function(x){ return ROLE_LINE[x[0]]==='MID'; }).length;
      var a=FORMS[k].filter(function(x){ return ROLE_LINE[x[0]]==='ATK'; }).length;
      return '<button class="ut-fbtn'+(S.form===k?' on':'')+'" data-form="'+k+'">'+k+
        '<small>'+d+' dif \u00b7 '+m+' cen \u00b7 '+a+' att</small></button>';
    }).join('');
    return '<div class="ut-lineup"><div class="ut-lpanel">'+panel(r)+'</div>'+
      '<div class="ut-lfield"><div class="ut-fgrid">'+g+'</div></div></div>';
  }
  var pitch='';
  for(i=0;i<sl.length;i++){
    var _c=cardAt(i), _pen=_c?posPenalty(_c,sl[i][0]):0;
    var _oop=(_c&&_pen>0)?(_pen>=99?' bad':' oop'):'';
    pitch+='<div class="ut-slot" data-slot="'+i+'" draggable="true" style="left:'+sl[i][1]+'%;top:'+sl[i][2]+'%">'+
      cardHTML(_c,{cls:(ui.sel&&ui.sel.t==='xi'&&ui.sel.i===i)?'sel':''})+
      '<div class="uv-role'+_oop+'">'+sl[i][0]+
      (_c&&_pen>0&&_pen<99?'<em>-'+_pen+'</em>':'')+'</div></div>';
  }
  var bench='';
  for(var j=0;j<7;j++)
    bench+='<div class="ut-bslot" data-bench="'+j+'" draggable="true">'+
      cardHTML(benchAt(j),{cls:(ui.sel&&ui.sel.t==='bench'&&ui.sel.i===j)?'sel':''})+'</div>';
  return '<div class="ut-lineup">'+
    '<div class="ut-lpanel">'+panel(r)+'</div>'+
    '<div class="ut-lfield">'+
      '<div class="ut-pitch" id="ut-pitch">'+
        '<div class="ut-turf">'+
          '<div class="pl pl-box t"></div><div class="pl pl-box b"></div>'+
          '<div class="pl pl-6 t"></div><div class="pl pl-6 b"></div>'+
          '<div class="pl pl-mid"></div><div class="pl pl-circ"></div>'+
        '</div>'+pitch+
      '</div>'+
      '<div class="ut-bench">'+bench+'</div>'+
    '</div></div>';

  function panel(r){
    return '<div class="ut-lphead">'+
        '<div class="ut-lpname">'+esc2(S.club)+'</div>'+
        '<div class="ut-lprat"><small>Valutazione rosa</small>'+r.total+'</div>'+
        '<div class="ut-lines">'+
          '<div class="ut-line atk"><span>ATT</span><b>'+r.atk+'</b></div>'+
          '<div class="ut-line mid"><span>CEN</span><b>'+r.mid+'</b></div>'+
          '<div class="ut-line def"><span>DIF</span><b>'+r.def+'</b></div>'+
        '</div></div>'+
      '<div class="ut-lpmenu">'+
        '<button class="ut-lprow" data-sub="'+(ui.sub==='formazione'?'squadra':'formazione')+'">'+
          '<i class="ic-f"></i><b>'+S.form+'</b><em>\u203a</em></button>'+
        '<button class="ut-lprow" data-act="auto"><i class="ic-s"></i><b>Schiera i migliori</b><em>\u203a</em></button>'+
        '<button class="ut-lprow" data-act="coll"><i class="ic-c"></i><b>Collezione</b><em>'+
          Object.keys(S.cards).length+' \u203a</em></button>'+
        '<button class="ut-lprow" data-t2="negozio"><i class="ic-p"></i><b>Negozio</b><em>\u203a</em></button>'+
      '</div>'+
      '<button class="ut-lpplay" data-act="play">Gioca la partita</button>'+
      '<div class="ut-lphint">Tocca una carta per le opzioni \u00b7 doppio tocco per selezionarla e scambiare</div>';
  }
}
function detailPanel(){
  var c=ui.view?S.cards[ui.view]:null;
  if(!c) return '';
  var st=['pac','sho','pas','dri','def','phy'], lb=['VEL','TIR','PAS','DRI','DIF','FIS'];
  var bars=st.map(function(k,i){
    var v=statOf(c,k);
    return '<div class="ut-attr"><span>'+lb[i]+'</span><b>'+v+'</b>'+
      '<div class="ut-bar"><i style="width:'+Math.min(100,v/1.45)+'%"></i></div></div>'; }).join('');
  var d=dupeList(c).length;
  return '<div class="ut-dp">'+
    '<div class="ut-dph"><div class="ut-dpc">'+cardHTML(c)+'</div>'+
    '<div style="min-width:0"><b>'+esc2(c.name)+'</b>'+
    '<span>'+VER[c.ver].nm+' \u00b7 '+esc2(c.roles.join(', '))+'</span>'+
    '<span>Livello '+c.lvl+' \u00b7 '+c.stars+' stelle \u00b7 overall '+ovrOf(c)+'</span></div></div>'+
    bars+
    '<div class="ut-dpacts">'+
      '<button class="ut-abtn" data-card2="details">Dettagli</button>'+
      '<button class="ut-abtn" data-card2="compare">Confronta</button>'+
      '<button class="ut-abtn" data-card2="upgrade">Potenzia</button>'+
      '<button class="ut-abtn'+((d||(typeof qxGain==='function'&&qxGain(c)>0))?'':' off')+'" data-card2="enhance">Fondi'+(d?' ('+d+')':'')+'</button>'+
      '<button class="ut-abtn" data-card2="swap">Seleziona</button>'+
      '<button class="ut-abtn" data-card2="remove">Togli</button>'+
    '</div></div>';
}

/* ---------------------------------------------------------------- mercato */
var MKT_CACHE=[];
function priceOf(p,ver){
  var r=Math.max(40,Math.min(99,p.rate||60));
  var base=Math.pow(1.135,r-45)*120+150;
  var mul={bronze:1,silver:1.05,gold:1.15,special:1.6,special2:2.6,worldcup:2.4,legends:3.2}[ver||rarityOf(r)]||1;
  return Math.max(200,Math.round(base*mul/50)*50);
}
function mktBase(){
  var f=ui.mkt, out=[], i, k;
  if(f.ver==='legends'){
    for(i=0;i<LEGENDS.length;i++) out.push({ver:'legends',p:{
      name:LEGENDS[i].n, rate:LEGENDS[i].r, roles:LEGENDS[i].p, pid:LEGENDS[i].id,
      img:legFace(LEGENDS[i]),
      pac:LEGENDS[i].r, sho:LEGENDS[i].r, pas:LEGENDS[i].r, dri:LEGENDS[i].r,
      def:LEGENDS[i].r-10, phy:LEGENDS[i].r-5, age:38, nation:(LEGENDS[i].nat||'')}});
  } else if(f.ver==='worldcup'){
    var wp=wcPool();
    for(i=0;i<wp.length;i++){ var q={}; for(k in wp[i].p) q[k]=wp[i].p[k];
      q.rate=Math.min(97,wp[i].p.rate+wp[i].boost); out.push({p:q,ver:'worldcup'}); }
  } else if(f.ver==='special'){
    var sp=poolBand(84,99);
    for(i=0;i<sp.length;i++){ var s={}; for(k in sp[i]) s[k]=sp[i][k];
      out.push({p:s,ver:'special'}); }
  } else if(f.ver==='special2'){
    var sa=se2Pool();
    for(i=0;i<sa.length;i++) out.push({p:sa[i],ver:'special2'});
  } else {
    var P=buildPool();
    for(i=0;i<P.length;i++){ var rv=rarityOf(P[i].rate);
      if(f.ver&&rv!==f.ver) continue;
      out.push({p:P[i],ver:rv}); }
  }
  return out;
}
function mktList(){
  var f=ui.mkt, q=String(f.q||'').trim().toLowerCase();
  var arr=mktBase().filter(function(x){
    if(x.p.rate<f.min||x.p.rate>f.max) return false;
    if(f.line&&lineOfPlayer(x.p)!==f.line) return false;
    if(q&&String(x.p.name||'').toLowerCase().indexOf(q)<0&&
         String(x.p.nation||'').toLowerCase().indexOf(q)<0) return false;
    return true;
  });
  arr.forEach(function(x){ x.price=priceOf(x.p,x.ver); });
  if(f.afford) arr=arr.filter(function(x){ return S.coins>=x.price; });
  var s=f.sort;
  arr.sort(function(a,b){
    if(s==='ovrA') return a.p.rate-b.p.rate;
    if(s==='prA')  return a.price-b.price;
    if(s==='prD')  return b.price-a.price;
    if(s==='nm')   return String(a.p.name).localeCompare(String(b.p.name));
    return b.p.rate-a.p.rate;
  });
  return arr;
}
function mktRows(){
  var arr=mktList(); MKT_CACHE=arr;
  if(!arr.length)
    return '<div class="ut-mkempty"><b>Nessun giocatore trovato</b>'+
      '<span>Allarga i filtri: abbassa l\'overall minimo o cambia reparto.</span></div>';
  var shown=arr.slice(0,ui.mkt.lim), rest=arr.length-shown.length;
  return shown.map(function(x,i){
    if(!x||!x.p) return '';
    var can=S.coins>=x.price;
    var fl=''; try{ fl=(typeof natFlag==='function')?natFlag(x.p.nation||''):''; }catch(e){}
    var demo={id:'mk'+i,pid:x.p.pid,name:x.p.name,roles:x.p.roles,base:x.p.rate,img:x.p.img,
      pac:x.p.pac,sho:x.p.sho,pas:x.p.pas,dri:x.p.dri,def:x.p.def,phy:x.p.phy,
      age:x.p.age,nation:x.p.nation,ver:x.ver,lvl:1,stars:0};
    var st=['pac','sho','pas','dri','def','phy'], lb=['VEL','TIR','PAS','DRI','DIF','FIS'];
    var stats=st.map(function(k,q){
      return '<b>'+statOf(demo,k)+'<span>'+lb[q]+'</span></b>'; }).join('');
    return '<div class="ut-mcard v-'+x.ver+'">'+
      '<div class="mk-card">'+cardHTML(demo)+'</div>'+
      '<div class="mk-body">'+
        '<div class="mk-nm"><b>'+esc2(x.p.name)+'</b><span>'+
          (fl?'<img class="mk-fl" src="'+esc2(fl)+'" alt="">':'')+
          esc2((x.p.roles||[]).slice(0,3).join(' / '))+
          (x.p.age?' \u00b7 '+x.p.age+' anni':'')+'</span></div>'+
        '<div class="mk-tag t-'+x.ver+'">'+esc2(VER[x.ver]?VER[x.ver].nm:x.ver)+'</div>'+
        '<div class="mk-stats">'+stats+'</div>'+
        '<div class="mk-foot"><div class="mk-pr"><small>Prezzo</small>'+fmt(x.price)+'</div>'+
        '<button class="ut-mbuy'+(can?'':' no')+'" data-buy="'+i+'">'+
          (can?'Acquista':'Servono '+fmt(x.price-S.coins))+'</button></div>'+
      '</div></div>';
  }).join('')+
  (rest>0?'<button class="ut-more" data-mkt="more">Carica altri 40 \u00b7 '+fmt(rest)+' rimasti</button>':'');
}
function mktRefresh(){
  var l=document.getElementById('mkt-list'); if(!l) return;
  l.innerHTML=mktRows();
  var c=document.getElementById('mkt-count'); if(c) c.textContent=fmt(MKT_CACHE.length);
  var w=document.getElementById('mkt-wallet'); if(w) w.textContent=fmt(S.coins);
}
function viewMarket(){
  var f=ui.mkt;
  var vers=[['','Tutte le versioni'],['bronze','Bronzo'],['silver','Argento'],['gold','Oro'],
            ['special','Special Edition'],['special2','Eternal'],['worldcup','World Cup 2026'],['legends','Legends']];
  var lines=[['','Tutti i reparti'],['DEF','Portieri e difesa'],['MID','Centrocampo'],['ATK','Attacco']];
  var sorts=[['ovr','Overall: dal piu\' forte'],['ovrA','Overall: dal piu\' debole'],
             ['prA','Prezzo: dal piu\' basso'],['prD','Prezzo: dal piu\' alto'],['nm','Nome A-Z']];
  function sel(id,opts,val){
    return '<select class="ut-msel" id="'+id+'">'+opts.map(function(o){
      return '<option value="'+o[0]+'"'+(String(val||'')===String(o[0])?' selected':'')+'>'+o[1]+'</option>';
    }).join('')+'</select>';
  }
  var rows=mktRows();
  return '<div class="ut-mkt">'+
    '<div class="ut-mkhead">'+
      '<div class="ut-mktitle"><h3>Mercato trasferimenti</h3>'+
        '<p>Tutto il database in vendita. Il prezzo sale con l\'overall e con la rarita\' della versione.</p></div>'+
      '<div class="ut-mkwallet"><small>Budget</small><b id="mkt-wallet">'+fmt(S.coins)+'</b></div>'+
    '</div>'+
    '<div class="ut-mkfilters">'+
      '<div class="ut-msearch"><input id="mkt-q" type="text" autocomplete="off" '+
        'placeholder="Cerca giocatore o nazione..." value="'+esc2(f.q||'')+'"></div>'+
      sel('mkt-ver',vers,f.ver)+sel('mkt-line',lines,f.line)+sel('mkt-sort',sorts,f.sort)+
      '<label class="ut-mnum"><small>OVR min</small>'+
        '<input id="mkt-min" type="number" min="40" max="99" value="'+(f.min|0)+'"></label>'+
      '<label class="ut-mnum"><small>OVR max</small>'+
        '<input id="mkt-max" type="number" min="40" max="99" value="'+(f.max|0)+'"></label>'+
      '<label class="ut-mchk"><input id="mkt-aff" type="checkbox"'+(f.afford?' checked':'')+'>'+
        '<span>Solo acquistabili</span></label>'+
      '<button class="ut-mreset" data-mkt="reset">Azzera filtri</button>'+
    '</div>'+
    '<div class="ut-mkbar"><b id="mkt-count">'+fmt(MKT_CACHE.length)+'</b> giocatori in listino</div>'+
    '<div class="ut-mhead"><span></span><span>Giocatore</span><span>Versione</span>'+
      '<span>OVR</span><span>Prezzo</span><span></span></div>'+
    '<div class="ut-mlist" id="mkt-list">'+rows+'</div>'+
  '</div>';
}
function mktBuy(i){
  var it=MKT_CACHE[i]; if(!it) return;
  var pr=it.price||priceOf(it.p,it.ver);
  if(S.coins<pr){ toast('Monete insufficienti: ne servono altre '+fmt(pr-S.coins)+'.'); return; }
  S.coins-=pr;
  newCard(it.p,it.ver);
  save(); render();
  toast('Acquistato <b>'+esc2(it.p.name)+'</b> per '+fmt(pr)+' monete.');
}

/* ---------------------------------------------------------------- negozio */
function packTier(p){
  if(p.art==='legends')  return ['Icone Legends','Le carte piu\' rare del gioco: leggende con overall maggiorato.'];
  if(p.art==='worldcup') return ['World Cup 2026','Bacino chiuso ai 28 protagonisti del Mondiale, overall maggiorato.'];
  if(p.art==='special2') return ['Eternal','La nuova collezione disegnata: 21 fuoriclasse, telaio dedicato e +4 overall.'];
  if(p.art==='special')  return ['Special Edition','Versioni speciali con +2 overall sulla carta base.'];
  if(p.line||p.maxAge)   return ['Pacchetti su misura','Bacini filtrati per reparto o per eta\': mirati su cio\' che ti manca.'];
  return ['Pacchetti base','Fasce di overall classiche, dal bronzo all\'oro raro.'];
}
function viewShop(){
  var order=[], byTier={};
  packsSorted().forEach(function(p){
    var t=packTier(p);
    if(!byTier[t[0]]){ byTier[t[0]]={sub:t[1],list:[]}; order.push(t[0]); }
    byTier[t[0]].list.push(p);
  });
  return '<div class="ut-shopwrap">'+order.map(function(t){
    var g=byTier[t];
    return '<div class="ut-shoph"><h4>'+t+' <em>'+g.list.length+'</em></h4><p>'+g.sub+'</p></div>'+
      '<div class="ut-shop">'+g.list.map(packCard).join('')+'</div>';
  }).join('')+'</div>';
}
function packCard(p){
  var can=S.coins>=p.cost;
  var sub=String(p.sub||'');
  var sc=sub.length>8?' lng2':(sub.length>5?' lng':'');
  var chips='<div class="ut-pmeta">'+
    '<span class="pm t-'+p.art+'">'+esc2(VER[p.rar]?VER[p.rar].nm:p.art)+'</span>'+
    '<span class="pm">'+p.n+(p.n===1?' carta':' carte')+'</span>'+
    (p.min?'<span class="pm">min '+p.min+' OVR</span>':'')+
    (p.line?'<span class="pm">'+(p.line==='DEF'?'solo difesa':(p.line==='MID'?'solo centrocampo':'solo attacco'))+'</span>':'')+
    (p.maxAge?'<span class="pm">under '+p.maxAge+'</span>':'')+'</div>';
  return '<div class="ut-pack v-'+p.art+'">'+
    '<button class="ut-info" data-info="'+p.k+'">i</button>'+
    '<div class="ut-packart" style="background-image:url('+(FR[p.art]||'')+')">'+
      '<div class="pa-sub'+sc+'">'+esc2(sub)+'</div>'+
      '<div class="pa-n">'+p.n+(p.n===1?' carta':' carte')+'</div></div>'+
    '<div class="ut-pinfo"><h4>'+esc2(p.nm)+'</h4>'+chips+'<p>'+p.d+'</p>'+
      '<button class="ut-buy'+(can?'':' no')+'" data-pack="'+p.k+'">'+
      (can?'Apri \u00b7 '+fmt(p.cost):'Servono '+fmt(p.cost-S.coins))+'</button></div>'+
  '</div>';
}
function mOdds(pk){
  var t=tableFor(pk);
  var rows=t.arr.slice(0,60).map(function(x){
    var pp=1-Math.pow(1-x.pc,pk.n);
    var pcls=pp>=0.06?'':(pp>=0.015?' rare':' vrare');
    var rcls=pk.only?(' r-'+pk.only):'';
    return '<div class="ut-orow">'+
      '<div class="ut-oface"><span>'+esc2(ini2(x.p.name))+'</span>'+
      (x.p.img?'<img src="'+esc2(x.p.img)+'" alt="'+esc2(x.p.name)+'" referrerpolicy="no-referrer">':'')+'</div>'+
      '<div class="nm"><b>'+esc2(x.p.name)+'</b><span>'+esc2((x.p.roles||[]).join(', '))+'</span></div>'+
      '<div class="ov'+rcls+'">'+x.p.rate+'</div>'+
      '<div class="pc'+pcls+'">'+(pp*100<0.01?'<0,01':(pp*100).toFixed(2))+'%</div></div>';
  }).join('');
  modal('<div class="ut-mh"><h3>'+esc2(pk.nm)+' \u00b7 cosa puoi trovare</h3><button data-x="1">\u00d7</button></div>'+
    '<div class="ut-note">Estrazione pesata: <b>piu\' alto e\' l\'overall, piu\' raro e\' il giocatore</b>. '+
    'La percentuale indica la probabilita\' di trovarlo in un pacchetto da '+pk.n+' carte.'+
    (pk.only==='legends'?'<br>Questo pacchetto contiene <b>solo icone</b>.':'')+
    (pk.only==='worldcup'?'<br>Solo protagonisti dei Mondiali, con overall maggiorato in base al torneo disputato.':'')+'</div>'+
    '<div class="ut-ohead"><span>Giocatore</span><span>OVR</span><span>Probabilita\'</span></div>'+
    '<div class="ut-olist">'+rows+'</div>'+
    '<div class="ut-note">Mostrati i '+Math.min(60,t.arr.length)+' piu\' forti su '+t.arr.length+'.</div>');
}

/* ------------------------------------------------------ campionato / varie */
function viewLeague(){
  if(!S.league) newLeague(S.leagueName);
  if(S.league&&S.league.tab&&S.league.tab[0]&&!S.league.tab[0].logo&&S.crest) S.league.tab[0].logo=S.crest;
  var rows=sortedTab().map(function(t,i){
    return '<tr class="'+(t.me?'me':'')+'"><td>'+(i+1)+'</td>'+
      '<td class="nm">'+(t.logo?'<img src="'+esc2(t.logo)+'" alt="'+esc2(t.n)+'" referrerpolicy="no-referrer">':'<i></i>')+esc2(t.n)+'</td>'+
      '<td>'+t.p+'</td><td>'+t.w+'</td><td>'+t.d+'</td><td>'+t.l+'</td>'+
      '<td>'+(t.gf-t.ga>0?'+':'')+(t.gf-t.ga)+'</td><td><b>'+t.pts+'</b></td></tr>';
  }).join('');
  return '<div class="ut-lg"><div class="ut-hlab">'+esc2(S.leagueName||'Lega Ultimate')+
    ' \u00b7 stagione '+S.league.season+' \u00b7 giornata '+(S.league.round+1)+' di '+S.league.fix.length+'</div>'+
    '<table class="ut-tbl"><thead><tr><th>#</th><th style="text-align:left">Squadra</th>'+
    '<th>G</th><th>V</th><th>N</th><th>P</th><th>DR</th><th>Pt</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
}
function viewColl(){
  var all=[]; for(var k in S.cards) all.push(S.cards[k]);
  if(!all.length) return '<div class="ut-empty">Nessuna carta.<br>Vai al <b>Negozio</b>.</div>';
  all.sort(function(a,b){ return ovrOf(b)-ovrOf(a); });
  var by={}; all.forEach(function(c){ (by[c.ver]=by[c.ver]||[]).push(c); });
  var order=['legends','special2','worldcup','special','gold','silver','bronze'], out='';
  order.forEach(function(v){
    if(!by[v]) return;
    out+='<div class="ut-collh">'+VER[v].nm+' <em>'+by[v].length+'</em></div><div class="ut-coll">'+
      by[v].map(function(c){ return '<div class="ut-cslot">'+cardHTML(c)+'</div>'; }).join('')+'</div>';
  });
  return (ui.pending?'<div class="ut-note" style="padding:12px 14px 0">Scegli la carta da inserire.</div>':'')+out;
}
function viewClub(){
  var r=ratings();
  return '<div class="ut-clubpage"><div class="ut-hcard">'+
    '<div class="ut-hlab">Il tuo club</div><div class="ut-hbig">'+esc2(S.club)+'</div>'+
    '<div class="ut-srow"><b>Nome giocatore</b><em>'+esc2(S.user||'-')+'</em></div>'+
    '<div class="ut-srow"><b>Campionato</b><em>'+esc2(S.leagueName||'Lega Ultimate')+'</em></div>'+
    '<div class="ut-srow"><b>Partite giocate</b><em>'+S.played+'</em></div>'+
    '<div class="ut-srow"><b>Carte</b><em>'+Object.keys(S.cards).length+'</em></div>'+
    '<div class="ut-srow"><b>Valutazione rosa</b><em>'+r.total+'</em></div>'+
    '<div class="ut-srow" data-act="rename"><b>Cambia nome club</b><em>modifica \u203a</em></div>'+
    '<div class="ut-srow" data-act="chlg"><b>Cambia campionato</b><em>riparte \u203a</em></div>'+
    '<div class="ut-srow" data-act="reset"><b>Ricomincia</b><em style="color:#ff7a7a">azzera \u203a</em></div>'+
    '<div class="ut-srow tomenu" data-act="tomenu"><b>Torna al menu principale</b>'+
      '<em>esci \u203a</em></div>'+
    '<div class="ut-redeem">'+
      '<div class="ut-hlab">Riscatta un codice</div>'+
      '<div class="ut-rrow"><input id="ut-code" type="text" placeholder="Inserisci il codice" '+
        'autocomplete="off" spellcheck="false">'+
        '<button class="ut-cbtn use" data-act="redeem">Riscatta</button></div>'+
      (S.dev?'<div class="ut-devon">Modalita\' sviluppatore attiva \u00b7 risorse illimitate e simulazione istantanea</div>':'')+
    '</div>'+
    '<div class="ut-note">Rarita\' come in Ultimate Team: <b>bronzo</b> fino a 64, <b>argento</b> 65-74, '+
    '<b>oro</b> da 75. Le carte speciali aggiungono overall: Special Edition +2, Eternal +4, World Cup +2, Legends +3. '+
    'Livelli fino a 100 (+25) e sei stelle fondendo doppioni della stessa versione (+20). Tetto '+MAX_OVR+'.</div>'+
    '</div></div>';
}

/* ------------------------------------------------------------- doppioni */
/* Per salire di grado serve un'altra copia dello stesso giocatore, stessa
   versione e con LO STESSO numero di stelle: due 0 stelle fanno un 1 stella,
   due 1 stella fanno un 2 stelle, e cosi' via. Due carte a 6 stelle fanno
   la versione rossa. */
function sameGrade(a,b){
  if(!a||!b) return false;
  var _ka=(a.pid&&a.pid!=='0')?('p'+a.pid):('n'+String(a.name||''));
  var _kb=(b.pid&&b.pid!=='0')?('p'+b.pid):('n'+String(b.name||''));
  return a.id!==b.id && _ka===_kb && b.ver===a.ver &&
         (b.stars|0)===(a.stars|0) && !!b.red===!!a.red;
}
function dupeList(card){
  var out=[];
  for(var k in S.cards){ var c=S.cards[k]; if(sameGrade(card,c)) out.push(c); }
  out.sort(function(a,b){ return (a.lvl||1)-(b.lvl||1); });
  return out;
}
function slotRef(w,i){
  if(w==='xi') return {get:function(){return S.xi[i];},set:function(v){S.xi[i]=v;}};
  if(w==='bench') return {get:function(){return S.bench[i];},set:function(v){S.bench[i]=v;}};
  return null;
}
function doSwap(a,b){
  var ra=slotRef(a.t,a.i), rb=slotRef(b.t,b.i);
  if(!ra||!rb) return;
  var va=ra.get(), vb=rb.get(); ra.set(vb); rb.set(va); save();
}

/* --------------------------------------------------------------- modali */
function modal(html,card){
  if(card) ui.mcard=card.id;
  var m=document.getElementById('ut-modal');
  m.innerHTML='<div class="ut-mbox">'+html+'</div>';
  m.classList.add('on');
  return m;
}
function mDetails(c){
  var v=VER[c.ver];
  modal('<div class="ut-mh"><h3>'+esc2(c.name)+'</h3><button data-x="1">\u00d7</button></div>'+
    '<div class="ut-dtop"><div class="ut-dbig">'+cardHTML(c,{big:true})+'</div>'+
    '<div class="ut-dinfo">'+
      '<div class="ut-note" style="margin:0">'+v.nm+' \u00b7 '+esc2(c.roles.join(', '))+
      '<br>'+esc2(c.nation||'')+(c.age?' \u00b7 '+c.age+' anni':'')+'</div>'+
      '<div class="ut-dovr">'+ovrOf(c)+'<small>/'+MAX_OVR+'</small></div>'+
      '<div class="ut-bar"><i style="width:'+Math.round(ovrOf(c)/MAX_OVR*100)+'%"></i></div>'+
      '<div class="ut-note">base '+c.base+' \u00b7 versione +'+v.bonus+' \u00b7 livello +'+lvlBonus(c.lvl)+
      ' \u00b7 stelle +'+(STAR_BONUS[c.stars]||0)+'</div>'+
      '<button class="ut-act" data-m2="upgrade">Potenzia con EXP</button>'+
      '<button class="ut-act alt" data-m2="enhance">Fondi doppioni</button>'+
    '</div></div>', c);
}
function mUpgrade(c){
  var cost=lvlCost(c.lvl), can=(c.lvl<MAX_LVL&&S.exp>=cost);
  var nx=(c.lvl<MAX_LVL)?Math.min(MAX_OVR,c.base+VER[c.ver].bonus+lvlBonus(c.lvl+1)+(STAR_BONUS[c.stars]||0)):ovrOf(c);
  modal('<div class="ut-mh"><h3>Potenzia</h3><button data-x="1">\u00d7</button></div>'+
    '<div class="ut-dtop"><div class="ut-dbig">'+cardHTML(c,{big:true})+'</div>'+
    '<div class="ut-dinfo"><div class="ut-hlab">Livello</div>'+
      '<div class="ut-dovr">'+c.lvl+'<small>/'+MAX_LVL+'</small></div>'+
      '<div class="ut-bar"><i style="width:'+Math.round(c.lvl/MAX_LVL*100)+'%"></i></div>'+
      '<div class="ut-note">Overall <b>'+ovrOf(c)+'</b>'+
      (c.lvl<MAX_LVL?' \u2192 livello '+(c.lvl+1)+': <b style="color:#6fe3ff">'+nx+'</b>':' \u00b7 massimo')+'</div>'+
      '<button class="ut-act'+(can?'':' off')+'" data-m2="dolvl" '+(can?'':'disabled')+'>'+
      (c.lvl>=MAX_LVL?'Livello massimo':'Sali di livello \u00b7 '+fmt(cost)+' EXP')+'</button>'+
      '<button class="ut-act alt" data-m2="dolvl10">Sali di 10 livelli</button>'+
      '<div class="ut-note">Hai <b>'+fmt(S.exp)+' EXP</b>.</div>'+
    '</div></div>', c);
}
function mEnhance(c){
  var d=dupeList(c), can=(c.stars<6&&d.length>0);
  var nx=c.stars<6?Math.min(MAX_OVR,c.base+VER[c.ver].bonus+lvlBonus(c.lvl)+STAR_BONUS[c.stars+1]):ovrOf(c);
  modal('<div class="ut-mh"><h3>Fondi doppioni</h3><button data-x="1">\u00d7</button></div>'+
    '<div class="ut-dtop"><div class="ut-dbig">'+cardHTML(c,{big:true})+'</div>'+
    '<div class="ut-dinfo"><div class="ut-hlab">Stelle</div>'+
      '<div class="ut-dovr">'+c.stars+'<small>/6</small></div>'+
      '<div class="ut-note">'+(c.stars>=6?'Sei stelle rosse: massimo.':
        'Overall <b>'+ovrOf(c)+'</b> \u2192 con '+(c.stars+1)+' stelle: <b style="color:#ffd35c">'+nx+'</b>')+'</div>'+
      '<div class="ut-note">Serve un\'altra copia dello stesso giocatore, <b>stessa versione ('+
      VER[c.ver].nm+')</b> e <b>stesso grado ('+(c.stars|0)+' stelle)</b>. '+
      'Due carte a 6 stelle si fondono nella versione <b style="color:#ff6b6b">rossa</b>.</div>'+
      (d.length?'<div class="ut-dupes">'+d.slice(0,6).map(function(x){
        return '<div class="ut-dupe">'+cardHTML(x)+'</div>'; }).join('')+'</div>':
        '<div class="ut-note">Nessuna copia disponibile.</div>')+
      '<button class="ut-act'+(can?'':' off')+'" data-m2="dostar" '+(can?'':'disabled')+'>'+
      (c.stars>=6?'Sei stelle rosse':'Fondi una copia \u00b7 +1 stella')+'</button>'+
    '</div></div>', c);
}
function mCompare(c){
  var l=[];
  for(var i=0;i<11;i++){ var x=cardAt(i); if(x&&x.id!==c.id) l.push({c:x,r:slots()[i][0]}); }
  l.sort(function(a,b){ return ovrOf(b.c)-ovrOf(a.c); });
  var rows=l.slice(0,8).map(function(o){
    var d=ovrOf(c)-ovrOf(o.c);
    return '<div class="ut-crow"><div class="ut-cmini">'+cardHTML(o.c)+'</div>'+
      '<div class="nm"><b>'+esc2(sur2(o.c.name))+'</b><span>'+o.r+' \u00b7 '+VER[o.c.ver].nm+'</span></div>'+
      '<div class="d" style="color:'+(d>=0?'#00e07a':'#ff7a7a')+'">'+(d>=0?'+':'')+d+'</div></div>';
  }).join('');
  modal('<div class="ut-mh"><h3>Confronta</h3><button data-x="1">\u00d7</button></div>'+
    '<div class="ut-dtop"><div class="ut-dbig">'+cardHTML(c,{big:true})+'</div>'+
    '<div class="ut-dinfo">'+(rows||'<div class="ut-note">Schiera altri giocatori.</div>')+'</div></div>', c);
}

/* ---------------------------------------------------------- apri pacchetto */
function runOpen(pk){
  if(S.coins<pk.cost){ toast('Monete insufficienti.'); return; }
  S.coins-=pk.cost;
  var cards=openPack(pk); save();
  var ov=document.getElementById('ut-open'); ov.classList.add('on');
  var i=0;
  function step(){
    if(i>=cards.length){
      ov.innerHTML='<div class="ut-osum">'+cards.length+' carte aggiunte</div>'+
        '<div class="ut-orow2">'+cards.map(function(c){ return '<div class="ut-omini">'+cardHTML(c)+'</div>'; }).join('')+'</div>'+
        '<button class="ut-openbtn" id="ut-oclose">Continua</button>';
      document.getElementById('ut-oclose').onclick=function(){ ov.classList.remove('on'); render(); };
      return;
    }
    var c=cards[i++], big=(c.ver!=='bronze'&&c.ver!=='silver');
    ov.innerHTML=(big?'<div class="ut-flash"></div>':'')+
      '<div class="ut-oinfo">'+i+' / '+cards.length+' \u00b7 '+VER[c.ver].nm+'</div>'+
      '<div class="ut-reveal">'+cardHTML(c,{big:true})+'</div>'+
      '<div class="ut-oname">'+esc2(c.name)+'</div>'+
      '<button class="ut-openbtn" id="ut-onext">'+(i<cards.length?'Prossima':'Fine')+'</button>';
    document.getElementById('ut-onext').onclick=step;
  }
  step();
}

/* ------------------------------------------------------------- la partita */
function mapRole(r){
  return {GK:'POR',LB:'TS',CB:'DC',RB:'TD',CM:'CC',LM:'CC',RM:'CC',LW:'AS',RW:'AD',ST:'ATT'}[r]||'CC';
}
function oppSquad(name,str){
  var opp=[], od=null;
  try{ if(typeof EADB!=='undefined'&&EADB[name]&&typeof buildClub==='function') od=buildClub(name); }catch(e){}
  if(od&&od.r&&od.r.length)
    od.r.slice().sort(function(a,b){ return b.rate-a.rate; }).slice(0,11).forEach(function(q){
      opp.push({name:q.name,img:q.img,rate:q.rate,pac:+q.pac,sho:+q.sho,pas:+q.pas,
        dri:+q.dri,def:+q.def,phy:+q.phy}); });
  while(opp.length<11){ var v=(str||78)-3+Math.floor(Math.random()*7);
    opp.push({name:'Giocatore '+(opp.length+1),img:'',rate:v,pac:v,sho:v,pas:v,dri:v,def:v,phy:v}); }
  return opp;
}
function playMatchGo(){
  var f=nextFix(); if(!f){ newLeague(S.leagueName); f=nextFix(); }
  var r=ratings();
  if(r.n<11){ toast('Devi schierare 11 giocatori.'); ui.tab='squadra'; ui.sub='squadra'; render(); return; }
  if(!window.FM26||!window.FM26.start){ toast('Motore partita non disponibile.'); return; }
  var sl=slots(), users=[];
  for(var i=0;i<11;i++){
    var c=cardAt(i);
    users.push({name:c.name,img:c.img,rate:ovrOf(c),
      pac:statOf(c,'pac'),sho:statOf(c,'sho'),pas:statOf(c,'pas'),
      dri:statOf(c,'dri'),def:statOf(c,'def'),phy:statOf(c,'phy')});
  }
  var form=sl.map(function(s){ return {role:mapRole(s[0]),x:s[1],y:s[2]}; });
  var row=tabRow(f.opp), ostr=(row&&row.str)||78;
  hide();
  try{
    window.FM26.start({
      homeName:f.home?S.club:f.opp, awayName:f.home?f.opp:S.club,
      comp:S.leagueName||'Lega Ultimate', compShort:'UT', userSide:f.home?0:1,
      userTeam:{players:users,formation:form}, oppTeam:{players:oppSquad(f.opp,ostr),formation:form},
      userStr:Math.round(r.ovr), oppStr:ostr,
      kits:[{s:'#00d26a',sh:'#04180d'},{s:'#7ee8ff',sh:'#04121f'}], halfLen:180,
      onFinish:function(res){ finish(res.gfUser|0,res.gfOpp|0); },
      onAbandon:function(){ open(); }
    });
  }catch(e){ toast('Errore avvio partita.'); open(); }
}
function simMatch(){
  var f=nextFix(); if(!f) return;
  var r=ratings();
  if(r.n<11){ toast('Devi schierare 11 giocatori.'); return; }
  var row=tabRow(f.opp), diff=(r.ovr-((row&&row.str)||78))/7;
  finish(Math.max(0,Math.round(1.3+diff*0.6+Math.random()*2-0.7)),
         Math.max(0,Math.round(1.3-diff*0.6+Math.random()*2-0.7)));
}
function finish(gf,ga){
  var coins=110+(gf>ga?320:(gf===ga?120:0))+gf*25;
  var exp=35+(gf>ga?55:15)+gf*8;
  S.coins+=coins; S.exp+=exp;
  applyResult(gf,ga); save(); open();
  ui.tab='home'; render();
  setTimeout(function(){ toast('<b>'+gf+' - '+ga+'</b> \u00b7 +'+fmt(coins)+' monete \u00b7 +'+fmt(exp)+' EXP'); },400);
}

/* ----------------------------------------------------------------- eventi */
function cl(el,sel){ while(el&&el.nodeType===1){ if(el.matches&&el.matches(sel)) return el; el=el.parentElement; } return null; }
function bind(){
  var r=root();
  r.addEventListener('click',function(e){
    var t=e.target;
    var lg=cl(t,'[data-lg]'), nav=cl(t,'[data-t]'), t2=cl(t,'[data-t2]'), sub=cl(t,'[data-sub]');
    var act=cl(t,'[data-act]'), pk=cl(t,'[data-pack]'), inf=cl(t,'[data-info]');
    var frm=cl(t,'[data-form]'), c2=cl(t,'[data-card2]');
    var cst=cl(t,'[data-crest]'), byc=cl(t,'[data-buycrest]'), usc=cl(t,'[data-usecrest]');
    if(cst){ var cn=cst.getAttribute('data-crest'); setCrest(cn); S.crests=S.crests||{}; S.crests[cn]=1;
      save(); render(); toast('Stemma <b>'+esc2(cn)+'</b> applicato.'); return; }
    if(byc){
      var bn=byc.getAttribute('data-buycrest');
      var cc=allClubs().filter(function(x){ return x.n===bn; })[0];
      var pr=crestPrice(cc?cc.str:70);
      if(S.coins<pr){ toast('Servono altre '+fmt(pr-S.coins)+' monete.'); return; }
      S.coins-=pr; S.crests=S.crests||{}; S.crests[bn]=1; setCrest(bn,cc?cc.logo:'');
      save(); render(); toast('Stemma <b>'+esc2(bn)+'</b> acquistato e adottato.'); return;
    }
    if(usc){ var un=usc.getAttribute('data-usecrest');
      var uc=allClubs().filter(function(x){ return x.n===un; })[0];
      setCrest(un,uc?uc.logo:''); render(); toast('Stemma di <b>'+esc2(un)+'</b> applicato. La squadra resta <b>'+esc2(S.club)+'</b>.'); return; }
    if(lg){ var n=lg.getAttribute('data-lg'); newLeague(n==='__rnd'?null:n); save(); ui.tab='home'; render(); return; }
    if(inf){ var pi=PACKS.filter(function(x){ return x.k===inf.getAttribute('data-info'); })[0]; if(pi) mOdds(pi); return; }
    if(pk){ var p=PACKS.filter(function(x){ return x.k===pk.getAttribute('data-pack'); })[0]; if(p) runOpen(p); return; }
    var bd=cl(t,'[data-buy]'), mkb=cl(t,'[data-mkt]');
    if(bd){ mktBuy(parseInt(bd.getAttribute('data-buy'),10)); return; }
    if(mkb){
      var ma=mkb.getAttribute('data-mkt');
      if(ma==='more'){ ui.mkt.lim+=40; mktRefresh(); }
      else if(ma==='reset'){
        ui.mkt={q:'',ver:'',line:'',min:40,max:99,sort:'ovr',afford:false,lim:40};
        render(); toast('Filtri azzerati.');
      }
      return;
    }
    if(nav){ hideMenu(); ui.tab=nav.getAttribute('data-t'); ui.sel=null; render(); return; }
    if(t2){ ui.tab=t2.getAttribute('data-t2'); ui.sel=null; render(); return; }
    if(sub){ ui.sub=sub.getAttribute('data-sub'); render(); return; }
    if(frm){ S.form=frm.getAttribute('data-form'); save(); ui.sub='squadra'; render(); toast('Modulo: '+S.form); return; }
    var fhb=cl(t,'[data-fh]'), hro=cl(t,'[data-hero]'), tkb=cl(t,'[data-tk]');
    if(tkb){ tokBuy(tkb.getAttribute('data-tk')); return; }
    if(hro){ var hv=hro.getAttribute('data-hero');
      if(hv==='prev') heroGo(-1); else if(hv==='next') heroGo(1);
      else heroSet(parseInt(hv,10)||0); return; }
    if(fhb){
      var fk=fhb.getAttribute('data-fh');
      if(fk==='exit'){ close(); return; }
      if(fk==='acts'){ ui.actTab='daily'; actOpen(); }
      else if(fk==='evts'){ ui.actTab='evt'; actOpen(); }
      else if(fk==='objs'){ ui.actTab='obj'; actOpen(); }
      else if(fk==='play') playMatch();
      else if(fk==='journey'){ ui.tab='journey'; render(); }
      else if(fk==='shop'){ ui.tab='negozio'; render(); }
      else if(fk==='news') toast('<b>Novita\'</b> \u00b7 Scambio token attivo: vinci nel Journey, '+
        'spendi allo Scambio. Ricompense giornaliere spostate in Attivita\'.');
      else if(fk==='expinfo') toast('<b>EXP</b> \u00b7 fa salire il livello del profilo. '+
        'Sei al livello '+utLevel().lvl+'.');
      return;
    }
    var jnb=cl(t,'[data-jnm]'), jnc=cl(t,'[data-jnc]'), jns=cl(t,'[data-jnsel]'), dly=cl(t,'[data-daily]');
    if(dly){ dailyClaim(); return; }
    if(jns){ jnState().sc=parseInt(jns.getAttribute('data-jnsel'),10); ui.jnList=false; save(); render(); return; }
    if(jnc){ var jk=jnc.getAttribute('data-jnc'), JJ=jnState();
      if(jk==='prev') JJ.sc=Math.max(1,(JJ.sc||1)-1);
      else if(jk==='next') JJ.sc=Math.min(JN,(JJ.sc||1)+1);
      else if(jk==='list') ui.jnList=true;
      else if(jk==='close') ui.jnList=false;
      save(); render(); return; }
    if(jnb){ var jp=jnb.getAttribute('data-jnm').split('_'); jnPreview(parseInt(jp[0],10),parseInt(jp[1],10)); return; }
    if(c2){ cardAction(c2.getAttribute('data-card2')); return; }
    if(act){
      var a=act.getAttribute('data-act');
      if(a==='auto'){ autoFill(); save(); render(); toast('Formazione aggiornata.'); }
      else if(a==='coll'){ ui.tab='collezione'; render(); }
      else if(a==='play'){ playMatch(); }
      else if(a==='sim'){ simMatch(); }
      else if(a==='tomenu'){ close(); return; }
      else if(a==='rename'){ var nn=prompt('Nome del club:',S.club);
        if(nn){ S.club=nn.slice(0,22); if(S.league) S.league.tab[0].n=S.club; save(); render(); } }
      else if(a==='chlg'){ if(confirm('Cambiare campionato? La classifica riparte (le carte restano).')){
        S.league=null; S.leagueName=null; S.log=[]; save(); render(); } }
      else if(a==='redeem'){
        var el=document.getElementById('ut-code');
        var code=(el&&el.value||'').trim().toLowerCase();
        if(code==='unlisted'){
          S.dev=true; S.coins=999999999; S.exp=999999999; S.tokens=999999999;
          save(); render();
          toast('Codice accettato: monete, EXP e token illimitati, simulazione istantanea sbloccata.');
        } else if(!code){ toast('Inserisci un codice.'); }
        else { toast('Codice non valido.'); }
      }
      else if(a==='reroll'){ S.crestOffer=null; crestOffer(); render(); }
      else if(a==='crest'){ ui.tab='personalizza'; render(); }
      else if(a==='reset'){ if(confirm('Azzerare tutto?')){ S=blank(); save(); render(); } }
      return;
    }
    var el=cl(t,'.utc'); if(!el) return;
    var host=cl(el,'[data-slot]')||cl(el,'[data-bench]')||cl(el,'.ut-cslot');
    var where=host&&host.hasAttribute&&host.hasAttribute('data-slot')?'xi':
              (host&&host.hasAttribute&&host.hasAttribute('data-bench')?'bench':'coll');
    var idx=host?parseInt(host.getAttribute('data-slot')||host.getAttribute('data-bench')||'-1',10):-1;
    onCardTap(el,where,idx);
  });
  document.getElementById('ut-modal').addEventListener('click',function(e){
    var x=cl(e.target,'[data-x]'), a=cl(e.target,'[data-m2]');
    if(x){ document.getElementById('ut-modal').classList.remove('on'); return; }
    if(!a) return;
    var k=a.getAttribute('data-m2');
    if(k==='jnplay'){ jnPlay(); return; }
    if(!ui.mcard) return;
    var c=S.cards[ui.mcard]; if(!c) return;
    if(k==='upgrade') mUpgrade(c);
    else if(k==='enhance') mEnhance(c);
    else if(k==='dolvl'){ levelUp(c,1); mUpgrade(c); render(); }
    else if(k==='dolvl10'){ levelUp(c,10); mUpgrade(c); render(); }
    else if(k==='dostar'){
      if(!dupeList(c).length && typeof qxRunCard==='function' && qxGain(c)>0) qxRunCard(c);
      else starUp(c);
      mEnhance(c); render(); }
    else if(k==='dostarall'){ qxRunCard(c); mEnhance(c); }
    else if(k==='jnplay'){ jnPlay(); }
  });
  r.addEventListener('input',function(e){
    var id=e.target&&e.target.id; if(!id) return;
    if(id==='mkt-q'){ ui.mkt.q=e.target.value; ui.mkt.lim=40; mktRefresh(); }
    else if(id==='mkt-min'){
      ui.mkt.min=Math.max(40,Math.min(99,parseInt(e.target.value||'40',10)||40));
      ui.mkt.lim=40; mktRefresh();
    } else if(id==='mkt-max'){
      ui.mkt.max=Math.max(40,Math.min(99,parseInt(e.target.value||'99',10)||99));
      ui.mkt.lim=40; mktRefresh();
    }
  });
  r.addEventListener('change',function(e){
    var id=e.target&&e.target.id; if(!id) return;
    if(id==='mkt-ver'){ ui.mkt.ver=e.target.value; ui.mkt.lim=40; mktRefresh(); }
    else if(id==='mkt-line'){ ui.mkt.line=e.target.value; ui.mkt.lim=40; mktRefresh(); }
    else if(id==='mkt-sort'){ ui.mkt.sort=e.target.value; ui.mkt.lim=40; mktRefresh(); }
    else if(id==='mkt-aff'){ ui.mkt.afford=!!e.target.checked; ui.mkt.lim=40; mktRefresh(); }
  });
  window.addEventListener('resize',function(){ if(ui.tab==='squadra') fitPitch(); });
}

/* ------------------------------------------- trascina per sostituire (AAA) */
function dndRef(h){
  var isXi=h.hasAttribute('data-slot');
  return {t:isXi?'xi':'bench',
          i:parseInt(h.getAttribute(isXi?'data-slot':'data-bench')||'-1',10)};
}
function dndClear(){
  ui.drag=null;
  var n=document.querySelectorAll('.dz,.over,.dragging');
  for(var i=0;i<n.length;i++){
    n[i].classList.remove('dz'); n[i].classList.remove('over'); n[i].classList.remove('dragging');
  }
}
function bindDnD(){
  var host=document.querySelector('.ut-lineup');
  if(!host||host.getAttribute('data-dnd')==='1') return;
  host.setAttribute('data-dnd','1');
  host.addEventListener('dragstart',function(e){
    var h=cl(e.target,'[data-slot]')||cl(e.target,'[data-bench]'); if(!h) return;
    var ref=dndRef(h); if(ref.i<0) return;
    ui.drag=ref; hideMenu();
    h.classList.add('dragging');
    var z=host.querySelectorAll('[data-slot],[data-bench]');
    for(var i=0;i<z.length;i++) if(z[i]!==h) z[i].classList.add('dz');
    try{ e.dataTransfer.setData('text/plain',ref.t+':'+ref.i);
         e.dataTransfer.effectAllowed='move'; }catch(err){}
  });
  host.addEventListener('dragend',function(){ dndClear(); });
  host.addEventListener('dragover',function(e){
    if(!ui.drag) return;
    var h=cl(e.target,'[data-slot]')||cl(e.target,'[data-bench]'); if(!h) return;
    e.preventDefault();
    try{ e.dataTransfer.dropEffect='move'; }catch(err){}
    var cur=host.querySelector('.over');
    if(cur&&cur!==h) cur.classList.remove('over');
    h.classList.add('over');
  });
  host.addEventListener('dragleave',function(e){
    var h=cl(e.target,'[data-slot]')||cl(e.target,'[data-bench]');
    if(h) h.classList.remove('over');
  });
  host.addEventListener('drop',function(e){
    if(!ui.drag) return;
    var h=cl(e.target,'[data-slot]')||cl(e.target,'[data-bench]'); if(!h) return;
    e.preventDefault();
    var from=ui.drag, to=dndRef(h);
    dndClear();
    if(to.i<0||(to.t===from.t&&to.i===from.i)) return;
    doSwap(from,to);
    ui.sel=null; save(); render();
    toast('Giocatori scambiati.');
  });
}
function hideMenu(){
  var m=document.getElementById('ut-menu'); if(m) m.classList.remove('on');
  var k=document.getElementById('ut-mask'); if(k) k.classList.remove('on');
  var a=document.querySelector('.utc.act'); if(a) a.classList.remove('act');
  ui.menuFor=null;
}
function showMenu(el,c,where,idx){
  var m=document.getElementById('ut-menu');
  var d=dupeList(c).length;
  m.innerHTML='<button data-m="details">Dettagli</button>'+
    '<button data-m="compare">Confronta</button>'+
    '<button data-m="upgrade">Potenzia</button>'+
    '<button data-m="enhance"'+((d||(typeof qxGain==='function'&&qxGain(c)>0))?'':' class="dim"')+'>Fondi'+(d?' ('+d+')':'')+'</button>'+
    (where!=='coll'?'<button data-m="move">Sposta</button><button data-m="remove">Togli</button>':'');
  ui.menuFor={card:c.id,where:where,idx:idx};
  m.classList.add('on');
  document.getElementById('ut-mask').classList.add('on');
  el.classList.add('act');
  var r=el.getBoundingClientRect(), mw=170, mh=m.offsetHeight||240;
  var x=r.right+10, y=r.top+r.height/2-mh/2;
  if(x+mw>window.innerWidth-8) x=r.left-mw-10;
  if(x<8) x=Math.max(8,r.left+r.width/2-mw/2);
  y=Math.max(8,Math.min(window.innerHeight-mh-8,y));
  m.style.left=Math.round(x)+'px'; m.style.top=Math.round(y)+'px';
}
function onCardTap(el,where,idx){
  var id=el.getAttribute('data-card');
  if(!id){
    if(ui.sel&&(where==='xi'||where==='bench')){ doSwap(ui.sel,{t:where,i:idx}); ui.sel=null; render(); return; }
    if(where!=='coll'){ ui.pending={where:where,idx:idx}; ui.tab='collezione'; render(); }
    return;
  }
  if(ui.pending&&where==='coll'){
    var s=slotRef(ui.pending.where,ui.pending.idx);
    var already=inSquad(keyOf(S.cards[id]),ui.pending.where,ui.pending.idx);
    if(already){ toast(sur2(S.cards[id].name)+' e\' gia\' in rosa: non puoi schierarne due.');
      ui.pending=null; ui.tab='squadra'; ui.sub='squadra'; render(); return; }
    if(s){ clearFromSquad(id); s.set(id); save(); }
    ui.pending=null; ui.tab='squadra'; ui.sub='squadra'; render(); return;
  }
  if(ui.sel&&(where==='xi'||where==='bench')){
    if(ui.sel.t===where&&ui.sel.i===idx){ ui.sel=null; render(); return; }
    doSwap(ui.sel,{t:where,i:idx}); ui.sel=null; render(); toast('Giocatori scambiati.'); return;
  }
  var now=Date.now(), dbl=(ui.lastId===id&&now-ui.lastTap<340);
  ui.lastTap=now; ui.lastId=id;
  if(dbl&&(where==='xi'||where==='bench')){
    hideMenu(); ui.sel={t:where,i:idx}; ui.view=id; render();
    toast('Selezionato: tocca un altro per scambiare.'); return;
  }
  ui.view=id;
  showMenu(el,S.cards[id],where,idx);
}
function cardAction(k){
  var c=ui.view?S.cards[ui.view]:null; if(!c) return;
  if(k==='details') mDetails(c);
  else if(k==='compare') mCompare(c);
  else if(k==='upgrade') mUpgrade(c);
  else if(k==='enhance') mEnhance(c);
  else if(k==='swap'){ var w=findCard(c.id);
    if(w){ ui.sel=w; render(); toast('Selezionato: tocca un altro per scambiare.'); } else toast('Non e\' in rosa.'); }
  else if(k==='remove'){ var w2=findCard(c.id);
    if(w2){ slotRef(w2.t,w2.i).set(null); ui.view=null; save(); render(); } }
}
function findCard(id){
  for(var i=0;i<S.xi.length;i++) if(S.xi[i]===id) return {t:'xi',i:i};
  for(var j=0;j<S.bench.length;j++) if(S.bench[j]===id) return {t:'bench',i:j};
  return null;
}
function clearFromSquad(id){
  for(var i=0;i<S.xi.length;i++) if(S.xi[i]===id) S.xi[i]=null;
  for(var j=0;j<S.bench.length;j++) if(S.bench[j]===id) S.bench[j]=null;
}
function levelUp(c,n){
  var done=0;
  for(var i=0;i<n;i++){
    if(c.lvl>=MAX_LVL) break;
    var cost=lvlCost(c.lvl);
    if(S.exp<cost) break;
    S.exp-=cost; c.lvl++; done++;
  }
  save();
  toast(done?('+'+done+' livello'+(done>1?'i':'')+' \u00b7 overall '+ovrOf(c)):'EXP insufficiente.');
}
function starUp(c){
  if(c.red){ toast('Grado massimo: sei stelle rosse.'); return; }
  var d=dupeList(c);
  if(!d.length){
    toast('Serve un\'altra copia di '+esc2(sur2(c.name))+' '+VER[c.ver].nm+
          ' con '+(c.stars|0)+' stelle'+(c.stars>=6?' (per le rosse servono due carte a 6 stelle)':'')+'.');
    return;
  }
  clearFromSquad(d[0].id); delete S.cards[d[0].id];
  if(c.stars>=6){ c.red=true; toast('SEI STELLE ROSSE! Overall '+ovrOf(c)); }
  else { c.stars++; toast('+1 stella \u00b7 ora '+c.stars+'/6 \u00b7 overall '+ovrOf(c)); }
  save();
}

/* --------------------------------------------------------------------------
   ROSA INIZIALE: solo carte BRONZE, ma un giocatore adatto per ogni ruolo
   del modulo (portiere, TD, TS, DC, centrocampisti, ali, attaccante).
   -------------------------------------------------------------------------- */
var SLOT_OK={
  GK:['POR','GK'],
  LB:['TS','LB'], CB:['DC','CB'], RB:['TD','RB'],
  CM:['CC','CDC','COC','CM','CDM','CAM'],
  LM:['CC','AS','LM','CM'], RM:['CC','AD','RM','CM'],
  LW:['AS','LW','LM'], RW:['AD','RW','RM'],
  ST:['ATT','ST','SS']
};
function bronzePool(){
  if(window.__bzPool) return window.__bzPool;
  var P=buildPool()||[], out=[];
  for(var i=0;i<P.length;i++){
    var r=P[i].rate;
    if(r<=64&&r>=38) out.push(P[i]);          /* la banda bronze del gioco */
  }
  if(!out.length) out=poolBand(40,64)||[];
  window.__bzPool=out;
  return out;
}
function isGkPl(p){
  var rs=p.roles||[];
  for(var i=0;i<rs.length;i++){ var r=String(rs[i]).toUpperCase(); if(r==='POR'||r==='GK') return true; }
  return false;
}
function pickBronze(pool,used,slot){
  var ok=SLOT_OK[slot]||[], cand=[], i, j;
  for(i=0;i<pool.length;i++){
    var p=pool[i]; if(used[p.name]) continue;
    var rs=p.roles||[];
    for(j=0;j<rs.length;j++)
      if(ok.indexOf(String(rs[j]).toUpperCase())>=0){ cand.push(p); break; }
  }
  if(!cand.length){                            /* ripiego: nessun ruolo vuoto */
    var wantGk=(slot==='GK');
    for(i=0;i<pool.length;i++){
      var q=pool[i]; if(used[q.name]) continue;
      if(isGkPl(q)===wantGk) cand.push(q);
    }
  }
  if(!cand.length) return null;
  return cand[Math.floor(Math.random()*cand.length)];
}
function seedStarter(){
  var pool=bronzePool();
  if(!pool.length) return;
  var sl=(FORMS[S.form]||FORMS['4-3-3']), used={}, i, p, c;
  S.xi=new Array(11).fill(null);
  S.bench=new Array(7).fill(null);
  for(i=0;i<11;i++){
    p=pickBronze(pool,used,sl[i][0]);
    if(!p) continue;
    used[p.name]=1;
    c=newCard(p,'bronze');
    if(c.base>64) c.base=64;
    S.xi[i]=c.id;
  }
  var bench=['GK','CB','LB','RB','CM','LW','ST'];
  for(i=0;i<7;i++){
    p=pickBronze(pool,used,bench[i]);
    if(!p) continue;
    used[p.name]=1;
    c=newCard(p,'bronze');
    if(c.base>64) c.base=64;
    S.bench[i]=c.id;
  }
}

/* ----------------------------------------- nome della squadra (dopo l'username) */
function viewTeamName(){
  var sug=S.crestClub||S.club||'';
  return '<div class="ut-pick"><div class="ut-pickh">Dai un nome alla tua squadra</div>'+
    '<div class="ut-note">Questo nome ti accompagnera\' per sempre: non cambiera\' nemmeno quando '+
    'acquisterai nuovi stemmi nel negozio.</div>'+
    '<div class="ut-userbox">'+
      '<input id="ut-tname" maxlength="22" placeholder="es. '+esc2(sug||'Atletico Santana')+'" autocomplete="off">'+
      '<div id="ut-thint" class="ut-note">Da 3 a 22 caratteri.</div>'+
      '<button id="ut-tok" class="ut-act">Conferma</button>'+
    '</div></div>';
}
function bindTeamName(){
  var inp=document.getElementById('ut-tname'), btn=document.getElementById('ut-tok'),
      hint=document.getElementById('ut-thint');
  if(!inp||!btn) return;
  function go(){
    var v=(inp.value||'').trim().replace(/\s+/g,' ');
    if(v.length<3){ hint.textContent='Servono almeno 3 caratteri.'; hint.style.color='#ff9c98'; return; }
    S.tname=v; S.club=v;
    if(S.league&&S.league.tab&&S.league.tab[0]) S.league.tab[0].n=v;
    save(); render();
    toast('La tua squadra si chiama <b>'+esc2(v)+'</b>.');
  }
  btn.addEventListener('click',go);
  inp.addEventListener('keydown',function(e){ if(e.key==='Enter') go(); });
  setTimeout(function(){ try{ inp.focus(); }catch(e){} },60);
}


/* ============================================================================
   ROUND 5 — schermo intero, HUD valute sempre visibile, obiettivi riscattabili,
   Scambio token ricostruito con le buste come al negozio.
   Queste dichiarazioni sono volutamente le ULTIME del file: sostituiscono le
   versioni precedenti di viewExchange / actObjHTML / TOKSHOP / playMatch.
   ========================================================================== */
var BNART='data:image/jpeg;base64,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';

/* ------------------------------------------------------- schermo intero */
function fsFn(){ var e=document.documentElement;
  return e.requestFullscreen||e.webkitRequestFullscreen||e.msRequestFullscreen||null; }
function fsNow(){ var e=document.documentElement, f=fsFn();
  try{ if(f) f.call(e); }catch(err){} }
function fsOn(){ return !!(document.fullscreenElement||document.webkitFullscreenElement); }
function fsAsk(go){
  if(!fsFn()||fsOn()||S.fsSkip){ go(); return; }
  var d=document.getElementById('ut-fsq');
  if(!d){ d=document.createElement('div'); d.id='ut-fsq'; document.body.appendChild(d); }
  d.innerHTML='<div class="fsq-box">'+
    '<span class="fsq-ic">\u26f6</span>'+
    '<h3>SCHERMO INTERO</h3>'+
    '<p>Vuoi giocare a tutto schermo? La partita e\' pensata per il fullscreen: '+
      'campo piu\' grande, HUD piu\' leggibile, nessuna distrazione.</p>'+
    '<div class="fsq-row">'+
      '<button class="fsq-y" data-fsq="y">GIOCA A TUTTO SCHERMO</button>'+
      '<button class="fsq-n" data-fsq="n">Continua in finestra</button>'+
    '</div>'+
    '<label class="fsq-chk"><input type="checkbox" id="fsq-skip"> Non chiedermelo piu\'</label>'+
  '</div>';
  d.classList.add('on');
  d.onclick=function(e){
    var b=cl(e.target,'[data-fsq]'); if(!b) return;
    var k=b.getAttribute('data-fsq');
    var sk=document.getElementById('fsq-skip');
    if(sk&&sk.checked){ S.fsSkip=true; save(); }
    d.classList.remove('on');
    if(k==='y') fsNow();
    setTimeout(go,k==='y'?320:70);
  };
}
function playMatch(){ fsAsk(playMatchGo); }
function jnPlay(){ fsAsk(jnPlayGo); }

/* --------------------------------------------- HUD valute (ogni sezione) */
function hudSync(){
  var h=document.getElementById('ut-hud'); if(!h) return;
  var ready=!!(S.club&&(S.leagueName||S.league)&&S.user&&S.tname);
  var on=ready&&ui.tab!=='home';
  h.className='ut-hud'+(on?' on':'');
  if(!on){ h.innerHTML=''; return; }
  var lv=utLevel();
  h.innerHTML='<span class="uh-lv" title="Livello manager"><b>'+lv.lvl+'</b>'+
      '<i style="width:'+lv.pct+'%"></i></span>'+
    '<button class="uh-c coin" data-t2="negozio" title="Monete"><i></i><b>'+fmt(S.coins)+'</b></button>'+
    '<button class="uh-c exp" data-fh="expinfo" title="Esperienza"><i></i><b>'+fmt(S.exp)+'</b></button>'+
    '<button class="uh-c tok" data-t2="scambio" title="Token"><i></i><b>'+fmt(S.tokens|0)+'</b></button>';
}
function utAnim(el){
  if(!el) return;
  el.classList.remove('ut-in');
  void el.offsetWidth;
  el.classList.add('ut-in');
}

/* ============================================================================
   OBIETTIVI — 27 traguardi, tutti su contatori reali, ricompensa DA RISCATTARE.
   ========================================================================== */
var OBJS=[
  {id:'c40', cat:'Collezione', ic:'badge', m:'cards', g:40,
   n:'Colleziona 40 carte', d:'Riempi il club con 40 giocatori diversi.', rw:{coin:4000,exp:500}},
  {id:'c90', cat:'Collezione', ic:'badge', m:'cards', g:90,
   n:'Colleziona 90 carte', d:'Un club vero ha panchina e alternative.', rw:{coin:12000,tok:4}},
  {id:'c180',cat:'Collezione', ic:'badge', m:'cards', g:180,
   n:'Colleziona 180 carte', d:'Da collezionista assoluto.', rw:{coin:30000,tok:10}},
  {id:'nat20',cat:'Collezione',ic:'feat', m:'nat', g:20,
   n:'20 nazioni diverse', d:'Costruisci un club internazionale.', rw:{coin:20000,tok:7}},
  {id:'star5',cat:'Collezione',ic:'quest',m:'stars', g:5,
   n:'5 carte potenziate', d:'Fondi i doppioni e potenzia cinque giocatori.', rw:{coin:24000,tok:8}},

  {id:'xi',   cat:'Qualita\' squadra', ic:'quest', m:'xi', g:11,
   n:'Undici completo', d:'Nessuno slot vuoto in formazione.', rw:{coin:1500,exp:250}},
  {id:'ovr76',cat:'Qualita\' squadra', ic:'pass', m:'ovr', g:76,
   n:'Media squadra 76', d:'Alza il livello medio dell\'undici titolare.', rw:{coin:5000,exp:800}},
  {id:'ovr82',cat:'Qualita\' squadra', ic:'pass', m:'ovr', g:82,
   n:'Media squadra 82', d:'Da squadra di alta classifica.', rw:{coin:14000,tok:5}},
  {id:'ovr87',cat:'Qualita\' squadra', ic:'pass', m:'ovr', g:87,
   n:'Media squadra 87', d:'Solo undici da Champions arrivano qui.', rw:{coin:40000,tok:14}},
  {id:'ovr91',cat:'Qualita\' squadra', ic:'pass', m:'ovr', g:91,
   n:'Media squadra 91', d:'Il muro finale: undici di sole stelle.', rw:{tok:30,pack:'legends1'}},
  {id:'e90',  cat:'Qualita\' squadra', ic:'feat', m:'n90', g:3,
   n:'3 carte da 90+', d:'Tre fenomeni in rosa.', rw:{coin:22000,tok:8}},

  {id:'w10', cat:'Campionato', ic:'league', m:'wins', g:10,
   n:'Vinci 10 partite di lega', d:'Metti in fila dieci vittorie stagionali.', rw:{coin:8000,exp:1200}},
  {id:'w25', cat:'Campionato', ic:'league', m:'wins', g:25,
   n:'Vinci 25 partite di lega', d:'Costanza da titolo.', rw:{coin:20000,tok:6}},
  {id:'w60', cat:'Campionato', ic:'league', m:'wins', g:60,
   n:'Vinci 60 partite di lega', d:'Un ciclo vincente vero.', rw:{coin:55000,tok:18}},
  {id:'lvl20',cat:'Campionato', ic:'time', m:'lvl', g:20,
   n:'Livello manager 20', d:'Accumula EXP giocando ovunque.', rw:{coin:16000,tok:5}},
  {id:'lvl45',cat:'Campionato', ic:'time', m:'lvl', g:45,
   n:'Livello manager 45', d:'Carriera lunga e vincente.', rw:{coin:60000,tok:20}},

  {id:'jn20', cat:'Pitch Journey', ic:'time', m:'jn', g:20,
   n:'Vinci 20 sfide Journey', d:'I primi passi nel percorso.', rw:{coin:9000,tok:3}},
  {id:'jn120',cat:'Pitch Journey', ic:'time', m:'jn', g:120,
   n:'Vinci 120 sfide Journey', d:'Un ottavo del percorso completo.', rw:{coin:26000,tok:9}},
  {id:'jn400',cat:'Pitch Journey', ic:'time', m:'jn', g:400,
   n:'Vinci 400 sfide Journey', d:'Oltre la meta\' della strada.', rw:{coin:70000,tok:22}},
  {id:'jn900',cat:'Pitch Journey', ic:'time', m:'jn', g:900,
   n:'Vinci tutte le 900 sfide', d:'Il traguardo definitivo del Journey.', rw:{tok:60,pack:'legendsmax'}},
  {id:'sc3',  cat:'Pitch Journey', ic:'quest', m:'sc', g:3,
   n:'Completa 3 scenari', d:'Tre scenari chiusi al 30/30.', rw:{coin:15000,tok:5}},
  {id:'sc12', cat:'Pitch Journey', ic:'quest', m:'sc', g:12,
   n:'Completa 12 scenari', d:'Metti in cassaforte dodici scenari.', rw:{coin:45000,tok:16}},
  {id:'sc30', cat:'Pitch Journey', ic:'quest', m:'sc', g:30,
   n:'Completa tutti i 30 scenari', d:'Percorso perfetto.', rw:{tok:45}},

  {id:'leg1', cat:'Icone & Mondiali', ic:'badge', m:'leg', g:1,
   n:'Prima icona nel club', d:'Porta a casa una leggenda.', rw:{coin:10000,exp:1500}},
  {id:'leg8', cat:'Icone & Mondiali', ic:'badge', m:'leg', g:8,
   n:'8 icone nel club', d:'Una sala dei trofei che si riempie.', rw:{coin:35000,tok:12}},
  {id:'leg25',cat:'Icone & Mondiali', ic:'badge', m:'leg', g:25,
   n:'25 icone nel club', d:'La collezione dei sogni.', rw:{tok:40}},
  {id:'wc5',  cat:'Icone & Mondiali', ic:'feat', m:'wc', g:5,
   n:'5 carte World Cup', d:'Cinque protagonisti dei Mondiali.', rw:{coin:18000,tok:6}},
  {id:'wc18', cat:'Icone & Mondiali', ic:'feat', m:'wc', g:18,
   n:'18 carte World Cup', d:'Quasi tutto il bacino mondiale.', rw:{coin:50000,tok:20}}
];
function cVer(c){ return String(c&&(c.ver||c.v||c.art||'')||''); }
function objVal(m){
  var all=[],k,i,c,n=0;
  for(k in S.cards) all.push(S.cards[k]);
  if(m==='cards') return all.length;
  if(m==='ovr'){ var r=ratings(); return r.n>=11?r.ovr:0; }
  if(m==='xi') return ratings().n;
  if(m==='wins'){ var me=tabRow(S.club); return me?(me.w|0):0; }
  if(m==='jn') return jnTotDone();
  if(m==='sc'){ for(i=1;i<=JN;i++) if(jnProg(i)>=JM) n++; return n; }
  if(m==='lvl') return utLevel().lvl;
  if(m==='leg'){ for(i=0;i<all.length;i++) if(cVer(all[i])==='legends') n++; return n; }
  if(m==='wc'){ for(i=0;i<all.length;i++) if(cVer(all[i])==='worldcup') n++; return n; }
  if(m==='n90'){ for(i=0;i<all.length;i++) if(ovrOf(all[i])>=90) n++; return n; }
  if(m==='stars'){ for(i=0;i<all.length;i++) if((all[i].stars|0)>0) n++; return n; }
  if(m==='nat'){ var seen={}; for(i=0;i<all.length;i++){ c=String(all[i].nat||all[i].nation||'');
      if(c&&!seen[c]){ seen[c]=1; n++; } } return n; }
  return 0;
}
function objClaimed(id){ return !!(S.objc&&S.objc[id]); }
function objReady(){ var i,n=0; for(i=0;i<OBJS.length;i++)
    if(!objClaimed(OBJS[i].id)&&objVal(OBJS[i].m)>=OBJS[i].g) n++; return n; }
function objRw(rw){
  var s='';
  if(rw.coin) s+='<span class="ac-chip coin"><i></i>'+fmt(rw.coin)+'</span>';
  if(rw.exp)  s+='<span class="ac-chip exp"><i></i>'+fmt(rw.exp)+'</span>';
  if(rw.tok)  s+='<span class="ac-chip tok"><i></i>'+rw.tok+'</span>';
  if(rw.pack){ var p=packByKey(rw.pack);
    s+='<span class="ac-chip pack"><i></i>'+esc2(p?p.nm:'Busta')+'</span>'; }
  return s;
}
function objClaim(id){
  var o=null,i;
  for(i=0;i<OBJS.length;i++) if(OBJS[i].id===id) o=OBJS[i];
  if(!o) return;
  if(objClaimed(id)){ toast('Ricompensa gia\' riscattata.'); return; }
  var v=objVal(o.m);
  if(v<o.g){ toast('Obiettivo incompleto: '+v+'/'+o.g+'.'); return; }
  if(!S.objc) S.objc={};
  S.objc[id]=1;
  var msg=[];
  if(o.rw.coin){ S.coins=(S.coins|0)+o.rw.coin; msg.push('+'+fmt(o.rw.coin)+' monete'); }
  if(o.rw.exp){ S.exp=(S.exp|0)+o.rw.exp; msg.push('+'+fmt(o.rw.exp)+' EXP'); }
  if(o.rw.tok){ S.tokens=(S.tokens|0)+o.rw.tok; msg.push('+'+o.rw.tok+' token'); }
  var got=null;
  if(o.rw.pack){ var pk=packByKey(o.rw.pack); if(pk){ got=openPack(pk);
      msg.push(got.length+' cart'+(got.length===1?'a':'e')); } }
  save(); render();
  if(got){
    actClose();
    var cds=got.map(function(c){ return '<div class="ut-mini">'+cardHTML(c)+'</div>'; }).join('');
    modal('<div class="ut-mh"><h3>'+esc2(o.n)+'</h3><button data-x="1">\u00d7</button></div>'+
      '<div class="ut-note">Obiettivo completato. Ricompensa riscattata.</div>'+
      '<div class="ut-top4">'+cds+'</div>');
  } else { actOpen(); }
  toast('Riscattato \u00b7 '+msg.join(' \u00b7 '));
}
function actObjHTML(){
  var cats=[], byCat={}, i;
  for(i=0;i<OBJS.length;i++){
    var o=OBJS[i];
    if(!byCat[o.cat]){ byCat[o.cat]=[]; cats.push(o.cat); }
    byCat[o.cat].push(o);
  }
  var tot=OBJS.length, done=0;
  for(i=0;i<OBJS.length;i++) if(objClaimed(OBJS[i].id)) done++;
  var secs=cats.map(function(ct){
    var rows=byCat[ct].map(function(o){
      var v=objVal(o.m), full=v>=o.g, cl2=objClaimed(o.id);
      var pct=Math.max(0,Math.min(100,Math.round(v/o.g*100)));
      var st=cl2?' done':(full?' ready':'');
      var btn=cl2?'<span class="ob-cl">\u2713 RISCATTATO</span>'
                 :(full?'<button class="ob-b" data-obj="'+o.id+'">RISCATTA</button>'
                       :'<span class="ob-lock">'+pct+'%</span>');
      return '<div class="ob-row'+st+'">'+
        '<div class="ob-ic">'+(FHI[o.ic]||FHI.badge)+'</div>'+
        '<div class="ob-tx"><b>'+esc2(o.n)+'</b><p>'+esc2(o.d)+'</p>'+
          '<div class="ob-bar"><i style="width:'+pct+'%"></i>'+
            '<em>'+fmt(Math.min(v,o.g))+' / '+fmt(o.g)+'</em></div></div>'+
        '<div class="ob-rw">'+objRw(o.rw)+btn+'</div>'+
      '</div>';
    }).join('');
    return '<div class="ob-sec"><h5>'+esc2(ct)+'</h5><div class="ob-list">'+rows+'</div></div>';
  }).join('');
  return '<div class="ac-sec ob-wrap">'+
    '<div class="ob-head"><div><b>Obiettivi del club</b>'+
      '<span>'+done+' di '+tot+' riscattati \u00b7 la ricompensa va sempre riscattata a mano</span></div>'+
      '<div class="ob-prog"><i style="width:'+Math.round(done/tot*100)+'%"></i></div></div>'+
    secs+'</div>';
}

/* ============================================================================
   SCAMBIO TOKEN — ricostruito: le buste hanno la stessa presentazione del
   negozio (artwork, chip, probabilita'), prezzo in token e risparmio in monete.
   ========================================================================== */
var TOKSHOP=[
  {k:'tk_gold',   cost:9,  nm:'Oro Raro',           tag:'',
   d:'Quattro carte oro con overall minimo 81, nessun riempitivo.', pack:'oro81'},
  {k:'tk_spec',   cost:16, nm:'Special Edition',    tag:'',
   d:'Tre carte Special (+2 overall) tutte da 84 in su.', pack:'special'},
  {k:'tk_spec2',  cost:27, nm:'Eternal', tag:'NUOVA',
   d:'Tre carte della nuova collezione Eternal (+4 overall), telaio dedicato.', pack:'special2'},
  {k:'tk_wc',     cost:24, nm:'World Cup 2026',     tag:'RARA',
   d:'Tre carte World Cup dal bacino chiuso dei protagonisti del torneo.', pack:'worldcup'},
  {k:'tk_leg',    cost:22, nm:'Legends Singola',    tag:'RARA',
   d:'Una icona garantita, estratta dalle 100 leggende del gioco.', pack:'legends1'},
  {k:'tk_legmax', cost:95, nm:'Legends Ultimate',   tag:'LEGGENDARIA',
   d:'Tre icone in un colpo solo: il contenuto piu\' pregiato del club.', pack:'legendsmax'},
  {k:'tk_coins',  cost:10, nm:'Conversione monete', tag:'',
   d:'Trasforma 10 token in 12.000 monete: il cambio ufficiale del club.', coins:12000},
  {k:'tk_exp',    cost:12, nm:'Boost esperienza',   tag:'',
   d:'6.000 EXP immediati per far salire di livello il profilo manager.', exp:6000}
];
function tkArtFor(it){
  var p=it.pack?tokPackFor(it):null;
  if(p) return p;
  return null;
}
function tokPackCard(it){
  var t=S.tokens|0, can=t>=it.cost;
  var p=tkArtFor(it);
  var art=p?p.art:(it.coins?'gold':'silver');
  var sub=p?String(p.sub||''):(it.coins?'MONETE':'EXP');
  var sc=sub.length>8?' lng2':(sub.length>5?' lng':'');
  var big=p?(p.n+(p.n===1?' carta':' carte')):(it.coins?fmt(it.coins)+' monete':fmt(it.exp)+' EXP');
  var chips='<div class="ut-pmeta">';
  if(p){
    chips+='<span class="pm t-'+p.art+'">'+esc2(VER[p.rar]?VER[p.rar].nm:p.art)+'</span>'+
      '<span class="pm">'+p.n+(p.n===1?' carta':' carte')+'</span>'+
      (p.min?'<span class="pm">min '+p.min+' OVR</span>':'');
    if(p.cost) chips+='<span class="pm save">vale '+fmt(p.cost)+' monete</span>';
  } else chips+='<span class="pm t-gold">conversione</span><span class="pm">immediata</span>';
  chips+='</div>';
  return '<div class="ut-pack tkp v-'+art+(can?'':' off')+'">'+
    (it.tag?'<span class="tkp-tag">'+esc2(it.tag)+'</span>':'')+
    (p?'<button class="ut-info" data-info="'+p.k+'">i</button>':'')+
    '<div class="ut-packart" style="background-image:url('+(FR[art]||'')+')">'+
      '<div class="pa-sub'+sc+'">'+esc2(sub)+'</div>'+
      '<div class="pa-n">'+big+'</div></div>'+
    '<div class="ut-pinfo"><h4>'+esc2(it.nm)+'</h4>'+chips+
      '<p>'+esc2(it.d)+'</p>'+
      '<div class="tkp-foot">'+
        '<span class="tkp-price'+(can?'':' no')+'"><i></i><b>'+it.cost+'</b></span>'+
        '<button class="ut-buy tkb'+(can?'':' no')+'" data-tk="'+it.k+'">'+
          (can?'SCAMBIA':'-'+(it.cost-t)+' token')+'</button>'+
      '</div></div>'+
  '</div>';
}
function viewExchange(){
  var t=S.tokens|0;
  var buste=[], conv=[], i;
  for(i=0;i<TOKSHOP.length;i++) (TOKSHOP[i].pack?buste:conv).push(TOKSHOP[i]);
  var cheapest=999999;
  for(i=0;i<TOKSHOP.length;i++) if(TOKSHOP[i].cost<cheapest) cheapest=TOKSHOP[i].cost;
  return '<div class="tk2">'+
    '<div class="tk2-hero">'+
      '<div class="tk2-glow"></div>'+
      '<div class="tk2-hl">'+
        '<span class="tk2-kick">VALUTA D\'ELITE</span>'+
        '<h2>SCAMBIO</h2>'+
        '<p>Il token non si compra con le monete: si guadagna solo <b>vincendo per la '+
        'prima volta</b> alcune sfide del Pitch Journey e <b>riscattando gli obiettivi</b>. '+
        'Qui si trasforma in contenuti che le monete non possono raggiungere.</p>'+
        '<div class="tk2-kpi">'+
          '<div><b>'+fmt(t)+'</b><small>token disponibili</small></div>'+
          '<div><b>'+(t>=cheapest?'S\u00cc':'NO')+'</b><small>puoi scambiare ora</small></div>'+
          '<div><b>1 : 1.200</b><small>valore in monete</small></div>'+
        '</div>'+
      '</div>'+
      '<div class="tk2-bal"><span class="tk2-tok"></span><b>'+fmt(t)+'</b><small>TOKEN</small></div>'+
    '</div>'+
    '<div class="tk2-how">'+
      '<div class="tk2-c"><em>01</em><b>Journey</b><span>Solo alcune sfide pagano token, '+
        'e solo alla prima vittoria: da 1 a 9 in base alla difficolta\'.</span></div>'+
      '<div class="tk2-c"><em>02</em><b>Obiettivi</b><span>27 traguardi del club: molti '+
        'pagano token, ma vanno riscattati a mano nel pannello Attivita\'.</span></div>'+
      '<div class="tk2-c"><em>03</em><b>Nessun\'altra fonte</b><span>Non esistono token '+
        'gratuiti ne\' acquistabili: ogni token e\' una vittoria vera.</span></div>'+
    '</div>'+
    '<div class="tk2-sh"><h4>BUSTE ESCLUSIVE <em>'+buste.length+'</em></h4>'+
      '<p>Stesse buste del negozio, pagate in token: nessuna richiede monete.</p></div>'+
    '<div class="ut-shop tk2-grid">'+buste.map(tokPackCard).join('')+'</div>'+
    '<div class="tk2-sh"><h4>CONVERSIONI <em>'+conv.length+'</em></h4>'+
      '<p>Se ti servono monete o esperienza subito, il token si converte al cambio ufficiale.</p></div>'+
    '<div class="ut-shop tk2-grid">'+conv.map(tokPackCard).join('')+'</div>'+
  '</div>';
}

/* ==================================================================
   ROUND 6 - correzioni: animazioni per sezione, barra profilo in ogni
   schermata, popup schermo intero sul GIOCA del menu principale.
   Queste dichiarazioni sostituiscono quelle precedenti (ultime vincono).
   ================================================================== */

/* ---------------------------------------------- animazione per sezione */
var _utTab=null;
function utAnim(el){
  if(!el) return;
  /* lo swipe dell'hero non deve rianimare tutta la schermata: si anima
     solo quando si cambia davvero sezione */
  if(_utTab===ui.tab) return;
  _utTab=ui.tab;
  el.classList.remove('ut-in');
  void el.offsetWidth;
  el.classList.add('ut-in');
}

/* ------------------------------------- niente piu' HUD fisso delle valute */
function hudSync(){
  var h=document.getElementById('ut-hud');
  if(h){ h.className='ut-hud'; h.innerHTML=''; }
}

/* ------------------------- barra profilo dell'home, usata in ogni sezione */
function fhTopHTML(){
  var lv=utLevel();
  var crest=S.crest?('<img src="'+esc2(S.crest)+'" alt="" referrerpolicy="no-referrer">')
                   :('<b>'+esc2(ini2(S.club||'UT'))+'</b>');
  var back=(ui.tab==='home')?''
    :('<button class="fh-back" data-t2="home" title="Torna alla home">\u2039</button>');
  return '<div class="fh-top">'+
      back+
      '<button class="fh-prof" data-t2="club">'+
        '<span class="fh-crest">'+crest+'</span>'+
        '<span class="fh-pdata">'+
          '<span class="fh-pname">'+esc2(S.user||S.tname||S.club||'Manager')+'</span>'+
          '<span class="fh-plvl"><em class="fh-lvchip">'+lv.lvl+'</em>'+
            '<small>'+fmt(lv.cur)+'/'+fmt(lv.need)+' XP</small></span>'+
          '<span class="fh-xp"><i style="width:'+lv.pct+'%"></i></span>'+
        '</span>'+
      '</button>'+
      '<button class="fh-news" data-fh="news">'+FHI.news+'<span>NEWS</span></button>'+
      '<div class="fh-cur">'+
        '<button class="fh-c coin" data-t2="negozio"><i></i>'+fmt(S.coins)+'</button>'+
        '<button class="fh-c exp" data-fh="expinfo"><i></i>'+fmt(S.exp)+'</button>'+
        '<button class="fh-c tok" data-t2="scambio"><i></i>'+fmt(S.tokens|0)+'</button>'+
      '</div>'+
      '<div class="fh-sys">'+
        '<button class="fh-sb" data-t2="collezione" title="Collezione">'+FHI.friends+'</button>'+
        '<button class="fh-sb" data-fh="acts" title="Attivita\'">'+FHI.mail+
          (dailyReady()?'<b>1</b>':'')+'</button>'+
        '<button class="fh-sb" data-t2="club" title="Impostazioni">'+FHI.gear+'</button>'+
      '</div>'+
    '</div>';
}
function secTop(){
  return '<div class="fh-hdr t-'+ui.tab+'">'+fhTopHTML()+'</div>';
}

/* --------------------------------------- popup schermo intero (menu GIOCA) */
function fsSkipGet(){ try{ return localStorage.getItem('ut_fsq')==='1'; }catch(e){ return false; } }
function fsSkipSet(){ try{ localStorage.setItem('ut_fsq','1'); }catch(e){} }
function fsAsk(go){
  go=go||function(){};
  if(fsNow()||fsSkipGet()){ go(); return; }
  var old=document.getElementById('ut-fsq');
  if(old) old.remove();
  var d=document.createElement('div');
  d.id='ut-fsq';
  d.innerHTML='<div class="fsq-box">'+
      '<div class="fsq-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" '+
        'stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+
        '<path d="M4 9V4h5"/><path d="M20 9V4h-5"/><path d="M4 15v5h5"/><path d="M20 15v5h-5"/></svg></div>'+
      '<h3>SCHERMO INTERO</h3>'+
      '<p>Per un\'esperienza da console ti conviene giocare a tutto schermo. '+
        'Puoi uscire in qualsiasi momento con <b>ESC</b>.</p>'+
      '<div class="fsq-row">'+
        '<button class="fsq-y" data-fsq="y">GIOCA A TUTTO SCHERMO</button>'+
        '<button class="fsq-n" data-fsq="n">Continua in finestra</button>'+
      '</div>'+
      '<label class="fsq-chk"><input type="checkbox" id="fsq-skip"> Non chiedermelo piu\'</label>'+
    '</div>';
  document.body.appendChild(d);
  requestAnimationFrame(function(){ d.classList.add('on'); });
  d.addEventListener('click',function(e){
    var b=e.target&&e.target.closest?e.target.closest('[data-fsq]'):null;
    if(!b) return;
    var yes=b.getAttribute('data-fsq')==='y';
    var sk=document.getElementById('fsq-skip');
    if(sk&&sk.checked) fsSkipSet();
    if(yes){ try{ fsOn(); }catch(e2){} }
    d.classList.remove('on');
    setTimeout(function(){ d.remove(); },200);
    setTimeout(go, yes?340:80);
  });
}

/* il popup ora scatta sul GIOCA del menu principale, non prima della partita */
function playMatch(){ playMatchGo(); }
function jnPlay(){ jnPlayGo(); }

try{
  if(typeof window.goChoice==='function' && !window.goChoice.__fsq){
    var _fsqOrig=window.goChoice;
    var _fsqWrap=function(){
      var a=arguments, t=this;
      fsAsk(function(){ _fsqOrig.apply(t,a); });
    };
    _fsqWrap.__fsq=true;
    window.goChoice=_fsqWrap;
  }
}catch(e){}

/* ===================== round 7: barra sezioni, mercato, percorso ========= */

/* --- barra profilo: il blocco del livello apre il percorso dei livelli --- */
function fhTopHTML(){
  var lv=utLevel();
  var crest=S.crest?('<img src="'+esc2(S.crest)+'" alt="" referrerpolicy="no-referrer">')
                   :('<b>'+esc2(ini2(S.club||'UT'))+'</b>');
  var back=(ui.tab==='home')?''
    :('<button class="fh-back" data-t2="home" title="Torna alla home">\u2039</button>');
  var ps=pathState();
  return '<div class="fh-top">'+
      back+
      '<button class="fh-prof" data-t2="percorso" title="Percorso dei livelli">'+
        '<span class="fh-crest">'+crest+'</span>'+
        '<span class="fh-pdata">'+
          '<span class="fh-pname">'+esc2(S.user||S.tname||S.club||'Manager')+'</span>'+
          '<span class="fh-plvl"><em class="fh-lvchip">'+lv.lvl+'</em>'+
            '<small>'+fmt(lv.cur)+'/'+fmt(lv.need)+' XP</small></span>'+
          '<span class="fh-xp"><i style="width:'+lv.pct+'%"></i></span>'+
        '</span>'+
        (ps.rdy?'<span class="fh-pbell">'+ps.rdy+'</span>':'')+
      '</button>'+
      '<button class="fh-news" data-fh="news">'+FHI.news+'<span>NEWS</span></button>'+
      '<div class="fh-cur">'+
        '<button class="fh-c coin" data-t2="negozio"><i></i>'+fmt(S.coins)+'</button>'+
        '<button class="fh-c exp" data-fh="expinfo"><i></i>'+fmt(S.exp)+'</button>'+
        '<button class="fh-c tok" data-t2="scambio"><i></i>'+fmt(S.tokens|0)+'</button>'+
      '</div>'+
      '<div class="fh-sys">'+
        '<button class="fh-sb" data-t2="collezione" title="Collezione">'+FHI.friends+'</button>'+
        '<button class="fh-sb" data-fh="acts" title="Attivita\'">'+FHI.mail+
          (dailyReady()?'<b>1</b>':'')+'</button>'+
        '<button class="fh-sb" data-t2="club" title="Impostazioni">'+FHI.gear+'</button>'+
      '</div>'+
    '</div>';
}
function secTop(){
  return '<div class="fh-hdr t-'+ui.tab+'">'+fhTopHTML()+'</div>';
}

/* ------------------- mercato: tutte le versioni davvero in listino ------- */
function mktVerPool(v){
  var out=[], i, k;
  if(v==='legends'){
    for(i=0;i<LEGENDS.length;i++) out.push({ver:'legends',p:{
      name:LEGENDS[i].n, rate:LEGENDS[i].r, roles:LEGENDS[i].p, pid:LEGENDS[i].id,
      img:legFace(LEGENDS[i]),
      pac:LEGENDS[i].r, sho:LEGENDS[i].r, pas:LEGENDS[i].r, dri:LEGENDS[i].r,
      def:LEGENDS[i].r-10, phy:LEGENDS[i].r-5, age:38, nation:(LEGENDS[i].nat||'')}});
  } else if(v==='worldcup'){
    var wp=wcPool();
    for(i=0;i<wp.length;i++){ var q={}; for(k in wp[i].p) q[k]=wp[i].p[k];
      q.rate=Math.min(97,wp[i].p.rate+wp[i].boost); out.push({p:q,ver:'worldcup'}); }
  } else if(v==='special'){
    var sp=poolBand(84,99);
    for(i=0;i<sp.length;i++){ var s2={}; for(k in sp[i]) s2[k]=sp[i][k];
      out.push({p:s2,ver:'special'}); }
  } else if(v==='special2'){
    var sb=se2Pool();
    for(i=0;i<sb.length;i++) out.push({p:sb[i],ver:'special2'});
  } else {
    var P=buildPool();
    for(i=0;i<P.length;i++){ var rv=rarityOf(P[i].rate);
      if(v&&rv!==v) continue;
      out.push({p:P[i],ver:rv}); }
  }
  return out;
}
function mktBase(){
  var v=ui.mkt.ver;
  if(v) return mktVerPool(v);
  return mktVerPool('').concat(mktVerPool('special'),mktVerPool('special2'),mktVerPool('worldcup'),mktVerPool('legends'));
}

/* =============================== PERCORSO DEI LIVELLI =================== */
var PATH_N=60;
var PATH_FEAT={5:'Mercato trasferimenti',10:'Scambio token',15:'Pacchetti World Cup',
  20:'Draft Legends',25:'Obiettivi settimanali',30:'Campionato d\'elite',
  40:'Pacchetti su misura',50:'Sala trofei',60:'Hall of Fame'};
function pathRw(lv){
  if(lv%10===0) return {t:'tok', n:1, lb:'Token scambio', ic:'tok', big:1};
  if(lv%5===0)  return {t:'exp', n:100+lv*6, lb:'Carta EXP grande', ic:'exp', big:1};
  if(lv%3===0)  return {t:'exp', n:50+lv*4, lb:'Carta EXP', ic:'exp'};
  return {t:'coin', n:80+lv*20, lb:'Monete club', ic:'coin'};
}
function pathState(){
  S.pathc=S.pathc||{};
  var lv=utLevel(), rdy=0, cl=0, i;
  for(i=1;i<=PATH_N;i++){
    if(S.pathc[i]) cl++;
    else if(lv.lvl>=i) rdy++;
  }
  return {lv:lv, rdy:rdy, cl:cl};
}
function pathGive(lv){
  var r=pathRw(lv);
  if(r.t==='coin') S.coins=(S.coins|0)+r.n;
  else if(r.t==='exp') S.exp=(S.exp|0)+r.n;
  else S.tokens=(S.tokens|0)+r.n;
  S.pathc[lv]=1;
  return r;
}
function pathClaim(lv){
  S.pathc=S.pathc||{};
  lv=lv|0;
  if(lv<1||lv>PATH_N||S.pathc[lv]) return;
  if(utLevel().lvl<lv){ toast('Livello '+lv+' non ancora raggiunto'); return; }
  var r=pathGive(lv);
  save();
  toast('Livello '+lv+': +'+fmt(r.n)+' '+(r.t==='coin'?'monete':(r.t==='exp'?'EXP':'token')));
  render();
}
function pathClaimAll(){
  S.pathc=S.pathc||{};
  var lvl=utLevel().lvl, i, n=0, c=0, e=0, t=0;
  for(i=1;i<=PATH_N&&i<=lvl;i++){
    if(S.pathc[i]) continue;
    var r=pathGive(i); n++;
    if(r.t==='coin') c+=r.n; else if(r.t==='exp') e+=r.n; else t+=r.n;
  }
  if(!n){ toast('Nessuna ricompensa da riscattare'); return; }
  save();
  var bits=[];
  if(c) bits.push(fmt(c)+' monete');
  if(e) bits.push(fmt(e)+' EXP');
  if(t) bits.push(fmt(t)+' token');
  toast(n+' livelli riscattati: '+bits.join(' \u00b7 '));
  render();
}
function ppIcon(r){
  if(r.ic==='coin') return '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4.4" stroke="currentColor" stroke-width="1.6"/></svg>';
  if(r.ic==='exp') return '<svg viewBox="0 0 24 24" fill="none"><path d="M12 3l2.6 5.7 6.2.7-4.6 4.2 1.2 6.1L12 16.8 6.6 19.7l1.2-6.1L3.2 9.4l6.2-.7L12 3z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>';
  return '<svg viewBox="0 0 24 24" fill="none"><path d="M12 2.6l8 4.6v9.6l-8 4.6-8-4.6V7.2l8-4.6z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M12 8.4l3.4 2v3.2L12 15.6l-3.4-2v-3.2L12 8.4z" stroke="currentColor" stroke-width="1.4"/></svg>';
}
function ppNode(lv,st){
  var r=pathRw(lv);
  var done=!!S.pathc[lv], ready=(!done&&st.lv.lvl>=lv), lock=(!done&&!ready);
  var feat=PATH_FEAT[lv]||'';
  var cls='pp-node'+(done?' done':'')+(ready?' ready':'')+(lock?' lock':'')+(r.big?' big':'')+(feat?' feat':'');
  var art='<span class="pp-art '+r.ic+'">'+
      '<i>'+ppIcon(r)+'</i>'+
      '<b>x'+fmt(r.n)+'</b>'+
      (r.big?'<u>PREMIUM</u>':'')+
    '</span>';
  var foot=feat
    ? '<span class="pp-nm feat">'+esc2(feat)+'<em>Nuova funzione</em></span>'
    : '<span class="pp-nm">'+esc2(r.lb)+'</span>';
  var btn=done
    ? '<span class="pp-tag ok">Riscattato</span>'
    : (ready
      ? '<button class="pp-cl" data-pth="'+lv+'">RISCATTA</button>'
      : '<span class="pp-tag lk">LV '+lv+'</span>');
  return '<div class="'+cls+'" data-lv="'+lv+'">'+
      '<div class="pp-card">'+art+foot+'</div>'+
      '<div class="pp-cta">'+btn+'</div>'+
      '<div class="pp-rail"><i class="a"></i><i class="b"></i>'+
        '<span class="pp-dot">'+(done?'\u2713':(ready?'!':''))+'</span></div>'+
      '<div class="pp-lvl">LV.'+lv+'</div>'+
    '</div>';
}
function viewPath(){
  var st=pathState(), lv=st.lv, i, nodes='';
  for(i=1;i<=PATH_N;i++) nodes+=ppNode(i,st);
  return '<div class="pp-wrap">'+
    '<div class="pp-hero">'+
      '<div class="pp-hbg"></div>'+
      '<div class="pp-hin">'+
        '<div class="pp-hl">'+
          '<span class="pp-lvbig"><small>Livello</small><b>'+lv.lvl+'</b></span>'+
          '<span class="pp-hxp"><i style="width:'+lv.pct+'%"></i></span>'+
          '<em>'+fmt(lv.cur)+' / '+fmt(lv.need)+' XP</em>'+
        '</div>'+
        '<div class="pp-ht"><h3>Percorso del manager</h3>'+
          '<p>'+PATH_N+' livelli di ricompense progressive. Guadagni EXP giocando: '+
          'ogni livello sblocca un premio da riscattare a mano.</p>'+
          '<div class="pp-hmeta"><span><b>'+st.cl+'</b> riscattati</span>'+
            '<span class="'+(st.rdy?'rd':'')+'"><b>'+st.rdy+'</b> pronti</span>'+
            '<span><b>'+Math.max(0,PATH_N-st.cl)+'</b> rimasti</span></div>'+
        '</div>'+
        '<button class="pp-all'+(st.rdy?'':' off')+'" data-pth="all">'+
          'Riscatta tutto'+(st.rdy?' \u00b7 '+st.rdy:'')+'</button>'+
      '</div>'+
    '</div>'+
    '<div class="pp-scroll" id="pp-track"><div class="pp-track">'+nodes+'</div></div>'+
  '</div>';
}
function bindPath(){
  var w=document.querySelector('.pp-wrap');
  if(!w) return;
  var t=document.getElementById('pp-track');
  if(t){
    if(typeof ui.ppSc==='number'){ t.scrollLeft=ui.ppSc; }
    else {
      var n=w.querySelector('.pp-node.ready')||w.querySelector('.pp-node.lock');
      if(n) t.scrollLeft=Math.max(0,n.offsetLeft-140);
    }
    t.addEventListener('scroll',function(){ ui.ppSc=t.scrollLeft; });
  }
  if(w.__pb) return;
  w.__pb=1;
  w.addEventListener('click',function(e){
    var b=e.target&&e.target.closest?e.target.closest('[data-pth]'):null;
    if(!b) return;
    var v=b.getAttribute('data-pth');
    if(v==='all') pathClaimAll(); else pathClaim(parseInt(v,10));
  });
}

/* -------------------------------------------------------------------- apri */
/* ============== round 8: fusione doppioni + quick exchange =============== */

/* la fusione si blocca solo sulle carte gia' rosse: due 6 stelle si fondono */
function mEnhance(c){
  var d=dupeList(c), can=(!c.red&&d.length>0);
  var nx=c.red?ovrOf(c)
    :(((c.stars|0)>=6)?Math.min(MAX_OVR,c.base+VER[c.ver].bonus+lvlBonus(c.lvl)+(STAR_BONUS[6]||0)+6)
                     :Math.min(MAX_OVR,c.base+VER[c.ver].bonus+lvlBonus(c.lvl)+STAR_BONUS[(c.stars|0)+1]));
  var lab=c.red?'Grado massimo raggiunto'
    :(((c.stars|0)>=6)?'Fondi due 6\u2605 \u00b7 versione ROSSA':'Fondi una copia \u00b7 +1 stella');
  modal('<div class="ut-mh"><h3>Fondi doppioni</h3><button data-x="1">\u00d7</button></div>'+
    '<div class="ut-dtop"><div class="ut-dbig">'+cardHTML(c,{big:true})+'</div>'+
    '<div class="ut-dinfo"><div class="ut-hlab">Stelle</div>'+
      '<div class="ut-dovr">'+(c.red?'6R':(c.stars|0))+'<small>/6</small></div>'+
      '<div class="ut-note">'+(c.red?'Sei stelle rosse: massimo.':
        'Overall <b>'+ovrOf(c)+'</b> \u2192 '+(((c.stars|0)>=6)?'con le <b style="color:#ff6b6b">6\u2605 rosse</b>':'con '+((c.stars|0)+1)+' stelle')+
        ': <b style="color:#ffd35c">'+nx+'</b>')+'</div>'+
      '<div class="ut-note">Serve un\'altra copia dello stesso giocatore, <b>stessa versione ('+
      VER[c.ver].nm+')</b> e <b>stesso grado ('+(c.stars|0)+' stelle)</b>. '+
      'Due carte a 6 stelle si fondono nella versione <b style="color:#ff6b6b">rossa</b>.</div>'+
      (d.length?'<div class="ut-dupes">'+d.slice(0,6).map(function(x){
        return '<div class="ut-dupe">'+cardHTML(x)+'</div>'; }).join('')+'</div>':
        '<div class="ut-note">Nessuna copia disponibile.</div>')+
      '<button class="ut-act'+(can?'':' off')+'" data-m2="dostar" '+(can?'':'disabled')+'>'+lab+'</button>'+
    '</div></div>', c);
}
function starUp(c){
  if(c.red){ toast('Grado massimo: sei stelle rosse.'); return; }
  var d=dupeList(c);
  if(!d.length){
    toast('Serve un\'altra copia di '+sur2(c.name)+' '+VER[c.ver].nm+
          ' con '+(c.stars|0)+' stelle'+((c.stars|0)>=6?' (per le rosse servono due carte a 6 stelle)':'')+'.');
    return;
  }
  clearFromSquad(d[0].id); delete S.cards[d[0].id];
  if((c.stars|0)>=6){ c.red=true; c.stars=6; toast('SEI STELLE ROSSE! Overall '+ovrOf(c)); }
  else { c.stars=(c.stars|0)+1; toast('+1 stella \u00b7 ora '+c.stars+'/6 \u00b7 overall '+ovrOf(c)); }
  save();
}

/* ------------------------------- quick exchange -------------------------- */
function qxKey(c){
  if(!c) return '';
  return (c.pid||c.name)+'|'+c.ver+'|'+(c.stars|0)+'|'+(c.red?1:0);
}
function qxGroups(){
  var m={}, k, c, out=[];
  for(k in S.cards){
    c=S.cards[k];
    if(c.red) continue;
    var kk=qxKey(c);
    if(!m[kk]) m[kk]=[];
    m[kk].push(c);
  }
  for(k in m){
    if(m[k].length<2) continue;
    var g=m[k].slice().sort(function(a,b){ return (b.lvl||1)-(a.lvl||1); });
    out.push({k:k, n:g.length, best:g[0]});
  }
  out.sort(function(a,b){ return ovrOf(b.best)-ovrOf(a.best); });
  return out;
}
function qxOne(key){
  var g=[], k, c;
  for(k in S.cards){ c=S.cards[k]; if(!c.red && qxKey(c)===key) g.push(c); }
  if(g.length<2) return 0;
  g.sort(function(a,b){ return (b.lvl||1)-(a.lvl||1); });
  var done=0;
  while(g.length>=2){
    var keep=g.shift(), eat=g.pop();
    clearFromSquad(eat.id);
    delete S.cards[eat.id];
    if((keep.stars|0)>=6){ keep.red=true; keep.stars=6; }
    else keep.stars=(keep.stars|0)+1;
    done++;
  }
  return done;
}
function qxRun(key){
  var n=0, guard=0, reds=0;
  if(key){
    var kk=key;
    while(guard++<40){
      var before=kk.split('|'), d=qxOne(kk);
      if(!d) break;
      n+=d;
      var st=Math.min(6,parseInt(before[2],10)+1);
      if(parseInt(before[2],10)>=6){ reds++; break; }
      kk=before[0]+'|'+before[1]+'|'+st+'|0';
    }
  } else {
    while(guard++<80){
      var gs=qxGroups(), t=0, i;
      if(!gs.length) break;
      for(i=0;i<gs.length;i++) t+=qxOne(gs[i].k);
      if(!t) break;
      n+=t;
    }
  }
  if(n){
    save();
    toast(n+' doppion'+(n===1?'e fuso':'i fusi')+(reds?' \u00b7 6\u2605 ROSSE!':''));
    render();
  } else toast('Nessun doppione identico da fondere.');
  return n;
}

/* ============ round 9: quick exchange dentro FONDI DOPPIONI ============== */
function qxPV(c){ if(!c) return ''; return (c.pid||c.name)+'|'+c.ver; }
/* tutte le copie non rosse dello stesso giocatore+versione, qualunque grado */
function qxCounts(c){
  var pv=qxPV(c), cnt=[0,0,0,0,0,0,0], k, x;
  for(k in S.cards){ x=S.cards[k];
    if(!x||x.red) continue;
    if(qxPV(x)!==pv) continue;
    cnt[Math.max(0,Math.min(6,x.stars|0))]++; }
  return cnt;
}
function qxCount(c){
  var cnt=qxCounts(c), n=0, i;
  for(i=0;i<=6;i++) n+=cnt[i];
  return n;
}
/* quante stelle guadagna la carta fondendo a catena tutte le copie */
function qxGain(c){
  if(!c||c.red) return 0;
  var cnt=qxCounts(c), i, pairs, top=Math.max(0,Math.min(6,c.stars|0));
  for(i=0;i<6;i++){
    pairs=Math.floor(cnt[i]/2);
    if(!pairs) continue;
    cnt[i]-=pairs*2; cnt[i+1]+=pairs;
    if(cnt[i+1]>0) top=Math.max(top,i+1);
  }
  if(cnt[6]>=2) return Math.max(0,6-(c.stars|0))+1;   /* 6 stelle rosse */
  return Math.max(0, top-(c.stars|0));
}
/* fonde a catena partendo dai gradi piu' bassi, tenendo sempre questa carta */
function qxRunCard(c){
  if(!c){ return 0; }
  if(c.id && S.cards[c.id]) c=S.cards[c.id];
  var pv=qxPV(c), n=0, s, guard=0;
  for(s=0;s<=6;s++){
    while(guard++<20000){
      var g=[], k, x, i;
      for(k in S.cards){ x=S.cards[k];
        if(!x||x.red) continue;
        if(qxPV(x)!==pv) continue;
        if((x.stars|0)!==s) continue;
        g.push(x); }
      if(g.length<2) break;
      var keep=null;
      for(i=0;i<g.length;i++) if(g[i].id===c.id){ keep=g[i]; break; }
      if(!keep){ g.sort(function(a,b){ return (b.lvl||1)-(a.lvl||1); }); keep=g[0]; }
      var eat=null;
      for(i=g.length-1;i>=0;i--) if(g[i].id!==keep.id){ eat=g[i]; break; }
      if(!eat) break;
      clearFromSquad(eat.id); delete S.cards[eat.id];
      if((keep.stars|0)>=6){ keep.red=true; keep.stars=6; }
      else keep.stars=(keep.stars|0)+1;
      n++;
    }
  }
  if(n){ save();
    toast(n+' doppioni fusi \u00b7 '+sur2(c.name)+' ora '+
      (c.red?'6\u2605 ROSSE':((c.stars|0)+'\u2605'))+' \u00b7 overall '+ovrOf(c));
    render();
  } else toast('Nessuna copia da fondere.');
  return n;
}
function mEnhance(c){
  var d=dupeList(c), n=qxCount(c), _gain=qxGain(c),
      can=(!c.red&&(d.length>0||_gain>0)), chain=(_gain>0?Math.max(2,n):0);
  var nx=c.red?ovrOf(c)
    :(((c.stars|0)>=6)?Math.min(MAX_OVR,c.base+VER[c.ver].bonus+lvlBonus(c.lvl)+(STAR_BONUS[6]||0)+6)
                     :Math.min(MAX_OVR,c.base+VER[c.ver].bonus+lvlBonus(c.lvl)+STAR_BONUS[(c.stars|0)+1]));
  var lab=c.red?'Grado massimo raggiunto'
    :(((c.stars|0)>=6)?'Fondi due 6\u2605 \u00b7 versione ROSSA':'Fondi una copia \u00b7 +1 stella');
  modal('<div class="ut-mh"><h3>Fondi doppioni</h3><button data-x="1">\u00d7</button></div>'+
    '<div class="ut-dtop"><div class="ut-dbig">'+cardHTML(c,{big:true})+'</div>'+
    '<div class="ut-dinfo"><div class="ut-hlab">Stelle</div>'+
      '<div class="ut-dovr">'+(c.red?'6R':(c.stars|0))+'<small>/6</small></div>'+
      '<div class="ut-note">'+(c.red?'Sei stelle rosse: massimo.':
        'Overall <b>'+ovrOf(c)+'</b> \u2192 '+(((c.stars|0)>=6)?'con le <b style="color:#ff6b6b">6\u2605 rosse</b>':'con '+((c.stars|0)+1)+' stelle')+
        ': <b style="color:#ffd35c">'+nx+'</b>')+'</div>'+
      '<div class="ut-note">Serve un\'altra copia dello stesso giocatore, <b>stessa versione ('+
      VER[c.ver].nm+')</b> e <b>stesso grado ('+(c.stars|0)+' stelle)</b>. '+
      'Due carte a 6 stelle si fondono nella versione <b style="color:#ff6b6b">rossa</b>.</div>'+
      (d.length?'<div class="ut-dupes">'+d.slice(0,6).map(function(x){
        return '<div class="ut-dupe">'+cardHTML(x)+'</div>'; }).join('')+'</div>':
        '<div class="ut-note">Nessuna copia disponibile.</div>')+
      '<button class="ut-act'+(can?'':' off')+'" data-m2="dostar" '+(can?'':'disabled')+'>'+lab+'</button>'+
      '<button class="ut-act qx'+(chain>1?'':' off')+'" data-m2="dostarall" '+(chain>1?'':'disabled')+'>'+
        '\u26a1 QUICK EXCHANGE'+(chain>1?(' \u00b7 '+n+' COPIE \u00b7 +'+_gain+'\u2605'):'')+'</button>'+
      '<div class="ut-note qxn">Il quick exchange fonde in un colpo solo tutte le copie identiche, '+
      'a catena: quattro carte allo stesso grado diventano una carta con due stelle in piu\'.</div>'+
    '</div></div>', c);
}

function open(){
  load();
  if(!S.seen){ seedStarter(); S.seen=true; save(); }
  root().classList.add('on');
  document.documentElement.style.overflow='hidden';
  if(!root().__bound){ root().__bound=true; bind(); }
  render();
}
function hide(){ var r=document.getElementById('ut-root'); if(r) r.classList.remove('on');
  document.documentElement.style.overflow=''; }
function close(){ hide(); try{ if(typeof window.render==='function') window.render(); }catch(e){} }

window.UT={open:open,close:close,state:function(){return S;},ovr:ovrOf,pool:buildPool,
  sim:jnSim,simLeague:simMatch,tokens:function(){return S.tokens|0;},
  ovrIn:ovrIn,pen:posPenalty,slots:slots,
  dupes:dupeList,fuse:starUp,jnSpec:jnSpec,jnOpp:jnOpp,
  table:tableFor,_packs:PACKS,_ver:VER,_legends:LEGENDS,rarity:rarityOf};
/* ponte verso l'esterno: stato, salvataggio, pacchetti reali */
window.UTX={
  st:function(){ return S; },
  save:function(){ try{ save(); }catch(e){} },
  render:function(){ try{ render(); }catch(e){} },
  actOpen:function(){ try{ actOpen(); }catch(e){} },
  packs:function(){ return PACKS; },
  pack:function(k){ try{ return packByKey(k); }catch(e){ return null; } },
  openPack:function(p){ try{ return openPack(p)||[]; }catch(e){ return []; } },
  dailyList:function(){ return DAILY; },
  dailyState:function(){ try{ return dailyState(); }catch(e){ return {day:0,last:'',streak:0}; } },
  dailyReady:function(){ try{ return dailyReady(); }catch(e){ return false; } },
  dailyClaim:function(){ try{ dailyClaim(); }catch(e){} },
  dayKey:function(){ try{ return dayKey(); }catch(e){ return new Date().toDateString(); } },
  ver:function(v){ try{ return VER[v]||null; }catch(e){ return null; } },
  fmt:function(n){ try{ return fmt(n); }catch(e){ return String(n); } },
  toast:function(m){ try{ toast(m); }catch(e){} }
};
window.openUltimateTeam=open;

})();
