# Blockchain Memorial - 区块链灵位

> 永恒存在，永恒记忆 | Eternal Presence, Eternal Memory

## Overview

Blockchain Memorial is a decentralized memorial service that allows users to create eternal digital memorials for deceased loved ones on the Neo blockchain.

## Features

- **Create Memorials** - Record deceased's name, photo, life dates, biography, and obituary
- **Pay Tributes** - Offer virtual tributes (incense, candles, flowers, etc.) with on-chain records
- **Eternal Storage** - All data permanently stored on blockchain
- **Obituary Board** - Recent obituaries displayed on homepage
- **Visit History** - Track memorials you've paid tribute to

## Contract Methods

### CreateMemorial
Create a new memorial tablet (free).

```
CreateMemorial(
  creator: Hash160,
  deceasedName: string,
  photoHash: string,
  relationship: string,
  birthYear: int,
  deathYear: int,
  biography: string,
  obituary: string
) → memorialId
```

### PayTribute
Pay tribute with virtual offerings.

```
PayTribute(
  visitor: Hash160,
  memorialId: int,
  offeringType: int,
  message: string,
  receiptId: int
) → tributeId
```

### Offerings

| Type | Name | Cost (GAS) |
|------|------|------------|
| 1 | Incense (香) | 0.01 |
| 2 | Candle (蜡烛) | 0.02 |
| 3 | Flowers (鲜花) | 0.03 |
| 4 | Fruit (水果) | 0.05 |
| 5 | Wine (酒) | 0.1 |
| 6 | Feast (祭宴) | 0.5 |

## Development

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build
```

## Non-Profit

This service is non-profit. All fees only cover blockchain transaction costs.
