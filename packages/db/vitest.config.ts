import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    clearMocks: true,
    globals: false,
    passWithNoTests: true,
    restoreMocks: true,
  },
});
