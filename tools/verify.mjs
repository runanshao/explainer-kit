// Delivery gate: the same checks before every hand-off, so output is reproducible and stable, not lucky.
// usage: node tools/verify.mjs            → everything below
//        node tools/verify.mjs --quick    → only 1–2 (no rendering)
//
// 1. types        npx tsc --noEmit
// 2. sources      pytest: script.json ↔ timings.json ↔ audio ↔ scene registry ↔ sound library, parser rules
// 3. every scene  renders at its start, middle and end in every format (a missing cue/word throws here, not mid-render)
// 4. determinism  the same frames rendered twice are byte-identical (no Math.random, no clock, no leftover state)
// Writes out/verify/*.png for a look; exits non-zero on the first failing stage.
import {spawnSync} from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {renderStill, selectComposition} from '@remotion/renderer';
import {CFG, IDS, browserExecutable, leadOf, narrEnd, open, root, starts} from './timeline.mjs';

const quick = process.argv.includes('--quick');
const outDir = path.join(root, 'out/verify');
fs.mkdirSync(outDir, {recursive: true});
const py = spawnSync('python', ['--version']).status === 0 ? 'python' : 'python3';
const results = [];
const stage = async (name, fn) => {
  const t = Date.now();
  console.log(`▶ ${name}`);
  try {
    const note = await fn();
    results.push([name, true, note ?? '']);
    console.log(`  ✔ ${((Date.now() - t) / 1000).toFixed(0)} s${note ? `  ${note}` : ''}`);
  } catch (e) {
    results.push([name, false, String(e.message ?? e)]);
    console.log(`  ✖ ${e.message ?? e}`);
    summary();
    process.exit(1);
  }
};
const run = (cmd, args) => {
  const r = spawnSync(cmd, args, {cwd: root, encoding: 'utf8', shell: process.platform === 'win32'});
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(' ')} failed:\n${(r.stdout ?? '') + (r.stderr ?? '')}`.trim());
  return r.stdout ?? '';
};
const summary = () => {
  console.log('\nverify:');
  for (const [n, ok, note] of results) console.log(`  ${ok ? '✔' : '✖'} ${n}${note && ok ? `  (${note})` : ''}`);
};

await stage('1 types', () => {
  run('npx', ['tsc', '--noEmit']);
});
await stage('2 sources', () => {
  const out = run(py, ['-m', 'pytest', '-q']);
  return out.trim().split('\n').pop();
});

if (!quick) {
  const spots = IDS.flatMap((id) => {
    const a = leadOf(id);
    const b = narrEnd(id);
    return [a, Math.round((a + b) / 2), b - 1].map((fr) => starts[id] + fr);
  });
  const labels = IDS.flatMap((id) => ['start', 'mid', 'end'].map((k) => `${id} ${k}`));
  const id = `${CFG.id}-strip`;
  const {serveUrl} = await open(id, {frames: [0]});
  const still = async (inputProps, output) => {
    const composition = await selectComposition({serveUrl, id, inputProps, browserExecutable});
    await renderStill({composition, serveUrl, output, inputProps, browserExecutable});
    return output;
  };

  for (const fmt of [undefined, ...Object.keys(CFG.formats ?? {})]) {
    await stage(`3 every scene renders${fmt ? ` (${fmt})` : ''}`, async () => {
      // chunks of 12 tiles keep each image readable
      for (let i = 0, k = 0; i < spots.length; i += 12, k++) {
        const frames = spots.slice(i, i + 12);
        const cols = fmt && CFG.formats[fmt].height > CFG.formats[fmt].width ? 6 : 4;
        await still({frames, labels: labels.slice(i, i + 12), cols, format: fmt}, path.join(outDir, `scenes${fmt ? `_${fmt}` : ''}_${k}.png`));
      }
      return `${IDS.length} scenes × 3 frames`;
    });
  }

  await stage('4 determinism', async () => {
    // one frame mid-narration per scene, rendered twice in separate passes
    const frames = IDS.map((id) => starts[id] + Math.round((leadOf(id) + narrEnd(id)) / 2));
    const hash = async (tag) => {
      const p = await still({frames, cols: 4}, path.join(outDir, `det_${tag}.png`));
      return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
    };
    const [a, b] = [await hash('a'), await hash('b')];
    if (a !== b) throw new Error('the same frames rendered differently twice — look for Math.random(), Date, or state kept between frames (out/verify/det_a.png vs det_b.png)');
    return 'identical';
  });
}

summary();
console.log(quick ? '\n(quick: rendering skipped)' : `\nimages: ${path.relative(root, outDir)}/`);
