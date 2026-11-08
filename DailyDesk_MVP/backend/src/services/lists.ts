import { asc, eq, max } from "drizzle-orm";
import { uuidv7 } from "uuidv7";
import type { Db } from "../db/client.js";
import { boards, lists } from "../db/schema.js";
import { HttpError, nowIso } from "../http.js";
import { DEFAULT_LISTS, listDisplayName, requireBoard, requireList, statusFromList } from "./access.js";
import { listJson } from "./serialize.js";

export async function listLists(db: Db, userId: string, boardId: string) {
  await requireBoard(db, userId, boardId);
  const rows = await db.select().from(lists).where(eq(lists.boardId, boardId)).orderBy(asc(lists.order));
  return rows.map(listJson);
}

export async function createList(
  db: Db,
  userId: string,
  boardId: string,
  input: { id?: string; name: string; order?: number },
) {
  await requireBoard(db, userId, boardId);
  const id = input.id ?? uuidv7();
  const [dup] = await db.select({ id: lists.id }).from(lists).where(eq(lists.id, id));
  if (dup) throw new HttpError(409, "ID danh sách đã tồn tại");
  let order = input.order;
  if (order === undefined) {
    const [m] = await db.select({ m: max(lists.order) }).from(lists).where(eq(lists.boardId, boardId));
    order = (m?.m ?? -1) + 1;
  }
  const now = nowIso();
  const [row] = await db
    .insert(lists)
    .values({ id, boardId, name: input.name, order, createdAt: now, updatedAt: now })
    .returning();
  return listJson(row!);
}

export async function getList(db: Db, userId: string, boardId: string, listId: string) {
  return listJson(await requireList(db, userId, boardId, listId));
}

export async function updateList(
  db: Db,
  userId: string,
  boardId: string,
  listId: string,
  input: { name?: string; order?: number },
) {
  const current = await requireList(db, userId, boardId, listId);
  // Đổi tên sang nghĩa khác chỉ cấm khi đây là danh sách cuối cùng còn mang
  // trạng thái đó: "Done" thành "Xong" vẫn là xong nên không sao, nhưng
  // "Done" thành "Ghi chú" thì mọi task đã xong lặng lẽ quay về Cần làm.
  if (input.name !== undefined && statusFromList(input.name) !== statusFromList(current.name)) {
    await requireAnotherListWithSameStatus(db, boardId, current, "đổi tên");
  }
  const [row] = await db
    .update(lists)
    .set({ ...input, updatedAt: nowIso() })
    .where(eq(lists.id, listId))
    .returning();
  return listJson(row!);
}

export async function deleteList(db: Db, userId: string, boardId: string, listId: string) {
  const current = await requireList(db, userId, boardId, listId);
  await requireAnotherListWithSameStatus(db, boardId, current, "xoá");
  await db.delete(lists).where(eq(lists.id, listId));
  return { message: "Đã xoá danh sách" };
}

/**
 * Mỗi board phải luôn còn ít nhất một danh sách cho mỗi trạng thái.
 *
 * Khoá theo TRẠNG THÁI chứ không theo tên: nếu chỉ cấm đúng ba chữ
 * Todo/Doing/Done thì đổi "Done" thành "Xong" (vẫn hợp lệ, cùng trạng thái)
 * rồi xoá là lọt, và board mất hẳn chỗ để đánh dấu task xong.
 */
async function requireAnotherListWithSameStatus(
  db: Db,
  boardId: string,
  current: { id: string; name: string },
  action: string,
) {
  const status = statusFromList(current.name);
  const siblings = await db.select().from(lists).where(eq(lists.boardId, boardId));
  const others = siblings.filter((l) => l.id !== current.id && statusFromList(l.name) === status);
  if (others.length > 0) return;
  throw new HttpError(
    400,
    `Không ${action} được "${listDisplayName(current.name)}": đây là danh sách duy nhất còn mang trạng thái ` +
      `"${STATUS_LABEL[status]}". Mỗi board phải giữ đủ ba trạng thái.`,
  );
}

const STATUS_LABEL = { todo: "To-do", doing: "Doing", done: "Done" } as const;

/**
 * Vá những board tạo từ trước khi có quy tắc "board nào cũng đủ ba trạng thái".
 *
 * Board thiếu danh sách Done thì không có chỗ nào để đánh dấu task xong, và
 * người dùng chỉ nhận được một thông báo lỗi. Chạy một lần lúc khởi động để
 * dữ liệu cũ cũng về đúng trạng thái như board mới.
 */
export async function backfillDefaultLists(db: Db) {
  const allBoards = await db.select({ id: boards.id }).from(boards);
  const allLists = await db.select().from(lists);
  const byBoard = new Map<string, typeof allLists>();
  for (const l of allLists) byBoard.set(l.boardId, [...(byBoard.get(l.boardId) ?? []), l]);

  const now = nowIso();
  let added = 0;
  for (const b of allBoards) {
    const mine = byBoard.get(b.id) ?? [];
    const covered = new Set(mine.map((l) => statusFromList(l.name)));
    let order = mine.reduce((m, l) => Math.max(m, l.order ?? 0), -1);
    for (const name of DEFAULT_LISTS) {
      if (covered.has(statusFromList(name))) continue;
      order += 1;
      await db.insert(lists).values({ id: uuidv7(), boardId: b.id, name, order, createdAt: now, updatedAt: now });
      covered.add(statusFromList(name));
      added += 1;
    }
  }
  return added;
}