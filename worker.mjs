// Fetch-API worker shell (OpenAI Apps hosting / Cloudflare-style runtimes).
//
// Previously this file carried its own copy of the case rules, which drifted
// from the other two backends. It is now a transport adapter and nothing else:
// every rule lives in core/ and is shared.

import { handle } from "./core/handler.js";
import { createStore } from "./core/store.js";

const store = createStore();

function json(body, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);

      if (url.pathname.startsWith("/api/")) {
        const body = ["POST", "PATCH", "PUT"].includes(request.method)
          ? await request.json().catch(() => ({}))
          : {};
        const result = await handle({ method: request.method, path: url.pathname, body }, store);
        return json(result.body, result.status);
      }

      // Static assets, with an SPA fallback so deep links reach the router.
      const asset = await env.ASSETS.fetch(request);
      if (asset.status !== 404) return asset;
      return env.ASSETS.fetch(new Request(new URL("/index.html", url), request));
    } catch {
      return json({ message: "Something went wrong. Your answers are safe on this device." }, 500);
    }
  }
};
