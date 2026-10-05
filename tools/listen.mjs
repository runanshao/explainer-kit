// Hear without speakers: render a scene's audio and list where sounds happen, relative to the cues.
// usage: node tools/listen.mjs s05              → whole scene
//        node tools/listen.mjs s05:block s05:out → from one spot to another (scene:cue[:offset])
// output: out/listen/<scene>.wav and a timeline like  "block+2   0.95s  ▇▇▇▇▇"
// With --mock timings the narration is silent, so every event listed is a sound effect or the music pulse.
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {renderMedia, selectComposition} from '@remotion/renderer';
import {CFG, FPS, browserExecutable, nearestCue, open, parseSpot, root, sceneLen, starts} from './timeline.mjs';

const [a, b] = process.argv.slice(2);
if (!a) {
  console.error('usage: node tools/listen.mjs scene[:cue[:offset]] [scene:cue[:offset]]');
  process.exit(1);
}
const from = a.includes(':') ? parseSpot(a) : {id: a, frame: starts[a]};
if (!(from.id in starts)) throw new Error(`unknown scene ${a}`);
const to = b ? parseSpot(b) : {id: from.id, frame: starts[from.id] + sceneLen(from.id) - 1};
const outDir = path.join(root, 'out/listen');
fs.mkdirSync(outDir, {recursive: true});
const output = path.join(outDir, `${from.id}.wav`);
const {serveUrl} = await open(CFG.id);
const composition = await selectComposition({serveUrl, id: CFG.id, browserExecutable});
await renderMedia({composition, serveUrl, codec: 'wav', outputLocation: output, frameRange: [from.frame, to.frame], browserExecutable, logLevel: 'error'});

// ffmpeg: where is it not silent?
// (silencedetect reports on stderr)
const err = spawnSync('ffmpeg', ['-hide_banner', '-i', output, '-af', 'silencedetect=noise=-45dB:d=0.12', '-f', 'null', '-'], {encoding: 'utf8'}).stderr;
const marks = [...err.matchAll(/silence_(start|end): ([\d.]+)/g)].map((m) => [m[1], Number(m[2])]);
const events = [];
let soundFrom = 0;
let inSound = true;
for (const [kind, t] of marks) {
  if (kind === 'start' && inSound) {
    if (t - soundFrom > 0.02) events.push([soundFrom, t]);
    inSound = false;
  } else if (kind === 'end') {
    soundFrom = t;
    inSound = true;
  }
}
const dur = (to.frame - from.frame) / FPS;
if (inSound && dur - soundFrom > 0.02) events.push([soundFrom, dur]);
console.log(`${output}  ${dur.toFixed(2)}s`);
for (const [s, e] of events) {
  const local = from.frame - starts[from.id] + Math.round(s * FPS);
  console.log(`  ${nearestCue(from.id, local).padEnd(14)} ${s.toFixed(2)}s  ${'▇'.repeat(Math.max(1, Math.round((e - s) * 10)))}`);
}
if (!events.length) console.log('  (silent)');
