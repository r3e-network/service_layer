/**
 * Neo N3 Transaction Builder
 * Handles transaction construction, signing, and broadcasting
 */

import * as SecureStore from "expo-secure-store";
import { p256 } from "@noble/curves/nist";
import { sha256 } from "@noble/hashes/sha2";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";

// Neo N3 native contract script hashes
export const CONTRACTS = {
  NEO: "0xef4073a0f2b305a38ec4050e4d3d28bc40ea63f5",
  GAS: "0xd2a4cff31913016155e38e474a2c06d08be276cf",
};

export interface TransferParams {
  from: string;
  to: string;
  asset: "NEO" | "GAS";
  amount: string;
}

export interface Transaction {
  hash: string;
  script: string;
  signers: Signer[];
  witnesses: Witness[];
}

interface Signer {
  account: string;
  scopes: string;
}

interface Witness {
  invocation: string;
  verification: string;
}

/**
 * Build a NEP-17 transfer script using Neo VM opcodes
 */
export function buildTransferScript(params: TransferParams): string {
  const contractHash = CONTRACTS[params.asset].slice(2);
  const amount = params.asset === "GAS" ? BigInt(Math.floor(parseFloat(params.amount) * 1e8)) : BigInt(params.amount);

  const script: number[] = [];

  // Push data (null for NEP-17 transfer)
  script.push(0x0b); // PUSHNULL

  // Push amount
  script.push(...encodeInteger(amount));

  // Push recipient address hash
  script.push(...encodeAddress(params.to));

  // Push sender address hash
  script.push(...encodeAddress(params.from));

  // Push method name "transfer"
  script.push(0x0c, 0x08); // PUSHDATA1, length 8
  script.push(...Array.from(new TextEncoder().encode("transfer")));

  // Push contract hash (reversed)
  script.push(0x0c, 0x14); // PUSHDATA1, length 20
  script.push(...reverseHex(contractHash));

  // SYSCALL System.Contract.Call
  script.push(0x41); // SYSCALL
  script.push(0x62, 0x7d, 0x5b, 0x52); // System.Contract.Call hash

  return bytesToHex(new Uint8Array(script));
}

/**
 * Sign transaction with private key using secp256r1
 */
export async function signTransaction(txHash: string): Promise<string> {
  const privateKey = await SecureStore.getItemAsync("neo_private_key");
  if (!privateKey) throw new Error("No private key found");

  const privKeyBytes = hexToBytes(privateKey);
  const hashBytes = hexToBytes(txHash);
  const signature = p256.sign(hashBytes, privKeyBytes);

  return signature.toCompactHex();
}

/**
 * Encode integer for Neo VM
 */
function encodeInteger(value: bigint): number[] {
  if (value === 0n) return [0x10]; // PUSH0
  if (value >= 1n && value <= 16n) return [0x10 + Number(value)]; // PUSH1-16

  const bytes: number[] = [];
  let v = value;
  while (v > 0n) {
    bytes.push(Number(v & 0xffn));
    v >>= 8n;
  }
  if (bytes[bytes.length - 1] >= 0x80) bytes.push(0);

  return [0x0c, bytes.length, ...bytes]; // PUSHDATA1
}

/**
 * Encode Neo address to script hash
 */
function encodeAddress(address: string): number[] {
  const decoded = base58CheckDecode(address);
  return [0x0c, 0x14, ...decoded]; // PUSHDATA1, 20 bytes
}

/**
 * Reverse hex string bytes
 */
function reverseHex(hex: string): number[] {
  const bytes = [];
  for (let i = hex.length - 2; i >= 0; i -= 2) {
    bytes.push(parseInt(hex.substr(i, 2), 16));
  }
  return bytes;
}

/**
 * Base58Check decode for Neo addresses
 */
function base58CheckDecode(address: string): number[] {
  const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let num = 0n;
  for (const char of address) {
    num = num * 58n + BigInt(ALPHABET.indexOf(char));
  }
  const hex = num.toString(16).padStart(50, "0");
  const bytes = [];
  for (let i = 2; i < 42; i += 2) {
    bytes.push(parseInt(hex.substr(i, 2), 16));
  }
  return bytes;
}
