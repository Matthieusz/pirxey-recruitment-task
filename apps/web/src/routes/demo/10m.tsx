import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef } from "react";

import { BookList } from "@/components/shelf/book-list";
import { SearchBar } from "@/components/shelf/search-bar";
import { useShelfPage } from "@/hooks/use-shelf-page";

const DEMO_USER_NAME = "demo-10m";
const DEMO_TOTAL_ROWS = 10_000_000;
const PAGE_SIZE = 50;
const MIN_SEARCH_LENGTH = 3;

const Demo10MComponent = () => {
  const searchInputRef = useRef<HTMLInputElement>(null);

  const {
    books,
    countLabel,
    debouncedQuery,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isSearching,
    isLoading,
    newBookIds,
    query,
    setQuery,
    totalBooks,
    user,
  } = useShelfPage({
    minSearchLength: MIN_SEARCH_LENGTH,
    name: DEMO_USER_NAME,
    pageSize: PAGE_SIZE,
    totalCount: DEMO_TOTAL_ROWS,
  });

  const handleClearQuery = () => {
    setQuery("");
    searchInputRef.current?.focus();
  };

  if (isLoading) {
    return (
      <main className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8 sm:py-14 md:py-20">
        <p className="text-ink-muted">Loading the 10M row demo…</p>
      </main>
    );
  }

  if (!user) {
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
          Seeded 10M rows. Search runs server-side against title and author.
          Uses Tanstack Virtual to render it performantly.
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
          isSearching={isSearching}
          onChange={setQuery}
          value={query}
        />

        <BookList
          books={books}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          minSearchLength={MIN_SEARCH_LENGTH}
          newBookIds={newBookIds}
          onClearQuery={handleClearQuery}
          onLoadMore={fetchNextPage}
          query={debouncedQuery}
          rawQuery={query}
          totalBooks={totalBooks}
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
