import { startMatch } from './main.js';

// Attributi diversi per ruolo, per sentire in campo la differenza fra
// un'ala veloce e un centrocampista che passa bene.
const ROLE_ATTRS = {
  AD: { pac: 91, sho: 72, pas: 70, dri: 85, def: 35, phy: 62 },
  AS: { pac: 86, sho: 70, pas: 79, dri: 82, def: 38, phy: 60 },
  ATT: { pac: 80, sho: 88, pas: 66, dri: 76, def: 30, phy: 80 },
  CC: { pac: 66, sho: 68, pas: 88, dri: 81, def: 64, phy: 70 }
};

// Due squadre finte per ?match3d: nessuna carriera, nessun database.
function fakeTeam(id, name, colors) {
  const roles = ['POR', 'TD', 'DC', 'DC', 'TS', 'CC', 'CC', 'CC', 'AD', 'ATT', 'AS'];
  return {
    id, name, colors, crest: null, formation: '4-3-3',
    players: roles.map((role, i) => ({
      id: id + '-' + (i + 1), name: name + ' ' + (i + 1), number: i + 1, role, overall: 70,
      attrs: ROLE_ATTRS[role] || { pac: 70, sho: 70, pas: 70, dri: 70, def: 70, phy: 70 }
    }))
  };
}

export function startTestMatch() {
  return startMatch({
    home: fakeTeam('prova-a', 'Prova A', { primary: '#c8102e', secondary: '#1b1b1b', shorts: '#f2f4f5', pattern: 'stripes' }),
    away: fakeTeam('prova-b', 'Prova B', { primary: '#12a0dc', secondary: null, shorts: '#f2f4f5', pattern: 'solid' }),
    userSide: 'home',
    durationMinutes: 6,
    difficulty: 0.5,
    exitMode: 'test'
  }).then(() => {
    // Chiusa la prova si riapre il gioco normale, senza ?match3d.
    location.href = location.pathname;
  });
}
