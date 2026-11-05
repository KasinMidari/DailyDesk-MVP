/** Ghi nhật ký hoạt động của task (data-model.md: activities). */
import { uuidv7 } from "uuidv7";
import type { Db } from "../db/client.js";
import { activities } from "../db/schema.js";
import { nowIso } from "../http.js";

export async function logActivity(
  db: Db,
  cardId: string,
  userId: string,
  actionType: string,
  description: string,
  metadata?: unknown,
) {
  await db.insert(activities).values({
    id: uuidv7(),
    cardId,
    userId,
    actionType,
    description,
    metadata: metadata === undefined ? null : JSON.stringify(metadata),
    createdAt: nowIso(),
  });
}
