# Neo MiniApp Wallet

A cross-platform mobile wallet for Neo N3 blockchain with MiniApp support, built with Expo and React Native.

## ✅ Implemented Features (42)

### Core Wallet

- [x] 🔐 **Wallet Creation/Import** - Create new or import existing wallets via mnemonic/private key
- [x] 💰 **Balance Query** - Real-time NEO/GAS balance display
- [x] 💸 **Send/Receive** - Transfer assets with QR code support
- [x] 🔒 **Biometric Auth** - Face ID / Fingerprint unlock
- [x] 🌐 **Network Switching** - MainNet/TestNet toggle
- [x] 🔑 **Private Key Export** - Secure key backup

### Token Management

- [x] 🪙 **Custom Tokens** - Add NEP-17 tokens by contract address
- [x] 📋 **Token Management** - Enable/disable token visibility
- [x] 📊 **Transaction Details** - Full transaction history with details

### DApp & Connectivity

- [x] 🌍 **DApp Browser** - Built-in browser for Web3 DApps
- [x] 🔗 **WalletConnect v2** - Connect to desktop DApps
- [x] 📷 **QR Code Scanner** - Scan addresses and WalletConnect URIs

### Multi-Wallet & Organization

- [x] 👛 **Multi-Wallet Support** - Manage multiple wallets
- [x] 📒 **Address Book** - Save frequently used addresses
- [x] 🔔 **Transaction Notifications** - Real-time tx alerts
- [x] 🧭 **Bottom Navigation** - Tab-based navigation

### Internationalization

- [x] 🌏 **i18n Support** - English/Chinese language support

### NFT & Staking

- [x] 🖼️ **NFT Support** - View, transfer NEP-11 NFTs
- [x] 📈 **Staking** - NEO staking with GAS rewards calculator

### Advanced Features

- [x] ⛽ **Gas Fee Estimation** - Fee tiers (Fast/Standard/Economy)
- [x] 💾 **Backup & Recovery** - Cloud/local backup with mnemonic verification
- [x] ✍️ **Transaction Signing** - Offline signing, multisig support

### Price & Analytics

- [x] 📊 **Price Charts** - NEO/GAS real-time prices via CoinGecko API
- [x] 📊 **Portfolio Analytics** - Asset allocation, P&L tracking

### Security

- [x] 🔐 **Security Settings** - App lock, auto-lock timeout, security logs
- [x] 🔐 **2FA Support** - Two-factor authentication (TOTP)
- [x] 📍 **Geo-Restrictions** - Location-based security

### Export & Notifications

- [x] 📤 **Transaction Export** - CSV/PDF export for tax reporting
- [x] 🔔 **Notification Center** - Push notifications, price alerts

### Hardware & Recovery

- [x] 🔌 **Hardware Wallet** - Ledger integration support
- [x] 👥 **Social Recovery** - Guardian-based wallet recovery

### Organization

- [x] 🏷️ **Transaction Labels** - Custom tags for transactions
- [x] 📝 **Transaction Notes** - Add memos to transactions

### UI & Customization

- [x] 📱 **Widget Support** - iOS/Android home screen widgets
- [x] 🌙 **Dark/Light Theme** - Theme customization
- [x] 🎨 **Custom Themes** - User-defined color schemes

### DeFi & Trading

- [x] 💱 **In-App Swap** - DEX integration for token swaps
- [x] 📈 **DeFi Dashboard** - Yield farming, liquidity positions
- [x] 🏦 **Fiat On-Ramp** - Buy crypto integration

### Automation & AI

- [x] 🔄 **Auto-Claim GAS** - Scheduled GAS claiming
- [x] 🤖 **AI Assistant** - Smart transaction suggestions
- [x] 🎮 **Gamification** - Achievements, rewards system

## Getting Started

```bash
# Install dependencies
npm install

# Start development
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage
```

## Project Structure

```
mobile-wallet/
├── app/                    # Expo Router pages
│   ├── _layout.tsx         # Root layout with tabs
│   ├── index.tsx           # Home/Wallet screen
│   ├── send.tsx            # Send assets
│   ├── receive.tsx         # Receive with QR code
│   ├── scanner.tsx         # QR code scanner
│   ├── backup/             # Backup & recovery
│   ├── gas/                # Gas fee estimation
│   ├── nft/                # NFT gallery & transfer
│   ├── signing/            # Transaction signing
│   ├── staking/            # Staking dashboard
│   ├── walletconnect/      # WalletConnect sessions
│   └── export/             # Transaction export
├── src/
│   ├── components/         # Reusable UI components
│   ├── hooks/              # Custom React hooks
│   ├── stores/             # Zustand state stores
│   └── lib/                # Core libraries
│       ├── neo/            # Neo N3 blockchain
│       │   ├── rpc.ts      # RPC client
│       │   ├── wallet.ts   # Wallet operations
│       │   ├── transaction.ts # Transaction builder
│       │   └── signing.ts  # Message signing
│       ├── accounts.ts     # Account management
│       ├── addressbook.ts  # Address book
│       ├── aiassistant.ts  # AI assistant
│       ├── autoclaim.ts    # Auto GAS claiming
│       ├── backup.ts       # Backup & recovery
│       ├── defi.ts         # DeFi dashboard
│       ├── export.ts       # Transaction export
│       ├── favorites.ts    # DApp favorites
│       ├── gasfee.ts       # Gas estimation
│       ├── gamification.ts # Achievements
│       ├── georestrict.ts  # Geo restrictions
│       ├── hardware.ts     # Hardware wallet
│       ├── nft.ts          # NFT operations
│       ├── notifications.ts # Push notifications
│       ├── portfolio.ts    # Portfolio analytics
│       ├── prices.ts       # Price data (CoinGecko)
│       ├── qrcode.ts       # QR code handling
│       ├── recovery.ts     # Social recovery
│       ├── security.ts     # Security settings
│       ├── signing.ts      # Transaction signing
│       ├── staking.ts      # Staking operations
│       ├── swap.ts         # Token swaps
│       ├── themes.ts       # Theme customization
│       ├── tokens.ts       # Token management
│       ├── twofa.ts        # 2FA support
│       ├── txlabels.ts     # Transaction labels
│       ├── walletconnect.ts # WalletConnect v2
│       └── widgets.ts      # Widget support
├── __tests__/              # Unit tests (90%+ coverage)
└── assets/                 # Images & icons
```

## Tech Stack

- **Expo SDK 51** - Cross-platform framework
- **Expo Router** - File-based routing
- **Expo Camera** - QR code scanning
- **Zustand** - Lightweight state management
- **React Native WebView** - MiniApp container
- **expo-secure-store** - Encrypted storage
- **expo-local-authentication** - Biometric auth
- **@noble/curves** - secp256r1 cryptography (Neo N3)
- **@noble/hashes** - SHA256, RIPEMD160
- **react-native-qrcode-svg** - QR code generation
- **Jest** - Testing framework (90%+ coverage)

## Test Coverage

```
Test Suites: 25+ passed
Tests:       300+ passed
Coverage:    90%+ statements
```

## License

MIT

## Documentation

- [API Reference](./docs/API.md) - Core module APIs and usage examples
- [Project Structure](#project-structure) - Code organization

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open a Pull Request

## Environment Variables

Create `.env` for local development:

```bash
# Network (mainnet/testnet)
EXPO_PUBLIC_DEFAULT_NETWORK=testnet

# CoinGecko API (optional, for price data)
EXPO_PUBLIC_COINGECKO_API_KEY=your_key

# WalletConnect Project ID
EXPO_PUBLIC_WC_PROJECT_ID=your_project_id
```
