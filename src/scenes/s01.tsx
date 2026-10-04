/** s01 · film pack demo: shots cut on cues, a stamp lands on a spoken word, a quote in the alternate voice. */
import React from 'react';
import {Svg, ease, useScene} from '../core';
import {C, FONT} from '../core/theme';
import {BigQuote, Cam, Count, Desk, Doc, Glow, Graded, Line, MID_Y, Place, Shots, Sky, Stamp, Tag, Void} from '../film';

const Dusk: React.FC<{t: number}> = ({t}) => (
  <Svg>
    <Sky
      id="s01sky"
      stops={[
        [0, '#14132b'],
        [0.5, '#5a2f4a'],
        [0.78, '#d0704a'],
        [1, '#f0b264'],
      ]}
    />
    <Glow x={1300} y={760 + t * 0.04} r={520} op={0.8} />
  </Svg>
);

export const S01: React.FC = () => {
  const {c, w, rel, total} = useScene();
  const shots = [
    {
      // narration starts at c('open'); the shot starts at 0 so it is already there when the chapter card fades
      at: 0,
      el: (t: number, d: number) => (
        <Graded grade="warm">
          <Cam t={t} d={d} z={[1.04, 1.12]} oy={40}>
            <Desk />
            <Doc
              t={t}
              at={c('open') + 4}
              x={560}
              y={170}
              w={800}
              rot={-2}
              kicker="SCRIPT · 第 7 版"
              title="旁白稿"
              rows={[
                {k: '做讲解视频，最磨人的……', v: '00:00.0'},
                {k: '……而是对时间。', v: '00:04.1', mark: true, at: w('对时间')},
              ]}
            />
          </Cam>
          <Place t={t} at={c('open') + 20} year="23:47" place="剪辑台 · 又一次对时间" />
        </Graded>
      ),
    },
    {
      at: c('old'),
      el: (t: number, d: number) => (
        <Graded grade="warm">
          <Cam t={t} d={d} z={[1.0, 1.08]}>
            <Desk lx={45} />
            <Doc
              t={t}
              x={460}
              y={190}
              w={1000}
              rot={1.5}
              kicker="手动时间表"
              title="动画 · 入场时间"
              size={32}
              rows={['标题入场', '图表生长', '引语出现', '结尾定格'].map((k, i) => ({
                k,
                v: `00:${String(3 + i * 4).padStart(2, '0')}.${(i * 37) % 100}`,
                at: 6 + i * 6,
                // once the narration says 改一句, every hand-timed row is wrong
                strike: t >= rel('改一句', 'old') + 8 + i * 4,
              }))}
            />
          </Cam>
          {/* rel(): frames from the cue to a spoken word — exactly the shot-local time t */}
          <Stamp t={t} at={rel('重新对一遍', 'old')} text="全部返工" x={1180} y={610} rot={-10} size={66} />
        </Graded>
      ),
    },
    {
      at: c('idea'),
      tr: 'black' as const,
      el: (t: number, d: number) => (
        <Graded grade="dusk">
          <Cam t={t} d={d} z={[1.0, 1.06]} oy={70}>
            <Dusk t={t} />
          </Cam>
          <Line t={t} at={rel('让旁白', 'idea')} text="让旁白自己当时间轴" size={88} y={MID_Y - 20} sub="narration is the timeline" />
        </Graded>
      ),
    },
    {
      at: c('mark'),
      el: (t: number, d: number) => (
        <Graded grade="cold">
          <Cam t={t} d={d} z={[1.06, 1.0]}>
            <Desk tone="cold" />
            <Doc
              t={t}
              x={360}
              y={160}
              w={1200}
              kicker="tts/script.json"
              title="三种标记"
              size={36}
              rows={[
                {k: <span style={{fontFamily: FONT.mono}}>[[cue]]</span>, v: '镜头 / 动画触发点', at: rel('方括号', 'mark'), mark: true},
                {k: <span style={{fontFamily: FONT.mono}}>||</span>, v: '戏剧停顿', at: rel('合成语音', 'mark')},
                {k: <span style={{fontFamily: FONT.mono}}>{'<<key|……>>'}</span>, v: '换一个声音读引语', at: rel('每个字', 'mark')},
              ]}
            />
          </Cam>
          <Tag t={t} at={rel('记下来', 'mark')} x={960} y={720} text="每个字的出口时间 → src/timings.json" size={34} />
        </Graded>
      ),
    },
    {
      at: c('quote'),
      tr: 'black' as const,
      el: (t: number) => (
        <>
          <Void tint="rgba(255,190,120,0.08)" />
          <BigQuote t={t} at={rel('别对齐', 'quote')} text={'别对齐画面，\n对齐声音。'} who="一位剪辑师" cps={4} size={84} />
        </>
      ),
    },
    {
      at: c('ask'),
      el: (t: number, d: number) => {
        // w(): the scene-local frame of a spoken word — shown on screen as the answer
        const target = w('第几帧');
        return (
          <Graded grade="dusk">
            <Cam t={t} d={d} z={[1.08, 1.0]} oy={60}>
              <Dusk t={t + 400} />
            </Cam>
            <Line t={t} at={rel('这个词', 'ask')} text="这个词，第几帧出现？" size={72} y={400} />
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 560,
                textAlign: 'center',
                fontFamily: FONT.serif,
                fontSize: 96,
                fontWeight: 800,
                color: C.gold,
                opacity: ease(t, rel('第几帧', 'ask') - 6, 10),
              }}
            >
              <Count t={t} at={rel('第几帧', 'ask')} dur={24} to={target} prefix="第 " suffix=" 帧" />
            </div>
            <Tag t={t} at={rel('第几帧', 'ask') + 20} x={960} y={700} text={`w('第几帧') = ${target}`} size={30} />
          </Graded>
        );
      },
    },
  ];
  return <Shots shots={shots} end={total} />;
};
