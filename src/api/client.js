// Same-origin API client. Image recognition runs locally in the browser in
// services/imageRecognition.js, so no image bytes are sent through this API.

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

  patch: (id, patch) => request(`/api/investigations/${id}`, { method: "PATCH", body: patch }),

  caseView: id => request(`/api/investigations/${id}/case`),

  reveal: id => request(`/api/investigations/${id}/reveal`, { method: "POST" }),

  transfer: id => request(`/api/investigations/${id}/transfer`, { method: "POST" }),

  complete: id => request(`/api/investigations/${id}/complete`, { method: "POST" })
};

export { ApiError };
