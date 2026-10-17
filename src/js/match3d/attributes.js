import { ATTR } from './config.js';

// Attributi del manager (0-99) -> parametri fisici del calciatore in campo.
// Se un attributo manca si usa l'overall, se manca anche quello ATTR.fallback.

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function unit(v, base) {
  const x = num(v) ?? base;
  return Math.max(0, Math.min(1, (x - ATTR.low) / (ATTR.high - ATTR.low)));
}

const lerp = ([a, b], t) => a + (b - a) * t;

// Altezza in metri: dal manager (`height` in cm o in m) se c'e'; il database
// non la ha, quindi dal ruolo principale, piu' il fisico, piu' uno scarto fisso
// per giocatore (dal nome) entro ATTR.heightNoise.
function heightOf(p, phy) {
  const h = num(p && p.height);
  if (h) return h > 3 ? h / 100 : h;
  const H = ATTR.height, role = String((p && (p.role || (p.roles && p.roles[0]))) || '').toUpperCase().split(/[,\s/]+/)[0];
  let seed = 0;
  for (const c of String((p && p.name) || '')) seed = (seed * 31 + c.charCodeAt(0)) >>> 0;
  const noise = ((seed % 1000) / 1000 * 2 - 1) * H.noise;
  return (H.base[role] ?? H.base.default) + (phy - 0.5) * H.phy + noise;
}

export function playerParams(p) {
  const base = num(p && p.overall) ?? ATTR.fallback;
  const a = (p && p.attrs) || {};
  const pac = unit(a.pac, base), sho = unit(a.sho, base), pas = unit(a.pas, base);
  const dri = unit(a.dri, base), def = unit(a.def, base), phy = unit(a.phy, base);

  const maxSpeed = lerp(ATTR.speed, pac);
  return {
    maxSpeed,
    accel: maxSpeed / lerp(ATTR.accelTime, pac * 0.7 + phy * 0.3),
    turnRate: lerp(ATTR.turnRate, dri * 0.5 + pac * 0.5),
    turnRateBall: lerp(ATTR.turnRateBall, dri),
    dribbleSpeed: lerp(ATTR.dribbleSpeed, dri),
    passError: lerp(ATTR.passError, pas),
    shotSpeed: lerp(ATTR.shotSpeed, sho * 0.8 + phy * 0.2),
    shotError: lerp(ATTR.shotError, sho),
    tackle: lerp(ATTR.tackle, def),
    // altezza (m), elevazione nel salto (m), forza e controllo del primo tocco (0-1)
    height: heightOf(p, phy),
    jump: lerp(ATTR.jump, phy * 0.7 + pac * 0.3),
    strength: phy,
    control: dri
  };
}
