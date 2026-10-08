"""Look at a soundtrack before you ship it: numbers you can check and two pictures you can see.

    python tools/audio-report.py out/Promo-mixed.mp4 --promo         # sections = promo scenes
    python tools/audio-report.py out/Explainer-mixed.mp4             # sections = narrated scenes
    python tools/audio-report.py FILE --target -14                   # also fail if off target

Prints integrated loudness, loudness range and true peak, plus the loudness of every section (a scene that is much
quieter or louder than its neighbours shows up here), and writes out/audio/<name>_wave.png and _spec.png.
Reading them: a waveform that is one flat band means over-compression or a reverb wash (no transients); a build should
dip and the drop should jump; the spectrogram should not be a solid block above ~8 kHz (harsh) or empty (dull).
Exits non-zero when the true peak is above -1 dBTP, or (with --target) loudness is more than 1 LU off.
"""
import json
import subprocess
import sys
from pathlib import Path

from master import ROOT, measure

sys.stdout.reconfigure(encoding="utf-8")  # Windows consoles default to cp1252 when output is redirected


def sections(promo):
    if promo:
        cfg = json.loads((ROOT / "promo" / "promo.json").read_text(encoding="utf-8"))
        beat, acc, out = 60 / cfg["bpm"], 0.0, []
        for s in cfg["scenes"]:
            out.append((f"{s['id']} {s['energy']}", acc * beat, (acc + s["bars"] * 4) * beat))
            acc += s["bars"] * 4
        return out
    from kit import scene_spans, timings

    return [(sid, a, b) for sid, a, _, _, b in scene_spans(timings())]


def section_lufs(path, a, b):
    err = subprocess.run(["ffmpeg", "-nostats", "-ss", f"{a:.3f}", "-t", f"{max(0.4, b - a):.3f}", "-i", str(path), "-af", "ebur128", "-f", "null", "-"], capture_output=True, text=True).stderr
    tail = err[err.rfind("Summary:"):]
    try:
        return float(tail.split("I:")[1].split("LUFS")[0])
    except (IndexError, ValueError):
        return float("nan")


def main(argv):
    if not argv:
        sys.exit(__doc__)
    path = Path(argv[0])
    promo = "--promo" in argv
    target = float(argv[argv.index("--target") + 1]) if "--target" in argv else None
    m = measure(path)
    print(f"{path.name}: {m['I']:.1f} LUFS integrated, LRA {m['LRA']:.1f} LU, true peak {m['TP']:.1f} dBTP")
    for name, a, b in sections(promo):
        v = section_lufs(path, a, b)
        bar = "#" * max(0, int((v + 40) / 1.5)) if v == v else ""
        print(f"  {name:22} {a:6.2f}–{b:6.2f}s  {v:6.1f} LUFS  {bar}")
    out = ROOT / "out" / "audio"
    out.mkdir(parents=True, exist_ok=True)
    stem = path.stem
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(path), "-filter_complex", "showwavespic=s=1800x300:colors=0x2BB3A6", "-frames:v", "1", str(out / f"{stem}_wave.png")], check=True)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(path), "-lavfi", "showspectrumpic=s=1800x400:legend=0:scale=log", str(out / f"{stem}_spec.png")], check=True)
    print(f"pictures: out/audio/{stem}_wave.png, out/audio/{stem}_spec.png")
    bad = []
    if m["TP"] > -1.0:
        bad.append(f"true peak {m['TP']:.1f} dBTP > -1 (re-master with a lower ceiling)")
    if target is not None and abs(m["I"] - target) > 1.0:
        bad.append(f"loudness {m['I']:.1f} LUFS is off the {target} target")
    if bad:
        sys.exit("✖ " + "; ".join(bad))


if __name__ == "__main__":
    main(sys.argv[1:])
