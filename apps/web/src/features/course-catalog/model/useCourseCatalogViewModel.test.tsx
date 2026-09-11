import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useCourseCatalogViewModel } from "./useCourseCatalogViewModel";
import { createTestQueryClient } from "@/test-helpers/testQueryClient";
import { TEST_OFFERINGS } from "@/test-helpers/testSeed";
import type { ApiOffering } from "@/shared/api/client";

type OfferingsCache = { offerings: ApiOffering[] };

const mockEnroll = vi.fn();
const mockDrop = vi.fn();
const mockGetOfferings = vi.fn();
const mockGetMySchedule = vi.fn();

vi.mock("@/shared/api/client", () => ({
  api: {
    enroll: (...args: unknown[]) => mockEnroll(...args),
    drop: (...args: unknown[]) => mockDrop(...args),
    getOfferings: (...args: unknown[]) => mockGetOfferings(...args),
    getMySchedule: (...args: unknown[]) => mockGetMySchedule(...args),
  },
}));

const DEFAULT_USER = {
  id: "usr_stu_1",
  name: "测试学生",
  role: "student" as const,
  department: "测试",
  studentId: "20240101",
};

vi.mock("@/shared/stores/useUserStore", () => ({
  useUserStore: Object.assign(
    () => ({ currentUser: DEFAULT_USER }),
    {
      getState: () => ({ currentUser: DEFAULT_USER }),
      setState: vi.fn(),
    }
  ),
}));

function makeWrapper(client: ReturnType<typeof createTestQueryClient>) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

function seedCache(client: ReturnType<typeof createTestQueryClient>) {
  client.setQueryData<OfferingsCache>(["offerings"], { offerings: TEST_OFFERINGS });
  client.setQueryData(["my-schedule", "20240101"], { items: [] });
}

describe("useCourseCatalogViewModel", () => {
  beforeEach(() => {
    mockEnroll.mockReset();
    mockDrop.mockReset();
    mockGetOfferings.mockReset();
    mockGetMySchedule.mockReset();
    mockGetOfferings.mockResolvedValue({ offerings: TEST_OFFERINGS });
    mockGetMySchedule.mockResolvedValue({ items: [] });
  });

  it("enroll updates offerings cache by +1 (no +2 drift)", async () => {
    mockEnroll.mockResolvedValue({
      success: true,
      enrollmentId: "enr_x",
      message: "ok",
      courseName: "测试课程 1",
      credits: 3,
    });

    const client = createTestQueryClient();
    seedCache(client);

    const { result } = renderHook(() => useCourseCatalogViewModel(), {
      wrapper: makeWrapper(client),
    });

    const target = TEST_OFFERINGS[0]!;
    const beforeCapacity = target.currentCapacity;

    act(() => {
      result.current.actions.enrollCourse(target);
    });

    await waitFor(() => {
      expect(mockEnroll).toHaveBeenCalledWith("20240101", target.id);
    });

    await waitFor(() => {
      const cache = client.getQueryData<OfferingsCache>(["offerings"]);
      const updated = cache?.offerings.find((o) => o.id === target.id);
      expect(updated?.currentCapacity).toBe(beforeCapacity + 1);
    });

    const final = client
      .getQueryData<OfferingsCache>(["offerings"])
      ?.offerings.find((o) => o.id === target.id);
    expect(final?.currentCapacity).toBe(beforeCapacity + 1);
  });

  it("enroll failure rolls back offerings cache to previous value", async () => {
    mockEnroll.mockRejectedValue(new Error("超卖"));

    const client = createTestQueryClient();
    seedCache(client);

    const { result } = renderHook(() => useCourseCatalogViewModel(), {
      wrapper: makeWrapper(client),
    });

    const target = TEST_OFFERINGS[0]!;
    const before = target.currentCapacity;

    act(() => {
      result.current.actions.enrollCourse(target);
    });

    await waitFor(() => {
      const updated = client
        .getQueryData<OfferingsCache>(["offerings"])
        ?.offerings.find((o) => o.id === target.id);
      expect(updated?.currentCapacity).toBe(before);
    });
  });

  it("drop updates offerings cache by -1 (no -2 drift)", async () => {
    mockDrop.mockResolvedValue({ success: true, message: "退课成功" });

    const client = createTestQueryClient();
    seedCache(client);

    const { result } = renderHook(() => useCourseCatalogViewModel(), {
      wrapper: makeWrapper(client),
    });

    const target = TEST_OFFERINGS[0]!;
    const before = target.currentCapacity;

    act(() => {
      result.current.actions.dropCourse(target);
    });

    await waitFor(() => {
      const updated = client
        .getQueryData<OfferingsCache>(["offerings"])
        ?.offerings.find((o) => o.id === target.id);
      expect(updated?.currentCapacity).toBe(before - 1);
    });
  });

  it("drop failure rolls back offerings cache to previous value", async () => {
    mockDrop.mockRejectedValue(new Error("未找到选课记录"));

    const client = createTestQueryClient();
    seedCache(client);

    const { result } = renderHook(() => useCourseCatalogViewModel(), {
      wrapper: makeWrapper(client),
    });

    const target = TEST_OFFERINGS[0]!;
    const before = target.currentCapacity;

    act(() => {
      result.current.actions.dropCourse(target);
    });

    await waitFor(() => {
      const updated = client
        .getQueryData<OfferingsCache>(["offerings"])
        ?.offerings.find((o) => o.id === target.id);
      expect(updated?.currentCapacity).toBe(before);
    });
  });

  it("oversell 409 response does not mutate cache", async () => {
    mockEnroll.mockRejectedValue(new Error("手慢了！该教学班选课名额已满，请选择其他班次。"));

    const client = createTestQueryClient();
    seedCache(client);

    const { result } = renderHook(() => useCourseCatalogViewModel(), {
      wrapper: makeWrapper(client),
    });

    const target = TEST_OFFERINGS[0]!;
    const beforeCapacity = target.currentCapacity;

    act(() => {
      result.current.actions.enrollCourse(target);
    });

    await waitFor(() => {
      expect(mockEnroll).toHaveBeenCalled();
    });

    await new Promise((r) => setTimeout(r, 50));

    const after = client
      .getQueryData<OfferingsCache>(["offerings"])
      ?.offerings.find((o) => o.id === target.id);
    expect(after?.currentCapacity).toBe(beforeCapacity);
  });

  it("duplicate enroll 400 response does not mutate cache", async () => {
    mockEnroll.mockRejectedValue(new Error("您已选修了该教学班，无需重复选课"));

    const client = createTestQueryClient();
    seedCache(client);

    const { result } = renderHook(() => useCourseCatalogViewModel(), {
      wrapper: makeWrapper(client),
    });

    const target = TEST_OFFERINGS[0]!;
    const before = target.currentCapacity;

    act(() => {
      result.current.actions.enrollCourse(target);
    });

    await waitFor(() => {
      expect(mockEnroll).toHaveBeenCalled();
    });

    await new Promise((r) => setTimeout(r, 50));

    const after = client
      .getQueryData<OfferingsCache>(["offerings"])
      ?.offerings.find((o) => o.id === target.id);
    expect(after?.currentCapacity).toBe(before);
  });
});
