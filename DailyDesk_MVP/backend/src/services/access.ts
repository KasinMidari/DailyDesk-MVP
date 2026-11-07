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
/**
 * Tên list dùng trong dòng nhật ký. Ba list mặc định mang tên tiếng Anh vì đó
 * là dữ liệu (data-model §41), nhưng nhật ký là câu tiếng Việt người dùng đọc.
 */
export function listDisplayName(name: string): string {
  const n = name.trim().toLowerCase();
  if (n === "todo") return "Cần làm";
  if (n === "doing") return "Đang làm";
  if (n === "done") return "Xong";
  return name;
}

export function statusFromList(name: string): "todo" | "doing" | "done" {
  const n = name.trim().toLowerCase();
  if (["doing", "đang làm", "in progress"].includes(n)) return "doing";
  if (["done", "xong", "đã xong", "hoàn thành"].includes(n)) return "done";
  return "todo";
}

/**
 * Ba danh sách mọi board đều phải có.
 *
 * Trạng thái của một task chính là danh sách đang chứa nó, nên nếu board thiếu
 * một trong ba thì có trạng thái không chuyển sang được. Vì vậy board mới luôn
 * được tạo kèm cả ba và không xoá được chúng.
 */
export const DEFAULT_LISTS = ["Todo", "Doing", "Done"] as const;

export function isDefaultList(name: string): boolean {
  return DEFAULT_LISTS.some((d) => d.toLowerCase() === name.trim().toLowerCase());
}
