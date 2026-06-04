from __future__ import annotations

import math
from pathlib import Path

import imageio.v2 as imageio
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
PUBLIC_MEDIA = ROOT / "public" / "media"
PUBLIC_MEDIA.mkdir(parents=True, exist_ok=True)


def load_font(size: int, bold: bool = False):
    candidates = [
        "C:/Windows/Fonts/seguisb.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf",
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
    ]
    for candidate in candidates:
        if Path(candidate).exists():
            return ImageFont.truetype(candidate, size=size)
    return ImageFont.load_default()


FONT_XS = load_font(14)
FONT_SM = load_font(18)
FONT_MD = load_font(24, bold=True)
FONT_LG = load_font(34, bold=True)
FONT_XL = load_font(46, bold=True)


def rgba(hex_color: str, alpha: int = 255):
    hex_color = hex_color.lstrip("#")
    return tuple(int(hex_color[i : i + 2], 16) for i in (0, 2, 4)) + (alpha,)


def gradient(width: int, height: int, top: str, bottom: str):
    top_rgba = np.array(rgba(top), dtype=np.float32)
    bottom_rgba = np.array(rgba(bottom), dtype=np.float32)
    ratio = np.linspace(0, 1, height, dtype=np.float32)[:, None]
    strip = top_rgba * (1 - ratio) + bottom_rgba * ratio
    pixels = np.repeat(strip[:, None, :], width, axis=1).astype(np.uint8)
    return Image.fromarray(pixels, "RGBA")


