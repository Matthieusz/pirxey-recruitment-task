# Shelf

A private, durable record of books read.

This project evolved from the [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack) scaffold into a focused book-tracking app with authenticated user shelves.

**Demo:** The root route `/` displays a demo shelf with mock data (in-memory, resets on reload).  
**User shelves:** Sign up at `/login` to create your own persistent shelf at `/shelf/<username>`.

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

This creates all tables (user, session, account, verification, books).

### 5. Start development servers

```bash
pnpm run dev
```

- **Frontend:** [http://localhost:3001](http://localhost:3001)
- **API:** [http://localhost:3000](http://localhost:3000)
- **Auth endpoints:** `http://localhost:3000/api/auth/*`

---

## Routes

| Path               | Auth   | Description                                             |
| ------------------ | ------ | ------------------------------------------------------- |
| `/`                | Public | Demo shelf with mock data (in-memory, resets on reload) |
| `/login`           | Public | Sign in / Sign up                                       |
| `/shelf/$username` | Public | Read a user's shelf; add books if you're the owner      |

---

## Scripts

| Command                | Description                          |
| ---------------------- | ------------------------------------ |
| `pnpm run dev`         | Start all applications in dev mode   |
| `pnpm run build`       | Build all applications               |
| `pnpm run dev:web`     | Start only the web app               |
| `pnpm run dev:server`  | Start only the API server            |
| `pnpm run db:push`     | Push Drizzle schema to PostgreSQL    |
| `pnpm run db:generate` | Generate Drizzle migrations          |
| `pnpm run db:migrate`  | Run pending migrations               |
| `pnpm run db:studio`   | Open Drizzle Studio (GUI)            |
| `pnpm run db:start`    | Start PostgreSQL via Docker          |
| `pnpm run db:stop`     | Stop PostgreSQL container            |
| `pnpm run db:down`     | Stop and remove PostgreSQL container |
| `pnpm run check`       | Run Oxlint + Oxfmt                   |
| `pnpm run fix`         | Auto-fix lint and format issues      |

---

## Project Structure

```
├── apps/
│   ├── web/                    # Frontend (React + TanStack Start)
│   │   └── src/
│   │       ├── routes/         # TanStack Router file-based routes
│   │       │   ├── __root.tsx
│   │       │   ├── index.tsx   # Demo shelf
│   │       │   ├── login.tsx   # Sign in / Sign up
│   │       │   └── shelf/
│   │       │       └── $username.tsx  # User's persistent shelf
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
│   │       │   ├── books.ts    # Book CRUD + public shelf lookup
│   │       │   └── todo.ts     # Legacy scaffold (unused)
│   │       └── validators/
│   │           └── books.ts    # Shared Zod validators
│   ├── auth/                   # Better-Auth configuration
│   ├── db/                     # Drizzle schema & DB connection
│   │   └── src/schema/
│   │       ├── auth.ts         # User, session, account, verification
│   │       ├── books.ts        # Books table
│   │       └── todo.ts         # Legacy scaffold (unused)
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
- `(title, author)` — search by title/author

---

## Scale Considerations (10M records)

### ✅ Current

- `bigserial` ID type is sufficient for 10M+ rows
- `(user_id, finished_at)` composite index keeps per-user shelf queries fast
- Search uses PostgreSQL `ilike` with a `(title, author)` composite index (btree)

### 🔲 Loose ends for production scale

- **Cursor-based pagination:** The list endpoints return all results. For 10M records, implement cursor pagination (keyset pagination on `finished_at + id`).
- **Full-text search:** `ilike` with leading wildcards can't use the btree index efficiently for arbitrary prefixes. Replace with PostgreSQL `gin` index on `to_tsvector('english', title || ' ' || author)` and use `tsquery` for search.
- **Read replicas:** A production deployment would route read queries (public shelf views) to replicas and writes (book creation) to the primary.
- **Rate limiting:** Add rate limiting on the public `getShelfByUsername` endpoint to prevent abuse.
- **Connection pooling:** Use PgBouncer or similar for efficient connection management at scale.

---

## Loose Ends & Notes

1. **Scaffold remnants:** The `todo` table and `todoRouter` from the initial scaffold are still present in the backend (`packages/db/src/schema/todo.ts` and `packages/api/src/routers/todo.ts`). The frontend routes for todos and dashboard have been removed. The backend code is harmless but can be removed for production.

2. **ISBN validation:** The API validates ISBN length (10 or 13 digits) but does not perform checksum verification (Luhn for ISBN-10, weighted sum for ISBN-13). A real app would validate the check digit.

3. **Username enforcement:** Username uniqueness is enforced at the database level (unique constraint) and via Better-Auth's additional fields. The sign-up form validates character constraints but there's no dedicated API endpoint for checking username availability before submit.

4. **Session user data:** The `username` field is available in the Better-Auth session via the `additionalFields` configuration. The frontend accesses it via `session.user.username` (cast). This works with the current Better-Auth version but may need adjustment on upgrade.

5. **No email verification:** Better-Auth's email verification plugin is not enabled. Users can sign up and immediately use the app without verifying their email.

6. **No password reset:** There's no "forgot password" flow. Better-Auth supports it via a plugin.

7. **Demo route:** The `/` route uses mock data (`apps/web/src/data/books-mock.ts`) and in-memory React state. All books added there are lost on page reload. This is intentional — it's a demo.

8. **Testing:** Automated tests were not implemented within the scope of this task. The oRPC procedures and frontend components are structured to be testable: procedures accept typed inputs, validators are separated into their own module, and UI components accept callbacks.

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
