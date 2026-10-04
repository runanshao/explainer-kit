/** Scene registry: id (as in tts/script.json) → component + look. Scenes with no entry render as empty frames. */
import type {SceneDef} from '../core/look';
import {editorial} from '../editorial';
import {film} from '../film';
import {neon} from '../neon';
import {paper} from '../paper';
import {slides} from '../slides';
import {S01} from './s01';
import {S02} from './s02';
import {S03} from './s03';
import {S04} from './s04';
import {S05} from './s05';

export const SCENES: Record<string, SceneDef> = {
  // s01 shows its quote big on screen, so the quote line isn't subtitled twice
  s01: {component: S01, look: film, subtitles: {hideQuotes: true}},
  s02: {component: S02, look: slides},
  s03: {component: S03, look: paper},
  s04: {component: S04, look: neon},
  s05: {component: S05, look: editorial},
};
