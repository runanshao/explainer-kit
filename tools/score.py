"""The promo's score, written on the same beat grid as the picture → out/promo-score.wav (stereo, un-mastered).

    python tools/score.py

promo/promo.json gives bpm, key and, per scene, an `energy`; this turns them into an arrangement:

    intro   low-passed pad; a kick + vocal chop on every cue of the scene (the cold-open slams)
    groove  four-on-the-floor kick, claps on 2 and 4, hats, off-beat bass, pluck hook, supersaw stabs
    break   no kick: pad, hook and hats, so the next downbeat hits harder
    build   two kicks, then an accelerating snare roll and an opening filter; the last beat is silent
    drop    groove with vocal chops; the very last beat of the promo is a held chord

Chords cycle per bar (minor key: i–VI–III–VII, major: I–V–vi–IV). Hits and swells that belong to the picture
(impacts, risers, whooshes) are <Sfx> in the scenes, not here. tools/master.py mixes both and sets the loudness.
It prints each bus's RMS per section: if the reverb or the pad is louder than the drums, the mix will sound washed out.
"""
import json
import math
import sys
import wave
from pathlib import Path

import numpy as np

from synth import SR, Bus, bass, chop, clap, duck, hat, kick, midi, pluck, reverb, rms, snare, supersaw, adsr, T

sys.stdout.reconfigure(encoding="utf-8")  # Windows consoles default to cp1252 when output is redirected

