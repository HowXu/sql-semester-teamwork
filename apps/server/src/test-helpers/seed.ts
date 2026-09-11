import type { TestDb } from "./db.js";
import { users, students, teachers, courses, courseOfferings, timeSlots } from "@repo/db/schema";

export interface SeedIds {
  studentId: string;
  teacherId: string;
  courseId: string;
  offeringId: string;
  offeringId2: string;
}

export async function seedMinimal(testDb: TestDb): Promise<SeedIds> {
  const { db } = testDb;

  const now = Date.now();

  await db.insert(users).values([
    { id: "usr_stu_1", username: "student01", passwordHash: "password123", role: "STUDENT", createdAt: now },
    { id: "usr_tch_1", username: "tch_zhang", passwordHash: "password123", role: "TEACHER", createdAt: now },
  ]);

  await db.insert(students).values([
    { id: "usr_stu_1", studentNo: "20240101", realName: "测试学生", department: "计算机科学与技术学院", className: "测试班", enrolledCredits: 0 },
  ]);

  await db.insert(teachers).values([
    { id: "usr_tch_1", teacherNo: "T1001", realName: "测试教师", department: "计算机科学与技术学院", title: "讲师" },
  ]);

  await db.insert(courses).values([
    { id: "crs_test_01", code: "TEST101", name: "测试课程", credits: 3, department: "计算机科学与技术学院", description: null },
  ]);

  await db.insert(courseOfferings).values([
    { id: "off_test_01", courseId: "crs_test_01", teacherId: "usr_tch_1", semester: "2026-秋季", maxCapacity: 3, currentCapacity: 0, classroom: "测试教室 A" },
    { id: "off_test_02", courseId: "crs_test_01", teacherId: "usr_tch_1", semester: "2026-秋季", maxCapacity: 50, currentCapacity: 0, classroom: "测试教室 B" },
  ]);

  await db.insert(timeSlots).values([
    { offeringId: "off_test_01", dayOfWeek: 1, startPeriod: 1, endPeriod: 2, weekType: "ALL" },
    { offeringId: "off_test_02", dayOfWeek: 2, startPeriod: 1, endPeriod: 2, weekType: "ALL" },
  ]);

  return {
    studentId: "usr_stu_1",
    teacherId: "usr_tch_1",
    courseId: "crs_test_01",
    offeringId: "off_test_01",
    offeringId2: "off_test_02",
  };
}
