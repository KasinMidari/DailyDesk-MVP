/** Bình luận, hoạt động, dòng thời gian (T054). Mount dưới /boards. */
import { Hono } from "hono";
import type { AppEnv } from "../app.js";
import { requireUser } from "../auth/middleware.js";
import * as comments from "../services/comments.js";
import { commentSchema, parse } from "../validation.js";

export const commentRoutes = new Hono<AppEnv>();
commentRoutes.use("*", requireUser);

const body = async (c: { req: { json: () => Promise<unknown> } }) => c.req.json().catch(() => ({}));
const ids = (c: { req: { param: (k: string) => string } }) =>
  [c.req.param("boardId"), c.req.param("cardId")] as const;

commentRoutes.get("/:boardId/cards/:cardId/comments", async (c) =>
  c.json(await comments.listComments(c.var.db, c.var.userId, ...ids(c))),
);

commentRoutes.post("/:boardId/cards/:cardId/comments", async (c) =>
  c.json(
    await comments.createComment(c.var.db, c.var.userId, ...ids(c), parse(commentSchema, await body(c)).content),
    201,
  ),
);

commentRoutes.put("/:boardId/cards/:cardId/comments/:commentId", async (c) =>
  c.json(
    await comments.updateComment(
      c.var.db,
      c.var.userId,
      ...ids(c),
      c.req.param("commentId"),
      parse(commentSchema, await body(c)).content,
    ),
  ),
);

commentRoutes.delete("/:boardId/cards/:cardId/comments/:commentId", async (c) =>
  c.json(await comments.deleteComment(c.var.db, c.var.userId, ...ids(c), c.req.param("commentId"))),
);

commentRoutes.get("/:boardId/cards/:cardId/activities", async (c) =>
  c.json(await comments.listActivities(c.var.db, c.var.userId, ...ids(c))),
);

commentRoutes.get("/:boardId/cards/:cardId/timeline", async (c) =>
  c.json(await comments.listTimeline(c.var.db, c.var.userId, ...ids(c))),
);
