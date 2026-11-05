/** Việc cần làm trong task (T052). Mount dưới /boards. */
import { Hono } from "hono";
import type { AppEnv } from "../app.js";
import { requireUser } from "../auth/middleware.js";
import * as checklist from "../services/checklist.js";
import { createChecklistItemSchema, parse, updateChecklistItemSchema } from "../validation.js";

export const checklistRoutes = new Hono<AppEnv>();
checklistRoutes.use("*", requireUser);

const body = async (c: { req: { json: () => Promise<unknown> } }) => c.req.json().catch(() => ({}));
const base = "/:boardId/cards/:cardId/checklist-items";
const ids = (c: { req: { param: (k: string) => string } }) =>
  [c.req.param("boardId"), c.req.param("cardId")] as const;

checklistRoutes.get(base, async (c) => c.json(await checklist.listItems(c.var.db, c.var.userId, ...ids(c))));

checklistRoutes.post(base, async (c) =>
  c.json(
    await checklist.createItem(c.var.db, c.var.userId, ...ids(c), parse(createChecklistItemSchema, await body(c))),
    201,
  ),
);

checklistRoutes.get(`${base}/:id`, async (c) =>
  c.json(await checklist.getItem(c.var.db, c.var.userId, ...ids(c), c.req.param("id"))),
);

checklistRoutes.put(`${base}/:id`, async (c) =>
  c.json(
    await checklist.updateItem(
      c.var.db,
      c.var.userId,
      ...ids(c),
      c.req.param("id"),
      parse(updateChecklistItemSchema, await body(c)),
    ),
  ),
);

checklistRoutes.delete(`${base}/:id`, async (c) =>
  c.json(await checklist.deleteItem(c.var.db, c.var.userId, ...ids(c), c.req.param("id"))),
);
