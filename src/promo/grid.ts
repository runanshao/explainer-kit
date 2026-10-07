/**
 * Beat grid for the promo (short ad / brand film without narration): promo/promo.json is the time source.
 *
 * A narrated film takes its time from the voice (src/core/timeline.ts). A 15-second promo has no voice — the music is
 * the clock. Every scene is a whole number of beats long, every cue is a position on the bar grid ("bar:beat", both
 * counted from 0 within the scene, beat may be fractional: "1:2.5"), and tools/score.py writes the music on the same
 * grid. So a slam that lands on a cue lands on a kick drum, and changing the bpm moves picture and music together.
 */
import {createContext, useContext} from 'react';
import {useCurrentFrame} from 'remotion';
import raw from '../../promo/promo.json';
import {CFG} from '../config';

export type Transition = 'cut' | 'iris' | 'wipe' | 'flood' | 'up';
export type PromoScene = {
  id: string;
  /** length in bars of 4 beats (fractions allowed: 1.5 = six beats) */
  bars: number;
  /** what the score plays under it: intro | groove | break | build | drop (tools/score.py) */
  energy: string;
  /** transition into this scene; it plays *before* the downbeat and finishes exactly on it */
  in?: {tr: Transition; beats?: number; color?: string};
  cues: Record<string, string>;
};
export type PromoConfig = {
  id: string;
  width: number;
  height: number;
  fps?: number;
  bpm: number;
  key: string;
  loudness: {target: number; ceiling: number};
  brand: {name: string; tagline: string; cta: string};
  scenes: PromoScene[];
};

export const PROMO = raw as unknown as PromoConfig;
export const PFPS = PROMO.fps ?? CFG.fps;
/** frames per beat (fractional: 128 bpm at 30 fps = 14.0625) */
export const BEAT = (60 / PROMO.bpm) * PFPS;

/** "bar:beat" → beats from the scene start */
export const parsePos = (pos: string) => {
  const m = /^(\d+):(\d+(?:\.\d+)?)$/.exec(pos);
  if (!m) throw new Error(`bad grid position "${pos}" — use "bar:beat", e.g. "1:2.5"`);
  return Number(m[1]) * 4 + Number(m[2]);
};

// scene starts in beats; frames are rounded from the absolute beat so rounding never accumulates
const startBeat: Record<string, number> = {};
{
  let acc = 0;
  for (const s of PROMO.scenes) {
    startBeat[s.id] = acc;
    acc += s.bars * 4;
  }
}
export const TOTAL_BEATS = PROMO.scenes.reduce((a, s) => a + s.bars * 4, 0);
export const beatFrame = (beats: number) => Math.round(beats * BEAT);
export const promoFrames = () => beatFrame(TOTAL_BEATS);
export const sceneStart = (id: string) => beatFrame(startBeat[id]);
export const sceneLen = (id: string) => {
  const s = PROMO.scenes.find((x) => x.id === id)!;
  return beatFrame(startBeat[id] + s.bars * 4) - beatFrame(startBeat[id]);
};
/** frames the transition into a scene runs before its downbeat */
export const preRoll = (s: PromoScene) => (s.in && s.in.tr !== 'cut' ? Math.max(2, Math.round((s.in.beats ?? 0.5) * BEAT)) : 0);

const Ctx = createContext<{id: string}>({id: PROMO.scenes[0]?.id ?? ''});
export const PromoSceneProvider = Ctx.Provider;

/**
 * Inside a promo scene. Frames are scene-local with 0 = the scene's downbeat. (While the transition into a scene plays,
 * the shell shows that scene frozen at frame 0, so entrances should start at or after 0.)
 * - at("bar:beat") / cue(name): frame of a grid position / of a named cue in promo.json
 * - beat, bar: frames per beat / bar; len: scene length in frames
 * - pulse(decay): 1 on every beat decaying to 0 — drive a glow or a bounce with the kick drum
 * - every(step, from, to): grid frames from `from` to `to` (beats) every `step` beats — strobes, ticks, stagger on 16ths
 */
export const usePromo = () => {
  const {id} = useContext(Ctx);
  const f = useCurrentFrame();
  const sc = PROMO.scenes.find((s) => s.id === id)!;
  const s0 = startBeat[id];
  const at = (pos: string | number) => {
    const b = typeof pos === 'number' ? pos : parsePos(pos);
    return beatFrame(s0 + b) - beatFrame(s0);
  };
  const cue = (name: string) => {
    const p = sc.cues[name];
    if (p === undefined) throw new Error(`cue "${name}" missing in promo scene ${id}`);
    return at(p);
  };
  const abs = beatFrame(s0) + f;
  return {
    f,
    id,
    at,
    cue,
    beat: BEAT,
    bar: 4 * BEAT,
    len: sceneLen(id),
    /** absolute frame in the promo (for things that run across scenes, e.g. a progress bar) */
    abs,
    total: promoFrames(),
    pulse: (decay = 0.3) => {
      const k = ((abs / BEAT) % 1 + 1) % 1;
      return Math.exp(-k / decay);
    },
    every: (step: number, from = 0, to = sc.bars * 4) => {
      const out: number[] = [];
      for (let b = from; b < to - 1e-6; b += step) out.push(at(b));
      return out;
    },
  };
};
