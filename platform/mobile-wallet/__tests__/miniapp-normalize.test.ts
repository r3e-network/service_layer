/**
 * MiniApp Normalization Tests
 * Tests for src/lib/miniapp/normalize.ts
 */

import { coerceMiniAppInfo } from "../src/lib/miniapp/normalize";

describe("miniapp normalize", () => {
  it("should map banner_url to banner", () => {
    const result = coerceMiniAppInfo({
      app_id: "builtin-test",
      entry_url: "https://example.com/miniapp",
      name: "Test App",
      description: "Test description",
      icon: "🧩",
      banner_url: "https://cdn.example.com/banner.jpg",
    });

    expect(result?.banner).toBe("https://cdn.example.com/banner.jpg");
  });
});
