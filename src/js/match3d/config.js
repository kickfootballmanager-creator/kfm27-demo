// Tutti i numeri della partita 3D. Unita': metri, secondi, radianti.
// Assi: X lungo il campo, Z in larghezza, Y in alto, centro campo nell'origine.

export const PITCH = {
  length: 105,
  width: 68,
  runoff: 6,              // erba oltre le linee, fino ai cartelloni
  lineWidth: 0.12,
  centerCircle: 9.15,
  penaltyDepth: 16.5,
  penaltyWidth: 40.32,
  goalAreaDepth: 5.5,
  goalAreaWidth: 18.32,
  penaltySpot: 11,
  cornerArc: 1,
  grassTileMeters: 6,     // lato di una ripetizione della texture erba
  stripes: 20,            // bande di taglio dell'erba lungo tutto il campo
  stripeAlpha: 0.055,
  boardHeight: 0.9,
  boardDepth: 0.2
};

export const GOAL = {
  width: 7.32,
  height: 2.44,
  depth: 2.0,
  postRadius: 0.06,
  netCell: 0.12,
  postRestitution: 0.7,
  netDamping: 9,          // 1/s: la rete "beve" la velocita' della palla
  netBounce: 0.12,        // quanta velocita' resta quando la palla tocca la rete
  outerNetBounce: 0.3     // palla che colpisce la rete da fuori
};

export const BALL = {
  radius: 0.11,           // 22 cm di diametro, disegnata a grandezza vera
  gravity: 9.81,
  airDrag: 0.013,         // resistenza quadratica: a = -k |v| v
  rollFriction: 1.6,      // m/s^2 costanti quando rotola
  rollDrag: 0.05,         // 1/s: a 26 m/s la palla perde 2,9 m/s^2, a 8 m/s 2
  restitution: 0.6,       // rimbalzo verticale
  bounceKeep: 0.82,       // velocita' orizzontale conservata al rimbalzo
  minBounce: 0.6,         // sotto questa velocita' verticale smette di rimbalzare
  spinForce: 0.9,         // spinta laterale per unita' di spin
  spinDecay: 0.7,         // 1/s
  boardRestitution: 0.35,
  stopSpeed: 0.05
};

export const PHYSICS = {
  hz: 60,
  maxSteps: 5             // passi massimi per frame dopo un blocco lungo
};

export const KICK = {
  maxSpeed: 34,
  groundMin: 14,          // rasoterra: mai piu' lento di cosi', neanche da vicino
  groundMax: 26
};

export const PLAYER = {
  radius: 0.34,           // ingombro per le collisioni fra giocatori
  jogFactor: 0.74,        // corsa normale rispetto alla velocita' massima
  decel: 15,              // m/s^2 quando si molla il joystick, alla velocita' massima
  decelLow: 0.45,         // frazione della frenata vicino a fermi: l'arresto si ammorbidisce
  accelLow: 1.35,         // spinta alla partenza rispetto all'accelerazione media...
  accelHigh: 0.55,        // ...e vicino alla velocita' massima
  coastDecel: 5,          // chi ha appena passato finisce la corsa rallentando
  faceTurn: 2,            // rotazione del busto verso la palla rispetto alla sterzata
  faceGain: 14,           // 1/s: il busto insegue la direzione voluta come una molla...
  faceAccel: 70,          // ...con un'accelerazione angolare massima (rad/s^2): niente scatti
  strafeSpeed: 0.6,       // corsa laterale o all'indietro: frazione della velocita' massima
  closeSpeed: 0.55,       // controllo stretto (R2): frazione della velocita'
  turnSlowBoost: 2,       // da fermo si gira fino a 3 volte piu' in fretta
  turnBrake: 0.35,        // velocita' minima conservata in una curva a 90 gradi
  runBack: [6, 22, 0.35],  // a gioco fermo verso il proprio posto: corsa oltre 6 m, scatto oltre 22, sotto al passo (frazione)
  fieldMargin: 0.6,       // distanza minima dai cartelloni
  ringInner: 0.62,
  ringOuter: 0.8,
  targetRingInner: 0.7,
  targetRingOuter: 0.8
};

// Palla al piede: distanza dal centro del giocatore (m). Il piede sta circa
// 0,1 m avanti al centro, quindi la palla resta fra 0,4 e 0,7 m dal piede.
// In corsa la palla si tocca col destro appena prima che appoggi (fase del
// passo, anim.js): si allunga di `swing` e il giocatore la riprende al tocco dopo.
export const DRIBBLE = {
  rest: 0.5,              // da fermo
  touch: [0.46, 0.56],    // al tocco, davanti alla punta del destro: al passo, in scatto
  swing: [0.14, 0.5],     // quanto si allunga dopo il tocco: al passo, in scatto
  closeSwing: 0.45,       // controllo stretto (R2): tocchi piu' corti
  kick: 0.5,              // durante un calcio: la palla davanti al piede che calcia
  touchPhase: 0.94,       // fase del passo del tocco (0 = appoggio del destro)
  push: 0.7,              // forma dell'allungo: <1 la palla scatta via subito e poi rallenta
  moveFrom: 0.3,          // m/s: sotto, palla ferma davanti ai piedi
  moveFull: 1.6,
  side: 0.1,              // spostata verso il piede destro, quello che tocca
  turnRate: 14,           // rad/s: la palla gira attorno al giocatore, mai attraverso le gambe
  follow: 22,             // 1/s: quanto in fretta la distanza si adegua
  maxRel: 9               // m/s: velocita' massima della palla rispetto al giocatore
};

