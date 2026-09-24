import * as THREE from 'three';
import { KEEPER, PITCH, GOAL, BALL, ATTR, PLAYER, RULES, FK } from './config.js';
import { rootAt, clipDuration } from './avatar.js';
import { freeness } from './player.js';
import { palm } from './rig.js';

// IA del portiere: POSIZIONE, USCITA, PARATA, RINVIO. Muove il portiere a 60 Hz;
// le parate sono gesti pianificati sulle tabelle delle pose, con l'IK sulle
// braccia; la palla la ferma solo il contatto con mani e corpo veri.

const HL = PITCH.length / 2;
const GOAL_HW = GOAL.width / 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) * 2;

const _c = new THREE.Vector3(), _e = new THREE.Vector3(), _off = new THREE.Vector3();
const _q = new THREE.Vector3(), _s = new THREE.Vector3(), _n = new THREE.Vector3(), _t = new THREE.Vector3();

// Prima sfera del corpo (KEEPER.body) toccata dalla palla nel suo ultimo
// passo, fra la posizione precedente e l'attuale. La posa e' quella
// dell'ultimo disegno, spostata dove la fisica ha messo il portiere.
function bodyHit(k, b, hands) {
  const r = k.avatar.rig;
  k.avatar.object.updateMatrixWorld(true);
  _off.set(k.pos.x - k.mesh.position.x, 0, k.pos.z - k.mesh.position.z);
  const p0 = b.prev, seg = _s.subVectors(b.pos, p0), L2 = seg.lengthSq();
  let best = null;
  for (const [name, to, f, rad, isHand] of KEEPER.body) {
    if (isHand && !hands) continue;
    const bone = r[name];
    if (!bone) continue;
    bone.getWorldPosition(_c);
    if (to && r[to]) _c.lerp(r[to].getWorldPosition(_e), f);
    _c.add(_off);
    const t = L2 > 1e-9 ? clamp(_q.subVectors(_c, p0).dot(seg) / L2, 0, 1) : 0;
    _q.copy(p0).addScaledVector(seg, t);
    if (_q.distanceTo(_c) < rad + BALL.radius && (!best || t < best.t)) best = { t, hand: isHand, rad, c: _c.clone(), q: _q.clone() };
  }
  return best;
}

// Palla fra i palmi: tutti e due entro `reach` metri, abbastanza per trattenerla.
function palmsOn(k, b, reach) {
  const r = k.avatar.rig;
  _off.set(k.pos.x - k.mesh.position.x, 0, k.pos.z - k.mesh.position.z);
  return palm(r, 'Left', _c).add(_off).distanceTo(b.pos) < reach &&
    palm(r, 'Right', _e).add(_off).distanceTo(b.pos) < reach;
}

export class KeeperAI {
  constructor(match, side, keeper, difficulty) {
    this.m = match;
    this.side = side;
    this.p = keeper;
    this.skill = difficulty;
    this.hold = 0;
    this.watch = null;       // tiro gia' valutato: non si ripete la decisione
    this.replan = 0;         // uscita sui cross: secondi al prossimo piano
    const o = Number(keeper.data.overall) || ATTR.fallback;
    this.attr = clamp((o - ATTR.low) / (ATTR.high - ATTR.low), 0, 1);
    this.path = [];
    keeper.aiState = 'POSIZIONE';
  }

  get dir() { return this.m.dirOf(this.side); }
  // Centro della propria porta.
  get goalX() { return -this.dir * HL; }

  update(dt) {
    const m = this.m, k = this.p;
    if (k.action || k.down) return;
    if (m.owner === k) { this.distribute(dt); return; }
    this.hold = 0;
    k.holding = false;
    if (m.phase !== 'play') { this.pending = null; this.position(dt); return; }
    if (this.pending && this.waitSave(dt)) return;
    if (this.save()) return;
    if (this.side === m.userSide && m.keeperCharge && this.charge(dt)) return;
    if (this.claim(dt)) return;
    if (this.rush(dt)) return;
    this.position(dt);
  }

