import { describe, it, expect, beforeAll, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useCourseCatalogViewModel } from "./model/useCourseCatalogViewModel";
import { createTestQueryClient } from "@/test-helpers/testQueryClient";
import type { ApiOffering } from "@/shared/api/client";

const SERVER_BASE = "http://localhost:3001";
const SKIP = process.env["SKIP_INTEGRATION"] === "1";
const describeIf = SKIP ? describe.skip : describe;

type OfferingsCache = { offerings: ApiOffering[] };

// jsdom 25 + vitest 的 fetch 与 jsdom AbortController 的 signal 不兼容
// ("RequestInit: Expected signal ... to be an instance of AbortSignal")
// 在调用前剥离 signal,保留原生 fetch 的其他能力;超时保护由 waitFor 的 timeout 提供
const originalFetch = globalThis.fetch;
const jsdomFetchShim: typeof fetch = ((input, init) => {
  if (init && "signal" in init) {
    const { signal: _signal, ...rest } = init;
    return originalFetch(input, rest as RequestInit);
  }
  return originalFetch(input, init);
}) as typeof fetch;

// 可变 user store mock:测试间切换 currentUser.studentId,view model 读 studentId 决定 enroll/drop 的 studentId
type UserShape = {
  id: string;
  name: string;
  role: "student";
  department: string;
  studentId: string;
};
const userRef: { current: UserShape } = {
  current: {
    id: "usr_stu_2",
    name: "苏晓彤",
    role: "student",
    department: "计算机科学与技术学院",
    studentId: "20240102",
  },
};

vi.mock("@/shared/stores/useUserStore", () => ({
  useUserStore: Object.assign(
    () => ({ currentUser: userRef.current }),
    {
      getState: () => ({ currentUser: userRef.current }),
      setState: vi.fn(),
    }
  ),
}));

async function getServerOffering(id: string): Promise<{ currentCapacity: number; maxCapacity: number }> {
  const res = await fetch(`${SERVER_BASE}/api/offerings`);
  const list = (await res.json()) as Array<{
    id: string;
    currentCapacity: number;
    maxCapacity: number;
  }>;
  const found = list.find((o) => o.id === id);
  if (!found) throw new Error(`offering ${id} not found`);
  return { currentCapacity: found.currentCapacity, maxCapacity: found.maxCapacity };
}

