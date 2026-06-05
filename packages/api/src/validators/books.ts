import z from "zod";

// Shared regex for ISBN normalization
export const ISBN_NOISE_PATTERN = /[-\s]/gu;
const ISBN_DIGITS_PATTERN = /^\d{10}$|^\d{13}$/u;

export const MAX_TITLE_LENGTH = 200;
export const MAX_AUTHOR_LENGTH = 200;
export const MAX_PAGES = 20_000;

/**
 * Clean an ISBN string (remove dashes and spaces) and validate it's 10 or 13 digits.
 */
export const isbnSchema = z
  .string()
  .min(1, "ISBN is required.")
  .transform((raw) => raw.replaceAll(ISBN_NOISE_PATTERN, ""))
  .refine((cleaned) => ISBN_DIGITS_PATTERN.test(cleaned), {
    message: "ISBN must be 10 or 13 digits.",
  });

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
  rating: z
    .number()
    .int()
    .min(1, "Rating must be between 1 and 5.")
    .max(5, "Rating must be between 1 and 5."),
  title: z
    .string()
    .min(1, "Title is required.")
    .max(
      MAX_TITLE_LENGTH,
      `Title must be ${MAX_TITLE_LENGTH} characters or fewer.`
    ),
});

/**
 * Optional search/query parameter for listing books.
 */
export const listBooksSchema = z.object({
  query: z.string().max(200).optional(),
});

/**
 * Name lookup for the public shelf endpoint.
 */
export const nameSchema = z.object({
  name: z.string().min(1, "Name is required.").max(100),
});
