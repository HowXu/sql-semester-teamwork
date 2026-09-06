import { z } from "zod";

export const UserRoleSchema = z.enum(["STUDENT", "TEACHER", "ADMIN"]);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const UserSchema = z.object({
  id: z.string().min(1),
  username: z.string().min(3).max(32),
  role: UserRoleSchema,
  createdAt: z.number().int().positive()
});
export type User = z.infer<typeof UserSchema>;

export const LoginInputSchema = z.object({
  username: z.string().min(1, "请输入用户名"),
  password: z.string().min(1, "请输入密码")
});
export type LoginInput = z.infer<typeof LoginInputSchema>;

export const AuthSessionSchema = z.object({
  user: UserSchema,
  studentId: z.string().nullable().optional(),
  teacherId: z.string().nullable().optional(),
  displayName: z.string(),
  department: z.string()
});
export type AuthSession = z.infer<typeof AuthSessionSchema>;
