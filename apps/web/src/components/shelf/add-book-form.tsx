import { cn } from "@pirxey-recruitment-task/ui/lib/utils";
import { useForm } from "@tanstack/react-form";
import { AlertCircle, Plus } from "lucide-react";
import type { RefObject } from "react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import z from "zod";

import { RatingInput } from "./rating";

export interface NewBookInput {
  readonly author: string;
  readonly isbn: string;
  readonly pages: number;
  readonly rating: 1 | 2 | 3 | 4 | 5;
  readonly title: string;
}

interface AddBookFormProps {
  readonly onAdd: (book: NewBookInput) => void;
}

const MAX_TITLE_LENGTH = 200;
const MAX_AUTHOR_LENGTH = 200;
const MAX_PAGES = 20_000;
const ISBN_DIGITS_PATTERN = /^(?:\d{10}|\d{13})$/u;
const ISBN_NOISE_PATTERN = /[-\s]/gu;

const requiredTrimmedString = (fieldName: string) =>
  z.string().refine((value) => value.trim() !== "", {
    message: `${fieldName} is required.`,
  });

const ratingSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]);

const bookFormSchema = z.object({
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
    .union([ratingSchema, z.null()])
    .refine((value): value is z.infer<typeof ratingSchema> => value !== null, {
      message: "Pick a rating from 1 to 5.",
    }),
  title: requiredTrimmedString("Title").max(
    MAX_TITLE_LENGTH,
    `Title must be ${MAX_TITLE_LENGTH} characters or fewer.`
  ),
});

interface FormValues {
  readonly author: string;
  readonly isbn: string;
  readonly pages: string;
  readonly rating: 1 | 2 | 3 | 4 | 5 | null;
  readonly title: string;
}

const defaultValues: FormValues = {
  author: "",
  isbn: "",
  pages: "",
  rating: null,
  title: "",
};

const noop = () => void 0;

interface UseExpandCollapseArgs {
  readonly formRef: RefObject<HTMLFormElement | null>;
  readonly onCollapse: () => void;
  readonly titleRef: RefObject<HTMLInputElement | null>;
}

interface UseExpandCollapseResult {
  readonly collapse: () => void;
  readonly expand: () => void;
  readonly isExpanded: boolean;
  readonly triggerRef: RefObject<HTMLButtonElement | null>;
}

const useExpandCollapse = ({
  formRef,
  onCollapse,
  titleRef,
}: UseExpandCollapseArgs): UseExpandCollapseResult => {
  const [isExpanded, setIsExpanded] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const wasExpandedRef = useRef(false);

  const collapse = useCallback(() => {
    onCollapse();
    setIsExpanded(false);
  }, [onCollapse]);

  useEffect(() => {
    if (isExpanded) {
      const id = window.setTimeout(() => {
        titleRef.current?.focus();
      }, 0);
      wasExpandedRef.current = true;
      return () => {
        window.clearTimeout(id);
      };
    }
    if (wasExpandedRef.current) {
      wasExpandedRef.current = false;
      const id = window.setTimeout(() => {
        triggerRef.current?.focus({ preventScroll: true });
      }, 0);
      return () => {
        window.clearTimeout(id);
      };
    }
  }, [isExpanded, titleRef]);

  useEffect(() => {
    if (!isExpanded) {
      return;
    }
    const handler = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }
      const form = formRef.current;
      if (!form) {
        return;
      }
      const active = document.activeElement;
      if (active && form.contains(active)) {
        event.preventDefault();
        collapse();
      }
    };
    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
    };
  }, [collapse, formRef, isExpanded]);

  return {
    collapse,
    expand: () => setIsExpanded(true),
    isExpanded,
    triggerRef,
  };
};

