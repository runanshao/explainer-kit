// The promo in one command: check it reads on a phone → render the picture (with its scene sound effects) → write the
// score on the same beat grid → master to the loudness target → report → export the upload cover.
// The results are out/<promo id>-mixed.mp4 and out/<promo id>-cover.png (promo.json "cover").
// usage: node tools/promo.mjs              → everything
//        node tools/promo.mjs --skip-render → reuse out/<id>.mp4 (e.g. after changing only the score)
//        node tools/promo.mjs --no-verify   → skip the checks before rendering (types + sources, and the safe-area
//                                             sheet: tools/promo-sheet.mjs → out/promo/sheet.png)
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {renderStill} from '@remotion/renderer';
import {browserExecutable, open, root} from './timeline.mjs';
import {PROMO, coverFrame} from './promo-grid.mjs';

const argv = process.argv.slice(2);
const has = (k) => argv.includes(k);
const py = spawnSync('python', ['--version']).status === 0 ? 'python' : 'python3';
const t0 = Date.now();
const run = (label, cmd, args) => {
  const t = Date.now();
  console.log(`\n▶ ${label}: ${cmd} ${args.join(' ')}`);
  const r = spawnSync(cmd, args, {cwd: root, stdio: 'inherit', shell: process.platform === 'win32'});
  if (r.status !== 0) {
    console.error(`✖ ${label} failed (exit ${r.status})`);
    process.exit(r.status ?? 1);
  }
  console.log(`✔ ${label} (${((Date.now() - t) / 1000).toFixed(0)} s)`);
};

if (!has('--no-verify')) {
  run('verify (quick)', 'node', ['tools/verify.mjs', '--quick']);
  run('safe area', 'node', ['tools/promo-sheet.mjs']);
}
if (!has('--skip-render')) run('render', 'node', ['tools/render.mjs', 'promo']);
run('score', py, ['tools/score.py']);
run('master', py, ['tools/master.py', 'promo']);
const out = path.join('out', `${PROMO.id}-mixed.mp4`);
run('report', py, ['tools/audio-report.py', out, '--promo', '--target', String(PROMO.loudness?.target ?? -14)]);
{
  // platforms take the first frame as the cover unless you upload one: this is the one to upload
  const {serveUrl, composition} = await open(PROMO.id);
  const cover = path.join('out', `${PROMO.id}-cover.png`);
  await renderStill({composition, serveUrl, output: path.join(root, cover), frame: coverFrame(), browserExecutable, logLevel: 'error'});
  console.log(`✔ cover: ${cover} (frame ${coverFrame()}, promo.json "cover": ${PROMO.cover})`);
}
console.log(`\ndone in ${((Date.now() - t0) / 60000).toFixed(1)} min: ${out}  +  out/${PROMO.id}-cover.png`);
