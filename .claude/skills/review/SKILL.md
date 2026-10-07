---
name: review
description: 审片：检查 explainer-kit 某一场或整片的动态、声音、竖屏/方屏版式和品牌色。改完场景、换了风格包或品牌色、要交付之前使用；用户说「看看效果」「检查一下」「审一下」时也用。
---

# 审片

渲染工具在没有 Remotion 浏览器的环境（比如云端沙箱）会自动用 `/opt/pw-browsers` 里预装的 headless shell，也可以用 `REMOTION_BROWSER=…` 指定。输出都在 `out/`，不要提交。

## 看动态：拼帧，不要只看静帧

```bash
node tools/strip.mjs s05:block              # cue 前 6 帧到后 84 帧，每 6 帧一格
node tools/strip.mjs s05:block:-4:120:8     # 场景:cue:起:止:步长
FORMAT=9x16 node tools/strip.mjs s07:card   # 竖屏版式
```

逐格对照这些问题：

1. **死帧**：cue 之后有没有超过 1 秒什么都不动、或者画面是空的（常见于标题等念到才出、开头半句没配画面）。
2. **重影**：两个相似画面叠化时互相透出来。换成 `push`，或让旧元素先 `life(..., out)` 离场。
3. **重叠**：旧内容还没走完新内容就进来了（退场要在下一个 cue 之前结束）。
4. **冻住**：元素落定后就完全不动。加 `drift`，或背景带一点持续动作。
5. **字和声音对不上**：屏幕大字跑在配音前面或落后太多。用 `<Spoken>`，不要按固定速度打字。
6. **出画/遮挡**：元素压到字幕区（画面底部约 120px）或被裁掉。

## 看全片和品牌色

```bash
node tools/overview.mjs                   # 每场一格的总览图
node tools/overview.mjs --format 9x16     # 竖屏总览
```

改 `kit.config.json` 的 `brand.accent` 后跑一次总览，确认九套风格换色后都还看得清。

## 听声音（没有扬声器也行）

```bash
node tools/listen.mjs s05                   # 整场
node tools/listen.mjs s05:block s05:out:30  # 一段
```

输出每个声音离哪个 cue 多少帧（如 `hit+0`）。`--mock` 时旁白是静音的，列出来的全是音效和配乐节拍。核对：每个点击、落地、砸字都有声音，且偏差在 ±3 帧内；没有意外的长时间噪声。

## 量声音（成片）

```bash
python tools/audio-report.py out/Explainer-mixed.mp4 --target -16      # 讲解片
python tools/audio-report.py out/Promo-mixed.mp4 --promo --target -14  # 短片
```

整体响度要在目标 ±1 LU，真峰值 ≤ -1 dBTP（在编码后的文件上测）。看分段响度：某一场比相邻的响 3 LU 以上，多半是那场音效没配平（演示片 s08 的方波金币就是这样查出来的）；短片的 `break`、`build` 应该比 `groove` 低，`drop` 最响。再看 `out/audio/*_wave.png`：一条平带说明压过头或混响糊了。

## 看短片

```bash
node tools/promo-sheet.mjs        # 每个 cue 后 4 帧一格；OFF=0 看重拍那一帧
node tools/promo-sheet.mjs 230 236 239 243   # 指定帧，看一段动作（比如轮播停没停住）
```

短片不要用 `<Freeze>` 拼图看（转场有预卷，会差几帧）；这个工具是逐帧直接渲染的。

## 交付前的检查清单

- `npm run verify` 全部通过（类型、源文件一致、每场每种画幅可渲染、两次渲染逐字节一致、短片每个 cue 可渲染且可复现）
- 成片跑过 `audio-report.py`：响度在目标上、真峰值 ≤ -1 dBTP、没有哪一场突然响一截
- 改过的每场都拼帧看过，主画幅和 9x16 各一遍
- 音效位置用 `listen` 核对过
- 真配音（Windows 上 `python tts/gen.py`）后再看一遍：cue 位置会变，写死的帧数会错位
