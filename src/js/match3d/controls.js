import { CONTROL } from './config.js';

// Joystick virtuale a sinistra (l'origine e' dove si appoggia il pollice),
// pulsanti a destra, tastiera per il PC. Uscita in coordinate del campo:
// la telecamera guarda da +z, quindi destra = +x e su = -z.

const JOY_RADIUS = 56;

const S = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
const svg = (size, body) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true">${body}</svg>`;

// In attacco e in difesa gli stessi pulsanti fanno cose diverse: etichetta e
// icona cambiano col possesso. Scatto resta Scatto, Finta esiste solo in attacco.
const ICONS = {
  pass: svg(24, `<circle cx="6" cy="17" r="3" ${S}/><path d="M9 14.5L18.5 6" ${S}/><path d="M13 5.5h6v6" ${S}/>`),
  through: svg(24, `<path d="M9 4v6M15 4v6M9 14v6M15 14v6" ${S} opacity=".5"/><path d="M3 12h17" ${S}/><path d="M16 8l4 4-4 4" ${S}/>`),
  cross: svg(24, `<path d="M4 18C6 8 14 4 20 9" ${S}/><path d="M20 4v5h-5" ${S}/><circle cx="5" cy="19.5" r="1.5" fill="currentColor"/>`),
  shot: svg(28, `<path d="M2.5 19V5.5h19V19" ${S}/><path d="M6.5 9.5h11M6.5 13.5h11M10 5.5V19M14 5.5V19" fill="none" stroke="currentColor" stroke-width="1" opacity=".45"/><circle cx="12" cy="16" r="3" fill="currentColor"/>`),
  sprint: svg(24, `<path d="M5 6l6 6-6 6M12 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`),
  feint: svg(24, `<path d="M19 12a7 7 0 1 1-2.1-5" ${S}/><path d="M17.5 3v4.5H13" ${S}/><circle cx="12" cy="12" r="2" fill="currentColor"/>`),
  swap: svg(24, `<path d="M4 8h14M14 4l4 4-4 4" ${S}/><path d="M20 16H6M10 12l-4 4 4 4" ${S}/>`),
  press: svg(24, `<circle cx="12" cy="12" r="3" fill="currentColor"/><path d="M12 2v5M12 17v5M2 12h5M17 12h5" ${S}/>`),
  slide: svg(24, `<path d="M3 20h18" ${S}/><path d="M5 16l7-2 8 1" ${S}/><circle cx="7" cy="9" r="2" ${S}/><circle cx="20" cy="12.5" r="1.5" fill="currentColor"/>`),
  tackle: svg(28, `<path d="M6 6l12 12M18 6L6 18" ${S}/><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".45"/>`)
};

// Pulsante -> [comando in attacco, comando in difesa]
const BUTTONS = {
  pass: { attack: ['pass', 'Passa'], defense: ['swap', 'Cambio'] },
  through: { attack: ['through', 'Filtrante'], defense: ['press', 'Pressing'] },
  cross: { attack: ['cross', 'Cross'], defense: ['slide', 'Scivolata'] },
  shot: { attack: ['shot', 'Tiro'], defense: ['tackle', 'Contrasto'] },
  sprint: { attack: ['sprint', 'Scatto'], defense: ['sprint', 'Scatto'] },
  feint: { attack: ['feint', 'Finta'], defense: null }
};
const HOLD = ['pass', 'through', 'cross', 'shot', 'sprint', 'feint'];

// Tastiera: WASD/frecce, J passa/cambio, I filtrante/pressing, U cross/scivolata,
// K tiro/contrasto, L scatto, O finta.
const KEYS = {
  up: ['KeyW', 'ArrowUp'], down: ['KeyS', 'ArrowDown'],
  left: ['KeyA', 'ArrowLeft'], right: ['KeyD', 'ArrowRight'],
  pass: ['KeyJ'], through: ['KeyI'], cross: ['KeyU'], shot: ['KeyK'], sprint: ['KeyL'], feint: ['KeyO']
};
const ALL_KEYS = new Set(Object.values(KEYS).flat());

function el(tag, cls) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  return n;
}

