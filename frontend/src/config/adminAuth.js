import { API_BASE_URL } from "./api";

/**
 * Fetch wrapper for admin API calls. The JWT now lives in an httpOnly
 * cookie — the browser attaches it automatically via credentials:
 * "include". There's no token to read, store, or attach manually.
 */
export async function adminFetch(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (res.status === 401) {
    throw new Error("SESSION_EXPIRED");
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.message || "Request failed");
  }

  return data;
}

/**
 * Pings /api/auth/verify to check whether the httpOnly session cookie is
 * still valid. Needed because the cookie itself is invisible to JS.
 */
export async function checkAdminSession() {
  try {
    await adminFetch("/auth/verify");
    return true;
  } catch {
    return false;
  }
}