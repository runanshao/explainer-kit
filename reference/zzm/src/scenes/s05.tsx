import React from 'react';
import {useScene} from '../lib';
import {C, FONT} from '../theme';
import {Abs, Cam, Graded, Line, Shots, Svg, Tag, e, lin, rng} from '../film';
import {Defs, Figure, Glow, Lamp, Smoke, Table} from '../art';
import {Desk, Void, walk} from '../sets';
import {Balance, Calendar, Count} from '../props';

/** Split screen: two offices on two sides of the Pacific. */
const PhoneSplit: React.FC<{t: number}> = ({t}) => (
  <Svg>
    <Defs />
    <rect width={960} height={1080} fill="#1a130c" />
    <rect x={960} width={960} height={1080} fill="#0f1420" />
    <Lamp x={480} y={200} />
    <rect x={160} y={300} width={300} height={260} fill="#0c0906" stroke="#2a2016" strokeWidth={10} />
    <Figure x={500} y={820} h={420} pose="phone" pipe old color="#0b0806" />
    <Smoke t={t} x={576} y={470} scale={1.3} op={0.4} />
    <rect x={300} y={760} width={480} height={14} fill="#3a2c20" />
    <rect x={1100} y={260} width={680} height={300} fill="#141c2c" />
    {Array.from({length: 8}, (_, i) => (
      <rect key={i} x={1130 + i * 82} y={300} width={60} height={220} fill="#1d2840" />
    ))}
    <Figure x={1420} y={820} h={400} pose="phone" facing={-1} color="#05070c" />
    <rect x={1160} y={760} width={480} height={14} fill="#2a3448" />
    <line x1={960} y1={96} x2={960} y2={984} stroke="#000" strokeWidth={8} />
  </Svg>
);

/** small, crowded office with orders piling up */
const Swamped: React.FC<{t: number}> = ({t}) => {
  const r = rng(4);
  return (
    <Svg>
      <Defs />
      <rect width={1920} height={1080} fill="#10141c" />
      <rect y={820} width={1920} height={260} fill="#0a0d12" />
      {Array.from({length: 84}, (_, i) => {
        const x = 140 + (i % 21) * 80 + r() * 20;
        const y = 600 + Math.floor(i / 21) * 70;
        return <Figure key={i} x={x} y={y + 120} h={110 + r() * 20} pose="bust" color="#05070b" />;
      })}
      {Array.from({length: 40}, (_, i) => {
        const k = r();
        const y = ((t * (2 + k * 3) + i * 90) % 900) - 50;
        return <rect key={`p${i}`} x={r() * 1880} y={y} width={46} height={60} fill={C.paper} opacity={0.75} transform={`rotate(${(k - 0.5) * 60 + t} ${r() * 1880} ${y})`} />;
      })}
    </Svg>
  );
};

