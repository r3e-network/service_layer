import { create } from "zustand";
import { loadWallet, generateWallet, importFromWIF } from "@/lib/neo/wallet";
import { getBalances, getTokenBalance } from "@/lib/neo/rpc";
import { getTokenPrices, calculateUsdValue } from "@/lib/price";
import { authenticate, setBiometricsEnabled, getBiometricsStatus } from "@/lib/biometrics";
import { loadNetwork, saveNetwork, loadChainId, saveChainId, Network } from "@/lib/network";
import { loadTokens, saveToken, removeToken, Token } from "@/lib/tokens";
import { getLocale, setLocale as saveLocale, Locale } from "@/lib/i18n";
import type { ChainId } from "@/types/miniapp";
import { resolveChainType, type ChainType } from "@/lib/chains";

export interface Asset {
  symbol: string;
  name: string;
  balance: string;
  usdValue: string;
  usdChange: number;
  icon: string;
}

interface WalletState {
  address: string | null;
  assets: Asset[];
  totalUsdValue: string;
  isLocked: boolean;
  isLoading: boolean;
  biometricsEnabled: boolean;
  biometricsAvailable: boolean;
  network: Network;
  chainId: ChainId | null;
  chainType: ChainType;
  initialize: () => Promise<void>;
  createWallet: () => Promise<void>;
  unlock: () => Promise<void>;
  lock: () => void;
  refreshBalances: () => Promise<void>;
  toggleBiometrics: () => Promise<void>;
  requireAuthForTransaction: () => Promise<boolean>;
  switchNetwork: (network: Network) => Promise<void>;
  switchChain: (chainId: ChainId) => Promise<void>;
  importWallet: (wif: string) => Promise<boolean>;
  addToken: (token: Token) => Promise<void>;
  deleteToken: (contractAddress: string) => Promise<void>;
  setAddress: (address: string) => void;
  locale: Locale;
  setLocale: (locale: Locale) => Promise<void>;
}

const DEFAULT_ASSETS: Asset[] = [
  { symbol: "NEO", name: "Neo", balance: "0", usdValue: "0.00", usdChange: 0, icon: "💎" },
  { symbol: "GAS", name: "Gas", balance: "0", usdValue: "0.00", usdChange: 0, icon: "⛽" },
];

export const useWalletStore = create<WalletState>((set, get) => ({
  address: null,
  assets: DEFAULT_ASSETS,
  totalUsdValue: "0.00",
  isLocked: true,
  isLoading: false,
  biometricsEnabled: false,
  biometricsAvailable: false,
  network: "mainnet",
  chainId: null,
  chainType: "neo-n3",
  locale: "en",

  initialize: async () => {
    set({ isLoading: true });
    const [wallet, status, network, chainId, locale] = await Promise.all([
      loadWallet(),
      getBiometricsStatus(),
      loadNetwork(),
      loadChainId(),
      getLocale(),
    ]);
    if (wallet) {
      set({ address: wallet.address, isLocked: true });
    }
    // Determine chainType from chainId or default to neo-n3
    const chainType: ChainType = chainId ? (resolveChainType(chainId) ?? "neo-n3") : "neo-n3";
    set({
      isLoading: false,
      biometricsEnabled: status.isEnabled,
      biometricsAvailable: status.isAvailable,
      network,
      chainId,
      chainType,
      locale,
    });
  },

  createWallet: async () => {
    set({ isLoading: true });
    const wallet = await generateWallet();
    set({ address: wallet.address, isLocked: false, isLoading: false });
    await get().refreshBalances();
  },

  unlock: async () => {
    const { biometricsEnabled } = get();
    if (biometricsEnabled) {
      const result = await authenticate("Unlock your wallet");
      if (!result.success) return;
    }
    const wallet = await loadWallet();
    if (wallet) {
      set({ isLocked: false, address: wallet.address });
      await get().refreshBalances();
    }
  },

  lock: () => set({ isLocked: true }),

  refreshBalances: async () => {
    const { address } = get();
    if (!address) return;
    try {
      const [balances, prices, customTokens] = await Promise.all([
        getBalances(address),
        getTokenPrices(),
        loadTokens(),
      ]);
      const neoPrice = prices.find((p) => p.symbol === "NEO");
      const gasPrice = prices.find((p) => p.symbol === "GAS");

      const neoUsd = calculateUsdValue(balances[0].amount, neoPrice?.usd || 0);
      const gasUsd = calculateUsdValue(balances[1].amount, gasPrice?.usd || 0);

      const baseAssets: Asset[] = [
        {
          symbol: "NEO",
          name: "Neo",
          balance: balances[0].amount,
          usdValue: neoUsd,
          usdChange: neoPrice?.usd_24h_change || 0,
          icon: "💎",
        },
        {
          symbol: "GAS",
          name: "Gas",
          balance: balances[1].amount,
          usdValue: gasUsd,
          usdChange: gasPrice?.usd_24h_change || 0,
          icon: "⛽",
        },
      ];

      // Fetch custom token balances
      const tokenAssets: Asset[] = await Promise.all(
        customTokens.map(async (token) => {
          const bal = await getTokenBalance(address, token.contractAddress, token.decimals);
          return {
            symbol: token.symbol,
            name: token.name,
            balance: bal.amount,
            usdValue: "0.00",
            usdChange: 0,
            icon: "🪙",
          };
        })
      );

      const total = (parseFloat(neoUsd) + parseFloat(gasUsd)).toFixed(2);
      set({
        assets: [...baseAssets, ...tokenAssets],
        totalUsdValue: total,
      });
    } catch (e) {
      console.error("Failed to fetch balances:", e);
    }
  },

  toggleBiometrics: async () => {
    const { biometricsEnabled } = get();
    const newValue = !biometricsEnabled;
    await setBiometricsEnabled(newValue);
    set({ biometricsEnabled: newValue });
  },

  requireAuthForTransaction: async () => {
    const { biometricsEnabled } = get();
    if (!biometricsEnabled) return true;
    const result = await authenticate("Confirm transaction");
    return result.success;
  },

  switchNetwork: async (network: Network) => {
    await saveNetwork(network);
    set({ network });
    await get().refreshBalances();
  },

  switchChain: async (chainId: ChainId) => {
    await saveChainId(chainId);
    const chainType: ChainType = resolveChainType(chainId) ?? "neo-n3";
    // Update network based on chainId for backward compatibility
    const network: Network = chainId.includes("mainnet") ? "mainnet" : "testnet";
    await saveNetwork(network);
    set({ chainId, chainType, network });
    await get().refreshBalances();
  },

  importWallet: async (wif: string) => {
    try {
      set({ isLoading: true });
      const wallet = await importFromWIF(wif);
      set({ address: wallet.address, isLocked: false, isLoading: false });
      await get().refreshBalances();
      return true;
    } catch {
      set({ isLoading: false });
      return false;
    }
  },

  addToken: async (token: Token) => {
    await saveToken(token);
    await get().refreshBalances();
  },

  deleteToken: async (contractAddress: string) => {
    await removeToken(contractAddress);
    await get().refreshBalances();
  },

  setAddress: (address: string) => {
    set({ address, isLocked: false });
  },

  setLocale: async (locale: Locale) => {
    await saveLocale(locale);
    set({ locale });
  },
}));
