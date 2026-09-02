// Transport-neutral API. Every deployment target routes into this one function,
// which is what stops the three backends drifting apart again.
//
// It knows nothing about Node's http, Vercel's req/res, or the Fetch API — it
// takes a plain request description and returns `{ status, body }`.

import { caseView, reveal, safetyStatus, transferPayload } from "./investigation.js";
import { CATEGORIES, itemsInCategory, findItem } from "./catalogue.js";
import { recognise, REASONS } from "./recognition.js";
import {
  comparisonActivity,
  finalSafetyResult,
  safetyActivity,
  safetyReveal
} from "./safety.js";
import { randomUUID } from "node:crypto";

const NOT_FOUND = {
  status: 404,
  body: { message: "This investigation has finished. Please start a new one." }
};

const METHOD_NOT_ALLOWED = {
  status: 405,
  body: { message: "That action is not available." }
};

/** Everything the client needs to render the catalogue, fetched once. */
function catalogueResponse() {
  return {
    status: 200,
    body: {
      categories: CATEGORIES.map(category => ({
        ...category,
        items: itemsInCategory(category.id).map(item => ({
          id: item.id,
          name: item.name,
          icon: item.icon,
          isGeneral: Boolean(item.isGeneral)
        }))
      }))
    }
  };
}

/**
 * @param {object} request
 * @param {string} request.method
 * @param {string} request.path      e.g. "/api/investigations/abc/reveal"
 * @param {object} [request.body]
 * @param {object} store             create/get/update/complete, all async
 */
export async function handle({ method, path, body = {} }, store) {
  if (path === "/api/catalogue") {
    return method === "GET" ? catalogueResponse() : METHOD_NOT_ALLOWED;
  }

  if (path === "/api/investigations") {
    if (method !== "POST") return METHOD_NOT_ALLOWED;
    const record = await store.create(randomUUID());
    return { status: 201, body: record };
  }

  const match = path.match(
    /^\/api\/investigations\/([^/]+)(?:\/(recognise|case|reveal|complete|transfer|safety-activity|safety-reveal|safety-comparison|safety-boundary|safety-status))?$/
  );
  if (!match) return { status: 404, body: { message: "API route not found." } };

  const [, id, action] = match;
  const record = await store.get(id);
  if (!record) return NOT_FOUND;

  if (!action) {
    if (method === "GET") return { status: 200, body: record };
    if (method === "PATCH") {
      const updated = await store.update(id, body);
      if (!updated) return NOT_FOUND;
      return { status: 200, body: updated };
    }
    return METHOD_NOT_ALLOWED;
  }

  if (action === "case") {
    if (method !== "GET") return METHOD_NOT_ALLOWED;
    return { status: 200, body: caseView(record) || { item: null } };
  }

  if (action === "safety-activity") {
    if (method !== "GET") return METHOD_NOT_ALLOWED;
    return { status: 200, body: safetyActivity(record) };
  }

  if (action === "safety-comparison") {
    if (method !== "GET") return METHOD_NOT_ALLOWED;
    return { status: 200, body: comparisonActivity() };
  }

  if (action === "safety-status") {
    if (method !== "GET") return METHOD_NOT_ALLOWED;
    return { status: 200, body: safetyStatus(record) };
  }

  if (method !== "POST") return METHOD_NOT_ALLOWED;

  if (action === "recognise") {
    const result = recognise(body);
    // Resolve the item here so the client never has to know the catalogue shape
    // to render a suggestion.
    if (result.suggestion) {
      const item = findItem(result.suggestion.itemId);
      if (!item) {
        return { status: 200, body: { available: true, suggestion: null, reason: REASONS.NO_MATCH } };
      }
      result.suggestion = {
        ...result.suggestion,
        name: item.name,
        icon: item.icon,
        category: item.category
      };
    }
    return { status: 200, body: result };
  }

  if (action === "reveal") {
    // POST rather than GET: the reveal is a commitment point, not a lookup.
    const result = reveal(record);
    return { status: result.ok ? 200 : 409, body: result };
  }

  if (action === "complete") {
    const completed = await store.complete(id);
    if (!completed) return NOT_FOUND;
    return {
      status: 200,
      body: { ok: true, imageDeleted: true, investigation: completed }
    };
  }

  if (action === "transfer") {
    const result = transferPayload(record);
    if (result.ok) await store.complete(id);
    return { status: result.ok ? 200 : 409, body: result };
  }


  if (action === "safety-reveal") {
    const result = safetyReveal(record);
    return { status: result.ok ? 200 : 409, body: result };
  }

  if (action === "safety-boundary") {
    const result = finalSafetyResult(record);
    if (result.ok) {
      await store.update(id, { stage: "safety-boundary" });
    }
    return { status: result.ok ? 200 : 409, body: result };
  }

  return METHOD_NOT_ALLOWED;
}
