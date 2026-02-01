/**
 * QR Code Utilities
 * Handles QR code parsing and generation for Neo N3 wallet
 */

// QR Code Types
export type QRType = "address" | "payment" | "walletconnect" | "unknown";

export interface PaymentRequest {
  address: string;
  amount?: string;
  asset?: string;
  memo?: string;
}

export interface ParsedQR {
  type: QRType;
  raw: string;
  data: PaymentRequest | string | null;
}

// Neo N3 address pattern
const NEO_ADDRESS_REGEX = /^N[A-Za-z0-9]{33}$/;

// Payment URI pattern: neo:NAddress?amount=X&asset=Y&memo=Z
const PAYMENT_URI_REGEX = /^neo:(N[A-Za-z0-9]{33})(\?.*)?$/;

// WalletConnect URI pattern
const WC_URI_REGEX = /^wc:[^@]+@\d+\?.+$/;

/**
 * Detect QR code type from content
 */
export function detectQRType(content: string): QRType {
  if (!content) return "unknown";

  if (WC_URI_REGEX.test(content)) {
    return "walletconnect";
  }
  if (PAYMENT_URI_REGEX.test(content)) {
    return "payment";
  }
  if (NEO_ADDRESS_REGEX.test(content)) {
    return "address";
  }
  return "unknown";
}

/**
 * Parse payment URI into components
 */
export function parsePaymentURI(uri: string): PaymentRequest | null {
  const match = uri.match(PAYMENT_URI_REGEX);
  if (!match) return null;

  const address = match[1];
  const queryString = match[2]?.slice(1) || "";
  const params = new URLSearchParams(queryString);

  return {
    address,
    amount: params.get("amount") || undefined,
    asset: params.get("asset") || undefined,
    memo: params.get("memo") || undefined,
  };
}

/**
 * Parse QR code content
 */
export function parseQRCode(content: string): ParsedQR {
  const type = detectQRType(content);

  switch (type) {
    case "payment":
      return { type, raw: content, data: parsePaymentURI(content) };
    case "address":
      return { type, raw: content, data: { address: content } };
    case "walletconnect":
      return { type, raw: content, data: content };
    default:
      return { type: "unknown", raw: content, data: null };
  }
}

/**
 * Generate payment URI from components
 */
export function generatePaymentURI(request: PaymentRequest): string {
  const params = new URLSearchParams();
  if (request.amount) params.set("amount", request.amount);
  if (request.asset) params.set("asset", request.asset);
  if (request.memo) params.set("memo", request.memo);

  const query = params.toString();
  return query ? `neo:${request.address}?${query}` : `neo:${request.address}`;
}

/**
 * Validate Neo N3 address format
 */
export function isValidNeoAddress(address: string): boolean {
  return NEO_ADDRESS_REGEX.test(address);
}
