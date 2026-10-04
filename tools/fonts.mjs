// npm run fonts — download the variable fonts named in kit.config.json into public/fonts/ (gitignored).
// Noto Sans SC / Noto Serif SC are under the SIL Open Font License. Without them the font stacks fall back to system fonts.
import fs from 'node:fs';
import path from 'node:path';
import {CFG, root} from './timeline.mjs';

const dir = path.join(root, 'public/fonts');
fs.mkdirSync(dir, {recursive: true});
for (const [slot, f] of Object.entries(CFG.fonts)) {
  if (!f.url || !f.file) continue;
  const dest = path.join(dir, f.file);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
    console.log(`${slot}: ${f.file} already present`);
    continue;
  }
  process.stdout.write(`${slot}: downloading ${f.url} ... `);
  const res = await fetch(f.url, {redirect: 'follow'});
  if (!res.ok) throw new Error(`${f.url} → HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
  console.log(`${(buf.length / 1e6).toFixed(1)} MB → public/fonts/${f.file}`);
}
