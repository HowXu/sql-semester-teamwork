export interface ApiCourse {
  id: string;
  code: string;
  name: string;
  department: string;
  credits: number;
  description: string | null;
  prerequisites: string | null;
}

export interface ApiOffering {
  id: string;
  courseId: string;
  teacherId: string;
  semester: string;
  classroom: string;
  dayOfWeek: number;
  startPeriod: number;
  endPeriod: number;
  maxCapacity: number;
  currentCapacity: number;
  courseName: string;
  courseCode: string;
  department: string;
  credits: number;
  teacherName: string;
}

export interface ApiScheduleItem {
  enrollmentId: string;
  status: string;
  offeringId: string;
  courseId: string;
  courseName: string;
  courseCode: string;
  teacherName: string;
  classroom: string;
  dayOfWeek: number;
  startPeriod: number;
  endPeriod: number;
  credits: number;
  currentCapacity: number;
  maxCapacity: number;
}

export interface ApiScheduleResponse {
  studentId: string;
  semester: string;
  totalCredits: number;
  enrolledCount: number;
  scheduleMatrix: (ApiScheduleItem | null)[][];
  items: ApiScheduleItem[];
}

export interface ApiGradeItem {
  id: string;
  enrollmentId: string;
  courseCode: string;
  courseName: string;
  credits: number;
  teacherName: string;
  score: number | null;
  gradePoint: number | null;
  gradeLetter: string | null;
  isPassed: boolean | null;
  evaluatedAt: string | null;
}

export interface ApiGradeResponse {
  studentId: string;
  semester: string;
  gpa: number;
  earnedCredits: number;
  attemptedCredits: number;
  grades: ApiGradeItem[];
}

export interface ApiOfferingStudentGrade {
  enrollmentId: string;
  studentId: string;
  studentNo: string;
  realName: string;
  department: string;
  className: string;
  score: number | null;
  gradePoint: number | null;
  submittedAt: number | null;
}

export interface ApiOfferingRosterResponse {
  offeringId: string;
  courseCode: string;
  courseName: string;
  teacherName: string;
  teacherId: string;
  semester: string;
  students: ApiOfferingStudentGrade[];
}

export interface ApiSubmitGradeResponse {
  message: string;
  score: number;
  gradePoint: number;
}

export interface ApiStatsResponse {
  totalCourses: number;
  totalOfferings: number;
  totalEnrollments: number;
  totalCapacity: number;
  overallFillRate: number;
  departmentStats: {
    department: string;
    courseCount: number;
    offeringCount: number;
    enrollmentCount: number;
  }[];
}

import { offlineDataEngine } from "./offlineDataEngine";
import { useUserStore } from "../stores/useUserStore";

