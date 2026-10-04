/** Film pack: cue-driven shots, camera moves, colour grade, grain, letterbox, documentary titles, paper and stamps. */
import React from 'react';
import {interpolate, staticFile, useCurrentFrame} from 'remotion';
import {FPS, HEIGHT} from '../config';
import {drift, eio, rng} from '../core/motion';
import {useSpoken} from '../core/Spoken';
import {C, FONT} from '../core/theme';
import {ease, lerp} from '../core/timeline';

/** letterbox bar height (≈2.2:1 picture at 1080p); picture area is y ∈ [BAR, HEIGHT - BAR] */
export const BAR = Math.round(HEIGHT / 11.25);
export const MID_Y = HEIGHT / 2;

// Shared with every pack; re-exported so film scenes can keep importing them from here.
export {Shots, type Shot, type Tr} from '../core/shots';
export {clamp01, eio, lin, rng} from '../core/motion';

/** Slow camera move across a shot: zoom and drift, eased in-out over the whole shot. */
export const Cam: React.FC<{
  t: number;
  d: number;
  z?: [number, number];
  x?: [number, number];
  y?: [number, number];
  ox?: number;
  oy?: number;
  /** handheld sway in px (0 = locked-off tripod) */
  hand?: number;
  children: React.ReactNode;
}> = ({t, d, z = [1, 1.06], x = [0, 0], y = [0, 0], ox = 50, oy = 50, hand = 0, children}) => {
  const p = eio(t, 0, Math.max(30, d + 20));
  const f = useCurrentFrame();
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        transformOrigin: `${ox}% ${oy}%`,
        transform: `translate(${lerp(p, x[0], x[1])}px, ${lerp(p, y[0], y[1])}px) scale(${lerp(p, z[0], z[1])})${hand ? ` ${drift(f, 7, hand, hand * 0.04, 0.02)}` : ''}`,
      }}
    >
      {children}
    </div>
  );
};

// ───────────────────────── film look ─────────────────────────

/** colour grade: CSS filter on the picture + a tinted overlay */
export type Grade = 'past' | 'warm' | 'cold' | 'dusk' | 'neutral';
export const GRADE: Record<Grade, {filter: string; tint: string; blend: React.CSSProperties['mixBlendMode']}> = {
  past: {filter: 'sepia(0.55) saturate(0.85) contrast(1.06) brightness(0.96)', tint: 'rgba(120,80,30,0.16)', blend: 'multiply'},
  warm: {filter: 'saturate(1.02) contrast(1.04)', tint: 'rgba(255,170,80,0.07)', blend: 'soft-light'},
  cold: {filter: 'saturate(0.85) contrast(1.08)', tint: 'rgba(40,80,140,0.16)', blend: 'soft-light'},
  dusk: {filter: 'saturate(1.08) contrast(1.05)', tint: 'rgba(255,120,60,0.06)', blend: 'soft-light'},
  neutral: {filter: 'none', tint: 'transparent', blend: 'normal'},
};

export const Graded: React.FC<{grade: Grade; children: React.ReactNode}> = ({grade, children}) => {
  const g = GRADE[grade];
  return (
    <div style={{position: 'absolute', inset: 0, filter: g.filter}}>
      {children}
      <div style={{position: 'absolute', inset: 0, background: g.tint, mixBlendMode: g.blend, pointerEvents: 'none'}} />
    </div>
  );
};

export const Grain: React.FC<{amount?: number}> = ({amount = 0.32}) => {
  const f = useCurrentFrame();
  const r = rng(f * 7919 + 13);
  const k = Math.floor(r() * 4);
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `url(${staticFile(`fx/grain${k}.png`)})`,
        backgroundPosition: `${Math.floor(r() * 512)}px ${Math.floor(r() * 512)}px`,
        mixBlendMode: 'overlay',
        opacity: amount,
        pointerEvents: 'none',
      }}
    />
  );
};