def rounded(draw: ImageDraw.ImageDraw, box, radius, fill=None, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def add_glow(base: Image.Image, blobs):
    layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    for (cx, cy), radius, color in blobs:
      draw.ellipse((cx - radius, cy - radius, cx + radius, cy + radius), fill=color)
    base.alpha_composite(layer.filter(ImageFilter.GaussianBlur(46)))


def draw_topbar(draw: ImageDraw.ImageDraw, width: int):
    rounded(draw, (28, 24, width - 28, 64), 20, fill=(13, 22, 38, 216), outline=(255, 255, 255, 20))
    for idx, color in enumerate(["#fb7185", "#fbbf24", "#60a5fa"]):
        draw.ellipse((48 + idx * 18, 38, 58 + idx * 18, 48), fill=rgba(color))
    draw.text((122, 33), "communium.app", font=FONT_XS, fill=(226, 232, 240, 188))


def stat_card(draw: ImageDraw.ImageDraw, box, title: str, value: str, accent: str):
    rounded(draw, box, 22, fill=(10, 18, 34, 212), outline=(255, 255, 255, 24))
    x0, y0, _, _ = box
    draw.text((x0 + 16, y0 + 14), title, font=FONT_XS, fill=(191, 219, 254, 216))
    draw.text((x0 + 16, y0 + 38), value, font=FONT_MD, fill=rgba(accent))


def frame_main(progress: float, width: int, height: int):
    base = gradient(width, height, "#071120", "#0d1b32")
    add_glow(
        base,
        [
            ((170, 120), 160, (56, 189, 248, 78)),
            ((width - 140, 120), 150, (59, 130, 246, 72)),
            ((width - 170, height - 90), 180, (45, 212, 191, 48)),
        ],
    )
    draw = ImageDraw.Draw(base)
    draw_topbar(draw, width)
    phase = progress * math.tau

    px, py, pw, ph = 34, 96, 540, 384
    rounded(draw, (px, py, px + pw, py + ph), 28, fill=(7, 13, 26, 232), outline=(120, 145, 220, 42))
    draw.ellipse((px + 26, py + 26, px + 98, py + 98), fill=(55, 105, 235, 255))
    draw.ellipse((px + 36, py + 38, px + 88, py + 90), fill=(236, 244, 255, 255))
    draw.text((px + 118, py + 30), "Masinandro Rasolonjatovo", font=FONT_MD, fill=(248, 250, 252, 255))
    draw.text((px + 118, py + 68), "Developpeur Full Stack · EST Fes", font=FONT_SM, fill=(179, 198, 226, 232))

    badge_x = px + pw - 136
    rounded(draw, (badge_x, py + 26, badge_x + 110, py + 60), 17, fill=(95, 62, 230, 235))
    draw.text((badge_x + 20, py + 35), "Premium", font=FONT_XS, fill=(255, 255, 255, 255))

    stats_y = py + 126
    stat_card(draw, (px + 22, stats_y, px + 176, stats_y + 94), "Vues du profil", f"{1240 + int(math.sin(phase * 2.2) * 64)}", "#93c5fd")
    stat_card(draw, (px + 190, stats_y, px + 344, stats_y + 94), "Connexions", f"{92 + int(progress * 8) % 7}", "#67e8f9")
    stat_card(draw, (px + 358, stats_y, px + 512, stats_y + 94), "CV telecharge", f"{34 + int(progress * 9) % 5}", "#facc15")

    chart_box = (px + 22, py + 240, px + pw - 22, py + ph - 24)
    rounded(draw, chart_box, 24, fill=(12, 23, 43, 234), outline=(255, 255, 255, 18))
    cx0, cy0, cx1, cy1 = chart_box
    for idx in range(5):
        yy = cy0 + 30 + idx * 34
        draw.line((cx0 + 20, yy, cx1 - 20, yy), fill=(255, 255, 255, 14), width=1)
    points = []
    for step in range(7):
        pxp = cx0 + 30 + step * ((cx1 - cx0 - 60) / 6)
        pyp = cy1 - 42 - (math.sin(phase * 1.4 + step * 0.55) * 18 + step * 12)
        points.append((pxp, pyp))
    draw.line(points, fill=(96, 165, 250, 255), width=4, joint="curve")
    for pxp, pyp in points:
        draw.ellipse((pxp - 5, pyp - 5, pxp + 5, pyp + 5), fill=(255, 255, 255, 255))

    fx, fy, fw, fh = 600, 114, 326, 292
    rounded(draw, (fx, fy, fx + fw, fy + fh), 28, fill=(9, 18, 34, 228), outline=(120, 145, 220, 38))
    draw.text((fx + 24, fy + 24), "Flux reseau", font=FONT_SM, fill=(191, 219, 254, 230))
    labels = ["Projet SaaS", "Publication premium", "Nouvelle connexion"]
    metas = ["128 J'aime", "Gold", "37 commentaires"]
    for idx in range(3):
        cy = fy + 72 + idx * 98 - int(math.sin(phase * 1.2 + idx) * 10)
        rounded(draw, (fx + 18, cy, fx + fw - 18, cy + 82), 20, fill=(255, 255, 255, 245))
        draw.ellipse((fx + 34, cy + 18, fx + 66, cy + 50), fill=(75, 120, 235, 255))
        draw.text((fx + 82, cy + 18), labels[idx], font=FONT_SM, fill=(15, 23, 42, 255))
        bar_w = int((fw - 150) * (0.62 + 0.16 * math.sin(phase * 1.8 + idx)))
        rounded(draw, (fx + 82, cy + 48, fx + 82 + bar_w, cy + 60), 6, fill=(208, 220, 238, 255))
        draw.text((fx + fw - 146, cy + 18), metas[idx], font=FONT_XS, fill=(37, 99, 235, 255))

    bob = math.sin(phase * 2.4) * 6
    rounded(draw, (620, 428 + bob, 768, 492 + bob), 18, fill=(255, 255, 255, 244))
    draw.text((636, 444 + bob), "3 notifications", font=FONT_SM, fill=(15, 23, 42, 255))
    draw.text((636, 466 + bob), "Nouveaux signaux premium", font=FONT_XS, fill=(71, 85, 105, 255))

    shift = int(math.sin(phase * 2.0) * 14)
    rounded(draw, (714, 454, 896, 516), 18, fill=(24, 54, 112, 238))
    draw.text((730, 471), "Message", font=FONT_SM, fill=(255, 255, 255, 255))
    draw.text((730, 492), "Profil interessant pour une mission", font=FONT_XS, fill=(219, 234, 254, 228))
    rounded(draw, (756 + shift, 532, 912 + shift, 584), 18, fill=(255, 255, 255, 242))
    draw.text((772 + shift, 548), "Disponible cette semaine", font=FONT_XS, fill=(15, 23, 42, 255))
    return base


def frame_network(progress: float, width: int, height: int):
    base = gradient(width, height, "#08121f", "#0e1f36")
    add_glow(base, [((120, 70), 110, (59, 130, 246, 82)), ((width - 90, height - 70), 120, (45, 212, 191, 52))])
    draw = ImageDraw.Draw(base)
    draw_topbar(draw, width)
    phase = progress * math.tau
    center = (width // 2, height // 2 + 24)
    node_positions = [(120, 120), (width - 150, 110), (90, height - 90), (width - 160, height - 88), center]
    for node in node_positions[:-1]:
        draw.line((center[0], center[1], node[0], node[1]), fill=(96, 165, 250, 110), width=3)
    for idx, (nx, ny) in enumerate(node_positions):
        pulse = 8 * (0.5 + 0.5 * math.sin(phase * 2.1 + idx))
        draw.ellipse((nx - 26 - pulse, ny - 26 - pulse, nx + 26 + pulse, ny + 26 + pulse), fill=(56, 189, 248, 34))
        draw.ellipse((nx - 24, ny - 24, nx + 24, ny + 24), fill=(255, 255, 255, 248))
        draw.ellipse((nx - 16, ny - 16, nx + 16, ny + 16), fill=(37, 99, 235, 255))
    rounded(draw, (34, height - 88, width - 34, height - 30), 24, fill=(255, 255, 255, 238))
    draw.text((52, height - 71), "Suggestions, interactions et connexions qualifiees", font=FONT_SM, fill=(15, 23, 42, 255))
    return base


def frame_premium(progress: float, width: int, height: int):
    base = gradient(width, height, "#0b1322", "#151b32")
    add_glow(base, [((width - 120, 90), 130, (250, 204, 21, 80)), ((120, height - 70), 110, (96, 165, 250, 52))])
    draw = ImageDraw.Draw(base)
    draw_topbar(draw, width)
    phase = progress * math.tau
    x0, y0, x1, y1 = 36, 86, width - 36, height - 38
    rounded(draw, (x0, y0, x1, y1), 30, fill=(255, 247, 214, 248), outline=(250, 204, 21, 120))
    rounded(draw, (x0 + 22, y0 + 18, x0 + 170, y0 + 54), 18, fill=(250, 204, 21, 230))
    draw.text((x0 + 42, y0 + 30), "PACK GOLD", font=FONT_XS, fill=(120, 53, 15, 255))
    draw.text((x0 + 24, y0 + 78), "Visibilite renforcee", font=FONT_LG, fill=(120, 53, 15, 255))
    draw.text((x0 + 24, y0 + 126), "250 DH", font=FONT_XL, fill=(180, 83, 9, 255))
    rounded(draw, (x0 + 24, y0 + 194, x1 - 24, y0 + 286), 22, fill=(255, 255, 255, 224))
    values = [64 + int(math.sin(phase * 1.7) * 7), 92 + int(math.sin(phase * 2.1 + 1.2) * 8), 44 + int(math.sin(phase * 2.3 + 2.1) * 6)]
    labels = ["Vues du profil", "Apparitions", "Posts premium"]
    for idx, value in enumerate(values):
        yv = y0 + 212 + idx * 24
        draw.text((x0 + 42, yv), labels[idx], font=FONT_XS, fill=(71, 85, 105, 255))
        draw.text((x1 - 106, yv - 4), str(value), font=FONT_SM, fill=(15, 23, 42, 255))
    rounded(draw, (x0 + 24, y1 - 76, x1 - 24, y1 - 24), 24, fill=(234, 179, 8, 255))
    draw.text((x0 + 44, y1 - 60), "Profil prioritaire dans les suggestions", font=FONT_SM, fill=(24, 24, 27, 255))
    return base


def render_video(path: Path, poster_path: Path, frame_builder, width: int, height: int, duration: float, fps: int = 16):
    frames = []
    total = int(duration * fps)
    for idx in range(total):
        frame = frame_builder(idx / total, width, height)
        if idx == 0:
            frame.save(poster_path)
        frames.append(np.asarray(frame.convert("RGB")))

    writer = imageio.get_writer(
        path,
        fps=fps,
        codec="libx264",
        format="FFMPEG",
        macro_block_size=1,
        ffmpeg_log_level="error",
        quality=7,
        pixelformat="yuv420p",
    )
    try:
        for frame in frames:
            writer.append_data(frame)
    finally:
        writer.close()


def main():
    render_video(PUBLIC_MEDIA / "communium-immersion-main.mp4", PUBLIC_MEDIA / "communium-immersion-main-poster.png", frame_main, 960, 540, 6.0)
    render_video(PUBLIC_MEDIA / "communium-immersion-network.mp4", PUBLIC_MEDIA / "communium-immersion-network-poster.png", frame_network, 640, 360, 5.2)
    render_video(PUBLIC_MEDIA / "communium-immersion-premium.mp4", PUBLIC_MEDIA / "communium-immersion-premium-poster.png", frame_premium, 640, 360, 5.2)


if __name__ == "__main__":
    main()
