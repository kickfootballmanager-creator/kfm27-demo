import { PRESS, DUEL, ATTR, PITCH, DRIBBLE, FEINT, RULES, TACKLE } from './config.js';
import { headingOf } from './player.js';

// Difesa stile PES. Pressing tenuto: corsa decisa sul portatore, da vicino
// marcatura stretta (jockey) rivolti verso di lui, e il contrasto parte da
// solo quando distanza e angolo lo permettono. L'esito del contrasto
// (duel) viene da attributi, tempismo, angolo e difficolta'.

const HL = PITCH.length / 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp2 = ([a, b], t) => a + (b - a) * t;
const unit = (v, lo, hi) => clamp((v - lo) / (hi - lo), 0, 1);
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

export const defUnit = (p) => unit(p.params.tackle, ATTR.tackle[0], ATTR.tackle[1]);
export const driUnit = (p) => unit(p.params.dribbleSpeed, ATTR.dribbleSpeed[0], ATTR.dribbleSpeed[1]);

// Stato del pressing di un giocatore: portatore seguito, angolo e distanza
// attorno a lui, secondi in marcatura stretta, prossimo contrasto possibile.
function pressState(p, car) {
  let s = p.press;
  if (!s || s.car !== car) {
    s = p.press = { car, ang: Math.atan2(p.pos.x - car.pos.x, p.pos.z - car.pos.z), r: PRESS.contain, engaged: 0, next: 0 };
  }
  return s;
}

// Angolo, visto dal portatore, della sua porta da difendere per `team`.
function goalSide(m, team, car) {
  const gx = -m.dirOf(team) * HL;
  return Math.atan2(gx - car.pos.x, -car.pos.z);
}

// Pressing dell'utente sul portatore `car`.
export function userPress(m, p, car, inp, dt) {
  const P = PRESS, s = pressState(p, car);
  const dx = car.pos.x - p.pos.x, dz = car.pos.z - p.pos.z, d = Math.hypot(dx, dz);
  if (s.engaged > 0 && d > P.release) s.engaged = 0;
  if (s.engaged <= 0 && d > P.engage) {
    // corsa decisa verso dove sara' il portatore
    const tx = dx + car.vel.x * P.lead, tz = dz + car.vel.z * P.lead;
    p.drive(dt, tx, tz, 1, { sprint: inp.sprint || d > P.sprintDist });
    s.ang = Math.atan2(-dx, -dz);
    s.r = clamp(d, P.minR, P.maxR);
    return;
  }
  s.engaged += dt;
  // jockey: con la levetta si gira attorno al portatore o si cambia distanza
  const k = 1 - Math.exp(-P.relax * dt);
  if (inp.mag > 0) {
    const ex = Math.sin(s.ang), ez = Math.cos(s.ang);   // dal portatore al difensore
    const vt = (inp.x * ez - inp.z * ex) * inp.mag * P.jockeySpeed;
    const vr = (inp.x * ex + inp.z * ez) * inp.mag * P.jockeySpeed;
    s.ang = wrap(s.ang + vt * dt / Math.max(s.r, 0.5));
    s.r = clamp(s.r + vr * dt, P.minR, P.maxR);
  } else {
    s.ang = wrap(s.ang + wrap(goalSide(m, p.team, car) - s.ang) * k);
    s.r += (P.contain - s.r) * k;
  }
  const tx = car.pos.x + Math.sin(s.ang) * s.r - p.pos.x, tz = car.pos.z + Math.cos(s.ang) * s.r - p.pos.z;
  const td = Math.hypot(tx, tz);
  const b = m.ball;
  p.drive(dt, tx, tz, Math.min(1, td / 0.6), { face: { x: b.pos.x - p.pos.x, z: b.pos.z - p.pos.z }, sprint: inp.sprint || td > 2.5 });
  autoTackle(m, p, s, lerp2(PRESS.autoReact, defUnit(p)), 1);
}

