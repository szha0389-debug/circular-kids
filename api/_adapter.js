// Adapts Vercel's (req, res) to core/handler.js. Every function under api/ is
// three lines long because of this file.

import { handle } from "../core/handler.js";
import { createDbStore, knowledgeFor } from "./_db.js";
import { findItem } from "../core/catalogue.js";

const store = createDbStore();

export function vercelHandler(pathFor, requestFor) {
  return async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");
    try {
      const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
      const path = pathFor(req, body);
      const request = requestFor?.(req, body) || { method: req.method, body };
      const result = await handle({ method: request.method, path, body: request.body }, store);

      // The hosted deployment enriches a successful handover with dataset
      // evidence. It is added here, not in core, because only this deployment
      // has a database to read it from.
      if (result.status === 200 && result.body?.destination === "epic-2") {
        const item = findItem(result.body.payload.item.id);
        result.body.payload.datasetEvidence = await knowledgeFor(item?.name);
      }

      return res.status(result.status).json(result.body);
    } catch (error) {
      console.error(error);
      const errorCode = /^[a-z0-9_]{2,32}$/i.test(String(error?.code || ""))
        ? String(error.code)
        : "SERVER_ERROR";
      return res.status(500).json({
        message: `The service is temporarily unavailable. Your answers remain on this device. Reference: ${errorCode}`
      });
    }
  };
}
