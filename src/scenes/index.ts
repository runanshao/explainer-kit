/** Scene registry: id (as in tts/script.json) → component + look. Scenes with no entry render as empty frames. */
import type {SceneDef} from '../core/look';
import {film} from '../film';
import {slides} from '../slides';
import {S01} from './s01';
import {S02} from './s02';

export const SCENES: Record<string, SceneDef> = {
  s01: {component: S01, look: film},
  s02: {component: S02, look: slides},
};
