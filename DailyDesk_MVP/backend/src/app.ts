import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import type { Db } from "./db/client.js";
import type { Env } from "./env.js";
import { HttpError } from "./http.js";
import { authRoutes } from "./routes/auth.js";
import { boardRoutes } from "./routes/boards.js";
import { checklistRoutes } from "./routes/checklist.js";
import { commentRoutes } from "./routes/comments.js";
import { dueRoutes } from "./routes/due.js";
import { labelRoutes } from "./routes/labels.js";
import { searchRoutes } from "./routes/search.js";

export type AppEnv = {
  Variables: { db: Db; env: Env; userId: string };
};

/** Tạo app; tách khỏi index.ts để test gọi app.request() mà không mở cổng mạng. */
export function createApp({ db, env, log = true }: { db: Db; env: Env; log?: boolean }) {
  const app = new Hono<AppEnv>();

  if (log) app.use("*", logger());
  app.use("*", cors({ origin: env.CORS_ORIGIN, allowHeaders: ["Content-Type", "Authorization"] }));
  app.use("*", async (c, next) => {
    c.set("db", db);
    c.set("env", env);
    await next();
  });

  app.get("/health", (c) => c.json({ ok: true }));
  app.route("/auth", authRoutes);
  app.route("/boards", boardRoutes);
  // Nhóm B: cùng tiền tố /boards nhưng đường dẫn sâu hơn nên không chồng lấn nhóm A.
  app.route("/boards", dueRoutes);
  app.route("/boards", checklistRoutes);
  app.route("/boards", commentRoutes);
  app.route("/users", labelRoutes);
  app.route("/search", searchRoutes);

  app.notFound((c) => c.json({ message: "Không tìm thấy" }, 404));
  app.onError((err, c) => {
    if (err instanceof HttpError) {
      return c.json(err.fields ? { message: err.message, fields: err.fields } : { message: err.message }, err.status);
    }
    console.error(err);
    return c.json({ message: "Có lỗi xảy ra, vui lòng thử lại" }, 500);
  });

  return app;
}
