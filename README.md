# Shelf

A private, durable record of books read.

This project evolved from the [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack) scaffold into a focused book-tracking app with authenticated user shelves.

**Demo:** The root route `/` displays a shared PostgreSQL-backed demo shelf and links to the 10M-row demo.  
**10M demo:** `/demo/10m` displays a seeded Postgres shelf with TanStack Virtual, cursor pagination, and indexed title/author search.  
**User shelves:** Sign up at `/login` to create your own persistent shelf at `/shelf/<name>`.

---

## Tech Stack

- **Frontend:** React, TanStack Start, TanStack Router, TailwindCSS, shadcn/ui
- **Backend:** Hono, oRPC (end-to-end type-safe APIs)
- **Database:** PostgreSQL with Drizzle ORM
- **Auth:** Better-Auth (email/password)
- **Monorepo:** Turborepo, pnpm workspaces
- **Linting/formatting:** Oxlint + Oxfmt

---

## Getting Started

### Prerequisites

- Node.js >= 18
- pnpm >= 9
- PostgreSQL (use Docker or a local instance)

### 1. Install dependencies

```bash
pnpm install
```

### 2. Start PostgreSQL (Docker)

```bash
pnpm run db:start
```

This starts a Postgres container on port `5432` with user `postgres` and password `password`.

### 3. Configure environment variables

Copy the template and fill in your values:

**`apps/server/.env`**

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/pirxey-recruitment-task"
BETTER_AUTH_SECRET="<generate a random 32+ char string>"
BETTER_AUTH_URL="http://localhost:3000"
CORS_ORIGIN="http://localhost:3001"
NODE_ENV="development"
```

Generate a secure secret:

```bash
openssl rand -base64 32
```

**`apps/web/.env`** (or `.env.local`)

```env
VITE_SERVER_URL="http://localhost:3000"
```

### 4. Apply database schema

```bash
pnpm run db:push
```

This enables the `pg_trgm` extension, then creates all tables and indexes (user, session, account, verification, books).

### 5. Optional: seed the 10M-row demo

```bash
pnpm run db:seed:demo10m
```

Run this after `pnpm run db:start` and `pnpm run db:push`. The script creates/updates the `demo-10m` user and inserts exactly 10,000,000 real Postgres `books` rows in deterministic batches. It is resumable when the demo user has fewer than 10M rows and skips work when the count is already exactly 10M.

Expected local runtime depends heavily on disk and CPU, but plan for tens of minutes. The table plus indexes can require multiple GB of disk; keep at least 10–20GB free for the database volume and index build headroom. To rebuild from scratch, run:

```bash
SEED_DEMO10M_RESET=1 pnpm run db:seed:demo10m
```

### 6. Start development servers

```bash
pnpm run dev
```

- **Frontend:** [http://localhost:3001](http://localhost:3001)
- **API:** [http://localhost:3000](http://localhost:3000)
- **Auth endpoints:** `http://localhost:3000/api/auth/*`

---

## Routes

| Path           | Auth   | Description                                             |
| -------------- | ------ | ------------------------------------------------------- |
| `/`            | Public | Shared PostgreSQL-backed demo shelf and a 10M demo CTA  |
| `/demo/10m`    | Public | 10M-row Postgres demo with virtualized rendering/search |
| `/login`       | Public | Sign in / Sign up                                       |
| `/shelf/$name` | Public | Read a user's shelf; add books if you're the owner      |

---

## Scripts

| Command                    | Description                           |
| -------------------------- | ------------------------------------- |
| `pnpm run dev`             | Start all applications in dev mode    |
| `pnpm run build`           | Build all applications                |
| `pnpm run dev:web`         | Start only the web app                |
| `pnpm run dev:server`      | Start only the API server             |
| `pnpm run db:push`         | Push Drizzle schema to PostgreSQL     |
| `pnpm run db:generate`     | Generate Drizzle migrations           |
| `pnpm run db:migrate`      | Run pending migrations                |
| `pnpm run db:studio`       | Open Drizzle Studio (GUI)             |
| `pnpm run db:start`        | Start PostgreSQL via Docker           |
| `pnpm run db:stop`         | Stop PostgreSQL container             |
| `pnpm run db:down`         | Stop and remove PostgreSQL container  |
| `pnpm run db:seed:demo10m` | Seed exactly 10M rows for `/demo/10m` |
| `pnpm run check`           | Run Oxlint + Oxfmt                    |
| `pnpm run fix`             | Auto-fix lint and format issues       |

---

## Project Structure

