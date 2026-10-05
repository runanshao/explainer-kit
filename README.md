# explainer-kit

用 Remotion 做讲解视频的模板。旁白写在 `tts/script.json` 里，用 `[[cue]]` 标出动画触发点；edge-tts 合成语音时记下每个词的出口时间，生成 `src/timings.json`。场景代码只问「这个 cue 在第几帧」「这个词在第几帧」，不写死任何秒数，所以改旁白、重跑语音之后，动画和字幕自动跟上。

仓库自带一支约 3 分钟的演示片（9 场），每场换一套风格包：`film`（电影）、`slides`（幻灯片 + KaTeX 公式）、`paper`（手绘笔记）、`neon`（霓虹终端）、`editorial`（杂志排版）、`math`（数学推导）、`keynote`（发布会）、`pixel`（像素游戏）、`ink`（水墨）。演示片的时间轴和音频是用 `--mock` 生成的静音占位，克隆下来不用联网合成就能预览。

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
| `kit.config.json` | 唯一配置：合成 ID、尺寸、帧率、旁白音色与语速、引语音色、停顿时长、字幕行长、`--mock` 语速、每场前后留白、品牌色、画幅、音效音量、配乐节拍、字体 |
| `tts/script.json` | 旁白稿，每场一个 `{id, chapter, text}` |
| `tts/gen.py` | 旁白 → 音频 + `src/timings.json`；`--mock` 离线估算 |
| `src/core/` | 与风格无关的核心：时间轴 API、动效词汇（`motion.ts`）、跟旁白同步的文字（`Spoken`）、镜头与转场（`Shots`）、`Video` 外壳、布局助手、`Tex`、配色与字体栈 |
| `src/film/` | 电影风格包（可删） |
| `src/slides/` | 幻灯片风格包（可删） |
| `src/paper/` | 手绘笔记风格包（可删） |
| `src/neon/` | 霓虹终端风格包（可删） |
| `src/editorial/` | 杂志排版风格包（可删） |
| `src/math/` | 数学推导风格包（可删） |
| `src/keynote/` | 发布会风格包（可删） |
| `src/pixel/` | 像素游戏风格包（可删） |
| `src/ink/` | 水墨风格包（可删） |
| `src/scenes/` | 你的场景；`index.ts` 是登记表 |
| `tools/` | 一键出片、新建场景/风格包、审图、拼帧、听音效、配乐、混音、音效合成、下载字体 |
| `public/fx/` | 胶片颗粒和纸张纹理 |
| `public/sfx/` | 音效库（`tools/sfx.py` 合成，无版权问题） |
| `.claude/skills/` | 给 Claude Code 的项目 skill：写一场、审片、新风格包、出片 |

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
| `brand` | `name`（片尾、跑马灯里的名字）；`accent` / `accent2`（#rrggbb，填了就替换所有风格包的主色和副色，`null` 保留各包原色） |
| `theme` | 按包微调单个颜色，例如 `{"neon": {"cyan": "#00FFC2"}}`，键名见各包调色板（`C` `P` `N` `E` `M` `K` `PX` `I`） |
| `formats` | 额外画幅，每个会多一个合成 `<id>-<键名>`：默认 `9x16`（1080×1920）和 `1x1`（1080×1080）；`zoom` > 1 时放大画面、裁掉两侧 |
| `sfx.volume` | 音效总音量（0–1） |
| `music.bpm` | 配乐节拍；场景里 `useBeat()` 用同一个节拍网格 |
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

配套的动画助手：`ease(f, at, dur)` 缓动 0→1，`pop(f, at)` 带回弹，`fu(p)` 上浮淡入样式，`lerp(p, a, b)`，`window_(f, a, b)` 在 a..b 之间可见并带淡入淡出，`num(v)` 千分位。更完整的动效词汇见下面的「动效」。

```tsx
const {f, c, w, rel} = useScene();
const title = ease(f, c('idea'));               // cue 一到，标题淡入
const stampAt = w('重新对一遍');                 // 说到这个词时盖章
// 在 film 的 Shots 里，镜头内时间 t 从 cue 起算，所以用 rel：
<Stamp t={t} at={rel('重新对一遍', 'old')} text="全部返工" x={1180} y={610} />
```

`w()` 找不到词、`c()` 找不到 cue 都会直接抛错，改稿后 Studio 里会立刻报出来。

## 动效

