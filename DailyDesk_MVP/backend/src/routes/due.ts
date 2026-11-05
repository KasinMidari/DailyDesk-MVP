/** Hạn hoàn thành của task (T051, contracts/api.md nhóm B). */
import { Hono } from "hono";
import type { AppEnv } from "../app.js";
import { requireUser } from "../auth/middleware.js";
import * as cards from "../services/cards.js";
import { parse, updateDueSchema } from "../validation.js";

export const dueRoutes = new Hono<AppEnv>();
dueRoutes.use("*", requireUser);

dueRoutes.patch("/:boardId/cards/:cardId/due", async (c) =>
  c.json(
    await cards.updateDue(
      c.var.db,
      c.var.userId,
      c.req.param("boardId"),
      c.req.param("cardId"),
      parse(updateDueSchema, await c.req.json().catch(() => ({}))),
    ),
  ),
);

dueRoutes.delete("/:boardId/cards/:cardId/due", async (c) =>
  c.json(await cards.clearDue(c.var.db, c.var.userId, c.req.param("boardId"), c.req.param("cardId"))),
);
