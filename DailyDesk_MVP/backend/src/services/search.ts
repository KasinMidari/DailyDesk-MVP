/** Tìm kiếm board / list / card của người gọi (T055), so khớp bỏ dấu tiếng Việt. */
import { asc, eq, inArray } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { boards, cards, lists } from "../db/schema.js";
import { labelsByCard } from "./boards.js";

export type SearchType = "board" | "list" | "card";

/** Bỏ dấu và hạ chữ thường để "hop" khớp "họp" (giống frontend src/features/tasks/logic.ts). */
export function strip(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

export type SearchOptions = { q: string; types: SearchType[]; boardId?: string; limit: number };

export async function search(db: Db, userId: string, opts: SearchOptions) {
  const q = strip(opts.q.trim());
  const want = (t: SearchType) => opts.types.length === 0 || opts.types.includes(t);
  const results: Record<string, unknown>[] = [];
  if (!q) return { results, total: 0, query: opts.q.trim() };

  const hit = (s: string | null | undefined) => typeof s === "string" && strip(s).includes(q);

  const ownBoards = (
    await db.select().from(boards).where(eq(boards.userId, userId)).orderBy(asc(boards.createdAt))
  ).filter((b) => !opts.boardId || b.id === opts.boardId);
  if (ownBoards.length === 0) return { results, total: 0, query: opts.q.trim() };

  const boardName = new Map(ownBoards.map((b) => [b.id, b.name]));
  const listRows = await db
    .select()
    .from(lists)
    .where(inArray(lists.boardId, ownBoards.map((b) => b.id)))
    .orderBy(asc(lists.order));
  const cardRows = listRows.length
    ? await db
        .select()
        .from(cards)
        .where(inArray(cards.listId, listRows.map((l) => l.id)))
        .orderBy(asc(cards.order))
    : [];

  if (want("board")) {
    for (const b of ownBoards.filter((b) => hit(b.name)).slice(0, opts.limit)) {
      results.push({
        type: "board",
        id: b.id,
        name: b.name,
        description: null,
        isFavorite: false,
        background: b.backgroundUrl ?? b.backgroundColor ?? null,
        createdAt: b.createdAt,
      });
    }
  }

  if (want("list")) {
    for (const l of listRows.filter((l) => hit(l.name)).slice(0, opts.limit)) {
      results.push({
        type: "list",
        id: l.id,
        name: l.name,
        boardId: l.boardId,
        boardName: boardName.get(l.boardId) ?? null,
        position: l.order,
        cardCount: cardRows.filter((c) => c.listId === l.id).length,
      });
    }
  }

  if (want("card")) {
    const matched = cardRows.filter((c) => hit(c.name) || hit(c.description)).slice(0, opts.limit);
    const lbl = await labelsByCard(db, matched.map((c) => c.id));
    const listById = new Map(listRows.map((l) => [l.id, l]));
    for (const c of matched) {
      const list = listById.get(c.listId)!;
      results.push({
        type: "card",
        id: c.id,
        title: c.name,
        name: c.name,
        description: c.description,
        boardId: list.boardId,
        boardName: boardName.get(list.boardId) ?? null,
        listId: list.id,
        listName: list.name,
        position: c.order,
        dueDate: c.dueAt,
        isCompleted: c.completed === 1,
        labels: lbl.get(c.id) ?? [],
      });
    }
  }

  return { results, total: results.length, query: opts.q.trim() };
}
