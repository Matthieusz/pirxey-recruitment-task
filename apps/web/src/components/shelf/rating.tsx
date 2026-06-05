import { cn } from "@pirxey-recruitment-task/ui/lib/utils";
import type { Ref } from "react";
import { useState } from "react";

const MARKS = [1, 2, 3, 4, 5] as const;

type Mark = (typeof MARKS)[number];

interface RatingDisplayProps {
  readonly className?: string;
  readonly value: 1 | 2 | 3 | 4 | 5;
}

export const RatingDisplay = ({ className, value }: RatingDisplayProps) => (
  <span className={cn("inline-flex items-center gap-[3px]", className)}>
    <span className="sr-only">Rated {value} of 5.</span>
    {MARKS.map((mark) => (
      <span
        aria-hidden="true"
        className={cn(
          "block h-3.5 w-[2px] rounded-[1px]",
          mark <= value ? "bg-magenta" : "bg-ink-soft/30"
        )}
        key={mark}
      />
    ))}
  </span>
);

interface RatingInputProps {
  readonly errorId?: string;
  readonly firstInputRef?: Ref<HTMLInputElement>;
  readonly hasError?: boolean;
  readonly id?: string;
  readonly onChange: (value: 1 | 2 | 3 | 4 | 5) => void;
  readonly value: 1 | 2 | 3 | 4 | 5 | null;
}

export const RatingInput = ({
  errorId,
  firstInputRef,
  hasError,
  id,
  onChange,
  value,
}: RatingInputProps) => {
  const [previewMark, setPreviewMark] = useState<Mark | null>(null);

  const filledThrough = previewMark ?? value ?? 0;
  const showLabel = previewMark !== null || value !== null;
  const labelText = `${filledThrough}/5`;

  const clearPreview = () => setPreviewMark(null);

  return (
    <div
      aria-describedby={hasError ? errorId : undefined}
      aria-invalid={hasError}
      aria-labelledby={id}
      className="flex items-center gap-2"
      role="radiogroup"
    >
      <div className="flex items-center gap-0.5">
        {MARKS.map((mark) => {
          const isFilled = mark <= filledThrough;
          const isChecked = value === mark;
          return (
            <label
              className={cn(
                "group/mark relative flex h-10 w-5 cursor-pointer items-center justify-center",
                "rounded-sm transition-colors hover:bg-page-edge/60"
              )}
              key={mark}
              onMouseEnter={() => setPreviewMark(mark)}
              onMouseLeave={clearPreview}
            >
              <input
                aria-label={`${mark} out of 5`}
                checked={isChecked}
                className="peer sr-only"
                name="book-rating"
                onBlur={clearPreview}
                onChange={() => onChange(mark)}
                onFocus={() => setPreviewMark(mark)}
                ref={mark === 1 ? firstInputRef : undefined}
                type="radio"
                value={mark}
              />
              <span
                aria-hidden="true"
                className={cn(
                  "block h-5 w-[2px] rounded-[1px] transition-colors duration-150",
                  isFilled
                    ? "bg-magenta"
                    : "bg-ink-soft/30 group-hover/mark:bg-magenta/30",
                  "peer-focus-visible:outline peer-focus-visible:outline-2",
                  "peer-focus-visible:outline-magenta-soft peer-focus-visible:outline-offset-4"
                )}
              />
            </label>
          );
        })}
      </div>
      {showLabel ? (
        <span
          aria-hidden="true"
          className="font-mono text-[0.75rem] text-ink-soft tabular-nums"
        >
          {labelText}
        </span>
      ) : null}
    </div>
  );
};
