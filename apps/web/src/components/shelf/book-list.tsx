import type { Book } from "@pirxey-recruitment-task/api/validators/books";
import { cn } from "@pirxey-recruitment-task/ui/lib/utils";
import { useVirtualizer } from "@tanstack/react-virtual";
import { SearchX } from "lucide-react";
import { useEffect, useEffectEvent, useRef } from "react";
import type { CSSProperties } from "react";

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
  readonly dataIndex: number;
  readonly isNew: boolean;
  readonly measureElement?: (element: HTMLLIElement | null) => void;
  readonly style?: CSSProperties;
}

const BookRow = ({
  book,
  dataIndex,
  isNew,
  measureElement,
  style,
}: BookRowProps) => (
  <li
    className={cn(
      "group/row absolute left-0 top-0 grid w-full grid-cols-[1fr_auto] items-start gap-x-4 border-b border-hairline px-3 py-4",
      "md:grid-cols-[minmax(0,1fr)_auto_8.5rem_4.5rem_5rem] md:items-center md:gap-x-8 md:px-4 md:py-4",
      "transition-colors duration-150 hover:bg-page-edge/50",
      isNew ? "[animation:shelf-row-flash_1400ms_ease-out_forwards]" : null
    )}
    data-index={dataIndex}
    ref={measureElement}
    style={style}
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

const LoadingRow = ({
  dataIndex,
  measureElement,
  style,
}: {
  readonly dataIndex: number;
  readonly measureElement?: (element: HTMLLIElement | null) => void;
  readonly style: CSSProperties;
}) => (
  <li
    className="absolute left-0 top-0 flex w-full items-center justify-center border-b border-hairline px-4 py-6 text-[0.875rem] text-ink-muted"
    data-index={dataIndex}
    ref={measureElement}
    style={style}
  >
    Loading more books…
  </li>
);

interface BookListProps {
  readonly books: readonly Book[];
  readonly hasNextPage?: boolean;
  readonly isFetchingNextPage?: boolean;
  readonly minSearchLength?: number;
  readonly newBookIds: ReadonlySet<number>;
  readonly onClearQuery: () => void;
  readonly onLoadMore?: () => void;
  readonly query: string;
  readonly rawQuery?: string;
  readonly totalBooks: number;
}

export const BookList = ({
  books,
  hasNextPage = false,
  isFetchingNextPage = false,
  minSearchLength = 1,
  newBookIds,
  onClearQuery,
  onLoadMore,
  query,
  rawQuery,
  totalBooks,
}: BookListProps) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const rowCount = hasNextPage ? books.length + 1 : books.length;
  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    estimateSize: () => 104,
    getItemKey: (index) => books[index]?.id ?? `loader-${index}`,
    getScrollElement: () => parentRef.current,
    overscan: 8,
  });
  const virtualRows = rowVirtualizer.getVirtualItems();

  const handleScroll = useEffectEvent(() => {
    if (!hasNextPage || isFetchingNextPage) {
      return;
    }
    const parent = parentRef.current;
    if (!parent) {
      return;
    }
    const distanceToBottom =
      parent.scrollHeight - parent.scrollTop - parent.clientHeight;
    if (distanceToBottom <= parent.clientHeight) {
      onLoadMore?.();
    }
  });

  useEffect(() => {
    const parent = parentRef.current;
    if (!parent) {
      return;
    }
    parent.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      parent.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const trimmedQuery = (rawQuery ?? query).trim();
  const isBelowMinimumSearchLength =
    trimmedQuery.length > 0 && trimmedQuery.length < minSearchLength;

  if (totalBooks === 0) {
    return <EmptyShelf />;
  }

  if (books.length === 0) {
    return <NoMatches onClearQuery={onClearQuery} query={query} />;
  }

  return (
    <section aria-label="Book shelf" className="border-t border-hairline">
      {isBelowMinimumSearchLength && (
        <div
          aria-live="polite"
          className="flex items-center gap-2 border-b border-hairline bg-page-edge/35 px-4 py-2 text-[0.8125rem] text-ink-muted"
        >
          <span>
            Type at least {minSearchLength} characters to search this shelf.
          </span>
        </div>
      )}
      <div className="max-h-[72vh] overflow-auto" ref={parentRef}>
        <ul
          className="relative w-full"
          style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
        >
          {virtualRows.map((virtualRow) => {
            const book = books[virtualRow.index];
            const style: CSSProperties = {
              transform: `translateY(${virtualRow.start}px)`,
            };

            if (!book) {
              return (
                <LoadingRow
                  dataIndex={virtualRow.index}
                  key={virtualRow.key}
                  measureElement={rowVirtualizer.measureElement}
                  style={style}
                />
              );
            }

            return (
              <BookRow
                book={book}
                dataIndex={virtualRow.index}
                isNew={newBookIds.has(book.id)}
                key={virtualRow.key}
                measureElement={rowVirtualizer.measureElement}
                style={style}
              />
            );
          })}
        </ul>
      </div>
    </section>
  );
};
