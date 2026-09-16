
(function(){
  /* Loghi reali (anche club senza licenza EA) da media.api-sports.io: immagini diritte,
     nessuna API/fetch -> funzionano anche aprendo il file in locale (file://). */
  var SRC='https://media.api-sports.io/football/teams/';
  var IDS={
    /* Serie A */
    'inter':505,'internazionale':505,'inter milan':505,'inter milano':505,'fc internazionale':505,
    'milan':489,'ac milan':489,'acm':489,'milano':489,
    'juventus':496,'juve':496,'piemonte calcio':496,'zebre':496,
    'napoli':492,'ssc napoli':492,'roma':497,'as roma':497,'italia roma':497,
    'lazio':487,'ss lazio':487,'latium':487,'atalanta':499,'bergamo calcio':499,
    'fiorentina':502,'acf fiorentina':502,'bologna':500,'torino':503,'udinese':494,
    'genoa':495,'cagliari':490,'sassuolo':488,'verona':504,'hellas verona':504,
    'empoli':511,'lecce':867,'monza':1579,'ac monza':1579,'parma':523,'como':895,'como 1907':895,
    'venezia':517,'cremonese':520,'us cremonese':520,'sampdoria':498,'salernitana':514,
    /* Premier League */
    'manchester united':33,'manchester utd':33,'man utd':33,'man united':33,
    'newcastle':34,'newcastle united':34,'newcastle utd':34,'bournemouth':35,'afc bournemouth':35,
    'fulham':36,'wolves':39,'wolverhampton':39,'wolverhampton wanderers':39,
    'liverpool':40,'southampton':41,'arsenal':42,'burnley':44,'everton':45,
    'leicester':46,'leicester city':46,'tottenham':47,'tottenham hotspur':47,'spurs':47,
    'west ham':48,'west ham united':48,'chelsea':49,'manchester city':50,'man city':50,
    'brighton':51,'brighton hove albion':51,'crystal palace':52,'brentford':55,
    'leeds':63,'leeds united':63,'nottingham forest':65,'nottm forest':65,'aston villa':66,
    /* Liga */
    'barcelona':529,'fc barcelona':529,'barcellona':529,'atletico madrid':530,'atletico de madrid':530,'atl madrid':530,
    'athletic club':531,'athletic bilbao':531,'valencia':532,'villarreal':533,'las palmas':534,
    'sevilla':536,'siviglia':536,'celta vigo':538,'celta de vigo':538,'levante':539,'espanyol':540,
    'real madrid':541,'alaves':542,'deportivo alaves':542,'real betis':543,'betis':543,
    'getafe':546,'girona':547,'real sociedad':548,'osasuna':727,'rayo vallecano':728,'mallorca':798,
    /* Bundesliga */
    'bayern munchen':157,'bayern munich':157,'fc bayern munchen':157,'bayern monaco':157,'bayern':157,
    'freiburg':160,'sc freiburg':160,'wolfsburg':161,'vfl wolfsburg':161,'werder bremen':162,'werder':162,
    'borussia monchengladbach':163,'monchengladbach':163,'gladbach':163,'mainz':164,'mainz 05':164,
    'borussia dortmund':165,'dortmund':165,'bvb':165,'hoffenheim':167,'tsg hoffenheim':167,
    'bayer leverkusen':168,'leverkusen':168,'eintracht frankfurt':169,'frankfurt':169,
    'augsburg':170,'stuttgart':172,'vfb stuttgart':172,'rb leipzig':173,'lipsia':173,
    'hamburger sv':176,'amburgo':176,'heidenheim':180,'union berlin':182,'st pauli':186,'fc st pauli':186,'koln':192,'colonia':192,
    /* Ligue 1 */
    'angers':77,'lille':79,'losc lille':79,'lyon':80,'olympique lyonnais':80,'ol':80,
    'marseille':81,'olympique de marseille':81,'marsiglia':81,'om':81,
    'montpellier':82,'nantes':83,'nice':84,'nizza':84,'ogc nice':84,
    'paris saint germain':85,'paris':85,'psg':85,'paris sg':85,
    'monaco':91,'as monaco':91,'rennes':94,'stade rennais':94,'strasbourg':95,'toulouse':96,
    'brest':106,'auxerre':108,'le havre':111,'metz':112,'lens':116,'rc lens':116,
    /* Portogallo / Olanda / Scozia / Turchia */
    'benfica':211,'sl benfica':211,'porto':212,'fc porto':212,'braga':217,'sc braga':217,
    'sporting cp':228,'sporting':228,'sporting lisbon':228,'sporting lisbona':228,
    'ajax':194,'psv':197,'psv eindhoven':197,'feyenoord':209,'az':201,'az alkmaar':201,
    'celtic':247,'rangers':257,'galatasaray':645,'fenerbahce':611,'besiktas':549
  };
  function norm(s){
    return String(s||'').toLowerCase()
      .replace(/[\u00e0\u00e1\u00e2\u00e3\u00e4]/g,'a').replace(/[\u00e8\u00e9\u00ea\u00eb]/g,'e')
      .replace(/[\u00ec\u00ed\u00ee\u00ef]/g,'i').replace(/[\u00f2\u00f3\u00f4\u00f5\u00f6]/g,'o')
      .replace(/[\u00f9\u00fa\u00fb\u00fc]/g,'u').replace(/[\u00e7]/g,'c')
      .replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
  }
  function strip(k){
    return k.replace(/^(fc|ac|as|ss|ssc|us|sc|cf|rc|afc|cd|ud|vfl|vfb|tsg|sv|1899|1907|1913)\s+/,'')
            .replace(/\s+(fc|ac|cf|sc|afc|bc|calcio|club)$/,'').trim();
  }
  function lookup(name){
    var k=norm(name);
    if(!k) return 0;
    return IDS[k]||IDS[strip(k)]||0;
  }
  var FALLBACK={};
  var old=window.getLogo;
  if(typeof old==='function'){
    window.getLogo=function(id,name){
      var fb=old.apply(this,arguments);
      var t=lookup(name);
      if(!t) return fb;
      var u=SRC+t+'.png';
      FALLBACK[u]=fb;
      return u;
    };
  }
  /* se un crest nuovo non carica, torno a quello vecchio invece di lasciare il buco */
  document.addEventListener('error',function(e){
    var t=e.target;
    if(!t||t.tagName!=='IMG') return;
    var f=FALLBACK[t.src];
    if(f&&f!==t.src){ t.src=f; }
  },true);
  window.kfmTeamLogo=function(name){ var t=lookup(name); return t?SRC+t+'.png':''; };
})();

