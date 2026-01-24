/**
 * @jest-environment node
 */
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "../../../..");
const missingPaths = [
  "miniapps-uniapp",
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
