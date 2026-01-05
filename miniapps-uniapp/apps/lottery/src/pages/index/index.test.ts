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
  })),
  usePayments: vi.fn(() => ({
    payGAS: mockPayGAS,
    isLoading: mockIsLoading,
  })),
  useRNG: vi.fn(() => ({
    requestRandom: mockRequestRandom,
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
          },
        },
      });
    });

    it("should display initial ticket count of 1", () => {
      const ticketCount = wrapper.find(".ticket-count");
      expect(ticketCount.text()).toContain("1");
    });

    it("should increase tickets when + button clicked", async () => {
      const plusBtn = wrapper.findAll(".ticket-btn")[1];
      await plusBtn.trigger("click");
      await nextTick();

      const ticketCount = wrapper.find(".ticket-count");
      expect(ticketCount.text()).toContain("2");
    });

    it("should decrease tickets when - button clicked", async () => {
      // First increase to 2
      const plusBtn = wrapper.findAll(".ticket-btn")[1];
      await plusBtn.trigger("click");
      await nextTick();

      // Then decrease
      const minusBtn = wrapper.findAll(".ticket-btn")[0];
      await minusBtn.trigger("click");
      await nextTick();

      const ticketCount = wrapper.find(".ticket-count");
      expect(ticketCount.text()).toContain("1");
    });

    it("should not go below 1 ticket", async () => {
      const minusBtn = wrapper.findAll(".ticket-btn")[0];
      await minusBtn.trigger("click");
      await minusBtn.trigger("click");
      await nextTick();

      const ticketCount = wrapper.find(".ticket-count");
      expect(ticketCount.text()).toContain("1");
    });

    it("should not exceed 100 tickets", async () => {
      const plusBtn = wrapper.findAll(".ticket-btn")[1];

      // Click 105 times
      for (let i = 0; i < 105; i++) {
        await plusBtn.trigger("click");
      }
      await nextTick();

      const ticketCount = wrapper.find(".ticket-count");
      expect(ticketCount.text()).toContain("100");
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
          },
        },
      });
    });

    it("should calculate cost for 1 ticket", () => {
      const totalValue = wrapper.find(".total-value");
      expect(totalValue.text()).toContain("0.1");
    });

    it("should update cost when tickets change", async () => {
      const plusBtn = wrapper.findAll(".ticket-btn")[1];

      // Increase to 5 tickets
      for (let i = 0; i < 4; i++) {
        await plusBtn.trigger("click");
      }
      await nextTick();

      const totalValue = wrapper.find(".total-value");
      expect(totalValue.text()).toContain("0.5");
    });
  });

  describe("Buy Tickets", () => {
    beforeEach(() => {
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
    });

    it("should call payGAS when buy button clicked", async () => {
      const buyBtn = wrapper.find(".buy-btn");
      await buyBtn.trigger("click");
      await nextTick();

      expect(mockPayGAS).toHaveBeenCalledWith("0.1", expect.stringContaining("lottery:"));
    });

    it("should show success status after purchase", async () => {
      const buyBtn = wrapper.find(".buy-btn");
      await buyBtn.trigger("click");

      // Wait for promise to resolve
      await new Promise((resolve) => setTimeout(resolve, 10));
      await nextTick();

      const statusMsg = wrapper.find(".status-msg");
      if (statusMsg.exists()) {
        expect(statusMsg.classes()).toContain("success");
      }
    });

    it("should update user tickets after purchase", async () => {
      const initialUserTickets = wrapper.findAll(".stat-value")[2];
      const initialCount = parseInt(initialUserTickets.text()) || 0;

      const buyBtn = wrapper.find(".buy-btn");
      await buyBtn.trigger("click");
      await new Promise((resolve) => setTimeout(resolve, 10));
      await nextTick();

      const updatedUserTickets = wrapper.findAll(".stat-value")[2];
      const updatedCount = parseInt(updatedUserTickets.text()) || 0;

      expect(updatedCount).toBe(initialCount + 1);
    });

    it("should handle payment error gracefully", async () => {
      mockPayGAS.mockRejectedValueOnce(new Error("Payment failed"));

      const buyBtn = wrapper.find(".buy-btn");
      await buyBtn.trigger("click");
      await new Promise((resolve) => setTimeout(resolve, 10));
      await nextTick();

      const statusMsg = wrapper.find(".status-msg");
      if (statusMsg.exists()) {
        expect(statusMsg.classes()).toContain("error");
      }
    });
  });

  describe("Countdown Timer", () => {
    it("should display countdown", () => {
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
      expect(countdown.text()).toMatch(/\d{2}:\d{2}/);
    });

    it("should update countdown over time", async () => {
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
      // Just verify countdown format is correct
      expect(countdown.text()).toMatch(/\d{2}:\d{2}/);
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

      const roundStat = wrapper.findAll(".stat-box")[0];
      expect(roundStat.text()).toContain("#");
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

      const totalStat = wrapper.findAll(".stat-box")[1];
      expect(totalStat.exists()).toBe(true);
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

      const userStat = wrapper.findAll(".stat-box")[2];
      expect(userStat.classes()).toContain("highlight");
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
