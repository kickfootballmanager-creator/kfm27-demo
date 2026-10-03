// Banco dei falli (tools/match3d/probe.mjs --hook): partita IA contro IA con
// i falli resi molto piu' probabili, per vedere tanti gesti in poco tempo.
// Per ogni gesto (spinta, trattenuta, spallata, piede sulla caviglia nel
// contrasto, scivolata): contatto si' o no, a che distanza, fallo, reazione.
// Con --tapes salva il nastro dei primi contatti di ogni tipo, 70 fotogrammi
// dopo, perche' si veda anche la reazione.
(() => {
  const S = window.__soak, m = S.m, run = S.run;
  import(new URL('src/js/match3d/config.js', location.href).href).then((C) => {
    const c = C.DUEL.contact;
    c.back = 1; c.side = 1; c.front = 0.5; c.full = 2;
    C.DUEL.missFoul.back = 1; C.DUEL.missFoul.side = 1; C.DUEL.missFoul.front = 0.8;
    C.DUEL.foul.auto = 0.6; C.DUEL.foul.manual = 0.7;
  });
  const P = window.__probe = { gestures: [], contacts: [], fouls: [], reacts: [], byKind: {} };
  const want = [], saved = {};
  const note = m.note.bind(m);
  m.note = (kind, data) => {
    const tag = (p) => (p && p.team ? p.team + ':' + p.number : null);
    if (kind === 'gesto fallo') P.gestures.push({ f: S.frames, p: tag(data.p), su: tag(data.su), tipo: data.tipo, da: data.da, clip: data.clip });
    if (kind === 'contatto') {
      P.contacts.push({ f: S.frames, p: tag(data.p), su: tag(data.su), tipo: data.tipo, distanza: data.distanza !== undefined ? +data.distanza.toFixed(3) : null, preso: data.preso });
      const k = P.byKind[data.tipo] || (P.byKind[data.tipo] = { prova: 0, presi: 0 });
      k.prova++; if (data.preso) k.presi++;
      if (data.preso && (saved[data.tipo] || 0) < 2) { saved[data.tipo] = (saved[data.tipo] || 0) + 1; want.push({ at: S.frames + 70, note: 'fallo ' + data.tipo + ' ' + tag(data.p) + ' su ' + tag(data.su) }); }
    }
    if (kind === 'fallo') P.fouls.push({ f: S.frames, off: tag(data.off), victim: tag(data.victim), tipo: data.tipo, gesto: data.gesto, da: data.da, livello: data.livello, cartellino: data.cartellino });
    if (kind === 'reazione') P.reacts.push({ f: S.frames, p: tag(data.p), livello: data.livello, clip: data.clip, spinta: data.spinta });
    return note(kind, data);
  };
  S.run = (n, maxClock) => {
    let r;
    for (let j = 0; j < n; j++) {
      r = run(1, maxClock);
      for (let i = want.length - 1; i >= 0; i--) if (S.frames >= want[i].at) { S.saveTape(want[i].note); want.splice(i, 1); }
      if (r.done) break;
    }
    return r;
  };
})();
