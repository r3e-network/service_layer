# Doomsday Clock

FOMO3D style - last buyer wins the pot

## Overview

| Property | Value |
|----------|-------|
| **App ID** | `miniapp-doomsday-clock` |
| **Category** | security |
| **Version** | 1.0.0 |
| **Framework** | Vue 3 (uni-app) |

## Features

- Fomo
- Timer
- Jackpot

## Permissions

| Permission | Required |
|------------|----------|
| Payments | ✅ Yes |
| RNG | ❌ No |
| Data Feed | ❌ No |
| Governance | ❌ No |

## Network Configuration

### Testnet

| Property | Value |
|----------|-------|
| **Contract** | `0x4f527dd46e013e3443877be123352acde3334805` |
| **RPC** | `https://testnet1.neo.coz.io:443` |
| **Explorer** | [View on NeoTube](https://testnet.neotube.io/contract/0x4f527dd46e013e3443877be123352acde3334805) |
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

## Contract Methods

### Query Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `GetGameStatus` | - | Get current round status (roundId, pot, active, lastBuyer, remainingTime) |
| `GetPlayerKeys` | `player, roundId` | Get player's key count for a round |
| `GetRoundDetails` | `roundId` | Get detailed round information |

### User Methods

#### `BuyKeys(player, keyCount, receiptId)`

Purchase keys for the current round.

| Parameter | Type | Description |
|-----------|------|-------------|
| `player` | Hash160 | Player wallet address |
| `keyCount` | Integer | Number of keys to buy |
| `receiptId` | Integer | Payment receipt ID from PaymentHub |


## License

MIT License - R3E Network
