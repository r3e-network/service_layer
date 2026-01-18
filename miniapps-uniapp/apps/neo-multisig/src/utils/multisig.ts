import { wallet, tx, sc, u, rpc } from "@cityofzion/neon-core";

const ASSET_CONFIG = {
  GAS: {
    hash: "0xd2a4cff31913016155e38e474a2c06d08be2740e",
    decimals: 8,
  },
  NEO: {
    hash: "0xef4073a0f2b305a38ec4050e4d3d28bc40ea63f5",
    decimals: 0,
  },
} as const;

const NETWORK_MAGIC: Record<string, number> = {
  "neo-n3-mainnet": 860833102,
  "neo-n3-testnet": 894710606,
};

const RPC_URLS: Record<string, string[]> = {
  "neo-n3-mainnet": ["https://mainnet1.neo.coz.io:443", "https://mainnet2.neo.coz.io:443"],
  "neo-n3-testnet": ["https://testnet1.neo.coz.io:443", "https://testnet2.neo.coz.io:443"],
};

const VALID_UNTIL_BLOCK_OFFSET = 5760;

const stripHexPrefix = (value: string) => (value.startsWith("0x") ? value.slice(2) : value);

export const normalizePublicKey = (key: string) => {
  const cleaned = stripHexPrefix(key.trim()).toLowerCase();
  if (!wallet.isPublicKey(cleaned)) {
    throw new Error("invalid public key");
  }
  if (!wallet.isPublicKey(cleaned, true)) {
    return wallet.getPublicKeyEncoded(cleaned);
  }
  return cleaned;
};

export const normalizePublicKeys = (keys: string[]) => {
  const normalized = keys.map(normalizePublicKey);
  const unique = new Set(normalized);
  if (unique.size !== normalized.length) {
    throw new Error("duplicate public keys");
  }
  return [...unique].sort();
};

export const isValidAddress = (address: string) => wallet.isAddress(address.trim());

const parseFixedAmount = (amount: string, decimals: number) => {
  const cleaned = amount.trim();
  if (!/^\d+(\.\d+)?$/.test(cleaned)) {
    throw new Error("invalid amount");
  }
  const [whole, fraction = ""] = cleaned.split(".");
  if (decimals === 0 && fraction.length > 0) {
    throw new Error("amount must be integer");
  }
  if (fraction.length > decimals) {
    throw new Error("too many decimals");
  }
  const normalized = `${whole}${fraction.padEnd(decimals, "0")}`;
  return BigInt(normalized || "0").toString();
};

export const validateAmount = (amount: string, assetSymbol: keyof typeof ASSET_CONFIG) => {
  try {
    const decimals = ASSET_CONFIG[assetSymbol].decimals;
    const value = parseFixedAmount(amount, decimals);
    return BigInt(value) > 0n;
  } catch {
    return false;
  }
};

const parseFixed8 = (value: string) => parseFixedAmount(value, 8);

export const formatFixed8 = (value: string, decimals = 8) => {
  const raw = BigInt(value);
  const base = 10n ** BigInt(decimals);
  const whole = raw / base;
  const fraction = raw % base;
  if (decimals === 0) return whole.toString();
  const fractionStr = fraction.toString().padStart(decimals, "0").replace(/0+$/, "");
  return fractionStr ? `${whole}.${fractionStr}` : whole.toString();
};

export const getNetworkMagic = (chainId: string) => {
  return NETWORK_MAGIC[chainId] ?? NETWORK_MAGIC["neo-n3-mainnet"];
};

export const getRpcClient = (chainId: string) => {
  const urls = RPC_URLS[chainId] || RPC_URLS["neo-n3-mainnet"];
  return new rpc.RPCClient(urls[0]);
};

export const getPublicKeyAddress = (publicKey: string) => {
  const scriptHash = wallet.getScriptHashFromPublicKey(publicKey);
  return wallet.getAddressFromScriptHash(scriptHash);
};

export const verifySignature = (message: string, signature: string, publicKey: string) => {
  try {
    return wallet.verify(message, signature, publicKey);
  } catch {
    return false;
  }
};

