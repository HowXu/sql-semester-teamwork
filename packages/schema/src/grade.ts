import { z } from "zod";

export const GradeSchema = z.object({
  enrollmentId: z.string().min(1),
  score: z.number().min(0).max(100).nullable(),
  gradePoint: z.number().min(0).max(5.0).nullable(),
  submittedAt: z.number().int().positive().nullable()
});
export type Grade = z.infer<typeof GradeSchema>;

export const GradeInputSchema = z.object({
  enrollmentId: z.string().min(1),
  score: z.number().min(0).max(100)
});
export type GradeInput = z.infer<typeof GradeInputSchema>;

export const StudentGradeItemSchema = z.object({
  enrollmentId: z.string(),
  courseCode: z.string(),
  courseName: z.string(),
  credits: z.number(),
  semester: z.string(),
  teacherName: z.string(),
  score: z.number().nullable(),
  gradePoint: z.number().nullable()
});
export type StudentGradeItem = z.infer<typeof StudentGradeItemSchema>;

export const StudentGpaSummarySchema = z.object({
  totalCreditsEnrolled: z.number(),
  totalCreditsEarned: z.number(),
  weightedAverageScore: z.number(),
  cumulativeGpa: z.number(),
  grades: z.array(StudentGradeItemSchema)
});
export type StudentGpaSummary = z.infer<typeof StudentGpaSummarySchema>;
