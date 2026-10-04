/** Motion review: several frames of the film tiled into one still (see tools/strip.mjs). */
import React from 'react';
import {AbsoluteFill, Freeze} from 'remotion';
import {HEIGHT, WIDTH} from '../config';
import {Video} from './Video';

export type StripProps = {frames: number[]; labels?: string[]; cols?: number};

export const Strip: React.FC<StripProps> = ({frames, labels = [], cols = 4}) => {
  const w = WIDTH / cols;
  const h = HEIGHT / cols;
  return (
    <AbsoluteFill style={{background: '#111'}}>
      {frames.slice(0, cols * cols).map((fr, i) => (
        <div key={i} style={{position: 'absolute', left: (i % cols) * w, top: Math.floor(i / cols) * h, width: w, height: h, overflow: 'hidden', outline: '1px solid #000'}}>
          <div style={{width: WIDTH, height: HEIGHT, transform: `scale(${1 / cols})`, transformOrigin: '0 0', position: 'relative'}}>
            <Freeze frame={fr}>
              <Video />
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
