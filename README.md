# explainer-kit

用 Remotion 做讲解视频的模板。旁白写在 `tts/script.json` 里，用 `[[cue]]` 标出动画触发点；edge-tts 合成语音时记下每个词的出口时间，生成 `src/timings.json`。场景代码只问「这个 cue 在第几帧」「这个词在第几帧」，不写死任何秒数，所以改旁白、重跑语音之后，动画和字幕自动跟上。

仓库自带一支约 60 秒的演示片（2 场）：第一场用 `film` 风格包，第二场用 `slides` 风格包和一条 KaTeX 公式。演示片的时间轴和音频是用 `--mock` 生成的静音占位，克隆下来不用联网合成就能预览。

## 快速开始

```bash
npm i
npm run studio          # 打开 Remotion Studio，直接看演示片（静音占位音轨）
```

想要真实配音和正式字体：

```bash
npm run fonts                       # 下载 Noto Sans SC / Noto Serif SC 可变字体到 public/fonts/（OFL，不进仓库）
pip install -r requirements.txt     # edge-tts、numpy、Pillow、pytest
python tts/gen.py                   # 真 edge-tts，需要联网和 ffmpeg；写 public/audio/*.mp3 + src/timings.json
```

不下载字体也能跑：字体栈会退回系统字体（微软雅黑、苹方等），日志里那两条 `fonts/*.ttf` 404 属于预期。

## 目录

| 路径 | 作用 |
|---|---|
| `kit.config.json` | 唯一配置：合成 ID、尺寸、帧率、旁白音色与语速、引语音色、停顿时长、字幕行长、`--mock` 语速、每场前后留白、字体 |
| `tts/script.json` | 旁白稿，每场一个 `{id, chapter, text}` |
| `tts/gen.py` | 旁白 → 音频 + `src/timings.json`；`--mock` 离线估算 |
| `src/core/` | 与风格无关的核心：时间轴 API、`Video` 外壳、布局助手、`Tex`、配色与字体栈 |
| `src/film/` | 电影风格包（可删） |
| `src/slides/` | 幻灯片风格包（可删） |
| `src/scenes/` | 你的场景；`index.ts` 是登记表 |
| `tools/` | 审图、拼图、配乐、混音、下载字体 |
| `public/fx/` | 胶片颗粒和纸张纹理 |

## 配置 `kit.config.json`

| 字段 | 含义 |
|---|---|
| `id` `width` `height` `fps` | 合成参数。`npm run render` 默认输出 `out/<id>.mp4` |
| `voice` `rate` | 旁白音色和语速，例如 `zh-CN-YunjianNeural`、`+10%` |
| `voices` | 引语音色表，键名就是 `<<key|...>>` 里的 key |
| `pause` | `||` 的停顿秒数 |
| `maxLine` | 字幕每行最多字数 |
| `mockCharsPerSec` | `--mock` 估算语速，默认 4.2 字/秒 |
| `pace.lead` / `pace.tail` | 每场旁白前（放章节卡）和旁白后的留白帧数；`leadOverride` / `tailOverride` 按场覆盖 |
| `fonts` | `sans` / `serif` / `mono` 的字体名、文件、下载地址和后备字体 |

`src/Root.tsx`、`tools/*.mjs`、`tools/*.py`、`tts/gen.py` 都从这里读，不要在别处写死这些值。

## 旁白标记

```json
{"id": "s01", "chapter": "第一场 · 旁白就是时间轴",
 "text": "[[open]]做讲解视频……[[quote]]有位剪辑师说得好：<<q|别对齐画面，对齐声音。>>||[[ask]]画面只需要问一句……"}
```

| 标记 | 含义 |
|---|---|
| `[[name]]` | cue：动画或镜头切换点，记录的是它后面第一个词的出口时间。名字只能是字母、数字、下划线；`end` 是保留名 |
| `\|\|` | 戏剧停顿，时长取 `pause`，可以连写叠加 |
| `<<key\|……>>` | 这一段换成 `voices[key]` 的音色读；字幕里这一行会用衬线体加「」 |

`chapter` 用 ` · ` 分成小标题和大标题，显示在章节卡上。lead 不超过 30 帧的场景不出章节卡（适合冷开场）。

