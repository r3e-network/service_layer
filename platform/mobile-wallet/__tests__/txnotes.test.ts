/**
 * Transaction Notes Tests
 * Tests for src/lib/txnotes.ts
 */

import * as SecureStore from "expo-secure-store";
import { loadNotes, getNote, saveNote, deleteNote } from "../src/lib/txnotes";

jest.mock("expo-secure-store");

const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

describe("txnotes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("loadNotes", () => {
    it("should return empty array when no notes", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      const notes = await loadNotes();
      expect(notes).toEqual([]);
    });
  });

  describe("getNote", () => {
    it("should return null when not found", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      const note = await getNote("0x123");
      expect(note).toBeNull();
    });

    it("should return note when found", async () => {
      const notes = [{ txHash: "0x123", note: "Test" }];
      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify(notes));
      const note = await getNote("0x123");
      expect(note?.note).toBe("Test");
    });
  });

  describe("saveNote", () => {
    it("should save new note", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      await saveNote("0x1", "My note");
      expect(mockSecureStore.setItemAsync).toHaveBeenCalled();
    });
  });

  describe("deleteNote", () => {
    it("should delete note", async () => {
      const notes = [{ txHash: "0x1" }, { txHash: "0x2" }];
      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify(notes));
      await deleteNote("0x1");
      expect(mockSecureStore.setItemAsync).toHaveBeenCalled();
    });
  });
});
