/** Paper style pack: hand-drawn notebook — cream grid paper, pen strokes that draw on and boil, sticky notes. Delete this folder if unused. */
import React from 'react';
import {AbsoluteFill, interpolate, staticFile, useCurrentFrame} from 'remotion';
import type {ChapterProps, Look} from '../core/look';
import {Svg} from '../core/layout';
import {drift, rng, springAt, tween} from '../core/motion';
import {FONT} from '../core/theme';
import {P} from './palette';
import {RoughBox, Squiggle} from './rough';

export {P} from './palette';
export * from './rough';

/** Cream grid paper. The fibre texture jumps every few frames, like a stop-motion camera over real paper. */
export const PaperGround: React.FC = () => {
  const f = useCurrentFrame();
  const r = rng(Math.floor(f / 4) + 5);
  return (
    <AbsoluteFill style={{background: P.ground}}>
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${P.grid} 1.5px, transparent 1.5px), linear-gradient(90deg, ${P.grid} 1.5px, transparent 1.5px)`,
          backgroundSize: '48px 48px',
          backgroundPosition: '-1px -1px',
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage: `url(${staticFile('fx/paper.png')})`,
          backgroundPosition: `${Math.floor(r() * 300)}px ${Math.floor(r() * 300)}px`,
          mixBlendMode: 'multiply',
          opacity: 0.16,
        }}
      />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 80% 75% at 50% 45%, transparent 55%, rgba(90,70,40,0.12) 100%)'}} />
    </AbsoluteFill>
  );
};

/** Hand-lettered text: ink colour, a hair of rotation. */
export const Hand: React.FC<{children: React.ReactNode; size?: number; color?: string; rot?: number; serif?: boolean; style?: React.CSSProperties}> = ({
  children,
  size = 56,
  color = P.ink,
  rot = -1,
  serif = true,
  style,
}) => (
  <div style={{fontFamily: serif ? FONT.serif : FONT.sans, fontSize: size, fontWeight: 800, color, lineHeight: 1.3, transform: `rotate(${rot}deg)`, ...style}}>
    {children}
  </div>
);

/** Highlighter swipe behind inline text, swept from frame `at` (scene frames). */
export const Marker: React.FC<{at: number; children: React.ReactNode; color?: string}> = ({at, children, color = P.highlight}) => {
  const f = useCurrentFrame();
  const p = tween(f, at, 12, 'inOut');
  return (
    <span style={{position: 'relative', display: 'inline-block'}}>
      <span
        style={{
          position: 'absolute',
          left: -8,
          top: '30%',
          height: '62%',
          width: `calc(${p * 100}% + 16px)`,
          background: color,
          borderRadius: '6px 14px 8px 12px',
          transform: 'rotate(-1.2deg)',
          mixBlendMode: 'multiply',
        }}
      />
      <span style={{position: 'relative'}}>{children}</span>
    </span>
  );
};

/**
 * Sticky note centred on (x, y) that drops onto the page at frame `at` (scene frames) with a little bounce,
 * then sways gently. Leaves (peels up and away) at `out` if given.
 */
export const Note: React.FC<{
  at: number;
  out?: number;
  x: number;
  y: number;
  w?: number;
  h?: number;
  rot?: number;
  color?: string;
  seed?: number;
  children?: React.ReactNode;
}> = ({at, out, x, y, w = 300, h = 260, rot = -3, color = P.noteYellow, seed = 1, children}) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const s = springAt(f, at, 'bouncy');
  const q = out === undefined ? 0 : tween(f, out, 14, 'in');
  const lift = 1 - Math.min(1, s);
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        height: h,
        marginLeft: -w / 2,
        marginTop: -h / 2,
        transform: `translateY(${-lift * 50 - q * 120}px) rotate(${rot + lift * 10 + q * 12}deg) scale(${1.25 - 0.25 * s + q * 0.1}) ${drift(f, seed, 2, 0.6)}`,
        opacity: Math.min(1, s * 3) * (1 - q),
        background: `linear-gradient(170deg, ${color} 0%, ${color} 80%, rgba(0,0,0,0.04) 100%)`,
        boxShadow: `0 ${4 + lift * 30}px ${10 + lift * 40}px rgba(60,40,10,${0.25 - lift * 0.1})`,
        padding: 26,
        boxSizing: 'border-box',
        fontFamily: FONT.sans,
        color: P.ink,
      }}
    >
      <div style={{position: 'absolute', left: '50%', top: -14, width: 110, height: 30, marginLeft: -55, background: 'rgba(255,255,255,0.55)', transform: 'rotate(2deg)'}} />
      {children}
    </div>
  );
};

/** Chapter card: kicker in red pen, title lettered in, underline scribbled under it. */
export const PaperChapter: React.FC<ChapterProps> = ({f, lead, kicker, title}) => {
  const out = interpolate(f, [lead - 12, lead], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (out <= 0) return null;
  const p = tween(f, 2, 16);
  const w = Math.min(1500, 120 + title.length * 96);
  return (
    <AbsoluteFill style={{opacity: out}}>
      <PaperGround />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', gap: 26}}>
        <Hand size={34} color={P.red} rot={-2} serif={false} style={{letterSpacing: 8, opacity: p}}>
          {kicker}
        </Hand>
        <Hand size={96} rot={-1} style={{opacity: tween(f, 6, 14), transform: `rotate(-1deg) translateY(${(1 - tween(f, 6, 18)) * 20}px)`}}>
          {title}
        </Hand>
      </AbsoluteFill>
      <Svg>
        <Squiggle x={960 - w / 2} y={640} width={w} p={tween(f, 14, 18, 'inOut')} color={P.blue} w={6} />
      </Svg>
    </AbsoluteFill>
  );
};

/** Hand-drawn box with a label that's written in once the outline is mostly drawn (inside <Svg>). */
export const LabelBox: React.FC<{
  x: number;
  y: number;
  width: number;
  height: number;
  p: number;
  label: React.ReactNode;
  color?: string;
  textColor?: string;
  fill?: string;
  seed?: number;
  size?: number;
}> = ({x, y, width, height, p, label, color = P.ink, textColor = P.ink, fill, seed = 1, size = 44}) => (
  <g>
    <RoughBox x={x} y={y} width={width} height={height} p={p} color={color} fill={fill} seed={seed} />
    <foreignObject x={x} y={y} width={width} height={height}>
      <div
        style={{
          width,
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: FONT.serif,
          fontWeight: 800,
          fontSize: size,
          color: textColor,
          opacity: Math.max(0, (p - 0.55) * 2.5),
          transform: `rotate(${(rng(seed)() - 0.5) * 3}deg) translateY(${Math.max(0, 1 - (p - 0.55) * 2.5) * 8}px)`,
        }}
      >
        {label}
      </div>
    </foreignObject>
  </g>
);

/** Cream notebook ground, hand-drawn chapter card, dark pill karaoke subtitles. */
export const paper: Look = {
  base: P.ground,
  background: PaperGround,
  chapter: PaperChapter,
  subtitles: {bottom: 54, box: true, karaoke: true, size: 38, color: '#F7F2E6', boxColor: 'rgba(42,40,51,0.88)', quoteColor: '#FFD95A', dim: 0.5},
};
