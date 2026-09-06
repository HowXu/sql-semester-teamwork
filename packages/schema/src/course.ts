import { z } from "zod";

export const CourseSchema = z.object({
  id: z.string().min(1),
  code: z.string().min(1),
  name: z.string().min(1),
  credits: z.number().positive().max(10),
  department: z.string().min(1),
  description: z.string().nullable()
});
export type Course = z.infer<typeof CourseSchema>;

export const CourseQuerySchema = z.object({
  search: z.string().optional(),
  department: z.string().optional(),
  semester: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20)
});
export type CourseQuery = z.infer<typeof CourseQuerySchema>;
