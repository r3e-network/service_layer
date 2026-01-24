# Decouple MiniApps Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove all local miniapp assets/tooling from the platform repo and update active docs to point to the external miniapps repo while preserving CDN `/miniapps/...` paths.

**Architecture:** The platform repo contains only platform contracts, submission/registry services, and host-app routing. Miniapps live in the `r3e-network/miniapps` repo, which owns app source, per-app contracts, and build pipelines that publish to the CDN.

**Tech Stack:** Node/Jest (host-app tests), Vitest (docs checks), Bash, Markdown docs.

### Task 1: Guard against local miniapp assets and remove them

**Files:**
- Modify: `platform/host-app/__tests__/lib/miniapps-paths.test.ts`
- Delete: `miniapps/`
- Delete: `miniapps-scripts/`
- Delete: `platform/host-app/public/miniapps/`
- Delete: `deploy-miniapps-live`

**Step 1: Write the failing test**

Update `platform/host-app/__tests__/lib/miniapps-paths.test.ts`:

```ts
const missingPaths = [
  "miniapps",
  "miniapps-scripts",
  "deploy-miniapps-live",
  path.join("platform", "host-app", "public", "miniapps"),
];

describe("miniapps paths", () => {
  it("does not ship local miniapp assets in platform repo", () => {
    for (const target of missingPaths) {
      expect(fs.existsSync(path.join(repoRoot, target))).toBe(false);
    }
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter meshminiapp-host test -- __tests__/lib/miniapps-paths.test.ts`

Expected: FAIL because the directories and file still exist.

**Step 3: Write minimal implementation**

Remove local assets/tooling:

```bash
rm -rf miniapps miniapps-scripts platform/host-app/public/miniapps
rm -f deploy-miniapps-live
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter meshminiapp-host test -- __tests__/lib/miniapps-paths.test.ts`

Expected: PASS.

**Step 5: Commit**

```bash
git add platform/host-app/__tests__/lib/miniapps-paths.test.ts
git add miniapps miniapps-scripts platform/host-app/public/miniapps deploy-miniapps-live
git commit -m "chore: remove local miniapp assets from platform"
```

### Task 2: Remove legacy local repo references from active docs and scripts

**Files:**
- Modify: `docs/__tests__/miniapps-links.test.ts`
- Modify: `platform/host-app/README.md`
- Modify: `contracts/UniversalMiniApp/README.md`
- Modify: `docs/WORKFLOWS.md`
- Modify: `docs/neo-miniapp-platform-architectural-blueprint.md`
- Modify: `docs/neo-miniapp-platform-blueprint.md`
- Modify: `docs/neo-miniapp-platform-full.md`
- Modify: `docs/platform-mapping.md`
- Modify: `docs/FRONTEND_SPECIFICATION.md`
- Modify: `platform/host-app/public/sdk/README.md`
- Modify: `scripts/git_completeness_check.sh`

**Step 1: Write the failing test**

Expand `docs/__tests__/miniapps-links.test.ts` to scan active docs (and the
script) for legacy references:

```ts
const files = [
  "docs/manifest-spec.md",
  "docs/tutorials/TUTORIAL_INDEX.md",
  "docs/tutorials/01-payment-miniapp/README.md",
  "docs/tutorials/02-provably-fair-game/README.md",
  "docs/tutorials/03-governance-voting/README.md",
  "platform/host-app/README.md",
  "contracts/UniversalMiniApp/README.md",
  "docs/WORKFLOWS.md",
  "docs/neo-miniapp-platform-architectural-blueprint.md",
  "docs/neo-miniapp-platform-blueprint.md",
  "docs/neo-miniapp-platform-full.md",
  "docs/platform-mapping.md",
  "docs/FRONTEND_SPECIFICATION.md",
  "platform/host-app/public/sdk/README.md",
  "scripts/git_completeness_check.sh",
];

const contents = files.map((file) => readFileSync(file, "utf8")).join("\n");

expect(contents.includes("miniapps-uniapp")).toBe(false);
expect(contents.includes("miniapps/*")).toBe(false);
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run docs/__tests__/miniapps-links.test.ts`

Expected: FAIL because active docs still reference `miniapps-uniapp` and the
script references `miniapps/*`.

**Step 3: Write minimal implementation**

Update docs/scripts to reference the external repo and submission flow:

- `platform/host-app/README.md`: replace local `miniapps-uniapp` build steps with
  instructions to use `https://github.com/r3e-network/miniapps` for builds.
- `contracts/UniversalMiniApp/README.md`: update paths to
  `r3e-network/miniapps` and note per-app contracts live under
  `apps/<app>/contract/`.
- `docs/WORKFLOWS.md`: replace `miniapps/templates/...` with the external repo
  path or a note to clone the miniapps repo.
- `docs/neo-miniapp-platform-architectural-blueprint.md`,
  `docs/neo-miniapp-platform-blueprint.md`, `docs/neo-miniapp-platform-full.md`,
  `docs/platform-mapping.md`, `docs/FRONTEND_SPECIFICATION.md`: adjust directory
  trees to indicate miniapps live in the external repo (no local `miniapps/`
  directory).
- `platform/host-app/public/sdk/README.md`: update the SDK source reference to
  the external repo.
- `scripts/git_completeness_check.sh`: remove `miniapps/*` from the canonical
  paths and from the suggested `git add` list.

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run docs/__tests__/miniapps-links.test.ts`

Expected: PASS.

**Step 5: Commit**

```bash
git add docs/__tests__/miniapps-links.test.ts \
  platform/host-app/README.md \
  contracts/UniversalMiniApp/README.md \
  docs/WORKFLOWS.md \
  docs/neo-miniapp-platform-architectural-blueprint.md \
  docs/neo-miniapp-platform-blueprint.md \
  docs/neo-miniapp-platform-full.md \
  docs/platform-mapping.md \
  docs/FRONTEND_SPECIFICATION.md \
  platform/host-app/public/sdk/README.md \
  scripts/git_completeness_check.sh
git commit -m "docs: point miniapp references to external repo"
```

### Task 3: Final verification sweep (no code changes)

**Files:**
- Verify: `docs/`, `platform/host-app/README.md`, `contracts/UniversalMiniApp/README.md`

**Step 1: Run reference search**

Run: `rg -n "miniapps-uniapp" docs platform contracts README.md`

Expected: No matches outside historical plans/reports.

**Step 2: Run a directory check**

Run: `test ! -e miniapps && test ! -e miniapps-scripts && test ! -e platform/host-app/public/miniapps`

Expected: exit status 0.
