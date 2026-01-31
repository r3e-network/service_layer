/**
 * Crypto Module Tests
 * Tests for encryption, decryption, and password validation
 */

import { decrypt, encrypt, validatePassword, PASSWORD_REQUIREMENTS } from "../src/lib/crypto";

jest.mock("react-native-aes-crypto", () => ({
  randomKey: jest.fn((length: number) => Promise.resolve("s".repeat(length))),
  pbkdf2: jest.fn((password: string, salt: string, _cost: number, length: number) => {
    const hexLength = Math.ceil(length / 4);
    const seed = Buffer.from(`${password}:${salt}`).toString("hex");
    const expanded = seed.padEnd(hexLength, "0");
    return Promise.resolve(expanded.slice(0, hexLength));
  }),
  encrypt: jest.fn((text: string, key: string, iv: string) => {
    return Promise.resolve(Buffer.from(`${text}|${key}|${iv}`).toString("base64"));
  }),
  decrypt: jest.fn((ciphertext: string, key: string, iv: string) => {
    const decoded = Buffer.from(ciphertext, "base64").toString("utf8");
    const [text, k, v] = decoded.split("|");
    if (k !== key || v !== iv) throw new Error("bad key");
    return Promise.resolve(text);
  }),
  hmac256: jest.fn((data: string, key: string) => {
    const hex = Buffer.from(`${data}|${key}`).toString("hex");
    return Promise.resolve(hex.padEnd(64, "0").slice(0, 64));
  }),
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

  describe("encrypt/decrypt", () => {
    it("encrypt/decrypt roundtrip", async () => {
      const cipher = await encrypt("secret", "StrongP@ss1");
      const plain = await decrypt(cipher, "StrongP@ss1");
      expect(plain).toBe("secret");
    });

    it("rejects tampered ciphertext", async () => {
      const cipher = await encrypt("secret", "StrongP@ss1");
      const tampered = cipher.slice(0, -2) + "AA";
      const plain = await decrypt(tampered, "StrongP@ss1");
      expect(plain).toBeNull();
    });

    it("rejects wrong password", async () => {
      const cipher = await encrypt("secret", "StrongP@ss1");
      const plain = await decrypt(cipher, "WrongP@ss1");
      expect(plain).toBeNull();
    });
  });
});
