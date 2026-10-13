import { vercelHandler } from "./_adapter.js";

const ACTIONS = new Set([
  "case", "reveal", "complete", "transfer", "safety-activity", "safety-reveal",
  "safety-comparison", "safety-boundary", "safety-status"
]);

// A fixed function route avoids hosts that do not expose the nested [id]
// function route correctly. The public API contract remains unchanged inside
// core/handler.js; this endpoint only unwraps the transport envelope.
export default vercelHandler(
  (_req, body) => {
    const id = String(body.id || "");
    const action = ACTIONS.has(body.action) ? `/${body.action}` : "";
    return `/api/investigations/${id}${action}`;
  },
  (_req, body) => ({
    method: String(body.operation || "GET").toUpperCase(),
    body: body.payload || {}
  })
);
