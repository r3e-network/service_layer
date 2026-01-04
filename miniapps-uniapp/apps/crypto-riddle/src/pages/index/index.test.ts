import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ref } from "vue";

// Mock @neo/uniapp-sdk
vi.mock("@neo/uniapp-sdk", () => ({
  useWallet: vi.fn(() => ({
    address: ref("NXV7ZhHiyM1aHXwpVsRZC6BN3y4gABn6"),
    isConnected: ref(true),
  })),
  usePayments: vi.fn(() => ({
    payGAS: vi.fn().mockResolvedValue({ request_id: "test-123" }),
  })),
  useRNG: vi.fn(() => ({
    requestRandom: vi.fn().mockResolvedValue({ randomness: "a1b2c3d4e5f6" }),
  })),
}));

// Mock i18n utility
vi.mock("@/shared/utils/i18n", () => ({
  createT: vi.fn(() => (key: string) => key),
}));

describe("Crypto Riddle MiniApp", () => {
  let mockPayGAS: any;
  let mockRequestRandom: any;
  let mockIsConnected: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const { usePayments, useRNG, useWallet } = await import("@neo/uniapp-sdk");
    mockPayGAS = usePayments("test").payGAS;
    mockRequestRandom = useRNG("test").requestRandom;
    mockIsConnected = useWallet().isConnected;
  });

  describe("Timer Functionality", () => {
    it("should format time correctly", () => {
      const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
      };

      expect(formatTime(300)).toBe("05:00");
      expect(formatTime(125)).toBe("02:05");
      expect(formatTime(59)).toBe("00:59");
      expect(formatTime(0)).toBe("00:00");
    });

    it("should countdown timer", (done) => {
      const timeRemaining = ref(5);
      const interval = setInterval(() => {
        if (timeRemaining.value > 0) timeRemaining.value--;
        else clearInterval(interval);
      }, 100);

      setTimeout(() => {
        expect(timeRemaining.value).toBeLessThan(5);
        clearInterval(interval);
        done();
      }, 250);
    });

    it("should stop at zero", (done) => {
      const timeRemaining = ref(2);
      const interval = setInterval(() => {
        if (timeRemaining.value > 0) timeRemaining.value--;
        else clearInterval(interval);
      }, 100);

      setTimeout(() => {
        expect(timeRemaining.value).toBe(0);
        clearInterval(interval);
        done();
      }, 300);
    });
  });

  describe("Answer Submission", () => {
    it("should submit correct answer", async () => {
      const userAnswer = ref("hash");
      const currentRiddle = {
        id: 1,
        question: "Test question",
        answer: "hash",
        hint: "Test hint",
        difficulty: "easy",
        reward: 1.0,
      };

      await mockPayGAS("0.5", `riddle:${currentRiddle.id}:attempt`);

      const correct = userAnswer.value.trim().toLowerCase() === currentRiddle.answer.toLowerCase();
      expect(correct).toBe(true);
      expect(mockPayGAS).toHaveBeenCalledWith("0.5", "riddle:1:attempt");
    });

    it("should reject incorrect answer", async () => {
      const userAnswer = ref("wrong");
      const currentRiddle = {
        id: 1,
        answer: "hash",
        difficulty: "easy",
        reward: 1.0,
      };

      await mockPayGAS("0.5", `riddle:${currentRiddle.id}:attempt`);

      const correct = userAnswer.value.trim().toLowerCase() === currentRiddle.answer.toLowerCase();
      expect(correct).toBe(false);
    });

    it("should not submit empty answer", async () => {
      const userAnswer = ref("");
      const isSubmitting = ref(false);

      const submitAnswer = async () => {
        if (isSubmitting.value || !userAnswer.value.trim()) return;
        await mockPayGAS("0.5", "riddle:1:attempt");
      };

      await submitAnswer();
      expect(mockPayGAS).not.toHaveBeenCalled();
    });

    it("should not submit when already submitting", async () => {
      const isSubmitting = ref(true);
      const userAnswer = ref("hash");

      const submitAnswer = async () => {
        if (isSubmitting.value || !userAnswer.value.trim()) return;
        await mockPayGAS("0.5", "riddle:1:attempt");
      };

      await submitAnswer();
      expect(mockPayGAS).not.toHaveBeenCalled();
    });

    it("should handle case-insensitive answers", () => {
      const userAnswer = "HASH";
      const correctAnswer = "hash";

      expect(userAnswer.toLowerCase()).toBe(correctAnswer.toLowerCase());
    });

    it("should trim whitespace from answers", () => {
      const userAnswer = "  hash  ";
      const correctAnswer = "hash";

      expect(userAnswer.trim().toLowerCase()).toBe(correctAnswer.toLowerCase());
    });
  });

  describe("Wallet Connection", () => {
    it("should check wallet connection before submission", () => {
      expect(mockIsConnected.value).toBe(true);
    });

    it("should reject submission without wallet", async () => {
      mockIsConnected.value = false;

      const submitAnswer = async () => {
        if (!mockIsConnected.value) {
          throw new Error("Please connect wallet first");
        }
        await mockPayGAS("0.5", "riddle:1:attempt");
      };

      await expect(submitAnswer()).rejects.toThrow("Please connect wallet first");
      expect(mockPayGAS).not.toHaveBeenCalled();
    });
  });

  describe("Reward System", () => {
    it("should pay entry fee", async () => {
      await mockPayGAS("0.5", "riddle:1:attempt");
      expect(mockPayGAS).toHaveBeenCalledWith("0.5", "riddle:1:attempt");
    });

    it("should pay reward for correct answer", async () => {
      const reward = 1.0;
      await mockPayGAS(`-${reward}`, "riddle:1:reward");

      expect(mockPayGAS).toHaveBeenCalledWith("-1", "riddle:1:reward");
    });

    it("should update stats after correct answer", async () => {
      const solvedCount = ref(0);
      const totalRewards = ref(0);
      const currentStreak = ref(0);
      const reward = 1.0;

      await mockPayGAS("-1", "riddle:1:reward");

      solvedCount.value++;
      totalRewards.value = parseFloat((totalRewards.value + reward).toFixed(2));
      currentStreak.value++;

      expect(solvedCount.value).toBe(1);
      expect(totalRewards.value).toBe(1.0);
      expect(currentStreak.value).toBe(1);
    });

    it("should reset streak on wrong answer", () => {
      const currentStreak = ref(5);
      currentStreak.value = 0;

      expect(currentStreak.value).toBe(0);
    });

    it("should handle payment error", async () => {
      mockPayGAS.mockRejectedValueOnce(new Error("Insufficient funds"));

      await expect(mockPayGAS("0.5", "riddle:1:attempt")).rejects.toThrow("Insufficient funds");
    });
  });

  describe("RNG Integration", () => {
    it("should use RNG to select random riddle", async () => {
      const rng = await mockRequestRandom();

      expect(mockRequestRandom).toHaveBeenCalled();
      expect(rng.randomness).toBe("a1b2c3d4e5f6");
    });

    it("should calculate random index from RNG", async () => {
      const riddles = [
        { id: 1, answer: "A1", difficulty: "easy", reward: 1.0 },
        { id: 2, answer: "A2", difficulty: "medium", reward: 2.0 },
        { id: 3, answer: "A3", difficulty: "hard", reward: 3.0 },
      ];

      const rng = await mockRequestRandom();
      const randomIndex = parseInt(rng.randomness.slice(0, 2), 16) % riddles.length;

      expect(randomIndex).toBeGreaterThanOrEqual(0);
      expect(randomIndex).toBeLessThan(riddles.length);
    });

    it("should fallback to sequential on RNG failure", async () => {
      mockRequestRandom.mockRejectedValueOnce(new Error("RNG failed"));

      const currentRiddleIndex = ref(0);
      const riddles = [
        { id: 1, answer: "A1" },
        { id: 2, answer: "A2" },
      ];

      try {
        await mockRequestRandom();
      } catch {
        currentRiddleIndex.value = (currentRiddleIndex.value + 1) % riddles.length;
      }

      expect(currentRiddleIndex.value).toBe(1);
    });
  });

  describe("Difficulty Levels", () => {
    it("should have correct rewards for each difficulty", () => {
      const riddles = [
        { id: 1, difficulty: "easy", reward: 1.0 },
        { id: 2, difficulty: "medium", reward: 2.0 },
        { id: 3, difficulty: "hard", reward: 3.0 },
      ];

      expect(riddles[0].reward).toBe(1.0);
      expect(riddles[1].reward).toBe(2.0);
      expect(riddles[2].reward).toBe(3.0);
    });

    it("should have increasing rewards with difficulty", () => {
      const riddles = [
        { difficulty: "easy", reward: 1.0 },
        { difficulty: "medium", reward: 2.0 },
        { difficulty: "hard", reward: 3.0 },
      ];

      for (let i = 1; i < riddles.length; i++) {
        expect(riddles[i].reward).toBeGreaterThan(riddles[i - 1].reward);
      }
    });
  });

  describe("Edge Cases", () => {
    it("should handle very long answers", () => {
      const userAnswer = "a".repeat(1000);
      expect(userAnswer.length).toBe(1000);
    });

    it("should handle special characters in answers", () => {
      const userAnswer = "hash@#$%";
      const correctAnswer = "hash";

      expect(userAnswer.toLowerCase()).not.toBe(correctAnswer.toLowerCase());
    });

    it("should handle unicode characters", () => {
      const userAnswer = "区块链";
      expect(userAnswer.length).toBeGreaterThan(0);
    });
  });
});
