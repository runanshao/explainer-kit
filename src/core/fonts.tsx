/** Fonts for every composition (the narrated film and the promo): @font-face rules + hold rendering until loaded. */
import {useEffect, useState} from 'react';
import {continueRender, delayRender, staticFile} from 'remotion';
import {CFG} from '../config';

const faceCss = (f: {family?: string; file?: string; weight?: string}) =>
  f.family && f.file
    ? `@font-face { font-family: "${f.family}"; src: url("${staticFile(`fonts/${f.file}`)}") format("truetype"); font-weight: ${f.weight ?? '100 900'}; }`
    : '';

export const fontCss = `
${faceCss(CFG.fonts.sans)}
${faceCss(CFG.fonts.serif)}
.katex { font-size: 1em !important; }
`;

/** Hold rendering until the fonts are in (or have failed — then the system fallbacks in FONT are used). */
export const useFonts = () => {
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

