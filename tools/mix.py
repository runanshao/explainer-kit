"""Mix the music under the narration, ducking it with a sidechain, and loudness-normalize to -16 LUFS.

    python tools/mix.py                       # out/<id>.mp4 + out/music.wav → out/<id>-mixed.mp4
    python tools/mix.py 9x16                  # out/<id>-9x16.mp4 → out/<id>-9x16-mixed.mp4 (a kit.config.json format)
    python tools/mix.py VIDEO MUSIC OUTPUT    # explicit paths

<id> is the composition id from kit.config.json (what `npm run render` writes by default).
edge-tts output sits around -24 LUFS, so always run this (or at least the loudnorm) before publishing.
"""
import subprocess
import sys

from kit import CFG, ROOT

FILTER = (
    "[1:a]lowpass=f=2400,volume=0.55[m];"
    "[m][0:a]sidechaincompress=threshold=0.02:ratio=5:attack=60:release=800[md];"
    "[0:a][md]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=11[a]"
)


def main(argv):
    out_dir = ROOT / "out"
    name = CFG["id"]
    if argv and argv[0] in CFG.get("formats", {}):
        name = f"{name}-{argv.pop(0)}"
    video = argv[0] if len(argv) > 0 else str(out_dir / f"{name}.mp4")
    music = argv[1] if len(argv) > 1 else str(out_dir / "music.wav")
    output = argv[2] if len(argv) > 2 else str(out_dir / f"{name}-mixed.mp4")
    cmd = [
        "ffmpeg", "-y", "-i", video, "-i", music,
        "-filter_complex", FILTER,
        "-map", "0:v", "-map", "[a]",
        "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
        output,
    ]
    print(" ".join(cmd))
    subprocess.run(cmd, check=True)
    print(output)


if __name__ == "__main__":
    main(sys.argv[1:])
