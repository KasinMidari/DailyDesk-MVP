/** Nhóm A của contracts/api.md: boards, lists, cards. */
import { Hono } from "hono";
import type { AppEnv } from "../app.js";
import { requireUser } from "../auth/middleware.js";
import * as boards from "../services/boards.js";
import * as cards from "../services/cards.js";
import * as lists from "../services/lists.js";
import {
  createBoardSchema,
  createCardSchema,
  createListSchema,
  parse,
  updateBoardSchema,
  updateCardSchema,
  updateListSchema,
} from "../validation.js";

export const boardRoutes = new Hono<AppEnv>();
boardRoutes.use("*", requireUser);

const body = async (c: { req: { json: () => Promise<unknown> } }) => c.req.json().catch(() => ({}));

boardRoutes.get("/", async (c) => c.json(await boards.listBoards(c.var.db, c.var.userId)));
boardRoutes.post("/", async (c) =>
  c.json(await boards.createBoard(c.var.db, c.var.userId, parse(createBoardSchema, await body(c))), 201),
);

// Phải đứng trước "/:id" để "cards" không bị hiểu là id board.
boardRoutes.get("/cards/all", async (c) => c.json(await cards.listAllCards(c.var.db, c.var.userId)));

boardRoutes.get("/:id", async (c) => c.json(await boards.getBoard(c.var.db, c.var.userId, c.req.param("id"))));
boardRoutes.put("/:id", async (c) =>
  c.json(await boards.updateBoard(c.var.db, c.var.userId, c.req.param("id"), parse(updateBoardSchema, await body(c)))),
);
boardRoutes.delete("/:id", async (c) => c.json(await boards.deleteBoard(c.var.db, c.var.userId, c.req.param("id"))));

// Lists
boardRoutes.get("/:id/lists", async (c) => c.json(await lists.listLists(c.var.db, c.var.userId, c.req.param("id"))));
boardRoutes.post("/:id/lists", async (c) =>
  c.json(await lists.createList(c.var.db, c.var.userId, c.req.param("id"), parse(createListSchema, await body(c))), 201),
);
boardRoutes.get("/:id/lists/:listId", async (c) =>
  c.json(await lists.getList(c.var.db, c.var.userId, c.req.param("id"), c.req.param("listId"))),
);
boardRoutes.put("/:id/lists/:listId", async (c) =>
  c.json(
    await lists.updateList(
      c.var.db,
      c.var.userId,
      c.req.param("id"),
      c.req.param("listId"),
      parse(updateListSchema, await body(c)),
    ),
  ),
);
boardRoutes.delete("/:id/lists/:listId", async (c) =>
  c.json(await lists.deleteList(c.var.db, c.var.userId, c.req.param("id"), c.req.param("listId"))),
);

// Cards
boardRoutes.get("/:id/cards", async (c) =>
  c.json(await cards.listBoardCards(c.var.db, c.var.userId, c.req.param("id"))),
);
boardRoutes.post("/:id/cards", async (c) =>
  c.json(await cards.createCard(c.var.db, c.var.userId, c.req.param("id"), parse(createCardSchema, await body(c))), 201),
);
boardRoutes.get("/:id/cards/:cardId", async (c) =>
  c.json(await cards.getCard(c.var.db, c.var.userId, c.req.param("id"), c.req.param("cardId"))),
);
boardRoutes.put("/:id/cards/:cardId", async (c) =>
  c.json(
    await cards.updateCard(
      c.var.db,
      c.var.userId,
      c.req.param("id"),
      c.req.param("cardId"),
      parse(updateCardSchema, await body(c)),
    ),
  ),
);
boardRoutes.delete("/:id/cards/:cardId", async (c) =>
  c.json(await cards.deleteCard(c.var.db, c.var.userId, c.req.param("id"), c.req.param("cardId"))),
);
