import { z } from "zod";
import { CourseSchema } from "./course.js";

export const DayOfWeekSchema = z.number().int().min(1).max(7);
export type DayOfWeek = z.infer<typeof DayOfWeekSchema>;

export const WeekTypeSchema = z.enum(["ALL", "ODD", "EVEN"]);
export type WeekType = z.infer<typeof WeekTypeSchema>;

export const TimeSlotSchema = z.object({
  id: z.number().int().positive(),
  offeringId: z.string().min(1),
  dayOfWeek: DayOfWeekSchema,
  startPeriod: z.number().int().min(1).max(12),
  endPeriod: z.number().int().min(1).max(12),
  weekType: WeekTypeSchema
});
export type TimeSlot = z.infer<typeof TimeSlotSchema>;

export const CourseOfferingSchema = z.object({
  id: z.string().min(1),
  courseId: z.string().min(1),
  teacherId: z.string().min(1),
  semester: z.string().min(1),
  maxCapacity: z.number().int().positive(),
  currentCapacity: z.number().int().nonnegative(),
  classroom: z.string().min(1)
});
export type CourseOffering = z.infer<typeof CourseOfferingSchema>;

export const OfferingDetailSchema = CourseOfferingSchema.extend({
  course: CourseSchema,
  teacherName: z.string(),
  teacherTitle: z.string(),
  timeSlots: z.array(TimeSlotSchema),
  isEnrolled: z.boolean().optional(),
  isConflict: z.boolean().optional(),
  conflictReason: z.string().optional()
});
export type OfferingDetail = z.infer<typeof OfferingDetailSchema>;
