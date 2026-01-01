/**
 * WalletConnect Tests
 * Tests for src/lib/walletconnect.ts
 */

import * as SecureStore from "expo-secure-store";
import {
  parseWCUri,
  isValidWCUri,
  getChainId,
  getRequestType,
  loadSessions,
  saveSession,
  removeSession,
  getSession,
  createSession,
  WCSession,
} from "../src/lib/walletconnect";

jest.mock("expo-secure-store");

const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

describe("walletconnect", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("parseWCUri", () => {
    it("should parse valid WC v2 URI", () => {
      const uri = "wc:abc123@2?relay-protocol=irn&symKey=xyz";
      const result = parseWCUri(uri);
      expect(result).toEqual({
        topic: "abc123",
        version: 2,
        relay: "irn",
      });
    });

    it("should return null for invalid URI", () => {
      expect(parseWCUri("invalid")).toBeNull();
      expect(parseWCUri("")).toBeNull();
      expect(parseWCUri("http://example.com")).toBeNull();
    });

    it("should use default relay if not specified", () => {
      const uri = "wc:topic@2?symKey=abc";
      const result = parseWCUri(uri);
      expect(result?.relay).toBe("irn");
    });
  });

  describe("isValidWCUri", () => {
    it("should return true for valid URI", () => {
      expect(isValidWCUri("wc:abc@2?relay-protocol=irn")).toBe(true);
    });

    it("should return false for invalid URI", () => {
      expect(isValidWCUri("invalid")).toBe(false);
      expect(isValidWCUri("")).toBe(false);
    });
  });

  describe("getChainId", () => {
    it("should return mainnet chain ID", () => {
      expect(getChainId("mainnet")).toBe("neo3:mainnet");
    });

    it("should return testnet chain ID", () => {
      expect(getChainId("testnet")).toBe("neo3:testnet");
    });
  });

  describe("getRequestType", () => {
    it("should identify sign_transaction", () => {
      expect(getRequestType("neo_signTransaction")).toBe("sign_transaction");
      expect(getRequestType("sign_transaction")).toBe("sign_transaction");
    });

    it("should identify sign_message", () => {
      expect(getRequestType("neo_signMessage")).toBe("sign_message");
      expect(getRequestType("personal_sign_message")).toBe("sign_message");
    });

    it("should return unknown for other methods", () => {
      expect(getRequestType("eth_call")).toBe("unknown");
      expect(getRequestType("random")).toBe("unknown");
    });
  });

  describe("loadSessions", () => {
    it("should return empty array when no sessions", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      const sessions = await loadSessions();
      expect(sessions).toEqual([]);
    });

    it("should filter expired sessions", async () => {
      const now = Date.now();
      const sessions: WCSession[] = [
        {
          topic: "valid",
          peerMeta: { name: "A", description: "", url: "", icons: [] },
          chainId: "neo3:mainnet",
          address: "addr",
          connectedAt: now,
          expiresAt: now + 10000,
        },
        {
          topic: "expired",
          peerMeta: { name: "B", description: "", url: "", icons: [] },
          chainId: "neo3:mainnet",
          address: "addr",
          connectedAt: now - 20000,
          expiresAt: now - 10000,
        },
      ];
      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify(sessions));
      const result = await loadSessions();
      expect(result).toHaveLength(1);
      expect(result[0].topic).toBe("valid");
    });
  });

  describe("saveSession", () => {
    it("should save new session", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue("[]");
      const session = createSession(
        "topic1",
        { name: "DApp", description: "", url: "https://dapp.com", icons: [] },
        "NXV7ZhHiyM1aHXwpVsRZC6BEaDQhNn2sfF",
        "mainnet",
      );
      await saveSession(session);
      expect(mockSecureStore.setItemAsync).toHaveBeenCalled();
    });

    it("should not duplicate existing session", async () => {
      const existing: WCSession[] = [
        {
          topic: "topic1",
          peerMeta: { name: "A", description: "", url: "", icons: [] },
          chainId: "neo3:mainnet",
          address: "addr",
          connectedAt: Date.now(),
          expiresAt: Date.now() + 100000,
        },
      ];
      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify(existing));
      await saveSession(existing[0]);
      expect(mockSecureStore.setItemAsync).not.toHaveBeenCalled();
    });
  });

  describe("removeSession", () => {
    it("should remove session by topic", async () => {
      const sessions: WCSession[] = [
        {
          topic: "t1",
          peerMeta: { name: "A", description: "", url: "", icons: [] },
          chainId: "neo3:mainnet",
          address: "addr",
          connectedAt: Date.now(),
          expiresAt: Date.now() + 100000,
        },
        {
          topic: "t2",
          peerMeta: { name: "B", description: "", url: "", icons: [] },
          chainId: "neo3:mainnet",
          address: "addr",
          connectedAt: Date.now(),
          expiresAt: Date.now() + 100000,
        },
      ];
      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify(sessions));
      await removeSession("t1");
      const saved = JSON.parse(mockSecureStore.setItemAsync.mock.calls[0][1]);
      expect(saved).toHaveLength(1);
      expect(saved[0].topic).toBe("t2");
    });
  });

  describe("getSession", () => {
    it("should find session by topic", async () => {
      const sessions: WCSession[] = [
        {
          topic: "target",
          peerMeta: { name: "Target", description: "", url: "", icons: [] },
          chainId: "neo3:mainnet",
          address: "addr",
          connectedAt: Date.now(),
          expiresAt: Date.now() + 100000,
        },
      ];
      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify(sessions));
      const result = await getSession("target");
      expect(result?.peerMeta.name).toBe("Target");
    });

    it("should return undefined for unknown topic", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue("[]");
      const result = await getSession("unknown");
      expect(result).toBeUndefined();
    });
  });

  describe("createSession", () => {
    it("should create session with correct fields", () => {
      const session = createSession(
        "topic123",
        { name: "MyDApp", description: "Test", url: "https://test.com", icons: ["icon.png"] },
        "NXV7ZhHiyM1aHXwpVsRZC6BEaDQhNn2sfF",
        "testnet",
      );
      expect(session.topic).toBe("topic123");
      expect(session.chainId).toBe("neo3:testnet");
      expect(session.address).toBe("NXV7ZhHiyM1aHXwpVsRZC6BEaDQhNn2sfF");
      expect(session.expiresAt).toBeGreaterThan(session.connectedAt);
    });
  });
});
