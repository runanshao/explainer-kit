/** s07 · keynote pack demo: one shape — logo → button → progress bar → glass card → logo — driven by a cursor, with a camera push-in. */
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Full, Spoken, tween, useScene} from '../core';
import {FONT} from '../core/theme';
import {Cursor, K, Morph, Rise, ZoomCam} from '../keynote';

const CX = 960;
const CY = 470;

/** progress fill that runs from `from` to `to` (scene frames) */
const Progress: React.FC<{from: number; to: number}> = ({from, to}) => {
  const f = useCurrentFrame();
  const p = tween(f, from, to - from, 'inOut');
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${p * 100}%`, background: K.accent, borderRadius: 14}} />
    </div>
  );
};

const Card: React.FC = () => (
  <div style={{width: 760, height: 440, padding: 36, boxSizing: 'border-box', fontFamily: FONT.sans, color: K.ink, display: 'flex', flexDirection: 'column', gap: 22}}>
    <div style={{height: 230, borderRadius: 22, background: 'linear-gradient(135deg, #1b2a4a, #3d6fd8 60%, #9cc8ff)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <div style={{width: 84, height: 84, borderRadius: 42, background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, paddingLeft: 6}}>▶</div>
    </div>
    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
      <div>
        <div style={{fontSize: 38, fontWeight: 800, letterSpacing: -0.5}}>explainer-kit.mp4</div>
        <div style={{fontSize: 26, color: K.sub, marginTop: 6}}>1920 × 1080 · 30 fps · 03:02</div>
      </div>
      <div style={{fontSize: 30, fontWeight: 800, color: '#fff', background: K.green, borderRadius: 30, padding: '10px 24px'}}>✓ 已完成</div>
    </div>
  </div>
);

export const S07: React.FC = () => {
  const {f, c, w} = useScene();
  const click = w('一点');
  const bar = click + 4;
  const card = c('card');
  const fin = c('fin');

  return (
    <ZoomCam
      keys={[
        {at: 0, x: CX, y: CY + 70, s: 1},
        // push in on the "done" badge, then pull back out for the ending
        {at: c('zoom'), x: CX + 170, y: CY + 100, s: 1.45},
        {at: fin, x: CX, y: CY + 70, s: 1},
      ]}
    >
      <Full>
        <Morph
          states={[
            {at: 0, x: CX, y: CY, w: 150, h: 150, r: 75, bg: K.ink, content: <div style={{width: 46, height: 46, borderRadius: 23, border: '9px solid #fff', boxSizing: 'border-box'}} />},
            {at: c('btn'), x: CX, y: CY, w: 440, h: 116, r: 58, bg: K.ink, content: <div style={{fontFamily: FONT.sans, fontSize: 42, fontWeight: 700, color: '#fff'}}>开始渲染 ▶</div>},
            {at: bar, x: CX, y: CY, w: 1000, h: 28, r: 14, bg: '#D8D5CF', content: <Progress from={bar + 6} to={card - 4} />},
            {at: card, x: CX, y: CY, w: 760, h: 440, r: 40, bg: '#FFFFFF', glass: true, content: <Card />},
            {at: fin, x: CX - 300, y: CY, w: 150, h: 150, r: 75, bg: K.ink, content: <div style={{width: 46, height: 46, borderRadius: 23, border: '9px solid #fff', boxSizing: 'border-box'}} />},
          ]}
        />

        {/* title under the logo; it gets out of the way as soon as the shape starts working */}
        <div style={{position: 'absolute', left: 0, right: 0, top: CY + 120, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          <Rise at={2} out={c('btn') - 4} size={30} weight={600} color={K.sub}>
            <Spoken text="第七套" mode="fade" />
          </Rise>
          <Rise at={w('发布会风') - 4} out={c('btn') - 2} size={96}>
            发布会风
          </Rise>
        </div>
        {/* progress label rides above the bar */}
        <div style={{position: 'absolute', left: CX - 500, top: CY - 80, fontFamily: FONT.sans, fontSize: 30, fontWeight: 700, color: K.ink, opacity: tween(f, bar + 6, 8) * (1 - tween(f, card - 6, 6))}}>
          渲染中 {Math.round(tween(f, bar + 6, card - 4 - bar - 6, 'inOut') * 100)}%
        </div>

        {/* the ending lands back on the first frame's logo, with the wordmark beside it */}
        <div style={{position: 'absolute', left: CX - 190, top: CY - 66}}>
          <Rise at={fin + 8} size={110}>
            explainer-kit
          </Rise>
        </div>

        <Cursor
          from={c('btn') + 6}
          keys={[
            {at: c('btn') + 6, x: 1500, y: 900},
            {at: click - 16, x: CX + 60, y: CY + 20, click},
            {at: card + 10, x: 1460, y: 820},
            // and leaves the stage for the ending
            {at: fin, x: 2200, y: 1300},
          ]}
        />
      </Full>
    </ZoomCam>
  );
};
