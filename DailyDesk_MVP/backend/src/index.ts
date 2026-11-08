import { mkdirSync } from "node:fs";
import { serve } from "@hono/node-server";
import { createApp } from "./app.js";
import { createDb, prepareDb } from "./db/client.js";
import { loadEnv } from "./env.js";
import { backfillDefaultLists } from "./services/lists.js";

try {
  process.loadEnvFile?.(".env");
} catch {
  // Không có file .env (ví dụ trên Render): dùng biến môi trường của hệ thống.
}

const env = loadEnv();
if (env.DATABASE_URL.startsWith("file:")) mkdirSync("./data", { recursive: true });

// Đăng nhập thử không cần mật khẩu: tiện ở máy local, nhưng trên một địa chỉ
// công khai thì ai biết email của người khác cũng vào được tài khoản đó.
if (env.AUTH_DEV_LOGIN && process.env.NODE_ENV === "production") {
  console.warn(
    "CẢNH BÁO: AUTH_DEV_LOGIN đang bật ở chế độ production. " +
      "POST /auth/dev cấp phiên cho bất kỳ email nào mà không cần mật khẩu. " +
      "Đặt AUTH_DEV_LOGIN=false trên máy chủ.",
  );
}

const db = createDb(env.DATABASE_URL, env.DATABASE_AUTH_TOKEN);
await prepareDb(db);

const addedLists = await backfillDefaultLists(db);
if (addedLists > 0) console.log(`Đã bổ sung ${addedLists} danh sách còn thiếu cho các board cũ.`);

serve({ fetch: createApp({ db, env }).fetch, port: env.PORT }, (info) => {
  console.log(`DailyDesk API chạy ở http://localhost:${info.port}`);
});
