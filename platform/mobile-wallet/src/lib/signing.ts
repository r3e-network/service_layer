/**
 * Transaction Signing
 * Handles offline signing, multisig, and hardware wallet integration
 */

import * as SecureStore from "expo-secure-store";
import { p256 } from "@noble/curves/nist";
import { sha256 } from "@noble/hashes/sha2";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";

const SIGNING_HISTORY_KEY = "signing_history";
const MULTISIG_KEY = "multisig_wallets";
const HW_CONNECTION_KEY = "hardware_connected";

export type SigningMethod = "software" | "hardware" | "multisig";
export type TxStatus = "pending" | "signed" | "broadcast" | "failed";

export interface SigningRecord {
  id: string;
  txHash: string;
  method: SigningMethod;
  status: TxStatus;
  timestamp: number;
  signers: string[];
}

export interface MultisigWallet {
  id: string;
  name: string;
  threshold: number;
  publicKeys: string[];
  createdAt: number;
}

export interface UnsignedTx {
  from: string;
  to: string;
  amount: string;
  asset: string;
  nonce: number;
  data?: string;
}

export interface SignedTx {
  raw: string;
  hash: string;
  signatures: string[];
}

/**
 * Sign transaction offline using secp256r1
 */
export async function signOffline(tx: UnsignedTx, privateKey: string): Promise<SignedTx> {
  const txData = JSON.stringify(tx);
  const txBytes = new TextEncoder().encode(txData);
  const hashBytes = sha256(txBytes);
  const hash = "0x" + bytesToHex(hashBytes);

  const privKeyBytes = hexToBytes(privateKey);
  const signature = p256.sign(hashBytes, privKeyBytes);

  return { raw: txData, hash, signatures: [signature.toCompactHex()] };
}

/**
 * Verify signature using secp256r1
 */
export function verifySignature(hash: string, signature: string, publicKey: string): boolean {
  try {
    const hashBytes = hexToBytes(hash.startsWith("0x") ? hash.slice(2) : hash);
    const pubKeyBytes = hexToBytes(publicKey);
    const sig = p256.Signature.fromCompact(signature);
    return p256.verify(sig, hashBytes, pubKeyBytes);
  } catch {
    return false;
  }
}

/**
 * Create multisig wallet
 */
export async function createMultisig(name: string, threshold: number, publicKeys: string[]): Promise<MultisigWallet> {
  if (threshold < 1 || threshold > publicKeys.length) {
    throw new Error("Invalid threshold");
  }

  const wallet: MultisigWallet = {
    id: generateSigningId(),
    name,
    threshold,
    publicKeys,
    createdAt: Date.now(),
  };

  const existing = await loadMultisigWallets();
  existing.push(wallet);
  await SecureStore.setItemAsync(MULTISIG_KEY, JSON.stringify(existing));

  return wallet;
}

/**
 * Load multisig wallets
 */
export async function loadMultisigWallets(): Promise<MultisigWallet[]> {
  const data = await SecureStore.getItemAsync(MULTISIG_KEY);
  return data ? JSON.parse(data) : [];
}

/**
 * Load signing history
 */
export async function loadSigningHistory(): Promise<SigningRecord[]> {
  const data = await SecureStore.getItemAsync(SIGNING_HISTORY_KEY);
  return data ? JSON.parse(data) : [];
}

/**
 * Save signing record
 */
export async function saveSigningRecord(record: SigningRecord): Promise<void> {
  const history = await loadSigningHistory();
  history.unshift(record);
  const trimmed = history.slice(0, 50);
  await SecureStore.setItemAsync(SIGNING_HISTORY_KEY, JSON.stringify(trimmed));
}

/**
 * Generate signing ID
 */
export function generateSigningId(): string {
  return `sign_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Check if hardware wallet connected
 */
export async function isHardwareConnected(): Promise<boolean> {
  const status = await SecureStore.getItemAsync(HW_CONNECTION_KEY);
  return status === "true";
}

/**
 * Get signing method label
 */
export function getMethodLabel(method: SigningMethod): string {
  const labels: Record<SigningMethod, string> = {
    software: "Software Wallet",
    hardware: "Hardware Wallet",
    multisig: "Multi-Signature",
  };
  return labels[method];
}

/**
 * Format signing date
 */
export function formatSigningDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString();
}
