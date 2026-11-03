import { createApp } from "../src/app.js";
import { createDb, prepareDb } from "../src/db/client.js";
import { loadEnv } from "../src/env.js";

export async function makeTestApp(overrides: Record<string, string> = {}) {
  const env = loadEnv({
    SESSION_SECRET: "test-secret-test-secret-test-secret-123",
    AUTH_DEV_LOGIN: "true",
    DATABASE_URL: ":memory:",
    ...overrides,
  });
  const db = createDb(":memory:");
  await prepareDb(db);
  const app = createApp({ db, env, log: false });

  const call = async (method: string, path: string, opts: { token?: string; body?: unknown } = {}) => {
    const res = await app.request(path, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
      },
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    });
    const text = await res.text();
    return { status: res.status, body: text ? JSON.parse(text) : null };
  };

  /** Đăng nhập tài khoản thử nghiệm, trả token + board mặc định với 3 list. */
  const loginAs = async (email: string) => {
    const { body } = await call("POST", "/auth/dev", { body: { email, name: email.split("@")[0] } });
    const token = body.token as string;
    const boards = (await call("GET", "/boards", { token })).body.ownedBoards;
    const board = boards[0];
    const list = (name: string) => board.lists.find((l: { name: string }) => l.name === name);
    return { token, user: body.user, board, todo: list("Todo"), doing: list("Doing"), done: list("Done") };
  };

  return { app, db, call, loginAs };
}

export const inDays = (n: number) => new Date(Date.now() + n * 864e5).toISOString();
