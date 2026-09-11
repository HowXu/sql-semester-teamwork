import { Hono } from "hono";
import { eq, and, sql } from "drizzle-orm";
import { CourseSchema } from "@repo/schema";
import type { AppDatabase } from "@repo/db";
import { log } from "./logger.js";

export interface CoursesDeps {
  db: AppDatabase;
}

export function createCoursesRouter(deps: CoursesDeps): Hono {
  const router = new Hono();
  const { db } = deps;

  router.get("/", async (c) => {
    const search = c.req.query("search") || "";
    const department = c.req.query("department") || "";

    const { courses } = await import("@repo/db/schema");
    const conditions = [];
    if (search) {
      conditions.push(sql`(${courses.name} LIKE ${"%" + search + "%"} OR ${courses.code} LIKE ${"%" + search + "%"})`);
    }
    if (department && department !== "ALL") {
      conditions.push(eq(courses.department, department));
    }

    const list = await db.query.courses.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [courses.code]
    });

    log.info("[GET /api/courses] 返回", { count: list.length });
    return c.json(list);
  });

  router.post("/", async (c) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch (err) {
      log.fail("[POST /api/courses] 请求体解析失败", {
        reason: err instanceof Error ? err.message : String(err),
      });
      return c.json({ error: "请求体格式错误" }, 400);
    }
    const parsed = CourseSchema.safeParse(body);
    if (!parsed.success) {
      log.fail("[POST /api/courses] 参数校验失败", { details: parsed.error.format() });
      return c.json({ error: "课程数据格式校验失败", details: parsed.error.format() }, 400);
    }

    const { courses } = await import("@repo/db/schema");
    log.info("[POST /api/courses] 创建课程", { code: parsed.data.code });
    await db.insert(courses).values(parsed.data);
    log.pass("[POST /api/courses] 课程创建成功", { code: parsed.data.code });
    return c.json({ message: "课程创建成功", course: parsed.data }, 201);
  });

  return router;
}