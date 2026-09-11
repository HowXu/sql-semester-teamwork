import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import type { AppDatabase } from "@repo/db";
import { resolveStudentId } from "./resolveStudent.js";
import { log } from "./logger.js";

export interface OfferingsDeps {
  db: AppDatabase;
}

export function createOfferingsRouter(deps: OfferingsDeps): Hono {
  const router = new Hono();
  const { db } = deps;

  router.get("/", async (c) => {
    const rawUser = c.req.header("x-user-id");
    const currentUserId = await resolveStudentId(rawUser, { db });
    log.info("[GET /api/offerings] 班次列表", { userId: currentUserId });

    const { courseOfferings } = await import("@repo/db/schema");

    const allOfferings = await db.query.courseOfferings.findMany({
      with: {
        course: true,
        teacher: true,
        timeSlots: true
      },
      orderBy: [courseOfferings.id]
    });

    const myActiveEnrollments = await db.query.enrollments.findMany({
      where: and(
        eq(
          (await import("@repo/db/schema")).enrollments.studentId,
          currentUserId
        ),
        eq(
          (await import("@repo/db/schema")).enrollments.status,
          "ACTIVE"
        )
      ),
      with: {
        offering: {
          with: { timeSlots: true, course: true }
        }
      }
    });

    const enrolledOfferingIds = new Set(myActiveEnrollments.map((e) => e.offeringId));

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

    const result = allOfferings.map((offering) => {
      const isEnrolled = enrolledOfferingIds.has(offering.id);
      let isConflict = false;
      let conflictReason = "";

      if (!isEnrolled) {
        for (const slot of offering.timeSlots) {
          for (const occ of occupiedSlots) {
            if (slot.dayOfWeek === occ.dayOfWeek) {
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

    log.info("[GET /api/offerings] 返回", {
      userId: currentUserId,
      total: result.length,
    });
    return c.json(result);
  });

  return router;
}