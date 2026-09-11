import type {
  ApiCourse,
  ApiOffering,
  ApiScheduleItem,
  ApiScheduleResponse,
  ApiGradeItem,
  ApiGradeResponse,
  ApiStatsResponse,
} from "./client";

const STORAGE_KEY = "academic_system_offline_db_v3";

interface StoredData {
  courses: ApiCourse[];
  offerings: ApiOffering[];
  enrollments: {
    id: string;
    studentId: string;
    offeringId: string;
    enrolledAt: number;
    score?: number;
    gradePoint?: number;
  }[];
}

const INITIAL_COURSES: ApiCourse[] = [
  {
    id: "crs_db",
    code: "CS201",
    name: "数据库系统设计与实现",
    credits: 3.5,
    department: "计算机科学与技术学院",
    description: "深入探讨关系数据模型、SQL引擎、事务并发控制、存储引擎与SQLite架构设计。",
    prerequisites: "数据结构与高级算法",
  },
  {
    id: "crs_ds",
    code: "CS202",
    name: "数据结构与高级算法",
    credits: 4.0,
    department: "计算机科学与技术学院",
    description: "树、图、高级排序、动态规划及空间换时间策略，兼顾理论与工程实践。",
    prerequisites: "高等数学, 程序设计基础",
  },
  {
    id: "crs_os",
    code: "CS301",
    name: "操作系统核心原理",
    credits: 4.0,
    department: "计算机科学与技术学院",
    description: "进程线程模型、内存虚拟化、文件系统与驱动协同，Linux内核实验导读。",
    prerequisites: "计算机组成原理",
  },
  {
    id: "crs_net",
    code: "CS302",
    name: "计算机网络与分布式系统",
    credits: 3.0,
    department: "计算机科学与技术学院",
    description: "TCP/IP协议栈剖析、HTTP/3、Socket网络编程与分布式一致性协议。",
    prerequisites: "操作系统核心原理",
  },
  {
    id: "crs_se",
    code: "SE201",
    name: "敏捷软件工程与DevOps",
    credits: 2.5,
    department: "软件工程学院",
    description: "现代软件架构设计、CI/CD流水线构建、重构策略与代码审查标准。",
    prerequisites: null,
  },
  {
    id: "crs_web",
    code: "SE202",
    name: "现代全栈Web开发技术",
    credits: 3.0,
    department: "软件工程学院",
    description: "TypeScript、React现代前端、Hono服务端与全链路类型安全实战。",
    prerequisites: "计算机网络",
  },
  {
    id: "crs_ai",
    code: "AI301",
    name: "机器学习与模式识别",
    credits: 3.5,
    department: "数据科学与大数据学院",
    description: "监督学习、无监督聚类、模型评估与特征工程数学基础。",
    prerequisites: "线性代数, 概率论与数理统计",
  },
  {
    id: "crs_sec",
    code: "SEC201",
    name: "信息安全与应用密码学",
    credits: 3.0,
    department: "网络空间安全学院",
    description: "对称与非对称加密算法、数字签名、公钥基础设施与常见Web安全攻防。",
    prerequisites: "离散数学",
  },
];

