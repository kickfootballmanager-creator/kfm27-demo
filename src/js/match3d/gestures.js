import { TACKLE, SLIDE, DOWN, AERIAL, KEEPER, PITCH, GOAL, CONTROL, ATTR, DUEL, FOUL } from './config.js';
import { rootAt, clipDuration } from './avatar.js';
import { pickTackle } from './anim-pick.js';
import { headingOf } from './player.js';
import { KeeperReach } from './moves.js';
import { duel, stagger, beat, passFirstChance, defUnit, missFoulChance, approach } from './defense.js';

// Contrasto, scivolata, caduta, colpo di testa, rovesciata, portiere: azioni (p.action)
// che main.stepAction fa avanzare; gli eventi scattano al fotogramma misurato
// dal build della libreria (contatti dal Ball_Bone) o in player.motion.json.

const HL = PITCH.length / 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) * 2;

// Azione con lo spostamento della radice: tempi in secondi della clip.
export function rootAction(m, p, clip, from, end, rate, extra) {
  return Object.assign({
    root: true, clip, from, t: 0, rate, end: end - from,
    x0: p.pos.x, z0: p.pos.z, h0: p.heading, r0: rootAt(m.tpl, clip, from), scaleA: 1, scaleS: 1
  }, extra);
}

const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const smooth = (u) => u * u * (3 - 2 * u);

// Clip che tengono dentro di se' la rotazione (portiere, cadute, finte): alla
// fine del gesto la rotazione passa al busto del giocatore, e l'anca viene
// ricorretta durante la dissolvenza (Avatar.yawFix): nessun giro all'indietro.
export function bakeYaw(m, p, clip, t) {
  const meta = m.tpl.meta[clip];
  if (!meta || !meta.keepYaw) return;
  const y = wrap(rootAt(m.tpl, clip, t).yaw);
  if (Math.abs(y) < 0.05) return;
  p.heading = p.prevHeading = p.moveHeading = wrap(p.heading + y);
  if (p.gait.vis !== null) p.gait.vis = wrap(p.gait.vis + y);
  p.avatar.yawFix = -y;
}

// --- contrasto in piedi: la clip della libreria scelta per corrispondenza
// (lato della palla, velocita') e l'affondo del corpo verso la palla deciso
// dal codice; esito al contatto del piede, dopo TACKLE.hit secondi.
// `manual`: Contrasto premuto (piu' rischioso del contrasto automatico del Pressing).
export function startTackle(m, p, manual = false) {
  if (p.action || p.down || p.stagger > 0) return false;
  const T = TACKLE, b = m.ball;
  // l'IA con palla vede arrivare il contrasto e puo' liberarsene prima
  const car = m.owner;
  if (car && car.team !== p.team && car !== m.ctrl && !car.keeper && Math.random() < passFirstChance(m, car)) m.teams[car.team].ai.passNow(car);
  const bx = b.pos.x - p.pos.x, bz = b.pos.z - p.pos.z;
  const pk = pickTackle(m.tpl, p, { lead: T.hit, speed: p.speed, ballLeft: -(bx * p.rightX + bz * p.rightZ) });
  if (pk) p.avatar.playOnce(pk.clip, pk.from, T.duration, pk.rate);
  const h0 = p.heading, x0 = p.pos.x, z0 = p.pos.z;
  // l'affondo insegue dove sara' la palla al contatto e si somma allo slancio della corsa
  const range = T.lunge + p.speed * T.hit;
  const pace = p.speed + T.lungeSpeed;
  p.action = {
    tackle: true, moves: true, clip: pk ? pk.clip : null, t: 0, rate: 1, end: T.duration,
    tick: (a, dt) => {
      const left = Math.max(0, T.hit - a.t);
      const ax = b.pos.x + b.vel.x * left - p.pos.x, az = b.pos.z + b.vel.z * left - p.pos.z, al = Math.hypot(ax, az) || 1;
      let nx = p.pos.x, nz = p.pos.z;
      if (a.t >= T.lungeFrom && a.t <= T.hit && al > T.contactDist) {
        const stepLen = Math.min(al - T.contactDist, pace * dt);
        nx += ax / al * stepLen; nz += az / al * stepLen;
        const ox = nx - x0, oz = nz - z0, ol = Math.hypot(ox, oz);
        if (ol > range) { nx = x0 + ox / ol * range; nz = z0 + oz / ol * range; }
      }
      p.moveTo(nx, nz, dt);
      if (a.t <= T.hit) p.heading = h0 + wrap(headingOf(ax, az) - h0) * smooth(Math.min(1, a.t / T.hit));
      p.moveHeading = p.heading;
    },
    events: [{ at: T.hit, fn: () => resolveTackle(m, p, manual) }]
  };
  return true;
}

