/** Shared bits of the demo promo: HUD, flat icons, style-pack swatches. */
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C} from '../../core/theme';
import {E} from '../../editorial';
import {I} from '../../ink';
import {K} from '../../keynote';
import {M} from '../../math';
import {N} from '../../neon';
import {P} from '../../paper/palette';
import {PX} from '../../pixel';
import {Hud, PU} from '../../punch';
import {PROMO, usePromo} from '../grid';

/** crop marks, brand name, scene label and the progress line, in one colour */
export const PHud: React.FC<{color: string; label: string; bottom?: string}> = ({color, label, bottom}) => {
  const {abs, total} = usePromo();
  return <Hud color={color} left={PROMO.brand.name.toUpperCase()} right={label} bottom={bottom} progress={abs / total} />;
};

export const Ground: React.FC<{color: string; children?: React.ReactNode}> = ({color, children}) => <AbsoluteFill style={{background: color}}>{children}</AbsoluteFill>;

/**
 * Every style pack in src/ as data: name, colours (live from each pack's themed palette, so brand colours flow through).
 * Copy that counts packs reads PACKS.length (tests/test_promo.py checks this list against the packs on disk), so adding
 * a pack updates 「十套风格包」 and 「06 OF 10」 instead of leaving a stale number on screen.
 */
export const PACKS = [
  {key: 'film', zh: '电影', en: 'FILM', note: '叙事 · 人物', colors: [C.gold, C.teal, C.red], tint: '#F6E7C4'},
  {key: 'paper', zh: '手绘', en: 'PAPER', note: '流程 · 因果', colors: [P.blue, P.red, P.noteYellow], tint: '#F3EDE0'},
  {key: 'neon', zh: '霓虹', en: 'NEON', note: '系统 · 架构', colors: [N.cyan, N.magenta, N.lime], tint: '#D9F7FF'},
  {key: 'editorial', zh: '杂志', en: 'EDITORIAL', note: '观点 · 数字', colors: [E.red, E.ink, E.grey], tint: '#F1ECE2'},
  {key: 'ink', zh: '水墨', en: 'INK', note: '历史 · 诗词', colors: [I.ink, I.seal, I.wash], tint: '#EFE6D3'},
  {key: 'pixel', zh: '像素', en: 'PIXEL', note: '轻松科普', colors: [PX.sky0, PX.grass, PX.dirt], tint: '#DDEFFC'},
  {key: 'math', zh: '数学', en: 'MATH', note: '公式 · 图像', colors: [M.blue, M.yellow, M.red], tint: '#E3E6F2'},
  {key: 'keynote', zh: '发布会', en: 'KEYNOTE', note: '产品演示', colors: [K.accent, K.green, K.ink], tint: '#EEECE8'},
  {key: 'slides', zh: '讲台', en: 'SLIDES', note: '教程 · 步骤', colors: [C.tealDeep, C.orange, C.blue], tint: '#DDEEEA'},
  {key: 'punch', zh: '快剪', en: 'PUNCH', note: '广告 · 短片', colors: [PU.hot, PU.sun, PU.sage], tint: '#F3F0E6'},
];

const ZH = '零一二三四五六七八九';
/** 10 → 「十」, 23 → 「二十三」: for counts in Chinese copy */
export const zhNum = (n: number): string => (n < 10 ? ZH[n] : `${n >= 20 ? ZH[Math.floor(n / 10)] : ''}十${n % 10 ? ZH[n % 10] : ''}`);
const EN = ['ZERO', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 'ELEVEN', 'TWELVE'];
/** 10 → "TEN" (digits past twelve) */
export const enNum = (n: number) => EN[n] ?? String(n);
/** 6 → "06" */
export const pad2 = (n: number) => String(n).padStart(2, '0');

/** a disc split into three wedges of a pack's colours, with a hole (200×200 box) */
export const Swatch: React.FC<{colors: string[]; size: number; rot?: number; ring?: string}> = ({colors, size, rot = 0, ring = PU.paper}) => {
  const wedge = (a0: number, a1: number) => {
    const r = 92;
    const p = (a: number) => `${100 + r * Math.cos(a)} ${100 + r * Math.sin(a)}`;
    return `M100 100 L${p(a0)} A${r} ${r} 0 0 1 ${p(a1)} Z`;
  };
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" style={{transform: `rotate(${rot}deg)`}}>
      <circle cx={100} cy={100} r={98} fill={ring} />
      {colors.slice(0, 3).map((c, i) => (
        <path key={i} d={wedge((i * 2 * Math.PI) / 3 - Math.PI / 2, ((i + 1) * 2 * Math.PI) / 3 - Math.PI / 2)} fill={c} stroke={ring} strokeWidth={3} />
      ))}
      <circle cx={100} cy={100} r={22} fill={ring} />
    </svg>
  );
};

/** flat icons on a disc (200×200 box) for the four-beat montage */
export const Icon: React.FC<{kind: 'wave' | 'bolt' | 'check' | 'swatch'; size: number; bg: string; fg: string; rot?: number}> = ({kind, size, bg, fg, rot = 0}) => {
  let body: React.ReactNode = null;
  if (kind === 'wave') {
    const hs = [30, 62, 96, 70, 120, 84, 50, 100, 64, 36];
    body = hs.map((h, i) => <rect key={i} x={37 + i * 13.5} y={100 - h / 2} width={8} height={h} rx={4} fill={fg} />);
  } else if (kind === 'bolt') {
    body = <path d="M112 30 L58 112 L96 112 L84 172 L144 84 L104 84 Z" fill={fg} strokeLinejoin="round" />;
  } else if (kind === 'check') {
    body = <path d="M52 104 L86 138 L150 66" fill="none" stroke={fg} strokeWidth={22} strokeLinecap="round" strokeLinejoin="round" />;
  } else {
    body = PACKS.slice(0, 4).map((pk, i) => <circle key={i} cx={70 + (i % 2) * 60} cy={70 + Math.floor(i / 2) * 60} r={26} fill={pk.colors[0]} stroke={fg} strokeWidth={5} />);
  }
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" style={{transform: `rotate(${rot}deg)`}}>
      <circle cx={100} cy={100} r={96} fill={bg} />
      {body}
    </svg>
  );
};
