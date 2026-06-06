import { defineConfig } from "vitest/config";

export const nodeConfig = defineConfig({
  test: {
    clearMocks: true,
    globals: false,
    restoreMocks: true,
  },
});

export const jsdomConfig = defineConfig({
  test: {
    clearMocks: true,
    environment: "jsdom",
    globals: false,
    restoreMocks: true,
  },
});