export const createMultisigAccount = (threshold: number, publicKeys: string[]) => {
  if (threshold <= 0 || threshold > publicKeys.length) {
    throw new Error("invalid threshold");
  }
  const sortedKeys = [...publicKeys].sort();
  const verificationScript = wallet.constructMultiSigVerificationScript(threshold, sortedKeys);
  const scriptHash = wallet.getScriptHashFromVerificationScript(verificationScript);
  const address = wallet.getAddressFromScriptHash(scriptHash);
  return {
    address,
    scriptHash,
    verificationScript,
    publicKeys: sortedKeys,
  };
};

export const buildVerificationScript = (threshold: number, publicKeys: string[]) => {
  const sortedKeys = [...publicKeys].sort();
  const script = wallet.constructMultiSigVerificationScript(threshold, sortedKeys);
  const orderedKeys = wallet.getPublicKeysFromVerificationScript(script);
  return { script, publicKeys: orderedKeys };
};

const buildPlaceholderInvocation = (threshold: number) => {
  const sb = new sc.ScriptBuilder();
  const placeholder = "00".repeat(64);
  for (let i = 0; i < threshold; i += 1) {
    sb.emitPush(placeholder);
  }
  return sb.str;
};

export const buildWitness = (verificationScript: string, signatures: string[]) => {
  const sb = new sc.ScriptBuilder();
  signatures.forEach((sig) => sb.emitPush(sig));
  return new tx.Witness({
    invocationScript: sb.str,
    verificationScript,
  });
};

export const buildTransferTransaction = async (params: {
  chainId: "neo-n3-mainnet" | "neo-n3-testnet";
  fromAddress: string;
  toAddress: string;
  amount: string;
  assetSymbol: keyof typeof ASSET_CONFIG;
  threshold: number;
  publicKeys: string[];
}) => {
  const asset = ASSET_CONFIG[params.assetSymbol];
  if (!asset) throw new Error("unsupported asset");

  const transferAmount = parseFixedAmount(params.amount, asset.decimals);
  if (BigInt(transferAmount) <= 0n) {
    throw new Error("invalid amount");
  }

  const script = sc.createScript({
    scriptHash: asset.hash,
    operation: "transfer",
    args: [
      sc.ContractParam.hash160(params.fromAddress),
      sc.ContractParam.hash160(params.toAddress),
      sc.ContractParam.integer(transferAmount),
      sc.ContractParam.any(null),
    ],
  });

  const client = getRpcClient(params.chainId);
  const currentHeight = await client.getBlockCount();

  const transaction = new tx.Transaction({
    signers: [
      {
        account: wallet.getScriptHashFromAddress(params.fromAddress),
        scopes: tx.WitnessScope.CalledByEntry,
      },
    ],
    validUntilBlock: currentHeight + VALID_UNTIL_BLOCK_OFFSET,
    script,
  });

  const invokeResult = await client.invokeScript(u.HexString.fromHex(script), [
    {
      account: wallet.getScriptHashFromAddress(params.fromAddress),
      scopes: tx.WitnessScope.CalledByEntry.toString(),
    },
  ]);

  if (invokeResult?.state === "FAULT") {
    throw new Error(invokeResult?.exception || "script execution failed");
  }

  const systemFee = parseFixed8(String(invokeResult?.gasconsumed || "0"));
  transaction.systemFee = u.BigInteger.fromNumber(systemFee);

  const verification = buildVerificationScript(params.threshold, params.publicKeys);
  const placeholderWitness = new tx.Witness({
    invocationScript: buildPlaceholderInvocation(params.threshold),
    verificationScript: verification.script,
  });

  transaction.witnesses = [placeholderWitness];
  const networkFeeResult = await client.calculateNetworkFee(transaction);
  const networkFee = parseFixed8(String(networkFeeResult?.networkfee || "0"));
  transaction.networkFee = u.BigInteger.fromNumber(networkFee);
  transaction.witnesses = [];

  return {
    tx: transaction,
    systemFee,
    networkFee,
    validUntilBlock: transaction.validUntilBlock,
  };
};
