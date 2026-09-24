import { CONTROL } from './config.js';

// Comandi come lo schema predefinito di PES 2021 (docs/match3d-pes.md), uguali
// su controller, touch e tastiera. I tasti fisici sono quelli del pad
// PlayStation (cross, circle, square, triangle, l1, r1, r2); il loro
// significato dipende dal momento:
//   attacco  cross passaggio, triangle filtrante, circle cross/lancio,
//            square tiro, r1 scatto, r2 controllo stretto, levetta destra finta
//   difesa   cross pressing (tenuto, due volte: contrasto), square raddoppio,
//            circle scivolata, triangle uscita del portiere, l1 cambio,
//            levetta destra cambio verso la direzione, r1 scatto, r2 jockey
// Le levette escono in coordinate dello schermo (x destra, y giu'): main.js
// le porta sul campo secondo la telecamera.

const JOY_RADIUS = 56;

const PAD = ['cross', 'circle', 'square', 'triangle', 'l1', 'r1', 'r2', 'feint'];
// Gamepad API, mappatura standard: indice del tasto per ogni nome.
const PAD_INDEX = { cross: 0, circle: 1, square: 2, triangle: 3, l1: 4, r1: 5, r2: 7 };
const PAD_START = 9, PAD_UP = 12, PAD_DOWN = 13;

const ACTIONS = {
  attack: { cross: 'pass', triangle: 'through', circle: 'cross', square: 'shot', r1: 'sprint', r2: 'close', feint: 'feint' },
  defense: { cross: 'press', square: 'double', circle: 'slide', triangle: 'keeper', l1: 'swap', r1: 'sprint', r2: 'jockey' }
};
const ALL = ['pass', 'through', 'cross', 'shot', 'sprint', 'close', 'feint', 'press', 'tackle', 'double', 'slide', 'keeper', 'swap', 'jockey'];

// Tastiera: WASD o frecce, J = X, U = Quadrato, K = Cerchio, I = Triangolo,
// L = R1, Q = L1, E = R2, O = finta (la levetta destra del pad).
const KEYS = {
  up: ['KeyW', 'ArrowUp'], down: ['KeyS', 'ArrowDown'],
  left: ['KeyA', 'ArrowLeft'], right: ['KeyD', 'ArrowRight'],
  cross: ['KeyJ'], square: ['KeyU'], circle: ['KeyK'], triangle: ['KeyI'],
  r1: ['KeyL'], l1: ['KeyQ'], r2: ['KeyE'], feint: ['KeyO']
};
const ALL_KEYS = new Set(Object.values(KEYS).flat());

const S = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
const svg = (size, body) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true">${body}</svg>`;

const ICONS = {
  pass: svg(24, `<circle cx="6" cy="17" r="3" ${S}/><path d="M9 14.5L18.5 6" ${S}/><path d="M13 5.5h6v6" ${S}/>`),
  through: svg(24, `<path d="M9 4v6M15 4v6M9 14v6M15 14v6" ${S} opacity=".5"/><path d="M3 12h17" ${S}/><path d="M16 8l4 4-4 4" ${S}/>`),
  cross: svg(24, `<path d="M4 18C6 8 14 4 20 9" ${S}/><path d="M20 4v5h-5" ${S}/><circle cx="5" cy="19.5" r="1.5" fill="currentColor"/>`),
  shot: svg(26, `<path d="M2.5 19V5.5h19V19" ${S}/><path d="M6.5 9.5h11M6.5 13.5h11M10 5.5V19M14 5.5V19" fill="none" stroke="currentColor" stroke-width="1" opacity=".45"/><circle cx="12" cy="16" r="3" fill="currentColor"/>`),
  sprint: svg(24, `<path d="M5 6l6 6-6 6M12 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`),
  feint: svg(24, `<path d="M19 12a7 7 0 1 1-2.1-5" ${S}/><path d="M17.5 3v4.5H13" ${S}/><circle cx="12" cy="12" r="2" fill="currentColor"/>`),
  swap: svg(24, `<path d="M4 8h14M14 4l4 4-4 4" ${S}/><path d="M20 16H6M10 12l-4 4 4 4" ${S}/>`),
  press: svg(24, `<circle cx="12" cy="12" r="3" fill="currentColor"/><path d="M12 2v5M12 17v5M2 12h5M17 12h5" ${S}/>`),
  double: svg(24, `<circle cx="12" cy="12" r="2.5" fill="currentColor"/><path d="M3 7l6 5-6 5M21 7l-6 5 6 5" ${S}/>`),
  slide: svg(24, `<path d="M3 20h18" ${S}/><path d="M5 16l7-2 8 1" ${S}/><circle cx="7" cy="9" r="2" ${S}/><circle cx="20" cy="12.5" r="1.5" fill="currentColor"/>`),
  keeper: svg(24, `<path d="M3 15V4h18v11" ${S}/><path d="M12 8v12M8.5 16.5L12 20l3.5-3.5" ${S}/>`)
};
const LABELS = {
  pass: 'Passaggio', through: 'Filtrante', cross: 'Cross', shot: 'Tiro', sprint: 'Scatto', feint: 'Finta',
  press: 'Pressing', double: 'Raddoppio', slide: 'Scivolata', keeper: 'Portiere', swap: 'Cambio'
};

