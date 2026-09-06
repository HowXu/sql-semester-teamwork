import { Hono } from "hono";
import { db, courses } from "@repo/db";
import { eq, and, sql } from "drizzle-orm";
import { CourseSchema } from "@repo/schema";

export const coursesRouter = new Hono();

coursesRouter.get("/", async (c) => {
  const search = c.req.query("search") || "";
  const department = c.req.query("department") || "";

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

  return c.json(list);
});

coursesRouter.post("/", async (c) => {
  const body = await c.req.json();
  const parsed = CourseSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "课程数据格式校验失败", details: parsed.error.format() }, 400);
  }

  await db.insert(courses).values(parsed.data);
  return c.json({ message: "课程创建成功", course: parsed.data }, 201);
});