const getApiBase = () => {
  if (typeof window !== "undefined") {
    // If in Vite dev server, use empty string so Vite proxy forwards to :3000
    if (window.location.port === "5173") return "";
    // If in Tauri or standalone build, target localhost:3001
    return "http://127.0.0.1:3001";
  }
  return "http://127.0.0.1:3001";
};

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const base = getApiBase();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  let currentUserId = "usr_stu_1";
  try {
    const user = useUserStore.getState().currentUser;
    if (user?.id) {
      currentUserId =
        user.id === "user-s1" ? "usr_stu_1" :
        user.id === "user-s2" ? "usr_stu_2" :
        user.id === "user-t1" ? "usr_tch_1" :
        user.id === "user-a1" ? "usr_admin_1" : user.id;
    }
  } catch {
    // fallback
  }

  try {
    const res = await fetch(`${base}${path}`, {
      headers: {
        "Content-Type": "application/json",
        "x-user-id": currentUserId,
        ...options?.headers,
      },
      signal: options?.signal || controller.signal,
      ...options,
    });
    clearTimeout(timeoutId);

    const data = await res.json();
    if (!res.ok || (data && data.success === false)) {
      const errorMsg = data?.error || `HTTP 错误 ${res.status}: ${res.statusText}`;
      throw new Error(errorMsg);
    }
    return data as T;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

export const api = {
  getCourses: async (q?: string, department?: string) => {
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (department) params.set("department", department);
      const query = params.toString();
      const raw = await request<unknown>(`/api/courses${query ? `?${query}` : ""}`);
      const list = Array.isArray(raw) ? raw : (raw as { courses?: ApiCourse[] })?.courses || [];
      return { courses: list as ApiCourse[] };
    } catch {
      return offlineDataEngine.getCourses(q, department);
    }
  },

  getOfferings: async (semester?: string, dayOfWeek?: number) => {
    try {
      const params = new URLSearchParams();
      if (semester) params.set("semester", semester);
      if (dayOfWeek !== undefined) params.set("dayOfWeek", dayOfWeek.toString());
      const query = params.toString();
      const raw = await request<unknown>(`/api/offerings${query ? `?${query}` : ""}`);
      const rawList = (Array.isArray(raw) ? raw : (raw as { offerings?: unknown[] })?.offerings || []) as Array<{
        id: string;
        courseId?: string;
        teacherId?: string;
        semester?: string;
        classroom?: string;
        dayOfWeek?: number;
        startPeriod?: number;
        endPeriod?: number;
        maxCapacity?: number;
        currentCapacity?: number;
        courseName?: string;
        courseCode?: string;
        department?: string;
        credits?: number;
        teacherName?: string;
        course?: { id?: string; code?: string; name?: string; credits?: number; department?: string };
        teacher?: { realName?: string };
        timeSlots?: Array<{ dayOfWeek: number; startPeriod: number; endPeriod: number }>;
      }>;

      const offerings: ApiOffering[] = rawList.map((item) => {
        const firstSlot = item.timeSlots?.[0];
        return {
          id: item.id,
          courseId: item.courseId || item.course?.id || "",
          teacherId: item.teacherId || "",
          semester: item.semester || "2026-秋季",
          classroom: item.classroom || "综合教学楼",
          dayOfWeek: item.dayOfWeek ?? firstSlot?.dayOfWeek ?? 1,
          startPeriod: item.startPeriod ?? firstSlot?.startPeriod ?? 1,
          endPeriod: item.endPeriod ?? firstSlot?.endPeriod ?? 2,
          maxCapacity: item.maxCapacity ?? 50,
          currentCapacity: item.currentCapacity ?? 0,
          courseName: item.courseName || item.course?.name || "",
          courseCode: item.courseCode || item.course?.code || "",
          department: item.department || item.course?.department || "计算机科学与技术学院",
          credits: item.credits ?? item.course?.credits ?? 3,
          teacherName: item.teacherName || item.teacher?.realName || "任课教师",
        };
      });
      return { offerings };
    } catch {
      return offlineDataEngine.getOfferings(semester, dayOfWeek);
    }
  },

  checkConflict: async (payload: {
    dayOfWeek: number;
    startPeriod: number;
    endPeriod: number;
    excludeOfferingId?: string;
  }) => {
    try {
      return await request<{
        hasConflict: boolean;
        conflictCount: number;
        conflicts: ApiOffering[];
      }>("/api/offerings/check-conflict", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    } catch {
      return offlineDataEngine.checkConflict(payload);
    }
  },

  getMySchedule: async (studentId: string, semester?: string) => {
    try {
      const params = new URLSearchParams({ studentId });
      if (semester) params.set("semester", semester);
      const raw = await request<unknown>(`/api/enrollments/my-schedule?${params.toString()}`);
      if (Array.isArray(raw)) {
        const rawItems = raw as Array<{
          enrollmentId?: string;
          id?: string;
          offeringId: string;
          courseId: string;
          courseName: string;
          courseCode: string;
          teacherName: string;
          classroom: string;
          dayOfWeek: number;
          startPeriod: number;
          endPeriod: number;
          credits: number;
          currentCapacity?: number;
          maxCapacity?: number;
        }>;

        const items: ApiScheduleItem[] = rawItems.map((it) => ({
          enrollmentId: it.enrollmentId || it.id || "",
          status: "ACTIVE",
          offeringId: it.offeringId,
          courseId: it.courseId,
          courseName: it.courseName,
          courseCode: it.courseCode,
          teacherName: it.teacherName,
          classroom: it.classroom,
          dayOfWeek: it.dayOfWeek,
          startPeriod: it.startPeriod,
          endPeriod: it.endPeriod,
          credits: it.credits,
          currentCapacity: it.currentCapacity ?? 0,
          maxCapacity: it.maxCapacity ?? 0,
        }));

        const matrix: (ApiScheduleItem | null)[][] = Array.from({ length: 7 }, () =>
          Array.from({ length: 12 }, () => null)
        );
        for (const it of items) {
          const d = it.dayOfWeek - 1;
          if (d >= 0 && d < 7) {
            const row = matrix[d];
            if (row) {
              for (let p = it.startPeriod; p <= it.endPeriod; p++) {
                if (p >= 1 && p <= 12) row[p - 1] = it;
              }
            }
          }
        }

        return {
          studentId,
          semester: semester || "2026-秋季",
          totalCredits: items.reduce((acc, cur) => acc + cur.credits, 0),
          enrolledCount: items.length,
          scheduleMatrix: matrix,
          items,
        };
      }
      return raw as ApiScheduleResponse;
    } catch {
      return offlineDataEngine.getMySchedule(studentId, semester);
    }
  },

  enroll: async (studentId: string, offeringId: string) => {
    return await request<{
      success: true;
      enrollmentId: string;
      message: string;
      courseName: string;
      credits: number;
    }>("/api/enrollments/enroll", {
      method: "POST",
      body: JSON.stringify({ studentId, offeringId }),
    });
  },

  drop: async (studentId: string, offeringId: string) => {
    return await request<{ success: true; message: string }>(
      "/api/enrollments/drop",
      {
        method: "POST",
        body: JSON.stringify({ studentId, offeringId }),
      }
    );
  },

  getMyGrades: async (studentId: string, semester?: string) => {
    try {
      const params = new URLSearchParams({ studentId });
      if (semester) params.set("semester", semester);
      const raw = await request<{
        cumulativeGpa?: number;
        gpa?: number;
        totalCreditsEarned?: number;
        earnedCredits?: number;
        totalCreditsEnrolled?: number;
        attemptedCredits?: number;
        grades?: Array<{
          enrollmentId?: string;
          id?: string;
          courseCode: string;
          courseName: string;
          credits: number;
          teacherName: string;
          score: number | null;
          gradePoint: number | null;
        }>;
      }>(`/api/grades/my?${params.toString()}`);

      const rawGrades = raw.grades || [];
      return {
        studentId,
        semester: semester || "2026-秋季",
        gpa: raw.cumulativeGpa ?? raw.gpa ?? 0,
        earnedCredits: raw.totalCreditsEarned ?? raw.earnedCredits ?? 0,
        attemptedCredits: raw.totalCreditsEnrolled ?? raw.attemptedCredits ?? 0,
        grades: rawGrades.map((g) => ({
          id: g.enrollmentId || g.id || "",
          enrollmentId: g.enrollmentId || g.id || "",
          courseCode: g.courseCode,
          courseName: g.courseName,
          credits: g.credits,
          teacherName: g.teacherName,
          score: g.score,
          gradePoint: g.gradePoint,
          gradeLetter:
            g.score !== null
              ? g.score >= 90
                ? "A"
                : g.score >= 80
                  ? "B"
                  : g.score >= 70
                    ? "C"
                    : g.score >= 60
                      ? "D"
                      : "F"
              : null,
          isPassed: g.score !== null ? g.score >= 60 : null,
          evaluatedAt: null,
        })),
      };
    } catch {
      return offlineDataEngine.getMyGrades(studentId, semester);
    }
  },

  getOfferingGrades: async (offeringId: string): Promise<ApiOfferingRosterResponse> => {
    try {
      return await request<ApiOfferingRosterResponse>(`/api/grades/offering/${offeringId}`);
    } catch {
      return offlineDataEngine.getOfferingGrades(offeringId);
    }
  },

  submitGrade: async (params: { enrollmentId: string; score: number }): Promise<ApiSubmitGradeResponse> => {
    try {
      return await request<ApiSubmitGradeResponse>("/api/grades/submit", {
        method: "POST",
        body: JSON.stringify(params),
      });
    } catch {
      return offlineDataEngine.submitGrade(params.enrollmentId, params.score);
    }
  },

  getStats: async () => {
    try {
      const res = await request<{
        totalCourses?: number;
        totalOfferings?: number;
        totalEnrollments?: number;
        totalActiveEnrollments?: number;
        totalCapacity?: number;
        overallFillRate?: number;
        overallEnrollmentRate?: number;
        departmentStats?: Array<{
          department: string;
          courseCount: number;
          offeringCount: number;
          enrollmentCount: number;
        }>;
      }>("/api/stats/overview");

      return {
        totalCourses: res.totalCourses ?? 0,
        totalOfferings: res.totalOfferings ?? 0,
        totalEnrollments: res.totalEnrollments ?? res.totalActiveEnrollments ?? 0,
        totalCapacity: res.totalCapacity ?? 0,
        overallFillRate:
          res.overallFillRate ?? (res.overallEnrollmentRate ? res.overallEnrollmentRate / 100 : 0),
        departmentStats: res.departmentStats ?? [],
      } as ApiStatsResponse;
    } catch {
      return offlineDataEngine.getStats();
    }
  },
};
