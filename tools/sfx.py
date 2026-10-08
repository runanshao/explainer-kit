"""Synthesize the sound-effect library → public/sfx/<name>.wav (numpy only, no samples, so no licensing questions).

    python tools/sfx.py            # writes every sound
    python tools/sfx.py pop coin   # only these

Scenes place them with <Sfx at={frame} name="pop" /> (src/core/Sfx.tsx); `Shots` adds a whoosh to moving transitions.
The files are small and committed, so Studio has sound out of the box; rerun this after tweaking a recipe.
"""
import sys

import numpy as np

from kit import ROOT, wav_bytes

SR = 44100
OUT = ROOT / "public" / "sfx"
rng = np.random.default_rng(7)


def t_(dur):
    return np.arange(int(dur * SR)) / SR


def env(t, attack=0.002, decay=0.1):
    """fast attack, exponential decay"""
    a = np.clip(t / max(attack, 1e-6), 0, 1)
    return a * np.exp(-np.maximum(t - attack, 0) / decay)


def lp(x, fc):
    """one-pole low-pass; fc may be a scalar or a per-sample array (for sweeps)"""
    fc = np.broadcast_to(np.asarray(fc, dtype=float), x.shape)
    a = 1 - np.exp(-2 * np.pi * fc / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc += a[i] * (x[i] - acc)
        y[i] = acc
    return y


def hp(x, fc):
    return x - lp(x, fc)


def noise(dur):
    return rng.standard_normal(int(dur * SR))


def sweep(f0, f1, t, curve=3.0):
    """phase of a sine sweeping exponentially from f0 to f1 over t"""
    k = t / t[-1]
    f = f0 * (f1 / f0) ** (k ** (1 / curve))
    return 2 * np.pi * np.cumsum(f) / SR


def square(f, t, duty=0.5):
    return np.where((t * f) % 1 < duty, 1.0, -1.0)


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


# ───────────────────────── recipes ─────────────────────────

def click():
    t = t_(0.06)
    return 0.6 * hp(noise(0.06), 3000) * env(t, 0.0005, 0.004) + 0.5 * np.sin(2 * np.pi * 2200 * t) * env(t, 0.0005, 0.01)


def pop():
    t = t_(0.16)
    return np.sin(sweep(900, 260, t, 1.5)) * env(t, 0.001, 0.045) + 0.15 * hp(noise(0.16), 2000) * env(t, 0.0005, 0.006)


def _whoosh(dur, f0, f1, peak):
    t = t_(dur)
    k = t / dur
    shape = np.sin(np.pi * np.clip(k / peak, 0, 1) * 0.5) ** 2 * np.exp(-np.maximum(k - peak, 0) * 6)
    fc = f0 * (f1 / f0) ** k
    return 1.4 * hp(lp(noise(dur), fc), 200) * shape


def whoosh():
    return _whoosh(0.5, 400, 3500, 0.55)


def whip():
    return _whoosh(0.26, 900, 6000, 0.4)


def swish():
    """soft brush / paper swish"""
    return 0.8 * _whoosh(0.4, 1500, 5000, 0.35)


def thud():
    """stamp, note landing: low body + paper slap"""
    t = t_(0.45)
    body = np.sin(sweep(110, 45, t, 2)) * env(t, 0.002, 0.09)
    slap = lp(noise(0.45), 1800) * env(t, 0.0005, 0.02)
    return 0.9 * body + 0.7 * slap


def slam():
    """big impact: sub drop, crack and a short noisy tail"""
    t = t_(1.0)
    sub = np.sin(sweep(150, 38, t, 2.5)) * env(t, 0.002, 0.22)
    crack = hp(noise(1.0), 1500) * env(t, 0.0005, 0.03)
    tail = lp(noise(1.0), 2500) * env(t, 0.01, 0.25) * 0.25
    return sub + 0.6 * crack + tail


def tick():
    t = t_(0.03)
    return 0.5 * hp(noise(0.03), 4000) * env(t, 0.0003, 0.003) + 0.3 * np.sin(2 * np.pi * 3200 * t) * env(t, 0.0003, 0.006)


def type_():
    """keystroke: click plus a little body"""
    t = t_(0.07)
    return 0.45 * hp(noise(0.07), 2500) * env(t, 0.0005, 0.006) + 0.35 * np.sin(sweep(500, 220, t)) * env(t, 0.001, 0.02)


def coin():
    """the classic two-note pickup"""
    a = t_(0.07)
    b = t_(0.32)
    return 0.35 * np.concatenate([square(hz(83), a) * env(a, 0.001, 0.5), square(hz(88), b) * env(b, 0.001, 0.12)])


def levelup():
    parts = []
    for m in [72, 76, 79, 84, 88]:
        t = t_(0.085)
        parts.append(square(hz(m), t, 0.25) * env(t, 0.001, 0.2))
    t = t_(0.5)
    parts.append(square(hz(91), t, 0.25) * env(t, 0.001, 0.18))
    return 0.3 * np.concatenate(parts)


def glitch():
    dur = 0.32
    t = t_(dur)
    x = noise(dur)
    # sample-and-hold "bitcrush" plus random square blips
    hold = np.repeat(x[::40], 40)[: len(x)]
    blips = np.zeros_like(t)
    for _ in range(6):
        i0 = rng.integers(0, len(t) - 2000)
        n = rng.integers(600, 2000)
        blips[i0 : i0 + n] += square(rng.uniform(200, 1800), t[:n]) * 0.6
    gate = (rng.random(len(t) // 600 + 1) > 0.35).repeat(600)[: len(t)]
    return 0.5 * (np.round(hold * 3) / 3 + blips) * gate * env(t, 0.001, 0.15)


def chime():
    t = t_(1.6)
    out = np.zeros_like(t)
    for m, g in [(84, 1.0), (91, 0.5)]:
        f = hz(m)
        out += g * (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 4))
    return 0.35 * out * env(t, 0.002, 0.45)


def draw():
    """pencil scribble: grainy noise with a stroke rhythm"""
    dur = 0.6
    t = t_(dur)
    strokes = 0.5 + 0.5 * np.sin(2 * np.pi * 9 * t) ** 2
    shape = np.clip(t / 0.05, 0, 1) * np.clip((dur - t) / 0.12, 0, 1)
    return 0.6 * hp(lp(noise(dur), 6000), 1800) * strokes * shape


# ── for the promo: hits that land on the beat and swells that peak on it ──

def impact():
    """trailer hit: sub drop, crack and a low thump (the downbeat of a drop)"""
    t = t_(1.4)
    sub = np.sin(sweep(100, 30, t, 2.5)) * env(t, 0.002, 0.4)
    crack = lp(noise(1.4), 5000) * env(t, 0.0005, 0.035)
    thump = lp(noise(1.4), 180) * env(t, 0.002, 0.07) * 3
    return np.tanh((sub + crack + thump) * 1.4)


def riser():
    """1.5 s noise swell with a rising tone; place it so it ends on the downbeat (at = downbeat - 45 frames at 30 fps)"""
    dur = 1.5
    t = t_(dur)
    k = t / dur
    nz = hp(lp(noise(dur), 300 * (8000 / 300) ** k), 200)
    tone = np.sin(2 * np.pi * np.cumsum(180 + 1600 * k ** 2) / SR) * 0.25
    return (nz * 1.3 + tone) * k ** 2.4 * np.clip((dur - t) / 0.01, 0, 1)


def revcrash():
    """reversed cymbal, 0.5 s, swelling into the downbeat (at = downbeat - 15 frames)"""
    t = t_(1.2)
    crash = hp(noise(1.2), 4000) * np.exp(-t * 2.2)
    rev = crash[::-1][-int(0.5 * SR):]
    return rev * np.linspace(0, 1, len(rev)) ** 2


def shimmer():
    """quick bell arpeggio (a logo drawing itself, a sparkle)"""
    out = np.zeros(int(0.8 * SR))
    for i, m in enumerate([84, 88, 91, 96, 100, 103]):
        t = t_(0.35)
        tone = (np.sin(2 * np.pi * hz(m) * t) + 0.25 * np.sin(2 * np.pi * hz(m) * 2.76 * t)) * env(t, 0.001, 0.08)
        i0 = int(i * 0.06 * SR)
        out[i0:i0 + len(tone)] += tone[: len(out) - i0]
    return 0.5 * out


def rush():
    """liquid rushing in, with a few bubbles (the flood transition)"""
    dur = 0.6
    t = t_(dur)
    k = t / dur
    body = lp(noise(dur), 200 * (2600 / 200) ** k) * np.sin(np.pi * np.clip(k, 0, 1)) ** 1.5 * 1.8
    for c in rng.uniform(0.1, 0.5, 9):
        tb = t_(0.05)
        f0 = rng.uniform(600, 1400)
        pop = np.sin(2 * np.pi * np.cumsum(f0 * (1 + 1.5 * tb / 0.05)) / SR) * env(tb, 0.001, 0.012)
        i0 = int(c * SR)
        body[i0:i0 + len(pop)] += 0.4 * pop[: len(body) - i0]
    return body


SOUNDS = {
    "click": click,
    "pop": pop,
    "whoosh": whoosh,
    "whip": whip,
    "swish": swish,
    "thud": thud,
    "slam": slam,
    "tick": tick,
    "type": type_,
    "coin": coin,
    "levelup": levelup,
    "glitch": glitch,
    "chime": chime,
    "draw": draw,
    "impact": impact,
    "riser": riser,
    "revcrash": revcrash,
    "shimmer": shimmer,
    "rush": rush,
}


def write(name, y):
    y = y / (np.max(np.abs(y)) + 1e-9) * 0.89
    fade = min(len(y), int(0.01 * SR))
    y[-fade:] *= np.linspace(1, 0, fade)
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / f"{name}.wav"
    path.write_bytes(wav_bytes((y * 32767).astype(np.int16).tobytes(), SR))
    return path


def main(argv):
    names = argv or list(SOUNDS)
    for n in names:
        if n not in SOUNDS:
            sys.exit(f"unknown sound {n}; have: {', '.join(SOUNDS)}")
        p = write(n, SOUNDS[n]())
        print(f"{p.relative_to(ROOT)}  {p.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main(sys.argv[1:])
