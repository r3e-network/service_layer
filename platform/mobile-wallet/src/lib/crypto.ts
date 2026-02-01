/**
 * Cryptographic Utilities
 * Secure encryption/decryption using AES-256-CBC with PBKDF2 key derivation
 * and HMAC-SHA256 authentication (encrypt-then-MAC).
 *
 * @module crypto
 *
 * @example
 * ```typescript
 * import { encrypt, decrypt, validatePassword } from "@/lib/crypto";
 *
 * const encrypted = await encrypt("sensitive data", "StrongP@ss1");
 * const decrypted = await decrypt(encrypted, "StrongP@ss1");
 * ```
 */

import Aes from "react-native-aes-crypto";

// Constants
const PBKDF2_ITERATIONS = 100000;
const SALT_LENGTH = 16;
const IV_LENGTH = 16;
const DERIVED_KEY_BITS = 512;
const AES_ALGORITHM = "aes-256-cbc" as const;
const PBKDF2_ALGORITHM = "sha256" as const;

/**
 * Minimum password requirements for wallet encryption
 */
export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: false, // Optional but recommended
} as const;

type DerivedKeys = {
  encKey: string;
  macKey: string;
};

async function deriveKeys(password: string, salt: string): Promise<DerivedKeys> {
  const derived = await Aes.pbkdf2(password, salt, PBKDF2_ITERATIONS, DERIVED_KEY_BITS, PBKDF2_ALGORITHM);

  if (derived.length >= 128) {
    return {
      encKey: derived.slice(0, 64),
      macKey: derived.slice(64, 128),
    };
  }

  const macKey = await Aes.pbkdf2(password, `${salt}:mac`, PBKDF2_ITERATIONS, 256, PBKDF2_ALGORITHM);
  return { encKey: derived, macKey };
}

/**
 * Encrypt data with password
 * Format: salt:iv:ciphertext:hmac
 */
export async function encrypt(plaintext: string, password: string): Promise<string> {
  const salt = await Aes.randomKey(SALT_LENGTH);
  const iv = await Aes.randomKey(IV_LENGTH);
  const { encKey, macKey } = await deriveKeys(password, salt);

  const ciphertext = await Aes.encrypt(plaintext, encKey, iv, AES_ALGORITHM);
  const mac = await Aes.hmac256(`${salt}:${iv}:${ciphertext}`, macKey);

  return `${salt}:${iv}:${ciphertext}:${mac}`;
}

/**
 * Decrypt data with password
 */
export async function decrypt(payload: string, password: string): Promise<string | null> {
  try {
    const parts = payload.split(":");
    if (parts.length !== 4) return null;

    const [salt, iv, ciphertext, mac] = parts;
    const { encKey, macKey } = await deriveKeys(password, salt);
    const expectedMac = await Aes.hmac256(`${salt}:${iv}:${ciphertext}`, macKey);

    if (!constantTimeEqual(mac, expectedMac)) {
      return null;
    }

    return await Aes.decrypt(ciphertext, encKey, iv, AES_ALGORITHM);
  } catch {
    return null;
  }
}

/**
 * Constant-time comparison to prevent timing attacks
 */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// Pre-compiled regex patterns for password validation
const UPPERCASE_REGEX = /[A-Z]/;
const LOWERCASE_REGEX = /[a-z]/;
const NUMBER_REGEX = /[0-9]/;

/**
 * Validate password strength
 */
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters");
  }
  if (!UPPERCASE_REGEX.test(password)) {
    errors.push("Password must contain uppercase letter");
  }
  if (!LOWERCASE_REGEX.test(password)) {
    errors.push("Password must contain lowercase letter");
  }
  if (!NUMBER_REGEX.test(password)) {
    errors.push("Password must contain a number");
  }

  return { valid: errors.length === 0, errors };
}
