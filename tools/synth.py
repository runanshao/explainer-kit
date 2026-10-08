"""Instruments, effects and a mix bus for the promo score (tools/score.py). numpy + scipy; no samples, so no licensing.

Every function returns float arrays at SR (mono 1-D, or stereo (n, 2) for the wide ones). Randomness goes through
`rng`, seeded, so the same promo.json always gives the same score.
"""
import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt

SR = 44100
rng = np.random.default_rng(1006)


def T(sec):
    return np.arange(int(sec * SR)) / SR


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def noise(sec):
    return rng.standard_normal(int(sec * SR))


def lp(x, fc, order=2):
    return sosfilt(butter(order, min(fc, SR * 0.45), "low", fs=SR, output="sos"), x, axis=0)


def hp(x, fc, order=2):
    return sosfilt(butter(order, fc, "high", fs=SR, output="sos"), x, axis=0)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, min(hi, SR * 0.45)], "band", fs=SR, output="sos"), x, axis=0)


def saw(f, sec, phase=0.0):
    return 2 * ((f * T(sec) + phase) % 1.0) - 1


def adsr(sec, a=0.005, d=0.1, s=0.6, r=0.08):
    t = T(sec)
    e = np.where(t < a, t / a, np.where(t < a + d, 1 - (1 - s) * (t - a) / d, s))
    return e * np.clip((sec - t) / r, 0, 1)


# ───────────────────────── drums ─────────────────────────

def kick():
    t = T(0.5)
    f = 44 + 150 * np.exp(-t * 32)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6.5)
    click = hp(noise(0.5), 2500) * np.exp(-t * 400) * 0.6
    knock = np.sin(2 * np.pi * 220 * t) * np.exp(-t * 60) * 0.3
    return np.tanh((body + click + knock) * 1.8) * 0.9


def clap():
    t = T(0.45)
    e = sum((t >= o) * np.exp(-np.maximum(0, t - o) * k) for o, k in [(0, 260), (0.009, 260), (0.018, 200), (0.027, 18)])
    return bp(noise(0.45), 900, 3200) * e * 1.6


def hat(open_=False):
    sec = 0.25 if open_ else 0.06
    return hp(noise(sec), 7500, 4) * np.exp(-T(sec) * (14 if open_ else 80)) * 0.6


def snare():
    t = T(0.25)
    return bp(noise(0.25), 1200, 9000) * np.exp(-t * 22) + np.sin(2 * np.pi * 185 * t) * np.exp(-t * 30) * 0.7


# ───────────────────────── tonal ─────────────────────────

def supersaw(freqs, sec, cutoff, bright_decay=None, cents=(-18, -10, -4, 0, 5, 11, 17)):
    """detuned saw stack, voices alternated left/right; `bright_decay` makes it a pluck (filter envelope)"""
    n = int(sec * SR)
    L, R = np.zeros(n), np.zeros(n)
    ph = np.random.default_rng(int(sum(freqs)))
    for f in freqs:
        for k, c in enumerate(cents):
            v = saw(f * 2 ** (c / 1200), sec, ph.random())
            (L if k % 2 else R)[:] += v
            if c == 0:
                L += v * 0.5
                R += v * 0.5
    st = np.stack([L, R], axis=1) / (len(freqs) * len(cents))
    dark = lp(st, cutoff)
    st = dark + (st - dark) * np.exp(-T(sec)[:, None] * bright_decay) if bright_decay else dark
    return hp(st, 120)


def pluck(f, sec=0.32):
    t = T(sec)
    v = saw(f, sec) * 0.6 + saw(f * 1.004, sec, 0.3) * 0.4
    dark = lp(v, 1400)
    return (dark + (v - dark) * np.exp(-t * 28)) * np.exp(-t * 7) * np.minimum(1, t / 0.002)


def bass(f, sec):
    t = T(sec)
    top = lp(saw(f * 2, sec), 900) * np.exp(-t * 9)
    e = np.minimum(1, t / 0.004) * np.clip((sec - t) / 0.02, 0, 1)
    return np.tanh((np.sin(2 * np.pi * f * t) * 0.9 + top * 0.7) * 1.5) * e


VOWELS = {"a": [(800, 1.0), (1150, 0.5), (2900, 0.25)], "o": [(450, 1.0), (800, 0.45), (2830, 0.15)], "e": [(400, 1.0), (2000, 0.4), (2600, 0.25)]}


def chop(f, sec=0.2, vowel="a"):
    """a formant-synthesized vocal chop ("ah", "oh", "eh") — the pop-production hook without a singer"""
    t = T(sec)
    vib = 1 + 0.006 * np.sin(2 * np.pi * 5.5 * t)
    src = 2 * ((np.cumsum(f * vib) / SR) % 1.0) - 1 + 0.05 * rng.standard_normal(len(t))
    out = sum(g * bp(src, fm * 0.88, fm * 1.12) for fm, g in VOWELS[vowel])
    return out * np.minimum(1, t / 0.008) * np.clip((sec - t) / 0.04, 0, 1) * 2.2


# ───────────────────────── bus ─────────────────────────

class Bus:
    """a stereo track with an optional reverb send"""

    def __init__(self, n):
        self.x = np.zeros((n, 2))
        self.send = np.zeros((n, 2))

    def put(self, sig, start, pan=0.0, gain=1.0, send=0.0):
        n = len(self.x)
        i = int(round(start * SR))
        if i >= n or i < 0:
            return
        if sig.ndim == 1:
            l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
            sig = np.stack([sig * l, sig * r], axis=1) * np.sqrt(2)
        sig = sig[: n - i] * gain
        self.x[i:i + len(sig)] += sig
        if send:
            self.send[i:i + len(sig)] += sig * send


def reverb(send, sec=1.8, decay=3.2):
    """convolution with a synthetic stereo tail. The impulse response is energy-normalized: without that the wet signal
    comes out several times louder than the dry mix and smears everything into one wash."""
    t = T(sec)
    ir = np.stack([rng.standard_normal(len(t)), rng.standard_normal(len(t))], axis=1) * np.exp(-t * decay)[:, None]
    ir = lp(ir, 6000)
    ir[: int(0.012 * SR)] = 0
    ir /= np.sqrt((ir ** 2).sum(axis=0, keepdims=True))
    wet = np.stack([fftconvolve(send[:, c], ir[:, c])[: len(send)] for c in range(2)], axis=1)
    return hp(wet, 250)


def duck(n, kicks, depth=0.7, release=0.09):
    """sidechain envelope: dips after every kick so pads and bass breathe with the drum"""
    env = np.ones(n)
    seg = np.arange(int(0.42 * SR)) / SR
    for k in kicks:
        i0 = int(k * SR)
        m = min(len(seg), n - i0)
        if m > 0:
            env[i0:i0 + m] = np.minimum(env[i0:i0 + m], 1 - depth * np.exp(-seg[:m] / release))
    return env


def rms(x, a, b):
    seg = x[int(a * SR):int(b * SR)]
    return float(np.sqrt(np.mean(seg ** 2))) if len(seg) else 0.0
