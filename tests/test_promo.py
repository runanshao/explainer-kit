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


def test_packs_list_matches_style_packs_on_disk():
    """PACKS (src/promo/scenes/common.tsx) is what the promo counts and shows; it must be every pack in src/, no more"""
    on_disk = {d.name for d in (ROOT / "src").iterdir() if (d / "index.tsx").exists() and re.search(rf"export const {d.name}: Look\b", (d / "index.tsx").read_text(encoding="utf-8"))}
    listed = re.findall(r"\{key: '(\w+)'", (ROOT / "src" / "promo" / "scenes" / "common.tsx").read_text(encoding="utf-8"))
    assert len(listed) == len(set(listed)), f"PACKS lists a pack twice: {listed}"
    assert set(listed) == on_disk, f"PACKS is missing {sorted(on_disk - set(listed))}, or lists packs that do not exist {sorted(set(listed) - on_disk)}"


COUNTS = re.compile(
    r"[零一二两三四五六七八九十\d]+\s*套"  # 九套风格包
    r"|\b\d+\s+OF\s+\d+\b"  # 06 OF 09
    r"|\b(?:ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN|ELEVEN|TWELVE)\s+(?:LOOKS|PACKS|STYLES)\b",
    re.I,
)


def test_promo_copy_counts_come_from_data():
    """a count typed into the copy goes stale the day a pack is added; derive it (PACKS.length, zhNum, enNum, pad2)"""
    for f in sorted((ROOT / "src" / "promo" / "scenes").glob("*.tsx")):
        code = re.sub(r"/\*.*?\*/|//[^\n]*", "", f.read_text(encoding="utf-8"), flags=re.S)
        hits = [h for h in COUNTS.findall(code) if h != "一套"]  # 「挑一套风格」 is a choice, not a count
        assert not hits, f"{f.name}: hard-coded count(s) {hits} — derive them from PACKS"


def test_safe_area_and_cover_are_well_formed():
    p = promo()
    s = p.get("safe")
    assert s, "promo.json needs a \"safe\" area (where the app's UI leaves the video visible)"
    assert 0 <= s["top"] < s["bottom"] <= p["height"] and s["left"] + s["right"] < p["width"]
    if "rail" in s:
        assert s["left"] < s["rail"]["left"] < p["width"] - s["right"] and s["top"] <= s["rail"]["top"] < s["bottom"]
    scene, cue = p["cover"].split(":")
    sc = {x["id"]: x for x in p["scenes"]}
    assert scene in sc and cue in sc[scene]["cues"], f"cover {p['cover']!r} is not a scene:cue of promo.json"
