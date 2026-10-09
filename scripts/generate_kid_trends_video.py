#!/usr/bin/env python3
"""Generate the silent circular-economy story used on the welcome page."""

from __future__ import annotations

import math
import shutil
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont


WIDTH = 960
HEIGHT = 768
FPS = 24
DURATION = 12
FONT_REGULAR = "/System/Library/Fonts/Supplemental/Arial.ttf"
FONT_BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "public" / "assets"
VIDEO_PATH = OUTPUT_DIR / "circular-economy-story.mp4"
POSTER_PATH = OUTPUT_DIR / "circular-economy-story-poster.png"


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(FONT_BOLD if bold else FONT_REGULAR, size)


def clamp(value: float, low: float = 0, high: float = 1) -> float:
    return max(low, min(high, value))


def ease_out(value: float) -> float:
    value = clamp(value)
    return 1 - (1 - value) ** 3


def ease_out_back(value: float) -> float:
    value = clamp(value)
    c1 = 1.70158
    c3 = c1 + 1
    return 1 + c3 * (value - 1) ** 3 + c1 * (value - 1) ** 2


def centered_text(
    draw: ImageDraw.ImageDraw,
    xy: tuple[float, float],
    value: str,
    text_font: ImageFont.FreeTypeFont,
    fill: str,
) -> None:
    draw.text(xy, value, font=text_font, fill=fill, anchor="mm")


def make_background() -> Image.Image:
    image = Image.new("RGB", (WIDTH, HEIGHT), "#f7fcff")
    draw = ImageDraw.Draw(image)
    top = (255, 249, 220)
    middle = (247, 252, 255)
    bottom = (233, 248, 224)
    for y in range(HEIGHT):
        if y < HEIGHT / 2:
            amount = y / (HEIGHT / 2)
            start, end = top, middle
        else:
            amount = (y - HEIGHT / 2) / (HEIGHT / 2)
            start, end = middle, bottom
        color = tuple(round(start[i] + (end[i] - start[i]) * amount) for i in range(3))
        draw.line((0, y, WIDTH, y), fill=color)
    draw.ellipse((-90, -70, 180, 200), fill=(255, 255, 255, 125))
    draw.ellipse((830, 55, 1030, 255), fill=(214, 242, 255, 145))
    return image.convert("RGBA")


def fade(layer: Image.Image, opacity: float) -> Image.Image:
    if opacity >= 1:
        return layer
    result = layer.copy()
    result.putalpha(result.getchannel("A").point(lambda pixel: round(pixel * clamp(opacity))))
    return result


def composite_scene(base: Image.Image, layer: Image.Image, opacity: float, offset_x: int = 0) -> None:
    if opacity <= 0:
        return
    base.alpha_composite(fade(layer, opacity), (offset_x, 0))


def scene_strength(time: float, start: float, end: float, final: bool = False) -> tuple[float, int]:
    if time < start or time > end:
        return 0, 0
    enter = ease_out((time - start) / 0.35)
    leave = 1 if final else clamp((end - time) / 0.35)
    return min(enter, leave), round(70 * (1 - enter))


def rounded_panel(layer: Image.Image, fill: str) -> None:
    shadow = Image.new("RGBA", layer.size, (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    shadow_draw.rounded_rectangle((70, 135, 890, 715), radius=48, fill=(56, 91, 100, 38))
    layer.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(18)))
    ImageDraw.Draw(layer).rounded_rectangle((70, 120, 890, 700), radius=48, fill=fill, outline="#ffffff", width=5)


def make_bottle(color: str = "#75c9ef") -> Image.Image:
    sprite = Image.new("RGBA", (100, 150), (0, 0, 0, 0))
    draw = ImageDraw.Draw(sprite)
    draw.rounded_rectangle((38, 5, 62, 21), radius=4, fill="#35525e")
    draw.rectangle((42, 20, 58, 33), fill="#d9f4ff")
    draw.rounded_rectangle((20, 30, 80, 139), radius=22, fill="#eefbff", outline="#ffffff", width=5)
    draw.rounded_rectangle((26, 65, 74, 108), radius=12, fill=color)
    draw.ellipse((36, 48, 43, 55), fill="#2f3d43")
    draw.ellipse((57, 48, 64, 55), fill="#2f3d43")
    draw.arc((39, 49, 61, 70), start=20, end=160, fill="#2f3d43", width=3)
    draw.line((20, 75, 7, 66), fill="#35525e", width=4)
    draw.line((80, 75, 93, 63), fill="#35525e", width=4)
    draw.ellipse((5, 62, 11, 68), fill="#35525e")
    draw.ellipse((90, 59, 96, 65), fill="#35525e")
    return sprite


