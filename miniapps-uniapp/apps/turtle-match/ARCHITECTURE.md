# Turtle Match 架构设计 - 链上/链下分离

## 设计原则

**只有以下内容需要上链：**
1. 初始状态 - 购买、随机种子生成、资金锁定
2. 最终状态 - 游戏结果验证、奖励结算
3. 支付记录 - 资金流转的不可篡改记录

**链下处理（前端/边缘函数）：**
- 盲盒开启动画
- 乌龟颜色确定（基于链上种子的确定性计算）
- 网格放置逻辑
- 配对检测
- 游戏过程展示

---

## 新架构流程

```
┌─────────────────────────────────────────────────────────────┐
│                      用户购买盲盒                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  链上 (1次交易)                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ StartGame(player, boxCount, payment)                 │   │
│  │ - 验证支付金额                                        │   │
│  │ - 生成随机种子 (seed = hash(blockHash + txHash))     │   │
│  │ - 记录: sessionId, player, boxCount, seed, timestamp │   │
│  │ - 返回: sessionId, seed                              │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  前端本地 (即时处理)                                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 1. 用 seed 确定性生成所有乌龟颜色                     │   │
│  │    colors[i] = hash(seed + i) % 8                    │   │
│  │                                                       │   │
│  │ 2. 模拟游戏过程                                       │   │
│  │    - 依次"开启"盲盒 (播放动画)                        │   │
│  │    - 放置到网格                                       │   │
│  │    - 检测配对                                         │   │
│  │    - 计算奖励                                         │   │
│  │                                                       │   │
│  │ 3. 生成游戏结果摘要                                   │   │
│  │    - matchedPairs: [(color, count), ...]             │   │
│  │    - totalReward: BigInt                             │   │
│  │    - proof: hash(seed + results)                     │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  链上 (1次交易)                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ SettleGame(sessionId, matchedPairs, proof)           │   │
│  │ - 验证 proof (重新计算确认结果正确)                   │   │
│  │ - 计算奖励金额                                        │   │
│  │ - 转账奖励给玩家                                      │   │
│  │ - 记录最终状态                                        │   │
│  │ - 触发事件: GameSettled(sessionId, reward)           │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 合约接口设计

### 方法

```csharp
// 开始游戏 - 支付并获取随机种子
public static Map<string, object> StartGame(
    UInt160 player,
    BigInteger boxCount,
    BigInteger receiptId
)
// 返回: { sessionId, seed, timestamp }

// 结算游戏 - 验证结果并发放奖励
public static BigInteger SettleGame(
    UInt160 player,
    BigInteger sessionId,
    byte[] matchedColors,  // 配对的颜色列表
    byte[] matchCounts,    // 每种颜色配对次数
    ByteString proof       // 结果证明
)
// 返回: 奖励金额

// 查询会话
[Safe] public static Map<string, object> GetSession(BigInteger sessionId)

// 查询玩家历史
[Safe] public static Map<string, object>[] GetPlayerHistory(UInt160 player)
```

### 存储

```csharp
// 会话数据 (精简)
PREFIX_SESSION + sessionId => {
    Player: UInt160,
    BoxCount: BigInteger,
    Seed: ByteString,        // 随机种子
    StartTime: BigInteger,
    Settled: bool,
    TotalReward: BigInteger  // 结算后填充
}

// 平台统计
PREFIX_STATS => {
    TotalSessions,
    TotalBoxesSold,
    TotalPaidOut
}
```

---

## 前端游戏逻辑

### 确定性随机算法

```typescript
// 基于链上种子生成乌龟颜色
function generateTurtleColors(seed: string, count: number): TurtleColor[] {
  const colors: TurtleColor[] = [];
  for (let i = 0; i < count; i++) {
    // 确定性哈希
    const hash = sha256(seed + i.toString());
    const value = parseInt(hash.slice(0, 8), 16);

    // 按概率分布选择颜色
    const color = getColorByOdds(value);
    colors.push(color);
  }
  return colors;
}

// 颜色概率分布
function getColorByOdds(value: number): TurtleColor {
  const normalized = value % 100;
  if (normalized < 20) return TurtleColor.Red;      // 20%
  if (normalized < 40) return TurtleColor.Orange;   // 20%
  if (normalized < 58) return TurtleColor.Yellow;   // 18%
  if (normalized < 73) return TurtleColor.Green;    // 15%
  if (normalized < 85) return TurtleColor.Blue;     // 12%
  if (normalized < 93) return TurtleColor.Purple;   // 8%
  if (normalized < 98) return TurtleColor.Pink;     // 5%
  return TurtleColor.Gold;                          // 2%
}
```

### 游戏模拟

```typescript
interface GameResult {
  turtles: Turtle[];
  matches: Match[];
  totalReward: bigint;
  proof: string;
}

function simulateGame(seed: string, boxCount: number): GameResult {
  const colors = generateTurtleColors(seed, boxCount);
  const grid: (Turtle | null)[] = Array(9).fill(null);
  const queue: Turtle[] = [];
  const matches: Match[] = [];
  let totalReward = BigInt(0);

  // 模拟每个盲盒
  for (let i = 0; i < boxCount; i++) {
    const turtle = { id: i, color: colors[i] };

    // 放置到网格或队列
    const placed = placeInGrid(grid, turtle);
    if (!placed) {
      queue.push(turtle);
    }

    // 检测配对
    const match = checkMatch(grid, turtle.color);
    if (match) {
      matches.push(match);
      totalReward += getReward(turtle.color);
      removeMatched(grid, match);
      fillFromQueue(grid, queue);
    }
  }

  // 生成证明
  const proof = generateProof(seed, matches, totalReward);

  return { turtles: colors.map((c, i) => ({ id: i, color: c })), matches, totalReward, proof };
}
```

---

## 优势对比

| 方面 | 旧设计 (全链上) | 新设计 (链上/链下分离) |
|------|----------------|----------------------|
| 交易次数 | N+2 次 (N=盲盒数) | 2 次 |
| 等待时间 | ~3秒 × N | ~6秒 总计 |
| Gas 费用 | 高 | 低 |
| 用户体验 | 差 (频繁等待) | 好 (流畅动画) |
| 安全性 | 高 | 高 (可验证) |

---

## 应用到其他 MiniApps

这个模式可以应用到所有需要多步骤交互的游戏：

| MiniApp | 链上 | 链下 |
|---------|------|------|
| Lottery | 购票+开奖 | 选号UI |
| CoinFlip | 下注+结算 | 翻转动画 |
| DoomsdayClock | 购买钥匙+结算 | 倒计时显示 |
| OnChainTarot | 支付+记录 | 抽牌动画+解读 |
| RedEnvelope | 创建+领取 | 开红包动画 |
