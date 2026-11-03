import { and, asc, eq, inArray, max } from "drizzle-orm";
import { uuidv7 } from "uuidv7";
import type { z } from "zod";
import type { Db } from "../db/client.js";
import { activities, boards, cardLabels, cards, labels, lists } from "../db/schema.js";
import { HttpError, nowIso } from "../http.js";
import { assertDueNotPast, MSG, type createCardSchema, type updateCardSchema } from "../validation.js";
import { requireBoard, requireCard, statusFromList } from "./access.js";
import { labelsByCard } from "./boards.js";
import { cardJson } from "./serialize.js";

type CreateInput = z.output<typeof createCardSchema>;
type UpdateInput = z.output<typeof updateCardSchema>;

const bool = (v: boolean | null | undefined) => (v ? 1 : 0);

async function logActivity(db: Db, cardId: string, userId: string, actionType: string, description: string) {
  await db.insert(activities).values({ id: uuidv7(), cardId, userId, actionType, description, createdAt: nowIso() });
}

/** List đích phải nằm trong đúng board của đường dẫn. */
async function listInBoard(db: Db, boardId: string, listId: string) {
  const [list] = await db.select().from(lists).where(and(eq(lists.id, listId), eq(lists.boardId, boardId)));
  if (!list) throw new HttpError(400, "Dữ liệu chưa hợp lệ", { listId: "Danh sách không thuộc board này." });
  return list;
}

/** Gán lại toàn bộ nhãn; nhãn phải thuộc cùng người dùng. */
async function setLabels(db: Db, userId: string, cardId: string, labelIds: string[]) {
  await db.delete(cardLabels).where(eq(cardLabels.cardId, cardId));
  if (labelIds.length === 0) return;
  const owned = await db
    .select({ id: labels.id })
    .from(labels)
    .where(and(inArray(labels.id, labelIds), eq(labels.userId, userId)));
  if (owned.length) await db.insert(cardLabels).values(owned.map((l) => ({ cardId, labelId: l.id })));
}

async function toJson(db: Db, row: typeof cards.$inferSelect) {
  const lbl = await labelsByCard(db, [row.id]);
  return cardJson(row, lbl.get(row.id) ?? []);
}

function assertStartBeforeDue(start: string | null | undefined, due: string | null | undefined) {
  if (start && due && new Date(start) > new Date(due)) {
    throw new HttpError(400, "Dữ liệu chưa hợp lệ", { startDate: MSG.startAfterDue });
  }
}

