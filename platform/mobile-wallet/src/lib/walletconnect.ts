/**
 * WalletConnect v2 Integration
 * Handles DApp connections via WalletConnect protocol
 */

import * as SecureStore from "expo-secure-store";
import { p256 } from "@noble/curves/nist";
import { sha256 } from "@noble/hashes/sha2";
import { hexToBytes } from "@noble/hashes/utils";

const SESSIONS_KEY = "walletconnect_sessions";
const NEO_CHAIN_ID = "neo3:mainnet";
const NEO_TESTNET_CHAIN_ID = "neo3:testnet";

export interface WCSession {
  topic: string;
  peerMeta: PeerMeta;
  chainId: string;
  address: string;
  connectedAt: number;
  expiresAt: number;
}

export interface PeerMeta {
  name: string;
  description: string;
  url: string;
  icons: string[];
}

export interface WCRequest {
  id: number;
  topic: string;
  method: string;
  params: unknown[];
}

export interface SignTransactionParams {
  transaction: string;
  network?: string;
}

export interface SignMessageParams {
  message: string;
  address: string;
}

export type WCRequestType = "sign_transaction" | "sign_message" | "unknown";

/**
 * Parse WalletConnect URI
 */
export function parseWCUri(uri: string): { topic: string; version: number; relay: string } | null {
  if (!uri.startsWith("wc:")) return null;

  const match = uri.match(/^wc:([^@]+)@(\d+)\?(.+)$/);
  if (!match) return null;

  const [, topic, version, queryString] = match;
  const params = new URLSearchParams(queryString);

  return {
    topic,
    version: parseInt(version, 10),
    relay: params.get("relay-protocol") || "irn",
  };
}

/**
 * Validate WalletConnect URI format
 */
export function isValidWCUri(uri: string): boolean {
  return parseWCUri(uri) !== null;
}

/**
 * Get chain ID for network
 */
export function getChainId(network: "mainnet" | "testnet"): string {
  return network === "mainnet" ? NEO_CHAIN_ID : NEO_TESTNET_CHAIN_ID;
}

/**
 * Determine request type from method name
 */
export function getRequestType(method: string): WCRequestType {
  const lower = method.toLowerCase();
  if (lower.includes("sign") && lower.includes("transaction")) {
    return "sign_transaction";
  }
  if (lower.includes("sign") && lower.includes("message")) {
    return "sign_message";
  }
  return "unknown";
}

/**
 * Load saved sessions from storage
 */
export async function loadSessions(): Promise<WCSession[]> {
  const data = await SecureStore.getItemAsync(SESSIONS_KEY);
  if (!data) return [];
  const sessions: WCSession[] = JSON.parse(data);
  // Filter out expired sessions
  const now = Date.now();
  return sessions.filter((s) => s.expiresAt > now);
}

/**
 * Save session to storage
 */
export async function saveSession(session: WCSession): Promise<void> {
  const sessions = await loadSessions();
  const exists = sessions.some((s) => s.topic === session.topic);
  if (!exists) {
    sessions.push(session);
    await SecureStore.setItemAsync(SESSIONS_KEY, JSON.stringify(sessions));
  }
}

/**
 * Remove session from storage
 */
export async function removeSession(topic: string): Promise<void> {
  const sessions = await loadSessions();
  const filtered = sessions.filter((s) => s.topic !== topic);
  await SecureStore.setItemAsync(SESSIONS_KEY, JSON.stringify(filtered));
}

/**
 * Get session by topic
 */
export async function getSession(topic: string): Promise<WCSession | undefined> {
  const sessions = await loadSessions();
  return sessions.find((s) => s.topic === topic);
}

/**
 * Create a new session object
 */
export function createSession(
  topic: string,
  peerMeta: PeerMeta,
  address: string,
  network: "mainnet" | "testnet",
): WCSession {
  const now = Date.now();
  return {
    topic,
    peerMeta,
    chainId: getChainId(network),
    address,
    connectedAt: now,
    expiresAt: now + 7 * 24 * 60 * 60 * 1000, // 7 days
  };
}

/**
 * Sign WalletConnect request using secp256r1
 */
export async function signWCRequest(request: WCRequest): Promise<string> {
  const privateKey = await SecureStore.getItemAsync("neo_private_key");
  if (!privateKey) throw new Error("No private key found");

  const requestType = getRequestType(request.method);
  let dataToSign: Uint8Array;

  if (requestType === "sign_message") {
    const params = request.params[0] as SignMessageParams;
    dataToSign = new TextEncoder().encode(params.message);
  } else if (requestType === "sign_transaction") {
    const params = request.params[0] as SignTransactionParams;
    dataToSign = hexToBytes(params.transaction);
  } else {
    throw new Error("Unsupported request type");
  }

  const hash = sha256(dataToSign);
  const privKeyBytes = hexToBytes(privateKey);
  const signature = p256.sign(hash, privKeyBytes);

  return signature.toCompactHex();
}

/**
 * Send response back to DApp via local storage
 * Note: Full WalletConnect relay integration requires @walletconnect/sign-client SDK
 * This implementation stores responses locally for retrieval by connected DApps
 */
export async function sendWCResponse(requestId: number, result: string): Promise<void> {
  const responseKey = `wc_response_${requestId}`;
  await SecureStore.setItemAsync(responseKey, JSON.stringify({ id: requestId, result, timestamp: Date.now() }));
}