  // Sulla linea fra palla e centro della porta, piu' fuori quando la palla si avvicina.
  position(dt) {
    const m = this.m, k = this.p, b = m.ball.pos;
    k.aiState = 'POSIZIONE';
    // rigore contro: fermo sulla linea, al centro, rivolto al tiratore
    const set = m.rules.set;
    if (m.phase === 'restart' && set && set.type === 'penalty' && set.side !== this.side) {
      // il portiere dell'utente sceglie il tuffo durante la rincorsa
      if (this.side === m.userSide && set.taker.action) { this.penaltyWatch(dt); return; }
      this.dive = null;
      this.moveTo(dt, this.goalX + this.dir * 0.3, 0, false);
      return;
    }
    // punizione diretta contro: la barriera copre il palo vicino alla palla,
    // il portiere si mette verso l'altro
    if (m.phase === 'restart' && set && set.fk && set.fk.mode === 'direct' && set.side !== this.side) {
      this.moveTo(dt, this.goalX + this.dir * 0.6, -(Math.sign(set.spot.z) || 1) * FK.keeperFar, false);
      return;
    }
    const gx = this.goalX;
    const vx = b.x - gx, vz = b.z, vl = Math.hypot(vx, vz) || 1;
    const t = clamp((KEEPER.depthRange[0] - vl) / (KEEPER.depthRange[0] - KEEPER.depthRange[1]), 0, 1);
    const depth = lerp(KEEPER.depth[0], KEEPER.depth[1], t);
    const tx = gx + vx / vl * depth, tz = clamp(vz / vl * depth, -KEEPER.maxZ, KEEPER.maxZ);
    this.moveTo(dt, tx, tz, false);
  }

  moveTo(dt, tx, tz, sprint) {
    const k = this.p, b = this.m.ball.pos;
    const dx = tx - k.pos.x, dz = tz - k.pos.z, d = Math.hypot(dx, dz);
    const face = { x: b.x - k.pos.x, z: b.z - k.pos.z };
    // frenata calcolata per fermarsi sul punto, non oltre
    const brake = Math.sqrt(2 * PLAYER.decel * d) / k.params.maxSpeed;
    if (d < 0.15) k.drive(dt, 0, 0, 0, { face });
    else k.drive(dt, dx, dz, Math.min(1, d / 1.5, brake), { face, sprint });
    // passo laterale: velocita' lungo la destra del busto
    k.sideSpeed = sprint ? 0 : k.vel.x * k.rightX + k.vel.z * k.rightZ;
  }

  // Tiro verso la porta: dove e quando attraversa la linea.
  crossing() {
    const m = this.m, b = m.ball;
    const toward = -this.dir;
    if (b.vel.x * toward < 3) return null;
    const path = b.predict(this.path, 1 / 60, 2);
    for (const s of path) {
      if (s.x * toward >= HL - 0.3) {
        if (Math.abs(s.z) < GOAL_HW + 1.2 && s.y < GOAL.height + 0.6) return s;
        return null;
      }
    }
    return null;
  }

  // PARATA: per ogni tiro nello specchio il portiere pianifica il gesto
  // (plan) e parte al momento giusto; la parata vera la decide la collisione
  // della palla con le sue mani e il suo corpo (touch).
  save() {
    const m = this.m, k = this.p, poss = m.poss;
    if (!poss.flying || poss.team === this.side) { this.watch = null; return false; }
    if (this.watch === poss.seq) return false;
    // rigore contro l'utente che non ha ancora scelto: aspetta la sua levetta
    // per poco; un tuffo deciso in ritardo parte da dove e' la palla adesso
    const pen = this.penalty;
    if (pen && pen.guess === null) {
      const side = this.userSide();
      if (side !== null) pen.guess = side;
      else if (poss.age > RULES.penalty.lateWindow) pen.guess = 0;
      else { k.drive(1 / 60, 0, 0, 0, { face: { x: m.ball.pos.x - k.pos.x, z: m.ball.pos.z - k.pos.z } }); return true; }
    }
    const s = this.crossing();
    if (!s) return false;
    this.watch = poss.seq;
    // tiro fuori dallo specchio: lo si lascia andare
    if (Math.abs(s.z) > GOAL_HW + KEEPER.plan.wide || s.y > GOAL.height + KEEPER.plan.wide) return false;
    const plan = this.plan();
    if (!plan) return false;
    this.pending = { wait: plan.wait, seq: poss.seq, plan };
    this.lastPlan = plan;
    k.aiState = 'PARATA';
    return true;
  }

