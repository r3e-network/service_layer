import * as SecureStore from "expo-secure-store";
import { rpc, sc, tx, u, wallet } from "@cityofzion/neon-core";
import type { ChainId } from "@/types/miniapp";
import type { InvocationIntent } from "@/lib/miniapp/sdk-types";
import { getNetworkMagic, getRpcUrl } from "@/lib/chains";

const VALID_UNTIL_BLOCK_OFFSET = 5760;

const DEFAULT_NETWORK_MAGIC: Record<"mainnet" | "testnet", number> = {
  mainnet: 860833102,
  testnet: 894710606,
};

const parseFixed8 = (value: string) => {
  const cleaned = String(value || "0").trim();
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return "0";
  const [whole, fraction = ""] = cleaned.split(".");
  const normalized = `${whole}${fraction.padEnd(8, "0").slice(0, 8)}`;
  return BigInt(normalized || "0").toString();
};

const normalizeParamJson = (param: unknown, senderAddress: string): unknown => {
  if (!param || typeof param !== "object" || !("type" in param)) return param;
  const p = param as Record<string, unknown>;
  const type = String(p.type ?? "");
  let value = p.value;

  if (type === "Hash160" && value === "SENDER") {
    value = senderAddress;
  }

  if (type === "Array" && Array.isArray(value)) {
    value = value.map((entry) => normalizeParamJson(entry, senderAddress));
  }

  if (type === "Map" && Array.isArray(value)) {
    value = value.map((entry) => ({
      key: normalizeParamJson(entry?.key, senderAddress),
      value: normalizeParamJson(entry?.value, senderAddress),
    }));
  }

  return { ...param, type, value };
};

const toContractParam = (param: unknown, senderAddress: string): sc.ContractParam => {
  if (param instanceof sc.ContractParam) return param;
  if (param && typeof param === "object" && "type" in param) {
    return sc.ContractParam.fromJson(normalizeParamJson(param, senderAddress) as sc.ContractParamLike);
  }
  if (typeof param === "number") return sc.ContractParam.integer(param);
  if (typeof param === "boolean") return sc.ContractParam.boolean(param);
  if (typeof param === "string") return sc.ContractParam.string(param);
  return sc.ContractParam.any(null);
};

const resolveArgs = (raw: unknown[] | undefined, senderAddress: string): sc.ContractParam[] =>
  Array.isArray(raw) ? raw.map((param) => toContractParam(param, senderAddress)) : [];

const resolveNetworkMagic = (chainId: ChainId): number => {
  const magic = getNetworkMagic(chainId);
  if (typeof magic === "number") return magic;
  return String(chainId).includes("testnet") ? DEFAULT_NETWORK_MAGIC.testnet : DEFAULT_NETWORK_MAGIC.mainnet;
};

const getRpcClient = (chainId: ChainId): rpc.RPCClient => {
  const rpcUrl = getRpcUrl(chainId, "neo-n3");
  if (!rpcUrl) {
    throw new Error("RPC endpoint unavailable");
  }
  return new rpc.RPCClient(rpcUrl);
};

export type InvokeResult = {
  tx_hash: string;
  txid?: string;
};

