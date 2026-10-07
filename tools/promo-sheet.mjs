// Review the promo: a contact sheet with a frame shortly after every cue (default +4 frames, once the hit has landed)
// plus the last frame. Look for: a cue with nothing new on screen, text clipping the frame, weak contrast.
// usage: node tools/promo-sheet.mjs            → out/promo/sheet.png (frames in out/promo/frames/)
//        OFF=0 node tools/promo-sheet.mjs      → exactly on each cue (the impact frame)
//        node tools/promo-sheet.mjs 12 40 96   → these absolute frames instead
// Frames are rendered one by one from the real composition (no <Freeze> tiling: a frozen copy of a shell whose
// transitions pre-roll would not be the frame you ship).
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {renderStill} from '@remotion/renderer';
import {browserExecutable, open, root} from './timeline.mjs';
import {PROMO, cueAbs, total} from './promo-grid.mjs';

const OFF = Number(process.env.OFF ?? 4);
const args = process.argv.slice(2).map(Number).filter(Number.isFinite);
const spots = args.length
  ? args.map((fr) => [String(fr), fr])
  : [...PROMO.scenes.flatMap((s) => Object.keys(s.cues).map((k) => [`${s.id}:${k}`, Math.min(total - 1, cueAbs(s.id, k) + OFF)])), ['end', total - 1]];
const outDir = path.join(root, 'out/promo');
const frameDir = path.join(outDir, 'frames');
fs.mkdirSync(frameDir, {recursive: true});
const {serveUrl, composition} = await open(PROMO.id);
const tiles = [];
for (const [label, frame] of spots) {
  const output = path.join(frameDir, `${String(frame).padStart(4, '0')}.png`);
  await renderStill({composition, serveUrl, output, frame, scale: 0.25, browserExecutable});
  tiles.push(`${output}|${label} ${frame}`);
}
const py = spawnSync('python', ['--version']).status === 0 ? 'python' : 'python3';
const sheet = path.join(outDir, 'sheet.png');
const r = spawnSync(py, [path.join(root, 'tools/tile.py'), sheet, '8', ...tiles], {stdio: 'inherit'});
process.exit(r.status ?? 1);