  // Lungo la traiettoria prevista (letta con l'errore del portiere), il
  // punto, la clip e il fotogramma in cui i palmi arrivano sulla palla:
  // tabelle tpl.poses per le mani, radice scalata entro scaleA/scaleS, clip
  // accelerata o fatta partire piu' avanti se il tempo e' poco.
  plan(options = KEEPER.saves, P = KEEPER.plan) {
    const m = this.m, k = this.p, tpl = m.tpl;
    const path = m.ball.predict(this.path, 1 / 60, P.horizon);
    let react = lerp(KEEPER.react[0], KEEPER.react[1], this.skill);
    const err = lerp(KEEPER.aim[0], KEEPER.aim[1], this.attr);
    const ex = gauss() * err, ey = gauss() * err * 0.6;
    let ez = gauss() * err;
    // rigore: il lato e' deciso prima del tiro; se sbaglia, si tuffa dall'altra parte
    const pen = this.penalty;
    this.penalty = null;
    if (pen) react = KEEPER.penaltyReact;
    const fx = k.dirX, fz = k.dirZ, rx = k.rightX, rz = k.rightZ;
    const toward = -this.dir;
    // se sta correndo il gesto parte da dove si sara' fermato
    const stop = k.speed * k.speed / (2 * PLAYER.decel), sl = k.speed || 1;
    const ox = k.pos.x + k.vel.x / sl * stop, oz = k.pos.z + k.vel.z / sl * stop;
    let best = null;
    for (let i = P.step - 1; i < path.length; i += P.step) {
      const s = path[i];
      if (s.x * toward > HL + 0.3) break;
      const avail = s.t - react;
      if (avail <= 0.05) continue;
      const px = s.x + ex, py = Math.max(BALL.radius, s.y + ey);
      const pz = pen && pen.guess !== pen.real ? pen.guess * (GOAL_HW - RULES.penalty.postMargin) : s.z + ez;
      const dx = px - ox, dz = pz - oz;
      const a = dx * fx + dz * fz, lat = dx * rx + dz * rz;
      // i cross arrivano di lato: si scorre tutta la traiettoria
      if (a > P.ahead || a < -P.behind || py > P.maxY) continue;
      for (const opt of options) {
        const clip = opt.clip.endsWith('_') ? opt.clip + (lat >= 0 ? 'right' : 'left') : opt.clip;
        const tab = tpl.poses[clip];
        if (!tab) continue;
        const j0 = Math.ceil(opt.window[0] * tab.fps), j1 = Math.min(tab.n - 1, Math.floor(opt.window[1] * tab.fps));
        for (let j = j0; j <= j1; j++) {
          const tau = j / tab.fps;
          // la clip parte dopo la reazione e arriva al fotogramma tau proprio
          // quando la palla e' li' (s.t secondi da adesso)
          let from = opt.from, rate = 1;
          if (tau - from > avail) {
            rate = (tau - from) / avail;
            if (rate > P.rateMax) { rate = P.rateMax; from = tau - avail * rate; }
          }
          const wait = s.t - (tau - from) / rate;
          const r0 = rootAt(tpl, clip, from), r1 = rootAt(tpl, clip, tau);
          const da = r1.a - r0.a, ds = r1.s - r0.s;
          const ha = (tab.lh[j * 3] + tab.rh[j * 3]) / 2, hs = (tab.lh[j * 3 + 1] + tab.rh[j * 3 + 1]) / 2, hy = (tab.lh[j * 3 + 2] + tab.rh[j * 3 + 2]) / 2;
          const kA = Math.abs(da) > 0.05 ? clamp((a - ha) / da, opt.scaleA[0], opt.scaleA[1]) : 1;
          const kS = Math.abs(ds) > 0.05 ? clamp((lat - hs) / ds, opt.scaleS[0], opt.scaleS[1]) : 1;
          const e = Math.hypot(a - ha - kA * da, lat - hs - kS * ds, py - hy);
          const cost = e + P.rateCost * Math.abs(rate - 1) + opt.bias;
          if (!best || cost < best.cost) best = { cost, e, opt, clip, tau, from, rate, wait, kA, kS, t: s.t, x: px, y: py, z: pz };
        }
      }
    }
    // Troppo lontano anche con l'IK: si prova lo stesso, ma senza toccarla niente parata.
    return best && best.e < KEEPER.plan.maxResidual * 2.5 ? best : null;
  }

