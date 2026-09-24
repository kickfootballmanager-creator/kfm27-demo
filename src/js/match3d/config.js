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
  decel: 14,              // m/s^2 quando si molla il joystick
  coastDecel: 5,          // chi ha appena passato finisce la corsa rallentando
  faceTurn: 2,            // rotazione del busto verso la palla rispetto alla sterzata
  strafeSpeed: 0.7,       // corsa laterale o all'indietro: frazione della velocita' massima
  turnSlowBoost: 2,       // da fermo si gira fino a 3 volte piu' in fretta
  turnBrake: 0.35,        // velocita' minima conservata in una curva a 90 gradi
  fieldMargin: 0.6,       // distanza minima dai cartelloni
  ringInner: 0.62,
  ringOuter: 0.8,
  targetRingInner: 0.7,
  targetRingOuter: 0.8
};

// Palla al piede: distanza dal centro del giocatore (m). Il piede sta circa
// 0,1 m avanti al centro, quindi la palla resta fra 0,4 e 0,7 m dal piede.
export const DRIBBLE = {
  rest: 0.5,              // da fermo
  walk: 0.56,
  sprint: 0.66,
  swing: 0.12,            // il tocco allunga la palla di tanto, poi torna
  side: 0.1,              // spostata verso il piede destro, quello che tocca
  touchRate: 1.9,         // tocchi per metro percorso (rad/m)
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
  buffer: 0.4             // un comando dato un attimo prima di ricevere vale lo stesso
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

export const PASS = {
  cone: 0.7,              // semiapertura del cono di ricerca (rad)
  coneNoStick: 1.2,       // joystick fermo: si cerca in un cono piu' largo davanti al giocatore
  minDist: 3,
  maxDist: 55,
  wAngle: 1,              // pesi del punteggio: piu' basso e' meglio
  wDist: 0.45,
  wFree: 0.6,
  freeRadius: 8,          // un avversario entro questa distanza "copre" il compagno
  wPower: 0.5,            // la potenza sposta la scelta verso compagni piu' lontani
  lead: 0.6,              // frazione del movimento del compagno anticipata dal passaggio
  arriveSpeed: 8,         // velocita' residua del rasoterra quando arriva al compagno
  pressArrive: 2,         // in piu' se passatore o ricevente sono pressati
  powerArrive: 1,         // in piu' a potenza piena
  blindDist: 14,          // nessun compagno nel cono: passaggio nello spazio
  speedError: 0.08        // errore relativo sulla forza, scalato dall'attributo
};

// Filtrante: rasoterra nello spazio davanti al compagno che corre.
export const THROUGH = {
  cone: 0.9,
  minLead: 5,             // metri davanti al compagno, a potenza zero
  maxLead: 13,            // a potenza piena
  arriveSpeed: 4,         // arriva lenta nello spazio: ci corre sopra il compagno
  wSpace: 0.8             // peso dello spazio libero davanti al compagno
};

// Cross dalle fasce verso l'area, lancio lungo altrove. Palla alta che
// atterra sul bersaglio.
export const CROSS = {
  wingZ: 14,              // oltre questa distanza dal centro (in larghezza) si e' in fascia
  finalThird: 17,         // e oltre questa coordinata d'attacco si crossa
  apexMin: 3.2,           // altezza massima della parabola, a potenza zero
  apexMax: 6.5,           // a potenza piena
  targets: [              // punti dell'area: distanza dalla linea di porta, z (verso la fascia di chi crossa)
    { back: 11, z: 0 }, { back: 7, z: -3 }, { back: 7, z: 3 }, { back: 12, z: -6 }, { back: 6, z: -1 }
  ],
  mateRadius: 6,          // compagni che contano per scegliere il punto
  longMin: 18,            // lancio: compagni almeno cosi' lontani
  longSpace: 32,          // lancio senza compagni nel cono: nello spazio
  apexLong: 7,
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

export const SHOT = {
  minSpeed: 20,
  loftMin: 0.05,          // rad a potenza zero
  loftMax: 0.19,          // rad a potenza piena
  overPower: 0.85,        // oltre questa soglia la mira peggiora e la palla si alza
  overLoft: 0.08,
  overError: 1.6,
  sprintError: 1.35,
  postMargin: 0.45        // la mira resta dentro i pali di questo margine
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
  shotSpeed: [27, 32],
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
  run: { every: [2.5, 5], depth: 12, max: 2 },        // inserimenti: ogni quanto, quanto oltre, quanti insieme
  press: { max: 1, maxOwnThird: 2, contain: 1.4, delay: [0.45, 0.12] },   // delay: [difficulty 0, 1]
  mark: { radius: 14, goalSide: 1.8 },
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
    error: [1.6, 0.8]     // moltiplicatore dell'errore di passaggio e tiro [difficulty 0, 1]
  },
  tackleRate: [0.9, 2.4], // tentativi di contrasto al secondo a contatto [difficulty 0, 1]
  slideChance: [0.08, 0.2],
  intercept: { base: 0.3, def: 0.5, speed: 0.012 }    // probabilita' d'intercetto: base + def*attr - speed*v
};

// Contrasto in piedi (tackle): affondo breve, la palla parte al contatto.
export const TACKLE = {
  clip: 'tackle', from: 0.1, contact: 0.45, until: 0.7, rate: 1.25,
  reach: 1.35,            // dal piede di chi entra alla palla
  foot: 0.7,              // il piede e' a questa distanza davanti al giocatore
  poke: 4.5,              // m/s della palla tolta
  keep: 0.45,             // probabilita' di tenerla invece di allontanarla
  dribbleResist: 0.35,    // quanto il dribbling di chi ha palla riduce la riuscita
  lock: 0.35              // chi l'ha appena persa non la riprende subito
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
  reach: [2.6, 3.6],      // portata laterale del tuffo [attributo basso, alto]
  save: [0.62, 0.9],      // probabilita' di arrivarci se e' in portata [difficulty 0, 1]
  catchSpeed: 24,         // sotto questa velocita' blocca, sopra respinge
  parry: 0.45,            // frazione della velocita' dopo la respinta
  claimDist: 7,           // cross che cade entro questa distanza dalla porta: esce
  rushDist: 16,           // palla libera entro questa distanza: esce a prenderla
  holdTime: 1.4,          // secondi con la palla in mano prima del rinvio
  throwMax: 28,           // compagno libero entro questa distanza: rimessa con le mani
  // clip: contatto (secondi della clip), fine, spostamento laterale della radice alla parata
  clips: {
    catch: { clip: 'gk_catch', from: 0.1, contact: 0.43, end: 1.1 },
    high: { clip: 'gk_catch_high', from: 0.45, contact: 0.83, end: 2.2 },
    block: { clip: 'gk_block_', from: 0.45, contact: 0.95, end: 2.8 },
    dive: { clip: 'gk_dive_', from: 0.55, contact: 1.15, end: 2.9 },
    scoop: { clip: 'gk_scoop_', from: 0.45, contact: 0.85, end: 2.0 },
    claim: { clip: 'gk_catch_run_', from: 1.0, contact: 1.567, end: 2.5 },
    throw: { clip: 'gk_throw', from: 0.9, contact: 1.617, end: 2.6 },
    dropkick: { clip: 'gk_dropkick', from: 1.2, contact: 2.083, end: 3.1 },
    concede: { clip: 'gk_concede', from: 0, end: 2.9 }
  }
};

export const KIT = {
  home: { primary: '#e8ecf0', secondary: null, shorts: '#1b2230', pattern: 'solid' },
  away: { primary: '#1d4f9c', secondary: null, shorts: '#f2f4f5', pattern: 'solid' },
  // portieri: colori che non si confondono con nessuna divisa di movimento
  keeperHome: { primary: '#2e9e5b', secondary: null, shorts: '#1b2230', socks: '#2e9e5b', pattern: 'solid' },
  keeperAway: { primary: '#e0b52a', secondary: null, shorts: '#1b2230', socks: '#e0b52a', pattern: 'solid' }
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
  roughness: 0.8
};

// Animazioni. `natural`: velocita' (m/s, modello alto 1,80) a cui la clip non
// fa scivolare i piedi. `phase`: frazione del ciclo con il piede sinistro
// avanti, per tenere allineate le clip che si fondono.
export const ANIM = {
  loco: [
    { clip: 'idle', speed: 0 },
    { clip: 'walk', speed: 1.6, natural: 2.32, phase: 0.2 },
    { clip: 'run', speed: 4.5, natural: 2.74, phase: 0.227 },
    { clip: 'sprint', speed: 7.5, natural: 5.02, phase: 0.234 }
  ],
  // corsa guardando altrove (ricezione): angolo fra busto e direzione di corsa
  dir: [
    { from: 0.6, left: 'jog_diag_fwd_left', right: 'jog_diag_fwd_right', natural: 2.38 },
    { from: 1.2, left: 'strafe_left', right: 'strafe_right', natural: 2.4 },
    { from: 2.2, left: 'jog_diag_back_left', right: 'jog_diag_back_right', natural: 2.03 }
  ],
  dirMinSpeed: 1,
  keeperSideMin: 0.3,     // m/s laterali oltre cui il portiere fa il passo laterale
  keeperSideFull: 1.2,
  keeperStepNatural: 2.11,
  minRate: 0.6,           // playback minimo e massimo delle clip di corsa
  maxRate: 1.8,
  blend: 10,              // 1/s: velocita' della fusione fra clip
  fadeIn: 0.08,
  fadeOut: 0.22,
  // Secondi della clip: si parte da `start`, la palla parte a `contact`, il
  // fotogramma in cui il piede destro e' piu' veloce (player.motion.json).
  // Di prima la clip parte `firstTime` secondi prima del contatto.
  pass: { clip: 'pass', start: 0.2, contact: 0.417, recover: 0.3, moveMag: 0.35, turn: 4 },
  through: { clip: 'pass', start: 0.2, contact: 0.417, recover: 0.3, moveMag: 0.35, turn: 4 },
  cross: { clip: 'pass', start: 0.15, contact: 0.417, recover: 0.35, moveMag: 0.3, turn: 4 },
  shot: { clip: 'shot', start: 0.2, contact: 0.45, recover: 0.4, moveMag: 0.3, turn: 4 },
  firstTime: 0.08,
  recoverMove: 0.35,      // joystick ridotto mentre si finisce il tiro
  receive: { clip: 'receive', start: 0.1, length: 0.6 },
  chainFade: 0.15         // due gesti di fila: il primo sfuma sotto il secondo
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
  fovRate: 1.2
};

// Regole e tempi della partita. Falli, fuorigioco e rigori non ci sono ancora.
export const RULES = {
  fouls: false,
  offside: false,
  penalties: false,
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
  celebration: { clip: 'celebration', from: 0, hold: 4.6 },
  kickoff: { clip: 'kickoff', from: 0, contact: 0.517, end: 0.567, arrive: 7 },
  throwIn: { clip: 'throw_in', from: 0.8, release: 1.55, end: 2.3, outside: 1.7, shortApex: 0.9, longApex: 3.2, shortMax: 16, longMax: 30 },
  goalKick: { x: 5.5, z: 5 },  // metri dalla linea di porta, dal centro della porta
  cornerInset: 0.4
};

export const RENDER = {
  maxPixelRatio: 2,
  minPixelRatio: 0.6,
  lowFps: 48,
  highFps: 58,
  resStep: 0.15,
  sampleSeconds: 1.5,
  background: 0x0a111c
};
