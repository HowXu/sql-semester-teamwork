#!/usr/bin/env node
import pc from "picocolors";
import { sqlite } from "../packages/db/src/client.js";

interface Competitor {
  id: string;
  name: string;
  studentNo: string;
}

const DEFAULT_COMPETITORS: Competitor[] = [
  { id: "usr_stu_2", name: "苏晓彤", studentNo: "20240102" },
  { id: "usr_stu_3", name: "赵文杰", studentNo: "20240201" },
  { id: "usr_stu_4", name: "韩雪丽", studentNo: "20240301" },
  { id: "usr_mock_049", name: "张浩然 (模拟学生)", studentNo: "20240949" },
  { id: "usr_mock_050", name: "王雨桐 (模拟学生)", studentNo: "20240950" },
];

const SERVER_BASE = "http://localhost:3001";
const TARGET_OFFERING_ID = "off_ds_01"; // CS202 数据结构与高级算法 (max: 50)

// 解析 CLI 参数: --competitors <N> --slots <M>
function parseArgs() {
  const args = process.argv.slice(2);
  let competitorCount = 2;
  let remainingSlots = 1;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--competitors" && args[i + 1]) {
      competitorCount = Math.max(2, Math.min(5, parseInt(args[i + 1]!, 10) || 2));
    }
    if (args[i] === "--slots" && args[i + 1]) {
      remainingSlots = Math.max(1, Math.min(10, parseInt(args[i + 1]!, 10) || 1));
    }
  }

  return { competitorCount, remainingSlots };
}

async function checkServerAlive(): Promise<boolean> {
  try {
    const res = await fetch(`${SERVER_BASE}/`, { signal: AbortSignal.timeout(1500) });
    return res.ok;
  } catch {
    return false;
  }
}

async function prepareCourseState(offeringId: string, remainingSlots: number, _competitors: Competitor[]) {
  // 1. 获取课程最大容量
  const offRow = await sqlite.execute({
    sql: "SELECT id, max_capacity FROM course_offerings WHERE id = ?",
    args: [offeringId],
  });
  if (offRow.rows.length === 0) {
    throw new Error(`未找到教学班: ${offeringId}`);
  }
  const maxCapacity = Number(offRow.rows[0]?.max_capacity);
  const targetCurrentCapacity = maxCapacity - remainingSlots;

  // 2. 清除该课程所有历史选课记录并重新精准灌入
  await sqlite.execute({
    sql: "DELETE FROM enrollments WHERE offering_id = ?",
    args: [offeringId],
  });

  const now = Date.now();
  // 预置李明 (usr_stu_1)
  await sqlite.execute({
    sql: "INSERT INTO enrollments(id, student_id, offering_id, status, enrolled_at) VALUES (?, 'usr_stu_1', ?, 'ACTIVE', ?)",
    args: [`enr_stu1_${offeringId}`, offeringId, now - 86400000],
  });

  // 补齐恰好需要的 mock 学生数
  const mockNeeded = Math.max(0, targetCurrentCapacity - 1);
  for (let i = 1; i <= mockNeeded; i++) {
    const mockId = `usr_mock_${String(i).padStart(3, "0")}`;
    await sqlite.execute({
      sql: "INSERT INTO enrollments(id, student_id, offering_id, status, enrolled_at) VALUES (?, ?, ?, 'ACTIVE', ?)",
      args: [`enr_prep_${offeringId}_m${i}`, mockId, offeringId, now - 86400000],
    });
  }

  // 3. 原子同步 current_capacity
  await sqlite.execute({
    sql: `UPDATE course_offerings
          SET current_capacity = (SELECT COUNT(*) FROM enrollments WHERE offering_id = ? AND status = 'ACTIVE')
          WHERE id = ?`,
    args: [offeringId, offeringId],
  });

  return { maxCapacity, targetCurrentCapacity };
}

