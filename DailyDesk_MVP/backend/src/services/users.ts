import { eq } from "drizzle-orm";
import { uuidv7 } from "uuidv7";
import type { Db } from "../db/client.js";
import { boards, lists, users } from "../db/schema.js";
import { nowIso } from "../http.js";

export type Profile = { googleSub: string; email: string; name: string; avatarUrl: string | null };

export function userJson(u: typeof users.$inferSelect) {
  return { id: u.id, name: u.name, email: u.email, picture: u.avatarUrl };
}

/** Tạo hoặc cập nhật user. Lần đầu tạo board mặc định "Việc của tôi" với Todo/Doing/Done. */
export async function upsertUser(db: Db, p: Profile) {
  const now = nowIso();
  const [existing] = await db.select().from(users).where(eq(users.googleSub, p.googleSub));
  if (existing) {
    const [updated] = await db
      .update(users)
      .set({ email: p.email, name: p.name, avatarUrl: p.avatarUrl, updatedAt: now })
      .where(eq(users.id, existing.id))
      .returning();
    return updated!;
  }

  const userId = uuidv7();
  const boardId = uuidv7();
  await db.batch([
    db.insert(users).values({ id: userId, ...p, createdAt: now, updatedAt: now }),
    db.insert(boards).values({
      id: boardId,
      userId,
      name: "Việc của tôi",
      backgroundColor: "#0c66e4",
      isDefault: 1,
      createdAt: now,
      updatedAt: now,
    }),
    db.insert(lists).values(
      ["Todo", "Doing", "Done"].map((name, order) => ({
        id: uuidv7(),
        boardId,
        name,
        order,
        createdAt: now,
        updatedAt: now,
      })),
    ),
  ]);
  const [created] = await db.select().from(users).where(eq(users.id, userId));
  return created!;
}

export async function getUser(db: Db, id: string) {
  const [u] = await db.select().from(users).where(eq(users.id, id));
  return u;
}
