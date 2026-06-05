import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import type { NewBookInput } from "@/components/shelf/add-book-form";
import { AddBookForm } from "@/components/shelf/add-book-form";
import { BookList } from "@/components/shelf/book-list";
import { SearchBar } from "@/components/shelf/search-bar";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { client } from "@/utils/orpc";

const DEMO_USER_NAME = "demo";
const NEW_BOOK_HIGHLIGHT_MS = 1400;
const PAGE_SIZE = 50;

const mapDbBook = (db: {
  author: string;
  finishedAt: string;
  id: number;
  isbn: string;
  pages: number;
  rating: number;
  title: string;
}) => ({
  author: db.author,
  finishedAt: db.finishedAt,
  id: `b-${db.id}`,
  isbn: db.isbn,
  pages: db.pages,
  rating: db.rating as 1 | 2 | 3 | 4 | 5,
  title: db.title,
});

const HomeComponent = () => {
  const queryClient = useQueryClient();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query.trim(), 300);
  const [newBookIds, setNewBookIds] = useState<ReadonlySet<string>>(
    () => new Set<string>()
  );

  const shelfQuery = useInfiniteQuery({
    getNextPageParam: (page) => page?.nextCursor ?? undefined,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      client.books.getShelfByName({
        cursor: pageParam ?? undefined,
        limit: PAGE_SIZE,
        name: DEMO_USER_NAME,
        query: debouncedQuery || undefined,
      }),
    queryKey: ["books", "shelf", DEMO_USER_NAME, debouncedQuery],
  });

  const createBook = useMutation({
    mutationFn: (input: NewBookInput) =>
      client.books.createAnonymous(input) as Promise<{ id: number } | null>,
    onError: (error: Error) => {
      toast.error(error.message);
    },
    onSuccess: (inserted) => {
      const newBookId = inserted ? `b-${inserted.id}` : null;
      if (newBookId) {
        setNewBookIds((prev) => new Set([...prev, newBookId]));
        window.setTimeout(() => {
          setNewBookIds((prev) => {
            const next = new Set(prev);
            next.delete(newBookId);
            return next;
          });
        }, NEW_BOOK_HIGHLIGHT_MS);
      }

      queryClient.invalidateQueries({
        queryKey: ["books", "shelf", DEMO_USER_NAME],
      });
    },
  });

  const rawBooks = useMemo(
    () => shelfQuery.data?.pages.flatMap((page) => page?.books ?? []) ?? [],
    [shelfQuery.data?.pages]
  );

  const books = useMemo(() => rawBooks.map(mapDbBook), [rawBooks]);

  const handleAdd = (input: NewBookInput) => {
    createBook.mutate(input);
  };

  const handleClearQuery = () => {
    setQuery("");
    searchInputRef.current?.focus();
  };

  const hasNextPage = Boolean(shelfQuery.hasNextPage);
  const countLabel = debouncedQuery
    ? `${books.length.toLocaleString()} matches loaded${hasNextPage ? "+" : ""}`
    : `${books.length.toLocaleString()} books loaded${hasNextPage ? "+" : ""}`;

  if (shelfQuery.isLoading) {
    return (
      <main className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8 sm:py-14 md:py-20">
        <p className="text-ink-muted">Loading demo shelf…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8 sm:py-14 md:py-20">
      {/* Demo banner */}
      <div className="mb-6 flex items-center gap-3 rounded-md border border-hairline bg-page-edge/60 px-4 py-3">
        <span className="rounded-sm bg-magenta/10 px-2 py-0.5 font-mono text-[0.6875rem] font-medium uppercase tracking-wider text-magenta">
          Demo
        </span>
        <p className="text-[0.8125rem] text-ink-muted">
          A shared public demo shelf — anyone can add books.{" "}
          <Link
            to="/login"
            className="font-medium text-ink underline underline-offset-2 transition-colors hover:text-magenta"
          >
            Sign up
          </Link>{" "}
          or{" "}
          <Link
            to="/login"
            className="font-medium text-ink underline underline-offset-2 transition-colors hover:text-magenta"
          >
            sign in
          </Link>{" "}
          to create your own private shelf.
        </p>
        <Link
          to="/demo/10m"
          className="ml-auto shrink-0 rounded-sm bg-magenta px-3 py-1.5 text-[0.8125rem] font-medium text-white transition-colors hover:bg-magenta-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta-soft/30"
        >
          View 10M row demo
        </Link>
      </div>

      <header className="mb-10 flex items-baseline justify-between gap-4 md:mb-14">
        <div>
          <h1 className="text-3xl font-medium tracking-tight text-ink md:text-4xl">
            Shelf
          </h1>
          <p className="mt-1.5 max-w-[55ch] text-[0.9375rem] text-ink-muted">
            A record of what you&rsquo;ve read.
          </p>
        </div>
        <p
          aria-live="polite"
          className="shrink-0 font-mono text-[0.8125rem] text-ink-soft tabular-nums"
        >
          {countLabel}
        </p>
      </header>

      <div className="space-y-5 md:space-y-7">
        <SearchBar
          inputRef={searchInputRef}
          onChange={setQuery}
          value={query}
        />
        <AddBookForm onAdd={handleAdd} />
        <BookList
          books={books}
          hasNextPage={hasNextPage}
          isFetchingNextPage={shelfQuery.isFetchingNextPage}
          newBookIds={newBookIds}
          onClearQuery={handleClearQuery}
          onLoadMore={() => shelfQuery.fetchNextPage()}
          query={debouncedQuery}
          totalBooks={books.length}
        />
      </div>

      <footer className="mt-16 border-t border-hairline pt-6">
        <p className="font-mono text-[0.75rem] text-ink-soft">
          Shared demo shelf — books persist in Postgres.{" "}
          <Link
            to="/login"
            className="underline underline-offset-2 transition-colors hover:text-ink"
          >
            Sign up
          </Link>{" "}
          to keep a permanent private shelf.
        </p>
      </footer>
    </main>
  );
};

export const Route = createFileRoute("/")({
  component: HomeComponent,
  head: () => ({
    meta: [{ title: "Shelf — Demo" }],
  }),
});
