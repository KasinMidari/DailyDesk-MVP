import { createMiddleware } from "hono/factory";
import { HttpError } from "../http.js";
import { verifySession } from "./session.js";
import type { AppEnv } from "../app.js";

/** Bắt buộc đăng nhập: đặt `userId` vào context, thiếu/sai token → 401. */
export const requireUser = createMiddleware<AppEnv>(async (c, next) => {
  const header = c.req.header("Authorization") ?? "";
  const token = header.replace(/^Bearer\s+/i, "");
  const userId = token ? await verifySession(token, c.var.env.SESSION_SECRET) : null;
  if (!userId) throw new HttpError(401, "Bạn cần đăng nhập");
  c.set("userId", userId);
  await next();
});
