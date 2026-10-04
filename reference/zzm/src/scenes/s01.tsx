import React from 'react';
import {interpolate} from 'remotion';
import {useScene} from '../lib';
import {C, FONT} from '../theme';
import {Abs, BigQuote, Cam, Graded, Line, Place, Shots, Svg, Tag, e, lin, rng} from '../film';
import {Defs, Figure, Glow, Smoke} from '../art';
import {BoardSet, Desert, Void, walk} from '../sets';

/** Planet-at-night with trade arcs converging on one glowing point. */
export const WorldHeart: React.FC<{t: number; p?: number}> = ({t, p = 1}) => {
  const r = rng(9);
  const cx = 1120;
  const cy = 520;
  const pts = Array.from({length: 26}, () => [r() * 1920, 560 + r() * 380] as [number, number]);
  return (
    <Svg>
      <Defs />
      <rect width={1920} height={1080} fill="#04060c" />
      <ellipse cx={960} cy={1650} rx={1500} ry={1050} fill="#0b1426" />
      <ellipse cx={960} cy={1650} rx={1500} ry={1050} fill="none" stroke="#2a4a7a" strokeWidth={3} opacity={0.6} />
      {Array.from({length: 220}, (_, i) => {
        const x = r() * 1920;
        const y = 640 + r() * 420;
        return <circle key={i} cx={x} cy={y} r={1 + r() * 2} fill="#ffd690" opacity={0.25 + r() * 0.5} />;
      })}
      {pts.map(([x, y], i) => {
        const k = lin(t, i * 3, i * 3 + 40) * p;
        const mx = (x + cx) / 2;
        const my = Math.min(y, cy) - 220 - (i % 5) * 30;
        const N = 30;
        const path: string[] = [];
        for (let j = 0; j <= N * k; j++) {
          const s = j / N;
          path.push(`${(1 - s) * (1 - s) * x + 2 * (1 - s) * s * mx + s * s * cx},${(1 - s) * (1 - s) * y + 2 * (1 - s) * s * my + s * s * cy}`);
        }
        return path.length > 1 ? <polyline key={i} points={path.join(' ')} fill="none" stroke="#E9B949" strokeWidth={1.6} opacity={0.55} /> : null;
      })}
      <Glow x={cx} y={cy} r={180 + 20 * Math.sin(t * 0.15)} id="glowGold" />
      <rect x={cx - 26} y={cy - 26} width={52} height={52} rx={6} fill="#1a1408" stroke="#ffe2a0" strokeWidth={3} />
      {Array.from({length: 6}, (_, i) => (
        <React.Fragment key={i}>
          <line x1={cx - 20 + i * 8} y1={cy - 26} x2={cx - 20 + i * 8} y2={cy - 36} stroke="#ffe2a0" strokeWidth={2} />
          <line x1={cx - 20 + i * 8} y1={cy + 26} x2={cx - 20 + i * 8} y2={cy + 36} stroke="#ffe2a0" strokeWidth={2} />
        </React.Fragment>
      ))}
    </Svg>
  );
};

