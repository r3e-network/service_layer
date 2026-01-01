/**
 * WalletConnect Session Store
 * Manages WalletConnect sessions and pending requests
 */

import { create } from "zustand";
import {
  WCSession,
  WCRequest,
  PeerMeta,
  loadSessions,
  saveSession,
  removeSession,
  createSession,
} from "@/lib/walletconnect";

interface WCState {
  sessions: WCSession[];
  pendingRequest: WCRequest | null;
  pendingMeta: PeerMeta | null;
  isConnecting: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  connect: (topic: string, peerMeta: PeerMeta, address: string, network: "mainnet" | "testnet") => Promise<void>;
  disconnect: (topic: string) => Promise<void>;
  setPendingRequest: (request: WCRequest | null, meta: PeerMeta | null) => void;
  clearError: () => void;
}

export const useWCStore = create<WCState>((set, get) => ({
  sessions: [],
  pendingRequest: null,
  pendingMeta: null,
  isConnecting: false,
  error: null,

  initialize: async () => {
    const sessions = await loadSessions();
    set({ sessions });
  },

  connect: async (topic, peerMeta, address, network) => {
    set({ isConnecting: true, error: null });
    try {
      const session = createSession(topic, peerMeta, address, network);
      await saveSession(session);
      const sessions = await loadSessions();
      set({ sessions, isConnecting: false });
    } catch (e) {
      set({ error: "Failed to connect", isConnecting: false });
    }
  },

  disconnect: async (topic) => {
    await removeSession(topic);
    const sessions = await loadSessions();
    set({ sessions });
  },

  setPendingRequest: (request, meta) => {
    set({ pendingRequest: request, pendingMeta: meta });
  },

  clearError: () => set({ error: null }),
}));
