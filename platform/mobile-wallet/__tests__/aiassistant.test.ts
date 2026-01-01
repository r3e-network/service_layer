/**
 * AI Assistant Tests
 * Tests for src/lib/aiassistant.ts
 */

import * as SecureStore from "expo-secure-store";
import {
  loadChatHistory,
  saveChatMessage,
  clearChatHistory,
  loadAISettings,
  saveAISettings,
  generateMessageId,
} from "../src/lib/aiassistant";

jest.mock("expo-secure-store");

const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

describe("aiassistant", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("loadChatHistory", () => {
    it("should return empty array when no history", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      const history = await loadChatHistory();
      expect(history).toEqual([]);
    });
  });

  describe("saveChatMessage", () => {
    it("should save message", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      const msg = await saveChatMessage({ role: "user", content: "Hello" });
      expect(msg.content).toBe("Hello");
      expect(mockSecureStore.setItemAsync).toHaveBeenCalled();
    });
  });

  describe("clearChatHistory", () => {
    it("should clear history", async () => {
      await clearChatHistory();
      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith("ai_chat_history", "[]");
    });
  });

  describe("loadAISettings", () => {
    it("should return defaults when no settings", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      const settings = await loadAISettings();
      expect(settings.enabled).toBe(true);
    });
  });

  describe("saveAISettings", () => {
    it("should save settings", async () => {
      await saveAISettings({ enabled: false, suggestions: true, language: "zh" });
      expect(mockSecureStore.setItemAsync).toHaveBeenCalled();
    });
  });

  describe("generateMessageId", () => {
    it("should generate unique IDs", () => {
      const id1 = generateMessageId();
      const id2 = generateMessageId();
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^msg_/);
    });
  });
});
