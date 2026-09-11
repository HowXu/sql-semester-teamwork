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

test("getMy returns aggregated GPA for student with grades", async () => {
  // 选一门课并录入成绩
  const enrollRes = await app.request("/api/enrollments/enroll", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-user-id": ids.studentId,
    },
    body: JSON.stringify({ studentId: ids.studentId, offeringId: ids.offeringId }),
  });
  assert.equal(enrollRes.status, 201);
  const enrollBody = await enrollRes.json();
  const enrollmentId = enrollBody.enrollmentId;

  await app.request("/api/grades/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ enrollmentId, score: 92 }),
  });

  const res = await app.request("/api/grades/my", {
    headers: { "x-user-id": ids.studentId },
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.totalCreditsEnrolled, 3);
  assert.equal(body.totalCreditsEarned, 3);
  assert.equal(body.cumulativeGpa, 4.2);
  assert.equal(body.grades.length, 1);
  assert.equal(body.grades[0]?.score, 92);
});

test("submit updates existing grade via onConflictDoUpdate", async () => {
  const enrollRes = await app.request("/api/enrollments/enroll", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-user-id": ids.studentId,
    },
    body: JSON.stringify({ studentId: ids.studentId, offeringId: ids.offeringId }),
  });
  const { enrollmentId } = await enrollRes.json();

  await app.request("/api/grades/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ enrollmentId, score: 80 }),
  });

  // 重复 submit
  const resubmit = await app.request("/api/grades/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ enrollmentId, score: 95 }),
  });
  assert.equal(resubmit.status, 200);

  const res = await app.request("/api/grades/my", {
    headers: { "x-user-id": ids.studentId },
  });
  const body = await res.json();
  assert.equal(body.grades[0]?.score, 95);
  assert.equal(body.grades[0]?.gradePoint, 4.5);
});

test("GET /api/grades/offering/:offeringId returns enrolled students and their grades", async () => {
  const enrollRes = await app.request("/api/enrollments/enroll", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-user-id": ids.studentId,
    },
    body: JSON.stringify({ studentId: ids.studentId, offeringId: ids.offeringId }),
  });
  const { enrollmentId } = await enrollRes.json();

  await app.request("/api/grades/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ enrollmentId, score: 88 }),
  });

  const res = await app.request(`/api/grades/offering/${ids.offeringId}`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.offeringId, ids.offeringId);
  assert.equal(data.students.length, 1);
  assert.equal(data.students[0]?.studentId, ids.studentId);
  assert.equal(data.students[0]?.score, 88);
  assert.equal(data.students[0]?.gradePoint, 3.8);
});

