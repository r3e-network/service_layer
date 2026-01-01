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
    it("should generate unique IDs", () => {
      const id1 = generateBackupId();
      const id2 = generateBackupId();
      expect(id1).not.toBe(id2);
    });

    it("should start with backup_ prefix", () => {
      expect(generateBackupId().startsWith("backup_")).toBe(true);
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
      const encrypted = await encryptMnemonic("test mnemonic", "password");
      expect(encrypted).toContain(".");
    });
  });

  describe("decryptMnemonic", () => {
    it("should decrypt with correct password", async () => {
      const encrypted = await encryptMnemonic("test mnemonic", "password");
      const decrypted = await decryptMnemonic(encrypted, "password");
      expect(decrypted).toBe("test mnemonic");
    });

    it("should return null for invalid format", async () => {
      const result = await decryptMnemonic("invalid", "password");
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
  });
});
