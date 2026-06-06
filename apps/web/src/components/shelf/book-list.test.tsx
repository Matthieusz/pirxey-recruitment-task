import type { Book } from "@pirxey-recruitment-task/api/validators/books";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { BookList } from "./book-list";

vi.mock("@tanstack/react-virtual", () => ({
  useVirtualizer: ({
    count,
    getItemKey,
  }: {
    count: number;
    getItemKey: (index: number) => string;
  }) => {
    const items = Array.from({ length: count }, (_, index) => ({
      index,
      key: getItemKey(index),
      size: 104,
      start: index * 104,
    }));

    return {
      getTotalSize: () => count * 104,
      getVirtualItems: () => items,
      measureElement: () => {},
    };
  },
}));

const createBook = (overrides?: Partial<Book>): Book => ({
  author: "J.R.R. Tolkien",
  finishedAt: "2024-01-15",
  id: 1,
  isbn: "9780547928227",
  pages: 423,
  rating: 5,
  title: "The Hobbit",
  ...overrides,
});

describe("BookList", () => {
  it("shows empty shelf state when totalBooks is 0", () => {
    render(
      <BookList
        books={[]}
        newBookIds={new Set<number>()}
        onClearQuery={vi.fn()}
        query=""
        totalBooks={0}
      />
    );

    expect(screen.getByText("Nothing on the shelf yet.")).toBeInTheDocument();
  });

  it("shows no-matches state when query is non-empty but books is empty", () => {
    render(
      <BookList
        books={[]}
        newBookIds={new Set<number>()}
        onClearQuery={vi.fn()}
        query="nonexistent"
        totalBooks={1}
      />
    );

    expect(screen.getByText(/No books match/u)).toBeInTheDocument();
  });

  it("calls onClearQuery when clear button is clicked in no-matches state", async () => {
    const user = userEvent.setup();
    const onClearQuery = vi.fn();
    render(
      <BookList
        books={[]}
        newBookIds={new Set<number>()}
        onClearQuery={onClearQuery}
        query="nonexistent"
        totalBooks={1}
      />
    );

    await user.click(screen.getByRole("button", { name: "Clear search" }));
    expect(onClearQuery).toHaveBeenCalled();
  });

  it("renders book title and author", () => {
    const books = [createBook({ id: 1, title: "The Hobbit" })];
    render(
      <BookList
        books={books}
        newBookIds={new Set<number>()}
        onClearQuery={vi.fn()}
        query=""
        totalBooks={1}
      />
    );

    expect(screen.getByText("The Hobbit")).toBeInTheDocument();
    expect(screen.getByText("J.R.R. Tolkien")).toBeInTheDocument();
  });

  it("renders multiple books", () => {
    const books = [
      createBook({ id: 1, title: "Book One" }),
      createBook({ id: 2, title: "Book Two" }),
      createBook({ id: 3, title: "Book Three" }),
    ];
    render(
      <BookList
        books={books}
        newBookIds={new Set<number>()}
        onClearQuery={vi.fn()}
        query=""
        totalBooks={3}
      />
    );

    expect(screen.getByText("Book One")).toBeInTheDocument();
    expect(screen.getByText("Book Two")).toBeInTheDocument();
    expect(screen.getByText("Book Three")).toBeInTheDocument();
  });

  it("renders the shelf landmark", () => {
    const books = [createBook({ id: 1 })];
    render(
      <BookList
        books={books}
        newBookIds={new Set<number>()}
        onClearQuery={vi.fn()}
        query=""
        totalBooks={1}
      />
    );

    expect(screen.getByLabelText("Book shelf")).toBeInTheDocument();
  });
});
