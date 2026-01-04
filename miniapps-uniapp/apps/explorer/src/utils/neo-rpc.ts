/**
 * Neo RPC API Client
 * Provides real blockchain data integration for Neo N3
 */

export interface NeoRpcConfig {
  mainnet: string;
  testnet: string;
}

// Official Neo N3 RPC endpoints
export const NEO_RPC_ENDPOINTS: NeoRpcConfig = {
  mainnet: "https://mainnet1.neo.coz.io:443",
  testnet: "https://testnet1.neo.coz.io:443",
};

export type Network = "mainnet" | "testnet";

interface RpcRequest {
  jsonrpc: "2.0";
  method: string;
  params: any[];
  id: number;
}

interface RpcResponse<T = any> {
  jsonrpc: "2.0";
  id: number;
  result?: T;
  error?: {
    code: number;
    message: string;
  };
}

/**
 * Make a JSON-RPC call to Neo node
 */
async function rpcCall<T = any>(endpoint: string, method: string, params: any[] = []): Promise<T> {
  const request: RpcRequest = {
    jsonrpc: "2.0",
    method,
    params,
    id: Date.now(),
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`RPC request failed: ${response.statusText}`);
  }

  const data: RpcResponse<T> = await response.json();

  if (data.error) {
    throw new Error(`RPC error: ${data.error.message} (code: ${data.error.code})`);
  }

  if (data.result === undefined) {
    throw new Error("RPC response missing result");
  }

  return data.result;
}

/**
 * Get current block height
 */
export async function getBlockCount(network: Network): Promise<number> {
  const endpoint = NEO_RPC_ENDPOINTS[network];
  return await rpcCall<number>(endpoint, "getblockcount");
}

/**
 * Get block by index or hash
 */
export async function getBlock(network: Network, indexOrHash: number | string, verbose: boolean = true): Promise<any> {
  const endpoint = NEO_RPC_ENDPOINTS[network];
  return await rpcCall(endpoint, "getblock", [indexOrHash, verbose ? 1 : 0]);
}

/**
 * Get transaction by hash
 */
export async function getTransaction(network: Network, txHash: string): Promise<any> {
  const endpoint = NEO_RPC_ENDPOINTS[network];
  return await rpcCall(endpoint, "getrawtransaction", [txHash, 1]);
}

/**
 * Get account state (NEP-17 balances)
 */
export async function getAccountState(network: Network, address: string): Promise<any> {
  const endpoint = NEO_RPC_ENDPOINTS[network];
  return await rpcCall(endpoint, "getnep17balances", [address]);
}

/**
 * Get application log (contract execution results)
 */
export async function getApplicationLog(network: Network, txHash: string): Promise<any> {
  const endpoint = NEO_RPC_ENDPOINTS[network];
  return await rpcCall(endpoint, "getapplicationlog", [txHash]);
}

/**
 * Detect query type (block index, tx hash, or address)
 */
export function detectQueryType(query: string): "block" | "transaction" | "address" | "unknown" {
  query = query.trim();

  // Block index (numeric)
  if (/^\d+$/.test(query)) {
    return "block";
  }

  // Transaction hash (0x + 64 hex chars)
  if (/^0x[0-9a-fA-F]{64}$/.test(query)) {
    return "transaction";
  }

  // Neo N3 address (starts with N, 34 chars)
  if (/^N[0-9a-zA-Z]{33}$/.test(query)) {
    return "address";
  }

  return "unknown";
}

/**
 * Search blockchain data by query
 */
export async function searchBlockchain(network: Network, query: string): Promise<any> {
  const type = detectQueryType(query);

  switch (type) {
    case "block":
      const blockIndex = parseInt(query, 10);
      const block = await getBlock(network, blockIndex);
      return {
        type: "Block",
        hash: block.hash,
        index: block.index,
        timestamp: new Date(block.time).toLocaleString(),
        txCount: block.tx?.length || 0,
        size: block.size,
      };

    case "transaction":
      const tx = await getTransaction(network, query);
      return {
        type: "Transaction",
        hash: tx.hash,
        blockHeight: tx.blockindex,
        timestamp: tx.blocktime ? new Date(tx.blocktime * 1000).toLocaleString() : undefined,
        size: tx.size,
      };

    case "address":
      const account = await getAccountState(network, query);
      return {
        type: "Address",
        address: account.address,
        balances: account.balance || [],
      };

    default:
      throw new Error("Invalid query format");
  }
}
