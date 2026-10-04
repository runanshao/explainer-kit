/**
 * Pixel style pack: everything is drawn on a 320×180 canvas and blown up 6× with no smoothing,
 * text included (glyphs are thresholded to 1-bit). Sprites are string maps. Delete this folder if unused.
 */
import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {HEIGHT, WIDTH} from '../config';
import type {ChapterProps, Look} from '../core/look';
import {noise} from '../core/motion';
import {FONT} from '../core/theme';

export const PW = 320;
export const PH = 180;
export const GROUND = 140;

export const PX = {
  sky0: '#3E7FD6',
  sky1: '#6FB1F0',
  sky2: '#A6D8FA',
  cloud: '#F4FAFF',
  hill0: '#6E8FC9',
  hill1: '#4F9A5E',
  grass: '#5DC04A',
  grassDark: '#3E8E36',
  dirt: '#8A5A2E',
  dirtDark: '#6B4220',
  ink: '#16121F',
  white: '#FFFFFF',
  gold: '#FFD23F',
  goldDark: '#D99A00',
  red: '#E8443A',
  skin: '#F6C49A',
  blue: '#3A6FE0',
  box: '#1B1834',
  boxLine: '#F4FAFF',
  exp: '#7CE85A',
};

/** Drawing helpers on the low-res canvas. */
export type Px = {
  ctx: CanvasRenderingContext2D;
  rect: (x: number, y: number, w: number, h: number, c: string) => void;
  sprite: (rows: string[], pal: Record<string, string>, x: number, y: number, flip?: boolean, scale?: number) => void;
  text: (s: string, x: number, y: number, c: string, size?: number, align?: 'left' | 'center' | 'right', shadow?: string) => number;
  /** width in canvas pixels that text() would use */
  measure: (s: string, size?: number) => number;
};

const scratch = typeof document !== 'undefined' ? document.createElement('canvas') : null;

const makePx = (ctx: CanvasRenderingContext2D): Px => ({
  ctx,
  measure: (s, size = 12) => {
    ctx.font = `700 ${size}px ${FONT.sans}`;
    return Math.ceil(ctx.measureText(s).width) + 2;
  },
  rect: (x, y, w, h, c) => {
    ctx.fillStyle = c;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  },
  sprite: (rows, pal, x, y, flip, scale = 1) => {
    const X = Math.round(x);
    const Y = Math.round(y);
    rows.forEach((row, j) => {
      for (let i = 0; i < row.length; i++) {
        const c = pal[row[i]];
        if (!c) continue;
        ctx.fillStyle = c;
        ctx.fillRect(X + (flip ? row.length - 1 - i : i) * scale, Y + j * scale, scale, scale);
      }
    });
  },
  // glyphs are rasterised small, then thresholded to hard 1-bit pixels so they read as pixel type
  text: (s, x, y, c, size = 12, align = 'left', shadow) => {
    if (!scratch || !s) return 0;
    const font = `700 ${size}px ${FONT.sans}`;
    const m = ctx;
    m.font = font;
    const w = Math.ceil(m.measureText(s).width) + 2;
    const h = size + 4;
    scratch.width = w;
    scratch.height = h;
    const sc = scratch.getContext('2d', {willReadFrequently: true})!;
    sc.font = font;
    sc.textBaseline = 'top';
    sc.fillStyle = '#000';
    sc.fillText(s, 1, 1);
    const img = sc.getImageData(0, 0, w, h);
    const x0 = Math.round(align === 'center' ? x - w / 2 : align === 'right' ? x - w : x);
    const y0 = Math.round(y);
    const put = (dx: number, dy: number, col: string) => {
      ctx.fillStyle = col;
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (img.data[(j * w + i) * 4 + 3] > 110) ctx.fillRect(x0 + i + dx, y0 + j + dy, 1, 1);
    };
    if (shadow) put(1, 1, shadow);
    put(0, 0, c);
    return w;
  },
});

