# Neo MiniApps (UniApp)

Canonical source for all Neo N3 MiniApp frontends built with UniApp + Vue 3.

MiniApps typically use **dedicated on-chain contracts** (one per app) built from `contracts/`. The shared **UniversalMiniApp** contract remains available for lightweight prototypes or experiments that do not need custom logic.

## Structure

```
miniapps-uniapp/
├── apps/                    # MiniApp applications
│   ├── lottery/
│   │   ├── neo-manifest.json  # MiniApp config (auto-registration + permissions)
│   │   └── src/
│   │       ├── pages/         # Vue components
│   │       ├── static/        # Assets (logo.png, banner.png)
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

2. Add `neo-manifest.json` in the app root (source of truth):

```json
{
  "app_id": "miniapp-my-app",
  "category": "gaming",
  "name": "My App",
  "name_zh": "我的应用",
  "description": "My awesome MiniApp",
  "description_zh": "我的精彩小程序",
  "status": "active",
  "permissions": {
    "payments": true,
    "rng": true
  }
}
```

Permissions are **deny-by-default**. Only the keys you set to `true` are enabled.
Keep `app_id` aligned with the `APP_ID` constant used in your MiniApp code so
payments, events, and SDK scoping all target the same app.
If your MiniApp calls on-chain functions, set `contracts.<chain>.address` to the deployed
contract address for each network. Auto-discovery will backfill `contracts`
when a matching entry exists in `deploy/config/testnet_contracts.json`.

3. Auto-discover to register (already runs during host-app dev/build):

```bash
node scripts/auto-discover-miniapps.js
```

That's it! Your MiniApp will be automatically registered.

**Auto-registration:** The host app runs `scripts/export_host_miniapps.sh` on `predev` and `prebuild`,
which copies built MiniApps and runs auto-discovery. You can still call
`node scripts/auto-discover-miniapps.js` directly if you need to refresh the registry.

**Note:** The `build-all.sh` script automatically runs auto-discover after building, so you don't need to run it manually when building.

## SDK Usage

The `@neo/uniapp-sdk` provides Vue 3 composables for wallet access, platform services, and contract invocations:

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

When invoking MiniApp contract methods, use the method names defined in the contract README (PascalCase in the updated contracts).

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
| Utility    | neo-ns, neo-news-today, explorer, guardian-policy, unbreakable-vault, neo-treasury, daily-checkin |

## UniversalMiniApp Contract

The shared `UniversalMiniApp` contract is optional and best suited for rapid prototypes or MiniApps that only need basic storage, payments, and events.

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
  --erobo-pink: #f7aac7;
  --erobo-peach: #f8d7c2;
  --erobo-mint: #d8f2e2;
  --erobo-sky: #d9ecff;
  --erobo-ink: #1b1b2f;
  --erobo-ink-soft: #4a4a63;
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
