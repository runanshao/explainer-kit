/** p1 · cold open: three words slam in on beats 2–4, the last with an RGB split; then the camera dives into 「不」. */
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Burst} from '../../core/Burst';
import {Sfx} from '../../core/Sfx';
import {punch, tween} from '../../core/motion';
import {Mono, PU, Slam} from '../../punch';
import {PROMO, usePromo} from '../grid';
import {PHud} from './common';

export const P1: React.FC = () => {
  const {f, cue, len, beat} = usePromo();
  const dive = len - Math.round(beat * 0.5);
  const z = tween(f, dive, len - dive, 'in');
  const rule = tween(f, 2, 12, 'expo');
  const k = punch(f, cue('drop'), 0.035, 12);
  const flash = f >= cue('c') ? Math.exp(-(f - cue('c')) / 2.5) * 0.35 : 0;
  return (
    <AbsoluteFill style={{background: PU.ink}}>
      <AbsoluteFill style={{transform: `scale(${(1 + 8 * z) * k})`, transformOrigin: '220px 1370px'}}>
        {[900, 1190].map((y) => (
          <div key={y} style={{position: 'absolute', left: 72, top: y, width: 936 * rule, height: 3, background: PU.paper, opacity: 0.45}} />
        ))}
        <div style={{position: 'absolute', left: 64, top: 560}}>
          <Slam at={cue('a')} size={330}>
            讲解片
          </Slam>
        </div>
        <Mono at={cue('a') + 3} size={28} style={{position: 'absolute', right: 72, top: 916}}>
          VIDEO, SERIOUSLY
        </Mono>
        <div style={{position: 'absolute', left: 68, top: 940}}>
          <Slam at={cue('b')} size={210}>
            这件事
          </Slam>
        </div>
        <div style={{position: 'absolute', left: 64, top: 1225}}>
          <Slam at={cue('c')} size={300} color={PU.hot} split={[PU.sage, PU.sky]}>
            不将就
          </Slam>
        </div>
        <Mono at={cue('c') + 4} size={28} color={PU.hot} style={{position: 'absolute', right: 72, top: 1560}}>
          NO COMPROMISE —
        </Mono>
        <Burst at={cue('c')} x={80} y={1520} line={[880, 0]} n={40} seed={4} width={1080} height={1920} colors={[PU.hot, PU.sage, PU.paper]} angle={[-2.6, -0.5]} speed={[500, 1500]} />
      </AbsoluteFill>
      <AbsoluteFill style={{background: '#fff', opacity: flash}} />
      <AbsoluteFill style={{background: PU.hot, opacity: tween(f, len - 3, 3, 'linear')}} />
      <PHud color={PU.paper} label="[01] INTRO" bottom={`${PROMO.brand.tagline} · ON CUE`} />
      <Sfx at={cue('a')} name="slam" volume={0.6} />
      <Sfx at={cue('b')} name="slam" volume={0.75} />
      <Sfx at={cue('c')} name="impact" />
      <Sfx at={cue('c')} name="glitch" volume={0.6} />
      <Sfx at={dive - 4} name="whoosh" volume={0.9} />
    </AbsoluteFill>
  );
};
