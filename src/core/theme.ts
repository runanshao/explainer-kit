/** Shared colour tokens and font stacks. Every token used by core, film and slides lives here. */
import {CFG} from '../config';

export const C = {
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
};

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