export const CONTROL = {
  deadzone: 0.15,
  trapRadius: 1.0,        // distanza a cui un giocatore controlla una palla libera
  receiveRadius: 1.25,    // il destinatario la controlla sempre entro questa distanza
  trapHeight: 1.5,
  trapSpeed: 28,          // palla libera: oltre questa velocita' relativa passa
  kickLock: 0.35,         // chi ha appena calciato non la ricontrolla subito
  reach: 1.3,             // palla abbastanza vicina per un tiro o passaggio al volo
  buffer: 0.4,            // un comando dato un attimo prima di ricevere vale lo stesso
  doubleTap: 0.3,         // difesa: X due volte entro tanti secondi = contrasto
  zones: [6, 3],          // cambio automatico: fasce lungo il campo e in larghezza
  switchMargin: 2,        // si cambia solo se il nuovo e' piu' vicino di tanti metri
  switchCone: 1.1         // levetta destra: semiapertura del cono di ricerca (rad)
};

// Pressione prolungata: potenza 0..1 per passaggio, filtrante, cross e tiro.
export const POWER = {
  chargeTime: 1.0,        // secondi per arrivare al massimo
  barHide: 0.45           // secondi in cui la barra resta visibile dopo il calcio
};

// Ricezione: il ricevente corre sul punto d'intercetto e ignora il joystick
// fino al primo tocco.
export const RECEIVE = {
  step: 1 / 30,           // passo della previsione della traiettoria
  horizon: 5,             // secondi di traiettoria previsti
  reaction: 0.05,
  faceDist: 6,            // sotto questa distanza dalla palla il ricevente la guarda
  timeout: 6              // passaggio che nessuno raggiunge: dopo 6 s il joystick torna libero
};

// Primo tocco orientato: con il joystick lontano dal busto il ricevente
// sposta subito la palla da quella parte e si gira con lei, senza perderla.
export const FIRST_TOUCH = {
  minAngle: 0.5,          // rad fra joystick e busto oltre cui il tocco orienta
  turn: 0.6,              // frazione della rotazione fatta subito dal busto
  receiveBelow: 1.5       // sotto questa velocita' si vede l'animazione di ricezione
};

// Potenza = distanza, come in PES: la barra sceglie quale compagno raggiungere
// nel cono della levetta (poca potenza il piu' vicino, piena il piu' lontano) e
// la velocita' della palla cresce con la potenza e con la distanza.
export const PASS = {
  cone: 0.7,              // semiapertura del cono di ricerca (rad)
  coneNoStick: 1.2,       // joystick fermo: si cerca in un cono piu' largo davanti al giocatore
  minDist: 3,
  maxDist: 55,
  wAngle: 1,              // pesi del punteggio: piu' basso e' meglio
  wReach: 1.6,            // distanza del compagno lontana da quella chiesta dalla potenza
  reachSpan: 8,           // metri minimi fra "vicino" e "lontano" per il peso qui sopra
  wFree: 0.35,
  freeRadius: 8,          // un avversario entro questa distanza "copre" il compagno
  lead: 0.6,              // frazione del movimento del compagno anticipata dal passaggio
  speedMin: 14,           // m/s: tocco leggero verso il compagno vicino
  speedMax: 26,           // m/s: potenza piena verso il compagno lontano
  speedPower: 0.55,       // quota della velocita' decisa dalla potenza
  speedDist: 0.45,        // quota decisa dalla distanza
  speedDistRef: 45,       // a questa distanza la quota della distanza e' piena
  pressBoost: 2,          // m/s in piu' se passatore o ricevente sono pressati
  arriveMin: 6,           // la palla arriva sempre almeno a questa velocita'
  blindDist: [8, 30],     // nessun compagno nel cono: spazio a potenza zero e piena
  speedError: 0.08        // errore relativo sulla forza, scalato dall'attributo
};

// Filtrante: rasoterra nello spazio davanti al compagno che corre. La potenza
// decide quanto lontano nello spazio.
export const THROUGH = {
  cone: 0.9,
  lead: [4, 16],          // metri davanti alla corsa del compagno, a potenza zero e piena
  arrive: [4, 10],        // m/s con cui arriva nello spazio: ci corre sopra il compagno
  speedMin: 12,
  speedMax: 26,
  wReach: 1.1,            // come nel passaggio la barra sceglie anche il compagno, ma conta lo spazio
  wSpace: 0.8,            // peso dello spazio libero davanti al compagno
  goalGap: 7              // il punto d'arrivo resta almeno a tanti metri dalla linea di porta
};

// Cross dalle fasce verso l'area, lancio lungo altrove. Palla alta che
// atterra sul bersaglio. Nel cross la potenza sceglie il palo, come in PES
// (poca: primo palo, meta': centro, tanta: secondo palo) e alza la parabola.
export const CROSS = {
  wingZ: 14,              // oltre questa distanza dal centro (in larghezza) si e' in fascia
  finalThird: 17,         // e oltre questa coordinata d'attacco si crossa
  nearZ: 2.4,             // primo palo: metri dal centro verso chi crossa
  farZ: -4.2,             // secondo palo: dall'altra parte
  back: [5.5, 10, 7],     // distanza dalla linea di porta: primo palo, centro, secondo palo
  powerLow: 0.1,          // sotto questa potenza sempre primo palo
  powerHigh: 0.9,         // sopra sempre secondo palo
  apex: [2.8, 6.2],       // altezza della parabola, a potenza zero e piena
  longMin: 18,            // lancio: compagni almeno cosi' lontani
  longSpace: [20, 42],    // lancio senza compagni nel cono: nello spazio, a potenza zero e piena
  apexLong: [5, 9],
  cone: 0.8,
  error: 1.3              // errore sul punto d'arrivo (m) a passaggio 0, scalato dall'attributo
};

// Finta (skill_spin_*): il giocatore gira su se stesso con la palla, avanzando
// come nella clip; per questo tempo i contrasti riescono meno.
export const FEINT = {
  rate: 1.15,             // velocita' di riproduzione della clip
  shield: 0.6,            // probabilita' di contrasto riuscito moltiplicata per questo
  endCancel: 0.75         // da questa frazione della clip si puo' gia' passare o tirare
};

