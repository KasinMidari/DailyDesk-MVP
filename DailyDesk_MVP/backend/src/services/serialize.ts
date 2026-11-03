/** Đổi dòng dữ liệu sang đúng hình dạng JSON của contracts/api.md (khớp frontend/src/mocks). */
import type { boards, cards, lists } from "../db/schema.js";

type BoardRow = typeof boards.$inferSelect;
type ListRow = typeof lists.$inferSelect;
type CardRow = typeof cards.$inferSelect;
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
