// Review the promo as it will be watched: a contact sheet of the review spots (frame 0, every cue once settled, the
// middle of every transition, the cover, the last frame), rendered from the real composition with the copy probe on —
// areas the app's UI covers are shaded, copy outside the safe area is outlined in red and listed below.
// usage: node tools/promo-sheet.mjs            → out/promo/sheet.png (frames in out/promo/frames/)
//        node tools/promo-sheet.mjs 12 40 96   → these absolute frames instead
// Frames are rendered one by one (no <Freeze> tiling: a frozen copy of a shell whose transitions pre-roll would not be
// the frame you ship). Exits non-zero if the probe found a problem.
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {root} from './timeline.mjs';
import {reviewSpots} from './promo-grid.mjs';
import {openProbe, problems} from './promo-probe.mjs';

const args = process.argv.slice(2).map(Number).filter(Number.isFinite);
const spots = args.length ? args.map((frame) => ({label: String(frame), frame, kind: frame === 0 ? 'first' : 'read'})) : reviewSpots();
const outDir = path.join(root, 'out/promo');
const frameDir = path.join(outDir, 'frames');
fs.mkdirSync(frameDir, {recursive: true});
const probe = await openProbe();
const tiles = [];
const found = [];
for (const sp of spots) {
  const output = path.join(frameDir, `${String(sp.frame).padStart(4, '0')}.png`);
  const p = problems(sp, await probe(sp.frame, output));
  for (const x of p) found.push(`${sp.label} (frame ${sp.frame}): ${x}`);
  tiles.push(`${output}|${p.length ? '✖ ' : ''}${sp.label} ${sp.frame}`);
}
const py = spawnSync('python', ['--version']).status === 0 ? 'python' : 'python3';
const sheet = path.join(outDir, 'sheet.png');
const r = spawnSync(py, [path.join(root, 'tools/tile.py'), sheet, '8', ...tiles], {stdio: 'inherit'});
if (r.status !== 0) process.exit(r.status ?? 1);
console.log(found.length ? `\n✖ ${found.length} problem(s):\n  ${found.join('\n  ')}` : '\n✔ every review frame keeps its copy inside the safe area');
process.exit(found.length ? 1 : 0);