export const S05: React.FC = () => {
  const {c, w, total, rel} = useScene();
  const shots = [
    {
      at: 0,
      el: (t: number, d: number) => (
        <>
          <Cam t={t} d={d} z={[1.0, 1.05]}>
            <PhoneSplit t={t} />
          </Cam>
          <Tag t={t} at={50} x={480} y={180} text="张忠谋" sub="台湾 · 台积电" size={36} />
          <Tag t={t} at={w('黄仁勋')} x={1440} y={180} text="黄仁勋 · 34 岁" sub="英伟达 · 当时还很小" size={36} />
          <Line t={t} at={w('孤注一掷')} y={900} text="孤注一掷：芯片全部交给台积电" size={44} color={C.gold} />
        </>
      ),
    },
    {
      at: c('boom'),
      el: (t: number, d: number) => (
        <>
          <Cam t={t} d={d} z={[1.0, 1.08]}>
            <Swamped t={t} />
          </Cam>
          <Abs x={960} y={300} center style={{textAlign: 'center', fontFamily: FONT.serif, opacity: e(t, rel('八十几', 'boom'), 14)}}>
            <div style={{fontSize: 140, fontWeight: 900, color: C.ink}}>
              <Count t={t} at={rel('八十几', 'boom')} to={80} suffix="+" />
            </div>
            <div style={{fontSize: 34, color: C.muted, fontFamily: FONT.sans, letterSpacing: 6}}>全公司 · 根本忙不过来</div>
          </Abs>
        </>
      ),
    },
    {
      at: c('planners'),
      el: (t: number, d: number) => {
        const a = walk(t, 10, 90, -100, 640);
        const b = walk(t, 18, 98, -220, 520);
        const labels = ['进货', '存货', '出货', '培训新员工'];
        const day = Math.min(30, Math.max(1, Math.floor(lin(t, 60, 220) * 30)));
        return (
          <>
            <Cam t={t} d={d} z={[1.0, 1.05]}>
              <Svg>
                <Defs />
                <rect width={1920} height={1080} fill="#10141c" />
                <rect y={820} width={1920} height={260} fill="#0a0d12" />
                <rect x={760} y={280} width={1000} height={540} fill="#141c2a" />
                <rect x={800} y={320} width={920} height={60} fill="#1e2a40" />
                <text x={1260} y={362} textAnchor="middle" fontFamily={FONT.sans} fontSize={30} fill="#9ab0d0">
                  英伟达
                </text>
                <Figure x={a.x} y={820} h={300} pose={a.phase ? 'walk' : 'stand'} phase={a.phase} color="#3a2a14" />
                <Figure x={b.x} y={820} h={290} pose={b.phase ? 'walk' : 'stand'} phase={b.phase + 1} color="#3a2a14" />
                <rect x={a.x + 20} y={720} width={50} height={70} rx={6} fill="#7a5a30" opacity={a.phase ? 1 : 0} />
                <rect x={b.x + 20} y={720} width={50} height={70} rx={6} fill="#7a5a30" opacity={b.phase ? 1 : 0} />
              </Svg>
              <Calendar x={1550} y={560} year={`${day}`} month="驻场 · 第几天" s={0.8} op={e(t, 60, 14)} />
            </Cam>
            {labels.map((l, i) => (
              <Tag key={l} t={t} at={w(l === '培训新员工' ? '培训' : l) - c('planners')} x={900 + i * 150} y={480 + (i % 2) * 70} text={l} size={30} />
            ))}
            <Tag t={t} at={10} x={420} y={200} text="两位生产计划师" sub="进驻整整一个月" size={40} />
          </>
        );
      },
    },
    {
      at: c('grow'),
      el: (t: number, d: number) => {
        const lanes = [0.55, 1.15, 0.8, 0.4, 0.95];
        return (
          <>
            <Cam t={t} d={d} z={[1.0, 1.04]}>
              <Svg>
                <Defs />
                <rect width={1920} height={1080} fill="#0f0d0b" />
                {lanes.map((sp, i) => {
                  const y = 260 + i * 120;
                  const x = 200 + Math.min(1500, t * sp * 3.2);
                  const lead = i === 1;
                  return (
                    <g key={i}>
                      <line x1={160} y1={y + 40} x2={1800} y2={y + 40} stroke="#2a241c" strokeWidth={2} />
                      <Figure x={x} y={y + 38} h={104} pose="walk" phase={t * 0.5 + i} color={lead ? '#d8d0c0' : '#6a645a'} />
                      {lead ? <Figure x={x - 70} y={y + 38} h={100} pose="walk" phase={t * 0.5 + 3} color={C.gold} /> : null}
                    </g>
                  );
                })}
              </Svg>
            </Cam>
            <Tag t={t} at={rel('一直在换', 'grow')} x={960} y={150} text="大客户名单一直在换" size={40} color={C.muted} />
            <Line t={t} at={rel('押注', 'grow')} y={890} text="总在押注长得最快的那一批" size={50} color={C.gold} />
          </>
        );
      },
    },
    {
      at: c('rd'),
      el: (t: number, d: number) => {
        const tilt = e(t, 30, 40);
        return (
          <>
            <Void />
            <Cam t={t} d={d} z={[1.0, 1.05]}>
              <Svg>
                <Defs />
                <Balance x={960} y={300} tilt={tilt} left={<>台积电<br />+ 前十大客户</>} right={<>三星<br />+ 英特尔</>} />
              </Svg>
            </Cam>
            <Tag t={t} at={10} x={960} y={150} text="研发投入" size={44} />
            <Line t={t} at={rel('联盟', 'rd')} y={900} text="不必一个人赢过巨头：联盟会赢" size={46} color={C.gold} />
          </>
        );
      },
    },
    {
      at: c('hook'),
      tr: 'black' as const,
      el: (t: number, d: number) => (
        <>
          <Cam t={t} d={d} z={[1.0, 1.08]} oy={60}>
            <Svg>
              <Defs />
              <rect width={1920} height={1080} fill="#120d09" />
              <Lamp x={960} y={160} />
              <Figure x={720} y={860} h={300} pose="sit" pipe old color="#0b0806" />
              <Figure x={1200} y={860} h={300} pose="sit" facing={-1} color="#0b0806" />
              <Table x={960} y={700} w={520} />
              <ellipse cx={880} cy={694} rx={70} ry={12} fill="#c89a4a" />
              <ellipse cx={1040} cy={694} rx={60} ry={12} fill="#6a9a4a" />
            </Svg>
          </Cam>
          <Tag t={t} at={rel('十一年后', 'hook')} x={960} y={200} text="十一年后" size={44} color={C.muted} />
          <Line t={t} at={rel('一亿', 'hook')} y={330} text="一亿美元的赔偿？" size={72} color={C.gold} />
        </>
      ),
    },
    {
      at: w('那一年'),
      tr: 'cut' as const,
      el: (t: number) => {
        const p = lin(t, 0, 50);
        const pts = Array.from({length: 40}, (_, i) => {
          const x = 200 + i * 40;
          const y = 300 + Math.pow(i / 39, 1.8) * 520 + Math.sin(i * 1.7) * 18;
          return `${x},${y}`;
        }).slice(0, Math.max(2, Math.floor(40 * p)));
        return (
          <>
            <Svg>
              <Defs />
              <rect width={1920} height={1080} fill="#0c0606" />
              <polyline points={pts.join(' ')} stroke={C.cn} strokeWidth={8} fill="none" strokeLinejoin="round" />
            </Svg>
            <Line t={t} at={6} y={240} text="全世界都在往下掉" size={64} />
          </>
        );
      },
    },
  ];
  return (
    <Graded grade="warm">
      <Shots shots={shots} end={total} />
    </Graded>
  );
};

