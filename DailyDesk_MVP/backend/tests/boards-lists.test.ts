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

    const list = await call("POST", `/boards/${id}/lists`, { token, body: { name: "Todo" } });
    expect(list.body).toMatchObject({ name: "Todo", order: 0, boardId: id });
    const renamed = await call("PUT", `/boards/${id}/lists/${list.body.id}`, { token, body: { name: "Cần làm" } });
    expect(renamed.body.name).toBe("Cần làm");

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
    await call("POST", `/boards/${me.board.id}/cards`, { token: me.token, body: { name: "x", listId: me.doing.id } });
    await call("DELETE", `/boards/${me.board.id}/lists/${me.doing.id}`, { token: me.token });
    const all = await call("GET", "/boards/cards/all", { token: me.token });
    expect(all.body).toHaveLength(0);
  });
});
