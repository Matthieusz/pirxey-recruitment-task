# Comprehensive Vitest pre-commit suite plan

## Goal

Implement a fast, deterministic Vitest-based test suite that can run before every commit without requiring dev servers, production builds, or a seeded Postgres instance.

## Current baseline

- Monorepo: pnpm workspaces + Turborepo.
- Existing pre-commit hook: `lefthook.yml` runs `oxlint --fix` and `oxfmt --write` on staged files.
- No existing `*.test.*` / `*.spec.*` files.
- `apps/web` already has Testing Library and `jsdom`, but `vitest` is not installed.
- Server entrypoint starts Hono immediately on import, so it needs a small testability seam before HTTP tests.

## Target commands

- Root scripts:
  - `pnpm run test` → `turbo run test`
  - `pnpm run test:watch` → `turbo run test:watch`
  - `pnpm run test:precommit` → `ultracite check && turbo run check-types test --affected`
  - Optional: `pnpm run test:coverage` → `turbo run test:coverage`
- Lefthook:
  - Keep staged formatting/linting.
  - Add a non-mutating job: `pnpm run test:precommit`.
  - Prefer ordering format/fix jobs before tests, not all jobs fully parallel, so tests see final staged code.

## Dependencies

Add shared dev dependencies through the workspace catalog/root tooling:

- `vitest`
- `@vitest/coverage-v8`
- `@testing-library/user-event`
- `@testing-library/jest-dom`

`apps/web` already has `@testing-library/react`, `@testing-library/dom`, and `jsdom`.

## Configuration

1. Add a shared Vitest base config package/file, reusing repo TypeScript settings.
2. Add package-level Vitest configs:
   - Node environment: `packages/api`, `packages/auth`, `packages/db`, `packages/env`, `apps/server`.
   - jsdom environment: `apps/web`, `packages/ui`.
3. Add setup files:
   - Web/UI: import `@testing-library/jest-dom/vitest`.
   - Global cleanup for Testing Library.
   - Mock browser-only APIs where needed, e.g. `ResizeObserver`, `IntersectionObserver`, `matchMedia`.
4. Add Turbo tasks:
   - `test`: cacheable, no outputs by default.
   - `test:watch`: `cache: false`, `persistent: true`.
   - `test:coverage`: outputs `coverage/**`.

## Required testability seams

1. `apps/server/src/index.ts`
   - Extract Hono construction into `createApp()` or `app` export.
   - Keep `serve(...)` in a tiny runtime entrypoint or behind a main-module guard.
   - Tests use `app.request()`; no server process starts.

2. API/database logic
   - Prefer testing public schemas and router behavior.
   - If query builder mocking becomes brittle, extract book data access into a small repository module with a typed interface and inject/fake it in tests.
   - Do not require Docker/Postgres for the pre-commit suite.

3. Frontend helpers
   - Export only stable helpers worth testing directly, or test behavior through components.
   - Avoid exporting private implementation details solely for tests unless it reduces brittle UI tests.

## Test coverage by area

### `packages/api`

Primary tests:

- `validators/books.test.ts`
  - ISBN required.
  - ISBN strips spaces/dashes.
  - ISBN rejects non-10/13-digit values.
  - Title/author max length boundaries.
  - Pages min/max/integer boundaries.
  - Rating 1–5 boundaries.
  - List limit defaults and caps at `MAX_BOOKS_PAGE_SIZE`.
  - Shelf name required/max length.

- `routers/books.test.ts`
  - `create` rejects missing session with `UNAUTHORIZED`.
  - `create` inserts with `context.session.user.id`.
  - `createAnonymous` ensures demo user before inserting.
  - `getShelfByName` returns `null` for unknown users.
  - `getShelfByName` returns user, books, and `nextCursor` for known users.
  - Pagination requests `limit + 1` and encodes the last visible book.
  - Invalid cursors are ignored safely.
  - Search query is trimmed before applying search condition.

### `packages/db`

Primary tests:

- Schema shape tests for exported tables:
  - `books` has required owner FK, ISBN/title/author/pages/rating fields.
  - Search and ordering indexes are defined.
