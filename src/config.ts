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
  /** brand colours (#rrggbb) applied to every style pack's accent slots; null keeps the pack's own colour */
  brand: {name: string; accent: string | null; accent2: string | null};
  /** per-pack palette overrides, e.g. {"neon": {"cyan": "#00FFC2"}} */
  theme: Record<string, Record<string, string>>;
  /** extra output formats besides the main width × height; each becomes a composition "<id>-<key>" */
  formats: Record<string, {width: number; height: number; zoom?: number}>;
  sfx: {volume: number};
  music: {bpm: number};
  fonts: {sans: FontEntry; serif: FontEntry; mono: FontEntry};
};

export const CFG = raw as KitConfig;
export const FPS = CFG.fps;
export const WIDTH = CFG.width;
export const HEIGHT = CFG.height;
