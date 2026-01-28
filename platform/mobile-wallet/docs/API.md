# Mobile Wallet API Documentation

## Overview

This document describes the core APIs available in the Neo Mobile Wallet.

## Core Modules

### Wallet (`src/lib/neo/wallet.ts`)

Core wallet operations using secp256r1 cryptography.

| Function | Description | Returns |
|----------|-------------|---------|
| `generateWallet()` | Create new Neo N3 wallet | `Promise<WalletAccount>` |
| `importFromWIF(wif)` | Import wallet from WIF | `Promise<WalletAccount>` |
| `loadWallet()` | Load existing wallet | `Promise<WalletAccount \| null>` |
| `deleteWallet()` | Delete wallet from storage | `Promise<void>` |
| `exportWIF()` | Export private key as WIF | `Promise<string \| null>` |

### RPC (`src/lib/neo/rpc.ts`)

Blockchain queries and transaction broadcasting.

| Function | Description | Returns |
|----------|-------------|---------|
| `getBalances(address)` | Get NEO/GAS balances | `Promise<Balance[]>` |
| `getNeoBalance(address)` | Get NEO balance | `Promise<Balance>` |
| `getGasBalance(address)` | Get GAS balance | `Promise<Balance>` |
| `sendRawTransaction(tx)` | Broadcast transaction | `Promise<{hash: string}>` |
| `getTransaction(hash)` | Get transaction details | `Promise<unknown>` |
| `setNetwork(network)` | Switch MainNet/TestNet | `void` |

### Transaction (`src/lib/neo/transaction.ts`)

Transaction building and signing.

| Function | Description | Returns |
|----------|-------------|---------|
| `buildTransferScript(params)` | Build NEP-17 transfer | `string` |
| `signTransaction(txHash)` | Sign with private key | `Promise<string>` |

### Signing (`src/lib/signing.ts`)

Offline signing and multisig support.

| Function | Description | Returns |
|----------|-------------|---------|
| `signOffline(tx, privateKey)` | Sign transaction offline | `Promise<SignedTx>` |
| `verifySignature(hash, sig, pubKey)` | Verify signature | `boolean` |
| `createMultisig(name, threshold, keys)` | Create multisig wallet | `Promise<MultisigWallet>` |
| `loadMultisigWallets()` | Load multisig configs | `Promise<MultisigWallet[]>` |
| `loadSigningHistory()` | Get signing records | `Promise<SigningRecord[]>` |

### WalletConnect (`src/lib/walletconnect.ts`)

DApp connection via WalletConnect v2.

| Function | Description | Returns |
|----------|-------------|---------|
| `parseWCUri(uri)` | Parse WC URI | `{topic, version, relay} \| null` |
| `isValidWCUri(uri)` | Validate WC URI | `boolean` |
| `loadSessions()` | Get active sessions | `Promise<WCSession[]>` |
| `saveSession(session)` | Save new session | `Promise<void>` |
| `removeSession(topic)` | Disconnect session | `Promise<void>` |
| `signWCRequest(request)` | Sign DApp request | `Promise<string>` |

---

## Types

### WalletAccount
```typescript
interface WalletAccount {
  address: string;      // Neo N3 address
  publicKey: string;    // Compressed public key (hex)
  hasPrivateKey: boolean;
}
```

### Balance
```typescript
interface Balance {
  symbol: string;   // Token symbol
  amount: string;   // Balance amount
  decimals: number; // Token decimals
}
```

### SignedTx
```typescript
interface SignedTx {
  raw: string;         // Raw transaction data
  hash: string;        // Transaction hash (0x prefixed)
  signatures: string[]; // Signatures array
}
```

### WCSession
```typescript
interface WCSession {
  topic: string;       // Session identifier
  peerMeta: PeerMeta;  // DApp metadata
  chainId: string;     // neo3:mainnet or neo3:testnet
  address: string;     // Connected address
  connectedAt: number; // Connection timestamp
  expiresAt: number;   // Expiration timestamp
}
```

---

## Usage Examples

### Create and Export Wallet
```typescript
import { generateWallet, exportWIF } from '@/lib/neo/wallet';

const wallet = await generateWallet();
console.log('Address:', wallet.address);

const wif = await exportWIF();
console.log('Backup WIF:', wif);
```

### Check Balances
```typescript
import { getBalances, setNetwork } from '@/lib/neo/rpc';

setNetwork('mainnet');
const balances = await getBalances('NXV7ZhHiyM1aHXwpVsRZC6BwNFP2jghXAq');
console.log('NEO:', balances[0].amount);
console.log('GAS:', balances[1].amount);
```

### WalletConnect Integration
```typescript
import { parseWCUri, saveSession, createSession } from '@/lib/walletconnect';

const uri = 'wc:abc123@2?relay-protocol=irn';
const parsed = parseWCUri(uri);

if (parsed) {
  const session = createSession(
    parsed.topic,
    { name: 'MyDApp', description: '', url: '', icons: [] },
    walletAddress,
    'mainnet'
  );
  await saveSession(session);
}
```

---

## Error Handling

All async functions may throw errors. Wrap calls in try-catch:

```typescript
try {
  const wallet = await generateWallet();
} catch (error) {
  console.error('Wallet creation failed:', error.message);
}
```

Common errors:
- `"No private key found"` - Wallet not initialized
- `"Invalid WIF length"` - Malformed WIF import
- `"Invalid threshold"` - Multisig threshold out of range
