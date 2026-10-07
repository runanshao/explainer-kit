// The promo's beat grid for the Node tools — the same math as src/promo/grid.ts (promo/promo.json is the source).
import fs from 'node:fs';
import path from 'node:path';
import {CFG, root} from './timeline.mjs';

export const PROMO = JSON.parse(fs.readFileSync(path.join(root, 'promo/promo.json'), 'utf8'));
export const PFPS = PROMO.fps ?? CFG.fps;
export const BEAT = (60 / PROMO.bpm) * PFPS;
export const parsePos = (pos) => {
  const m = /^(\d+):(\d+(?:\.\d+)?)$/.exec(pos);
  if (!m) throw new Error(`bad grid position "${pos}"`);
  return Number(m[1]) * 4 + Number(m[2]);
};
export const beatFrame = (b) => Math.round(b * BEAT);
export const startBeat = {};
{
  let acc = 0;
  for (const s of PROMO.scenes) {
    startBeat[s.id] = acc;
    acc += s.bars * 4;
  }
}
export const TOTAL_BEATS = PROMO.scenes.reduce((a, s) => a + s.bars * 4, 0);
export const total = beatFrame(TOTAL_BEATS);
/** absolute frame of a scene's cue (or of "bar:beat" within it) */
export const cueAbs = (id, cueOrPos) => {
  const s = PROMO.scenes.find((x) => x.id === id);
  if (!s) throw new Error(`unknown promo scene ${id}`);
  const pos = s.cues[cueOrPos] ?? cueOrPos;
  return beatFrame(startBeat[id] + parsePos(pos));
};
/** [id, startFrame, endFrame] in order */
export const spans = () => PROMO.scenes.map((s) => [s.id, beatFrame(startBeat[s.id]), beatFrame(startBeat[s.id] + s.bars * 4)]);
