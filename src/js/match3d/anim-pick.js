import { ANIM } from './config.js';
import { rootAt, gestureTable, clipDuration } from './avatar.js';
import { matchPoseCost } from './anim.js';

// Scelta della clip per corrispondenza (skill match3d, "Fluidita'"): fra le
// clip caricate di un ruolo vince quella il cui movimento somiglia di piu' a
// quello chiesto (rotazione, lato della palla, velocita', passo in corso,
// altezza della palla). Il gioco decide i tempi (config.js); la clip scelta
// parte dal fotogramma giusto e si accelera o rallenta perche' il contatto
// cada in quell'istante: cambia solo l'aspetto, mai la fisica. Una clip gia'
// usata dal giocatore per lo stesso ruolo ha un piccolo vantaggio: non si
// passa da una all'altra per differenze minime.

const wrapA = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// Caratteristiche lette dal nome della clip, una volta sola.
function traits(name) {
  const s = name.replace(/^\d+_/, '');
  return {
    left: /Lfoot|LFoot|_LF|_L$|_L_|Left/.test(s),
    power: /^Low_/.test(s) ? 0 : /^MED_/.test(s) ? 0.5 : /^(Pass_Stand|Long_Pass|Shoot_Stand)/.test(s) ? 1 : /^Nonstop/.test(s) ? 0.3 : 0.6,
    lob: /^lob_/.test(s),
    inPlace: /In_Place/.test(s),
    volley: /Volley/.test(s),
    run: /Jogging|Run|Sprint/.test(s)
  };
}

const T = new Map();
export function traitsOf(name) {
  if (!T.has(name)) T.set(name, traits(name));
  return T.get(name);
}

// Velocita' della radice della clip attorno al tempo t (m/s).
function rootSpeed(tpl, clip, t) {
  const a = rootAt(tpl, clip, Math.max(0, t - 0.05)), b = rootAt(tpl, clip, t + 0.05);
  return Math.hypot(b.a - a.a, b.s - a.s) / 0.1;
}

// La migliore fra `cands` per `cost(entry)`, con il vantaggio della scelta
// precedente dello stesso giocatore per lo stesso ruolo.
function choose(p, role, cands, cost) {
  let best = null, bc = Infinity;
  const last = p.animPick && p.animPick[role];
  for (const e of cands) {
    let c = cost(e);
    if (!Number.isFinite(c)) continue;
    if (e.name === last) c -= ANIM.match.keep;
    if (c < bc) { bc = c; best = e; }
  }
  if (best) (p.animPick || (p.animPick = {}))[role] = best.name;
  return best ? { entry: best, cost: bc } : null;
}

// Clip di un ruolo tra quelle caricate (piu' le copie specchiate).
export function roleClips(tpl, role) {
  return tpl.lib ? tpl.lib.role(role) : [];
}

