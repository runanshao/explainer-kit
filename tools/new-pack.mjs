// Scaffold a style pack: palette (brand-aware), a ground that never stands still, a chapter card, a title and a card
// component, and the Look that dresses scenes — the parts every pack in src/ has.
// usage: node tools/new-pack.mjs chalk --base "#1F2B26" --accent "#F2C14E"
//   --base    ground colour (#rrggbb); text and subtitles pick dark or light ink from it
//   --accent  the pack's accent; kit.config.json "brand.accent" replaces it when set
// then: node tools/new-scene.mjs s10 --look chalk
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const argv = process.argv.slice(2);
const name = argv[0];
const opt = (k, d) => {
  const i = argv.indexOf(k);
  return i >= 0 ? argv[i + 1] : d;
};
if (!name || !/^[a-z][a-z0-9]*$/.test(name)) {
  console.error('usage: node tools/new-pack.mjs <name: lowercase letters/digits> [--base #rrggbb] [--accent #rrggbb]');
  process.exit(1);
}
const base = opt('--base', '#16181D');
const accent = opt('--accent', '#FF7A45');
for (const [k, v] of [['--base', base], ['--accent', accent]]) {
  if (!/^#[0-9a-fA-F]{6}$/.test(v)) {
    console.error(`${k} must be #rrggbb`);
    process.exit(1);
  }
}
const dir = path.join(root, 'src', name);
if (fs.existsSync(dir)) {
  console.error(`src/${name} already exists`);
  process.exit(1);
}
const lum = (c) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const light = lum(base) > 0.5;
const ink = light ? '#141414' : '#F4F1EA';
const sub = light ? '#6B6760' : '#9A968E';
const PAL = name.slice(0, 2).toUpperCase() + 'L';
const Cap = name.charAt(0).toUpperCase() + name.slice(1);

fs.mkdirSync(dir);
fs.writeFileSync(
  path.join(dir, 'index.tsx'),
  `/** ${Cap} style pack (scaffolded by tools/new-pack.mjs). Delete this folder if unused. */
import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import type {ChapterProps, Look} from '../core/look';
import {life, move, noise, tween} from '../core/motion';
import {FONT, themed} from '../core/theme';

/** palette; kit.config.json "brand.accent" replaces \`accent\`, "theme.${name}" overrides any key */
export const ${PAL} = themed(
  '${name}',
  {
    ground: '${base}',
    ink: '${ink}',
    sub: '${sub}',
    accent: '${accent}',
    line: '${light ? 'rgba(20,20,20,0.12)' : 'rgba(255,255,255,0.12)'}',
  },
  {accent: ['accent']},
);

/** The ground. Keep something moving here (a drifting light, a texture) so no frame is ever frozen. */
export const ${Cap}Ground: React.FC = () => {
  const f = useCurrentFrame();
  const x = 50 + noise(1, f * 0.004) * 25;
  const y = 40 + noise(2, f * 0.004) * 20;
  return (
    <AbsoluteFill style={{background: ${PAL}.ground}}>
      <AbsoluteFill style={{background: \`radial-gradient(ellipse 60% 55% at \${x}% \${y}%, \${${PAL}.accent}22, transparent 70%)\`}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 85% 80% at 50% 45%, transparent 55%, rgba(0,0,0,0.25) 100%)'}} />
    </AbsoluteFill>
  );
};

/** Big title that enters at \`at\` and (optionally) leaves at \`out\` (scene frames). */
export const Title: React.FC<{at: number; out?: number; children: React.ReactNode; size?: number; style?: React.CSSProperties}> = ({at, out, children, size = 96, style}) => {
  const f = useCurrentFrame();
  const {p, q} = life(f, at, out);
  return <div style={{fontFamily: FONT.sans, fontSize: size, fontWeight: 800, color: ${PAL}.ink, ...move('rise', p, q), ...style}}>{children}</div>;
};

/** A content card with an accent edge. */
export const Card: React.FC<{at: number; out?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({at, out, children, style}) => {
  const f = useCurrentFrame();
  const {p, q} = life(f, at, out);
  return (
    <div
      style={{
        padding: '28px 36px',
        borderRadius: 20,
        background: ${PAL}.line,
        borderLeft: \`6px solid \${${PAL}.accent}\`,
        fontFamily: FONT.sans,
        fontSize: 40,
        color: ${PAL}.ink,
        ...move('rise', p, q),
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** Chapter card shown during the lead-in. */
export const ${Cap}Chapter: React.FC<ChapterProps> = ({f, lead, kicker, title}) => {
  const out = interpolate(f, [lead - 10, lead], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (out <= 0) return null;
  return (
    <AbsoluteFill style={{opacity: out}}>
      <${Cap}Ground />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', gap: 18}}>
        <div style={{fontFamily: FONT.sans, fontSize: 28, letterSpacing: 8, color: ${PAL}.accent, opacity: tween(f, 0, 12)}}>{kicker}</div>
        <div style={{fontFamily: FONT.sans, fontSize: 92, fontWeight: 800, color: ${PAL}.ink, ...move('rise', tween(f, 4, 18))}}>{title}</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const ${name}: Look = {
  base: ${PAL}.ground,
  background: ${Cap}Ground,
  chapter: ${Cap}Chapter,
  subtitles: {bottom: 54, box: true, karaoke: true, size: 38, color: ${PAL}.ink, boxColor: '${light ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.6)'}', quoteColor: ${PAL}.accent, dim: 0.4},
};
`,
);
console.log(`created src/${name}/index.tsx  (palette ${PAL}, look \`${name}\`)
next: node tools/new-scene.mjs <id> --look ${name}   then open it in Studio and make the pack your own`);