// Tiro: la potenza decide la velocita' (da minSpeed all'attributo del
// giocatore) e l'altezza sulla linea di porta; oltre overPower la palla sale
// fino a scavalcare la traversa, come in PES.
export const SHOT = {
  minSpeed: 16,
  height: [0.25, 2.0],    // metri sulla linea di porta: potenza zero, potenza overPower
  overHeight: 2.2,        // metri in piu' a potenza piena
  heightError: 0.45,      // errore d'altezza per radiante d'errore di mira e metro di distanza
  overPower: 0.85,        // oltre questa soglia la mira peggiora e la palla si alza
  overError: 1.6,
  sprintError: 1.35,
  postMargin: 0.45,       // la mira resta dentro i pali di questo margine
  awayDist: 20            // tiro lontano dalla porta: altezza misurata a questa distanza
};

// Attributi 0-99 -> parametri fisici: [valore a ATTR.low, valore a ATTR.high].
export const ATTR = {
  low: 40,
  high: 95,
  fallback: 70,
  speed: [6.5, 9.5],
  accelTime: [1.5, 0.8],  // secondi per arrivare alla velocita' massima
  turnRate: [5.5, 9],     // rad/s senza palla
  turnRateBall: [3.6, 7], // rad/s con la palla
  dribbleSpeed: [0.84, 0.96],
  passError: [0.09, 0.012],
  shotSpeed: [28, 34],    // m/s a potenza piena
  shotError: [0.1, 0.022],
  tackle: [0.25, 0.8]
};

// Moduli del manager (007-fm-oh3.js): x 0-100 da sinistra a destra guardando
// la porta avversaria, y 0-100 dalla porta avversaria alla propria. Servono
// quando la squadra arriva senza `slots` (partita di prova).
export const FORMATIONS = {
  '4-3-3': [[50, 88], [18, 67], [38, 73], [62, 73], [82, 67], [30, 48], [50, 58], [70, 48], [22, 24], [50, 15], [78, 24]],
  '4-2-3-1': [[50, 88], [16, 67], [38, 73], [62, 73], [84, 67], [37, 56], [63, 56], [50, 37], [19, 30], [50, 14], [81, 30]],
  '4-4-2': [[50, 88], [16, 67], [38, 73], [62, 73], [84, 67], [16, 46], [40, 50], [60, 50], [84, 46], [40, 17], [60, 17]],
  '3-5-2': [[50, 88], [30, 74], [50, 77], [70, 74], [11, 50], [35, 54], [50, 60], [65, 54], [89, 50], [40, 16], [60, 16]],
  '4-1-4-1': [[50, 88], [16, 67], [38, 73], [62, 73], [84, 67], [50, 59], [16, 41], [38, 46], [62, 46], [84, 41], [50, 15]],
  '5-3-2': [[50, 89], [10, 60], [30, 74], [50, 77], [70, 74], [90, 60], [32, 50], [50, 55], [68, 50], [40, 18], [60, 18]]
};
export const FORMATION_ROLES = {
  '4-3-3': ['POR', 'TS', 'DC', 'DC', 'TD', 'CC', 'CDC', 'CC', 'AS', 'ATT', 'AD'],
  '4-2-3-1': ['POR', 'TS', 'DC', 'DC', 'TD', 'CDC', 'CDC', 'COC', 'AS', 'ATT', 'AD'],
  '4-4-2': ['POR', 'TS', 'DC', 'DC', 'TD', 'ES', 'CC', 'CC', 'ED', 'ATT', 'ATT'],
  '3-5-2': ['POR', 'DC', 'DC', 'DC', 'ES', 'CC', 'CDC', 'CC', 'ED', 'ATT', 'ATT'],
  '4-1-4-1': ['POR', 'TS', 'DC', 'DC', 'TD', 'CDC', 'AS', 'CC', 'CC', 'AD', 'ATT'],
  '5-3-2': ['POR', 'ES', 'DC', 'DC', 'DC', 'ED', 'CC', 'CDC', 'CC', 'ATT', 'ATT']
};

// Posizioni di squadra: il modulo diventa un blocco che sale, scende e si
// stringe verso la palla. L = linea difensiva (metri, verso d'attacco),
// len = distanza fra difesa e punte, width = mezza larghezza occupata.
export const SHAPE = {
  defY: 73,               // y del modulo che sta sulla linea difensiva
  attY: 15,               // y del modulo che sta sulla linea delle punte
  attack: { lineOffset: -26, lineMin: -40, lineMax: 6, len: 38, width: 30, ballZ: 0.15 },
  defend: { lineScale: 0.55, lineOffset: -14, lineMin: -45, lineMax: -4, len: 26, width: 22, ballZ: 0.4 },
  kickoff: { line: -24, len: 21, width: 28 },
  maxZ: 31                // nessuna posizione oltre questa distanza dal centro in larghezza
};

// Intelligenza artificiale. `difficulty` (0..1) scala reazione, precisione e aggressivita'
// della squadra avversaria; i compagni dell'utente giocano sempre a AI.mateDifficulty.
export const AI = {
  hz: 10,                 // decisioni al secondo
  mateDifficulty: 0.5,
  arrive: 1.2,            // entro questa distanza la posizione e' raggiunta
  sprintDist: 9,          // oltre questa distanza dalla posizione si scatta
  space: { samples: 8, radius: 6, wOpp: 1.4, wLane: 1.2, wHome: 0.08 },
  run: { every: [2.5, 5], depth: 12, max: 2, onside: 0.8 },  // inserimenti: ogni quanto, quanto oltre, quanti insieme; onside: m prima della linea del fuorigioco
  press: { max: 1, maxOwnThird: 2, contain: 1.4, tight: 0.85, delay: [0.45, 0.12] },   // delay: [difficulty 0, 1]; tight: m dalla palla quando stringe
  mark: { radius: 14, goalSide: 1.8 },
  wall: { maxDist: 32, gap: 0.7, postAim: 1.6 },  // barriera: uomini a 0,7 m (piu' dell'ingombro di due giocatori), mirata al palo vicino
  back: { dist: 16 },     // rientro: oltre questa distanza dalla posizione si corre indietro
  carrier: {
    think: [0.7, 0.3],    // secondi fra due decisioni del portatore [difficulty 0, 1]
    shootDist: 25,
    shootMinOpen: 0.25,
    passProgress: 0.05,   // peso dell'avanzamento per metro
    laneSafe: 2.2,        // un avversario piu' vicino di cosi' alla linea di passaggio la rende rischiosa
    pressedAt: 3,         // un avversario entro questa distanza mette pressione
    feintChance: 0.25,
    crossChance: 0.7,
    error: [1.6, 0.8],    // moltiplicatore dell'errore di passaggio e tiro [difficulty 0, 1]
    pressedThink: 0.5,    // sotto pressione decide piu' in fretta
    // protegge la palla: la tiene sul lato lontano dal difensore e rallenta
    protect: { dist: 2.2, mag: 0.45, chance: [0.3, 0.8], shieldSide: 2.2 }
  },
  tackleRate: [0.75, 1.3], // cadenza dei contrasti automatici rispetto a PRESS.autoEvery [difficulty 0, 1]
  slideChance: [0.08, 0.2],
  intercept: { base: 0.3, def: 0.5, speed: 0.012 }    // probabilita' d'intercetto: base + def*attr - speed*v
};

