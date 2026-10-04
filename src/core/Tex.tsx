/** KaTeX formula. Fonts are awaited by the Video shell (delayRender) before frames are captured. */
import React, {useMemo} from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import {C} from './theme';

export const Tex: React.FC<{tex: string; size?: number; color?: string; style?: React.CSSProperties; display?: boolean}> = ({
  tex,
  size = 48,
  color = C.ink,
  style,
  display = false,
}) => {
  const html = useMemo(
    () => katex.renderToString(tex, {displayMode: display, throwOnError: false, strict: false, output: 'html'}),
    [tex, display],
  );
  return <span style={{fontSize: size, color, lineHeight: 1.2, ...style}} dangerouslySetInnerHTML={{__html: html}} />;
};
