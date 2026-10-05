/**
 * Hand-drawn strokes for the paper pack. Every shape is a jittered path that draws itself on (p: 0→1),
 * is stroked twice like a real pen going over it, and "boils" — re-jitters slightly every few frames —
 * so finished drawings stay alive the way hand-drawn animation does.
 */
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {clamp01, rng} from '../core/motion';
import {P} from './palette';

type Pt = [number, number];

/** frames per boil step (classic animation on fours); 0 disables boiling */
export const BOIL = 4;
const useBoil = (seed: number, on = true) => {
  const f = useCurrentFrame();
  return on && BOIL > 0 ? seed + Math.floor(f / BOIL) * 7 : seed;
};

/** Catmull-Rom spline through points → SVG path */
const spline = (pts: Pt[]) => {
  if (pts.length < 2) return '';
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
};

const jitter = (pts: Pt[], seed: number, amp: number): Pt[] => {
  const r = rng(seed);
  return pts.map(([x, y]) => [x + (r() - 0.5) * 2 * amp, y + (r() - 0.5) * 2 * amp]);
};

/** points along a segment, bowed sideways by `bow` px at the middle */
const seg = (a: Pt, b: Pt, n: number, bow: number): Pt[] => {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const nx = -(b[1] - a[1]) / len;
  const ny = (b[0] - a[0]) / len;
  return Array.from({length: n + 1}, (_, i) => {
    const k = i / n;
    const s = Math.sin(k * Math.PI) * bow;
    return [a[0] + (b[0] - a[0]) * k + nx * s, a[1] + (b[1] - a[1]) * k + ny * s];
  });
};

/** a path that draws on with progress p (uses pathLength so any shape works) */
const Stroke: React.FC<{d: string; p: number; color: string; w: number; op?: number}> = ({d, p, color, w, op = 1}) =>
  p <= 0 ? null : (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={w}
      strokeLinecap="round"
      strokeLinejoin="round"
      pathLength={1}
      strokeDasharray="1 2"
      strokeDashoffset={1 - clamp01(p)}
      opacity={op}
    />
  );

type Common = {p: number; color?: string; w?: number; seed?: number; boil?: boolean};

/** wobbly straight line (inside <Svg>) */
export const RoughLine: React.FC<Common & {x1: number; y1: number; x2: number; y2: number; bow?: number}> = ({
  x1,
  y1,
  x2,
  y2,
  p,
  bow = 4,
  color = P.ink,
  w = 4,
  seed = 1,
  boil = true,
}) => {
  const s = useBoil(seed, boil);
  const base = seg([x1, y1], [x2, y2], 6, bow);
  return (
    <g>
      <Stroke d={spline(jitter(base, s, 2))} p={p} color={color} w={w} />
      <Stroke d={spline(jitter(base, s + 3, 2.6))} p={p * 1.1 - 0.1} color={color} w={w * 0.55} op={0.7} />
    </g>
  );
};

/** wobbly rectangle drawn in one continuous stroke that overshoots its start (inside <Svg>) */
export const RoughBox: React.FC<Common & {x: number; y: number; width: number; height: number; fill?: string}> = ({
  x,
  y,
  width,
  height,
  p,
  fill,
  color = P.ink,
  w = 4,
  seed = 1,
  boil = true,
}) => {
  const s = useBoil(seed, boil);
  const c: Pt[] = [
    [x, y],
    [x + width, y],
    [x + width, y + height],
    [x, y + height],
    [x + 14, y - 3],
  ];
  const pts: Pt[] = [];
  for (let i = 0; i < 4; i++) pts.push(...seg(c[i], c[i + 1], 4, (rng(seed + i)() - 0.5) * 6).slice(i ? 1 : 0));
  const r = rng(seed * 31);
  const fillOp = clamp01((p - 0.8) * 5);
  return (
    <g>
      {fill && fillOp > 0 ? (
        <rect x={x + 6 + r() * 6} y={y + 6 + r() * 6} width={width - 10} height={height - 10} fill={fill} opacity={fillOp} rx={6} />
      ) : null}
      <Stroke d={spline(jitter(pts, s, 2.2))} p={p} color={color} w={w} />
      <Stroke d={spline(jitter(pts, s + 5, 3))} p={p * 1.15 - 0.15} color={color} w={w * 0.5} op={0.6} />
    </g>
  );
};

/** hand-drawn loop around something — goes a bit past a full turn, like circling a word (inside <Svg>) */
export const RoughCircle: React.FC<Common & {cx: number; cy: number; rx: number; ry?: number}> = ({
  cx,
  cy,
  rx,
  ry = rx,
  p,
  color = P.red,
  w = 4,
  seed = 1,
  boil = true,
}) => {
  const s = useBoil(seed, boil);
  const r = rng(s);
  const n = 22;
  const a0 = -2.2;
  const pts: Pt[] = Array.from({length: n + 1}, (_, i) => {
    const a = a0 + (i / n) * Math.PI * 2.18;
    const k = 1 + (r() - 0.5) * 0.06 + (i / n) * 0.06;
    return [cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k];
  });
  return <Stroke d={spline(pts)} p={p} color={color} w={w} />;
};

/** curved arrow; the head is flicked on after the shaft is drawn (inside <Svg>) */
export const RoughArrow: React.FC<Common & {x1: number; y1: number; x2: number; y2: number; bow?: number; head?: number}> = ({
  x1,
  y1,
  x2,
  y2,
  p,
  bow = -30,
  head = 22,
  color = P.ink,
  w = 4,
  seed = 1,
  boil = true,
}) => {
  const s = useBoil(seed, boil);
  const pts = jitter(seg([x1, y1], [x2, y2], 8, bow), s, 1.6);
  const n = pts.length;
  const [ex, ey] = pts[n - 1];
  const [px, py] = pts[n - 2];
  const ang = Math.atan2(ey - py, ex - px);
  const hp = clamp01((p - 0.8) * 5);
  const wing = (da: number) => `M${ex},${ey} L${ex - head * Math.cos(ang + da)},${ey - head * Math.sin(ang + da)}`;
  return (
    <g>
      <Stroke d={spline(pts)} p={p / 0.85} color={color} w={w} />
      <Stroke d={wing(0.5)} p={hp * 2} color={color} w={w} />
      <Stroke d={wing(-0.5)} p={hp * 2 - 1} color={color} w={w} />
    </g>
  );
};

/** quick wavy underline (inside <Svg>) */
export const Squiggle: React.FC<Common & {x: number; y: number; width: number; amp?: number}> = ({
  x,
  y,
  width,
  p,
  amp = 6,
  color = P.red,
  w = 4,
  seed = 1,
  boil = true,
}) => {
  const s = useBoil(seed, boil);
  const n = Math.max(6, Math.round(width / 22));
  const pts: Pt[] = Array.from({length: n + 1}, (_, i) => [x + (i / n) * width, y + (i % 2 ? amp : -amp) * 0.6]);
  return <Stroke d={spline(jitter(pts, s, 1.5))} p={p} color={color} w={w} />;
};
