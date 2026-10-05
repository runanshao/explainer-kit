// Review stills: bundle once, render one frame OFF frames after each cue (plus one near the scene end).
// usage: node tools/stills.mjs [s01 s02 ...]        → out/stills/<scene>_<cue>.png
//        OFF=30 node tools/stills.mjs s02           (default OFF=75, i.e. 2.5 s at 30 fps)
import fs from 'node:fs';
import path from 'node:path';
import {renderStill} from '@remotion/renderer';
import {FPS, IDS, T, browserExecutable, cueFrame, open, root, sceneLen, starts} from './timeline.mjs';

const OFF = Number(process.env.OFF ?? Math.round(2.5 * FPS));
const only = process.argv.slice(2);
const outDir = path.join(root, 'out/stills');
fs.mkdirSync(outDir, {recursive: true});
const {serveUrl, composition} = await open();
for (const id of IDS) {
  if (only.length && !only.includes(id)) continue;
  const len = sceneLen(id);
  const frames = Object.keys(T[id].cues).map((k) => [k, Math.min(len - 15, cueFrame(id, k) + OFF)]);
  frames.push(['end', len - 20]);
  for (const [k, fr] of frames) {
    const output = path.join(outDir, `${id}_${k}.png`);
    await renderStill({composition, serveUrl, output, frame: starts[id] + fr, scale: 0.5, browserExecutable});
    console.log(output);
  }
}
