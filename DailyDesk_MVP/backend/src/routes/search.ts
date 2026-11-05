/** Tìm kiếm toàn cục (T055). Mount ở /search. */
import { Hono } from "hono";
import type { AppEnv } from "../app.js";
import { requireUser } from "../auth/middleware.js";
import { search, type SearchType } from "../services/search.js";

export const searchRoutes = new Hono<AppEnv>();
searchRoutes.use("*", requireUser);

const TYPES: SearchType[] = ["board", "list", "card"];

searchRoutes.get("/", async (c) => {
  // `types` nhận cả dạng lặp (types=board&types=card) và dạng ngăn bằng dấu phẩy.
  const raw = c.req.queries("types") ?? [];
  const types = raw
    .flatMap((v) => v.split(","))
    .map((v) => v.trim())
    .filter((v): v is SearchType => (TYPES as string[]).includes(v));

  const limitRaw = Number(c.req.query("limit"));
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(Math.trunc(limitRaw), 100) : 20;

  return c.json(
    await search(c.var.db, c.var.userId, {
      q: c.req.query("q") ?? "",
      types,
      boardId: c.req.query("boardId") || undefined,
      limit,
    }),
  );
});
