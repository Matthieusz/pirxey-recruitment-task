import { cn } from "@pirxey-recruitment-task/ui/lib/utils";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";
import z from "zod";

import { authClient } from "@/lib/auth-client";

import { AuthFieldError } from "./auth/auth-field";
import {
  authFieldClassName,
  authFieldLabelClassName,
} from "./auth/auth-field-styles";

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

export default function SignInForm({
  onSwitchToSignUp,
}: {
  readonly onSwitchToSignUp: () => void;
}) {
  const navigate = useNavigate();
  const baseId = useId();
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      setFormError(null);
      setIsSubmitting(true);
      await authClient.signIn.email(
        {
          email: value.email,
          password: value.password,
        },
        {
          onError: (ctx) => {
            setFormError(describeAuthError(ctx.error));
          },
          onSuccess: async () => {
            const session = await authClient.getSession();
            const name = session.data?.user?.name;
            await navigate(
              name ? { params: { name }, to: "/shelf/$name" } : { to: "/" }
            );
            toast.success("Signed in.");
          },
        }
      );
      setIsSubmitting(false);
    },
    validators: {
      onSubmit: z.object({
        email: z.email("Enter a valid email address."),
        password: z.string().min(1, "Enter your password."),
      }),
    },
  });

  const ids = {
    email: `${baseId}-email`,
    emailError: `${baseId}-email-error`,
    password: `${baseId}-password`,
    passwordError: `${baseId}-password-error`,
  };

  const handleSubmit = useCallback(() => {
    void form.handleSubmit();
  }, [form]);

  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const formElement = formRef.current;
    if (!formElement) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Enter") {
        return;
      }
      if (event.target instanceof HTMLTextAreaElement) {
        return;
      }
      event.preventDefault();
      handleSubmit();
    };
    formElement.addEventListener("keydown", handleKeyDown);
    return () => {
      formElement.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleSubmit]);

  return (
    <div className="mx-auto w-full max-w-md">
      <header className="mb-8 md:mb-10">
        <h1 className="text-3xl font-medium tracking-tight text-ink md:text-[2rem]">
          Sign in
        </h1>
        <p className="mt-2 max-w-[55ch] text-[0.9375rem] text-ink-muted">
          Open your shelf.
        </p>
      </header>

      <form aria-label="Sign in" className="space-y-5" ref={formRef}>
        {formError ? (
          <div
            aria-live="polite"
            className="rounded-md border border-destructive/30 bg-destructive/5 px-3.5 py-2.5 text-[0.8125rem] text-destructive"
            role="alert"
          >
            {formError}
          </div>
        ) : null}

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
                  autoComplete="current-password"
                  className={authFieldClassName}
                  id={ids.password}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder="Your password"
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
          onClick={handleSubmit}
          type="button"
        >
          {isSubmitting ? (
            <>
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              <span>Signing in</span>
            </>
          ) : (
            <span>Sign in</span>
          )}
        </button>
      </form>

      <div className="mt-6 flex items-center gap-2 text-[0.8125rem] text-ink-muted">
        <span>Need a shelf?</span>
        <button
          className={cn(
            "rounded-sm font-medium text-ink underline-offset-4 transition-colors",
            "hover:text-magenta hover:underline",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta-soft/40"
          )}
          onClick={onSwitchToSignUp}
          type="button"
        >
          Start one
        </button>
      </div>
    </div>
  );
}
