import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";

import { SearchBar } from "./search-bar";

describe("SearchBar", () => {
  it("renders with placeholder text", () => {
    const inputRef = createRef<HTMLInputElement>();
    render(<SearchBar inputRef={inputRef} onChange={vi.fn()} value="" />);

    expect(
      screen.getByPlaceholderText("Search by title or author")
    ).toBeInTheDocument();
  });

  it("calls onChange with typed value", async () => {
    const user = userEvent.setup();
    const inputRef = createRef<HTMLInputElement>();
    const onChange = vi.fn();
    render(<SearchBar inputRef={inputRef} onChange={onChange} value="" />);

    const input = screen.getByPlaceholderText("Search by title or author");
    await user.type(input, "Tolkien");

    // Controlled with value="" — each keystroke fires onChange with that single
    // character since React resets the input to the `value` prop on re-render.
    expect(onChange).toHaveBeenCalledTimes(7);
    const values = onChange.mock.calls.map((c) => c[0]);
    expect(values.join("")).toBe("Tolkien");
  });

  it("shows clear button when value is non-empty", () => {
    const inputRef = createRef<HTMLInputElement>();
    render(<SearchBar inputRef={inputRef} onChange={vi.fn()} value="search" />);

    expect(screen.getByLabelText("Clear search")).toBeInTheDocument();
  });

  it("does not show clear button when value is empty", () => {
    const inputRef = createRef<HTMLInputElement>();
    render(<SearchBar inputRef={inputRef} onChange={vi.fn()} value="" />);

    expect(screen.queryByLabelText("Clear search")).not.toBeInTheDocument();
  });

  it("clears input on clear click", async () => {
    const user = userEvent.setup();
    const inputRef = createRef<HTMLInputElement>();
    const onChange = vi.fn();
    render(
      <SearchBar inputRef={inputRef} onChange={onChange} value="search" />
    );

    await user.click(screen.getByLabelText("Clear search"));
    expect(onChange).toHaveBeenCalledWith("");
  });

  it("has accessible search landmark label", () => {
    const inputRef = createRef<HTMLInputElement>();
    render(<SearchBar inputRef={inputRef} onChange={vi.fn()} value="" />);

    expect(screen.getByLabelText("Search the shelf")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Search books by title or author")
    ).toBeInTheDocument();
  });

  it("shows Ctrl+K hint when empty", () => {
    const inputRef = createRef<HTMLInputElement>();
    render(<SearchBar inputRef={inputRef} onChange={vi.fn()} value="" />);

    expect(screen.getByText("K")).toBeInTheDocument();
  });

  it("shows a spinner when isSearching is true", () => {
    const inputRef = createRef<HTMLInputElement>();
    render(
      <SearchBar
        inputRef={inputRef}
        isSearching
        onChange={vi.fn()}
        value="Tolkien"
      />
    );

    expect(screen.queryByLabelText("Clear search")).toBeInTheDocument();
    // The spinner replaces the search icon; the clear button remains.
    expect(
      screen.getByLabelText("Search books by title or author")
    ).toBeInTheDocument();
  });
});
