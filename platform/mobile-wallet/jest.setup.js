// Jest setup file
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock("expo-local-authentication", () => ({
  hasHardwareAsync: jest.fn(() => Promise.resolve(true)),
  isEnrolledAsync: jest.fn(() => Promise.resolve(true)),
  authenticateAsync: jest.fn(() => Promise.resolve({ success: true })),
}));

jest.mock(
  "expo-crypto",
  () => ({
    digestStringAsync: jest.fn(() => Promise.resolve("abcdef1234567890abcdef")),
    getRandomBytesAsync: jest.fn((length) => Promise.resolve(new Uint8Array(length).fill(42))),
    CryptoDigestAlgorithm: { SHA256: "SHA-256" },
    CryptoEncoding: { HEX: "hex" },
  }),
  { virtual: true },
);

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  Stack: { Screen: () => null },
}));
