/** Editorial style pack: magazine layout and kinetic type — huge headlines masked up line by line, colour blocks that wipe, rules, a ticker. Delete this folder if unused. */
import React from 'react';
import {AbsoluteFill, interpolate, staticFile, useCurrentFrame} from 'remotion';
import type {ChapterProps, Look} from '../core/look';
import {EASE, punch, tween} from '../core/motion';
import {FONT} from '../core/theme';

export const E = {
  paper: '#F1ECE2',
  ink: '#121212',
  red: '#E4322B',
  grey: '#8B857A',
  rule: 'rgba(18,18,18,0.85)',
};

/** Flat newsprint with faint column guides and a little grain. */
export const EdGround: React.FC = () => (
  <AbsoluteFill style={{background: E.paper}}>
    <AbsoluteFill
      style={{
        backgroundImage: 'linear-gradient(90deg, rgba(18,18,18,0.05) 1px, transparent 1px)',
        backgroundSize: '160px 100%',
        backgroundPosition: '0 0',
      }}
    />
    <AbsoluteFill style={{backgroundImage: `url(${staticFile('fx/grain2.png')})`, mixBlendMode: 'multiply', opacity: 0.12}} />
  </AbsoluteFill>
);

/**
 * Kinetic headline: each line slides up from behind its own mask, staggered by `gap` frames.
 * With `out`, lines continue upward out of the mask in the same order.
 */
export const MaskText: React.FC<{
  at: number;
  out?: number;
  lines: React.ReactNode[];
  size?: number;
  weight?: number;
  color?: string;
  gap?: number;
  lh?: number;
  serif?: boolean;
  align?: React.CSSProperties['textAlign'];
  style?: React.CSSProperties;
}> = ({at, out, lines, size = 120, weight = 900, color = E.ink, gap = 5, lh = 1.12, serif = false, align = 'left', style}) => {
  const f = useCurrentFrame();
  return (
    <div style={{fontFamily: serif ? FONT.serif : FONT.sans, fontSize: size, fontWeight: weight, color, lineHeight: lh, textAlign: align, letterSpacing: -1, ...style}}>
      {lines.map((ln, i) => {
        const p = tween(f, at + i * gap, 20, 'expo');
        const q = out === undefined ? 0 : tween(f, out + i * gap, 14, 'in');
        return (
          <div key={i} style={{overflow: 'hidden', paddingBottom: size * 0.06}}>
            <div style={{transform: `translateY(${(1 - p) * 110 - q * 110}%)`, whiteSpace: 'nowrap'}}>{ln}</div>
          </div>
        );
      })}
    </div>
  );
};

