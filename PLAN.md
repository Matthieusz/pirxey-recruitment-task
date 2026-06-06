# Backend plan for authenticated shelves

## Context

The app currently has a polished demo shelf at `/` backed by `apps/web/src/data/books-mock.ts` and in-memory React state. The backend stack is already present: Hono server, oRPC, Better Auth, Drizzle, and PostgreSQL via the local Docker compose database.

The requested change is to keep `/` as the demo, clearly label it as demo data, and add authenticated user shelves at `/shelf/username` so users can log in and persist the books they have read.

## Approach

Use the existing stack rather than introducing a new backend:

- Better Auth remains responsible for email/password registration, login, sessions, and cookies.
- PostgreSQL + Drizzle become the durable book store.
- oRPC exposes type-safe book/profile procedures to the frontend.
- `/` stays the unauthenticated demo route; `/shelf/$username` becomes the database-backed shelf route.
- Server-side validation mirrors the frontend form limits so the API is the source of truth.
- Design the schema and read paths for up to 10M book rows: user-scoped indexes, cursor pagination, and indexed title/author search.

## Files to modify

Likely backend/database files:

- `packages/db/src/schema/index.ts`
- `packages/db/src/schema/auth.ts` or a new profile schema file
- `packages/db/src/schema/books.ts`
- `packages/api/src/routers/index.ts`
- `packages/api/src/routers/books.ts`
- `packages/api/src/routers/profile.ts`
- `packages/api/src/index.ts`

Likely frontend integration files:

- `apps/web/src/routes/index.tsx`
- `apps/web/src/routes/login.tsx`
- `apps/web/src/routes/_auth/route.tsx`
- New `apps/web/src/routes/_auth/shelf/$username.tsx` or equivalent TanStack file-route
- `apps/web/src/components/shelf/add-book-form.tsx`
- `apps/web/src/components/shelf/book-list.tsx`
- `apps/web/src/components/shelf/search-bar.tsx`
- `apps/web/src/components/sign-up-form.tsx`
- `apps/web/src/components/sign-in-form.tsx`
- `apps/web/src/components/user-menu.tsx`
- `apps/web/src/utils/orpc.ts`

Documentation/update files:

- `README.md`
- Possibly `task.md` notes or a separate implementation-notes markdown file

## Reuse

Existing code and patterns to reuse:

- Auth/session guard: `packages/api/src/index.ts` already has `protectedProcedure`.
- Request context: `packages/api/src/context.ts` already loads the Better Auth session from request headers.
- Auth backend: `packages/auth/src/index.ts` already configures Better Auth with Drizzle and email/password.
- Database wiring: `packages/db/src/index.ts` already exports `db` and `createDb()`.
- oRPC router shape: `packages/api/src/routers/books.ts` shows the existing router pattern.
- Frontend oRPC query/mutation setup: `apps/web/src/utils/orpc.ts` and `apps/web/src/routes/shelf/$name.tsx`.
- Existing shelf UI components: `apps/web/src/components/shelf/*`.
- Existing auth UI scaffolding: `apps/web/src/components/sign-in-form.tsx`, `sign-up-form.tsx`, `user-menu.tsx`, and `apps/web/src/routes/_auth/route.tsx`.

## Steps

- [ ] Decide username/profile behavior and shelf visibility.
- [ ] Add a durable username/profile model if needed.
- [ ] Add `books` table with owner FK, normalized ISBN, rating/pages constraints, timestamps, and search/index strategy.
- [ ] Add book validation schemas shared by create/list/search procedures.
- [ ] Add protected oRPC procedures for creating and listing the signed-in user's books.
- [ ] Add public or protected lookup for `/shelf/:username` depending on the desired shelf visibility.
- [ ] Wire the authenticated shelf route to oRPC queries/mutations and keep the current `/` route as a labeled demo.
- [ ] Redirect login/signup success to the signed-in user's shelf rather than the scaffold dashboard.
- [ ] Update header/user-menu links to point at demo, login, and the user's shelf.
- [ ] Remove or leave scaffold todo/dashboard routes intentionally, with notes if left in place.
- [ ] Update README with DB setup, migration commands, auth env vars, and loose ends.

## Verification