const INITIAL_OFFERINGS: ApiOffering[] = [
  {
    id: "off_db_01",
    courseId: "crs_db",
    teacherId: "T1001",
    semester: "2026-秋季",
    classroom: "信息楼 A-201",
    dayOfWeek: 1,
    startPeriod: 1,
    endPeriod: 2,
    maxCapacity: 45,
    currentCapacity: 2,
    courseName: "数据库系统设计与实现",
    courseCode: "CS201",
    department: "计算机科学与技术学院",
    credits: 3.5,
    teacherName: "张博远 教授",
  },
  {
    id: "off_ds_01",
    courseId: "crs_ds",
    teacherId: "T1001",
    semester: "2026-秋季",
    classroom: "实验楼 B-405",
    dayOfWeek: 1,
    startPeriod: 3,
    endPeriod: 4,
    maxCapacity: 50,
    currentCapacity: 2,
    courseName: "数据结构与高级算法",
    courseCode: "CS202",
    department: "计算机科学与技术学院",
    credits: 4.0,
    teacherName: "张博远 教授",
  },
  {
    id: "off_os_01",
    courseId: "crs_os",
    teacherId: "T1002",
    semester: "2026-秋季",
    classroom: "教学主楼 301",
    dayOfWeek: 2,
    startPeriod: 5,
    endPeriod: 6,
    maxCapacity: 40,
    currentCapacity: 2,
    courseName: "操作系统核心原理",
    courseCode: "CS301",
    department: "计算机科学与技术学院",
    credits: 4.0,
    teacherName: "王思涵 副教授",
  },
  {
    id: "off_net_01",
    courseId: "crs_net",
    teacherId: "T1002",
    semester: "2026-秋季",
    classroom: "教学主楼 402",
    dayOfWeek: 3,
    startPeriod: 1,
    endPeriod: 2,
    maxCapacity: 60,
    currentCapacity: 2,
    courseName: "计算机网络与分布式系统",
    courseCode: "CS302",
    department: "计算机科学与技术学院",
    credits: 3.0,
    teacherName: "王思涵 副教授",
  },
  {
    id: "off_se_01",
    courseId: "crs_se",
    teacherId: "T1003",
    semester: "2026-秋季",
    classroom: "信息楼 C-108",
    dayOfWeek: 3,
    startPeriod: 3,
    endPeriod: 4,
    maxCapacity: 35,
    currentCapacity: 2,
    courseName: "敏捷软件工程与DevOps",
    courseCode: "SE201",
    department: "软件工程学院",
    credits: 2.5,
    teacherName: "李建平 教授",
  },
  {
    id: "off_web_01",
    courseId: "crs_web",
    teacherId: "T1003",
    semester: "2026-秋季",
    classroom: "网络机房 203",
    dayOfWeek: 4,
    startPeriod: 7,
    endPeriod: 8,
    maxCapacity: 40,
    currentCapacity: 0,
    courseName: "现代全栈Web开发技术",
    courseCode: "SE202",
    department: "软件工程学院",
    credits: 3.0,
    teacherName: "李建平 教授",
  },
  {
    id: "off_ai_01",
    courseId: "crs_ai",
    teacherId: "T1004",
    semester: "2026-秋季",
    classroom: "高科报告厅 101",
    dayOfWeek: 5,
    startPeriod: 3,
    endPeriod: 4,
    maxCapacity: 50,
    currentCapacity: 0,
    courseName: "机器学习与模式识别",
    courseCode: "AI301",
    department: "数据科学与大数据学院",
    credits: 3.5,
    teacherName: "陈雅静 副教授",
  },
  {
    id: "off_sec_01",
    courseId: "crs_sec",
    teacherId: "T1004",
    semester: "2026-秋季",
    classroom: "实验楼 A-102",
    dayOfWeek: 5,
    startPeriod: 5,
    endPeriod: 6,
    maxCapacity: 30,
    currentCapacity: 0,
    courseName: "信息安全与应用密码学",
    courseCode: "SEC201",
    department: "网络空间安全学院",
    credits: 3.0,
    teacherName: "陈雅静 副教授",
  },
];

