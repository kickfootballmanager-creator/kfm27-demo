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
  coastDecel: 5,          // m/s^2: chi ha appena passato, o sente un fischio, finisce la corsa rallentando
  faceTurn: 2,            // rotazione del busto verso la palla rispetto alla sterzata
  faceGain: 14,           // 1/s: il busto insegue la direzione voluta come una molla...
  faceAccel: 70,          // ...con un'accelerazione angolare massima (rad/s^2): niente scatti
  faceMax: 9,             // rad/s massimi del busto: mezzo giro in 0,35 s
  strafeSpeed: 0.6,       // corsa laterale o all'indietro: frazione della velocita' massima
  closeSpeed: 0.55,       // controllo stretto (R2): frazione della velocita'
  turnSlowBoost: 2,       // da fermo si gira fino a 3 volte piu' in fretta
  pivotSpeed: 0.8,        // m/s: sotto, il primo passo va subito nella direzione voluta
  pivotRun: 2.5,          // m/s: sotto, verso un punto a piu' di pivotAngle rad dal busto...
  pivotAngle: 1.2,
  pivotCap: 1.2,          // ...non si va oltre questi m/s finche' il busto non si e' girato
  lateralAccel: 20,       // m/s^2 massimi in curva: a 5 m/s si gira a 4 rad/s, a 8 m/s a 2,5
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
  receiveBelow: 1.5,      // sotto questa velocita' si vede l'animazione di ricezione...
  cancelAbove: 2.5        // ...che sfuma nella corsa se chi ha ricevuto riparte oltre questa
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
  goalGap: 7,             // il punto d'arrivo resta almeno a tanti metri dalla linea di porta
  // chi lo riceve corre nello spazio incontro al pallone, mai sotto runMin
  // della velocita' massima, senza tornare indietro di oltre `behind` m
  runMin: 0.6,
  behind: 1.5
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

// Finta (roulette della libreria, specchiata per l'altro lato): il giocatore
// gira su se stesso con la palla, avanzando come nella clip; per questo tempo
// i contrasti riescono meno.
export const FEINT = {
  clip: { right: '557_Tricks', left: '557_Tricks_M' },
  rate: 0.8,              // velocita' di riproduzione: dura come la finta di prima (1,1 s)
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
  // behindBall: la linea difensiva resta almeno tanti metri dietro la palla (lato porta)
  defend: { lineScale: 0.55, lineOffset: -14, lineMin: -45, lineMax: -4, behindBall: 7, len: 26, width: 22, ballZ: 0.4 },
  kickoff: { line: -24, len: 21, width: 28 },
  maxZ: 31                // nessuna posizione oltre questa distanza dal centro in larghezza
};

