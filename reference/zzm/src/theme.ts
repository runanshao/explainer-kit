import type React from 'react';
export const C = {
  black: '#050505',
  night: '#0a0f1a',
  ink: '#F2EDE4',
  muted: '#B9B1A3',
  dim: '#6d675e',
  gold: '#E9B949',
  goldDeep: '#a87a1e',
  amber: '#F0A04B',
  dusk: '#E8894A',
  paper: '#EFE6D2',
  paperDark: '#d9cdb2',
  paperInk: '#2a241c',
  stamp: '#B8322A',
  green: '#4F9A5E',
  us: '#6FA8E8',
  cn: '#E0644F',
  tw: '#7CC48D',
  silhouette: '#0c0b0a',
};

/** the three forces on the board */
export const SIDE = {
  us: {zh: '美国', color: C.us},
  cn: {zh: '中国大陆', color: C.cn},
  tw: {zh: '台湾', color: C.tw},
  tsmc: {zh: '台积电', color: C.gold},
} as const;

/** the three cards Morris Chang plays */
export const CARD = [
  {zh: '中立', sub: '永远不和客户竞争', color: '#E9B949', glyph: '◆'},
  {zh: '规则', sub: '尊重知识产权 · 按法律办事', color: '#7FD3CF', glyph: '♣'},
  {zh: '不可替代', sub: '技术领先 + 制造优越', color: '#C3AEF0', glyph: '♠'},
] as const;

/** colour grade per era: CSS filter on the picture + a tinted overlay */
export type Grade = 'past' | 'warm' | 'cold' | 'dusk' | 'neutral';
export const GRADE: Record<Grade, {filter: string; tint: string; blend: React.CSSProperties['mixBlendMode']}> = {
  past: {filter: 'sepia(0.55) saturate(0.85) contrast(1.06) brightness(0.96)', tint: 'rgba(120,80,30,0.16)', blend: 'multiply'},
  warm: {filter: 'saturate(1.02) contrast(1.04)', tint: 'rgba(255,170,80,0.07)', blend: 'soft-light'},
  cold: {filter: 'saturate(0.85) contrast(1.08)', tint: 'rgba(40,80,140,0.16)', blend: 'soft-light'},
  dusk: {filter: 'saturate(1.08) contrast(1.05)', tint: 'rgba(255,120,60,0.06)', blend: 'soft-light'},
  neutral: {filter: 'none', tint: 'transparent', blend: 'normal'},
};

export const FONT = {
  sans: '"NotoSansSC", "Microsoft YaHei", sans-serif',
  serif: '"NotoSerifSC", "Noto Serif SC", serif',
  mono: '"Cascadia Code", Consolas, monospace',
};
