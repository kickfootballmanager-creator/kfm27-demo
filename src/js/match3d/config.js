// Tutti i numeri della partita 3D. Unita': metri, secondi, radianti.
// Assi: X lungo il campo, Z in larghezza, Y in alto, centro campo nell'origine.

export const PITCH = {
  length: 105,
  width: 68,
  runoff: 6,              // erba oltre le linee, fino ai cartelloni
  lineWidth: 0.12,
  lineGlow: 0.3,          // luce propria delle righe (pitch.lines)
  centerCircle: 9.15,
  penaltyDepth: 16.5,
  penaltyWidth: 40.32,
  goalAreaDepth: 5.5,
  goalAreaWidth: 18.32,
  penaltySpot: 11,
  cornerArc: 1,
  grassTileMeters: 6,     // lato di una ripetizione della texture erba
  // Grass003 ha l'albedo giallo-verde (tinta 71 gradi): moltiplicato per
  // questo colore l'erba arriva alla tinta 104 e saturazione 53% del
  // riferimento (docs/match3d-riferimento.md, A6)
  grassColor: [0.37, 1, 0.75],
  // Strisce di taglio come nel riferimento: bande di stripeWidth metri con un
  // bordo sulla linea di meta' campo, la scura a stripeDark della chiara,
  // passaggio sfumato lungo stripeEdge metri (10-90% su 0,6 m)
  stripeWidth: 6,
  stripeDark: 0.78,
  stripeEdge: 1,
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
  // a terra: come nel riferimento un rasoterra da 16,4 m/s arriva a 11 dopo
  // 12 m (6 m/s^2 a 16 m/s, 5,6 a 11, 5 quasi ferma)
  rollFriction: 4.6,      // m/s^2 costanti quando rotola
  rollDrag: 0.1,          // 1/s
  restitution: 0.6,       // rimbalzo verticale
  shadowWithMap: 0.7,     // ombra a disco sotto la palla con le ombre vere accese
  // rotazione disegnata al piu' visualSpin rad/s (0,9 rad a fotogramma): a 18
  // m/s la palla girava di 2,7 rad a fotogramma e a 60 Hz sembrava ferma o
  // girare all'indietro, cioe' scivolare. La fisica usa sempre la rotazione vera.
  visualSpin: 55,
  carryBounce: 1.2,       // m/s: palla al piede che cade piu' piano di cosi' non rimbalza piu'
  minBounce: 0.6,         // sotto questa velocita' verticale smette di rimbalzare
  // Rotazione (ball.js): magnus k in a = k (w x v); a 25 m/s con 50 rad/s
  // di effetto (8 giri al secondo) la palla curva di 6 m/s^2. spinToW: rad/s
  // per unita' dell'effetto dei calci piazzati (7 = 50 rad/s).
  magnus: 0.005,
  spinToW: 7.2,
  airSpinDecay: 0.12,     // 1/s in volo
  groundSpinDecay: 3,     // 1/s a terra, l'effetto attorno alla verticale
  rollGrip: 12,           // 1/s: a terra la rotazione raggiunge il rotolamento puro
  bounceFriction: 0.5,    // attrito del rimbalzo (scambio fra velocita' e rotazione)
  bounceSpinKeep: 0.7,    // effetto attorno alla verticale che resta dopo un rimbalzo
  // Rotazione data dal piede (main.kickSpin), rad/s: tiro di piatto (potenza
  // sotto placedBelow) a giro, tiro di collo con poca rotazione in avanti e un
  // filo di effetto a caso, cross all'indietro e a rientrare, passaggio di piatto.
  kickSpin: { placedBelow: 0.55, curl: 38, placedTop: 6, instepTop: 14, knuckle: 6, back: 22, cross: 26, pass: 8 },
  // Rimbalzo sul corpo dei giocatori (main.deflect): tiri sempre, gli altri
  // palloni sopra minY m o oltre fastLoose m/s; rest lungo la normale, keep di
  // lato, rotazione a caso fino a spin rad/s; chi devia non la riprende per lock s.
  // Rasoterra: una sfera sotto legY m (piede, tibia) puo' controllarlo
  // (main.trapLow); un compagno che non lo aspettava lo controlla a mateTrap.
  deflect: { minY: 0.45, fastLoose: 12, check: 1.6, rest: 0.3, keep: 0.6, spin: 25, lock: 0.25, legY: 0.6, mateTrap: 0.85 },
  boardRestitution: 0.35,
  stopSpeed: 0.05
};

export const PHYSICS = {
  hz: 60,
  maxSteps: 5             // passi massimi per frame dopo un blocco lungo
};

export const KICK = {
  maxSpeed: 35,
  groundMin: 14,          // rasoterra: mai piu' lento di cosi', neanche da vicino
  groundMax: 26,
  // dal comando all'inizio del gesto (main.queueKick): il giocatore continua
  // la corsa o la conduzione e calcia al tocco dopo; con ANIM.*.lead fa i
  // 0,35-0,40 s dal tasto al contatto del riferimento
  setup: 0.25
};

export const PLAYER = {
  radius: 0.34,           // ingombro per le collisioni fra giocatori
  pushStill: 0.5,         // m/s: sotto, chi si muove non lo spinge (separate): si sposta chi corre
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
  // ...che calano con la corsa: faceMax fino a faceRun[0] m/s, faceRun[2]
  // rad/s da faceRun[1] m/s in su (non nei calci). A 9 rad/s in corsa la
  // fusione passava in 0,3 s da avanti a laterale a indietro: piede
  // appoggiato che scivolava a 2-4 m/s e bacino che saltava
  faceRun: [1, 3, 2.5],
  strafeSpeed: 0.6,       // corsa laterale o all'indietro: frazione della velocita' massima
  closeSpeed: 0.55,       // controllo stretto (R2): frazione della velocita'
  turnSlowBoost: 2,       // da fermo si gira fino a 3 volte piu' in fretta
  pivotSpeed: 0.8,        // m/s: sotto, il primo passo va subito nella direzione voluta
  pivotRun: 2.5,          // m/s: sotto, verso un punto a piu' di pivotAngle rad dal busto...
  pivotAngle: 1.2,
  pivotCap: 1.2,          // ...non si va oltre questi m/s finche' il busto non si e' girato
  lateralAccel: 20,       // m/s^2 massimi in curva: a 5 m/s si gira a 4 rad/s, a 8 m/s a 2,5
  ballAgility: [0.7, 1.25], // accelerazione laterale con la palla: controllo 0 e 1
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
  // quasi fermi (sotto orbitBelow m/s) con la palla oltre orbitAngle rad dal
  // davanti: il giocatore si gira verso di lei a faceBall rad/s, e la palla
  // si sposta al piu' a stillTurn rad/s
  orbitBelow: 1.2, orbitAngle: 0.45, faceBall: 5, stillTurn: 2.5,
  follow: 22,             // 1/s: quanto in fretta la distanza si adegua
  maxRel: 9,              // m/s: velocita' massima della palla rispetto al giocatore
  relAcc: 70,             // m/s^2: quanto in fretta cambia (tocco continuo)
  // Conduzione a tocchi (main.dribbleRoll): sopra minSpeed m/s e con la svolta
  // sotto maxTurn rad la palla rotola libera fra un tocco e l'altro; il tocco
  // dopo fra minT e maxT s; si torna al tocco continuo con la palla oltre
  // maxErr m da dove la vorrebbe, si riparte entro startErr m.
  roll: { minSpeed: 2.2, maxTurn: 0.6, minT: 0.35, maxT: 0.9, maxErr: 0.8, startErr: 0.25, maxSpeed: 14 }
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
  doubleTap: 0.2,         // difesa: X due volte entro tanti secondi = contrasto...
  tapHold: 0.15,          // ...se il primo tocco dura meno di tanti secondi
  zones: [6, 3],          // cambio automatico: fasce lungo il campo e in larghezza
  switchMargin: 2,        // si cambia solo se il nuovo e' piu' vicino di tanti metri
  switchCone: 1.1         // levetta destra: semiapertura del cono di ricerca (rad)
};

// Pressione prolungata: potenza 0..1 per passaggio, filtrante, cross e tiro.
export const POWER = {
  chargeTime: 0.35,       // secondi per arrivare al massimo (riferimento: a meta' dopo 0,17 s)
  barHide: 0.45           // secondi in cui la barra resta visibile dopo il calcio
};

