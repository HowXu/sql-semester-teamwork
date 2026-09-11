export const ALL_CREATE_TABLE_STATEMENTS: readonly string[] = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('STUDENT', 'TEACHER', 'ADMIN')),
    created_at INTEGER NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    student_no TEXT UNIQUE NOT NULL,
    real_name TEXT NOT NULL,
    department TEXT NOT NULL,
    class_name TEXT NOT NULL,
    enrolled_credits REAL NOT NULL DEFAULT 0.0
  );`,
  `CREATE TABLE IF NOT EXISTS teachers (
    id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    teacher_no TEXT UNIQUE NOT NULL,
    real_name TEXT NOT NULL,
    department TEXT NOT NULL,
    title TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    credits REAL NOT NULL,
    department TEXT NOT NULL,
    description TEXT
  );`,
  `CREATE TABLE IF NOT EXISTS course_offerings (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
    teacher_id TEXT NOT NULL REFERENCES teachers(id) ON DELETE RESTRICT,
    semester TEXT NOT NULL,
    max_capacity INTEGER NOT NULL,
    current_capacity INTEGER NOT NULL DEFAULT 0,
    classroom TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS time_slots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    offering_id TEXT NOT NULL REFERENCES course_offerings(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL,
    start_period INTEGER NOT NULL,
    end_period INTEGER NOT NULL,
    week_type TEXT NOT NULL DEFAULT 'ALL'
  );`,
  `CREATE TABLE IF NOT EXISTS enrollments (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    offering_id TEXT NOT NULL REFERENCES course_offerings(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    enrolled_at INTEGER NOT NULL
  );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_enrollment
    ON enrollments(student_id, offering_id) WHERE status = 'ACTIVE';`,
  `CREATE TABLE IF NOT EXISTS grades (
    enrollment_id TEXT PRIMARY KEY REFERENCES enrollments(id) ON DELETE CASCADE,
    score REAL,
    grade_point REAL,
    submitted_at INTEGER
  );`,
  `CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT NOT NULL,
    user_id TEXT NOT NULL,
    details TEXT NOT NULL,
    timestamp INTEGER NOT NULL
  );`,
] as const;
