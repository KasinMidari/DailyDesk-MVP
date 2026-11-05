/** Mục việc cần làm trong task (T052, contracts/api.md nhóm B). */
import { and, asc, eq, max } from "drizzle-orm";
import { uuidv7 } from "uuidv7";
import type { z } from "zod";
import type { Db } from "../db/client.js";
import { checklistItems } from "../db/schema.js";
import { HttpError, notFound, nowIso } from "../http.js";
import type { createChecklistItemSchema, updateChecklistItemSchema } from "../validation.js";
import { requireCard } from "./access.js";
import { checklistItemJson } from "./serialize.js";

type CreateInput = z.output<typeof createChecklistItemSchema>;
type UpdateInput = z.output<typeof updateChecklistItemSchema>;

/** Mục phải thuộc đúng card của người gọi, nếu không thì 404. */
async function requireItem(db: Db, userId: string, boardId: string, cardId: string, itemId: string) {
  await requireCard(db, userId, boardId, cardId);
  const [item] = await db
    .select()
    .from(checklistItems)
    .where(and(eq(checklistItems.id, itemId), eq(checklistItems.cardId, cardId)));
  if (!item) throw notFound("mục");
  return item;
}

export async function listItems(db: Db, userId: string, boardId: string, cardId: string) {
  await requireCard(db, userId, boardId, cardId);
  const rows = await db
    .select()
    .from(checklistItems)
    .where(eq(checklistItems.cardId, cardId))
    .orderBy(asc(checklistItems.order), asc(checklistItems.createdAt));
  return rows.map(checklistItemJson);
}

export async function createItem(db: Db, userId: string, boardId: string, cardId: string, input: CreateInput) {
  await requireCard(db, userId, boardId, cardId);
  const id = input.id ?? uuidv7();
  const [dup] = await db.select({ id: checklistItems.id }).from(checklistItems).where(eq(checklistItems.id, id));
  if (dup) throw new HttpError(409, "ID mục đã tồn tại");

  let order = input.order;
  if (order === undefined) {
    const [m] = await db
      .select({ m: max(checklistItems.order) })
      .from(checklistItems)
      .where(eq(checklistItems.cardId, cardId));
    order = (m?.m ?? -1) + 1;
  }
  const now = nowIso();
  const [row] = await db
    .insert(checklistItems)
    .values({
      id,
      cardId,
      name: input.name,
      completed: input.completed ? 1 : 0,
      order,
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  return checklistItemJson(row!);
}

export async function getItem(db: Db, userId: string, boardId: string, cardId: string, itemId: string) {
  return checklistItemJson(await requireItem(db, userId, boardId, cardId, itemId));
}

export async function updateItem(
  db: Db,
  userId: string,
  boardId: string,
  cardId: string,
  itemId: string,
  input: UpdateInput,
) {
  await requireItem(db, userId, boardId, cardId, itemId);
  const patch: Partial<typeof checklistItems.$inferInsert> = { updatedAt: nowIso() };
  if (input.name !== undefined) patch.name = input.name;
  if (input.completed !== undefined) patch.completed = input.completed ? 1 : 0;
  if (input.order !== undefined) patch.order = input.order;
  const [row] = await db.update(checklistItems).set(patch).where(eq(checklistItems.id, itemId)).returning();
  return checklistItemJson(row!);
}

export async function deleteItem(db: Db, userId: string, boardId: string, cardId: string, itemId: string) {
  await requireItem(db, userId, boardId, cardId, itemId);
  await db.delete(checklistItems).where(eq(checklistItems.id, itemId));
  return { message: "Đã xoá mục" };
}
