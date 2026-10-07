"""The promo is reproducible and shippable only if its beat grid, scene registry, sounds and copy agree."""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))

from copy_lint import default_files, lint_text, strings_of  # noqa: E402

TRANSITIONS = {"cut", "iris", "wipe", "flood", "up"}
ENERGIES = {"intro", "groove", "break", "build", "drop"}
POS = re.compile(r"^(\d+):(\d+(?:\.\d+)?)$")


def promo():
    return json.loads((ROOT / "promo" / "promo.json").read_text(encoding="utf-8"))


def test_grid_is_well_formed():
    """every scene is a whole number of beats; cues are bar:beat positions inside their scene; known energy/transition"""
    p = promo()
    assert p["bpm"] > 0 and p["width"] > 0 and p["height"] > 0
    ids = [s["id"] for s in p["scenes"]]
    assert len(ids) == len(set(ids)), "duplicate scene ids"
    for s in p["scenes"]:
        beats = s["bars"] * 4
        assert abs(beats - round(beats)) < 1e-9, f"{s['id']}: {s['bars']} bars is not a whole number of beats"
        assert s["energy"] in ENERGIES, f"{s['id']}: energy {s['energy']!r} (tools/score.py knows {sorted(ENERGIES)})"
        if "in" in s:
            assert s["in"]["tr"] in TRANSITIONS, f"{s['id']}: transition {s['in']['tr']!r}"
            assert s["in"].get("beats", 0.5) <= beats, f"{s['id']}: transition longer than the scene"
        for name, pos in s["cues"].items():
            m = POS.match(pos)
            assert m, f"{s['id']}.{name}: {pos!r} is not bar:beat"
            at = int(m.group(1)) * 4 + float(m.group(2))
            assert 0 <= at < beats, f"{s['id']}.{name} at beat {at} is outside the scene ({beats} beats)"


def test_every_promo_scene_is_registered():
    reg = (ROOT / "src" / "promo" / "scenes" / "index.ts").read_text(encoding="utf-8")
    registered = set(re.findall(r"(\w+): P\d+", reg))
    missing = [s["id"] for s in promo()["scenes"] if s["id"] not in registered]
    assert not missing, f"not registered in src/promo/scenes/index.ts: {missing}"


def test_promo_scenes_only_use_known_sfx():
    ts = (ROOT / "src" / "core" / "Sfx.tsx").read_text(encoding="utf-8")
    names = set(re.findall(r"'(\w+)'", re.search(r"export const SFX = \[(.*?)\]", ts).group(1)))
    for f in (ROOT / "src" / "promo").rglob("*.tsx"):
        used = set(re.findall(r'name="(\w+)"', f.read_text(encoding="utf-8")))
        assert used <= names, f"{f.name} uses unknown sounds {used - names}"


def test_promo_copy_has_no_absolute_claims():
    """广告法 第九条: no 最佳/第一/唯一/100% in ad copy (tools/copy_lint.py)"""
    for f in default_files():
        assert not lint_text(strings_of(f)), f"{f.name}: {lint_text(strings_of(f))}"


def test_copy_lint_catches_and_spares():
    assert [w for w, _ in lint_text("全城最好的水果，销量第一，唯一正品")] == ["最好", "第一", "唯一"]
    assert not lint_text("第一场 第一次 第一步 第一章")
    assert not lint_text("不唯一")


def test_scene_wavs_have_an_info_chunk():
    """Remotion 4.0.532 on Windows crashes on minimal-header WAVs (data right after fmt); see tools/kit.py wav_bytes"""
    for f in list((ROOT / "public").rglob("*.wav")):
        head = f.read_bytes()[:96]
        assert b"LIST" in head, f"{f.relative_to(ROOT)} has no LIST chunk — write it with wav_bytes() (tools/kit.py)"
