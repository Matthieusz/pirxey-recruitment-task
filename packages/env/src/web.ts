import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

declare global {
  interface ImportMetaEnv {
    readonly VITE_SERVER_URL?: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

export const env = createEnv({
  client: {
    VITE_SERVER_URL: z.url(),
  },
  clientPrefix: "VITE_",
  emptyStringAsUndefined: true,
  runtimeEnvStrict: {
    VITE_SERVER_URL: import.meta.env.VITE_SERVER_URL,
  },
});
