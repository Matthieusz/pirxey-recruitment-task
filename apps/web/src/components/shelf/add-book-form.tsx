import { cn } from "@pirxey-recruitment-task/ui/lib/utils";
import { AlertCircle, Plus } from "lucide-react";
import type { FormEvent, RefObject } from "react";
import { useCallback, useEffect, useId, useRef, useState } from "react";

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

type FieldName = "author" | "isbn" | "pages" | "rating" | "title";

type Errors = Partial<Record<FieldName, string>>;

const MAX_TITLE_LENGTH = 200;
const MAX_AUTHOR_LENGTH = 200;
const MAX_PAGES = 20_000;
const ISBN_DIGITS_PATTERN = /^(?:\d{10}|\d{13})$/u;
const ISBN_NOISE_PATTERN = /[-\s]/gu;

const validateTitle = (raw: string): string | null => {
  const trimmed = raw.trim();
  if (trimmed === "") {
    return "Title is required.";
  }
  if (trimmed.length > MAX_TITLE_LENGTH) {
    return `Title must be ${MAX_TITLE_LENGTH} characters or fewer.`;
  }
  return null;
};

const validateAuthor = (raw: string): string | null => {
  const trimmed = raw.trim();
  if (trimmed === "") {
    return "Author is required.";
  }
  if (trimmed.length > MAX_AUTHOR_LENGTH) {
    return `Author must be ${MAX_AUTHOR_LENGTH} characters or fewer.`;
  }
  return null;
};

const validateIsbn = (raw: string): string | null => {
  const trimmed = raw.trim();
  if (trimmed === "") {
    return null;
  }
  const cleaned = trimmed.replaceAll(ISBN_NOISE_PATTERN, "");
  if (!ISBN_DIGITS_PATTERN.test(cleaned)) {
    return "ISBN must be 10 or 13 digits.";
  }
  return null;
};

const validatePages = (raw: string): string | null => {
  const trimmed = raw.trim();
  if (trimmed === "") {
    return "Pages is required.";
  }
  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_PAGES) {
    return `Pages must be a whole number between 1 and ${MAX_PAGES.toLocaleString()}.`;
  }
  return null;
};

const validateRating = (value: number | null): string | null => {
  if (value === null) {
    return "Pick a rating from 1 to 5.";
  }
  return null;
};

interface FormValues {
  readonly author: string;
  readonly isbn: string;
  readonly pages: string;
  readonly rating: 1 | 2 | 3 | 4 | 5 | null;
  readonly title: string;
}

const validate = (input: FormValues): Errors => {
  const errors: Errors = {};
  const titleError = validateTitle(input.title);
  if (titleError) {
    errors.title = titleError;
  }
  const authorError = validateAuthor(input.author);
  if (authorError) {
    errors.author = authorError;
  }
  const isbnError = validateIsbn(input.isbn);
  if (isbnError) {
    errors.isbn = isbnError;
  }
  const pagesError = validatePages(input.pages);
  if (pagesError) {
    errors.pages = pagesError;
  }
  const ratingError = validateRating(input.rating);
  if (ratingError) {
    errors.rating = ratingError;
  }
  return errors;
};

const FIELD_ORDER: readonly FieldName[] = [
  "title",
  "author",
  "isbn",
  "pages",
  "rating",
];

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

interface BookFormRefs {
  readonly author: RefObject<HTMLInputElement | null>;
  readonly form: RefObject<HTMLFormElement | null>;
  readonly isbn: RefObject<HTMLInputElement | null>;
  readonly pages: RefObject<HTMLInputElement | null>;
  readonly rating: RefObject<HTMLInputElement | null>;
  readonly title: RefObject<HTMLInputElement | null>;
}

