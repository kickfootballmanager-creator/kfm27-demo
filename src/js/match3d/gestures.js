import { TACKLE, SLIDE, DOWN, AERIAL, FEINT, KEEPER, PITCH, GOAL, CONTROL, ATTR } from './config.js';
import { rootAt, clipDuration } from './avatar.js';
import { headingOf } from './player.js';

// Contrasto, scivolata, caduta, colpo di testa, rovesciata, portiere: azioni (p.action)
// che main.stepAction fa avanzare; gli eventi scattano al fotogramma misurato in player.motion.json.

const HL = PITCH.length / 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const unit = (v, lo, hi) => clamp((v - lo) / (hi - lo), 0, 1);
const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) * 2;

// Azione con lo spostamento della radice: tempi in secondi della clip.
export function rootAction(m, p, clip, from, end, rate, extra) {
  return Object.assign({
    root: true, clip, from, t: 0, rate, end: end - from,
    x0: p.pos.x, z0: p.pos.z, h0: p.heading, r0: rootAt(m.tpl, clip, from), scaleA: 1, scaleS: 1
  }, extra);
}

function defUnit(p) { return unit(p.params.tackle, ATTR.tackle[0], ATTR.tackle[1]); }
function driUnit(p) { return unit(p.params.dribbleSpeed, ATTR.dribbleSpeed[0], ATTR.dribbleSpeed[1]); }

// --- contrasto in piedi
export function startTackle(m, p) {
  if (p.action || p.down) return;
  const T = TACKLE, b = m.ball;
  p.heading = headingOf(b.pos.x - p.pos.x, b.pos.z - p.pos.z);
  p.avatar.playOnce(T.clip, T.from, (T.until - T.from) / T.rate, T.rate);
  p.action = rootAction(m, p, T.clip, T.from, T.until, T.rate, {
    tackle: true,
    events: [{ at: T.contact - T.from, fn: () => resolveTackle(m, p) }]
  });
}

function resolveTackle(m, p) {
  const T = TACKLE, b = m.ball;
  const fx = p.pos.x + p.dirX * T.foot, fz = p.pos.z + p.dirZ * T.foot;
  if (Math.hypot(b.pos.x - fx, b.pos.z - fz) > T.reach || b.pos.y > 0.8 || !b.live) return;
  const owner = m.owner;
  if (owner && owner.team === p.team) return;
  if (owner) {
    const shield = owner.action && owner.action.feint ? FEINT.shield : 1;
    const chance = p.params.tackle * (1 - T.dribbleResist * driUnit(owner)) * shield;
    if (Math.random() > chance) return;
    m.kickLock = { p: owner, t: T.lock };
    if (Math.random() < T.keep) { m.gain(p, 'contrasto'); return; }
    b.kick(p.dirX * T.poke + gauss() * 1.2, 0, p.dirZ * T.poke + gauss() * 1.2);
    m.poss.loose('contrasto', p);
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
  const clip = S.clip + '_' + (toBall < 0 ? 'left' : 'right');
  const end = clipDuration(m.tpl, clip);
  p.avatar.playOnce(clip, S.from, (end - S.from) / S.rate, S.rate);
  const tripped = new Set();
  // chi entra in corsa scivola piu' lontano: la clip parte da fermo
  p.action = rootAction(m, p, clip, S.from, end, S.rate, {
    slide: true, scaleA: clamp(S.momentum[0] + p.speed / S.momentum[1], 1, S.momentum[2]),
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
          if (m.owner === o) {
            b.kick(o.vel.x * 0.8, 0.3, o.vel.z * 0.8);
            m.poss.loose('scivolata', p);
          }
          trip(m, o);
        }
      }
    }
  });
}

// --- caduta, a terra, rialzo
export function trip(m, o) {
  const s = Math.hypot(o.vel.x, o.vel.z);
  if (s > 0.5) o.heading = headingOf(o.vel.x, o.vel.z);
  o.down = true;
  if (m.ctrl === o) m.buffer = null;
  const end = clipDuration(m.tpl, 'tripped');
  o.avatar.playOnce('tripped', 0, end + 0.5);
  o.action = rootAction(m, o, 'tripped', 0, end, 1, {
    scaleA: DOWN.fallTravel * Math.min(1, 0.4 + s / 7), scaleS: DOWN.fallTravel * 0.3,
    onEnd: () => {
      o.avatar.playLoop('down_idle');
      o.action = { clip: 'down_idle', t: 0, rate: 1, end: DOWN.groundTime, onEnd: () => getUp(m, o) };
    }
  });
}

function getUp(m, o) {
  const G = DOWN.getUp;
  o.avatar.playOnce(G.clip, G.from, G.to - G.from);
  o.action = { clip: G.clip, t: 0, rate: 1, end: G.to - G.from, onEnd: () => { o.down = false; } };
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
  tries.push({ C: A.jump, lo: A.jumpAbove, hi: A.headMax }, { C: A.header, lo: A.headMin, hi: A.jumpAbove });
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
  if (!b.live || m.poss.owned) return;
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

// --- gesti del portiere: parata (presa o respinta), uscita, rinvio
export function startKeeperGesture(m, k, clip, from, contact, end, rate, o) {
  k.avatar.playOnce(clip, from, (end - from) / rate, rate);
  k.keeperBusy = !o.release;
  const tc = contact - from;
  k.action = rootAction(m, k, clip, from, end, rate, {
    keeper: true, scaleA: o.scaleA, scaleS: o.scaleS,
    tick: (a) => {
      const b = m.ball;
      if (o.release) {
        if (!a.done && a.t >= tc) { a.done = true; release(m, k, o); }
        return;
      }
      if (!o.save || a.done || a.t < tc - 0.22 || a.t > tc + 0.3 || !b.live || m.poss.owned) return;
      const hy = o.pickup ? 0.3 : 1.1;
      if (Math.hypot(b.pos.x - k.pos.x, b.pos.z - k.pos.z) > (o.pickup ? 1.5 : 1.9) || Math.abs(b.pos.y - hy) > 1.6) return;
      a.done = true;
      if (o.catchIt) {
        m.gain(k, 'parata');
        k.holding = true;
      } else {
        // respinta verso l'esterno e in alto, lontano dal centro dell'area
        const d = m.dirOf(k.team);
        const sp = Math.max(6, Math.hypot(b.vel.x, b.vel.z) * KEEPER.parry);
        const side = Math.sign(b.pos.z) || (Math.random() < 0.5 ? -1 : 1);
        b.kick(d * sp * 0.3, 3.5 + Math.random() * 2.5, side * sp);
        m.poss.loose('parata', k);
        m.kickLock = { p: k, t: 0.6 };
      }
    },
    onEnd: () => { k.keeperBusy = false; }
  });
}

function release(m, k, o) {
  const b = m.ball, t = o.target;
  k.holding = false;
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
