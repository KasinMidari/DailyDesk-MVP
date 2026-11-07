import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv } from "../app.js";
import { verifyGoogleIdToken } from "../auth/google.js";
import { requireUser } from "../auth/middleware.js";
import { signSession } from "../auth/session.js";
import { HttpError } from "../http.js";
import { getUser, upsertUser, userJson } from "../services/users.js";
import { parse } from "../validation.js";

export const authRoutes = new Hono<AppEnv>();

authRoutes.post("/google", async (c) => {
  const { credential } = parse(z.object({ credential: z.string().min(1) }), await c.req.json().catch(() => ({})));
  // Thiếu cấu hình là lỗi của máy chủ, không phải token người dùng gửi sai:
  // trả 401 cho cả hai thì ai cũng tưởng tại Google và không ai đi sửa env.
  if (!c.var.env.GOOGLE_CLIENT_ID) {
    console.error("GOOGLE_CLIENT_ID chưa được đặt trên máy chủ, không xác minh được token Google");
    throw new HttpError(500, "Máy chủ chưa cấu hình GOOGLE_CLIENT_ID");
  }
  let profile;
  try {
    profile = await verifyGoogleIdToken(credential, c.var.env.GOOGLE_CLIENT_ID);
  } catch (e) {
    // Lý do thật chỉ ghi ở log máy chủ: nói ra ngoài thì thành chỉ đường cho
    // người dò token. Sai audience là trường hợp hay gặp nhất khi deploy —
    // Client ID ở frontend và ở backend không phải cùng một cái.
    console.error("Xác minh Google ID token thất bại:", e instanceof Error ? e.message : e);
    throw new HttpError(401, "Đăng nhập Google không hợp lệ hoặc đã hết hạn");
  }
  const user = await upsertUser(c.var.db, {
    googleSub: profile.sub,
    email: profile.email,
    name: profile.name,
    avatarUrl: profile.picture,
  });
  return c.json({ token: await signSession(user.id, c.var.env.SESSION_SECRET), user: userJson(user) });
});

/** Đăng nhập tài khoản thử nghiệm: chỉ bật khi AUTH_DEV_LOGIN=true (demo, test). */
authRoutes.post("/dev", async (c) => {
  if (!c.var.env.AUTH_DEV_LOGIN) throw new HttpError(404, "Không tìm thấy");
  const body = parse(
    z.object({ email: z.string().email(), name: z.string().trim().min(1).max(100).optional() }),
    await c.req.json().catch(() => ({})),
  );
  const user = await upsertUser(c.var.db, {
    googleSub: `dev|${body.email.toLowerCase()}`,
    email: body.email,
    name: body.name ?? body.email.split("@")[0]!,
    avatarUrl: null,
  });
  return c.json({ token: await signSession(user.id, c.var.env.SESSION_SECRET), user: userJson(user) });
});

authRoutes.get("/me", requireUser, async (c) => {
  const user = await getUser(c.var.db, c.var.userId);
  if (!user) throw new HttpError(401, "Bạn cần đăng nhập");
  return c.json(userJson(user));
});
