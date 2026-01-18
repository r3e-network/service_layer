import { defineStore } from "pinia";
import { ref } from "vue";
import { ethers } from "ethers";
import { buildPoseidon } from "circomlibjs";
import { groth16 } from "snarkjs";
import EthereumProvider from "@walletconnect/ethereum-provider";

export type WalletProviderType = "injected" | "walletconnect" | null;

export interface TokenInfo {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  icon: string;
  isNative: boolean;
  isCustom?: boolean;
  chainId: number;
}

export interface Note {
  secret: string;
  nullifier: string;
  amount: string;
  amountWei: string;
  token: TokenInfo;
  unlockTime: number; // seconds
  commitment: string;
  isSpent: boolean;
  txHash?: string;
  depositTxHash?: string;
}

export interface PiggyBank {
  id: string;
  name: string;
  purpose: string;
  targetAmount: string;
  targetToken: TokenInfo;
  unlockTime: number; // seconds
  notes: Note[];
  createdAt: number;
  themeColor: string;
  chainId: number;
}

type EvmChainConfig = {
  id: number;
  name: string;
  shortName: string;
  nativeSymbol: string;
  nativeDecimals: number;
  alchemyNetwork: string | null;
  explorer: string;
  isTestnet: boolean;
};

const EVM_CHAINS: EvmChainConfig[] = [
  {
    id: 1,
    name: "Ethereum Mainnet",
    shortName: "Ethereum",
    nativeSymbol: "ETH",
    nativeDecimals: 18,
    alchemyNetwork: "eth-mainnet",
    explorer: "https://etherscan.io",
    isTestnet: false,
  },
  {
    id: 11155111,
    name: "Ethereum Sepolia",
    shortName: "Sepolia",
    nativeSymbol: "ETH",
    nativeDecimals: 18,
    alchemyNetwork: "eth-sepolia",
    explorer: "https://sepolia.etherscan.io",
    isTestnet: true,
  },
  {
    id: 137,
    name: "Polygon",
    shortName: "Polygon",
    nativeSymbol: "MATIC",
    nativeDecimals: 18,
    alchemyNetwork: "polygon-mainnet",
    explorer: "https://polygonscan.com",
    isTestnet: false,
  },
  {
    id: 80002,
    name: "Polygon Amoy",
    shortName: "Amoy",
    nativeSymbol: "MATIC",
    nativeDecimals: 18,
    alchemyNetwork: "polygon-amoy",
    explorer: "https://amoy.polygonscan.com",
    isTestnet: true,
  },
  {
    id: 42161,
    name: "Arbitrum One",
    shortName: "Arbitrum",
    nativeSymbol: "ETH",
    nativeDecimals: 18,
    alchemyNetwork: "arb-mainnet",
    explorer: "https://arbiscan.io",
    isTestnet: false,
  },
  {
    id: 421614,
    name: "Arbitrum Sepolia",
    shortName: "Arbitrum Sepolia",
    nativeSymbol: "ETH",
    nativeDecimals: 18,
    alchemyNetwork: "arb-sepolia",
    explorer: "https://sepolia.arbiscan.io",
    isTestnet: true,
  },
  {
    id: 10,
    name: "Optimism",
    shortName: "Optimism",
    nativeSymbol: "ETH",
    nativeDecimals: 18,
    alchemyNetwork: "opt-mainnet",
    explorer: "https://optimistic.etherscan.io",
    isTestnet: false,
  },
  {
    id: 11155420,
    name: "Optimism Sepolia",
    shortName: "Optimism Sepolia",
    nativeSymbol: "ETH",
    nativeDecimals: 18,
    alchemyNetwork: "opt-sepolia",
    explorer: "https://sepolia-optimism.etherscan.io",
    isTestnet: true,
  },
  {
    id: 8453,
    name: "Base",
    shortName: "Base",
    nativeSymbol: "ETH",
    nativeDecimals: 18,
    alchemyNetwork: "base-mainnet",
    explorer: "https://basescan.org",
    isTestnet: false,
  },
  {
    id: 84532,
    name: "Base Sepolia",
    shortName: "Base Sepolia",
    nativeSymbol: "ETH",
    nativeDecimals: 18,
    alchemyNetwork: "base-sepolia",
    explorer: "https://sepolia.basescan.org",
    isTestnet: true,
  },
];

