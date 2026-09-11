import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import type { Hono } from "hono";
import { createTestDb, type TestDb } from "./test-helpers/db.js";
import { seedMinimal, type SeedIds } from "./test-helpers/seed.js";
import { createTestApp } from "./test-helpers/app.js";

let app: Hono;
let testDb: TestDb;
let ids: SeedIds;

before(async () => {
  testDb = await createTestDb();
  ids = await seedMinimal(testDb);
  app = await createTestApp(testDb);
});

after(async () => {
  testDb.sqlite.close();
});

test("login with wrong password returns 401", async () => {
  const res = await app.request("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "student01", password: "wrong" }),
  });
  assert.equal(res.status, 401);
  const body = await res.json();
  assert.match(body.error, /用户名或密码错误/);
});

test("login with nonexistent user returns 401", async () => {
  const res = await app.request("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "ghost", password: "any" }),
  });
  assert.equal(res.status, 401);
  const body = await res.json();
  assert.match(body.error, /用户名或密码错误/);
});

test("login with correct credentials returns 200 with student info", async () => {
  const res = await app.request("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "student01", password: "password123" }),
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.user.username, "student01");
  assert.equal(body.user.role, "STUDENT");
  assert.equal(body.studentId, ids.studentId);
  assert.equal(body.displayName, "测试学生");
});

test("GET /me with x-user-id returns user info", async () => {
  const res = await app.request("/api/auth/me", {
    headers: { "x-user-id": ids.studentId },
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.user.id, ids.studentId);
  assert.equal(body.user.role, "STUDENT");
  assert.equal(body.displayName, "测试学生");
});
