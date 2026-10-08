"""Mix the music under the narration, ducking it with a sidechain, then master to the loudness target.

    python tools/mix.py                       # out/<id>.mp4 + out/music.wav → out/<id>-mixed.mp4
    python tools/mix.py 9x16                  # out/<id>-9x16.mp4 → out/<id>-9x16-mixed.mp4 (a kit.config.json format)
    python tools/mix.py VIDEO MUSIC OUTPUT    # explicit paths

<id> is the composition id from kit.config.json (what `npm run render` writes by default).
Loudness: kit.config.json "loudness" ({"target": -16, "ceiling": -2.0}); a format can override it, e.g.
"9x16": {..., "loudness": -14} for short-video platforms. Mastering is two-pass and linear (tools/master.py) and the
true peak is checked on the encoded file. edge-tts output sits around -24 LUFS, so always run this before publishing.
"""
import sys

from kit import CFG, ROOT
from master import master

sys.stdout.reconfigure(encoding="utf-8")  # Windows consoles default to cp1252 when output is redirected

FILTER = (
    "[1:a]lowpass=f=2400,volume=0.55[m];"
    "[m][0:a]sidechaincompress=threshold=0.02:ratio=5:attack=60:release=800[md];"
    "[0:a][md]amix=inputs=2:duration=first:normalize=0[a]"
)


def main(argv):
    out_dir = ROOT / "out"
    name = CFG["id"]
    loud = {"target": -16, "ceiling": -2.0, **CFG.get("loudness", {})}
    if argv and argv[0] in CFG.get("formats", {}):
        fmt = argv.pop(0)
        name = f"{name}-{fmt}"
        if "loudness" in CFG["formats"][fmt]:
            loud["target"] = CFG["formats"][fmt]["loudness"]
    video = argv[0] if len(argv) > 0 else str(out_dir / f"{name}.mp4")
    music = argv[1] if len(argv) > 1 else str(out_dir / "music.wav")
    output = argv[2] if len(argv) > 2 else str(out_dir / f"{name}-mixed.mp4")
    print(f"mix {video} + {music} → {output} at {loud['target']} LUFS")
    master(video, FILTER, [music], output, loud["target"], loud["ceiling"])
    print(output)


if __name__ == "__main__":
    main(sys.argv[1:])
