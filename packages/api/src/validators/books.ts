import z from "zod";

// ----------------------------------------------------------------------------
// Shared constants
// ----------------------------------------------------------------------------

export const ISBN_NOISE_PATTERN = /[-\s]/gu;
export const ISBN_DIGITS_PATTERN = /^\d{10}$|^\d{13}$/u;

export const MAX_TITLE_LENGTH = 200;
export const MAX_AUTHOR_LENGTH = 200;
export const MAX_PAGES = 20_000;
export const MAX_BOOKS_PAGE_SIZE = 100;
export const DEFAULT_BOOKS_PAGE_SIZE = 50;

// ----------------------------------------------------------------------------
// Primitives
// ----------------------------------------------------------------------------

/**
 * Rating is a closed set of integer literals — the form and the renderer both
 * depend on the literal-union type for `RatingDisplay`'s prop signature.
 */
export const ratingLiteralSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]);
export type Rating = z.infer<typeof ratingLiteralSchema>;

/**
 * Clean an ISBN string (strip dashes and spaces) and validate it's 10 or 13 digits.
 */
export const isbnSchema = z
  .string()
  .min(1, "ISBN is required.")
  .transform((raw) => raw.replaceAll(ISBN_NOISE_PATTERN, ""))
  .refine((cleaned) => ISBN_DIGITS_PATTERN.test(cleaned), {
    message: "ISBN must be 10 or 13 digits.",
  });

// ----------------------------------------------------------------------------
// Book wire/render type
// ----------------------------------------------------------------------------

/**
 * Canonical Book — the shape returned by the API and rendered by the UI.
 * Identical to the form's NewBookInput plus an `id` and a `finishedAt` date
 * string. The rating is the literal union so `RatingDisplay` accepts it
 * directly without narrowing.
 */
export const bookSchema = z.object({
  author: z.string(),
  finishedAt: z.string(),
  id: z.number(),
  isbn: z.string(),
  pages: z.number().int().positive(),
  rating: ratingLiteralSchema,
  title: z.string(),
});
export type Book = z.infer<typeof bookSchema>;

// ----------------------------------------------------------------------------
// Create-book input (API procedure input)
// ----------------------------------------------------------------------------

/**
 * Create-book input: all fields required, with size/bounds checks matching the
 * frontend form so the API is the source of truth.
 */
export const createBookSchema = z.object({
  author: z
    .string()
    .min(1, "Author is required.")
    .max(
      MAX_AUTHOR_LENGTH,
      `Author must be ${MAX_AUTHOR_LENGTH} characters or fewer.`
    ),
  isbn: isbnSchema,
  pages: z
    .number()
    .int("Pages must be a whole number.")
    .min(1, "Pages must be at least 1.")
    .max(MAX_PAGES, `Pages must be ${MAX_PAGES.toLocaleString()} or fewer.`),
  rating: ratingLiteralSchema,
  title: z
    .string()
    .min(1, "Title is required.")
    .max(
      MAX_TITLE_LENGTH,
      `Title must be ${MAX_TITLE_LENGTH} characters or fewer.`
    ),
});
export type NewBookInput = z.infer<typeof createBookSchema>;

// ----------------------------------------------------------------------------
// List pagination
// ----------------------------------------------------------------------------

/**
 * Optional search/query and cursor pagination parameters for listing books.
 */
export const listBooksSchema = z.object({
  cursor: z.string().max(64).optional(),
  limit: z
    .number()
    .int()
    .min(1)
    .max(MAX_BOOKS_PAGE_SIZE)
    .default(DEFAULT_BOOKS_PAGE_SIZE),
  query: z.string().max(200).optional(),
});

// ----------------------------------------------------------------------------
// Public shelf lookup
// ----------------------------------------------------------------------------

/**
 * Name lookup for the public shelf endpoint.
 */
export const nameSchema = z.object({
  name: z.string().min(1, "Name is required.").max(100),
});

export const shelfBooksSchema = nameSchema.merge(listBooksSchema);

// ----------------------------------------------------------------------------
// Form (raw string values + transform to NewBookInput)
// ----------------------------------------------------------------------------

const requiredTrimmedString = (fieldName: string) =>
  z.string().refine((value) => value.trim() !== "", {
    message: `${fieldName} is required.`,
  });

/**
 * Form's raw string-typed values, validated up front by TanStack Form's
 * `validators.onSubmit`. `rating` is nullable because the form starts unset.
 */
export const bookFormSchema = z.object({
  author: requiredTrimmedString("Author").max(
    MAX_AUTHOR_LENGTH,
    `Author must be ${MAX_AUTHOR_LENGTH} characters or fewer.`
  ),
  isbn: requiredTrimmedString("ISBN").refine(
    (value) =>
      ISBN_DIGITS_PATTERN.test(value.trim().replaceAll(ISBN_NOISE_PATTERN, "")),
    { message: "ISBN must be 10 or 13 digits." }
  ),
  pages: requiredTrimmedString("Pages").refine(
    (value) => {
      const parsed = Number(value.trim());
      return Number.isInteger(parsed) && parsed >= 1 && parsed <= MAX_PAGES;
    },
    {
      message: `Pages must be a whole number between 1 and ${MAX_PAGES.toLocaleString()}.`,
    }
  ),
  rating: z
    .union([ratingLiteralSchema, z.null()])
    .refine((value): value is Rating => value !== null, {
      message: "Pick a rating from 1 to 5.",
    }),
  title: requiredTrimmedString("Title").max(
    MAX_TITLE_LENGTH,
    `Title must be ${MAX_TITLE_LENGTH} characters or fewer.`
  ),
});
/**
 * Raw form values as held in form state. `rating` is nullable because the
 * form starts unset; the schema's refine rejects null at submit.
 */
export type BookFormValues = z.input<typeof bookFormSchema>;
/** Parsed form values (after the schema's refine narrows the rating). */
export type BookFormOutput = z.output<typeof bookFormSchema>;

/**
 * Map the form's parsed values to the API's NewBookInput. Pure function —
 * trims, strips ISBN noise, parses pages to a number.
 */
export const toNewBookInput = (values: BookFormOutput): NewBookInput => ({
  author: values.author.trim(),
  isbn: values.isbn.trim().replaceAll(ISBN_NOISE_PATTERN, ""),
  pages: Number(values.pages.trim()),
  rating: values.rating,
  title: values.title.trim(),
});

// ----------------------------------------------------------------------------
// Shelf page (wire response)
// ----------------------------------------------------------------------------

export const shelfUserSchema = z.object({
  id: z.string(),
  name: z.string(),
});
export type ShelfUser = z.infer<typeof shelfUserSchema>;

export const shelfPageSchema = z.object({
  books: z.array(bookSchema),
  nextCursor: z.string().nullable(),
  user: shelfUserSchema,
});
export type ShelfPage = z.infer<typeof shelfPageSchema>;
