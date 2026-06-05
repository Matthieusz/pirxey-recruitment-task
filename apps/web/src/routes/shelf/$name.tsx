import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, getRouteApi, notFound } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import type { NewBookInput } from "@/components/shelf/add-book-form";
import { AddBookForm } from "@/components/shelf/add-book-form";
import { BookList } from "@/components/shelf/book-list";
import { SearchBar } from "@/components/shelf/search-bar";
import { authClient } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";

const NEW_BOOK_HIGHLIGHT_MS = 1400;
const routeApi = getRouteApi("/shelf/$name");

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

const RouteComponent = () => {
  const { name } = routeApi.useParams();
  const queryClient = useQueryClient();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [newBookIds, setNewBookIds] = useState<ReadonlySet<string>>(
    () => new Set<string>()
  );

  const { data: session } = authClient.useSession();
  const isOwner = session?.user?.name === name;

  const shelfQuery = useQuery({
    ...orpc.books.getShelfByName.queryOptions({ input: { name } }),
  });

  const createBook = useMutation(
    orpc.books.create.mutationOptions({
      onError: (error) => {
        toast.error(error.message);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.books.getShelfByName.queryKey({ input: { name } }),
        });
      },
    })
  );

  const rawBooks = useMemo(
    () => shelfQuery.data?.books ?? [],
    [shelfQuery.data?.books]
  );

  // Stable reference to avoid re-mapping on every render
  const books = useMemo(() => rawBooks.map(mapDbBook), [rawBooks]);

  const userProfile = shelfQuery.data?.user;

  const filteredBooks = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (trimmed === "") {
      return books;
    }
    return books.filter(
      (book) =>
        book.title.toLowerCase().includes(trimmed) ||
        book.author.toLowerCase().includes(trimmed)
    );
  }, [books, query]);

  const handleAdd = (input: NewBookInput) => {
    createBook.mutate(input, {
      onSuccess: () => {
        const optimisticId = `b-optimistic-${Date.now()}`;
        setNewBookIds((prev) => new Set([...prev, optimisticId]));
        window.setTimeout(() => {
          setNewBookIds((prev) => {
            const next = new Set(prev);
            next.delete(optimisticId);
            return next;
          });
        }, NEW_BOOK_HIGHLIGHT_MS);
      },
    });
  };

  const handleClearQuery = () => {
    setQuery("");
    searchInputRef.current?.focus();
  };

  const countLabel =
    filteredBooks.length === books.length
      ? `${books.length} books`
      : `${filteredBooks.length} of ${books.length} books`;

  if (shelfQuery.isLoading) {
    return (
      <main className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8 sm:py-14 md:py-20">
        <p className="text-ink-muted">Loading shelf…</p>
      </main>
    );
  }

  if (!shelfQuery.data || !userProfile) {
    throw notFound();
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8 sm:py-14 md:py-20">
      <header className="mb-10 flex items-baseline justify-between gap-4 md:mb-14">
        <div>
          <h1 className="text-3xl font-medium tracking-tight text-ink md:text-4xl">
            {userProfile.name}&rsquo;s Shelf
          </h1>
          <p className="mt-1.5 max-w-[55ch] text-[0.9375rem] text-ink-muted">
            A private record of what&rsquo;s been read.
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

        {isOwner && <AddBookForm onAdd={handleAdd} />}

        <BookList
          books={filteredBooks}
          newBookIds={newBookIds}
          onClearQuery={handleClearQuery}
          query={query}
          totalBooks={books.length}
        />
      </div>
    </main>
  );
};

export const Route = createFileRoute("/shelf/$name")({
  component: RouteComponent,
  errorComponent: ({ error }) => {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code: string }).code === "NOT_FOUND"
    ) {
      return (
        <main className="mx-auto w-full max-w-5xl px-5 py-20 text-center">
          <h1 className="text-2xl font-medium text-ink">Shelf not found</h1>
          <p className="mt-2 text-ink-muted">No user with that name exists.</p>
        </main>
      );
    }
    return (
      <main className="mx-auto w-full max-w-5xl px-5 py-20 text-center">
        <h1 className="text-2xl font-medium text-ink">Something went wrong</h1>
        <p className="mt-2 text-ink-muted">{(error as Error)?.message}</p>
      </main>
    );
  },
  head: ({ params }) => ({
    meta: [{ title: `${params.name}'s Shelf` }],
  }),
});
