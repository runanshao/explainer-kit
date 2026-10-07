/**
 * The shell: sequences scenes, plays each scene's narration, draws chapter cards and subtitles, loads fonts.
 * Scenes are always authored on the main WIDTH × HEIGHT canvas; for the extra formats in kit.config.json
 * ("9x16", "1x1"…) the shell fits that picture into the taller frame with a title band above and big captions below.
 */
import React from 'react';
import {AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {HEIGHT, WIDTH} from '../config';
import {CFG, FPS} from '../config';
import {SCENES} from '../scenes';
import type {ChapterProps, Look, SubtitleStyle} from './look';
import {C, FONT, inkOn, lum} from './theme';
import {SCENE_IDS, SceneProvider, TIMINGS, audioOf, leadOf, sceneFrames, sceneStarts} from './timeline';
import {fontCss, useFonts} from './fonts';

const STARTS = sceneStarts();

const DefaultChapter: React.FC<ChapterProps> = ({f, lead, kicker, title}) => {
  const op = interpolate(f, [0, 8, lead - 10, lead], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{background: C.black, opacity: op, alignItems: 'center', justifyContent: 'center', fontFamily: FONT.sans, color: C.ink}}>
      <div style={{fontSize: 28, letterSpacing: 8, color: C.muted}}>{kicker}</div>
      <div style={{fontSize: 72, fontWeight: 800, marginTop: 18}}>{title}</div>
    </AbsoluteFill>
  );
};

const DEFAULT_SUBS: SubtitleStyle = {bottom: 58, box: true};

const Subtitles: React.FC<{id: string; s: SubtitleStyle}> = ({id, s}) => {
  const f = useCurrentFrame();
  const t = (f - leadOf(id)) / FPS;
  const line = TIMINGS[id].lines.find((l) => t >= l.start && t < l.end);
  if (!line || (line.q && s.hideQuotes)) return null;
  const text = line.text.replace(/[，。；：、,.;:]$/, '').trimEnd();
  const q = Boolean(line.q);
  const op =
    interpolate(t - line.start, [0, 0.1], [0, 1], {extrapolateRight: 'clamp'}) *
    interpolate(line.end - t, [0, 0.08], [0, 1], {extrapolateRight: 'clamp'});
  // a new line settles up into place instead of popping
  const rise = interpolate(t - line.start, [0, 0.18], [8, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const color = q ? (s.quoteColor ?? C.gold) : (s.color ?? 'rgba(242,237,228,0.94)');
  let body: React.ReactNode = text;
  if (s.karaoke) {
    // time at which each character is reached; characters without a word inherit the previous word's time
    const at: number[] = [];
    let last = line.start;
    for (let i = 0; i < text.length; i++) {
      const wd = line.words.find((x) => i >= x.s && i < x.e);
      at[i] = wd ? (last = wd.t) : last;
    }
    body = text.split('').map((ch, i) => (
      <span key={i} style={{opacity: t >= at[i] ? 1 : (s.dim ?? 0.45)}}>
        {ch}
      </span>
    ));
  }
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: s.bottom,
        height: s.height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: op,
      }}
    >
      <div
        style={{
          fontFamily: q ? FONT.serif : FONT.sans,
          fontSize: s.size ?? 38,
          fontWeight: q ? 700 : 500,
          letterSpacing: 2,
          whiteSpace: s.maxWidth ? 'pre-wrap' : 'pre',
          maxWidth: s.maxWidth,
          textAlign: 'center',
          lineHeight: 1.35,
          color,
          transform: `translateY(${rise}px)`,
          ...(s.box ? {padding: '10px 30px', borderRadius: 14, background: s.boxColor ?? 'rgba(3,10,10,0.62)'} : null),
        }}
      >
        {q ? '「' : null}
        {body}
        {q ? '」' : null}
      </div>
    </div>
  );
};

const splitChapter = (s: string) => {
  const [k, ...rest] = s.split(' · ');
  return rest.length ? {kicker: k, title: rest.join(' · ')} : {kicker: '', title: k};
};

export type FormatKey = string | undefined;

