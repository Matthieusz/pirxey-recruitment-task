import { call } from "@orpc/server";
import type { SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@pirxey-recruitment-task/env/server", () => ({
  env: {
    BETTER_AUTH_SECRET: "s".repeat(32),
    BETTER_AUTH_URL: "http://localhost:3000",
    CORS_ORIGIN: "http://localhost:3001",
    DATABASE_URL: "postgresql://postgres:password@localhost:5432/db",
    NODE_ENV: "development",
  },
}));

type Row = Record<string, unknown>;

let insertResult: Row[] = [];
let userQueryResult: Row[] = [];
let booksQueryResult: Row[] = [];
let limitValues: number[] = [];
let whereConditions: (SQL | undefined)[] = [];

const pgDialect = new PgDialect();

const sqlToQuery = (condition: SQL | undefined) => {
  if (!condition) {
    throw new Error("Expected query condition to be defined.");
  }

  return pgDialect.sqlToQuery(condition);
};

const createChain = (terminalData: Row[] = []) => {
  const thenable = Promise.resolve(terminalData) as Promise<Row[]> & {
    then: (fn: (v: Row[]) => unknown) => Promise<unknown>;
  };

  const returningThenable = Promise.resolve(insertResult) as Promise<Row[]> & {
    then: (fn: (v: Row[]) => unknown) => Promise<unknown>;
  };

  const ch: Record<string, unknown> = {
    from: vi.fn(() => ch),
    limit: vi.fn((value: number) => {
      limitValues.push(value);
      return thenable;
    }),
    onConflictDoNothing: vi.fn(() => Promise.resolve()),
    orderBy: vi.fn(() => ch),
    returning: vi.fn(() => returningThenable),
    values: vi.fn(() => ch),
    where: vi.fn((condition: SQL | undefined) => {
      whereConditions.push(condition);
      return ch;
    }),
  };
  return ch;
};

const mockDb = {
  insert: vi.fn(() => createChain()),
  select: vi.fn((fields?: unknown) =>
    createChain(fields ? userQueryResult : booksQueryResult)
  ),
};

vi.mock("@pirxey-recruitment-task/db", () => ({
  createDb: vi.fn(() => mockDb),
  db: mockDb,
}));

/** Row as returned from the database (includes userId). */
interface BookRow extends Record<string, unknown> {
  author: string;
  finishedAt: string;
  id: number;
  isbn: string;
  pages: number;
  rating: number;
  title: string;
  userId: string;
}

/** Output shape after `bookSchema.parse()` — userId is stripped. */
type BookOutput = Omit<BookRow, "userId">;

const createBookRow = (overrides?: Partial<BookRow>): BookRow => ({
  author: "J.R.R. Tolkien",
  finishedAt: new Date().toISOString().slice(0, 10),
  id: 1,
  isbn: "9780547928227",
  pages: 423,
  rating: 5,
  title: "The Hobbit",
  userId: "user-1",
  ...overrides,
});

const createBookOutput = (overrides?: Partial<BookOutput>): BookOutput => ({
  author: "J.R.R. Tolkien",
  finishedAt: new Date().toISOString().slice(0, 10),
  id: 1,
  isbn: "9780547928227",
  pages: 423,
  rating: 5,
  title: "The Hobbit",
  ...overrides,
});

const validBook = {
  author: "J.R.R. Tolkien",
  isbn: "9780547928227",
  pages: 423,
  rating: 5,
  title: "The Hobbit",
} as const;

const authCtx = {
  auth: null,
  session: {
    session: {
      createdAt: new Date("2024-01-01T00:00:00Z"),
      expiresAt: new Date("2024-01-02T00:00:00Z"),
      id: "session-1",
      token: "token-1",
      updatedAt: new Date("2024-01-01T00:00:00Z"),
      userId: "user-1",
    },
    user: {
      createdAt: new Date("2024-01-01T00:00:00Z"),
      email: "user@example.com",
      emailVerified: true,
      id: "user-1",
      name: "reader",
      updatedAt: new Date("2024-01-01T00:00:00Z"),
    },
  },
};

const anonCtx = { auth: null as null, session: null };

