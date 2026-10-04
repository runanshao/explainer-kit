/** Typed view of kit.config.json — the single source for id, size, fps, pace and fonts. */
import raw from '../kit.config.json';

type FontEntry = {family?: string; file?: string; weight?: string; url?: string; fallback: string[]};

export type KitConfig = {
  id: string;
  width: number;
  height: number;
  fps: number;
  voice: string;
  rate: string;
  voices: Record<string, {voice: string; rate: string}>;
  pause: number;
  maxLine: number;
  mockCharsPerSec: number;
  pace: {lead: number; tail: number; leadOverride: Record<string, number>; tailOverride: Record<string, number>};
  fonts: {sans: FontEntry; serif: FontEntry; mono: FontEntry};
};

export const CFG = raw as KitConfig;
export const FPS = CFG.fps;
export const WIDTH = CFG.width;
export const HEIGHT = CFG.height;
