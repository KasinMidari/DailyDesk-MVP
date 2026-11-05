/** Nhãn theo người dùng (T053). `:userId` trong đường dẫn bị bỏ qua: luôn là người gọi. */
import { and, asc, eq } from "drizzle-orm";
import { uuidv7 } from "uuidv7";
import type { z } from "zod";
import type { Db } from "../db/client.js";
import { labels } from "../db/schema.js";
import { HttpError, notFound, nowIso } from "../http.js";
import type { createLabelSchema, updateLabelSchema } from "../validation.js";
import { labelJson } from "./serialize.js";

type CreateInput = z.output<typeof createLabelSchema>;
type UpdateInput = z.output<typeof updateLabelSchema>;

async function requireLabel(db: Db, userId: string, labelId: string) {
  const [row] = await db
    .select()
    .from(labels)
    .where(and(eq(labels.id, labelId), eq(labels.userId, userId)));
  if (!row) throw notFound("nhãn");
  return row;
}

export async function listLabels(db: Db, userId: string) {
  const rows = await db.select().from(labels).where(eq(labels.userId, userId)).orderBy(asc(labels.createdAt));
  return rows.map(labelJson);
}

export async function createLabel(db: Db, userId: string, input: CreateInput) {
  const id = input.id ?? uuidv7();
  const [dup] = await db.select({ id: labels.id }).from(labels).where(eq(labels.id, id));
  if (dup) throw new HttpError(409, "ID nhãn đã tồn tại");
  const now = nowIso();
  const [row] = await db
    .insert(labels)
    .values({ id, userId, name: input.name, color: input.color, createdAt: now, updatedAt: now })
    .returning();
  return labelJson(row!);
}

export async function updateLabel(db: Db, userId: string, labelId: string, input: UpdateInput) {
  await requireLabel(db, userId, labelId);
  const [row] = await db
    .update(labels)
    .set({ ...input, updatedAt: nowIso() })
    .where(eq(labels.id, labelId))
    .returning();
  return labelJson(row!);
}

/** Xoá nhãn: khoá ngoại tự bỏ nhãn khỏi mọi task (card_labels cascade). */
export async function deleteLabel(db: Db, userId: string, labelId: string) {
  await requireLabel(db, userId, labelId);
  await db.delete(labels).where(eq(labels.id, labelId));
  return { message: "Đã xoá nhãn" };
}
