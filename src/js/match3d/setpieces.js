import * as THREE from 'three';
import { FK, RULES, PITCH, GOAL, BALL, SHOT, CONTROL } from './config.js';
import { loftFor, flight } from './ball.js';
import { rootAction } from './gestures.js';
import { headingOf } from './player.js';
import { clipDuration } from './avatar.js';

// Calci piazzati come in PES e DLS: punizione diretta (mira, potenza,
// effetto, traiettoria iniziale, barriera che salta e respinge), telecamera
// dietro a chi calcia e ritorno alla partita. rules.js decide quando; qui
// si decide come.

const HL = PITCH.length / 2;
const GOAL_HW = GOAL.width / 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) * 2;

// Altezza del bacino sopra quella iniziale, al tempo t della clip (player.motion.json).
function hipsLift(tpl, clip, t) {
  const m = tpl.motion[clip];
  const h = m && m.hips;
  if (!h || !h.length) return 0;
  let y = h[h.length - 1][1];
  for (let i = 1; i < h.length; i++) {
    if (t <= h[i][0]) { const k = (t - h[i - 1][0]) / (h[i][0] - h[i - 1][0]); y = h[i - 1][1] + (h[i][1] - h[i - 1][1]) * k; break; }
  }
  return Math.max(0, y - h[0][1]);
}

function dotTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const g = c.getContext('2d');
  g.fillStyle = '#ffffff';
  g.beginPath(); g.arc(16, 16, 12, 0, Math.PI * 2); g.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export class SetPieces {
  constructor(m) {
    this.m = m;
    const n = FK.guideDots;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    this.guide = new THREE.Points(geo, new THREE.PointsMaterial({ map: dotTexture(), size: 0.24, transparent: true, opacity: 0.9, depthWrite: false, alphaTest: 0.2 }));
    this.guide.frustumCulled = false;
    this.guide.renderOrder = 6;
    this.guide.visible = false;
    this.path = [];
    // guida alla mira del rigore (R1 tenuto): cerchio sul piano della porta
    this.ring = new THREE.Mesh(new THREE.RingGeometry(0.86, 1, 40), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide }));
    this.ring.visible = false;
    this.ring.renderOrder = 6;
    this.group = new THREE.Group();
    this.group.add(this.guide, this.ring);
    this.hold = 0;           // secondi di telecamera del calcio piazzato dopo il calcio
    this.pose0 = null;       // ultima posa, tenuta dopo il calcio
    this.wall = [];          // uomini in barriera al momento del calcio
    this._v = new THREE.Vector3();
    this._p = new THREE.Vector3();
  }

  get mesh() { return this.group; }

  // Nuova punizione: diretta (vicina, con barriera e mira) o da lontano.
  prepare(set) {
    const m = this.m, d = m.dirOf(set.side);
    const gx = d * HL - set.spot.x, gz = -set.spot.z, dist = Math.hypot(gx, gz);
    set.fk = {
      mode: set.type === 'penalty' ? 'penalty' : set.direct && dist < FK.directMax ? 'direct' : 'far',
      aimZ: 0, aimY: FK.aimY0, curl: 0, guide: true, dist
    };
    this.wall = [];
    this.hold = 0;
  }

  // Posto di chi batte: per la diretta qualche passo dietro la palla e un po'
  // di lato (la rincorsa della clip lo porta sulla palla), altrimenti attaccato.
  takerSpot(set) {
    const m = this.m, s = set.spot, d = m.dirOf(set.side);
    const h = headingOf(d * HL - s.x, -s.z);
    const fx = Math.sin(h), fz = Math.cos(h);
    if (set.fk && set.fk.mode === 'direct') {
      const rx = -fz, rz = fx;  // destra di chi guarda la porta
      return { x: s.x - fx * FK.back - rx * FK.side, z: s.z - fz * FK.back - rz * FK.side, h };
    }
    return { x: s.x - fx * 0.55, z: s.z - fz * 0.55, h };
  }

  // Uomini in barriera: di piu' vicino e centrale, di meno lontano e defilato.
  wallSize(spot, dir) {
    const gx = -dir * HL - spot.x, gz = -spot.z, dist = Math.hypot(gx, gz);
    const close = 1 - clamp((dist - 16) / (FK.directMax - 16), 0, 1);
    const central = 1 - clamp(Math.abs(Math.atan2(Math.abs(gz), Math.abs(gx))) / 1.05, 0, 1);
    return Math.round(lerp(FK.wallSize[0], FK.wallSize[1], close * 0.65 + central * 0.35));
  }

  // Telecamera: dietro alla palla verso la porta; bassa sulla diretta e sul
  // rigore, alta e lontana sulla punizione da lontano. Resta un attimo dopo il calcio.
  pose() {
    const m = this.m, set = m.rules.set;
    const on = set && set.fk && m.phase === 'restart' && (set.type === 'freekick' || set.type === 'penalty');
    if (on) this.hold = FK.camHold;
    else if (this.hold <= 0 || !this.pose0) return null;
    if (!on) return this.pose0;
    const s = set.spot, d = m.dirOf(set.side), C = set.fk.mode === 'far' ? FK.camFar : FK.cam;
    const gx = d * HL - s.x, gz = -s.z, gl = Math.hypot(gx, gz) || 1;
    const ux = gx / gl, uz = gz / gl;
    const look = Math.min(gl, 40) * C.look;
    const p = this.pose0 || (this.pose0 = { pos: new THREE.Vector3(), look: new THREE.Vector3(), fov: C.fov });
    p.pos.set(s.x - ux * C.back, C.height, s.z - uz * C.back);
    p.look.set(s.x + ux * look, C.lookY, s.z + uz * look);
    p.fov = C.fov;
    return p;
  }

  // Ogni passo di fisica: tempo della telecamera dopo il calcio.
  tick(dt) {
    if (this.m.phase === 'play' && this.hold > 0) this.hold -= dt;
    this.wallBlock();
  }

  // Rigore: dove andrebbe la palla con la levetta (schermo) e la potenza di
  // adesso. sx -1..1 a sinistra/destra, up 0..1 in alto.
  penaltyTarget(p, sx, up, power, chip) {
    const m = this.m, T = RULES.penalty, d = m.dirOf(p.team), b = m.ball.pos;
    const w = GOAL_HW - T.postMargin;
    if (chip) return { x: d * HL, y: T.chip.height, z: sx * w * T.chip.spread * d, speed: T.chip.speed };
    const top = lerp(T.height[0], T.height[1], up);
    const reach = clamp(power / T.topPower, 0, 1);
    const over = Math.max(0, (power - T.overPower) / (1 - T.overPower));
    const y = lerp(T.height[0], top, reach) + T.overHeight * over;
    return { x: d * HL, y, z: sx * w * d, speed: lerp(T.speed, p.params.shotSpeed, power), dist: Math.hypot(d * HL - b.x, sx * w * d - b.z) };
  }

  // Rigore come in PES 2021: rincorsa della clip penalty, palla al fotogramma
  // del calcio verso l'angolo della levetta (tenuta anche durante la rincorsa).
  penaltyShot(p, power, inp, auto) {
    const m = this.m, T = RULES.penalty;
    const pen = { power, user: !auto, chip: false, sx: 0, up: 0.3 };
    if (auto) {
      pen.sx = [-1, -1, -0.5, 0, 0.5, 1, 1][Math.floor(Math.random() * 7)];
      pen.up = Math.random() * 0.8;
      pen.chip = Math.random() < 0.04;
    } else {
      if (inp && inp.mag > 0.3) { pen.sx = clamp(inp.sx, -1, 1); pen.up = clamp(-inp.sy, 0, 1); }
      pen.chip = !!(inp && inp.btn && inp.btn.held.l1);
    }
    this.pen = pen;
    const end = Math.min(T.end, clipDuration(m.tpl, T.clip));
    p.avatar.playOnce(T.clip, T.from, end - T.from);
    p.action = rootAction(m, p, T.clip, T.from, end, 1, {
      scaleS: 0,
      tick: () => {
        // la levetta tenuta durante la rincorsa conta ancora
        const i = m.lastInp;
        if (pen.user && i && i.mag > 0.3) { pen.sx = clamp(i.sx, -1, 1); pen.up = clamp(-i.sy, 0, 1); }
      },
      events: [{ at: T.contact - T.from, fn: () => this.penaltyKick(p, pen) }]
    });
  }

  penaltyKick(p, pen) {
    const m = this.m, T = RULES.penalty, b = m.ball, P = p.params;
    const keeper = m.teams[m.otherSide(p.team)].keeperAI;
    // il tiratore IA vede il portiere dell'utente buttarsi troppo presto e cambia lato
    const dv = keeper.dive;
    if (!pen.user && dv && dv.side !== 0 && m.poss.clock - dv.t > T.early && Math.sign(pen.sx * m.dirOf(p.team)) === dv.side && Math.random() < T.readKeeper) pen.sx = -pen.sx;
    const tg = this.penaltyTarget(p, pen.sx, pen.up, pen.power, pen.chip);
    const err = P.shotError * T.error * (pen.chip ? 0.5 : 1);
    const dx = tg.x - b.pos.x, dz = tg.z - b.pos.z, dist = Math.hypot(dx, dz);
    const ang = Math.atan2(dz, dx) + gauss() * err;
    const loft = loftFor(b.pos.y, tg.speed, dist, Math.max(BALL.radius + 0.04, tg.y + gauss() * err * dist * SHOT.heightError));
    b.kick(Math.cos(ang) * Math.cos(loft) * tg.speed, Math.sin(loft) * tg.speed, Math.sin(ang) * Math.cos(loft) * tg.speed);
    m.poss.fly('tiro', p, null, pen.chip ? 'cucchiaio' : 'rigore');
    m.kickLock = { p, t: CONTROL.kickLock };
    m.lastKick = { kind: pen.chip ? 'cucchiaio' : 'rigore', power: pen.power, speed: tg.speed, dist, sx: +pen.sx.toFixed(2), up: +pen.up.toFixed(2) };
    keeper.penaltyKicked(Math.abs(tg.z) < 1 ? 0 : Math.sign(tg.z));
    this.pen = null;
    m.rules.go('play');
  }

  // Mira dell'utente sulla diretta: la levetta sposta il punto sulla linea di
  // porta (a destra/sinistra dello schermo e in altezza), R1 mostra o nasconde
  // la traiettoria, la levetta destra da' l'effetto.
  aim(dt, inp) {
    const f = this.m.rules.set.fk;
    this.aimInp = inp;
    if (!f || f.mode !== 'direct') return;
    const side = this.screenSide();
    if (inp.mag > 0) {
      f.aimZ = clamp(f.aimZ + inp.sx * side * inp.mag * FK.aimSpeed[0] * dt, -GOAL_HW - FK.aimOut, GOAL_HW + FK.aimOut);
      f.aimY = clamp(f.aimY - inp.sy * inp.mag * FK.aimSpeed[1] * dt, FK.aimY[0], FK.aimY[1]);
    }
    if (inp.rsMag > 0) f.curl = clamp(inp.rsx, -1, 1) * inp.rsMag;
    if (inp.btn && inp.btn.down.r1) f.guide = !f.guide;
  }

  // +1 se la destra dello schermo va verso +z (telecamera che guarda la porta di chi batte).
  screenSide() {
    const m = this.m, set = m.rules.set;
    return m.dirOf(set.side) > 0 ? 1 : -1;
  }

  // Velocita' e effetto del calcio verso il punto mirato, con l'errore di chi calcia.
  kickFor(p, f, power, withError) {
    const b = this.m.ball, d = this.m.dirOf(p.team), P = p.params;
    const err = withError ? P.shotError * FK.error : 0;
    const tz = f.aimZ, gx = d * HL - b.pos.x, gz = tz - b.pos.z, dist = Math.hypot(gx, gz);
    const over = Math.max(0, (power - FK.overPower) / (1 - FK.overPower));
    const h = f.aimY + FK.overHeight * over + gauss() * err * dist * SHOT.heightError;
    const speed = lerp(FK.speed[0], Math.min(FK.speed[1], P.shotSpeed), power);
    const loft = loftFor(b.pos.y, speed, dist, Math.max(BALL.radius + 0.04, h));
    const ang = Math.atan2(gz, gx) + gauss() * err;
    const hs = Math.cos(loft) * speed;
    // effetto: positivo curva verso la destra di chi guarda la porta
    return { vx: Math.cos(ang) * hs, vy: Math.sin(loft) * speed, vz: Math.sin(ang) * hs, spin: f.curl * FK.spinMax };
  }

  // La guida: il primo tratto della traiettoria, alla potenza caricata; sul
  // rigore il cerchio della mira finche' si tiene R1.
  render(showFor) {
    const m = this.m, set = m.rules.set, g = this.guide;
    const f = set && set.fk;
    this.renderRing(showFor, set);
    // solo a chi batte (l'utente): la traiettoria degli avversari non si vede
    const on = !!showFor && !!f && f.mode === 'direct' && f.guide && m.phase === 'restart' && set.ready &&
      set.taker === showFor && set.side === m.userSide && !showFor.action;
    g.visible = on;
    if (!on) return;
    const power = m.charging ? m.charge : FK.guidePower;
    const k = this.kickFor(showFor, f, power, false);
    const n = FK.guideDots, dt = FK.guideTime / n;
    flight(m.ball.pos, this._v.set(k.vx, k.vy, k.vz), k.spin, dt, n, this.path);
    const a = g.geometry.attributes.position;
    for (let i = 0; i < n; i++) a.setXYZ(i, this.path[i].x, this.path[i].y, this.path[i].z);
    a.needsUpdate = true;
  }

  renderRing(p, set) {
    const m = this.m, r = this.ring, i = this.aimInp;
    const on = !!p && !!set && set.type === 'penalty' && m.phase === 'restart' && set.ready && set.taker === p &&
      set.side === m.userSide && !p.action && !!i && !!i.btn && i.btn.held.r1;
    r.visible = on;
    if (!on) return;
    const T = RULES.penalty, power = m.charging ? m.charge : 0.6;
    const sx = i.mag > 0.3 ? clamp(i.sx, -1, 1) : 0, up = i.mag > 0.3 ? clamp(-i.sy, 0, 1) : 0.3;
    const tg = this.penaltyTarget(p, sx, up, power, !!i.btn.held.l1);
    // il cerchio si allarga con l'errore di chi tira
    const rad = T.aimRing + p.params.shotError * T.error * (tg.dist || 11) * 1.4;
    r.position.set(tg.x - m.dirOf(p.team) * 0.05, Math.max(0.1, tg.y), tg.z);
    r.rotation.set(0, Math.PI / 2, 0);
    r.scale.setScalar(rad);
  }

  // Tiro della diretta: la rincorsa e il calcio della clip FK.clip; durante la
  // rincorsa la levetta (a destra/sinistra) aggiunge effetto, come in PES.
  // `auto`: la batte l'IA, con mira ed effetto gia' scelti.
  directShot(p, power, auto) {
    const m = this.m, set = m.rules.set, f = set.fk, C = FK;
    if (auto) this.autoAim(p, f);
    const h = headingOf(m.ball.pos.x - p.pos.x, m.ball.pos.z - p.pos.z);
    p.heading = p.moveHeading = h;
    const end = Math.min(C.end, clipDuration(m.tpl, C.clip));
    p.avatar.playOnce(C.clip, 0, end);
    p.action = rootAction(m, p, C.clip, 0, end, 1, {
      scaleS: 0,
      tick: (a, dt) => {
        if (auto || p !== m.ctrl) return;
        const inp = m.lastInp;
        if (inp && inp.mag > 0.2) f.curl += (clamp(inp.sx, -1, 1) - f.curl) * (1 - Math.exp(-C.curlRate * dt));
        if (inp && inp.rsMag > 0) f.curl = clamp(inp.rsx, -1, 1) * inp.rsMag;
      },
      events: [{ at: C.contact, fn: () => {
        const b = m.ball, k = this.kickFor(p, f, power, true);
        b.kick(k.vx, k.vy, k.vz, k.spin);
        m.poss.fly('tiro', p, null, 'punizione');
        m.kickLock = { p, t: CONTROL.kickLock };
        m.lastKick = { kind: 'punizione', power, speed: b.vel.length(), dist: f.dist, curl: +f.curl.toFixed(2) };
        this.wallJump(Math.hypot(k.vx, k.vz));
        m.rules.go('play');
      } }]
    });
  }

  // L'IA mira un angolo: sopra la barriera sul palo lontano, o sul palo del
  // portiere, con l'effetto che riporta la palla verso la porta.
  autoAim(p, f) {
    const m = this.m, s = m.rules.set.spot;
    const far = -(Math.sign(s.z) || 1);
    const z = Math.random() < 0.65 ? far * (GOAL_HW + 0.3) : -far * (GOAL_HW - 0.2);
    f.aimZ = z;
    f.aimY = 1.6 + Math.random() * 0.6;
    // la curva riporta la palla verso il centro della porta: effetto positivo
    // = verso la destra dello schermo, che sul campo e' +z per chi attacca verso +x
    const toward = -Math.sign(z) * m.dirOf(p.team);
    f.curl = toward * (0.35 + Math.random() * 0.4);
  }

  // Al calcio la barriera salta: il punto piu' alto del salto quando la palla le arriva.
  wallJump(speedH) {
    const m = this.m, J = FK.wallJump;
    this.wall = m.everyone.filter((q) => q.aiState === 'BARRIERA' && !q.action && !q.down);
    const t = RULES.wall / Math.max(8, speedH);
    for (const q of this.wall) {
      const from = clamp(J.apex - t, J.from, J.apex - 0.05);
      const end = Math.min(J.end, clipDuration(m.tpl, J.clip));
      q.avatar.playOnce(J.clip, from, end - from);
      q.action = rootAction(m, q, J.clip, from, end, 1, { wallJump: true, scaleA: 0, scaleS: 0 });
    }
    this.wallT = 0;
  }

  // Palla contro la barriera: cilindri verticali alti quanto il corpo (piu' il
  // salto). La palla rimbalza e torna libera; una respinta sola.
  wallBlock() {
    const m = this.m, b = m.ball;
    if (!this.wall.length) return;
    if (m.poss.owned || !b.live || (this.wallT += 1 / 60) > 2) { this.wall = []; return; }
    const r = FK.wallRadius + BALL.radius;
    for (const q of this.wall) {
      const a = q.action;
      const top = FK.wallHeight + (a && a.wallJump ? hipsLift(m.tpl, a.clip, a.from + a.t) : 0);
      // quattro punti fra la posizione di prima e l'attuale: niente palle che passano attraverso
      for (let i = 1; i <= 4; i++) {
        const k = i / 4;
        const x = b.prev.x + (b.pos.x - b.prev.x) * k, y = b.prev.y + (b.pos.y - b.prev.y) * k, z = b.prev.z + (b.pos.z - b.prev.z) * k;
        if (y > top + BALL.radius) continue;
        const dx = x - q.pos.x, dz = z - q.pos.z, dd = Math.hypot(dx, dz);
        if (dd >= r) continue;
        const nx = dd > 1e-4 ? dx / dd : -Math.sign(b.vel.x) || 1, nz = dd > 1e-4 ? dz / dd : 0;
        b.pos.set(q.pos.x + nx * (r + 0.01), Math.max(BALL.radius, y), q.pos.z + nz * (r + 0.01));
        const vn = b.vel.x * nx + b.vel.z * nz;
        if (vn < 0) { b.vel.x -= (1 + FK.wallRest) * vn * nx; b.vel.z -= (1 + FK.wallRest) * vn * nz; }
        b.vel.multiplyScalar(0.55);
        b.spin = 0;
        m.poss.loose('barriera', q);
        m.kickLock = { p: q, t: 0.3 };
        m.lastBlock = { by: q.team + q.number, height: +y.toFixed(2) };
        this.wall = [];
        return;
      }
    }
  }

  // Indicazioni per chi batte, con i tasti del dispositivo in uso.
  prompt(glyph, device, pad) {
    const m = this.m, set = m.rules.set;
    const row = (t) => '<span class="m3d-prompt-row">' + t + '</span>';
    const g = (b) => glyph(b, pad);
    const touch = device === 'touch', keys = device === 'keys';
    // rigore avversario: il portiere e' dell'utente
    if (set && set.type === 'penalty' && m.phase === 'restart' && set.side !== m.userSide && set.ready) {
      return '<span class="m3d-prompt-t">Rigore contro</span>' +
        row((touch ? 'Joystick' : keys ? 'A o D' : 'Levetta sinistra') + ' a sinistra o a destra: tuffo') +
        row('Presto sui tiri forti, all\'ultimo su quelli piano');
    }
    if (!set || !set.fk || m.phase !== 'restart' || set.side !== m.userSide || set.taker !== m.ctrl || set.taker.action) return null;
    if (set.ready && set.type === 'penalty') {
      return '<span class="m3d-prompt-t">Rigore</span>' +
        row((touch ? 'Joystick' : keys ? 'WASD' : 'Levetta sinistra') + ' verso l\'angolo, tenuta') +
        row((touch ? 'Tiro' : keys ? 'U' : g('square')) + ' tenuto: potenza. Oltre il 90% va alta') +
        (touch ? '' : row((keys ? 'Q' : g('l1')) + ' + ' + (keys ? 'U' : g('square')) + ': cucchiaio')) +
        (touch ? row('Scatto tenuto: guida alla mira') : row((keys ? 'L' : g('r1')) + ' tenuto: guida alla mira'));
    }
    if (!set.ready) return '<span class="m3d-prompt-t">' + (set.fk.mode === 'penalty' ? 'Rigore' : 'Punizione') + '</span>' + row('Chi batte va sulla palla');
    if (set.fk.mode === 'direct') {
      return '<span class="m3d-prompt-t">Punizione diretta</span>' +
        row(touch ? 'Joystick: mira' : keys ? 'WASD: mira' : 'Levetta sinistra: mira') +
        row((touch ? 'Tiro' : keys ? 'U' : g('square')) + ' tenuto: potenza, poi rilascia') +
        row(touch ? 'Joystick durante la rincorsa: effetto' : keys ? 'A e D durante la rincorsa: effetto' : 'Levetta destra: effetto') +
        (touch ? '' : row((keys ? 'L' : g('r1')) + ' traiettoria'));
    }
    if (set.fk.mode === 'far') {
      return '<span class="m3d-prompt-t">Punizione</span>' +
        row(touch ? 'Passaggio, Cross o Filtrante, con la potenza' : keys ? 'J passaggio, K cross, I filtrante' : g('cross') + ' passaggio ' + g('circle') + ' cross ' + g('triangle') + ' filtrante');
    }
    return null;
  }

  dispose() {
    this.guide.geometry.dispose();
    this.guide.material.map.dispose();
    this.guide.material.dispose();
    this.ring.geometry.dispose();
    this.ring.material.dispose();
  }
}

export { hipsLift };
