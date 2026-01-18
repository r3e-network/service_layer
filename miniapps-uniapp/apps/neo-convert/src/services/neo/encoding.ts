import { Buffer } from "buffer";
import bs58 from "bs58";
import SHA256 from "crypto-js/sha256";
import RIPEMD160 from "crypto-js/ripemd160";
import HexEnc from "crypto-js/enc-hex";

export function bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

export function hexToBytes(hex: string): Uint8Array {
    if (!hex) return new Uint8Array(0);
    const match = hex.match(/[\da-f]{2}/gi);
    if (!match) return new Uint8Array(0);
    return new Uint8Array(match.map(h => parseInt(h, 16)));
}

export function hash256(hex: string): string {
    // @ts-ignore
    const wa = HexEnc.parse(hex);
    return SHA256(wa).toString(); // returns hex string
}

export function hash160(hex: string): string {
    // @ts-ignore
    const wa = HexEnc.parse(hex);
    return RIPEMD160(wa).toString();
}

/**
 * Base58Check Encode
 * @param hexStr Hex string of data to encode
 */
export function base58CheckEncode(hexStr: string): string {
    const checksum = hash256(hash256(hexStr)).slice(0, 8);
    const buffer = Buffer.from(hexStr + checksum, 'hex');
    return bs58.encode(buffer);
}

/**
 * Base58Check Decode
 * returns hex string of payload (without checksum) or null if invalid
 */
export function base58CheckDecode(str: string): string | null {
    try {
        const buffer = bs58.decode(str);
        const hex = bytesToHex(buffer);
        if (hex.length < 8) return null;
        const payload = hex.slice(0, -8);
        const checksum = hex.slice(-8);
        const calcChecksum = hash256(hash256(payload)).slice(0, 8);
        if (checksum !== calcChecksum) return null;
        return payload;
    } catch (e) {
        return null;
    }
}