// Contrasto in piedi: affondo breve verso la palla, esito al contatto del piede.
// Manca una clip di contrasto in piedi (tackle e' una caduta dopo un fallo):
// finche' non arriva da Mixamo si usa kickoff, il piede sinistro che va
// avanti sulla palla da fermo, il gesto piu' vicino per significato.
// Secondi della clip: from, contact (piede sinistro piu' veloce), end.
export const TACKLE = {
  clip: 'kickoff',
  from: 0.18,
  contact: 0.517,
  end: 0.567,
  rate: 1.3,
  recover: 0.12,          // secondi reali dopo la fine della clip, prima di tornare a correre
  legReach: 0.95,         // dal centro del giocatore al pallone, gamba tesa
  contactDist: 0.62,      // l'affondo porta il corpo a questa distanza dalla palla
  lunge: 0.75,            // metri massimi dell'affondo verso la palla, oltre lo slancio della corsa
  lungeFrom: 0.04,        // l'affondo va da qui al contatto (secondi)
  lungeSpeed: 5,          // m/s minimi dell'affondo
  poke: 4.5,              // m/s della palla tolta
  keep: 0.45,             // probabilita' di tenerla invece di allontanarla
  lock: 0.35              // chi l'ha appena persa non la riprende subito
};
// secondi reali dall'inizio al contatto del piede, e durata del gesto
TACKLE.hit = (TACKLE.contact - TACKLE.from) / TACKLE.rate;
TACKLE.duration = (TACKLE.end - TACKLE.from) / TACKLE.rate + TACKLE.recover;

// Difesa stile PES: Pressing tenuto porta sul portatore, da vicino marcatura
// stretta (jockey) e contrasto automatico quando distanza e angolo lo permettono.
export const PRESS = {
  lead: 0.35,             // s: si corre dove sara' il portatore fra tanto
  sprintDist: 6,          // oltre questa distanza si scatta anche senza Scatto
  engage: 3.2,            // sotto questa distanza si entra in marcatura stretta
  release: 5.5,           // oltre questa si torna a correre sul portatore
  contain: 1.35,          // distanza di marcatura senza levetta
  minR: 0.9,
  maxR: 2.8,
  jockeySpeed: 4.2,       // m/s attorno al portatore con la levetta
  jockeyMag: 0.55,        // jockey (R2): frazione della corsa, rivolti al portatore
  relax: 2.2,             // 1/s: senza levetta si torna fra portatore e porta
  autoMargin: 0.1,        // metri tenuti di riserva sulla portata del contrasto
  autoAngle: 1.0,         // rad fra il busto e la palla
  autoClose: 0.5,         // sotto questa distanza prevista l'angolo non conta
  autoReact: [0.4, 0.18], // s in marcatura prima del primo contrasto [difesa bassa, alta]
  autoEvery: [1.2, 0.6]   // s fra due contrasti automatici [difesa bassa, alta]
};

// Esito di un contrasto: palla recuperata, il portatore salta l'uomo, fallo.
export const DUEL = {
  win: [0.3, 0.8],        // probabilita' base [difesa bassa, alta]
  dribbleResist: 0.45,    // quanto il dribbling del portatore la riduce
  timing: [0.75, 1.25],   // palla attaccata al piede del portatore / palla lontana
  angle: { front: 1, side: 0.85, back: 0.6 },
  skillGap: 0.4,          // peso della differenza di difficolta' fra le squadre
  manual: 1.05,           // contrasto premuto: poco piu' efficace, molto piu' rischioso
  foul: { auto: 0.04, manual: 0.11, side: 0.05, back: 0.24, speed: 0.012 },
  passFirst: [0.15, 0.5], // IA con palla: la passa prima del contrasto [difficolta' 0, 1]
  quickPass: 0.1,         // secondi fra la decisione e il piede sulla palla
  stagger: { miss: 0.45, beaten: 0.8 }, // secondi sbilanciato dopo un contrasto a vuoto
  staggerManual: 1.4,     // moltiplicatore per il contrasto premuto
  staggerSpeed: 0.45,     // frazione della velocita' massima da sbilanciati
  burst: 0.7,             // chi salta l'uomo accelera per tanti secondi
  burstSpeed: 1.12,
  knock: 1.2              // metri in piu' davanti al piede quando si salta l'uomo
};

// Scivolata: ci si butta nella direzione scelta seguendo la radice della clip.
export const SLIDE = {
  clip: 'slide_tackle', from: 0.05, window: [0.15, 0.85], rate: 1,
  foot: 0.95, reach: 0.85, body: 0.9,
  success: 0.85,          // a contatto con la palla, moltiplicato per la difesa
  knock: 7,               // m/s della palla colpita
  momentum: [0.8, 5, 2.2], // allungo = clamp(a + velocita' / b, 1, c)
  lead: 0.45              // senza joystick si mira dove sara' la palla fra tanti secondi
};

