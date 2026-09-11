import { Hono } from "hono";
import { cors } from "hono/cors";
import type { TestDb } from "./db.js";
import { createAuthRouter } from "../auth.js";
import { createCoursesRouter } from "../courses.js";
import { createOfferingsRouter } from "../offerings.js";
import { createEnrollmentsRouter } from "../enrollments.js";
import { createGradesRouter } from "../grades.js";
import { createStatsRouter } from "../stats.js";

export async function createTestApp(testDb: TestDb): Promise<Hono> {
  const app = new Hono();

  app.use(
    "*",
    cors({
      origin: ["http://localhost:5173"],
      allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization", "x-user-id"],
    })
  );

  app.get("/", (c) => {
    return c.json({ status: "ok" });
  });

  app.route("/api/auth", createAuthRouter({ db: testDb.db }));
  app.route("/api/courses", createCoursesRouter({ db: testDb.db }));
  app.route("/api/offerings", createOfferingsRouter({ db: testDb.db }));
  app.route(
    "/api/enrollments",
    createEnrollmentsRouter({ db: testDb.db, sqlite: testDb.sqlite })
  );
  app.route("/api/grades", createGradesRouter({ db: testDb.db }));
  app.route("/api/stats", createStatsRouter({ db: testDb.db }));

  return app;
}
