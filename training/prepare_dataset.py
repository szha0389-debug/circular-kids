"""Validate, de-duplicate and stratify reviewed candidates for PyTorch."""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import random
import re
from pathlib import Path

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
CLASSES_PATH = Path(__file__).with_name("classes.json")
IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".webp"}
OPEN_IMAGES_NAME = re.compile(r"oi_(validation|test)_([a-f0-9]+)\.jpg$")
BOX_LABELS = {
    "soft-toy": "/m/0kmg4", "headphones": "/m/01b7fy", "phone": "/m/050k8",
    "tablet": "/m/0bh9flk", "jacket": "/m/032b3c", "chair": "/m/01mzpv",
    "desk": "/m/01y9k5", "shelf": "/m/0gjbg72", "backpack": "/m/01940j",
    "mug": "/m/02jvh9", "lamp": "/m/0dtln", "towel": "/m/0162_1",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Prepare mutually exclusive PyTorch splits")
    parser.add_argument("--candidates", type=Path, default=ROOT / "training" / "candidates")
    parser.add_argument("--output", type=Path, default=ROOT / "training" / "data-pytorch")
    parser.add_argument("--metadata", type=Path, default=ROOT / "training" / "candidates" / "_openimages")
    parser.add_argument("--per-class", type=int, default=0,
                        help="Maximum unique images per class; 0 uses every valid candidate")
    parser.add_argument("--train-ratio", type=float, default=0.70)
    parser.add_argument("--val-ratio", type=float, default=0.15)
    parser.add_argument("--test-ratio", type=float, default=0.15)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--max-side", type=int, default=1024,
                        help="Downscale only; training crops to 224")
    return parser.parse_args()


def source_files(class_dir: Path) -> list[Path]:
    """Only top-level files are candidates; .invalid and _openimages are never entered."""
    if not class_dir.is_dir():
        return []
    return sorted(path for path in class_dir.iterdir()
                  if path.is_file() and path.suffix.lower() in IMAGE_SUFFIXES)


