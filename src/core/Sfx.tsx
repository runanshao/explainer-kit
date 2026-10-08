/**
 * Sound effects and the beat grid.
 *
 * <Sfx at={frame} name="pop" /> plays public/sfx/pop.wav at a scene-local frame (tools/sfx.py synthesizes them).
 * Put them at the top level of a scene, not inside a Shots element: a shot that ends unmounts its sounds mid-play.
 */
import React, {createContext, useContext} from 'react';
import {Audio, Sequence, staticFile} from 'remotion';
import {CFG, FPS} from '../config';
import {sceneStarts, useScene} from './timeline';

export const SFX = ['click', 'pop', 'whoosh', 'whip', 'swish', 'thud', 'slam', 'tick', 'type', 'coin', 'levelup', 'glitch', 'chime', 'draw', 'impact', 'riser', 'revcrash', 'shimmer', 'rush'] as const;
export type SfxName = (typeof SFX)[number];

/** silences every <Sfx> below it — for a frozen copy of a scene (e.g. the promo shows the next scene frozen while it wipes in) */
export const SfxMute = createContext(false);

export const Sfx: React.FC<{at: number; name: SfxName; volume?: number; rate?: number}> = ({at, name, volume = 1, rate}) => {
  const muted = useContext(SfxMute);
  if (muted || !Number.isFinite(at)) return null;
  return (
    <Sequence from={Math.max(0, Math.round(at))} layout="none" name={`sfx ${name}`}>
      <Audio src={staticFile(`sfx/${name}.wav`)} volume={(CFG.sfx?.volume ?? 0.5) * volume} playbackRate={rate} />
    </Sequence>
  );
};

/** the same sound at several frames (e.g. a keystroke per typed character) */
export const SfxAt: React.FC<{frames: number[]; name: SfxName; volume?: number}> = ({frames, name, volume}) => (
  <>
    {frames.map((fr, i) => (
      <Sfx key={i} at={fr} name={name} volume={volume} />
    ))}
  </>
);

const STARTS = sceneStarts();

/**
 * The music's beat grid (kit.config.json "music.bpm", counted from the start of the film — tools/music.py plays its
 * pulse on the same grid). All frames are scene-local, like everything else in a scene.
 * - next(fr): first beat at or after fr — snap an event onto the music
 * - nearest(fr): closest beat (may be slightly before fr)
 * - pulse(): 1 on each beat, decaying to 0 before the next — drive a glow or a bob with it
 */
export const useBeat = () => {
  const {id, f} = useScene();
  const bpm = CFG.music?.bpm ?? 96;
  const period = (60 / bpm) * FPS;
  const off = STARTS[id] ?? 0;
  const g = (fr: number) => fr + off;
  return {
    bpm,
    period,
    next: (fr: number) => Math.round(Math.ceil(g(fr) / period - 1e-6) * period) - off,
    nearest: (fr: number) => Math.round(Math.round(g(fr) / period) * period) - off,
    pulse: (decay = 0.35) => {
      const k = (g(f) % period) / period;
      return Math.exp(-k / decay);
    },
    /** index of the current beat in the bar (0..3) */
    count: () => Math.floor(g(f) / period) % 4,
  };
};
