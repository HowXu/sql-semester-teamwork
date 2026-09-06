import { Hono } from "hono";
import { sqlite, db, courseOfferings, enrollments, auditLogs } from "@repo/db";
import { eq, and } from "drizzle-orm";
import { EnrollInputSchema } from "@repo/schema";
import { resolveStudentId } from "./resolveStudent.js";

export const enrollmentsRouter = new Hono();

// 1. 原子选课（抢课）接口 - 防并发超卖与时间冲突校验
enrollmentsRouter.post("/enroll", async (c) => {
  const rawUser = c.req.header("x-user-id");
  const body = await c.req.json();
  const currentUserId = await resolveStudentId(body.studentId || rawUser);
  const parsed = EnrollInputSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "参数校验失败", details: parsed.error.format() }, 400);
  }

  const { offeringId } = parsed.data;

  // 1.1 检查是否已选过该课程
  const existing = await db.query.enrollments.findFirst({
    where: and(
      eq(enrollments.studentId, currentUserId),
      eq(enrollments.offeringId, offeringId),
      eq(enrollments.status, "ACTIVE")
    )
  });
  if (existing) {
    return c.json({ error: "您已选修了该教学班，无需重复选课" }, 400);
  }

  // 1.2 获取目标班次的时间段并执行排课冲突检查
  const targetOffering = await db.query.courseOfferings.findFirst({
    where: eq(courseOfferings.id, offeringId),
    with: {
      course: true,
      timeSlots: true
    }
  });
  if (!targetOffering) {
    return c.json({ error: "该教学班不存在" }, 404);
  }

  const myActiveEnrollments = await db.query.enrollments.findMany({
    where: and(
      eq(enrollments.studentId, currentUserId),
      eq(enrollments.status, "ACTIVE")
    ),
    with: {
      offering: {
        with: {
          timeSlots: true,
          course: true
        }
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
              return c.json({
                error: `选课失败：与已选课程【${enr.offering.course.name}】（周${oSlot.dayOfWeek}第${oSlot.startPeriod}-${oSlot.endPeriod}节）存在时间冲突！`
              }, 409);
            }
          }
        }
      }
    }
  }

  // 1.3 核心原子操作：条件更新容量（防超卖核心机制）
  // 仅在当前人数 < 最大容量时执行 +1，返回受影响行数
  const updateResult = await sqlite.execute({
    sql: `UPDATE course_offerings 
          SET current_capacity = current_capacity + 1 
          WHERE id = ? AND current_capacity < max_capacity`,
    args: [offeringId]
  });

  if (updateResult.rowsAffected === 0) {
    return c.json({ error: "手慢了！该教学班选课名额已满，请选择其他班次。" }, 409);
  }

  // 1.4 写入选课记录与审计日志
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
  } catch (err) {
    // 异常情况下回滚容量计数
    await sqlite.execute({
      sql: `UPDATE course_offerings SET current_capacity = current_capacity - 1 WHERE id = ?`,
      args: [offeringId]
    });
    return c.json({ error: "选课写入失败，已回退容量", details: String(err) }, 500);
  }

  return c.json({
    message: "恭喜，选课成功！",
    enrollmentId,
    courseName: targetOffering.course.name,
    credits: targetOffering.course.credits
  }, 201);
});

// 2. 退课接口 - 恢复剩余名额
enrollmentsRouter.post("/drop", async (c) => {
  const rawUser = c.req.header("x-user-id");
  const body = await c.req.json();
  const currentUserId = await resolveStudentId(body.studentId || rawUser);

  const enrollmentId = body.enrollmentId;
  const offeringId = body.offeringId;

  if (!enrollmentId && !offeringId) {
    return c.json({ error: "选课记录 ID 或教学班 ID 不能为空" }, 400);
  }

  const enr = await db.query.enrollments.findFirst({
    where: and(
      enrollmentId ? eq(enrollments.id, enrollmentId) : eq(enrollments.offeringId, offeringId),
      eq(enrollments.studentId, currentUserId),
      eq(enrollments.status, "ACTIVE")
    ),
    with: {
      offering: {
        with: {
          course: true
        }
      }
    }
  });

  if (!enr) {
    return c.json({ error: "未找到有效的选课记录" }, 404);
  }

  // 更新选课状态为 DROPPED
  await db.update(enrollments)
    .set({ status: "DROPPED" })
    .where(eq(enrollments.id, enr.id));

  // 释放教学班名额
  await sqlite.execute({
    sql: `UPDATE course_offerings SET current_capacity = MAX(0, current_capacity - 1) WHERE id = ?`,
    args: [enr.offeringId]
  });

  // 写入审计日志
  await db.insert(auditLogs).values({
    action: "DROP",
    userId: currentUserId,
    details: `学生 ${currentUserId} 退选教学班 ${enr.offeringId} (${enr.offering.course.name})`,
    timestamp: Date.now()
  });

  return c.json({ message: "退课成功，名额已释放" });
});

// 3. 获取当前学生交互式课表网格数据
enrollmentsRouter.get("/my-schedule", async (c) => {
  const queryStudent = c.req.query("studentId");
  const headerUser = c.req.header("x-user-id");
  const rawUser = queryStudent || headerUser;
  const currentUserId = await resolveStudentId(rawUser);

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

  return c.json(scheduleItems);
});
