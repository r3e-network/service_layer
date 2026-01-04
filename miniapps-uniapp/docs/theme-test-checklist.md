# MiniApp Theme Switching Manual Test Checklist

## Pre-Test Setup

- [ ] Host App running in development mode
- [ ] Browser DevTools open (F12)
- [ ] Both dark and light system themes tested

---

## Test Procedure

### 1. URL Parameter Test

For each app, test: `?theme=light` and `?theme=dark`

### 2. PostMessage Test

Run in DevTools console:

```javascript
// Switch to light theme
window.postMessage({ type: "theme-change", theme: "light" }, "*");

// Switch to dark theme
window.postMessage({ type: "theme-change", theme: "dark" }, "*");
```

### 3. System Preference Test

Toggle system dark mode and refresh page

---

## App Checklist

### Gaming (6 apps)

| App          | Dark | Light | PostMessage | Notes |
| ------------ | ---- | ----- | ----------- | ----- |
| lottery      | [ ]  | [ ]   | [ ]         |       |
| coin-flip    | [ ]  | [ ]   | [ ]         |       |
| dice-game    | [ ]  | [ ]   | [ ]         |       |
| scratch-card | [ ]  | [ ]   | [ ]         |       |
| neo-crash    | [ ]  | [ ]   | [ ]         |       |
| secret-poker | [ ]  | [ ]   | [ ]         |       |

### DeFi (6 apps)

| App              | Dark | Light | PostMessage | Notes |
| ---------------- | ---- | ----- | ----------- | ----- |
| neo-swap         | [ ]  | [ ]   | [ ]         |       |
| flashloan        | [ ]  | [ ]   | [ ]         |       |
| neoburger        | [ ]  | [ ]   | [ ]         |       |
| self-loan        | [ ]  | [ ]   | [ ]         |       |
| compound-capsule | [ ]  | [ ]   | [ ]         |       |
| burn-league      | [ ]  | [ ]   | [ ]         |       |

### Governance (6 apps)

| App                | Dark | Light | PostMessage | Notes |
| ------------------ | ---- | ----- | ----------- | ----- |
| candidate-vote     | [ ]  | [ ]   | [ ]         |       |
| council-governance | [ ]  | [ ]   | [ ]         |       |
| gov-booster        | [ ]  | [ ]   | [ ]         |       |
| gov-merc           | [ ]  | [ ]   | [ ]         |       |
| masquerade-dao     | [ ]  | [ ]   | [ ]         |       |
| grant-share        | [ ]  | [ ]   | [ ]         |       |

### Social/Fun (6 apps)

| App              | Dark | Light | PostMessage | Notes |
| ---------------- | ---- | ----- | ----------- | ----- |
| breakup-contract | [ ]  | [ ]   | [ ]         |       |
| red-envelope     | [ ]  | [ ]   | [ ]         |       |
| on-chain-tarot   | [ ]  | [ ]   | [ ]         |       |
| crypto-riddle    | [ ]  | [ ]   | [ ]         |       |
| garden-of-neo    | [ ]  | [ ]   | [ ]         |       |
| doomsday-clock   | [ ]  | [ ]   | [ ]         |       |

### NFT/Creative (3 apps)

| App               | Dark | Light | PostMessage | Notes |
| ----------------- | ---- | ----- | ----------- | ----- |
| canvas            | [ ]  | [ ]   | [ ]         |       |
| million-piece-map | [ ]  | [ ]   | [ ]         |       |
| graveyard         | [ ]  | [ ]   | [ ]         |       |

### Utility (9 apps)

| App               | Dark | Light | PostMessage | Notes |
| ----------------- | ---- | ----- | ----------- | ----- |
| explorer          | [ ]  | [ ]   | [ ]         |       |
| neo-ns            | [ ]  | [ ]   | [ ]         |       |
| gas-sponsor       | [ ]  | [ ]   | [ ]         |       |
| time-capsule      | [ ]  | [ ]   | [ ]         |       |
| heritage-trust    | [ ]  | [ ]   | [ ]         |       |
| unbreakable-vault | [ ]  | [ ]   | [ ]         |       |
| guardian-policy   | [ ]  | [ ]   | [ ]         |       |
| dev-tipping       | [ ]  | [ ]   | [ ]         |       |
| ex-files          | [ ]  | [ ]   | [ ]         |       |

---

## Visual Check Points

For each theme, verify:

- [ ] Background colors change appropriately
- [ ] Text remains readable (sufficient contrast)
- [ ] Borders and shadows adapt
- [ ] Buttons and inputs are visible
- [ ] Status indicators (success/error) are clear
- [ ] No flickering during transition

---

## Sign-off

Tester: ********\_******** Date: ****\_****
