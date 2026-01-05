/**
 * Intent Service for MiniApp Transactions
 * Fetches and executes transaction intents from the backend
 */

const EDGE_BASE_URL = "https://neomini.app/functions/v1";

export interface TransactionIntent {
  request_id: string;
  contract: string;
  method: string;
  params: unknown[];
  gas_fee?: string;
}

export interface IntentResult {
  tx_hash: string;
  status: "success" | "failed";
}

/**
 * Fetch transaction intent details from backend
 */
export async function fetchIntent(requestId: string): Promise<TransactionIntent> {
  const res = await fetch(`${EDGE_BASE_URL}/intent/${requestId}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Failed to fetch intent" }));
    throw new Error(err.error || "Intent not found");
  }
  return res.json();
}

/**
 * Submit signed transaction to the network
 */
export async function submitTransaction(requestId: string, signedTx: string): Promise<IntentResult> {
  const res = await fetch(`${EDGE_BASE_URL}/intent/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ request_id: requestId, signed_tx: signedTx }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Submission failed" }));
    throw new Error(err.error || "Transaction submission failed");
  }
  return res.json();
}
