import { describe, expect, it } from "vitest";
import type { Task, TaskInput } from "./api";
import { compare, groupOf, matches, validateTask, type Filters } from "./logic";

const NOW = new Date("2026-11-04T10:00:00");

function task(p: Partial<Task>): Task {
  return {
    id: p.name ?? "x",
    name: "Task",
    description: null,
    dueAt: null,
    priority: "medium",
    status: "todo",
    listId: "l",
    listName: "Todo",
    boardId: "b",
    boardName: "Board",
    labels: [],
    createdAt: "2026-11-01T00:00:00.000Z",
    order: 0,
    ...p,
  };
}
const at = (s: string) => new Date(s).toISOString();
const names = (ts: Task[]) => ts.map((t) => t.name);

describe("compare (FR-016)", () => {
  const list = [
    task({ name: "không hạn" }),
    task({ name: "xa", dueAt: at("2026-11-20T10:00:00") }),
    task({ name: "gần", dueAt: at("2026-11-05T10:00:00") }),
    task({ name: "đã xong", status: "done", dueAt: at("2026-11-04T09:00:00") }),
  ];

  it("hạn gần nhất: không hạn nằm cuối việc chưa xong, Done nằm cuối cùng", () => {
    expect(names([...list].sort(compare("deadline")))).toEqual(["gần", "xa", "không hạn", "đã xong"]);
  });

  it("hạn xa nhất: không hạn vẫn nằm cuối", () => {
    expect(names([...list].sort(compare("deadline-desc")))).toEqual(["xa", "gần", "không hạn", "đã xong"]);
  });

  it("ưu tiên: Cao > Vừa > Thấp > không có, Done vẫn cuối", () => {
    const ts = [
      task({ name: "thấp", priority: "low" }),
      task({ name: "không", priority: null }),
      task({ name: "cao xong", priority: "high", status: "done" }),
      task({ name: "cao", priority: "high" }),
      task({ name: "vừa", priority: "medium" }),
    ];
    expect(names(ts.sort(compare("priority")))).toEqual(["cao", "vừa", "thấp", "không", "cao xong"]);
  });
});

describe("matches (FR-014, FR-015)", () => {
  const base: Filters = { status: "all", q: "", priority: "all", boardId: "all" };
  const t = task({ name: "Nộp báo cáo", description: "Đồ án", status: "doing", priority: "high" });

  it("tìm không dấu, không phân biệt hoa thường", () => {
    expect(matches(t, { ...base, q: "bao cao" })).toBe(true);
    expect(matches(t, { ...base, q: "NOP BAO" })).toBe(true);
    expect(matches(t, { ...base, q: "do an" })).toBe(true);
    expect(matches(t, { ...base, q: "lịch thi" })).toBe(false);
  });

  it("lọc theo trạng thái, ưu tiên, board", () => {
    expect(matches(t, { ...base, status: "doing" })).toBe(true);
    expect(matches(t, { ...base, status: "todo" })).toBe(false);
    expect(matches(t, { ...base, priority: "low" })).toBe(false);
    expect(matches(t, { ...base, boardId: "other" })).toBe(false);
  });
});

describe("groupOf (FR-017)", () => {
  it.each([
    [task({ dueAt: at("2026-11-03T10:00:00") }), "overdue"],
    [task({ dueAt: at("2026-11-04T20:00:00") }), "today"],
    [task({ dueAt: at("2026-11-08T10:00:00") }), "week"],
    [task({ dueAt: at("2026-12-01T10:00:00") }), "later"],
    [task({ dueAt: null }), "none"],
    [task({ status: "done", dueAt: at("2026-11-01T10:00:00") }), "done"],
  ])("nhóm %#", (t, expected) => {
    expect(groupOf(t, NOW)).toBe(expected);
  });
});

describe("validateTask (FR-005, FR-007)", () => {
  const input = (p: Partial<TaskInput>): TaskInput => ({
    name: "Việc",
    description: "",
    dueAt: null,
    priority: "medium",
    status: "todo",
    boardId: "b",
    ...p,
  });

  it("hợp lệ khi chỉ có tiêu đề", () => {
    expect(validateTask(input({}), { isNew: true, now: NOW })).toEqual({});
  });

  it("báo lỗi tiêu đề trống, quá dài, mô tả quá dài", () => {
    expect(validateTask(input({ name: "   " }), { isNew: true }).name).toBe("Hãy nhập tiêu đề cho task.");
    expect(validateTask(input({ name: "x".repeat(201) }), { isNew: true }).name).toBe("Tiêu đề tối đa 200 ký tự.");
    expect(validateTask(input({ description: "x".repeat(2001) }), { isNew: true }).description).toBe(
      "Mô tả tối đa 2000 ký tự.",
    );
  });

  it("hạn quá khứ bị chặn khi tạo, nhưng không chặn khi sửa mà không đổi hạn", () => {
    const past = at("2026-11-01T10:00:00");
    expect(validateTask(input({ dueAt: past }), { isNew: true, now: NOW }).dueAt).toBe(
      "Hạn chót phải từ bây giờ trở đi.",
    );
    expect(validateTask(input({ dueAt: past }), { isNew: false, now: NOW }).dueAt).toBeUndefined();
  });

  it("ngày không hợp lệ và thiếu board", () => {
    expect(validateTask(input({ dueAt: "invalid" }), { isNew: true }).dueAt).toBe("Ngày giờ không hợp lệ.");
    expect(validateTask(input({ boardId: "" }), { isNew: true }).boardId).toBe("Chọn board để lưu task.");
  });
});
