/** Film style pack. Delete this folder if you only use slides (and remove `film` from src/scenes). */
import React from 'react';
import type {Look} from '../core/look';
import {C} from '../core/theme';
import {BAR, Chapter, Grain, Letterbox, Vignette} from './film';

export * from './film';
export * from './props';

const FilmOverlay: React.FC = () => (
  <>
    <Vignette />
    <Grain />
  </>
);

/** Black canvas, vignette + grain over the picture, 2.2:1 letterbox, subtitles inside the bottom bar. */
export const film: Look = {
  base: C.black,
  overlay: FilmOverlay,
  frame: Letterbox,
  chapter: Chapter,
  subtitles: {bottom: 0, height: BAR, quoteColor: C.gold},
};
