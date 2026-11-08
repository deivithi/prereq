"""Generate the PWA icons and the social card from the Prereq crest (same geometry as site/icon.svg)."""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

SITE = Path(__file__).resolve().parent.parent / "site"
BG = (11, 11, 13)
SHIELD = (29, 28, 24)
RIM = (60, 58, 50)
INK = (245, 243, 238)
ACCENT = (255, 90, 31)
MUTED = (165, 161, 151)


def cubic(p0, p1, p2, p3, n: int = 24) -> list[tuple[float, float]]:
    pts = []
    for i in range(1, n + 1):
        t = i / n
        a = (1 - t) ** 3
        b = 3 * (1 - t) ** 2 * t
        c = 3 * (1 - t) * t ** 2
        d = t ** 3
        pts.append((a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]))
    return pts


def shield(inset: float = 0.0) -> list[tuple[float, float]]:
    """The crest outline in the 64x64 icon space (inset > 0 gives the inner rim)."""
    l, r, top, side_top, mid, bot = 7 + inset * 4, 57 - inset * 4, 3 + inset * 4.5, 11 + inset * 3.2, 30, 61 - inset * 4.7
    pts = [(32, top), (r, side_top), (r, mid)]
    pts += cubic((r, mid), (r, 46.5 - inset * 2.7), (46 - inset * 2, 56.5 - inset * 4.2), (32, bot))
    pts += cubic((32, bot), (18 + inset * 2, 56.5 - inset * 4.2), (l, 46.5 - inset * 2.7), (l, mid))
    pts += [(l, side_top)]
    return pts


def draw_crest(img: Image.Image, ox: float, oy: float, size: float) -> None:
    s = size / 64
    d = ImageDraw.Draw(img)
    tr = lambda pts: [(ox + x * s, oy + y * s) for x, y in pts]  # noqa: E731
    d.polygon(tr(shield()), fill=SHIELD, outline=RIM)
    d.line(tr(shield(1.0)) + [tr(shield(1.0))[0]], fill=RIM, width=max(1, round(1.2 * s)))
    w = max(2, round(3 * s))
    for a, b in [((21, 45), (32, 33)), ((43, 45), (32, 33)), ((32, 33), (32, 19))]:
        d.line(tr([a, b]), fill=INK, width=w)

    def dot(cx: float, cy: float, rad: float, fill, width: int = 0) -> None:
        box = [ox + (cx - rad) * s, oy + (cy - rad) * s, ox + (cx + rad) * s, oy + (cy + rad) * s]
        d.ellipse(box, fill=None if width else fill, outline=fill if width else None, width=width)

    dot(21, 45, 4.2, INK)
    dot(43, 45, 4.2, INK)
    dot(32, 33, 4.6, INK)
    dot(32, 18, 9, (255, 90, 31), width=max(1, round(1.5 * s)))
    dot(32, 18, 6, ACCENT)


def icon(size: int, maskable: bool) -> Image.Image:
    img = Image.new("RGB", (size, size), BG)
    pad = size * (0.2 if maskable else 0.04)  # maskable keeps the crest inside the 80% safe zone
    draw_crest(img, pad, pad, size - 2 * pad)
    return img


def font(names: list[str], size: int) -> ImageFont.FreeTypeFont:
    for name in names:
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def og() -> Image.Image:
    w, h = 1200, 630
    img = Image.new("RGB", (w, h), BG)
    glow = Image.new("RGB", (w, h), BG)
    gd = ImageDraw.Draw(glow)
    for i in range(40):  # soft orange glow behind the crest, drawn as rings
        r = 420 - i * 9
        c = tuple(int(BG[k] + (ACCENT[k] - BG[k]) * (i / 40) * 0.22) for k in range(3))
        gd.ellipse([980 - r, 300 - r, 980 + r, 300 + r], fill=c)
    img.paste(glow)
    draw_crest(img, 820, 140, 320)
    d = ImageDraw.Draw(img)
    serif = ["georgiab.ttf", "timesbd.ttf"]
    mono = ["consola.ttf", "cour.ttf"]
    d.text((72, 72), "PREREQ", font=font(["consolab.ttf"] + mono, 30), fill=ACCENT)
    d.text((72, 150), "Learn AI in the order", font=font(serif, 66), fill=INK)
    d.text((72, 232), "it actually makes sense.", font=font(serif, 66), fill=INK)
    sub = font(mono, 25)
    d.text((72, 360), "221 videos experts keep recommending:", font=sub, fill=MUTED)
    d.text((72, 396), "20 years of Hacker News + real course syllabi,", font=sub, fill=MUTED)
    d.text((72, 432), "wired into a map of prerequisites.", font=sub, fill=MUTED)
    x = 72
    for i, s in enumerate(["math", "ML", "nets", "transformers", "LLMs"]):
        f = font(["consolab.ttf"] + mono, 22)
        tw = d.textlength(s, font=f)
        last = i == 4
        d.rounded_rectangle([x, 520, x + tw + 28, 558], radius=19, fill=ACCENT if last else (31, 31, 37))
        d.text((x + 14, 539), s, font=f, fill=(255, 255, 255) if last else INK, anchor="lm")
        x += tw + 28 + 8
        if not last:
            d.text((x, 539), "→", font=font(mono, 22), fill=MUTED, anchor="lm")
            x += 26
    return img


if __name__ == "__main__":
    icon(192, False).save(SITE / "icon-192.png")
    icon(512, False).save(SITE / "icon-512.png")
    icon(512, True).save(SITE / "icon-maskable-512.png")
    og().save(SITE / "og.png")
    print("ok", sorted(p.name for p in SITE.glob("*.png")))
