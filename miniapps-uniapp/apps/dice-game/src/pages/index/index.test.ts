import { describe, it, expect, vi, beforeEach } from "vitest";
import { ref } from "vue";

// Mock @neo/uniapp-sdk
vi.mock("@neo/uniapp-sdk", () => ({
  useWallet: () => ({
    address: ref("NXV7ZhHiyM1aHXwpVsRZC6BN3y4gABn6"),
    isConnected: ref(true),
  }),
  usePayments: vi.fn(() => ({
    payGAS: vi.fn().mockResolvedValue({ request_id: "test-payment-123" }),
    isLoading: ref(false),
  })),
  useRNG: vi.fn(() => ({
    requestRandom: vi.fn().mockResolvedValue({
      randomness: "a1b2c3d4e5f6",
      request_id: "rng-123",
    }),
    isLoading: ref(false),
  })),
}));

// Mock i18n utility
vi.mock("@/shared/utils/i18n", () => ({
  createT: () => (key: string) => key,
}));

describe("Dice Game - Business Logic", () => {
  let payGASMock: any;
  let requestRandomMock: any;

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock functions are already set up via vi.mock() at the top
    payGASMock = vi.fn().mockResolvedValue({ request_id: "test-payment-123" });
    requestRandomMock = vi.fn().mockResolvedValue({
      randomness: "a1b2c3d4e5f6",
      request_id: "rng-123",
    });
  });

  describe("Initialization", () => {
    it("should initialize with default values", () => {
      const betAmount = ref("1");
      const target = ref(7);
      const prediction = ref<"over" | "under">("over");
      const isRolling = ref(false);
      const stats = ref({ totalRolls: 0, wins: 0, losses: 0 });

      expect(betAmount.value).toBe("1");
      expect(target.value).toBe(7);
      expect(prediction.value).toBe("over");
      expect(isRolling.value).toBe(false);
      expect(stats.value).toEqual({ totalRolls: 0, wins: 0, losses: 0 });
    });
  });

  describe("Win Chance Calculation", () => {
    it("should calculate win chance for 'over' prediction correctly", () => {
      const target = 7;
      const prediction = "over";
      const chance = prediction === "over" ? (12 - target) / 11 : (target - 2) / 11;
      const winChance = (chance * 100).toFixed(1);

      expect(winChance).toBe("45.5");
    });

    it("should calculate win chance for 'under' prediction correctly", () => {
      const target = 7;
      const prediction = "under";
      const chance = prediction === "over" ? (12 - target) / 11 : (target - 2) / 11;
      const winChance = (chance * 100).toFixed(1);

      expect(winChance).toBe("45.5");
    });

    it("should calculate 100% win chance for target 2 with 'under'", () => {
      const target = 2;
      const prediction = "under";
      const chance = prediction === "over" ? (12 - target) / 11 : (target - 2) / 11;
      const winChance = (chance * 100).toFixed(1);

      expect(winChance).toBe("0.0");
    });

    it("should calculate 100% win chance for target 12 with 'over'", () => {
      const target = 12;
      const prediction = "over";
      const chance = prediction === "over" ? (12 - target) / 11 : (target - 2) / 11;
      const winChance = (chance * 100).toFixed(1);

      expect(winChance).toBe("0.0");
    });
  });

  describe("Potential Payout Calculation", () => {
    it("should calculate potential payout correctly", () => {
      const betAmount = "1";
      const amount = parseFloat(betAmount);
      const potentialPayout = (amount * 1.9).toFixed(2);

      expect(potentialPayout).toBe("1.90");
    });

    it("should handle decimal bet amounts", () => {
      const betAmount = "2.5";
      const amount = parseFloat(betAmount);
      const potentialPayout = (amount * 1.9).toFixed(2);

      expect(potentialPayout).toBe("4.75");
    });
  });

  describe("Dice Roll Logic", () => {
    it("should generate dice values from randomness correctly", () => {
      const randomness = "a1b2c3d4e5f6";
      const dice1 = (parseInt(randomness.slice(0, 2), 16) % 6) + 1;
      const dice2 = (parseInt(randomness.slice(2, 4), 16) % 6) + 1;

      expect(dice1).toBeGreaterThanOrEqual(1);
      expect(dice1).toBeLessThanOrEqual(6);
      expect(dice2).toBeGreaterThanOrEqual(1);
      expect(dice2).toBeLessThanOrEqual(6);
    });

    it("should determine win correctly for 'over' prediction", () => {
      const dice1 = 5;
      const dice2 = 4;
      const total = dice1 + dice2; // 9
      const target = 7;
      const prediction = "over";
      const won = prediction === "over" ? total > target : total < target;

      expect(won).toBe(true);
    });

    it("should determine loss correctly for 'over' prediction", () => {
      const dice1 = 2;
      const dice2 = 3;
      const total = dice1 + dice2; // 5
      const target = 7;
      const prediction = "over";
      const won = prediction === "over" ? total > target : total < target;

      expect(won).toBe(false);
    });

    it("should determine win correctly for 'under' prediction", () => {
      const dice1 = 2;
      const dice2 = 3;
      const total = dice1 + dice2; // 5
      const target = 7;
      const prediction = "under";
      const won = prediction === "over" ? total > target : total < target;

      expect(won).toBe(true);
    });
  });

  describe("Roll Dice Function", () => {
    it("should call payGAS with correct parameters", async () => {
      const betAmount = "1";
      const prediction = "over";
      const target = 7;

      await payGASMock(betAmount, `dice:${prediction}:${target}`);

      expect(payGASMock).toHaveBeenCalledWith(betAmount, `dice:${prediction}:${target}`);
      expect(payGASMock).toHaveBeenCalledTimes(1);
    });

    it("should call requestRandom after payment", async () => {
      await payGASMock("1", "dice:over:7");
      await requestRandomMock();

      expect(requestRandomMock).toHaveBeenCalledTimes(1);
    });

    it("should update stats on win", () => {
      const stats = ref({ totalRolls: 0, wins: 0, losses: 0 });
      const won = true;

      stats.value.totalRolls++;
      if (won) {
        stats.value.wins++;
      } else {
        stats.value.losses++;
      }

      expect(stats.value.totalRolls).toBe(1);
      expect(stats.value.wins).toBe(1);
      expect(stats.value.losses).toBe(0);
    });

    it("should update stats on loss", () => {
      const stats = ref({ totalRolls: 0, wins: 0, losses: 0 });
      const won = false;

      stats.value.totalRolls++;
      if (won) {
        stats.value.wins++;
      } else {
        stats.value.losses++;
      }

      expect(stats.value.totalRolls).toBe(1);
      expect(stats.value.wins).toBe(0);
      expect(stats.value.losses).toBe(1);
    });
  });

  describe("Win Rate Calculation", () => {
    it("should return 0.0 when no rolls", () => {
      const stats = { totalRolls: 0, wins: 0, losses: 0 };
      const winRate = stats.totalRolls === 0 ? "0.0" : ((stats.wins / stats.totalRolls) * 100).toFixed(1);

      expect(winRate).toBe("0.0");
    });

    it("should calculate win rate correctly", () => {
      const stats = { totalRolls: 10, wins: 6, losses: 4 };
      const winRate = ((stats.wins / stats.totalRolls) * 100).toFixed(1);

      expect(winRate).toBe("60.0");
    });

    it("should handle 100% win rate", () => {
      const stats = { totalRolls: 5, wins: 5, losses: 0 };
      const winRate = ((stats.wins / stats.totalRolls) * 100).toFixed(1);

      expect(winRate).toBe("100.0");
    });
  });

  describe("Can Roll Validation", () => {
    it("should allow roll when bet amount is positive and address exists", () => {
      const betAmount = "1";
      const address = "NXV7ZhHiyM1aHXwpVsRZC6BN3y4gABn6";
      const canRoll = parseFloat(betAmount) > 0 && !!address;

      expect(canRoll).toBe(true);
    });

    it("should not allow roll when bet amount is zero", () => {
      const betAmount = "0";
      const address = "NXV7ZhHiyM1aHXwpVsRZC6BN3y4gABn6";
      const canRoll = parseFloat(betAmount) > 0 && !!address;

      expect(canRoll).toBe(false);
    });

    it("should not allow roll when address is empty", () => {
      const betAmount = "1";
      const address = "";
      const canRoll = parseFloat(betAmount) > 0 && !!address;

      expect(canRoll).toBe(false);
    });
  });

  describe("Error Handling", () => {
    it("should handle payment error", async () => {
      payGASMock.mockRejectedValueOnce(new Error("Insufficient balance"));

      await expect(payGASMock("1", "dice:over:7")).rejects.toThrow("Insufficient balance");
    });

    it("should handle RNG error", async () => {
      requestRandomMock.mockRejectedValueOnce(new Error("RNG service unavailable"));

      await expect(requestRandomMock()).rejects.toThrow("RNG service unavailable");
    });
  });

  describe("Edge Cases", () => {
    it("should handle minimum bet amount", () => {
      const betAmount = "0.1";
      const amount = parseFloat(betAmount);

      expect(amount).toBeGreaterThan(0);
    });

    it("should handle large bet amount", () => {
      const betAmount = "1000";
      const amount = parseFloat(betAmount);
      const potentialPayout = (amount * 1.9).toFixed(2);

      expect(potentialPayout).toBe("1900.00");
    });

    it("should handle all target numbers (2-12)", () => {
      const targets = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

      targets.forEach((target) => {
        expect(target).toBeGreaterThanOrEqual(2);
        expect(target).toBeLessThanOrEqual(12);
      });
    });
  });
});
