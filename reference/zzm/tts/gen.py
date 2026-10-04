"""Generate narration with edge-tts and a timing map for Remotion.

For each scene: strip [[cue]] markers, synthesize with WordBoundary events,
then map cues and subtitle lines onto audio timestamps.
Output: public/audio/<id>.mp3 and src/timings.json
"""
import asyncio
import json
import re
import subprocess
import sys
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parent.parent
ARGS = sys.argv[1:]
LANG = "en" if "--lang" in ARGS and ARGS[ARGS.index("--lang") + 1] == "en" else "zh"
ARGS = [a for a in ARGS if a not in ("--lang", "en", "zh")]
EN = LANG == "en"
SCRIPT = json.loads((ROOT / "tts" / ("script.en.json" if EN else "script.json")).read_text(encoding="utf-8"))
AUDIO_DIR = ROOT / "public" / "audio" / ("en" if EN else "")
AUDIO_DIR.mkdir(parents=True, exist_ok=True)
TIMINGS = ROOT / "src" / ("timings.en.json" if EN else "timings.json")

CUE_RE = re.compile(r"\[\[(\w+)\]\]")
BREAK_PUNCT = ",.;:?!" if EN else "，。！？；："
SENT_END = ".?!" if EN else "。！？"
MAX_LINE = 62 if EN else 20


TOKEN_RE = re.compile(r"\[\[(\w+)\]\]|\|\||<<(\w+)\||>>")


def parse(text):
    """Strip markers. [[cue]] = animation trigger, || = dramatic pause,
    <<key|...>> = spoken by voice SCRIPT["voices"][key] (a quote).
    Returns clean text, cue char offsets, and voice segments."""
    clean, cues, segs = "", {}, []
    cur = {"s": 0, "v": None, "pause": 0.0}
    pos = 0

    def close(newv):
        nonlocal cur
        cur["e"] = len(clean)
        segs.append(cur)
        cur = {"s": len(clean), "v": newv, "pause": 0.0}

    for m in TOKEN_RE.finditer(text):
        clean += text[pos:m.start()]
        pos = m.end()
        tok = m.group(0)
        if m.group(1):
            cues[m.group(1)] = len(clean)
        elif tok == "||":
            cur["pause"] += SCRIPT.get("pause", 0.7)
            close(cur["v"])
        elif tok == ">>":
            close(None)
        else:
            close(m.group(2))
    clean += text[pos:]
    close(None)
    # merge empty segments' pauses into the previous one
    out = []
    for sg in segs:
        if not clean[sg["s"]:sg["e"]].strip():
            if out:
                out[-1]["pause"] += sg["pause"]
            continue
        out.append(sg)
    return clean, cues, out


def split_lines(clean):
    """Greedy: split into clauses on punctuation, merge clauses up to MAX_LINE."""
    clauses, cur, start = [], "", 0
    for i, ch in enumerate(clean):
        cur += ch
        # English: only break on punctuation followed by a space (keeps 7.2 / 61,600 intact)
        if ch in BREAK_PUNCT and (not EN or i + 1 >= len(clean) or clean[i + 1] == " "):
            clauses.append((start, i + 1))
            start, cur = i + 1, ""
    if clean[start:].strip():
        clauses.append((start, len(clean)))
    lines = []
    for s, e in clauses:
        if lines and (e - lines[-1][0]) <= MAX_LINE and clean[lines[-1][1] - 1] not in SENT_END:
            lines[-1] = (lines[-1][0], e)
        else:
            lines.append((s, e))
    if EN:  # split over-long English lines at the space nearest the middle
        out = []
        for s, e in lines:
            while e - s > MAX_LINE:
                mid = s + (e - s) // 2
                sp = min((i for i in range(s + 1, e - 1) if clean[i] == " "), key=lambda i: abs(i - mid), default=None)
                if sp is None:
                    break
                out.append((s, sp))
                s = sp + 1
            out.append((s, e))
        lines = out
    # trim leading spaces so subtitle text starts clean
    trimmed = []
    for s, e in lines:
        while s < e and clean[s] == " ":
            s += 1
        trimmed.append((s, e))
    return trimmed


SR = 24000


def voice_of(key):
    if key is None:
        return SCRIPT["voice"], SCRIPT["rate"]
    v = SCRIPT["voices"][key]
    return v["voice"], v["rate"]


def decode(mp3_bytes):
    raw = subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-i", "pipe:0", "-f", "s16le", "-ac", "1", "-ar", str(SR), "pipe:1"],
        input=bytes(mp3_bytes), capture_output=True, check=True,
    ).stdout
    return raw


