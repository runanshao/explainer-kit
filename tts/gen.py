"""Narration → audio + timing map for Remotion.

For each scene in tts/script.json: strip the markers, synthesize each voice segment with edge-tts
(recording WordBoundary events), then map cues and subtitle lines onto audio timestamps.

Output: public/audio/<scene>.mp3 (or .wav with --mock) and src/timings.json

    python tts/gen.py                 # all scenes, real edge-tts (needs network + ffmpeg)
    python tts/gen.py s02             # only s02; other scenes keep their old timings
    python tts/gen.py --mock          # no network: word times estimated from character count,
                                      # silent .wav written with the stdlib wave module
    python tts/gen.py --mock --cps 5  # override chars/sec for the estimate

Voices, rate, pause length and line length come from kit.config.json.
"""
from __future__ import annotations

import asyncio
import json
import re
import subprocess
import sys
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SR = 24000

TOKEN_RE = re.compile(r"\[\[(\w+)\]\]|\|\||<<(\w+)\||>>")
BREAK_PUNCT = "，。！？；：,;:?!"
SENT_END = "。！？?!"


def parse(text: str, pause: float = 0.75):
    """Strip markers from narration.

    [[cue]]      animation trigger: records the char offset where it sits in the clean text
    ||           dramatic pause of `pause` seconds (also ends the current voice segment)
    <<key|...>>  the enclosed text is read by the alternate voice `key` (a quote)

    Returns (clean_text, cues, segments). cues maps name → char offset in clean_text.
    Each segment is {"s", "e", "v", "pause"}: a char range of clean_text, its voice key
    (None = narrator) and the silence to insert after it.
    """
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
            cur["pause"] += pause
            close(cur["v"])
        elif tok == ">>":
            close(None)
        else:
            close(m.group(2))
    clean += text[pos:]
    close(None)
    # drop empty segments, carrying their pause over to the previous one
    out = []
    for sg in segs:
        if not clean[sg["s"]:sg["e"]].strip():
            if out:
                out[-1]["pause"] += sg["pause"]
            continue
        out.append(sg)
    return clean, cues, out


def split_lines(clean: str, max_line: int = 20):
    """Subtitle lines as (start, end) char ranges.

    Split into clauses at punctuation, then greedily merge clauses while the line stays within
    `max_line` characters and the previous clause did not end a sentence.
    """
    clauses, start = [], 0
    for i, ch in enumerate(clean):
        if ch in BREAK_PUNCT:
            clauses.append((start, i + 1))
            start = i + 1
    if clean[start:].strip():
        clauses.append((start, len(clean)))
    lines = []
    for s, e in clauses:
        if lines and (e - lines[-1][0]) <= max_line and clean[lines[-1][1] - 1] not in SENT_END:
            lines[-1] = (lines[-1][0], e)
        else:
            lines.append((s, e))
    out = []
    for s, e in lines:
        while s < e and clean[s] == " ":
            s += 1
        if s < e:
            out.append((s, e))
    return out


def align(clean: str, words):
    """Attach a char offset to each TTS word by scanning forward through the clean text."""
    ptr, aligned = 0, []
    for w in words:
        idx = clean.find(w["w"], ptr)
        if idx == -1 or idx - ptr > 12:
            continue
        aligned.append({**w, "s": idx, "e": idx + len(w["w"])})
        ptr = idx + len(w["w"])
    return aligned


def time_at(aligned, char_idx: int, fallback: float) -> float:
    for w in aligned:
        if w["e"] > char_idx:
            return w["t"]
    return fallback


MOCK_TOKEN_RE = re.compile(r"[A-Za-z0-9]+(?:[.'][A-Za-z0-9]+)*|\S")


def mock_synth(text: str, cps: float):
    """Offline stand-in for edge-tts: every non-space character takes 1/cps seconds.
    Punctuation takes time but is not reported as a word (like edge-tts). Returns (pcm, words)."""
    step = 1.0 / cps
    t, words = 0.0, []
    for m in MOCK_TOKEN_RE.finditer(text):
        tok = m.group(0)
        if tok[0].isalnum():  # CJK characters count as alnum; punctuation does not
            words.append({"t": round(t, 3), "d": round(len(tok) * step, 3), "w": tok})
        t += len(tok) * step
    return bytes(int(t * SR) * 2), words