// Intelligenza artificiale. `difficulty` (0..1) scala reazione, precisione e aggressivita'
// della squadra avversaria; i compagni dell'utente giocano sempre a AI.mateDifficulty.
export const AI = {
  hz: 10,                 // decisioni al secondo
  mateDifficulty: 0.5,
  arrive: 1.2,            // entro questa distanza la posizione e' raggiunta
  targetSmooth: 0.35,     // a ogni decisione il posto di zona si avvicina di questa frazione a quello nuovo
  targetReset: 40,        // m: oltre, il posto filtrato riparte dal nuovo (riposizionamenti)
  sprintDist: 9,          // oltre questa distanza dalla posizione si scatta
  faceNear: 4,            // entro questa distanza dalla posizione si guarda la palla...
  faceStep: 1.5,          // ...ma di lato o all'indietro solo entro questa (piccoli aggiustamenti)
  faceAngle: 0.6,         // o se la palla e' a meno di tanti rad dalla direzione di corsa
  sidestepMag: 0.25,      // aggiustamento di lato o all'indietro: frazione della corsa (passo laterale, 1,5 m/s)
  space: { samples: 8, radius: 6, wOpp: 1.4, wLane: 1.2, wHome: 0.08 },
  // Inserimenti a tempo (skill: "Filtranti e inserimenti"): ogni `every` s uno o
  // due attaccanti si mettono sulla linea del fuorigioco, `hold` m dietro, pronti
  // a partire. Partono quando il portatore IA gioca il filtrante (bonus al suo
  // punteggio, di piu' con `space` m liberi dietro la difesa) o da soli dopo
  // `wait` s se la palla ce l'ha l'utente e guarda avanti. In corsa fino a
  // `depth` m oltre la linea; dopo goMax s senza pallone tornano in linea.
  // onside: m prima della linea del fuorigioco per tutti gli altri.
  run: { every: [2.5, 5], depth: 14, onside: 0.8, hold: 1.8, wait: [0.8, 2], goMax: 1.8, space: 12, bonus: 0.35 },
  press: { tight: 0.85, delay: [0.45, 0.12] },   // delay: reazione in marcatura [difficulty 0, 1]; tight: m dalla palla quando stringe per il contrasto
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
  intercept: { base: 0.3, def: 0.5, speed: 0.012 },   // probabilita' d'intercetto: base + def*attr - speed*v
  // Difesa di squadra (skill match3d, "Difesa IA e disciplina"): uno solo in
  // pressione che temporeggia, uno in copertura dietro di lui, gli altri in
  // zona sulle linee di passaggio. Vale anche per il giocatore dell'utente
  // quando non tocca i comandi per `idle` secondi.
  defense: {
    keep: 3,              // m: chi pressa resta lui finche' un compagno non e' piu' vicino di tanto
    contain: [2, 1.5],    // m dal portatore mentre temporeggia [difficulty 0, 1]
    shade: 0.35,          // la posizione si sposta verso la corsa del portatore (0 porta, 1 corsa)
    cover: 6,             // m: la copertura sta tanto dietro chi pressa, sulla linea verso la porta
    coverInside: 0.3,     // ...spostata verso il centro del campo (frazione)
    lane: { radius: 15, t: [0.35, 0.8], pull: 0.6 },   // zona: avversari entro radius dal posto; punto sulla linea di passaggio fra t0 e t1, pesato pull
    markZone: 28,         // avversari a meno di tanti metri dalla nostra porta: marcatura a uomo, lato porta
    backLine: 0.3,        // posti del modulo in questa frazione piu' arretrata: linea difensiva
    lineMark: 3,          // la linea marca lato porta chi arriva a meno di tanti metri da lei...
    lineShift: 0.3,       // ...altrimenti resta sulla linea, spostata verso di lui di questa frazione
    recover: 5,           // m dal proprio posto oltre cui chi e' davanti alla palla rientra di scatto
    behindCost: 8,        // m in piu' nella scelta di chi pressa per chi sta dietro al portatore
    bookedCost: 4,        // ...e per chi e' gia' ammonito
    chase: 7,             // chi e' stato saltato insegue il portatore finche' gli resta entro tanti metri...
    chaseLead: 0.35,      // ...correndo dove sara' fra tanti secondi...
    chaseSide: 0.8,       // ...affiancato di tanti metri, dalla sua parte
    idle: 0.6             // s senza comandi: il giocatore dell'utente difende da solo
  },
  // Contrasto dell'IA solo quando conviene: mai da dietro, palla dalla parte
  // del difensore e lontana dal piede del portatore (exposed, 0..1), oppure
  // appena ricevuta (fresh s); dopo `patience` s di attesa si prova comunque.
  // pastSpeed, pastCos: il portatore che corre (m/s) verso il difensore o di
  // traverso (coseno fra la sua corsa e la direzione del difensore) prova a saltarlo.
  tackle: { exposed: 0.12, fresh: 0.5, patience: [1.4, 0.8], pastSpeed: 2, pastCos: -0.4 },
  // Contrasto rischioso, di lato o da dietro (spesso fallo, come nel calcio
  // vero): il portatore scappa verso la porta (speed m/s) a chi gli sta
  // attaccato (dist m), o lo tiene di spalle oltre la pazienza. Probabilita'
  // al secondo: escape, shield; in area ci si trattiene (box), da ammoniti
  // anche (booked), e cosi' l'ultimo uomo su un'occasione da gol (lastMan).
  rash: { dist: 1.6, speed: 3, escape: 1.2, shield: 1.2, box: 0.3, booked: 0.35, lastMan: 0.35 },
  // Scivolata, ultima risorsa: portatore lanciato verso la porta (speed m/s,
  // toGoal quota della corsa verso la porta) entro goalDist, arrivo di lato o
  // di fronte, nessun compagno in copertura (entro coverWidth dalla linea
  // portatore-porta). chance: probabilita' al secondo [difficulty 0, 1].
  slide: { chance: [2.8, 4.4], range: [1.7, 3.3], speed: 3.5, toGoal: 0.4, goalDist: 45, coverWidth: 4 }
};