## 时间轴 API

场景里调用 `useScene()`，返回的帧数都以本场开头为 0：

| 函数 | 返回 |
|---|---|
| `c('cue')` | 这个 cue 所在的帧 |
| `w('词', n?)` | 旁白第 n 次（从 0 数）说到这个词的帧 |
| `rel('词', 'cue')` | 从这个 cue 到它之后第一次说到这个词，隔了多少帧 |
| `f` `total` `end` `lead` | 当前帧、本场总帧数、旁白结束帧、开场留白帧数 |

配套的动画助手：`ease(f, at, dur)` 缓动 0→1，`pop(f, at)` 带回弹，`fu(p)` 上浮淡入样式，`lerp(p, a, b)`，`window_(f, a, b)` 在 a..b 之间可见并带淡入淡出，`num(v)` 千分位。

```tsx
const {f, c, w, rel} = useScene();
const title = ease(f, c('idea'));               // cue 一到，标题淡入
const stampAt = w('重新对一遍');                 // 说到这个词时盖章
// 在 film 的 Shots 里，镜头内时间 t 从 cue 起算，所以用 rel：
<Stamp t={t} at={rel('重新对一遍', 'old')} text="全部返工" x={1180} y={610} />
```

`w()` 找不到词、`c()` 找不到 cue 都会直接抛错，改稿后 Studio 里会立刻报出来。

## 工作流

1. **写稿**：编辑 `tts/script.json`。
2. **合成**：`python tts/gen.py`（只重做某几场：`python tts/gen.py s02`；离线占位：`python tts/gen.py --mock`）。
3. **预览**：`npm run studio`。
4. **审图**：`node tools/stills.mjs s01 s02` 在每个 cue 后约 2.5 秒出一张图（`OFF=30 node tools/stills.mjs` 改偏移），`python tools/sheet.py s01` 拼成 2×2 的检查表；只看某几帧用 `node tools/pick.mjs s01:quote:40 s02:end:-10`（`场景:cue:偏移帧`，`end` 表示旁白结束）。输出在 `out/stills`、`out/sheets`、`out/pick`。
5. **渲染**：`npm run render`（带 `--gl=angle`）→ `out/<id>.mp4`。
6. **配乐**：`python tools/music.py` → `out/music.wav`。按 timings 每场一段和声，每个章节开头一声轻击，重配音后重跑即可对齐。
7. **混音**：`python tools/mix.py` → `out/<id>-mixed.mp4`。配乐低通后按旁白做 sidechain 压缩，再整体 `loudnorm=I=-16:TP=-1.5:LRA=11`。

## 风格包

外壳 `src/core/Video.tsx` 按场景登记表里的 `look` 给每一场「穿衣服」：底色、背景层、画面上的叠加层（颗粒、暗角）、最上层的框（黑边）、章节卡、字幕样式。核心代码从不 import 风格包，不用的包整个删掉即可。

- **film**（`src/film/`）：`Shots` 按 cue 切镜头（`fade`/`cut`/`black`/`flash`/`slow` 转场），`Cam` 缓推运镜，`Graded` 调色（past/warm/cold/dusk/neutral），`Grain`、`Vignette`、`Letterbox`（2.2:1），`Place` 年份地点字幕，`Tag`、`Line`、`BigQuote`，`Paper`、`Doc`、`Stamp`、`Mark`、`InkBars`、`Count`，背景 `Sky`、`Glow`、`Void`、`Desk`，章节卡 `Chapter`。字幕放在下黑边里。
- **slides**（`src/slides/`）：`Panel`、`Chip`、`Kicker`、`H`，点阵背景和简单章节卡；字幕是半透明底条，按逐词时间点亮。

两个包共用 `src/core` 的 `At`（`center` 时居中位移会和你传入的 `transform` 叠加）、`Full`、`Svg`、`DrawLine`、`Tex`，配色统一在 `src/core/theme.ts`。

## 加一个场景

