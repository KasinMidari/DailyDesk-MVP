import { describe, expect, it } from "vitest";
import { makeTestApp } from "./helpers.js";

describe("US1: đăng nhập", () => {
  it("lần đầu tạo user + board mặc định có Todo/Doing/Done", async () => {
    const { loginAs } = await makeTestApp();
    const me = await loginAs("a@example.com");
    expect(me.board.name).toBe("Việc của tôi");
    expect(me.board.isDefault).toBe(true);
    expect(me.board.lists.map((l: { name: string; order: number }) => [l.name, l.order])).toEqual([
      ["Todo", 0],
      ["Doing", 1],
      ["Done", 2],
    ]);
  });

  it("đăng nhập lần 2 không tạo trùng board", async () => {
    const { call, loginAs } = await makeTestApp();
    await loginAs("a@example.com");
    const again = await loginAs("a@example.com");
    const boards = await call("GET", "/boards", { token: again.token });
    expect(boards.body.ownedBoards).toHaveLength(1);
    expect(boards.body.invitedBoards).toEqual([]);
  });

  it("GET /auth/me trả thông tin người dùng", async () => {
    const { call, loginAs } = await makeTestApp();
    const { token } = await loginAs("a@example.com");
    const me = await call("GET", "/auth/me", { token });
    expect(me.status).toBe(200);
    expect(me.body).toMatchObject({ email: "a@example.com", name: "a" });
  });

  it("POST /auth/google với token sai trả 401", async () => {
    const { call } = await makeTestApp({ GOOGLE_CLIENT_ID: "test-client" });
    const res = await call("POST", "/auth/google", { body: { credential: "not-a-jwt" } });
    expect(res.status).toBe(401);
  });

  it("POST /auth/dev bị tắt khi AUTH_DEV_LOGIN=false", async () => {
    const { call } = await makeTestApp({ AUTH_DEV_LOGIN: "false" });
    expect((await call("POST", "/auth/dev", { body: { email: "a@example.com" } })).status).toBe(404);
  });
});