ROOT = Path(__file__).resolve().parent.parent
PROMO = json.loads((ROOT / "promo" / "promo.json").read_text(encoding="utf-8"))
NOTES = {"C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3, "E": 4, "F": 5, "F#": 6, "Gb": 6, "G": 7, "G#": 8, "Ab": 8, "A": 9, "A#": 10, "Bb": 10, "B": 11}


def key_root(key):
    """'Am' → (A's semitone, minor=True)"""
    minor = key.endswith("m")
    return NOTES[key[:-1] if minor else key], minor


def progression(key):
    """four chords as (root midi in octave 1–2, voicing around middle C, hook notes per 16th step)"""
    r, minor = key_root(key)
    # scale-degree offsets and chord qualities
    degs = [(0, "m"), (8, "M"), (3, "M"), (10, "M")] if minor else [(0, "M"), (7, "M"), (9, "m"), (5, "M")]
    out = []
    for off, q in degs:
        root = 33 + (r + off - 9) % 12  # between A1 and G#2
        third = 3 if q == "m" else 4
        tones = [root + 24, root + 24 + third, root + 24 + 7]
        voicing = sorted({55 + ((t - 55) % 12) for t in tones} | {55 + ((tones[0] + 12 - 55) % 12) + 12})
        hook_tones = [t + 12 for t in tones] + [tones[0] + 24]
        hook = [(0, hook_tones[1]), (3, hook_tones[0]), (6, tones[2]), (8, hook_tones[1]), (10, hook_tones[2]), (12, hook_tones[1]), (14, hook_tones[0])]
        out.append((root, voicing, hook))
    return out


def main():
    bpm = PROMO["bpm"]
    beat = 60 / bpm
    s16 = beat / 4
    scenes = PROMO["scenes"]
    total_beats = sum(s["bars"] * 4 for s in scenes)
    end = total_beats * beat
    n = int((end + 1.0) * SR)
    drums, bassb, music, vox = Bus(n), Bus(n), Bus(n), Bus(n)
    chords = progression(PROMO["key"])

    # energy of every beat, scene starts in beats
    energy, starts, b0 = [], {}, 0
    for s in scenes:
        starts[s["id"]] = b0
        energy += [s["energy"]] * int(round(s["bars"] * 4))
        b0 += s["bars"] * 4

    def pos_beats(sc, pos):
        bar, bt = pos.split(":")
        return starts[sc["id"]] + int(bar) * 4 + float(bt)

    kicks = []
    last_beat = int(total_beats) - 1
    for b in range(int(total_beats)):
        en = energy[b]
        t = b * beat
        root, voicing, hook = chords[(b // 4) % 4]
        on_bar = b % 4 == 0
        if b == last_beat:
            break
        # pad: every bar (or at a scene start mid-bar), dark in intro/build
        prev = energy[b - 1] if b else None
        if on_bar or en != prev:
            beats_left = 4 - b % 4
            sec = beats_left * beat + 0.05
            cut = {"intro": 550, "build": 900, "break": 1800}.get(en, 2600)
            pad = supersaw([midi(m) for m in voicing], sec, cut) * adsr(sec, 0.02, 0.2, 0.8, 0.05)[:, None]
            if en == "build":
                k = (T(sec) / sec)[:, None]
                pad = pad * (1 - k) + supersaw([midi(m) for m in voicing], sec, 4000) * adsr(sec, 0.02, 0.2, 0.8, 0.05)[:, None] * k
            music.put(pad, t, gain={"intro": 0.2, "break": 0.45}.get(en, 0.42), send=0.3)
        if en in ("groove", "drop"):
            drums.put(kick(), t, gain=1.0)
            kicks.append(t)
            drums.put(hat(True), t + beat / 2, pan=0.15, gain=0.5)
            bassb.put(bass(midi(root), beat / 2 - 0.02), t + beat / 2, gain=0.85)
            if b % 2 == 1:
                drums.put(clap(), t, gain=0.75, send=0.35)
        if en in ("groove", "drop", "break"):
            for k in range(4):
                drums.put(hat(), t + k * s16, pan=-0.25, gain=(0.32 if k % 2 else 0.16) * (0.7 if en == "break" else 1))
            for step, m in hook:
                if b % 4 == step // 4:
                    at = (b - b % 4) * beat + step * s16
                    music.put(pluck(midi(m)), at, pan=0.2 if step % 4 else -0.2, gain=0.55, send=0.3)
                    music.put(pluck(midi(m + 12)) * 0.25, at + 0.18, pan=-0.5, gain=0.4, send=0.4)
            if en != "break" and b % 4 in (1, 3):
                st = supersaw([midi(m + 12) for m in voicing[1:]], 0.16, 1800, bright_decay=25) * adsr(0.16, 0.002, 0.05, 0.5, 0.04)[:, None]
                music.put(st, t + beat / 2, gain=0.6, send=0.25)
        if en == "drop" and b % 4 in (1, 3):
            m = hook[3][1] - 12 if b % 4 == 1 else hook[5][1] - 12
            vox.put(chop(midi(m), 0.18, "a" if b % 4 == 1 else "o"), t + 3 * s16, pan=0.3 if b % 4 == 1 else -0.3, gain=0.5, send=0.5)
    # build: two kicks then an accelerating snare roll, silent on the last beat
    for s in scenes:
        if s["energy"] != "build":
            continue
        a = starts[s["id"]] * beat
        z = (starts[s["id"]] + s["bars"] * 4) * beat
        for k in range(2):
            drums.put(kick(), a + k * beat, gain=0.9)
            kicks.append(a + k * beat)
        t, step = a + 2 * beat, s16
        while t < z - beat - 0.01:
            prog = (t - a) / (z - a)
            drums.put(snare(), t, gain=0.25 + 0.6 * prog, send=0.2)
            t += step if t < a + 3 * beat else s16 / 2
    # intro: a kick and a vocal chop on every cue (the slams of the cold open)
    for s in scenes:
        if s["energy"] != "intro":
            continue
        _, voicing, _ = chords[0]
        for i, pos in enumerate(s["cues"].values()):
            t = pos_beats(s, pos) * beat
            if t >= (starts[s["id"]] + s["bars"] * 4) * beat - 1e-6:
                continue
            drums.put(kick(), t, gain=0.9 + 0.1 * i)
            kicks.append(t)
            vox.put(chop(midi(voicing[min(i, len(voicing) - 1)] + 12), 0.3, "ao"[i % 2]), t, gain=0.55, send=0.6)
    # the last beat: a held chord
    t = last_beat * beat
    root, voicing, _ = chords[(last_beat // 4) % 4]
    sec = beat + 1.0
    music.put(supersaw([midi(m) for m in voicing + [voicing[0] + 12]], sec, 3200) * adsr(sec, 0.005, 0.3, 0.7, 0.6)[:, None], t, gain=0.6, send=0.5)
    vox.put(chop(midi(voicing[-1]), 0.6, "a"), t, gain=0.45, send=0.7)
    drums.put(kick(), t, gain=1.0)

    env = duck(n, kicks)
    music.x *= env[:, None]
    bassb.x *= env[:, None]
    vox.x *= (0.5 + 0.5 * env)[:, None]
    wet = reverb(drums.send + bassb.send + music.send + vox.send) * 0.5

    buses = {"drums": drums.x, "bass": bassb.x * 0.6, "music": music.x * 2.2, "vox": vox.x * 0.9, "reverb": wet}
    print(f"{'bus':8}" + "".join(f"{s['id'] + ' ' + s['energy']:>16}" for s in scenes))
    for name, x in buses.items():
        row = "".join(f"{rms(x, starts[s['id']] * beat, (starts[s['id']] + s['bars'] * 4) * beat):16.3f}" for s in scenes)
        print(f"{name:8}{row}")
    mix = sum(buses.values())
    mix = mix[: int(math.ceil((end + 0.6) * SR))]
    fo = int(0.5 * SR)
    mix[-fo:] *= np.linspace(1, 0, fo)[:, None] ** 1.5
    mix /= np.abs(mix).max() + 1e-9
    mix *= 0.8
    out = ROOT / "out" / "promo-score.wav"
    out.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(out), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((mix * 32767).astype(np.int16).tobytes())
    print(f"{out.relative_to(ROOT).as_posix()}  {end:.2f}s  {bpm} bpm  key {PROMO['key']}")


if __name__ == "__main__":
    main()
