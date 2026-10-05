---
name: new-style-pack
description: 给 explainer-kit 新增一套视觉风格包（配色、背景、章节卡、组件、Look）。用户想要「再来一种风格」「做成 XX 风」或提供参考视频/参考风格时使用。
---

# 新风格包

## 1. 先定方向

一句话说清：底色（深/浅）、一个主色、它的「标志性动作」是什么（例：paper 是线条一笔笔画出来并持续轻抖，neon 是网格地面一直往前滚，keynote 是一个形状不断变形）。和现有 9 套比，要有明显不同的东西，而不只是换颜色。

## 2. 搭骨架

```bash
node tools/new-pack.mjs chalk --base "#1F2B26" --accent "#F2C14E"
node tools/new-scene.mjs s10 --look chalk --chapter "第十场 · 黑板风" --text "[[start]]……"
```

`new-pack` 生成 `src/chalk/index.tsx`：经过 `themed()` 的调色板、带缓慢光斑的背景、章节卡、`Title`/`Card` 组件、`Look`。

## 3. 每个包都要满足（背后是 `docs/principles.md` 的原理 2、3、4）

- 调色板必须经过 `themed('<pack>', {...}, {accent: [...], accent2: [...]})`，把主色挂到 accent 槽位，品牌色才能一键替换；颜色写 `#rrggbb`。
- 背景永远有一点动作（漂移光斑、滚动纹理、闪烁），不能整屏静止。
- 章节卡和场景开头的版式尽量一致（editorial 的章节卡和正文同一套刊头），切进正文时不跳。
- `look.subtitles`：浅底配深色字幕条（`boxColor`），深底反之；`quoteColor` 用主色。
- 组件只用 `useCurrentFrame()` 和传进来的帧号；进场退场用 `life` + `move`；随机用 `rng`/`noise`。
- 标志性动作做成组件，并配好音效建议（例：画线配 `draw`，落地配 `thud`）。
- 包内不 import 其他风格包；core 不 import 任何包。

## 4. 演示和文档

- 写一场演示（`src/scenes/sNN.tsx`），把这个包最有代表性的动作都用上，按 `review` skill 审一遍，包括 `FORMAT=9x16`。
- README「风格包」加一条介绍、「选哪套」加一句用途、目录表加一行；英文段落的包列表同步。
- `node tools/overview.mjs` 看新包和其他包放在一起是否协调；再设一个 `brand.accent` 看换色效果。
