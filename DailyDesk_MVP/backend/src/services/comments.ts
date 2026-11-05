/** Bình luận, hoạt động và dòng thời gian của task (T054). */
import { and, asc, eq, inArray } from "drizzle-orm";
import { uuidv7 } from "uuidv7";
import type { Db } from "../db/client.js";
import { activities, comments, users } from "../db/schema.js";
import { HttpError, notFound, nowIso } from "../http.js";
import { requireCard } from "./access.js";
import { activityJson, commentJson } from "./serialize.js";

/** userId → bản ghi user, để đính kèm `user` vào mỗi mục. */
async function peopleByIds(db: Db, ids: string[]) {
  const map = new Map<string, typeof users.$inferSelect>();
  const unique = [...new Set(ids)];
  if (unique.length === 0) return map;
  const rows = await db.select().from(users).where(inArray(users.id, unique));
  for (const u of rows) map.set(u.id, u);
  return map;
}

export async function listComments(db: Db, userId: string, boardId: string, cardId: string) {
  await requireCard(db, userId, boardId, cardId);
  const rows = await db.select().from(comments).where(eq(comments.cardId, cardId)).orderBy(asc(comments.createdAt));
  const people = await peopleByIds(db, rows.map((r) => r.userId));
  return rows.map((r) => commentJson(r, people.get(r.userId)));
}

export async function createComment(db: Db, userId: string, boardId: string, cardId: string, content: string) {
  await requireCard(db, userId, boardId, cardId);
  const now = nowIso();
  const [row] = await db
    .insert(comments)
    .values({ id: uuidv7(), cardId, userId, content, createdAt: now, updatedAt: now })
    .returning();
  const people = await peopleByIds(db, [userId]);
  return commentJson(row!, people.get(userId));
}

/** Bình luận của người khác: 403 (ngoại lệ duy nhất so với quy tắc 404). */
async function requireOwnComment(db: Db, userId: string, cardId: string, commentId: string, verb: string) {
  const [row] = await db
    .select()
    .from(comments)
    .where(and(eq(comments.id, commentId), eq(comments.cardId, cardId)));
  if (!row) throw notFound("bình luận");
  if (row.userId !== userId) throw new HttpError(403, `Bạn chỉ ${verb} được bình luận của mình`);
  return row;
}

export async function updateComment(
  db: Db,
  userId: string,
  boardId: string,
  cardId: string,
  commentId: string,
  content: string,
) {
  await requireCard(db, userId, boardId, cardId);
  await requireOwnComment(db, userId, cardId, commentId, "sửa");
  const [row] = await db
    .update(comments)
    .set({ content, updatedAt: nowIso() })
    .where(eq(comments.id, commentId))
    .returning();
  const people = await peopleByIds(db, [userId]);
  return commentJson(row!, people.get(userId));
}

export async function deleteComment(db: Db, userId: string, boardId: string, cardId: string, commentId: string) {
  await requireCard(db, userId, boardId, cardId);
  await requireOwnComment(db, userId, cardId, commentId, "xoá");
  await db.delete(comments).where(eq(comments.id, commentId));
  return { message: "Đã xoá bình luận" };
}

export async function listActivities(db: Db, userId: string, boardId: string, cardId: string) {
  await requireCard(db, userId, boardId, cardId);
  const rows = await db
    .select()
    .from(activities)
    .where(eq(activities.cardId, cardId))
    .orderBy(asc(activities.createdAt));
  const people = await peopleByIds(db, rows.map((r) => r.userId));
  return rows.map((r) => activityJson(r, people.get(r.userId)));
}

/** Bình luận + hoạt động trộn chung, mới nhất trước, mỗi mục có `type`. */
export async function listTimeline(db: Db, userId: string, boardId: string, cardId: string) {
  const [cmts, acts] = await Promise.all([
    listComments(db, userId, boardId, cardId),
    listActivities(db, userId, boardId, cardId),
  ]);
  const items = [
    ...cmts.map((c) => ({ ...c, type: "comment" as const })),
    ...acts.map((a) => ({ ...a, type: "activity" as const })),
  ];
  items.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  return items;
}
