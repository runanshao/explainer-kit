/** Neon style pack: dark tech — scrolling perspective grid, scanlines, glowing type, terminal, node graph, glitch. Delete this folder if unused. */
import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {FPS} from '../config';
import type {ChapterProps, Look} from '../core/look';
import {clamp01, pulse, rng, springAt, tween} from '../core/motion';
import {FONT} from '../core/theme';

export const N = {
  bg: '#04060E',
  sky: '#0B1033',
  cyan: '#3BE3FF',
  magenta: '#FF3DA8',
  lime: '#B4FF39',
  violet: '#8C7BFF',
  text: '#E8F2FF',
  dim: '#5D6C91',
  line: 'rgba(59,227,255,0.28)',
  glass: 'rgba(10,16,40,0.72)',
};

/** Night sky over a perspective grid floor that keeps scrolling toward the camera. */
export const GridFloor: React.FC<{speed?: number; color?: string}> = ({speed = 1.6, color = N.cyan}) => {
  const f = useCurrentFrame();
  const r = rng(77);
  const stars = Array.from({length: 70}, () => [r() * 1920, r() * 560, r() * 1.8 + 0.6, r() * 60] as const);
  return (
    <AbsoluteFill style={{background: `linear-gradient(180deg, ${N.bg} 0%, ${N.sky} 48%, #241046 56%, ${N.bg} 57%)`}}>
      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
        {stars.map(([x, y, s, ph], i) => (
          <circle key={i} cx={x} cy={y} r={s} fill={N.text} opacity={0.15 + 0.45 * pulse(f, 90 + (i % 7) * 13, ph)} />
        ))}
      </svg>
      <div
        style={{
          position: 'absolute',
          left: '-60%',
          right: '-60%',
          top: '56%',
          height: '110%',
          backgroundImage: `linear-gradient(${color}55 2px, transparent 2px), linear-gradient(90deg, ${color}55 2px, transparent 2px)`,
          backgroundSize: '90px 90px',
          backgroundPosition: `0 ${(f * speed) % 90}px`,
          transform: 'perspective(520px) rotateX(74deg)',
          transformOrigin: 'top center',
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 30%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 30%)',
        }}
      />
      <div style={{position: 'absolute', left: 0, right: 0, top: '56%', height: 2, background: N.magenta, boxShadow: `0 0 30px 6px ${N.magenta}88`, opacity: 0.8}} />
    </AbsoluteFill>
  );
};

/** CRT scanlines, a slow rolling bright band and a vignette. */
export const Scanlines: React.FC = () => {
  const f = useCurrentFrame();
  const roll = ((f * 4) % 1400) - 200;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <AbsoluteFill style={{backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.22) 0 2px, transparent 2px 4px)'}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: roll, height: 160, background: 'linear-gradient(transparent, rgba(160,220,255,0.05), transparent)'}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 80% 75% at 50% 50%, transparent 55%, rgba(0,0,0,0.6) 100%)'}} />
    </AbsoluteFill>
  );
};

/** flicker-on: a fluorescent tube catching, deterministic per seed */
const flickerOn = (f: number, at: number, seed = 1, dur = 12) => {
  if (f < at) return 0;
  if (f >= at + dur) return 1;
  const r = rng(seed * 997 + (f - at));
  return r() < 0.35 + ((f - at) / dur) * 0.6 ? 1 : 0.15;
};

