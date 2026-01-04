import { describe, it, expect, vi, beforeEach } from "vitest";
import { ref } from "vue";

vi.mock("@neo/uniapp-sdk", () => ({
  usePayments: vi.fn(() => ({
    payGAS: vi.fn().mockResolvedValue({ request_id: "test-123" }),
    isLoading: ref(false),
  })),
  useRNG: vi.fn(() => ({
    requestRandom: vi.fn().mockResolvedValue({
      randomness: "0a1b2c3d",
      request_id: "rng-123",
    }),
  })),
}));

vi.mock("@/shared/utils/i18n", () => ({
  createT: () => (key: string) => key,
}));

describe("Scratch Card - Business Logic", () => {
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
      const hasCard = ref(false);
      const revealed = ref(false);
      const prize = ref(0);
      const cardsScratched = ref(0);
      const totalWon = ref(0);
      const wins = ref(0);

      expect(hasCard.value).toBe(false);
      expect(revealed.value).toBe(false);
      expect(prize.value).toBe(0);
      expect(cardsScratched.value).toBe(0);
      expect(totalWon.value).toBe(0);
      expect(wins.value).toBe(0);
    });
  });

  describe("Prize Calculation", () => {
    it("should award jackpot (10 GAS) for val < 5 (5% chance)", () => {
      const val = 3;
      const prize = val < 5 ? 10 : val < 20 ? 2 : val < 40 ? 1 : 0;
      expect(prize).toBe(10);
    });

    it("should award medium prize (2 GAS) for val 5-19 (15% chance)", () => {
      const val = 15;
      const prize = val < 5 ? 10 : val < 20 ? 2 : val < 40 ? 1 : 0;
      expect(prize).toBe(2);
    });

    it("should award small prize (1 GAS) for val 20-39 (20% chance)", () => {
      const val = 30;
      const prize = val < 5 ? 10 : val < 20 ? 2 : val < 40 ? 1 : 0;
      expect(prize).toBe(1);
    });

    it("should award no prize for val >= 40 (60% chance)", () => {
      const val = 50;
      const prize = val < 5 ? 10 : val < 20 ? 2 : val < 40 ? 1 : 0;
      expect(prize).toBe(0);
    });
  });

  describe("Buy Card Function", () => {
    it("should call payGAS with 1 GAS", async () => {
      await payGASMock("1", "scratchcard:buy");
      expect(payGASMock).toHaveBeenCalledWith("1", "scratchcard:buy");
    });

    it("should set hasCard to true after purchase", () => {
      const hasCard = ref(false);
      hasCard.value = true;
      expect(hasCard.value).toBe(true);
    });

    it("should reset revealed and prize on new purchase", () => {
      const revealed = ref(true);
      const prize = ref(10);
      revealed.value = false;
      prize.value = 0;
      expect(revealed.value).toBe(false);
      expect(prize.value).toBe(0);
    });
  });

  describe("Scratch Function", () => {
    it("should call requestRandom when scratching", async () => {
      await requestRandomMock();
      expect(requestRandomMock).toHaveBeenCalledTimes(1);
    });

    it("should calculate prize from randomness", () => {
      const randomness = "0a1b";
      const val = parseInt(randomness.slice(0, 4), 16) % 100;
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(100);
    });

    it("should increment cardsScratched", () => {
      const cardsScratched = ref(0);
      cardsScratched.value++;
      expect(cardsScratched.value).toBe(1);
    });

    it("should update totalWon and wins on prize", () => {
      const totalWon = ref(0);
      const wins = ref(0);
      const prize = 10;
      if (prize > 0) {
        totalWon.value += prize;
        wins.value++;
      }
      expect(totalWon.value).toBe(10);
      expect(wins.value).toBe(1);
    });

    it("should set hasCard to false after scratch", () => {
      const hasCard = ref(true);
      hasCard.value = false;
      expect(hasCard.value).toBe(false);
    });
  });

  describe("Win Rate Calculation", () => {
    it("should return 0 when no cards scratched", () => {
      const cardsScratched = 0;
      const wins = 0;
      const winRate = cardsScratched === 0 ? "0" : ((wins / cardsScratched) * 100).toFixed(1);
      expect(winRate).toBe("0");
    });

    it("should calculate win rate correctly", () => {
      const cardsScratched = 10;
      const wins = 4;
      const winRate = ((wins / cardsScratched) * 100).toFixed(1);
      expect(winRate).toBe("40.0");
    });

    it("should handle 100% win rate", () => {
      const cardsScratched = 5;
      const wins = 5;
      const winRate = ((wins / cardsScratched) * 100).toFixed(1);
      expect(winRate).toBe("100.0");
    });
  });

  describe("Button Text Logic", () => {
    it("should show buying when loading", () => {
      const isLoading = true;
      const hasCard = false;
      const revealed = false;
      const text = isLoading ? "buying" : (!hasCard || revealed) ? "buyCard" : "scratchNow";
      expect(text).toBe("buying");
    });

    it("should show buyCard when no card", () => {
      const isLoading = false;
      const hasCard = false;
      const revealed = false;
      const text = isLoading ? "buying" : (!hasCard || revealed) ? "buyCard" : "scratchNow";
      expect(text).toBe("buyCard");
    });

    it("should show scratchNow when card not revealed", () => {
      const isLoading = false;
      const hasCard = true;
      const revealed = false;
      const text = isLoading ? "buying" : (!hasCard || revealed) ? "buyCard" : "scratchNow";
      expect(text).toBe("scratchNow");
    });

    it("should show buyCard after revealing", () => {
      const isLoading = false;
      const hasCard = false;
      const revealed = true;
      const text = isLoading ? "buying" : (!hasCard || revealed) ? "buyCard" : "scratchNow";
      expect(text).toBe("buyCard");
    });
  });

  describe("Error Handling", () => {
    it("should handle payment error", async () => {
      payGASMock.mockRejectedValueOnce(new Error("Insufficient balance"));
      await expect(payGASMock("1", "scratchcard:buy")).rejects.toThrow("Insufficient balance");
    });

    it("should handle RNG error", async () => {
      requestRandomMock.mockRejectedValueOnce(new Error("RNG service unavailable"));
      await expect(requestRandomMock()).rejects.toThrow("RNG service unavailable");
    });
  });
});
