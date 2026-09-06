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

const API_BASE = "";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
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
  getCourses: (q?: string, department?: string) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (department) params.set("department", department);
    const query = params.toString();
    return request<{ courses: ApiCourse[] }>(`/api/courses${query ? `?${query}` : ""}`);
  },

  getOfferings: (semester?: string, dayOfWeek?: number) => {
    const params = new URLSearchParams();
    if (semester) params.set("semester", semester);
    if (dayOfWeek !== undefined) params.set("dayOfWeek", dayOfWeek.toString());
    const query = params.toString();
    return request<{ offerings: ApiOffering[] }>(`/api/offerings${query ? `?${query}` : ""}`);
  },

  checkConflict: (payload: {
    dayOfWeek: number;
    startPeriod: number;
    endPeriod: number;
    excludeOfferingId?: string;
  }) => {
    return request<{
      hasConflict: boolean;
      conflictCount: number;
      conflicts: ApiOffering[];
    }>("/api/offerings/check-conflict", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  getMySchedule: (studentId: string, semester?: string) => {
    const params = new URLSearchParams({ studentId });
    if (semester) params.set("semester", semester);
    return request<ApiScheduleResponse>(`/api/enrollments/my-schedule?${params.toString()}`);
  },

  enroll: (studentId: string, offeringId: string) => {
    return request<{ success: true; enrollmentId: string; message: string }>(
      "/api/enrollments/enroll",
      {
        method: "POST",
        body: JSON.stringify({ studentId, offeringId }),
      }
    );
  },

  drop: (studentId: string, offeringId: string) => {
    return request<{ success: true; message: string }>("/api/enrollments/drop", {
      method: "POST",
      body: JSON.stringify({ studentId, offeringId }),
    });
  },

  getMyGrades: (studentId: string, semester?: string) => {
    const params = new URLSearchParams({ studentId });
    if (semester) params.set("semester", semester);
    return request<ApiGradeResponse>(`/api/grades/my?${params.toString()}`);
  },

  getStats: () => {
    return request<ApiStatsResponse>("/api/stats/overview");
  },
};
