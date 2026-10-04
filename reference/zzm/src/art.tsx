/** SVG illustration library: skies, ridges, skylines, silhouettes, props. All render inside <Svg>. */
import React from 'react';
import {C} from './theme';
import {clamp01, mix, rng} from './film';

export const Defs: React.FC = () => (
  <defs>
    <filter id="blur4" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="4" />
    </filter>
    <filter id="blur10" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="10" />
    </filter>
    <filter id="blur30" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="30" />
    </filter>
    <radialGradient id="glowW">
      <stop offset="0%" stopColor="#fff3d6" stopOpacity="1" />
      <stop offset="30%" stopColor="#ffd690" stopOpacity="0.55" />
      <stop offset="100%" stopColor="#ff9a40" stopOpacity="0" />
    </radialGradient>
    <radialGradient id="glowC">
      <stop offset="0%" stopColor="#e6f2ff" stopOpacity="0.9" />
      <stop offset="35%" stopColor="#8db8ff" stopOpacity="0.35" />
      <stop offset="100%" stopColor="#3060a0" stopOpacity="0" />
    </radialGradient>
    <radialGradient id="glowGold">
      <stop offset="0%" stopColor="#fff0c0" stopOpacity="1" />
      <stop offset="35%" stopColor="#E9B949" stopOpacity="0.5" />
      <stop offset="100%" stopColor="#E9B949" stopOpacity="0" />
    </radialGradient>
    <radialGradient id="glowRed">
      <stop offset="0%" stopColor="#ffd0c0" stopOpacity="0.9" />
      <stop offset="35%" stopColor="#E0644F" stopOpacity="0.45" />
      <stop offset="100%" stopColor="#E0644F" stopOpacity="0" />
    </radialGradient>
    <radialGradient id="glowBlue">
      <stop offset="0%" stopColor="#dbeaff" stopOpacity="0.9" />
      <stop offset="35%" stopColor="#6FA8E8" stopOpacity="0.45" />
      <stop offset="100%" stopColor="#6FA8E8" stopOpacity="0" />
    </radialGradient>
    <radialGradient id="glowGreen">
      <stop offset="0%" stopColor="#e0ffe6" stopOpacity="0.9" />
      <stop offset="35%" stopColor="#7CC48D" stopOpacity="0.45" />
      <stop offset="100%" stopColor="#7CC48D" stopOpacity="0" />
    </radialGradient>
    <linearGradient id="spot" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#fff2d0" stopOpacity="0.5" />
      <stop offset="100%" stopColor="#fff2d0" stopOpacity="0" />
    </linearGradient>
    <linearGradient id="waferG" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#9fb7d8" />
      <stop offset="35%" stopColor="#c9a6e0" />
      <stop offset="65%" stopColor="#8fd0c8" />
      <stop offset="100%" stopColor="#e8c980" />
    </linearGradient>
  </defs>
);

/** vertical sky gradient filling the frame */
export const Sky: React.FC<{id: string; stops: [number, string][]}> = ({id, stops}) => (
  <>
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        {stops.map(([o, c]) => (
          <stop key={o} offset={`${o * 100}%`} stopColor={c} />
        ))}
      </linearGradient>
    </defs>
    <rect x={-200} y={-200} width={2320} height={1480} fill={`url(#${id})`} />
  </>
);

export const Glow: React.FC<{x: number; y: number; r: number; id?: string; op?: number}> = ({x, y, r, id = 'glowW', op = 1}) => (
  <circle cx={x} cy={y} r={r} fill={`url(#${id})`} opacity={op} />
);

export const Stars: React.FC<{t: number; n?: number; seed?: number; maxY?: number; op?: number}> = ({t, n = 140, seed = 3, maxY = 600, op = 1}) => {
  const r = rng(seed);
  return (
    <g opacity={op}>
      {Array.from({length: n}, (_, i) => {
        const x = r() * 1920;
        const y = r() * maxY;
        const s = 0.6 + r() * 1.8;
        const tw = 0.5 + 0.5 * Math.sin(t * (0.05 + r() * 0.08) + i);
        return <circle key={i} cx={x} cy={y} r={s} fill="#fff" opacity={0.25 + 0.6 * tw} />;
      })}
    </g>
  );
};

