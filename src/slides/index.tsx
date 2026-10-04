/** Slides style pack: whiteboard-like panels and chips on a dark teal ground. Delete this folder if unused. */
import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import type {ChapterProps, Look} from '../core/look';
import {C, FONT} from '../core/theme';
import {ease} from '../core/timeline';

export const Kicker: React.FC<{children: React.ReactNode; color?: string; style?: React.CSSProperties}> = ({children, color = C.orange, style}) => (
  <div style={{fontFamily: FONT.sans, fontSize: 26, fontWeight: 700, letterSpacing: 6, color, ...style}}>{children}</div>
);

/** Heading. */
export const H: React.FC<{children: React.ReactNode; size?: number; style?: React.CSSProperties; serif?: boolean}> = ({children, size = 64, style, serif}) => (
  <div style={{fontFamily: serif ? FONT.serif : FONT.sans, fontSize: size, fontWeight: 800, color: C.ink, lineHeight: 1.25, ...style}}>{children}</div>
);

export const Panel: React.FC<{children: React.ReactNode; style?: React.CSSProperties; accent?: string}> = ({children, style, accent}) => (
  <div
    style={{
      background: C.panel,
      border: `1.5px solid ${accent ?? C.panelLine}`,
      borderRadius: 22,
      padding: '26px 32px',
      boxShadow: accent ? `0 0 40px ${accent}33` : undefined,
      fontFamily: FONT.sans,
      color: C.ink,
      ...style,
    }}
  >
    {children}
  </div>
);

/** Pill label. `color` must be a #rrggbb hex (a 2-digit alpha is appended for the tint). */
export const Chip: React.FC<{children: React.ReactNode; color?: string; fill?: boolean; style?: React.CSSProperties; size?: number}> = ({
  children,
  color = C.teal,
  fill,
  style,
  size = 34,
}) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      padding: '10px 22px',
      borderRadius: 14,
      border: `2px solid ${color}`,
      background: fill ? color : `${color}1f`,
      color: fill ? C.bg : C.ink,
      fontFamily: FONT.sans,
      fontWeight: 700,
      fontSize: size,
      whiteSpace: 'nowrap',
      ...style,
    }}
  >
    {children}
  </span>
);

/** Dark teal gradient with a slowly drifting dot grid. */
export const SlideBackground: React.FC = () => {
  const f = useCurrentFrame();
  const drift = (f * 0.25) % 60;
  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse at 30% 20%, ${C.bg2} 0%, ${C.bg} 60%, #051615 100%)`}}>
      <AbsoluteFill
        style={{
          backgroundImage: 'radial-gradient(rgba(237,232,220,0.07) 1.6px, transparent 1.6px)',
          backgroundSize: '60px 60px',
          backgroundPosition: `${drift}px ${drift * 0.5}px`,
        }}
      />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.45) 100%)'}} />
    </AbsoluteFill>
  );
};

/** Simple chapter card: kicker + heading on the slide background, fading out as narration starts. */
export const SlideChapter: React.FC<ChapterProps> = ({f, lead, kicker, title}) => {
  const out = interpolate(f, [lead - 10, lead], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (out <= 0) return null;
  const p = ease(f, 0, 14);
  return (
    <AbsoluteFill style={{opacity: out}}>
      <SlideBackground />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', gap: 22, opacity: p}}>
        <Kicker>{kicker}</Kicker>
        <H size={84}>{title}</H>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Teal slide ground, simple chapter card, boxed karaoke subtitles near the bottom. */
export const slides: Look = {
  base: C.bg,
  background: SlideBackground,
  chapter: SlideChapter,
  subtitles: {bottom: 58, box: true, karaoke: true, size: 40, quoteColor: C.orange},
};
