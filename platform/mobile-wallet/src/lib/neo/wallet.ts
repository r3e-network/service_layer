/**
 * Neo N3 Wallet Core Library
 * Handles key generation, address derivation, and cryptographic operations
 */

import * as SecureStore from "expo-secure-store";
import { p256 } from "@noble/curves/nist";
import { sha256 } from "@noble/hashes/sha2";
import { ripemd160 } from "@noble/hashes/legacy";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";

// Neo N3 address prefix
const NEO_ADDRESS_VERSION = 0x35;

// Storage keys
const STORAGE_KEYS = {
  PRIVATE_KEY: "neo_private_key",
  ADDRESS: "neo_address",
  PUBLIC_KEY: "neo_public_key",
};

export interface WalletAccount {
  address: string;
  publicKey: string;
  hasPrivateKey: boolean;
}

/**
 * Generate a new Neo N3 wallet using secp256r1
 */
export async function generateWallet(): Promise<WalletAccount> {
  const privateKeyBytes = p256.utils.randomPrivateKey();
  const privateKey = bytesToHex(privateKeyBytes);

  const publicKey = derivePublicKey(privateKey);
  const address = publicKeyToAddress(publicKey);

  await SecureStore.setItemAsync(STORAGE_KEYS.PRIVATE_KEY, privateKey);
  await SecureStore.setItemAsync(STORAGE_KEYS.PUBLIC_KEY, publicKey);
  await SecureStore.setItemAsync(STORAGE_KEYS.ADDRESS, address);

  return { address, publicKey, hasPrivateKey: true };
}

/**
 * Import wallet from WIF (Wallet Import Format)
 */
export async function importFromWIF(wif: string): Promise<WalletAccount> {
  const privateKey = wifToPrivateKey(wif);
  const publicKey = derivePublicKey(privateKey);
  const address = publicKeyToAddress(publicKey);

  await SecureStore.setItemAsync(STORAGE_KEYS.PRIVATE_KEY, privateKey);
  await SecureStore.setItemAsync(STORAGE_KEYS.PUBLIC_KEY, publicKey);
  await SecureStore.setItemAsync(STORAGE_KEYS.ADDRESS, address);

  return { address, publicKey, hasPrivateKey: true };
}

/**
 * Load existing wallet from secure storage
 */
export async function loadWallet(): Promise<WalletAccount | null> {
  const address = await SecureStore.getItemAsync(STORAGE_KEYS.ADDRESS);
  const publicKey = await SecureStore.getItemAsync(STORAGE_KEYS.PUBLIC_KEY);
  const privateKey = await SecureStore.getItemAsync(STORAGE_KEYS.PRIVATE_KEY);

  if (!address || !publicKey) return null;

  return { address, publicKey, hasPrivateKey: !!privateKey };
}

/**
 * Delete wallet from secure storage
 */
export async function deleteWallet(): Promise<void> {
  await SecureStore.deleteItemAsync(STORAGE_KEYS.PRIVATE_KEY);
  await SecureStore.deleteItemAsync(STORAGE_KEYS.PUBLIC_KEY);
  await SecureStore.deleteItemAsync(STORAGE_KEYS.ADDRESS);
}

/**
 * Export wallet as WIF (requires authentication)
 */
export async function exportWIF(): Promise<string | null> {
  const privateKey = await SecureStore.getItemAsync(STORAGE_KEYS.PRIVATE_KEY);
  if (!privateKey) return null;
  return privateKeyToWIF(privateKey);
}

/**
 * Derive public key from private key using secp256r1
 */
function derivePublicKey(privateKey: string): string {
  const privKeyBytes = hexToBytes(privateKey);
  const pubKeyBytes = p256.getPublicKey(privKeyBytes, true);
  return bytesToHex(pubKeyBytes);
}

/**
 * Convert public key to Neo N3 address
 */
function publicKeyToAddress(publicKey: string): string {
  const pubKeyBytes = hexToBytes(publicKey);

  // Build verification script: PUSHDATA1 + len + pubkey + SYSCALL + CheckSig
  const script = new Uint8Array([
    0x0c,
    pubKeyBytes.length,
    ...pubKeyBytes,
    0x41,
    0x56,
    0xe7,
    0xb3,
    0x27,
  ]);

  // Script hash = RIPEMD160(SHA256(script))
  const scriptHash = ripemd160(sha256(script));

  // Address = Base58Check(version + scriptHash)
  const data = new Uint8Array([NEO_ADDRESS_VERSION, ...scriptHash]);
  const checksum = sha256(sha256(data)).slice(0, 4);
  const payload = new Uint8Array([...data, ...checksum]);

  return base58Encode(payload);
}

/**
 * Decode WIF to private key with validation
 */
function wifToPrivateKey(wif: string): string {
  const decoded = base58Decode(wif);

  // Validate WIF length: version(1) + privkey(32) + compressed(1) + checksum(4) = 38
  if (decoded.length !== 38) {
    throw new Error("Invalid WIF length");
  }

  // Validate version byte (0x80 for mainnet)
  if (decoded[0] !== 0x80) {
    throw new Error("Invalid WIF version byte");
  }

  // Validate checksum
  const data = decoded.slice(0, 34);
  const checksum = decoded.slice(34, 38);
  const expectedChecksum = sha256(sha256(data)).slice(0, 4);

  for (let i = 0; i < 4; i++) {
    if (checksum[i] !== expectedChecksum[i]) {
      throw new Error("Invalid WIF checksum");
    }
  }

  // Extract private key (bytes 1-33)
  return bytesToHex(decoded.slice(1, 33));
}

/**
 * Encode private key to WIF
 */
function privateKeyToWIF(privateKey: string): string {
  const privKeyBytes = hexToBytes(privateKey);
  // WIF: version(0x80) + privkey + compressed(0x01) + checksum
  const data = new Uint8Array([0x80, ...privKeyBytes, 0x01]);
  const checksum = sha256(sha256(data)).slice(0, 4);
  const payload = new Uint8Array([...data, ...checksum]);
  return base58Encode(payload);
}

const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

/**
 * Base58 encode
 */
function base58Encode(bytes: Uint8Array): string {
  let num = 0n;
  for (const byte of bytes) {
    num = num * 256n + BigInt(byte);
  }

  let result = "";
  while (num > 0n) {
    result = BASE58_ALPHABET[Number(num % 58n)] + result;
    num = num / 58n;
  }

  for (const byte of bytes) {
    if (byte === 0) result = "1" + result;
    else break;
  }

  return result;
}

/**
 * Base58 decode
 */
function base58Decode(str: string): Uint8Array {
  let num = 0n;
  for (const char of str) {
    num = num * 58n + BigInt(BASE58_ALPHABET.indexOf(char));
  }

  const hex = num.toString(16).padStart(76, "0");
  const bytes = new Uint8Array(38);
  for (let i = 0; i < 38; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}
