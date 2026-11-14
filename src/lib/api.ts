"use client";

/** Thin REST client. Cookies carry the JWT; a Bearer token is also sent if stored. */
export class ApiClientError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const TOKEN_KEY = "scriptlab_token";
export const tokenStore = {
  get: () => (typeof window === "undefined" ? null : window.localStorage.getItem(TOKEN_KEY)),
  set: (t: string) => window.localStorage.setItem(TOKEN_KEY, t),
  clear: () => window.localStorage.removeItem(TOKEN_KEY),
};

const API_BASE =
  typeof window !== "undefined" && window.location.hostname.includes("vercel.app")
    ? "https://scriptlab-dmb4.onrender.com/api"
    : (process.env.NEXT_PUBLIC_API_URL || "/api");

export async function api<T = unknown>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const headers: Record<string, string> = { ...(init.headers as Record<string, string>) };
  if (init.json !== undefined) headers["Content-Type"] = "application/json";
  const token = tokenStore.get();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const url = path.startsWith("http") ? path : `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, {
    ...init,
    headers,
    body: init.json !== undefined ? JSON.stringify(init.json) : init.body,
    credentials: "include",
    cache: "no-store",
  });
  let payload: { success: boolean; data?: T; error?: string } | null = null;
  try {
    payload = await res.json();
  } catch {
    /* no body */
  }
  if (!res.ok || !payload?.success) {
    throw new ApiClientError(res.status, payload?.error ?? `Request failed (${res.status})`);
  }
  return payload.data as T;
}
