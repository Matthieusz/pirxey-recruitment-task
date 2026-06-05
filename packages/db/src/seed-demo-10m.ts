import dotenv from "dotenv";
import { Client } from "pg";
import type { Client as PgClient } from "pg";

const TARGET_ROWS = 10_000_000n;
const DEFAULT_BATCH_SIZE = 100_000;
const DEMO_USER_ID = "demo-10m-user";
const DEMO_USER_EMAIL = "demo-10m@example.com";
const DEMO_USER_NAME = "demo-10m";

const envPath = new URL("../../../apps/server/.env", import.meta.url);
dotenv.config({ path: envPath });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is required. Set it or create apps/server/.env."
  );
}

const parseBatchSize = () => {
  const raw = process.env.SEED_DEMO10M_BATCH_SIZE;
  if (!raw) {
    return DEFAULT_BATCH_SIZE;
  }

  const parsed = Number(raw);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new Error("SEED_DEMO10M_BATCH_SIZE must be a positive integer.");
  }

  return parsed;
};

const formatDuration = (startedAt: number) => {
  const seconds = Math.round((Date.now() - startedAt) / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
};

const countDemoRows = async (client: PgClient) => {
  const result = await client.query<{ count: string }>(
    'select count(*)::text as count from "books" where "user_id" = $1',
    [DEMO_USER_ID]
  );

  return BigInt(result.rows[0]?.count ?? "0");
};

const ensureDemoUser = async (client: PgClient) => {
  await client.query(
    `insert into "user" ("id", "email", "name", "email_verified", "created_at", "updated_at")
     values ($1, $2, $3, true, now(), now())
     on conflict ("id") do update
       set "email" = excluded."email",
           "name" = excluded."name",
           "email_verified" = true,
           "updated_at" = now()`,
    [DEMO_USER_ID, DEMO_USER_EMAIL, DEMO_USER_NAME]
  );
};

const insertBatch = async (
  client: PgClient,
  startInclusive: bigint,
  endInclusive: bigint
) => {
  await client.query(
    `with generated as (
       select generate_series($1::bigint, $2::bigint) as n
     )
     insert into "books" (
       "user_id",
       "title",
       "author",
       "isbn",
       "pages",
       "rating",
       "finished_at",
       "created_at",
       "updated_at"
     )
     select
       $3,
       concat(
         (array[
           'The', 'A', 'An', 'Last', 'First', 'Hidden', 'Open', 'Bright',
           'Dark', 'Quiet', 'Wild', 'Patient', 'Restless', 'Ancient', 'Future',
           'Broken', 'Golden', 'Silver', 'Burning', 'Frozen'
         ]::text[])[(n % 20)::int + 1],
         ' ',
         (array[
           'Silent', 'Long', 'Glass', 'Paper', 'Electric', 'Crimson', 'Blue',
           'Lost', 'Found', 'Northern', 'Southern', 'Western', 'Eastern',
           'Secret', 'Public', 'Small', 'Great', 'Deep', 'Shallow', 'Infinite'
         ]::text[])[((n / 20) % 20)::int + 1],
         ' ',
         (array[
           'River', 'Library', 'Garden', 'City', 'Mountain', 'Ocean', 'Forest',
           'Archive', 'Signal', 'Orbit', 'Atlas', 'Bridge', 'Harbor', 'Valley',
           'Machine', 'Memory', 'Voyage', 'Season', 'Map', 'Song'
         ]::text[])[((n / 400) % 20)::int + 1],
         ' Volume ', n
       ),
       concat(
         (array[
           'Ada', 'James', 'Mary', 'Octavia', 'Ursula', 'Toni', 'Jorge',
           'Virginia', 'Kazuo', 'Nnedi', 'Haruki', 'Zadie', 'Elena', 'Chimamanda',
           'Gabriel', 'Margaret', 'Italo', 'Jhumpa', 'George', 'Isabel'
         ]::text[])[((n / 8000) % 20)::int + 1],
         ' ',
         (array[
           'Avery', 'Baldwin', 'Carter', 'Diaz', 'Elliot', 'Forster', 'Garcia',
           'Hughes', 'Ishiguro', 'Jemisin', 'King', 'Le Guin', 'Morrison',
           'Nguyen', 'Ondaatje', 'Powers', 'Rooney', 'Smith', 'Tan', 'Walker'
         ]::text[])[((n / 160000) % 20)::int + 1]
       ),
       (9780000000000::bigint + (n % 1000000000))::text,
       80 + (n % 920)::int,
       1 + (n % 5)::int,
       date '2026-06-01' - (n % 3650)::int,
       now(),
       now()
     from generated`,
    [startInclusive.toString(), endInclusive.toString(), DEMO_USER_ID]
  );
};

const main = async () => {
  const startedAt = Date.now();
  const batchSize = BigInt(parseBatchSize());
  const shouldReset = process.env.SEED_DEMO10M_RESET === "1";
  const client = new Client({ connectionString: databaseUrl });

  await client.connect();

  try {
    await client.query("set statement_timeout = 0");
    await client.query("set synchronous_commit = off");
    await ensureDemoUser(client);

    if (shouldReset) {
      console.log("Reset requested; deleting existing demo-10m rows...");
      await client.query('delete from "books" where "user_id" = $1', [
        DEMO_USER_ID,
      ]);
    }

    let existingRows = await countDemoRows(client);

    if (existingRows === TARGET_ROWS) {
      console.log(
        `Demo user already has exactly ${TARGET_ROWS.toLocaleString()} rows. Nothing to do.`
      );
      return;
    }

    if (existingRows > TARGET_ROWS) {
      throw new Error(
        `Demo user has ${existingRows.toLocaleString()} rows, which is more than the target ${TARGET_ROWS.toLocaleString()}. Run with SEED_DEMO10M_RESET=1 to rebuild.`
      );
    }

    console.log(
      `Seeding demo-10m from ${existingRows.toLocaleString()} to ${TARGET_ROWS.toLocaleString()} rows in batches of ${batchSize.toLocaleString()}...`
    );

    while (existingRows < TARGET_ROWS) {
      const start = existingRows + 1n;
      const end =
        start + batchSize - 1n > TARGET_ROWS
          ? TARGET_ROWS
          : start + batchSize - 1n;

      await insertBatch(client, start, end);
      existingRows = end;

      console.log(
        `Inserted through ${existingRows.toLocaleString()} / ${TARGET_ROWS.toLocaleString()} rows (${formatDuration(startedAt)} elapsed)`
      );
    }

    const finalCount = await countDemoRows(client);
    if (finalCount !== TARGET_ROWS) {
      throw new Error(
        `Seed finished with ${finalCount.toLocaleString()} rows instead of ${TARGET_ROWS.toLocaleString()}.`
      );
    }

    console.log(
      `Seed complete: ${finalCount.toLocaleString()} real Postgres rows for ${DEMO_USER_NAME} (${formatDuration(startedAt)}).`
    );
  } finally {
    await client.end();
  }
};

try {
  await main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
