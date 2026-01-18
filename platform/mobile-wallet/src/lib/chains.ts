import chainsData from "../../../../config/chains.json";
import type { ChainId } from "@/types/miniapp";

export type ChainType = "neo-n3" | "evm";

export type ChainConfig = {
  id: ChainId;
  type: ChainType;
  rpc_urls?: string[];
  native_currency?: { symbol: string; decimals: number };
  network_magic?: number;
};

type ChainsDoc = { chains?: ChainConfig[] };

const DEFAULT_NEO_RPC_ENDPOINTS: Record<"mainnet" | "testnet", string> = {
  mainnet: "https://mainnet1.neo.coz.io:443",
  testnet: "https://testnet1.neo.coz.io:443",
};

function resolveNeoNetwork(chainId?: ChainId | null): "mainnet" | "testnet" {
  if (chainId && String(chainId).includes("mainnet")) return "mainnet";
  return "testnet";
}

const raw = (chainsData as ChainsDoc)?.chains ?? [];
const chains: ChainConfig[] = Array.isArray(raw) ? raw : [];

export function getChainConfig(chainId: ChainId): ChainConfig | undefined {
  return chains.find((chain) => chain.id === chainId);
}

export function getNetworkMagic(chainId?: ChainId | null): number | null {
  if (!chainId) return null;
  const chain = getChainConfig(chainId);
  return typeof chain?.network_magic === "number" ? chain.network_magic : null;
}

export function resolveChainType(chainId?: ChainId | null): ChainType | undefined {
  if (!chainId) return undefined;
  const chain = getChainConfig(chainId);
  if (chain?.type) return chain.type;
  if (String(chainId).startsWith("neo-n3")) return "neo-n3";
  return "evm";
}

export function getRpcUrl(chainId?: ChainId | null, chainType?: ChainType): string | null {
  if (chainId) {
    const chain = getChainConfig(chainId);
    if (chain?.rpc_urls?.length) return chain.rpc_urls[0] || null;
    const resolvedType = chain?.type || chainType || resolveChainType(chainId);
    if (resolvedType === "neo-n3") {
      return DEFAULT_NEO_RPC_ENDPOINTS[resolveNeoNetwork(chainId)];
    }
    return null;
  }
  if (chainType === "neo-n3") return DEFAULT_NEO_RPC_ENDPOINTS.mainnet;
  return null;
}
