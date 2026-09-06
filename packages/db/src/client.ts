import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema.js";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

// 确保 SQLite 数据库文件绝对路径准确指向 packages/db/sqlite.db
const currentDir = path.dirname(fileURLToPath(import.meta.url));
const dbDir = path.resolve(currentDir, "..");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
const dbPath = path.resolve(dbDir, "sqlite.db");
const fileUrl = `file:${dbPath.replace(/\\/g, "/")}`;

export const sqlite = createClient({
  url: fileUrl
});

export const db = drizzle(sqlite, { schema });
export type AppDatabase = typeof db;
