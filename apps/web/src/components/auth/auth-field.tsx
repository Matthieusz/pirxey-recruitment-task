import { AlertCircle } from "lucide-react";

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
