import { defineConfig } from "vite";
import uni from "@dcloudio/vite-plugin-uni";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
    base: "./",
    plugins: [
        uni(),
        nodePolyfills({
            include: ["buffer", "process", "util", "stream", "events", "string_decoder", "crypto", "vm", "path"],
            globals: {
                Buffer: true,
                global: true,
                process: true,
            },
        }),
    ],
    resolve: {
        alias: {
            "@": "/src",
            "ethers": "ethers/dist/ethers.esm.min.js",
        },
    },
    optimizeDeps: {
        include: [
            "ethers",
            "snarkjs",
            "circomlibjs",
            "pinia",
            "@walletconnect/ethereum-provider",
            "@walletconnect/modal"
        ]
    },
    build: {
        commonjsOptions: {
            transformMixedEsModules: true,
        },
    },
});
