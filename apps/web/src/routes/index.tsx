import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef } from "react";
import { toast } from "sonner";

import { AddBookForm } from "@/components/shelf/add-book-form";
import { BookList } from "@/components/shelf/book-list";
import { SearchBar } from "@/components/shelf/search-bar";
import { useShelfPage } from "@/hooks/use-shelf-page";
import { client } from "@/utils/orpc";

const DEMO_USER_NAME = "demo";
const PAGE_SIZE = 50;

const HomeComponent = () => {
  const searchInputRef = useRef<HTMLInputElement>(null);

  const {
    books,
    countLabel,
    createBook,
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
  } = useShelfPage({
    mutationFn: async (input) =>
      (await client.books.createAnonymous(input)) ?? null,
    name: DEMO_USER_NAME,
    onMutationError: (error) => {
      toast.error(error.message);
    },
    pageSize: PAGE_SIZE,
  });

  const handleClearQuery = () => {
    setQuery("");
    searchInputRef.current?.focus();
  };

  if (isLoading) {
    return (
      <main className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8 sm:py-14 md:py-20">
        <p className="text-ink-muted">Loading demo shelf…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8 sm:py-14 md:py-20">
      <div className="mb-6 flex items-center gap-3 rounded-md border border-hairline bg-page-edge/60 px-4 py-3">
        <span className="rounded-sm bg-magenta/10 px-2 py-0.5 font-mono text-[0.6875rem] font-medium uppercase tracking-wider text-magenta">
          Demo
        </span>
        <p className="text-[0.8125rem] text-ink-muted">
          A public demo shelf — anyone can add books.{" "}
          <Link
            className="font-medium text-ink underline underline-offset-2 transition-colors hover:text-magenta"
            to="/login"
          >
            Sign up
          </Link>{" "}
          or{" "}
          <Link
            className="font-medium text-ink underline underline-offset-2 transition-colors hover:text-magenta"
            to="/login"
          >
            sign in
          </Link>{" "}
          to create your own private shelf.
        </p>
        <Link
          className="ml-auto shrink-0 rounded-sm bg-magenta px-3 py-1.5 text-[0.8125rem] font-medium text-white transition-colors hover:bg-magenta-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta-soft/30"
          to="/demo/10m"
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
        <AddBookForm onAdd={createBook.mutate} />
        <BookList
          books={books}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          isSearching={isSearching}
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

export const Route = createFileRoute("/")({
  component: HomeComponent,
  head: () => ({
    meta: [{ title: "Shelf — Demo" }],
  }),
});
