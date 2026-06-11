# Shelf

---

## Stack

- **Frontend:** React, TanStack Start, TanStack Router, TailwindCSS, shadcn/ui
- **Backend:** Hono, oRPC
- **Baza danych:** PostgreSQL z Drizzle ORM
- **Uwierzytelnianie:** Better-Auth (email/hasło)
- **Monorepo:** Turborepo, pnpm workspaces
- **Lintowanie/formatowanie:** Oxlint + Oxfmt

---

## Wymagania wstępne

- Node.js >= 18
- pnpm >= 9
- PostgreSQL (użyj Dockera lub lokalnej instancji)

### 1. Zainstaluj zależności

```bash
pnpm install
```

### 2. Uruchom PostgreSQL (Docker)

```bash
pnpm run db:start
```

To polecenie uruchamia kontener Postgres na porcie `5432` z użytkownikiem `postgres` i hasłem `password`.

### 3. Skonfiguruj zmienne środowiskowe

Skopiuj szablon i uzupełnij własnymi wartościami:

**`apps/server/.env`**

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/pirxey-recruitment-task"
BETTER_AUTH_SECRET="<wygeneruj losowy ciąg o długości 32+ znaków>"
BETTER_AUTH_URL="http://localhost:3000"
CORS_ORIGIN="http://localhost:3001"
NODE_ENV="development"
```

Wygeneruj bezpieczny sekret:

```bash
openssl rand -base64 32
```

**`apps/web/.env`** (lub `.env.local`)

```env
VITE_SERVER_URL="http://localhost:3000"
```

### 4. Zastosuj schemat bazy danych

```bash
pnpm run db:push
```

To polecenie włącza rozszerzenie `pg_trgm`, a następnie tworzy wszystkie tabele i indeksy (user, session, account, verification, books).

### 5. Opcjonalnie: demo z 10 milionami wierszy

```bash
pnpm run db:seed:demo10m
```

Skrypt tworzy użytkownika `demo-10m` i wstawia dokładnie 10 000 000 rzeczywistych wierszy Postgres w tabeli `books` w deterministycznych partiach.
Przewidywany czas lokalnego wykonania silnie zależy od dysku i CPU, ale należy się przygotować na kilka minut.

### 6. Uruchom dev serwer

```bash
pnpm run dev
```

- **Frontend:** [http://localhost:3001](http://localhost:3001)
- **API:** [http://localhost:3000](http://localhost:3000)

---

## Opis działania podczas implementacji

Nie wydaje mi się, żebym przekroczył założony czas 8 godzin, aczkolwiek projekt był rozbity na kilka dni ze względu na egzaminy na studiach, które miałem po drodze.

Jeżeli chodzi o wykorzystanie narzędzi AI, to projekt rozpocząłem używając [Better-T-Stack](https://www.better-t-stack.dev/), poprawiłem wszystkie pierwotne błędy lintera + skonfigurowałem pre-commit hooki, aby napewno przez przypadek nie zapomnieć odpalić formattera/lintera przed commitem. Następnie używając skilla [impeccable](https://impeccable.style/) przygotowałem wstępny design strony przy pomocy modelu Kimi 2.6. Po osiągnięciu zadowalającego efektu przeszedłem do implementacji logiki aplikacji, zacząłem od wstępnego planu używając GPT 5.5 high, który następnie przeczytałem i dodałem adnotacje przy pomocy [Plannotator](https://plannotator.ai/), po ostatecznym zaakceptowaniu planu przeszedłem do implementacji używając GPT 5.5 low. Każdy etap był weryfikowany przez testy + linter. Po implementacji kilka ręcznych poprawek, ostatni validity check używając GPT 5.5 high. Finalny projekt ma trochę więcej featerów niż założenie z zadania, takich jak autoryzacja i własne półki dla każdego zalogowanego użytkownika + możliwość oglądania półek innych poprzez udostępnienie linku.

W temacie dema z 10M wierszy, użyłem Tanstack Virtual, paginacji, indexow GIN i pg_trgm, pierwszy raz miałem styczność z tak dużą ilością wierszy, więc to rozwiązanie może zajmować więcej miejsca w bazie danych niż powinno (overengineered)
