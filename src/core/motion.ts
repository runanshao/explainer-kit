/**
 * Motion vocabulary shared by every style pack: easing presets, enter/exit, idle drift, impacts.
 * Everything is a pure function of the frame, so parallel rendering stays deterministic.
 */
import type React from 'react';
import {Easing, interpolate, spring} from 'remotion';
import {FPS} from '../config';

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** Easing presets. `out` for entrances, `in` for exits, `inOut` for camera moves and transitions. */
export const EASE = {
  out: Easing.bezier(0.16, 0.84, 0.24, 1),
  in: Easing.bezier(0.55, 0, 0.85, 0.3),
  inOut: Easing.bezier(0.45, 0, 0.25, 1),
  /** fast start, long settle — titles, big numbers */
  expo: Easing.bezier(0.08, 0.9, 0.12, 1),
  /** overshoots then settles */
  back: Easing.bezier(0.3, 1.45, 0.45, 1),
  linear: (x: number) => x,
};
export type EaseName = keyof typeof EASE;

/** 0→1 from frame `at` over `dur` frames with a named easing. */
export const tween = (f: number, at: number, dur = 18, e: EaseName = 'out') =>
  interpolate(f, [at, at + Math.max(1, dur)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE[e]});

/** ease-in-out 0→1 from frame `a` over `dur` frames (camera moves, crossfades) */
export const eio = (t: number, a: number, dur = 18) => tween(t, a, dur, 'inOut');
/** linear 0→1 between frames a and b */
export const lin = (t: number, a: number, b: number) => clamp01((t - a) / Math.max(1, b - a));

/** Spring presets (0→1). `soft` has no overshoot, `snappy` a little, `bouncy` a lot. */
export const SPRING = {
  soft: {damping: 200, stiffness: 120, mass: 1},
  snappy: {damping: 14, stiffness: 180, mass: 0.7},
  bouncy: {damping: 9, stiffness: 160, mass: 0.8},
} as const;
export const springAt = (f: number, at: number, kind: keyof typeof SPRING = 'snappy') =>
  f < at ? 0 : spring({frame: f - at, fps: FPS, config: SPRING[kind]});

/**
 * Enter at `at`, leave at `out`: returns {p, q} where p is entrance progress (0→1)
 * and q is exit progress (0→1). Things that never leave just omit `out`.
 */
export const life = (f: number, at: number, out = Infinity, inDur = 16, outDur = 12) => ({
  p: tween(f, at, inDur, 'out'),
  q: out === Infinity ? 0 : tween(f, out, outDur, 'in'),
});

export type MoveKind = 'rise' | 'fade' | 'scale' | 'blur' | 'left' | 'right' | 'drop';

/**
 * Style for something entering with progress p and leaving with progress q.
 * Exits keep moving in the entering direction (a rise leaves upward), so motion reads as one flow.
 */
export const move = (kind: MoveKind, p: number, q = 0, dist = 36): React.CSSProperties => {
  const op = p * (1 - q);
  const a = 1 - p; // still to travel in
  switch (kind) {
    case 'fade':
      return {opacity: op};
    case 'scale':
      return {opacity: op, transform: `scale(${0.86 + 0.14 * p + 0.08 * q})`};
    case 'blur':
      return {opacity: op, filter: `blur(${(a + q) * 14}px)`, transform: `scale(${1.04 - 0.04 * p})`};
    case 'left':
      return {opacity: op, transform: `translateX(${a * dist - q * dist}px)`};
    case 'right':
      return {opacity: op, transform: `translateX(${-a * dist + q * dist}px)`};
    case 'drop':
      return {opacity: op, transform: `translateY(${-a * dist + q * dist}px)`};
    case 'rise':
    default:
      return {opacity: op, transform: `translateY(${a * dist - q * dist * 0.7}px)`};
  }
};

/** frame of the i-th item in a staggered group */
export const stagger = (at: number, i: number, gap = 5) => at + i * gap;

// ───────────────────────── idle motion ─────────────────────────

const hash = (n: number) => {
  let t = (n + 0x6d2b79f5) >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/** smooth deterministic 1-D noise in [-1, 1] */
export const noise = (seed: number, x: number) => {
  const i = Math.floor(x);
  const fr = x - i;
  const a = hash(i * 7919 + seed * 104729);
  const b = hash((i + 1) * 7919 + seed * 104729);
  const u = fr * fr * (3 - 2 * fr);
  return (a + (b - a) * u) * 2 - 1;
};

/**
 * Slow organic drift so settled elements keep breathing instead of freezing.
 * Returns a CSS transform; amp in px, rot in degrees.
 */
export const drift = (f: number, seed = 1, amp = 6, rot = 0.4, speed = 0.012) =>
  `translate(${noise(seed, f * speed) * amp}px, ${noise(seed + 17, f * speed) * amp}px) rotate(${noise(seed + 31, f * speed) * rot}deg)`;

/** gentle 0..1 sine pulse with the given period in frames */
export const pulse = (f: number, period = 60, phase = 0) => 0.5 - 0.5 * Math.cos(((f + phase) / period) * Math.PI * 2);

// ───────────────────────── impacts ─────────────────────────

/** decaying scale bump at frame `at` (e.g. when a word is said): 1 → 1+amp → settles to 1 */
export const punch = (f: number, at: number, amp = 0.08, dur = 16) => {
  if (f < at || f > at + dur) return 1;
  const k = (f - at) / dur;
  return 1 + amp * Math.sin(k * Math.PI) * (1 - k);
};

/** decaying camera shake at frame `at`; returns a CSS transform */
export const shake = (f: number, at: number, amp = 10, dur = 14) => {
  if (f < at || f > at + dur) return 'none';
  const k = 1 - (f - at) / dur;
  const x = noise(3, f * 0.9) * amp * k * k;
  const y = noise(9, f * 0.9) * amp * k * k;
  return `translate(${x}px, ${y}px) rotate(${noise(5, f) * 0.3 * k}deg)`;
};

/** deterministic PRNG (same frame → same picture, which rendering in parallel requires) */
export const rng = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
