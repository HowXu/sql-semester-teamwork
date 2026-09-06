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

const getApiBase = () => {
  if (typeof window !== "undefined") {
    // If in Vite dev server, use empty string so Vite proxy forwards to :3000
    if (window.location.port === "5173") return "";
    // If in Tauri or standalone build, target localhost:3000
    return "http://127.0.0.1:3000";
  }
  return "http://127.0.0.1:3000";
};

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const base = getApiBase();
  const res = await fetch(`${base}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  const data = await res.json();
  if (!res.ok || (data && data.success === false)) {
    const errorMsg = data?.error || `HTTP 错误 ${res.status}: ${res.statusText}`;
    throw new Error(errorMsg);
  }
  return data as T;
}

export const api = {
  getCourses: async (q?: string, department?: string) => {
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (department) params.set("department", department);
      const query = params.toString();
      return await request<{ courses: ApiCourse[] }>(`/api/courses${query ? `?${query}` : ""}`);
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
      return await request<{ offerings: ApiOffering[] }>(`/api/offerings${query ? `?${query}` : ""}`);
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
      return await request<ApiScheduleResponse>(`/api/enrollments/my-schedule?${params.toString()}`);
    } catch {
      return offlineDataEngine.getMySchedule(studentId, semester);
    }
  },

  enroll: async (studentId: string, offeringId: string) => {
    try {
      return await request<{ success: true; enrollmentId: string; message: string }>(
        "/api/enrollments/enroll",
        {
          method: "POST",
          body: JSON.stringify({ studentId, offeringId }),
        }
      );
    } catch {
      return offlineDataEngine.enroll(studentId, offeringId);
    }
  },

  drop: async (studentId: string, offeringId: string) => {
    try {
      return await request<{ success: true; message: string }>("/api/enrollments/drop", {
        method: "POST",
        body: JSON.stringify({ studentId, offeringId }),
      });
    } catch {
      return offlineDataEngine.drop(studentId, offeringId);
    }
  },

  getMyGrades: async (studentId: string, semester?: string) => {
    try {
      const params = new URLSearchParams({ studentId });
      if (semester) params.set("semester", semester);
      return await request<ApiGradeResponse>(`/api/grades/my?${params.toString()}`);
    } catch {
      return offlineDataEngine.getMyGrades(studentId, semester);
    }
  },

  getStats: async () => {
    try {
      return await request<ApiStatsResponse>("/api/stats/overview");
    } catch {
      return offlineDataEngine.getStats();
    }
  },
};
