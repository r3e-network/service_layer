/**
 * Vitest Setup File
 * Global mocks for MiniApp component testing
 */
import { vi } from "vitest";
import { ref, computed } from "vue";

// Mock @neo/uniapp-sdk
vi.mock("@neo/uniapp-sdk", () => ({
  useWallet: vi.fn(() => ({
    address: ref("NXV7ZhHiyM1aHXwpVsRZC6BN3y4gABn6"),
    isConnected: ref(true),
    isLoading: ref(false),
    error: ref(null),
    showConnectionPrompt: ref(false),
    connectionPromptMessage: ref(null),
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn(),
    requireConnection: vi.fn(() => true),
    closeConnectionPrompt: vi.fn(),
    clearError: vi.fn(),
  })),
  usePayments: vi.fn((appId: string) => ({
    payGAS: vi.fn().mockResolvedValue({ success: true, request_id: "test-123" }),
    isLoading: ref(false),
  })),
  useRNG: vi.fn((appId: string) => ({
    requestRandom: vi.fn().mockResolvedValue("0x1234567890abcdef"),
  })),
  waitForSDK: vi.fn().mockResolvedValue(null),
}));

// Mock i18n
vi.mock("@/shared/utils/i18n", () => ({
  createT: vi.fn(() => (key: string) => key),
}));

// Mock format utils
vi.mock("@/shared/utils/format", () => ({
  formatNumber: vi.fn((n: number, d = 2) => n.toFixed(d)),
  hexToBytes: vi.fn((hex: string) => new Uint8Array(0)),
  randomIntFromBytes: vi.fn(() => 42),
}));

// Mock theme utils
vi.mock("@/shared/utils/theme", () => ({
  getTheme: vi.fn(() => "dark"),
  setTheme: vi.fn(),
}));
