/**
 * Neo N3 Message Signing
 * Implements message signing for MiniApp authentication using secp256r1
 */

import * as SecureStore from "expo-secure-store";
import { p256 } from "@noble/curves/nist";
import { sha256 } from "@noble/hashes/sha2";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";

const PRIVATE_KEY_STORAGE = "neo_private_key";

export interface SignedMessage {
  message: string;
  messageHex: string;
  publicKey: string;
  signature: string;
  salt: string;
}

/**
 * Sign a message with the wallet's private key
 * Uses Neo N3 message signing format with secp256r1
 */
export async function signMessage(message: string): Promise<SignedMessage | null> {
  const privateKey = await SecureStore.getItemAsync(PRIVATE_KEY_STORAGE);
  if (!privateKey) return null;

  const privKeyBytes = hexToBytes(privateKey);
  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  const salt = bytesToHex(saltBytes);

  const messageWithSalt = salt + message;
  const messageBytes = new TextEncoder().encode(messageWithSalt);
  const messageHash = sha256(messageBytes);
  const messageHex = bytesToHex(messageBytes);

  const signature = p256.sign(messageHash, privKeyBytes);
  const publicKey = bytesToHex(p256.getPublicKey(privKeyBytes));

  return {
    message,
    messageHex,
    publicKey,
    signature: signature.toCompactHex(),
    salt,
  };
}

/**
 * Verify a signed message using secp256r1
 */
export function verifySignature(messageHex: string, signature: string, publicKey: string): boolean {
  try {
    const messageBytes = hexToBytes(messageHex);
    const messageHash = sha256(messageBytes);
    const pubKeyBytes = hexToBytes(publicKey);
    const sig = p256.Signature.fromCompact(signature);
    return p256.verify(sig, messageHash, pubKeyBytes);
  } catch {
    return false;
  }
}