const CHAIN_LOOKUP = new Map(EVM_CHAINS.map((chain) => [chain.id, chain]));

const STORAGE_KEYS = {
  banks: "piggy_banks_v4",
  legacyBanks: "piggy_banks_v3",
  settings: "piggy_settings_v1",
  customTokens: "piggy_custom_tokens_v1",
};

const env =
  typeof import.meta !== "undefined" && (import.meta as any).env ? (import.meta as any).env : {};
const DEFAULT_ALCHEMY_API_KEY = String(env.VITE_ALCHEMY_API_KEY || "");
const DEFAULT_WC_PROJECT_ID = String(env.VITE_WALLETCONNECT_PROJECT_ID || "");
const DEFAULT_CHAIN_ID = 1;

const ZK_ASSETS = {
  wasmUrl: "/static/zk/withdraw.wasm",
  zkeyUrl: "/static/zk/withdraw.zkey",
};

// Contract ABI for PiggyBank
const PIGGY_ABI = [
  "function depositETH(uint256 commitment) payable",
  "function depositToken(uint256 commitment, address token, uint256 amount)",
  "function withdraw(uint256[2] a, uint256[2][2] b, uint256[2] c, uint256 nullifierHash, address recipient, address token, uint256 amount, uint256 unlockTime, uint256 commitment)",
];

const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 value) returns (bool)",
];

const NATIVE_TOKENS: Record<number, TokenInfo> = {
  1: {
    symbol: "ETH",
    name: "Ethereum",
    address: ethers.constants.AddressZero,
    decimals: 18,
    icon: "⟠",
    isNative: true,
    chainId: 1,
  },
  11155111: {
    symbol: "ETH",
    name: "Sepolia ETH",
    address: ethers.constants.AddressZero,
    decimals: 18,
    icon: "⟠",
    isNative: true,
    chainId: 11155111,
  },
  137: {
    symbol: "MATIC",
    name: "Polygon",
    address: ethers.constants.AddressZero,
    decimals: 18,
    icon: "◆",
    isNative: true,
    chainId: 137,
  },
  80002: {
    symbol: "MATIC",
    name: "Amoy MATIC",
    address: ethers.constants.AddressZero,
    decimals: 18,
    icon: "◆",
    isNative: true,
    chainId: 80002,
  },
  42161: {
    symbol: "ETH",
    name: "Arbitrum ETH",
    address: ethers.constants.AddressZero,
    decimals: 18,
    icon: "◇",
    isNative: true,
    chainId: 42161,
  },
  421614: {
    symbol: "ETH",
    name: "Arbitrum Sepolia ETH",
    address: ethers.constants.AddressZero,
    decimals: 18,
    icon: "◇",
    isNative: true,
    chainId: 421614,
  },
  10: {
    symbol: "ETH",
    name: "Optimism ETH",
    address: ethers.constants.AddressZero,
    decimals: 18,
    icon: "◎",
    isNative: true,
    chainId: 10,
  },
  11155420: {
    symbol: "ETH",
    name: "Optimism Sepolia ETH",
    address: ethers.constants.AddressZero,
    decimals: 18,
    icon: "◎",
    isNative: true,
    chainId: 11155420,
  },
  8453: {
    symbol: "ETH",
    name: "Base ETH",
    address: ethers.constants.AddressZero,
    decimals: 18,
    icon: "⬡",
    isNative: true,
    chainId: 8453,
  },
  84532: {
    symbol: "ETH",
    name: "Base Sepolia ETH",
    address: ethers.constants.AddressZero,
    decimals: 18,
    icon: "⬡",
    isNative: true,
    chainId: 84532,
  },
};

const MAINNET_TOKENS: TokenInfo[] = [
  NATIVE_TOKENS[1],
  {
    symbol: "USDT",
    name: "Tether USD",
    address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    decimals: 6,
    icon: "₮",
    isNative: false,
    chainId: 1,
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    decimals: 6,
    icon: "$",
    isNative: false,
    chainId: 1,
  },
  {
    symbol: "WBTC",
    name: "Wrapped Bitcoin",
    address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
    decimals: 8,
    icon: "₿",
    isNative: false,
    chainId: 1,
  },
  {
    symbol: "DAI",
    name: "Dai Stablecoin",
    address: "0x6B175474E89094C44Da98b954EesddFD691dA1D4B",
    decimals: 18,
    icon: "◈",
    isNative: false,
    chainId: 1,
  },
  {
    symbol: "WETH",
    name: "Wrapped Ether",
    address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    decimals: 18,
    icon: "Ξ",
    isNative: false,
    chainId: 1,
  },
];

