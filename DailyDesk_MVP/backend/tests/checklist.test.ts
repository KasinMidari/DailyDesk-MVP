import { describe, expect, it } from "vitest";
import { makeTestApp } from "./helpers.js";

async function setup() {
  const t = await makeTestApp();
  const me = await t.loginAs("a@example.com");
  const { body: card } = await t.call("POST", `/boards/${me.board.id}/cards`, {
    token: me.token,
    body: { name: "Chuẩn bị họp", listId: me.todo.id },
  });
  const base = `/boards/${me.board.id}/cards/${card.id}/checklist-items`;
  const add = (body: Record<string, unknown>, token = me.token) => t.call("POST", base, { token, body });
  return { ...t, me, card, base, add };
}

describe("US6: việc cần làm trong task (checklist-items)", () => {
  it("thêm mục rồi liệt kê theo thứ tự, luôn có members rỗng", async () => {
    const { add, call, base, me, card } = await setup();
    const first = await add({ name: "  In tài liệu  " });
    expect(first.status).toBe(201);
    expect(first.body).toMatchObject({ name: "In tài liệu", completed: false, order: 0, cardId: card.id, members: [] });

    await add({ name: "Gọi xác nhận phòng" });
    const list = await call("GET", base, { token: me.token });
    expect(list.body.map((i: { name: string }) => i.name)).toEqual(["In tài liệu", "Gọi xác nhận phòng"]);
    expect(list.body[1].order).toBe(1);
  });

  it("đánh dấu xong, đổi tên rồi xoá", async () => {
    const { add, call, base, me } = await setup();
    const { body: item } = await add({ name: "Gửi email" });
    const done = await call("PUT", `${base}/${item.id}`, { token: me.token, body: { completed: true } });
    expect(done.body).toMatchObject({ completed: true, name: "Gửi email" });

    const renamed = await call("PUT", `${base}/${item.id}`, { token: me.token, body: { name: "Gửi email nhắc" } });
    expect(renamed.body.name).toBe("Gửi email nhắc");

    const del = await call("DELETE", `${base}/${item.id}`, { token: me.token });
    expect(del.body.message).toBe("Đã xoá mục");
    expect((await call("GET", `${base}/${item.id}`, { token: me.token })).status).toBe(404);
  });

  it.each([
    [{ name: "   " }, "Hãy nhập nội dung việc cần làm."],
    [{ name: "x".repeat(201) }, "Nội dung tối đa 200 ký tự."],
  ])("từ chối dữ liệu sai %#", async (body, message) => {
    const { add } = await setup();
    const res = await add(body);
    expect(res.status).toBe(400);
    expect(res.body.fields.name).toBe(message);
  });

  it("thiếu token → 401", async () => {
    const { call, base } = await setup();
    expect((await call("GET", base)).status).toBe(401);
  });

  it("task của người khác → 404", async () => {
    const { add, call, base, loginAs } = await setup();
    const { body: item } = await add({ name: "Riêng tư" });
    const other = await loginAs("b@example.com");
    expect((await call("GET", base, { token: other.token })).status).toBe(404);
    expect((await call("PUT", `${base}/${item.id}`, { token: other.token, body: { completed: true } })).status).toBe(404);
    expect((await call("DELETE", `${base}/${item.id}`, { token: other.token })).status).toBe(404);
  });
});
