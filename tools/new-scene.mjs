// Scaffold a scene: narration entry, a working scene file, registry line, mock timings — in one go.
// usage: node tools/new-scene.mjs s10 --look paper --chapter "第十场 · 标题" --text "[[start]]……[[next]]……"
//   --look     a style pack folder under src/ (film slides paper neon editorial math keynote pixel ink, or your own)
//   --chapter  "kicker · title" for the chapter card (default "<id> · 新场景")
//   --text     narration with [[cue]] markers (default: a two-cue placeholder to overwrite in tts/script.json)
// The scene it writes already runs: one beat per cue, each phrase appearing as it is said, leaving on the next cue,
// with a pop on every cue. Replace those beats with your own visuals.
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const argv = process.argv.slice(2);
const id = argv[0];
const opt = (k, d) => {
  const i = argv.indexOf(k);
  return i >= 0 ? argv[i + 1] : d;
};
if (!id || id.startsWith('--') || !/^\w+$/.test(id)) {
  console.error('usage: node tools/new-scene.mjs <id> --look <pack> [--chapter "kicker · title"] [--text "[[a]]……"]');
  process.exit(1);
}
const look = opt('--look', 'slides');
const chapter = opt('--chapter', `${id} · 新场景`);
const text = opt('--text', '[[start]]这里写第一句旁白。[[next]]第二个画面从这个标记开始。');

const packFile = path.join(root, 'src', look, 'index.tsx');
if (!fs.existsSync(packFile) || !new RegExp(`export const ${look}: Look`).test(fs.readFileSync(packFile, 'utf8'))) {
  console.error(`no style pack "${look}" (expected src/${look}/index.tsx exporting \`const ${look}: Look\`)`);
  process.exit(1);
}

// 1. narration
const scriptPath = path.join(root, 'tts/script.json');
const script = JSON.parse(fs.readFileSync(scriptPath, 'utf8'));
if (script.scenes.some((s) => s.id === id)) {
  console.error(`${id} already exists in tts/script.json`);
  process.exit(1);
}
const cues = [...text.matchAll(/\[\[(\w+)\]\]/g)].map((m) => m[1]);
if (!cues.length) {
  console.error('the narration needs at least one [[cue]]');
  process.exit(1);
}
if (cues.includes('end')) {
  console.error('cue name "end" is reserved');
  process.exit(1);
}
script.scenes.push({id, chapter, text});
fs.writeFileSync(scriptPath, JSON.stringify(script, null, 2) + '\n');

// 2. one beat per cue: the first clause after it, exactly as spoken (so <Spoken> can find it)
const clean = (s) => s.replace(/\[\[\w+\]\]|\|\||<<\w+\||>>/g, '');
const parts = text.split(/\[\[\w+\]\]/).slice(1);
const beats = cues.map((cue, i) => {
  const said = clean(parts[i] ?? '').trim();
  const clause = (said.split(/[，。！？；：,.!?;:]/)[0] || said).slice(0, 14);
  return {cue, text: clause};
});
const Comp = id.charAt(0).toUpperCase() + id.slice(1);
const scenePath = path.join(root, 'src/scenes', `${id}.tsx`);
if (fs.existsSync(scenePath)) {
  console.error(`src/scenes/${id}.tsx already exists`);
  process.exit(1);
}
fs.writeFileSync(
  scenePath,
  `/** ${id} · ${chapter}. Scaffolded by tools/new-scene.mjs — replace the placeholder beats with your own visuals. */
import React from 'react';
import {Full, Sfx, Spoken, life, move, useScene} from '../core';
import {FONT, inkOn} from '../core/theme';
import {${look}} from '../${look}';

// each beat enters on its cue and leaves just before the next one; its text appears as it is said
const BEATS = ${JSON.stringify(beats, null, 2).replace(/"(\w+)":/g, '$1:')};

export const ${Comp}: React.FC = () => {
  const {f, c, end} = useScene();
  const ink = inkOn(${look}.base);
  return (
    <Full>
      {BEATS.map((b, i) => {
        const next = BEATS[i + 1];
        const {p, q} = life(f, c(b.cue), next ? c(next.cue) - 12 : end + 10);
        if (p <= 0 || q >= 1) return null;
        return (
          <div key={b.cue} style={{position: 'absolute', left: 0, right: 0, top: 420, textAlign: 'center', fontFamily: FONT.sans, fontSize: 96, fontWeight: 800, color: ink, ...move('rise', p, q)}}>
            <Spoken text={b.text} mode="rise" />
          </div>
        );
      })}
      {BEATS.map((b) => (
        <Sfx key={b.cue} at={c(b.cue)} name="pop" volume={0.6} />
      ))}
    </Full>
  );
};
`,
);

// 3. registry
const regPath = path.join(root, 'src/scenes/index.ts');
let reg = fs.readFileSync(regPath, 'utf8');
if (!new RegExp(`import \\{${look}\\} from '\\.\\./${look}';`).test(reg)) {
  reg = reg.replace(/(import type \{SceneDef\} from '\.\.\/core\/look';\n)/, `$1import {${look}} from '../${look}';\n`);
}
const sceneImports = [...reg.matchAll(/^import \{\w+\} from '\.\/\w+';$/gm)];
const lastImport = sceneImports[sceneImports.length - 1];
const importLine = `import {${Comp}} from './${id}';`;
reg = lastImport ? reg.slice(0, lastImport.index + lastImport[0].length) + `\n${importLine}` + reg.slice(lastImport.index + lastImport[0].length) : `${importLine}\n${reg}`;
reg = reg.replace(/\n};\s*$/, `\n  ${id}: {component: ${Comp}, look: ${look}},\n};\n`);
fs.writeFileSync(regPath, reg);

// 4. mock timings for just this scene
const py = spawnSync('python', ['--version']).status === 0 ? 'python' : 'python3';
const r = spawnSync(py, ['tts/gen.py', '--mock', id], {cwd: root, stdio: 'inherit'});
if (r.status !== 0) process.exit(r.status ?? 1);

console.log(`
created ${id}:
  tts/script.json        narration (edit the text, then: ${py} tts/gen.py --mock ${id})
  src/scenes/${id}.tsx    the scene (one placeholder beat per cue)
  src/scenes/index.ts    registered with look "${look}"
next: npm run studio, or  node tools/strip.mjs ${id}:${cues[0]}`);
