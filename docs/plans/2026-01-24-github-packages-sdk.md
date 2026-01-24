# GitHub Packages SDK Distribution Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Publish the SDK to GitHub Packages under `@r3e/uniapp-sdk` and update miniapps to install it via `npm.pkg.github.com`, while fixing pnpm catalog resolution so installs succeed.

**Architecture:** Keep the SDK source in the platform repo, publish it to GitHub Packages with `publishConfig.registry`, and point miniapps to the GitHub registry using a repo-level `.npmrc` with token-based auth. Align SDK docs and miniapps dependencies to `@r3e/uniapp-sdk`, and define pnpm `catalogs` so `catalog:` dependencies resolve.

**Tech Stack:** Node.js, pnpm, npm (GitHub Packages registry), Vitest.

---

### Task 1: Add SDK metadata test (TDD) and update publish config

**Files:**
- Create: `packages/@neo/uniapp-sdk/__tests__/package-json.test.ts`
- Modify: `packages/@neo/uniapp-sdk/package.json`
- Modify: `packages/@neo/uniapp-sdk/package-lock.json`
- Modify: `packages/@neo/uniapp-sdk/__tests__/exports.test.ts`

**Step 1: Write the failing test**

Create `packages/@neo/uniapp-sdk/__tests__/package-json.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

function loadPackageJson() {
  const pkgPath = path.resolve(__dirname, "..", "package.json");
  return JSON.parse(fs.readFileSync(pkgPath, "utf8"));
}

describe("uniapp-sdk package metadata", () => {
  it("uses @r3e scope and GitHub Packages registry", () => {
    const pkg = loadPackageJson();
    expect(pkg.name).toBe("@r3e/uniapp-sdk");
    expect(pkg.publishConfig?.registry).toBe("https://npm.pkg.github.com");
  });

  it("declares the GitHub repo for package provenance", () => {
    const pkg = loadPackageJson();
    expect(pkg.repository?.type).toBe("git");
    expect(pkg.repository?.url).toBe("git+https://github.com/r3e-network/service_layer.git");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm -C packages/@neo/uniapp-sdk vitest run __tests__/package-json.test.ts`

Expected: FAIL (name is still `@neo/uniapp-sdk` and publishConfig is missing).

**Step 3: Write minimal implementation**

Update `packages/@neo/uniapp-sdk/package.json`:
- Set `name` to `@r3e/uniapp-sdk`.
- Add `publishConfig.registry` = `https://npm.pkg.github.com`.
- Add `publishConfig.access` = `public`.
- Add `repository` block with the GitHub repo URL.

Update `packages/@neo/uniapp-sdk/package-lock.json` name fields to `@r3e/uniapp-sdk`.

Update `packages/@neo/uniapp-sdk/__tests__/exports.test.ts` describe string to `@r3e/uniapp-sdk`.

**Step 4: Run test to verify it passes**

Run: `pnpm -C packages/@neo/uniapp-sdk vitest run __tests__/package-json.test.ts`

Expected: PASS.

**Step 5: Commit**

```bash
git add packages/@neo/uniapp-sdk/package.json \
  packages/@neo/uniapp-sdk/package-lock.json \
  packages/@neo/uniapp-sdk/__tests__/package-json.test.ts \
  packages/@neo/uniapp-sdk/__tests__/exports.test.ts

git commit -m "feat: publish uniapp-sdk via GitHub Packages"
```

---

### Task 2: Update platform docs and UI strings to @r3e + GitHub Packages

**Files:**
- Modify: `docs/sdk-guide.md`
- Modify: `docs/getting-started/Quick-Start.md`
- Modify: `docs/getting-started/Authentication.md`
- Modify: `docs/getting-started/Introduction.md`
- Modify: `docs/services/Oracle-Service.md`
- Modify: `docs/services/GasBank-Service.md`
- Modify: `docs/services/VRF-Service.md`
- Modify: `docs/services/DataFeeds-Service.md`
- Modify: `docs/services/Automation-Service.md`
- Modify: `platform/host-app/docs/README.md`
- Modify: `platform/host-app/docs/SDK.md`
- Modify: `platform/host-app/docs/API.md`
- Modify: `platform/host-app/pages/docs.tsx`
- Modify: `platform/host-app/lib/i18n/locales/en/host.json`
- Modify: `platform/host-app/lib/i18n/locales/zh/host.json`

**Step 1: Update package name references**

