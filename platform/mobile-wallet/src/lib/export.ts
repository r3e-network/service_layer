/**
 * Transaction Export
 * Handles CSV/PDF export for tax reporting
 */

import * as SecureStore from "expo-secure-store";

const EXPORT_HISTORY_KEY = "export_history";

export type ExportFormat = "csv" | "pdf";

export interface ExportRecord {
  id: string;
  format: ExportFormat;
  dateRange: { start: number; end: number };
  txCount: number;
  timestamp: number;
}

export interface TxExportData {
  hash: string;
  date: string;
  type: string;
  amount: string;
  asset: string;
  fee: string;
  status: string;
}

/**
 * Generate CSV content
 */
export function generateCSV(data: TxExportData[]): string {
  const headers = "Hash,Date,Type,Amount,Asset,Fee,Status\n";
  const rows = data.map((d) => `${d.hash},${d.date},${d.type},${d.amount},${d.asset},${d.fee},${d.status}`).join("\n");
  return headers + rows;
}

/**
 * Load export history
 */
export async function loadExportHistory(): Promise<ExportRecord[]> {
  const data = await SecureStore.getItemAsync(EXPORT_HISTORY_KEY);
  return data ? JSON.parse(data) : [];
}

/**
 * Save export record
 */
export async function saveExportRecord(record: ExportRecord): Promise<void> {
  const history = await loadExportHistory();
  history.unshift(record);
  await SecureStore.setItemAsync(EXPORT_HISTORY_KEY, JSON.stringify(history.slice(0, 20)));
}

/**
 * Generate export ID
 */
export function generateExportId(): string {
  return `export_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Format date for export
 */
export function formatExportDate(timestamp: number): string {
  return new Date(timestamp).toISOString().split("T")[0];
}

/**
 * Get format label
 */
export function getFormatLabel(format: ExportFormat): string {
  return format.toUpperCase();
}

export interface Transaction {
  hash: string;
  timestamp: number;
  type: string;
  amount: string;
  asset: string;
  fee?: string;
  status: string;
}

const RPC_ENDPOINT = "https://mainnet1.neo.coz.io:443";

/**
 * Get transaction history for address
 */
export async function getTransactionHistory(address: string): Promise<Transaction[]> {
  try {
    const response = await fetch(RPC_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getnep17transfers",
        params: [address],
      }),
    });
    const data = await response.json();
    const transfers = [...(data.result?.sent || []), ...(data.result?.received || [])];
    return transfers.map((tx: { txhash: string; timestamp: number; amount: string; assethash: string }) => ({
      hash: tx.txhash,
      timestamp: tx.timestamp * 1000,
      type: "transfer",
      amount: tx.amount,
      asset: tx.assethash,
      status: "confirmed",
    }));
  } catch {
    return [];
  }
}
