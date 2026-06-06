import { defineConfig } from "oxlint";
import core from "ultracite/oxlint/core";
import react from "ultracite/oxlint/react";

export default defineConfig({
  extends: [core, react],
  ignorePatterns: [
    ...(core.ignorePatterns ?? []),
    "apps/web/src/routeTree.gen.ts",
    "packages/ui/*",
    ".agents",
    "**/tests/**",
  ],
  rules: {
    "jsx-a11y/prefer-tag-over-role": "off",
    "no-barrel-file": ["error", { threshold: 250 }],
  },
});