/** mountain ridge silhouette */
export const Ridge: React.FC<{y: number; amp: number; seed: number; color: string; shift?: number; rough?: number; op?: number}> = ({
  y,
  amp,
  seed,
  color,
  shift = 0,
  rough = 1,
  op = 1,
}) => {
  const r = rng(seed);
  const ph = [r() * 6, r() * 6, r() * 6, r() * 6];
  const pts: string[] = [];
  for (let x = -200; x <= 2120; x += 16) {
    const X = x + shift;
    const h =
      Math.sin(X * 0.0021 + ph[0]) * 0.55 +
      Math.sin(X * 0.0047 + ph[1]) * 0.3 +
      Math.sin(X * 0.011 + ph[2]) * 0.12 * rough +
      Math.sin(X * 0.031 + ph[3]) * 0.04 * rough;
    pts.push(`${x},${(y - amp * (0.5 + 0.5 * h)).toFixed(1)}`);
  }
  return <path d={`M-200,1300 L${pts.join(' L')} L2120,1300 Z`} fill={color} opacity={op} />;
};

/** city skyline with lit windows */
export const Skyline: React.FC<{
  y: number;
  seed: number;
  color: string;
  win?: string;
  minH?: number;
  maxH?: number;
  lit?: number;
  x0?: number;
  x1?: number;
  t?: number;
}> = ({y, seed, color, win = '#ffd48a', minH = 80, maxH = 360, lit = 0.25, x0 = -100, x1 = 2020, t = 0}) => {
  const r = rng(seed);
  const out: React.ReactNode[] = [];
  let x = x0;
  let k = 0;
  while (x < x1) {
    const w = 50 + r() * 110;
    const h = minH + Math.pow(r(), 1.6) * (maxH - minH);
    out.push(<rect key={`b${k}`} x={x} y={y - h} width={w} height={h + 400} fill={color} />);
    if (r() < 0.2) out.push(<rect key={`a${k}`} x={x + w / 2 - 2} y={y - h - 40} width={4} height={40} fill={color} />);
    const cols = Math.floor((w - 12) / 16);
    const rows = Math.floor((h - 20) / 22);
    for (let i = 0; i < cols; i++)
      for (let j = 0; j < rows; j++) {
        const v = r();
        if (v < lit) {
          const blink = (Math.floor(t / 90 + v * 40) % 23 === 0 ? 0.3 : 1) * (0.55 + v);
          out.push(<rect key={`w${k}-${i}-${j}`} x={x + 8 + i * 16} y={y - h + 14 + j * 22} width={8} height={11} fill={win} opacity={Math.min(1, blink)} />);
        }
      }
    x += w + 4 + r() * 18;
    k++;
  }
  return <g>{out}</g>;
};

