/**
 * Keynote style pack: launch-film UI motion. One shape that never cuts — it morphs between states while its
 * content swaps; a cursor drives every change; the camera zooms so each moment fills the frame; liquid glass.
 * Delete this folder if unused.
 */
import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame} from 'remotion';
import {FPS} from '../config';
import type {ChapterProps, Look} from '../core/look';
import {clamp01, noise, tween} from '../core/motion';
import {FONT} from '../core/theme';

export const K = {
  canvas: '#EEECE8',
  ink: '#111111',
  sub: '#6E6C68',
  line: 'rgba(17,17,17,0.10)',
  accent: '#0A84FF',
  green: '#30B158',
  glass: 'rgba(255,255,255,0.62)',
};

/** UI spring: quick, with only a hair of overshoot. */
const ui = (f: number, at: number) => (f < at ? 0 : spring({frame: f - at, fps: FPS, config: {damping: 20, stiffness: 190, mass: 0.75}}));

/**
 * Value driven by a list of targets: one spring per change, summed — so a change that lands
 * before the previous one has settled stays continuous instead of jumping.
 */
export const chain = (f: number, keys: {at: number; v: number}[]) =>
  keys.reduce((acc, k, i) => (i === 0 ? k.v : acc + (k.v - keys[i - 1].v) * ui(f, k.at)), 0);

const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const chainColor = (f: number, keys: {at: number; c: string}[]) => {
  const ch = [0, 1, 2].map((j) => Math.round(Math.max(0, Math.min(255, chain(f, keys.map((k) => ({at: k.at, v: hex(k.c)[j]})))))));
  return `rgb(${ch.join(',')})`;
};

/** Warm grey canvas with soft colour blobs drifting behind (so glass has something to blur). */
export const KeyGround: React.FC = () => {
  const f = useCurrentFrame();
  const blob = (seed: number, color: string, x: number, y: number, r: number) => (
    <div
      style={{
        position: 'absolute',
        left: x + noise(seed, f * 0.006) * 160,
        top: y + noise(seed + 5, f * 0.006) * 120,
        width: r,
        height: r,
        marginLeft: -r / 2,
        marginTop: -r / 2,
        borderRadius: '50%',
        background: color,
        filter: 'blur(90px)',
        opacity: 0.55,
      }}
    />
  );
  return (
    <AbsoluteFill style={{background: K.canvas, overflow: 'hidden'}}>
      {blob(1, '#9CC8FF', 1300, 380, 620)}
      {blob(2, '#FFC9A8', 560, 720, 560)}
      {blob(3, '#D8C8FF', 1500, 860, 420)}
    </AbsoluteFill>
  );
};

/**
 * One shape, many states. Each state sets the shape's centre, size, corner radius and fill at frame `at`;
 * geometry springs from state to state, and each state's content blurs in after the shape starts moving
 * and blurs out just before the next change, so content never overlaps.
 */
export type MorphState = {at: number; x: number; y: number; w: number; h: number; r: number; bg: string; glass?: boolean; content?: React.ReactNode};
export const Morph: React.FC<{states: MorphState[]}> = ({states}) => {
  const f = useCurrentFrame();
  const v = (k: 'x' | 'y' | 'w' | 'h' | 'r') => chain(f, states.map((s) => ({at: s.at, v: s[k]})));
  const x = v('x');
  const y = v('y');
  const w = Math.max(0, v('w'));
  const h = Math.max(0, v('h'));
  const r = Math.max(0, Math.min(v('r'), w / 2, h / 2));
  let cur = 0;
  states.forEach((s, i) => {
    if (f >= s.at) cur = i;
  });
  const glass = states[cur].glass;
  return (
    <div
      style={{
        position: 'absolute',
        left: x - w / 2,
        top: y - h / 2,
        width: w,
        height: h,
        borderRadius: r,
        background: chainColor(f, states.map((s) => ({at: s.at, c: s.bg.startsWith('#') ? s.bg : '#ffffff'}))),
        ...(glass
          ? {background: K.glass, backdropFilter: 'blur(30px) saturate(1.6)', border: '1.5px solid rgba(255,255,255,0.8)', boxShadow: '0 30px 80px rgba(40,30,20,0.18)'}
          : {boxShadow: '0 18px 50px rgba(0,0,0,0.16)'}),
        overflow: 'hidden',
      }}
    >
      {states.map((s, i) => {
        if (!s.content) return null;
        const next = states[i + 1];
        const p = tween(f, s.at + 5, 10, 'out');
        const q = next ? tween(f, next.at - 5, 5, 'in') : 0;
        const op = p * (1 - q);
        if (op <= 0) return null;
        return (
          <div key={i} style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: op, filter: op < 1 ? `blur(${(1 - op) * 8}px)` : undefined}}>
            {s.content}
          </div>
        );
      })}
    </div>
  );
};

