/**
 * Neo N3 Message Signing
 * Implements message signing for MiniApp authentication using secp256r1
 */

import * as SecureStore from "expo-secure-store";
import { wallet } from "@cityofzion/neon-core";
import { Buffer } from "buffer";

const PRIVATE_KEY_STORAGE = "neo_private_key";

export interface SignedMessage {
  message: string;
  messageHex: string;
  publicKey: string;
  signature: string;
  salt: string;
}

const isHex = (value: string) => /^[0-9a-fA-F]+$/.test(value);

/**
 * Sign a message with the wallet's private key
 * Uses Neo N3 message signing format with secp256r1
 */
export async function signMessage(message: string): Promise<SignedMessage | null> {
  const privateKey = await SecureStore.getItemAsync(PRIVATE_KEY_STORAGE);
  if (!privateKey) return null;

  const trimmed = String(message ?? "").trim();
  if (!trimmed) return null;
  const messageHex =
    isHex(trimmed) && trimmed.length % 2 === 0
      ? trimmed
      : Buffer.from(trimmed, "utf8").toString("hex");

  const signature = wallet.sign(messageHex, privateKey);
  const account = new wallet.Account(privateKey);

  return {
    message: trimmed,
    messageHex,
    publicKey: account.publicKey,
    signature,
    salt: "",
  };
}

/**
 * Verify a signed message using secp256r1
 */
export function verifySignature(messageHex: string, signature: string, publicKey: string): boolean {
  try {
    const msg = String(messageHex ?? "").trim();
    if (!msg) return false;
    return wallet.verify(msg, signature, publicKey);
  } catch {
    return false;
  }
}
