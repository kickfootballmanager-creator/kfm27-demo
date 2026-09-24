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

// Fase 2: il giocatore controllato e tre compagni fermi, porta vuota.
// Coordinate relative al verso d'attacco: x avanti, z a destra.
export const PRACTICE = {
  slots: [
    { x: 30, z: 4, roles: ['ATT', 'SP', 'COC'], number: 9 },
    { x: 12, z: 16, roles: ['AD', 'ED', 'TD'], number: 7 },
    { x: 20, z: -18, roles: ['AS', 'ES', 'TS'], number: 11 },
    { x: -0.9, z: 0, roles: ['CC', 'COC', 'CDC'], number: 8, kickoff: true }
  ]
};

export const KIT = {
  home: { primary: '#e8ecf0', secondary: null, shorts: '#1b2230', pattern: 'solid' },
  away: { primary: '#1d4f9c', secondary: null, shorts: '#f2f4f5', pattern: 'solid' }
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
  maxFov: 75,
  lead: 0.35,             // anticipo in secondi nella direzione della palla
  limitX: 44,
  rate: 2.6,              // velocita' dello smorzamento (1/s)
  fovRate: 1.2
};

export const RULES = {
  goalPause: 2.6,         // secondi fra gol e ripresa
  outPause: 1.4
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
