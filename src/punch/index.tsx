/**
 * Punch style pack: modern kinetic type for short ads and brand films — words that slam in on the beat with squash and
 * an RGB split, crop-mark HUD, marquee bands, a rotating text badge, a product carousel with motion blur, type filled
 * with a moving pattern, a logo that draws itself and fills, and a CTA bar. Works in narrated scenes (export `punch`
 * is a Look) and in the beat-timed promo (src/promo). Every prop takes scene-local frames. Delete this folder if unused.
 */
import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import type {ChapterProps, Look} from '../core/look';
import {clamp01, land, noise, squash, tween} from '../core/motion';
import {FONT, themed} from '../core/theme';

export const PU = themed('punch', {
  ink: '#0F2219',
  deep: '#345E46',
  sage: '#B7C680',
  paper: '#F3F0E6',
  hot: '#FF5B1F',
  sun: '#FFD21F',
  sky: '#2EC4FF',
}, {accent: ['hot'], accent2: ['sage']});

const MONO = FONT.mono;

// ───────────────────────── type ─────────────────────────

/**
 * A word that lands exactly on frame `at`: it falls in from `from`× size during the `dur` frames before (ease-in, so
 * the impact is on the beat, not the start), squashes on impact, and with `split` shows two offset colour ghosts
 * jittering for a few frames (an RGB-split glitch). Anchor is the left edge unless `align="center"`.
 */
export const Slam: React.FC<{
  at: number;
  children: React.ReactNode;
  size?: number;
  color?: string;
  weight?: number;
  from?: number;
  dur?: number;
  amt?: number;
  split?: [string, string];
  splitFrames?: number;
  align?: 'left' | 'center';
  mono?: boolean;
  tracking?: number;
  style?: React.CSSProperties;
}> = ({at, children, size = 200, color = PU.paper, weight = 900, from = 1.6, dur = 5, amt = 0.14, split, splitFrames = 8, align = 'left', mono, tracking = -0.03, style}) => {
  const f = useCurrentFrame();
  const p = land(f, at, dur);
  if (p <= 0) return null;
  const [sx, sy] = squash(f, at, amt);
  const k = from + (1 - from) * p;
  const origin = align === 'center' ? '50% 70%' : '0% 70%';
  const text: React.CSSProperties = {
    fontFamily: mono ? MONO : FONT.sans,
    fontSize: size,
    fontWeight: weight,
    lineHeight: 1,
    letterSpacing: `${tracking}em`,
    whiteSpace: 'nowrap',
  };
  const ghosts = split && f >= at && f < at + splitFrames
    ? split.map((c, i) => {
        const jx = noise(11 + i * 7, f * 1.7) * size * 0.12;
        const jy = noise(23 + i * 5, f * 1.3) * size * 0.04;
        return (
          <div key={i} style={{...text, position: 'absolute', left: 0, top: 0, color: c, transform: `translate(${jx}px, ${jy}px)`, opacity: 0.9}}>
            {children}
          </div>
        );
      })
    : null;
  return (
    <div style={{position: 'relative', transformOrigin: origin, transform: `scale(${k * sx}, ${k * sy})`, opacity: Math.min(1, p * 3), ...style}}>
      {ghosts}
      <div style={{...text, position: 'relative', color}}>{children}</div>
    </div>
  );
};

/** Small monospace label (HUD, captions under big type). Fades in at `at`, with letter-spacing settling. */
export const Mono: React.FC<{at?: number; children: React.ReactNode; size?: number; color?: string; style?: React.CSSProperties}> = ({at = 0, children, size = 30, color = PU.paper, style}) => {
  const f = useCurrentFrame();
  const p = tween(f, at, 10, 'expo');
  return (
    <div style={{fontFamily: MONO, fontWeight: 600, fontSize: size, color, letterSpacing: `${0.12 + (1 - p) * 0.4}em`, opacity: p, whiteSpace: 'nowrap', ...style}}>
      {children}
    </div>
  );
};

/**
 * Big type filled with a moving pattern (CSS background-clip: text). `tile` is an SVG string (w × h) repeated as the
 * fill; `stroke` outlines the glyphs so they stay readable where the pattern is light.
 */
