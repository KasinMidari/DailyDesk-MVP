import { mkdirSync } from "node:fs";
import { serve } from "@hono/node-server";
import { createApp } from "./app.js";
import { createDb, prepareDb } from "./db/client.js";
import { loadEnv } from "./env.js";

try {
  process.loadEnvFile?.(".env");
} catch {
  // Không có file .env (ví dụ trên Render): dùng biến môi trường của hệ thống.
}

const env = loadEnv();
if (env.DATABASE_URL.startsWith("file:")) mkdirSync("./data", { recursive: true });

const db = createDb(env.DATABASE_URL, env.DATABASE_AUTH_TOKEN);
await prepareDb(db);

serve({ fetch: createApp({ db, env }).fetch, port: env.PORT }, (info) => {
  console.log(`DailyDesk API chạy ở http://localhost:${info.port}`);
});
