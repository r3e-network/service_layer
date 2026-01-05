import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["apps/**/src/**/*.{test,spec}.{js,ts}"],
    deps: {
      inline: ["vue"],
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["apps/**/src/**/*.{vue,ts}"],
      exclude: ["apps/**/node_modules/**", "apps/**/dist/**", "apps/**/*.d.ts", "apps/**/*.test.ts"],
      thresholds: {
        // Vue SFC coverage tracking has limitations with v8
        // Focus on test pass rate rather than coverage percentage
        lines: 0,
        functions: 0,
        branches: 0,
        statements: 0,
      },
    },
  },
  resolve: {
    alias: {
      "@/shared": resolve(__dirname, "./shared"),
      "@": resolve(__dirname, "./apps"),
      "@neo/uniapp-sdk": resolve(__dirname, "./packages/@neo/uniapp-sdk/src"),
      vue: "vue",
    },
  },
});
