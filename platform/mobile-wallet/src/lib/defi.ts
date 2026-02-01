/**
 * DeFi Dashboard
 * DeFi protocol tracking and management
 */

import * as SecureStore from "expo-secure-store";

const DEFI_KEY = "defi_positions";

export type ProtocolType = "lending" | "dex" | "yield" | "staking";

export interface DeFiPosition {
  id: string;
  protocol: string;
  type: ProtocolType;
  asset: string;
  amount: string;
  value: number;
  apy: number;
}

/**
 * Load DeFi positions
 */
export async function loadPositions(): Promise<DeFiPosition[]> {
  const data = await SecureStore.getItemAsync(DEFI_KEY);
  return data ? JSON.parse(data) : [];
}

/**
 * Save position
 */
export async function savePosition(pos: DeFiPosition): Promise<void> {
  const positions = await loadPositions();
  positions.push(pos);
  await SecureStore.setItemAsync(DEFI_KEY, JSON.stringify(positions));
}

/**
 * Calculate total value
 */
export function calcTotalDeFiValue(positions: DeFiPosition[]): number {
  return positions.reduce((sum, p) => sum + p.value, 0);
}

/**
 * Get protocol icon
 */
export function getProtocolIcon(type: ProtocolType): string {
  const icons: Record<ProtocolType, string> = {
    lending: "cash",
    dex: "swap-horizontal",
    yield: "trending-up",
    staking: "layers",
  };
  return icons[type];
}
