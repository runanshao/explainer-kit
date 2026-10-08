/**
 * The promo shell: sequences the beat-timed scenes of promo/promo.json and plays the transition into each scene so that
 * it *finishes on the downbeat* (the cut lands with the kick). While a transition runs, the incoming scene is shown
 * frozen at its frame 0; the outgoing one keeps playing underneath. Audio: the scenes' <Sfx>; the score is mixed in
 * afterwards by tools/promo.mjs (tools/score.py + tools/master.py).
 * With inputProps {probe: true} it also measures the copy against the platform safe area (src/core/probe.tsx).
 */
import React from 'react';
import {AbsoluteFill, Freeze, Sequence, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {CopyProbe} from '../core/probe';
import {Sfx, SfxMute, type SfxName} from '../core/Sfx';
import {fontCss, useFonts} from '../core/fonts';
import {EASE} from '../core/motion';
import {FONT} from '../core/theme';
import {PROMO, PromoSceneProvider, type PromoScene, SAFE, preRoll, sceneLen, sceneStart} from './grid';
import {PROMO_SCENES} from './scenes';

/** wave edge for the flood transition: y of the liquid surface across the frame at progress p */
const waveY = (x: number, p: number, H: number, t: number) => H * (1.08 - 1.2 * p) + 34 * Math.sin(x * 0.011 + t * 0.5) + 16 * Math.sin(x * 0.027 - t * 0.8);

/** sound under each transition (it starts with the transition, so the swell peaks on the downbeat) */
const TR_SFX: Partial<Record<string, SfxName>> = {iris: 'swish', wipe: 'whip', flood: 'rush', up: 'whoosh'};

const TransitionIn: React.FC<{s: PromoScene; pre: number; children: React.ReactNode}> = ({s, pre, children}) => {
  const t = useCurrentFrame();
  const {width: W, height: H} = useVideoConfig();
  const tr = s.in?.tr ?? 'cut';
  const ease = tr === 'flood' ? EASE.inOut : EASE.in;
  const p = interpolate(t, [0, pre], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
  if (tr === 'flood') {
    const step = 30;
    const pts: string[] = [];
    for (let x = 0; x <= W + step; x += step) pts.push(`${x}px ${waveY(x, p, H, t).toFixed(1)}px`);
    const lead = 110; // the liquid runs ahead of the reveal
    const front: string[] = [];
    for (let x = 0; x <= W + step; x += step) front.push(`${x} ${(waveY(x, p, H, t) - lead).toFixed(1)}`);
    const color = s.in?.color ?? "#FF5B1F";
    return (
      <AbsoluteFill>
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
          <path d={`M0 ${H + 10} L${front.join(' L')} L${W} ${H + 10} Z`} fill={color} />
        </svg>
        <AbsoluteFill style={{clipPath: `polygon(0px ${H + 10}px, ${pts.join(', ')}, ${W}px ${H + 10}px)`}}>{children}</AbsoluteFill>
      </AbsoluteFill>
    );
  }
  const style: React.CSSProperties =
    tr === 'iris'
      ? {clipPath: `circle(${p * Math.hypot(W, H) * 0.6}px at 50% 50%)`}
      : tr === 'wipe'
        ? {clipPath: `polygon(0% 0%, ${p * 140}% 0%, ${p * 140 - 40}% 100%, 0% 100%)`}
        : tr === 'up'
          ? {transform: `translateY(${(1 - p) * 100}%)`}
          : {};
  return <AbsoluteFill style={style}>{children}</AbsoluteFill>;
};

const Missing: React.FC<{id: string}> = ({id}) => (
  <AbsoluteFill style={{background: '#111', color: '#f55', fontFamily: FONT.mono, fontSize: 40, alignItems: 'center', justifyContent: 'center'}}>
    promo scene {id} is not registered in src/promo/scenes/index.ts
  </AbsoluteFill>
);

/** probe: measure the copy against the platform safe area and draw it (src/core/probe.tsx); review renders only */
export type PromoProps = {probe?: boolean};

export const Promo: React.FC<PromoProps> = ({probe}) => {
  useFonts();
  return (
    <AbsoluteFill style={{background: '#000', fontFamily: FONT.sans}}>
      <style>{fontCss}</style>
      {PROMO.scenes.map((s) => {
        const start = sceneStart(s.id);
        const len = sceneLen(s.id);
        const pre = preRoll(s);
        const Comp = PROMO_SCENES[s.id] ?? (() => <Missing id={s.id} />);
        return (
          <React.Fragment key={s.id}>
            {pre > 0 ? (
              <Sequence from={start - pre} durationInFrames={pre} name={`${s.id} ← ${s.in?.tr}`}>
                {TR_SFX[s.in?.tr ?? 'cut'] ? <Sfx at={0} name={TR_SFX[s.in?.tr ?? 'cut']!} /> : null}
                <TransitionIn s={s} pre={pre}>
                  <SfxMute.Provider value>
                    <PromoSceneProvider value={{id: s.id}}>
                      <Freeze frame={0}>
                        <Comp />
                      </Freeze>
                    </PromoSceneProvider>
                  </SfxMute.Provider>
                </TransitionIn>
              </Sequence>
            ) : null}
            <Sequence from={start} durationInFrames={len} name={`${s.id} (${s.bars} bars, ${s.energy})`}>
              <PromoSceneProvider value={{id: s.id}}>
                <AbsoluteFill style={{overflow: 'hidden'}}>
                  <Comp />
                </AbsoluteFill>
              </PromoSceneProvider>
            </Sequence>
          </React.Fragment>
        );
      })}
      {probe ? <CopyProbe safe={SAFE} /> : null}
    </AbsoluteFill>
  );
};
