/** s09 · ink pack demo: mountains bleed in layer by layer, a brush sweeps, vertical text inks in as it's said, a red seal stamps. */
import React from 'react';
import {Full, Spoken, drift, tween, useScene} from '../core';
import {FONT} from '../core/theme';
import {Birds, Brush, I, Mist, Mountains, Seal, VText} from '../ink';

export const S09: React.FC = () => {
  const {f, c, w} = useScene();
  const hill = w('远山') - 4;
  return (
    <Full>
      {/* far → near; each layer arrives on its own beat of "一层一层" */}
      <Mountains
        layers={[
          {at: hill, base: 560, amp: 260, tone: 0.35, seed: 4},
          {at: w('一层') - 2, base: 700, amp: 220, tone: 0.6, seed: 9},
          {at: w('一层', 1) - 2, base: 860, amp: 180, tone: 0.9, seed: 13},
        ]}
      />
      {/* mist only gathers once there are mountains for it to hang between */}
      <Mist y={560} op={0.8 * tween(f, hill + 16, 30)} />
      <Birds at={hill + 20} />

      {/* one sweep of the brush under the poem */}
      <Brush d="M 260 930 C 600 860, 1000 980, 1500 890" at={w('毛笔') - 2} dur={14} w={52} />

      <div style={{position: 'absolute', right: 150, top: 110, display: 'flex', gap: 26, alignItems: 'flex-start', transform: drift(f, 4, 2, 0.1)}}>
        <VText size={120}>
          <Spoken text="水墨风" mode="blur" dur={14} />
        </VText>
        <VText size={34} color={I.seal} style={{fontFamily: FONT.sans, fontWeight: 700}}>
          <Spoken text="第九套" mode="fade" />
        </VText>
      </div>

      {/* one phrase per column, right to left; each character inks in as it is said */}
      <div style={{position: 'absolute', left: 640, top: 150}}>
        <VText size={76}>
          <Spoken text={'竖排的字，\n念到哪里，\n墨就落到哪里'} mode="blur" dur={12} />
        </VText>
      </div>
      <Seal text="旁白为轴" at={w('红印') - 2} x={560} y={660} size={124} />

      {/* the last line gets a small red annotation, like a reader's mark in the margin */}
      <div style={{position: 'absolute', left: 300, top: 220, opacity: f >= c('close') ? 1 : 0}}>
        <VText size={40} color={I.seal} style={{fontFamily: FONT.serif, fontWeight: 700}}>
          <Spoken text="讲历史、讲诗词" mode="fade" />
        </VText>
      </div>
    </Full>
  );
};
