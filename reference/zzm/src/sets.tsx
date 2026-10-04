/** Reusable sets (backgrounds with life in them). Each takes the shot's local time t. */
import React from 'react';
import {C, CARD, FONT} from './theme';
import {Svg, e, mix, clamp01} from './film';
import {Board, Crowd, Defs, Fab, Figure, Glow, Ground, Mainland, Piece, Podium, Ridge, Saguaro, Sky, Skyline, Stars, Taiwan} from './art';

/** Arizona desert at dusk, fab under construction. */
export const Desert: React.FC<{t: number; stage?: boolean; crowd?: boolean; fabs?: number; night?: number}> = ({t, stage, crowd, fabs = 1, night = 0}) => {
  const sunY = 640 + t * 0.05;
  return (
    <Svg>
      <Defs />
      <Sky
        id="dsky"
        stops={[
          [0, mix(0, 1, night) > 0.5 ? '#0b1022' : '#1d1b3a'],
          [0.45, night > 0.5 ? '#1b2340' : '#7a3f5a'],
          [0.7, night > 0.5 ? '#3a3050' : '#e0784a'],
          [0.85, night > 0.5 ? '#6a4a50' : '#f4b264'],
        ]}
      />
      <Stars t={t} n={60} maxY={380} op={0.3 + night * 0.6} />
      <Glow x={1350} y={sunY} r={420} op={0.9 - night * 0.6} />
      <circle cx={1350} cy={sunY} r={46} fill="#ffe2b0" opacity={0.95 - night * 0.7} />
      <Ridge y={700} amp={150} seed={11} color="#5a3346" shift={t * 0.1} />
      <Ridge y={745} amp={90} seed={4} color="#3a2236" shift={t * 0.2} />
      <Ground y={735} color="#2b1a26" to="#120c12" />
      {fabs >= 1 ? <Fab x={300} y={770} w={760} h={120} color="#cbbfb6" face="#a0928a" cranes={fabs === 1} lit={night > 0.3} t={t} /> : null}
      {fabs >= 2 ? <Fab x={1090} y={760} w={520} h={100} color="#b9ada6" face="#958780" lit={night > 0.3} t={t} /> : null}
      {fabs >= 3 ? <Fab x={-120} y={760} w={380} h={90} color="#b0a49e" face="#8f827c" lit={night > 0.3} t={t} /> : null}
      <Saguaro x={150} y={800} h={190} color="#140c12" />
      <Saguaro x={1760} y={820} h={240} color="#140c12" flip />
      <Saguaro x={1580} y={790} h={120} color="#1b1018" />
      {stage ? (
        <g>
          <rect x={620} y={735} width={680} height={60} fill="#1a1216" />
          <rect x={620} y={730} width={680} height={8} fill="#3a2a30" />
          <Podium x={960} y={735} s={0.9} color="#1d1418" edge="#46343a" />
          {[700, 1220].map((x) => (
            <g key={x}>
              <line x1={x} y1={735} x2={x} y2={560} stroke="#2a1e24" strokeWidth={4} />
              <path d={`M${x},562 L${x + 70},572 L${x + 66},612 L${x},604 Z`} fill="#3b4a72" opacity={0.85} />
            </g>
          ))}
        </g>
      ) : null}
      {crowd ? <Crowd y={890} rows={3} seed={5} color="#0b070a" t={t} /> : null}
    </Svg>
  );
};

/** Overhead dark-wood desk with a pool of lamp light: backdrop for paper props. */
export const Desk: React.FC<{tone?: 'warm' | 'cold'; lx?: number; ly?: number}> = ({tone = 'warm', lx = 50, ly = 45}) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      background:
        tone === 'warm'
          ? `radial-gradient(ellipse 60% 70% at ${lx}% ${ly}%, rgba(255,200,130,0.28), transparent 70%), repeating-linear-gradient(92deg, #2a1d14 0px, #2f2117 7px, #261a12 15px, #2c1f15 26px), #22170f`
          : `radial-gradient(ellipse 60% 70% at ${lx}% ${ly}%, rgba(170,200,255,0.2), transparent 70%), repeating-linear-gradient(92deg, #161a20 0px, #1a1f26 7px, #14181d 15px, #191d24 26px), #12151a`,
    }}
  />
);

