# explainer-kit

Remotion 讲解视频模板：旁白里写 `[[cue]]` 标记，edge-tts 的逐词时间戳驱动字幕和动画。没有旁白的短片 / 广告走节拍网格（`promo/promo.json`，`src/promo/`，`node tools/promo.mjs`）。用法见 `README.md`。

- 面向用户的文档用简体中文；代码、命令、标识符用英文。
- 本机是 Windows（渲染、真 TTS 验证在那里做）；云端沙箱只做重构、类型检查、`--mock` 时间轴和单测。沙箱里也能看画面和听音效：`tools/` 的渲染脚本会自动用 `/opt/pw-browsers` 预装的 headless shell（`node tools/strip.mjs s01:quote`、`node tools/overview.mjs`、`node tools/listen.mjs s05`），只看，不提交 `out/`。
- 做事的原则：往原理去理解，随后一通百通；可交付、可重复、稳定输出，才是 AI 赋能的前提。项目的七条原理见 `docs/principles.md`，动手前先对照它想清楚，新需求优先从原理推，不要只套组件。交付前跑 `npm run verify`（`--quick` 只做类型和一致性检查），它不过就不算完成。
- 常做的事有项目 skill（`.claude/skills/`）：`new-scene` 写一场、`review` 审片、`new-style-pack` 新风格包、`publish` 出片、`new-promo` 做短片。反复手动做的步骤，优先收成 `tools/` 脚本或补进这些 skill。
- 不在仓库里提交字体文件和渲染产物（`out/`、`public/fonts/`）。
- 场景要播的 WAV 一律用 `tools/kit.py` 的 `wav_bytes()` 写：Python `wave` 模块的最简文件头会让 Windows 上的 Remotion 渲染崩溃（只报 `kill EBADF`）。
- 声音和画面一样要验：出片后看 `tools/audio-report.py`（响度、真峰值、分段响度）。广告文案过 `tools/copy_lint.py`。
