"""Synthesize the film's underscore → out/music.wav

Story-film scoring, all synthesized (no samples):
- a low drone pad whose harmony follows the three acts (rise / squeeze / reckoning)
- a soft heartbeat pulse under the tense chapters
- a riser + low boom on every chapter-ending hook (the cut to black), and on the cold-open quote
- a single bell note on each chapter card
Scene boundaries come from src/timings.json + src/pace.json, so it stays in sync after re-TTS.
"""
import json
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
SR = 44100
FPS = 30
T = json.loads((ROOT / "src" / "timings.json").read_text(encoding="utf-8"))
P = json.loads((ROOT / "src" / "pace.json").read_text(encoding="utf-8"))
lead = lambda i: P["leadOverride"].get(i, P["lead"])
tail = lambda i: P["tailOverride"].get(i, P["tail"])

starts, narr_end, acc = {}, {}, 0.0
for sid, v in T.items():
    starts[sid] = acc
    narr_end[sid] = acc + (lead(sid) + int(np.ceil(v["duration"] * FPS))) / FPS
    acc += (lead(sid) + int(np.ceil(v["duration"] * FPS)) + tail(sid)) / FPS
TOTAL = acc
N = int(TOTAL * SR) + SR
t = np.arange(N) / SR
out = np.zeros(N)
rng = np.random.default_rng(11)


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def add(i0, sig):
    i0 = max(0, i0)
    i1 = min(N, i0 + len(sig))
    if i1 > i0:
        out[i0:i1] += sig[: i1 - i0]


# ── drone pad: (start scene, chord list, brightness) ──
ACTS = [
    ("s01", [[38, 45, 50, 53], [34, 41, 50, 53], [36, 43, 48, 55], [33, 40, 49, 52]], 0.5),  # Dm  Bb  C  A
    ("s08", [[37, 44, 49, 50], [37, 44, 48, 52], [35, 42, 47, 50], [36, 43, 46, 51]], 0.35),  # tense, semitone rubs
    ("s14", [[38, 45, 50, 54], [43, 50, 55, 59], [41, 48, 53, 57], [45, 52, 57, 61]], 0.7),  # D  G  F  A (lift)
]
act_t = [(starts[s], ch, br) for s, ch, br in ACTS]


def act_at(sec):
    cur = act_t[0]
    for a in act_t:
        if sec >= a[0]:
            cur = a
    return cur


BAR = 9.0
for b in range(int(np.ceil(TOTAL / BAR)) + 1):
    t0 = b * BAR
    _, chords, bright = act_at(t0)
    chord = chords[b % len(chords)]
    i0 = int(max(0, t0 - 3) * SR)
    i1 = min(N, int((t0 + BAR + 3) * SR))
    if i0 >= N:
        break
    tt = t[i0:i1] - t0
    env = (np.clip((tt + 3) / 3.5, 0, 1) * np.clip((BAR + 3 - tt) / 3.5, 0, 1)) ** 1.6
    seg = np.zeros(i1 - i0)
    for k, m in enumerate(chord):
        f = hz(m)
        for det in (-0.003, 0.0, 0.0035):
            ph = rng.random() * 2 * np.pi
            seg += np.sin(2 * np.pi * f * (1 + det) * tt + ph) * (0.7 if k == 0 else 0.32)
            seg += bright * 0.06 * np.sin(2 * np.pi * 2 * f * (1 + det) * tt + ph)
    seg *= 1 + 0.1 * np.sin(2 * np.pi * 0.09 * tt + b)
    out[i0:i1] += 0.55 * seg * env

# ── heartbeat pulse under tense chapters ──
TENSE = ["s01", "s09", "s11", "s13"]
ids = list(T.keys())
for sid in TENSE:
    a = starts[sid] + lead(sid) / FPS
    z = narr_end[sid]
    beat = 0.92
    k = a
    while k < z - 1.0:
        for off, amp in ((0.0, 1.0), (0.24, 0.6)):
            n = int(0.35 * SR)
            tt = np.arange(n) / SR
            f = 55 * np.exp(-tt * 9) + 38
            sig = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 11) * amp
            add(int((k + off) * SR), 0.9 * sig)
        k += beat

# ── riser + boom at every hook (end of narration) ──
def riser(at, dur=2.4, amp=0.5):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    noise = rng.normal(0, 1, n)
    # crude band emphasis via differencing, rising envelope
    noise = np.convolve(noise, np.ones(30) / 30, mode="same")
    env = (tt / dur) ** 2.2
    tone = np.sin(2 * np.pi * np.cumsum(220 + 440 * (tt / dur) ** 2) / SR) * 0.25
    add(int((at - dur) * SR), amp * env * (noise * 1.6 + tone))


def boom(at, amp=1.0):
    n = int(3.2 * SR)
    tt = np.arange(n) / SR
    f = 70 * np.exp(-tt * 2.2) + 28
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 1.3)
    click = rng.normal(0, 1, n) * np.exp(-tt * 40) * 0.5
    add(int(at * SR), amp * (body * 1.4 + click))


for sid in ids:
    hit = narr_end[sid] + 0.12
    if sid == "s15":
        continue
    riser(hit, amp=0.35)
    boom(hit, amp=0.9)

# cold-open quote: boom on the cut to black
q = T["s01"]["cues"]["quote"]
boom(starts["s01"] + lead("s01") / FPS + q, amp=0.8)
# title card after the cold open
boom(narr_end["s01"] + 0.3, amp=0.6)

# ── bell on each chapter card ──
for i, sid in enumerate(ids):
    if lead(sid) < 30:
        continue
    at = starts[sid] + 0.15
    n = int(5 * SR)
    tt = np.arange(n) / SR
    m = [74, 69, 72, 67][i % 4]
    sig = (np.sin(2 * np.pi * hz(m) * tt) + 0.3 * np.sin(2 * np.pi * hz(m) * 2.76 * tt) * np.exp(-tt * 3)) * np.exp(-tt * 1.1)
    add(int(at * SR), 0.28 * sig)

# fades + normalize
y = out / (np.max(np.abs(out)) + 1e-9)
fade = int(3 * SR)
y[:fade] *= np.linspace(0, 1, fade)
y[-fade:] *= np.linspace(1, 0, fade)
y = (y * 0.9 * 32767).astype(np.int16)
path = ROOT / "out" / "music.wav"
with wave.open(str(path), "wb") as wf:
    wf.setnchannels(1)
    wf.setsampwidth(2)
    wf.setframerate(SR)
    wf.writeframes(y.tobytes())
print(f"{path}  {TOTAL:.1f}s")
