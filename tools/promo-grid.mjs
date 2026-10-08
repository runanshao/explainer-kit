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

const scenePre = (s) => (s.in && s.in.tr !== 'cut' ? Math.max(2, Math.round((s.in.beats ?? 0.5) * BEAT)) : 0);

/**
 * The frame a cue *reads* at: once its hit has settled (10 frames after it), or just before the next cue starts to
 * move in (5 frames ahead of it: a Slam lands *on* its cue, a carousel slides in 3 frames early) — whichever is first.
 * That is what a viewer has time to read, so that is what gets checked.
 */
export const settleAbs = (id, cue) => {
  const s = PROMO.scenes.find((x) => x.id === id);
  const at = cueAbs(id, cue);
  const end = beatFrame(startBeat[id] + s.bars * 4);
  const next = Math.min(end, ...Object.keys(s.cues).map((k) => cueAbs(id, k)).filter((fr) => fr > at));
  return Math.max(at + 2, Math.min(next - 5, at + 10));
};

/** "scene:cue" (promo.json "cover") → the frame exported as the upload cover */
export const coverFrame = () => {
  const [id, cue] = (PROMO.cover ?? `${PROMO.scenes.at(-1).id}:${Object.keys(PROMO.scenes.at(-1).cues).pop()}`).split(':');
  return settleAbs(id, cue);
};

/**
 * What to look at before delivery, in film order — including the frames a cue-only check never sees:
 * - "first"  frame 0: the thumbnail and the first impression; it must already carry copy (a hook)
 * - "read"   every cue once settled: checked against the platform safe area
 * - "move"   the middle of every transition: looked at, not measured (half the frame is still the last scene)
 * - "cover"  the frame exported as the cover; "end" the last frame
 */
export const reviewSpots = () => {
  const spots = [{label: 'first', frame: 0, kind: 'first'}];
  for (const s of PROMO.scenes) {
    const pre = scenePre(s);
    if (pre) spots.push({label: `${s.id} ← ${s.in.tr}`, frame: beatFrame(startBeat[s.id]) - Math.ceil(pre / 2), kind: 'move'});
    const seen = new Set();
    for (const k of Object.keys(s.cues)) {
      const frame = settleAbs(s.id, k);
      if (seen.has(frame)) continue;
      seen.add(frame);
      spots.push({label: `${s.id}:${k}`, frame, kind: 'read'});
    }
  }
  spots.push({label: 'cover', frame: coverFrame(), kind: 'read'}, {label: 'end', frame: total - 1, kind: 'read'});
  const byFrame = new Map();
  for (const sp of spots) if (!byFrame.has(sp.frame) || sp.kind === 'first') byFrame.set(sp.frame, sp);
  return [...byFrame.values()].sort((a, b) => a.frame - b.frame);
};
