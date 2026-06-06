import { cn } from "@pirxey-recruitment-task/ui/lib/utils";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";
import z from "zod";

import { authClient } from "@/lib/auth-client";

import {
  authFieldClassName,
  authFieldLabelClassName,
  authFieldHelperClassName,
  AuthFieldError,
} from "./auth/auth-field";

interface BetterAuthError {
  readonly code?: string;
  readonly message?: string;
  readonly status?: number;
  readonly statusText?: string;
}

const describeAuthError = (error: BetterAuthError | undefined): string => {
  if (!error) {
    return "Something went wrong. Try again.";
  }
  if (error.message && error.message.trim().length > 0) {
    return error.message;
  }
  if (error.statusText && error.statusText.trim().length > 0) {
    return error.statusText;
  }
  return "Something went wrong. Try again.";
};

export default function SignUpForm({
  onSwitchToSignIn,
}: {
  readonly onSwitchToSignIn: () => void;
}) {
  const navigate = useNavigate();
  const baseId = useId();
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    defaultValues: {
      email: "",
      name: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      setFormError(null);
      setIsSubmitting(true);
      await authClient.signUp.email(
        {
          email: value.email,
          name: value.name,
          password: value.password,
        },
        {
          onError: (ctx) => {
            setFormError(describeAuthError(ctx.error));
          },
          onSuccess: async () => {
            await navigate({
              params: { name: value.name },
              to: "/shelf/$name",
            });
            toast.success("Shelf started.");
          },
        }
      );
      setIsSubmitting(false);
    },
    validators: {
      onSubmit: z.object({
        email: z.email("Enter a valid email address."),
        name: z
          .string()
          .min(2, "Use at least 2 characters.")
          .max(100, "Use 100 characters or fewer.")
          .regex(
            /^[a-zA-Z0-9_-]+$/u,
            "Letters, digits, dashes, and underscores only."
          ),
        password: z.string().min(8, "Use at least 8 characters."),
      }),
    },
  });

  const ids = {
    email: `${baseId}-email`,
    emailError: `${baseId}-email-error`,
    name: `${baseId}-name`,
    nameError: `${baseId}-name-error`,
    nameHelp: `${baseId}-name-help`,
    password: `${baseId}-password`,
    passwordError: `${baseId}-password-error`,
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <header className="mb-8 md:mb-10">
        <h1 className="text-3xl font-medium tracking-tight text-ink md:text-[2rem]">
          Start a shelf
        </h1>
        <p className="mt-2 max-w-[55ch] text-[0.9375rem] text-ink-muted">
          Claim a name —{" "}
          <span className="font-mono text-ink-soft">/shelf/&lt;name&gt;</span>{" "}
          is your address.
        </p>
      </header>

      <form
        aria-label="Start a shelf"
        className="space-y-5"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void form.handleSubmit();
        }}
      >
        {formError ? (
          <div
            aria-live="polite"
            className="rounded-md border border-destructive/30 bg-destructive/5 px-3.5 py-2.5 text-[0.8125rem] text-destructive"
            role="alert"
          >
            {formError}
          </div>
        ) : null}

        <form.Field name="name">
          {(field) => {
            const hasError = field.state.meta.errors.length > 0;
            const helpId = hasError ? undefined : ids.nameHelp;
            return (
              <div>
                <label className={authFieldLabelClassName} htmlFor={ids.name}>
                  Your name
                </label>
                <input
                  aria-describedby={hasError ? ids.nameError : helpId}
                  aria-invalid={hasError}
                  aria-label="Your name"
                  autoComplete="username"
                  className={authFieldClassName}
                  id={ids.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder="e.g. ada"
                  type="text"
                  value={field.state.value}
                />
                {hasError ? (
                  field.state.meta.errors.map((error) => (
                    <AuthFieldError
                      id={ids.nameError}
                      key={error?.message}
                      message={error?.message ?? ""}
                    />
                  ))
                ) : (
                  <p className={authFieldHelperClassName} id={ids.nameHelp}>
                    Also the address of your shelf.
                  </p>
                )}
              </div>
            );
          }}
        </form.Field>

        <form.Field name="email">
          {(field) => {
            const hasError = field.state.meta.errors.length > 0;
            return (
              <div>
                <label className={authFieldLabelClassName} htmlFor={ids.email}>
                  Email
                </label>
                <input
                  aria-describedby={hasError ? ids.emailError : undefined}
                  aria-invalid={hasError}
                  aria-label="Email"
                  autoComplete="email"
                  className={authFieldClassName}
                  id={ids.email}
                  inputMode="email"
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder="you@example.com"
                  type="email"
                  value={field.state.value}
                />
                {field.state.meta.errors.map((error) => (
                  <AuthFieldError
                    id={ids.emailError}
                    key={error?.message}
                    message={error?.message ?? ""}
                  />
                ))}
              </div>
            );
          }}
        </form.Field>

        <form.Field name="password">
          {(field) => {
            const hasError = field.state.meta.errors.length > 0;
            return (
              <div>
                <label
                  className={authFieldLabelClassName}
                  htmlFor={ids.password}
                >
                  Password
                </label>
                <input
                  aria-describedby={hasError ? ids.passwordError : undefined}
                  aria-invalid={hasError}
                  aria-label="Password"
                  autoComplete="new-password"
                  className={authFieldClassName}
                  id={ids.password}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder="At least 8 characters"
                  type="password"
                  value={field.state.value}
                />
                {field.state.meta.errors.map((error) => (
                  <AuthFieldError
                    id={ids.passwordError}
                    key={error?.message}
                    message={error?.message ?? ""}
                  />
                ))}
              </div>
            );
          }}
        </form.Field>

        <button
          className={cn(
            "mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-md",
            "bg-magenta px-4 text-[0.9375rem] font-medium text-paper",
            "transition-colors duration-150",
            "hover:bg-magenta/90",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta-soft/40 focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
            "disabled:cursor-not-allowed disabled:opacity-60"
          )}
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? (
            <>
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              <span>Creating shelf</span>
            </>
          ) : (
            <span>Start shelf</span>
          )}
        </button>
      </form>

      <div className="mt-6 flex items-center gap-2 text-[0.8125rem] text-ink-muted">
        <span>Already have one?</span>
        <button
          className={cn(
            "rounded-sm font-medium text-ink underline-offset-4 transition-colors",
            "hover:text-magenta hover:underline",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta-soft/40"
          )}
          onClick={onSwitchToSignIn}
          type="button"
        >
          Sign in
        </button>
      </div>
    </div>
  );
}
