import { describe, expect, it } from "vitest";
import { makeTestApp } from "./helpers.js";

async function setup() {
  const t = await makeTestApp();
  const me = await t.loginAs("a@example.com");
  const card = (name: string, description?: string) =>
    t.call("POST", `/boards/${me.board.id}/cards`, {
      token: me.token,
      body: { name, description, listId: me.todo.id },
    });
  const find = (query: string, token = me.token) => t.call("GET", `/search?${query}`, { token });
  return { ...t, me, card, find };
}

describe("US6: tìm kiếm", () => {
  it("bỏ dấu tiếng Việt: 'hop' khớp 'họp'", async () => {
    const { card, find } = await setup();
    await card("Họp nhóm KITS");
    const res = await find("q=hop");
    expect(res.status).toBe(200);
    expect(res.body.query).toBe("hop");
    const names = res.body.results.filter((r: { type: string }) => r.type === "card").map((r: { title: string }) => r.title);
    expect(names).toContain("Họp nhóm KITS");
  });

  it("khớp cả mô tả và trả về đủ trường của kết quả card", async () => {
    const { card, find, me } = await setup();
    const { body: created } = await card("Việc A", "Chuẩn bị tài liệu thiết kế");
    const res = await find("q=thiet ke&types=card");
    expect(res.body.total).toBe(1);
    expect(res.body.results[0]).toMatchObject({
      type: "card",
      id: created.id,
      title: "Việc A",
      boardId: me.board.id,
      boardName: "Việc của tôi",
      listName: "Todo",
      isCompleted: false,
    });
  });

  it("tìm board và list, lọc theo types", async () => {
    const { find, me } = await setup();
    const boards = await find("q=viec&types=board");
    expect(boards.body.results.map((r: { type: string }) => r.type)).toEqual(["board"]);
    expect(boards.body.results[0]).toMatchObject({ id: me.board.id, name: "Việc của tôi" });

    const lists = await find("q=todo&types=list");
    expect(lists.body.results[0]).toMatchObject({ type: "list", name: "Todo", boardName: "Việc của tôi" });
  });

  it("boardId giới hạn phạm vi, limit giới hạn số kết quả", async () => {
    const { card, find, call, me } = await setup();
    await card("Báo cáo tuần");
    const { body: other } = await call("POST", "/boards", { token: me.token, body: { name: "Board khác" } });
    const { body: list } = await call("POST", `/boards/${other.id}/lists`, { token: me.token, body: { name: "Todo" } });
    await call("POST", `/boards/${other.id}/cards`, {
      token: me.token,
      body: { name: "Báo cáo tháng", listId: list.id },
    });

    expect((await find("q=bao cao&types=card")).body.total).toBe(2);
    const scoped = await find(`q=bao cao&types=card&boardId=${other.id}`);
    expect(scoped.body.total).toBe(1);
    expect(scoped.body.results[0].title).toBe("Báo cáo tháng");
    expect((await find("q=bao cao&types=card&limit=1")).body.total).toBe(1);
  });

  it("từ khoá rỗng trả danh sách rỗng", async () => {
    const { find } = await setup();
    const res = await find("q=");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ results: [], total: 0, query: "" });
  });

  it("thiếu token → 401", async () => {
    const { call } = await setup();
    expect((await call("GET", "/search?q=hop")).status).toBe(401);
  });

  it("chỉ trả dữ liệu của người gọi", async () => {
    const { card, find, loginAs } = await setup();
    await card("Việc riêng của A");
    const other = await loginAs("b@example.com");
    const res = await find("q=rieng cua A", other.token);
    expect(res.body.total).toBe(0);
  });
});
