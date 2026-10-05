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

## 交付前的检查清单

- `npx tsc --noEmit`、`pytest` 通过
- 改过的每场都拼帧看过，主画幅和 9x16 各一遍
- 音效位置用 `listen` 核对过
- 真配音（Windows 上 `python tts/gen.py`）后再看一遍：cue 位置会变，写死的帧数会错位
