"""Generate PWA icons and the social preview image for the Prereq site."""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

SITE = Path(__file__).resolve().parent.parent / "site"
INK = (25, 24, 19)
PAPER = (246, 243, 236)
ACCENT = (181, 64, 15)


def font(size: int, bold: bool = True) -> ImageFont.FreeTypeFont:
    for name in (["consolab.ttf", "segoeuib.ttf", "arialbd.ttf"] if bold else ["consola.ttf", "segoeui.ttf", "arial.ttf"]):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def icon(size: int, maskable: bool) -> Image.Image:
    img = Image.new("RGB", (size, size), INK if maskable else PAPER)
    d = ImageDraw.Draw(img)
    pad = 0 if maskable else round(size * 0.06)
    if not maskable:
        d.rounded_rectangle([pad, pad, size - pad, size - pad], radius=round(size * 0.22), fill=INK)
    f = font(round(size * (0.46 if maskable else 0.56)))
    d.text((size / 2, size / 2), "P", font=f, fill=PAPER, anchor="mm")
    bar = round(size * 0.07)
    d.rectangle([size * 0.32, size * 0.74, size * 0.68, size * 0.74 + bar * 0.6], fill=ACCENT)
    return img


def og() -> Image.Image:
    w, h = 1200, 630
    img = Image.new("RGB", (w, h), PAPER)
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([72, 72, 132, 132], radius=14, fill=INK)
    d.text((102, 102), "P", font=font(40), fill=PAPER, anchor="mm")
    d.text((150, 102), "Prereq", font=font(40), fill=INK, anchor="lm")
    d.text((72, 210), "Learn AI in the order", font=font(76), fill=INK)
    d.text((72, 300), "it actually makes sense.", font=font(76), fill=INK)
    d.text((72, 430), "The videos experts keep recommending — 20 years of Hacker News", font=font(28, False), fill=(93, 90, 80))
    d.text((72, 472), "+ real course syllabi — ordered into a trail with prerequisites.", font=font(28, False), fill=(93, 90, 80))
    steps = ["math", "ML", "neural nets", "transformers", "LLMs", "frontier"]
    x = 72
    for i, s in enumerate(steps):
        f = font(24)
        tw = d.textlength(s, font=f)
        d.rounded_rectangle([x, 548, x + tw + 28, 588], radius=20, fill=ACCENT if i == len(steps) - 1 else (236, 231, 218))
        d.text((x + 14, 568), s, font=f, fill=PAPER if i == len(steps) - 1 else INK, anchor="lm")
        x += tw + 28 + 10
        if i < len(steps) - 1:
            d.text((x - 2, 568), "→", font=font(24, False), fill=(93, 90, 80), anchor="lm")
            x += 22
    return img


if __name__ == "__main__":
    icon(192, False).save(SITE / "icon-192.png")
    icon(512, False).save(SITE / "icon-512.png")
    icon(512, True).save(SITE / "icon-maskable-512.png")
    og().save(SITE / "og.png")
    print("ok", sorted(p.name for p in SITE.glob("*.png")))
