"""Trace a logo image (a screenshot is fine) into vector parts for <LogoReveal> → src/brand/logo.json.

    python tools/trace-logo.py logo.png                 # colours found automatically (up to 4 besides the ground)
    python tools/trace-logo.py logo.png --colors 2      # keep only the 2 most common ink colours
    python tools/trace-logo.py logo.png --split         # also split each colour into connected pieces
    python tools/trace-logo.py logo.png --out x.json

Each colour becomes a part {name, fill, d}; with --split each connected piece of it does (biggest first), so a wordmark
can stamp in letter by letter. Don't substitute a font for a logo: trace it. Needs `pip install potracer` (pure Python).

Two traps this handles: potrace treats *dark* as solid, so the mask is passed inverted; and shapes touching the image
edge trace badly, so the mask is padded first and the coordinates shifted back.
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SCALE = 4  # trace an upscaled, slightly blurred mask: smoother curves than tracing pixels
PAD = 8


def ground_colour(rgb):
    """the most common colour of the whole image (a logo sits on a large flat ground; a screenshot's window frame is thin)"""
    vals, counts = np.unique((rgb // 8).reshape(-1, 3), axis=0, return_counts=True)
    return vals[counts.argmax()] * 8 + 4


def ink_colours(rgb, ground, k):
    h, w = rgb.shape[:2]
    q = (rgb // 16).reshape(-1, 3)
    vals, counts = np.unique(q, axis=0, return_counts=True)
    order = counts.argsort()[::-1]
    border = np.zeros((h, w), bool)
    b = max(2, int(0.03 * min(h, w)))
    border[:b], border[-b:], border[:, :b], border[:, -b:] = True, True, True, True
    out = []
    for i in order:
        c = vals[i] * 16 + 8
        if np.abs(c - ground).sum() < 60 or counts[i] < q.shape[0] * 0.002:
            continue
        near = np.abs(rgb - c).sum(axis=2) < 45
        if near[border].sum() > 0.5 * max(1, near.sum()):  # mostly along the edge: a screenshot frame, not the logo
            continue
        if all(np.abs(c - o).sum() >= 90 for o in out):
            out.append(c)
        if len(out) == k:
            break
    return out


def trace(mask):
    import potrace

    padded = np.pad(mask.astype(np.uint8) * 255, PAD)
    im = Image.fromarray(padded).resize((padded.shape[1] * SCALE, padded.shape[0] * SCALE), Image.BICUBIC)
    big = np.asarray(im.filter(ImageFilter.GaussianBlur(SCALE * 0.6)))
    paths = potrace.Bitmap(big <= 127).trace(turdsize=20, alphamax=1.0, opticurve=True, opttolerance=0.2)
    f = lambda p: f"{p.x / SCALE - PAD:.2f} {p.y / SCALE - PAD:.2f}"
    d = []
    for curve in paths:
        d.append(f"M{f(curve.start_point)}")
        for seg in curve.segments:
            d.append(f"L{f(seg.c)}L{f(seg.end_point)}" if seg.is_corner else f"C{f(seg.c1)} {f(seg.c2)} {f(seg.end_point)}")
        d.append("Z")
    return "".join(d)


def main(argv):
    if not argv:
        sys.exit(__doc__)
    src = Path(argv[0])
    k = int(argv[argv.index("--colors") + 1]) if "--colors" in argv else 4
    out = Path(argv[argv.index("--out") + 1]) if "--out" in argv else ROOT / "src" / "brand" / "logo.json"
    split = "--split" in argv
    rgb = np.asarray(Image.open(src).convert("RGB")).astype(int)
    ground = ground_colour(rgb)
    inks = ink_colours(rgb, ground, k)
    if not inks:
        sys.exit("no logo colours found (is the image a flat colour?)")
    dist = np.stack([np.abs(rgb - c).sum(axis=2) for c in [ground, *inks]])
    label = dist.argmin(axis=0)  # 0 = ground, 1.. = ink colours
    label[dist.min(axis=0) > 120] = 0  # pixels far from every chosen colour (frame, shadows, noise) are ground
    b = max(2, int(0.01 * min(label.shape)))
    label[:b], label[-b:], label[:, :b], label[:, -b:] = 0, 0, 0, 0
    ys, xs = np.nonzero(label > 0)
    x0, y0, x1, y1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
    label = label[y0:y1, x0:x1]
    parts = []
    for i, c in enumerate(inks, start=1):
        mask = label == i
        hexc = "#%02X%02X%02X" % tuple(int(v) for v in np.clip(c, 0, 255))
        if split:
            from scipy.ndimage import label as cc

            lab, n = cc(mask)
            sizes = sorted(((int((lab == j).sum()), j) for j in range(1, n + 1)), reverse=True)
            for rank, (size, j) in enumerate(sizes):
                if size >= max(20, mask.size * 0.00002):  # keep thin strokes of small type; drop specks
                    parts.append({"name": f"c{i}_{rank}", "fill": hexc, "d": trace(lab == j)})
        else:
            parts.append({"name": f"c{i}", "fill": hexc, "d": trace(mask)})
    data = {"width": int(x1 - x0), "height": int(y1 - y0), "source": f"traced from {src.name} by tools/trace-logo.py", "parts": parts}
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"{out}: {data['width']}×{data['height']}, {len(parts)} parts: " + ", ".join(f"{p['name']} {p['fill']}" for p in parts))


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main(sys.argv[1:])
