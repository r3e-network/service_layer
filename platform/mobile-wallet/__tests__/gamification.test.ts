/**
 * Gamification Tests
 * Tests for src/lib/gamification.ts
 */

import * as SecureStore from "expo-secure-store";
import {
  loadGamificationData,
  saveGamificationData,
  addXP,
  unlockAchievement,
  calcLevel,
  getXPForNextLevel,
  getAchievementIcon,
} from "../src/lib/gamification";

jest.mock("expo-secure-store");

const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

describe("gamification", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("loadGamificationData", () => {
    it("should return defaults when no data", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      const data = await loadGamificationData();
      expect(data.xp).toBe(0);
      expect(data.level).toBe(1);
    });
  });

  describe("saveGamificationData", () => {
    it("should save data", async () => {
      const data = { xp: 100, level: 1, achievements: [], streak: 0, lastActive: 0 };
      await saveGamificationData(data);
      expect(mockSecureStore.setItemAsync).toHaveBeenCalled();
    });
  });

  describe("addXP", () => {
    it("should add XP and update level", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(
        JSON.stringify({
          xp: 400,
          level: 1,
          achievements: [],
          streak: 0,
          lastActive: 0,
        }),
      );
      const result = await addXP(200);
      expect(result.xp).toBe(600);
      expect(result.level).toBe(2);
    });
  });

  describe("unlockAchievement", () => {
    it("should unlock achievement and add XP", async () => {
      const data = {
        xp: 0,
        level: 1,
        streak: 0,
        lastActive: 0,
        achievements: [{ id: "test", xp: 50, unlocked: false }],
      };
      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify(data));
      const result = await unlockAchievement("test");
      expect(result).toBe(true);
    });

    it("should return false if already unlocked", async () => {
      const data = {
        xp: 50,
        level: 1,
        streak: 0,
        lastActive: 0,
        achievements: [{ id: "test", xp: 50, unlocked: true }],
      };
      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify(data));
      const result = await unlockAchievement("test");
      expect(result).toBe(false);
    });
  });

  describe("calcLevel", () => {
    it("should calculate level from XP", () => {
      expect(calcLevel(0)).toBe(1);
      expect(calcLevel(499)).toBe(1);
      expect(calcLevel(500)).toBe(2);
      expect(calcLevel(1000)).toBe(3);
    });
  });

  describe("getXPForNextLevel", () => {
    it("should return XP needed", () => {
      expect(getXPForNextLevel(1)).toBe(500);
      expect(getXPForNextLevel(2)).toBe(1000);
    });
  });

  describe("getAchievementIcon", () => {
    it("should return correct icons", () => {
      expect(getAchievementIcon("transaction")).toBe("swap-horizontal");
      expect(getAchievementIcon("staking")).toBe("layers");
    });
  });
});
