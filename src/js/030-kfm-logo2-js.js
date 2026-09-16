
/* stemmi: media.api-sports.io come unica fonte, mappa nomi ampliata */
(function(){
  var SRC='https://media.api-sports.io/football/teams/';
  var A={
  /* Serie A + italiane */
  'pisa':1578,'sampdoria':498,'palermo':1584,'bari':1581,'spezia':515,'brescia':1577,'frosinone':512,'pescara':1587,'reggiana':1590,'sudtirol':1591,'catanzaro':1585,'cesena':1588,'modena':1583,'juve stabia':1596,'avellino':1593,'padova':1592,'entella':1594,'mantova':1595,
  /* Premier + inglesi */
  'sunderland':746,'ipswich':677,'ipswich town':677,'sheffield united':62,'sheffield wednesday':1348,'west bromwich albion':60,'west brom':60,'norwich':71,'norwich city':71,'watford':38,'middlesbrough':70,'coventry':1074,'coventry city':1074,'stoke':75,'stoke city':75,'hull city':64,'preston':1161,'swansea':76,'cardiff':43,'cardiff city':43,'millwall':72,'qpr':69,'queens park rangers':69,'blackburn':59,'bristol city':1073,'derby':1338,'derby county':1338,'luton':1359,'luton town':1359,'oxford united':1075,'portsmouth':1113,'plymouth':1146,'wrexham':1329,'charlton':1350,'brighton hove albion':51,
  /* Liga */
  'real betis balompie':543,'celta':538,'rc celta':538,'elche':797,'real oviedo':723,'levante ud':539,'granada':715,'cadiz':724,'almeria':723,'racing santander':720,'real zaragoza':726,'sporting gijon':722,'deportivo la coruna':2892,'eibar':545,'huesca':729,'leganes':537,'valladolid':720,'real valladolid':720,
  /* Bundesliga */
  'fsv mainz':164,'mainz 05':164,'union berlin':182,'koln':192,'fc koln':192,'heidenheim':180,'heidenheim 1846':180,'bayer leverkusen':168,'bayer 04 leverkusen':168,'hertha':170,'hertha bsc':159,'hertha berlin':159,'schalke':174,'schalke 04':174,'hannover':189,'hannover 96':189,'nurnberg':179,'kaiserslautern':178,'karlsruher':191,'fortuna dusseldorf':175,'darmstadt':181,'paderborn':190,'greuther furth':166,'holstein kiel':191,'bochum':171,'vfl bochum':171,'elversberg':4166,'magdeburg':1320,'braunschweig':187,'munster':1319,'dresden':1310,
  /* Ligue 1 */
  'lille osc':79,'losc':79,'strasbourg alsace':95,'rc strasbourg':95,'stade brestois':106,'lorient':97,'fc lorient':97,'saint etienne':1063,'reims':93,'stade de reims':93,'nancy':1064,'paris fc':110,'ajaccio':98,'bordeaux':78,'guingamp':1067,'caen':115,'troyes':114,'clermont':99,'lorient 56':97,
  /* Eredivisie */
  'utrecht':200,'fc utrecht':200,'twente':415,'fc twente':415,'nec':413,'nec nijmegen':413,'go ahead eagles':419,'sparta rotterdam':426,'fortuna sittard':424,'heerenveen':206,'sc heerenveen':206,'pec zwolle':193,'zwolle':193,'heracles':204,'heracles almelo':204,'groningen':202,'fc groningen':202,'nac breda':196,'excelsior':195,'volendam':421,'telstar':417,'willem ii':203,'vitesse':205,
  /* Portogallo */
  'sporting clube de braga':217,'famalicao':242,'estoril':210,'estoril praia':210,'rio ave':216,'vitoria':214,'vitoria sc':214,'vitoria guimaraes':214,'santa clara':227,'casa pia':4716,'arouca':229,'fc arouca':229,'moreirense':226,'gil vicente':222,'nacional':224,'cd nacional':224,'alverca':4770,'estrela da amadora':4780,'avs':11524,'tondela':230,'cd tondela':230,'boavista':219,'farense':4715,'maritimo':223,
  /* Turchia */
  'besiktas jk':549,'trabzonspor':998,'basaksehir':564,'medipol basaksehir':564,'samsunspor':3573,'gaziantep':3576,'gaziantep fk':3576,'rizespor':3563,'caykur rizespor':3563,'eyupspor':3593,'kasimpasa':606,'genclerbirligi':3571,'kayserispor':601,'karagumruk':3583,'fatih karagumruk':3583,'kocaelispor':3572,'alanyaspor':608,'antalyaspor':607,'konyaspor':996,'goztepe':3565,'sivasspor':1006,'adana demirspor':3563,
  /* Scozia / Belgio / Austria / Svizzera */
  'aberdeen':252,'hearts':249,'hibernian':254,'club brugge':569,'club brugge kv':569,'anderlecht':554,'genk':742,'gent':631,'standard liege':733,'royal antwerp':740,'antwerp':740,'cercle brugge':266,'union saint gilloise':1393,'young boys':569,'bsc young boys':551,'basel':560,'fc basel':560,'zurich':558,'servette':553,'lugano':561,'st gallen':559,'red bull salzburg':571,'salzburg':571,'rapid wien':573,'austria wien':575,'sturm graz':572,'lask':572,
  /* Nord Europa / Est */
  'copenhagen':400,'fc copenhagen':400,'midtjylland':397,'brondby':405,'brondby if':405,'aarhus':399,'agf':399,'malmo':377,'malmo ff':377,'aik':376,'djurgarden':378,'hacken':370,'bk hacken':370,'hammarby':375,'bodo glimt':327,'molde':328,'rosenborg':331,'brann':329,'hjk':679,'shakhtar donetsk':550,'dynamo kyiv':551,'legia warszawa':341,'legia':341,'lech poznan':347,'rakow':343,'jagiellonia':340,'slavia praha':2216,'slavia prague':2216,'sparta praha':2214,'viktoria plzen':2215,'ferencvaros':651,'dinamo zagreb':604,'hajduk split':608,'red star belgrade':598,'crvena zvezda':598,'partizan':599,'olympiacos':553,'panathinaikos':619,'aek athens':623,'paok':611,'apoel':602,'cfr cluj':2265,'fcsb':539,'petrolul':2286,
  /* Saudi / Emirati / Qatar */
  'al hilal':2932,'al nassr':2939,'al ittihad':2938,'al ahli':2929,'al ahli sfc':2929,'al shabab':2933,'al ettifaq':2934,'al fateh':2935,'al taawoun':2936,'al riyadh':10502,'al khaleej':2944,'al fayha':2941,'al qadsiah':10500,'al kholood':22651,'al okhdood':22652,'al akhdoud':22652,'al hazem':10501,'al najma':10503,'al orobah':22653,'al ain':2938,'al wasl':10476,'al sadd':2891,
  /* MLS */
  'inter miami':9568,'los angeles fc':1616,'lafc':1616,'la galaxy':1596,'atlanta united':1608,'austin':16489,'austin fc':16489,'seattle sounders':1595,'portland timbers':1599,'new york city fc':1602,'new york red bulls':1603,'toronto fc':1607,'columbus crew':1611,'orlando city':1601,'philadelphia union':1598,'sporting kansas city':1613,'fc dallas':1597,'houston dynamo':1600,'chicago fire':1610,'cf montreal':1615,'nashville sc':16488,'st louis city':21030,'charlotte fc':18310,'minnesota united':1594,'colorado rapids':1604,'real salt lake':1605,'san jose earthquakes':1606,'vancouver whitecaps':1609,'dc united':1612,'new england revolution':1614,
  /* Brasile */
  'flamengo':127,'palmeiras':121,'botafogo':120,'fluminense':124,'corinthians':131,'sao paulo':126,'santos':128,'atletico mineiro':1062,'internacional':119,'gremio':130,'bahia':118,'cruzeiro':135,'vasco da gama':133,'vasco':133,'fortaleza':154,'atletico paranaense':134,'bragantino':794,'juventude':152,'ceara':147,'mirassol':7848,'sport recife':144,'vitoria ba':136,
  /* Argentina & Sudamerica */
  'boca juniors':451,'river plate':435,'racing club':436,'independiente':450,'san lorenzo':460,'velez sarsfield':441,'estudiantes':442,'newells old boys':439,'argentinos juniors':455,'huracan':458,'lanus':454,'rosario central':437,'talleres':456,'defensa y justicia':445,'banfield':448,'ca banfield':448,'godoy cruz':446,'gimnasia la plata':1064,'barracas central':1065,'atletico tucuman':453,'central cordoba':462,'aldosivi':1062,'sarmiento':474,'union santa fe':449,'instituto':1061,'platense':1063,'colon':457,'penarol':2662,'nacional montevideo':2664,'club nacional de football':2664,'colo colo':2287,'universidad de chile':2286,'universidad catolica':2285,'alianza lima':1140,'universitario':1142,'sporting cristal':1141,'cienciano':1143,'atletico nacional':1137,'america de cali':1131,'millonarios':1134,'junior':1135,'deportivo cali':1133,'atletico bucaramanga':1129,'ldu quito':1149,'barcelona sc':1151,'barcelona de guayaquil':1151,'emelec':1153,'independiente del valle':1148,'olimpia':2596,'cerro porteno':2595,'libertad':2597,'guarani':2600,'bolivar':2604,'the strongest':2605,'caracas':2704,'deportivo tachira':2707,'carabobo':2705,
  /* Australia / Asia */
  'melbourne victory':938,'melbourne city':940,'sydney fc':944,'western sydney wanderers':946,'adelaide united':936,'brisbane roar':937,'central coast mariners':939,'perth glory':941,'wellington phoenix':945,'auckland':22143,'urawa red diamonds':294,'kawasaki frontale':292,'yokohama f marinos':291,'vissel kobe':298,'gamba osaka':288,'kashima antlers':286,'fc tokyo':289,'cerezo osaka':284,'ulsan hyundai':2748,'jeonbuk hyundai':2749,'fc seoul':2751,'pohang steelers':2750,'shanghai port':857,'beijing guoan':862,'shandong taishan':858,'chengdu rongcheng':869,'changchun yatai':868,'mumbai city':4784,'bengaluru':4783,'chennaiyin':4787,'kerala blasters':4785,'mohun bagan':10861
  };
  var ACC={'\u00e0':'a','\u00e1':'a','\u00e2':'a','\u00e3':'a','\u00e4':'a','\u00e5':'a','\u00e8':'e','\u00e9':'e','\u00ea':'e','\u00eb':'e','\u00ec':'i','\u00ed':'i','\u00ee':'i','\u00ef':'i','\u00f2':'o','\u00f3':'o','\u00f4':'o','\u00f5':'o','\u00f6':'o','\u00f8':'o','\u00f9':'u','\u00fa':'u','\u00fb':'u','\u00fc':'u','\u00e7':'c','\u0131':'i','\u015f':'s','\u0159':'r','\u0107':'c','\u010d':'c','\u017e':'z','\u0161':'s','\u0219':'s','\u021b':'t','\u0103':'a'};
  function norm(s){
    s=String(s||'').toLowerCase();
    var o='';
    for(var i=0;i<s.length;i++){ var c=s.charAt(i); o+=(ACC[c]||c); }
    return o.replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
  }
  var DROP={fc:1,ac:1,as:1,ss:1,ssc:1,us:1,usd:1,sc:1,cf:1,rc:1,rcd:1,afc:1,cd:1,ud:1,sd:1,vfl:1,vfb:1,tsg:1,sv:1,sk:1,jk:1,kv:1,ksv:1,sco:1,ogc:1,og:1,losc:1,aj:1,gd:1,fsv:1,osc:1,bk:1,bsc:1,if:1,fk:1,cp:1,sad:1,sfc:1,ca:1,cs:1,cfr:1,ac1:1,club:1,calcio:1,futebol:1,futbol:1,deportivo:0,sports:1,sport:1,association:1,'1':1,'04':1,'05':1,'96':1,'29':1,'56':1,'1846':1,'1899':1,'1907':1,'1913':1,'1893':1,'1900':1,'1909':1,'1919':1,'1926':1,'1931':1,'1963':1,u23:1,u21:1,ii:1,b:1};
  function core(s){
    var t=norm(s).split(' '),o=[];
    for(var i=0;i<t.length;i++){ if(!DROP[t[i]]) o.push(t[i]); }
    var r=o.join(' ');
    return r||norm(s);
  }
  var prev=window.kfmTeamLogo;
  var CACHE={};
  function findId(name){
    var k=norm(name);
    if(!k) return 0;
    if(CACHE[k]!==undefined) return CACHE[k];
    var id=A[k]||A[core(k)]||0;
    CACHE[k]=id;
    return id;
  }
  window.kfmTeamLogo=function(name){
    /* prima la mappa originale (nomi verificati), poi quella ampliata */
    var u='';
    if(typeof prev==='function'){ try{ u=prev(name)||''; }catch(e){ u=''; } }
    if(u) return u;
    var id=findId(name);
    return id?(SRC+id+'.png'):'';
  };
  window.KFMLOGO2={find:findId,count:(function(){var n=0;for(var k in A) n++; return n;})()};
})();

