import { cn } from "@pirxey-recruitment-task/ui/lib/utils";
import { SearchX } from "lucide-react";

import type { Book } from "@/data/books-mock";

import { RatingDisplay } from "./rating";

const formatFinished = (iso: string): string => {
  const parsed = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) {
    return iso;
  }
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  });
};

const formatPages = (pages: number): string =>
  `${pages.toLocaleString("en-US")} pp`;

interface BookRowProps {
  readonly book: Book;
  readonly isNew: boolean;
}

const BookRow = ({ book, isNew }: BookRowProps) => (
  <li
    className={cn(
      "group/row grid grid-cols-[1fr_auto] items-start gap-x-4 px-3 py-4",
      "md:grid-cols-[minmax(0,1fr)_auto_8.5rem_4.5rem_5rem] md:items-center md:gap-x-8 md:px-4 md:py-4",
      "transition-colors duration-150 hover:bg-page-edge/50",
      isNew ? "[animation:shelf-row-flash_1400ms_ease-out_forwards]" : null
    )}
  >
    <div className="min-w-0 md:col-start-1">
      <h3
        className={cn(
          "font-serif text-[1.0625rem] leading-snug text-ink",
          "md:text-[1.125rem]"
        )}
      >
        {book.title}
      </h3>
      <p className="mt-0.5 truncate text-[0.875rem] text-ink-muted">
        {book.author}
      </p>
    </div>

    <div className="mt-1 self-start justify-self-end md:col-start-2 md:mt-0 md:self-center">
      <RatingDisplay value={book.rating} />
    </div>

    <p
      aria-label={`ISBN ${book.isbn}`}
      className="hidden md:col-start-3 md:block md:font-mono md:text-[0.8125rem] md:tracking-[-0.005em] md:text-ink-soft"
    >
      {book.isbn}
    </p>

    <p
      aria-label={`${book.pages} pages`}
      className="hidden md:col-start-4 md:block md:text-right md:font-mono md:text-[0.8125rem] md:tabular-nums md:text-ink-soft"
    >
      {formatPages(book.pages)}
    </p>

    <p
      aria-label={`Finished ${formatFinished(book.finishedAt)}`}
      className="hidden md:col-start-5 md:block md:text-right md:text-[0.8125rem] md:text-ink-soft"
    >
      {formatFinished(book.finishedAt)}
    </p>

    <p className="col-span-2 mt-2 font-mono text-[0.75rem] text-ink-soft md:hidden">
      <span>{book.isbn}</span>
      <span className="mx-2 text-ink-soft/50">·</span>
      <span>{formatPages(book.pages)}</span>
      <span className="mx-2 text-ink-soft/50">·</span>
      <span className="font-sans">{formatFinished(book.finishedAt)}</span>
    </p>
  </li>
);

interface NoMatchesProps {
  readonly onClearQuery: () => void;
  readonly query: string;
}

const NoMatches = ({ onClearQuery, query }: NoMatchesProps) => (
  <div className="border-y border-hairline px-4 py-14 text-center">
    <SearchX aria-hidden="true" className="mx-auto size-5 text-ink-soft" />
    <p className="mt-3 text-[0.9375rem] text-ink">
      No books match <span className="font-medium">&ldquo;{query}&rdquo;</span>.
    </p>
    <p className="mt-1 text-[0.8125rem] text-ink-muted">
      Try a different title or author.
    </p>
    <button
      className={cn(
        "mt-4 rounded-sm px-2 py-1 text-[0.8125rem] text-magenta-soft",
        "transition-colors hover:bg-page-edge hover:text-magenta",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta-soft/30"
      )}
      onClick={onClearQuery}
      type="button"
    >
      Clear search
    </button>
  </div>
);

const EmptyShelf = () => (
  <div className="border-y border-hairline px-4 py-16 text-center">
    <p className="font-serif text-lg text-ink">Nothing on the shelf yet.</p>
    <p className="mt-2 text-[0.875rem] text-ink-muted">
      Add a book you&rsquo;ve finished and it will land here.
    </p>
  </div>
);

interface BookListProps {
  readonly books: readonly Book[];
  readonly newBookIds: ReadonlySet<string>;
  readonly onClearQuery: () => void;
  readonly query: string;
  readonly totalBooks: number;
}

export const BookList = ({
  books,
  newBookIds,
  onClearQuery,
  query,
  totalBooks,
}: BookListProps) => {
  if (totalBooks === 0) {
    return <EmptyShelf />;
  }

  if (books.length === 0) {
    return <NoMatches onClearQuery={onClearQuery} query={query} />;
  }

  return (
    <section aria-label="Book shelf">
      <ul className="divide-y divide-hairline border-y border-hairline">
        {books.map((book) => (
          <BookRow book={book} isNew={newBookIds.has(book.id)} key={book.id} />
        ))}
      </ul>
    </section>
  );
};
