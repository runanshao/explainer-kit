/** s03 · paper pack demo: strokes draw on and boil, sticky notes drop, arrows connect, the camera pulls back to sum up. */
import React from 'react';
import {Full, Spoken, Svg, drift, eio, lerp, tween, useScene} from '../core';
import {FONT} from '../core/theme';
import {Hand, LabelBox, Marker, Note, P, RoughArrow, RoughCircle, Squiggle} from '../paper';

const BW = 360;
const GAP = 220;
const BOXES = [
  {x: 200, label: '旁白', fill: 'rgba(47,93,168,0.12)'},
  {x: 200 + BW + GAP, label: '时间戳', fill: 'rgba(255,208,52,0.28)'},
  {x: 200 + 2 * (BW + GAP), label: '动画', fill: 'rgba(210,69,59,0.12)'},
];
const BY = 330;
const BH = 190;

export const S03: React.FC = () => {
  const {f, c, w} = useScene();
  // camera: a slow push-in while things are drawn, then a pull back to show the whole page on [[sum]]
  const pull = eio(f, c('sum'), 30);
  const cam = `scale(${lerp(pull, 1 + 0.03 * tween(f, 0, 400, 'inOut'), 0.93)}) ${drift(f, 2, 3, 0.15)}`;

  return (
    <Full style={{transform: cam, transformOrigin: '50% 45%'}}>
      {/* the first words are said before the title, so they get a kicker — the frame is never empty */}
      <div style={{position: 'absolute', left: 206, top: 48}}>
        <Hand size={36} color={P.red} rot={-2} serif={false}>
          <Spoken text="换一套衣服" mode="rise" />
        </Hand>
      </div>
      {/* title appears exactly as it's said, then gets underlined */}
      <div style={{position: 'absolute', left: 200, top: 112}}>
        <Hand size={92} rot={-1.5}>
          <Spoken text="手绘笔记风" mode="pop" />
        </Hand>
      </div>
      <Svg>
        <Squiggle x={196} y={250} width={500} p={tween(f, w('笔记风') + 8, 16, 'inOut')} color={P.red} w={6} />

        {BOXES.map((b, i) => (
          <LabelBox key={b.label} x={b.x} y={BY} width={BW} height={BH} p={tween(f, c('box') + i * 10, 24, 'inOut')} label={b.label} fill={b.fill} seed={11 + i} size={58} />
        ))}

        {/* "画完也不会僵住": circle the last box when the narrator says 抖动 */}
        <RoughCircle cx={BOXES[2].x + BW / 2} cy={BY + BH / 2} rx={250} ry={150} p={tween(f, w('抖动') - 6, 22, 'inOut')} color={P.red} w={5} seed={4} />

        <RoughArrow x1={BOXES[0].x + BW + 20} y1={BY + 80} x2={BOXES[1].x - 20} y2={BY + 80} bow={-30} p={tween(f, w('时间戳') - 4, 16, 'inOut')} seed={21} w={5} color={P.blue} />
        <RoughArrow x1={BOXES[1].x + BW + 20} y1={BY + 80} x2={BOXES[2].x - 20} y2={BY + 80} bow={-30} p={tween(f, w('动画', 1) - 4, 16, 'inOut')} seed={22} w={5} color={P.blue} />
      </Svg>

      <div style={{position: 'absolute', left: 1500, top: 560, opacity: tween(f, w('抖动') + 10, 12), transform: `rotate(-4deg) ${drift(f, 9, 2, 0.8)}`}}>
        <Hand size={34} color={P.red} serif={false}>
          每 4 帧重抖一次
        </Hand>
      </div>

      <Note at={c('note')} x={400} y={720} w={330} h={190} rot={-4} seed={3}>
        <div style={{fontFamily: FONT.mono, fontSize: 40, fontWeight: 700}}>[[cue]]</div>
        <div style={{fontSize: 28, marginTop: 10}}>动画的触发点</div>
      </Note>
      <Note at={c('note') + 7} x={960} y={740} w={330} h={190} rot={3} color={P.noteBlue} seed={5}>
        <div style={{fontFamily: FONT.mono, fontSize: 40, fontWeight: 700}}>w('词')</div>
        <div style={{fontSize: 28, marginTop: 10}}>这个词第几帧</div>
      </Note>

      <div style={{position: 'absolute', left: 1240, top: 690, opacity: tween(f, c('sum'), 14), transform: `rotate(-2deg) translateY(${(1 - tween(f, c('sum'), 18)) * 20}px)`}}>
        <Hand size={56}>
          <Marker at={w('流程')}>讲流程</Marker>、<Marker at={w('因果')}>讲因果</Marker>
        </Hand>
      </div>
    </Full>
  );
};
