/**
 * Text that appears exactly as the narrator says it. The per-character frames come from the same
 * word boundaries as the subtitles, so on-screen type never runs ahead of or behind the voice.
 */
import React from 'react';
import {FPS} from '../config';
import {C} from './theme';
import {type MoveKind, springAt, tween} from './motion';
import {TIMINGS, leadOf, useScene} from './timeline';

type CharSpan = {start: number; end: number};
// keyed by the timings object itself, so re-running gen.py while Studio is open never serves stale spans
const cache = new WeakMap<object, {text: string; spans: CharSpan[]}>();

/** the scene's whole narration as one string, with [start, end) seconds for every character */
const narration = (id: string) => {
  const hit = cache.get(TIMINGS[id]);
  if (hit) return hit;
  let text = '';
  const spans: CharSpan[] = [];
  for (const ln of TIMINGS[id].lines) {
    let last = ln.start;
    for (let i = 0; i < ln.text.length; i++) {
      const k = ln.words.findIndex((x) => i >= x.s && i < x.e);
      const start = k >= 0 ? (last = ln.words[k].t) : last;
      const next = k >= 0 ? ln.words[k + 1] : undefined;
      spans.push({start, end: next ? next.t : ln.end});
    }
    text += ln.text;
  }
  const out = {text, spans};
  cache.set(TIMINGS[id], out);
  return out;
};

/**
 * Inside a scene: frames at which each character of `sub` is spoken (n-th occurrence).
 * `sub` may contain "\n" for layout; it is ignored for matching. Throws if the phrase isn't in the narration.
 */
export const useSpoken = () => {
  const {id} = useScene();
  const lead = leadOf(id);
  const fr = (s: number) => lead + Math.round(s * FPS);
  const find = (sub: string, nth = 0) => {
    const {text, spans} = narration(id);
    const flat = sub.replace(/\n/g, '');
    let idx = -1;
    for (let k = 0, from = 0; k <= nth; k++, from = idx + 1) {
      idx = text.indexOf(flat, from);
      if (idx < 0) throw new Error(`"${flat}" (occurrence ${nth}) not spoken in ${id}`);
    }
    return spans.slice(idx, idx + flat.length);
  };
  return {
    /** frame each character starts being said */
    chars: (sub: string, nth = 0) => find(sub, nth).map((s) => fr(s.start)),
    /** [first frame, last frame] the phrase is being said — handy for highlights and exits */
    span: (sub: string, nth = 0): [number, number] => {
      const s = find(sub, nth);
      return [fr(s[0].start), fr(s[s.length - 1].end)];
    },
  };
};

export type SpokenMode = MoveKind | 'pop' | 'ink';

/**
 * Renders `text`, each character entering when it is spoken.
 * - mode 'rise' | 'blur' | 'fade' | 'scale' | 'left' | 'drop': per-character entrance
 * - mode 'pop': springy scale per character
 * - mode 'ink': everything visible but dim, characters light up as they are said (karaoke)
 * `hot` colours given substrings with `hotColor` once they are said.
 */
export const Spoken: React.FC<{
  text: string;
  nth?: number;
  mode?: SpokenMode;
  dur?: number;
  /** start each character this many frames before it is said (anticipation reads better than lag) */
  early?: number;
  hot?: string[];
  hotColor?: string;
  dim?: number;
  style?: React.CSSProperties;
}> = ({text, nth = 0, mode = 'rise', dur = 10, early = 2, hot = [], hotColor = C.gold, dim = 0.22, style}) => {
  const {f} = useScene();
  const {chars} = useSpoken();
  const at = chars(text, nth);
  const flat = text.replace(/\n/g, '');
  const isHot = flat.split('').map(() => false);
  for (const h of hot) {
    for (let i = flat.indexOf(h); i >= 0; i = flat.indexOf(h, i + 1)) for (let j = i; j < i + h.length; j++) isHot[j] = true;
  }
  let k = 0;
  return (
    <span style={{whiteSpace: 'pre-wrap', ...style}}>
      {text.split('\n').map((row, ri) => (
        <React.Fragment key={ri}>
          {ri > 0 ? <br /> : null}
          {row.split('').map((ch) => {
            const i = k++;
            const t0 = at[i] - early;
            const p = tween(f, t0, dur, 'out');
            const color = isHot[i] && f >= at[i] ? hotColor : undefined;
            let css: React.CSSProperties;
            if (mode === 'ink') css = {opacity: dim + (1 - dim) * p};
            else if (mode === 'pop') {
              const s = springAt(f, t0, 'bouncy');
              css = {opacity: Math.min(1, s * 2), transform: `scale(${0.4 + 0.6 * s})`};
            } else {
              css = mode === 'fade' ? {opacity: p} : movePerChar(mode, p);
            }
            return (
              <span key={i} style={{display: 'inline-block', whiteSpace: 'pre', color, ...css}}>
                {ch}
              </span>
            );
          })}
        </React.Fragment>
      ))}
    </span>
  );
};

const movePerChar = (kind: MoveKind, p: number): React.CSSProperties => {
  const a = 1 - p;
  switch (kind) {
    case 'blur':
      return {opacity: p, filter: `blur(${a * 10}px)`};
    case 'scale':
      return {opacity: p, transform: `scale(${0.6 + 0.4 * p})`};
    case 'left':
      return {opacity: p, transform: `translateX(${a * 24}px)`};
    case 'drop':
      return {opacity: p, transform: `translateY(${-a * 0.5}em)`};
    case 'right':
      return {opacity: p, transform: `translateX(${-a * 24}px)`};
    default:
      return {opacity: p, transform: `translateY(${a * 0.45}em)`};
  }
};