const Trigger = ({
  expand,
  triggerRef,
}: {
  readonly expand: () => void;
  readonly triggerRef: RefObject<HTMLButtonElement | null>;
}) => (
  <button
    className={cn(
      "group/trigger flex w-full items-center gap-3 rounded-md border border-hairline border-dashed",
      "px-4 py-4 text-left text-ink-muted",
      "transition-colors duration-150",
      "hover:border-ink-soft/40 hover:bg-page-edge/40 hover:text-ink",
      "focus-visible:border-magenta-soft focus-visible:bg-paper focus-visible:text-ink",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta-soft/30"
    )}
    onClick={expand}
    ref={triggerRef}
    type="button"
  >
    <Plus
      aria-hidden="true"
      className="size-4 text-ink-soft transition-colors group-hover/trigger:text-magenta"
    />
    <span className="text-[0.9375rem]">Add a book you&apos;ve finished</span>
    <span className="ml-auto font-mono text-[11px] text-ink-soft">
      press to expand
    </span>
  </button>
);

const FieldError = ({
  id,
  message,
}: {
  readonly id: string;
  readonly message: string;
}) => (
  <p
    className="mt-1.5 flex items-start gap-1.5 text-[0.8125rem] text-destructive"
    id={id}
    role="alert"
  >
    <AlertCircle aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
    <span>{message}</span>
  </p>
);

const fieldClass = cn(
  "h-11 w-full rounded-md border border-hairline bg-paper px-3",
  "text-[0.9375rem] text-ink placeholder:text-ink-soft",
  "transition-colors duration-150",
  "focus-visible:border-magenta-soft focus-visible:outline-none",
  "focus-visible:ring-2 focus-visible:ring-magenta-soft/30",
  "aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive/20"
);

const labelClass = "block text-[0.8125rem] font-medium text-ink-muted mb-1.5";

const inputBaseProps = (errorId: string, hasError: boolean) => ({
  "aria-describedby": hasError ? errorId : undefined,
  "aria-invalid": hasError,
  className: fieldClass,
});

