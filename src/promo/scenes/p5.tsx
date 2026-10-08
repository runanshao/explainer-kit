/** p5 · the product carousel: the first style packs (one more than the steps), one card per 8th note, with motion blur between them. */
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Sfx} from '../../core/Sfx';
import {FONT} from '../../core/theme';
import {CardStrip, Mono, PU, Slam} from '../../punch';
import {usePromo} from '../grid';
import {PACKS, PHud, Swatch, pad2} from './common';

const Card: React.FC<{i: number}> = ({i}) => {
  const f = useCurrentFrame();
  const pk = PACKS[i];
  return (
    <div style={{position: 'absolute', inset: 0, borderRadius: 44, background: pk.tint, color: PU.ink, overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 50, top: 50, fontFamily: FONT.mono, fontWeight: 600, fontSize: 40}}>{`0${i + 1}`}</div>
      <div style={{position: 'absolute', right: 50, top: 58, fontFamily: FONT.mono, fontWeight: 600, fontSize: 26, opacity: 0.6}}>STYLE PACK</div>
      <div style={{position: 'absolute', left: 50, right: 50, top: 120, height: 2, background: PU.ink, opacity: 0.25}} />
      <div style={{position: 'absolute', left: 350 - 220, top: 160}}>
        <Swatch colors={pk.colors} size={440} rot={f * 1.5 + i * 40} ring={PU.paper} />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 630, textAlign: 'center', fontFamily: FONT.sans, fontWeight: 900, fontSize: 112}}>{pk.zh}</div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 760, textAlign: 'center', fontFamily: FONT.mono, fontWeight: 600, fontSize: 32, letterSpacing: '0.2em', opacity: 0.7}}>{pk.en}</div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 816, textAlign: 'center', fontFamily: FONT.sans, fontWeight: 700, fontSize: 40, opacity: 0.8}}>{pk.note}</div>
    </div>
  );
};

export const P5: React.FC = () => {
  const {cue} = usePromo();
  const steps = ['s1', 's2', 's3', 's4', 's5'].map(cue);
  const shown = Math.min(PACKS.length, steps.length + 1);
  return (
    <AbsoluteFill style={{background: PU.deep}}>
      <div style={{position: 'absolute', left: 64, top: 218}}>
        <Slam at={cue('in') + 3} dur={3} size={132} color={PU.paper}>
          挑一套风格
        </Slam>
      </div>
      <Mono at={cue('in') + 6} size={30} color={PU.sage} style={{position: 'absolute', left: 76, top: 392}}>
        {`PICK A LOOK — ${pad2(shown)} OF ${pad2(PACKS.length)}`}
      </Mono>
      <CardStrip at={cue('in')} steps={steps} y={470} h={940} cards={PACKS.slice(0, shown).map((_, i) => <Card key={i} i={i} />)} />
      <PHud color={PU.paper} label="[05] PICK" />
      {steps.map((s, k) => (
        <React.Fragment key={k}>
          <Sfx at={s - 3} name="whoosh" volume={0.5} />
          <Sfx at={s} name="tick" volume={0.6} />
        </React.Fragment>
      ))}
    </AbsoluteFill>
  );
};
