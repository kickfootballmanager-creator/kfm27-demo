import * as THREE from 'three';
import { TACKLE, SLIDE, AERIAL, KEEPER, PITCH, GOAL, CONTROL, ATTR, DUEL, REACT, ANIM, FOULACT } from './config.js';
import { rootAt, clipDuration } from './avatar.js';
import { pickTackle } from './anim-pick.js';
import { headingOf } from './player.js';
import { KeeperReach, HandOn, FootOn } from './moves.js';
import { palm } from './rig.js';
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
const _kh = new THREE.Vector3();

// Clip che tengono dentro di se' la rotazione (portiere, cadute, finte): alla
// fine del gesto la rotazione passa al busto del giocatore, e l'anca viene
// ricorretta durante la dissolvenza (Avatar.yawFix): nessun giro all'indietro.
export function bakeYaw(m, p, clip, t) {
  const meta = m.tpl.meta[clip];
  if (!meta || !meta.keepYaw) return;
  const y = wrap(rootAt(m.tpl, clip, t).yaw);
  if (Math.abs(y) < 0.05) return;
  // gesto gia' sfumato (respinta del portiere): il corpo che si vede e' la
  // corsa, che girata di colpo portava con se' il bacino fuori asse (3 cm in
  // un fotogramma); si gira come a ogni cambio di direzione
  const av = p.avatar;
  let w = 0;
  for (const g of [av.one, av.prevOne, ...av.older]) if (g && g.a.getClip().name === clip) w = Math.max(w, g.a.getEffectiveWeight());
  if (w < 0.05) { p.face(wrap(p.heading + y)); p.moveHeading = p.heading; return; }
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
  // velocita' dell'affondo verso dove sara' la palla al contatto: la clip
  // scelta si sposta quanto lui (una clip da fermo trascinata dall'affondo
  // traslava fino a 6 m/s). In conduzione la palla si stacca e rallenta fra
  // un tocco e l'altro: conta la corsa del portatore
  // un tocco appena dato la manda avanti piu' veloce di lui: la piu' lontana delle due
  const own = m.owner, cv = own && own.team !== p.team ? own.vel : b.vel;
  const far = (v) => Math.hypot(bx + v.x * T.hit, bz + v.z * T.hit);
  const reach = Math.min(T.lunge + p.speed * T.hit, Math.max(0, Math.max(far(cv), far(b.vel)) - T.contactDist));
  const lungeV = Math.min(p.speed + T.lungeSpeed, reach / Math.max(0.05, T.hit - T.lungeFrom));
  const pk = pickTackle(m.tpl, p, { lead: T.hit, speed: Math.max(p.speed, lungeV), reach, ballLeft: -(bx * p.rightX + bz * p.rightZ) });
  if (pk) p.avatar.playOnce(pk.clip, pk.from, T.duration, pk.rate);
  m.note('contrasto', { p, su: car && car.team !== p.team ? car : null, premuto: !!manual, clip: pk ? pk.clip : '' });
  const h0 = p.heading, x0 = p.pos.x, z0 = p.pos.z;
  // l'affondo insegue dove sara' la palla al contatto e si somma allo slancio
  // della corsa; con una clip che non si sposta (contrasto da fermo, quando la
  // palla scappa dopo la scelta) resta corto: il corpo non scivola verso la palla
  const r0 = pk && rootAt(m.tpl, pk.clip, pk.from), r1 = pk && rootAt(m.tpl, pk.clip, pk.contact);
  const still = pk && Math.hypot(r1.a - r0.a, r1.s - r0.s) < T.standLunge;
  const range = still ? 0 : T.lunge + p.speed * T.hit;
  const pace = p.speed + T.lungeSpeed;
  const foot = pk && m.tpl.meta[pk.clip] && m.tpl.meta[pk.clip].ev && m.tpl.meta[pk.clip].ev.contact && m.tpl.meta[pk.clip].ev.contact.foot === 'L' ? 'Left' : 'Right';
  const act = p.action = {
    tackle: true, moves: true, clip: pk ? pk.clip : null, t: 0, rate: 1, end: T.duration, foot,
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
      // fallo deciso: il piede va sulla caviglia piu' vicina del portatore
      if (a.footOn) {
        ankle(a.victim, p, a.footOn.target);
        a.footOn.weight = a.t < T.hit + FOULACT.pushTime ? 1 : 0;
        a.footOn.ttl = 0.25;
      }
    },
    events: [{ at: Math.max(0, T.hit - FOULACT.legLead), fn: () => aimTackle(m, p, manual, act) }, { at: T.hit, fn: () => resolveTackle(m, p, manual, act) }]
  };
  return true;
}

