"""Download human-verified Open Images candidates for the 23 project classes.

Candidates are not trusted labels. Review them before copying accepted images
into training/data/<class-id>/. No pretrained model is used by this script.
"""

from __future__ import annotations

import argparse
import csv
import json
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path


DATASET_PAGE = "https://storage.googleapis.com/openimages/web/index.html"
S3_ROOT = "https://open-images-dataset.s3.amazonaws.com"
USER_AGENT = "CircularKidsStudentDataset/1.0"

# Exact Open Images labels are preferred. "Toy" and "Box" are deliberately
# broad candidates and therefore require especially careful manual review.
CLASS_LABELS = {
    "soft-toy": ["/m/0kmg4"],
    "toy-car": ["/m/0h8lhhb"],
    "board-game": ["/m/015ll"],
    "electronic-toy": ["/m/0138tl"],
    "headphones": ["/m/01b7fy"],
    "phone": ["/m/050k8"],
    "charger": ["/m/0h8k5mc", "/m/0892cv"],
    "tablet": ["/m/0bh9flk"],
    "tshirt": ["/m/013s93"],
    "jumper": ["/m/019b80", "/m/0h8k3ng"],
    "shoes": ["/m/06rrc"],
    "jacket": ["/m/032b3c"],
    "chair": ["/m/01mzpv"],
    "desk": ["/m/01y9k5"],
    "shelf": ["/m/0gjbg72"],
    "backpack": ["/m/01940j"],
    "pencil-case": ["/m/05676x"],
    "lunch-box": ["/m/02lfqj"],
    "water-bottle": ["/m/0118n_9r"],
    "mug": ["/m/02jvh9"],
    "storage-box": ["/m/0h8n5f5", "/m/025dyy"],
    "lamp": ["/m/0dtln"],
    "towel": ["/m/0162_1"],
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=Path("training/candidates"))
    parser.add_argument("--metadata", type=Path, default=Path("training/candidates/_openimages"))
    parser.add_argument("--per-class", type=int, default=40)
    parser.add_argument("--workers", type=int, default=4)
    return parser.parse_args()


def collect_candidates(metadata_dir: Path, per_class: int) -> dict[str, list[tuple[str, str, str]]]:
    label_to_classes: dict[str, list[str]] = {}
    for class_id, labels in CLASS_LABELS.items():
        for label in labels:
            label_to_classes.setdefault(label, []).append(class_id)

    selected = {class_id: [] for class_id in CLASS_LABELS}
    seen = {class_id: set() for class_id in CLASS_LABELS}
    sources = [
        ("validation", metadata_dir / "validation-all-labels.csv"),
        ("test", metadata_dir / "test-all-labels.csv"),
    ]
    for split, path in sources:
        if not path.exists():
            raise FileNotFoundError(f"Missing official Open Images metadata: {path}")
        with path.open(newline="", encoding="utf-8") as file:
            for row in csv.DictReader(file):
                if row["Confidence"] != "1":
                    continue
                for class_id in label_to_classes.get(row["LabelName"], []):
                    image_id = row["ImageID"]
                    if len(selected[class_id]) >= per_class or image_id in seen[class_id]:
                        continue
                    seen[class_id].add(image_id)
                    selected[class_id].append((split, image_id, row["LabelName"]))
    return selected


def download_one(output: Path, class_id: str, sample: tuple[str, str, str]) -> dict[str, str]:
    split, image_id, label_id = sample
    class_dir = output / class_id
    class_dir.mkdir(parents=True, exist_ok=True)
    destination = class_dir / f"oi_{split}_{image_id}.jpg"
    url = f"{S3_ROOT}/{split}/{image_id}.jpg"
    if not destination.exists():
        request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(request, timeout=45) as response:
            destination.write_bytes(response.read())
    return {
        "class_id": class_id,
        "local_file": destination.as_posix(),
        "open_images_id": image_id,
        "split": split,
        "label_id": label_id,
        "source_url": url,
        "dataset_page": DATASET_PAGE,
        "license_note": "Open Images lists images as CC BY 2.0; verify the individual image before redistribution",
        "review": "pending",
    }


def main() -> None:
    args = parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    selected = collect_candidates(args.metadata, args.per_class)
    jobs = [(class_id, sample) for class_id, samples in selected.items() for sample in samples]
    rows: list[dict[str, str]] = []

    with ThreadPoolExecutor(max_workers=max(1, min(args.workers, 5))) as executor:
        futures = {
            executor.submit(download_one, args.output, class_id, sample): class_id
            for class_id, sample in jobs
        }
        for future in as_completed(futures):
            try:
                rows.append(future.result())
            except OSError as error:
                print(f"[{futures[future]}] download failed: {error}")

    rows.sort(key=lambda row: (row["class_id"], row["local_file"]))
    manifest_path = args.output / "manifest.csv"
    if rows:
        with manifest_path.open("w", newline="", encoding="utf-8") as file:
            writer = csv.DictWriter(file, fieldnames=list(rows[0]))
            writer.writeheader()
            writer.writerows(rows)

    counts = {class_id: sum(row["class_id"] == class_id for row in rows) for class_id in CLASS_LABELS}
    report = {
        "requestedPerClass": args.per_class,
        "downloadedPerClass": counts,
        "needsMoreImages": {key: args.per_class - value for key, value in counts.items() if value < args.per_class},
        "warning": "Review every candidate manually; electronic-toy and storage-box use broad labels.",
    }
    report_path = args.output / "report.json"
    report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    for class_id, count in counts.items():
        print(f"[{class_id}] {count}/{args.per_class}")
    print(f"Manifest: {manifest_path}")
    print(f"Gap report: {report_path}")


if __name__ == "__main__":
    main()