/** A 320×180 canvas scaled up to the frame with hard pixels; `draw` runs every frame. */
export const PixelCanvas: React.FC<{draw: (g: Px, f: number) => void; style?: React.CSSProperties}> = ({draw, style}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const f = useCurrentFrame();
  useLayoutEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, PW, PH);
    draw(makePx(ctx), f);
  });
  return <canvas ref={ref} width={PW} height={PH} style={{position: 'absolute', inset: 0, width: WIDTH, height: HEIGHT, imageRendering: 'pixelated', ...style}} />;
};

// ───────────────────────── sprites ─────────────────────────

const HERO_PAL: Record<string, string> = {k: PX.ink, r: PX.red, s: PX.skin, b: PX.blue, w: PX.white, d: '#2A3F8F', h: '#5A3420'};
const HERO_HEAD = ['....kkkkk...', '...krrrrrk..', '..krrrrrrrk.', '..kkhhsskk..', '.khshsskssk.', '.khsshssssk.', '..kssssskk..', '...kssssk...'];
const HERO_A = [...HERO_HEAD, '..kbbrbbk...', '.kbbbrrbbk..', '.ksbbbbbsk..', '..kbbbbbk...', '..kdd.ddk...', '.kdd...ddk..', '.kk.....kk..', '............'];
const HERO_B = [...HERO_HEAD, '..kbbrbbk...', '.kbbbrrbbk..', '.ksbbbbbsk..', '..kbbbbbk...', '...kdddk....', '...kddk.....', '...kkkk.....', '............'];

/** 12×16 hero standing on y (feet), at `scale` canvas pixels per sprite pixel; alternates legs while walking. */
export const hero = (g: Px, x: number, y: number, walking: boolean, f: number, flip = false, scale = 1) =>
  g.sprite(walking && Math.floor(f / 6) % 2 ? HERO_B : HERO_A, HERO_PAL, x, y - 16 * scale, flip, scale);

const COIN = [
  ['..kkkk..', '.kggggk.', 'kggyyggk', 'kgyggggk', 'kgyggggk', 'kggggggk', '.kggggk.', '..kkkk..'],
  ['..kkk...', '.kgggk..', '.kgygk..', '.kgygk..', '.kgygk..', '.kgggk..', '.kgggk..', '..kkk...'],
  ['...kk...', '...kgk..', '...kgk..', '...kgk..', '...kgk..', '...kgk..', '...kgk..', '...kk...'],
];
/** spinning 8×8 coin centred on (x, y) */
export const coin = (g: Px, x: number, y: number, f: number, scale = 1) => {
  const k = [0, 1, 2, 1][Math.floor(f / 5) % 4];
  g.sprite(COIN[k], {k: PX.goldDark, g: PX.gold, y: '#FFF6B0'}, x - 4 * scale, y - 4 * scale, false, scale);
};

/** framed RPG box */
export const box = (g: Px, x: number, y: number, w: number, h: number) => {
  g.rect(x, y, w, h, PX.box);
  g.rect(x + 1, y + 1, w - 2, 1, PX.boxLine);
  g.rect(x + 1, y + h - 2, w - 2, 1, PX.boxLine);
  g.rect(x + 1, y + 1, 1, h - 2, PX.boxLine);
  g.rect(x + w - 2, y + 1, 1, h - 2, PX.boxLine);
};

/** segmented bar, `p` 0..1 filled */
export const bar = (g: Px, x: number, y: number, segs: number, p: number, color = PX.exp) => {
  g.rect(x, y, segs * 6 + 2, 7, PX.ink);
  const n = Math.floor(p * segs + 1e-6);
  for (let i = 0; i < segs; i++) g.rect(x + 2 + i * 6, y + 2, 4, 3, i < n ? color : '#3A3550');
};

// ───────────────────────── world ─────────────────────────

