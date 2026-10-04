import React from 'react';
import {Composition} from 'remotion';
import {CFG} from './config';
import {Strip} from './core/Strip';
import {totalFrames} from './core/timeline';
import {Video} from './core/Video';

export const Root: React.FC = () => (
  <>
    <Composition id={CFG.id} component={Video} durationInFrames={Math.max(1, totalFrames())} fps={CFG.fps} width={CFG.width} height={CFG.height} />
    {/* review tool (tools/strip.mjs); as long as the film so the frozen <Sequence>s inside aren't clipped */}
    <Composition
      id={`${CFG.id}-strip`}
      component={Strip}
      durationInFrames={Math.max(1, totalFrames())}
      fps={CFG.fps}
      width={CFG.width}
      height={CFG.height}
      defaultProps={{frames: [0, 15, 30, 45], cols: 2}}
    />
  </>
);
