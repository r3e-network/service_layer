// @ts-ignore
import { p256 } from "@noble/curves/nist.js";
import { hexToBytes, bytesToHex, base58CheckEncode, base58CheckDecode } from "./encoding";

/**
 * Generate a random private key (32 bytes hex)
 */
export function generatePrivateKey(): string {
    const privKey = p256.utils.randomSecretKey();
    return bytesToHex(privKey);
}

/**
 * Get Public Key from Private Key
 * @param privateKey Hex string
 * @param compressed (Default true for Neo)
 */
export function getPublicKey(privateKey: string, compressed = true): string {
    const pubKey = p256.getPublicKey(hexToBytes(privateKey), compressed);
    return bytesToHex(pubKey);
}

/**
 * Convert Private Key to WIF
 * WIF = Base58Check(0x80 + PrivKey + 0x01)
 */
export function convertPrivateKeyToWif(privateKey: string): string {
    const payload = "80" + privateKey + "01";
    return base58CheckEncode(payload);
}

/**
 * Convert WIF to Private Key (Hex)
 */
export function getPrivateKeyFromWIF(wif: string): string | null {
    const decoded = base58CheckDecode(wif);
    // 0x80 + 32bytes + 0x01 = 1 + 32 + 1 = 34 bytes = 68 hex chars
    if (!decoded || decoded.length !== 68 || !decoded.startsWith("80") || !decoded.endsWith("01")) {
        return null; // Invalid WIF
    }
    return decoded.substring(2, 66);
}

export function convertWifToPublicKey(wif: string): string {
    const priv = getPrivateKeyFromWIF(wif);
    if (!priv) throw new Error("Invalid WIF");
    return getPublicKey(priv);
}

// Validators

export const validateWif = (wif: string): boolean => {
    return !!getPrivateKeyFromWIF(wif);
};

export const validatePrivateKey = (key: string): boolean => {
    return /^[0-9a-fA-F]{64}$/.test(key);
};

export const validatePublicKey = (key: string): boolean => {
    // 02/03 + 32 bytes = 33 bytes = 66 hex
    return /^[0-9a-fA-F]{66}$/.test(key) && (key.startsWith("02") || key.startsWith("03"));
};
