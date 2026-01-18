import { ref, computed, onMounted } from "vue";
import { useI18n } from "@/composables/useI18n";
import { formatGas } from "../utils/format";
import { sha256Hex } from "../utils/hash";
import { parseInvokeResult, type ParsedStackValue } from "../utils/neo";

// Turtle colors enum matching contract
export enum TurtleColor {
  Red = 0,
  Orange = 1,
  Yellow = 2,
  Green = 3,
  Blue = 4,
  Purple = 5,
  Pink = 6,
  Gold = 7,
}

// Color display names
export const COLOR_NAMES: Record<TurtleColor, string> = {
  [TurtleColor.Red]: "红龟",
  [TurtleColor.Orange]: "橙龟",
  [TurtleColor.Yellow]: "黄龟",
  [TurtleColor.Green]: "绿龟",
  [TurtleColor.Blue]: "蓝龟",
  [TurtleColor.Purple]: "紫龟",
  [TurtleColor.Pink]: "粉龟",
  [TurtleColor.Gold]: "金龟",
};

// Color CSS classes
export const COLOR_CSS: Record<TurtleColor, string> = {
  [TurtleColor.Red]: "#EF4444",
  [TurtleColor.Orange]: "#F97316",
  [TurtleColor.Yellow]: "#EAB308",
  [TurtleColor.Green]: "#22C55E",
  [TurtleColor.Blue]: "#3B82F6",
  [TurtleColor.Purple]: "#A855F7",
  [TurtleColor.Pink]: "#EC4899",
  [TurtleColor.Gold]: "#FFD700",
};

// Color odds (cumulative, out of 100) - must match contract
const COLOR_ODDS = [20, 40, 58, 73, 85, 93, 98, 100];

// Color rewards in GAS units (1 GAS = 100000000) - must match contract
const COLOR_REWARDS = [
  15000000n,  // Red: 0.15 GAS
  15000000n,  // Orange: 0.15 GAS
  18000000n,  // Yellow: 0.18 GAS
  20000000n,  // Green: 0.20 GAS
  25000000n,  // Blue: 0.25 GAS
  35000000n,  // Purple: 0.35 GAS
  50000000n,  // Pink: 0.50 GAS
  100000000n, // Gold: 1.00 GAS
];

// Turtle interface for local simulation
export interface Turtle {
  id: number;
  color: TurtleColor;
  matched: boolean;
  gridPosition: number;
}

// Game session interface - matches new contract structure
export interface GameSession {
  sessionId: bigint;
  player: string;
  boxCount: bigint;
  seed: string;
  payment: bigint;
  startTime: bigint;
  settled: boolean;
  totalMatches: bigint;
  totalReward: bigint;
  settleTime: bigint;
}

// Platform stats interface
export interface PlatformStats {
  totalSessions: bigint;
  totalBoxes: bigint;
  totalMatches: bigint;
  totalPaid: bigint;
  blindboxPrice: bigint;
  gridSize: number;
  colorCount: number;
}

// Local game state for simulation
export interface LocalGameState {
  grid: (Turtle | null)[];  // 3x3 grid
  queue: Turtle[];          // Waiting turtles
  turtles: Turtle[];        // All turtles
  currentBoxIndex: number;  // Current blindbox being opened
  totalMatches: number;     // Total matches made
  totalReward: bigint;      // Total reward earned
  isPlaying: boolean;       // Animation in progress
  isComplete: boolean;      // Game finished
}

const APP_ID = "miniapp-turtle-match";
const SCRIPT_NAME = "turtle-match-logic";
const BLINDBOX_PRICE = BigInt(10000000); // 0.1 GAS
const GRID_SIZE = 9;
let cachedContractAddress: string | null = null;
let cachedScriptHash: string | null = null;