// Tasti sullo schermo: nome del tasto del pad, disposti a rombo come sul pad
// piu' Scatto, Finta (attacco) e Cambio (difesa, sempre visibile).
const TOUCH = ['triangle', 'square', 'circle', 'cross', 'r1', 'feint', 'l1'];

// Simbolo del tasto per il tipo di controller: forme PlayStation o lettere Xbox.
const XBOX = { cross: 'A', circle: 'B', square: 'X', triangle: 'Y', l1: 'LB', r1: 'RB', r2: 'RT', l2: 'LT' };
const PS = { l1: 'L1', r1: 'R1', r2: 'R2', l2: 'L2' };
const G = 'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
export function glyph(btn, type) {
  if (btn === 'rs') return '<span class="m3d-glyph wide">' + (type === 'xbox' ? 'RS' : 'R3') + '</span>';
  if (type !== 'ps' && XBOX[btn]) return '<span class="m3d-glyph' + (XBOX[btn].length > 1 ? ' wide' : '') + '">' + XBOX[btn] + '</span>';
  if (PS[btn]) return '<span class="m3d-glyph wide">' + PS[btn] + '</span>';
  const body = {
    cross: `<path d="M8 8l8 8M16 8l-8 8" ${G}/>`,
    circle: `<circle cx="12" cy="12" r="5" ${G}/>`,
    square: `<rect x="7" y="7" width="10" height="10" rx="1" ${G}/>`,
    triangle: `<path d="M12 6.5l6 10.5H6z" ${G}/>`
  }[btn];
  return body ? '<span class="m3d-glyph">' + svg(16, body) + '</span>' : '';
}

function padType(id) {
  const s = String(id || '').toLowerCase();
  if (/xbox|xinput|045e|microsoft/.test(s)) return 'xbox';
  // il DualShock 4 su Chrome si presenta come "Wireless Controller"
  if (/054c|sony|dualsense|dualshock|playstation|wireless controller|ps4|ps5/.test(s)) return 'ps';
  return 'xbox';
}

function el(tag, cls) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  return n;
}