// Al contatto del piede: palla recuperata, portatore che salta l'uomo o
// fallo (duel). Se la gamba non ci arriva il difensore resta sbilanciato.
function resolveTackle(m, p, manual) {
  const T = TACKLE, b = m.ball, owner = m.owner;
  if (owner && owner.team === p.team) return;
  const reach = b.live && b.pos.y <= 0.8 && Math.hypot(b.pos.x - p.pos.x, b.pos.z - p.pos.z) <= T.legReach;
  if (!reach) {
    // la gamba non arriva al pallone ma prende l'uomo: fallo, di solito da dietro o di lato
    if (owner && owner.team !== p.team && !owner.holding && Math.hypot(owner.pos.x - p.pos.x, owner.pos.z - p.pos.z) <= T.manReach &&
      Math.random() < missFoulChance(m, p, owner)) {
      m.lastDuel = { def: p, car: owner, result: 'foul' };
      m.foul(p, owner, { kind: manual ? 'contrasto' : 'pressing', ballFirst: false });
      return;
    }
    if (owner || m.poss.flying) stagger(p, DUEL.stagger.miss, manual);
    m.lastDuel = { def: p, result: 'vuoto', dist: Math.hypot(b.pos.x - p.pos.x, b.pos.z - p.pos.z) };
    return;
  }
  if (owner) {
    if (owner.holding) return;
    const result = duel(m, p, owner, manual);
    m.lastDuel = { def: p, car: owner, result };
    if (result === 'won') {
      m.kickLock = { p: owner, t: T.lock };
      if (Math.random() < T.keep) { m.gain(p, 'contrasto'); return; }
      b.kick(p.dirX * T.poke + gauss() * 1.2, 0, p.dirZ * T.poke + gauss() * 1.2);
      m.poss.loose('contrasto', p);
    } else if (result === 'foul') {
      m.foul(p, owner, { kind: manual ? 'contrasto' : 'pressing', ballFirst: false });
    } else {
      stagger(p, DUEL.stagger.beaten, manual);
      beat(m, owner, p);
    }
    return;
  }
  if (!m.poss.owned) m.gain(p, m.poss.flying && m.poss.team !== p.team ? 'intercetto' : 'controllo');
}

// --- scivolata nella direzione (dx, dz)
export function startSlide(m, p, dx, dz) {
  if (p.action || p.down) return;
  const S = SLIDE, b = m.ball;
  const l = Math.hypot(dx, dz) || 1;
  p.heading = headingOf(dx / l, dz / l);
  p.moveHeading = p.heading;
  const toBall = (b.pos.x - p.pos.x) * p.rightX + (b.pos.z - p.pos.z) * p.rightZ;
  const side = toBall < 0 ? 'left' : 'right';
  const clip = m.tpl.clips[S.clip[side]] ? S.clip[side] : 'slide_tackle_' + side;
  const end = clipDuration(m.tpl, clip);
  p.avatar.playOnce(clip, S.from, (end - S.from) / S.rate, S.rate);
  const tripped = new Set();
  // l'arbitro giudica la scivolata da dove e' partita, non da come si gira il portatore dopo
  const car0 = m.owner && m.owner.team !== p.team ? m.owner : null, from0 = car0 ? approach(p, car0) : null;
  // chi entra in corsa scivola piu' lontano: la clip parte da fermo
  p.action = rootAction(m, p, clip, S.from, end, S.rate, {
    slide: true, scaleA: clamp(S.momentum[0] + p.speed / S.momentum[1], 1, S.momentum[2]) * (m.tpl.meta[clip] ? S.travel : 1),
    tick: (a) => {
      if (a.t < S.window[0] || a.t > S.window[1]) return;
      const fx = p.pos.x + p.dirX * S.foot, fz = p.pos.z + p.dirZ * S.foot;
      const owner = m.owner;
      if (!a.hit && b.live && b.pos.y < 0.6 && Math.hypot(b.pos.x - fx, b.pos.z - fz) < S.reach && !(owner && owner.team === p.team) && !(owner && owner.holding)) {
        a.hit = true;
        if (!owner || Math.random() < S.success * (0.6 + 0.4 * defUnit(p))) {
          if (owner) m.kickLock = { p: owner, t: TACKLE.lock };
          b.kick(p.dirX * S.knock + gauss() * 2, 0.4, p.dirZ * S.knock + gauss() * 2);
          m.poss.loose('scivolata', p);
        }
      }
      // chi sta sulla traiettoria della scivolata cade
      for (const o of m.allPlayers()) {
        if (o.team === p.team || o.down || o.keeper || tripped.has(o)) continue;
        const bx = (p.pos.x + fx) / 2, bz = (p.pos.z + fz) / 2;
        if (Math.hypot(o.pos.x - bx, o.pos.z - bz) < S.body) {
          tripped.add(o);
          const from = o === car0 ? from0 : approach(p, o);
          if (m.owner === o) {
            b.kick(o.vel.x * 0.8, 0.3, o.vel.z * 0.8);
            m.poss.loose('scivolata', p);
          }
          trip(m, o);
          // fallo se l'uomo e' preso senza la palla, o da dietro anche dopo averla toccata
          if (!a.hit || from === 'back') m.foul(p, o, { kind: 'scivolata', ballFirst: !!a.hit, from });
        }
      }
    }
  });
}