export async function invokeNeoContract(params: {
  chainId: ChainId;
  contract: string;
  method: string;
  args?: unknown[];
}): Promise<InvokeResult> {
  const privateKey = await SecureStore.getItemAsync("neo_private_key");
  if (!privateKey) {
    throw new Error("No private key found");
  }

  const account = new wallet.Account(privateKey);
  const senderAddress = account.address;
  const signerAccount = wallet.getScriptHashFromAddress(senderAddress);

  const contractHash = String(params.contract ?? "").trim();
  const operation = String(params.method ?? "").trim();
  if (!contractHash) throw new Error("contract address required");
  if (!operation) throw new Error("method required");

  const args = resolveArgs(params.args, senderAddress);
  const script = sc.createScript({
    scriptHash: contractHash,
    operation,
    args,
  });

  const client = getRpcClient(params.chainId);
  const currentHeight = await client.getBlockCount();

  const transaction = new tx.Transaction({
    signers: [
      {
        account: signerAccount,
        scopes: tx.WitnessScope.CalledByEntry,
      },
    ],
    validUntilBlock: currentHeight + VALID_UNTIL_BLOCK_OFFSET,
    script,
  });

  const invokeResult = await client.invokeScript(u.HexString.fromHex(script), [
    {
      account: signerAccount,
      scopes: tx.WitnessScope.CalledByEntry.toString(),
    },
  ]);

  if (invokeResult?.state === "FAULT") {
    throw new Error(invokeResult?.exception || "script execution failed");
  }

  const systemFee = parseFixed8(String(invokeResult?.gasconsumed || "0"));
  transaction.systemFee = u.BigInteger.fromNumber(systemFee);

  const verificationScript = wallet.getVerificationScriptFromPublicKey(account.publicKey);
  const placeholder = "00".repeat(64);
  const sb = new sc.ScriptBuilder();
  sb.emitPush(placeholder);
  const placeholderWitness = new tx.Witness({
    invocationScript: sb.str,
    verificationScript,
  });

  transaction.witnesses = [placeholderWitness];
  const networkFeeResult = await client.calculateNetworkFee(transaction);
  const networkFeeRaw =
    typeof networkFeeResult === "string"
      ? networkFeeResult
      : (networkFeeResult as { networkfee?: string })?.networkfee || "0";
  const networkFee = parseFixed8(String(networkFeeRaw || "0"));
  transaction.networkFee = u.BigInteger.fromNumber(networkFee);
  transaction.witnesses = [];

  transaction.sign(account, resolveNetworkMagic(params.chainId));

  const result = await client.sendRawTransaction(transaction);
  const txid = typeof result === "string" ? result : transaction.hash();

  return { tx_hash: txid, txid };
}

export async function invokeIntentInvocation(intent: InvocationIntent): Promise<InvokeResult> {
  if (intent.chain_type !== "neo-n3") {
    throw new Error("EVM invocation is not supported in the mobile wallet");
  }

  const args = Array.isArray(intent.params)
    ? intent.params
    : Array.isArray(intent.args)
      ? intent.args
      : [];

  return invokeNeoContract({
    chainId: intent.chain_id,
    contract: intent.contract_address,
    method: intent.method,
    args,
  });
}

const extractReceiptIdFromLog = (log: Record<string, unknown>): string | null => {
  const execution = (log?.executions as Array<Record<string, unknown>>)?.[0];
  const notifications = (execution?.notifications || []) as Array<Record<string, unknown>>;
  for (const notification of notifications) {
    const eventName = notification?.eventname || notification?.eventName || notification?.name;
    if (eventName !== "PaymentReceived") continue;
    const state = notification?.state as Record<string, unknown> | unknown[];
    const values = Array.isArray(state) 
      ? state 
      : (state && typeof state === "object" && "value" in state && Array.isArray(state.value))
        ? state.value as unknown[]
        : [];
    const first = values[0] as Record<string, unknown> | undefined;
    if (first?.type === "Integer" && first?.value !== undefined) {
      return String(first.value);
    }
    if (first?.value !== undefined) {
      return String(first.value);
    }
  }
  return null;
};

export async function waitForReceipt(
  txid: string,
  chainId: ChainId,
  attempts = 10,
  delayMs = 1200,
): Promise<string | null> {
  if (!txid) return null;
  const client = getRpcClient(chainId);
  for (let i = 0; i < attempts; i += 1) {
    try {
      const log = await client.getApplicationLog(txid);
      const receiptId = extractReceiptIdFromLog(log as unknown as Record<string, unknown>);
      if (receiptId) return receiptId;
    } catch (err) {
      if (i === attempts - 1) throw err;
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  return null;
}
