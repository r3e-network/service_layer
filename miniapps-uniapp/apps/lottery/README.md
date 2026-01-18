# Neo Lottery 福彩中心

Decentralized lottery with provably fair TEE VRF randomness and instant scratch cards

## Overview

| Property | Value |
|----------|-------|
| **App ID** | `miniapp-lottery` |
| **Category** | Gaming |
| **Version** | 3.0.0 |
| **Framework** | Vue 3 (uni-app) |
| **Theme** | Chinese Lucky (红金色) |

## Features

### Scheduled Draws (定期开奖)
- **Provably Fair**: TEE VRF randomness ensures transparent winner selection
- **Player Statistics**: Track tickets, wins, spending, and streaks
- **Achievement System**: 6 unlockable achievements for milestones
- **Jackpot Rollover**: Unclaimed prizes roll over to next round
- **Round History**: Complete historical data for all lottery rounds

### Instant Scratch Cards (刮刮乐) 🆕
- **Instant Win**: Scratch and reveal prizes immediately
- **Multiple Types**: 6 lottery types with different price tiers
- **Prize Tiers**: 5 prize levels from 1x to 100x multiplier
- **Canvas Interaction**: Touch-based scratch card experience
- **Win Celebration**: Gold coins and confetti animations

## Lottery Types 🆕

| ID | Name | Price | Type | Max Prize |
|----|------|-------|------|-----------|
| 0 | 福彩刮刮乐 | 0.05 GAS | Instant | 5 GAS |
| 1 | 双色球 | 0.2 GAS | Scheduled | 100 GAS |
| 2 | 快乐8 | 0.1 GAS | Instant | 10 GAS |
| 3 | 七乐彩 | 0.3 GAS | Scheduled | 200 GAS |
| 4 | 大乐透 | 0.5 GAS | Scheduled | 500 GAS |
| 5 | 至尊彩 | 1 GAS | Scheduled | 1000 GAS |

## Prize Tiers (Scratch Cards) 🆕

| Tier | Odds | Multiplier | Example (0.1 GAS) |
|------|------|------------|-------------------|
| 1 | 10% | 1x | 0.1 GAS |
| 2 | 5% | 2x | 0.2 GAS |
| 3 | 1% | 5x | 0.5 GAS |
| 4 | 0.1% | 20x | 2 GAS |
| 5 | 0.01% | 100x | 10 GAS |

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
| **Contract** | `0x3e330b4c396b40aa08d49912c0179319831b3a6e` |
| **RPC** | `https://testnet1.neo.coz.io:443` |
| **Explorer** | [View on NeoTube](https://testnet.neotube.io/contract/0x3e330b4c396b40aa08d49912c0179319831b3a6e) |
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
- **Ticket Price**: 0.1 GAS
- **Max Tickets per TX**: 100
- **Min Participants**: 3
- **Prize Distribution**: 90% to winner, 10% platform fee

## Contract Methods

### User Methods

#### `BuyTickets(player, ticketCount, receiptId)`

Purchase lottery tickets for the current round.

| Parameter | Type | Description |
|-----------|------|-------------|
| `player` | Hash160 | Player wallet address |
| `ticketCount` | Integer | Number of tickets (1-100) |
| `receiptId` | Integer | Payment receipt ID from PaymentHub |

**Note**: Total cost is calculated as `ticketCount × 0.1 GAS`.

### Scratch Card Methods 🆕

#### `BuyScratchTicket(player, lotteryType, receiptId)`

Purchase an instant scratch ticket.

| Parameter | Type | Description |
|-----------|------|-------------|
| `player` | Hash160 | Player wallet address |
| `lotteryType` | Integer | Lottery type ID (0-5) |
| `receiptId` | Integer | Payment receipt ID |

#### `RevealScratchTicket(player, ticketId)`

Reveal/scratch a ticket to see the prize.

| Parameter | Type | Description |
|-----------|------|-------------|
| `player` | Hash160 | Player wallet address |
| `ticketId` | Integer | Ticket ID from purchase |

**Returns**: `{ ticketId, lotteryType, isWinner, prize, purchaseTime }`

### Query Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `GetCurrentRoundInfo` | - | Get current round status |
| `GetPlayerStatsDetails` | `player` | Get player statistics |
| `GetPlatformStats` | - | Get platform statistics |
| `GetRoundDetails` | `roundId` | Get round history |
| `GetLotteryTypes` | - | Get all lottery type configs 🆕 |
| `GetTypeConfig` | `lotteryType` | Get specific type config 🆕 |
| `GetPlayerScratchTickets` | `player` | Get player's scratch tickets 🆕 |

## Achievements

| ID | Name | Requirement |
|----|------|-------------|
| 1 | First Ticket | Purchase 1 ticket |
| 2 | Ten Tickets | Purchase 10 tickets total |
| 3 | Hundred Tickets | Purchase 100 tickets total |
| 4 | First Win | Win 1 lottery |
| 5 | Big Winner | Win 10+ GAS in single draw |
| 6 | Lucky Streak | Win 3 consecutive rounds |

## License

MIT License - R3E Network
