import { db } from "@pirxey-recruitment-task/db";
import { books } from "@pirxey-recruitment-task/db/schema/books";
import { and, desc, eq, ilike, or } from "drizzle-orm";

import { protectedProcedure, publicProcedure } from "../index";
import {
  createBookSchema,
  listBooksSchema,
  nameSchema,
} from "../validators/books";

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

      return inserted;
    }),

  /**
   * Publicly fetch a user's shelf by name, ordered by most recently finished first.
   */
  getShelfByName: publicProcedure
    .input(nameSchema)
    .handler(async ({ input }) => {
      const { user } = await import("@pirxey-recruitment-task/db/schema/auth");

      // Look up the user by name
      const [profile] = await db
        .select({ id: user.id, name: user.name })
        .from(user)
        .where(eq(user.name, input.name))
        .limit(1);

      if (!profile) {
        return null;
      }

      const shelfBooks = await db
        .select()
        .from(books)
        .where(eq(books.userId, profile.id))
        .orderBy(desc(books.finishedAt), desc(books.createdAt));

      return {
        books: shelfBooks,
        user: profile,
      };
    }),

  /**
   * List the signed-in user's books, ordered by most recently finished first.
   * Optional `query` filters by title or author (case-insensitive).
   */
  list: protectedProcedure
    .input(listBooksSchema)
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;
      const query = input.query?.trim();

      const conditions = [eq(books.userId, userId)];

      if (query) {
        conditions.push(
          or(
            ilike(books.title, `%${query}%`),
            ilike(books.author, `%${query}%`)
          )
        );
      }

      return await db
        .select()
        .from(books)
        .where(and(...conditions))
        .orderBy(desc(books.finishedAt), desc(books.createdAt));
    }),
};
