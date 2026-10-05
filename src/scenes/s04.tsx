/** s04 · neon pack demo: a terminal types, a node graph lights up node by node, pulses flow, a glitch cut, a zoom-through. */
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Sfx, SfxAt, Shots, Spoken, useScene} from '../core';
import {FONT} from '../core/theme';
import {Brackets, Glitch, N, Neon, Net, Term} from '../neon';

const STEPS = ['script.json', 'gen.py', 'timings.json', 'Remotion'];

export const S04: React.FC = () => {
  const {c, w, total} = useScene();
  const netAt = c('net');
  const nodes = STEPS.map((label, i) => ({id: label, label, x: 1140 + (i % 2) * 460, y: 330 + Math.floor(i / 2) * 300, at: netAt + i * 9, color: i === 3 ? N.magenta : N.cyan}));
  const edges = [
    {a: STEPS[0], b: STEPS[1], at: netAt + 5},
    {a: STEPS[1], b: STEPS[2], at: netAt + 14},
    {a: STEPS[2], b: STEPS[3], at: netAt + 23},
  ];
  const shots = [
    {
      at: 0,
      el: () => (
        <>
          <div style={{position: 'absolute', left: 144, top: 66, fontFamily: FONT.mono, fontSize: 30, color: N.lime, letterSpacing: 4}}>
            {'> '}
            <Spoken text="再换一套" mode="fade" />
          </div>
          <div style={{position: 'absolute', left: 140, top: 110}}>
            <Neon at={c('boot') + 2} size={84} color={N.magenta}>
              <Spoken text="深色科技风" mode="blur" />
            </Neon>
          </div>
          <Term
            x={140}
            y={300}
            w={820}
            at={c('term')}
            lines={[
              {text: 'python tts/gen.py --mock', at: c('term') + 6},
              {text: 's01   34.6s  cues 6', at: w('一行命令') + 14, out: true},
              {text: 's02   22.1s  cues 6', at: w('一行命令') + 18, out: true},
              {text: '→ src/timings.json', at: w('一行命令') + 24, out: true, color: N.lime},
            ]}
          />
          <Net nodes={nodes} edges={edges} flowFrom={c('flow')} />
        </>
      ),
    },
    {
      at: c('glitch'),
      tr: 'cut' as const,
      el: () => (
        // a second, smaller burst lands on the word itself
        <Glitch at={c('glitch')} dur={12} amp={70}>
          <Glitch at={w('故障感')} dur={8} amp={36}>
            <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', paddingBottom: 140}}>
              <div style={{fontFamily: FONT.mono, fontSize: 34, color: N.lime, letterSpacing: 6, marginBottom: 26}}>{'<Glitch at={c(\'glitch\')} />'}</div>
              <Neon at={c('glitch')} size={120} color={N.cyan} seed={5}>
                故障感
              </Neon>
            </AbsoluteFill>
            <Brackets x={560} y={300} w={800} h={340} at={c('glitch') + 4} />
          </Glitch>
        </Glitch>
      ),
    },
    {
      at: c('fit'),
      tr: 'zoom' as const,
      el: () => (
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', gap: 30, paddingBottom: 140}}>
          <Neon at={c('fit') + 4} size={110} color={N.magenta} seed={7}>
            讲系统 · 讲架构
          </Neon>
          <div style={{fontFamily: FONT.mono, fontSize: 30, color: N.dim, letterSpacing: 3}}>
            <Spoken text="就用这一套" mode="fade" style={{color: N.text}} />
          </div>
        </AbsoluteFill>
      ),
    },
  ];
  const cmd = 'python tts/gen.py --mock';
  // a keystroke every other character of the typed command (Term types at 28 chars/s)
  const keys = Array.from({length: Math.ceil(cmd.length / 2)}, (_, i) => c('term') + 6 + Math.round((i * 2 * 30) / 28));
  return (
    <>
      <Shots shots={shots} end={total} />
      <SfxAt frames={keys} name="type" volume={0.7} />
      <SfxAt frames={[w('一行命令') + 14, w('一行命令') + 18, w('一行命令') + 24]} name="tick" volume={0.7} />
      <SfxAt frames={nodes.map((n) => n.at)} name="pop" volume={0.8} />
      <Sfx at={c('glitch')} name="glitch" />
      <Sfx at={w('故障感')} name="glitch" volume={0.6} />
    </>
  );
};
