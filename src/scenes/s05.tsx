/** s05 · editorial pack demo: masked headlines, type that drops in word by word with the voice, a block wipe, a slammed number. */
import React from 'react';
import {CFG, Full, Sfx, Spoken, life, move, tween, useScene} from '../core';
import {Block, E, Label, MaskText, Rule, Slam, Ticker} from '../editorial';

export const S05: React.FC = () => {
  const {f, c, w} = useScene();
  // the red block covers the frame on [[block]]; everything before it leaves while covered
  const wipe = c('block');
  const covered = wipe + 16;
  const num = life(f, w('一百二十') - 2, c('out'), 10, 14);

  return (
    <Full>
      {f < covered ? (
        <>
          <div style={{position: 'absolute', left: 160, top: 130}}>
            <Label>No. 05 — EDITORIAL</Label>
          </div>
          <Rule x={160} y={190} w={1600} at={Math.max(0, c('big') - 24)} />
          <div style={{position: 'absolute', left: 150, top: 240}}>
            {/* already in place under the chapter card (which uses the same masthead), so the card dissolves into the scene */}
            <MaskText at={Math.max(0, c('big') - 24)} lines={['杂志排版。']} size={200} />
          </div>
          <div style={{position: 'absolute', left: 160, top: 560, fontSize: 92, fontWeight: 900, color: E.ink, lineHeight: 1.25, letterSpacing: -1}}>
            <Spoken text={'大字跟着旁白，\n一个一个跳出来'} mode="drop" hot={['跳出来']} hotColor={E.red} />
          </div>
        </>
      ) : (
        <>
          <div style={{position: 'absolute', left: 160, top: 96, fontSize: 108, fontWeight: 900, color: E.ink, letterSpacing: -1, ...move('rise', 1, num.q)}}>
            <Spoken text="数字直接砸在屏幕上" mode="drop" />
          </div>
          <Rule x={160} y={250} w={1600} at={covered + 2} />
          <div style={{position: 'absolute', left: 140, top: 280, transformOrigin: '0 50%', ...move('rise', 1, num.q, 60)}}>
            <Slam at={w('一百二十')} hits={[w('帧')]} size={380}>
              120
            </Slam>
          </div>
          <div style={{position: 'absolute', left: 900, top: 450, ...move('rise', num.p, num.q)}}>
            <MaskText at={w('帧') - 2} lines={['帧']} size={200} color={E.red} />
          </div>
          <div style={{position: 'absolute', left: 166, top: 720, ...move('rise', tween(f, w('帧') + 6, 14), num.q)}}>
            <Label color={E.grey} size={36}>
              = 4 秒 × 30 fps
            </Label>
          </div>
          <div style={{position: 'absolute', left: 160, top: 300}}>
            <MaskText at={c('out') + 8} lines={['讲观点，', '讲金句。']} size={150} gap={6} />
          </div>
          <Ticker y={760} at={c('out') + 6} text={`${CFG.brand.name.toUpperCase()} · 杂志排版 · KINETIC TYPE`} />
        </>
      )}
      <Block x={0} y={0} w={1920} h={1080} at={wipe} out={covered} dur={16} color={E.red} />
      <Sfx at={wipe - 2} name="whoosh" />
      <Sfx at={covered} name="swish" volume={0.6} />
      <Sfx at={w('一百二十')} name="slam" />
      <Sfx at={w('帧')} name="thud" volume={0.7} />
      <Sfx at={c('out')} name="whoosh" volume={0.5} />
    </Full>
  );
};
