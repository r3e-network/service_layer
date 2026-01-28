/**
 * Transaction Signing Module
 * 
 * Handles offline signing, multisig, and hardware wallet integration for Neo N3.
 * Uses secp256r1 (NIST P-256) curve for cryptographic operations.
 * 
 * @module signing
 * @example
 * ```typescript
 * import { signOffline, verifySignature, createMultisig } from '@/lib/signing';
 * 
 * // Sign a transaction offline
 * const signedTx = await signOffline(unsignedTx, privateKey);
 * 
 * // Verify a signature
 * const isValid = verifySignature(hash, signature, publicKey);
 * ```
 */

import * as SecureStore from "expo-secure-store";
import { p256 } from "@noble/curves/nist";
import { sha256 } from "@noble/hashes/sha2";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";

/** Storage key for signing history records */
const SIGNING_HISTORY_KEY = "signing_history";
/** Storage key for multisig wallet configurations */
const MULTISIG_KEY = "multisig_wallets";
/** Storage key for hardware wallet connection status */
const HW_CONNECTION_KEY = "hardware_connected";

/** Available signing methods */
export type SigningMethod = "software" | "hardware" | "multisig";
/** Transaction status in the signing workflow */
export type TxStatus = "pending" | "signed" | "broadcast" | "failed";

/**
 * Record of a signing operation for history tracking
 * @interface SigningRecord
 */
export interface SigningRecord {
  /** Unique identifier for the signing record */
  id: string;
  /** Hash of the signed transaction */
  txHash: string;
  /** Method used for signing */
  method: SigningMethod;
  /** Current status of the transaction */
  status: TxStatus;
  /** Unix timestamp when signing occurred */
  timestamp: number;
  /** List of signer addresses/public keys */
  signers: string[];
}

/**
 * Multi-signature wallet configuration
 * @interface MultisigWallet
 */
export interface MultisigWallet {
  /** Unique wallet identifier */
  id: string;
  /** Human-readable wallet name */
  name: string;
  /** Minimum signatures required (M of N) */
  threshold: number;
  /** List of participant public keys */
  publicKeys: string[];
  /** Unix timestamp of wallet creation */
  createdAt: number;
}

/**
 * Unsigned transaction ready for signing
 * @interface UnsignedTx
 */
export interface UnsignedTx {
  /** Sender address */
  from: string;
  /** Recipient address */
  to: string;
  /** Transfer amount as string */
  amount: string;
  /** Asset symbol (NEO, GAS, or contract hash) */
  asset: string;
  /** Transaction nonce for replay protection */
  nonce: number;
  /** Optional transaction data/memo */
  data?: string;
}

/**
 * Signed transaction ready for broadcast
 * @interface SignedTx
 */
export interface SignedTx {
  /** Raw transaction data */
  raw: string;
  /** Transaction hash (0x prefixed) */
  hash: string;
  /** Array of signatures in compact hex format */
  signatures: string[];
}

/**
 * Sign transaction offline using secp256r1 (NIST P-256) curve
 * 
 * Creates a signed transaction without network connectivity.
 * Useful for air-gapped signing workflows.
 * 
 * @param {UnsignedTx} tx - The unsigned transaction to sign
 * @param {string} privateKey - Private key in hex format (without 0x prefix)
 * @returns {Promise<SignedTx>} Signed transaction with hash and signatures
 * @throws {Error} If signing fails
 * 
 * @example
 * ```typescript
 * const signedTx = await signOffline({
 *   from: 'NXV7ZhHiyM1aHXwpVsRZC6BwNFP2jghXAq',
 *   to: 'NZHf1NJvz1tvELGLWZjhpb3NqZJFFUYpxT',
 *   amount: '10',
 *   asset: 'NEO',
 *   nonce: 1
 * }, privateKey);
 * ```
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
 * Verify signature using secp256r1 (NIST P-256) curve
 * 
 * @param {string} hash - Transaction hash (with or without 0x prefix)
 * @param {string} signature - Signature in compact hex format
 * @param {string} publicKey - Public key in compressed hex format
 * @returns {boolean} True if signature is valid, false otherwise
 * 
 * @example
 * ```typescript
 * const isValid = verifySignature(txHash, signature, publicKey);
 * if (!isValid) throw new Error('Invalid signature');
 * ```
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
 * Create a new multi-signature wallet
 * 
 * @param {string} name - Human-readable wallet name
 * @param {number} threshold - Minimum signatures required (M of N)
 * @param {string[]} publicKeys - Array of participant public keys
 * @returns {Promise<MultisigWallet>} Created multisig wallet configuration
 * @throws {Error} If threshold is invalid (< 1 or > publicKeys.length)
 * 
 * @example
 * ```typescript
 * const multisig = await createMultisig('Team Wallet', 2, [pubKey1, pubKey2, pubKey3]);
 * // Requires 2 of 3 signatures
 * ```
 */
export async function createMultisig(
  name: string,
  threshold: number,
  publicKeys: string[]
): Promise<MultisigWallet> {
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
 * Load all multisig wallets from secure storage
 * @returns {Promise<MultisigWallet[]>} Array of multisig wallet configurations
 */
export async function loadMultisigWallets(): Promise<MultisigWallet[]> {
  const data = await SecureStore.getItemAsync(MULTISIG_KEY);
  return data ? JSON.parse(data) : [];
}

/**
 * Load signing history records from secure storage
 * @returns {Promise<SigningRecord[]>} Array of signing records (newest first)
 */
export async function loadSigningHistory(): Promise<SigningRecord[]> {
  const data = await SecureStore.getItemAsync(SIGNING_HISTORY_KEY);
  return data ? JSON.parse(data) : [];
}

/**
 * Save a signing record to history (keeps last 50 records)
 * @param {SigningRecord} record - The signing record to save
 */
export async function saveSigningRecord(record: SigningRecord): Promise<void> {
  const history = await loadSigningHistory();
  history.unshift(record);
  const trimmed = history.slice(0, 50);
  await SecureStore.setItemAsync(SIGNING_HISTORY_KEY, JSON.stringify(trimmed));
}

/**
 * Generate a unique signing ID
 * @returns {string} Unique ID in format: sign_{timestamp}_{random}
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
export function getMethodLabel(
  method: SigningMethod,
  t?: (key: string, options?: Record<string, string | number>) => string
): string {
  if (t) {
    const keyMap: Record<SigningMethod, string> = {
      software: "signing.method.software",
      hardware: "signing.method.hardware",
      multisig: "signing.method.multisig",
    };
    return t(keyMap[method]);
  }
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
export function formatSigningDate(timestamp: number, locale = "en"): string {
  return new Date(timestamp).toLocaleDateString(locale);
}