describe("booksRouter", () => {
  beforeEach(() => {
    insertResult = [];
    limitValues = [];
    userQueryResult = [];
    booksQueryResult = [];
    whereConditions = [];
    vi.clearAllMocks();
  });

  // -- create (protected) -------------------------------------------------

  describe("create", () => {
    it("throws UNAUTHORIZED when no session", async () => {
      const { booksRouter } = await import("./books");

      await expect(() =>
        call(booksRouter.create, validBook, { context: anonCtx })
      ).rejects.toThrow("Unauthorized");
    });

    it("inserts a book for the authenticated user", async () => {
      const { booksRouter } = await import("./books");
      const created = createBookOutput({ author: "Jane Austen", id: 7 });
      insertResult = [createBookRow({ author: "Jane Austen", id: 7 })];

      const result = await call(booksRouter.create, validBook, {
        context: authCtx,
      });

      expect(result).toEqual(created);
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it("returns undefined when insert produces no rows", async () => {
      const { booksRouter } = await import("./books");
      insertResult = [];

      const result = await call(booksRouter.create, validBook, {
        context: authCtx,
      });

      expect(result).toBeUndefined();
    });
  });

  // -- createAnonymous (public) -------------------------------------------

  describe("createAnonymous", () => {
    it("inserts a book without auth", async () => {
      const { booksRouter } = await import("./books");
      const created = createBookOutput({ id: 42 });
      insertResult = [createBookRow({ id: 42 })];

      const result = await call(booksRouter.createAnonymous, validBook, {
        context: anonCtx,
      });

      expect(result).toEqual(created);
    });

    it("attempts to ensure demo user before inserting", async () => {
      const { booksRouter } = await import("./books");
      insertResult = [createBookRow()];

      await call(booksRouter.createAnonymous, validBook, {
        context: anonCtx,
      });

      // Two inserts: one for user (onConflictDoNothing), one for book
      expect(mockDb.insert).toHaveBeenCalledTimes(2);
    });
  });

  // -- list (protected) ---------------------------------------------------

  describe("list", () => {
    it("throws UNAUTHORIZED when no session", async () => {
      const { booksRouter } = await import("./books");

      await expect(() =>
        call(booksRouter.list, {}, { context: anonCtx })
      ).rejects.toThrow("Unauthorized");
    });

    it("returns paginated books for the authenticated user", async () => {
      const { booksRouter } = await import("./books");
      const book = createBookRow({ id: 1 });
      booksQueryResult = [book];

      const result = await call(
        booksRouter.list,
        { limit: 50 },
        {
          context: authCtx,
        }
      );

      expect(result.books).toHaveLength(1);
      expect(result.books[0]?.id).toBe(1);
    });

    it("returns nextCursor when there is a next page", async () => {
      const { booksRouter } = await import("./books");
      // limit=3 → db queries 4 rows → returns 4 → hasNextPage=true
      booksQueryResult = Array.from({ length: 4 }, (_, i) =>
        createBookRow({ finishedAt: `2024-01-${10 + i}`, id: i + 1 })
      );

      const result = await call(
        booksRouter.list,
        { limit: 3 },
        {
          context: authCtx,
        }
      );

      expect(result.books).toHaveLength(3);
      expect(result.nextCursor).not.toBeNull();
    });

    it("returns null nextCursor when no more pages", async () => {
      const { booksRouter } = await import("./books");
      booksQueryResult = [createBookRow()];

      const result = await call(
        booksRouter.list,
        { limit: 50 },
        {
          context: authCtx,
        }
      );

      expect(result.nextCursor).toBeNull();
    });

    it("filters by query when provided", async () => {
      const { booksRouter } = await import("./books");
      booksQueryResult = [createBookRow({ title: "Foundation" })];

      const result = await call(
        booksRouter.list,
        { limit: 50, query: "Foundation" },
        { context: authCtx }
      );

      expect(result.books).toHaveLength(1);
      expect(result.books[0]?.title).toBe("Foundation");

      const query = sqlToQuery(whereConditions.at(-1));
      expect(query.sql).toContain("to_tsvector");
      expect(query.sql).toContain("to_tsquery");
      expect(query.params).toEqual(["user-1", "Foundation:*"]);
    });
  });

  // -- getShelfByName (public) --------------------------------------------

  describe("getShelfByName", () => {
    it("returns null when user does not exist", async () => {
      const { booksRouter } = await import("./books");

      // no user found
      userQueryResult = [];

      const result = await call(
        booksRouter.getShelfByName,
        { name: "nobody" },
        { context: anonCtx }
      );

      expect(result).toBeNull();
    });

    it("returns shelf page for an existing user", async () => {
      const { booksRouter } = await import("./books");
      const book = createBookRow({ id: 5, userId: "user-5" });

      userQueryResult = [{ id: "user-5", name: "alice" }];
      booksQueryResult = [book];

      const result = await call(
        booksRouter.getShelfByName,
        { limit: 50, name: "alice" },
        { context: anonCtx }
      );

      expect(result).not.toBeNull();
      expect(result?.user.name).toBe("alice");
      expect(result?.user.id).toBe("user-5");
      expect(result?.books).toHaveLength(1);
      expect(result?.books[0]?.id).toBe(5);
    });

    it("passes query and cursor to the books list", async () => {
      const { booksRouter } = await import("./books");
      const book = createBookRow({ id: 9, title: "Dune", userId: "user-9" });

      userQueryResult = [{ id: "user-9", name: "frank" }];
      booksQueryResult = [book];

      const result = await call(
        booksRouter.getShelfByName,
        { cursor: "2024-03-01|42", limit: 25, name: "frank", query: "Dune" },
        { context: anonCtx }
      );

      expect(result?.books).toHaveLength(1);
      expect(result?.books[0]?.title).toBe("Dune");
      expect(result?.nextCursor).toBeNull();

      const query = sqlToQuery(whereConditions.at(-1));
      expect(query.sql).toContain("to_tsquery");
      expect(query.sql).toContain('("books"."finished_at", "books"."id") <');
      expect(query.params).toEqual(["user-9", "Dune:*", "2024-03-01", 42]);
      expect(limitValues.at(-1)).toBe(26);
    });
  });
});
