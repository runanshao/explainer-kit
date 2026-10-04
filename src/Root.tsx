import React from 'react';
import {Composition} from 'remotion';
import {CFG} from './config';
import {totalFrames} from './core/timeline';
import {Video} from './core/Video';

export const Root: React.FC = () => (
  <Composition id={CFG.id} component={Video} durationInFrames={Math.max(1, totalFrames())} fps={CFG.fps} width={CFG.width} height={CFG.height} />
);
