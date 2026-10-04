/** Shots: a scene as a list of beats that cut on narration cues, with a transition into each beat. */
import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {EASE, clamp01, tween} from './motion';

/**
 * Transition into a shot:
 * - fade / slow: crossfade (12 / 26 frames)          - cut: hard cut
 * - black: dip to the look's base colour             - flash: cut with a white flash
 * - push / up: the new shot pushes the old one out sideways / upward
 * - zoom: the old shot zooms past the camera while the new one settles in
 * - wipe: the new shot is revealed left to right behind a moving edge
 * - whip: fast blurred pan, for energetic cuts
 */
export type Tr = 'fade' | 'cut' | 'black' | 'flash' | 'slow' | 'push' | 'up' | 'zoom' | 'wipe' | 'whip';
export type Shot = {at: number; tr?: Tr; dur?: number; el: (t: number, d: number) => React.ReactNode};

const DUR: Record<Tr, number> = {fade: 12, slow: 26, cut: 0, black: 16, flash: 12, push: 18, up: 18, zoom: 16, wipe: 20, whip: 10};
const LAYERED = new Set<Tr>(['fade', 'slow', 'push', 'up', 'zoom', 'wipe', 'whip']);

const layer = (style: React.CSSProperties, child: React.ReactNode, key: string) => (
  <div key={key} style={{position: 'absolute', inset: 0, ...style}}>
    {child}
  </div>
);

/** styles for [outgoing, incoming] at transition progress p */
const styles = (tr: Tr, p: number, t: number): [React.CSSProperties, React.CSSProperties] => {
  switch (tr) {
    case 'push':
      return [{transform: `translateX(${-p * 100}%)`}, {transform: `translateX(${(1 - p) * 100}%)`}];
    case 'up':
      return [{transform: `translateY(${-p * 100}%)`}, {transform: `translateY(${(1 - p) * 100}%)`}];
    case 'zoom':
      return [
        {transform: `scale(${1 + p * 0.5})`, opacity: 1 - p, filter: `blur(${p * 8}px)`},
        {transform: `scale(${0.88 + 0.12 * p})`, opacity: p},
      ];
    case 'wipe':
      return [{}, {clipPath: `inset(0 ${(1 - p) * 100}% 0 0)`}];
    case 'whip': {
      const b = Math.sin(p * Math.PI) * 28;
      return [
        {transform: `translateX(${-p * 100}%)`, filter: `blur(${b}px)`},
        {transform: `translateX(${(1 - p) * 100}%)`, filter: `blur(${b}px)`},
      ];
    }
    case 'black':
      return [{}, {opacity: tween(t, 4, 12)}];
    case 'fade':
    case 'slow':
      return [{}, {opacity: p}];
    default:
      return [{}, {}];
  }
};

/**
 * Each shot renders with its own local time `t` and its full length `d`, so every shot can carry its own
 * camera move. `bg` paints behind the shots (transparent by default, so the look's base shows through).
 */
export const Shots: React.FC<{shots: Shot[]; end: number; bg?: string; edge?: string}> = ({shots, end, bg, edge = 'rgba(255,255,255,0.9)'}) => {
  const f = useCurrentFrame();
  const list = [...shots].sort((a, b) => a.at - b.at);
  let i = 0;
  for (let k = 0; k < list.length; k++) if (f >= list[k].at) i = k;
  const cur = list[i];
  const nextAt = (k: number) => (k + 1 < list.length ? list[k + 1].at : end);
  const d = Math.max(1, nextAt(i) - cur.at);
  const t = f - cur.at;
  const tr: Tr = i === 0 ? 'cut' : (cur.tr ?? 'fade');
  const dur = cur.dur ?? DUR[tr];
  const p = dur > 0 ? interpolate(t, [0, dur], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: tr === 'whip' ? EASE.inOut : tr === 'zoom' ? EASE.expo : EASE.inOut}) : 1;
  const [outS, inS] = styles(tr, p, t);
  const prev = i > 0 ? list[i - 1] : null;
  const layers: React.ReactNode[] = [];
  if (prev && LAYERED.has(tr) && t < dur) layers.push(layer(outS, prev.el(f - prev.at, Math.max(1, cur.at - prev.at)), `p${i}`));
  layers.push(layer(t < dur || tr === 'black' ? inS : {}, cur.el(t, d), `c${i}`));
  const flash = tr === 'flash' ? interpolate(t, [0, 2, 12], [0, 0.85, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 0;
  return (
    <div style={{position: 'absolute', inset: 0, background: bg, overflow: 'hidden'}}>
      {layers}
      {tr === 'wipe' && t < dur ? (
        <div style={{position: 'absolute', top: 0, bottom: 0, left: `${p * 100}%`, width: 6, marginLeft: -3, background: edge, opacity: clamp01(Math.sin(p * Math.PI) * 2)}} />
      ) : null}
      {flash > 0 ? <div style={{position: 'absolute', inset: 0, background: '#fff6e6', opacity: flash}} /> : null}
    </div>
  );
};
