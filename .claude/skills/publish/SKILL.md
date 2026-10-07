---
name: publish
description: 出片：从真配音到最终带配乐、响度标准化的 mp4，包括横屏、竖屏 9:16、方屏 1:1 和品牌色设置。用户说「出片」「渲染成片」「导出竖屏」「发布」时使用。真配音和正式渲染在 Windows 本机做。
---

# 出片

## 一条命令

```bash
node tools/publish.mjs                       # 真 edge-tts → 渲染 → 配乐 → 混音，主画幅
node tools/publish.mjs --formats 9x16,1x1    # 同时出竖屏和方屏（或 --formats all）
node tools/publish.mjs --skip-tts            # 只改了画面，沿用现有配音和时间轴
node tools/publish.mjs --mock                # 离线跑通整条流水线（静音旁白）
```

publish 会在渲染前先跑 `tools/verify.mjs`（验收不过就停，不会白渲染几十分钟）；确实要跳过用 `--no-verify`。

成品：`out/<id>-mixed.mp4`、`out/<id>-9x16-mixed.mp4`……

## 出片前确认

1. **字体**：`npm run fonts` 下载 Noto Sans/Serif SC，否则会退回系统字体。
2. **品牌**：`kit.config.json` 的 `brand.name`（片尾、跑马灯里的名字）、`brand.accent` / `brand.accent2`（#rrggbb，替换所有风格包的主色），单个包微调用 `theme.<pack>.<key>`。改完先跑 `node tools/overview.mjs` 看一眼。
3. **画幅**：`formats` 里每个格式都会多一个合成 `<id>-<格式>`。竖屏把 16:9 画面放在中间，上面是章节标题，下面是大字幕；某一场内容集中在中间时，在 `src/scenes/index.ts` 给它 `portrait: {zoom: 1.3}` 放大裁边（`focus` 选保留哪一侧）。
4. **音量**：`sfx.volume` 是音效总音量；`music.bpm` 决定配乐节拍（场景里 `useBeat()` 用同一个网格）。改了音效配方要跑 `python tools/sfx.py`。

## 踩过的坑

- 渲染一定要 `--gl=angle`（`tools/render.mjs` 已带上），纯软件 GL 慢约 5 倍。
- 超过 10 分钟的渲染脱离终端跑并看日志：Git Bash `nohup node tools/publish.mjs --formats all > out/publish.log 2>&1 &`；PowerShell 用 `Start-Process` 并重定向输出。
- edge-tts 原始响度只有约 -24 LUFS，必须经过 `tools/mix.py`（publish 已包含）。它用 `tools/master.py` 做两遍线性母带（测 → 加增益 → 限幅 → 再测），目标是 `kit.config.json` 的 `loudness.target`（默认 -16），某个画幅可以单独设（`formats.9x16.loudness`，默认 -14，给短视频平台）。真峰值在编码后的 AAC 上测，超过 -1 dBTP 会自动降天花板重做。
- 出片后跑 `python tools/audio-report.py out/<id>-mixed.mp4 --target -16` 看分段响度和波形。
- 渲染报 `kill EBADF`、而且只在范围里有音频时才崩：是某个 WAV 用 Python `wave` 模块写的（最简文件头）。用 `tools/kit.py` 的 `wav_bytes()` 重写；`pytest` 会查出 `public/` 里不合格的 WAV。
- 没有旁白的短片、广告用 `node tools/promo.mjs`（见 `new-promo` skill）。
- 只重做某几场的配音：`python tts/gen.py s03 s05`，其他场沿用旧时间轴；然后 `publish --skip-tts`。
- 换了真配音后 cue 位置都会变，交付前按 `review` skill 再审一遍。
