// The whole publish pipeline in one command: narration → render → score → mix, for every format you ask for.
// usage: node tools/publish.mjs                     → real edge-tts, main format, out/<id>-mixed.mp4
//        node tools/publish.mjs --formats 9x16,1x1  → also the portrait / square cuts (or --formats all)
//        node tools/publish.mjs --skip-tts          → keep the current audio + timings (e.g. after a visual-only edit)
//        node tools/publish.mjs --mock              → offline timings and silent narration (pipeline check)
//        node tools/publish.mjs --no-verify         → skip the delivery gate (tools/verify.mjs) before rendering
// Long renders: run it detached and watch the log (see README 踩过的坑), e.g.
//        nohup node tools/publish.mjs --formats all > out/publish.log 2>&1 &
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const CFG = JSON.parse(fs.readFileSync(path.join(root, 'kit.config.json'), 'utf8'));
const argv = process.argv.slice(2);
const has = (k) => argv.includes(k);
const opt = (k) => {
  const i = argv.indexOf(k);
  return i >= 0 ? argv[i + 1] : undefined;
};
const all = Object.keys(CFG.formats ?? {});
const fmts = opt('--formats') === 'all' ? all : (opt('--formats') ?? '').split(',').filter(Boolean);
for (const f of fmts) {
  if (!all.includes(f)) {
    console.error(`unknown format "${f}"; kit.config.json has: ${all.join(', ')}`);
    process.exit(1);
  }
}
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

if (!has('--skip-tts')) run('narration', py, ['tts/gen.py', ...(has('--mock') ? ['--mock'] : [])]);
// same gate every time: a broken scene or a non-deterministic frame stops here, not 40 minutes into a render
if (!has('--no-verify')) run('verify', 'node', ['tools/verify.mjs']);
for (const f of [undefined, ...fmts]) run(`render ${f ?? 'main'}`, 'node', ['tools/render.mjs', ...(f ? [f] : [])]);
run('score', py, ['tools/music.py']);
for (const f of [undefined, ...fmts]) run(`mix ${f ?? 'main'}`, py, ['tools/mix.py', ...(f ? [f] : [])]);

console.log(`\ndone in ${((Date.now() - t0) / 60000).toFixed(1)} min:`);
for (const f of [undefined, ...fmts]) console.log(`  out/${CFG.id}${f ? `-${f}` : ''}-mixed.mp4`);
