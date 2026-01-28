# Changelog

All notable changes to Neo MiniApp Wallet will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-28

### Added

#### Core Wallet Features
- 🔐 Wallet creation and import via mnemonic/private key
- 💰 Real-time NEO/GAS balance display
- 💸 Send/receive assets with QR code support
- 🔒 Biometric authentication (Face ID / Fingerprint)
- 🌐 Network switching (MainNet/TestNet)
- 🔑 Secure private key export

#### Token Management
- 🪙 Custom NEP-17 token support
- 📋 Token visibility management
- 📊 Full transaction history with details

#### DApp & Connectivity
- 🌍 Built-in DApp browser for Web3 applications
- 🔗 WalletConnect v2 integration
- 📷 QR code scanner for addresses and WalletConnect URIs

#### Multi-Wallet & Organization
- 👛 Multi-wallet management
- 📒 Address book for frequent contacts
- 🔔 Real-time transaction notifications
- 🧭 Tab-based bottom navigation

#### Internationalization
- 🌏 English and Chinese language support

#### NFT & Staking
- 🖼️ NEP-11 NFT viewing and transfer
- 📈 NEO staking with GAS rewards calculator

#### Advanced Features
- ⛽ Gas fee estimation with tiers (Fast/Standard/Economy)
- 💾 Cloud/local backup with mnemonic verification
- ✍️ Offline transaction signing and multisig support
- 💹 Real-time price tracking with charts
- 🤖 AI assistant integration
- 🎮 Gamification with achievements
- 🎨 Custom theme support
- 📍 Geo-based features
- 🔄 Auto-claim functionality
- ⭐ Favorites management
- 📱 MiniApp platform integration

### Security
- 🔒 Cryptographically secure random ID generation
- 🔐 Secure mnemonic encryption for backups
- 🛡️ TypeScript strict mode enabled
- ✅ Comprehensive input validation

### Developer Experience
- 📚 Complete API documentation
- 📝 Enhanced JSDoc comments
- 🧪 95%+ test coverage (387 tests)
- 🔧 ESLint and Prettier configuration

## Development Iterations

### Round 9 - Final Review (2025-01-28)
- Updated @noble/hashes imports for v2.0.1 compatibility
- Enhanced JSDoc comments and API documentation
- Code quality fixes for ESLint and TypeScript strict mode
- Resolved type errors in WCRequest and generateBackupId
- Final CHANGELOG creation

### Round 10 - Production Hardening (2025-01-29)
- Fixed AuthResult type handling in wallet store
- Added biometric authentication for send transactions
- Added balance validation and NEO whole number check
- Added RPC timeout (30s) and retry mechanism (3 attempts)
- Fixed CSV export field escaping for special characters
- Added crypto and biometrics module tests
- Added i18n translations for security settings and scanner
- Updated test coverage to 40 suites, 403 tests
- Updated README with accurate SDK version and test counts

### Round 8 - Security Hardening
- Cryptographically secure random for IDs and backup codes
- Updated test constants for tiered confirmations

### Round 7 - Test Coverage
- Improved test coverage to 95%+
- Added comprehensive test suites

### Round 6 - Performance Optimization
- Deep optimization and code quality improvements
- Code formatting with Prettier

### Round 5 - Build Fixes
- Resolved build issues across platform packages
- Fixed TypeScript and ESLint errors
- Translation improvements

### Round 4 - UI/UX Enhancements
- Theme toggle in settings
- Skeleton, ErrorState, EmptyState components
- Enhanced stats page with charts

### Round 3 - Feature Completion
- Screenshot gallery and version history
- Enhanced permissions card
- SDK examples and API reference

### Round 2 - Integration
- Comprehensive functional tests
- Missing Chinese translations
- MiniApp lifecycle tests

### Round 1 - Foundation
- Initial project setup
- Core wallet functionality
- Basic UI components