// Caviglia di `o` piu' vicina a chi entra `p`, staccata verso di lui: dove va
// il piede del contrasto che prende l'uomo.
const _an = new THREE.Vector3(), _bn = new THREE.Vector3();
function ankle(o, p, out) {
  const r = o.avatar.rig;
  r.LeftFoot.getWorldPosition(_an);
  r.RightFoot.getWorldPosition(_bn);
  const a = Math.hypot(_an.x - p.pos.x, _an.z - p.pos.z) < Math.hypot(_bn.x - p.pos.x, _bn.z - p.pos.z) ? _an : _bn;
  const dx = p.pos.x - a.x, dz = p.pos.z - a.z, l = Math.hypot(dx, dz) || 1;
  return out.set(a.x + dx / l * 0.06, Math.max(0.1, a.y), a.z + dz / l * 0.06);
}

// Poco prima del contatto (FOULACT.legLead): esito del contrasto con le
// posizioni previste al contatto. Se e' fallo parte l'IK del piede sulla
// caviglia: il fallo ci sara' solo se il piede ci arriva (resolveTackle).
function aimTackle(m, p, manual, a) {
  const T = TACKLE, b = m.ball, owner = m.owner, L = FOULACT.legLead;
  if (!owner || owner.team === p.team || owner.holding || owner.keeper) return;
  const bx = b.pos.x + b.vel.x * L - p.pos.x - p.vel.x * L, bz = b.pos.z + b.vel.z * L - p.pos.z - p.vel.z * L;
  const reach = b.live && b.pos.y <= 0.8 && Math.hypot(bx, bz) <= T.legReach;
  const man = Math.hypot(owner.pos.x + owner.vel.x * L - p.pos.x - p.vel.x * L, owner.pos.z + owner.vel.z * L - p.pos.z - p.vel.z * L) <= T.manReach;
  if (reach) a.verdict = duel(m, p, owner, manual);
  else a.verdict = man && Math.random() < missFoulChance(m, p, owner) ? 'foul' : 'miss';
  a.late = !reach;
  a.victim = owner;
  if (a.verdict !== 'foul') return;
  a.footOn = new FootOn(a.foot);
  ankle(owner, p, a.footOn.target);
  p.avatar.playProc(a.footOn);
}

// Il piede di chi entra tocca davvero la gamba del portatore?
const _ft2 = new THREE.Vector3();
function legContact(p, o, foot) {
  const r = p.avatar.rig;
  r[foot + 'Foot'].getWorldPosition(_ft2).lerp(r[foot + 'ToeBase'].getWorldPosition(_an), 0.4);
  const v = o.avatar.rig;
  let best = Infinity;
  for (const n of ['LeftFoot', 'RightFoot', 'LeftLeg', 'RightLeg']) {
    v[n].getWorldPosition(_bn);
    if (n.endsWith('Leg')) _bn.lerp(v[n.replace('Leg', 'Foot')].getWorldPosition(_an), 0.5);
    best = Math.min(best, _bn.distanceTo(_ft2));
  }
  return best;
}

