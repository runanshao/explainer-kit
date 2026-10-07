---
name: new-promo
description: 做一条没有旁白、按节拍走的短片：15 秒广告、品牌短片、产品宣传、短视频开场（默认竖屏 9:16，带配乐和音效，母带到 -14 LUFS）。用户说「做个短片」「广告片」「宣传片」「15 秒」「抖音」「让人一看就想来买」「punchy」「showreel」时使用。有旁白的讲解用 new-scene。
---

# 做一条短片

先读 `docs/principles.md` 的原理 1（时间来自节拍）和原理 7（声音量出来）。下面每一步都是这两条的具体做法。

## 1. 先定节拍和结构，再画画面

- **总长 = 整数小节**。128 BPM 一小节 1.875 秒，8 小节正好 15 秒；120 BPM 一小节 2 秒。先在 `promo/promo.json` 里排好每场几小节，再写画面。
- **一场一个意思，一拍一个动作**。经典结构（演示片就是这样）：冷开场三记砸字（1.5 小节）→ 四拍硬切讲四个卖点（1 小节）→ 16 分音符频闪（半小节）→ 间奏放一句主张（1 小节，`break`）→ 商品轮播（1 小节）→ 铺垫：跑马灯 + logo 描边，最后一拍留空（1 小节，`build`）→ 重拍落版：logo 填色、冲击波、彩屑、字标、标语、CTA（2 小节，`drop`）。
- **能量要有起伏**：`break` 抽掉底鼓，`build` 最后一拍留空，下一个重拍才砸得响。整条都是满能量，反而没有冲击力。

## 2. 画面

- 用 `punch` 包：`Slam`（在 cue 那一帧砸到位）、`Hud`、`Marquee`、`Badge`、`CardStrip`、`PatternText`、`LogoReveal`、`CtaBar`；粒子用 core 的 `<Burst>`。
- **砸字要落在拍上，不是从拍上开始**：`Slam at={cue('x')}` 内部用 `land()`，前 5 帧加速进场，`x` 那一帧到位，同一帧放 `<Sfx name="impact">` 或 `slam`。
- **硬切的场（四拍卖点、频闪）**：每拍换底色 + 换主体 + 一个大字，大字用 `dur={2}` 几乎立刻到位，否则跟不上切换。
- **转场写在 `promo.json` 的 `in` 里**：`iris`、`wipe`、`flood`、`up` 在重拍前播完。一条片子里用两三种就够；需要更强的「推进」可以在场景里自己做（演示片 p1 冲进「不」字里，用主题色铺满）。
- **停留要留够**：八分音符的轮播，滑动 4 帧、静止 3 帧；一句主张至少给一拍让人读。
- **logo 用描的，不用字体代替**：`python tools/trace-logo.py logo.png --split` → `src/brand/logo.json`。截图可以，窗口边框会自动去掉。描完用 `tools/promo-sheet.mjs` 看落版那几帧。
- **展示字体先逐字检查**：风格化中文字体个别字会认不出来。把文案里每个字渲染出来看一遍，认不出就换思源黑体 900。

## 3. 文案

- 卖点写感受和事实，不写绝对化用语：`python tools/copy_lint.py` 必须过（`pytest` 也会查）。
- 产地、价格、「每日上新」「当天到店」这类事实，用户没给就不要写，写进去之前先确认。
- CTA 要能直接行动：到店、扫码、搜索什么、点链接。没有地址或二维码，就在交付时说明缺了什么。

## 4. 声音

- 配乐由 `tools/score.py` 按同一张节拍网格写：调 `key`、每场 `energy` 就能改编曲。
- 音效写在场景里，跟着画面的动作：砸字 `slam`/`impact`、切换 `whip`、刀光转场 `swish`、跑马灯进场 `impact`、铺垫 `riser`（结束在重拍：`at = 重拍 - 45`）+ `revcrash`（`at = 重拍 - 15`）、logo 描边 `shimmer`、落版 `impact` + `chime`。
- `node tools/promo.mjs` 跑完看两样：`score.py` 打印的总线 RMS（鼓约 0.37、贝斯约 0.23、音乐约 0.15、混响 0.02–0.08，混响或 pad 比鼓响就是糊了），`audio-report.py` 的分段响度（`break` 和 `build` 应该比 `groove` 低几 LU，`drop` 最响）和 `out/audio/` 的波形。

## 5. 交付

1. `npm run verify`（包含短片两关）。
2. `node tools/promo.mjs` → `out/Promo-mixed.mp4`，报告里响度 -14 ±1 LUFS、真峰值 ≤ -1 dBTP。
3. 从成片里抽帧再看一遍（不是只看 Studio）：`ffmpeg -ss <秒> -i out/Promo-mixed.mp4 -frames:v 1 x.png`。
4. 交付时说清楚：哪些文案是你写的、没确认过；缺了哪些素材（地址、二维码、真实产品图）。
