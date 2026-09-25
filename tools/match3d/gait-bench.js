// Tapis roulant delle animazioni: un giocatore corre dritto a velocita' e
// direzione fisse (rispetto al busto) e si misura quanto scivola il piede
// d'appoggio sul terreno. Valutato nella pagina da bench.mjs dopo ?match3d=auto.
(() => {
  const m = window.__m3d;
  cancelAnimationFrame(m.raf);
  m.frame = () => {};
  const p = m.teams.home.players[5], r = p.avatar.rig, DT = 1 / 60, G = m.tpl.gait.ground;
  const toe = (b) => { const e = b.matrixWorld.elements; return [e[12], e[13], e[14]]; };
  const out = [];
  for (const rel of (window.__benchDirs || [0, 0.75, 1.57, 2.4, 2.7, 2.95, 3.14])) {
    for (const v of [1, 2, 3, 4.5, 6, 8]) {
      if (rel > 2 && v > 6) continue;
      p.place(0, 0, 0);
      const heading = 0, move = heading + rel;
      p.gait.phase = p.gait.prevPhase = 0;
      let slide = 0, n = 0, prev = null, lowY = Infinity;
      for (let f = 0; f < 240; f++) {
        p.prev.copy(p.pos);
        p.prevHeading = p.heading = heading;
        p.moveHeading = move;
        p.speed = v;
        p.vel.set(Math.sin(move) * v, 0, Math.cos(move) * v);
        p.pos.addScaledVector(p.vel, DT);
        p.animStep(DT);
        p.sync(1, DT);
        p.mesh.updateMatrixWorld(true);
        const L = toe(r.LeftToeBase), R = toe(r.RightToeBase);
        const cur = { L, R, LF: toe(r.LeftFoot), RF: toe(r.RightFoot) };
        if (prev && f > 90) {
          const k = L[1] < R[1] ? 'L' : 'R', a = cur[k], b = prev[k];
          const vy = Math.abs(a[1] - b[1]) / DT;
          lowY = Math.min(lowY, a[1]);
          // piede piatto: punta e tallone a terra (come soak-page.js)
          const flat = a[1] < G.toe + 0.015 && cur[k + 'F'][1] < G.ankle + 0.03;
          if (flat && vy < 0.6) { slide += Math.hypot(a[0] - b[0], a[2] - b[2]) / DT; n++; }
        }
        prev = cur;
      }
      out.push({ dir: rel, v, slide: n ? +(slide / n).toFixed(2) : null, planted: +(n / 150).toFixed(2), lowY: +lowY.toFixed(3) });
    }
  }
  return out;
})()
