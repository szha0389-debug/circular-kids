const RENDER_URL = "https://circular-kids-ai.onrender.com/api/ai/health";
const UPSTREAM_TIMEOUT_MS = 28_000;

function jsonResponse(status, body, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...extraHeaders
    }
  });
}

export default {
  async fetch(request) {
    if (request.method !== "GET") {
      return jsonResponse(405, { message: "That action is not available." }, { Allow: "GET" });
    }

    try {
      const upstream = await fetch(RENDER_URL, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS)
      });

      const responseHeaders = new Headers({ "Cache-Control": "no-store" });
      const upstreamContentType = upstream.headers.get("content-type");
      if (upstreamContentType) responseHeaders.set("Content-Type", upstreamContentType);

      return new Response(upstream.body, {
        status: upstream.status,
        statusText: upstream.statusText,
        headers: responseHeaders
      });
    } catch (error) {
      console.error("AI health proxy failed", {
        name: error instanceof Error ? error.name : "UnknownError",
        message: error instanceof Error ? error.message : "Unknown upstream error"
      });
      return jsonResponse(502, { message: "The image-recognition service is unavailable." });
    }
  }
};