// Al contatto del piede: palla recuperata, portatore che salta l'uomo o
// fallo (duel). Se la gamba non ci arriva il difensore resta sbilanciato.
function resolveTackle(m, p, manual, a) {
  const T = TACKLE, b = m.ball, owner = m.owner;
  if (owner && owner.team === p.team) return;
  // fallo deciso prima del contatto: c'e' solo se il piede tocca davvero la
  // gamba del portatore (contrasto in ritardo, sgambetto di lato)
  if (a.verdict === 'foul' && owner === a.victim) {
    const d = legContact(p, owner, a.foot);
    m.note('contatto', { p, su: owner, tipo: 'piede', distanza: d, preso: d <= FOULACT.legReach });
    if (d <= FOULACT.legReach) {
      const dx = owner.pos.x - p.pos.x, dz = owner.pos.z - p.pos.z, l = Math.hypot(dx, dz) || 1;
      const from = approach(p, owner);
      m.lastDuel = { def: p, car: owner, result: 'foul' };
      m.foul(p, owner, { kind: manual ? 'contrasto' : 'pressing', ballFirst: false, from, dir: { x: dx / l, z: dz / l }, gesture: from === 'side' ? 'sgambetto' : 'contrasto in ritardo' });
      return;
    }
    stagger(p, DUEL.stagger.miss, manual);
    m.lastDuel = { def: p, car: owner, result: 'vuoto' };
    return;
  }
  const reach = b.live && b.pos.y <= 0.8 && Math.hypot(b.pos.x - p.pos.x, b.pos.z - p.pos.z) <= T.legReach;
  if (!reach) {
    if (owner || m.poss.flying) stagger(p, DUEL.stagger.miss, manual);
    m.lastDuel = { def: p, result: 'vuoto', dist: Math.hypot(b.pos.x - p.pos.x, b.pos.z - p.pos.z) };
    return;
  }
  if (owner) {
    if (owner.holding) return;
    // esito gia' deciso poco prima (aimTackle); se il portatore e' cambiato, ora
    let result = owner === a.victim && a.verdict && a.verdict !== 'miss' ? a.verdict : duel(m, p, owner, manual);
    // un fallo qui senza contatto della gamba non c'e': il portatore lo salta
    if (result === 'foul') result = 'beaten';
    m.lastDuel = { def: p, car: owner, result };
    if (result === 'won') {
      m.kickLock = { p: owner, t: T.lock };
      // contrasto pulito: a volte chi perde palla resta sbilanciato (livello 1, senza fallo)
      if (Math.random() < REACT.wonChance) react(m, owner, 1, p);
      if (Math.random() < T.keep) { m.gain(p, 'contrasto'); return; }
      b.kick(p.dirX * T.poke + gauss() * 1.2, 0, p.dirZ * T.poke + gauss() * 1.2);
      m.poss.loose('contrasto', p);
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
  p.face(headingOf(dx / l, dz / l));
  p.moveHeading = p.heading;
  const toBall = (b.pos.x - p.pos.x) * p.rightX + (b.pos.z - p.pos.z) * p.rightZ;
  const side = toBall < 0 ? 'left' : 'right';
  const clip = m.tpl.clips[S.clip[side]] ? S.clip[side] : 'slide_tackle_' + side;
  const end = clipDuration(m.tpl, clip);
  p.avatar.playOnce(clip, S.from, (end - S.from) / S.rate, S.rate);
  const tripped = new Set();
  // l'arbitro giudica la scivolata da dove e' partita, non da come si gira il portatore dopo
  const car0 = m.owner && m.owner.team !== p.team ? m.owner : null, from0 = car0 ? approach(p, car0) : null;
  m.note('scivolata', { p, su: car0, da: from0 || '' });
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
      // cade chi viene toccato davvero: piedi di chi scivola contro le sue gambe
      for (const o of m.allPlayers()) {
        if (o.team === p.team || o.down || o.keeper || tripped.has(o)) continue;
        const bx = (p.pos.x + fx) / 2, bz = (p.pos.z + fz) / 2;
        if (Math.hypot(o.pos.x - bx, o.pos.z - bz) < S.body * 1.8 && Math.min(legContact(p, o, 'Left'), legContact(p, o, 'Right')) <= FOULACT.slideReach) {
          tripped.add(o);
          const from = o === car0 ? from0 : approach(p, o);
          if (m.owner === o) {
            b.kick(o.vel.x * 0.8, 0.3, o.vel.z * 0.8);
            m.poss.loose('scivolata', p);
          }
          // fallo se l'uomo e' preso senza la palla, o da dietro anche dopo
          // averla toccata: l'arbitro decide anche la reazione (rules.foul).
          // Senza fallo cade lo stesso (livello 3)
          const dir = { x: p.dirX, z: p.dirZ };
          m.note('contatto', { p, su: o, tipo: 'scivolata', preso: true });
          const foul = (!a.hit || from === 'back') && m.rules.foul(p, o, { kind: 'scivolata', ballFirst: !!a.hit, from, dir });
          if (!foul) react(m, o, 3, p, dir);
        }
      }
    }
  });
}

