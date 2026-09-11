import { Hono } from "hono";
import type { Client } from "@libsql/client";
import type { AppDatabase } from "@repo/db";
import { eq, and } from "drizzle-orm";
import { EnrollInputSchema } from "@repo/schema";
import { resolveStudentId } from "./resolveStudent.js";
import { log } from "./logger.js";

export interface EnrollmentsDeps {
  db: AppDatabase;
  sqlite: Client;
}

export function createEnrollmentsRouter(deps: EnrollmentsDeps): Hono {
  const router = new Hono();
  const { db, sqlite } = deps;

  router.post("/enroll", async (c) => {
    const rawUser = c.req.header("x-user-id");
    let body: unknown;
    try {
      body = await c.req.json();
    } catch (err) {
      log.fail("[POST /api/enrollments/enroll] 请求体解析失败", {
        userId: rawUser ?? "anonymous",
        reason: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }

    const currentUserId = await resolveStudentId(
      typeof body === "object" && body !== null && "studentId" in body
        ? (body as { studentId?: string }).studentId
        : rawUser,
      { db }
    );

    log.info("[POST /api/enrollments/enroll] 抢课开始", {
      userId: currentUserId,
      offeringId: typeof body === "object" && body !== null && "offeringId" in body
        ? (body as { offeringId?: string }).offeringId
        : undefined,
    });

    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      log.fail("[POST /api/enrollments/enroll] 请求体不是对象", { userId: currentUserId });
      return c.json({ error: "请求体必须是 JSON 对象" }, 400);
    }

    const parsed = EnrollInputSchema.safeParse(body);
    if (!parsed.success) {
      log.fail("[POST /api/enrollments/enroll] 参数校验失败", {
        userId: currentUserId,
        details: parsed.error.format(),
      });
      return c.json({ error: "参数校验失败", details: parsed.error.format() }, 400);
    }

    const { offeringId } = parsed.data;

    const { enrollments, courseOfferings, auditLogs } = await import("@repo/db/schema");

    const existing = await db.query.enrollments.findFirst({
      where: and(
        eq(enrollments.studentId, currentUserId),
        eq(enrollments.offeringId, offeringId),
        eq(enrollments.status, "ACTIVE")
      )
    });
    if (existing) {
      log.fail("[POST /api/enrollments/enroll] 重复选课", {
        userId: currentUserId,
        offeringId,
      });
      return c.json({ error: "您已选修了该教学班，无需重复选课" }, 400);
    }

    const targetOffering = await db.query.courseOfferings.findFirst({
      where: eq(courseOfferings.id, offeringId),
      with: { course: true, timeSlots: true }
    });
    if (!targetOffering) {
      log.fail("[POST /api/enrollments/enroll] 教学班不存在", {
        userId: currentUserId,
        offeringId,
      });
      return c.json({ error: "该教学班不存在" }, 404);
    }

    const myActiveEnrollments = await db.query.enrollments.findMany({
      where: and(
        eq(enrollments.studentId, currentUserId),
        eq(enrollments.status, "ACTIVE")
      ),
      with: {
        offering: {
          with: { timeSlots: true, course: true }
        }
      }
    });

    for (const tSlot of targetOffering.timeSlots) {
      for (const enr of myActiveEnrollments) {
        if (enr.offering && enr.offering.timeSlots) {
          for (const oSlot of enr.offering.timeSlots) {
            if (tSlot.dayOfWeek === oSlot.dayOfWeek) {
              const hasOverlap = !(tSlot.endPeriod < oSlot.startPeriod || tSlot.startPeriod > oSlot.endPeriod);
              if (hasOverlap) {
                log.fail("[POST /api/enrollments/enroll] 时间冲突", {
                  userId: currentUserId,
                  offeringId,
                  conflictWith: enr.offering.course.name,
                });
                return c.json({
                  error: `选课失败：与已选课程【${enr.offering.course.name}】（周${oSlot.dayOfWeek}第${oSlot.startPeriod}-${oSlot.endPeriod}节）存在时间冲突！`
                }, 409);
              }
            }
          }
        }
      }
    }

    const updateResult = await sqlite.execute({
      sql: `UPDATE course_offerings
            SET current_capacity = current_capacity + 1
            WHERE id = ? AND current_capacity < max_capacity`,
      args: [offeringId]
    });

    if (updateResult.rowsAffected === 0) {
      log.fail("[POST /api/enrollments/enroll] 超卖", {
        userId: currentUserId,
        offeringId,
      });
      return c.json({ error: "手慢了！该教学班选课名额已满，请选择其他班次。" }, 409);
    }

    const enrollmentId = `enr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = Date.now();

    try {
      await db.insert(enrollments).values({
        id: enrollmentId,
        studentId: currentUserId,
        offeringId,
        status: "ACTIVE",
        enrolledAt: now
      });

      await db.insert(auditLogs).values({
        action: "ENROLL",
        userId: currentUserId,
        details: `学生 ${currentUserId} 成功选修教学班 ${offeringId} (${targetOffering.course.name})`,
        timestamp: now
      });

      log.pass("[POST /api/enrollments/enroll] 抢课成功", {
        userId: currentUserId,
        offeringId,
        enrollmentId,
        courseName: targetOffering.course.name,
        credits: targetOffering.course.credits,
      });

      return c.json({
        message: "恭喜，选课成功！",
        enrollmentId,
        courseName: targetOffering.course.name,
        credits: targetOffering.course.credits
      }, 201);
    } catch (err) {
      await sqlite.execute({
        sql: `UPDATE course_offerings SET current_capacity = current_capacity - 1 WHERE id = ?`,
        args: [offeringId]
      });
      log.fail("[POST /api/enrollments/enroll] 写入失败已回滚", {
        userId: currentUserId,
        offeringId,
        reason: err instanceof Error ? err.message : String(err),
      });
      return c.json({ error: "选课写入失败，已回退容量", details: String(err) }, 500);
    }
  });

  router.post("/drop", async (c) => {
    const rawUser = c.req.header("x-user-id");
    let body: unknown;
    try {
      body = await c.req.json();
    } catch (err) {
      log.fail("[POST /api/enrollments/drop] 请求体解析失败", {
        userId: rawUser ?? "anonymous",
        reason: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }

    const currentUserId = await resolveStudentId(
      typeof body === "object" && body !== null && "studentId" in body
        ? (body as { studentId?: string }).studentId
        : rawUser,
      { db }
    );

    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      log.fail("[POST /api/enrollments/drop] 请求体不是对象", { userId: currentUserId });
      return c.json({ error: "请求体必须是 JSON 对象" }, 400);
    }

    const enrollmentId =
      "enrollmentId" in body && typeof (body as { enrollmentId?: unknown }).enrollmentId === "string"
        ? (body as { enrollmentId: string }).enrollmentId
        : undefined;
    const offeringId =
      "offeringId" in body && typeof (body as { offeringId?: unknown }).offeringId === "string"
        ? (body as { offeringId: string }).offeringId
        : undefined;

    log.info("[POST /api/enrollments/drop] 退课开始", {
      userId: currentUserId,
      enrollmentId,
      offeringId,
    });

    if (!enrollmentId && !offeringId) {
      log.fail("[POST /api/enrollments/drop] 缺少 enrollmentId/offeringId", {
        userId: currentUserId,
      });
      return c.json({ error: "选课记录 ID 或教学班 ID 不能为空" }, 400);
    }

    const { enrollments } = await import("@repo/db/schema");

    const enr = await db.query.enrollments.findFirst({
      where: and(
        enrollmentId ? eq(enrollments.id, enrollmentId) : eq(enrollments.offeringId, offeringId!),
        eq(enrollments.studentId, currentUserId),
        eq(enrollments.status, "ACTIVE")
      ),
      with: {
        offering: { with: { course: true } }
      }
    });

    if (!enr) {
      log.fail("[POST /api/enrollments/drop] 未找到选课记录", {
        userId: currentUserId,
        enrollmentId,
        offeringId,
      });
      return c.json({ error: "未找到有效的选课记录" }, 404);
    }

    await db.update(enrollments)
      .set({ status: "DROPPED" })
      .where(eq(enrollments.id, enr.id));

    await sqlite.execute({
      sql: `UPDATE course_offerings SET current_capacity = MAX(0, current_capacity - 1) WHERE id = ?`,
      args: [enr.offeringId]
    });

    const { auditLogs } = await import("@repo/db/schema");

    await db.insert(auditLogs).values({
      action: "DROP",
      userId: currentUserId,
      details: `学生 ${currentUserId} 退选教学班 ${enr.offeringId} (${enr.offering.course.name})`,
      timestamp: Date.now()
    });

    log.pass("[POST /api/enrollments/drop] 退课成功", {
      userId: currentUserId,
      enrollmentId: enr.id,
      offeringId: enr.offeringId,
      courseName: enr.offering.course.name,
    });

    return c.json({ message: "退课成功，名额已释放" });
  });

  router.get("/my-schedule", async (c) => {
    const queryStudent = c.req.query("studentId");
    const headerUser = c.req.header("x-user-id");
    const rawUser = queryStudent || headerUser;
    const currentUserId = await resolveStudentId(rawUser, { db });
    log.info("[GET /api/enrollments/my-schedule] 查询", { userId: currentUserId });

    const { enrollments } = await import("@repo/db/schema");

    const myEnrollments = await db.query.enrollments.findMany({
      where: and(
        eq(enrollments.studentId, currentUserId),
        eq(enrollments.status, "ACTIVE")
      ),
      with: {
        offering: {
          with: {
            course: true,
            teacher: true,
            timeSlots: true
          }
        }
      }
    });

    const scheduleItems = [];
    let colorCounter = 0;

    for (const enr of myEnrollments) {
      const off = enr.offering;
      const colorIndex = colorCounter % 6;
      colorCounter++;

      for (const slot of off.timeSlots) {
        scheduleItems.push({
          enrollmentId: enr.id,
          offeringId: off.id,
          courseId: off.course.id,
          courseCode: off.course.code,
          courseName: off.course.name,
          credits: off.course.credits,
          teacherName: off.teacher.realName,
          classroom: off.classroom,
          timeSlotId: slot.id,
          dayOfWeek: slot.dayOfWeek,
          startPeriod: slot.startPeriod,
          endPeriod: slot.endPeriod,
          weekType: slot.weekType,
          colorIndex
        });
      }
    }

    log.info("[GET /api/enrollments/my-schedule] 返回", {
      userId: currentUserId,
      items: scheduleItems.length,
    });
    return c.json(scheduleItems);
  });

  return router;
}