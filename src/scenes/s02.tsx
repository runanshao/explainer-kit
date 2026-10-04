/** s02 · slides pack demo: c() / w() / rel() shown with their live values, a timeline of cues, one KaTeX formula. */
import React from 'react';
import {At, DrawLine, FPS, Full, Svg, Tex, TIMINGS, ease, fu, lerp, pop, useScene, window_} from '../core';
import {C, FONT} from '../core/theme';
import {Chip, H, Kicker, Panel} from '../slides';

const X0 = 160;
const X1 = 1760;
const AXIS_Y = 820;

export const S02: React.FC = () => {
  const {f, c, w, rel, id, lead, total} = useScene();
  const xOf = (fr: number) => lerp(fr / total, X0, X1);
  const cues = Object.keys(TIMINGS[id].cues);

  const head = ease(f, c('api'), 20);
  const cards = window_(f, c('c') - 4, c('formula') + 10, 14);
  const formula = window_(f, c('formula'), c('done') + 6, 14);
  const done = ease(f, c('done'), 20);
  const relFrom = c('rel');
  const relTo = relFrom + rel('多少帧', 'rel');

  const api = [
    {cue: 'c', code: "c('formula')", val: c('formula'), desc: '标记所在的帧', color: C.teal},
    {cue: 'w', code: "w('那一帧')", val: w('那一帧'), desc: '某个词出口的帧', color: C.orange},
    {cue: 'rel', code: "rel('多少帧', 'rel')", val: rel('多少帧', 'rel'), desc: '从标记到这个词隔几帧', color: C.gold},
  ];

  // the formula, filled in with this scene's real numbers for the `formula` cue
  const sec = TIMINGS[id].cues.formula;

  return (
    <Full>
      <At x={160} y={110} style={fu(head)}>
        <Kicker>TIMING API · src/core/timeline.ts</Kicker>
        <H size={72} style={{marginTop: 12}}>
          三个函数，全部按帧
        </H>
      </At>

      <Full style={{opacity: cards}}>
        {api.map((a, i) => {
          const p = ease(f, c(a.cue), 16);
          return (
            <At key={a.cue} x={160 + i * 540} y={330} w={500} style={fu(p, 40)}>
              <Panel accent={a.color} style={{height: 300, boxSizing: 'border-box'}}>
                <Chip color={a.color} size={30} style={{fontFamily: FONT.mono}}>
                  {a.code}
                </Chip>
                <div style={{fontSize: 34, marginTop: 30, color: C.muted}}>{a.desc}</div>
                <div style={{fontSize: 64, fontWeight: 800, marginTop: 18, color: a.color, fontVariantNumeric: 'tabular-nums'}}>= {a.val}</div>
              </Panel>
            </At>
          );
        })}
      </Full>

      <Full style={{opacity: formula}}>
        <At x={960} y={420} center style={{whiteSpace: 'nowrap', transform: `scale(${0.92 + 0.08 * ease(f, c('formula'), 20)})`}}>
          <Tex tex={String.raw`\mathrm{frame} = \mathrm{lead} + \operatorname{round}(t \times \mathrm{fps})`} size={84} />
        </At>
        {/* At `center` composes its own translate(-50%,-50%) with fu()'s translateY */}
        <At x={960} y={590} center style={fu(ease(f, w('乘以帧率'), 16))}>
          <Chip color={C.orange} size={36} style={{fontFamily: FONT.mono}}>
            {`${lead} + round(${sec} × ${FPS}) = ${c('formula')}`}
          </Chip>
        </At>
      </Full>

      <At x={960} y={500} center style={{opacity: done, display: 'flex', alignItems: 'center', gap: 22}}>
        {['script.json', 'gen.py', 'timings.json', '动画'].map((s, i) => (
          <React.Fragment key={s}>
            {i > 0 ? <span style={{fontSize: 40, color: C.muted, opacity: pop(f, c('done') + i * 10)}}>→</span> : null}
            <span style={{display: 'inline-block', transform: `scale(${pop(f, c('done') + i * 10)})`}}>
              <Chip color={i === 3 ? C.orange : C.teal} fill={i === 3} size={38}>
                {s}
              </Chip>
            </span>
          </React.Fragment>
        ))}
      </At>

      {/* the scene's own timeline: every cue as a tick, a playhead, and the rel() span */}
      <Svg>
        <DrawLine x1={X0} y1={AXIS_Y} x2={X1} y2={AXIS_Y} p={ease(f, c('api'), 30)} color={C.panelLine} w={3} />
        {cues.map((k) => {
          const x = xOf(c(k));
          const p = ease(f, c(k), 10);
          return (
            <g key={k} opacity={p}>
              <line x1={x} y1={AXIS_Y - 14} x2={x} y2={AXIS_Y + 14} stroke={C.teal} strokeWidth={3} />
              <text x={x} y={AXIS_Y - 26} textAnchor="middle" fontFamily={FONT.mono} fontSize={22} fill={C.muted}>
                {k}
              </text>
            </g>
          );
        })}
        <DrawLine x1={xOf(relFrom)} y1={AXIS_Y + 34} x2={xOf(relTo)} y2={AXIS_Y + 34} p={ease(f, relTo, 14)} color={C.gold} w={4} arrow />
        <line x1={xOf(f)} y1={AXIS_Y - 40} x2={xOf(f)} y2={AXIS_Y + 40} stroke={C.orange} strokeWidth={2} opacity={0.8} />
      </Svg>
    </Full>
  );
};
