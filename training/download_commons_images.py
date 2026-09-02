"""Resumable Wikimedia Commons candidate-image builder.

This only searches, downloads, and records candidate metadata. It never uses
AI to decide whether an image really depicts the requested class.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import html
import json
import re
import random
import shutil
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

from PIL import Image, UnidentifiedImageError


ROOT = Path(__file__).resolve().parent.parent
CLASSES_PATH = ROOT / "training" / "classes.json"
DEFAULT_OUTPUT = ROOT / "training" / "candidates"
API_URL = "https://commons.wikimedia.org/w/api.php"
USER_AGENT = "CircularKidsCommonsDataset/2.0 (local educational dataset builder)"
IMAGE_MIMES = {"image/jpeg", "image/png", "image/webp"}
IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".webp"}
FIELDS = ("class_id", "local_file", "commons_title", "source_page", "author", "license", "license_url", "review")
RESULTS_PER_PAGE = 50
THUMBNAIL_WIDTH = 1024
MAX_PAGES_PER_TERM = 20
MAX_DOWNLOAD_BYTES = 30 * 1024 * 1024


class RateLimitStop(RuntimeError):
    """Raised after repeated 429 responses so a run exits without hammering Commons."""


class RateLimitState:
    def __init__(self) -> None:
        self.consecutive_429 = 0

# Never fall back to a bare itemId: for example, "jumper" is ambiguous.
SEARCH_TERMS = {
    "soft-toy": ("stuffed toy", "plush toy", "teddy bear"), "toy-car": ("toy car", "model toy car"),
    "board-game": ("board game", "tabletop board game"), "electronic-toy": ("electronic toy", "battery powered toy"),
    "headphones": ("headphones", "headset"), "phone": ("smartphone", "mobile phone"),
    "charger": ("phone charger", "USB charger", "power adapter"), "tablet": ("tablet computer", "tablet device"),
    "tshirt": ("T-shirt", "tee shirt"), "jumper": ("sweater clothing", "pullover clothing", "jumper clothing"),
    "shoes": ("shoes", "footwear"), "jacket": ("jacket clothing", "coat jacket"), "chair": ("chair furniture",),
    "desk": ("desk furniture", "office desk"), "shelf": ("shelf furniture", "bookshelf"),
    "backpack": ("backpack", "rucksack"), "pencil-case": ("pencil case", "pencil pouch"),
    "lunch-box": ("lunch box", "lunchbox"), "water-bottle": ("water bottle", "drinking bottle"),
    "mug": ("mug", "coffee mug"), "storage-box": ("storage box", "plastic storage container"),
    "lamp": ("table lamp", "lamp"), "towel": ("bath towel", "towel"),
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    choice = parser.add_mutually_exclusive_group(required=True)
    choice.add_argument("--class", dest="class_id")
    choice.add_argument("--all", action="store_true")
    parser.add_argument("--target", type=int, default=500)
    parser.add_argument("--min-size", type=int, default=200)
    parser.add_argument("--api-delay", type=float, default=5.0, help="minimum seconds between API requests")
    parser.add_argument("--download-delay-min", type=float, default=3.0, help="minimum post-download wait")
    parser.add_argument("--download-delay-max", type=float, default=6.0, help="maximum post-download wait")
    parser.add_argument("--page-cooldown", type=float, default=30.0, help="wait after each search page")
    parser.add_argument("--class-cooldown", type=float, default=60.0, help="wait between classes with --all")
    # Keep the previous command-line option working as an API-delay alias.
    parser.add_argument("--delay", type=float, help="deprecated alias for --api-delay")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    if args.delay is not None:
        args.api_delay = args.delay
    if (args.target < 1 or args.min_size < 1 or args.api_delay < 0 or
            args.download_delay_min < 0 or args.download_delay_max < args.download_delay_min or
            args.page_cooldown < 0 or args.class_cooldown < 0):
        parser.error("delay and size values must be non-negative; max download delay must be >= min")
    return args


def classes() -> list[str]:
    ids = [item["itemId"] for item in json.loads(CLASSES_PATH.read_text(encoding="utf-8"))]
    missing = set(ids) - set(SEARCH_TERMS)
    if missing:
        raise RuntimeError(f"Missing SEARCH_TERMS: {', '.join(sorted(missing))}")
    return ids


def manifest(output: Path, class_id: str) -> Path:
    return output / f".commons-{class_id}-500.csv"


def image_valid(path: Path, min_size: int) -> bool:
    if path.suffix.lower() not in IMAGE_SUFFIXES:
        return False
    try:
        with Image.open(path) as image:
            image.verify()
        with Image.open(path) as image:
            return image.width >= min_size and image.height >= min_size
    except (OSError, UnidentifiedImageError):
        return False


def audit(directory: Path, min_size: int, quarantine: bool) -> tuple[int, int]:
    """Count Pillow-valid images; move only invalid image files aside when requested."""
    if not directory.exists():
        return 0, 0
    valid = invalid = 0
    bad_dir = directory / ".invalid"
    for path in directory.iterdir():
        if not path.is_file() or path.suffix.lower() not in IMAGE_SUFFIXES:
            continue
        if image_valid(path, min_size):
            valid += 1
            continue
        invalid += 1
        if quarantine:
            bad_dir.mkdir(exist_ok=True)
            destination = bad_dir / path.name
            index = 1
            while destination.exists():
                destination = bad_dir / f"{path.stem}_{index}{path.suffix}"
                index += 1
            shutil.move(str(path), str(destination))
            print(f"[SKIP] Quarantined invalid image: {path.name}")
    return valid, invalid


def read_sources(path: Path) -> tuple[set[str], set[str]]:
    """CSV is a provenance/deduplication record, never the download queue."""
    if not path.exists():
        return set(), set()
    with path.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        if tuple(reader.fieldnames or ()) != FIELDS:
            raise RuntimeError(f"{path}: unexpected CSV columns {reader.fieldnames}")
        rows = list(reader)
    return ({row["commons_title"] for row in rows if row.get("commons_title")},
            {row["source_page"] for row in rows if row.get("source_page")})


def append_row(path: Path, row: dict[str, str]) -> None:
    new = not path.exists()
    with path.open("a", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=FIELDS)
        if new:
            writer.writeheader()
        writer.writerow(row)


def open_with_retry(request: urllib.request.Request, timeout: int, delay: float, state: RateLimitState):
    error: Exception | None = None
    for attempt in range(4):
        try:
            response = urllib.request.urlopen(request, timeout=timeout)
            state.consecutive_429 = 0
            return response
        except urllib.error.HTTPError as exc:
            error = exc
            if exc.code == 404:
                raise
            if exc.code == 429:
                state.consecutive_429 += 1
                if state.consecutive_429 >= 2:
                    raise RateLimitStop(
                        "[STOP] Repeated Wikimedia rate limiting. Progress has been saved. Please retry later."
                    ) from exc
                retry_after = exc.headers.get("Retry-After", "")
                retry_seconds = float(retry_after) if retry_after.isdigit() else max(delay, 60.0)
                # A small margin avoids retrying at the exact server boundary.
                wait = retry_seconds + random.uniform(5.0, 15.0)
            else:
                wait = max(delay, 1.0) * (2 ** attempt)
        except (urllib.error.URLError, TimeoutError, OSError) as exc:
            error = exc
            wait = max(delay, 1.0) * (2 ** attempt)
        if attempt < 3:
            print(f"[RETRY] {error}; waiting {wait:.0f}s")
            time.sleep(wait)
    raise RuntimeError(f"Wikimedia request failed after retries: {error}") from error


def search(
    term: str, continuation: dict[str, str], delay: float, state: RateLimitState
) -> tuple[list[dict[str, Any]], dict[str, str]]:
    # One generator=search request returns up to 50 file pages plus imageinfo.
    params = {
        "action": "query", "format": "json", "formatversion": "2", "generator": "search",
        "gsrsearch": term, "gsrnamespace": "6", "gsrlimit": str(RESULTS_PER_PAGE),
        "prop": "imageinfo", "iiprop": "url|mime|size|extmetadata", "iiurlwidth": str(THUMBNAIL_WIDTH),
        "iiextmetadatafilter": "Artist|LicenseShortName|LicenseUrl",
    }
    # MediaWiki pagination is a bundle.  For generator=search it commonly
    # contains both ``continue`` and ``gsrcontinue``; passing only the latter
    # can make the API stop after page one or repeat the first page.
    params.update(continuation)
    request = urllib.request.Request(f"{API_URL}?{urllib.parse.urlencode(params)}", headers={"User-Agent": USER_AGENT})
    with open_with_retry(request, 45, delay, state) as response:
        payload = json.load(response)
    time.sleep(delay)
    next_page = {
        str(key): str(value)
        for key, value in payload.get("continue", {}).items()
        if isinstance(value, (str, int, float))
    }
    return payload.get("query", {}).get("pages", []), next_page


def metadata(metadata: dict[str, Any], key: str) -> str:
    value = metadata.get(key, {})
    raw = value.get("value", "") if isinstance(value, dict) else value
    return " ".join(html.unescape(re.sub(r"<[^>]+>", " ", str(raw or ""))).split())


def candidate(page: dict[str, Any], min_size: int) -> tuple[str, str] | None:
    info = (page.get("imageinfo") or [{}])[0]
    mime = info.get("thumbmime") or info.get("mime", "")
    if mime not in IMAGE_MIMES or int(info.get("width", 0)) < min_size or int(info.get("height", 0)) < min_size:
        return None
    url = info.get("thumburl", "")
    return (url, info.get("descriptionurl", "")) if url else None


def download(url: str, destination: Path, min_size: int, args: argparse.Namespace, state: RateLimitState) -> tuple[bool, str]:
    temporary: Path | None = None
    try:
        request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        with open_with_retry(request, 60, args.api_delay, state) as response:
            with tempfile.NamedTemporaryFile(dir=destination.parent, suffix=".download", delete=False) as handle:
                total = 0
                while chunk := response.read(1024 * 1024):
                    total += len(chunk)
                    if total > MAX_DOWNLOAD_BYTES:
                        raise ValueError("file exceeds 30 MB limit")
                    handle.write(chunk)
                temporary = Path(handle.name)
        with Image.open(temporary) as image:
            image.verify()
        with Image.open(temporary) as image:
            if image.width < min_size or image.height < min_size:
                return False, f"too small ({image.width}x{image.height})"
            image.convert("RGB").save(destination, "JPEG", quality=92, optimize=True)
        return True, "Downloaded"
    except RateLimitStop:
        raise
    except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError, OSError, ValueError, UnidentifiedImageError) as error:
        destination.unlink(missing_ok=True)
        return False, str(error)
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)
        time.sleep(random.uniform(args.download_delay_min, args.download_delay_max))


def process(class_id: str, args: argparse.Namespace, state: RateLimitState) -> tuple[int, int]:
    directory = args.output / class_id
    existing, invalid = audit(directory, args.min_size, quarantine=not args.dry_run)
    need = max(0, args.target - existing)
    print("=" * 37)
    print(f"Class: {class_id}\nExisting valid: {existing}\nTarget: {args.target}\nNeed: {need}\nSearch terms:")
    for term in SEARCH_TERMS[class_id]:
        print(f"- {term}")
    print("=" * 37)
    if invalid:
        print(f"[INFO] Invalid/too-small images excluded: {invalid}")
    if not need or args.dry_run:
        if args.dry_run:
            print("[DRY RUN] No API calls, downloads, CSV writes, or quarantines.")
        return existing, args.target
    directory.mkdir(parents=True, exist_ok=True)
    csv_path = manifest(args.output, class_id)
    titles, pages_seen = read_sources(csv_path)
    urls_seen: set[str] = set()
    for term in SEARCH_TERMS[class_id]:
        continuation: dict[str, str] = {}
        print(f"Searching: {term}")
        for number in range(1, MAX_PAGES_PER_TERM + 1):
            try:
                pages, continuation = search(term, continuation, args.api_delay, state)
            except RateLimitStop:
                raise
            except (RuntimeError, urllib.error.HTTPError, ValueError) as error:
                print(f"[FAILED] Search request: {error}")
                break
            print(f"Page {number}: {len(pages)} candidates")
            for page in pages:
                if existing >= args.target:
                    break
                title = page.get("title", "")
                details = candidate(page, args.min_size)
                if not details:
                    print(f"[SKIP] Invalid format, URL, or size: {title}")
                    continue
                url, source_page = details
                if title in titles or source_page in pages_seen or url in urls_seen:
                    print(f"[SKIP] Duplicate: {title}")
                    continue
                destination = directory / f"commons_{hashlib.sha256(title.encode('utf-8')).hexdigest()[:12]}.jpg"
                if destination.exists():
                    print(f"[SKIP] Already exists: {destination.name}")
                    continue
                urls_seen.add(url)
                success, message = download(url, destination, args.min_size, args, state)
                if not success:
                    print(f"[FAILED] {message}: {title}")
                    continue
                info = (page.get("imageinfo") or [{}])[0]
                ext = info.get("extmetadata", {})
                append_row(csv_path, {
                    "class_id": class_id, "local_file": destination.resolve().relative_to(ROOT).as_posix(),
                    "commons_title": title, "source_page": source_page, "author": metadata(ext, "Artist"),
                    "license": metadata(ext, "LicenseShortName"), "license_url": metadata(ext, "LicenseUrl"),
                    "review": "api-search-unreviewed",
                })
                titles.add(title)
                pages_seen.add(source_page)
                existing += 1
                print(f"[{existing}/{args.target}] {message}: {destination.name}")
            if existing >= args.target or not continuation:
                break
            print(f"[COOLDOWN] Waiting {args.page_cooldown:.0f}s before the next search page.")
            time.sleep(args.page_cooldown)
        if existing >= args.target:
            break
    print(f"{class_id} finished: {existing}/{args.target}")
    return existing, args.target


def main() -> None:
    args = parse_args()
    known = classes()
    selected = known if args.all else [args.class_id]
    if unknown := set(selected) - set(known):
        raise SystemExit(f"Unknown class id(s): {', '.join(sorted(unknown))}")
    state = RateLimitState()
    summary: dict[str, tuple[int, int]] = {}
    for index, class_id in enumerate(selected):
        try:
            summary[class_id] = process(class_id, args, state)
        except RateLimitStop as error:
            print(error)
            break
        if args.all and index < len(selected) - 1:
            print(f"[COOLDOWN] Waiting {args.class_cooldown:.0f}s before the next class.")
            time.sleep(args.class_cooldown)
    print("\nDataset summary")
    for class_id, (actual, target) in summary.items():
        print(f"{class_id:<16} {actual}/{target}")


if __name__ == "__main__":
    main()
