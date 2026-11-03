import { describe, expect, it } from "vitest";
import { inDays, makeTestApp } from "./helpers.js";

async function setup() {
  const t = await makeTestApp();
  const me = await t.loginAs("a@example.com");
  const create = (body: Record<string, unknown>) =>
    t.call("POST", `/boards/${me.board.id}/cards`, { token: me.token, body: { listId: me.todo.id, ...body } });
  const update = (id: string, body: Record<string, unknown>) =>
    t.call("PUT", `/boards/${me.board.id}/cards/${id}`, { token: me.token, body });
  return { ...t, me, create, update };
}

describe("US2: thêm task và kiểm tra dữ liệu", () => {
  it("tạo task chỉ có tiêu đề: mặc định ưu tiên Vừa, nằm ở Todo", async () => {
    const { create, me } = await setup();
    const res = await create({ name: "  Nộp báo cáo  " });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      name: "Nộp báo cáo",
      priority: "medium",
      listId: me.todo.id,
      completed: false,
      dueAt: null,
      labels: [],
      members: [],
    });
  });

  it("tạo task đủ trường", async () => {
    const { create } = await setup();
    const due = inDays(2);
    const res = await create({ name: "Ôn thi", description: "Chương 1–3", dueAt: due, priority: "high" });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ description: "Chương 1–3", dueAt: due, deadline: due, priority: "high" });
  });

  it.each([
    [{ name: "   " }, "name", "Hãy nhập tiêu đề cho task."],
    [{ name: "x".repeat(201) }, "name", "Tiêu đề tối đa 200 ký tự."],
    [{ name: "ok", description: "x".repeat(2001) }, "description", "Mô tả tối đa 2000 ký tự."],
    [{ name: "ok", priority: "urgent" }, "priority", "Độ ưu tiên phải là Cao, Vừa hoặc Thấp."],
    [{ name: "ok", dueAt: "31/02/2026" }, "dueAt", "Ngày giờ không hợp lệ."],
    [{ name: "ok", dueAt: inDays(-1) }, "dueAt", "Hạn chót phải từ bây giờ trở đi."],
  ])("từ chối dữ liệu sai %#", async (body, field, message) => {
    const { create } = await setup();
    const res = await create(body);
    expect(res.status).toBe(400);
    expect(res.body.fields[field]).toBe(message);
  });

  it("listId của board khác bị từ chối", async () => {
    const { create, loginAs } = await setup();
    const other = await loginAs("b@example.com");
    const res = await create({ name: "ok", listId: other.todo.id });
    expect(res.status).toBe(400);
  });

  it("GET /boards/cards/all trả kèm listName, boardId, boardName", async () => {
    const { create, call, me } = await setup();
    await create({ name: "Một" });
    const all = await call("GET", "/boards/cards/all", { token: me.token });
    expect(all.body).toHaveLength(1);
    expect(all.body[0]).toMatchObject({ listName: "Todo", boardId: me.board.id, boardName: "Việc của tôi" });
  });
});

describe("US3: đổi trạng thái bằng cách chuyển danh sách", () => {
  it("Todo → Doing → Done → Todo đặt completed đúng", async () => {
    const { create, update, me } = await setup();
    const { id } = (await create({ name: "Việc" })).body;

    const doing = await update(id, { listId: me.doing.id });
    expect(doing.body).toMatchObject({ listId: me.doing.id, completed: false });

    const done = await update(id, { listId: me.done.id });
    expect(done.body).toMatchObject({ listId: me.done.id, completed: true, dueComplete: true });

    const back = await update(id, { listId: me.todo.id });
    expect(back.body).toMatchObject({ completed: false, dueComplete: false });
  });

  it("chuyển sang list của board khác bị từ chối", async () => {
    const { create, update, loginAs } = await setup();
    const { id } = (await create({ name: "Việc" })).body;
    const other = await loginAs("b@example.com");
    expect((await update(id, { listId: other.done.id })).status).toBe(400);
  });

  it("tạo thẳng vào Done thì đã xong", async () => {
    const { create, me } = await setup();
    const res = await create({ name: "Xong rồi", listId: me.done.id });
    expect(res.body.completed).toBe(true);
  });
});

describe("US4: sửa và xoá", () => {
  it("sửa tên task quá hạn mà không đổi hạn vẫn được (US4 kịch bản 2)", async () => {
    const { create, update, db } = await setup();
    const { id } = (await create({ name: "Cũ", dueAt: inDays(1) })).body;
    // Giả lập task đã quá hạn.
    await db.client.execute({ sql: "UPDATE cards SET due_at = ? WHERE id = ?", args: [inDays(-2), id] });
    const res = await update(id, { name: "Mới" });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Mới");
    // Gửi lại đúng hạn cũ cũng không bị coi là thay đổi.
    const same = await update(id, { dueAt: res.body.dueAt, description: "thêm" });
    expect(same.status).toBe(200);
  });

  it("đổi sang hạn mới ở quá khứ bị từ chối", async () => {
    const { create, update } = await setup();
    const { id } = (await create({ name: "Việc", dueAt: inDays(1) })).body;
    const res = await update(id, { dueAt: inDays(-1) });
    expect(res.status).toBe(400);
    expect(res.body.fields.dueAt).toBe("Hạn chót phải từ bây giờ trở đi.");
  });

  it("bỏ hạn chót bằng null", async () => {
    const { create, update } = await setup();
    const { id } = (await create({ name: "Việc", dueAt: inDays(1) })).body;
    expect((await update(id, { dueAt: null })).body.dueAt).toBeNull();
  });

  it("xoá task rồi GET lại trả 404", async () => {
    const { create, call, me } = await setup();
    const { id } = (await create({ name: "Xoá tôi" })).body;
    const del = await call("DELETE", `/boards/${me.board.id}/cards/${id}`, { token: me.token });
    expect(del.status).toBe(200);
    expect((await call("GET", `/boards/${me.board.id}/cards/${id}`, { token: me.token })).status).toBe(404);
  });
});