// Chi subisce una scivolata: cade (tripped), resta a terra (down_idle), si rialza.
export const DOWN = {
  fallTravel: 0.6,        // frazione dello spostamento della clip tripped
  groundTime: 0.9,
  getUp: { clip: 'tackle', from: 1.4, to: 2.27 }       // la parte finale del contrasto e' un rialzo da terra
};

// Palloni alti: colpo di testa, rovesciata, al volo.
export const AERIAL = {
  headMin: 1.25, headMax: 2.7,
  jumpAbove: 1.95,        // oltre questa altezza si stacca da terra (header_jump)
  reach: 1.1,             // distanza orizzontale palla-giocatore al contatto
  header: { clip: 'header', from: 0.55, contact: 0.92, end: 1.5 },
  jump: { clip: 'header_jump', from: 0.75, contact: 1.133, end: 1.75 },
  bicycle: { clip: 'bicycle_kick', from: 0.35, contact: 0.75, end: 2.4, min: 0.9, max: 2.2, goalDist: 18, backAngle: 1.9 },
  shotSpeed: [15, 21],    // colpo di testa verso la porta
  passSpeed: 11,
  clearSpeed: 17,
  bicycleSpeed: [22, 28],
  error: 0.12
};

// Portieri.
export const KEEPER = {
  depth: [1.2, 6],        // distanza dalla linea: palla lontana, palla vicina
  depthRange: [45, 12],   // distanza della palla a cui si passa da un valore all'altro
  maxZ: 3.2,              // non si sposta oltre questa distanza dal centro della porta
  react: [0.28, 0.12],    // secondi di reazione a un tiro [difficulty 0, 1]
  penaltyReact: 0.04,     // sul rigore il lato e' gia' scelto: parte subito
  aim: [0.3, 0.06],       // errore (m) sul punto d'intercetto previsto [attributo basso, alto]
  claimDist: 7,           // cross che cade entro questa distanza dalla porta: esce
  rushDist: 16,           // palla libera entro questa distanza: esce a prenderla
  chargeDist: 40,         // uscita chiesta dall'utente: solo con la palla entro tanti metri dalla porta
  holdTime: 1.4,          // secondi con la palla in mano prima del rinvio
  throwMax: 28,           // compagno libero entro questa distanza: rimessa con le mani
  // Parate. Per ogni tiro il portiere cerca, lungo la traiettoria, il punto,
  // la clip e il fotogramma (dentro `window`) in cui i suoi palmi arrivano
  // sulla palla, deformando la clip nel tempo e nello spostamento della
  // radice (scaleA avanti, scaleS di lato); l'IK sulle braccia chiude il resto.
  saves: [
    { name: 'presa', clip: 'gk_catch', from: 0.05, window: [0.25, 0.65], end: 1.2, scaleA: [0, 1.2], scaleS: [0, 1.6], catch: true, bias: 0 },
    { name: 'presa alta', clip: 'gk_catch_high', from: 0.35, window: [0.55, 1.0], end: 2.7, scaleA: [0, 1], scaleS: [0, 2], catch: true, bias: 0.05 },
    { name: 'presa bassa', clip: 'gk_scoop_', from: 0.3, window: [0.55, 0.85], end: 2.5, scaleA: [0, 0.8], scaleS: [0, 1.5], catch: true, bias: 0.05 },
    { name: 'tuffo basso', clip: 'gk_block_', from: 0.3, window: [0.7, 1.4], end: 3.4, scaleA: [0, 1.2], scaleS: [0.5, 1.3], catch: false, bias: 0.1 },
    { name: 'tuffo', clip: 'gk_dive_', from: 0.35, window: [0.6, 1.2], end: 3.2, scaleA: [0, 1.2], scaleS: [0.5, 1.3], catch: false, bias: 0.12 }
  ],
  plan: {
    step: 2,              // punti della traiettoria provati: uno ogni tanti passi di fisica
    horizon: 2,           // secondi di traiettoria
    ahead: 2.2,           // metri davanti al portiere in cui si cerca l'intercetto
    behind: 0.8,          // metri dietro (verso la porta)
    maxY: 3.2,            // punti piu' alti di cosi' non si provano
    rateMax: 1.8,         // la clip si accelera al massimo di tanto
    rateCost: 0.08,       // costo di una clip accelerata o rallentata
    maxResidual: 0.6,     // oltre questo scarto le mani non arrivano: non si prova
    wide: 0.5             // tiro fuori dallo specchio di tanto: si lascia andare
  },
  // Uscite sui palloni alti: presa alta sul posto o in corsa, presa al petto.
  claims: [
    { name: 'uscita alta', clip: 'gk_catch_high', from: 0.35, window: [0.55, 1.0], end: 2.7, scaleA: [0, 1.6], scaleS: [0, 2.2], catch: true, bias: 0 },
    { name: 'uscita in corsa', clip: 'gk_catch_run_', from: 0.9, window: [1.35, 1.75], end: 2.7, scaleA: [0.2, 1.6], scaleS: [0, 3], catch: true, bias: 0.05 },
    { name: 'presa', clip: 'gk_catch', from: 0.05, window: [0.25, 0.65], end: 1.2, scaleA: [0, 1.4], scaleS: [0, 1.8], catch: true, bias: 0.05 }
  ],
  claimPlan: { step: 2, horizon: 3, ahead: 5, behind: 1.5, maxY: 2.5, rateMax: 1.6, rateCost: 0.08, every: 0.12, accept: 0.5 },
  ik: { lead: 0.3, hold: 0.12, fade: 0.25, gap: 0.02, track: 1.6 },   // secondi attorno al contatto; track: m entro cui le mani seguono la palla vera
  catchSpeed: 24,         // presa: sotto questa velocita' la palla resta in mano
  diveCatchSpeed: 15,     // in tuffo si blocca solo sotto questa velocita'
  diveCatch: [0.5, 0.9],  // e con questa probabilita' [attributo basso, alto]
  parryRest: 0.42,        // respinta di mano: velocita' restituita lungo la normale
  bodyRest: 0.25,         // palla sul corpo
  parryLift: [1.5, 3.5],  // m/s verso l'alto dopo una respinta di mano
  lock: 0.35,             // dopo una respinta il portiere non la riprende subito
  palmsCatch: [0.42, 0.65], // per trattenerla i due palmi entro tanti metri dal centro della palla [tuffo, presa]
  // Collisione palla-portiere: sfere sulle ossa vere. [osso, osso verso cui
  // spostarsi, frazione, raggio, mano?]
  body: [
    ['LeftHand', 'LeftHandMiddle1', 0.6, 0.1, true], ['RightHand', 'RightHandMiddle1', 0.6, 0.1, true],
    ['LeftForeArm', 'LeftHand', 0.5, 0.06, true], ['RightForeArm', 'RightHand', 0.5, 0.06, true],
    ['Head', null, 0, 0.12, false], ['Spine2', null, 0, 0.17, false], ['Spine', null, 0, 0.15, false], ['Hips', null, 0, 0.16, false],
    ['LeftUpLeg', 'LeftLeg', 0.5, 0.09, false], ['RightUpLeg', 'RightLeg', 0.5, 0.09, false],
    ['LeftLeg', 'LeftFoot', 0.5, 0.07, false], ['RightLeg', 'RightFoot', 0.5, 0.07, false],
    ['LeftFoot', 'LeftToeBase', 0.5, 0.07, false], ['RightFoot', 'RightToeBase', 0.5, 0.07, false]
  ],
  bodyCheck: 3.5,         // si controllano le sfere solo con la palla entro tanti metri
  // clip: contatto (secondi della clip), fine
  clips: {
    scoop: { clip: 'gk_scoop_', from: 0.45, contact: 0.7, end: 2.0 },
    high: { clip: 'gk_catch_high', from: 0.45, contact: 0.83, end: 2.2 },
    claim: { clip: 'gk_catch_run_', from: 1.0, contact: 1.567, end: 2.5 },
    // palla in mano: fermo nel fotogramma `hold` (due mani al petto), poi il
    // lancio riparte da li'; dal fotogramma oneHand.at la palla segue una mano sola
    throw: { clip: 'gk_throw', hold: 0.5, rate: 1.25, contact: 1.617, end: 2.6, oneHand: { at: 0.72, hand: 'Right' } },
    dropkick: { clip: 'gk_dropkick', from: 0.8, contact: 2.083, end: 3.1, oneHand: { at: 1.05, hand: 'Left' }, drop: 1.5 },
    concede: { clip: 'gk_concede', from: 0, end: 2.9 }
  }
};

