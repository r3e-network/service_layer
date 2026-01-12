import { defineConfig } from "vite";
import uni from "@dcloudio/vite-plugin-uni";
import path from "path";

export default defineConfig({
  plugins: [uni()],
  base: "./",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@shared": path.resolve(__dirname, "../../shared"),
      "@shared": path.resolve(__dirname, "../../shared"),
    },
  },
  build: {
    outDir: "dist/build/h5",
    assetsDir: "static",
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            return "vendor";
          }
        },
      },
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});
