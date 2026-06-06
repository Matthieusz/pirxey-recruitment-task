import { describe, expect, it } from "vitest";

import {
  createBookSchema,
  isbnSchema,
  listBooksSchema,
  MAX_AUTHOR_LENGTH,
  MAX_PAGES,
  MAX_TITLE_LENGTH,
  shelfBooksSchema,
} from "../validators/books";

describe("isbnSchema", () => {
  it("rejects an empty ISBN", () => {
    const result = isbnSchema.safeParse("");
    expect(result.success).toBe(false);
  });

  it("rejects ISBN with letters", () => {
    const result = isbnSchema.safeParse("123456789X");
    expect(result.success).toBe(false);
  });

  it("rejects ISBN with wrong digit count (9 digits)", () => {
    const result = isbnSchema.safeParse("123456789");
    expect(result.success).toBe(false);
  });

  it("rejects ISBN with wrong digit count (11 digits)", () => {
    const result = isbnSchema.safeParse("12345678901");
    expect(result.success).toBe(false);
  });

  it("accepts a valid 10-digit ISBN", () => {
    const result = isbnSchema.safeParse("0306406152");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("0306406152");
    }
  });

  it("accepts a valid 13-digit ISBN", () => {
    const result = isbnSchema.safeParse("9780306406157");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("9780306406157");
    }
  });

  it("strips spaces from ISBN", () => {
    const result = isbnSchema.safeParse("978 0 306 40615 7");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("9780306406157");
    }
  });

  it("strips dashes from ISBN", () => {
    const result = isbnSchema.safeParse("978-0-306-40615-7");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("9780306406157");
    }
  });

  it("strips mixed dashes and spaces", () => {
    const result = isbnSchema.safeParse("978-0 306-40615 7");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("9780306406157");
    }
  });
});

describe("createBookSchema", () => {
  const validBook = {
    author: "J.R.R. Tolkien",
    isbn: "9780547928227",
    pages: 423,
    rating: 5,
    title: "The Hobbit",
  } as const;

  it("accepts a valid book", () => {
    const result = createBookSchema.safeParse(validBook);
    expect(result.success).toBe(true);
  });

  it("rejects an empty title", () => {
    const result = createBookSchema.safeParse({ ...validBook, title: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a title exceeding max length", () => {
    const result = createBookSchema.safeParse({
      ...validBook,
      title: "x".repeat(MAX_TITLE_LENGTH + 1),
    });
    expect(result.success).toBe(false);
  });

  it("accepts a title at max length", () => {
    const result = createBookSchema.safeParse({
      ...validBook,
      title: "x".repeat(MAX_TITLE_LENGTH),
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty author", () => {
    const result = createBookSchema.safeParse({ ...validBook, author: "" });
    expect(result.success).toBe(false);
  });

  it("rejects an author exceeding max length", () => {
    const result = createBookSchema.safeParse({
      ...validBook,
      author: "x".repeat(MAX_AUTHOR_LENGTH + 1),
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty ISBN", () => {
    const result = createBookSchema.safeParse({ ...validBook, isbn: "" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid ISBN", () => {
    const result = createBookSchema.safeParse({
      ...validBook,
      isbn: "abc",
    });
    expect(result.success).toBe(false);
  });

  it("rejects pages that are not a whole number", () => {
    const result = createBookSchema.safeParse({
      ...validBook,
      pages: 42.5,
    });
    expect(result.success).toBe(false);
  });

  it("rejects zero pages", () => {
    const result = createBookSchema.safeParse({ ...validBook, pages: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects negative pages", () => {
    const result = createBookSchema.safeParse({ ...validBook, pages: -1 });
    expect(result.success).toBe(false);
  });

  it("rejects pages exceeding max", () => {
    const result = createBookSchema.safeParse({
      ...validBook,
      pages: MAX_PAGES + 1,
    });
    expect(result.success).toBe(false);
  });

  it("accepts pages at max", () => {
    const result = createBookSchema.safeParse({
      ...validBook,
      pages: MAX_PAGES,
    });
    expect(result.success).toBe(true);
  });

  it("rejects rating below 1", () => {
    const result = createBookSchema.safeParse({ ...validBook, rating: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects rating above 5", () => {
    const result = createBookSchema.safeParse({ ...validBook, rating: 6 });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer rating", () => {
    const result = createBookSchema.safeParse({
      ...validBook,
      rating: 3.5,
    });
    expect(result.success).toBe(false);
  });

  it("accepts all valid rating values", () => {
    for (const rating of [1, 2, 3, 4, 5] as const) {
      const result = createBookSchema.safeParse({ ...validBook, rating });
      expect(result.success).toBe(true);
    }
  });
});

describe("listBooksSchema", () => {
  it("provides a default limit", () => {
    const result = listBooksSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(50);
    }
  });

  it("rejects limit below 1", () => {
    const result = listBooksSchema.safeParse({ limit: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects limit above max", () => {
    const result = listBooksSchema.safeParse({ limit: 200 });
    expect(result.success).toBe(false);
  });

  it("accepts optional cursor", () => {
    const result = listBooksSchema.safeParse({
      cursor: "2024-01-15|42",
    });
    expect(result.success).toBe(true);
  });

  it("accepts optional query", () => {
    const result = listBooksSchema.safeParse({ query: "Tolkien" });
    expect(result.success).toBe(true);
  });
});

describe("shelfBooksSchema", () => {
  it("rejects an empty name", () => {
    const result = shelfBooksSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("accepts a valid name with defaults", () => {
    const result = shelfBooksSchema.safeParse({ name: "alice" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("alice");
      expect(result.data.limit).toBe(50);
    }
  });

  it("accepts a name with cursor and limit", () => {
    const result = shelfBooksSchema.safeParse({
      cursor: "2024-06-01|10",
      limit: 25,
      name: "bob",
      query: "Foundation",
    });
    expect(result.success).toBe(true);
  });
});
