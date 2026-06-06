# 10M demo shelf plan

## Context

The current home demo at `/` is still an in-memory mock shelf from `apps/web/src/data/books-mock.ts`, and `BookList` renders every row with a normal `.map()`. The database-backed shelf already exists through Drizzle/Postgres and oRPC, but the current list/search endpoints return all rows for a shelf and search uses `ilike '%query%'`, which will not work for a 10 million row demo.

Goal: keep the initial `/` demo lightweight, add a clear button from it to a 10M-row Postgres-backed demo shelf, render that large demo with TanStack Virtual, and keep title/author search performant at that scale.

## Approach

Use the existing Postgres + Drizzle + oRPC + TanStack Query stack. Keep `/` as the current lightweight mock demo, but add a prominent button linking to a dedicated 10M demo route, likely `/shelf/demo-10m` or `/demo/10m`. Add `@tanstack/react-virtual` to the web app, convert the large shelf list to virtualized rows, and change large-demo/shelf reads to server-side paged queries instead of loading all books. Use Postgres full-text search and supporting indexes for title/author search only. Add a DB seed script that creates/ensures a demo user and bulk-inserts exactly 10,000,000 real Postgres book rows in batches.

## Files to modify

- `apps/web/package.json`
- `apps/web/src/routes/index.tsx`
- New `apps/web/src/routes/demo/10m.tsx` or reuse `apps/web/src/routes/shelf/$name.tsx` with a seeded demo user
- `apps/web/src/routes/shelf/$name.tsx`
- `apps/web/src/components/shelf/book-list.tsx`
- `packages/api/src/routers/books.ts`
- `packages/api/src/validators/books.ts`
- `packages/db/package.json`
- `packages/db/src/schema/books.ts`
- New `packages/db/src/seed-demo-10m.ts`
- Possibly `README.md`

## Reuse

- Existing DB connection: `packages/db/src/index.ts` exports `db`/`createDb()`.
- Existing user table: `packages/db/src/schema/auth.ts` has unique `user.name`; seed can create a stable `demo` user.
- Existing books schema: `packages/db/src/schema/books.ts` already has `bigserial` ids and user/finished ordering indexes.
- Existing oRPC endpoint shape: `packages/api/src/routers/books.ts` has `getShelfByName`, `list`, and `create` procedures.
- Existing search validation: `packages/api/src/validators/books.ts` has `listBooksSchema` and `nameSchema`.
- Existing UI row markup: `apps/web/src/components/shelf/book-list.tsx` has `BookRow` presentation that can be reused inside a virtual list.

## Steps

- [ ] Add `@tanstack/react-virtual` to `apps/web/package.json`.
- [ ] Update `books` schema/indexes for scale: keep `(user_id, finished_at)` ordering, add an index suitable for stable cursor/id ordering, and add a generated/search-vector or expression GIN index for full-text title+author search.
- [ ] Extend list validators to accept `query`, `cursor`, and `limit` with a capped page size.
- [ ] Replace full-list API responses with paged responses: `{ books, nextCursor, totalCount? }`, ordered by a stable descending key such as `(finishedAt, id)`.
- [ ] Implement performant search in `booksRouter` using Postgres full-text search (`websearch_to_tsquery`/`plainto_tsquery`) against title and author only.
- [ ] Add a seed script `packages/db/src/seed-demo-10m.ts` that creates/updates the demo user and inserts exactly 10,000,000 real Postgres rows using deterministic generated values and large multi-row batches, with progress logging and idempotency safeguards.
- [ ] Add package/root scripts, e.g. `pnpm db:seed:demo10m`, to run the seed after `db:start` and `db:push`/migration.
- [ ] Convert `BookList` to a TanStack Virtual list, preserving empty/no-match states and row styling while only mounting visible rows.
- [ ] Keep `/` as the lightweight initial mock demo and add a prominent “View 10M row demo” button.
- [ ] Add the target 10M demo route, backed by the seeded demo user and using TanStack Query infinite pagination plus server-side title/author search.
- [ ] Update `/shelf/$name` to use the same paged/infinite query and virtualized `BookList` so real shelves also scale.
- [ ] Debounce search input or defer query updates on the frontend so each keystroke does not immediately fire a 10M-row query.
- [ ] Update docs with the 10M demo seed command, expected runtime, disk requirements, and search/index notes.

## Verification

- Run `pnpm db:start`, apply schema changes, then run the new 10M seed command.
- Confirm the seed reports exactly 10,000,000 rows for the demo user and can be re-run safely.
- Use `EXPLAIN ANALYZE` on non-search and search list queries to confirm indexes are used and query times are demo-acceptable.
- Run `pnpm check-types` and `pnpm check`.
- Start the app and verify `/` remains the lightweight initial demo and its new button opens the 10M demo route.
- Verify the 10M demo route loads without freezing, scrolls smoothly, and only renders visible rows.
- Search common and uncommon title/author terms; verify response stays responsive, pagination continues to work, and no-match state appears quickly.
- Verify authenticated `/shelf/:name` still supports owner add-book behavior and renders newly added rows correctly.

## Decisions confirmed

1. `/` should stay as the initial lightweight demo and include a button/link to the 10M version.
2. The 10M demo must be backed by exactly 10,000,000 real Postgres book rows.
3. Search only needs to cover title and author.

## Remaining implementation choice

Use `/demo/10m` for the dedicated route unless there is a strong routing reason to reuse `/shelf/demo-10m`. This keeps the 10M demo distinct from user shelves while still reusing the same underlying paged shelf components and API.
