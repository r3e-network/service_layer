import { hexToBytes, bytesToHex } from "./format";

const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

/** Neo VM stack item types */
export type StackItemType =
  | "Integer"
  | "Boolean"
  | "ByteArray"
  | "ByteString"
  | "String"
  | "Hash160"
  | "Hash256"
  | "Array"
  | "Struct"
  | "Map"
  | "Any"
  | "Pointer"
  | "Buffer"
  | "InteropInterface";

/** Raw Neo VM stack item from RPC response */
export interface RawStackItem {
  type?: string;
  Type?: string;
  value?: unknown;
  Value?: unknown;
}

/** Parsed stack item value */
export type ParsedStackValue =
  | string
  | boolean
  | number
  | ParsedStackValue[]
  | Record<string, ParsedStackValue>
  | null
  | undefined;

function base58Decode(value: string): Uint8Array {
  const bytes: number[] = [0];
  for (const char of value) {
    const digit = BASE58_ALPHABET.indexOf(char);
    if (digit < 0) {
      throw new Error("Invalid base58 character");
    }
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] *= 58;
    }
    bytes[0] += digit;
    let carry = 0;
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] += carry;
      carry = bytes[i] >> 8;
      bytes[i] &= 0xff;
    }
    while (carry) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  for (const char of value) {
    if (char === "1") {
      bytes.push(0);
    } else {
      break;
    }
  }
  return Uint8Array.from(bytes.reverse());
}

export function normalizeScriptHash(value: string): string {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  return trimmed.replace(/^0x/i, "").toLowerCase();
}

export function addressToScriptHash(address: string): string {
  const trimmed = String(address || "").trim();
  if (!trimmed) return "";
  if (/^(0x)?[0-9a-fA-F]{40}$/.test(trimmed)) {
    return normalizeScriptHash(trimmed);
  }
  const decoded = base58Decode(trimmed);
  if (decoded.length < 21) {
    return "";
  }
  const payloadLength = decoded.length >= 25 ? decoded.length - 4 : decoded.length - 3;
  const payload = decoded.slice(0, payloadLength);
  const scriptHash = payload.slice(1);
  return bytesToHex(Uint8Array.from(scriptHash).reverse());
}

function decodeHexToText(hex: string): string | null {
  try {
    const bytes = hexToBytes(hex);
    if (!bytes.length) return "";
    const decoder = new TextDecoder("utf-8", { fatal: false });
    const decoded = decoder.decode(bytes);
    return decoded.includes("\uFFFD") ? null : decoded;
  } catch {
    return null;
  }
}

export function parseStackItem(item: RawStackItem | unknown): ParsedStackValue {
  if (!item || typeof item !== "object") return item as ParsedStackValue;
  const rawItem = item as RawStackItem;
  const type = String(rawItem.type || rawItem.Type || "");
  const value = rawItem.value ?? rawItem.Value;

  switch (type) {
    case "Integer":
      return value ?? "0";
    case "Boolean":
      return value === true || value === "true" || value === 1 || value === "1";
    case "ByteArray":
    case "ByteString": {
      const raw = String(value ?? "");
      const cleaned = raw.replace(/^0x/i, "");
      const asText = decodeHexToText(cleaned);
      return asText !== null ? asText : cleaned;
    }
    case "String":
      return String(value ?? "");
    case "Hash160":
    case "Hash256":
      return normalizeScriptHash(String(value ?? ""));
    case "Array":
    case "Struct":
      return Array.isArray(value) ? value.map(parseStackItem) : [];
    case "Map":
      if (Array.isArray(value)) {
        const obj: Record<string, ParsedStackValue> = {};
        for (const entry of value) {
          const key = parseStackItem(entry?.key);
          const val = parseStackItem(entry?.value);
          obj[String(key)] = val;
        }
        return obj;
      }
      return {};
    default:
      return value as ParsedStackValue;
  }
}

/** Raw invoke result from RPC response */
interface RawInvokeResult {
  stack?: unknown[];
  result?: { stack?: unknown[]; state?: unknown[] };
  state?: unknown[];
  value?: unknown;
  type?: string;
}

export function parseInvokeResult(payload: RawInvokeResult | unknown[] | unknown): ParsedStackValue {
  if (!payload) return null;
  if (Array.isArray(payload)) return payload.map(parseStackItem);

  const result = payload as RawInvokeResult;
  const stack = result.stack || result.result?.stack || result.state || result.result?.state || result.value || null;

  if (Array.isArray(stack)) {
    const parsed = stack.map(parseStackItem);
    return parsed.length === 1 ? parsed[0] : parsed;
  }

  if (result.type) {
    return parseStackItem(payload);
  }

  return payload as ParsedStackValue;
}
