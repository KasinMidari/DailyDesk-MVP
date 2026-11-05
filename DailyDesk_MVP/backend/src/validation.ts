/**
 * Quy tắc kiểm tra dữ liệu (FR-005, FR-007, data-model.md).
 * Thông báo giữ đúng câu chữ của frontend (src/features/tasks/logic.ts).
 */
import { z } from "zod";
import { HttpError } from "./http.js";

export const MSG = {
  nameRequired: "Hãy nhập tiêu đề cho task.",
  nameTooLong: "Tiêu đề tối đa 200 ký tự.",
  descTooLong: "Mô tả tối đa 2000 ký tự.",
  dueInvalid: "Ngày giờ không hợp lệ.",
  duePast: "Hạn chót phải từ bây giờ trở đi.",
  priority: "Độ ưu tiên phải là Cao, Vừa hoặc Thấp.",
  boardName: "Tên board từ 1 đến 100 ký tự.",
  listName: "Tên danh sách từ 1 đến 100 ký tự.",
  startAfterDue: "Ngày bắt đầu không được sau hạn chót.",
  color: "Màu phải có dạng #RRGGBB.",
  itemRequired: "Hãy nhập nội dung việc cần làm.",
  itemTooLong: "Nội dung tối đa 200 ký tự.",
  labelName: "Tên nhãn từ 1 đến 50 ký tự.",
  commentRequired: "Hãy nhập nội dung bình luận.",
  commentTooLong: "Bình luận tối đa 5000 ký tự.",
  reminderInvalid: "Nhắc trước phải là số phút.",
  queryRequired: "Hãy nhập từ khoá tìm kiếm.",
};

export const PRIORITIES = ["high", "medium", "low"] as const;
export type Priority = (typeof PRIORITIES)[number];

const isoDate = z
  .string()
  .refine((v) => !Number.isNaN(Date.parse(v)), MSG.dueInvalid);

const hex = z.string().regex(/^#[0-9A-Fa-f]{6}$/, MSG.color);
const idSchema = z.string().uuid().optional();

export const cardName = z
  .string({ error: MSG.nameRequired })
  .transform((v) => v.trim())
  .pipe(z.string().min(1, MSG.nameRequired).max(200, MSG.nameTooLong));

const nullableText = (max: number, msg: string) => z.string().max(max, msg).nullable().optional();

/** Trường chung của task khi tạo/sửa. */
const cardFields = {
  description: nullableText(2000, MSG.descTooLong),
  priority: z.enum(PRIORITIES, { error: MSG.priority }).optional(),
  dueAt: isoDate.nullable().optional(),
  deadline: isoDate.nullable().optional(),
  startDate: isoDate.nullable().optional(),
  order: z.number().int().optional(),
  coverColor: hex.nullable().optional(),
  coverUrl: z.string().nullable().optional(),
  coverMode: z.string().nullable().optional(),
  completed: z.boolean().nullable().optional(),
  dueComplete: z.boolean().nullable().optional(),
  isTemplate: z.boolean().nullable().optional(),
  reminderMinutes: z.number().int().nullable().optional(),
  repeatFrequency: z.enum(["daily", "weekly", "monthly"]).nullable().optional(),
  repeatInterval: z.number().int().min(1).nullable().optional(),
  recurrence: z.string().nullable().optional(),
  recurrenceDay: z.number().int().nullable().optional(),
  recurrenceWeekday: z.number().int().nullable().optional(),
  labels: z.array(z.object({ id: z.string() }).passthrough()).nullable().optional(),
};

export const createCardSchema = z.object({
  id: idSchema,
  name: cardName,
  listId: z.string().min(1),
  ...cardFields,
});

export const updateCardSchema = z.object({
  name: cardName.optional(),
  listId: z.string().min(1).optional(),
  ...cardFields,
});

export const createBoardSchema = z.object({
  id: idSchema,
  name: z.string().transform((v) => v.trim()).pipe(z.string().min(1, MSG.boardName).max(100, MSG.boardName)),
  backgroundColor: hex.nullable().optional(),
  backgroundUrl: z.string().nullable().optional(),
});
export const updateBoardSchema = createBoardSchema.omit({ id: true }).partial();

/** Nhắc trước: giao diện gửi số phút dạng chuỗi nên nhận cả hai kiểu. */
const minutes = z
  .union([z.number().int(), z.string(), z.null()])
  .transform((v) => (v === null || v === "" ? null : Number(v)))
  .refine((v) => v === null || Number.isInteger(v), MSG.reminderInvalid)
  .optional();

/** PATCH …/cards/:cardId/due (nhóm B). */
export const updateDueSchema = z.object({
  startDate: isoDate.nullable().optional(),
  dueAt: isoDate.nullable().optional(),
  deadline: isoDate.nullable().optional(),
  dueComplete: z.boolean().nullable().optional(),
  reminderMinutes: minutes,
  repeatFrequency: z.enum(["daily", "weekly", "monthly"]).nullable().optional(),
  repeatInterval: z.number().int().min(1).nullable().optional(),
});

const itemName = z
  .string({ error: MSG.itemRequired })
  .transform((v) => v.trim())
  .pipe(z.string().min(1, MSG.itemRequired).max(200, MSG.itemTooLong));

export const createChecklistItemSchema = z.object({
  id: idSchema,
  name: itemName,
  completed: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
});
export const updateChecklistItemSchema = z.object({
  name: itemName.optional(),
  completed: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
});

const labelName = z
  .string({ error: MSG.labelName })
  .transform((v) => v.trim())
  .pipe(z.string().min(1, MSG.labelName).max(50, MSG.labelName));

export const createLabelSchema = z.object({ id: idSchema, name: labelName, color: hex });
export const updateLabelSchema = z.object({ name: labelName.optional(), color: hex.optional() });

export const commentSchema = z.object({
  content: z
    .string({ error: MSG.commentRequired })
    .transform((v) => v.trim())
    .pipe(z.string().min(1, MSG.commentRequired).max(5000, MSG.commentTooLong)),
});

export const createListSchema = z.object({
  id: idSchema,
  name: z.string().transform((v) => v.trim()).pipe(z.string().min(1, MSG.listName).max(100, MSG.listName)),
  order: z.number().int().min(0).optional(),
});
export const updateListSchema = createListSchema.omit({ id: true }).partial();

/** Chạy schema; lỗi → HttpError 400 kèm `fields` theo tên trường. */
export function parse<T extends z.ZodType>(schema: T, body: unknown): z.output<T> {
  const result = schema.safeParse(body ?? {});
  if (result.success) return result.data;
  const fields: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = String(issue.path[0] ?? "body");
    fields[key] ??= issue.message;
  }
  throw new HttpError(400, "Dữ liệu chưa hợp lệ", fields);
}

/** Hạn chót ở quá khứ bị từ chối khi tạo, hoặc khi giá trị hạn thay đổi lúc sửa. */
export function assertDueNotPast(next: string | null | undefined, previous?: string | null) {
  if (!next) return;
  const changed = previous === undefined || new Date(next).getTime() !== (previous ? new Date(previous).getTime() : NaN);
  if (changed && new Date(next).getTime() < Date.now()) {
    throw new HttpError(400, "Dữ liệu chưa hợp lệ", { dueAt: MSG.duePast });
  }
}
