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
