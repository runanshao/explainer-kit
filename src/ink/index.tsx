/** Ink style pack (水墨): rice paper, ink-wash mountains that bleed in through mist, brush strokes, vertical calligraphy, a red seal. Delete this folder if unused. */
import React from 'react';
import {AbsoluteFill, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {HEIGHT, WIDTH} from '../config';
import type {ChapterProps, Look} from '../core/look';
import {clamp01, noise, rng, tween} from '../core/motion';
import {FONT} from '../core/theme';

export const I = {
  paper: '#EFE6D3',
  ink: '#1B1A18',
  wash: '#5B5A55',
  mist: 'rgba(239,230,211,0.9)',
  seal: '#B3261E',
};

/** Rice paper: warm ground, fibre texture, soft darker edges. */
export const RicePaper: React.FC = () => (
  <AbsoluteFill style={{background: I.paper}}>
    <AbsoluteFill style={{backgroundImage: `url(${staticFile('fx/paper.png')})`, mixBlendMode: 'multiply', opacity: 0.28}} />
    <AbsoluteFill style={{background: 'radial-gradient(ellipse 85% 80% at 50% 45%, transparent 60%, rgba(120,95,60,0.18) 100%)'}} />
  </AbsoluteFill>
);

/** Shared SVG filters: rough ink edges and soft bleeding. Render once per <svg> that uses them. */
const InkDefs: React.FC<{id: string; rough?: number; seed?: number}> = ({id, rough = 6, seed = 3}) => (
  <defs>
    <filter id={`${id}-rough`} x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves={3} seed={seed} result="n" />
      <feDisplacementMap in="SourceGraphic" in2="n" scale={rough} xChannelSelector="R" yChannelSelector="G" />
    </filter>
    <filter id={`${id}-bleed`} x="-30%" y="-30%" width="160%" height="160%">
      <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves={4} seed={seed + 1} result="n" />
      <feDisplacementMap in="SourceGraphic" in2="n" scale={40} xChannelSelector="R" yChannelSelector="G" result="d" />
      <feGaussianBlur in="d" stdDeviation={6} />
    </filter>
  </defs>
);

/**
 * Ink-wash mountain range (full-frame SVG). Each layer bleeds in from the mist at its own frame:
 * blurred and faint first, then sharpening — like wet ink spreading into paper. Layers drift slowly.
 */
export const Mountains: React.FC<{layers: {at: number; base: number; amp: number; tone: number; seed: number}[]}> = ({layers}) => {
  const f = useCurrentFrame();
  return (
    <svg width={WIDTH} height={HEIGHT} style={{position: 'absolute', inset: 0}}>
      <InkDefs id="mtn" rough={10} />
      {layers.map((L, i) => {
        const p = tween(f, L.at, 40, 'out');
        if (p <= 0) return null;
        const drift = f * (0.06 + i * 0.05);
        let d = `M-40,${HEIGHT}`;
        for (let x = -40; x <= WIDTH + 40; x += 16) {
          const n = noise(L.seed, (x + drift) / 260) * 0.65 + noise(L.seed + 7, (x + drift) / 90) * 0.35;
          d += ` L${x},${(L.base - (n * 0.5 + 0.5) * L.amp).toFixed(1)}`;
        }
        d += ` L${WIDTH + 40},${HEIGHT} Z`;
        const gid = `mtn-g${i}`;
        return (
          <g key={i} opacity={p} style={{filter: `blur(${(1 - p) * 14 + (layers.length - 1 - i) * 0.6}px)`}}>
            <defs>
              <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={I.ink} stopOpacity={L.tone} />
                <stop offset="0.35" stopColor={I.wash} stopOpacity={L.tone * 0.55} />
                <stop offset="0.75" stopColor={I.paper} stopOpacity={0} />
              </linearGradient>
            </defs>
            <path d={d} fill={`url(#${gid})`} filter="url(#mtn-rough)" />
          </g>
        );
      })}
    </svg>
  );
};

/** A low band of mist that drifts across the frame. */
export const Mist: React.FC<{y: number; h?: number; op?: number}> = ({y, h = 220, op = 0.75}) => {
  const f = useCurrentFrame();
  return (
    <div
      style={{
        position: 'absolute',
        left: -1200 + ((f * 0.6) % 1200),
        top: y,
        width: WIDTH + 2400,
        height: h,
        background: `repeating-linear-gradient(90deg, rgba(239,230,211,${op * 0.35}) 0px, rgba(239,230,211,${op}) 600px, rgba(239,230,211,${op * 0.35}) 1200px)`,
        filter: 'blur(40px)',
      }}
    />
  );
};

/** One brush stroke along `d` (SVG path in frame pixels), swept on from `at` over `dur` frames. */
export const Brush: React.FC<{d: string; at: number; dur?: number; w?: number; color?: string; seed?: number}> = ({d, at, dur = 16, w = 46, color = I.ink, seed = 5}) => {
  const f = useCurrentFrame();
  const p = tween(f, at, dur, 'inOut');
  if (p <= 0) return null;
  const id = `brush${seed}`;
  return (
    <svg width={WIDTH} height={HEIGHT} style={{position: 'absolute', inset: 0}}>
      <InkDefs id={id} rough={14} seed={seed} />
      <g filter={`url(#${id}-rough)`}>
        <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" pathLength={1} strokeDasharray="1 2" strokeDashoffset={1 - p} opacity={0.92} />
        {/* dry-brush streaks along the stroke */}
        {[-0.32, -0.1, 0.18, 0.36].map((o, i) => (
          <path key={i} d={d} fill="none" stroke={I.paper} strokeWidth={w * 0.06} transform={`translate(0 ${o * w})`} pathLength={1} strokeDasharray="1 2" strokeDashoffset={1 - clamp01(p * 1.1 - 0.15 - i * 0.05)} opacity={0.6} />
        ))}
      </g>
    </svg>
  );
};

/** Ink drop that spreads into the paper from `at` (centre x, y; final radius r). */
export const InkBlot: React.FC<{x: number; y: number; r: number; at: number; dur?: number; op?: number; seed?: number}> = ({x, y, r, at, dur = 30, op = 0.85, seed = 2}) => {
  const f = useCurrentFrame();
  const p = tween(f, at, dur, 'expo');
  if (p <= 0) return null;
  const id = `blot${seed}`;
  return (
    <svg width={WIDTH} height={HEIGHT} style={{position: 'absolute', inset: 0}}>
      <InkDefs id={id} seed={seed} />
      <circle cx={x} cy={y} r={r * p} fill={I.ink} opacity={op} filter={`url(#${id}-bleed)`} />
    </svg>
  );
};

/** Distant ink birds that keep flying across. */
export const Birds: React.FC<{n?: number; at?: number}> = ({n = 4, at = 0}) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const r = rng(11);
  return (
    <svg width={WIDTH} height={HEIGHT} style={{position: 'absolute', inset: 0}}>
      {Array.from({length: n}, (_, i) => {
        const sx = r() * 400;
        const sy = 160 + r() * 140;
        const x = -60 + sx + (f - at) * (1.4 + i * 0.25);
        const y = sy + Math.sin((f + i * 20) / 30) * 10;
        const flap = Math.sin((f + i * 7) / 4) * 6;
        const s = 0.7 + r() * 0.5;
        return <path key={i} d={`M${x - 14 * s},${y - flap * s} Q${x - 6 * s},${y - 4 * s} ${x},${y} Q${x + 6 * s},${y - 4 * s} ${x + 14 * s},${y - flap * s}`} fill="none" stroke={I.ink} strokeWidth={3} strokeLinecap="round" opacity={0.8} />;
      })}
    </svg>
  );
};

