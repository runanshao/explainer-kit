/** Diegetic props: newspapers, documents, photos, ledgers, scales, calendars. Data lives inside these. */
import React from 'react';
import {interpolate} from 'remotion';
import {C, FONT} from './theme';
import {Paper, e, mix, Mark, clamp01} from './film';

export const Newspaper: React.FC<{
  t: number;
  at?: number;
  x: number;
  y: number;
  w?: number;
  rot?: number;
  mast?: string;
  date: string;
  head: string;
  sub?: string;
  headSize?: number;
}> = ({t, at = 0, x, y, w = 760, rot = -3, mast = '晚 报', date, head, sub, headSize = 74}) => (
  <Paper t={t} at={at} x={x} y={y} w={w} rot={rot} tone="#e9e1cc" pad={36}>
    <div style={{textAlign: 'center', borderBottom: '3px double #2a241c', paddingBottom: 8, fontSize: 44, fontWeight: 900, letterSpacing: 18}}>{mast}</div>
    <div style={{fontFamily: FONT.sans, fontSize: 18, color: '#5a5040', margin: '8px 0 18px', display: 'flex', justifyContent: 'space-between'}}>
      <span>{date}</span>
      <span>第 1 版</span>
    </div>
    <div style={{fontSize: headSize, fontWeight: 900, lineHeight: 1.15, letterSpacing: 2}}>{head}</div>
    {sub ? <div style={{fontSize: 26, marginTop: 14, color: '#3a3226', fontWeight: 600}}>{sub}</div> : null}
    <div style={{display: 'flex', gap: 18, marginTop: 22}}>
      {[0, 1, 2].map((k) => (
        <div key={k} style={{flex: 1}}>
          {Array.from({length: 7}, (_, i) => (
            <div key={i} style={{height: 8, background: 'rgba(42,36,28,0.28)', margin: '9px 0', width: `${70 + ((i * 37 + k * 11) % 30)}%`}} />
          ))}
        </div>
      ))}
    </div>
  </Paper>
);

/** Typed document with title, optional subtitle and rows. Rows reveal one by one from `rowAt` frames. */
export const Doc: React.FC<{
  t: number;
  at?: number;
  x: number;
  y: number;
  w: number;
  rot?: number;
  title: string;
  kicker?: string;
  rows?: {k: string; v?: string; at?: number; mark?: boolean; strike?: boolean}[];
  size?: number;
  children?: React.ReactNode;
  tone?: string;
}> = ({t, at = 0, x, y, w, rot = 0, title, kicker, rows = [], size = 34, children, tone}) => (
  <Paper t={t} at={at} x={x} y={y} w={w} rot={rot} tone={tone}>
    {kicker ? <div style={{fontFamily: FONT.sans, fontSize: 20, letterSpacing: 6, color: '#7a6a50', marginBottom: 10}}>{kicker}</div> : null}
    <div style={{fontSize: size * 1.25, fontWeight: 900, letterSpacing: 3, borderBottom: '2px solid #2a241c', paddingBottom: 14, marginBottom: 18}}>{title}</div>
    {rows.map((r, i) => {
      const p = e(t, r.at ?? at + 10 + i * 8, 12);
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
          <span>{r.mark ? <Mark t={t} at={(r.at ?? 0) + 8}>{r.k}</Mark> : r.k}</span>
          {r.v ? <span style={{fontWeight: 800, fontVariantNumeric: 'tabular-nums'}}>{r.v}</span> : null}
        </div>
      );
    })}
    {children}
  </Paper>
);

/** Polaroid-style photo containing a 1920×1080 SVG scene, scaled down. */
export const Photo: React.FC<{t: number; at?: number; x: number; y: number; w: number; rot?: number; caption?: string; children: React.ReactNode; sepia?: boolean}> = ({
  t,
  at = 0,
  x,
  y,
  w,
  rot = 0,
  caption,
  children,
  sepia = true,
}) => {
  const h = (w * 1080) / 1920;
  const p = e(t, at, 20);
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w + 32,
        padding: '16px 16px 58px',
        background: '#efe8da',
        boxShadow: '0 30px 60px rgba(0,0,0,0.55)',
        transform: `translateY(${(1 - p) * 80}px) rotate(${rot + (1 - p) * 6}deg)`,
        opacity: p,
      }}
    >
      <div style={{width: w, height: h, overflow: 'hidden', filter: sepia ? 'sepia(0.7) contrast(1.05)' : undefined, background: '#111'}}>
        <svg width={w} height={h} viewBox="0 0 1920 1080">
          {children}
        </svg>
      </div>
      {caption ? (
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 10, textAlign: 'center', fontFamily: FONT.serif, fontSize: 28, color: C.paperInk, fontWeight: 700}}>{caption}</div>
      ) : null}
    </div>
  );
};

