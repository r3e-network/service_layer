/**
 * Backup Tests
 * Tests for src/lib/backup.ts
 */

import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import {
  createBackup,
  generateChecksum,
  verifyChecksum,
  saveBackupMetadata,
  loadBackupHistory,
  generateBackupId,
  validateMnemonic,
  verifyMnemonicMatch,
  encryptMnemonic,
  decryptMnemonic,
  formatBackupDate,
  getBackupTypeLabel,
  restoreWalletFromMnemonic,
} from "../src/lib/backup";

jest.mock("expo-secure-store");
jest.mock("expo-crypto");

const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;
const mockCrypto = Crypto as jest.Mocked<typeof Crypto>;

describe("backup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCrypto.digestStringAsync.mockResolvedValue("abcdef1234567890abcdef");
  });

  describe("generateChecksum", () => {
    it("should generate 16 char checksum", async () => {
      const checksum = await generateChecksum("test data");
      expect(checksum).toHaveLength(16);
    });
  });

  describe("createBackup", () => {
    it("should create backup with checksum", async () => {
      const wallets = [{ name: "Test", address: "addr", encryptedMnemonic: "enc" }];
      const backup = await createBackup(wallets, "password");
      expect(backup.version).toBe(1);
      expect(backup.wallets).toHaveLength(1);
      expect(backup.checksum).toBeDefined();
    });
  });

  describe("verifyChecksum", () => {
    it("should verify valid checksum", async () => {
      const backup = {
        version: 1,
        wallets: [],
        createdAt: 123,
        checksum: "abcdef1234567890",
      };
      const valid = await verifyChecksum(backup);
      expect(valid).toBe(true);
    });
  });

  describe("loadBackupHistory", () => {
    it("should return empty array when no history", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      const history = await loadBackupHistory();
      expect(history).toEqual([]);
    });

    it("should return stored history", async () => {
      const meta = [{ id: "backup_1", type: "cloud", timestamp: 123, walletCount: 1, encrypted: true }];
      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify(meta));
      const history = await loadBackupHistory();
      expect(history).toHaveLength(1);
    });
  });

  describe("saveBackupMetadata", () => {
    it("should save metadata", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      await saveBackupMetadata({ id: "b1", type: "local", timestamp: 123, walletCount: 1, encrypted: true });
      expect(mockSecureStore.setItemAsync).toHaveBeenCalled();
    });
  });

  describe("generateBackupId", () => {
    it("should generate unique IDs", async () => {
      const id1 = await generateBackupId();
      const id2 = await generateBackupId();
      expect(id1).not.toBe(id2);
    });

    it("should start with backup_ prefix", async () => {
      const id = await generateBackupId();
      expect(id.startsWith("backup_")).toBe(true);
    });
  });

  describe("validateMnemonic", () => {
    it("should validate 12 word mnemonic", () => {
      const mnemonic = "word ".repeat(12).trim();
      expect(validateMnemonic(mnemonic)).toBe(true);
    });

    it("should validate 24 word mnemonic", () => {
      const mnemonic = "word ".repeat(24).trim();
      expect(validateMnemonic(mnemonic)).toBe(true);
    });

    it("should reject invalid word count", () => {
      expect(validateMnemonic("one two three")).toBe(false);
    });
  });

  describe("verifyMnemonicMatch", () => {
    it("should match identical mnemonics", async () => {
      const result = await verifyMnemonicMatch("word one two", "word one two");
      expect(result).toBe(true);
    });

    it("should match with different case", async () => {
      const result = await verifyMnemonicMatch("WORD ONE", "word one");
      expect(result).toBe(true);
    });
  });

  describe("encryptMnemonic", () => {
    it("should encrypt mnemonic", async () => {
      const encrypted = await encryptMnemonic("test mnemonic", "StrongPass123");
      // New format is pure base64 without separator
      expect(encrypted.length).toBeGreaterThan(0);
      expect(typeof encrypted).toBe("string");
    });
  });

  describe("decryptMnemonic", () => {
    it("should return null for invalid format", async () => {
      const result = await decryptMnemonic("invalid", "StrongPass123");
      expect(result).toBeNull();
    });

    it("should return null for wrong password", async () => {
      // With mocked crypto, we can only test error cases
      const result = await decryptMnemonic("short", "WrongPass123");
      expect(result).toBeNull();
    });
  });

  describe("formatBackupDate", () => {
    it("should format timestamp", () => {
      const date = formatBackupDate(1704067200000);
      expect(date).toBeDefined();
    });
  });

  describe("getBackupTypeLabel", () => {
    it("should return correct labels", () => {
      expect(getBackupTypeLabel("cloud")).toBe("Cloud Backup");
      expect(getBackupTypeLabel("local")).toBe("Local Backup");
    });

    it("should use translation function when provided", () => {
      const mockT = jest.fn((key: string) => `translated_${key}`);
      expect(getBackupTypeLabel("cloud", mockT)).toBe("translated_backup.type.cloud");
      expect(getBackupTypeLabel("local", mockT)).toBe("translated_backup.type.local");
    });
  });

  describe("formatBackupDate", () => {
    it("should format timestamp", () => {
      const date = formatBackupDate(1704067200000);
      expect(date).toBeDefined();
    });

    it("should format with different locale", () => {
      const dateEn = formatBackupDate(1704067200000, "en");
      const dateZh = formatBackupDate(1704067200000, "zh");
      expect(dateEn).toBeDefined();
      expect(dateZh).toBeDefined();
    });
  });

  describe("restoreWalletFromMnemonic", () => {
    it("should restore wallet from 12 word mnemonic", async () => {
      const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
      const result = await restoreWalletFromMnemonic(mnemonic, "StrongPass123");
      
      expect(result.address).toBeDefined();
      expect(result.publicKey).toBeDefined();
      expect(result.address.startsWith("N")).toBe(true);
      expect(mockSecureStore.setItemAsync).toHaveBeenCalledTimes(4);
    });

    it("should restore wallet from 24 word mnemonic", async () => {
      const mnemonic = "abandon ".repeat(23) + "art";
      const result = await restoreWalletFromMnemonic(mnemonic.trim(), "StrongPass123");
      
      expect(result.address).toBeDefined();
      expect(result.publicKey).toBeDefined();
    });

    it("should throw error for invalid mnemonic length", async () => {
      await expect(
        restoreWalletFromMnemonic("one two three", "StrongPass123")
      ).rejects.toThrow("Invalid mnemonic length");
    });

    it("should normalize mnemonic case", async () => {
      const mnemonic = "ABANDON ABANDON ABANDON ABANDON ABANDON ABANDON ABANDON ABANDON ABANDON ABANDON ABANDON ABOUT";
      const result = await restoreWalletFromMnemonic(mnemonic, "StrongPass123");
      expect(result.address).toBeDefined();
    });
  });
});
