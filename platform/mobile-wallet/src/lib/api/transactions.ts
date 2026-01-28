/**
 * Transaction History API
 * Fetches transaction history from Dora API
 */

const DORA_API = "https://dora.coz.io/api/v2/neo3/mainnet";

export interface Transaction {
  hash: string;
  time: number;
  block: number;
  from: string;
  to: string;
  amount: string;
  asset: "NEO" | "GAS";
  type: "send" | "receive";
  status: "confirmed" | "pending";
}

export interface TransactionResponse {
  transactions: Transaction[];
  total: number;
  page: number;
}

/**
 * Fetch transaction history for an address
 */
export async function fetchTransactions(address: string, page = 1, limit = 20): Promise<TransactionResponse> {
  try {
    const res = await fetch(`${DORA_API}/address/${address}/transfers?page=${page}&limit=${limit}`);
    if (!res.ok) throw new Error("Failed to fetch");

    const data = await res.json();
    return {
      transactions: mapTransactions(data.items || [], address),
      total: data.total || 0,
      page,
    };
  } catch {
    return { transactions: [], total: 0, page };
  }
}

function mapTransactions(items: Array<Record<string, unknown>>, userAddress: string): Transaction[] {
  return items.map((item) => ({
    hash: String(item.txid || item.hash),
    time: Number(item.time) * 1000,
    block: Number(item.block),
    from: String(item.from),
    to: String(item.to),
    amount: formatAmount(String(item.amount), String(item.symbol)),
    asset: item.symbol === "NEO" ? "NEO" : "GAS",
    type: item.to === userAddress ? "receive" : "send",
    status: "confirmed",
  }));
}

function formatAmount(amount: string, symbol: string): string {
  if (symbol === "NEO") return amount;
  return (parseInt(amount) / 1e8).toFixed(4);
}