/** Glowing text that flickers on at frame `at` (scene frames). */
export const Neon: React.FC<{children: React.ReactNode; at?: number; color?: string; size?: number; mono?: boolean; seed?: number; style?: React.CSSProperties}> = ({
  children,
  at = 0,
  color = N.cyan,
  size = 72,
  mono,
  seed = 1,
  style,
}) => {
  const f = useCurrentFrame();
  const on = flickerOn(f, at, seed);
  const hum = 0.92 + 0.08 * pulse(f, 7 + seed, seed);
  return (
    <div
      style={{
        fontFamily: mono ? FONT.mono : FONT.sans,
        fontSize: size,
        fontWeight: 800,
        color: N.text,
        opacity: on,
        textShadow: `0 0 6px ${color}, 0 0 ${18 * hum}px ${color}, 0 0 ${48 * hum}px ${color}99`,
        letterSpacing: 2,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/**
 * Full-frame glitch: for `dur` frames from `at`, the picture is sliced into bands that jump sideways
 * with an RGB split. Wrap a whole shot (or a full-frame layer) in it.
 */
export const Glitch: React.FC<{at: number; dur?: number; amp?: number; children: React.ReactNode}> = ({at, dur = 10, amp = 40, children}) => {
  const f = useCurrentFrame();
  const k = f - at;
  if (k < 0 || k >= dur) return <AbsoluteFill>{children}</AbsoluteFill>;
  const r = rng(at * 31 + k);
  const fade = 1 - k / dur;
  const bands = Array.from({length: 7}, () => {
    const top = r() * 100;
    return {top, h: 3 + r() * 14, dx: (r() - 0.5) * 2 * amp * fade};
  });
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{transform: `translateX(${-6 * fade}px)`, filter: 'drop-shadow(6px 0 0 rgba(255,40,140,0.7)) drop-shadow(-6px 0 0 rgba(40,220,255,0.7))'}}>
        {children}
      </AbsoluteFill>
      {bands.map((b, i) => (
        <AbsoluteFill key={i} style={{clipPath: `inset(${b.top}% 0 ${Math.max(0, 100 - b.top - b.h)}% 0)`, transform: `translateX(${b.dx}px)`}}>
          {children}
        </AbsoluteFill>
      ))}
    </AbsoluteFill>
  );
};

export type TermLine = {text: string; at: number; out?: boolean; color?: string};

/**
 * Terminal window at (x, y). Command lines type in at 28 chars/s from their `at` (scene frames);
 * output lines (`out: true`) appear at once.
 */
export const Term: React.FC<{x: number; y: number; w?: number; at: number; title?: string; lines: TermLine[]; size?: number}> = ({
  x,
  y,
  w = 900,
  at,
  title = 'zsh — explainer-kit',
  lines,
  size = 30,
}) => {
  const f = useCurrentFrame();
  const s = springAt(f, at, 'snappy');
  if (f < at) return null;
  let caretRow = -1;
  const rows = lines.map((ln, i) => {
    if (f < ln.at) return null;
    let shown = ln.text;
    if (!ln.out) {
      const n = Math.floor(((f - ln.at) / FPS) * 28);
      shown = ln.text.slice(0, n);
      if (n <= ln.text.length) caretRow = i;
    } else caretRow = i;
    return (
      <div key={i} style={{color: ln.color ?? (ln.out ? N.dim : N.text), whiteSpace: 'pre', opacity: ln.out ? tween(f, ln.at, 6) : 1}}>
        {ln.out ? null : <span style={{color: N.lime}}>$ </span>}
        {shown}
        {i === caretRow && !ln.out && Math.floor(f / 8) % 2 === 0 ? <span style={{background: N.cyan, color: N.cyan}}>▌</span> : null}
      </div>
    );
  });
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        transform: `scale(${0.9 + 0.1 * s}) translateY(${(1 - s) * 30}px)`,
        opacity: clamp01(s * 1.5),
        background: N.glass,
        border: `1.5px solid ${N.line}`,
        borderRadius: 14,
        boxShadow: `0 0 40px ${N.cyan}22, 0 30px 60px rgba(0,0,0,0.6)`,
        fontFamily: FONT.mono,
        fontSize: size,
        overflow: 'hidden',
      }}
    >
      <div style={{display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', borderBottom: `1px solid ${N.line}`, fontSize: size * 0.6, color: N.dim}}>
        {[N.magenta, '#FFC14D', N.lime].map((c) => (
          <span key={c} style={{width: 14, height: 14, borderRadius: 7, background: c, opacity: 0.85}} />
        ))}
        <span style={{marginLeft: 12}}>{title}</span>
      </div>
      <div style={{padding: '18px 24px', lineHeight: 1.55, minHeight: size * 1.55 * Math.max(3, lines.length)}}>{rows}</div>
    </div>
  );
};

export type NetNode = {id: string; x: number; y: number; label?: string; at: number; color?: string};
export type NetEdge = {a: string; b: string; at: number};

/** Node graph (full-frame SVG): nodes pop in with a ripple, edges draw, then data pulses keep flowing along them. */
export const Net: React.FC<{nodes: NetNode[]; edges: NetEdge[]; flowFrom?: number; r?: number}> = ({nodes, edges, flowFrom = Infinity, r = 26}) => {
  const f = useCurrentFrame();
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
      <defs>
        <filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {edges.map((e, i) => {
        const A = byId[e.a];
        const B = byId[e.b];
        const p = tween(f, e.at, 16, 'inOut');
        if (p <= 0) return null;
        const ex = A.x + (B.x - A.x) * p;
        const ey = A.y + (B.y - A.y) * p;
        const pulses = f >= flowFrom ? [0, 0.33, 0.66].map((o) => ((f - flowFrom) / 45 + o + i * 0.17) % 1) : [];
        return (
          <g key={i}>
            <line x1={A.x} y1={A.y} x2={ex} y2={ey} stroke={N.cyan} strokeOpacity={0.45} strokeWidth={3} />
            {pulses.map((k, j) => (
              <circle key={j} cx={A.x + (B.x - A.x) * k} cy={A.y + (B.y - A.y) * k} r={6} fill={N.lime} filter="url(#neon-glow)" opacity={Math.sin(k * Math.PI)} />
            ))}
          </g>
        );
      })}
      {nodes.map((n, i) => {
        if (f < n.at) return null;
        const s = springAt(f, n.at, 'bouncy');
        const ring = tween(f, n.at, 24, 'out');
        const c = n.color ?? N.cyan;
        return (
          <g key={n.id} transform={`translate(${n.x} ${n.y})`}>
            <circle r={r + ring * 50} fill="none" stroke={c} strokeWidth={2} opacity={(1 - ring) * 0.8} />
            <g transform={`scale(${s})`}>
              <circle r={r} fill={N.bg} stroke={c} strokeWidth={4} filter="url(#neon-glow)" />
              <circle r={r * 0.35 * (0.8 + 0.2 * pulse(f, 40, i * 9))} fill={c} />
            </g>
            {n.label ? (
              <text y={r + 44} textAnchor="middle" fontFamily={FONT.mono} fontSize={26} fill={N.text} opacity={tween(f, n.at + 6, 10)}>
                {n.label}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
};

/** HUD corner brackets around a box; they slide out from its centre at frame `at`. */
export const Brackets: React.FC<{x: number; y: number; w: number; h: number; at: number; color?: string; len?: number}> = ({x, y, w, h, at, color = N.cyan, len = 34}) => {
  const f = useCurrentFrame();
  const p = tween(f, at, 16, 'expo');
  if (p <= 0) return null;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const corners: [number, number, number, number][] = [
    [x, y, 1, 1],
    [x + w, y, -1, 1],
    [x, y + h, 1, -1],
    [x + w, y + h, -1, -1],
  ];
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
      {corners.map(([X, Y, sx, sy], i) => {
        const px = cx + (X - cx) * p;
        const py = cy + (Y - cy) * p;
        return <path key={i} d={`M${px},${py + sy * len} L${px},${py} L${px + sx * len},${py}`} fill="none" stroke={color} strokeWidth={4} opacity={p} />;
      })}
    </svg>
  );
};

/** Chapter card: grid floor, typed mono kicker, glitching neon title. */
export const NeonChapter: React.FC<ChapterProps> = ({f, lead, kicker, title}) => {
  const out = interpolate(f, [lead - 10, lead], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (out <= 0) return null;
  const n = Math.floor((f / FPS) * 30);
  return (
    <AbsoluteFill style={{opacity: out}}>
      <GridFloor />
      <Glitch at={6} dur={8}>
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', gap: 24, paddingBottom: 120}}>
          <div style={{fontFamily: FONT.mono, fontSize: 30, color: N.lime, letterSpacing: 4}}>{`> ${kicker}`.slice(0, n + 2)}</div>
          <Neon at={6} size={100} color={N.magenta} seed={3}>
            {title}
          </Neon>
        </AbsoluteFill>
      </Glitch>
      <Scanlines />
    </AbsoluteFill>
  );
};

/** Grid-floor night, scanlines over the picture, glass karaoke subtitles. */
export const neon: Look = {
  base: N.bg,
  background: GridFloor,
  overlay: Scanlines,
  chapter: NeonChapter,
  subtitles: {bottom: 54, box: true, karaoke: true, size: 38, color: N.text, boxColor: 'rgba(4,6,14,0.78)', quoteColor: N.magenta, dim: 0.35},
};