interface UseBookFormResult {
  readonly refs: BookFormRefs;
  readonly reset: () => void;
  readonly validate: (event: FormEvent<HTMLFormElement>) => Errors;
  readonly values: FormValues;
  readonly setters: {
    readonly setAuthor: (value: string) => void;
    readonly setIsbn: (value: string) => void;
    readonly setPages: (value: string) => void;
    readonly setRating: (value: 1 | 2 | 3 | 4 | 5 | null) => void;
    readonly setTitle: (value: string) => void;
  };
  readonly show: {
    readonly errors: Errors;
    readonly showErrors: boolean;
  };
}

const EMPTY_ERRORS: Errors = {};

const useBookForm = (): UseBookFormResult => {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [isbn, setIsbn] = useState("");
  const [pages, setPages] = useState("");
  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const [errors, setErrors] = useState<Errors>(EMPTY_ERRORS);
  const [showErrors, setShowErrors] = useState(false);

  const titleRef = useRef<HTMLInputElement>(null);
  const authorRef = useRef<HTMLInputElement>(null);
  const isbnRef = useRef<HTMLInputElement>(null);
  const pagesRef = useRef<HTMLInputElement>(null);
  const ratingRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const reset = useCallback(() => {
    setTitle("");
    setAuthor("");
    setIsbn("");
    setPages("");
    setRating(null);
    setErrors(EMPTY_ERRORS);
    setShowErrors(false);
  }, []);

  const focusFirstError = useCallback((nextErrors: Errors) => {
    const focusRefs: BookFormRefs = {
      author: authorRef,
      form: formRef,
      isbn: isbnRef,
      pages: pagesRef,
      rating: ratingRef,
      title: titleRef,
    };
    for (const field of FIELD_ORDER) {
      if (nextErrors[field]) {
        focusRefs[field].current?.focus();
        return;
      }
    }
  }, []);

  const handleValidate = useCallback(
    (event: FormEvent<HTMLFormElement>): Errors => {
      event.preventDefault();
      const nextErrors = validate({
        author,
        isbn,
        pages,
        rating,
        title,
      });
      setErrors(nextErrors);
      setShowErrors(true);
      focusFirstError(nextErrors);
      return nextErrors;
    },
    [author, focusFirstError, isbn, pages, rating, title]
  );

  return {
    refs: {
      author: authorRef,
      form: formRef,
      isbn: isbnRef,
      pages: pagesRef,
      rating: ratingRef,
      title: titleRef,
    },
    reset,
    setters: { setAuthor, setIsbn, setPages, setRating, setTitle },
    show: { errors, showErrors },
    validate: handleValidate,
    values: { author, isbn, pages, rating, title },
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

interface FormFieldsProps {
  readonly errors: Errors;
  readonly ids: {
    readonly author: string;
    readonly authorError: string;
    readonly isbn: string;
    readonly isbnError: string;
    readonly pages: string;
    readonly pagesError: string;
    readonly rating: string;
    readonly ratingError: string;
    readonly title: string;
    readonly titleError: string;
  };
  readonly refs: BookFormRefs;
  readonly setters: UseBookFormResult["setters"];
  readonly showErrors: boolean;
  readonly values: FormValues;
}

const FormFields = ({
  errors,
  ids,
  refs,
  setters,
  showErrors,
  values,
}: FormFieldsProps) => {
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

  const titleHasError = showErrors && Boolean(errors.title);
  const authorHasError = showErrors && Boolean(errors.author);
  const isbnHasError = showErrors && Boolean(errors.isbn);
  const pagesHasError = showErrors && Boolean(errors.pages);
  const ratingHasError = showErrors && Boolean(errors.rating);

  return (
    <div className="grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-6">
      <div className="md:col-span-6">
        <label className={labelClass} htmlFor={ids.title}>
          Title
        </label>
        <input
          {...inputBaseProps(ids.titleError, titleHasError)}
          aria-label="Title"
          id={ids.title}
          onChange={(event) => setters.setTitle(event.target.value)}
          placeholder="The book you just closed"
          ref={refs.title}
          type="text"
          value={values.title}
        />
        {titleHasError && errors.title ? (
          <FieldError id={ids.titleError} message={errors.title} />
        ) : null}
      </div>

      <div className="md:col-span-3">
        <label className={labelClass} htmlFor={ids.author}>
          Author
        </label>
        <input
          {...inputBaseProps(ids.authorError, authorHasError)}
          aria-label="Author"
          id={ids.author}
          onChange={(event) => setters.setAuthor(event.target.value)}
          placeholder="Last, First or First Last"
          ref={refs.author}
          type="text"
          value={values.author}
        />
        {authorHasError && errors.author ? (
          <FieldError id={ids.authorError} message={errors.author} />
        ) : null}
      </div>

      <div className="md:col-span-3">
        <label className={labelClass} htmlFor={ids.isbn}>
          ISBN <span className="font-normal text-ink-soft">optional</span>
        </label>
        <input
          {...inputBaseProps(ids.isbnError, isbnHasError)}
          aria-label="ISBN, optional"
          autoComplete="off"
          className={cn(fieldClass, "font-mono text-[0.875rem]")}
          id={ids.isbn}
          inputMode="numeric"
          onChange={(event) => setters.setIsbn(event.target.value)}
          placeholder="10 or 13 digits"
          ref={refs.isbn}
          type="text"
          value={values.isbn}
        />
        {isbnHasError && errors.isbn ? (
          <FieldError id={ids.isbnError} message={errors.isbn} />
        ) : null}
      </div>

      <div className="md:col-span-2">
        <label className={labelClass} htmlFor={ids.pages}>
          Pages
        </label>
        <input
          {...inputBaseProps(ids.pagesError, pagesHasError)}
          aria-label="Pages"
          className={cn(fieldClass, "font-mono")}
          id={ids.pages}
          inputMode="numeric"
          min={1}
          onChange={(event) => setters.setPages(event.target.value)}
          placeholder="0"
          ref={refs.pages}
          type="number"
          value={values.pages}
        />
        {pagesHasError && errors.pages ? (
          <FieldError id={ids.pagesError} message={errors.pages} />
        ) : null}
      </div>

      <div className="md:col-span-3">
        <p className={labelClass} id={ids.rating}>
          Rating
        </p>
        <div
          className={cn(
            "flex h-11 w-fit items-center rounded-md border border-hairline bg-paper px-1.5",
            ratingHasError ? "border-destructive" : ""
          )}
        >
          <RatingInput
            errorId={ids.ratingError}
            firstInputRef={refs.rating}
            hasError={ratingHasError}
            id={ids.rating}
            onChange={setters.setRating}
            value={values.rating}
          />
        </div>
        {ratingHasError && errors.rating ? (
          <FieldError id={ids.ratingError} message={errors.rating} />
        ) : null}
      </div>
    </div>
  );
};

export const AddBookForm = ({ onAdd }: AddBookFormProps) => {
  const form = useBookForm();
  const { collapse, expand, isExpanded, triggerRef } = useExpandCollapse({
    formRef: form.refs.form,
    onCollapse: form.reset,
    titleRef: form.refs.title,
  });
  const baseId = useId();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    const nextErrors = form.validate(event);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    onAdd({
      author: form.values.author.trim(),
      isbn: form.values.isbn.replaceAll(ISBN_NOISE_PATTERN, ""),
      pages: Number(form.values.pages.trim()),
      rating: form.values.rating as 1 | 2 | 3 | 4 | 5,
      title: form.values.title.trim(),
    });
    collapse();
  };

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
      onSubmit={handleSubmit}
      ref={form.refs.form}
    >
      <div className="mb-5 flex items-baseline justify-between">
        <h2 className="text-base font-medium text-ink">Add a book</h2>
        <p className="font-mono text-[11px] text-ink-soft">esc to close</p>
      </div>

      <FormFields
        errors={form.show.errors}
        ids={ids}
        refs={form.refs}
        setters={form.setters}
        showErrors={form.show.showErrors}
        values={form.values}
      />

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