// Ricezione: il ricevente corre sul punto d'intercetto e ignora il joystick
// fino al primo tocco.
export const RECEIVE = {
  step: 1 / 30,           // passo della previsione della traiettoria
  horizon: 5,             // secondi di traiettoria previsti
  reaction: 0.05,
  faceDist: 6,            // sotto questa distanza dalla palla il ricevente la guarda
  // Come nel riferimento il ricevente frena e si gira verso la palla in circa
  // 0,3 s: con il punto d'intercetto entro waitDist m la aspetta di fronte,
  // frenando a `brake` m/s^2 e girando il busto fino a faceRate rad/s [da
  // fermo, a 5 m/s] con faceAccel rad/s^2
  waitDist: 6,
  brake: 24,
  faceRate: [14, 8],
  faceAccel: 160,
  timeout: 6,             // passaggio che nessuno raggiunge: dopo 6 s il joystick torna libero
  // Il destinatario la controlla quando la palla gli arriva al corpo (entro
  // capture m), o nel punto piu' vicino se gli passa accanto entro
  // CONTROL.receiveRadius, o li' con la palla piu' lenta di slowRel m/s
  // rispetto a lui; palla fino a trapHeight m (stop di petto).
  capture: 0.6,
  slowRel: 3,
  trapHeight: 1.9,
  // Stop (main.startTrap): la palla arriva dove la clip la lascia in reach
  // della durata dello stop, piano (maxHoriz m/s al piu', rispetto al giocatore
  // la velocita' cala come e^(-cushion t)); sopra airY m e'
  // smorzata dal corpo e cade con la gravita' (spinKeep: rotazione che resta);
  // push: metri del primo tocco orientato o senza punto della clip; yawScale:
  // quanto si puo' allargare o stringere la rotazione della clip; lost: palla
  // oltre tanti metri, lo stop finisce e la riprende la conduzione.
  // minAhead: m davanti al busto sotto cui la palla viene spinta avanti a keepRate 1/s
  // badTouch: m in piu' (e di lato, meta') di un primo tocco con controllo 0
  trap: { reach: 0.85, maxHoriz: 7, cushion: 6, airY: 0.35, spinKeep: 0.3, push: 0.9, yawScale: [0.4, 1.6], lost: 2.2, minAhead: 0.6, keepRate: 8, badTouch: 1.2 },
  // Stop anticipato (main.preTrap): la clip parte quando la palla arrivera'
  // al punto del tocco (touch.r m dal giocatore, piu' slack) proprio nel
  // fotogramma del tocco; il destinatario la controlla li', non a capture m.
  // late: s oltre il tocco della clip dopo cui la controlla comunque entro receiveRadius.
  pre: { slack: 0.15, minR: 0.3, late: 0.08 }
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
  // velocita' come nel riferimento (29 passaggi, 16,4 m/s di mediana a 12 m):
  // speedBase + speedPerM a metro di distanza + speedPower con la potenza
  speedBase: 11.2,
  speedPerM: 0.27,
  speedPower: 1.5,
  speedMin: 12,
  speedMax: 24,
  pressBoost: 0.5,        // m/s in piu' se passatore o ricevente sono pressati
  arriveMin: 7,           // la palla arriva sempre almeno a questa velocita'
  blindDist: [8, 30],     // nessun compagno nel cono: spazio a potenza zero e piena
  speedError: 0.08        // errore relativo sulla forza, scalato dall'attributo
};

// Filtrante: rasoterra nello spazio davanti al compagno che corre. La potenza
// decide quanto lontano nello spazio.
export const THROUGH = {
  cone: 0.9,
  lead: [7, 20],          // metri davanti alla corsa del compagno, a potenza zero e piena
  arrive: [4, 10],        // m/s con cui arriva nello spazio senza un compagno (palla nel vuoto)
  speedMin: 10,           // riferimento: 15 m/s in partenza, 8 all'arrivo
  speedMax: 15.5,
  wReach: 1.1,            // come nel passaggio la barra sceglie anche il compagno, ma conta lo spazio
  wSpace: 0.8,            // peso dello spazio libero davanti al compagno
  goalGap: 7,             // il punto d'arrivo resta almeno a tanti metri dalla linea di porta
  // chi lo riceve corre nello spazio incontro al pallone, mai sotto runMin
  // della velocita' massima, senza tornare indietro di oltre `behind` m
  runMin: 0.6,
  behind: 1.5,
  behindBall: 0.5          // ne' oltre tanti metri dietro di lui lungo la strada della palla
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
  minSpeed: 21,           // con ATTR.shotSpeed: 28 m/s di mediana come nel riferimento
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
  shotSpeed: [27, 36],    // m/s a potenza piena (prima 30-35: fra 60 e 90 di tiro solo 1,7 m/s)
  shotError: [0.1, 0.022],
  tackle: [0.25, 0.8],
  jump: [0.3, 0.7],       // m di elevazione nel salto (fisico e velocita')
  // altezza quando il manager non la da': per ruolo principale, +-phy/2 m
  // dal fisico, +-noise m fissi per giocatore
  height: { base: { POR: 1.89, DC: 1.87, CDC: 1.82, CC: 1.79, COC: 1.78, TS: 1.78, TD: 1.78, ES: 1.77, ED: 1.77, AS: 1.76, AD: 1.76, ATT: 1.83, default: 1.8 }, phy: 0.08, noise: 0.05 }
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
  // width: come nel riferimento le squadre stanno larghe 39 m (prima 34)
  // A10: chi attacca e' lungo 36 m e largo 38
  attack: { lineOffset: -26, lineMin: -40, lineMax: 6, len: 42, width: 30, ballZ: 0.15 },
  // behindBall: la linea difensiva resta almeno tanti metri dietro la palla (lato porta)
  // A10: chi difende sta stretto (29 m) e basso, l'ultimo uomo 22 m dietro la palla
  defend: { lineScale: 0.55, lineOffset: -20, lineMin: -45, lineMax: -4, behindBall: 19, len: 22, width: 21, ballZ: 0.4 },
  // calcio d'inizio: difensori a 17,5 m dalla meta' campo, punte a 2,9 (riferimento)
  kickoff: { line: -17.5, len: 14.6, width: 26 },
  maxZ: 32                // nessuna posizione oltre questa distanza dal centro in larghezza
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
    laneRisk: 2.0,        // peso del rischio della linea (A10: l'81% dei passaggi riesce)
    // gara sul punto della linea piu' vicino a un avversario (team-ai.passRisk):
    // la palla ci va a passV m/s medi (compresi i 0,25 s di preparazione), lui
    // dopo `react` s a `run` della sua velocita' massima, e la tocca da `reach`
    // m; rischio 0,5 a pari tempo, pieno `span`/2 s prima
    passV: 11,
    lane: { react: 0.3, run: 0.8, reach: 0.9, span: 0.5 },
    pressedAt: 3,         // un avversario entro questa distanza mette pressione
    feintChance: 0.25,
    crossChance: 0.7,
    error: [1.6, 0.8],    // moltiplicatore dell'errore di passaggio e tiro [difficulty 0, 1]
    pressedThink: 0.5,    // sotto pressione decide piu' in fretta
    // Appena presa palla conduce prima di decidere (A10: dalla ricezione al
    // calcio 2,1 s di mediana, 0,6-3,4): un tocco rapido nel `quick` dei casi
    // (quickT s), altrimenti med s con dispersione `spread` (log-normale);
    // pressato entro pressedAt m, al piu' pressedHold s
    hold: { quick: 0.2, quickT: [0.1, 0.4], med: 2.6, spread: 0.5, pressedHold: 1.1 },
    // protegge la palla: la tiene sul lato lontano dal difensore e rallenta
    protect: { dist: 2.2, mag: 0.45, chance: [0.3, 0.8], shieldSide: 2.2 }
  },
  tackleRate: [0.75, 1.3], // cadenza dei contrasti automatici rispetto a PRESS.autoEvery [difficulty 0, 1]
  // probabilita' d'intercetto: base + def*attr - speed*v (A10: si perde un
  // passaggio su cinque; con 0,3 e 0,5 l'IA ne perdeva piu' di quattro su dieci)
  intercept: { base: 0.06, def: 0.3, speed: 0.01 },
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
  // contrasti azzardati al secondo: rari come i falli del riferimento (prima 1,2 e 1,2)
  rash: { dist: 1.6, speed: 3, escape: 0.15, shield: 0.15, box: 0.3, booked: 0.35, lastMan: 0.35 },
  // Scivolata, ultima risorsa: portatore lanciato verso la porta (speed m/s,
  // toGoal quota della corsa verso la porta) entro goalDist, arrivo di lato o
  // di fronte, nessun compagno in copertura (entro coverWidth dalla linea
  // portatore-porta). chance: probabilita' al secondo [difficulty 0, 1].
  // scivolate dell'IA: rare come nel riferimento (nessuna vista), prima [2,8, 4,4]
  slide: { chance: [0.6, 1.0], range: [1.7, 3.3], speed: 3.5, toGoal: 0.4, goalDist: 45, coverWidth: 4 }
};

