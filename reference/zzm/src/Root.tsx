import React from 'react';
import {Composition} from 'remotion';
import {Video, totalFrames} from './Video';

export const Root: React.FC = () => (
  <Composition id="ZhangZhongmou" component={Video} defaultProps={{lang: 'zh' as const}} durationInFrames={totalFrames('zh')} fps={30} width={1920} height={1080} />
);