// Contrasto in piedi: affondo breve verso la palla, esito al contatto del piede.
// La clip (Tackles_Stand, Small_Tackles, Run_Tackles della libreria) si
// sceglie per corrispondenza e si adatta ai tempi del gioco: contatto dopo
// `hit` secondi, gesto lungo `duration`.
export const TACKLE = {
  hit: 0.26,              // secondi reali dal via al contatto del piede
  duration: 0.55,         // secondi reali del gesto, poi si torna a correre
  legReach: 0.95,         // dal centro del giocatore al pallone, gamba tesa
  manReach: 1.05,         // uomo a portata della gamba (centro a centro): se manca la palla puo' prendere lui
  contactDist: 0.62,      // l'affondo porta il corpo a questa distanza dalla palla
  lunge: 0.75,            // metri massimi dell'affondo verso la palla, oltre lo slancio della corsa
  lungeFrom: 0.04,        // l'affondo va da qui al contatto (secondi)
  lungeSpeed: 5,          // m/s minimi dell'affondo
  poke: 4.5,              // m/s della palla tolta
  keep: 0.45,             // probabilita' di tenerla invece di allontanarla
  lock: 0.35              // chi l'ha appena persa non la riprende subito
};

// Difesa stile PES: Pressing tenuto porta sul portatore, da vicino marcatura
// stretta (jockey) e contrasto automatico quando distanza e angolo lo permettono.
export const PRESS = {
  lead: 0.35,             // s: si corre dove sara' il portatore fra tanto
  sprintDist: 6,          // oltre questa distanza si scatta anche senza Scatto
  engage: 4,              // sotto questa distanza si entra in marcatura stretta
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
  // fallo: base, di lato, da dietro, per m/s di chi entra e del portatore (lanciato si inciampa di piu')
  foul: { auto: 0.15, manual: 0.22, side: 0.15, back: 0.45, speed: 0.012, carrier: 0.05 },
  missFoul: { front: 0.5, side: 0.75, back: 0.9 },
  // carica o spinta di corsa sul portatore (defense.bodyContact): oltre `speed` m/s
  // di avvicinamento, probabilita' per provenienza, piena a `full` m/s; gap: m oltre il contatto dei corpi
  contact: { gap: 0.06, speed: 1, full: 4, front: 0.05, side: 0.9, back: 1 },   // contrasto che manca la palla e prende l'uomo (a portata: TACKLE.manReach)
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
  // la scivolata dritta della libreria (palla a sinistra) e la sua copia
  // specchiata; rallentata e allungata perche' copra tempo e strada di prima
  clip: { left: '636_Slide_Tackles01', right: '636_Slide_Tackles01_M' },
  from: 0.03, window: [0.1, 0.55], rate: 0.65, travel: 1.85,
  foot: 0.95, reach: 0.85, body: 0.9,
  success: 0.85,          // a contatto con la palla, moltiplicato per la difesa
  knock: 7,               // m/s della palla colpita
  momentum: [0.8, 5, 2.2], // allungo = clamp(a + velocita' / b, 1, c)
  lead: 0.45              // senza joystick si mira dove sara' la palla fra tanti secondi
};

// Chi subisce una scivolata: cade, resta a terra, si rialza. Una clip sola
// della libreria (caduta, a terra, rialzo): ferma nell'ultimo istante a terra
// per groundTime secondi, poi riparte.
export const DOWN = {
  clip: '742_Tackles01_Reaction_03',
  fallTravel: 0.6,        // frazione dello spostamento della clip
  groundTime: 0.5
};

