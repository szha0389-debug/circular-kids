// Same-origin API client. Nothing here sends image bytes: recognition receives
// the file's name, type and size only, and the photo stays in the browser as an
// object URL for the length of the session.

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
      throw new ApiError(data.message || "Please try that again.", response.status);
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  catalogue: () => request("/api/catalogue"),

  open: () => request("/api/investigations", { method: "POST" }),

  get: id => request(`/api/investigations/${id}`),

  patch: (id, patch) => request(`/api/investigations/${id}`, { method: "PATCH", body: patch }),

  caseView: id => request(`/api/investigations/${id}/case`),

  /**
   * US-1.1 requires a result or progress within 8 seconds. The caller treats a
   * timeout exactly like a no-match: the child goes to the item list and is told
   * the photo did not work, never that an error occurred.
   */
  recognise: (id, file, timeout) =>
    request(`/api/investigations/${id}/recognise`, {
      method: "POST",
      body: { name: file.name, type: file.type, size: file.size },
      timeout
    }),

  reveal: id => request(`/api/investigations/${id}/reveal`, { method: "POST" }),

  transfer: id => request(`/api/investigations/${id}/transfer`, { method: "POST" }),

  safetyActivity: id => request(`/api/investigations/${id}/safety-activity`),

  safetyReveal: id => request(`/api/investigations/${id}/safety-reveal`, { method: "POST" }),

  safetyComparison: id => request(`/api/investigations/${id}/safety-comparison`),

  safetyBoundary: id => request(`/api/investigations/${id}/safety-boundary`, { method: "POST" }),

  safetyStatus: id => request(`/api/investigations/${id}/safety-status`),

  complete: id => request(`/api/investigations/${id}/complete`, { method: "POST" })
};

export { ApiError };
