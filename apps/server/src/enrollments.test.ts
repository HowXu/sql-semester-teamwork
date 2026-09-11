import { test, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import type { Hono } from "hono";
import { createTestDb, type TestDb } from "./test-helpers/db.js";
import { seedMinimal, type SeedIds } from "./test-helpers/seed.js";
import { createTestApp } from "./test-helpers/app.js";

let app: Hono;
let testDb: TestDb;
let ids: SeedIds;

beforeEach(async () => {
  testDb = await createTestDb();
  ids = await seedMinimal(testDb);
  app = await createTestApp(testDb);
});

after(async () => {
  testDb.sqlite.close();
});

async function postEnroll(offeringId: string, studentId = ids.studentId) {
  return app.request("/api/enrollments/enroll", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-user-id": studentId,
    },
    body: JSON.stringify({ studentId, offeringId }),
  });
}

test("atomic enroll increments currentCapacity by exactly 1", async () => {
  const res = await postEnroll(ids.offeringId);
  assert.equal(res.status, 201);

  const rows = await testDb.sqlite.execute({
    sql: "SELECT current_capacity FROM course_offerings WHERE id = ?",
    args: [ids.offeringId],
  });
  assert.equal(Number(rows.rows[0]?.current_capacity), 1);

  const enrRows = await testDb.sqlite.execute({
    sql: "SELECT COUNT(*) AS n FROM enrollments WHERE student_id = ? AND offering_id = ?",
    args: [ids.studentId, ids.offeringId],
  });
  assert.equal(Number(enrRows.rows[0]?.n), 1);
});

test("enroll into a time-conflicting offering returns 409", async () => {
  // 选 off_test_01 (周一 1-2 节)
  const r1 = await postEnroll(ids.offeringId);
  assert.equal(r1.status, 201);

  // 手动插入一个时间冲突的班次(周一 1-2 节)
  await testDb.sqlite.execute({
    sql: `INSERT INTO course_offerings(id, course_id, teacher_id, semester, max_capacity, current_capacity, classroom) VALUES ('off_conflict', 'crs_test_01', 'usr_tch_1', '2026-秋季', 10, 0, '测试教室 C')`,
  });
  await testDb.sqlite.execute({
    sql: `INSERT INTO time_slots(offering_id, day_of_week, start_period, end_period, week_type) VALUES ('off_conflict', 1, 1, 2, 'ALL')`,
  });

  const r2 = await postEnroll("off_conflict");
  assert.equal(r2.status, 409);
  const body = await r2.json();
  assert.match(body.error, /时间冲突/);

  // 容量未变
  const rows = await testDb.sqlite.execute({
    sql: "SELECT current_capacity FROM course_offerings WHERE id = ?",
    args: ["off_conflict"],
  });
  assert.equal(Number(rows.rows[0]?.current_capacity), 0);
});

test("duplicate enroll for same student returns 400", async () => {
  const r1 = await postEnroll(ids.offeringId);
  assert.equal(r1.status, 201);

  const r2 = await postEnroll(ids.offeringId);
  assert.equal(r2.status, 400);
  const body = await r2.json();
  assert.match(body.error, /您已选修了/);

  // 容量只 +1,不是 +2
  const rows = await testDb.sqlite.execute({
    sql: "SELECT current_capacity FROM course_offerings WHERE id = ?",
    args: [ids.offeringId],
  });
  assert.equal(Number(rows.rows[0]?.current_capacity), 1);
});

test("oversell prevention: max=2, 5 concurrent enrolls → exactly 2 succeed", async () => {
  // 重置:把 off_test_01 容量改成 2,创建 5 个新学生
  await testDb.sqlite.execute({
    sql: "UPDATE course_offerings SET max_capacity = 2 WHERE id = ?",
    args: [ids.offeringId],
  });
  await testDb.sqlite.execute({
    sql: "UPDATE course_offerings SET current_capacity = 0 WHERE id = ?",
    args: [ids.offeringId],
  });

  const now = Date.now();
  for (let i = 1; i <= 5; i++) {
    await testDb.sqlite.execute({
      sql: "INSERT INTO users(id, username, password_hash, role, created_at) VALUES (?, ?, 'pw', 'STUDENT', ?)",
      args: [`stu_${i}`, `stu_${i}`, now],
    });
    await testDb.sqlite.execute({
      sql: "INSERT INTO students(id, student_no, real_name, department, class_name, enrolled_credits) VALUES (?, ?, ?, '测试', '测试', 0)",
      args: [`stu_${i}`, `2025${String(i).padStart(4, "0")}`, `测试学生${i}`],
    });
  }

  const promises = [];
  for (let i = 1; i <= 5; i++) {
    promises.push(
      app.request("/api/enrollments/enroll", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": `stu_${i}`,
        },
        body: JSON.stringify({ studentId: `stu_${i}`, offeringId: ids.offeringId }),
      })
    );
  }
  const responses = await Promise.all(promises);
  const success = responses.filter((r) => r.status === 201);
  const conflict = responses.filter((r) => r.status === 409);

  assert.equal(success.length, 2, `expected 2 successes, got ${success.length}`);
  assert.equal(conflict.length, 3, `expected 3 conflicts, got ${conflict.length}`);

  const rows = await testDb.sqlite.execute({
    sql: "SELECT current_capacity FROM course_offerings WHERE id = ?",
    args: [ids.offeringId],
  });
  assert.equal(Number(rows.rows[0]?.current_capacity), 2);

  const enrRows = await testDb.sqlite.execute({
    sql: "SELECT COUNT(*) AS n FROM enrollments WHERE offering_id = ? AND status = 'ACTIVE'",
    args: [ids.offeringId],
  });
  assert.equal(Number(enrRows.rows[0]?.n), 2);
});

test("drop restores currentCapacity", async () => {
  const r1 = await postEnroll(ids.offeringId);
  assert.equal(r1.status, 201);

  let rows = await testDb.sqlite.execute({
    sql: "SELECT current_capacity FROM course_offerings WHERE id = ?",
    args: [ids.offeringId],
  });
  assert.equal(Number(rows.rows[0]?.current_capacity), 1);

  const r2 = await app.request("/api/enrollments/drop", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-user-id": ids.studentId,
    },
    body: JSON.stringify({ studentId: ids.studentId, offeringId: ids.offeringId }),
  });
  assert.equal(r2.status, 200);

  rows = await testDb.sqlite.execute({
    sql: "SELECT current_capacity FROM course_offerings WHERE id = ?",
    args: [ids.offeringId],
  });
  assert.equal(Number(rows.rows[0]?.current_capacity), 0);
});

test("drop with nonexistent enrollment returns 404", async () => {
  const res = await app.request("/api/enrollments/drop", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-user-id": ids.studentId,
    },
    body: JSON.stringify({
      studentId: ids.studentId,
      offeringId: "off_does_not_exist",
    }),
  });
  assert.equal(res.status, 404);
  const body = await res.json();
  assert.match(body.error, /未找到有效的选课记录/);
});
