import { startMatch } from './main.js';
import { FORMATION_ROLES } from './config.js';

// Attributi diversi per ruolo, per sentire in campo la differenza fra
// un'ala veloce e un centrocampista che passa bene.
const ROLE_ATTRS = {
  POR: { pac: 55, sho: 30, pas: 60, dri: 40, def: 40, phy: 75 },
  DC: { pac: 68, sho: 40, pas: 62, dri: 58, def: 84, phy: 82 },
  TS: { pac: 80, sho: 50, pas: 72, dri: 72, def: 76, phy: 72 },
  TD: { pac: 80, sho: 50, pas: 72, dri: 72, def: 76, phy: 72 },
  CDC: { pac: 64, sho: 60, pas: 82, dri: 74, def: 80, phy: 80 },
  AD: { pac: 91, sho: 72, pas: 70, dri: 85, def: 35, phy: 62 },
  AS: { pac: 86, sho: 70, pas: 79, dri: 82, def: 38, phy: 60 },
  ATT: { pac: 80, sho: 88, pas: 66, dri: 76, def: 30, phy: 80 },
  CC: { pac: 66, sho: 68, pas: 88, dri: 81, def: 64, phy: 70 }
};

// Due squadre finte per ?match3d: nessuna carriera, nessun database.
function fakeTeam(id, name, colors, formation) {
  const roles = FORMATION_ROLES[formation];
  return {
    id, name, colors, crest: null, formation,
    players: roles.map((role, i) => ({
      id: id + '-' + (i + 1), name: name + ' ' + (i + 1), number: i + 1, role, overall: 70,
      attrs: ROLE_ATTRS[role] || { pac: 70, sho: 70, pas: 70, dri: 70, def: 70, phy: 70 }
    }))
  };
}

export function startTestMatch() {
  // ?match3d=auto: IA contro IA, per il test di durata (tools/match3d/soak.mjs)
  const q = new URLSearchParams(location.search);
  const auto = q.get('match3d') === 'auto';
  return startMatch({
    auto,
    // &anim=high|medium|low: livello delle animazioni (se manca, quello della grafica)
    animLevel: q.get('anim') || undefined,
    debug: q.has('debug'),
    home: fakeTeam('prova-a', 'Prova A', { primary: '#c8102e', secondary: '#1b1b1b', shorts: '#f2f4f5', pattern: 'stripes' }, '4-3-3'),
    away: fakeTeam('prova-b', 'Prova B', { primary: '#12a0dc', secondary: null, shorts: '#f2f4f5', pattern: 'solid' }, '4-4-2'),
    userSide: 'home',
    durationMinutes: 6,
    difficulty: 0.5,
    exitMode: 'test'
  }).then(() => {
    // Chiusa la prova si riapre il gioco normale, senza ?match3d.
    location.href = location.pathname;
  });
}
