import { describe, expect, it } from "vitest";
import { makeTestApp } from "./helpers.js";

async function setup() {
  const t = await makeTestApp();
  const me = await t.loginAs("a@example.com");
  const { body: card } = await t.call("POST", `/boards/${me.board.id}/cards`, {
    token: me.token,
    body: { name: "Chuẩn bị demo", listId: me.todo.id },
  });
  const base = `/boards/${me.board.id}/cards/${card.id}`;
  const add = (content: unknown, token = me.token) =>
    t.call("POST", `${base}/comments`, { token, body: { content } });
  return { ...t, me, card, base, add };
}

describe("US6: bình luận", () => {
  it("thêm bình luận trả về đủ trường cho giao diện", async () => {
    const { add, me, card } = await setup();
    const res = await add("  Nhớ mang bản in  ");
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      cardId: card.id,
      userId: me.user.id,
      content: "Nhớ mang bản in",
      text: "Nhớ mang bản in",
    });
    expect(res.body.user).toMatchObject({ id: me.user.id, email: "a@example.com", initials: "A" });
  });

  it("liệt kê, sửa rồi xoá bình luận của mình", async () => {
    const { add, call, base, me } = await setup();
    const { body: c1 } = await add("Bình luận một");
    await add("Bình luận hai");
    const list = await call("GET", `${base}/comments`, { token: me.token });
    expect(list.body).toHaveLength(2);

    const edited = await call("PUT", `${base}/comments/${c1.id}`, { token: me.token, body: { content: "Đã sửa" } });
    expect(edited.body).toMatchObject({ content: "Đã sửa", text: "Đã sửa" });

    const del = await call("DELETE", `${base}/comments/${c1.id}`, { token: me.token });
    expect(del.body.message).toBe("Đã xoá bình luận");
    expect((await call("GET", `${base}/comments`, { token: me.token })).body).toHaveLength(1);
  });

  it.each([
    ["   ", "Hãy nhập nội dung bình luận."],
    ["x".repeat(5001), "Bình luận tối đa 5000 ký tự."],
  ])("từ chối nội dung sai %#", async (content, message) => {
    const { add } = await setup();
    const res = await add(content);
    expect(res.status).toBe(400);
    expect(res.body.fields.content).toBe(message);
  });

  it("sửa hoặc xoá bình luận của người khác → 403", async () => {
    const { call, base, me, card, db, loginAs } = await setup();
    const other = await loginAs("b@example.com");
    // Chèn trực tiếp bình luận của B trên task của A để kiểm nhánh 403.
    await db.client.execute({
      sql: "INSERT INTO comments (id, card_id, user_id, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
      args: ["cmt-of-b", card.id, other.user.id, "Của B", new Date().toISOString(), new Date().toISOString()],
    });
    const put = await call("PUT", `${base}/comments/cmt-of-b`, { token: me.token, body: { content: "sửa" } });
    expect(put.status).toBe(403);
    expect(put.body.message).toBe("Bạn chỉ sửa được bình luận của mình");
    expect((await call("DELETE", `${base}/comments/cmt-of-b`, { token: me.token })).status).toBe(403);
  });

  it("thiếu token → 401", async () => {
    const { call, base } = await setup();
    expect((await call("GET", `${base}/comments`)).status).toBe(401);
  });

  it("task của người khác → 404", async () => {
    const { add, call, base, loginAs } = await setup();
    const other = await loginAs("b@example.com");
    expect((await add("xem thử", other.token)).status).toBe(404);
    expect((await call("GET", `${base}/comments`, { token: other.token })).status).toBe(404);
    expect((await call("GET", `${base}/timeline`, { token: other.token })).status).toBe(404);
  });
});

describe("US6: hoạt động và dòng thời gian", () => {
  it("activities ghi lại việc tạo, đổi tên và chuyển danh sách", async () => {
    const { call, base, me, card } = await setup();
    await call("PUT", `/boards/${me.board.id}/cards/${card.id}`, { token: me.token, body: { name: "Demo mới" } });
    await call("PUT", `/boards/${me.board.id}/cards/${card.id}`, { token: me.token, body: { listId: me.doing.id } });
    const res = await call("GET", `${base}/activities`, { token: me.token });
    expect(res.status).toBe(200);
    const types = res.body.map((a: { actionType: string }) => a.actionType);
    expect(types).toContain("card.created");
    expect(types).toContain("card.renamed");
    expect(types).toContain("card.moved");
    expect(res.body[0]).toMatchObject({ activityType: "card", cardId: card.id });
    expect(res.body[0].user.id).toBe(me.user.id);
  });

  it("timeline trộn bình luận và hoạt động, mới nhất trước", async () => {
    const { add, call, base, me } = await setup();
    await add("Bình luận mới nhất");
    const res = await call("GET", `${base}/timeline`, { token: me.token });
    expect(res.status).toBe(200);
    expect(res.body.every((i: { type: string }) => i.type === "comment" || i.type === "activity")).toBe(true);
    expect(res.body[0].type).toBe("comment");
    const dates = res.body.map((i: { createdAt: string }) => i.createdAt);
    expect([...dates].sort().reverse()).toEqual(dates);
  });
});