describeIf("useCourseCatalogViewModel integration with dev:server", () => {
  beforeAll(async () => {
    // 注入 fetch shim:jsdom 25 的 fetch 与 jsdom AbortController 的 signal 不兼容
    globalThis.fetch = jsdomFetchShim;
    try {
      const r = await fetch(`${SERVER_BASE}/`);
      if (!r.ok) throw new Error("server not ok");
    } catch (err) {
      throw new Error(
        `dev:server 未启动或不可达: ${(err as Error).message}。运行 \`pnpm dev:server\` 或设置 SKIP_INTEGRATION=1 跳过。`
      );
    }
  });

  it("real enroll: UI cache and server DB converge to the same +1", async () => {
    // off_web_01 seed: currentCapacity=18, maxCapacity=40;选 usr_stu_2(clean slate,seed 未预选)
    userRef.current = {
      id: "usr_stu_2",
      name: "苏晓彤",
      role: "student",
      department: "计算机科学与技术学院",
      studentId: "20240102",
    };
    const before = await getServerOffering("off_web_01");

    const client = createTestQueryClient();
    // 不预置 cache,让 hook 走真实 fetch
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useCourseCatalogViewModel(), { wrapper });

    await waitFor(() => {
      expect(result.current.state.totalCount).toBeGreaterThan(0);
    });

    // 通过 hook 调用 enroll(实际是真实网络)
    const offerings = client.getQueryData<OfferingsCache>(["offerings"]);
    const target = offerings?.offerings.find((o) => o.id === "off_web_01");
    if (!target) throw new Error("off_web_01 not in cache");

    await act(async () => {
      result.current.actions.enrollCourse(target);
    });

    // 等 mutation 完成
    await waitFor(() => {
      expect(result.current.state.notification?.type).toBe("success");
    });

    // 验证:cache 中 off_web_01 的 capacity +1
    const afterCache = client
      .getQueryData<OfferingsCache>(["offerings"])
      ?.offerings.find((o) => o.id === "off_web_01");
    expect(afterCache?.currentCapacity).toBe(before.currentCapacity + 1);

    // 验证:server 端 off_web_01 的 currentCapacity 也是 +1
    const afterServer = await getServerOffering("off_web_01");
    expect(afterServer.currentCapacity).toBe(before.currentCapacity + 1);
  });

  it("real drop: UI cache and server DB converge to the same -1", async () => {
    // 用 usr_stu_3 而非 usr_stu_2:测试 1 已将 usr_stu_2 选入 off_web_01。
    // server 用 partial unique index WHERE status='ACTIVE',同学生 drop 后再选同一门课允许通过。
    userRef.current = {
      id: "usr_stu_3",
      name: "赵文杰",
      role: "student",
      department: "软件工程学院",
      studentId: "20240201",
    };
    const before = await getServerOffering("off_web_01");
    const initialCapacity = before.currentCapacity;

    const client = createTestQueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useCourseCatalogViewModel(), { wrapper });

    await waitFor(() => {
      expect(result.current.state.totalCount).toBeGreaterThan(0);
    });

    // enroll usr_stu_3(clean slate:seed 未预选,且不在测试 1 触及集合内)
    const enrollTarget = client
      .getQueryData<OfferingsCache>(["offerings"])
      ?.offerings.find((o) => o.id === "off_web_01");
    if (!enrollTarget) throw new Error("off_web_01 not in cache");
    await act(async () => {
      result.current.actions.enrollCourse(enrollTarget);
    });
    await waitFor(() => {
      expect(result.current.state.notification?.type).toBe("success");
    });

    const afterEnrollServer = await getServerOffering("off_web_01");
    expect(afterEnrollServer.currentCapacity).toBe(initialCapacity + 1);

    // drop
    const dropTarget = client
      .getQueryData<OfferingsCache>(["offerings"])
      ?.offerings.find((o) => o.id === "off_web_01");
    if (!dropTarget) throw new Error("off_web_01 not in cache after enroll");
    await act(async () => {
      result.current.actions.dropCourse(dropTarget);
    });
    await waitFor(() => {
      const updated = client
        .getQueryData<OfferingsCache>(["offerings"])
        ?.offerings.find((o) => o.id === "off_web_01");
      expect(updated?.currentCapacity).toBe(afterEnrollServer.currentCapacity - 1);
    });

    const afterDropServer = await getServerOffering("off_web_01");
    expect(afterDropServer.currentCapacity).toBe(afterEnrollServer.currentCapacity - 1);
  });

  it("4 concurrent enrolls on off_web_01: success count matches server capacity delta, no oversell", async () => {
    // 验证并发场景下:server current_capacity 增量严格等于成功数,且不超过 max_capacity
    // 注:测试 1 留下 usr_stu_2 ACTIVE,测试 2 留下 usr_stu_3 DROPPED。
    //   期望:usr_stu_1 / usr_stu_4 → 201 成功;usr_stu_2 → 400 重复(ACTIVE);
    //        usr_stu_3 → 500 UNIQUE(DROPPED 行阻塞新 INSERT,capacity 被回滚)。
    //   断言:successes_count === capacity_delta,无论个别请求成功或失败。
    const before = await getServerOffering("off_web_01");

    const client = createTestQueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useCourseCatalogViewModel(), { wrapper });

    await waitFor(() => {
      expect(result.current.state.totalCount).toBeGreaterThan(0);
    });

    const studentIds = ["usr_stu_1", "usr_stu_2", "usr_stu_3", "usr_stu_4"];

    // 直接发起 4 个并发 enroll(不走 hook,因为 hook 单次只能触发一个 mutation)
    const promises = studentIds.map((studentId) =>
      fetch(`${SERVER_BASE}/api/enrollments/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": studentId },
        body: JSON.stringify({ studentId, offeringId: "off_web_01" }),
      }).then(async (r) => ({ status: r.status, body: await r.json() }))
    );
    const results = await Promise.all(promises);

    const successes = results.filter((r) => r.status === 201);
    const afterServer = await getServerOffering("off_web_01");

    // server 端:current_capacity 增量严格等于成功数(原子保护,无超卖)
    expect(afterServer.currentCapacity).toBe(before.currentCapacity + successes.length);

    // 关键:没有超卖;current_capacity ≤ max_capacity
    expect(afterServer.currentCapacity).toBeLessThanOrEqual(afterServer.maxCapacity);
  });
});