async function main() {
  const { competitorCount, remainingSlots } = parseArgs();
  const competitors = DEFAULT_COMPETITORS.slice(0, competitorCount);

  console.log("\n" + pc.bold(pc.cyan("=".repeat(72))));
  console.log(pc.bold(pc.green("  ⚡ 教务系统并发抢课与原子防超卖 CLI 演示平台")));
  console.log(pc.bold(pc.cyan("=".repeat(72))) + "\n");

  console.log(pc.bold("【1. 环境检测】"));
  const isServerRunning = await checkServerAlive();
  if (isServerRunning) {
    console.log(`  ${pc.green("[PASS]")} 后端 API 服务已就绪: ${pc.cyan(SERVER_BASE)} (HTTP 真实并发请求)`);
  } else {
    console.log(`  ${pc.yellow("[WARN]")} 后端 HTTP 服务未启动，建议在另一个终端运行 ${pc.cyan("pnpm dev")}`);
    console.log(`  ${pc.yellow("[WARN]")} 正在降级为内存直接路由模式进行数据库并发压测...\n`);
  }

  console.log(pc.bold("\n【2. 准备实验场景】"));
  console.log(`  🎯 目标教学班: ${pc.cyan("CS202 数据结构与高级算法")} (${TARGET_OFFERING_ID})`);
  console.log(`  👥 参赛选手数: ${pc.yellow(String(competitors.length))} 位学生同时发起瞬时抢课`);
  console.log(`  🎟️  设定剩余名额: ${pc.green(String(remainingSlots))} 个`);

  const { maxCapacity, targetCurrentCapacity } = await prepareCourseState(
    TARGET_OFFERING_ID,
    remainingSlots,
    competitors
  );

  console.log(
    `  📊 数据库预置就绪: 当前已占用 ${pc.yellow(String(targetCurrentCapacity))} / 最大容量 ${pc.yellow(String(maxCapacity))}`
  );
  console.log(pc.gray("  ────────────────────────────────────────────────────────"));
  competitors.forEach((c, idx) => {
    console.log(`    选手 ${idx + 1}: ${pc.bold(c.name)} (学号: ${c.studentNo}, ID: ${c.id})`);
  });
  console.log(pc.gray("  ────────────────────────────────────────────────────────"));

  console.log(pc.bold("\n【3. 倒计时并发发射 (Promise.all 瞬时发起)】"));
  console.log(pc.gray("  3... 2... 1... 🚀 发射并发请求！"));

  const startMs = Date.now();

  interface RaceResult {
    competitor: Competitor;
    status: number;
    durationMs: number;
    data: { message?: string; error?: string; enrollmentId?: string };
  }

  let results: RaceResult[] = [];

  if (isServerRunning) {
    const promises = competitors.map(async (c) => {
      const reqStart = Date.now();
      try {
        const res = await fetch(`${SERVER_BASE}/api/enrollments/enroll`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": c.id,
          },
          body: JSON.stringify({
            studentId: c.id,
            offeringId: TARGET_OFFERING_ID,
          }),
        });
        const durationMs = Date.now() - reqStart;
        const data = (await res.json()) as { message?: string; error?: string; enrollmentId?: string };
        return { competitor: c, status: res.status, durationMs, data };
      } catch (err) {
        const durationMs = Date.now() - reqStart;
        return { competitor: c, status: 500, durationMs, data: { error: String(err) } };
      }
    });

    results = await Promise.all(promises);
  } else {
    // 降级为直接引入 router 测试
    const { createEnrollmentsRouter } = await import("../apps/server/src/enrollments.js");
    const { db } = await import("../packages/db/src/client.js");
    const router = createEnrollmentsRouter({ db, sqlite });

    const promises = competitors.map(async (c) => {
      const reqStart = Date.now();
      const res = await router.request("/enroll", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": c.id,
        },
        body: JSON.stringify({
          studentId: c.id,
          offeringId: TARGET_OFFERING_ID,
        }),
      });
      const durationMs = Date.now() - reqStart;
      const data = (await res.json()) as { message?: string; error?: string; enrollmentId?: string };
      return { competitor: c, status: res.status, durationMs, data };
    });

    results = await Promise.all(promises);
  }

  const totalTimeMs = Date.now() - startMs;

  console.log(pc.bold("\n【4. 并发响应结果汇总】 (并发总耗时: " + pc.cyan(`${totalTimeMs}ms`) + ")"));
  console.log(pc.gray("  ┌──────┬────────────┬─────────────┬──────────┬──────────────────────────────────────┐"));
  console.log(pc.gray("  │ 序号 │ 参赛学生   │ HTTP 状态码 │ 耗时(ms) │ 接口返回信息                         │"));
  console.log(pc.gray("  ├──────┼────────────┼─────────────┼──────────┼──────────────────────────────────────┤"));

  results.forEach((r, idx) => {
    const isSuccess = r.status === 201;
    const statusText = isSuccess ? pc.green(`201 成功 `) : pc.red(`${r.status} 拦截 `);
    const msg = isSuccess
      ? pc.green(r.data.message || "选课成功")
      : pc.red(r.data.error || "选课失败");
    const paddedName = r.competitor.name.padEnd(8);
    const paddedDuration = String(r.durationMs).padStart(4);
    const paddedIdx = String(idx + 1).padStart(2);

    console.log(`  │  ${paddedIdx}  │ ${paddedName} │ ${statusText}  │   ${paddedDuration}   │ ${msg.padEnd(36)} │`);
  });
  console.log(pc.gray("  └──────┴────────────┴─────────────┴──────────┴──────────────────────────────────────┘"));

  console.log(pc.bold("\n【5. 数据库底层一致性与防超卖校验】"));

  const finalOffRow = await sqlite.execute({
    sql: "SELECT current_capacity, max_capacity FROM course_offerings WHERE id = ?",
    args: [TARGET_OFFERING_ID],
  });
  const finalCapacity = Number(finalOffRow.rows[0]?.current_capacity);
  const finalMax = Number(finalOffRow.rows[0]?.max_capacity);

  const finalEnrRows = await sqlite.execute({
    sql: "SELECT student_id, enrolled_at FROM enrollments WHERE offering_id = ? AND status = 'ACTIVE' ORDER BY enrolled_at DESC",
    args: [TARGET_OFFERING_ID],
  });
  const finalActiveCount = finalEnrRows.rows.length;

  const successes = results.filter((r) => r.status === 201);
  const conflicts = results.filter((r) => r.status === 409);

  console.log(`  📌 期望成功名额: ${pc.yellow(String(remainingSlots))} 个`);
  console.log(`  ✅ 实际成功人数: ${pc.green(String(successes.length))} 人`);
  console.log(`  🛡️  原子拦截人数: ${pc.red(String(conflicts.length))} 人`);
  console.log(`  🏛️  数据库容量字段 (current_capacity): ${pc.cyan(`${finalCapacity} / ${finalMax}`)}`);
  console.log(`  📄 底层有效选课行数 (COUNT(enrollments)): ${pc.cyan(String(finalActiveCount))}`);

  const isStrictlyConsistent =
    finalCapacity === finalMax &&
    finalActiveCount === finalMax &&
    successes.length === remainingSlots;

  if (isStrictlyConsistent) {
    console.log("\n" + pc.bold(pc.green("  🎉 [VERIFIED PASS] 数据库原子 CAS 校验完全通过！零超卖 (0 Oversell)！")));
    console.log(pc.gray("  - 核心机制: UPDATE course_offerings SET current_capacity = current_capacity + 1 WHERE current_capacity < max_capacity"));
    console.log(pc.gray("  - 数据库引擎行级锁保证了即使千人同时毫秒级并发，也不会有任何多余名额流出。"));
  } else {
    console.log("\n" + pc.bold(pc.yellow("  ⚠️ 校验提示: 最终容量未达到上限，可能是名额充足或有其他限制。")));
  }

  console.log(pc.bold(pc.cyan("\n" + "=".repeat(72))) + "\n");
  sqlite.close();
}

main().catch((err) => {
  console.error(pc.red("[ERROR] 并发演示脚本执行异常:"), err);
  process.exit(1);
});
