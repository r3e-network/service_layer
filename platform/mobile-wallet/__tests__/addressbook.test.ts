/**
 * Address Book Tests
 * Tests for src/lib/addressbook.ts
 */

import * as SecureStore from "expo-secure-store";
import {
  loadContacts,
  saveContact,
  updateContact,
  removeContact,
  getContactByAddress,
  searchContacts,
  generateContactId,
  isValidNeoAddress,
  Contact,
} from "../src/lib/addressbook";

jest.mock("expo-secure-store");

const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

describe("addressbook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("loadContacts", () => {
    it("should return empty array when no contacts", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      const contacts = await loadContacts();
      expect(contacts).toEqual([]);
    });

    it("should return stored contacts", async () => {
      const stored: Contact[] = [
        { id: "1", name: "Alice", address: "NXV7ZhHiyM1aHXwpVsRZC6BEaDQhNn2sfF", createdAt: 1000, updatedAt: 1000 },
      ];
      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify(stored));
      const contacts = await loadContacts();
      expect(contacts).toEqual(stored);
    });
  });

  describe("saveContact", () => {
    it("should save new contact with generated id and timestamps", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      const result = await saveContact({ name: "Bob", address: "NXV7ZhHiyM1aHXwpVsRZC6BEaDQhNn2sfF" });

      expect(result.id).toMatch(/^contact_/);
      expect(result.name).toBe("Bob");
      expect(result.createdAt).toBeDefined();
      expect(mockSecureStore.setItemAsync).toHaveBeenCalled();
    });

    it("should save contact with memo", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      const result = await saveContact({
        name: "Carol",
        address: "NXV7ZhHiyM1aHXwpVsRZC6BEaDQhNn2sfF",
        memo: "Test memo",
      });

      expect(result.memo).toBe("Test memo");
    });
  });

  describe("updateContact", () => {
    it("should update existing contact", async () => {
      const stored: Contact[] = [
        { id: "c1", name: "Old", address: "NXV7ZhHiyM1aHXwpVsRZC6BEaDQhNn2sfF", createdAt: 1000, updatedAt: 1000 },
      ];
      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify(stored));

      await updateContact("c1", { name: "New" });

      expect(mockSecureStore.setItemAsync).toHaveBeenCalled();
      const savedData = JSON.parse(mockSecureStore.setItemAsync.mock.calls[0][1]);
      expect(savedData[0].name).toBe("New");
      expect(savedData[0].updatedAt).toBeGreaterThan(1000);
    });

    it("should not update non-existent contact", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue("[]");
      await updateContact("nonexistent", { name: "Test" });
      expect(mockSecureStore.setItemAsync).not.toHaveBeenCalled();
    });
  });

  describe("removeContact", () => {
    it("should remove contact by id", async () => {
      const stored: Contact[] = [
        { id: "c1", name: "A", address: "addr1", createdAt: 1000, updatedAt: 1000 },
        { id: "c2", name: "B", address: "addr2", createdAt: 1000, updatedAt: 1000 },
      ];
      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify(stored));

      await removeContact("c1");

      const savedData = JSON.parse(mockSecureStore.setItemAsync.mock.calls[0][1]);
      expect(savedData).toHaveLength(1);
      expect(savedData[0].id).toBe("c2");
    });
  });

  describe("getContactByAddress", () => {
    it("should find contact by address", async () => {
      const stored: Contact[] = [
        { id: "c1", name: "Alice", address: "NXV7ZhHiyM1aHXwpVsRZC6BEaDQhNn2sfF", createdAt: 1000, updatedAt: 1000 },
      ];
      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify(stored));

      const contact = await getContactByAddress("NXV7ZhHiyM1aHXwpVsRZC6BEaDQhNn2sfF");
      expect(contact?.name).toBe("Alice");
    });

    it("should return undefined for unknown address", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue("[]");
      const contact = await getContactByAddress("unknown");
      expect(contact).toBeUndefined();
    });
  });

  describe("searchContacts", () => {
    const stored: Contact[] = [
      { id: "c1", name: "Alice", address: "NXV7ZhHiyM1aHXwpVsRZC6BEaDQhNn2sfF", createdAt: 1000, updatedAt: 1000 },
      { id: "c2", name: "Bob", address: "NZpsgXn9VQQoLexpuXJsrX8BcA64FN2k9M", createdAt: 1000, updatedAt: 1000 },
    ];

    beforeEach(() => {
      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify(stored));
    });

    it("should search by name", async () => {
      const results = await searchContacts("alice");
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("Alice");
    });

    it("should search by address", async () => {
      const results = await searchContacts("NZpsg");
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("Bob");
    });

    it("should return empty for no match", async () => {
      const results = await searchContacts("xyz");
      expect(results).toHaveLength(0);
    });
  });

  describe("generateContactId", () => {
    it("should generate unique ids", () => {
      const id1 = generateContactId();
      const id2 = generateContactId();
      expect(id1).toMatch(/^contact_/);
      expect(id1).not.toBe(id2);
    });
  });

  describe("isValidNeoAddress", () => {
    it("should validate correct Neo N3 addresses", () => {
      expect(isValidNeoAddress("NXV7ZhHiyM1aHXwpVsRZC6BEaDQhNn2sfF")).toBe(true);
      expect(isValidNeoAddress("NZpsgXn9VQQoLexpuXJsrX8BcA64FN2k9M")).toBe(true);
    });

    it("should reject invalid addresses", () => {
      expect(isValidNeoAddress("")).toBe(false);
      expect(isValidNeoAddress("invalid")).toBe(false);
      expect(isValidNeoAddress("AXV7ZhHiyM1aHXwpVsRZC6BEaDQhNn2sfF")).toBe(false); // wrong prefix
      expect(isValidNeoAddress("NXV7ZhHiyM1aHXwpVsRZC6BEaDQhNn2sf")).toBe(false); // too short
    });
  });
});