// Calcio (passaggio, filtrante, cross, tiro). `want`: { turn (rad, + sinistra),
// ballLeft (m), speed, power, ballY, lead (s dal comando al contatto) }.
// Restituisce { clip, from, rate, hold } o null (nessuna clip: resta la corsa).
export function pickKick(tpl, p, K, want) {
  const M = ANIM.match, R = ANIM.kickRate;
  const cands = roleClips(tpl, K.role).filter((e) => e.meta.ev && e.meta.ev.contact);
  if (!cands.length) return null;
  const feet = p.speed >= ANIM.syncMinSpeed ? p.avatar.currentFeet() : null;
  let pickFrom = 0;
  const res = choose(p, K.role, cands, (e) => {
    const m = e.meta, c = m.ev.contact, tr = traitsOf(e.name);
    const contact = c.t;
    // il gesto deve stare nel tempo del gioco: partenza fra contatto - lead*rate
    const lo = Math.max(0, contact - want.lead * R[1]), hi = Math.max(0, contact - want.lead * R[0]);
    if (hi <= 0 && contact > want.lead * R[1]) return Infinity;
    const yaw = rootAt(tpl, e.name, contact).yaw;
    let cost = M.turn * Math.abs(wrapA(yaw - want.turn));
    cost += M.side * Math.abs(c.ball[0] * tpl.scale - want.ballLeft);
    cost += M.power * Math.abs(tr.power - want.power);
    if (want.ballY !== undefined) cost += M.height * Math.abs(Math.max(0.1, c.ball[1] * tpl.scale) - Math.max(0.1, want.ballY));
    if (K.role === 'long') cost += M.lob * (tr.lob === !!want.lob ? 0 : 1);
    if (tr.inPlace && want.speed > 1.5) cost += M.inPlace;
    let t0 = clamp(contact - want.lead, lo, hi);
    if (feet) {
      const pm = matchPoseCost(gestureTable(tpl, e.name), feet, lo, hi, t0);
      t0 = pm.t;
      cost += M.pose * pm.cost;
    }
    cost += M.speed * Math.abs(rootSpeed(tpl, e.name, t0) - want.speed);
    // meglio una clip che resta vicina alla sua velocita' naturale
    cost += M.rate * Math.abs(Math.log(clamp((contact - t0) / Math.max(0.01, want.lead), 0.2, 5)));
    e._t0 = t0;
    return cost;
  });
  if (!res) return null;
  const e = res.entry, contact = e.meta.ev.contact.t;
  pickFrom = e._t0;
  const rate = clamp((contact - pickFrom) / Math.max(0.01, want.lead), R[0], R[1]);
  return { clip: e.name, from: pickFrom, rate, contact, foot: e.meta.ev.contact.foot };
}

// In corsa solo clip che entrano in corsa, da fermi solo clip da fermi (se
// ce ne sono): uno stop da fermo mentre si corre ferma le gambe di colpo.
function bySpeed(tpl, list, speed) {
  const run = speed > ANIM.match.runAbove;
  const out = list.filter((e) => (e.meta.vIn * tpl.scale > ANIM.match.runClip) === run);
  return out.length ? out : list;
}

// Ricezione: la palla arriva a `ballY` m, il primo tocco la porta di `turn`
// rad (+ sinistra). Le clip di stop partono con la palla al piede.
export function pickTrap(tpl, p, want) {
  const M = ANIM.match;
  const cands = bySpeed(tpl, roleClips(tpl, 'trap').filter((e) => e.meta.ev && e.meta.ev.ball0), want.speed);
  if (!cands.length) return null;
  const res = choose(p, 'trap', cands, (e) => {
    const ev = e.meta.ev, tr = traitsOf(e.name);
    let cost = M.turn * Math.abs(wrapA(ev.yawEnd - want.turn));
    cost += M.height * Math.abs(ev.ball0[1] * tpl.scale - want.ballY);
    cost += M.speed * Math.abs(e.meta.vIn - want.speed);
    if (tr.run !== want.speed > 2.5) cost += M.inPlace;
    return cost;
  });
  return res ? { clip: res.entry.name, cost: res.cost } : null;
}

// Intercetto (palla avversaria presa al volo): la clip con la palla dalla
// stessa parte e alla stessa distanza, in corsa o da fermi.
export function pickIntercept(tpl, p, want) {
  const M = ANIM.match;
  const cands = bySpeed(tpl, roleClips(tpl, 'intercept').filter((e) => e.meta.ev && e.meta.ev.contact && e.meta.ev.contact.ball), want.speed);
  if (!cands.length) return null;
  const res = choose(p, 'intercept', cands, (e) => {
    const b = e.meta.ev.contact.ball;
    let cost = M.side * Math.abs(b[0] * tpl.scale - want.ballLeft);
    cost += M.side * 0.5 * Math.abs(b[2] * tpl.scale - want.ballAhead);
    cost += M.speed * Math.abs(e.meta.vIn * tpl.scale - want.speed);
    return cost;
  });
  return res ? { clip: res.entry.name, contact: res.entry.meta.ev.contact.t } : null;
}