  // Parata decisa: fermo sulle gambe fino al momento di partire.
  waitSave(dt) {
    const m = this.m, k = this.p, s = this.pending;
    if (s.seq !== m.poss.seq) { this.pending = null; return false; }
    if ((s.wait -= dt) > 0) {
      k.drive(dt, 0, 0, 0, { face: { x: m.ball.pos.x - k.pos.x, z: m.ball.pos.z - k.pos.z } });
      return true;
    }
    this.pending = null;
    const pl = s.plan;
    m.startKeeperGesture(k, pl.clip, pl.from, pl.tau, Math.min(pl.opt.end, clipDuration(m.tpl, pl.clip)), pl.rate,
      { scaleA: pl.kA, scaleS: pl.kS, catch: pl.opt.catch, dive: !pl.opt.catch, point: new THREE.Vector3(pl.x, pl.y, pl.z) });
    return true;
  }

  // Palla sulla sua area: le mani valgono solo li' dentro.
  inBox(x, z) {
    return Math.abs(x - this.goalX) < PITCH.penaltyDepth && Math.abs(z) < PITCH.penaltyWidth / 2;
  }

  // Nella sua area una palla degli avversari la prende solo con le mani
  // (touch): niente stop di piede al posto della parata.
  handsOnly() {
    const m = this.m, b = m.ball.pos;
    return this.inBox(b.x, b.z) && m.poss.team !== this.side;
  }

  // Collisione palla-portiere sulle sfere agganciate alle ossa vere: presa,
  // respinta di mano o palla sul corpo. Nessuna sfera toccata, nessuna parata.
  touch() {
    const m = this.m, k = this.p, b = m.ball, poss = m.poss;
    if (poss.owned || !b.live || (poss.flying && poss.team === this.side)) return false;
    if (m.kickLock && m.kickLock.p === k) return false;
    if (Math.hypot(b.pos.x - k.pos.x, b.pos.z - k.pos.z) > KEEPER.bodyCheck) return false;
    const hands = this.inBox(b.pos.x, b.pos.z);
    const hit = bodyHit(k, b, hands);
    if (!hit) return false;
    const n = _n.subVectors(hit.q, hit.c);
    if (n.lengthSq() < 1e-8) n.copy(b.vel).multiplyScalar(-1);
    n.normalize();
    b.pos.copy(hit.c).addScaledVector(n, hit.rad + BALL.radius + 0.005);
    const v = b.vel, speed = v.length(), a = k.action;
    // presa: palla fra i palmi in una parata che la puo' trattenere
    // (in una presa la seconda mano arriva un istante dopo: basta che sia vicina)
    if (hit.hand && a && a.keeper && palmsOn(k, b, a.catchable ? KEEPER.palmsCatch[1] : KEEPER.palmsCatch[0])) {
      const holdIt = a.catchable ? speed < KEEPER.catchSpeed * lerp(0.85, 1.1, this.attr)
        : a.dive && speed < KEEPER.diveCatchSpeed && Math.random() < lerp(KEEPER.diveCatch[0], KEEPER.diveCatch[1], this.attr);
      if (holdIt) {
        m.gain(k, 'parata');
        k.holding = true;
        this.lastTouch = { part: 'mani', result: 'presa', speed };
        return true;
      }
    }
    // respinta: rimbalzo sulla parte toccata, mai verso la propria porta
    const vn = v.dot(n);
    if (vn < 0) {
      const tang = _t.copy(v).addScaledVector(n, -vn).multiplyScalar(hit.hand ? 0.6 : 0.5);
      v.copy(tang).addScaledVector(n, -vn * (hit.hand ? KEEPER.parryRest : KEEPER.bodyRest));
    }
    if (hit.hand) v.y += lerp(KEEPER.parryLift[0], KEEPER.parryLift[1], Math.random());
    const toward = -this.dir;
    if (v.x * toward > 0) v.x = -v.x * 0.5;
    poss.loose('parata', k);
    m.kickLock = { p: k, t: KEEPER.lock };
    this.lastTouch = { part: hit.hand ? 'mani' : 'corpo', result: 'respinta', speed };
    return true;
  }