// SDK type definition
type MiniAppSDKType = {
  invoke(method: string, params?: Record<string, unknown>): Promise<unknown>;
  getConfig(): { contractAddress?: string | null };
  payments: {
    payGAS(
      appId: string,
      amount: string,
      memo?: string,
    ): Promise<{ request_id: string; receipt_id?: string | null }>;
  };
  wallet: {
    getAddress(): Promise<string>;
    invokeIntent?(requestId: string): Promise<unknown>;
  };
};

// Wait for SDK
async function waitForSDK(
  t: (key: string) => string,
  timeout = 5000
): Promise<MiniAppSDKType> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error(t("sdkUnavailable")));
      return;
    }
    const sdk = (window as unknown as { MiniAppSDK?: MiniAppSDKType }).MiniAppSDK;
    if (sdk) {
      resolve(sdk);
      return;
    }
    const timer = setTimeout(() => reject(new Error(t("sdkInitTimeout"))), timeout);
    window.addEventListener("miniapp-sdk-ready", () => {
      clearTimeout(timer);
      resolve((window as unknown as { MiniAppSDK: MiniAppSDKType }).MiniAppSDK);
    }, { once: true });
  });
}

// Deterministic random number generator using seed
class SeededRandom {
  private seed: string;
  private index: number = 0;
  private cache: Map<number, number> = new Map();

  constructor(seed: string) {
    this.seed = seed;
  }

  async next(): Promise<number> {
    if (this.cache.has(this.index)) {
      const val = this.cache.get(this.index)!;
      this.index++;
      return val;
    }

    const hash = await sha256Hex(this.seed + this.index.toString());
    // Use first 8 chars of hash as number (0-4294967295)
    const num = parseInt(hash.substring(0, 8), 16);
    const normalized = num / 0xFFFFFFFF; // 0-1
    this.cache.set(this.index, normalized);
    this.index++;
    return normalized;
  }

  reset() {
    this.index = 0;
  }
}

// Get turtle color from random value (0-1)
function getColorFromRandom(random: number): TurtleColor {
  const roll = Math.floor(random * 100);
  for (let i = 0; i < COLOR_ODDS.length; i++) {
    if (roll < COLOR_ODDS[i]) {
      return i as TurtleColor;
    }
  }
  return TurtleColor.Gold;
}

