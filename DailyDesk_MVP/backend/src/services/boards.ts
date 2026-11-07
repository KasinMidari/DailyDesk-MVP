import { and, asc, eq, inArray } from "drizzle-orm";
import { uuidv7 } from "uuidv7";
import type { Db } from "../db/client.js";
import { boards, cardLabels, cards, labels, lists } from "../db/schema.js";
import { HttpError, nowIso } from "../http.js";
import { DEFAULT_LISTS, requireBoard } from "./access.js";
import { boardJson, cardJson, listJson, type LabelJson } from "./serialize.js";

/** Nhãn của nhiều card một lượt: cardId → nhãn. */
export async function labelsByCard(db: Db, cardIds: string[]) {
  const map = new Map<string, LabelJson[]>();
  if (cardIds.length === 0) return map;
  const rows = await db
    .select({ cardId: cardLabels.cardId, id: labels.id, name: labels.name, color: labels.color })
    .from(cardLabels)
    .innerJoin(labels, eq(cardLabels.labelId, labels.id))
    .where(inArray(cardLabels.cardId, cardIds));
  for (const r of rows) {
    const arr = map.get(r.cardId) ?? [];
    arr.push({ id: r.id, name: r.name, color: r.color });
    map.set(r.cardId, arr);
  }
  return map;
}

/** Board kèm lists[].cards[] sắp theo order. */
async function withLists(db: Db, boardRows: (typeof boards.$inferSelect)[]) {
  if (boardRows.length === 0) return [];
  const boardIds = boardRows.map((b) => b.id);
  const listRows = await db.select().from(lists).where(inArray(lists.boardId, boardIds)).orderBy(asc(lists.order));
  const listIds = listRows.map((l) => l.id);
  const cardRows = listIds.length
    ? await db.select().from(cards).where(inArray(cards.listId, listIds)).orderBy(asc(cards.order))
    : [];
  const lbl = await labelsByCard(db, cardRows.map((c) => c.id));
  return boardRows.map((b) => ({
    ...boardJson(b),
    lists: listRows
      .filter((l) => l.boardId === b.id)
      .map((l) => ({
        ...listJson(l),
        cards: cardRows.filter((c) => c.listId === l.id).map((c) => cardJson(c, lbl.get(c.id) ?? [])),
      })),
  }));
}

export async function listBoards(db: Db, userId: string) {
  const rows = await db.select().from(boards).where(eq(boards.userId, userId)).orderBy(asc(boards.createdAt));
  return { ownedBoards: await withLists(db, rows), invitedBoards: [] as unknown[] };
}

export async function getBoard(db: Db, userId: string, boardId: string) {
  const board = await requireBoard(db, userId, boardId);
  const [full] = await withLists(db, [board]);
  return full!;
}

export async function createBoard(
  db: Db,
  userId: string,
  input: { id?: string; name: string; backgroundColor?: string | null; backgroundUrl?: string | null },
) {
  const id = input.id ?? uuidv7();
  const [dup] = await db.select({ id: boards.id }).from(boards).where(eq(boards.id, id));
  if (dup) throw new HttpError(409, "ID board đã tồn tại");
  const now = nowIso();
  const [row] = await db
    .insert(boards)
    .values({
      id,
      userId,
      name: input.name,
      backgroundColor: input.backgroundColor ?? null,
      backgroundUrl: input.backgroundUrl || null,
      isDefault: 0,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  // Board mới luôn có sẵn Todo/Doing/Done: trạng thái của task là danh sách
  // chứa nó, nên board trống không có chỗ nào để chuyển task sang.
  await db.insert(lists).values(
    DEFAULT_LISTS.map((name, order) => ({
      id: uuidv7(),
      boardId: id,
      name,
      order,
      createdAt: now,
      updatedAt: now,
    })),
  );

  return boardJson(row!);
}

export async function updateBoard(
  db: Db,
  userId: string,
  boardId: string,
  input: { name?: string; backgroundColor?: string | null; backgroundUrl?: string | null },
) {
  await requireBoard(db, userId, boardId);
  const [row] = await db
    .update(boards)
    .set({ ...input, updatedAt: nowIso() })
    .where(and(eq(boards.id, boardId), eq(boards.userId, userId)))
    .returning();
  return boardJson(row!);
}

export async function deleteBoard(db: Db, userId: string, boardId: string) {
  const board = await requireBoard(db, userId, boardId);
  if (board.isDefault === 1) throw new HttpError(403, "Không thể xoá board mặc định");
  await db.delete(boards).where(eq(boards.id, boardId));
  return { message: "Đã xoá board" };
}
