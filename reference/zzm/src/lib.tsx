import React, {createContext, useContext, useMemo} from 'react';
import {Easing, interpolate, spring, useCurrentFrame} from 'remotion';
import timingsZh from './timings.json';
import pace from './pace.json';
import {C, FONT} from './theme';

export const FPS = 30;
/** frames before narration starts (chapter card) and after it ends (hook beat), per scene */
export const leadOf = (id: string) => (pace.leadOverride as Record<string, number>)[id] ?? pace.lead;
export const tailOf = (id: string) => (pace.tailOverride as Record<string, number>)[id] ?? pace.tail;

export type Lang = 'zh' | 'en';
type Timings = Record<string, {chapter: string; duration: number; cues: Record<string, number>; lines: any[]}>;
export const TIMINGS: Record<Lang, Timings> = {zh: timingsZh as unknown as Timings, en: timingsZh as unknown as Timings};
export const SCENE_IDS = Object.keys(TIMINGS.zh);
export const sceneFrames = (id: string, lang: Lang) => leadOf(id) + Math.ceil(TIMINGS[lang][id].duration * FPS) + tailOf(id);
export const narrEnd = (id: string) => leadOf(id) + Math.ceil(TIMINGS.zh[id].duration * FPS);

const SceneCtx = createContext<{id: string; lang: Lang}>({id: 's01', lang: 'zh'});
export const SceneProvider = SceneCtx.Provider;
export const useLang = () => useContext(SceneCtx).lang;
/** pick the Chinese or English variant of any value */
export const pick = <V,>(lang: Lang, zh: V, en: V): V => (lang === 'en' ? en : zh);

export const useScene = () => {
  const {id, lang} = useContext(SceneCtx);
  const f = useCurrentFrame();
  const T = TIMINGS[lang];
  const c = (k: string) => {
    const v = T[id].cues[k];
    if (v === undefined) throw new Error(`cue ${k} missing in ${id} (${lang})`);
    return leadOf(id) + Math.round(v * FPS);
  };
  const L = <V,>(zh: V, en: V): V => (lang === 'en' ? en : zh);
  /** frame at which the narrator starts saying `sub` (n-th occurrence, 0-based) in this scene */
  const w = (sub: string, nth = 0) => {
    let k = 0;
    for (const ln of T[id].lines) {
      let from = 0;
      for (;;) {
        const idx = ln.text.indexOf(sub, from);
        if (idx < 0) break;
        if (k++ === nth) {
          const word = ln.words.find((x: any) => x.e > idx) ?? ln.words[ln.words.length - 1];
          return leadOf(id) + Math.round((word ? word.t : ln.start) * FPS);
        }
        from = idx + 1;
      }
    }
    throw new Error(`"${sub}" not found in ${id}`);
  };
  /** frames from cue `cue` until the narrator first says `sub` at or after that cue */
  const rel = (sub: string, cue: string) => {
    const c0 = c(cue);
    let n = 0;
    for (;;) {
      const fr = w(sub, n++);
      if (fr >= c0 - 2) return fr - c0;
    }
  };
  return {f, c, w, rel, id, lang, L, en: lang === 'en', total: sceneFrames(id, lang), end: narrEnd(id), lead: leadOf(id)};
};

const EASE = Easing.bezier(0.16, 0.84, 0.24, 1);
/** 0→1 eased progress starting at frame `at`. */
export const ease = (f: number, at: number, dur = 18) =>
  interpolate(f, [at, at + dur], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE});
/** springy 0→1 (slight overshoot). */
export const pop = (f: number, at: number) =>
  f < at ? 0 : spring({frame: f - at, fps: FPS, config: {damping: 13, stiffness: 140, mass: 0.8}});
/** fade-up style. */
export const fu = (p: number, dy = 28): React.CSSProperties => ({
  opacity: p,
  transform: `translateY(${(1 - p) * dy}px)`,
});
/** progress between two cues, for moving things. */
export const lerp = (p: number, a: number, b: number) => a + (b - a) * p;

