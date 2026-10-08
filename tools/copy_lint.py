"""Ad-copy check: flag absolute claims that China's Advertising Law (广告法 第九条) forbids in commercial copy.

    python tools/copy_lint.py                 # the promo: promo/promo.json + string literals in src/promo/scenes/
    python tools/copy_lint.py FILE...         # any text / JSON / TSX files

A narrated explainer may say 「最重要的一点」; an ad may not say 「最好的水果」. So this runs on the promo by default (and in
pytest), not on tts/script.json. It is a word list, not a lawyer: it catches the common superlatives and
「第一/唯一/顶级/100%」-style claims; unverifiable facts (产地、价格、"每日上新") still need a human to confirm.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# 最 + an evaluative word, and the usual absolute / ranking / guarantee terms
PATTERNS = [
    r"最[佳好优强大高低先新美全便宜划算棒受欢迎具专正鲜甜]",
    r"第一(?!场|次|个|步|章|节|页|行|列|轮|眼)",
    r"(?<!不)唯一",
    r"顶级|顶尖|极致|极品|首选|首个|首家|独家|王牌|冠军|无敌|万能|永久|绝对|史无前例|全网|全国领先|世界级|国家级",
    r"100\s*%|百分之百|零风险|无副作用|包治|根治|立竿见影",
    r"\b(?:best|No\.?\s*1|number one|#1)\b",
]
RX = re.compile("|".join(PATTERNS), re.I)
CJK_STRING = re.compile(r"""(['"`])((?:(?!\1).)*[一-鿿](?:(?!\1).)*)\1""")


def lint_text(text):
    """[(match, context)] for every flagged term in `text`"""
    return [(m.group(0), text[max(0, m.start() - 8):m.end() + 8]) for m in RX.finditer(text)]


def strings_of(path):
    """the human-facing strings of a file: JSON/TXT as is; for code, quoted literals and JSX text with Chinese in them"""
    s = path.read_text(encoding="utf-8")
    if path.suffix in (".tsx", ".ts", ".jsx", ".js"):
        s = re.sub(r"/\*.*?\*/|//[^\n]*", "", s, flags=re.S)  # comments are not copy
        parts = [m.group(2) for m in CJK_STRING.finditer(s)]
        parts += re.findall(r">([^<>{}]*[一-鿿][^<>{}]*)<", s)
        return "\n".join(parts)
    return s


def default_files():
    return [ROOT / "promo" / "promo.json", *sorted((ROOT / "src" / "promo" / "scenes").glob("*.tsx"))]


def main(argv):
    files = [Path(a) for a in argv] or default_files()
    hits = 0
    for f in files:
        for word, ctx in lint_text(strings_of(f)):
            hits += 1
            print(f"{f.relative_to(ROOT) if f.is_absolute() else f}: 「{word}」 in …{ctx.strip()}…")
    if hits:
        sys.exit(f"✖ {hits} absolute claim(s) — rephrase (广告法 第九条), or confirm with whoever signs off the ad")
    print(f"copy ok ({len(files)} files)")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main(sys.argv[1:])
