# Coin Flip

50/50 coin flip game with jackpot and achievements

## Overview

| Property | Value |
|----------|-------|
| **App ID** | `miniapp-coinflip` |
| **Category** | Gaming |
| **Version** | 2.0.0 |
| **Framework** | Vue 3 (uni-app) |

## Features

- **Provably Fair**: TEE VRF randomness ensures transparent outcome
- **Jackpot System**: 1% of bets contribute to jackpot pool
- **Player Statistics**: Track bets, wins, streaks, and spending
- **Achievement System**: 10 unlockable achievements
- **Streak Bonuses**: Win streak bonuses up to 5% extra payout
- **Bet History**: Complete bet history per player

## Permissions

| Permission | Required |
|------------|----------|
| Payments | ✅ Yes |
| RNG | ✅ Yes |
| Data Feed | ❌ No |
| Governance | ❌ No |

## Network Configuration

### Testnet

| Property | Value |
|----------|-------|
| **Contract** | `0xbd4c9203495048900e34cd9c4618c05994e86cc0` |
| **RPC** | `https://testnet1.neo.coz.io:443` |
| **Explorer** | [View on NeoTube](https://testnet.neotube.io/contract/0xbd4c9203495048900e34cd9c4618c05994e86cc0) |
| **Network Magic** | `894710606` |

### Mainnet

| Property | Value |
|----------|-------|
| **Contract** | Not deployed |
| **RPC** | `https://mainnet1.neo.coz.io:443` |
| **Explorer** | [NeoTube](https://neotube.io) |
| **Network Magic** | `860833102` |

## Platform Contracts

| Contract | Testnet Address |
|----------|--------------|
| PaymentHub | `NLyxAiXdbc7pvckLw8aHpEiYb7P7NYHpQq` |
| RandomnessLog | `NWkXBKnpvQTVy3exMD2dWNDzdtc399eLaD` |
| PriceFeed | `Ndx6Lia3FsF7K1t73F138HXHaKwLYca2yM` |
| AppRegistry | `NX25pqQJSjpeyKBvcdReRtzuXMeEyJkyiy` |

## Development

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for H5
npm run build
```

## Assets

- **Allowed Assets**: GAS
- **Min Bet**: 0.1 GAS
- **Max Bet**: 50 GAS
- **Platform Fee**: 3%
- **Jackpot Contribution**: 1% per bet
- **Jackpot Win Chance**: 0.5%

## Contract Methods

### User Methods

#### `PlaceBet(player, amount, choice, receiptId) → betId`

Place a coin flip bet.

| Parameter | Type | Description |
|-----------|------|-------------|
| `player` | Hash160 | Player wallet address |
| `amount` | Integer | Bet amount in GAS (base units, 1e8) |
| `choice` | Boolean | `true` = heads, `false` = tails |
| `receiptId` | Integer | Payment receipt ID from PaymentHub |

**Note**: Amount is validated against the payment receipt.

### Query Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `GetBetDetails` | `betId` | Get bet information |
| `GetPlayerStatsDetails` | `player` | Get player statistics |
| `GetPlatformStats` | - | Get platform statistics |
| `GetUserBets` | `player, offset, limit` | Get player bet history |
| `GetUserBetCount` | `player` | Get total bet count |

## Achievements

| ID | Name | Requirement |
|----|------|-------------|
| 1 | First Win | Win 1 bet |
| 2 | Ten Wins | Win 10 bets |
| 3 | Hundred Wins | Win 100 bets |
| 4 | High Roller | Single bet >= 10 GAS |
| 5 | Lucky Streak | 5 consecutive wins |
| 6 | Jackpot Winner | Win the jackpot |
| 7 | Veteran | Place 100 total bets |
| 8 | Big Spender | Wager 100 GAS total |
| 9 | Comeback King | Win after 5 loss streak |
| 10 | Whale | Single bet >= 50 GAS |

## License

MIT License - R3E Network
