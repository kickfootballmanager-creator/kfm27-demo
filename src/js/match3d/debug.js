// Pannello di debug (F3): fps, stato del possesso con i suoi ultimi cambi,
// fase di gioco, stati dell'IA e passo del giocatore comandato. Solo testo,
// aggiornato 4 volte al secondo. F4: rallentatore.

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
      'comandato ' + (m.ctrl ? m.ctrl.number + ' ' + (m.ctrl.aiState || '') : '-'),
      m.timeScale !== 1 ? 'rallentatore x' + m.timeScale + ' (F4 per tornare normale)' : 'F4 rallentatore'
    ];
    // passo del giocatore comandato: fase (0 = appoggio del destro) e clip che pesano
    const c = m.ctrl;
    if (c && c.gait) {
      const g = c.gait, names = [];
      for (let i = 0; i < g.w.length; i++) if (g.w[i] > 0.05) names.push(g.slots[i].name.replace(/^\d+_/, '') + ' ' + g.w[i].toFixed(2));
      lines.push('passo ' + g.phase.toFixed(2) + '  ' + c.speed.toFixed(1) + ' m/s  ' + names.join(', ') + (c.avatar.one ? '  gesto ' + c.avatar.gestureName() : ''));
    }
    // animazioni: livello, pacchetti caricati, tempi e memoria (skill: misurarli)
    const L = m.loadStats;
    if (L) {
      const A = L.anim, packs = Object.entries(A.packs).map(([n, v]) => n + ' ' + v.clips + ' clip ' + (v.bytes / 1e6).toFixed(1) + ' MB ' + Math.round(v.download + v.parse) + ' ms').join(', ');
      const mb = (b) => (b === null || b === undefined ? '-' : (b / 1e6).toFixed(0) + ' MB');
      lines.push('animazioni ' + L.level + ': ' + packs + '  avvio ' + L.loadMs + ' ms' + (L.laterMs ? ', resto a ' + L.laterMs + ' ms' : '') + '  heap ' + mb(L.heapBefore) + ' -> ' + mb(L.heapAfter));
    }
    const k = m.lastKick;
    if (k) lines.push('ultimo calcio ' + k.kind + '  potenza ' + k.power.toFixed(2) + '  ' + k.speed.toFixed(1) + ' m/s  bersaglio a ' + k.dist.toFixed(1) + ' m');
    if (m.aiSummary) lines.push(m.aiSummary());
    lines.push('', 'ultimi cambi di possesso:');
    for (const e of p.log.slice(-8).reverse()) lines.push(e.t.toFixed(1).padStart(6) + '  ' + e.from + ' -> ' + e.to + '  (' + e.cause + ')');
    this.node.textContent = lines.join('\n');
  }

  destroy() { this.node.remove(); }
}
