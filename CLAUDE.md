# explainer-kit

Remotion 讲解视频模板：旁白里写 `[[cue]]` 标记，edge-tts 的逐词时间戳驱动字幕和动画。用法见 `README.md`。

- 面向用户的文档用简体中文；代码、命令、标识符用英文。
- 本机是 Windows（渲染、真 TTS 验证在那里做）；云端沙箱只做重构、类型检查、`--mock` 时间轴和单测。沙箱里要看画面，用预装的 headless shell：`REMOTION_BROWSER=$(ls -d /opt/pw-browsers/chromium_headless_shell-*/chrome-linux/headless_shell | head -1) node tools/strip.mjs s01:quote`（只看，不提交 `out/`）。
- 不在仓库里提交字体文件和渲染产物（`out/`、`public/fonts/`）。