// Contrasto in piedi: palla a `ballLeft` m dal busto, giocatore a `speed`
// m/s; il contatto deve cadere dopo `lead` secondi reali.
export function pickTackle(tpl, p, want) {
  const M = ANIM.match, R = ANIM.kickRate;
  const cands = roleClips(tpl, 'tackle').filter((e) => e.meta.ev && e.meta.ev.contact);
  if (!cands.length) return null;
  const res = choose(p, 'tackle', cands, (e) => {
    const c = e.meta.ev.contact;
    const lo = Math.max(0, c.t - want.lead * R[1]), hi = Math.max(0, c.t - want.lead * R[0]);
    const t0 = clamp(c.t - want.lead, lo, hi);
    // clip senza palla (Ball_Bone vuoto): il lato non si puo' confrontare
    let cost = c.ball ? M.side * Math.abs(c.ball[0] * tpl.scale - want.ballLeft) : M.side * 0.3;
    cost += M.speed * Math.abs(rootSpeed(tpl, e.name, t0) - want.speed);
    cost += M.rate * Math.abs(Math.log(clamp((c.t - t0) / Math.max(0.01, want.lead), 0.2, 5)));
    e._t0 = t0;
    return cost;
  });
  if (!res) return null;
  const e = res.entry, contact = e.meta.ev.contact.t, from = e._t0;
  return { clip: e.name, from, rate: clamp((contact - from) / want.lead, R[0], R[1]), contact };
}

// Partenza, arresto, svolta o giro sul posto (skill "Fluidita'"): la clip
// del ruolo `role` e dello stile `style` con la rotazione netta piu' vicina a
// `want.yaw` (rad, + sinistra) e la velocita' d'entrata o d'uscita piu'
// vicina. null se nessuna clip somiglia abbastanza (resta il blend tree).
export function pickTransition(tpl, p, role, style, want) {
  const M = ANIM.trans.match;
  const cands = roleClips(tpl, role).filter((e) => e.meta.style === style && (role === 'stop' || Math.abs(e.meta.net[2]) > 0.3 || role === 'start'));
  if (!cands.length) return null;
  const res = choose(p, role + style, cands, (e) => {
    const m = e.meta;
    let cost = M.yaw * Math.abs(wrapA(m.net[2] - want.yaw));
    // verso della corsa all'entrata (avanti, di lato, all'indietro) rispetto al busto
    if (want.dir !== undefined) cost += M.dir * Math.abs(wrapA(dirIn(m) - want.dir));
    if (want.vIn !== undefined) cost += M.speed * Math.abs(m.vIn * tpl.scale - want.vIn);
    if (want.vOut !== undefined) cost += M.speed * Math.abs(m.vOut * tpl.scale - want.vOut);
    return cost;
  });
  return res && res.cost < M.accept ? res.entry : null;
}

// Verso della radice nei primi 0,1 s della clip (rad, + sinistra, 0 avanti).
function dirIn(m) {
  if (m._dirIn === undefined) {
    const r = m.root, k = Math.min(3, r.length / 3 - 1);
    m._dirIn = Math.atan2(r[k * 3 + 1], r[k * 3]);
  }
  return m._dirIn;
}

// Secondi della clip in cui la radice si ferma (arresti): la velocita' scende sotto `v` m/s.
export function stopTime(tpl, clip, v = 0.3) {
  const d = clipDuration(tpl, clip);
  for (let t = 0.1; t < d; t += 1 / 30) if (rootSpeed(tpl, clip, t) < v) return t;
  return d;
}

// La clip fissa di un'azione che decide il gioco (tempi, spostamenti): sempre
// nel pacchetto essenziale, uguale a ogni livello. `name`: nome del build.
export function canonical(tpl, name, fallback) {
  return tpl.clips[name] ? name : fallback;
}

// Durata utile di una clip: fino alla fine o al tempo dato.
export function clipEnd(tpl, name, end) {
  const d = clipDuration(tpl, name);
  return end === undefined ? d : Math.min(d, end);
}