// --- caduta, a terra, rialzo: una clip della libreria (DOWN.clip) che si
// ferma nell'ultimo istante a terra per DOWN.groundTime secondi.
export function trip(m, o) {
  const s = Math.hypot(o.vel.x, o.vel.z);
  if (s > 0.5) o.heading = headingOf(o.vel.x, o.vel.z);
  o.down = true;
  if (m.ctrl === o) m.buffer = null;
  const D = DOWN, meta = m.tpl.meta[D.clip];
  const rest = meta.ev.rest, end = meta.dur;
  const scaleA = D.fallTravel * Math.min(1, 0.4 + s / 7), scaleS = D.fallTravel * 0.3;
  o.avatar.playOnce(D.clip, 0, Infinity);
  o.action = rootAction(m, o, D.clip, 0, rest, 1, {
    scaleA, scaleS,
    onEnd: () => {
      o.avatar.resume(D.clip, 0, Infinity);
      o.action = { clip: D.clip, t: 0, rate: 1, end: D.groundTime, onEnd: () => getUp(m, o, D.clip, rest, end, scaleA, scaleS) };
    }
  });
}

// Chi subisce un fallo in un contrasto in piedi: caduta e rialzo della
// libreria, da una parte o dall'altra.
export function standFall(m, o) {
  if (o.down) return;
  const F = FOUL.standFall, clip = F.clip[Math.random() < 0.5 ? 'left' : 'right'];
  o.down = true;
  if (m.ctrl === o) m.buffer = null;
  const end = clipDuration(m.tpl, clip);
  o.avatar.playOnce(clip, 0, end);
  o.action = rootAction(m, o, clip, 0, end, 1, { scaleA: F.travel, scaleS: F.travel, onEnd: () => { o.down = false; bakeYaw(m, o, clip, end); } });
}

function getUp(m, o, clip, from, end, scaleA, scaleS) {
  o.avatar.resume(clip, 1, end - from);
  o.action = rootAction(m, o, clip, from, end, 1, { scaleA, scaleS, onEnd: () => { o.down = false; bakeYaw(m, o, clip, end); } });
}

// --- palloni alti: colpo di testa o rovesciata, avviati in anticipo perche'
// il contatto cada nel fotogramma giusto. intent: 'shot' | 'pass' | 'clear'.
export function tryAerial(m, p, intent) {
  if (p.action || p.down || (m.kickLock && m.kickLock.p === p)) return false;
  const b = m.ball, A = AERIAL;
  const d = m.dirOf(p.team);
  const goalDist = Math.hypot(d * HL - p.pos.x, p.pos.z);
  const facing = Math.abs(Math.atan2(Math.sin(p.heading - headingOf(d, 0)), Math.cos(p.heading - headingOf(d, 0))));
  const tries = [];
  if (intent === 'shot' && goalDist < A.bicycle.goalDist && facing > A.bicycle.backAngle) tries.push({ C: A.bicycle, lo: A.bicycle.min, hi: A.bicycle.max, bicycle: true });
  tries.push({ C: aerialSpec(m, A.jump), lo: A.jumpAbove, hi: A.headMax }, { C: aerialSpec(m, A.header), lo: A.headMin, hi: A.jumpAbove });
  const path = b.predict(m.aerialPath || (m.aerialPath = []), 1 / 60, 1.4);
  for (const { C, lo, hi, bicycle } of tries) {
    const tc = C.contact - C.from;
    const s = path[Math.min(path.length - 1, Math.max(0, Math.round(tc * 60) - 1))];
    if (!s || s.y < lo || s.y > hi) continue;
    const px = p.pos.x + p.vel.x * tc * 0.5, pz = p.pos.z + p.vel.z * tc * 0.5;
    if (Math.hypot(s.x - px, s.z - pz) > A.reach) continue;
    startAerial(m, p, C, intent, !!bicycle, s);
    return true;
  }
  return false;
}

