/**
 * Format GAS amount from raw units (1 GAS = 100000000)
 */
export function formatGas(amount: bigint | number | string, decimals = 4): string {
  const value = typeof amount === 'bigint' ? amount : BigInt(amount || 0);
  const divisor = BigInt(100000000);
  const whole = value / divisor;
  const fraction = value % divisor;
  
  if (fraction === BigInt(0)) {
    return whole.toString();
  }
  
  const fractionStr = fraction.toString().padStart(8, '0');
  const trimmed = fractionStr.slice(0, decimals).replace(/0+$/, '');
  
  return trimmed ? `${whole}.${trimmed}` : whole.toString();
}

/**
 * Format number with commas
 */
export function formatNumber(num: number | bigint): string {
  return num.toLocaleString();
}

/**
 * Convert hex string to bytes
 */
export function hexToBytes(hex: string): Uint8Array {
  const cleaned = hex.replace(/^0x/i, '');
  if (cleaned.length % 2 !== 0) return new Uint8Array(0);
  const bytes = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < cleaned.length; i += 2) {
    bytes[i / 2] = parseInt(cleaned.slice(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Convert bytes to hex string
 */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
