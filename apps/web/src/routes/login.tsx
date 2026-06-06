import { createFileRoute } from "@tanstack/react-router";

import { LoginRouteComponent } from "@/components/auth/login-route-component";

export const Route = createFileRoute("/login")({
  component: LoginRouteComponent,
  head: () => ({ meta: [{ title: "Shelf — Sign in" }] }),
});
