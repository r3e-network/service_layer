import { bytesToHex, hexToBytes } from "./format";

export async function sha256Hex(value: string): Promise<string> {
  if (typeof value !== "string") {
    value = String(value ?? "");
  }
  if (typeof window !== "undefined" && window.crypto?.subtle) {
    const data = new TextEncoder().encode(value);
    const digest = await window.crypto.subtle.digest("SHA-256", data as any);
    return bytesToHex(new Uint8Array(digest));
  }
  const { createHash } = await import("crypto");
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export async function sha256HexFromBytes(bytes: Uint8Array): Promise<string> {
  const data = bytes instanceof Uint8Array ? bytes : new Uint8Array();
  if (typeof window !== "undefined" && window.crypto?.subtle) {
    const digest = await window.crypto.subtle.digest("SHA-256", data as any);
    return bytesToHex(new Uint8Array(digest));
  }
  const { createHash } = await import("crypto");
  return createHash("sha256").update(data).digest("hex");
}

export async function sha256HexFromHex(hex: string): Promise<string> {
  if (typeof hex !== "string") {
    hex = String(hex ?? "");
  }
  const cleaned = hex.replace(/^0x/i, "").trim();
  const normalized = cleaned.length % 2 === 0 ? cleaned : `0${cleaned}`;
  return sha256HexFromBytes(hexToBytes(normalized));
}
