import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, continueRender, delayRender, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {C, FONT} from './theme';
import {FPS, LEAD, Lang, SCENE_IDS, SceneProvider, TIMINGS, sceneFrames} from './lib';
import {SCENES} from './scenes';

export const totalFrames = (lang: Lang) => SCENE_IDS.reduce((a, id) => a + sceneFrames(id, lang), 0);
const starts = (lang: Lang) => {
  const out: Record<string, number> = {};
  SCENE_IDS.reduce((acc, id) => ((out[id] = acc), acc + sceneFrames(id, lang)), 0);
  return out;
};
const STARTS: Record<Lang, Record<string, number>> = {zh: starts('zh'), en: starts('en')};

const fontCss = `
@font-face { font-family: "NotoSansSC"; src: url("${staticFile('fonts/NotoSansSC-VF.ttf')}") format("truetype"); font-weight: 100 900; }
@font-face { font-family: "NotoSerifSC"; src: url("${staticFile('fonts/NotoSerifSC-VF.ttf')}") format("truetype"); font-weight: 200 900; }
.katex { font-size: 1em !important; }
`;

const useFonts = () => {
  const [handle] = useState(() => delayRender('fonts'));
  useEffect(() => {
    Promise.all([
      document.fonts.load('400 40px "NotoSansSC"', '本体'),
      document.fonts.load('800 40px "NotoSansSC"', '本体'),
      document.fonts.load('800 40px "NotoSerifSC"', '本体'),
      document.fonts.load('40px KaTeX_Main', 'x'),
      document.fonts.load('italic 40px KaTeX_Math', 'x'),
      document.fonts.load('40px KaTeX_Size1', '('),
      document.fonts.load('40px KaTeX_Size2', '('),
    ])
      .catch(() => undefined)
      .then(() => continueRender(handle));
  }, [handle]);
};

const Background: React.FC = () => {
  const f = useCurrentFrame();
  const drift = (f * 0.25) % 60;
  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse at 30% 20%, ${C.bg2} 0%, ${C.bg} 60%, #051615 100%)`}}>
      <AbsoluteFill
        style={{
          backgroundImage: `radial-gradient(rgba(237,232,220,0.07) 1.6px, transparent 1.6px)`,
          backgroundSize: '60px 60px',
          backgroundPosition: `${drift}px ${drift * 0.5}px`,
        }}
      />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.45) 100%)'}} />
    </AbsoluteFill>
  );
};

const Subtitles: React.FC<{id: string; lang: Lang}> = ({id, lang}) => {
  const f = useCurrentFrame();
  const t = (f - LEAD) / FPS;
  const line = TIMINGS[lang][id].lines.find((l: any) => t >= l.start && t < l.end);
  if (!line) return null;
  const text: string = line.text.replace(lang === 'en' ? /[,;:]$/ : /[，。；：、]$/, '').trimEnd();
  const charTime: number[] = [];
  for (let i = 0; i < text.length; i++) charTime[i] = Infinity;
  for (const w of line.words) for (let i = w.s; i < Math.min(w.e, text.length); i++) charTime[i] = w.t;
  let last = line.start;
  for (let i = 0; i < text.length; i++) charTime[i] = charTime[i] === Infinity ? last : (last = charTime[i]);
  const age = t - line.start;
  const op = interpolate(age, [0, 0.12], [0, 1], {extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 58, display: 'flex', justifyContent: 'center', opacity: op}}>
      <div
        style={{
          fontFamily: FONT.sans,
          fontSize: lang === 'en' ? 38 : 40,
          fontWeight: 600,
          letterSpacing: lang === 'en' ? 0 : 1,
          whiteSpace: 'pre',
          padding: '10px 30px',
          borderRadius: 14,
          background: 'rgba(3,14,14,0.62)',
          backdropFilter: 'blur(6px)',
        }}
      >
        {text.split('').map((ch, i) => (
          <span key={i} style={{color: t >= charTime[i] ? C.ink : 'rgba(237,232,220,0.42)'}}>
            {ch}
          </span>
        ))}
      </div>
    </div>
  );
};

const Chrome: React.FC<{id: string; idx: number; lang: Lang}> = ({id, idx, lang}) => {
  const f = useCurrentFrame();
  const S = STARTS[lang];
  const TOTAL = totalFrames(lang);
  const g = S[id] + f;
  const op = interpolate(f, [0, 15], [0, 1], {extrapolateRight: 'clamp'});
  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: 70,
          top: 48,
          fontFamily: FONT.sans,
          fontSize: 24,
          color: C.muted,
          letterSpacing: 3,
          opacity: op,
          display: 'flex',
          gap: 18,
          alignItems: 'center',
        }}
      >
        <span style={{color: C.orange, fontWeight: 800}}>{String(idx + 1).padStart(2, '0')}</span>
        <span style={{width: 34, height: 2, background: C.dim}} />
        <span>{TIMINGS[lang][id].chapter}</span>
      </div>
      <div style={{position: 'absolute', right: 70, top: 48, fontFamily: FONT.sans, fontSize: 22, color: C.dim, letterSpacing: 4}}>
        {lang === 'en' ? 'WHAT IS AN ONTOLOGY?' : '什么是「本体」· ONTOLOGY'}
      </div>
      <div style={{position: 'absolute', left: 0, bottom: 0, height: 6, width: 1920, background: 'rgba(237,232,220,0.06)'}}>
        <div style={{height: 6, width: (1920 * g) / TOTAL, background: `linear-gradient(90deg, ${C.tealDeep}, ${C.teal})`}} />
        {SCENE_IDS.map((sid) => (
          <div key={sid} style={{position: 'absolute', top: 0, left: (1920 * S[sid]) / TOTAL, width: 3, height: 6, background: C.bg}} />
        ))}
      </div>
    </>
  );
};

const SceneShell: React.FC<{id: string; idx: number; lang: Lang}> = ({id, idx, lang}) => {
  const f = useCurrentFrame();
  const n = sceneFrames(id, lang);
  const Comp = SCENES[id];
  const op = interpolate(f, [0, 10, n - 10, n], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <SceneProvider value={{id, lang}}>
      <AbsoluteFill style={{opacity: op}}>{Comp ? <Comp /> : null}</AbsoluteFill>
      <Sequence from={LEAD} layout="none">
        <Audio src={staticFile(lang === 'en' ? `audio/en/${id}.mp3` : `audio/${id}.mp3`)} />
      </Sequence>
      <Chrome id={id} idx={idx} lang={lang} />
      <Subtitles id={id} lang={lang} />
    </SceneProvider>
  );
};

export const Video: React.FC<{lang: Lang}> = ({lang}) => {
  useFonts();
  return (
    <AbsoluteFill style={{fontFamily: FONT.sans, color: C.ink, ['--latin' as any]: lang === 'en' ? '"Segoe UI"' : '"NotoSansSC"', ['--latin-serif' as any]: lang === 'en' ? 'Georgia' : '"NotoSerifSC"'}}>
      <style>{fontCss}</style>
      <Background />
      {SCENE_IDS.map((id, i) => (
        <Sequence key={id} from={STARTS[lang][id]} durationInFrames={sceneFrames(id, lang)} name={`${id} ${TIMINGS[lang][id].chapter}`}>
          <SceneShell id={id} idx={i} lang={lang} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