/** Black void with a soft top spotlight. */
export const Void: React.FC<{tint?: string; x?: number; y?: number}> = ({tint = 'rgba(255,220,170,0.12)', x = 50, y = 35}) => (
  <div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse 50% 55% at ${x}% ${y}%, ${tint}, transparent 75%), #060606`}} />
);

/** Night city seen through a big window, warm interior wall. */
export const Window: React.FC<{t: number; seed?: number; tone?: 'warm' | 'cold'; children?: React.ReactNode}> = ({t, seed = 21, tone = 'warm', children}) => (
  <Svg>
    <Defs />
    <rect x={0} y={0} width={1920} height={1080} fill={tone === 'warm' ? '#1c140e' : '#0e1218'} />
    <g>
      <clipPath id={`win${seed}`}>
        <rect x={260} y={150} width={1400} height={640} />
      </clipPath>
      <g clipPath={`url(#win${seed})`}>
        <Sky id={`wsky${seed}`} stops={[[0, '#060a16'], [0.7, '#1a2240'], [1, '#3a3050']]} />
        <Stars t={t} n={40} maxY={400} op={0.5} />
        <Skyline y={820} seed={seed} color="#0c0f18" minH={140} maxH={520} lit={0.32} t={t} />
        <Skyline y={860} seed={seed + 5} color="#06080e" minH={60} maxH={240} lit={0.2} t={t} />
      </g>
      <rect x={260} y={150} width={1400} height={640} fill="none" stroke="#0a0806" strokeWidth={22} />
      <line x1={960} y1={150} x2={960} y2={790} stroke="#0a0806" strokeWidth={14} />
      <line x1={260} y1={470} x2={1660} y2={470} stroke="#0a0806" strokeWidth={10} />
    </g>
    <rect x={0} y={790} width={1920} height={300} fill={tone === 'warm' ? '#140e0a' : '#0a0c10'} />
    {children}
  </Svg>
);

/** The board: chessboard in perspective under a lamp. Pieces optional by progress. */
export const BoardSet: React.FC<{
  t: number;
  tsmc?: number;
  us?: number;
  cn?: number;
  tw?: number;
  lit?: 'all' | 'tsmc' | 'us' | 'cn' | 'tw';
  children?: React.ReactNode;
}> = ({t, tsmc = 1, us = 1, cn = 1, tw = 1, lit = 'all', children}) => {
  const dim = (k: string) => (lit === 'all' || lit === k ? 1 : 0.35);
  return (
    <Svg>
      <Defs />
      <rect x={0} y={0} width={1920} height={1080} fill="#07080a" />
      <ellipse cx={960} cy={640} rx={1100} ry={520} fill="url(#glowW)" opacity={0.16} />
      <Board tl={[560, 470]} tr={[1360, 470]} br={[1640, 900]} bl={[280, 900]} a="#3a3128" b="#1e1913" edge="#4a3a26" />
      {tw > 0 ? (
        <g opacity={tw * dim('tw')}>
          <path d="M536,456 L1384,456 L1680,922 L240,922 Z" fill="none" stroke={C.tw} strokeWidth={6} opacity={0.85} />
          <path d="M536,456 L1384,456 L1680,922 L240,922 Z" fill="none" stroke={C.tw} strokeWidth={22} opacity={0.18} />
        </g>
      ) : null}
      {us > 0 ? <Piece kind="king" x={560 - (1 - us) * 200} y={760} s={1.25} color="#5d8fcb" glow={lit === 'us' ? 'glowBlue' : undefined} op={us * dim('us')} /> : null}
      {cn > 0 ? <Piece kind="king" x={1360 + (1 - cn) * 200} y={760} s={1.25} color="#c8513f" glow={lit === 'cn' ? 'glowRed' : undefined} op={cn * dim('cn')} /> : null}
      {tsmc > 0 ? <Piece kind="pawn" x={960} y={700 + (1 - tsmc) * -60} s={1.15} color="#e0b04a" glow={lit === 'tsmc' || lit === 'all' ? 'glowGold' : undefined} op={tsmc * dim('tsmc')} /> : null}
      {children}
    </Svg>
  );
};

