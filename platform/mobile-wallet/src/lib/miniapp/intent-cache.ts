import type { InvocationIntent } from "./sdk-types";

export type IntentResult = {
  tx_hash: string;
  txid?: string | null;
  receipt_id?: string | null;
};

type IntentLookup = { invocation?: InvocationIntent; result?: IntentResult };

const pendingIntents = new Map<string, InvocationIntent>();
const resolvedIntents = new Map<string, IntentResult>();

const normalizeId = (value: string) => value.trim();

export function storeIntent(requestId: string, invocation: InvocationIntent): void {
  const id = normalizeId(String(requestId ?? ""));
  if (!id) return;
  pendingIntents.set(id, invocation);
}

export function resolveIntent(requestId: string, result: IntentResult): void {
  const id = normalizeId(String(requestId ?? ""));
  if (!id) return;
  pendingIntents.delete(id);
  resolvedIntents.set(id, result);
  if (result.receipt_id) {
    const receiptId = normalizeId(String(result.receipt_id));
    if (receiptId) resolvedIntents.set(receiptId, result);
  }
}

export function consumeIntent(requestId: string): IntentLookup | null {
  const id = normalizeId(String(requestId ?? ""));
  if (!id) return null;

  const resolved = resolvedIntents.get(id);
  if (resolved) return { result: resolved };

  const invocation = pendingIntents.get(id);
  if (!invocation) return null;
  return { invocation };
}
