import { describe, expect, it } from "vitest";
import { inDays, makeTestApp } from "./helpers.js";

async function setup() {
  const t = await makeTestApp();
  const me = await t.loginAs("a@example.com");
  const { body: card } = await t.call("POST", `/boards/${me.board.id}/cards`, {
    token: me.token,
    body: { name: "Việc có hạn", listId: me.todo.id },
  });
  const due = (method: string, body?: unknown, token = me.token) =>
    t.call(method, `/boards/${me.board.id}/cards/${card.id}/due`, { token, body });
  return { ...t, me, card, due };
}

describe("US6: hạn hoàn thành (PATCH/DELETE …/due)", () => {
  it("đặt ngày bắt đầu, hạn chót và nhắc trước", async () => {
    const { due } = await setup();
    const start = inDays(1);
    const dueAt = inDays(3);
    const res = await due("PATCH", { startDate: start, dueAt, reminderMinutes: "60", repeatFrequency: "weekly" });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      startDate: start,
      dueAt,
      dueComplete: false,
      reminderMinutes: 60,
      repeatFrequency: "weekly",
    });
  });

  it("dueComplete kéo theo completed của task", async () => {
    const { due, call, me, card } = await setup();
    await due("PATCH", { dueAt: inDays(2), dueComplete: true });
    const after = await call("GET", `/boards/${me.board.id}/cards/${card.id}`, { token: me.token });
    expect(after.body).toMatchObject({ completed: true, dueComplete: true });
  });

  it("ngày bắt đầu sau hạn chót bị từ chối", async () => {
    const { due } = await setup();
    const res = await due("PATCH", { startDate: inDays(5), dueAt: inDays(2) });
    expect(res.status).toBe(400);
    expect(res.body.fields.startDate).toBe("Ngày bắt đầu không được sau hạn chót.");
  });

  it.each([
    [{ dueAt: "32/13/2026" }, "dueAt", "Ngày giờ không hợp lệ."],
    [{ dueAt: inDays(-2) }, "dueAt", "Hạn chót phải từ bây giờ trở đi."],
  ])("từ chối dữ liệu sai %#", async (body, field, message) => {
    const { due } = await setup();
    const res = await due("PATCH", body);
    expect(res.status).toBe(400);
    expect(res.body.fields[field]).toBe(message);
  });

  it("DELETE xoá mọi trường ngày", async () => {
    const { due, call, me, card } = await setup();
    await due("PATCH", { startDate: inDays(1), dueAt: inDays(3), reminderMinutes: 30, repeatInterval: 2 });
    const res = await due("DELETE");
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Đã xoá hạn");
    const after = await call("GET", `/boards/${me.board.id}/cards/${card.id}`, { token: me.token });
    expect(after.body).toMatchObject({
      startDate: null,
      dueAt: null,
      deadline: null,
      reminderMinutes: null,
      repeatInterval: null,
    });
  });

  it("thiếu token → 401", async () => {
    const { me, card, call } = await setup();
    const res = await call("PATCH", `/boards/${me.board.id}/cards/${card.id}/due`, { body: { dueAt: inDays(1) } });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Bạn cần đăng nhập");
  });

  it("task của người khác → 404", async () => {
    const { due, loginAs } = await setup();
    const other = await loginAs("b@example.com");
    expect((await due("PATCH", { dueAt: inDays(1) }, other.token)).status).toBe(404);
    expect((await due("DELETE", undefined, other.token)).status).toBe(404);
  });
});
