// One frame of every scene in one image — the quickest way to see the whole film, check a brand colour or a format.
// usage: node tools/overview.mjs                 → out/overview.png, each scene 20 frames before its narration ends
//        node tools/overview.mjs --at 0.5        → each scene at 50 % of its narration instead
//        node tools/overview.mjs --format 9x16   → the same in a kit.config.json format (out/overview_9x16.png)
import fs from 'node:fs';
import path from 'node:path';
import {renderStill, selectComposition} from '@remotion/renderer';
import {CFG, IDS, T, browserExecutable, leadOf, narrEnd, open, root, starts} from './timeline.mjs';

const argv = process.argv.slice(2);
const opt = (k) => {
  const i = argv.indexOf(k);
  return i >= 0 ? argv[i + 1] : undefined;
};
const format = opt('--format');
const at = opt('--at');
if (format && !CFG.formats?.[format]) throw new Error(`unknown format ${format}`);
const frames = IDS.map((id) => {
  const lead = leadOf(id);
  const fr = at !== undefined ? lead + (narrEnd(id) - lead) * Number(at) : narrEnd(id) - 20;
  return starts[id] + Math.round(fr);
});
const labels = IDS.map((id) => `${id} ${T[id].chapter.split(' · ').pop()}`);
const portrait = format && CFG.formats[format].height > CFG.formats[format].width;
const cols = portrait ? Math.min(IDS.length, 5) : Math.ceil(Math.sqrt(IDS.length));
const inputProps = {frames, labels, cols, format};
const id = `${CFG.id}-strip`;
const {serveUrl} = await open(id, inputProps);
const composition = await selectComposition({serveUrl, id, inputProps, browserExecutable});
const outDir = path.join(root, 'out');
fs.mkdirSync(outDir, {recursive: true});
const output = path.join(outDir, `overview${format ? `_${format}` : ''}.png`);
await renderStill({composition, serveUrl, output, inputProps, browserExecutable});
console.log(output);
