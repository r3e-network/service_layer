/**
 * Multi-Account Tests
 * Tests for src/lib/accounts.ts
 */

import * as SecureStore from "expo-secure-store";
import {
  loadAccounts,
  saveAccount,
  updateAccount,
  removeAccount,
  getActiveAccountId,
  setActiveAccountId,
  generateAccountId,
} from "../src/lib/accounts";

jest.mock("expo-secure-store");

const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

describe("Multi-Account Management", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("loadAccounts", () => {
    it("should return empty array when no accounts", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      const result = await loadAccounts();
      expect(result).toEqual([]);
    });

    it("should return parsed accounts", async () => {
      const accounts = [{ id: "1", name: "Test", address: "N123", createdAt: 123 }];
      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify(accounts));
      const result = await loadAccounts();
      expect(result).toEqual(accounts);
    });
  });

  describe("saveAccount", () => {
    it("should save new account", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      const account = { id: "1", name: "New", address: "N123", createdAt: 123 };
      await saveAccount(account);
      expect(mockSecureStore.setItemAsync).toHaveBeenCalled();
    });

    it("should not save duplicate account", async () => {
      const existing = [{ id: "1", name: "Existing", address: "N123", createdAt: 123 }];
      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify(existing));
      await saveAccount(existing[0]);
      expect(mockSecureStore.setItemAsync).not.toHaveBeenCalled();
    });
  });

  describe("updateAccount", () => {
    it("should update existing account", async () => {
      const existing = [{ id: "1", name: "Old", address: "N123", createdAt: 123 }];
      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify(existing));
      await updateAccount("1", { name: "New Name" });
      expect(mockSecureStore.setItemAsync).toHaveBeenCalled();
    });

    it("should not update non-existent account", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue("[]");
      await updateAccount("999", { name: "Test" });
      expect(mockSecureStore.setItemAsync).not.toHaveBeenCalled();
    });
  });

  describe("removeAccount", () => {
    it("should remove account by id", async () => {
      const existing = [
        { id: "1", name: "A", address: "N1", createdAt: 1 },
        { id: "2", name: "B", address: "N2", createdAt: 2 },
      ];
      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify(existing));
      await removeAccount("1");
      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith("wallet_accounts", JSON.stringify([existing[1]]));
    });
  });

  describe("getActiveAccountId / setActiveAccountId", () => {
    it("should get active account id", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue("acc_123");
      const result = await getActiveAccountId();
      expect(result).toBe("acc_123");
    });

    it("should set active account id", async () => {
      await setActiveAccountId("acc_456");
      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith("active_account", "acc_456");
    });
  });

  describe("generateAccountId", () => {
    it("should generate unique id", () => {
      const id1 = generateAccountId();
      const id2 = generateAccountId();
      expect(id1).toMatch(/^acc_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });
});
