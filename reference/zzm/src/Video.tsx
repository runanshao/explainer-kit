import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, continueRender, delayRender, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {C, FONT} from './theme';
import {FPS, Lang, SCENE_IDS, SceneProvider, TIMINGS, leadOf, sceneFrames} from './lib';
import {SCENES} from './scenes';
import {BAR, Chapter, Grain, Letterbox, Vignette} from './film';

export const totalFrames = (lang: Lang) => SCENE_IDS.reduce((a, id) => a + sceneFrames(id, lang), 0);
const starts = (lang: Lang) => {
  const out: Record<string, number> = {};
  SCENE_IDS.reduce((acc, id) => ((out[id] = acc), acc + sceneFrames(id, lang)), 0);
  return out;
};
const STARTS: Record<Lang, Record<string, number>> = {zh: starts('zh'), en: starts('zh')};

const fontCss = `
@font-face { font-family: "NotoSansSC"; src: url("${staticFile('fonts/NotoSansSC-VF.ttf')}") format("truetype"); font-weight: 100 900; }
@font-face { font-family: "NotoSerifSC"; src: url("${staticFile('fonts/NotoSerifSC-VF.ttf')}") format("truetype"); font-weight: 200 900; }
`;

const useFonts = () => {
  const [handle] = useState(() => delayRender('fonts'));
  useEffect(() => {
    Promise.all([
      document.fonts.load('400 40px "NotoSansSC"', '台积'),
      document.fonts.load('800 40px "NotoSansSC"', '张忠谋'),
      document.fonts.load('800 40px "NotoSerifSC"', '张忠谋'),
      document.fonts.load('500 40px "NotoSerifSC"', '张忠谋'),
    ])
      .catch(() => undefined)
      .then(() => continueRender(handle));
  }, [handle]);
};

/** Film subtitles, sitting in the bottom letterbox bar. Quoted lines are set in serif gold. */
const Subtitles: React.FC<{id: string; lang: Lang}> = ({id, lang}) => {
  const f = useCurrentFrame();
  const t = (f - leadOf(id)) / FPS;
  const line = TIMINGS[lang][id].lines.find((l: any) => t >= l.start && t < l.end);
  if (!line) return null;
  const text: string = line.text.replace(/[，。；：、]$/, '').trimEnd();
  const q = Boolean(line.q);
  const op = interpolate(t - line.start, [0, 0.1], [0, 1], {extrapolateRight: 'clamp'}) * interpolate(line.end - t, [0, 0.08], [0, 1], {extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: BAR, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: op}}>
      <div
        style={{
          fontFamily: q ? FONT.serif : FONT.sans,
          fontSize: 38,
          fontWeight: q ? 700 : 500,
          letterSpacing: 2,
          whiteSpace: 'pre',
          color: q ? C.gold : 'rgba(242,237,228,0.94)',
        }}
      >
        {q ? `「${text}」` : text}
      </div>
    </div>
  );
};

const splitChapter = (s: string) => {
  const [k, ...rest] = s.split(' · ');
  return {kicker: k, title: rest.join(' · ')};
};

const SceneShell: React.FC<{id: string; lang: Lang}> = ({id, lang}) => {
  const f = useCurrentFrame();
  const n = sceneFrames(id, lang);
  const lead = leadOf(id);
  const Comp = SCENES[id];
  const op = interpolate(f, [n - 18, n], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const ch = splitChapter(TIMINGS[lang][id].chapter);
  return (
    <SceneProvider value={{id, lang}}>
      <AbsoluteFill style={{opacity: op, background: C.black}}>
        {Comp ? <Comp /> : null}
        <Vignette />
        <Grain />
      </AbsoluteFill>
      {lead > 30 ? <Chapter f={f} lead={lead} kicker={ch.kicker} title={ch.title} /> : null}
      <Sequence from={lead} layout="none">
        <Audio src={staticFile(`audio/${id}.mp3`)} />
      </Sequence>
      <Letterbox />
      <Subtitles id={id} lang={lang} />
    </SceneProvider>
  );
};

export const Video: React.FC<{lang: Lang}> = ({lang}) => {
  useFonts();
  return (
    <AbsoluteFill style={{fontFamily: FONT.sans, color: C.ink, background: C.black}}>
      <style>{fontCss}</style>
      {SCENE_IDS.map((id) => (
        <Sequence key={id} from={STARTS[lang][id]} durationInFrames={sceneFrames(id, lang)} name={`${id} ${TIMINGS[lang][id].chapter}`}>
          <SceneShell id={id} lang={lang} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