export const PatternText: React.FC<{
  children: React.ReactNode;
  tile: {svg: string; w: number; h: number};
  size?: number;
  stroke?: string;
  speed?: [number, number];
  style?: React.CSSProperties;
}> = ({children, tile, size = 360, stroke = PU.ink, speed = [-4, 5], style}) => {
  const f = useCurrentFrame();
  const url = `url("data:image/svg+xml;utf8,${encodeURIComponent(tile.svg)}")`;
  return (
    <div
      style={{
        fontFamily: FONT.sans,
        fontWeight: 900,
        fontSize: size,
        lineHeight: 1,
        backgroundImage: url,
        backgroundSize: `${tile.w}px ${tile.h}px`,
        backgroundPosition: `${f * speed[0]}px ${f * speed[1]}px`,
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
        WebkitTextStroke: `${Math.max(2, size / 70)}px ${stroke}`,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** a pattern tile of flat discs in the given colours on a ground colour (for PatternText) */
export const dotTile = (ground: string, colors: string[], w = 240) => {
  const r = w / 4.4;
  const pos = [[w / 4, w / 4], [(3 * w) / 4, (3 * w) / 4], [(3 * w) / 4, w / 4], [w / 4, (3 * w) / 4]];
  const discs = pos
    .map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${colors[i % colors.length]}"/><circle cx="${x}" cy="${y}" r="${r * 0.42}" fill="${ground}" opacity="0.35"/>`)
    .join('');
  return {svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${w}"><rect width="${w}" height="${w}" fill="${ground}"/>${discs}</svg>`, w, h: w};
};

/** Children revealed by a clip that wipes in from the left over `dur` frames starting at `at`. */
export const Wipe: React.FC<{at: number; dur?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({at, dur = 12, children, style}) => {
  const f = useCurrentFrame();
  const p = tween(f, at, dur, 'inOut');
  return <div style={{clipPath: `inset(-20% ${(1 - p) * 100}% -20% -5%)`, ...style}}>{children}</div>;
};

// ───────────────────────── frame furniture ─────────────────────────

/** Four corner crop marks. */
export const CropMarks: React.FC<{color?: string; inset?: number; arm?: number; width?: number}> = ({color = PU.paper, inset = 40, arm = 46, width = 4}) => {
  const {width: W, height: H} = useVideoConfig();
  const corner = (x: number, y: number, sx: number, sy: number) => `M${x} ${y + sy * arm} L${x} ${y} L${x + sx * arm} ${y}`;
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
      <path d={[corner(inset, inset, 1, 1), corner(W - inset, inset, -1, 1), corner(inset, H - inset, 1, -1), corner(W - inset, H - inset, -1, -1)].join(' ')} fill="none" stroke={color} strokeWidth={width} />
    </svg>
  );
};

/** Crop marks + monospace labels top-left / top-right / bottom-left + a progress line (0..1). */
export const Hud: React.FC<{color?: string; left?: string; right?: string; bottom?: string; progress?: number; size?: number}> = ({color = PU.paper, left, right, bottom, progress, size = 28}) => {
  const {width: W} = useVideoConfig();
  const lab: React.CSSProperties = {position: 'absolute', fontFamily: MONO, fontWeight: 600, fontSize: size, color, letterSpacing: '0.08em', whiteSpace: 'nowrap'};
  return (
    <AbsoluteFill>
      <CropMarks color={color} />
      {left ? <div style={{...lab, left: 72, top: 84}}>{left}</div> : null}
      {right ? <div style={{...lab, right: 72, top: 84}}>{right}</div> : null}
      {bottom ? <div style={{...lab, left: 72, bottom: 86, fontSize: size * 0.86, opacity: 0.8}}>{bottom}</div> : null}
      {progress !== undefined ? (
        <>
          <div style={{position: 'absolute', left: 72, right: 72, bottom: 66, height: 4, background: color, opacity: 0.25}} />
          <div style={{position: 'absolute', left: 72, bottom: 66, height: 4, width: (W - 144) * clamp01(progress), background: color}} />
        </>
      ) : null}
    </AbsoluteFill>
  );
};

/**
 * A rotated band of repeated text scrolling sideways. Slides in along its own axis at `at`, folds shut (scaleY → 0)
 * at `out`. `y` is the band's centre line.
 */
export const Marquee: React.FC<{
  at: number;
  out?: number;
  y: number;
  text: string;
  rot?: number;
  bg?: string;
  color?: string;
  size?: number;
  speed?: number;
  dir?: 1 | -1;
  height?: number;
  mono?: boolean;
}> = ({at, out, y, text, rot = -12, bg = PU.sage, color = PU.ink, size = 92, speed = 9, dir = 1, height = 176, mono}) => {
  const f = useCurrentFrame();
  const {width: W} = useVideoConfig();
  if (f < at) return null;
  const p = tween(f, at, 9, 'expo');
  const q = out === undefined ? 0 : tween(f, out, 6, 'in');
  if (q >= 1) return null;
  const shift = (1 - p) * -2600 * dir;
  const scroll = -(f - at) * speed * dir;
  return (
    <div
      style={{
        position: 'absolute',
        left: W / 2 - 1800,
        top: y - height / 2,
        width: 3600,
        height,
        background: bg,
        transform: `rotate(${rot}deg) translateX(${shift}px) scaleY(${1 - q})`,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <div style={{fontFamily: mono ? MONO : FONT.sans, fontWeight: 900, fontSize: size, color, whiteSpace: 'nowrap', transform: `translateX(${scroll - 600}px)`}}>
        {text.repeat(Math.ceil(5200 / Math.max(1, text.length * size * 0.8)) + 2)}
      </div>
    </div>
  );
};

/** Text set on a circle, spinning in at `at` and turning slowly after (a "badge" around a logo). */
export const Badge: React.FC<{at: number; x: number; y: number; r: number; text: string; color?: string; size?: number; speed?: number}> = ({at, x, y, r, text, color = PU.ink, size = 30, speed = 0.35}) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const p = tween(f, at, 24, 'expo');
  const rot = -120 * (1 - p) + (f - at) * speed;
  const id = `badge-${Math.round(x)}-${Math.round(y)}-${r}`;
  return (
    <svg style={{position: 'absolute', left: x - r - size, top: y - r - size, overflow: 'visible'}} width={2 * (r + size)} height={2 * (r + size)}>
      <g transform={`translate(${r + size} ${r + size}) rotate(${rot}) scale(${0.85 + 0.15 * p})`} opacity={p}>
        <path id={id} d={`M0 ${-r} A${r} ${r} 0 1 1 -0.01 ${-r}`} fill="none" />
        <text fontFamily={MONO} fontWeight={600} fontSize={size} fill={color}>
          <textPath href={`#${id}`} textLength={2 * Math.PI * r - size * 0.5} lengthAdjust="spacing">
            {text}
          </textPath>
        </text>
      </g>
    </svg>
  );
};

/**
 * Product carousel: cards in a row, one centred at a time. It slides in from the right at `at` and moves one card on
 * at each frame in `steps`, with horizontal motion blur while moving.
 */
export const CardStrip: React.FC<{at: number; steps: number[]; cards: React.ReactNode[]; y: number; w?: number; h?: number; gap?: number}> = ({at, steps, cards, y, w = 700, h = 1180, gap = 60}) => {
  const f = useCurrentFrame();
  const {width: W} = useVideoConfig();
  // each move takes 4 frames and lands on its step frame, so even on 8th notes the card rests for a moment
  const pos = (fr: number) => steps.reduce((a, s) => a + tween(fr, s - 3, 4, 'inOut'), 0) - (1 - tween(fr, at, 8, 'expo')) * (W / (w + gap));
  const x = (fr: number) => -pos(fr) * (w + gap);
  const v = Math.abs(x(f) - x(f - 1));
  // blur only while moving fast; a card at rest must be sharp
  const blur = v > 24 ? Math.min(46, (v - 24) * 0.3) : 0;
  const fid = `cardblur-${Math.round(y)}`;
  return (
    <>
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <filter id={fid} x="-20%" y="-5%" width="140%" height="110%">
          <feGaussianBlur stdDeviation={`${blur.toFixed(1)} 0`} />
        </filter>
      </svg>
      <div style={{position: 'absolute', left: 0, top: y, width: W, height: h, filter: blur > 0.5 ? `url(#${fid})` : undefined}}>
        {cards.map((c, i) => (
          <div key={i} style={{position: 'absolute', left: W / 2 - w / 2 + i * (w + gap) + x(f), top: 0, width: w, height: h}}>
            {c}
          </div>
        ))}
      </div>
    </>
  );
};

// ───────────────────────── logo, CTA ─────────────────────────

export type LogoData = {width: number; height: number; parts: {name: string; d: string; fill: string}[]};

/**
 * A logo (src/brand/logo.json, or any tools/trace-logo.py output) that draws its outline from `draw`, fills at `fill`
 * with a bloom, and drops the parts named in `drop` from above so they land on `fill` + `dropLag` (no outline for those).
 * `size` is the rendered width; (x, y) the centre.
 */
export const LogoReveal: React.FC<{
  logo: LogoData;
  x: number;
  y: number;
  size: number;
  draw: number;
  fill: number;
  drawDur?: number;
  drop?: string[];
  dropLag?: number;
  /** parts already in place and filled (e.g. the part that dropped in during the previous scene) */
  landed?: string[];
  stroke?: string;
  scale?: number;
}> = ({logo, x, y, size, draw, fill, drawDur = 18, drop = [], dropLag = 0, landed = [], stroke = '#ffffff', scale = 1}) => {
  const f = useCurrentFrame();
  const k = size / logo.width;
  const pd = tween(f, draw, drawDur, 'inOut');
  const pf = tween(f, fill, 5, 'out');
  const bloom = f >= fill ? Math.exp(-(f - fill) / 10) : 0;
  const pop = f >= fill ? 1 + 0.16 * Math.exp(-(f - fill) / 5) * Math.cos((f - fill) / 2.2) : 1;
  return (
    <svg
      style={{position: 'absolute', left: x - size / 2, top: y - (logo.height * k) / 2, overflow: 'visible', transform: `scale(${pop * scale})`, transformOrigin: '50% 50%'}}
      width={size}
      height={logo.height * k}
      viewBox={`0 0 ${logo.width} ${logo.height}`}
    >
      <defs>
        <filter id="logo-bloom" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={logo.width / 40} />
        </filter>
      </defs>
      {logo.parts.map((p, i) => {
        const dropping = drop.includes(p.name) || landed.includes(p.name);
        const lp = landed.includes(p.name) ? 1 : dropping ? land(f, fill + dropLag, 6) : 1;
        if (dropping && lp <= 0) return null;
        const dy = dropping ? -(1 - lp) * logo.height * 2 : 0;
        return (
          <g key={i} transform={`translate(0 ${dy})`}>
            {bloom > 0.02 && !dropping ? <path d={p.d} fill="#ffffff" opacity={bloom * 0.9} filter="url(#logo-bloom)" /> : null}
            <path
              d={p.d}
              fill={p.fill}
              fillOpacity={dropping ? 1 : pf}
              stroke={stroke}
              strokeWidth={logo.width / 90}
              strokeOpacity={dropping ? 0 : (1 - pf) * (pd > 0 ? 1 : 0)}
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - pd}
            />
          </g>
        );
      })}
    </svg>
  );
};

/** Full-width bar that pushes up from below at `at` with a scrolling call to action. */
export const CtaBar: React.FC<{at: number; y: number; text: string; height?: number; bg?: string; color?: string; size?: number; speed?: number}> = ({at, y, text, height = 170, bg = PU.ink, color = PU.paper, size = 72, speed = 5}) => {
  const f = useCurrentFrame();
  const {width: W, height: H} = useVideoConfig();
  if (f < at) return null;
  const p = tween(f, at, 12, 'expo');
  return (
    <div style={{position: 'absolute', left: 0, top: y + (1 - p) * (H - y + 20), width: W, height, background: bg, overflow: 'hidden', display: 'flex', alignItems: 'center'}}>
      <div style={{fontFamily: FONT.sans, fontWeight: 900, fontSize: size, color, whiteSpace: 'nowrap', transform: `translateX(${-(f - at) * speed}px)`}}>{text.repeat(8)}</div>
    </div>
  );
};

// ───────────────────────── look ─────────────────────────

/** Dark ground with a faint grid that drifts. */
export const PunchGround: React.FC<{color?: string; line?: string}> = ({color = PU.ink, line = 'rgba(243,240,230,0.05)'}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: color}}>
      <AbsoluteFill style={{backgroundImage: `linear-gradient(${line} 1px, transparent 1px), linear-gradient(90deg, ${line} 1px, transparent 1px)`, backgroundSize: '64px 64px', backgroundPosition: `${f * 0.4}px ${f * 0.25}px`}} />
    </AbsoluteFill>
  );
};

const PunchChapter: React.FC<ChapterProps> = ({f, lead, kicker, title}) => {
  const out = tween(f, lead - 8, 8, 'in');
  return (
    <AbsoluteFill style={{background: PU.ink, opacity: 1 - out, padding: '0 140px', justifyContent: 'center'}}>
      {kicker ? <Mono at={2} color={PU.hot} size={34}>{kicker}</Mono> : null}
      <div style={{marginTop: 24}}>
        <Slam at={10} size={140} color={PU.paper}>
          {title}
        </Slam>
      </div>
    </AbsoluteFill>
  );
};

export const punch: Look = {
  base: PU.ink,
  background: () => <PunchGround />,
  frame: () => <CropMarks color="rgba(243,240,230,0.6)" />,
  chapter: PunchChapter,
  subtitles: {bottom: 70, box: true, boxColor: 'rgba(15,34,25,0.86)', color: PU.paper, quoteColor: PU.hot, size: 40},
};
