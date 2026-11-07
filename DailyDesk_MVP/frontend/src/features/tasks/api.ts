/**
 * Dữ liệu cho màn "Việc của tôi".
 * Task = thẻ (card) trên board; trạng thái = danh sách Todo / Doing / Done của board đó.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { uuidv7 } from "uuidv7";
import getConfig from "@/lib/config";
import store from "@/stores/store";
import { accessTokenAtom } from "@/stores/access-token";
import { getAccessTokenFnAtom } from "@/stores/auth";
import { ApiError, apiErrorFrom, fallbackMessage } from "@/lib/api-error";

export { ApiError };

export type Status = "todo" | "doing" | "done";
export type Priority = "high" | "medium" | "low";

export type Task = {
  id: string;
  name: string;
  description: string | null;
  dueAt: string | null;
  priority: Priority | null;
  status: Status;
  listId: string;
  listName: string;
  boardId: string;
  boardName: string;
  labels: { id: string; name: string; color: string }[];
  createdAt: string | null;
  order: number;
};

export type BoardSummary = { id: string; name: string; backgroundColor?: string | null };

export const STATUS_ORDER: Status[] = ["todo", "doing", "done"];
/**
 * Tên danh sách gửi lên backend khi phải tạo list mới. Giữ tiếng Anh để khớp
 * board seed sẵn có ("Todo" / "Doing" / "Done") — đây là dữ liệu, không phải nhãn.
 */
export const STATUS_LABEL: Record<Status, string> = { todo: "Todo", doing: "Doing", done: "Done" };
/** Nhãn hiển thị trên giao diện. Tách khỏi tên list để đổi chữ không đổi dữ liệu. */
export const STATUS_TEXT: Record<Status, string> = { todo: "Cần làm", doing: "Đang làm", done: "Xong" };
export const PRIORITY_LABEL: Record<Priority, string> = { high: "Cao", medium: "Vừa", low: "Thấp" };
export const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

async function token() {
  const current = store.get(accessTokenAtom);
  if (current) return current;
  const refresh = store.get(getAccessTokenFnAtom);
  return refresh ? refresh() : "";
}

