import { hash256, hash160, base58CheckEncode } from "./encoding";

/**
 * Get Verification Script from Public Key
 * Script = 0x21 (PUSHDATA33) + PubKey + 0xAC (CHECKSIG)
 */
export function getVerificationScript(publicKey: string): string {
    return "21" + publicKey + "AC";
}

/**
 * Get Script Hash from Script (Big Endian Hex)
 * Neo Addresses use ScriptHash (160 bit)
 */
export function getScriptHash(script: string): string {
    const sha = hash256(script);
    const ripemd = hash160(sha);
    return ripemd;
}

/**
 * Convert Public Key to Address (N3)
 * Address = Base58Check(0x35 + ScriptHash)
 */
export function convertPublicKeyToAddress(publicKey: string): string {
    const script = getVerificationScript(publicKey);
    const scriptHash = getScriptHash(script);
    return base58CheckEncode("35" + scriptHash);
}
