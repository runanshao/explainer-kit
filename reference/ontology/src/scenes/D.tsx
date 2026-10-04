import React from 'react';
import {random} from 'remotion';
import {C, FONT} from '../theme';
import {At, Chip, Full, H, Kicker, Panel, Tex, ease, fu, pop, useLang, useScene, window_} from '../lib';
import {Onepager, R} from '../Onepager';
import {camAt} from './A';
import {Check, Cross} from './B';

/* ───────────────────────── s15 · 为什么是设备级 ───────────────────────── */
const Tangle: React.FC<{p: number}> = ({p}) => {
  const pts = Array.from({length: 26}).map((_, i) => [20 + random(`tx${i}`) * 360, 20 + random(`ty${i}`) * 200]);
  return (
    <svg width={400} height={240}>
      {pts.map((a, i) => {
        const b = pts[Math.floor(random(`te${i}`) * pts.length)];
        const b2 = pts[(i * 5 + 3) % pts.length];
        return (
          <g key={i} opacity={p}>
            <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={C.dim} strokeWidth={2} />
            <line x1={a[0]} y1={a[1]} x2={b2[0]} y2={b2[1]} stroke={C.dim} strokeWidth={2} />
            <circle cx={a[0]} cy={a[1]} r={7} fill={C.muted} />
          </g>
        );
      })}
    </svg>
  );
};
const Repeat: React.FC<{p: number; f: number}> = ({p, f}) => (
  <svg width={400} height={240}>
    {[0, 1, 2].map((k) => (
      <g key={k} transform={`translate(${30 + k * 120},60)`} opacity={p}>
        <circle cx={40} cy={20} r={10} fill={C.muted} />
        <circle cx={10} cy={80} r={10} fill={C.muted} />
        <circle cx={75} cy={80} r={10} fill={C.muted} />
        <line x1={40} y1={20} x2={10} y2={80} stroke={C.dim} strokeWidth={3} />
        <line x1={40} y1={20} x2={75} y2={80} stroke={C.dim} strokeWidth={3} />
      </g>
    ))}
    <g transform={`rotate(${(f * 3) % 360} 200 200)`} opacity={p}>
      <path d="M170,200 A30,30 0 1 1 200,230" stroke={C.red} strokeWidth={4} fill="none" />
    </g>
  </svg>
);
const BRICKS = [
  {l: '空压机', en: 'Compressor', col: C.tealDeep},
  {l: '萃取槽', en: 'Extraction tank', col: '#3f7f5a'},
  {l: '水泵', en: 'Pump', col: '#2d6680'},
  {l: '换热器', en: 'Heat exchanger', col: '#7a5a2d'},
];
const Brick: React.FC<{l: string; en: string; col: string; w?: number}> = ({l, en, col, w = 230}) => {
  const isEn = useLang() === 'en';
  return (
    <div style={{width: w, height: 110, background: col, borderRadius: 12, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isEn ? 27 : 34, fontWeight: 800, color: '#fff', boxShadow: 'inset 0 -8px 0 rgba(0,0,0,0.25)', whiteSpace: 'nowrap'}}>
      {[0.25, 0.75].map((x) => (
        <div key={x} style={{position: 'absolute', top: -16, left: `calc(${x * 100}% - 22px)`, width: 44, height: 18, borderRadius: '8px 8px 0 0', background: col}} />
      ))}
      {isEn ? en : l}
    </div>
  );
};
export const S15: React.FC = () => {
  const {f, c, L} = useScene();
  const doc = 1 - ease(f, c('big') - 10, 16);
  const cards = window_(f, c('big') - 6, c('lego') + 10, 14);
  const lego = window_(f, c('lego'), c('phys') + 8, 14);
  const phys = window_(f, c('phys'), c('F') + 8, 14);
  const F = ease(f, c('F'), 20);
  return (
    <Full>
      <Onepager focus={R.route} highlight={R.route} hp={ease(f, 10)} opacity={doc} maxW={1500} maxH={560} />
      <Full style={{opacity: cards}}>
        {[
          {k: 'big', t: L('全企业大本体', 'One giant enterprise ontology'), d: L('太大，建不完', 'Too big, never finished'), icon: <Tangle p={ease(f, c('big') + 6)} />, ok: false},
          {k: 'scene', t: L('按场景的本体', 'One ontology per use case'), d: L('每个项目重来一遍', 'Start over every project'), icon: <Repeat p={ease(f, c('scene') + 6)} f={f} />, ok: false},
          {k: 'dev', t: L('单台设备的本体', 'One per equipment type'), d: L('做一块，到处拼', 'Build once, snap in anywhere'), icon: <div style={{paddingTop: 70}}><Brick {...BRICKS[0]} /></div>, ok: true},
        ].map((k, i) => {
          const p = ease(f, c(k.k));
          return (
            <At key={k.k} x={340 + i * 620} y={520} center style={{opacity: p, transform: `translate(-50%,-50%) translateY(${(1 - p) * 30}px)`}}>
              <Panel accent={k.ok ? C.orange : undefined} style={{width: 540, height: 520, display: 'flex', flexDirection: 'column', alignItems: 'center', boxSizing: 'border-box'}}>
                <div style={{fontSize: L(40, 31), fontWeight: 900, color: k.ok ? C.orange : C.ink, textAlign: 'center'}}>{k.t}</div>
                <div style={{height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{k.icon}</div>
                <div style={{fontSize: L(32, 27), color: k.ok ? C.green : C.red, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10, opacity: ease(f, c(k.k) + 20)}}>
                  {k.ok ? <Check size={36} /> : <Cross size={36} />} {k.d}
                </div>
              </Panel>
            </At>
          );
        })}
      </Full>
      <Full style={{opacity: lego}}>
        {L(['工厂 1 · 智利', '工厂 2 · 印尼'], ['Plant 1 · Chile', 'Plant 2 · Indonesia']).map((name, fi) => (
          <At key={name} x={200 + fi * 860} y={260} w={660} h={520} style={{border: `2px dashed ${C.muted}`, borderRadius: 24}}>
            <div style={{position: 'absolute', top: -22, left: 30, background: C.bg, padding: '0 14px', fontSize: 30, color: C.muted, fontWeight: 700}}>{name}</div>
          </At>
        ))}
        {[0, 1].map((fi) =>
          BRICKS.map((b, i) => {
            const p = pop(f, c('lego') + 10 + fi * 50 + i * 8);
            const x = 260 + fi * 860 + (i % 2) * 290;
            const y = 350 + Math.floor(i / 2) * 200;
            return (
              <At key={`${fi}-${i}`} x={x} y={y - (1 - Math.min(p, 1)) * 200} style={{opacity: Math.min(1, p * 2)}}>
                <Brick {...b} w={250} />
              </At>
            );
          }),
        )}
        <At x={960} y={860} center style={{opacity: ease(f, c('lego') + 100), fontSize: 34, color: C.ink, fontWeight: 700}}>
          {L('同一套设备本体，直接复用', 'The same equipment ontology, reused as-is')}
        </At>
      </Full>
      <Full style={{opacity: phys}}>
        <At x={200} y={250} w={700} style={fu(ease(f, c('phys')))}>
          <Panel accent={C.teal} style={{height: 480, boxSizing: 'border-box'}}>
            <div style={{fontSize: L(40, 34), fontWeight: 900, color: C.teal, display: 'flex', alignItems: 'center', gap: 12, whiteSpace: 'nowrap'}}>
              <Check size={40} /> {L('物理规律 · 能复用', 'Physics · reusable')}
            </div>
            <div style={{fontSize: 32, lineHeight: 2.1, marginTop: 20}}>
              <div>{L('压力每降 1 bar ≈ 省电 7%', '1 bar lower ≈ 7% less power')}</div>
              <div>{L('比功率 = 功率 ÷ 排气量', 'Specific power = power ÷ airflow')}</div>
              <div>{L('空压机在哪国都一样', 'A compressor is a compressor anywhere')}</div>
            </div>
          </Panel>
        </At>
        <At x={1020} y={250} w={700} style={fu(ease(f, c('phys') + 60))}>
          <Panel style={{height: 480, boxSizing: 'border-box'}}>
            <div style={{fontSize: L(40, 34), fontWeight: 900, color: C.red, display: 'flex', alignItems: 'center', gap: 12, whiteSpace: 'nowrap'}}>
              <Cross size={40} /> {L('人定规则 · 难复用', 'Man-made rules · hard to reuse')}
            </div>
            <div style={{fontSize: 32, lineHeight: 2.1, marginTop: 20, color: C.muted}}>
              <div>{L('票据格式', 'Invoice formats')}</div>
              <div>{L('信用证条款', 'Letter-of-credit terms')}</div>
              <div>{L('各国税法与合规', 'Tax & compliance, country by country')}</div>
            </div>
          </Panel>
        </At>
      </Full>
      <Full style={{opacity: F}}>
        <At x={960} y={430} center style={{transform: `translate(-50%,-50%) scale(${0.9 + 0.1 * F})`}}>
          <Tex tex={String.raw`C(n)=\boxed{\color{#E8913F}F}+\varepsilon\cdot n`} size={110} />
        </At>
        <At x={960} y={640} center style={{...fu(ease(f, c('F') + 25)), transform: 'translate(-50%,-50%)'}}>
          <Chip color={C.orange} fill size={40}>
            {L('F = 设备本体库：做一次，到处用', 'F = the equipment ontology library: build once, use everywhere')}
          </Chip>
        </At>
      </Full>
    </Full>
  );
};

/* ───────────────────────── s16 · 清醒一下 ───────────────────────── */
const COLS = 48,
  ROWS = 13;
export const S16: React.FC = () => {
  const {f, c, L} = useScene();
  const doc = ease(f, c('platform'), 24);
  const n = COLS * ROWS;
  const mapped = Math.floor(Math.max(0, f - c('cost') - 20) * 0.9);
  const cam = camAt(f, [
    [0, R.unverified],
    [c('trust'), R.learn4],
  ]);
  return (
    <Full>
      <Full style={{opacity: 1 - doc}}>
        <At x={960} y={200} center style={{...fu(ease(f, c('cost'))), transform: 'translate(-50%,-50%)'}}>
          <H size={48}>{L('本体不是魔法', 'An ontology isn’t magic')}</H>
        </At>
        <At x={200} y={280} style={{display: 'grid', gridTemplateColumns: `repeat(${COLS}, 26px)`, gap: 6, opacity: ease(f, c('cost') + 10)}}>
          {Array.from({length: n}).map((_, i) => {
            const order = Math.floor(random(`m${i}`) * n);
            const isMapped = order < mapped;
            const drifted = f > c('drift') + 10 && random(`d${i}`) < 0.06 * ease(f, c('drift') + 10, 40) * 1.0 && isMapped;
            return <div key={i} style={{width: 26, height: 26, borderRadius: 6, background: drifted ? C.red : isMapped ? C.teal : 'rgba(237,232,220,0.08)'}} />;
          })}
        </At>
        <At x={200} y={720} style={{display: 'flex', gap: L(60, 40), fontSize: L(30, 26), fontWeight: 700, whiteSpace: 'nowrap'}}>
          <span style={{color: C.teal, opacity: ease(f, c('cost') + 20)}}>■ {L('已对应到本体：', 'Mapped to the ontology: ')}{Math.min(100, Math.round((mapped / n) * 100))}%</span>
          <span style={{color: C.muted, opacity: ease(f, c('cost') + 20)}}>■ {L('几万个数据点，逐个人工映射', 'Tens of thousands of points, mapped by hand')}</span>
          <span style={{color: C.red, opacity: ease(f, c('drift') + 10)}}>■ {L('改造 / 换传感器 → 要维护', 'Upgrades & new sensors → upkeep')}</span>
        </At>
      </Full>
      <Onepager focus={cam} highlight={f < c('trust') ? R.unverified : R.learn4} hp={f < c('trust') ? ease(f, c('platform') + 20) : ease(f, c('trust') + 30)} opacity={doc} maxW={1500} maxH={520} />
    </Full>
  );
};

/* ───────────────────────── s17 · 收尾 ───────────────────────── */
export const S17: React.FC = () => {
  const {f, c, L} = useScene();
  const l3 = ease(f, c('l3'), 24);
  const end = ease(f, c('end'), 30);
  return (
    <Full>
      <Full style={{opacity: 1 - l3}}>
        <At x={260} y={330} style={{...fu(ease(f, c('l1'))), display: 'flex', alignItems: 'center', gap: 40}}>
          <Chip color={C.teal} fill size={50}>
            {L('大模型', 'The LLM')}
          </Chip>
          <H size={56}>{L('负责思考', 'does the thinking')}</H>
        </At>
        <At x={260} y={520} style={{...fu(ease(f, c('l2'))), display: 'flex', alignItems: 'center', gap: 40}}>
          <Chip color={C.orange} fill size={50}>
            {L('本　体', 'The ontology')}
          </Chip>
          <H size={56}>{L('负责让它知道自己在说什么', 'makes sure it knows what it’s talking about')}</H>
        </At>
        <At x={560} y={660} style={{display: 'flex', gap: 24}}>
          {L(['哪一台机器', '哪一个数', '哪一条规律'], ['which machine', 'which number', 'which law of physics']).map((k, i) => (
            <span key={k} style={{transform: `scale(${pop(f, c('l2') + 40 + i * 12)})`, display: 'inline-block'}}>
              <Chip color={C.orange} size={34}>
                {k}
              </Chip>
            </span>
          ))}
        </At>
      </Full>
      <At x={960} y={400} center style={{opacity: l3, transform: `translate(-50%,-50%) translateY(${-60 * end}px)`, textAlign: 'center'}}>
        <div style={{fontFamily: FONT.serif, fontSize: L(70, 64), fontWeight: 800, color: C.ink, lineHeight: 1.5, whiteSpace: 'nowrap'}}>
          {L(
            <>
              本体不是更聪明的 AI，
              <br />
              而是让 AI <span style={{color: C.orange}}>知道自己在说什么</span>。
            </>,
            <>
              An ontology isn’t a smarter AI —
              <br />
              it’s what lets AI <span style={{color: C.orange}}>know what it’s talking about</span>.
            </>,
          )}
        </div>
      </At>
      <At x={960} y={690} center style={{opacity: end, transform: 'translate(-50%,-50%)', textAlign: 'center'}}>
        <div style={{width: 120, height: 3, background: C.teal, margin: '0 auto 34px'}} />
        <div style={{fontSize: 38, fontWeight: 800, color: C.teal, whiteSpace: 'nowrap'}}>{L('客户关心的是：工作完成得怎样，以及为此付出了什么。', 'Customers care about how well the job gets done — and what it cost them.')}</div>
        <div style={{fontSize: 22, color: C.muted, marginTop: 30, whiteSpace: 'nowrap', opacity: ease(f, c('end') + 60)}}>
          {L(
            '内容依据《工业 AI 出海：把「专家的手艺」做成可复制的产品》一页纸（整理自 Woltz 蔡博分享）',
            'Based on the one-pager “Industrial AI Goes Global: Turning Expert Craft into Repeatable Products” (from Dr. Cai’s talk at Woltz)',
          )}
        </div>
      </At>
    </Full>
  );
};