export const KIT = {
  home: { primary: '#e8ecf0', secondary: null, shorts: '#1b2230', pattern: 'solid' },
  away: { primary: '#1d4f9c', secondary: null, shorts: '#f2f4f5', pattern: 'solid' },
  // portieri: colori che non si confondono con nessuna divisa di movimento
  keeperHome: { primary: '#2e9e5b', secondary: null, shorts: '#1b2230', socks: '#2e9e5b', pattern: 'solid' },
  keeperAway: { primary: '#e0b52a', secondary: null, shorts: '#1b2230', socks: '#e0b52a', pattern: 'solid' },
  referee: { primary: '#15171b', secondary: null, shorts: '#15171b', socks: '#15171b', pattern: 'solid' }
};

// player.glb: altezza reale, poi scalata da PLAYER.visualScale.
export const MODEL = {
  height: 1.8,
  numberBone: 'Spine2',   // il numero sulla schiena segue quest'osso
  numberHeight: 0.62,     // frazione dell'altezza della maglia
  numberSize: 0.3,        // metri
  numberGap: 0.015,       // distanza dalla stoffa
  // disegni della maglia, in metri nello spazio del modello
  stripeWidth: 0.07,
  centerWidth: 0.08,
  sashWidth: 0.07,
  sleeveX: 0.2,           // oltre questa distanza dal centro comincia la manica
  roughness: 0.8,
  holdGap: 0.02,          // palla in mano: dalla superficie della palla al centro del palmo
  attachRate: 18          // 1/s: palla che passa a una mano sola e si appoggia sul palmo
};

