import { defineConfig } from "drizzle-kit";

// Bảng được tạo tự động khi server khởi động (src/db/client.ts).
// File này để dùng drizzle-kit (studio, push) khi cần xem dữ liệu.
export default defineConfig({
  dialect: "turso",
  schema: "./src/db/schema.ts",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "file:./data/dailydesk.db",
    authToken: process.env.DATABASE_AUTH_TOKEN,
  },
});
