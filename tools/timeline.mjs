// Shared by the Node tools: config, timings and the same frame math as src/core/timeline.ts.
import fs from 'node:fs';
import path from 'node:path';

export const root = path.resolve(import.meta.dirname, '..');
export const CFG = JSON.parse(fs.readFileSync(path.join(root, 'kit.config.json'), 'utf8'));
export const T = JSON.parse(fs.readFileSync(path.join(root, 'src/timings.json'), 'utf8'));
export const FPS = CFG.fps;
export const IDS = Object.keys(T);

export const leadOf = (id) => CFG.pace.leadOverride?.[id] ?? CFG.pace.lead;
export const tailOf = (id) => CFG.pace.tailOverride?.[id] ?? CFG.pace.tail;
export const narrEnd = (id) => leadOf(id) + Math.ceil(T[id].duration * FPS);
export const sceneLen = (id) => narrEnd(id) + tailOf(id);
export const starts = {};
{
  let acc = 0;
  for (const id of IDS) {
    starts[id] = acc;
    acc += sceneLen(id);
  }
}
/** scene-local frame of a cue ('end' = end of narration) */
export const cueFrame = (id, cue) => {
  if (cue === 'end') return narrEnd(id);
  const v = T[id].cues[cue];
  if (v === undefined) throw new Error(`cue "${cue}" missing in ${id}`);
  return leadOf(id) + Math.round(v * FPS);
};

/** bundle once and select the composition named in kit.config.json */
export const open = async () => {
  const {bundle} = await import('@remotion/bundler');
  const {selectComposition} = await import('@remotion/renderer');
  const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts')});
  const composition = await selectComposition({serveUrl, id: CFG.id});
  return {serveUrl, composition};
};
