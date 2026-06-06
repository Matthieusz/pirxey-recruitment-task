import type { RouterClient } from "@orpc/server";

import { booksRouter } from "./books";

export const appRouter = {
  books: booksRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
