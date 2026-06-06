import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { NewBookInput } from "./add-book-form";
import { AddBookForm } from "./add-book-form";

const validInput: NewBookInput = {
  author: "J.R.R. Tolkien",
  isbn: "9780547928227",
  pages: 423,
  rating: 5,
  title: "The Hobbit",
};

/** Click the rating radio at the given index (1-based). */
const selectRating = async (
  user: ReturnType<typeof userEvent.setup>,
  value: number
) => {
  const radios = screen.getAllByRole("radio");
  const target = radios[value - 1];
  if (target) {
    await user.click(target);
  }
};

describe("AddBookForm", () => {
  it("starts collapsed", () => {
    render(<AddBookForm onAdd={vi.fn()} />);
    expect(screen.getByText("Add a book you've finished")).toBeInTheDocument();
    expect(screen.queryByLabelText("Add a book")).not.toBeInTheDocument();
  });

  it("expands the form when trigger is clicked", async () => {
    const user = userEvent.setup();
    render(<AddBookForm onAdd={vi.fn()} />);

    await user.click(screen.getByText("Add a book you've finished"));
    expect(screen.getByLabelText("Add a book")).toBeInTheDocument();
    expect(screen.getByLabelText("Title")).toBeInTheDocument();
    expect(screen.getByLabelText("Author")).toBeInTheDocument();
    expect(screen.getByLabelText("ISBN")).toBeInTheDocument();
    expect(screen.getByLabelText("Pages")).toBeInTheDocument();
  });

  it("shows required-field errors on empty submit", async () => {
    const user = userEvent.setup();
    render(<AddBookForm onAdd={vi.fn()} />);

    await user.click(screen.getByText("Add a book you've finished"));
    await user.click(screen.getByRole("button", { name: "Save book" }));

    expect(screen.getByText("Title is required.")).toBeInTheDocument();
    expect(screen.getByText("Author is required.")).toBeInTheDocument();
    expect(screen.getByText("ISBN is required.")).toBeInTheDocument();
    expect(screen.getByText("Pages is required.")).toBeInTheDocument();
    expect(screen.getByText("Pick a rating from 1 to 5.")).toBeInTheDocument();
  });

  it("calls onAdd with valid input and collapses", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<AddBookForm onAdd={onAdd} />);

    await user.click(screen.getByText("Add a book you've finished"));

    await user.type(screen.getByLabelText("Title"), "The Hobbit");
    await user.type(screen.getByLabelText("Author"), "J.R.R. Tolkien");
    await user.type(screen.getByLabelText("ISBN"), "9780547928227");
    await user.type(screen.getByLabelText("Pages"), "423");

    await selectRating(user, 5);
    await user.click(screen.getByRole("button", { name: "Save book" }));

    expect(onAdd).toHaveBeenCalledWith(validInput);

    // Form should collapse back
    expect(screen.getByText("Add a book you've finished")).toBeInTheDocument();
  });

  it("shows ISBN validation error for invalid ISBN", async () => {
    const user = userEvent.setup();
    render(<AddBookForm onAdd={vi.fn()} />);

    await user.click(screen.getByText("Add a book you've finished"));

    await user.type(screen.getByLabelText("Title"), "The Hobbit");
    await user.type(screen.getByLabelText("Author"), "J.R.R. Tolkien");
    await user.type(screen.getByLabelText("ISBN"), "abc");
    await user.type(screen.getByLabelText("Pages"), "423");

    await selectRating(user, 5);
    await user.click(screen.getByRole("button", { name: "Save book" }));

    expect(
      screen.getByText("ISBN must be 10 or 13 digits.")
    ).toBeInTheDocument();
  });

  it("shows pages range validation error", async () => {
    const user = userEvent.setup();
    render(<AddBookForm onAdd={vi.fn()} />);

    await user.click(screen.getByText("Add a book you've finished"));

    await user.type(screen.getByLabelText("Title"), "The Hobbit");
    await user.type(screen.getByLabelText("Author"), "J.R.R. Tolkien");
    await user.type(screen.getByLabelText("ISBN"), "9780547928227");
    await user.type(screen.getByLabelText("Pages"), "30000");

    await selectRating(user, 5);
    await user.click(screen.getByRole("button", { name: "Save book" }));

    expect(
      screen.getByText("Pages must be a whole number between 1 and 20,000.")
    ).toBeInTheDocument();
  });

  it("strips ISBN noise before calling onAdd", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<AddBookForm onAdd={onAdd} />);

    await user.click(screen.getByText("Add a book you've finished"));

    await user.type(screen.getByLabelText("Title"), "The Hobbit");
    await user.type(screen.getByLabelText("Author"), "J.R.R. Tolkien");
    await user.type(screen.getByLabelText("ISBN"), "978-0-306-40615-7");
    await user.type(screen.getByLabelText("Pages"), "423");

    await selectRating(user, 5);
    await user.click(screen.getByRole("button", { name: "Save book" }));

    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({ isbn: "9780306406157" })
    );
  });

  it("collapses on Cancel button", async () => {
    const user = userEvent.setup();
    render(<AddBookForm onAdd={vi.fn()} />);

    await user.click(screen.getByText("Add a book you've finished"));
    expect(screen.getByLabelText("Add a book")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByLabelText("Add a book")).not.toBeInTheDocument();
    expect(screen.getByText("Add a book you've finished")).toBeInTheDocument();
  });

  it("collapses on Escape when focus is inside form", async () => {
    const user = userEvent.setup();
    render(<AddBookForm onAdd={vi.fn()} />);

    await user.click(screen.getByText("Add a book you've finished"));
    const titleInput = screen.getByLabelText("Title");
    await user.click(titleInput);

    await user.keyboard("{Escape}");

    expect(screen.getByText("Add a book you've finished")).toBeInTheDocument();
  });
});
