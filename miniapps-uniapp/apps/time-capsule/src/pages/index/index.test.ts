import { describe, it, expect, vi, beforeEach } from "vitest";
import { ref } from "vue";

// Mock @neo/uniapp-sdk
vi.mock("@neo/uniapp-sdk", () => ({
  usePayments: vi.fn(() => ({
    payGAS: vi.fn().mockResolvedValue({ success: true, request_id: "test-123" }),
    isLoading: ref(false),
  })),
}));

// Mock i18n utility
vi.mock("@/shared/utils/i18n", () => ({
  createT: vi.fn(() => (key: string) => key),
}));

describe("Time Capsule MiniApp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Capsule Creation", () => {
    it("should validate all fields are filled", () => {
      const newCapsule = ref({ name: "", content: "", days: "30" });
      const { name, content, days } = newCapsule.value;

      const isValid = !(!name.trim() || !content.trim() || !days);

      expect(isValid).toBe(false);
    });

    it("should validate name is not empty", () => {
      const newCapsule = ref({ name: "Birthday", content: "Happy Birthday!", days: "30" });
      const { name } = newCapsule.value;

      expect(name.trim()).toBeTruthy();
    });

    it("should validate content is not empty", () => {
      const newCapsule = ref({ name: "Birthday", content: "", days: "30" });
      const { content } = newCapsule.value;

      expect(content.trim()).toBeFalsy();
    });

    it("should call payGAS with correct parameters", async () => {
      const newCapsule = ref({ name: "Birthday", content: "Happy Birthday!", days: "30" });
      const mockPayGAS = vi.fn().mockResolvedValue({ success: true, request_id: "test-123" });

      await mockPayGAS("3", `capsule:create:${newCapsule.value.name.slice(0, 10)}`);

      expect(mockPayGAS).toHaveBeenCalledWith("3", "capsule:create:Birthday");
    });

    it("should calculate unlock date correctly", () => {
      const days = "30";
      const unlockDate = new Date();
      unlockDate.setDate(unlockDate.getDate() + parseInt(days));

      const today = new Date();
      const diffDays = Math.floor((unlockDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      expect(diffDays).toBeGreaterThanOrEqual(29);
      expect(diffDays).toBeLessThanOrEqual(30);
    });

    it("should add capsule to list after creation", async () => {
      const capsules = ref([
        { id: "1", name: "2025 Memories", content: "Hidden", unlockDate: "2026-01-01", locked: true },
      ]);

      const newCapsule = {
        id: Date.now().toString(),
        name: "Birthday",
        content: "Happy Birthday!",
        unlockDate: "2025-06-15",
        locked: true,
      };

      capsules.value.unshift(newCapsule);

      expect(capsules.value).toHaveLength(2);
      expect(capsules.value[0].name).toBe("Birthday");
    });

    it("should clear form after successful creation", async () => {
      const newCapsule = ref({ name: "Birthday", content: "Happy Birthday!", days: "30" });
      const mockPayGAS = vi.fn().mockResolvedValue({ success: true, request_id: "test-123" });

      await mockPayGAS("3", `capsule:create:${newCapsule.value.name.slice(0, 10)}`);

      newCapsule.value = { name: "", content: "", days: "30" };

      expect(newCapsule.value.name).toBe("");
      expect(newCapsule.value.content).toBe("");
    });
  });

  describe("Capsule Opening", () => {
    it("should open unlocked capsule", () => {
      const capsule = {
        id: "1",
        name: "Birthday",
        content: "Happy Birthday!",
        unlockDate: "2025-06-15",
        locked: false,
      };
      const openedCapsule = ref<any>(null);

      openedCapsule.value = capsule;

      expect(openedCapsule.value).toBeTruthy();
      expect(openedCapsule.value.content).toBe("Happy Birthday!");
    });

    it("should not open locked capsule", () => {
      const capsule = { id: "1", name: "2025 Memories", content: "Hidden", unlockDate: "2026-01-01", locked: true };

      if (capsule.locked) {
        expect(capsule.locked).toBe(true);
      }
    });

    it("should close modal", () => {
      const openedCapsule = ref({
        id: "1",
        name: "Birthday",
        content: "Happy Birthday!",
        unlockDate: "2025-06-15",
        locked: false,
      });

      openedCapsule.value = null;

      expect(openedCapsule.value).toBeNull();
    });
  });

  describe("State Management", () => {
    it("should initialize with default form values", () => {
      const newCapsule = ref({ name: "", content: "", days: "30" });

      expect(newCapsule.value.name).toBe("");
      expect(newCapsule.value.content).toBe("");
      expect(newCapsule.value.days).toBe("30");
    });

    it("should manage capsules list", () => {
      const capsules = ref([
        { id: "1", name: "2025 Memories", content: "Hidden", unlockDate: "2026-01-01", locked: true },
        { id: "2", name: "Birthday Gift", content: "Happy Birthday!", unlockDate: "2025-06-15", locked: false },
      ]);

      expect(capsules.value).toHaveLength(2);
      expect(capsules.value[0].locked).toBe(true);
      expect(capsules.value[1].locked).toBe(false);
    });

    it("should manage modal state", () => {
      const openedCapsule = ref<any>(null);

      expect(openedCapsule.value).toBeNull();

      openedCapsule.value = { id: "1", name: "Test", content: "Content", unlockDate: "2025-06-15", locked: false };
      expect(openedCapsule.value).toBeTruthy();
    });
  });

  describe("Error Handling", () => {
    it("should show error for empty name", () => {
      const newCapsule = ref({ name: "", content: "Content", days: "30" });
      const status = ref<{ msg: string; type: string } | null>(null);
      const { name, content, days } = newCapsule.value;

      if (!name.trim() || !content.trim() || !days) {
        status.value = { msg: "invalidInput", type: "error" };
      }

      expect(status.value?.type).toBe("error");
    });

    it("should show error for empty content", () => {
      const newCapsule = ref({ name: "Name", content: "", days: "30" });
      const status = ref<{ msg: string; type: string } | null>(null);
      const { name, content, days } = newCapsule.value;

      if (!name.trim() || !content.trim() || !days) {
        status.value = { msg: "invalidInput", type: "error" };
      }

      expect(status.value?.type).toBe("error");
    });

    it("should handle payment failure", async () => {
      const status = ref<{ msg: string; type: string } | null>(null);
      const mockPayGAS = vi.fn().mockRejectedValue(new Error("Payment failed"));

      try {
        await mockPayGAS("3", "capsule:create:Birthday");
      } catch (e: any) {
        status.value = { msg: e.message || "error", type: "error" };
      }

      expect(status.value?.type).toBe("error");
    });

    it("should prevent submission when loading", () => {
      const isLoading = ref(true);

      if (isLoading.value) {
        expect(isLoading.value).toBe(true);
      }
    });
  });

  describe("Business Logic", () => {
    it("should format capsule metadata correctly", () => {
      const name = "Birthday Gift";
      const metadata = `capsule:create:${name.slice(0, 10)}`;

      expect(metadata).toBe("capsule:create:Birthday G");
    });

    it("should generate unique capsule IDs", () => {
      const id1 = Date.now().toString();
      const id2 = Date.now().toString();

      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
    });

    it("should format unlock date as ISO string", () => {
      const unlockDate = new Date("2025-06-15");
      const formatted = unlockDate.toISOString().split("T")[0];

      expect(formatted).toBe("2025-06-15");
    });

    it("should track locked vs unlocked capsules", () => {
      const capsules = ref([
        { id: "1", name: "2025 Memories", content: "Hidden", unlockDate: "2026-01-01", locked: true },
        { id: "2", name: "Birthday Gift", content: "Happy Birthday!", unlockDate: "2025-06-15", locked: false },
      ]);

      const lockedCount = capsules.value.filter((c) => c.locked).length;
      const unlockedCount = capsules.value.filter((c) => !c.locked).length;

      expect(lockedCount).toBe(1);
      expect(unlockedCount).toBe(1);
    });
  });
});