def paste_sprite(base: Image.Image, sprite: Image.Image, center: tuple[float, float], scale: float = 1, rotation: float = 0, opacity: float = 1) -> None:
    size = (max(1, round(sprite.width * scale)), max(1, round(sprite.height * scale)))
    placed = sprite.resize(size, Image.Resampling.LANCZOS)
    if rotation:
        placed = placed.rotate(rotation, resample=Image.Resampling.BICUBIC, expand=True)
    placed = fade(placed, opacity)
    position = (round(center[0] - placed.width / 2), round(center[1] - placed.height / 2))
    base.alpha_composite(placed, position)


def draw_sparkles(draw: ImageDraw.ImageDraw, time: float, color: str = "#f1b92e") -> None:
    for index, (x, y) in enumerate(((116, 190), (850, 215), (820, 630), (145, 640))):
        pulse = 6 + 4 * math.sin(time * 5 + index)
        draw.line((x - pulse, y, x + pulse, y), fill=color, width=4)
        draw.line((x, y - pulse, x, y + pulse), fill=color, width=4)


def draw_direction_arrow(draw: ImageDraw.ImageDraw, center: tuple[int, int], color: str, down: bool) -> None:
    cx, cy = center
    if down:
        draw.line((cx - 34, cy - 34, cx + 28, cy + 28), fill=color, width=14)
        draw.line((cx - 4, cy + 28, cx + 28, cy + 28, cx + 28, cy - 4), fill=color, width=14, joint="curve")
    else:
        draw.line((cx - 34, cy + 34, cx + 28, cy - 28), fill=color, width=14)
        draw.line((cx - 4, cy - 28, cx + 28, cy - 28, cx + 28, cy + 4), fill=color, width=14, joint="curve")


BACKGROUND = make_background()


def intro_scene(time: float) -> Image.Image:
    layer = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    centered_text(draw, (480, 78), "Australia's Waste Story", font(45, True), "#2f3d43")
    centered_text(draw, (480, 126), "A 2024–25 snapshot", font(23, True), "#6a777c")

    progress = ease_out_back(clamp((time - 0.18) / 0.65))
    cards = (
        (105, "79.0", "MILLION TONNES", "waste generated", "#ff8291", "#ffe7eb"),
        (505, "67.5%", "RECOVERY RATE", "resources recovered", "#54ac63", "#e5f5df"),
    )
    for x, number, unit, label, accent, fill in cards:
        width = round(350 * max(0.1, progress))
        box = (x + (350 - width) / 2, 205, x + (350 + width) / 2, 500)
        draw.rounded_rectangle(box, radius=38, fill=fill, outline="#ffffff", width=6)
        centered_text(draw, (x + 175, 305), number, font(66, True), accent)
        centered_text(draw, (x + 175, 365), unit, font(21, True), "#2f3d43")
        centered_text(draw, (x + 175, 420), label, font(22, True), "#68777c")

    centered_text(draw, (480, 592), "Most recovered material is recycled.", font(28, True), "#2f3d43")
    centered_text(draw, (480, 635), "But useful things can also be reused and repaired.", font(22, True), "#5f6f74")
    draw_sparkles(draw, time)
    return layer


def draw_laptop(draw: ImageDraw.ImageDraw, x: int, y: int, color: str, happy: bool = False) -> None:
    draw.rounded_rectangle((x, y, x + 230, y + 145), radius=18, fill="#354f5a", outline="#ffffff", width=6)
    draw.rounded_rectangle((x + 17, y + 17, x + 213, y + 126), radius=10, fill=color)
    draw.polygon(((x - 28, y + 148), (x + 258, y + 148), (x + 224, y + 177), (x + 6, y + 177)), fill="#70858d")
    draw.rounded_rectangle((x + 88, y + 151, x + 142, y + 161), radius=5, fill="#d9e8ec")
    if happy:
        draw.ellipse((x + 78, y + 63, x + 88, y + 73), fill="#2f3d43")
        draw.ellipse((x + 142, y + 63, x + 152, y + 73), fill="#2f3d43")
        draw.arc((x + 91, y + 60, x + 139, y + 101), 15, 165, fill="#2f3d43", width=5)
    else:
        draw.line((x + 63, y + 42, x + 167, y + 100), fill="#ff8291", width=10)
        draw.line((x + 167, y + 42, x + 63, y + 100), fill="#ff8291", width=10)


