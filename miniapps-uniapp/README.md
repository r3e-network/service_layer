# Neo MiniApps (UniApp)

Canonical source for all Neo N3 MiniApp frontends built with UniApp + Vue 3.

All MiniApps use the **UniversalMiniApp** contract - developers only need to focus on frontend code.

## Structure

```
miniapps-uniapp/
├── apps/                    # MiniApp applications
│   ├── lottery/
│   │   ├── neo-manifest.json  # MiniApp config (auto-registration)
│   │   └── src/
│   │       ├── pages/         # Vue components
│   │       ├── static/        # Assets (icon.svg, banner.svg)
│   │       ├── shared/        # Shared styles/utils
│   │       ├── App.vue
│   │       ├── main.ts
│   │       ├── manifest.json  # UniApp config
│   │       └── pages.json
│   └── ...
├── packages/
│   └── @neo/uniapp-sdk/     # SDK with Vue composables
├── scripts/
│   ├── auto-discover-miniapps.js  # Auto-discover and register miniapps
│   ├── update-icons-erobo.js      # Update icons to E-Robo style
│   ├── build-all.sh               # Build all apps (includes auto-discover)
│   └── generate-neo-manifests.js
└── shared/                  # Cross-app shared resources
```

## Quick Start

```bash
# Install dependencies
pnpm install

# Dev single app
cd apps/lottery && pnpm dev

# Build all apps
pnpm build:all

# Auto-discover and register all miniapps
node scripts/auto-discover-miniapps.js
```

## Creating a New MiniApp

1. Create a new directory under `apps/`:

```bash
mkdir -p apps/my-app/src
```

2. Add `neo-manifest.json` in the app root:

```json
{
  "category": "gaming",
  "name_zh": "我的应用",
  "description": "My awesome MiniApp",
  "description_zh": "我的精彩小程序",
  "status": "active",
  "permissions": {
    "payments": true,
    "randomness": true
  }
}
```

3. Run auto-discover to register:

```bash
node scripts/auto-discover-miniapps.js
```

That's it! Your MiniApp will be automatically registered.

**Note:** The `build-all.sh` script automatically runs auto-discover after building, so you don't need to run it manually when building.

## SDK Usage

The `@neo/uniapp-sdk` provides Vue 3 composables for all UniversalMiniApp features:

```vue
<script setup lang="ts">
import {
  useWallet,
  usePayments,
  useRNG,
  useDatafeed,
  useEvents,
} from "@neo/uniapp-sdk";

const APP_ID = "miniapp-my-app";

// Wallet connection
const { address, connect, invokeRead, invokeContract } = useWallet();

// Payments (GAS)
const { payGAS, isLoading } = usePayments(APP_ID);

// Random numbers (VRF)
const { requestRandom } = useRNG(APP_ID);

// Price feeds
const { getPrice, getNetworkStats } = useDatafeed();

// Custom events
const { emit, list } = useEvents();
</script>
```

### SDK API Reference

| Composable      | Methods                                              | Description                          |
| --------------- | ---------------------------------------------------- | ------------------------------------ |
| `useWallet`     | `connect`, `address`, `invokeRead`, `invokeContract` | Wallet connection and contract calls |
| `usePayments`   | `payGAS(amount, memo)`                               | GAS payment processing               |
| `useRNG`        | `requestRandom()`                                    | VRF random number generation         |
| `useDatafeed`   | `getPrice(symbol)`, `getNetworkStats()`              | Price feeds and network data         |
| `useEvents`     | `emit(type, data)`, `list(filters)`                  | Custom event emission and querying   |
| `useGovernance` | `vote()`, `propose()`                                | Governance operations                |
| `useGasSponsor` | `requestSponsorship()`                               | Gas sponsorship requests             |

## Apps

| Category   | Apps                                                                                      |
| ---------- | ----------------------------------------------------------------------------------------- |
| Gaming     | lottery, coin-flip, million-piece-map                                                     |
| DeFi       | flashloan, compound-capsule, self-loan, neo-swap, neoburger, gas-sponsor                  |
| Social     | red-envelope, dev-tipping, breakup-contract, grant-share, hall-of-fame                    |
| NFT        | on-chain-tarot, time-capsule, heritage-trust, garden-of-neo, graveyard                    |
| Governance | burn-league, doomsday-clock, masquerade-dao, gov-merc, candidate-vote, council-governance |
| Utility    | neo-ns, explorer, guardian-policy, unbreakable-vault, neo-treasury, daily-checkin         |

## UniversalMiniApp Contract

All MiniApps use the shared `UniversalMiniApp` contract. No custom contract deployment needed.

**Features:**

- App registration with isolated storage
- Payment processing (GAS)
- VRF randomness
- Price feeds
- Event emission

See `contracts/UniversalMiniApp/README.md` for details.

## Design System (E-Robo Style)

All MiniApps use a unified E-Robo inspired design system with:

### CSS Variables

```css
:root {
  --erobo-purple: #9f9df3;
  --erobo-purple-dark: #7b79d1;
  --erobo-gradient: linear-gradient(135deg, #9f9df3 0%, #7b79d1 100%);
  --erobo-glow: 0 0 30px rgba(159, 157, 243, 0.4);
  --card-radius: 20px;
  --blur-radius: 50px;
}
```

### Shared Components

| Component      | Description                 | Usage                                  |
| -------------- | --------------------------- | -------------------------------------- |
| `AppLayout`    | Mobile-first layout wrapper | `<AppLayout title="My App">`           |
| `NeoCard`      | Glass-morphism card         | `<NeoCard variant="erobo">`            |
| `NeoButton`    | Gradient button with glow   | `<NeoButton variant="erobo">`          |
| `BlurGlow`     | Background blur/glow effect | `<BlurGlow color="purple">`            |
| `GradientCard` | E-Robo style gradient card  | `<GradientCard variant="purple" glow>` |

### Card Variants

- `default` - Standard glass card
- `erobo` - Purple gradient with glow
- `erobo-neo` - Neo green gradient
- `erobo-bitcoin` - Bitcoin gold gradient

## Security

### Permissions (Secure by Default)

Apps must explicitly request permissions in `neo-manifest.json`:

```json
{
  "permissions": {
    "payments": false,
    "governance": false,
    "automation": false
  }
}
```

### Validation

- Contract hash format validated (0x + 40 hex chars)
- Manifest schema validation
- Origin validation for iframe communication
