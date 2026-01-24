import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

const files = [
  "docs/manifest-spec.md",
  "docs/tutorials/TUTORIAL_INDEX.md",
  "docs/tutorials/01-payment-miniapp/README.md",
  "docs/tutorials/02-provably-fair-game/README.md",
  "docs/tutorials/03-governance-voting/README.md",
  "platform/host-app/README.md",
  "docs/WORKFLOWS.md",
  "docs/neo-miniapp-platform-architectural-blueprint.md",
  "docs/neo-miniapp-platform-blueprint.md",
  "docs/neo-miniapp-platform-full.md",
  "docs/platform-mapping.md",
  "docs/FRONTEND_SPECIFICATION.md",
  "platform/host-app/public/sdk/README.md",
  "scripts/git_completeness_check.sh",
];

const blockedPatterns = [
  /miniapps-uniapp/, // legacy repo name
  /miniapps\/templates\//, // local templates path
  /miniapps\/_shared\//, // local shared assets path
  /(^|\n)\s*[\u251c\u2514]\u2500+\s*miniapps\//m, // tree listing
  /(^|\n)- `miniapps\//m, // bullet listing
];

describe("docs miniapps links", () => {
  it("does not reference local miniapps paths", () => {
    const contents = files.map((file) => readFileSync(file, "utf8")).join("\n");
    for (const pattern of blockedPatterns) {
      expect(pattern.test(contents)).toBe(false);
    }
  });
});