// --- reazioni ai contatti (skill: "Arbitro, falli e cartellini"), quattro
// livelli (REACT): 1 sbilanciamento o inciampo, 2 colpo con un passo di
// recupero, 3 caduta e rialzo, 4 la caduta spettacolare dei falli violenti.
// Dentro il livello si sceglie per corrispondenza: lo spostamento della clip
// piu' vicino alla spinta (dall'avversario verso chi la subisce, piu' le due
// corse, nel riferimento di chi la subisce) e la velocita' d'entrata piu'
// vicina alla sua corsa. 3 e 4 restano a terra REACT.ground secondi, poi il
// rialzo della clip. `src`: chi ha causato il contatto.
// `dir`: direzione della forza nel contatto (spinta, trattenuta all'indietro,
// gamba portata via); senza, dall'avversario verso chi subisce.
export function react(m, o, level, src, dir = null) {
  if (o.down || o.sentOff || o.keeper || (o.action && o.action.react)) return false;
  const R = REACT, opts = reactOptions(m.tpl)[level];
  if (!opts || !opts.length) return false;
  const s = Math.hypot(o.vel.x, o.vel.z);
  // chi corre cade in avanti, lungo la corsa
  if (level >= 3 && s > 0.5) o.face(headingOf(o.vel.x, o.vel.z));
  let px = dir ? dir.x : o.pos.x - src.pos.x, pz = dir ? dir.z : o.pos.z - src.pos.z;
  const pl = Math.hypot(px, pz) || 1;
  const mo = R.momentum[level];
  px = px / pl * R.push + src.vel.x * R.carry + o.vel.x * mo;
  pz = pz / pl * R.push + src.vel.z * R.carry + o.vel.z * mo;
  const want = Math.atan2(px * o.rightX + pz * o.rightZ, px * o.dirX + pz * o.dirZ);
  let best = null, bc = Infinity;
  for (const c of opts) {
    const cost = Math.abs(wrap(want - c.dir)) * R.angleCost + Math.abs(s - c.vIn) * R.speedCost;
    if (cost < bc) { bc = cost; best = c; }
  }
  const name = best.name, meta = m.tpl.meta[name], end = meta.dur;
  const k = level >= 3 ? R.travel[level] * Math.min(1, 0.4 + s / 7) : R.travel[level], ks = level === 4 ? k * 0.3 : k;
  o.down = level >= 3;
  if (m.ctrl === o) m.buffer = null;
  m.note('reazione', { p: o, livello: level, clip: name, da: src, spinta: want });
  const done = () => { o.down = false; bakeYaw(m, o, name, end); };
  // pausa a terra solo se li' la clip e' ferma: 107/108 scorrono ancora a
  // 0,8 m/s e, ferme, traslavano (posa ferma che trasla); vanno fino al rialzo
  let rest = level >= 3 && meta.ev ? meta.ev.rest : undefined;
  if (rest !== undefined) {
    const u = rootAt(m.tpl, name, Math.max(0, rest - 0.05)), v = rootAt(m.tpl, name, rest + 0.05);
    if (Math.hypot(v.a - u.a, v.s - u.s) / 0.1 * k > ANIM.stillRoot) rest = undefined;
  }
  if (rest === undefined) {
    o.avatar.playOnce(name, 0, end);
    o.action = rootAction(m, o, name, 0, end, 1, { react: level, scaleA: k, scaleS: ks, onEnd: done });
    return true;
  }
  // caduta fino all'ultimo istante a terra, fermi, poi il rialzo dallo stesso fotogramma
  o.avatar.playOnce(name, 0, Infinity);
  o.action = rootAction(m, o, name, 0, rest, 1, {
    react: level, scaleA: k, scaleS: ks,
    onEnd: () => {
      o.avatar.resume(name, 0, Infinity);
      o.action = { clip: name, react: level, t: 0, rate: 1, end: R.ground[level] || 0, onEnd: () => {
        o.avatar.resume(name, 1, end - rest);
        o.action = rootAction(m, o, name, rest, end, 1, { react: level, scaleA: k, scaleS: ks, onEnd: done });
      } };
    }
  });
  return true;
}