export const Vignette: React.FC<{strength?: number}> = ({strength = 0.62}) => {
  const f = useCurrentFrame();
  const flick = 1 + 0.025 * Math.sin(f * 0.9) * Math.sin(f * 0.37);
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(ellipse 75% 70% at 50% 50%, transparent 45%, rgba(0,0,0,${strength * flick}) 100%)`,
        pointerEvents: 'none',
      }}
    />
  );
};

export const Letterbox: React.FC = () => (
  <>
    <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: BAR, background: C.black}} />
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: BAR, background: C.black}} />
  </>
);

// ───────────────────────── text ─────────────────────────

/** Typewriter text: reveals characters from frame `at` at `cps` characters per second. */
export const Type: React.FC<{t: number; at?: number; cps?: number; text: string; style?: React.CSSProperties; caret?: boolean}> = ({
  t,
  at = 0,
  cps = 18,
  text,
  style,
  caret,
}) => {
  const n = Math.max(0, Math.floor(((t - at) / FPS) * cps));
  const shown = text.slice(0, n);
  const typing = n > 0 && n < text.length;
  return (
    <span style={{whiteSpace: 'pre-wrap', ...style}}>
      {shown}
      {caret && (typing || (n >= text.length && Math.floor(t / 15) % 2 === 0)) ? <span style={{opacity: 0.8}}>▍</span> : null}
      <span style={{opacity: 0}}>{text.slice(n)}</span>
    </span>
  );
};

/** Documentary lower-third: a big "year" line and a smaller "place" line, typed in. */
export const Place: React.FC<{t: number; at?: number; year: string; place: string; x?: number; y?: number; color?: string}> = ({
  t,
  at = 8,
  year,
  place,
  x = 120,
  y = 790,
  color = C.ink,
}) => {
  const p = ease(t, at, 20);
  return (
    <div style={{position: 'absolute', left: x, top: y, opacity: p, fontFamily: FONT.serif, color}}>
      <div style={{width: 60 + 140 * p, height: 2, background: C.gold, marginBottom: 14}} />
      <div style={{fontSize: 64, fontWeight: 800, letterSpacing: 4, lineHeight: 1}}>
        <Type t={t} at={at} cps={12} text={year} />
      </div>
      <div style={{fontSize: 30, fontWeight: 500, letterSpacing: 6, marginTop: 12, color: C.muted, fontFamily: FONT.sans}}>
        <Type t={t} at={at + 10} cps={14} text={place} />
      </div>
    </div>
  );
};

/** Small caption label that pops in at (x, y). */
export const Tag: React.FC<{t: number; at?: number; x: number; y: number; text: string; sub?: string; color?: string; align?: 'left' | 'center' | 'right'; size?: number}> = ({
  t,
  at = 0,
  x,
  y,
  text,
  sub,
  color = C.gold,
  align = 'center',
  size = 30,
}) => {
  const p = ease(t, at, 14);
  const tx = align === 'center' ? '-50%' : align === 'right' ? '-100%' : '0';
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(${tx}, ${(1 - p) * 12}px)`,
        opacity: p,
        textAlign: align,
        fontFamily: FONT.sans,
        whiteSpace: 'nowrap',
      }}
    >
      <div style={{fontSize: size, fontWeight: 800, color: C.ink, textShadow: '0 2px 12px rgba(0,0,0,0.8)'}}>{text}</div>
      {sub ? <div style={{fontSize: size * 0.66, color, marginTop: 4, fontWeight: 600, textShadow: '0 2px 10px rgba(0,0,0,0.8)'}}>{sub}</div> : null}
    </div>
  );
};

/** Big serif line centred in the picture (titles, punchlines). */
export const Line: React.FC<{t: number; at?: number; text: React.ReactNode; size?: number; y?: number; color?: string; sub?: React.ReactNode; dur?: number}> = ({
  t,
  at = 0,
  text,
  size = 76,
  y = MID_Y,
  color = C.ink,
  sub,
  dur = 22,
}) => {
  const p = ease(t, at, dur);
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: y,
        transform: `translateY(-50%) translateY(${(1 - p) * 16}px)`,
        textAlign: 'center',
        opacity: p,
        fontFamily: FONT.serif,
      }}
    >
      <div style={{fontSize: size, fontWeight: 800, color, letterSpacing: 4, lineHeight: 1.3, textShadow: '0 4px 30px rgba(0,0,0,0.7)'}}>{text}</div>
      {sub ? <div style={{fontSize: size * 0.4, color: C.muted, marginTop: 18, fontFamily: FONT.sans, letterSpacing: 3}}>{sub}</div> : null}
    </div>
  );
};

/**
 * Quote revealed character by character, big serif with corner brackets. Use "\n" for line breaks.
 * With `spoken`, each character appears exactly when the narrator (or the quote voice) says it,
 * instead of at a fixed `cps` — the text must then match the narration.
 */
export const BigQuote: React.FC<{t: number; at?: number; text: string; who?: string; cps?: number; size?: number; color?: string; y?: number; spoken?: boolean}> = ({
  t,
  at = 0,
  text,
  who,
  cps = 7,
  size = 86,
  color = C.ink,
  y = MID_Y,
  spoken,
}) => {
  const f = useCurrentFrame();
  const {chars} = useSpoken();
  const flat = text.replace(/\n/g, '');
  // shown[i]: 0..1 visibility of character i
  const spokenAt = spoken ? chars(text) : null;
  const shown = flat.split('').map((_, i) =>
    spokenAt ? ease(f, spokenAt[i] - 2, 8) : i < Math.floor(((t - at) / FPS) * cps) ? 1 : 0,
  );
  const done = shown[shown.length - 1] >= 1;
  // the opening bracket shows up front, so the frame isn't empty while the narrator leads into the quote
  const first = ease(t, at - 6, 10);
  let k = 0;
  const rows = text.split('\n');
  return (
    <div style={{position: 'absolute', left: 120, right: 120, top: y, transform: 'translateY(-50%)', textAlign: 'center', fontFamily: FONT.serif}}>
      <div style={{fontSize: size, fontWeight: 800, color, lineHeight: 1.45, letterSpacing: 6}}>
        {rows.map((row, ri) => (
          <div key={ri}>
            {ri === 0 ? <span style={{color: C.gold, opacity: first}}>「</span> : null}
            {row.split('').map((ch) => {
              const i = k++;
              const v = shown[i];
              return (
                <span key={i} style={{display: 'inline-block', opacity: v, filter: v < 1 ? `blur(${(1 - v) * 8}px)` : 'none', transform: `translateY(${(1 - v) * 0.18}em)`}}>
                  {ch}
                </span>
              );
            })}
            {ri === rows.length - 1 ? <span style={{color: C.gold, opacity: done ? 1 : 0}}>」</span> : null}
          </div>
        ))}
      </div>
      {who ? (
        <div style={{fontSize: 32, color: C.muted, marginTop: 30, fontFamily: FONT.sans, letterSpacing: 4, opacity: ease(t, at + 10, 20)}}>— {who}</div>
      ) : null}
    </div>
  );
};

