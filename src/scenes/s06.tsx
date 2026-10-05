/** s06 · math pack demo: axes draw, y = x² is traced, a tangent slides with a live slope, the derivative is derived step by step, then plotted. */
import React from 'react';
import {Full, Sfx, Spoken, Svg, tween, useScene} from '../core';
import {FONT} from '../core/theme';
import {Axes, M, type Plane, Plot, Readout, Steps, Tangent, px, py} from '../math';

const PL: Plane = {x0: -3, x1: 3, y0: -1, y1: 9, left: 120, top: 120, w: 900, h: 760};
const fn = (x: number) => x * x;

export const S06: React.FC = () => {
  const {f, c, w} = useScene();
  const t0 = c('tan');
  // the point never stops: it eases in from the left and keeps swinging, so the slope keeps changing
  const x = f < t0 ? -2.2 : -2.2 * Math.cos((f - t0) / 40);
  const tanOp = tween(f, t0, 12);
  const k = 2 * x;
  const derived = f >= c('result');

  return (
    <Full>
      <Svg>
        <Axes pl={PL} at={w('坐标轴') - 6} />
        <Plot pl={PL} fn={fn} at={w('曲线') - 4} dur={42} color={M.blue} />
        {/* once f'(x) = 2x is derived, it is drawn too */}
        <Plot pl={PL} fn={(v) => 2 * v} at={c('fit')} dur={30} color={M.green} w={5} from={-0.5} to={3} />
        {tanOp > 0 ? <Tangent pl={PL} fn={fn} x={x} op={tanOp} /> : null}
        <text x={px(PL, 2.55)} y={py(PL, 7.8)} fontFamily={FONT.serif} fontStyle="italic" fontSize={40} fill={M.blue} opacity={tween(f, w('曲线') + 30, 12)}>
          y = x²
        </text>
        <text x={px(PL, 1.2)} y={py(PL, 6.6)} fontFamily={FONT.serif} fontStyle="italic" fontSize={36} fill={M.green} opacity={tween(f, c('fit') + 20, 12)}>
          y = 2x
        </text>
      </Svg>

      {/* the narration starts with 第六套, so that lands first and the frame is never empty */}
      <div style={{position: 'absolute', left: 1124, top: 70, fontFamily: FONT.mono, fontSize: 30, letterSpacing: 6, color: M.blue}}>
        <Spoken text="第六套" mode="fade" />
      </div>
      <div style={{position: 'absolute', left: 1120, top: 110, fontFamily: FONT.serif, fontSize: 72, fontWeight: 700, color: M.text}}>
        <Spoken text="数学推导风" mode="blur" />
      </div>
      <div style={{position: 'absolute', left: 1124, top: 210, width: 360 * tween(f, w('推导风') + 10, 18, 'inOut'), height: 4, background: M.blue}} />

      <div style={{position: 'absolute', left: 1124, top: 290, opacity: tanOp, display: 'flex', flexDirection: 'column', gap: 10}}>
        <Readout label="x" value={x} color={M.text} size={40} />
        <Readout label={derived ? 'k = 2x' : 'k'} value={k} size={40} />
      </div>

      <div style={{position: 'absolute', left: 1124, top: 470}}>
        <Steps
          size={54}
          gap={130}
          steps={[
            {at: c('tex'), tex: String.raw`f(x) = x^2`},
            {at: w('极限') - 4, tex: String.raw`f'(x) = \displaystyle\lim_{h \to 0} \frac{(x+h)^2 - x^2}{h}`, color: M.blue},
            {at: w('二倍') - 4, tex: String.raw`f'(x) = 2x`, color: M.yellow},
          ]}
        />
      </div>

      <Sfx at={w('坐标轴') - 6} name="whoosh" volume={0.45} />
      <Sfx at={w('曲线') - 4} name="draw" volume={0.5} />
      <Sfx at={t0} name="pop" volume={0.7} />
      <Sfx at={c('tex')} name="chime" volume={0.45} />
      <Sfx at={w('极限') - 4} name="chime" volume={0.45} />
      <Sfx at={w('二倍') - 4} name="chime" volume={0.6} />
      <Sfx at={c('fit')} name="draw" volume={0.5} />
    </Full>
  );
};
