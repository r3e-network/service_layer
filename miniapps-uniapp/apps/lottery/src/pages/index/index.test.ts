/**
 * Lottery MiniApp - Component Tests
 * Tests Vue component mounting, rendering, and user interactions
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount, VueWrapper } from "@vue/test-utils";
import { ref, nextTick } from "vue";
import IndexPage from "./index.vue";

// Mock shared components
vi.mock("@/shared/components/AppLayout.vue", () => ({
  default: {
    name: "AppLayout",
    template: '<div class="app-layout"><slot /></div>',
    props: ["title", "showTopNav", "tabs", "activeTab"],
  },
}));

vi.mock("@/shared/components/NeoDoc.vue", () => ({
  default: {
    name: "NeoDoc",
    template: '<div class="neo-doc">Documentation</div>',
    props: ["title", "subtitle", "description", "steps", "features"],
  },
}));

// SDK mock state for testing
const mockPayGAS = vi.fn().mockResolvedValue({ success: true, request_id: "test-123" });
const mockIsLoading = ref(false);
const mockRequestRandom = vi.fn().mockResolvedValue("0xabcdef1234567890");

vi.mock("@neo/uniapp-sdk", () => ({
  useWallet: vi.fn(() => ({
    address: ref("NXV7ZhHiyM1aHXwpVsRZC6BN3y4gABn6"),
    isConnected: ref(true),
    connect: vi.fn().mockResolvedValue(undefined),
    invokeRead: vi.fn().mockResolvedValue({ result: "0" }),
    invokeContract: vi.fn().mockResolvedValue({ txid: "test-tx" }),
    getContractHash: vi.fn().mockReturnValue("0x1234567890abcdef"),
  })),
  usePayments: vi.fn(() => ({
    payGAS: mockPayGAS,
    isLoading: mockIsLoading,
  })),
  useRNG: vi.fn(() => ({
    requestRandom: mockRequestRandom,
  })),
  useEvents: vi.fn(() => ({
    list: vi.fn().mockResolvedValue([]),
  })),
  waitForSDK: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/shared/utils/i18n", () => ({
  createT: () => (key: string) => key,
}));

vi.mock("@/shared/utils/format", () => ({
  formatNumber: (n: number, d = 2) => n.toFixed(d),
  hexToBytes: () => new Uint8Array(8),
  randomIntFromBytes: () => 42,
}));

describe("Lottery MiniApp", () => {
  let wrapper: VueWrapper<any>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockIsLoading.value = false;
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  describe("Component Mounting", () => {
    it("should mount successfully", () => {
      wrapper = mount(IndexPage, {
        global: {
          stubs: {
            AppLayout: {
              template: '<div class="app-layout"><slot /></div>',
              props: ["title", "showTopNav", "tabs", "activeTab"],
            },
            NeoDoc: true,
          },
        },
      });
      expect(wrapper.exists()).toBe(true);
    });

    it("should render game tab by default", () => {
      wrapper = mount(IndexPage, {
        global: {
          stubs: {
            AppLayout: {
              template: '<div class="app-layout"><slot /></div>',
            },
            NeoDoc: true,
          },
        },
      });
      expect(wrapper.find(".game-layout").exists()).toBe(true);
    });
  });

  describe("Ticket Management", () => {
    beforeEach(() => {
      wrapper = mount(IndexPage, {
        global: {
          stubs: {
            AppLayout: {
              template: '<div class="app-layout"><slot /></div>',
            },
            NeoDoc: true,
            NeoCard: {
              template: '<div class="neo-card"><slot /></div>',
              props: ["title", "variant"],
            },
            NeoButton: {
              template: '<button class="neo-button" @click="$emit(\'click\')"><slot /></button>',
              props: ["variant", "size", "block", "loading"],
            },
            AppIcon: true,
          },
        },
      });
    });

    it("should display ticket count", () => {
      const ticketCount = wrapper.find(".ticket-count");
      expect(ticketCount.exists()).toBe(true);
    });

    it("should have adjustment buttons", () => {
      const buttons = wrapper.findAll(".neo-button");
      expect(buttons.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Total Cost Calculation", () => {
    beforeEach(() => {
      wrapper = mount(IndexPage, {
        global: {
          stubs: {
            AppLayout: {
              template: '<div class="app-layout"><slot /></div>',
            },
            NeoDoc: true,
            NeoCard: {
              template: '<div class="neo-card"><slot /></div>',
              props: ["title", "variant"],
            },
            NeoButton: {
              template: '<button class="neo-button" @click="$emit(\'click\')"><slot /></button>',
              props: ["variant", "size", "block", "loading"],
            },
            AppIcon: true,
          },
        },
      });
    });

    it("should display total cost", () => {
      const totalValue = wrapper.find(".total-value");
      expect(totalValue.exists()).toBe(true);
    });

    it("should show GAS currency in total", () => {
      const totalValue = wrapper.find(".total-value");
      expect(totalValue.text()).toContain("GAS");
    });
  });

  describe("Buy Tickets", () => {
    beforeEach(() => {
      mockPayGAS.mockResolvedValue({ success: true, request_id: "test-123", receipt_id: "receipt-123" });
      wrapper = mount(IndexPage, {
        global: {
          stubs: {
            AppLayout: {
              template: '<div class="app-layout"><slot /></div>',
            },
            NeoDoc: true,
            NeoCard: {
              template: '<div class="neo-card"><slot /></div>',
              props: ["title", "variant"],
            },
            NeoButton: {
              template: '<button class="neo-button" @click="$emit(\'click\')"><slot /></button>',
              props: ["variant", "size", "block", "loading"],
            },
          },
        },
      });
    });

    it("should render buy button", () => {
      const buyBtn = wrapper.find(".neo-button");
      expect(buyBtn.exists()).toBe(true);
    });

    it("should be clickable", async () => {
      const buyBtn = wrapper.find(".neo-button");
      // Just verify button can be clicked without throwing
      await expect(buyBtn.trigger("click")).resolves.not.toThrow();
    });
  });

  describe("Countdown Timer", () => {
    it("should display countdown status", () => {
      wrapper = mount(IndexPage, {
        global: {
          stubs: {
            AppLayout: {
              template: '<div class="app-layout"><slot /></div>',
            },
            NeoDoc: true,
          },
        },
      });

      const countdown = wrapper.find(".countdown-time");
      expect(countdown.exists()).toBe(true);
      // countdownLabel shows "open" or "drawing" status
      expect(["open", "drawing"]).toContain(countdown.text());
    });

    it("should have countdown label element", () => {
      wrapper = mount(IndexPage, {
        global: {
          stubs: {
            AppLayout: {
              template: '<div class="app-layout"><slot /></div>',
            },
            NeoDoc: true,
          },
        },
      });

      const countdownLabel = wrapper.find(".countdown-label");
      expect(countdownLabel.exists()).toBe(true);
    });
  });

  describe("Lottery Balls Display", () => {
    it("should display 5 lottery balls", () => {
      wrapper = mount(IndexPage, {
        global: {
          stubs: {
            AppLayout: {
              template: '<div class="app-layout"><slot /></div>',
            },
            NeoDoc: true,
          },
        },
      });

      const balls = wrapper.findAll(".lottery-ball");
      expect(balls.length).toBe(5);
    });

    it("should display numbers on balls", () => {
      wrapper = mount(IndexPage, {
        global: {
          stubs: {
            AppLayout: {
              template: '<div class="app-layout"><slot /></div>',
            },
            NeoDoc: true,
          },
        },
      });

      const ballNumbers = wrapper.findAll(".ball-number");
      expect(ballNumbers.length).toBe(5);
      ballNumbers.forEach((ball) => {
        const num = parseInt(ball.text());
        expect(num).toBeGreaterThanOrEqual(1);
        expect(num).toBeLessThanOrEqual(90);
      });
    });
  });

  describe("Stats Display", () => {
    it("should display round number", () => {
      wrapper = mount(IndexPage, {
        global: {
          stubs: {
            AppLayout: {
              template: '<div class="app-layout"><slot /></div>',
            },
            NeoDoc: true,
          },
        },
      });

      const statValues = wrapper.findAll(".stat-value");
      expect(statValues.length).toBeGreaterThanOrEqual(3);
      // First stat is round number with # prefix
      expect(statValues[0].text()).toContain("#");
    });

    it("should display total tickets", () => {
      wrapper = mount(IndexPage, {
        global: {
          stubs: {
            AppLayout: {
              template: '<div class="app-layout"><slot /></div>',
            },
            NeoDoc: true,
          },
        },
      });

      const statBoxes = wrapper.findAll(".stat-box");
      expect(statBoxes.length).toBeGreaterThanOrEqual(2);
    });

    it("should display user tickets with highlight", () => {
      wrapper = mount(IndexPage, {
        global: {
          stubs: {
            AppLayout: {
              template: '<div class="app-layout"><slot /></div>',
            },
            NeoDoc: true,
          },
        },
      });

      const highlightStat = wrapper.find(".stat-box.highlight");
      expect(highlightStat.exists()).toBe(true);
    });
  });

  describe("Prize Pool Display", () => {
    it("should display prize pool amount", () => {
      wrapper = mount(IndexPage, {
        global: {
          stubs: {
            AppLayout: {
              template: '<div class="app-layout"><slot /></div>',
            },
            NeoDoc: true,
          },
        },
      });

      const prizeAmount = wrapper.find(".prize-amount");
      expect(prizeAmount.exists()).toBe(true);
    });

    it("should display GAS currency label", () => {
      wrapper = mount(IndexPage, {
        global: {
          stubs: {
            AppLayout: {
              template: '<div class="app-layout"><slot /></div>',
            },
            NeoDoc: true,
          },
        },
      });

      const currency = wrapper.find(".prize-currency");
      expect(currency.text()).toBe("GAS");
    });
  });

  describe("Component Cleanup", () => {
    it("should clear timer on unmount", () => {
      const clearIntervalSpy = vi.spyOn(global, "clearInterval");

      wrapper = mount(IndexPage, {
        global: {
          stubs: {
            AppLayout: {
              template: '<div class="app-layout"><slot /></div>',
            },
            NeoDoc: true,
          },
        },
      });

      wrapper.unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });
});