const INITIAL_ENROLLMENTS = [
  { id: "enr_1", studentId: "20240101", offeringId: "off_db_01", enrolledAt: Date.now() - 86400000 * 3, score: 92.5, gradePoint: 4.25 },
  { id: "enr_2", studentId: "20240101", offeringId: "off_ds_01", enrolledAt: Date.now() - 86400000 * 2, score: 88.0, gradePoint: 3.80 },
  { id: "enr_3", studentId: "20240101", offeringId: "off_net_01", enrolledAt: Date.now() - 86400000 * 1, score: 91.0, gradePoint: 4.10 },
  { id: "enr_1b", studentId: "2024001", offeringId: "off_db_01", enrolledAt: Date.now() - 86400000 * 3, score: 92.5, gradePoint: 4.25 },
  { id: "enr_2b", studentId: "2024001", offeringId: "off_ds_01", enrolledAt: Date.now() - 86400000 * 2, score: 88.0, gradePoint: 3.80 },
  { id: "enr_3b", studentId: "2024001", offeringId: "off_net_01", enrolledAt: Date.now() - 86400000 * 1, score: 91.0, gradePoint: 4.10 },
  { id: "enr_4", studentId: "20240102", offeringId: "off_os_01", enrolledAt: Date.now() - 86400000 * 2, score: 95.0, gradePoint: 4.50 },
  { id: "enr_5", studentId: "20240102", offeringId: "off_se_01", enrolledAt: Date.now() - 86400000 * 1, score: 86.5, gradePoint: 3.65 },
  { id: "enr_4b", studentId: "2024002", offeringId: "off_os_01", enrolledAt: Date.now() - 86400000 * 2, score: 95.0, gradePoint: 4.50 },
  { id: "enr_5b", studentId: "2024002", offeringId: "off_se_01", enrolledAt: Date.now() - 86400000 * 1, score: 86.5, gradePoint: 3.65 },
];

function loadStoredData(): StoredData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.offerings?.length > 0) {
        return parsed;
      }
    }
  } catch {
    // ignore parse error
  }
  return {
    courses: INITIAL_COURSES,
    offerings: INITIAL_OFFERINGS,
    enrollments: INITIAL_ENROLLMENTS,
  };
}