export const S01: React.FC = () => {
  const {f, c, w, end, total, rel} = useScene();
  const shots = [
    {
      at: 0,
      el: (t: number, d: number) => (
        <Graded grade="dusk">
          <Cam t={t} d={d} z={[1.02, 1.12]} y={[0, 20]} oy={70}>
            <Desert t={t} />
          </Cam>
          <Place t={t} at={12} year="2022.12.06" place="美国 亚利桑那州 · 凤凰城北" />
        </Graded>
      ),
    },
    {
      at: c('fab'),
      el: (t: number, d: number) => {
        const names: [string, string, number][] = [
          ['拜登', '美国总统', 760],
          ['库克', '苹果', 930],
          ['黄仁勋', '英伟达', 1100],
          ['苏姿丰', 'AMD', 1270],
        ];
        const at0 = c('fab');
        return (
          <Graded grade="dusk">
            <Cam t={t} d={d} z={[1.18, 1.32]} oy={78}>
              <Desert t={t + 200} stage crowd />
            </Cam>
            {names.map(([n, s, x], i) => (
              <Tag key={n} t={t} at={w(n) - at0} x={x} y={640 - (i % 2) * 40} text={n} sub={s} />
            ))}
          </Graded>
        );
      },
    },
    {
      at: c('walk'),
      el: (t: number, d: number) => {
        const wk = walk(t, 6, 80, 560, 900);
        const atPod = t >= 80;
        return (
          <Graded grade="dusk">
            <Cam t={t} d={d} z={[1, 1.1]} oy={60}>
              <Svg>
                <Defs />
                <rect width={1920} height={1080} fill="#1b1220" />
                <Glow x={960} y={300} r={700} op={0.35} />
                <path d="M760,-20 L1160,-20 L1360,1080 L560,1080 Z" fill="url(#spot)" opacity={0.6} />
                <rect x={0} y={760} width={1920} height={320} fill="#120b10" />
                <rect x={0} y={752} width={1920} height={10} fill="#3a2a30" />
                {[480, 1440].map((x) => (
                  <g key={x}>
                    <line x1={x} y1={760} x2={x} y2={250} stroke="#2a1e24" strokeWidth={6} />
                    <path d={`M${x},254 Q${x + 90},${270 + Math.sin(t * 0.08 + x) * 8} ${x + 170},262 L${x + 166},372 Q${x + 90},${384 + Math.sin(t * 0.08 + x) * 8} ${x},366 Z`} fill="#3b4a72" opacity={0.8} />
                  </g>
                ))}
                <Figure x={atPod ? 930 : wk.x} y={atPod ? 700 : 760} h={atPod ? 330 : 330} pose={atPod ? 'podium' : 'walk'} phase={wk.phase} old color="#0b0709" />
                {atPod ? (
                  <g>
                    <path d="M890,760 L1030,760 L1016,600 L904,600 Z" fill="#1d1418" stroke="#46343a" strokeWidth={3} />
                    <rect x={884} y={588} width={152} height={16} rx={4} fill="#46343a" />
                  </g>
                ) : null}
              </Svg>
            </Cam>
            <Tag t={t} at={rel('张忠谋', 'walk')} x={1300} y={470} text="张忠谋" sub="91 岁 · 台积电创始人" size={40} />
          </Graded>
        );
      },
    },
    {
      at: c('quote'),
      tr: 'black' as const,
      el: (t: number) => (
        <>
          <Void tint="rgba(255,190,120,0.07)" />
          <BigQuote t={t} at={rel('全球化', 'quote')} text={"全球化几乎已死。\n自由贸易，几乎已死。"} who="张忠谋 · 2022 年 12 月 · 亚利桑那" cps={3.3} size={78} />
        </>
      ),
    },
    {
      at: c('irony'),
      el: (t: number, d: number) => (
        <>
          <Cam t={t} d={d} z={[1, 1.1]} ox={58} oy={48}>
            <WorldHeart t={t} />
          </Cam>
          <Tag t={t} at={rel('最大的赢家', 'irony')} x={1120} y={300} text="全球化最大的赢家之一" size={44} />
          <Tag t={t} at={rel('每一部手机', 'irony')} x={1120} y={660} text="每一部手机 · 每一台 AI 服务器" sub="的心脏" size={30} />
        </>
      ),
    },
    {
      at: c('q'),
      el: (t: number, d: number) => {
        const big = e(t, rel('最大的两个', 'q'), 30);
        return (
          <>
            <Cam t={t} d={d} z={[1.25, 1.05]} oy={65}>
              <BoardSet t={t} tsmc={1} us={big} cn={big} tw={0} lit="tsmc" />
            </Cam>
            <Line t={t} at={rel('凭什么', 'q')} y={230} text="凭什么活下来？" size={70} />
          </>
        );
      },
    },
    {
      at: c('back'),
      tr: 'black' as const,
      el: (t: number) => {
        const t0 = rel('那一年', 'back');
        const roll = interpolate(t, [10, t0 - 10], [2022, 1983], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: (x) => 1 - Math.pow(1 - x, 3)});
        const yr = Math.round(roll);
        const spinning = t > 10 && t < t0 - 10;
        return (
          <>
            <Void tint="rgba(255,200,140,0.08)" />
            {spinning
              ? Array.from({length: 14}, (_, i) => (
                  <div key={i} style={{position: 'absolute', left: 0, right: 0, top: 120 + ((i * 97 + t * 40) % 840), height: 2, background: 'rgba(255,240,220,0.08)'}} />
                ))
              : null}
            <Abs x={960} y={470} center>
              <div style={{fontFamily: FONT.serif, fontSize: 220, fontWeight: 900, color: C.ink, letterSpacing: 12, filter: spinning ? 'blur(1.5px)' : 'none', fontVariantNumeric: 'tabular-nums'}}>
                {yr}
              </div>
            </Abs>
            <Line t={t} at={t0 + 20} y={700} text="52 岁 · 失业" size={56} color={C.gold} />
          </>
        );
      },
    },
    {
      at: end + 6,
      tr: 'black' as const,
      el: (t: number) => (
        <>
          <Void tint="rgba(233,185,73,0.10)" />
          <Svg>
            <Defs />
            <Smoke t={t + 60} x={1040} y={470} scale={1.6} op={0.35} />
          </Svg>
          <Abs x={960} y={470} center style={{textAlign: 'center', opacity: e(t, 6, 30)}}>
            <div style={{fontFamily: FONT.serif, fontSize: 150, fontWeight: 900, color: C.ink, letterSpacing: 40, paddingLeft: 40}}>三张牌</div>
            <div style={{width: 120 * e(t, 20, 30), height: 2, background: C.gold, margin: '26px auto'}} />
            <div style={{fontFamily: FONT.sans, fontSize: 34, color: C.muted, letterSpacing: 12, opacity: e(t, 30, 30)}}>张忠谋与台积电的四十年棋局</div>
          </Abs>
        </>
      ),
    },
  ];
  return <Shots shots={shots} end={total} />;
};
