
/* =====================================================================
   Campionati: le 49 competizioni del database nuovo, con scelta in due
   passi (nazione, poi campionato) e un layout che usa tutto lo schermo
   e si puo' scorrere.
   ===================================================================== */
(function(){
'use strict';
if (typeof LEAGUES === 'undefined' || typeof EADB === 'undefined') return;

var NUOVE = {"Serie A":["AC Milan","Atalanta","Bologna","Cagliari","Como","Fiorentina","Frosinone","Genoa","Inter","Juventus","Lazio","Lecce","Monza","Napoli","Parma","Roma","Sassuolo","Torino","Udinese","Venezia"],"Serie B":["Arezzo","Ascoli","Avellino","Benevento","Calcio Padova","Carrarese","Catanzaro","Cesena","Cremonese","Empoli","Hellas Verona FC","Juve Stabia","Mantova","Modena","Palermo","Pisa","Sampdoria","Südtirol","Vicenza","Virtus Entella"],"Serie C - Girone A":["AC Carpi","AlbinoLeffe","Alcione","Arzignano Valchiampo","Calcio Desenzano","Cittadella","Dolomiti Bellunesi","Folgore Caratese","Giana Erminio","Juventus Next Gen","Lecco","Lumezzane","Novara","Ospitaletto","Pergolettese","Pro Vercelli","Renate","Trento Calcio 1921","Treviso","Union Brescia"],"Serie C - Girone B":["Atalanta II","Campobasso","Forlì","Grosseto","Gubbio","Guidonia Montecelio 1937 FC","Latina","Livorno","Ostia Mare Lidocalcio","Perugia","Pescara","Pianese","Pineto","Ravenna","Reggiana","Sambenedettese","Sassari Torres","Spezia","Vado","Vis Pesaro"],"Serie C - Girone C":["Audace Cerignola","Bari 1908","Barletta","Casarano","Casertana","Catania","Cavese","Cosenza","Crotone","Foggia","Inter U23","Monopoli","Picerno","Potenza Calcio","SSC Giugliano","Salernitana","Savoia","Scafatese","Sorrento","Team Altamura"],"Serie D - Girone A":["AS Biellese 1902","Alessandria","Asti","Borgosesia","Bra","Celle Varazze","Chisola","Derthona","Fezzanese","Gozzano","Lascaris","Ligorna","Millesimo","Pro Imperia","Saluzzo","Sanremo","Sestri Levante","Valenzana"],"Serie D - Girone C":["Altavilla","Bassano Virtus","Brian Lignano","Calvi Noale","Campodarsego","Cjarlins Muzane","Clodiense","Conegliano","Este","Lavarian Mortean Esperia","Legnago Salus","Luparense","Mestre","Obermais","Sandonà","Schio","Triestina","Virtus Bolzano"],"Serie D - Girone D":["Arconatese","Casatese","Castellanzese","Cittadella Vis Modena","Città di Varese","Coriano","Correggese","Crema","Lentigione","Oltrepò","Pavia","Pistoiese","Pontedera","Pro Patria","Pro Sesto","Sant'Angelo","Solbiatese 1911","Varesina"],"Serie D - Girone E":["FC Siena SSD","Flaminia","Gavorrano","Ghivizzano Borgo Mozzano","Grassina","Lucchese","Mezzolara","Montevarchi","Prato","Progresso","Rondinella Marzocco","San Donato Tavarnelle","Sasso Marconi","Scandicci","Seravezza","Tau Altopascio","Ternana","Terranuova Traiana"],"Serie D - Girone F":["ACD Maceratese","Ancona","Angelana","Atletico Ascoli","Foligno","Fossombrone","Giulianova","L'Aquila","Montecchio Gallo","Pietralunghese","Recanatese","San Nicolò","Santegidiese","Sporting Trestina","Teramo","Termoli Calcio","Vigor Senigallia","Virtus Lanciano"],"Serie D - Girone G":["Afragolese","Albalonga","Anzio","Aranova","Atletico Lodigiani","Budoni","Certosa V. Campagnano","Città di Anagni","Gelbison","Latte Dolce","Monastir","Ossese","Paganese","Sarnese","Sarrabus Ogliastra","Trastevere","US Venafro","Unipomezia"],"Serie D - Girone H":["Aversa Normanna","Bisceglie","Brindisi","Ebolitana","Fidelis Andria","Francavilla","Gladiator","Gravina","Ischia","Manfredonia","Martina Franca","Melfi","Nardò","Nocerina","Real Forio","Turris","USD Palmese","Virtus Francavilla"],"Serie D - Girone I":["AC Palermo","Avola","CastrumFavara","Digiesse PraiaTortora","Enna","Gela","Igea Virtus","Licata","Milazzo","Modica","Nissa","Ragusa","Reggina","Sambiase","Siracusa","Trapani 1905","Vibonese","Vigor Lamezia"],"Championship":["Birmingham City","Blackburn Rovers","Bolton Wanderers","Bristol City","Burnley","Cardiff City","Charlton Athletic","Derby County","Lincoln City","Middlesbrough","Millwall","Norwich City","Portsmouth","Preston North End","Queens Park Rangers","Sheffield United","Southampton","Stoke City","Swansea City","Watford","West Bromwich Albion","West Ham United","Wolverhampton Wanderers","Wrexham"],"League One":["AFC Wimbledon","Barnsley","Blackpool","Bradford City","Bromley","Burton Albion","Cambridge United","Doncaster Rovers","Huddersfield Town","Leicester City","Leyton Orient","Luton Town","Mansfield Town","Milton Keynes Dons","Notts County","Oxford United","Peterborough United","Plymouth Argyle","Reading","Sheffield Wednesday","Stevenage","Stockport County","Wigan Athletic","Wycombe Wanderers"],"League Two":["Accrington Stanley","Barnet","Bristol Rovers","Cheltenham Town","Chesterfield","Colchester United","Crawley Town","Crewe Alexandra","Exeter City","Fleetwood Town","Gillingham","Grimsby Town","Newport County","Northampton Town","Oldham Athletic","Port Vale","Rochdale","Rotherham United","Salford City","Shrewsbury Town","Swindon Town","Tranmere Rovers","Walsall","York City"],"Premier League":["AFC Bournemouth","Arsenal","Aston Villa","Brentford","Brighton & Hove Albion","Chelsea","Coventry City","Crystal Palace","Everton","Fulham FC","Hull City","Ipswich Town","Leeds United","Liverpool","Manchester City","Manchester United","Newcastle United","Nottingham Forest","Sunderland","Tottenham Hotspur"],"La Liga":["Atlético Madrid","CA Osasuna","Deportivo A Coruña","Deportivo Alavés","Elche CF","FC Barcelona","Getafe CF","Levante UD","Málaga","RC Celta","RCD Espanyol","Racing Santander","Rayo Vallecano","Real Betis Balompié","Real Madrid","Real Sociedad","Sevilla FC","Valencia CF","Villarreal CF"],"La Liga 2":["Albacete","Almería","Burgos","Castellón","Celta Fortuna","Ceuta","Cádiz","Córdoba","Eldense","FC Andorra","Girona FC","Granada","Las Palmas","Leganés","RCD Mallorca","Real Oviedo","Real Sociedad II","Real Valladolid","SD Eibar","Sabadell","Sporting Gijón","Tenerife"],"2. Bundesliga":["1. FC Heidenheim 1846","DSC Arminia Bielefeld","Darmstadt 98","Dynamo Dresden","Eintracht Braunschweig","Energie Cottbus","FC St. Pauli","Hannover 96","Hertha BSC","Holstein Kiel","Kaiserslautern","Karlsruher SC","Magdeburg","Nürnberg","Osnabrück","SpVgg Greuther Fürth","VfL Bochum 1848","VfL Wolfsburg"],"Bundesliga":["1. FC Köln","1. FC Union Berlin","1. FSV Mainz 05","Bayer 04 Leverkusen","Borussia Dortmund","Borussia Mönchengladbach","Eintracht Frankfurt","Elversberg","FC Augsburg","FC Bayern München","Hamburger SV","Paderborn","RB Leipzig","SC Freiburg","SV Werder Bremen","Schalke 04","TSG 1899 Hoffenheim","VfB Stuttgart"],"Ligue 1":["AJ Auxerre","AS Monaco","Angers SCO","FC Lorient","Le Havre AC","Le Mans","Lille OSC","OGC Nice","Olympique Lyonnais","Olympique de Marseille","Paris FC","Paris Saint-Germain","RC Lens","RC Strasbourg Alsace","Stade Brestois 29","Stade Rennais FC","Toulouse FC","Troyes"],"Ligue 2":["Annecy","Boulogne","Clermont","Dijon","Dunkerque","FC Metz","FC Nantes","Grenoble Foot 38","Guingamp","Laval","Montpellier","Nancy","Pau","Red Star","Reims","Rodez","Saint-Étienne","Sochaux"],"Eredivisie":["ADO Den Haag","AZ Alkmaar","Ajax","Excelsior","FC Groningen","FC Twente","FC Utrecht","Feyenoord","Fortuna Sittard","Go Ahead Eagles","NEC Nijmegen","PEC Zwolle","PSV","SC Cambuur","SC Heerenveen","Sparta Rotterdam","Telstar","Willem II"],"Primeira Liga":["Academico Viseu","Alverca","CD Nacional","Casa Pia","Estrela da Amadora","FC Arouca","FC Porto","Famalicão","GD Estoril Praia","Gil Vicente FC","Marítimo","Moreirense FC","Rio Ave FC","SL Benfica","Santa Clara","Sporting CP","Sporting Clube de Braga","Vitória Guimarães"],"Pro League":["Cercle Brugge KSV","Club Brugge KV","KAA Gent","KRC Genk","KV Kortrijk","KV Mechelen","KVC Westerlo","Lommel SK","Oud-Heverlee Leuven","RAAL La Louvière","RSC Anderlecht","Royal Antwerp FC","Royal Charleroi Sporting Club","SK Beveren","SV Zulte Waregem","Sint-Truidense VV","Standard de Liège","Union Saint-Gilloise"],"Süper Lig":["Alanyaspor","Amed SK","Beşiktaş JK","Erzurumspor FK","Eyüpspor","Fenerbahçe SK","Galatasaray SK","Gaziantep FK","Gençlerbirliği SK","Göztepe SK","Kasımpaşa SK","Kocaelispor","Konyaspor","Medipol Başakşehir FK","Samsunspor","Trabzonspor","Çaykur Rizespor","Çorum FK"],"Saudi Pro League":["Abha","Al Ahli SFC","Al Draih","Al Ettifaq","Al Faisaly","Al Fateh","Al Fayha","Al Hazem FC","Al Hilal","Al Ittihad","Al Khaleej","Al Kholood","Al Nassr","Al Qadsiah FC","Al Riyadh","Al Shabab","Al Taawoun FC","NEOM SC"],"Liga Profesional":["Argentinos Juniors","Atlético Tucumán","Barracas Central","Belgrano","Boca Juniors","CA Aldosivi","CA Banfield","Central Cordoba SdE","Club Atlético Sarmiento","Club Atlético Unión","Defensa y Justicia","Deportivo Riestra","Estudiantes de La Plata","Estudiantes de Río Cuarto","Gimnasia y Esgrima La Plata","Gimnasia y Esgrima Mendoza","Huracán","Independiente","Independiente Rivadavia","Instituto Atlético Central Córdoba","Lanús","Newell's Old Boys","Platense","Racing Club","River Plate","Rosario Central","San Lorenzo de Almagro","Talleres","Tigre","Vélez Sarsfield"],"Bundesliga austriaca":["Austria Lustenau","FC Red Bull Salzburg","FK Austria Wien","Grazer AK 1902","LASK Linz","SC Rheindorf Altach","SK Rapid","SK Sturm Graz","SV Ried","TSV Hartberg","WSG Tirol","Wolfsberger AC"],"Brasileirão Série A":["Athletico PR","Atlético Mineiro","Bahia","Botafogo","Bragantino","Chapecoense","Corinthians","Coritiba","Cruzeiro","Flamengo","Fluminense","Grêmio","Internacional","Mirassol","Palmeiras","Remo","Santos","São Paulo","Vasco da Gama","Vitória SC"],"Brasileirão Série B":["América Mineiro","Athletic Club","Atlético GO","Avaí","Botafogo SP","CRB","Ceará","Criciúma","Cuiabá","Fortaleza","Goiás","Juventude","Londrina","Novorizontino","Náutico","Operário PR","Ponte Preta","Sport Recife","São Bernardo","Vila Nova"],"Brasileirão Série C":["Amazonas","Anápolis","Barra FC","Botafogo PB","Brusque","Caxias","Confiança","Ferroviária","Figueirense","Floresta","Guaraní","Inter de Limeira","Itabaiana","Ituano","Maranhão","Maringá","Paysandu","Santa Cruz","Volta Redonda","Ypiranga Erechim"],"Super League Cina":["Beijing Guoan","Chengdu Rongcheng","Chongqing Tonglianglong FC","Dalian Yingbo","Henan FC","Liaoning Tieren FC","Qingdao Hainiu FC","Qingdao West Coast FC","Shandong Taishan","Shanghai Port","Shanghai Shenhua","Shenzhen Peng City","Tianjin Jinmen Tiger","Wuhan Three Towns","Yunnan Yukun","Zhejiang FC"],"K League 1":["Bucheon 1995","Daejeon Citizen","FC Anyang","FC Seoul","Gangwon FC","Gimcheon Sangmu FC","Gwangju FC","Incheon United","Jeju United FC","Jeonbuk Hyundai Motors","Pohang Steelers","Ulsan HD FC"],"1. HNL":["Dinamo Zagreb","Gorica","Hajduk Split","Istra 1961","Lokomotiva Zagreb","Osijek","Rijeka","Rudeš","Slaven Koprivnica","Varaždin"],"Superliga":["AGF","Brøndby IF","FC København","FC Midtjylland","FC Nordsjælland","Horsens","Lyngby Boldklub","Odense Boldklub","Randers FC","Silkeborg IF","Sønderjyske Fodbold","Viborg FF"],"Premier League Egitto":["Abu Qir Fertilizers","Al Ahly","Al Masry","Arab Contractors FC","Asyut Petrol","Ceramica Cleopatra","ENPPI","El Geish","El Gounah","Ghazl El Mehalla","Modern Sport FC","National Bank of Egypt","Olympic El Qanah","Petrojet","Pyramids FC","Smouha","Wadi Degla","ZED FC","Zamalek"],"J1 League":["Avispa Fukuoka","Cerezo Osaka","FC Tokyo","Fagiano Okayama","Gamba Osaka","JEF United","Kashima Antlers","Kashiwa Reysol","Kawasaki Frontale","Kyoto Sanga","Machida Zelvia","Mito Hollyhock","Nagoya Grampus","Sanfrecce Hiroshima","Shimizu S-Pulse","Tokyo Verdy","Urawa Reds","V-Varen Nagasaki","Vissel Kobe","Yokohama F. Marinos"],"Super League":["AEK Athens","Aris","Asteras Tripolis","Atromitos","Iraklis Thessaloniki","Kalamata","Kifisia","Levadiakos","OFI","Olympiacos FC","PAOK","Panaitolikos","Panathinaikos FC","Volos NFC"],"Liga MX":["América de Cali","Atlante","Atlas","Atlético San Luis","Cruz Azul","Guadalajara","Juárez","León","Monterrey","Necaxa","Pachuca","Puebla","Pumas UNAM","Querétaro","Santos Laguna","Tigres UANL","Tijuana","Toluca"],"Eliteserien":["Aalesund","FK Bodø/Glimt","Fredrikstad FK","Hamarkameratene","KFUM-Kameratene Oslo","Kristiansund BK","Lillestrøm","Molde FK","Rosenborg BK","SK Brann","Sandefjord Fotball","Sarpsborg 08 FF","Start","Tromsø IL","Viking FK","Vålerenga Fotball"],"Ekstraklasa":["Cracovia","GKS Katowice","Górnik Zabrze","Jagiellonia Białystok","Korona Kielce","Lech Poznań","Legia Warszawa","Motor Lublin","Piast Gliwice","Pogoń Szczecin","Radomiak Radom","Raków Częstochowa","Widzew Łódź","Wieczysta Kraków","Wisła Kraków","Wisła Płock","Zagłębie Lubin","Śląsk Wrocław"],"Premier League Russia":["Akhmat Grozny","Akron","Baltika Kaliningrad","CSKA Moskva","Dinamo Moskva","Dynamo Makhachkala","Fakel","Krasnodar","Krylya Sovetov","Lokomotiv Moskva","Orenburg","Rodina Moskva","Rostov","Rubin Kazan","Spartak Moskva","Zenit"],"Premiership scozzese":["Aberdeen","Celtic","Dundee FC","Dundee United FC","Falkirk","Hearts","Hibernian","Kilmarnock","Motherwell FC","Rangers FC","St. Johnstone","St. Mirren"],"MLS":["Atlanta United","Austin FC","CF Montréal","Charlotte FC","Chicago Fire","Colorado Rapids","Columbus Crew","DC United","FC Cincinnati","FC Dallas","Houston Dynamo","Inter Miami","LA Galaxy","Los Angeles FC","Minnesota United FC","Nashville SC","New England Revolution","New York City FC","New York Red Bulls","Orlando City SC","Philadelphia Union","Portland Timbers","Real Salt Lake","San Diego FC","San Jose Earthquakes","Seattle Sounders FC","Sporting Kansas City","St. Louis CITY SC","Toronto FC","Vancouver Whitecaps FC"],"Allsvenskan":["AIK","BK Häcken","Degerfors IF","Djurgårdens IF","GAIS","Halmstads BK","Hammarby Fotboll","IF Brommapojkarna","IF Elfsborg","IFK Göteborg","IK Sirius","Kalmar","Malmö FF","Mjällby AIF","Västerås SK","Örgryte"],"Super League Svizzera":["BSC Young Boys","FC Basel 1893","FC Lausanne-Sport","FC Lugano","FC Luzern","FC Sion","FC St.Gallen 1879","FC Thun","FC Zürich","Grasshopper Club Zürich","Servette FC","Vaduz"],"Premier League Ucraina":["Bukovyna Chernivtsi","Chornomorets","Dynamo Kyiv","Epitsentr Dunayivtsi","Karpaty","Kolos Kovalivka","Kryvbas Kryvyi Rih","Kudrivka","LNZ Cherkasy","Livyi Bereh","Metalist 1925 Kharkiv","Obolon'-Brovar","Polissya Zhytomyr","Shakhtar Donetsk","Veres","Zorya Luhansk"]}, PAESI = {"Serie A":"Italia","Serie B":"Italia","Serie C - Girone A":"Italia","Serie C - Girone B":"Italia","Serie C - Girone C":"Italia","Serie D - Girone A":"Italia","Serie D - Girone C":"Italia","Serie D - Girone D":"Italia","Serie D - Girone E":"Italia","Serie D - Girone F":"Italia","Serie D - Girone G":"Italia","Serie D - Girone H":"Italia","Serie D - Girone I":"Italia","Championship":"Inghilterra","League One":"Inghilterra","League Two":"Inghilterra","Premier League":"Inghilterra","La Liga":"Spagna","La Liga 2":"Spagna","2. Bundesliga":"Germania","Bundesliga":"Germania","Ligue 1":"Francia","Ligue 2":"Francia","Eredivisie":"Olanda","Primeira Liga":"Portogallo","Pro League":"Belgio","Süper Lig":"Turchia","Saudi Pro League":"Arabia Saudita","Liga Profesional":"Argentina","Bundesliga austriaca":"Austria","Brasileirão Série A":"Brasile","Brasileirão Série B":"Brasile","Brasileirão Série C":"Brasile","Super League Cina":"Cina","K League 1":"Corea del Sud","1. HNL":"Croazia","Superliga":"Danimarca","Premier League Egitto":"Egitto","J1 League":"Giappone","Super League":"Grecia","Liga MX":"Messico","Eliteserien":"Norvegia","Ekstraklasa":"Polonia","Premier League Russia":"Russia","Premiership scozzese":"Scozia","MLS":"Stati Uniti","Allsvenskan":"Svezia","Super League Svizzera":"Svizzera","Premier League Ucraina":"Ucraina"}, ORDINE = ["Italia","Inghilterra","Spagna","Germania","Francia","Olanda","Portogallo","Belgio","Turchia","Arabia Saudita","Argentina","Austria","Brasile","Cina","Corea del Sud","Croazia","Danimarca","Egitto","Giappone","Grecia","Messico","Norvegia","Polonia","Russia","Scozia","Stati Uniti","Svezia","Svizzera","Ucraina"];

var vive = 0;
for (var lg in NUOVE) {
  var club = NUOVE[lg].filter(function(c){ return !!EADB[c]; });
  if (!club.length) continue;
  LEAGUES[lg] = club;
  if (typeof LEAGUE_COUNTRY !== 'undefined') LEAGUE_COUNTRY[lg] = PAESI[lg];
  vive++;
}
/* i gironi ora si chiamano come li cerca il motore del gioco */
try {
  if (typeof SA_CLUBS !== 'undefined' && LEAGUES['Serie A']) {
    SA_CLUBS.length = 0;
    LEAGUES['Serie A'].forEach(function(c){ SA_CLUBS.push(c); });
  }
} catch(e){}

/* --- stile proprio: la griglia vecchia era larga 860px e non scorreva - */
var st = document.createElement('style');
st.id = 'kfm-pick-css';
st.textContent =
  '.kfm-pick{position:fixed;inset:0;overflow-y:auto;overflow-x:hidden;padding:34px 40px 60px;' +
    'box-sizing:border-box;-webkit-overflow-scrolling:touch}' +
  '.kfm-pick .kfm-head{text-align:center;margin-bottom:26px}' +
  '.kfm-pick .kfm-t{font-family:Anton,Oswald,Inter,sans-serif;font-size:clamp(26px,3.4vw,44px);' +
    'color:#fff;letter-spacing:.01em;margin:0 0 6px}' +
  '.kfm-pick .kfm-s{color:rgba(255,255,255,.68);font-size:14px;margin:0}' +
  '.kfm-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));' +
    'gap:14px;max-width:1560px;margin:0 auto 28px}' +
  '.kfm-c{background:#fff;border-radius:16px;padding:18px 12px;text-align:center;cursor:pointer;' +
    'transition:transform .14s,box-shadow .14s;box-shadow:0 6px 18px rgba(0,0,0,.18)}' +
  '.kfm-c:hover{transform:translateY(-3px);box-shadow:0 12px 26px rgba(0,0,0,.28)}' +
  '.kfm-c .kfm-b{height:56px;display:flex;align-items:center;justify-content:center;margin-bottom:10px}' +
  '.kfm-c .kfm-b img{max-height:46px;max-width:74px;object-fit:contain}' +
  '.kfm-c .kfm-n{font-family:Oswald,Inter,sans-serif;font-weight:700;font-size:16px;color:#0d1b2a;line-height:1.2}' +
  '.kfm-c .kfm-m{font-size:12px;color:#6b7c92;margin-top:4px}' +
  '.kfm-back{display:block;margin:0 auto;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.25);' +
    'color:#fff;border-radius:999px;padding:11px 26px;font-size:13px;cursor:pointer}' +
  '.kfm-back:hover{background:rgba(255,255,255,.2)}' +
  '@media(max-width:760px){.kfm-pick{padding:22px 14px 50px}' +
    '.kfm-grid{grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px}' +
    '.kfm-c{padding:13px 8px}.kfm-c .kfm-b{height:42px}.kfm-c .kfm-b img{max-height:34px}' +
    '.kfm-c .kfm-n{font-size:14px}}';
document.head.appendChild(st);

function esc(s){ return String(s).replace(/'/g, "\\'").replace(/</g,'&lt;'); }
function bandiera(p){
  var m={'Italia':'it','Inghilterra':'gb-eng','Spagna':'es','Germania':'de','Francia':'fr',
    'Olanda':'nl','Portogallo':'pt','Belgio':'be','Turchia':'tr','Arabia Saudita':'sa',
    'Argentina':'ar','Austria':'at','Brasile':'br','Cina':'cn','Corea del Sud':'kr',
    'Croazia':'hr','Danimarca':'dk','Egitto':'eg','Giappone':'jp','Grecia':'gr',
    'Messico':'mx','Norvegia':'no','Polonia':'pl','Russia':'ru','Scozia':'gb-sct',
    'Stati Uniti':'us','Svezia':'se','Svizzera':'ch','Ucraina':'ua'};
  return m[p] ? 'https://flagcdn.com/w160/' + m[p] + '.png' : '';
}
function legheDi(paese){
  var o=[]; for (var lg in PAESI) if (PAESI[lg]===paese && LEAGUES[lg]) o.push(lg); return o;
}

/* il filtro che increspa le bandiere: feTurbulence disegna il rumore,
   feDisplacementMap ci sposta sopra i pixel dell'immagine */
var ONDA = '<svg class="nz-defs" width="0" height="0" aria-hidden="true">' +
  '<filter id="kfm-onda" x="-12%" y="-12%" width="124%" height="124%" color-interpolation-filters="sRGB">' +
    '<feTurbulence type="fractalNoise" baseFrequency="0.009 0.021" numOctaves="2" seed="7" result="n"/>' +
    '<feDisplacementMap in="SourceGraphic" in2="n" scale="9" xChannelSelector="R" yChannelSelector="G"/>' +
  '</filter></svg>';
var CHEVRON = '<svg width="8" height="13" viewBox="0 0 8 13" fill="none" aria-hidden="true">' +
  '<path d="M6.5 1.5 1.5 6.5l5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="square"/></svg>';

function testata(occhiello, titolo, sotto){
  return '<div class="nz-head">' +
    '<div class="nz-eyebrow"><i class="nz-dash"></i><span>' + occhiello + '</span></div>' +
    '<h1 class="nz-title">' + titolo + '</h1>' +
    '<p class="nz-sub">' + sotto + '</p></div>';
}
function guscio(dentro){
  return '<div class="nz-screen">' + ONDA +
    '<div class="nz-bg" id="nz-bg"></div><div class="nz-veil"></div>' + dentro + '</div>';
}

function schermataNazioni(){
  var c = ORDINE.map(function(p){
    var l = legheDi(p); if (!l.length) return '';
    var sq = 0; l.forEach(function(x){ sq += LEAGUES[x].length; });
    var f = bandiera(p);
    return '<button type="button" class="nz-card" onclick="kfmPaese(\'' + esc(p) + '\')">' +
      (f ? '<span class="nz-flag"><img src="' + f + '" alt=""></span>' : '') +
      '<i class="nz-mira"></i>' +
      '<span class="nz-name">' + p + '</span>' +
      '<span class="nz-meta">' + l.length + (l.length===1?' campionato':' campionati') +
      ' \u00b7 ' + sq + ' squadre</span></button>';
  }).join('');
  return guscio(
    testata('Campionati', 'In quale nazione vuoi giocare?', 'Scegli il paese, poi il campionato.') +
    '<div class="nz-grid" id="nz-grid">' + c + '</div>' +
    '<div class="nz-foot"><button type="button" class="nz-back" onclick="S.screen=\'choice\';render()">' +
      CHEVRON + 'Indietro</button></div>');
}

function schermataCampionati(paese){
  var c = legheDi(paese).map(function(lg){
    var crest='', fb='';
    try { crest = (typeof getLeagueLogo==='function' && getLeagueLogo(lg)) || ''; } catch(e){}
    try { fb = (typeof leagueFallbackLogo==='function' && leagueFallbackLogo(lg)) || ''; } catch(e){}
    if (!crest) crest = fb || bandiera(paese);
    return '<button type="button" class="nz-card is-lega" onclick="pickLeague(\'' + esc(lg) + '\')">' +
      '<span class="nz-crest"><img src="' + crest + '" alt=""' +
        (fb ? ' onerror="this.onerror=null;this.src=\'' + fb + '\'"' : '') + '></span>' +
      '<i class="nz-mira"></i>' +
      '<span class="nz-name">' + lg + '</span>' +
      '<span class="nz-meta">' + LEAGUES[lg].length + ' squadre</span></button>';
  }).join('');
  return guscio(
    testata(paese, 'In quale campionato vuoi giocare?', 'Entrerai al posto di una squadra che sceglierai tu.') +
    '<div class="nz-grid" id="nz-grid">' + c + '</div>' +
    '<div class="nz-foot"><button type="button" class="nz-back" onclick="kfmPaese(null)">' +
      CHEVRON + 'Cambia nazione</button></div>');
}

window.kfmPaese = function(p){
  window.__kfmPaese = p || null;
  if (typeof render === 'function') render();
  try { var a=document.getElementById('app'); if(a){ var w=a.querySelector('.nz-grid'); if(w) w.scrollTop=0; } } catch(e){}
};

var vecchio = window.render;
window.render = function(){
  var r = vecchio.apply(this, arguments);
  try {
    if (S && S.screen === 'league') {
      var app = document.getElementById('app');
      if (app) {
        app.innerHTML = window.__kfmPaese ? schermataCampionati(window.__kfmPaese) : schermataNazioni();
        /* stesso sfondo per i due passi: la nazione non e' ancora un
           campionato, quello arriva alla scelta della squadra */
        if (typeof tsSfondo === 'function') tsSfondo('nz-bg', 'src/assets/bg-nazioni');
      }
    } else { window.__kfmPaese = null; }
  } catch(e){}
  return r;
};
try { if (window.console && console.info) console.info('[KFM] ' + vive + ' campionati caricati'); } catch(e){}
})();
