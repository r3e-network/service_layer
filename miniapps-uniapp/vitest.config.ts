import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: "jsdom",
    include: ["apps/**/src/**/*.{test,spec}.{js,ts}"],
    deps: {
      inline: ["vue"],
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["apps/**/src/**/*.{vue,ts}"],
      exclude: ["apps/**/node_modules/**", "apps/**/dist/**", "apps/**/*.d.ts"],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./apps"),
      "@neo/uniapp-sdk": resolve(__dirname, "./packages/@neo/uniapp-sdk/src"),
      vue: "vue",
    },
  },
});
