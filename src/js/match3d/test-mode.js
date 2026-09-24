import { startMatch } from './main.js';

// Due squadre finte per ?match3d: nessuna carriera, nessun database.
function fakeTeam(id, name) {
  const roles = ['POR', 'TD', 'DC', 'DC', 'TS', 'CC', 'CC', 'CC', 'AD', 'ATT', 'AS'];
  return {
    id, name, colors: null, crest: null, formation: '4-3-3',
    players: roles.map((role, i) => ({
      id: id + '-' + (i + 1), name: name + ' ' + (i + 1), number: i + 1, role, overall: 70,
      attrs: { pac: 70, sho: 70, pas: 70, dri: 70, def: 70, phy: 70 }
    }))
  };
}

export function startTestMatch() {
  return startMatch({
    home: fakeTeam('prova-a', 'Prova A'),
    away: fakeTeam('prova-b', 'Prova B'),
    userSide: 'home',
    durationMinutes: 6,
    difficulty: 0.5,
    exitMode: 'test'
  }).then(() => {
    // Chiusa la prova si riapre il gioco normale, senza ?match3d.
    location.href = location.pathname;
  });
}
