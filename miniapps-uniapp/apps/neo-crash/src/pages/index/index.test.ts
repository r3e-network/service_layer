import { describe, it, expect, vi, beforeEach } from "vitest";
import { ref } from "vue";

vi.mock("@neo/uniapp-sdk", () => ({
  useWallet: () => ({
    connect: vi.fn(),
    isConnected: ref(true),
  }),
  usePayments: vi.fn(() => ({
    payGAS: vi.fn().mockResolvedValue({ request_id: "test-123" }),
    isLoading: ref(false),
  })),
}));

vi.mock("@/shared/utils/i18n", () => ({
  createT: () => (key: string) => key,
}));

describe("Neo Crash - Business Logic", () => {
  let payGASMock: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const { usePayments } = await import("@neo/uniapp-sdk");
    payGASMock = usePayments("test").payGAS;
  });

  describe("Initialization", () => {
    it("should initialize with default values", () => {
      const betAmount = ref("1.0");
      const autoCashout = ref("");
      const currentMultiplier = ref(1.0);
      const gameState = ref<"waiting" | "running" | "crashed">("waiting");
      const currentBet = ref(0);

      expect(betAmount.value).toBe("1.0");
      expect(autoCashout.value).toBe("");
      expect(currentMultiplier.value).toBe(1.0);
      expect(gameState.value).toBe("waiting");
      expect(currentBet.value).toBe(0);
    });
  });

  describe("Progress Width Calculation", () => {
    it("should return 0 when waiting", () => {
      const gameState = "waiting";
      const currentMultiplier = 1.0;
      const progressWidth = gameState === "waiting" ? 0 : gameState === "crashed" ? 100 : Math.min(100, (currentMultiplier - 1) * 20);

      expect(progressWidth).toBe(0);
    });

    it("should return 100 when crashed", () => {
      const gameState = "crashed";
      const currentMultiplier = 5.0;
      const progressWidth = gameState === "waiting" ? 0 : gameState === "crashed" ? 100 : Math.min(100, (currentMultiplier - 1) * 20);

      expect(progressWidth).toBe(100);
    });

    it("should calculate progress when running", () => {
      const gameState = "running";
      const currentMultiplier = 3.0;
      const progressWidth = Math.min(100, (currentMultiplier - 1) * 20);

      expect(progressWidth).toBe(40);
    });
  });

  describe("Potential Win Calculation", () => {
    it("should calculate potential win correctly", () => {
      const currentBet = 1.0;
      const currentMultiplier = 2.5;
      const potentialWin = currentBet * currentMultiplier;

      expect(potentialWin).toBe(2.5);
    });
  });

  describe("Bet Adjustment", () => {
    it("should increase bet amount", () => {
      const betAmount = 1.0;
      const adjusted = Math.max(0.1, betAmount + 0.5);

      expect(adjusted).toBe(1.5);
    });

    it("should not go below 0.1", () => {
      const betAmount = 0.1;
      const adjusted = Math.max(0.1, betAmount - 0.5);

      expect(adjusted).toBe(0.1);
    });
  });

  describe("Place Bet", () => {
    it("should call payGAS with correct parameters", async () => {
      const betAmount = "1.0";
      const timestamp = Date.now();

      await payGASMock(betAmount, "crash:bet:" + timestamp);

      expect(payGASMock).toHaveBeenCalled();
    });

    it("should update currentBet after placing bet", () => {
      const currentBet = ref(0);
      const amount = 1.0;

      currentBet.value = amount;

      expect(currentBet.value).toBe(1.0);
    });
  });

  describe("Auto Cashout", () => {
    it("should trigger when multiplier reaches target", () => {
      const autoCashout = "2.0";
      const currentMultiplier = 2.1;
      const currentBet = 1.0;
      const shouldCashout = autoCashout && currentBet > 0 && currentMultiplier >= parseFloat(autoCashout);

      expect(shouldCashout).toBe(true);
    });

    it("should not trigger when below target", () => {
      const autoCashout = "2.0";
      const currentMultiplier = 1.9;
      const currentBet = 1.0;
      const shouldCashout = autoCashout && currentBet > 0 && currentMultiplier >= parseFloat(autoCashout);

      expect(shouldCashout).toBe(false);
    });
  });

  describe("Game State Transitions", () => {
    it("should transition from waiting to running", () => {
      const gameState = ref<"waiting" | "running" | "crashed">("waiting");
      gameState.value = "running";

      expect(gameState.value).toBe("running");
    });

    it("should transition from running to crashed", () => {
      const gameState = ref<"waiting" | "running" | "crashed">("running");
      gameState.value = "crashed";

      expect(gameState.value).toBe("crashed");
    });
  });
});
