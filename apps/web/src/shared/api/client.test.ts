import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockFetch = vi.fn();
globalThis.fetch = mockFetch as unknown as typeof fetch;

import { api } from "./client";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("api client", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("getOfferings fetches /api/offerings and maps response", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        offerings: [
          {
            id: "off_01",
            courseId: "c1",
            teacherId: "t1",
            semester: "2026",
            classroom: "A101",
            dayOfWeek: 1,
            startPeriod: 1,
            endPeriod: 2,
            maxCapacity: 30,
            currentCapacity: 10,
            courseName: "测试",
            courseCode: "T101",
            department: "测试学院",
            credits: 3,
            teacherName: "老师",
          },
        ],
      })
    );

    const result = await api.getOfferings();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url] = mockFetch.mock.calls[0]!;
    expect(String(url)).toContain("/api/offerings");
    expect(result.offerings).toHaveLength(1);
    expect(result.offerings[0]?.id).toBe("off_01");
  });

  it("getMySchedule passes studentId as query string", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse([]));

    await api.getMySchedule("usr_stu_1");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url] = mockFetch.mock.calls[0]!;
    expect(String(url)).toContain("/api/enrollments/my-schedule");
    expect(String(url)).toContain("studentId=usr_stu_1");
  });

  it("enroll POSTs to /api/enrollments/enroll with studentId and offeringId", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        success: true,
        enrollmentId: "enr_x",
        message: "ok",
        courseName: "测试课",
        credits: 3,
      })
    );

    await api.enroll("usr_stu_1", "off_01");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0]!;
    expect(String(url)).toContain("/api/enrollments/enroll");
    expect(init?.method).toBe("POST");
    expect(JSON.parse(init?.body as string)).toEqual({
      studentId: "usr_stu_1",
      offeringId: "off_01",
    });
  });

  it("drop POSTs to /api/enrollments/drop with studentId and offeringId", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ success: true, message: "退课成功" })
    );

    await api.drop("usr_stu_1", "off_01");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0]!;
    expect(String(url)).toContain("/api/enrollments/drop");
    expect(init?.method).toBe("POST");
    expect(JSON.parse(init?.body as string)).toEqual({
      studentId: "usr_stu_1",
      offeringId: "off_01",
    });
  });

  it("throws an Error with server's error message on non-2xx response", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ error: "该教学班不存在" }, 404)
    );

    await expect(api.enroll("usr_stu_1", "off_404")).rejects.toThrow(
      "该教学班不存在"
    );
  });

  it("does NOT fall back to offline engine when network fetch fails", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network down"));

    await expect(api.enroll("usr_stu_1", "off_01")).rejects.toThrow(
      "Network down"
    );

    // 只调用一次 fetch,没有静默回退到 offlineDataEngine
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});