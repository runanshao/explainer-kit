"""Mastering: bring a mix to a loudness target without squashing it, and prove it on the encoded file.

    python tools/master.py promo        # out/<promo id>.mp4 (picture + scene sfx) + out/promo-score.wav
                                        # → out/<promo id>-mixed.mp4 at promo.json "loudness"
    (tools/mix.py uses master() for the narrated film)

How (ffmpeg only, so a 20-minute film never has to fit in memory):
  1. render the mix to a WAV
  2. measure integrated loudness (EBU R128) → apply that gain linearly, then a look-ahead limiter at `ceiling`
  3. measure again and repeat (the limiter takes a little loudness away) until within 0.3 LU
  4. encode AAC into the MP4 and measure *that* file's true peak: AAC overshoots by ~0.5 dB, so if it lands above
     -1 dBTP the ceiling is lowered by the excess and the master redone

Why not one `loudnorm` pass: single-pass loudnorm runs in dynamic mode and pumps short, punchy material.
Targets: -14 LUFS for short-video platforms, -16 for web video; true peak ≤ -1 dBTP after encoding.
"""
import json
import re
import subprocess
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")  # Windows consoles default to cp1252 when output is redirected

ROOT = Path(__file__).resolve().parent.parent
TP_MAX = -1.0


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit(f"failed: {' '.join(map(str, cmd))}\n{r.stderr[-2000:]}")
    return r.stderr


def measure(path):
    """integrated loudness (LUFS), loudness range (LU), true peak (dBTP) of a media file"""
    err = run(["ffmpeg", "-nostats", "-i", str(path), "-af", "ebur128=peak=true", "-f", "null", "-"])
    tail = err[err.rfind("Summary:"):]
    get = lambda key: float(re.search(rf"{key}:\s+(-?[\d.]+|-inf)", tail).group(1).replace("-inf", "-99"))
    return {"I": get("I"), "LRA": get("LRA"), "TP": get("Peak")}


def master(video, filter_complex, inputs, out, target, ceiling):
    """`inputs` are extra audio files after the video; `filter_complex` must end in a pad called [a]."""
    out = Path(out)
    tmp = out.parent / f".{out.stem}"
    pre, cur = tmp.with_suffix(".pre.wav"), tmp.with_suffix(".cur.wav")
    args = ["ffmpeg", "-y", "-nostats", "-i", str(video)]
    for x in inputs:
        args += ["-i", str(x)]
    run(args + ["-filter_complex", filter_complex, "-map", "[a]", "-ar", "48000", "-c:a", "pcm_s24le", str(pre)])
    ceil = ceiling
    for attempt in range(3):
        gain = target - measure(pre)["I"]
        for _ in range(4):
            lim = 10 ** (ceil / 20)
            run(["ffmpeg", "-y", "-nostats", "-i", str(pre), "-af", f"volume={gain:.2f}dB,alimiter=limit={lim:.4f}:attack=5:release=60:level=0", "-c:a", "pcm_s24le", str(cur)])
            m = measure(cur)
            if abs(m["I"] - target) <= 0.3:
                break
            gain += target - m["I"]
        run(["ffmpeg", "-y", "-nostats", "-i", str(video), "-i", str(cur), "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "256k", "-shortest", str(out)])
        final = measure(out)
        print(f"  master pass {attempt + 1}: ceiling {ceil:.1f} dBFS → {final['I']:.1f} LUFS, true peak {final['TP']:.1f} dBTP, LRA {final['LRA']:.1f}")
        if final["TP"] <= TP_MAX:
            break
        ceil -= final["TP"] - TP_MAX + 0.2
    for p in (pre, cur):
        p.unlink(missing_ok=True)
    return final


def promo():
    cfg = json.loads((ROOT / "promo" / "promo.json").read_text(encoding="utf-8"))
    pid = cfg["id"]
    video = ROOT / "out" / f"{pid}.mp4"
    score = ROOT / "out" / "promo-score.wav"
    for p in (video, score):
        if not p.exists():
            sys.exit(f"{p} missing — run node tools/promo.mjs (or render {pid} and python tools/score.py)")
    loud = cfg.get("loudness", {})
    # scene sound effects sit on top of the score; the score is not ducked (there is no voice to make room for)
    fc = "[0:a]volume=1.0[s];[1:a]volume=0.9[m];[s][m]amix=inputs=2:duration=longest:normalize=0[a]"
    out = ROOT / "out" / f"{pid}-mixed.mp4"
    final = master(video, fc, [score], out, loud.get("target", -14), loud.get("ceiling", -2.6))
    print(out)
    return final


if __name__ == "__main__":
    if sys.argv[1:] == ["promo"]:
        promo()
    else:
        sys.exit(__doc__)