export async function createCard(db: Db, userId: string, boardId: string, input: CreateInput) {
  await requireBoard(db, userId, boardId);
  const list = await listInBoard(db, boardId, input.listId);
  const dueAt = input.dueAt ?? input.deadline ?? null;
  assertDueNotPast(dueAt);
  assertStartBeforeDue(input.startDate, dueAt);

  const id = input.id ?? uuidv7();
  const [dup] = await db.select({ id: cards.id }).from(cards).where(eq(cards.id, id));
  if (dup) throw new HttpError(409, "ID task đã tồn tại");

  let order = input.order;
  if (order === undefined) {
    const [m] = await db.select({ m: max(cards.order) }).from(cards).where(eq(cards.listId, list.id));
    order = (m?.m ?? -1) + 1;
  }
  const done = statusFromList(list.name) === "done";
  const now = nowIso();
  const [row] = await db
    .insert(cards)
    .values({
      id,
      listId: list.id,
      name: input.name,
      description: input.description || null,
      dueAt,
      startDate: input.startDate ?? null,
      priority: input.priority ?? "medium",
      completed: done ? 1 : 0,
      dueComplete: done ? 1 : 0,
      order,
      coverColor: input.coverColor ?? null,
      coverUrl: input.coverUrl || null,
      coverMode: input.coverMode ?? null,
      reminderMinutes: input.reminderMinutes ?? null,
      repeatFrequency: input.repeatFrequency ?? null,
      repeatInterval: input.repeatInterval ?? null,
      recurrence: input.recurrence ?? null,
      recurrenceDay: input.recurrenceDay ?? null,
      recurrenceWeekday: input.recurrenceWeekday ?? null,
      isTemplate: bool(input.isTemplate),
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  if (input.labels?.length) await setLabels(db, userId, id, input.labels.map((l) => l.id));
  await logActivity(db, id, userId, "card.created", `đã tạo task trong ${list.name}`);
  return toJson(db, row!);
}

export async function getCard(db: Db, userId: string, boardId: string, cardId: string) {
  const { card } = await requireCard(db, userId, boardId, cardId);
  return toJson(db, card);
}

export async function listBoardCards(db: Db, userId: string, boardId: string) {
  await requireBoard(db, userId, boardId);
  const rows = await db
    .select({ card: cards })
    .from(cards)
    .innerJoin(lists, eq(cards.listId, lists.id))
    .where(eq(lists.boardId, boardId))
    .orderBy(asc(lists.order), asc(cards.order));
  const lbl = await labelsByCard(db, rows.map((r) => r.card.id));
  return rows.map((r) => cardJson(r.card, lbl.get(r.card.id) ?? []));
}

/** Màn "Việc của tôi": mọi task của người gọi, kèm tên list/board. */
export async function listAllCards(db: Db, userId: string) {
  const rows = await db
    .select({ card: cards, listName: lists.name, boardId: boards.id, boardName: boards.name })
    .from(cards)
    .innerJoin(lists, eq(cards.listId, lists.id))
    .innerJoin(boards, eq(lists.boardId, boards.id))
    .where(eq(boards.userId, userId))
    .orderBy(asc(boards.createdAt), asc(lists.order), asc(cards.order));
  const lbl = await labelsByCard(db, rows.map((r) => r.card.id));
  return rows.map((r) => ({
    ...cardJson(r.card, lbl.get(r.card.id) ?? []),
    listName: r.listName,
    boardId: r.boardId,
    boardName: r.boardName,
  }));
}

export async function updateCard(db: Db, userId: string, boardId: string, cardId: string, input: UpdateInput) {
  const { card, list } = await requireCard(db, userId, boardId, cardId);
  const patch: Partial<typeof cards.$inferInsert> = {};

  if (input.name !== undefined) patch.name = input.name;
  if (input.description !== undefined) patch.description = input.description || null;
  if (input.priority !== undefined) patch.priority = input.priority;
  if (input.order !== undefined) patch.order = input.order;

  // Hạn chót: `deadline` là bí danh của `dueAt`; chỉ chặn quá khứ khi giá trị thay đổi.
  const nextDue = input.dueAt !== undefined ? input.dueAt : input.deadline;
  if (nextDue !== undefined) {
    assertDueNotPast(nextDue, card.dueAt);
    patch.dueAt = nextDue;
  }
  if (input.startDate !== undefined) patch.startDate = input.startDate;
  assertStartBeforeDue(patch.startDate ?? card.startDate, patch.dueAt !== undefined ? patch.dueAt : card.dueAt);

  for (const k of [
    "coverColor",
    "coverMode",
    "reminderMinutes",
    "repeatFrequency",
    "repeatInterval",
    "recurrence",
    "recurrenceDay",
    "recurrenceWeekday",
  ] as const) {
    if (input[k] !== undefined) (patch as Record<string, unknown>)[k] = input[k];
  }
  if (input.coverUrl !== undefined) patch.coverUrl = input.coverUrl || null;
  if (input.isTemplate !== undefined) patch.isTemplate = bool(input.isTemplate);
  if (input.completed !== undefined && input.completed !== null) patch.completed = bool(input.completed);
  if (input.dueComplete !== undefined && input.dueComplete !== null) patch.dueComplete = bool(input.dueComplete);

  // Đổi list = đổi trạng thái; completed theo list đích (data-model.md, State transitions).
  let movedTo: string | null = null;
  if (input.listId !== undefined && input.listId !== card.listId) {
    const target = await listInBoard(db, boardId, input.listId);
    patch.listId = target.id;
    const done = statusFromList(target.name) === "done";
    patch.completed = done ? 1 : 0;
    patch.dueComplete = done ? 1 : 0;
    movedTo = target.name;
  }

  patch.updatedAt = nowIso();
  const [row] = await db.update(cards).set(patch).where(eq(cards.id, cardId)).returning();
  if (input.labels !== undefined) await setLabels(db, userId, cardId, (input.labels ?? []).map((l) => l.id));

  if (movedTo) await logActivity(db, cardId, userId, "card.moved", `đã chuyển từ ${list.name} sang ${movedTo}`);
  if (input.name !== undefined && input.name !== card.name) {
    await logActivity(db, cardId, userId, "card.renamed", `đã đổi tên thành "${input.name}"`);
  }
  if (patch.dueAt !== undefined && patch.dueAt !== card.dueAt) {
    await logActivity(db, cardId, userId, "deadline.changed", patch.dueAt ? "đã đổi hạn chót" : "đã bỏ hạn chót");
  }
  return toJson(db, row!);
}

export async function deleteCard(db: Db, userId: string, boardId: string, cardId: string) {
  await requireCard(db, userId, boardId, cardId);
  await db.delete(cards).where(eq(cards.id, cardId));
  return { message: "Đã xoá task" };
}