// Palloni alti: colpo di testa, rovesciata, al volo.
export const AERIAL = {
  headMin: 1.25, headMax: 2.7,
  jumpAbove: 1.95,        // oltre questa altezza si stacca da terra (header_jump)
  reach: 1.1,             // distanza orizzontale palla-giocatore al contatto
  // lead: secondi reali dal via al contatto (tempi di prima); il contatto nella
  // clip viene dai metadati della libreria (Ball_Bone)
  header: { clip: '259_Heading_Stand_01', lead: 0.37, after: 0.4 },
  jump: { clip: '329_Jump_Head_0', lead: 0.383, after: 0.3 },
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
  alertDist: 32,          // palla entro tanti metri dalla porta: in guardia (animazione)
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
  // Le opzioni di parata vengono dalla libreria (keeper.js, saveOptions): le
  // prese (Keeper_Ball_*, SlidingCatch: la palla resta in mano) e le
  // respinte (Keeper_Save_*), con la finestra attorno al contatto del
  // Ball_Bone. Sono tutte nel pacchetto essenziale: uguali a ogni livello.
  // before/after: secondi della clip prima e dopo il contatto in cui le mani
  // possono incontrare la palla; lead: da quanto prima del contatto parte la clip.
  saveWindow: { before: 0.3, after: 0.2, lead: 0.6 },
  saveScale: { dive: { a: [0, 1.2], s: [0.5, 1.3] }, stand: { a: [0, 1.2], s: [0, 1.6] }, claim: { a: [0.2, 1.6], s: [0, 2.2] } },
  saveBias: { catch: 0, parry: 0.1, dive: 0.02, punch: 0.08 },
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
  // Uscite sui palloni alti: prese e pugni della libreria (keeper.js, claimOptions).
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
  // Rinvii della libreria: rilascio, mano e contatto dai metadati (Ball_Bone).
  // Palla in mano fra una presa e il rinvio: la guardia con la palla
  // (stile keeperBall della corsa), niente gesto fermo.
  clips: {
    throw: { clip: '358_Keeper_Ball_Throw_01', from: 0.2, rate: 1.1, after: 0.6 },
    dropkick: { clip: '342_Keeper_Ball_Kick_01', from: 0.2, rate: 1, after: 0.7 },
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

// Animazioni, sulla libreria Studio33 (anim.js, anim-pick.js). Locomozione
// come blend tree continuo per velocita' e direzione, a stili (normale,
// difesa, conduzione, portiere, portiere con la palla); ancore, bande di
// velocita', appoggi dei piedi e pose sono misurati offline sulle clip. In
// tutte le clip la fase 0 e' l'appoggio del destro e 0,5 quello del sinistro,
// cosi' nella fusione i piedi non scivolano.
export const ANIM = {
  borrow: { dribble: { from: 'normal', minAngle: 1.0 } },   // conduzione: di lato e all'indietro le corse normali
  bandGap: 0.12,          // clip con velocita' entro il 12%: varianti della stessa banda
  styleRate: 7,           // 1/s: passaggio da uno stile all'altro (palla al piede, guardia...)
  slotRelease: 1.5,       // s a peso zero dopo cui l'azione di una fessura si libera
  readyRate: 4,           // 1/s: il portiere entra ed esce dalla guardia
  // stile difesa (guardia): portatore avversario entro dist m, entro angle rad
  // dal busto, chi difende sotto speed m/s
  guard: { dist: 4, angle: 1.1, speed: 4.2 },
  matchBias: 0.3,         // quanto conta allontanarsi dall'istante preferito (m^2 al secondo)
  minRate: 0.6,           // playback minimo e massimo delle clip di corsa
  maxRate: 2,
  dirMaxRate: 2.1,        // clip direzionali (sono corsette): un po' piu' accelerate
  blend: 40,              // 1/s: filtro dei pesi del blend tree
  speedSpring: 14,        // 1/s: molla critica della velocita' che decide i pesi (partenze, arresti)
  angleRate: 30,          // 1/s: filtro dell'angolo fra corsa e busto
  maxSpeed: 12,           // m/s: oltre, uno spostamento e' un riposizionamento, non una corsa
  dirHold: 0.3,           // m/s: sotto, la direzione della corsa resta quella di prima
  dirSnap: 0.3,           // quota di corsa sotto cui la direzione si prende subito, senza filtro
  // Corpo visibile: da `from` a `to` m/s l'angolo fra corsa e corpo scende da
  // pi a minAngle (twist: rad del busto verso lo sguardo); turnSlow/turnFast/
  // gestureTurn: rad/s massimi da fermi, in corsa, durante un gesto.
  warp: { from: 3.6, to: 6, minAngle: 0.35, twist: 0.55, turnSlow: 7, turnFast: 5, gestureTurn: 20 },
  liftRelease: 0.6,       // m/s: il corpo alzato perche' i piedi non entrino nell'erba riscende piano
  turnStep: 0.45,         // m/s di passo per rad/s di rotazione da fermi: girandosi si fanno piccoli passi
  turnStepMax: 1.2,
  // Inclinazione di tutto il corpo, dai piedi: nelle curve verso l'interno,
  // in avanti quando accelera, indietro quando frena. rad per m/s^2.
  lean: { roll: 0.02, maxRoll: 0.2, pitch: 0.012, maxPitch: 0.07, maxBack: 0.05, rate: 8 },
  // Piedi fermi a terra nell'appoggio (IK sulle gambe), finche' la clip non
  // li porterebbe troppo lontano.
  footLock: { on: true, maxSpeed: 9, minMove: 0.25, ramp: 0.08, release: 0.12, drift: 0.22, liftEarly: 0.25 },
  fadeIn: 0.15,           // cross-fade verso un gesto (0,15-0,25 s)
  fadeOut: 0.22,
  chainFade: 0.18,        // due gesti di fila: il primo sfuma sotto il secondo
  syncMinSpeed: 1.2,      // sotto questa velocita' il calcio non cerca il passo in corso
  // Calci: `lead` secondi reali dal comando al contatto del piede, uguali a
  // ogni livello; la clip scelta parte e si accelera per rispettarli.
  // recover: secondi dopo il contatto prima di tornare a correre.
  kickRate: [0.6, 1.8],
  pass: { role: 'pass', lead: 0.22, recover: 0.3, moveMag: 0.35, turn: 4 },
  through: { role: 'pass', lead: 0.22, recover: 0.3, moveMag: 0.35, turn: 4 },
  cross: { role: 'long', lead: 0.27, recover: 0.35, moveMag: 0.3, turn: 4 },
  shot: { role: 'shot', lead: 0.25, recover: 0.4, moveMag: 0.3, turn: 4 },
  firstTime: 0.08,        // di prima: il piede e' gia' quasi sulla palla
  recoverMove: 0.35,      // joystick ridotto mentre si finisce il tiro
  // Ricezione da fermi: la clip di stop (con la palla gia' al piede) per
  // `length` secondi; `chest` e `head`: palla oltre queste altezze.
  receive: { length: 0.6, fade: 0.12, lead: 0.12 },   // lead: intercetto, secondi di clip prima del contatto
  // Partenze, arresti, svolte e giri sul posto (player.transition): clip della
  // libreria sopra il blend tree, solo nello stile normale e in conduzione.
  // startBelow/startWant: da fermi (m/s dei pesi) verso una corsa voluta oltre
  // tanti m/s; stopAbove/stopWant: in corsa verso una velocita' voluta sotto;
  // turnAbove/turnAngle: in corsa, direzione voluta oltre tanti rad dal busto;
  // inPlace*: fermi, sguardo oltre tanti rad. rate: playback [min, max];
  // lead: secondi (reali) di clip prima che cominci la rotazione.
  trans: {
    startBelow: 0.35, startWant: 0.9, startTop: 4.5, startRate: 1.25, startHold: 0.45,
    stopAbove: 2.2, stopWant: 0.3, stopTail: 0.15,
    turnAbove: 1.0, turnAngle: 2.2, turnLag: 0.12, turnHold: 0.5,
    inPlaceBelow: 0.3, inPlaceWant: 0.5, inPlaceAngle: 1.3, inPlaceRate: 2.2,
    rate: [0.7, 1.8], lead: 0.06, fade: 0.12, cooldown: 0.35,
    match: { yaw: 1, speed: 0.35, dir: 1.5, accept: 1.2 }
  },
  // Pesi della scelta per corrispondenza (anim-pick.js): rad di rotazione,
  // metri di lato della palla, m/s, posa dei piedi, potenza, altezza della
  // palla; keep: vantaggio della clip gia' usata dal giocatore per quel ruolo.
  // runAbove: m/s oltre cui si scelgono solo clip che entrano in corsa (runClip: m/s d'entrata della clip)
  match: { turn: 1.2, side: 2.5, speed: 0.25, pose: 1, power: 0.6, height: 1.5, lob: 1, inPlace: 0.8, rate: 0.4, keep: 0.2, runAbove: 2.5, runClip: 1.5 }
};

// Pacchetti della libreria di animazioni per livello di qualita' (anim-lib.js):
// alto tutto all'avvio, medio l'essenziale all'avvio e il resto durante la
// partita, basso solo l'essenziale. Fisica, IA e comandi non cambiano.
export const ANIMLIB = {
  levels: {
    high: { start: ['core', 'more', 'extra'], later: [] },
    medium: { start: ['core'], later: ['more', 'extra'] },
    low: { start: ['core'], later: [] }
  }
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
  // calcio di palla ferma con rincorsa in diagonale (libreria): chi tira parte
  // dove la clip mette il Root rispetto alla palla al contatto (setpieces.runup)
  clip: '513_Shoot_Stand_0_01', after: 0.6,
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
  wallJump: { clip: '021_Ball_Avoid_Jump', lead: 0.15 },   // salto della barriera (libreria); lead: s prima del punto piu' alto
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
  halfPause: 3,
  returnDelay: 1,         // dopo un gol si torna verso il centrocampo dopo tanti secondi
  gatherMax: 9,           // ripresa: al massimo si aspetta tanto che tutti siano al loro posto
  gatherDist: 0.6,        // entro questa distanza dal proprio posto si e' pronti
  // esultanze della libreria (pacchetto extra), altrimenti quella Mixamo
  celebration: { clip: 'celebration', from: 0, hold: 4.6 },
  // Calcio d'inizio come in PES: chi batte tocca corto al compagno accanto,
  // mateBack m dietro la linea e mateSide m di lato; la palla gli arriva a
  // `arrive` m/s. Chi batte guarda avanti con la palla dove la mette la clip
  // KickOff della libreria scelta per la direzione del compagno (135, 180,
  // 225 gradi); lead: s dal via al contatto, after: s dopo il contatto.
  kickoff: { clips: ['444_KickOff_135', '445_KickOff_180', '446_KickOff_225'], lead: 0.5, after: 0.25, arrive: 3, mateBack: 1.2, mateSide: 2 },
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
  // Come in PES 2021: la levetta, tenuta, sceglie l'angolo (anche alto o
  // basso), la barra la potenza: poca non arriva negli angoli alti, oltre il
  // 90% la palla va alta. L1 + tiro: cucchiaio. R1 tenuto: guida alla mira.
  penalty: {
    clip: '513_Shoot_Stand_0_01', after: 0.6,
    speed: 18, postMargin: 0.7, height: [0.3, 1.9], overPower: 0.9, overHeight: 1.8,
    topPower: 0.5,        // sotto questa potenza l'angolo alto resta basso
    error: 0.5,           // frazione dell'errore di mira del tiro normale
    guess: [0.33, 0.55],  // portiere IA: probabilita' di indovinare il lato [difficolta' e attributo 0, 1]
    chip: { speed: 12.5, height: 1.5, spread: 0.4 },   // cucchiaio: lento, verso il centro
    early: 0.35,          // portiere dell'utente che si butta prima di tanti secondi dal calcio...
    readKeeper: 0.55,     // ...il tiratore IA lo vede e cambia lato con questa probabilita'
    lateWindow: 0.3,      // dopo il calcio l'utente ha ancora tanti secondi per tuffarsi (in ritardo)
    commit: 0.5,          // levetta del portiere oltre questa inclinazione: tuffo deciso
    aimRing: 0.35,        // guida alla mira: raggio minimo del cerchio (m)
    edge: 18.5            // gli altri giocatori fuori dall'area, a tanti metri dalla linea di porta
  }
};

// Falli: gravita' dall'intervento, cartellino oltre le soglie. Un contrasto
// sbagliato di fronte non si ammonisce; da dietro, in scivolata o per
// fermare un'azione promettente (promising) si'.
export const FOUL = {
  base: { carica: -0.1, pressing: 0.2, contrasto: 0.28, scivolata: 0.38 },
  back: 0.32,             // intervento da dietro
  side: 0.08,
  speed: 0.03,            // per m/s di chi entra
  ballFirst: -0.3,        // prima la palla, poi l'uomo
  noBall: 0.1,            // l'uomo e basta
  noise: 0.25,
  yellow: 0.6,
  secondYellow: 0.15,     // gia' ammonito: per il secondo giallo serve tanto di piu'
  red: 1.35,
  // azione promettente fermata: vittima lanciata verso la porta (speed m/s)
  // entro dist metri, al massimo `defenders` avversari fra lei e la porta
  promising: { add: 0.28, dist: 45, speed: 3, defenders: 2 },
  dogsoDist: 26,          // chiara occasione da gol: vittima entro tanti metri dalla porta avversaria
  // Chi subisce il fallo in un contrasto in piedi: caduta e rialzo della
  // libreria, dal lato del contatto; in scivolata: DOWN.
  standFall: { clip: { left: '105_Defense_Jump_Fall_Reaction_01_L', right: '106_Defense_Jump_Fall_Reaction_01_R' }, travel: 0.4 }
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

// Dopo il gol (replay.js): esultanza dal vivo per `celebrate` s, poi il
// replay degli ultimi `pre` s prima del gol, laterale basso a velocita'
// normale e dietro la porta al rallentatore (slowSpeed) negli ultimi `slow`
// s, fino a `post` s dopo. Buffer di `seconds` s registrato a `hz`. Poi
// dissolvenza al nero di `fade` s e calcio d'inizio con le squadre schierate.
// camRate, lookRate: 1/s, quanto in fretta la telecamera segue la palla.
// Laterale bassa dal bordo campo, con lo zoom che segue la distanza.
export const REPLAY = {
  hz: 30, seconds: 10,
  celebrate: 3,
  pre: 5, slow: 1.5, post: 0.7, slowSpeed: 0.45, maxTime: 11,
  fade: 0.35,
  sideCam: { height: 4, dist: 14, edge: 3, lead: 5, frame: 14, fov: [10, 30] },   // frame: m visibili in altezza sull'azione, fov min e max
  goalCam: { back: 6, height: 2.6, follow: 0.4, fov: 38 },
  camRate: 3, lookRate: 8
};

// Livelli di qualita' (render.js). pixelRatio: massimo; shadow: lato della
// shadow map dei giocatori (0 = ombre blob); aa: antialiasing in post.
export const RENDER = {
  levels: {
    low: { pixelRatio: 1, shadow: 0, aa: 'none', bloom: false },
    medium: { pixelRatio: 1.5, shadow: 1024, aa: 'fxaa', bloom: false },
    high: { pixelRatio: 2, shadow: 2048, aa: 'smaa', bloom: true }
  },
  exposure: 1.05,         // tone mapping ACES
  envIntensity: 0.55,     // riflessi dell'environment map (RoomEnvironment)
  shadowBox: 24,          // metri attorno alla palla coperti dall'ombra dinamica
  shadowBias: -0.0004,
  shadowNormalBias: 0.02,
  blobFade: [0.7, 1],     // fuori dal riquadro dell'ombra (frazione del lato) tornano le ombre blob
  bloom: { strength: 0.45, radius: 0.35, threshold: 1.8 },   // soglia sopra l'erba illuminata: brillano solo i fari
  minPixelRatio: 0.6,
  lowFps: 50,             // sotto, per lowSamples campioni di fila, si scende di livello
  lowSamples: 2,
  highFps: 58,
  resStep: 0.15,
  sampleSeconds: 1.5,
  background: 0x0a111c
};

// Contorno dello stadio (stadium.js e pitch.js).
export const STADIUM = {
  skyRadius: 480,
  sky: { top: 0x02050b, horizon: 0x16233a, glow: 0x1e2e4a },
  stands: { depth: 26, rise: 14 },
  floodlights: { out: 30, height: 40, poleRadius: 0.9, panel: [12, 6], tilt: 0.55, intensity: 4 },
  crowd: {
    row: 0.95,            // metri fra due file, lungo la tribuna
    seat: 0.62,           // metri fra due posti
    fill: 0.72,           // posti occupati
    size: [0.55, 1.05],   // sagoma: larghezza e altezza
    skin: 0xc9a07e,
    light: 0.5,           // luminosita' del pubblico (i riflettori guardano il campo)
    cheerTime: 7,         // secondi di esultanza dopo un gol
    neutral: ['#39414d', '#5a6270', '#7a6a58', '#2d3f55', '#6b3b3b', '#4c5a3c', '#8a8d93'],
    density: { low: 0.35, medium: 0.65, high: 1 }
  }
};
