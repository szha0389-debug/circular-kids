"""Fill weak Open Images classes from precise Wikimedia Commons categories."""

from __future__ import annotations

import argparse
import csv
import html
import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from collections import deque
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path


API_URL = "https://commons.wikimedia.org/w/api.php"
USER_AGENT = (
    "CircularKidsStudentDataset/1.0 "
    "(https://github.com/szha0389-debug/circular-kids-epic1)"
)
CATEGORIES = {
    "soft-toy": "Soft toys",
    "toy-car": "Toy automobiles",
    "board-game": "Board games",
    "electronic-toy": "Electronic toys",
    "headphones": "Headphones",
    "phone": "Mobile phones",
    "charger": "Mobile phone chargers",
    "tablet": "Tablet computers",
    "tshirt": "T-shirts",
    "jumper": "Sweaters",
    "shoes": "Shoes",
    "jacket": "Jackets",
    "chair": "Chairs",
    "desk": "Desks",
    "shelf": "Shelves",
    "backpack": "Backpacks",
    "pencil-case": "Pen and pencil cases",
    "lunch-box": "Lunch boxes",
    "water-bottle": "Water bottles",
    "mug": "Mugs",
    "storage-box": "Storage boxes",
    "lamp": "Lamps",
    "towel": "Towels",
}
MANIFEST_FIELDS = [
    "class_id",
    "local_file",
    "commons_title",
    "source_page",
    "author",
    "license",
    "license_url",
    "review",
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=Path("training/candidates"))
    parser.add_argument("--per-class", type=int, default=40)
    return parser.parse_args()


def open_with_retry(request: urllib.request.Request):
    """Open a Wikimedia request, retrying short-lived network failures."""
    for attempt in range(4):
        try:
            return urllib.request.urlopen(request, timeout=45)
        except urllib.error.HTTPError as error:
            if error.code == 429:
                if attempt == 3:
                    raise RuntimeError(
                        "Wikimedia rate limited the downloader after four retries"
                    ) from error
                retry_after = error.headers.get("Retry-After", "")
                delay = int(retry_after) if retry_after.isdigit() else 60 * (attempt + 1)
                time.sleep(max(30, min(delay, 180)))
                continue
            raise
        except (urllib.error.URLError, TimeoutError, OSError):
            if attempt == 3:
                raise
            time.sleep(5 * (2**attempt))


def api(params: dict[str, str]) -> dict:
    body = urllib.parse.urlencode(
        {"action": "query", "format": "json", "formatversion": "2", **params}
    ).encode("utf-8")
    request = urllib.request.Request(
        API_URL,
        data=body,
        headers={"User-Agent": USER_AGENT, "Content-Type": "application/x-www-form-urlencoded"},
    )
    with open_with_retry(request) as response:
        result = json.load(response)
    time.sleep(0.2)
    return result


def category_files(root: str, wanted: int) -> list[str]:
    files: list[str] = []
    seen_files: set[str] = set()
    categories = deque([(root, 0)])
    seen_categories = {root}
    while categories and len(files) < wanted * 2:
        category, depth = categories.popleft()
        continuation = ""
        while True:
            params = {
                "list": "categorymembers",
                "cmtitle": f"Category:{category}",
                "cmtype": "file|subcat" if depth < 2 else "file",
                "cmlimit": "100",
            }
            if continuation:
                params["cmcontinue"] = continuation
            payload = api(params)
            for member in payload.get("query", {}).get("categorymembers", []):
                title = member["title"]
                if member["ns"] == 6 and title not in seen_files:
                    seen_files.add(title)
                    files.append(title)
                elif member["ns"] == 14 and depth < 2:
                    child = title.removeprefix("Category:")
                    if child not in seen_categories:
                        seen_categories.add(child)
                        categories.append((child, depth + 1))
            continuation = payload.get("continue", {}).get("cmcontinue", "")
            if not continuation or len(files) >= wanted * 2:
                break
    return files


def plain(value: str | None) -> str:
    return " ".join(html.unescape(re.sub(r"<[^>]+>", " ", value or "")).split())


def meta(metadata: dict, key: str) -> str:
    entry = metadata.get(key, {})
    return plain(entry.get("value", "") if isinstance(entry, dict) else str(entry))


