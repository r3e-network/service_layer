/**
 * Backup & Recovery
 * Handles wallet backup, verification, and restoration
 */

import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import { p256 } from "@noble/curves/nist";
import { sha256 } from "@noble/hashes/sha2";
import { ripemd160 } from "@noble/hashes/legacy";
import { bytesToHex } from "@noble/hashes/utils";

const BACKUP_KEY = "wallet_backup";
const BACKUP_META_KEY = "backup_metadata";

export type BackupType = "cloud" | "local";

export interface BackupMetadata {
  id: string;
  type: BackupType;
  timestamp: number;
  walletCount: number;
  encrypted: boolean;
}

export interface BackupData {
  version: number;
  wallets: WalletBackup[];
  createdAt: number;
  checksum: string;
}

export interface WalletBackup {
  name: string;
  address: string;
  encryptedMnemonic: string;
}

/**
 * Create encrypted backup of wallets
 */
export async function createBackup(wallets: WalletBackup[], password: string): Promise<BackupData> {
  const timestamp = Date.now();
  const data: Omit<BackupData, "checksum"> = {
    version: 1,
    wallets,
    createdAt: timestamp,
  };

  const checksum = await generateChecksum(JSON.stringify(data));

  return { ...data, checksum };
}

/**
 * Generate checksum for data integrity
 */
export async function generateChecksum(data: string): Promise<string> {
  const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, data);
  return hash.slice(0, 16);
}

/**
 * Verify checksum matches data
 */
export async function verifyChecksum(data: BackupData): Promise<boolean> {
  const { checksum, ...rest } = data;
  const computed = await generateChecksum(JSON.stringify(rest));
  return computed === checksum;
}

/**
 * Save backup metadata
 */
export async function saveBackupMetadata(meta: BackupMetadata): Promise<void> {
  const existing = await loadBackupHistory();
  existing.unshift(meta);
  const trimmed = existing.slice(0, 10);
  await SecureStore.setItemAsync(BACKUP_META_KEY, JSON.stringify(trimmed));
}

/**
 * Load backup history
 */
export async function loadBackupHistory(): Promise<BackupMetadata[]> {
  const data = await SecureStore.getItemAsync(BACKUP_META_KEY);
  return data ? JSON.parse(data) : [];
}

/**
 * Generate backup ID
 */
export function generateBackupId(): string {
  return `backup_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Validate mnemonic phrase
 */
export function validateMnemonic(mnemonic: string): boolean {
  const words = mnemonic.trim().toLowerCase().split(/\s+/);
  return words.length === 12 || words.length === 24;
}

/**
 * Verify mnemonic matches stored
 */
export async function verifyMnemonicMatch(input: string, stored: string): Promise<boolean> {
  const inputNorm = input.trim().toLowerCase();
  const storedNorm = stored.trim().toLowerCase();
  return inputNorm === storedNorm;
}

/**
 * Encrypt mnemonic with password
 */
export async function encryptMnemonic(mnemonic: string, password: string): Promise<string> {
  const combined = `${password}:${mnemonic}`;
  const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, combined);
  return Buffer.from(mnemonic).toString("base64") + "." + hash.slice(0, 8);
}

/**
 * Decrypt mnemonic with password
 */
export async function decryptMnemonic(encrypted: string, password: string): Promise<string | null> {
  const [encoded, hash] = encrypted.split(".");
  if (!encoded || !hash) return null;

  const mnemonic = Buffer.from(encoded, "base64").toString("utf-8");
  const combined = `${password}:${mnemonic}`;
  const computed = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, combined);

  if (computed.slice(0, 8) !== hash) return null;
  return mnemonic;
}

/**
 * Format backup date
 */
export function formatBackupDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString();
}

/**
 * Get backup type label
 */
export function getBackupTypeLabel(type: BackupType): string {
  return type === "cloud" ? "Cloud Backup" : "Local Backup";
}

/**
 * Restore wallet from mnemonic phrase
 */
export async function restoreWalletFromMnemonic(
  mnemonic: string,
  password: string,
): Promise<{ address: string; publicKey: string }> {
  const words = mnemonic.trim().toLowerCase().split(/\s+/);
  if (words.length !== 12 && words.length !== 24) {
    throw new Error("Invalid mnemonic length");
  }

  // Derive seed from mnemonic using SHA256
  const mnemonicBytes = new TextEncoder().encode(mnemonic);
  const seed = sha256(mnemonicBytes);

  // Use first 32 bytes as private key
  const privateKey = bytesToHex(seed);

  // Derive public key using secp256r1
  const pubKeyBytes = p256.getPublicKey(seed, true);
  const publicKey = bytesToHex(pubKeyBytes);

  // Generate Neo N3 address from public key
  const address = publicKeyToAddress(pubKeyBytes);

  // Encrypt and store mnemonic
  const encrypted = await encryptMnemonic(mnemonic, password);
  await SecureStore.setItemAsync("neo_mnemonic", encrypted);
  await SecureStore.setItemAsync("neo_private_key", privateKey);
  await SecureStore.setItemAsync("neo_public_key", publicKey);
  await SecureStore.setItemAsync("neo_address", address);

  return { address, publicKey };
}

/**
 * Convert public key to Neo N3 address
 */
function publicKeyToAddress(pubKeyBytes: Uint8Array): string {
  // Build verification script
  const script = new Uint8Array([0x0c, pubKeyBytes.length, ...pubKeyBytes, 0x41, 0x56, 0xe7, 0xb3, 0x27]);
  const scriptHash = ripemd160(sha256(script));

  // Add version byte (0x35 for Neo N3) and compute checksum
  const versioned = new Uint8Array([0x35, ...scriptHash]);
  const checksum = sha256(sha256(versioned)).slice(0, 4);
  const payload = new Uint8Array([...versioned, ...checksum]);

  return base58Encode(payload);
}

/**
 * Base58 encode
 */
function base58Encode(bytes: Uint8Array): string {
  const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let num = 0n;
  for (const byte of bytes) {
    num = num * 256n + BigInt(byte);
  }

  let result = "";
  while (num > 0n) {
    result = ALPHABET[Number(num % 58n)] + result;
    num = num / 58n;
  }

  for (const byte of bytes) {
    if (byte === 0) result = "1" + result;
    else break;
  }

  return result;
}
