import { Hono, type Context } from "hono";
import type { AppDatabase } from "@repo/db";
import { eq, and } from "drizzle-orm";
import { GradeInputSchema } from "@repo/schema";
import { resolveStudentId } from "./resolveStudent.js";
import { log } from "./logger.js";

export interface GradesDeps {
  db: AppDatabase;
}

export function createGradesRouter(deps: GradesDeps): Hono {
  const router = new Hono();
  const { db } = deps;

  const getMyGradesHandler = async (c: Context) => {
    const queryStudent = c.req.query("studentId");
    const headerUser = c.req.header("x-user-id");
    const rawUser = queryStudent || headerUser;
    const currentUserId = await resolveStudentId(rawUser, { db });

    const { enrollments } = await import("@repo/db/schema");

    const allMyEnrollments = await db.query.enrollments.findMany({
      where: and(
        eq(enrollments.studentId, currentUserId),
        eq(enrollments.status, "ACTIVE")
      ),
      with: {
        offering: { with: { course: true, teacher: true } },
        grade: true
      }
    });

    const gradeList = [];
    let totalCreditsEnrolled = 0;
    let totalCreditsEarned = 0;
    let totalWeightedScore = 0;
    let totalWeightedGpa = 0;
    let gradedCredits = 0;

    for (const enr of allMyEnrollments) {
      const courseCredits = enr.offering.course.credits;
      totalCreditsEnrolled += courseCredits;

      const score = enr.grade ? enr.grade.score : null;
      const gradePoint = enr.grade ? enr.grade.gradePoint : null;

      if (score !== null && gradePoint !== null) {
        if (score >= 60) {
          totalCreditsEarned += courseCredits;
        }
        totalWeightedScore += score * courseCredits;
        totalWeightedGpa += gradePoint * courseCredits;
        gradedCredits += courseCredits;
      }

      gradeList.push({
        enrollmentId: enr.id,
        courseCode: enr.offering.course.code,
        courseName: enr.offering.course.name,
        credits: courseCredits,
        semester: enr.offering.semester,
        teacherName: enr.offering.teacher.realName,
        score,
        gradePoint
      });
    }

    const weightedAverageScore = gradedCredits > 0 ? Number((totalWeightedScore / gradedCredits).toFixed(1)) : 0;
    const cumulativeGpa = gradedCredits > 0 ? Number((totalWeightedGpa / gradedCredits).toFixed(2)) : 0;

    log.info("[GET /api/grades/my] 返回", {
      userId: currentUserId,
      totalCreditsEnrolled,
      cumulativeGpa,
    });

    return c.json({
      totalCreditsEnrolled,
      totalCreditsEarned,
      weightedAverageScore,
      cumulativeGpa,
      grades: gradeList
    });
  };

  router.get("/my-grades", getMyGradesHandler);
  router.get("/my", getMyGradesHandler);

  router.get("/offering/:offeringId", async (c) => {
    const offeringId = c.req.param("offeringId");
    log.info("[GET /api/grades/offering/:offeringId] 查询班次学生名单", { offeringId });

    const { enrollments, courseOfferings } = await import("@repo/db/schema");

    const offering = await db.query.courseOfferings.findFirst({
      where: eq(courseOfferings.id, offeringId),
      with: {
        course: true,
        teacher: true,
      },
    });

    if (!offering) {
      log.fail("[GET /api/grades/offering/:offeringId] 教学班未找到", { offeringId });
      return c.json({ error: "未找到该教学班" }, 404);
    }

    const enrList = await db.query.enrollments.findMany({
      where: and(
        eq(enrollments.offeringId, offeringId),
        eq(enrollments.status, "ACTIVE")
      ),
      with: {
        student: true,
        grade: true,
      },
      orderBy: [enrollments.enrolledAt],
    });

    const students = enrList.map((enr) => ({
      enrollmentId: enr.id,
      studentId: enr.studentId,
      studentNo: enr.student.studentNo,
      realName: enr.student.realName,
      department: enr.student.department,
      className: enr.student.className,
      score: enr.grade ? enr.grade.score : null,
      gradePoint: enr.grade ? enr.grade.gradePoint : null,
      submittedAt: enr.grade ? enr.grade.submittedAt : null,
    }));

    log.info("[GET /api/grades/offering/:offeringId] 返回名单", {
      offeringId,
      totalStudents: students.length,
    });

    return c.json({
      offeringId,
      courseCode: offering.course.code,
      courseName: offering.course.name,
      teacherName: offering.teacher.realName,
      teacherId: offering.teacherId,
      semester: offering.semester,
      students,
    });
  });

  router.post("/submit", async (c) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch (err) {
      log.fail("[POST /api/grades/submit] 请求体解析失败", {
        reason: err instanceof Error ? err.message : String(err),
      });
      return c.json({ error: "请求体格式错误" }, 400);
    }

    const parsed = GradeInputSchema.safeParse(body);
    if (!parsed.success) {
      log.fail("[POST /api/grades/submit] 参数校验失败", { details: parsed.error.format() });
      return c.json({ error: "成绩格式错误", details: parsed.error.format() }, 400);
    }

    const { enrollmentId, score } = parsed.data;
    log.info("[POST /api/grades/submit] 录入", { enrollmentId, score });

    let gradePoint = 0.0;
    if (score >= 60) {
      gradePoint = Math.min(5.0, Number(((score - 50) / 10).toFixed(2)));
    }

    const { grades } = await import("@repo/db/schema");

    await db.insert(grades)
      .values({ enrollmentId, score, gradePoint, submittedAt: Date.now() })
      .onConflictDoUpdate({
        target: grades.enrollmentId,
        set: { score, gradePoint, submittedAt: Date.now() }
      });

    log.pass("[POST /api/grades/submit] 录入成功", { enrollmentId, score, gradePoint });
    return c.json({ message: "成绩录入成功", score, gradePoint });
  });

  return router;
}