const POPULAR_TOKENS_BY_CHAIN: Record<number, TokenInfo[]> = {
  1: MAINNET_TOKENS,
  11155111: [NATIVE_TOKENS[11155111]],
  137: [NATIVE_TOKENS[137]],
  80002: [NATIVE_TOKENS[80002]],
  42161: [NATIVE_TOKENS[42161]],
  421614: [NATIVE_TOKENS[421614]],
  10: [NATIVE_TOKENS[10]],
  11155420: [NATIVE_TOKENS[11155420]],
  8453: [NATIVE_TOKENS[8453]],
  84532: [NATIVE_TOKENS[84532]],
};

let poseidonPromise: Promise<any> | null = null;
let wcProvider: any | null = null;
let walletListenersAttached = false;

function getChainConfig(chainId: number): EvmChainConfig | null {
  return CHAIN_LOOKUP.get(chainId) || null;
}

function getAlchemyRpcUrl(chainId: number, apiKey: string): string | null {
  const chain = getChainConfig(chainId);
  if (!chain?.alchemyNetwork || !apiKey) return null;
  return `https://${chain.alchemyNetwork}.g.alchemy.com/v2/${apiKey}`;
}

function parseHexToBigInt(value: string): bigint {
  const cleaned = value.startsWith("0x") ? value : `0x${value}`;
  return BigInt(cleaned);
}

function toBigInt(value: string | number | bigint): bigint {
  if (typeof value === "bigint") return value;
  if (typeof value === "number") return BigInt(Math.floor(value));
  if (value.startsWith("0x")) return parseHexToBigInt(value);
  return BigInt(value);
}

function isValidAddress(address: string): boolean {
  try {
    return ethers.utils.isAddress(address);
  } catch {
    return false;
  }
}

function normalizeUnlockTime(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value > 1e12) return Math.floor(value / 1000);
  return Math.floor(value);
}

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return ethers.utils.hexlify(ethers.utils.randomBytes(16));
}

async function getPoseidon() {
  if (!poseidonPromise) {
    poseidonPromise = buildPoseidon();
  }
  return poseidonPromise;
}

async function poseidonHash(inputs: Array<bigint>): Promise<string> {
  const poseidon = await getPoseidon();
  const hash = poseidon(inputs);
  return poseidon.F.toString(hash);
}

function safeParseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function normalizeToken(raw: any, chainId: number): TokenInfo {
  const fallbackNative = NATIVE_TOKENS[chainId] || NATIVE_TOKENS[DEFAULT_CHAIN_ID];
  const address = typeof raw?.address === "string" ? raw.address : fallbackNative.address;
  return {
    symbol: String(raw?.symbol || fallbackNative.symbol),
    name: String(raw?.name || fallbackNative.name),
    address,
    decimals: Number.isFinite(raw?.decimals) ? Number(raw.decimals) : fallbackNative.decimals,
    icon: String(raw?.icon || fallbackNative.icon),
    isNative: Boolean(raw?.isNative ?? address === ethers.constants.AddressZero),
    isCustom: Boolean(raw?.isCustom),
    chainId: Number.isFinite(raw?.chainId) ? Number(raw.chainId) : chainId,
  };
}

function normalizeNote(raw: any, chainId: number): Note | null {
  if (!raw || typeof raw !== "object") return null;
  const token = normalizeToken(raw.token || {}, chainId);
  const amount = String(raw.amount || "");
  const amountWei =
    typeof raw.amountWei === "string"
      ? raw.amountWei
      : (() => {
        try {
          return ethers.utils.parseUnits(amount || "0", token.decimals).toString();
        } catch {
          return "0";
        }
      })();
  const unlockTime = normalizeUnlockTime(Number(raw.unlockTime || 0));
  return {
    secret: String(raw.secret || ""),
    nullifier: String(raw.nullifier || ""),
    amount,
    amountWei,
    token,
    unlockTime,
    commitment: String(raw.commitment || ""),
    isSpent: Boolean(raw.isSpent),
    txHash: raw.txHash ? String(raw.txHash) : undefined,
    depositTxHash: raw.depositTxHash ? String(raw.depositTxHash) : undefined,
  };
}

