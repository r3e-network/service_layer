/**
 * Gamification System
 * Achievements, XP, and rewards
 */

import * as SecureStore from "expo-secure-store";

const GAMIFICATION_KEY = "gamification_data";

export type AchievementType = "transaction" | "staking" | "social" | "explorer";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  type: AchievementType;
  xp: number;
  unlocked: boolean;
  unlockedAt?: number;
}

export interface GamificationData {
  xp: number;
  level: number;
  achievements: Achievement[];
  streak: number;
  lastActive: number;
}

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_tx",
    name: "First Steps",
    description: "Send your first transaction",
    type: "transaction",
    xp: 50,
    unlocked: false,
  },
  {
    id: "stake_neo",
    name: "Staker",
    description: "Stake NEO for the first time",
    type: "staking",
    xp: 100,
    unlocked: false,
  },
  {
    id: "claim_gas",
    name: "Gas Collector",
    description: "Claim GAS rewards",
    type: "staking",
    xp: 75,
    unlocked: false,
  },
  {
    id: "ten_tx",
    name: "Active User",
    description: "Complete 10 transactions",
    type: "transaction",
    xp: 150,
    unlocked: false,
  },
  {
    id: "week_streak",
    name: "Dedicated",
    description: "7-day login streak",
    type: "social",
    xp: 200,
    unlocked: false,
  },
];

const DEFAULT_DATA: GamificationData = {
  xp: 0,
  level: 1,
  achievements: DEFAULT_ACHIEVEMENTS,
  streak: 0,
  lastActive: 0,
};

/**
 * Load gamification data
 */
export async function loadGamificationData(): Promise<GamificationData> {
  const data = await SecureStore.getItemAsync(GAMIFICATION_KEY);
  return data ? JSON.parse(data) : DEFAULT_DATA;
}

/**
 * Save gamification data
 */
export async function saveGamificationData(data: GamificationData): Promise<void> {
  await SecureStore.setItemAsync(GAMIFICATION_KEY, JSON.stringify(data));
}

/**
 * Add XP
 */
export async function addXP(amount: number): Promise<GamificationData> {
  const data = await loadGamificationData();
  data.xp += amount;
  data.level = calcLevel(data.xp);
  await saveGamificationData(data);
  return data;
}

/**
 * Unlock achievement
 */
export async function unlockAchievement(id: string): Promise<boolean> {
  const data = await loadGamificationData();
  const achievement = data.achievements.find((a) => a.id === id);
  if (!achievement || achievement.unlocked) return false;
  achievement.unlocked = true;
  achievement.unlockedAt = Date.now();
  data.xp += achievement.xp;
  data.level = calcLevel(data.xp);
  await saveGamificationData(data);
  return true;
}

/**
 * Calculate level from XP
 */
export function calcLevel(xp: number): number {
  return Math.floor(xp / 500) + 1;
}

/**
 * Get XP for next level
 */
export function getXPForNextLevel(level: number): number {
  return level * 500;
}

/**
 * Get achievement icon
 */
export function getAchievementIcon(type: AchievementType): string {
  const icons: Record<AchievementType, string> = {
    transaction: "swap-horizontal",
    staking: "layers",
    social: "people",
    explorer: "compass",
  };
  return icons[type];
}
