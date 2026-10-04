"""Tile review stills into 2x2 contact sheets: python tools/sheet.py s01 [s02 ...] → out/sheets/<scene>_<n>.png

Reads out/stills/<scene>_*.png (from tools/stills.mjs), in render order. Needs Pillow.
"""
import sys

from PIL import Image

from kit import CFG, ROOT

W, H = CFG["width"], CFG["height"]
GAP = 4
CW, CH = (W - GAP) // 2, (H - GAP) // 2

out = ROOT / "out" / "sheets"
out.mkdir(parents=True, exist_ok=True)
if len(sys.argv) < 2:
    sys.exit("usage: python tools/sheet.py s01 [s02 ...]")
for sid in sys.argv[1:]:
    files = sorted((ROOT / "out" / "stills").glob(f"{sid}_*.png"), key=lambda p: p.stat().st_mtime)
    if not files:
        print(f"{sid}: no stills in out/stills (run node tools/stills.mjs {sid} first)")
    for k in range(0, len(files), 4):
        sheet = Image.new("RGB", (W, H), (40, 40, 40))
        for j, fp in enumerate(files[k:k + 4]):
            im = Image.open(fp).convert("RGB").resize((CW, CH))
            sheet.paste(im, ((j % 2) * (CW + GAP), (j // 2) * (CH + GAP)))
        p = out / f"{sid}_{k // 4}.png"
        sheet.save(p)
        print(p, [f.stem for f in files[k:k + 4]])