export async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${getConfig().backendUrl}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${await token()}`,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, fallbackMessage(0));
  }
  if (!res.ok) throw await apiErrorFrom(res);
  return (await res.json().catch(() => ({}))) as T;
}

/** Tên danh sách → trạng thái. Danh sách lạ được coi là Todo. */
/**
 * Tên list để hiển thị. Ba list mặc định mang tên tiếng Anh vì đó là dữ liệu
 * theo data-model §41; màn hình thì nói tiếng Việt, nên đổi ngay chỗ in ra.
 * List do người dùng tự đặt tên giữ nguyên.
 */
export function listDisplayName(name: string): string {
  const n = name.trim().toLowerCase();
  if (n === "todo") return STATUS_TEXT.todo;
  if (n === "doing") return STATUS_TEXT.doing;
  if (n === "done") return STATUS_TEXT.done;
  return name;
}

export function statusFromList(name: string): Status {
  const n = name.trim().toLowerCase();
  if (["doing", "đang làm", "in progress"].includes(n)) return "doing";
  if (["done", "xong", "đã xong", "hoàn thành"].includes(n)) return "done";
  return "todo";
}

const TASKS_KEY = ["tasks"] as const;

export function useTasks() {
  return useQuery({
    queryKey: TASKS_KEY,
    queryFn: async () => {
      const rows = await request<any[]>("GET", "/boards/cards/all");
      return rows
        .filter((r) => !r.isTemplate)
        .map<Task>((r) => ({
          id: r.id,
          name: r.name,
          description: r.description ?? null,
          dueAt: r.dueAt ?? r.deadline ?? null,
          priority: r.priority ?? null,
          status: statusFromList(r.listName ?? ""),
          listId: r.listId,
          listName: r.listName,
          boardId: r.boardId,
          boardName: r.boardName,
          labels: r.labels ?? [],
          createdAt: r.createdAt ?? null,
          order: r.order ?? 0,
        }));
    },
  });
}

export function useBoardsSummary() {
  return useQuery({
    queryKey: ["boards-summary"],
    queryFn: async () => {
      const data = await request<{ ownedBoards: BoardSummary[]; invitedBoards: BoardSummary[] }>(
        "GET",
        "/boards",
      );
      return [...data.ownedBoards, ...data.invitedBoards].map((b) => ({
        id: b.id,
        name: b.name,
        backgroundColor: b.backgroundColor,
      }));
    },
  });
}

/** Tìm (hoặc tạo) danh sách ứng với trạng thái trong một board. */
async function listFor(boardId: string, status: Status) {
  const lists = await request<{ id: string; name: string; order: number }[]>(
    "GET",
    `/boards/${boardId}/lists`,
  );
  const found = [...lists]
    .sort((a, b) => a.order - b.order)
    .find((l) => statusFromList(l.name) === status);
  if (found) return found.id;
  const created = await request<{ id: string }>("POST", `/boards/${boardId}/lists`, {
    id: uuidv7(),
    name: STATUS_LABEL[status],
    order: lists.length,
  });
  return created.id;
}

export type TaskInput = {
  name: string;
  description: string;
  dueAt: string | null;
  priority: Priority;
  status: Status;
  boardId: string;
};

function useInvalidate() {
  const qc = useQueryClient();
  return (boardId?: string) => {
    qc.invalidateQueries({ queryKey: TASKS_KEY });
    qc.invalidateQueries({ queryKey: ["boards"] });
    if (boardId) qc.invalidateQueries({ queryKey: ["board", boardId] });
  };
}

export function useCreateTask() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (input: TaskInput) => {
      const listId = await listFor(input.boardId, input.status);
      return request<{ id: string }>("POST", `/boards/${input.boardId}/cards`, {
        id: uuidv7(),
        name: input.name,
        description: input.description || undefined,
        order: Date.now() % 1_000_000,
        listId,
        dueAt: input.dueAt ?? undefined,
        deadline: input.dueAt ?? undefined,
        priority: input.priority,
      });
    },
    onSuccess: (_d, input) => invalidate(input.boardId),
  });
}

/**
 * Cập nhật lạc quan: sửa ngay trong cache rồi mới gọi mạng, hỏng thì trả lại
 * như cũ.
 *
 * Một lần tick "xong" phải đi bốn lượt mạng nối tiếp (lấy danh sách của board,
 * PUT thẻ, rồi nạp lại tasks và boards). Chờ đủ bốn lượt mới đổi màn thì thao
 * tác nào cũng có một quãng đứng hình; sửa cache trước thì người dùng thấy
 * ngay, mạng chạy phía sau.
 */
function useOptimisticTasks() {
  const qc = useQueryClient();
  return {
    /** Trả về hàm hoàn tác để dùng trong onError. */
    apply: async (change: (rows: Task[]) => Task[]) => {
      await qc.cancelQueries({ queryKey: TASKS_KEY });
      const previous = qc.getQueryData<Task[]>(TASKS_KEY);
      if (previous) qc.setQueryData<Task[]>(TASKS_KEY, change(previous));
      return previous;
    },
    rollback: (previous: Task[] | undefined) => {
      if (previous) qc.setQueryData<Task[]>(TASKS_KEY, previous);
    },
  };
}

export function useUpdateTask() {
  const invalidate = useInvalidate();
  const optimistic = useOptimisticTasks();
  return useMutation({
    onMutate: ({ task, input }: { task: Task; input: Partial<TaskInput> }) =>
      optimistic.apply((rows) =>
        rows.map((t) =>
          t.id === task.id
            ? {
                ...t,
                name: input.name ?? t.name,
                description: input.description === undefined ? t.description : input.description || null,
                priority: input.priority ?? t.priority,
                dueAt: input.dueAt === undefined ? t.dueAt : input.dueAt,
                status: input.status ?? t.status,
              }
            : t,
        ),
      ),
    onError: (_err, _vars, previous) => optimistic.rollback(previous),
    mutationFn: async ({ task, input }: { task: Task; input: Partial<TaskInput> }) => {
      const body: Record<string, unknown> = {};
      if (input.name !== undefined) body.name = input.name;
      if (input.description !== undefined) body.description = input.description || null;
      if (input.priority !== undefined) body.priority = input.priority;
      if (input.dueAt !== undefined) {
        body.dueAt = input.dueAt;
        body.deadline = input.dueAt;
      }
      if (input.status !== undefined && input.status !== task.status) {
        body.listId = await listFor(task.boardId, input.status);
        body.completed = input.status === "done";
        body.dueComplete = input.status === "done";
      }
      return request("PUT", `/boards/${task.boardId}/cards/${task.id}`, body);
    },
    onSuccess: (_d, { task }) => invalidate(task.boardId),
  });
}

export function useDeleteTask() {
  const invalidate = useInvalidate();
  const optimistic = useOptimisticTasks();
  return useMutation({
    onMutate: (task: Task) => optimistic.apply((rows) => rows.filter((t) => t.id !== task.id)),
    onError: (_err, _task, previous) => optimistic.rollback(previous),
    mutationFn: (task: Task) => request("DELETE", `/boards/${task.boardId}/cards/${task.id}`),
    onSuccess: (_d, task) => invalidate(task.boardId),
  });
}
