"""Shared by the Python tools: config, timings and the same frame math as src/core/timeline.ts."""
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CFG = json.loads((ROOT / "kit.config.json").read_text(encoding="utf-8"))
FPS = CFG["fps"]


def timings():
    return json.loads((ROOT / "src" / "timings.json").read_text(encoding="utf-8"))


def lead_of(sid):
    return CFG["pace"].get("leadOverride", {}).get(sid, CFG["pace"]["lead"])


def tail_of(sid):
    return CFG["pace"].get("tailOverride", {}).get(sid, CFG["pace"]["tail"])


def scene_frames(T, sid):
    return lead_of(sid) + math.ceil(T[sid]["duration"] * FPS) + tail_of(sid)


def scene_spans(T):
    """[(id, start_sec, narration_start_sec, narration_end_sec, end_sec)] in video order."""
    out, acc = [], 0
    for sid in T:
        n = scene_frames(T, sid)
        narr0 = acc + lead_of(sid)
        narr1 = narr0 + math.ceil(T[sid]["duration"] * FPS)
        out.append((sid, acc / FPS, narr0 / FPS, narr1 / FPS, (acc + n) / FPS))
        acc += n
    return out


def wav_bytes(pcm: bytes, rate: int, channels: int = 1, width: int = 2) -> bytes:
    """A PCM WAV file with a LIST/INFO chunk between "fmt " and "data".

    Python's wave module writes the minimal 44-byte header (data right after fmt). Remotion 4.0.532 on Windows crashes
    the whole render when it pulls such a file in as <Audio> (the error surfaces only as "kill EBADF"); the same samples
    with an INFO chunk — what ffmpeg writes — render fine. So every WAV the scenes play is written through here.
    """
    import struct

    tag = b"explainer-kit\x00"
    info = b"INFO" + b"ISFT" + struct.pack("<I", len(tag)) + tag
    fmt = b"fmt " + struct.pack("<IHHIIHH", 16, 1, channels, rate, rate * channels * width, channels * width, width * 8)
    body = b"WAVE" + fmt + b"LIST" + struct.pack("<I", len(info)) + info + b"data" + struct.pack("<I", len(pcm)) + pcm
    if len(pcm) % 2:
        body += b"\x00"
    return b"RIFF" + struct.pack("<I", len(body)) + body
