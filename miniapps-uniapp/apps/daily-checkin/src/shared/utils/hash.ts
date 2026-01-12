import { bytesToHex } from "./format";

export async function sha256Hex(value: string): Promise<string> {
  if (typeof value !== "string") {
    value = String(value ?? "");
  }
  if (typeof window !== "undefined" && window.crypto?.subtle) {
    const data = new TextEncoder().encode(value);
    const digest = await window.crypto.subtle.digest("SHA-256", data);
    return bytesToHex(new Uint8Array(digest));
  }
  const { createHash } = await import("crypto");
  return createHash("sha256").update(value, "utf8").digest("hex");
}