function normalizeBank(raw: any, fallbackChainId: number): PiggyBank | null {
  if (!raw || typeof raw !== "object") return null;
  const chainId = Number.isFinite(raw.chainId) ? Number(raw.chainId) : fallbackChainId;
  const unlockTime = normalizeUnlockTime(Number(raw.unlockTime || 0));
  const notes = Array.isArray(raw.notes)
    ? raw.notes.map((note: any) => normalizeNote(note, chainId)).filter(Boolean) as Note[]
    : [];
  return {
    id: String(raw.id || createId()),
    name: String(raw.name || "Piggy Bank"),
    purpose: String(raw.purpose || ""),
    targetAmount: String(raw.targetAmount || "0"),
    targetToken: normalizeToken(raw.targetToken || {}, chainId),
    unlockTime,
    notes,
    createdAt: Number.isFinite(raw.createdAt) ? Number(raw.createdAt) : Date.now(),
    themeColor: String(raw.themeColor || "#00ff9d"),
    chainId,
  };
}

function parseSolidityCallData(calldata: string) {
  const args = JSON.parse(`[${calldata}]`);
  const [a, b, c] = args;
  return { a, b, c };
}

function getInjectedProvider(): any | null {
  if (typeof window === "undefined") return null;
  const provider = (window as any).ethereum;
  if (provider && typeof provider.request === "function") return provider;
  return null;
}

function attachWalletListeners(provider: any, onState: (provider: any) => void) {
  if (walletListenersAttached || !provider?.on) return;
  walletListenersAttached = true;
  provider.on("accountsChanged", () => onState(provider));
  provider.on("chainChanged", () => onState(provider));
  provider.on("disconnect", () => {
    walletListenersAttached = false;
  });
}

