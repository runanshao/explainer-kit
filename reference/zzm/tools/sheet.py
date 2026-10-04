"""Tile review stills into 2x2 sheets: python tools/sheet.py s01 → out/sheets/s01_*.png"""
import sys
from pathlib import Path
from PIL import Image
root = Path(__file__).resolve().parent.parent
out = root / "out" / "sheets"
out.mkdir(parents=True, exist_ok=True)
for sid in sys.argv[1:]:
    files = sorted((root / "out" / "stills").glob(f"{sid}_*.png"), key=lambda p: p.stat().st_mtime)
    for k in range(0, len(files), 4):
        sheet = Image.new("RGB", (1920, 1080), (40, 40, 40))
        for j, fp in enumerate(files[k:k + 4]):
            im = Image.open(fp).convert("RGB").resize((958, 538))
            sheet.paste(im, ((j % 2) * 962, (j // 2) * 542))
        p = out / f"{sid}_{k // 4}.png"
        sheet.save(p)
        print(p, [f.stem for f in files[k:k + 4]])