  // Cross o lancio che scende vicino alla porta: esce. Stesso piano delle
  // parate (tabelle delle pose, IK, presa sul contatto) con le clip d'uscita;
  // finche' non ci arriva corre verso il punto di caduta e ripianifica.
  claim(dt) {
    const m = this.m, k = this.p, poss = m.poss;
    if (!poss.flying || poss.team === this.side || !/cross|lancio/.test(poss.kind || '')) return false;
    const path = m.ball.predict(this.path, 1 / 30, 3);
    let land = null, prevY = m.ball.pos.y;
    for (const s of path) {
      const falling = s.y < prevY;
      prevY = s.y;
      if (falling && s.y < KEEPER.claimPlan.maxY) { land = s; break; }
    }
    if (!land || Math.abs(land.x - this.goalX) > KEEPER.claimDist || Math.abs(land.z) > 9) return false;
    k.aiState = 'USCITA';
    if ((this.replan -= dt) <= 0) {
      this.replan = KEEPER.claimPlan.every;
      const plan = this.plan(KEEPER.claims, KEEPER.claimPlan);
      if (plan && plan.e < KEEPER.claimPlan.accept) {
        this.pending = { wait: plan.wait, seq: poss.seq, plan };
        this.lastPlan = plan;
        return true;
      }
    }
    this.moveTo(dt, land.x, land.z, true);
    return true;
  }

  // Uscita chiesta dall'utente (Triangolo tenuto): il portiere va incontro al
  // portatore o alla palla, se e' nella sua meta' campo; la presa la fa rush.
  charge(dt) {
    const m = this.m, k = this.p, b = m.ball;
    if (Math.abs(b.pos.x - this.goalX) > KEEPER.chargeDist) return false;
    if (this.rush(dt)) return true;
    const o = m.owner, t = o && o.team !== this.side ? o.pos : b.pos;
    const lead = o ? 0.35 : 0.2;
    k.aiState = 'USCITA';
    this.moveTo(dt, t.x + (o ? o.vel.x : b.vel.x) * lead, t.z + (o ? o.vel.z : b.vel.z) * lead, true);
    return true;
  }

  // Palla libera o lunga in area: esce se ci arriva prima degli attaccanti.
  rush(dt) {
    const m = this.m, k = this.p, poss = m.poss, b = m.ball;
    if (!(poss.free || (poss.flying && poss.team !== this.side && poss.kind !== 'tiro'))) return false;
    if (Math.abs(b.pos.x - this.goalX) > KEEPER.rushDist || Math.abs(b.pos.z) > 20 || b.pos.y > 1.2) return false;
    const mine = m.interceptPoint(k, false);
    if (!mine) return false;
    for (const o of m.teams[this.side === 'home' ? 'away' : 'home'].players) {
      const s = m.interceptPoint(o, false);
      if (s && s.t < mine.t - 0.2) return false;
    }
    k.aiState = 'USCITA';
    const d = Math.hypot(b.pos.x - k.pos.x, b.pos.z - k.pos.z);
    if (d < 1.4 && Math.hypot(b.vel.x, b.vel.z) < 12) {
      const C = KEEPER.clips.scoop;
      const side = (b.pos.x - k.pos.x) * k.rightX + (b.pos.z - k.pos.z) * k.rightZ > 0 ? 'right' : 'left';
      m.startKeeperGesture(k, C.clip + side, C.contact - 0.15, C.contact, C.end, 1, { catch: true, scaleS: 0.3, scaleA: 0.3, point: b.pos.clone() });
      return true;
    }
    this.moveTo(dt, mine.x, mine.z, true);
    return true;
  }

