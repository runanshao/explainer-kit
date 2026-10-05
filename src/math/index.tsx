/** Math style pack: Manim-like derivations — a number plane that draws itself, curves traced on, a sliding tangent, TeX that transforms step by step. Delete this folder if unused. */
import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import type {ChapterProps, Look} from '../core/look';
import {clamp01, tween} from '../core/motion';
import {Tex} from '../core/Tex';
import {FONT, themed} from '../core/theme';

export const M = themed('math', {
  bg: '#0F1222',
  text: '#ECEFF4',
  dim: '#7D86A8',
  grid: 'rgba(88,196,221,0.14)',
  axis: '#C9D1E6',
  blue: '#58C4DD',
  yellow: '#F7D046',
  green: '#83C167',
  red: '#FC6255',
  purple: '#A88BE8',
}, {accent: ['yellow'], accent2: ['blue']});

/** Dark ground with a faint background grid, like Manim's NumberPlane behind everything. */
export const MathGround: React.FC = () => (
  <AbsoluteFill style={{background: M.bg}}>
    <AbsoluteFill
      style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
      }}
    />
    <AbsoluteFill style={{background: 'radial-gradient(ellipse 85% 80% at 50% 45%, transparent 55%, rgba(0,0,0,0.45) 100%)'}} />
  </AbsoluteFill>
);

/** A coordinate system: maths range [x0,x1]×[y0,y1] mapped onto a pixel box. */
export type Plane = {x0: number; x1: number; y0: number; y1: number; left: number; top: number; w: number; h: number};
export const px = (pl: Plane, x: number) => pl.left + ((x - pl.x0) / (pl.x1 - pl.x0)) * pl.w;
export const py = (pl: Plane, y: number) => pl.top + (1 - (y - pl.y0) / (pl.y1 - pl.y0)) * pl.h;

/** Grid, axes and tick labels (inside <Svg>). The grid fans out from the origin, then the axes draw. */
export const Axes: React.FC<{pl: Plane; at: number; step?: number; labels?: boolean}> = ({pl, at, step = 1, labels = true}) => {
  const f = useCurrentFrame();
  const g = tween(f, at, 24, 'out');
  const a = tween(f, at + 4, 22, 'inOut');
  const ox = px(pl, 0);
  const oy = py(pl, 0);
  const xs: number[] = [];
  for (let x = Math.ceil(pl.x0 / step) * step; x <= pl.x1 + 1e-9; x += step) xs.push(x);
  const ys: number[] = [];
  for (let y = Math.ceil(pl.y0 / step) * step; y <= pl.y1 + 1e-9; y += step) ys.push(y);
  return (
    <g>
      {xs.map((x, i) => {
        const k = clamp01(g * 1.6 - Math.abs(x) / (pl.x1 - pl.x0));
        return <line key={`gx${i}`} x1={px(pl, x)} y1={oy - (oy - pl.top) * k} x2={px(pl, x)} y2={oy + (pl.top + pl.h - oy) * k} stroke={M.grid} strokeWidth={2} />;
      })}
      {ys.map((y, i) => {
        const k = clamp01(g * 1.6 - Math.abs(y) / (pl.y1 - pl.y0));
        return <line key={`gy${i}`} x1={ox - (ox - pl.left) * k} y1={py(pl, y)} x2={ox + (pl.left + pl.w - ox) * k} y2={py(pl, y)} stroke={M.grid} strokeWidth={2} />;
      })}
      <line x1={ox - (ox - pl.left) * a} y1={oy} x2={ox + (pl.left + pl.w - ox) * a} y2={oy} stroke={M.axis} strokeWidth={3} />
      <line x1={ox} y1={oy + (pl.top + pl.h - oy) * a} x2={ox} y2={oy - (oy - pl.top) * a} stroke={M.axis} strokeWidth={3} />
      {labels
        ? xs
            .filter((x) => x !== 0)
            .map((x, i) => (
              <text key={`lx${i}`} x={px(pl, x)} y={oy + 34} textAnchor="middle" fontFamily={FONT.mono} fontSize={22} fill={M.dim} opacity={tween(f, at + 18 + i, 10)}>
                {x}
              </text>
            ))
        : null}
      {labels
        ? ys
            .filter((y) => y !== 0 && y % 2 === 0)
            .map((y, i) => (
              <text key={`ly${i}`} x={ox - 16} y={py(pl, y) + 8} textAnchor="end" fontFamily={FONT.mono} fontSize={22} fill={M.dim} opacity={tween(f, at + 18 + i, 10)}>
                {y}
              </text>
            ))
        : null}
    </g>
  );
};

const curvePath = (pl: Plane, fn: (x: number) => number, from: number, to: number, n = 160) => {
  let d = '';
  for (let i = 0; i <= n; i++) {
    const x = from + ((to - from) * i) / n;
    const y = Math.max(pl.y0 - 2, Math.min(pl.y1 + 2, fn(x)));
    d += `${i ? 'L' : 'M'}${px(pl, x).toFixed(1)},${py(pl, y).toFixed(1)}`;
  }
  return d;
};