1. 在 `tts/script.json` 里加一项，比如 `{"id": "s03", "chapter": "第三场 · 标题", "text": "[[a]]……[[b]]……"}`，跑 `python tts/gen.py s03`（或 `--mock`）。
2. 新建 `src/scenes/s03.tsx`：

   ```tsx
   import React from 'react';
   import {At, ease, fu, useScene} from '../core';
   import {H, Panel} from '../slides';

   export const S03: React.FC = () => {
     const {f, c, w} = useScene();
     return (
       <At x={960} y={540} center style={fu(ease(f, c('a')))}>
         <Panel><H>{f >= w('关键词') ? '说到了' : '还没说到'}</H></Panel>
       </At>
     );
   };
   ```
3. 在 `src/scenes/index.ts` 登记：`s03: {component: S03, look: slides}`。场景顺序以 `tts/script.json` 为准。

## 踩过的坑

- **渲染一定带 `--gl=angle`**。走 GPU 合成；纯软件 GL 大约慢 5 倍（上一个 21 分钟的片子：25 分钟对两个多小时）。`npm run render` 已经带上。
- **超过 10 分钟左右的渲染要脱离终端跑，看日志**，别挂在会超时的后台 shell 上，超时会把渲染一起杀掉。Git Bash：`nohup npm run render > out/render.log 2>&1 &`；PowerShell：`Start-Process npm.cmd -ArgumentList 'run','render' -RedirectStandardOutput out/render.log -RedirectStandardError out/render.err -WindowStyle Hidden`，然后看 `out/render.log`。
- **edge-tts 原始输出只有 -24 LUFS 左右**，直接发布会明显偏小声。发布前一定跑 `tools/mix.py`（或至少做一遍 loudnorm）。
- **一场的第一个 cue 太晚，开场会空 3–6 秒**。镜头从 cue 才开始画的话，章节卡淡出后到第一个 cue 之间什么都没有。第一个 cue 放在文稿最前面，或者让第一个镜头从第 0 帧开始（演示片 s01 就是这样）。
- **`zh-CN-YunyangNeural` 在 +6% 时只有约 3.3 字/秒**，听着拖。用它的话语速调到 +15% 左右。
- **`--mock` 的时间只是估算**（每字 1/4.2 秒），用来搭画面足够，但换成真配音后每个 cue 的位置都会变；按 cue 和词取帧的写法不受影响，写死的帧数会错位。
- **只重做某几场时，其他场沿用旧 timings**：`python tts/gen.py s02` 不会动 s01 的音频和时间。
- **cue 名 `end` 是保留的**（工具里表示旁白结束），`gen.py` 遇到会直接报错。
- **场景里别用 `Math.random()`**，要随机就用 film 包的 `rng(seed)` 或 Remotion 的 `random(seed)`。渲染是多进程逐帧并行的，同一帧必须画出同样的东西。
- **edge-tts 偶尔断线**，`gen.py` 每段会重试 10 次，间隔递增。

## English

explainer-kit is a Remotion template for narrated explainer videos. Narration lives in `tts/script.json` with inline markers: `[[cue]]` marks an animation/shot trigger, `||` inserts a dramatic pause, and `<<key|...>>` reads a quote with an alternate voice. `tts/gen.py` synthesizes each scene with edge-tts, records word boundaries and writes `public/audio/<scene>.mp3` plus `src/timings.json`. Scenes read frames through `useScene()` — `c('cue')`, `w('word')`, `rel('word', 'cue')` — so durations and animations follow the audio after any rewrite.

Quick start: `npm i && npm run studio` shows the bundled ~60 s demo, whose timings and silent audio were produced by `python tts/gen.py --mock` (no network; word times estimated from character count). `npm run fonts` downloads the Noto Sans SC / Noto Serif SC variable fonts (OFL) into `public/fonts/`; without them the stacks fall back to system fonts. All size, fps, voice, pace and font settings live in `kit.config.json`. Two optional style packs are included: `film` (letterbox, grain, grade, cue-driven shots, paper props) and `slides` (panels, chips, karaoke subtitles). Review with `tools/stills.mjs`, `tools/pick.mjs` and `tools/sheet.py`; render with `npm run render` (uses `--gl=angle`); add a synthesized score with `tools/music.py` and mix/normalize to -16 LUFS with `tools/mix.py`.

## License

MIT，见 `LICENSE`。Noto 字体不随仓库分发，由 `npm run fonts` 下载，遵循 SIL Open Font License。
