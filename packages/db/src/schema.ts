import { sqliteTable, text, integer, real, uniqueIndex } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["STUDENT", "TEACHER", "ADMIN"] }).notNull(),
  createdAt: integer("created_at").notNull()
});

export const students = sqliteTable("students", {
  id: text("id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  studentNo: text("student_no").notNull().unique(),
  realName: text("real_name").notNull(),
  department: text("department").notNull(),
  className: text("class_name").notNull(),
  enrolledCredits: real("enrolled_credits").notNull().default(0.0)
});

export const teachers = sqliteTable("teachers", {
  id: text("id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  teacherNo: text("teacher_no").notNull().unique(),
  realName: text("real_name").notNull(),
  department: text("department").notNull(),
  title: text("title").notNull()
});

export const courses = sqliteTable("courses", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  credits: real("credits").notNull(),
  department: text("department").notNull(),
  description: text("description")
});

export const courseOfferings = sqliteTable("course_offerings", {
  id: text("id").primaryKey(),
  courseId: text("course_id").notNull().references(() => courses.id, { onDelete: "restrict" }),
  teacherId: text("teacher_id").notNull().references(() => teachers.id, { onDelete: "restrict" }),
  semester: text("semester").notNull(),
  maxCapacity: integer("max_capacity").notNull(),
  currentCapacity: integer("current_capacity").notNull().default(0),
  classroom: text("classroom").notNull()
});

export const timeSlots = sqliteTable("time_slots", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  offeringId: text("offering_id").notNull().references(() => courseOfferings.id, { onDelete: "cascade" }),
  dayOfWeek: integer("day_of_week").notNull(),
  startPeriod: integer("start_period").notNull(),
  endPeriod: integer("end_period").notNull(),
  weekType: text("week_type", { enum: ["ALL", "ODD", "EVEN"] }).notNull().default("ALL")
});

export const enrollments = sqliteTable(
  "enrollments",
  {
    id: text("id").primaryKey(),
    studentId: text("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
    offeringId: text("offering_id").notNull().references(() => courseOfferings.id, { onDelete: "cascade" }),
    status: text("status", { enum: ["ACTIVE", "DROPPED"] }).notNull().default("ACTIVE"),
    enrolledAt: integer("enrolled_at").notNull()
  },
  (table) => [
    uniqueIndex("uniq_student_offering").on(table.studentId, table.offeringId)
  ]
);

export const grades = sqliteTable("grades", {
  enrollmentId: text("enrollment_id").primaryKey().references(() => enrollments.id, { onDelete: "cascade" }),
  score: real("score"),
  gradePoint: real("grade_point"),
  submittedAt: integer("submitted_at")
});

export const auditLogs = sqliteTable("audit_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  action: text("action").notNull(),
  userId: text("user_id").notNull(),
  details: text("details").notNull(),
  timestamp: integer("timestamp").notNull()
});

export const usersRelations = relations(users, ({ one }) => ({
  student: one(students, {
    fields: [users.id],
    references: [students.id]
  }),
  teacher: one(teachers, {
    fields: [users.id],
    references: [teachers.id]
  })
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  user: one(users, {
    fields: [students.id],
    references: [users.id]
  }),
  enrollments: many(enrollments)
}));

export const teachersRelations = relations(teachers, ({ one, many }) => ({
  user: one(users, {
    fields: [teachers.id],
    references: [users.id]
  }),
  offerings: many(courseOfferings)
}));

export const coursesRelations = relations(courses, ({ many }) => ({
  offerings: many(courseOfferings)
}));

export const courseOfferingsRelations = relations(courseOfferings, ({ one, many }) => ({
  course: one(courses, {
    fields: [courseOfferings.courseId],
    references: [courses.id]
  }),
  teacher: one(teachers, {
    fields: [courseOfferings.teacherId],
    references: [teachers.id]
  }),
  timeSlots: many(timeSlots),
  enrollments: many(enrollments)
}));

export const timeSlotsRelations = relations(timeSlots, ({ one }) => ({
  offering: one(courseOfferings, {
    fields: [timeSlots.offeringId],
    references: [courseOfferings.id]
  })
}));

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  student: one(students, {
    fields: [enrollments.studentId],
    references: [students.id]
  }),
  offering: one(courseOfferings, {
    fields: [enrollments.offeringId],
    references: [courseOfferings.id]
  }),
  grade: one(grades, {
    fields: [enrollments.id],
    references: [grades.enrollmentId]
  })
}));

export const gradesRelations = relations(grades, ({ one }) => ({
  enrollment: one(enrollments, {
    fields: [grades.enrollmentId],
    references: [enrollments.id]
  })
}));
