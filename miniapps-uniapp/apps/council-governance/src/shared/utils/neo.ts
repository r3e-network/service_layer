type StackItem = {
  type: string;
  value: any;
};

const textDecoder = new TextDecoder("utf-8", { fatal: false });

const isPrintable = (value: string) => /^[\x20-\x7E]*$/.test(value);

const base64ToBytes = (value: string) => {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const bytesToHex = (bytes: Uint8Array) =>
  Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

const base58Alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

const base58Decode = (value: string) => {
  let num = 0n;
  for (const char of value) {
    const index = base58Alphabet.indexOf(char);
    if (index < 0) {
      return "";
    }
    num = num * 58n + BigInt(index);
  }
  return num.toString(16).padStart(50, "0");
};

export const addressToScriptHash = (address: string) => {
  const hex = base58Decode(address.trim());
  if (!hex || hex.length < 42) return "";
  return hex.slice(2, 42).toLowerCase();
};

export const normalizeScriptHash = (value: string) => {
  const clean = String(value || "").trim().toLowerCase();
  return clean.startsWith("0x") ? clean.slice(2) : clean;
};

const decodeByteString = (value: string) => {
  if (!value) return "";
  const bytes = base64ToBytes(value);
  const text = textDecoder.decode(bytes);
  if (isPrintable(text)) return text;
  return `0x${bytesToHex(bytes)}`;
};

export const parseStackItem = (item: StackItem | null): any => {
  if (!item) return null;
  switch (item.type) {
    case "Integer":
      return item.value;
    case "Boolean":
      return Boolean(item.value);
    case "ByteString":
      return decodeByteString(item.value);
    case "Hash160":
      return item.value;
    case "String":
      return String(item.value ?? "");
    case "Array":
      return Array.isArray(item.value) ? item.value.map((entry: StackItem) => parseStackItem(entry)) : [];
    case "Struct":
      return Array.isArray(item.value) ? item.value.map((entry: StackItem) => parseStackItem(entry)) : [];
    case "Map": {
      const out: Record<string, any> = {};
      if (Array.isArray(item.value)) {
        item.value.forEach((entry: { key: StackItem; value: StackItem }) => {
          const key = String(parseStackItem(entry.key));
          out[key] = parseStackItem(entry.value);
        });
      }
      return out;
    }
    case "Any":
      return null;
    default:
      return item.value ?? null;
  }
};

export const parseInvokeResult = (result: any) => {
  const stack = result?.stack;
  if (!Array.isArray(stack) || stack.length === 0) return null;
  return parseStackItem(stack[0]);
};
