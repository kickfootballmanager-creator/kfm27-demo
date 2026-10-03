// Sonda (probe.mjs --hook): salva il nastro 45 fotogrammi dopo i primi tiri
// e cross di una partita IA contro IA, per misurare la palla al calcio
// (distanza dal piede, rotazione per fotogramma, curva) con replay-debug.
(() => {
  const S = window.__soak, m = S.m, run = S.run;
  const want = [], seen = { tiro: 0, cross: 0 };
  const note = m.note.bind(m);
  m.note = (k, d) => {
    const kind = k === 'tiro' ? 'tiro' : k === 'calcio' && d.tipo === 'cross' ? 'cross' : null;
    if (kind && seen[kind] < 3) { seen[kind]++; want.push({ at: S.frames + 45, note: kind + ' ' + (d.p && d.p.team ? d.p.team + ':' + d.p.number : '') + ' ' + (d.clip || '') }); }
    return note(k, d);
  };
  window.__probe = seen;
  S.run = (n, mc) => {
    let r;
    for (let j = 0; j < n; j++) {
      r = run(1, mc);
      for (let i = want.length - 1; i >= 0; i--) if (S.frames >= want[i].at) { S.saveTape(want[i].note); want.splice(i, 1); }
      if (r.done) break;
    }
    return r;
  };
})();
