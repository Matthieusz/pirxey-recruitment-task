import { cn } from "@pirxey-recruitment-task/ui/lib/utils";
import { AlertCircle } from "lucide-react";
import type { ReactNode } from "react";

export const authFieldClassName = cn(
  "h-11 w-full rounded-md border border-hairline bg-paper px-3.5",
  "text-[0.9375rem] text-ink placeholder:text-ink-soft",
  "transition-colors duration-150",
  "focus-visible:border-magenta-soft focus-visible:outline-none",
  "focus-visible:ring-2 focus-visible:ring-magenta-soft/30",
  "aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-destructive/20",
  "disabled:cursor-not-allowed disabled:opacity-60"
);

export const authFieldLabelClassName =
  "mb-1.5 block text-[0.8125rem] font-medium text-ink-muted";

export const authFieldHelperClassName = "mt-1.5 text-[0.8125rem] text-ink-soft";

export const AuthFieldError = ({
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

export const AuthFieldHint = ({
  children,
}: {
  readonly children: ReactNode;
}) => <p className={authFieldHelperClassName}>{children}</p>;
