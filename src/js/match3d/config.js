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
  radius: 0.11,
  visualScale: 1.9,       // solo grafica: da 60 m una palla vera e' di 4 pixel
  gravity: 9.81,
  airDrag: 0.013,         // resistenza quadratica: a = -k |v| v
  rollFriction: 1.1,      // m/s^2 costanti quando rotola
  rollDrag: 0.28,         // 1/s, proporzionale alla velocita' a terra
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

export const TEST_KICK = {
  groundPassMax: 14,      // entro questa distanza il tiro e' rasoterra
  minLoft: 0.2,           // angolo di tiro minimo (rad) oltre il rasoterra
  maxLoft: 0.62,
  loftDistance: 60,       // distanza a cui si arriva all'angolo massimo
  dragComp: 0.0045,       // compensazione della resistenza per metro
  maxSpeed: 34,
  spin: 0
};

export const CAMERA = {
  fov: 40,
  fovArea: 34,            // piu' stretta vicino alle aree
  areaX: 36,              // da qui in poi si considera "vicino all'area"
  height: 18,
  sideDistance: 58,       // distanza dal centro in Z (lato tribuna)
  followX: 0.92,          // quanto segue la palla lungo il campo
  followZ: 0.3,
  aimZ: 8,                // mira spostata verso la tribuna: la linea laterale vicina resta in quadro
  maxFov: 75,
  lead: 0.35,             // anticipo in secondi nella direzione della palla
  limitX: 40,
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
