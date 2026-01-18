# Neo Gacha

On-chain blind box marketplace with escrowed prizes, transparent odds, and verifiable randomness.

## Overview

| Property | Value |
|----------|-------|
| **App ID** | `miniapp-neo-gacha` |
| **Category** | Gaming |
| **Version** | 2.0.0 |
| **Framework** | Vue 3 (uni-app) |

## Features

- Creator-built gacha machines with escrowed inventory
- Pay-to-play spins using GAS (PaymentHub receipts)
- Verifiable randomness via ServiceLayerGateway
- Machine marketplace (list, manage, trade, rank)
- On-chain audit trail of spins and sales
- Inventory deposit/withdraw flows for NEP-17 and NEP-11

## Usage Flow

1. Create a machine in Creator Studio.
2. Deposit prizes via the Manage tab.
3. Activate and list the machine for players.

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
| **Contract** | `NQhDGifaGnnoCjYysHPLwBCKUfVQ7UHpsT` |
| **Script Hash (LE)** | `0x346efabde02c195f5431e2bcb7b077f5836bd4b2` |
| **Script Hash (BE)** | `0xb2d46b83f577b0b7bce231545f192ce0bdfa6e34` |
| **Deploy Tx** | `0xd615f2fe436037ee22f7defc9ef577b3635f6632a370d126840ad9e736def454` |
| **RPC** | `https://testnet1.neo.coz.io:443` |
| **Explorer** | [NeoTube](https://testnet.neotube.io) |
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
| ServiceLayerGateway | `NPXyVuEVfp47Abcwq6oTKmtwbJM6Yh965c` |

## Development

```bash
# Install dependencies
pnpm install

# Development server
pnpm dev --filter miniapp-neo-gacha

# Build for H5
pnpm build --filter miniapp-neo-gacha
```

## Assets

- **Allowed Assets**: NEP-17, NEP-11 (escrowed in contract)
- **Odds**: Must sum to 100% before activation

## License

MIT License - R3E Network
