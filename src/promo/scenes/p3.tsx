/** p3 · a strobe on 16th notes: the style packs, one per 16th, in their own colours. */
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {SfxAt} from '../../core/Sfx';
import {FONT} from '../../core/theme';
import {PU} from '../../punch';
import {usePromo} from '../grid';
import {PACKS, PHud, Swatch} from './common';

export const P3: React.FC = () => {
  const {f, every} = usePromo();
  const steps = every(0.25);
  let i = 0;
  steps.forEach((s, k) => {
    if (f >= s) i = k;
  });
  const pk = PACKS[i % PACKS.length];
  const t = f - steps[i];
  const bg = i === steps.length - 1 ? PU.hot : i % 2 ? PU.deep : PU.ink;
  const ring = 380 + t * 40;
  return (
    <AbsoluteFill style={{background: bg}}>
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <circle cx={540} cy={820} r={ring} fill="none" stroke={PU.paper} strokeWidth={4} opacity={Math.max(0, 0.5 - t * 0.12)} />
      </svg>
      <div style={{position: 'absolute', left: 540 - 380, top: 820 - 380, width: 760, height: 760, transform: `scale(${1.16 - Math.min(1, t / 3) * 0.16})`}}>
        <Swatch colors={pk.colors} size={760} rot={i * 37 + t * 6} />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1290, textAlign: 'center', fontFamily: FONT.mono, fontWeight: 600, fontSize: 64, letterSpacing: '0.2em', color: PU.paper}}>{pk.en}</div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1380, textAlign: 'center', fontFamily: FONT.sans, fontWeight: 900, fontSize: 60, color: PU.paper, opacity: 0.85}}>{pk.zh}</div>
      <PHud color={PU.paper} label={`[03] ×${steps.length}`} />
      <SfxAt frames={steps} name="tick" volume={0.7} />
    </AbsoluteFill>
  );
};
