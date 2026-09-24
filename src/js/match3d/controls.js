import { CONTROL } from './config.js';

// Joystick virtuale a sinistra (l'origine e' dove si appoggia il pollice),
// pulsanti a destra, tastiera per il PC. Uscita in coordinate del campo:
// la telecamera guarda da +z, quindi destra = +x e su = -z.

const JOY_RADIUS = 56;

const ICON_PASS = '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><circle cx="6" cy="17" r="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9 14.5L18.5 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M13 5.5h6v6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICON_SHOT = '<svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path d="M2.5 19V5.5h19V19" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M6.5 9.5h11M6.5 13.5h11M10 5.5V19M14 5.5V19" fill="none" stroke="currentColor" stroke-width="1" opacity=".45"/><circle cx="12" cy="16" r="3" fill="currentColor"/></svg>';
const ICON_SPRINT = '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M5 6l6 6-6 6M12 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

const KEYS = {
  up: ['KeyW', 'ArrowUp'], down: ['KeyS', 'ArrowDown'],
  left: ['KeyA', 'ArrowLeft'], right: ['KeyD', 'ArrowRight'],
  pass: ['KeyJ'], shoot: ['KeyK'], sprint: ['KeyL', 'ShiftLeft', 'ShiftRight'], swap: ['Space']
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
    this.btn = { sprint: false, shoot: false };
    this.edges = { pass: 0, shootDown: 0, shootUp: 0, swap: 0 };
    this.handlers = [];
    this.touch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;

    const pad = el('div', 'm3d-pad');
    const zone = el('div', 'm3d-joyzone');
    const base = el('div', 'm3d-joy');
    const knob = el('div', 'm3d-knob');
    base.appendChild(knob);
    zone.appendChild(base);

    const buttons = el('div', 'm3d-buttons');
    this.bShot = this._button('shot', 'Tira', ICON_SHOT);
    this.bPass = this._button('pass', 'Passa', ICON_PASS);
    this.bSprint = this._button('sprint', 'Scatto', ICON_SPRINT);
    buttons.append(this.bSprint, this.bPass, this.bShot);
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

    this._hold(this.bPass, () => { this.edges.pass++; }, null);
    this._hold(this.bShot, () => { this.btn.shoot = true; this.edges.shootDown++; }, () => { if (this.btn.shoot) { this.btn.shoot = false; this.edges.shootUp++; } });
    this._hold(this.bSprint, () => { this.btn.sprint = true; }, () => { this.btn.sprint = false; });

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

  _button(kind, label, icon) {
    const b = el('button', 'm3d-btn ' + kind);
    b.type = 'button';
    b.tabIndex = -1;
    b.setAttribute('aria-label', label);
    b.innerHTML = icon;
    const t = el('span', 'm3d-btn-l');
    t.textContent = label;
    b.appendChild(t);
    return b;
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
      if (KEYS.pass.includes(e.code)) this.edges.pass++;
      if (KEYS.shoot.includes(e.code)) this.edges.shootDown++;
      if (KEYS.swap.includes(e.code)) this.edges.swap++;
    } else {
      this.keys.delete(e.code);
      if (KEYS.shoot.includes(e.code) && !this.btn.shoot) this.edges.shootUp++;
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
    const out = {
      x, z: y, mag,
      sprint: this.btn.sprint || this._k(KEYS.sprint),
      shootHeld: this.btn.shoot || this._k(KEYS.shoot),
      pass: this.edges.pass > 0,
      shootDown: this.edges.shootDown > 0,
      shootUp: this.edges.shootUp > 0,
      swap: this.edges.swap > 0
    };
    this.edges.pass = this.edges.shootDown = this.edges.shootUp = this.edges.swap = 0;
    return out;
  }

  // Pausa, finestra di uscita o finestra che perde il fuoco: niente tasti "incollati".
  reset() {
    this.keys.clear();
    this.btn.sprint = this.btn.shoot = false;
    this.edges.pass = this.edges.shootDown = this.edges.shootUp = this.edges.swap = 0;
    for (const b of [this.bPass, this.bShot, this.bSprint]) b._release();
    this._joyUp({ pointerId: this.joy.id });
  }

  destroy() {
    for (const [t, type, fn, cap] of this.handlers) t.removeEventListener(type, fn, cap);
    this.handlers = [];
    this.pad.remove();
  }
}
