import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";

import { AddBookForm } from "@/components/shelf/add-book-form";
import type { NewBookInput } from "@/components/shelf/add-book-form";
import { BookList } from "@/components/shelf/book-list";
import { SearchBar } from "@/components/shelf/search-bar";
import type { Book } from "@/data/books-mock";
import { MOCK_BOOKS } from "@/data/books-mock";

const NEW_BOOK_HIGHLIGHT_MS = 1400;

const createBookId = (): string => {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `b-${crypto.randomUUID()}`;
  }
  return `b-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};

const todayIso = (): string => new Date().toISOString().slice(0, 10);

const HomeComponent = () => {
  const [books, setBooks] = useState<readonly Book[]>(MOCK_BOOKS);
  const [query, setQuery] = useState("");
  const [newBookIds, setNewBookIds] = useState<ReadonlySet<string>>(
    () => new Set<string>()
  );
  const searchInputRef = useRef<HTMLInputElement>(null);

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
    const newBook: Book = {
      author: input.author,
      finishedAt: todayIso(),
      id: createBookId(),
      isbn: input.isbn,
      pages: input.pages,
      rating: input.rating,
      title: input.title,
    };
    setBooks((prev) => [newBook, ...prev]);
    setNewBookIds((prev) => new Set([...prev, newBook.id]));
    window.setTimeout(() => {
      setNewBookIds((prev) => {
        if (!prev.has(newBook.id)) {
          return prev;
        }
        const next = new Set(prev);
        next.delete(newBook.id);
        return next;
      });
    }, NEW_BOOK_HIGHLIGHT_MS);
  };

  const handleClearQuery = () => {
    setQuery("");
    searchInputRef.current?.focus();
  };

  const countLabel =
    filteredBooks.length === books.length
      ? `${books.length} books`
      : `${filteredBooks.length} of ${books.length} books`;

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8 sm:py-14 md:py-20">
      {/* Demo banner */}
      <div className="mb-6 flex items-center gap-3 rounded-md border border-hairline bg-page-edge/60 px-4 py-3">
        <span className="rounded-sm bg-magenta/10 px-2 py-0.5 font-mono text-[0.6875rem] font-medium uppercase tracking-wider text-magenta">
          Demo
        </span>
        <p className="text-[0.8125rem] text-ink-muted">
          This is a demo shelf with mock data.{" "}
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
          to save your own shelf.
        </p>
      </div>

      <header className="mb-10 flex items-baseline justify-between gap-4 md:mb-14">
        <div>
          <h1 className="text-3xl font-medium tracking-tight text-ink md:text-4xl">
            Shelf
          </h1>
          <p className="mt-1.5 max-w-[55ch] text-[0.9375rem] text-ink-muted">
            A private record of what you&rsquo;ve read.
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
          books={filteredBooks}
          newBookIds={newBookIds}
          onClearQuery={handleClearQuery}
          query={query}
          totalBooks={books.length}
        />
      </div>

      <footer className="mt-16 border-t border-hairline pt-6">
        <p className="font-mono text-[0.75rem] text-ink-soft">
          Demo data. Books are stored in memory and reset on reload.{" "}
          <Link
            to="/login"
            className="underline underline-offset-2 transition-colors hover:text-ink"
          >
            Sign up
          </Link>{" "}
          to keep a permanent shelf.
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
