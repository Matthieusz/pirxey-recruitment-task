import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    clearMocks: true,
    coverage: {
      exclude: ["**/*.test.*", "**/tests/**"],
      provider: "v8",
      reporter: ["text", "lcov"],
    },
    environment: "jsdom",
    globals: false,
    restoreMocks: true,
    setupFiles: ["./src/tests/setup.ts"],
  },
});
