import { z } from "zod";

const schema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1).default("file:./data/dailydesk.db"),
  DATABASE_AUTH_TOKEN: z.string().optional(),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET phải dài ít nhất 32 ký tự"),
  GOOGLE_CLIENT_ID: z.string().default(""),
  AUTH_DEV_LOGIN: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "1"),
  CORS_ORIGIN: z
    .string()
    .default("http://localhost:5173")
    .transform((v) =>
      v
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    ),
});

export type Env = z.infer<typeof schema>;

export function loadEnv(source: Record<string, string | undefined> = process.env): Env {
  const parsed = schema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `- ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Thiếu hoặc sai biến môi trường:\n${issues}`);
  }
  return parsed.data;
}
