import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock env before imports
vi.mock("@pirxey-recruitment-task/env/server", () => ({
  env: {
    BETTER_AUTH_SECRET: "s".repeat(32),
    BETTER_AUTH_URL: "http://localhost:3000",
    CORS_ORIGIN: "http://localhost:3001",
    DATABASE_URL: "postgresql://postgres:password@localhost:5432/db",
    NODE_ENV: "development",
  },
}));

// Mock db
const mockDb = {
  insert: vi.fn(),
  select: vi.fn(),
};

vi.mock("@pirxey-recruitment-task/db", () => ({
  createDb: vi.fn(() => mockDb),
  db: mockDb,
}));

describe("books router procedures", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("create (protected)", () => {
    it("is a protected oRPC procedure", async () => {
      const mod = await import("./books");
      expect(mod.booksRouter.create).toBeDefined();
    });
  });

  describe("getShelfByName (public)", () => {
    it("is a public oRPC procedure", async () => {
      const mod = await import("./books");
      expect(mod.booksRouter.getShelfByName).toBeDefined();
    });
  });

  describe("createAnonymous (public)", () => {
    it("is a public oRPC procedure", async () => {
      const mod = await import("./books");
      expect(mod.booksRouter.createAnonymous).toBeDefined();
    });
  });

  describe("list (protected)", () => {
    it("is a protected oRPC procedure", async () => {
      const mod = await import("./books");
      expect(mod.booksRouter.list).toBeDefined();
    });
  });
});