/** sky bands, drifting clouds, two parallax hill layers, grass and dirt. `scroll` in px moves the world left. */
export const drawWorld = (g: Px, f: number, scroll = 0) => {
  const bands = [PX.sky0, PX.sky1, PX.sky2];
  bands.forEach((c, i) => g.rect(0, i * 30, PW, 30 + (i === 2 ? 60 : 0), c));
  // dithered seams between bands
  for (let i = 1; i < 3; i++) for (let x = 0; x < PW; x += 2) g.rect(x + ((i * 30) % 2), i * 30 - 1, 1, 1, bands[i]);
  for (let k = 0; k < 4; k++) {
    const cx = ((k * 97 - f * (0.15 + k * 0.03) - scroll * 0.1) % (PW + 60) + PW + 60) % (PW + 60) - 30;
    const cy = 14 + k * 11;
    g.rect(cx, cy, 22, 4, PX.cloud);
    g.rect(cx + 4, cy - 3, 12, 3, PX.cloud);
  }
  const hills = (amp: number, base: number, speed: number, seed: number, c: string) => {
    for (let x = 0; x < PW; x++) {
      const h = Math.round(base - (noise(seed, (x + scroll * speed) / 38) * 0.5 + 0.5) * amp);
      g.rect(x, h, 1, GROUND - h, c);
    }
  };
  hills(34, 118, 0.25, 3, PX.hill0);
  hills(22, 134, 0.5, 9, PX.hill1);
  g.rect(0, GROUND, PW, PH - GROUND, PX.dirt);
  g.rect(0, GROUND, PW, 4, PX.grass);
  for (let x = -16; x < PW + 16; x += 16) {
    const ox = Math.round(x - (scroll % 16));
    g.rect(ox, GROUND + 4, 8, 1, PX.grassDark);
    g.rect(ox + 3, GROUND + 10, 2, 2, PX.dirtDark);
    g.rect(ox + 11, GROUND + 22, 2, 2, PX.dirtDark);
  }
};

/** Look background: the world with clouds drifting. */
export const PixelWorld: React.FC = () => <PixelCanvas draw={(g, f) => drawWorld(g, f)} />;

/** Faint pixel grid over the picture, so the 6× pixels read as a screen. */
export const PixelGrid: React.FC = () => (
  <AbsoluteFill
    style={{
      backgroundImage: 'linear-gradient(rgba(0,0,0,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.07) 1px, transparent 1px)',
      backgroundSize: `${WIDTH / PW}px ${HEIGHT / PH}px`,
      pointerEvents: 'none',
    }}
  />
);

/** Chapter card: black screen, stage number, title, blinking PRESS START. */
export const PixelChapter: React.FC<ChapterProps> = ({f, lead, kicker, title}) => {
  if (f >= lead) return null;
  return (
    <AbsoluteFill>
      <PixelCanvas
        draw={(g) => {
          g.rect(0, 0, PW, PH, PX.ink);
          for (let i = 0; i < 40; i++) {
            const x = (i * 71) % PW;
            const y = (i * 37) % 120;
            if ((Math.floor(f / 8) + i) % 3) g.rect(x, y, 1, 1, '#6C6890');
          }
          g.text(kicker, PW / 2, 52, PX.gold, 12, 'center');
          g.text(title, PW / 2, 72, PX.white, 24, 'center', '#E8443A');
          if (Math.floor(f / 10) % 2 === 0) g.text('PRESS START', PW / 2, 124, PX.white, 10, 'center');
        }}
      />
    </AbsoluteFill>
  );
};

/** Pixel world behind, faint pixel grid on top, chunky dark subtitles. */
export const pixel: Look = {
  base: PX.sky1,
  background: PixelWorld,
  overlay: PixelGrid,
  chapter: PixelChapter,
  subtitles: {bottom: 30, box: true, karaoke: true, size: 36, color: PX.white, boxColor: 'rgba(22,18,31,0.88)', quoteColor: PX.gold, dim: 0.4},
};
