import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "@repo/db/schema";
import type { AppDatabase } from "@repo/db";
import { ALL_CREATE_TABLE_STATEMENTS } from "./schema.js";

export interface TestDb {
  sqlite: Client;
  db: AppDatabase;
}

export async function createTestDb(): Promise<TestDb> {
  const sqlite = createClient({ url: ":memory:" });
  for (const stmt of ALL_CREATE_TABLE_STATEMENTS) {
    await sqlite.execute(stmt);
  }
  const db = drizzle(sqlite, { schema }) as unknown as AppDatabase;
  return { sqlite, db };
}
