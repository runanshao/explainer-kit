# TASK: turn `reference/` into a clean, reusable explainer-video template

## Background

`reference/` holds the generic parts of a Remotion explainer-video pipeline that has been copy-pasted across 7 projects:

- `reference/zzm/` — the most recent project (cinematic style: letterbox, grain, color grade, cue-driven shot switching). Only 2 sample scenes and the s01 narration are kept. Read its `README.md` first: it documents the pipeline.
- `reference/ontology/` — an earlier project (slide/whiteboard style) whose only extra worth keeping is the KaTeX `Tex` component in `src/lib.tsx` (scene `D.tsx` shows usage).
- `reference/fx/` — grain and paper textures.

The pipeline: narration lives in `tts/script.json` with inline markers (`[[cue]]` shot/animation trigger, `||` dramatic pause, `<<key|...>>` alternate voice for quotes). `tts/gen.py` calls edge-tts, records WordBoundary events and writes `public/audio/<scene>.mp3` + `src/timings.json` (per-scene duration, cue seconds, subtitle lines with per-word times). Scenes read timings through `useScene()` → `c('cue')` (frame of a cue), `w('word')` (frame when a word is spoken), `rel('word','cue')`. Durations follow the audio automatically, so rewriting narration never requires re-timing animations by hand.

## Deliverable

A template repo at the repo root that someone can clone, run `npm i`, `npm run studio`, and see a working ~60-second demo video, then replace the demo with their own scenes.

1. **One config file** (`kit.config.json` or similar) for composition id, size, fps, default voice/rate, alternate voices, pause length, fonts. `Root.tsx`, `tools/*.mjs`, `tts/gen.py` must all read it. Nothing hardcodes `ZhangZhongmou`.
2. **Core** (style-agnostic): timeline helpers (`useScene`, `c`, `w`, `rel`, `ease`, `pop`, `fu`, `lerp`, `window_`), pace (`lead`/`tail` per scene), the `Video` shell (scene sequencing, chapter card, audio, subtitles, font loading via `delayRender`), layout helpers (`At`, `Full`, `Svg`, `DrawLine`), `Tex` (KaTeX).
3. **Two style packs**, each optional: `film` (Letterbox, Grain, Vignette, Graded, Shots, Cam, Place, BigQuote, Paper, Stamp, Chapter) and `slides` (Panel, Chip, Kicker, H, simple chapter card). Strip subject-specific art (Morris Chang silhouettes, TSMC chessboard, Taiwan strait, `SIDE`/`CARD` constants). Keep generic primitives from `art.tsx`/`sets.tsx`/`props.tsx` only if they are clearly reusable (sky gradient, paper document, stamp, bar chart); drop the rest.
4. **Fix the known inconsistencies**: `lib.tsx` references theme tokens that do not exist in the zzm theme (`C.orange`, `C.panel`, `C.panelLine`, `C.teal`, `C.bg`). `At center` must compose its centering translate with the caller's `transform` (zzm version already does — keep that). `npx tsc --noEmit` must pass with zero errors.
5. **`tts/gen.py`**: keep edge-tts behavior and marker syntax. Add `--mock`: no network; estimate word times from character count (configurable chars/sec, default 4.2 for Chinese), write silent audio with the stdlib `wave` module (`.wav`; the Video shell must accept either extension), and produce a valid `timings.json`. Factor `parse()` so it is importable and add `tests/test_parse.py` (pytest) covering cues, `||`, `<<key|...>>`, and line splitting.
6. **Demo**: 2 scenes, ~60 s total, original Chinese narration (topic: how this template works — markers, cues, timing). Scene 1 uses the `film` pack, scene 2 the `slides` pack with one `Tex` formula. Demonstrate `c()`, `w()`, `rel()`, `||` and one `<<key|...>>` quote. Commit the mock `timings.json` and mock audio so `npm run studio` works with no TTS run.
7. **Tools** (all read the config): `tools/stills.mjs` (bundle once, a still per cue + offset, `OFF` env), `tools/pick.mjs` (`scene:cue:offset`), `tools/sheet.py` (2×2 contact sheet), `tools/music.py` (synthesized pad; remove the zzm-specific act/scene map and drive it from timings: one section per scene, a soft hit at each chapter start), `tools/mix.py` (wraps the ffmpeg sidechain + `loudnorm=I=-16:TP=-1.5:LRA=11` recipe from the zzm README). `npm run fonts` downloads Noto Sans SC / Noto Serif SC variable fonts (OFL) into `public/fonts/` (gitignored); font stacks must fall back to system fonts when they are absent.
8. **Docs**: `README.md` in Chinese (quick start; marker syntax; timing API with a small example; workflow: script → tts → studio → stills/sheet review → render → music → mix; style packs; how to add a scene). Include a "踩过的坑" section built from the zzm README and these notes: render with `--gl=angle` (software GL is ~5× slower); renders over ~10 min should be detached (nohup) and watched via the log, not a timed-out background shell; edge-tts raw output is about -24 LUFS so always run mix/loudnorm before publishing; if a scene's first cue is late the scene opens on 3–6 s of empty frame; `zh-CN-YunyangNeural` speaks only ~3.3 chars/s at +6%, use about +15%. Add a short English section at the end. `LICENSE` MIT.
9. **CI**: a GitHub Action running `npm ci`, `npx tsc --noEmit`, `python tts/gen.py --mock`, `pytest`.
10. Delete `reference/` and this `TASK.md` in the final commit.

## Verification you must run in the sandbox (paste the real output in the PR body)

- `npx tsc --noEmit`
- `python tts/gen.py --mock` then `pytest`
- Try `npx remotion still` on 2–3 frames of the demo. If Chromium download or rendering is blocked by the sandbox network policy, say so explicitly in the PR body — do not claim it rendered. Real render verification will be done locally on Windows afterwards.

## Out of scope

No real edge-tts calls are required. No npm publishing, no `create-*` scaffolder, no HyperFrames port. Do not add features beyond this list.

## Output

Work on a branch, open a PR against `main`. PR body: what was kept/dropped from `reference/` and why, verification output, anything left undone.
