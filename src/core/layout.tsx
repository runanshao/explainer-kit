/** Layout helpers shared by every style pack. */
import React from 'react';
import {HEIGHT, WIDTH} from '../config';
import {C} from './theme';

/**
 * Absolutely positioned box. With `center`, the box is centred on (x, y);
 * the centring translate is composed with the caller's own `style.transform`, never replaced by it.
 */
export const At: React.FC<{x: number; y: number; w?: number; h?: number; center?: boolean; style?: React.CSSProperties; children?: React.ReactNode}> = ({
  x,
  y,
  w,
  h,
  center,
  style,
  children,
}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      width: w,
      height: h,
      ...style,
      transform: center ? `translate(-50%,-50%) ${style?.transform ?? ''}`.trim() : style?.transform,
    }}
  >
    {children}
  </div>
);

/** Full-frame layer. */
export const Full: React.FC<{children?: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <div style={{position: 'absolute', inset: 0, ...style}}>{children}</div>
);

/** Full-frame SVG canvas in composition pixels. */
export const Svg: React.FC<{children?: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} style={{position: 'absolute', inset: 0, overflow: 'visible', ...style}}>
    {children}
  </svg>
);

/** Line that draws itself (use inside <Svg>); p in [0,1]. */
export const DrawLine: React.FC<{x1: number; y1: number; x2: number; y2: number; p: number; color?: string; w?: number; dash?: boolean; arrow?: boolean}> = ({
  x1,
  y1,
  x2,
  y2,
  p,
  color = C.teal,
  w = 4,
  dash,
  arrow,
}) => {
  const len = Math.hypot(x2 - x1, y2 - y1);
  const ex = x1 + (x2 - x1) * p;
  const ey = y1 + (y2 - y1) * p;
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const ah = 16;
  return (
    <g opacity={p > 0 ? 1 : 0}>
      <line x1={x1} y1={y1} x2={ex} y2={ey} stroke={color} strokeWidth={w} strokeLinecap="round" strokeDasharray={dash ? '10 10' : undefined} />
      {arrow && p > 0.05 && len > 0 ? (
        <polygon
          points={`${ex},${ey} ${ex - ah * Math.cos(ang - 0.45)},${ey - ah * Math.sin(ang - 0.45)} ${ex - ah * Math.cos(ang + 0.45)},${ey - ah * Math.sin(ang + 0.45)}`}
          fill={color}
        />
      ) : null}
    </g>
  );
};
