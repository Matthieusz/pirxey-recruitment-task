import { describe, expect, it, vi } from "vitest";

// Mock heavy dependencies before imports
vi.mock("evlog", () => ({
  initLogger: vi.fn(),
}));

vi.mock("evlog/hono", () => {
  const middleware = vi.fn(async (_c: unknown, next: () => Promise<void>) => {
    await next();
  });
  return {
    evlog: vi.fn(() => middleware),
  };
});

vi.mock("evlog/better-auth", () => ({
  createAuthMiddleware: vi.fn(() => async () => {
    // no-op
  }),
}));

const authHandlerMock = vi.fn((_req: Request) => new Response("auth ok"));

vi.mock("@pirxey-recruitment-task/auth", () => ({
  auth: {
    handler: authHandlerMock,
  },
}));

vi.mock("@pirxey-recruitment-task/env/server", () => ({
  env: {
    BETTER_AUTH_SECRET: "s".repeat(32),
    BETTER_AUTH_URL: "http://localhost:3000",
    CORS_ORIGIN: "http://localhost:3001",
    DATABASE_URL: "postgresql://postgres:password@localhost:5432/db",
    NODE_ENV: "development",
  },
}));

vi.mock("@pirxey-recruitment-task/api/context", () => ({
  createContext: vi.fn(() => ({
    auth: null,
    session: null,
  })),
}));

vi.mock("@pirxey-recruitment-task/api/routers/index", () => ({
  appRouter: {},
}));

vi.mock("@pirxey-recruitment-task/db", () => ({
  createDb: vi.fn(() => ({})),
  db: {},
}));

describe("server app", () => {
  it.concurrent("GET / returns OK", async () => {
    const { createApp } = await import("../src/index");
    const app = createApp();

    const res = await app.request("/");
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toBe("OK");
  });

  it.concurrent("CORS headers include allowed credentials", async () => {
    const { createApp } = await import("../src/index");
    const app = createApp();

    const res = await app.request("/", {
      headers: { Origin: "http://localhost:3001" },
      method: "OPTIONS",
    });

    expect(res.headers.get("access-control-allow-credentials")).toBe("true");
  });

  it("routes /api/auth/* to the auth handler", async () => {
    const { createApp } = await import("../src/index");
    const app = createApp();

    const res = await app.request("/api/auth/sign-in/email", {
      method: "POST",
    });

    // The handler was called with the request
    expect(authHandlerMock).toHaveBeenCalledTimes(1);

    // The route exists (not a 404)
    expect(res.status).not.toBe(404);

    // The mocked handler returns "auth ok"
    const body = await res.text();
    expect(body).toBe("auth ok");
  });
});
