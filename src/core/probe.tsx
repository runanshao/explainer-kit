/**
 * Copy probe: checks the frame as a viewer sees it on a phone, not as the canvas is laid out.
 *
 * Short-video apps paint their own UI over the video — status bar and tabs on top, caption / account / music line at
 * the bottom, a column of like / comment / share buttons on the right. Copy under that UI is not delivered, however good
 * the render. The probe measures every readable piece of text on the rendered frame (after transforms, masks and
 * opacity), and reports what falls outside the safe area or is cut by the frame edge.
 *
 * Rendered only when asked (the promo's inputProps {probe: true}: tools/promo-probe.mjs, verify, promo-sheet). It
 * shades the covered areas, outlines offending text in red, and logs one line `[copy-probe] {...}` for the Node side.
 *
 * What counts as copy: a non-blank text node with effective opacity ≥ 0.5, at least half of it visible (a marquee
 * running through the frame is motion, not copy). Wrap decoration that may cross the edges or sit in the covered areas
 * on purpose (HUD, marquees, badge rings, the cards peeking in from the side) in <Free>.
 */
import React, {useEffect, useRef, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, useCurrentFrame, useVideoConfig} from 'remotion';

/** where an app's own UI does not cover the video (composition pixels) */
export type SafeArea = {
  top: number;
  /** lowest y copy may reach */
  bottom: number;
  left: number;
  right: number;
  /** the button column on the right: x ≥ rail.left is covered from y ≥ rail.top down */
  rail?: {left: number; top: number};
};
export type ProbeItem = {text: string; box: [number, number, number, number]; why: string};
export type ProbeResult = {copy: number; bad: ProbeItem[]};

/** decoration the probe ignores (it may cross the frame edge or sit under the app's UI on purpose) */
export const Free: React.FC<{children: React.ReactNode}> = ({children}) => (
  <div data-copy="free" style={{display: 'contents'}}>
    {children}
  </div>
);

type Box = {x0: number; y0: number; x1: number; y1: number};
const meet = (a: Box, b: Box): Box => ({x0: Math.max(a.x0, b.x0), y0: Math.max(a.y0, b.y0), x1: Math.min(a.x1, b.x1), y1: Math.min(a.y1, b.y1)});
const area = (b: Box) => Math.max(0, b.x1 - b.x0) * Math.max(0, b.y1 - b.y0);
const TOL = 2;

