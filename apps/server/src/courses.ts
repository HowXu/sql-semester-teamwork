import { Hono } from "hono";
import { db, courses } from "@repo/db";
import { eq, and, sql } from "drizzle-orm";
import { CourseSchema } from "@repo/schema";
import { log } from "./logger.js";

export const coursesRouter = new Hono();

coursesRouter.get("/", async (c) => {
  const search = c.req.query("search") || "";
  const department = c.req.query("department") || "";
  log.info("[GET /api/courses] 列表查询", { search, department });

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

coursesRouter.post("/", async (c) => {
  log.info("[POST /api/courses] 请求开始", {
    contentType: c.req.header("content-type") ?? "unknown",
  });

  let body: unknown;
  try {
    body = await c.req.json();
  } catch (err) {
    log.fail("[POST /api/courses] 请求体解析失败", {
      reason: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }

  const parsed = CourseSchema.safeParse(body);
  if (!parsed.success) {
    log.fail("[POST /api/courses] 参数校验失败", { details: parsed.error.format() });
    return c.json({ error: "课程数据格式校验失败", details: parsed.error.format() }, 400);
  }

  log.info("[POST /api/courses] 创建课程", { code: parsed.data.code });
  await db.insert(courses).values(parsed.data);
  log.pass("[POST /api/courses] 课程创建成功", { code: parsed.data.code });
  return c.json({ message: "课程创建成功", course: parsed.data }, 201);
});