def ewaste_scene(time: float, start: float) -> Image.Image:
    layer = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    rounded_panel(layer, "#e6f4ff")
    draw = ImageDraw.Draw(layer)
    centered_text(draw, (480, 175), "Old tech can have a next life", font(40, True), "#2f3d43")
    centered_text(draw, (480, 222), "Australia produces about 500,000 tonnes of e-waste a year.", font(21, True), "#68777c")

    progress = ease_out(clamp((time - start - 0.2) / 1.45))
    draw_laptop(draw, 145, 330, "#d7e3e8", happy=False)
    draw_laptop(draw, 585, 330, "#ccefc5", happy=True)
    for x in range(425, 550, 26):
        draw.ellipse((x, 405, x + 10, 415), fill="#3488de")
    draw.polygon(((545, 387), (580, 410), (545, 433)), fill="#3488de")
    sweep_x = 145 + round(440 * progress)
    draw.rounded_rectangle((sweep_x, 527, sweep_x + 180, 582), radius=24, fill="#3488de")
    centered_text(draw, (sweep_x + 90, 554), "REUSE FIRST", font(20, True), "#ffffff")
    centered_text(draw, (480, 632), "If it cannot be reused, take e-waste to a special drop-off.", font(22, True), "#2f3d43")
    return layer


def draw_shirt(draw: ImageDraw.ImageDraw, x: int, y: int, fill: str, repaired: bool) -> None:
    points = ((x + 45, y), (x + 91, y + 22), (x + 137, y), (x + 188, y + 54), (x + 157, y + 96), (x + 138, y + 76), (x + 138, y + 205), (x + 44, y + 205), (x + 44, y + 76), (x + 25, y + 96), (x - 6, y + 54))
    draw.polygon(points, fill=fill, outline="#ffffff")
    draw.line(points + (points[0],), fill="#ffffff", width=6, joint="curve")
    draw.arc((x + 54, y - 12, x + 128, y + 55), 0, 180, fill="#ffffff", width=6)
    if repaired:
        draw.ellipse((x + 86, y + 87, x + 101, y + 102), fill="#f3c84b", outline="#ffffff", width=2)
        draw.line((x + 62, y + 150, x + 122, y + 150), fill="#5eaa63", width=5)
        for stitch_x in range(x + 68, x + 122, 14):
            draw.line((stitch_x, y + 140, stitch_x, y + 160), fill="#5eaa63", width=3)
    else:
        draw.ellipse((x + 86, y + 87, x + 101, y + 102), outline="#ff8291", width=4)
        draw.line((x + 65, y + 142, x + 119, y + 157), fill="#ff8291", width=6)


def clothes_scene(time: float, start: float) -> Image.Image:
    layer = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    rounded_panel(layer, "#fff0d9")
    draw = ImageDraw.Draw(layer)
    centered_text(draw, (480, 175), "A small repair can save clothing", font(40, True), "#2f3d43")
    centered_text(draw, (480, 222), "Hobart volunteers wash, mend and rewear donated clothes.", font(21, True), "#68777c")

    progress = ease_out(clamp((time - start - 0.15) / 1.35))
    draw_shirt(draw, 175, 320, "#ff9daa", repaired=False)
    draw_shirt(draw, 595, 320, "#79c7f0", repaired=True)
    draw.line((470, 350, 470, 538), fill="#e98b3a", width=8)
    draw.polygon(((448, 520), (470, 560), (492, 520)), fill="#e98b3a")
    centered_text(draw, (470, 325), "FIX", font(24, True), "#e98b3a")
    for index in range(round(7 * progress)):
        angle = math.tau * index / 7
        sx = 685 + math.cos(angle) * 145
        sy = 430 + math.sin(angle) * 145
        draw.ellipse((sx - 6, sy - 6, sx + 6, sy + 6), fill="#f1b92e")
    centered_text(draw, (480, 628), "Minor fixes can keep useful fibres out of landfill.", font(23, True), "#2f3d43")
    return layer