/** Vertical calligraphy: columns read top to bottom, right to left. Put <Spoken> inside to ink it as it's said. */
export const VText: React.FC<{children: React.ReactNode; size?: number; height?: number; color?: string; style?: React.CSSProperties}> = ({children, size = 84, height, color = I.ink, style}) => (
  <div
    style={{
      writingMode: 'vertical-rl',
      fontFamily: FONT.serif,
      fontWeight: 900,
      fontSize: size,
      lineHeight: 1.5,
      letterSpacing: size * 0.12,
      color,
      height,
      ...style,
    }}
  >
    {children}
  </div>
);

/** Square red seal with characters cut in white; stamps down at `at`. */
export const Seal: React.FC<{text: string; at: number; x: number; y: number; size?: number; rot?: number}> = ({text, at, x, y, size = 120, rot = -3}) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const k = f - at;
  const s = interpolate(k, [0, 5, 9], [1.6, 0.95, 1], {extrapolateRight: 'clamp'});
  const op = interpolate(k, [0, 4], [0, 0.92], {extrapolateRight: 'clamp'});
  const chars = text.split('');
  const half = Math.ceil(chars.length / 2);
  // seal text reads right column first
  const cols = chars.length > 2 ? [chars.slice(0, half), chars.slice(half)] : [chars];
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: size,
        height: size,
        transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${s})`,
        opacity: op,
        background: I.seal,
        borderRadius: 8,
        display: 'flex',
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'center',
        gap: size * 0.04,
        padding: size * 0.08,
        boxSizing: 'border-box',
        fontFamily: FONT.serif,
        fontWeight: 900,
        color: I.paper,
        fontSize: chars.length > 2 ? size * 0.36 : size * 0.42,
        lineHeight: 1.05,
        mixBlendMode: 'multiply',
        maskImage: `url(${staticFile('fx/grain1.png')})`,
        WebkitMaskImage: `url(${staticFile('fx/grain1.png')})`,
        maskSize: '200px',
        WebkitMaskSize: '200px',
      }}
    >
      {cols.map((col, i) => (
        <div key={i} style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          {col.map((ch, j) => (
            <span key={j}>{ch}</span>
          ))}
        </div>
      ))}
    </div>
  );
};

/** Chapter card: an ink drop spreads, the title is written vertically beside it, kicker in red. */
export const InkChapter: React.FC<ChapterProps> = ({f, lead, kicker, title}) => {
  const out = interpolate(f, [lead - 12, lead], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (out <= 0) return null;
  return (
    <AbsoluteFill style={{opacity: out}}>
      <RicePaper />
      <InkBlot x={860} y={520} r={190} at={0} dur={36} op={0.9} seed={8} />
      <div style={{position: 'absolute', left: 1040, top: 300, display: 'flex', gap: 30, alignItems: 'flex-start'}}>
        <VText size={110} style={{opacity: tween(f, 6, 16), filter: `blur(${(1 - tween(f, 6, 16)) * 8}px)`}}>
          {title}
        </VText>
        <VText size={34} color={I.seal} style={{opacity: tween(f, 2, 12), fontFamily: FONT.sans, fontWeight: 700}}>
          {kicker}
        </VText>
      </div>
    </AbsoluteFill>
  );
};

/** Rice paper ground, ink-drop chapter card, light paper subtitles. */
export const ink: Look = {
  base: I.paper,
  background: RicePaper,
  chapter: InkChapter,
  subtitles: {bottom: 50, box: true, karaoke: true, size: 36, color: I.ink, boxColor: 'rgba(239,230,211,0.88)', quoteColor: I.seal, dim: 0.35},
};
