import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    clearMocks: true,
    coverage: {
      exclude: ["**/*.test.*", "**/tests/**", "src/routeTree.gen.ts"],
      provider: "v8",
      reporter: ["text", "lcov"],
    },
    environment: "jsdom",
    globals: false,
    restoreMocks: true,
    setupFiles: ["./src/tests/setup.ts"],
  },
});
