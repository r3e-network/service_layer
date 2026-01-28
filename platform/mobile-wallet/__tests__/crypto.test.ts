/**
 * Crypto Module Tests
 * Tests for encryption, decryption, and password validation
 */

import { validatePassword, PASSWORD_REQUIREMENTS } from "../src/lib/crypto";

// Mock expo-crypto
jest.mock("expo-crypto", () => ({
  digestStringAsync: jest.fn().mockResolvedValue("a".repeat(64)),
  getRandomBytesAsync: jest.fn().mockResolvedValue(new Uint8Array(16)),
  CryptoDigestAlgorithm: { SHA256: "SHA-256" },
  CryptoEncoding: { HEX: "hex" },
}));

describe("crypto", () => {
  describe("validatePassword", () => {
    it("should accept valid password", () => {
      const result = validatePassword("StrongP@ss1");
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject short password", () => {
      const result = validatePassword("Abc1");
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Password must be at least 8 characters");
    });

    it("should reject password without uppercase", () => {
      const result = validatePassword("weakpass1");
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Password must contain uppercase letter");
    });

    it("should reject password without lowercase", () => {
      const result = validatePassword("STRONGPASS1");
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Password must contain lowercase letter");
    });

    it("should reject password without number", () => {
      const result = validatePassword("StrongPass");
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Password must contain a number");
    });

    it("should return multiple errors for very weak password", () => {
      const result = validatePassword("abc");
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe("PASSWORD_REQUIREMENTS", () => {
    it("should have correct minimum length", () => {
      expect(PASSWORD_REQUIREMENTS.minLength).toBe(8);
    });

    it("should require uppercase", () => {
      expect(PASSWORD_REQUIREMENTS.requireUppercase).toBe(true);
    });

    it("should require lowercase", () => {
      expect(PASSWORD_REQUIREMENTS.requireLowercase).toBe(true);
    });

    it("should require number", () => {
      expect(PASSWORD_REQUIREMENTS.requireNumber).toBe(true);
    });
  });
});