/** A gilded playing card (one of the three). */
export const Card: React.FC<{i: number; x: number; y: number; s?: number; rot?: number; flip?: number; glow?: number; op?: number}> = ({
  i,
  x,
  y,
  s = 1,
  rot = 0,
  flip = 1,
  glow = 0,
  op = 1,
}) => {
  const c = CARD[i];
  const face = flip > 0.5;
  const sx = Math.abs(Math.cos((1 - flip) * Math.PI));
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: 260,
        height: 380,
        marginLeft: -130,
        marginTop: -190,
        transform: `rotate(${rot}deg) scale(${s * sx}, ${s})`,
        opacity: op,
        borderRadius: 18,
        background: face ? 'linear-gradient(160deg, #f4ead2, #e2d1a8)' : 'repeating-linear-gradient(45deg, #2a1a10 0 10px, #3a2414 10px 20px)',
        border: `3px solid ${face ? c.color : '#8a6a2a'}`,
        boxShadow: `0 30px 60px rgba(0,0,0,0.6)${glow ? `, 0 0 ${60 * glow}px ${c.color}` : ''}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: FONT.serif,
        color: C.paperInk,
      }}
    >
      {face ? (
        <>
          <div style={{position: 'absolute', left: 18, top: 12, fontSize: 30, color: c.color, fontWeight: 900}}>{c.glyph}</div>
          <div style={{position: 'absolute', right: 18, bottom: 12, fontSize: 30, color: c.color, fontWeight: 900, transform: 'rotate(180deg)'}}>{c.glyph}</div>
          <div style={{fontSize: 24, letterSpacing: 6, color: '#7a6a4a'}}>第{['一', '二', '三'][i]}张牌</div>
          <div style={{fontSize: c.zh.length > 2 ? 58 : 82, fontWeight: 900, margin: '14px 0', letterSpacing: 6}}>{c.zh}</div>
          <div style={{fontSize: 20, color: '#5a4a32', textAlign: 'center', padding: '0 20px', fontFamily: FONT.sans}}>{c.sub}</div>
        </>
      ) : (
        <div style={{width: 120, height: 120, border: '3px solid #8a6a2a', transform: 'rotate(45deg)'}} />
      )}
    </div>
  );
};

/** The Taiwan Strait, stylised: mainland on the left, Taiwan island in the middle-right. */
export const Strait: React.FC<{t: number; children?: React.ReactNode; tone?: 'warm' | 'cold'}> = ({t, children, tone = 'cold'}) => (
  <Svg>
    <Defs />
    <rect x={0} y={0} width={1920} height={1080} fill={tone === 'cold' ? '#0b1420' : '#14110c'} />
    {Array.from({length: 18}, (_, i) => (
      <path
        key={i}
        d={`M0,${120 + i * 52 + Math.sin(t * 0.02 + i) * 4} Q960,${100 + i * 52} 1920,${120 + i * 52 + Math.cos(t * 0.02 + i) * 4}`}
        stroke={tone === 'cold' ? '#16243a' : '#241e14'}
        strokeWidth={1.5}
        fill="none"
      />
    ))}
    <Mainland x0={620} fill={tone === 'cold' ? '#1e2026' : '#2a241c'} edge={tone === 'cold' ? '#3a3e48' : '#4a3e2c'} />
    <Taiwan x={1150} y={230} s={2.6} fill={tone === 'cold' ? '#2b4a36' : '#3a5a3a'} stroke={C.tw} />
    {children}
  </Svg>
);

/** walking progress helper: x from a to b while frames in [t0, t1]; returns x and gait phase */
export const walk = (t: number, t0: number, t1: number, a: number, b: number) => {
  const p = clamp01((t - t0) / (t1 - t0));
  return {x: mix(a, b, p), phase: p > 0 && p < 1 ? t * 0.32 : 0};
};

export {e, Figure};
