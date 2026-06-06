import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    clearMocks: true,
    coverage: {
      exclude: ["**/*.test.*", "**/tests/**"],
      provider: "v8",
      reporter: ["text", "lcov"],
    },
    globals: false,
    restoreMocks: true,
  },
});
