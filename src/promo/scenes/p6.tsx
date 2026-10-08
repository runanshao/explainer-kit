/** p6 · the build: two crossing marquees, folded shut on beat 3; the logo's outline draws in the hush before the drop. */
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Sfx} from '../../core/Sfx';
import {LogoReveal, Marquee, PU, type LogoData} from '../../punch';
import logo from '../../brand/logo.json';
import {usePromo} from '../grid';
import {PHud} from './common';

export const LOGO = logo as LogoData;
export const MARK = {x: 540, y: 680, size: 480};

export const P6: React.FC = () => {
  const {f, cue, len} = usePromo();
  const flash = Math.exp(-f / 3) * 0.4;
  return (
    <AbsoluteFill style={{background: PU.ink}}>
      <Marquee at={cue('bands')} out={cue('fold')} y={960} rot={-14} bg={PU.sage} color={PU.ink} text="旁白就是时间轴 ● 每一帧都是纯函数 ● " />
      <Marquee at={cue('bands') + 2} out={cue('fold') + 1} y={960} rot={10} bg={PU.hot} color={PU.paper} dir={-1} text="FILM ● PAPER ● NEON ● INK ● PIXEL ● KEYNOTE ● " />
      <LogoReveal logo={LOGO} {...MARK} draw={cue('ring')} drawDur={16} fill={len} drop={['play']} />
      <AbsoluteFill style={{background: '#fff', opacity: flash}} />
      <PHud color={PU.paper} label="[06] BUILD" />
      <Sfx at={cue('bands')} name="impact" volume={0.7} />
      <Sfx at={cue('fold') - 2} name="swish" />
      <Sfx at={cue('ring')} name="shimmer" volume={0.8} />
      <Sfx at={len - 45} name="riser" volume={0.8} />
      <Sfx at={len - 15} name="revcrash" />
      <Sfx at={len - 6} name="whoosh" volume={0.5} />
    </AbsoluteFill>
  );
};
