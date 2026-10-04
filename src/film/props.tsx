/** Generic sets and props for the film pack: backdrops, a typed document, an ink bar chart, a counter. */
import React from 'react';
import {interpolate} from 'remotion';
import {HEIGHT, WIDTH} from '../config';
import {C, FONT} from '../core/theme';
import {ease, lerp} from '../core/timeline';
import {Mark, Paper, clamp01} from './film';

/** Vertical sky gradient filling the frame (inside <Svg>). `stops` are [offset 0..1, colour]. */
export const Sky: React.FC<{id: string; stops: [number, string][]}> = ({id, stops}) => (
  <>
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        {stops.map(([o, c]) => (
          <stop key={o} offset={`${o * 100}%`} stopColor={c} />
        ))}
      </linearGradient>
    </defs>
    <rect x={-200} y={-200} width={WIDTH + 400} height={HEIGHT + 400} fill={`url(#${id})`} />
  </>
);

/** Soft radial light (inside <Svg>). */
export const Glow: React.FC<{x: number; y: number; r: number; color?: string; op?: number}> = ({x, y, r, color = '#ffd690', op = 1}) => {
  const id = `glow-${color.replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <>
      <defs>
        <radialGradient id={id}>
          <stop offset="0%" stopColor="#fff6e0" stopOpacity="1" />
          <stop offset="30%" stopColor={color} stopOpacity="0.55" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={x} cy={y} r={r} fill={`url(#${id})`} opacity={op} />
    </>
  );
};

/** Black void with a soft spotlight — the backdrop for quotes and title beats. */
export const Void: React.FC<{tint?: string; x?: number; y?: number}> = ({tint = 'rgba(255,220,170,0.12)', x = 50, y = 35}) => (
  <div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse 50% 55% at ${x}% ${y}%, ${tint}, transparent 75%), #060606`}} />
);

/** Overhead dark-wood desk with a pool of lamp light: backdrop for paper props. */
export const Desk: React.FC<{tone?: 'warm' | 'cold'; lx?: number; ly?: number}> = ({tone = 'warm', lx = 50, ly = 45}) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      background:
        tone === 'warm'
          ? `radial-gradient(ellipse 60% 70% at ${lx}% ${ly}%, rgba(255,200,130,0.28), transparent 70%), repeating-linear-gradient(92deg, #2a1d14 0px, #2f2117 7px, #261a12 15px, #2c1f15 26px), #22170f`
          : `radial-gradient(ellipse 60% 70% at ${lx}% ${ly}%, rgba(170,200,255,0.2), transparent 70%), repeating-linear-gradient(92deg, #161a20 0px, #1a1f26 7px, #14181d 15px, #191d24 26px), #12151a`,
    }}
  />
);

export type DocRow = {k: React.ReactNode; v?: string; at?: number; mark?: boolean; strike?: boolean};

/** Typed document: title, optional kicker, rows revealed one by one (each row's `at`, else staggered from `at`). */
export const Doc: React.FC<{
  t: number;
  at?: number;
  x: number;
  y: number;
  w: number;
  rot?: number;
  title: string;
  kicker?: string;
  rows?: DocRow[];
  size?: number;
  children?: React.ReactNode;
  tone?: string;
}> = ({t, at = 0, x, y, w, rot = 0, title, kicker, rows = [], size = 34, children, tone}) => (
  <Paper t={t} at={at} x={x} y={y} w={w} rot={rot} tone={tone}>
    {kicker ? <div style={{fontFamily: FONT.sans, fontSize: 20, letterSpacing: 6, color: '#7a6a50', marginBottom: 10}}>{kicker}</div> : null}
    <div style={{fontSize: size * 1.25, fontWeight: 900, letterSpacing: 3, borderBottom: `2px solid ${C.paperInk}`, paddingBottom: 14, marginBottom: 18}}>{title}</div>
    {rows.map((r, i) => {
      const rowAt = r.at ?? at + 10 + i * 8;
      const p = ease(t, rowAt, 12);
      return (
        <div
          key={i}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 24,
            fontSize: size,
            margin: '12px 0',
            opacity: p,
            transform: `translateX(${(1 - p) * -14}px)`,
            textDecoration: r.strike ? 'line-through' : undefined,
          }}
        >
          <span>{r.mark ? <Mark t={t} at={rowAt + 8}>{r.k}</Mark> : r.k}</span>
          {r.v ? <span style={{fontWeight: 800, fontVariantNumeric: 'tabular-nums'}}>{r.v}</span> : null}
        </div>
      );
    })}
    {children}
  </Paper>
);

/** Ink bar chart (put it on a Paper or Doc). Bars grow from frame `at`, staggered. */
export const InkBars: React.FC<{t: number; at: number; rows: {k: string; v: number; label: string; color: string}[]; max: number; w?: number; size?: number}> = ({
  t,
  at,
  rows,
  max,
  w = 560,
  size = 30,
}) => (
  <div>
    {rows.map((r, i) => {
      const p = ease(t, at + i * 8, 24);
      return (
        <div key={i} style={{display: 'flex', alignItems: 'center', gap: 16, margin: '14px 0', fontSize: size}}>
          <div style={{width: 150, textAlign: 'right', fontWeight: 700}}>{r.k}</div>
          <div style={{width: w, height: size * 0.9, position: 'relative'}}>
            <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: (w * r.v * p) / max, background: r.color, borderRadius: 3, opacity: 0.85}} />
          </div>
          <div style={{width: 120, fontWeight: 900, opacity: clamp01(p * 2)}}>{r.label}</div>
        </div>
      );
    })}
  </div>
);

/** Number that counts from `from` to `to` starting at frame `at`. */
export const Count: React.FC<{t: number; at: number; dur?: number; from?: number; to: number; digits?: number; prefix?: string; suffix?: string; style?: React.CSSProperties}> = ({
  t,
  at,
  dur = 30,
  from = 0,
  to,
  digits = 0,
  prefix = '',
  suffix = '',
  style,
}) => {
  const p = interpolate(t, [at, at + dur], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: (x) => 1 - Math.pow(1 - x, 3)});
  const v = lerp(p, from, to);
  return (
    <span style={{fontVariantNumeric: 'tabular-nums', ...style}}>
      {prefix}
      {v.toLocaleString('en-US', {minimumFractionDigits: digits, maximumFractionDigits: digits})}
      {suffix}
    </span>
  );
};
