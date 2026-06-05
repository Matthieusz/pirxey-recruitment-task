import { useInfiniteQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";

import { BookList } from "@/components/shelf/book-list";
import { SearchBar } from "@/components/shelf/search-bar";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { client } from "@/utils/orpc";

const DEMO_USER_NAME = "demo-10m";
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

const Demo10MComponent = () => {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query.trim(), 300);

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
    queryKey: ["books", "demo-10m", debouncedQuery],
  });

  const firstPage = shelfQuery.data?.pages[0];
  const rawBooks = useMemo(
    () => shelfQuery.data?.pages.flatMap((page) => page?.books ?? []) ?? [],
    [shelfQuery.data?.pages]
  );
  const books = useMemo(() => rawBooks.map(mapDbBook), [rawBooks]);

  const handleClearQuery = () => {
    setQuery("");
    searchInputRef.current?.focus();
  };

  const hasNextPage = Boolean(shelfQuery.hasNextPage);
  const totalBooksForState = debouncedQuery ? 1 : books.length;
  const countLabel = debouncedQuery
    ? `${books.length.toLocaleString()} title/author matches loaded${hasNextPage ? "+" : ""}`
    : `${books.length.toLocaleString()} of 10,000,000 rows loaded${hasNextPage ? "+" : ""}`;

  if (shelfQuery.isLoading) {
    return (
      <main className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8 sm:py-14 md:py-20">
        <p className="text-ink-muted">Loading the 10M row demo…</p>
      </main>
    );
  }

  if (!firstPage) {
    return (
      <main className="mx-auto w-full max-w-5xl px-5 py-20 text-center">
        <h1 className="text-2xl font-medium text-ink">10M demo not seeded</h1>
        <p className="mt-2 text-ink-muted">
          Run <code>pnpm db:seed:demo10m</code> after starting and pushing the
          database schema.
        </p>
        <Link
          className="mt-6 inline-flex rounded-sm border border-hairline px-3 py-2 text-[0.875rem] text-ink transition-colors hover:bg-page-edge"
          to="/"
        >
          Back to lightweight demo
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8 sm:py-14 md:py-20">
      <div className="mb-6 flex items-center gap-3 rounded-md border border-hairline bg-page-edge/60 px-4 py-3">
        <span className="rounded-sm bg-magenta/10 px-2 py-0.5 font-mono text-[0.6875rem] font-medium uppercase tracking-wider text-magenta">
          10M Demo
        </span>
        <p className="text-[0.8125rem] text-ink-muted">
          Backed by exactly 10,000,000 real Postgres rows after seeding. Search
          runs server-side against title and author.
        </p>
      </div>

      <header className="mb-10 flex items-baseline justify-between gap-4 md:mb-14">
        <div>
          <h1 className="text-3xl font-medium tracking-tight text-ink md:text-4xl">
            10M Row Shelf
          </h1>
          <p className="mt-1.5 max-w-[55ch] text-[0.9375rem] text-ink-muted">
            Virtualized rendering with cursor-paged Postgres reads.
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

        <BookList
          books={books}
          hasNextPage={hasNextPage}
          isFetchingNextPage={shelfQuery.isFetchingNextPage}
          newBookIds={new Set()}
          onClearQuery={handleClearQuery}
          onLoadMore={() => shelfQuery.fetchNextPage()}
          query={debouncedQuery}
          totalBooks={totalBooksForState}
        />
      </div>
    </main>
  );
};

export const Route = createFileRoute("/demo/10m")({
  component: Demo10MComponent,
  head: () => ({
    meta: [{ title: "Shelf — 10M Row Demo" }],
  }),
});