// --- fallo di corsa con un gesto della libreria (FOULACT): spinta,
// trattenuta, spallata. Chi entra corre addosso al portatore, la mano va
// sulla maglia con l'IK; al fotogramma del contatto il fallo c'e' solo se la
// mano (o la spalla) tocca davvero, e la reazione parte in quell'istante e
// nella direzione della forza. `from`: da dove arriva (approach).
const _sh = new THREE.Vector3(), _pm2 = new THREE.Vector3();
export function startFoulGesture(m, p, victim, from) {
  if (p.action || p.down || p.stagger > 0 || p.sentOff) return false;
  const F = FOULACT;
  const vx = victim.pos.x - p.pos.x, vz = victim.pos.z - p.pos.z, d = Math.hypot(vx, vz) || 1;
  const right = (vx * p.rightX + vz * p.rightZ) / d > 0;
  let kind, clip;
  if (p.speed >= F.standBelow && p.speed < F.runMin) return false;
  if (p.speed < F.standBelow) { kind = 'spinta'; clip = F.clips.ferma; }
  else {
    kind = from === 'front' ? 'carica' : Math.random() < F.holdShare ? 'trattenuta' : from === 'back' ? 'spinta' : 'carica';
    clip = F.clips[kind][right ? 'R' : 'L'];
  }
  const meta = m.tpl.meta[clip];
  if (!meta || !meta.ev || !meta.ev.contact || !m.tpl.clips[clip]) return false;
  const side = kind === 'carica' ? (right ? 'Right' : 'Left') : F.hand[clip] || meta.ev.contact.hand || (right ? 'Right' : 'Left');
  const tc = kind === 'trattenuta' ? F.holdAt : meta.ev.contact.t;
  // passo della clip come quello della corsa (piedi che non scivolano)
  const vClip = Math.max(0.5, (meta.vIn || 0) * m.tpl.scale);
  const rate = p.speed < F.standBelow ? 1 : clamp(p.speed / vClip, F.rate[0], F.rate[1]);
  const closing = Math.max(1, ((p.vel.x - victim.vel.x) * vx + (p.vel.z - victim.vel.z) * vz) / d);
  // con la mano: l'IK ha il tempo di arrivare sulla maglia prima del contatto
  const lead = clamp((d - F.contactDist) / closing, kind === 'carica' ? F.minLead : F.ik.lead + F.minLead * 0.5, Math.max(F.minLead, tc / rate));
  const from0 = Math.max(0, tc - lead * rate), end = Math.min(meta.dur, tc + F.after * rate);
  p.avatar.playOnce(clip, from0, (end - from0) / rate, rate);
  const hand = kind === 'carica' ? null : new HandOn(side);
  if (hand) { shirt(victim, p, hand.target); p.avatar.playProc(hand); }
  const keep = kind === 'trattenuta' ? F.holdTime : F.pushTime;
  m.note('gesto fallo', { p, su: victim, tipo: kind, da: from, clip });
  // quasi fermo (spinta a due mani): sul posto, la clip non fa passi
  const pace = p.speed < F.standBelow ? 0 : Math.max(p.speed, 1.5);
  p.action = {
    foulGesture: kind, moves: true, clip, t: 0, rate: 1, end: (end - from0) / rate,
    tick: (a, dt) => {
      // addosso al portatore a FOULACT.contactDist: dalla parte da cui arriva;
      // la spallata spalla contro spalla, al suo fianco
      let lx = p.pos.x - victim.pos.x, lz = p.pos.z - victim.pos.z;
      if (kind === 'carica') {
        const s = Math.sign(lx * victim.rightX + lz * victim.rightZ) || 1;
        lx = victim.rightX * s - victim.dirX * 0.15; lz = victim.rightZ * s - victim.dirZ * 0.15;
      }
      const ll = Math.hypot(lx, lz) || 1;
      const tx = victim.pos.x + victim.vel.x * dt + lx / ll * F.contactDist, tz = victim.pos.z + victim.vel.z * dt + lz / ll * F.contactDist;
      const sx = tx - p.pos.x, sz = tz - p.pos.z, sl = Math.hypot(sx, sz);
      const stepLen = Math.min(sl, pace * dt);
      if (pace === 0) p.drive(dt, 0, 0, 0, {});
      else if (sl > 1e-4) p.moveTo(p.pos.x + sx / sl * stepLen, p.pos.z + sz / sl * stepLen, dt);
      if (a.t < lead + keep) p.face(headingOf(victim.pos.x - p.pos.x, victim.pos.z - p.pos.z));
      p.moveHeading = p.heading;
      if (hand) {
        shirt(victim, p, hand.target);
        const u = a.t - (lead - F.ik.lead);
        hand.weight = u < 0 ? 0 : !a.done || a.t < a.at + keep && a.hit ? smooth(Math.min(1, u / F.ik.lead)) : 0;
        hand.ttl = 0.25;
      }
      // contatto: dal fotogramma previsto, per FOULACT.window s, la mano sulla
      // maglia (la spalla sulla spalla) entro la portata; altrimenti niente fallo
      if (!a.done && a.t >= lead) {
        let dist;
        if (hand) dist = palm(p.avatar.rig, side, _pm2).distanceTo(shirt(victim, p, _sh));
        else {
          const v = victim.avatar.rig;
          p.avatar.rig[side + 'Arm'].getWorldPosition(_pm2);
          dist = Math.min(_pm2.distanceTo(v.LeftArm.getWorldPosition(_sh)), _pm2.distanceTo(v.RightArm.getWorldPosition(_sh)));
        }
        const hit = dist <= (hand ? F.reach : F.shoulderReach);
        a.best = Math.min(a.best ?? Infinity, dist);
        if (hit || a.t >= lead + F.window) {
          a.done = true;
          a.at = a.t;
          m.note('contatto', { p, su: victim, tipo: kind, distanza: hit ? dist : a.best, preso: hit });
          if (hit && !victim.down && !victim.sentOff) {
            a.hit = true;
            // forza: spinta e spallata da chi entra verso chi subisce, trattenuta all'indietro
            const fx = victim.pos.x - p.pos.x, fz = victim.pos.z - p.pos.z, fl = Math.hypot(fx, fz) || 1;
            const k = kind === 'trattenuta' ? -1 : 1;
            m.foul(p, victim, { kind, ballFirst: false, from, dir: { x: k * fx / fl, z: k * fz / fl } });
          }
        }
      }
    }
  };
  return true;
}

