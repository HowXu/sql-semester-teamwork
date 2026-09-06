import { Hono } from "hono";
import { db, courseOfferings, enrollments } from "@repo/db";
import { eq, and } from "drizzle-orm";

export const offeringsRouter = new Hono();

offeringsRouter.get("/", async (c) => {
  const currentUserId = c.req.header("x-user-id") || "usr_stu_1";

  // 1. 获取所有开课班次及关联课程、教师和时间段
  const allOfferings = await db.query.courseOfferings.findMany({
    with: {
      course: true,
      teacher: true,
      timeSlots: true
    },
    orderBy: [courseOfferings.id]
  });

  // 2. 获取当前学生的有效选课
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

  const enrolledOfferingIds = new Set(myActiveEnrollments.map((e) => e.offeringId));

  // 收集当前学生已占用的时间段
  const occupiedSlots: Array<{ dayOfWeek: number; startPeriod: number; endPeriod: number; courseName: string }> = [];
  for (const enr of myActiveEnrollments) {
    if (enr.offering && enr.offering.timeSlots) {
      for (const slot of enr.offering.timeSlots) {
        occupiedSlots.push({
          dayOfWeek: slot.dayOfWeek,
          startPeriod: slot.startPeriod,
          endPeriod: slot.endPeriod,
          courseName: enr.offering.course.name
        });
      }
    }
  }

  // 3. 组装班次列表并检测冲突
  const result = allOfferings.map((offering) => {
    const isEnrolled = enrolledOfferingIds.has(offering.id);
    let isConflict = false;
    let conflictReason = "";

    if (!isEnrolled) {
      for (const slot of offering.timeSlots) {
        for (const occ of occupiedSlots) {
          if (slot.dayOfWeek === occ.dayOfWeek) {
            // 判定时间段是否有交集: NOT (end1 < start2 OR start1 > end2)
            const hasOverlap = !(slot.endPeriod < occ.startPeriod || slot.startPeriod > occ.endPeriod);
            if (hasOverlap) {
              isConflict = true;
              conflictReason = `与已选课程【${occ.courseName}】（周${occ.dayOfWeek}第${occ.startPeriod}-${occ.endPeriod}节）时间冲突`;
              break;
            }
          }
        }
        if (isConflict) break;
      }
    }

    return {
      id: offering.id,
      courseId: offering.courseId,
      teacherId: offering.teacherId,
      semester: offering.semester,
      maxCapacity: offering.maxCapacity,
      currentCapacity: offering.currentCapacity,
      classroom: offering.classroom,
      course: offering.course,
      teacherName: offering.teacher.realName,
      teacherTitle: offering.teacher.title,
      timeSlots: offering.timeSlots,
      isEnrolled,
      isConflict,
      conflictReason: conflictReason || undefined
    };
  });

  return c.json(result);
});