def build_scene(sc, synth, pause: float, max_line: int):
    """Synthesize one scene with `synth(text, voice_key) -> (pcm_s16le_mono, words)`.
    Returns (pcm, partial timing dict without duration/audio)."""
    clean, cues, segs = parse(sc["text"], pause)
    pcm, aligned, nwords, offset, lines = bytearray(), [], 0, 0.0, []
    for sg in segs:
        sub = clean[sg["s"]:sg["e"]]
        raw, words = synth(sub, sg["v"])
        nwords += len(words)
        seg_aligned = [{**w, "t": w["t"] + offset, "s": w["s"] + sg["s"], "e": w["e"] + sg["s"]} for w in align(sub, words)]
        aligned += seg_aligned
        seg_dur = len(raw) / 2 / SR
        for s, e in split_lines(sub, max_line):
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
    return pcm, {"clean": clean, "cues": cues, "aligned": aligned, "nwords": nwords, "lines": lines}


def finish_scene(sc, built, dur: float, audio: str):
    lines = built["lines"]
    for i, ln in enumerate(lines):
        nxt = lines[i + 1]["start"] if i + 1 < len(lines) else round(dur, 3)
        # don't hold a subtitle through a dramatic pause
        ln["end"] = round(min(nxt, ln.pop("segEnd") + 0.25), 3)
    return {
        "chapter": sc["chapter"],
        "duration": round(dur, 3),
        "audio": audio,
        "cues": {k: round(time_at(built["aligned"], v, dur), 3) for k, v in built["cues"].items()},
        "lines": lines,
        "aligned": len(built["aligned"]),
        "words": built["nwords"],
    }


def write_wav(path: Path, pcm: bytes):
    with wave.open(str(path), "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        wf.writeframes(bytes(pcm))


# ───────────────────────── real edge-tts ─────────────────────────

def edge_synth_factory(cfg):
    import edge_tts  # only needed for real synthesis

    def voice_of(key):
        if key is None:
            return cfg["voice"], cfg["rate"]
        v = cfg["voices"][key]
        return v["voice"], v["rate"]

    def decode(mp3_bytes):
        return subprocess.run(
            ["ffmpeg", "-loglevel", "error", "-i", "pipe:0", "-f", "s16le", "-ac", "1", "-ar", str(SR), "pipe:1"],
            input=bytes(mp3_bytes), capture_output=True, check=True,
        ).stdout

    async def synth_async(text, key):
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

    return lambda text, key: asyncio.run(synth_async(text, key))


def encode_mp3(path: Path, pcm: bytes):
    subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-y", "-f", "s16le", "-ar", str(SR), "-ac", "1", "-i", "pipe:0",
         "-c:a", "libmp3lame", "-b:a", "96k", str(path)],
        input=bytes(pcm), check=True,
    )
    out = subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)])
    return float(out.strip())


# ───────────────────────── main ─────────────────────────

def main(argv):
    cfg = json.loads((ROOT / "kit.config.json").read_text(encoding="utf-8"))
    script = json.loads((ROOT / "tts" / "script.json").read_text(encoding="utf-8"))
    mock = "--mock" in argv
    cps = float(cfg.get("mockCharsPerSec", 4.2))
    only = set()
    it = iter(argv)
    for a in it:
        if a == "--cps":
            cps = float(next(it))
        elif not a.startswith("--"):
            only.add(a)
    pause = float(cfg.get("pause", 0.75))
    max_line = int(cfg.get("maxLine", 20))

    audio_dir = ROOT / "public" / "audio"
    audio_dir.mkdir(parents=True, exist_ok=True)
    tpath = ROOT / "src" / "timings.json"
    old = json.loads(tpath.read_text(encoding="utf-8")) if tpath.exists() else {}
    synth = (lambda text, key: mock_synth(text, cps)) if mock else edge_synth_factory(cfg)

    result = {}
    for sc in script["scenes"]:
        sid = sc["id"]
        if only and sid not in only and sid in old:
            result[sid] = old[sid]
            continue
        pcm, built = build_scene(sc, synth, pause, max_line)
        if "end" in built["cues"]:
            sys.exit(f"{sid}: cue name 'end' is reserved (tools use it for end of narration); rename it")
        print(f"{sid}: {len(built['clean'])} chars{' (mock)' if mock else ''}", file=sys.stderr)
        if mock:
            path = audio_dir / f"{sid}.wav"
            write_wav(path, pcm)
            dur = len(pcm) / 2 / SR
        else:
            path = audio_dir / f"{sid}.mp3"
            dur = encode_mp3(path, pcm)
        result[sid] = finish_scene(sc, built, dur, f"audio/{path.name}")

    tpath.write_text(json.dumps(result, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    total = sum(v["duration"] for v in result.values())
    for sid, v in result.items():
        print(f"{sid} {v['duration']:6.1f}s  aligned {v['aligned']}/{v['words']}  cues {len(v['cues'])}  {v['audio']}")
    print(f"TOTAL narration {total:.1f}s ({total / 60:.1f} min) -> {tpath.relative_to(ROOT).as_posix()}")


if __name__ == "__main__":
    main(sys.argv[1:])