// Punto della maglia di `o` dalla parte di `p`: Spine2, staccato di FOULACT.shirt.
function shirt(o, p, out) {
  o.avatar.rig.Spine2.getWorldPosition(out);
  const dx = p.pos.x - out.x, dz = p.pos.z - out.z, l = Math.hypot(dx, dz) || 1;
  out.x += dx / l * FOULACT.shirt; out.z += dz / l * FOULACT.shirt;
  return out;
}

// Clip di reazione per livello con la direzione del loro spostamento nei primi
// REACT.window secondi (radice sotto il bacino: anche l'oscillazione sul posto)
// e la velocita' d'entrata, in metri del gioco.
function reactOptions(tpl) {
  if (tpl.reactOptions && tpl.reactOptions.v === tpl.libVersion) return tpl.reactOptions;
  const out = { v: tpl.libVersion };
  for (const level in REACT.clips) {
    out[level] = [];
    for (const name of REACT.clips[level]) {
      const meta = tpl.meta[name];
      if (!meta) continue;
      const r0 = rootAt(tpl, name, 0);
      let a = 0, s = 0, far = -1;
      for (let t = 0; t <= Math.min(meta.dur, REACT.window) + 1e-6; t += 1 / 30) {
        const r = rootAt(tpl, name, t), l = Math.hypot(r.a - r0.a, r.s - r0.s);
        if (l > far) { far = l; a = r.a - r0.a; s = r.s - r0.s; }
      }
      out[level].push({ name, dir: Math.atan2(s, a), disp: far, vIn: (meta.vIn || 0) * tpl.scale });
    }
  }
  tpl.reactOptions = out;
  return out;
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
  if (!bicycle && Math.hypot(s.x - p.pos.x, s.z - p.pos.z) > 0.2) p.face(headingOf(s.x - p.pos.x, s.z - p.pos.z));
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
    diveClip: !!(m.tpl.meta[clip] && m.tpl.meta[clip].ev && m.tpl.meta[clip].ev.dive),
    tick: (a) => {
      if (o.release) { releaseTick(m, k, a, o, from, tc); return; }
      // peso dell'IK: sale prima del contatto, resta un attimo, poi sfuma
      const tr = (a.t - tc) / rate;
      const w = tr < -I.lead ? 0 : tr < 0 ? smooth((tr + I.lead) / I.lead) : tr < I.hold ? 1 : Math.max(0, 1 - (tr - I.hold) / I.fade);
      // le mani vanno sul punto previsto e passano sulla palla vera man mano
      // che arriva (prima il bersaglio saltava sulla palla a I.track m: braccia a scatto).
      // Solo prima del contatto: dopo, la palla respinta o in rete vola via a
      // 20 m/s e le braccia la inseguivano (fino a 1,2 rad in un fotogramma)
      const b = m.ball;
      // Del punto previsto si corregge solo lo scarto di lato alla traiettoria:
      // la palla che arriva sulla linea prevista non sposta le mani. Con tutta
      // la distanza le mani andavano incontro alla palla e tornavano al punto
      // in 4 fotogrammi (a 25 m/s): avambraccio fino a 1,2 rad in un passo
      if (b.live && !m.poss.owned && tr < 0) {
        if (o.point) {
          const P = o.point, v = b.vel, ex = b.pos.x - P.x, ey = b.pos.y - P.y, ez = b.pos.z - P.z;
          const vv = v.x * v.x + v.y * v.y + v.z * v.z, along = vv > 1e-6 ? (ex * v.x + ey * v.y + ez * v.z) / vv : 0;
          const s = smooth(Math.max(0, Math.min(1, 1 - b.pos.distanceTo(P) / I.track)));
          reach.target.set(P.x + (ex - along * v.x) * s, P.y + (ey - along * v.y) * s, P.z + (ez - along * v.z) * s);
        }
        else reach.target.copy(b.pos);
      }
      reach.stick = tr >= 0;
      // gesto partito tardi (tiro ravvicinato): l'IK sale in tempo per il contatto
      if (a.urgent === undefined) a.urgent = tr > -I.lead;
      reach.urgent = a.urgent;
      reach.weight = m.owner === k ? 0 : w;
      reach.ttl = 0.25;
      // parata finita in piedi senza palla in mano (respinta, palla sul
      // corpo): il gesto si chiude e il portiere torna a giocare, va sulla
      // palla respinta. Restava fermo fino alla fine della clip (1,7 s)
      // mentre la palla rotolava a due metri. Solo le parate in piedi: un
      // tuffo finisce la clip, che contiene caduta e rialzo (chiuso a mezz'aria
      // la posa del tuffo restava sul portiere che correva)
      if (!a.diveClip && tr > I.hold && m.owner !== k && m.poss.free && k.avatar.rig.Hips.getWorldPosition(_kh).y > KEEPER.upright) {
        a.end = Math.min(a.end, a.t);
        k.avatar.fadeGesture();
      }
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
