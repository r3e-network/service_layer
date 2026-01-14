import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/shared/utils/i18n", () => ({
  createT: () => (key: string) => key,
}));

describe("Heritage Trust - Legacy Management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Form Validation", () => {
    it("validates required fields", () => {
      const trust = {
        name: "Family Legacy",
        beneficiary: "NXXx...abc123",
        neoValue: "10",
      };

      const neoAmount = Math.floor(parseFloat(trust.neoValue));
      const isValid = trust.name.trim() && trust.beneficiary.trim() && neoAmount > 0;

      expect(isValid).toBe(true);
    });

    it("rejects missing fields or zero value", () => {
      const testCases = [
        { name: "", beneficiary: "NXXx", neoValue: "10" },
        { name: "Trust", beneficiary: "", neoValue: "10" },
        { name: "Trust", beneficiary: "NXXx", neoValue: "0" },
      ];

      testCases.forEach((trust) => {
        const neoAmount = Math.floor(parseFloat(trust.neoValue));
        const isValid = trust.name.trim() && trust.beneficiary.trim() && neoAmount > 0;
        expect(isValid).toBeFalsy();
      });
    });
  });

  describe("Trust Status", () => {
    it("marks trust executable when active and deadline passed", () => {
      const active = true;
      const now = Date.now();
      const deadlineMs = now - 1000;
      const canExecute = active && deadlineMs > 0 && deadlineMs <= now;

      expect(canExecute).toBe(true);
    });

    it("does not allow execution before deadline", () => {
      const active = true;
      const now = Date.now();
      const deadlineMs = now + 86_400_000;
      const canExecute = active && deadlineMs > 0 && deadlineMs <= now;

      expect(canExecute).toBe(false);
    });
  });

  describe("NEO Amount Handling", () => {
    it("floors fractional input to integer NEO", () => {
      const neoValue = "5.9";
      const neoAmount = Math.floor(parseFloat(neoValue));
      expect(neoAmount).toBe(5);
    });
  });
});
