export function formatNumber(value: number | string, decimals = 2): string {
  const num = typeof value === "number" ? value : Number.parseFloat(value);
  if (!Number.isFinite(num)) {
    return "0";
  }
  try {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  } catch {
    return num.toFixed(decimals);
  }
}

export function formatAddress(address?: string, head = 6, tail = 4): string {
  const value = (address ?? "").trim();
  if (!value) return "--";
  if (value.length <= head + tail + 3) return value;
  return `${value.slice(0, head)}...${value.slice(-tail)}`;
}

export function formatCountdown(targetSeconds: number): string {
  if (!Number.isFinite(targetSeconds)) return "--";
  const targetMs = targetSeconds > 1e12 ? targetSeconds : targetSeconds * 1000;
  const diff = Math.max(0, targetMs - Date.now());
  if (diff <= 0) return "Ended";

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function hexToBytes(hex: string): Uint8Array {
  const cleaned = hex.replace(/^0x/i, "").trim();
  if (!cleaned) return new Uint8Array();
  const normalized = cleaned.length % 2 === 0 ? cleaned : `0${cleaned}`;
  const bytes = new Uint8Array(normalized.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = Number.parseInt(normalized.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function randomIntFromBytes(bytes: Uint8Array, max?: number): number {
  if (!bytes.length) return 0;
  let value = 0n;
  for (const byte of bytes) {
    value = (value << 8n) + BigInt(byte);
  }
  const safeMax = BigInt(Number.MAX_SAFE_INTEGER);
  const safeValue = value % safeMax;
  if (typeof max === "number" && Number.isFinite(max) && max > 0) {
    return Number(safeValue % BigInt(Math.floor(max)));
  }
  return Number(safeValue);
}
