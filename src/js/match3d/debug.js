// Pannello di debug (F3): fps, stato del possesso con i suoi ultimi cambi,
// fase di gioco e stati dell'IA. Solo testo, aggiornato 4 volte al secondo.

const EVERY = 0.25;

export class Debug {
  constructor(root, match) {
    this.match = match;
    this.on = false;
    this.t = 0;
    this.frames = 0;
    this.fps = 0;
    this.node = document.createElement('pre');
    this.node.className = 'm3d-debug';
    this.node.hidden = true;
    root.appendChild(this.node);
  }

  toggle() {
    this.on = !this.on;
    this.node.hidden = !this.on;
  }

  update(dt) {
    this.t += dt;
    this.frames++;
    if (this.t < EVERY) return;
    this.fps = Math.round(this.frames / this.t);
    this.t = 0;
    this.frames = 0;
    if (!this.on) return;
    const m = this.match, p = m.poss, b = m.ball;
    const lines = [
      'fps ' + this.fps + '  pixel ratio ' + m.pixelRatio.toFixed(2),
      'fase ' + (m.phase || 'gioco') + (m.clockText ? '  ' + m.clockText() : ''),
      'possesso ' + p.describe() + '  da ' + p.age.toFixed(1) + ' s',
      'palla ' + b.pos.x.toFixed(1) + ' ' + b.pos.y.toFixed(2) + ' ' + b.pos.z.toFixed(1) +
        '  v ' + Math.hypot(b.vel.x, b.vel.z).toFixed(1) + ' m/s',
      'comandato ' + (m.ctrl ? m.ctrl.number + ' ' + (m.ctrl.aiState || '') : '-')
    ];
    const k = m.lastKick;
    if (k) lines.push('ultimo calcio ' + k.kind + '  potenza ' + k.power.toFixed(2) + '  ' + k.speed.toFixed(1) + ' m/s  bersaglio a ' + k.dist.toFixed(1) + ' m');
    if (m.aiSummary) lines.push(m.aiSummary());
    lines.push('', 'ultimi cambi di possesso:');
    for (const e of p.log.slice(-8).reverse()) lines.push(e.t.toFixed(1).padStart(6) + '  ' + e.from + ' -> ' + e.to + '  (' + e.cause + ')');
    this.node.textContent = lines.join('\n');
  }

  destroy() { this.node.remove(); }
}
