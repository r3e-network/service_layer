# On-Chain/Off-Chain Separation Pattern

## Overview

This document describes the refactoring pattern used in TurtleMatch to minimize on-chain transactions while maintaining game integrity through deterministic randomness.

## Problem

Traditional blockchain games require multiple transactions:
- 1 transaction to start game
- N transactions for each game action (opening boxes, making moves, etc.)
- 1 transaction to settle/end game

**Total: N+2 transactions** - Poor UX due to waiting and gas costs.

## Solution

Reduce to **only 2 transactions**:
1. **StartGame** - Initialize game state, generate deterministic seed
2. **SettleGame** - Submit final results, verify and pay rewards

All intermediate game logic runs in the frontend using the seed for deterministic randomness.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND                                │
│  ┌─────────────┐    ┌──────────────┐    ┌───────────────┐  │
│  │ StartGame   │───▶│ Local Game   │───▶│ SettleGame    │  │
│  │ (TX #1)     │    │ Simulation   │    │ (TX #2)       │  │
│  └─────────────┘    └──────────────┘    └───────────────┘  │
│        │                   │                    │           │
│        ▼                   ▼                    ▼           │
│   Get Seed            Use Seed for         Submit Results   │
│                       Deterministic                         │
│                       Random                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      ON-CHAIN                                │
│  ┌─────────────┐                        ┌───────────────┐  │
│  │ StartGame   │                        │ SettleGame    │  │
│  │ - Validate  │                        │ - Verify      │  │
│  │ - Gen Seed  │                        │ - Pay Reward  │  │
│  │ - Store     │                        │ - Update Stats│  │
│  └─────────────┘                        └───────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Contract Implementation

### 1. Seed Generation (On-Chain)

```csharp
private static ByteString GenerateSeed(UInt160 player, BigInteger param)
{
    Transaction tx = Runtime.Transaction;
    ByteString txHash = (ByteString)tx.Hash;
    BigInteger blockTime = Runtime.Time;
    ByteString blockTimeBytes = (ByteString)blockTime.ToByteArray();
    ByteString paramBytes = (ByteString)param.ToByteArray();
    ByteString playerBytes = (ByteString)player;

    byte[] combined = Helper.Concat(
        (byte[])txHash,
        Helper.Concat(
            (byte[])blockTimeBytes,
            Helper.Concat((byte[])paramBytes, (byte[])playerBytes)
        )
    );

    return (ByteString)combined;
}
```

**Key Points:**
- Use `Runtime.Transaction.Hash` as primary entropy (NOT `Runtime.GetRandom()`)
- Combine with block time, player address, and game parameters
- Return raw bytes (avoid `CryptoLib.Sha256()` due to compiler issues)

### 2. StartGame Method

```csharp
public static BigInteger StartGame(UInt160 player, BigInteger param, BigInteger receiptId)
{
    // 1. Authorization
    ExecutionEngine.Assert(Runtime.CheckWitness(player), "Not authorized");

    // 2. Validate parameters
    ExecutionEngine.Assert(param >= MIN && param <= MAX, "Invalid param");

    // 3. Verify payment
    ValidatePaymentReceipt(APP_ID, player, payment, receiptId);

    // 4. Generate seed
    ByteString seed = GenerateSeed(player, param);

    // 5. Create and save session
    GameSession session = new GameSession { ... };
    SaveSession(session);

    // 6. Emit event with seed
    OnGameStarted(player, sessionId, param, (string)seed);

    return sessionId;
}
```

### 3. SettleGame Method

```csharp
public static bool SettleGame(
    UInt160 player,
    BigInteger sessionId,
    BigInteger resultCount,
    BigInteger totalReward)
{
    // 1. Authorization
    ExecutionEngine.Assert(Runtime.CheckWitness(player), "Not authorized");

    // 2. Get and validate session
    GameSession session = GetSession(sessionId);
    ExecutionEngine.Assert(session.Player == player, "Not owner");
    ExecutionEngine.Assert(!session.Settled, "Already settled");

    // 3. Verify reward bounds
    BigInteger maxReward = CalculateMaxPossibleReward(session);
    ExecutionEngine.Assert(totalReward <= maxReward, "Invalid reward");

    // 4. Update session
    session.Settled = true;
    session.TotalReward = totalReward;
    SaveSession(session);

    // 5. Pay reward
    if (totalReward > 0) PayReward(player, totalReward);

    // 6. Emit event
    OnGameSettled(player, sessionId, resultCount, totalReward);

    return true;
}
```

## Frontend Implementation

### 1. Seeded Random Generator

```typescript
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

    // Hash seed + index for deterministic random
    const hash = await sha256Hex(this.seed + this.index.toString());
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
```

### 2. Local Game State

```typescript
interface LocalGameState {
  // Game-specific state
  grid: (Item | null)[];
  queue: Item[];
  items: Item[];

  // Progress tracking
  currentIndex: number;
  totalResults: number;
  totalReward: bigint;

  // Status
  isPlaying: boolean;
  isComplete: boolean;
}
```

### 3. Game Flow

```typescript
// 1. Start game - calls contract
async function startGame(params: GameParams) {
  const result = await sdk.invoke("contract.invoke", {
    contract: CONTRACT_HASH,
    method: "StartGame",
    args: [...]
  });

  // Initialize local game with seed from contract
  initLocalGame(params, session.seed);
}

// 2. Process game steps locally
async function processGameStep() {
  const random = await rng.next();
  const item = generateItem(random);

  // Update local state
  placeItem(item);
  const { matches, reward } = checkMatches();

  return { item, matches, reward };
}

// 3. Settle game - calls contract with results
async function settleGame() {
  await sdk.invoke("contract.invoke", {
    contract: CONTRACT_HASH,
    method: "SettleGame",
    args: [player, sessionId, totalMatches, totalReward]
  });
}
```

## Security Considerations

1. **Seed Unpredictability**: Transaction hash is unknown until TX is mined
2. **Reward Bounds**: Contract verifies reward doesn't exceed maximum possible
3. **Session Ownership**: Only session owner can settle
4. **Single Settlement**: Session can only be settled once

## When to Use This Pattern

✅ **Good for:**
- Games with many intermediate steps
- Turn-based games
- Games where all randomness can be pre-determined
- Games where UX is critical

❌ **Not suitable for:**
- Games requiring real-time multiplayer verification
- Games where intermediate state must be publicly verifiable
- Games with external oracle dependencies

## Migration Checklist

- [ ] Identify all on-chain game actions
- [ ] Design seed generation combining TX hash + parameters
- [ ] Create StartGame method with seed generation
- [ ] Create SettleGame method with result verification
- [ ] Implement SeededRandom class in frontend
- [ ] Implement local game state management
- [ ] Add auto-play flow with animations
- [ ] Test determinism: same seed = same results
