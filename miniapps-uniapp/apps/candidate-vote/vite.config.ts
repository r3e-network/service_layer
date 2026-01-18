import { defineConfig } from "vite";
import uni from "@dcloudio/vite-plugin-uni";
import path from "path";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
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
  base: "./",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    outDir: "dist/build/h5",
    assetsDir: "static",
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});