- Seed helper tests if logic is extractable without running the 10M seed.

Keep true DB migration/query-plan checks out of pre-commit unless a lightweight test database is introduced later.

### `packages/env`

Primary tests:

- Server env parser accepts valid minimal variables.
- Server env parser rejects missing/invalid `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `CORS_ORIGIN`.
- Web env parser accepts valid `VITE_SERVER_URL`.

If current modules read `process.env` at import time, use `vi.stubEnv` + dynamic import + `vi.resetModules()`.

### `apps/server`

Primary tests with Hono `app.request()`:

- `GET /` returns `200 OK` with body `OK`.
- CORS headers are present for allowed origin.
- `OPTIONS` preflight succeeds for configured methods/headers.
- `/rpc/*` requests are delegated to the RPC handler.
- `/api/auth/*` requests are delegated to Better Auth handler.
- Error interceptor logs/handles errors without leaking stack traces to normal responses.

### `apps/web`

Primary component/hook tests:

- `useDebouncedValue`
  - Returns initial value immediately.
  - Updates only after timeout.
  - Clears timeout on value changes/unmount.

- `AddBookForm`
  - Starts collapsed.
  - Expands and focuses title.
  - Shows required-field errors.
  - Validates ISBN, pages, and rating bounds.
  - Calls `onAdd` with typed values on valid submit.
  - Resets/collapses after successful add if current behavior expects that.
  - Escape collapses only while focus is inside the form.

- `BookList`
  - Empty shelf state.
  - No-match state and clear-search action.
  - Renders title/author/rating/ISBN/pages/finished date.
  - Calls `onLoadMore` when virtual list reaches the end.
  - Shows loading row while fetching next page.

- `SearchBar`
  - Emits changes.
  - Clear button clears input and restores focus.
  - Accessible label/role checks.

- Route-level smoke tests where practical:
  - Shelf loading state.
  - Not-found state.
  - Owner sees add form; non-owner does not.

### `packages/ui`

Primary tests:

- Utility functions such as `cn` merge classes predictably.
- Any exported primitives/components render with required accessibility attributes if they contain behavior beyond shadcn passthroughs.

## Pre-commit scope

Run on every commit:

1. Format/lint staged files through current Lefthook jobs.
2. `ultracite check`.
3. `turbo run check-types test --affected`.

Do not run before every commit:

- `pnpm run build`.
- Dev servers.
- Docker/Postgres startup.
- 10M seed.
- Slow browser E2E tests.

## Implementation phases

1. **Tooling foundation**
   - Add Vitest deps.
   - Add configs/setup files.
   - Add package scripts and Turbo tasks.
   - Add root test scripts.
   - Verify `pnpm run test -- --run` or equivalent package-level command works.

2. **Pure validation tests**
   - Start with `packages/api/src/validators/books.test.ts`.
   - Add env parser tests.
   - These should be fast and establish the test pattern.

3. **React component tests**
   - Add jsdom setup.
   - Test `useDebouncedValue`, `AddBookForm`, `BookList`, and `SearchBar`.
   - Mock virtualization/browser APIs only in setup, not in each test.

4. **Server/API tests**
   - Refactor server entrypoint to export app construction without starting a listener.
   - Add Hono `app.request()` tests.
   - Add router tests with typed fakes or extracted repository seam.

5. **Pre-commit integration**
   - Wire `pnpm run test:precommit` into Lefthook.
   - Confirm it is deterministic from a clean checkout.
   - Document expected runtime and escape hatch, if any.

6. **Coverage/reporting**
   - Add optional coverage command.
   - Start with pragmatic thresholds after baseline is known, then ratchet up.
   - Exclude generated files such as `routeTree.gen.ts`.

## Acceptance criteria

- `pnpm run test` runs Vitest across relevant workspaces through Turbo.
- `pnpm run test:precommit` runs lint/check-types/tests without builds or dev servers.
- Lefthook runs the pre-commit test command.
- Tests cover validators, key shelf UI behavior, server routing, and API auth/list/create behavior.
- The suite is deterministic without Postgres or network access.
- Generated files and heavyweight seed/demo paths are excluded or tested only via extracted pure helpers.
