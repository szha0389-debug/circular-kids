const fs = require("node:fs");
const path = require("node:path");
const { Readable } = require("node:stream");
const { pipeline } = require("node:stream/promises");
const Database = require("better-sqlite3");
const { Client } = require("pg");
const { from: copyFrom } = require("pg-copy-streams");

const root = path.resolve(__dirname, "..");
for (const line of fs.readFileSync(path.join(root, ".env.local"), "utf8").split(/\r?\n/)) {
  if (!line || line.startsWith("#")) continue;
  const at = line.indexOf("=");
  if (at > 0 && !process.env[line.slice(0, at)]) process.env[line.slice(0, at)] = line.slice(at + 1).replace(/^['"]|['"]$/g, "");
}
if (!process.env.DATABASE_URL_UNPOOLED && !process.env.DATABASE_URL) throw new Error("Database connection is missing");

const source = new Database(path.join(root, "db", "circular_kids.sqlite"), { readonly: true });
const client = new Client({ connectionString: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

function csv(value) {
  if (value === null || value === undefined || value === "") return "\\N";
  if (typeof value === "boolean") return value ? "true" : "false";
  const text = String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

async function copy(table, columns, query, transform = row => columns.map(c => row[c])) {
  let count = 0;
  function* lines() {
    for (const row of source.prepare(query).iterate()) {
      count += 1;
      yield transform(row).map(csv).join(",") + "\n";
    }
  }
  const stream = client.query(copyFrom(`COPY ${table} (${columns.join(",")}) FROM STDIN WITH (FORMAT csv, NULL '\\N')`));
  await pipeline(Readable.from(lines()), stream);
  console.log(`${table}: ${count}`);
}

async function main() {
  await client.connect();
  await client.query(fs.readFileSync(path.join(root, "db", "postgres.sql"), "utf8"));
  await client.query("BEGIN");
  try {
    await client.query("TRUNCATE image_annotations, safety_recalls, product_materials, repair_cases, materials, product_categories CASCADE");
    await copy("product_categories", ["id","canonical_name","display_name","repair_category_id","open_images_label","wikidata_class_uri","is_child_relevant"], "SELECT * FROM product_categories", r => [r.id,r.canonical_name,r.display_name,r.repair_category_id,r.open_images_label,r.wikidata_class_uri,Boolean(r.is_child_relevant)]);
    await copy("materials", ["id","wikidata_uri","name"], "SELECT * FROM materials");
    await copy("repair_cases", ["id","product_category_id","data_provider","country_code","original_category","brand","manufacture_year","product_age","repair_status","end_of_life_barrier","group_identifier","event_date","problem_text"], "SELECT * FROM repair_cases");
    await copy("product_materials", ["product_category_id","material_id","source_item_uri","source_item_name"], "SELECT * FROM product_materials");
    await copy("safety_recalls", ["id","title","product_category_id","original_category","published_at","description","recall_url"], "SELECT * FROM safety_recalls");
    await copy("image_annotations", ["id","image_id","source","label_mid","confidence","x_min","x_max","y_min","y_max","is_occluded","is_truncated","is_group_of","is_depiction","is_inside"], "SELECT * FROM image_annotations", r => [r.id,r.image_id,r.source,r.label_mid,r.confidence,r.x_min,r.x_max,r.y_min,r.y_max,Boolean(r.is_occluded),Boolean(r.is_truncated),Boolean(r.is_group_of),Boolean(r.is_depiction),Boolean(r.is_inside)]);
    await client.query("COMMIT");
    await client.query("ANALYZE");
    const result = await client.query("SELECT (SELECT COUNT(*) FROM repair_cases) repair_cases, (SELECT COUNT(*) FROM image_annotations) image_annotations, (SELECT COUNT(*) FROM safety_recalls) safety_recalls");
    console.log("Verified:", result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    source.close();
    await client.end();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