// Animazioni. Locomozione come blend tree continuo per velocita' e direzione:
// le clip in avanti si fondono per velocita' (idle, camminata, corsa, scatto),
// quelle direzionali per l'angolo fra corsa e busto. Tempi d'appoggio dei
// piedi, velocita' naturali e verso di ogni clip si misurano sulle clip al
// caricamento (anim.js, measureGait): tutte le clip hanno la fase 0 quando
// appoggia il piede destro, cosi' nella fusione le gambe non si incrociano.
export const ANIM = {
  // m/s a cui ogni clip in avanti pesa 1: scelte perche' il playback resti
  // vicino a 1 (la corsa lenta va a 2,4 m/s, quella veloce a 4,8).
  speeds: { walk: 1.8, run: 3.3, sprint: 6 },
  forward: ['idle', 'walk', 'run', 'sprint'],
  // corsa guardando altrove: [sinistra, destra], dalla diagonale avanti all'indietro
  sides: [
    ['jog_diag_fwd_left', 'jog_diag_fwd_right'],
    ['strafe_left', 'strafe_right'],
    ['jog_diag_back_left', 'jog_diag_back_right']
  ],
  keeperStep: 'gk_sidestep',  // il portiere di lato, rivolto alla palla
  keeperStepMax: 3.5,     // m/s: oltre, anche il portiere corre di lato come gli altri
  kicks: ['pass', 'shot', 'penalty'],   // clip dei calci: tempi d'appoggio del piede sinistro
  gaitSamples: 48,        // campioni per clip nella misura dei passi
  contactBand: 0.035,     // m sopra la caviglia piu' bassa: il piede e' a terra
  speedBand: 0.02,        // appoggio stretto su cui si misura la velocita' naturale
  minRate: 0.6,           // playback minimo e massimo delle clip di corsa
  maxRate: 2,
  dirMaxRate: 2.1,        // clip direzionali (sono corsette): un po' piu' accelerate
  blend: 9,               // 1/s: filtro dei pesi del blend tree
  angleRate: 7,           // 1/s: filtro dell'angolo fra corsa e busto
  turnStep: 0.45,         // m/s di passo per rad/s di rotazione da fermi: girandosi si fanno piccoli passi
  // Inclinazione di tutto il corpo, dai piedi: nelle curve verso l'interno,
  // in avanti quando accelera, indietro quando frena. rad per m/s^2.
  lean: { roll: 0.02, maxRoll: 0.2, pitch: 0.012, maxPitch: 0.07, maxBack: 0.05, rate: 8 },
  // Piedi fermi a terra nell'appoggio (IK sulle gambe), finche' la clip non
  // li porterebbe troppo lontano.
  footLock: { on: true, maxSpeed: 3.6, minMove: 0.25, ramp: 0.08, release: 0.12, drift: 0.22, liftEarly: 0.25 },
  fadeIn: 0.15,           // cross-fade verso un gesto (0,15-0,25 s)
  fadeOut: 0.22,
  syncMinSpeed: 1.2,      // sotto questa velocita' il calcio parte dall'inizio, senza cercare il passo
  minLead: 0.1,           // secondi minimi fra l'inizio della clip e il contatto del piede
  // Secondi della clip: si parte da `start`, la palla parte a `contact`, il
  // fotogramma in cui il piede destro e' piu' veloce (player.motion.json).
  // Di prima la clip parte `firstTime` secondi prima del contatto.
  // `early`: da qui al massimo si puo' anticipare l'inizio per agganciare il passo.
  pass: { clip: 'pass', start: 0.2, early: 0.04, contact: 0.417, recover: 0.3, moveMag: 0.35, turn: 4 },
  through: { clip: 'pass', start: 0.2, early: 0.04, contact: 0.417, recover: 0.3, moveMag: 0.35, turn: 4 },
  cross: { clip: 'pass', start: 0.15, early: 0.04, contact: 0.417, recover: 0.35, moveMag: 0.3, turn: 4 },
  shot: { clip: 'shot', start: 0.2, early: 0.02, contact: 0.45, recover: 0.4, moveMag: 0.3, turn: 4 },
  firstTime: 0.08,
  recoverMove: 0.35,      // joystick ridotto mentre si finisce il tiro
  receive: { clip: 'receive', start: 0.1, length: 0.6 },
  chainFade: 0.18,        // due gesti di fila: il primo sfuma sotto il secondo
  poseFps: 30             // campioni al secondo delle tabelle delle pose del portiere
};

export const CAMERA = {
  // A grandezza vera giocatori e palla sono piccoli: la telecamera sta piu'
  // vicina al campo che nella fase 1.
  fov: 26,
  fovArea: 23,            // piu' stretta vicino alle aree
  areaX: 36,              // da qui in poi si considera "vicino all'area"
  height: 16,
  sideDistance: 42,       // distanza dal centro in Z (lato tribuna)
  followX: 1,             // quanto segue la palla lungo il campo
  followZ: 0.8,
  aimZ: 1.5,              // mira spostata verso la tribuna: la linea laterale vicina resta in quadro
  nearBack: 1,            // metri di arretramento per metro di palla verso la tribuna
  maxFov: 75,
  lead: 0.35,             // anticipo in secondi nella direzione della palla
  limitX: 44,
  rate: 2.6,              // velocita' dello smorzamento (1/s)
  fovRate: 1.2,
  setPieceBlend: 0.9      // secondi della transizione fra partita e calcio piazzato
};

// Punizioni come in PES e DLS. Vicino alla porta: diretta con barriera,
// telecamera bassa dietro a chi calcia, mira con la levetta, potenza con la
// barra, effetto con la levetta destra (o con la levetta durante la rincorsa,
// come in PES) e la traiettoria iniziale disegnata. Piu' lontano: telecamera
// alta e le scelte della punizione indiretta (passaggio, cross, filtrante).
export const FK = {
  directMax: 30,          // entro tanti metri dalla porta: punizione diretta con barriera e mira
  back: 2.05,             // chi tira parte da qui dietro la palla: la rincorsa della clip
  clip: 'penalty', contact: 0.717, end: 1.3,   // calcio di palla ferma con rincorsa
  side: 0.5,              // chi tira sta un po' di lato, verso il piede d'appoggio
  aimSpeed: [5, 2.2],     // m/s della mira con la levetta: in larghezza, in altezza
  aimOut: 1.5,            // si puo' mirare fin oltre il palo di tanto
  aimY: [0.2, 3.4],       // altezza sulla linea di porta: da rasoterra a sopra la traversa
  aimY0: 1.5,
  speed: [15, 30],        // m/s a potenza zero e piena (il massimo lo limita il tiro del giocatore)
  overPower: 0.85,        // oltre, la palla si alza come nei tiri
  overHeight: 1.6,
  spinMax: 7,             // effetto massimo
  curlRate: 3.5,          // 1/s: la levetta durante la rincorsa porta l'effetto verso il suo valore
  error: 0.5,             // frazione dell'errore di tiro del giocatore
  guidePower: 0.55,       // la guida disegna il calcio a questa potenza, finche' non si carica
  guideTime: 0.55,        // secondi di volo disegnati: solo la traiettoria iniziale, come in PES
  guideDots: 22,
  cam: { back: 6.5, height: 2.3, look: 0.8, lookY: 1.2, fov: 34 },
  camFar: { back: 12, height: 8, look: 0.3, lookY: 0, fov: 44 },
  camHold: 1.1,           // dopo il calcio la telecamera resta tanti secondi, poi torna alla partita
  wallJump: { clip: 'header_jump', from: 0.7, apex: 1.133, end: 1.75 },
  wallRadius: 0.28,       // ingombro di un uomo in barriera (m)
  wallHeight: 1.85,
  wallRest: 0.3,          // velocita' che resta alla palla respinta dalla barriera
  wallSize: [2, 5],       // uomini in barriera: da lontano e defilata a vicina e centrale
  keeperFar: 1.1,         // il portiere si mette dalla parte opposta alla barriera
  userWait: 25            // l'utente mira con calma: dopo tanti secondi batte l'IA
};

