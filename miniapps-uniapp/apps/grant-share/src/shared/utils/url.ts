/**
 * Reads a query parameter from the URL, supporting both standard query strings
 * and hash-based query strings (e.g., #/path?param=value)
 */
export function readQueryParam(name: string): string | null {
  if (typeof window === "undefined") return null;
  const search = window.location.search || "";
  const direct = new URLSearchParams(search).get(name);
  if (direct) return direct;
  const hash = window.location.hash || "";
  if (hash.includes("?")) {
    const [, query] = hash.split("?");
    return new URLSearchParams(query).get(name);
  }
  return null;
}
