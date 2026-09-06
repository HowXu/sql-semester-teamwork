import { Hono, type Context } from "hono";
import { db, enrollments, grades, students } from "@repo/db";
import { eq, and } from "drizzle-orm";
import { GradeInputSchema } from "@repo/schema";

export const gradesRouter = new Hono();

async function resolveStudentId(idOrNo?: string | null): Promise<string> {
  if (!idOrNo) return "usr_stu_1";
  if (idOrNo.startsWith("usr_")) return idOrNo;
  const st = await db.query.students.findFirst({
    where: eq(students.studentNo, idOrNo)
  });
  return st ? st.id : idOrNo;
}

const getMyGradesHandler = async (c: Context) => {
  const rawUser = c.req.header("x-user-id") || c.req.query("studentId");
  const currentUserId = await resolveStudentId(rawUser);

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
  const body = await c.req.json();
  const parsed = GradeInputSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "成绩格式错误", details: parsed.error.format() }, 400);
  }

  const { enrollmentId, score } = parsed.data;

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

  return c.json({ message: "成绩录入成功", score, gradePoint });
});
