/** Bảng dữ liệu theo specs/001-personal-task-management/data-model.md. */
import { index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
};

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  googleSub: text("google_sub").notNull().unique(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  avatarUrl: text("avatar_url"),
  ...timestamps,
});

export const boards = sqliteTable(
  "boards",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    backgroundColor: text("background_color"),
    backgroundUrl: text("background_url"),
    isDefault: integer("is_default").notNull().default(0),
    ...timestamps,
  },
  (t) => [index("boards_user_idx").on(t.userId)],
);

export const lists = sqliteTable(
  "lists",
  {
    id: text("id").primaryKey(),
    boardId: text("board_id")
      .notNull()
      .references(() => boards.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    order: integer("order").notNull(),
    ...timestamps,
  },
  (t) => [index("lists_board_idx").on(t.boardId)],
);

export const cards = sqliteTable(
  "cards",
  {
    id: text("id").primaryKey(),
    listId: text("list_id")
      .notNull()
      .references(() => lists.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    dueAt: text("due_at"),
    startDate: text("start_date"),
    priority: text("priority").notNull().default("medium"),
    completed: integer("completed").notNull().default(0),
    dueComplete: integer("due_complete").notNull().default(0),
    order: integer("order").notNull(),
    coverColor: text("cover_color"),
    coverUrl: text("cover_url"),
    coverPublicId: text("cover_public_id"),
    coverMode: text("cover_mode"),
    reminderMinutes: integer("reminder_minutes"),
    repeatFrequency: text("repeat_frequency"),
    repeatInterval: integer("repeat_interval"),
    recurrence: text("recurrence"),
    recurrenceDay: integer("recurrence_day"),
    recurrenceWeekday: integer("recurrence_weekday"),
    isTemplate: integer("is_template").notNull().default(0),
    ...timestamps,
  },
  (t) => [index("cards_list_idx").on(t.listId), index("cards_due_idx").on(t.dueAt)],
);

export const labels = sqliteTable("labels", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: text("color").notNull(),
  ...timestamps,
});

export const cardLabels = sqliteTable(
  "card_labels",
  {
    cardId: text("card_id")
      .notNull()
      .references(() => cards.id, { onDelete: "cascade" }),
    labelId: text("label_id")
      .notNull()
      .references(() => labels.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.cardId, t.labelId] })],
);

export const checklistItems = sqliteTable("checklist_items", {
  id: text("id").primaryKey(),
  cardId: text("card_id")
    .notNull()
    .references(() => cards.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  completed: integer("completed").notNull().default(0),
  order: integer("order").notNull(),
  ...timestamps,
});

export const comments = sqliteTable("comments", {
  id: text("id").primaryKey(),
  cardId: text("card_id")
    .notNull()
    .references(() => cards.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  ...timestamps,
});

export const activities = sqliteTable("activities", {
  id: text("id").primaryKey(),
  cardId: text("card_id")
    .notNull()
    .references(() => cards.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  actionType: text("action_type").notNull(),
  description: text("description").notNull(),
  metadata: text("metadata"),
  createdAt: text("created_at").notNull(),
});
