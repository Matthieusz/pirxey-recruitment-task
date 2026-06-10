import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("server env", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("rejects when DATABASE_URL is missing", async () => {
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("BETTER_AUTH_SECRET", "s".repeat(32));
    vi.stubEnv("BETTER_AUTH_URL", "http://localhost:3000");
    vi.stubEnv("CORS_ORIGIN", "http://localhost:3001");

    await expect(
      () => import("@pirxey-recruitment-task/env/server")
    ).rejects.toThrow();
  });

  it("rejects when BETTER_AUTH_SECRET is missing", async () => {
    vi.stubEnv(
      "DATABASE_URL",
      "postgresql://postgres:password@localhost:5432/db"
    );
    vi.stubEnv("BETTER_AUTH_SECRET", "");
    vi.stubEnv("BETTER_AUTH_URL", "http://localhost:3000");
    vi.stubEnv("CORS_ORIGIN", "http://localhost:3001");

    await expect(
      () => import("@pirxey-recruitment-task/env/server")
    ).rejects.toThrow();
  });

  it("rejects when BETTER_AUTH_SECRET is too short", async () => {
    vi.stubEnv(
      "DATABASE_URL",
      "postgresql://postgres:password@localhost:5432/db"
    );
    vi.stubEnv("BETTER_AUTH_SECRET", "short");
    vi.stubEnv("BETTER_AUTH_URL", "http://localhost:3000");
    vi.stubEnv("CORS_ORIGIN", "http://localhost:3001");

    await expect(
      () => import("@pirxey-recruitment-task/env/server")
    ).rejects.toThrow();
  });

  it("rejects when BETTER_AUTH_URL is invalid", async () => {
    vi.stubEnv(
      "DATABASE_URL",
      "postgresql://postgres:password@localhost:5432/db"
    );
    vi.stubEnv("BETTER_AUTH_SECRET", "s".repeat(32));
    vi.stubEnv("BETTER_AUTH_URL", "not-a-url");
    vi.stubEnv("CORS_ORIGIN", "http://localhost:3001");

    await expect(
      () => import("@pirxey-recruitment-task/env/server")
    ).rejects.toThrow();
  });

  it("rejects when CORS_ORIGIN is invalid", async () => {
    vi.stubEnv(
      "DATABASE_URL",
      "postgresql://postgres:password@localhost:5432/db"
    );
    vi.stubEnv("BETTER_AUTH_SECRET", "s".repeat(32));
    vi.stubEnv("BETTER_AUTH_URL", "http://localhost:3000");
    vi.stubEnv("CORS_ORIGIN", "not-a-url");

    await expect(
      () => import("@pirxey-recruitment-task/env/server")
    ).rejects.toThrow();
  });

  it("accepts valid minimal config", async () => {
    vi.stubEnv(
      "DATABASE_URL",
      "postgresql://postgres:password@localhost:5432/db"
    );
    vi.stubEnv("BETTER_AUTH_SECRET", "s".repeat(32));
    vi.stubEnv("BETTER_AUTH_URL", "http://localhost:3000");
    vi.stubEnv("CORS_ORIGIN", "http://localhost:3001");

    const mod = await import("@pirxey-recruitment-task/env/server");
    expect(mod.env.DATABASE_URL).toBe(
      "postgresql://postgres:password@localhost:5432/db"
    );
    expect(mod.env.BETTER_AUTH_SECRET).toBe("s".repeat(32));
  });
});
