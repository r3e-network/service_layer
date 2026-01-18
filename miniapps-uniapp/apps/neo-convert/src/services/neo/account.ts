import type { NeoAccount } from "./types";
import { generatePrivateKey, convertPrivateKeyToWif, getPublicKey } from "./keys";
import { convertPublicKeyToAddress } from "./address";

export const generateAccount = (): NeoAccount => {
    const priv = generatePrivateKey();
    const wif = convertPrivateKeyToWif(priv);
    const pub = getPublicKey(priv);
    const addr = convertPublicKeyToAddress(pub);
    return {
        privateKey: priv,
        wif: wif,
        publicKey: pub,
        address: addr
    };
};
