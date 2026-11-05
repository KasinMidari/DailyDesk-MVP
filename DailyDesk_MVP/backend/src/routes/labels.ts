/** Nhãn theo người dùng (T053). Mount dưới /users; `:userId` bị bỏ qua. */
import { Hono } from "hono";
import type { AppEnv } from "../app.js";
import { requireUser } from "../auth/middleware.js";
import * as labels from "../services/labels.js";
import { createLabelSchema, parse, updateLabelSchema } from "../validation.js";

export const labelRoutes = new Hono<AppEnv>();
labelRoutes.use("*", requireUser);

const body = async (c: { req: { json: () => Promise<unknown> } }) => c.req.json().catch(() => ({}));

labelRoutes.get("/:userId/labels", async (c) => c.json(await labels.listLabels(c.var.db, c.var.userId)));

labelRoutes.post("/:userId/labels", async (c) =>
  c.json(await labels.createLabel(c.var.db, c.var.userId, parse(createLabelSchema, await body(c))), 201),
);

labelRoutes.put("/:userId/labels/:id", async (c) =>
  c.json(await labels.updateLabel(c.var.db, c.var.userId, c.req.param("id"), parse(updateLabelSchema, await body(c)))),
);

labelRoutes.delete("/:userId/labels/:id", async (c) =>
  c.json(await labels.deleteLabel(c.var.db, c.var.userId, c.req.param("id"))),
);
