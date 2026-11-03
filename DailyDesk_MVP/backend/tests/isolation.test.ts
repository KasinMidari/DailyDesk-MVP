import { describe, expect, it } from "vitest";
import { makeTestApp } from "./helpers.js";

describe("US1: tách dữ liệu giữa người dùng (FR-003, SC-005)", () => {
  it("người B không xem, sửa, xoá được board và task của A", async () => {
    const { call, loginAs } = await makeTestApp();
    const a = await loginAs("a@example.com");
    const b = await loginAs("b@example.com");
    const card = await call("POST", `/boards/${a.board.id}/cards`, {
      token: a.token,
      body: { name: "Việc riêng của A", listId: a.todo.id },
    });
    expect(card.status).toBe(201);
    const cardId = card.body.id;

    const attempts = [
      call("GET", `/boards/${a.board.id}`, { token: b.token }),
      call("PUT", `/boards/${a.board.id}`, { token: b.token, body: { name: "chiếm" } }),
      call("DELETE", `/boards/${a.board.id}`, { token: b.token }),
      call("GET", `/boards/${a.board.id}/lists`, { token: b.token }),
      call("GET", `/boards/${a.board.id}/cards/${cardId}`, { token: b.token }),
      call("PUT", `/boards/${a.board.id}/cards/${cardId}`, { token: b.token, body: { name: "sửa" } }),
      call("DELETE", `/boards/${a.board.id}/cards/${cardId}`, { token: b.token }),
      // Dùng board của B nhưng card của A: vẫn không được.
      call("GET", `/boards/${b.board.id}/cards/${cardId}`, { token: b.token }),
    ];
    for (const res of await Promise.all(attempts)) expect(res.status).toBe(404);

    const all = await call("GET", "/boards/cards/all", { token: b.token });
    expect(all.body.map((c: { id: string }) => c.id)).not.toContain(cardId);

    // Task của A vẫn nguyên vẹn.
    const still = await call("GET", `/boards/${a.board.id}/cards/${cardId}`, { token: a.token });
    expect(still.body.name).toBe("Việc riêng của A");
  });
});
