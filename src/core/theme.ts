/** Shared colour tokens and font stacks. Every token used by core, film and slides lives here. */
import {CFG} from '../config';

type Slots<T> = Partial<Record<'accent' | 'accent2', (keyof T)[]>>;

/**
 * A pack's palette with the brand applied: kit.config.json "brand.accent" / "brand.accent2" replace the keys the
 * pack lists as its accent slots, then "theme.<pack>" overrides individual keys. Colours must be #rrggbb.
 */
export const themed = <T extends Record<string, string>>(pack: string, base: T, slots: Slots<T> = {}): T => {
  const out: Record<string, string> = {...base};
  for (const slot of ['accent', 'accent2'] as const) {
    const v = CFG.brand?.[slot];
    if (v) for (const k of slots[slot] ?? []) out[k as string] = v;
  }
  Object.assign(out, CFG.theme?.[pack] ?? {});
  return out as T;
};

/** relative luminance of a #rrggbb colour (0 dark … 1 light); anything else counts as dark */
export const lum = (c?: string) => {
  if (!c || !/^#[0-9a-fA-F]{6}$/.test(c)) return 0;
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
/** readable text colour on a ground colour */
export const inkOn = (ground?: string) => (lum(ground) > 0.5 ? '#141414' : '#F4F1EA');

export const C = themed('core', {
  // neutrals
  black: '#050505',
  ink: '#F2EDE4',
  muted: '#B9B1A3',
  dim: '#6d675e',
  // accents
  gold: '#E9B949',
  orange: '#E8913F',
  teal: '#2BB3A6',
  tealDeep: '#0f7b78',
  red: '#E5645A',
  green: '#7BCB6B',
  blue: '#6FA8E8',
  // slides surfaces
  bg: '#08201f',
  bg2: '#0c2d2c',
  panel: 'rgba(237,232,220,0.045)',
  panelLine: 'rgba(237,232,220,0.14)',
  // paper props (film)
  paper: '#EFE6D2',
  paperInk: '#2a241c',
  stamp: '#B8322A',
}, {accent: ['gold', 'orange'], accent2: ['teal']});

const GENERIC = new Set(['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui']);
const stack = (f: {family?: string; fallback: string[]}) =>
  [f.family, ...f.fallback]
    .filter((x): x is string => Boolean(x))
    .map((x) => (GENERIC.has(x) ? x : `"${x}"`))
    .join(', ');

/** Font stacks: the downloaded variable font first (if `npm run fonts` was run), then system fonts. */
export const FONT = {
  sans: stack(CFG.fonts.sans),
  serif: stack(CFG.fonts.serif),
  mono: stack(CFG.fonts.mono),
};
