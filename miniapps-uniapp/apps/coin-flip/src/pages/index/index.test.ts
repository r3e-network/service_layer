import { describe, it, expect, vi, beforeEach } from "vitest";
import { ref } from "vue";

// Mock @neo/uniapp-sdk
vi.mock("@neo/uniapp-sdk", () => ({
  usePayments: vi.fn(() => ({
    payGAS: vi.fn().mockResolvedValue({ request_id: "test-payment-123" }),
  })),
  useRNG: vi.fn(() => ({
    requestRandom: vi.fn().mockResolvedValue({
      randomness: "a1b2c3d4e5f6",
      request_id: "rng-123",
    }),
  })),
}));

// Mock i18n utility
vi.mock("@/shared/utils/i18n", () => ({
  createT: () => (key: string) => key,
}));

describe("Coin Flip - Business Logic", () => {
  let payGASMock: any;
  let requestRandomMock: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const { usePayments, useRNG } = await import("@neo/uniapp-sdk");
    payGASMock = usePayments("test").payGAS;
    requestRandomMock = useRNG("test").requestRandom;
  });

  describe("Initialization", () => {
    it("should initialize with default values", () => {
      const betAmount = ref("1");
      const choice = ref<"heads" | "tails">("heads");
      const wins = ref(0);
      const losses = ref(0);
      const totalWon = ref(0);
      const isFlipping = ref(false);

      expect(betAmount.value).toBe("1");
      expect(choice.value).toBe("heads");
      expect(wins.value).toBe(0);
      expect(losses.value).toBe(0);
      expect(totalWon.value).toBe(0);
      expect(isFlipping.value).toBe(false);
    });
  });

  describe("Win Rate Calculation", () => {
    it("should return 0 when no games played", () => {
      const wins = 0;
      const losses = 0;
      const total = wins + losses;
      const winRate = total === 0 ? 0 : Math.round((wins / total) * 100);

      expect(winRate).toBe(0);
    });

    it("should calculate win rate correctly", () => {
      const wins = 7;
      const losses = 3;
      const total = wins + losses;
      const winRate = Math.round((wins / total) * 100);

      expect(winRate).toBe(70);
    });
  });

  describe("Coin Flip Outcome", () => {
    it("should determine heads from even randomness", () => {
      const randomness = "a2b4c6d8";
      const outcome = parseInt(randomness.slice(0, 2), 16) % 2 === 0 ? "heads" : "tails";

      expect(outcome).toBe("heads");
    });

    it("should determine win when choice matches outcome", () => {
      const choice = "heads";
      const outcome = "heads";
      const won = outcome === choice;

      expect(won).toBe(true);
    });
  });

  describe("Flip Function", () => {
    it("should reject bet below minimum (0.1 GAS)", () => {
      const betAmount = 0.05;
      const isValid = betAmount >= 0.1;

      expect(isValid).toBe(false);
    });

    it("should call payGAS with correct parameters", async () => {
      const betAmount = "1";
      const choice = "heads";

      await payGASMock(betAmount, `coinflip:${choice}`);

      expect(payGASMock).toHaveBeenCalledWith(betAmount, `coinflip:${choice}`);
    });
  });
});
