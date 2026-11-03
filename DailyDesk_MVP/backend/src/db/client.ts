import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema.js";

export type Db = ReturnType<typeof createDb>;

/** Câu lệnh tạo bảng, giữ khớp với schema.ts. Chạy an toàn nhiều lần. */
const DDL = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, google_sub TEXT NOT NULL UNIQUE, email TEXT NOT NULL, name TEXT NOT NULL,
    avatar_url TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS boards (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, name TEXT NOT NULL,
    background_color TEXT, background_url TEXT, is_default INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS boards_user_idx ON boards(user_id)`,
  `CREATE TABLE IF NOT EXISTS lists (
    id TEXT PRIMARY KEY, board_id TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE, name TEXT NOT NULL,
    "order" INTEGER NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS lists_board_idx ON lists(board_id)`,
  `CREATE TABLE IF NOT EXISTS cards (
    id TEXT PRIMARY KEY, list_id TEXT NOT NULL REFERENCES lists(id) ON DELETE CASCADE, name TEXT NOT NULL,
    description TEXT, due_at TEXT, start_date TEXT, priority TEXT NOT NULL DEFAULT 'medium',
    completed INTEGER NOT NULL DEFAULT 0, due_complete INTEGER NOT NULL DEFAULT 0, "order" INTEGER NOT NULL,
    cover_color TEXT, cover_url TEXT, cover_public_id TEXT, cover_mode TEXT, reminder_minutes INTEGER,
    repeat_frequency TEXT, repeat_interval INTEGER, recurrence TEXT, recurrence_day INTEGER,
    recurrence_weekday INTEGER, is_template INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS cards_list_idx ON cards(list_id)`,
  `CREATE INDEX IF NOT EXISTS cards_due_idx ON cards(due_at)`,
  `CREATE TABLE IF NOT EXISTS labels (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, name TEXT NOT NULL,
    color TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS card_labels (
    card_id TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    label_id TEXT NOT NULL REFERENCES labels(id) ON DELETE CASCADE, PRIMARY KEY (card_id, label_id))`,
  `CREATE TABLE IF NOT EXISTS checklist_items (
    id TEXT PRIMARY KEY, card_id TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE, name TEXT NOT NULL,
    completed INTEGER NOT NULL DEFAULT 0, "order" INTEGER NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY, card_id TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, content TEXT NOT NULL,
    created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS activities (
    id TEXT PRIMARY KEY, card_id TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, action_type TEXT NOT NULL,
    description TEXT NOT NULL, metadata TEXT, created_at TEXT NOT NULL)`,
];

export function createDb(url: string, authToken?: string) {
  const client = createClient({ url, authToken: authToken || undefined });
  return Object.assign(drizzle(client, { schema }), { client });
}

/** Bật khoá ngoại và tạo bảng nếu chưa có. */
export async function prepareDb(db: Db) {
  await db.client.execute("PRAGMA foreign_keys = ON");
  for (const sql of DDL) await db.client.execute(sql);
}