/** macOS-style arrow cursor that glides between points and clicks (scene frames). */
export type CursorKey = {at: number; x: number; y: number; click?: number};
export const Cursor: React.FC<{keys: CursorKey[]; from?: number}> = ({keys, from = keys[0]?.at ?? 0}) => {
  const f = useCurrentFrame();
  if (f < from) return null;
  const x = chain(f, keys.map((k) => ({at: k.at, v: k.x})));
  const y = chain(f, keys.map((k) => ({at: k.at, v: k.y})));
  const clicks = keys.map((k) => k.click).filter((c): c is number => c !== undefined);
  const press = clicks.reduce((acc, c) => acc * (f >= c && f < c + 8 ? 0.82 + 0.18 * ((f - c) / 8) : 1), 1);
  return (
    <>
      {clicks.map((c) => {
        const k = tween(f, c, 18, 'out');
        if (f < c || k >= 1) return null;
        return (
          <div
            key={c}
            style={{
              position: 'absolute',
              left: x - 40 * k,
              top: y - 40 * k,
              width: 80 * k,
              height: 80 * k,
              borderRadius: '50%',
              border: `3px solid ${K.ink}`,
              opacity: 1 - k,
            }}
          />
        );
      })}
      <svg width={44} height={56} viewBox="0 0 22 28" style={{position: 'absolute', left: x - 4, top: y - 2, transform: `scale(${press})`, transformOrigin: '4px 2px', opacity: tween(f, from, 8), filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.3))'}}>
        <path d="M2 1 L2 22 L7.5 17 L11 25 L14.5 23.5 L11 16 L18.5 16 Z" fill={K.ink} stroke="#fff" strokeWidth={1.6} strokeLinejoin="round" />
      </svg>
    </>
  );
};

/**
 * Screen-studio style camera: each key frames the point (x, y) at scale s. Wrap the whole picture in it.
 */
export const ZoomCam: React.FC<{keys: {at: number; x: number; y: number; s: number}[]; children: React.ReactNode}> = ({keys, children}) => {
  const f = useCurrentFrame();
  const x = chain(f, keys.map((k) => ({at: k.at, v: k.x})));
  const y = chain(f, keys.map((k) => ({at: k.at, v: k.y})));
  const s = chain(f, keys.map((k) => ({at: k.at, v: k.s})));
  return (
    <AbsoluteFill style={{transformOrigin: '0 0', transform: `translate(960px, 540px) scale(${s}) translate(${-x}px, ${-y}px)`}}>
      {children}
    </AbsoluteFill>
  );
};

/** Text that rises out of a mask line at `at` and (optionally) sinks back at `out`. */
export const Rise: React.FC<{at: number; out?: number; children: React.ReactNode; size?: number; weight?: number; color?: string; style?: React.CSSProperties}> = ({
  at,
  out,
  children,
  size = 64,
  weight = 800,
  color = K.ink,
  style,
}) => {
  const f = useCurrentFrame();
  const p = ui(f, at);
  const q = out === undefined ? 0 : tween(f, out, 10, 'in');
  return (
    <div style={{overflow: 'hidden', paddingBottom: size * 0.12, ...style}}>
      <div style={{transform: `translateY(${(1 - clamp01(p)) * 110 + q * 110}%)`, fontFamily: FONT.sans, fontSize: size, fontWeight: weight, color, letterSpacing: -1, whiteSpace: 'nowrap'}}>
        {children}
      </div>
    </div>
  );
};

/** Chapter card: warm canvas, kicker and a wordmark rising out of a mask line. */
export const KeyChapter: React.FC<ChapterProps> = ({f, lead, kicker, title}) => {
  const out = interpolate(f, [lead - 8, lead], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (out <= 0) return null;
  return (
    <AbsoluteFill style={{opacity: out}}>
      <KeyGround />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', gap: 8}}>
        <Rise at={2} size={30} weight={600} color={K.sub}>
          {kicker}
        </Rise>
        <Rise at={6} size={110}>
          {title}
        </Rise>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Warm canvas with drifting colour, glass subtitles. */
export const keynote: Look = {
  base: K.canvas,
  background: KeyGround,
  chapter: KeyChapter,
  subtitles: {bottom: 50, box: true, karaoke: true, size: 36, color: K.ink, boxColor: 'rgba(255,255,255,0.78)', quoteColor: K.accent, dim: 0.35},
};
