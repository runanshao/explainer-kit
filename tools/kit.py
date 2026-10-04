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
