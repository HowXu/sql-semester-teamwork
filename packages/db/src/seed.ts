import { sqlite, db } from "./client.js";
import { users, students, teachers, courses, courseOfferings, timeSlots, enrollments, grades } from "./schema.js";

async function runSeed() {
  console.log("[INFO] 正在初始化 SQLite 数据表与种子数据...");

  // 1. 创建表结构 (若未自动执行 migration)
  await sqlite.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('STUDENT', 'TEACHER', 'ADMIN')),
      created_at INTEGER NOT NULL
    );
  `);

  await sqlite.execute(`
    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      student_no TEXT UNIQUE NOT NULL,
      real_name TEXT NOT NULL,
      department TEXT NOT NULL,
      class_name TEXT NOT NULL,
      enrolled_credits REAL NOT NULL DEFAULT 0.0
    );
  `);

  await sqlite.execute(`
    CREATE TABLE IF NOT EXISTS teachers (
      id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      teacher_no TEXT UNIQUE NOT NULL,
      real_name TEXT NOT NULL,
      department TEXT NOT NULL,
      title TEXT NOT NULL
    );
  `);

  await sqlite.execute(`
    CREATE TABLE IF NOT EXISTS courses (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      credits REAL NOT NULL,
      department TEXT NOT NULL,
      description TEXT
    );
  `);

  await sqlite.execute(`
    CREATE TABLE IF NOT EXISTS course_offerings (
      id TEXT PRIMARY KEY,
      course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
      teacher_id TEXT NOT NULL REFERENCES teachers(id) ON DELETE RESTRICT,
      semester TEXT NOT NULL,
      max_capacity INTEGER NOT NULL,
      current_capacity INTEGER NOT NULL DEFAULT 0,
      classroom TEXT NOT NULL
    );
  `);

  await sqlite.execute(`
    CREATE TABLE IF NOT EXISTS time_slots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      offering_id TEXT NOT NULL REFERENCES course_offerings(id) ON DELETE CASCADE,
      day_of_week INTEGER NOT NULL,
      start_period INTEGER NOT NULL,
      end_period INTEGER NOT NULL,
      week_type TEXT NOT NULL DEFAULT 'ALL'
    );
  `);

  await sqlite.execute(`
    CREATE TABLE IF NOT EXISTS enrollments (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      offering_id TEXT NOT NULL REFERENCES course_offerings(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      enrolled_at INTEGER NOT NULL
    );
  `);
  await sqlite.execute(
    `CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_enrollment
     ON enrollments(student_id, offering_id) WHERE status = 'ACTIVE';`
  );

  await sqlite.execute(`
    CREATE TABLE IF NOT EXISTS grades (
      enrollment_id TEXT PRIMARY KEY REFERENCES enrollments(id) ON DELETE CASCADE,
      score REAL,
      grade_point REAL,
      submitted_at INTEGER
    );
  `);

  await sqlite.execute(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      user_id TEXT NOT NULL,
      details TEXT NOT NULL,
      timestamp INTEGER NOT NULL
    );
  `);

  // 2. 清空现有数据
  await sqlite.execute("DELETE FROM audit_logs;");
  await sqlite.execute("DELETE FROM grades;");
  await sqlite.execute("DELETE FROM enrollments;");
  await sqlite.execute("DELETE FROM time_slots;");
  await sqlite.execute("DELETE FROM course_offerings;");
  await sqlite.execute("DELETE FROM courses;");
  await sqlite.execute("DELETE FROM teachers;");
  await sqlite.execute("DELETE FROM students;");
  await sqlite.execute("DELETE FROM users;");

  const now = Date.now();

  // 3. 插入用户与角色 (演示账号 + 批量模拟学生)
  const baseUserRows = [
    { id: "usr_admin", username: "admin", passwordHash: "admin123", role: "ADMIN" as const, createdAt: now },
    { id: "usr_tch_1", username: "tch_zhang", passwordHash: "password123", role: "TEACHER" as const, createdAt: now },
    { id: "usr_tch_2", username: "tch_wang", passwordHash: "password123", role: "TEACHER" as const, createdAt: now },
    { id: "usr_tch_3", username: "tch_li", passwordHash: "password123", role: "TEACHER" as const, createdAt: now },
    { id: "usr_tch_4", username: "tch_chen", passwordHash: "password123", role: "TEACHER" as const, createdAt: now },
    { id: "usr_stu_1", username: "student01", passwordHash: "password123", role: "STUDENT" as const, createdAt: now },
    { id: "usr_stu_2", username: "student02", passwordHash: "password123", role: "STUDENT" as const, createdAt: now },
    { id: "usr_stu_3", username: "student03", passwordHash: "password123", role: "STUDENT" as const, createdAt: now },
    { id: "usr_stu_4", username: "student04", passwordHash: "password123", role: "STUDENT" as const, createdAt: now }
  ];

  const mockUserRows = [];
  const mockStudentRows = [];
  const surnames = ["张", "李", "王", "赵", "陈", "刘", "杨", "黄", "周", "吴"];
  const givenNames = ["浩然", "梓轩", "雨桐", "佳琪", "宇轩", "子涵", "欣怡", "俊杰", "博文", "若琳"];
  const depts = ["计算机科学与技术学院", "软件工程学院", "数据科学与大数据学院", "网络空间安全学院"];

  for (let i = 1; i <= 50; i++) {
    const id = `usr_mock_${String(i).padStart(3, "0")}`;
    const studentNo = `2024${String(900 + i).padStart(4, "0")}`;
    const realName = `${surnames[i % 10]}${givenNames[(i * 3) % 10]}`;
    const dept = depts[i % 4]!;
    mockUserRows.push({
      id,
      username: `mock_stu_${i}`,
      passwordHash: "password123",
      role: "STUDENT" as const,
      createdAt: now
    });
    mockStudentRows.push({
      id,
      studentNo,
      realName,
      department: dept,
      className: `${dept.slice(0, 2)}2401班`,
      enrolledCredits: 0
    });
  }

  await db.insert(users).values([...baseUserRows, ...mockUserRows]);

  // 4. 插入教师信息
  const teacherRows = [
    { id: "usr_tch_1", teacherNo: "T1001", realName: "张博远", department: "计算机科学与技术学院", title: "教授" },
    { id: "usr_tch_2", teacherNo: "T1002", realName: "王思涵", department: "软件工程学院", title: "副教授" },
    { id: "usr_tch_3", teacherNo: "T1003", realName: "李建平", department: "数据科学与大数据学院", title: "教授" },
    { id: "usr_tch_4", teacherNo: "T1004", realName: "陈雅静", department: "网络空间安全学院", title: "副教授" }
  ];
  await db.insert(teachers).values(teacherRows);

  // 5. 插入学生信息 (主演示学生 + 模拟学生)
  const baseStudentRows = [
    { id: "usr_stu_1", studentNo: "20240101", realName: "李明", department: "计算机科学与技术学院", className: "计科2401班", enrolledCredits: 10.5 },
    { id: "usr_stu_2", studentNo: "20240102", realName: "苏晓彤", department: "计算机科学与技术学院", className: "计科2401班", enrolledCredits: 0.0 },
    { id: "usr_stu_3", studentNo: "20240201", realName: "赵文杰", department: "软件工程学院", className: "软工2402班", enrolledCredits: 0.0 },
    { id: "usr_stu_4", studentNo: "20240301", realName: "韩雪丽", department: "数据科学与大数据学院", className: "数据2401班", enrolledCredits: 0.0 }
  ];
  await db.insert(students).values([...baseStudentRows, ...mockStudentRows]);

  // 6. 插入精品课程库
  const courseRows = [
    { id: "crs_db", code: "CS201", name: "数据库系统设计与实现", credits: 3.5, department: "计算机科学与技术学院", description: "深入探讨关系数据模型、SQL引擎、事务并发控制、存储引擎与SQLite架构设计。" },
    { id: "crs_ds", code: "CS202", name: "数据结构与高级算法", credits: 4.0, department: "计算机科学与技术学院", description: "树、图、高级排序、动态规划及空间换时间策略，兼顾理论与工程实践。" },
    { id: "crs_os", code: "CS301", name: "操作系统核心原理", credits: 4.0, department: "计算机科学与技术学院", description: "进程线程模型、内存虚拟化、文件系统与驱动协同，Linux内核实验导读。" },
    { id: "crs_net", code: "CS302", name: "计算机网络与分布式系统", credits: 3.0, department: "计算机科学与技术学院", description: "TCP/IP协议栈剖析、HTTP/3、Socket网络编程与分布式一致性协议。" },
    { id: "crs_se", code: "SE201", name: "敏捷软件工程与DevOps", credits: 2.5, department: "软件工程学院", description: "现代软件架构设计、CI/CD流水线构建、重构策略与代码审查标准。" },
    { id: "crs_web", code: "SE202", name: "现代全栈Web开发技术", credits: 3.0, department: "软件工程学院", description: "TypeScript、React现代前端、Hono服务端与全链路类型安全实战。" },
    { id: "crs_ai", code: "AI301", name: "机器学习与模式识别", credits: 3.5, department: "数据科学与大数据学院", description: "监督学习、无监督聚类、模型评估与特征工程数学基础。" },
    { id: "crs_sec", code: "SEC201", name: "信息安全与应用密码学", credits: 3.0, department: "网络空间安全学院", description: "对称与非对称加密算法、数字签名、公钥基础设施与常见Web安全攻防。" }
  ];
  await db.insert(courses).values(courseRows);

  // 7. 插入开课教学班 (2026-秋季学期)
  const offeringRows = [
    { id: "off_db_01", courseId: "crs_db", teacherId: "usr_tch_1", semester: "2026-秋季", maxCapacity: 45, currentCapacity: 0, classroom: "信息楼 A-201" },
    { id: "off_ds_01", courseId: "crs_ds", teacherId: "usr_tch_1", semester: "2026-秋季", maxCapacity: 50, currentCapacity: 0, classroom: "实验楼 B-405" },
    { id: "off_os_01", courseId: "crs_os", teacherId: "usr_tch_2", semester: "2026-秋季", maxCapacity: 40, currentCapacity: 0, classroom: "教学主楼 301" },
    { id: "off_net_01", courseId: "crs_net", teacherId: "usr_tch_2", semester: "2026-秋季", maxCapacity: 60, currentCapacity: 0, classroom: "教学主楼 402" },
    { id: "off_se_01", courseId: "crs_se", teacherId: "usr_tch_3", semester: "2026-秋季", maxCapacity: 35, currentCapacity: 0, classroom: "信息楼 C-108" },
    { id: "off_web_01", courseId: "crs_web", teacherId: "usr_tch_3", semester: "2026-秋季", maxCapacity: 40, currentCapacity: 0, classroom: "网络机房 203" },
    { id: "off_ai_01", courseId: "crs_ai", teacherId: "usr_tch_4", semester: "2026-秋季", maxCapacity: 50, currentCapacity: 0, classroom: "高科报告厅 101" },
    { id: "off_sec_01", courseId: "crs_sec", teacherId: "usr_tch_4", semester: "2026-秋季", maxCapacity: 30, currentCapacity: 0, classroom: "实验楼 A-102" }
  ];
  await db.insert(courseOfferings).values(offeringRows);

  // 8. 插入排课时间段
  const timeSlotRows = [
    { offeringId: "off_db_01", dayOfWeek: 1, startPeriod: 1, endPeriod: 2, weekType: "ALL" as const },
    { offeringId: "off_ds_01", dayOfWeek: 1, startPeriod: 3, endPeriod: 4, weekType: "ALL" as const },
    { offeringId: "off_os_01", dayOfWeek: 2, startPeriod: 5, endPeriod: 6, weekType: "ALL" as const },
    { offeringId: "off_net_01", dayOfWeek: 3, startPeriod: 1, endPeriod: 2, weekType: "ALL" as const },
    { offeringId: "off_se_01", dayOfWeek: 3, startPeriod: 3, endPeriod: 4, weekType: "ALL" as const },
    { offeringId: "off_web_01", dayOfWeek: 4, startPeriod: 7, endPeriod: 8, weekType: "ALL" as const },
    { offeringId: "off_ai_01", dayOfWeek: 5, startPeriod: 3, endPeriod: 4, weekType: "ALL" as const },
    { offeringId: "off_sec_01", dayOfWeek: 5, startPeriod: 5, endPeriod: 6, weekType: "ALL" as const }
  ];
  await db.insert(timeSlots).values(timeSlotRows);

  // 9. 预置真实选课记录 (支持演示场景)：
  // - off_se_01: 35 人预选 (35/35 满额演示)
  // - off_ds_01: 48 人预选 (48/50 临界抢课与超卖拦截演示，含李明)
  // - off_web_01: 18 人预选 (18/40 常规加选/退课演示)
  // - off_db_01: 42 人预选 (42/45 成绩与绩点计算演示，含李明)
  // - off_net_01: 30 人预选 (30/60 时间冲突演示，含李明)
  // - off_os_01: 35 人预选 (35/40)
  // - off_ai_01: 46 人预选 (46/50)
  // - off_sec_01: 12 人预选 (12/30)
  const enrollmentRows = [
    // 李明 (usr_stu_1) 基础选课
    { id: "enr_stu1_db", studentId: "usr_stu_1", offeringId: "off_db_01", status: "ACTIVE" as const, enrolledAt: now - 86400000 * 3 },
    { id: "enr_stu1_ds", studentId: "usr_stu_1", offeringId: "off_ds_01", status: "ACTIVE" as const, enrolledAt: now - 86400000 * 2 },
    { id: "enr_stu1_net", studentId: "usr_stu_1", offeringId: "off_net_01", status: "ACTIVE" as const, enrolledAt: now - 86400000 * 1 }
  ];

  // 辅助函数：批量灌入 mock 学生选课
  const addMockEnrolls = (offeringId: string, count: number) => {
    for (let i = 1; i <= count; i++) {
      const stuId = `usr_mock_${String(i).padStart(3, "0")}`;
      enrollmentRows.push({
        id: `enr_${offeringId}_m${i}`,
        studentId: stuId,
        offeringId,
        status: "ACTIVE" as const,
        enrolledAt: now - Math.floor(Math.random() * 86400000 * 5)
      });
    }
  };

  addMockEnrolls("off_se_01", 35); // 35/35 (满额)
  addMockEnrolls("off_ds_01", 47); // 47 + 李明 = 48/50 (剩2个名额)
  addMockEnrolls("off_db_01", 41); // 41 + 李明 = 42/45
  addMockEnrolls("off_net_01", 29); // 29 + 李明 = 30/60
  addMockEnrolls("off_os_01", 35); // 35/40
  addMockEnrolls("off_web_01", 18); // 18/40 (充裕)
  addMockEnrolls("off_ai_01", 46); // 46/50
  addMockEnrolls("off_sec_01", 12); // 12/30

  await db.insert(enrollments).values(enrollmentRows);

  // 10. 预置成绩 (李明成绩单)
  const gradeRows = [
    { enrollmentId: "enr_stu1_db", score: 92.5, gradePoint: 4.25, submittedAt: now },
    { enrollmentId: "enr_stu1_ds", score: 88.0, gradePoint: 3.8, submittedAt: now },
    { enrollmentId: "enr_stu1_net", score: 91.0, gradePoint: 4.1, submittedAt: now }
  ];
  await db.insert(grades).values(gradeRows);

  // 11. 同步校准所有教学班 current_capacity
  await sqlite.execute(`
    UPDATE course_offerings
    SET current_capacity = COALESCE((
      SELECT COUNT(*) FROM enrollments e
      WHERE e.offering_id = course_offerings.id AND e.status = 'ACTIVE'
    ), 0);
  `);

  console.log(`[PASS] SQLite 高保真演示数据填充完毕！已注入 54 名学生、${enrollmentRows.length} 条真实选课记录与成绩。`);
}

runSeed().catch((err) => {
  console.error("[FAIL] 数据库初始化或种子注入失败:", err);
  process.exit(1);
});
