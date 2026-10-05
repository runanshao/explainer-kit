/** s08 · pixel pack demo: a hero walks in, collects a coin per point, an EXP bar fills, an RPG dialog types along with the voice, LEVEL UP. */
import React from 'react';
import {Full, Sfx, SfxAt, rng, springAt, tween, useBeat, useScene, useSpoken} from '../core';
import {PW, PX, PixelCanvas, type Px, GROUND, bar, box, coin, drawWorld, hero} from '../pixel';

const COINS = [170, 235, 300];
const TITLE = '第八套：像素游戏风';
const LINE = '对话框里的字，跟着旁白一个一个蹦出来';

/** draw `s` with only the characters already spoken, from a fixed left edge so nothing shifts */
const spokenText = (g: Px, s: string, at: number[], f: number, x: number, y: number, c: string, size: number, shadow?: string) => {
  let n = 0;
  while (n < s.length && f >= at[n] - 1) n++;
  g.text(s.slice(0, n), x, y, c, size, 'left', shadow);
  return n;
};

export const S08: React.FC = () => {
  const {c} = useScene();
  const {chars} = useSpoken();
  const titleAt = chars(TITLE);
  const lineAt = chars(LINE);
  const walk = c('walk');
  const coinAt = c('coin');
  const barAt = c('bar');
  const talk = c('talk');
  const win = c('win');
  const beat = useBeat();
  // same pickup moment the drawing uses: when the hero's x passes the coin
  const pickAt = (cx: number) => coinAt + ((cx - 90) / 230) * (barAt - coinAt - 10);

  return (
    <Full>
      <PixelCanvas
        draw={(g, f) => {
          // hero position in world pixels; the camera follows once he passes x = 120
          const worldX = f < walk ? -14 : f < coinAt ? -14 + 104 * tween(f, walk, coinAt - walk, 'linear') : 90 + 230 * tween(f, coinAt, barAt - coinAt - 10, 'linear');
          const moving = f >= walk && f < barAt - 10;
          const camX = Math.max(0, worldX - 120);
          drawWorld(g, f, camX);

          // coins: bob until collected, then a +1 floats up
          let got = 0;
          COINS.forEach((cx, i) => {
            const sx = cx - camX;
            const pickedAt = pickAt(cx);
            if (f < pickedAt) {
              coin(g, sx, GROUND - 44 + Math.round(Math.sin((f + i * 9) / 8) * 2), f + i * 3, 2);
            } else {
              got++;
              const k = f - pickedAt;
              if (k < 24) g.text('+1', sx, GROUND - 60 - k, PX.gold, 12, 'center', PX.ink);
            }
          });

          // hero: walks, idles with a bob, jumps on LEVEL UP
          const jump = f >= win ? Math.abs(Math.sin(((f - win) / 14) * Math.PI)) * 14 * Math.max(0, 1 - (f - win) / 60) : 0;
          // standing still, he bobs on the music's beat
          hero(g, worldX - camX - 12, GROUND - Math.round(jump) + (moving ? 0 : beat.count() % 2), moving, f, false, 2);

          // HUD: coin counter and EXP bar
          if (f >= coinAt) {
            coin(g, PW - 52, 12, f);
            g.text(`× ${got}`, PW - 44, 6, PX.white, 10, 'left', PX.ink);
          }
          if (f >= barAt) {
            g.text(f >= win ? 'LV 2' : 'LV 1', 8, 6, PX.white, 10, 'left', PX.ink);
            const p = Math.min(1, Math.floor(tween(f, barAt, talk - barAt - 6, 'linear') * 10) / 10);
            bar(g, 40, 9, 10, f >= win ? 0.1 : p);
          }

          // title until the dialog takes over the top of the screen
          if (f < talk) {
            const tw = g.measure(TITLE, 16);
            spokenText(g, TITLE, titleAt, f, Math.round(PW / 2 - tw / 2), 28, PX.white, 16, PX.ink);
          } else {
            const open = Math.min(1, (f - talk) / 6);
            const bw = Math.round(296 * open);
            box(g, Math.round(PW / 2 - bw / 2), 24, Math.max(4, bw), 34);
            if (open >= 1) {
              hero(g, 18, 52, false, f);
              const n = spokenText(g, LINE, lineAt, f, 36, 34, PX.white, 12);
              if (n >= LINE.length && Math.floor(f / 10) % 2 === 0) g.text('▼', 296, 46, PX.gold, 8, 'center');
            }
          }

          // LEVEL UP: bouncing text and pixel fireworks
          if (f >= win) {
            const s = springAt(f, win, 'bouncy');
            g.text('LEVEL UP!', PW / 2, 70 - Math.round((1 - s) * 30), PX.gold, 22, 'center', PX.red);
            for (let b = 0; b < 3; b++) {
              const t0 = win + b * 10;
              const k = f - t0;
              if (k < 0 || k > 30) continue;
              const r = rng(b * 31 + 7);
              const cx = 60 + b * 100;
              const cy = 50 + b * 8;
              for (let i = 0; i < 14; i++) {
                const a = (i / 14) * Math.PI * 2 + r();
                const d = k * (1.1 + r() * 0.5);
                g.rect(cx + Math.cos(a) * d, cy + Math.sin(a) * d + k * k * 0.02, 2, 2, [PX.gold, PX.red, PX.exp, PX.white][i % 4]);
              }
            }
          }
        }}
      />
      <SfxAt frames={COINS.map(pickAt)} name="coin" />
      <SfxAt frames={Array.from({length: 10}, (_, k) => barAt + ((k + 1) * (talk - barAt - 6)) / 10)} name="tick" volume={0.6} />
      <SfxAt frames={lineAt} name="tick" volume={0.35} />
      <Sfx at={win} name="levelup" />
    </Full>
  );
};
