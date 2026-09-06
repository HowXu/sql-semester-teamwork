import { Hono } from "hono";
import { db, users, students, teachers } from "@repo/db";
import { eq } from "drizzle-orm";
import { LoginInputSchema } from "@repo/schema";
import { resolveStudentId } from "./resolveStudent.js";

export const authRouter = new Hono();

authRouter.post("/login", async (c) => {
  const body = await c.req.json();
  const parsed = LoginInputSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "参数格式不正确", details: parsed.error.format() }, 400);
  }

  const { username, password } = parsed.data;
  const user = await db.query.users.findFirst({
    where: eq(users.username, username)
  });

  if (!user || user.passwordHash !== password) {
    return c.json({ error: "用户名或密码错误" }, 401);
  }

  let displayName = user.username;
  let department = "教务处";
  let studentId: string | null = null;
  let teacherId: string | null = null;

  if (user.role === "STUDENT") {
    const s = await db.query.students.findFirst({ where: eq(students.id, user.id) });
    if (s) {
      displayName = s.realName;
      department = s.department;
      studentId = s.id;
    }
  } else if (user.role === "TEACHER") {
    const t = await db.query.teachers.findFirst({ where: eq(teachers.id, user.id) });
    if (t) {
      displayName = t.realName;
      department = t.department;
      teacherId = t.id;
    }
  }

  return c.json({
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      createdAt: user.createdAt
    },
    studentId,
    teacherId,
    displayName,
    department
  });
});

authRouter.get("/me", async (c) => {
  // 支持通过 Header 获取用户，默认回落为测试学生 student01
  const rawId = c.req.header("x-user-id") || "usr_stu_1";
  const userId = await resolveStudentId(rawId);

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId)
  });

  if (!user) {
    return c.json({ error: "用户不存在" }, 404);
  }

  let displayName = user.username;
  let department = "教务处";
  let studentId: string | null = null;
  let teacherId: string | null = null;

  if (user.role === "STUDENT") {
    const s = await db.query.students.findFirst({ where: eq(students.id, user.id) });
    if (s) {
      displayName = s.realName;
      department = s.department;
      studentId = s.id;
    }
  } else if (user.role === "TEACHER") {
    const t = await db.query.teachers.findFirst({ where: eq(teachers.id, user.id) });
    if (t) {
      displayName = t.realName;
      department = t.department;
      teacherId = t.id;
    }
  }

  return c.json({
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      createdAt: user.createdAt
    },
    studentId,
    teacherId,
    displayName,
    department
  });
});