export const AddBookForm = ({ onAdd }: AddBookFormProps) => {
  const baseId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const ratingRef = useRef<HTMLInputElement>(null);
  const collapseRef = useRef<() => void>(noop);

  const form = useForm({
    defaultValues,
    onSubmit: ({ value }) => {
      const parsed = bookFormSchema.safeParse(value);
      if (!parsed.success) {
        return;
      }
      onAdd({
        author: parsed.data.author.trim(),
        isbn: parsed.data.isbn.trim().replaceAll(ISBN_NOISE_PATTERN, ""),
        pages: Number(parsed.data.pages.trim()),
        rating: parsed.data.rating,
        title: parsed.data.title.trim(),
      });
      collapseRef.current();
    },
    validators: {
      onSubmit: bookFormSchema,
    },
  });

  const { collapse, expand, isExpanded, triggerRef } = useExpandCollapse({
    formRef,
    onCollapse: () => form.reset(defaultValues),
    titleRef,
  });
  collapseRef.current = collapse;

  if (!isExpanded) {
    return <Trigger expand={expand} triggerRef={triggerRef} />;
  }

  const ids = {
    author: `${baseId}-author`,
    authorError: `${baseId}-author-error`,
    isbn: `${baseId}-isbn`,
    isbnError: `${baseId}-isbn-error`,
    pages: `${baseId}-pages`,
    pagesError: `${baseId}-pages-error`,
    rating: `${baseId}-rating`,
    ratingError: `${baseId}-rating-error`,
    title: `${baseId}-title`,
    titleError: `${baseId}-title-error`,
  };

  return (
    <form
      aria-label="Add a book"
      className={cn(
        "rounded-md border border-hairline bg-page-edge/30 p-5 md:p-6",
        "transition-colors"
      )}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
      ref={formRef}
    >
      <div className="mb-5 flex items-baseline justify-between">
        <h2 className="text-base font-medium text-ink">Add a book</h2>
        <p className="font-mono text-[11px] text-ink-soft">esc to close</p>
      </div>

      <div className="grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-6">
        <form.Field name="title">
          {(field) => {
            const hasError = field.state.meta.errors.length > 0;
            return (
              <div className="md:col-span-6">
                <label className={labelClass} htmlFor={ids.title}>
                  Title
                </label>
                <input
                  {...inputBaseProps(ids.titleError, hasError)}
                  aria-label="Title"
                  id={ids.title}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder="The book you just closed"
                  ref={titleRef}
                  type="text"
                  value={field.state.value}
                />
                {field.state.meta.errors.map((error) => (
                  <FieldError
                    id={ids.titleError}
                    key={error?.message}
                    message={error?.message ?? ""}
                  />
                ))}
              </div>
            );
          }}
        </form.Field>

        <form.Field name="author">
          {(field) => {
            const hasError = field.state.meta.errors.length > 0;
            return (
              <div className="md:col-span-3">
                <label className={labelClass} htmlFor={ids.author}>
                  Author
                </label>
                <input
                  {...inputBaseProps(ids.authorError, hasError)}
                  aria-label="Author"
                  id={ids.author}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder="Last, First or First Last"
                  type="text"
                  value={field.state.value}
                />
                {field.state.meta.errors.map((error) => (
                  <FieldError
                    id={ids.authorError}
                    key={error?.message}
                    message={error?.message ?? ""}
                  />
                ))}
              </div>
            );
          }}
        </form.Field>

        <form.Field name="isbn">
          {(field) => {
            const hasError = field.state.meta.errors.length > 0;
            return (
              <div className="md:col-span-3">
                <label className={labelClass} htmlFor={ids.isbn}>
                  ISBN
                </label>
                <input
                  {...inputBaseProps(ids.isbnError, hasError)}
                  aria-label="ISBN"
                  autoComplete="off"
                  className={cn(fieldClass, "font-mono text-[0.875rem]")}
                  id={ids.isbn}
                  inputMode="numeric"
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder="10 or 13 digits"
                  type="text"
                  value={field.state.value}
                />
                {field.state.meta.errors.map((error) => (
                  <FieldError
                    id={ids.isbnError}
                    key={error?.message}
                    message={error?.message ?? ""}
                  />
                ))}
              </div>
            );
          }}
        </form.Field>

        <form.Field name="pages">
          {(field) => {
            const hasError = field.state.meta.errors.length > 0;
            return (
              <div className="md:col-span-2">
                <label className={labelClass} htmlFor={ids.pages}>
                  Pages
                </label>
                <input
                  {...inputBaseProps(ids.pagesError, hasError)}
                  aria-label="Pages"
                  className={cn(fieldClass, "font-mono")}
                  id={ids.pages}
                  inputMode="numeric"
                  min={1}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder="0"
                  type="number"
                  value={field.state.value}
                />
                {field.state.meta.errors.map((error) => (
                  <FieldError
                    id={ids.pagesError}
                    key={error?.message}
                    message={error?.message ?? ""}
                  />
                ))}
              </div>
            );
          }}
        </form.Field>

        <form.Field name="rating">
          {(field) => {
            const hasError = field.state.meta.errors.length > 0;
            return (
              <div className="md:col-span-3">
                <p className={labelClass} id={ids.rating}>
                  Rating
                </p>
                <div
                  className={cn(
                    "flex h-11 w-fit items-center rounded-md border border-hairline bg-paper px-1.5",
                    hasError ? "border-destructive" : ""
                  )}
                >
                  <RatingInput
                    errorId={ids.ratingError}
                    firstInputRef={ratingRef}
                    hasError={hasError}
                    id={ids.rating}
                    onChange={field.handleChange}
                    value={field.state.value}
                  />
                </div>
                {field.state.meta.errors.map((error) => (
                  <FieldError
                    id={ids.ratingError}
                    key={error?.message}
                    message={error?.message ?? ""}
                  />
                ))}
              </div>
            );
          }}
        </form.Field>
      </div>

      <div className="mt-6 flex flex-col-reverse items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
        <button
          className={cn(
            "h-10 rounded-md px-4 text-sm text-ink-muted",
            "transition-colors hover:bg-page-edge hover:text-ink",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta-soft/30"
          )}
          onClick={collapse}
          type="button"
        >
          Cancel
        </button>
        <button
          className={cn(
            "h-10 rounded-md bg-magenta px-5 text-sm font-medium text-paper",
            "transition-colors hover:bg-magenta/90",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta-soft/40 focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
          )}
          type="submit"
        >
          Save book
        </button>
      </div>
    </form>
  );
};
