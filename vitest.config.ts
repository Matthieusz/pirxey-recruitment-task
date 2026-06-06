import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      "apps/server/vitest.config.ts",
      "apps/web/vitest.config.ts",
      "packages/api/vitest.config.ts",
      "packages/auth/vitest.config.ts",
      "packages/db/vitest.config.ts",
      "packages/env/vitest.config.ts",
      "packages/ui/vitest.config.ts",
    ],
  },
});