Replace `@neo/uniapp-sdk` with `@r3e/uniapp-sdk` in the files above.

**Step 2: Update install guidance**

Add a short note where install commands appear (docs/SDK/Quick-Start) to use GitHub Packages, e.g.:

```
# One-time setup
npm config set @r3e:registry https://npm.pkg.github.com

# Install
pnpm add @r3e/uniapp-sdk
```

Avoid touching historical files in `docs/plans/` and `reports/`.

**Step 3: Commit**

```bash
git add docs/sdk-guide.md \
  docs/getting-started/Quick-Start.md \
  docs/getting-started/Authentication.md \
  docs/getting-started/Introduction.md \
  docs/services/Oracle-Service.md \
  docs/services/GasBank-Service.md \
  docs/services/VRF-Service.md \
  docs/services/DataFeeds-Service.md \
  docs/services/Automation-Service.md \
  platform/host-app/docs/README.md \
  platform/host-app/docs/SDK.md \
  platform/host-app/docs/API.md \
  platform/host-app/pages/docs.tsx \
  platform/host-app/lib/i18n/locales/en/host.json \
  platform/host-app/lib/i18n/locales/zh/host.json

git commit -m "docs: switch SDK references to @r3e and GitHub Packages"
```

---

### Task 3: Point miniapps to GitHub Packages and @r3e SDK

**Files:**
- Create: `.npmrc`
- Modify: `apps/*/package.json`

**Step 1: Add repo-level npm config**

Create `.npmrc` at repo root:

```
@r3e:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

**Step 2: Update SDK dependency scope**

Replace all `@neo/uniapp-sdk` with `@r3e/uniapp-sdk` in `apps/*/package.json`.

**Step 3: Commit**

```bash
git add .npmrc apps/*/package.json

git commit -m "chore: use @r3e/uniapp-sdk from GitHub Packages"
```

---

### Task 4: Fix pnpm catalog definitions for miniapps

**Files:**
- Modify: `pnpm-workspace.yaml`

**Step 1: Add catalog versions**

Update `pnpm-workspace.yaml` to include:

```
catalogs:
  default:
    "@dcloudio/uni-app": "3.0.0-4060620250520001"
    "@dcloudio/uni-components": "3.0.0-4060620250520001"
    "@dcloudio/uni-h5": "3.0.0-4060620250520001"
    "@dcloudio/uni-cli-shared": "3.0.0-4060620250520001"
    "@dcloudio/vite-plugin-uni": "3.0.0-4060620250520001"
    "vue": "^3.4.21"
    "vite": "^5.2.8"
    "typescript": "^5.4.5"
    "sass": "^1.77.0"
    "terser": "^5.46.0"
    "@cityofzion/neon-core": "^5.8.0"
    "@noble/curves": "^2.0.1"
    "@noble/hashes": "^2.0.1"
```

**Step 2: Re-run install**

Run with a GitHub Packages token available:

```bash
NODE_AUTH_TOKEN=$GITHUB_TOKEN corepack pnpm install
```

Expected: install completes without catalog errors. If `NODE_AUTH_TOKEN` is missing, document the auth failure and proceed.

**Step 3: Commit**

```bash
git add pnpm-workspace.yaml

git commit -m "chore: define pnpm catalogs for miniapps"
```

---

### Task 5: Publish SDK to GitHub Packages (if token available)

**Files:**
- None

**Step 1: Publish**

From `packages/@neo/uniapp-sdk`:

```bash
NODE_AUTH_TOKEN=$GITHUB_TOKEN npm publish --registry=https://npm.pkg.github.com --access public
```

Expected: publish succeeds. If auth fails, capture the error and report.

---

### Task 6: Verify end-to-end install

**Step 1: Verify registry lookup**

```bash
NODE_AUTH_TOKEN=$GITHUB_TOKEN npm view @r3e/uniapp-sdk --registry=https://npm.pkg.github.com
```

Expected: version output.

**Step 2: Install miniapps**

```bash
NODE_AUTH_TOKEN=$GITHUB_TOKEN corepack pnpm install
```

Expected: install completes with no catalog errors and resolves `@r3e/uniapp-sdk`.

---

Plan complete and saved to `docs/plans/2026-01-24-github-packages-sdk.md`.

Two execution options:
1. Subagent-Driven (this session) – I dispatch a fresh subagent per task, review between tasks.
2. Parallel Session – Open a new session using superpowers:executing-plans for batch execution.

Which approach?