export class Controls {
  constructor(root, layer, on = {}) {
    this.root = root;
    this.on = on;                 // onPad(type), onPadLost(), onPause()
    this.keys = new Set();
    this.joy = { id: null, ox: 0, oy: 0, x: 0, y: 0 };
    this.btn = {};                // tasti touch tenuti premuti
    this.downs = {};              // pressioni dall'ultima lettura
    this.ups = {};                // rilasci dall'ultima lettura
    for (const k of PAD) { this.btn[k] = false; this.downs[k] = 0; this.ups[k] = 0; }
    this.mode = 'attack';
    this.handlers = [];
    this.touch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    this.pad = null;              // { index, type } del controller in uso
    this.padPrev = {};
    this.rsPrev = false;
    this.lastCross = -1;          // secondi dell'ultima pressione di X, per il doppio tocco
    this.clock = 0;
    this.device = this.touch ? 'touch' : 'keys';

    const pad = el('div', 'm3d-pad');
    const zone = el('div', 'm3d-joyzone');
    const base = el('div', 'm3d-joy');
    const knob = el('div', 'm3d-knob');
    base.appendChild(knob);
    zone.appendChild(base);

    const buttons = el('div', 'm3d-buttons');
    this.buttons = {};
    for (const k of TOUCH) {
      const b = this._button(k);
      this.buttons[k] = b;
      buttons.appendChild(b);
      this._hold(b, () => { this.btn[k] = true; this.downs[k]++; }, () => { if (this.btn[k]) { this.btn[k] = false; this.ups[k]++; } });
    }
    pad.append(zone, buttons);
    layer.appendChild(pad);
    this.padEl = pad;
    this.zone = zone;
    this.base = base;
    this.knob = knob;
    this.setMode('attack', true);
    if (this.touch) root.classList.add('touch');

    this._on(zone, 'pointerdown', (e) => this._joyDown(e));
    this._on(zone, 'pointermove', (e) => this._joyMove(e));
    for (const t of ['pointerup', 'pointercancel', 'lostpointercapture']) this._on(zone, t, (e) => this._joyUp(e));

    // Il primo tocco sullo schermo mostra i comandi anche su un PC con touch.
    this._on(root, 'pointerdown', (e) => {
      if (e.pointerType === 'touch' && !this.touch) { this.touch = true; root.classList.add('touch'); }
      if (e.pointerType === 'touch') this.device = 'touch';
    }, true);
    this._on(root, 'gesturestart', (e) => e.preventDefault());
    this._on(window, 'blur', () => this.reset());
    this._on(window, 'gamepadconnected', (e) => this._padFound(e.gamepad));
    this._on(window, 'gamepaddisconnected', (e) => {
      if (this.pad && e.gamepad.index === this.pad.index) {
        this.pad = null;
        this.padPrev = {};
        if (this.on.onPadLost) this.on.onPadLost();
      }
    });
    // un controller gia' collegato prima della partita
    const list = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const g of list) if (g) { this._padFound(g); break; }
  }

  _padFound(g) {
    if (this.pad || !g) return;
    this.pad = { index: g.index, type: padType(g.id) };
    this.padPrev = {};
    this.device = 'pad';
    if (this.on.onPad) this.on.onPad(this.pad.type);
  }

  get padKind() { return this.pad ? this.pad.type : null; }

  _on(t, type, fn, cap) {
    t.addEventListener(type, fn, cap);
    this.handlers.push([t, type, fn, cap]);
  }

  _button(k) {
    const b = el('button', 'm3d-btn ' + k);
    b.type = 'button';
    b.tabIndex = -1;
    b._icon = el('span', 'm3d-btn-i');
    b._label = el('span', 'm3d-btn-l');
    b.append(b._icon, b._label);
    return b;
  }

  // 'attack' o 'defense': etichette e icone dei tasti seguono il possesso.
  setMode(mode, force) {
    if (mode === this.mode && !force) return;
    this.mode = mode;
    for (const k of TOUCH) {
      const b = this.buttons[k], act = ACTIONS[mode][k];
      b.hidden = !act;
      if (!act) { b._release(); if (this.btn[k]) { this.btn[k] = false; this.ups[k]++; } continue; }
      b.setAttribute('aria-label', LABELS[act]);
      b._icon.innerHTML = ICONS[act];
      b._label.textContent = LABELS[act];
    }
  }

  _hold(b, down, up) {
    let id = null;
    this._on(b, 'pointerdown', (e) => {
      e.preventDefault();
      if (id !== null) return;
      id = e.pointerId;
      try { b.setPointerCapture(id); } catch (_) { /* puntatore gia' rilasciato */ }
      b.classList.add('on');
      down();
    });
    const release = (e) => {
      if (e.pointerId !== id) return;
      id = null;
      b.classList.remove('on');
      if (up) up();
    };
    for (const t of ['pointerup', 'pointercancel', 'lostpointercapture']) this._on(b, t, release);
    b._release = () => { id = null; b.classList.remove('on'); };
  }

  _joyDown(e) {
    if (this.joy.id !== null) return;
    e.preventDefault();
    const j = this.joy;
    j.id = e.pointerId;
    j.ox = e.clientX; j.oy = e.clientY;
    j.x = 0; j.y = 0;
    try { this.zone.setPointerCapture(e.pointerId); } catch (_) { /* puntatore gia' rilasciato */ }
    this.zoneRect = this.zone.getBoundingClientRect();
    this._placeBase();
    this.base.classList.add('on');
    this.knob.style.transform = 'translate(-50%,-50%)';
  }

  // Se il dito esce dal cerchio l'origine lo insegue: il joystick non
  // si "blocca" al bordo.
  _joyMove(e) {
    const j = this.joy;
    if (e.pointerId !== j.id) return;
    let dx = e.clientX - j.ox, dy = e.clientY - j.oy;
    const d = Math.hypot(dx, dy);
    if (d > JOY_RADIUS) {
      j.ox += dx / d * (d - JOY_RADIUS);
      j.oy += dy / d * (d - JOY_RADIUS);
      dx = e.clientX - j.ox; dy = e.clientY - j.oy;
      this._placeBase();
    }
    j.x = dx / JOY_RADIUS;
    j.y = dy / JOY_RADIUS;
    this.knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
  }

  // La base e' posizionata dentro la zona, non nella finestra.
  _placeBase() {
    this.base.style.left = (this.joy.ox - this.zoneRect.left) + 'px';
    this.base.style.top = (this.joy.oy - this.zoneRect.top) + 'px';
  }

  _joyUp(e) {
    if (e.pointerId !== this.joy.id) return;
    this.joy.id = null;
    this.joy.x = this.joy.y = 0;
    this.base.classList.remove('on');
    this.base.style.left = this.base.style.top = '';
    this.knob.style.transform = '';
  }

  // Da main.js, che intercetta tutti i tasti prima del manager.
  key(e, down) {
    if (!ALL_KEYS.has(e.code)) return false;
    e.preventDefault();
    this.device = 'keys';
    if (down) {
      if (e.repeat) return true;
      this.keys.add(e.code);
      for (const k of PAD) if (KEYS[k] && KEYS[k].includes(e.code)) this.downs[k]++;
    } else {
      this.keys.delete(e.code);
      for (const k of PAD) if (KEYS[k] && KEYS[k].includes(e.code) && !this.btn[k]) this.ups[k]++;
    }
    return true;
  }

  _k(list) { return !!list && list.some((c) => this.keys.has(c)); }

  // Levetta con zona morta radiale e risposta analogica: inclinazione = velocita'.
  static stick(x, y) {
    const l = Math.hypot(x, y);
    if (l <= CONTROL.deadzone) return { x: 0, y: 0, mag: 0 };
    return { x: x / l, y: y / l, mag: Math.min(1, (l - CONTROL.deadzone) / (1 - CONTROL.deadzone)) };
  }

  // Controller: tasti premuti e levette. Start/Options mette in pausa; con la
  // pausa aperta la croce sposta il fuoco e X/A preme.
  _pollPad(dt) {
    if (!this.pad || !navigator.getGamepads) return null;
    const g = navigator.getGamepads()[this.pad.index];
    if (!g) return null;
    const pressed = (i) => !!(g.buttons[i] && (g.buttons[i].pressed || g.buttons[i].value > 0.5));
    const now = {};
    for (const k in PAD_INDEX) now[k] = pressed(PAD_INDEX[k]);
    now.start = pressed(PAD_START); now.up = pressed(PAD_UP); now.down = pressed(PAD_DOWN);
    const prev = this.padPrev;
    for (const k in PAD_INDEX) {
      if (now[k] && !prev[k]) { this.downs[k]++; this.device = 'pad'; }
      if (!now[k] && prev[k]) this.ups[k]++;
    }
    if (now.start && !prev.start && this.on.onPause) this.on.onPause();
    if (this.on.onMenu) {
      if (now.up && !prev.up) this.on.onMenu('up');
      if (now.down && !prev.down) this.on.onMenu('down');
      if (now.cross && !prev.cross) this.on.onMenu('ok');
    }
    this.padPrev = now;
    const L = Controls.stick(g.axes[0] || 0, g.axes[1] || 0), R = Controls.stick(g.axes[2] || 0, g.axes[3] || 0);
    if (L.mag > 0 || R.mag > 0) this.device = 'pad';
    return { now, L, R };
  }

  // Con la pausa aperta si legge solo il controller per il menu.
  pollMenu() { this._pollPad(0); this.downs = Object.fromEntries(PAD.map((k) => [k, 0])); this.ups = { ...this.downs }; }

  // Stato del frame: levette (schermo), tasti del pad e comandi del momento.
  read(dt = 1 / 60) {
    this.clock += dt;
    const pad = this._pollPad(dt);
    let x = (this._k(KEYS.right) ? 1 : 0) - (this._k(KEYS.left) ? 1 : 0);
    let y = (this._k(KEYS.down) ? 1 : 0) - (this._k(KEYS.up) ? 1 : 0);
    let mag = 0;
    if (x || y) {
      const l = Math.hypot(x, y);
      x /= l; y /= l; mag = 1;
    } else if (pad && pad.L.mag > 0) {
      ({ x, y, mag } = pad.L);
    } else if (this.joy.id !== null) {
      const s = Controls.stick(this.joy.x, this.joy.y);
      x = s.x; y = s.y; mag = s.mag;
    }
    // tasti del pad: tenuti, premuti e rilasciati dall'ultima lettura
    const held = {}, down = {}, up = {};
    for (const k of PAD) {
      held[k] = this.btn[k] || this._k(KEYS[k]) || !!(pad && pad.now[k]);
      down[k] = this.downs[k] > 0;
      up[k] = this.ups[k] > 0;
      this.downs[k] = this.ups[k] = 0;
    }
    // levetta destra: scatto oltre soglia = un colpo (finta o cambio verso la direzione)
    let rs = null;
    if (pad) {
      const on = pad.R.mag > 0.6;
      if (on && !this.rsPrev) rs = { x: pad.R.x, y: pad.R.y };
      this.rsPrev = on;
    }
    // comandi del momento
    const map = ACTIONS[this.mode];
    const cmd = { held: {}, down: {}, up: {} };
    for (const a of ALL) { cmd.held[a] = false; cmd.down[a] = false; cmd.up[a] = false; }
    for (const k of PAD) {
      const a = map[k];
      if (!a) continue;
      cmd.held[a] = cmd.held[a] || held[k];
      cmd.down[a] = cmd.down[a] || down[k];
      cmd.up[a] = cmd.up[a] || up[k];
    }
    // difesa: X due volte di fila = contrasto
    if (this.mode === 'defense' && down.cross) {
      if (this.clock - this.lastCross < CONTROL.doubleTap) { cmd.down.tackle = true; this.lastCross = -1; }
      else this.lastCross = this.clock;
    }
    // levetta destra: in attacco finta, in difesa cambio verso la direzione
    let switchDir = null;
    if (rs && this.mode === 'attack') cmd.down.feint = true;
    if (rs && this.mode === 'defense') switchDir = rs;
    const any = PAD.some((k) => down[k]) || !!rs;
    return {
      x, z: y, mag, sprint: cmd.held.sprint,
      held: cmd.held, down: cmd.down, up: cmd.up,
      btn: { held, down, up },            // tasti fisici (calci piazzati)
      rs, rsx: pad ? pad.R.x : 0, rsy: pad ? pad.R.y : 0, rsMag: pad ? pad.R.mag : 0,
      switchDir, any, device: this.device, padType: this.padKind
    };
  }

  // Pausa, finestra di uscita o finestra che perde il fuoco: niente tasti "incollati".
  reset() {
    this.keys.clear();
    for (const k of PAD) { this.btn[k] = false; this.downs[k] = this.ups[k] = 0; }
    for (const k of TOUCH) this.buttons[k]._release();
    this._joyUp({ pointerId: this.joy.id });
  }

  destroy() {
    for (const [t, type, fn, cap] of this.handlers) t.removeEventListener(type, fn, cap);
    this.handlers = [];
    this.padEl.remove();
  }
}
