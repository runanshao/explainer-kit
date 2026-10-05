---
name: new-scene
description: 在 explainer-kit 里新写一场讲解（旁白 + 画面）。用户给一个主题、一段文稿或一个要讲的概念，想做成视频里的一场时使用；也用于把已有的一场改写成另一种风格。
---

# 写一场

## 1. 先写旁白，再想画面

旁白就是时间轴。在纸面上把文稿切成「一句话一个画面」，每个画面变化前放一个 `[[cue]]`：

- 第一个 cue 放在文稿最前面，否则章节卡淡出后会空几秒。
- 一个 cue 对应一个画面变化（新元素进场、转场、镜头推近）。一场 4–7 个 cue 比较合适，太密画面会乱。
- 戏剧停顿用 `||`；引语换声音用 `<<q|……>>`。cue 名只能用字母、数字、下划线，`end` 是保留名。
- 开头那半句（比如「再换一套：」）也要配字或画面，标题要等念到才出的话前面会空。

## 2. 选风格

| 内容 | 风格包 |
|---|---|
| 叙事、人物 | `film` |
| 概念、API | `slides` |
| 流程、因果、拆步骤 | `paper` |
| 系统、架构、数据流 | `neon` |
| 观点、金句、关键数字 | `editorial` |
| 公式推导、函数图像 | `math` |
| 产品介绍、操作演示 | `keynote` |
| 轻松科普、儿童向 | `pixel` |
| 历史、诗词、传统文化 | `ink` |

## 3. 一条命令搭好骨架

```bash
node tools/new-scene.mjs s10 --look paper --chapter "第十场 · 标题" --text "[[start]]……[[next]]……"
```

它会追加 `tts/script.json`、生成能直接跑的 `src/scenes/s10.tsx`（每个 cue 一段跟着旁白出现的字）、登记到 `src/scenes/index.ts`、跑 `--mock` 时间轴。之后改旁白只需 `python tts/gen.py --mock s10`。

## 4. 把占位画面换成真正的画面

只用帧号说话，永远不写死秒数：

- `c('cue')`、`w('词')`、`rel('词', 'cue')` 取帧；`useSpoken().chars/span` 取逐字帧。
- 进场和退场成对：`const {p, q} = life(f, at, out)`，样式用 `move('rise', p, q)`。会被新内容替换的元素一定要有 `out`。
- 屏幕上的字用 `<Spoken text="……旁白原文……" />`，按配音逐字出现；`text` 必须和旁白一字不差（可以加 `\n` 换行）。
- 分镜用 `<Shots>`，转场选 `push` `up` `zoom` `wipe` `whip` `iris` `black`；相似画面不要用 `fade`（会重影）。
- 落定的元素加一点 `drift(f, seed)`，背景要有不停的小动作，不要冻住。
- 音效 `<Sfx at={帧} name="pop" />` 放在场景最外层（不要放进 Shots 的镜头里，镜头切走会把声音截断）。可用的声音见 `src/core/Sfx.tsx` 的 `SFX`。点击配 `click`，落地配 `thud`，大字配 `slam`，画线配 `draw`，推拉配 `whoosh`。
- 想踩在配乐节拍上：`const beat = useBeat()`，`beat.next(帧)` 吸附到下一拍，`beat.pulse()` 每拍一次的 0..1。
- 不要用 `Math.random()`，用 `rng(seed)` / `noise(seed, x)`。

各风格包的组件看 README「风格包」一节和对应的 `src/<pack>/index.tsx`；演示场 `src/scenes/s01–s09.tsx` 是每个包的完整用法示例。

## 5. 交付前

`npx tsc --noEmit` 通过，然后按 `review` skill 审一遍动态、声音和竖屏。
