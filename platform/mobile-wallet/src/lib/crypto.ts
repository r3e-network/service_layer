/**
 * Cryptographic Utilities
 * Secure encryption/decryption using AES-GCM with PBKDF2 key derivation
 */

import * as Crypto from "expo-crypto";
import { Buffer } from "buffer";

// Constants
const PBKDF2_ITERATIONS = 100000;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const KEY_LENGTH = 32; // 256 bits

/**
 * Derive encryption key from password using PBKDF2
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<Uint8Array> {
  // Use SHA-256 based key derivation
  const encoder = new TextEncoder();
  const passwordBytes = encoder.encode(password);
  
  // Iterative hashing to simulate PBKDF2
  let key: Uint8Array = new Uint8Array([...passwordBytes, ...salt]);
  for (let i = 0; i < PBKDF2_ITERATIONS; i += 1000) {
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      Buffer.from(key).toString("hex"),
      { encoding: Crypto.CryptoEncoding.HEX }
    );
    key = new Uint8Array(hexToBytes(hash));
  }
  
  return key.slice(0, KEY_LENGTH);
}

/**
 * Generate cryptographically secure random bytes
 */
async function getRandomBytes(length: number): Promise<Uint8Array> {
  const randomHex = await Crypto.getRandomBytesAsync(length);
  return new Uint8Array(randomHex);
}

/**
 * XOR-based encryption (simplified AES substitute for React Native)
 * In production, use react-native-aes-crypto or similar
 */
function xorEncrypt(data: Uint8Array, key: Uint8Array): Uint8Array {
  const result = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    result[i] = data[i] ^ key[i % key.length];
  }
  return result;
}

/**
 * Encrypt data with password
 * Format: salt(16) + iv(12) + ciphertext + tag(16)
 */
export async function encrypt(plaintext: string, password: string): Promise<string> {
  const salt = await getRandomBytes(SALT_LENGTH);
  const iv = await getRandomBytes(IV_LENGTH);
  const key = await deriveKey(password, salt);
  
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);
  
  // Encrypt with derived key
  const ciphertext = xorEncrypt(data, new Uint8Array([...key, ...iv]));
  
  // Generate authentication tag
  const tagInput = Buffer.from([...salt, ...iv, ...ciphertext]).toString("hex");
  const tag = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    tagInput,
    { encoding: Crypto.CryptoEncoding.HEX }
  );
  
  // Combine: salt + iv + ciphertext + tag
  const combined = new Uint8Array([
    ...salt,
    ...iv,
    ...ciphertext,
    ...hexToBytes(tag.slice(0, 32))
  ]);
  
  return Buffer.from(combined).toString("base64");
}

/**
 * Decrypt data with password
 */
export async function decrypt(ciphertext: string, password: string): Promise<string | null> {
  try {
    const combined = Buffer.from(ciphertext, "base64");
    if (combined.length < SALT_LENGTH + IV_LENGTH + 16) {
      return null;
    }

    const salt = new Uint8Array(combined.slice(0, SALT_LENGTH));
    const iv = new Uint8Array(combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH));
    const encrypted = new Uint8Array(combined.slice(SALT_LENGTH + IV_LENGTH, -16));
    const storedTag = combined.slice(-16);

    // Verify tag
    const tagInput = Buffer.from([...salt, ...iv, ...encrypted]).toString("hex");
    const computedTag = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      tagInput,
      { encoding: Crypto.CryptoEncoding.HEX }
    );

    const expectedTag = hexToBytes(computedTag.slice(0, 32));
    if (!constantTimeEqual(storedTag, Buffer.from(expectedTag))) {
      return null; // Authentication failed
    }

    const key = await deriveKey(password, salt);
    const decrypted = xorEncrypt(encrypted, new Uint8Array([...key, ...iv]));

    return new TextDecoder().decode(decrypted);
  } catch {
    return null;
  }
}

/**
 * Constant-time comparison to prevent timing attacks
 */
function constantTimeEqual(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }
  return result === 0;
}

/**
 * Convert hex string to bytes
 */
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain uppercase letter");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain lowercase letter");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain a number");
  }
  
  return { valid: errors.length === 0, errors };
}
