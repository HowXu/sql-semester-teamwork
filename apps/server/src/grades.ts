import { Hono, type Context } from "hono";
import { db, enrollments, grades } from "@repo/db";
import { eq, and } from "drizzle-orm";
import { GradeInputSchema } from "@repo/schema";
import { resolveStudentId } from "./resolveStudent.js";
import { log } from "./logger.js";

export const gradesRouter = new Hono();

const getMyGradesHandler = async (c: Context) => {
  const queryStudent = c.req.query("studentId");
  const headerUser = c.req.header("x-user-id");
  const rawUser = queryStudent || headerUser;
  const currentUserId = await resolveStudentId(rawUser);
  log.info("[GET /api/grades/my] 读取", { userId: currentUserId });

  const allMyEnrollments = await db.query.enrollments.findMany({
    where: and(
      eq(enrollments.studentId, currentUserId),
      eq(enrollments.status, "ACTIVE")
    ),
    with: {
      offering: {
        with: {
          course: true,
          teacher: true
        }
      },
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

gradesRouter.get("/my-grades", getMyGradesHandler);
gradesRouter.get("/my", getMyGradesHandler);

gradesRouter.post("/submit", async (c) => {
  log.info("[POST /api/grades/submit] 请求开始", {
    userId: c.req.header("x-user-id") ?? "anonymous",
  });

  let body: unknown;
  try {
    body = await c.req.json();
  } catch (err) {
    log.fail("[POST /api/grades/submit] 请求体解析失败", {
      reason: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }

  const parsed = GradeInputSchema.safeParse(body);
  if (!parsed.success) {
    log.fail("[POST /api/grades/submit] 参数校验失败", { details: parsed.error.format() });
    return c.json({ error: "成绩格式错误", details: parsed.error.format() }, 400);
  }

  const { enrollmentId, score } = parsed.data;
  log.info("[POST /api/grades/submit] 录入", { enrollmentId, score });

  // 标准高校绩点折算算法：>=60分起评，(score - 50) / 10
  let gradePoint = 0.0;
  if (score >= 60) {
    gradePoint = Math.min(5.0, Number(((score - 50) / 10).toFixed(2)));
  }

  await db.insert(grades)
    .values({
      enrollmentId,
      score,
      gradePoint,
      submittedAt: Date.now()
    })
    .onConflictDoUpdate({
      target: grades.enrollmentId,
      set: {
        score,
        gradePoint,
        submittedAt: Date.now()
      }
    });

  log.pass("[POST /api/grades/submit] 录入成功", { enrollmentId, score, gradePoint });
  return c.json({ message: "成绩录入成功", score, gradePoint });
});
