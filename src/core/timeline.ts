/** Timeline: narration timings → frames. Scenes never hard-code seconds; they ask c()/w()/rel(). */
import type React from 'react';
import {createContext, useContext} from 'react';
import {Easing, interpolate, spring, useCurrentFrame} from 'remotion';
import timingsJson from '../timings.json';
import {CFG, FPS} from '../config';

export type Word = {t: number; s: number; e: number};
export type SubLine = {text: string; start: number; end: number; words: Word[]; q?: string};
export type SceneTiming = {
  chapter: string;
  duration: number;
  /** path under public/, written by tts/gen.py (mp3 for real TTS, wav for --mock) */
  audio?: string;
  cues: Record<string, number>;
  lines: SubLine[];
};

export const TIMINGS = timingsJson as unknown as Record<string, SceneTiming>;
export const SCENE_IDS = Object.keys(TIMINGS);

/** frames before narration starts (chapter card) and after it ends, per scene — see kit.config.json "pace" */
export const leadOf = (id: string) => CFG.pace.leadOverride[id] ?? CFG.pace.lead;
export const tailOf = (id: string) => CFG.pace.tailOverride[id] ?? CFG.pace.tail;
export const narrFrames = (id: string) => Math.ceil(TIMINGS[id].duration * FPS);
export const sceneFrames = (id: string) => leadOf(id) + narrFrames(id) + tailOf(id);
export const narrEnd = (id: string) => leadOf(id) + narrFrames(id);
export const totalFrames = () => SCENE_IDS.reduce((a, id) => a + sceneFrames(id), 0);
export const sceneStarts = () => {
  const out: Record<string, number> = {};
  SCENE_IDS.reduce((acc, id) => ((out[id] = acc), acc + sceneFrames(id)), 0);
  return out;
};
export const audioOf = (id: string) => TIMINGS[id].audio ?? `audio/${id}.mp3`;

const SceneCtx = createContext<{id: string}>({id: SCENE_IDS[0] ?? ''});
export const SceneProvider = SceneCtx.Provider;

/**
 * Inside a scene: all frames are scene-local.
 * - c(cue): frame of a [[cue]] marker
 * - w(sub, nth): frame at which the narrator starts saying `sub`
 * - rel(sub, cue): frames from `cue` until `sub` is first said at or after it (for shot-local time)
 */
export const useScene = () => {
  const {id} = useContext(SceneCtx);
  const f = useCurrentFrame();
  const T = TIMINGS[id];
  const lead = leadOf(id);
  const c = (k: string) => {
    const v = T.cues[k];
    if (v === undefined) throw new Error(`cue "${k}" missing in ${id}`);
    return lead + Math.round(v * FPS);
  };
  const w = (sub: string, nth = 0) => {
    let k = 0;
    for (const ln of T.lines) {
      let from = 0;
      for (;;) {
        const idx = ln.text.indexOf(sub, from);
        if (idx < 0) break;
        if (k++ === nth) {
          const word = ln.words.find((x) => x.e > idx) ?? ln.words[ln.words.length - 1];
          return lead + Math.round((word ? word.t : ln.start) * FPS);
        }
        from = idx + 1;
      }
    }
    throw new Error(`"${sub}" (occurrence ${nth}) not found in ${id}`);
  };
  const rel = (sub: string, cue: string) => {
    const c0 = c(cue);
    for (let n = 0; ; n++) {
      const fr = w(sub, n);
      if (fr >= c0 - 2) return fr - c0;
    }
  };
  return {f, c, w, rel, id, total: sceneFrames(id), end: narrEnd(id), lead};
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
/** linear blend a→b by p. */
export const lerp = (p: number, a: number, b: number) => a + (b - a) * p;
/** visible between frames a..b, fading in and out. */
export const window_ = (f: number, a: number, b: number, fade = 12) => {
  const fd = Math.max(1, Math.min(fade, (b - a) / 2 - 1));
  return interpolate(f, [a, a + fd, b - fd, b], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
};
export const num = (v: number, digits = 0) =>
  v.toLocaleString('en-US', {minimumFractionDigits: digits, maximumFractionDigits: digits});
