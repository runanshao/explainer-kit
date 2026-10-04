"""Synthesize an underscore for the whole video → out/music.wav (no samples, numpy only).

- a low drone pad, one section per scene: each scene gets its own chord progression (cycled from PROGRESSIONS)
- a soft hit (low thump + bell) at the start of each scene, i.e. on each chapter card
Scene boundaries come from src/timings.json + kit.config.json, so the score follows re-TTS automatically.
Then mix it under the narration with tools/mix.py.
"""
import wave

import numpy as np

from kit import ROOT, scene_spans, timings

SR = 44100
BAR = 9.0  # seconds per chord
# MIDI notes, four chords per progression; scene i uses PROGRESSIONS[i % len]
PROGRESSIONS = [
    [[38, 45, 50, 53], [34, 41, 50, 53], [36, 43, 48, 55], [33, 40, 49, 52]],  # Dm  Bb  C  A
    [[41, 48, 53, 57], [36, 43, 52, 55], [38, 45, 50, 53], [34, 41, 50, 53]],  # F  C  Dm  Bb
    [[43, 50, 55, 59], [40, 47, 52, 55], [36, 43, 48, 52], [38, 45, 50, 54]],  # G  Em  C  D
]
BRIGHT = [0.5, 0.6, 0.7]
BELL = [74, 69, 72, 67]


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def main():
    spans = scene_spans(timings())
    total = spans[-1][4] if spans else 0.0
    n = int(total * SR) + SR
    t = np.arange(n) / SR
    out = np.zeros(n)
    rng = np.random.default_rng(11)

    def add(i0, sig):
        i0 = max(0, i0)
        i1 = min(n, i0 + len(sig))
        if i1 > i0:
            out[i0:i1] += sig[: i1 - i0]

    # ── drone pad: one section per scene ──
    for si, (sid, s0, _, _, s1) in enumerate(spans):
        chords = PROGRESSIONS[si % len(PROGRESSIONS)]
        bright = BRIGHT[si % len(BRIGHT)]
        b = 0
        while s0 + b * BAR < s1:
            t0 = s0 + b * BAR
            t1 = min(s1, t0 + BAR)
            chord = chords[b % len(chords)]
            i0 = int(max(0, t0 - 3) * SR)
            i1 = min(n, int((t1 + 3) * SR))
            tt = t[i0:i1] - t0
            span = t1 - t0
            env = (np.clip((tt + 3) / 3.5, 0, 1) * np.clip((span + 3 - tt) / 3.5, 0, 1)) ** 1.6
            seg = np.zeros(i1 - i0)
            for k, m in enumerate(chord):
                f = hz(m)
                for det in (-0.003, 0.0, 0.0035):
                    ph = rng.random() * 2 * np.pi
                    seg += np.sin(2 * np.pi * f * (1 + det) * tt + ph) * (0.7 if k == 0 else 0.32)
                    seg += bright * 0.06 * np.sin(2 * np.pi * 2 * f * (1 + det) * tt + ph)
            seg *= 1 + 0.1 * np.sin(2 * np.pi * 0.09 * tt + b)
            out[i0:i1] += 0.55 * seg * env
            b += 1

    # ── soft hit at each chapter start: low thump + bell ──
    for si, (sid, s0, _, _, _) in enumerate(spans):
        at = s0 + 0.15
        k = int(2.5 * SR)
        tt = np.arange(k) / SR
        f = 60 * np.exp(-tt * 2.5) + 32
        thump = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 2.2)
        add(int(at * SR), 0.5 * thump)
        k = int(5 * SR)
        tt = np.arange(k) / SR
        m = BELL[si % len(BELL)]
        bell = (np.sin(2 * np.pi * hz(m) * tt) + 0.3 * np.sin(2 * np.pi * hz(m) * 2.76 * tt) * np.exp(-tt * 3)) * np.exp(-tt * 1.1)
        add(int(at * SR), 0.22 * bell)

    # fades + normalize
    y = out / (np.max(np.abs(out)) + 1e-9)
    fade = min(int(3 * SR), n // 2)
    y[:fade] *= np.linspace(0, 1, fade)
    y[-fade:] *= np.linspace(1, 0, fade)
    y = (y * 0.9 * 32767).astype(np.int16)
    path = ROOT / "out" / "music.wav"
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        wf.writeframes(y.tobytes())
    print(f"{path}  {total:.1f}s  {len(spans)} sections")


if __name__ == "__main__":
    main()
