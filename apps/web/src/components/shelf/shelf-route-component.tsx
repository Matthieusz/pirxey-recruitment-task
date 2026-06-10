import { getRouteApi, notFound } from "@tanstack/react-router";
import { useRef } from "react";
import type * as React from "react";
import { toast } from "sonner";

import { AddBookForm } from "@/components/shelf/add-book-form";
import { BookList } from "@/components/shelf/book-list";
import { SearchBar } from "@/components/shelf/search-bar";
import { useShelfPage } from "@/hooks/use-shelf-page";
import { orpc } from "@/utils/orpc";

const PAGE_SIZE = 50;
const routeApi = getRouteApi("/shelf/$name");

export const ShelfRouteComponent = (): React.JSX.Element => {
  const { name } = routeApi.useParams();
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
    isOwner,
    newBookIds,
    query,
    setQuery,
    totalBooks,
    user,
  } = useShelfPage({
    mutationFn: async (input) => (await orpc.books.create.call(input)) ?? null,
    name,
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
        <p className="text-ink-muted">Loading shelf…</p>
      </main>
    );
  }

  if (!user) {
    throw notFound();
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8 sm:py-14 md:py-20">
      <header className="mb-10 flex items-baseline justify-between gap-4 md:mb-14">
        <div>
          <h1 className="text-3xl font-medium tracking-tight text-ink md:text-4xl">
            {user.name}&rsquo;s Shelf
          </h1>
          <p className="mt-1.5 max-w-[55ch] text-[0.9375rem] text-ink-muted">
            A record of what&rsquo;s been read.
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

        {isOwner && <AddBookForm onAdd={createBook.mutateAsync} />}

        <BookList
          books={books}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
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
