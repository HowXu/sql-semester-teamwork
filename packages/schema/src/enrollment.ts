import { z } from "zod";

export const EnrollmentStatusSchema = z.enum(["ACTIVE", "DROPPED"]);
export type EnrollmentStatus = z.infer<typeof EnrollmentStatusSchema>;

export const EnrollmentSchema = z.object({
  id: z.string().min(1),
  studentId: z.string().min(1),
  offeringId: z.string().min(1),
  status: EnrollmentStatusSchema,
  enrolledAt: z.number().int().positive()
});
export type Enrollment = z.infer<typeof EnrollmentSchema>;

export const EnrollInputSchema = z.object({
  offeringId: z.string().min(1, "教学班 ID 不能为空")
});
export type EnrollInput = z.infer<typeof EnrollInputSchema>;

export const DropInputSchema = z.object({
  enrollmentId: z.string().min(1, "选课记录 ID 不能为空")
});
export type DropInput = z.infer<typeof DropInputSchema>;

export const ScheduleConflictSchema = z.object({
  conflictingOfferingId: z.string(),
  conflictingCourseName: z.string(),
  dayOfWeek: z.number(),
  startPeriod: z.number(),
  endPeriod: z.number()
});
export type ScheduleConflict = z.infer<typeof ScheduleConflictSchema>;

export const StudentTimetableItemSchema = z.object({
  enrollmentId: z.string(),
  offeringId: z.string(),
  courseId: z.string(),
  courseCode: z.string(),
  courseName: z.string(),
  credits: z.number(),
  teacherName: z.string(),
  classroom: z.string(),
  timeSlotId: z.number(),
  dayOfWeek: z.number(),
  startPeriod: z.number(),
  endPeriod: z.number(),
  weekType: z.string(),
  colorIndex: z.number()
});
export type StudentTimetableItem = z.infer<typeof StudentTimetableItemSchema>;
