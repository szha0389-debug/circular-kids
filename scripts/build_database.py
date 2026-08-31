#!/usr/bin/env python3
import csv
import re
import sqlite3
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATASETS = ROOT.parent / "datasets"
DB_PATH = ROOT / "db" / "circular_kids.sqlite"
SCHEMA_PATH = ROOT / "db" / "schema.sql"

CHILD_WORDS = ("toy", "baby", "toddler", "child", "game", "headphone", "mobile", "laptop", "tablet", "scooter", "bicycle")


def clean(value):
    value = (value or "").strip()
    return value or None


def number(value, cast=float):
    try:
        return cast(value) if clean(value) is not None else None
    except ValueError:
        return None


def canonical(value):
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def category_id(conn, display_name, repair_id=None, wikidata_uri=None):
    key = canonical(display_name)
    child = int(any(word in display_name.lower() for word in CHILD_WORDS))
    conn.execute(
        """INSERT INTO product_categories
           (canonical_name, display_name, repair_category_id, wikidata_class_uri, is_child_relevant)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(canonical_name) DO UPDATE SET
             repair_category_id = COALESCE(product_categories.repair_category_id, excluded.repair_category_id),
             wikidata_class_uri = COALESCE(product_categories.wikidata_class_uri, excluded.wikidata_class_uri),
             is_child_relevant = MAX(product_categories.is_child_relevant, excluded.is_child_relevant)""",
        (key, display_name, repair_id, wikidata_uri, child),
    )
    return conn.execute("SELECT id FROM product_categories WHERE canonical_name = ?", (key,)).fetchone()[0]


def rows(path):
    with path.open(encoding="utf-8-sig", newline="") as handle:
        yield from csv.DictReader(handle)


def import_repair(conn):
    path = DATASETS / "open_repair_alliance_202507.csv"
    category_cache = {}
    batch = []
    for row in rows(path):
        name = row["product_category"].strip()
        if name not in category_cache:
            category_cache[name] = category_id(conn, name, number(row["product_category_id"], int))
        batch.append((row["id"], category_cache[name], row["data_provider"], clean(row["country"]), clean(row["partner_product_category"]), clean(row["brand"]), number(row["year_of_manufacture"], int), number(row["product_age"]), row["repair_status"], clean(row["repair_barrier_if_end_of_life"]), clean(row["group_identifier"]), clean(row["event_date"]), clean(row["problem"])))
        if len(batch) == 5000:
            conn.executemany("INSERT INTO repair_cases VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)", batch); batch.clear()
    conn.executemany("INSERT INTO repair_cases VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)", batch)


def import_materials(conn):
    for row in rows(DATASETS / "wikidata_products_materials.csv"):
        cid = category_id(conn, row["classLabel"], wikidata_uri=row["class"])
        conn.execute("INSERT OR IGNORE INTO materials(wikidata_uri, name) VALUES (?, ?)", (row["material"], row["materialLabel"]))
        mid = conn.execute("SELECT id FROM materials WHERE wikidata_uri = ?", (row["material"],)).fetchone()[0]
        conn.execute("INSERT OR IGNORE INTO product_materials VALUES (?, ?, ?, ?)", (cid, mid, row["item"], row["itemLabel"]))


def import_recalls(conn):
    for row in rows(DATASETS / "accc_product_safety_recalls.csv"):
        cid = category_id(conn, row["category"])
        conn.execute("INSERT INTO safety_recalls VALUES (?, ?, ?, ?, ?, ?, ?)", (row["guid"], row["title"], cid, row["category"], row["published_date"], row["description"], row["recall_url"]))


def import_annotations(conn):
    batch = []
    for row in rows(DATASETS / "open_images_validation_bboxes.csv"):
        batch.append((row["ImageID"], row["Source"], row["LabelName"], float(row["Confidence"]), float(row["XMin"]), float(row["XMax"]), float(row["YMin"]), float(row["YMax"]), int(row["IsOccluded"]), int(row["IsTruncated"]), int(row["IsGroupOf"]), int(row["IsDepiction"]), int(row["IsInside"])))
        if len(batch) == 10000:
            conn.executemany("""INSERT INTO image_annotations
              (image_id,source,label_mid,confidence,x_min,x_max,y_min,y_max,is_occluded,is_truncated,is_group_of,is_depiction,is_inside)
              VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)""", batch); batch.clear()
    conn.executemany("""INSERT INTO image_annotations
      (image_id,source,label_mid,confidence,x_min,x_max,y_min,y_max,is_occluded,is_truncated,is_group_of,is_depiction,is_inside)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)""", batch)


def main():
    if not DATASETS.is_dir():
        raise SystemExit(f"Dataset folder not found: {DATASETS}")
    DB_PATH.unlink(missing_ok=True)
    conn = sqlite3.connect(DB_PATH)
    try:
        conn.executescript(SCHEMA_PATH.read_text())
        with conn:
            import_repair(conn)
            import_materials(conn)
            import_recalls(conn)
            import_annotations(conn)
        conn.execute("ANALYZE")
        conn.execute("PRAGMA optimize")
        conn.commit()
        checks = {}
        for table in ("product_categories", "repair_cases", "materials", "product_materials", "safety_recalls", "image_annotations"):
            checks[table] = conn.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
        integrity = conn.execute("PRAGMA integrity_check").fetchone()[0]
        print(f"Created {DB_PATH} ({DB_PATH.stat().st_size / 1024 / 1024:.1f} MB)")
        print("Rows:", checks)
        print("Integrity:", integrity)
    finally:
        conn.close()


if __name__ == "__main__":
    main()

