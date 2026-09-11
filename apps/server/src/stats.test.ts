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

test("overview returns expected shape", async () => {
  const res = await app.request("/api/stats/overview");
  assert.equal(res.status, 200);
  const body = await res.json();

  assert.equal(typeof body.totalCourses, "number");
  assert.equal(typeof body.totalOfferings, "number");
  assert.equal(typeof body.totalActiveEnrollments, "number");
  assert.equal(typeof body.totalCapacity, "number");
  assert.ok(Array.isArray(body.departmentStats));
});

test("overview reflects enrollment distribution", async () => {
  // 先选一门课
  await app.request("/api/enrollments/enroll", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-user-id": ids.studentId,
    },
    body: JSON.stringify({ studentId: ids.studentId, offeringId: ids.offeringId }),
  });

  const res = await app.request("/api/stats/overview");
  const body = await res.json();

  assert.equal(body.totalCourses, 1);
  assert.equal(body.totalOfferings, 2);
  assert.equal(body.totalStudents, 1);
  assert.equal(body.totalActiveEnrollments, 1);

  const dept = body.departmentStats.find(
    (d: { department: string }) => d.department === "计算机科学与技术学院"
  );
  assert.ok(dept, "expected 计算机科学与技术学院 entry");
  assert.equal(dept.courseCount, 1);
  assert.equal(dept.offeringCount, 2);
  assert.equal(dept.enrollmentCount, 1);
});
