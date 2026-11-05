import { describe, expect, it } from "vitest";
import { makeTestApp } from "./helpers.js";

async function setup() {
  const t = await makeTestApp();
  const me = await t.loginAs("a@example.com");
  const create = (body: Record<string, unknown>, token = me.token) =>
    t.call("POST", `/users/${me.user.id}/labels`, { token, body });
  return { ...t, me, create };
}

describe("US6: nhãn theo người dùng", () => {
  it("tạo, liệt kê, sửa rồi xoá nhãn", async () => {
    const { create, call, me } = await setup();
    const created = await create({ name: "Gấp", color: "#E2483D" });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ name: "Gấp", color: "#E2483D", userId: me.user.id });

    const list = await call("GET", `/users/${me.user.id}/labels`, { token: me.token });
    expect(list.body).toHaveLength(1);

    const updated = await call("PUT", `/users/${me.user.id}/labels/${created.body.id}`, {
      token: me.token,
      body: { name: "Rất gấp", color: "#ffab00" },
    });
    expect(updated.body).toMatchObject({ name: "Rất gấp", color: "#ffab00" });

    const del = await call("DELETE", `/users/${me.user.id}/labels/${created.body.id}`, { token: me.token });
    expect(del.body.message).toBe("Đã xoá nhãn");
    expect((await call("GET", `/users/${me.user.id}/labels`, { token: me.token })).body).toHaveLength(0);
  });

  it("`:userId` bị bỏ qua: luôn trả nhãn của người gọi", async () => {
    const { create, call, me, loginAs } = await setup();
    await create({ name: "Của A", color: "#0c66e4" });
    const other = await loginAs("b@example.com");
    // B gọi bằng userId của A nhưng chỉ thấy nhãn của B.
    const list = await call("GET", `/users/${me.user.id}/labels`, { token: other.token });
    expect(list.body).toHaveLength(0);
  });

  it("gắn nhãn vào task thì card trả về kèm nhãn", async () => {
    const { create, call, me } = await setup();
    const { body: label } = await create({ name: "Học", color: "#8f7ee7" });
    const card = await call("POST", `/boards/${me.board.id}/cards`, {
      token: me.token,
      body: { name: "Ôn thi", listId: me.todo.id, labels: [{ id: label.id }] },
    });
    expect(card.body.labels).toEqual([{ id: label.id, name: "Học", color: "#8f7ee7" }]);

    // Xoá nhãn thì card cũng không còn nhãn đó.
    await call("DELETE", `/users/${me.user.id}/labels/${label.id}`, { token: me.token });
    const after = await call("GET", `/boards/${me.board.id}/cards/${card.body.id}`, { token: me.token });
    expect(after.body.labels).toEqual([]);
  });

  it.each([
    [{ name: "  ", color: "#ff0000" }, "name", "Tên nhãn từ 1 đến 50 ký tự."],
    [{ name: "x".repeat(51), color: "#ff0000" }, "name", "Tên nhãn từ 1 đến 50 ký tự."],
    [{ name: "Gấp", color: "red" }, "color", "Màu phải có dạng #RRGGBB."],
  ])("từ chối dữ liệu sai %#", async (body, field, message) => {
    const { create } = await setup();
    const res = await create(body);
    expect(res.status).toBe(400);
    expect(res.body.fields[field]).toBe(message);
  });

  it("thiếu token → 401", async () => {
    const { call, me } = await setup();
    expect((await call("GET", `/users/${me.user.id}/labels`)).status).toBe(401);
  });

  it("nhãn của người khác → 404", async () => {
    const { create, call, loginAs } = await setup();
    const { body: label } = await create({ name: "Của A", color: "#0c66e4" });
    const other = await loginAs("b@example.com");
    const res = await call("PUT", `/users/${other.user.id}/labels/${label.id}`, {
      token: other.token,
      body: { name: "chiếm" },
    });
    expect(res.status).toBe(404);
    expect((await call("DELETE", `/users/${other.user.id}/labels/${label.id}`, { token: other.token })).status).toBe(404);
  });
});
