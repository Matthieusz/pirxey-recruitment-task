import { describe, expect, it } from "vitest";

import {
  bookFormSchema,
  bookSchema,
  createBookSchema,
  isbnSchema,
  listBooksSchema,
  MAX_AUTHOR_LENGTH,
  MAX_PAGES,
  MAX_TITLE_LENGTH,
  ratingLiteralSchema,
  shelfBooksSchema,
  shelfPageSchema,
  toNewBookInput,
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

describe("ratingLiteralSchema", () => {
  it("accepts 1-5", () => {
    for (const value of [1, 2, 3, 4, 5] as const) {
      expect(ratingLiteralSchema.safeParse(value).success).toBe(true);
    }
  });

  it("rejects other numbers and non-integers", () => {
    for (const value of [0, 6, 3.5, -1]) {
      expect(ratingLiteralSchema.safeParse(value).success).toBe(false);
    }
  });
});

describe("bookSchema", () => {
  const validBook = {
    author: "J.R.R. Tolkien",
    finishedAt: "2024-01-15",
    id: 1,
    isbn: "9780547928227",
    pages: 423,
    rating: 5,
    title: "The Hobbit",
  } as const;

  it("accepts a valid book", () => {
    expect(bookSchema.safeParse(validBook).success).toBe(true);
  });

  it("rejects a missing id", () => {
    const { id: _id, ...rest } = validBook;
    expect(bookSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects an out-of-range rating", () => {
    expect(bookSchema.safeParse({ ...validBook, rating: 6 }).success).toBe(
      false
    );
  });
});

describe("bookFormSchema", () => {
  const validFormValues = {
    author: "J.R.R. Tolkien",
    isbn: "9780547928227",
    pages: "423",
    rating: 5,
    title: "The Hobbit",
  } as const;

  it("accepts valid form values", () => {
    expect(bookFormSchema.safeParse(validFormValues).success).toBe(true);
  });

  it("rejects an empty title", () => {
    expect(
      bookFormSchema.safeParse({ ...validFormValues, title: "" }).success
    ).toBe(false);
  });

  it("rejects a whitespace-only title", () => {
    expect(
      bookFormSchema.safeParse({ ...validFormValues, title: "   " }).success
    ).toBe(false);
  });

  it("rejects a title exceeding max length", () => {
    expect(
      bookFormSchema.safeParse({
        ...validFormValues,
        title: "x".repeat(MAX_TITLE_LENGTH + 1),
      }).success
    ).toBe(false);
  });

  it("rejects an empty author", () => {
    expect(
      bookFormSchema.safeParse({ ...validFormValues, author: "" }).success
    ).toBe(false);
  });

  it("rejects an author exceeding max length", () => {
    expect(
      bookFormSchema.safeParse({
        ...validFormValues,
        author: "x".repeat(MAX_AUTHOR_LENGTH + 1),
      }).success
    ).toBe(false);
  });

  it("rejects an empty ISBN", () => {
    expect(
      bookFormSchema.safeParse({ ...validFormValues, isbn: "" }).success
    ).toBe(false);
  });

  it("rejects an invalid ISBN (letters)", () => {
    expect(
      bookFormSchema.safeParse({ ...validFormValues, isbn: "abc" }).success
    ).toBe(false);
  });

  it("rejects an invalid ISBN (wrong digit count)", () => {
    expect(
      bookFormSchema.safeParse({
        ...validFormValues,
        isbn: "123456789",
      }).success
    ).toBe(false);
  });

  it("accepts an ISBN with dashes and spaces", () => {
    expect(
      bookFormSchema.safeParse({
        ...validFormValues,
        isbn: "978-0 306 40615 7",
      }).success
    ).toBe(true);
  });

  it("rejects empty pages", () => {
    expect(
      bookFormSchema.safeParse({ ...validFormValues, pages: "" }).success
    ).toBe(false);
  });

  it("rejects non-integer pages", () => {
    expect(
      bookFormSchema.safeParse({ ...validFormValues, pages: "42.5" }).success
    ).toBe(false);
  });

  it("rejects pages below 1", () => {
    expect(
      bookFormSchema.safeParse({ ...validFormValues, pages: "0" }).success
    ).toBe(false);
  });

  it("rejects pages above max", () => {
    expect(
      bookFormSchema.safeParse({
        ...validFormValues,
        pages: String(MAX_PAGES + 1),
      }).success
    ).toBe(false);
  });

  it("accepts pages at max", () => {
    expect(
      bookFormSchema.safeParse({
        ...validFormValues,
        pages: String(MAX_PAGES),
      }).success
    ).toBe(true);
  });

  it("rejects a null rating", () => {
    expect(
      bookFormSchema.safeParse({ ...validFormValues, rating: null }).success
    ).toBe(false);
  });

  it("rejects an out-of-range rating", () => {
    expect(
      bookFormSchema.safeParse({ ...validFormValues, rating: 6 }).success
    ).toBe(false);
  });
});

describe("toNewBookInput", () => {
  const validFormValues = {
    author: "  J.R.R. Tolkien  ",
    isbn: "978-0 306 40615 7",
    pages: "423",
    rating: 5,
    title: "  The Hobbit  ",
  } as const;

  it("trims whitespace from title and author", () => {
    const result = toNewBookInput(validFormValues);
    expect(result.title).toBe("The Hobbit");
    expect(result.author).toBe("J.R.R. Tolkien");
  });

  it("strips ISBN noise (dashes and spaces)", () => {
    const result = toNewBookInput(validFormValues);
    expect(result.isbn).toBe("9780306406157");
  });

  it("parses pages to a number", () => {
    const result = toNewBookInput(validFormValues);
    expect(result.pages).toBe(423);
  });

  it("preserves the rating literal", () => {
    const result = toNewBookInput(validFormValues);
    expect(result.rating).toBe(5);
  });
});

describe("shelfPageSchema", () => {
  const validPage = {
    books: [
      {
        author: "J.R.R. Tolkien",
        finishedAt: "2024-01-15",
        id: 1,
        isbn: "9780547928227",
        pages: 423,
        rating: 5,
        title: "The Hobbit",
      },
    ],
    nextCursor: "2024-01-15|1",
    user: { id: "user-1", name: "alice" },
  };

  it("accepts a valid shelf page", () => {
    expect(shelfPageSchema.safeParse(validPage).success).toBe(true);
  });

  it("accepts null nextCursor", () => {
    expect(
      shelfPageSchema.safeParse({ ...validPage, nextCursor: null }).success
    ).toBe(true);
  });

  it("rejects a book with an out-of-range rating", () => {
    expect(
      shelfPageSchema.safeParse({
        ...validPage,
        books: [{ ...validPage.books[0], rating: 6 }],
      }).success
    ).toBe(false);
  });

  it("rejects a missing user", () => {
    const { user: _user, ...rest } = validPage;
    expect(shelfPageSchema.safeParse(rest).success).toBe(false);
  });
});
