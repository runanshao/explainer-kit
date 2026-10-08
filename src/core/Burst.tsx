/**
 * Particles thrown from a point (or along a line) at frame `at`: juice, crumbs, confetti, sparks.
 * Ballistic and computed from the frame alone (position = v·t + ½·g·t²), so any frame renders the same in parallel.
 */
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {FPS} from '../config';
import {rng} from './motion';

export type BurstProps = {
  at: number;
  x: number;
  y: number;
  /** spawn along a segment from (x, y) to (x + line[0], y + line[1]) instead of a point */
  line?: [number, number];
  n?: number;
  seed?: number;
  colors?: string[];
  /** launch angle range in radians (0 = right, -π/2 = up); default all round */
  angle?: [number, number];
  /** px per second */
  speed?: [number, number];
  /** px per second² (down is positive) */
  gravity?: number;
  /** seconds */
  life?: [number, number];
  size?: [number, number];
  /** elongate drops along their velocity (1 = round) */
  stretch?: number;
  /** canvas size of the overlay; defaults to the composition */
  width?: number;
  height?: number;
};

export const Burst: React.FC<BurstProps> = ({
  at,
  x,
  y,
  line,
  n = 32,
  seed = 1,
  colors = ['#ffffff'],
  angle = [-Math.PI, Math.PI],
  speed = [400, 1300],
  gravity = 2400,
  life = [0.5, 1.0],
  size = [5, 14],
  stretch = 1.6,
  width = 1920,
  height = 1080,
}) => {
  const f = useCurrentFrame();
  const t = (f - at) / FPS;
  if (t < 0 || t > life[1] + 0.05) return null;
  const r = rng(seed);
  const dots = Array.from({length: n}, (_, i) => {
    const u = r();
    const a = angle[0] + (angle[1] - angle[0]) * r();
    const sp = speed[0] + (speed[1] - speed[0]) * r();
    const lf = life[0] + (life[1] - life[0]) * r();
    const sz = size[0] + (size[1] - size[0]) * r();
    const c = colors[Math.floor(r() * colors.length)];
    const k = Math.max(0, 1 - t / lf);
    if (k <= 0) return null;
    const ox = x + (line ? line[0] * u : 0);
    const oy = y + (line ? line[1] * u : 0);
    const vx = Math.cos(a) * sp;
    const vy = Math.sin(a) * sp;
    const px = ox + vx * t;
    const py = oy + vy * t + 0.5 * gravity * t * t;
    const deg = (Math.atan2(vy + gravity * t, vx) * 180) / Math.PI;
    const rr = sz * (0.35 + 0.65 * k);
    return <ellipse key={i} cx={px} cy={py} rx={rr * stretch} ry={rr} fill={c} opacity={Math.min(1, k * 2.2)} transform={`rotate(${deg} ${px} ${py})`} />;
  });
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none'}}>
      {dots}
    </svg>
  );
};
