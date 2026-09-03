const RENDER_URL = "https://circular-kids-ai.onrender.com/api/image-recognition";
const VERCEL_BODY_LIMIT_BYTES = 4_500_000;
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
    if (request.method !== "POST") {
      return jsonResponse(405, { message: "That action is not available." }, { Allow: "POST" });
    }

    const contentType = request.headers.get("content-type") || "";
    if (!contentType.toLowerCase().startsWith("multipart/form-data;")) {
      return jsonResponse(400, { message: "Upload the image as multipart/form-data." });
    }

    const contentLength = Number(request.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > VERCEL_BODY_LIMIT_BYTES) {
      return jsonResponse(413, { message: "The upload exceeds Vercel's 4.5 MB request limit." });
    }

    try {
      const upstream = await fetch(RENDER_URL, {
        method: "POST",
        headers: {
          "Content-Type": contentType,
          ...(request.headers.get("content-length")
            ? { "Content-Length": request.headers.get("content-length") }
            : {})
        },
        body: request.body,
        duplex: "half",
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
      console.error("Image-recognition proxy failed", {
        name: error instanceof Error ? error.name : "UnknownError",
        message: error instanceof Error ? error.message : "Unknown upstream error"
      });
      return jsonResponse(502, { message: "The image-recognition service is unavailable." });
    }
  }
};
