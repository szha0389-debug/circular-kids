CREATE TABLE IF NOT EXISTS product_categories (
  id BIGINT PRIMARY KEY,
  canonical_name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  repair_category_id INTEGER,
  open_images_label TEXT,
  wikidata_class_uri TEXT,
  is_child_relevant BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE TABLE IF NOT EXISTS repair_cases (
  id TEXT PRIMARY KEY,
  product_category_id BIGINT REFERENCES product_categories(id),
  data_provider TEXT NOT NULL, country_code TEXT, original_category TEXT, brand TEXT,
  manufacture_year INTEGER, product_age DOUBLE PRECISION, repair_status TEXT NOT NULL,
  end_of_life_barrier TEXT, group_identifier TEXT, event_date DATE, problem_text TEXT
);
CREATE TABLE IF NOT EXISTS materials (
  id BIGINT PRIMARY KEY, wikidata_uri TEXT NOT NULL UNIQUE, name TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS product_materials (
  product_category_id BIGINT NOT NULL REFERENCES product_categories(id),
  material_id BIGINT NOT NULL REFERENCES materials(id), source_item_uri TEXT NOT NULL,
  source_item_name TEXT, PRIMARY KEY(product_category_id, material_id, source_item_uri)
);
CREATE TABLE IF NOT EXISTS safety_recalls (
  id UUID PRIMARY KEY, title TEXT NOT NULL,
  product_category_id BIGINT REFERENCES product_categories(id), original_category TEXT,
  published_at TEXT, description TEXT NOT NULL, recall_url TEXT NOT NULL UNIQUE
);
CREATE TABLE IF NOT EXISTS image_annotations (
  id BIGINT PRIMARY KEY, image_id TEXT NOT NULL, source TEXT NOT NULL, label_mid TEXT NOT NULL,
  confidence DOUBLE PRECISION NOT NULL, x_min DOUBLE PRECISION NOT NULL, x_max DOUBLE PRECISION NOT NULL,
  y_min DOUBLE PRECISION NOT NULL, y_max DOUBLE PRECISION NOT NULL, is_occluded BOOLEAN NOT NULL,
  is_truncated BOOLEAN NOT NULL, is_group_of BOOLEAN NOT NULL, is_depiction BOOLEAN NOT NULL,
  is_inside BOOLEAN NOT NULL
);
-- Epic 1 case records.
--
-- `problems` is an array because US-1.2 allows more than one thing to be wrong.
-- The site's reasoning, the uncertainty flags and the danger flag are NOT stored:
-- they are derived from these columns by core/reasoning.js on demand. Persisting
-- them would make it possible for a stale assessment to be shown beside a verdict
-- the child later changed, which US-1.4 forbids.
CREATE TABLE IF NOT EXISTS investigations (
  id UUID PRIMARY KEY,
  item_id TEXT,
  problems JSONB NOT NULL DEFAULT '[]',
  answers JSONB NOT NULL DEFAULT '[]',
  verdict TEXT,
  safety_response TEXT,
  comparison_response TEXT,
  safety_boundary TEXT,
  stage TEXT NOT NULL DEFAULT 'identify',
  status TEXT NOT NULL DEFAULT 'in_progress',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
ALTER TABLE investigations ADD COLUMN IF NOT EXISTS safety_response TEXT;
ALTER TABLE investigations ADD COLUMN IF NOT EXISTS comparison_response TEXT;
ALTER TABLE investigations ADD COLUMN IF NOT EXISTS safety_boundary TEXT;
CREATE INDEX IF NOT EXISTS idx_repair_cases_category_status ON repair_cases(product_category_id, repair_status);
CREATE INDEX IF NOT EXISTS idx_repair_cases_event_date ON repair_cases(event_date);
CREATE INDEX IF NOT EXISTS idx_product_materials_category ON product_materials(product_category_id);
CREATE INDEX IF NOT EXISTS idx_safety_recalls_category_date ON safety_recalls(product_category_id);
CREATE INDEX IF NOT EXISTS idx_image_annotations_image ON image_annotations(image_id);
CREATE INDEX IF NOT EXISTS idx_image_annotations_label ON image_annotations(label_mid);
CREATE INDEX IF NOT EXISTS idx_investigations_updated ON investigations(updated_at);
CREATE OR REPLACE VIEW category_repair_summary AS
SELECT c.id AS product_category_id, c.display_name, COUNT(r.id)::INTEGER AS total_cases,
  COUNT(r.id) FILTER (WHERE r.repair_status='Fixed')::INTEGER AS fixed_cases,
  COUNT(r.id) FILTER (WHERE r.repair_status='Repairable')::INTEGER AS repairable_cases,
  COUNT(r.id) FILTER (WHERE r.repair_status='End of life')::INTEGER AS end_of_life_cases
FROM product_categories c LEFT JOIN repair_cases r ON r.product_category_id=c.id
GROUP BY c.id, c.display_name;