讲解视频的画面最容易「死」：元素淡入以后一动不动，下一个镜头靠叠化硬切过去，屏幕上的大字按固定速度打出来、跟嘴型对不上。`src/core` 提供一套跟风格无关的动效词汇来避开这些问题，所有风格包都能用。

**进场和退场**（`motion.ts`）

| 函数 | 作用 |
|---|---|
| `tween(f, at, dur, ease)` | 0→1，`ease` 可选 `out`（进场）、`in`（退场）、`inOut`（运镜、转场）、`expo`（大标题）、`back`（回弹） |
| `life(f, at, out)` | 返回 `{p, q}`：进场进度和退场进度。要离场的元素都应该给 `out` |
| `move(kind, p, q)` | 把进度变成样式：`rise` `fade` `scale` `blur` `left` `right` `drop`。退场沿进场方向继续走（升上来的就升出去），不会原路倒回 |
| `stagger(at, i, gap)` | 第 i 个元素的起始帧，用于错峰 |
| `springAt(f, at, kind)` | 弹簧：`soft` 无回弹、`snappy` 一点、`bouncy` 很多 |
| `drift(f, seed)` | 缓慢的有机漂移（CSS transform）。元素落定后加一点，就不会冻住 |
| `pulse(f, period)` | 0..1 的正弦呼吸 |
| `punch(f, at)` | 说到某个词时放大一下再回落 |
| `shake(f, at)` | 衰减的镜头震动（盖章、砸数字） |
| `noise(seed, x)` `rng(seed)` | 确定性的平滑噪声和随机数 |

```tsx
const {p, q} = life(f, c('cards'), c('formula'));      // 卡片在 formula 时离场
<At x={160} y={330} style={move('rise', p, q)}>…</At>
```

**跟旁白同步的字**（`Spoken.tsx`）

`<Spoken text="让旁白自己当时间轴" mode="blur" />` 让每个字在旁白念到它的那一帧出现，用的就是字幕的逐词时间，不再是固定的每秒几个字。`text` 必须是旁白里原样出现的一段（可以加 `\n` 换行）；找不到会抛错。`mode`：`rise` `blur` `fade` `scale` `drop` `pop`（弹出），或 `ink`（先显示暗字，念到才点亮）。`hot={['关键词']}` 让关键词念到时变色。`useSpoken().chars(text)` 返回每个字的帧，`span(text)` 返回整段 `[开始, 结束]`。film 的 `BigQuote` 加 `spoken` 就按引语的配音逐字出现。

**镜头和转场**（`shots.tsx`）

`Shots` 按 cue 切镜头，每个镜头自带本地时间 `t` 和长度 `d`。转场 `tr`：

| 转场 | 效果 |
|---|---|
| `fade` / `slow` | 叠化（12 / 26 帧）——两个相似的画面叠化会有重影，换别的 |
| `cut` / `flash` | 硬切 / 白闪切 |
| `black` | 先落到底色再出来 |
| `push` / `up` | 新镜头把旧镜头横向 / 向上推走 |
| `zoom` | 旧镜头冲过镜头，新镜头落定 |
| `wipe` | 带亮边的划像 |
| `whip` | 快速甩镜，带运动模糊 |
| `iris` | 新镜头从画面中心的圆里打开 |

`dur` 可以按镜头覆盖转场时长。`Shots` 原来在 film 包里，现在在 core，film 继续从原位置导出。