```
├── apps/
│   ├── web/                    # Frontend (React + TanStack Start)
│   │   └── src/
│   │       ├── routes/         # TanStack Router file-based routes
│   │       │   ├── __root.tsx
│   │       │   ├── index.tsx   # Lightweight demo shelf
│   │       │   ├── login.tsx   # Sign in / Sign up
│   │       │   ├── demo/10m.tsx # 10M row demo shelf
│   │       │   └── shelf/
│   │       │       └── $name.tsx  # User's persistent shelf
│   │       ├── components/
│   │       │   ├── header.tsx
│   │       │   ├── user-menu.tsx
│   │       │   ├── sign-in-form.tsx
│   │       │   ├── sign-up-form.tsx
│   │       │   └── shelf/      # Reusable shelf UI components
│   │       └── data/
│   │           └── books-mock.ts  # Demo data
│   └── server/                 # Hono + oRPC server (entry point)
├── packages/
│   ├── api/                    # oRPC routers & procedures
│   │   └── src/
│   │       ├── routers/
│   │       │   ├── index.ts    # App router
│   │       │   └── books.ts    # Book CRUD + public shelf lookup
│   │       └── validators/
│   │           └── books.ts    # Shared Zod validators
│   ├── auth/                   # Better-Auth configuration
│   ├── db/                     # Drizzle schema & DB connection
│   │   └── src/schema/
│   │       ├── auth.ts         # User, session, account, verification
│   │       └── books.ts        # Books table
│   ├── env/                    # Type-safe environment variables
│   └── ui/                     # Shared shadcn/ui components
└── ...
```

---

## Database Schema

### `books` table

| Column        | Type               | Notes                            |
| ------------- | ------------------ | -------------------------------- |
| `id`          | `bigserial`        | Auto-incrementing primary key    |
| `user_id`     | `text` (FK → user) | Cascading delete                 |
| `title`       | `text`             | Required                         |
| `author`      | `text`             | Required                         |
| `isbn`        | `text`             | Required, stored as clean digits |
| `pages`       | `integer`          | > 0                              |
| `rating`      | `integer`          | 1–5                              |
| `finished_at` | `date`             | Defaults to today                |
| `created_at`  | `timestamp`        | Auto-set                         |
| `updated_at`  | `timestamp`        | Auto-updated                     |

**Indexes:**

- `(user_id, finished_at)` — primary shelf ordering
- `(user_id, finished_at, id)` — stable keyset cursor pagination ordered by `(finished_at, id)`
- GIN expression index on `to_tsvector('simple', title || ' ' || author)` — full-text title/author search

---

## Scale Considerations (10M records)

### ✅ Current

- `bigserial` ID type is sufficient for 10M+ rows.
- List endpoints use keyset cursor pagination with a capped page size instead of returning an entire shelf.
- `BookList` uses TanStack Virtual so only visible rows are mounted in the browser.
- Search uses PostgreSQL full-text prefix search (`to_tsquery`) over title and author only, backed by a GIN expression index. Trigram GIN indexes on `title` and `author` are also provisioned via `pg_trgm` for future substring/fuzzy-search tuning.
- Search input is debounced before server queries are issued.

### Notes for production scale

- The GIN index makes title/author search viable at 10M rows. Very broad terms can still return many matches and require sorting by shelf order, so production should verify query plans with real data and tune indexes from `EXPLAIN ANALYZE`.
- `COUNT(*)` is intentionally not run on every paged request; UI labels report loaded rows and `+` when another page exists.
- A production deployment would add rate limiting, connection pooling/PgBouncer, and likely read replicas for public shelf traffic.

---

## Loose Ends & Notes

1. **ISBN validation:** The API validates ISBN length (10 or 13 digits) but does not perform checksum verification (Luhn for ISBN-10, weighted sum for ISBN-13). A real app would validate the check digit.

2. **Shelf name enforcement:** Shelf names use Better Auth's `user.name` field, which is unique in the database. The sign-up form validates character constraints but there's no dedicated API endpoint for checking name availability before submit.

3. **Session user data:** The frontend uses `session.user.name` as the public shelf slug. If display names and shelf slugs need to diverge later, add a separate immutable `slug` column.

4. **No email verification:** Better-Auth's email verification plugin is not enabled. Users can sign up and immediately use the app without verifying their email.

5. **No password reset:** There's no "forgot password" flow. Better-Auth supports it via a plugin.

6. **Demo route:** The `/` route uses a shared PostgreSQL demo user. Anyone running or visiting the local demo can add rows to that shared shelf. Reset it by clearing the demo user's rows from Postgres.

7. **Testing:** Automated tests cover API validators, book procedures, env validation, server routing, shelf UI components, rating input, search input, and debounce behavior. Current verification: `pnpm run test` and `pnpm run check-types` pass.

8. **AI usage:** AI assistance was used to review and polish the implementation. Output was verified with automated tests, repository type checking, formatting checks, and direct code inspection against `task.md`.

---

## Environment Variables Reference

| Variable             | Required | Description                                          |
| -------------------- | -------- | ---------------------------------------------------- |
| `DATABASE_URL`       | Yes      | PostgreSQL connection string                         |
| `BETTER_AUTH_SECRET` | Yes      | 32+ char random string for session signing           |
| `BETTER_AUTH_URL`    | Yes      | Server base URL (e.g. `http://localhost:3000`)       |
| `CORS_ORIGIN`        | Yes      | Frontend URL for CORS (e.g. `http://localhost:3001`) |
| `NODE_ENV`           | No       | `development`, `production`, or `test`               |
| `VITE_SERVER_URL`    | Yes      | API server URL for the frontend                      |
