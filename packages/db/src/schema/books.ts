import { relations } from "drizzle-orm";
import {
  bigserial,
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

export const books = pgTable(
  "books",
  {
    author: text("author").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    finishedAt: date("finished_at").defaultNow().notNull(),
    id: bigserial("id", { mode: "number" }).primaryKey(),
    isbn: text("isbn").notNull(),
    pages: integer("pages").notNull(),
    rating: integer("rating").notNull(),
    title: text("title").notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("books_user_id_finished_at_idx").on(table.userId, table.finishedAt),
    index("books_title_author_idx").on(table.title, table.author),
  ]
);

export const booksRelations = relations(books, ({ one }) => ({
  user: one(user, {
    fields: [books.userId],
    references: [user.id],
  }),
}));
