# Circular Kids Database Guide

## Purpose

This database provides persistent investigation records and circular-economy knowledge for Circular Kids Epic 1 and later epics. It supports saving observations, clue answers, personal verdicts, and evidence conclusions; finding historical repair outcomes; identifying possible materials; checking ACCC safety recalls; storing Open Images bounding-box annotations; and transferring structured results to Epic 2.

Original user-uploaded photos are not stored. Only structured investigation results and public dataset records are retained.

## Included Files

- `circular_kids.sqlite`: complete local database for DB Browser for SQLite.
- `schema.sql`: SQLite tables, indexes, constraints, and summary view.
- `postgres.sql`: schema used by the hosted Neon PostgreSQL database.
- `data_dictionary.csv`: English descriptions of the main fields.
- `example_queries.sql`: common query examples.

## Data Sources and Import Totals

| Source | Main tables | Imported records | Purpose |
|---|---|---:|---|
| Open Repair Alliance, July 2025 | `repair_cases` | 305,649 | Repair outcomes, product problems, and end-of-life barriers |
| Open Images Validation Bounding Boxes | `image_annotations` | 303,980 | Machine-readable labels and object bounding boxes |
| Wikidata Products and Materials | `materials`, `product_materials` | 388 materials and 1,377 relationships | Materials associated with product categories |
| ACCC Product Safety Recalls | `safety_recalls` | 25 | Australian product safety recall information |
| Circular Kids application | `investigations`, `investigation_answers` | Increases as the site is used | Epic 1 investigation progress and results |

The database also contains 62 normalized product categories. The complete SQLite file is approximately 111 MB.

## Table Relationships

```text
product_categories
  |-- repair_cases
  |-- product_materials -- materials
  |-- safety_recalls
  `-- investigations -- investigation_answers

image_annotations
  `-- retains Open Images Label MIDs until a label mapping file is supplied
```

## Main Tables

### product_categories

Normalizes product category names used by different data sources. Other knowledge tables reference it through `product_category_id`.

### repair_cases

Contains real repair-event records. `repair_status` includes Fixed, Repairable, End of life, and Unknown. Some source records do not include a manufacture year, product age, or problem description, so these fields may be null.

### materials and product_materials

Store Wikidata materials and the many-to-many relationship between product categories and materials. A relationship means that a category may contain a material; it does not prove that a specific uploaded item contains it.

### safety_recalls

Stores ACCC recall titles, categories, descriptions, publication dates, and official links. A category match only indicates that a similar type of product appears in the recall dataset. It does not prove that a specific item has been recalled.

### image_annotations

Stores Open Images label MIDs, confidence values, and normalized bounding-box coordinates. The supplied dataset does not include original images or a label-name mapping, so the website does not currently use this table for direct image recognition.

### investigations

Stores the current stage, selected item, suspected problem, clue answers, personal verdict, evidence conclusion, uncertainty markers, and safety flag. The production website saves this information in Neon PostgreSQL.

### investigation_answers

Provides a normalized answer structure in the SQLite design. The hosted implementation stores answers as a JSON array in `investigations.answers` to simplify transfers between epics.

## Application Usage

The production website at `https://circular-kids-epic1.vercel.app` uses Neon PostgreSQL as follows:

1. A new investigation record is created when an investigation begins.
2. Item selections, observations, clue answers, and verdicts update that record.
3. Completing Epic 1 changes the record status to completed.
4. Before handover to Epic 2, the application queries repair statistics, materials, and recalls.
5. Results are included in `datasetEvidence`; the original photo is neither stored nor transferred.

## Privacy and Safety

- The application does not require a child's real name, date of birth, address, or precise location.
- Original photos are not written to the database.
- Database credentials are stored only in encrypted Vercel environment variables.
- This export contains no Neon passwords, access tokens, or connection strings.
- Repair and recall results are educational evidence and do not replace guidance from a trusted adult or qualified professional.

## Seeding Neon from the SQLite export

`scripts/migrate_to_neon.js` copies the knowledge tables out of
`db/circular_kids.sqlite` and into the hosted Neon database. It is a one-off
local tool — no deployment ever runs it.

Its three dependencies are deliberately not listed in `package.json`. One of
them, `better-sqlite3`, is a native module compiled at install time, and putting
that in the deployment's install path risks failing every production build for
the sake of a script production never executes. Install them only when needed:

```bash
npm install --no-save better-sqlite3 pg pg-copy-streams
```

Then create `.env.local` in the project root (it is git-ignored) containing the
Neon connection string, and run the migration:

```bash
echo "DATABASE_URL=<your Neon connection string>" > .env.local
npm run db:migrate
```

Create the tables from `postgres.sql` first — the migration copies rows into
tables that must already exist.

## Opening the Database

Open `circular_kids.sqlite` with DB Browser for SQLite, or run:

```bash
sqlite3 circular_kids.sqlite
```

Use `.tables` to list tables, or open `example_queries.sql` for examples.
