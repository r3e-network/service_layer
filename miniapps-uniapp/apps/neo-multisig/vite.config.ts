import { defineConfig } from "vite";
import uni from "@dcloudio/vite-plugin-uni";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
    base: "./",
    plugins: [
        uni(),
        nodePolyfills({
            include: ["buffer", "process", "util", "stream", "events", "string_decoder"],
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
        },
    },
    optimizeDeps: {
        include: ["@cityofzion/neon-core", "jspdf", "qrcode"]
    },
    build: {
        commonjsOptions: {
            transformMixedEsModules: true,
        },
    },
});
