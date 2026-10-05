import re
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def test_sfx_names_match_recipes_and_files():
    """the names scenes may use (src/core/Sfx.tsx), the synth recipes (tools/sfx.py) and public/sfx/*.wav agree"""
    ts = (ROOT / "src" / "core" / "Sfx.tsx").read_text(encoding="utf-8")
    names = re.findall(r"'(\w+)'", re.search(r"export const SFX = \[(.*?)\]", ts).group(1))
    py = (ROOT / "tools" / "sfx.py").read_text(encoding="utf-8")
    recipes = re.findall(r'^\s+"(\w+)": \w+,$', re.search(r"SOUNDS = \{(.*?)\n\}", py, re.S).group(1), re.M)
    assert sorted(names) == sorted(recipes)
    for n in names:
        p = ROOT / "public" / "sfx" / f"{n}.wav"
        assert p.exists(), f"{p} missing — run python tools/sfx.py"
        with wave.open(str(p)) as w:
            assert w.getnframes() > 0


def test_scenes_only_use_known_sfx():
    ts = (ROOT / "src" / "core" / "Sfx.tsx").read_text(encoding="utf-8")
    names = set(re.findall(r"'(\w+)'", re.search(r"export const SFX = \[(.*?)\]", ts).group(1)))
    for f in (ROOT / "src" / "scenes").glob("*.tsx"):
        used = set(re.findall(r'name="(\w+)"', f.read_text(encoding="utf-8")))
        assert used <= names, f"{f.name} uses unknown sounds {used - names}"
