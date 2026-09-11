import { eq } from "drizzle-orm";

const LEGACY_ID_MAP: Record<string, string> = {
  "user-s1": "usr_stu_1",
  "user-s2": "usr_stu_2",
  "user-s3": "usr_stu_3",
  "user-s4": "usr_stu_4",
  "user-t1": "usr_tch_1",
  "user-t2": "usr_tch_2",
  "user-t3": "usr_tch_3",
  "user-t4": "usr_tch_4",
  "user-a1": "usr_admin_1",
  "2024001": "usr_stu_1",
  "2024002": "usr_stu_2",
};

export interface ResolveStudentDeps {
  db: import("@repo/db").AppDatabase;
}

export async function resolveStudentId(
  idOrNo: string | null | undefined,
  deps: ResolveStudentDeps
): Promise<string> {
  if (!idOrNo) return "usr_stu_1";
  if (LEGACY_ID_MAP[idOrNo]) return LEGACY_ID_MAP[idOrNo];
  if (idOrNo.startsWith("usr_")) return idOrNo;

  const { students, users } = await import("@repo/db/schema");
  const db = deps.db;

  const st = await db.query.students.findFirst({
    where: eq(students.studentNo, idOrNo)
  });
  if (st) return st.id;

  const stById = await db.query.students.findFirst({
    where: eq(students.id, idOrNo)
  });
  if (stById) return stById.id;

  const u = await db.query.users.findFirst({
    where: eq(users.username, idOrNo)
  });
  if (u) {
    const s = await db.query.students.findFirst({
      where: eq(students.id, u.id)
    });
    if (s) return s.id;
    return u.id;
  }

  return idOrNo;
}