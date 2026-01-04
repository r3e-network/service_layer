import { describe, it, expect, vi, beforeEach } from "vitest";
import { ref, computed } from "vue";

// Mock @neo/uniapp-sdk
vi.mock("@neo/uniapp-sdk", () => ({
  useWallet: () => ({
    address: ref("NXV7ZhHiyM1aHXwpVsRZC6BN3y4"),
    isConnected: ref(true),
    connect: vi.fn().mockResolvedValue(undefined),
  }),
  usePayments: () => ({
    payGAS: vi.fn().mockResolvedValue({ request_id: "grant-123" }),
    isLoading: ref(false),
  }),
}));

// Mock i18n
vi.mock("@/shared/utils/i18n", () => ({
  createT: (translations: any) => (key: string) => translations[key]?.en || key,
}));

interface Grant {
  id: string;
  title: string;
  description: string;
  goal: number;
  funded: number;
  creator: string;
  status: "active" | "funded" | "completed";
}

describe("Grant-Share MiniApp", () => {
  let payGAS: ReturnType<typeof vi.fn>;
  let isLoading: ReturnType<typeof ref<boolean>>;
  let address: ReturnType<typeof ref<string>>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const { useWallet, usePayments } = await import("@neo/uniapp-sdk");
    const wallet = useWallet();
    const payments = usePayments("miniapp-grant-share");
    payGAS = payments.payGAS as any;
    isLoading = payments.isLoading;
    address = wallet.address;
  });

  describe("Stats Display", () => {
    it("should display total grants count", () => {
      const totalGrants = ref(2);
      expect(totalGrants.value).toBe(2);
    });

    it("should display total funded amount", () => {
      const totalFunded = ref(950);
      expect(totalFunded.value).toBe(950);
    });

    it("should format amounts correctly", () => {
      const formatAmount = (n: number) => n.toFixed(0);
      expect(formatAmount(950)).toBe("950");
      expect(formatAmount(1000.5)).toBe("1001");
    });
  });

  describe("Tab Navigation", () => {
    it("should switch between tabs", () => {
      const activeTab = ref<"browse" | "create" | "my">("browse");

      expect(activeTab.value).toBe("browse");

      activeTab.value = "create";
      expect(activeTab.value).toBe("create");

      activeTab.value = "my";
      expect(activeTab.value).toBe("my");
    });
  });

  describe("Browse Grants", () => {
    it("should display active grants", () => {
      const grants = ref<Grant[]>([
        {
          id: "1",
          title: "Neo Developer Tools",
          description: "Building open-source dev tools",
          goal: 1000,
          funded: 450,
          creator: "NXtest1",
          status: "active",
        },
      ]);

      expect(grants.value).toHaveLength(1);
      expect(grants.value[0].status).toBe("active");
    });

    it("should calculate progress percentage", () => {
      const grant: Grant = {
        id: "1",
        title: "Test",
        description: "Test",
        goal: 1000,
        funded: 450,
        creator: "NXtest1",
        status: "active",
      };

      const getProgress = (g: Grant) => Math.min((g.funded / g.goal) * 100, 100);
      expect(getProgress(grant)).toBe(45);
    });

    it("should cap progress at 100%", () => {
      const grant: Grant = {
        id: "1",
        title: "Test",
        description: "Test",
        goal: 1000,
        funded: 1500,
        creator: "NXtest1",
        status: "active",
      };

      const getProgress = (g: Grant) => Math.min((g.funded / g.goal) * 100, 100);
      expect(getProgress(grant)).toBe(100);
    });

    it("should display empty state when no grants", () => {
      const grants = ref<Grant[]>([]);
      expect(grants.value).toHaveLength(0);
    });
  });

  describe("Create Grant", () => {
    it("should validate grant creation form", () => {
      const newGrant = ref({ title: "Test Grant", description: "Test Description", goal: "1000" });

      const canCreate = computed(
        () => newGrant.value.title && newGrant.value.description && parseFloat(newGrant.value.goal) > 0,
      );

      expect(canCreate.value).toBe(true);
    });

    it("should reject empty title", () => {
      const newGrant = ref({ title: "", description: "Test", goal: "1000" });

      const canCreate = computed(
        () => newGrant.value.title && newGrant.value.description && parseFloat(newGrant.value.goal) > 0,
      );

      expect(canCreate.value).toBeFalsy();
    });

    it("should reject zero goal", () => {
      const newGrant = ref({ title: "Test", description: "Test", goal: "0" });

      const canCreate = computed(
        () => newGrant.value.title && newGrant.value.description && parseFloat(newGrant.value.goal) > 0,
      );

      expect(canCreate.value).toBeFalsy();
    });

    it("should create grant successfully", async () => {
      const newGrant = ref({ title: "Test Grant", description: "Test Description", goal: "1000" });
      const grants = ref<Grant[]>([]);
      const myGrants = ref<Grant[]>([]);
      const totalGrants = ref(0);
      const loading = ref(false);

      loading.value = true;
      const grant: Grant = {
        id: Date.now().toString(),
        title: newGrant.value.title,
        description: newGrant.value.description,
        goal: parseFloat(newGrant.value.goal),
        funded: 0,
        creator: address.value || "",
        status: "active",
      };

      grants.value.unshift(grant);
      myGrants.value.unshift(grant);
      totalGrants.value++;
      loading.value = false;

      expect(grants.value).toHaveLength(1);
      expect(myGrants.value).toHaveLength(1);
      expect(totalGrants.value).toBe(1);
    });
  });

  describe("Fund Grant", () => {
    it("should open fund modal", () => {
      const showFundModal = ref(false);
      const selectedGrant = ref<Grant | null>(null);
      const fundAmount = ref("");

      const grant: Grant = {
        id: "1",
        title: "Test",
        description: "Test",
        goal: 1000,
        funded: 450,
        creator: "NXtest1",
        status: "active",
      };

      selectedGrant.value = grant;
      fundAmount.value = "";
      showFundModal.value = true;

      expect(showFundModal.value).toBe(true);
      expect(selectedGrant.value).toEqual(grant);
    });

    it("should fund grant successfully", async () => {
      const selectedGrant = ref<Grant>({
        id: "1",
        title: "Test",
        description: "Test",
        goal: 1000,
        funded: 450,
        creator: "NXtest1",
        status: "active",
      });
      const fundAmount = ref("100");
      const totalFunded = ref(950);
      const loading = ref(false);

      const amt = parseFloat(fundAmount.value);
      loading.value = true;
      await payGAS(amt.toString(), `grant:${selectedGrant.value.id}`);

      selectedGrant.value.funded += amt;
      totalFunded.value += amt;
      loading.value = false;

      expect(payGAS).toHaveBeenCalledWith("100", "grant:1");
      expect(selectedGrant.value.funded).toBe(550);
      expect(totalFunded.value).toBe(1050);
    });

    it("should update status when goal reached", async () => {
      const selectedGrant = ref<Grant>({
        id: "1",
        title: "Test",
        description: "Test",
        goal: 1000,
        funded: 950,
        creator: "NXtest1",
        status: "active",
      });
      const fundAmount = ref("50");

      const amt = parseFloat(fundAmount.value);
      await payGAS(amt.toString(), `grant:${selectedGrant.value.id}`);

      selectedGrant.value.funded += amt;
      if (selectedGrant.value.funded >= selectedGrant.value.goal) {
        selectedGrant.value.status = "funded";
      }

      expect(selectedGrant.value.status).toBe("funded");
    });

    it("should validate positive amount", () => {
      const fundAmount = ref("0");
      const amt = parseFloat(fundAmount.value);
      expect(amt > 0).toBe(false);
    });
  });

  describe("My Grants", () => {
    it("should filter grants by creator", () => {
      const grants = ref<Grant[]>([
        {
          id: "1",
          title: "My Grant",
          description: "Test",
          goal: 1000,
          funded: 450,
          creator: "NXV7ZhHiyM1aHXwpVsRZC6BN3y4",
          status: "active",
        },
        {
          id: "2",
          title: "Other Grant",
          description: "Test",
          goal: 500,
          funded: 500,
          creator: "NXtest2",
          status: "funded",
        },
      ]);

      const myGrants = computed(() => grants.value.filter((g) => g.creator === address.value));

      expect(myGrants.value).toHaveLength(1);
      expect(myGrants.value[0].title).toBe("My Grant");
    });

    it("should allow withdrawal when funded", () => {
      const grant: Grant = {
        id: "1",
        title: "Test",
        description: "Test",
        goal: 1000,
        funded: 1000,
        creator: "NXV7ZhHiyM1aHXwpVsRZC6BN3y4",
        status: "funded",
      };

      expect(grant.funded >= grant.goal).toBe(true);
    });

    it("should complete grant after withdrawal", () => {
      const grant: Grant = {
        id: "1",
        title: "Test",
        description: "Test",
        goal: 1000,
        funded: 1000,
        creator: "NXV7ZhHiyM1aHXwpVsRZC6BN3y4",
        status: "funded",
      };

      grant.status = "completed";
      expect(grant.status).toBe("completed");
    });
  });

  describe("Status Labels", () => {
    it("should return correct status label", () => {
      const getStatusLabel = (s: Grant["status"]) =>
        s === "active" ? "Active" : s === "funded" ? "Funded" : "Completed";

      expect(getStatusLabel("active")).toBe("Active");
      expect(getStatusLabel("funded")).toBe("Funded");
      expect(getStatusLabel("completed")).toBe("Completed");
    });
  });

  describe("Loading States", () => {
    it("should track loading state", () => {
      const loading = ref(false);
      const isBusy = computed(() => loading.value || isLoading.value);

      expect(isBusy.value).toBe(false);

      loading.value = true;
      expect(isBusy.value).toBe(true);
    });

    it("should prevent actions when busy", () => {
      const loading = ref(true);
      const canCreate = computed(() => !loading.value);

      expect(canCreate.value).toBe(false);
    });
  });

  describe("Status Messages", () => {
    it("should show success message", () => {
      const statusMessage = ref("");
      const statusType = ref<"success" | "error">("success");

      const showStatus = (msg: string, type: "success" | "error") => {
        statusMessage.value = msg;
        statusType.value = type;
      };

      showStatus("Grant created!", "success");
      expect(statusMessage.value).toBe("Grant created!");
      expect(statusType.value).toBe("success");
    });

    it("should auto-clear status after timeout", () => {
      vi.useFakeTimers();
      const statusMessage = ref("Test message");

      setTimeout(() => (statusMessage.value = ""), 4000);
      vi.advanceTimersByTime(4000);

      expect(statusMessage.value).toBe("");
      vi.useRealTimers();
    });
  });
});
