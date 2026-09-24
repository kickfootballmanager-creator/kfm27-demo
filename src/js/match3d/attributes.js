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
    tackle: lerp(ATTR.tackle, def)
  };
}
