// Neon-backed case store for the Vercel deployment.
//
// Implements the same four methods as core/store.js, so core/handler.js cannot
// tell which one it is talking to. No case rules live here — this file only
// moves rows in and out.

import { neon } from "@neondatabase/serverless";
import { applyUpdate, createRecord } from "../core/investigation.js";

function sql() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured");
  return neon(process.env.DATABASE_URL);
}

function shape(row) {
  if (!row) return null;
  return {
    id: row.id,
    stage: row.stage,
    itemId: row.item_id,
    problems: row.problems || [],
    answers: row.answers || [],
    verdict: row.verdict,
    safetyResponse: row.safety_response,
    comparisonResponse: row.comparison_response,
    safetyBoundary: row.safety_boundary,
    completed: row.status === "completed",
    imageStored: false,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime()
  };
}

export function createDbStore() {
  return {
    async create(id) {
      const rows = await sql()`
        INSERT INTO investigations (id, stage) VALUES (${id}, 'identify') RETURNING *`;
      return shape(rows[0]);
    },

    async get(id) {
      const rows = await sql()`SELECT * FROM investigations WHERE id = ${id} LIMIT 1`;
      return shape(rows[0]);
    },

    async update(id, input) {
      const current = await this.get(id);
      if (!current) return null;
      // Validation and field whitelisting happen in core, not in SQL.
      const next = applyUpdate(current, input);
      const rows = await sql()`
        UPDATE investigations SET
          item_id = ${next.itemId},
          problems = ${JSON.stringify(next.problems)},
          answers = ${JSON.stringify(next.answers)},
          verdict = ${next.verdict},
          safety_response = ${next.safetyResponse},
          comparison_response = ${next.comparisonResponse},
          safety_boundary = ${next.safetyBoundary},
          stage = ${next.stage},
          updated_at = NOW()
        WHERE id = ${id} RETURNING *`;
      return shape(rows[0]);
    },

    async complete(id) {
      const rows = await sql()`
        UPDATE investigations
        SET status = 'completed', completed_at = NOW(), updated_at = NOW()
        WHERE id = ${id} RETURNING *`;
      return shape(rows[0]);
    }
  };
}

/**
 * Circular-economy evidence for the handover, looked up by item name.
 * Read-only, and never used to judge the child's item — a category match means
 * a similar kind of product appears in the dataset, nothing more.
 */
export async function knowledgeFor(itemName) {
  const name = String(itemName || "").replace(/[^a-z0-9 ]/gi, " ").trim();
  if (!name) return { repair: null, materials: [], recalls: [] };

  const pattern = `%${name.replace(/s$/i, "")}%`;
  const db = sql();
  const [repair, materials, recalls] = await Promise.all([
    db`SELECT display_name, total_cases, fixed_cases, repairable_cases, end_of_life_cases
       FROM category_repair_summary WHERE display_name ILIKE ${pattern}
       ORDER BY total_cases DESC LIMIT 1`,
    db`SELECT DISTINCT m.name FROM materials m
       JOIN product_materials pm ON pm.material_id = m.id
       JOIN product_categories c ON c.id = pm.product_category_id
       WHERE c.display_name ILIKE ${pattern} ORDER BY m.name LIMIT 12`,
    db`SELECT title, published_at, recall_url FROM safety_recalls r
       JOIN product_categories c ON c.id = r.product_category_id
       WHERE c.display_name ILIKE ${pattern} ORDER BY published_at DESC LIMIT 5`
  ]);

  return {
    repair: repair[0] || null,
    materials: materials.map(row => row.name),
    recalls
  };
}
