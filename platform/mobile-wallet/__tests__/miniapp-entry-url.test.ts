/**
 * MiniApp entry URL helper tests
 */

import { buildMiniAppEntryUrlForWallet } from "../src/lib/miniapp/entry-url";

describe("miniapp entry url", () => {
  it("adds layout=mobile to wallet entry urls", () => {
    const url = buildMiniAppEntryUrlForWallet("https://example.com/app", {
      lang: "en",
      theme: "dark",
      embedded: "1",
    });

    expect(url).toBe("https://example.com/app?lang=en&theme=dark&embedded=1&layout=mobile");
  });
});