  // RINVIO: con la palla in mano aspetta, poi la lancia a un compagno libero
  // vicino o calcia al volo lontano. Con la palla al piede la passa.
  distribute(dt) {
    const m = this.m, k = this.p;
    k.aiState = 'RINVIO';
    k.drive(dt, 0, 0, 0, { face: { x: this.dir, z: 0 } });
    this.hold += dt;
    if (this.hold < (k.holding ? KEEPER.holdTime : 0.6)) return;
    this.hold = 0;
    const mates = m.teams[this.side].players.filter((q) => q !== k && !q.down);
    const opp = m.teams[this.side === 'home' ? 'away' : 'home'].players;
    let near = null, nd = Infinity;
    for (const q of mates) {
      const d = Math.hypot(q.pos.x - k.pos.x, q.pos.z - k.pos.z);
      if (d < KEEPER.throwMax && freeness(q.pos.x, q.pos.z, opp) > 0.6 && d < nd) { nd = d; near = q; }
    }
    if (!k.holding) {
      const dx = near ? near.pos.x - k.pos.x : this.dir, dz = near ? near.pos.z - k.pos.z : 0, l = Math.hypot(dx, dz) || 1;
      m.startKick(k, near ? 'pass' : 'cross', near ? 0.2 : 0.8, { mag: 1, x: dx / l, z: dz / l, to: near || undefined });
      return;
    }
    // con le mani: la clip riparte dalla posa in cui teneva la palla; al volo:
    // la palla passa alla sinistra, cade e il destro la calcia
    if (near) {
      const T = KEEPER.clips.throw;
      m.startKeeperGesture(k, T.clip, T.hold, T.contact, T.end, T.rate, { release: 'throw', spec: T, resume: true, target: near, scaleS: 0, scaleA: 0.4 });
    } else {
      let far = null, fa = -Infinity;
      for (const q of mates) {
        const a = q.pos.x * this.dir;
        if (a > fa && a < 15) { fa = a; far = q; }
      }
      const D = KEEPER.clips.dropkick;
      m.startKeeperGesture(k, D.clip, D.from, D.contact, D.end, 1, { release: 'kick', spec: D, target: far, scaleS: 0, scaleA: 0.5 });
    }
  }

  // Lato (-1, 0, 1 in z) scelto con la levetta dall'utente che comanda il
  // portiere sul rigore avversario, null se la levetta e' ferma.
  userSide() {
    const inp = this.m.lastInp;
    if (!inp || inp.mag < RULES.penalty.commit) return null;
    return Math.abs(inp.z) > 0.35 ? Math.sign(inp.z) : 0;
  }

  // Rincorsa del rigore avversario: il portiere dell'utente si butta quando
  // si spinge la levetta; prima del calcio si sposta gia' verso quel lato.
  penaltyWatch(dt) {
    const m = this.m, k = this.p;
    if (this.dive === undefined || this.dive === null) {
      const side = this.userSide();
      if (side !== null) this.dive = { side, t: m.poss.clock };
    }
    const z = this.dive ? this.dive.side * 0.6 : 0;
    this.moveTo(dt, this.goalX + this.dir * 0.3, z, false);
  }

  // Rigore appena calciato verso il lato `side` (-1, 0, 1 in z). IA: indovina
  // con una probabilita' che cresce con difficolta' e attributo. Utente: il
  // lato scelto con la levetta; se non l'ha ancora scelto, save() aspetta.
  penaltyKicked(side) {
    const m = this.m, T = RULES.penalty;
    let guess;
    if (this.side === m.userSide) guess = this.dive ? this.dive.side : null;
    else if (Math.random() < lerp(T.guess[0], T.guess[1], (this.skill + this.attr) / 2)) guess = side;
    else { const other = [-1, 0, 1].filter((v) => v !== side); guess = other[Math.floor(Math.random() * other.length)]; }
    this.penalty = { guess, real: side };
    this.dive = null;
    this.watch = null;
  }

  // Dopo il gol: si dispera, finito l'eventuale tuffo.
  concede() {
    const k = this.p, C = KEEPER.clips.concede;
    const play = () => k.avatar.playOnce(C.clip, C.from, C.end);
    if (!k.action) { play(); return; }
    const prev = k.action.onEnd;
    k.action.onEnd = () => { if (prev) prev(); play(); };
  }
}

export const HELD_Y = BALL.radius + 0.95;   // palla in mano, se le ossa non sono ancora disegnate
