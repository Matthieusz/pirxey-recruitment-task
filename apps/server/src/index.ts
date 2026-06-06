import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { createContext } from "@pirxey-recruitment-task/api/context";
import { appRouter } from "@pirxey-recruitment-task/api/routers/index";
import { auth } from "@pirxey-recruitment-task/auth";
import { env } from "@pirxey-recruitment-task/env/server";
import { initLogger, parseError } from "evlog";
import { createAuthMiddleware } from "evlog/better-auth";
import type { BetterAuthInstance } from "evlog/better-auth";
import { evlog } from "evlog/hono";
import type { EvlogVariables } from "evlog/hono";
import { Hono } from "hono";
import { cors } from "hono/cors";

const handleError = (error: unknown) => {
  const parsed = parseError(error);
  console.error(
    JSON.stringify({
      code: parsed.code,
      error: parsed.message,
      status: parsed.status,
    })
  );
};

export const createApp = () => {
  const app = new Hono<EvlogVariables>();

  app.use(evlog());

  const identifyUser = createAuthMiddleware(auth as BetterAuthInstance, {
    exclude: ["/api/auth/**"],
    maskEmail: true,
  });

  app.use("*", async (c, next) => {
    await identifyUser(c.get("log"), c.req.raw.headers, c.req.path);
    await next();
  });

  app.use(
    "/*",
    cors({
      allowHeaders: ["Content-Type", "Authorization"],
      allowMethods: ["GET", "POST", "OPTIONS"],
      credentials: true,
      origin: env.CORS_ORIGIN,
    })
  );

  app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

  const apiHandler = new OpenAPIHandler(appRouter, {
    interceptors: [onError(handleError)],
    plugins: [
      new OpenAPIReferencePlugin({
        schemaConverters: [new ZodToJsonSchemaConverter()],
      }),
    ],
  });

  const rpcHandler = new RPCHandler(appRouter, {
    interceptors: [onError(handleError)],
  });

  app.use("/*", async (c, next) => {
    const context = await createContext({ context: c });

    const rpcResult = await rpcHandler.handle(c.req.raw, {
      context,
      prefix: "/rpc",
    });

    if (rpcResult.matched) {
      return c.newResponse(rpcResult.response.body, rpcResult.response);
    }

    const apiResult = await apiHandler.handle(c.req.raw, {
      context,
      prefix: "/api-reference",
    });

    if (apiResult.matched) {
      return c.newResponse(apiResult.response.body, apiResult.response);
    }

    await next();
  });

  app.get("/", (c) => c.text("OK"));

  return app;
};

// Only start the server when this module is the entrypoint (not in tests)
const isMainModule =
  typeof process !== "undefined" &&
  process.argv[1] &&
  (process.argv[1].endsWith("/apps/server/src/index.ts") ||
    process.argv[1].endsWith("/server/src/index.ts") ||
    process.argv[1].includes("/tsx"));

if (isMainModule) {
  initLogger({
    env: { service: "pirxey-recruitment-task-server" },
  });

  const app = createApp();

  const { serve } = await import("@hono/node-server");

  serve(
    {
      fetch: app.fetch,
      port: 3000,
    },
    (info) => {
      console.log(`Server is running on http://localhost:${info.port}`);
    }
  );
}