function saveStoredData(data: StoredData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

function matchStudentId(recordStudentId: string, queryStudentId: string): boolean {
  if (recordStudentId === queryStudentId) return true;
  const isQueryStu1 =
    queryStudentId === "20240101" ||
    queryStudentId === "usr_stu_1" ||
    queryStudentId === "user-s1" ||
    queryStudentId === "2024001";
  const isRecordStu1 =
    recordStudentId === "20240101" ||
    recordStudentId === "usr_stu_1" ||
    recordStudentId === "user-s1" ||
    recordStudentId === "2024001";
  if (isQueryStu1 && isRecordStu1) return true;

  const isQueryStu2 =
    queryStudentId === "20240102" ||
    queryStudentId === "usr_stu_2" ||
    queryStudentId === "user-s2" ||
    queryStudentId === "2024002";
  const isRecordStu2 =
    recordStudentId === "20240102" ||
    recordStudentId === "usr_stu_2" ||
    recordStudentId === "user-s2" ||
    recordStudentId === "2024002";
  if (isQueryStu2 && isRecordStu2) return true;

  return false;
}

let db = loadStoredData();

export const offlineDataEngine = {
  resetDatabase() {
    db = {
      courses: INITIAL_COURSES,
      offerings: INITIAL_OFFERINGS,
      enrollments: INITIAL_ENROLLMENTS,
    };
    saveStoredData(db);
  },

  getCourses(q?: string, department?: string): { courses: ApiCourse[] } {
    let list = db.courses;
    if (department && department !== "all") {
      list = list.filter((c) => c.department === department);
    }
    if (q) {
      const lower = q.toLowerCase();
      list = list.filter(
        (c) => c.name.toLowerCase().includes(lower) || c.code.toLowerCase().includes(lower)
      );
    }
    return { courses: list };
  },

  getOfferings(semester?: string, dayOfWeek?: number): { offerings: ApiOffering[] } {
    let list = db.offerings;
    if (semester) {
      list = list.filter((o) => o.semester === semester);
    }
    if (dayOfWeek !== undefined) {
      list = list.filter((o) => o.dayOfWeek === dayOfWeek);
    }
    return { offerings: list };
  },

  checkConflict(payload: {
    dayOfWeek: number;
    startPeriod: number;
    endPeriod: number;
    excludeOfferingId?: string;
  }) {
    const conflicts = db.offerings.filter((o) => {
      if (payload.excludeOfferingId && o.id === payload.excludeOfferingId) return false;
      if (o.dayOfWeek !== payload.dayOfWeek) return false;
      return (
        Math.max(o.startPeriod, payload.startPeriod) <= Math.min(o.endPeriod, payload.endPeriod)
      );
    });

    return {
      hasConflict: conflicts.length > 0,
      conflictCount: conflicts.length,
      conflicts,
    };
  },

  getMySchedule(studentId: string, semester?: string): ApiScheduleResponse {
    const userEnrollments = db.enrollments.filter((e) => matchStudentId(e.studentId, studentId));
    const enrolledOfferingIds = new Set(userEnrollments.map((e) => e.offeringId));

    const enrolledOfferings = db.offerings.filter((o) => {
      if (enrolledOfferingIds.has(o.id)) return true;
      if (o.teacherId === studentId || (studentId === "T001" && o.teacherId === "T1001")) return true;
      return false;
    });

    const items: ApiScheduleItem[] = enrolledOfferings.map((o) => {
      const enr = userEnrollments.find((e) => e.offeringId === o.id);
      return {
        enrollmentId: enr ? enr.id : `tch_${o.id}`,
        status: "ACTIVE",
        offeringId: o.id,
        courseId: o.courseId,
        courseName: o.courseName,
        courseCode: o.courseCode,
        teacherName: o.teacherName,
        classroom: o.classroom,
        dayOfWeek: o.dayOfWeek,
        startPeriod: o.startPeriod,
        endPeriod: o.endPeriod,
        credits: o.credits,
        currentCapacity: o.currentCapacity,
        maxCapacity: o.maxCapacity,
      };
    });

    const matrix: (ApiScheduleItem | null)[][] = Array.from({ length: 7 }, () =>
      Array.from({ length: 12 }, () => null)
    );

    for (const it of items) {
      const dayIdx = it.dayOfWeek - 1;
      if (dayIdx >= 0 && dayIdx < 7) {
        const row = matrix[dayIdx];
        if (row) {
          for (let p = it.startPeriod; p <= it.endPeriod; p++) {
            if (p >= 1 && p <= 12) {
              row[p - 1] = it;
            }
          }
        }
      }
    }

    const totalCredits = items.reduce((acc, it) => acc + it.credits, 0);

    return {
      studentId,
      semester: semester || "2026-秋季",
      totalCredits,
      enrolledCount: items.length,
      scheduleMatrix: matrix,
      items,
    };
  },

  enroll(studentId: string, offeringId: string) {
    const offering = db.offerings.find((o) => o.id === offeringId);
    if (!offering) {
      throw new Error("课程教学班不存在");
    }

    const alreadyEnrolled = db.enrollments.some(
      (e) => e.studentId === studentId && e.offeringId === offeringId
    );
    if (alreadyEnrolled) {
      throw new Error("您已选修该课程，请勿重复选修");
    }

    if (offering.currentCapacity >= offering.maxCapacity) {
      throw new Error("该课程选课容量已满，无法加选");
    }

    const userOfferingIds = new Set(
      db.enrollments.filter((e) => e.studentId === studentId).map((e) => e.offeringId)
    );
    const userOfferings = db.offerings.filter((o) => userOfferingIds.has(o.id));

    for (const existing of userOfferings) {
      if (existing.dayOfWeek === offering.dayOfWeek) {
        const overlap =
          Math.max(existing.startPeriod, offering.startPeriod) <=
          Math.min(existing.endPeriod, offering.endPeriod);
        if (overlap) {
          throw new Error(
            `排课时间冲突：与已选课程【${existing.courseName}】在周${offering.dayOfWeek}第${existing.startPeriod}-${existing.endPeriod}节重叠`
          );
        }
      }
    }

    offering.currentCapacity += 1;
    const enrollmentId = `enr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    db.enrollments.push({
      id: enrollmentId,
      studentId,
      offeringId,
      enrolledAt: Date.now(),
      score: 85 + Math.floor(Math.random() * 12),
      gradePoint: 3.5 + Math.round(Math.random() * 8) / 10,
    });

    saveStoredData(db);

    return {
      success: true as const,
      enrollmentId,
      message: `【${offering.courseName}】选课成功！已自动排入个人课表。`,
    };
  },

  drop(studentId: string, offeringId: string) {
    const offering = db.offerings.find((o) => o.id === offeringId);
    const index = db.enrollments.findIndex(
      (e) => e.studentId === studentId && e.offeringId === offeringId
    );

    if (index === -1) {
      throw new Error("未找到该课程的选课记录，退选失败");
    }

    db.enrollments.splice(index, 1);
    if (offering && offering.currentCapacity > 0) {
      offering.currentCapacity -= 1;
    }

    saveStoredData(db);

    return {
      success: true as const,
      message: `已成功退选【${offering ? offering.courseName : "该课程"}】`,
    };
  },

  getMyGrades(studentId: string, semester?: string): ApiGradeResponse {
    const userEnrs = db.enrollments.filter((e) => matchStudentId(e.studentId, studentId));
    const gradesList: ApiGradeItem[] = [];

    let totalPoints = 0;
    let earnedCredits = 0;
    let attemptedCredits = 0;

    for (const enr of userEnrs) {
      const off = db.offerings.find((o) => o.id === enr.offeringId);
      if (!off) continue;

      attemptedCredits += off.credits;
      const score = enr.score ?? 88;
      const gp = enr.gradePoint ?? 3.8;
      const isPassed = score >= 60;
      if (isPassed) {
        earnedCredits += off.credits;
        totalPoints += gp * off.credits;
      }

      let letter = "B";
      if (score >= 90) letter = "A";
      else if (score >= 85) letter = "A-";
      else if (score >= 80) letter = "B+";
      else if (score >= 75) letter = "B";
      else if (score >= 70) letter = "B-";
      else if (score >= 60) letter = "C";
      else letter = "F";

      gradesList.push({
        id: `grd_${enr.id}`,
        enrollmentId: enr.id,
        courseCode: off.courseCode,
        courseName: off.courseName,
        credits: off.credits,
        teacherName: off.teacherName,
        score,
        gradePoint: gp,
        gradeLetter: letter,
        isPassed,
        evaluatedAt: new Date(enr.enrolledAt).toLocaleDateString("zh-CN"),
      });
    }

    const gpa = attemptedCredits > 0 ? Number((totalPoints / attemptedCredits).toFixed(2)) : 0.0;

    return {
      studentId,
      semester: semester || "2026-秋季",
      gpa,
      earnedCredits,
      attemptedCredits,
      grades: gradesList,
    };
  },

  getStats(): ApiStatsResponse {
    const totalCourses = db.courses.length;
    const totalOfferings = db.offerings.length;
    const totalCapacity = db.offerings.reduce((acc, o) => acc + o.maxCapacity, 0);
    const currentEnrolled = db.offerings.reduce((acc, o) => acc + o.currentCapacity, 0);
    const overallFillRate =
      totalCapacity > 0 ? Number(((currentEnrolled / totalCapacity) * 100).toFixed(1)) : 0;

    const deptMap = new Map<string, { courses: number; offerings: number; enrollments: number }>();
    for (const c of db.courses) {
      const d = deptMap.get(c.department) || { courses: 0, offerings: 0, enrollments: 0 };
      d.courses += 1;
      deptMap.set(c.department, d);
    }
    for (const o of db.offerings) {
      const d = deptMap.get(o.department) || { courses: 0, offerings: 0, enrollments: 0 };
      d.offerings += 1;
      d.enrollments += o.currentCapacity;
      deptMap.set(o.department, d);
    }

    const departmentStats = Array.from(deptMap.entries()).map(([department, s]) => ({
      department,
      courseCount: s.courses,
      offeringCount: s.offerings,
      enrollmentCount: s.enrollments,
    }));

    return {
      totalCourses,
      totalOfferings,
      totalEnrollments: currentEnrolled,
      totalCapacity,
      overallFillRate,
      departmentStats,
    };
  },
};