export const Kicker: React.FC<{children: React.ReactNode; color?: string; style?: React.CSSProperties}> = ({
  children,
  color = C.orange,
  style,
}) => (
  <div style={{fontFamily: FONT.sans, fontSize: 26, fontWeight: 700, letterSpacing: 6, color, ...style}}>{children}</div>
);

export const H: React.FC<{children: React.ReactNode; size?: number; style?: React.CSSProperties; serif?: boolean}> = ({
  children,
  size = 64,
  style,
  serif,
}) => (
  <div
    style={{
      fontFamily: serif ? FONT.serif : FONT.sans,
      fontSize: size,
      fontWeight: serif ? 800 : 800,
      color: C.ink,
      lineHeight: 1.25,
      ...style,
    }}
  >
    {children}
  </div>
);

export const Panel: React.FC<{children: React.ReactNode; style?: React.CSSProperties; accent?: string}> = ({
  children,
  style,
  accent,
}) => (
  <div
    style={{
      background: C.panel,
      border: `1.5px solid ${accent ?? C.panelLine}`,
      borderRadius: 22,
      padding: '26px 32px',
      boxShadow: accent ? `0 0 40px ${accent}33` : undefined,
      fontFamily: FONT.sans,
      color: C.ink,
      ...style,
    }}
  >
    {children}
  </div>
);

export const Chip: React.FC<{children: React.ReactNode; color?: string; fill?: boolean; style?: React.CSSProperties; size?: number}> = ({
  children,
  color = C.teal,
  fill,
  style,
  size = 34,
}) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      padding: '10px 22px',
      borderRadius: 14,
      border: `2px solid ${color}`,
      background: fill ? color : `${color}1f`,
      color: fill ? C.bg : C.ink,
      fontFamily: FONT.sans,
      fontWeight: 700,
      fontSize: size,
      whiteSpace: 'nowrap',
      ...style,
    }}
  >
    {children}
  </span>
);

/** Absolutely positioned box helper. */
export const At: React.FC<{x: number; y: number; w?: number; h?: number; center?: boolean; style?: React.CSSProperties; children?: React.ReactNode}> = ({
  x,
  y,
  w,
  h,
  center,
  style,
  children,
}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      width: w,
      height: h,
      ...style,
      transform: center ? `translate(-50%,-50%) ${style?.transform ?? ''}` : style?.transform,
    }}
  >
    {children}
  </div>
);

/** Line that draws itself; p in [0,1]. */
export const DrawLine: React.FC<{x1: number; y1: number; x2: number; y2: number; p: number; color?: string; w?: number; dash?: boolean; arrow?: boolean}> = ({
  x1,
  y1,
  x2,
  y2,
  p,
  color = C.teal,
  w = 4,
  dash,
  arrow,
}) => {
  const len = Math.hypot(x2 - x1, y2 - y1);
  const ex = x1 + (x2 - x1) * p;
  const ey = y1 + (y2 - y1) * p;
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const ah = 16;
  return (
    <g opacity={p > 0 ? 1 : 0}>
      <line x1={x1} y1={y1} x2={ex} y2={ey} stroke={color} strokeWidth={w} strokeLinecap="round" strokeDasharray={dash ? '10 10' : undefined} />
      {arrow && p > 0.05 && len > 0 ? (
        <polygon
          points={`${ex},${ey} ${ex - ah * Math.cos(ang - 0.45)},${ey - ah * Math.sin(ang - 0.45)} ${ex - ah * Math.cos(ang + 0.45)},${ey - ah * Math.sin(ang + 0.45)}`}
          fill={color}
        />
      ) : null}
    </g>
  );
};

export const Full: React.FC<{children?: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <div style={{position: 'absolute', inset: 0, ...style}}>{children}</div>
);

export const Svg: React.FC<{children?: React.ReactNode}> = ({children}) => (
  <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
    {children}
  </svg>
);

/** Crossfade helper: visible between frames a..b with fades. */
export const window_ = (f: number, a: number, b: number, fade = 12) => {
  const fd = Math.max(1, Math.min(fade, (b - a) / 2 - 1));
  return interpolate(f, [a, a + fd, b - fd, b], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
};

export const num = (v: number, digits = 0) =>
  v.toLocaleString('en-US', {minimumFractionDigits: digits, maximumFractionDigits: digits});
