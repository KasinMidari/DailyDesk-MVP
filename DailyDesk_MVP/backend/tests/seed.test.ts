import { describe, expect, it } from "vitest";
import { createDb, prepareDb } from "../src/db/client.js";
import { seed } from "../src/db/seed.js";
import { makeTestApp } from "./helpers.js";

async function freshDb() {
  const db = createDb(":memory:");
  await prepareDb(db);
  return db;
}

describe("Dữ liệu mẫu (db:seed)", () => {
  it("tạo đủ board, task, nhãn và dữ liệu phụ", async () => {
    const s = await seed(await freshDb(), "demo@example.com");
    expect(s.boards).toBe(3);
    expect(s.cards).toBeGreaterThanOrEqual(15);
    expect(s.cards).toBeLessThanOrEqual(25);
    expect(s.labels).toBeGreaterThanOrEqual(3);
    expect(s.checklistItems).toBeGreaterThan(0);
    expect(s.comments).toBeGreaterThan(0);
  });

  it("chạy lại không nhân đôi dữ liệu", async () => {
    const db = await freshDb();
    const first = await seed(db, "demo@example.com");
    const second = await seed(db, "demo@example.com");
    expect(second.userId).toBe(first.userId);

    const count = async (table: string) =>
      Number((await db.client.execute(`SELECT COUNT(*) AS n FROM ${table}`)).rows[0]!.n);
    expect(await count("boards")).toBe(first.boards);
    expect(await count("cards")).toBe(first.cards);
    expect(await count("labels")).toBe(first.labels);
  });

  it("đăng nhập dev cùng email thấy đúng dữ liệu mẫu qua API", async () => {
    const t = await makeTestApp();
    await seed(t.db, "demo@example.com");
    const me = await t.loginAs("demo@example.com");
    expect(me.board.name).toBe("Việc của tôi");

    const all = await t.call("GET", "/boards/cards/all", { token: me.token });
    expect(all.body.length).toBeGreaterThanOrEqual(15);
    // Có task quá hạn, task hạn hôm nay và task không hạn; đủ ba mức ưu tiên.
    const now = Date.now();
    const dues = all.body.map((c: { dueAt: string | null }) => c.dueAt);
    expect(dues.some((d: string | null) => d && new Date(d).getTime() < now)).toBe(true);
    expect(dues.some((d: string | null) => d && new Date(d).getTime() > now)).toBe(true);
    expect(dues.some((d: string | null) => d === null)).toBe(true);
    const priorities = new Set(all.body.map((c: { priority: string }) => c.priority));
    expect([...priorities].sort()).toEqual(["high", "low", "medium"]);
    expect(all.body.some((c: { completed: boolean }) => c.completed)).toBe(true);
    expect(all.body.some((c: { labels: unknown[] }) => c.labels.length > 0)).toBe(true);

    const labels = await t.call("GET", `/users/${me.user.id}/labels`, { token: me.token });
    expect(labels.body.length).toBeGreaterThanOrEqual(3);
  });
});
