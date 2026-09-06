import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema.js";
import path from "node:path";
import fs from "node:fs";

// 确保 SQLite 数据库文件存放路径存在
const dbDir = path.resolve(process.cwd(), process.cwd().endsWith("packages/db") || process.cwd().endsWith("packages\\db") ? "." : "packages/db");
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
