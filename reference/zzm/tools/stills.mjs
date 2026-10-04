// Batch review stills: bundle once, render a frame ~2.5s after each cue (or given scenes only).
// usage: node tools/stills.mjs [s01 s02 ...]   → out/stills/<scene>_<cue>.png
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const timings = JSON.parse(fs.readFileSync(path.join(root, 'src/timings.json'), 'utf8'));
const pace = JSON.parse(fs.readFileSync(path.join(root, 'src/pace.json'), 'utf8'));
const LEADOF = (id) => pace.leadOverride[id] ?? pace.lead, TAILOF = (id) => pace.tailOverride[id] ?? pace.tail;
const FPS = 30, OFF = Number(process.env.OFF ?? 75);
const only = process.argv.slice(2);
const ids = Object.keys(timings);
let acc = 0;
const starts = {};
for (const id of ids) {
  starts[id] = acc;
  acc += LEADOF(id) + Math.ceil(timings[id].duration * FPS) + TAILOF(id);
}
const outDir = path.join(root, 'out/stills');
fs.mkdirSync(outDir, {recursive: true});
const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts')});
const composition = await selectComposition({serveUrl, id: 'ZhangZhongmou', inputProps: {lang: 'zh'}});
for (const id of ids) {
  if (only.length && !only.includes(id)) continue;
  const len = LEADOF(id) + Math.ceil(timings[id].duration * FPS) + TAILOF(id);
  const cues = Object.entries(timings[id].cues);
  const frames = cues.map(([k, t]) => [k, Math.min(len - 15, LEADOF(id) + Math.round(t * FPS) + OFF)]);
  frames.push(['end', len - 20]);
  for (const [k, fr] of frames) {
    const output = path.join(outDir, `${id}_${k}.png`);
    await renderStill({composition, serveUrl, output, frame: starts[id] + fr, inputProps: {lang: 'zh'}, scale: 0.5});
    console.log(output);
  }
}
