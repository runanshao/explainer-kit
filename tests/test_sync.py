"""The film is reproducible only if every derived file matches its source. These checks fail fast when they drift."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CUE = re.compile(r"\[\[(\w+)\]\]")


def load():
    script = json.loads((ROOT / "tts" / "script.json").read_text(encoding="utf-8"))["scenes"]
    timings = json.loads((ROOT / "src" / "timings.json").read_text(encoding="utf-8"))
    return script, timings


def test_timings_match_script():
    """src/timings.json is generated from tts/script.json — same scenes, order, chapters and cues (else rerun tts/gen.py)"""
    script, timings = load()
    assert [s["id"] for s in script] == list(timings), "scene list/order differs: rerun python tts/gen.py (--mock)"
    for s in script:
        t = timings[s["id"]]
        assert t["chapter"] == s["chapter"], f"{s['id']}: chapter changed since the last tts/gen.py run"
        assert set(CUE.findall(s["text"])) == set(t["cues"]), f"{s['id']}: cues changed since the last tts/gen.py run"


def test_audio_files_exist():
    _, timings = load()
    for sid, t in timings.items():
        assert (ROOT / "public" / t["audio"]).exists(), f"{sid}: public/{t['audio']} missing"


def test_every_scene_is_registered():
    """a scene in the script but not in src/scenes/index.ts renders as empty frames"""
    script, _ = load()
    reg = (ROOT / "src" / "scenes" / "index.ts").read_text(encoding="utf-8")
    registered = set(re.findall(r"^\s+(\w+): \{component:", reg, re.M))
    missing = [s["id"] for s in script if s["id"] not in registered]
    assert not missing, f"not registered in src/scenes/index.ts: {missing}"
