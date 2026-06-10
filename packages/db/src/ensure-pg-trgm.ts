import dotenv from "dotenv";
import { Client } from "pg";

const envPath = new URL("../../../apps/server/.env", import.meta.url);
dotenv.config({ path: envPath });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is required before enabling pg_trgm. Set it or create apps/server/.env."
  );
}

const client = new Client({ connectionString: databaseUrl });

try {
  await client.connect();
  await client.query("create extension if not exists pg_trgm");
} finally {
  await client.end();
}