const measure = (root: HTMLElement, W: number, H: number, safe: SafeArea): ProbeResult => {
  const rb = root.getBoundingClientRect();
  const k = rb.width / W || 1;
  const local = (r: DOMRect): Box => ({x0: (r.left - rb.left) / k, y0: (r.top - rb.top) / k, x1: (r.right - rb.left) / k, y1: (r.bottom - rb.top) / k});
  const frame: Box = {x0: 0, y0: 0, x1: W, y1: H};
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  let copy = 0;
  const bad: ProbeItem[] = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const text = (n.textContent ?? '').trim();
    const el = n.parentElement;
    if (!text || !el || el.closest('[data-copy="free"]') || el.closest('style, script')) continue;
    // effective opacity, and the masks (overflow other than visible) the text sits in
    let op = 1;
    let clip = frame;
    let hidden = false;
    for (let e: Element | null = el; e && e !== root; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.display === 'none' || cs.visibility === 'hidden') {
        hidden = true;
        break;
      }
      op *= Number(cs.opacity);
      if (e !== el && cs.overflow !== 'visible') clip = meet(clip, local(e.getBoundingClientRect()));
    }
    if (hidden || op < 0.5) continue;
    range.selectNodeContents(n);
    const box = local(range.getBoundingClientRect());
    // a text box is the font's ascent + descent (≈1.45 em for CJK fonts); the ink sits in the 1-em box in its middle,
    // so measure that, or huge display type would be flagged for empty space above and below its glyphs
    const er = el.getBoundingClientRect();
    const scale = el instanceof HTMLElement && el.offsetHeight > 0 ? er.height / el.offsetHeight : 1;
    const em = (parseFloat(getComputedStyle(el).fontSize) * scale) / k;
    const trim = (box.y1 - box.y0 - em) / 2;
    if (trim > 0) {
      box.y0 += trim;
      box.y1 -= trim;
    }
    const vis = meet(box, clip);
    if (area(box) <= 0 || area(vis) < 0.5 * area(box)) continue;
    copy++;
    const why: string[] = [];
    if (box.x0 < -TOL || box.y0 < -TOL || box.x1 > W + TOL || box.y1 > H + TOL) why.push('cut by the frame edge');
    else {
      if (vis.y0 < safe.top - TOL) why.push(`above y=${safe.top} (status bar / tabs)`);
      if (vis.y1 > safe.bottom + TOL) why.push(`below y=${safe.bottom} (caption / account / music line)`);
      if (vis.x0 < safe.left - TOL || vis.x1 > W - safe.right + TOL) why.push('outside the side margins');
      if (safe.rail && vis.x1 > safe.rail.left + TOL && vis.y1 > safe.rail.top + TOL) why.push(`under the button rail (x>${safe.rail.left}, y>${safe.rail.top})`);
    }
    if (why.length) bad.push({text: text.slice(0, 40), box: [vis.x0, vis.y0, vis.x1, vis.y1].map(Math.round) as ProbeItem['box'], why: why.join('; ')});
  }
  return {copy, bad};
};

/** shade the covered areas, measure once fonts and layout are settled, outline what is wrong, log the result */
export const CopyProbe: React.FC<{safe: SafeArea}> = ({safe}) => {
  const f = useCurrentFrame();
  const {width: W, height: H} = useVideoConfig();
  const ref = useRef<HTMLDivElement>(null);
  const [handle] = useState(() => delayRender('copy probe'));
  const done = useRef(false);
  const [bad, setBad] = useState<ProbeItem[]>([]);
  useEffect(() => {
    let live = true;
    // after this commit's other effects (font loads start there), when every font is in and layout has run
    const t = setTimeout(() => {
      document.fonts.ready.then(() =>
        requestAnimationFrame(() => {
          if (!live) return;
          const root = ref.current?.parentElement;
          const res = root ? measure(root, W, H, safe) : {copy: 0, bad: []};
          console.log(`[copy-probe] ${JSON.stringify({frame: f, ...res})}`);
          setBad(res.bad);
          if (!done.current) {
            done.current = true;
            continueRender(handle);
          }
        }),
      );
    }, 0);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [f, W, H, safe, handle]);
  const shade = 'rgba(255,0,60,0.16)';
  const r = safe.rail;
  return (
    <AbsoluteFill ref={ref} style={{pointerEvents: 'none'}}>
      <Free>
        <div style={{position: 'absolute', left: 0, top: 0, width: W, height: safe.top, background: shade}} />
        <div style={{position: 'absolute', left: 0, top: safe.bottom, width: W, height: H - safe.bottom, background: shade}} />
        <div style={{position: 'absolute', left: 0, top: safe.top, width: safe.left, height: safe.bottom - safe.top, background: shade}} />
        <div style={{position: 'absolute', right: 0, top: safe.top, width: safe.right, height: safe.bottom - safe.top, background: shade}} />
        {r ? <div style={{position: 'absolute', left: r.left, top: r.top, width: W - safe.right - r.left, height: safe.bottom - r.top, background: shade}} /> : null}
        {bad.map((b, i) => (
          <div key={i} style={{position: 'absolute', left: b.box[0] - 6, top: b.box[1] - 6, width: b.box[2] - b.box[0] + 12, height: b.box[3] - b.box[1] + 12, border: '8px solid #ff1744'}} />
        ))}
      </Free>
    </AbsoluteFill>
  );
};