// Regole e tempi della partita. Falli, fuorigioco e rigori non ci sono ancora.
export const RULES = {
  fouls: true,
  offside: true,
  penalties: true,
  durationMinutes: 6,     // minuti reali per 90' di gioco
  shotGrace: 3,           // a tempo scaduto si aspetta la fine di un tiro in volo, al massimo cosi'
  outPause: 0.9,          // palla fuori: attesa prima di sistemare la ripresa
  restartReady: 0.7,      // da qui chi batte (utente) puo' calciare
  aiTake: 1.8,            // l'IA batte dopo tanti secondi
  userWait: 6,            // l'utente non batte: dopo tanti secondi batte l'IA per lui
  wall: 9.15,             // distanza degli avversari dalla palla alle riprese
  goalPause: 5.5,         // esultanza, poi calcio d'inizio
  goalSkip: 1.5,          // da qui un pulsante salta l'esultanza
  halfPause: 3,
  returnDelay: 1,         // dopo un gol si torna verso il centrocampo dopo tanti secondi
  gatherMax: 9,           // ripresa: al massimo si aspetta tanto che tutti siano al loro posto
  gatherDist: 0.6,        // entro questa distanza dal proprio posto si e' pronti
  celebration: { clip: 'celebration', from: 0, hold: 4.6 },
  kickoff: { clip: 'kickoff', from: 0, contact: 0.517, end: 0.567, arrive: 7 },
  // Rimessa: in attesa si resta fermi nel primo fotogramma (palla in mano),
  // poi la clip riparte da li'; la rincorsa della radice (2,07 m fino al
  // rilascio) riporta il battitore sulla linea.
  throwIn: { clip: 'throw_in', from: 0, release: 1.55, end: 2.3, rate: 1.25, outside: 2.3, shortApex: 0.9, longApex: 3.2, shortMax: 16, longMax: 30 },
  goalKick: { x: 5.5, z: 5 },  // metri dalla linea di porta, dal centro della porta
  cornerInset: 0.4,
  foulPause: 2.4,         // fischio del fallo: caduta, cartellino, poi la punizione
  freeKickShoot: 30,      // punizione diretta: l'IA tira in porta entro tanti metri
  // Rigore (clip penalty): contatto a 0,717 s con la radice 1,70 m avanti;
  // il tiratore parte 2,05 m dietro la palla. Come in PES la levetta sceglie
  // il lato e la potenza l'altezza: oltre overPower la palla va alta.
  penalty: {
    clip: 'penalty', from: 0, contact: 0.717, end: 1.3, back: 2.05,
    speed: 18, postMargin: 0.7, height: [0.3, 1.9], overPower: 0.9, overHeight: 1.8,
    error: 0.5,           // frazione dell'errore di mira del tiro normale
    guess: [0.33, 0.55],  // portiere IA: probabilita' di indovinare il lato [difficolta' 0, 1]
    edge: 18.5            // gli altri giocatori fuori dall'area, a tanti metri dalla linea di porta
  }
};

// Falli: gravita' dall'intervento, cartellino oltre le soglie.
export const FOUL = {
  base: { pressing: 0.15, contrasto: 0.3, scivolata: 0.5 },
  back: 0.35,             // intervento da dietro
  side: 0.1,
  speed: 0.04,            // per m/s di chi entra
  ballFirst: -0.35,       // prima la palla, poi l'uomo
  noBall: 0.15,           // l'uomo e basta
  noise: 0.25,
  yellow: 0.6,
  red: 1.15,
  dogsoDist: 26,          // chiara occasione da gol: vittima entro tanti metri dalla porta avversaria
  // Chi subisce il fallo: contrasto in piedi -> la clip tackle (caduta dopo
  // un fallo, con rialzo); scivolata -> tripped, down_idle e rialzo.
  standFall: { clip: 'tackle', from: 0, end: 2.27, travel: 0.4 }
};

// Regola del vantaggio: l'arbitro aspetta `decide` secondi; se la squadra che
// ha subito il fallo tiene palla in una zona utile si gioca, e se la perde
// entro `window` si torna al fallo. Il cartellino arriva alla prima interruzione.
export const ADVANTAGE = { decide: 0.45, window: 2.5, attackMin: -12 };

// Fuorigioco al momento del passaggio: oltre il penultimo difensore, oltre la
// palla, nella meta' avversaria. Tolleranza per i casi al limite.
export const OFFSIDE = { margin: 0.3 };

// Arbitro in campo: segue l'azione di lato e un po' dietro, rivolto alla palla.
export const REFEREE = {
  behind: 6,              // metri dietro la palla, rispetto a chi attacca
  side: 9,                // metri di lato (dalla parte lontana dalla telecamera se c'e' spazio)
  minDist: 6,             // mai piu' vicino di cosi' alla palla
  sprintDist: 6,
  armLen: 0.62,           // dalla spalla al palmo, braccio teso
  signal: { rise: 0.2, hold: 1.4, fall: 0.3 },   // secondi del gesto
  cardSize: [0.075, 0.105],
  attrs: { pac: 72, sho: 50, pas: 50, dri: 50, def: 50, phy: 70 }
};

// Fischietto sintetizzato con WebAudio: due toni con trillo.
export const SOUND = {
  whistle: { f1: 2950, f2: 3180, trill: 28, depth: 110, gain: 0.12, short: 0.32, long: 0.9, gap: 0.15 }
};

// Rallentatore di debug (F4): per guardare transizioni e contatti piede-palla.
export const DEBUG = { slowMotion: 0.25 };

export const RENDER = {
  maxPixelRatio: 2,
  minPixelRatio: 0.6,
  lowFps: 48,
  highFps: 58,
  resStep: 0.15,
  sampleSeconds: 1.5,
  background: 0x0a111c
};