/** A word that slams in (big → settle) at `at`, with optional punches when later words are said. */
export const Slam: React.FC<{at: number; children: React.ReactNode; size?: number; color?: string; hits?: number[]; style?: React.CSSProperties}> = ({
  at,
  children,
  size = 260,
  color = E.ink,
  hits = [],
  style,
}) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const p = tween(f, at, 12, 'expo');
  const s = 1.7 - 0.7 * p;
  const k = hits.reduce((acc, h) => acc * punch(f, h, 0.06), 1);
  return (
    <div
      style={{
        fontFamily: FONT.sans,
        fontSize: size,
        fontWeight: 900,
        color,
        lineHeight: 1,
        letterSpacing: -4,
        transform: `scale(${s * k})`,
        opacity: Math.min(1, p * 3),
        filter: p < 1 ? `blur(${(1 - p) * 10}px)` : undefined,
        fontVariantNumeric: 'tabular-nums',
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/**
 * Colour block that wipes in from `from` at `at`; with `out` it wipes away toward the opposite side,
 * so it reads as one sweep across the frame.
 */
export const Block: React.FC<{x: number; y: number; w: number; h: number; at: number; out?: number; color?: string; from?: 'left' | 'right' | 'top' | 'bottom'; dur?: number; children?: React.ReactNode}> = ({
  x,
  y,
  w,
  h,
  at,
  out,
  color = E.red,
  from = 'left',
  dur = 16,
  children,
}) => {
  const f = useCurrentFrame();
  const p = tween(f, at, dur, 'inOut');
  const q = out === undefined ? 0 : tween(f, out, dur, 'inOut');
  if (p <= 0 || q >= 1) return null;
  const horiz = from === 'left' || from === 'right';
  const start = {left: 'left', right: 'right', top: 'top', bottom: 'bottom'}[from];
  const end = {left: 'right', right: 'left', top: 'bottom', bottom: 'top'}[from];
  const k = q > 0 ? 1 - q : p;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        height: h,
        background: color,
        transformOrigin: q > 0 ? end : start,
        transform: horiz ? `scaleX(${k})` : `scaleY(${k})`,
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  );
};

/** Horizontal rule that draws from the left at `at`. */
export const Rule: React.FC<{x: number; y: number; w: number; at: number; color?: string; thick?: number}> = ({x, y, w, at, color = E.rule, thick = 3}) => {
  const f = useCurrentFrame();
  const p = tween(f, at, 22, 'expo');
  return <div style={{position: 'absolute', left: x, top: y, width: w * p, height: thick, background: color}} />;
};

/** Small tracked-out label, e.g. "No. 05 — STYLE". */
export const Label: React.FC<{children: React.ReactNode; color?: string; size?: number; style?: React.CSSProperties}> = ({children, color = E.red, size = 26, style}) => (
  <div style={{fontFamily: FONT.sans, fontSize: size, fontWeight: 800, letterSpacing: 8, color, ...style}}>{children}</div>
);

/** Endless marquee band: text scrolls across forever (idle motion that never freezes). */
export const Ticker: React.FC<{y: number; text: string; at?: number; color?: string; bg?: string; size?: number; speed?: number; h?: number}> = ({
  y,
  text,
  at = 0,
  color = E.paper,
  bg = E.ink,
  size = 34,
  speed = 3,
  h = 70,
}) => {
  const f = useCurrentFrame();
  const p = tween(f, at, 16, 'inOut');
  const unit = `${text}　✱　`;
  const approxW = unit.length * size;
  const off = -((f * speed) % approxW);
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: y, height: h, background: bg, overflow: 'hidden', clipPath: `inset(0 ${(1 - p) * 100}% 0 0)`}}>
      <div style={{position: 'absolute', left: off, top: 0, height: h, display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', fontFamily: FONT.sans, fontWeight: 800, fontSize: size, color, letterSpacing: 4}}>
        {Array.from({length: 8}, () => unit).join('')}
      </div>
    </div>
  );
};

/** Chapter card: red block sweeps across, kicker label, title masks up in heavy type. */
export const EdChapter: React.FC<ChapterProps> = ({f, lead, kicker, title}) => {
  const out = interpolate(f, [lead - 8, lead], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (out <= 0) return null;
  const sweep = EASE.inOut(Math.min(1, f / 18));
  return (
    <AbsoluteFill style={{opacity: out}}>
      <EdGround />
      <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: 1920 * sweep, background: E.red, opacity: 1 - tween(f, 20, 14)}} />
      {/* same masthead positions as a typical editorial scene (label, rule, headline), so the cut into the scene feels continuous */}
      <div style={{position: 'absolute', left: 160, top: 130}}>
        <Label>{kicker}</Label>
      </div>
      <Rule x={160} y={190} w={1600} at={10} />
      <div style={{position: 'absolute', left: 150, top: 240}}>
        <MaskText at={14} lines={[title]} size={200} />
      </div>
    </AbsoluteFill>
  );
};

/** Newsprint ground, kinetic chapter card, solid ink subtitles. */
export const editorial: Look = {
  base: E.paper,
  background: EdGround,
  chapter: EdChapter,
  subtitles: {bottom: 54, box: true, karaoke: true, size: 38, color: E.paper, boxColor: E.ink, quoteColor: '#FF6B5E', dim: 0.4},
};
