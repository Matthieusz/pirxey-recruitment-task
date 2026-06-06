import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    clearMocks: true,
    coverage: {
      exclude: ["**/*.test.*", "**/tests/**"],
      provider: "v8",
      reporter: ["text", "lcov"],
    },
    exclude: ["**/dist/**", "**/node_modules/**"],
    globals: false,
    restoreMocks: true,
  },
});
