// Stampa i metadati di alcune clip dei pacchetti (tools/match3d/studio33_build.py).
//   node tools/match3d/anim-meta.mjs [pacchetto] nome1 nome2 ...   (nomi parziali)
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2);
const packs = ['core', 'more', 'extra'].includes(args[0]) ? [args.shift()] : ['core', 'more', 'extra'];
for (const pack of packs) {
  let b;
  try { b = readFileSync(join(ROOT, 'src', 'assets', 'match3d', 'anims-' + pack + '.glb')); } catch (e) { continue; }
  const jl = b.readUInt32LE(12), j = JSON.parse(b.subarray(20, 20 + jl).toString('utf8'));
  const bin = b.subarray(28 + jl);
  const arr = (v) => (v && v['@'] !== undefined ? Array.from(new Float32Array(bin.buffer.slice(bin.byteOffset + v['@'], bin.byteOffset + v['@'] + v.n * 4))) : v);
  for (const [name, m] of Object.entries(j.extras.clips)) {
    if (args.length && !args.some((a) => name.includes(a))) continue;
    const root = arr(m.root), feet = arr(m.feet);
    const out = { pack, dur: m.dur, role: m.role, style: m.style, keepYaw: m.keepYaw, net: m.net, vIn: m.vIn, vOut: m.vOut, hipsMin: m.hipsMin, ball0: m.ball0, ev: m.ev };
    if (root) {
      const n = root.length / 3, st = Math.max(1, Math.round(n / 8));
      out.root = [];
      for (let i = 0; i < n; i += st) out.root.push([+(i / 30).toFixed(2), +root[i * 3].toFixed(2), +root[i * 3 + 1].toFixed(2), +root[i * 3 + 2].toFixed(2)]);
    }
    if (feet && process.env.FEET) {
      const n = feet.length / 6;
      out.feetMinY = [];
      for (let i = 0; i < n; i += 2) out.feetMinY.push(+Math.min(feet[i * 6 + 1], feet[i * 6 + 4]).toFixed(2));
    }
    if (m.gait) out.gait = { speed: m.gait.speed, dir: m.gait.dir, dur: m.gait.dur, strikeR: m.gait.strikeR, strikeL: m.gait.strikeL, touches: m.gait.touches };
    console.log(name, JSON.stringify(out));
  }
}
