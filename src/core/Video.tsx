/** The shell: sequences scenes, plays each scene's narration, draws chapter cards and subtitles, loads fonts. */
import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, continueRender, delayRender, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {CFG, FPS} from '../config';
import {SCENES} from '../scenes';
import type {ChapterProps, Look, SubtitleStyle} from './look';
import {C, FONT} from './theme';
import {SCENE_IDS, SceneProvider, TIMINGS, audioOf, leadOf, sceneFrames, sceneStarts} from './timeline';

const STARTS = sceneStarts();

const faceCss = (f: {family?: string; file?: string; weight?: string}) =>
  f.family && f.file
    ? `@font-face { font-family: "${f.family}"; src: url("${staticFile(`fonts/${f.file}`)}") format("truetype"); font-weight: ${f.weight ?? '100 900'}; }`
    : '';

const fontCss = `
${faceCss(CFG.fonts.sans)}
${faceCss(CFG.fonts.serif)}
.katex { font-size: 1em !important; }
`;

/** Hold rendering until the fonts are in (or have failed — then the system fallbacks in FONT are used). */
const useFonts = () => {
  const [handle] = useState(() => delayRender('fonts'));
  useEffect(() => {
    const fams = [CFG.fonts.sans.family, CFG.fonts.serif.family].filter(Boolean);
    Promise.allSettled([
      ...fams.flatMap((fam) => [document.fonts.load(`400 40px "${fam}"`, '字体'), document.fonts.load(`800 40px "${fam}"`, '字体')]),
      document.fonts.load('40px KaTeX_Main', 'x'),
      document.fonts.load('italic 40px KaTeX_Math', 'x'),
      document.fonts.load('40px KaTeX_Size1', '('),
      document.fonts.load('40px KaTeX_Size2', '('),
    ]).then(() => continueRender(handle));
  }, [handle]);
};

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
  if (!line) return null;
  const text = line.text.replace(/[，。；：、,.;:]$/, '').trimEnd();
  const q = Boolean(line.q);
  const op =
    interpolate(t - line.start, [0, 0.1], [0, 1], {extrapolateRight: 'clamp'}) *
    interpolate(line.end - t, [0, 0.08], [0, 1], {extrapolateRight: 'clamp'});
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
      <span key={i} style={{opacity: t >= at[i] ? 1 : 0.45}}>
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
          whiteSpace: 'pre',
          color,
          ...(s.box ? {padding: '10px 30px', borderRadius: 14, background: 'rgba(3,10,10,0.62)'} : null),
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

const SceneShell: React.FC<{id: string}> = ({id}) => {
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
  return (
    <SceneProvider value={{id}}>
      <AbsoluteFill style={{opacity: op, background: look.base ?? C.black, overflow: 'hidden'}}>
        {Bg ? <Bg /> : null}
        {Comp ? <Comp /> : null}
        {Over ? <Over /> : null}
      </AbsoluteFill>
      {Chapter && lead > 30 ? <Chapter f={f} lead={lead} kicker={ch.kicker} title={ch.title} /> : null}
      <Sequence from={lead} layout="none">
        <Audio src={staticFile(audioOf(id))} />
      </Sequence>
      {Frame ? <Frame /> : null}
      <Subtitles id={id} s={look.subtitles ?? DEFAULT_SUBS} />
    </SceneProvider>
  );
};

export const Video: React.FC = () => {
  useFonts();
  return (
    <AbsoluteFill style={{fontFamily: FONT.sans, color: C.ink, background: C.black}}>
      <style>{fontCss}</style>
      {SCENE_IDS.map((id) => (
        <Sequence key={id} from={STARTS[id]} durationInFrames={sceneFrames(id)} name={`${id} ${TIMINGS[id].chapter}`}>
          <SceneShell id={id} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