export class Controls {
  constructor(root, layer) {
    this.root = root;
    this.keys = new Set();
    this.joy = { id: null, ox: 0, oy: 0, x: 0, y: 0 };
    this.btn = {};             // pulsanti touch tenuti premuti
    this.downs = {};           // pressioni dall'ultima lettura
    this.ups = {};             // rilasci dall'ultima lettura
    for (const k of HOLD) { this.btn[k] = false; this.downs[k] = 0; this.ups[k] = 0; }
    this.mode = 'attack';
    this.handlers = [];
    this.touch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;

    const pad = el('div', 'm3d-pad');
    const zone = el('div', 'm3d-joyzone');
    const base = el('div', 'm3d-joy');
    const knob = el('div', 'm3d-knob');
    base.appendChild(knob);
    zone.appendChild(base);

    const buttons = el('div', 'm3d-buttons');
    this.buttons = {};
    for (const k of HOLD) {
      const b = this._button(k);
      this.buttons[k] = b;
      buttons.appendChild(b);
      this._hold(b, () => { this.btn[k] = true; this.downs[k]++; }, () => { if (this.btn[k]) { this.btn[k] = false; this.ups[k]++; } });
    }
    this.setMode('attack');
    pad.append(zone, buttons);
    layer.appendChild(pad);
    this.pad = pad;
    this.zone = zone;
    this.base = base;
    this.knob = knob;
    if (this.touch) root.classList.add('touch');

    this._on(zone, 'pointerdown', (e) => this._joyDown(e));
    this._on(zone, 'pointermove', (e) => this._joyMove(e));
    for (const t of ['pointerup', 'pointercancel', 'lostpointercapture']) this._on(zone, t, (e) => this._joyUp(e));

    // Il primo tocco sullo schermo mostra i comandi anche su un PC con touch.
    this._on(root, 'pointerdown', (e) => {
      if (e.pointerType === 'touch' && !this.touch) { this.touch = true; root.classList.add('touch'); }
    }, true);
    this._on(root, 'gesturestart', (e) => e.preventDefault());
    this._on(window, 'blur', () => this.reset());
  }

  _on(t, type, fn, cap) {
    t.addEventListener(type, fn, cap);
    this.handlers.push([t, type, fn, cap]);
  }

  _button(kind) {
    const b = el('button', 'm3d-btn ' + kind);
    b.type = 'button';
    b.tabIndex = -1;
    b._icon = el('span', 'm3d-btn-i');
    b._label = el('span', 'm3d-btn-l');
    b.append(b._icon, b._label);
    return b;
  }

  // 'attack' o 'defense': etichette e icone seguono il possesso.
  setMode(mode) {
    if (mode === this.mode && this._modeSet) return;
    this._modeSet = true;
    this.mode = mode;
    for (const k of HOLD) {
      const b = this.buttons[k], d = BUTTONS[k][mode];
      b.hidden = !d;
      if (!d) { b._release(); this.btn[k] = false; continue; }
      b.setAttribute('aria-label', d[1]);
      b._icon.innerHTML = ICONS[d[0]];
      b._label.textContent = d[1];
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
    if (down) {
      if (e.repeat) return true;
      this.keys.add(e.code);
      for (const k of HOLD) if (KEYS[k].includes(e.code)) this.downs[k]++;
    } else {
      this.keys.delete(e.code);
      for (const k of HOLD) if (KEYS[k].includes(e.code) && !this.btn[k]) this.ups[k]++;
    }
    return true;
  }

  _k(list) { return list.some((c) => this.keys.has(c)); }

  // Stato del frame: direzione nel campo e comandi premuti dall'ultima lettura.
  read() {
    let x = (this._k(KEYS.right) ? 1 : 0) - (this._k(KEYS.left) ? 1 : 0);
    let y = (this._k(KEYS.down) ? 1 : 0) - (this._k(KEYS.up) ? 1 : 0);
    let mag = 0;
    if (x || y) {
      const l = Math.hypot(x, y);
      x /= l; y /= l; mag = 1;
    } else if (this.joy.id !== null) {
      const l = Math.hypot(this.joy.x, this.joy.y);
      if (l > CONTROL.deadzone) {
        mag = Math.min(1, (l - CONTROL.deadzone) / (1 - CONTROL.deadzone));
        x = this.joy.x / l; y = this.joy.y / l;
      }
    }
    // Comandi per nome del pulsante: held (tenuto), down/up (dall'ultima lettura).
    const held = {}, down = {}, up = {};
    for (const k of HOLD) {
      held[k] = this.btn[k] || this._k(KEYS[k]);
      down[k] = this.downs[k] > 0;
      up[k] = this.ups[k] > 0;
      this.downs[k] = this.ups[k] = 0;
    }
    return { x, z: y, mag, sprint: held.sprint, held, down, up, any: HOLD.some((k) => down[k]) };
  }

  // Pausa, finestra di uscita o finestra che perde il fuoco: niente tasti "incollati".
  reset() {
    this.keys.clear();
    for (const k of HOLD) { this.btn[k] = false; this.downs[k] = this.ups[k] = 0; this.buttons[k]._release(); }
    this._joyUp({ pointerId: this.joy.id });
  }

  destroy() {
    for (const [t, type, fn, cap] of this.handlers) t.removeEventListener(type, fn, cap);
    this.handlers = [];
    this.pad.remove();
  }
}