def image_records(titles: list[str]) -> list[dict]:
    records: list[dict] = []
    for start in range(0, len(titles), 50):
        payload = api(
            {
                "titles": "|".join(titles[start : start + 50]),
                "prop": "imageinfo",
                "iiprop": "url|mime|extmetadata",
                "iiurlwidth": "330",
                "iiextmetadatafilter": "LicenseShortName|LicenseUrl|Artist",
            }
        )
        records.extend(payload.get("query", {}).get("pages", []))
    return records


def download(url: str, destination: Path) -> None:
    if destination.exists():
        return
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with open_with_retry(request) as response:
        destination.write_bytes(response.read())
    time.sleep(0.5)


def main() -> None:
    args = parse_args()
    rows: list[dict[str, str]] = []
    counts: dict[str, int] = {}
    for class_id, category in CATEGORIES.items():
        destination_dir = args.output / class_id
        destination_dir.mkdir(parents=True, exist_ok=True)
        class_manifest = args.output / f".commons-{class_id}-{args.per_class}.csv"
        if class_manifest.exists():
            with class_manifest.open(newline="", encoding="utf-8") as file:
                cached_rows = list(csv.DictReader(file))
            # A class manifest is written only after the category has been
            # fully scanned and every selected file downloaded. Some narrow
            # categories legitimately contain fewer than the requested total;
            # prepare_dataset.py can top those up from same-label candidates.
            if cached_rows and all(
                Path(row["local_file"]).exists() for row in cached_rows
            ):
                rows.extend(cached_rows)
                counts[class_id] = len(cached_rows)
                print(f"[{class_id}] {len(cached_rows)}/{args.per_class} (cached)", flush=True)
                continue

        records = image_records(category_files(category, args.per_class))
        downloads: list[tuple[str, Path]] = []
        selected: list[tuple[dict, dict, dict, str, Path]] = []
        for page in records:
            if len(selected) >= args.per_class:
                break
            infos = page.get("imageinfo", [])
            if not infos:
                continue
            info = infos[0]
            mime = info.get("thumbmime") or info.get("mime", "")
            metadata = info.get("extmetadata", {})
            license_name = meta(metadata, "LicenseShortName")
            if mime not in {"image/jpeg", "image/png", "image/webp"}:
                continue
            image_url = info.get("thumburl")
            if not image_url:
                continue
            extension = {"image/png": ".png", "image/webp": ".webp"}.get(mime, ".jpg")
            destination = destination_dir / f"commons_{len(selected) + 1:03d}{extension}"
            downloads.append((image_url, destination))
            selected.append((page, info, metadata, license_name, destination))

        # A small pool keeps dataset expansion practical without creating a
        # large burst of requests. download() still applies retry and pacing.
        with ThreadPoolExecutor(max_workers=3) as pool:
            list(pool.map(lambda job: download(*job), downloads))

        class_rows: list[dict[str, str]] = []
        for page, info, metadata, license_name, destination in selected:
            class_rows.append(
                {
                    "class_id": class_id,
                    "local_file": destination.as_posix(),
                    "commons_title": page.get("title", ""),
                    "source_page": info.get("descriptionurl", ""),
                    "author": meta(metadata, "Artist"),
                    "license": license_name,
                    "license_url": meta(metadata, "LicenseUrl"),
                    "review": "category-reviewed",
                }
            )
        with class_manifest.open("w", newline="", encoding="utf-8") as file:
            writer = csv.DictWriter(file, fieldnames=MANIFEST_FIELDS)
            writer.writeheader()
            writer.writerows(class_rows)
        rows.extend(class_rows)
        counts[class_id] = len(selected)
        print(f"[{class_id}] {len(selected)}/{args.per_class}", flush=True)

    manifest = args.output / "commons-manifest.csv"
    with manifest.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=MANIFEST_FIELDS)
        writer.writeheader()
        writer.writerows(rows)
    (args.output / "commons-report.json").write_text(
        json.dumps({"downloadedPerClass": counts}, indent=2), encoding="utf-8"
    )
    print(f"Manifest: {manifest}")


if __name__ == "__main__":
    main()