// Tempi di un colpo di testa: contatto dal Ball_Bone della clip, partenza
// C.lead secondi prima (come prima), fine C.after dopo.
function aerialSpec(m, C) {
  const meta = m.tpl.meta[C.clip];
  if (!meta || !meta.ev || !meta.ev.contact) return C;
  const contact = meta.ev.contact.t;
  return { clip: C.clip, from: Math.max(0, contact - C.lead), contact, end: Math.min(meta.dur, contact + C.after) };
}

function startAerial(m, p, C, intent, bicycle, s) {
  if (!bicycle && Math.hypot(s.x - p.pos.x, s.z - p.pos.z) > 0.2) p.heading = headingOf(s.x - p.pos.x, s.z - p.pos.z);
  const end = Math.min(C.end, clipDuration(m.tpl, C.clip));
  p.avatar.playOnce(C.clip, C.from, end - C.from);
  p.action = rootAction(m, p, C.clip, C.from, end, 1, {
    aerial: true, scaleA: 0.3, scaleS: 0.3,
    events: [{ at: C.contact - C.from, fn: () => resolveAerial(m, p, intent, bicycle) }]
  });
}

function resolveAerial(m, p, intent, bicycle) {
  const b = m.ball, A = AERIAL;
  if (!b.live || m.poss.owned || m.phase !== 'play') return;
  // di testa su un pallone giocato quando era in fuorigioco
  if (m.checkOffside(p)) return;
  const lo = bicycle ? A.bicycle.min - 0.4 : A.headMin - 0.3, hi = bicycle ? A.bicycle.max + 0.4 : A.headMax + 0.3;
  if (Math.hypot(b.pos.x - p.pos.x, b.pos.z - p.pos.z) > A.reach * 1.4 || b.pos.y < lo || b.pos.y > hi) return;
  const d = m.dirOf(p.team);
  const err = A.error * (p.params.shotError / ATTR.shotError[1]) ** 0.5;
  if (intent === 'shot') {
    const tz = (Math.random() < 0.5 ? -1 : 1) * (GOAL.width / 2 - 0.6);
    const ang = Math.atan2(tz - b.pos.z, d * HL - b.pos.x) + gauss() * err;
    const sp = bicycle ? A.bicycleSpeed[0] + Math.random() * (A.bicycleSpeed[1] - A.bicycleSpeed[0]) : A.shotSpeed[0] + Math.random() * (A.shotSpeed[1] - A.shotSpeed[0]);
    const vy = bicycle ? 1.5 : -1.5 + Math.random() * 2.5;
    b.kick(Math.cos(ang) * sp, vy, Math.sin(ang) * sp);
    m.poss.fly('tiro', p, null, bicycle ? 'rovesciata' : 'colpo di testa');
  } else if (intent === 'pass') {
    const mate = m.nearestMate(p, p.pos.x + p.dirX * 10, p.pos.z + p.dirZ * 10);
    if (mate) { b.lobTo(mate.pos.x, mate.pos.z, Math.max(b.pos.y + 0.8, 2.6)); m.poss.fly('passaggio', p, mate, 'colpo di testa'); }
    else { b.kick(p.dirX * A.passSpeed, 2, p.dirZ * A.passSpeed); m.poss.fly('lancio', p, null, 'colpo di testa'); }
  } else {
    const ang = Math.atan2(b.pos.z * 0.3, d) + gauss() * 0.5;
    b.kick(Math.cos(ang) * A.clearSpeed, 7, Math.sin(ang) * A.clearSpeed);
    m.poss.fly('lancio', p, null, 'colpo di testa');
  }
  m.kickLock = { p, t: CONTROL.kickLock };
  if (p === m.ctrl && m.poss.to) m.switchTo(m.poss.to);
}

