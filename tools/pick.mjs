// Render specific frames: node tools/pick.mjs s01:quote:40 s02:formula:0 s02:end:-10
// Each argument is scene:cue:offsetFrames (cue "end" = end of narration) → out/pick/<scene>_<cue>_<offset>.png
import fs from 'node:fs';
import path from 'node:path';
import {renderStill} from '@remotion/renderer';
import {cueFrame, open, root, starts} from './timeline.mjs';

const args = process.argv.slice(2);
if (!args.length) {
  console.error('usage: node tools/pick.mjs scene:cue[:offset] ...');
  process.exit(1);
}
const outDir = path.join(root, 'out/pick');
fs.mkdirSync(outDir, {recursive: true});
const {serveUrl, composition} = await open();
for (const a of args) {
  const [id, cue, off = '0'] = a.split(':');
  if (!(id in starts)) throw new Error(`unknown scene ${id}`);
  const frame = starts[id] + cueFrame(id, cue) + Number(off);
  const output = path.join(outDir, `${id}_${cue}_${off}.png`);
  await renderStill({composition, serveUrl, output, frame, scale: 0.5});
  console.log(output);
}