async def synth(text, key):
    voice, rate = voice_of(key)
    for attempt in range(10):
        try:
            com = edge_tts.Communicate(text, voice, rate=rate, boundary="WordBoundary")
            audio, words = bytearray(), []
            async for chunk in com.stream():
                if chunk["type"] == "audio":
                    audio.extend(chunk["data"])
                elif chunk["type"] == "WordBoundary":
                    words.append({"t": chunk["offset"] / 1e7, "d": chunk["duration"] / 1e7, "w": chunk["text"]})
            if not audio:
                raise RuntimeError("empty audio")
            return decode(audio), words
        except Exception as e:  # network flakiness
            print(f"  retry {attempt + 1}: {e}", file=sys.stderr)
            await asyncio.sleep(3 + attempt * 3)
    raise RuntimeError(f"TTS failed: {text[:20]}")


def duration(path):
    out = subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)]
    )
    return float(out.strip())


def align(clean, words):
    """Attach a char offset to each word by scanning forward through clean text."""
    ptr, aligned = 0, []
    for w in words:
        idx = clean.find(w["w"], ptr)
        if idx == -1 or idx - ptr > 12:
            continue
        aligned.append({**w, "s": idx, "e": idx + len(w["w"])})
        ptr = idx + len(w["w"])
    return aligned


def time_at(aligned, char_idx, fallback):
    for w in aligned:
        if w["e"] > char_idx:
            return w["t"]
    return fallback


async def main():
    only = set(ARGS)
    tpath = TIMINGS
    old = json.loads(tpath.read_text(encoding="utf-8")) if tpath.exists() else {}
    result = {}
    for sc in SCRIPT["scenes"]:
        sid = sc["id"]
        mp3 = AUDIO_DIR / f"{sid}.mp3"
        if only and sid not in only and sid in old:
            result[sid] = old[sid]
            continue
        clean, cues, segs = parse(sc["text"])
        print(f"{sid}: {len(clean)} chars, {len(segs)} segments", file=sys.stderr)
        pcm, aligned, nwords, offset, lines = bytearray(), [], 0, 0.0, []
        for sg in segs:
            raw, words = await synth(clean[sg["s"]:sg["e"]], sg["v"])
            nwords += len(words)
            seg_aligned = [{**w, "t": w["t"] + offset, "s": w["s"] + sg["s"], "e": w["e"] + sg["s"]}
                           for w in align(clean[sg["s"]:sg["e"]], words)]
            aligned += seg_aligned
            seg_dur = len(raw) / 2 / SR
            sub = clean[sg["s"]:sg["e"]]
            for s, e in split_lines(sub):
                s, e = s + sg["s"], e + sg["s"]
                lw = [{"t": round(w["t"], 3), "s": w["s"] - s, "e": w["e"] - s} for w in seg_aligned if s <= w["s"] < e]
                st = lw[0]["t"] if lw else offset
                ln = {"text": clean[s:e], "start": round(st, 3), "words": lw, "segEnd": round(offset + seg_dur, 3)}
                if sg["v"]:
                    ln["q"] = sg["v"]
                lines.append(ln)
            pcm += raw
            offset += seg_dur
            if sg["pause"]:
                pcm += bytes(int(sg["pause"] * SR) * 2)
                offset += sg["pause"]
        subprocess.run(
            ["ffmpeg", "-loglevel", "error", "-y", "-f", "s16le", "-ar", str(SR), "-ac", "1", "-i", "pipe:0",
             "-c:a", "libmp3lame", "-b:a", "96k", str(mp3)],
            input=bytes(pcm), check=True,
        )
        dur = duration(mp3)
        for i, ln in enumerate(lines):
            nxt = lines[i + 1]["start"] if i + 1 < len(lines) else round(dur, 3)
            # don't hold a subtitle through a dramatic pause
            ln["end"] = round(min(nxt, ln.pop("segEnd") + 0.25), 3)
        result[sid] = {
            "chapter": sc["chapter"],
            "duration": round(dur, 3),
            "cues": {k: round(time_at(aligned, v, dur), 3) for k, v in cues.items()},
            "lines": lines,
            "aligned": len(aligned),
            "words": nwords,
        }
    tpath.write_text(json.dumps(result, ensure_ascii=False, indent=1), encoding="utf-8")
    total = sum(v["duration"] for v in result.values())
    for sid, v in result.items():
        print(f"{sid} {v['duration']:6.1f}s  aligned {v['aligned']}/{v['words']}  cues {len(v['cues'])}")
    print(f"TOTAL {total:.1f}s ({total/60:.1f} min)")


asyncio.run(main())
