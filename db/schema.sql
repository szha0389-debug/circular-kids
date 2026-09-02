PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS product_categories (
  id INTEGER PRIMARY KEY,
  canonical_name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  repair_category_id INTEGER,
  open_images_label TEXT,
  wikidata_class_uri TEXT,
  is_child_relevant INTEGER NOT NULL DEFAULT 0 CHECK (is_child_relevant IN (0, 1))
);

CREATE TABLE IF NOT EXISTS repair_cases (
  id TEXT PRIMARY KEY,
  product_category_id INTEGER REFERENCES product_categories(id),
  data_provider TEXT NOT NULL,
  country_code TEXT,
  original_category TEXT,
  brand TEXT,
  manufacture_year INTEGER,
  product_age REAL,
  repair_status TEXT NOT NULL,
  end_of_life_barrier TEXT,
  group_identifier TEXT,
  event_date TEXT,
  problem_text TEXT
);

CREATE TABLE IF NOT EXISTS materials (
  id INTEGER PRIMARY KEY,
  wikidata_uri TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS product_materials (
  product_category_id INTEGER NOT NULL REFERENCES product_categories(id),
  material_id INTEGER NOT NULL REFERENCES materials(id),
  source_item_uri TEXT NOT NULL,
  source_item_name TEXT,
  PRIMARY KEY (product_category_id, material_id, source_item_uri)
);

CREATE TABLE IF NOT EXISTS safety_recalls (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  product_category_id INTEGER REFERENCES product_categories(id),
  original_category TEXT,
  published_at TEXT,
  description TEXT NOT NULL,
  recall_url TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS image_annotations (
  id INTEGER PRIMARY KEY,
  image_id TEXT NOT NULL,
  source TEXT NOT NULL,
  label_mid TEXT NOT NULL,
  confidence REAL NOT NULL,
  x_min REAL NOT NULL,
  x_max REAL NOT NULL,
  y_min REAL NOT NULL,
  y_max REAL NOT NULL,
  is_occluded INTEGER NOT NULL,
  is_truncated INTEGER NOT NULL,
  is_group_of INTEGER NOT NULL,
  is_depiction INTEGER NOT NULL,
  is_inside INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS investigations (
  id TEXT PRIMARY KEY,
  anonymous_participant_id TEXT,
  product_category_id INTEGER REFERENCES product_categories(id),
  item_name TEXT,
  suspected_problem TEXT,
  child_verdict TEXT,
  evidence_conclusion TEXT,
  danger_flag INTEGER NOT NULL DEFAULT 0 CHECK (danger_flag IN (0, 1)),
  safety_response TEXT,
  comparison_response TEXT,
  safety_boundary TEXT CHECK (safety_boundary IN ('safe-to-try', 'ask-an-adult', 'do-not-touch') OR safety_boundary IS NULL),
  uncertainty_json TEXT NOT NULL DEFAULT '[]',
  current_stage TEXT NOT NULL DEFAULT 'image',
  status TEXT NOT NULL DEFAULT 'in_progress',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS investigation_answers (
  id INTEGER PRIMARY KEY,
  investigation_id TEXT NOT NULL REFERENCES investigations(id) ON DELETE CASCADE,
  question_key TEXT NOT NULL,
  question_text TEXT NOT NULL,
  answer TEXT,
  was_skipped INTEGER NOT NULL DEFAULT 0 CHECK (was_skipped IN (0, 1)),
  is_uncertain INTEGER NOT NULL DEFAULT 0 CHECK (is_uncertain IN (0, 1)),
  position INTEGER NOT NULL,
  UNIQUE (investigation_id, question_key)
);

CREATE INDEX IF NOT EXISTS idx_repair_cases_category_status
  ON repair_cases(product_category_id, repair_status);
CREATE INDEX IF NOT EXISTS idx_repair_cases_event_date
  ON repair_cases(event_date);
CREATE INDEX IF NOT EXISTS idx_product_materials_category
  ON product_materials(product_category_id);
CREATE INDEX IF NOT EXISTS idx_safety_recalls_category_date
  ON safety_recalls(product_category_id, published_at);
CREATE INDEX IF NOT EXISTS idx_image_annotations_image
  ON image_annotations(image_id);
CREATE INDEX IF NOT EXISTS idx_image_annotations_label
  ON image_annotations(label_mid);
CREATE INDEX IF NOT EXISTS idx_investigations_participant_updated
  ON investigations(anonymous_participant_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_investigation_answers_investigation
  ON investigation_answers(investigation_id, position);

CREATE VIEW IF NOT EXISTS category_repair_summary AS
SELECT
  c.id AS product_category_id,
  c.display_name,
  COUNT(r.id) AS total_cases,
  SUM(CASE WHEN r.repair_status = 'Fixed' THEN 1 ELSE 0 END) AS fixed_cases,
  SUM(CASE WHEN r.repair_status = 'Repairable' THEN 1 ELSE 0 END) AS repairable_cases,
  SUM(CASE WHEN r.repair_status = 'End of life' THEN 1 ELSE 0 END) AS end_of_life_cases
FROM product_categories c
LEFT JOIN repair_cases r ON r.product_category_id = c.id
GROUP BY c.id, c.display_name;
