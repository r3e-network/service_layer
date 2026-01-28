/**
 * NFT Management
 * Handles NEP-11 NFT queries and transfers
 */

import * as SecureStore from "expo-secure-store";
import { p256 } from "@noble/curves/nist";
import { sha256 } from "@noble/hashes/sha2";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";

const NFT_CACHE_KEY = "nft_cache";
const RPC_ENDPOINT = "https://mainnet1.neo.coz.io:443";

export interface NFTMetadata {
  name: string;
  description?: string;
  image: string;
  attributes?: NFTAttribute[];
}

export interface NFTAttribute {
  trait_type: string;
  value: string | number;
}

export interface NFT {
  tokenId: string;
  contractAddress: string;
  collectionName: string;
  metadata: NFTMetadata;
  owner: string;
}

export interface NFTCollection {
  contractAddress: string;
  name: string;
  symbol: string;
  totalSupply: number;
}

/**
 * Load cached NFTs from storage
 */
export async function loadCachedNFTs(): Promise<NFT[]> {
  const data = await SecureStore.getItemAsync(NFT_CACHE_KEY);
  return data ? JSON.parse(data) : [];
}

/**
 * Save NFTs to cache
 */
export async function cacheNFTs(nfts: NFT[]): Promise<void> {
  await SecureStore.setItemAsync(NFT_CACHE_KEY, JSON.stringify(nfts));
}

/**
 * Get NFT by token ID
 */
export async function getNFTById(tokenId: string): Promise<NFT | undefined> {
  const nfts = await loadCachedNFTs();
  return nfts.find((n) => n.tokenId === tokenId);
}

/**
 * Filter NFTs by collection
 */
export function filterByCollection(nfts: NFT[], contractAddress: string): NFT[] {
  return nfts.filter((n) => n.contractAddress === contractAddress);
}

/**
 * Parse NFT metadata from JSON string
 */
export function parseMetadata(json: string): NFTMetadata | null {
  try {
    const data = JSON.parse(json);
    return {
      name: data.name || "Unknown",
      description: data.description,
      image: data.image || "",
      attributes: data.attributes,
    };
  } catch {
    return null;
  }
}

/**
 * Validate NFT token ID format
 */
export function isValidTokenId(tokenId: string): boolean {
  return tokenId.length > 0 && /^[a-fA-F0-9]+$/.test(tokenId);
}

/**
 * Transfer NFT to another address (NEP-11)
 */
export async function transferNFT(
  contractAddress: string,
  tokenId: string,
  to: string
): Promise<string> {
  const privateKey = await SecureStore.getItemAsync("neo_private_key");
  if (!privateKey) throw new Error("No private key found");

  const script = buildNFTTransferScript(contractAddress, tokenId, to);
  const scriptHash = sha256(hexToBytes(script));
  const privKeyBytes = hexToBytes(privateKey);
  const signature = p256.sign(scriptHash, privKeyBytes);

  const response = await fetch(RPC_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "sendrawtransaction",
      params: [signature.toCompactHex()],
    }),
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return data.result?.hash || "";
}

/**
 * Build NEP-11 transfer script
 */
function buildNFTTransferScript(contractAddress: string, tokenId: string, to: string): string {
  const script: number[] = [];
  const tokenIdBytes = hexToBytes(tokenId);

  // Push tokenId
  script.push(0x0c, tokenIdBytes.length, ...tokenIdBytes);

  // Push recipient address hash
  const toHash = addressToScriptHash(to);
  script.push(0x0c, 0x14, ...toHash);

  // Push method name "transfer"
  script.push(0x0c, 0x08);
  script.push(...Array.from(new TextEncoder().encode("transfer")));

  // Push contract address (reversed)
  const hash = contractAddress.startsWith("0x") ? contractAddress.slice(2) : contractAddress;
  script.push(0x0c, 0x14, ...reverseHex(hash));

  // SYSCALL System.Contract.Call
  script.push(0x41, 0x62, 0x7d, 0x5b, 0x52);

  return bytesToHex(new Uint8Array(script));
}

/**
 * Convert address to script hash
 */
function addressToScriptHash(address: string): number[] {
  const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let num = 0n;
  for (const char of address) {
    num = num * 58n + BigInt(ALPHABET.indexOf(char));
  }
  const hex = num.toString(16).padStart(50, "0");
  const bytes: number[] = [];
  for (let i = 2; i < 42; i += 2) {
    bytes.push(parseInt(hex.substr(i, 2), 16));
  }
  return bytes;
}

/**
 * Reverse hex string bytes
 */
function reverseHex(hex: string): number[] {
  const bytes: number[] = [];
  for (let i = hex.length - 2; i >= 0; i -= 2) {
    bytes.push(parseInt(hex.substr(i, 2), 16));
  }
  return bytes;
}
