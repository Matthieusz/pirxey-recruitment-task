import { db } from "@pirxey-recruitment-task/db";
import { user } from "@pirxey-recruitment-task/db/schema/auth";
import { books } from "@pirxey-recruitment-task/db/schema/books";
import { and, desc, eq, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";

import { protectedProcedure, publicProcedure } from "../index";
import {
  bookSchema,
  createBookSchema,
  listBooksSchema,
  shelfBooksSchema,
} from "../validators/books";

const encodeCursor = (book: { finishedAt: string; id: number }) =>
  `${book.finishedAt}|${book.id}`;

const decodeCursor = (cursor?: string) => {
  if (!cursor) {
    return null;
  }

  const [finishedAt, rawId] = cursor.split("|");
  const id = Number(rawId);

  if (
    !/^\d{4}-\d{2}-\d{2}$/u.test(finishedAt ?? "") ||
    !Number.isSafeInteger(id)
  ) {
    return null;
  }

  return { finishedAt: finishedAt as string, id };
};

interface ListBooksInput {
  readonly cursor?: string;
  readonly limit: number;
  readonly query?: string;
}

const escapeLikePattern = (value: string): string =>
  value.replaceAll("\\", "\\\\").replaceAll("%", "\\%").replaceAll("_", "\\_");

const titleAuthorSearchCondition = (query: string): SQL => {
  const containsPattern = `%${escapeLikePattern(query)}%`;

  return sql`(to_tsvector('simple', ${books.title} || ' ' || ${books.author}) @@ websearch_to_tsquery('simple', ${query}) OR ${books.title} ILIKE ${containsPattern} ESCAPE '\\' OR ${books.author} ILIKE ${containsPattern} ESCAPE '\\')`;
};

const listBooksForUser = async (userId: string, input: ListBooksInput) => {
  const query = input.query?.trim();
  const cursor = decodeCursor(input.cursor);
  const conditions: SQL[] = [eq(books.userId, userId)];

  if (query) {
    conditions.push(titleAuthorSearchCondition(query));
  }

  if (cursor) {
    conditions.push(
      sql`(${books.finishedAt}, ${books.id}) < (${cursor.finishedAt}::date, ${cursor.id})`
    );
  }

  const page = await db
    .select()
    .from(books)
    .where(and(...conditions))
    .orderBy(desc(books.finishedAt), desc(books.id))
    .limit(input.limit + 1);

  const hasNextPage = page.length > input.limit;
  const visibleBooks = hasNextPage ? page.slice(0, input.limit) : page;
  const lastBook = visibleBooks.at(-1);

  return {
    books: visibleBooks,
    nextCursor: hasNextPage && lastBook ? encodeCursor(lastBook) : null,
  };
};

const DEMO_USER_ID = "demo";
const DEMO_USER_NAME = "demo";
const DEMO_USER_EMAIL = "demo@example.com";

const ensureDemoUser = async () => {
  await db
    .insert(user)
    .values({
      createdAt: new Date(),
      email: DEMO_USER_EMAIL,
      emailVerified: true,
      id: DEMO_USER_ID,
      name: DEMO_USER_NAME,
      updatedAt: new Date(),
    })
    .onConflictDoNothing();
};

export const booksRouter = {
  /**
   * Create a book for the currently authenticated user.
   */
  create: protectedProcedure
    .input(createBookSchema)
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      const [inserted] = await db
        .insert(books)
        .values({
          author: input.author,
          finishedAt: new Date().toISOString().slice(0, 10),
          isbn: input.isbn,
          pages: input.pages,
          rating: input.rating,
          title: input.title,
          userId,
        })
        .returning();

      return inserted ? bookSchema.parse(inserted) : undefined;
    }),

  /**
   * Create a book for the shared local demo user (no auth required).
   * Intended for local demo/development use only.
   */
  createAnonymous: publicProcedure
    .input(createBookSchema)
    .handler(async ({ input }) => {
      await ensureDemoUser();

      const [inserted] = await db
        .insert(books)
        .values({
          author: input.author,
          finishedAt: new Date().toISOString().slice(0, 10),
          isbn: input.isbn,
          pages: input.pages,
          rating: input.rating,
          title: input.title,
          userId: DEMO_USER_ID,
        })
        .returning();

      return inserted ? bookSchema.parse(inserted) : undefined;
    }),

  /**
   * Publicly fetch a user's shelf by name, ordered by most recently finished first.
   */
  getShelfByName: publicProcedure
    .input(shelfBooksSchema)
    .handler(async ({ input }) => {
      const [profile] = await db
        .select({ id: user.id, name: user.name })
        .from(user)
        .where(eq(user.name, input.name))
        .limit(1);

      if (!profile) {
        return null;
      }

      const page = await listBooksForUser(profile.id, input);

      return {
        ...page,
        user: profile,
      };
    }),

  /**
   * List the signed-in user's books, ordered by most recently finished first.
   * Optional `query` filters by title or author using Postgres full-text search.
   */
  list: protectedProcedure
    .input(listBooksSchema)
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      return await listBooksForUser(userId, input);
    }),
};
