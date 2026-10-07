/** p4 · the statement: 「好片子」 in pattern-filled type rising out of masks, 「自己会说话」 typed on 16ths. */
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Sfx, SfxAt} from '../../core/Sfx';
import {springAt, tween} from '../../core/motion';
import {FONT} from '../../core/theme';
import {Mono, PU, PatternText, dotTile} from '../../punch';
import {usePromo} from '../grid';
import {PHud} from './common';

const TILE = dotTile(PU.deep, [PU.hot, PU.sun, PU.sage, PU.paper]);

export const P4: React.FC = () => {
  const {f, cue, beat, len} = usePromo();
  const col = ['好', '片', '子'].map((c, i) => ({c, at: cue('col') + Math.round((i * beat) / 4)}));
  const say = '自己会说话'.split('').map((c, i) => ({c, at: cue('say') + Math.round((i * beat) / 4)}));
  const push = 1 + 0.05 * (f / len);
  return (
    <AbsoluteFill style={{background: PU.paper}}>
      <AbsoluteFill style={{transform: `scale(${push})`, transformOrigin: '50% 50%'}}>
        {col.map(({c, at}, i) => (
          <div key={c} style={{position: 'absolute', left: 96, top: 300 + i * 400, height: 400, overflow: 'hidden'}}>
            <div style={{transform: `translateY(${(1 - tween(f, at, 9, 'expo')) * 110}%)`}}>
              <PatternText tile={TILE} size={370}>
                {c}
              </PatternText>
            </div>
          </div>
        ))}
        <div style={{position: 'absolute', left: 608, top: 300, width: 4, height: 1200 * tween(f, cue('col') + 3, 14, 'expo'), background: PU.ink}} />
        <div style={{position: 'absolute', left: 798, top: 418, width: 44, height: 44, borderRadius: 22, background: PU.hot, transform: `scale(${springAt(f, cue('say'), 'bouncy')})`}} />
        {say.map(({c, at}, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 750,
              top: 520 + i * 150,
              width: 140,
              textAlign: 'center',
              fontFamily: FONT.sans,
              fontWeight: 900,
              fontSize: 138,
              lineHeight: 1,
              color: PU.ink,
              opacity: tween(f, at, 3),
              transform: `translateX(${(1 - tween(f, at, 5)) * -30}px)`,
            }}
          >
            {c}
          </div>
        ))}
        <Mono at={cue('tag')} size={30} color={PU.ink} style={{position: 'absolute', left: 72, top: 1580}}>
          GOOD FILMS SPEAK FOR THEMSELVES.
        </Mono>
      </AbsoluteFill>
      <PHud color={PU.ink} label="[04] STATEMENT" />
      <SfxAt frames={col.map((x) => x.at)} name="thud" volume={0.6} />
      <SfxAt frames={say.map((x) => x.at)} name="type" volume={0.7} />
      <Sfx at={cue('tag')} name="tick" />
    </AbsoluteFill>
  );
};
