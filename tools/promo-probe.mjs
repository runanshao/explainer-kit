// Render promo frames with the copy probe on (src/core/probe.tsx): each frame comes back as a PNG with the covered
// areas shaded and offending copy outlined, plus what the probe measured — the readable copy count and every piece of
// copy outside the platform safe area (promo.json "safe") or cut by the frame edge.
import {renderStill} from '@remotion/renderer';
import {browserExecutable, open} from './timeline.mjs';
import {PROMO} from './promo-grid.mjs';

export const openProbe = async () => {
  const inputProps = {probe: true};
  const {serveUrl, composition} = await open(PROMO.id, inputProps);
  /** → {copy, bad: [{text, box, why}]} for one frame, written to `output` */
  return async (frame, output, scale = 0.25) => {
    let res = null;
    await renderStill({
      composition,
      serveUrl,
      output,
      frame,
      scale,
      inputProps,
      browserExecutable,
      onBrowserLog: (log) => {
        const m = /^\[copy-probe\] (.*)$/.exec(log.text);
        if (m) res = JSON.parse(m[1]);
      },
    });
    if (!res) throw new Error(`frame ${frame}: the copy probe did not report (is <CopyProbe> rendered when probe is on?)`);
    return res;
  };
};

/** problems for one review spot: copy outside the safe area, or (on frame 0) no copy at all */
export const problems = (spot, res) => {
  if (spot.kind === 'move') return [];
  const out = res.bad.map((b) => `「${b.text}」 ${b.why}  [${b.box.join(', ')}]`);
  if (spot.kind === 'first' && res.copy === 0) out.push('frame 0 shows no copy — it is the thumbnail and the first impression; put the hook on screen from frame 0');
  return out;
};