export const Ground: React.FC<{y: number; color: string; to?: string}> = ({y, color, to}) => (
  <>
    {to ? (
      <defs>
        <linearGradient id={`gr${y}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
      </defs>
    ) : null}
    <rect x={-200} y={y} width={2320} height={1400 - y} fill={to ? `url(#gr${y})` : color} />
  </>
);

export const Saguaro: React.FC<{x: number; y: number; h: number; color: string; flip?: boolean}> = ({x, y, h, color, flip}) => {
  const u = h / 100;
  const s = flip ? -1 : 1;
  return (
    <g transform={`translate(${x},${y}) scale(${s * u},${u})`} fill={color} stroke={color} strokeLinecap="round" strokeLinejoin="round">
      <path d="M-6,0 L-6,-92 Q0,-102 6,-92 L6,0 Z" />
      <path d="M-6,-40 Q-24,-40 -24,-58 L-24,-74" strokeWidth={9} fill="none" />
      <path d="M6,-52 Q22,-52 22,-66 L22,-80" strokeWidth={8} fill="none" />
    </g>
  );
};

// ───────────────────────── people ─────────────────────────

export type Pose = 'stand' | 'walk' | 'phone' | 'point' | 'bust' | 'podium' | 'sit' | 'shovel';

/**
 * Silhouette person. (x,y) = feet (or seat for 'sit'/'bust'), h = standing height in px.
 * old=true adds a slight stoop; pipe=true adds Chang's pipe.
 */
export const Figure: React.FC<{
  x: number;
  y: number;
  h: number;
  pose?: Pose;
  color?: string;
  facing?: 1 | -1;
  phase?: number;
  old?: boolean;
  pipe?: boolean;
  rim?: string;
  bun?: boolean;
}> = ({x, y, h, pose = 'stand', color = C.silhouette, facing = 1, phase = 0, old, pipe, rim, bun}) => {
  const u = h / 100;
  const stoop = old ? 3 : 0;
  const sw = Math.sin(phase) * (pose === 'walk' ? 16 : 0);
  const legW = 7.5;
  const armW = 5.6;
  const headX = 1.2 + stoop;
  const headY = -88 + (old ? 1.5 : 0);
  const showLegs = pose !== 'bust' && pose !== 'podium' && pose !== 'sit';
  const leg = (dir: number) => {
    const a = (dir * sw * Math.PI) / 180;
    const kx = Math.sin(a) * 22;
    const fx = Math.sin(a) * 44 + (dir * sw > 0 ? 2 : -1);
    return <path d={`M${dir * 3},-46 L${kx + dir * 2.5},-24 L${fx + dir * 2},-1`} strokeWidth={legW} fill="none" />;
  };
  const arm = (side: number) => {
    // side: +1 front arm, -1 back arm
    if (pose === 'phone' && side === 1) return <path d={`M5,-76 Q15,-64 9,-80 L${headX + 7},-90`} strokeWidth={armW} fill="none" />;
    if (pose === 'point' && side === 1) return <path d="M5,-76 L24,-70 L44,-72" strokeWidth={armW} fill="none" />;
    if (pose === 'podium') return <path d={`M${side * 5},-76 L${side * 4 + 10},-60 L${side * 3 + 20},-58`} strokeWidth={armW} fill="none" />;
    if (pose === 'shovel') return <path d={`M${side * 4},-76 L${10 + side * 3},-58 L${18 + side * 2},-50`} strokeWidth={armW} fill="none" />;
    if (pose === 'sit') return <path d={`M${side * 5},-76 L${side * 4 + 8},-58 L${side * 3 + 22},-56`} strokeWidth={armW} fill="none" />;
    const a = pose === 'walk' ? (-side * sw * Math.PI) / 180 : 0.06 * side;
    return <path d={`M${side * 4},-76 L${Math.sin(a) * 15 + side * 5},-61 L${Math.sin(a) * 26 + side * 5},-47`} strokeWidth={armW} fill="none" />;
  };
  return (
    <g transform={`translate(${x},${y}) scale(${facing * u},${u})`} fill={color} stroke={color} strokeLinecap="round" strokeLinejoin="round">
      {showLegs ? (
        <>
          {leg(-1)}
          {leg(1)}
        </>
      ) : null}
      {pose === 'sit' ? <path d="M-6,-44 L18,-44 L20,-20" strokeWidth={legW} fill="none" /> : null}
      {arm(-1)}
      {/* torso */}
      <path
        d={`M${-11 + stoop * 0.6},-77 Q${-12 + stoop},-80 ${-6 + stoop},-81 L${7 + stoop},-81 Q${12 + stoop},-80 ${12 + stoop * 0.6},-76 L9,-46 Q0,-43 -8,-46 Z`}
        strokeWidth={1}
      />
      {/* neck + head */}
      <path d={`M${-2 + stoop},-80 L${-1.5 + headX},-84 L${3 + headX},-84 L${3 + stoop},-80 Z`} />
      <ellipse cx={headX} cy={headY} rx={6.6} ry={7.6} strokeWidth={0} />
      {bun ? <circle cx={headX - 5} cy={headY - 3} r={3.6} strokeWidth={0} /> : null}
      {arm(1)}
      {pipe ? (
        <g strokeWidth={1.6} fill="none">
          <path d={`M${headX + 5},${headY + 4} Q${headX + 10},${headY + 6} ${headX + 12},${headY + 9}`} />
          <path d={`M${headX + 10.5},${headY + 8} L${headX + 14},${headY + 8} L${headX + 13.5},${headY + 12} L${headX + 11},${headY + 12} Z`} fill={color} />
        </g>
      ) : null}
      {rim ? (
        <ellipse cx={headX - 3} cy={headY - 1} rx={6.6} ry={7.6} fill="none" stroke={rim} strokeWidth={1.3} opacity={0.75} strokeDasharray="0 6 14 40" />
      ) : null}
    </g>
  );
};

/** pipe-smoke wisps rising from (x,y) */
export const Smoke: React.FC<{t: number; x: number; y: number; color?: string; scale?: number; op?: number}> = ({t, x, y, color = '#d8d2c6', scale = 1, op = 0.5}) => {
  const out: React.ReactNode[] = [];
  const period = 9;
  const life = 110;
  for (let k = Math.floor((t - life) / period); k <= Math.floor(t / period); k++) {
    const age = t - k * period;
    if (age < 0 || age > life) continue;
    const r = rng(k * 31 + 7);
    const p = age / life;
    const px = x + (Math.sin(age * 0.05 + r() * 6) * 14 + p * 30 * (r() - 0.3)) * scale;
    const py = y - age * 1.1 * scale;
    out.push(<circle key={k} cx={px} cy={py} r={(3 + p * 22) * scale} fill={color} opacity={op * (1 - p) * clamp01(age / 10)} />);
  }
  return <g filter="url(#blur4)">{out}</g>;
};

/** seated audience: rows of heads and shoulders */
export const Crowd: React.FC<{y: number; rows?: number; seed?: number; color?: string; x0?: number; x1?: number; gap?: number; size?: number; t?: number}> = ({
  y,
  rows = 3,
  seed = 1,
  color = C.silhouette,
  x0 = -40,
  x1 = 1960,
  gap = 70,
  size = 1,
  t = 0,
}) => {
  const r = rng(seed);
  const out: React.ReactNode[] = [];
  for (let j = 0; j < rows; j++) {
    const s = size * (1 + j * 0.22);
    const yy = y + j * 46 * s;
    for (let x = x0 + (j % 2) * gap * 0.5; x < x1; x += gap * s * (0.85 + r() * 0.3)) {
      const bob = Math.sin(t * 0.03 + x) * 0.8;
      out.push(
        <g key={`${j}-${x}`} transform={`translate(${x},${yy + bob}) scale(${s})`} fill={color}>
          <ellipse cx={0} cy={-34} rx={12 + r() * 2} ry={14} />
          <path d="M-30,10 Q-30,-14 -12,-18 L12,-18 Q30,-14 30,10 Z" />
        </g>,
      );
    }
  }
  return <g>{out}</g>;
};

export const Podium: React.FC<{x: number; y: number; s?: number; color?: string; edge?: string}> = ({x, y, s = 1, color = '#1a1714', edge = '#3a332b'}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <path d="M-48,-118 L48,-118 L40,0 L-40,0 Z" fill={color} stroke={edge} strokeWidth={2} />
    <rect x={-56} y={-128} width={112} height={14} rx={3} fill={edge} />
    <path d="M10,-128 Q18,-150 6,-162" stroke={edge} strokeWidth={3} fill="none" />
    <circle cx={6} cy={-164} r={4} fill={edge} />
  </g>
);

/** low wide factory (fab) with optional construction cranes */
export const Fab: React.FC<{x: number; y: number; w: number; h: number; color?: string; face?: string; cranes?: boolean; lit?: boolean; t?: number}> = ({
  x,
  y,
  w,
  h,
  color = '#d8d4cc',
  face = '#b9b2a6',
  cranes,
  lit,
  t = 0,
}) => (
  <g>
    {cranes ? (
      <g stroke="#2a2420" strokeWidth={5} fill="none">
        <path d={`M${x + w * 0.2},${y} L${x + w * 0.2},${y - h * 2.4} M${x + w * 0.2 - 40},${y - h * 2.3} L${x + w * 0.2 + 320},${y - h * 2.3}`} />
        <path d={`M${x + w * 0.2 + 260},${y - h * 2.3} L${x + w * 0.2 + 260},${y - h * 1.2}`} strokeWidth={2} />
        <path d={`M${x + w * 0.8},${y} L${x + w * 0.8},${y - h * 2}`} />
        <path d={`M${x + w * 0.8 - 260},${y - h * 1.95} L${x + w * 0.8 + 60},${y - h * 1.95}`} />
      </g>
    ) : null}
    <rect x={x + w * 0.62} y={y - h * 1.35} width={w * 0.2} height={h * 0.4} fill={face} />
    <rect x={x} y={y - h} width={w} height={h} fill={color} />
    <rect x={x} y={y - h} width={w} height={h * 0.09} fill={face} />
    {Array.from({length: Math.floor(w / 90)}, (_, i) => (
      <rect key={i} x={x + 30 + i * 90} y={y - h * 0.62} width={50} height={h * 0.16} fill={lit ? '#ffe6a8' : '#8f877b'} opacity={lit ? 0.6 + 0.3 * Math.sin(t * 0.05 + i) : 0.6} />
    ))}
    <rect x={x} y={y - h * 0.18} width={w} height={h * 0.05} fill={face} opacity={0.8} />
  </g>
);

export const Door: React.FC<{x: number; y: number; w: number; h: number; open?: number; light?: string; frame?: string}> = ({
  x,
  y,
  w,
  h,
  open = 0,
  light = '#ffe0a0',
  frame = '#3a322a',
}) => (
  <g>
    <rect x={x - 10} y={y - h - 10} width={w + 20} height={h + 10} fill={frame} />
    <rect x={x} y={y - h} width={w} height={h} fill={light} opacity={0.1 + 0.9 * open} />
    {open > 0 ? <path d={`M${x},${y} L${x + w},${y} L${x + w + 420 * open},${y + 280} L${x - 420 * open},${y + 280} Z`} fill={light} opacity={0.18 * open} /> : null}
    <path d={`M${x},${y - h} L${x + w * (1 - 0.82 * open)},${y - h + 14 * open} L${x + w * (1 - 0.82 * open)},${y - 14 * open} L${x},${y} Z`} fill="#241e19" stroke={frame} strokeWidth={3} />
    <circle cx={x + w * (1 - 0.82 * open) - 18} cy={y - h / 2} r={6} fill="#8a7a5a" />
  </g>
);

/** table seen from the side */
export const Table: React.FC<{x: number; y: number; w: number; color?: string; top?: string}> = ({x, y, w, color = '#17120e', top = '#3a2c20'}) => (
  <g>
    <rect x={x - w / 2} y={y} width={w} height={14} fill={top} />
    <rect x={x - w / 2 + 20} y={y + 14} width={12} height={150} fill={color} />
    <rect x={x + w / 2 - 32} y={y + 14} width={12} height={150} fill={color} />
  </g>
);

export const Lamp: React.FC<{x: number; y: number; len?: number; op?: number}> = ({x, y, len = 140, op = 1}) => (
  <g opacity={op}>
    <line x1={x} y1={y - len} x2={x} y2={y} stroke="#2a241e" strokeWidth={3} />
    <path d={`M${x - 46},${y + 30} L${x - 20},${y} L${x + 20},${y} L${x + 46},${y + 30} Z`} fill="#2a241e" />
    <path d={`M${x - 46},${y + 30} L${x + 46},${y + 30} L${x + 330},${y + 640} L${x - 330},${y + 640} Z`} fill="url(#spot)" opacity={0.55} />
    <ellipse cx={x} cy={y + 30} rx={44} ry={6} fill="#ffe7b0" />
  </g>
);

/** retro desk phone; ring = shake amount */
export const Phone: React.FC<{x: number; y: number; s?: number; ring?: number; color?: string}> = ({x, y, s = 1, ring = 0, color = '#1d1915'}) => (
  <g transform={`translate(${x},${y}) scale(${s}) rotate(${Math.sin(ring * 3) * 4 * clamp01(ring)})`}>
    <path d="M-80,0 L-60,-60 L60,-60 L80,0 Z" fill={color} stroke="#3c342b" strokeWidth={3} />
    <circle cx={0} cy={-30} r={22} fill="none" stroke="#5b5045" strokeWidth={4} />
    <path d={`M-90,-${76 + 6 * Math.abs(Math.sin(ring * 5)) * clamp01(ring)} Q0,-110 90,-76 L90,-60 Q0,-92 -90,-60 Z`} fill={color} stroke="#3c342b" strokeWidth={3} />
  </g>
);

// ───────────────────────── board game ─────────────────────────

export const Piece: React.FC<{kind: 'king' | 'pawn' | 'rook' | 'queen'; x: number; y: number; s?: number; color: string; dark?: string; glow?: string; op?: number}> = ({
  kind,
  x,
  y,
  s = 1,
  color,
  dark = 'rgba(0,0,0,0.35)',
  glow,
  op = 1,
}) => {
  const body =
    kind === 'pawn'
      ? 'M-34,0 L34,0 L30,-14 L18,-20 L12,-70 L22,-78 L14,-84 A24,24 0 1 0 -14,-84 L-22,-78 L-12,-70 L-18,-20 L-30,-14 Z'
      : kind === 'rook'
        ? 'M-40,0 L40,0 L36,-16 L24,-24 L20,-100 L30,-108 L30,-136 L18,-136 L18,-124 L6,-124 L6,-136 L-6,-136 L-6,-124 L-18,-124 L-18,-136 L-30,-136 L-30,-108 L-20,-100 L-24,-24 L-36,-16 Z'
        : kind === 'queen'
          ? 'M-42,0 L42,0 L38,-16 L24,-26 L16,-120 L30,-132 L24,-150 L12,-136 L0,-160 L-12,-136 L-24,-150 L-30,-132 L-16,-120 L-24,-26 L-38,-16 Z'
          : 'M-44,0 L44,0 L40,-18 L26,-28 L18,-130 L32,-140 L18,-150 L8,-150 L8,-166 L18,-166 L18,-176 L8,-176 L8,-188 L-8,-188 L-8,-176 L-18,-176 L-18,-166 L-8,-166 L-8,-150 L-18,-150 L-32,-140 L-18,-130 L-26,-28 L-40,-18 Z';
  return (
    <g transform={`translate(${x},${y}) scale(${s})`} opacity={op}>
      {glow ? <ellipse cx={0} cy={-80} rx={130} ry={150} fill={`url(#${glow})`} opacity={0.7} /> : null}
      <ellipse cx={0} cy={2} rx={54} ry={12} fill="rgba(0,0,0,0.5)" />
      <path d={body} fill={color} />
      <path d={body} fill={dark} transform="translate(10,0) scale(0.55,1)" opacity={0.6} />
      <path d={body} fill="rgba(255,255,255,0.25)" transform="translate(-14,0) scale(0.25,1)" />
    </g>
  );
};

/** perspective chess board: corners TL TR BR BL */
export const Board: React.FC<{tl: [number, number]; tr: [number, number]; br: [number, number]; bl: [number, number]; n?: number; a?: string; b?: string; edge?: string}> = ({
  tl,
  tr,
  br,
  bl,
  n = 8,
  a = '#2b2620',
  b = '#1a1612',
  edge = '#5a4a32',
}) => {
  const P = (u: number, v: number) => {
    // perspective-ish: compress v toward the far edge
    const vv = Math.pow(v, 1.12);
    const top = [mix(tl[0], tr[0], u), mix(tl[1], tr[1], u)];
    const bot = [mix(bl[0], br[0], u), mix(bl[1], br[1], u)];
    return [mix(top[0], bot[0], vv), mix(top[1], bot[1], vv)];
  };
  const cells: React.ReactNode[] = [];
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      const p = [P(i / n, j / n), P((i + 1) / n, j / n), P((i + 1) / n, (j + 1) / n), P(i / n, (j + 1) / n)];
      cells.push(<path key={`${i}-${j}`} d={`M${p.map((q) => q.join(',')).join(' L')} Z`} fill={(i + j) % 2 ? a : b} />);
    }
  return (
    <g>
      <path d={`M${tl[0] - 24},${tl[1] - 14} L${tr[0] + 24},${tr[1] - 14} L${br[0] + 40},${br[1] + 22} L${bl[0] - 40},${bl[1] + 22} Z`} fill={edge} />
      <path d={`M${bl[0] - 40},${bl[1] + 22} L${br[0] + 40},${br[1] + 22} L${br[0] + 40},${br[1] + 60} L${bl[0] - 40},${bl[1] + 60} Z`} fill="#2e2418" />
      {cells}
    </g>
  );
};

export const Wafer: React.FC<{x: number; y: number; r: number; spin?: number; op?: number; dim?: boolean}> = ({x, y, r, spin = 0, op = 1, dim}) => {
  const id = `wc${Math.round(x)}${Math.round(y)}${Math.round(r)}`;
  const n = Math.max(4, Math.round(r / 18));
  const cell = (2 * r) / n;
  return (
    <g opacity={op} transform={`rotate(${spin},${x},${y})`}>
      <defs>
        <clipPath id={id}>
          <circle cx={x} cy={y} r={r} />
        </clipPath>
      </defs>
      <circle cx={x} cy={y} r={r + 4} fill="#1c1c22" />
      <circle cx={x} cy={y} r={r} fill={dim ? '#5a5f68' : 'url(#waferG)'} />
      <g clipPath={`url(#${id})`} stroke="rgba(20,20,30,0.45)" strokeWidth={1.4}>
        {Array.from({length: n + 1}, (_, i) => (
          <React.Fragment key={i}>
            <line x1={x - r + i * cell} y1={y - r} x2={x - r + i * cell} y2={y + r} />
            <line x1={x - r} y1={y - r + i * cell} x2={x + r} y2={y - r + i * cell} />
          </React.Fragment>
        ))}
      </g>
      <path d={`M${x - r * 0.7},${y - r * 0.7} A${r},${r} 0 0 1 ${x + r * 0.2},${y - r * 0.98}`} stroke="rgba(255,255,255,0.6)" strokeWidth={3} fill="none" />
      <rect x={x - 8} y={y + r - 3} width={16} height={6} fill="#1c1c22" />
    </g>
  );
};

/** stack of coins; n coins, top at (x, y-n*step) */
export const Coins: React.FC<{x: number; y: number; n: number; w?: number; color?: string}> = ({x, y, n, w = 70, color = C.gold}) => (
  <g>
    {Array.from({length: Math.max(0, Math.floor(n))}, (_, i) => (
      <g key={i}>
        <rect x={x - w / 2} y={y - i * 9 - 9} width={w} height={9} fill="#9c7420" />
        <ellipse cx={x} cy={y - i * 9 - 9} rx={w / 2} ry={w * 0.16} fill={color} stroke="#7a5a18" strokeWidth={1} />
      </g>
    ))}
  </g>
);

export const Courthouse: React.FC<{x: number; y: number; w: number; color?: string; shade?: string}> = ({x, y, w, color = '#cfc6b4', shade = '#8f8676'}) => {
  const h = w * 0.55;
  const cols = 8;
  return (
    <g>
      <path d={`M${x - w / 2 - 20},${y - h} L${x},${y - h - w * 0.2} L${x + w / 2 + 20},${y - h} Z`} fill={color} />
      <rect x={x - w / 2 - 20} y={y - h} width={w + 40} height={20} fill={shade} />
      {Array.from({length: cols}, (_, i) => (
        <rect key={i} x={x - w / 2 + 10 + i * ((w - 40) / (cols - 1))} y={y - h + 20} width={22} height={h - 50} fill={color} />
      ))}
      <rect x={x - w / 2 - 30} y={y - 30} width={w + 60} height={14} fill={shade} />
      <rect x={x - w / 2 - 50} y={y - 16} width={w + 100} height={16} fill={color} />
    </g>
  );
};

/** stylised Taiwan island outline in a 100×200 box at (x,y) with scale s */
export const TAIWAN = 'M62,0 L72,8 L80,30 L78,62 L74,96 L66,130 L56,160 L46,186 L40,200 L32,186 L22,158 L14,128 L12,98 L18,66 L30,36 L44,14 Z';
export const Taiwan: React.FC<{x: number; y: number; s?: number; fill?: string; stroke?: string}> = ({x, y, s = 1, fill = C.tw, stroke}) => (
  <path d={TAIWAN} transform={`translate(${x},${y}) scale(${s}) rotate(14,50,100)`} fill={fill} stroke={stroke} strokeWidth={stroke ? 2 / s : 0} />
);
/** mainland coastline (left of x0), as a filled region */
export const Mainland: React.FC<{x0: number; fill?: string; edge?: string}> = ({x0, fill = '#2a2724', edge = '#4a443c'}) => (
  <path
    d={`M-200,-100 L${x0 + 40},-100 C${x0 + 10},40 ${x0 + 90},140 ${x0 + 40},240 S${x0 + 120},380 ${x0 + 60},470 S${x0 + 140},600 ${x0 + 90},690 S${x0 + 170},820 ${x0 + 110},930 S${x0 + 160},1100 ${x0 + 140},1200 L-200,1200 Z`}
    fill={fill}
    stroke={edge}
    strokeWidth={3}
  />
);

/** dashed arc from a to b, drawn to progress p */
export const Arc: React.FC<{a: [number, number]; b: [number, number]; lift?: number; p: number; color?: string; w?: number; dash?: string}> = ({
  a,
  b,
  lift = 200,
  p,
  color = C.gold,
  w = 4,
  dash = '14 12',
}) => {
  const mx = (a[0] + b[0]) / 2;
  const my = (a[1] + b[1]) / 2 - lift;
  const pts: string[] = [];
  const N = 60;
  for (let i = 0; i <= N * p; i++) {
    const s = i / N;
    const x = (1 - s) * (1 - s) * a[0] + 2 * (1 - s) * s * mx + s * s * b[0];
    const y = (1 - s) * (1 - s) * a[1] + 2 * (1 - s) * s * my + s * s * b[1];
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  if (pts.length < 2) return null;
  const last = pts[pts.length - 1].split(',').map(Number);
  return (
    <g>
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth={w} strokeDasharray={dash} strokeLinecap="round" />
      <circle cx={last[0]} cy={last[1]} r={w * 2} fill={color} />
    </g>
  );
};

export const Pin: React.FC<{x: number; y: number; color?: string; s?: number; pulse?: number}> = ({x, y, color = C.gold, s = 1, pulse = 0}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <circle r={14 + 30 * (pulse % 1)} fill="none" stroke={color} strokeWidth={2} opacity={1 - (pulse % 1)} />
    <circle r={10} fill={color} />
    <circle r={4} fill="#fff" />
  </g>
);