def choices_scene(time: float, start: float) -> Image.Image:
    layer = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    rounded_panel(layer, "#e5f5df")
    draw = ImageDraw.Draw(layer)
    centered_text(draw, (480, 175), "Keep useful things moving", font(42, True), "#2f3d43")
    centered_text(draw, (480, 220), "A circular economy gives items more than one chance.", font(22, True), "#68777c")

    progress = ease_out_back(clamp((time - start - 0.12) / 0.65))
    options = (
        (125, "SHARE", "Pass it on", "#ff8291", "#ffe7eb"),
        (315, "REPAIR", "Fix a part", "#e98b3a", "#fff0d9"),
        (505, "REUSE", "Use again", "#3488de", "#e6f4ff"),
        (695, "RECYCLE", "Make material", "#54ac63", "#e5f5df"),
    )
    for index, (x, title, label, accent, fill) in enumerate(options):
        local = max(0.15, ease_out_back(clamp((time - start - 0.12 - index * 0.10) / 0.5)))
        height = round(250 * local * max(0.7, progress))
        y0 = 320 + (250 - height) / 2
        draw.rounded_rectangle((x, y0, x + 150, y0 + height), radius=28, fill=fill, outline="#ffffff", width=5)
        centered_text(draw, (x + 75, 395), str(index + 1), font(38, True), accent)
        centered_text(draw, (x + 75, 459), title, font(21, True), "#2f3d43")
        centered_text(draw, (x + 75, 505), label, font(16, True), "#68777c")
    centered_text(draw, (480, 625), "Repair cafes, libraries and op shops all help.", font(23, True), "#2f3d43")
    return layer


def final_scene(time: float, start: float) -> Image.Image:
    layer = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    centered_text(draw, (480, 105), "Before you bin it...", font(48, True), "#2f3d43")
    centered_text(draw, (480, 158), "Pause and look for another future.", font(25, True), "#68777c")

    steps = (
        (120, "1", "LOOK", "Spot clues", "#ff8291", "#ffe7eb"),
        (365, "2", "ASK", "Get adult help", "#3488de", "#e6f4ff"),
        (610, "3", "CHOOSE", "A safe next life", "#54ac63", "#e5f5df"),
    )
    for index, (x, number, title, label, accent, fill) in enumerate(steps):
        pop = ease_out_back(clamp((time - start - 0.10 - index * 0.14) / 0.52))
        height = round(260 * max(0.12, pop))
        y0 = 245 + (260 - height) / 2
        draw.rounded_rectangle((x, y0, x + 230, y0 + height), radius=38, fill=fill, outline="#ffffff", width=6)
        draw.ellipse((x + 80, 282, x + 150, 352), fill=accent)
        centered_text(draw, (x + 115, 317), number, font(34, True), "#ffffff")
        centered_text(draw, (x + 115, 405), title, font(30, True), "#2f3d43")
        centered_text(draw, (x + 115, 456), label, font(18, True), "#68777c")

    centered_text(draw, (480, 585), "Reuse  •  Repair  •  Share  •  Recycle", font(27, True), "#4d9d58")
    centered_text(draw, (480, 632), "Your investigation can begin a new chapter.", font(24, True), "#2f3d43")
    draw_sparkles(draw, time)
    return layer


def render_frame(time: float) -> Image.Image:
    image = BACKGROUND.copy()
    scenes = [
        (intro_scene(time), *scene_strength(time, 0.0, 2.55)),
        (ewaste_scene(time, 2.25), *scene_strength(time, 2.25, 5.05)),
        (clothes_scene(time, 4.75), *scene_strength(time, 4.75, 7.55)),
        (choices_scene(time, 7.25), *scene_strength(time, 7.25, 9.95)),
        (final_scene(time, 9.65), *scene_strength(time, 9.65, 12.0, final=True)),
    ]
    for scene, opacity, offset in scenes:
        composite_scene(image, scene, opacity, offset)
    return image.convert("RGB")


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        raise RuntimeError("ffmpeg is required to generate the video")
    command = [
        ffmpeg,
        "-hide_banner",
        "-loglevel",
        "error",
        "-y",
        "-f",
        "rawvideo",
        "-pixel_format",
        "rgb24",
        "-video_size",
        f"{WIDTH}x{HEIGHT}",
        "-framerate",
        str(FPS),
        "-i",
        "-",
        "-an",
        "-c:v",
        "libx264",
        "-preset",
        "medium",
        "-crf",
        "19",
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        str(VIDEO_PATH),
    ]
    process = subprocess.Popen(command, stdin=subprocess.PIPE)
    assert process.stdin is not None
    for frame_index in range(FPS * DURATION):
        process.stdin.write(render_frame(frame_index / FPS).tobytes())
    process.stdin.close()
    if process.wait() != 0:
        raise RuntimeError("ffmpeg could not encode the trends video")
    render_frame(10.75).save(POSTER_PATH, optimize=True)
    print(f"Created {VIDEO_PATH}")
    print(f"Created {POSTER_PATH}")


if __name__ == "__main__":
    main()
