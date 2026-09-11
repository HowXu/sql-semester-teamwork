import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { LoginInputSchema } from "@repo/schema";
import type { AppDatabase } from "@repo/db";
import { resolveStudentId } from "./resolveStudent.js";
import { log } from "./logger.js";

export interface AuthDeps {
  db: AppDatabase;
}

export function createAuthRouter(deps: AuthDeps): Hono {
  const router = new Hono();
  const { db } = deps;

  router.post("/login", async (c) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch (err) {
      log.fail("[POST /api/auth/login] 请求体解析失败", {
        reason: err instanceof Error ? err.message : String(err),
      });
      return c.json({ error: "请求体格式错误" }, 400);
    }
    const parsed = LoginInputSchema.safeParse(body);
    if (!parsed.success) {
      log.fail("[POST /api/auth/login] 参数校验失败", {
        details: parsed.error.format(),
      });
      return c.json({ error: "参数格式不正确", details: parsed.error.format() }, 400);
    }

    const { username, password } = parsed.data;
    log.info("[POST /api/auth/login] 登录尝试", { username });

    const { users, students, teachers } = await import("@repo/db/schema");

    const user = await db.query.users.findFirst({
      where: eq(users.username, username)
    });

    if (!user) {
      log.fail("[POST /api/auth/login] 用户不存在", { username });
      return c.json({ error: "用户名或密码错误" }, 401);
    }

    if (user.passwordHash !== password) {
      log.fail("[POST /api/auth/login] 密码错误", { username, userId: user.id });
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

    log.pass("[POST /api/auth/login] 登录成功", {
      userId: user.id,
      role: user.role,
      displayName,
    });

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

  router.get("/me", async (c) => {
    const rawId = c.req.header("x-user-id") || "usr_stu_1";
    const userId = await resolveStudentId(rawId, { db });
    log.info("[GET /api/auth/me]", { userId: rawId });

    const { users, students, teachers } = await import("@repo/db/schema");

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });

    if (!user) {
      log.fail("[GET /api/auth/me] 用户不存在", { userId: rawId });
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

    log.info("[GET /api/auth/me] 读取成功", { userId: user.id, role: user.role });

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

  return router;
}