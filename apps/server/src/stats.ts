import { Hono } from "hono";
import { db, courses, courseOfferings, teachers, students, enrollments } from "@repo/db";
import { eq, count, sql } from "drizzle-orm";

export const statsRouter = new Hono();

statsRouter.get("/overview", async (c) => {
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

  return c.json({
    totalCourses: courseCountRes?.val || 0,
    totalOfferings: offeringCountRes?.val || 0,
    totalTeachers: teacherCountRes?.val || 0,
    totalStudents: studentCountRes?.val || 0,
    totalActiveEnrollments: enrollmentCountRes?.val || 0,
    overallEnrollmentRate
  });
});
