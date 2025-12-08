import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required for database connection");
}

// Reuse a single pool across hot reloads in dev
const globalForDb = globalThis as unknown as { pool?: Pool };

const pool =
  globalForDb.pool ??
  new Pool({
    connectionString,
  });

if (!globalForDb.pool) {
  globalForDb.pool = pool;
}

export const db = drizzle(pool, { schema });

