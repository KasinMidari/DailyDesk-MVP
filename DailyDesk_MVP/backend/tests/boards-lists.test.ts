import { describe, expect, it } from "vitest";
import { makeTestApp } from "./helpers.js";

describe("US2: board và danh sách", () => {
  it("GET /boards trả lists[].cards[] sắp theo order", async () => {
    const { call, loginAs } = await makeTestApp();
    const me = await loginAs("a@example.com");
    const base = `/boards/${me.board.id}/cards`;
    await call("POST", base, { token: me.token, body: { name: "Hai", listId: me.todo.id, order: 2 } });
    await call("POST", base, { token: me.token, body: { name: "Một", listId: me.todo.id, order: 1 } });
    const res = await call("GET", "/boards", { token: me.token });
    const todo = res.body.ownedBoards[0].lists.find((l: { name: string }) => l.name === "Todo");
    expect(todo.cards.map((c: { name: string }) => c.name)).toEqual(["Một", "Hai"]);
  });

  it("CRUD board và danh sách", async () => {
    const { call, loginAs } = await makeTestApp();
    const { token } = await loginAs("a@example.com");

    const board = await call("POST", "/boards", { token, body: { name: "Đồ án", backgroundColor: "#1f845a" } });
    expect(board.status).toBe(201);
    const id = board.body.id;
    expect((await call("POST", "/boards", { token, body: { name: "  " } })).status).toBe(400);

    // Board mới đã có sẵn Todo/Doing/Done.
    const fresh = await call("GET", `/boards/${id}`, { token });
    expect(fresh.body.lists.map((l: { name: string }) => l.name)).toEqual(["Todo", "Doing", "Done"]);

    const list = await call("POST", `/boards/${id}/lists`, { token, body: { name: "Ghi chú" } });
    expect(list.body).toMatchObject({ name: "Ghi chú", boardId: id });
    const renamed = await call("PUT", `/boards/${id}/lists/${list.body.id}`, { token, body: { name: "Tham khảo" } });
    expect(renamed.body.name).toBe("Tham khảo");

    expect((await call("PUT", `/boards/${id}`, { token, body: { name: "Đồ án SE100" } })).body.name).toBe(
      "Đồ án SE100",
    );
    expect((await call("DELETE", `/boards/${id}/lists/${list.body.id}`, { token })).status).toBe(200);
    expect((await call("DELETE", `/boards/${id}`, { token })).status).toBe(200);
    expect((await call("GET", `/boards/${id}`, { token })).status).toBe(404);
  });

  it("không xoá được board mặc định", async () => {
    const { call, loginAs } = await makeTestApp();
    const me = await loginAs("a@example.com");
    expect((await call("DELETE", `/boards/${me.board.id}`, { token: me.token })).status).toBe(403);
  });

  it("xoá danh sách xoá luôn task trong đó", async () => {
    const { call, loginAs } = await makeTestApp();
    const me = await loginAs("a@example.com");
    // Danh sách thêm vào, không phải một trong ba trạng thái bắt buộc.
    const extra = await call("POST", `/boards/${me.board.id}/lists`, {
      token: me.token,
      body: { name: "Chờ duyệt" },
    });
    await call("POST", `/boards/${me.board.id}/cards`, {
      token: me.token,
      body: { name: "x", listId: extra.body.id },
    });
    expect((await call("DELETE", `/boards/${me.board.id}/lists/${extra.body.id}`, { token: me.token })).status).toBe(
      200,
    );
    const all = await call("GET", "/boards/cards/all", { token: me.token });
    expect(all.body).toHaveLength(0);
  });

  it("không xoá được danh sách cuối cùng của một trạng thái", async () => {
    const { call, loginAs } = await makeTestApp();
    const me = await loginAs("a@example.com");

    const res = await call("DELETE", `/boards/${me.board.id}/lists/${me.done.id}`, { token: me.token });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain("Done");

    // Có danh sách khác cùng trạng thái thì xoá được.
    await call("POST", `/boards/${me.board.id}/lists`, { token: me.token, body: { name: "Đã xong" } });
    expect((await call("DELETE", `/boards/${me.board.id}/lists/${me.done.id}`, { token: me.token })).status).toBe(200);
  });

  it("đổi tên giữ nguyên trạng thái thì được, đổi sang nghĩa khác thì không", async () => {
    const { call, loginAs } = await makeTestApp();
    const me = await loginAs("a@example.com");
    const url = `/boards/${me.board.id}/lists/${me.done.id}`;

    // "Done" -> "Xong": vẫn là trạng thái xong.
    expect((await call("PUT", url, { token: me.token, body: { name: "Xong" } })).status).toBe(200);
    // "Xong" -> "Ghi chú": mất hẳn trạng thái xong của board.
    expect((await call("PUT", url, { token: me.token, body: { name: "Ghi chú" } })).status).toBe(400);
  });
});