- Run type checks for affected packages.
- Run the database locally with the existing `pnpm run db:start` flow and apply Drizzle schema changes.
- Verify auth manually: sign up, sign out, sign in, invalid credentials, and session persistence after reload.
- Verify `/` still works as demo data and explicitly says it resets / is demo-only.
- Verify `/shelf/username` loads only the relevant user's persisted books.
- Verify add-book validation: required title/author/pages/rating, optional ISBN, page/rating bounds, max lengths.
- Verify search by title/author and empty/no-match states.
- Verify unauthorized create/list attempts fail with `UNAUTHORIZED`.
- For scale reasoning, inspect generated SQL/indexes and optionally seed a larger local dataset to test query plans.

## Decisions confirmed

1. `/shelf/username` is **publicly readable** by anyone with the URL.
2. `username` is **collected during sign-up** and must be unique.
3. Users are **allowed to log the same book/ISBN multiple times**.
4. **ISBN is required** for both demo and authenticated shelves.

## Detailed plan

### Schema changes

- `packages/db/src/schema/auth.ts`: add `username` to the `user` table with a `unique()` constraint. Better-Auth with the Drizzle adapter should preserve custom fields in the schema, and the `signUp.email` endpoint should accept `username` as an additional user field.
- New `packages/db/src/schema/books.ts`: create the `books` table with:
  - `id` as `bigserial` (10M scale)
  - `userId` FK to `user.id` with `onDelete: "cascade"`
  - `title`, `author`, `isbn` all required (isbn is not nullable)
  - `pages` as `integer` with a check for `> 0`
  - `rating` as `integer` with a check for `1..5`
  - `finishedAt` as `date` or `timestamp` defaulting to `now()`
  - Composite indexes on `(userId, finishedAt)` for shelf ordering and `(title, author)` for search.

### API changes

- `packages/api/src/routers/profile.ts`: a public `getByUsername` procedure that selects the user by `username` and returns the user id/name for the shelf page.
- `packages/api/src/routers/books.ts`:
  - `create` — protected procedure, validates the same rules as the frontend, inserts into `books`.
  - `list` — protected procedure, returns the current user’s books ordered by `finishedAt DESC`, with optional server-side `title/author` filtering via `ilike`.
  - `getShelfByUsername` — public procedure, looks up the user by `username`, then returns their books (same order/filter shape as `list`). This is what `/shelf/username` calls.

### Frontend changes

- `apps/web/src/components/sign-up-form.tsx`: add a `username` field, wire it into the `signUp.email` call, and add a server-side uniqueness check in the error handler.
- `apps/web/src/routes/index.tsx`: keep demo data, add a clear “demo” label to the header and footer, and add a CTA link to sign up or view the user’s shelf.
- New route `apps/web/src/routes/shelf/$username.tsx`: public shelf route that uses `orpc.profile.getByUsername` and `orpc.books.getShelfByUsername` to render the book list. Reuses the existing `BookList` and `SearchBar` components.
- `apps/web/src/routes/_auth/route.tsx`: adjust the auth layout. After login, redirect to `/shelf/<username>` instead of `/dashboard`.
- `apps/web/src/components/user-menu.tsx`: add a link to the user’s shelf and adjust the login flow.
- `apps/web/src/components/shelf/add-book-form.tsx`: wire the `onAdd` callback to the `orpc.books.create` mutation. Keep the same validation rules; now ISBN is required (update the validation and the label copy).
- `apps/web/src/components/shelf/book-list.tsx`: no changes needed structurally; it already accepts `readonly Book[]`.
- `apps/web/src/components/shelf/search-bar.tsx`: same search bar; the shelf route uses the same search state.

### Removed / deprecated

- The scaffold `/dashboard` and `/todos` routes are no longer needed.

### Scale considerations

- `books.id` uses `bigserial` for the 10M-row target.
- Index `books.userId` + `books.finishedAt` supports the primary list query.
- For search, a composite `gin` index on `title` and `author` would be ideal, but a `btree` composite index on `(title, author)` plus `ilike` is the pragmatic first step given the timeframe. Document this as a loose end.
- Cursor pagination (limit/offset) is documented as a loose end; the first pass returns a capped list with a note about pagination at scale.

### Verification steps

- Run `pnpm run db:push` after schema changes.
- Run `pnpm run fix` and `pnpm run check`.
- Start the server and DB, then manually:
  - Sign up with a unique username.
  - Confirm the shelf is empty.
  - Add a book with all required fields; confirm it appears on the shelf.
  - Search the shelf by title and author.
  - Log out and verify the shelf is still readable at `/shelf/<username>`.
  - Verify the demo route still works and shows the demo label.
  - Verify invalid data (missing ISBN, bad rating, too many pages) returns clear errors.
- Optionally seed a few thousand rows locally to confirm the index strategy is used via `EXPLAIN`.
