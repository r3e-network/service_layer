/**
 * QR Code Tests
 * Tests for src/lib/qrcode.ts
 */

import { detectQRType, parsePaymentURI, parseQRCode, generatePaymentURI, isValidNeoAddress } from "../src/lib/qrcode";

describe("qrcode", () => {
  describe("detectQRType", () => {
    it("should detect Neo address", () => {
      expect(detectQRType("NXV7ZhHiyM1aHXwpVsRZC6BEaDQhNn2sfF")).toBe("address");
    });

    it("should detect payment URI", () => {
      expect(detectQRType("neo:NXV7ZhHiyM1aHXwpVsRZC6BEaDQhNn2sfF")).toBe("payment");
      expect(detectQRType("neo:NXV7ZhHiyM1aHXwpVsRZC6BEaDQhNn2sfF?amount=10")).toBe("payment");
    });

    it("should detect WalletConnect URI", () => {
      expect(detectQRType("wc:abc@2?relay-protocol=irn")).toBe("walletconnect");
    });

    it("should return unknown for invalid content", () => {
      expect(detectQRType("")).toBe("unknown");
      expect(detectQRType("invalid")).toBe("unknown");
      expect(detectQRType("http://example.com")).toBe("unknown");
    });
  });

  describe("parsePaymentURI", () => {
    it("should parse simple payment URI", () => {
      const result = parsePaymentURI("neo:NXV7ZhHiyM1aHXwpVsRZC6BEaDQhNn2sfF");
      expect(result?.address).toBe("NXV7ZhHiyM1aHXwpVsRZC6BEaDQhNn2sfF");
    });

    it("should parse payment URI with params", () => {
      const result = parsePaymentURI("neo:NXV7ZhHiyM1aHXwpVsRZC6BEaDQhNn2sfF?amount=10&asset=GAS&memo=test");
      expect(result?.address).toBe("NXV7ZhHiyM1aHXwpVsRZC6BEaDQhNn2sfF");
      expect(result?.amount).toBe("10");
      expect(result?.asset).toBe("GAS");
      expect(result?.memo).toBe("test");
    });

    it("should return null for invalid URI", () => {
      expect(parsePaymentURI("invalid")).toBeNull();
      expect(parsePaymentURI("")).toBeNull();
    });
  });

  describe("parseQRCode", () => {
    it("should parse address QR", () => {
      const result = parseQRCode("NXV7ZhHiyM1aHXwpVsRZC6BEaDQhNn2sfF");
      expect(result.type).toBe("address");
    });

    it("should parse payment QR", () => {
      const result = parseQRCode("neo:NXV7ZhHiyM1aHXwpVsRZC6BEaDQhNn2sfF?amount=5");
      expect(result.type).toBe("payment");
    });

    it("should parse WC QR", () => {
      const result = parseQRCode("wc:abc@2?relay-protocol=irn");
      expect(result.type).toBe("walletconnect");
    });

    it("should return unknown for invalid", () => {
      const result = parseQRCode("invalid");
      expect(result.type).toBe("unknown");
      expect(result.data).toBeNull();
    });
  });

  describe("generatePaymentURI", () => {
    it("should generate simple URI", () => {
      const uri = generatePaymentURI({ address: "NXV7ZhHiyM1aHXwpVsRZC6BEaDQhNn2sfF" });
      expect(uri).toBe("neo:NXV7ZhHiyM1aHXwpVsRZC6BEaDQhNn2sfF");
    });

    it("should generate URI with params", () => {
      const uri = generatePaymentURI({
        address: "NXV7ZhHiyM1aHXwpVsRZC6BEaDQhNn2sfF",
        amount: "10",
        asset: "GAS",
      });
      expect(uri).toContain("amount=10");
      expect(uri).toContain("asset=GAS");
    });
  });

  describe("isValidNeoAddress", () => {
    it("should validate correct addresses", () => {
      expect(isValidNeoAddress("NXV7ZhHiyM1aHXwpVsRZC6BEaDQhNn2sfF")).toBe(true);
    });

    it("should reject invalid addresses", () => {
      expect(isValidNeoAddress("")).toBe(false);
      expect(isValidNeoAddress("invalid")).toBe(false);
    });
  });
});
