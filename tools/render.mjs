// Render the film: node tools/render.mjs [format] [extra remotion args]
//   node tools/render.mjs            → out/<id>.mp4       (main width × height)
//   node tools/render.mjs 9x16       → out/<id>-9x16.mp4  (a format from kit.config.json "formats")
//   node tools/render.mjs promo      → out/<promo id>.mp4 (the beat-timed promo, promo/promo.json)
// Always uses --gl=angle (GPU compositing; software GL is ~5× slower). Extra args go straight to `remotion render`.
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {CFG, browserExecutable, root} from './timeline.mjs';

const args = process.argv.slice(2);
const format = args[0] && !args[0].startsWith('-') ? args.shift() : undefined;
const promoId = format === 'promo' ? JSON.parse(fs.readFileSync(path.join(root, 'promo/promo.json'), 'utf8')).id : undefined;
if (format && !promoId && !CFG.formats?.[format]) {
  console.error(`unknown format "${format}"; kit.config.json has: ${Object.keys(CFG.formats ?? {}).join(', ') || '(none)'}`);
  process.exit(1);
}
const id = promoId ?? (format ? `${CFG.id}-${format}` : CFG.id);
const out = path.join('out', `${id}.mp4`);
const cli = ['remotion', 'render', 'src/index.ts', id, out, '--gl=angle', ...(browserExecutable ? [`--browser-executable=${browserExecutable}`] : []), ...args];
console.log(`npx ${cli.join(' ')}`);
const r = spawnSync('npx', cli, {cwd: root, stdio: 'inherit', shell: process.platform === 'win32'});
process.exit(r.status ?? 1);