const SceneShell: React.FC<{id: string; format?: FormatKey}> = ({id, format}) => {
  const f = useCurrentFrame();
  const n = sceneFrames(id);
  const lead = leadOf(id);
  const def = SCENES[id];
  const look: Look = def?.look ?? {};
  const Comp = def?.component;
  const Bg = look.background;
  const Over = look.overlay;
  const Frame = look.frame;
  const Chapter = look.chapter === undefined ? DefaultChapter : look.chapter;
  const op = interpolate(f, [n - 18, n], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const ch = splitChapter(TIMINGS[id].chapter);
  const subs = {...(look.subtitles ?? DEFAULT_SUBS), ...def?.subtitles};
  const audio = (
    <Sequence from={lead} layout="none">
      <Audio src={staticFile(audioOf(id))} />
    </Sequence>
  );
  const picture = (
    <>
      <AbsoluteFill style={{opacity: op, background: look.base ?? C.black, overflow: 'hidden'}}>
        {Bg ? <Bg /> : null}
        {Comp ? <Comp /> : null}
        {Over ? <Over /> : null}
      </AbsoluteFill>
      {Chapter && lead > 30 ? <Chapter f={f} lead={lead} kicker={ch.kicker} title={ch.title} /> : null}
      {Frame ? <Frame /> : null}
    </>
  );

  const fmt = format ? CFG.formats[format] : undefined;
  if (!fmt) {
    return (
      <SceneProvider value={{id}}>
        {picture}
        {audio}
        <Subtitles id={id} s={subs} />
      </SceneProvider>
    );
  }

  // ── portrait / square: title band, the 16:9 picture, caption band ──
  const W = fmt.width;
  const H = fmt.height;
  const zoom = def?.portrait?.zoom ?? fmt.zoom ?? 1;
  const ps = (W / WIDTH) * zoom;
  const pw = WIDTH * ps;
  const ph = HEIGHT * ps;
  const focus = def?.portrait?.focus ?? 0.5;
  const px = Math.min(0, Math.max(W - pw, W / 2 - focus * pw));
  const tall = H / W > 1.3;
  // picture centred; the title band takes the space above it and the captions the space below
  const py = Math.round((H - ph) / 2);
  const capTop = py + ph;
  const light = lum(look.base) > 0.5;
  const ink = inkOn(look.base);
  const accent = subs.quoteColor ?? C.gold;
  // the background layer alone, scaled to cover the whole frame and softened, so the bands carry the pack's ground
  const cover = Math.max(W / WIDTH, H / HEIGHT);
  const titleIn = interpolate(f, [0, 14], [0, 1], {extrapolateRight: 'clamp'});
  return (
    <SceneProvider value={{id}}>
      <AbsoluteFill style={{background: look.base ?? C.black, overflow: 'hidden', opacity: op}}>
        {Bg ? (
          <div style={{position: 'absolute', left: (W - WIDTH * cover) / 2, top: (H - HEIGHT * cover) / 2, width: WIDTH, height: HEIGHT, transform: `scale(${cover})`, transformOrigin: '0 0', filter: 'blur(18px)', opacity: 0.85}}>
            <Bg />
          </div>
        ) : null}
        <AbsoluteFill style={{background: light ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.35)'}} />
      </AbsoluteFill>

      {/* title band: chapter kicker + title, sitting just above the picture */}
      <div
        style={{
          position: 'absolute',
          left: 60,
          right: 60,
          bottom: H - py + (tall ? 40 : 18),
          textAlign: 'center',
          fontFamily: FONT.sans,
          color: ink,
          opacity: titleIn * op,
          transform: `translateY(${(1 - titleIn) * 20}px)`,
        }}
      >
        {ch.kicker ? <div style={{fontSize: tall ? 34 : 24, letterSpacing: 8, color: accent, fontWeight: 700}}>{ch.kicker}</div> : null}
        <div style={{fontSize: tall ? 76 : 44, fontWeight: 900, marginTop: tall ? 12 : 4, lineHeight: 1.15}}>{ch.title}</div>
      </div>

      <div style={{position: 'absolute', left: 0, top: py, width: W, height: ph, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.35)'}}>
        <div style={{position: 'absolute', left: px, top: 0, width: WIDTH, height: HEIGHT, transform: `scale(${ps})`, transformOrigin: '0 0'}}>{picture}</div>
      </div>
      {audio}

      <Subtitles
        id={id}
        s={{
          ...subs,
          bottom: H - capTop - (tall ? 340 : H - capTop),
          height: tall ? 340 : H - capTop,
          // as big as possible while a full line (kit.config.json maxLine characters) still fits on one row
          size: Math.min(tall ? 56 : 40, Math.floor((W - 110) / (CFG.maxLine + 0.6))),
          maxWidth: W - 120,
          box: subs.box,
        }}
      />
      {/* overall progress, the way short-video players show it */}
      <ProgressBar id={id} W={W} color={accent} />
    </SceneProvider>
  );
};

const TOTAL = SCENE_IDS.reduce((a, id) => a + sceneFrames(id), 0);
const ProgressBar: React.FC<{id: string; W: number; color: string}> = ({id, W, color}) => {
  const f = useCurrentFrame();
  const p = (STARTS[id] + f) / Math.max(1, TOTAL);
  return (
    <>
      <div style={{position: 'absolute', left: 0, bottom: 0, width: W, height: 8, background: 'rgba(127,127,127,0.25)'}} />
      <div style={{position: 'absolute', left: 0, bottom: 0, width: W * p, height: 8, background: color}} />
    </>
  );
};

export const Video: React.FC<{format?: FormatKey}> = ({format}) => {
  useFonts();
  return (
    <AbsoluteFill style={{fontFamily: FONT.sans, color: C.ink, background: C.black}}>
      <style>{fontCss}</style>
      {SCENE_IDS.map((id) => (
        <Sequence key={id} from={STARTS[id]} durationInFrames={sceneFrames(id)} name={`${id} ${TIMINGS[id].chapter}`}>
          <SceneShell id={id} format={format} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
