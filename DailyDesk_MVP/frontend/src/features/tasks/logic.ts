/** Lọc, sắp xếp, nhóm và kiểm tra dữ liệu task. Hàm thuần, dễ viết unit test. */
import { PRIORITY_RANK, type Priority, type Status, type Task, type TaskInput } from "./api";

export type SortKey = "deadline" | "deadline-desc" | "priority" | "newest";

export type Filters = {
  status: Status | "all";
  q: string;
  priority: Priority | "all";
  boardId: string | "all";
};

function strip(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();
}

export function matches(task: Task, f: Filters) {
  if (f.status !== "all" && task.status !== f.status) return false;
  if (f.priority !== "all" && task.priority !== f.priority) return false;
  if (f.boardId !== "all" && task.boardId !== f.boardId) return false;
  const q = strip(f.q.trim());
  if (q && !strip(`${task.name} ${task.description ?? ""}`).includes(q)) return false;
  return true;
}

const time = (iso: string | null) => (iso ? new Date(iso).getTime() : null);

/** Task không có hạn luôn nằm cuối, dù sắp tăng hay giảm. */
export function compare(sort: SortKey) {
  return (a: Task, b: Task) => {
    // Việc đã xong luôn xuống cuối để việc cần làm nổi lên trên.
    const da = a.status === "done" ? 1 : 0;
    const db = b.status === "done" ? 1 : 0;
    if (da !== db) return da - db;
    if (sort === "priority") {
      const pa = a.priority ? PRIORITY_RANK[a.priority] : 3;
      const pb = b.priority ? PRIORITY_RANK[b.priority] : 3;
      if (pa !== pb) return pa - pb;
    }
    if (sort === "newest") {
      return (time(b.createdAt) ?? 0) - (time(a.createdAt) ?? 0);
    }
    const ta = time(a.dueAt);
    const tb = time(b.dueAt);
    if (ta === null && tb === null) return a.name.localeCompare(b.name, "vi");
    if (ta === null) return 1;
    if (tb === null) return -1;
    return sort === "deadline-desc" ? tb - ta : ta - tb;
  };
}

export function isOverdue(task: Task, now = new Date()) {
  return task.status !== "done" && !!task.dueAt && new Date(task.dueAt) < now;
}

export type FieldErrors = Partial<Record<"name" | "description" | "dueAt" | "boardId", string>>;

export function validateTask(input: TaskInput, opts: { isNew: boolean; now?: Date }): FieldErrors {
  const errors: FieldErrors = {};
  const name = input.name.trim();
  if (!name) errors.name = "Hãy nhập tiêu đề cho task.";
  else if (name.length > 200) errors.name = "Tiêu đề tối đa 200 ký tự.";
  if (input.description.length > 2000) errors.description = "Mô tả tối đa 2000 ký tự.";
  if (input.dueAt) {
    const due = new Date(input.dueAt);
    if (Number.isNaN(due.getTime())) errors.dueAt = "Ngày giờ không hợp lệ.";
    else if (opts.isNew && due < (opts.now ?? new Date())) errors.dueAt = "Hạn chót phải từ bây giờ trở đi.";
  }
  if (!input.boardId) errors.boardId = "Chọn board để lưu task.";
  return errors;
}
