// Motion review: tile a run of frames around a cue into one image, so you see how things move, not just where they land.
// usage: node tools/strip.mjs s01:quote             → 16 frames, cue-6 … cue+84 every 6 frames
//        node tools/strip.mjs s02:formula:-4:56:4   → scene:cue:from:to:step (cue "end" = end of narration)
// output: out/strips/<scene>_<cue>.png, each tile labelled with its offset from the cue
import fs from 'node:fs';
import path from 'node:path';
import {renderStill} from '@remotion/renderer';
import {CFG, browserExecutable, cueFrame, open, root, sceneLen, starts} from './timeline.mjs';

const args = process.argv.slice(2);
if (!args.length) {
  console.error('usage: node tools/strip.mjs scene:cue[:from:to:step] ...');
  process.exit(1);
}
const outDir = path.join(root, 'out/strips');
fs.mkdirSync(outDir, {recursive: true});
const id = `${CFG.id}-strip`;
const {serveUrl} = await open(id, {frames: [0]});
for (const a of args) {
  const [sid, cue, from = '-6', to = '84', step = '6'] = a.split(':');
  if (!(sid in starts)) throw new Error(`unknown scene ${sid}`);
  const base = cueFrame(sid, cue);
  const offs = [];
  for (let o = Number(from); o <= Number(to) && offs.length < 16; o += Math.max(1, Number(step))) {
    if (base + o >= 0 && base + o < sceneLen(sid)) offs.push(o);
  }
  const cols = offs.length > 9 ? 4 : offs.length > 4 ? 3 : 2;
  const inputProps = {frames: offs.map((o) => starts[sid] + base + o), labels: offs.map((o) => `${cue}${o >= 0 ? '+' : ''}${o}`), cols};
  const {selectComposition} = await import('@remotion/renderer');
  const composition = await selectComposition({serveUrl, id, inputProps, browserExecutable});
  const output = path.join(outDir, `${sid}_${cue}.png`);
  await renderStill({composition, serveUrl, output, inputProps, browserExecutable});
  console.log(output);
}
