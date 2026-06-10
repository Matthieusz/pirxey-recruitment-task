import { fileURLToPath } from "node:url";

import { createEnv } from "@t3-oss/env-core";
import type { StandardSchemaV1 } from "@t3-oss/env-core";
import dotenv from "dotenv";
import { z } from "zod";

const formatIssuePath = (path: StandardSchemaV1.Issue["path"]): string => {
  if (!path || path.length === 0) {
    return "<unknown>";
  }

  return path
    .map((segment) => {
      if (typeof segment === "object" && segment !== null && "key" in segment) {
        return String(segment.key);
      }

      return String(segment);
    })
    .join(".");
};

const formatValidationIssue = (issue: StandardSchemaV1.Issue): string =>
  `${formatIssuePath(issue.path)}: ${issue.message}`;

dotenv.config({
  path: fileURLToPath(new URL("../../../apps/server/.env", import.meta.url)),
  quiet: true,
});

export const env = createEnv({
  emptyStringAsUndefined: true,
  onValidationError: (issues) => {
    throw new Error(
      `Invalid environment variables. ${issues.map(formatValidationIssue).join("; ")}`
    );
  },
  runtimeEnv: process.env,
  server: {
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
    CORS_ORIGIN: z.url(),
    DATABASE_URL: z.string().min(1),
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
  },
});
