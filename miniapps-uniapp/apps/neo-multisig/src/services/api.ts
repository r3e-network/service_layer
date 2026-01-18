import { waitForSDK } from "@neo/uniapp-sdk";

export interface MultisigRequest {
    id: string;
    chain_id: string;
    script_hash: string;
    threshold: number;
    signers: string[];
    transaction_hex: string;
    signatures: Record<string, string>;
    memo?: string;
    creator: string;
    status: 'pending' | 'ready' | 'broadcasted' | 'cancelled' | 'expired';
    broadcast_txid?: string | null;
    created_at: string;
    updated_at?: string;
}

const API_BASE = "/api/miniapps/miniapp-neo-multisig/multisig";

export const api = {
    async create(data: {
        chainId: string;
        scriptHash: string;
        threshold: number;
        signers: string[];
        transactionHex: string;
        memo?: string;
    }): Promise<MultisigRequest> {
        const sdk = await waitForSDK();
        const address = await sdk.wallet.getAddress();

        // Using uni.request for cross-platform compatibility (though this is likely H5 primarily)
        // The Host API expects standard fetch or uni.request proxied?
        // mini-apps run in iframe, requests to /api... are usually relative to host domain

        const res = await uni.request({
            url: API_BASE,
            method: "POST",
            header: {
                "x-wallet-address": address
            },
            data
        });

        if (res.statusCode >= 200 && res.statusCode < 300) {
            return res.data as MultisigRequest;
        }
        throw new Error((res.data as any).error || "Failed to create request");
    },

    async get(id: string): Promise<MultisigRequest> {
        const sdk = await waitForSDK();
        const address = await sdk.wallet.getAddress();

        const res = await uni.request({
            url: `${API_BASE}?id=${id}`,
            method: "GET",
            header: {
                "x-wallet-address": address
            }
        });

        if (res.statusCode >= 200 && res.statusCode < 300) {
            return res.data as MultisigRequest;
        }
        throw new Error((res.data as any).error || "Failed to fetch request");
    },

    async addSignature(id: string, publicKey: string, signature: string): Promise<MultisigRequest> {
        const sdk = await waitForSDK();
        const address = await sdk.wallet.getAddress();

        const res = await uni.request({
            url: API_BASE,
            method: "PUT",
            header: {
                "x-wallet-address": address
            },
            data: {
                id,
                publicKey,
                signature
            }
        });

        if (res.statusCode >= 200 && res.statusCode < 300) {
            return res.data as MultisigRequest;
        }
        throw new Error((res.data as any).error || "Failed to add signature");
    },

    async updateStatus(id: string, status: MultisigRequest["status"], broadcastTxId?: string): Promise<MultisigRequest> {
        const sdk = await waitForSDK();
        const address = await sdk.wallet.getAddress();

        const res = await uni.request({
            url: API_BASE,
            method: "PUT",
            header: {
                "x-wallet-address": address
            },
            data: {
                id,
                status,
                broadcastTxId
            }
        });

        if (res.statusCode >= 200 && res.statusCode < 300) {
            return res.data as MultisigRequest;
        }
        throw new Error((res.data as any).error || "Failed to update status");
    },
};
