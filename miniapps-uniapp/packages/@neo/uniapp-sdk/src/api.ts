/**
 * Unified API fetch utility for SDK composables
 * Eliminates duplicate fetch/error handling patterns (DRY principle)
 */
import { API_BASE } from "./config";

export interface ApiError {
  message: string;
  code?: string;
}

/**
 * Performs a fetch request with standardized error handling
 */
export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint}`;

  const res = await fetch(url, {
    credentials: "include",
    ...options,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Request failed: ${endpoint}`);
  }

  return res.json();
}

/**
 * GET request helper
 */
export async function apiGet<T>(endpoint: string): Promise<T> {
  return apiFetch<T>(endpoint, { method: "GET" });
}

/**
 * POST request helper
 */
export async function apiPost<T>(endpoint: string, body: unknown): Promise<T> {
  return apiFetch<T>(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
