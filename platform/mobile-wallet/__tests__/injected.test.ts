/**
 * DApp Injected Script Tests
 * Tests for src/lib/dapp/injected.ts
 */

import { generateInjectedScript, parseWebViewMessage } from "../src/lib/dapp/injected";

describe("DApp Injected Script", () => {
  describe("generateInjectedScript", () => {
    it("should generate script with address", () => {
      const script = generateInjectedScript("NAddr123", "mainnet");
      expect(script).toContain("NAddr123");
      expect(script).toContain("MainNet");
    });

    it("should use TestNet for testnet", () => {
      const script = generateInjectedScript("NAddr", "testnet");
      expect(script).toContain("TestNet");
    });

    it("should include NEOLine API", () => {
      const script = generateInjectedScript("NAddr", "mainnet");
      expect(script).toContain("window.NEOLine");
      expect(script).toContain("getProvider");
      expect(script).toContain("getAccount");
    });
  });

  describe("parseWebViewMessage", () => {
    it("should parse valid message", () => {
      const msg = JSON.stringify({ type: "INVOKE", params: {} });
      const result = parseWebViewMessage(msg);
      expect(result?.type).toBe("INVOKE");
    });

    it("should return null for invalid JSON", () => {
      const result = parseWebViewMessage("invalid");
      expect(result).toBeNull();
    });
  });
});
