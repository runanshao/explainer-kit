/** Motion review: several frames of the film tiled into one still (see tools/strip.mjs). */
import React from 'react';
import {AbsoluteFill, Freeze} from 'remotion';
import {CFG, HEIGHT, WIDTH} from '../config';
import {Video} from './Video';

export type StripProps = {frames: number[]; labels?: string[]; cols?: number; format?: string};

/** size of one tile and how much the film is shrunk to fit it */
export const stripTile = (cols: number, format?: string) => {
  const fm = format ? CFG.formats[format] : undefined;
  // main format: tiles split the canvas (cols × cols grid); other formats: quarter-size tiles in a row-major grid
  return fm ? {w: fm.width / 4, h: fm.height / 4, fw: fm.width, fh: fm.height, k: 1 / 4} : {w: WIDTH / cols, h: HEIGHT / cols, fw: WIDTH, fh: HEIGHT, k: 1 / cols};
};

export const Strip: React.FC<StripProps> = ({frames, labels = [], cols = 4, format}) => {
  const t = stripTile(cols, format);
  const max = format ? frames.length : cols * cols;
  return (
    <AbsoluteFill style={{background: '#111'}}>
      {frames.slice(0, max).map((fr, i) => (
        <div key={i} style={{position: 'absolute', left: (i % cols) * t.w, top: Math.floor(i / cols) * t.h, width: t.w, height: t.h, overflow: 'hidden', outline: '1px solid #000'}}>
          <div style={{width: t.fw, height: t.fh, transform: `scale(${t.k})`, transformOrigin: '0 0', position: 'relative'}}>
            <Freeze frame={fr}>
              <Video format={format} />
            </Freeze>
          </div>
          <div style={{position: 'absolute', right: 6, top: 6, padding: '2px 8px', background: 'rgba(0,0,0,0.75)', color: '#ffd84a', font: '600 18px monospace'}}>
            {labels[i] ?? fr}
          </div>
        </div>
      ))}
    </AbsoluteFill>
  );
};
