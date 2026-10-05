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

/**
 * Browser for rendering. REMOTION_BROWSER=/path/to/chrome-headless-shell wins; otherwise a Playwright headless shell
 * under /opt/pw-browsers (preinstalled in cloud sandboxes) is used if present; otherwise Remotion downloads its own.
 */
const findLocalShell = () => {
  const base = '/opt/pw-browsers';
  if (!fs.existsSync(base)) return null;
  const dir = fs.readdirSync(base).filter((d) => d.startsWith('chromium_headless_shell-')).sort().pop();
  const exe = dir && path.join(base, dir, 'chrome-linux', 'headless_shell');
  return exe && fs.existsSync(exe) ? exe : null;
};
export const browserExecutable = process.env.REMOTION_BROWSER || findLocalShell();

/** scene-local frame → film frame */
export const filmFrame = (id, fr) => starts[id] + fr;

/** "s01:quote:40" / "s02:end:-10" / "s03" → {id, cue, off, frame (film frame)} */
export const parseSpot = (spec, defCue = 'end', defOff = 0) => {
  const [id, cue = defCue, off = String(defOff)] = spec.split(':');
  if (!(id in starts)) throw new Error(`unknown scene ${id} (have ${IDS.join(' ')})`);
  return {id, cue, off: Number(off), frame: starts[id] + cueFrame(id, cue) + Number(off)};
};

/** the closest cue to a scene-local frame, as "cue+N" / "cue-N" — for reporting */
export const nearestCue = (id, fr) => {
  let best = 'start';
  let at = 0;
  for (const k of Object.keys(T[id].cues)) {
    const c = cueFrame(id, k);
    if (Math.abs(c - fr) < Math.abs(at - fr)) {
      best = k;
      at = c;
    }
  }
  const d = Math.round(fr - at);
  return `${best}${d >= 0 ? '+' : ''}${d}`;
};

/** bundle once and select the composition named in kit.config.json (or `id`) */
export const open = async (id = CFG.id, inputProps = {}) => {
  const {bundle} = await import('@remotion/bundler');
  const {selectComposition} = await import('@remotion/renderer');
  const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts')});
  const composition = await selectComposition({serveUrl, id, inputProps, browserExecutable});
  return {serveUrl, composition};
};
