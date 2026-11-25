// All calls to the FastAPI backend. The Gemini key never reaches the browser.
const BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const TIMEOUT_MS = 90_000;

export class ApiError extends Error {
  constructor(message, code = "error", status = 0) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function request(path, { method = "GET", body, signal, timeout = TIMEOUT_MS } = {}) {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeout);
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    if (res.status === 204) return null;
    let data = null;
    try {
      data = await res.json();
    } catch {
      /* non-JSON response */
    }
    if (!res.ok) {
      const err = data?.error;
      throw new ApiError(
        err?.message || "Something went wrong. Please try again.",
        err?.code || "http_error",
        res.status
      );
    }
    return data;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    if (e.name === "AbortError") {
      if (timedOut)
        throw new ApiError(
          "The request took too long. The server may be waking up - please try again.",
          "timeout"
        );
      throw e; // user cancelled
    }
    throw new ApiError(
      "Could not reach the server. Check your internet connection and try again.",
      "network_error"
    );
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  health: () => request("/api/health", { timeout: 20_000 }),
  listConversations: () => request("/api/conversations", { timeout: 30_000 }),
  getConversation: (id) => request(`/api/conversations/${id}`, { timeout: 30_000 }),
  renameConversation: (id, title) =>
    request(`/api/conversations/${id}`, { method: "PATCH", body: { title }, timeout: 30_000 }),
  deleteConversation: (id) =>
    request(`/api/conversations/${id}`, { method: "DELETE", timeout: 30_000 }),
  chat: ({ message, conversationId, tool, regenerate = false }, signal) =>
    request("/api/chat", {
      method: "POST",
      body: {
        message: message || "",
        conversation_id: conversationId || null,
        tool: tool || null,
        regenerate,
      },
      signal,
    }),
};
