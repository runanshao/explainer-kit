"""Tile PNG frames into one labelled contact sheet (used by tools/promo-sheet.mjs).

    python tools/tile.py OUT.png COLS "a.png|label" "b.png|label" ...
"""
import sys

from PIL import Image, ImageDraw, ImageFont


def main(argv):
    out, cols, items = argv[0], int(argv[1]), [(a.split("|", 1) + [""])[:2] for a in argv[2:]]
    ims = [(Image.open(p).convert("RGB"), lab) for p, lab in items]
    w, h = ims[0][0].size
    rows = (len(ims) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * w, rows * h), (17, 17, 17))
    draw = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype("consola.ttf", max(12, w // 16))
    except OSError:
        font = ImageFont.load_default()
    for i, (im, lab) in enumerate(ims):
        x, y = (i % cols) * w, (i // cols) * h
        sheet.paste(im, (x, y))
        if lab:
            tw = draw.textlength(lab, font=font)
            draw.rectangle([x + w - tw - 10, y + 4, x + w - 4, y + 6 + font.size], fill=(0, 0, 0))
            draw.text((x + w - tw - 7, y + 4), lab, fill=(255, 216, 74), font=font)
    sheet.save(out)
    print(out)


if __name__ == "__main__":
    main(sys.argv[1:])