export const usePiggyStore = defineStore("piggy", () => {
  const piggyBanks = ref<PiggyBank[]>([]);
  const currentChainId = ref<number>(DEFAULT_CHAIN_ID);
  const alchemyApiKey = ref<string>(DEFAULT_ALCHEMY_API_KEY);
  const walletConnectProjectId = ref<string>(DEFAULT_WC_PROJECT_ID);
  const contractAddresses = ref<Record<number, string>>({});
  const isConnected = ref<boolean>(false);
  const userAddress = ref<string>("");
  const walletProvider = ref<WalletProviderType>(null);
  const customTokens = ref<TokenInfo[]>([]);

  const load = () => {
    const settingsRaw = uni.getStorageSync(STORAGE_KEYS.settings);
    if (settingsRaw) {
      const settings = safeParseJson<any>(settingsRaw, {});
      if (Number.isFinite(settings.chainId)) currentChainId.value = Number(settings.chainId);
      if (typeof settings.alchemyApiKey === "string") alchemyApiKey.value = settings.alchemyApiKey;
      if (typeof settings.walletConnectProjectId === "string") {
        walletConnectProjectId.value = settings.walletConnectProjectId;
      }
      if (settings.contractAddresses && typeof settings.contractAddresses === "object") {
        contractAddresses.value = { ...settings.contractAddresses };
      }
    }

    const customRaw = uni.getStorageSync(STORAGE_KEYS.customTokens);
    if (customRaw) {
      const list = safeParseJson<any[]>(customRaw, []);
      customTokens.value = list
        .map((token) => normalizeToken(token, token?.chainId || currentChainId.value))
        .filter((token) => isValidAddress(token.address) || token.isNative);
    }

    const data = uni.getStorageSync(STORAGE_KEYS.banks);
    if (data) {
      const banks = safeParseJson<any[]>(data, []);
      piggyBanks.value = banks
        .map((bank) => normalizeBank(bank, currentChainId.value))
        .filter(Boolean) as PiggyBank[];
      return;
    }

    const legacy = uni.getStorageSync(STORAGE_KEYS.legacyBanks);
    if (legacy) {
      const banks = safeParseJson<any[]>(legacy, []);
      piggyBanks.value = banks
        .map((bank) => normalizeBank(bank, currentChainId.value))
        .filter(Boolean) as PiggyBank[];
      save();
    }
  };

  const save = () => {
    uni.setStorageSync(STORAGE_KEYS.banks, JSON.stringify(piggyBanks.value));
  };

  const saveSettings = () => {
    uni.setStorageSync(
      STORAGE_KEYS.settings,
      JSON.stringify({
        chainId: currentChainId.value,
        alchemyApiKey: alchemyApiKey.value,
        walletConnectProjectId: walletConnectProjectId.value,
        contractAddresses: contractAddresses.value,
      }),
    );
  };

  const saveCustomTokens = () => {
    uni.setStorageSync(STORAGE_KEYS.customTokens, JSON.stringify(customTokens.value));
  };

  load();

  const getReadProvider = () => {
    const rpcUrl = getAlchemyRpcUrl(currentChainId.value, alchemyApiKey.value);
    if (!rpcUrl) {
      throw new Error("Alchemy API key not configured for this network");
    }
    return new ethers.providers.JsonRpcProvider(rpcUrl);
  };

  const getWalletProvider = async (): Promise<any> => {
    const injected = getInjectedProvider();
    if (injected) {
      walletProvider.value = "injected";
      return injected;
    }

    if (!walletConnectProjectId.value) {
      throw new Error("WalletConnect Project ID not configured");
    }

    if (!wcProvider) {
      const rpcUrl = getAlchemyRpcUrl(currentChainId.value, alchemyApiKey.value);
      wcProvider = await EthereumProvider.init({
        projectId: walletConnectProjectId.value,
        chains: [currentChainId.value],
        optionalChains: EVM_CHAINS.map((chain) => chain.id),
        showQrModal: true,
        rpcMap: rpcUrl ? { [currentChainId.value]: rpcUrl } : undefined,
      });
    }

    if (!wcProvider.session) {
      await wcProvider.connect();
    }
    walletProvider.value = "walletconnect";
    return wcProvider;
  };

  const syncWalletState = async (provider: any) => {
    const accounts = await provider.request({ method: "eth_accounts" });
    const address = accounts?.[0] ? String(accounts[0]) : "";
    userAddress.value = address;
    isConnected.value = Boolean(address);
    const chainHex = await provider.request({ method: "eth_chainId" });
    if (typeof chainHex === "string") {
      const chainId = Number.parseInt(chainHex, 16);
      if (Number.isFinite(chainId)) {
        currentChainId.value = chainId;
        saveSettings();
      }
    }
  };

  const connectWallet = async () => {
    const provider = await getWalletProvider();
    attachWalletListeners(provider, syncWalletState);
    const accounts = await provider.request({ method: "eth_requestAccounts" });
    if (!accounts || !accounts[0]) {
      throw new Error("No wallet accounts returned");
    }
    await syncWalletState(provider);
    return userAddress.value;
  };

  const disconnectWallet = async () => {
    if (walletProvider.value === "walletconnect" && wcProvider) {
      await wcProvider.disconnect();
    }
    isConnected.value = false;
    userAddress.value = "";
    walletProvider.value = null;
  };

  const switchChain = async (chainId: number) => {
    currentChainId.value = chainId;
    saveSettings();
    const provider = getInjectedProvider() || wcProvider;
    if (!provider) return;

    const chainHex = `0x${chainId.toString(16)}`;
    try {
      await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: chainHex }] });
    } catch (err: any) {
      if (err?.code === 4902) {
        const chain = getChainConfig(chainId);
        if (!chain) throw err;
        const rpcUrl = getAlchemyRpcUrl(chainId, alchemyApiKey.value);
        if (!rpcUrl) throw new Error("Alchemy API key required to add this chain");
        await provider.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: chainHex,
              chainName: chain.name,
              nativeCurrency: {
                name: chain.nativeSymbol,
                symbol: chain.nativeSymbol,
                decimals: chain.nativeDecimals,
              },
              rpcUrls: [rpcUrl],
              blockExplorerUrls: [chain.explorer],
            },
          ],
        });
      } else {
        throw err;
      }
    }
  };

  const setAlchemyApiKey = (key: string) => {
    alchemyApiKey.value = key.trim();
    saveSettings();
  };

  const setWalletConnectProjectId = (key: string) => {
    walletConnectProjectId.value = key.trim();
    saveSettings();
  };

  const setContractAddress = (chainId: number, address: string) => {
    const trimmed = address.trim();
    if (trimmed && !isValidAddress(trimmed)) {
      throw new Error("Invalid contract address");
    }
    contractAddresses.value = { ...contractAddresses.value, [chainId]: trimmed };
    saveSettings();
  };

  const getContractAddress = (chainId: number) => {
    return contractAddresses.value[chainId] || "";
  };

  const getDefaultToken = () => {
    const native = NATIVE_TOKENS[currentChainId.value];
    return native || NATIVE_TOKENS[DEFAULT_CHAIN_ID];
  };

  const getAllTokens = (): TokenInfo[] => {
    const popular = POPULAR_TOKENS_BY_CHAIN[currentChainId.value] || [getDefaultToken()];
    const customs = customTokens.value.filter((token) => token.chainId === currentChainId.value);
    return [...popular, ...customs];
  };

  const lookupToken = async (address: string): Promise<TokenInfo | null> => {
    const cleaned = address.trim();
    if (!cleaned) return null;

    if (cleaned === "0x0000000000000000000000000000000000000000" || cleaned.toLowerCase() === "eth") {
      return getDefaultToken();
    }

    for (const token of getAllTokens()) {
      if (token.address.toLowerCase() === cleaned.toLowerCase()) {
        return token;
      }
    }

    if (!isValidAddress(cleaned)) return null;

    try {
      const provider = getReadProvider();
      const contract = new ethers.Contract(cleaned, ERC20_ABI, provider);
      const [name, symbol, decimals] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.decimals(),
      ]);

      const tokenInfo: TokenInfo = {
        symbol,
        name,
        address: ethers.utils.getAddress(cleaned),
        decimals: Number(decimals),
        icon: "🪙",
        isNative: false,
        isCustom: true,
        chainId: currentChainId.value,
      };

      customTokens.value.push(tokenInfo);
      saveCustomTokens();
      return tokenInfo;
    } catch (e) {
      console.error("Failed to lookup token:", e);
      return null;
    }
  };

  const createPiggyBank = (
    name: string,
    purpose: string,
    targetAmount: string,
    targetToken: TokenInfo,
    unlockTimeSeconds: number,
  ) => {
    const normalizedUnlock = normalizeUnlockTime(unlockTimeSeconds);
    if (!normalizedUnlock || normalizedUnlock <= Math.floor(Date.now() / 1000)) {
      throw new Error("Unlock time must be in the future");
    }
    const newBank: PiggyBank = {
      id: createId(),
      name,
      purpose,
      targetAmount,
      targetToken,
      unlockTime: normalizedUnlock,
      notes: [],
      createdAt: Date.now(),
      themeColor: ["#00ff9d", "#00e5ff", "#ff00ff"][Math.floor(Math.random() * 3)],
      chainId: currentChainId.value,
    };
    piggyBanks.value.push(newBank);
    save();
    return newBank.id;
  };

  const generateCommitment = async (amount: string, token: TokenInfo, unlockTime: number, recipient: string) => {
    const secretBytes = ethers.utils.randomBytes(31);
    const nullifierBytes = ethers.utils.randomBytes(31);
    const secret = ethers.utils.hexlify(secretBytes);
    const nullifier = ethers.utils.hexlify(nullifierBytes);
    const amountWei = ethers.utils.parseUnits(amount, token.decimals);
    const tokenAddress = token.isNative ? ethers.constants.AddressZero : token.address;

    const commitment = await poseidonHash([
      toBigInt(secret),
      toBigInt(nullifier),
      toBigInt(amountWei.toString()),
      toBigInt(unlockTime),
      toBigInt(tokenAddress),
      toBigInt(recipient),
    ]);

    return { secret, nullifier, commitment, amountWei: amountWei.toString() };
  };

  const requireContract = (chainId: number) => {
    const address = getContractAddress(chainId);
    if (!address) {
      throw new Error("Piggy Bank contract address not configured for this network");
    }
    return address;
  };

  const getSigner = async () => {
    const provider = await getWalletProvider();
    const web3 = new ethers.providers.Web3Provider(provider);
    return web3.getSigner();
  };

  const prepareDeposit = async (bankId: string, amount: string, token: TokenInfo, recipient: string) => {
    const bank = piggyBanks.value.find((b) => b.id === bankId);
    if (!bank) throw new Error("Bank not found");
    if (!amount || Number.parseFloat(amount) <= 0) throw new Error("Invalid deposit amount");
    if (token.chainId !== bank.chainId) {
      throw new Error("Token network does not match piggy bank network");
    }

    const { secret, nullifier, commitment, amountWei } = await generateCommitment(
      amount,
      token,
      bank.unlockTime,
      recipient,
    );

    const note: Note = {
      secret,
      nullifier,
      amount,
      amountWei,
      token,
      unlockTime: bank.unlockTime,
      commitment,
      isSpent: false,
    };

    bank.notes.push(note);
    save();
    return { note, bank };
  };

  const sendDeposit = async (bankId: string, amount: string, token: TokenInfo) => {
    const bank = piggyBanks.value.find((b) => b.id === bankId);
    if (!bank) throw new Error("Bank not found");
    if (currentChainId.value !== bank.chainId) {
      await switchChain(bank.chainId);
    }
    const signer = await getSigner();
    const recipient = await signer.getAddress();
    userAddress.value = recipient;
    isConnected.value = true;

    const { note } = await prepareDeposit(bankId, amount, token, recipient);
    const contractAddress = requireContract(bank.chainId);
    const contract = new ethers.Contract(contractAddress, PIGGY_ABI, signer);
    let txHash = "";
    if (token.isNative) {
      const tx = await contract.depositETH(note.commitment, {
        value: ethers.BigNumber.from(note.amountWei),
      });
      const receipt = await tx.wait();
      txHash = receipt.transactionHash;
    } else {
      const tokenContract = new ethers.Contract(token.address, ERC20_ABI, signer);
      const allowance = await tokenContract.allowance(recipient, contractAddress);
      const amountWei = ethers.BigNumber.from(note.amountWei);
      if (allowance.lt(amountWei)) {
        const approveTx = await tokenContract.approve(contractAddress, amountWei);
        await approveTx.wait();
      }
      const tx = await contract.depositToken(note.commitment, token.address, amountWei);
      const receipt = await tx.wait();
      txHash = receipt.transactionHash;
    }

    confirmDeposit(bankId, note.nullifier, txHash);
    return { txHash, note };
  };

  const confirmDeposit = (bankId: string, nullifier: string, txHash: string) => {
    const bank = piggyBanks.value.find((b) => b.id === bankId);
    if (bank) {
      const note = bank.notes.find((n) => n.nullifier === nullifier);
      if (note) {
        note.depositTxHash = txHash;
        save();
      }
    }
  };

  const generateWithdrawProof = async (note: Note, recipient: string) => {
    const tokenAddress = note.token.isNative ? ethers.constants.AddressZero : note.token.address;
    const commitment = note.commitment;
    const nullifierHash = await poseidonHash([toBigInt(note.nullifier), toBigInt(note.secret)]);

    const inputs = {
      secret: toBigInt(note.secret).toString(),
      nullifier: toBigInt(note.nullifier).toString(),
      amount: toBigInt(note.amountWei).toString(),
      unlockTime: toBigInt(note.unlockTime).toString(),
      token: toBigInt(tokenAddress).toString(),
      recipient: toBigInt(recipient).toString(),
      commitment: toBigInt(commitment).toString(),
      nullifierHash: toBigInt(nullifierHash).toString(),
    };

    try {
      const { proof, publicSignals } = await groth16.fullProve(inputs, ZK_ASSETS.wasmUrl, ZK_ASSETS.zkeyUrl);
      const calldata = await groth16.exportSolidityCallData(proof, publicSignals);
      const { a, b, c } = parseSolidityCallData(calldata);
      return { a, b, c, nullifierHash };
    } catch (err) {
      console.error("ZK proof generation failed:", err);
      throw new Error("ZK prover assets not available or invalid");
    }
  };

  const previewWithdrawals = (bankId: string) => {
    const bank = piggyBanks.value.find((b) => b.id === bankId);
    if (!bank) throw new Error("Bank not found");
    if (Date.now() / 1000 < bank.unlockTime) {
      throw new Error("Piggy bank is still locked!");
    }
    const unspentNotes = bank.notes.filter((n) => !n.isSpent && n.depositTxHash);
    if (unspentNotes.length === 0) {
      throw new Error("No funds to withdraw");
    }
    return unspentNotes;
  };

  const withdraw = async (bankId: string) => {
    const bank = piggyBanks.value.find((b) => b.id === bankId);
    if (!bank) throw new Error("Bank not found");
    if (currentChainId.value !== bank.chainId) {
      await switchChain(bank.chainId);
    }
    const contractAddress = requireContract(bank.chainId);
    const signer = await getSigner();
    const recipient = await signer.getAddress();
    userAddress.value = recipient;
    isConnected.value = true;

    const contract = new ethers.Contract(contractAddress, PIGGY_ABI, signer);
    const notes = previewWithdrawals(bankId);
    const txHashes: string[] = [];

    for (const note of notes) {
      const proof = await generateWithdrawProof(note, recipient);
      const tx = await contract.withdraw(
        proof.a,
        proof.b,
        proof.c,
        proof.nullifierHash,
        recipient,
        note.token.isNative ? ethers.constants.AddressZero : note.token.address,
        note.amountWei,
        note.unlockTime,
        note.commitment,
      );
      const receipt = await tx.wait();
      markSpent(bankId, note.nullifier, receipt.transactionHash);
      txHashes.push(receipt.transactionHash);
    }

    return txHashes;
  };

  const markSpent = (bankId: string, nullifier: string, txHash: string) => {
    const bank = piggyBanks.value.find((b) => b.id === bankId);
    if (bank) {
      const note = bank.notes.find((n) => n.nullifier === nullifier);
      if (note) {
        note.isSpent = true;
        note.txHash = txHash;
        save();
      }
    }
  };

  const checkGoalReached = async (bankId: string) => {
    const bank = piggyBanks.value.find((b) => b.id === bankId);
    if (!bank) return false;

    let targetAmountWei: ethers.BigNumber;
    try {
      targetAmountWei = ethers.utils.parseUnits(bank.targetAmount, bank.targetToken.decimals);
    } catch {
      return false;
    }
    const total = bank.notes
      .filter(
        (n) =>
          n.token.address.toLowerCase() === bank.targetToken.address.toLowerCase() && n.depositTxHash,
      )
      .reduce((sum, n) => sum.add(n.amountWei), ethers.BigNumber.from(0));

    return total.gte(targetAmountWei);
  };

  const getBalances = (bankId: string): Record<string, { token: TokenInfo; amount: string }> => {
    const bank = piggyBanks.value.find((b) => b.id === bankId);
    if (!bank) return {};
    if (Date.now() / 1000 < bank.unlockTime) {
      return {};
    }

    const balances: Record<string, { token: TokenInfo; amount: string; amountWei: ethers.BigNumber }> = {};
    for (const note of bank.notes.filter((n) => !n.isSpent && n.depositTxHash)) {
      const key = note.token.address.toLowerCase();
      if (!balances[key]) {
        balances[key] = { token: note.token, amount: "0", amountWei: ethers.BigNumber.from(0) };
      }
      balances[key].amountWei = balances[key].amountWei.add(note.amountWei);
    }

    return Object.fromEntries(
      Object.entries(balances).map(([key, entry]) => [
        key,
        {
          token: entry.token,
          amount: ethers.utils.formatUnits(entry.amountWei, entry.token.decimals),
        },
      ]),
    );
  };

  return {
    piggyBanks,
    currentChainId,
    alchemyApiKey,
    walletConnectProjectId,
    contractAddresses,
    isConnected,
    userAddress,
    walletProvider,
    customTokens,
    EVM_CHAINS,
    NATIVE_TOKENS,
    POPULAR_TOKENS_BY_CHAIN,
    setAlchemyApiKey,
    setWalletConnectProjectId,
    setContractAddress,
    getContractAddress,
    getDefaultToken,
    getAllTokens,
    lookupToken,
    connectWallet,
    disconnectWallet,
    switchChain,
    createPiggyBank,
    prepareDeposit,
    sendDeposit,
    confirmDeposit,
    previewWithdrawals,
    withdraw,
    markSpent,
    checkGoalReached,
    getBalances,
  };
});
