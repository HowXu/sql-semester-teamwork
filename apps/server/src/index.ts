import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { authRouter } from "./auth.js";
import { coursesRouter } from "./courses.js";
import { offeringsRouter } from "./offerings.js";
import { enrollmentsRouter } from "./enrollments.js";
import { gradesRouter } from "./grades.js";
import { statsRouter } from "./stats.js";

const app = new Hono();

// 开启跨域支持，适配 Vite 前端与 Tauri 客户端
app.use(
  "*",
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173", "tauri://localhost", "http://tauri.localhost"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "x-user-id"]
  })
);

// 根路由健康检查
app.get("/", (c) => {
  return c.json({
    status: "ok",
    system: "Academic Affairs Course Selection API",
    version: "1.0.0"
  });
});

// 挂载核心业务路由
app.route("/api/auth", authRouter);
app.route("/api/courses", coursesRouter);
app.route("/api/offerings", offeringsRouter);
app.route("/api/enrollments", enrollmentsRouter);
app.route("/api/grades", gradesRouter);
app.route("/api/stats", statsRouter);

const port = 3000;
console.log(`[INFO] Hono 服务正在启动，监听端口: http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port
});
