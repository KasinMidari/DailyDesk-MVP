import { asc, eq, max } from "drizzle-orm";
import { uuidv7 } from "uuidv7";
import type { Db } from "../db/client.js";
import { lists } from "../db/schema.js";
import { HttpError, nowIso } from "../http.js";
import { requireBoard, requireList } from "./access.js";
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
  await requireList(db, userId, boardId, listId);
  const [row] = await db
    .update(lists)
    .set({ ...input, updatedAt: nowIso() })
    .where(eq(lists.id, listId))
    .returning();
  return listJson(row!);
}

export async function deleteList(db: Db, userId: string, boardId: string, listId: string) {
  await requireList(db, userId, boardId, listId);
  await db.delete(lists).where(eq(lists.id, listId));
  return { message: "Đã xoá danh sách" };
}
