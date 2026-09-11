import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { db, sqlite } from "@repo/db";
import { createAuthRouter } from "./auth.js";
import { createCoursesRouter } from "./courses.js";
import { createOfferingsRouter } from "./offerings.js";
import { createEnrollmentsRouter } from "./enrollments.js";
import { createGradesRouter } from "./grades.js";
import { createStatsRouter } from "./stats.js";
import { log } from "./logger.js";

const app = new Hono();

const CORS_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "tauri://localhost",
  "http://tauri.localhost",
];

const ROUTE_TABLE = [
  "/api/auth",
  "/api/courses",
  "/api/offerings",
  "/api/enrollments",
  "/api/grades",
  "/api/stats",
];

app.use(
  "*",
  cors({
    origin: CORS_ORIGINS,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "x-user-id"],
  })
);

app.use("*", async (c, next) => {
  const start = Date.now();
  const method = c.req.method;
  const path = c.req.path;
  const userId = c.req.header("x-user-id") ?? "anonymous";
  try {
    await next();
    const status = c.res.status;
    log.info(`[${method} ${path}]`, {
      userId,
      status,
      durationMs: Date.now() - start,
    });
  } catch (err) {
    log.fail(`[${method} ${path}]`, {
      userId,
      durationMs: Date.now() - start,
      reason: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
});

app.get("/", (c) => {
  return c.json({
    status: "ok",
    system: "Academic Affairs Course Selection API",
    version: "1.0.0",
  });
});

app.route("/api/auth", createAuthRouter({ db }));
app.route("/api/courses", createCoursesRouter({ db }));
app.route("/api/offerings", createOfferingsRouter({ db }));
app.route("/api/enrollments", createEnrollmentsRouter({ db, sqlite }));
app.route("/api/grades", createGradesRouter({ db }));
app.route("/api/stats", createStatsRouter({ db }));

try {
  await sqlite.execute(`
    UPDATE course_offerings
    SET current_capacity = COALESCE((
      SELECT COUNT(*) FROM enrollments e
      WHERE e.offering_id = course_offerings.id AND e.status = 'ACTIVE'
    ), 0);
  `);
  log.info("[DB] 教学班实时容量已完成自动校准与同步");
} catch (e) {
  log.fail("[DB] 教学班容量初始化校准跳过", { reason: String(e) });
}

const port = 3001;

log.guide("===== Academic Affairs Course Selection API =====");
log.guide("启动", { port, version: "1.0.0" });
log.guide("数据库", { path: "packages/db/sqlite.db (libsql 本地)" });
log.guide("CORS 白名单", { origins: CORS_ORIGINS.join(", ") });
log.guide("已挂载路由", { routes: ROUTE_TABLE.join(" ") });
log.guide("服务已就绪");

serve({
  fetch: app.fetch,
  port,
});