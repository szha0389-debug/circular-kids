// Same-origin JSON API client. Image recognition uses its own multipart request
// in services/imageRecognition.js.

const TIMEOUT_MS = 12000;

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request(path, { method = "GET", body, timeout = TIMEOUT_MS } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(path, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const fallback = `Please try that again. (HTTP ${response.status})`;
      throw new ApiError(data.message || fallback, response.status);
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  catalogue: () => request("/api/catalogue"),

  open: () => request("/api/investigations", { method: "POST" }),

  get: id => investigationRequest(id),

  patch: (id, patch) => investigationRequest(id, { operation: "PATCH", payload: patch }),

  caseView: id => investigationRequest(id, { action: "case" }),

  reveal: id => investigationRequest(id, { action: "reveal", operation: "POST" }),

  transfer: id => investigationRequest(id, { action: "transfer", operation: "POST" }),

  safetyActivity: id => investigationRequest(id, { action: "safety-activity" }),

  safetyReveal: id => investigationRequest(id, { action: "safety-reveal", operation: "POST" }),

  safetyComparison: id => investigationRequest(id, { action: "safety-comparison" }),

  safetyBoundary: id => investigationRequest(id, { action: "safety-boundary", operation: "POST" }),

  safetyStatus: id => investigationRequest(id, { action: "safety-status" }),

  complete: id => investigationRequest(id, { action: "complete", operation: "POST" })
};

function investigationRequest(id, { action, operation = "GET", payload } = {}) {
  return request("/api/investigation", {
    method: "POST",
    body: { id, action, operation, payload }
  });
}

export { ApiError };
