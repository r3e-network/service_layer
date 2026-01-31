import { getWalletService } from "@/lib/wallet/wallet-service-impl";

describe("WalletServiceImpl getBalance (EVM)", () => {
  it("uses EVM adapter balance instead of placeholder", async () => {
    const service = getWalletService() as any;
    service._account = { address: "0xabc", provider: "metamask" };
    service._providerType = "extension";
    service._extensionProvider = "metamask";
    service._chainId = "eth-mainnet";

    const expected = {
      native: "123",
      nativeSymbol: "ETH",
      governance: undefined,
      governanceSymbol: undefined,
    };
    service.evmAdapters = { metamask: { getBalance: jest.fn().mockResolvedValue(expected) } };

    await expect(service.getBalance()).resolves.toEqual(expected);
  });
});
