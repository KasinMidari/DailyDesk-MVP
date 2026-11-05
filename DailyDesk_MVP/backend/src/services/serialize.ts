/** Đổi dòng dữ liệu sang đúng hình dạng JSON của contracts/api.md (khớp frontend/src/mocks). */
import type { activities, boards, cards, checklistItems, comments, labels, lists, users } from "../db/schema.js";

type BoardRow = typeof boards.$inferSelect;
type ListRow = typeof lists.$inferSelect;
type CardRow = typeof cards.$inferSelect;
type LabelRow = typeof labels.$inferSelect;
type ItemRow = typeof checklistItems.$inferSelect;
type CommentRow = typeof comments.$inferSelect;
type ActivityRow = typeof activities.$inferSelect;
type UserRow = typeof users.$inferSelect;
export type LabelJson = { id: string; name: string; color: string };

export function boardJson(b: BoardRow) {
  return {
    id: b.id,
    name: b.name,
    userId: b.userId,
    backgroundColor: b.backgroundColor,
    backgroundUrl: b.backgroundUrl,
    backgroundPublicId: null,
    isDefault: b.isDefault === 1,
  };
}

export function listJson(l: ListRow) {
  return { id: l.id, name: l.name, order: l.order, boardId: l.boardId };
}

export function cardJson(c: CardRow, labels: LabelJson[] = []) {
  return {
    id: c.id,
    name: c.name,
    description: c.description,
    order: c.order,
    listId: c.listId,
    priority: c.priority,
    dueAt: c.dueAt,
    deadline: c.dueAt,
    startDate: c.startDate,
    completed: c.completed === 1,
    dueComplete: c.dueComplete === 1,
    coverColor: c.coverColor,
    coverUrl: c.coverUrl,
    coverPublicId: c.coverPublicId,
    coverMode: c.coverMode,
    reminderMinutes: c.reminderMinutes,
    recurrence: c.recurrence,
    recurrenceDay: c.recurrenceDay,
    recurrenceWeekday: c.recurrenceWeekday,
    repeatFrequency: c.repeatFrequency,
    repeatInterval: c.repeatInterval,
    latitude: null,
    longitude: null,
    isTemplate: c.isTemplate === 1,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    labels,
    members: [] as unknown[],
    attachments: [] as unknown[],
  };
}

export function labelJson(l: LabelRow) {
  return { id: l.id, name: l.name, color: l.color, userId: l.userId };
}

/** Mục việc cần làm; `members` luôn rỗng vì nhóm làm việc ngoài phạm vi. */
export function checklistItemJson(i: ItemRow) {
  return {
    id: i.id,
    cardId: i.cardId,
    name: i.name,
    completed: i.completed === 1,
    order: i.order,
    members: [] as unknown[],
  };
}

/** Hai chữ đầu của tên để vẽ avatar chữ ở giao diện. */
function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(-2)
      .map((p) => p[0]!.toUpperCase())
      .join("") || "?"
  );
}

export function personJson(u: UserRow | undefined, id: string) {
  const name = u?.name ?? "Người dùng";
  return { id, name, email: u?.email ?? "", avatar: u?.avatarUrl ?? null, initials: initials(name) };
}

export function commentJson(c: CommentRow, user: UserRow | undefined) {
  return {
    id: c.id,
    cardId: c.cardId,
    userId: c.userId,
    content: c.content,
    text: c.content,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    user: personJson(user, c.userId),
  };
}

export function activityJson(a: ActivityRow, user: UserRow | undefined) {
  let metadata: unknown = null;
  if (a.metadata) {
    try {
      metadata = JSON.parse(a.metadata);
    } catch {
      metadata = a.metadata;
    }
  }
  return {
    id: a.id,
    cardId: a.cardId,
    userId: a.userId,
    actionType: a.actionType,
    activityType: a.actionType.split(".")[0],
    action: a.actionType,
    description: a.description,
    metadata,
    createdAt: a.createdAt,
    user: personJson(user, a.userId),
  };
}