def exact_file_hash(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def exact_pixel_hash(image: Image.Image) -> str:
    canonical = image.convert("RGB")
    digest = hashlib.sha256()
    digest.update(f"RGB:{canonical.width}x{canonical.height}".encode("ascii"))
    digest.update(canonical.tobytes())
    return digest.hexdigest()


def load_boxes(metadata_dir: Path, candidates: dict[str, list[Path]]) -> dict[tuple[str, str], tuple[float, ...]]:
    wanted: dict[tuple[str, str], str] = {}
    for class_id, paths in candidates.items():
        label = BOX_LABELS.get(class_id)
        if label:
            for path in paths:
                match = OPEN_IMAGES_NAME.match(path.name)
                if match:
                    wanted[(match.group(1), match.group(2))] = label
    boxes: dict[tuple[str, str], tuple[float, ...]] = {}
    areas: dict[tuple[str, str], float] = {}
    for source_split in ("validation", "test"):
        path = metadata_dir / f"{source_split}-bbox.csv"
        if not path.is_file():
            continue
        with path.open(newline="", encoding="utf-8") as handle:
            for row in csv.DictReader(handle):
                key = (source_split, row["ImageID"])
                if wanted.get(key) != row["LabelName"] or row["IsDepiction"] != "0":
                    continue
                box = tuple(float(row[name]) for name in ("XMin", "YMin", "XMax", "YMax"))
                area = (box[2] - box[0]) * (box[3] - box[1])
                if area > areas.get(key, 0):
                    areas[key], boxes[key] = area, box
    return boxes


def crop_to_box(image: Image.Image, source: Path, boxes: dict) -> Image.Image:
    match = OPEN_IMAGES_NAME.match(source.name)
    if not match or (box := boxes.get((match.group(1), match.group(2)))) is None:
        return image
    width, height = image.size
    xmin, ymin, xmax, ymax = box
    margin_x, margin_y = (xmax - xmin) * 0.08, (ymax - ymin) * 0.08
    return image.crop((int(max(0, xmin - margin_x) * width),
                       int(max(0, ymin - margin_y) * height),
                       int(min(1, xmax + margin_x) * width),
                       int(min(1, ymax + margin_y) * height)))


def split_counts(total: int, train_ratio: float, val_ratio: float) -> tuple[int, int, int]:
    train_count, val_count = int(total * train_ratio), int(total * val_ratio)
    counts = [train_count, val_count, total - train_count - val_count]
    for index, count in enumerate(counts):
        if count == 0:
            donor = max(range(3), key=counts.__getitem__)
            counts[donor] -= 1
            counts[index] += 1
    return tuple(counts)


def main() -> None:
    args = parse_args()
    if args.per_class < 0 or args.max_side < 224:
        raise SystemExit("--per-class must be >= 0 and --max-side must be >= 224")
    ratios = (args.train_ratio, args.val_ratio, args.test_ratio)
    if any(ratio <= 0 for ratio in ratios) or abs(sum(ratios) - 1.0) > 1e-9:
        raise SystemExit("Train/validation/test ratios must be positive and sum to 1")
    if args.output.exists() and any(args.output.iterdir()):
        raise RuntimeError(f"Output is not empty: {args.output}. Choose a fresh directory.")

    classes = json.loads(CLASSES_PATH.read_text(encoding="utf-8"))
    candidate_map = {entry["itemId"]: source_files(args.candidates / entry["itemId"])
                     for entry in classes}
    boxes = load_boxes(args.metadata, candidate_map)
    global_files: dict[str, tuple[str, str]] = {}
    global_pixels: dict[str, tuple[str, str]] = {}
    summary: dict[str, object] = {
        "seed": args.seed,
        "ratios": {"train": args.train_ratio, "validation": args.val_ratio, "test": args.test_ratio},
        "classes": {},
    }
    for class_index, entry in enumerate(classes):
        class_id = entry["itemId"]
        valid: list[tuple[Path, str, str]] = []
        invalid = duplicates = 0
        for source in candidate_map[class_id]:
            try:
                file_hash = exact_file_hash(source)
                if file_hash in global_files:
                    duplicates += 1
                    owner = global_files[file_hash]
                    print(f"[{class_id}] duplicate bytes: {source.name} == {owner[0]}/{owner[1]}")
                    continue
                with Image.open(source) as opened:
                    opened.verify()
                with Image.open(source) as opened:
                    image = crop_to_box(ImageOps.exif_transpose(opened).convert("RGB"), source, boxes)
                    image.load()
                pixel_hash = exact_pixel_hash(image)
                if pixel_hash in global_pixels:
                    duplicates += 1
                    owner = global_pixels[pixel_hash]
                    print(f"[{class_id}] duplicate pixels: {source.name} == {owner[0]}/{owner[1]}")
                    continue
            except (OSError, ValueError, Image.DecompressionBombError):
                invalid += 1
                continue
            global_files[file_hash] = (class_id, source.name)
            global_pixels[pixel_hash] = (class_id, source.name)
            valid.append((source, file_hash, pixel_hash))
            # A positive cap is intended for quick, bounded smoke datasets.
            # Production defaults to 0 and therefore validates every candidate.
            if args.per_class and len(valid) >= args.per_class:
                break

        random.Random(args.seed + class_index).shuffle(valid)
        if len(valid) < 3:
            raise RuntimeError(f"{class_id}: only {len(valid)} valid unique candidates")
        train_count, val_count, test_count = split_counts(len(valid), args.train_ratio, args.val_ratio)
        first, second = train_count, train_count + val_count
        split_items = {
            "train": valid[:first],
            "validation": valid[first:second],
            "test": valid[second:],
        }
        for split_name, items in split_items.items():
            output_dir = args.output / split_name / class_id
            output_dir.mkdir(parents=True, exist_ok=True)
            for item_index, (source, _, _) in enumerate(items, start=1):
                with Image.open(source) as opened:
                    image = crop_to_box(ImageOps.exif_transpose(opened).convert("RGB"), source, boxes)
                    image.thumbnail((args.max_side, args.max_side), Image.Resampling.LANCZOS)
                    image.save(output_dir / f"{item_index:04d}.jpg", quality=92, optimize=True)
        summary["classes"][class_id] = {
            "candidates": len(candidate_map[class_id]), "invalid": invalid, "duplicates": duplicates,
            "train": train_count, "validation": val_count, "test": test_count,
        }
        print(f"[{class_id}] train={train_count} validation={val_count} test={test_count} "
              f"invalid={invalid} duplicates={duplicates}")

    (args.output / "dataset-summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    totals = {split: sum(int(stats[split]) for stats in summary["classes"].values())
              for split in ("train", "validation", "test")}
    print(f"Prepared mutually exclusive splits in {args.output}: {totals}")


if __name__ == "__main__":
    main()
