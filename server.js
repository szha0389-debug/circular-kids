// Local API server.
//
// Two jobs, both thin: parse the request into the shape core/handler.js wants,
// and serve the built client from dist/ when there is one. All case logic lives
// in core/ and is shared with the Vercel functions and the worker.

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { handle } from "./core/handler.js";
import { createStore } from "./core/store.js";

const root = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(root, "dist");
const publicDir = path.join(root, "public");
const port = Number(process.env.PORT || 5121);
// Vercel Services routes AI endpoints directly to the container. This fallback
// exists only for the local `npm run dev` workflow.
const aiInferenceUrl =
  process.env.AI_INFERENCE_URL || (process.env.VERCEL ? null : "http://127.0.0.1:8000");
const store = createStore();

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".woff2": "font/woff2"
};

const CSP =
  "default-src 'self'; img-src 'self' blob: data:; style-src 'self' 'unsafe-inline'; " +
  "script-src 'self'; connect-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'";

function sendJson(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", chunk => {
      raw += chunk;
      // API requests contain structured investigation data, never image bytes.
      if (raw.length > 1_000_000) {
        reject(Object.assign(new Error("That request was too large."), { status: 413 }));
      }
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(Object.assign(new Error("That information could not be read."), { status: 400 }));
      }
    });
    req.on("error", reject);
  });
}

/** Read one bounded multipart request without writing the image to disk. */
function readBinaryBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", chunk => {
      size += chunk.length;
      if (size > 4_250_000) {
        reject(Object.assign(new Error("That image is too large."), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

/** Forward only image-recognition routes to the local PyTorch service. */
async function proxyAi(req, res, url) {
  try {
    if (!aiInferenceUrl) {
      return sendJson(res, 503, { message: "The image-recognition service is unavailable." });
    }
    const hasBody = !["GET", "HEAD"].includes(req.method);
    const body = hasBody ? await readBinaryBody(req) : undefined;
    const response = await fetch(new URL(url.pathname + url.search, aiInferenceUrl), {
      method: req.method,
      headers: {
        ...(req.headers["content-type"] ? { "Content-Type": req.headers["content-type"] } : {}),
        ...(req.headers.accept ? { Accept: req.headers.accept } : {})
      },
      body
    });
    const payload = Buffer.from(await response.arrayBuffer());
    res.writeHead(response.status, {
      "Content-Type": response.headers.get("content-type") || "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    });
    res.end(payload);
  } catch (error) {
    console.error("AI inference proxy failed", error);
    if (error.status) {
      return sendJson(res, error.status, { message: error.message });
    }
    sendJson(res, 503, { message: "The image-recognition service is unavailable." });
  }
}

/** Resolve a URL path to a file inside one of the served directories. */
function resolveFile(urlPath) {
  const clean = path.normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[/\\])+/, "");
  for (const dir of [distDir, publicDir]) {
    const file = path.join(dir, clean);
    if (!file.startsWith(dir)) continue;
    if (fs.existsSync(file) && fs.statSync(file).isFile()) return file;
  }
  return null;
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

    if (url.pathname === "/api/image-recognition" || url.pathname === "/api/ai/health") {
      return proxyAi(req, res, url);
    }

    if (url.pathname.startsWith("/api/")) {
      const body = ["POST", "PATCH", "PUT"].includes(req.method) ? await readBody(req) : {};
      const result = await handle({ method: req.method, path: url.pathname, body }, store);
      return sendJson(res, result.status, result.body);
    }

    // Static: the built client, then anything in public/ (images, favicon).
    // Unmatched paths fall through to index.html so the SPA router can take over.
    const file =
      resolveFile(url.pathname) ||
      (fs.existsSync(path.join(distDir, "index.html")) ? path.join(distDir, "index.html") : null);

    if (!file) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end("Client not built. Run: npm run build   (or npm run dev)");
    }

    res.writeHead(200, {
      "Content-Type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": CSP
    });
    fs.createReadStream(file).pipe(res);
  } catch (error) {
    sendJson(res, error.status || 500, {
      message: error.status ? error.message : "Something went wrong. Your answers are safe on this device."
    });
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Circular Kids API: http://127.0.0.1:${port}`);
});

export { server };
