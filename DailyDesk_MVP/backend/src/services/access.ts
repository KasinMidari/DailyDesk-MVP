/**
 * Kiểm tra quyền sở hữu (research.md R6).
 * Tài nguyên không thuộc người gọi → 404, không bao giờ 403, để không lộ việc nó tồn tại.
 */
import { and, eq } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { boards, cards, lists } from "../db/schema.js";
import { notFound } from "../http.js";

export async function requireBoard(db: Db, userId: string, boardId: string) {
  const [board] = await db
    .select()
    .from(boards)
    .where(and(eq(boards.id, boardId), eq(boards.userId, userId)));
  if (!board) throw notFound("board");
  return board;
}

export async function requireList(db: Db, userId: string, boardId: string, listId: string) {
  await requireBoard(db, userId, boardId);
  const [list] = await db
    .select()
    .from(lists)
    .where(and(eq(lists.id, listId), eq(lists.boardId, boardId)));
  if (!list) throw notFound("danh sách");
  return list;
}

export async function requireCard(db: Db, userId: string, boardId: string, cardId: string) {
  await requireBoard(db, userId, boardId);
  const [row] = await db
    .select({ card: cards, list: lists })
    .from(cards)
    .innerJoin(lists, eq(cards.listId, lists.id))
    .where(and(eq(cards.id, cardId), eq(lists.boardId, boardId)));
  if (!row) throw notFound("task");
  return row;
}

/** Trạng thái suy ra từ tên danh sách (data-model.md). */
export function statusFromList(name: string): "todo" | "doing" | "done" {
  const n = name.trim().toLowerCase();
  if (["doing", "đang làm", "in progress"].includes(n)) return "doing";
  if (["done", "xong", "đã xong", "hoàn thành"].includes(n)) return "done";
  return "todo";
}