export function useTurtleMatch() {
  const { t } = useI18n();
  const translate = t as unknown as (key: string) => string;

  // State
  const loading = ref(false);
  const error = ref<string | null>(null);
  const session = ref<GameSession | null>(null);
  const localGame = ref<LocalGameState | null>(null);
  const stats = ref<PlatformStats | null>(null);
  const walletAddress = ref<string | null>(null);
  const rng = ref<SeededRandom | null>(null);

  // Computed
  const isConnected = computed(() => !!walletAddress.value);
  const hasActiveSession = computed(() => session.value && !session.value.settled);
  const blindboxPrice = computed(() => formatGas(BLINDBOX_PRICE));

  const gridTurtles = computed(() => {
    if (!localGame.value) return Array(GRID_SIZE).fill(null);
    return localGame.value.grid;
  });

  const queueTurtles = computed(() => {
    if (!localGame.value) return [];
    return localGame.value.queue;
  });

  const turtles = computed(() => {
    if (!localGame.value) return [];
    return localGame.value.turtles;
  });

  // Methods
  const toBigInt = (value: unknown) => BigInt(String(value ?? "0"));
  const toBool = (value: unknown) => value === true || value === "true" || value === 1 || value === "1";

  const resolveContractAddress = async (sdk: MiniAppSDKType): Promise<string> => {
    if (cachedContractAddress) return cachedContractAddress;
    const local = sdk.getConfig?.();
    if (local?.contractAddress) {
      cachedContractAddress = local.contractAddress;
      return cachedContractAddress;
    }
    try {
      const remote = (await sdk.invoke("getConfig")) as { contractAddress?: string | null } | undefined;
      if (remote?.contractAddress) {
        cachedContractAddress = remote.contractAddress;
        return cachedContractAddress;
      }
    } catch {
      // Ignore and fall through to error.
    }
    throw new Error(t("contractUnavailable"));
  };

  const resolveScriptHash = async (sdk: MiniAppSDKType, contract: string): Promise<string> => {
    if (cachedScriptHash) return cachedScriptHash;
    const result = await sdk.invoke("invokeRead", {
      contract,
      method: "GetScriptHash",
      args: [{ type: "String", value: SCRIPT_NAME }],
    });
    const parsed = parseInvokeResult(result);
    const hash = Array.isArray(parsed) ? String(parsed[0] ?? "") : String(parsed ?? "");
    if (!hash) {
      throw new Error(t("scriptHashMissing"));
    }
    cachedScriptHash = hash.replace(/^0x/i, "");
    return cachedScriptHash;
  };

  async function connect() {
    try {
      loading.value = true;
      error.value = null;
      const sdk = await waitForSDK(translate);
      walletAddress.value = await sdk.wallet.getAddress();
    } catch (e) {
      error.value = (e as Error).message || t("connectFailed");
    } finally {
      loading.value = false;
    }
  }

  async function fetchStats() {
    try {
      const sdk = await waitForSDK(translate);
      const contract = await resolveContractAddress(sdk);
      const result = await sdk.invoke("invokeRead", {
        contract,
        method: "GetPlatformStats",
        args: [],
      });
      const parsed = parseInvokeResult(result);
      if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
        return;
      }
      const data = parsed as Record<string, unknown>;
      stats.value = {
        totalSessions: toBigInt(data.totalSessions),
        totalBoxes: toBigInt(data.totalBoxes),
        totalMatches: toBigInt(data.totalMatches),
        totalPaid: toBigInt(data.totalPaid),
        blindboxPrice: toBigInt(data.blindboxPrice),
        gridSize: Number(data.gridSize || 9),
        colorCount: Number(data.colorCount || 8),
      };
    } catch (e) {
      error.value = (e as Error).message || t("statsLoadFailed");
    }
  }

  async function fetchActiveSession() {
    if (!walletAddress.value) return;
    try {
      const sdk = await waitForSDK(translate);
      const contract = await resolveContractAddress(sdk);
      const result = await sdk.invoke("invokeRead", {
        contract,
        method: "GetPlayerActiveSession",
        args: [{ type: "Hash160", value: walletAddress.value }],
      });
      session.value = parseSession(parseInvokeResult(result));
    } catch (e) {
      error.value = (e as Error).message || t("sessionLoadFailed");
    }
  }

  function parseSession(payload: ParsedStackValue): GameSession | null {
    if (!payload) return null;
    if (Array.isArray(payload)) {
      const [
        sessionId,
        player,
        boxCount,
        seed,
        payment,
        startTime,
        settled,
        totalMatches,
        totalReward,
        settleTime,
      ] = payload;
      const id = toBigInt(sessionId);
      if (id === 0n) return null;
      return {
        sessionId: id,
        player: String(player ?? ""),
        boxCount: toBigInt(boxCount),
        seed: String(seed ?? ""),
        payment: toBigInt(payment),
        startTime: toBigInt(startTime),
        settled: toBool(settled),
        totalMatches: toBigInt(totalMatches),
        totalReward: toBigInt(totalReward),
        settleTime: toBigInt(settleTime),
      };
    }
    if (typeof payload === "object") {
      const data = payload as Record<string, unknown>;
      const id = toBigInt(data.SessionId ?? data.sessionId);
      if (id === 0n) return null;
      return {
        sessionId: id,
        player: String(data.Player ?? data.player ?? ""),
        boxCount: toBigInt(data.BoxCount ?? data.boxCount),
        seed: String(data.Seed ?? data.seed ?? ""),
        payment: toBigInt(data.Payment ?? data.payment),
        startTime: toBigInt(data.StartTime ?? data.startTime),
        settled: toBool(data.Settled ?? data.settled),
        totalMatches: toBigInt(data.TotalMatches ?? data.totalMatches),
        totalReward: toBigInt(data.TotalReward ?? data.totalReward),
        settleTime: toBigInt(data.SettleTime ?? data.settleTime),
      };
    }
    return null;
  }

  // Initialize local game state from session seed
  function initLocalGame(boxCount: number, seed: string) {
    rng.value = new SeededRandom(seed);
    localGame.value = {
      grid: Array(GRID_SIZE).fill(null),
      queue: [],
      turtles: [],
      currentBoxIndex: 0,
      totalMatches: 0,
      totalReward: 0n,
      isPlaying: false,
      isComplete: false,
    };
  }

  // Generate next turtle from seed
  async function generateNextTurtle(): Promise<Turtle | null> {
    if (!rng.value || !localGame.value) return null;

    const random = await rng.value.next();
    const color = getColorFromRandom(random);
    const id = localGame.value.turtles.length;

    const turtle: Turtle = {
      id,
      color,
      matched: false,
      gridPosition: -1,
    };

    localGame.value.turtles.push(turtle);
    return turtle;
  }

  // Find empty slot in grid
  function findEmptySlot(): number {
    if (!localGame.value) return -1;
    return localGame.value.grid.findIndex(t => t === null);
  }

  // Check for matches and remove them
  function checkAndRemoveMatches(): { matches: number; reward: bigint } {
    if (!localGame.value) return { matches: 0, reward: 0n };

    let matches = 0;
    let reward = 0n;
    const grid = localGame.value.grid;

    // Count colors in grid
    const colorCounts = new Map<TurtleColor, number[]>();
    grid.forEach((turtle, idx) => {
      if (turtle && !turtle.matched) {
        const positions = colorCounts.get(turtle.color) || [];
        positions.push(idx);
        colorCounts.set(turtle.color, positions);
      }
    });

    // Find pairs and mark as matched
    colorCounts.forEach((positions, color) => {
      while (positions.length >= 2) {
        const pos1 = positions.shift()!;
        const pos2 = positions.shift()!;

        const turtle1 = grid[pos1];
        const turtle2 = grid[pos2];

        if (turtle1 && turtle2) {
          turtle1.matched = true;
          turtle2.matched = true;
          grid[pos1] = null;
          grid[pos2] = null;

          matches++;
          reward += COLOR_REWARDS[color];
        }
      }
    });

    localGame.value.totalMatches += matches;
    localGame.value.totalReward += reward;

    return { matches, reward };
  }

  // Fill grid from queue
  function fillGridFromQueue() {
    if (!localGame.value) return;

    let emptySlot = findEmptySlot();
    while (emptySlot !== -1 && localGame.value.queue.length > 0) {
      const turtle = localGame.value.queue.shift()!;
      turtle.gridPosition = emptySlot;
      localGame.value.grid[emptySlot] = turtle;
      emptySlot = findEmptySlot();
    }
  }

  // Start a new game - calls contract and initializes local simulation
  async function startGame(boxCount: number) {
    if (!walletAddress.value) {
      error.value = t("connectWalletFirst");
      return null;
    }
    if (boxCount < 3 || boxCount > 20) {
      error.value = t("invalidBoxCount");
      return null;
    }

    try {
      loading.value = true;
      error.value = null;

      const sdk = await waitForSDK(translate);
      const contract = await resolveContractAddress(sdk);

      const totalCost = formatGas(BLINDBOX_PRICE * BigInt(boxCount), 8);
      const payment = await sdk.payments.payGAS(APP_ID, totalCost, `turtle-match:${boxCount}`);
      if (sdk.wallet.invokeIntent) {
        const intentId = payment.receipt_id || payment.request_id;
        await sdk.wallet.invokeIntent(intentId);
      }
      const receiptId = payment.receipt_id;
      if (!receiptId) {
        throw new Error(t("receiptMissing"));
      }

      // Call contract StartGame method
      await sdk.invoke("invokeFunction", {
        contract,
        method: "StartGame",
        args: [
          { type: "Hash160", value: walletAddress.value },
          { type: "Integer", value: boxCount.toString() },
          { type: "Integer", value: String(receiptId) },
        ],
      });


      // Fetch the session to get the seed
      await fetchActiveSession();

      if (session.value && session.value.seed) {
        // Initialize local game with seed
        initLocalGame(boxCount, session.value.seed);
        return session.value.sessionId;
      }

      return null;
    } catch (e) {
      error.value = (e as Error).message || t("error");
      return null;
    } finally {
      loading.value = false;
    }
  }

  // Settle the game - submit results to contract
  async function settleGame() {
    if (!walletAddress.value || !session.value || !localGame.value) {
      error.value = t("noActiveSession");
      return false;
    }

    if (session.value.settled) {
      error.value = t("alreadySettled");
      return false;
    }

    try {
      loading.value = true;
      error.value = null;

      const sdk = await waitForSDK(translate);
      const contract = await resolveContractAddress(sdk);
      const scriptHash = await resolveScriptHash(sdk, contract);

      // Call contract SettleGame method
      await sdk.invoke("invokeFunction", {
        contract,
        method: "SettleGame",
        args: [
          { type: "Hash160", value: walletAddress.value },
          { type: "Integer", value: session.value.sessionId.toString() },
          { type: "Integer", value: localGame.value.totalMatches.toString() },
          { type: "Integer", value: localGame.value.totalReward.toString() },
          { type: "ByteArray", value: scriptHash },
        ],
      });


      // Mark local game as complete
      localGame.value.isComplete = true;

      // Refresh session
      await fetchActiveSession();

      return true;
    } catch (e) {
      error.value = (e as Error).message || t("error");
      return false;
    } finally {
      loading.value = false;
    }
  }

  // Process one step of the game (open box, place turtle, check matches)
  async function processGameStep(): Promise<{
    turtle: Turtle | null;
    matches: number;
    reward: bigint;
    isComplete: boolean;
  }> {
    if (!localGame.value || !session.value) {
      return { turtle: null, matches: 0, reward: 0n, isComplete: true };
    }

    const boxCount = Number(session.value.boxCount);

    // Check if all boxes opened
    if (localGame.value.currentBoxIndex >= boxCount) {
      localGame.value.isComplete = true;
      return { turtle: null, matches: 0, reward: 0n, isComplete: true };
    }

    // Generate turtle
    const turtle = await generateNextTurtle();
    if (!turtle) {
      return { turtle: null, matches: 0, reward: 0n, isComplete: true };
    }

    // Place in grid or queue
    const emptySlot = findEmptySlot();
    if (emptySlot !== -1) {
      turtle.gridPosition = emptySlot;
      localGame.value.grid[emptySlot] = turtle;
    } else {
      localGame.value.queue.push(turtle);
    }

    localGame.value.currentBoxIndex++;

    // Check for matches
    const { matches, reward } = checkAndRemoveMatches();

    // Fill grid from queue
    fillGridFromQueue();

    // Check if game is complete
    const isComplete = localGame.value.currentBoxIndex >= boxCount;
    if (isComplete) {
      localGame.value.isComplete = true;
    }

    return { turtle, matches, reward, isComplete };
  }

  // Reset local game state
  function resetLocalGame() {
    localGame.value = null;
    rng.value = null;
  }

  // Lifecycle
  onMounted(() => {
    fetchStats();
  });

  return {
    // State
    loading,
    error,
    session,
    localGame,
    stats,
    walletAddress,

    // Computed
    isConnected,
    hasActiveSession,
    blindboxPrice,
    gridTurtles,
    queueTurtles,
    turtles,

    // Methods
    connect,
    fetchStats,
    fetchActiveSession,
    startGame,
    settleGame,
    processGameStep,
    resetLocalGame,

    // Constants
    COLOR_NAMES,
    COLOR_CSS,
    COLOR_REWARDS,
    BLINDBOX_PRICE,
  };
}