// --- gesti del portiere: parata, uscita, rinvio. La clip porta il corpo, l'IK
// sulle braccia (moves.KeeperReach) porta i palmi sulla palla attorno al
// contatto; se la palla si ferma lo decide la collisione (KeeperAI.touch).
// o.catch: parata che trattiene; o.dive: tuffo; o.point: punto previsto;
// o.release: rinvio ('throw' | 'kick') con o.spec = KEEPER.clips.throw o dropkick.
export function startKeeperGesture(m, k, clip, from, contact, end, rate, o) {
  const hold = (end - from) / rate;
  if (!(o.resume && k.avatar.resume(clip, rate, hold))) k.avatar.playOnce(clip, from, hold, rate);
  k.keeperBusy = !o.release;
  const tc = contact - from;
  const I = KEEPER.ik;
  const reach = o.release ? null : new KeeperReach(I.gap);
  if (reach) { reach.target.copy(o.point || m.ball.pos); k.avatar.playProc(reach); }
  k.action = rootAction(m, k, clip, from, end, rate, {
    keeper: true, scaleA: o.scaleA, scaleS: o.scaleS, catchable: !!o.catch, dive: !!o.dive,
    tick: (a) => {
      if (o.release) { releaseTick(m, k, a, o, from, tc); return; }
      // peso dell'IK: sale prima del contatto, resta un attimo, poi sfuma
      const tr = (a.t - tc) / rate;
      const w = tr < -I.lead ? 0 : tr < 0 ? smooth((tr + I.lead) / I.lead) : tr < I.hold ? 1 : Math.max(0, 1 - (tr - I.hold) / I.fade);
      // le mani vanno sul punto previsto e passano sulla palla vera man mano
      // che arriva (prima il bersaglio saltava sulla palla a I.track m: braccia a scatto)
      const b = m.ball;
      if (b.live && !m.poss.owned) {
        if (o.point) reach.target.copy(o.point).lerp(b.pos, smooth(Math.max(0, Math.min(1, 1 - b.pos.distanceTo(o.point) / I.track))));
        else reach.target.copy(b.pos);
      }
      reach.weight = m.owner === k ? 0 : w;
      reach.ttl = 0.25;
    },
    onEnd: () => {
      k.keeperBusy = false;
      if (reach) { reach.weight = 0; reach.ttl = 0; }   // l'IK sfuma (moves.KeeperReach), non si spegne di colpo
      bakeYaw(m, k, clip, end);
      if (k.holding && m.owner === k) holdPose(k);
    }
  });
}

// Palla in mano fra un gesto e il rinvio: la guardia con la palla al petto
// e' lo stile keeperBall della corsa, il gesto sfuma e basta.
export function holdPose(k) {
  k.avatar.endGesture();
}

// Rinvio: la palla passa a una mano sola, poi (al volo) cade dalla mano con
// la velocita' che aveva, infine parte al fotogramma del contatto.
function releaseTick(m, k, a, o, from, tc) {
  const C = o.spec, clipT = from + a.t;
  if (C.oneHand && clipT >= C.oneHand.at) k.holdHand = C.oneHand.hand;
  if (C.drop && !a.dropped && clipT >= C.drop && m.owner === k && k.holding) {
    a.dropped = true;
    k.holding = false;
    k.dropping = true;
    const b = m.ball;
    b.pos.copy(k.avatar.heldAt);
    b.prev.copy(b.pos);
    b.vel.copy(k.avatar.heldVel);
  }
  if (!a.done && a.t >= tc) { a.done = true; release(m, k, o); }
}

function release(m, k, o) {
  const b = m.ball, t = o.target;
  k.holding = false;
  k.dropping = false;
  k.holdHand = null;
  if (m.owner !== k) return;
  const d = m.dirOf(k.team);
  if (o.release === 'throw' && t) {
    b.lobTo(t.pos.x + t.vel.x * 0.5, t.pos.z + t.vel.z * 0.5, b.pos.y + 1.2);
  } else if (t) {
    b.lobTo(t.pos.x + t.vel.x * 1.5, t.pos.z + t.vel.z * 1.5, 13);
  } else {
    b.lobTo(d * 10, k.pos.z * 0.3, 13);
  }
  m.poss.fly('rinvio', k, t || null);
  m.kickLock = { p: k, t: CONTROL.kickLock };
  if (t && t.team === m.userSide) m.switchTo(t);
}
