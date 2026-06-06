import { createFileRoute } from "@tanstack/react-router";

import { ShelfRouteComponent } from "@/components/shelf/shelf-route-component";

export const Route = createFileRoute("/shelf/$name")({
  component: ShelfRouteComponent,
  errorComponent: ({ error }) => {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code: string }).code === "NOT_FOUND"
    ) {
      return (
        <main className="mx-auto w-full max-w-5xl px-5 py-20 text-center">
          <h1 className="text-2xl font-medium text-ink">Shelf not found</h1>
          <p className="mt-2 text-ink-muted">No user with that name exists.</p>
        </main>
      );
    }
    return (
      <main className="mx-auto w-full max-w-5xl px-5 py-20 text-center">
        <h1 className="text-2xl font-medium text-ink">Something went wrong</h1>
        <p className="mt-2 text-ink-muted">{(error as Error)?.message}</p>
      </main>
    );
  },
  head: ({ params }) => ({
    meta: [{ title: `${params.name}'s Shelf` }],
  }),
});
