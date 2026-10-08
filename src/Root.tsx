import React from 'react';
import {Composition} from 'remotion';
import {CFG} from './config';
import {Strip, type StripProps, stripTile} from './core/Strip';
import {totalFrames} from './core/timeline';
import {Video} from './core/Video';
import {PROMO, PFPS, promoFrames} from './promo/grid';
import {Promo, type PromoProps} from './promo/Promo';

const frames = Math.max(1, totalFrames());

export const Root: React.FC = () => (
  <>
    <Composition id={CFG.id} component={Video} durationInFrames={frames} fps={CFG.fps} width={CFG.width} height={CFG.height} />
    {/* one composition per extra format: "<id>-9x16", "<id>-1x1", … (kit.config.json "formats") */}
    {Object.entries(CFG.formats ?? {}).map(([key, fm]) => (
      <Composition key={key} id={`${CFG.id}-${key}`} component={Video} durationInFrames={frames} fps={CFG.fps} width={fm.width} height={fm.height} defaultProps={{format: key}} />
    ))}
    {/* review tool (tools/strip.mjs); as long as the film so the frozen <Sequence>s inside aren't clipped */}
    <Composition
      id={`${CFG.id}-strip`}
      component={Strip}
      durationInFrames={frames}
      fps={CFG.fps}
      width={CFG.width}
      height={CFG.height}
      defaultProps={{frames: [0, 15, 30, 45], cols: 2} as StripProps}
      calculateMetadata={({props}) => {
        if (!props.format) return {};
        const cols = props.cols ?? 2;
        const t = stripTile(cols, props.format);
        return {width: Math.round(cols * t.w), height: Math.round(Math.ceil(props.frames.length / cols) * t.h)};
      }}
    />
    {/* the beat-timed promo (promo/promo.json): its own size, timed by the bar grid instead of narration */}
    <Composition id={PROMO.id} component={Promo} defaultProps={{probe: false} as PromoProps} durationInFrames={promoFrames()} fps={PFPS} width={PROMO.width} height={PROMO.height} />
  </>
);
