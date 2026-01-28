// Type declarations for @noble packages
declare module "@noble/curves/nist" {
  export const p256: {
    getPublicKey: (privateKey: Uint8Array, compressed?: boolean) => Uint8Array;
    sign: (
      msgHash: Uint8Array,
      privateKey: Uint8Array
    ) => {
      toCompactHex: () => string;
    };
    verify: (
      signature: { toCompactHex: () => string } | string,
      msgHash: Uint8Array,
      publicKey: Uint8Array
    ) => boolean;
    Signature: {
      fromCompact: (hex: string) => { toCompactHex: () => string };
    };
    utils: {
      randomPrivateKey: () => Uint8Array;
    };
  };
}

declare module "@noble/hashes/sha2" {
  export function sha256(data: Uint8Array): Uint8Array;
}

declare module "@noble/hashes/legacy" {
  export function ripemd160(data: Uint8Array): Uint8Array;
}

declare module "@noble/hashes/utils" {
  export function bytesToHex(bytes: Uint8Array): string;
  export function hexToBytes(hex: string): Uint8Array;
}
