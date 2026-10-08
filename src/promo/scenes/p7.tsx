/**
 * p7 · the drop and end card: the logo fills with a bloom, shockwaves and confetti, the badge spins up, the wordmark
 * wipes in, the tagline rises, the CTA bar pushes up, and the logo pulses on every beat after that.
 */
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Burst} from '../../core/Burst';
import {Sfx} from '../../core/Sfx';
import {punch, shake, tween} from '../../core/motion';
import {FONT} from '../../core/theme';
import {Badge, CtaBar, LogoReveal, Mono, PU, Wipe} from '../../punch';
import {PROMO, usePromo} from '../grid';
import {PHud} from './common';
import {LOGO, MARK} from './p6';

export const P7: React.FC = () => {
  const {f, cue, every} = usePromo();
  const beats = every(1, 4, 8);
  const pulse = beats.reduce((a, b) => a * punch(f, b, 0.035, 10), 1);
  const flash = Math.exp(-f / 4) * 0.7;
  return (
    <AbsoluteFill style={{background: PU.sage}}>
      <AbsoluteFill style={{transform: shake(f, 0, 22, 14)}}>
        <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
          {[0, 3].map((d) => {
            const p = tween(f, d, 26, 'expo');
            return p > 0 && p < 1 ? <circle key={d} cx={MARK.x} cy={MARK.y} r={250 + p * 850} fill="none" stroke="#fff" strokeWidth={16 * (1 - p) + 1} opacity={1 - p} /> : null;
          })}
        </svg>
        <Badge at={4} x={MARK.x} y={MARK.y} r={318} color={PU.ink} text="旁白就是时间轴 ● 每一帧都是纯函数 ● 可交付 · 可重复 · 稳定输出 ● " />
        <LogoReveal logo={LOGO} {...MARK} draw={-100} fill={0} landed={['play']} scale={pulse} />
        <Burst at={0} x={MARK.x} y={MARK.y} n={56} seed={9} width={1080} height={1920} colors={[PU.hot, PU.sun, PU.paper, PU.ink, PU.sky]} speed={[700, 1800]} life={[0.9, 1.5]} gravity={1500} />
        <Wipe at={cue('word') - 6} dur={12} style={{position: 'absolute', left: 0, right: 0, top: 1056, textAlign: 'center'}}>
          <div style={{fontFamily: FONT.sans, fontWeight: 900, fontSize: 116, lineHeight: 1, color: PU.ink, letterSpacing: '-0.03em'}}>{PROMO.brand.name}</div>
        </Wipe>
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 1196,
            textAlign: 'center',
            fontFamily: FONT.sans,
            fontWeight: 700,
            fontSize: 60,
            color: PU.ink,
            opacity: tween(f, cue('tag'), 8),
            transform: `translateY(${(1 - tween(f, cue('tag'), 10, 'expo')) * 40}px)`,
          }}
        >
          {PROMO.brand.tagline}
        </div>
        <Mono at={cue('cta') + 4} size={28} color={PU.ink} style={{position: 'absolute', left: 0, right: 0, top: 1440, textAlign: 'center'}}>
          OPEN SOURCE · MIT
        </Mono>
        <CtaBar at={cue('cta')} y={1290} height={130} text={`${PROMO.brand.cta}  →  `} size={52} />
      </AbsoluteFill>
      <AbsoluteFill style={{background: '#fff', opacity: flash}} />
      <PHud color={PU.ink} label="[07] GET IT" />
      <Sfx at={0} name="impact" />
      <Sfx at={0} name="chime" volume={0.8} />
      <Sfx at={cue('word') - 6} name="whoosh" volume={0.6} />
      <Sfx at={cue('tag')} name="tick" />
      <Sfx at={cue('cta')} name="swish" />
      <Sfx at={cue('last')} name="pop" volume={0.7} />
    </AbsoluteFill>
  );
};
