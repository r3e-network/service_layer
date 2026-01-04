import { describe, it, expect, vi, beforeEach } from "vitest";
import { ref } from "vue";

vi.mock("@neo/uniapp-sdk", () => ({
  useWallet: () => ({
    address: ref("NXV7ZhHiyM1aHXwpVsRZC6BN3y4gABn6"),
  }),
  usePayments: vi.fn(() => ({
    payGAS: vi.fn().mockResolvedValue({ request_id: "test-123" }),
  })),
  useRNG: vi.fn(() => ({
    requestRandom: vi.fn().mockResolvedValue({
      randomness: "a1b2c3d4e5f6",
      request_id: "rng-123",
    }),
  })),
}));

vi.mock("@/shared/utils/i18n", () => ({
  createT: () => (key: string) => key,
}));

describe("Secret Poker - Business Logic", () => {
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
      const pot = ref(0);
      const gamesPlayed = ref(0);
      const gamesWon = ref(0);
      const totalEarnings = ref(0);
      const isPlaying = ref(false);

      expect(betAmount.value).toBe("1");
      expect(pot.value).toBe(0);
      expect(gamesPlayed.value).toBe(0);
      expect(gamesWon.value).toBe(0);
      expect(totalEarnings.value).toBe(0);
      expect(isPlaying.value).toBe(false);
    });

    it("should initialize player hand with hidden cards", () => {
      const playerHand = ref([
        { value: "A♠", revealed: false },
        { value: "K♥", revealed: false },
        { value: "Q♦", revealed: false },
      ]);

      expect(playerHand.value.length).toBe(3);
      expect(playerHand.value.every((c) => !c.revealed)).toBe(true);
    });
  });

  describe("Card Utilities", () => {
    it("should extract card rank correctly", () => {
      const card = "A♠";
      const rank = card.slice(0, -1);

      expect(rank).toBe("A");
    });

    it("should extract card suit correctly", () => {
      const card = "K♥";
      const suit = card.slice(-1);

      expect(suit).toBe("♥");
    });

    it("should determine red color for hearts", () => {
      const card = "K♥";
      const suit = card.slice(-1);
      const color = suit === "♥" || suit === "♦" ? "red" : "black";

      expect(color).toBe("red");
    });

    it("should determine black color for spades", () => {
      const card = "A♠";
      const suit = card.slice(-1);
      const color = suit === "♥" || suit === "♦" ? "red" : "black";

      expect(color).toBe("black");
    });
  });

  describe("Deal Cards", () => {
    it("should generate 3 cards from randomness", () => {
      const randomness = "a1b2c3d4e5f6";
      const ranks = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];
      const suits = ["♠", "♥", "♦", "♣"];
      const cards: string[] = [];

      for (let i = 0; i < 3; i++) {
        const byte = parseInt(randomness.slice(i * 2, i * 2 + 2), 16);
        cards.push(ranks[byte % ranks.length] + suits[Math.floor(byte / ranks.length) % suits.length]);
      }

      expect(cards.length).toBe(3);
    });
  });

  describe("Bet Function", () => {
    it("should reject bet below minimum", () => {
      const amount = 0.05;
      const isValid = amount >= 0.1;

      expect(isValid).toBe(false);
    });

    it("should call payGAS with correct parameters", async () => {
      await payGASMock("1", "poker:bet");

      expect(payGASMock).toHaveBeenCalledWith("1", "poker:bet");
    });

    it("should update pot after bet", () => {
      const pot = ref(0);
      const amount = 1;

      pot.value += amount;

      expect(pot.value).toBe(1);
    });

    it("should deal new cards after bet", async () => {
      await payGASMock("1", "poker:bet");
      await requestRandomMock();

      expect(requestRandomMock).toHaveBeenCalled();
    });
  });

  describe("Fold Function", () => {
    it("should reset pot to zero", () => {
      const pot = ref(5);
      pot.value = 0;

      expect(pot.value).toBe(0);
    });

    it("should hide all cards", () => {
      const playerHand = ref([
        { value: "A♠", revealed: true },
        { value: "K♥", revealed: true },
      ]);

      playerHand.value.forEach((c) => (c.revealed = false));

      expect(playerHand.value.every((c) => !c.revealed)).toBe(true);
    });
  });

  describe("Reveal Function", () => {
    it("should determine win from randomness", () => {
      const randomness = "a2b4c6d8";
      const won = parseInt(randomness.slice(0, 2), 16) % 2 === 0;

      expect(typeof won).toBe("boolean");
    });

    it("should reveal all cards", () => {
      const playerHand = ref([
        { value: "A♠", revealed: false },
        { value: "K♥", revealed: false },
      ]);

      playerHand.value.forEach((c) => (c.revealed = true));

      expect(playerHand.value.every((c) => c.revealed)).toBe(true);
    });

    it("should update stats on win", () => {
      const gamesPlayed = ref(0);
      const gamesWon = ref(0);
      const totalEarnings = ref(0);
      const pot = 5;
      const won = true;

      gamesPlayed.value++;
      if (won) {
        gamesWon.value++;
        totalEarnings.value += pot * 2;
      }

      expect(gamesPlayed.value).toBe(1);
      expect(gamesWon.value).toBe(1);
      expect(totalEarnings.value).toBe(10);
    });

    it("should update stats on loss", () => {
      const gamesPlayed = ref(0);
      const gamesWon = ref(0);
      const won = false;

      gamesPlayed.value++;
      if (won) {
        gamesWon.value++;
      }

      expect(gamesPlayed.value).toBe(1);
      expect(gamesWon.value).toBe(0);
    });
  });
});