// Contrasto automatico: palla a portata, davanti al busto, a tempo.
// Portata: dove saranno palla e difensore al contatto del piede, se lui
// continua la sua corsa; l'affondo aggiunge TACKLE.lunge.
// `react`: secondi in marcatura prima del primo; `pace`: cadenza (IA piu' brava = piu' alta).
export function autoTackle(m, p, s, react, pace) {
  if (m.phase !== 'play' || p.action || p.down || p.stagger > 0 || s.engaged < react || m.poss.clock < s.next) return false;
  const b = m.ball, T = TACKLE, t = T.contact;
  const bx = b.pos.x + (b.vel.x - p.vel.x) * t - p.pos.x, bz = b.pos.z + (b.vel.z - p.vel.z) * t - p.pos.z;
  const d = Math.hypot(bx, bz);
  if (d > T.contactDist + T.lunge - PRESS.autoMargin || b.pos.y > 0.6) return false;
  // palla davanti al busto; se sara' fra i piedi l'angolo non conta
  if (d > PRESS.autoClose && Math.abs(wrap(headingOf(bx, bz) - p.heading)) > PRESS.autoAngle) return false;
  s.next = m.poss.clock + lerp2(PRESS.autoEvery, defUnit(p)) / pace;
  return m.startTackle(p);
}

// Stato di pressing per l'IA (stesse regole dell'utente, senza jockey).
export function aiPressState(p, car) { return pressState(p, car); }

// Difficolta' di chi gioca: l'utente e i suoi compagni a AI.mateDifficulty.
function skillOf(m, p) { return m.teams[p.team].ai.skill; }

// Da dove arriva il difensore rispetto a dove guarda il portatore.
function approach(def, car) {
  const ax = def.pos.x - car.pos.x, az = def.pos.z - car.pos.z, l = Math.hypot(ax, az) || 1;
  const c = (ax * car.dirX + az * car.dirZ) / l;
  return c > 0.45 ? 'front' : c < -0.3 ? 'back' : 'side';
}

// Probabilita' di fallo di un contrasto in piedi (0 se i falli sono spenti).
export function tackleFoulChance(def, car, manual) {
  if (!RULES.fouls) return 0;
  const F = DUEL.foul, a = approach(def, car);
  return (manual ? F.manual : F.auto) + (a === 'back' ? F.back : a === 'side' ? F.side : 0) +
    F.speed * Math.hypot(def.vel.x, def.vel.z);
}

// Esito del contrasto di `def` sul portatore `car`: 'won', 'foul' o 'beaten'.
export function duel(m, def, car, manual) {
  const b = m.ball;
  const exposed = clamp((Math.hypot(b.pos.x - car.pos.x, b.pos.z - car.pos.z) - DRIBBLE.rest) / (DRIBBLE.swing + 0.15), 0, 1);
  const shield = car.action && car.action.feint ? FEINT.shield : 1;
  const win = lerp2(DUEL.win, defUnit(def)) * (1 - DUEL.dribbleResist * driUnit(car)) * lerp2(DUEL.timing, exposed) *
    DUEL.angle[approach(def, car)] * (1 + DUEL.skillGap * (skillOf(m, def) - skillOf(m, car))) * (manual ? DUEL.manual : 1) * shield;
  const foul = tackleFoulChance(def, car, manual);
  const r = Math.random();
  return r < win ? 'won' : r < win + foul ? 'foul' : 'beaten';
}

// Contrasto a vuoto o saltato: il difensore resta sbilanciato.
export function stagger(p, secs, manual) {
  p.stagger = Math.max(p.stagger || 0, secs * (manual ? DUEL.staggerManual : 1));
}

// Il portatore salta l'uomo: la palla si allunga davanti a lui, lontano dal
// difensore, e lui accelera.
export function beat(m, car, def) {
  car.burst = DUEL.burst;
  car.ballDist = Math.min(car.ballDist + DUEL.knock, DRIBBLE.sprint + DUEL.knock);
  if (m.teams[car.team].ai && car !== m.ctrl) {
    const ax = car.pos.x - def.pos.x, az = car.pos.z - def.pos.z, l = Math.hypot(ax, az) || 1;
    const d = m.dirOf(car.team);
    const x = d + ax / l * 0.8, z = az / l * 0.8, n = Math.hypot(x, z) || 1;
    car.dribbleDir = { x: x / n, z: z / n };
  }
}

// IA con palla che vede partire un contrasto: la passa prima, se ci riesce.
export function passFirstChance(m, car) {
  return lerp2(DUEL.passFirst, skillOf(m, car)) * (0.5 + 0.5 * unit(ATTR.passError[0] - car.params.passError, 0, ATTR.passError[0] - ATTR.passError[1]));
}