// ───────────────────────── paper ─────────────────────────

/** A sheet of paper that slides in at frame `at`; put any content inside. */
export const Paper: React.FC<{
  x: number;
  y: number;
  w: number;
  h?: number;
  rot?: number;
  t?: number;
  at?: number;
  tone?: string;
  pad?: number;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}> = ({x, y, w, h, rot = 0, t = 99, at = 0, tone = C.paper, pad = 44, children, style}) => {
  const p = ease(t, at, 18);
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        height: h,
        padding: pad,
        boxSizing: 'border-box',
        background: `linear-gradient(135deg, ${tone} 0%, ${tone} 60%, #e2d6bb 100%)`,
        color: C.paperInk,
        fontFamily: FONT.serif,
        boxShadow: '0 30px 70px rgba(0,0,0,0.55), 0 4px 10px rgba(0,0,0,0.35)',
        transform: `translateY(${(1 - p) * 60}px) rotate(${rot + (1 - p) * 3}deg)`,
        opacity: p,
        overflow: 'hidden',
        ...style,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${staticFile('fx/paper.png')})`,
          mixBlendMode: 'multiply',
          opacity: 0.35,
          pointerEvents: 'none',
        }}
      />
      <div style={{position: 'relative'}}>{children}</div>
    </div>
  );
};

/** Rubber stamp that slams down at frame `at`. (x, y) is its centre. */
export const Stamp: React.FC<{t: number; at: number; text: string; color?: string; x: number; y: number; rot?: number; size?: number; sub?: string}> = ({
  t,
  at,
  text,
  color = C.stamp,
  x,
  y,
  rot = -8,
  size = 58,
  sub,
}) => {
  if (t < at) return null;
  const k = t - at;
  const s = interpolate(k, [0, 5, 9], [2.4, 0.94, 1], {extrapolateRight: 'clamp'});
  const op = interpolate(k, [0, 4], [0, 0.9], {extrapolateRight: 'clamp'});
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${s})`,
        opacity: op,
        border: `5px solid ${color}`,
        borderRadius: 10,
        padding: '8px 22px',
        color,
        fontFamily: FONT.serif,
        fontWeight: 900,
        fontSize: size,
        letterSpacing: 6,
        textAlign: 'center',
        whiteSpace: 'nowrap',
        mixBlendMode: 'multiply',
        maskImage: `url(${staticFile('fx/grain1.png')})`,
        WebkitMaskImage: `url(${staticFile('fx/grain1.png')})`,
        maskSize: '256px',
        WebkitMaskSize: '256px',
      }}
    >
      {text}
      {sub ? <div style={{fontSize: size * 0.36, letterSpacing: 3, fontWeight: 700}}>{sub}</div> : null}
    </div>
  );
};

/** Hand-drawn marker highlight behind text (on paper). */
export const Mark: React.FC<{t: number; at: number; children: React.ReactNode; color?: string}> = ({t, at, children, color = 'rgba(233,185,73,0.55)'}) => {
  const p = ease(t, at, 14);
  return (
    <span style={{position: 'relative', display: 'inline-block'}}>
      <span
        style={{
          position: 'absolute',
          left: -6,
          top: '18%',
          height: '72%',
          width: `calc(${p * 100}% + 12px)`,
          background: color,
          borderRadius: 4,
          transform: 'skewX(-8deg)',
        }}
      />
      <span style={{position: 'relative'}}>{children}</span>
    </span>
  );
};

/** Chapter card at the start of a scene: black, small kicker, big serif title. */
export const Chapter: React.FC<{f: number; lead: number; kicker: string; title: string}> = ({f, lead, kicker, title}) => {
  const out = 1 - ease(f, lead - 6, 16);
  const p = ease(f, 2, 16);
  if (out <= 0) return null;
  return (
    <div style={{position: 'absolute', inset: 0, background: C.black, opacity: out, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
      <div style={{fontFamily: FONT.sans, fontSize: 28, letterSpacing: 14, color: C.gold, opacity: p}}>{kicker}</div>
      <div style={{width: 80 * p, height: 1.5, background: C.gold, margin: '22px 0', opacity: 0.7}} />
      <div style={{fontFamily: FONT.serif, fontSize: 84, fontWeight: 800, color: C.ink, letterSpacing: 10, opacity: ease(f, 6, 18)}}>{title}</div>
    </div>
  );
};
