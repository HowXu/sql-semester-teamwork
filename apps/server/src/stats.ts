import { Hono } from "hono";
import { db, courses, courseOfferings, teachers, students, enrollments } from "@repo/db";
import { eq, count, sql } from "drizzle-orm";
import { log } from "./logger.js";

export const statsRouter = new Hono();

statsRouter.get("/overview", async (c) => {
  log.info("[GET /api/stats/overview] 大盘聚合");
  const [courseCountRes] = await db.select({ val: count() }).from(courses);
  const [offeringCountRes] = await db.select({ val: count() }).from(courseOfferings);
  const [teacherCountRes] = await db.select({ val: count() }).from(teachers);
  const [studentCountRes] = await db.select({ val: count() }).from(students);
  const [enrollmentCountRes] = await db.select({ val: count() }).from(enrollments).where(eq(enrollments.status, "ACTIVE"));

  const [capacitySumRes] = await db.select({
    currentSum: sql<number>`SUM(current_capacity)`,
    maxSum: sql<number>`SUM(max_capacity)`
  }).from(courseOfferings);

  const totalCurrent = capacitySumRes?.currentSum || 0;
  const totalMax = capacitySumRes?.maxSum || 1;
  const overallEnrollmentRate = Number(((totalCurrent / totalMax) * 100).toFixed(1));
  const overallFillRate = totalMax > 0 ? totalCurrent / totalMax : 0;

  // 聚合各学院数据
  const allCourses = await db.select().from(courses);
  const allOfferings = await db.select().from(courseOfferings);

  const deptMap = new Map<string, { courseCount: number; offeringCount: number; enrollmentCount: number }>();

  for (const crs of allCourses) {
    const dept = crs.department || "未知学院";
    if (!deptMap.has(dept)) {
      deptMap.set(dept, { courseCount: 0, offeringCount: 0, enrollmentCount: 0 });
    }
    const d = deptMap.get(dept)!;
    d.courseCount += 1;
  }

  for (const off of allOfferings) {
    const crs = allCourses.find((item) => item.id === off.courseId);
    const dept = crs?.department || "综合学院";
    if (!deptMap.has(dept)) {
      deptMap.set(dept, { courseCount: 0, offeringCount: 0, enrollmentCount: 0 });
    }
    const d = deptMap.get(dept)!;
    d.offeringCount += 1;
    d.enrollmentCount += (off.currentCapacity || 0);
  }

  const departmentStats = Array.from(deptMap.entries()).map(([department, data]) => ({
    department,
    courseCount: data.courseCount,
    offeringCount: data.offeringCount,
    enrollmentCount: data.enrollmentCount,
  }));

  const result = {
    totalCourses: courseCountRes?.val || allCourses.length,
    totalOfferings: offeringCountRes?.val || allOfferings.length,
    totalTeachers: teacherCountRes?.val || 0,
    totalStudents: studentCountRes?.val || 0,
    totalActiveEnrollments: enrollmentCountRes?.val || 0,
    totalEnrollments: totalCurrent,
    totalCapacity: totalMax,
    overallFillRate,
    overallEnrollmentRate,
    departmentStats,
  };

  log.info("[GET /api/stats/overview] 返回", {
    totalCourses: result.totalCourses,
    totalOfferings: result.totalOfferings,
    totalActiveEnrollments: result.totalActiveEnrollments,
    overallEnrollmentRate: result.overallEnrollmentRate,
    departments: result.departmentStats.length,
  });

  return c.json(result);
});