**几条动效原则**（多数来自整理 Opus 5.5 生成视频提示词的 [awesome-opus5-5-videos](https://github.com/yihui-dev/awesome-opus5-5-videos) 里反复出现的要求）：

- 不要死帧：超过 1 秒什么都不动，观众就会走神。落定的元素加 `drift`，背景自己带一点不停的动作。
- 能变形就别切：同一个形状改尺寸、圆角、颜色，内容跟着换（keynote 包的 `Morph`），比叠化到另一张图更连贯。
- 容器先动，内容后进；内容先走，容器再变。这样文字永远不会和下一个状态叠在一起。
- 弹簧只要一点点回弹；大回弹留给少数需要「砸」的时刻。
- 镜头跟着重点走：推近到正在讲的那一块（keynote 的 `ZoomCam`、film 的 `Cam`）。
- 每个画面变化都落在旁白的 cue 或词上；有配乐的片子，也可以落在节拍上。

**音效和节拍**（`Sfx.tsx`）

`<Sfx at={帧} name="pop" volume={0.6} />` 在本场某一帧播放 `public/sfx/pop.wav`；同一个声音打在多帧用 `<SfxAt frames={[...]} name="tick" />`。声音库：`click` `pop` `whoosh` `whip` `swish` `thud` `slam` `tick` `type` `coin` `levelup` `glitch` `chime` `draw`，都由 `python tools/sfx.py` 用 numpy 合成（改配方后重跑）。**放在场景最外层**，不要放进 `Shots` 的镜头里，镜头切走会把声音截断。`Shots` 会给移动类转场自动配声音（`push`/`up`/`zoom` 配 `whoosh`，`whip` 配 `whip`，`wipe`/`iris` 配 `swish`），`sfx={false}` 关掉。音效跟画面一起进渲染出来的音轨，`tools/mix.py` 再把配乐压在下面。

配乐（`tools/music.py`）在 `music.bpm` 的节拍网格上加了很轻的鼓点。场景里 `const beat = useBeat()`：`beat.next(帧)` 把事件吸附到下一拍，`beat.nearest(帧)` 吸附到最近一拍，`beat.pulse()` 每拍一次从 1 衰减到 0（neon 的地平线、pixel 小人原地踏步都用它）。

**审动态**：静帧只能看到元素落定后的样子，看不到它怎么动。`node tools/strip.mjs s01:quote` 把 cue 前 6 帧到后 84 帧、每 6 帧一张拼成一张图（`场景:cue:起:止:步长`，最多 16 格），一次渲染出结果，输出 `out/strips/<scene>_<cue>.png`。重点看三件事：cue 之后有没有一两秒什么都没有；元素是不是落定之后就再也不动；两个镜头叠化时有没有重影。

## 工作流

1. **写稿**：编辑 `tts/script.json`。
2. **合成**：`python tts/gen.py`（只重做某几场：`python tts/gen.py s02`；离线占位：`python tts/gen.py --mock`）。
3. **预览**：`npm run studio`。
4. **审图**：`node tools/stills.mjs s01 s02` 在每个 cue 后约 2.5 秒出一张图（`OFF=30 node tools/stills.mjs` 改偏移），`python tools/sheet.py s01` 拼成 2×2 的检查表；只看某几帧用 `node tools/pick.mjs s01:quote:40 s02:end:-10`（`场景:cue:偏移帧`，`end` 表示旁白结束）；看动态用 `node tools/strip.mjs s01:quote`（见「动效」）。输出在 `out/stills`、`out/sheets`、`out/pick`、`out/strips`。
   听音效：`node tools/listen.mjs s05` 渲染这一场的音轨，列出每个声音离哪个 cue 多少帧；看全片：`node tools/overview.mjs`（`--format 9x16` 看竖屏）。
5. **渲染**：`npm run render`（带 `--gl=angle`）→ `out/<id>.mp4`；竖屏 `npm run render -- 9x16` → `out/<id>-9x16.mp4`。
6. **配乐**：`python tools/music.py` → `out/music.wav`。按 timings 每场一段和声，每个章节开头一声轻击，重配音后重跑即可对齐。
7. **混音**：`python tools/mix.py` → `out/<id>-mixed.mp4`（竖屏 `python tools/mix.py 9x16`）。配乐低通后按旁白做 sidechain 压缩，再整体 `loudnorm=I=-16:TP=-1.5:LRA=11`。

第 2、5、6、7 步可以一条命令跑完：`node tools/publish.mjs`（`--formats 9x16,1x1` 或 `all` 同时出其他画幅，`--skip-tts` 沿用现有配音，`--mock` 离线跑通流程）。

## 画幅和品牌

场景永远按主画幅（1920×1080）写。竖屏和方屏由外壳排版：16:9 画面放在中间，上面是章节标题，下面是按行长自动放大的字幕，最底下一条全片进度条，背景用这一场风格包的底纹铺满。内容集中在画面中间的场景，可以在登记表里放大裁边：`s07: {component: S07, look: keynote, portrait: {zoom: 1.3}}`（`focus` 0–1 决定裁剪时保留哪一侧）。

换品牌色只改 `kit.config.json`：`"brand": {"name": "你的产品", "accent": "#FF5A1F", "accent2": "#7B61FF"}`，九套风格包的主色、副色一起换掉；单个颜色再用 `theme` 微调。每个包把哪些颜色当作主色，写在它调色板的 `themed()` 第三个参数里。

## 自动化和 skill

反复手动做的事都收成了脚本：

| 命令 | 做什么 |
|---|---|
| `node tools/new-scene.mjs s10 --look paper --chapter "…" --text "[[a]]……"` | 追加旁白、生成能直接跑的场景文件（每个 cue 一段跟着旁白出现的字）、登记、跑 mock 时间轴 |
| `node tools/new-pack.mjs chalk --base "#1F2B26" --accent "#F2C14E"` | 生成一个新风格包骨架：接好品牌色的调色板、会动的背景、章节卡、组件、Look |
| `node tools/publish.mjs --formats all` | 配音 → 各画幅渲染 → 配乐 → 混音 |
| `node tools/strip.mjs` / `overview.mjs` / `listen.mjs` | 审动态 / 看全片 / 听音效 |

`.claude/skills/` 里有四个项目 skill，在 Claude Code 里打开这个仓库就能用：`new-scene`（从文稿到一场）、`review`（审片清单）、`new-style-pack`（新风格包的要求）、`publish`（出片和踩过的坑）。

## 风格包

外壳 `src/core/Video.tsx` 按场景登记表里的 `look` 给每一场「穿衣服」：底色、背景层、画面上的叠加层（颗粒、暗角）、最上层的框（黑边）、章节卡、字幕样式。核心代码从不 import 风格包，不用的包整个删掉即可。

- **film**（`src/film/`）：`Shots` 按 cue 切镜头（转场见「动效」），`Cam` 缓推运镜（`hand` 加手持晃动），`Graded` 调色（past/warm/cold/dusk/neutral），`Grain`、`Vignette`、`Letterbox`（2.2:1），`Place` 年份地点字幕，`Tag`、`Line`、`BigQuote`，`Paper`、`Doc`、`Stamp`、`Mark`、`InkBars`、`Count`（`Doc` 的行可以 `strike: 帧号`，到时用红笔划掉），背景 `Sky`、`Glow`、`Void`、`Desk`，章节卡 `Chapter`。字幕放在下黑边里。
- **slides**（`src/slides/`）：`Panel`、`Chip`、`Kicker`、`H`，点阵背景和简单章节卡；字幕是半透明底条，按逐词时间点亮。
- **paper**（`src/paper/`）：手绘笔记。米色方格纸底；`RoughBox`、`RoughCircle`、`RoughArrow`、`RoughLine`、`Squiggle`、`LabelBox` 是会一笔一笔画出来的手绘线条（放在 `<Svg>` 里，`p` 是绘制进度），画完以后每 4 帧重抖一次（`BOIL`），像手绘动画那样不会僵住；`Note` 便利贴带回弹落下、可以 `out` 撕走；`Marker` 荧光笔；`Hand` 手写感标题。适合讲流程、因果。
- **neon**（`src/neon/`）：深色科技。会一直往镜头滚的透视网格地面、星空、扫描线；`Neon` 霓虹字（像灯管一样闪着亮起）；`Term` 终端窗口逐字敲命令；`Net` 节点图，节点带波纹弹出、连线画出后有数据脉冲一直流动；`Glitch` 包住整个镜头做故障切换；`Brackets` HUD 角框。适合讲系统、架构。
- **math**（`src/math/`）：数学推导，Manim 的路子。深色底；`Axes` 网格从原点展开、坐标轴画出来；`Plot` 把函数曲线一笔描上去；`Tangent` 切线和点贴着曲线走；`Readout` 实时数值；`Steps` 一行一行推导 KaTeX 公式，最新一步点亮、旧的变暗。坐标映射用 `Plane` + `px()`/`py()`。适合讲数学、物理。
- **keynote**（`src/keynote/`）：发布会 / 产品演示。暖灰底加缓慢漂移的色块；`Morph` 是贯穿全场的一个形状，按状态表在 logo、按钮、进度条、玻璃卡片之间弹簧变形，内容带短模糊切换；`Cursor` 光标滑到目标并点击（带按下和波纹）；`ZoomCam` 屏幕录制式推拉镜头；`Rise` 文字从遮罩线下升起。`chain()` 把多次改变的弹簧叠加起来，中途改目标也不会跳。适合讲产品、做功能演示。
- **pixel**（`src/pixel/`）：像素游戏。所有东西画在 320×180 的 canvas 上再无平滑放大 6 倍，连中文也先栅格化再二值化成硬像素。`drawWorld` 画天空、云、两层视差山和草地（`scroll` 跟随镜头）；`hero` 会走路的小人、`coin` 旋转金币、`bar` 分格经验条、`box` RPG 对话框；精灵用字符串画。场景里用 `<PixelCanvas draw={(g, f) => …}>` 逐帧画，对话框的字用 `useSpoken().chars()` 跟旁白出现。适合轻松科普、儿童向内容。
- **ink**（`src/ink/`）：水墨。宣纸底；`Mountains` 几层远山各自从雾里晕开（先模糊后清晰）并缓慢漂移，`Mist` 雾带，`Birds` 飞鸟；`Brush` 带飞白的毛笔笔触；`InkBlot` 墨滴在纸上洇开；`VText` 竖排文字（配 `Spoken` 念到哪里墨落到哪里，`\n` 换列）；`Seal` 红色印章按下。适合讲历史、诗词、传统文化。
- **editorial**（`src/editorial/`）：杂志排版 / 动态文字。新闻纸底色、黑红两色；`MaskText` 大标题逐行从遮罩下升起（也能逐行升出去）；`Slam` 大数字砸进画面，`hits` 在说到某个词时再顶一下；`Block` 色块推进来再从另一侧推出去（用来遮住换版）；`Rule` 画线；`Label` 小标签；`Ticker` 跑马灯。适合讲观点、金句、数据。

所有包共用 `src/core` 的 `At`（`center` 时居中位移会和你传入的 `transform` 叠加）、`Full`、`Svg`、`DrawLine`、`Tex`、`Shots`、`Spoken` 和动效函数。film 和 slides 的配色在 `src/core/theme.ts`，新包各自带调色板（`P`、`N`、`E`、`M`、`K`、`PX`、`I`）。

字幕样式由风格包的 `look.subtitles` 决定（浅色底的包用 `boxColor` 换成深色底条），单场可以在登记表里覆盖，例如 `s01: {component: S01, look: film, subtitles: {hideQuotes: true}}`：这一场已经把引语大字放在画面上，就不再给引语配字幕。

**选哪套**：叙事、人物用 film；概念、API 用 slides；流程、因果、拆解步骤用 paper；系统、架构、数据流用 neon；观点、金句、关键数字用 editorial；公式推导、函数图像用 math；产品介绍、操作演示用 keynote；轻松科普、儿童向用 pixel；历史、诗词、传统文化用 ink。同一支片子可以按场混用。

### 写一个新风格包

`node tools/new-pack.mjs <名字> --base <底色> --accent <主色>` 生成骨架，再照着 `src/paper/index.tsx` 这类成熟的包扩展：调色板走 `themed()`（品牌色才能替换）、背景带一点不停的小动作（滚动、闪烁、纸纹跳动）、章节卡、几个道具组件，最后导出一个 `Look`。道具只用 `useCurrentFrame()` 和传进来的帧号，不要用 `Math.random()`。要求清单见 `.claude/skills/new-style-pack/SKILL.md`。

## 加一个场景

最快：`node tools/new-scene.mjs s10 --look slides --chapter "第十场 · 标题" --text "[[a]]……[[b]]……"`，下面三步它都会做好。手动的话：

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
- **标题用 `Spoken` 等念到才出，前面那半句也会空**。「换一套衣服：手绘笔记风」里标题要等一秒多才念到。给开头那半句也配上字（演示片 s03–s05 的小标签），或者把标题提前放好、用 `mode="ink"` 念到再点亮。
- **相似画面别用 `fade` 转场**。两张纸、两组卡片叠化时会叠出重影；用 `push`，或者先让旧元素 `life(..., out)` 离场、再让新元素进场（演示片 s02）。
- **只看静帧审不出动效问题**。静帧默认在 cue 后 2.5 秒，那时一切都已落定。用 `tools/strip.mjs` 看 cue 前后一段。
- **没装 Remotion 自带浏览器的环境**（比如云端沙箱）：`tools/` 里的渲染脚本会自动用 `/opt/pw-browsers` 里预装的 headless shell，也可以设 `REMOTION_BROWSER=/path/to/chrome-headless-shell` 指定。
- **音效放进 `Shots` 的镜头里会被截断**：镜头一切走就卸载了。`<Sfx>` 放在场景最外层。
- **多了几个合成以后，直接 `remotion render src/index.ts` 会问你渲染哪一个**。用 `npm run render`（`tools/render.mjs`），它按 `kit.config.json` 选好合成和输出路径。
- **`zh-CN-YunyangNeural` 在 +6% 时只有约 3.3 字/秒**，听着拖。用它的话语速调到 +15% 左右。
- **`--mock` 的时间只是估算**（每字 1/4.2 秒），用来搭画面足够，但换成真配音后每个 cue 的位置都会变；按 cue 和词取帧的写法不受影响，写死的帧数会错位。
- **只重做某几场时，其他场沿用旧 timings**：`python tts/gen.py s02` 不会动 s01 的音频和时间。
- **cue 名 `end` 是保留的**（工具里表示旁白结束），`gen.py` 遇到会直接报错。
- **场景里别用 `Math.random()`**，要随机就用 film 包的 `rng(seed)` 或 Remotion 的 `random(seed)`。渲染是多进程逐帧并行的，同一帧必须画出同样的东西。
- **edge-tts 偶尔断线**，`gen.py` 每段会重试 10 次，间隔递增。

## English

explainer-kit is a Remotion template for narrated explainer videos. Narration lives in `tts/script.json` with inline markers: `[[cue]]` marks an animation/shot trigger, `||` inserts a dramatic pause, and `<<key|...>>` reads a quote with an alternate voice. `tts/gen.py` synthesizes each scene with edge-tts, records word boundaries and writes `public/audio/<scene>.mp3` plus `src/timings.json`. Scenes read frames through `useScene()` — `c('cue')`, `w('word')`, `rel('word', 'cue')` — so durations and animations follow the audio after any rewrite.

Quick start: `npm i && npm run studio` shows the bundled ~3 min, nine-scene demo (one scene per style pack), whose timings and silent audio were produced by `python tts/gen.py --mock` (no network; word times estimated from character count). `npm run fonts` downloads the Noto Sans SC / Noto Serif SC variable fonts (OFL) into `public/fonts/`; without them the stacks fall back to system fonts. All size, fps, voice, pace and font settings live in `kit.config.json`. Nine optional style packs are included: `film` (letterbox, grain, grade, cue-driven shots, paper props), `slides` (panels, chips, karaoke subtitles), `paper` (hand-drawn strokes that draw on and boil, sticky notes, highlighter), `neon` (scrolling grid floor, scanlines, glowing type, terminal, node graph with flowing pulses, glitch), `editorial` (masked kinetic headlines, slammed numbers, colour-block wipes, ticker), `math` (Manim-style axes, traced plots, sliding tangent, step-by-step TeX), `keynote` (one morphing shape, cursor clicks, liquid glass, screen-studio zoom), `pixel` (320×180 canvas upscaled with hard pixels, walking hero, coins, RPG dialog) and `ink` (ink-wash mountains bleeding through mist, brush strokes, vertical calligraphy, red seal). `src/core/motion.ts` holds a shared motion vocabulary (enter/exit with `life` + `move`, springs, idle `drift`, `punch`, `shake`), `<Spoken>` reveals on-screen text exactly as the narrator says it, and `Shots` cuts on cues with `fade`/`push`/`up`/`zoom`/`wipe`/`whip`/`iris`/`black`/`flash` transitions. Sound effects are synthesized by `tools/sfx.py` into `public/sfx/` and placed with `<Sfx at={frame} name="pop" />` (moving `Shots` transitions add their own); the score pulses on a `music.bpm` grid that scenes can follow with `useBeat()`. `brand.accent`/`accent2` in `kit.config.json` recolour every pack, `theme.<pack>` overrides single keys, and `formats` adds portrait (9:16) and square (1:1) compositions that lay the 16:9 picture out with a title band, large captions and a progress bar. `tools/publish.mjs` runs TTS → render (all formats) → score → mix in one go; `tools/new-scene.mjs` and `tools/new-pack.mjs` scaffold scenes and style packs; `.claude/skills/` holds Claude Code skills for writing a scene, reviewing, building a pack and publishing. Review with `tools/stills.mjs`, `tools/pick.mjs`, `tools/sheet.py`, `tools/strip.mjs` (a filmstrip of frames around a cue, to judge motion rather than end states), `tools/overview.mjs` (one frame per scene) and `tools/listen.mjs` (renders a range's audio and lists sound events by cue); render with `npm run render` (uses `--gl=angle`); add a synthesized score with `tools/music.py` and mix/normalize to -16 LUFS with `tools/mix.py`.

## License

MIT，见 `LICENSE`。Noto 字体不随仓库分发，由 `npm run fonts` 下载，遵循 SIL Open Font License。
