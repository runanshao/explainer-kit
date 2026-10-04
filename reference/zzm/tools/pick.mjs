// Render specific frames: node tools/pick.mjs s04:said:30 s06:capex:120 ...  (scene:cue:offsetFrames)
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const T = JSON.parse(fs.readFileSync(path.join(root, 'src/timings.json'), 'utf8'));
const pace = JSON.parse(fs.readFileSync(path.join(root, 'src/pace.json'), 'utf8'));
const LEADOF = (id) => pace.leadOverride[id] ?? pace.lead, TAILOF = (id) => pace.tailOverride[id] ?? pace.tail;
const FPS = 30;
let acc = 0; const starts = {};
for (const id of Object.keys(T)) { starts[id] = acc; acc += LEADOF(id) + Math.ceil(T[id].duration * FPS) + TAILOF(id); }
const outDir = path.join(root, 'out/pick'); fs.mkdirSync(outDir, {recursive: true});
const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts')});
const composition = await selectComposition({serveUrl, id: 'ZhangZhongmou', inputProps: {lang: 'zh'}});
for (const a of process.argv.slice(2)) {
  const [id, cue, off] = a.split(':');
  const fr = starts[id] + (cue === 'end' ? LEADOF(id) + Math.ceil(T[id].duration * FPS) : LEADOF(id) + Math.round(T[id].cues[cue] * FPS)) + Number(off ?? 0);
  const output = path.join(outDir, `${id}_${cue}_${off}.png`);
  await renderStill({composition, serveUrl, output, frame: fr, inputProps: {lang: 'zh'}, scale: 0.5});
  console.log(output);
}