// Contrasto in piedi: affondo breve verso la palla, esito al contatto del piede.
// La clip (Tackles_Stand, Small_Tackles, Run_Tackles della libreria) si
// sceglie per corrispondenza e si adatta ai tempi del gioco: contatto dopo
// `hit` secondi, gesto lungo `duration`.
export const TACKLE = {
  hit: 0.26,              // secondi reali dal via al contatto del piede
  duration: 0.55,         // secondi reali del gesto, poi si torna a correre
  standLunge: 0.1,        // m: sotto, la clip del contrasto non si sposta: niente affondo (scivolava sull'erba)
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
  // il difensore dell'IA accompagna e sceglie il momento: meno tentativi (prima 0,4/0,18 e 1,2/0,6)
  autoReact: [0.7, 0.4],  // s in marcatura prima del primo contrasto [difesa bassa, alta]
  autoEvery: [2.2, 1.3]   // s fra due contrasti automatici [difesa bassa, alta]
};

// Esito di un contrasto: palla recuperata, il portatore salta l'uomo, fallo.
export const DUEL = {
  win: [0.3, 0.8],        // probabilita' base [difesa bassa, alta]
  dribbleResist: 0.45,    // quanto il dribbling del portatore la riduce
  timing: [0.75, 1.25],   // palla attaccata al piede del portatore / palla lontana
  angle: { front: 1, side: 0.85, back: 0.6 },
  skillGap: 0.4,          // peso della differenza di difficolta' fra le squadre
  manual: 1.05,           // contrasto premuto: poco piu' efficace, molto piu' rischioso
  strength: 0.6,          // differenza di fisico (0-1) fra chi entra e il portatore: vincita x (1 + strength * diff)
  // fallo: base, di lato, da dietro, per m/s di chi entra e del portatore (lanciato si inciampa di piu').
  // Come nel riferimento (A10: nessun fallo in 7,6 minuti di gioco) i
  // contrasti dell'IA sono quasi sempre puliti; il contrasto premuto resta rischioso
  foul: { auto: 0.005, manual: 0.15, side: 0.015, back: 0.06, speed: 0.001, carrier: 0.003 },
  missFoul: { front: 0.03, side: 0.06, back: 0.15 },
  // carica o spinta di corsa sul portatore (defense.bodyContact): oltre `speed` m/s
  // di avvicinamento, probabilita' per provenienza, piena a `full` m/s; gap: m oltre il contatto dei corpi.
  // Prima 0,9 di lato e 1 da dietro: quasi ogni avvicinamento diventava una
  // trattenuta o una spinta (84% dei falli, 18 a partita)
  contact: { gap: 0.06, speed: 1, full: 4, front: 0.002, side: 0.01, back: 0.025 },   // contrasto che manca la palla e prende l'uomo (a portata: TACKLE.manReach)
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

// Reazioni ai contatti (skill: "Arbitro, falli e cartellini"), quattro
// livelli per gravita' dell'intervento (rules.foul): 1 sbilanciamento sul
// posto o inciampo che continua la corsa, 2 colpo con un passo di recupero,
// 3 caduta e rialzo, 4 solo per i falli violenti (scivolata da dietro in
// piena corsa, intervento da rosso) la caduta spettacolare. Dentro il livello
// la clip e' quella il cui spostamento somiglia di piu' alla spinta (gestures.react).
export const REACT = {
  clips: {
    1: ['640_Small_Hit_Reaction_00', '641_Small_Hit_Reaction_90', '642_Small_Hit_Reaction_180', '643_Small_Hit_Reaction_270',
      '734_Tackles_Reaction_L_01', '735_Tackles_Reaction_R_01', '109_Defense_Jump_Fall_Reaction_03'],
    2: ['264_Hit_Reaction_00', '265_Hit_Reaction_90', '266_Hit_Reaction_180', '267_Hit_Reaction_270',
      '698_Stand_Hit_Reaction_90', '699_Stand_Hit_Reaction_180', '700_Stand_Hit_Reaction_270',
      '084_Defense_Fall_Reaction_L', '085_Defense_Fall_Reaction_R', '086_Defense_Fall_Reaction_UP'],
    3: ['105_Defense_Jump_Fall_Reaction_01_L', '106_Defense_Jump_Fall_Reaction_01_R', '107_Defense_Jump_Fall_Reaction_02_L', '108_Defense_Jump_Fall_Reaction_02_R'],
    4: ['742_Tackles01_Reaction_03']
  },
  levels: [0.3, 0.75],    // gravita' da cui si passa al livello 2 e al 3; la scivolata e' almeno 3
  violentSpeed: 8,        // m/s di chi entra in scivolata da dietro (in piena corsa ne fa 10-11): violento (livello 4), come la gravita' da rosso
  push: 1,                // m: la spinta, dall'avversario verso chi la subisce...
  carry: 0.15,            // ...piu' tanti secondi della corsa dell'avversario...
  momentum: { 1: 0.3, 2: 0.3, 3: 0.6, 4: 0.6 },   // ...e della propria: chi cade (3, 4) ha i piedi portati via e va avanti con lo slancio
  window: 0.8,            // s della clip in cui si misura il suo spostamento
  angleCost: 1,           // per radiante fra spinta e spostamento della clip
  speedCost: 0.3,         // per m/s fra la corsa e la velocita' d'entrata della clip
  travel: { 1: 1, 2: 1, 3: 0.8, 4: 0.6 },   // frazione dello spostamento della clip; 3 e 4 crescono con la corsa
  ground: { 3: 0.3, 4: 0.5 },              // secondi a terra prima del rialzo
  wonChance: 0.5          // contrasto pulito: probabilita' che il portatore sbilanciato reagisca (livello 1)
};

// Aspetto della palla (ball-look.js). Disegni originali generati in codice,
// mai copie dei palloni ufficiali: una base e dei livelli (fasce ondulate
// attorno a cerchi massimi, triangoli sulle facce dell'icosaedro, falci
// attorno ai suoi vertici). ink: colore dei loghi monocromi e del filo attorno
// al logo della competizione; badge: il disco stampato sotto quel logo.
// logos: false toglie tutti i loghi (competizione e sponsor).
export const BALL_LOOK = {
  logos: true,
  size: { low: 1024, medium: 2048, high: 2048 },   // larghezza della mappa dei colori
  roughness: 0.4,
  bump: 0.004,
  seamDark: 0.42,         // luminosita' in fondo alla cucitura
  // sponsor (src/assets/match3d/ball/sponsor): tint 'ink' = colore del disegno
  sponsors: [
    { file: 'sponsor 1.png', name: 'Veltora', fromDark: true, tint: 'ink' },
    { file: 'sponsor 2.png', name: 'Astra', tint: 'ink' },
    { file: 'sponsor 3.png', name: 'Zenith', tint: 'ink' },
    { file: 'sponsor 4.png', name: 'emblema blu', tint: null }
  ],
  // Disposizione (longitudine e latitudine in gradi, larghezza in cm): la
  // competizione due volte sull'equatore, ai due lati; fra le due il marchio
  // principale (Zenith) due volte; Veltora e Astra in alto e in basso,
  // l'emblema piccolo sopra e sotto i loghi della competizione. Da ogni lato
  // se ne vedono due o tre, mai sovrapposti.
  layout: {
    competition: [{ at: [0, 0], cm: 5.2 }, { at: [180, 0], cm: 5.2 }],
    sponsors: [
      { sponsor: 2, at: [90, 0], cm: 7.5 }, { sponsor: 2, at: [-90, 0], cm: 7.5 },
      { sponsor: 0, at: [45, 58], cm: 4.6 }, { sponsor: 1, at: [-135, -58], cm: 4.2 },
      { sponsor: 3, at: [0, 36], cm: 2.6 }, { sponsor: 3, at: [180, -36], cm: 2.6 }
    ]
  },
  designs: {
    generica: {
      base: '#f3f4f1', ink: '#1d2740', badge: '#f3f4f1',
      layers: [
        { type: 'band', axis: [1, 0, 0], w: 0.034, k: 3, amp: 0.16, color: '#1d2740' },
        { type: 'band', axis: [0, 1, 0], w: 0.034, k: 3, amp: 0.16, color: '#1d2740', phase: 0.5 },
        { type: 'band', axis: [0, 0, 1], w: 0.034, k: 3, amp: 0.16, color: '#1d2740', phase: 1 },
        { type: 'band', axis: [1, 0, 0], w: 0.01, k: 3, amp: 0.16, shift: 0.05, color: '#d23b3b' },
        { type: 'band', axis: [0, 0, 1], w: 0.01, k: 3, amp: 0.16, shift: 0.05, color: '#d23b3b', phase: 1 }
      ]
    },
    'serie-a': {
      base: '#f6f6f2', ink: '#14307a', badge: '#ffffff',
      layers: [
        { type: 'band', axis: [1, 1, 1], w: 0.085, k: 2, amp: 0.26, color: '#14307a' },
        { type: 'band', axis: [1, -1, -1], w: 0.085, k: 2, amp: 0.26, color: '#14307a', phase: 1.3 },
        { type: 'band', axis: [1, 1, 1], w: 0.009, k: 2, amp: 0.26, shift: 0.105, color: '#d4ad55' },
        { type: 'band', axis: [1, -1, -1], w: 0.009, k: 2, amp: 0.26, shift: -0.105, color: '#d4ad55', phase: 1.3 },
        { type: 'band', axis: [-1, 1, -1], w: 0.02, k: 3, amp: 0.2, color: '#2fa36b' }
      ]
    },
    champions: {
      base: '#0d1a3a', ink: '#ffffff', badge: '#ffffff', light: '#ffffff',
      layers: [
        { type: 'crescent', r0: 0.3, r1: 0.27, shiftAngle: 0.1, color: '#e8edf5' },
        { type: 'band', axis: [0, 1, 0], w: 0.004, k: 0, amp: 0, color: '#8fa3c7' },
        { type: 'band', axis: [1, 0, 0], w: 0.004, k: 0, amp: 0, color: '#8fa3c7' },
        { type: 'band', axis: [0, 0, 1], w: 0.004, k: 0, amp: 0, color: '#8fa3c7' }
      ]
    },
    premier: {
      base: '#f6f5f8', ink: '#38003c', badge: '#ffffff',
      layers: [
        { type: 'tri', gap: 0.05, pick: { mod: 2, keep: [0] }, color: '#38003c' },
        { type: 'tri', gap: 0.12, pick: { mod: 2, keep: [1] }, color: '#e90052', alpha: 0.9 },
        { type: 'band', axis: [1, 0.3, 0], w: 0.008, k: 4, amp: 0.1, color: '#04f5ff' }
      ]
    },
    inverno: {
      base: '#e4ee2c', ink: '#14213d', badge: '#ffffff',
      layers: [
        { type: 'band', axis: [1, 0, 0], w: 0.06, k: 3, amp: 0.18, color: '#14213d' },
        { type: 'band', axis: [0, 0, 1], w: 0.06, k: 3, amp: 0.18, color: '#14213d', phase: 1 },
        { type: 'band', axis: [0, 1, 0], w: 0.012, k: 4, amp: 0.12, color: '#e5452f' }
      ]
    }
  }
};

// Gesti di chi commette un fallo (skill: "Ogni fallo ha una causa visibile"):
// il fallo nasce da un contatto vero. Di corsa sul portatore (defense.bodyContact)
// chi decide di fare fallo entra a `start` m centro-centro con un gesto della
// libreria: spinta (mano sulla schiena), trattenuta (mano sulla maglia),
// spallata (spalla contro spalla); quasi fermo, la spinta a due mani. La mano
// va sulla maglia con l'IK del braccio (moves.HandOn) e il fallo c'e' solo se
// al fotogramma del contatto il palmo e' entro `reach` m dal punto della
// maglia (la spalla entro `shoulderReach` dal busto). Nei contrasti e nelle
// scivolate il piede (moves.FootOn) va sulla caviglia: fallo solo entro
// `legReach` (contrasto) o `slideReach` (scivolata, piedi contro gambe).
export const FOULACT = {
  start: 1.7,
  contactDist: 0.7,       // m centro-centro al contatto della mano o della spalla
  minLead: 0.12,          // s minimi fra l'inizio del gesto e il contatto
  after: 0.35,            // s di clip dopo il contatto
  holdShare: 0.4,         // quota di trattenute (da dietro o di lato); il resto spinte o spallate
  holdAt: 0.25,           // s della clip della trattenuta a cui la mano arriva sulla maglia
  holdTime: 0.4,          // s di mano sulla maglia dopo il contatto (spinta: pushTime)
  pushTime: 0.12,
  standBelow: 0.35,       // m/s: sotto, la spinta a due mani da fermo (sul posto)
  runMin: 3.5,            // m/s: fra le due nessun gesto (la clip da fermo traslerebbe, quella di corsa scivolerebbe)
  rate: [0.6, 1.6],       // playback del gesto: dal passo della corsa, entro questi limiti
  reach: 0.3,
  shoulderReach: 0.45,    // spalla di chi entra dalla spalla piu' vicina di chi subisce
  window: 0.15,           // s dopo il contatto previsto in cui la mano o la spalla puo' ancora toccare
  legReach: 0.24,
  slideReach: 0.26,
  legLead: 0.14,          // s prima del contatto del contrasto in cui si decide l'esito e parte l'IK del piede
  shirt: 0.13,            // m: punto della maglia, dalla schiena verso chi entra
  ik: { lead: 0.22, rate: 9, turn: 22, arm: 26, leg: 30 },
  clips: {
    // R/L: vittima alla destra o alla sinistra di chi entra
    spinta: { R: '079_Defender_Left_Push_Win_01', L: '083_Defender_Right_Push_Win_01' },
    trattenuta: { R: '076_Defender_Left_Push_01', L: '080_Defender_Right_Push_01' },
    carica: { R: '069_Defender_Collision_Shoulder_Inside_R', L: '068_Defender_Collision_Shoulder_Inside_L' },
    ferma: '692_Stand_Hand_Push_up'
  },
  // mano del gesto quando la clip non la dice (trattenuta: il braccio alzato)
  hand: { '076_Defender_Left_Push_01': 'Right', '080_Defender_Right_Push_01': 'Left' }
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
  error: 0.12,
  // altezza e salto: le fasce del colpo di testa valgono per refHeight m e
  // refJump m di elevazione e si spostano con l'altezza e il salto del
  // giocatore; contrasto aereo fra due avversari sulla stessa palla (entro
  // duelDist m e duelTime s): vince piu' spesso chi ha altezza piu' salto
  // piu' strength x forza maggiori (logistica di scala duelScale m)
  refHeight: 1.82, refJump: 0.5, duelDist: 1.6, duelTime: 0.25, strength: 0.1, duelScale: 0.05
};

// Portieri.
export const KEEPER = {
  depth: [1.0, 3.0],      // distanza dalla linea: palla lontana, palla vicina (a 6 m un pallonetto lo scavalcava)
  depthRange: [45, 12],   // distanza della palla a cui si passa da un valore all'altro
  maxZ: 3.2,              // non si sposta oltre questa distanza dal centro della porta
  alertDist: 32,          // palla entro tanti metri dalla porta: in guardia (animazione)
  react: [0.32, 0.2],     // secondi di reazione a un tiro [difficulty 0, 1] (prima 0,28-0,12)
  penaltyReact: 0.04,     // sul rigore il lato e' gia' scelto: parte subito
  // errore (m) sul punto d'intercetto previsto [attributo basso, alto]. Piccolo:
  // gli attributi contano nella portata e nella reazione (reach, react), e un
  // tiro parabile si para; fino a 0,5 m mandava il tuffo nel punto sbagliato
  aim: [0.05, 0.02],
  claimDist: 7,           // cross che cade entro questa distanza dalla porta: esce
  rushDist: 16,           // palla libera entro questa distanza: esce a prenderla
  chargeDist: 40,         // uscita chiesta dall'utente: solo con la palla entro tanti metri dalla porta
  holdTime: 1.4,          // secondi con la palla in mano prima del rinvio
  throwMax: 28,           // compagno libero entro questa distanza: rimessa con le mani
  stepSpeed: 2.6,         // m/s massimi in guardia senza scatto (passi del portiere che non scivolano)
  // Tiro parabile per gli attributi (KeeperAI.assess): dopo la reazione le
  // mani arrivano a body + arm metri dall'asse del corpo (armLow sotto lowY m
  // di altezza) in armTime secondi; il tuffo aggiunge fino a `dive` metri
  // [attributo basso, alto] in diveTime secondi; niente sopra `up` metri.
  // offPlace: metri dal suo posto oltre cui un gol e' "portiere fuori posizione".
  // Solo i punti fra `behind` m dietro e `ahead` m davanti a lui (KEEPER.plan):
  // il portiere non arretra durante il tiro, un pallonetto alle spalle non e' parabile.
  // up: le mani delle clip di parata arrivano al massimo a 2,2-2,3 m (336, presa alta).
  reach: { body: 0.3, arm: 0.6, armLow: 0.45, lowY: 0.35, armTime: 0.15, dive: [1.7, 2.4], diveTime: 0.55, up: 2.15, behind: 0.3, offPlace: 1.5 },
  // Attesa della parata con tempo: passi laterali verso il punto (oltre minWait
  // s alla partenza), ripianificata ogni `every` s, mai a meno di `line` m dalla linea.
  shuffle: { minWait: 0.3, every: 0.12, line: 0.4 },
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
  // Prese con la palla in mano dal primo fotogramma (Keeper_Ball_*): da `held`
  // s in poi, in tuffo fino a quando il bacino scende sotto `landY` m.
  saveWindow: { before: 0.3, after: 0.2, lead: 0.6, held: 0.15, landY: 0.5 },
  saveScale: { dive: { a: [0, 1.2], s: [0.5, 1.3] }, stand: { a: [0, 1.2], s: [0, 1.6] }, claim: { a: [0.2, 1.6], s: [0, 2.2] } },
  saveBias: { catch: 0, parry: 0.1, dive: 0.02, punch: 0.08 },
  plan: {
    step: 2,              // punti della traiettoria provati: uno ogni tanti passi di fisica
    horizon: 2,           // secondi di traiettoria
    ahead: 2.2,           // metri davanti al portiere in cui si cerca l'intercetto
    behind: 0.8,          // metri dietro (verso la porta)
    maxY: 3.2,            // punti piu' alti di cosi' non si provano
    rateMax: 1.25,        // la clip si accelera al massimo di tanto (prima 1,8: tuffi a doppia velocita')
    rateCost: 0.08,       // costo di una clip accelerata o rallentata
    skipCost: 1.5,        // per secondo di clip saltato all'inizio (clip fatta partire piu' avanti)
    standLat: 0.45,       // palla entro tanti metri di lato: solo parate in piedi
    maxResidual: 0.6,     // oltre questo scarto le mani non arrivano: non si prova
    shortGap: 0.35,       // m in piu' di cui restano corte le mani su un tiro non parabile (avambracci compresi)
    wide: 0.5             // tiro fuori dallo specchio di tanto: si lascia andare
  },
  // Uscite sui palloni alti: prese e pugni della libreria (keeper.js, claimOptions).
  claimPlan: { step: 2, horizon: 3, ahead: 5, behind: 1.5, maxY: 2.5, rateMax: 1.6, rateCost: 0.08, every: 0.12, accept: 0.5 },
  ik: { lead: 0.3, hold: 0.12, fade: 0.25, gap: 0.02, track: 1.6, rate: 8, turn: 12, arm: 20, urgentRate: 20, urgentTurn: 28 },   // secondi attorno al contatto; track: m entro cui le mani seguono la palla vera; rate: 1/s, velocita' massima del peso dell'IK; turn: rad/s massimi del braccio per effetto del peso; arm: rad/s massimi della soluzione IK
  catchSpeed: 24,         // presa: sotto questa velocita' la palla resta in mano
  diveCatchSpeed: 15,     // in tuffo si blocca solo sotto questa velocita'
  diveCatch: [0.5, 0.9],  // e con questa probabilita' [attributo basso, alto]
  parryRest: 0.42,        // respinta di mano: velocita' restituita lungo la normale
  parryOut: 3,            // m/s minimi in avanti di una respinta che finiva in porta
  bodyRest: 0.25,         // palla sul corpo
  parryLift: [1.5, 3.5],  // m/s verso l'alto dopo una respinta di mano
  lock: 0.35,             // dopo una respinta il portiere non la riprende subito
  palmsCatch: [0.42, 0.65], // per trattenerla i due palmi entro tanti metri dal centro della palla [tuffo, presa]
  upright: 0.7,           // bacino sopra tanti metri: in piedi, la parata finita si puo' chiudere
  smother: 0.6,           // in una presa la palla sul corpo si raccoglie con i palmi entro tanti metri
  gather: { maxY: 0.4, side: 0.25, reach: 0.45 },   // palla bassa che passa sotto le mani di una presa (keeper.gathered)
  // Collisione palla-portiere: sfere sulle ossa vere. [osso, osso verso cui
  // spostarsi, frazione, raggio, mano?]
  body: [
    ['LeftHand', 'LeftHandMiddle1', 0.6, 0.1, true], ['RightHand', 'RightHandMiddle1', 0.6, 0.1, true],
    ['LeftForeArm', 'LeftHand', 0.5, 0.06, true], ['RightForeArm', 'RightHand', 0.5, 0.06, true],
    ['Head', null, 0, 0.12, false], ['Spine2', null, 0, 0.17, false], ['Spine', null, 0, 0.15, false], ['Hips', null, 0, 0.16, false],
    ['LeftUpLeg', 'LeftLeg', 0.5, 0.09, false], ['RightUpLeg', 'RightLeg', 0.5, 0.09, false],
    ['LeftLeg', 'LeftFoot', 0.5, 0.07, false], ['RightLeg', 'RightFoot', 0.5, 0.07, false],
    ['LeftLeg', 'LeftFoot', 0.85, 0.07, false], ['RightLeg', 'RightFoot', 0.85, 0.07, false],
    ['LeftFoot', 'LeftToeBase', 0.5, 0.07, false], ['RightFoot', 'RightToeBase', 0.5, 0.07, false]
  ],
  bodyCheck: 3.5,         // si controllano le sfere solo con la palla entro tanti metri
  hitLead: 0.4,           // m: al massimo tanto prosegue una sfera nel passo (keeper.bodyHit)
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
  attachRate: 18,         // 1/s: palla che passa a una mano sola e si appoggia sul palmo
  holdRate: 8,            // 1/s: la presa a due mani entra e si scioglie senza scatti
  holdTurn: 12,           // rad/s massimi del braccio per effetto del peso della presa
  holdArm: 20,            // rad/s massimi della soluzione IK della presa
  // Palla tenuta a due mani mai dentro il corpo: fra i palmi della clip
  // (portiere che aspetta col pallone al ventre) il centro cadeva 8 cm dal
  // bacino. Si sposta in avanti quanto basta per restare fuori da queste
  // sfere [osso, osso verso cui spostarsi, frazione, raggio] (piu' holdClear di aria).
  holdBody: [['Hips', null, 0, 0.16], ['Spine', null, 0, 0.15], ['Spine1', null, 0, 0.15], ['Spine2', null, 0, 0.17],
    ['LeftUpLeg', 'LeftLeg', 0.35, 0.1], ['RightUpLeg', 'RightLeg', 0.35, 0.1]],
  holdClear: 0.01
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
  // All'indietro (ancore oltre `from` rad) fra bande di corsa (da minSpeed
  // m/s): una banda per volta, la lenta fino a `rate` volte la sua velocita';
  // cambio con isteresi di `hyst` m/s (Locomotion.bandMix). Solo gli stili
  // dei giocatori di movimento.
  backBands: { from: 1.9, minSpeed: 2, rate: 1.55, hyst: 0.15, styles: ['normal', 'defense', 'dribble'] },
  styleRate: 7,           // 1/s: passaggio da uno stile all'altro (palla al piede, guardia...)
  slotRelease: 1.5,       // s a peso zero dopo cui l'azione di una fessura si libera
  readyRate: 4,           // 1/s: il portiere entra ed esce dalla guardia
  // stile difesa (guardia): portatore avversario entro dist m, entro angle rad
  // dal busto, chi difende sotto speed m/s
  guard: { dist: 4, angle: 1.1, speed: 4.2 },
  matchBias: 0.3,         // quanto conta allontanarsi dall'istante preferito (m^2 al secondo)
  walkFull: 0.5,          // quota della camminata dello stile oltre cui i passi pesano del tutto (niente posa ferma che trasla)
  minRate: 0.6,           // playback minimo e massimo delle clip di corsa
  maxRate: 2,
  dirMaxRate: 2.1,        // clip direzionali (sono corsette): un po' piu' accelerate
  blend: 40,              // 1/s: filtro dei pesi del blend tree
  blendMax: 6,            // variazione massima di un peso al secondo (niente pose che saltano)
  hipsTurn: 6,            // rad/s massimi di cui la fusione della corsa gira il bacino (Locomotion.limitHips)...
  hipsMinStep: 0.25,      // ...ma i pesi fanno sempre almeno questa frazione del loro passo
  hipsOutlier: 1.6,       // rad: in una direzione, fuori dalla corsa la clip col bacino girato oltre tanto dalle altre (buildLoco)
  stillDrop: 2,           // ...per le pose da fermo che scendono mentre il giocatore si sposta (oltre endMove)
  stepRise: 1.5,          // ...e per i passi che salgono, finche' resta della posa da fermo
  // Salto isolato di un osso all'uscita del mixer (Avatar.smoothJumps): oltre
  // jump rad in un passo e ratio volte il passo prima (minimo floor), la posa
  // riparte da quella mostrata e ci arriva con costante di tempo `time` s.
  inertia: { time: 0.06, jump: 0.3, ratio: 4, floor: 0.03 },
  // Bacino nel mondo (Avatar.trackHips): la velocita' angolare mostrata cambia
  // al massimo di accel rad/s^2 (0,11 rad/passo di differenza fra un passo e
  // il successivo: niente picchi ne' "fermo e poi scatto"), mai oltre vmax
  // rad/s (0,67 rad/passo, sotto il limite di 0,8 del test). Un giro di 180
  // gradi saltato dalla fusione si recupera in circa 0,18 s.
  hipsTrack: { accel: 400, vmax: 40 },
  fingerRate: 15,         // rad/s: le dita non girano mai piu' in fretta (Avatar.smoothJumps)
  boneRate: 45,           // rad/s: nessun altro osso gira piu' in fretta (0,75 rad a 60 fps; il test ne ammette 0,8)
  speedSpring: 14,        // 1/s: molla critica della velocita' che decide i pesi (partenze, arresti)
  angleRate: 30,          // 1/s: filtro dell'angolo fra corsa e busto
  maxSpeed: 12,           // m/s: oltre, uno spostamento e' un riposizionamento, non una corsa
  dirHold: 0.3,           // m/s: sotto, la direzione della corsa resta quella di prima
  dirSnap: 0.12,          // quota di corsa sotto cui la direzione si prende subito, senza filtro
                          // (a 0,3 a passo lento il bacino girava di colpo fra passi laterali e in avanti)
  // Corpo visibile: da `from` a `to` m/s l'angolo fra corsa e corpo scende da
  // pi a minAngle (twist: rad del busto verso lo sguardo); turnSlow/turnFast/
  // gestureTurn: rad/s massimi da fermi, in corsa, durante un gesto.
  // twistFade: rad prima di pi in cui la torsione del busto torna a zero.
  // gestureTurn sotto ANIM.inertia.jump a passo (0,2 rad): a 20 rad/s, 0,33 dal
  // primo fotogramma, il giro del corpo all'inizio di un contrasto sembrava
  // un salto, la correzione lo teneva fermo e poi lo lasciava andare (0,36)
  warp: { from: 3.6, to: 6, minAngle: 0.35, twist: 0.55, twistFade: 0.6, turnSlow: 7, turnFast: 5, gestureTurn: 12 },
  liftRelease: 0.6,       // m/s: il corpo alzato perche' i piedi non entrino nell'erba riscende piano
  turnStep: 0.45,         // m/s di passo per rad/s di rotazione da fermi: girandosi si fanno piccoli passi
  turnStepMax: 1.2,
  // Inclinazione di tutto il corpo, dai piedi: nelle curve verso l'interno,
  // in avanti quando accelera, indietro quando frena. rad per m/s^2.
  // body: rad per asse di cui s'inclina tutto il corpo, attorno ai piedi,
  // cambiando al massimo di bodyRate rad/s; il resto lo fa il busto sopra il
  // bacino (Avatar.lean)
  lean: { roll: 0.02, maxRoll: 0.2, pitch: 0.012, maxPitch: 0.07, maxBack: 0.05, rate: 8, body: 0.055, bodyRate: 0.3 },
  // Piedi fermi a terra nell'appoggio (IK sulle gambe), finche' la clip non
  // li porterebbe troppo lontano. Solo sotto maxSpeed m/s: in corsa il piede
  // restava indietro e la gamba si tendeva. reach: frazione della lunghezza
  // della gamba oltre cui il piede si libera (mai la gamba tesa del tutto).
  // pole: m davanti al ginocchio della clip (asse di piegatura x gamba) che
  // tengono il piano del ginocchio.
  footLock: { on: true, maxSpeed: 2.5, minMove: 0.25, ramp: 0.15, release: 0.2, drift: 0.22, liftEarly: 0.25, reach: 0.985, pole: 0.4 },
  // limiti naturali del braccio in gradi (rig.armAngles): asse del gomito
  // fuori dalla cerniera, torsione dell'avambraccio e della mano, piega del
  // polso. Nelle 601 clip: 12,7 / 63 / 82 (99,9 percentile) / 99; nelle
  // dissolvenze fra due clip il gomito arriva a 29. Il gomito storto
  // dell'IK di prima stava fra 90 e 180
  armLimits: { hinge: 35, twist: 70, hand: 95, wrist: 100 },
  fadeIn: 0.15,           // cross-fade verso un gesto (0,15-0,25 s)
  fadeOut: 0.22,
  chainFade: 0.18,        // due gesti di fila: il primo sfuma sotto il secondo
  endMove: 0.5,           // m/s: oltre, un gesto la cui clip sta per finire, o non si sposta, sfuma nella corsa
  stillRoot: 0.3,         // m/s della radice sotto cui la clip di un gesto sta ferma (Match.tick)
  chainTurn: 0.6,         // rad: una clip che tiene la rotazione, girata almeno cosi', sfuma piano sotto il gesto nuovo (Avatar.update)
  syncMinSpeed: 1.2,      // sotto questa velocita' il calcio non cerca il passo in corso
  // Calci: `lead` secondi reali dal comando al contatto del piede, uguali a
  // ogni livello; la clip scelta parte e si accelera per rispettarli.
  // recover: secondi dopo il contatto prima di tornare a correre.
  kickRate: [0.6, 1.8],
  // rad: durante il calcio il corpo gira come la clip; quel che manca alla
  // direzione voluta si aggiunge fino al contatto, al massimo tanto
  kickCorr: 0.6,
  // come nel riferimento il piede si carica solo negli ultimi 0,10-0,13 s
  // (prima c'e' KICK.setup di corsa o conduzione)
  pass: { role: 'pass', lead: 0.12, recover: 0.3, moveMag: 0.35, turn: 4 },
  through: { role: 'pass', lead: 0.12, recover: 0.3, moveMag: 0.35, turn: 4 },
  cross: { role: 'long', lead: 0.15, recover: 0.35, moveMag: 0.3, turn: 4 },
  shot: { role: 'shot', lead: 0.13, recover: 0.4, moveMag: 0.3, turn: 4 },
  kickFade: 0.8,          // ingresso del calcio: al piu' questa frazione del caricamento (pieno al contatto)
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
  // Partenze e arresti seguono la distanza percorsa (Player.stepTransition):
  // drive.rate e' il playback [min, max] ammesso, drive.onset i m/s della
  // radice da cui entra una partenza da fermi, drive.match i secondi di clip
  // attorno all'ingresso in cui si cerca la posa dei piedi piu' simile. Un arresto o un giro sul posto
  // interrotti da una nuova corsa diventano una partenza sotto restartBelow
  // m/s; altrimenti sfumano nella corsa in `cut` s. Un gesto fermo sotto
  // quello nuovo sfuma in redoFade s, turnedFade se tiene la rotazione ed e'
  // girato (Avatar.update).
  trans: {
    startBelow: 0.35, startWant: 0.5, startTop: 4.5,
    stopAbove: 2.2, stopWant: 0.3, stopTail: 0.15, stopFade: 0.2,
    turnAbove: 1.0, turnAngle: 2.2, turnLag: 0.12, turnHold: 0.5, turnTail: 0.3,
    inPlaceBelow: 0.3, inPlaceWant: 0.5, inPlaceAngle: 1.3, inPlaceRate: 2.2,
    rate: [0.7, 1.8], lead: 0.06, fade: 0.12, cooldown: 0.35,
    drive: { rate: [0.5, 2.2], fadeRate: 1.2, onset: 0.3, match: 0.35 },
    restartBelow: 2, cut: 0.07, redoFade: 0.1, turnedFade: 0.12,
    match: { yaw: 1, speed: 0.35, dir: 1.5, accept: 1.2 }
  },
  // Pesi della scelta per corrispondenza (anim-pick.js): rad fra la direzione
  // in cui la clip calcia e quella voluta (kick), rad di rotazione (turn, stop),
  // metri di lato della palla, m/s, posa dei piedi, potenza, altezza della
  // palla; keep: vantaggio della clip gia' usata dal giocatore per quel ruolo.
  // runAbove: m/s oltre cui si scelgono solo clip che entrano in corsa (runClip: m/s d'entrata della clip)
  // move: per m/s che la radice di un calcio fa in meno del giocatore fino al contatto
  match: { turn: 1.2, kick: 3, side: 2.5, speed: 0.25, pose: 1, power: 0.6, height: 1.5, lob: 1, inPlace: 0.8, rate: 0.4, keep: 0.2, runAbove: 2.5, runClip: 1.5, move: 0.5 }
};

// Pacchetti della libreria di animazioni per livello di qualita' (anim-lib.js):
// alto tutto all'avvio, medio l'essenziale all'avvio e il resto durante la
// partita, basso solo l'essenziale. Fisica, IA e comandi non cambiano.
// meshy: esultanze generate con Meshy sul Calciatore (capriola, ruota;
// tools/match3d/meshy_build.py), nel mazzo delle esultanze con le Studio33.
export const ANIMLIB = {
  levels: {
    high: { start: ['core', 'more', 'extra', 'meshy'], later: [] },
    medium: { start: ['core'], later: ['more', 'extra', 'meshy'] },
    low: { start: ['core'], later: [] }
  },
  optional: ['meshy']
};

// Telecamera di gioco come nel riferimento (docs/match3d-riferimento.md, A1):
// carrello sul lato +Z, guarda il punto inquadrato da `distance` metri con
// `tilt` gradi di inclinazione e lo stesso campo visivo orizzontale su ogni
// schermo (46 m di campo in larghezza al centro). In larghezza la mira sta a
// followZ della palla piu' aimZ verso la telecamera, e la telecamera si
// avvicina di distanceZ metri per metro di palla verso di lei: cosi' si
// sposta del 40% della palla e si abbassa, come nel riferimento.
export const CAMERA = {
  hfov: 44.7,             // gradi orizzontali (21,4 verticali su uno schermo 2,17:1)
  tilt: 25.7,
  distance: 55.6,         // palla al centro in larghezza: telecamera alta 24 m
  distanceZ: 0.4,
  followX: 1,
  followZ: 0.76,
  aimZ: 1.1,
  // vicino alle aree (|x| della mira da `from` a `to`) piu' bassa e un po'
  // piu' vicina: tilt gradi e closer metri in meno, 41-44 m di campo in larghezza
  area: { from: 22, to: 34, closer: 1.5, tilt: 3 },
  // calcio d'inizio: larga sul cerchio (60 m) finche' non si batte, poi torna
  // alla visuale di gioco in `blend` secondi
  kickoff: { distance: 64, tilt: 22.7, hfov: 50, blend: 1.2 },
  maxFov: 75,
  limitX: 44,
  rate: 7,                // 1/s: insegue la palla con circa 0,14 s di ritardo, senza anticipo
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
  // Esultanza: chi segna fa una delle 26 clip della libreria (pacchetto extra,
  // un mazzo mischiato per partita), altrimenti quella Mixamo; se la clip
  // finisce prima dello stacco segue `filler`. Fino a `gather.max` compagni
  // entro `gather.range` m lo raggiungono dopo `gather.delay` s, gli si fermano
  // attorno a `gather.radius` m ed esultano con le clip di `gather.clips`.
  // Il cerchio sta dove la clip porta chi esulta; un posto a meno di
  // `gather.pathClear` m dalla sua corsa si sposta di lato; la corsa della
  // clip di un compagno si accorcia perche' si fermi a `gather.hug` m da lui.
  celebration: {
    clip: 'celebration', filler: '059_Ceremony',
    gather: { delay: 0.8, max: 4, range: 40, radius: 2.4, pathClear: 1.6, hug: 0.8, clips: ['052_Ceremony', '033_Celebration_01_ForSequence', '059_Ceremony', '034_Celebration_02_ForSequence'] },
    // gli altri si scansano a passo entro `dist` m dalla corsa di chi esulta,
    // fino a `ahead` s davanti a lui (main.clearWay)
    clear: { dist: 1.8, ahead: 0.6 },
    // clip del pacchetto `pack` (Meshy): corsa di `run` m (a `margin` m dalle
    // linee) durante la diretta, gesto `lead` s prima del primo piano
    late: { pack: 'meshy', run: 7, margin: 3, lead: 0.2 }
  },
  // Calcio d'inizio come nel riferimento (4 calci d'inizio di v1, dal radar):
  // al centro solo chi batte, che passa all'indietro al giocatore del punto
  // kick[receiver]; la palla gli arriva a `arrive` m/s. Schieramento in metri
  // con la propria porta verso x negative e z come sullo schermo: `kick` per
  // chi batte (lui escluso), `defend` per l'altra squadra; ognuno va al punto
  // piu' vicino al suo posto nel modulo. L'IA tocca la palla `aiContact` s
  // dopo che lo schieramento e' in vista. La clip KickOff si sceglie per la
  // direzione del compagno (135, 180, 225 gradi); lead: s dal via al
  // contatto, after: s dopo il contatto.
  kickoff: {
    clips: ['444_KickOff_135', '445_KickOff_180', '446_KickOff_225'], lead: 0.5, after: 0.25, arrive: 10, aiContact: 2.75,
    receiver: 3,
    kick: [[-17.6, -2.9], [-17.6, 5], [-11.7, -15.9], [-11.7, 0.8], [-11.7, 18], [-2.9, -24.5], [-2.9, -10.2], [-2.9, 12.2], [-2.9, 26.2]],
    defend: [[-1, 10.8], [-2.2, -12.2], [-6, 20], [-9.7, -5.9], [-9.8, 8.9], [-11.7, 1.5], [-14.7, -10.6], [-14.9, 13.5], [-17.5, 5.2], [-17.5, -2.1]]
  },
  // Rimessa: in attesa si resta fermi nel primo fotogramma (palla in mano),
  // poi la clip riparte da li'; la rincorsa della radice (2,07 m fino al
  // rilascio) riporta il battitore sulla linea.
  // lineGap: piedi oltre la linea al rilascio (la rincorsa della clip parte da
  // rules.throwStart); stepTol/stepMag: chi batte si sistema a passi entro
  // tanti metri, a questa frazione della corsa; un lancio chiesto prima di
  // essere girato e al posto parte appena lo e', al piu' dopo alignWait s;
  // la mira segue la levetta solo tenuta oltre aimStick (non mentre torna al centro).
  // cone: rad attorno a dove guarda in cui si cerca il compagno; senza
  // nessuno, nello spazio a spaceShort/spaceLong metri (con la potenza)
  throwIn: { clip: 'throw_in', from: 0, release: 1.55, end: 2.3, rate: 1.25, lineGap: 0.15, shortApex: 0.9, longApex: 3.2, shortMax: 16, longMax: 30,
    stepTol: 0.08, stepMag: 0.35, alignWait: 0.6, aimStick: 0.5, runScale: [0.4, 1.8], cone: 0.45, spaceShort: [7, 14], spaceLong: [14, 26],
    // prima del lancio (PES) chi batte si gira verso dove la mandera': al
    // massimo turnMax rad dalla perpendicolare alla linea, coi giri sul posto
    // della libreria gia' da turnFrom rad; l'IA lancia girata entro aimTol
    // rad (o dopo aimWait s). Intanto la palla sta al petto: chest = metri
    // davanti e sotto l'osso Spine2
    turnMax: 1.2, turnFrom: 0.35, aimTol: 0.15, aimWait: 2.6, chest: [0.3, -0.1] },
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
  base: { carica: -0.1, spinta: -0.08, trattenuta: -0.12, pressing: 0.2, contrasto: 0.28, scivolata: 0.38 },
  back: 0.32,             // intervento da dietro
  side: 0.08,
  speed: 0.03,            // per m/s di chi entra
  ballFirst: -0.3,        // prima la palla, poi l'uomo
  noBall: 0.1,            // l'uomo e basta
  noise: 0.25,
  yellow: 0.6,
  secondYellow: 0.15,     // gia' ammonito: per il secondo giallo serve tanto di piu'
  red: 1.45,               // rossi rari: circa uno ogni 8-10 partite (test di durata)
  // azione promettente fermata: vittima lanciata verso la porta (speed m/s)
  // entro dist metri, al massimo `defenders` avversari fra lei e la porta
  promising: { add: 0.28, dist: 45, speed: 3, defenders: 2 },
  dogsoDist: 26,          // chiara occasione da gol: vittima entro tanti metri dalla porta avversaria
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
  signal: { rise: 0.2, hold: 1.4, fall: 0.3, turn: 12 },   // secondi del gesto; turn: rad/s massimi del braccio per effetto del peso
  cardSize: [0.075, 0.105],
  attrs: { pac: 72, sho: 50, pas: 50, dri: 50, def: 50, phy: 70 }
};

// Fischietto sintetizzato con WebAudio: due toni con trillo.
export const SOUND = {
  whistle: { f1: 2950, f2: 3180, trill: 28, depth: 110, gain: 0.12, short: 0.32, long: 0.9, gap: 0.15 }
};

// Rallentatore di debug (F4): per guardare transizioni e contatti piede-palla.
export const DEBUG = { slowMotion: 0.25 };

// Replay di debug (tape.js): gli ultimi `seconds` s a `hz` fotogrammi al
// secondo, salvati con F9, Share/View o dal menu di pausa. events: fatti di
// gioco tenuti in memoria; videoBits: qualita' del video WebM.
export const TAPE = { hz: 60, seconds: 10, events: 300, videoBits: 8e6 };

// Dopo il gol (main.goalShow, replay.js), tempi misurati sui 4 gol di v1
// (docs/match3d-riferimento.md, tappa 5). Inquadrature del replay: alta e
// larga dalla tribuna, laterale bassa dal bordo campo con lo zoom che segue
// la distanza, alta dall'altro lato verso la porta, dietro la porta.
// camRate, lookRate: 1/s, quanto in fretta la telecamera segue la palla.
export const REPLAY = {
  // registrazione: `seconds` s a `hz`; dopo il gol si registra ancora `after` s
  hz: 30, seconds: 13, after: 0.6,
  // regia come nei 4 gol di v1: diretta `live` s con la telecamera di gioco,
  // primo piano di chi esulta `close` s, stacco col logo `sting` s (entra in
  // stingIn s, esce negli ultimi stingOut s), replay, stacco, calcio d'inizio
  live: 4.2, close: 5, sting: 1.05, stingIn: 0.3, stingOut: 0.3,
  // replay: secondi rispetto al gol, velocita' e dissolvenza in entrata (s);
  // un'inquadratura con meno di minShot s registrati si salta
  shots: [
    { cam: 'high', from: -11.9, to: -3.3, speed: 1 },
    { cam: 'side', from: -3.3, to: 0.5, speed: 1, dissolve: 0.4 },
    { cam: 'reverse', from: -3.3, to: 0.5, speed: 1 },
    { cam: 'goal', from: -1.9, to: 0.25, speed: 0.45, dissolve: 0.4 }
  ],
  minShot: 1.5,
  closeCam: { dist: 5, height: 1.4, look: 1.1, fov: 30, rate: 2.5, turn: 1.2, inside: 4 },   // inside: m oltre le linee fin dove puo' stare
  highCam: { height: 16, back: 24, follow: 0.75, fov: 20 },
  sideCam: { height: 4, dist: 14, edge: 3, lead: 5, frame: 14, fov: [10, 30] },   // frame: m visibili in altezza sull'azione, fov min e max
  reverseCam: { back: 48, height: 15, side: -14, goalPull: 0.35, fov: 28 },
  goalCam: { back: 9, height: 6, follow: 0.4, fov: 38 },
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
  sampleSeconds: 1.5
};

// Luce della partita (main.js, render.js, stadium.js): `preset` sceglie
// giorno o sera. Giorno come nel riferimento (docs/match3d-riferimento.md,
// A6): sole alto 65 gradi dalla destra dello schermo e un po' dal lato della
// telecamera, ombre di 0,8 m verso sinistra; all'ombra l'erba riceve circa
// meta' della luce. Sera: i riflettori, la resa di prima.
// sun.dir: verso il sole (x lungo il campo, z verso la telecamera);
// exposure: tone mapping ACES; lamps: luce dei pannelli dei fari; crowd:
// luminosita' del pubblico (sagome senza luce propria).
export const LIGHT = {
  preset: 'day',
  day: {
    hemi: { sky: 0xd6e6ff, ground: 0x3c4a2c, intensity: 1 },
    sun: { color: 0xfff2dc, intensity: 2.4, dir: [0.389, 0.906, 0.161] },
    exposure: 1.32,
    background: 0x7fa9d6,
    sky: { top: 0x2f63a8, horizon: 0x7fa9d6, glow: 0x5d7f9e },
    lamps: 0.4,
    crowd: 0.75
  },
  night: {
    hemi: { sky: 0xdfe8ff, ground: 0x2c3a24, intensity: 1.1 },
    sun: { color: 0xffffff, intensity: 1.6, dir: [-0.419, 0.838, 0.349] },
    exposure: 1.05,
    background: 0x0a111c,
    sky: { top: 0x02050b, horizon: 0x16233a, glow: 0x1e2e4a },
    lamps: 4,
    crowd: 0.5
  },
  sunDistance: 71.6       // metri fra il sole e il centro dell'ombra dinamica
};

// Indicatori sopra i giocatori (main.syncMarkers, hud.setCursor/setBar/setName):
// ancora a `head` m dal suolo; il nome di chi prende palla resta nameTime s,
// poi sfuma in `fade` s; oltre nameMax caratteri diventa iniziale e cognome.
export const MARKS = { head: 1.95, nameTime: 1.6, fade: 0.3, nameMax: 14 };

// Contorno dello stadio (stadium.js e pitch.js).
export const STADIUM = {
  skyRadius: 480,
  stands: { depth: 26, rise: 14 },
  floodlights: { out: 30, height: 40, poleRadius: 0.9, panel: [12, 6], tilt: 0.55 },
  crowd: {
    row: 0.95,            // metri fra due file, lungo la tribuna
    seat: 0.62,           // metri fra due posti
    fill: 0.72,           // posti occupati
    size: [0.55, 1.05],   // sagoma: larghezza e altezza
    skin: 0xc9a07e,
    cheerTime: 7,         // secondi di esultanza dopo un gol
    neutral: ['#39414d', '#5a6270', '#7a6a58', '#2d3f55', '#6b3b3b', '#4c5a3c', '#8a8d93'],
    density: { low: 0.35, medium: 0.65, high: 1 }
  },
  // modello del progetto 3ds Max (stadium-<livello>.glb): taglio davanti alla
  // telecamera (puo' stare dentro la tribuna VIP), materiali da ritagliare con
  // l'alfa, vetri, luci sotto il tetto, curve (oltre endFrom m dalla linea di
  // fondo) col tifo di una squadra, persone nell'atlante dei tifosi
  model: {
    clipAhead: 8,
    cutout: ['Seats', 'Fence 01', 'Fence 02'],
    glass: ['Glass', 'Windows', 'Roof Glass Plates'],
    glassOpacity: 0.35,
    lamps: 1.2,
    endFrom: 8,
    atlasCells: 9,             // persone in crowd.png (stadium_sprites.py)
    crowdSize: [1.15, 2.3],    // metri della cella dell'atlante: piedi in basso
    crowdLight: 0.95,
    groundDrop: 0.1
  }
};
