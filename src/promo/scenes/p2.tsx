/** p2 · four hard cuts on four beats: one promise per beat, each with its own colour and icon. */
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Sfx} from '../../core/Sfx';
import {tween} from '../../core/motion';
import {FONT} from '../../core/theme';
import {Mono, PU, Slam} from '../../punch';
import {usePromo} from '../grid';
import {Icon, PHud} from './common';

const ITEMS = [
  {w: '准', en: 'ON CUE', note: '画面对齐旁白的每一个字', bg: PU.hot, ink: PU.paper, icon: 'wave', disc: PU.ink},
  {w: '快', en: 'ONE COMMAND', note: '一条命令出片', bg: PU.paper, ink: '#E8202E', icon: 'bolt', disc: '#E8202E'},
  {w: '稳', en: 'REPRODUCIBLE', note: '两次渲染逐字节一致', bg: PU.sage, ink: PU.ink, icon: 'check', disc: PU.ink},
  {w: '美', en: 'NINE LOOKS', note: '九套风格包随场换', bg: PU.sun, ink: PU.ink, icon: 'swatch', disc: PU.ink},
] as const;

export const P2: React.FC = () => {
  const {f, cue} = usePromo();
  const cuts = ['b0', 'b1', 'b2', 'b3'].map(cue);
  let i = 0;
  cuts.forEach((c, k) => {
    if (f >= c) i = k;
  });
  const it = ITEMS[i];
  const t = f - cuts[i];
  const spin = -140 * (1 - tween(t, 0, 10, 'expo')) + t * (i % 2 ? -2.2 : 2.2);
  const grow = 0.45 + 0.55 * tween(t, 0, 10, 'expo');
  return (
    <AbsoluteFill style={{background: it.bg}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 230, display: 'flex', justifyContent: 'center'}}>
        <Slam key={i} at={cuts[i] + 2} dur={2} from={1.3} amt={0.1} align="center" size={760} color={it.ink}>
          {it.w}
        </Slam>
      </div>
      <div style={{position: 'absolute', left: 540 - 300, top: 1000, width: 600, height: 600, transform: `scale(${grow})`}}>
        <Icon kind={it.icon} size={600} bg={it.disc} fg={it.bg} rot={spin} />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1630, textAlign: 'center', fontFamily: FONT.sans, fontWeight: 900, fontSize: 56, color: it.ink, opacity: tween(t, 3, 6)}}>
        {it.note}
      </div>
      <Mono key={`m${i}`} at={cuts[i] + 2} size={32} color={it.ink} style={{position: 'absolute', left: 72, top: 1726}}>
        {`0${i + 1} — ${it.en}`}
      </Mono>
      <Mono key={`n${i}`} at={cuts[i] + 2} size={32} color={it.ink} style={{position: 'absolute', right: 72, top: 1726}}>
        {`0${i + 1}/04`}
      </Mono>
      <PHud color={it.ink} label="[02] WHY" />
      {cuts.map((c, k) => (
        <React.Fragment key={k}>
          <Sfx at={c} name="slam" volume={0.45} />
          {k > 0 ? <Sfx at={c - 3} name="whip" volume={0.5} /> : null}
        </React.Fragment>
      ))}
    </AbsoluteFill>
  );
};
