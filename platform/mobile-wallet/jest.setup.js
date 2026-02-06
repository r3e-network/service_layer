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
    getRandomBytesAsync: jest.fn((length) => {
      const bytes = new Uint8Array(length);
      for (let i = 0; i < length; i++) {
        bytes[i] = Math.floor(Math.random() * 256);
      }
      return Promise.resolve(bytes);
    }),
    CryptoDigestAlgorithm: { SHA256: "SHA-256" },
    CryptoEncoding: { HEX: "hex" },
  }),
  { virtual: true },
);

jest.mock("react-native-aes-crypto", () => ({
  randomKey: jest.fn((length) => Promise.resolve("s".repeat(length))),
  pbkdf2: jest.fn((password, salt, _cost, length) => {
    const hexLength = Math.ceil(length / 4);
    const seed = Buffer.from(`${password}:${salt}`).toString("hex");
    const expanded = seed.padEnd(hexLength, "0");
    return Promise.resolve(expanded.slice(0, hexLength));
  }),
  encrypt: jest.fn((text, key, iv) => {
    return Promise.resolve(Buffer.from(`${text}|${key}|${iv}`).toString("base64"));
  }),
  decrypt: jest.fn((ciphertext, key, iv) => {
    const decoded = Buffer.from(ciphertext, "base64").toString("utf8");
    const [text, k, v] = decoded.split("|");
    if (k !== key || v !== iv) throw new Error("bad key");
    return Promise.resolve(text);
  }),
  hmac256: jest.fn((data, key) => {
    const hex = Buffer.from(`${data}|${key}`).toString("hex");
    return Promise.resolve(hex.padEnd(64, "0").slice(0, 64));
  }),
}));

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  Stack: { Screen: () => null },
}));
