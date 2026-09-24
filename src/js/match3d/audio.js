import { SOUND } from './config.js';

// Fischietto dell'arbitro, sintetizzato con WebAudio: nessun file audio.
// Il contesto si crea e si sblocca al primo tocco o tasto (regola dei
// browser mobili); prima di allora i fischi restano muti.

let ctx = null;

export function unlockAudio() {
  const C = window.AudioContext || window.webkitAudioContext;
  if (!C) return;
  try {
    if (!ctx) ctx = new C();
    if (ctx.state === 'suspended') ctx.resume();
  } catch (e) { ctx = null; }
}

// Un fischio: due toni vicini con un trillo, attacco e rilascio brevi.
function blast(t, dur) {
  const W = SOUND.whistle;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(W.gain, t + 0.02);
  g.gain.setValueAtTime(W.gain, t + Math.max(0.03, dur - 0.05));
  g.gain.linearRampToValueAtTime(0, t + dur);
  g.connect(ctx.destination);
  const lfo = ctx.createOscillator(), depth = ctx.createGain();
  lfo.frequency.value = W.trill;
  depth.gain.value = W.depth;
  lfo.connect(depth);
  const oscs = [W.f1, W.f2].map((f) => {
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = f;
    depth.connect(o.frequency);
    o.connect(g);
    return o;
  });
  for (const o of [lfo, ...oscs]) { o.start(t); o.stop(t + dur + 0.05); }
}

// 'short' fallo, fuori, fuorigioco; 'long' gol e calcio d'inizio; 'end' fine tempo (tre fischi).
export function whistle(kind = 'short') {
  if (!ctx || ctx.state !== 'running') return;
  const W = SOUND.whistle, t0 = ctx.currentTime + 0.01;
  if (kind === 'end') {
    blast(t0, W.short); blast(t0 + W.short + W.gap, W.short); blast(t0 + 2 * (W.short + W.gap), W.long);
  } else blast(t0, kind === 'long' ? W.long : W.short);
}

export function closeAudio() {
  if (ctx) { try { ctx.close(); } catch (e) { /* gia' chiuso */ } }
  ctx = null;
}
