"""Build a balanced, resized training set from reviewed candidate folders."""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import re
from pathlib import Path

from PIL import Image, ImageOps


IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".webp"}
OPEN_IMAGES_NAME = re.compile(r"oi_(validation|test)_([a-f0-9]+)\.jpg$")
BOX_LABELS = {
    "soft-toy": "/m/0kmg4",
    "headphones": "/m/01b7fy",
    "phone": "/m/050k8",
    "tablet": "/m/0bh9flk",
    "jacket": "/m/032b3c",
    "chair": "/m/01mzpv",
    "desk": "/m/01y9k5",
    "shelf": "/m/0gjbg72",
    "backpack": "/m/01940j",
    "mug": "/m/02jvh9",
    "lamp": "/m/0dtln",
    "towel": "/m/0162_1",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--candidates", type=Path, default=Path("training/candidates"))
    parser.add_argument("--output", type=Path, default=Path("training/data"))
    parser.add_argument("--metadata", type=Path, default=Path("training/candidates/_openimages"))
    parser.add_argument("--per-class", type=int, default=40)
    parser.add_argument("--size", type=int, default=512)
    return parser.parse_args()


def source_files(class_dir: Path, per_class: int) -> list[Path]:
    commons = sorted(path for path in class_dir.glob("commons_*") if path.suffix.lower() in IMAGE_SUFFIXES)
    open_images = sorted(path for path in class_dir.glob("oi_*") if path.suffix.lower() in IMAGE_SUFFIXES)
    # Precise Commons categories replace broader Open Images labels when enough
    # examples are available; otherwise human-verified Open Images is used.
    return commons if len(commons) >= per_class else open_images + commons


def image_fingerprint(image: Image.Image) -> str:
    sample = ImageOps.fit(image.convert("L"), (16, 16))
    return hashlib.sha256(sample.tobytes()).hexdigest()


def load_boxes(metadata_dir: Path, chosen: dict[str, list[Path]]) -> dict[tuple[str, str], tuple[float, ...]]:
    wanted: dict[tuple[str, str], str] = {}
    for class_id, paths in chosen.items():
        label = BOX_LABELS.get(class_id)
        if not label:
            continue
        for path in paths:
            match = OPEN_IMAGES_NAME.match(path.name)
            if match:
                wanted[(match.group(1), match.group(2))] = label

    boxes: dict[tuple[str, str], tuple[float, ...]] = {}
    areas: dict[tuple[str, str], float] = {}
    for split in ("validation", "test"):
        path = metadata_dir / f"{split}-bbox.csv"
        with path.open(newline="", encoding="utf-8") as file:
            for row in csv.DictReader(file):
                key = (split, row["ImageID"])
                if wanted.get(key) != row["LabelName"] or row["IsDepiction"] != "0":
                    continue
                box = tuple(float(row[name]) for name in ("XMin", "YMin", "XMax", "YMax"))
                area = (box[2] - box[0]) * (box[3] - box[1])
                if area > areas.get(key, 0):
                    areas[key] = area
                    boxes[key] = box
    return boxes


def crop_to_box(image: Image.Image, source: Path, boxes: dict) -> Image.Image:
    match = OPEN_IMAGES_NAME.match(source.name)
    if not match or (box := boxes.get((match.group(1), match.group(2)))) is None:
        return image
    width, height = image.size
    xmin, ymin, xmax, ymax = box
    margin_x = (xmax - xmin) * 0.08
    margin_y = (ymax - ymin) * 0.08
    pixels = (
        int(max(0, xmin - margin_x) * width),
        int(max(0, ymin - margin_y) * height),
        int(min(1, xmax + margin_x) * width),
        int(min(1, ymax + margin_y) * height),
    )
    return image.crop(pixels)


def main() -> None:
    args = parse_args()
    classes = json.loads(Path("training/classes.json").read_text(encoding="utf-8"))
    summary: dict[str, int] = {}
    chosen = {
        entry["itemId"]: source_files(args.candidates / entry["itemId"], args.per_class)
        for entry in classes
    }
    boxes = load_boxes(args.metadata, chosen)

    for entry in classes:
        class_id = entry["itemId"]
        candidates = chosen[class_id]
        if len(candidates) < args.per_class:
            raise RuntimeError(f"{class_id}: only {len(candidates)} candidates; need {args.per_class}")
        output_dir = args.output / class_id
        output_dir.mkdir(parents=True, exist_ok=True)
        seen: set[str] = set()
        saved = 0
        for source in candidates:
            try:
                with Image.open(source) as opened:
                    image = ImageOps.exif_transpose(opened).convert("RGB")
                    image = crop_to_box(image, source, boxes)
                    fingerprint = image_fingerprint(image)
                    if fingerprint in seen:
                        continue
                    seen.add(fingerprint)
                    image.thumbnail((args.size, args.size), Image.Resampling.LANCZOS)
                    image.save(output_dir / f"{saved + 1:03d}.jpg", quality=90, optimize=True)
            except OSError:
                continue
            saved += 1
            if saved == args.per_class:
                break
        if saved < args.per_class:
            raise RuntimeError(f"{class_id}: only {saved} unique readable images; need {args.per_class}")
        summary[class_id] = saved
        print(f"[{class_id}] prepared {saved}")

    (args.output / "dataset-summary.json").write_text(
        json.dumps(summary, indent=2), encoding="utf-8"
    )
    print(f"Prepared {sum(summary.values())} balanced training images")


if __name__ == "__main__":
    main()
