import { redirect } from "@tanstack/react-router";
import type * as React from "react";
import { useEffect, useState } from "react";

import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";
import { authClient } from "@/lib/auth-client";

export const LoginRouteComponent = (): React.JSX.Element => {
  const { data: session, isPending } = authClient.useSession();
  const [mode, setMode] = useState<"signUp" | "signIn">("signUp");

  useEffect(() => {
    if (isPending) {
      return;
    }
    const name = session?.user?.name;
    if (name) {
      void redirect({
        params: { name },
        to: "/shelf/$name",
      });
    }
  }, [isPending, session]);

  if (isPending || session?.user?.name) {
    return (
      <main
        aria-busy="true"
        className="mx-auto flex min-h-[60vh] w-full max-w-5xl items-center px-5 sm:px-8"
      >
        <p className="text-ink-muted text-[0.9375rem]">Loading…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8 sm:py-14 md:py-20">
      {mode === "signIn" ? (
        <SignInForm onSwitchToSignUp={() => setMode("signUp")} />
      ) : (
        <SignUpForm onSwitchToSignIn={() => setMode("signIn")} />
      )}
    </main>
  );
};