/** Graph of fn traced on from left to right starting at `at` (inside <Svg>), with a glow like Manim strokes. */
export const Plot: React.FC<{pl: Plane; fn: (x: number) => number; at: number; dur?: number; color?: string; w?: number; from?: number; to?: number}> = ({
  pl,
  fn,
  at,
  dur = 40,
  color = M.blue,
  w = 6,
  from = pl.x0,
  to = pl.x1,
}) => {
  const f = useCurrentFrame();
  const p = tween(f, at, dur, 'inOut');
  if (p <= 0) return null;
  const d = curvePath(pl, fn, from, to);
  return (
    <g>
      <path d={d} fill="none" stroke={color} strokeWidth={w * 3} strokeOpacity={0.12} pathLength={1} strokeDasharray="1 2" strokeDashoffset={1 - p} strokeLinecap="round" />
      <path d={d} fill="none" stroke={color} strokeWidth={w} pathLength={1} strokeDasharray="1 2" strokeDashoffset={1 - p} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
};

/** A dot riding the curve at x, with the tangent line through it (inside <Svg>). */
export const Tangent: React.FC<{pl: Plane; fn: (x: number) => number; x: number; op?: number; len?: number; color?: string; dotColor?: string}> = ({
  pl,
  fn,
  x,
  op = 1,
  len = 2.4,
  color = M.yellow,
  dotColor = M.text,
}) => {
  const h = 1e-3;
  const k = (fn(x + h) - fn(x - h)) / (2 * h);
  const y = fn(x);
  // keep the visible length constant in maths units along the line
  const dx = len / 2 / Math.sqrt(1 + k * k);
  return (
    <g opacity={op}>
      <line x1={px(pl, x - dx)} y1={py(pl, y - k * dx)} x2={px(pl, x + dx)} y2={py(pl, y + k * dx)} stroke={color} strokeWidth={5} strokeLinecap="round" />
      <circle cx={px(pl, x)} cy={py(pl, y)} r={18} fill={dotColor} opacity={0.18} />
      <circle cx={px(pl, x)} cy={py(pl, y)} r={10} fill={dotColor} />
    </g>
  );
};

export type TexStep = {at: number; tex: string; color?: string};

/**
 * A derivation: each step slides in under the previous one; the newest step is lit, older ones dim.
 * With `replace`, each step takes the previous one's place instead (old slides up and fades out).
 */
export const Steps: React.FC<{steps: TexStep[]; size?: number; gap?: number; replace?: boolean}> = ({steps, size = 64, gap = 110, replace}) => {
  const f = useCurrentFrame();
  let cur = -1;
  steps.forEach((s, i) => {
    if (f >= s.at) cur = i;
  });
  return (
    <div style={{position: 'relative'}}>
      {steps.map((s, i) => {
        const p = tween(f, s.at, 18, 'out');
        if (p <= 0) return null;
        const next = steps[i + 1];
        const q = replace && next ? tween(f, next.at, 14, 'in') : 0;
        if (q >= 1) return null;
        const y = replace ? 0 : i * gap;
        const lit = i === cur;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 0,
              top: y,
              whiteSpace: 'nowrap',
              opacity: p * (1 - q) * (lit || replace ? 1 : 0.45),
              transform: `translateY(${(1 - p) * 30 - q * 40}px)`,
              filter: p < 1 ? `blur(${(1 - p) * 6}px)` : undefined,
            }}
          >
            <Tex tex={s.tex} size={size} color={lit ? (s.color ?? M.text) : M.text} />
          </div>
        );
      })}
    </div>
  );
};

/** Live numeric readout, e.g. a slope that changes as the point slides. */
export const Readout: React.FC<{label: string; value: number; digits?: number; color?: string; size?: number}> = ({label, value, digits = 2, color = M.yellow, size = 44}) => (
  <div style={{fontFamily: FONT.mono, fontSize: size, color: M.text, whiteSpace: 'nowrap'}}>
    <span style={{color: M.dim}}>{label} = </span>
    <span style={{color, fontVariantNumeric: 'tabular-nums'}}>{(value >= 0 ? ' ' : '') + value.toFixed(digits)}</span>
  </div>
);

/** Chapter card: centred serif title with a blue underline that draws out from the middle. */
export const MathChapter: React.FC<ChapterProps> = ({f, lead, kicker, title}) => {
  const out = interpolate(f, [lead - 10, lead], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (out <= 0) return null;
  const p = tween(f, 4, 20, 'inOut');
  return (
    <AbsoluteFill style={{opacity: out}}>
      <MathGround />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', gap: 20}}>
        <div style={{fontFamily: FONT.sans, fontSize: 28, letterSpacing: 10, color: M.blue, opacity: tween(f, 0, 12)}}>{kicker}</div>
        <div style={{fontFamily: FONT.serif, fontSize: 92, fontWeight: 700, color: M.text, opacity: tween(f, 2, 16)}}>{title}</div>
        <div style={{width: 520 * p, height: 4, background: M.blue, borderRadius: 2}} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Dark Manim ground, underline chapter card, quiet dark subtitles. */
export const math: Look = {
  base: M.bg,
  background: MathGround,
  chapter: MathChapter,
  subtitles: {bottom: 50, box: true, karaoke: true, size: 38, color: M.text, boxColor: 'rgba(15,18,34,0.82)', quoteColor: M.yellow, dim: 0.4},
};