/** Balance scale. tilt > 0 means the left pan is heavier. */
export const Balance: React.FC<{x: number; y: number; tilt: number; left: React.ReactNode; right: React.ReactNode; lc?: string; rc?: string; s?: number}> = ({
  x,
  y,
  tilt,
  left,
  right,
  lc = C.gold,
  rc = '#9aa4b0',
  s = 1,
}) => {
  const a = (tilt * 12 * Math.PI) / 180;
  const L = 360 * s;
  const lx = x - Math.cos(a) * L;
  const ly = y + Math.sin(a) * L;
  const rx = x + Math.cos(a) * L;
  const ry = y - Math.sin(a) * L;
  const pan = (px: number, py: number, col: string, label: React.ReactNode, key: string) => (
    <g key={key}>
      <line x1={px} y1={py} x2={px - 90 * s} y2={py + 170 * s} stroke="#8a7a5a" strokeWidth={2} />
      <line x1={px} y1={py} x2={px + 90 * s} y2={py + 170 * s} stroke="#8a7a5a" strokeWidth={2} />
      <path d={`M${px - 120 * s},${py + 170 * s} Q${px},${py + 230 * s} ${px + 120 * s},${py + 170 * s} Z`} fill={col} opacity={0.9} />
      <foreignObject x={px - 220 * s} y={py + 220 * s} width={440 * s} height={140 * s}>
        <div style={{textAlign: 'center', fontFamily: FONT.sans, fontSize: 30 * s, color: C.ink, fontWeight: 700, lineHeight: 1.35}}>{label}</div>
      </foreignObject>
    </g>
  );
  return (
    <g>
      <path d={`M${x - 70 * s},${y + 520 * s} L${x + 70 * s},${y + 520 * s} L${x + 14 * s},${y + 20 * s} L${x - 14 * s},${y + 20 * s} Z`} fill="#3a2e20" />
      <line x1={lx} y1={ly} x2={rx} y2={ry} stroke="#b89a5a" strokeWidth={10 * s} strokeLinecap="round" />
      <circle cx={x} cy={y} r={16 * s} fill="#d8b86a" />
      {pan(lx, ly, lc, left, 'l')}
      {pan(rx, ry, rc, right, 'r')}
    </g>
  );
};

/** Bowl of water, side view. */
export const Bowl: React.FC<{x: number; y: number; s?: number; label?: string; op?: number; color?: string}> = ({x, y, s = 1, label, op = 1, color = '#c9b48a'}) => (
  <g transform={`translate(${x},${y}) scale(${s})`} opacity={op}>
    <ellipse cx={0} cy={-6} rx={150} ry={26} fill="#6fa8c8" opacity={0.7} />
    <path d="M-160,-10 Q-150,120 0,130 Q150,120 160,-10 Q0,30 -160,-10 Z" fill={color} />
    <path d="M-160,-10 Q0,-40 160,-10" stroke="#8a7650" strokeWidth={4} fill="none" />
    <rect x={-50} y={126} width={100} height={14} rx={4} fill="#8a7650" />
    {label ? (
      <text x={0} y={200} textAnchor="middle" fontFamily={FONT.serif} fontSize={40} fontWeight={800} fill={C.ink}>
        {label}
      </text>
    ) : null}
  </g>
);

export const Shield: React.FC<{x: number; y: number; s?: number; p?: number; color?: string; label?: string}> = ({x, y, s = 1, p = 1, color = '#7FD3CF', label}) => (
  <g transform={`translate(${x},${y}) scale(${s * (0.8 + 0.2 * p)})`} opacity={p}>
    <path d="M0,-200 L160,-140 Q160,80 0,200 Q-160,80 -160,-140 Z" fill="#14262a" stroke={color} strokeWidth={8} />
    <path d="M0,-170 L130,-122 Q130,64 0,166 Q-130,64 -130,-122 Z" fill="none" stroke={color} strokeWidth={2} opacity={0.5} />
    {Array.from({length: 6}, (_, i) => (
      <line key={i} x1={-90} y1={-90 + i * 34} x2={90 - (i % 2) * 30} y2={-90 + i * 34} stroke={color} strokeWidth={4} opacity={0.35} />
    ))}
    {label ? (
      <text x={0} y={22} textAnchor="middle" fontFamily={FONT.serif} fontSize={72} fontWeight={900} fill={C.ink}>
        {label}
      </text>
    ) : null}
  </g>
);

/** Counting number. */
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
  const v = mix(from, to, p);
  return (
    <span style={{fontVariantNumeric: 'tabular-nums', ...style}}>
      {prefix}
      {v.toLocaleString('en-US', {minimumFractionDigits: digits, maximumFractionDigits: digits})}
      {suffix}
    </span>
  );
};

/** Tear-off calendar page. */
export const Calendar: React.FC<{x: number; y: number; year: string; month?: string; s?: number; rot?: number; op?: number; red?: boolean}> = ({
  x,
  y,
  year,
  month,
  s = 1,
  rot = 0,
  op = 1,
  red,
}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      width: 300,
      transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${s})`,
      opacity: op,
      background: C.paper,
      boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
      fontFamily: FONT.serif,
      color: C.paperInk,
      textAlign: 'center',
    }}
  >
    <div style={{background: red ? C.stamp : '#2a241c', color: '#f4ead2', fontSize: 30, padding: '10px 0', letterSpacing: 8, fontWeight: 700}}>{month ?? ' '}</div>
    <div style={{fontSize: 110, fontWeight: 900, padding: '16px 0 22px', fontVariantNumeric: 'tabular-nums'}}>{year}</div>
  </div>
);

/** Ink bar chart drawn on paper (for the few places where proportion matters). */
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
      const p = e(t, at + i * 8, 24);
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
